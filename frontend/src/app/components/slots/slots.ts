import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Turno {
  id: number;
  day: string;
  date: Date;
  time: string;
  price: number;
}

@Component({
  selector: 'app-slots',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './slots.html',
  styleUrl: './slots.css',
})
export class Slots {
  turnos: Turno[] = [
    { id: 1, day: 'Hoy', date: new Date(), time: '18:00', price: 15000 },
    { id: 2, day: 'Hoy', date: new Date(), time: '19:00', price: 15000 },
    { id: 3, day: 'Hoy', date: new Date(), time: '21:00', price: 18000 },
    { id: 4, day: 'Mañana', date: new Date(new Date().setDate(new Date().getDate() + 1)), time: '20:00', price: 18000 },
    { id: 5, day: 'Mañana', date: new Date(new Date().setDate(new Date().getDate() + 1)), time: '22:00', price: 18000 },
  ];

  reservar(turno: Turno) {
    const phone = '5491112345678'; // Replace with real number if provided, otherwise placeholder
    const dateStr = turno.date.toLocaleDateString('es-AR', { day: 'numeric', month: 'long' });
    const message = `Hola, quiero reservar el turno de las ${turno.time} del día ${turno.day} (${dateStr}) en Olimpia.`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  }
}
