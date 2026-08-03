import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-info',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './info.html',
  styleUrl: './info.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InfoComponent {}
