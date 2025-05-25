import { IsNotEmpty, IsEmail, IsBoolean } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  firebaseUid!: string;

  @IsNotEmpty()
  username!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsBoolean()
  is_active?: boolean = true;
}
