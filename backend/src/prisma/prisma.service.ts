import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    // Connect lazily - don't block startup (Hostinger requires listen() within 3s)
    this.$connect().catch((err) =>
      console.error('Prisma connection error:', err),
    );
  }
}
