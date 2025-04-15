import { Injectable } from "@nestjs/common";
import _ from "underscore";
import { systemConfig, stateOfX, popupTextManager } from 'shared/common';
import { BroadcastHandlerService } from "./broadcastHandler.service";
import { ImdbDatabaseService } from "shared/common/datebase/Imdbdatabase.service";
import { PokerDatabaseService } from "shared/common/datebase/pokerdatabase.service";
import { StartTournamentHandlerService } from "./startTournamentHandler.service";
import { CancelTournamentService } from "./cancelTournament.service";
import { WalletService } from "apps/wallet/src/wallet.service";








createTable = require("../../../../../shared/createTournamentTable.js"),
    prizeAlgo = require("../../../../../shared/prizeAlgo.js"),
    profileMgmt = require("../../../../../shared/model/profileMgmt.js"),
    schedule = require('node-schedule');



@Injectable()
export class TournamentSchedularService {

    constructor(
        private readonly db: PokerDatabaseService,
        private readonly imdb: ImdbDatabaseService,
        private readonly broadcastHandler: BroadcastHandlerService,
        private readonly startTournamentHandler: StartTournamentHandlerService,
        private readonly cancelTournament: CancelTournamentService,
        private readonly wallet: WalletService,

    ) { }






    /*================================  START  ===================================*/
    //this function validate whether minimum player available for tournament start
    // New
    async validateTournamentStart(params: any): Promise<any> {
        try {
            const count = await this.db.countTournamentusers({
                tournamentId: params.room.tournamentId,
                status: "Registered",
            });


            if (count < params.room.minPlayers) {
                // Going to cancel tournament
                this.cancelTournament.cancel(params.room);
                this.broadcastHandler.fireBroadcastToAllSessions({
                    app: params.globalThis,
                    data: {
                        _id: params.room._id,
                        state: stateOfX.tournamentState.cancelled,
                        event: stateOfX.recordChange.tournamentStateChanged,
                    },
                    route: stateOfX.broadcasts.tournamentStateChange,
                });

                try {
                    const result = await this.db.findTournamentUser({
                        tournamentId: params.room.tournamentId,
                    });


                    if (result) {
                        for (let i = 0; i < result.length; i++) {
                            this.broadcastHandler.fireTournamentCancelledBroadcast({
                                self: { app: params.globalThis },
                                playerId: result[i].playerId,
                                tournamentId: params.room._id,
                                info: "Tournament has been cancelled.",
                                route: stateOfX.broadcasts.tournamentCancelled,
                            });

                            this.broadcastHandler.fireBroadcastToAllSessions({
                                app: {},
                                data: {
                                    action: "tourListChange",
                                },
                                route: "tourListChange",
                            });
                        }
                    }
                } catch (err) {
                    console.error("Error during findTournamentUser", err);
                }

                return {
                    success: false,
                    isRetry: false,
                    isDisplay: false,
                    channelId: "",
                    info:
                        popupTextManager.dbQyeryInfo
                            .DBCOUNTTOURNAMENTUSERSFAIL_TOURNAMENTSCHEDULER,
                };
            } else {
                return params;
            }
        } catch (err) {
            console.error("Error during countTournamentusers", err);
            return {
                success: false,
                isRetry: false,
                isDisplay: false,
                channelId: "",
                info:
                    popupTextManager.dbQyeryInfo
                        .DBCOUNTTOURNAMENTUSERSFAIL_TOURNAMENTSCHEDULER,
            };
        }
    }

    // Old
    // tournamentSchedular.validateTournamentStart = function (params, callback) {
    //     console.log("in validate tournament start is in entryHandler is - ", params);
    //     db.countTournamentusers({ tournamentId: params.room.tournamentId, status: "Registered" }, function (err, count) {
    //         console.log("tour registered users are", err, count)
    //         console.log("count is in countTournamentusers is - ", count);
    //         if (err || count < params.room.minPlayers) {
    //             //Going to cancel tournament
    //             cancelTournament.cancel(params.room);
    //             broadcastHandler.fireBroadcastToAllSessions({ app: params.globalThis, data: { _id: params.room._id, state: stateOfX.tournamentState.cancelled, event: stateOfX.recordChange.tournamentStateChanged }, route: stateOfX.broadcasts.tournamentStateChange });
    //             db.findTournamentUser({ tournamentId: params.room.tournamentId }, function (err, result) {
    //                 console.log("count is in findTournamentUser is - ", result);
    //                 if (!err && result) {
    //                     for (let i = 0; i < result.length; i++) {
    //                         broadcastHandler.fireTournamentCancelledBroadcast({ self: { app: params.globalThis }, playerId: result[i].playerId, tournamentId: params.room._id, info: "Tournament has been cancelled.", route: stateOfX.broadcasts.tournamentCancelled })
    //                         broadcastHandler.fireBroadcastToAllSessions({
    //                             app: {}, data: {
    //                                 action: "tourListChange",
    //                             }, route: "tourListChange"
    //                         });
    //                     }
    //                 }
    //                 if (callback) callback({ success: false, isRetry: false, isDisplay: false, channelId: "", info: popupTextManager.dbQyeryInfo.DBCOUNTTOURNAMENTUSERSFAIL_TOURNAMENTSCHEDULER })
    //             })
    //         } else {
    //             if (callback) callback(null, params);
    //         }
    //     })
    // }
    /*================================  END  ===================================*/


    /*================================  START  ===================================*/
    // New
    async createTableForNormalTournament(params): Promise<any> {
        
        const result = await this.createTable.create(params.room);
    
        if (result.success) {
            return params;
        } else {
            return {
                success: false,
                isRetry: false,
                isDisplay: false,
                channelId: "",
                info: popupTextManager.falseMessages.CREATETABLEFORNORMALTOURNAMENTFAIL_TOURNAMENTSCHEDULER
            };
        }
    }
    

    // Old
    // const createTableForNormalTournament = function (params, callback) {
    //     console.log("In create table in schedular - ");
    //     createTable.create(params.room, function (result) {
    //         if (result.success) {
    //             callback(null, params);
    //         } else {
    //             callback({ success: false, isRetry: false, isDisplay: false, channelId: "", info: popupTextManager.falseMessages.CREATETABLEFORNORMALTOURNAMENTFAIL_TOURNAMENTSCHEDULER });
    //         }
    //     })
    // }
    /*================================  END  ===================================*/


    /*================================  START  ===================================*/
    // New
    async getPrizeRuleForNormalTournament(params): Promise<any> {
        
        try {
            const prizeRule = await this.db.getPrizeRule(params.tournament.tournamentId);
            params.prizeRule = prizeRule.prize;
            return params;
        } catch (err) {
            console.log(stateOfX.serverLogType.info, "getting prize Error");
            return params;
        }
    }
    

    // Old
    // const getPrizeRuleForNormalTournament = function (params, cb) {
    //     console.log(stateOfX.serverLogType.info, "in getPrizeRuleForNormalTournament in calculate ranks - ");
    //     db.getPrizeRule(params.tournament.tournamentId, function (err, prizeRule) {
    //         if (err) {
    //             console.log(stateOfX.serverLogType.info, "getting prize Error");
    //             cb(params);
    //         } else {
    //             console.log(stateOfX.serverLogType.info, "prizeRule is ", JSON.stringify(prizeRule));
    //             params.prizeRule = prizeRule.prize;
    //             cb(null, params);
    //         }
    //     })
    // }
    /*================================  END  ===================================*/


