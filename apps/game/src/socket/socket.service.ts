import { Injectable } from "@nestjs/common";
import { route } from "./socket-routes";
import { GateHandler } from "../services/gate/gateHandler.service";

import { EntryHandlerService } from "../services/connector/entryHandler.service";
import { ChannelHandlerService } from "../services/room/channelHandler.service";
import { Socket } from "socket.io";





@Injectable()
export class SocketGatewayService {

    constructor(
        private readonly gateHandlerService: GateHandler,
        private readonly entryHandler: EntryHandlerService,
        private readonly channelHandler: ChannelHandlerService
    ) { }



    async processRequest(client:Socket,params) {

        const { data, action } = params;


        let session: any;


        let isRoutesExist = route(action);


        if (isRoutesExist.success) {


            switch (action) {
                case "login":
                    return await this.gateHandlerService.getConnector(client,data);

                case "updateProfile":
                    return await this.entryHandler.updateProfile(params.data, session); // Pending


                case "getTables":
                    return await this.entryHandler.getLobbyTables(data);
                // return { success: true, route: 'connector.entryHandler.getLobbyTables' }

                
                case "checkForMultiClient": 
                    return await this.entryHandler.enter(client,data); // this was removed and implemented in login event
                    // return { success: true, route: 'connector.entryHandler.enter' }


                case "joinChannel":
                    return await this.channelHandler.joinChannel(client,data);
                // return { success: true, route: 'room.channelHandler.joinChannel' }

                case "autoSit": 
                    // return await this.channelHandler.autoSit(data)
                    // return { success: true, route: 'room.channelHandler.autoSit' }


                case "sitHere": return { success: true, route: 'room.channelHandler.sitHere' }
                case "makeMove": return { success: true, route: 'room.channelHandler.makeMove' }
                case "leaveTable": return { success: true, route: 'room.channelHandler.leaveTable' }
                case "connectionAck": return { success: true, route: 'connector.entryHandler.isConnected' }
                case "reportIssue": return { success: true, route: 'connector.entryHandler.reportIssue' }
                case "chatRequest": return { success: true, route: 'room.channelHandler.chat' }
                case "getProfile": return { success: true, route: "connector.entryHandler.getProfile" }
                case "sitOutNextHand": return { success: true, route: "room.channelHandler.sitoutNextHand" }
                case "sitOutNextBigBlind": return { success: true, route: "connector.entryHandler.sitoutNextBigBlind" }
                case "addChips": return { success: true, route: "room.channelHandler.addChipsOnTable" }
                case "resume": return { success: true, route: "room.channelHandler.resume" }
                case "setAutoBuyIn": return { success: true, route: "connector.entryHandler.setAutoBuyIn" }
                case "getTableStructure": return { success: true, route: "connector.entryHandler.getTableStructure" }
                case "getUsers": return { success: true, route: "connector.entryHandler.getRegisteredTournamentUsers" }
                case "resetSitout": return { success: true, route: "room.channelHandler.resetSitout" }
                case "joinSimilar": return { success: true, route: "connector.entryHandler.joinSimilarTable" }
                case "getBlindAndPrize": return { success: true, route: "connector.entryHandler.getBlindAndPrize" }
                case "setFavTable": return { success: true, route: "connector.entryHandler.addFavourateTable" }
                case "removeFavTable": return { success: true, route: "connector.entryHandler.removeFavourateTable" }
                case "quickSeatCash": return { success: true, route: "connector.entryHandler.quickSeat" }
                case "getPrizes": return { success: true, route: "connector.entryHandler.getPlayerPrize" }
                case "collectPrize": return { success: true, route: "connector.entryHandler.collectPrize" }
                case "getTableData": return { success: true, route: "connector.entryHandler.getTable" }
                case "createNote": return { success: true, route: "connector.entryHandler.createNotes" }
                case "getNote": return { success: true, route: "connector.entryHandler.getNotes" }
                case "updateNote": return { success: true, route: "connector.entryHandler.updateNotes" }
                case "deleteNote": return { success: true, route: "connector.entryHandler.deleteNotes" }
                case "getBlindPrizeTournament": return { success: true, route: "connector.entryHandler.getBlindAndPrizeForNormalTournament" }
                case "setPlayerValOnTable": return { success: true, route: "connector.entryHandler.setPlayerValueOnTable" }
                case "getFilters": return { success: true, route: "connector.entryHandler.getFilters" }
                case "quickSeatTournament": return { success: true, route: "connector.entryHandler.quickSeatInTournament" }
                case "quickSeatSitNGo": return { success: true, route: "connector.entryHandler.quickSeatInSitNGo" }
                case "getHandTab": return { success: true, route: "connector.entryHandler.getHandTab" }
                case "getHandHistory": return { success: true, route: "connector.entryHandler.getHandHistory" }
                case "lateRegistration": return { success: true, route: "connector.entryHandler.lateRegistration" }
                case "joinWaitingList": return { success: true, route: "room.channelHandler.joinWaitingList" }
                case "unJoinWaitingList": return { success: true, route: "room.channelHandler.leaveWaitingList" }
                case "saveVideo": return { success: true, route: "room.channelHandler.insertVideoLog" }
                case "getVideo": return { success: true, route: "room.channelHandler.getVideo" }
                case "rebuyInTournament": return { success: true, route: "connector.entryHandler.rebuyInTournament" }
                case "logout": return { success: true, route: "connector.entryHandler.logout" }
                case "singleLogin": return { success: true, route: "connector.entryHandler.singleLogin" }
                case "connectionAck2": return { success: true, route: "connector.entryHandler.acknowledgeIsConnected" }
                case "getBlindAndPrizeForSatellite": return { success: true, route: "connector.entryHandler.getBlindAndPrizeForSatelliteTournament" }
                case "updateTableSettings": return { success: true, route: "connector.entryHandler.updateTableSettings" }
                case "fireChannelEvent": return { success: true, route: "room.channelHandler.channelBroadcast" }
                case "invokeEmoji": return { success: true, route: "room.channelHandler.emojihandle" }
                case "VPIPhandle": return { success: true, route: "room.channelHandler.VPIPhandle" }
                case "panCardHandler": return { success: true, route: "connector.entryHandler.panCardHandler" }
                case "bankDetailsFromApp": return { success: true, route: "connector.entryHandler.bankDetailsFromApp" }
                case "spinTheWheel": return { success: true, route: "connector.entryHandler.spinTheWheel" }
                case "getSpinIndex": return { success: true, route: "connector.entryHandler.getSpinIndex" }
                case "getFormattedHandsData": return { success: true, route: "room.channelHandler.getFormattedHandsData" }
                case "getHandHistoryDbData": return { success: true, route: "room.channelHandler.getHandHistoryDbData" }
                case "getCashDetails": return { success: true, route: "connector.entryHandler.getCashDetails" }
                case "cashoutRequest": return { success: true, route: "connector.entryHandler.cashOutForPlayerAffilate" }
                case "updatePreCheckOnServer": return { success: true, route: "room.channelHandler.updatePrecheck" }
                case "getTourRoom": return { success: true, route: "room.tourHandler.tourList" }
                case "getRabbitData": return { success: true, route: "room.channelHandler.getRabbitData" }
                case "checkMySession": return { success: true, route: "connector.entryHandler.checkPlayerSession" }
                case "playerRITStatus": return { success: true, route: "room.channelHandler.playerRITStatus" }
                case "getPlayerTopup": return { success: true, route: "connector.entryHandler.getPlayerTopup" }
                case "playerScore": return { success: true, route: "room.channelHandler.playerScore" }
                case "handleMuckedCards": return { success: true, route: "room.channelHandler.handleMuckedCards" }
                case "callTimerStatus": return { success: true, route: "room.channelHandler.callTimerStatus" }
                case "promotionalData": return { success: true, route: "connector.entryHandler.promotionalData" }
                case "leaderBoardData": return { success: true, route: "connector.entryHandler.getLeaderboardData" }
                case "bonusCodeData": return { success: true, route: "connector.entryHandler.bonusCode" }
                case "cashOutHandlerFromApp": return { success: true, route: "connector.entryHandler.cashOutHandlerFromApp" }
                case "addon": return { success: true, route: " connector.entryHandler.addOnInTournamen" }
                case "updateAutoRebuy": return { success: true, route: "connector.entryHandler.updateAutoRebuy" }
                case "updateAutoAddon": return { success: true, route: "connector.entryHandler.updateAutoAddon" }
                case "doubleRebuy": return { success: true, route: "connector.entryHandler.doubleRebuyInTournament" }
                case "leaveTourney": return { success: true, route: "connector.entryHandler.leaveTournament" }
                case "blockMe": return { success: true, route: "connector.entryHandler.blockMe" }
                case "chatOldData": return { success: true, route: "room.channelHandler.chatOldData" }
                case "getGameHistory": return { success: true, route: "connector.entryHandler.playerGameList" }
                case "getVideoData": return { success: true, route: "connector.entryHandler.getVideoData" }
                case "disconnected": return { success: true, route: "connector.disconnectionHandler.handle" }
                case "subscriptionList": return { success: true, route: "room.channelHandler.subscriptionList" }
                case "getSubscription": return { success: true, route: "room.channelHandler.getSubscription" }
                default: return { success: false, info: `route '${params.action}' not Intitated in pomelo divert` }
            }





        } else {
            return isRoutesExist.info;
        }







    }

}