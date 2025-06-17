import { Injectable } from "@nestjs/common";
import { stateOfX, popupTextManager, systemConfig } from "shared/common";
import { LeaveRemoteService } from "./leaveRemote.service";
import { MoveRemoteService } from "./moveRemote.service";
import { LogRemoteService } from "./logRemote.service";
import { AutoSitRemoteService } from "./autoSitRemote.service";
import { HandleGameStartCaseService } from "./handleGameStartCase.service";
import { validateKeySets } from "shared/common/utils/activity";
import { TableManagerService } from "./tableManager.service";
import { StartGameRemoteService } from "./startGameRemote.service";
import { PrecheckRemoteService } from "./precheckRemote.service";
import { PlayerShufflingService } from "./playerShuffling.service";
import { TipRemoteService } from "./tipRemote.service";








@Injectable()
export class PerformActionService {

    private messages = popupTextManager.falseMessages;

    constructor(
        private readonly leaveRemote:LeaveRemoteService,
        private readonly tableManager:TableManagerService,
        private readonly startGameRemote:StartGameRemoteService,
        private readonly handleGameStartCase:HandleGameStartCaseService,
        private readonly moveRemote:MoveRemoteService,
        private readonly precheckRemote:PrecheckRemoteService,
        private readonly logRemote:LogRemoteService,
        private readonly playerShuffling:PlayerShufflingService,
        private readonly autoSitRemote:AutoSitRemoteService,
        private readonly tipRemote:TipRemoteService
    ) {}






        /*============================  START  =================================*/
        // To diivert tasks, which are done after locking table object
    // executed either by lockTable or requestRemote

    // New
    async divert (params: any): Promise<any> {
        try {
        const validated = await validateKeySets("Request", "database", "performAction", params);
        if (validated.success) {
            switch (params.actionName.toUpperCase()) {
            case "LEAVE":
                return await this.leaveRemote.leavePlayer(params);
            case "GETTABLE":
                return await this.tableManager.getTableObject(params);
            case "ADDWAITINGPLAYER":
                return await this.tableManager.addPlayerAsWaiting(params);
            case "ADDWAITINGPLAYERFORTOURNAMENT":
                return await this.tableManager.addPlayerAsWaiting(params);
            case "TABLEBUYIN":
                return await this.tableManager.getTableBuyIn(params);
            case "SEATOCCUPIED":
                return await this.tableManager.getSeatOccupied(params);
            case "RESUME":
                return await this.tableManager.resumePlayer(params);
            case "SITOUTNEXTHAND":
                return await this.tableManager.processSitoutNextHand(params);
            case "SITOUTNEXTBIGBLIND":
                return await this.tableManager.processSitoutNextBigBlind(params);
            case "JOINQUEUE":
                return await this.tableManager.joinPlayerInQueue(params);
            case "SETPLAYERATTRIB":
                return await this.tableManager.setPlayerValue(params);
            case "GETTABLEATTRIB":
                return await this.tableManager.getTableValue(params);
            case "SETCURRENTPLAYERDISCONN":
                return await this.tableManager.disconnectCurrentPlayer(params);
            case "GETPLAYERATTRIBUTE":
                return await this.tableManager.getPlayerValue(params);
            case "AUTOSITOUT":
                return await this.tableManager.performAutoSitout(params);
            case "ISPLAYERNOTONTABLE":
                return await this.tableManager.seatsFullOrPlayerNotOnTable(params);
            case "BUYRABBIT":
                return await this.tableManager.buyRabbit(params);
            case "ADDCHIPSONTABLE":
                return await this.tableManager.addChipsOnTable(params);
            case "ADDCHIPSONTABLEINTOURNAMENT":
                return await this.tableManager.addChipsOnTableInTournament(params);
            case "RESETSITOUT":
                return await this.tableManager.resetSitOut(params);
            case "ISSAMENETWORKSIT":
                return await this.tableManager.isSameNetworkSit(params);
            case "SETPLAYERVALUEONTABLE":
                return await this.tableManager.setPlayerValueOnTable(params);
            case "GETCURRENTPLAYER":
                return await this.tableManager.getCurrentPlayer(params);
            case "REMOVEWAITINGPLAYER":
                return await this.tableManager.removeWaitingPlayer(params);
            case "CHANGEDISCONNPLAYERSTATE":
                return await this.tableManager.changeDisconnPlayerState(params);
            case "SETTIMEBANKDETAILS":
                return await this.tableManager.setTimeBankDetails(params);
            case "UPDATETOURNAMENTRULES":
                return await this.tableManager.updateTournamentRules(params);
            case "UPDATEAUTOREBUY":
                return await this.tableManager.updateAutoRebuy(params);
            case "UPDATEAUTOADDON":
                return await this.tableManager.updateAutoAddon(params);
            case "SHUFFLEPLAYERS":
                return await this.playerShuffling.shuffle(params);
            case "STARTGAMEPROCESS":
                return await this.startGameRemote.processStartGame(params);
            case "MAKEMOVE":
                return await this.moveRemote.takeAction(params);
            case "UPDATEPRECHECKORMAKEMOVE":
                return await this.precheckRemote.updatePrecheckOrMakeMoveAfterLock(params);
            case "PROCESSCASES":
                return await this.handleGameStartCase.processGameStartCases(params);
            case "CREATELOG":
                return await this.logRemote.generateLog(params);
            case "LEAVETOURNAMENT":
                return await this.tableManager.leaveTournamentPlayer(params);
            case "AUTOSIT":
                return await this.autoSitRemote.processAutoSit(params);
            case "GETPLAYERCHIPSWITHFILTER":
                return await this.tableManager.getPlayerChipsWithFilter(params);
            case "TIPDEALER":
                return await this.tipRemote.processTip(params);
            case "HANDLEDISCONNECTION":
                return await this.tableManager.handleDisconnection(params);
            default:
                return { success: false, info: this.messages.VALIDATEKEYSETS_FAILED_PERFORMACTION + params.actionName, isRetry: false, isDiplay: true, channelId: (params.channelId || "") };
            }
        } else {
            return validated;
        }
        } catch (error) {
        console.error("Error in divert action:", error);
        return { success: false, error: "Internal error occurred" };
        }
    };
        /*============================  END  =================================*/









}