import { PrismaService } from '@modules/prisma/prisma.service';
import { Injectable } from '@nestjs/common';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserDto } from './dto/user.dto';

@Injectable()
export class UserRepository {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<UserDto> {
    return this.prisma.user.create({
      data: {
        id: createUserDto.firebaseUid,
        username: createUserDto.username,
        fullName: createUserDto.fullName,
        email: createUserDto.email,
        is_active: createUserDto.is_active,
      },
    });
  }

  async findAllPaginated(
    skip: number,
    take: number,
  ): Promise<[UserDto[], number]> {
    const where = { is_active: true };
    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        select: {
          id: true,
          username: true,
          fullName: true,
          email: true,
          is_active: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return [users, total];
  }

  async findOne(id: string): Promise<UserDto | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        is_active: true,
      },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserDto> {
    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        is_active: true,
      },
    });
  }

  async deactivateUser(targetUserId: string): Promise<UserDto> {
    return this.prisma.user.update({
      where: { id: targetUserId },
      data: { is_active: false },
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        is_active: true,
      },
    });
  }
}
