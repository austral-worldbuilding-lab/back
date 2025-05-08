import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateMandalaDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsUUID()
  @IsNotEmpty()
  projectId!: string;
}
