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

@WebSocketGateway({
  cors: {
    origin: '*', // Allow all domains for now
  },
})
@Injectable()
export class GameGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server;

  // A map to store the user sockets by playerId
  private users = new Map<string, Socket>();

  // When a player logs in
  @SubscribeMessage('login')
  handleLogin(@MessageBody() playerId: string, @ConnectedSocket() client: Socket) {
    this.users.set(playerId, client);
    client.join('allPlayers');
    this.server.to('allPlayers').emit('playerLoggedIn', { playerId });
  }

  // Public Method: Broadcast message to all players in a specific game room
  public broadcastToRoom(gameId: string, event: string, message: any) {
    this.server.to(`game-${gameId}`).emit(event, message);
  }

  // Public Method: Send a private message to a specific player
  public sendMessageToPlayer(playerId: string, event: string, message: any) {
    const targetSocket = this.users.get(playerId);
    if (targetSocket) {
      targetSocket.emit(event, message);
    }
  }

  // SubscribeMessage: Send message to a room (used within WebSocket)
  @SubscribeMessage('roomBroadcast')
  handleRoomBroadcast(@MessageBody() data: { gameId: string; message: string }) {
    this.broadcastToRoom(data.gameId, 'newRoomMessage', data.message);
  }

  // SubscribeMessage: Send a direct message to a player (used within WebSocket)
  @SubscribeMessage('directMessage')
  handleDirectMessage(@MessageBody() data: { playerId: string; message: string }) {
    this.sendMessageToPlayer(data.playerId, 'newPrivateMessage', data.message);
  }

  // Handle player connection
  handleConnection(client: Socket) {}

  // Handle player disconnection
  handleDisconnect(client: Socket) {
    this.users.forEach((socket, playerId) => {
      if (socket.id === client.id) {
        this.users.delete(playerId);
        this.server.to('allPlayers').emit('playerDisconnected', { playerId });
      }
    });
  }

  afterInit() {}
}
