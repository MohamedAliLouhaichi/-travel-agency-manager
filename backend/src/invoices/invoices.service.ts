import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import PDFDocument from 'pdfkit';

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate an invoice for a booking: creates a PDF and stores the invoice record.
   */
  async generate(bookingId: string, userId: string) {
    // 1. Fetch booking with all related data
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: true,
        hotelBooking: true,
        flightBooking: true,
        payments: {
          orderBy: { paymentDate: 'asc' },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // 2. Generate sequential invoice number: {PREFIX}-{YEAR}-{SEQUENTIAL_PADDED_4}
    const [agencyNameSetting, invoicePrefixSetting, currencySetting] =
      await Promise.all([
        this.prisma.setting.findUnique({ where: { key: 'agency_name' } }),
        this.prisma.setting.findUnique({ where: { key: 'invoice_prefix' } }),
        this.prisma.setting.findUnique({ where: { key: 'currency' } }),
      ]);

    const invoicePrefix =
      (invoicePrefixSetting?.value || 'INV').replace(/[^A-Za-z0-9_-]/g, '') ||
      'INV';
    const currentYear = new Date().getFullYear();
    const yearPrefix = `${invoicePrefix}-${currentYear}-`;

    const lastInvoice = await this.prisma.invoice.findFirst({
      where: {
        invoiceNumber: { startsWith: yearPrefix },
      },
      orderBy: { invoiceNumber: 'desc' },
    });

    let sequenceNumber = 1;
    if (lastInvoice) {
      const lastSequence = parseInt(
        lastInvoice.invoiceNumber.replace(yearPrefix, ''),
        10,
      );
      sequenceNumber = lastSequence + 1;
    }

    const invoiceNumber = `${yearPrefix}${String(sequenceNumber).padStart(4, '0')}`;

    // 3. Use agency settings in the generated document
    const agencyName = agencyNameSetting?.value || 'Travel Agency';
    const currency = currencySetting?.value || 'TND';

    // 4. Create the PDF
    const invoicesDir = path.resolve('./invoices');
    if (!fs.existsSync(invoicesDir)) {
      fs.mkdirSync(invoicesDir, { recursive: true });
    }

    const pdfFileName = `${invoiceNumber}.pdf`;
    const pdfPath = path.join(invoicesDir, pdfFileName);

    try {
      await this.generatePdf(pdfPath, {
        agencyName,
        currency,
        invoiceNumber,
        issueDate: new Date(),
        customer: booking.customer,
        booking,
        hotelBooking: booking.hotelBooking,
        flightBooking: booking.flightBooking,
        payments: booking.payments,
      });
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to generate PDF: ${error.message}`,
      );
    }

    // 5. Create invoice record in DB
    const invoice = await this.prisma.invoice.create({
      data: {
        invoiceNumber,
        bookingId: booking.id,
        customerId: booking.customerId,
        generatedById: userId,
        totalAmount: booking.totalPrice,
        paidAmount: booking.paidAmount,
        remainingAmount: booking.remainingAmount,
        pdfPath,
      },
      include: {
        booking: true,
        customer: true,
        generatedByUser: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    // 6. Log activity
    await this.prisma.activityLog.create({
      data: {
        userId,
        action: 'GENERATE_INVOICE',
        entityType: 'INVOICE',
        entityId: invoice.id,
        description: `Generated invoice ${invoiceNumber} for booking ${bookingId} (Customer: ${booking.customer.firstName} ${booking.customer.lastName})`,
      },
    });

    return invoice;
  }

  /**
   * List invoices with optional filters.
   */
  async findAll(filters: {
    customerId?: string;
    bookingId?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    const where: any = {};

    if (filters.customerId) {
      where.customerId = filters.customerId;
    }
    if (filters.bookingId) {
      where.bookingId = filters.bookingId;
    }
    if (filters.dateFrom || filters.dateTo) {
      where.issueDate = {};
      if (filters.dateFrom) {
        where.issueDate.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        const endDate = new Date(filters.dateTo);
        endDate.setHours(23, 59, 59, 999);
        where.issueDate.lte = endDate;
      }
    }

    return this.prisma.invoice.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
        booking: {
          select: {
            id: true,
            bookingType: true,
            destination: true,
            bookingStatus: true,
          },
        },
        generatedByUser: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
      orderBy: {
        issueDate: 'desc',
      },
    });
  }

  /**
   * Get a single invoice with all relations.
   */
  async findOne(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        booking: {
          include: {
            hotelBooking: true,
            flightBooking: true,
            payments: {
              orderBy: { paymentDate: 'asc' },
            },
          },
        },
        generatedByUser: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  /**
   * Returns the PDF file path for streaming. Throws if file doesn't exist.
   */
  async getInvoicePdf(id: string): Promise<string> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (!fs.existsSync(invoice.pdfPath)) {
      throw new NotFoundException('Invoice PDF file not found on disk');
    }

    return invoice.pdfPath;
  }

  // ───────────────────────────────────────────────────
  // Private helpers
  // ───────────────────────────────────────────────────

  private formatCurrency(value: unknown, currency = 'TND'): string {
    return `${Number(value).toFixed(3)} ${currency}`;
  }

  private formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  private generatePdf(
    filePath: string,
    data: {
      agencyName: string;
      currency: string;
      invoiceNumber: string;
      issueDate: Date;
      customer: any;
      booking: any;
      hotelBooking: any;
      flightBooking: any;
      payments: any[];
    },
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const stream = fs.createWriteStream(filePath);

        doc.pipe(stream);

        // ── Header ──
        doc
          .fontSize(22)
          .font('Helvetica-Bold')
          .text(data.agencyName, { align: 'center' });
        doc.moveDown(0.3);
        doc
          .fontSize(10)
          .font('Helvetica')
          .fillColor('#666666')
          .text('Travel Agency Management', { align: 'center' });
        doc.moveDown(0.5);

        // Separator line
        doc
          .strokeColor('#333333')
          .lineWidth(1)
          .moveTo(50, doc.y)
          .lineTo(545, doc.y)
          .stroke();
        doc.moveDown(1);

        // ── Invoice Info ──
        doc
          .fontSize(16)
          .font('Helvetica-Bold')
          .fillColor('#000000')
          .text('INVOICE', { align: 'left' });
        doc.moveDown(0.5);

        const infoTop = doc.y;

        doc.fontSize(10).font('Helvetica');
        doc.text(`Invoice Number: `, 50, infoTop, { continued: true });
        doc.font('Helvetica-Bold').text(data.invoiceNumber);

        doc.font('Helvetica').text(`Issue Date: `, 50, infoTop + 16, { continued: true });
        doc.font('Helvetica-Bold').text(this.formatDate(data.issueDate));

        doc.font('Helvetica').text(`Booking Type: `, 50, infoTop + 32, { continued: true });
        doc.font('Helvetica-Bold').text(data.booking.bookingType);

        doc.moveDown(1.5);

        // ── Customer Info ──
        this.drawSectionHeader(doc, 'CUSTOMER INFORMATION');

        doc.fontSize(10).font('Helvetica');
        const custY = doc.y;
        doc.text(`Name: ${data.customer.firstName} ${data.customer.lastName}`, 50, custY);
        doc.text(`Phone: ${data.customer.phone || 'N/A'}`, 50);
        doc.text(`Email: ${data.customer.email || 'N/A'}`, 50);
        if (data.customer.address) {
          doc.text(`Address: ${data.customer.address}`, 50);
        }
        if (data.customer.passportNumber) {
          doc.text(`Passport: ${data.customer.passportNumber}`, 50);
        }
        doc.moveDown(1);

        // ── Booking Details ──
        if (data.hotelBooking) {
          this.drawSectionHeader(doc, 'HOTEL BOOKING DETAILS');
          doc.fontSize(10).font('Helvetica');

          const hotel = data.hotelBooking;
          const details = [
            ['Hotel', hotel.hotelName],
            ['Location', `${hotel.city}, ${hotel.country}`],
            ['Check-in', this.formatDate(hotel.checkInDate)],
            ['Check-out', this.formatDate(hotel.checkOutDate)],
            ['Nights', String(hotel.numberOfNights)],
            ['Room Type', hotel.roomType],
            ['Rooms', String(hotel.numberOfRooms)],
            ['Guests', String(hotel.numberOfGuests)],
            ['Board Type', hotel.boardType],
          ];
          if (hotel.confirmationNumber) {
            details.push(['Confirmation #', hotel.confirmationNumber]);
          }

          this.drawKeyValueTable(doc, details);
          doc.moveDown(1);
        }

        if (data.flightBooking) {
          this.drawSectionHeader(doc, 'FLIGHT BOOKING DETAILS');
          doc.fontSize(10).font('Helvetica');

          const flight = data.flightBooking;
          const details = [
            ['Airline', flight.airline],
            ['Flight Number', flight.flightNumber],
            ['From', `${flight.departureCity} (${flight.departureAirport})`],
            ['To', `${flight.arrivalCity} (${flight.arrivalAirport})`],
            ['Departure', this.formatDate(flight.departureDatetime)],
            ['Arrival', this.formatDate(flight.arrivalDatetime)],
            ['Passengers', String(flight.passengerCount)],
          ];
          if (flight.ticketNumber) {
            details.push(['Ticket #', flight.ticketNumber]);
          }
          if (flight.reservationReference) {
            details.push(['Reservation Ref', flight.reservationReference]);
          }

          this.drawKeyValueTable(doc, details);
          doc.moveDown(1);
        }

        // ── Payment History ──
        if (data.payments.length > 0) {
          this.drawSectionHeader(doc, 'PAYMENT HISTORY');

          // Table header
          const tableTop = doc.y;
          const col1 = 50;
          const col2 = 160;
          const col3 = 290;
          const col4 = 400;

          doc.fontSize(9).font('Helvetica-Bold');
          doc.text('Date', col1, tableTop);
          doc.text('Method', col2, tableTop);
          doc.text('Reference', col3, tableTop);
          doc.text('Amount', col4, tableTop);

          doc
            .strokeColor('#cccccc')
            .lineWidth(0.5)
            .moveTo(50, tableTop + 14)
            .lineTo(545, tableTop + 14)
            .stroke();

          let rowY = tableTop + 20;
          doc.font('Helvetica').fontSize(9);

          for (const payment of data.payments) {
            // Check if we need a new page
            if (rowY > 700) {
              doc.addPage();
              rowY = 50;
            }

            doc.text(this.formatDate(payment.paymentDate), col1, rowY);
            doc.text(payment.paymentMethod, col2, rowY);
            doc.text(payment.referenceNumber || '-', col3, rowY);
            doc.text(this.formatCurrency(payment.amount, data.currency), col4, rowY);
            rowY += 16;
          }

          doc.y = rowY;
          doc.moveDown(1);
        }

        // ── Financial Summary ──
        this.drawSectionHeader(doc, 'FINANCIAL SUMMARY');

        // Summary box
        const summaryY = doc.y;
        doc
          .rect(50, summaryY, 495, 70)
          .fillColor('#f5f5f5')
          .fill();

        doc.fillColor('#000000');
        doc.fontSize(11).font('Helvetica');

        doc.text('Total Amount:', 70, summaryY + 12, { continued: true, width: 200 });
        doc.font('Helvetica-Bold').text(`  ${this.formatCurrency(data.booking.totalPrice, data.currency)}`, { align: 'left' });

        doc.font('Helvetica').text('Paid Amount:', 70, summaryY + 30, { continued: true, width: 200 });
        doc.font('Helvetica-Bold').fillColor('#2e7d32').text(`  ${this.formatCurrency(data.booking.paidAmount, data.currency)}`, { align: 'left' });

        doc.font('Helvetica').fillColor('#000000').text('Remaining Amount:', 70, summaryY + 48, { continued: true, width: 200 });
        const remainingColor = Number(data.booking.remainingAmount) > 0 ? '#c62828' : '#2e7d32';
        doc.font('Helvetica-Bold').fillColor(remainingColor).text(`  ${this.formatCurrency(data.booking.remainingAmount, data.currency)}`, { align: 'left' });

        doc.fillColor('#000000');
        doc.y = summaryY + 85;

        // ── Footer ──
        doc.moveDown(2);
        doc
          .strokeColor('#333333')
          .lineWidth(0.5)
          .moveTo(50, doc.y)
          .lineTo(545, doc.y)
          .stroke();
        doc.moveDown(0.5);

        doc
          .fontSize(8)
          .font('Helvetica')
          .fillColor('#999999')
          .text(
            `Generated on ${this.formatDate(new Date())} | ${data.agencyName}`,
            50,
            doc.y,
            { align: 'center' },
          );

        doc.end();

        stream.on('finish', () => resolve());
        stream.on('error', (err) => reject(err));
      } catch (error) {
        reject(error);
      }
    });
  }

  private drawSectionHeader(doc: PDFKit.PDFDocument, title: string): void {
    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .fillColor('#1a237e')
      .text(title);
    doc
      .strokeColor('#1a237e')
      .lineWidth(0.5)
      .moveTo(50, doc.y + 2)
      .lineTo(545, doc.y + 2)
      .stroke();
    doc.moveDown(0.5);
    doc.fillColor('#000000');
  }

  private drawKeyValueTable(
    doc: PDFKit.PDFDocument,
    rows: any[][],
  ): void {
    doc.fontSize(10).font('Helvetica');
    for (const [label, value] of rows) {
      doc.font('Helvetica-Bold').text(`${label}: `, 60, doc.y, { continued: true });
      doc.font('Helvetica').text(value);
    }
  }
}
