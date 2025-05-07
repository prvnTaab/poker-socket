import { Injectable } from "@nestjs/common";
import _ld from "lodash";
import _ from 'underscore';
import { stateOfX, popupTextManager, systemConfig } from "shared/common";
import { PokerDatabaseService } from "shared/common/datebase/pokerdatabase.service";
import { ImdbDatabaseService } from "shared/common/datebase/Imdbdatabase.service";
import { UserRemoteService } from "./userRemote.service";











var profileMgmt = require("../../../../../shared/model/profileMgmt");
const wallet = require('../../walletQuery');





@Injectable()
export class MegaPointsManagerService {

    private limitForBonus = 100;
    private awardForBonus = 10;
    private limitForChips = 1000;
    // private awardForChips = 100;
    private awardForChips = 20; // GIVE LESS CHIPS TO PLAYERS; IT IS TOO MUCH

    constructor(
        private readonly db: PokerDatabaseService,
        private readonly imdb: ImdbDatabaseService,
        private readonly wallet: WalletService,
        private readonly userRemote: UserRemoteService,

    ) { }







    /*============================  START  =================================*/
    // fetch megapoint levels from db
    // New
    async getLevels(params: any): Promise<any> {

        try {
            const res = await this.db.findAllLoyaltyPoints({});

            params.allLevels = res.length > 0 ? res : [];
            return params;
        } catch (err) {
            console.log(stateOfX.serverLogType.info, 'response of findAllMegaPointLevels', err, null);
            throw { success: false, info: "db - query failed.- findAllMegaPointLevels" };
        }
    };

    // Old
    // var getLevels = function (params, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'in megaPointsManager in getLevels');
    //     // one of two methods - 
    //     /// somewhere in app variable
    //     /// db query to adminDB
    //     adminDB.findAllLoyaltyPoints({}, function (err, res) {
    //         serverLog(stateOfX.serverLogType.info, 'response of findAllMegaPointLevels', err, res)
    //         if (err || !res) {
    //             cb({ success: false, info: "db - query failed.- findAllMegaPointLevels" });
    //             return;
    //         } else {
    //             if (res.length <= 0) {
    //                 params.allLevels = [];
    //                 cb(null, params);
    //                 return;
    //             } else {
    //                 params.allLevels = res;
    //                 cb(null, params);
    //                 return;
    //             }
    //         }
    //     })
    // }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    // fetch user profile
    // some keys related to megapoints
    // New
    async getProfileData(player: any, params: any): Promise<any> {

        try {
            const user: any = await this.db.findUser({ playerId: player.playerId });

            if (!user) {
                throw new Error('find user failed');
            }

            player.megaPointLevel = user.statistics.megaPointLevel || 1; // 1-Bronze
            player.megaPoints = user.statistics.megaPoints || 0;
            player.countPointsToChips = user.statistics.countPointsToChips || 0;
            player.countPointsForBonus = user.statistics.countPointsForBonus || 0;
            player.createdAt = user.createdAt || Date.now();

            return [player, params];
        } catch (error) {
            throw { info: 'find user failed' };
        }
    };

    // Old
    // var getProfileData = function (player, params, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'in megaPointsManager in getProfileData');
    //     db.findUser({ playerId: player.playerId }, function (err, user) {
    //         if (err || !user) {
    //             cb({ info: 'find user failed' });
    //         } else {
    //             player.megaPointLevel = user.statistics.megaPointLevel || 1; // 1-Bronze
    //             player.megaPoints = user.statistics.megaPoints || 0;
    //             player.countPointsToChips = user.statistics.countPointsToChips || 0;
    //             player.countPointsForBonus = user.statistics.countPointsForBonus || 0;
    //             player.createdAt = user.createdAt || Number(new Date());
    //             cb(null, player, params);
    //         }
    //     })
    // }
    /*============================  END  =================================*/

    /*============================  START  =================================*/
    // calculate megapoints in this game
    // and accordingly, check if various threshold crossed
    // - megapoint level change
    // - award chips 1000 crossed
    // - award bonus 100 crossed
    // New
    async calculateMegaPoints(player: any, params: any): Promise<any> {

        player.addMegaPoints = (player.amount * this.getPercent(params.allLevels, player.megaPointLevel)) / 100;
        player.levelChange = this.checkThresholdCrossed(params.allLevels, player.megaPointLevel, player.megaPoints, player.addMegaPoints);
        player.countPointsToChipsCrossed = this.checkCountCrossed(this.limitForChips, player.countPointsToChips, player.addMegaPoints);
        player.countPointsForBonusCrossed = this.checkCountCrossed(this.limitForBonus, player.countPointsForBonus, player.addMegaPoints);


        return [player, params];
    };

