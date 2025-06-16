import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';
import { BadRequestException } from '@common/exceptions/custom-exceptions';

@Injectable()
export class MaxValuePipe implements PipeTransform<number, number> {
  constructor(private readonly maxValue: number) {}

  transform(value: number, metadata: ArgumentMetadata): number {
    if (value > this.maxValue) {
      throw new BadRequestException(
        `${metadata.data} must not be greater than ${this.maxValue}`,
      );
    }
    return value;
  }
}
