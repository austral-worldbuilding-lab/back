import { Injectable } from '@nestjs/common';
import { PrismaService } from '@modules/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserDto } from './dto/user.dto';

@Injectable()
export class UserRepository {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<UserDto> {
    const user = await this.prisma.user.create({
      data: {
        id: createUserDto.firebaseUid,
        username: createUserDto.username,
        email: createUserDto.email,
        is_active: createUserDto.is_active,
      },
    });

    //para la demo, hacemos que cada vez que se cree un usuario este sea miembro del proyecto,
    //asi aparecen las mandalas creadas
    const demoProjectId = 'e2e9e2d5-e3c7-47e4-9f12-4f6f40062eee';

    return user;
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
        email: true,
        is_active: true,
      },
    });
  }
}
