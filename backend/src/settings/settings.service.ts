import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<Record<string, string>> {
    const settings = await this.prisma.setting.findMany();
    const result: Record<string, string> = {};
    for (const setting of settings) {
      result[setting.key] = setting.value;
    }
    return result;
  }

  async findByKey(key: string) {
    const setting = await this.prisma.setting.findUnique({
      where: { key },
    });

    if (!setting) {
      throw new NotFoundException(`Setting with key "${key}" not found`);
    }

    return setting;
  }

  async update(key: string, value: string, userId: string) {
    const setting = await this.prisma.setting.findUnique({
      where: { key },
    });

    if (!setting) {
      throw new NotFoundException(`Setting with key "${key}" not found`);
    }

    const updated = await this.prisma.setting.update({
      where: { key },
      data: { value },
    });

    await this.prisma.activityLog.create({
      data: {
        userId,
        action: 'UPDATE_SETTING',
        entityType: 'SETTING',
        entityId: updated.id,
        description: `Updated setting "${key}" to "${value}"`,
      },
    });

    return updated;
  }

  async upsert(key: string, value: string, userId: string) {
    const setting = await this.prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    await this.prisma.activityLog.create({
      data: {
        userId,
        action: 'UPSERT_SETTING',
        entityType: 'SETTING',
        entityId: setting.id,
        description: `Set setting "${key}" to "${value}"`,
      },
    });

    return setting;
  }

  async getAgencyInfo() {
    const keys = [
      'agency_name',
      'agency_address',
      'agency_phone',
      'agency_email',
      'currency',
      'invoice_prefix',
      'tax_rate',
    ];

    const settings = await this.prisma.setting.findMany({
      where: { key: { in: keys } },
    });

    const map: Record<string, string> = {};
    for (const setting of settings) {
      map[setting.key] = setting.value;
    }

    return {
      agencyName: map['agency_name'] || '',
      agencyAddress: map['agency_address'] || '',
      agencyPhone: map['agency_phone'] || '',
      agencyEmail: map['agency_email'] || '',
      currency: map['currency'] || 'USD',
      invoicePrefix: map['invoice_prefix'] || 'INV',
      taxRate: map['tax_rate'] || '0',
    };
  }
}
