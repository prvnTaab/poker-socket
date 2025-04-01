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

  // A map to store the user sockets by playerId (or socket.id for unique identification)
  private users = new Map<string, Socket>();

  // When a player logs in
  @SubscribeMessage('login')
  handleLogin(@MessageBody() playerId: string, @ConnectedSocket() client: Socket) {
    // Store the player's socket by their unique playerId (or socket.id)
    this.users.set(playerId, client);
    client.join('allPlayers');  // Join general "allPlayers" room
    console.log(`Player ${playerId} has logged in.`);
    this.server.to('allPlayers').emit('playerLoggedIn', { playerId });
  }

  // When a player wants to send a message to another individual player
  @SubscribeMessage('privateMessage')
  handlePrivateMessage(
    @MessageBody() data: { playerId: string; message: string },
    @ConnectedSocket() client: Socket,
  ) {
    const targetSocket = this.users.get(data.playerId);

    if (targetSocket) {
      // Send a private message to the specific player
      targetSocket.emit('newPrivateMessage', { message: data.message, from: client.id });
      console.log(`Sent private message to player ${data.playerId}`);
    } else {
      console.log(`Player ${data.playerId} not found.`);
    }
  }

  // When a game is created or a player joins a game
  @SubscribeMessage('joinGame')
  handleJoinGame(@MessageBody() gameId: string, @ConnectedSocket() client: Socket) {
    client.join(`game-${gameId}`);
    console.log(`Player joined game ${gameId}.`);
    this.server.to(`game-${gameId}`).emit('playerJoinedGame', { gameId, playerId: client.id });
  }

  // Broadcast a message to all players
  @SubscribeMessage('broadcast')
  handleBroadcast(@MessageBody() message: string, @ConnectedSocket() client: Socket) {
    const senderId = this.server.id;
    this.server.emit('newMessage', {message, cleint:client.id});
  }

  // Send a message to a specific game room
  @SubscribeMessage('gameMessage')
  handleGameMessage(@MessageBody() data: { gameId: string; message: string }) {
    this.server.to(`game-${data.gameId}`).emit('newGameMessage', data.message);
  }

  // Handle when a player connects
  handleConnection(client: Socket) {
    console.log(`Player with ID ${client.id} has connected.`);
  }

  // Handle when a player disconnects
  handleDisconnect(client: Socket) {
    // Remove the player from the users map when they disconnect
    this.users.forEach((socket, playerId) => {
      if (socket.id === client.id) {
        this.users.delete(playerId);
        console.log(`Player ${playerId} has disconnected.`);
        // Optionally notify others that the player has disconnected
        this.server.to('allPlayers').emit('playerDisconnected', { playerId });
      }
    });
  }

  afterInit() {
    console.log('WebSocket Gateway Initialized');
  }
}
