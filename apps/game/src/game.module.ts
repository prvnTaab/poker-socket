import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GameService } from './game.service';
import { ConfigModule } from '@nestjs/config';
import { GameGateway } from './game/game.gateway';
import { RedisService } from './redis/redis.service';
import { DatebaseModule } from 'shared/common';
import { GameController } from './game.controller';

@Module({
  imports: [
    DatebaseModule
    // ConfigModule.forRoot({isGlobal: true}),
    // MongooseModule.forRoot(process.env.IMDB, {connectionName: 'inMemoryDb'}),
    // MongooseModule.forRoot(process.env.DB, {connectionName: 'db'}),
  ],
  controllers: [GameController],
  providers: [GameService, GameGateway, RedisService],
  exports:[RedisService]
})
export class GameModule {}
