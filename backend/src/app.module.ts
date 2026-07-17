import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { SlotsModule } from './slots/slots.module';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ServeStaticModule.forRoot({
      // Asumiendo que el build de Angular se copia a 'dist/olimpia/browser' del frontend
      rootPath: join(
        __dirname,
        '..',
        '..',
        'frontend',
        'dist',
        'olimpia',
        'browser',
      ),
      exclude: ['/api/(.*)'], // No servir estáticos para rutas de la API
    }),
    PrismaModule,
    SlotsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
