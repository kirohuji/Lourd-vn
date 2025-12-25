import { Module } from '@nestjs/common';
import { CosService } from '../../common/cos/cos.service';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { PromptsController } from './prompts.controller';
import { PromptsService } from './prompts.service';

@Module({
  imports: [PrismaModule],
  controllers: [PromptsController],
  providers: [PromptsService, CosService],
  exports: [PromptsService],
})
export class PromptsModule {}

