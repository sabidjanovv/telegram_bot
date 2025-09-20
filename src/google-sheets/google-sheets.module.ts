import { Module } from '@nestjs/common';
import { GoogleSheetsService } from './google-sheets.service';
import { SheetsController } from './sheets.controller';
import { PrismaService } from '../prisma.service';

@Module({
  providers: [GoogleSheetsService, PrismaService],
  controllers: [SheetsController],
})
export class GoogleSheetsModule {}
