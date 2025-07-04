import { Injectable, Inject, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import Redis from 'ioredis';
import { stateOfX } from 'shared/common';
import { WebSocketServer } from '@nestjs/websockets';

@Injectable()
export class RedisSessionService {

  private readonly logger = new Logger(RedisSessionService.name);

  @WebSocketServer() server: Server;


  constructor(
    @Inject('REDIS') private readonly redis: Redis
  ) { }


  async addUserSession(playerId: string,socketId: string): Promise<{ success: boolean; message: string }> {
    try {
      const oldSocketId = await this.redis.get(`user:${playerId}:socket`);

      if (oldSocketId && oldSocketId !== socketId) {
        const oldSocket = this.server?.sockets?.sockets?.get(oldSocketId);
        if (oldSocket) {
          oldSocket.disconnect(true);
          this.logger.warn(`Duplicate login: Kicked old socket for player ${playerId}`);
        }

        await this.redis.del(`session:${oldSocketId}`);
      }

      // Set new session
      const sessionData = { playerId, connectedAt: Date.now() };

      await this.redis.set(`session:${socketId}`, JSON.stringify(sessionData), 'EX', 3600);
      
      await this.redis.set(`user:${playerId}:socket`, socketId);

      await this.redis.hset(`user:${playerId}:state`, 'isDisconnected', 'false');

      return { success: true, message: 'Session saved successfully' };

    } catch (err) {

      this.logger.error(`Failed to save session for player ${playerId}`, err.stack);

      return { success: false, message: 'Internal error while saving session' };
    }
  }





}
