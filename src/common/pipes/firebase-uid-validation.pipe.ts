import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class FirebaseUidValidationPipe implements PipeTransform<string> {
  private readonly uidRegex = /^[A-Za-z0-9]{28,128}$/;

  transform(value: string): string {
    if (!this.uidRegex.test(value)) {
      throw new BadRequestException(`'${value}' is not a valid Firebase UID`);
    }
    return value;
  }
}
