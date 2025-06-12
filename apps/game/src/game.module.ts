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
import { walletQueryService } from './utils/walletQuery.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AddonManagementService } from './services/database/addonManagement.service';
import { AdjustActiveIndexService } from './services/database/adjustActiveIndex.service';
import { HandleGameStartCaseService } from './services/database/handleGameStartCase.service';
import { LockTableService } from './services/database/lockTable.service';
import { SetMoveService } from './services/database/setMove.service';
import { AdminManagerRemoteService } from './services/database/adminManagerRemote.service';
import { AutoRebuyRemoteService } from './services/database/autoRebuyRemote.service';
import { CalculateChannelDetailsService } from './services/database/calculateChannelDetails.service';
import { BreakManagementService } from './services/database/breakManagement.service';
import { BlindUpdateService } from './services/database/blindUpdate.service';
import { AutoSitRemoteService } from './services/database/autoSitRemote.service';
import { CalculateRanksService } from './services/database/calculateRanks.service';
import { PostsplitService } from './services/database/potsplit.service';
import { UtilsModule } from './utils/utils.module';
import { PrecheckRemoteService } from './services/database/precheckRemote.service';
import { QuickSeatService } from './services/database/quickSeat.service';
import { SatelliteTournamentService } from './services/database/satelliteTournament.service';
import { RequestRemoteService } from './services/database/requestRemote.service';
import { RewardRakeService } from './services/database/rewardRake.service';
import { SetTableConfigService } from './services/database/setTableConfig.service';
import { SimilarTableService } from './services/database/similarTable.service';
import { TableConfigManagerService } from './services/database/tableConfigManager.service';
import { TimeBankRemoteService } from './services/database/timeBankRemote.service';
import { TipRemoteService } from './services/database/tipRemote.service';
import { TournamentService } from './services/database/tournament.service';
import { TournamentLeaveService } from './services/database/tournamentLeave.service';
import { TournamentRegistrationService } from './services/database/tournamentRegistration.service';
import { TourStartRemoteService } from './services/database/tourStartRemote.service';
import { ValidateGameStartService } from './services/database/validateGameStart.service';
import { VideoGameRemoteService } from './services/database/videoGameRemote.service';
import { VideoRemoteService } from './services/database/videoRemote.service';
import { WinnerRemoteService } from './services/database/winnerRemote.service';
import { DecideWinnerService } from './services/database/utils/decideWinner.service';
import { DeductRakeService } from './services/database/utils/deductRake.service';
import { DeductRakefromTableService } from './services/database/utils/deductRakefromTable.service';
import { PrizeDistributionService } from './services/database/utils/prizeDistribution.service';
import { RoundOverService } from './services/database/utils/roundOver.service';
import { SummaryGeneratorService } from './services/database/utils/summaryGenerator.service';
import { EntryHandlerService } from './services/connector/entryHandler.service';

@Module({
  imports: [
    DatabaseModule,
    UtilsModule,

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
  providers: [GameService, GameGateway, RedisService, UserRemoteService, ResponseHandlerService,
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
    TournamentActionHandlerService,
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
    HandleTipDealerService,
    walletQueryService,

    // DATABASE SERVICES START
    AddonManagementService,
    AdjustActiveIndexService,
    DbRemoteService,
    HandleGameStartCaseService,
    LockTableService,
    SetMoveService,
    AdminManagerRemoteService,
    AutoRebuyRemoteService,
    AutoSitRemoteService,
    BlindUpdateService,
    BreakManagementService,
    CalculateChannelDetailsService,
    CalculateRanksService,
    PostsplitService,
    PrecheckRemoteService,
    QuickSeatService,
    RequestRemoteService,
    RewardRakeService,
    SatelliteTournamentService,
    SetTableConfigService,
    SimilarTableService,
    TableConfigManagerService,
    TimeBankRemoteService,
    TipRemoteService,
    TournamentService,
    TournamentLeaveService,
    TournamentRegistrationService,
    TourStartRemoteService,
    ValidateGameStartService,
    VideoGameRemoteService,
    VideoRemoteService,
    WinnerRemoteService,
    DecideWinnerService,
    DeductRakeService,
    DeductRakefromTableService,
    PrizeDistributionService,
    RoundOverService,
    SummaryGeneratorService,
    // DATABASE SERVICES END


    // Connector
    EntryHandlerService
    // Connector

  ],
  exports:[RedisService, DbRemoteService, UserRemoteService, ResponseHandlerService, walletQueryService]
})
export class GameModule {}
