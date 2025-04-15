// admin-broadcast.service.ts

import { Injectable } from '@nestjs/common';

import { ChannelService } from 'path-to-your-socket-io-wrapper'; // Replace with actual wrapper service
import { BroadcastHandlerService } from './broadcastHandler.service';

const successResponse = { success: true };
const failureResponse = { success: false, info: 'The table is not in running state.' };

@Injectable()
export class AdminBroadcastService {
  constructor(
    private readonly channelService: ChannelService, // Abstracted Socket.IO channel service
    private readonly broadcastHandler: BroadcastHandlerService,
  ) {}

  private async pushMessage(data: any): Promise<any> {
    const channel = this.channelService.getChannel(data.channelId);
    if (channel) {
      channel.pushMessage(data.route, data);
      return successResponse;
    }
    return failureResponse;
  }

  private async informUsersTable(data: any): Promise<void> {
    const channel = this.channelService.getChannel(data.channelId);
    data.channel = channel;
    data.broadcastFromAdmin = true;
    this.broadcastHandler.generalPlayerInfoAfterRevert(data);
  }

  private async informUsers(data: any): Promise<void> {
    this.broadcastHandler.sendMessageToallconnectedUser(data);
  }

  async informUsersHandler(msg: any): Promise<any> {
    console.log('handler.informUsers', msg);
    const data = {
      serverDown: true,
      channelId: msg.channelId || msg.tableId,
      heading: msg.heading || 'Message From Admin',
      info: msg.broadcastMessage,
      route: 'playerInfo',
      buttonCode: 1,
    };

    switch (msg.broadcastType) {
      case 'table':
        await this.informUsersTable(msg);
        await this.pushMessage(data);
        return { success: true };

      case 'players':
        await this.informUsers(msg);
        this.channelService.broadcast(data.route, data);
        return { success: true };

      default:
        return { success: false, info: 'Wrong broadcastType' };
    }
  }
}
