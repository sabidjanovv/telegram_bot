import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class TelegramUserService {
  constructor(private prisma: PrismaService) {}

  async upsertUser(ctx: any) {
    const { id, username, first_name, last_name } = ctx.from;

    return this.prisma.telegramUser.upsert({
      where: { telegram_id: BigInt(id) },
      update: {
        username,
        first_name: first_name,
        last_name: last_name,
      },
      create: {
        telegram_id: BigInt(id),
        username,
        first_name: first_name,
        last_name: last_name,
      },
    });
  }

  async updateState(telegramId: number, state: string | null) {
    return this.prisma.telegramUser.update({
      where: { telegram_id: BigInt(telegramId) },
      data: { state },
    });
  }

  async getState(telegramId: number) {
    const user = await this.prisma.telegramUser.findUnique({
      where: { telegram_id: BigInt(telegramId) },
    });
    return user?.state ?? null;
  }
}
