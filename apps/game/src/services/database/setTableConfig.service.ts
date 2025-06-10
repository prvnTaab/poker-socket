import { Injectable } from "@nestjs/common";
import _ld from "lodash";
import _ from 'underscore';
import { AdjustActiveIndexService } from "./adjustActiveIndex.service";
import { TableManagerService } from "./tableManager.service";
import { PokerDatabaseService } from "shared/common/datebase/pokerdatabase.service";
import { stateOfX, popupTextManager, systemConfig } from "shared/common";
import { validateKeySets } from "shared/common/utils/activity";


@Injectable()
export class SetTableConfigService {


    constructor(
        private readonly adjustIndex: AdjustActiveIndexService,
        private readonly tableManager: TableManagerService,
        private readonly tableConfigManager: TableManagerService,
        private readonly db: PokerDatabaseService
    ) { }


    /*================================  START  ============================*/
    // ### Set Game state as Running
    // > Game state, Occupied seat count, Vacant seat count and Round Id
    // New
    async updateTableEntitiesOnGameStart(params: any): Promise<any> {

        params.table.state = stateOfX.gameState.running;
        params.table.stateInternal = stateOfX.gameState.running;
        params.table.pot = [];
        params.table.occupiedSeats = params.table.players.length;
        params.table.vacantSeats = params.table.maxPlayers - params.table.players.length;

        const shouldInclude = (player: any) => (
            player.state === stateOfX.playerState.playing ||
            (player.state === stateOfX.playerState.onBreak &&
                params.table.isCTEnabledTable &&
                player.playerScore > 0 &&
                ((player.playerCallTimer.status === false && player.callTimeGameMissed <= params.table.ctEnabledBufferHand) ||
                    (player.playerCallTimer.status === true && !player.playerCallTimer.isCallTimeOver)))
        );

        params.table.onStartPlayers = _.pluck(_.filter(params.table.players, shouldInclude), 'playerId');
        params.table.onStartPlayersCustom = _.pluck(_.filter(params.table.players, shouldInclude), 'playerId');

        params.table.allInPLayerCardsCards = [];

        for (const player of params.table.players) {
            const idx = _ld.findIndex(params.table.players, { playerId: player.playerId });
            params.table.players[idx].active = false;
        }

        for (const playerId of params.table.onStartPlayers) {
            const idx = _ld.findIndex(params.table.players, { playerId });
            const player = params.table.players[idx];
            player.isCurrentRoundPlayer = true;
            player.active = true;
            player.tempPlaying = false;
            if (player.previousState === stateOfX.playerState.reserved) {
                player.previousState = stateOfX.playerState.playing;
            }
        }

        if (params.table.isRunItTwiceTable === true) {
            for (const player of params.table.players) {
                const idx = _ld.findIndex(params.table.players, { playerId: player.playerId });
                params.table.players[idx].isRunItTwice = true;
            }
        }

        let playerToAvoid = _.where(params.table.players, { state: stateOfX.playerState.disconnected });
        playerToAvoid = _.reject(playerToAvoid, (player: any) => (
            params.table.isCTEnabledTable &&
            player.playerScore > 0 &&
            ((player.playerCallTimer.status === false && player.callTimeGameMissed <= params.table.ctEnabledBufferHand) ||
                (player.playerCallTimer.status === true && !player.playerCallTimer.isCallTimeOver))
        ));

        for (const player of playerToAvoid) {
            const idx = _ld.findIndex(params.table.players, { playerId: player.playerId });
            const pl = params.table.players[idx];
            pl.state = stateOfX.playerState.onBreak;
            pl.active = false;
            pl.cards = [];
            pl.moves = [];
            pl.hasPlayedOnceOnTable = false;
            pl.entryPlayer = true;

            const query = {
                seatIndex: pl.seatIndex,
                channelId: params.table.channelId
            };
            await this.tableManager.removeCurrentPlayer(query);
        }

        params.table.summaryOfAllPlayers = {};
        params.table.handHistory = [];

        const markPlayers = (player: any) => {
            player.roundId = params.table.roundId;
            player.hasPlayedOnceOnTable = true;
            player.lastRoundPlayed = stateOfX.round.preflop;
            player.precheckValue = stateOfX.playerPrecheckValue.NONE;
            player.onGameStartBuyIn = player.chips;
            player.totalGames = (player.totalGames || 0) + 1;
            if ((player.totalGames % systemConfig.timebank.earnAfterEveryManyHands) === 0) {
                player.timeBankSec = (player.timeBankSec || 0) + systemConfig.timebank.earnSec;
                if (player.timeBankSec > systemConfig.timebank.maxSeconds) {
                    player.timeBankSec = systemConfig.timebank.maxSeconds;
                }
            }
            return player;
        };

        _.map(
            _.filter(params.table.players, (player: any) => (
                player.state === stateOfX.playerState.playing ||
                player.state === stateOfX.playerState.disconnected ||
                (player.state === stateOfX.playerState.onBreak &&
                    params.table.isCTEnabledTable &&
                    player.playerScore > 0 &&
                    ((player.playerCallTimer.status === false && player.callTimeGameMissed <= params.table.ctEnabledBufferHand) ||
                        (player.playerCallTimer.status === true && !player.playerCallTimer.isCallTimeOver)))
            )),
            markPlayers
        );

        _.map(
            _.where(params.table.players, { state: stateOfX.playerState.disconnected }),
            markPlayers
        );

        return params;
    };

    // Old
    // var updateTableEntitiesOnGameStart = function (params, cb) {
    // serverLog(stateOfX.serverLogType.info, 'in setTableConfig updateTableEntitiesOnGameStart');
    // params.table.state = stateOfX.gameState.running;
    // params.table.stateInternal = stateOfX.gameState.running;
    // params.table.pot = [];
    // params.table.occupiedSeats = params.table.players.length;
    // params.table.vacantSeats = params.table.maxPlayers - params.table.players.length;
    // params.table.onStartPlayers = _.pluck(_.filter(params.table.players, (player) => {
    //     return (player.state == stateOfX.playerState.playing) || (player.state == stateOfX.playerState.onBreak && (params.table.isCTEnabledTable && player.playerScore > 0
    //     && (
    //         (player.playerCallTimer.status === false && player.callTimeGameMissed <= params.table.ctEnabledBufferHand)
    //         || (player.playerCallTimer.status === true
    //         && !(player.playerCallTimer.isCallTimeOver)
    //         )
    //     )
    //     ))
    // }), 'playerId');
    // params.table.onStartPlayersCustom = _.pluck(_.filter(params.table.players, (player) => {
    //     return (player.state == stateOfX.playerState.playing) || (player.state == stateOfX.playerState.onBreak && (params.table.isCTEnabledTable && player.playerScore > 0
    //     && (
    //         (player.playerCallTimer.status === false && player.callTimeGameMissed <= params.table.ctEnabledBufferHand)
    //         || (player.playerCallTimer.status === true
    //         && !(player.playerCallTimer.isCallTimeOver)
    //         )
    //     )
    //     ))
    // }), 'playerId');
    // params.table.allInPLayerCardsCards = [];
    // var playingPlayersIndex;
    // async.each(params.table.players, function (players, ecb) {
    //     playingPlayersIndex = _ld.findIndex(params.table.players, { playerId: players.playerId });
    //     params.table.players[playingPlayersIndex].active = false;
    //     ecb();
    // });
    // var playingPlayersIndex;
    // async.each(params.table.onStartPlayers, function (playingPlayers, ecb) {
    //     playingPlayersIndex = _ld.findIndex(params.table.players, { playerId: playingPlayers });
    //     params.table.players[playingPlayersIndex].isCurrentRoundPlayer = true;
    //     params.table.players[playingPlayersIndex].active = true;
    //     params.table.players[playingPlayersIndex].tempPlaying = false;
    //     if (params.table.players[playingPlayersIndex].previousState == stateOfX.playerState.reserved) {
    //     params.table.players[playingPlayersIndex].previousState = stateOfX.playerState.playing;
    //     }
    //     ecb();
    // });
    // // var playerToAvoid = _.where(params.table.players, {state: stateOfX.playerState.waiting});
    // //  var avoidPlayerIndex;
    // //  async.each(playerToAvoid, function(player, ecb){
    // //   // Set out of money if player have  0 chips

