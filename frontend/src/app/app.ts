import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.Default,
  styleUrl: './app.css'
})
export class App {
  readonly currentYear = new Date().getFullYear();
}

