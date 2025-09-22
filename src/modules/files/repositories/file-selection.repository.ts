import { PrismaService } from '@modules/prisma/prisma.service';
import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { UpdateFileSelectionDto } from '../dto/file-selection.dto';
import { FileScope } from '../types/file-scope.type';

@Injectable()
export class FileSelectionRepository {
  private readonly logger = new Logger(FileSelectionRepository.name);

  constructor(private prisma: PrismaService) {}

  async updateFileSelections(
    scope: FileScope,
    selections: UpdateFileSelectionDto[],
  ): Promise<void> {
    this.logger.debug(
      `Updating ${selections.length} file selections for scope: orgId=${scope.orgId}, projectId=${scope.projectId}, mandalaId=${scope.mandalaId}`,
    );

    await this.prisma.$transaction(async (tx) => {
      for (const selection of selections) {
        let whereClause: Prisma.FileSelectionWhereUniqueInput;
        if (scope.mandalaId) {
          whereClause = {
            mandala_file_unique: {
              orgId: scope.orgId,
              projectId: scope.projectId!,
              mandalaId: scope.mandalaId,
              fileName: selection.fileName,
            },
          };
        } else if (scope.projectId) {
          whereClause = {
            project_file_unique: {
              orgId: scope.orgId,
              projectId: scope.projectId,
              fileName: selection.fileName,
            },
          };
        } else {
          whereClause = {
            org_file_unique: {
              orgId: scope.orgId,
              fileName: selection.fileName,
            },
          };
        }

        await tx.fileSelection.upsert({
          where: whereClause,
          update: {
            selected: selection.selected,
            updatedAt: new Date(),
          },
          create: {
            orgId: scope.orgId,
            projectId: scope.projectId ?? null,
            mandalaId: scope.mandalaId ?? null,
            fileName: selection.fileName,
            selected: selection.selected,
          },
        });
      }
    });

    this.logger.debug('File selections updated successfully');
  }

  async getFileSelections(scope: FileScope): Promise<Map<string, boolean>> {
    this.logger.debug(
      `Retrieving file selections for scope: orgId=${scope.orgId}, projectId=${scope.projectId}, mandalaId=${scope.mandalaId}`,
    );

    const selections = await this.prisma.fileSelection.findMany({
      where: {
        orgId: scope.orgId,
        projectId: scope.projectId ?? null,
        mandalaId: scope.mandalaId ?? null,
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

    this.logger.debug(`Retrieved ${selections.length} file selections`);
    return selectionMap;
  }

  async deleteSelectionsForMissingFiles(
    scope: FileScope,
    existingFileNames: string[],
  ): Promise<void> {
    this.logger.debug(
      `Cleaning up selections for missing files in scope: orgId=${scope.orgId}, projectId=${scope.projectId}, mandalaId=${scope.mandalaId}`,
    );

    const deleteResult = await this.prisma.fileSelection.deleteMany({
      where: {
        orgId: scope.orgId,
        projectId: scope.projectId ?? null,
        mandalaId: scope.mandalaId ?? null,
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
    const selections = await this.prisma.fileSelection.findMany({
      where: {
        orgId: scope.orgId,
        projectId: scope.projectId ?? null,
        mandalaId: scope.mandalaId ?? null,
      },
      select: {
        fileName: true,
      },
    });

    return selections.map((selection) => selection.fileName);
  }
}
