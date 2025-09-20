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
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

@Controller('sheets')
export class SheetsController {
  constructor(
    private readonly sheetsService: GoogleSheetsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('import')
  async import() {
    const sheetId = process.env.SHEET_ID;
    const range = process.env.SHEET_RANGE;

    console.log('📄 Using SHEET_ID:', sheetId);
    console.log('📄 Using SHEET_RANGE:', range);

    const rows = await this.sheetsService.getValues(sheetId, range);
    console.log(`📊 Total rows fetched: ${rows.length}`);

    for (const row of rows) {
      const [
        no,
        id,
        karta,
        amal,
        statusCode,
        statusMsg,
        phone,
        kod,
        statusAlt,
        vaqt,
      ] = row;

      console.log('----------------------------------------');
      console.log('Raw row:', row);

      if (!id || !vaqt) {
        console.warn(`Skipping row because id or vaqt missing. row no=${no}`);
        continue;
      }

      const parseBool = (v: any) => {
        if (v === undefined || v === null) return false;
        const s = String(v).trim().toLowerCase();
        return ['true', '1', 'yes', 'ha'].includes(s);
      };

      let parsedDate: Date | null = null;
      if (vaqt && typeof vaqt === 'string' && vaqt.trim() !== '') {
        // "DD.MM.YYYY HH:mm:ss" yoki "DD.MM.YYYY"
        const tempDate = dayjs.tz(vaqt, 'DD.MM.YYYY HH:mm:ss', 'Asia/Tashkent');
        if (tempDate.isValid()) {
          parsedDate = tempDate.toDate();
        } else {
          const fallbackDate = dayjs.tz(vaqt, 'DD.MM.YYYY', 'Asia/Tashkent');
          parsedDate = fallbackDate.isValid() ? fallbackDate.toDate() : null;
        }
      }

      if (!parsedDate) {
        console.warn(`⚠️ Invalid date, skipping row no=${no}, id=${id}:`, vaqt);
        continue;
      }

      const dataToInsert = {
        no: no ? String(no) : null,
        chat_id: String(id),
        karta_raqami: parseBool(karta),
        amal_muddati: parseBool(amal),
        status_code: statusCode ? Number(statusCode) : null,
        status_msg: statusMsg || null,
        phone: phone || null,
        kod: parseBool(kod),
        status_alt: statusAlt || null,
        vaqt: parsedDate,
      };

      console.log('Parsed data to insert:', dataToInsert);

      try {
        await this.prisma.userSheet.create({ data: dataToInsert });
        console.log(`✅ Row inserted successfully: id=${id}`);
      } catch (error) {
        console.error(`❌ Error inserting row id=${id}:`, error);
      }
    }

    return { message: 'Import finished' };
  }
}
