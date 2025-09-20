// import { Injectable } from '@nestjs/common';
// import { google } from 'googleapis';
// import path from 'path';

// @Injectable()
// export class GoogleSheetsService {
//   private sheetsApi;
//   constructor() {
//     this.sheetsApi = google.sheets('v4');
//   }

//   async getValues(sheetId: string, range: string) {
//     console.log(
//       'sheet-service sheetId: ',
//       sheetId,
//       'sheet-service range: ',
//       range,
//     );

//     const auth = new google.auth.GoogleAuth({
//       keyFile: path.join(process.cwd(), 'credentials.json'),
//       scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
//     });

//     console.log('AUTH: ', auth);

//     const client = await auth.getClient();

//     const res = await this.sheetsApi.spreadsheets.values.get({
//       spreadsheetId: sheetId,
//       range,
//       auth: client,
//     } as any);

//     return res?.data?.values || [];
//   }

//   async debugSheetInfo(sheetId: string) {
//     const auth = new google.auth.GoogleAuth({
//       keyFile: path.join(process.cwd(), 'credentials.json'),
//       scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
//     });
//     const client = await auth.getClient();

//     const res = await this.sheetsApi.spreadsheets.get({
//       spreadsheetId: sheetId,
//       auth: client,
//     } as any);

//     console.log(
//       'Sheets list:',
//       res.data.sheets?.map((s) => s.properties?.title),
//     );
//   }
// }

import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import path from 'path';

@Injectable()
export class GoogleSheetsService {
  private sheetsApi;

  constructor() {
    this.sheetsApi = google.sheets('v4');
  }

  // Bu metod Google Sheets dan ma'lumot olib keladi
  async getValues(sheetId: string, range: string) {
    console.log(
      'sheet-service sheetId: ',
      sheetId,
      'sheet-service range: ',
      range,
    );

    const auth = new google.auth.GoogleAuth({
      keyFile: path.join(process.cwd(), 'credentials.json'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const client = await auth.getClient();

    const res = await this.sheetsApi.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range,
      auth: client,
    } as any);

    return res?.data?.values || [];
  }

  // Utility metod: avvalgi `getSheetRows` nomini shu yerda yaratamiz
  async getSheetRows() {
    const SHEET_ID = '1dMPJtbzOc-x6MU7DRdDoonj7rva3r9SQTMG7E0DIM8I';
    const SHEET_RANGE = 'Лист1!A2:J10000';
    return this.getValues(SHEET_ID, SHEET_RANGE);
  }

  async debugSheetInfo(sheetId: string) {
    const auth = new google.auth.GoogleAuth({
      keyFile: path.join(process.cwd(), 'credentials.json'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    const client = await auth.getClient();

    const res = await this.sheetsApi.spreadsheets.get({
      spreadsheetId: sheetId,
      auth: client,
    } as any);

    console.log(
      'Sheets list:',
      res.data.sheets?.map((s) => s.properties?.title),
    );
  }
}
