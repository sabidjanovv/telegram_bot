// import { Controller, Get } from '@nestjs/common';
// import { GoogleSheetsService } from './google-sheets.service';
// import { PrismaService } from '../prisma.service';
// import dayjs from 'dayjs';
// import utc from 'dayjs/plugin/utc';
// import timezone from 'dayjs/plugin/timezone';

// dayjs.extend(utc);
// dayjs.extend(timezone);

// @Controller('sheets')
// export class SheetsController {
//   constructor(
//     private readonly sheetsService: GoogleSheetsService,
//     private readonly prisma: PrismaService,
//   ) {}

//   @Get('import')
//   async import() {
//     const sheetId = process.env.SHEET_ID;
//     const range = process.env.SHEET_RANGE;

//     console.log('📄 Using SHEET_ID:', sheetId);
//     console.log('📄 Using SHEET_RANGE:', range);

//     const rows = await this.sheetsService.getValues(sheetId, range);

//     for (const row of rows) {
//       const [
//         no,
//         id,
//         karta,
//         amal,
//         statusCode,
//         statusMsg,
//         phone,
//         kod,
//         statusAlt,
//         vaqt,
//       ] = row;

//       if (!id || !vaqt) continue;

//       const parseBool = (v: any) => {
//         if (v === undefined || v === null) return false;
//         const s = String(v).trim().toLowerCase();
//         return ['true', '1', 'yes', 'ha'].includes(s);
//       };

//       let parsedDate: Date;
//       if (/\d{2}\.\d{2}\.\d{4}/.test(vaqt)) {
//         parsedDate = dayjs(vaqt, 'DD.MM.YYYY HH:mm:ss')
//           .tz('Asia/Tashkent')
//           .toDate();

//         // agar vaqt faqat "DD.MM.YYYY" bo'lsa:
//         if (!/\d{2}:\d{2}:\d{2}/.test(vaqt)) {
//           parsedDate = dayjs(vaqt, 'DD.MM.YYYY').tz('Asia/Tashkent').toDate();
//         }
//       } else {
//         parsedDate = dayjs(vaqt).tz('Asia/Tashkent').toDate();
//       }


//       await this.prisma.userSheet.create({
//         data: {
//           no: no ? String(no) : null,
//           chat_id: String(id),
//           karta_raqami: parseBool(karta),
//           amal_muddati: parseBool(amal),
//           status_code: statusCode ? Number(statusCode) : null,
//           status_msg: statusMsg || null,
//           phone: phone || null,
//           kod: parseBool(kod),
//           status_alt: statusAlt || null,
//           vaqt: parsedDate,
//         },
//       });
//     }

//     return { message: 'Imported' };
//   }
// }

import { Controller, Get } from '@nestjs/common';
import { GoogleSheetsService } from './google-sheets.service';
import { PrismaService } from '../prisma.service';

@Controller('sheets')
export class SheetsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sheetsService: GoogleSheetsService,
  ) {}

  // Utility function to parse "DD.MM.YYYY HH:mm:ss" into JS Date
  private parseDate(str: string): Date | null {
    if (!str || str.trim() === '') return null; // bo'sh bo'lsa null qaytaradi
    try {
      const [datePart, timePart] = str.split(' ');
      if (!datePart || !timePart) return null;
      const [day, month, year] = datePart.split('.').map(Number);
      const [hours, minutes, seconds] = timePart.split(':').map(Number);
      return new Date(year, month - 1, day, hours, minutes, seconds);
    } catch (e) {
      console.error('Invalid date format:', str);
      return null;
    }
  }

  @Get('import')
  async import() {
    try {
      // Google Sheets ma'lumotlarini olish
      const SHEET_ID = '1dMPJtbzOc-x6MU7DRdDoonj7rva3r9SQTMG7E0DIM8I';
      const SHEET_RANGE = 'Лист1!A2:J10000';
      const rows = await this.sheetsService.getValues(SHEET_ID, SHEET_RANGE);

      console.log('Total rows fetched:', rows.length);

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];

        // Konsolga har bir row ni chiqarish
        console.log(`Row ${i + 1}:`, row);

        // row[9] deb vaqt maydoni kelyapti deb faraz qilamiz
        const vaqt = this.parseDate(row[9]);
        if (!vaqt) {
          console.warn(`Row ${i + 1} has invalid date: "${row[9]}"`);
        }

        await this.prisma.userSheet.create({
          data: {
            no: row[0],
            chat_id: row[1],
            karta_raqami: row[2] === 'true',
            amal_muddati: row[3] === 'true',
            status_code: Number(row[4]),
            status_msg: row[5] || null,
            phone: row[6],
            kod: row[7] === 'true',
            status_alt: row[8] || null,
            vaqt: vaqt || new Date(), // agar null bo‘lsa, hozirgi vaqt bilan saqlash
          },
        });
      }

      return { success: true, message: 'Sheets imported successfully' };
    } catch (error) {
      console.error('Import error:', error);
      throw error;
    }
  }
}
