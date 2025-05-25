import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        username: true,
        email: true,
        is_active: true,
      },
    });
  }

  async create(createUserDto: CreateUserDto) {
    return this.prisma.user.create({
      data: {
        id: createUserDto.firebaseUid,
        username: createUserDto.username,
        email: createUserDto.email,
      },
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      where: {
        is_active: true,
      },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        is_active: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });
  }

  async deactivateUser(targetUserId: string) {
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!targetUser) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return this.prisma.user.update({
      where: { id: targetUserId },
      data: { is_active: false },
    });
  }
}
