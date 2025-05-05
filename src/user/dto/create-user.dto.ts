import { IsNotEmpty, IsEmail, IsBoolean } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  username!: string;

  @IsNotEmpty()
  first_name!: string;

  @IsNotEmpty()
  last_name!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsBoolean()
  is_active?: boolean = true;
}
