import { Injectable } from "@nestjs/common";
import _ld from "lodash";
import _ from 'underscore';
import { stateOfX, popupTextManager, systemConfig } from "shared/common";
import { ImdbDatabaseService } from "shared/common/datebase/Imdbdatabase.service";
import { PokerDatabaseService } from "shared/common/datebase/pokerdatabase.service";
import { SetMoveService } from "./setMove.service";
import { AdjustActiveIndexService } from "./adjustActiveIndex.service";
import { HandleGameOverService } from "./handleGameOver.service";
import { ResponseHandlerService } from "./responseHandler.service";
import { TableManagerService } from "./tableManager.service";
import { validateKeySets } from "shared/common/utils/activity";









// activity = require("../../../../../shared/activity"),
//     roundOver = require("./utils/roundOver"),
//     testSummary = require("./utils/summaryGenerator"),




    @Injectable()
    export class MoveRemoteService {


        private popupTextManager = popupTextManager.falseMessages;

        constructor(
            private readonly db: PokerDatabaseService,
            private readonly imdb: ImdbDatabaseService,
            private readonly setMove: SetMoveService,
            private readonly adjustIndex: AdjustActiveIndexService,
            private readonly potsplit: PotsplitService,
            private readonly handleGameOver: HandleGameOverService,
            private readonly responseHandler: ResponseHandlerService,
            private readonly tableManager: TableManagerService

        ) { }


        convert(input: any): any {
            if (systemConfig.isDecimal === true) {
                return parseFloat(parseFloat(input.toString()).toFixed(2));
            } else {
                return Math.round(input);
            }
        };



        /*============================  START  =================================*/
        // New
        async isGameProgress(params: any): Promise<any> {
            // serverLog(stateOfX.serverLogType.info, 'In moveRemote function isGameProgress');
            const validated = await validateKeySets("Request", "database", "isGameProgress", params);
            if (validated.success) {
                if (params.table.state === stateOfX.gameState.running) {
                    return { success: true, isGameOver: false };
                } else {
                    const gameOverResponse = await this.handleGameOver.processGameOver(params);
                    if (gameOverResponse.success) {
                        params = gameOverResponse.params;
                        params.data.success = true;
                        params.data.roundOver = true;
                        params.data.isGameOver = true;
                        params.data.currentBoardCard = params.data.remainingBoardCards;
                        params.data.winners = gameOverResponse.winners;
                        params.data.rakeDeducted = gameOverResponse.rakeDeducted;
                        params.data.cardsToShow = gameOverResponse.cardsToShow;
                        if (!!gameOverResponse.params.data.isBlindUpdated && gameOverResponse.params.data.isBlindUpdated) {
                            params.data.isBlindUpdated = gameOverResponse.params.data.isBlindUpdated;
                        }
                        const setActionKeysResponse = await this.responseHandler.setActionKeys(params);
                        return setActionKeysResponse;
                    } else {
                        return gameOverResponse;
                    }
                }
            } else {
                return validated;
            }
        }

        // Old
        // var isGameProgress = function (params, cb) {
        // // serverLog(stateOfX.serverLogType.info, 'In moveRemote function isGameProgress');
        // keyValidator.validateKeySets("Request", "database", "isGameProgress", params, function (validated) {
        //     if (validated.success) {
        //         if (params.table.state === stateOfX.gameState.running) {
        //             cb({ success: true, isGameOver: false });
        //         } else {
        //             handleGameOver.processGameOver(params, function (gameOverResponse) {
        //                 serverLog(stateOfX.serverLogType.info, 'Game over response in moveRemote - ' + JSON.stringify(gameOverResponse));
        //                 if (gameOverResponse.success) {
        //                     params = gameOverResponse.params;
        //                     serverLog(stateOfX.serverLogType.info, 'Extra cards poped out - ' + JSON.stringify(params.data.remainingBoardCards));
        //                     params.data.success = true;
        //                     params.data.roundOver = true;
        //                     params.data.isGameOver = true;
        //                     params.data.currentBoardCard = params.data.remainingBoardCards;
        //                     params.data.winners = gameOverResponse.winners;
        //                     params.data.rakeDeducted = gameOverResponse.rakeDeducted;
        //                     params.data.cardsToShow = gameOverResponse.cardsToShow;
        //                     serverLog(stateOfX.serverLogType.info, 'gameOverResponse.params.data.isBlindUpdated in moveRemote ' + gameOverResponse.params.data.isBlindUpdated);
        //                     if (!!gameOverResponse.params.data.isBlindUpdated && gameOverResponse.params.data.isBlindUpdated) {
        //                         params.data.isBlindUpdated = gameOverResponse.params.data.isBlindUpdated;
        //                     }
        //                     serverLog(stateOfX.serverLogType.info, 'After updating the value of isBlindUpdated ' + params.data.isBlindUpdated);

        //                     serverLog(stateOfX.serverLogType.info, 'Expected cards to display - ' + JSON.stringify(params.data.currentBoardCard));
        //                     responseHandler.setActionKeys(params, function (setActionKeysResponse) {
        //                         cb(setActionKeysResponse);
        //                     });
        //                 } else {
        //                     cb(gameOverResponse);
        //                 }
        //             });
        //         }
        //     } else {
        //         cb(validated);
        //     }
        // });
        // }
        /*============================  END  =================================*/



        /*============================  START  =================================*/
        // ### Add additional params in existing one for calculation
        // New
        async initializeParams(params: any): Promise<any> {

            const isGameProgressResponse = await this.isGameProgress(params);

            if (isGameProgressResponse.success && !isGameProgressResponse.isGameOver) {
                params.data = _.omit(params.data, '__route__');
                params.data.action = params.data.action.toUpperCase();

                params.data.index = _ld.findIndex(params.table.players, {
                    playerId: params.data.playerId,
                    active: true,
                });

                if (params.data.index < 0) {
                    params.data.index = _ld.findIndex(params.table.players, {
                        playerId: params.data.playerId,
                        state: stateOfX.playerState.disconnected,
                    });
                }

                if (params.data.index < 0) {
                    return {
                        success: false,
                        channelId: params.channelId || '',
                        info: this.popupTextManager.PLAYERINDEXINMOVEFAIL + params.data.action,
                        isRetry: false,
                        isDisplay: true,
                    };
                }

                params.data.playerName = params.table.players[params.data.index].playerName;
                params.table.players[params.data.index].activityRecord.lastActivityTime = Number(new Date());

                if (
                    this.convert(params.data.amount) ===
                    this.convert(
                        params.table.players[params.data.index].chips +
                        params.table.players[params.data.index].totalRoundBet
                    )
                ) {
                    params.data.action = stateOfX.move.allin;
                }

                params.data.roundOver = false;
                params.data.isGameOver = params.table.state === stateOfX.gameState.gameOver;
                params.data.chips = 0;
                params.data.amount = this.convert(params.data.amount);
                params.data.originAmount = this.convert(params.data.amount);
                params.data.considerAmount = this.convert(params.data.amount);

                if (
                    params.data.action === stateOfX.move.raise ||
                    params.data.action === stateOfX.move.bet ||
                    params.data.action === stateOfX.move.allin
                ) {
                    params.data.considerAmount = this.convert(
                        params.data.amount - params.table.players[params.data.index].totalRoundBet
                    );
                }

                params.data.pot = _.pluck(params.table.pot, 'amount');
                params.data.roundName = params.table.roundName;
                params.data.currentBoardCard = [[], []];
                params.data.isCurrentPlayer = true;

                return params;
            } else {
                return isGameProgressResponse;
            }
        }

        // Old
        // var initializeParams = function (params, cb) {
        //     serverLog(stateOfX.serverLogType.info, 'In moveRemote function initializeParams: DATA: ' + JSON.stringify(params.data));
        //     isGameProgress(params, function (isGameProgressResponse) {
        //         if (isGameProgressResponse.success && !isGameProgressResponse.isGameOver) {

        //             params.data = _.omit(params.data, '__route__');
        //             params.data.action = params.data.action.toUpperCase();
        //             // params.data.index = _ld.findIndex(params.table.players, { playerId: params.data.playerId, state: stateOfX.playerState.playing }); // testing ct
        //             params.data.index = _ld.findIndex(params.table.players, { playerId: params.data.playerId, active: true });
        //             // Check if player is in Disconnected state
        //             // In case auto turn for disconnected players
        //             if (params.data.index < 0) {
        //                 params.data.index = _ld.findIndex(params.table.players, { playerId: params.data.playerId, state: stateOfX.playerState.disconnected });
        //                 serverLog(stateOfX.serverLogType.info, 'Updated player index if disconnected - ' + params.data.index);
        //             }

        //             // Return if no index found while performing action
        //             if (params.data.index < 0) {
        //                 cb({ success: false, channelId: (params.channelId || ""), info: popupTextManager.PLAYERINDEXINMOVEFAIL + params.data.action, isRetry: false, isDisplay: true });
        //                 return false;
        //             }

        //             // Set player state connected
        //             // STORY: Minor fix/ feature requirement
        //             // WHAT IT USED TO DO? : set player.state as playing, if it is automove from disconnected player
        //             // IMPACT: game starts with disconnected player
        //             // FIX: not doing this, (commented following if comparison and assignment)
        //             // if(!params.data.isRequested && params.table.players[params.data.index].state === stateOfX.playerState.disconnected) {
        //             //   params.table.players[params.data.index].state = stateOfX.playerState.playing;
        //             // }

        //             // Set Player Name
        //             params.data.playerName = params.table.players[params.data.index].playerName;
        //             // Record last activity of a player
        //             params.table.players[params.data.index].activityRecord.lastActivityTime = Number(new Date()); // Record last activity of player

        //             // Set move as ALLIN based on chips played by player
        //             serverLog(stateOfX.serverLogType.info, 'Move amount: ' + params.data.amount + ', player chips: ' + params.table.players[params.data.index].chips);
        //             // if(parseInt(params.data.amount) === parseInt(params.table.players[params.data.index].chips)) {
        //             if (convert.convert(params.data.amount) === (convert.convert(params.table.players[params.data.index].chips + params.table.players[params.data.index].totalRoundBet))) {
        //                 params.data.action = stateOfX.move.allin;
        //             }

        //             params.data.roundOver = false;
        //             params.data.isGameOver = (params.table.state === stateOfX.gameState.gameOver);
        //             params.data.chips = 0;
        //             params.data.amount = convert.convert(params.data.amount);
        //             params.data.originAmount = convert.convert(params.data.amount);
        //             params.data.considerAmount = convert.convert(params.data.amount)
        //             if (params.data.action === stateOfX.move.raise || params.data.action === stateOfX.move.bet || params.data.action === stateOfX.move.allin) {
        //                 params.data.considerAmount = convert.convert(params.data.amount - params.table.players[params.data.index].totalRoundBet);
        //             }
        //             params.data.pot = _.pluck(params.table.pot, 'amount');
        //             params.data.roundName = params.table.roundName;
        //             params.data.currentBoardCard = [
        //                 [],
        //                 []
        //             ];
        //             params.data.isCurrentPlayer = true;
        //             cb(null, params)
        //         } else {
        //             cb(isGameProgressResponse);
        //         }
        //     });
        // }
        /*============================  END  =================================*/


        /*============================  START  =================================*/
        // ### Validate if the table entities set properly to start this game
        // New
        async validateTableAttributeToPerformMove(params: any): Promise<any> {
            try {
                await this.tableManager.validateEntities(params);
                return params;
            } catch (err) {
                console.log(stateOfX.serverLogType.error, 'Error while checking table config on player move - ' + JSON.stringify(err));
                throw err;
            }
        };
        // Old
        // var validateTableAttributeToPerformMove = function (params, cb) {
        //     tableManager.validateEntities(params, function (err, response) {
        //         if (!err) {
        //             cb(null, params);
        //         } else {
        //             serverLog(stateOfX.serverLogType.error, ' Error while checking table config on player move  - ' + JSON.stringify(err));
        //             cb(err);
        //         }
        //     });
        // }
        /*============================  END  =================================*/


        /*============================  START  =================================*/
        // ### Validate if move exists for game ["CHECK", "CALL", "BET", "RAISE", "ALLIN", "FOLD"]
        // New
        async isMoveExists(params: any): Promise<any> {

            const isGameProgressResponse = await this.isGameProgress(params);

            if (isGameProgressResponse.success && !isGameProgressResponse.isGameOver) {
                if (stateOfX.moves.indexOf(params.data.action) > -1) {
                    return params;
                } else {
                    return {
                        success: false,
                        channelId: params.channelId || "",
                        info: params.data.action + this.popupTextManager.ISMOVEEXISTS_MOVEREMOTE,
                        isRetry: false,
                        isDisplay: true
                    };
                }
            } else {
                return isGameProgressResponse;
            }
        };

        // Old
        // var isMoveExists = function (params, cb) {
        //     serverLog(stateOfX.serverLogType.info, 'In moveRemote function isMoveExists');
        //     isGameProgress(params, function (isGameProgressResponse) {
        //         if (isGameProgressResponse.success && !isGameProgressResponse.isGameOver) {
        //             if (stateOfX.moves.indexOf(params.data.action) > -1) {
        //                 cb(null, params)
        //             } else {
        //                 cb({ success: false, channelId: (params.channelId || ""), info: params.data.action + popupTextManager.ISMOVEEXISTS_MOVEREMOTE, isRetry: false, isDisplay: true });
        //                 //cb({success: false, info: params.data.action + " is not a valid move!"});
        //             }
        //         } else {
        //             cb(isGameProgressResponse);
        //         }
        //     });
        // };
        /*============================  END  =================================*/


        /*============================  START  =================================*/
        // ### Validate player - right player to act
        // New
        async validatePlayer(params: any): Promise<any> {

            const isGameProgressResponse = await this.isGameProgress(params);

            if (isGameProgressResponse.success && !isGameProgressResponse.isGameOver) {
                if (params.data.index >= 0) {
                    if (params.table.players[params.data.index].seatIndex === params.table.players[params.table.currentMoveIndex].seatIndex) {
                        return params;
                    } else {
                        return {
                            success: false,
                            isRetry: false,
                            isDisplay: false,
                            channelId: params.channelId,
                            info: this.popupTextManager.ISGAMEPROGRESS_VALIDATEPLAYER_MOVEREMOTE1
                        };
                    }
                } else {
                    return {
                        success: false,
                        isRetry: false,
                        isDisplay: true,
                        channelId: params.channelId || "",
                        info: this.popupTextManager.ISGAMEPROGRESS_VALIDATEPLAYER_MOVEREMOTE2
                    };
                }
            } else {
                return isGameProgressResponse;
            }
        };


        // Old
        // var validatePlayer = function (params, cb) {
        //     serverLog(stateOfX.serverLogType.info, 'In moveRemote function validatePlayer');
        //     isGameProgress(params, function (isGameProgressResponse) {
        //         if (isGameProgressResponse.success && !isGameProgressResponse.isGameOver) {
        //             if (params.data.index >= 0) {
        //                 if (params.table.players[params.data.index].seatIndex === params.table.players[params.table.currentMoveIndex].seatIndex) {
        //                     cb(null, params)
        //                 } else {
        //                     cb({ success: false, isRetry: false, isDisplay: false, channelId: params.channelId, info: popupTextManager.ISGAMEPROGRESS_VALIDATEPLAYER_MOVEREMOTE1 });
        //                     //cb({success: false, channelId: params.channelId, info: "You are not a valid player to take action!"});

        //                 }
        //             } else {
        //                 cb({ success: false, isRetry: false, isDisplay: true, channelId: (params.channelId || ""), info: popupTextManager.ISGAMEPROGRESS_VALIDATEPLAYER_MOVEREMOTE2 });
        //                 //cb({success: false, channelId: params.channelId, info: "You are not sitting on the table!"});
        //             }
        //         } else {
        //             cb(isGameProgressResponse);
        //         }
        //     });
        // };
        /*============================  END  =================================*/


        /*============================  START  =================================*/
        // ### Validate move and amount
        // like, FOLD with non-zero amount is invalid
        // New
        validateMoveAndAmount(params: any): any {
            // Do not process if amount less than 0
            if (this.convert(params.data.amount) < 0) {
                return {
                    success: false,
                    isRetry: false,
                    isDisplay: false,
                    channelId: params.channelId || "",
                    info: this.popupTextManager.ISGAMEPROGRESS_SETBETAMOUNT_MOVEREMOTE5
                };
            }

            // Validate moves and amount for which amount should be 0
            const movesWithNoAmount = [stateOfX.move.check, stateOfX.move.fold, stateOfX.move.call];

            if (movesWithNoAmount.indexOf(params.data.action) >= 0 && params.data.amount > 0) {
                return {
                    success: false,
                    isRetry: false,
                    isDisplay: false,
                    channelId: params.channelId || "",
                    info: this.popupTextManager.ISGAMEPROGRESS_SETBETAMOUNT_MOVEREMOTE1 + params.data.amount + params.data.action
                };
            }

            // Validate moves and amount for which amount should not be 0
            const movesWithAmount = [stateOfX.move.bet, stateOfX.move.raise];

            if (movesWithAmount.indexOf(params.data.action) >= 0 && this.convert(params.data.amount) === 0) {
                return {
                    success: false,
                    isRetry: false,
                    isDisplay: false,
                    channelId: params.channelId || "",
                    info: this.popupTextManager.ISGAMEPROGRESS_SETBETAMOUNT_MOVEREMOTE1 + params.data.amount + params.data.action
                };
            }

            // Validate if placed amount is higher than player's on-table amount
            if (this.convert(params.data.considerAmount) > this.convert(params.table.players[params.data.index].chips)) {
                return {
                    success: false,
                    isRetry: false,
                    isDisplay: false,
                    channelId: params.channelId || "",
                    info: this.popupTextManager.ISGAMEPROGRESS_SETBETAMOUNT_MOVEREMOTE3
                };
            }

            return { success: true };
        };

        // Old
        // var validateMoveAndAmount = function (params) {
        //     // Do not process if amount less than 0
        //     if (convert.convert(params.data.amount) < 0) {
        //         return ({ success: false, isRetry: false, isDisplay: false, channelId: (params.channelId || ""), info: popupTextManager.ISGAMEPROGRESS_SETBETAMOUNT_MOVEREMOTE5 });
        //     }

        //     // Validate moves and amount for which amount should be 0
        //     var movesWithNoAmount = [stateOfX.move.check, stateOfX.move.fold, stateOfX.move.call];

        //     if (movesWithNoAmount.indexOf(params.data.action) >= 0 && params.data.amount > 0) {
        //         return ({ success: false, isRetry: false, isDisplay: false, channelId: (params.channelId || ""), info: popupTextManager.ISGAMEPROGRESS_SETBETAMOUNT_MOVEREMOTE1 + params.data.amount + params.data.action });
        //     }

        //     // Validate moves and amount for which amount should not be 0
        //     var movesWithAmount = [stateOfX.move.bet, stateOfX.move.raise];

        //     if (movesWithAmount.indexOf(params.data.action) >= 0 && convert.convert(params.data.amount) === 0) {
        //         return ({ success: false, isRetry: false, isDisplay: false, channelId: (params.channelId || ""), info: popupTextManager.ISGAMEPROGRESS_SETBETAMOUNT_MOVEREMOTE1 + params.data.amount + params.data.action });
        //     }

        //     // Validate if placed amount is higher than player's on-tabe amount
        //     // if(params.data.amount > params.table.players[params.data.index].chips) {
        //     if (convert.convert(params.data.considerAmount) > convert.convert(params.table.players[params.data.index].chips)) {
        //         return ({ success: false, isRetry: false, isDisplay: false, channelId: (params.channelId || ""), info: popupTextManager.ISGAMEPROGRESS_SETBETAMOUNT_MOVEREMOTE3 });
        //     }

        //     return ({ success: true });
        // }
        /*============================  END  =================================*/

        /*============================  START  =================================*/
        // ### Validate if this amount is valid for this move
        // > If the move is valid then set amount in case of CALL and ALLIN
        // New
        async setBetAmount(params: any): Promise<any> {

            const isGameProgressResponse = await this.isGameProgress(params);
            if (isGameProgressResponse.success && !isGameProgressResponse.isGameOver) {

                const validate = this.validateMoveAndAmount(params);
                if (validate.success) {
                    // Set move amount based on different conditions
                    if (params.data.action === stateOfX.move.call) {
                        if (params.table.roundName === stateOfX.round.preflop &&
                            params.table.currentMoveIndex !== params.table.smallBlindIndex &&
                            params.table.currentMoveIndex !== params.table.bigBlindIndex) {
                            // TODO: Handle case when blinds ALLIN in first round and 3rd player call amount should be max of (bigBlind, maxBet)
                        }
                        params.data.amount = this.convert(params.table.roundMaxBet - params.table.roundBets[params.data.index]);
                        params.data.considerAmount = this.convert(params.data.amount);
                        return params;
                    }

                    // If move is ALLIN then amount and consider amount will be equal to player's on-table chips amount
                    if (params.data.action === stateOfX.move.allin) {
                        params.data.amount = this.convert(params.table.players[params.data.index].chips);
                        params.data.considerAmount = this.convert(params.data.amount);
                        return params;
                    }

                    if (params.data.action === stateOfX.move.raise) {

                        if (params.data.amount >= params.table.minRaiseAmount && params.data.amount <= params.table.maxRaiseAmount) {
                            return params;
                        } else {
                            return {
                                success: false,
                                isRetry: false,
                                isDisplay: false,
                                channelId: params.channelId || "",
                                info: params.data.action + this.popupTextManager.ISGAMEPROGRESS_SETBETAMOUNT_MOVEREMOTE4 + params.table.minRaiseAmount + " & " + params.table.maxRaiseAmount + "."
                            };
                        }
                    }

                    return params;
                } else {
                    return validate;
                }
            } else {
                return isGameProgressResponse;
            }
        };

        // Old
        // var setBetAmount = function (params, cb) {
        //     serverLog(stateOfX.serverLogType.info, 'In moveRemote function setBetAmount');
        //     isGameProgress(params, function (isGameProgressResponse) {
        //         if (isGameProgressResponse.success && !isGameProgressResponse.isGameOver) {
        //             serverLog(stateOfX.serverLogType.info, 'players while setting bet amount - ' + JSON.stringify(params.table.players[params.data.index]));
        //             serverLog(stateOfX.serverLogType.info, 'Data for this action - ' + JSON.stringify(params.data))
        //             serverLog(stateOfX.serverLogType.info, 'Round max bet - ' + params.table.roundMaxBet)
        //             serverLog(stateOfX.serverLogType.info, 'Roundbets - ' + JSON.stringify(params.table.roundBets));

        //             var validate = validateMoveAndAmount(params);
        //             if (validate.success) {
        //                 // Set move amount based on different conditions
        //                 if (params.data.action === stateOfX.move.call) {
        //                     if (params.table.roundName === stateOfX.round.preflop && params.table.currentMoveIndex != params.table.smallBlindIndex && params.table.currentMoveIndex != params.table.bigBlindIndex) {
        //                         // TODO: Handle case when blinds ALLIN in first round and 3rd player call amount should be max of (bigBlind, maxBet)
        //                     }
        //                     params.data.amount = convert.convert(params.table.roundMaxBet - params.table.roundBets[params.data.index]);
        //                     params.data.considerAmount = convert.convert(params.data.amount);
        //                     cb(null, params);
        //                     return true;
        //                 }

        //                 // If move is ALLIN then amount and consider amount will be equal to player's on-table chips amount
        //                 if (params.data.action === stateOfX.move.allin) {
        //                     params.data.amount = convert.convert(params.table.players[params.data.index].chips);
        //                     params.data.considerAmount = convert.convert(params.data.amount);
        //                     cb(null, params);
        //                     return true;
        //                 }


        //                 if (params.data.action === stateOfX.move.raise) {
        //                     // if(params.data.amount <= (params.table.roundMaxBet - params.table.roundBets[params.data.index])) {
        //                     serverLog(stateOfX.serverLogType.info, 'Player chips while validating raise amount' + convert.convert(params.table.players[params.data.index].chips))

        //                     // Special 2 player case in PREFLOP when small blind has placed half amount already
        //                     // But will get minimum raise double of big blind

        //                     if (params.data.amount >= params.table.minRaiseAmount && params.data.amount <= params.table.maxRaiseAmount) {
        //                         cb(null, params); // TODO : ERROR may be
        //                     } else {
        //                         cb({ success: false, isRetry: false, isDisplay: false, channelId: (params.channelId || ""), info: params.data.action + popupTextManager.ISGAMEPROGRESS_SETBETAMOUNT_MOVEREMOTE4 + params.table.minRaiseAmount + " & " + params.table.maxRaiseAmount + "." });
        //                         //cb({success: false, channelId: params.channelId, info: params.data.action + " amount must be in range " + params.table.minRaiseAmount + " - " + params.table.maxRaiseAmount})
        //                     }
        //                     return true;
        //                 }
        //                 cb(null, params);
        //             } else {
        //                 cb(validate)
        //             }
        //         } else {
        //             cb(isGameProgressResponse);
        //         }
        //     });
        // };
        /*============================  END  =================================*/


        /*============================  START  =================================*/
        // ### Validate if player has enough chips to make this bet
        // New
        async validateBetAmount(params: any): Promise<any> {

            const isGameProgressResponse = await this.isGameProgress(params);
            if (isGameProgressResponse.success && !isGameProgressResponse.isGameOver) {
                if (this.convert(params.table.players[params.data.index].chips) >= this.convert(params.data.considerAmount)) {
                    return params;
                } else {
                    return {
                        success: false,
                        isRetry: false,
                        isDisplay: false,
                        channelId: params.channelId || "",
                        info: this.popupTextManager.ISGAMEPROGRESS_VALIDATEBETAMOUNT_MOVEREMOTE
                    };
                }
            } else {
                return isGameProgressResponse;
            }
        };

        // Old
        // var validateBetAmount = function (params, cb) {
        //     serverLog(stateOfX.serverLogType.info, 'In moveRemote function validateBetAmount');
        //     isGameProgress(params, function (isGameProgressResponse) {
        //         if (isGameProgressResponse.success && !isGameProgressResponse.isGameOver) {
        //             // serverLog(stateOfX.serverLogType.info, 'Player move will be ' + params.data.action + ' with value - ' + params.data.amount);
        //             // if(params.table.players[params.data.index].chips >= params.data.amount) {
        //             if (convert.convert(params.table.players[params.data.index].chips) >= convert.convert(params.data.considerAmount)) {
        //                 cb(null, params);
        //             } else {
        //                 cb({ success: false, isRetry: false, isDisplay: false, channelId: (params.channelId || ""), info: popupTextManager.ISGAMEPROGRESS_VALIDATEBETAMOUNT_MOVEREMOTE });
        //                 //cb({success: false, channelId: params.channelId, info: "Player cannot make " + params.data.action + " with amount " + params.data.amount});
        //             }
        //         } else {
        //             cb(isGameProgressResponse);
        //         }
        //     });
        // };
        /*============================  END  =================================*/



        /*============================  START  =================================*/
        // ###  Validate if current move is alloed for this player (CHECK mainly)
        // New
        async validateMoveAllowed(params: any): Promise<any> {

            const isGameProgressResponse = await this.isGameProgress(params);
            if (isGameProgressResponse.success && !isGameProgressResponse.isGameOver) {
                if (params.data.action === stateOfX.move.check) {
                    if (
                        params.table.roundName === stateOfX.round.preflop &&
                        params.table.roundBets[params.table.currentMoveIndex] === params.table.roundMaxBet &&
                        params.data.index === params.table.bigBlindIndex
                    ) {
                        return params;
                    } else if (params.table.roundBets[params.table.currentMoveIndex] === params.table.roundMaxBet) {
                        return params;
                    } else {
                        return {
                            success: false,
                            channelId: params.channelId || "",
                            isRetry: false,
                            isDisplay: true,
                            info: params.data.action + this.popupTextManager.ISGAMEPROGRESS_VALIDATEMOVEALLOWED_MOVEREMOTE
                        };
                    }
                } else {
                    return params;
                }
            } else {
                return isGameProgressResponse;
            }
        };


        // Old
        // var validateMoveAllowed = function (params, cb) {
        //     serverLog(stateOfX.serverLogType.info, 'In moveRemote function validateMoveAllowed');
        //     isGameProgress(params, function (isGameProgressResponse) {
        //         if (isGameProgressResponse.success && !isGameProgressResponse.isGameOver) {
        //             if (params.data.action === stateOfX.move.check) {
        //                 // If this is big blind player then check allowed in first round
        //                 // only if there is no extra bet placed in the game
        //                 // serverLog(stateOfX.serverLogType.info, 'Round name - ' + params.table.roundName)
        //                 // serverLog(stateOfX.serverLogType.info, 'Round bets - ' + params.table.roundBets)
        //                 // serverLog(stateOfX.serverLogType.info, 'currentMoveIndex - ' + params.table.currentMoveIndex)
        //                 // serverLog(stateOfX.serverLogType.info, 'Player bets in round - ' + params.table.roundBets[params.table.currentMoveIndex])
        //                 // serverLog(stateOfX.serverLogType.info, 'Round max bet - ' + params.table.roundMaxBet)
        //                 // serverLog(stateOfX.serverLogType.info, 'Check allowed verification - ' + (params.table.roundBets[params.table.currentMoveIndex] == params.table.roundMaxBet))
        //                 if (params.table.roundName === stateOfX.round.preflop && (params.table.roundBets[params.table.currentMoveIndex] == params.table.roundMaxBet) && (params.data.index === params.table.bigBlindIndex)) {
        //                     cb(null, params);
        //                 } else {
        //                     if (params.table.roundBets[params.table.currentMoveIndex] == params.table.roundMaxBet) {
        //                         cb(null, params);
        //                     } else {
        //                         cb({ success: false, channelId: (params.channelId || ""), isRetry: false, isDisplay: true, info: params.data.action + popupTextManager.ISGAMEPROGRESS_VALIDATEMOVEALLOWED_MOVEREMOTE });
        //                     }
        //                 }
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
        // ### Set player move to ALLIN if player act with his total amount
        // New
        async setAllInMove(params: any): Promise<any> {

            const isGameProgressResponse = await this.isGameProgress(params);
            if (isGameProgressResponse.success && !isGameProgressResponse.isGameOver) {
                // Convert action to ALLIN if amount equals player's chips
                // In case of BET or RAISE
                if (params.data.action === stateOfX.move.bet || params.data.action === stateOfX.move.raise) {
                    if (
                        this.convert(params.data.amount) ===
                        this.convert(params.table.players[params.data.index].chips + (params.table.players[params.data.index].totalRoundBet || 0))
                    ) {
                        console.log(stateOfX.serverLogType.info, 'Player move set to ALLIN by bet, raise');
                        params.data.action = stateOfX.move.allin;
                    } else {
                        console.log(stateOfX.serverLogType.info, 'ALLIN not set as player has enough amount to play! by bet, raise');
                    }
                } else if (params.data.action === stateOfX.move.call) {
                    if (this.convert(params.data.amount) === this.convert(params.table.players[params.data.index].chips)) {
                        console.log(stateOfX.serverLogType.info, 'Player move set to ALLIN by call');
                        params.data.action = stateOfX.move.allin;
                    } else {
                        console.log(stateOfX.serverLogType.info, 'ALLIN not set as player has enough amount to play! by call');
                    }
                } else {
                    console.log(stateOfX.serverLogType.info, 'ALLIN not set as action is - ' + params.data.action);
                }
                return params;
            } else {
                return isGameProgressResponse;
            }
        };


        // Old
        // var setAllInMove = function (params, cb) {
        //     console.log(stateOfX.serverLogType.info, 'In moveRemote function setAllInMove');
        //     isGameProgress(params, function (isGameProgressResponse) {
        //         if (isGameProgressResponse.success && !isGameProgressResponse.isGameOver) {
        //             // Convert action as ALLIN if amount is equal to player's chips
        //             // In case of BET, and RAISE
        //             if (params.data.action === stateOfX.move.bet || params.data.action === stateOfX.move.raise) {
        //                 // if(params.data.amount == (params.table.players[params.data.index].chips)) {
        //                 if (convert.convert(params.data.amount) == convert.convert(params.table.players[params.data.index].chips + (params.table.players[params.data.index].totalRoundBet || 0))) {
        //                     console.log(stateOfX.serverLogType.info, 'Player move set to ALLIN by bet, raise');
        //                     params.data.action = stateOfX.move.allin;
        //                 } else {
        //                     console.log(stateOfX.serverLogType.info, 'ALLIN not set as player has enough amount to play! by bet, raise');
        //                 }
        //             } else if (params.data.action === stateOfX.move.call) {
        //                 if (convert.convert(params.data.amount) == convert.convert(params.table.players[params.data.index].chips)) {
        //                     console.log(stateOfX.serverLogType.info, 'Player move set to ALLIN by call');
        //                     params.data.action = stateOfX.move.allin;
        //                 } else {
        //                     console.log(stateOfX.serverLogType.info, 'ALLIN not set as player has enough amount to play! by bet, raise');
        //                 }
        //             } else {
        //                 console.log(stateOfX.serverLogType.info, 'ALLIN not set as action is - ' + params.data.action);
        //             }
        //             cb(null, params);
        //         } else {
        //             cb(isGameProgressResponse);
        //         }
        //     });
        // };
        /*============================  END  =================================*/


        /*============================  START  =================================*/
        // ### Update player details for this move
        // New
        updatePlayer(params: any): any {

            const isGameProgressResponse: any = this.isGameProgress(params);
            if (isGameProgressResponse.success && !isGameProgressResponse.isGameOver) {
                const player = params.table.players.find((p: any) => p.playerId === params.data.playerId);
                if (player) {
                    if (player.active) {
                        player.chips = this.convert(player.chips - params.data.considerAmount);
                        player.totalRoundBet = this.convert(player.totalRoundBet + params.data.considerAmount);
                        player.totalGameBet = this.convert(player.totalGameBet + params.data.considerAmount);
                        params.data.chips = this.convert(player.chips);
                        player.lastBet = this.convert(params.data.amount);
                        player.precheckValue = stateOfX.playerPrecheckValue.NONE;
                        player.lastMove = params.data.action;
                        player.isPlayed = true;
                        player.lastRoundPlayed = params.table.roundName;
                        if (params.data.action === stateOfX.move.fold && params.data.isRequested === false) {
                            player.isActionBySystem = true;
                        }
                        if ((params.data.action === stateOfX.move.fold) || (params.data.action === stateOfX.move.allin)) {
                            player.active = false;
                        }
                        if (player.tournamentData.isTimeBankUsed) {
                            player.tournamentData.timeBankLeft -= Math.ceil((Number(new Date()) - player.tournamentData.timeBankStartedAt) / 1000);
                            player.tournamentData.isTimeBankUsed = false;
                            player.tournamentData.timeBankStartedAt = null;
                            params.table.timeBankStartedAt = null;
                        }
                        if (player.isTimeBankUsed) {
                            player.isTimeBankUsed = false;
                            player.timeBankSec -= Math.ceil((Number(new Date()) - player.timeBankStartedAt) / 1000);
                            player.timeBankSec = (player.timeBankSec < 0) ? 0 : player.timeBankSec;
                            player.timeBankStartedAt = null;
                        }
                        return params;
                    } else {
                        return {
                            success: false,
                            isRetry: false,
                            isDisplay: false,
                            channelId: (params.channelId || ""),
                            info: this.popupTextManager.ACTIVEPLAYER_ISGAMEPROGRESS_UPDATEPLAYER_MOVEREMOTE
                        };
                    }
                } else {
                    return {
                        success: false,
                        channelId: (params.channelId || ""),
                        info: this.popupTextManager.ISGAMEPROGRESS_UPDATEPLAYER_MOVEREMOTE,
                        isRetry: false,
                        isDisplay: true
                    };
                }
            } else {
                return isGameProgressResponse;
            }
        }


        // Old
        // var updatePlayer = function (params, cb) {
        //     console.log(stateOfX.serverLogType.info, 'In moveRemote function updatePlayer');
        //     isGameProgress(params, function (isGameProgressResponse) {
        //         if (isGameProgressResponse.success && !isGameProgressResponse.isGameOver) {
        //             var player = _.findWhere(params.table.players, { playerId: params.data.playerId });
        //             if (!!player) { // If player exists
        //                 serverLog(stateOfX.serverLogType.info, 'Updating player on ' + params.data.action + ': ' + JSON.stringify(player));
        //                 if (player.active) { // If player state is playing

        //                     // Update chips, state, lastBet, lastMove, isPlayed of this player
        //                     // Deduct chips based on move: RAISE and BET will do not deduct amount already posted on table
        //                     serverLog(stateOfX.serverLogType.info, 'player.chips pre ' + convert.convert(player.chips));
        //                     // if(params.data.action === stateOfX.move.raise || params.data.action === stateOfX.move.bet) {
        //                     //   serverLog(stateOfX.serverLogType.info, 'amount to deduct - ' + (parseInt(params.data.amount) - parseInt(params.table.roundBets[params.data.index])));
        //                     //   player.chips = parseInt(player.chips) - (parseInt(params.data.amount) - parseInt(params.table.roundBets[params.data.index]));
        //                     //   player.totalRoundBet = parseInt(player.totalRoundBet) + (parseInt(params.data.amount) - parseInt(params.table.roundBets[params.data.index]));
        //                     // } else {
        //                     //   params.table.roundBets[params.data.index] = parseInt(params.table.roundBets[params.data.index]) + parseInt(params.data.amount);
        //                     // }
        //                     serverLog(stateOfX.serverLogType.info, 'amount to deduct - ' + params.data.considerAmount);
        //                     player.chips = convert.convert(player.chips - params.data.considerAmount);
        //                     player.totalRoundBet = convert.convert(player.totalRoundBet + params.data.considerAmount);
        //                     player.totalGameBet = convert.convert(player.totalGameBet + params.data.considerAmount);
        //                     serverLog(stateOfX.serverLogType.info, 'Updated chips of player: ' + convert.convert(player.chips));
        //                     params.data.chips = convert.convert(player.chips);
        //                     player.lastBet = convert.convert(params.data.amount);
        //                     player.precheckValue = stateOfX.playerPrecheckValue.NONE;
        //                     player.lastMove = params.data.action;
        //                     player.isPlayed = true;
        //                     player.lastRoundPlayed = params.table.roundName;
        //                     // player.activityRecord.lastMovePlayerAt = new Date();
        //                     if (params.data.action === stateOfX.move.fold && params.data.isRequested === false) {
        //                         player.isActionBySystem = true;
        //                     }
        //                     // Make this player inactive based on action
        //                     if ((params.data.action === stateOfX.move.fold) || (params.data.action === stateOfX.move.allin)) {
        //                         serverLog(stateOfX.serverLogType.info, "This player will no longer active for this game.");
        //                         player.active = false;
        //                     }

        //                     // Update player details for tournament
        //                     if (player.tournamentData.isTimeBankUsed) {
        //                         player.tournamentData.timeBankLeft -= Math.ceil((Number(new Date()) - player.tournamentData.timeBankStartedAt) / 1000);
        //                         player.tournamentData.isTimeBankUsed = false;
        //                         player.tournamentData.timeBankStartedAt = null
        //                         params.table.timeBankStartedAt = null;
        //                     }
        //                     // time bank subtraction, for normal games
        //                     if (player.isTimeBankUsed) {
        //                         player.isTimeBankUsed = false;
        //                         player.timeBankSec -= Math.ceil((Number(new Date()) - player.timeBankStartedAt) / 1000);
        //                         player.timeBankSec = (player.timeBankSec < 0) ? 0 : player.timeBankSec;
        //                         player.timeBankStartedAt = null;
        //                     }

        //                     serverLog(stateOfX.serverLogType.info, 'Updated player after move - ' + JSON.stringify(player));
        //                     cb(null, params)
        //                 } else {
        //                     cb({ success: false, isRetry: false, isDisplay: false, channelId: (params.channelId || ""), info: popupTextManager.ACTIVEPLAYER_ISGAMEPROGRESS_UPDATEPLAYER_MOVEREMOTE });
        //                     //cb({success: false, channelId: params.channelId, info: 'You are in state - ' + player.state + ', with last action as - ' + player.lastMove + ' !'});
        //                 }
        //             } else {
        //                 cb({ success: false, channelId: (params.channelId || ""), info: popupTextManager.ISGAMEPROGRESS_UPDATEPLAYER_MOVEREMOTE, isRetry: false, isDisplay: true });
        //             }
        //         } else {
        //             cb(isGameProgressResponse);
        //         }
        //     });
        // };
        /*============================  END  =================================*/


        /*============================  START  =================================*/
        // generate text summary only on fold here
        // New
        async summaryOnFold(params: any): Promise<any> {
            if (params.data.action === stateOfX.move.fold) {
                testSummary.onFold(params);
            }
            return params;
        }

        // Old
        // var summaryOnFold = function (params, cb) {
        //     if (params.data.action == stateOfX.move.fold) {
        //         testSummary.onFold(params);
        //     }
        //     cb(null, params);
        // }
        /*============================  END  =================================*/



        /*============================  START  =================================*/
        // Set round bets and round max bets for this table
        // New
        async setRoundBets(params: any): Promise<any> {

            // Update the player's round bet by adding the considerAmount
            params.table.roundBets[params.data.index] = this.convert(
                params.table.roundBets[params.data.index] + params.data.considerAmount
            );

            // Store the last maximum bet before updating
            params.data.roundLastMaxBet = this.convert(params.table.roundMaxBet);

            // Update the round's maximum bet to the highest bet among all players
            params.table.roundMaxBet = _.max(params.table.roundBets);

            return params;
        }


        // Old
        // var setRoundBets = function (params, cb) {
        //     serverLog(stateOfX.serverLogType.info, 'in moveRemote function setRoundBets');
        //     serverLog(stateOfX.serverLogType.info, 'Action is: ' + params.data.action + ' and amount: ' + params.data.amount);
        //     // Do not add current amount if move is BET/RAISE
        //     // if(params.data.action === stateOfX.move.raise || params.data.action === stateOfX.move.bet) {
        //     //   params.table.roundBets[params.data.index] = parseInt(params.data.amount);
        //     // } else {
        //     // }
        //     params.table.roundBets[params.data.index] = convert.convert(params.table.roundBets[params.data.index] + params.data.considerAmount);
        //     params.data.roundLastMaxBet = convert.convert(params.table.roundMaxBet);
        //     params.table.roundMaxBet = _.max(params.table.roundBets);
        //     cb(null, params);
        // }
        /*============================  END  =================================*/




        /*============================  START  =================================*/
        // Set all in occured for table if player move is allin
        // New
        async setAllInOccured(params: any): Promise<any> {

            if (params.data.action === stateOfX.move.allin) {
                const playerWiseCards = {
                    playerId: params.data.playerId,
                    cards: _.pluck(_.where(params.table.players, { playerId: params.data.playerId }), 'cards')[0]
                };

                params.table.allInPLayerCardsCards.push(playerWiseCards);
                params.table.isAllInOcccured = true;
            }

            return params;
        }
        // Old
        // var setAllInOccured = function (params, cb) {
        //     serverLog(stateOfX.serverLogType.info, 'in moveRemote function setAllInOccured');
        //     if (params.data.action === stateOfX.move.allin) {
        //         var playerWiseCards = {};
        //         var cards = _.pluck(_.where(params.table.players, { playerId: params.data.playerId }), 'cards');
        //         playerWiseCards.playerId = params.data.playerId;
        //         playerWiseCards.cards = cards[0];
        //         params.table.allInPLayerCardsCards.push(playerWiseCards);
        //         params.table.isAllInOcccured = true
        //     }
        //     cb(null, params);
        // }
        /*============================  END  =================================*/




        /*============================  START  =================================*/
        // update table contributors, and amount on this table
        // New
        async setTotalContributors(params: any): Promise<any> {

            const contributorIndex = _ld.findIndex(params.table.contributors, { playerId: params.data.playerId });

            if (contributorIndex >= 0) {

                params.table.contributors[contributorIndex].amount = this.convert(params.table.contributors[contributorIndex].amount + params.data.considerAmount);
                params.table.contributors[contributorIndex].tempAmount = this.convert(params.table.contributors[contributorIndex].amount);
            } else {
                params.table.contributors.push({
                    playerId: params.data.playerId,
                    amount: this.convert(params.data.amount),
                    tempAmount: this.convert(params.data.amount)
                });
            }

            return params;
        }


        // Old
        // var setTotalContributors = function (params, cb) {
        //     console.log('setTotalContributors begin', params.table.contributors)
        //     serverLog(stateOfX.serverLogType.info, 'in moveRemote function setTotalContributors');
        //     var contributorIndex = _ld.findIndex(params.table.contributors, { playerId: params.data.playerId });
        //     if (contributorIndex >= 0) {
        //         serverLog(stateOfX.serverLogType.info, 'GameContri: Updating player ' + params.data.playerId + ' contribution')
        //         serverLog(stateOfX.serverLogType.info, 'GameContri: Previous contribution - ' + convert.convert(params.table.contributors[contributorIndex].amount))
        //         serverLog(stateOfX.serverLogType.info, 'GameContri: Amount to be added - ' + convert.convert(params.data.considerAmount))
        //         serverLog(stateOfX.serverLogType.info, 'GameContri: Updated contribution will be - ' + (convert.convert(params.table.contributors[contributorIndex].amount) + convert.convert(params.data.considerAmount)));
        //         params.table.contributors[contributorIndex].amount = convert.convert(params.table.contributors[contributorIndex].amount + params.data.considerAmount);
        //         params.table.contributors[contributorIndex].tempAmount = convert.convert(params.table.contributors[contributorIndex].amount)
        //     } else {
        //         params.table.contributors.push({
        //             playerId: params.data.playerId,
        //             amount: convert.convert(params.data.amount),
        //             tempAmount: convert.convert(params.data.amount)
        //         })
        //     }
        //     console.log('setTotalContributors end', params.table.contributors);
        //     serverLog(stateOfX.serverLogType.info, 'GameContri: Contribution - ' + JSON.stringify(params.table.contributors));
        //     cb(null, params);
        // }
        /*============================  END  =================================*/



        /*============================  START  =================================*/
        // update round contributors, and amount on this table
        // New
        async setRoundContributors(params: any): Promise<any> {

            const contributorIndex = _ld.findIndex(params.table.roundContributors, { playerId: params.data.playerId });

            if (contributorIndex >= 0) {

                params.table.roundContributors[contributorIndex].amount = this.convert(params.table.roundContributors[contributorIndex].amount + params.data.considerAmount);
                params.table.roundContributors[contributorIndex].tempAmount = this.convert(params.table.roundContributors[contributorIndex].amount);
            } else {
                params.table.roundContributors.push({
                    playerId: params.data.playerId,
                    amount: this.convert(params.data.amount),
                    tempAmount: this.convert(params.data.amount)
                });
            }


            return params;
        }


        // Old
        // var setRoundContributors = function (params, cb) {
        //     serverLog(stateOfX.serverLogType.info, 'in moveRemote function setRoundContributors');
        //     serverLog(stateOfX.serverLogType.info, '==== Before Round contributors ===== ' + JSON.stringify(params.table.roundContributors));
        //     var contributorIndex = _ld.findIndex(params.table.roundContributors, { playerId: params.data.playerId });
        //     if (contributorIndex >= 0) {
        //         serverLog(stateOfX.serverLogType.info, 'RoundContri: Updating player ' + params.data.playerId + ' contribution')
        //         serverLog(stateOfX.serverLogType.info, 'RoundContri: Previous contribution - ' + convert.convert(params.table.roundContributors[contributorIndex].amount))
        //         serverLog(stateOfX.serverLogType.info, 'RoundContri: Amount to be added - ' + convert.convert(params.data.considerAmount))
        //         serverLog(stateOfX.serverLogType.info, 'RoundContri: Updated contribution will be - ' + (convert.convert(params.table.roundContributors[contributorIndex].amount) + convert.convert(params.data.considerAmount)));
        //         params.table.roundContributors[contributorIndex].amount = convert.convert(params.table.roundContributors[contributorIndex].amount + params.data.considerAmount);
        //         params.table.roundContributors[contributorIndex].tempAmount = convert.convert(params.table.roundContributors[contributorIndex].amount)
        //     } else {
        //         params.table.roundContributors.push({
        //             playerId: params.data.playerId,
        //             amount: convert.convert(params.data.amount),
        //             tempAmount: convert.convert(params.data.amount)
        //         })
        //     }
        //     serverLog(stateOfX.serverLogType.info, 'RoundContri: Round contributors - ' + JSON.stringify(params.table.roundContributors));
        //     cb(null, params);
        // }
        /*============================  END  =================================*/



        /*============================  START  =================================*/
        // update pot split on table IF round is over
        // New
        async addAmountToPot(params: any): Promise<any> {

            const roundOverResponse = await this.roundOver.checkRoundOver(params);

            if (roundOverResponse.success && roundOverResponse.roundIsOver) {
                const processSplitResponse = await this.potsplit.processSplit(params);


                if (processSplitResponse.success) {
                    params = processSplitResponse.params;
                    return params;
                } else {
                    throw processSplitResponse;
                }
            } else {
                return params;
            }
        }

        // Old
        // var addAmountToPot = function (params, cb) {
        //     console.log('processSplit in addAmountToPot');
        //     serverLog(stateOfX.serverLogType.info, 'in moveRemote function addAmountToPot');
        //     roundOver.checkRoundOver(params, function (roundOverResponse) {
        //         // serverLog(stateOfX.serverLogType.info, 'roundOverResponse --------> ' + JSON.stringify(roundOverResponse));
        //         if (roundOverResponse.success && roundOverResponse.roundIsOver) {
        //             // serverLog(stateOfX.serverLogType.info, '---------POT BEFORE SPLIT--------------')
        //             // serverLog(stateOfX.serverLogType.info, JSON.stringify(params.table.pot))
        //             potsplit.processSplit(params, function (processSplitResponse) {
        //                 serverLog(stateOfX.serverLogType.info, 'moveRemote ==> processSplitResponse - ' + _.keys(processSplitResponse.params))
        //                 if (processSplitResponse.success) {
        //                     params = processSplitResponse.params;
        //                     serverLog(stateOfX.serverLogType.info, 'moveRemote ==> ==== PARAM DATA =====');
        //                     serverLog(stateOfX.serverLogType.info, JSON.stringify(params.data));
        //                     console.log('params.data', params.data)
        //                     cb(null, params);
        //                 } else {
        //                     cb(processSplitResponse);
        //                 }
        //             });

        //         } else {
        //             cb(null, params);
        //         }
        //     });
        // }
        /*============================  END  =================================*/


        /*============================  START  =================================*/
        // Set current raise and raise difference
        // check for under raise condition
        // New
        async checkUnderRaise(params: any): Promise<any> {

            // Check if under raise occur
            if (params.data.action === stateOfX.move.allin) {
                let expectedRaiseDiff = this.convert(params.data.amount - params.table.lastRaiseAmount);
                let allinAmountLessThanMinRaise = this.convert(params.data.amount) < this.convert(params.table.minRaiseAmount - (params.table.players[params.data.index].totalRoundBet || 0));

                if (!params.table.isBettingRoundLocked) {
                    let IwasLastToAct = true;
                    for (let i = 0; i < params.table.players.length; i++) {
                        let player = params.table.players[i];
                        if (player.playerId !== params.data.playerId && params.table.onStartPlayers.indexOf(params.table.players[i].playerId) >= 0 && params.table.players[i].roundId === params.table.roundId) {
                            // playing players except me!
                            if (player.state === stateOfX.playerState.playing || player.state === stateOfX.playerState.disconnected) {
                                if (player.active) {
                                    if (!player.isPlayed) {
                                        IwasLastToAct = false;
                                        break;
                                    } else {
                                        if (params.data.roundLastMaxBet !== player.totalRoundBet) {
                                            if (player.lastMove !== stateOfX.move.allin) {
                                                IwasLastToAct = false;
                                                break;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    if (IwasLastToAct && allinAmountLessThanMinRaise) {
                        params.table.isBettingRoundLocked = true;
                    } else {
                        console.log(stateOfX.serverLogType.info, "The raise difference is greater than half of previous raise diff, under raise is not applicable.");
                    }
                } else {
                    console.log(stateOfX.serverLogType.info, "The betting round has been already locked!");
                }
            }

            // Set raise values
            if (params.data.action === stateOfX.move.raise || params.data.action === stateOfX.move.bet || params.data.action === stateOfX.move.allin) {
                if ((this.convert(params.data.originAmount - params.table.lastRaiseAmount)) >= this.convert(params.table.raiseDifference) && this.convert(params.data.originAmount) >= convert.convert(params.table.lastRaiseAmount)) {
                    params.table.raiseDifference = this.convert(params.data.originAmount - params.table.lastRaiseAmount);
                    params.table.considerRaiseToMax = this.convert(params.table.raiseDifference);
                    params.table.lastRaiseAmount = this.convert(params.data.originAmount);
                    params.table.raiseBy = params.data.playerId;
                } else {
                    console.log(stateOfX.serverLogType.info, "Not updating raise difference and last raise on table value!");
                }
            } else {
                console.log(stateOfX.serverLogType.info, "Not updating raise difference and last raise on table because of " + params.data.action + " move!");
            }

            return params;
        }


        // Old
        // var checkUnderRaise = function (params, cb) {
        //     serverLog(stateOfX.serverLogType.info, "Table Min Raise: " + params.table.minRaiseAmount);
        //     serverLog(stateOfX.serverLogType.info, "Previous Raise difference: " + params.table.raiseDifference);
        //     serverLog(stateOfX.serverLogType.info, "Previous RAISE amount: " + params.table.lastRaiseAmount);
        //     serverLog(stateOfX.serverLogType.info, "Current " + params.data.action + " amount: " + params.data.amount);
        //     serverLog(stateOfX.serverLogType.info, "Expected Raise difference: " + (convert.convert(params.data.amount) - params.table.lastRaiseAmount));

        //     // Check if under raise occur
        //     if (params.data.action === stateOfX.move.allin) {
        //         var expectedRaiseDiff = convert.convert(params.data.amount - params.table.lastRaiseAmount);
        //         var allinAmountLessThanMinRaise = convert.convert(params.data.amount) < convert.convert(params.table.minRaiseAmount - (params.table.players[params.data.index].totalRoundBet || 0));
        //         serverLog(stateOfX.serverLogType.info, "Expected Raise difference: " + expectedRaiseDiff);


        //         if (!params.table.isBettingRoundLocked) {
        //             var IwasLastToAct = true;
        //             for (var i = 0; i < params.table.players.length; i++) {
        //                 var player = params.table.players[i];
        //                 serverLog(stateOfX.serverLogType.info, "other player " + i + " - " + JSON.stringify(player));
        //                 if (player.playerId != params.data.playerId && params.table.onStartPlayers.indexOf(params.table.players[i].playerId) >= 0 && params.table.players[i].roundId == params.table.roundId) {
        //                     // playing players except me!
        //                     if (player.state === stateOfX.playerState.playing || player.state === stateOfX.playerState.disconnected) {
        //                         if (player.active) {
        //                             if (!player.isPlayed) {
        //                                 IwasLastToAct = false;
        //                                 serverLog(stateOfX.serverLogType.info, "Current player was not last to act. 1")
        //                                 break;
        //                             } else {
        //                                 if (params.data.roundLastMaxBet != player.totalRoundBet) {
        //                                     if (player.lastMove !== stateOfX.move.allin) {
        //                                         IwasLastToAct = false;
        //                                         serverLog(stateOfX.serverLogType.info, "Current player was not last to act. 2")
        //                                         break;
        //                                     }
        //                                 }
        //                             }
        //                         }
        //                     }
        //                 }
        //             }
        //             // if(IwasLastToAct && expectedRaiseDiff < parseInt(params.table.raiseDifference/2)) {
        //             if (IwasLastToAct && allinAmountLessThanMinRaise) {
        //                 serverLog(stateOfX.serverLogType.info, "Raise difference is less than half of previous raise, under raise applicable!");
        //                 params.table.isBettingRoundLocked = true;
        //             } else {
        //                 serverLog(stateOfX.serverLogType.info, "The raise difference is greater than half of previous raise diff, under raise is not applicable.");
        //             }
        //         } else {
        //             serverLog(stateOfX.serverLogType.info, "The betting round has been already locked!");
        //         }
        //     }

        //     // Set raise values
        //     if (params.data.action === stateOfX.move.raise || params.data.action === stateOfX.move.bet || params.data.action === stateOfX.move.allin) {
        //         serverLog(stateOfX.serverLogType.info, "Old values - " + params.data.amount + "," + params.table.lastRaiseAmount + "," + params.table.raiseDifference + "," + params.table.considerRaiseToMax);
        //         if ((convert.convert(params.data.originAmount - params.table.lastRaiseAmount)) >= convert.convert(params.table.raiseDifference) && convert.convert(params.data.originAmount) >= convert.convert(params.table.lastRaiseAmount)) {
        //             serverLog(stateOfX.serverLogType.info, "Updating raise difference and last raise on table value!" + params.table.players[params.data.index].totalRoundBet);
        //             params.table.raiseDifference = convert.convert(params.data.originAmount - params.table.lastRaiseAmount);
        //             params.table.considerRaiseToMax = convert.convert(params.table.raiseDifference);
        //             params.table.lastRaiseAmount = convert.convert(params.data.originAmount);
        //             params.table.raiseBy = params.data.playerId;
        //             serverLog(stateOfX.serverLogType.info, "New values - " + params.data.amount + "," + params.table.lastRaiseAmount + "," + params.table.raiseDifference + "," + params.table.considerRaiseToMax);
        //         } else {
        //             serverLog(stateOfX.serverLogType.info, "Not updating raise difference and last raise on table value!");
        //         }
        //         serverLog(stateOfX.serverLogType.info, "Updated Raise difference: " + params.table.raiseDifference);
        //         serverLog(stateOfX.serverLogType.info, "Updated raise amount: " + params.table.lastRaiseAmount);
        //     } else {
        //         serverLog(stateOfX.serverLogType.info, "Not updating raise difference and last raise on table bacause of " + params.data.action + " move!");
        //     }

        //     cb(null, params);
        // }
        /*============================  END  =================================*/


        /*============================  START  =================================*/
        // Update table elements for this action
        // > roundBets, roundMaxBet and pot
        // and contributors
        // New
        async updateTable(params: any): Promise<any> {

            // Check if the game is in progress
            const isGameProgressResponse = await this.isGameProgress(params);
            if (isGameProgressResponse.success && !isGameProgressResponse.isGameOver) {
                try {
                    await this.setRoundBets(params);
                    await this.setAllInOccured(params);
                    await this.setTotalContributors(params);
                    await this.setRoundContributors(params);
                    await this.addAmountToPot(params);
                    await this.checkUnderRaise(params);

                    return params;
                } catch (err) {
                    console.error('Error during async operations', err);
                    return {
                        success: false,
                        channelId: params.channelId || "",
                        info: this.popupTextManager.ASYNCWATERFALL_ISGAMEPROGRESS_UPDATETABLE_MOVEREMOTE,
                        isRetry: false,
                        isDisplay: true
                    };
                }
            } else {
                return isGameProgressResponse;
            }
        }


        // Old
        // var updateTable = function (params, cb) {
        //     console.log('updateTable contributors begin', params.table.contributors.length);
        //     serverLog(stateOfX.serverLogType.info, 'In moveRemote function updateTable');
        //     isGameProgress(params, function (isGameProgressResponse) {
        //         if (isGameProgressResponse.success && !isGameProgressResponse.isGameOver) {
        //             async.waterfall([
        //                 async.apply(setRoundBets, params),
        //                 setAllInOccured,
        //                 setTotalContributors,
        //                 setRoundContributors,
        //                 addAmountToPot,
        //                 checkUnderRaise
        //             ], function (err, response) {
        //                 if (err && !response) {
        //                     cb({ success: false, channelId: (params.channelId || ""), info: popupTextManager.ASYNCWATERFALL_ISGAMEPROGRESS_UPDATETABLE_MOVEREMOTE, isRetry: false, isDisplay: true })
        //                     //cb({success: false, channelId: params.channelId, info: "Updating table for this move failed!"})
        //                 } else {
        //                     console.log('updateTable contributors end', params.table.contributors.length);
        //                     cb(null, params)
        //                 }
        //             });
        //         } else {
        //             cb(isGameProgressResponse);
        //         }
        //     });
        // };
        /*============================  END  =================================*/



        /*============================  START  =================================*/
        // Check If game is over due to this move
        // > Handle all game over cases here
        // IF no player had move
        // New
        validateGameOver(params: any): any {

            // Game should be over if no player left with a move
            if (!this.tableManager.isPlayerWithMove(params)) {
                params.table.state = stateOfX.gameState.gameOver;
            }

            return params;
        }


        // Old
        // var validateGameOver = function (params, cb) {
        //     serverLog(stateOfX.serverLogType.info, 'In moveRemote function validateGameOver');
        //     // Game should over if no player left with move
        //     if (tableManager.isPlayerWithMove(params) === false) {
        //         serverLog(stateOfX.serverLogType.info, 'There are no players with move left into the game, Game Over!')
        //         params.table.state = stateOfX.gameState.gameOver;
        //     }
        //     cb(null, params);
        // }
        /*============================  END  =================================*/


        /*============================  END  =================================*/
        // process round over
        // internally it will check if round is over or not
        // New
        async isRoundOver(params: any): Promise<any> {

            const isGameProgressResponse = await this.isGameProgress(params);

            if (isGameProgressResponse.success && !isGameProgressResponse.isGameOver) {
                const processRoundOverResponse = await this.roundOver.processRoundOver(params);

                if (processRoundOverResponse.success && !processRoundOverResponse.isGameOver) {
                    return processRoundOverResponse.params;
                } else {
                    return processRoundOverResponse;
                }
            } else {
                return isGameProgressResponse;
            }
        }


        // Old
        // var isRoundOver = function (params, cb) {
        //     serverLog(stateOfX.serverLogType.info, 'In moveRemote function isRoundOver');
        //     // serverLog(stateOfX.serverLogType.info, 'Checking round over condition.')
        //     isGameProgress(params, function (isGameProgressResponse) {
        //         console.log('isRoundOver', isGameProgressResponse);
        //         if (isGameProgressResponse.success && !isGameProgressResponse.isGameOver) {
        //             roundOver.processRoundOver(params, function (processRoundOverResponse) {
        //                 console.log('not reacheble', processRoundOverResponse, processRoundOverResponse.isGameOver);
        //                 if (processRoundOverResponse.success && !processRoundOverResponse.isGameOver) {
        //                     console.log('not reacheble if');
        //                     cb(null, processRoundOverResponse.params);
        //                 } else {
        //                     console.log('not reacheble else');
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
        // set next player who has move
        // according to cases - round got over or not
        // New
        async setNextPlayer(params: any): Promise<any> {

            try {
                const isGameProgressResponse = await this.isGameProgress(params);

                if (isGameProgressResponse.success && !isGameProgressResponse.isGameOver) {

                    if (params.data.roundOver) {
                        params.table.currentMoveIndex = params.table.firstActiveIndex;
                    } else {
                        params.table.currentMoveIndex = params.table.players[params.data.index].nextActiveIndex;
                    }


                    if (params.table.currentMoveIndex === -1) {
                        return {
                            success: false,
                            channelId: params.channelId || "",
                            info: this.popupTextManager.ISGAMEPROGRESS_SETNEXTPLAYER_MOVEREMOTE,
                            isRetry: false,
                            isDisplay: true
                        };
                    } else {
                        params.table.maxRaiseAmount = this.convert(this.tableManager.maxRaise(params.table));
                        return params;
                    }
                } else {
                    return isGameProgressResponse;
                }
            } catch (error) {
                console.error('Error in setNextPlayer:', error);
                throw error;
            }
        }


        // Old
        // var setNextPlayer = function (params, cb) {
        //     serverLog(stateOfX.serverLogType.info, 'In moveRemote function setNextPlayer');
        //     isGameProgress(params, function (isGameProgressResponse) {
        //         if (isGameProgressResponse.success && !isGameProgressResponse.isGameOver) {
        //             serverLog(stateOfX.serverLogType.info, 'Round over while setting next player move - ' + params.data.roundOver);
        //             if (params.data.roundOver) {
        //                 serverLog(stateOfX.serverLogType.info, 'First move index while setting first turn after round end: ' + params.table.firstActiveIndex);
        //                 params.table.currentMoveIndex = params.table.firstActiveIndex;
        //                 serverLog(stateOfX.serverLogType.info, 'Updated current move index on-round-over - ' + params.table.currentMoveIndex);
        //             } else {
        //                 serverLog(stateOfX.serverLogType.info, 'Current player details while setting next player move - ' + JSON.stringify(params.table.players[params.data.index]));
        //                 params.table.currentMoveIndex = params.table.players[params.data.index].nextActiveIndex;
        //                 serverLog(stateOfX.serverLogType.info, 'Updated current move index on no-round-over - ' + params.table.currentMoveIndex);
        //             }
        //             serverLog(stateOfX.serverLogType.info, 'Updated current move index - ' + params.table.currentMoveIndex);
        //             if (params.table.currentMoveIndex === -1) {
        //                 cb({ success: false, channelId: (params.channelId || ""), info: popupTextManager.ISGAMEPROGRESS_SETNEXTPLAYER_MOVEREMOTE, isRetry: false, isDisplay: true });
        //                 serverLog(stateOfX.serverLogType.info, 'An error occured while performing move players - ' + JSON.stringify(params.table.players));
        //                 return false;
        //             } else {
        //                 params.table.maxRaiseAmount = convert.convert(tableManager.maxRaise(params.table));
        //                 cb(null, params)
        //             }
        //         } else {
        //             cb(isGameProgressResponse);
        //         }
        //     });
        // };
        /*============================  END  =================================*/


        /*============================  START  =================================*/
        // ### Update first player index if
        // > First active player left the game
        // New
        async setfirstActiveIndex(params: any): Promise<any> {

            try {
                const isGameProgressResponse = await this.isGameProgress(params);

                if (isGameProgressResponse.success && !isGameProgressResponse.isGameOver) {
                    if (
                        (params.data.action === stateOfX.move.fold || params.data.action === stateOfX.move.allin) &&
                        params.data.index === params.table.firstActiveIndex
                    ) {
                        params.table.firstActiveIndex = params.table.players[params.data.index].nextActiveIndex;
                    } else {
                        console.log(stateOfX.serverLogType.info, 'Not resetting first move index from - ' + params.table.firstActiveIndex);
                    }
                }

                return params;
            } catch (error) {
                console.error('Error in setfirstActiveIndex:', error);
                throw error;
            }
        }

        // Old
        // var setfirstActiveIndex = function (params, cb) {
        //     serverLog(stateOfX.serverLogType.info, 'In moveRemote function setfirstActiveIndex');
        //     isGameProgress(params, function (isGameProgressResponse) {
        //         if (isGameProgressResponse.success && !isGameProgressResponse.isGameOver) {
        //             if ((params.data.action === stateOfX.move.fold || params.data.action === stateOfX.move.allin) && params.data.index === params.table.firstActiveIndex) {
        //                 serverLog(stateOfX.serverLogType.info, 'Resetting first move index from - ' + params.table.firstActiveIndex);
        //                 params.table.firstActiveIndex = params.table.players[params.data.index].nextActiveIndex;
        //                 serverLog(stateOfX.serverLogType.info, 'Resetting first move index to - ' + params.table.firstActiveIndex);
        //                 cb(null, params);
        //             } else {
        //                 serverLog(stateOfX.serverLogType.info, 'Not resetting first move index from - ' + params.table.firstActiveIndex);
        //                 cb(null, params);
        //             }
        //         } else {
        //             cb(isGameProgressResponse);
        //         }
        //     });
        // };
        /*============================  END  =================================*/


        /*============================  START  =================================*/
        // set moves for next player
        // New
        async getMoves(params: any): Promise<any> {

            try {
                const isGameProgressResponse = await this.isGameProgress(params);

                if (isGameProgressResponse.success && !isGameProgressResponse.isGameOver) {
                    const getMoveResponse = await this.setMove.getMove(params);

                    if (getMoveResponse.success) {
                        return getMoveResponse.params;
                    } else {
                        return getMoveResponse;
                    }
                } else {
                    return isGameProgressResponse;
                }
            } catch (error) {
                console.error('Error in getMoves:', error);
                throw error;
            }
        }

        // Old
        // var getMoves = function (params, cb) {
        //     serverLog(stateOfX.serverLogType.info, 'In moveRemote function getMoves');
        //     isGameProgress(params, function (isGameProgressResponse) {
        //         if (isGameProgressResponse.success && !isGameProgressResponse.isGameOver) {
        //             setMove.getMove(params, function (getMoveResponse) {
        //                 if (getMoveResponse.success) {
        //                     cb(null, getMoveResponse.params);
        //                 } else {
        //                     cb(getMoveResponse);
        //                 }
        //             });
        //         } else {
        //             cb(isGameProgressResponse);
        //         }
        //     });
        // };
        /*============================  END  =================================*/


        /*============================  START  =================================*/
        // Adjust active player indexes among each other
        // > Set preActiveIndex and nextActiveIndex values for each player
        // > Used for turn transfer importantly
        // New
        async adjustActiveIndexes(params: any): Promise<any> {

            if (params.data.action === stateOfX.move.fold || params.data.action === stateOfX.move.allin) {
                const performResponse = await this.adjustIndex.perform(params);
                return performResponse.params;
            } else {
                return params;
            }
        }


        // Old
        // var adjustActiveIndexes = function (params, cb) {
        //     serverLog(stateOfX.serverLogType.info, 'In moveRemote function adjustActiveIndexes');
        //     if (params.data.action === stateOfX.move.fold || params.data.action === stateOfX.move.allin) {
        //         adjustIndex.perform(params, function (performResponse) {
        //             serverLog(stateOfX.serverLogType.info, 'Updated active indexes response: ' + JSON.stringify(performResponse));
        //             cb(null, performResponse.params);
        //         });
        //     } else {
        //         cb(null, params);
        //     }
        // };
        /*============================  END  =================================*/


        /*============================  START  =================================*/
        // ### Decide players prechecks
        // New
        async decidePlayerPrechecks(params: any): Promise<any> {
            const assignPrechecksResponse = await this.setMove.assignPrechecks(params);

            if (assignPrechecksResponse.success) {
                return assignPrechecksResponse.params;
            } else {
                return assignPrechecksResponse;
            }
        }


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
        // ### Create response for this move
        // > Considering turn, round over and Game over can happen at once
        // New
        async createTurnResponse(params: any): Promise<any> {

            const isGameProgressResponse = await this.isGameProgress(params);

            if (isGameProgressResponse.success && !isGameProgressResponse.isGameOver) {
                // Set current time for player turn starts at
                params.table.turnTimeStartAt = Number(new Date());

                params.data.success = true;
                params.data.isGameOver = false;
                params.data.winners = isGameProgressResponse.winners;
                params.data.rakeDeducted = isGameProgressResponse.rakeDeducted;
                params.data.cardsToShow = isGameProgressResponse.cardsToShow;

                const setActionKeysResponse = await this.responseHandler.setActionKeys(params);
                return setActionKeysResponse;
            } else {
                return isGameProgressResponse;
            }
        }


        // Old
        // var createTurnResponse = function (params, cb) {
        //     serverLog(stateOfX.serverLogType.info, 'In moveRemote function createTurnResponse');
        //     isGameProgress(params, function (isGameProgressResponse) {
        //         if (isGameProgressResponse.success && !isGameProgressResponse.isGameOver) {

        //             // Set current time for player turn starts at
        //             params.table.turnTimeStartAt = Number(new Date());

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
        // ### Set min and max raise amount for next player
        // > Who is going to get move after this action
        // Rule for min raise = Current Bet + Next Player Call Amount - Previous Bet Amount on table
        // New
        async setMinMaxRaiseAmount(params: any): Promise<any> {

            const isGameProgressResponse = await this.isGameProgress(params);

            if (isGameProgressResponse.success && !isGameProgressResponse.isGameOver) {
                params.table.maxRaiseAmount = this.tableManager.maxRaise(params.table);

                params.table.minRaiseAmount = this.tableManager.minRaise(params);

                return params;
            } else {
                return isGameProgressResponse;
            }
        }


    // Old
    // var setMinMaxRaiseAmount = function (params, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'In moveRemote function setMinMaxRaiseAmount');
    //     // if(params.table.currentMoveIndex === -1) {
    //     //   cb({success: false, isRetry: false, isDisplay: true, channelId: (params.channelId || ""),info: popupTextManager.NOCURRENTPLAYERONMAXRAISE});
    //     //   return false;
    //     // }
    //     isGameProgress(params, function (isGameProgressResponse) {
    //         if (isGameProgressResponse.success && !isGameProgressResponse.isGameOver) {
    //             params.table.maxRaiseAmount = tableManager.maxRaise(params.table);
    //             serverLog(stateOfX.serverLogType.info, 'Updated max raise value - ' + params.table.maxRaiseAmount);
    //             params.table.minRaiseAmount = tableManager.minRaise(params);
    //             serverLog(stateOfX.serverLogType.info, 'Updated min raise value - ' + params.table.minRaiseAmount);
    //             cb(null, params);
    //         } else {
    //             cb(isGameProgressResponse);
    //         }
    //     });
    // }
    /*============================  END  =================================*/



    /*============================  START  =================================*/
        // ### Handle all cases required to handle a player move
        // > Params: {self, channelId, table, data {channelId, playerId, amount, action, isRequested}, table}
        // New
        async takeAction(params: any): Promise<any> {
            params = _.omit(params, 'self');

            try {
                params = await this.initializeParams(params);
                params = await this.validateTableAttributeToPerformMove(params);
                params = await this.isMoveExists(params);
                params = await this.validatePlayer(params);
                params = await this.validateMoveAllowed(params);
                params = await this.setBetAmount(params);
                params = await this.validateBetAmount(params);
                params = await this.setAllInMove(params);
                params = await this.updatePlayer(params);
                params = await this.updateTable(params);
                params = await this.summaryOnFold(params);
                params = await this.validateGameOver(params);
                params = await this.isRoundOver(params);
                params = await this.setfirstActiveIndex(params);
                params = await this.setNextPlayer(params);
                params = await this.setMinMaxRaiseAmount(params);
                params = await this.getMoves(params);
                params = await this.decidePlayerPrechecks(params);
                params = await this.adjustActiveIndexes(params);
                params = await this.createTurnResponse(params);

                activity.makeMove(params, stateOfX.profile.category.game, stateOfX.game.subCategory.move, params, stateOfX.logType.success);
                activity.makeMove(params, stateOfX.profile.category.gamePlay, stateOfX.gamePlay.subCategory.move, params, stateOfX.logType.success);

                return { success: true, table: params.table, data: params.data };
            } catch (err: any) {
                if (err && err.data && err.data.success) {
                    return { success: true, table: params.table, data: params.data };
                } else {
                    activity.makeMove(params, stateOfX.profile.category.game, stateOfX.game.subCategory.move, err, stateOfX.logType.error);
                    activity.makeMove(params, stateOfX.profile.category.gamePlay, stateOfX.gamePlay.subCategory.move, err, stateOfX.logType.error);
                    return err;
                }
            }
        }


        // Old
        // moveRemote.takeAction = function (params, cb) {
        //             console.log(stateOfX.serverLogType.info, 'In moveRemote function moveRemote', params);
        //             params = _.omit(params, 'self')
        //             serverLog(stateOfX.serverLogType.info, 'Action perform params - ' + JSON.stringify(params.table.players));

        //             async.waterfall([
        //                 async.apply(initializeParams, params),
        //                 validateTableAttributeToPerformMove,
        //                 isMoveExists,
        //                 validatePlayer,
        //                 validateMoveAllowed,
        //                 setBetAmount,
        //                 validateBetAmount,
        //                 setAllInMove,
        //                 updatePlayer,
        //                 updateTable,
        //                 summaryOnFold,
        //                 validateGameOver,
        //                 isRoundOver,
        //                 setfirstActiveIndex,
        //                 setNextPlayer,
        //                 setMinMaxRaiseAmount,
        //                 getMoves,
        //                 decidePlayerPrechecks,
        //                 adjustActiveIndexes,
        //                 createTurnResponse

        //             ], function (err, response) {
        //                 if (err) {
        //                     if (!!err.data && err.data.success) {
        //                         cb({ success: true, table: params.table, data: params.data });
        //                     } else {
        //                         // serverLog(stateOfX.serverLogType.info, 'moveRemote - This should not be a success response - ' + JSON.stringify(err));
        //                         activity.makeMove(params, stateOfX.profile.category.game, stateOfX.game.subCategory.move, response, stateOfX.logType.error);
        //                         activity.makeMove(params, stateOfX.profile.category.gamePlay, stateOfX.gamePlay.subCategory.move, response, stateOfX.logType.error);
        //                         cb(err);
        //                     }
        //                 } else {
        //                     activity.makeMove(params, stateOfX.profile.category.game, stateOfX.game.subCategory.move, response, stateOfX.logType.success);
        //                     activity.makeMove(params, stateOfX.profile.category.gamePlay, stateOfX.gamePlay.subCategory.move, response, stateOfX.logType.success);
        //                     cb({ success: true, table: params.table, data: params.data });
        //                 }
        //             });
        //         };
    /*============================  END  =================================*/












    }