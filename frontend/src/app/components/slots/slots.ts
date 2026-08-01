import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SlotsService } from '../../services/slots.service';
import { BookingsService } from '../../services/bookings.service';

export interface PublicSlot {
  startTime: string;
  status: string;
  expiresAt?: string | null;
}

@Component({
  selector: 'app-slots',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './slots.html',
  changeDetection: ChangeDetectionStrategy.Default,
  styleUrl: './slots.css',
})
export class Slots implements OnInit {
  date: string = new Date().toISOString().split('T')[0];
  slots: PublicSlot[] = [];
  isLoading = false;
  
  private countdownInterval: any;
  countdowns: Map<string, string> = new Map();
  
  // Teléfono del complejo para WhatsApp
  private complexPhone = '+5493442472109'; 



  ngOnInit() {
    this.loadSlots();
    this.countdownInterval = setInterval(() => {
      this.updateCountdowns();
    }, 1000);
  }

  ngOnDestroy() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  updateCountdowns() {
    let needsReload = false;
    let updated = false;
    const now = new Date().getTime();

    for (const slot of this.slots) {
      if (slot.status === 'PENDING' && slot.expiresAt) {
        const expiresTime = new Date(slot.expiresAt).getTime();
        const diff = expiresTime - now;

        if (diff <= 0) {
          this.countdowns.delete(slot.startTime);
          // Marcar como AVAILABLE localmente para evitar un loop de recargas
          // mientras el cron del backend limpia el turno (hasta 60s de delay)
          slot.status = 'AVAILABLE';
          slot.expiresAt = null;
          updated = true;
        } else {
          const m = Math.floor(diff / 60000);
          const s = Math.floor((diff % 60000) / 1000);
          this.countdowns.set(slot.startTime, `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
          updated = true;
        }
      }
    }
    
    if (needsReload) {
      this.loadSlots();
    } else if (updated) {
      this.cdr.detectChanges();
    }
  }

  getCountdown(slot: PublicSlot): string | null {
    return this.countdowns.get(slot.startTime) || null;
  }

  onDateChange() {
    this.loadSlots();
  }

  loadSlots() {
    this.isLoading = true;
    this.slots = []; // Clear current slots to trigger animation on re-render
    this.cdr.detectChanges(); 

    this.slotsService.getPublicSlots(this.date).subscribe({
      next: (data) => {
        // Use setTimeout to push the update to the next macrotask, 
        // ensuring the browser has painted the loading state really well
        // and Angular is ready for a new cycle.
        setTimeout(() => {
          this.slots = this.processPastSlots(data);
          this.isLoading = false;
          this.cdr.detectChanges(); 
        }, 100);
      },
      error: (err) => {
        setTimeout(() => {
          console.error(err);
          this.isLoading = false;
          this.cdr.detectChanges();
        }, 100);
      }
    });
  }

  private processPastSlots(slots: PublicSlot[]): PublicSlot[] {
      const now = new Date();
      // "Hoy" según la fecha seleccionada en el input (YYYY-MM-DD)
      // Ojo: new Date('2026-01-15') da UTC. new Date('2026-01-15T00:00:00') da local.
      // Usaremos T12:00:00 para la base del día seleccionado para evitar saltos.
      const viewDateStr = this.date; 
      
      return slots.map(slot => {
          if (slot.status !== 'AVAILABLE') return slot;

          // Construir fecha real del slot
          const [hours, minutes] = slot.startTime.split(':').map(Number);
          
          // Crear fecha base desde el string seleccionado
          // Truco: split y crear con constructor local (año, mes-1, dia)
          const [y, m, d] = viewDateStr.split('-').map(Number);
          const slotDate = new Date(y, m - 1, d, hours, minutes);

          // Si es madrugada (00, 01), pertenece al día calendario siguiente
          if (hours < 9) {
              slotDate.setDate(slotDate.getDate() + 1);
          }

          // Si ya pasó, marcar como ocupado visualmente
          if (slotDate < now) {
              return { ...slot, status: 'BOOKED' };
          }

          return slot;
      });
  }

  previousDay() {
    const currentDate = new Date(this.date + 'T12:00:00');
    currentDate.setDate(currentDate.getDate() - 1);
    this.date = currentDate.toISOString().split('T')[0];
    this.loadSlots();
  }

  nextDay() {
    const currentDate = new Date(this.date + 'T12:00:00');
    currentDate.setDate(currentDate.getDate() + 1);
    this.date = currentDate.toISOString().split('T')[0];
    this.loadSlots();
  }

  // Calendar Logic
  showCalendar = false;
  calendarMonth = new Date();
  calendarDays: { day: number; date: Date; isCurrentMonth: boolean; isToday: boolean; isSelected: boolean }[] = [];
  weekDays = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'];

  toggleCalendar() {
    this.showCalendar = !this.showCalendar;
    if (this.showCalendar) {
      this.generateCalendar();
    }
  }

  generateCalendar() {
    const year = this.calendarMonth.getFullYear();
    const month = this.calendarMonth.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Day of week of the first day (0-6)
    const startingDay = firstDay.getDay();
    
    const days = [];
    
    // Previous month days to fill grid
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = 0; i < startingDay; i++) {
      days.unshift({
        day: prevMonthLastDay - i,
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
        isToday: false,
        isSelected: false
      });
    }

    // Current slots date for comparison
    const selectedDate = new Date(this.date + 'T12:00:00');
    const today = new Date();
    today.setHours(0,0,0,0);

    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      days.push({
        day: i,
        date: date,
        isCurrentMonth: true,
        isToday: date.getTime() === today.getTime(),
        isSelected: date.getDate() === selectedDate.getDate() && date.getMonth() === selectedDate.getMonth() && date.getFullYear() === selectedDate.getFullYear()
      });
    }
    
    this.calendarDays = days;
  }

  prevMonth() {
    this.calendarMonth.setMonth(this.calendarMonth.getMonth() - 1);
    this.calendarMonth = new Date(this.calendarMonth); // Trigger change
    this.generateCalendar();
  }

  nextMonth() {
    this.calendarMonth.setMonth(this.calendarMonth.getMonth() + 1);
    this.calendarMonth = new Date(this.calendarMonth);
    this.generateCalendar();
  }

  selectCalendarDate(day: any) {
    // Avoid selecting past days? Optionally. For now let's allow it but maybe style them differently.
    // Ideally we update this.date
    const offsetDate = new Date(day.date);
    // Fix timezone offset for ISO string
    const localISO = new Date(offsetDate.getTime() - (offsetDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    
    this.date = localISO;
    this.showCalendar = false;
    this.loadSlots();
  }

  get calendarTitle(): string {
    return this.calendarMonth.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
  }

  getFormattedDate(): string {
    const [y, m, d] = this.date.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString('es-AR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
  }

  isAvailable(status: string): boolean {
    return status === 'AVAILABLE';
  }

  showBookingModal = false;
  selectedSlot: PublicSlot | null = null;
  clientName = '';
  clientPhone = '';
  isSubmitting = false;
  bookingError = '';

  constructor(
    private slotsService: SlotsService,
    private bookingsService: BookingsService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  reservar(slot: PublicSlot) {
    if (!this.isAvailable(slot.status)) return;
    this.selectedSlot = slot;
    this.showBookingModal = true;
    this.bookingError = '';
  }

  closeBookingModal() {
    this.showBookingModal = false;
    this.selectedSlot = null;
    this.clientName = '';
    this.clientPhone = '';
    this.bookingError = '';
  }

  confirmBooking() {
    if (!this.selectedSlot || !this.clientName || !this.clientPhone) return;

    this.isSubmitting = true;
    this.bookingError = '';

    this.bookingsService.createIntent({
      date: this.date,
      startTime: this.selectedSlot.startTime,
      clientName: this.clientName,
      clientPhone: this.clientPhone
    }).subscribe({
      next: (response) => {
        // Redirigir a Mercado Pago
        window.location.href = response.initPoint;
      },
      error: (err) => {
        this.isSubmitting = false;
        this.bookingError = err.error?.message || 'Error al iniciar reserva. El turno podría ya estar ocupado.';
        this.cdr.detectChanges();
        // Recargar slots por si alguien lo ocupó
        this.loadSlots();
      }
    });
  }
}