    // //    avoidPlayerIndex     = _ld.findIndex(params.table.players, {playerId: player.playerId});      
    // //      params.table.players[avoidPlayerIndex].state = stateOfX.playerState.onBreak;

    // //      var broadCastData ={playerId: player.playerId, channelId: params.channelId,resetTimer:false, state: params.table.players[avoidPlayerIndex].state}
    // //      pomelo.app.get('channelService').broadcast(pomelo.app.get('frontendType'), 'playerState', broadCastData);
    // //    ecb();
    // //  });

    // //Default runit twice table
    // if (!!params.table.isRunItTwiceTable && params.table.isRunItTwiceTable == true) {
    //     async.each(params.table.players, function (player, ecb) {
    //     PlayerIndex = _ld.findIndex(params.table.players, { playerId: player.playerId });
    //     params.table.players[PlayerIndex].isRunItTwice = true;
    //     ecb();
    //     });
    // }
    // var playerToAvoid = _.where(params.table.players, { state: stateOfX.playerState.disconnected });
    // playerToAvoid = _.reject(playerToAvoid, (player) => {
    //     // table not avalable
    //     return params.table.isCTEnabledTable && player.playerScore > 0
    //     && (
    //         (player.playerCallTimer.status === false && player.callTimeGameMissed <= params.table.ctEnabledBufferHand)
    //         || (player.playerCallTimer.status === true
    //         && !(player.playerCallTimer.isCallTimeOver)
    //         )
    //     );
    // });
    // async.each(playerToAvoid, function (player, ecb) {
    //     avoidPlayerIndex = _ld.findIndex(params.table.players, { playerId: player.playerId });
    //     params.table.players[avoidPlayerIndex].state = stateOfX.playerState.onBreak;
    //     params.table.players[avoidPlayerIndex].active = false;
    //     params.table.players[avoidPlayerIndex].cards = [];
    //     params.table.players[avoidPlayerIndex].moves = [];
    //     params.table.players[avoidPlayerIndex].hasPlayedOnceOnTable = false;
    //     params.table.players[avoidPlayerIndex].entryPlayer = true;

    //     var query = {};
    //     query.seatIndex = params.table.players[avoidPlayerIndex].seatIndex;
    //     query.channelId = params.table.channelId;
    //     tableManager.removeCurrentPlayer(query, function (param, cb) {
    //     ecb();
    //     })

    // });

    // params.table.summaryOfAllPlayers = {};
    // params.table.handHistory = [];
    // // Reset roundId for playing players in this game
    // _.map(_.filter(params.table.players, (player) => {
    //     return player.state == stateOfX.playerState.playing ||
    //     player.state == stateOfX.playerState.disconnected ||
    //     (player.state == stateOfX.playerState.onBreak && (params.table.isCTEnabledTable && player.playerScore > 0
    //         && (
    //         (player.playerCallTimer.status === false && player.callTimeGameMissed <= params.table.ctEnabledBufferHand)
    //         || (player.playerCallTimer.status === true
    //             && !(player.playerCallTimer.isCallTimeOver)
    //         )
    //         )
    //     ));
    // }), function (player) {
    //     player.roundId = params.table.roundId;
    //     player.hasPlayedOnceOnTable = true;
    //     player.lastRoundPlayed = stateOfX.round.preflop;
    //     // Set selected precheck as NONE for every player at game start - so that old value from previous game
    //     // not be there to perform moves
    //     player.precheckValue = stateOfX.playerPrecheckValue.NONE;
    //     // save player chips in onGameStartBuyIn - to show on dashboard
    //     player.onGameStartBuyIn = player.chips;
    //     player.totalGames = (player.totalGames || 0) + 1;
    //     if ((player.totalGames % systemConfig.timebank.earnAfterEveryManyHands) === 0) { // 50 hands
    //     player.timeBankSec = (player.timeBankSec || 0) + systemConfig.timebank.earnSec; // time bank earned // + 10 sec
    //     if (player.timeBankSec > systemConfig.timebank.maxSeconds) { // max 30 sec
    //         player.timeBankSec = systemConfig.timebank.maxSeconds;
    //     }
    //     }
    //     return player
    // });


    // ////  Additional code to handle disconnection player 
    // _.map(_.where(params.table.players, { state: stateOfX.playerState.disconnected }), function (player) {
    //     player.roundId = params.table.roundId;
    //     player.hasPlayedOnceOnTable = true;
    //     player.lastRoundPlayed = stateOfX.round.preflop;
    //     // Set selected precheck as NONE for every player at game start - so that old value from previous game
    //     // not be there to perform moves
    //     player.precheckValue = stateOfX.playerPrecheckValue.NONE;
    //     // save player chips in onGameStartBuyIn - to show on dashboard
    //     player.onGameStartBuyIn = player.chips;
    //     player.totalGames = (player.totalGames || 0) + 1;
    //     if ((player.totalGames % systemConfig.timebank.earnAfterEveryManyHands) === 0) { // 50 hands
    //     player.timeBankSec = (player.timeBankSec || 0) + systemConfig.timebank.earnSec; // time bank earned // + 10 sec
    //     if (player.timeBankSec > systemConfig.timebank.maxSeconds) { // max 30 sec
    //         player.timeBankSec = systemConfig.timebank.maxSeconds;
    //     }
    //     }
    //     return player
    // });
    // ////  /////////////////////////////////////////////// 

    // // activity.startGameInfo(params,stateOfX.profile.category.gamePlay,stateOfX.gamePlay.subCategory.startGame,stateOfX.logType.info);
    // cb(null, params);
    // };
    /*================================  END  ============================*/


    /*================================  START  ============================*/
    // create record for hand tab
    // New
    // async createBasicHandTab(params: any): Promise<any> {
    //     try {
    //         await this.db.createHandTab(params.channelId, params.table.roundId, params.table.roundNumber);
    //         return params;
    //     } catch (err) {
    //         throw {
    //             success: false,
    //             isRetry: false,
    //             isDisplay: false,
    //             channelId: params.channelId || "",
    //             info: popupTextManager.dbQyeryInfo.DBCREATEHANDTAB_FAIL_SETTABLECONFIG + JSON.stringify(err),
    //             errorId: "dbQyeryInfo.DBCREATEHANDTAB_FAIL_SETTABLECONFIG"
    //         };
    //     }
    // };


    // Old
    // var createBasicHandTab = function (params, cb) {
    //     logDB.createHandTab(params.channelId, params.table.roundId, params.table.roundNumber, function (err, result) {
    //         if (err) {
    //             serverLog(stateOfX.serverLogType.error, "Unable to store initiated hand hostory record for this table! - " + JSON.stringify(err));
    //             cb({ success: false, isRetry: false, isDisplay: false, channelId: (params.channelId || ""), info: popupTextManager.dbQyeryInfo.DBCREATEHANDTAB_FAIL_SETTABLECONFIG + JSON.stringify(err), errorId: "dbQyeryInfo.DBCREATEHANDTAB_FAIL_SETTABLECONFIG" });
    //             //cb({success: false, channelId: params.channelId, info: "Unable to store initiated hand hostory record for this table! - " + JSON.stringify(err)})
    //         } else {
    //             cb(null, params);
    //         }
    //     })
    // }
    /*================================  END  ============================*/


