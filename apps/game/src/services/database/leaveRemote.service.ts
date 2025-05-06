import { Injectable } from "@nestjs/common";
import _ld from "lodash";
import _ from 'underscore';
import { stateOfX, popupTextManager, systemConfig } from "shared/common";
import { SetMoveService } from "./setMove.service";
import { HandleGameOverService } from "./handleGameOver.service";
import { ResponseHandlerService } from "./responseHandler.service";
import { AdjustActiveIndexService } from "./adjustActiveIndex.service";
import { TableManagerService } from "./tableManager.service";
import { ImdbDatabaseService } from "shared/common/datebase/Imdbdatabase.service";
import { PokerDatabaseService } from "shared/common/datebase/pokerdatabase.service";
import { validateKeySets } from "shared/common/utils/activity";













// roundOver = require('./utils/roundOver'),
//     summary = require('./utils/summaryGenerator'),
//     activity = require("../../../../../shared/activity"),
//     profileMgmt = require("../../../../../shared/model/profileMgmt"),








@Injectable()
export class LeaveRemoteService {


    private popupTextManager = popupTextManager.falseMessages;
    private popupTextManagerFromdb = popupTextManager.dbQyeryInfo;

    constructor(
        private readonly db: PokerDatabaseService,
        private readonly imdb: ImdbDatabaseService,
        private readonly setMove: SetMoveService,
        private readonly adjustIndex: AdjustActiveIndexService,
        private readonly handleGameOver: HandleGameOverService,
        private readonly tableManager: TableManagerService,
        private readonly responseHandler: ResponseHandlerService,
        private readonly tournamentLeave: TournamentLeaveService,
        private readonly wallet: WalletService,

    ) { }









    /*============================  START  =================================*/
    // Validate if Game is running throughout calculation of player leave
    // If Game is over then process game over and then
    // Create response for Game over as well and return to relevant function
    // New
    async isGameProgress(params: any): Promise<any> {

        const validated = await validateKeySets("Request", params.serverType, "isGameProgress", params);
        if (!validated.success) {
            return validated;
        }

        if (params.table.state === stateOfX.gameState.running) {
            return { success: true, isGameOver: false };
        }

        const gameOverResponse = await this.handleGameOver.processGameOver(params);

        if (!gameOverResponse.success) {
            return gameOverResponse;
        }

        params = gameOverResponse.params;

        params.data.success = true;
        params.data.roundOver = true;
        params.data.isGameOver = true;
        params.data.currentBoardCard = params.data.remainingBoardCards;
        params.data.winners = gameOverResponse.winners;
        params.data.rakeDeducted = gameOverResponse.rakeDeducted;
        params.data.cardsToShow = gameOverResponse.cardsToShow;

        const setActionKeysResponse = await this.responseHandler.setActionKeys(params);
        return setActionKeysResponse;
    };


    // Old
    // var isGameProgress = function (params, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'in leaveRemote function isGameProgress');
    //     keyValidator.validateKeySets("Request", params.serverType, "isGameProgress", params, function (validated) {
    //       if (validated.success) {
    //         if (params.table.state === stateOfX.gameState.running) {
    //           cb({ success: true, isGameOver: false });
    //         } else {
    //           handleGameOver.processGameOver(params, function (gameOverResponse) {
    //             serverLog(stateOfX.serverLogType.info, 'Game over response in leaveRemote - ' + JSON.stringify(gameOverResponse));
    //             if (gameOverResponse.success) {
    //               params = gameOverResponse.params;
    //               serverLog(stateOfX.serverLogType.info, 'isCurrentPlayer while respone after GAME OVER - ' + params.data.isCurrentPlayer);
    //               params = gameOverResponse.params;
    //               params.data.success = true;
    //               params.data.roundOver = true;
    //               params.data.isGameOver = true;
    //               params.data.currentBoardCard = params.data.remainingBoardCards;
    //               params.data.winners = gameOverResponse.winners;
    //               params.data.rakeDeducted = gameOverResponse.rakeDeducted;
    //               params.data.cardsToShow = gameOverResponse.cardsToShow;
    //               responseHandler.setActionKeys(params, function (setActionKeysResponse) {
    //                 cb(setActionKeysResponse);
    //               });
    //             } else {
    //               cb(gameOverResponse);
    //             }
    //           });
    //         }
    //       } else {
    //         cb(validated);
    //       }
    //     });
    //   }
    /*============================  END  =================================*/



    /*============================  START  =================================*/
    // ### Add additional params for calculation
    //   New
    async initializeParams(params: any): Promise<any> {

        const isGameProgressResponse = await this.isGameProgress(params);

        if (isGameProgressResponse.success && !isGameProgressResponse.isGameOver) {
            params.data = _.omit(params.data, '__route__');
            params.data.action = params.data.isStandup ? stateOfX.move.standup : stateOfX.move.leave;
            params.data.index = _ld.findIndex(params.table.players, { playerId: params.data.playerId });
            params.data.state = null;

            if (params.data.index >= 0) {
                // If player has taken a seat on table
                params.data.state = params.table.players[params.data.index].state;
            }

            params.data.isCurrentPlayer = false;
            params.data.roundOver = false;
            params.data.isGameOver = params.table.state === stateOfX.gameState.gameOver;
            params.data.chips = 0;
            params.data.amount = 0;
            params.data.pot = _.pluck(params.table.pot, 'amount');
            params.data.currentBoardCard = [[], []];
            params.data.isSeatsAvailable = false;

            return params;
        } else {
            return isGameProgressResponse;
        }
    };


    //   Old
    //   var initializeParams = function (params, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'in leaveRemote function initializeParams');
    //     isGameProgress(params, function (isGameProgressResponse) {
    //       if (isGameProgressResponse.success && !isGameProgressResponse.isGameOver) {
    //         params.data = _.omit(params.data, '__route__');
    //         params.data.action = params.data.isStandup ? stateOfX.move.standup : stateOfX.move.leave;
    //         params.data.index = _ld.findIndex(params.table.players, { playerId: params.data.playerId });
    //         params.data.state = null;
    //         if (params.data.index >= 0) {
    //           // If player has taken a seat on table
    //           params.data.state = params.table.players[params.data.index].state;
    //           // params.data.preState        = // todo
    //           serverLog(stateOfX.serverLogType.info, 'Player details who is going to leave - ' + JSON.stringify(params.table.players[params.data.index]));
    //         }
    //         params.data.isCurrentPlayer = false;
    //         params.data.roundOver = false;
    //         params.data.isGameOver = (params.table.state === stateOfX.gameState.gameOver);
    //         params.data.chips = 0;
    //         params.data.amount = 0;
    //         params.data.pot = _.pluck(params.table.pot, 'amount');
    //         params.data.currentBoardCard = [[], []];
    //         params.data.isSeatsAvailable = false;
    //         serverLog(stateOfX.serverLogType.info, 'Player ' + params.data.playerName + ' at index - ' + params.data.index + ' has state - ' + params.data.state + ' is going to ' + params.data.action + ' while game is running.')
    //         cb(null, params)
    //       } else {
    //         cb(isGameProgressResponse);
    //       }
    //     });
    //   }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    // Validate if this standup or leave is allowed for this player
    // check cases as listed (with exported function)
    //   New
    async checkOrigin(params: any): Promise<any> {

        const origin = params.data.origin;
        const index = params.data.index;
        const player = index >= 0 ? params.table.players[index] : null;

        if (!origin) {
            return params;
        }

        switch (origin) {
            case 'kickToLobby':
                if (index < 0) {
                    return params;
                } else {
                    return {
                        success: false,
                        channelId: params.channelId,
                        info: 'Kick to lobby is only allowed for observer.',
                    };
                }

            case 'vacantSeat':
                if (
                    index >= 0 &&
                    (player.state === stateOfX.playerState.reserved ||
                        (player.state === stateOfX.playerState.disconnected &&
                            player.previousState === stateOfX.playerState.reserved) ||
                        player.chips === 0)
                ) {
                    return params;
                } else if (index < 0) {
                    return params;
                } else {
                    return {
                        success: false,
                        channelId: params.channelId,
                        info: 'Vacant reserved seat is only allowed for observer/ RESERVED sitting.',
                    };
                }

            case 'tableIdleTimer':
                if (params.table.state === stateOfX.gameState.idle) {
                    return params;
                } else {
                    return {
                        success: false,
                        channelId: params.channelId,
                        info: 'Leave on idle table is only allowed when idle table.',
                    };
                }

            case 'idlePlayer':
                if (
                    index >= 0 &&
                    player.state === stateOfX.playerState.onBreak
                ) {
                    return params;
                } else if (index < 0) {
                    return params;
                } else {
                    return {
                        success: false,
                        channelId: params.channelId,
                        info: 'Idle player removal is only allowed for observer/ ONBREAK sitting.',
                    };
                }

            default:
                return params;
        }
    };


    //   Old
    //   var checkOrigin = function (params, cb) {
    //     // here is the issue
    //     console.error('.......,,,,,,,inside  checkOrigin', params)
    //     if (params.data.origin) {
    //       if (params.data.origin == 'kickToLobby') {
    //         if (params.data.index < 0) {
    //           // params.data.isStandup = false;
    //           cb(null, params);
    //         } else {
    //         cb({ success: false, channelId: params.channelId, info: 'Kick to lobby is only allowed for observer.' });
    //         }
    //       } else if (params.data.origin == 'vacantSeat') {
    //         if (params.data.index >= 0
    //           && (
    //             params.table.players[params.data.index].state == stateOfX.playerState.reserved
    //             || (
    //               params.table.players[params.data.index].state == stateOfX.playerState.disconnected
    //               && params.table.players[params.data.index].previousState == stateOfX.playerState.reserved
    //             )
    //             || params.table.players[params.data.index].chips == 0
    //           )
    //         ) {
    //           cb(null, params);
    //         } else {
    //           if (params.data.index < 0) {
    //             cb(null, params);
    //           } else {
    //             cb({ success: false, channelId: params.channelId, info: 'Vacant reserved seat is only allowed for observer/ RESERVED sitting.' });
    //           }
    //         }
    //       } else if (params.data.origin == 'tableIdleTimer') {
    //         if (params.table.state == stateOfX.gameState.idle) {
    //           cb(null, params);
    //         } else {
    //           cb({ success: false, channelId: params.channelId, info: 'Leave on idle table is only allowed when idle table.' });
    //         }
    //       } else if (params.data.origin == 'idlePlayer') {
    //         if (params.data.index >= 0 && params.table.players[params.data.index].state == stateOfX.playerState.onBreak) {
    //           cb(null, params);
    //         } else {
    //           if (params.data.index < 0) {
    //             cb(null, params);
    //           } else {
    //             cb({ success: false, channelId: params.channelId, info: 'Idle player removal is only allowed for observer/ ONBREAK sitting.' });
    //           }
    //         }
    //       } else {
    //         cb(null, params);
    //       }
    //     } else {
    //       cb(null, params);
    //     }
    //   }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    // > Spectator player cannot opt to standup
    //   New
    validateAction(params: any) {
        // Check if the player is not seated and attempts to stand up
        if (params.data.index < 0 && params.data.action === stateOfX.move.standup) {
            return {
                success: false,
                channelId: params.channelId,
                info: "You are not allowed to " + params.data.action + ", please choose Leave.",
                isRetry: false,
                isDisplay: false,
                channelId: "",
            };
        } else {
            // Proceed to check the origin
            return await this.checkOrigin(params);
        }
    };


