import { Injectable, OnModuleInit } from '@nestjs/common';
import { Telegraf, Markup } from 'telegraf';
import { StatsService } from '../stats/stats.service';
import { TelegramUserService } from './telegram-user.service';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(isoWeek);

type CallbackBtn = { text: string; callback_data: string };

@Injectable()
export class TelegramService implements OnModuleInit {
  private bot: Telegraf;

  constructor(
    private stats: StatsService,
    private telegramUserService: TelegramUserService,
  ) {
    const token = process.env.TELEGRAM_TOKEN;
    this.bot = new Telegraf(token);
  }

  async onModuleInit() {
    this.setup();
    this.bot.launch();
    console.log('🤖 Telegram bot started ✅');

    process.once('SIGINT', () => this.bot.stop('SIGINT'));
    process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
  }

  private chunkButtons(
    buttons: CallbackBtn[],
    perRow: number,
  ): CallbackBtn[][] {
    const result: CallbackBtn[][] = [];
    for (let i = 0; i < buttons.length; i += perRow) {
      result.push(buttons.slice(i, i + perRow));
    }
    return result;
  }

  setup() {
    // /start
    this.bot.start(async (ctx) => {
      await this.telegramUserService.upsertUser(ctx);
      await ctx.reply(
        'Assalomu alaykum! Statistikani ko‘rish uchun /stats buyrug‘ini ishlating.',
      );
    });

    // /stats
    this.bot.command('stats', async (ctx) => {
      await ctx.reply('Statistika olish usulini tanlang:', {
        reply_markup: {
          inline_keyboard: [
            [{ text: '📅 Sana bo‘yicha', callback_data: 'ST_DATE' }],
            [{ text: '📆 Hafta bo‘yicha', callback_data: 'ST_WEEK' }],
          ],
        },
      });
    });

    // 📅 Sana bo‘yicha
    this.bot.action('ST_DATE', async (ctx) => {
      const userId = ctx.from.id;
      await this.telegramUserService.updateState(userId, 'WAITING_FOR_DATE');
      await ctx.answerCbQuery();

      const { minYear, maxYear } = await this.stats.getYearRange();
      const yearButtons: CallbackBtn[][] = [];
      for (let y = minYear; y <= maxYear; y++) {
        yearButtons.push([{ text: `${y}`, callback_data: `DATE_YEAR_${y}` }]);
      }

      await ctx.reply('Iltimos, yilni tanlang:', {
        reply_markup: { inline_keyboard: yearButtons },
      });
    });

    // Sana bo‘yicha yil → oy
    this.bot.action(/DATE_YEAR_(\d+)/, async (ctx) => {
      const year = parseInt(ctx.match[1]);
      await ctx.answerCbQuery();

      const months = await this.stats.getMonthsByYear(year);
      const monthButtonsFlat: CallbackBtn[] = months.map((m) => ({
        text: `${m} - oy`,
        callback_data: `DATE_MONTH_${year}_${m}_0`,
      }));

      const monthButtons = this.chunkButtons(monthButtonsFlat, 3);
      await ctx.reply('Oy tanlang:', {
        reply_markup: { inline_keyboard: monthButtons },
      });
    });

    // Oy → sanalar (pagination, VKM uslubida)
    this.bot.action(/DATE_MONTH_(\d+)_(\d+)_(\d+)/, async (ctx) => {
      const year = parseInt(ctx.match[1]);
      const month = parseInt(ctx.match[2]);
      const page = parseInt(ctx.match[3]);
      await ctx.answerCbQuery();

      const daysInMonth = dayjs(`${year}-${month}-01`).daysInMonth();
      const perPage = 15; // 3 row × 5 column
      const startDay = page * perPage + 1;
      const endDay = Math.min(startDay + perPage - 1, daysInMonth);

      const dayButtonsFlat: CallbackBtn[] = [];
      for (let d = startDay; d <= endDay; d++) {
        dayButtonsFlat.push({
          text: `${d.toString().padStart(2, '0')}.${month.toString().padStart(2, '0')}.${year}`,
          callback_data: `DATE_DAY_${year}_${month}_${d}`,
        });
      }

      const dayButtons = this.chunkButtons(dayButtonsFlat, 5);

      const navButtons: CallbackBtn[] = [];
      if (startDay > 1)
        navButtons.push({
          text: '⬅️ Oldingi',
          callback_data: `DATE_MONTH_${year}_${month}_${page - 1}`,
        });
      if (endDay < daysInMonth)
        navButtons.push({
          text: '➡️ Keyingi',
          callback_data: `DATE_MONTH_${year}_${month}_${page + 1}`,
        });

      // Faqat inline buttons yangilanadi, yangi message yuborilmaydi
      try {
        await ctx.editMessageReplyMarkup({
          inline_keyboard: [...dayButtons, navButtons.length ? navButtons : []],
        });
      } catch (err) {
        // Ba’zida eski xabarni edit qilib bo‘lmaydi, shu holatda yangi message
        await ctx.reply('Sana tanlang:', {
          reply_markup: {
            inline_keyboard: [
              ...dayButtons,
              navButtons.length ? navButtons : [],
            ],
          },
        });
      }
    });

    // Sana tanlandi
    this.bot.action(/DATE_DAY_(\d+)_(\d+)_(\d+)/, async (ctx) => {
      const [year, month, day] = ctx.match
        .slice(1)
        .map((x) => x.padStart(2, '0'));
      const date = `${year}-${month}-${day}`;

      const stats = await this.stats.statsByDate(date);

      await ctx.reply(
        `📊 Statistika (${day}.${month}.${year}):\n\n` +
          `🔹 Umumiy ID: ${stats.total}\n` +
          `💳 Karta ulangan: ${stats.karta} (${stats.karta_percent}%)\n` +
          `⏳ Amal muddati: ${stats.amal} (${stats.amal_percent}%)\n` +
          `✅ Kod: ${stats.kod} (${stats.kod_percent}%)`,
      );

      await this.telegramUserService.updateState(ctx.from.id, null);
    });

    // 📆 Hafta bo‘yicha
    this.bot.action('ST_WEEK', async (ctx) => {
      const userId = ctx.from.id;
      await this.telegramUserService.updateState(userId, 'WAITING_FOR_WEEK');
      await ctx.answerCbQuery();

      const { minYear, maxYear } = await this.stats.getYearRange();
      const yearButtons: CallbackBtn[][] = [];
      for (let y = minYear; y <= maxYear; y++) {
        yearButtons.push([{ text: `${y}`, callback_data: `WEEK_YEAR_${y}_0` }]);
      }

      await ctx.reply('Iltimos, yilni tanlang:', {
        reply_markup: { inline_keyboard: yearButtons },
      });
    });

    // Hafta → yil tanlandi (pagination)
    this.bot.action(/WEEK_YEAR_(\d+)_(\d+)/, async (ctx) => {
      const year = parseInt(ctx.match[1]);
      const page = parseInt(ctx.match[2]);
      await ctx.answerCbQuery();

      const allWeeks = await this.stats.getWeeksByYear(year);
      const perPage = 12; // 3 row × 4 column
      const start = page * perPage;
      const end = Math.min(start + perPage, allWeeks.length);

      const weekButtonsFlat: CallbackBtn[] = allWeeks
        .slice(start, end)
        .map((w) => ({
          text: `Hafta ${w}`,
          callback_data: `WEEK_${year}_${w}`,
        }));

      const weekButtons = this.chunkButtons(weekButtonsFlat, 4);

      const navButtons: CallbackBtn[] = [];
      if (page > 0)
        navButtons.push({
          text: '⬅️ Oldingi',
          callback_data: `WEEK_YEAR_${year}_${page - 1}`,
        });
      if (end < allWeeks.length)
        navButtons.push({
          text: '➡️ Keyingi',
          callback_data: `WEEK_YEAR_${year}_${page + 1}`,
        });

      await ctx.reply('Hafta tanlang:', {
        reply_markup: { inline_keyboard: [...weekButtons, navButtons] },
      });
    });

    // Hafta tanlandi
    this.bot.action(/WEEK_(\d+)_(\d+)/, async (ctx) => {
      const year = parseInt(ctx.match[1]);
      const week = parseInt(ctx.match[2]);
      await ctx.answerCbQuery();

      const { startDate, endDate } = await this.stats.getDateRangeByWeek(
        year,
        week,
      );
      const stats = await this.stats.statsByIsoWeek(year, week);

      await ctx.reply(
        `📊 Statistika (${year}-yil ${week}-hafta, ${dayjs(startDate).format('DD.MM')} - ${dayjs(endDate).format('DD.MM')}):\n\n` +
          `🔹 Umumiy ID: ${stats.total}\n` +
          `💳 Karta ulangan: ${stats.karta} (${stats.karta_percent}%)\n` +
          `⏳ Amal muddati: ${stats.amal} (${stats.amal_percent}%)\n` +
          `✅ Kod: ${stats.kod} (${stats.kod_percent}%)`,
      );

      await this.telegramUserService.updateState(ctx.from.id, null);
    });
  }
}
