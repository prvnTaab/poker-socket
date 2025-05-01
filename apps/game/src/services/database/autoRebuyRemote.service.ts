import { Injectable } from "@nestjs/common";
import { WalletService } from "apps/wallet/src/wallet.service";
import { stateOfX } from "shared/common";
import { ImdbDatabaseService } from "shared/common/datebase/Imdbdatabase.service";
import { PokerDatabaseService } from "shared/common/datebase/pokerdatabase.service";








@Injectable()
export class AutoRebuyRemoteService {


    constructor(

        private readonly db: PokerDatabaseService,
        private readonly imdb: ImdbDatabaseService,
        private readonly wallet: WalletService,

    ) { }



    /*============================  START  =================================*/
    /**
     * this function is used to getTournamentRoom
     */
    // New
    async getTournamentRoom(params: any): Promise<any> {

        params.temp = {};

        try {
            const tournamentId = params.table.tournamentRules.tournamentId.toString();
            const tournamentRoom: any | null = await this.db.getTournamentRoom(tournamentId);

            if (tournamentRoom) {

                if (tournamentRoom.isRebuyAllowed === false) {
                    return params;
                } else {
                    params.temp.tournamentRoom = tournamentRoom;
                    return params;
                }
            } else {
                console.log("Error in getting tournament room  -- ");
                return params;
            }
        } catch (err) {
            console.log("Error in getting tournament room  -- ");
            return params;
        }
    }

    // Old
    // const getTournamentRoom = function (params, cb) {
    //     console.log("params is in getTournamentRoom in autoRebuyRemote is -- " + JSON.stringify(params));
    //     params.temp = {};
    //     db.getTournamentRoom((params.table.tournamentRules.tournamentId).toString(), function (err, tournamentRoom) {
    //       if (!err && tournamentRoom) {
    //         console.log("params is in dbQuery getTournamentRoom in autoRebuyRemote  -- " + JSON.stringify(tournamentRoom));
    //         if (tournamentRoom.isRebuyAllowed === false) {
    //           console.log("Rebuy is not open now ");
    //           cb(params);
    //         }
    //         else {
    //           params.temp.tournamentRoom = tournamentRoom;
    //           cb(null, params);
    //         }
    //       } else {
    //         console.log("Error in getting tournament room  -- ");
    //         cb(params);
    //       }
    //     })
    //   }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    /**
     * this function is used to update the value of chips and rebuy count for every player through a series of async calls
     */
    //   New
    async autoRebuyProcess(params: any): Promise<any> {
        for (const player of params.table.players) {
            if (player.isAutoReBuyEnabled) {
                const tempParams = {
                    playerId: player.playerId,
                    channelId: player.channelId,
                    gameVersionCount: params.table.gameVersionCount,
                    noOfChipsAtGameStart: params.table.noOfChipsAtGameStart,
                    tournamentId: params.table.tournamentRules.tournamentId,
                    tournamentRoom: params.temp.tournamentRoom,
                    chips: player.chips,
                };

                try {
                    const rebuyCount = await this.countRebuyAlreadyOpt(tempParams);
                    const eligible = await this.isEligibleForRebuy(rebuyCount);
                    const deducted = await this.deductChips(eligible);
                    await this.updateRebuyCount(deducted);

                    player.chips += params.temp.tournamentRoom.chips;
                } catch (err) {
                    console.log(`Error processing auto rebuy for player ${player.playerId}:`, err);
                    // Continue to next player on error
                }
            }
        }

        return params;
    }