    /*================================  START  ============================*/
    // init summary text for all players
    // New
    async createBasicSummary(params: any): Promise<any> {
        try {
            for (const player of params.table.players) {
                if (
                    player.state === stateOfX.playerState.playing ||
                    player.state === stateOfX.playerState.disconnected
                ) {
                    params.table.summaryOfAllPlayers[player.seatIndex] = "";
                }
            }
            return params;
        } catch (err) {

            throw {
                success: false,
                isRetry: false,
                isDisplay: true,
                channelId: params.channelId || "",
                info:
                    popupTextManager.falseMessages
                        .CREATEBASICSUMMARY_FAIL_SETTABLECONFIG +
                    JSON.stringify(err),
                errorId: "falseMessages.CREATEBASICSUMMARY_FAIL_SETTABLECONFIG",
            };
        }
    };


    // Old
    // var createBasicSummary = function (params, cb) {
    // async.each(params.table.players, function (player, ecb) {
    //     if (player.state == stateOfX.playerState.playing || player.state == stateOfX.playerState.disconnected) {
    //         params.table.summaryOfAllPlayers[player.seatIndex] = "";
    //     }
    //     ecb();
    // }, function (err) {
    //     if (err) {
    //         serverLog(stateOfX.serverLogType.error, "Unable to initiate summary for this game! - " + JSON.stringify(err));
    //         cb({ success: false, isRetry: false, isDisplay: true, channelId: (params.channelId || ""), info: popupTextManager.falseMessages.CREATEBASICSUMMARY_FAIL_SETTABLECONFIG + JSON.stringify(err), errorId: "falseMessages.CREATEBASICSUMMARY_FAIL_SETTABLECONFIG" });

    //         //cb({success: false, channelId: params.channelId, info: "Unable to initiate summary for this game! - " + JSON.stringify(err)})
    //     } else {
    //         serverLog(stateOfX.serverLogType.info, "Summary for this game initiated with - " + JSON.stringify(params.table.summaryOfAllPlayers));
    //         cb(null, params);
    //     }
    // });
    // }
    /*================================  END  ============================*/


    /*================================  START  ============================*/
    // ### Adjust active player indexes among each other
    // > Set preActiveIndex and nextActiveIndex values for each player
    // > Used for turn transfer importantly
    // New
    async adjustActiveIndexes(params: unknown): Promise<unknown> {

        const performResponse = await this.adjustIndex.perform(params);

        if (performResponse.success) {
            return params;
        }

        // “cb(performResponse)” is turned into throwing the error
        throw performResponse;
    }

    // Old
    // var adjustActiveIndexes = function (params, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'in setTableConfig adjustActiveIndexes');
    //     adjustIndex.perform(params, function (performResponse) {
    //         if (performResponse.success) {
    //             cb(null, params);
    //         } else {
    //             cb(performResponse);
    //         }
    //     });
    // };
    /*================================  END  ============================*/


    /*================================  START  ============================*/
    // save array of seat indexes occupied by players
    // New
    async totalSeatOccpuied(params: any): Promise<any> {
        params.data.totalSeatIndexOccupied = params.table.players
            .filter((player) => {
                return (player.state === stateOfX.playerState.playing) ||
                    (player.state === stateOfX.playerState.onBreak &&
                        (params.table.isCTEnabledTable &&
                            (player.playerScore ?? 0) > 0 &&
                            (
                                (player.playerCallTimer?.status === false &&
                                    (player.callTimeGameMissed ?? 0) <= (params.table.ctEnabledBufferHand ?? 0)) ||
                                (player.playerCallTimer?.status === true &&
                                    !(player.playerCallTimer?.isCallTimeOver)
                                )
                            )
                        ));
            })
            .map(player => player.seatIndex);

        const disconnectedPlayer = params.table.players
            .filter(player => player.state === stateOfX.playerState.disconnected)
            .map(player => player.seatIndex);

        if (disconnectedPlayer.length > 0) {
            params.data.totalSeatIndexOccupied.push(disconnectedPlayer[0]);
        }

        return params;
    }

    // Old
    // var totalSeatOccpuied = function (params, cb) {
    //     params.data.totalSeatIndexOccupied = _.pluck(_.filter(params.table.players, (player) => {
    //         return (player.state == stateOfX.playerState.playing) || (player.state == stateOfX.playerState.onBreak && (params.table.isCTEnabledTable && player.playerScore > 0
    //             && (
    //                 (player.playerCallTimer.status === false && player.callTimeGameMissed <= params.table.ctEnabledBufferHand)
    //                 || (player.playerCallTimer.status === true
    //                     && !(player.playerCallTimer.isCallTimeOver)
    //                 )
    //             )
    //         ));
    //     }), 'seatIndex');

    //     // console.warn('totalSeatOccpuied', params.table.isCTEnabledTable, params.data.totalSeatIndexOccupied, params.table.players);

    //     disconnectedPlayer = _.pluck(_.where(params.table.players, { state: stateOfX.playerState.disconnected }), 'seatIndex');
    //     if (disconnectedPlayer.length > 0) {
    //         params.data.totalSeatIndexOccupied.push(disconnectedPlayer[0]);
    //     }
    //     serverLog(stateOfX.serverLogType.info, 'Seatindex occupied - ' + params.data.totalSeatIndexOccupied);
    //     cb(null, params);
    // }
    /*================================  END  ============================*/




    /*================================  START  ============================*/
    // set finally dealer array index and seat index
    // New
    async setDealerIndexAndSeatIndex(params: any): Promise<any> {

        if (params.data.delaerFound && params.data.currentDealerSeatIndex !== undefined) {
            const playerIndexOnTable = params.table.players.findIndex(
                player => player.seatIndex === params.data.currentDealerSeatIndex
            );

            if (playerIndexOnTable !== -1) {
                params.table.dealerIndex = playerIndexOnTable;
                params.table.dealerSeatIndex = params.data.currentDealerSeatIndex;

                if (params.table.players[params.table.dealerIndex]) {
                    params.table.players[params.table.dealerIndex].entryPlayer = false;
                    params.table.players[params.table.dealerIndex].isWaitingPlayer = false;
                }

                return params;
            }
        }

        throw {
            success: false,
            isRetry: false,
            isDisplay: false,
            channelId: params.channelId || "",
            info: popupTextManager.falseMessages.SETDEALERINDEXANDSEATINDEX_FAIL_SETTABLECONFIG,
            errorId: "falseMessages.SETDEALERINDEXANDSEATINDEX_FAIL_SETTABLECONFIG"
        };
    }
    //Old
    // var setDealerIndexAndSeatIndex = function (params, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'in setTableConfig setDealerIndexAndSeatIndex');
    //     if (params.data.delaerFound) {
    //         var playerIndexOnTable = _ld.findIndex(params.table.players, { seatIndex: params.data.currentDealerSeatIndex });
    //         params.table.dealerIndex = playerIndexOnTable;
    //         params.table.dealerSeatIndex = params.data.currentDealerSeatIndex;
    //         params.table.players[params.table.dealerIndex].entryPlayer = false;
    //         params.table.players[params.table.dealerIndex].isWaitingPlayer = false;
    //         serverLog(stateOfX.serverLogType.info, 'Dealer index in players - ' + params.table.dealerIndex + '  and seat index - ' + params.table.dealerSeatIndex);
    //         cb(null, params)
    //     } else {
    //         serverLog(stateOfX.serverLogType.error, "No dealer decided for new Game");
    //         cb({ success: false, isRetry: false, isDisplay: false, channelId: (params.channelId || ""), info: popupTextManager.falseMessages.SETDEALERINDEXANDSEATINDEX_FAIL_SETTABLECONFIG, errorId: "falseMessages.SETDEALERINDEXANDSEATINDEX_FAIL_SETTABLECONFIG" });

