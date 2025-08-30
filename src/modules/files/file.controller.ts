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
  ApiGetOrganizationFiles,
  ApiUploadOrganizationFiles,
  ApiDeleteOrganizationFile,
  ApiGetProjectFilesWithInheritance,
  ApiUploadProjectFiles,
  ApiDeleteProjectFile,
  ApiGetMandalaFiles,
  ApiUploadMandalaFiles,
  ApiDeleteMandalaFile,
  ApiGetMandalaBuffers,
  ApiGetProjectBuffers,
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

  @Post('organization/:orgId')
  @UseGuards(OrganizationFileRoleGuard)
  @ApiUploadOrganizationFiles()
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
  @ApiGetOrganizationFiles()
  async getOrganizationFiles(
    @Param('orgId', new UuidValidationPipe()) orgId: string,
  ): Promise<DataResponse<EffectiveFile[]>> {
    const scope = await this.fileService.resolveScope('org', orgId);
    const response = await this.fileService.getFiles(scope);
    return { data: response };
  }

  @Delete('organization/:orgId/:fileName')
  @UseGuards(OrganizationFileRoleGuard)
  @ApiDeleteOrganizationFile()
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
  @ApiUploadProjectFiles()
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
  @ApiGetProjectFilesWithInheritance()
  async getProjectFilesWithInheritance(
    @Param('projectId', new UuidValidationPipe()) projectId: string,
  ): Promise<DataResponse<EffectiveFile[]>> {
    const scope = await this.fileService.resolveScope('project', projectId);
    const response = await this.fileService.getFiles(scope);
    return { data: response };
  }

  @Delete('project/:projectId/:fileName')
  @UseGuards(ProjectFileRoleGuard)
  @ApiDeleteProjectFile()
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
  @ApiUploadMandalaFiles()
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
  @ApiGetMandalaFiles()
  async getMandalaFiles(
    @Param('mandalaId', new UuidValidationPipe()) mandalaId: string,
  ): Promise<DataResponse<EffectiveFile[]>> {
    const scope = await this.fileService.resolveScope('mandala', mandalaId);
    const response = await this.fileService.getFiles(scope);
    return { data: response };
  }

  @Delete('mandala/:mandalaId/:fileName')
  @UseGuards(MandalaFileRoleGuard)
  @ApiDeleteMandalaFile()
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
  @ApiGetMandalaBuffers()
  async getMandalaFileBuffers(
    @Param('mandalaId', new UuidValidationPipe()) mandalaId: string,
  ): Promise<DataResponse<Buffer[]>> {
    const scope = await this.fileService.resolveScope('mandala', mandalaId);
    const response = await this.fileService.readAllFilesAsBuffers(scope);
    return { data: response };
  }

  @Get('project/:projectId/buffers')
  @UseGuards(ProjectFileRoleGuard)
  @ApiGetProjectBuffers()
  async getProjectFileBuffers(
    @Param('projectId', new UuidValidationPipe()) projectId: string,
  ): Promise<DataResponse<Buffer[]>> {
    const scope = await this.fileService.resolveScope('project', projectId);
    const response = await this.fileService.readAllFilesAsBuffers(scope);
    return { data: response };
  }
}
