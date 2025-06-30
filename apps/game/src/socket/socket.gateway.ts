import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { SocketGatewayService } from './socket-gateway.service';

@WebSocketGateway({
  cors: {
    origin: '*', // Allow all domains for now
  },
})
@Injectable()
export class SocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

  constructor(
    private readonly socketGatewayService:SocketGatewayService
  ) {}

  private readonly playerList: any = [];
  private readonly cashPlayersList: any = [];

  @WebSocketServer() server: Server;

  // A map to store the user sockets by playerId
  private users = new Map<string, Socket>();


  afterInit(server: Server) {
    console.log("----WebSocket Intialized------");
  }

  // Handle player connection
  handleConnection(client: Socket) {

    console.log(`--Client connected: ${client.id}`)

  }

  handleDisconnect(client: Socket) {

    const playerId = (client as any).playerId;

    console.log('---This Player Diconnected------', client.id)

    if (playerId && this.users.get(playerId)?.id === client.id) {
      this.users.delete(playerId);
      this.server.to('allPlayers').emit('playerDisconnected', { playerId });
    }
  }

  // Public Method: Broadcast message to all players in a specific game room
  public broadcastToRoom(gameId: string, event: string, message: any) {
    this.server.to(`game-${gameId}`).emit(event, message);
  }

  // Public Method: Send a private message to a specific player
  public sendMessageToPlayer(playerId: string, event: string, message: any) {
    const socket = this.users.get(playerId);
    if (socket) {
      socket.emit(event, message);
    }
  }

  public broadcastToLobby(event: string, message: any) {
    this.server.to('allPlayers').emit(event, message);
  }


  @SubscribeMessage('request')
  public async request(client: Socket, params: any) {
    try {

      if (!params.action) {
        return { success: false, info: 'action not found' };
      }

      // params.arrivedAt = Date.now();

      const { action, data } = params;

      // if (action === 'leaveTheRoom') {
      //   client.leave(data.channelId);
      //   return true;
      // }

      // if (action === 'ping') {
      //   return true;
      // }

      // if (action === 'handleDisconnection') {
      //   const index = this.playerList.findIndex(item => item.includes(client.id));
      //   if (index >= 0) {
      //     const playerId = this.playerList[index][0];
      //     await this.handleDisconnection(playerId);
      //     this.playerList.splice(index, 1);
      //   }
      //   return true;
      // }

      // if (action === 'auth') {


      //   this.playerList.push([data.playerId, client.id]);

      //   if (this.cashPlayersList[data.playerId]) {
      //     const userDevice = await this.dbConnection.collection('dailyLoggedInUser')
      //       .find({ playerId: data.playerId }, { projection: { device: 1, _id: 0 } })
      //       .sort({ loginTime: -1 })
      //       .limit(1)
      //       .toArray();

      //     const deviceType = userDevice?.[0]?.device ?? 'another device';

      //     const message = `You have logged in from ${deviceType === 'androidApp' ? 'Android app' :
      //         deviceType === 'iosApp' ? 'iOS app' :
      //           deviceType === 'windows' ? 'Windows' :
      //             deviceType === 'mac' ? 'Mac' :
      //               deviceType === 'browser' ? 'Browser' :
      //                 deviceType === 'mobileBrowser' ? 'Mobile browser' :
      //                   'another device'
      //       }!`;

      //     this.server.to(this.cashPlayersList[data.playerId]).emit('playerResponse', {
      //       action: 'disconnect',
      //       info: message,
      //     });
      //   }

      //   // @ts-ignore
      //   client.customData = data;
      //   this.cashPlayersList[data.playerId] = client.id;
      //   return true;
      // }

      // Default: Forward to socketService
      const res:any = await this.socketGatewayService.processRequest(params);

      console.log("-------Final Output---",res.length)


      res.returnedAt = Date.now();

      if (res.success) {
        if (action === 'joinChannel') {
          client.join(data.channelId);
        }

        if (action === 'checkForMultiClient' && res.joinChannels?.length) {
          for (const channel of res.joinChannels) {
            client.join(channel.channelId);
          }
        }

        if (action === 'leaveTable' && !data.isStandup) {
          client.leave(data.channelId);
        }
      }

      res.arrivedAt = params.arrivedAt;
      res.returnedAt = Date.now();
      res.returnedin = `${res.returnedAt - res.arrivedAt}ms`;
      return res;
    } catch (e) {
      return { success: false, info: `got an error ${e}` };
    }
  }


}
