import { IsEnum, IsNotEmpty } from 'class-validator';
import { ImportType } from '@prisma/client';

export class CreateImportDto {
  @IsEnum(ImportType, {
    message: `Import type must be one of: ${Object.values(ImportType).join(', ')}`,
  })
  @IsNotEmpty({ message: 'Import type is required' })
  importType: ImportType;
}