    //   Old
    //   var validateAction = function (params, cb) {
    //     // console.log("in validate action the params are", params);
    //     if (params.data.index < 0 && params.data.action === stateOfX.move.standup) {
    //       console.log("params.data.index < 0 && params.data.action === stateOfX.move.standup", params.data.index < 0 && params.data.action === stateOfX.move.standup)
    //       cb({ success: false, channelId: params.channelId, info: "You are not allowed to " + params.data.action + ", please choose Leave.", isRetry: false, isDisplay: false, channelId: "" });
    //     }
    //     // else if(params.){
    //     //   cb({ success: false, channelId: params.channelId, info: "You are not allowed to " + params.data.action + ", please complete your CT.", isRetry: false, isDisplay: false, channelId: "" });
    //     // }
    //     else {
    //       checkOrigin(params, cb);
    //       // cb(null, params);
    //     }
    //   }
    /*============================  END  =================================*/



    /*============================  START  =================================*/
    // New
    async getAllPlayerScore(params: any): Promise<any> {
        try {
            const res = await this.imdb.getAllPlayerBuyInSum(params);
            for (const buyIn of res) {
                const pla = _.pick(buyIn, '_id', 'totalBuyIns');
                if (params.data.playerId === pla._id) {
                    params.totalBuyIns = pla.totalBuyIns;
                    break;
                }
            }
            return params;
        } catch (error) {
            throw error;
        }
    };


    // Old
    //   var getAllPlayerScore = function (params, cb) {
    //     // console.log("***********getAllPlayerScore**********", params)
    //     imdb.getAllPlayerBuyInSum(params, function (err, res) {
    //         _.map(res, function (buyIn) {
    //             let pla = _.pick(buyIn, '_id', 'totalBuyIns');
    //             if (params.data.playerId == pla._id) {
    //                 params.totalBuyIns = pla.totalBuyIns;
    //             }
    //         })
    //         // params.playerScoreList = res;
    //         // console.log("***********getAllPlayerBuyInSum**********")
    //         // console.log("err", err)
    //         // console.log("res", res)
    //         cb(null, params);
    //     })
    // }
    /*============================  END  =================================*/



    /*============================  START  =================================*/
    // player can not leave if he has round bet
    // New
    async isLeavePossible(params: any): Promise<any> {
        if (params.data.origin === 'dashboard') {
            if (params.data.index >= 0 && params.table.players[params.data.index].totalRoundBet > 0) {
                if (params.table.players[params.data.index].lastMove === stateOfX.move.fold) {
                    return params;
                } else {
                    throw {
                        success: false,
                        channelId: params.data.channelId,
                        info: "You Cannot kick this player as player has bet in round.",
                        isRetry: false,
                        isDisplay: true
                    };
                }
            } else {
                return params;
            }
        } else {
            if (params.data.index >= 0 && params.table.players[params.data.index].totalRoundBet > 0) {
                if (params.table.players[params.data.index].lastMove === stateOfX.move.fold) {
                    return params;
                } else {
                    throw {
                        success: false,
                        channelId: params.data.channelId,
                        info: "You Cannot Leave as you have bet in round.",
                        isRetry: false,
                        isDisplay: true
                    };
                }
            } else if (
                (params.data.index >= 0) &&
                (params.table.players[params.data.index].playerId === params.data.playerId) &&
                (params.table.isCTEnabledTable) &&
                (params.table.players[params.data.index].chips > params.totalBuyIns) &&
                (!params.table.players[params.data.index].playerCallTimer.isCallTimeOver) &&
                (params.table.players.length > 1)
            ) {
                throw {
                    success: false,
                    channelId: params.data.channelId,
                    info: "You Cannot Leave as you are on winning",
                    isRetry: false,
                    isDisplay: true
                };
            } else {
                return params;
            }
        }
    }

    // Old
    // var isLeavePossible = function (params, cb) {
    //     // console.log("params inside leave possible function ", params,);
    //     // console.log("params inside leave possible function ", params.table.players);
    //     // console.log("params table players value ",params.table.players.includes(params.data.playerId));

    //     // let isPlayerWinning = false;
    //     // for (let i = 0; i < params.table.players.length; i++) {
    //     //   if (params.table.players[i].playerId == params.data.playerId) {
    //     //     console.log("its meeeeeeeeeeeeeeeeee i am on");
    //     //   }
    //     // }

    //     // for (let i = 0; i < params.table.players.length; i++) {
    //     // imdb.getAllPlayerBuyInSum(params.table, function (err, res) {
    //     //   console.log("***********getAllPlayerBuyInSum**********")
    //     //   console.log("err", err)
    //     //   console.log(
    //     //     "th response is ", res
    //     //   )
    //     //   console.log(res[params.data.index])
    //     //   console.log("res", JSON.stringify(res._id))

    //     //     // _.each(params.table.players, (player) => {
    //     //     //   console.log("the player inside each function is ",player)
    //     //     //   let pMatch = _.where(res, { _id: player.playerId })
    //     //     //   console.log("the response is _each funtion is ",res[i].totalBuyIns,params.table.players[i].onGameStartBuyIn);
    //     //     //   if (pMatch.length) {
    //     //     //       if ((params.table.players[i].playerId==params.data.playerId)&&(params.table.players[i].onGameStartBuyIn > res[i].totalBuyIns) && (params.table.isCTEnabledTable) && (!params.table.players[i].playerCallTimer.isCallTimeOver)) {
    //     //     //         console.log("-------------------------------------printing is call time over value ", params.table.players[i].playerCallTimer.isCallTimeOver);
    //     //     //         cb({ success: false, channelId: params.data.channelId, info: "You Cannot Leave as you are on winning", isRetry: false, isDisplay: true });
    //     //     //       } else {
    //     //     //         cb(null,params);
    //     //     //       }

    //     //     //   } 
    //     //     //   console.log('playerscore and chips at game end: ', pMatch);
    //     //     // })

    //     // })

    //     // cb(null, params);
    //     // console.log("printing is call time over value ", (params.table.isCTEnabledTable) && (params.table.players[i].chips > params.table.players[i].onSitBuyIn) && (!params.table.players[i].playerCallTimer.isCallTimeOver));
    //     // }

    //     // if(params.data.index>=0&&params.table.players[params.data.index].playerId==params.data.playerId){
    //     //   imdb.getAllPlayerBuyInSum(params.table, function (err, res) {
    //     //     console.log("***********getAllPlayerBuyInSum**********")
    //     //     console.log("err", err)
    //     //     console.log(
    //     //       "th response is ", res
    //     //     )
    //     //   })
    //     //   if ((params.table.players[params.data.index].playerId==params.data.playerId)&&(params.table.players[params.data.index].onGameStartBuyIn > res[i].totalBuyIns) && (params.table.isCTEnabledTable) && (!params.table.players[i].playerCallTimer.isCallTimeOver))
    //     // }
    //     // if ((params.data.index >= 0) && (params.table.players[params.data.index].playerId == params.data.playerId) && (params.table.players[params.data.index].onGameStartBuyIn > params.playerScoreList[params.data.index].totalBuyIns) && (!params.table.players[params.data.index].playerCallTimer.isCallTimeOver)) {
    //     //   // console.log("-------------------------------------printing is call time over value ", params.table.players[i].playerCallTimer.isCallTimeOver);
    //     //   cb({ success: false, channelId: params.data.channelId, info: "You Cannot Leave as you are on winning", isRetry: false, isDisplay: true });
    //     // }
    //     // console.log("-------------------------------------printing is call time over value playerScore", params.table.players[params.data.index].playerScore );
    //     //   console.log("-------------------------------------printing is call time over value chips", params.table.players[params.data.index].chips );
    //     //   console.log("-------------------------------------printing is call time over value totalBuyIns", params.playerScoreList[params.data.index].totalBuyIns); 
    //     // console.log("-------------------------------------printing is call time over value",params.table.players[params.data.index],params.table.players.length)
    //     if (params.data.origin === 'dashboard') {
    //         if (params.data.index >= 0 && params.table.players[params.data.index].totalRoundBet > 0) {
    //             if (params.table.players[params.data.index].lastMove == stateOfX.move.fold) {
    //                 cb(null, params);
    //             } else {
    //                 cb({ success: false, channelId: params.data.channelId, info: "You Cannot kick this player as player has bet in round.", isRetry: false, isDisplay: true });
    //             }
    //         }
    //         else {
    //             cb(null, params);
    //         }
    //     }
    //     else {
    //         if (params.data.index >= 0 && params.table.players[params.data.index].totalRoundBet > 0) {
    //             if (params.table.players[params.data.index].lastMove == stateOfX.move.fold) {
    //                 cb(null, params);
    //             } else {
    //                 cb({ success: false, channelId: params.data.channelId, info: "You Cannot Leave as you have bet in round.", isRetry: false, isDisplay: true });
    //             }
    //         }
    //         else if ((params.data.index >= 0) && (params.table.players[params.data.index].playerId == params.data.playerId) && (params.table.isCTEnabledTable) &&
    //             (params.table.players[params.data.index].chips > params.totalBuyIns) &&
    //             (!params.table.players[params.data.index].playerCallTimer.isCallTimeOver) && (params.table.players.length > 1)) {
    //             cb({ success: false, channelId: params.data.channelId, info: "You Cannot Leave as you are on winning", isRetry: false, isDisplay: true });
    //         } else {
    //             cb(null, params);
    //         }
    //     }
    // }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    // set player state as ONLEAVE
    // New
    async updatePlayer(params: any): Promise<any> {

        const isGameProgressResponse = await this.isGameProgress(params);

        if (isGameProgressResponse.success && !isGameProgressResponse.isGameOver) {
            if (params.data.index >= 0) {
                params.table.players[params.data.index].state = stateOfX.playerState.onleave;
                params.table.players[params.data.index].active = false;
            }
            return params;
        } else {
            throw isGameProgressResponse;
        }
    };


    // Old
    // var updatePlayer = function (params, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'in leaveRemote function updatePlayer');
    //     isGameProgress(params, function (isGameProgressResponse) {
    //         if (isGameProgressResponse.success && !isGameProgressResponse.isGameOver) {
    //             if (params.data.index >= 0) {
    //                 // console.log('in leaveRemote function updatePlayer',params.table);
    //                 // summary.playerLeave(params,params.table.players[params.data.index].seatIndex,function(summary){
    //                 //   console.log("summary",summary);
    //                 // })
    //                 params.table.players[params.data.index].state = stateOfX.playerState.onleave;
    //                 params.table.players[params.data.index].active = false;

    //             }
    //             cb(null, params);
    //         } else {
    //             cb(isGameProgressResponse);
    //         }
    //     });
    // };
    /*============================  END  =================================*/



    /*============================  START  =================================*/
    // set isCurrentPlayer true if player who had turn, try to leave
    // New
    async isCurrentPlayer(params: any): Promise<any> {

        const isGameProgressResponse = await this.isGameProgress(params);

        if (isGameProgressResponse.success && !isGameProgressResponse.isGameOver) {
            if (params.data.index >= 0) {
                params.data.isCurrentPlayer = params.data.index === params.table.currentMoveIndex;
            }
            return params;
        } else {
            throw isGameProgressResponse;
        }
    };


