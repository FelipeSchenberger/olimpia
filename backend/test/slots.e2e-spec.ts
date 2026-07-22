import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('[Fase 1] SlotsController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/slots (GET) should return an array of slots for a valid date', async () => {
    const today = new Date().toISOString().split('T')[0];
    const response = await request(app.getHttpServer())
      .get(`/slots?date=${today}&courtId=1`)
      .expect(200);
    
    expect(Array.isArray(response.body)).toBe(true);
    if (response.body.length > 0) {
      expect(response.body[0]).toHaveProperty('startTime');
      expect(response.body[0]).toHaveProperty('status');
    }
  });

  it('/slots/update (PUT) should reject without token', async () => {
    await request(app.getHttpServer())
      .put('/slots/update')
      .send({ id: 9999, status: 'BOOKED', type: 'NORMAL' })
      .expect(401);
  });

  it('/slots/fixed (POST) should reject without token', async () => {
    await request(app.getHttpServer())
      .post('/slots/fixed')
      .send({ dayOfWeek: 1, startTime: '10:00', endTime: '11:00', courtId: 1, startDate: new Date().toISOString() })
      .expect(401);
  });
});
