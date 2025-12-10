import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { GameConfigController, ProjectGameConfigController } from './game-config.controller';
import { GameConfigService } from './game-config.service';

@Module({
  imports: [PrismaModule],
  controllers: [GameConfigController, ProjectGameConfigController],
  providers: [GameConfigService],
  exports: [GameConfigService],
})
export class GameConfigModule {}


