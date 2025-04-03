import { Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { ActivityService } from './activity/activity.service';

@Module({
  providers: [CommonService, ActivityService],
  exports: [CommonService],
})
export class CommonModule {}
