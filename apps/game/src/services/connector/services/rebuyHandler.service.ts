import { Injectable } from "@nestjs/common";
import { ImdbDatabaseService } from "shared/common/datebase/Imdbdatabase.service";
import { PokerDatabaseService } from "shared/common/datebase/pokerdatabase.service";
import _ from 'underscore';
import { StartGameHandlerService } from "../../room/startGameHandler.service";
import popupTextManager from "shared/common/popupTextManager";
import stateOfX from "shared/common/stateOfX.sevice";







@Injectable()
export class RebuyHandlerService {

    constructor(
        private readonly imdb: ImdbDatabaseService,
        private readonly db: PokerDatabaseService,
        private readonly startGameHandler: StartGameHandlerService,
    ) { }





    /**
 * this function is used to initilizeParams
 */
    async initilizeParams(params: any): Promise<any> {
        params.userCurrentChips = 0;
        return params;
    }

    /**
     * this function is used to getTournamentRoom
     */
    async getTournamentRoom(params: any): Promise<any> {
        const result = await this.db.getTournamentRoom(params.tournamentId);
        if (!!result) {
            params.tournamentRoom = result;
            return params;
        } else {
            return {
                success: false,
                isRetry: false,
                isDisplay: true,
                channelId: "",
                info: popupTextManager.dbQyeryInfo.DBGETTOURNAMENTROOMFAIL_REBUYHANDLER
            };
        }
    }

    /**
     * this function is used to getTournamentUser
     */
    async getTournamentUser(params: any): Promise<any> {
        const filter = {
            tournamentId: params.tournamentId,
            status: "Registered",
            playerId: params.playerId
        };

        const tournamentUser = await this.db.findTournamentUser(filter);

        if (!!tournamentUser && tournamentUser.length > 0) {
            params.tournamentUser = tournamentUser[0];
            return params;
        } else {
            return {
                success: false,
                isRetry: false,
                isDisplay: true,
                channelId: "",
                info: popupTextManager.dbQyeryInfo.DBFINDTOURNAMENTUSERFAIL_REBUYHANDLER
            };
        }
    }

    /**
     * this function is used to check if countRebuyAlreadyOpt
     */
    async countRebuyAlreadyOpt(params: any): Promise<any> {
        const filter = {
            tournamentId: params.tournamentId,
            playerId: params.playerId
        };

        const rebuy = await this.db.countRebuyOpt(filter);

        if (rebuy !== undefined && rebuy !== null) {
            params.rebuyCount = rebuy.rebuyCount ?? 0;
            return params;
        } else {
            return {
                success: false,
                isRetry: false,
                isDisplay: true,
                channelId: "",
                info: popupTextManager.dbQyeryInfo.DBCOUNTREBUYOPTFAIL_REBUYHANDLER
            };
        }
    }

    /**
     * this function is used to getUserCurrentChips
     */
    async getUserCurrentChips(params: any): Promise<any> {
        if (params.tournamentRoom.state === stateOfX.tournamentState.running) {
            const channels = await this.imdb.getAllTableByTournamentId({ tournamentId: params.tournamentId });

            if (channels && channels.length > 0) {
                for (let channelIt = 0; channelIt < channels.length; channelIt++) {
                    const player = _.where(channels[channelIt].players, { "playerId": params.playerId })[0];
                    if (player) {
                        params.channelId = channels[channelIt].channelId;
                        params.userCurrentChips = player.chips;
                        break;
                    }
                }
                return params;
            } else {
                return {
                    success: false,
                    isRetry: false,
                    isDisplay: true,
                    channelId: "",
                    info: popupTextManager.dbQyeryInfo.DBGETALLTOURNAMENTBYTOURNAMENTIDGETUSERCHIPS_REBUYHANDLER
                };
            }
        } else {
            return params;
        }
    }

