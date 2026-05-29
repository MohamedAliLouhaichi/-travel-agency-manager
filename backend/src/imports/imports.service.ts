import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ImportType, ImportStatus, PaymentMethod, PaymentStatus } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

// ── CSV column definitions per import type ──────────────────────────────

const CUSTOMER_COLUMNS = [
  'firstName',
  'lastName',
  'phone',
  'email',
  'address',
  'nationality',
  'passportNumber',
  'passportExpiry',
  'dateOfBirth',
  'notes',
] as const;

const HOTEL_BOOKING_COLUMNS = [
  'customerEmail',
  'destination',
  'startDate',
  'endDate',
  'totalPrice',
  'hotelName',
  'city',
  'country',
  'checkInDate',
  'checkOutDate',
  'numberOfNights',
  'roomType',
  'numberOfRooms',
  'numberOfGuests',
  'boardType',
  'confirmationNumber',
  'notes',
] as const;

const FLIGHT_BOOKING_COLUMNS = [
  'customerEmail',
  'destination',
  'startDate',
  'endDate',
  'totalPrice',
  'airline',
  'flightNumber',
  'departureAirport',
  'arrivalAirport',
  'departureCity',
  'arrivalCity',
  'departureDatetime',
  'arrivalDatetime',
  'ticketNumber',
  'reservationReference',
  'passengerCount',
  'notes',
] as const;

// ── Helper: simple CSV parser (handles quoted values) ───────────────────

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"') {
        // Check for escaped quote ("")
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++; // skip next quote
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        fields.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  }

  fields.push(current.trim());
  return fields;
}

function parseCSV(content: string): Record<string, string>[] {
  const lines = content
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  if (lines.length < 2) {
    return [];
  }

  const headers = parseCSVLine(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] ?? '';
    });
    rows.push(row);
  }

  return rows;
}

// ── Helper: parse Excel ──────────────────────────────────────────────────

function parseExcel(filePath: string): Record<string, string>[] {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];

  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, {
    defval: '',
  });

  // Convert all values to strings for uniform processing
  return data.map((row) => {
    const stringRow: Record<string, string> = {};
    for (const key of Object.keys(row)) {
      stringRow[key] = String(row[key] ?? '');
    }
    return stringRow;
  });
}

// ── Helper: date validation ──────────────────────────────────────────────

