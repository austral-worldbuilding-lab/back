import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';

@Injectable()
export class ProjectService {
  constructor(private prisma: PrismaService) {}

  async create(createProjectDto: CreateProjectDto, userId: string) {
    const project = await this.prisma.project.create({
      data: {
        name: createProjectDto.name,
      },
    });

    // Find or create owner role
    let ownerRole = await this.prisma.role.findFirst({
      where: { name: 'owner' },
    });

    if (!ownerRole) {
      ownerRole = await this.prisma.role.create({
        data: { name: 'owner' },
      });
    }

    await this.prisma.userProjectRole.create({
      data: {
        userId: userId,
        projectId: project.id,
        roleId: ownerRole.id,
      },
    });

    return {
      message: 'Project created successfully',
      data: project,
    };
  }

  async findAll() {
    return this.prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllPaginated(page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [projects, total] = await this.prisma.$transaction([
      this.prisma.project.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.project.count(),
    ]);

    return {
      data: projects,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    return project;
  }

  async remove(projectId: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Find or create owner role
    let ownerRole = await this.prisma.role.findFirst({
      where: { name: 'owner' },
    });

    if (!ownerRole) {
      ownerRole = await this.prisma.role.create({
        data: { name: 'owner' },
      });
    }

    const userIsOwner = await this.prisma.userProjectRole.findFirst({
      where: {
        projectId,
        userId,
        roleId: ownerRole.id,
      },
    });

    if (!userIsOwner) {
      throw new ForbiddenException('Only the project owner can delete it');
    }

    return this.prisma.project.delete({ where: { id: projectId } });
  }
}
