import { Module } from '@nestjs/common';
import { GameGateway } from './game/game.gateway';
import { RedisService } from './redis/redis.service';
import { DbRemoteService } from './services/database/dbRemote.service';
import { UserRemoteService } from './services/database/userRemote.service';
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
import { WalletQueryService } from './utils/walletQuery.service';
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
import { DatabaseModule } from 'shared/common/datebase/database.module';
import { CommonModule } from 'shared/common/common.module';
import { DisconnectionHandlerService } from './services/connector/disconnectionHandler.service';
import { EntryHandlerService } from './services/connector/entryHandler.service';
import { UpdateProfileHandlerService } from './services/connector/updateProfileHandler.service';
import { LogoutHandlerService } from './services/connector/logoutHandler.service';
import { RetryHandlerService } from './services/connector/retryHandler.service';
import { RebuyHandlerService } from './services/connector/rebuyHandler.service';
import { GetFiltersFromDbService } from './services/connector/getFiltersFromDb.service';
import { AddOnHandlerService } from './services/connector/addOnHandler.service';
import { TopupHandlerService } from './services/connector/topupHandler.service';
import { TournamentLeaveHandlerService } from './services/connector/tournamentLeaveHandler.service';
import { PromotionalDataHandlerService } from './services/connector/promotionalDataHandler.service';
import { CashOutHandlerFromAppService } from './services/connector/cashOutHandlerFromApp.service';
import { PanCardHandlerService } from './services/connector/panCardHandler.service';
import { SpinTheWheelHandlerService } from './services/connector/spinTheWheelHandler.service';
import { BonusHandlerService } from './services/connector/bonusHandler.service';
import { SocketQueryService } from './utils/socketQuery.service';
import { UtilsService } from './utils/utils.service';
import { MegaPointsManagerService } from './services/database/megaPointsManager.service';
import { TableManagerService } from './services/database/tableManager.service';
import { ResponseHandlerRoomService } from './services/room/responseHandlerRoom.service';
import { ResponseHandlerDbService } from './services/database/responseHandlerDb.service';
import { DynamicRanksService } from './services/database/dynamicRanks.service';
import { SharedModuleServie } from 'shared/common/utils/sharedModule.service';

@Module({
  imports: [
    DatabaseModule,
    UtilsModule,
    CommonModule,

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
  controllers: [],
  providers: [
    GameGateway,
    RedisService,
    UserRemoteService,
    ResponseHandlerRoomService,
    JoinChannelHandler,
    ActionLoggerService,
    JoinRequestUtilService,
    ChannelTimerHandlerService,
    BroadcastHandlerService,
    CommonHandlerService,
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
    WalletQueryService,
    MegaPointsManagerService,
    DynamicRanksService,
    SharedModuleServie,

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
    TableManagerService,
    ResponseHandlerDbService,
    // DATABASE SERVICES END



    DisconnectionHandlerService,
    EntryHandlerService,
    BroadcastHandlerService,
    SessionHandlerService,
    UpdateProfileHandlerService,
    LogoutHandlerService,
    RetryHandlerService,
    RebuyHandlerService,
    AddOnHandlerService,
    GetFiltersFromDbService,
    OnlinePlayersService,
    CommonHandlerService,
    TournamentLeaveHandlerService,
    TopupHandlerService,
    PromotionalDataHandlerService,
    CashOutHandlerFromAppService,
    PanCardHandlerService,
    SpinTheWheelHandlerService,
    BonusHandlerService,
    UtilsService,
    SocketQueryService,

  ],
  exports: [RedisService, DbRemoteService, UserRemoteService, WalletQueryService]
})
export class GameModule { }
