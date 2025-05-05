import { Injectable } from "@nestjs/common";
import _ld from "lodash";
import _ from 'underscore';
import { stateOfX, popupTextManager } from "shared/common";
import { WalletService } from "apps/wallet/src/wallet.service";
import { DynamicRanksService } from './dynamicRanks.service.ts'
import { PokerDatabaseService } from "shared/common/datebase/pokerdatabase.service.js";
import { ImdbDatabaseService } from "shared/common/datebase/Imdbdatabase.service.js";




@Injectable()
export class CalculateRanksService {



    constructor(
        private readonly db: PokerDatabaseService,
        private readonly imdb: ImdbDatabaseService,
        private readonly dynamicRanks: DynamicRanksService,
        private readonly wallet: WalletService
    ) { }





    /*============================  START  =================================*/
    // New
    async getPrizeRule(args: any): Promise<any> {
        try {
            const prizeRule = await this.db.findNormalPrizeRule(args.params.table.tournamentRules.tournamentId);

            if (!prizeRule || prizeRule.length < 1) {
                return {
                    success: false,
                    isRetry: false,
                    isDisplay: false,
                    channelId: '',
                    info: popupTextManager.dbQyeryInfo.DB_ERROR_GETTING_PRIZE
                };
            }

            args.params.table.tournamentRules.prizeRule = prizeRule[0].prize;
            return args;
        } catch (err) {
            return {
                success: false,
                isRetry: false,
                isDisplay: false,
                channelId: '',
                info: popupTextManager.dbQyeryInfo.DB_ERROR_GETTING_PRIZE
            };
        }
    }


    // Old
    // const getPrizeRule = (args, cb) => {
    //     db.findNormalPrizeRule(args.params.table.tournamentRules.tournamentId, (err, prizeRule) => {
    //         if (err || prizeRule.length < 1) {
    //             cb({ success: false, isRetry: false, isDisplay: false, channelId: '', info: popupTextManager.dbQyeryInfo.DB_ERROR_GETTING_PRIZE });
    //         } else {
    //             args.params.table.tournamentRules.prizeRule = prizeRule[0].prize;
    //             cb(null, args);
    //         }
    //     })
    // }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    // New
    async findPlayersWhoGotRanks(args: any): Promise<any> {
        const filter = {
            tournamentId: args.params.table.tournamentRules.tournamentId,
            status: "Registered"
        };

        try {
            const enrolledPlayers = await this.db.countTournamentusers(filter);
            args.enrolledPlayers = enrolledPlayers;

            const usersWhoGotRank = await this.db.findTournamentRanks({ tournamentId: args.params.table.tournamentRules.tournamentId });

            args.playersWhoGotRanks = usersWhoGotRank && usersWhoGotRank.length ? usersWhoGotRank.length : 0;
            args.savedRanks = usersWhoGotRank;

            return args;
        } catch (err) {
            return {
                success: false,
                isRetry: false,
                isDisplay: false,
                channelId: '',
                info: popupTextManager.dbQyeryInfo.DB_ERROR_COUNT_ENROLLED_USERS
            };
        }
    }



    // Old
    // const findPlayersWhoGotRanks = (args, cb) => {
    //     let filter = {
    //         tournamentId: args.params.table.tournamentRules.tournamentId,
    //         status: "Registered"
    //     }
    //     db.countTournamentusers(filter, (err, enrolledPlayers) => {
    //         if (err) {
    //             cb({ success: false, isRetry: false, isDisplay: false, channelId: '', info: popupTextManager.dbQyeryInfo.DB_ERROR_COUNT_ENROLLED_USERS })
    //         } else {
    //             args.enrolledPlayers = enrolledPlayers;
    //             db.findTournamentRanks({ tournamentId: args.params.table.tournamentRules.tournamentId }, (err, usersWhoGotRank) => {
    //                 console.log("player who got rank, ", usersWhoGotRank)
    //                 args.playersWhoGotRanks = usersWhoGotRank && usersWhoGotRank.length ? usersWhoGotRank.length : 0;
    //                 args.savedRanks = usersWhoGotRank;
    //                 cb(null, args);
    //             })
    //         }
    //     })
    // }
    /*============================  END  =================================*/

    /*============================  START  =================================*/
    // New
    findPlayersWhoHaveEqualChips(args: any, playerIt: number): { equalChipsCount: number; playerIt: number } {

        let equalChipsCount = 1;

        while (
            (playerIt + 1) < args.playerWithNoChips.length &&
            args.playerWithNoChips[playerIt].onGameStartBuyIn === args.playerWithNoChips[playerIt + 1].onGameStartBuyIn
        ) {
            equalChipsCount++;
            playerIt++;
        }

        return {
            equalChipsCount,
            playerIt
        };
    }

    // // Old
    // const findPlayersWhoHaveEqualChips = function (args, playerIt) {
    //     console.log(stateOfX.serverLogType.info, "in findPlayersWhoHaveEqualChips in calculateRanks ----------" + JSON.stringify(args));
    //     // Itereate over player array and find how many have successive same onStartBuyIn Value
    //     let equalChipsCount = 1;
    //     //Checking how many player have equal ranks
    //     while ((playerIt + 1) < args.playerWithNoChips.length && args.playerWithNoChips[playerIt].onGameStartBuyIn === args.playerWithNoChips[playerIt + 1].onGameStartBuyIn) {
    //         equalChipsCount++;//contains how many onStartBuyIn are same
    //         playerIt++;
    //     }
    //     return {
    //         equalChipsCount: equalChipsCount,
    //         playerIt: playerIt
    //     };
    // }
    /*============================  END  =================================*/



    /*============================  START  =================================*/
    // New
    calculatePrizeWhoHaveEqualChips(tempFirstRank: number, tempLastRank: number, args: any): any {

        let prize = 0;
        let ticketWon = false;

        while (
            tempFirstRank <= tempLastRank &&
            tempFirstRank <= args.params.table.tournamentRules.prizeRule.length
        ) {
            const rule = args.params.table.tournamentRules.prizeRule[tempFirstRank - 1];
            prize += Math.round(rule.prizeMoney);
            if (rule.prizeType === 'ticket') {
                ticketWon = true;
            }
            tempFirstRank++;
        }

        return { prize, ticketWon };
    }

    // Old
    // const calculatePrizeWhoHaveEqualChips = function (tempFirstRank, tempLastRank, args) {
    //     console.log(stateOfX.serverLogType.info, "in calculatePrize ----------tempFirstRank,tempLastRank,prizeMoney tempFirstRank" + tempFirstRank);
    //     console.log(stateOfX.serverLogType.info, "in calculatePrize ----------tempFirstRank,tempLastRank,prizeMoney tempLastRank", tempLastRank);
    //     console.log(stateOfX.serverLogType.info, "in calculatePrize ----------tempFirstRank,tempLastRank,prizeMoney prizeMoney", args.params.table.tournamentRules.prizeRule);
    //     let prize = 0;
    //     let ticketWon = false;
    //     while (tempFirstRank <= tempLastRank && tempFirstRank <= args.params.table.tournamentRules.prizeRule.length) {
    //         prize += Math.round(args.params.table.tournamentRules.prizeRule[tempFirstRank - 1].prizeMoney);
    //         if (args.params.table.tournamentRules.prizeRule[tempFirstRank - 1].prizeType == 'ticket') {
    //             ticketWon = true;
    //         }
    //         tempFirstRank++;
    //     }
    //     return { prize: prize, ticketWon: ticketWon };
    // }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    // New
    async formatHand(param: any): Promise<any> {
        const formattedHand = {
            turn: {
                PREFLOP: [] as any[],
                FLOP: [] as any[],
                TURN: [] as any[],
                RIVER: [] as any[]
            }
        };

        let currentRound = stateOfX.round.preflop;
        const tempBlinds: any[] = [];

        for (const history of param.history) {
            if (history.type === 'broadcast') {
                if (history.data.route === 'startGame') {
                    for (const blind of tempBlinds) {
                        formattedHand.turn.PREFLOP.push(blind);
                    }
                }

                if (history.data.route === 'roundOver') {
                    if (currentRound === stateOfX.round.preflop) {
                        currentRound = stateOfX.round.flop;
                    } else if (currentRound === stateOfX.round.flop) {
                        currentRound = stateOfX.round.turn;
                    } else if (currentRound === stateOfX.round.turn) {
                        currentRound = stateOfX.round.river;
                    }
                }

                if (
                    history.data.route === 'turn' &&
                    history.data.action !== 'LEAVE' &&
                    history.data.action !== 'STANDUP' &&
                    (!!history.data.playerId || history.data.playerId !== '')
                ) {
                    const blindData = {
                        playerId: history.data.playerId,
                        playerName: history.data.playerName,
                        action: history.data.action,
                    };

                    if (currentRound === stateOfX.round.preflop) {
                        formattedHand.turn.PREFLOP.push(blindData);
                    } else if (currentRound === stateOfX.round.flop) {
                        formattedHand.turn.FLOP.push(blindData);
                    } else if (currentRound === stateOfX.round.turn) {
                        formattedHand.turn.TURN.push(blindData);
                    } else if (currentRound === stateOfX.round.river) {
                        formattedHand.turn.RIVER.push(blindData);
                    }
                }
            }
        }

        return formattedHand;
    }