    // Old
    // var isCurrentPlayer = function (params, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'in leaveRemote function isCurrentPlayer');
    //     isGameProgress(params, function (isGameProgressResponse) {
    //         if (isGameProgressResponse.success && !isGameProgressResponse.isGameOver) {
    //             if (params.data.index >= 0) {
    //                 serverLog(stateOfX.serverLogType.info, 'Resetting isCurrentPlayer')
    //                 params.data.isCurrentPlayer = params.data.index === params.table.currentMoveIndex;
    //                 serverLog(stateOfX.serverLogType.info, 'Updated isCurrentPlayer - ' + params.data.isCurrentPlayer)
    //             }
    //             cb(null, params);
    //         } else {
    //             cb(isGameProgressResponse);
    //         }
    //     });
    // };
    /*============================  END  =================================*/



    /*============================  START  =================================*/
    // Update current player and first active player indexes
    // New
    async updateConfigIndexes(params: any): Promise<any> {
        const isGameProgressResponse = await this.isGameProgress(params);

        if (isGameProgressResponse.success && !isGameProgressResponse.isGameOver) {
            // Update currentMoveIndex if required

            if (params.data.index >= 0) {

                if (params.data.index < params.table.currentMoveIndex) {
                    if (params.table.currentMoveIndex - 1 >= 0) {
                        params.table.currentMoveIndex = params.table.currentMoveIndex - 1;
                    }
                }

                if (params.data.index < params.table.firstActiveIndex) {
                    if (params.table.firstActiveIndex - 1 >= 0) {
                        params.table.firstActiveIndex = params.table.firstActiveIndex - 1;
                    }
                }
            } else {
                console.log(stateOfX.serverLogType.info, 'Player hasnt taken a seat or not PLAYING in the table while ' + params.data.action + ' !');
            }

            return params;
        } else {
            throw isGameProgressResponse;
        }
    };


    // Old
    // var updateConfigIndexes = function (params, cb) {
    //     isGameProgress(params, function (isGameProgressResponse) {
    //         if (isGameProgressResponse.success && !isGameProgressResponse.isGameOver) {
    //             // Update currentMoveIndex if required
    //             // In case of player leave in between from array
    //             serverLog(stateOfX.serverLogType.info, '-------- Updating config indexes -------');
    //             // Do not add PLAYING state condition as any player on the table leave will
    //             // update the indexes of config players
    //             if (params.data.index >= 0) {
    //                 serverLog(stateOfX.serverLogType.info, 'Player has taken a seat on table')
    //                 // serverLog(stateOfX.serverLogType.info,'table while removing player - ' + JSON.stringify(_.omit(params.table, 'deck')))
    //                 serverLog(stateOfX.serverLogType.info, 'players while leave - ' + JSON.stringify(params.table.players))
    //                 serverLog(stateOfX.serverLogType.info, 'currentMoveIndex - ' + params.table.currentMoveIndex)
    //                 serverLog(stateOfX.serverLogType.info, 'firstActiveIndex - ' + params.table.firstActiveIndex)
    //                 serverLog(stateOfX.serverLogType.info, 'Index of player to leave - ' + params.data.index)
    //                 // serverLog(stateOfX.serverLogType.info,'Active players - ' + JSON.stringify(activePlayers));
    //                 // If player left before config index then reduce config indexes
    //                 if (params.data.index < params.table.currentMoveIndex) {
    //                     serverLog(stateOfX.serverLogType.info, 'Player left before config indexes SETTING current player');
    //                     if (params.table.currentMoveIndex - 1 >= 0) {
    //                         params.table.currentMoveIndex = params.table.currentMoveIndex - 1;
    //                     }
    //                     serverLog(stateOfX.serverLogType.info, 'New currentMoveIndex should be - ' + params.table.currentMoveIndex)
    //                 }
    //                 // If player left before config index then reduce config indexes
    //                 if (params.data.index < params.table.firstActiveIndex) {
    //                     serverLog(stateOfX.serverLogType.info, 'Player left before config indexes SETTING first active player index');
    //                     if (params.table.firstActiveIndex - 1 >= 0) {
    //                         params.table.firstActiveIndex = params.table.firstActiveIndex - 1;
    //                     }
    //                     serverLog(stateOfX.serverLogType.info, 'New firstActiveIndex should be - ' + params.table.firstActiveIndex)
    //                 }
    //             } else {
    //                 serverLog(stateOfX.serverLogType.info, 'Player hasnt taken a seat or not PLAYING in the table while ' + params.data.action + ' !')
    //             }
    //             cb(null, params);
    //         } else {
    //             cb(isGameProgressResponse);
    //         }
    //     });
    // }
    /*============================  END  =================================*/



    /*============================  START  =================================*/
    // check for game over by
    // is there any player with move?
    // New
    async validateGameOver(params: any): Promise<any> {
        const isGameProgressResponse = await this.isGameProgress(params);

        if (isGameProgressResponse.success && !isGameProgressResponse.isGameOver) {

            if (params.data.index >= 0) {
                if (
                    params.data.state !== stateOfX.playerState.waiting &&
                    params.data.state !== stateOfX.playerState.outOfMoney &&
                    params.data.state !== stateOfX.playerState.onBreak
                ) {
                    if (this.tableManager.isPlayerWithMove(params) === false) {
                        params.table.state = stateOfX.gameState.gameOver;
                    } else {
                        console.log(stateOfX.serverLogType.info, 'There are players with move left in the game.');
                    }
                } else {
                    console.log(
                        stateOfX.serverLogType.info,
                        'NOT CHECKING Game Over as playing with - ' + params.table.players[params.data.index].state + ' left the game!'
                    );
                }
            } else {
                console.log(stateOfX.serverLogType.info, 'NOT CHECKING Game Over as player not taken a seat left the game!');
            }

            return params;
        } else {
            throw isGameProgressResponse;
        }
    };


    // Old
    // var validateGameOver = function (params, cb) {
    //     // Check if Game should over after this leave
    //     // Game will over if there is only one active player left or
    //     // ALLIN player also consider as inactive then we need to check all players made their move
    //     // We are not considering here if the player with move left or any other player left
    //     // As Game can over either conditions
    //     isGameProgress(params, function (isGameProgressResponse) {
    //         if (isGameProgressResponse.success && !isGameProgressResponse.isGameOver) {
    //             serverLog(stateOfX.serverLogType.info, '-------- Validating Game Over -------');
    //             serverLog(stateOfX.serverLogType.info, 'Player who has move left? - ' + params.data.isCurrentPlayer);
    //             if (params.data.index >= 0) {
    //                 if (params.data.state !== stateOfX.playerState.waiting && params.data.state !== stateOfX.playerState.outOfMoney && params.data.state !== stateOfX.playerState.onBreak) {
    //                     if (tableManager.isPlayerWithMove(params) === false) {
    //                         serverLog(stateOfX.serverLogType.info, 'There are no players with move left into the game, Game Over!')
    //                         params.table.state = stateOfX.gameState.gameOver;
    //                     } else {
    //                         serverLog(stateOfX.serverLogType.info, 'There are players with move left in the game.')
    //                     }
    //                 } else {
    //                     serverLog(stateOfX.serverLogType.info, 'NOT CHECKING Game Over as playing with - ' + params.table.players[params.data.index].state + ' left the game!');
    //                 }

    //             } else {
    //                 serverLog(stateOfX.serverLogType.info, 'NOT CHECKING Game Over as player not taken a seat left the game!');
    //             }
    //             cb(null, params);
    //         } else {
    //             cb(isGameProgressResponse);
    //         }
    //     });
    // }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    // remove activity saved for user in disconnectin handling.
    // use of this - deprecated
    // New
    async removeActivity(params: any): Promise<any> {


        if ((params.data.action !== stateOfX.move.standup) || (!params.data.isRequested)) {
            const response = await this.imdb.removeActivity({ channelId: params.channelId, playerId: params.data.playerId });

            if (response) {
                return params;
            } else {
                throw {
                    success: false,
                    isRetry: false,
                    isDisplay: false,
                    channelId: params.channelId || "",
                    tableId: params.tableId,
                    info: this.popupTextManagerFromdb.IMDBREMOTEACTIVITY_REMOTEACTIVITY_LEAVEREMOTE
                };
            }
        } else {
            return params;
        }
    };


    // Old
    // var removeActivity = function (params, cb) {
    //     console.log("inside removeActivity fx", params.data)
    //     console.log("inside removeActivity fx", (params.data.action !== stateOfX.move.standup))
    //     console.log("inside removeActivity fx", !params.data.isRequested)
    //     console.log("inside removeActivity fx", (params.data.action !== stateOfX.move.standup) || (!params.data.isRequested))
    //     serverLog(stateOfX.serverLogType.info, 'in leaveRemote function removeActivity');
    //     serverLog(stateOfX.serverLogType.info, 'Action while removing record activity: ' + params.data.action);
    //     if ((params.data.action !== stateOfX.move.standup) || (!params.data.isRequested)) {
    //         imdb.removeActivity({ channelId: params.channelId, playerId: params.data.playerId }, function (err, response) {
    //             if (!err && !!response) {
    //                 serverLog(stateOfX.serverLogType.info, 'succefully remove activity from in memory for leave in disconnectin handling');
    //                 cb(null, params);
    //             } else {
    //                 cb({ success: false, isRetry: false, isDisplay: false, channelId: (params.channelId || ""), tableId: params.tableId, info: popupTextManagerFromdb.IMDBREMOTEACTIVITY_REMOTEACTIVITY_LEAVEREMOTE });
    //                 //cb({success: false, isDisplay: false, isRetry: false, channelId: params.channelId, tableId: params.tableId, info: 'Unable to remove player activity from in memory'});
    //             }
    //         });
    //     } else {
    //         cb(null, params);
    //     }
    // }
    /*============================  END  =================================*/



    /*============================  START  =================================*/
    // Remove spectator record associated to this player and this table
    // New
    async removeSpectatorRecord(params: any): Promise<any> {

        try {
            if (params.data.action !== stateOfX.move.standup) {
                await this.imdb.removeTableSetting({ channelId: params.channelId, playerId: params.data.playerId });
            } else {
                await this.imdb.updateTableSetting(
                    { channelId: params.channelId, playerId: params.data.playerId },
                    { $set: { status: "spectator" } }
                );
            }
            return params;
        } catch (err) {
            throw {
                success: false,
                isRetry: false,
                isDisplay: false,
                channelId: params.channelId || "",
                info: this.popupTextManagerFromdb.DB_REMOVETABLESPECTATOR_FAIL
            };
        }
    };


    // Old
    // var removeSpectatorRecord = function (params, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'in leaveRemote function removeSpectatorRecord');
    //     if ((params.data.action !== stateOfX.move.standup)) {
    //         //console.error(stateOfX.serverLogType.info, 'in leaveRemote function removeSpectatorRecord',params);
    //         imdb.removeTableSetting({ channelId: params.channelId, playerId: params.data.playerId }, function (err, response) {
    //             if (err) {
    //                 cb({ success: false, isRetry: false, isDisplay: false, channelId: (params.channelId || ""), info: popupTextManagerFromdb.DB_REMOVETABLESPECTATOR_FAIL });
    //             } else {
    //                 cb(null, params);
    //             }
    //         })
    //     } else {
    //         imdb.updateTableSetting({ channelId: params.channelId, playerId: params.data.playerId }, { $set: { status: "spectator" } }, function (err, response) {
    //             if (err) {
    //                 cb({ success: false, isRetry: false, isDisplay: false, channelId: (params.channelId || ""), info: popupTextManagerFromdb.DB_REMOVETABLESPECTATOR_FAIL });
    //             } else {
    //                 cb(null, params);
    //             }
    //         })
    //     }
    // };
    /*============================  END  =================================*/



