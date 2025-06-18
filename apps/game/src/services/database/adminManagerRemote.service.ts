import { Injectable } from '@nestjs/common';
import { ServerDownManagerService } from 'shared/common/server-down-manager/server-down-manager.service';

declare const pomelo: any;

@Injectable()
export class AdminManagerRemoteService {
  constructor(
    private readonly serverDownManager:ServerDownManagerService
  ) {}

  async inform(message: any): Promise<void> {
    await this.serverDownManager.msgRcvd(pomelo.app, message);
  }
}