    //         //cb({success: false, channelId: params.channelId, info: "Dealer decision failed for new Game"});
    //     }
    // }
    /*================================  END  ============================*/


    /*================================  START  ============================*/
    // set dealer for next game
    // normal rules
    // New
    async setNextGameDealer(params: any): Promise<any> {
        // Filter playing players (original commented code included for reference)
        const playingPlayers = params.table.players.filter(
            player => player.state === stateOfX.playerState.playing
        );

        // Filter onBreak CT players (original commented code included for reference)
        const onBreakCTPlayer = params.table.players.filter(player => {
            return player.state === stateOfX.playerState.onBreak &&
                params.table.isCTEnabledTable &&
                (player.playerScore ?? 0) > 0 &&
                (
                    (player.playerCallTimer?.status === false &&
                        (player.callTimeGameMissed ?? 0) <= (params.table.ctEnabledBufferHand ?? 0)) ||
                    (player.playerCallTimer?.status === true &&
                        !(player.playerCallTimer?.isCallTimeOver)
                    )
                );
        });

        // Original condition commented out - keeping just the active one
        if (playingPlayers.length !== 2) {
            params.table.nextDealerSeatIndex = params.table.smallBlindSeatIndex;
            return params;
        }

        params.seatIndex = params.table.dealerSeatIndex;

        try {
            const seatIndexResponse = await this.tableManager.nextActiveSeatIndex(params);

            if (seatIndexResponse.success && seatIndexResponse.seatIndex !== undefined) {
                params.table.nextDealerSeatIndex = seatIndexResponse.seatIndex;
                return params;
            } else {
                throw seatIndexResponse;
            }
        } catch (error) {
            throw error;
        }
    }

    // Old
    // var setNextGameDealer = function (params, cb) {

    //     // var playingPlayers = _.where(params.table.players, { state: stateOfX.playerState.playing });
    //     // var onBreakCTPlayer = _.filter(params.table.players, (player) => {
    //     //   return player.state == stateOfX.playerState.onBreak && params.table.isCTEnabledTable && player.playerScore > 0
    //     //     && (
    //     //       (player.playerCallTimer.status === false && player.callTimeGameMissed <= params.table.ctEnabledBufferHand)
    //     //       || (player.playerCallTimer.status === true
    //     //         && !(player.playerCallTimer.isCallTimeOver)
    //     //       )
    //     //     );
    //     // })

    //     //  if (playingPlayers.length + onBreakCTPlayer.length !== 2) {
    //     //   params.table.nextDealerSeatIndex = params.table.smallBlindSeatIndex
    //     //   serverLog(stateOfX.serverLogType.info, "More than 2 player case, Seat index of Dealer for next Game - " + params.table.nextDealerSeatIndex);
    //     //   cb(null, params);
    //     //   return;     
    //     //  }

    //     if (_.where(params.table.players, { state: stateOfX.playerState.playing }).length !== 2) {
    //         params.table.nextDealerSeatIndex = params.table.smallBlindSeatIndex
    //         serverLog(stateOfX.serverLogType.info, "More than 2 player case, Seat index of Dealer for next Game - " + params.table.nextDealerSeatIndex);
    //         cb(null, params);
    //         return;
    //     }

    //     params.seatIndex = params.table.dealerSeatIndex;
    //     tableManager.nextActiveSeatIndex(params, function (seatIndexResponse) {
    //         serverLog(stateOfX.serverLogType.info, 'setNextGameDealerDetails seatIndexResponse => ' + JSON.stringify(seatIndexResponse));
    //         if (seatIndexResponse.success) {
    //             params.table.nextDealerSeatIndex = seatIndexResponse.seatIndex;
    //             serverLog(stateOfX.serverLogType.info, "Seat index of Dealer for next Game - " + params.table.nextDealerSeatIndex);
    //             cb(null, params);
    //         } else {
    //             cb(seatIndexResponse);
    //         }
    //     });
    // }
    /*================================  END  ============================*/


    /*================================  START  ============================*/
    // New
    async setupDealer(params: any): Promise<any> {
        if (params.table.roundCount === 1) {
            params.data.delaerFound = true;
            if (params.data.totalSeatIndexOccupied && params.data.totalSeatIndexOccupied.length > 0) {
                params.data.currentDealerSeatIndex = params.data.totalSeatIndexOccupied[0];
            }
            return params;
        } else {
            const dealerDetails = await this.tableManager.findNewDealer(params);
            params.data.delaerFound = true;
            params.data.currentDealerSeatIndex = dealerDetails.seatIndex;
            return params;
        }
    }

    // Old
    // var setupDealer = function (params, cb) {
    // if (params.table.roundCount === 1) {
    //     params.data.delaerFound = true;
    //     params.data.currentDealerSeatIndex = params.data.totalSeatIndexOccupied[0];
    //     cb(null, params);
    // } else {
    //     tableManager.findNewDealer(params, function (dealerDetails) {
    //         params.data.delaerFound = true;
    //         params.data.currentDealerSeatIndex = dealerDetails.seatIndex;
    //         cb(null, params);
    //     })
    // }

    // }
    /*================================  END  ============================*/


    /*================================  START  ============================*/
    // Set this game and next game dealer details
    // New
    async setDealerDetails(params: any): Promise<any> {

        try {
            let currentParams = params;

            currentParams = await this.totalSeatOccpuied(currentParams);
            currentParams = await this.setupDealer(currentParams);
            currentParams = await this.setDealerIndexAndSeatIndex(currentParams);

            return currentParams;
        } catch (error) {
            throw error;
        }
    }
    // Old
    // var setDealerDetails = function (params, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'in setTableConfig setDealerDetails');
    //     async.waterfall([
    //         async.apply(totalSeatOccpuied, params),
    //         setupDealer,
    //         // setFirstDealer,
    //         // setPreDecideDealer,
    //         // setNewDealer,
    //         setDealerIndexAndSeatIndex,
    //     ], function (err, params) {
    //         cb(err, params);
    //     });
    // }
    /*================================  END  ============================*/



    /*================================  START  ============================*/
    // set finally small blind array index and seat index
    // New
    async setSmallBlindIndexAndSeatIndex(params: any): Promise<any> {

        if (params.data.smallBlindSet && params.table.smallBlindSeatIndex !== undefined) {
            const playerIndexOnTable = params.table.players.findIndex(
                player => player.seatIndex === params.table.smallBlindSeatIndex
            );

            if (playerIndexOnTable !== -1) {
                params.table.smallBlindIndex = playerIndexOnTable;
                params.table.players[params.table.smallBlindIndex].entryPlayer = false;
                return params;
            }
        }

        throw {
            success: false,
            isRetry: false,
            isDisplay: false,
            channelId: params.channelId || "",
            info: popupTextManager.falseMessages.SETSMALLBLINDINDEXANDSEATINDEX_FAIL_SETTABLECONFIG,
            errorId: "falseMessages.SETSMALLBLINDINDEXANDSEATINDEX_FAIL_SETTABLECONFIG"
        };
    }
    // Old
    // var setSmallBlindIndexAndSeatIndex = function (params, cb) {

