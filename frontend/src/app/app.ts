import { Component } from '@angular/core';
import { Hero } from './components/hero/hero';
import { Slots } from './components/slots/slots';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [Hero, Slots],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {}
