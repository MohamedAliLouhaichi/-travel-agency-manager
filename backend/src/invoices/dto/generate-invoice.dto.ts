import { IsNotEmpty, IsUUID } from 'class-validator';

export class GenerateInvoiceDto {
  @IsNotEmpty()
  @IsUUID()
  bookingId: string;
}
