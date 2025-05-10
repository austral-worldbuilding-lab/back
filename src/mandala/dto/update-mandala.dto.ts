import { PartialType } from '@nestjs/mapped-types';
import { CreateMandalaDto } from './create-mandala.dto';

export class UpdateMandalaDto extends PartialType(CreateMandalaDto) {}
