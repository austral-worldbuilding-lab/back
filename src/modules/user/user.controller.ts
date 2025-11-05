import { FirebaseUidValidationPipe } from '@common/pipes/firebase-uid-validation.pipe';
import { MaxValuePipe } from '@common/pipes/max-value.pipe';
import { MinValuePipe } from '@common/pipes/min-value.pipe';
import {
  MessageResponse,
  DataResponse,
  PaginatedResponse,
} from '@common/types/responses';
import { FirebaseAuthGuard } from '@modules/auth/firebase/firebase.guard';
import { RequestWithUser } from '@modules/auth/types/auth.types';
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
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

import {
  ApiCreateUser,
  ApiGetAllUsers,
  ApiGetUser,
  ApiUpdateUser,
  ApiDeleteUser,
  ApiGetCurrentUser,
  ApiGetUserStats,
} from './decorators/user-swagger.decorators';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserDto } from './dto/user.dto';
import { UserStatsDto } from './dto/user-stats.dto';
import { UserOwnershipGuard } from './guards/user-ownership.guard';
import { UserService } from './user.service';

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

  @Get('me')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiGetCurrentUser()
  async getCurrentUser(
    @Req() req: RequestWithUser,
  ): Promise<DataResponse<UserDto>> {
    const user = await this.userService.findOne(req.user.id);
    return {
      data: user,
    };
  }

  @Get('me/stats')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiGetUserStats()
  async getUserStats(
    @Req() req: RequestWithUser,
  ): Promise<DataResponse<UserStatsDto>> {
    const stats = await this.userService.getUserStats(req.user.id);
    return {
      data: stats,
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