    /**
     * this function is used to isEligibleForRebuy
     */
    isEligibleForRebuy(params: any): any {
        const rebuyTime = params.tournamentRoom.tournamentStartTime + params.tournamentRoom.rebuyTime * 60000;
        const currentTime = Number(new Date());

        if (params.rebuyCount >= params.tournamentRoom.numberOfRebuy) {
            return { success: false, info: "You've already opted for max Rebuy allowed in the game" };
        } else if (rebuyTime < currentTime) {
            return { success: false, info: "Rebuy Time is over" };
        } else {
            return { success: true };
        }
    }
    /**
     * this function is used to addChipsInGame
     */
    async addChipsInGame(params: any): Promise<any> {
        const tempParams = {
            channelId: params.channelId,
            playerId: params.playerId,
            chips: params.tournamentRoom.chips,
            amount: params.tournamentRoom.houseFees + params.tournamentRoom.entryFees,
            action: "reBuy",
            isRequested: true
        };

        const addChipsOnTableResponse = await params.self.app.rpc.database.tableRemote.addChipsOnTableInTournament(params.session, tempParams);

        if (addChipsOnTableResponse.success) {
            return params;
        } else {
            return addChipsOnTableResponse;
        }
    }
    /**
     * this function will update rebuy count or ceate new one
     */
    async updateRebuyCount(params: any): Promise<any> {
        const query = {
            playerId: params.playerId,
            tournamentId: params.tournamentId,
        };

        const updatedData = {
            playerId: params.playerId,
            tournamentId: params.tournamentId,
            rebuyCount: params.rebuyCount + 1,
            addOn: 0,
            isEligibleForAddon: false
        };

        const result = await this.db.updateRebuy(query, updatedData);

        if (result) {
            return params;
        } else {
            return {
                success: false,
                isRetry: false,
                isDisplay: true,
                channelId: "",
                info: popupTextManager.dbQyeryInfo.DBUPDATEREBUY_REBUYHANDLER
            };
        }
    }

    /**
     * this function will performRebuy
     */
    async performRebuy(params: any): Promise<any> {
        const addChipsResult = await this.addChipsInGame(params);
        if (!addChipsResult.success) {
            return addChipsResult;
        }

        const updateRebuyResult = await this.updateRebuyCount(addChipsResult);
        if (!updateRebuyResult.success) {
            return updateRebuyResult;
        }

        return { success: true };
    }
    /**
     * this function is for rebuyProcess
     */
    async rebuyProcess(params: any): Promise<any> {
        const eligibleForRebuy = this.isEligibleForRebuy(params);

        if (!eligibleForRebuy.success) {
            return {
                success: false,
                isRetry: false,
                isDisplay: true,
                channelId: "",
                info: eligibleForRebuy.info
            };
        }

        const performRebuyResponse = await this.performRebuy(params);

        if (performRebuyResponse.success) {
            return {
                ...performRebuyResponse,
                self: params.self,
                channelId: params.channelId,
                session: params.session
            };
        } else {
            return performRebuyResponse;
        }
    }
    /**
     * this function contains a series of functions in waterfall to be executed
     */
    async rebuy(params: any): Promise<any> {
        const initializedParams = await this.initilizeParams(params);
        const tournamentRoomData = await this.getTournamentRoom(initializedParams);
        const tournamentUserData = await this.getTournamentUser(tournamentRoomData);
        const rebuyCountData = await this.countRebuyAlreadyOpt(tournamentUserData);
        const userChipsData = await this.getUserCurrentChips(rebuyCountData);
        const result = await this.rebuyProcess(userChipsData);

        if (!result || result.success === false) {
            return result;
        }

        await this.imdb.updateSeats(result.channelId, {
            rebuyDataForBroadcast: {
                outOfMoneyPlayer: [],
                playingPlayer: [],
                endsAt: -1
            }
        });

        this.startGameHandler.startGame({
            self: result.self,
            session: result.session,
            channelId: result.channelId,
            channel: params.self.app.get('channelService').getChannel(result.channelId, false),
            eventName: stateOfX.startGameEvent.gameOver
        });

        return {
            success: true,
            isRetry: false,
            isDisplay: true,
            channelId: "",
            info: popupTextManager.falseMessages.REBUY_TRUE_REBUYHANDLER
        };
    };


