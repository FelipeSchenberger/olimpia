import {
  Component,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsService, PromoPriceItem } from '../../services/settings.service';

export interface DisplayPrice {
  title: string;
  subtitle: string;
  price: string;
}

@Component({
  selector: 'app-prices',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './prices.html',
  styleUrl: './prices.css',
  changeDetection: ChangeDetectionStrategy.Default,
})
export class PricesComponent implements OnInit {
  private settingsService = inject(SettingsService);

  // Default fallback prices matching production
  readonly defaultPrices: DisplayPrice[] = [
    {
      title: 'Lunes a Viernes',
      subtitle: 'Hasta 17hs',
      price: '$ 42.000',
    },
    {
      title: 'Lunes a Viernes',
      subtitle: 'Desde 18hs',
      price: '$ 45.000',
    },
    {
      title: 'Sábados y Domingos',
      subtitle: 'Hasta 17hs',
      price: '$ 39.000',
    },
    {
      title: 'Sábados y Domingos',
      subtitle: 'Desde 18hs',
      price: '$ 42.000',
    },
    {
      title: 'Cumpleaños',
      subtitle: '2 Hs de Cancha',
      price: '$ 95.000',
    },
  ];

  readonly currentYear = new Date().getFullYear();
  displayPrices = signal<DisplayPrice[]>(this.defaultPrices);


  ngOnInit(): void {
    this.settingsService.getPromoPrices().subscribe({
      next: (data: PromoPriceItem[]) => {
        if (data && data.length > 0) {
          this.displayPrices.set(data);
        }
      },
      error: (err) => {
        console.warn('Could not fetch dynamic promo prices, using defaults', err);
      },
    });
  }
}

