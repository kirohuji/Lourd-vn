import { Module } from '@nestjs/common';
import { ManifestModule } from '../manifest/manifest.module';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { ChaptersController } from './chapters.controller';
import { ChaptersService } from './chapters.service';

@Module({
  imports: [PrismaModule, ManifestModule],
  controllers: [ChaptersController],
  providers: [ChaptersService],
  exports: [ChaptersService],
})
export class ChaptersModule {}

