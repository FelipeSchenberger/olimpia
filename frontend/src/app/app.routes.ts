import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { Admin } from './components/admin/admin';
import { PaymentStatusComponent } from './pages/payment-status/payment-status.component';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'admin', component: Admin },
  { path: 'success', component: PaymentStatusComponent },
  { path: 'failure', component: PaymentStatusComponent },
  { path: 'pending', component: PaymentStatusComponent },
  // Redirect unknown paths to home
  { path: '**', redirectTo: '' }
];
