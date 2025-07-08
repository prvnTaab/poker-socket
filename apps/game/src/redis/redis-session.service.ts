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


  async addUserSession(data: any): Promise<{ success: boolean; message: string }> {
    try {
      const clientIp = data.socket.handshake.address || '0.0.0.0';
      const currentSocketId = data.socket.id;
      const playerId = data.playerId;
      const userStateKey = `user:${playerId}`;
      const sessionKey = `session:${currentSocketId}`;
      const now = Date.now().toString();

      // ✅ Step 1: Check for previous socketId from user hash
      const existingUser = await this.redis.hgetall(userStateKey);
      const previousSocketId = existingUser?.socketId;

      if (previousSocketId && previousSocketId !== currentSocketId) {
        
        const oldSocket = this.server?.sockets?.sockets?.get(previousSocketId);

        if (oldSocket) {
          oldSocket.disconnect(true);
          this.logger.warn(`Duplicate login: Kicked old socket for player ${playerId}`);

          // ✅ Optional: Notify old socket
          this.server.emit('forceLogout', {
            playerId,
            socketId: previousSocketId,
            message: 'You have been logged out due to login from another device.',
          });
        }

        // ✅ Clean up old session
        await this.redis.del(`session:${previousSocketId}`);
      }

      // ✅ Step 2: Build and update user hash in Redis
      await this.redis.hmset(userStateKey, {
        socketId: currentSocketId,
        playerId: playerId,
        playerName: data.userName,
        deviceType: data.deviceType || 'cell',
        networkIp: clientIp,
        lastActiveTime: now,
        channels: '[]',
        waitingChannels: '[]',
        isConnected: 'true',
      });

      // ✅ Step 3: Create/Update session:<socketId>
      await this.redis.hmset(sessionKey, {
        playerId,
        lastActiveTime: now,
      });

      return { success: true, message: 'Session saved successfully' };

    } catch (err) {
      this.logger.error(`Failed to save session for player ${data.playerId}, ${data.userName}`, err.stack);
      return { success: false, message: 'Internal error while saving session' };
    }
  }



  // async addUserSession(data: any): Promise<{ success: boolean; message: string }> {
  //   try {

  //     //=========   User State key ==================//
  //     const clientIp = data.socket.handshake.address || '0.0.0.0';
  //     const userStateKey = `user:${data.playerId}`;
  //     const userState = {
  //       socketId: data.socket.id,
  //       playerId: data.playerId,
  //       playerName: data.userName,
  //       deviceType: data.deviceType || 'cell',
  //       networkIp: clientIp,
  //       lastActiveTime: Date.now().toString(),
  //       channels: JSON.stringify([]),
  //       waitingChannels: JSON.stringify([]),
  //       isConnected: 'true',
  //     };

  //     // Store user state in Redis as hash
  //     await this.redis.hmset(userStateKey, userState);

  //     //=========   Session:<socketId> Hash ==================//
  //     const sessionKey = `session:${data.socket.id}`;
  //     const sessionData = {
  //       playerId: data.playerId,
  //       lastActiveTime: userState.lastActiveTime,
  //     };

  //     await this.redis.hmset(sessionKey, sessionData);

  //     return { success: true, message: 'Session saved successfully' };

  //   } catch (err) {
  //     this.logger.error(`Failed to save session for player ${data.playerId}, ${data.userName}`, err.stack);
  //     return { success: false, message: 'Internal error while saving session' };
  //   }
  // }

  async removeSessionAfterDissconnection(socketId: string) {

    try {
      const sessionKey = `session:${socketId}`;

      // Get session data from socketId
      const session = await this.redis.hgetall(sessionKey);

      if (!session || !session.playerId) {
        this.logger.warn(`No session found for socketId ${socketId}`);
        return;
      }

      const playerId = session.playerId;
      const userKey = `user:${playerId}`;
      const updatedFields = {
        lastActiveTime: Date.now().toString(),
        isConnected: 'false',
      };

      await this.redis.hmset(userKey, updatedFields);

      // Optional: Clean up session:<socketId>
      let data = await this.redis.del(`session:${socketId}`);

      this.logger.log(`Updated user ${playerId} state from socket ${socketId}`);

      return { success: true, message: "Successfully updated and deleted session", data };
    } catch (error) {
      this.logger.error(`Failed to update user state from socketId ${socketId}`, error.stack);
    }

  }

  async updateUserSessionAfterReconnect(socketId: string): Promise<{ success: boolean; message: string }> {
    try {
      const sessionKey = `session:${socketId}`;

      // Get session data from Redis
      const session = await this.redis.hgetall(sessionKey);

      if (!session || !session.playerId) {
        this.logger.warn(`No session found for socketId ${socketId}`);
        return { success: false, message: 'Session not found' };
      }

      const playerId = session.playerId;
      const userKey = `user:${playerId}`;
      const updatedFields = {
        socketId,
        isConnected: 'true',
        lastActiveTime: Date.now().toString(),
      };

      await this.redis.hmset(userKey, updatedFields);

      this.logger.log(`Reconnected user ${playerId} with socket ${socketId}`);
      return { success: true, message: 'User session updated after reconnect' };
    } catch (error) {
      this.logger.error(`Failed to update user session after reconnect for socketId ${socketId}`, error.stack);
      return { success: false, message: 'Internal error' };
    }
  }



  async getUserSession(playerId: string): Promise<{
    success: boolean;
    message: string;
    socketId?: string;
    session?: Record<string, string>;
    state?: Record<string, string>;
  }> {
    try {
      // Get current socket ID linked to the player
      const socketId = await this.redis.get(`user:${playerId}:socket`);

      if (!socketId) {
        return { success: false, message: 'No active session for this player' };
      }

      // Get session data (playerId, lastActiveTime)
      const session = await this.redis.hgetall(`session:${socketId}`);

      // Get user connection state and deviceType
      const state = await this.redis.hgetall(`user:${playerId}:state`);

      return {
        success: true,
        message: 'Session fetched successfully',
        socketId,
        session,
        state,
      };
    } catch (err) {
      this.logger.error(`Failed to fetch session for player ${playerId}`, err.stack);

      return {
        success: false,
        message: 'Internal error while fetching session',
      };
    }
  }


  async setSessionField() {

  }






}
