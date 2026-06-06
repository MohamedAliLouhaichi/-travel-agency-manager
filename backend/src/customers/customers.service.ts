import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async create(createCustomerDto: CreateCustomerDto, currentUserId: string) {
    const {
      firstName,
      lastName,
      phone,
      email,
      address,
      nationality,
      passportNumber,
      passportExpiry,
      dateOfBirth,
      notes,
    } = createCustomerDto;

    const customer = await this.prisma.customer.create({
      data: {
        firstName,
        lastName,
        phone,
        email,
        address,
        nationality,
        passportNumber,
        passportExpiry: passportExpiry ? new Date(passportExpiry) : null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        notes,
      },
    });

    // Audit log
    await this.prisma.activityLog.create({
      data: {
        userId: currentUserId,
        action: 'CREATE_CUSTOMER',
        entityType: 'CUSTOMER',
        entityId: customer.id,
        description: `Created customer ${customer.firstName} ${customer.lastName}`,
      },
    });

    return customer;
  }

  async findAll(search?: string) {
    const where: any = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { passportNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.customer.findMany({
      where,
      orderBy: {
        lastName: 'asc',
      },
    });
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        bookings: {
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            hotelBooking: true,
            flightBooking: true,
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto, currentUserId: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const {
      firstName,
      lastName,
      phone,
      email,
      address,
      nationality,
      passportNumber,
      passportExpiry,
      dateOfBirth,
      notes,
    } = updateCustomerDto;

    const data: any = {};
    if (firstName !== undefined) data.firstName = firstName;
    if (lastName !== undefined) data.lastName = lastName;
    if (phone !== undefined) data.phone = phone;
    if (email !== undefined) data.email = email;
    if (address !== undefined) data.address = address;
    if (nationality !== undefined) data.nationality = nationality;
    if (passportNumber !== undefined) data.passportNumber = passportNumber;
    if (passportExpiry !== undefined) {
      data.passportExpiry = passportExpiry ? new Date(passportExpiry) : null;
    }
    if (dateOfBirth !== undefined) {
      data.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    }
    if (notes !== undefined) data.notes = notes;

    const updatedCustomer = await this.prisma.customer.update({
      where: { id },
      data,
    });

    // Audit log
    await this.prisma.activityLog.create({
      data: {
        userId: currentUserId,
        action: 'UPDATE_CUSTOMER',
        entityType: 'CUSTOMER',
        entityId: updatedCustomer.id,
        description: `Updated customer details for ${updatedCustomer.firstName} ${updatedCustomer.lastName}`,
      },
    });

    return updatedCustomer;
  }

  async deleteMany(ids: string[], currentUserId: string) {
    const uniqueIds = [...new Set(ids)];

    const customers = await this.prisma.customer.findMany({
      where: { id: { in: uniqueIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        _count: {
          select: { bookings: true },
        },
      },
    });

    if (customers.length !== uniqueIds.length) {
      throw new NotFoundException('One or more selected customers were not found');
    }

    const customersWithBookings = customers.filter(
      (customer) => customer._count.bookings > 0,
    );

    if (customersWithBookings.length > 0) {
      const names = customersWithBookings
        .map((customer) => `${customer.firstName} ${customer.lastName}`)
        .join(', ');

      throw new BadRequestException(
        `Cannot delete customers with existing bookings. Delete their bookings first: ${names}`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const result = await tx.customer.deleteMany({
        where: { id: { in: uniqueIds } },
      });

      await tx.activityLog.create({
        data: {
          userId: currentUserId,
          action: 'DELETE_CUSTOMERS',
          entityType: 'CUSTOMER',
          description: `Deleted ${result.count} customer record(s)`,
        },
      });

      return {
        deletedCount: result.count,
        requestedCount: uniqueIds.length,
      };
    });
  }
}