    /*================================  START  ===================================*/
    // New
    async updateTournamentRanks(params): Promise<any> {
        let lastRank = params.count;
    
        try {
            for (const rankObject of params.ranks) {
                console.log("shayad satellite hai", params.tournament);
    
                if (params.tournament.tournamentType === stateOfX.tournamentType.satelite) {
                    console.log("rankObject is satellite", rankObject);
                    rankObject.chipsWon = params.prizeRule[lastRank - 1]?.prizeMoney || 0;
                    rankObject.rank = lastRank;
                    rankObject.ticketWon = params.prizeRule[lastRank - 1]?.prizeType === 'ticket';
                    lastRank--;
                } else {
                    rankObject.chipsWon = params.prizeRule[lastRank - 1]?.prizeMoney || 0;
                    rankObject.rank = lastRank;
                    lastRank--;
                }
    
                const filter = {
                    tournamentId: rankObject.tournamentId,
                    playerId: rankObject.playerId,
                };
    
                console.log("now updated rankObject is", rankObject);
    
                await this.db.modifyTournamentRanks(filter, rankObject);
                await this.updateUserChips(rankObject, params.tournament);
            }
    
            return params;
        } catch (err) {
            return params;
        }
    }
    

    // Old
    // const updateTournamentRanks = function (params, cb) {
    //     console.log("ranks and count is in updateTournamentRanks are - ", params);
    //     let lastRank = params.count;
    //     async.eachSeries(params.ranks, function (rankObject, callback) {
    //         console.log("shayad satellite hai", params.tournament);
    //         if (params.tournament.tournamentType === stateOfX.tournamentType.satelite) {
    //             console.log("rankObject is satellite", rankObject);
    //             rankObject.chipsWon = params.prizeRule[lastRank - 1] ? params.prizeRule[lastRank - 1].prizeMoney : 0;
    //             rankObject.rank = lastRank;
    //             rankObject.ticketWon = (params.prizeRule[lastRank - 1] && params.prizeRule[lastRank - 1].prizeType == 'ticket') ? true : false;
    //             lastRank--;
    //         }
    //         else {
    //             rankObject.chipsWon = params.prizeRule[lastRank - 1] ? params.prizeRule[lastRank - 1].prizeMoney : 0;
    //             rankObject.rank = lastRank;
    //             lastRank--;
    //         }
    //         const filter = {
    //             tournamentId: rankObject.tournamentId,
    //             playerId: rankObject.playerId,
    //         }
    //         console.log("now updated rankObject is", rankObject)
    //         db.modifyTournamentRanks(filter, rankObject, function (err, result) {
    //             if (err) {
    //                 cb(params);
    //             } else {
    //                 updateUserChips(rankObject, params.tournament);
    //                 callback()
    //             }
    //         })
    //     }, function (err) {
    //         if (err) {
    //             cb(params);
    //         } else {
    //             cb(null, params);
    //         }
    //     })
    // }
    /*================================  END  ===================================*/

    /*================================  START  ===================================*/
    // New
    async countTournamentusers(params): Promise<any> {
        try {
            const count = await this.db.countTournamentusers({ tournamentId: params.tournament.tournamentId, status: 'Registered' });
            params.count = count;
            return params;
        } catch (err) {
            return params;
        }
    }
    

    // Old
    // const countTournamentusers = function (params, cb) {
    //     db.countTournamentusers({ tournamentId: params.tournament.tournamentId, status: 'Registered' }, function (err, count) {
    //         if (err) {
    //             cb(params);
    //         } else {
    //             params.count = count;
    //             cb(null, params);
    //         }
    //     })
    // }
    /*================================  END  ===================================*/


    /*================================  START  ===================================*/
    // New
    async getTournamentRanks(params): Promise<any> {
        try {
            const ranks = await this.db.findTournamentRanks(params.filter);
            
            // Sort the ranks array based on the createdAt property in descending order
            ranks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
            console.log("all ranks after sorting are", ranks);
            params.ranks = ranks;
            return params;
        } catch (err) {
            return params;
        }
    }
    

    // Old
    // const getTournamentRanks = function (params, cb) {
    //     console.log("getTournamentRanks in scheduler is", params);
    //     db.findTournamentRanks(params.filter, function (err, ranks) {
    //         if (err) {
    //             cb(params);
    //         } else {
    //             console.log("all ranks are", ranks)
    //             // Sort the ranks array based on the createdAt property in descending order
    //             ranks.sort((a, b) => b.createdAt - a.createdAt);
    //             console.log("all ranks after sorting are", ranks)
    //             params.ranks = ranks;
    //             cb(null, params);
    //         }
    //     })
    // }
    /*================================  END  ===================================*/


    /*================================  START  ===================================*/
    // New
    async updateUserChips(player, tournament){
    
        let refNum = 'aa';
    
        try {
            const refNumber = await this.imdb.findRefrenceNumber({ playerId: player.playerId, channelId: player.channelId });
    
            if (refNumber.length) {
                refNum = refNumber[0].referenceNumber;
            }
    
            if (player.chipsWon > 0) {
                const dataForWallet = {
                    action: 'tourWin',
                    data: {
                        isRealMoney: tournament.isRealMoney ? true : false,
                        playerId: player.playerId,
                        tableName: player.channelName,
                        chips: player.chipsWon,
                        referenceNumber: refNum,
                        points: {
                            coinType: 1,
                            win: player.chipsWon,
                            deposit: 0,
                            promo: 0,
                            totalBalance: player.chipsWon
                        }
                    }
                };
    
                const result = await this.wallet.sendWalletBroadCast(dataForWallet);
                if (result.success) {
                    await this.db.updateTournamentRanks({ playerId: player.playerId, tournamentId: player.tournamentId });
                }
            }
        } catch (err) {
            console.log("Error in updateUserChips", err);
        }
    }
    

    // Old
    // const updateUserChips = async (player, tournament) => {
    //     console.log('in scheduler in updateUserChips', player);
    //     imdb.findRefrenceNumber({ playerId: player.playerId, channelId: player.channelId }, async function (err, refNumber) {
    //         console.log("findRefrenceNumberfindRefrenceNumber", err, refNumber);
    //         let refNum = 'aa';
    //         if (!err && refNumber.length) {
    //             refNum = refNumber[0].referenceNumber;
    //         }
    //         if (player.chipsWon > 0) {
    //             let dataForWallet = {
    //                 action: 'tourWin',
    //                 data: {
    //                     isRealMoney: tournament.isRealMoney ? true : false,
    //                     playerId: player.playerId,
    //                     tableName: player.channelName,
    //                     chips: player.chipsWon,
    //                     referenceNumber: refNum,
    //                     points: {
    //                         coinType: 1,
    //                         win: player.chipsWon,
    //                         deposit: 0,
    //                         promo: 0,
    //                         totalBalance: player.chipsWon
    //                     }
    //                 }
    //             }
    //             let result = await wallet.sendWalletBroadCast(dataForWallet);
    //             if (result.success) {
    //                 db.updateTournamentRanks({ playerId: player.playerId, tournamentId: player.tournamentId }, function (err, res) { })
    //             }
    //         }
    //     });
    // }
    /*================================  END  ===================================*/

    /*================================  START  ===================================*/
    // New
    async calculateRanks(tournament) {
        let params: any = {};
        params.filter = {
            tournamentId: tournament.tournamentId,
        };
        params.tournament = tournament;
    
        try {
            params = await this.countTournamentusers(params);
            params = await this.getTournamentRanks(params);
            params = await this.getPrizeRuleForNormalTournament(params);
            params = await this.updateTournamentRanks(params);
    
    
            const informRanks = {
                tournamentRules: {
                    tournamentId: params.tournament.tournamentId,
                    ranks: params.ranks,
                    isGameRunning: false,
                    tournamentType: params.tournament.tournamentType,
                    parentId: ''
                },
                channelType: params.tournament.channelType
            };
    
            this.startTournamentHandler.eliminationProcess({}, informRanks);
    
        } catch (err) {
            console.log("final updating ranks are", err, null);
            console.log(stateOfX.serverLogType.info, "Error occurred in calculateRanks");
        }
    }
    