    /*============================  START  =================================*/
    // generate summary text on leave and add to params.table.summaryOfAllPlayers
    // New
    async onLeaveSummary(params: any): Promise<any> {
        if (params.data.state === stateOfX.playerState.playing) {
            summary.onLeave(params);
            activity.leaveGame(params, stateOfX.profile.category.gamePlay, stateOfX.gamePlay.subCategory.leave, stateOfX.logType.success);
            activity.leaveGame(params, stateOfX.profile.category.game, stateOfX.game.subCategory.leave, stateOfX.logType.success);
        }
        return params;
    };

    // Old
    // var onLeaveSummary = function (params, cb) {
    //     if (params.data.state == stateOfX.playerState.playing) {
    //         summary.onLeave(params);
    //         activity.leaveGame(params, stateOfX.profile.category.gamePlay, stateOfX.gamePlay.subCategory.leave, stateOfX.logType.success);
    //         activity.leaveGame(params, stateOfX.profile.category.game, stateOfX.game.subCategory.leave, stateOfX.logType.success);
    //     }
    //     cb(null, params);
    // }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    // New
    async removeFromTable(params: any): Promise<any> {

        if (params.data.index >= 0) {
            const removedPlayers = params.table.players.splice(params.data.index, 1); // splice returns removed elements array
            if (removedPlayers.length > 0) {
                params.table.removedPlayers = params.table.removedPlayers || [];
                // adding removed players ONLY if not there already
                const len = params.table.removedPlayers.length;
                for (let i = 0; i < removedPlayers.length; i++) {
                    let already = false;
                    for (let j = 0; j < len; j++) {
                        if (removedPlayers[i].playerId === params.table.removedPlayers[j].playerId) {
                            already = true;
                            break;
                        }
                    }
                    if (!already) {
                        params.table.removedPlayers.push(removedPlayers[i]);
                    }
                }
            }
            // Assign additional properties to the first removed player
            if (removedPlayers.length > 0) {
                removedPlayers[0].referenceNumber = params.data.referenceNumber;
                removedPlayers[0].tablename = params.table.gameInfo['Table Name'];
            }
        }

        try {
            if (params.data.isStandup) {
                await this.imdb.upsertPlayerJoin(
                    { channelId: params.channelId, playerId: params.data.playerId },
                    {
                        $setOnInsert: {
                            playerName: params.playerName,
                            channelType: params.channelType,
                            firstJoined: Number(new Date())
                        },
                        $set: {
                            observerSince: Number(new Date()),
                            event: 'standup'
                        }
                    }
                );
            } else {
                await this.imdb.removePlayerJoin({ channelId: params.channelId, playerId: params.data.playerId });
            }
            return params;
        } catch (err) {
            throw {
                success: false,
                isRetry: false,
                isDisplay: false,
                channelId: params.channelId || "",
                tableId: params.tableId,
                info: this.popupTextManagerFromdb.IMDBREMOVEPLAYERJOIN_REMOVEFROMTABLE_LEAVEREMOTE
            };
        }
    };


    // Old
    // var removeFromTable = function (params, cb) {
    //     console.log("// Remove player object from player array on table// Remove player object from player array on table// Remove player object from player array on table ", params.data.referenceNumber)
    //     serverLog(stateOfX.serverLogType.info, 'in leaveRemote function removeFromTable', params);
    //     console.log("referenceNumber is", params.data.referenceNumber)
    //     if (params.data.index >= 0) {
    //         var removedPlayers = params.table.players.splice(params.data.index, 1); // splice returns removed elements array
    //         if (removedPlayers.length > 0) {
    //             params.table.removedPlayers = params.table.removedPlayers || [];
    //             // adding removed players ONLY if not there already
    //             var len = params.table.removedPlayers.length;
    //             for (var i = 0; i < removedPlayers.length; i++) {
    //                 var already = false;
    //                 for (var j = 0; j < len; j++) {
    //                     if (removedPlayers[i].playerId === params.table.removedPlayers[j].playerId) {
    //                         already = true;
    //                         break;
    //                     }
    //                 }
    //                 if (!already) {
    //                     params.table.removedPlayers.push(removedPlayers[i]);
    //                 }
    //             }
    //         }
    //         removedPlayers.referenceNumber = params.data.referenceNumber;
    //         console.log('removedPlayers 22222222 ', removedPlayers);
    //         removedPlayers.tablename = params.table.gameInfo['Table Name'];
    //         removedPlayers.referenceNumber = params.data.referenceNumber;
    //         // mthEntry(removedPlayers);
    //     }
    //     if (params.data.isStandup) {
    //         //   params.table.players.splice(params.data.index, 1);
    //         imdb.upsertPlayerJoin({ channelId: params.channelId, playerId: params.data.playerId }, { $setOnInsert: { playerName: params.playerName, channelType: params.channelType, firstJoined: Number(new Date()) }, $set: {/*networkIp: params.networkIp,*/ observerSince: Number(new Date()), event: 'standup' } }, function (err, response) {
    //             if (!err && response) {
    //                 cb(null, params);
    //             } else {
    //                 cb({ success: false, isRetry: false, isDisplay: false, channelId: (params.channelId || ""), tableId: params.tableId, info: popupTextManagerFromdb.IMDBREMOVEPLAYERJOIN_REMOVEFROMTABLE_LEAVEREMOTE });
    //                 //cb({success: false, channelId: params.channelId, tableId: params.tableId, info: 'Unable to remove player record in join - ' + JSON.stringify(err)});
    //             }
    //         });
    //         // cb(null, params);
    //     } else {
    //         imdb.removePlayerJoin({ channelId: params.channelId, playerId: params.data.playerId }, function (err, response) {
    //             if (!err && response) {
    //                 cb(null, params);
    //             } else {
    //                 cb({ success: false, isRetry: false, isDisplay: false, channelId: (params.channelId || ""), tableId: params.tableId, info: popupTextManagerFromdb.IMDBREMOVEPLAYERJOIN_REMOVEFROMTABLE_LEAVEREMOTE });
    //                 //cb({success: false, channelId: params.channelId, tableId: params.tableId, info: 'Unable to remove player record in join - ' + JSON.stringify(err)});
    //             }
    //         });
    //     }
    //     // if(params.data.index >= 0) {
    //     //   serverLog(stateOfX.serverLogType.info,'Removing player from table');
    //     //   imdb.removePlayerJoin({channelId: params.channelId, playerId: params.data.playerId}, function(err, response){
    //     //     if(!err && response) {
    //     //       cb(null, params);
    //     //     } else {
    //     //       cb({success: false, isRetry: false, isDisplay: false, channelId: (params.channelId || ""), tableId: params.tableId,info: popupTextManagerFromdb.IMDBREMOVEPLAYERJOIN_REMOVEFROMTABLE_LEAVEREMOTE});
    //     //       //cb({success: false, channelId: params.channelId, tableId: params.tableId, info: 'Unable to remove player record in join - ' + JSON.stringify(err)});
    //     //     }
    //     //   });
    //     // } else {
    //     //   serverLog(stateOfX.serverLogType.info, 'Player hasnt taken seat, so removing from db records only, Running Game.');
    //     //   imdb.removePlayerJoin({channelId: params.channelId, playerId: params.data.playerId}, function(err, response){
    //     //     if(!err && response) {
    //     //       cb(null, params);
    //     //     } else {
    //     //       cb({success: false, isRetry: false, isDisplay: false, channelId: (params.channelId || ""), tableId: params.tableId,info: popupTextManagerFromdb.IMDBREMOVEPLAYERJOIN_REMOVEFROMTABLE_LEAVEREMOTE});
    //     //       //cb({success: false, channelId: params.channelId, tableId: params.tableId, info: 'Unable to remove player record in join - ' + JSON.stringify(err)});
    //     //     }
    //     //   });
    //     // }
    // };
    /*============================  END  =================================*/



    /*============================  START  =================================*/
    // check if current betting round is over due to this player leave action
    // New
    async isRoundOver(params: any): Promise<any> {

        const isGameProgressResponse = await this.isGameProgress(params);
        if (isGameProgressResponse.success && !isGameProgressResponse.isGameOver) {
            const processRoundOverResponse = await this.roundOver.processRoundOver(params);
            if (processRoundOverResponse.success && !processRoundOverResponse.isGameOver) {
                return processRoundOverResponse.params;
            } else {
                throw processRoundOverResponse;
            }
        } else {
            throw isGameProgressResponse;
        }
    };


    // Old
    // var isRoundOver = function (params, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'in leaveRemote function isRoundOver');
    //     isGameProgress(params, function (isGameProgressResponse) {
    //         if (isGameProgressResponse.success && !isGameProgressResponse.isGameOver) {
    //             roundOver.processRoundOver(params, function (processRoundOverResponse) {
    //                 if (processRoundOverResponse.success && !processRoundOverResponse.isGameOver) {
    //                     cb(null, processRoundOverResponse.params);
    //                 } else {
    //                     cb(processRoundOverResponse);
    //                 }
    //             });
    //         } else {
    //             cb(isGameProgressResponse);
    //         }
    //     });
    // };
    /*============================  END  =================================*/



    /*============================  START  =================================*/
    // ### Update first player index if
    // > First active player left the game
    // or update current move player
    // New
    setfirstActiveIndex(params: any): any {

        const isGameProgressResponse: any = this.isGameProgress(params);

        if (isGameProgressResponse.success && !isGameProgressResponse.isGameOver) {
            if (params.data.index === params.table.firstActiveIndex) {
                params.table.firstActiveIndex = params.table.players[params.data.index].nextActiveIndex;
            }

            if (params.data.isCurrentPlayer) {
                params.table.currentMoveIndex = params.table.players[params.table.currentMoveIndex].nextActiveIndex;
            }

            return params;
        } else {
            return isGameProgressResponse;
        }
    };


    // Old
    // var setfirstActiveIndex = function (params, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'in leaveRemote function setfirstActiveIndex');
    //     isGameProgress(params, function (isGameProgressResponse) {
    //         if (isGameProgressResponse.success && !isGameProgressResponse.isGameOver) {

    //             if (params.data.index === params.table.firstActiveIndex) {
    //                 serverLog(stateOfX.serverLogType.info, 'This is the first active player to dealer left the table.')
    //                 params.table.firstActiveIndex = params.table.players[params.data.index].nextActiveIndex;
    //             }
    //             if (params.data.isCurrentPlayer) {


    //                 serverLog(stateOfX.serverLogType.info, 'This is the current player to leave.')
    //                 serverLog(stateOfX.serverLogType.info, 'Current player index- ' + params.table.currentMoveIndex);
    //                 params.table.currentMoveIndex = params.table.players[params.table.currentMoveIndex].nextActiveIndex;
    //                 serverLog(stateOfX.serverLogType.info, 'Next player move set to next active index - ' + params.table.currentMoveIndex)
    //             }
    //             cb(null, params);

