import { Module } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { BackupsService } from './backups.service';
import { BackupsController } from './backups.controller';

@Module({
  controllers: [SettingsController, BackupsController],
  providers: [SettingsService, BackupsService],
  exports: [SettingsService],
})
export class SettingsModule {}