    // Old
    // var calculateMegaPoints = function (player, params, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'in megaPointsManager in calculateMegaPoints');
    //     player.addMegaPoints = (player.amount * getPercent(params.allLevels, player.megaPointLevel)) / 100;
    //     player.levelChange = checkThresholdCrossed(params.allLevels, player.megaPointLevel, player.megaPoints, player.addMegaPoints); // Boolean
    //     player.countPointsToChipsCrossed = checkCountCrossed(limitForChips, player.countPointsToChips, player.addMegaPoints); // Boolean
    //     player.countPointsForBonusCrossed = checkCountCrossed(limitForBonus, player.countPointsForBonus, player.addMegaPoints); // Boolean
    //     serverLog(stateOfX.serverLogType.info, 'in megaPointsManager in calculateMegaPoints ' + JSON.stringify(player));
    //     cb(null, player, params);
    // }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    // increase megapoints in all three counters in user profile

    // New
    async awardPointsInProfile(player: any, params: any): Promise<any> {

        const res = await this.userRemote.updateStats(
            {
                playerId: player.playerId,
                data: {
                    "statistics.megaPoints": player.addMegaPoints,
                    "statistics.countPointsToChips": player.addMegaPoints,
                    "statistics.countPointsForBonus": player.addMegaPoints,
                },
                bySystem: true,
            }
        );


        return [player, params];
    };

    // Old
    // var awardPointsInProfile = function (player, params, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'in megaPointsManager in awardPointsInProfile');
    //     userRemote.updateStats({ playerId: player.playerId, data: { "statistics.megaPoints": player.addMegaPoints, "statistics.countPointsToChips": player.addMegaPoints, "statistics.countPointsForBonus": player.addMegaPoints }, bySystem: true }, function (res) {
    //         serverLog(stateOfX.serverLogType.info, 'done megaPoints count--- userRemote.updateStats' + JSON.stringify(res));
    //         cb(null, player, params);
    //     })
    // }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    // increase megapoints in expiry slot
    // if slot found for current month
    // New
    async scheduleToExpire(player: any, params: any): Promise<any> {

        const query = {
            playerId: player.playerId,
            countingEndsAt: { $gte: Date.now() },
        };

        const updateData = {
            $inc: { points: player.addMegaPoints },
        };

        try {
            const res = await this.db.updateExpirySlot(query, updateData);

            if (res.result.n <= 0) {
                // slot creation required
                player.newSlot = this.createSlotData(player, params.allLevels);
            } else {
                player.newSlot = false;
            }

            return [player, params];
        } catch (err) {
            console.log(stateOfX.serverLogType.error, 'Error updating expiry slot: ' + JSON.stringify(err));
            throw err;
        }
    };

    // Old
    // var scheduleToExpire = function (player, params, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'in megaPointsManager in scheduleToExpire');
    //     var query = {
    //         playerId: player.playerId,
    //         countingEndsAt: { $gte: Number(new Date()) }
    //     };
    //     var updateData = {
    //         $inc: { "points": player.addMegaPoints }
    //     };
    //     db.updateExpirySlot(query, updateData, function (err, res) {
    //         serverLog(stateOfX.serverLogType.info, 'saved slot in db ' + JSON.stringify(err) + JSON.stringify(res))
    //         if (res.result.n <= 0) {
    //             // slot creation required
    //             player.newSlot = createSlotData(player, params.allLevels);
    //             cb(null, player, params);
    //         } else {
    //             player.newSlot = false;
    //             cb(null, player, params);
    //         }
    //         // cb(null, player, params);
    //     })
    // }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    // increase megapoints in expiry slot
    // by creating new slot for this month in db
    // New
    async scheduleToExpireUpsert(player: any, params: any): Promise<any> {

        if (player.newSlot) {

            const query = {
                playerId: player.playerId,
                countingEndsAt: player.newSlot.countingEndsAt,
            };

            const updateData = {
                $inc: { points: player.addMegaPoints },
                $set: {
                    expiresAt: player.newSlot.expiresAt,
                    expireStatus: player.newSlot.expireStatus,
                },
            };

            try {
                const res = await this.db.upsertExpirySlot(query, updateData);
            } catch (err) {
                console.log(stateOfX.serverLogType.error, 'Error upserting expiry slot: ' + JSON.stringify(err));
                throw err;
            }
        }

        return [player, params];
    };

    // Old
    // var scheduleToExpireUpsert = function (player, params, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'in megaPointsManager newSlot - ' + JSON.stringify(player.newSlot));
    //     if (player.newSlot) {
    //         serverLog(stateOfX.serverLogType.info, 'in megaPointsManager in scheduleToExpireUpsert');
    //         var query = {
    //             playerId: player.playerId,
    //             countingEndsAt: player.newSlot.countingEndsAt
    //         }
    //         var updateData = {
    //             $inc: { "points": player.addMegaPoints },
    //             $set: { "expiresAt": player.newSlot.expiresAt, "expireStatus": player.newSlot.expireStatus }
    //         }
    //         db.upsertExpirySlot(query, updateData, function (err, res) {
    //             serverLog(stateOfX.serverLogType.info, 'upserted slot in db' + JSON.stringify(err) + JSON.stringify(res));
    //             cb(null, player, params);
    //         })
    //     } else {
    //         cb(null, player, params);
    //     }
    // }
    /*============================  END  =================================*/



