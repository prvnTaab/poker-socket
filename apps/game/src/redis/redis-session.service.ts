import { Injectable, Inject } from '@nestjs/common';
import { Socket } from 'socket.io';
import Redis from 'ioredis';
import { stateOfX } from 'shared/common';

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
      success: true,
      sessionId: sessionData.id,
      uid: sessionData.uid,
      settings: JSON.parse(sessionData.settings)
    };
  }



  async addUserSession(playerId: string, socketId: string): Promise<{ success: boolean; message: string; data?: Record<string, any> }> {

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

    try {
      // Save session data
      await this.redis.hmset(sessionKey, sessionData);

      // Map userId <-> socketId
      await this.redis.set(`user:${playerId}`, socketId);
      await this.redis.set(`socket:${socketId}`, JSON.stringify(sessionData));

      return {
        success: true,
        message: `Session created for playerId ${playerId}`,
        data: {
          sessionKey,
          sessionData,
          userKey: `user:${playerId}`,
          socketKey: `socket:${socketId}`
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to create session: ${error.message}`
      };
    }
  }

  // Kill session by socketId (aka sessionId)
  async kickSession(socketId: string, reason: string): Promise<{ success: boolean }> {
    await this.redis.del(`socket:${socketId}`);
    // Optional: disconnect socket if tracking via memory map or using socket.io adapter
    return { success: true };
  }

  // Set a field (like isConnected) in a session
  async setSessionField(socketId: string, field: string, value: any): Promise<void> {
    const sessionKey = `socket:${socketId}`;
    const data = await this.redis.get(sessionKey);
    if (!data) return;

    const session = JSON.parse(data);
    session.settings = JSON.parse(session.settings);
    session.settings[field] = value;
    session.settings = JSON.stringify(session.settings);

    await this.redis.set(sessionKey, JSON.stringify(session));
  }

  // Get a field (like waitingChannels) from session
  async getSessionField(socketId: string, field: string): Promise<any> {
    const sessionKey = `socket:${socketId}`;
    const data = await this.redis.get(sessionKey);
    if (!data) return null;

    const session = JSON.parse(data);
    const settings = JSON.parse(session.settings);
    return settings[field];
  }

  async addSession(data:any): Promise<{ success: boolean }> {

    let {playerId,playerName,deviceType,socketId} = data;

    const sessionKey = `session:${playerId}`;

    const sessionData = {
      id: socketId,
      uid: playerId,
      settings: JSON.stringify({
        playerId,
        playerName,
        deviceType,
        channels: [],
        waitingChannels: [],
        networkIp: '',
        lastActiveTime: Date.now(),
        isDisconnectedForce: false,
        isConnected: true
      })
    };

    await this.redis.hmset(sessionKey, sessionData);
    await this.redis.set(`user:${playerId}`, socketId);
    await this.redis.set(`socket:${socketId}`, JSON.stringify(sessionData));

    return { success: true };
  }

  async recordLastActivityTime(params: any): Promise<any> {

  const { socketId, playerId, msg } = params;

  const shouldRecord =
    (msg?.isRequested && msg.isRequested === true) || !msg?.isRequested;

  if (!shouldRecord) {
    return ;
  }

  try {
    const sessionKey = `socket:${socketId}`;
    const sessionDataRaw = await this.redis.get(sessionKey);

    if (!sessionDataRaw) {
      return {
        success:false,
        info:`recordLastActivityTime: No session found for socketId: ${socketId}`
      }
    }

    const sessionData = JSON.parse(sessionDataRaw);
    const settings = JSON.parse(sessionData.settings);

    settings.lastActiveTime = Date.now();
    sessionData.settings = JSON.stringify(settings);

    await this.redis.set(sessionKey, JSON.stringify(sessionData));



    return {
        success:false,
        info:`Last active time recorded for - ${playerId} => ${settings.lastActiveTime}`
      }

  } catch (err) {
    return {
      success:false,
      info:'recordLastActivityTime: Failed to update session'
    }
  }
}

  async getDeviceType(socketId: string): Promise<string | null> {
    return await this.redis.hget(`socket:${socketId}`, 'deviceType');
  }




}
