import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ImageFileValidationPipe implements PipeTransform {
  private readonly allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

  transform(value: string): string {
    if (!value) {
      return value;
    }

    const extension = this.getFileExtension(value);
    
    if (!this.allowedExtensions.includes(extension)) {
      throw new BadRequestException(
        `Invalid image file extension. Allowed extensions: ${this.allowedExtensions.join(', ')}`
      );
    }

    return value;
  }

  private getFileExtension(fileName: string): string {
    const lastDotIndex = fileName.lastIndexOf('.');
    if (lastDotIndex === -1) {
      throw new BadRequestException('File name must have an extension');
    }
    return fileName.substring(lastDotIndex).toLowerCase();
  }
}
