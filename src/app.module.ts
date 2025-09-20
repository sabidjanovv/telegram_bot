import { Module } from '@nestjs/common';
import { GoogleSheetsModule } from './google-sheets/google-sheets.module';
import { TelegramModule } from './telegram/telegram.module';
import { StatsModule } from './stats/stats.module';
import { PrismaService } from './prisma.service';

@Module({
  imports: [GoogleSheetsModule, TelegramModule, StatsModule],
  providers: [PrismaService],
})
export class AppModule {}
