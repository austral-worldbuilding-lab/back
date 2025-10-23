import { IsNotEmpty, IsString, Validate } from 'class-validator';
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'isSafeTxtFilename', async: false })
export class IsSafeTxtFilename implements ValidatorConstraintInterface {
  validate(filename: string, _args: ValidationArguments) {
    // Disallow path traversal and path separators, require .txt extension
    return !(
      filename.includes('..') ||
      filename.includes('/') ||
      filename.includes('\\') ||
      !filename.endsWith('.txt')
    );
  }
  defaultMessage(_args: ValidationArguments) {
    return 'Filename must be a safe .txt file (no path traversal, no slashes, must end with .txt)';
  }
}

export class UploadContextDto {
  @IsString()
  @IsNotEmpty()
  @Validate(IsSafeTxtFilename)
  filename!: string;

  @IsString()
  @IsNotEmpty()
  content!: string;
}
