import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserDto } from './dto/user.dto';

@Injectable()
export class UserRepository {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<UserDto> {
    return this.prisma.user.create({
      data: {
        username: createUserDto.username,
        first_name: createUserDto.first_name,
        last_name: createUserDto.last_name,
        email: createUserDto.email,
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
        first_name: true,
        last_name: true,
        email: true,
        is_active: true,
      },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserDto> {
    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });
  }

  async deactivateUser(targetUserId: string): Promise<UserDto> {
    return this.prisma.user.update({
      where: { id: targetUserId },
      data: { is_active: false },
    });
  }
}