    //         } else {
    //             cb(isGameProgressResponse);
    //         }
    //     });
    // };
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    // adjust next move 
    // if round over and/or current player has left
    // New
    setNextPlayer(params: any): any {

        const isGameProgressResponse: any = this.isGameProgress(params);

        if (isGameProgressResponse.success && !isGameProgressResponse.isGameOver) {
            if (params.data.state === stateOfX.playerState.playing) {
                if (params.data.isCurrentPlayer) {
                    if (params.data.roundOver) {
                        params.table.currentMoveIndex = params.table.firstActiveIndex;
                    } else {
                        console.log(stateOfX.serverLogType.info, 'Round doesn\'t over after this leave, setting next active index as next player with turn.');
                        // params.table.currentMoveIndex = params.table.players[params.table.currentMoveIndex].nextActiveIndex;
                        console.log(stateOfX.serverLogType.info, 'Next player move will not resetting here, might be already set in previous functions');
                    }
                } else {
                    console.log(stateOfX.serverLogType.info, 'Player was not the player with turn, so skipping turn transfer.');
                }
            } else {
                console.log(stateOfX.serverLogType.info, 'Player was not in PLAYING state, so skipping turn transfer.');
            }
            return params;
        } else {
            return isGameProgressResponse;
        }
    };


    // Old
    // var setNextPlayer = function (params, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'in leaveRemote function setNextPlayer');
    //     isGameProgress(params, function (isGameProgressResponse) {
    //         if (isGameProgressResponse.success && !isGameProgressResponse.isGameOver) {
    //             if (params.data.state === stateOfX.playerState.playing) {
    //                 if (params.data.isCurrentPlayer) {
    //                     if (params.data.roundOver) {
    //                         serverLog(stateOfX.serverLogType.info, 'Round is over after this leave, setting first player index as next player with turn.')
    //                         params.table.currentMoveIndex = params.table.firstActiveIndex;
    //                         serverLog(stateOfX.serverLogType.info, 'Next player move set to first active index - ' + params.table.currentMoveIndex)
    //                         cb(null, params);
    //                     } else {
    //                         serverLog(stateOfX.serverLogType.info, 'Round doesnt over after this leave, setting next active index as next player with turn.')
    //                         // params.table.currentMoveIndex = params.table.players[params.table.currentMoveIndex].nextActiveIndex;
    //                         serverLog(stateOfX.serverLogType.info, 'Next player move will not resetting here, might be already set in previous functions')
    //                         cb(null, params);
    //                     }
    //                 } else {
    //                     serverLog(stateOfX.serverLogType.info, 'Player was not the player with turn, so skipping turn transfer.');
    //                     cb(null, params);
    //                 }
    //             } else {
    //                 serverLog(stateOfX.serverLogType.info, 'Player was not in PLAYING state, so skipping turn transfer.');
    //                 cb(null, params)
    //             }
    //         } else {
    //             cb(isGameProgressResponse);
    //         }
    //     });
    // };
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    // ### Set maximum raise for next player
    // New
    setMaxRaise(params: any): any {

        const isGameProgressResponse: any = this.isGameProgress(params);

        if (isGameProgressResponse.success && !isGameProgressResponse.isGameOver) {
            params.table.maxRaiseAmount = this.tableManager.maxRaise(params.table);
            return params;
        } else {
            return isGameProgressResponse;
        }
    };


    // Old
    // var setMaxRaise = function (params, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'In leaveRemote function setMaxRaise');
    //     // if(params.table.currentMoveIndex === -1) {
    //     //   cb({success: false, isRetry: false, isDisplay: true, channelId: (params.channelId || ""), tableId: params.tableId,info: popupTextManager.NOCURRENTPLAYERONMAXRAISE});
    //     //   return false;
    //     // }
    //     isGameProgress(params, function (isGameProgressResponse) {
    //         if (isGameProgressResponse.success && !isGameProgressResponse.isGameOver) {
    //             params.table.maxRaiseAmount = tableManager.maxRaise(params.table);
    //             serverLog(stateOfX.serverLogType.info, 'leaveRemote Updated max raise - ' + params.table.maxRaiseAmount);
    //             cb(null, params)
    //         } else {
    //             cb(isGameProgressResponse);
    //         }
    //     });
    // };
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    // ### Adjust round bets if a playing player left the game
    // New
    adjustRoundBets(params: any): any {
        const isGameProgressResponse: any = this.isGameProgress(params);

        if (isGameProgressResponse.success && !isGameProgressResponse.isGameOver) {
            let playerOnTable = -1;
            if (params.data.index >= 0) {
                playerOnTable = params.table.onStartPlayers.indexOf(params.data.playerId);
            }
            if (params.data.index >= 0 && playerOnTable >= 0) {
                if (params.table.roundBets[params.data.index] !== undefined && params.table.roundBets[params.data.index] >= 0) {
                    const playerAmountInRound = params.table.roundBets[params.data.index] || 0;
                    params.table.roundBets.splice(params.data.index, 1);
                    params.table.roundBets.push(playerAmountInRound);
                } else {
                    console.log(stateOfX.serverLogType.info, 'No need to adjust round bets in this case, might be already adjusted in round over condition.');
                }
            }
            return params;
        } else {
            return isGameProgressResponse;
        }
    };


    // Old
    // var adjustRoundBets = function (params, cb) {
    //     isGameProgress(params, function (isGameProgressResponse) {
    //         if (isGameProgressResponse.success && !isGameProgressResponse.isGameOver) {
    //             //console.error("^^^^^^^^^^^^^^&&&&&&&&&&&&&&############",params.data);
    //             var playerOnTable = -1;
    //             if (params.data.index >= 0) {
    //                 playerOnTable = params.table.onStartPlayers.indexOf(params.data.playerId);
    //             }
    //             if (params.data.index >= 0 && playerOnTable >= 0) {
    //                 serverLog(stateOfX.serverLogType.info, 'A playing player left the game from index ' + params.data.index + ' - adjust round bets.');
    //                 serverLog(stateOfX.serverLogType.info, 'Roundbets in round so far - ' + params.table.roundBets);
    //                 // Case: When last player with move left the game and roundOver check already cleared
    //                 // the index from table.roundBets and check will prevent to add additional roundBets with
    //                 // null or undefined which make totalPot value NULL in view as well
    //                 if (params.table.roundBets[params.data.index] != undefined && params.table.roundBets[params.data.index] >= 0) {
    //                     var playerAmountInRound = !!params.table.roundBets[params.data.index] ? params.table.roundBets[params.data.index] : 0;
    //                     serverLog(stateOfX.serverLogType.info, 'Amount added by player in current round - ' + playerAmountInRound);
    //                     params.table.roundBets.splice(params.data.index, 1);
    //                     serverLog(stateOfX.serverLogType.info, 'Player bet removed from roundBets - ' + params.table.roundBets);
    //                     params.table.roundBets.push(playerAmountInRound);
    //                     serverLog(stateOfX.serverLogType.info, 'Updated roundBets after placing roundbets at the end of array - ' + params.table.roundBets);
    //                 } else {
    //                     serverLog(stateOfX.serverLogType.info, 'No need to adjust round bets in this case, might be already adjusted in round over condition.');
    //                 }
    //                 cb(null, params);
    //             } else {
    //                 cb(null, params);
    //             }
    //         } else {
    //             cb(isGameProgressResponse);
    //         }
    //     });
    // }
    /*============================  END  =================================*/

    /*============================  START  =================================*/
    // ### Decide players prechecks
    // new
    decidePlayerPrechecks(params: any): any {
        const assignPrechecksResponse: any = this.setMove.assignPrechecks(params);

        if (assignPrechecksResponse.success) {
            params = assignPrechecksResponse.params;
            return params;
        } else {
            return assignPrechecksResponse;
        }
    };


    // Old
    // var decidePlayerPrechecks = function (params, cb) {
    //     setMove.assignPrechecks(params, function (assignPrechecksResponse) {
    //         if (assignPrechecksResponse.success) {
    //             params = assignPrechecksResponse.params;
    //             cb(null, params);
    //         } else {
    //             cb(assignPrechecksResponse)
    //         }
    //     });
    // }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    // get moves of NEW current move player
    // New
    getMoves(params: any): any {

        const isGameProgressResponse: any = this.isGameProgress(params);

        if (isGameProgressResponse.success && !isGameProgressResponse.isGameOver) {
            if (params.data.isCurrentPlayer) {
                const getMoveResponse: any = this.setMove.getMove(params);

                if (getMoveResponse.success) {
                    return getMoveResponse.params;
                } else {
                    return getMoveResponse;
                }
            } else {
                return params;
            }
        } else {
            return isGameProgressResponse;
        }
    };


    // Old
    // var getMoves = function (params, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'in leaveRemote function getMoves');
    //     isGameProgress(params, function (isGameProgressResponse) {
    //         if (isGameProgressResponse.success && !isGameProgressResponse.isGameOver) {
    //             if (params.data.isCurrentPlayer) {
    //                 setMove.getMove(params, function (getMoveResponse) {
    //                     if (getMoveResponse.success) {
    //                         cb(null, getMoveResponse.params);
    //                     } else {
    //                         cb(getMoveResponse);
    //                     }
    //                 });
    //             } else {
    //                 cb(null, params);
    //             }
    //         } else {
    //             cb(isGameProgressResponse);
    //         }
    //     });
    // };
    /*============================  END  =================================*/



    /*============================  START  =================================*/
    // Perform move handler
    // create leave response
    // also add keys according to TURN if current player left
    // also for roundOver and/or
    // for gameOver
    // New
    createLeaveResponse(params: any): any {

        const isGameProgressResponse: any = this.isGameProgress(params);

        if (isGameProgressResponse.success && !isGameProgressResponse.isGameOver) {

            // Set current time for player turn starts at
            if (params.data.isCurrentPlayer) {
                params.table.turnTimeStartAt = Number(new Date());
            }

            params.data.success = true;
            params.data.isGameOver = false;
            params.data.winners = isGameProgressResponse.winners;
            params.data.rakeDeducted = isGameProgressResponse.rakeDeducted;
            params.data.cardsToShow = isGameProgressResponse.cardsToShow;

            const setActionKeysResponse = this.responseHandler.setActionKeys(params);
            return setActionKeysResponse;
        } else {
            return isGameProgressResponse;
        }
    };


    // Old
    // var createLeaveResponse = function (params, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'in leaveRemote function createLeaveResponse');
    //     isGameProgress(params, function (isGameProgressResponse) {
    //         if (isGameProgressResponse.success && !isGameProgressResponse.isGameOver) {
    //             serverLog(stateOfX.serverLogType.info, 'creating response for Game over on leave ' + JSON.stringify(_.omit(params.table, 'deck')))
    //             // Set current time for player turn starts at
    //             if (params.data.isCurrentPlayer) {
    //                 params.table.turnTimeStartAt = Number(new Date());
    //             }
    //             params.data.success = true;
    //             params.data.isGameOver = false;
    //             params.data.winners = isGameProgressResponse.winners;
    //             params.data.rakeDeducted = isGameProgressResponse.rakeDeducted;
    //             params.data.cardsToShow = isGameProgressResponse.cardsToShow;


    //             responseHandler.setActionKeys(params, function (setActionKeysResponse) {
    //                 cb(null, setActionKeysResponse);
    //             });
    //         } else {
    //             cb(isGameProgressResponse);
    //         }
    //     });
    // };
    /*============================  END  =================================*/



    /*============================  START  =================================*/
    // ### Adjust active player indexes among each other
    // > Set preActiveIndex and nextActiveIndex values for each player
    // > Used for turn transfer importantly
    // New
    adjustActiveIndexes(params: any): any {
        const performResponse: any = this.adjustIndex.perform(params);
        return performResponse.params;
    };


    // Old
    // var adjustActiveIndexes = function (params, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'in leaveRemote function adjustActiveIndexes');
    //     adjustIndex.perform(params, function (performResponse) {
    //         cb(null, performResponse.params);
    //     });
    // };
    /*============================  END  =================================*/



