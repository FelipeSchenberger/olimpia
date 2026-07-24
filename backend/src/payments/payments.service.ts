import { Injectable } from '@nestjs/common';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class PaymentsService {
  private client: MercadoPagoConfig;

  constructor(private readonly settingsService: SettingsService) {
    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
      console.warn('MP_ACCESS_TOKEN is not defined in environment variables');
    }
    this.client = new MercadoPagoConfig({
      accessToken: accessToken || 'TEST-dummy-token',
    });
  }

  async createPreference(
    appointmentId: number,
    date: string,
    startTime: string,
  ) {
    const depositAmount = await this.settingsService.getDepositAmount();

    if (depositAmount <= 0) {
      throw new Error('El monto de la seña debe ser mayor a 0');
    }

    if (
      !process.env.MP_ACCESS_TOKEN ||
      process.env.MP_ACCESS_TOKEN === 'TEST-dummy-token'
    ) {
      console.warn(
        'Returning mock MP preference because no MP_ACCESS_TOKEN is provided',
      );
      return {
        preferenceId: 'mock-pref-' + appointmentId,
        initPoint: `http://localhost:4200/success?payment_id=mock-payment&external_reference=${appointmentId}`,
      };
    }

    const payload = {
      body: {
        items: [
          {
            id: String(appointmentId),
            title: `Reserva Olimpia Fútbol 5 - ${date} ${startTime}`,
            quantity: 1,
            unit_price: depositAmount,
            currency_id: 'ARS',
          },
        ],
        back_urls: {
          success: `${process.env.FRONTEND_URL || 'http://localhost:4200'}/success`,
          failure: `${process.env.FRONTEND_URL || 'http://localhost:4200'}/failure`,
          pending: `${process.env.FRONTEND_URL || 'http://localhost:4200'}/pending`,
        },
        // auto_return: 'approved', // MP rejects auto_return if success url is localhost with production credentials
        notification_url: `${process.env.BACKEND_URL || 'https://example.com'}/bookings/webhook`,
        external_reference: String(appointmentId),
      },
    };
    console.log(
      'Sending MP preference payload:',
      JSON.stringify(payload, null, 2),
    );

    const preference = new Preference(this.client);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const result = await preference.create(payload as any);

    return {
      preferenceId: result.id,
      initPoint: result.init_point,
    };
  }

  async getPayment(paymentId: string) {
    const payment = new Payment(this.client);
    return payment.get({ id: paymentId });
  }
}
