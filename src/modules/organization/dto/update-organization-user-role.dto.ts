import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class UpdateOrganizationUserRoleDto {
  @ApiProperty({
    description: 'Nuevo rol del usuario en la organización',
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
