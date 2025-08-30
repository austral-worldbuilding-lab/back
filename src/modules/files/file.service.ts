import { ResourceNotFoundException } from '@common/exceptions/custom-exceptions';
import { PresignedUrl } from '@common/types/presigned-url';
import { PrismaService } from '@modules/prisma/prisma.service';
import { AzureBlobStorageService } from '@modules/storage/AzureBlobStorageService';
import { buildPrefix } from '@modules/storage/path-builder';
import { Injectable } from '@nestjs/common';

import { CreateFileDto } from './dto/create-file.dto';
import { FileBuffer } from './types/file-buffer.interface';
import { FileScope, FileSource, EffectiveFile } from './types/file-scope.type';

@Injectable()
export class FileService {
  private storageService = new AzureBlobStorageService();

  constructor(private prisma: PrismaService) {}

  async resolveScope(
    scopeType: 'org' | 'project' | 'mandala',
    id: string,
  ): Promise<FileScope> {
    switch (scopeType) {
      case 'org':
        return { orgId: id };

      case 'project': {
        const project = await this.prisma.project.findFirst({
          where: { id, isActive: true },
          select: { organizationId: true },
        });

        if (!project || !project.organizationId) {
          throw new ResourceNotFoundException('Project', id);
        }

        return { orgId: project.organizationId, projectId: id };
      }

      case 'mandala': {
        const mandala = await this.prisma.mandala.findFirst({
          where: { id, isActive: true },
          select: {
            projectId: true,
            project: { select: { organizationId: true } },
          },
        });

        if (!mandala || !mandala.project.organizationId) {
          throw new ResourceNotFoundException('Mandala', id);
        }

        return {
          orgId: mandala.project.organizationId,
          projectId: mandala.projectId,
          mandalaId: id,
        };
      }

      default:
        throw new Error(`Invalid scope type`);
    }
  }

  private getScopesForInheritance(scope: FileScope): FileScope[] {
    const scopes: FileScope[] = [];

    scopes.push({ orgId: scope.orgId });

    if (scope.projectId) {
      scopes.push({ orgId: scope.orgId, projectId: scope.projectId });
    }

    if (scope.mandalaId) {
      scopes.push(scope);
    }

    return scopes;
  }

  private async mapToEffectiveFiles(
    files: CreateFileDto[],
    source: FileSource,
    scope: FileScope,
  ): Promise<EffectiveFile[]> {
    const effectiveFilesPromises = files.map(async (file) => {
      const fullPath = this.buildFilePath(scope, file.file_name);
      const url = await this.storageService.generateDownloadUrl(fullPath);

      return {
        file_name: file.file_name,
        file_type: file.file_type,
        source_scope: source,
        full_path: fullPath,
        url: url,
      };
    });

    return Promise.all(effectiveFilesPromises);
  }

  private buildFilePath(scope: FileScope, fileName: string): string {
    return `${buildPrefix(scope)}${fileName}`;
  }

  async uploadFiles(
    files: CreateFileDto[],
    scope: FileScope,
  ): Promise<PresignedUrl[]> {
    return this.storageService.uploadFiles(files, scope);
  }

  async getFiles(scope: FileScope): Promise<EffectiveFile[]> {
    const scopes = this.getScopesForInheritance(scope);
    const allFiles: EffectiveFile[] = [];

    for (const inheritanceScope of scopes) {
      const files = await this.storageService.getFiles(inheritanceScope);
      const source: FileSource = this.getScopeSource(inheritanceScope);
      const effectiveFiles = await this.mapToEffectiveFiles(
        files,
        source,
        inheritanceScope,
      );
      allFiles.push(...effectiveFiles);
    }

    return allFiles;
  }

  private getScopeSource(scope: FileScope): FileSource {
    if (scope.mandalaId) return 'mandala';
    if (scope.projectId) return 'project';
    return 'org';
  }

  async getFilesFromScope(scope: FileScope): Promise<CreateFileDto[]> {
    return this.storageService.getFiles(scope);
  }

  async readAllFilesAsBuffers(scope: FileScope): Promise<Buffer[]> {
    const scopes = this.getScopesForInheritance(scope);
    const allBuffers: Buffer[] = [];

    for (const inheritanceScope of scopes) {
      const buffers =
        await this.storageService.readAllFilesAsBuffers(inheritanceScope);
      allBuffers.push(...buffers);
    }

    return allBuffers;
  }

  async readAllFilesAsBuffersWithMetadata(
    scope: FileScope,
  ): Promise<FileBuffer[]> {
    const scopes = this.getScopesForInheritance(scope);
    const allFileBuffers: FileBuffer[] = [];

    for (const inheritanceScope of scopes) {
      const fileBuffers =
        await this.storageService.readAllFilesAsBuffersWithMetadata(
          inheritanceScope,
        );
      allFileBuffers.push(...fileBuffers);
    }

    return allFileBuffers;
  }

  async readAllFilesAsBuffersFromScope(scope: FileScope): Promise<Buffer[]> {
    return this.storageService.readAllFilesAsBuffers(scope);
  }

  async readAllFilesAsBuffersWithMetadataFromScope(
    scope: FileScope,
  ): Promise<FileBuffer[]> {
    return this.storageService.readAllFilesAsBuffersWithMetadata(scope);
  }

  async deleteFile(scope: FileScope, fileName: string): Promise<void> {
    return this.storageService.deleteFile(scope, fileName);
  }

  // Legacy methods for backward compatibility with existing project-based API
  async uploadFilesLegacy(
    files: CreateFileDto[],
    projectId: string,
  ): Promise<PresignedUrl[]> {
    const scope = await this.resolveScope('project', projectId);
    return this.uploadFiles(files, scope);
  }

  async getFilesLegacy(projectId: string): Promise<CreateFileDto[]> {
    const scope = await this.resolveScope('project', projectId);
    return this.getFilesFromScope(scope);
  }

  async readAllFilesAsBuffersLegacy(projectId: string): Promise<Buffer[]> {
    const scope = await this.resolveScope('project', projectId);
    return this.readAllFilesAsBuffers(scope);
  }

  async readAllFilesAsBuffersWithMetadataLegacy(
    projectId: string,
  ): Promise<FileBuffer[]> {
    const scope = await this.resolveScope('project', projectId);
    return this.readAllFilesAsBuffersWithMetadata(scope);
  }

  async deleteFileLegacy(projectId: string, fileName: string): Promise<void> {
    const scope = await this.resolveScope('project', projectId);
    return this.deleteFile(scope, fileName);
  }
}
