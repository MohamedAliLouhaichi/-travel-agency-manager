import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';
import { ImportsService } from './imports.service';
import { ImportType } from '@prisma/client';
import type { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@Controller('imports')
@UseGuards(JwtAuthGuard)
export class ImportsController {
  constructor(private importsService: ImportsService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: any, // Express.Multer.File
    @Query('importType') importType: ImportType,
    @GetUser() currentUser: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    if (!importType) {
      throw new BadRequestException('importType query parameter is required');
    }
    if (!Object.values(ImportType).includes(importType)) {
      throw new BadRequestException(
        `Invalid importType. Must be one of: ${Object.values(ImportType).join(', ')}`,
      );
    }

    // Ensure uploads/imports directory exists
    const uploadsDir = path.join(process.cwd(), 'uploads', 'imports');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const tempFilePath = path.join(uploadsDir, `${importType}-${uniqueSuffix}${ext}`);

    // Write file to disk
    fs.writeFileSync(tempFilePath, file.buffer);

    try {
      let result;
      switch (importType) {
        case ImportType.CUSTOMER:
          result = await this.importsService.processCustomerImport(tempFilePath, currentUser.id);
          break;
        case ImportType.HOTEL_BOOKING:
          result = await this.importsService.processHotelBookingImport(tempFilePath, currentUser.id);
          break;
        case ImportType.FLIGHT_BOOKING:
          result = await this.importsService.processFlightBookingImport(tempFilePath, currentUser.id);
          break;
        case ImportType.PAYMENT:
          result = await this.importsService.processPaymentImport(tempFilePath, currentUser.id);
          break;
        default:
          throw new BadRequestException(`Unsupported import type: ${importType}`);
      }

      // Delete the file after successful processing
      try {
        fs.unlinkSync(tempFilePath);
      } catch (err) {
        // Log error but don't fail the request
      }

      return result;
    } catch (error) {
      // Clean up the file in case of error
      try {
        fs.unlinkSync(tempFilePath);
      } catch (err) {
        // Ignore
      }
      throw error;
    }
  }

  @Get()
  findAll() {
    return this.importsService.findAll();
  }

  @Get('template')
  getTemplate(@Query('importType') importType: ImportType, @Res() res: Response) {
    if (!importType) {
      throw new BadRequestException('importType query parameter is required');
    }

    const { fileName, content } = this.importsService.getTemplate(importType);

    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    });

    res.send(content);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.importsService.findOne(id);
  }
}
