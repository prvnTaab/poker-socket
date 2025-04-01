import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GameService } from './game.service';
import { ConfigModule } from '@nestjs/config';
import { GameGateway } from './game/game.gateway';
import { RedisService } from './redis/redis.service';

@Module({
  imports: [
    ConfigModule.forRoot({isGlobal: true}),
    MongooseModule.forRoot(process.env.inMemoryDb, {connectionName: 'inMemoryDb'}),
    MongooseModule.forRoot(process.env.db, {connectionName: 'db'}),
  ],
  providers: [GameService, GameGateway, RedisService],
  exports:[RedisService]
})
export class GameModule {}