    //     serverLog(stateOfX.serverLogType.info, 'in setTableConfig setSmallBlindIndexAndSeatIndex');
    //     if (params.data.smallBlindSet) {
    //         var playerIndexOnTable = _ld.findIndex(params.table.players, { seatIndex: params.table.smallBlindSeatIndex });
    //         params.table.smallBlindIndex = playerIndexOnTable;
    //         params.table.players[params.table.smallBlindIndex].entryPlayer = false;
    //         serverLog(stateOfX.serverLogType.info, 'Small blind index in players array - ' + params.table.smallBlindIndex + '  and seat index - ' + params.table.smallBlindSeatIndex);
    //         cb(null, params)
    //     } else {
    //         serverLog(stateOfX.serverLogType.error, "Small blind decision failed !");
    //         cb({ success: false, isRetry: false, isDisplay: false, channelId: (params.channelId || ""), info: popupTextManager.falseMessages.SETSMALLBLINDINDEXANDSEATINDEX_FAIL_SETTABLECONFIG, errorId: "falseMessages.SETSMALLBLINDINDEXANDSEATINDEX_FAIL_SETTABLECONFIG" });

    //         //cb({success: false, channelId: params.channelId, info: "Small blind decision failed !"});
    //     }
    // }
    /*================================  END  ============================*/


    /*================================  START  ============================*/
    // set small blind for next game
    // normal rules
    // New
    async setNextGameSmallBlind(params: any): Promise<any> {

        params.seatIndex = params.table.smallBlindSeatIndex;

        const playingPlayers = params.table.players.filter(
            player => player.state === stateOfX.playerState.playing
        );

        if (playingPlayers.length === 2) {
            params.table.nextSmallBlindSeatIndex = params.table.nextDealerSeatIndex;
            return params;
        }

        try {
            const seatIndexResponse = await this.tableManager.nextActiveSeatIndex(params);

            if (seatIndexResponse.success && seatIndexResponse.seatIndex !== undefined) {
                params.table.nextSmallBlindSeatIndex = seatIndexResponse.seatIndex;
                return params;
            } else {
                throw seatIndexResponse;
            }
        } catch (error) {
            throw error;
        }
    }
    // Old
    // var setNextGameSmallBlind = function (params, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'in setTableConfig setNextGameSmallBlind');
    //     params.seatIndex = params.table.smallBlindSeatIndex;
    //     if (_.where(params.table.players, { state: stateOfX.playerState.playing }).length === 2) {
    //         params.table.nextSmallBlindSeatIndex = params.table.nextDealerSeatIndex;
    //         serverLog(stateOfX.serverLogType.info, '2 player case, next game SB set at seat - ' + params.table.smallBlindSeatIndex);
    //         cb(null, params);
    //     } else {
    //         tableManager.nextActiveSeatIndex(params, function (seatIndexResponse) {
    //             serverLog(stateOfX.serverLogType.info, 'Getting seat while setting next Game SB seatIndexResponse = ' + JSON.stringify(seatIndexResponse));
    //             if (seatIndexResponse.success) {
    //                 params.table.nextSmallBlindSeatIndex = seatIndexResponse.seatIndex;
    //                 serverLog(stateOfX.serverLogType.info, 'More than 2 player case, next game SB set at seat - ' + params.table.nextSmallBlindSeatIndex);
    //                 cb(null, params);
    //             } else {
    //                 cb(seatIndexResponse);
    //             }
    //         })
    //     }
    // }
    /*================================  END  ============================*/


    /*================================  START  ============================*/
    // Set this game and next game small blind details
    // New

    async setupSB(params: any): Promise<any> {
        if (params.table.roundCount === 1) {
            const playingPlayers = params.table.players.filter(
                player => player.state === stateOfX.playerState.playing
            );

            if (playingPlayers.length === 2) {
                params.data.smallBlindSet = true;
                params.table.smallBlindSeatIndex = params.table.dealerSeatIndex;
            } else {
                params.data.smallBlindSet = true;
                if (params.data.totalSeatIndexOccupied && params.data.totalSeatIndexOccupied.length > 1) {
                    params.table.smallBlindSeatIndex = params.data.totalSeatIndexOccupied[1];
                }
            }
            return params;
        } else {
            const SB = await this.tableManager.findNewSB(params);
            params.data.smallBlindSet = true;
            params.table.smallBlindSeatIndex = SB.seatIndex;
            return params;
        }
    }

    // Old
    // var setupSB = function (params, cb) {
    //     if (params.table.roundCount === 1) {
    //         if (_.where(params.table.players, { state: stateOfX.playerState.playing }).length === 2) {
    //             params.data.smallBlindSet = true;
    //             params.table.smallBlindSeatIndex = params.table.dealerSeatIndex;
    //             serverLog(stateOfX.serverLogType.info, '1st SB set at seat for 2 players - ' + params.table.smallBlindSeatIndex);
    //         } else {
    //             params.data.smallBlindSet = true;
    //             params.table.smallBlindSeatIndex = params.data.totalSeatIndexOccupied[1];
    //             serverLog(stateOfX.serverLogType.info, '1st SB set at seat - ' + params.table.smallBlindSeatIndex);
    //         }
    //         cb(null, params);
    //     } else {
    //         tableManager.findNewSB(params, function (SB) {
    //             params.data.smallBlindSet = true;
    //             params.table.smallBlindSeatIndex = SB.seatIndex;

    //             cb(null, params);
    //         })
    //     }

    // }
    /*================================  END  ============================*/


    /*================================  START  ============================*/
    // New

    async resetPlayers(params: any): Promise<any> {
        // Filter players that meet the criteria
        const newPlayers = params.table.players.filter(player =>
            player.state === stateOfX.playerState.playing &&
            player.entryPlayer === true &&
            player.isForceBlindEnable === true
        );

        // Process each player sequentially
        for (const newPlayer of newPlayers) {
            const playerIndex = params.table.players.findIndex(
                player => player.seatIndex === newPlayer.seatIndex
            );

            if (playerIndex !== -1) {
                params.table.players[playerIndex].entryPlayer = false;
            }
        }

        return params;
    }

    // Old
    // var resetPlayers = function (params, cb) {

    //     var newPlayers = _.where(params.table.players, { state: stateOfX.playerState.playing, entryPlayer: true, isForceBlindEnable: true });
    //     var playerIndex;
    //     async.eachSeries(newPlayers, function (newPlayer, ecb) {
    //         playerIndex = _ld.findIndex(params.table.players, { seatIndex: newPlayer.seatIndex });

    //         params.table.players[playerIndex].entryPlayer = false;
    //         ecb();
    //     }, function (err) {
    //         cb(null, params);
    //     })
    //     // cb(null, params);
    // }
    /*================================  END  ============================*/


    /*================================  START  ============================*/
    // New
    async setSmallBlindDetails(params: any): Promise<any> {
        try {
            // Convert async.waterfall to Promise chain
            const result = await this.setupSB(params);
            const result2 = await this.resetPlayers(result);
            const finalResult = await this.setSmallBlindIndexAndSeatIndex(result2);
            return finalResult;
        } catch (error) {
            throw error;
        }
    }

    // Old
    // var setSmallBlindDetails = function (params, cb) {
    //     async.waterfall([
    //         async.apply(setupSB, params),
    //         resetPlayers,
    //         // setSmallBlindToDealer,
    //         // setPreDecideSmallBlind,
    //         // resetSmallBlind,
    //         setSmallBlindIndexAndSeatIndex,
    //         // setNextGameDealer,
    //         // setNextGameSmallBlind
    //     ], function (err, params) {
    //         cb(err, params);
    //     })
    // }
    /*================================  END  ============================*/

