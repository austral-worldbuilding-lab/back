import { UuidValidationPipe } from '@common/pipes/uuid-validation.pipe';
import { PresignedUrl } from '@common/types/presigned-url';
import { DataResponse, MessageOnlyResponse } from '@common/types/responses';
import { FirebaseAuthGuard } from '@modules/auth/firebase/firebase.guard';
import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

import {
  ApiGetFiles,
  ApiUploadFiles,
  ApiGetFileBuffers,
  ApiDeleteFile,
} from './decorators/file-swagger.decorators';
import { CreateFileDto } from './dto/create-file.dto';
import { FileService } from './file.service';
import { FileRoleGuard } from './guards/file-role.guard';
import { MandalaFileRoleGuard } from './guards/mandala-file-role.guard';
import { OrganizationFileRoleGuard } from './guards/organization-file-role.guard';
import { ProjectFileRoleGuard } from './guards/project-file-role.guard';
import { EffectiveFile } from './types/file-scope.type';

@ApiTags('Files')
@Controller('files')
@UseGuards(FirebaseAuthGuard)
@ApiBearerAuth()
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Get(':projectId')
  @UseGuards(FileRoleGuard)
  @ApiGetFiles()
  async getFiles(
    @Param('projectId', new UuidValidationPipe()) projectId: string,
  ): Promise<DataResponse<CreateFileDto[]>> {
    const response = await this.fileService.getFilesLegacy(projectId);
    return { data: response };
  }

  @Post(':projectId')
  @UseGuards(FileRoleGuard)
  @ApiUploadFiles()
  async uploadFiles(
    @Param('projectId', new UuidValidationPipe()) projectId: string,
    @Body() body: CreateFileDto[],
  ): Promise<DataResponse<PresignedUrl[]>> {
    const response = await this.fileService.uploadFilesLegacy(body, projectId);
    return { data: response };
  }

  @Get(':projectId/buffers')
  @UseGuards(FileRoleGuard)
  @ApiGetFileBuffers()
  async getFileBuffers(
    @Param('projectId', new UuidValidationPipe()) projectId: string,
  ): Promise<DataResponse<Buffer[]>> {
    const response =
      await this.fileService.readAllFilesAsBuffersLegacy(projectId);
    return { data: response };
  }

  @Delete(':projectId/:fileName')
  @UseGuards(FileRoleGuard)
  @ApiDeleteFile()
  async deleteFile(
    @Param('projectId', new UuidValidationPipe()) projectId: string,
    @Param('fileName') fileName: string,
  ): Promise<MessageOnlyResponse> {
    await this.fileService.deleteFileLegacy(projectId, fileName);
    return {
      message: 'File deleted successfully',
    };
  }

  // === NEW HIERARCHICAL ENDPOINTS ===

  @Post('organization/:orgId')
  @UseGuards(OrganizationFileRoleGuard)
  @ApiUploadFiles()
  async uploadOrganizationFiles(
    @Param('orgId', new UuidValidationPipe()) orgId: string,
    @Body() body: CreateFileDto[],
  ): Promise<DataResponse<PresignedUrl[]>> {
    const scope = await this.fileService.resolveScope('org', orgId);
    const response = await this.fileService.uploadFiles(body, scope);
    return { data: response };
  }

  @Get('organization/:orgId')
  @UseGuards(OrganizationFileRoleGuard)
  @ApiGetFiles()
  async getOrganizationFiles(
    @Param('orgId', new UuidValidationPipe()) orgId: string,
  ): Promise<DataResponse<EffectiveFile[]>> {
    const scope = await this.fileService.resolveScope('org', orgId);
    const response = await this.fileService.getFiles(scope);
    return { data: response };
  }

  @Delete('organization/:orgId/:fileName')
  @UseGuards(OrganizationFileRoleGuard)
  @ApiDeleteFile()
  async deleteOrganizationFile(
    @Param('orgId', new UuidValidationPipe()) orgId: string,
    @Param('fileName') fileName: string,
  ): Promise<MessageOnlyResponse> {
    const scope = await this.fileService.resolveScope('org', orgId);
    await this.fileService.deleteFile(scope, fileName);
    return { message: 'File deleted successfully' };
  }

  @Post('project/:projectId')
  @UseGuards(ProjectFileRoleGuard)
  @ApiUploadFiles()
  async uploadProjectFiles(
    @Param('projectId', new UuidValidationPipe()) projectId: string,
    @Body() body: CreateFileDto[],
  ): Promise<DataResponse<PresignedUrl[]>> {
    const scope = await this.fileService.resolveScope('project', projectId);
    const response = await this.fileService.uploadFiles(body, scope);
    return { data: response };
  }

  @Get('project/:projectId')
  @UseGuards(ProjectFileRoleGuard)
  @ApiGetFiles()
  async getProjectFilesWithInheritance(
    @Param('projectId', new UuidValidationPipe()) projectId: string,
  ): Promise<DataResponse<EffectiveFile[]>> {
    const scope = await this.fileService.resolveScope('project', projectId);
    const response = await this.fileService.getFiles(scope);
    return { data: response };
  }

  @Delete('project/:projectId/:fileName')
  @UseGuards(ProjectFileRoleGuard)
  @ApiDeleteFile()
  async deleteProjectFile(
    @Param('projectId', new UuidValidationPipe()) projectId: string,
    @Param('fileName') fileName: string,
  ): Promise<MessageOnlyResponse> {
    const scope = await this.fileService.resolveScope('project', projectId);
    await this.fileService.deleteFile(scope, fileName);
    return { message: 'File deleted successfully' };
  }

  @Post('mandala/:mandalaId')
  @UseGuards(MandalaFileRoleGuard)
  @ApiUploadFiles()
  async uploadMandalaFiles(
    @Param('mandalaId', new UuidValidationPipe()) mandalaId: string,
    @Body() body: CreateFileDto[],
  ): Promise<DataResponse<PresignedUrl[]>> {
    const scope = await this.fileService.resolveScope('mandala', mandalaId);
    const response = await this.fileService.uploadFiles(body, scope);
    return { data: response };
  }

  @Get('mandala/:mandalaId')
  @UseGuards(MandalaFileRoleGuard)
  @ApiGetFiles()
  async getMandalaFiles(
    @Param('mandalaId', new UuidValidationPipe()) mandalaId: string,
  ): Promise<DataResponse<EffectiveFile[]>> {
    const scope = await this.fileService.resolveScope('mandala', mandalaId);
    const response = await this.fileService.getFiles(scope);
    return { data: response };
  }

  @Delete('mandala/:mandalaId/:fileName')
  @UseGuards(MandalaFileRoleGuard)
  @ApiDeleteFile()
  async deleteMandalaFile(
    @Param('mandalaId', new UuidValidationPipe()) mandalaId: string,
    @Param('fileName') fileName: string,
  ): Promise<MessageOnlyResponse> {
    const scope = await this.fileService.resolveScope('mandala', mandalaId);
    await this.fileService.deleteFile(scope, fileName);
    return { message: 'File deleted successfully' };
  }

  @Get('mandala/:mandalaId/buffers')
  @UseGuards(MandalaFileRoleGuard)
  @ApiGetFileBuffers()
  async getMandalaFileBuffers(
    @Param('mandalaId', new UuidValidationPipe()) mandalaId: string,
  ): Promise<DataResponse<Buffer[]>> {
    const scope = await this.fileService.resolveScope('mandala', mandalaId);
    const response = await this.fileService.readAllFilesAsBuffers(scope);
    return { data: response };
  }

  @Get('project/:projectId/buffers')
  @UseGuards(ProjectFileRoleGuard)
  @ApiGetFileBuffers()
  async getProjectFileBuffers(
    @Param('projectId', new UuidValidationPipe()) projectId: string,
  ): Promise<DataResponse<Buffer[]>> {
    const scope = await this.fileService.resolveScope('project', projectId);
    const response = await this.fileService.readAllFilesAsBuffers(scope);
    return { data: response };
  }
}
