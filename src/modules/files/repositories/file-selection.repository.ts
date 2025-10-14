import { AppLogger } from '@common/services/logger.service';
import { PrismaService } from '@modules/prisma/prisma.service';
import { Injectable } from '@nestjs/common';

import { SourceScope, UpdateFileSelectionDto } from '../dto/file-selection.dto';
import { FileScope } from '../types/file-scope.type';
import {
  buildContextPath,
  buildContextPathForSource,
} from '../utils/context-path.utils';

@Injectable()
export class FileSelectionRepository {
  constructor(
    private prisma: PrismaService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(FileSelectionRepository.name);
  }

  private parseScopeFromSourceScope(
    currentScope: FileScope,
    sourceScope: SourceScope,
  ): FileScope {
    switch (sourceScope) {
      case 'org':
        return { orgId: currentScope.orgId };
      case 'project':
        return {
          orgId: currentScope.orgId,
          projectId: currentScope.projectId,
        };
      case 'mandala':
        return currentScope;
    }
  }

  async updateFileSelections(
    scope: FileScope,
    selections: UpdateFileSelectionDto[],
  ): Promise<void> {
    this.logger.debug(
      `Updating ${selections.length} file selections for scope: ${JSON.stringify(scope)}`,
    );

    await this.prisma.$transaction(async (tx) => {
      for (const selection of selections) {
        this.logger.debug(`Processing selection: ${JSON.stringify(selection)}`);

        const contextPath = buildContextPathForSource(
          scope,
          selection.sourceScope,
        );
        const targetScope = this.parseScopeFromSourceScope(
          scope,
          selection.sourceScope,
        );

        await tx.fileSelection.upsert({
          where: {
            contextPath_fileName: {
              contextPath: contextPath,
              fileName: selection.fileName,
            },
          },
          update: {
            selected: selection.selected,
            updatedAt: new Date(),
          },
          create: {
            contextPath: contextPath,
            fileName: selection.fileName,
            orgId: targetScope.orgId,
            projectId: targetScope.projectId || null,
            mandalaId: targetScope.mandalaId || null,
            selected: selection.selected,
          },
        });
      }
    });

    this.logger.debug('File selections updated successfully');
  }

  async getFileSelections(scope: FileScope): Promise<Map<string, boolean>> {
    const contextPath = buildContextPath(scope);
    const selections = await this.prisma.fileSelection.findMany({
      where: {
        contextPath: contextPath,
      },
      select: {
        fileName: true,
        selected: true,
      },
    });

    const selectionMap = new Map<string, boolean>();
    selections.forEach((selection) => {
      selectionMap.set(selection.fileName, selection.selected);
    });

    return selectionMap;
  }

  async deleteSelectionsForMissingFiles(
    scope: FileScope,
    existingFileNames: string[],
  ): Promise<void> {
    const contextPath = buildContextPath(scope);
    this.logger.debug(
      `Cleaning up selections for missing files in contextPath: ${contextPath}`,
    );

    const deleteResult = await this.prisma.fileSelection.deleteMany({
      where: {
        contextPath: contextPath,
        fileName: {
          notIn: existingFileNames,
        },
      },
    });

    if (deleteResult.count > 0) {
      this.logger.debug(
        `Cleaned up ${deleteResult.count} orphaned file selections`,
      );
    }
  }

  async getExplicitlySelectedFileNames(scope: FileScope): Promise<string[]> {
    const contextPath = buildContextPath(scope);

    const selections = await this.prisma.fileSelection.findMany({
      where: {
        contextPath: contextPath,
      },
      select: {
        fileName: true,
      },
    });

    return selections.map((selection) => selection.fileName);
  }
}