    // Old
    // const calculateRanks = function (tournament) {
    //     let params = {};
    //     params.filter = {
    //         tournamentId: tournament.tournamentId,
    //     }
    //     params.tournament = tournament;
    //     async.waterfall([
    //         async.apply(countTournamentusers, params),
    //         getTournamentRanks,
    //         getPrizeRuleForNormalTournament,
    //         updateTournamentRanks
    //     ], function (err, result) {
    //         console.log("final updating ranks are", err, result)
    //         if (err) {
    //             console.log(stateOfX.serverLogType.info, "Error occured in calculateRanks");
    //         } else {
    //             console.log(stateOfX.serverLogType.info, "ranks updated successfully");
    //             let informRanks = {
    //                 tournamentRules: {
    //                     tournamentId: params.tournament.tournamentId,
    //                     ranks: params.ranks,
    //                     isGameRunning: false,
    //                     tournamentType: params.tournament.tournamentType,
    //                     parentId: ''
    //                 },
    //                 channelType: params.tournament.channelType
    //             }
    //             startTournamentHandler.eliminationProcess({}, informRanks);
    //         }
    //     })
    // }
    /*================================  END  ===================================*/


    /*================================  START  ===================================*/
    /**
     * function to  decideSatellitePrizeRule
     */
    // New
    decideSatellitePrizeRule (count: number, room: any): any[] {
    
        const noOfPrizes = Math.floor((count * room.entryFees) / room.parentBuyIn);
        const lastPrize = (count * room.entryFees) % room.parentBuyIn;
    
        const prizeArray: any[] = [];
        console.log("noOfprizes and last prize is", noOfPrizes, lastPrize);
    
        let prizeIt = 1;
        for (; prizeIt <= noOfPrizes; prizeIt++) {
            prizeArray.push({
                position: prizeIt,
                prizeMoney: 0,
                prizeType: "ticket"
            });
        }
    
        if (lastPrize > 0) {
            prizeArray.push({
                position: prizeIt,
                prizeMoney: lastPrize,
                prizeType: "chips"
            });
        }
    
        return prizeArray;
    }
    

    // Old
    // const decideSatellitePrizeRule = function (count, room) {
    //     console.log("In decideSatellitePrizeRule in tournamentSchedular", count, room.entryFees, room.parentBuyIn);
    //     let noOfPrizes = Math.floor((count * room.entryFees) / room.parentBuyIn);
    //     let lastPrize = (count * room.entryFees) % room.parentBuyIn;
    //     let prizeArray = [];
    //     console.log("noOfprizes and last prize is", noOfPrizes, lastPrize);
    //     let prizeIt = 1;
    //     for (prizeIt; prizeIt <= noOfPrizes; prizeIt++) {
    //         prizeArray.push({
    //             "position": prizeIt,
    //             "prizeMoney": 0,
    //             "prizeType": "ticket"
    //         })
    //     }
    //     if (lastPrize > 0) {
    //         prizeArray.push({
    //             "position": prizeIt,
    //             "prizeMoney": lastPrize,
    //             "prizeType": "chips"
    //         })
    //     }
    //     return prizeArray;
    // }
    /*================================  END  ===================================*/


    /*================================  START  ===================================*/
    /**
     * function to  createPrizeRule
     */
    // New
    async createPrizeRule(room: any): Promise<any> {
    
        const count = await this.db.countTournamentusers({ tournamentId: room.tournamentId, status: 'Registered' });
        if (!count && count !== 0) {
            return { success: false };
        }
    
        const rebuy = await this.db.findAllRebuy({ tournamentId: room.tournamentId });
        if (!rebuy) {
            return { success: false };
        }
    
        const tourDetail = await this.db.findTournamentRoom({ tournamentName: room.parentTournament, isActive: true });
        if (!tourDetail) {
            return { success: false };
        }
    
        let prizeRule:any = 0;
        let rebuySum = 0;
    
        if (rebuy.length > 0) {
            const rebuyCountArray = rebuy.map((r: any) => r.rebuyCount);
            rebuySum = rebuyCountArray.reduce((memo: number, num: number) => memo + num, 0);
        }
    
        if (room.tournamentType === stateOfX.tournamentType.satelite) {
            console.log("got this tourDetail while createPrizeRule for satellite", tourDetail);
            if (tourDetail[0] && tourDetail[0].state !== stateOfX.tournamentState.finished && tourDetail[0].state !== stateOfX.tournamentState.cancelled) {
                room.parentBuyIn = tourDetail[0].totalBuyIn;
                prizeRule = this.decideSatellitePrizeRule(count, room);
            } else {
                return { success: false };
            }
        }
    
        if (room.tournamentType === stateOfX.tournamentType.normal || room.tournamentType === stateOfX.tournamentType.sitNGo) {
            prizeRule = await this.prizeAlgo.prizeForDb(
                room.isGuaranteed,
                room.guaranteedAmount,
                room.priceStructure,
                count,
                room.minPlayers,
                room.entryFees,
                rebuySum * room.entryFees,
                0
            );
        }
    
        if (room.tournamentType === stateOfX.tournamentType.freeRoll) {
            if (!room.isGuaranteed) {
                room.isGuaranteed = true;
                room.guaranteedAmount = 0;
            }
            prizeRule = await this.prizeAlgo.prizeForDb(
                room.isGuaranteed,
                room.guaranteedAmount,
                room.priceStructure,
                count,
                room.minPlayers,
                room.entryFees,
                rebuySum * room.entryFees,
                0
            );
        }
    
        const prize = {
            tournamentId: room.tournamentId,
            type: "server",
            prize: prizeRule
        };
    
        console.log("Inside setting prizeRule", prize);
        const result = await this.db.createPrizeRule(prize);
        if (!result) {
            return { success: false };
        }
    
        return { success: true, prize };
    };
    
    // Old
    // const createPrizeRule = function (room, cb) {
    //     console.trace("Inside createPrizeRulecreatePrizeRule")
    //     db.countTournamentusers({ tournamentId: room.tournamentId, status: 'Registered' }, function (err, count) {
    //         if (err) {
    //             cb({ success: false });
    //         } else {
    //             db.findAllRebuy({ tournamentId: room.tournamentId }, async function (err, rebuy) {
    //                 if (!err) {
    //                     db.findTournamentRoom({ "tournamentName": room.parentTournament, "isActive": true }, async function (err, tourDetail) {
    //                         let prizeRule = 0, rebuySum = 0;
    //                         if (rebuy.length > 0) {
    //                             let rebuyCountArray = _.pluck(rebuy, "rebuyCount");
    //                             rebuySum = _.reduce(rebuyCountArray, function (memo, num) { return memo + num; }, 0);
    //                         }
    //                         if (room.tournamentType === stateOfX.tournamentType.satelite) {
    //                             console.log("got this tourDetail while createPrizeRule for satellite", err, tourDetail);
    //                             if (tourDetail && tourDetail.state !== stateOfX.tournamentState.finished && tourDetail.state !== stateOfX.tournamentState.cancelled) {
    //                                 room.parentBuyIn = tourDetail[0].totalBuyIn;
    //                                 prizeRule = decideSatellitePrizeRule(count, room);
    //                             }
    //                             else {
    //                                 cb({ success: false })
    //                                 return;
    //                             }
    //                         }
    //                         if (room.tournamentType === stateOfX.tournamentType.normal || room.tournamentType === stateOfX.tournamentType.sitNGo) {
    //                             prizeRule = await prizeAlgo.prizeForDb(room.isGuaranteed, room.guaranteedAmount, room.priceStructure, count, room.minPlayers, room.entryFees, rebuySum * room.entryFees, 0);
    //                         }
    //                         if (room.tournamentType === stateOfX.tournamentType.freeRoll) {
    //                             if (!room.isGuaranteed) {
    //                                 room.isGuaranteed = true;
    //                                 room.guaranteedAmount = 0;
    //                             }
    //                             prizeRule = await prizeAlgo.prizeForDb(room.isGuaranteed, room.guaranteedAmount, room.priceStructure, count, room.minPlayers, room.entryFees, rebuySum * room.entryFees, 0);
    //                         }
    //                         const prize = {
    //                             tournamentId: room.tournamentId,
    //                             type: "server",
    //                             prize: prizeRule
    //                         }
    //                         console.log("Inside setting prizeRule", prize)
    //                         db.createPrizeRule(prize, function (err, result) {
    //                             if (err) {
    //                                 cb({ success: false })
    //                             } else {
    //                                 cb({ success: true, prize: prize })
    //                             }
    //                         })
    //                     })
    //                 } else {
    //                     cb({ success: false })
    //                 }
    //             })
    //         }
    //     })
    // }
    /*================================  END  ===================================*/



