import { Module } from "@nestjs/common";
import { DisconnectionHandlerService } from "./services/disconnectionHandler.service";
import { EntryHandlerService } from "./services/entryHandler.service";
import { BroadcastHandlerService } from "./services/broadcastHandler.service";
import { SessionHandlerService } from "./services/sessionHandler.service";
import { UpdateProfileHandlerService } from "./services/updateProfileHandler.service";
import { LogoutHandlerService } from "./services/logoutHandler.service";
import { RetryHandlerService } from "./services/retryHandler.service";
import { RebuyHandlerService } from "./services/rebuyHandler.service";
import { AddOnHandlerService } from "./services/addOnHandler.service";
import { GetFiltersFromDbService } from "./services/getFiltersFromDb.service";
import { OnlinePlayersService } from "./services/onlinePlayers.service";
import { CommonHandlerService } from "./services/commonHandler.service";
import { TournamentLeaveHandlerService } from "./services/tournamentLeaveHandler.service";
import { TopupHandlerService } from "./services/topupHandler.service";
import { PromotionalDataHandlerService } from "./services/promotionalDataHandler.service";
import { CashOutHandlerFromAppService } from "./services/cashOutHandlerFromApp.service";
import {  PanCardHandlerService } from "./services/panCardHandler.service";
import { BonusHandlerService } from "./services/bonusHandler.service";
import { SpinTheWheelHandlerService } from "./services/spinTheWheelHandler.service";










@Module({

    imports: [],
    providers: [
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
        BonusHandlerService
    ]




})
export class ConnectorModule { }