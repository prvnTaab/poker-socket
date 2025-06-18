import { Injectable } from "@nestjs/common";
import { ImdbDatabaseService } from "shared/common/datebase/Imdbdatabase.service";
import { PokerDatabaseService } from "shared/common/datebase/pokerdatabase.service";
import popupTextManager from "shared/common/popupTextManager";
import _ from 'underscore';








//  _ = require('underscore'),
// 	imdb = require("../../../../../shared/model/inMemoryDbQuery.js"),
// 	stateOfX = require("../../../../../shared/stateOfX.js"),
// 	db = require("../../../../../shared/model/dbQuery.js"),
// 	popupTextManager = require("../../../../../shared/popupTextManager"),
// 	async = require("async");




@Injectable()
export class AddOnHandlerService {

    constructor(
        private readonly db: PokerDatabaseService,
        private readonly imdb: ImdbDatabaseService
    ) { }







    initilizeParams(params: any): any {
        return params;
    };

    async getTournamentRoom(params: any): Promise<any> {
        const result = await this.db.getTournamentRoom(params.tournamentId);
        if (result) {
            params.tournamentRoom = result;
            return params;
        } else {
            return {
                success: false,
                isRetry: false,
                isDisplay: true,
                channelId: params.channelId,
                info: popupTextManager.dbQyeryInfo.DBGETTOURNAMENTROOMFAIL_REBUYHANDLER
            };
        }
    };

    /**
     * function to getBlindLevel  
     */
    async getBlindLevel(params: any): Promise<any> {
        const tableResponse = await this.imdb.getTable(params.channelId);
        if (!tableResponse) {
            return { success: false, info: "error in getting blind level" };
        } else {
            params.blindLevel = tableResponse.blindLevel;
            return params;
        }
    };
    /**
     * function to  check if isItAddOnTime  
     */
    isItAddOnTime(params: any): any {
        const addonTimeExist = _.where(params.tournamentRoom.addOnTime, { level: params.blindLevel });
        if (!!addonTimeExist && !!addonTimeExist[0]) {
            params.addOnData = addonTimeExist[0];
            return params;
        } else {
            return { success: false, info: "Something went wrong" };
        }
    };

    /**
     * function to getTournamentUser 
     */
    async getTournamentUser(params: any): Promise<any> {
        const filter = {
            tournamentId: params.tournamentId,
            playerId: params.playerId,
            status: "Registered"
        };

        const tournamentUser = await this.db.findTournamentUser(filter);
        if (tournamentUser && tournamentUser.length > 0) {
            params.tournamentUser = tournamentUser[0];
            return params;
        } else {
            return {
                success: false,
                isRetry: false,
                isDisplay: true,
                channelId: params.channelId,
                info: popupTextManager.dbQyeryInfo.DBFINDTOURNAMENTUSERFAIL_REBUYHANDLER
            };
        }
    };
    /**
     * function to Check for addOn in db in rebuy collection and caculate elligibility
     */
    async checkAddOnAlreadyOpt(params: any): Promise<any> {
        const filter = {
            tournamentId: params.tournamentId,
            playerId: params.playerId,
            level: params.addOnData.level
        };

        const rebuy = await this.db.countRebuyOpt(filter);

        let rebuyCount: number;
        let addOn: number;
        let isEligibleForRebuy = false;

        if (!rebuy) {
            rebuyCount = 0;
            addOn = params.addOnData.addOnChips ?? 1000;
            isEligibleForRebuy = true;
        } else {
            addOn = params.addOnData.addOnChips ?? 1000;
            isEligibleForRebuy = rebuy.isEligibleForRebuy;
            rebuyCount = rebuy.rebuyCount;
        }

        if (isEligibleForRebuy) {
            const query = {
                playerId: params.playerId,
                tournamentId: params.tournamentId
            };
            const updatedData = {
                playerId: params.playerId,
                tournamentId: params.tournamentId,
                rebuyCount,
                addOn,
                isEligibleForAddon: false,
                level: params.addOnData.level
            };

            const result = await this.db.updateRebuy(query, updatedData);
            if (!!result) {
                return params;
            } else {
                return {
                    success: false,
                    isRetry: false,
                    isDisplay: true,
                    channelId: params.channelId,
                    info: popupTextManager.dbQyeryInfo.DBUPDATEREBUY_REBUYHANDLER
                };
            }
        } else {
            return {
                success: false,
                isRetry: false,
                isDisplay: true,
                channelId: params.channelId,
                info: "You've already opted for addOn!"
            };
        }
    };

    /**
     * this function runs only when player is in the game and opt for rebuy
     */
    async addChipsInGame(params: any): Promise<any> {
        const tempParams = {
            channelId: params.channelId,
            playerId: params.playerId,
            amount: params.addOnData.addOnAmount ?? 1000,
            chips: params.addOnData.addOnChips ?? 100,
            action: "addOn",
            isRequested: true
        };

        const addChipsOnTableResponse = await params.self.app.rpc.database.tableRemote.addChipsOnTableInTournament(params.session, tempParams);

        if (addChipsOnTableResponse.success) {
            return params;
        } else {
            await this.db.updateRebuyWithoutInsert(
                { playerId: params.playerId, tournamentId: params.tournamentId },
                { level: params.addOnData.level - 1 }
            );
            return addChipsOnTableResponse;
        }
    };

    /**
     * this function is for toggling the value of isAutoAddon
     */
    async updateAutoAddon(params: any): Promise<any> {
        const tempParams = {
            channelId: params.channelId,
            playerId: params.playerId,
            isAutoAddOnEnabled: params.isAutoAddOn
        };

        const updateAutoAddonResponse = await params.self.app.rpc.database.tableRemote.updateAutoAddon(params.session, tempParams);

        if (updateAutoAddonResponse.success) {
            return {
                success: true,
                channelId: updateAutoAddonResponse.channelId,
                info: "auto addOn updated successfully",
                isRetry: false,
                isDisplay: true
            };
        } else {
            return updateAutoAddonResponse;
        }
    };




    async addOn(params: any): Promise<any> {
        try {
            await this.initilizeParams(params);
            await this.getTournamentRoom(params);
            await this.getBlindLevel(params);
            const addonCheck = await this.isItAddOnTime(params);
            if (!addonCheck.success) return addonCheck;
            await this.getTournamentUser(params);
            const eligibility = await this.checkAddOnAlreadyOpt(params);
            if (!eligibility.success) return eligibility;
            const result = await this.addChipsInGame(params);
            if (!result.success) return result;

            return {
                success: true,
                isRetry: false,
                isDisplay: true,
                channelId: params.channelId,
                info: "addOn successfully done"
            };
        } catch (err) {
            return err;
        }
    };








}