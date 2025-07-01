import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { BadRequestException } from '@common/exceptions/custom-exceptions';

@Injectable()
export class EnumValidationPipe implements PipeTransform<unknown, unknown> {
  constructor(
    private readonly enumType: object,
    private readonly isArray = false,
  ) {}

  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    if (value === undefined || value === null) {
      return value;
    }

    const validValues = Object.values(this.enumType);

    if (this.isArray) {
      let valuesArray: unknown[] = [];

      if (Array.isArray(value)) {
        valuesArray = value;
      } else if (typeof value === 'string') {
        valuesArray = value.split(',');
      } else {
        throw new BadRequestException(
          `${metadata.data ?? 'value'} must be a string or array representing enum values`,
        );
      }

      const allValid = valuesArray.every((v) =>
        validValues.includes(v as never),
      );

      if (!allValid) {
        throw new BadRequestException(
          `${metadata.data ?? 'value'} must contain only valid enum values: ${validValues.join(', ')}`,
        );
      }
      return valuesArray as unknown;
    }

    if (!validValues.includes(value as never)) {
      throw new BadRequestException(
        `${metadata.data ?? 'value'} must be one of: ${validValues.join(', ')}`,
      );
    }

    return value;
  }
}
