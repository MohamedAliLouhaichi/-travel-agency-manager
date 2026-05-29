import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Res,
  NotFoundException,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';
import { InvoicesService } from './invoices.service';
import { GenerateInvoiceDto } from './dto/generate-invoice.dto';
import * as path from 'path';

@Controller('invoices')
@UseGuards(JwtAuthGuard)
export class InvoicesController {
  constructor(private invoicesService: InvoicesService) {}

  @Post('generate')
  generate(
    @Body() dto: GenerateInvoiceDto,
    @GetUser() currentUser: any,
  ) {
    return this.invoicesService.generate(dto.bookingId, currentUser.id);
  }

  @Get()
  findAll(
    @Query('customerId') customerId?: string,
    @Query('bookingId') bookingId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.invoicesService.findAll({
      customerId,
      bookingId,
      dateFrom,
      dateTo,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.invoicesService.findOne(id);
  }

  @Get(':id/pdf')
  async downloadPdf(@Param('id') id: string, @Res() res: Response) {
    const pdfPath = await this.invoicesService.getInvoicePdf(id);
    const fileName = path.basename(pdfPath);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    });

    const fileStream = require('fs').createReadStream(pdfPath);
    fileStream.pipe(res);
  }
}
