import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Hero } from '../hero/hero';
import { Slots } from '../slots/slots';

@Component({
  selector: 'app-home',
  imports: [Hero, Slots],
  templateUrl: './home.html',
  changeDetection: ChangeDetectionStrategy.Default,
  styleUrl: './home.css',
})
export class Home {

}