function isValidDate(value: string): boolean {
  if (!value) return false;
  const d = new Date(value);
  return !isNaN(d.getTime());
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

// ── Service ──────────────────────────────────────────────────────────────

@Injectable()
export class ImportsService {
  private readonly logger = new Logger(ImportsService.name);

  constructor(private prisma: PrismaService) {}

  // ── File parsing dispatcher ────────────────────────────────────────────

  private parseFile(
    filePath: string,
    fileType: string,
  ): Record<string, string>[] {
    if (fileType === 'csv') {
      const content = fs.readFileSync(filePath, 'utf-8');
      return parseCSV(content);
    }

    if (fileType === 'xlsx' || fileType === 'xls') {
      return parseExcel(filePath);
    }

    throw new BadRequestException(
      `Unsupported file type: ${fileType}. Use CSV or XLSX.`,
    );
  }

  private getFileType(originalName: string): string {
    const ext = path.extname(originalName).toLowerCase().replace('.', '');
    if (!['csv', 'xlsx', 'xls'].includes(ext)) {
      throw new BadRequestException(
        `Unsupported file extension: .${ext}. Use .csv, .xlsx, or .xls`,
      );
    }
    return ext;
  }

  // ── Customer import ────────────────────────────────────────────────────

  async processCustomerImport(filePath: string, userId: string) {
    const fileType = this.getFileType(filePath);

    // 1. Create batch record
    const batch = await this.prisma.importBatch.create({
      data: {
        fileName: path.basename(filePath),
        fileType,
        importType: ImportType.CUSTOMER,
        status: ImportStatus.VALIDATING,
        uploadedById: userId,
      },
    });

    try {
      // 2. Parse file
      const rows = this.parseFile(filePath, fileType);
      const totalRows = rows.length;

      await this.prisma.importBatch.update({
        where: { id: batch.id },
        data: { totalRows, status: ImportStatus.IMPORTING },
      });

      let successRows = 0;
      let failedRows = 0;
      const errors: {
        rowNumber: number;
        fieldName?: string;
        errorMessage: string;
        rawData?: string;
      }[] = [];

      // 3. Validate and create each customer
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNumber = i + 2; // +2 because row 1 is headers, data starts at row 2
        const rowErrors: string[] = [];

        // Required field validation
        if (!row.firstName?.trim()) rowErrors.push('firstName is required');
        if (!row.lastName?.trim()) rowErrors.push('lastName is required');
        if (!row.phone?.trim()) rowErrors.push('phone is required');
        if (!row.email?.trim()) {
          rowErrors.push('email is required');
        } else if (!isValidEmail(row.email.trim())) {
          rowErrors.push('email is not a valid email address');
        }

        // Optional date validation
        if (row.passportExpiry?.trim() && !isValidDate(row.passportExpiry)) {
          rowErrors.push('passportExpiry is not a valid date');
        }
        if (row.dateOfBirth?.trim() && !isValidDate(row.dateOfBirth)) {
          rowErrors.push('dateOfBirth is not a valid date');
        }

        if (rowErrors.length > 0) {
          failedRows++;
          for (const errMsg of rowErrors) {
            const fieldName = errMsg.split(' ')[0];
            errors.push({
              rowNumber,
              fieldName,
              errorMessage: errMsg,
              rawData: JSON.stringify(row),
            });
          }
          continue;
        }

        // Create customer
        try {
          await this.prisma.customer.create({
            data: {
              firstName: row.firstName.trim(),
              lastName: row.lastName.trim(),
              phone: row.phone.trim(),
              email: row.email.trim(),
              address: row.address?.trim() || null,
              nationality: row.nationality?.trim() || null,
              passportNumber: row.passportNumber?.trim() || null,
              passportExpiry: row.passportExpiry?.trim()
                ? new Date(row.passportExpiry.trim())
                : null,
              dateOfBirth: row.dateOfBirth?.trim()
                ? new Date(row.dateOfBirth.trim())
                : null,
              notes: row.notes?.trim() || null,
            },
          });
          successRows++;
        } catch (err) {
          failedRows++;
          errors.push({
            rowNumber,
            errorMessage: `Database error: ${err.message}`,
            rawData: JSON.stringify(row),
          });
        }
      }

      // 4. Save errors in bulk
      if (errors.length > 0) {
        await this.prisma.importError.createMany({
          data: errors.map((e) => ({
            importBatchId: batch.id,
            rowNumber: e.rowNumber,
            fieldName: e.fieldName || null,
            errorMessage: e.errorMessage,
            rawData: e.rawData || null,
          })),
        });
      }

      // 5. Finalize batch
      const finalStatus =
        failedRows === totalRows ? ImportStatus.FAILED : ImportStatus.COMPLETED;

      const updatedBatch = await this.prisma.importBatch.update({
        where: { id: batch.id },
        data: {
          status: finalStatus,
          totalRows,
          successRows,
          failedRows,
        },
        include: { errors: true },
      });

      // 6. Activity log
      await this.prisma.activityLog.create({
        data: {
          userId,
          action: 'IMPORT_CUSTOMERS',
          entityType: 'IMPORT_BATCH',
          entityId: batch.id,
          description: `Imported customers: ${successRows} succeeded, ${failedRows} failed out of ${totalRows} rows`,
        },
      });

      return updatedBatch;
    } catch (err) {
      // Mark batch as failed on unexpected errors
      await this.prisma.importBatch.update({
        where: { id: batch.id },
        data: { status: ImportStatus.FAILED },
      });
      this.logger.error(`Customer import failed: ${err.message}`, err.stack);
      throw new BadRequestException(
        `Import failed: ${err.message}`,
      );
    }
  }

  // ── Hotel booking import ───────────────────────────────────────────────

  async processHotelBookingImport(filePath: string, userId: string) {
    const fileType = this.getFileType(filePath);

    const batch = await this.prisma.importBatch.create({
      data: {
        fileName: path.basename(filePath),
        fileType,
        importType: ImportType.HOTEL_BOOKING,
        status: ImportStatus.VALIDATING,
        uploadedById: userId,
      },
    });

    try {
      const rows = this.parseFile(filePath, fileType);
      const totalRows = rows.length;

      await this.prisma.importBatch.update({
        where: { id: batch.id },
        data: { totalRows, status: ImportStatus.IMPORTING },
      });

      let successRows = 0;
      let failedRows = 0;
      const errors: {
        rowNumber: number;
        fieldName?: string;
        errorMessage: string;
        rawData?: string;
      }[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNumber = i + 2;
        const rowErrors: string[] = [];

        // Required fields
        if (!row.customerEmail?.trim())
          rowErrors.push('customerEmail is required');
        else if (!isValidEmail(row.customerEmail.trim()))
          rowErrors.push('customerEmail is not a valid email');
        if (!row.destination?.trim())
          rowErrors.push('destination is required');
        if (!row.startDate?.trim())
          rowErrors.push('startDate is required');
        else if (!isValidDate(row.startDate))
          rowErrors.push('startDate is not a valid date');
        if (!row.endDate?.trim())
          rowErrors.push('endDate is required');
        else if (!isValidDate(row.endDate))
          rowErrors.push('endDate is not a valid date');
        if (!row.totalPrice?.trim())
          rowErrors.push('totalPrice is required');
        else if (isNaN(Number(row.totalPrice)))
          rowErrors.push('totalPrice must be a number');
        if (!row.hotelName?.trim())
          rowErrors.push('hotelName is required');
        if (!row.city?.trim()) rowErrors.push('city is required');
        if (!row.country?.trim()) rowErrors.push('country is required');
        if (!row.checkInDate?.trim())
          rowErrors.push('checkInDate is required');
        else if (!isValidDate(row.checkInDate))
          rowErrors.push('checkInDate is not a valid date');
        if (!row.checkOutDate?.trim())
          rowErrors.push('checkOutDate is required');
        else if (!isValidDate(row.checkOutDate))
          rowErrors.push('checkOutDate is not a valid date');
        if (!row.numberOfNights?.trim())
          rowErrors.push('numberOfNights is required');
        else if (isNaN(Number(row.numberOfNights)) || Number(row.numberOfNights) < 1)
          rowErrors.push('numberOfNights must be a positive number');
        if (!row.roomType?.trim()) rowErrors.push('roomType is required');
        if (!row.boardType?.trim()) rowErrors.push('boardType is required');

        if (rowErrors.length > 0) {
          failedRows++;
          for (const errMsg of rowErrors) {
            errors.push({
              rowNumber,
              fieldName: errMsg.split(' ')[0],
              errorMessage: errMsg,
              rawData: JSON.stringify(row),
            });
          }
          continue;
        }

        // Lookup customer by email
        const customer = await this.prisma.customer.findFirst({
          where: { email: row.customerEmail.trim() },
        });

        if (!customer) {
          failedRows++;
          errors.push({
            rowNumber,
            fieldName: 'customerEmail',
            errorMessage: `Customer with email "${row.customerEmail.trim()}" not found`,
            rawData: JSON.stringify(row),
          });
          continue;
        }

        try {
          const totalPrice = Number(row.totalPrice);

          await this.prisma.booking.create({
            data: {
              customerId: customer.id,
              employeeId: userId,
              bookingType: 'HOTEL',
              destination: row.destination.trim(),
              startDate: new Date(row.startDate.trim()),
              endDate: new Date(row.endDate.trim()),
              totalPrice,
              paidAmount: 0,
              remainingAmount: totalPrice,
              bookingStatus: 'DRAFT',
              paymentStatus: 'UNPAID',
              notes: row.notes?.trim() || null,
              hotelBooking: {
                create: {
                  hotelName: row.hotelName.trim(),
                  city: row.city.trim(),
                  country: row.country.trim(),
                  checkInDate: new Date(row.checkInDate.trim()),
                  checkOutDate: new Date(row.checkOutDate.trim()),
                  numberOfNights: parseInt(row.numberOfNights, 10),
                  roomType: row.roomType.trim(),
                  numberOfRooms: row.numberOfRooms?.trim()
                    ? parseInt(row.numberOfRooms, 10)
                    : 1,
                  numberOfGuests: row.numberOfGuests?.trim()
                    ? parseInt(row.numberOfGuests, 10)
                    : 1,
                  boardType: row.boardType.trim(),
                  confirmationNumber: row.confirmationNumber?.trim() || null,
                },
              },
            },
          });
          successRows++;
        } catch (err) {
          failedRows++;
          errors.push({
            rowNumber,
            errorMessage: `Database error: ${err.message}`,
            rawData: JSON.stringify(row),
          });
        }
      }

      // Save errors
      if (errors.length > 0) {
        await this.prisma.importError.createMany({
          data: errors.map((e) => ({
            importBatchId: batch.id,
            rowNumber: e.rowNumber,
            fieldName: e.fieldName || null,
            errorMessage: e.errorMessage,
            rawData: e.rawData || null,
          })),
        });
      }

      const finalStatus =
        failedRows === totalRows ? ImportStatus.FAILED : ImportStatus.COMPLETED;

      const updatedBatch = await this.prisma.importBatch.update({
        where: { id: batch.id },
        data: { status: finalStatus, totalRows, successRows, failedRows },
        include: { errors: true },
      });

      await this.prisma.activityLog.create({
        data: {
          userId,
          action: 'IMPORT_HOTEL_BOOKINGS',
          entityType: 'IMPORT_BATCH',
          entityId: batch.id,
          description: `Imported hotel bookings: ${successRows} succeeded, ${failedRows} failed out of ${totalRows} rows`,
        },
      });

      return updatedBatch;
    } catch (err) {
      await this.prisma.importBatch.update({
        where: { id: batch.id },
        data: { status: ImportStatus.FAILED },
      });
      this.logger.error(
        `Hotel booking import failed: ${err.message}`,
        err.stack,
      );
      throw new BadRequestException(`Import failed: ${err.message}`);
    }
  }

  // ── Flight booking import ──────────────────────────────────────────────

  async processFlightBookingImport(filePath: string, userId: string) {
    const fileType = this.getFileType(filePath);

    const batch = await this.prisma.importBatch.create({
      data: {
        fileName: path.basename(filePath),
        fileType,
        importType: ImportType.FLIGHT_BOOKING,
        status: ImportStatus.VALIDATING,
        uploadedById: userId,
      },
    });

    try {
      const rows = this.parseFile(filePath, fileType);
      const totalRows = rows.length;

      await this.prisma.importBatch.update({
        where: { id: batch.id },
        data: { totalRows, status: ImportStatus.IMPORTING },
      });

      let successRows = 0;
      let failedRows = 0;
      const errors: {
        rowNumber: number;
        fieldName?: string;
        errorMessage: string;
        rawData?: string;
      }[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNumber = i + 2;
        const rowErrors: string[] = [];

        // Required fields
        if (!row.customerEmail?.trim())
          rowErrors.push('customerEmail is required');
        else if (!isValidEmail(row.customerEmail.trim()))
          rowErrors.push('customerEmail is not a valid email');
        if (!row.destination?.trim())
          rowErrors.push('destination is required');
        if (!row.startDate?.trim())
          rowErrors.push('startDate is required');
        else if (!isValidDate(row.startDate))
          rowErrors.push('startDate is not a valid date');
        if (!row.endDate?.trim())
          rowErrors.push('endDate is required');
        else if (!isValidDate(row.endDate))
          rowErrors.push('endDate is not a valid date');
        if (!row.totalPrice?.trim())
          rowErrors.push('totalPrice is required');
        else if (isNaN(Number(row.totalPrice)))
          rowErrors.push('totalPrice must be a number');
        if (!row.airline?.trim()) rowErrors.push('airline is required');
        if (!row.flightNumber?.trim())
          rowErrors.push('flightNumber is required');
        if (!row.departureAirport?.trim())
          rowErrors.push('departureAirport is required');
        if (!row.arrivalAirport?.trim())
          rowErrors.push('arrivalAirport is required');
        if (!row.departureCity?.trim())
          rowErrors.push('departureCity is required');
        if (!row.arrivalCity?.trim())
          rowErrors.push('arrivalCity is required');
        if (!row.departureDatetime?.trim())
          rowErrors.push('departureDatetime is required');
        else if (!isValidDate(row.departureDatetime))
          rowErrors.push('departureDatetime is not a valid date');
        if (!row.arrivalDatetime?.trim())
          rowErrors.push('arrivalDatetime is required');
        else if (!isValidDate(row.arrivalDatetime))
          rowErrors.push('arrivalDatetime is not a valid date');

        if (rowErrors.length > 0) {
          failedRows++;
          for (const errMsg of rowErrors) {
            errors.push({
              rowNumber,
              fieldName: errMsg.split(' ')[0],
              errorMessage: errMsg,
              rawData: JSON.stringify(row),
            });
          }
          continue;
        }

        // Lookup customer by email
        const customer = await this.prisma.customer.findFirst({
          where: { email: row.customerEmail.trim() },
        });

        if (!customer) {
          failedRows++;
          errors.push({
            rowNumber,
            fieldName: 'customerEmail',
            errorMessage: `Customer with email "${row.customerEmail.trim()}" not found`,
            rawData: JSON.stringify(row),
          });
          continue;
        }

        try {
          const totalPrice = Number(row.totalPrice);

          await this.prisma.booking.create({
            data: {
              customerId: customer.id,
              employeeId: userId,
              bookingType: 'FLIGHT',
              destination: row.destination.trim(),
              startDate: new Date(row.startDate.trim()),
              endDate: new Date(row.endDate.trim()),
              totalPrice,
              paidAmount: 0,
              remainingAmount: totalPrice,
              bookingStatus: 'DRAFT',
              paymentStatus: 'UNPAID',
              notes: row.notes?.trim() || null,
              flightBooking: {
                create: {
                  airline: row.airline.trim(),
                  flightNumber: row.flightNumber.trim(),
                  departureAirport: row.departureAirport.trim(),
                  arrivalAirport: row.arrivalAirport.trim(),
                  departureCity: row.departureCity.trim(),
                  arrivalCity: row.arrivalCity.trim(),
                  departureDatetime: new Date(row.departureDatetime.trim()),
                  arrivalDatetime: new Date(row.arrivalDatetime.trim()),
                  ticketNumber: row.ticketNumber?.trim() || null,
                  reservationReference:
                    row.reservationReference?.trim() || null,
                  passengerCount: row.passengerCount?.trim()
                    ? parseInt(row.passengerCount, 10)
                    : 1,
                },
              },
            },
          });
          successRows++;
        } catch (err) {
          failedRows++;
          errors.push({
            rowNumber,
            errorMessage: `Database error: ${err.message}`,
            rawData: JSON.stringify(row),
          });
        }
      }

      // Save errors
      if (errors.length > 0) {
        await this.prisma.importError.createMany({
          data: errors.map((e) => ({
            importBatchId: batch.id,
            rowNumber: e.rowNumber,
            fieldName: e.fieldName || null,
            errorMessage: e.errorMessage,
            rawData: e.rawData || null,
          })),
        });
      }

      const finalStatus =
        failedRows === totalRows ? ImportStatus.FAILED : ImportStatus.COMPLETED;

      const updatedBatch = await this.prisma.importBatch.update({
        where: { id: batch.id },
        data: { status: finalStatus, totalRows, successRows, failedRows },
        include: { errors: true },
      });

      await this.prisma.activityLog.create({
        data: {
          userId,
          action: 'IMPORT_FLIGHT_BOOKINGS',
          entityType: 'IMPORT_BATCH',
          entityId: batch.id,
          description: `Imported flight bookings: ${successRows} succeeded, ${failedRows} failed out of ${totalRows} rows`,
        },
      });

      return updatedBatch;
    } catch (err) {
      await this.prisma.importBatch.update({
        where: { id: batch.id },
        data: { status: ImportStatus.FAILED },
      });
      this.logger.error(
        `Flight booking import failed: ${err.message}`,
        err.stack,
      );
      throw new BadRequestException(`Import failed: ${err.message}`);
    }
  }

  // ── Payment import ─────────────────────────────────────────────────────

  async processPaymentImport(filePath: string, userId: string) {
    const fileType = this.getFileType(filePath);

    const batch = await this.prisma.importBatch.create({
      data: {
        fileName: path.basename(filePath),
        fileType,
        importType: ImportType.PAYMENT,
        status: ImportStatus.VALIDATING,
        uploadedById: userId,
      },
    });

    try {
      const rows = this.parseFile(filePath, fileType);
      const totalRows = rows.length;

      await this.prisma.importBatch.update({
        where: { id: batch.id },
        data: { totalRows, status: ImportStatus.IMPORTING },
      });

      let successRows = 0;
      let failedRows = 0;
      const errors: {
        rowNumber: number;
        fieldName?: string;
        errorMessage: string;
        rawData?: string;
      }[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNumber = i + 2;
        const rowErrors: string[] = [];

        // Required fields
        if (!row.bookingId?.trim()) rowErrors.push('bookingId is required');
        if (!row.amount?.trim()) {
          rowErrors.push('amount is required');
        } else if (isNaN(Number(row.amount)) || Number(row.amount) <= 0) {
          rowErrors.push('amount must be a positive number');
        }
        if (!row.paymentMethod?.trim()) {
          rowErrors.push('paymentMethod is required');
        } else {
          const method = row.paymentMethod.trim().toUpperCase();
          if (!Object.values(PaymentMethod).includes(method as PaymentMethod)) {
            rowErrors.push(`paymentMethod must be one of: ${Object.values(PaymentMethod).join(', ')}`);
          }
        }
        if (row.paymentDate?.trim() && !isValidDate(row.paymentDate)) {
          rowErrors.push('paymentDate is not a valid date');
        }

        if (rowErrors.length > 0) {
          failedRows++;
          for (const errMsg of rowErrors) {
            errors.push({
              rowNumber,
              fieldName: errMsg.split(' ')[0],
              errorMessage: errMsg,
              rawData: JSON.stringify(row),
            });
          }
          continue;
        }

        // Run transaction for database insertion and amount recalculation
        try {
          const bookingId = row.bookingId.trim();
          const amount = Number(row.amount);
          const paymentMethod = row.paymentMethod.trim().toUpperCase() as PaymentMethod;
          const referenceNumber = row.referenceNumber?.trim() || null;
          const notes = row.notes?.trim() || null;
          const paymentDate = row.paymentDate?.trim() ? new Date(row.paymentDate.trim()) : new Date();

          await this.prisma.$transaction(async (tx) => {
            const booking = await tx.booking.findUnique({
              where: { id: bookingId },
            });

            if (!booking) {
              throw new NotFoundException(`Booking with ID "${bookingId}" not found`);
            }

            const bookingTotalPrice = Number(booking.totalPrice);
            const bookingPaidAmount = Number(booking.paidAmount);
            const newPaidAmount = bookingPaidAmount + amount;

            if (newPaidAmount > bookingTotalPrice) {
              throw new BadRequestException(
                `Payment amount (${amount} TND) exceeds the remaining booking balance (${bookingTotalPrice - bookingPaidAmount} TND).`,
              );
            }

            await tx.payment.create({
              data: {
                bookingId,
                createdByUserId: userId,
                amount,
                paymentMethod,
                referenceNumber,
                notes,
                paymentDate,
              },
            });

            const remainingAmount = bookingTotalPrice - newPaidAmount;
            let paymentStatus: PaymentStatus = 'UNPAID';

            if (remainingAmount <= 0) {
              paymentStatus = 'PAID';
            } else if (newPaidAmount > 0) {
              paymentStatus = 'PARTIALLY_PAID';
            }

            await tx.booking.update({
              where: { id: bookingId },
              data: {
                paidAmount: newPaidAmount,
                remainingAmount,
                paymentStatus,
              },
            });
          });

          successRows++;
        } catch (err) {
          failedRows++;
          errors.push({
            rowNumber,
            errorMessage: err.message,
            rawData: JSON.stringify(row),
          });
        }
      }

      // Save errors
      if (errors.length > 0) {
        await this.prisma.importError.createMany({
          data: errors.map((e) => ({
            importBatchId: batch.id,
            rowNumber: e.rowNumber,
            fieldName: e.fieldName || null,
            errorMessage: e.errorMessage,
            rawData: e.rawData || null,
          })),
        });
      }

      const finalStatus =
        failedRows === totalRows ? ImportStatus.FAILED : ImportStatus.COMPLETED;

      const updatedBatch = await this.prisma.importBatch.update({
        where: { id: batch.id },
        data: { status: finalStatus, totalRows, successRows, failedRows },
        include: { errors: true },
      });

      await this.prisma.activityLog.create({
        data: {
          userId,
          action: 'IMPORT_PAYMENTS',
          entityType: 'IMPORT_BATCH',
          entityId: batch.id,
          description: `Imported payments: ${successRows} succeeded, ${failedRows} failed out of ${totalRows} rows`,
        },
      });

      return updatedBatch;
    } catch (err) {
      await this.prisma.importBatch.update({
        where: { id: batch.id },
        data: { status: ImportStatus.FAILED },
      });
      this.logger.error(`Payment import failed: ${err.message}`, err.stack);
      throw new BadRequestException(`Import failed: ${err.message}`);
    }
  }

  // ── List all import batches ────────────────────────────────────────────

  async findAll() {
    return this.prisma.importBatch.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        uploadedBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        _count: {
          select: { errors: true },
        },
      },
    });
  }

  // ── Get single batch with errors ───────────────────────────────────────

  async findOne(id: string) {
    const batch = await this.prisma.importBatch.findUnique({
      where: { id },
      include: {
        uploadedBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        errors: {
          orderBy: { rowNumber: 'asc' },
        },
      },
    });

    if (!batch) {
      throw new NotFoundException('Import batch not found');
    }

    return batch;
  }

  // ── Get CSV template ───────────────────────────────────────────────────

  getTemplate(importType: ImportType): { fileName: string; content: string } {
    let columns: readonly string[];
    let fileName: string;

    switch (importType) {
      case ImportType.CUSTOMER:
        columns = CUSTOMER_COLUMNS;
        fileName = 'customer_import_template.csv';
        break;
      case ImportType.HOTEL_BOOKING:
        columns = HOTEL_BOOKING_COLUMNS;
        fileName = 'hotel_booking_import_template.csv';
        break;
      case ImportType.FLIGHT_BOOKING:
        columns = FLIGHT_BOOKING_COLUMNS;
        fileName = 'flight_booking_import_template.csv';
        break;
      case ImportType.PAYMENT:
        columns = [
          'bookingId',
          'amount',
          'paymentMethod',
          'paymentDate',
          'referenceNumber',
          'notes',
        ];
        fileName = 'payment_import_template.csv';
        break;
      default:
        throw new BadRequestException(`Unsupported import type: ${importType}`);
    }

    const content = columns.join(',') + '\n';
    return { fileName, content };
  }
}
