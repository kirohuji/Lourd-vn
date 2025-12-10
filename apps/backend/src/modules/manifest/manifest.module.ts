import { Module } from '@nestjs/common';
import { CosService } from '../../common/cos/cos.service';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { ManifestController, ProjectResourceController } from './manifest.controller';
import { BundleGeneratorService } from './bundle-generator.service';
import { ManifestService } from './manifest.service';

@Module({
  imports: [PrismaModule],
  controllers: [ManifestController, ProjectResourceController],
  providers: [ManifestService, BundleGeneratorService, CosService],
  exports: [ManifestService, BundleGeneratorService],
})
export class ManifestModule {}
