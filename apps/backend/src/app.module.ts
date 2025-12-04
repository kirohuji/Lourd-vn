import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ManifestModule } from './modules/manifest/manifest.module';
import { UsersModule } from './modules/users/users.module';
import { GameConfigModule } from './modules/game-config/game-config.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    ManifestModule,
    UsersModule,
    GameConfigModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
