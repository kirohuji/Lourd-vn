import {
  PaginatedResponse,
  UpdateUserDto,
  UserQueryDto,
  UserResponseDto,
  UserRole,
} from '@lourd-game/shared';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    query: UserQueryDto,
  ): Promise<PaginatedResponse<UserResponseDto>> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.role) {
      where.role = query.role;
    }

    if (query.search) {
      where.OR = [{ email: { contains: query.search, mode: 'insensitive' } }];
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: data.map((user) => ({
        id: user.id,
        email: user.email || undefined,
        role: user.role as UserRole,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return {
      id: user.id,
      email: user.email || undefined,
      role: user.role as UserRole,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async update(
    id: number,
    dto: UpdateUserDto,
    currentUserId: number,
    currentUserRole: UserRole,
  ): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // 只有管理员可以修改用户
    if (currentUserRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can update users');
    }

    // 验证邮箱唯一性（如果提供）
    if (dto.email && dto.email !== user.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (existingUser) {
        throw new BadRequestException(`Email "${dto.email}" is already taken`);
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.role !== undefined && { role: dto.role }),
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      id: updatedUser.id,
      email: updatedUser.email || undefined,
      role: updatedUser.role as UserRole,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };
  }

  async remove(
    id: number,
    currentUserId: number,
    currentUserRole: UserRole,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // 只有管理员可以删除用户
    if (currentUserRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can delete users');
    }

    // 不能删除自己
    if (id === currentUserId) {
      throw new BadRequestException('Cannot delete your own account');
    }

    await this.prisma.user.delete({
      where: { id },
    });
  }
}