    /*============================  START  =================================*/
    // update megapoint level in user profile if changed
    // New
    async updateLevelInProfile(player: any, params: any): Promise<any> {

        const t = player.levelChange;
        if (t) {
            const dataForWallet = {
                action: 'updateUser',
                data: {
                    filter: { playerId: player.playerId },
                    updateKeys: { "statistics.megaPointLevel": t.value }
                }
            };
            wallet.sendWalletBroadCast(dataForWallet);
        }

        return [player, params];
    };

    // Old
    // var updateLevelInProfile = async function (player, params, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'in megaPointsManager in updateLevelInProfile');
    //     var t = player.levelChange;
    //     if (t) {
    //         let dataForWallet = {
    //             action: 'updateUser',
    //             data: {
    //                 filter: { playerId: player.playerId, },
    //                 updateKeys: { "statistics.megaPointLevel": t.value }
    //             }
    //         }
    //         wallet.sendWalletBroadCast(dataForWallet)
    //         cb(null, player, params);
    //         return; // mandatory return
    //     } else {
    //         cb(null, player, params);
    //     }
    // }
    /*============================  END  =================================*/



    /*============================  START  =================================*/
    // adjust bonus amount and balance in user profile if theshold crossed - limitForBonus
    // New
    async checkToConvertUnclaimedMegaBonus(player: any, params: any): Promise<any> {

        if (player.countPointsForBonusCrossed) {
            const times = player.countPointsForBonusCrossed;
            const totalDecrease = times * this.limitForBonus;
            const totalIncrease = times * this.awardForBonus;

            try {
                const decreaseRes = await this.db.increaseUserStats(
                    { playerId: player.playerId },
                    { "statistics.countPointsForBonus": -totalDecrease }
                );

                if (!decreaseRes) {
                    console.log(stateOfX.serverLogType.error, 'decreasing statistics.countPointsForBonus failed');
                } else {
                    console.log(stateOfX.serverLogType.info, `decreased statistics.countPointsForBonus by ${totalDecrease} successfully`);

                    const bonusList = await this.db.findBounsData({ playerId: player.playerId });

                    if (!bonusList) {
                        console.log(stateOfX.serverLogType.error, 'bonus listing failed');
                    } else {
                        const remainingAmt = this.updateBonus(bonusList, totalIncrease);
                        const claimedAmt = totalIncrease - remainingAmt;

                        if (claimedAmt > 0) {
                            const updateRes = await this.db.updateBounsDataSetKeys(
                                { playerId: player.playerId },
                                { bonus: bonusList.bonus }
                            );

                            if (!updateRes) {
                                console.log(stateOfX.serverLogType.error, 'bonus claiming update failed');
                            } else {
                                const addChipsRes = await profileMgmt.addChips({
                                    chips: claimedAmt,
                                    playerId: player.playerId,
                                    isRealMoney: true
                                });

                                console.log('addChips for mega1 profileMgmt', addChipsRes);

                                if (addChipsRes.success) {
                                    player.chipsBroadcast = true;
                                    console.log(stateOfX.serverLogType.info, '10 real money awarded - from mega bonus - on megapoints crossed 100');
                                } else {
                                    console.log(stateOfX.serverLogType.error, 'failed - 10 real money awarded - from mega bonus - on megapoints crossed 100');
                                }
                            }
                        }
                    }
                }
            } catch (error) {
                console.log(stateOfX.serverLogType.error, `Error in checkToConvertUnclaimedMegaBonus: ${error}`);
            }
        }

        return [player, params];
    };

