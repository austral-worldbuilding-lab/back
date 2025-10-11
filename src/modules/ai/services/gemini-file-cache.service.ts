import { AppLogger } from '@common/services/logger.service';
import { FileScope } from '@modules/files/types/file-scope.type';
import { Injectable } from '@nestjs/common';

import { PrismaService } from '@/modules/prisma/prisma.service';

export interface CachedFileInfo {
  fileName: string;
  geminiUri: string;
  geminiFileId: string;
}

@Injectable()
export class GeminiFileCacheService {
  constructor(
    private prisma: PrismaService,
    private logger: AppLogger,
  ) {
    this.logger.setContext(GeminiFileCacheService.name);
  }

  async findValidCached(
    scope: FileScope,
    fileNames: string[],
  ): Promise<CachedFileInfo[]> {
    const contextPath = this.buildContextPath(scope);
    const now = new Date();

    const cached = await this.prisma.geminiFileCache.findMany({
      where: {
        contextPath,
        fileName: { in: fileNames },
        expiresAt: { gt: now },
      },
      select: {
        fileName: true,
        geminiUri: true,
        geminiFileId: true,
      },
    });

    if (cached.length > 0) {
      this.logger.log(`Cache HIT: ${cached.length}/${fileNames.length} files`, {
        contextPath,
      });
    } else {
      this.logger.debug('Cache MISS: No valid cached files found', {
        contextPath,
        requestedFiles: fileNames.length,
      });
    }

    return cached as CachedFileInfo[];
  }

  upsert(data: {
    fileName: string;
    fileHash: string;
    contextPath: string;
    geminiFileId: string;
    geminiUri: string;
    expiresAt: Date;
  }) {
    this.logger.debug(`Upserting cache entry for ${data.fileName}`);

    return this.prisma.geminiFileCache.upsert({
      where: {
        contextPath_fileName: {
          contextPath: data.contextPath,
          fileName: data.fileName,
        },
      },
      update: {
        fileHash: data.fileHash,
        geminiFileId: data.geminiFileId,
        geminiUri: data.geminiUri,
        expiresAt: data.expiresAt,
        updatedAt: new Date(),
      },
      create: data,
    });
  }

  buildContextPath(scope: FileScope): string {
    const parts = [`org/${scope.orgId}`];
    if (scope.projectId) parts.push(`project/${scope.projectId}`);
    if (scope.mandalaId) parts.push(`mandala/${scope.mandalaId}`);
    return parts.join('/');
  }
}
