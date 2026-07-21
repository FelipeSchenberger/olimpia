import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SlotsService } from '../../services/slots.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class Admin implements OnInit {
  private slotsService = inject(SlotsService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  date: string = new Date().toISOString().split('T')[0];
  slots: any[] = [];
  isLoading: boolean = false;
  courtId: number = 1;

  // Modal State
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
    // If already authenticated (session restored), load slots
    if (this.isAuthenticated) {
      this.loadSlots();
    }
  }

  async login() {
    if (!this.emailInput || !this.passwordInput) {
      this.loginError = 'Ingresá email y contraseña';
      return;
    }
    this.loginLoading = true;
    this.loginError = '';

    const { error } = await this.authService.signIn(this.emailInput, this.passwordInput);

    this.loginLoading = false;
    if (error) {
      this.loginError = 'Credenciales inválidas';
    } else {
      this.loadSlots();
    }
    this.cdr.detectChanges();
  }

  async logout() {
    await this.authService.signOut();
    this.slots = [];
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

  private updateStatus(status: string, clientName: string | null, type: string) {
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
}