    // Old
    // var checkToConvertUnclaimedMegaBonus = function (player, params, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'in megaPointsManager in checkToConvertUnclaimedMegaBonus');
    //     // if becomes greater than 100
    //     // - decrease 100 from it
    //     // - find unclaimed bonus collection
    //     // - if found 
    //     // - - make 10 unclaimed to claimed
    //     // - - inc real money user profile
    //     if (player.countPointsForBonusCrossed) {
    //         var times = player.countPointsForBonusCrossed;
    //         var totalDecrease = times * limitForBonus;
    //         var totalIncrease = times * awardForBonus;
    //         // not increasing actually - decreasing
    //         db.increaseUserStats({ playerId: player.playerId }, { "statistics.countPointsForBonus": -totalDecrease }, function (err, res) {
    //             if (err || !res) {
    //                 serverLog(stateOfX.serverLogType.error, 'decreasing statistics.countPointsForBonus failed');
    //             } else {
    //                 serverLog(stateOfX.serverLogType.info, 'decreased statistics.countPointsForBonus by ' + totalDecrease + ' successfully');
    //                 db.findBounsData({ playerId: player.playerId }, function (err, bonusList) {
    //                     if (err || !bonusList) {
    //                         // failed
    //                         serverLog(stateOfX.serverLogType.error, 'bonus listing failed');
    //                     } else {
    //                         var remainingAmt = updateBonus(bonusList, totalIncrease);
    //                         var claimedAmt = totalIncrease - remainingAmt;
    //                         if (claimedAmt > 0) {
    //                             db.updateBounsDataSetKeys({ playerId: player.playerId }, { bonus: bonusList.bonus }, function (err, response) {
    //                                 if (err || !response) {
    //                                     serverLog(stateOfX.serverLogType.error, 'bonus claiming update failed');
    //                                 } else {
    //                                     profileMgmt.addChips({ chips: claimedAmt, playerId: player.playerId, isRealMoney: true }, function (addChipsRes) {
    //                                         console.log('addChips for mega1 profileMgmt', addChipsRes)
    //                                         if (addChipsRes.success) {
    //                                             player.chipsBroadcast = true;
    //                                             serverLog(stateOfX.serverLogType.info, '10 real money awarded - from mega bonus - on megapoints crossed 100');
    //                                         } else {
    //                                             serverLog(stateOfX.serverLogType.error, 'failed - 10 real money awarded - from mega bonus - on megapoints crossed 100');
    //                                         }
    //                                     })
    //                                 }
    //                             })
    //                         }
    //                     }
    //                 })
    //             }
    //         })
    //     }
    //     cb(null, player, params);
    // }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    // adjust balance in user profile if theshold crossed - limitForChips
    // New
    async checkToConvertMegaPoints(player: any, params: any): Promise<any> {
        if (player.countPointsToChipsCrossed) {
            const times = player.countPointsToChipsCrossed;
            const totalDecrease = times * this.limitForChips;
            const totalIncrease = times * this.awardForChips;

            try {
                const decreaseRes = await this.db.increaseUserStats(
                    { playerId: player.playerId },
                    { "statistics.countPointsToChips": -totalDecrease }
                );

                if (!decreaseRes) {
                    console.log(
                        stateOfX.serverLogType.error,
                        "decreasing statistics.countPointsToChips failed"
                    );
                } else {
                    console.log(
                        stateOfX.serverLogType.info,
                        `decreased statistics.countPointsToChips by ${totalDecrease} successfully`
                    );

                    const balanceSheetRes = await this.db.updateBalanceSheet({
                        $inc: { bonus: totalIncrease || 0 },
                    });

                    if (balanceSheetRes) {
                        console.log(
                            stateOfX.serverLogType.info,
                            `balance sheet updated successfully. ${JSON.stringify(
                                balanceSheetRes.result
                            )}`
                        );

                        const addChipsRes = await profileMgmt.addChips({
                            chips: totalIncrease,
                            playerId: player.playerId,
                            isRealMoney: true,
                        });

                        console.log("addChips for mega2 profileMgmt", addChipsRes);

                        if (addChipsRes.success) {
                            player.chipsBroadcast = true;
                            console.log(
                                stateOfX.serverLogType.info,
                                "100 real money awarded - on megapoints crossed 1000"
                            );

                            const increaseRes = await this.db.increaseUserStats(
                                { playerId: player.playerId },
                                { "statistics.megaChipsGainedTotal": totalIncrease }
                            );

                            if (!increaseRes) {
                                console.log(
                                    stateOfX.serverLogType.error,
                                    "increasing statistics.megaChipsGainedTotal failed"
                                );
                            } else {
                                console.log(
                                    stateOfX.serverLogType.info,
                                    `increased statistics.megaChipsGainedTotal by ${totalIncrease} successfully`
                                );
                            }
                        } else {
                            console.log(
                                stateOfX.serverLogType.error,
                                "failed - 100 real money awarded - on megapoints crossed 1000"
                            );
                        }
                    } else {
                        console.log(
                            stateOfX.serverLogType.error,
                            "Error while updating data balance sheet."
                        );
                    }
                }
            } catch (error) {
                console.log(
                    stateOfX.serverLogType.error,
                    `Error in checkToConvertMegaPoints: ${error}`
                );
            }
        }

        return [player, params];
    };

