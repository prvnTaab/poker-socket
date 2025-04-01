import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType;

  constructor() {
    this.client = createClient({ url: 'redis://localhost:6379' });

    this.client.on('error', (err) => {
      console.error('Redis Error:', err);
    });
  }

  async onModuleInit() {
    await this.client.connect();
    console.log('Connected to Redis');
  }

  async onModuleDestroy() {
    await this.client.quit();
    console.log('Disconnected from Redis');
  }

  async setJson(key: string, value: any) {
    await this.client.sendCommand(['JSON.SET', key, '.', JSON.stringify(value)]);
  }

  async getJson(key: string): Promise<any> {
    const data:any = await this.client.sendCommand(['JSON.GET', key]);
    return data ? JSON.parse(data) : null;
  }

  async updateJsonField(key: string, field: string, value: any) {
    await this.client.sendCommand(['JSON.SET', key, `.${field}`, JSON.stringify(value)]);
  }

  async deleteJson(key: string) {
    await this.client.sendCommand(['JSON.DEL', key]);
  }
}
