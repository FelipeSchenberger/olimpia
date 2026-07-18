import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Todas las rutas del backend empezarán con /api
  app.setGlobalPrefix('api');

  // CORS solo necesario para dev (Angular CLI en 4200). En prod, comparten dominio.
  const configService = app.get(ConfigService);
  const isDev = configService.get('NODE_ENV') !== 'production';
  if (isDev) {
    app.enableCors({ origin: 'http://localhost:4200', credentials: true });
  }

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap().catch((err) => console.error(err));