    // Old
    // var checkToConvertMegaPoints = function (player, params, cb) {
    //     // if becomes greater than 1000
    //     // - decrease 1000 from it
    //     // - add real money 100 user profile
    //     // - add 100 in total gained megachips
    //     if (player.countPointsToChipsCrossed) {
    //         var times = player.countPointsToChipsCrossed;
    //         var totalDecrease = times * limitForChips;
    //         var totalIncrease = times * awardForChips;
    //         db.increaseUserStats({ playerId: player.playerId }, { "statistics.countPointsToChips": -totalDecrease }, function (err, res) {
    //             if (err || !res) {
    //                 serverLog(stateOfX.serverLogType.error, 'decreasing statistics.countPointsToChips failed')
    //             } else {
    //                 serverLog(stateOfX.serverLogType.info, 'decreased statistics.countPointsToChips by ' + totalDecrease + ' successfully')
    //                 financeDB.updateBalanceSheet({ $inc: { "bonus": totalIncrease || 0 } }, function (err, result) {
    //                     if (!err && result) {
    //                         serverLog(stateOfX.serverLogType.info, "balance sheet updated successfully." + JSON.stringify(result.result));
    //                         profileMgmt.addChips({ chips: totalIncrease, playerId: player.playerId, isRealMoney: true }, function (addChipsRes) {
    //                             console.log('addChips for mega2 profileMgmt', addChipsRes)
    //                             if (addChipsRes.success) {
    //                                 player.chipsBroadcast = true;
    //                                 serverLog(stateOfX.serverLogType.info, '100 real money awarded - on megapoints crossed 1000');
    //                                 db.increaseUserStats({ playerId: player.playerId }, { "statistics.megaChipsGainedTotal": totalIncrease }, function (err, res) {
    //                                     if (err || !res) {
    //                                         serverLog(stateOfX.logType.error, 'increasing statistics.megaChipsGainedTotal failed')
    //                                     } else {
    //                                         serverLog(stateOfX.logType.info, 'increased statistics.megaChipsGainedTotal by ' + totalIncrease + ' successfully')
    //                                     }
    //                                 })
    //                             } else {
    //                                 serverLog(stateOfX.serverLogType.error, 'failed - 100 real money awarded - on megapoints crossed 1000');
    //                             }
    //                         })
    //                     } else {
    //                         serverLog(stateOfX.serverLogType.error, "Error while updating data balance sheet." + JSON.stringify(err));
    //                     }
    //                 });
    //             }
    //         })
    //     }
    //     cb(null, player, params);
    // }
    /*============================  END  =================================*/



    /*============================  START  =================================*/
    // update megapoints for every contributor in game
    // and update other counter and values
    // New
    async forEveryPlayer(params: any): Promise<any> {

        for (const player of params.players) {
            try {

                // Sequential execution of functions
                await this.getProfileData(player, params);
                await this.calculateMegaPoints(player, params);
                await this.awardPointsInProfile(player, params);
                await this.scheduleToExpire(player, params);
                await this.scheduleToExpireUpsert(player, params);
                await this.updateLevelInProfile(player, params);
                await this.checkToConvertUnclaimedMegaBonus(player, params);
                await this.checkToConvertMegaPoints(player, params);
            } catch (err) {
                console.log(stateOfX.serverLogType.error, `Error processing player ${player.playerId}: ${err}`);
            }
        }

        return params;
    };

    // Old
    // var forEveryPlayer = function (params, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'in megaPointsManager in forEveryPlayer');
    //     async.each(params.players, function (player, ecb) {
    //         serverLog(stateOfX.serverLogType.info, 'rewarding megapoints for ' + JSON.stringify(player));
    //         async.waterfall([
    //             async.apply(getProfileData, player, params),
    //             calculateMegaPoints,
    //             awardPointsInProfile,
    //             scheduleToExpire,
    //             scheduleToExpireUpsert,
    //             updateLevelInProfile,
    //             checkToConvertUnclaimedMegaBonus, // from 10 UnclaimedMegaBonus into 10 ClaimedMegaBonus on every 100
    //             checkToConvertMegaPoints // from 1000 MegaPoints into 100 MegaChips on every 1000
    //         ], function (err, player) {
    //             ecb(null);
    //         })
    //     }, function (err) {
    //         cb(err, params)
    //     })
    // }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    // prepare first slot data
    // normally on register
    // New
    async prepareData(data: any): Promise<any> {
        const levels = data.allLevels;
        const t = levels.find(level => level.levelId === data.level) || levels[0];

        const slotData: any = {
            playerId: data.playerId,
            points: 0,
            countingEndsAt: this.addTimeStamp(data.createdAt, systemConfig.mp.countingTime),
            expiresAt: this.addTimeStamp(data.createdAt, { value: t.expiryPeriod || systemConfig.mp.expireTime, unit: 'months' }),
            expireStatus: 0, // 0-scheduled; 1-expired; 2-cancelled
        };

        data.slotData = slotData;
        return data;
    };

    // Old
    // var prepareData = function (data, cb) {
    //     var levels = data.allLevels;
    //     var t = _.findWhere(levels, { levelId: data.level }) || levels[0];
    //     var slotData = {
    //         playerId: data.playerId,
    //         points: 0,
    //         countingEndsAt: addTimeStamp(data.createdAt, systemConfig.mp.countingTime),
    //         expiresAt: addTimeStamp(data.createdAt, { 'value': t.expiryPeriod || systemConfig.mp.expireTime, 'unit': 'months' }),
    //         expireStatus: 0 // 0-scheduled; 1-expired; 2-cancelled
    //     }
    //     data.slotData = slotData;
    //     cb(null, data)
    // }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    // save slot data in db
    // New
    async saveSlotInDb(data: any): Promise<any> {
        try {
            const res = await this.db.createExpirySlot(data.slotData);
            return data;
        } catch (err) {
            console.log(stateOfX.serverLogType.error, 'Error saving slot in db: ' + err);
            throw err;
        }
    };

