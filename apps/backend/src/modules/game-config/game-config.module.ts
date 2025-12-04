import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { GameConfigController } from './game-config.controller';
import { GameConfigService } from './game-config.service';

@Module({
  imports: [PrismaModule],
  controllers: [GameConfigController],
  providers: [GameConfigService],
  exports: [GameConfigService],
})
export class GameConfigModule {}


