import { BadRequestException } from '@common/exceptions/custom-exceptions';
import { PipeTransform, Injectable } from '@nestjs/common';
import { isUUID } from 'class-validator';

@Injectable()
export class UuidValidationPipe
  implements PipeTransform<string | undefined, string | undefined>
{
  transform(value: string | undefined): string | undefined {
    // If the value is undefined or null (optional query param), skip validation.
    if (value === undefined || value === null) {
      return value;
    }

    if (!isUUID(value)) {
      throw new BadRequestException(
        `El valor '${value}' no es un UUID válido.`,
      );
    }
    return value;
  }
}
