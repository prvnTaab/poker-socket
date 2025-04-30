import { Injectable } from "@nestjs/common";
import _ from "underscore";
import { stateOfX, } from "shared/common";

import { ImdbDatabaseService } from "shared/common/datebase/Imdbdatabase.service";
import { PokerDatabaseService } from "shared/common/datebase/pokerdatabase.service";
import { WalletService } from "apps/wallet/src/wallet.service";











@Injectable()
export class AutoAddonRemoteService {

    private dbInfoMessage: popupTextManager.dbQyeryInfo;


    constructor(
        private readonly db: PokerDatabaseService,
        private readonly imdb: ImdbDatabaseService,
        private readonly wallet: WalletService
    ) { }




    /*==============================  START  ======================================*/
    /**
     * get tournament room from tournament id
     * @method getTournamentRoom
     * @param  {[type]}   params request json object
     * @param  {Function} cb     callback function
     * @return {[type]}          validated/params
     */
    //New
    async getTournamentRoom(params: any): Promise<any> {
        console.log(stateOfX.serverLogType.info, "in getTournamentRoom in autoAddonRemote " + JSON.stringify(params));

        try {
            const result = await this.db.getTournamentRoom(params.table.tournamentRules.tournamentId.toString());
            if (result) {
                params.tournamentRoom = result;
                return params;
            } else {
                throw params;
            }
        } catch (err) {
            throw params;
        }
    };


    // Old
    // var getTournamentRoom = function(params, cb){
    //     console.log(stateOfX.serverLogType.info, "in getTournamentRoom in autoAddonRemote " + JSON.stringify(params));
    //     db.getTournamentRoom(params.table.tournamentRules.tournamentId.toString(), function(err, result){
    //       if(!err && result){
    //         params.tournamentRoom = result;
    //         cb(null, params);
    //       }
    //       else{
    //         cb(params);
    //       }
    //     })
    //   }
    /*==============================  END  ======================================*/


    /*==============================  START  ======================================*/
    /**
     * get autoAddon for Each Player
     * @method autoAddonForEachPlayer
     * @param  {[type]}   params request json object
     * @param  {Function} cb     callback function
     * @return {[type]}          validated/params
     */

    //   New
    async autoAddonForEachPlayer(params: any): Promise<any> {

        for (const player of params.table.players) {

            if (player.isAutoAddOnEnabled) {
                const newParams: any = {
                    tournamentRoom: params.tournamentRoom,
                    tournamentId: params.table.tournamentRules.tournamentId.toString(),
                    gameVersionCount: params.table.tournamentRules.gameVersionCount,
                    player,
                    blindLevel: params.table.blindLevel
                };


                try {
                    const result1 = await this.checkForAddonTime(newParams);
                    const result2 = await this.checkAddOnAlreadyOpt(result1);
                    const result = await this.updateChips(result2);

                    console.log("err result in autoAddonForEachPlayer", null, result);

                    const chipsToAdd = result?.addOnData?.addOnChips ?? 1000;
                    player.chips += chipsToAdd;
                } catch (err) {
                    console.log("err result in autoAddonForEachPlayer", err);
                    // Continue to next player
                }
            }
        }

        return params;
    };


    //   Old
    //   var autoAddonForEachPlayer = function (params, cb) {
    //     console.log(stateOfX.serverLogType.info, "in autoAddonForEachPlayer in autoAddonRemote " + JSON.stringify(params));
    //     async.eachSeries(params.table.players, function (player, ecb) {
    //         console.log("in autoAddonForEachPlayer in autoAddonRemote eachplayer", player.isAutoAddOnEnabled);
    //         if (player.isAutoAddOnEnabled) {
    //             var newParams = {};
    //             newParams.tournamentRoom = params.tournamentRoom;
    //             newParams.tournamentId = params.table.tournamentRules.tournamentId.toString();
    //             newParams.gameVersionCount = params.table.tournamentRules.gameVersionCount;
    //             newParams.player = player;
    //             newParams.blindLevel = params.table.blindLevel;
    //             console.log("newParams...........", newParams)
    //             async.waterfall([
    //                 async.apply(checkForAddonTime, newParams),
    //                 checkAddOnAlreadyOpt,
    //                 updateChips
    //             ], function (err, result) {
    //                 console.log("err result in autoAddonForEachPlayer", err, result);
    //                 if (!err && !!result) {
    //                     player.chips = player.chips + (result.addOnData && result.addOnData.addOnChips ? result.addOnData.addOnChips : 1000);
    //                     ecb();
    //                 } else {
    //                     ecb();
    //                 }
    //             })

    //         }
    //         else {
    //             ecb();
    //         }

    //     }, function (err, result) {
    //         cb(null, params);

    //     })
    // }
    /*==============================  END  ======================================*/



