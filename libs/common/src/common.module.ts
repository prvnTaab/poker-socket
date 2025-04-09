import { Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { ActivityService } from './activity/activity.service';
import { ServerDownManagerService } from './server-down-manager/server-down-manager.service';

@Module({
  providers: [CommonService, ActivityService, ServerDownManagerService],
  exports: [CommonService, ActivityService, ServerDownManagerService],
})
export class CommonModule {}
