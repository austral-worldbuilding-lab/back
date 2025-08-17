import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class UpdateUserRoleDto {
  @ApiProperty({
    description: 'Nuevo rol del usuario en el proyecto',
    example: 'admin',
    enum: ['owner', 'admin', 'member', 'viewer'],
  })
  @IsNotEmpty({ message: 'El rol es requerido' })
  @IsString({ message: 'El rol debe ser una cadena de texto' })
  @IsIn(['owner', 'admin', 'member', 'viewer'], {
    message: 'El rol debe ser uno de: owner, admin, member, viewer',
  })
  role!: string;
}
