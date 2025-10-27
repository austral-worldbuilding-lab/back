import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class UpdateOrganizationUserRoleDto {
  @ApiProperty({
    description: 'Nuevo rol del usuario en la organización',
    example: 'facilitador',
    enum: ['dueño', 'facilitador', 'worldbuilder', 'lector'],
  })
  @IsNotEmpty({ message: 'El rol es requerido' })
  @IsString({ message: 'El rol debe ser una cadena de texto' })
  @IsIn(['dueño', 'facilitador', 'worldbuilder', 'lector'], {
    message: 'El rol debe ser uno de: dueño, facilitador, worldbuilder, lector',
  })
  role!: string;
}
