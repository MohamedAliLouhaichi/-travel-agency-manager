import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateSettingDto {
  @IsString({ message: 'Value must be a string' })
  @IsNotEmpty({ message: 'Value is required' })
  value: string;
}
