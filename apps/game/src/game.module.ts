import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GameService } from './game.service';
import { ConfigModule } from '@nestjs/config';
import { GameGateway } from './game/game.gateway';
import { RedisService } from './redis/redis.service';
import { DatebaseModule } from 'shared/common';
import { GameController } from './game.controller';
import { DbRemoteService } from './services/database/dbRemote.service';
import { UserRemoteService } from './services/database/userRemote.service';
import { ResponseHandlerService } from './services/database/responseHandler.service';
import { walletQueryService } from './utils/walletQuery.service';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    DatebaseModule,
    ClientsModule.register([
      {
        name: 'POKER_WALLET',
        transport: Transport.TCP,
        options: { host: 'localhost', port: Number(4005) },
      },
    ]),
    // ConfigModule.forRoot({isGlobal: true}),
    // MongooseModule.forRoot(process.env.IMDB, {connectionName: 'inMemoryDb'}),
    // MongooseModule.forRoot(process.env.DB, {connectionName: 'db'}),
  ],
  controllers: [GameController],
  providers: [GameService, GameGateway, RedisService, DbRemoteService, UserRemoteService, ResponseHandlerService, walletQueryService],
  exports:[RedisService, DbRemoteService, UserRemoteService, ResponseHandlerService, walletQueryService]
})
export class GameModule {}