    // Old
    // const formatHand = (param, cb) => {
    //     let formattedHand = { turn: { PREFLOP: [], FLOP: [], TURN: [], RIVER: [] } }, currentRound = stateOfX.round.preflop, tempBlinds = [];
    //     async.each(param.history, (history, ecb) => {
    //         if (history.type == 'broadcast') {
    //             if (history.data.route == 'startGame') {
    //                 for (let i = 0; i < tempBlinds.length; i++) {
    //                     formattedHand.turn.PREFLOP.push(tempBlinds[i]);
    //                 }
    //             }
    //             if (history.data.route == 'roundOver') {
    //                 if (currentRound == stateOfX.round.preflop) {
    //                     currentRound = stateOfX.round.flop;
    //                 } else if (currentRound == stateOfX.round.flop) {
    //                     currentRound = stateOfX.round.turn;
    //                 } else if (currentRound == stateOfX.round.turn) {
    //                     currentRound = stateOfX.round.river;
    //                 }
    //             }
    //             if (history.data.route == 'turn' && history.data.action != 'LEAVE' && history.data.action != 'STANDUP' && (!!history.data.playerId || history.data.playerId !== '')) {
    //                 let blindData = {
    //                     playerId: history.data.playerId,
    //                     playerName: history.data.playerName,
    //                     action: history.data.action,
    //                 };
    //                 if (currentRound == stateOfX.round.preflop) {
    //                     formattedHand.turn.PREFLOP.push(blindData);
    //                 }
    //                 if (currentRound == stateOfX.round.flop) {
    //                     formattedHand.turn.FLOP.push(blindData);
    //                 }
    //                 if (currentRound == stateOfX.round.turn) {
    //                     formattedHand.turn.TURN.push(blindData);
    //                 }
    //                 if (currentRound == stateOfX.round.river) {
    //                     formattedHand.turn.RIVER.push(blindData);
    //                 }
    //             }
    //         }
    //         ecb();
    //     }, err => cb(err, formattedHand)
    //     )
    // };
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    // New
    async prepareListWhoHaveEqualRanks(args: any, equalChipsCount: any, prize: any, tempLastRank: any, lastRank: any, tempPlayerIt: any, ticketWon: any): Promise<void> {

        try {
            const handHistoriesArray = await this.db.getTurnData({ channelId: args.params.table.channelId, roundId: args.params.table.roundId });


            if (!handHistoriesArray || !handHistoriesArray[0]) {
                await this.prerformRanksEqualChips(args, equalChipsCount, prize, tempLastRank, lastRank, tempPlayerIt, ticketWon);
                return;
            }

            const handData = await this.formatHand(handHistoriesArray[0]);

            if (!handData) {
                await this.prerformRanksEqualChips(args, equalChipsCount, prize, tempLastRank, lastRank, tempPlayerIt, ticketWon);
                return;
            }

            console.log("handData.turn is", handData.turn);

            let turnData = [
                ...handData.turn.PREFLOP,
                ...handData.turn.FLOP,
                ...handData.turn.TURN,
                ...handData.turn.RIVER
            ].filter((e: any) => e.action === 'ALLIN');

            console.log("turnData is", turnData);

            if (turnData.length) {
                for (const action of turnData) {
                    const foundIndex = args.playerWithNoChips.findIndex((e: any) => e.playerId === action.playerId);
                    if (foundIndex >= 0) {
                        const RankDataIs = {
                            playerId: action.playerId,
                            tournamentId: args.params.table.tournamentRules.tournamentId,
                            tournamentName: args.params.table.tournamentName,
                            channelName: args.params.table.channelName,
                            rank: tempLastRank--,
                            channelId: args.playerWithNoChips[tempPlayerIt].channelId,
                            chipsWon: args.params.table.tournamentRules.prizeRule[tempLastRank]
                                ? args.params.table.tournamentRules.prizeRule[tempLastRank].prizeMoney
                                : 0,
                            userName:
                                args.playerWithNoChips[tempPlayerIt].tournamentData?.userName ||
                                args.playerWithNoChips[tempPlayerIt].playerName,
                            isPrizeBroadcastSent: false,
                            isCollected: false,
                            createdAt: Number(new Date()),
                            ticketWon,
                            tournamentStartTime: args.params.tournament.tournamentStartTime
                        };

                        args.ranksToInsert.push(RankDataIs);
                        tempPlayerIt++;
                    }
                }
            } else {
                await this.prerformRanksEqualChips(args, equalChipsCount, prize, tempLastRank, lastRank, tempPlayerIt, ticketWon);
            }
        } catch (err) {
            await this.prerformRanksEqualChips(args, equalChipsCount, prize, tempLastRank, lastRank, tempPlayerIt, ticketWon);
        }
    }


    // Old
    // const prepareListWhoHaveEqualRanks = function (args, equalChipsCount, prize, tempLastRank, lastRank, tempPlayerIt, ticketWon) {
    //     console.log("inside prepareListWhoHaveEqualRanks", args, equalChipsCount, prize, tempLastRank, lastRank, tempPlayerIt, ticketWon)
    //     console.log("inside prepareListWhoHaveEqualRanks nochips", args.playerWithNoChips, args.params)
    //     console.log("inside prepareListWhoHaveEqualRanks tabl lastHandRoundIdlastHandRoundIde", args.params.table)
    //     logdb.getTurnData({ channelId: args.params.table.channelId, roundId: args.params.table.roundId }, (err, handHistoriesArray) => {
    //         console.log("inside getTurnData", handHistoriesArray);
    //         if (err || !handHistoriesArray || !handHistoriesArray[0]) {
    //             prerformRanksEqualChips(args, equalChipsCount, prize, tempLastRank, lastRank, tempPlayerIt, ticketWon)
    //         } else {
    //             formatHand(handHistoriesArray[0], (err, handData) => {
    //                 if (err || !handData) {
    //                     prerformRanksEqualChips(args, equalChipsCount, prize, tempLastRank, lastRank, tempPlayerIt, ticketWon)
    //                 } else {
    //                     console.log("handData.turn is", handData.turn)
    //                     let turnData = []
    //                     turnData = turnData.concat(handData.turn.PREFLOP, handData.turn.FLOP, handData.turn.TURN, handData.turn.RIVER);
    //                     turnData = turnData.filter(e => e.action == 'ALLIN');
    //                     console.log("turnData is", turnData)
    //                     if (turnData.length) {
    //                         for (let i = 0; i < turnData.length; i++) {
    //                             let foundIndex = args.playerWithNoChips.findIndex(e => e.playerId == turnData[i].playerId);
    //                             if (foundIndex >= 0) {
    //                                 let RankDataIs = {
    //                                     playerId: turnData[i].playerId,
    //                                     tournamentId: args.params.table.tournamentRules.tournamentId,
    //                                     tournamentName: args.params.table.tournamentName,
    //                                     channelName: args.params.table.channelName,
    //                                     rank: tempLastRank--,
    //                                     channelId: args.playerWithNoChips[tempPlayerIt].channelId,
    //                                     chipsWon: args.params.table.tournamentRules.prizeRule[tempLastRank] ? args.params.table.tournamentRules.prizeRule[tempLastRank].prizeMoney : 0,
    //                                     userName: args.playerWithNoChips[tempPlayerIt].tournamentData.userName || args.playerWithNoChips[tempPlayerIt].playerName,
    //                                     isPrizeBroadcastSent: false,
    //                                     isCollected: false,
    //                                     createdAt: Number(new Date()),
    //                                     ticketWon: ticketWon,
    //                                     tournamentStartTime: args.params.tournament.tournamentStartTime
    //                                 }
    //                                 console.log(stateOfX.serverLogType.info, "in rank to insert push while", RankDataIs);
    //                                 args.ranksToInsert.push(RankDataIs);
    //                                 tempPlayerIt++;
    //                             }
    //                         }
    //                     } else {
    //                         prerformRanksEqualChips(args, equalChipsCount, prize, tempLastRank, lastRank, tempPlayerIt, ticketWon)
    //                     }
    //                 }
    //             })
    //         }
    //     })
    // }
    /*============================  END  =================================*/



    /*============================  START  =================================*/
    // New
    prerformRanksEqualChips(args: any, equalChipsCount: any, prize: any, tempLastRank: any, lastRank: any, tempPlayerIt: any, ticketWon: any): void {

        let tempCount = 0;
        while (tempCount++ < equalChipsCount) {
            args.ranksToInsert.push({
                playerId: args.playerWithNoChips[tempPlayerIt].playerId,
                tournamentId: args.params.table.tournamentRules.tournamentId,
                tournamentName: args.params.table.tournamentName,
                channelId: args.playerWithNoChips[tempPlayerIt].channelId,
                channelName: args.params.table.channelName,
                chipsWon: prize,
                rank: lastRank,
                userName:
                    args.playerWithNoChips[tempPlayerIt].tournamentData?.userName ||
                    args.playerWithNoChips[tempPlayerIt].playerName,
                isPrizeBroadcastSent: false,
                isCollected: false,
                createdAt: Number(new Date()),
                ticketWon: ticketWon,
                tournamentStartTime: args.params.tournament.tournamentStartTime
            });
            tempPlayerIt++;
        }
    }


    // Old
    // let prerformRanksEqualChips = function (args, equalChipsCount, prize, tempLastRank, lastRank, tempPlayerIt, ticketWon) {
    //     console.log("in rank to insert push while", args, equalChipsCount, prize, tempLastRank, lastRank, tempPlayerIt, ticketWon);
    //     let tempCount = 0;
    //     while (tempCount++ < equalChipsCount) {
    //         args.ranksToInsert.push({
    //             playerId: args.playerWithNoChips[tempPlayerIt].playerId,
    //             tournamentId: args.params.table.tournamentRules.tournamentId,
    //             tournamentName: args.params.table.tournamentName,
    //             channelId: args.playerWithNoChips[tempPlayerIt].channelId,
    //             channelName: args.params.table.channelName,
    //             chipsWon: prize,
    //             rank: lastRank,
    //             userName: args.playerWithNoChips[tempPlayerIt].tournamentData.userName || args.playerWithNoChips[tempPlayerIt].playerName,
    //             isPrizeBroadcastSent: false,
    //             isCollected: false,
    //             createdAt: Number(new Date()),
    //             ticketWon: ticketWon,
    //             tournamentStartTime: args.params.tournament.tournamentStartTime
    //         })
    //         tempPlayerIt++;
    //     }
    // }
    /*============================  END  =================================*/


    /*============================  start  =================================*/
    // nEW
    prepareListForNormalRanks(args: any,playerIt: any,prize: any,lastRank: any): void {
    
        args.ranksToInsert.push({
            playerId: args.playerWithNoChips[playerIt].playerId,
            tournamentId: args.params.table.tournamentRules.tournamentId,
            tournamentName: args.params.table.tournamentName,
            channelName: args.params.table.channelName,
            channelId: args.playerWithNoChips[playerIt].channelId,
            chipsWon: prize,
            rank: lastRank--,
            isPrizeBroadcastSent: false,
            userName:
                args.playerWithNoChips[playerIt].tournamentData?.userName ||
                args.playerWithNoChips[playerIt].playerName,
            isCollected: false,
            createdAt: Number(new Date()),
            ticketWon: args.params.table.tournamentRules.prizeRule[0]?.prizeType === 'ticket',
            tournamentStartTime: args.params.tournament.tournamentStartTime
        });
    }
    

    // oLD
    // const prepareListForNormalRanks = function (args, playerIt, prize, lastRank) {
    //     console.log("prepareListForNormalRanksprepareListForNormalRanks", args, playerIt, prize, lastRank);
    //     args.ranksToInsert.push({
    //         playerId: args.playerWithNoChips[playerIt].playerId,
    //         tournamentId: args.params.table.tournamentRules.tournamentId,
    //         tournamentName: args.params.table.tournamentName,
    //         channelName: args.params.table.channelName,
    //         channelId: args.playerWithNoChips[playerIt].channelId,
    //         chipsWon: prize,
    //         rank: lastRank--,
    //         isPrizeBroadcastSent: false,
    //         userName: args.playerWithNoChips[playerIt].tournamentData.userName || args.playerWithNoChips[playerIt].playerName,
    //         isCollected: false,
    //         createdAt: Number(new Date()),
    //         ticketWon: (args.params.table.tournamentRules.prizeRule[0].prizeType == 'ticket') ? true : false,
    //         tournamentStartTime: args.params.tournament.tournamentStartTime
    //     })
    // }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    // New
    async pushWinner(args: any, winner: any, prize: number): Promise<void> {
    
        let refNum = 'aa';
    
        try {
            const refNumber = await this.imdb.findRefrenceNumber({
                playerId: winner[0].playerId,
                channelId: winner[0].channelId
            });
    
            if (refNumber?.length) {
                refNum = refNumber[0].referenceNumber;
            }
        } catch (err) {
            // Optional: log error if needed
        }
    
        args.ranksToInsert.push({
            playerId: winner[0].playerId,
            tournamentId: args.params.table.tournamentRules.tournamentId,
            tournamentName: args.params.table.tournamentName,
            channelName: args.params.table.channelName,
            channelId: winner[0].channelId,
            chipsWon: prize,
            rank: 1,
            isPrizeBroadcastSent: false,
            userName: winner[0].tournamentData?.userName || winner[0].playerName,
            isCollected: false,
            createdAt: Number(new Date()),
            ticketWon: args.params.table.tournamentRules.prizeRule[0]?.prizeType === 'ticket',
            tournamentStartTime: args.params.tournament.tournamentStartTime
        });
    
        let winnerBounty = 0;
        const winnerIndex = _.findIndex(args.params.table.players, { playerId: winner[0].playerId });
        if (winnerIndex >= 0) {
            winnerBounty = args.params.table.players[winnerIndex].bounty;
        }
    
        this.wallet.sendWalletBroadCast({
            action: 'bounty',
            data: {
                playerId: winner[0].playerId,
                isRealMoney: args.params.table.isRealMoney,
                tableName: args.params.table.channelName,
                chips: winnerBounty,
                referenceNumber: refNum,
                points: {
                    win: winnerBounty,
                    promo: 0,
                    deposit: 0,
                    totalBalance: winnerBounty
                }
            }
        });
    }
    