    /**
     *  this function update rebuy count or ceate new one
     */
    async updateDoubleRebuyCount(params: any): Promise<any> {
        const query = {
            playerId: params.playerId,
            tournamentId: params.tournamentId,
        };

        const updatedData = {
            playerId: params.playerId,
            tournamentId: params.tournamentId,
            rebuyCount: params.rebuyCount + 2,
            addOn: 0,
            isEligibleForAddon: false
        };

        const result = await this.db.updateRebuy(query, updatedData);

        if (result) {
            return params;
        } else {
            return {
                success: false,
                isRetry: false,
                isDisplay: true,
                channelId: "",
                info: popupTextManager.dbQyeryInfo.DBUPDATEREBUY_REBUYHANDLER
            };
        }
    };

    /**
     * this function runs only when player is in the game and opt for rebuy
     */
    async addChipsInGameForDoubleRebuy(params: any): Promise<any> {
        const tempParams = {
            channelId: params.channelId,
            playerId: params.playerId,
            chips: params.tournamentRoom.noOfChipsAtGameStart * 2,
            amount: params.tournamentRoom.buyIn * 2,
            action: "reBuy",
            isRequested: true
        };

        const response = await params.self.app.rpc.database.tableRemote.addChipsOnTableInTournament(params.session, tempParams);

        if (response.success) {
            return params;
        } else {
            return response;
        }
    };


    /**
     *  this function is used to performDoubleRebuy.
     */
    async performDoubleRebuy(params: any): Promise<any> {
        const chipsAdded = await this.addChipsInGameForDoubleRebuy(params);
        const updatedRebuyCount = await this.updateDoubleRebuyCount(chipsAdded);
        return { success: true };
    };

    /**
     * This function is used to check if user is eligible for double rebuy.
     */
    isEligibleForDoubleRebuy(params: any): any {
        let rebuyTime = params.tournamentRoom.tournamentStartTime + params.tournamentRoom.rebuyTime * 60000;
        let currentTime = Number(new Date());

        if (
            params.tournamentRoom.state === stateOfX.tournamentState.running &&
            (params.rebuyCount + 1) < params.tournamentRoom.numberOfRebuy &&
            params.userCurrentChips < params.tournamentRoom.rebuyMaxLimitForChips &&
            rebuyTime > currentTime
        ) {
            return { success: true };
        } else {
            return { success: false };
        }
    };

    /**
     * This function is used for doubleRebuyProcess.
     */
    async doubleRebuyProcess(params: any): Promise<any> {
        const eligibleForRebuy = this.isEligibleForDoubleRebuy(params);

        if (!eligibleForRebuy.success) {
            return {
                success: false,
                isRetry: false,
                isDisplay: true,
                channelId: "",
                info: popupTextManager.falseMessages.REBUYPROCESSFAIL_REBUYHANDLER
            };
        }

        const performRebuyResponse = await this.performDoubleRebuy(params);

        if (performRebuyResponse.success) {
            return performRebuyResponse;
        } else {
            return performRebuyResponse;
        }
    };


    /**
     *  this function is used for doubleRebuy.
     */

    async doubleRebuy(params: any): Promise<any> {
        await this.initilizeParams(params);
        await this.getTournamentRoom(params);
        await this.getTournamentUser(params);
        await this.countRebuyAlreadyOpt(params);
        await this.getUserCurrentChips(params);
        await this.doubleRebuyProcess(params);

        return {
            success: true,
            isRetry: false,
            isDisplay: true,
            channelId: "",
            info: popupTextManager.falseMessages.REBUY_TRUE_REBUYHANDLER
        };
    };

    /**
     *  this function is used to updateAutoRebuy.
     */
    async updateAutoRebuy(params: any): Promise<any> {
        const tempParams = {
            channelId: params.channelId,
            playerId: params.playerId,
            isAutoRebuyEnabled: params.isAutoRebuy
        };

        const updateAutoRebuyResponse = await params.self.app.rpc.database.tableRemote.updateAutoRebuy(
            params.session,
            tempParams
        );

        if (updateAutoRebuyResponse.success) {
            return {
                success: true,
                channelId: updateAutoRebuyResponse.channelId,
                info: "auto rebuy updated successfully",
                isRetry: false,
                isDisplay: true
            };
        } else {
            return updateAutoRebuyResponse;
        }
    };















}