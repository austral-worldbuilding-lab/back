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
      const valuesArray = !Array.isArray(value)
        ? String(value).split(',')
        : value;
      const allValid = valuesArray.every((v) =>
        validValues.includes(v as never),
      );

      if (!allValid) {
        throw new BadRequestException(
          `${metadata.data ?? 'value'} must be a comma-separated list of valid enum values: ${validValues.join(', ')}`,
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