    /*============================  START  =================================*/
    // Set params when game is not running
    // New
    setLeaveParams(params: any): any {

        params.data = _.omit(params.data, '__route__');
        params.data.action = params.data.isStandup ? stateOfX.move.standup.toUpperCase() : stateOfX.move.leave.toUpperCase();
        params.data.index = _ld.findIndex(params.table.players, { playerId: params.data.playerId });

        return params;
    };


    // Old
    // var setLeaveParams = function (params, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'in leaveRemote function setLeaveParams');
    //     serverLog(stateOfX.serverLogType.info, 'in leaveRemote function setLeaveParams - ' + JSON.stringify(params.table.players));
    //     params.data = _.omit(params.data, '__route__');
    //     params.data.action = params.data.isStandup ? stateOfX.move.standup.toUpperCase() : stateOfX.move.leave.toUpperCase();
    //     params.data.index = _ld.findIndex(params.table.players, { playerId: params.data.playerId });
    //     serverLog(stateOfX.serverLogType.info, 'Player at index - ' + params.data.index + ' is going to ' + params.data.action + ' !');
    //     cb(null, params);
    // }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    // Refund amount to player after leave
    // refund only player.chips
    // New
    refundAmountOnLeave(params: any): any {
        const refNumber: any = this.imdb.findRefrenceNumber({ playerId: params.data.playerId, channelId: params.table.channelId });

        if (!refNumber || !refNumber.length) {
            params.data.referenceNumber = 'aa';
        } else {
            params.data.referenceNumber = refNumber[0].referenceNumber;
        }


        if (params.data.index >= 0) {
            const player = params.table.players[params.data.index];
            let chipsToRefund = player.chips;
            let lastRealChipBonus = player.lastRealChipBonus || 0;
            let lastRealChip = player.lastRealChip;
            let totalRCB = player.totalRCB;
            let currentRCBstack = player.currentRCBstack;

            let refundinRCB = 0;
            let refundinRC = 0;
            let remainingRC = 0;
            let totalValue = lastRealChip + (currentRCBstack > totalRCB ? lastRealChipBonus : currentRCBstack);

            if (chipsToRefund >= totalValue) {
                remainingRC = chipsToRefund - totalValue;
            } else {
                if (chipsToRefund >= lastRealChipBonus && lastRealChip <= 0 && chipsToRefund <= currentRCBstack) {
                    lastRealChipBonus = chipsToRefund;
                } else if (chipsToRefund >= lastRealChipBonus) {
                    lastRealChip = chipsToRefund - lastRealChipBonus;
                } else {
                    let diff = lastRealChipBonus - chipsToRefund;
                    lastRealChipBonus = lastRealChipBonus - diff;
                    lastRealChip = 0;
                }
            }

            refundinRCB = lastRealChipBonus;
            refundinRC = lastRealChip + remainingRC;

            if (chipsToRefund > 0) {
                let dataForWallet = {
                    action: 'stoodUp',
                    data: {
                        playerId: params.data.playerId,
                        isRealMoney: params.table.isRealMoney,
                        chips: player.chips,
                        points: player.points,
                        channelId: params.table.channelId,
                        tableName: params.table.channelName,
                        referenceNumber: params.data.referenceNumber
                    }
                };

                let addChipsResponse = this.wallet.sendWalletBroadCast(dataForWallet);

                if (addChipsResponse.success) {
                    lockedCashoutHandler(player);
                    params.data.leavePoints = player.points;
                    params.data.leaveChips = player.chips;
                    return params;
                } else {
                    return {
                        success: false,
                        channelId: (params.channelId || ""),
                        info: this.popupTextManager.PROFILEMGMTADDCHIPS_REFUNDAMOUNTONLEAVE_LEAVEREMOTE + params.data.action,
                        isRetry: false,
                        isDisplay: true
                    };
                }
            } else {
                return params;
            }
        } else {
            return params;
        }
    };


    // Old
    // var refundAmountOnLeave = async function (params, cb) {
    //     imdb.findRefrenceNumber({ playerId: params.data.playerId, channelId: params.table.channelId }, async function (err, refNumber) {
    //         if (err || !refNumber.length) {
    //             params.data.referenceNumber = 'aa'
    //         }
    //         else {
    //             params.data.referenceNumber = refNumber[0].referenceNumber;
    //         }
    //         serverLog(stateOfX.serverLogType.info, 'in leaveRemote function refundAmountOnLeave');
    //         serverLog(stateOfX.serverLogType.info, 'About to refund player at index - ' + params.data.index);
    //         if (params.data.index >= 0) {
    //             serverLog(stateOfX.serverLogType.info, 'Player have taken a seat on table.');
    //             var chipsToRefund = params.table.players[params.data.index].chips;
    //             var lastRealChipBonus = params.table.players[params.data.index].lastRealChipBonus || 0;
    //             var lastRealChip = params.table.players[params.data.index].lastRealChip;
    //             var totalRCB = params.table.players[params.data.index].totalRCB;
    //             var currentRCBstack = params.table.players[params.data.index].currentRCBstack;
    //             //Refund amount case written by Sonu Yadav
    //             var refundinRCB = 0;
    //             var refundinRC = 0;
    //             var remainingRC = 0;
    //             var totalValue = lastRealChip + (currentRCBstack > totalRCB ? lastRealChipBonus : currentRCBstack);

    //             if (chipsToRefund >= totalValue) {
    //                 remainingRC = chipsToRefund - totalValue;
    //             } else {
    //                 if (chipsToRefund >= lastRealChipBonus && lastRealChip <= 0 && chipsToRefund <= currentRCBstack) {
    //                     lastRealChipBonus = chipsToRefund;
    //                 } else if (chipsToRefund >= lastRealChipBonus) {
    //                     lastRealChip = chipsToRefund - lastRealChipBonus;
    //                 } else {
    //                     var diff = lastRealChipBonus - chipsToRefund;
    //                     lastRealChipBonus = lastRealChipBonus - diff;
    //                     lastRealChip = 0;
    //                 }
    //             }
    //             refundinRCB = lastRealChipBonus;
    //             refundinRC = lastRealChip + remainingRC;
    //             if (chipsToRefund > 0) {
    //                 let dataForWallet = {
    //                     action: 'stoodUp',
    //                     data: {
    //                         playerId: params.data.playerId,
    //                         isRealMoney: params.table.isRealMoney,
    //                         chips: params.table.players[params.data.index].chips,
    //                         points: params.table.players[params.data.index].points,
    //                         channelId: params.table.channelId,
    //                         tableName: params.table.channelName,
    //                         referenceNumber: params.data.referenceNumber
    //                     }
    //                 }
    //                 console.log("about to sent event :", dataForWallet)
    //                 let addChipsResponse = await wallet.sendWalletBroadCast(dataForWallet)
    //                 console.log("addChipsResponse is999>", addChipsResponse)
    //                 serverLog(stateOfX.serverLogType.info, 'Add chips response from db - ' + JSON.stringify(addChipsResponse));
    //                 if (addChipsResponse.success) {
    //                     // from here we'll call a function to adjust lockedCashout
    //                     lockedCashoutHandler(params.table.players[params.data.index])
    //                     params.data.leavePoints = params.table.players[params.data.index].points;
    //                     params.data.leaveChips = params.table.players[params.data.index].chips;
    //                     cb(null, params);
    //                 } else {
    //                     cb({ success: false, channelId: (params.channelId || ""), info: popupTextManager.PROFILEMGMTADDCHIPS_REFUNDAMOUNTONLEAVE_LEAVEREMOTE + params.data.action, isRetry: false, isDisplay: true });
    //                 }
    //             } else {
    //                 serverLog(stateOfX.serverLogType.info, 'Skipping refund as, Player has total chips on table  -  ' + chipsToRefund + ' .');
    //                 cb(null, params);
    //             }
    //         } else {
    //             serverLog(stateOfX.serverLogType.info, 'Skipping refund as, Player hasnt taken the seat on table.');
    //             cb(null, params);
    //         }
    //     })
    // }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    // New
    async lockedCashoutHandler(params: any): Promise<void> {

        const data = await this.db.getCustomUser(params.playerId, { lockedCashout: 1, userName: 1, _id: 0 });
        if (!data || !data.lockedCashout) {
            console.log("-----edg45d--------**------------- data.lockedCashout not available ", data);
        } else {

            const dateToCheck = params.sitAt;
            const result = await this.db.findRakeOntable({ playerId: params.playerId, channelId: params.channelId, addeddate: dateToCheck });


            if (result && result[0] && result[0].rakeGenerated) {
                const eligibleToConvert = Math.floor(result[0].rakeGenerated * systemConfig.lockedCashoutPrecentage);

                if (data.lockedCashout > eligibleToConvert) {
                    data.lockedCashout -= eligibleToConvert;
                } else {
                    data.lockedCashout = 0;
                }


                const updateResult = await this.db.updatePlayerById({ playerId: params.playerId }, { lockedCashout: data.lockedCashout });

                await this.db.lockedCashoutHistory({
                    playerId: params.playerId,
                    channelId: params.channelId,
                    rake: result[0].rakeGenerated,
                    createdAt: Number(new Date()),
                    lockedBefore: data.lockedCashout + eligibleToConvert,
                    released: eligibleToConvert,
                    lockedAfter: data.lockedCashout
                });

            }
        }
    };


    // Old
    // const lockedCashoutHandler = params => {
    //     console.log("-----edg45d--------**------------- params", params)
    //     db.getCustomUser(params.playerId, { lockedCashout: 1, userName: 1, _id: 0 }, function (err, data) {
    //         if (err || !data || !data.lockedCashout) {
    //             console.log("-----edg45d--------**------------- data.lockedCashout not avaialabale ", data)
    //         } else {
    //             console.log("-----edg45d--------**------------- data", data)
    //             let dateToCheck = params.sitAt;
    //             financeDB.findRakeOntable({ playerId: params.playerId, channelId: params.channelId, addeddate: dateToCheck }, (err, result) => {
    //                 console.log("-----edg45d--------**------------- findRakeOntable is", err, result)
    //                 if (!err && result && result[0] && result[0].rakeGenerated) {
    //                     const eligibleToConvert = Math.floor(result[0].rakeGenerated * systemConfig.lockedCashoutPrecentage);
    //                     if (data.lockedCashout > eligibleToConvert) {
    //                         data.lockedCashout -= eligibleToConvert
    //                     } else {
    //                         data.lockedCashout = 0;
    //                     }
    //                     console.log("-----edg45d--------**------------- eligibleToConvert is", eligibleToConvert, result[0].rakeGenerated, data.lockedCashout)
    //                     db.updatePlayerById({ playerId: params.playerId }, { lockedCashout: data.lockedCashout }, (err, res) => {
    //                         logDb.lockedCashoutHistory({
    //                             playerId: params.playerId,
    //                             channelId: params.channelId,
    //                             rake: result[0].rakeGenerated,
    //                             createdAt: Number(new Date()),
    //                             lockedBefore: data.lockedCashout + eligibleToConvert,
    //                             released: eligibleToConvert,
    //                             lockedAfter: data.lockedCashout
    //                         }, (err, result) => {
    //                             console.log("-----edg45d--------**------------- lockedCashoutHistory", err, result)
    //                         })
    //                     })
    //                 }
    //             })
    //         }
    //     })
    // }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    // Remove anti banking entry
    // New
    async removeAntiBanking(params: any): Promise<void> {

        try {
            const res = await this.db.removeAntiBankingEntry({ playerId: params.data.playerId, channelId: params.channelId });
            if (res) {
                // Proceed with the next steps if needed
            } else {
                throw new Error(this.popupTextManagerFromdb.DB_REMOVEANTIBANKING_FAIL);
            }
        } catch (err) {
            console.log(stateOfX.serverLogType.error, 'Error removing anti banking entry: ' + JSON.stringify(err));
            throw new Error(this.popupTextManagerFromdb.DB_REMOVEANTIBANKING_FAIL);
        }
    };