    /*================================  START  ===================================*/
    /**
     * function to  updateRebuyOpenedStatus
     */
    // New
    async updateRebuyOpenedStatus (tournamentId: any): Promise<any> {
        
        try {
            await this.db.updateTournamentGeneralize(tournamentId, { isRebuyAllowed: false });
        } catch (err) {
            console.log(stateOfX.serverLogType.info, "Error in updateRebuyOpenedStatus in tournament schedular");
        }
    };    

    // Old
    // const updateRebuyOpenedStatus = function (tournamentId) {
    //     console.log(stateOfX.serverLogType.info, "in updateRebuyOpenedStatus in tournamentSchedular - " + JSON.stringify(tournamentId));
    //     db.updateTournamentGeneralize(tournamentId, { isRebuyAllowed: false }, function (err, result) {
    //         if (err) {
    //             console.log(stateOfX.serverLogType.info, "Error in updateRebuyOpenedStatus in tournament schedular");
    //         } else {
    //             console.log(stateOfX.serverLogType.info, "updateRebuyOpenedStatus success in tournament schedular");
    //         }
    //     })
    // }
    /*================================  END  ===================================*/


    /*================================  START  ===================================*/
    // New
    async broadcastForRebuyStatus(params: any): Promise<void> {
    
        try {
            const channels = await this.imdb.getAllTableByTournamentId({ tournamentId: params.room.tournamentId });
    
            for (const channel of channels) {
                const channelObj = params.globalThis.get('channelService').getChannel(channel.channelId, false);
    
                if (params.callerFunction === "REBUYABOUTTOEND") {
                    this.broadcastHandler.fireBroadcastForRebuyAboutToEnd({
                        channel: channelObj,
                        channelId: channel.channelId,
                        rebuyTimeEnds: params.rebuyTimeEnds
                    });
                } else {
                    this.broadcastHandler.fireBroadcastForRebuyStatus({
                        channel: channelObj,
                        channelId: channel.channelId,
                        rebuyStatus: params.rebuyStatus
                    });
                }
            }
    
        } catch (err) {
            console.log(stateOfX.serverLogType.info, "Error in getting tournament users in broadcastForRebuyStasstu");
        }
    };
    

    // Old
    // const broadcastForRebuyStatus = function (params) {
    //     console.log(" broadcastForRebuyStasstu", params)
    //     console.log(stateOfX.serverLogType.info, 'tournamentroom is - ' + JSON.stringify(params.room));
    //     imdb.getAllTableByTournamentId({ tournamentId: params.room.tournamentId, }, function (err, channels) {
    //         if (err) {
    //             console.log(stateOfX.serverLogType.info, "Error in getting tournament users in broadcastForRebuyStasstu");
    //         } else {
    //             async.each(channels, function (channel, callback) {
    //                 let channelObj = params.globalThis.get('channelService').getChannel(channel.channelId, false);
    //                 if (params.callerFunction == "REBUYABOUTTOEND") {
    //                     broadcastHandler.fireBroadcastForRebuyAboutToEnd({ channel: channelObj, channelId: channel.channelId, rebuyTimeEnds: params.rebuyTimeEnds });
    //                 }
    //                 else {
    //                     broadcastHandler.fireBroadcastForRebuyStatus({ channel: channelObj, channelId: channel.channelId, rebuyStatus: params.rebuyStatus });
    //                 }
    //                 callback();
    //             }, function (err) {
    //                 if (err) {
    //                     console.log(stateOfX.serverLogType.info, 'Error in sending rebuy status broadcast');
    //                 } else {
    //                     console.log(stateOfX.serverLogType.info, 'Successfully send rebuy status broadcast');
    //                 }
    //             })
    //         }
    //     })
    // }
    /*================================  END  ===================================*/



    /*================================  START  ===================================*/
    /**
     * function to  countPlayingPlayers
     */
    // New
    const countPlayingPlayers = async function (params: any): Promise<void> {
        try {
            const channels = await this.imdb.getAllTableByTournamentId({ tournamentId: params.room.tournamentId });
    
            let playingPlayers = 0;
            let activeChannelId: string | undefined;
            let activePlayerId: string | undefined;
    
            for (const channel of channels) {
                console.log(stateOfX.serverLogType.info, 'channel is - ' + JSON.stringify(channel));
                for (const player of channel.players) {
                    if (player.state === stateOfX.playerState.playing || player.state === stateOfX.playerState.waiting) {
                        playingPlayers++;
                        activeChannelId = channel.channelId;
                        activePlayerId = player.playerId;
                    }
                }
            }
    
            console.log(stateOfX.serverLogType.info, `playing player and channelId is ${playingPlayers} ${activeChannelId}`);
    
            if (playingPlayers === 1 && activePlayerId && activeChannelId) {
                const addChipsResponse = await profileMgmt.addChips({
                    playerId: activePlayerId,
                    chips: params.prize.prize[0].prizeMoney,
                    isRealMoney: params.room.isRealMoney
                });
    
                if (addChipsResponse.success) {
                    const channelObj = params.globalThis.get('channelService').getChannel(activeChannelId, false);
                    const self: any = {
                        app: params.globalThis
                    };
                    self.app.rpcInvoke = params.globalThis.rpcInvoke;
                    self.app.rpc = params.globalThis.rpc;
    
                    console.log(stateOfX.serverLogType.info, 'self is ', self);
    
                    await this.sendPlayerEliminationBroadcast({
                        self: self,
                        playerId: activePlayerId,
                        tournamentId: params.room.tournamentId,
                        channelId: activeChannelId,
                        chipsWon: params.prize.prize[0].prizeMoney
                    });
    
                    await this.startGameHandler.startGame({
                        self: self,
                        session: "session",
                        channelId: activeChannelId,
                        channel: channelObj,
                        eventName: stateOfX.startGameEvent.tournament
                    });
                } else {
                    console.log(stateOfX.serverLogType.info, 'Add Chips failed');
                }
            } else {
                console.log(stateOfX.serverLogType.info, 'no need to start game again, more than one player left on channel');
            }
    
        } catch (err) {
            console.log(stateOfX.serverLogType.info, "Error in getting tournament users in countPlayingPlayers");
        }
    };
    

