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
  HttpCode,
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
  ApiCreatePostit,
  ApiDeletePostit,
  ApiLinkMandala,
  ApiUnlinkMandala,
  ApiGetAvailableCharacters,
  ApiUpdatePostit,
} from './decorators/mandala-swagger.decorators';
import { UuidValidationPipe } from '@common/pipes/uuid-validation.pipe';
import { CharacterListItemDto } from './dto/character-list-item.dto';
import { CreatePostitDto } from './dto/postit/create-postit.dto';
import { PostitService } from './services/postit.service';
import { PostitWithCoordinates } from './types/postits';
import { UpdatePostitDto } from './dto/postit/update-postit.dto';

@ApiTags('Mandalas')
@Controller('mandala')
@UseGuards(FirebaseAuthGuard)
@ApiBearerAuth()
export class MandalaController {
  constructor(
    private readonly mandalaService: MandalaService,
    private readonly postitService: PostitService,
  ) {}

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
    @Query('fields') fields: string | undefined,
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
  ): Promise<
    PaginatedResponse<MandalaDto> | DataResponse<CharacterListItemDto[]>
  > {
    if (fields === 'characterList') {
      const characters = await this.mandalaService.getCharacterList(projectId);
      return { data: characters };
    }

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

  @Post(':mandalaId/postits')
  @UseGuards(MandalaRoleGuard)
  @ApiCreatePostit()
  async createPostit(
    @Param('mandalaId', new UuidValidationPipe()) mandalaId: string,
    @Body() createPostitDto: CreatePostitDto,
  ): Promise<MessageResponse<PostitWithCoordinates>> {
    const mandala = await this.mandalaService.findOne(mandalaId);

    const createdPostit = await this.postitService.createPostit(
      mandala.projectId,
      mandalaId,
      createPostitDto,
    );

    return {
      message: 'Post-it created successfully',
      data: createdPostit,
    };
  }

  @Patch(':mandalaId/postits/:postitId')
  @UseGuards(MandalaRoleGuard)
  @ApiUpdatePostit()
  async updatePostit(
    @Param('mandalaId', new UuidValidationPipe()) mandalaId: string,
    @Param('postitId', new UuidValidationPipe()) postitId: string,
    @Body() updatePostitDto: UpdatePostitDto,
  ): Promise<MessageResponse<PostitWithCoordinates>> {
    const mandala = await this.mandalaService.findOne(mandalaId);

    const updatedPostit = await this.postitService.updatePostit(
      mandala.projectId,
      mandalaId,
      postitId,
      updatePostitDto,
    );

    return {
      message: 'Post-it updated successfully',
      data: updatedPostit,
    };
  }

  @Delete(':mandalaId/postits/:postitId')
  @UseGuards(MandalaRoleGuard)
  @ApiDeletePostit()
  @HttpCode(204)
  async deletePostit(
    @Param('mandalaId', new UuidValidationPipe()) mandalaId: string,
    @Param('postitId', new UuidValidationPipe()) postitId: string,
  ): Promise<void> {
    const mandala = await this.mandalaService.findOne(mandalaId);

    await this.postitService.deletePostit(
      mandala.projectId,
      mandalaId,
      postitId,
    );
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
