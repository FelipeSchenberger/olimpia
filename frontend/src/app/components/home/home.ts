import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Hero } from '../hero/hero';
import { Slots } from '../slots/slots';
import { PricesComponent } from '../prices/prices';
import { InfoComponent } from '../info/info';

@Component({
  selector: 'app-home',
  imports: [Hero, Slots, PricesComponent, InfoComponent],
  templateUrl: './home.html',
  changeDetection: ChangeDetectionStrategy.Default,
  styleUrl: './home.css',
})
export class Home {}
