import { Injectable } from '@nestjs/common';
import { PrismaService } from '@modules/prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class RoleService {
  constructor(private prisma: PrismaService) {}

  async findByName(name: string): Promise<Role | null> {
    return this.prisma.role.findUnique({
      where: { name },
    });
  }

  async create(name: string): Promise<Role> {
    return this.prisma.role.create({
      data: { name },
    });
  }

  async findOrCreate(name: string): Promise<Role> {
    const role = await this.findByName(name);
    if (role) {
      return role;
    }
    return this.create(name);
  }
}
