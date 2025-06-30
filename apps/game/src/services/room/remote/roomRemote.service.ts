import { Injectable } from "@nestjs/common";
import { ChannelTimerHandlerService } from "../channelTimerHandler.service";
import { PokerDatabaseService } from "shared/common/utils/pokerdatabase.service";
import { Server, Socket } from 'socket.io';





@Injectable()
export class RoomRemoteService {

    private server:Server


    constructor(

        private readonly db:PokerDatabaseService,
        private readonly channelTimerHandler:ChannelTimerHandlerService

    ) { }



async playerReconnected(msg: any): Promise<any> {
    const { channelId, playerId } = msg;

    if (!channelId || !playerId) {
      return { success: false, info: 'request data insufficient - handleReconnection' };
    }

    // Check if room exists and has members
    const sockets = await this.server.in(channelId).fetchSockets();

    if (!sockets || sockets.length === 0) {
      return { success: false, info: 'channel not found' };
    }

    const findUserResponse = await this.db.findUser({ playerId });
    const now = Date.now();

    const hasValidSubscription = findUserResponse?.subscription &&now >= findUserResponse.subscription.startDate && now <= findUserResponse.subscription.endDate;

    if (hasValidSubscription) {
      const channelStub = {
        extraTurnTimeReference: true, // Simulate from some cache or store
      };

      if (channelStub.extraTurnTimeReference) {
        this.channelTimerHandler.reconnectionAfterDisconnection(msg, channelStub);
      }
    }

    return { success: true };
  }







}