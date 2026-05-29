import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { GetUser } from '../auth/get-user.decorator';
import { SettingsService } from './settings.service';
import { UpdateSettingDto } from './dto/update-setting.dto';

@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.settingsService.findAll();
  }

  @Get('agency-info')
  getAgencyInfo() {
    return this.settingsService.getAgencyInfo();
  }

  @Get(':key')
  @Roles(UserRole.ADMIN)
  findByKey(@Param('key') key: string) {
    return this.settingsService.findByKey(key);
  }

  @Patch(':key')
  @Roles(UserRole.ADMIN)
  update(
    @Param('key') key: string,
    @Body() updateSettingDto: UpdateSettingDto,
    @GetUser() currentUser: any,
  ) {
    return this.settingsService.update(key, updateSettingDto.value, currentUser.id);
  }
}
