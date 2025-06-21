import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { MandalaService } from './mandala.service';
import { CreateMandalaDto } from './dto/create-mandala.dto';
import { UpdateMandalaDto } from './dto/update-mandala.dto';
import { FirebaseAuthGuard } from '@modules/auth/firebase/firebase.guard';
import { MandalaDto } from './dto/mandala.dto';
import {
  MessageResponse,
  DataResponse,
  PaginatedResponse,
  MessageOnlyResponse,
} from '@common/types/responses';
import { MinValuePipe } from '@common/pipes/min-value.pipe';
import { MaxValuePipe } from '@common/pipes/max-value.pipe';
import { MandalaWithPostitsAndLinkedCentersDto } from './dto/mandala-with-postits-and-linked-centers.dto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FilterSectionDto } from './dto/filter-option.dto';
import {
  MandalaRoleGuard,
  RequireProjectRoles,
} from './guards/mandala-role.guard';
import {
  ApiCreateMandala,
  ApiGetAllMandalas,
  ApiGetMandalaFilters,
  ApiGetMandala,
  ApiUpdateMandala,
  ApiDeleteMandala,
  ApiGenerateMandala,
  ApiLinkMandala,
  ApiUnlinkMandala,
  ApiGetAvailableCharacters,
} from './decorators/mandala-swagger.decorators';
import { UuidValidationPipe } from '@common/pipes/uuid-validation.pipe';
import { CharacterListItemDto } from './dto/character-list-item.dto';

@ApiTags('Mandalas')
@Controller('mandala')
@UseGuards(FirebaseAuthGuard)
@ApiBearerAuth()
export class MandalaController {
  constructor(private readonly mandalaService: MandalaService) {}

  @Post()
  @UseGuards(MandalaRoleGuard)
  @ApiCreateMandala()
  async create(
    @Body() createMandalaDto: CreateMandalaDto,
  ): Promise<MessageResponse<MandalaDto>> {
    const mandala = await this.mandalaService.create(createMandalaDto);
    return {
      message: 'Mandala created successfully',
      data: mandala,
    };
  }

  @Get()
  @UseGuards(MandalaRoleGuard)
  @ApiGetAllMandalas()
  async findAll(
    @Query('projectId', new UuidValidationPipe()) projectId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe, new MinValuePipe(1))
    page: number,
    @Query(
      'limit',
      new DefaultValuePipe(10),
      ParseIntPipe,
      new MinValuePipe(1),
      new MaxValuePipe(100),
    )
    limit: number,
  ): Promise<PaginatedResponse<MandalaDto>> {
    return await this.mandalaService.findAllPaginated(projectId, page, limit);
  }

  @Get('filter-options')
  @UseGuards(MandalaRoleGuard)
  @ApiGetMandalaFilters()
  async getFilters(
    @Query('id', new UuidValidationPipe()) id: string,
  ): Promise<DataResponse<FilterSectionDto[]>> {
    const filters = await this.mandalaService.getFilters(id);
    return {
      data: filters,
    };
  }

  @Get(':id')
  @UseGuards(MandalaRoleGuard)
  @ApiGetMandala()
  async findOne(
    @Param('id', new UuidValidationPipe()) id: string,
  ): Promise<DataResponse<MandalaDto>> {
    const mandala = await this.mandalaService.findOne(id);
    return {
      data: mandala,
    };
  }

  @Get(':id/characters')
  @UseGuards(MandalaRoleGuard)
  @ApiGetAvailableCharacters()
  async getAvailableCharacters(
    @Param('id', new UuidValidationPipe()) id: string,
  ): Promise<DataResponse<CharacterListItemDto[]>> {
    const characters =
      await this.mandalaService.findAvailableMandalasForLinking(id);
    return {
      data: characters,
    };
  }

  @Patch(':id')
  @UseGuards(MandalaRoleGuard)
  @ApiUpdateMandala()
  async update(
    @Param('id', new UuidValidationPipe()) id: string,
    @Body() updateMandalaDto: UpdateMandalaDto,
  ): Promise<MessageResponse<MandalaDto>> {
    const mandala = await this.mandalaService.update(id, updateMandalaDto);
    return {
      message: 'Mandala updated successfully',
      data: mandala,
    };
  }

  @Delete(':id')
  @UseGuards(MandalaRoleGuard)
  @RequireProjectRoles('owner')
  @ApiDeleteMandala()
  async remove(
    @Param('id', new UuidValidationPipe()) id: string,
  ): Promise<MessageResponse<MandalaDto>> {
    const mandala = await this.mandalaService.remove(id);
    return {
      message: 'Mandala deleted successfully',
      data: mandala,
    };
  }

  @Post('generate')
  @UseGuards(MandalaRoleGuard)
  @ApiGenerateMandala()
  async generate(
    @Body() createMandalaDto: CreateMandalaDto,
  ): Promise<MessageResponse<MandalaWithPostitsAndLinkedCentersDto>> {
    const mandalaWithPostits =
      await this.mandalaService.generate(createMandalaDto);
    return {
      message: 'Mandala generated successfully with IA',
      data: mandalaWithPostits,
    };
  }

  @Post(':id/link/:childId')
  @UseGuards(MandalaRoleGuard)
  @ApiLinkMandala()
  async linkMandala(
    @Param('id', new UuidValidationPipe()) parentId: string,
    @Param('childId', new UuidValidationPipe()) childId: string,
  ): Promise<MessageResponse<MandalaDto>> {
    const updatedMandala = await this.mandalaService.linkMandala(
      parentId,
      childId,
    );
    return {
      message: 'Mandala linked successfully',
      data: updatedMandala,
    };
  }

  @Delete(':id/unlink/:childId')
  @UseGuards(MandalaRoleGuard)
  @ApiUnlinkMandala()
  async unlinkMandala(
    @Param('id', new UuidValidationPipe()) parentId: string,
    @Param('childId', new UuidValidationPipe()) childId: string,
  ): Promise<MessageOnlyResponse> {
    await this.mandalaService.unlinkMandala(parentId, childId);
    return {
      message: 'Mandala unlinked successfully',
    };
  }
}