    // Old
    // var removeAntiBanking = function (params, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'in leaveRemote function removeAntiBanking');
    //     db.removeAntiBankingEntry({ playerId: params.data.playerId, channelId: params.channelId }, function (err, res) {
    //         if (!err && res) {
    //             cb(null, params);
    //         } else {
    //             serverLog(stateOfX.serverLogType.error, 'Unable to insert anti banking details in database: ' + JSON.stringify(err));
    //             cb({ success: false, channelId: (params.channelId || ""), info: popupTextManagerFromdb.DB_REMOVEANTIBANKING_FAIL, isRetry: false, isDisplay: false });
    //         }
    //     });
    // }
    /*============================  END  =================================*/




    /*============================  START  =================================*/
    // Create anti banking entry
    // New
    async insertAntiBanking(params: any): Promise<void> {
        const antiBankingTime = Number(new Date());

        try {
            const res = await this.db.insertAntiBanking({
                playerId: params.data.playerId,
                channelId: params.channelId,
                createdAt: new Date(),
                expireAt: antiBankingTime,
                stack: 0,
                amount: params.table.players[params.data.index].chips
            });

            if (res) {
                console.log(stateOfX.serverLogType.info, 'Anti banking details for this leave have been added successfully.');
            } else {
                console.log(stateOfX.serverLogType.error, 'Unable to insert anti banking details into the database.');
                throw new Error(this.popupTextManagerFromdb.DB_INSERTANTIBANKING_FAIL);
            }
        } catch (err) {
            console.log(stateOfX.serverLogType.error, 'Error inserting anti banking details: ' + JSON.stringify(err));
            throw new Error(this.popupTextManagerFromdb.DB_INSERTANTIBANKING_FAIL);
        }
    };


    // Old
    // var insertAntiBanking = function (params, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'in leaveRemote function insertAntiBanking');
    //     var antiBankingTime = Number(new Date());
    //     console.error(new Date());
    //     //antiBankingTime = new Date(antiBankingTime);
    //     console.error(antiBankingTime);
    //     db.insertAntiBanking({ playerId: params.data.playerId, channelId: params.channelId, createdAt: new Date(), expireAt: antiBankingTime, stack: 0, amount: params.table.players[params.data.index].chips }, function (err, res) {
    //         if (!err && res) {
    //             serverLog(stateOfX.serverLogType.info, 'Anti banking details for this leave has been added successfully.');
    //             cb(null, params);
    //         } else {
    //             serverLog(stateOfX.serverLogType.error, 'Unable to remove anti banking details from database: ' + JSON.stringify(err));
    //             cb({ success: false, channelId: (params.channelId || ""), info: popupTextManagerFromdb.DB_INSERTANTIBANKING_FAIL, isRetry: false, isDisplay: false });
    //         }
    //     });
    // }
    /*============================  END  =================================*/



    /*============================  START  =================================*/
    // Create antibanking entry for this player on leave
    // if player left with more money than minBUyIn after playing atleast a game
    // New
    async createAntiBankingEntry(params: any): Promise<void> {

        // Make sure player has occupied seat
        if (params.data.index < 0) {
            return;
        }

        // Make sure player has played once on this table
        if (params.table.players[params.data.index].state === stateOfX.playerState.reserved ||
            (params.table.players[params.data.index].previousState === stateOfX.playerState.reserved &&
                !(params.table.players[params.data.index].hasPlayedOnceOnTable))) {
            return;
        }

        // Removing anti-banking and inserting again
        try {
            await this.removeAntiBanking(params);
            await this.insertAntiBanking(params);
        } catch (err) {
            console.log(stateOfX.serverLogType.error, 'Error during anti-banking process: ' + JSON.stringify(err));
            throw err;
        }
    };


    // Old
    // var createAntiBankingEntry = function (params, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'in leaveRemote function createAntiBankingEntry');
    //     // Make sure player has occupied seat
    //     // console.error(params.table.players[params.data.index].chips ,"@@@@@@@@@@@@@@@@@@@@@@@@@@@@", params.table.players[params.data.index].onSitBuyIn ,"create antibanking");
    //     if (params.data.index < 0) {
    //         serverLog(stateOfX.serverLogType.info, 'Skipping antibanking entry as, Player hasnt taken the seat on table.');
    //         cb(null, params);
    //         return true;
    //     }

    //     // Make sure player has played once on this table

    //     // Do not perform anything if RESERVED/WAITING player left the game
    //     console.log('createAntiBankingEntry', params.table.players[params.data.index].state, params.table.players[params.data.index].previousState, params.table.players)
    //     // if(params.table.players[params.data.index].state === stateOfX.playerState.reserved || params.table.players[params.data.index].previousState === stateOfX.playerState.reserved) {
    //     if (params.table.players[params.data.index].state === stateOfX.playerState.reserved || (params.table.players[params.data.index].previousState === stateOfX.playerState.reserved && !(params.table.players[params.data.index].hasPlayedOnceOnTable))) {
    //         serverLog(stateOfX.serverLogType.info, 'Skipping antibanking entry as, Player is in state ' + params.table.players[params.data.index].state + ', removing if already exists.');
    //         // removeAntiBanking(params, function(err, res){
    //         //   cb(err, res);
    //         // });
    //         cb(null, params);
    //         return true;
    //     }
    //     // Make sure player has chips and i greater than minbuyin at least
    //     //   removeAntiBanking(params, function(err, res){
    //     //       if(params.table.players[params.data.index].chips >0){
    //     //     insertAntiBanking(params, function(err, res){
    //     //     cb(err, res);
    //     //   });
    //     // } else { // Player is leaving more chips than min buyin, remove previous entry and create new one
    //     //         closePlayerSession(params, function(cErr, cRes){          
    //     //       cb(err, res);
    //     //         })
    //     //       }
    //     //   });

    //     removeAntiBanking(params, function (err, res) {
    //         // new code for skip lower anti. banking
    //         // var findQuery = {};
    //         // findQuery.playerId = params.data.playerId;
    //         // findQuery.channelId = params.channelId;
    //         // imdb.getPlayerBuyInSum(findQuery, function(err, res){
    //         //   playerScore = convert.convert((params.table.players[params.data.index].chips - (res[0]? res[0].sum:0)));
    //         //   if(playerScore>0){
    //         //     insertAntiBanking(params, function (err, res) {
    //         //       cb(err, res);
    //         //     });
    //         //   } else {
    //         //     cb(null, params);
    //         //   }
    //         // });
    //         insertAntiBanking(params, function (err, res) {
    //             cb(err, res);
    //         });
    //     });
    // }
    /*============================  END  =================================*/




    /*============================  START  =================================*/
    // New
    async closePlayerSession(params: any): Promise<void> {
        const updateQuery = {
            playerId: params.data.playerId,
            channelId: params.channelId,
        };

        try {
            const res = await this.db.getPlayerBuyIn(updateQuery);
            const updateParams: any = {
                buyins: [],
                score: 0,
                totalBuyins: 0,
                active: false,
                endDate: new Date(),
            };

            let totalBuyins = 0;
            if (res && res.length > 0) {
                res.forEach((entry: any) => {
                    const buyins = {
                        amount: entry.amount,
                        createdAt: entry.createdAt,
                    };
                    updateParams.buyins.push(buyins);
                    totalBuyins += entry.amount;
                });
            }

            updateParams.score = 0 - totalBuyins;
            updateParams.totalBuyins = totalBuyins;

            await this.db.updatePlayerSession(updateQuery, updateParams);
        } catch (err) {
            console.log(stateOfX.serverLogType.error, 'Error during player session close: ' + JSON.stringify(err));
            throw err;
        }
    };


    // Old
    // var closePlayerSession = function (params, cb) {
    //     var updateQuery = {};
    //     updateQuery.playerId = params.data.playerId;
    //     updateQuery.channelId = params.channelId;
    //     imdb.getPlayerBuyIn(updateQuery, function (err, res) {
    //         var updateParams = {};
    //         updateParams.buyins = [];
    //         var buyins;
    //         var totalBuyins = 0;
    //         if (!!res && res.length > 0) {
    //             for (var i = 0; i < res.length; i++) {
    //                 buyins = {};
    //                 buyins.amount = res[i].amount;
    //                 buyins.createdAt = res[i].createdAt;
    //                 updateParams.buyins.push(buyins);
    //                 totalBuyins += res[i].amount;
    //             }
    //         }
    //         updateParams.score = 0;
    //         updateParams.score = 0 - totalBuyins;
    //         updateQuery.active = true;
    //         updateParams.endDate = new Date();
    //         updateParams.active = false;
    //         updateParams.totalBuyins = totalBuyins;
    //         db.updatePlayerSession(updateQuery, updateParams, function (err, res) {
    //             if (!err && res) {
    //                 cb(null, params);
    //             } else {
    //                 cb({ success: false, channelId: (params.channelId || "") });
    //             }
    //         });
    //     })
    // }
    /*============================  END  =================================*/

    // deprecated - never in future too
    // var removePlayer = function(params, cb) {
    //   serverLog(stateOfX.serverLogType.info, 'in leaveRemote function removePlayer');
    //   if(params.data.index >= 0) {
    //     serverLog(stateOfX.serverLogType.info,'Removing player from table')
    //     imdb.removePlayerJoin({channelId: params.channelId, playerId: params.data.playerId}, function(err, response){
    //       if(!err && response) {
    //         params.table.players.splice(params.data.index, 1);
    //         cb(null, params);
    //       } else {
    //         cb({success: false, isRetry: false, isDisplay: false, channelId: (params.channelId || ""), tableId: params.tableId,info: popupTextManagerFromdb.IMDBREMOVEPLAYERJOIN_REMOVEPLAYER_LEAVEREMOTE + JSON.stringify(err)});
    //         //cb({success: false, channelId: params.channelId, tableId: params.tableId, info: 'Unable to store player record in join - ' + JSON.stringify(err)});
    //       }
    //     });
    //   } else {
    //     serverLog(stateOfX.serverLogType.info, 'Player hasnt taken seat, so removing from db records only, Not running Game.');
    //     imdb.removePlayerJoin({channelId: params.channelId, playerId: params.data.playerId}, function(err, response){
    //       if(!err && response) {
    //         cb(null, params);
    //       } else {
    //         cb({success: false, isRetry: false, isDisplay: false, channelId: (params.channelId || ""), tableId: params.tableId,info: popupTextManagerFromdb.IMDBREMOVEPLAYERJOIN_REMOVEPLAYER_LEAVEREMOTE + JSON.stringify(err)});
    //         //cb({success: false, channelId: params.channelId, tableId: params.tableId, info: 'Unable to store player record in join - ' + JSON.stringify(err)});
    //       }
    //     });
    //   }
    //   cb(null, params);
    // }



