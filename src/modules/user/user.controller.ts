import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FirebaseAuthGuard } from '@modules/auth/firebase/firebase.guard';
import { UserDto } from './dto/user.dto';
import {
  MessageResponse,
  DataResponse,
  PaginatedResponse,
} from '@common/types/responses';
import { MinValuePipe } from '@common/pipes/min-value.pipe';
import { MaxValuePipe } from '@common/pipes/max-value.pipe';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { UuidValidationPipe } from '@common/pipes/uuid-validation.pipe';

@ApiTags('Users')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo usuario' })
  @ApiResponse({
    status: 201,
    description: 'El usuario fue creado exitosamente.',
    type: UserDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  async create(
    @Body() createUserDto: CreateUserDto,
  ): Promise<MessageResponse<UserDto>> {
    const user = await this.userService.create(createUserDto);
    return {
      message: 'User created successfully',
      data: user,
    };
  }

  @Get()
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener todos los usuarios con paginación' })
  @ApiQuery({
    name: 'pagina',
    description: 'Numero de pagina',
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'limite',
    description: 'Items por pagina',
    type: Number,
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Devuelve una lista paginada de usuarios',
    type: [UserDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async findAll(
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
  ): Promise<PaginatedResponse<UserDto>> {
    return await this.userService.findAllPaginated(page, limit);
  }

  @Get(':id')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener un usuario por ID' })
  @ApiParam({ name: 'id', description: 'User ID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Devuelve el usuario con el ID especifico',
    type: UserDto,
  })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async findOne(
    @Param('id', new UuidValidationPipe()) id: string,
  ): Promise<DataResponse<UserDto>> {
    const user = await this.userService.findOne(id);
    return {
      data: user,
    };
  }

  @Patch(':id')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar usuario' })
  @ApiParam({ name: 'id', description: 'User ID', type: String })
  @ApiResponse({
    status: 200,
    description: 'El usuario ha sido creado correctamente.',
    type: UserDto,
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @ApiResponse({ status: 401, description: 'Sin autorizacion.' })
  async update(
    @Param('id', new UuidValidationPipe()) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<MessageResponse<UserDto>> {
    const user = await this.userService.update(id, updateUserDto);
    return {
      message: 'User updated successfully',
      data: user,
    };
  }

  @Delete(':id')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Desactivar usuario' })
  @ApiParam({ name: 'id', description: 'User ID', type: String })
  @ApiResponse({
    status: 200,
    description: 'El usuario fue desactivado exitosamente',
    type: UserDto,
  })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async remove(
    @Param('id', new UuidValidationPipe()) id: string,
  ): Promise<MessageResponse<UserDto>> {
    const user = await this.userService.deactivateUser(id);
    return {
      message: 'User deactivated successfully',
      data: user,
    };
  }
}