    /*==============================  START  ======================================*/
    /**
     * check whether addOn time has started
     * @method checkForAddonTime
     * @param  {[type]}   params request json object
     * @param  {Function} cb     callback function
     * @return {[type]}          validated/params
     */
    // New
    async checkForAddonTime(params: any): Promise<any> {

        const addonTimeExist = _.where(params.tournamentRoom.addOnTime, { level: params.blindLevel });

        if (addonTimeExist && addonTimeExist[0]) {
            params.addOnData = addonTimeExist[0];
            return params;
        } else {
            throw { success: false, info: "Something went wrong" };
        }
    };


    // Old
    // var checkForAddonTime = function (params, cb) {
    //     console.log(stateOfX.serverLogType.info, "params is in checkForAddonTime in autoAddonRemote " + JSON.stringify(params));
    //     var addonTimeExist = _.where(params.tournamentRoom.addOnTime, { level: params.blindLevel });
    //     console.log("addonTimeExist in addonRemotr", addonTimeExist)
    //     if (!!addonTimeExist && !!addonTimeExist[0]) {
    //         params.addOnData = addonTimeExist[0];
    //         cb(null, params);
    //     } else {
    //         cb({ success: false, info: "Something went wrong" });
    //     }
    // }
    /*==============================  END  ======================================*/



    /*==============================  START  ======================================*/
    /**
     * check if the player is eligible for add on
     * @method checkAddOnAlreadyOpt
     * @param  {[type]}   params request json object
     * @param  {Function} cb     callback function
     * @return {[type]}          validated/params
     */
    // New
    async checkAddOnAlreadyOpt(params: any): Promise<any> {

        const filter = {
            tournamentId: params.tournamentId,
            playerId: params.player.playerId,
            level: params.addOnData.level
        };

        let rebuy;
        try {
            rebuy = await this.db.countRebuyOpt(filter);
        } catch (err) {
            throw {
                success: false,
                isRetry: false,
                isDisplay: true,
                channelId: "",
                info: "db Error in getting addOn"
            };
        }

        let rebuyCount: number;
        let addOn: number;
        let isEligibleForRebuy = false;

        if (!rebuy) {
            rebuyCount = 0;
            addOn = params.addOnData.addOnChips ?? 1000;
            isEligibleForRebuy = true;
        } else {
            addOn = (rebuy.addOn ?? 0) + (params.addOnData.addOnChips ?? 1000);
            isEligibleForRebuy = rebuy.isEligibleForRebuy;
            rebuyCount = rebuy.rebuyCount;
        }

        if (isEligibleForRebuy) {
            const query = {
                playerId: params.player.playerId,
                tournamentId: params.tournamentId
            };

            const updatedData = {
                playerId: params.player.playerId,
                tournamentId: params.tournamentId,
                level: params.addOnData.level,
                rebuyCount: rebuyCount,
                addOn: addOn,
                isEligibleForAddon: false
            };

            let result;
            try {
                result = await this.db.updateRebuy(query, updatedData);
            } catch (err) {
                throw {
                    success: false,
                    isRetry: false,
                    isDisplay: false,
                    channelId: "",
                    info: this.dbInfoMessage.DBUPDATEREBUY_REBUYHANDLER
                };
            }

            if (!!result) {
                console.log("err result in updateRebuy autoAddonRemote", null, result);
                return params;
            } else {
                throw {
                    success: false,
                    isRetry: false,
                    isDisplay: false,
                    channelId: "",
                    info: this.dbInfoMessage.DBUPDATEREBUY_REBUYHANDLER
                };
            }
        } else {
            throw {
                success: false,
                isRetry: false,
                isDisplay: false,
                channelId: "",
                info: "You've already opted for addOn!"
            };
        }
    };


    // Old
    // var checkAddOnAlreadyOpt = function (params, cb) {
    //     console.log(stateOfX.serverLogType.info, "params is in checkAddOnAlreadyOpt in autoAddonRemote " + JSON.stringify(params));
    //     var filter = {
    //         tournamentId: params.tournamentId,
    //         playerId: params.player.playerId,
    //         level: params.addOnData.level

