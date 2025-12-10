import { Module } from '@nestjs/common';
import { CosService } from '../../common/cos/cos.service';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { ManifestController, ProjectResourceController } from './manifest.controller';
import { ManifestService } from './manifest.service';

@Module({
  imports: [PrismaModule],
  controllers: [ManifestController, ProjectResourceController],
  providers: [ManifestService, CosService],
  exports: [ManifestService],
})
export class ManifestModule {}
