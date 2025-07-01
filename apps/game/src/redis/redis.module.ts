




// redis.module.ts
import { Module } from '@nestjs/common';
import { RedisProvider } from './redis.provider';
import { RedisSessionService } from './redis-session.service';

@Module({
  providers: [RedisProvider, RedisSessionService],
  exports: [RedisSessionService], // make it available for other modules
})
export class RedisModule {}
