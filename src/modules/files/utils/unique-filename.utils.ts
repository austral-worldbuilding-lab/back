export class UniqueFileNameGenerator {
  static generateUniqueFileName(
    originalFileName: string,
    existingFileNames: string[],
  ): string {
    const existingNamesSet = new Set(existingFileNames);

    if (!existingNamesSet.has(originalFileName)) {
      return originalFileName;
    }

    const { baseName, extension } = this.parseFileName(originalFileName);

    return this.findNextAvailableName(baseName, extension, existingNamesSet);
  }

  static generateUniqueFileNames(
    files: Array<{ file_name: string }>,
    existingFileNames: string[],
  ): Array<{ originalName: string; uniqueName: string }> {
    const existingNamesSet = new Set(existingFileNames);

    return files.map((file) => {
      const uniqueName = this.generateUniqueFileName(
        file.file_name,
        Array.from(existingNamesSet),
      );

      existingNamesSet.add(uniqueName);

      return {
        originalName: file.file_name,
        uniqueName: uniqueName,
      };
    });
  }

  private static parseFileName(fileName: string): {
    baseName: string;
    extension: string;
  } {
    const lastDotIndex = fileName.lastIndexOf('.');
    if (lastDotIndex <= 0) {
      return { baseName: fileName, extension: '' };
    }

    return {
      baseName: fileName.substring(0, lastDotIndex),
      extension: fileName.substring(lastDotIndex),
    };
  }

  private static findNextAvailableName(
    baseName: string,
    extension: string,
    existingNames: Set<string>,
  ): string {
    let counter = 1;
    let candidateName: string;

    do {
      candidateName = `${baseName} (${counter})${extension}`;
      counter++;
    } while (existingNames.has(candidateName));

    return candidateName;
  }
}
