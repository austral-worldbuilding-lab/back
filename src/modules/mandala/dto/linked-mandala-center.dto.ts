import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LinkedMandalaCenterDto {
    @ApiProperty({
        description: 'Nombre del personaje central',
        example: 'Estudiante',
    })
    @IsString()
    @IsNotEmpty()
    name!: string;

    @ApiProperty({
        description: 'Descripción del personaje central',
        example: 'Alumno de 23 años que estudia en la universidad',
    })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({
        description: 'Color del personaje central en formato hexadecimal',
        example: '#3B82F6',
    })
    @IsString()
    @IsNotEmpty()
    color!: string;
    position!: { x: number; y: number };
    section!: string;
    dimension!: string;
}
