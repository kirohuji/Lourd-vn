import { Module } from '@nestjs/common';
import { ResourcesService } from './resources.service';
import { ResourcesController } from './resources.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CosService } from '../common/cos/cos.service';

@Module({
  imports: [PrismaModule],
  controllers: [ResourcesController],
  providers: [ResourcesService, CosService],
  exports: [ResourcesService],
})
export class ResourcesModule {}

