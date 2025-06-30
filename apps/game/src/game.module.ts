import { forwardRef, Module } from '@nestjs/common';
import {  SocketGateway } from './socket/socket.gateway';
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
import { UtilsService } from './utils/utils.service';
import { MegaPointsManagerService } from './services/database/megaPointsManager.service';
import { TableManagerService } from './services/database/tableManager.service';
import { ResponseHandlerRoomService } from './services/room/responseHandlerRoom.service';
import { ResponseHandlerDbService } from './services/database/responseHandlerDb.service';
import { DynamicRanksService } from './services/database/dynamicRanks.service';
import { SharedModuleService } from 'shared/common/utils/sharedModule.service';
import { ActionHandlerService } from './services/room/actionHandler.service';
import { HttpModule } from '@nestjs/axios';
import { WaitingListHandlerService } from './services/room/waitingListHandler.service';
import { HandleGameOverService } from './services/database/handleGameOver.service';
import { PerformActionService } from './services/database/performAction.service';
import { MoveRemoteService } from './services/database/moveRemote.service';
import { ManageBountyService } from './services/database/manageBounty.service';
import { LeaveRemoteService } from './services/database/leaveRemote.service';
import { StartGameRemoteService } from './services/database/startGameRemote.service';
import { LogRemoteService } from './services/database/logRemote.service';
import { PlayerShufflingService } from './services/database/playerShuffling.service';
import { DeductBlindsService } from './services/database/deductBlinds.service';
import { DistributeCardsService } from './services/database/distributeCards.service';
import { BroadcastHandlerService1 } from './services/connector/broadcastHandler.service';
import { SessionHandlerService1 } from './services/connector/sessionHandler.service';
import { OnlinePlayersService1 } from './services/connector/onlinePlayers.service';
import { CommonHandlerService1 } from './services/connector/commonHandler.service';
import { SocketGatewayService } from './socket/socket-gateway.service';
import { GateHandler } from './services/gate/gateHandler.service';
import { RoomRemoteService } from './services/room/remote/roomRemote.service';
import { ChannelHandlerService } from './services/room/channelHandler.service';
import { EntryRemoteService } from './services/connector/remote/entryRemote.service';
import { TableRemoteService } from './services/database/tableRemote.service';
import { ChannelRemoteService } from './services/database/channelRemote.service';

@Module({
  imports: [
    HttpModule,
    UtilsModule,
    forwardRef(() => CommonModule),
    ClientsModule.register([
      {
        name: 'POKER_WALLET',
        transport: Transport.TCP,
        options: { host: 'localhost', port: Number(4005) },
      },
    ]),
    
  ],
  controllers: [],
  providers: [
    // CORE SERVICES FIRST (no dependencies on other services in this module)
    SocketGateway,
    GateHandler,
    // Socket
    SocketGatewayService,

    RedisService,
    WalletQueryService,
    UtilsService,
    // SocketQueryService,
    
    // DATABASE FOUNDATION SERVICES
    DbRemoteService,
    AddonManagementService,
    AdjustActiveIndexService,
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
    HandleGameOverService,
    PerformActionService,
    MoveRemoteService, // FIXED: Removed extra comma
    ManageBountyService,
    DynamicRanksService,
    SharedModuleService,
    LeaveRemoteService,
    StartGameRemoteService,
    PlayerShufflingService,
    LogRemoteService,
    DeductBlindsService,
    DistributeCardsService,
    TableRemoteService,
    ChannelRemoteService,
    // SERVICES WITH CIRCULAR DEPENDENCIES (register after their dependencies)
    UserRemoteService, // This depends on MegaPointsManagerService
    MegaPointsManagerService, // This depends on UserRemoteService

    // ROOM/HANDLER SERVICES
    ActionLoggerService,
    JoinRequestUtilService,
    ChannelTimerHandlerService,
    BroadcastHandlerService1,
    CommonHandlerService,
    SubscriptionHandlerService,
    ResponseHandlerRoomService,
    JoinChannelHandler,
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
    DynamicTableHandlerService,
    HandleTipDealerService,
    ActionHandlerService,
    WaitingListHandlerService,
    TournamentJoinHandlerService,
    RoomRemoteService,
    ChannelHandlerService,

    // CIRCULAR DEPENDENCY SERVICES (register last)
    StartGameHandlerService, // This depends on StartTournamentHandlerService
    StartTournamentHandlerService, // This depends on StartGameHandlerService

    // CONNECTOR SERVICES
    DisconnectionHandlerService,
    EntryHandlerService,
    UpdateProfileHandlerService,
    LogoutHandlerService,
    RetryHandlerService,
    RebuyHandlerService,
    AddOnHandlerService,
    GetFiltersFromDbService,
    TournamentLeaveHandlerService,
    TopupHandlerService,
    PromotionalDataHandlerService,
    CashOutHandlerFromAppService,
    PanCardHandlerService,
    SpinTheWheelHandlerService,
    BonusHandlerService,
    BroadcastHandlerService,
    SessionHandlerService1,
    OnlinePlayersService1,
    CommonHandlerService1,
    
    EntryRemoteService

  ],
  exports: [
    RedisService, 
    DbRemoteService, 
    UserRemoteService,
    // ADDED: Export other services that might be needed by other modules
    MegaPointsManagerService,
    StartGameHandlerService,
    StartTournamentHandlerService,
    BroadcastHandlerService,
    CommonHandlerService,
    TournamentActionHandlerService,
    SharedModuleService,
    SocketGateway
  ]
})
export class GameModule { }