    // Old
    // const pushWinner = function (args, winner, prize) {
    //     console.trace("in pushWinner in calculateRanks is - ", args.params.table, winner);
    //     imdb.findRefrenceNumber({ playerId: winner[0].playerId, channelId: winner[0].channelId }, async function (err, refNumber) {
    //         let refNum = 'aa';
    //         if (!err && refNumber.length) {
    //             refNum = refNumber[0].referenceNumber;
    //         }
    //         args.ranksToInsert.push({
    //             playerId: winner[0].playerId,
    //             tournamentId: args.params.table.tournamentRules.tournamentId,
    //             tournamentName: args.params.table.tournamentName,
    //             channelName: args.params.table.channelName,
    //             channelId: winner[0].channelId,
    //             chipsWon: prize,
    //             rank: 1,
    //             isPrizeBroadcastSent: false,
    //             userName: winner[0].tournamentData.userName || winner[0].playerName,
    //             isCollected: false,
    //             createdAt: Number(new Date()),
    //             ticketWon: (args.params.table.tournamentRules.prizeRule[0].prizeType == 'ticket') ? true : false,
    //             tournamentStartTime: args.params.tournament.tournamentStartTime
    //         })
    //         let winnerBounty = 0;
    //         let winnerIndex = _.findIndex(args.params.table.players, { playerId: winner[0].playerId })
    //         if (winnerIndex >= 0) {
    //             winnerBounty = args.params.table.players[winnerIndex].bounty;
    //         }
    //         wallet.sendWalletBroadCast({
    //             action: 'bounty',
    //             data: {
    //                 playerId: winner[0].playerId,
    //                 isRealMoney: args.params.table.isRealMoney,
    //                 tableName: args.params.table.channelName,
    //                 chips: winnerBounty,
    //                 referenceNumber: refNum,
    //                 points: {
    //                     win: winnerBounty,
    //                     promo: 0,
    //                     deposit: 0,
    //                     totalBalance: winnerBounty,
    //                 }
    //             }
    //         })
    //     });
    // }
    /*============================  END  =================================*/

    /*============================  START  =================================*/
    // New
    async processRanks(args: any): Promise<any> {
    
        let playerIt = 0;
        let lastRank = args.enrolledPlayers - args.playersWhoGotRanks;
    
        let prize = 0;
        let ticketWon = false;
    
        while (playerIt < args.playerWithNoChips.length) {
            let equalChipsCount = 1;
    
            if (
                (playerIt + 1) < args.playerWithNoChips.length &&
                args.playerWithNoChips[playerIt].onGameStartBuyIn === args.playerWithNoChips[playerIt + 1].onGameStartBuyIn
            ) {
                const tempPlayerIt = playerIt;
                const playerHavingEqualChips = this.findPlayersWhoHaveEqualChips(args, playerIt);
                equalChipsCount = playerHavingEqualChips.equalChipsCount;
                playerIt = playerHavingEqualChips.playerIt;
    
                const tempLastRank = lastRank;
                lastRank = lastRank - equalChipsCount + 1;
                const tempFirstRank = lastRank;
    
                const prizeData = this.calculatePrizeWhoHaveEqualChips(tempFirstRank, tempLastRank, args);
                prize = Math.round(prizeData.prize / equalChipsCount);
                ticketWon = prizeData.ticketWon;
    
                await this.prepareListWhoHaveEqualRanks(args, equalChipsCount, prize, tempLastRank, lastRank, tempPlayerIt, ticketWon);
                lastRank--;
            } else {
                if (lastRank <= args.params.table.tournamentRules.prizeRule.length) {
                    prize = args.params.table.tournamentRules.prizeRule[lastRank - 1].prizeMoney;
                }
                this.prepareListForNormalRanks(args, playerIt, prize, lastRank);
                lastRank--;
            }
            playerIt++;
        }
    
        if (!args.params.table.tournamentRules.isGameRunning) {
            const winnerPrize = args.params.table.tournamentRules.prizeRule[0].prizeMoney;
            await this.pushWinner(args, args.params.table.tournamentRules.winner, winnerPrize);
        }
    
        return args;
    }
    

    // Old
    // const processRanks = function (args, cb) {
    //     console.log('------in processRanks---------', args, args.params.table.tournamentRules);
    //     let playerIt = 0;
    //     let lastRank = args.enrolledPlayers - args.playersWhoGotRanks;
    //     console.log('------lastRanklastRanklastRanklastRank---------', lastRank);
    //     let prize = 0;
    //     let ticketWon = false;
    //     while (playerIt < args.playerWithNoChips.length) {
    //         let equalChipsCount = 1;
    //         //check if same onGameStartBuyIn value
    //         if ((playerIt + 1) < args.playerWithNoChips.length && args.playerWithNoChips[playerIt].onGameStartBuyIn === args.playerWithNoChips[playerIt + 1].onGameStartBuyIn) {
    //             let tempPlayerIt = playerIt;
    //             let playerHavingEqualChips = findPlayersWhoHaveEqualChips(args, playerIt)
    //             equalChipsCount = playerHavingEqualChips.equalChipsCount;
    //             playerIt = playerHavingEqualChips.playerIt;
    //             let tempLastRank = lastRank;
    //             lastRank = lastRank - equalChipsCount + 1;//Skip worst ranks is onStartBuyIn value are same;
    //             let tempFirstRank = lastRank;
    //             //Decide prizes indexes
    //             prize = calculatePrizeWhoHaveEqualChips(tempFirstRank, tempLastRank, args).prize;
    //             prize = Math.round(prize / equalChipsCount);
    //             ticketWon = calculatePrizeWhoHaveEqualChips(tempFirstRank, tempLastRank, args).ticketWon;
    //             prepareListWhoHaveEqualRanks(args, equalChipsCount, prize, tempLastRank, lastRank, tempPlayerIt, ticketWon);
    //             // prepare ranks array
    //             lastRank--;
    //         } else {
    //             //This part execute when consecutive onStartBuy in are not same
    //             if (lastRank <= args.params.table.tournamentRules.prizeRule.length) {
    //                 prize = args.params.table.tournamentRules.prizeRule[lastRank - 1].prizeMoney;
    //             }
    //             prepareListForNormalRanks(args, playerIt, prize, lastRank);
    //             lastRank--;
    //         }
    //         playerIt++;
    //     }
    //     if (!args.params.table.tournamentRules.isGameRunning) {
    //         let winnerPrize = args.params.table.tournamentRules.prizeRule[0].prizeMoney;
    //         pushWinner(args, args.params.table.tournamentRules.winner, winnerPrize);
    //     }
    //     cb(null, args);
    // }
    /*============================  END  =================================*/

    /*============================  START  =================================*/
    // New
    updateTournamentRules(args: any): Promise<any> {
        args.params.table.tournamentRules.ranks = args.params.table.tournamentRules.ranks.concat(args.ranksToInsert);
        return args;
    }
    

    // Old
    // const updateTournamentRules = (args, cb) => {
    //     console.log("updateTournamentRulesupdateTournamentRules", args.params.table.tournamentRules.ranks, args.ranksToInsert)
    //     args.params.table.tournamentRules.ranks = args.params.table.tournamentRules.ranks.concat(args.ranksToInsert);
    //     cb(null, args);
    // }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    // New
    async updateTournamentUsers(args: any): Promise<any> {
        const tournamentId = args.params.table.tournamentRules.tournamentId;
    
        for (const player of args.ranksToInsert) {
            const playerId = player.playerId.toString();
    
            try {
                await this.db.updateTournamentUser(
                    { playerId, tournamentId: tournamentId.toString() },
                    { isActive: false }
                );
            } catch (err) {
                throw {
                    success: false,
                    isRetry: false,
                    isDisplay: false,
                    channelId: '',
                    info: popupTextManager.dbQyeryInfo.DB_ERROR_UPDATE_TOURNAMENTSTATE
                };
            }
        }
    
        return args;
    }
    

    // Old
    // const updateTournamentUsers = (args, cb) => {
    //     let tournamentId = args.params.table.tournamentRules.tournamentId;
    //     async.eachSeries(args.ranksToInsert, async (player, callback) => {
    //         db.updateTournamentUser({ playerId: player.playerId.toString(), tournamentId: tournamentId.toString() }, { isActive: false }, function (err, result) {
    //             if (err) {
    //                 cb({ success: false, isRetry: false, isDisplay: false, channelId: '', info: popupTextManager.dbQyeryInfo.DB_ERROR_UPDATE_TOURNAMENTSTATE });
    //             }
    //             else {
    //                 callback();
    //             }
    //         })
    //     }, () => {
    //         cb(null, args);
    //     })
    // }
    /*============================  END  =================================*/



    /*============================  START  =================================*/
    // New
    async insertRanksInDb(args: any): Promise<any> {
    
        if (!args.ranksToInsert.length) {
            throw { success: false, info: 'no ranks To Insert' };
        }
    
        let i = 0;
        while (i < args.ranksToInsert.length) {
            const rank = args.ranksToInsert[i];
            const foundSavedRank = args.savedRanks.find(
                e => e.playerId == rank.playerId && e.tournamentId == rank.tournamentId
            );
    
    
            if (foundSavedRank) {
                args.ranksToInsert.splice(i, 1);
            } else {
                i++;
            }
    
        }
    
    
        try {
            await this.db.insertRanks(args.ranksToInsert);
        } catch (err) {
            throw {
                success: false,
                isRetry: false,
                isDisplay: false,
                channelId: '',
                info: popupTextManager.dbQyeryInfo.DB_ERROR_INSERT_RANKS
            };
        }
    
        return args;
    }
    

