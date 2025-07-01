import { Injectable, Inject } from '@nestjs/common';
import { Socket } from 'socket.io';
import Redis from 'ioredis';

@Injectable()
export class RedisSessionService {




  constructor(
    @Inject('REDIS') private readonly redis: Redis
  ) { }



  // Removes a session by playerId and socketId
  async removeSession(playerId: string, socketId: string): Promise<{ success: boolean }> {
    try {
      await this.redis.del(`user:${playerId}`);
      await this.redis.del(`socket:${socketId}`);
      return { success: true };
    } catch (err) {
      console.error('Redis removeSession error:', err);
      return { success: false };
    }
  }

  async getUserSession(playerId: string): Promise<any> {
    const sessionKey = `session:${playerId}`;
    const sessionData = await this.redis.hgetall(sessionKey);

    if (Object.keys(sessionData).length === 0) return null;

    return {
      success:true,
      id: sessionData.id,
      uid: sessionData.uid,
      settings: JSON.parse(sessionData.settings),
    };
  }



  async addUserSession(playerId: string, socketId: string): Promise<void> {

    const sessionKey = `session:${playerId}`;

    const sessionData = {
      id: socketId,
      uid: playerId,
      settings: JSON.stringify({
        playerId,
        playerName: "",
        deviceType: "",
        channels: [],
        waitingChannels: [],
        networkIp: '',
        lastActiveTime: Date.now(),
        isDisconnectedForce: false,
      })
    };

    await this.redis.hmset(sessionKey, sessionData);

    // Optional: also map userId to socketId and vice-versa for quick lookup
    await this.redis.set(`user:${playerId}`, socketId);

    await this.redis.set(`socket:${socketId}`, JSON.stringify(sessionData));
  }

}