    // Old
    // var saveSlotInDb = function (data, cb) {
    //     db.createExpirySlot(data.slotData, function (err, res) {
    //         serverLog(stateOfX.serverLogType.info, 'saved slot in db ' + JSON.stringify(res))
    //         cb(null, data);
    //     })
    // }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    /**
     * [incMegaPoints description]
     * @method incMegaPoints
     * @param  {Object}      params [description]
     * @param  {Function}    cb     callback, optional
     */
    // New
    async incMegaPoints(params: any): Promise<any> {
        try {

            // Admin DB/app context - all mega point levels with percent and expiry
            // For each player ->
            // Profile - player's current mega point level
            // Contribution - level percent --> points calculated
            // Profile - increase points
            // ScheduleExpiry - increase points (scheduled, countingEnds < currTime)

            // Deep clone the players array to avoid mutation
            params.players = JSON.parse(JSON.stringify(params.players));

            // Getting levels and iterating through each player
            await this.getLevels(params);
            await this.forEveryPlayer(params);

            return params;

        } catch (err) {
            console.log(stateOfX.serverLogType.error, 'Error in incMegaPoints:', err);
        }
    };

    // Old
    // megaPointsMngr.incMegaPoints = function (params, cb) {
    //         serverLog(stateOfX.serverLogType.info, 'in megaPointsManager in incMegaPoints');
    //         // adminDb/app context - all megapointlevels with percent and expiry
    //         // for each player ->
    //         //// profile - players current megapointlevel
    //         //// contribution - level percent --> points calculate
    //         //// profile - inc points
    //         //// scheduleExpiry - inc points (scheduled, countingEnds<currTime, )

    //         params.players = JSON.parse(JSON.stringify(params.players));
    //         async.waterfall([
    //             async.apply(getLevels, params),
    //             forEveryPlayer
    //         ], function (err, params) {
    //             serverLog(stateOfX.serverLogType.info, 'in megaPointsManager in incMegaPoints- response');
    //             // pass data in cb for broadcast
    //             if (cb instanceof Function) {
    //                 cb(err, params)
    //             }
    //         })
    //     };
    /*============================  END  =================================*/



    /*============================  START  =================================*/
    // on register
    // create expiry slot for player
    // 1 month from register
    // New
    async createFirstExpirySlot(data: any): Promise<any> {
        try {

            // Getting levels and preparing data
            await this.getLevels(data);
            await this.prepareData(data);

            // Saving slot in the database
            await this.saveSlotInDb(data);

        } catch (err) {
            console.log(stateOfX.serverLogType.error, 'Error creating first expiry slot:', err);
        }
    };

    // Old
    // megaPointsMngr.createFirstExpirySlot = function (data) {
    //         serverLog(stateOfX.serverLogType.info, 'in megaPointsManager in createFirstExpirySlot');
    //         async.waterfall([
    //             async.apply(getLevels, data),
    //             prepareData,
    //             saveSlotInDb
    //         ], function (err, data) {
    //             serverLog(stateOfX.serverLogType.info, 'slot created' + JSON.stringify(data))
    //         })
    //     };
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    // get percent completion of megapoint level according to player's megapoints
    // New
    async getPercentOfLevel(data: any): Promise<any> {
        if (data.points <= 0) {
            return { percentOfLevel: 0, megaPointLevel: 'Bronze' };
        }

        try {
            const params: any = await this.getLevels({});
            if (!params || params.allLevels.length <= 0) {
                return { percentOfLevel: 0, megaPointLevel: 'Bronze' };
            }

            const calculator = (arr: any, value: any): any => {
                let i = 0;
                while (i < arr.length && arr[i].levelThreshold <= value) {
                    i++;
                }
                if (i >= arr.length) {
                    return [101, 'Platinum']; // Any value > 100 to represent highest level
                }
                const prevLevel = arr[i - 1];
                const nextLevel = arr[i];
                const percent = ((value - prevLevel.levelThreshold) / (nextLevel.levelThreshold - prevLevel.levelThreshold)) * 100;
                return [Math.floor(percent * 100) / 100, prevLevel.loyaltyLevel];
            };

            const [percent, label] = calculator(params.allLevels, data.points);
            return { percentOfLevel: percent, megaPointLevel: label };
        } catch (err) {
            console.log(stateOfX.serverLogType.error, 'Error in getPercentOfLevel:', err);
            return { percentOfLevel: 0, megaPointLevel: 'Bronze' };
        }
    };

    // Old
    // megaPointsMngr.getPercentOfLevel = function (data, cb) {
    //         if (data.points <= 0) {
    //             return cb({ percentOfLevel: 0, megaPointLevel: 'Bronze' });
    //         }