    // Old
    // const countPlayingPlayers = function (params) {
    //     imdb.getAllTableByTournamentId({ tournamentId: params.room.tournamentId }, function (err, channels) {
    //         console.log(stateOfX.serverLogType.info, 'all channels is in in memory is - ' + JSON.stringify(channels));
    //         if (err) {
    //             console.log(stateOfX.serverLogType.info, "Erro in getting tournament users in broadcastForRebueryStatus");
    //         } else {
    //             let playingPlayers = 0, activeChannelId, activePlayerId;
    //             async.each(channels, function (channel, callback) {
    //                 console.log(stateOfX.serverLogType.info, 'channel is - ' + JSON.stringify(channel));
    //                 for (let i = 0; i < channel.players.length; i++) {
    //                     if (channel.players[i].state === stateOfX.playerState.playing || channel.players[i].state === stateOfX.playerState.waiting) {
    //                         playingPlayers++;
    //                         activeChannelId = channel.channelId;
    //                         activePlayerId = channel.players[i].playerId;
    //                     }
    //                 }
    //                 callback();
    //             }, function (err) {
    //                 if (err) {
    //                     console.log(stateOfX.serverLogType.info, 'Error in sending rebuy status broadcast');
    //                 } else {
    //                     console.log(stateOfX.serverLogType.info, "playing player and channelId is" + playingPlayers + " " + activeChannelId);
    //                     if (playingPlayers === 1) {
    //                         profileMgmt.addChips({ playerId: activePlayerId, chips: params.prize.prize[0].prizeMoney, isRealMoney: params.room.isRealMoney }, function (addChipsResponse) {
    //                             if (addChipsResponse.success) {
    //                                 const channelObj = params.globalThis.get('channelService').getChannel(activeChannelId, false);
    //                                 let self = {};
    //                                 self.app = params.globalThis;
    //                                 self.app.rpcInvoke = params.globalThis.rpcInvoke;
    //                                 self.app.rpc = params.globalThis.rpc; // pushing rpc in to app;
    //                                 console.log(stateOfX.serverLogType.info, 'self is ', self);
    //                                 sendPlayerEliminationBroadcast({
    //                                     self: self,
    //                                     playerId: activePlayerId,
    //                                     tournamentId: params.room.tournamentId,
    //                                     channelId: activeChannelId,
    //                                     chipsWon: params.prize.prize[0].prizeMoney,
    //                                 }, function () {
    //                                     startGameHandler.startGame({ self: self, session: "session", channelId: activeChannelId, channel: channelObj, eventName: stateOfX.startGameEvent.tournament });
    //                                 })
    //                             } else {
    //                                 console.log(stateOfX.serverLogType.info, 'Add Chips failed');
    //                             }
    //                         })
    //                     } else {
    //                         console.log(stateOfX.serverLogType.info, 'no need to start game again more than one player left on channel');
    //                     }
    //                 }
    //             })
    //         }
    //     })
    // }
    /*================================  END  ===================================*/


    /*================================  START  ===================================*/
    /**
     * function to sendPlayerEliminationBroadcast 
     */
    // New
    async sendPlayerEliminationBroadcast(params: any): Promise<void> {
    
        const broadcastData = {
            self: params.self,
            playerId: params.playerId,
            tournamentId: params.tournamentId,
            channelId: params.channelId,
            rank: 1,
            chipsWon: params.chipsWon,
            isGameRunning: false,
            isRebuyAllowed: false,
            route: "playerElimination"
        };
    
        await this.broadcastHandler.firePlayerEliminateBroadcast(broadcastData);
    };
    

    // Old
    // const sendPlayerEliminationBroadcast = function (params, cb) {
    //     console.log(stateOfX.serverLogType.info, 'params.self in sendPlayerEliminationBroadcast', params.self);
    //     const broadcastData = {
    //         self: params.self,
    //         playerId: params.playerId,
    //         tournamentId: params.tournamentId,
    //         channelId: params.channelId,
    //         rank: 1,
    //         chipsWon: params.chipsWon,
    //         isGameRunning: false,
    //         isRebuyAllowed: false,
    //         route: "playerElimination"
    //     }
    //     broadcastHandler.firePlayerEliminateBroadcast(broadcastData, function () {
    //         console.log(stateOfX.serverLogType.info, "player elimination broadcast sent successfully tournament schedular");
    //         cb()
    //     })
    // }
    /*================================  END  ===================================*/

    /*================================  START  ===================================*/
    /**
     * function to process prizeRule and Ranks 
     */

    // New
    async processPrizeRuleAndRanks(params: any): Promise<any> {
    
        if (!params.room.isLateRegistrationAllowed && !params.room.isRebuyAllowed) {
            if (
                params.room.tournamentType === stateOfX.tournamentType.normal ||
                params.room.tournamentType === stateOfX.tournamentType.satelite ||
                params.room.tournamentType === stateOfX.tournamentType.freeRoll ||
                params.room.tournamentType === stateOfX.tournamentType.sitNGo
            ) {
                const result = await this.createPrizeRule(params.room);
                this.calculateRanks(params.room);
                if (result.success) {
                    return params;
                } else {
                    throw {
                        success: false,
                        isRetry: false,
                        isDisplay: false,
                        channelId: "",
                        info: popupTextManager.falseMessages.PROCESSPRIZERULEANDRANKSFAIL_TOURNAMENTSCHEDULER
                    };
                }
            } else {
                console.log(stateOfX.serverLogType.info, 'This is not a normal/satellite/freeRoll/sitnGo tournament so not creating prize rule');
                return params;
            }
        } else {
            let tempDecisionTime1 = params.room.tournamentStartTime;
            let tempDecisionTime2 = params.room.tournamentStartTime;
    
            if (params.room.isLateRegistrationAllowed) {
                tempDecisionTime1 += params.room.lateRegistrationTime * 60000;
            }
    
            if (params.room.isRebuyAllowed) {
                tempDecisionTime2 += params.room.rebuyTime * 60000;
    
                // Schedule rebuy closed
                schedule.scheduleJob(tempDecisionTime2, async function () {
                    this.updateRebuyOpenedStatus(params.room._id);
                    params.rebuyStatus = false;
                    await this.broadcastForRebuyStatus(params);
                });
    
                // Schedule rebuy about to end
                const rebuyTimeEnds = tempDecisionTime2 - (systemConfig.rebuyAboutToEndTime * 60000);
                console.log(".........................rebuyTimeEnds", rebuyTimeEnds);
                schedule.scheduleJob(rebuyTimeEnds, async function () {
                    params.callerFunction = "REBUYABOUTTOEND";
                    params.rebuyTimeEnds = rebuyTimeEnds;
                    await this.broadcastForRebuyStatus(params);
                });
            }
    
            if (
                params.room.tournamentType === stateOfX.tournamentType.normal ||
                params.room.tournamentType === stateOfX.tournamentType.satelite ||
                params.room.tournamentType === stateOfX.tournamentType.freeRoll
            ) {
                const prizeRulesDecisionTime = Math.max(tempDecisionTime1, tempDecisionTime2);
                console.log("prizeRulesDecisionTimeprizeRulesDecisionTime", prizeRulesDecisionTime);
    
                schedule.scheduleJob(prizeRulesDecisionTime, async function () {
                    const result = await this.createPrizeRule(params.room);
                    this.calculateRanks(params.room);
                    if (result.success) {
                        params.prize = result.prize;
                        // Optionally: await countPlayingPlayers(params);
                    } else {
                        console.log(stateOfX.serverLogType.info, "Error in creating prize rule");
                    }
                });
            }
    
            return params;
        }
    };
    