    //   Old
    //   const autoRebuyProcess = function (params, cb) {
    //     async.eachSeries(params.table.players, function (player, callback) {
    //       if (player.isAutoReBuyEnabled) {
    //         const tempParams = {
    //           playerId: player.playerId,
    //           channelId: player.channelId,
    //           gameVersionCount: params.table.gameVersionCount,
    //           noOfChipsAtGameStart: params.table.noOfChipsAtGameStart,
    //           tournamentId: params.table.tournamentRules.tournamentId,
    //           tournamentRoom: params.temp.tournamentRoom,
    //           chips: player.chips,
    //         };
    //         async.waterfall([
    //           async.apply(countRebuyAlreadyOpt, tempParams),
    //           isEligibleForRebuy,
    //           deductChips,
    //           updateRebuyCount
    //         ], function (err, result) {
    //           if (err) {
    //             callback();
    //           } else {
    //             player.chips = player.chips + params.temp.tournamentRoom.chips;
    //             callback();
    //           }
    //         })
    //       } else {
    //         callback();
    //       }
    //     }, function (err) {
    //       if (err) {
    //         console.log("ERROR IN AUTOREBUY REMOTE");
    //         cb(err);
    //       } else {
    //         cb(null, params);
    //       }
    //     })
    //   }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    /**
     * this function is used to check if rebuy is already opted
     */
    //   New
    async countRebuyAlreadyOpt(params: any): Promise<any> {

        try {
            const rebuy = await this.db.countRebuyOpt({
                tournamentId: params.tournamentId,
                playerId: params.playerId,
            });


            params.rebuyCount = (rebuy && rebuy.rebuyCount) ? rebuy.rebuyCount : 0;
            params.rebuyObj = rebuy ? rebuy : null;

            return params;
        } catch (err) {
            throw { success: false };
        }
    }
    //   Old
    //   const countRebuyAlreadyOpt = function (params, cb) {
    //     console.log("params is in countRebuyAlreadyOpt in autoRebuyRemote  " + JSON.stringify(params));
    //     db.countRebuyOpt({ tournamentId: params.tournamentId, playerId: params.playerId }, function (err, rebuy) {
    //       console.log("rebuy is in countRebuyAlreadyOpt in autoRebuy handler " + rebuy);
    //       if (!err) {
    //         params.rebuyCount = (!!rebuy && !!rebuy.rebuyCount) ? rebuy.rebuyCount : 0;
    //         params.rebuyObj = !!rebuy ? rebuy : null;
    //         cb(null, params);
    //       } else {
    //         cb({ success: false });
    //       }
    //     })
    //   }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    /**
     * this function is used to check player is eligible for rebuy
     */
    //   New
    async isEligibleForRebuy(params: any): Promise<any> {

        const rebuyTime = params.tournamentRoom.tournamentStartTime + params.tournamentRoom.rebuyTime * 60000;
        const currentTime = Date.now();

        if (params.rebuyCount >= params.tournamentRoom.numberOfRebuy || rebuyTime < currentTime) {
            throw { success: false };
        } else {
            return params;
        }
    }

    //   Old
    //   const isEligibleForRebuy = function (params, cb) {
    //       console.log(stateOfX.serverLogType.info, "params is in isEligibleForRebuy in rebuy handler ");
    //       let rebuyTime = params.tournamentRoom.tournamentStartTime + params.tournamentRoom.rebuyTime * 60000;
    //     let currentTime = Number(new Date());
    //     if(params.rebuyCount >= params.tournamentRoom.numberOfRebuy || rebuyTime < currentTime){
    //       cb({ success: false });
    //       }else {
    //       cb(null, params);
    //       }
    //   }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    /**
     * this function is used to deduct player chips
     */
    //   New
    async deductChips(params: any): Promise<any> {
        try {
            const refNumber = await this.imdb.findRefrenceNumber({
                playerId: params.playerId,
                channelId: params.channelId,
            });

            if (!refNumber || !refNumber.length) {
                params.referenceNumber = 'aa';
            } else {
                params.referenceNumber = refNumber[0].referenceNumber;
            }

            const dataForWallet = {
                action: 'reBuy',
                data: {
                    playerId: params.playerId,
                    chips: params.tournamentRoom.entryFees + params.tournamentRoom.houseFees,
                    isRealMoney: params.tournamentRoom.isRealMoney,
                    channelId: params.channelId,
                    referenceNumber: params.referenceNumber,
                },
            };

            const deductChipsResponse = await this.wallet.sendWalletBroadCast(dataForWallet);

            if (deductChipsResponse.success) {
                return params;
            } else {
                throw { success: false };
            }
        } catch (err) {
            throw { success: false };
        }
    }

