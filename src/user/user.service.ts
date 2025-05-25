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
    const user = await this.prisma.user.create({
      data: {
        id: createUserDto.firebaseUid,
        email: createUserDto.email,
        username: createUserDto.username,
      },
    });

    //esto esta asi para la demo, cada vez que se crea un usuario se lo hace member del project 12345
    //asi aparecen las mandalas creadas dentro de ese proyecto desde el front
    const demoProjectId = '12345';

    let role = await this.prisma.role.findFirst({
      where: { name: 'member' },
    });

    if (!role) {
      role = await this.prisma.role.create({
        data: {
          name: 'member',
        },
      });
    }

    await this.prisma.userProjectRole.create({
      data: {
        userId: user.id,
        projectId: demoProjectId,
        roleId: role.id,
      },
    });

    return user;
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
