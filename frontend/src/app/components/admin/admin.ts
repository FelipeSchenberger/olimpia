import { Component, OnInit, ChangeDetectorRef, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SlotsService } from '../../services/slots.service';
import { AuthService } from '../../services/auth.service';
import { PricingService, SlotPricing } from '../../services/pricing.service';
import { SettingsService, PromoPriceItem } from '../../services/settings.service';
import {
  AdminBookingsService,
  Booking,
} from '../../services/admin-bookings.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.html',
  changeDetection: ChangeDetectionStrategy.Default,
  styleUrl: './admin.css',
})
export class Admin implements OnInit {
  private slotsService = inject(SlotsService);
  private authService = inject(AuthService);
  private pricingService = inject(PricingService);
  private adminBookingsService = inject(AdminBookingsService);
  private settingsService = inject(SettingsService);
  private cdr = inject(ChangeDetectorRef);

  readonly currentYear = new Date().getFullYear();

  // Navigation
  activeTab: 'slots' | 'bookings' | 'payments' | 'prices' | 'promos' = 'slots';



  // Slots state
  date: string = new Date().toISOString().split('T')[0];
  slots: any[] = [];
  isLoading: boolean = false;
  courtId: number = 1;

  // Bookings state
  bookings: Booking[] = [];
  isLoadingBookings: boolean = false;
  bookingsStatusFilter: string = '';
  bookingsDateFilter: string = '';
  bookingsError: string = '';

  // Prices state
  prices: SlotPricing[] = [];
  isLoadingPrices: boolean = false;
  isSavingPrices: boolean = false;
  pricesSaveSuccess: boolean = false;
  pricesSaveError: string = '';

  // Promo prices state
  promoPrices: PromoPriceItem[] = [];
  isLoadingPromos: boolean = false;
  isSavingPromos: boolean = false;
  promosSaveSuccess: boolean = false;
  promosSaveError: string = '';


  // Payments history
  payments: Booking[] = [];
  isLoadingPayments: boolean = false;

  // Modal state
  selectedSlot: any = null;
  clientNameInput: string = '';
  modalError: string = '';

  // Login props
  emailInput: string = '';
  passwordInput: string = '';
  loginError: string = '';
  loginLoading: boolean = false;

  get isAuthenticated(): boolean {
    return !!this.authService.currentUser();
  }

  ngOnInit() {
    if (this.isAuthenticated) {
      this.loadSlots();
      this.loadPrices();
    }
  }

  async login() {
    if (!this.emailInput || !this.passwordInput) {
      this.loginError = 'Ingresá email y contraseña';
      return;
    }
    this.loginLoading = true;
    this.loginError = '';

    const { error } = await this.authService.signIn(
      this.emailInput,
      this.passwordInput,
    );

    this.loginLoading = false;
    if (error) {
      this.loginError = 'Credenciales inválidas';
    } else {
      this.loadSlots();
      this.loadPrices();
    }
    this.cdr.detectChanges();
  }

  async logout() {
    await this.authService.signOut();
    this.slots = [];
    this.bookings = [];
    this.cdr.detectChanges();
  }

  setTab(tab: 'slots' | 'bookings' | 'payments' | 'prices' | 'promos') {
    if (this.activeTab === tab) return;
    this.activeTab = tab;
    if (tab === 'bookings' && this.bookings.length === 0) {
      this.loadBookings();
    } else if (tab === 'payments' && this.payments.length === 0) {
      this.loadPaymentHistory();
    } else if (tab === 'prices' && this.prices.length === 0) {
      this.loadPrices();
    } else if (tab === 'promos' && this.promoPrices.length === 0) {
      this.loadPromoPrices();
    }
    this.cdr.detectChanges();
  }


  setCourt(id: number) {
    if (this.courtId === id) return;
    this.courtId = id;
    this.slots = [];
    this.loadSlots();
  }