    //   Old
    //   const deductChips = function (params, cb) {
    //     imdb.findRefrenceNumber({ playerId: params.playerId, channelId: params.channelId }, async function (err, refNumber) {
    //       if (err || !refNumber.length) {
    //         params.referenceNumber = 'aa'
    //       }
    //       else {
    //         params.referenceNumber = refNumber[0].referenceNumber;
    //       }
    //       let dataForWallet = {
    //         action: 'reBuy',
    //         data: {
    //           playerId: params.playerId,
    //           chips: params.tournamentRoom.entryFees + params.tournamentRoom.houseFees,
    //           isRealMoney: params.tournamentRoom.isRealMoney,
    //           channelId: params.channelId,
    //           referenceNumber: params.referenceNumber
    //         }
    //       }
    //       let deductChipsResponse = await wallet.sendWalletBroadCast(dataForWallet)
    //       if (deductChipsResponse.success) {
    //         cb(null, params);
    //       } else {
    //         cb({ success: false });
    //       }
    //     })
    //   }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    /**
     * this function is used to update the rebuy count
     */
    //   New
    async updateRebuyCount(params: any): Promise<any> {

        const updatedData = {
            playerId: params.playerId,
            tournamentId: params.tournamentId,
            rebuyCount: params.rebuyCount + 1,
            addOn: (params.rebuyObj && params.rebuyObj.addOn) ? params.rebuyObj.addOn : 0,
            isEligibleForAddon: (params.rebuyObj && params.rebuyObj.isEligibleForAddon) ? params.rebuyObj.isEligibleForAddon : false
        };

        try {
            const result = await this.db.updateRebuy(
                { playerId: params.playerId, tournamentId: params.tournamentId },
                updatedData
            );

            if (result) {
                return { success: true };
            } else {
                throw { success: false };
            }
        } catch (err) {
            throw { success: false };
        }
    }

    //   Old
    //   const updateRebuyCount = function (params, cb) {
    //     console.log("params.rebuyCount is in updateRebuyCount in autoRebuyRemote  " + params.rebuyCount);
    //     const updatedData = {
    //       playerId: params.playerId,
    //       tournamentId: params.tournamentId,
    //       rebuyCount: params.rebuyCount + 1,
    //       addOn: (!!params.rebuyObj && !!params.rebuyObj.addOn) ? params.rebuyObj.addOn : 0,
    //       isEligibleForAddon: (!!params.rebuyObj && !!params.rebuyObj.isEligibleForAddon) ? params.rebuyObj.isEligibleForAddon : false
    //     }
    //     db.updateRebuy({ playerId: params.playerId, tournamentId: params.tournamentId, }, updatedData, function (err, result) {
    //       if (!!result) {
    //         cb(null, { success: true });
    //       } else {
    //         cb({ success: false });
    //       }
    //     })
    //   }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    /**
     * this function is used to update the rebuy count
    u */
    //   New
    async updateAutoRebuy(params: any): Promise<any> {

        try {
            const withTournamentRoom = await this.getTournamentRoom(params);
            const result = await this.autoRebuyProcess(withTournamentRoom);

            if (result.temp) {
                delete result.temp;
            }

            return { success: true, params: result };
        } catch (err) {
            console.log("in updateAutoRebuy - ", err, params);
            return { success: true, params: params };
        }
    }

    //   Old
    //   autoRebuyRemote.updateAutoRebuy = function (params, cb) {
    //     console.log("params is in updateAutoRebuy in autoRebuyRemote is -- " + JSON.stringify(params));
    //     async.waterfall([
    //       async.apply(getTournamentRoom, params),
    //       autoRebuyProcess
    //     ], function (err, result) {
    //       console.log("in updateAutoRebuy - ", err, result);
    //       if (err) {
    //         cb({ success: true, params: params });
    //       } else {
    //         // delete result.params.temp;
    //         if (!!result.temp) {
    //           delete result.temp;
    //         }
    //         cb({ success: true, params: result });
    //       }
    //     })
    //   }
    /*============================  END  =================================*/




}