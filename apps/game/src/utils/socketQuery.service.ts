


import { Injectable, OnModuleInit } from '@nestjs/common';
import { ClientTCP, Transport, Client } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { systemConfig } from 'shared/common';

@Injectable()
export class SocketQueryService implements OnModuleInit {
  // TCP client injected via decorator and connected to the given port
  @Client({
    transport: Transport.TCP,
    options: {
      host: 'localhost',
      port: systemConfig.ports.socket,
    },
  })
  private client: ClientTCP;

  async onModuleInit() {
    try {
      await this.client.connect();
      console.log('Connected with socket !!!!!!!!!!!!!!!!!!!!!');
    } catch (err) {
      console.log("Couldn't connect with socket !!!!!!!!!!!!!!!!!!!!!", err);
    }
  }

  /**
   * Send a broadcast to a specific player/channel.
   * @param data - The broadcast payload.
   * @returns The response from the socket or false if failed.
   */
  async sendPlayerBroadCast(data: any): Promise<any> {
    console.log('Got one request to send player broadcast in broadcastHandler', data);
    try {
      data.channelId = data._id ? data._id : data.channelId;
      const response = await firstValueFrom(this.client.send('lobbyPlayerResponse', data));
      console.log(`lobbyPlayerResponse response is: ${response}`);
      return response;
    } catch (err) {
      // console.error("Error sending request to socket:", err);
      return false;
    }
  }

  /**
   * Send a general broadcast to the lobby.
   * @param data - The broadcast payload.
   * @returns The response from the socket or false if failed.
   */
  async sendGeneralBroadCast(data: any): Promise<any> {
    console.log('Got one request to send general broadcast in broadcastHandler', data);
    try {
      data.channelId = data._id ? data._id : data.channelId;
      const response = await firstValueFrom(this.client.send('lobbyGeneralResponse', data));
      console.log(`lobbyGeneralResponse response is: ${response}`);
      return response;
    } catch (err) {
      // console.error("Error sending request to socket:", err);
      return false;
    }
  }
}
