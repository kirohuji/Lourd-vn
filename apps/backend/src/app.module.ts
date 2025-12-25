import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ChaptersModule } from './modules/chapters/chapters.module';
import { GameConfigModule } from './modules/game-config/game-config.module';
import { LoreBookModule } from './modules/lorebook/lorebook.module';
import { ManifestModule } from './modules/manifest/manifest.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { PromptsModule } from './modules/prompts/prompts.module';
import { UsersModule } from './modules/users/users.module';

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
    ProjectsModule,
    ChaptersModule,
    PromptsModule,
    LoreBookModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
