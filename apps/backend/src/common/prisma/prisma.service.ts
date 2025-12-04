import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(private readonly configService: ConfigService) {
    const databaseUrl = configService.get<string>('DATABASE_URL');

    if (!databaseUrl) {
      throw new Error(
        'DATABASE_URL environment variable is not set. Please configure it in your .env file.',
      );
    }

    // Prisma 6.x: PrismaClient automatically reads DATABASE_URL from process.env
    // Ensure it's set before calling super()
    if (!process.env.DATABASE_URL) {
      process.env.DATABASE_URL = databaseUrl;
    }

    // Initialize PrismaClient - Prisma 6.x doesn't require adapter
    super({
      log: ['error', 'warn'],
    });

    this.logger.log('PrismaClient initialized');
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Successfully connected to the database');
    } catch (error) {
      this.logger.error('Failed to connect to the database', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
      this.logger.log('Disconnected from the database');
    } catch (error) {
      this.logger.error('Error disconnecting from the database', error);
    }
  }
}
