import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('SettingsController (e2e)', () => {
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

  it('/settings/deposit-amount (GET) should be public and return a number', async () => {
    const response = await request(app.getHttpServer())
      .get('/settings/deposit-amount')
      .expect(200);
    
    expect(typeof response.text).toBe('string');
    expect(Number.isNaN(Number(response.text))).toBe(false);
  });

  it('/settings/deposit-amount (PUT) should reject without token', async () => {
    await request(app.getHttpServer())
      .put('/settings/deposit-amount')
      .send({ amount: 1000 })
      .expect(401);
  });

  it('/settings/deposit-amount (PUT) should reject with invalid token', async () => {
    await request(app.getHttpServer())
      .put('/settings/deposit-amount')
      .set('Authorization', 'Bearer invalid_token')
      .send({ amount: 1000 })
      .expect(401);
  });
});