    // Old
    // const processPrizeRuleAndRanks = function (params, cb) {
    //     console.log("params in processPrizeRuleAndRanks - ", params.room);
    //     if (!params.room.isLateRegistrationAllowed && !params.room.isRebuyAllowed) {
    //         //Going to create prize when late registration is not allowed
    //         if (params.room.tournamentType === stateOfX.tournamentType.normal || params.room.tournamentType === stateOfX.tournamentType.satelite || params.room.tournamentType === stateOfX.tournamentType.freeRoll || params.room.tournamentType === stateOfX.tournamentType.sitNGo) {
    //             createPrizeRule(params.room, function (result) {
    //                 calculateRanks(params.room);
    //                 if (result.success) {
    //                     cb(null, params);
    //                 } else {
    //                     cb({ success: false, isRetry: false, isDisplay: false, channelId: "", info: popupTextManager.falseMessages.PROCESSPRIZERULEANDRANKSFAIL_TOURNAMENTSCHEDULER });
    //                 }
    //             })
    //         }
    //         else {
    //             console.log(stateOfX.serverLogType.info, 'This is not a normal/satellite/freeRoll/sitnGo tournament so not creating prize rule');
    //             cb(null, params);
    //         }
    //     } else {
    //         //Schedule create prize rule for later
    //         let tempDecisionTime1 = params.room.tournamentStartTime;
    //         let tempDecisionTime2 = params.room.tournamentStartTime;
    //         if (params.room.isLateRegistrationAllowed) {
    //             tempDecisionTime1 += params.room.lateRegistrationTime * 60000;
    //         }
    //         if (params.room.isRebuyAllowed) {
    //             tempDecisionTime2 += params.room.rebuyTime * 60000;
    //             // schedule rebuy opened status
    //             schedule.scheduleJob(tempDecisionTime2, function () {
    //                 updateRebuyOpenedStatus(params.room._id);
    //                 params.rebuyStatus = false;
    //                 broadcastForRebuyStatus(params);
    //             })
    //             // schedule rebuy about to end
    //             let rebuyTimeEnds = tempDecisionTime2 - (systemConfig.rebuyAboutToEndTime * 60000);
    //             console.log(".........................rebuyTimeEnds", rebuyTimeEnds);
    //             schedule.scheduleJob(rebuyTimeEnds, function () {
    //                 params.callerFunction = "REBUYABOUTTOEND";
    //                 params.rebuyTimeEnds = rebuyTimeEnds;
    //                 broadcastForRebuyStatus(params);
    //             })
    //         }
    //         if (params.room.tournamentType === stateOfX.tournamentType.normal || params.room.tournamentType === stateOfX.tournamentType.satelite || params.room.tournamentType === stateOfX.tournamentType.freeRoll) {
    //             let prizeRulesDecisionTime = tempDecisionTime2 > tempDecisionTime1 ? tempDecisionTime2 : tempDecisionTime1;
    //             console.log("prizeRulesDecisionTimeprizeRulesDecisionTime", prizeRulesDecisionTime)
    //             schedule.scheduleJob(prizeRulesDecisionTime, function () {
    //                 createPrizeRule(params.room, function (result) {
    //                     calculateRanks(params.room);
    //                     if (result.success) {
    //                         params.prize = result.prize;
    //                         //Start Game if only one player left after rebuy and late registration ends
    //                         // countPlayingPlayers(params);
    //                     } else {
    //                         console.log(stateOfX.serverLogType.info, "Error in creating prize rule");
    //                     }
    //                 });
    //             })
    //         }
    //         cb(null, params);
    //     }
    // }
    /*================================  END  ===================================*/



    /*================================  START  ===================================*/
    /**
     * function to start tournament process
     */
    // New
    async startTournamentProcess(params: any): Promise<any> {
    
        const delayInStartTournament = 1000;
    
        const self = {
            app: params.globalThis
        };
    
        const paramsForTournament = {
            tournamentId: params.room.tournamentId,
            self: self,
            session: "session"
        };
    
        await new Promise(resolve => setTimeout(resolve, delayInStartTournament));
    
        await this.startTournamentHandler.process(paramsForTournament);
    
    
        params.rebuyStatus = params.room.isRebuyAllowed;
    
        if (params.room.isRebuyAllowed) {
            await this.broadcastForRebuyStatus(params);
        }
    
        return params;
    };
    

    // Old
    // const startTournamentProcess = function (params, cb) {
    //     console.log("in startTournamentProcess")
    //     console.log(stateOfX.serverLogType.info, "in startTournamentProcess - " + params.room);
    //     // const delayInStartTournament = systemConfig.delayInNormalTournament*1000;
    //     const delayInStartTournament = 1000;
    //     console.log(stateOfX.serverLogType.info, "--------------Going to start tournament------------");
    //     let self = {
    //         app: params.globalThis
    //     }
    //     const paramsForTournament = {
    //         tournamentId: params.room.tournamentId,
    //         self: self,
    //         session: "session"
    //     };
    //     setTimeout(function () {
    //         startTournamentHandler.process(paramsForTournament, function () {
    //             console.log(stateOfX.serverLogType.info, "Start tournament response - ")
    //             params.rebuyStatus = params.room.isRebuyAllowed;
    //             if (params.room.isRebuyAllowed) {
    //                 broadcastForRebuyStatus(params);
    //             }
    //         });
    //         // addOnProcess(params);
    //     }, delayInStartTournament)
    //     cb(null, params);
    // }
    /*================================  END  ===================================*/


    /*================================  END  ===================================*/
    /**
     * function to start tournament
     */
    // New
    async startTournament(room: any, globalThis: any): Promise<void> {
    
        const params = {
            room: room,
            globalThis: globalThis
        };
    
        try {
            const validatedParams = await this.tournamentSchedular.validateTournamentStart(params);
            const tableCreatedParams = await this.createTableForNormalTournament(validatedParams);
            const processedPrizeParams = await this.processPrizeRuleAndRanks(tableCreatedParams);
            const finalResult = await this.startTournamentProcess(processedPrizeParams);
    
            console.log(stateOfX.serverLogType.info, "result in startTournament in schedlar is - " + finalResult);
        } catch (err) {
            console.log("errr &&&& rsulttttt in scheduler", err);
            console.log(stateOfX.serverLogType.info, "err in startTournament in schedlar is - " + JSON.stringify(err));
        }
    };
    

    // Old
    // const startTournament = function (room, globalThis) {
    //     console.log(stateOfX.serverLogType.info, "in start tournament in tournament schedular" + globalThis);
    //     const params = {
    //         room: room,
    //         globalThis: globalThis
    //     }
    //     async.waterfall([
    //         async.apply(tournamentSchedular.validateTournamentStart, params),
    //         createTableForNormalTournament,
    //         processPrizeRuleAndRanks,
    //         startTournamentProcess
    //     ], function (err, result) {
    //         console.log("errr &&&& rsulttttt in scheduler", err, result)
    //         if (err) {
    //             console.log(stateOfX.serverLogType.info, "err in startTournament in schedlar is - " + JSON.stringify(err));
    //         } else {
    //             console.log(stateOfX.serverLogType.info, "result in startTournament in schedlar is - " + result);
    //         }
    //     })
    // }
    /*================================  END  ===================================*/


    /*================================  START  ===================================*/
    /**
     * function to check tournament start
     */
    //   New
    checkTournamentStart = function (globalThis: any): void {

        schedule.scheduleJob('*/5 * * * * *', async function () {

            try {
                const rooms = await this.db.findTournamentRoom({
                    $or: [
                        { state: "STARTING" },
                        {
                            tournamentType: "SITNGO",
                            state: "REGISTRATION",
                            $expr: {
                                $eq: ["$maxPlayers", "$enrolledPlayer"]
                            }
                        }
                    ]
                });

                for (const room of rooms) {
                    try {
                        await this.db.updateTournamentStateToRunning(room._id);
                        await this.startTournament(room, globalThis);
                    } catch (updateErr) {
                        console.log(stateOfX.serverLogType.info, "Error updating tournament state or starting tournament:", updateErr);
                    }
                }
            } catch (err) {
                console.log(stateOfX.serverLogType.info, "Error in scan tournaments", err);
            }
        });
    };


    //   Old
    //   tournamentSchedular.checkTournamentStart = function (globalThis) {
    //         console.log(stateOfX.serverLogType.info, "in checkTournamentStart in tournament schedular");
    //         schedule.scheduleJob('*/5 * * * * *', function () {
    //             console.log(stateOfX.serverLogType.info, "in checkTournamentStart");
    //             db.findTournamentRoom({
    //                 $or: [
    //                     {
    //                         state: "STARTING"
    //                     },
    //                     {
    //                         "tournamentType": "SITNGO",
    //                         "state": "REGISTRATION",
    //                         $expr: {
    //                             $eq: ["$maxPlayers", "$enrolledPlayer"]
    //                         }
    //                     }
    //                 ]
    //             }, function (err, rooms) {
    //                 async.eachSeries(rooms, function (room, callback) {
    //                     db.updateTournamentStateToRunning(room._id, function (err, result) {
    //                         if (err) {
    //                             callback();
    //                         } else {
    //                             startTournament(room, globalThis);
    //                             callback();
    //                         }
    //                     })
    //                 }, function (err) {
    //                     if (err) {
    //                         console.log(stateOfX.serverLogType.info, "Error in scan tournaments");
    //                     }
    //                 })
    //             })
    //         });
    //     }
    /*================================  END  ===================================*/


