import { Component } from '@angular/core';

@Component({
  selector: 'app-hero',
  imports: [],
  templateUrl: './hero.html',
  styleUrl: './hero.css',
})
export class Hero {
  scrollToSlots() {
    const target = document.getElementById('turnos');
    if (!target) return;

    const targetPosition = target.getBoundingClientRect().top + window.scrollY;
    const startPosition = window.scrollY;
    const distance = targetPosition - startPosition;
    const duration = 800; // ms
    let start: number | null = null;

    function animation(currentTime: number) {
      if (start === null) start = currentTime;
      const timeElapsed = currentTime - start;
      const run = ease(timeElapsed, startPosition, distance, duration);
      window.scrollTo(0, run);
      if (timeElapsed < duration) requestAnimationFrame(animation);
    }

    // Easing function: Ease Out Cubic
    function ease(t: number, b: number, c: number, d: number) {
      t /= d;
      t--;
      return c * (t * t * t + 1) + b;
    }

    requestAnimationFrame(animation);
  }
}
