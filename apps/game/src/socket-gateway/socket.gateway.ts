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

@WebSocketGateway({
  cors: {
    origin: '*', // Allow all domains for now
  },
})
@Injectable()
export class SocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

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

  @SubscribeMessage('aka')
  initalize(@ConnectedSocket() client: Socket) {

    console.log("--------aka-----",client.id);

    client.emit('aka1', 'hello');

    return 'gghgh';
  }



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
    const socket = this.users.get(playerId);
    if (socket) {
      socket.emit(event, message);
    }
  }

  public broadcastToLobby(event: string, message: any) {
    this.server.to('allPlayers').emit(event, message);
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


  @SubscribeMessage('request')
  handleRequest(@MessageBody() data:any) {

    

  }

}
