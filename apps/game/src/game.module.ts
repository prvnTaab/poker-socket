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
import { CommonHandlerService } from './services/room/commonHandler.service';
import { BroadcastHandlerService } from './services/room/broadcastHandler.service';
import { ChannelTimerHandlerService } from './services/room/channelTimerHandler.service';
import { SubscriptionHandlerService } from './services/room/subscriptionHandler.service';
import { StartGameHandlerService } from './services/room/startGameHandler.service';
import { StartTournamentHandlerService } from './services/room/startTournamentHandler.service';
import { TournamentJoinHandlerService } from './services/room/tournamentJoinHandler.service';
import { AutoSitHandlerService } from './services/room/autoSitHandler.service';
import { CalculateDynamicBountyHandlerService } from './services/room/calculateDynamicBountyHandler.service';
import { AdminActionsHandlerService } from './services/room/adminActionsHandler.service';
import { DisconnectedPlayersHandlerService } from './services/room/disconnectedPlayersHandler.service';
import { IdlePlayersHandlerService } from './services/room/idlePlayersHandler.service';
import { LateRegistrationHandlerService } from './services/room/lateRegistrationHandler.service';
import { OnlinePlayersService } from './services/room/onlinePlayers.service';
import { SendMessageToSessionsService } from './services/room/sendMessageToSessions.service';
import { PrizePoolHandlerService } from './services/room/prizePoolHandler.service';
import { ResumeHandlerService } from './services/room/resumeHandler.service';
import { RevertLockedHandlerService } from './services/room/revertLockedHandler.service';
import { SessionHandlerService } from './services/room/sessionHandler.service';
import { SitHereHandlerService } from './services/room/sitHereHandler.service';
import { TournamentActionHandlerService } from './services/room/tournamentActionHandler.service';
import { DynamicTableHandlerService } from './services/room/dynamicTableHandler.service';
import { HandleTipDealerService } from './services/room/handleTipDealer.service';

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
    JoinRequestUtilService,
    ChannelTimerHandlerService,
    BroadcastHandlerService,
    CommonHandlerService,
    ResponseHandlerService,
    SubscriptionHandlerService,
    StartGameHandlerService,
    StartTournamentHandlerService,
    TournamentJoinHandlerService,
    AutoSitHandlerService,
    CalculateDynamicBountyHandlerService,
    AdminActionsHandlerService,
    DisconnectedPlayersHandlerService,
    IdlePlayersHandlerService,
    LateRegistrationHandlerService,
    OnlinePlayersService,
    SendMessageToSessionsService,
    PrizePoolHandlerService,
    ResumeHandlerService,
    RevertLockedHandlerService,
    SessionHandlerService,
    SitHereHandlerService,
    TournamentActionHandlerService,
    DynamicTableHandlerService,
    HandleTipDealerService

  ],
  exports:[RedisService, DbRemoteService, UserRemoteService, ResponseHandlerService]
})
export class GameModule {}