    // Old
    // const insertRanksInDb = (args, cb) => {
    //     console.log("insert rank in db", args)
    //     if (!args.ranksToInsert.length) {
    //         cb({ success: false, info: 'no ranks To Insert' })
    //     } else {
    //         console.log("args savedranks", args.savedRanks)
    //         let i = 0;
    //         while (i < args.ranksToInsert.length) {
    //             const rank = args.ranksToInsert[i];
    //             let foundSavedRank = args.savedRanks.find(e => (e.playerId == rank.playerId && e.tournamentId == rank.tournamentId));
    //             console.log("foundSavedRankfoundSavedRank", foundSavedRank)
    //             if (foundSavedRank) {
    //                 args.ranksToInsert.splice(i, 1)
    //             }
    //             else {
    //                 i++;
    //             }
    //             console.log("args insertRanks inside loop", args.ranksToInsert)
    //         }
    //         console.log("args insertRanks", args.ranksToInsert)
    //         db.insertRanks(args.ranksToInsert, (err, ranks) => {
    //             if (err) {
    //                 cb({ success: false, isRetry: false, isDisplay: false, channelId: '', info: popupTextManager.dbQyeryInfo.DB_ERROR_INSERT_RANKS });
    //             } else {
    //                 cb(null, args);
    //             }
    //         })
    //     }
    // }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    // New
    async updateUserChips(args: any): Promise<any> {
    
        for (const player of args.ranksToInsert) {
            let refNum = 'aa';
    
            try {
                const refNumber = await this.imdb.findRefrenceNumber({
                    playerId: player.playerId,
                    channelId: player.channelId
                });
    
                if (refNumber && refNumber.length) {
                    refNum = refNumber[0].referenceNumber;
                }
            } catch (err) {
                // log or ignore based on your policy; refNum defaults to 'aa'
            }
    
            if (player.chipsWon > 0) {
                const dataForWallet = {
                    action: 'tourWin',
                    data: {
                        isRealMoney: !!args.params.table.isRealMoney,
                        playerId: player.playerId,
                        tableName: args.params.table.channelName,
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
    
                try {
                    const result = await this.wallet.sendWalletBroadCast(dataForWallet);
                    if (result.success) {
                        await this.db.updateTournamentRanks({
                            playerId: player.playerId,
                            tournamentId: player.tournamentId
                        });
                    }
                } catch (err) {
                    throw {
                        success: false,
                        isRetry: false,
                        isDisplay: false,
                        channelId: '',
                        info: popupTextManager.dbQyeryInfo.DB_ERROR_UPDATE_PLAYER_CHIPS
                    };
                }
            }
        }
    
        return args;
    }
    

    // Old
    // const updateUserChips = (args, cb) => {
    //     console.log('in calculateRanks in updateUserChips args is', args);
    //     // if (!args.params.table.tournamentRules.isGameRunning) {
    //     // 	args.params.table.tournamentRules.ranks.push(args.params.table.tournamentRules.winner);
    //     // }
    //     async.each(args.ranksToInsert, async (player, callback) => {
    //         imdb.findRefrenceNumber({ playerId: player.playerId, channelId: player.channelId }, async function (err, refNumber) {
    //             let refNum = 'aa';
    //             if (!err && refNumber.length) {
    //                 refNum = refNumber[0].referenceNumber;
    //             }
    //             if (player.chipsWon > 0) {
    //                 let dataForWallet = {
    //                     action: 'tourWin',
    //                     data: {
    //                         isRealMoney: args.params.table.isRealMoney ? true : false,
    //                         playerId: player.playerId,
    //                         tableName: args.params.table.channelName,
    //                         chips: player.chipsWon,
    //                         referenceNumber: refNum,
    //                         points: {
    //                             coinType: 1,
    //                             win: player.chipsWon,
    //                             deposit: 0,
    //                             promo: 0,
    //                             totalBalance: player.chipsWon
    //                         }
    //                     }
    //                 }
    //                 let result = await wallet.sendWalletBroadCast(dataForWallet);
    //                 if (result.success) {
    //                     db.updateTournamentRanks({ playerId: player.playerId, tournamentId: player.tournamentId }, function (err, res) { })
    //                 }
    //                 callback();
    //             } else {
    //                 callback();
    //             }
    //         });
    //     }, (err) => {
    //         if (err) {
    //             cb({ success: false, isRetry: false, isDisplay: false, channelId: '', info: popupTextManager.dbQyeryInfo.DB_ERROR_UPDATE_PLAYER_CHIPS });
    //         } else {
    //             cb(null, args)
    //         }
    //     })
    // }
    /*============================  END  =================================*/



    /*============================  START  =================================*/
    /**
     * this function is used to manageRanks
     * @method manageRanks
     * @param  {Object}       params  request json object
     * @param  {Function}     cb      callback function
     * @return {Object}               params/validated object
     */
    // New
    async manageRanks(params: any, playerWithNoChips: any): Promise<any> {
    
        let tempDecisionTime1 = params.table.tournamentStartTime;
        let tempDecisionTime2 = params.table.tournamentStartTime;
    
        if (params.table.lateRegistrationAllowed) {
            tempDecisionTime1 += params.table.lateRegistrationTime * 60000;
        }
    
        if (params.table.isRebuyAllowed) {
            tempDecisionTime2 += params.table.rebuyTime * 60000;
        }
    
        const timeForHoldRanks = Math.max(tempDecisionTime1, tempDecisionTime2);
        const lateRegistrationTimeOver = Number(new Date()) > timeForHoldRanks;
    
        if (!lateRegistrationTimeOver && params.table.tournamentType !== 'SITNGO') {
            const response = await this.ranksInWithLateRegistration(params, playerWithNoChips);
            return response;
        } else {
    
            const args: any = {
                params: params,
                playerWithNoChips: playerWithNoChips,
                ranksToInsert: [],
                playersWhoGotRanks: 0
            };
    
            try {
                await this.findPlayersWhoGotRanks(args);
                await this.getPrizeRule(args);
                await this.processRanks(args);
                await this.updateTournamentRules(args);
                // await updateTournamentUsers(args); // Uncomment if needed
                await this.insertRanksInDb(args);
                await this.updateUserChips(args);
    
                this.dynamicRanks.getRegisteredTournamentUsers(
                    args.params.table.tournamentRules.tournamentId,
                    args.params.table.gameVersionCount
                );
    
                return { success: true, result: args.params };
            } catch (err) {
                console.log(stateOfX.serverLogType.info, "In Error in manageRanks in calculateRanks", err);
                throw err;
            }
        }
    };
    

    // Old
    // calculateRanks.manageRanks = (params, playerWithNoChips, cb) => {
    //         console.trace("params are in manageRanksmanageRanks in calculateRanks are - ", params, playerWithNoChips);
    //         let tempDecisionTime1 = params.table.tournamentStartTime;
    //         let tempDecisionTime2 = params.table.tournamentStartTime;
    //         if (params.table.lateRegistrationAllowed) {
    //             tempDecisionTime1 += params.table.lateRegistrationTime * 60000;
    //         }
    //         if (params.table.isRebuyAllowed) {
    //             tempDecisionTime2 += params.table.rebuyTime * 60000
    //         }
    //         let timeForHoldRanks = (tempDecisionTime2 > tempDecisionTime1) ? tempDecisionTime2 : tempDecisionTime1;
    //         let lateRegistrationTimeOver = Number(new Date()) > timeForHoldRanks;
    //         if (!lateRegistrationTimeOver && params.table.tournamentType !== 'SITNGO') {
    //             ranksInWithLateRegistration(params, playerWithNoChips, (response) => {
    //                 cb(response);
    //             })
    //         } else {
    //             console.log("in else params are in manageRanks in calculateRanks are without late ", params, playerWithNoChips);
    //             let args = {
    //                 params: params,
    //                 playerWithNoChips: playerWithNoChips
    //             }
    //             args.ranksToInsert = [];
    //             args.playersWhoGotRanks = 0;
    //             async.waterfall([
    //                 async.apply(findPlayersWhoGotRanks, args),
    //                 getPrizeRule,
    //                 processRanks,
    //                 updateTournamentRules,
    //                 // updateTournamentUsers,
    //                 insertRanksInDb,
    //                 updateUserChips
    //             ], (err, result) => {
    //                 if (err) {
    //                     console.log(stateOfX.serverLogType.info, "In Error in async in manageRanksis in calculateRanks", err);
    //                     cb(err);
    //                 }
    //                 else {
    //                     console.log(stateOfX.serverLogType.info, "In success in async in manageRanks in calculateRanks is result is - " + JSON.stringify(result));
    //                     dynamicRanks.getRegisteredTournamentUsers(result.params.table.tournamentRules.tournamentId, result.params.table.gameVersionCount);
    //                     cb({ success: true, result: result.params })
    //                 }
    //             })
    //         }
    //     }
    /*============================  END  =================================*/



    /*============================  START  =================================*/
    // New
    removeDuplicate(inGameUserRank: any,eliminatedUserRanks: any): any {
    
        let unique: { playerId: string }[] = [];
    
        for (let i = 0; i < inGameUserRank.length; i++) {
            let commonUserCount = 0;
            for (let j = 0; j < eliminatedUserRanks.length; j++) {
                if (eliminatedUserRanks[j].playerId === inGameUserRank[i].playerId) {
                    commonUserCount++;
                }
            }
            if (commonUserCount === 0) {
                unique.push(inGameUserRank[i]);
            }
        }
    
        unique = unique.concat(eliminatedUserRanks);
        return unique;
    };
    

    //Old
    // const removeDuplicate = function (inGameUserRank, eliminatedUserRanks) {
    //     console.log(stateOfX.serverLogType.info, "in find unique in dynamicRanks - " + JSON.stringify(inGameUserRank), eliminatedUserRanks);
    //     let unique = [];
    //     for (let i = 0; i < inGameUserRank.length; i++) {
    //         let commonUserCount = 0;
    //         for (let j = 0; j < eliminatedUserRanks.length; j++) {
    //             if (eliminatedUserRanks[j].playerId === inGameUserRank[i].playerId) {
    //                 commonUserCount++;
    //             }
    //         }
    //         if (commonUserCount === 0) {
    //             unique.push(inGameUserRank[i])
    //         }
    //     }
    //     unique = unique.concat(eliminatedUserRanks);
    //     return unique;
    // }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    // New
    async processRanksForNormalTournament(args: any): Promise<any> {
        let playerIt = 0;
        let prize = 0;
        let ticketWon = false;
        let lastRank = args.enrolledPlayers - args.playersWhoGotRanks;
    
        while (playerIt < args.playerWithNoChips.length) {
            let equalChipsCount = 1;
    
            // Check if same onGameStartBuyIn value
            if (
                (playerIt + 1) < args.playerWithNoChips.length &&
                args.playerWithNoChips[playerIt].onGameStartBuyIn === args.playerWithNoChips[playerIt + 1].onGameStartBuyIn
            ) {
                const tempPlayerIt = playerIt;
                const playerHavingEqualChips = this.findPlayersWhoHaveEqualChips(args, playerIt);
                equalChipsCount = playerHavingEqualChips.equalChipsCount;
                playerIt = playerHavingEqualChips.playerIt;
    
                const tempLastRank = lastRank;
                lastRank = lastRank - equalChipsCount + 1; // Skip worst ranks if onStartBuyIn value is same
                const tempFirstRank = lastRank;
    
                // Decide prize indexes
                const equalPrizeResult = this.calculatePrizeWhoHaveEqualChips(tempFirstRank, tempLastRank, args);
                prize = Math.round(equalPrizeResult.prize / equalChipsCount);
                ticketWon = equalPrizeResult.ticketWon;
    
                this.prepareListWhoHaveEqualRanks(args, equalChipsCount, prize, tempLastRank, lastRank, tempPlayerIt, ticketWon);
                lastRank--;
            } else {
                // This part executes when consecutive onStartBuyIn values are not the same
                console.log("I'm in else, lastRank", lastRank, args.params.table.tournamentRules.prizeRule);
    
                if (lastRank && lastRank <= args.params.table.tournamentRules.prizeRule.length) {
                    prize = args.params.table.tournamentRules.prizeRule[lastRank - 1].prizeMoney;
                }
    
                this.prepareListForNormalRanks(args, playerIt, prize, lastRank);
                lastRank--;
            }
    
            playerIt++;
        }
    
        if (!args.params.table.tournamentRules.isGameRunning) {
            const winnerPrize = args.params.table.tournamentRules.prizeRule[0].prizeMoney;
            this.pushWinner(args, args.params.table.tournamentRules.winner, winnerPrize);
        }
    
        // Simulate original delay with setTimeout
        await new Promise<void>((resolve) => setTimeout(resolve, 3000));
    
        return args;
    };
    

    // Old
    // const processRanksForNormalTournament = (args, cb) => {
    //     console.trace('------inProcessRanksForNormalTournament-----', args.params.table);
    //     let playerIt = 0;
    //     let prize = 0;
    //     let ticketWon = false;
    //     let lastRank = args.enrolledPlayers - args.playersWhoGotRanks;
    //     // lastRank = args.enrolledPlayers;
    //     while (playerIt < args.playerWithNoChips.length) {
    //         let ranksObject = {}, equalChipsCount = 1;
    //         //check if same onGameStartBuyIn value
    //         if ((playerIt + 1) < args.playerWithNoChips.length && args.playerWithNoChips[playerIt].onGameStartBuyIn === args.playerWithNoChips[playerIt + 1].onGameStartBuyIn) {
    //             let tempPlayerIt = playerIt;
    //             let playerHavingEqualChips = findPlayersWhoHaveEqualChips(args, playerIt)
    //             equalChipsCount = playerHavingEqualChips.equalChipsCount;
    //             playerIt = playerHavingEqualChips.playerIt;
    //             let tempLastRank = lastRank;
    //             lastRank = lastRank - equalChipsCount + 1;//Skip worst ranks is onStartBuyIn value are same;
    //             let tempFirstRank = lastRank;
    //             //Decide prizes indexes
    //             prize = calculatePrizeWhoHaveEqualChips(tempFirstRank, tempLastRank, args).prize;
    //             prize = Math.round(prize / equalChipsCount);
    //             ticketWon = calculatePrizeWhoHaveEqualChips(tempFirstRank, tempLastRank, args).ticketWon;
    //             prepareListWhoHaveEqualRanks(args, equalChipsCount, prize, tempLastRank, lastRank, tempPlayerIt, ticketWon);
    //             // prepare ranks array
    //             lastRank--;
    //         } else {
    //             //This part execute when consecutive onStartBuy in are not same
    //             console.log("im in ekse , lastRank", lastRank, args.params.table.tournamentRules.prizeRule)
    //             if (lastRank && lastRank <= args.params.table.tournamentRules.prizeRule.length) {
    //                 prize = args.params.table.tournamentRules.prizeRule[lastRank - 1].prizeMoney;
    //             }
    //             prepareListForNormalRanks(args, playerIt, prize, lastRank);
    //             lastRank--;
    //         }
    //         playerIt++;
    //     }
    //     if (!args.params.table.tournamentRules.isGameRunning) {
    //         let winnerPrize = args.params.table.tournamentRules.prizeRule[0].prizeMoney;
    //         pushWinner(args, args.params.table.tournamentRules.winner, winnerPrize);
    //     }
    //     setTimeout(() => {
    //         cb(null, args);
    //     }, 3000)
    // }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    /**
     * this function is used to process ranks if late registration is not allowed
     * @method playerWithNoChips
     * @param  {Object}       params,playerWithNoChips  request json object
     * @param  {Function}     cb      callback function
     * @return {Object}               params/validated object
     */
    // New
    async ranksInWithoutLateRegistration(params: any, playerWithNoChips: any): Promise<any>  {
    
        let args = {
            params: params,
            playerWithNoChips: playerWithNoChips,
            ranksToInsert: [],
            playersWhoGotRanks: 0
        };
    
        try {
            // Using async/await with the steps in sequence
            await this.findPlayersWhoGotRanks(args);
            await this.getPrizeRule(args);
            await this.processRanksForNormalTournament(args);
            await this.updateTournamentRules(args);
            await this.updateTournamentUsers(args);
            await this.insertRanksInDb(args);
            await this.updateUserChips(args);
    
            // After all the processes
            this.dynamicRanks.getRegisteredTournamentUsers(args.params.table.tournamentRules.tournamentId, args.params.table.gameVersionCount);
    
            return { success: true, result: args.params };
        } catch (err) {
            console.log('--------got error in finding ranks without late registration----', err);
            throw err; // Rethrow the error to be handled upstream
        }
    };
    

    // Old
    // const ranksInWithoutLateRegistration = (params, playerWithNoChips, cb) => {
    //     console.log('-----finding ranksInWithoutLateRegistration----', params, playerWithNoChips);
    //     let args = {
    //         params: params,
    //         playerWithNoChips: playerWithNoChips,
    //         ranksToInsert: [],
    //         playersWhoGotRanks: 0
    //     }
    //     async.waterfall([
    //         async.apply(findPlayersWhoGotRanks, args),
    //         getPrizeRule,
    //         processRanksForNormalTournament,
    //         updateTournamentRules,
    //         updateTournamentUsers,
    //         insertRanksInDb,
    //         updateUserChips
    //     ], (err, result) => {
    //         if (err) {
    //             console.log('--------got error in finding ranks without late registration----', err);
    //             cb(err);
    //         }
    //         else {
    //             dynamicRanks.getRegisteredTournamentUsers(result.params.table.tournamentRules.tournamentId, result.params.table.gameVersionCount);
    //             cb({ success: true, result: result.params });
    //         }
    //     })
    // }
    /*============================  END  =================================*/



    /*============================  START  =================================*/
    /**
     * this function is used to processRanksForLateRegistration i.e. if late registration is allowed
     * @method playerWithNoChips
     * @param  {Object}       params,playerWithNoChips  request json object
     * @param  {Function}     cb      callback function
     * @return {Object}               params/validated object
     */
    // New
    async processRanksForLateRegistration(args: any): Promise<any> {
    
        for (let playerIt = 0; playerIt < args.playerWithNoChips.length; playerIt++) {
            args.ranksToInsert.push({
                playerId: args.playerWithNoChips[playerIt].playerId,
                tournamentId: args.params.table.tournamentRules.tournamentId,
                tournamentName: args.params.table.tournamentName,
                channelName: args.params.table.channelName,
                channelId: args.playerWithNoChips[playerIt].channelId,
                chipsWon: 0,
                rank: 0,
                ticketWon: false,
                isPrizeBroadcastSent: false,
                userName: args.playerWithNoChips[playerIt].tournamentData.userName || args.playerWithNoChips[playerIt].playerName,
                isCollected: false,
                createdAt: Number(new Date()),
                tournamentStartTime: args.params.tournament.tournamentStartTime
            });
        }
    
        // Check if the game is not running and then push the winner
        if (!args.params.table.tournamentRules.isGameRunning) {
            let winnerPrize = args.params.table.tournamentRules.prizeRule[0].prizeMoney;
            this.pushWinner(args, args.params.table.tournamentRules.winner, winnerPrize);
        }
    
        return args;
    };
    

    // Old
    // const processRanksForLateRegistration = (args, cb) => {
    //     console.log("processRanksForLateRegistrationprocessRanksForLateRegistration", args.params)
    //     for (let playerIt = 0; playerIt < args.playerWithNoChips.length; playerIt++) {
    //         args.ranksToInsert.push({
    //             playerId: args.playerWithNoChips[playerIt].playerId,
    //             tournamentId: args.params.table.tournamentRules.tournamentId,
    //             tournamentName: args.params.table.tournamentName,
    //             channelName: args.params.table.channelName,
    //             channelId: args.playerWithNoChips[playerIt].channelId,
    //             chipsWon: 0,
    //             rank: 0,
    //             ticketWon: false,
    //             isPrizeBroadcastSent: false,
    //             userName: args.playerWithNoChips[playerIt].tournamentData.userName || args.playerWithNoChips[playerIt].playerName,
    //             isCollected: false,
    //             createdAt: Number(new Date()),
    //             tournamentStartTime: args.params.tournament.tournamentStartTime
    //         })
    //     }
    //     if (!args.params.table.tournamentRules.isGameRunning) {
    //         let winnerPrize = args.params.table.tournamentRules.prizeRule[0].prizeMoney;
    //         pushWinner(args, args.params.table.tournamentRules.winner, winnerPrize);
    //     }
    //     cb(null, args);
    // }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    /**
     * this function is used to find ranks , if late registration is allowed
     * @method playerWithNoChips
     * @param  {Object}       params,playerWithNoChips  request json object
     * @param  {Function}     cb      callback function
     * @return {Object}               params/validated object
     */
    // New
    async ranksInWithLateRegistration(params: any, playerWithNoChips: any): Promise<any> {
    
        let args = {
            params: params,
            playerWithNoChips: playerWithNoChips,
            ranksToInsert: []
        };
    
        try {
            // Process ranks for late registration
            await this.processRanksForLateRegistration(args);
    
            // Update tournament rules
            await this.updateTournamentRules(args);
    
            // Update tournament users
            await this.updateTournamentUsers(args);
    
            // Insert ranks in DB
            await this.insertRanksInDb(args);
    
            // Get registered tournament users
            this.dynamicRanks.getRegisteredTournamentUsers(args.params.table.tournamentRules.tournamentId, args.params.table.gameVersionCount);
    
            return { success: true, result: args.params };
        } catch (err) {
            throw err;
        }
    };
    

    // Old
    // let ranksInWithLateRegistration = (params, playerWithNoChips, cb) => {
    //     console.log('in ranksInWithLateRegistration params and playerWithNoChips are', params, playerWithNoChips);
    //     let args = {
    //         params: params,
    //         playerWithNoChips: playerWithNoChips
    //     }
    //     args.ranksToInsert = [];
    //     async.waterfall([
    //         async.apply(processRanksForLateRegistration, args),
    //         updateTournamentRules,
    //         updateTournamentUsers,
    //         insertRanksInDb,
    //     ], (err, result) => {
    //         if (err) {
    //             cb(err);
    //         } else {
    //             dynamicRanks.getRegisteredTournamentUsers(result.params.table.tournamentRules.tournamentId, result.params.table.gameVersionCount);
    //             cb({ success: true, result: result.params })
    //         }
    //     })
    // }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    /**
     * this function is used for updating tournament room
     */
    // New
    async updateTournamentRoom(data: any): Promise<any>{
        if (!data.isGameRunning) {
            try {
                const tournament = await this.db.updateTournamentGeneralize(data.params.table.tournamentRules.tournamentId, { 
                    isTournamentRunning: false, 
                    state: stateOfX.tournamentState.finished 
                });
    
                if (!tournament) {
                    throw { success: false, isRetry: false, isDisplay: true, channelId: '', info: popupTextManager.dbQyeryInfo.DB_TOURNAMENT_ROOM_NOTFOUND, isProcessNext: false };
                } else {
                    data.tournamentRoom = tournament;
                    return data;
                }
            } catch (err) {
                throw err;
            }
        } else {
            return data;
        }
    };
    

    // Old
    // const updateTournamentRoom = function (data, cb) {
    //     if (!data.isGameRunning) {
    //         db.updateTournamentGeneralize(data.params.table.tournamentRules.tournamentId, { isTournamentRunning: false, state: stateOfX.tournamentState.finished }, (err, tournament) => {
    //             if (err || !tournament) {
    //                 cb({ success: false, isRetry: false, isDisplay: true, channelId: '', info: popupTextManager.dbQyeryInfo.DB_TOURNAMENT_ROOM_NOTFOUND, isProcessNext: false });
    //             } else {
    //                 data.tournamentRoom = tournament;
    //                 cb(null, data);
    //             }
    //         });
    //     } else {
    //         cb(null, data);
    //     }
    // }
    /*============================  END  =================================*/



    /*============================  START  =================================*/
    /**
     * this function is used for getting tournament room
     */
    // New
    async getTournamentRoom(data: any): Promise<any> {
        try {
            const tournament = await this.db.getTournamentRoom(data.params.table.tournamentRules.tournamentId);

            if (!tournament) {
                throw {
                    success: false,
                    isRetry: false,
                    isDisplay: true,
                    channelId: '',
                    info: popupTextManager.dbQyeryInfo.DB_TOURNAMENT_ROOM_NOTFOUND,
                    isProcessNext: false
                };
            }

            data.tournamentRoom = tournament;

            if (!tournament.isTournamentRunning) {
                data.playerWithNoChips = data.params.table.players;
                throw {
                    success: false,
                    isRetry: false,
                    isDisplay: true,
                    channelId: '',
                    info: popupTextManager.dbQyeryInfo.DB_TOURNAMENT_NOT_RUNING,
                    isProcessNext: true,
                    playerWithNoChips: data.playerWithNoChips
                };
            }

            return data;
        } catch (err) {
            throw err;
        }
    };


    // Old
    // const getTournamentRoom = function (data, cb) {
    //     db.getTournamentRoom(data.params.table.tournamentRules.tournamentId, (err, tournament) => {
    //         if (err || !tournament) {
    //             cb({ success: false, isRetry: false, isDisplay: true, channelId: '', info: popupTextManager.dbQyeryInfo.DB_TOURNAMENT_ROOM_NOTFOUND, isProcessNext: false });
    //         } else {
    //             data.tournamentRoom = tournament;
    //             if (!tournament.isTournamentRunning) {
    //                 data.playerWithNoChips = data.params.table.players; // calculate all player rank;
    //                 cb({ success: false, isRetry: false, isDisplay: true, channelId: '', info: popupTextManager.dbQyeryInfo.DB_TOURNAMENT_NOT_RUNING, isProcessNext: true, playerWithNoChips: data.playerWithNoChips })
    //             } else {
    //                 cb(null, data);
    //             }
    //         }
    //     });
    // }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    // New
    async countEnrolledPlayers(data: any): Promise<any> {
        try {
            const enrolledPlayers = await this.db.countTournamentusers({
                status: "Registered",
                tournamentId: data.params.table.tournamentRules.tournamentId
            });
            data.enrolledPlayers = enrolledPlayers;
    
            const countInActivePlayers = await this.db.countTournamentusers({
                status: "Registered",
                tournamentId: data.params.table.tournamentRules.tournamentId
            });
    
            data.inActivePlayers = data.enrolledPlayers - countInActivePlayers;
    
            return data;
        } catch (err) {
            if (!data.enrolledPlayers) {
                throw {
                    success: false,
                    isRetry: false,
                    isDisplay: true,
                    channelId: '',
                    info: popupTextManager.dbQyeryInfo.DB_ERROR_GETTING_ENROLLED_PLAYERS_TOURNAMENT,
                    isProcessNext: false
                };
            } else {
                throw {
                    success: false,
                    isRetry: false,
                    isDisplay: true,
                    channelId: '',
                    info: popupTextManager.dbQyeryInfo.DB_ERROR_GETTING_INACTIVE_PLAYERS_TOURNAMENT,
                    isProcessNext: false
                };
            }
        }
    };
    

    // Old
    // const countEnrolledPlayers = function (data, cb) {
    //     db.countTournamentusers({ status: "Registered", tournamentId: data.params.table.tournamentRules.tournamentId }, (err, count) => {
    //         if (!err) {
    //             data.enrolledPlayers = count;
    //             db.countTournamentusers({ status: "Registered", tournamentId: data.params.table.tournamentRules.tournamentId }, (err, countInActivePlayers) => {
    //                 if (!err) {
    //                     data.inActivePlayers = data.enrolledPlayers - countInActivePlayers;
    //                     cb(null, data);
    //                 } else {
    //                     cb({ success: false, isRetry: false, isDisplay: true, channelId: '', info: popupTextManager.dbQyeryInfo.DB_ERROR_GETTING_INACTIVE_PLAYERS_TOURNAMENT, isProcessNext: false })
    //                 }
    //             })
    //             cb(null, data);
    //         } else {
    //             cb({ success: false, isRetry: false, isDisplay: true, channelId: '', info: popupTextManager.dbQyeryInfo.DB_ERROR_GETTING_ENROLLED_PLAYERS_TOURNAMENT, isProcessNext: false })
    //         }
    //     })
    // }
    /*============================  END  =================================*/

    /*============================  START  =================================*/
    // get prize rules from satellite
    // New
    async getPrizeRuleForSatellite(data: any): Promise<any> {
        try {
            const prizes = await this.db.findNormalPrizeRule(data.params.table.tournamentRules.tournamentId);
            data.prizeRule = prizes[0].prize;
            data.prizeCount = prizes[0].prize.length;
            return data;
        } catch (err) {
            throw {
                success: false,
                isRetry: false,
                isDisplay: true,
                channelId: '',
                info: popupTextManager.dbQyeryInfo.DB_ERROR_GETTING_ENROLLED_PLAYERS_TOURNAMENT,
                isProcessNext: false
            };
        }
    };
    

    // Old
    // const getPrizeRuleForSatellite = function (data, cb) {
    //     db.findNormalPrizeRule(data.params.table.tournamentRules.tournamentId, (err, prizes) => {
    //         if (!err) {
    //             data.prizeRule = prizes[0].prize;
    //             data.prizeCount = prizes[0].prize.length;
    //             cb(null, data);
    //         } else {
    //             cb({ success: false, isRetry: false, isDisplay: true, channelId: '', info: popupTextManager.dbQyeryInfo.DB_ERROR_GETTING_ENROLLED_PLAYERS_TOURNAMENT, isProcessNext: false })
    //         }
    //     })
    // }
    /*============================  END  =================================*/

    /*============================  START  =================================*/
    // get getAllActivePlayers
    // nEW
    async getAllActivePlayers(data: any): Promise<any> {
        try {
            const channels = await this.imdb.findChannels({ tournamentId: data.params.table.tournamentRules.tournamentId });
    
            let playingPlayers = 0;
            for (let i = 0; i < channels.length; i++) {
                playingPlayers += channels[i].players.length;
            }
    
            playingPlayers -= data.playerWithNoChips.length;
            data.playingPlayers = playingPlayers;
    
            return data;
        } catch (err) {
            throw {
                success: false,
                isRetry: false,
                isDisplay: false,
                channelId: '',
                info: popupTextManager.dbQyeryInfo.DB_ERROR_GETTING_TOURNAMENT_CHANNELS,
                isProcessNext: false
            };
        }
    };
    
    // oLD
    // var getAllActivePlayers = function (data, cb) {
    //     imdb.findChannels({ tournamentId: data.params.table.tournamentRules.tournamentId }, (err, channels) => {
    //         if (err) {
    //             cb({ success: false, isRetry: false, isDisplay: false, channelId: '', info: popupTextManager.dbQyeryInfo.DB_ERROR_GETTING_TOURNAMENT_CHANNELS, isProcessNext: false });
    //             //     cb({success: false, info: "Error in getting tournament channels",isProcessNext: false});
    //         } else {
    //             let playingPlayers = 0;
    //             for (let i = 0; i < channels.length; i++) {
    //                 playingPlayers += channels[i].players.length;
    //             }
    //             playingPlayers -= data.playerWithNoChips.length;
    //             data.playingPlayers = playingPlayers;
    //             cb(null, data);
    //         }
    //     })
    // }
    /*============================  END  =================================*/

    /*============================  START  =================================*/
    // New
    decideTournamentStatus(data: any): Promise<any> {
        if (data.playingPlayers < data.prizeCount) {
            data.isGameRunning = false;
            data.params.table.isTournamentRunning = false;
            data.playerWithNoChips = data.params.table.players; // calculate all players ranks
        } else {
            data.isGameRunning = true;
        }
    
        return data;
    };
    

    // Old
    // const decideTournamentStatus = function (data, cb) {
    //     if (data.playingPlayers < data.prizeCount) {
    //         data.isGameRunning = false;
    //         data.params.table.isTournamentRunning = false;
    //         data.playerWithNoChips = data.params.table.players; // calculate all players ranks
    //     } else {
    //         data.isGameRunning = true;
    //     }
    //     cb(null, data);
    // }
    /*============================  END  =================================*/



    /*============================  START  =================================*/
    // New
    async processRanksForSatellite(params: any, playerWithNoChips: any): Promise<any> {
    
        let data: any = {
            params: params,
            playerWithNoChips: playerWithNoChips
        };
    
        try {
            data = await this.getTournamentRoom(data);
            data = await this.countEnrolledPlayers(data);
            data = await this.getPrizeRuleForSatellite(data);
            data = await this.getAllActivePlayers(data);
            data = await this.decideTournamentStatus(data);
            data = await this.updateTournamentRoom(data);
    
            return {
                success: true,
                params: data.params,
                isGameRunning: data.isGameRunning,
                isGameEndFromBefore: false,
                prizeRule: data.prizeRule,
                enrolledPlayers: data.enrolledPlayers,
                playingPlayers: data.playingPlayers,
                playersWhoGotRanks: data.inActivePlayers,
                playerWithNoChips: data.playerWithNoChips
            };
        } catch (err: any) {
            console.log("inside processRanksForSatellite response", err);
    
            if (err?.isProcessNext) {
                return {
                    success: true,
                    params: params,
                    isGameRunning: data.isGameRunning,
                    isGameEndFromBefore: true,
                    playerWithNoChips: err.playerWithNoChips
                };
            } else {
                throw err;
            }
        }
    };
    

    // Old
    // const processRanksForSatellite = function (params, playerWithNoChips, cb) {
    //     console.trace("inside procesRankForSatellite", params, playerWithNoChips)
    //     let data = {
    //         params: params,
    //         playerWithNoChips: playerWithNoChips
    //     }
    //     async.waterfall([
    //         async.apply(getTournamentRoom, data),
    //         countEnrolledPlayers,
    //         getPrizeRuleForSatellite,
    //         getAllActivePlayers,
    //         decideTournamentStatus,
    //         updateTournamentRoom
    //     ], (err, response) => {
    //         console.log("inside processRanksForSatellite response", err, response);
    //         if (err) {
    //             if (err.isProcessNext) {
    //                 cb({ success: true, params: params, isGameRunning: data.isGameRunning, isGameEndFromBefore: true, playerWithNoChips: err.playerWithNoChips })
    //             } else {
    //                 cb(err);
    //             }
    //         } else {
    //             cb({
    //                 success: true,
    //                 params: response.params,
    //                 isGameRunning: response.isGameRunning,
    //                 isGameEndFromBefore: false,
    //                 prizeRule: response.prizeRule,
    //                 enrolledPlayers: response.enrolledPlayers,
    //                 playingPlayers: response.playingPlayers,
    //                 playersWhoGotRanks: response.inActivePlayers,
    //                 playerWithNoChips: response.playerWithNoChips
    //             })
    //         }
    //     })
    // }
    /*============================  END  =================================*/

    /*============================  START  =================================*/
    // New
    preparePrizeListInSatellite(table: any): any {
        const prizeArray: any[] = [];
    
        for (let playerIt = 0; playerIt < table.players.length; playerIt++) {
            prizeArray.push({
                playerId: table.players[playerIt].playerId,
                tournamentId: table.tournamentRules.tournamentId,
                tournamentName: table.tournamentName,
                channelId: table.channelId,
                chipsWon: 0,
                ticketsWon: 1,
                isPrizeBroadcastSent: false,
                userName: table.players[playerIt].tournamentData?.userName || table.players[playerIt].playerName,
                isCollected: false,
                createdAt: Date.now()
            });
        }
    
        return prizeArray;
    };
    

    // Old
    // const preparePrizeListInSatellite = function (table) {
    //     let prizeArray = [];
    //     for (let playerIt = 0; playerIt < table.players.length; playerIt++) {
    //         prizeArray.push({
    //             playerId: table.players[playerIt].playerId,
    //             tournamentId: table.tournamentRules.tournamentId,
    //             tournamentName: table.tournamentName,
    //             channelId: table.channelId,
    //             chipsWon: 0,
    //             ticketsWon: 1,
    //             isPrizeBroadcastSent: false,
    //             userName: table.players[playerIt].tournamentData.userName || table.players[playerIt].playerName,
    //             isCollected: false,
    //             createdAt: Number(new Date())
    //         })
    //     }
    //     return prizeArray;
    // }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    // New
    decideRankBasedOnDealer(tempPlayers: any,currentRank: any,table: any,prizeRule: any): any {
        
        let ranks: any[] = [];
        let playersBasedOnDealer = table.players;
    
        let playersBeforeDealer = playersBasedOnDealer.slice(0, table.dealerIndex + 1);
        let playerAfterDealer = playersBasedOnDealer.slice(table.dealerIndex + 1);
        playerAfterDealer = playerAfterDealer.concat(playersBeforeDealer);
        playersBasedOnDealer = playerAfterDealer;
    
        // Insert indexForRank in tempPlayers
        for (let i = 0; i < tempPlayers.length; i++) {
            for (let j = 0; j < playersBasedOnDealer.length; j++) {
                if (tempPlayers[i].playerId === playersBasedOnDealer[j].playerId) {
                    tempPlayers[i].indexForRank = j;
                    break;
                }
            }
        }
    
        tempPlayers = _.sortBy(tempPlayers, "indexForRank");
    
        // Assign ranks
        for (let i = 0; i < tempPlayers.length; i++) {
            let rank = currentRank--;
            ranks.push({
                playerId: tempPlayers[i].playerId,
                tournamentId: table.tournamentRules.tournamentId,
                tournamentName: table.tournamentName,
                gameVersionCount: table.gameVersionCount,
                channelId: table.channelId,
                chipsWon: (prizeRule[rank - 1] && prizeRule[rank - 1].prizeType === "chips") ? prizeRule[rank - 1].prizeMoney : 0,
                rank: rank,
                ticketsWon: (prizeRule[rank - 1] && prizeRule[rank - 1].prizeType === "ticket") ? 1 : -1,
                isPrizeBroadcastSent: false,
                userName: tempPlayers[i].tournamentData.userName || tempPlayers[i].playerName,
                isCollected: false,
                createdAt: Date.now()
            });
        }
    
        return ranks;
    };
    

    // Old
    // const decideRankBasedOnDealer = function (tempPlayers, currentRank, table, prizeRule) {
    //     let ranks = [];
    //     let playersBasedOnDealer = table.players;
    //     let playersBeforeDealer = playersBasedOnDealer.slice(0, table.dealerIndex + 1);
    //     let playerAfterDealer = playersBasedOnDealer.slice(table.dealerIndex + 1);
    //     playerAfterDealer = playerAfterDealer.concat(playersBeforeDealer);
    //     // playersBeforeDealer.concat(playersBasedOnDealer);
    //     playersBasedOnDealer = playerAfterDealer;
    //     // insert indexForRank is in tempPlayers
    //     for (let i = 0; i < tempPlayers.length; i++) {
    //         for (let j = 0; j < playersBasedOnDealer.length; j++) {
    //             if (tempPlayers[i].playerId === playersBasedOnDealer[j].playerId) {
    //                 tempPlayers[i].indexForRank = j;
    //                 break;
    //             }
    //         }
    //     }
    //     tempPlayers = _.sortBy(tempPlayers, "indexForRank");
    //     for (let i = 0; i < tempPlayers.length; i++) {
    //         let rank = currentRank--;
    //         ranks.push({
    //             playerId: tempPlayers[i].playerId,
    //             tournamentId: table.tournamentRules.tournamentId,
    //             tournamentName: table.tournamentName,
    //             gameVersionCount: table.gameVersionCount,
    //             channelId: table.channelId,
    //             chipsWon: (!!prizeRule[rank - 1] && prizeRule[rank - 1].prizeType === "chips") ? prizeRule[rank - 1].prizeMoney : 0,
    //             rank: rank,
    //             ticketsWon: (!!prizeRule[rank - 1] && prizeRule[rank - 1].prizeType === "ticket") ? 1 : -1,
    //             isPrizeBroadcastSent: false,
    //             userName: tempPlayers[i].tournamentData.userName || tempPlayers[i].playerName,
    //             isCollected: false,
    //             createdAt: Number(new Date())
    //         })
    //     }
    //     return ranks;
    // }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    // New
    calculateRanksForFirstTimeInSatellite(data: any): any {
        
        let outOfMoneyPlayers: any[] = [];
        let activePlayers: any[] = [];
        
        for (let i = 0; i < data.playerWithNoChips.length; i++) {
            if (data.playerWithNoChips[i].state === stateOfX.playerState.outOfMoney) {
                outOfMoneyPlayers.push(data.playerWithNoChips[i]);
            } else {
                activePlayers.push(data.playerWithNoChips[i]);
            }
        }
    
        outOfMoneyPlayers = _.sortBy(outOfMoneyPlayers, "onGameStartBuyIn");
        activePlayers = _.sortBy(activePlayers, "onGameStartBuyIn");
    
        let currentRank = data.playersWhoGotRanks;
        let calculatedRanks: any[] = [];
    
        for (let k = 0; k < 2; k++) {
            if (k === 0) {
                data.playerWithNoChips = outOfMoneyPlayers;
            }
            if (k === 1) {
                data.playerWithNoChips = activePlayers;
            }
    
            if (data.playerWithNoChips.length > 1) {
                for (let i = 0; i < data.playerWithNoChips.length;) {
                    if (i < data.playerWithNoChips.length - 1 && data.playerWithNoChips[i].onGameStartBuyIn === data.playerWithNoChips[i + 1].onGameStartBuyIn) {
                        let tempPlayers: any[] = [];
                        while (data.playerWithNoChips[i].onGameStartBuyIn === data.playerWithNoChips[i + 1].onGameStartBuyIn) {
                            tempPlayers.push(data.playerWithNoChips[i]);
                            i++;
                            if (i >= data.playerWithNoChips.length - 1) {
                                tempPlayers.push(data.playerWithNoChips[i]);
                                i++;
                                break;
                            }
                        }
                        calculatedRanks = calculatedRanks.concat(this.decideRankBasedOnDealer(tempPlayers, currentRank, data.params.table, data.prizeRule));
                        currentRank -= tempPlayers.length;
                    } else {
                        let rank = currentRank--;
                        calculatedRanks.push({
                            playerId: data.playerWithNoChips[i].playerId,
                            tournamentId: data.params.table.tournamentRules.tournamentId,
                            tournamentName: data.params.table.tournamentName,
                            gameVersionCount: data.params.table.gameVersionCount,
                            channelId: data.params.table.channelId,
                            chipsWon: (data.prizeRule[rank - 1] && data.prizeRule[rank - 1].prizeType === "chips") ? data.prizeRule[rank - 1].prizeMoney : 0,
                            rank: rank,
                            ticketsWon: (data.prizeRule[rank - 1] && data.prizeRule[rank - 1].prizeType === "ticket") ? 1 : -1,
                            isPrizeBroadcastSent: false,
                            userName: data.playerWithNoChips[i].tournamentData.userName || data.playerWithNoChips[i].playerName,
                            isCollected: false,
                            createdAt: Date.now()
                        });
                        i++;
                    }
                }
            } else {
                let rank = currentRank--;
                calculatedRanks.push({
                    playerId: data.playerWithNoChips[0].playerId,
                    tournamentId: data.params.table.tournamentRules.tournamentId,
                    tournamentName: data.params.table.tournamentName,
                    gameVersionCount: data.params.table.gameVersionCount,
                    channelId: data.params.table.channelId,
                    chipsWon: (data.prizeRule[rank - 1] && data.prizeRule[rank - 1].prizeType === "chips") ? data.prizeRule[rank - 1].prizeMoney : 0,
                    rank: rank,
                    ticketsWon: (data.prizeRule[rank - 1] && data.prizeRule[rank - 1].prizeType === "ticket") ? 1 : -1,
                    isPrizeBroadcastSent: false,
                    userName: data.playerWithNoChips[0].tournamentData.userName || data.playerWithNoChips[0].playerName,
                    isCollected: false,
                    createdAt: Date.now()
                });
            }
        }
    
        data.playerWithNoChips = outOfMoneyPlayers.concat(activePlayers);
        return calculatedRanks;
    };
    

    // Old
    // const calculateRanksForFirstTimeInSatellite = function (data) {
    //     let outOfMoneyPlayers = [];
    //     let activePlayers = [];
    //     for (let i = 0; i < data.playerWithNoChips.length; i++) {
    //         if (data.playerWithNoChips[i].state === stateOfX.playerState.outOfMoney) {
    //             outOfMoneyPlayers.push(data.playerWithNoChips[i]);
    //         } else {
    //             activePlayers.push(data.playerWithNoChips[i]);
    //         }
    //     }
    //     outOfMoneyPlayers = _.sortBy(outOfMoneyPlayers, "onGameStartBuyIn");
    //     activePlayers = _.sortBy(activePlayers, "onGameStartBuyIn");
    //     let currentRank = data.playersWhoGotRanks;
    //     let calculatedRanks = [];
    //     for (let k = 0; k < 2; k++) {
    //         if (k == 0) {
    //             data.playerWithNoChips = outOfMoneyPlayers;
    //         }
    //         if (k == 1) {
    //             data.playerWithNoChips = activePlayers;
    //         }
    //         if (data.playerWithNoChips.length > 1) {
    //             for (let i = 0; i < data.playerWithNoChips.length;) {
    //                 if (i < data.playerWithNoChips.length - 1 && data.playerWithNoChips[i].onGameStartBuyIn === data.playerWithNoChips[i + 1].onGameStartBuyIn) {
    //                     let tempPlayers = [];
    //                     while (data.playerWithNoChips[i].onGameStartBuyIn === data.playerWithNoChips[i + 1].onGameStartBuyIn) {
    //                         tempPlayers.push(data.playerWithNoChips[i]);
    //                         i++;
    //                         if (i >= data.playerWithNoChips.length - 1) {
    //                             tempPlayers.push(data.playerWithNoChips[i]);
    //                             i++;
    //                             break;
    //                         }
    //                     }
    //                     calculatedRanks = calculatedRanks.concat(decideRankBasedOnDealer(tempPlayers, currentRank, data.params.table, data.prizeRule));
    //                     currentRank -= tempPlayers.length;
    //                 } else {
    //                     let rank = currentRank--;
    //                     calculatedRanks.push({
    //                         playerId: data.playerWithNoChips[i].playerId,
    //                         tournamentId: data.params.table.tournamentRules.tournamentId,
    //                         tournamentName: data.params.table.tournamentName,
    //                         gameVersionCount: data.params.table.gameVersionCount,
    //                         channelId: data.params.table.channelId,
    //                         chipsWon: (!!data.prizeRule[rank - 1] && data.prizeRule[rank - 1].prizeType === "chips") ? data.prizeRule[rank - 1].prizeMoney : 0,
    //                         rank: rank,
    //                         ticketsWon: (!!data.prizeRule[rank - 1] && data.prizeRule[rank - 1].prizeType === "ticket") ? 1 : -1,
    //                         isPrizeBroadcastSent: false,
    //                         userName: data.playerWithNoChips[i].tournamentData.userName || data.playerWithNoChips[i].playerName,
    //                         isCollected: false,
    //                         createdAt: Number(new Date())
    //                     })
    //                     i++;
    //                 }
    //             }
    //         } else {
    //             let rank = currentRank--;
    //             calculatedRanks.push({
    //                 playerId: data.playerWithNoChips[0].playerId,
    //                 tournamentId: data.params.table.tournamentRules.tournamentId,
    //                 tournamentName: data.params.table.tournamentName,
    //                 gameVersionCount: data.params.table.gameVersionCount,
    //                 channelId: data.params.table.channelId,
    //                 chipsWon: (!!data.prizeRule[rank - 1] && data.prizeRule[rank - 1].prizeType === "chips") ? data.prizeRule[rank - 1].prizeMoney : 0,
    //                 rank: rank,
    //                 ticketsWon: (!!data.prizeRule[rank - 1] && data.prizeRule[rank - 1].prizeType === "ticket") ? 1 : -1,
    //                 isPrizeBroadcastSent: false,
    //                 userName: data.playerWithNoChips[0].tournamentData.userName || data.playerWithNoChips[0].playerName,
    //                 isCollected: false,
    //                 createdAt: Number(new Date())
    //             })
    //         }
    //     }
    //     data.playerWithNoChips = outOfMoneyPlayers.concat(activePlayers);
    //     return calculatedRanks;
    // }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    // New
    splitArrayForTicketAndChips(prizeArray: any, prizeRule:any): any {
        let i = 0;
        if (prizeArray[i].rank === prizeRule.length) {
            prizeArray[i].chipsWon = prizeRule[prizeArray[i].rank - 1].prizeMoney;
            i++;
        }
    
        for (; i < prizeArray.length; i++) {
            prizeArray[i].ticketsWon = 1;
        }
        
        return prizeArray;
    };
    

    // Old
    // const splitArrayForTicketAndChips = function (prizeArray, prizeRule) {
    //     let i = 0;
    //     if (prizeArray[i].rank === prizeRule.length) {
    //         prizeArray[i].chipsWon = prizeRule[rank - 1].prizeMoney;
    //         i++;
    //     }
    //     // tempPrize[i-1].chipsWon = prizeRule[i-1].prizeMoney;
    //     for (; i < prizeArray.length; i++) {
    //         prizeArray[i].ticketsWon = 1;
    //         // tempPrize.push(prizeArray[i]);
    //     }
    //     return prizeArray;
    // }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    // New
    decideRankInSatellite(data: any) {
        
        let prizeArray;
        
        if (data.isGameEndFromBefore) {
            prizeArray = this.preparePrizeListInSatellite(data.params.table);
            data.params.table.tournamentRules.ranks = data.params.table.tournamentRules.ranks.concat(prizeArray);
        } else {
            prizeArray = this.calculateRanksForFirstTimeInSatellite(data);
            data.params.table.tournamentRules.ranks = data.params.table.tournamentRules.ranks.concat(prizeArray);
        }
    };
    

    // Old
    // const decideRankInSatellite = function (data, cb) {
    //     console.log("inside decideRankInSatellitedecideRankInSatellite", data)
    //     console.log("inside decideRankInSatellite ranks are", data.params.table.tournamentRules)
    //     let prizeArray;
    //     if (data.isGameEndFromBefore) {
    //         prizeArray = preparePrizeListInSatellite(data.params.table);
    //         data.params.table.tournamentRules.ranks = data.params.table.tournamentRules.ranks.concat(prizeArray);
    //     } else {
    //         prizeArray = calculateRanksForFirstTimeInSatellite(data);
    //         data.params.table.tournamentRules.ranks = data.params.table.tournamentRules.ranks.concat(prizeArray);
    //     }
    //     cb(data);
    // }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    /**
     * this function is used to manageRanksForNormalTournament
     * @method manageRanksForNormalTournament
     * @param  {Object}       params  request json object
     * @param  {Function}     cb      callback function
     * @return {Object}               params/validated object
     */
    // New
    manageRanksForNormalTournament(params: any, playerWithNoChips: any) {
        
        let tempDecisionTime1 = params.table.tournamentStartTime;
        let tempDecisionTime2 = params.table.tournamentStartTime;

        if (params.table.lateRegistrationAllowed) {
            tempDecisionTime1 += params.table.lateRegistrationTime * 60000;
        }

        if (params.table.isRebuyAllowed) {
            tempDecisionTime2 += params.table.rebuyTime * 60000;
        }

        let timeForHoldRanks = Math.max(tempDecisionTime1, tempDecisionTime2);
        let lateRegistrationTimeOver = Date.now() > timeForHoldRanks;

        if (!lateRegistrationTimeOver && params.table.tournamentType !== 'SITNGO') {
            const response = this.ranksInWithLateRegistration(params, playerWithNoChips);
            return response;
        } else {
            const response = this.ranksInWithoutLateRegistration(params, playerWithNoChips);
            return response;
        }
    };

    // Old
    // calculateRanks.manageRanksForNormalTournament = (params, playerWithNoChips, cb) => {
    //     console.trace("params are in manageRanksForNormalTournament in calculateRanks are - ", params, playerWithNoChips, params.table.tournamentType);
    //     let tempDecisionTime1 = params.table.tournamentStartTime;
    //     let tempDecisionTime2 = params.table.tournamentStartTime;
    //     if (params.table.lateRegistrationAllowed) {
    //         tempDecisionTime1 += params.table.lateRegistrationTime * 60000;
    //     }
    //     if (params.table.isRebuyAllowed) {
    //         tempDecisionTime2 += params.table.rebuyTime * 60000
    //     }
    //     let timeForHoldRanks = (tempDecisionTime2 > tempDecisionTime1) ? tempDecisionTime2 : tempDecisionTime1;
    //     let lateRegistrationTimeOver = Number(new Date()) > timeForHoldRanks;
    //     if (!lateRegistrationTimeOver && params.table.tournamentType !== 'SITNGO') {
    //         ranksInWithLateRegistration(params, playerWithNoChips, (response) => {
    //             cb(response);
    //         })
    //     } else {
    //         // if (params.table.tournamentType.toUpperCase() === stateOfX.tournamentType.satelite) { // If tournament is satellite
    //         // 	processRanksForSatellite(params, playerWithNoChips, function (processRanksForSatelliteResponse) {
    //         // 		console.log("inside calculateRanks", processRanksForSatelliteResponse)
    //         // 		if (processRanksForSatelliteResponse.success) {
    //         // 			if (processRanksForSatelliteResponse.isGameRunning) { // If game is in running mode call normal rank rule
    //         // 				ranksInWithoutLateRegistration(params, playerWithNoChips, (response) => {
    //         // 					cb(response);
    //         // 				});
    //         // 			} else {
    //         // 				let data = {
    //         // 					params: processRanksForSatelliteResponse.params,
    //         // 					playerWithNoChips: processRanksForSatelliteResponse.playerWithNoChips,
    //         // 					isGameEndFromBefore: processRanksForSatelliteResponse.isGameEndFromBefore,
    //         // 					prizeRule: processRanksForSatelliteResponse.prizeRule || [],
    //         // 					enrolledPlayers: processRanksForSatelliteResponse.enrolledPlayers,
    //         // 					playingPlayers: processRanksForSatelliteResponse.playingPlayers || 0,
    //         // 					playersWhoGotRanks: processRanksForSatelliteResponse.playersWhoGotRanks
    //         // 				}
    //         // 				decideRankInSatellite(data, (decideRankInSatelliteResponse) => {
    //         // 					cb({ success: true, result: decideRankInSatelliteResponse.params });
    //         // 				})
    //         // 			}
    //         // 		} else {
    //         // 			cb(processRanksForSatelliteResponse);
    //         // 		}
    //         // 	});
    //         // } 
    //         // else {
    //         ranksInWithoutLateRegistration(params, playerWithNoChips, (response) => {
    //             cb(response);
    //         });
    //         // }
    //     }

    // }
    /*============================  END  =================================*/













}