    /*============================  START  =================================*/
    // generte response when player leave
    // case > no game running on table
    // New
    generateResponse(params: any) {

        params.data.success = true;
        params.data.response = {
            success: true,
            channelId: params.channelId,
            isGameOver: false,
            isCurrentPlayer: false,
            isRoundOver: false,
            playerLength: params.table.players.length,
            isSeatsAvailable: params.table.maxPlayers !== params.table.players.length,
            points: params.data.leavePoints,
            leaveChips: params.data.leaveChips,
            broadcast: {
                success: true,
                channelId: params.channelId,
                playerId: params.data.playerId,
                playerName: params.data.playerName,
                isStandup: params.data.action === stateOfX.move.standup
            },
            turn: {},
            round: {},
            over: {},
            preChecks: []
        };
    };


    // Old
    // var generateResponse = function (params, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'in leaveRemote function generateResponse');
    //     params.data.success = true;
    //     params.data.response = {
    //         success: true,
    //         channelId: params.channelId,
    //         isGameOver: false,
    //         isCurrentPlayer: false,
    //         isRoundOver: false,
    //         playerLength: params.table.players.length,
    //         isSeatsAvailable: params.table.maxPlayers !== params.table.players.length,
    //         points: params.data.leavePoints,
    //         leaveChips: params.data.leaveChips,
    //         broadcast: {
    //             success: true,
    //             channelId: params.channelId,
    //             playerId: params.data.playerId,
    //             playerName: params.data.playerName,
    //             isStandup: params.data.action === stateOfX.move.standup
    //         },
    //         turn: {},
    //         round: {},
    //         over: {},
    //         preChecks: []
    //     };

    //     cb(null, params);
    // }
    /*============================  END  =================================*/




    /*============================  START  =================================*/
    // ### Handle all cases required to handle a leave
    ///*************
    /// player who is observer
    ///// can try to leave room
    ///// may be forced to leave room by server
    /// player who has occupied a seat
    ///// may be forced to vacant seat by server (when state was RESRVED)
    ///// may be forced to vacant seat by server (when state was ONBREAK)
    ///// can try to vacant seat and room at once
    ///// may be forced to vacant seat and room at once by server (in rare cases)
    ///************* SO LEAVE HAS MANY CASES
    // > Params: {self, channelId, table, data {channelId, playerId, isStandup, isRequested}, table}
    // New
    async leavePlayer(params: any): Promise<any> {

        const validated = await validateKeySets("Request", params.serverType, "leavePlayer", params);
        params = _.omit(params, 'self');

        if (!validated.success) {
            return validated;
        }

        if (params.table.channelType === stateOfX.gameType.normal) {
            if (params.table.state === stateOfX.gameState.running) {
                try {
                    await this.initializeParams(params),
                        await this.validateAction(params),
                        await this.getAllPlayerScore(params),
                        await this.isLeavePossible(params),
                        await this.refundAmountOnLeave(params),
                        await this.createAntiBankingEntry(params),
                        await this.updatePlayer(params),
                        await this.isCurrentPlayer(params),
                        await this.setfirstActiveIndex(params),
                        await this.adjustActiveIndexes(params),
                        await this.updateConfigIndexes(params),
                        await this.validateGameOver(params),
                        await this.onLeaveSummary(params),
                        await this.removeFromTable(params), // remove activity fro in memory for disconnection handling
                        await this.removeActivity(params),
                        await this.removeSpectatorRecord(params),
                        await this.isRoundOver(params),
                        await this.setNextPlayer(params),
                        await this.adjustRoundBets(params),
                        await this.setMaxRaise(params),
                        await this.getMoves(params),
                        await this.adjustActiveIndexes(params),
                        await this.decidePlayerPrechecks(params),
                        await this.createLeaveResponse(params),

                    return { success: true, table: params.table, data: params.data };
                } catch (err: any) {
                    if (err.data?.success) {
                        return { success: true, table: params.table, data: params.data };
                    } else {
                        throw err;
                    }
                }
            } else {
                try {
                    await this.setLeaveParams(params);
                    await this.validateAction(params);
                    await this.getAllPlayerScore(params);
                    await this.isLeavePossible(params);
                    await this.createAntiBankingEntry(params);
                    await this.refundAmountOnLeave(params);
                    await this.onLeaveSummary(params);
                    await this.removeFromTable(params);
                    await this.removeActivity(params);
                    await this.removeSpectatorRecord(params);
                    await this.adjustActiveIndexes(params);
                    await this.generateResponse(params);

                    this.activity.leaveGame(params, stateOfX.profile.category.game, stateOfX.game.subCategory.leave, stateOfX.logType.success);
                    return { success: true, table: params.table, data: params.data };
                } catch (err: any) {
                    throw err;
                }
            }
        } else {
            params.data.response = { success: true, channelId: params.channelId };
            const tournamentLeaveResponse = await this.tournamentLeave.processLeave(params);
            return tournamentLeaveResponse;
        }
    };



    // Old
    // module.exports.leavePlayer = function (params, cb) {
    //     console.log("the params inside leave player params", params);
    //     serverLog(stateOfX.serverLogType.info, 'in leaveRemote function leavePlayer');
    //     serverLog(stateOfX.serverLogType.info, 'Players while leaving a player begins - ' + JSON.stringify(params.table.players));
    //     /*console.log("The Ninja's way of life is this");
    //     console.error(params);*/
    //     keyValidator.validateKeySets("Request", params.serverType, "leavePlayer", params, function (validated) {
    //         params = _.omit(params, 'self')
    //         if (validated.success) {
    //             if (params.table.channelType === stateOfX.gameType.normal) {
    //                 if (params.table.state === stateOfX.gameState.running) {
    //                     // var indexOfLeavingPlayer = _ld.findIndex(params.table.players, {playerId: params.data.playerId});
    //                     //             console.error(indexOfLeavingPlayer,"  !!!!!!!!!!!!!!!!!!!!!!!!! ",params);
    //                     // if(indexOfLeavingPlayer >=0  && params.table.players[indexOfLeavingPlayer].state == stateOfX.playerState.playing && params.table.players[indexOfLeavingPlayer].lastMove != stateOfX.move.fold){
    //                     // cb({success: false, channelId: params.data.channelId, info: "You Cannot Leave as you are part of the game", isRetry: false, isDisplay: true});
    //                     // }else{
    //                     console.log("wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww")
    //                     console.log("params", params)
    //                     async.waterfall([
    //                         async.apply(initializeParams, params),
    //                         validateAction,
    //                         getAllPlayerScore,
    //                         isLeavePossible,
    //                         refundAmountOnLeave,
    //                         createAntiBankingEntry,
    //                         updatePlayer,
    //                         isCurrentPlayer,
    //                         setfirstActiveIndex,
    //                         adjustActiveIndexes,
    //                         updateConfigIndexes,
    //                         validateGameOver,
    //                         onLeaveSummary,
    //                         removeFromTable, // remove activity fro in memory for disconnection handling
    //                         removeActivity,
    //                         removeSpectatorRecord,
    //                         isRoundOver,
    //                         setNextPlayer,
    //                         adjustRoundBets,
    //                         setMaxRaise,
    //                         getMoves,
    //                         adjustActiveIndexes,
    //                         decidePlayerPrechecks,
    //                         createLeaveResponse,

    //                     ], function (err, response) {
    //                         if (err) {
    //                             if (!!err.data && err.data.success) {
    //                                 console.error("i should  not be called from here");

    //                                 // activity.leaveGame(err,stateOfX.profile.category.game,stateOfX.game.subCategory.leave,stateOfX.logType.success);
    //                                 // activity.leaveGame(err,stateOfX.profile.category.gamePlay,stateOfX.gamePlay.subCategory.leave,stateOfX.logType.success);
    //                                 cb({ success: true, table: params.table, data: params.data });
    //                             } else {
    //                                 // activity.leaveGame(err,stateOfX.profile.category.game,stateOfX.game.subCategory.leave,stateOfX.logType.error);
    //                                 // activity.leaveGame(err,stateOfX.profile.category.gamePlay,stateOfX.gamePlay.subCategory.leave,stateOfX.logType.error);
    //                                 serverLog(stateOfX.serverLogType.error, '1. This should not be success response for LEAVE - ' + JSON.stringify(err));
    //                                 cb(err);
    //                             }
    //                         } else {
    //                             // activity.leaveGame(params,stateOfX.profile.category.game,stateOfX.game.subCategory.leave,stateOfX.logType.success);
    //                             // activity.leaveGame(params,stateOfX.profile.category.gamePlay,stateOfX.gamePlay.subCategory.leave,stateOfX.logType.success);
    //                             serverLog(stateOfX.serverLogType.info, 'Sending final leave broadcast on success case')
    //                             cb({ success: true, table: params.table, data: params.data });
    //                         }
    //                     });
    //                     // }
    //                 } else {
    //                     //console.error(stateOfX.serverLogType.info,'Removing player when Game is - ' + params);
    //                     var indexOfLeavingPlayer = _ld.findIndex(params.table.players, { playerId: params.data.playerId });
    //                     //           console.error(indexOfLeavingPlayer,"  !!!!!!!!!!!!!!!!!!!!!!!!! ",params);
    //                     // if(!params.data.isRequested && !params.data.isStandup && indexOfLeavingPlayer >=0){
    //                     //   cb({success: false, channelId: params.data.channelId, info: "You Cannot Leave as you are part of the game", isRetry: false, isDisplay: true});
    //                     // }else{
    //                     async.waterfall([
    //                         async.apply(setLeaveParams, params),
    //                         validateAction,
    //                         getAllPlayerScore,
    //                         isLeavePossible,
    //                         createAntiBankingEntry,
    //                         refundAmountOnLeave,
    //                         onLeaveSummary,
    //                         removeFromTable,
    //                         removeActivity,   // remove activity fro in memory for disconnection handling
    //                         removeSpectatorRecord,
    //                         adjustActiveIndexes,
    //                         generateResponse,
    //                     ], function (err, response) {
    //                         serverLog(stateOfX.serverLogType.info, '====== FINAL LEAVE RESPONSE IDLE =======');
    //                         serverLog(stateOfX.serverLogType.info, JSON.stringify(err))
    //                         serverLog(stateOfX.serverLogType.info, JSON.stringify(response))
    //                         if (err) {
    //                             serverLog(stateOfX.serverLogType.error, '2. This should not be success response for LEAVE - ' + JSON.stringify(err));
    //                             // activity.leaveGame(params,stateOfX.profile.category.game,stateOfX.game.subCategory.leave,stateOfX.logType.error);
    //                             cb(err);
    //                         } else {
    //                             activity.leaveGame(params, stateOfX.profile.category.game, stateOfX.game.subCategory.leave, stateOfX.logType.success);
    //                             cb({ success: true, table: params.table, data: params.data });
    //                         }
    //                     });
    //                     // }
    //                 }
    //             } else {
    //                 serverLog(stateOfX.serverLogType.info, 'Not removing player as this is Game type - ' + params.table.channelType);
    //                 params.data.response = { success: true, channelId: params.channelId };
    //                 // activity.leaveGame(params,stateOfX.profile.category.game,stateOfX.game.subCategory.leave,stateOfX.logType.success);
    //                 tournamentLeave.processLeave(params, function (tournamentLeaveResponse) {
    //                     serverLog(stateOfX.serverLogType.info, 'tournamentLeaveResponse')
    //                     serverLog(stateOfX.serverLogType.info, JSON.stringify(tournamentLeaveResponse));
    //                     cb(tournamentLeaveResponse);
    //                 });
    //             }
    //         } else {
    //             cb(validated);
    //         }
    //     });
    // };

    /*============================  END  =================================*/
















}