    /*================================  START  ===================================*/
    /**
     * check whether addOn is enabled or disabled in the current tournament room
     *
     * @method checkAddOnEnabled
     * @param  {Object}       params  request json object
     * @param  {Function}     cb      callback function
     * @return {Object}               params/validated object
     */
    // New
    async checkAddOnEnabled(params: any): Promise<any> {
    
        if (params.room.isAddOnAllow) {
            return params;
        } else {
            throw {
                success: false,
                info: popupTextManager.falseMessages.CHECKADDONENABLED_ADDONPROCESS_TOURNAMENTSCHEDULER
            };
        }
    };
    

    // Old
    // const checkAddOnEnabled = function (params, cb) {
    //     console.log(stateOfX.serverLogType.info, "in checkAddOnEnabled in addOnProcess " + params);
    //     if (params.room.isAddOnAllow)
    //         cb(null, params)
    //     else
    //         cb({ success: false, info: popupTextManager.falseMessages.CHECKADDONENABLED_ADDONPROCESS_TOURNAMENTSCHEDULER });
    // }
    /*================================  END  ===================================*/



    /*================================  START  ===================================*/
    /**
     * get the addOn levels
     *
     * @method getAddOnTime
     * @param  {Object}       params  request json object
     * @param  {Function}     cb      callback function
     * @return {Object}               params/validated object
     */
    // New
    async getAddOnTime(params: any): Promise<any> {
    
        if (params.room.isAddOnAllow && params.room.addOnTime && params.room.addOnTime.length > 0) {
            return params;
        } else {
            throw {
                success: false,
                isRetry: false,
                isDisplay: false,
                channelId: "",
                info: popupTextManager.falseMessages.GETADDONTIME_ADDONPROCESS_TOURNAMENTSCHEDULER
            };
        }
    };
    
    // Old
    // const getAddOnTime = function (params, cb) {
    //     console.log(stateOfX.serverLogType.info, "in getAddOnTime in addOnProcess ", params.room.addOnTime, params.room);
    //     if (params.room.isAddOnAllow && params.room.addOnTime && params.room.addOnTime.length > 0) {
    //         cb(null, params)
    //     }
    //     else {
    //         cb({ success: false, isRetry: false, isDisplay: false, channelId: "", info: popupTextManager.falseMessages.GETADDONTIME_ADDONPROCESS_TOURNAMENTSCHEDULER });
    //     }
    // }
    /*================================  END  ===================================*/




    /*================================  START  ===================================*/
    /**
     * this function gets the blind rule using tournamentId from database
     *
     * @method getBlindRule
     * @param  {Object}       params  request json object
     * @param  {Function}     cb      callback function
     * @return {Object}               params/validated object
     */
    // New
    async getBlindRule(params: any): Promise<any> {
    
        try {
            const result = await this.db.findBlindRule(params.room.tournamentId);
    
            if (result) {
                params.blindRuleResult = result.blinds;
                return params;
            } else {
                throw {
                    success: false,
                    isRetry: false,
                    isDisplay: false,
                    channelId: "",
                    info: popupTextManager.dbQyeryInfo.DBLASTBLINDRULE_GETBLINDANDPRIZE_TOURNAMENT
                };
            }
        } catch (err) {
            throw {
                success: false,
                isRetry: false,
                isDisplay: false,
                channelId: "",
                info: popupTextManager.dbQyeryInfo.DBLASTBLINDRULE_GETBLINDANDPRIZE_TOURNAMENT
            };
        }
    };
    
    // Old
    // const getBlindRule = function (params, cb) {
    //     console.log(stateOfX.serverLogType.info, "in getBlindRule in addOnProcess " + JSON.stringify(params.room));
    //     db.findBlindRule(params.room.tournamentId, function (err, result) {
    //         console.log(stateOfX.serverLogType.info, "in db result in getBlindRule in addOnProcess " + JSON.stringify(result));
    //         console.log(stateOfX.serverLogType.info, "in db result in getBlindRule in addOnProcess " + JSON.stringify(result.blinds));

    //         if (!err && result) {
    //             params.blindRuleResult = result.blinds;
    //             cb(null, params);
    //         }
    //         else {
    //             cb({ success: false, isRetry: false, isDisplay: false, channelId: "", info: popupTextManager.dbQyeryInfo.DBLASTBLINDRULE_GETBLINDANDPRIZE_TOURNAMENT });
    //         }
    //     })
    // }
    /*================================  END  ===================================*/




    /*================================  END  ===================================*/
    /**
     * this function updates the rebuy status and send broadcasts for addOn
     *
     * @method updateRebuyAndsendBroadcastForAddOn
     * @param  {Object}       params  request json object
     * @param  {Function}     cb      callback function
     * @return {Object}               params/validated object
     */
    // New
    async updateRebuyAndsendBroadcastForAddOn(params: any): Promise<any> {
    
        try {
            for (const addonTimeObject of params.room.addOnTime) {
                
                const blindLevel = params.blindRuleResult[addonTimeObject.level - 1];
                const timeToStart = params.room.tournamentStartTime + (blindLevel ? (blindLevel.duration * blindLevel.level) : 0) * 60000;
                const timeToEnd = timeToStart + (addonTimeObject.duration ? addonTimeObject.duration : 2) * 60000;
    
    
                this.scheduleBroadcastForAddonStart(params, timeToStart + 10);
                this.scheduleBroadcastForAddonEnd(params, timeToEnd);
            }
    
            return params;
        } catch (err) {
            // Fallback to returning params in case of error
            return params;
        }
    };
    

    // Old
    // const updateRebuyAndsendBroadcastForAddOn = function (params, cb) {
    //     console.log(stateOfX.serverLogType.info, "in addOn time in addOnProcess addonTimeObject", params.room.addOnTime);
    //     console.log(stateOfX.serverLogType.info, "in addOn time in addOnProcess blindRule", params.blindRuleResult);
    //     console.log("tour start > ", new Date(params.room.tournamentStartTime + 330 * 60000))
    //     async.eachSeries(params.room.addOnTime, function (addonTimeObject, escb) {
    //         console.log(stateOfX.serverLogType.info, "in async each series updateRebuyAndsendBroadcastForAddOn in addOnProcess " + JSON.stringify(addonTimeObject));
    //         let timeToStart = params.room.tournamentStartTime + (params.blindRuleResult[addonTimeObject.level - 1] ? (params.blindRuleResult[addonTimeObject.level - 1].duration * params.blindRuleResult[addonTimeObject.level - 1].level) : 0) * 60000;
    //         const timeToEnd = timeToStart + (addonTimeObject.duration ? addonTimeObject.duration : 2) * 60000;
    //         // console.log(stateOfX.serverLogType.info, "in async each series time to start  in addOnProcess " + timeToStart);
    //         // console.log(stateOfX.serverLogType.info, "in async each series  time To End in addOnProcess " + timeToEnd);
    //         console.log("addonDetails are> addOnStart > ", new Date(timeToStart + 330 * 60000), "addOnEnd > ", new Date(timeToEnd + 330 * 60000));
    //         scheduleBroadcastForAddonStart(params, timeToStart + 10);
    //         scheduleBroadcastForAddonEnd(params, timeToEnd);
    //         escb();
    //     }, function (err) {
    //         if (err) {
    //             cb(params);
    //         }
    //         else {
    //             cb(null, params);
    //         }
    //     })
    // }
    /*================================  END  ===================================*/