    /*================================  START  ============================*/
    // Set game big blind details
    // New
    async setBigBlindDetails(params: any): Promise<any> {
        const BB = await this.tableManager.findNewBB(params);
        params.table.bigBlindSeatIndex = BB.seatIndex;

        if (params.table.bigBlindSeatIndex === params.table.dealerSeatIndex) {
            const playerIndexOnTable = params.table.players.findIndex(
                player => player.seatIndex === params.table.dealerSeatIndex
            );

            if (playerIndexOnTable !== -1) {
                params.table.bigBlindSeatIndex = params.table.smallBlindSeatIndex;
                params.table.smallBlindIndex = playerIndexOnTable;
                params.table.smallBlindSeatIndex = params.table.dealerSeatIndex;
            }
        }

        params.table.bigBlindIndex = params.table.players.findIndex(
            player => player.seatIndex === params.table.bigBlindSeatIndex
        );

        if (params.table.bigBlindIndex !== -1) {
            params.table.players[params.table.bigBlindIndex].entryPlayer = false;
        }


        return params;
    }
    // Old
    // var setBigBlindDetails = function (params, cb) {
    //     // console.log('setBigBlindDetails ', params.table);
    //     tableManager.findNewBB(params, function (BB) {
    //         params.table.bigBlindSeatIndex = BB.seatIndex;


    //         if (params.table.bigBlindSeatIndex == params.table.dealerSeatIndex) {
    //             var playerIndexOnTable = _ld.findIndex(params.table.players, { seatIndex: params.table.dealerSeatIndex });
    //             params.table.bigBlindSeatIndex = params.table.smallBlindSeatIndex;
    //             params.table.smallBlindIndex = playerIndexOnTable;
    //             params.table.smallBlindSeatIndex = params.table.dealerSeatIndex;

    //         }


    //         params.table.bigBlindIndex = _ld.findIndex(params.table.players, { seatIndex: params.table.bigBlindSeatIndex });
    //         params.table.players[params.table.bigBlindIndex].entryPlayer = false;
    //         // console.log('setBigBlindDetails end ', params.table);

    //         serverLog(stateOfX.serverLogType.info, 'Big blind players details - ' + JSON.stringify(params.table.players[params.table.bigBlindIndex]));
    //         cb(null, params);
    //     })
    // }
    /*================================  END  ============================*/



    /*================================  START  ============================*/
    // Set game first player details
    // who will get first turn in FLOP, TURN, RIVER rounds
    // New
    async setFirstPlayerDetails(params: any): Promise<any> {
        const activePlayers = params.table.players.filter(player => {
            return (player.state === stateOfX.playerState.playing) ||
                (player.state === stateOfX.playerState.onBreak &&
                    (params.table.isCTEnabledTable &&
                        (player.playerScore ?? 0) > 0 &&
                        (
                            (player.playerCallTimer?.status === false &&
                                (player.callTimeGameMissed ?? 0) <= (params.table.ctEnabledBufferHand ?? 0)) ||
                            (player.playerCallTimer?.status === true &&
                                !(player.playerCallTimer?.isCallTimeOver)
                            )
                        )
                    )
                )
        });

        if (activePlayers.length === 2) {
            params.table.firstActiveIndex = params.table.bigBlindIndex;
        } else {
            const nextPlayerSeatIndex = await this.tableManager.getNextActivePlayerBySeatIndex({
                table: params.table,
                seatIndex: params.table.dealerSeatIndex
            });


            params.table.firstActiveIndex = params.table.players.findIndex(
                player => player.seatIndex === nextPlayerSeatIndex
            );
        }

        return params;
    }

    // Old
    // var setFirstPlayerDetails = function (params, cb) {
    // if (_.filter(params.table.players, (player) => {
    //     return (player.state == stateOfX.playerState.playing) || (player.state == stateOfX.playerState.onBreak && (params.table.isCTEnabledTable && player.playerScore > 0
    //         && (
    //             (player.playerCallTimer.status === false && player.callTimeGameMissed <= params.table.ctEnabledBufferHand)
    //             || (player.playerCallTimer.status === true
    //                 && !(player.playerCallTimer.isCallTimeOver)
    //             )
    //         )
    //     ))
    // }).length === 2) {
    //     serverLog(stateOfX.serverLogType.info, 'This is two player game so, first player setting to BB.');
    //     params.table.firstActiveIndex = params.table.bigBlindIndex;
    //     serverLog(stateOfX.serverLogType.info, 'First player details - ' + JSON.stringify(params.table.players[params.table.firstActiveIndex]));
    //     cb(null, params);
    // } else {
    //     serverLog(stateOfX.serverLogType.info, 'This is not a two player game so first player setting next to Dealer.');
    //     serverLog(stateOfX.serverLogType.info, 'Dealer index in players - ' + params.table.dealerIndex);
    //     serverLog(stateOfX.serverLogType.info, 'Dealer player details, if undefined then Dead delaer case - ' + JSON.stringify(params.table.players[params.table.dealerIndex]));
    //     serverLog(stateOfX.serverLogType.info, 'Player next to delaer is at seat index - ' + tableManager.getNextActivePlayerBySeatIndex({ table: params.table, seatIndex: params.table.dealerSeatIndex }));
    //     params.table.firstActiveIndex = _ld.findIndex(params.table.players, { seatIndex: tableManager.getNextActivePlayerBySeatIndex({ table: params.table, seatIndex: params.table.dealerSeatIndex }) });
    //     serverLog(stateOfX.serverLogType.info, 'First player details - ' + JSON.stringify(params.table.players[params.table.firstActiveIndex]));
    //     cb(null, params);
    // }
    // }
    /*================================  END  ============================*/


    /*================================  START  ============================*/
    // Set straddle player on table
    // New
    async setStraddlePlayer(params: any): Promise<any> {

        try {
            const validated = await validateKeySets(
                "Request",
                "database",
                "setStraddlePlayer",
                params
            );

            if (!validated.success) {
                throw validated;
            }

            // Check if condition for min players required for straddle fulfilled
            const activePlayers = params.table.players.filter(player => player.active);
            if (activePlayers.length <= Number(systemConfig.minPlayersForStraddle)) {
                params.table.straddleIndex = -1;
                return params;
            }

            if (params.table.isStraddleEnable) {

                if (params.table.bigBlindIndex !== undefined &&
                    params.table.players[params.table.bigBlindIndex]?.nextActiveIndex !== undefined) {
                    params.table.straddleIndex = params.table.players[params.table.bigBlindIndex].nextActiveIndex;

                    // New Condition Added for all auto post blind case
                    if (params.table.straddleIndex === params.table.smallBlindIndex &&
                        params.table.players[params.table.smallBlindIndex]?.nextActiveIndex !== undefined) {
                        params.table.straddleIndex = params.table.players[params.table.smallBlindIndex].nextActiveIndex;
                    }
                    // New Condition Ends
                }
            } else {

                if (params.table.bigBlindIndex !== undefined &&
                    params.table.players[params.table.bigBlindIndex]?.nextActiveIndex !== undefined) {
                    const nextToBBIndex = params.table.players[params.table.bigBlindIndex].nextActiveIndex!;

                    if (params.table.players[nextToBBIndex]?.isStraddleOpted) {
                        params.table.straddleIndex = nextToBBIndex;
                    } else {
                        params.table.straddleIndex = -1;
                    }
                }
            }

            return params;
        } catch (error) {
            throw error;
        }
    }
    // Old
    // var setStraddlePlayer = function (params, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'in setTableConfig setStraddlePlayer');
    //     keyValidator.validateKeySets("Request", "database", "setStraddlePlayer", params, function (validated) {
    //         if (validated.success) {

