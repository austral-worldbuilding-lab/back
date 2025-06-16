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
import { UserOwnershipGuard } from './guards/user-ownership.guard';
import { UserDto } from './dto/user.dto';
import {
  MessageResponse,
  DataResponse,
  PaginatedResponse,
} from '@common/types/responses';
import { MinValuePipe } from '@common/pipes/min-value.pipe';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { MaxValuePipe } from '@common/pipes/max-value.pipe';
import {
  ApiCreateUser,
  ApiGetAllUsers,
  ApiGetUser,
  ApiUpdateUser,
  ApiDeleteUser,
} from './decorators/user-swagger.decorators';
import { FirebaseUidValidationPipe } from '@common/pipes/firebase-uid-validation.pipe';

@ApiTags('Users')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiCreateUser()
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
  @ApiGetAllUsers()
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
  @ApiGetUser()
  async findOne(
    @Param('id', new FirebaseUidValidationPipe()) id: string,
  ): Promise<DataResponse<UserDto>> {
    const user = await this.userService.findOne(id);
    return {
      data: user,
    };
  }

  @Patch(':id')
  @UseGuards(FirebaseAuthGuard, UserOwnershipGuard)
  @ApiBearerAuth()
  @ApiUpdateUser()
  async update(
    @Param('id', new FirebaseUidValidationPipe()) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<MessageResponse<UserDto>> {
    const user = await this.userService.update(id, updateUserDto);
    return {
      message: 'User updated successfully',
      data: user,
    };
  }

  @Delete(':id')
  @UseGuards(FirebaseAuthGuard, UserOwnershipGuard)
  @ApiBearerAuth()
  @ApiDeleteUser()
  async remove(
    @Param('id', new FirebaseUidValidationPipe()) id: string,
  ): Promise<MessageResponse<UserDto>> {
    const user = await this.userService.deactivateUser(id);
    return {
      message: 'User deactivated successfully',
      data: user,
    };
  }
}
