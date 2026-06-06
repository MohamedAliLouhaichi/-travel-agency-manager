import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class BulkDeleteDto {
  @IsArray()
  @ArrayNotEmpty({ message: 'Select at least one item to delete' })
  @IsUUID('4', { each: true, message: 'Each selected item must be a valid ID' })
  ids: string[];
}
