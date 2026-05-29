import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class BackupsService {
  private readonly backupsDir: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.backupsDir = path.resolve('./backups');
    if (!fs.existsSync(this.backupsDir)) {
      fs.mkdirSync(this.backupsDir, { recursive: true });
    }
  }

  async createBackup(userId: string): Promise<{ filePath: string; fileName: string }> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `backup-${timestamp}.sql`;
    const filePath = path.join(this.backupsDir, fileName);
    const databaseUrl = this.configService.get<string>('DATABASE_URL');

    try {
      execSync(`pg_dump "${databaseUrl}" > "${filePath}"`, {
        stdio: 'pipe',
      });
    } catch (error) {
      throw new Error(`Failed to create backup: ${error.message}`);
    }

    await this.prisma.activityLog.create({
      data: {
        userId,
        action: 'CREATE_BACKUP',
        entityType: 'BACKUP',
        entityId: fileName,
        description: `Created database backup: ${fileName}`,
      },
    });

    return { filePath, fileName };
  }

  async listBackups(): Promise<Array<{ name: string; size: number; date: Date }>> {
    if (!fs.existsSync(this.backupsDir)) {
      return [];
    }

    const files = fs.readdirSync(this.backupsDir);
    return files
      .filter((file) => file.endsWith('.sql'))
      .map((file) => {
        const filePath = path.join(this.backupsDir, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          size: stats.size,
          date: stats.mtime,
        };
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async deleteBackup(fileName: string, userId: string): Promise<{ message: string }> {
    const filePath = path.join(this.backupsDir, fileName);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(`Backup file "${fileName}" not found`);
    }

    fs.unlinkSync(filePath);

    await this.prisma.activityLog.create({
      data: {
        userId,
        action: 'DELETE_BACKUP',
        entityType: 'BACKUP',
        entityId: fileName,
        description: `Deleted database backup: ${fileName}`,
      },
    });

    return { message: `Backup "${fileName}" deleted successfully` };
  }

  getBackupPath(fileName: string): string {
    const filePath = path.join(this.backupsDir, fileName);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(`Backup file "${fileName}" not found`);
    }

    return filePath;
  }
}