    //         getLevels({}, function (err, params) {
    //             if (err || !params) {
    //                 // return cb(err);
    //                 return cb(null);
    //             }
    //             if (params.allLevels.length <= 0) {
    //                 return cb({ percentOfLevel: 0, megaPointLevel: 'Bronze' });
    //             }
    //             if (params.allLevels.length > 0) {
    //                 function calculator(arr, value) {
    //                     for (var i = 0; i < arr.length; i++) {
    //                         if (arr[i].levelThreshold > value) { // levelThreshold is min value of range
    //                             break;
    //                         };
    //                     }
    //                     if (i >= arr.length) {
    //                         return [101, 'Platinum']; // any value > 100 to represent highest level
    //                     }
    //                     return [(100 * (value - arr[i - 1].levelThreshold) / (arr[i].levelThreshold - arr[i - 1].levelThreshold)), arr[i - 1].loyaltyLevel];
    //                 }
    //                 var c = calculator(params.allLevels, data.points);
    //                 var label = c[1];
    //                 c = Math.floor(c[0] * 100) / 100; // limiting decimal places
    //                 return cb({ percentOfLevel: c || 0, megaPointLevel: label || 'Bronze' })
    //             }
    //         })
    //     };
    /*============================  END  =================================*/

    /*============================  START  =================================*/
    //get percent reward of megapoint level by levelId
    // New
    getPercent(arr: any, levelId: any): any {
        const level = arr.find(item => item.levelId === levelId) || arr[0];
        return level?.percentReward ?? 0;
    }

    // Old
    // function getPercent(arr, levelId) {
    //     // console.log('getPercent', arr, levelId,  _.findWhere(arr, {levelId: levelId}))
    //     var t = _.findWhere(arr, { levelId: levelId }) || arr[0];
    //     //return t.percentReward || 4;
    //     return t && t.percentReward || 0;
    // }
    /*============================  END  =================================*/



    /*============================  START  =================================*/
    /**
     * generic function to check if particular threshold crossed
     * @method checkThresholdCrossed
     * @param  {Array }              levels    list of megapoint levels
     * @param  {Number}              levelId   old level id
     * @param  {Number}              oldPoints old megapoints
     * @param  {Number}              addPoints megapoints to be added
     * @return {Number}                        new levelId
     */
    // New
    checkThresholdCrossed(levels: any, levelId: any, oldPoints: any, addPoints: any): any {
        const tmpLevelId = "Bronze"; // Placeholder for level calculation logic
        return { value: tmpLevelId };
    }
    // Old
    // function checkThresholdCrossed(levels, levelId, oldPoints, addPoints) { // Boolean
    //     // levels are / should be - SORTED by threshold
    //     // var tmp = oldPoints && addPoints ? oldPoints + addPoints : 0;
    //     var tmpLevelId = "Bronze" //calculateLevelIdForPoints(levels, tmp);
    //     // if(levelId == tmpLevelId){
    //     // 	return false;
    //     // }
    //     return { value: tmpLevelId }; // new level
    // }
    /*============================  END  =================================*/



    /*============================  START  =================================*/
    /**
     * to check if some limit crossed
     * e.g. 
     * 100, 75, 175
     * - limit will be crossed 2 times (250)
     * @method checkCountCrossed
     * @param  {Number}          limit     limit, imagine like b of (a modulus b)
     * @param  {Number}          oldPoints old value
     * @param  {Number}          addPoints value to add
     * @return {Number}                    how many times the new sum has crossed the limit
     */
    checkCountCrossed(limit: any, oldPoints: any, addPoints: any): any {
        // count of 'how many times this limit has been crossed by Sum'
        return Math.floor((oldPoints + addPoints) / limit);
    }
    /*============================  END  =================================*/



    /*============================  START  =================================*/
    // calculate LevelId For megapoints
    // @method calculateLevelIdForPoints
    // New
    calculateLevelIdForPoints(levels: any, p: any): any {
        for (let i = 0; i < levels.length; i++) {
            if (p < levels[i].levelThreshold) {
                return (levels[i - 1] || levels[0]).levelId;
            }
        }
        return levels[levels.length - 1].levelId;
    }

    // Old
    // function calculateLevelIdForPoints(levels, p) {
    //     for (var i = 0; i < levels.length; i++) {
    //         if (p < levels[i].levelThreshold) {
    //             return (levels[i - 1] || levels[0]).levelId;
    //         }
    //     }
    //     return levels[levels.length - 1].levelId;
    // }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    /**
     * addTimeStamp 
     * this function also round off to midnight time
     * @method addTimeStamp
     * @param  {Number}     start    time in milliseconds
     * @param  {Object}     duration duration object - {unit: 'string', value: number}
     */
    // New
    addTimeStamp(start: any, duration: any): any {
        const d = new Date(start);
        d.setHours(0, 0, 0, 0);
        return d.getTime() + (1000 * this.durationToSeconds(duration));
    }

    // Old
    // function addTimeStamp(start, duration) {
    //     var d = new Date(start);
    //     d.setHours(0);
    //     d.setMinutes(0);
    //     d.setSeconds(0);
    //     d.setMilliseconds(0);
    //     return Number(d) + (1000 * durationToSeconds(duration));
    // }
    /*============================  END  =================================*/



