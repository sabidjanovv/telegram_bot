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

    console.log('✅ Fetched', rows.length, 'rows from sheet');

    const parseBool = (v: any) => {
      if (v === undefined || v === null) return false;
      const s = String(v).trim().toLowerCase();
      return ['true', '1', 'yes', 'ha'].includes(s);
    };

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

      if (!id || !vaqt) {
        console.warn('⏩ Skipping row due to missing id or vaqt:', row);
        continue; // vaqt bo‘lmasa o‘tkazamiz
      }

      // let parsedDate: Date;
      // try {
      //   if (/\d{2}\.\d{2}\.\d{4}/.test(vaqt)) {
      //     if (/\d{2}:\d{2}:\d{2}/.test(vaqt)) {
      //       parsedDate = dayjs
      //         .tz(vaqt, 'DD.MM.YYYY HH:mm:ss', 'Asia/Tashkent')
      //         .toDate();
      //     } else {
      //       parsedDate = dayjs.tz(vaqt, 'DD.MM.YYYY', 'Asia/Tashkent').toDate();
      //     }
      //   } else {
      //     parsedDate = dayjs(vaqt).toDate();
      //   }
      // } catch (e) {
      //   console.error('❌ Invalid date for row, skipping:', row, e);
      //   continue; // vaqt parse bo‘lmasa row’ni o‘tkazamiz
      // }

      let parsedDate: Date;

      try {
        // agar vaqt DD.MM.YYYY formatida bo'lsa
        if (/\d{2}\.\d{2}\.\d{4}/.test(vaqt)) {
          if (/\d{2}:\d{2}:\d{2}/.test(vaqt)) {
            // vaqt bilan
            parsedDate = dayjs
              .tz(vaqt, 'DD.MM.YYYY HH:mm:ss', 'Asia/Tashkent')
              .toDate();
          } else {
            // faqat sana bo'lsa, default vaqt qo'shamiz
            parsedDate = dayjs
              .tz(vaqt + ' 00:00:01', 'DD.MM.YYYY HH:mm:ss', 'Asia/Tashkent')
              .toDate();
          }
        } else {
          // boshqa format
          parsedDate = dayjs(vaqt).tz('Asia/Tashkent').toDate();
        }
      } catch (e) {
        console.error('❌ Invalid date for row, skipping:', row, e);
        continue; // vaqt parse bo‘lmasa row’ni o‘tkazamiz
      }


      await this.prisma.userSheet.create({
        data: {
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
        },
      });
    }


    return { message: 'Imported' };
  }
}
