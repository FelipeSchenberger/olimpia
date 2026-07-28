import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-payment-status',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './payment-status.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './payment-status.component.css'
})
export class PaymentStatusComponent implements OnInit {
  status: 'success' | 'failure' | 'pending' = 'pending';
  paymentId: string | null = null;
  externalReference: string | null = null;

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    const path = this.route.snapshot.url[0]?.path;
    if (path === 'success' || path === 'failure' || path === 'pending') {
      this.status = path;
    }
    
    this.route.queryParams.subscribe(params => {
      this.paymentId = params['payment_id'] || null;
      this.externalReference = params['external_reference'] || null;
    });
  }
}