    //     }
    //     db.countRebuyOpt(filter, function (err, rebuy) {
    //         if (!err) {
    //             var rebuyCount, addOn, isEligibleForRebuy = false;
    //             if (!rebuy) {
    //                 rebuyCount = 0;
    //                 addOn = params.addOnData.addOnChips ?? 1000;
    //                 isEligibleForRebuy = true;
    //             } else {
    //                 addOn = rebuy.addOn + params.addOnData.addOnChips ?? 1000;
    //                 isEligibleForRebuy = rebuy.isEligibleForRebuy;
    //                 rebuyCount = rebuy.rebuyCount;
    //             }
    //             if (isEligibleForRebuy) {
    //                 var query = {
    //                     playerId: params.player.playerId,
    //                     tournamentId: params.tournamentId,
    //                 }
    //                 var updatedData = {
    //                     playerId: params.player.playerId,
    //                     tournamentId: params.tournamentId,
    //                     level: params.addOnData.level,
    //                     rebuyCount: rebuyCount,
    //                     addOn: addOn,
    //                     isEligibleForAddon: false
    //                 }
    //                 db.updateRebuy(query, updatedData, function (err, result) {
    //                     if (!!result) {
    //                         console.log("err result in updateRebuy autoAddonRemote", err, result)
    //                         cb(null, params);
    //                     } else {
    //                         cb({ success: false, isRetry: false, isDisplay: false, channelId: "", info: dbInfoMessage.DBUPDATEREBUY_REBUYHANDLER });
    //                     }
    //                 })
    //             } else {
    //                 cb({ success: false, isRetry: false, isDisplay: false, channelId: "", info: "You've already opted for addOn!" });
    //             }
    //         } else {
    //             cb({ success: false, isRetry: false, isDisplay: true, channelId: "", info: "db Error in getting addOn" });
    //         }
    //     })
    // }
    /*==============================  END  ======================================*/



    /*==============================  START  ======================================*/
    /**
     * update chips of player according to add on
     * @method updateChips
     * @param  {[type]}   params request json object
     * @param  {Function} cb     callback function
     * @return {[type]}          validated/params
     */
    // New
    async updateChips(params: any): Promise<any> {
        try {
            const refNumber = await this.imdb.findRefrenceNumber({ playerId: params.playerId, channelId: params.channelId });

            if (!refNumber || !refNumber.length) {
                params.referenceNumber = 'aa';
            } else {
                params.referenceNumber = refNumber[0].referenceNumber;
            }

            const dataForWallet = {
                action: 'addOn',
                data: {
                    playerId: params.player.playerId,
                    chips: params.addOnData.addOnAmount ?? 1000,
                    isRealMoney: params.tournamentRoom.isRealMoney,
                    referenceNumber: params.player.refrenceNumber
                }
            };

            const response = await this.wallet.sendWalletBroadCast(dataForWallet);

            if (response.success) {
                return params;
            } else {
                throw params;
            }
        } catch (error) {
            throw params;
        }
    };


    // Old
    // var updateChips = function (params, cb) {
    //     imdb.findRefrenceNumber({ playerId: params.playerId, channelId: params.channelId }, async function (err, refNumber) {
    //         if (err || !refNumber.length) {
    //             params.referenceNumber = 'aa'
    //         }
    //         else {
    //             params.referenceNumber = refNumber[0].referenceNumber;
    //         }
    //         let dataForWallet = {
    //             action: 'addOn',
    //             data: {
    //                 playerId: params.player.playerId,
    //                 chips: params.addOnData.addOnAmount ? params.addOnData.addOnAmount : 1000,
    //                 isRealMoney: params.tournamentRoom.isRealMoney,
    //                 referenceNumber: params.player.refrenceNumber
    //             }
    //         }
    //         let response = await wallet.sendWalletBroadCast(dataForWallet)
    //         if (response.success) {
    //             cb(null, params);
    //         }
    //         else {
    //             cb(params);
    //         }
    //     })
    // }
    /*==============================  END  ======================================*/



    /*==============================  START  ======================================*/
    /**
     * the complete addOn process starts here
     * @method autoAddonProcess
     * @param  {[type]}   params request json object
     * @param  {Function} cb     callback function
     * @return {[type]}          validated/params
     */
    // New
    async autoAddonProcess(params: any): Promise<any> {
        try {

            const updatedParams = await this.getTournamentRoom(params);
            const finalParams = await this.autoAddonForEachPlayer(updatedParams);

            return { success: true, params: finalParams };
        } catch (err) {
            console.log(stateOfX.serverLogType.info, "There is ERROR in autoAddonProcess", err);
            return { success: false };
        }
    };


    // Old
    // autoAddonRemote.autoAddonProcess = function (params, cb) {
    //         console.log(stateOfX.serverLogType.info, "params is in autoAddonProcess in autoAddonRemote is -- ", params);
    //         async.waterfall([
    //             async.apply(getTournamentRoom, params),
    //             autoAddonForEachPlayer,
    //         ], function (err, result) {
    //             console.log("err, result in autoAddonProcess", err, result);
    //             if (!err && result) {
    //                 console.log(stateOfX.serverLogType.info, "The result in autoAddonProcess is ----- " + result);
    //                 cb({ success: true, params: result });
    //             } else {
    //                 console.log(stateOfX.serverLogType.info, "There is ERROR in autoAddonProcess ");
    //                 cb({ success: false });
    //             }
    //         })
    //     }
    /*==============================  END  ======================================*/







}