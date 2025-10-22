import { IsNotEmpty, IsString } from 'class-validator';

export class UploadContextDto {
  @IsString()
  @IsNotEmpty()
  filename: string;

  @IsString()
  @IsNotEmpty()
  content: string;
}
