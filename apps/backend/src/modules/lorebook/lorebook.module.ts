import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { LoreBookController } from './lorebook.controller';
import { LoreBookService } from './lorebook.service';

@Module({
  imports: [PrismaModule],
  controllers: [LoreBookController],
  providers: [LoreBookService],
  exports: [LoreBookService],
})
export class LoreBookModule {}

