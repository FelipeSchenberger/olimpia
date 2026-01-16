import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms'; 
import { SlotsService } from '../../services/slots.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class Admin implements OnInit {
  date: string = new Date().toISOString().split('T')[0];
  slots: any[] = [];
  isAuthenticated = false;
  
  // States
  isLoading: boolean = false;
  courtId: number = 1;

  // Modal State
  selectedSlot: any = null;
  clientNameInput: string = '';
  modalError: string = '';

  // Login props
  accessCode: string = '';
  loginError: boolean = false;

  constructor(
      private slotsService: SlotsService, 
      private router: Router,
      private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {}

  login() {
      if (this.accessCode === 'olimpia2026') {
          this.isAuthenticated = true;
          this.loginError = false;
          this.loadSlots();
      } else {
          this.loginError = true;
      }
  }

  setCourt(id: number) {
      if (this.courtId === id) return;
      this.courtId = id;
      this.slots = []; // Clear current view
      this.loadSlots();
  }

  loadSlots() {
      this.isLoading = true;
      this.slotsService.getSlots(this.date, this.courtId).subscribe({
          next: (data) => {
              this.slots = data;
              this.isLoading = false;
              this.cdr.detectChanges(); // Manually trigger update
          },
          error: (err) => {
              console.error(err);
              this.isLoading = false;
              this.cdr.detectChanges(); // Check on error too
          }
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
          if (!confirm('¿Seguro que quieres liberar este turno?')) return;
          this.updateStatus('AVAILABLE', null, 'NORMAL');
          return;
      }

      if (!this.clientNameInput.trim()) {
          this.modalError = 'Debes ingresar un nombre';
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

  private updateStatus(status: string, clientName: string | null, type: string) {
       this.isLoading = true;
       this.slotsService.updateStatus(this.selectedSlot.id, status, clientName || undefined, type)
           .subscribe(() => {
               this.closeModal();
               this.loadSlots(); 
           });
  }

  private createFixedAndSave() {
      const slot = this.selectedSlot;
      
      // Cálculo robusto del día
      // slot.date viene como ISO string (ej: 2026-01-15T00:00:00.000Z)
      const isoDate = new Date(slot.date).toISOString(); 
      const yyyymmdd = isoDate.split('T')[0]; // "2026-01-15"
      
      const dateObj = new Date(yyyymmdd + 'T12:00:00'); // Mediodía local ficticio
      let dayOfWeek = dateObj.getDay();
      if (dayOfWeek === 0) dayOfWeek = 7;

      console.log(`[Frontend] Slot Date: ${slot.date} -> ${yyyymmdd} -> Day ${dayOfWeek}`);
      // alert(`Debug: Creating fixed for Day ${dayOfWeek}`);

      const fixedData = {
          dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          clientName: this.clientNameInput,
          startDate: new Date().toISOString(),
          courtId: this.courtId
      };
      
      this.isLoading = true;
      this.slotsService.createFixedSlot(fixedData).subscribe(() => {
          this.closeModal();
          this.loadSlots();
          // Solo notificar éxito
          // alert('Turno fijo creado y aplicado a futuros!'); 
      });
  }
}
