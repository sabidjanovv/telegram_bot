import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import dayjs = require('dayjs');
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(isoWeek);

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  async statsByDate(dateIso: string) {
    const start = dayjs(dateIso).startOf('day').toDate();
    const end = dayjs(dateIso).endOf('day').toDate();

    const total = await this.prisma.userSheet.count({
      where: { vaqt: { gte: start, lt: end } },
    });

    const karta = await this.prisma.userSheet.count({
      where: { vaqt: { gte: start, lt: end }, karta_raqami: true },
    });
    const amal = await this.prisma.userSheet.count({
      where: { vaqt: { gte: start, lt: end }, amal_muddati: true },
    });
    const kod = await this.prisma.userSheet.count({
      where: { vaqt: { gte: start, lt: end }, kod: true },
    });

    return {
      total,
      karta,
      amal,
      kod,
      karta_percent: total ? Math.round((karta / total) * 10000) / 100 : 0,
      amal_percent: total ? Math.round((amal / total) * 10000) / 100 : 0,
      kod_percent: total ? Math.round((kod / total) * 10000) / 100 : 0,
    };
  }

  // Get stats for a week given year and week number (ISO week)
  async statsByIsoWeek(year: number, isoWeekNum: number) {
    const start = dayjs()
      .year(year)
      .isoWeek(isoWeekNum)
      .startOf('isoWeek')
      .toDate();

    const end = dayjs()
      .year(year)
      .isoWeek(isoWeekNum)
      .endOf('isoWeek')
      .toDate();

    const total = await this.prisma.userSheet.count({
      where: { vaqt: { gte: start, lt: end } },
    });

    const karta = await this.prisma.userSheet.count({
      where: { vaqt: { gte: start, lt: end }, karta_raqami: true },
    });
    const amal = await this.prisma.userSheet.count({
      where: { vaqt: { gte: start, lt: end }, amal_muddati: true },
    });
    const kod = await this.prisma.userSheet.count({
      where: { vaqt: { gte: start, lt: end }, kod: true },
    });

    return {
      total,
      karta,
      amal,
      kod,
      karta_percent: total ? Math.round((karta / total) * 10000) / 100 : 0,
      amal_percent: total ? Math.round((amal / total) * 10000) / 100 : 0,
      kod_percent: total ? Math.round((kod / total) * 10000) / 100 : 0,
      start,
      end,
    };
  }

  // 1️⃣ Minimal va maksimal yil
  async getYearRange(): Promise<{ minYear: number; maxYear: number }> {
    const minRecord = await this.prisma.userSheet.findFirst({
      orderBy: { vaqt: 'asc' },
      select: { vaqt: true },
    });
    const maxRecord = await this.prisma.userSheet.findFirst({
      orderBy: { vaqt: 'desc' },
      select: { vaqt: true },
    });

    const minYear = minRecord ? dayjs(minRecord.vaqt).year() : dayjs().year();
    const maxYear = maxRecord ? dayjs(maxRecord.vaqt).year() : dayjs().year();

    return { minYear, maxYear };
  }

  // 2️⃣ O'sha yil uchun mavjud oylar
  async getMonthsByYear(year: number): Promise<number[]> {
    const records = await this.prisma.userSheet.findMany({
      where: {
        vaqt: {
          gte: dayjs(`${year}-01-01`).startOf('year').toDate(),
          lt: dayjs(`${year}-12-31`).endOf('year').toDate(),
        },
      },
      select: { vaqt: true },
    });

    const monthsSet = new Set<number>();
    records.forEach((r) => monthsSet.add(dayjs(r.vaqt).month() + 1)); // month() 0-base
    return Array.from(monthsSet).sort((a, b) => a - b);
  }

  // 3️⃣ O'sha yil uchun mavjud haftalar
  async getWeeksByYear(year: number): Promise<number[]> {
    const records = await this.prisma.userSheet.findMany({
      where: {
        vaqt: {
          gte: dayjs(`${year}-01-01`).startOf('year').toDate(),
          lt: dayjs(`${year}-12-31`).endOf('year').toDate(),
        },
      },
      select: { vaqt: true },
    });

    const weeksSet = new Set<number>();
    records.forEach((r) => weeksSet.add(dayjs(r.vaqt).isoWeek()));
    return Array.from(weeksSet).sort((a, b) => a - b);
  }

  // 4️⃣ Hafta bo‘yicha start-end sanalar
  async getDateRangeByWeek(
    year: number,
    week: number,
  ): Promise<{ startDate: string; endDate: string }> {
    const startDate = dayjs()
      .year(year)
      .isoWeek(week)
      .startOf('isoWeek')
      .format('YYYY-MM-DD');
    const endDate = dayjs()
      .year(year)
      .isoWeek(week)
      .endOf('isoWeek')
      .format('YYYY-MM-DD');
    return { startDate, endDate };
  }
}