    //             // Check if condition for min players required for players fulfilled
    //             if (_.where(params.table.players, { active: true }).length <= parseInt(systemConfig.minPlayersForStraddle)) { // ct
    //                 serverLog(stateOfX.serverLogType.info, 'There are less than ' + parseInt(systemConfig.minPlayersForStraddle) + ' playing players so resetting straddle index to -1.');
    //                 params.table.straddleIndex = -1;
    //                 cb(null, params);
    //                 return;
    //             }

    //             if (params.table.isStraddleEnable) {
    //                 serverLog(stateOfX.serverLogType.info, 'This table is straddle enabled, checking if two player game or not.');
    //                 serverLog(stateOfX.serverLogType.info, 'There are more than 2 playing players so about to set straddle player details.');
    //                 params.table.straddleIndex = params.table.players[params.table.bigBlindIndex].nextActiveIndex;
    //                 // New Condition Added for all auto post blind case
    //                 if (params.table.straddleIndex == params.table.smallBlindIndex) {
    //                     params.table.straddleIndex = params.table.players[params.table.smallBlindIndex].nextActiveIndex;
    //                 }
    //                 // New Condition Ends
    //                 serverLog(stateOfX.serverLogType.info, 'New straddle index set next to dealer -  ' + params.table.straddleIndex + '.');
    //                 cb(null, params);
    //             } else {
    //                 serverLog(stateOfX.serverLogType.info, 'This table is not a straddle enabled check if relavent player enabled to become straddle.')
    //                 serverLog(stateOfX.serverLogType.info, 'Player length - ' + params.table.players.length + ' next to BB index - ' + params.table.players[params.table.bigBlindIndex].nextActiveIndex);
    //                 serverLog(stateOfX.serverLogType.info, 'Player next to BB while setting straddle player - ' + JSON.stringify(params.table.players[params.table.players[params.table.bigBlindIndex].nextActiveIndex]))

    //                 if (params.table.players[params.table.players[params.table.bigBlindIndex].nextActiveIndex].isStraddleOpted) {
    //                     serverLog(stateOfX.serverLogType.info, 'Setting next to BB player as straddle');
    //                     params.table.straddleIndex = params.table.players[params.table.bigBlindIndex].nextActiveIndex;
    //                 } else {
    //                     serverLog(stateOfX.serverLogType.info, 'Not setting next to BB player as straddle');
    //                     params.table.straddleIndex = -1;
    //                 }
    //                 cb(null, params)
    //             }
    //         } else {
    //             cb(validated);
    //         }
    //     });
    // };
    /*================================  END  ============================*/

    /*================================  START  ============================*/
    // Validate if the table entities set properly to start this game
    // New

    async validateTableAttribToStartGame(params: any): Promise<any> {
        try {
            await this.tableManager.validateEntities(params);

            return params;
        } catch (err) {
            throw err;
        }
    }

    // Old
    // var validateTableAttribToStartGame = function (params, cb) {
    //     tableManager.validateEntities(params, function (err, response) {
    //         serverLog(stateOfX.serverLogType.error, 'Error while checking table config on setting config - ' + JSON.stringify(err))
    //         if (!err) {
    //             cb(null, params);
    //         } else {
    //             cb(err);
    //         }
    //     });
    // }
    /*================================  END  ============================*/


    /*================================  START  ============================*/
    // New

    async incrementRoundMissedPlayed(params: any): Promise<any> {

        try {
            const validated = await validateKeySets(
                "Request",
                "database",
                "incrementBlindMissedPlayed",
                params
            );

            if (!validated.success) {
                throw {
                    success: false,
                    isRetry: false,
                    isDisplay: false,
                    channelId: params.channelId || "",
                    info: popupTextManager.falseMessages.INCREMENTBLINDMISSED_FAIL_SETTABLECONFIG + JSON.stringify(validated),
                    errorId: "falseMessages.INCREMENTBLINDMISSED_FAIL_SETTABLECONFIG"
                };
            }

            for (const player of params.table.players) {
                if (player.state === stateOfX.playerState.onBreak) {
                    const isCTPlayer = params.table.isCTEnabledTable &&
                        (player.playerScore ?? 0) > 0 &&
                        (
                            (player.playerCallTimer?.status === false &&
                                (player.callTimeGameMissed ?? 0) <= (params.table.ctEnabledBufferHand ?? 0)) ||
                            (player.playerCallTimer?.status === true &&
                                !(player.playerCallTimer?.isCallTimeOver)
                            )
                        );

                    if (!isCTPlayer) {
                        player.roundMissed = (player.roundMissed ?? 0) + 1;
                    } else {
                        player.roundMissed = 0;
                    }
                } else {
                    player.roundMissed = 0;
                }
            }

            return params;
        } catch (error) {
            throw error;
        }
    }
    // Old
    // var incrementRoundMissedPlayed = function (params, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'in setTableConfig incrementRoundMissedPlayed');
    //     keyValidator.validateKeySets("Request", "database", "incrementBlindMissedPlayed", params, function (validated) {
    //         if (validated.success) {
    //             var players = {};
    //             for (var i = 0; i < params.table.players.length; i++) {
    //                 var player = params.table.players[i];
    //                 if (player.state === stateOfX.playerState.onBreak && !(params.table.isCTEnabledTable && player.playerScore > 0
    //                     && (
    //                         (player.playerCallTimer.status === false && player.callTimeGameMissed <= params.table.ctEnabledBufferHand)
    //                         || (player.playerCallTimer.status === true
    //                             && !(player.playerCallTimer.isCallTimeOver)
    //                         )
    //                     )
    //                 )) {
    //                     player.roundMissed = player.roundMissed + 1;
    //                 } else { // only stop WHEN last player is PLAYING
    //                     player.roundMissed = 0;
    //                 }
    //             }
    //             cb(null, params);
    //         } else {
    //             cb({ success: false, isRetry: false, isDisplay: false, channelId: (params.channelId || ""), info: popupTextManager.falseMessages.INCREMENTBLINDMISSED_FAIL_SETTABLECONFIG + JSON.stringify(validated), errorId: "falseMessages.INCREMENTBLINDMISSED_FAIL_SETTABLECONFIG" });
    //         }
    //     });
    // }
    /*================================  END  ============================*/


    /*================================  START  ============================*/
    // ### Increment blind missed played count for player
    // > If the previous player from big blind is on break (sitout) only
    // New

