import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { StatsModule } from '../stats/stats.module';
import { TelegramUserService } from './telegram-user.service';
import { StatsService } from '../stats/stats.service';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [StatsModule],
  providers: [
    TelegramService,
    TelegramUserService,
    StatsService,
    PrismaService,
  ],
})
export class TelegramModule {}
