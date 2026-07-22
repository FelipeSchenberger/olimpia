import { TestBed } from '@angular/core/testing';

import { Slots } from './slots';

describe('[Fase 1] Slots', () => {
  let service: Slots;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Slots);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
