import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRepository } from './user.repository';
import { UserDto } from './dto/user.dto';
import { PaginatedResponse } from '../common/types/responses';

@Injectable()
export class UserService {
  constructor(private userRepository: UserRepository) {}

  async create(createUserDto: CreateUserDto): Promise<UserDto> {
    return this.userRepository.create(createUserDto);
  }

  async findAllPaginated(
    page: number,
    limit: number,
  ): Promise<PaginatedResponse<UserDto>> {
    const skip = (page - 1) * limit;
    const [users, total] = await this.userRepository.findAllPaginated(
      skip,
      limit,
    );

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<UserDto> {
    const user = await this.userRepository.findOne(id);

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserDto> {
    return this.userRepository.update(id, updateUserDto);
  }

  async deactivateUser(targetUserId: string): Promise<UserDto> {
    const targetUser = await this.userRepository.findOne(targetUserId);
    if (!targetUser) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return this.userRepository.deactivateUser(targetUserId);
  }
}
