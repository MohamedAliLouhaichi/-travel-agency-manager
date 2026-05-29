import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto, currentUserId: string) {
    const { fullName, email, password, role } = createUserDto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        fullName,
        email,
        passwordHash,
        role,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    // Audit log
    await this.prisma.activityLog.create({
      data: {
        userId: currentUserId,
        action: 'CREATE_USER',
        entityType: 'USER',
        entityId: user.id,
        description: `Created user ${user.fullName} (${user.role})`,
      },
    });

    return user;
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto, currentUserId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { fullName, email, password, role, status } = updateUserDto;

    if (email && email !== user.email) {
      const emailExists = await this.prisma.user.findUnique({ where: { email } });
      if (emailExists) {
        throw new ConflictException('Email already in use by another user');
      }
    }

    const data: any = {};
    if (fullName) data.fullName = fullName;
    if (email) data.email = email;
    if (role) data.role = role;
    if (status) data.status = status;
    if (password) {
      data.passwordHash = await bcrypt.hash(password, 10);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Audit log
    await this.prisma.activityLog.create({
      data: {
        userId: currentUserId,
        action: 'UPDATE_USER',
        entityType: 'USER',
        entityId: updatedUser.id,
        description: `Updated user details for ${updatedUser.fullName}`,
      },
    });

    return updatedUser;
  }

  async toggleStatus(id: string, currentUserId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.id === currentUserId) {
      throw new ConflictException('You cannot deactivate your own account');
    }

    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { status: newStatus },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
      },
    });

    // Audit log
    await this.prisma.activityLog.create({
      data: {
        userId: currentUserId,
        action: 'TOGGLE_USER_STATUS',
        entityType: 'USER',
        entityId: updatedUser.id,
        description: `Toggled user status for ${updatedUser.fullName} to ${newStatus}`,
      },
    });

    return updatedUser;
  }
}