    /*================================  START  ===================================*/
    /**
     * this funtion schedules broadcaast for addOn start
     */
    // New
    scheduleBroadcastForAddonStart(params: any, timeToBroadcast: number) {
        schedule.scheduleJob(timeToBroadcast, () => {
            this.broadcastForAddon(params, "ADDONSTART");
        });
    };
    

    // Old
    // const scheduleBroadcastForAddonStart = function (params, timeToBroadcast) {
    //     schedule.scheduleJob(timeToBroadcast, function () {
    //         console.log(stateOfX.serverLogType.info, 'right time to schedule addOn broadcast');
    //         broadcastForAddon(params, "ADDONSTART");
    //     });
    // }
    /*================================  END  ===================================*/



    /*================================  START  ===================================*/
    /**
     * this funtion schedules broadcaast for addOn end
     */
    // New
    scheduleBroadcastForAddonEnd(params: any, timeToBroadcast: number): any {
        schedule.scheduleJob(timeToBroadcast, () => {
            console.log(stateOfX.serverLogType.info, 'right time to schedule addOn broadcast');
            this.broadcastForAddon(params, "ADDONEND");
        });
    };    

    //Old
    // const scheduleBroadcastForAddonEnd = function (params, timeToBroadcast) {
    //     schedule.scheduleJob(timeToBroadcast, function () {
    //         console.log(stateOfX.serverLogType.info, 'right time to schedule addOn broadcast');
    //         broadcastForAddon(params, "ADDONEND");
    //     });
    // }
    /*================================  END  ===================================*/


    /*================================  END  ===================================*/
    /**
     * this function sends broadcast for addOn start and end
     */
    // New
    async broadcastForAddon(params: any, callerFunction: string): Promise<void> {
        const filter = {
            tournamentId: params.room.tournamentId,
        };
        
        try {
            const channels = await this.imdb.getAllTableByTournamentId(filter);
    
            for (const channel of channels) {
                console.log(stateOfX.serverLogType.info, 'in async each all channels is in in memory is - ' + JSON.stringify(channel));
                const channelObj = params.globalThis.get('channelService').getChannel(channel.channelId, false);
                console.log("channelObj-----------", channelObj);
    
                if (callerFunction == "ADDONEND") {
                    console.log("in fireBroadcastForAddon.............end");
                    await this.updateAddonEligibility(filter, { isEligibleForAddon: false });
                    this.broadcastHandler.fireBroadcastForAddon({
                        route: "addonTimeEnds",
                        channel: channelObj,
                        channelId: channel.channelId,
                        info: "Addon time ended"
                    });
                } else {
                    console.log("in fireBroadcastForAddon.............start");
                    await this.updateAddonEligibility(filter, { isEligibleForAddon: true });
                    this.broadcastHandler.fireBroadcastForAddon({
                        route: "addonTimeStarts",
                        channel: channelObj,
                        channelId: channel.channelId,
                        info: "Addon time started"
                    });
                }
            }
    
            console.log(stateOfX.serverLogType.info, 'Successfully sent addOn status broadcast');
        } catch (err) {
            console.log(stateOfX.serverLogType.info, 'Error in getting tournament users or sending addOn status broadcast');
        }
    };
    

    // Old
    // const broadcastForAddon = function (params, callerFunction) {
    //     console.log(stateOfX.serverLogType.info, 'tournamentroom is - ' + JSON.stringify(params.room));
    //     const filter = {
    //         tournamentId: params.room.tournamentId,
    //     }
    //     imdb.getAllTableByTournamentId(filter, function (err, channels) {
    //         console.log(stateOfX.serverLogType.info, 'all channels is in in memory is - ' + JSON.stringify(channels));
    //         if (err) {
    //             console.log(stateOfX.serverLogType.info, "Error in getting tournament users in broadcastForAddon");
    //         } else {
    //             async.each(channels, function (channel, callback) {
    //                 console.log(stateOfX.serverLogType.info, 'in async each all channels is in in memory is - ' + JSON.stringify(channel));
    //                 const channelObj = params.globalThis.get('channelService').getChannel(channel.channelId, false);
    //                 console.log("channelObj-----------", channelObj);
    //                 if (callerFunction == "ADDONEND") {
    //                     console.log("in fireBroadcastForAddon.............end")
    //                     updateAddonEligibility(filter, { isEligibleForAddon: false });
    //                     broadcastHandler.fireBroadcastForAddon({ route: "addonTimeEnds", channel: channelObj, channelId: channel.channelId, info: "Addon time ended" });
    //                 }
    //                 else {
    //                     console.log("in fireBroadcastForAddon.............start")
    //                     updateAddonEligibility(filter, { isEligibleForAddon: true });
    //                     broadcastHandler.fireBroadcastForAddon({ route: "addonTimeStarts", channel: channelObj, channelId: channel.channelId, info: "Addon time started" });
    //                 }

    //                 callback();
    //             }, function (err) {
    //                 if (err) {
    //                     console.log(stateOfX.serverLogType.info, 'Error in sending addOn status broadcast');
    //                 } else {
    //                     console.log(stateOfX.serverLogType.info, 'Successfully send addOn status broadcast');
    //                 }
    //             })
    //         }
    //     })
    // }
    /*================================  END  ===================================*/



    /*================================  START  ===================================*/
    /**
     * this function updates addOn eligibility according to addOn start and end 
     */
    // New
    async updateAddonEligibility(filter: any, updateData: any): Promise<any> {
        
        try {
            const result = await this.db.updateRebuyWithoutInsert(filter, updateData);
            if (result) {
                console.log(stateOfX.serverLogType.info, 'success in sending addOn status broadcast');
            } else {
                console.log(stateOfX.serverLogType.info, 'No result found in sending addOn status broadcast');
            }
        } catch (err) {
            console.log(stateOfX.serverLogType.info, 'Error in sending addOn status broadcast', err);
        }
    };
    

    // Old
    // const updateAddonEligibility = function (filter, updateData) {
    //     console.log(stateOfX.serverLogType.info, 'updateAddonEligibility dbquery- ' + filter + "......" + updateData);
    //     db.updateRebuyWithoutInsert(filter, updateData, function (err, result) {
    //         if (!err && result) {
    //             console.log(stateOfX.serverLogType.info, 'success in sending addOn status broadcast');
    //         }
    //         else {
    //             console.log(stateOfX.serverLogType.info, 'Error in sending addOn status broadcast');
    //         }
    //     })
    // }
    /*================================  END  ===================================*/


    /*================================  START  ===================================*/
    // New
    async addOnProcess(params: any): Promise<void> {
        try {
            // Step 1: Check if Add-On is enabled
            await this.checkAddOnEnabled(params);
            
            // Step 2: Get Add-On Time
            await this.getAddOnTime(params);
            
            // Step 3: Get Blind Rule
            await this.getBlindRule(params);
            
            // Step 4: Update Rebuy and send Broadcast for Add-On
            await this.updateRebuyAndsendBroadcastForAddOn(params);
            
        } catch (err) {
            console.log(stateOfX.serverLogType.info, "err in addOnProcess in tournament scheduler ", JSON.stringify(err));
        }
    };
    

    // Old
    // const addOnProcess = function (params, cb) {
    //     async.waterfall([
    //         async.apply(checkAddOnEnabled, params),
    //         getAddOnTime,
    //         getBlindRule,
    //         updateRebuyAndsendBroadcastForAddOn
    //     ], function (err, result) {
    //         if (!err && result) {
    //             console.log(stateOfX.serverLogType.info, "result in addOnProcess in tournament schedular " + result);
    //         }
    //         else {
    //             console.log(stateOfX.serverLogType.info, "err in addOnProcess in tournament schedular " + JSON.stringify(err));
    //         }
    //     })
    // }
    /*================================  END  ===================================*/
























}