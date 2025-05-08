import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class MinValuePipe implements PipeTransform<number, number> {
  constructor(private readonly minValue: number) {}

  transform(value: number, metadata: ArgumentMetadata): number {
    if (value < this.minValue) {
      throw new BadRequestException(
        `${metadata.data} must not be less than ${this.minValue}`,
      );
    }
    return value;
  }
}
