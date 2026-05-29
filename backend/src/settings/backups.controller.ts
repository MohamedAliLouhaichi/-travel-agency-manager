import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { GetUser } from '../auth/get-user.decorator';
import { BackupsService } from './backups.service';

@Controller('backups')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class BackupsController {
  constructor(private backupsService: BackupsService) {}

  @Post()
  createBackup(@GetUser() currentUser: any) {
    return this.backupsService.createBackup(currentUser.id);
  }

  @Get()
  listBackups() {
    return this.backupsService.listBackups();
  }

  @Delete(':fileName')
  deleteBackup(
    @Param('fileName') fileName: string,
    @GetUser() currentUser: any,
  ) {
    return this.backupsService.deleteBackup(fileName, currentUser.id);
  }

  @Get(':fileName/download')
  downloadBackup(
    @Param('fileName') fileName: string,
    @Res() res: Response,
  ) {
    const filePath = this.backupsService.getBackupPath(fileName);
    res.download(filePath, fileName);
  }
}