    /*============================  START  =================================*/
    /**
     * convert duration to seconds
     *
     * @private
     * @method durationToSeconds
     * @param  {Object}        durObj   contains unit, value: {unit: 'day', value: 2}
     * @return {Number}                 seconds in that duration : 5154655615
     */
    // New
    durationToSeconds(durObj: any): any {
        const unit = durObj.unit.toLowerCase();
        switch (unit) {
            case 'day':
            case 'days':
                return durObj.value * 86400;
            case 'month':
            case 'months':
                return durObj.value * 86400 * 30;
            case 'year':
            case 'years':
                return durObj.value * 86400 * 30 * 12;
            default:
                return durObj.value * 86400;
        }
    }

    // Old
    // function durationToSeconds(durObj) {
    //     // suggestion: convert to lowercase
    //     switch (durObj.unit) {
    //         case 'day':
    //         case 'days':
    //             return durObj.value * 86400; break;
    //         case 'month':
    //         case 'months':
    //             return durObj.value * 86400 * 30; break;
    //         case 'year':
    //         case 'years':
    //             return durObj.value * 86400 * 30 * 12; break;
    //         default:
    //             return durObj.value * 86400; break;
    //     }
    // }
    /*============================  END  =================================*/



    /*============================  START  =================================*/
    /**
     * adjust bonus from unClaimedBonus to claimedBonus if available
     * @method updateBonus
     * @param  {Object}    data list of bonuses for player
     * @param  {Number}    amt  bonus amount that is claimed
     * @return {Number}         remaining bonus amount which could not be claimed due to low bonus
     */
    // New
    updateBonus(data: any, amt: any): any {
        if (Array.isArray(data.bonus) && data.bonus.length > 0) {
            for (let i = 0; i < data.bonus.length; i++) {
                const entry = data.bonus[i];
                if (entry.unClaimedBonus > 0) {
                    if (entry.unClaimedBonus > amt) {
                        entry.unClaimedBonus -= amt;
                        entry.claimedBonus += amt;
                        amt = 0;
                    } else {
                        const t = entry.unClaimedBonus;
                        entry.unClaimedBonus = 0;
                        entry.claimedBonus += t;
                        amt -= t;
                    }
                    if (amt <= 0) break;
                }
            }
        }
        return amt;
    }

    // Old
    // function updateBonus(data, amt) {
    //     if (data.bonus instanceof Array) {
    //         if (data.bonus.length > 0) {
    //             for (var i = 0; i < data.bonus.length; i++) {
    //                 if (data.bonus[i].unClaimedBonus > 0) {
    //                     if (data.bonus[i].unClaimedBonus > amt) {
    //                         data.bonus[i].unClaimedBonus -= amt;
    //                         data.bonus[i].claimedBonus += amt;
    //                         amt -= amt;
    //                     } else {
    //                         var t = data.bonus[i].unClaimedBonus;
    //                         data.bonus[i].unClaimedBonus -= t;
    //                         data.bonus[i].claimedBonus += t;
    //                         amt -= t;
    //                     }
    //                 }
    //             }
    //         }
    //     }
    //     return amt;
    // }
    /*============================  END  =================================*/



    /*============================  START  =================================*/
    // prepare next/new slot data
    // when previous slot ends counting
    // New
    createSlotData(player: any, levels: any): any {
        let bt = player.createdAt;
        const d = new Date(bt);
        d.setHours(0, 0, 0, 0);
        bt = d.getTime();

        const ct = Date.now();
        const msMonth = 1000 * 60 * 60 * 24 * 30;
        const et = bt + msMonth * Math.floor((ct - bt) / msMonth);

        const t = levels.find(level => level.levelId === player.megaPointLevel) || levels[0];

        const slotData: any = {
            playerId: player.playerId,
            points: 0,
            countingEndsAt: this.addTimeStamp(et, systemConfig.mp.countingTime),
            expiresAt: this.addTimeStamp(et, {
                value: t.expiryPeriod ?? systemConfig.mp.expireTime,
                unit: 'months',
            }),
            expireStatus: 0,
        };

        return slotData;
    }

    // Old
    // function createSlotData(player, levels) {
    //     var bt = player.createdAt; // begin time
    //     var d = new Date(bt);
    //     d.setHours(0);
    //     d.setMinutes(0);
    //     d.setSeconds(0);
    //     d.setMilliseconds(0);
    //     bt = Number(d);
    //     var ct = Number(new Date()); // current time
    //     var msMonth = 2592000000; // 1000*60*60*24*30 - milliseconds in a 30 days (day of 24 hours)
    //     var et = bt + msMonth * (Math.floor((ct - bt) / msMonth))
    //     // et will be the starting of current counting month for this player

    //     // now create slot data
    //     var t = _.findWhere(levels, { levelId: player.megaPointLevel }) || levels[0];
    //     var slotData = {
    //         playerId: player.playerId,
    //         points: 0,
    //         countingEndsAt: addTimeStamp(et, systemConfig.mp.countingTime),
    //         expiresAt: addTimeStamp(et, { 'value': systemConfig.mp.expireTime, 'unit': 'months' }),
    //         expireStatus: 0 // 0-scheduled; 1-expired; 2-cancelled
    //     }
    //     return slotData;
    // }
    /*============================  END  =================================*/




















}