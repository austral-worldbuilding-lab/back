import { ResourceNotFoundException } from '@common/exceptions/custom-exceptions';
import { AppLogger } from '@common/services/logger.service';
import { PaginatedResponse } from '@common/types/responses';
import { OrganizationService } from '@modules/organization/organization.service';
import { Injectable } from '@nestjs/common';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserDto } from './dto/user.dto';
import { UserRepository } from './user.repository';

@Injectable()
export class UserService {
  constructor(
    private userRepository: UserRepository,
    private organizationService: OrganizationService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(UserService.name);
  }

  async create(createUserDto: CreateUserDto): Promise<UserDto> {
    this.logger.log('Creating user', createUserDto);
    const user = await this.userRepository.create(createUserDto);

    // Create default organization for new user
    try {
      await this.organizationService.createDefaultOrganization(user.id);
      this.logger.log('Default organization created for user', { userId: user.id });
    } catch (error) {
      this.logger.error(
        'Failed to create default organization for user',
        error,
        { userId: user.id },
      );
    }

    return user;
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
      throw new ResourceNotFoundException('User', id);
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserDto> {
    return this.userRepository.update(id, updateUserDto);
  }

  async deactivateUser(targetUserId: string): Promise<UserDto> {
    const targetUser = await this.userRepository.findOne(targetUserId);
    if (!targetUser) {
      throw new ResourceNotFoundException('User', targetUserId);
    }
    this.logger.log('Deactivating user', { targetUserId });
    return this.userRepository.deactivateUser(targetUserId);
  }
}