  loadSlots() {
    this.isLoading = true;
    this.slotsService.getSlots(this.date, this.courtId).subscribe({
      next: (data) => {
        this.slots = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  loadPrices() {
    this.isLoadingPrices = true;
    this.pricingService.getPrices().subscribe({
      next: (data) => {
        // Pre-fill default hours if empty
        if (data.length === 0) {
          const hours = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '00:00', '01:00'];
          this.prices = hours.map(h => ({ startTime: h, price: 0 }));
        } else {
          this.prices = data;
        }
        this.isLoadingPrices = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading prices', err);
        this.isLoadingPrices = false;
        this.cdr.detectChanges();
      },
    });
  }

  savePrices() {
    this.pricesSaveError = '';
    this.pricesSaveSuccess = false;
    this.isSavingPrices = true;
    
    // Sanitize payload to send only startTime and numeric price
    const payload = this.prices.map((p) => ({
      startTime: p.startTime,
      price: Number(p.price) || 0,
    }));

    this.pricingService.updatePrices(payload).subscribe({
      next: () => {
        this.isSavingPrices = false;
        this.pricesSaveSuccess = true;
        this.cdr.detectChanges();
        
        setTimeout(() => {
          this.pricesSaveSuccess = false;
          this.cdr.detectChanges();
        }, 3000);
      },
      error: (err) => {
        console.error('Error saving prices', err);
        this.pricesSaveError = 'Ocurrió un error al guardar los precios';
        this.isSavingPrices = false;
        this.cdr.detectChanges();
      },
    });
  }

  loadPromoPrices() {
    this.isLoadingPromos = true;
    this.promosSaveError = '';
    this.settingsService.getPromoPrices().subscribe({
      next: (data) => {
        this.promoPrices = data || [];
        this.isLoadingPromos = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading promo prices', err);
        this.isLoadingPromos = false;
        this.cdr.detectChanges();
      },
    });
  }

  savePromoPrices() {
    this.promosSaveError = '';
    this.promosSaveSuccess = false;
    this.isSavingPromos = true;

    this.settingsService.updatePromoPrices(this.promoPrices).subscribe({
      next: () => {
        this.isSavingPromos = false;
        this.promosSaveSuccess = true;
        this.cdr.detectChanges();

        setTimeout(() => {
          this.promosSaveSuccess = false;
          this.cdr.detectChanges();
        }, 3000);
      },
      error: (err) => {
        console.error('Error saving promo prices', err);
        this.promosSaveError =
          'Ocurrió un error al guardar las tarifas promocionales';
        this.isSavingPromos = false;
        this.cdr.detectChanges();
      },
    });
  }

  addPromoPrice() {
    this.promoPrices.push({
      title: 'Nueva Categoría',
      subtitle: 'Descripción',
      price: '$ 0',
    });
    this.cdr.detectChanges();
  }

  removePromoPrice(index: number) {
    this.promoPrices.splice(index, 1);
    this.cdr.detectChanges();
  }

  loadPaymentHistory() {

    this.isLoadingPayments = true;
    this.adminBookingsService.getPaymentHistory().subscribe({
      next: (data) => {
        this.payments = data;
        this.isLoadingPayments = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading payments', err);
        this.isLoadingPayments = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadBookings() {
    this.isLoadingBookings = true;
    this.bookingsError = '';
    this.adminBookingsService
      .getBookings({
        status: this.bookingsStatusFilter || undefined,
        date: this.bookingsDateFilter || undefined,
      })
      .subscribe({
        next: (data) => {
          this.bookings = data;
          this.isLoadingBookings = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error loading bookings', err);
          this.bookingsError = 'Error al cargar las reservas';
          this.isLoadingBookings = false;
          this.cdr.detectChanges();
        },
      });
  }

  confirmBooking(booking: Booking) {
    if (
      !confirm(
        `¿Confirmar manualmente el turno de ${booking.clientName ?? 'cliente'} (${booking.startTime})?`,
      )
    )
      return;

    this.adminBookingsService.confirmBooking(booking.id).subscribe({
      next: () => {
        this.loadBookings();
      },
      error: (err) => {
        console.error('Error confirming booking', err);
        alert('No se pudo confirmar el turno');
      },
    });
  }

  releaseHold(booking: Booking) {
    if (
      !confirm(
        `¿Seguro que querés liberar este turno retenido (${booking.startTime})?`,
      )
    )
      return;

    this.adminBookingsService.releaseHold(booking.id).subscribe({
      next: () => {
        this.loadBookings();
      },
      error: (err) => {
        console.error('Error releasing hold', err);
        alert('No se pudo liberar el turno (puede que ya esté liberado, o no exista el endpoint aún).');
      },
    });
  }

  openModal(slot: any) {
    this.selectedSlot = slot;
    this.clientNameInput = slot.clientName || '';
    this.modalError = '';
  }

  closeModal() {
    this.selectedSlot = null;
  }

  saveSlot(type: string) {
    if (!this.selectedSlot) return;

    if (type === 'AVAILABLE') {
      if (!confirm('¿Seguro que querés liberar este turno?')) return;
      this.updateStatus('AVAILABLE', null, 'NORMAL');
      return;
    }

    if (!this.clientNameInput.trim()) {
      this.modalError = 'Debés ingresar un nombre';
      return;
    }

    if (type === 'FIXED') {
      this.createFixedAndSave();
    } else if (type === 'BIRTHDAY') {
      this.updateStatus('BOOKED', this.clientNameInput, 'BIRTHDAY');
    } else {
      this.updateStatus('BOOKED', this.clientNameInput, 'NORMAL');
    }
  }

  private updateStatus(
    status: string,
    clientName: string | null,
    type: string,
  ) {
    this.isLoading = true;
    this.slotsService
      .updateStatus(this.selectedSlot.id, status, clientName || undefined, type)
      .subscribe(() => {
        this.closeModal();
        this.loadSlots();
      });
  }

  private createFixedAndSave() {
    const slot = this.selectedSlot;
    const isoDate = new Date(slot.date).toISOString();
    const yyyymmdd = isoDate.split('T')[0];
    const dateObj = new Date(yyyymmdd + 'T12:00:00');
    let dayOfWeek = dateObj.getDay();
    if (dayOfWeek === 0) dayOfWeek = 7;

    const fixedData = {
      dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      clientName: this.clientNameInput,
      startDate: new Date().toISOString(),
      courtId: this.courtId,
    };

    this.isLoading = true;
    this.slotsService.createFixedSlot(fixedData).subscribe(() => {
      this.closeModal();
      this.loadSlots();
    });
  }

  deleteFixedForever() {
    if (!this.selectedSlot) return;

    const slot = this.selectedSlot;
    if (
      !confirm(
        `¿Seguro que querés ELIMINAR DEFINITIVAMENTE el turno fijo de ${slot.clientName || 'este cliente'} (${slot.startTime})? Se liberará este horario para todas las semanas futuras.`,
      )
    )
      return;

    const isoDate = new Date(slot.date).toISOString();
    const yyyymmdd = isoDate.split('T')[0];
    const dateObj = new Date(yyyymmdd + 'T12:00:00');
    let dayOfWeek = dateObj.getDay();
    if (dayOfWeek === 0) dayOfWeek = 7;

    this.isLoading = true;
    this.slotsService
      .deleteFixedSlot(this.courtId, dayOfWeek, slot.startTime)
      .subscribe({
        next: () => {
          this.closeModal();
          this.loadSlots();
        },
        error: (err) => {
          console.error('Error deleting fixed slot', err);
          this.modalError = 'Error al eliminar el turno fijo';
          this.isLoading = false;
          this.cdr.detectChanges();
        },
      });
  }
}
