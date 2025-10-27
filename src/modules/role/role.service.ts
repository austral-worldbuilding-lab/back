import { PrismaService } from '@modules/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';

@Injectable()
export class RoleService {
  constructor(private prisma: PrismaService) {}

  async findByName(name: string): Promise<Role | null> {
    return this.prisma.role.findUnique({
      where: { name },
    });
  }

  async findById(id: string): Promise<Role | null> {
    return this.prisma.role.findUnique({
      where: { id },
    });
  }

  async create(name: string, level: number): Promise<Role> {
    return this.prisma.role.create({
      data: { name, level },
    });
  }

  async findOrCreate(name: string): Promise<Role> {
    const role = await this.findByName(name);
    if (role) {
      return role;
    }

    // Map role names to their levels
    // This should only be used for seeding/initialization
    const roleLevels: Record<string, number> = {
      dueño: 1,
      facilitador: 2,
      worldbuilder: 3,
      lector: 4,
    };

    const level = roleLevels[name];
    if (!level) {
      throw new Error(
        `Cannot create role '${name}': level not defined. Please use the seed script to create roles.`,
      );
    }

    return this.create(name, level);
  }
}
