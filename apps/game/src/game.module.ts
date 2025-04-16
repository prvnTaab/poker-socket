import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GameService } from './game.service';
import { ConfigModule } from '@nestjs/config';
import { GameGateway } from './game/game.gateway';
import { RedisService } from './redis/redis.service';
import { DatabaseModule } from 'shared/common';
import { GameController } from './game.controller';
import { DbRemoteService } from './services/database/dbRemote.service';
import { UserRemoteService } from './services/database/userRemote.service';
import { ResponseHandlerService } from './services/database/responseHandler.service';
import { DisconnectionHandler } from './services/connector/disconnectionHandler';
import { JoinChannelHandler } from './services/room/joinChannelHandler';
import { ActionLoggerService } from './services/room/actionLogger.service';
import { JoinRequestUtilService } from './services/room/joinRequestUtil.service';

@Module({
  imports: [
    DatabaseModule
    // ConfigModule.forRoot({isGlobal: true}),
    // MongooseModule.forRoot(process.env.IMDB, {connectionName: 'inMemoryDb'}),
    // MongooseModule.forRoot(process.env.DB, {connectionName: 'db'}),
  ],
  controllers: [GameController],
  providers: [GameService, GameGateway, RedisService, DbRemoteService, UserRemoteService, ResponseHandlerService,
    DisconnectionHandler,
    JoinChannelHandler,
    ActionLoggerService,
    JoinRequestUtilService

  ],
  exports:[RedisService, DbRemoteService, UserRemoteService, ResponseHandlerService]
})
export class GameModule {}
