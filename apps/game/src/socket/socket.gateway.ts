import {
  WebSocketGateway,
  SubscribeMessage,
  OnGatewayInit,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import { SocketGatewayService } from './socket.service';
import { RedisSessionService } from '../redis/redis-session.service';
import { RoomManagerService } from '../room-manager/room-manager.service';

@WebSocketGateway({
  cors: {
    origin: '*', // Allow all domains for now
  },
})
@Injectable()
export class SocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

  private readonly logger = new Logger(SocketGateway.name);

  constructor(
    private readonly socketGatewayService: SocketGatewayService,
    private readonly redisService: RedisSessionService,
    private readonly roomManagerService: RoomManagerService,
  ) { }

  @WebSocketServer() server: Server;


  afterInit(server: Server) {
    // Pass server instance to RoomManagerService
    this.roomManagerService.setServer(this.server);
  }

  // Handle player connection
  async handleConnection(client: Socket) {
    try {

      await this.redisService.updateUserSessionAfterReconnect(client.id);

    } catch (error) {
      this.logger.error(`Failed to update user state from socketId ${client.id}`, error.stack);
    }
  }

  async handleDisconnect(client: Socket) {
    try {

      await this.redisService.removeSessionAfterDissconnection(client.id);

    } catch (error) {
      this.logger.error(`Failed to update user state from socketId ${client.id}`, error.stack);
    }
  }

  @SubscribeMessage('request')
  public async request(client: Socket, params: any) {
    try {

      if (!params.action) {
        return { success: false, info: 'action not found' };
      }

      console.log("------------- MSG -----------", client.id, params)

      params.data.socketId = client.id;

      // Default: Forward to socketService
      const res: any = await this.socketGatewayService.processRequest(client, params);

      console.log("-------Final Output---")

      res.returnedAt = Date.now();
      res.arrivedAt = params.arrivedAt;
      res.returnedAt = Date.now();
      res.returnedin = `${res.returnedAt - res.arrivedAt}ms`;
      return res;
    } catch (e) {
      return { success: false, info: `got an error ${e}` };
    }
  }


  // Public Method: Broadcast message to all players in a specific game room
  public broadcastToRoom(gameId: string, event: string, message: any) {
    this.server.to(`game-${gameId}`).emit(event, message);
  }

  // Public Method: Send a private message to a specific player
  public sendMessageToPlayer(playerId: string, event: string, message: any) {

    let users:any;

    const socket = users.get(playerId);

    if (socket) {
      socket.emit(event, message);
    }
  }

  public broadcastToLobby(event: string, message: any) {
    this.server.to('allPlayers').emit(event, message);
  }


}
