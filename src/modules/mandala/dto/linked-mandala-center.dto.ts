import { CenterDto } from '@/common/dto/center.dto';

export class LinkedMandalaCenterDto {
  center!: CenterDto;
  position!: { x: number; y: number };
  section!: string;
  dimension!: string;
}
