import { Injectable } from "@nestjs/common";
import { stateOfX, popupTextManager, systemConfig } from "shared/common";
import { LeaveRemoteService } from "./leaveRemote.service";
import { MoveRemoteService } from "./moveRemote.service";
import { LogRemoteService } from "./logRemote.service";
import { AutoSitRemoteService } from "./autoSitRemote.service";
import { HandleGameStartCaseService } from "./handleGameStartCase.service";
import { validateKeySets } from "shared/common/utils/activity";
import { TableManagerService } from "./tableManager.service";








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
        private readonly tipRemote:LogRemoteService
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
    

    // Old
    // performAction.divert = function (params, cb) {
    // 	keyValidator.validateKeySets("Request", "database", "performAction", params, function (validated) {
    //     if(validated.success) {
    //       switch(params.actionName.toUpperCase()) {
    // 		  case "LEAVE" 											: leaveRemote.leavePlayer(params, function(response) { cb(response); }); break;
    // 	      case "GETTABLE" 										: this.tableManager.getTableObject(params, function (response) { cb(response); }); break;
    // 	      case "ADDWAITINGPLAYER" 								: this.tableManager.addPlayerAsWaiting(params, function (response) { cb(response); }); break;
    // 	      case "ADDWAITINGPLAYERFORTOURNAMENT" 					: this.tableManager.addPlayerAsWaiting(params, function (response) { cb(response); }); break;
    // 	      case "TABLEBUYIN" 									: this.tableManager.getTableBuyIn(params, function (response) { cb(response); }); break;
    // 	      case "SEATOCCUPIED" 									: this.tableManager.getSeatOccupied(params, function (response) { cb(response); }); break;
    // 	      case "RESUME" 										: this.tableManager.resumePlayer(params, function (response) { cb(response); }); break;
    // 	      case "SITOUTNEXTHAND" 								: this.tableManager.processSitoutNextHand(params, function (response) { cb(response); }); break;
    // 	      case "SITOUTNEXTBIGBLIND" 							: this.tableManager.processSitoutNextBigBlind(params, function (response) { cb(response); }); break;
    // 	      case "JOINQUEUE" 										: this.tableManager.joinPlayerInQueue(params, function (response) { cb(response); }); break;
    // 	      case "SETPLAYERATTRIB" 								: this.tableManager.setPlayerValue(params, function (response) { cb(response); }); break;
    // 	      case "GETTABLEATTRIB" 								: this.tableManager.getTableValue(params, function (response) { cb(response); }); break;
    // 	      case "SETCURRENTPLAYERDISCONN" 						: this.tableManager.disconnectCurrentPlayer(params, function (response) { cb(response); }); break;
    // 	      case "GETPLAYERATTRIBUTE" 							: this.tableManager.getPlayerValue(params, function (response) { cb(response); }); break;
    // 	      case "AUTOSITOUT" 									: this.tableManager.performAutoSitout(params, function (response) { cb(response); }); break;
    // 	      case "ISPLAYERNOTONTABLE" 							: this.tableManager.seatsFullOrPlayerNotOnTable(params, function (response) { cb(response); }); break;
    // 	      case "BUYRABBIT" 								        : this.tableManager.buyRabbit(params, function (response) { cb(response); }); break;
    // 	      case "ADDCHIPSONTABLE" 								: this.tableManager.addChipsOnTable(params, function (response) { cb(response); }); break;
    // 	      case "ADDCHIPSONTABLEINTOURNAMENT" 					: this.tableManager.addChipsOnTableInTournament(params, function (response) { cb(response); }); break;
    // 	      case "RESETSITOUT" 									: this.tableManager.resetSitOut(params, function (response) { cb(response); }); break;
    // 	      case "ISSAMENETWORKSIT" 								: this.tableManager.isSameNetworkSit(params, function (response) { cb(response); }); break;
    // 	      case "SETPLAYERVALUEONTABLE"							: this.tableManager.setPlayerValueOnTable(params, function (response) { cb(response); }); break;
    // 	      case "GETCURRENTPLAYER" 								: this.tableManager.getCurrentPlayer(params, function (response) { cb(response); }); break;
    // 	      case "REMOVEWAITINGPLAYER"							: this.tableManager.removeWaitingPlayer(params, function (response) { cb(response); }); break;
    // 	      case "CHANGEDISCONNPLAYERSTATE"						: this.tableManager.changeDisconnPlayerState(params, function (response) { cb(response); }); break;
    // 	      case "SETTIMEBANKDETAILS" 							: this.tableManager.setTimeBankDetails(params, function (response) { cb(response); }); break;
    // 	      case "UPDATETOURNAMENTRULES" 							: this.tableManager.updateTournamentRules(params, function(response) { cb(response); }); break;
    // 	      case "UPDATEAUTOREBUY" 								: this.tableManager.updateAutoRebuy(params, function(response) { cb(response); }); break;
    // 	      case  "UPDATEAUTOADDON"               				: this.tableManager.updateAutoAddon(params,function(response) { cb(response); }); break;
    // 	      case "SHUFFLEPLAYERS" 								: playerShuffling.shuffle(params, function (response) { cb(response); }); break;
    // 	      case "STARTGAMEPROCESS" 								: startGameRemote.processStartGame(params, function (response) { cb(response); }); break;
    // 	      case "MAKEMOVE" 										: moveRemote.takeAction(params, function (response) { cb(response); }); break;
    // 	      case "UPDATEPRECHECKORMAKEMOVE" 						: precheckRemote.updatePrecheckOrMakeMoveAfterLock(params, function (response) { cb(response); }); break;
    // 	      case "PROCESSCASES" 									: handleGameStartCase.processGameStartCases(params, function (response) { cb(response); }); break;
    // 	      case "CREATELOG" 										: logRemote.generateLog(params, function(response) { cb(response); }); break;
    // 	      case "LEAVETOURNAMENT" 								: this.tableManager.leaveTournamentPlayer(params, function(response) { cb(response); }); break;
    // 	      case "AUTOSIT" 										: autoSitRemote.processAutoSit(params, function(response) { cb(response); }); break;
    // 	      case "GETPLAYERCHIPSWITHFILTER" 						: this.tableManager.getPlayerChipsWithFilter(params, function(response) { cb(response); }); break;
    // 		  case "TIPDEALER"										: tipRemote.processTip(params, function(response) { cb(response); }); break;
    // 	      case "HANDLEDISCONNECTION" 							: this.tableManager.handleDisconnection(params, function(response) { cb(response); }); break;
    // 		  default 												: serverLog(stateOfX.serverLogType.error, 'No action name found - ' + params.actionName); cb({success: false, info: messages.VALIDATEKEYSETS_FAILED_PERFORMACTION + params.actionName, isRetry: false, isDiplay:true, channelId:(params.channelId||"")}); break;
    // 		}
    //     } else {
    //       cb(validated);
    //     }
    //   });
    // }
        /*============================  END  =================================*/









}