    // Old
    var incrementBlindMissedPlayed = function (params, cb) {
        // console.log('incrementBlindMissedPlayed', params.table);
        serverLog(stateOfX.serverLogType.info, 'in setTableConfig incrementBlindMissedPlayed');
        keyValidator.validateKeySets("Request", "database", "incrementBlindMissedPlayed", params, function (validated) {
            if (validated.success) {
                serverLog(stateOfX.serverLogType.info, 'Players while incrementing bigblind missed for sitout players - ' + JSON.stringify(params.table.players));
                serverLog(stateOfX.serverLogType.info, 'Current BB index - ' + params.table.bigBlindIndex);
                serverLog(stateOfX.serverLogType.info, 'Current BB seat index - ' + params.table.bigBlindSeatIndex);
                serverLog(stateOfX.serverLogType.info, 'Current BB Player - ' + JSON.stringify(params.table.players[params.table.bigBlindIndex]));

                serverLog(stateOfX.serverLogType.info, 'Players to check: ' + JSON.stringify(_.pluck(params.table.players, 'playerName')));

                // var previousToBigBlindIndex = tableManager.getPreviousOccupiedSeatIndex({seatIndex: params.table.bigBlindSeatIndex, table: params.table});
                // serverLog(stateOfX.serverLogType.info, 'Seat Index to previous BB player - ' + previousToBigBlindIndex);
                // var indexOfPreBBINPlayers = _ld.findIndex(params.table.players, {seatIndex: parseInt(previousToBigBlindIndex)});

                // Get all sitout indexes from BB to previous PLAYING player
                // and increment BB missed for all these players
                var index = params.table.bigBlindIndex - 1 < 0 ? params.table.players.length - 1 : params.table.bigBlindIndex - 1;
                var players = {};
                for (var i = 0; i < params.table.players.length; i++) {
                    var player = params.table.players[index];
                    serverLog(stateOfX.serverLogType.info, 'Processing player to increment BB missed: ' + JSON.stringify(player.playerName));
                    serverLog(stateOfX.serverLogType.info, player.playerName + ' state for incrementing BB missed: ' + player.state);
                    if (player.state === stateOfX.playerState.onBreak && !(params.table.isCTEnabledTable && player.playerScore > 0
                        && (
                            (player.playerCallTimer.status === false && player.callTimeGameMissed <= params.table.ctEnabledBufferHand)
                            || (player.playerCallTimer.status === true
                                && !(player.playerCallTimer.isCallTimeOver)
                            )
                        )
                    )) {
                        serverLog(stateOfX.serverLogType.info, player.playerName + ' previous BB missed value: ' + player.bigBlindMissed);
                        player.bigBlindMissed = player.bigBlindMissed + 1;
                        serverLog(stateOfX.serverLogType.info, player.playerName + ' updated BB missed value: ' + player.bigBlindMissed);
                    } else if (player.state === stateOfX.playerState.playing) { // only stop WHEN last player is PLAYING
                        serverLog(stateOfX.serverLogType.info, 'Stopping BB increment check!');
                        break;
                    }
                    index--;
                    if (index < 0) {
                        index = params.table.players.length - 1;
                    }
                }

                // if(indexOfPreBBINPlayers >= 0) {
                //   serverLog(stateOfX.serverLogType.info, 'Previous to BB, player - ' + JSON.stringify(params.table.players[indexOfPreBBINPlayers]));

                //   // serverLog(stateOfX.serverLogType.info, 'Response from getting previous seat index - ' + JSON.stringify(getPrePlayerBySeatIndexResponse));
                //   if(params.table.players[indexOfPreBBINPlayers].state === stateOfX.playerState.onBreak) {
                //     serverLog(stateOfX.serverLogType.info, 'Player at index previous to BB is ' + params.table.players[indexOfPreBBINPlayers].state + ', incrementing BB missed.');
                //     params.table.players[indexOfPreBBINPlayers].bigBlindMissed = parseInt(params.table.players[indexOfPreBBINPlayers].bigBlindMissed) + 1;
                //   } else {
                //     serverLog(stateOfX.serverLogType.info, 'Player at index previous to BB is ' + params.table.players[indexOfPreBBINPlayers].state + ', resetting BB missed to 0.');
                //     params.table.players[indexOfPreBBINPlayers].bigBlindMissed = 0;
                //   }
                //   serverLog(stateOfX.serverLogType.info, 'Total Big Blind missed for player - ' + params.table.players[indexOfPreBBINPlayers].playerName + ' - ' + params.table.players[indexOfPreBBINPlayers].bigBlindMissed);
                // } else {
                //   serverLog(stateOfX.serverLogType.info, 'Invalid indexes to process BB missed player !' );
                // }
                cb(null, params);

            } else {
                cb({ success: false, isRetry: false, isDisplay: false, channelId: (params.channelId || ""), info: popupTextManager.falseMessages.INCREMENTBLINDMISSED_FAIL_SETTABLECONFIG + JSON.stringify(validated), errorId: "falseMessages.INCREMENTBLINDMISSED_FAIL_SETTABLECONFIG" });
                //cb({success: false, channelId: params.channelId, info: "Increment big blind count fail ! - " + JSON.stringify(validated)});
            }
        });
    }
    /*================================  END  ============================*/


// initialize params as false or -1
var initializeParams = function (params, cb) {
    serverLog(stateOfX.serverLogType.info, 'in setTableConfig initializeParams');
    params.data = {};
    params.data.activePlayers = [];
    params.data.delaerFound = false;
    params.data.currentDealerSeatIndex = -1;
    params.data.dealerOrSmallBlindLeft = false;
    params.data.smallBlindLeft = false;
    params.data.dealerLeft = false;
    params.data.sameDealerSmallBlind = false;
    cb(null, params);
}
var addPlayingPlayers = function (params, cb) {
    if (params.table.onStartPlayers.length > 0) {
        var onStartPlayers = params.table.onStartPlayers;
        var player;
        async.eachSeries(onStartPlayers, function (onStartPlayer, ecb) {
            player = _.where(params.table.players, { playerId: onStartPlayer });
            tableManager.getSavedPlayerFromIMDB(player, function (getData) {
                if (getData.prevData == null) {
                    tableManager.savePlayerInIMDB(player, function (param, cb) {
                        ecb();
                    })
                } else {
                    ecb();
                }
            })

        }, function (err) {
            cb(null, params);
        })
    }

}
var removeNonPlayingPlayers = function (params, cb) {
    if (params.table.prevDealerseatIndex > 0) {
        tableManager.removeEmptyPlayers(params, function (removedPlayers) {
            cb(null, params);
        })
    } else {
        cb(null, params);
    }
}
// set dealer, sb, bb, opening player, current turn player
setTableConfig.setConfig = function (params, cb) {
    async.waterfall([

        async.apply(initializeParams, params),
        updateTableEntitiesOnGameStart,
        // createBasicHandTab,
        createBasicSummary,
        adjustActiveIndexes,
        addPlayingPlayers,
        setDealerDetails,
        setSmallBlindDetails,
        setBigBlindDetails,
        // setNexBigBlindDetails,
        incrementBlindMissedPlayed,
        incrementRoundMissedPlayed,
        setStraddlePlayer,
        setFirstPlayerDetails,
        setCurrentPlayer,
        validateTableAttribToStartGame,
        removeNonPlayingPlayers

    ], function (err, response) {
        if (err) {
            serverLog(stateOfX.serverLogType.info, 'Error while setting table config - ' + JSON.stringify(err));
            activity.info(err, stateOfX.profile.category.game, stateOfX.game.subCategory.info, stateOfX.logType.error);
            activity.info(err, stateOfX.profile.category.gamePlay, stateOfX.gamePlay.subCategory.info, stateOfX.logType.error);
            cb(err);
        } else {
            serverLog(stateOfX.serverLogType.info, 'Dealer table-players index - ' + params.table.dealerIndex + ' and seat index - ' + params.table.dealerSeatIndex);
            serverLog(stateOfX.serverLogType.info, 'SB table-players index - ' + params.table.smallBlindIndex + ' and seat index - ' + params.table.smallBlindSeatIndex);
            serverLog(stateOfX.serverLogType.info, 'BB table-players index - ' + params.table.bigBlindIndex + ' and seat index - ' + params.table.bigBlindSeatIndex);
            serverLog(stateOfX.serverLogType.info, 'Next Dealer -1 and ' + params.table.nextDealerSeatIndex);
            serverLog(stateOfX.serverLogType.info, 'Next SB -1 and ' + params.table.nextSmallBlindSeatIndex);
            activity.info(params, stateOfX.profile.category.game, stateOfX.game.subCategory.info, stateOfX.logType.info);
            activity.info(params, stateOfX.profile.category.gamePlay, stateOfX.gamePlay.subCategory.info, stateOfX.logType.info);
            cb({ success: true, table: params.table, data: params.data });
        }
    });
}




}