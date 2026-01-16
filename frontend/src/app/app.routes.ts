import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { Admin } from './components/admin/admin';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'admin', component: Admin },
  // Redirect unknown paths to home
  { path: '**', redirectTo: '' }
];
