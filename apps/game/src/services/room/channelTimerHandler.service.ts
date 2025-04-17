import { Injectable } from "@nestjs/common";
import _ from "underscore";
import _ld from "lodash";
import systemConfig from "./../../../../../libs/common/src/systemConfig.json";
import popupTextManager from "../../../../../libs/common/src/popupTextManager";
import stateOfX from "shared/common/stateOfX.sevice";
import * as keyValidator from '../../../../../libs/common/src/utils/keysDictionary';
import { PokerDatabaseService } from "shared/common/datebase/pokerdatabase.service";
import { ImdbDatabaseService } from "shared/common/datebase/Imdbdatabase.service";
import { BroadcastHandlerService } from "./broadcastHandler.service";
import { SubscriptionHandlerService } from "./subscriptionHandler.service";

const pomelo: any; // In this place we have add socket.io

schedule = require('node-schedule'),
    logDB = require("../../../../../shared/model/logDbQuery.js"),


    @Injectable()
    export class ChannelTimerHandlerService {

        private configMsg = popupTextManager.falseMessages;
        private dbConfigMsg = popupTextManager.dbQyeryInfo;

        constructor(
            private readonly db: PokerDatabaseService,
            private readonly imdb: ImdbDatabaseService,
            private readonly broadcastHandler: BroadcastHandlerService,
            private readonly subscriptionHandler: SubscriptionHandlerService,
        ) { }



        /*=====================  START  =====================*/
        // ### Kill channel timers for moves and other tasks

        async killChannelLevelTimers(params: any): Promise<any> {
            console.trace("inside killChannelLevelTimers", params);
            console.log(stateOfX.serverLogType.info, 'In channelTimerHandler function killChannelLevelTimers');

            // Kill previous timer if exists
            if (params.channel) {
                params.channel.startedAt = null;
                params.channel.updatedTimeBank = 0;
                params.channel.currentMovePlayer = null;
            }

            if (params.channel?.turnTimeReference) {
                clearTimeout(params.channel.turnTimeReference);
                params.channel.turnTimeReference = null;
            } else {
                console.log(stateOfX.serverLogType.error, 'TURN TIMER NOT EXISTS, while restarting auto turn timer !!');
            }

            if (params.channel?.extraTurnTimeReference) {
                clearTimeout(params.channel.extraTurnTimeReference);
                params.channel.extraTurnTimeReference = null;
            } else {
                console.log(stateOfX.serverLogType.error, 'EXTRA TURN TIMER NOT EXISTS, while restarting auto turn timer !!');
            }

            // Handle freeTurnTimeReference
            if (params.channel?.freeTurnTimeReference?.startedAt) {
                const timeUsed = Math.floor((Date.now() - params.channel.freeTurnTimeReference.startedAt) / 1000);

                if (timeUsed > 0 && params.request) {
                    try {
                        const gotHandId = await this.db.findHandIdByRoundId({ roundId: params.channel.roundId });
                        const handId = gotHandId?.[0]?.handId || '';

                        const data = {
                            type: "freeTurnEnded",
                            timeBankUsed: timeUsed,
                            channelId: params.channelId || params.request.channelId,
                            roundId: handId,
                            playerId: params.request.playerId,
                            tableName: params.channel?.channelName || ''
                        };

                        await this.subscriptionHandler.saveSubscriptionHistory(data);
                    } catch (err) {
                        console.error("Error saving freeTurnEnded subscription history:", err);
                    }
                }

                clearTimeout(params.channel.freeTurnTimeReference);
                params.channel.freeTurnTimeReference = null;
            }

            // Handle extraDisconnectionTimeReference
            if (params.channel?.extraDisconnectionTimeReference?.startedAt) {
                const timeUsed = Math.floor((Date.now() - params.channel.extraDisconnectionTimeReference.startedAt) / 1000);

                if (timeUsed > 0 && params.request) {
                    try {
                        //Deducting used amount of freeTurnTime
                        const gotHandId = await this.db.findHandIdByRoundId({ roundId: params.channel.roundId });
                        const handId = gotHandId?.[0]?.handId || '';

                        const data = {
                            type: "disconnectionEnded",
                            disconnectionTimeUsed: timeUsed,
                            channelId: params.channelId || params.request.channelId,
                            roundId: handId,
                            playerId: params.request.playerId,
                            tableName: params.channel?.channelName || ''
                        };

                        await this.subscriptionHandler.saveSubscriptionHistory(data);
                    } catch (err) {
                        console.error("Error saving disconnectionEnded subscription history:", err);
                    }
                }

                clearTimeout(params.channel.extraDisconnectionTimeReference);
                params.channel.extraDisconnectionTimeReference = null;
            }

            if (params.channel?.timeBankTurnTimeReference) {
                clearTimeout(params.channel.timeBankTurnTimeReference);
                params.channel.timeBankTurnTimeReference = null;
            } else {
                console.log(stateOfX.serverLogType.error, 'TIMEBANK TURN TIMER NOT EXISTS, while restarting auto turn timer !!');
            }

            if (params.channel?.clientConnAckReference) {
                clearTimeout(params.channel.clientConnAckReference);
                params.channel.clientConnAckReference = null;
            }

            if (params.channel?.playerSimpleMoveWithTimeBank) {
                clearTimeout(params.channel.playerSimpleMoveWithTimeBank);
                params.channel.playerSimpleMoveWithTimeBank = null;
            }

            if (params.channel?.performAutoSitout) {
                clearTimeout(params.channel.performAutoSitout);
                params.channel.performAutoSitout = null;
            }
        };

        // var killChannelLevelTimers = function (params) {
        // console.trace("inside killChannelLevelTimers", params)
        // serverLog(stateOfX.serverLogType.info, 'In channelTimerHandler function killChannelLevelTimers');
        // // Kill previous timer if exists
        // if (!!params.channel) {
        //     params.channel.startedAt = null;
        //     params.channel.updatedTimeBank = 0;
        //     params.channel.currentMovePlayer = null;
        // }
        // if (!!params.channel.turnTimeReference) {
        //     clearTimeout(params.channel.turnTimeReference);
        //     params.channel.turnTimeReference = null;
        // } else {
        //     serverLog(stateOfX.serverLogType.error, 'TURN TIMER NOT EXISTS, while restarting auto turn timer !!')
        // }

        // if (!!params.channel.extraTurnTimeReference) {
        //     clearTimeout(params.channel.extraTurnTimeReference);
        //     params.channel.extraTurnTimeReference = null;
        // } else {
        //     serverLog(stateOfX.serverLogType.error, 'EXTRA TURN TIMER NOT EXISTS, while restarting auto turn timer !!')
        // }

        // //Implemented for freeTurnTime 
        // if (!!params.channel.freeTurnTimeReference) {
        //     let timeUsed = Math.floor((Number(new Date()) - params.channel.freeTurnTimeReference.startedAt) / 1000);
        //     if (timeUsed > 0) {
        //         if (!!params.request) {
        //             //Deducting used amount of freeTurnTime
        //             logDB.findHandIdByRoundId({ roundId: params.channel.roundId }, function (err, gotHandId) {
        //                 console.log("gotHandIdgotHandId", err, gotHandId)
        //                 let handId = '';
        //                 if (!err && gotHandId.length) {
        //                     handId = gotHandId[0].handId
        //                 }
        //                 let data = {
        //                     type: "freeTurnEnded",
        //                     timeBankUsed: timeUsed,
        //                     channelId: params.channelId ? params.channelId : params.request.channelId,
        //                     roundId: handId,
        //                     playerId: params.request.playerId,
        //                     tableName: params.channel ? params.channel.channelName : '',
        //                 }
        //                 subscriptionHandler.saveSubscriptionHistory(data);
        //             })
        //         }
        //     }
        //     clearTimeout(params.channel.freeTurnTimeReference);
        //     params.channel.freeTurnTimeReference = null;
        // }


        // //Implemented for extraDisconnectionTime
        // if (!!params.channel.extraDisconnectionTimeReference) {
        //     let timeUsed = Math.floor((Number(new Date()) - params.channel.extraDisconnectionTimeReference.startedAt) / 1000);
        //     if (timeUsed > 0) {
        //         if (!!params.request) {
        //             //Note:In this condition we will deduct extraDisconnection time used by user and update the extraDisconnection used.
        //             logDB.findHandIdByRoundId({ roundId: params.channel.roundId }, function (err, gotHandId) {
        //                 console.log("gotHandIdgotHandId", err, gotHandId)
        //                 let handId = '';
        //                 if (!err && gotHandId.length) {
        //                     handId = gotHandId[0].handId
        //                 }
        //                 let data = {
        //                     type: "disconnectionEnded",
        //                     disconnectionTimeUsed: timeUsed,
        //                     channelId: params.channelId ? params.channelId : params.request.channelId,
        //                     roundId: handId,
        //                     playerId: params.request.playerId,
        //                     tableName: params.channel ? params.channel.channelName : '',
        //                 }
        //                 subscriptionHandler.saveSubscriptionHistory(data);
        //             })
        //         }
        //     }
        //     clearTimeout(params.channel.extraDisconnectionTimeReference);
        //     params.channel.extraDisconnectionTimeReference = null;
        // }

        // if (!!params.channel.timeBankTurnTimeReference) {
        //     clearTimeout(params.channel.timeBankTurnTimeReference);
        //     params.channel.timeBankTurnTimeReference = null;
        // } else {
        //     serverLog(stateOfX.serverLogType.error, 'TIMEBANK TURN TIMER NOT EXISTS, while restarting auto turn timer !!')
        // }

        // // Reset delay timer while checking client connection
        // if (!!params.channel.clientConnAckReference) {
        //     clearTimeout(params.channel.clientConnAckReference)
        //     params.channel.clientConnAckReference = null;
        // }

        // if (!!params.channel.playerSimpleMoveWithTimeBank) {
        //     clearTimeout(params.channel.playerSimpleMoveWithTimeBank)
        //     params.channel.playerSimpleMoveWithTimeBank = null;
        // }

        // if (!!params.channel.performAutoSitout) {
        //     clearTimeout(params.channel.performAutoSitout)
        //     params.channel.performAutoSitout = null;
        // }
        // }
        /*=====================  END  =====================*/


        /*=====================  START  =====================*/
        // Handling case of disconnection after starting timeBank
        async disconnectionAfterTimeBank(msg: any, channel: any): Promise<any> {

            channel.startedAt = null;

            if (!!channel.freeTurnTimeReference) {
                const timeUsed = Math.floor((Date.now() - channel.freeTurnTimeReference.startedAt) / 1000);

                if (timeUsed > 0) {
                    try {
                        const gotHandId = await this.db.findHandIdByRoundId({ roundId: channel.roundId });
                        const handId = gotHandId?.[0]?.handId || '';

                        const data = {
                            type: "freeTurnEnded",
                            timeBankUsed: timeUsed,
                            channelId: msg.channelId,
                            roundId: handId,
                            playerId: msg.playerId,
                            tableName: channel.channelName || ''
                        };

                        await this.subscriptionHandler.saveSubscriptionHistory(data);
                    } catch (err) {
                        console.error("Error in freeTurnTimeReference subscription log:", err);
                    }
                }

                clearTimeout(channel.freeTurnTimeReference as unknown as NodeJS.Timeout);
                channel.freeTurnTimeReference = null;
            }

            if (channel.playerSimpleMoveWithTimeBank) {
                clearTimeout(channel.playerSimpleMoveWithTimeBank);
                channel.playerSimpleMoveWithTimeBank = null;
            }

            const disconnectionData = {
                channel: channel,
                channelId: msg.channelId,
                playerId: msg.playerId,
                playerName: msg.playerName,
                session: ''
            };

            autoActDisconnected(disconnectionData);
        };


        // channelTimerHandler.disconnectionAfterTimeBank = function (msg, channel) {
        //     channel.startedAt = null;
        //     if (!!channel.freeTurnTimeReference) {
        //         let timeUsed = Math.floor((Number(new Date()) - channel.freeTurnTimeReference.startedAt) / 1000);
        //         if (timeUsed > 0) {
        //             //Deducting used amount of freeTurnTime
        //             logDB.findHandIdByRoundId({ roundId: channel.roundId }, function (err, gotHandId) {
        //                 let handId = '';
        //                 if (!err && gotHandId.length) {
        //                     handId = gotHandId[0].handId
        //                 }
        //                 let data = {
        //                     type: "freeTurnEnded",
        //                     timeBankUsed: timeUsed,
        //                     channelId: msg.channelId,
        //                     roundId: handId,
        //                     playerId: msg.playerId,
        //                     tableName: channel.channelName || '',
        //                 }
        //                 subscriptionHandler.saveSubscriptionHistory(data);
        //             })
        //         }
        //         clearTimeout(channel.freeTurnTimeReference);
        //         channel.freeTurnTimeReference = null;
        //     }
        //     if (!!channel.playerSimpleMoveWithTimeBank) {
        //         clearTimeout(channel.playerSimpleMoveWithTimeBank)
        //         channel.playerSimpleMoveWithTimeBank = null;
        //     }
        //     let disconnectionData = {
        //         channel: channel,
        //         channelId: msg.channelId,
        //         playerId: msg.playerId,
        //         playerName: msg.playerName,
        //         session: ''
        //     }

        //     autoActDisconnected(disconnectionData);
        // }
        /*=====================  END  =====================*/

        /*=====================  START  =====================*/
        // Handling case of reconnection after disconnection sterted
        async reconnectionAfterDisconnection(msg: any, channel: any): Promise<any> {

            channel.startedAt = null;

            if (channel.extraTurnTimeReference) {
                clearTimeout(channel.extraTurnTimeReference);
                channel.extraTurnTimeReference = null;
            }

            if (channel.extraDisconnectionTimeReference) {
                const timeUsed = Math.floor((Date.now() - channel.extraDisconnectionTimeReference.startedAt) / 1000);

                if (timeUsed > 0) {
                    try {
                        const gotHandId = await this.findHandIdByRoundId(channel.roundId);
                        const handId = gotHandId?.[0]?.handId || '';

                        const data = {
                            type: "disconnectionEnded",
                            disconnectionTimeUsed: timeUsed,
                            channelId: msg.channelId,
                            roundId: handId,
                            playerId: msg.playerId,
                            tableName: channel.channelName || '',
                        };

                        await this.subscriptionHandler.saveSubscriptionHistory(data);
                    } catch (error) {
                        console.error("Error saving disconnection history:", error);
                    }
                }

                clearTimeout(channel.extraDisconnectionTimeReference as unknown as NodeJS.Timeout);
                channel.extraDisconnectionTimeReference = null;
            }

            if (channel.playerSimpleMoveWithTimeBank) {
                clearTimeout(channel.playerSimpleMoveWithTimeBank);
                channel.playerSimpleMoveWithTimeBank = null;
            }

            try {
                const getCurrentPlayerResponse = await this.getCurrentPlayer(msg.channelId, msg.playerId, "state");

                if (getCurrentPlayerResponse.success) {
                    const gotPlayer = getCurrentPlayerResponse.player;

                    if (gotPlayer.timeBankSec && gotPlayer.timeBankStartedAt) {
                        gotPlayer.timeBankSec -= Math.ceil((Date.now() - gotPlayer.timeBankStartedAt) / 1000);
                        gotPlayer.timeBankSec = Math.max(gotPlayer.timeBankSec, 0);
                    }

                    const connectionData = {
                        channel,
                        channelId: msg.channelId,
                        playerId: msg.playerId,
                        playerName: msg.playerName,
                        player: gotPlayer,
                        session: '',
                    };

                    autoActConnected(connectionData);
                } else {
                    playerSimpleMoveAndSitout(msg);
                }
            } catch (err) {
                console.error("Error fetching player state:", err);
                playerSimpleMoveAndSitout(msg);
            }
        };

        // Promisified wrapper for getCurrentPlayer
        getCurrentPlayer(channelId: string, playerId: string, key: string): Promise<any> {
            return new Promise((resolve, reject) => {

                // Pomelo Connection
                pomelo.app.rpc.database.tableRemote.getCurrentPlayer(
                    {},
                    { channelId, playerId, key },
                    (res: any) => {
                        if (res) resolve(res);
                        else reject(new Error("RPC call failed"));
                    }
                );
                // Pomelo Connection

            });
        };

        // Promisified wrapper for findHandIdByRoundId
        async findHandIdByRoundId(roundId: string): Promise<any> {
            const result = await this.db.findHandIdByRoundId({ roundId });
            return result;
        }

    channelTimerHandler.reconnectionAfterDisconnection = function (msg, channel) {
            channel.startedAt = null;
            if (!!channel.extraTurnTimeReference) {
                clearTimeout(channel.extraTurnTimeReference);
                channel.extraTurnTimeReference = null;
            }

            if (!!channel.extraDisconnectionTimeReference) {
                let timeUsed = Math.floor((Number(new Date()) - channel.extraDisconnectionTimeReference.startedAt) / 1000);
                if (timeUsed > 0) {
                    //Deducting used amount of extra disconnection time
                    logDB.findHandIdByRoundId({ roundId: channel.roundId }, function (err, gotHandId) {
                        let handId = '';
                        if (!err && gotHandId.length) {
                            handId = gotHandId[0].handId
                        }
                        let data = {
                            type: "disconnectionEnded",
                            disconnectionTimeUsed: timeUsed,
                            channelId: msg.channelId,
                            roundId: handId,
                            playerId: msg.playerId,
                            tableName: channel.channelName || '',
                        }
                        subscriptionHandler.saveSubscriptionHistory(data);
                    })
                }
                clearTimeout(channel.extraDisconnectionTimeReference);
                channel.extraDisconnectionTimeReference = null;
            }

            if (!!channel.playerSimpleMoveWithTimeBank) {
                clearTimeout(channel.playerSimpleMoveWithTimeBank)
                channel.playerSimpleMoveWithTimeBank = null;
            }

            pomelo.app.rpc.database.tableRemote.getCurrentPlayer({}, { channelId: msg.channelId, playerId: msg.playerId, key: "state" }, async function (getCurrentPlayerResponse) {
                if (getCurrentPlayerResponse.success) {
                    let gotPlayer = getCurrentPlayerResponse.player;
                    if (gotPlayer.timeBankSec) {
                        gotPlayer.timeBankSec -= Math.ceil((Number(new Date()) - gotPlayer.timeBankStartedAt) / 1000);
                        gotPlayer.timeBankSec = gotPlayer.timeBankSec ? gotPlayer.timeBankSec : 0;
                    }
                    let connectionData = {
                        channel: channel,
                        channelId: msg.channelId,
                        playerId: msg.playerId,
                        playerName: msg.playerName,
                        player: gotPlayer,
                        session: ''
                    }
                    autoActConnected(connectionData);
                }
                else {
                    playerSimpleMoveAndSitout(msg);
                }
            });
        }
        /*=====================  END  =====================*/

        /*=====================  START  =====================*/
        // decide action move by player's selected precheck value
        // if possible, do it
        decideMoveAccToPrecheck(precheckValue: any, moves: any): any {

            switch (precheckValue) {
                case stateOfX.playerPrecheckValue.CALL:
                    if (moves.indexOf(stateOfX.moveValue.call) >= 0) {
                        return stateOfX.move.call;
                    }
                    break;
                case stateOfX.playerPrecheckValue.CALL_ANY:
                    if (moves.indexOf(stateOfX.moveValue.call) >= 0) {
                        return stateOfX.move.call;
                    } else if (moves.indexOf(stateOfX.moveValue.check) >= 0) {
                        return stateOfX.move.check;
                    } else if (moves.indexOf(stateOfX.moveValue.allin) >= 0) {
                        return stateOfX.move.allin;
                    }
                    break;
                case stateOfX.playerPrecheckValue.FOLD:
                    if (moves.indexOf(stateOfX.moveValue.fold) >= 0) {
                        return stateOfX.move.fold;
                    }
                    break;
                case stateOfX.playerPrecheckValue.CHECK:
                    if (moves.indexOf(stateOfX.moveValue.check) >= 0) {
                        return stateOfX.move.check;
                    }
                    break;
                case stateOfX.playerPrecheckValue.ALLIN:
                    if (moves.indexOf(stateOfX.moveValue.allin) >= 0) {
                        return stateOfX.move.allin;
                    }
                    break;
                case stateOfX.playerPrecheckValue.CHECK_FOLD:
                    if (moves.indexOf(stateOfX.moveValue.check) >= 0) {
                        return stateOfX.move.check;
                    } else if (moves.indexOf(stateOfX.moveValue.fold) >= 0) {
                        return stateOfX.move.fold;
                    }
                    break;
                case stateOfX.playerPrecheckValue.CALL_ANY_CHECK:
                    if (moves.indexOf(stateOfX.moveValue.call) >= 0) {
                        return stateOfX.move.call;
                    } else if (moves.indexOf(stateOfX.moveValue.check) >= 0) {
                        return stateOfX.move.check;
                    } else if (moves.indexOf(stateOfX.moveValue.allin) >= 0) {
                        return stateOfX.move.allin;
                    }
                    break;
                case stateOfX.playerPrecheckValue.NONE:
                    return false;
                    break;
                default:
                    return false;
            }
            return false;
        }
        /*=====================  END  =====================*/

        /*=====================  START  =====================*/
        // ### Perform any move on behalf of player from server

        async perfromPlayerMove(params: any): Promise<any> {

            const validated = await new Promise<any>((resolve) => {
                keyValidator.validateKeySets("Request", "connector", "perfromPlayerMove", params, (result: any) => {
                    resolve(result);
                });
            });

            if (validated.success) {
                const moveDataParams = {
                    playerId: params.playerId,
                    channelId: params.channelId,
                    amount: params.amount,
                    action: params.action,
                    runBy: params.runBy || "none",
                    isRequested: false,
                    channelType: params.table ? params.table.channelType : params.channel.channelType
                };

                const result = await new Promise<any>((resolve, reject) => {

                    // Pomelo Connection
                    pomelo.app.sysrpc['room'].msgRemote.forwardMessage(
                        { forceFrontendId: "room-server-1" },
                        {
                            body: moveDataParams,
                            route: "room.channelHandler.makeMove"
                        },
                        sessionExport(params.session),
                        (err: any, res: any) => {
                            console.log("room.channelHandler.makeMove res is >", err, res);
                            if (err) {
                                reject(err);
                            } else {
                                resolve(res);
                            }
                        }
                    );
                    // Pomelo Connection
                });

                return result;
            } else {
                return validated;
            }
        }

    var perfromPlayerMove = function (params, cb) {
    console.log(stateOfX.serverLogType.info, 'Processing for channel id: ' + params);
    console.log(stateOfX.serverLogType.info, 'In channelTimerHandler function perfromPlayerMove', params.channel);
    console.log(stateOfX.serverLogType.info, "params.self is in performPlayerMove ---- ");
    // serverLog(stateOfX.serverLogType.info, _.keys(params.self));
    keyValidator.validateKeySets("Request", "connector", "perfromPlayerMove", params, function (validated) {
        // console.log("params====================", params)
        if (validated.success) {
            console.error("!!!!!!!@@@@@@@@@#########################");
            console.error(pomelo.app.channelhandler);
            var moveDataParams = {
                playerId: params.playerId,
                channelId: params.channelId,
                amount: params.amount,
                action: params.action,
                runBy: params.runBy || "none",
                isRequested: false,
                channelType: params.table ? params.table.channelType : params.channel.channelType
            };
            // console.log("params.sessionNew >>>>>>>>>>", params.table.channelType)
            // params.session.forceFrontendId = params.sessionNew.frontendId;
            // var moveData = {};
            // moveData.msg = moveDataParams;
            // moveData.session = params.session;
            //pomelo.app.event.emit('makeMove',moveData);

            // params.self.makeMove({
            //   playerId    : params.playerId,
            //   channelId   : params.channelId,
            //   amount      : params.amount,
            //   action      : params.action,
            //   isRequested : false
            // }, params.session, function (err, makeMoveResponse) {
            //   cb(makeMoveResponse);
            // });

            // pomelo.app.rpc.connector.sessionRemote.hitAutoMove(params.session, moveDataParams, function (makeMoveResponse) {
            //   // serverLog(stateOfX.serverLogType.info, 'response of rpc-hitAutoMove' + JSON.stringify(makeMoveResponse));
            //   cb(makeMoveResponse);
            // })
            pomelo.app.sysrpc['room'].msgRemote.forwardMessage(
                { forceFrontendId: "room-server-1" },
                {
                    body: moveDataParams,
                    route: "room.channelHandler.makeMove"
                },
                sessionExport(params.session), function (err, res) {
                    console.log("room.channelHandler.makeMove res is >", err, res);
                    cb(res)
                }
            );
        } else {
            cb(validated)
        }
    });
}
/*=====================  END  =====================*/

/*=====================  START  =====================*/
// ### Perform CHECK or FOLD - acc to availability
// after player has not acted in enough time

async function performCheckOrFold(params: any): Promise<any> {
    serverLog(stateOfX.serverLogType.info, 'Processing for channel id: ' + params.channel.channelId);
    serverLog(stateOfX.serverLogType.info, 'In channelTimerHandler function performCheckOrFold');

    try {

        // Pomelo Connection
        const getPlayerMoves = await pomelo.app.rpc.database.tableRemote.getPlayerAttributeAsync(
            params.session,
            {
                channelId: params.channelId,
                playerId: params.playerId,
                key: "moves"
            }
        );
        // Pomelo Connection

        if (getPlayerMoves.success) {
            params.amount = 0;

            // Decide player action: check or fold
            const canCheck = getPlayerMoves.value.indexOf(1) >= 0;
            params.action = canCheck ? stateOfX.move.check : stateOfX.move.fold;

            // Force fold for tournament sitout players
            if (
                params.channel.channelType === stateOfX.gameType.tournament &&
                params.isTournamentSitout
            ) {
                params.action = stateOfX.move.fold;
            }

            const performPlayerMoveResponse = await this.perfromPlayerMove(params);
            return performPlayerMoveResponse;
        } else {
            console.log(stateOfX.serverLogType.error, "Get player moves from key failed - " + JSON.stringify(getPlayerMoves));
            return getPlayerMoves;
        }

    } catch (error) {
        console.log(stateOfX.serverLogType.error, "Error in performCheckOrFold: " + error);
        return { success: false, message: "Unexpected error in performCheckOrFold." };
    }
}



    // var performCheckOrFold = function (params, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'Processing for channel id: ' + params.channel.channelId);
    //     serverLog(stateOfX.serverLogType.info, 'In channelTimerHandler function performCheckOrFold');
    //     pomelo.app.rpc.database.tableRemote.getPlayerAttribute(params.session, { channelId: params.channelId, playerId: params.playerId, key: "moves" }, function (getPlayerMoves) {
    //         if (getPlayerMoves.success) {
    //             params.amount = 0;

    //             // <<<<< Commented as verified from PokerStars, perform CHECK if check available
    //             // <<<<< Uncommented as Sitout player cannot play CHECK

    //             // Set player action

    //             params.action = getPlayerMoves.value.indexOf(1) >= 0 ? stateOfX.move.check : stateOfX.move.fold;
    //             params.action = params.channel.channelType === stateOfX.gameType.tournament && params.isTournamentSitout ? stateOfX.move.fold : params.action;

    //             perfromPlayerMove(params, function (perfromPlayerMoveResponse) {
    //                 cb(perfromPlayerMoveResponse)
    //             });

    //             // if(params.channel.channelType === stateOfX.gameType.tournament) {
    //             //   serverLog(stateOfX.serverLogType.info, 'About to fold player for tournament.');
    //             //   params.action = params.isTournamentSitout ? stateOfX.move.fold;
    //             //   perfromPlayerMove(params, function (perfromPlayerMoveResponse) {
    //             //     cb(perfromPlayerMoveResponse)
    //             //   });
    //             // } else if(getPlayerMoves.value.indexOf(1) >= 0) {
    //             //   params.action = stateOfX.move.check;
    //             //   perfromPlayerMove(params, function (perfromPlayerMoveResponse) {
    //             //     cb(perfromPlayerMoveResponse)
    //             //   });
    //             // } else {
    //             //   params.action = stateOfX.move.fold;
    //             //   perfromPlayerMove(params, function (perfromPlayerMoveResponse) {
    //             //     cb(perfromPlayerMoveResponse)
    //             //   });
    //             // }
    //         } else {
    //             serverLog(stateOfX.serverLogType.error, "Get player moves from key failed - " + JSON.stringify(getPlayerMoves));
    //         }
    //     });
    // }
    /*=====================  END  =====================*/

    /*=====================  START  =====================*/
    // Perform auto sitout for any player

    async performAutoSitout(params: any) {

    try {
        const validated = await keyValidator.validateKeySetsAsync("Request", "connector", "performAutoSitout", params);

        if (validated.success) {
            params.channel.performAutoSitout = setTimeout(async function () {
                try {
                    const autoSitoutResponse = await pomelo.app.rpc.database.tableRemote.autoSitoutAsync(
                        params.session,
                        {
                            playerId: params.playerId,
                            channelId: params.channelId,
                            isRequested: false,
                            isConnected: (params.playerState === stateOfX.playerState.disconnected)
                        }
                    );

                    // Fire broadcast for auto sitout
                    this.broadcastHandler.firePlayerStateBroadcast({
                        channel: params.channel,
                        playerId: params.playerId,
                        channelId: params.channelId,
                        state: stateOfX.playerState.onBreak
                    });

                    return autoSitoutResponse;

                } catch (autoSitoutError) {
                    console.log(stateOfX.serverLogType.error, 'Error during autoSitout: ' + autoSitoutError);
                }
            }, systemConfig.autositoutDelayGameOver * 1000);
        } else {
            console.log(stateOfX.serverLogType.error, 'Error while sending ack broadcast - ' + JSON.stringify(validated));
        }

    } catch (err) {
        console.log(stateOfX.serverLogType.error, 'Error in performAutoSitout: ' + err);
    }
}



// var performAutoSitout = function (params, cb) {
//     console.log('Processing for channel id: ', params);
//     console.log('In channelTimerHandler function performAutoSitout');
//     keyValidator.validateKeySets("Request", "connector", "performAutoSitout", params, function (validated) {
//         if (validated.success) {
//             params.channel.performAutoSitout = setTimeout(function () {
//                 pomelo.app.rpc.database.tableRemote.autoSitout(params.session, { playerId: params.playerId, channelId: params.channelId, isRequested: false, isConnected: (params.playerState === stateOfX.playerState.disconnected) }, function (autoSitoutResponse) {
//                     cb(autoSitoutResponse);
//                     //broadcast for auto sitout
//                     broadcastHandler.firePlayerStateBroadcast({ channel: params.channel, playerId: params.playerId, channelId: params.channelId, state: stateOfX.playerState.onBreak })
//                 });
//             }, parseInt(systemConfig.autositoutDelayGameOver) * 1000)
//         } else {
//             serverLog(stateOfX.serverLogType.error, 'Error while sending ack broadcast - ' + JSON.stringify(validated))
//         }
//     });
// }
/*=====================  END  =====================*/


/*=====================  START  =====================*/

function playerSimpleMoveWithFreeTurnTime(params: any) {

    // Start a timeout for the extra turn time
    const timeout = setTimeout(playerSimpleMoveAndSitout, params.player.subscribedTimeBank * 1000, params);

    // Attach reference and timestamp to the channel
    params.channel.freeTurnTimeReference = timeout as NodeJS.Timeout & { startedAt?: number };
    params.channel.freeTurnTimeReference.startedAt = Date.now();
}

// let playerSimpleMoveWithFreeTurnTime = function (params) {
//     console.log("inside playerSimpleMoveWithFreeTurnTime", params)
//     //starting setTimeout for extraTurn time 
//     params.channel.freeTurnTimeReference = setTimeout(playerSimpleMoveAndSitout, params.player.subscribedTimeBank * 1000, params);
//     params.channel.freeTurnTimeReference.startedAt = Number(new Date());
// }
/*=====================  END  =====================*/


/*=====================  START  =====================*/
// ### Handle when player is disconnected
// provide extra time bank 10 seconds or remaining as available

async function playerSimpleMoveWithTimeBank(params: any): Promise<void> {

    if (params.player.timeBankSec && params.player.timeBankSec > 0) {

        // Pomelo Connection
        const setTimeBankResp = await pomelo.app.rpc.database.requestRemote.setTimeBankDetailsAsync(
            params.session,
            {
                playerId: params.playerId,
                channelId: params.channelId
            }
        );
        // Pomelo Connection

        if (setTimeBankResp.success && setTimeBankResp.table.state !== stateOfX.gameState.idle) {
            this.broadcastHandler.startTimeBank({
                channel: params.channel,
                channelId: params.channelId,
                playerId: params.playerId,
                totalTimeBank: params.player.updatedTimeBank || 1,
                timeBankLeft: params.player.updatedTimeBank || 1,
                originalTimeBank: params.player.timeBankSec,
                subscribedTimeBank: params.player.subscribedTimeBank
            });

            params.channel.playerSimpleMoveWithTimeBank = setTimeout(cb, (params.player.timeBankSec || 1) * 1000, params);
            params.channel.currentMovePlayer = params.playerId;
            params.channel.updatedTimeBank = params.player.updatedTimeBank;
            params.channel.startedAt = Date.now();
        }
    } else {
        return params;
    }
}



// var playerSimpleMoveWithTimeBank = function (params, cb) {
//     serverLog(stateOfX.serverLogType.info, 'In channelTimerHandler function playerSimpleMoveWithTimeBank');
//     // params.self.app.rpc.database.tableRemote.getPlayerAttribute(params.session, {channelId: params.channelId, playerId: params.playerId, key: "timeBankSec"}, function (getPlayerTimeBank) {
//     //   serverLog(stateOfX.serverLogType.info, ' response of tableRemote.getPlayerAttribute '+ JSON.stringify(getPlayerTimeBank));
//     //   if (getPlayerTimeBank.success) { 

//     if (params.player.timeBankSec && params.player.timeBankSec > 0) {
//         pomelo.app.rpc.database.requestRemote.setTimeBankDetails(params.session, { playerId: params.playerId, channelId: params.channelId }, function (setTimeBankResp) {
//             if (setTimeBankResp.success && setTimeBankResp.table.state != stateOfX.gameState.idle) {
//                 broadcastHandler.startTimeBank({ channel: params.channel, channelId: params.channelId, playerId: params.playerId, totalTimeBank: (params.player.updatedTimeBank || 1), timeBankLeft: (params.player.updatedTimeBank || 1), originalTimeBank: params.player.timeBankSec, subscribedTimeBank: params.player.subscribedTimeBank });
//                 params.channel.playerSimpleMoveWithTimeBank = setTimeout(cb, (params.player.timeBankSec || 1) * 1000, params);
//                 params.channel.currentMovePlayer = params.playerId;
//                 params.channel.updatedTimeBank = params.player.updatedTimeBank;
//                 params.channel.startedAt = Number(new Date());
//             }
//         })
//     } else {
//         cb(params)
//     }
// }
/*=====================  END  =====================*/


/*=====================  START  =====================*/

playerSimpleMoveWithExtraDisconnectionTime(params) {

    const timeout = setTimeout(playerSimpleMoveAndSitout, params.player.subscribedTimeBank * 1000, params);
    (timeout as any).startedAt = Date.now(); // Attach custom property

    params.channel.extraDisconnectionTimeReference = timeout;
}


    // let playerSimpleMoveWithExtraDisconnectionTime = function (params) {
    //     console.trace("inside playerSimpleMoveWithExtraDisconnectionTime", params)
    //     //starting setTimeout for extraDisconnection time 
    //     params.channel.extraDisconnectionTimeReference = setTimeout(playerSimpleMoveAndSitout, params.player.subscribedTimeBank * 1000, params);
    //     params.channel.extraDisconnectionTimeReference.startedAt = Number(new Date());
    // }
    /*=====================  END  =====================*/

    /*=====================  START  =====================*/
    // perform auto move and then sitout if FOLDed

    async playerSimpleMoveAndSitout(params: any): Promise < any > {

    try {

        const performCheckOrFoldResponse: any = await performCheckOrFold(params);

        // Pomelo Connection
        const systemFoldedCount: any = await pomelo.app.rpc.database.tableRemote.getPlayerAttribute(
            params.session,
            {
                channelId: params.channelId,
                playerId: params.playerId,
                key: "systemFoldedCount"
            }
        );
        // Pomelo Connection

        if(systemFoldedCount.success) {

    // Pomelo Connection
    await pomelo.app.rpc.database.tableRemote.setPlayerAttrib(
        params.session,
        {
            playerId: params.playerId,
            channelId: params.channelId,
            key: "systemFoldedCount",
            value: systemFoldedCount.value + 1
        }
    );
    // Pomelo Connection

}

if (performCheckOrFoldResponse.success && params.action === stateOfX.move.fold) {
    console.log(stateOfX.serverLogType.info, 'Not sending folded player sitout in automove case');
} else {
    console.log(stateOfX.serverLogType.info, 'Not sitting out player as ' + params.action + ' performed as auto action.');
}
        } catch (error) {
    console.log(stateOfX.serverLogType.error, 'Error in playerSimpleMoveAndSitout: ' + error);
}
    }



    // var playerSimpleMoveAndSitout = function (params) {
    //     performCheckOrFold(params, function (performCheckOrFoldResponse) {
    //         serverLog(stateOfX.serverLogType.info, 'Player auto turn performed !');
    //         pomelo.app.rpc.database.tableRemote.getPlayerAttribute(params.session, { channelId: params.channelId, playerId: params.playerId, key: "systemFoldedCount" }, function (systemFoldedCount) {
    //             if (systemFoldedCount.success) {

    //                 pomelo.app.rpc.database.tableRemote.setPlayerAttrib(params.session, { playerId: params.playerId, channelId: params.channelId, key: "systemFoldedCount", value: systemFoldedCount.value + 1 }, function (setPlayerAttribResponse) {
    //                     serverLog(stateOfX.serverLogType.info, 'setPlayerAttribResponse systemFoldedCount: ' + systemFoldedCount.value + 1)
    //                 });

    //             }

    //         });
    //         if (performCheckOrFoldResponse.success && params.action === stateOfX.move.fold) {

    //             // Putting PLayer Sitout after 3 hands if no action taken


    //             // pomelo.app.rpc.database.tableRemote.getPlayerAttribute(params.session, {channelId: params.channelId, playerId: params.playerId, key: "systemFoldedCount"}, function (systemFoldedCount) {
    //             //   if(systemFoldedCount.success){
    //             //     if(systemFoldedCount.value >= 3){
    //             //       performAutoSitout(params, function(performAutoSitoutResponse) {
    //             //         serverLog(stateOfX.serverLogType.info, 'Player went to auto sitout after autoActDisconnected !!')
    //             //       });
    //             //     }else{
    //             //       pomelo.app.rpc.database.tableRemote.setPlayerAttrib(params.session, {playerId: params.playerId, channelId: params.channelId, key: "systemFoldedCount", value: systemFoldedCount.value+1}, function (setPlayerAttribResponse) {
    //             //         serverLog(stateOfX.serverLogType.info, 'setPlayerAttribResponse systemFoldedCount: '+systemFoldedCount.value+1)
    //             //       });
    //             //     }
    //             //   }

    //             // });
    //             serverLog(stateOfX.serverLogType.info, 'Not sending folded player sitout in automove case');
    //             // performAutoSitout(params, function(performAutoSitoutResponse) {
    //             //   serverLog(stateOfX.serverLogType.info, 'Player went to auto sitout after autoActDisconnected !!')
    //             // });
    //         } else {
    //             serverLog(stateOfX.serverLogType.info, 'Not sitting out player as ' + params.action + ' performed as auto action.');
    //         }
    //     });
    // }

    /*=====================  END  =====================*/

    /*=====================  START  =====================*/
    // auto move flow for disconnected player

    async autoActDisconnected(params: any): Promise < void> {

    const validated = await keyValidator.validateKeySetsAsync("Request", "connector", "autoActDisconnected", params);

    if(!validated.success) {
    console.log(stateOfX.serverLogType.error, 'Error while sending ack broadcast - ' + JSON.stringify(validated));
    return;
}

const turnDelay = (stateOfX.extraTimeBank[params.channel.turnTime] || stateOfX.extraTimeBank['default']) * 1000;

this.broadcastHandler.firePlayerStateBroadcast({
    channel: params.channel,
    channelId: params.channelId,
    state: stateOfX.playerState.disconnected,
    resetTimer: true,
    playerId: params.playerId
});

params.channel.extraTurnTimeReference = setTimeout(async () => {
    const getCurrentPlayerResponse = await pomelo.app.rpc.database.tableRemote.getCurrentPlayerAsync(params.session, {
        channelId: params.channelId,
        playerId: params.playerId,
        key: "state"
    });

    if (!getCurrentPlayerResponse.success) {
        console.log(stateOfX.serverLogType.error, "Failed to get current player state.");
        return;
    }

    params.playerState = getCurrentPlayerResponse.player.state;
    params.player = getCurrentPlayerResponse.player;

    if ([stateOfX.playerState.playing, stateOfX.playerState.disconnected].includes(params.playerState)) {
        const playerTimeBankSec = typeof params.player.timeBankSec === 'number' ? params.player.timeBankSec : 0;

        if (playerTimeBankSec < 5) {
            params.player.timeBankSec = 5;
        }

        params.player.updatedTimeBank = params.player.timeBankSec;

        const findUserResponse = await db.findUserAsync({ playerId: params.playerId });

        const hasValidSubscription =
            findUserResponse &&
            findUserResponse.subscription &&
            Date.now() >= findUserResponse.subscription.startDate &&
            Date.now() <= findUserResponse.subscription.endDate;

        if (hasValidSubscription) {
            const subscriptionDetails = await this.db.fetchSubscriptionAsync({
                subscriptionId: findUserResponse.subscription.subscriptionId
            });

            if (subscriptionDetails?.length && subscriptionDetails[0].disconnectionTime) {
                const savedLog = await this.db.getExtraTimeLogAsync({
                    playerId: params.playerId,
                    channelId: params.channelId,
                    subscriptionId: findUserResponse.subscription.subscriptionId
                });

                if (savedLog) {
                    const usedTime = savedLog.disconnectionTimeUsed;
                    subscriptionDetails[0].disconnectionTime = Math.max(
                        0,
                        subscriptionDetails[0].disconnectionTime - usedTime
                    );
                } else {
                    const logData = {
                        playerId: params.playerId,
                        channelId: params.channelId,
                        userName: params.playerName,
                        subscriptionId: subscriptionDetails[0].subscriptionId,
                        subscriptionName: subscriptionDetails[0].name,
                        timeBankUsed: 0,
                        disconnectionTimeUsed: 0,
                        updatedAt: Date.now()
                    };
                    await this.db.saveTimeLogAsync({ playerId: params.playerId, channelId: params.channelId }, logData);
                }

                params.player.updatedTimeBank = params.player.timeBankSec + subscriptionDetails[0].disconnectionTime;
                params.player.subscribedTimeBank = subscriptionDetails[0].disconnectionTime;

                if (params.player.subscribedTimeBank) {
                    await this.playerSimpleMoveWithTimeBank(params, this.playerSimpleMoveWithExtraDisconnectionTime);
                } else {
                    await this.playerSimpleMoveWithTimeBank(params, this.playerSimpleMoveAndSitout);
                }
            } else {
                await this.playerSimpleMoveWithTimeBank(params, this.playerSimpleMoveAndSitout);
            }
        } else {
            await this.playerSimpleMoveWithTimeBank(params, this.playerSimpleMoveAndSitout);
        }
    } else {
        await this.playerSimpleMoveAndSitout(params);
    }
}, turnDelay);

params.channel.updatedTimeBank = turnDelay / 1000;
params.channel.startedAt = Date.now();
    }




var autoActDisconnected = function (params) {
    console.log('in autoActDisconnected params are', params);
    serverLog(stateOfX.serverLogType.info, 'In channelTimerHandler function autoActDisconnected');
    keyValidator.validateKeySets("Request", "connector", "autoActDisconnected", params, function (validated) {
        if (validated.success) {
            serverLog(stateOfX.serverLogType.info, 'Turn time for this table - ' + parseInt(params.channel.turnTime));
            serverLog(stateOfX.serverLogType.info, 'Player will performe move after extra time - ' + parseInt(stateOfX.extraTimeBank[params.channel.turnTime] || stateOfX.extraTimeBank['default']));
            broadcastHandler.firePlayerStateBroadcast({ channel: params.channel, channelId: params.channelId, state: stateOfX.playerState.disconnected, resetTimer: true, playerId: params.playerId });
            params.channel.extraTurnTimeReference = setTimeout(function () {
                // check for state again
                // playing >> broadcast timebank >> timer - ((move.success ? subtract timer OR do it in moveRemote) + following code)
                // disconnected >> (following code)
                pomelo.app.rpc.database.tableRemote.getCurrentPlayer(params.session, { channelId: params.channelId, playerId: params.playerId, key: "state" }, async function (getCurrentPlayerResponse) {
                    if (getCurrentPlayerResponse.success) {
                        params.playerState = getCurrentPlayerResponse.player.state;
                        params.player = getCurrentPlayerResponse.player;
                        //if condition check player is part of this game
                        // if(params.table.onStartPlayers.indexOf(params.playerId) >= 0){
                        if (params.playerState === stateOfX.playerState.playing || params.playerState === stateOfX.playerState.disconnected) {
                            if (params.player.timeBankSec < 5) {
                                params.player.timeBankSec = 5
                            }
                            params.player.updatedTimeBank = params.player.timeBankSec;

                            db.findUser({ playerId: params.playerId }, (err, findUserResponse) => {
                                if (!!findUserResponse && !!findUserResponse.subscription && (Date.now() >= findUserResponse.subscription.startDate && Date.now() <= findUserResponse.subscription.endDate)) {
                                    logDB.fetchSubscription({ subscriptionId: findUserResponse.subscription.subscriptionId }, async function (err, result) {
                                        console.log("inside fetchSubscription result is", result, params.player.timeBankSec)
                                        if (err || !result) {
                                            console.log("unable to find subscription list for given subscription id")
                                            playerSimpleMoveWithTimeBank(params, playerSimpleMoveAndSitout)
                                        } else {
                                            if (result.length && result[0].disconnectionTime) {
                                                logDB.getExtraTimeLog({ playerId: params.playerId, channelId: params.channelId, subscriptionId: findUserResponse.subscription.subscriptionId }, (err, savedResult) => {
                                                    console.log("Already extra disconnection time started", err, savedResult)
                                                    if (!err && !!savedResult) {
                                                        let usedTime = savedResult.disconnectionTimeUsed;
                                                        if ((result[0].disconnectionTime - usedTime) >= 0) {
                                                            result[0].disconnectionTime -= usedTime;
                                                        }
                                                        else {
                                                            result[0].disconnectionTime = 0;
                                                        }
                                                    }
                                                    else {
                                                        console.log('No extra disconnection time exists for this player!!');
                                                        let logData = {
                                                            playerId: params.playerId,
                                                            channelId: params.channelId,
                                                            userName: params.playerName,
                                                            subscriptionId: result[0].subscriptionId,
                                                            subscriptionName: result[0].name,
                                                            timeBankUsed: 0,
                                                            disconnectionTimeUsed: 0,
                                                            updatedAt: Date.now()
                                                        }
                                                        logDB.saveTimeLog({ playerId: params.playerId, channelId: params.channelId }, logData, function (err, ans) { })
                                                    }
                                                    params.player.updatedTimeBank = params.player.timeBankSec + result[0].disconnectionTime;
                                                    params.player.subscribedTimeBank = result[0].disconnectionTime;
                                                    if (params.player.subscribedTimeBank) {
                                                        playerSimpleMoveWithTimeBank(params, playerSimpleMoveWithExtraDisconnectionTime);
                                                    }
                                                    else {
                                                        playerSimpleMoveWithTimeBank(params, playerSimpleMoveAndSitout);
                                                    }
                                                });
                                            }
                                            else {
                                                playerSimpleMoveWithTimeBank(params, playerSimpleMoveAndSitout);
                                            }
                                        }
                                    })
                                }
                                else {
                                    playerSimpleMoveWithTimeBank(params, playerSimpleMoveAndSitout)
                                }
                            })
                        } else {
                            playerSimpleMoveAndSitout(params);
                        }
                        // serverLog(stateOfX.serverLogType.info, 'Current player state before performing move - ' + params.playerState);
                        // cb(null, params);
                    } else {
                        cb(getCurrentPlayerResponse);
                    }
                });
                // performCheckOrFold(params, function(performCheckOrFoldResponse) {
                //   serverLog(stateOfX.serverLogType.info, 'Player auto turn performed !');
                //   if(performCheckOrFoldResponse.success && params.action === stateOfX.move.fold) {
                //     performAutoSitout(params, function(performAutoSitoutResponse) {
                //       serverLog(stateOfX.serverLogType.info, 'Player went to auto sitout after autoActDisconnected !!')
                //     });
                //   } else {
                //     serverLog(stateOfX.serverLogType.info, 'Not sitting out player as ' + params.action + ' performed as auto action.');
                //   }
                // });
            }, parseInt(stateOfX.extraTimeBank[params.channel.turnTime] || stateOfX.extraTimeBank['default']) * 1000)
            params.channel.updatedTimeBank = parseInt(stateOfX.extraTimeBank[params.channel.turnTime] || stateOfX.extraTimeBank['default']);
            params.channel.startedAt = Number(new Date());
        } else {
            serverLog(stateOfX.serverLogType.error, 'Error while sending ack broadcast - ' + JSON.stringify(validated))
        }
    });
}
/*=====================  END  =====================*/

// ### Handle when player is connected and not making any move
// provide him timbank as available
var autoActConnected = function (params) {
    console.log('in autoActConnected params are', params);
    serverLog(stateOfX.serverLogType.info, 'In channelTimerHandler function autoActConnected');
    keyValidator.validateKeySets("Request", "connector", "autoActConnected", params, async function (validated) {
        if (validated.success) {
            console.log('successfully validated ---');
            if (params.player.timeBankSec < 5) {
                params.player.timeBankSec = 5
            }
            params.player.updatedTimeBank = params.player.timeBankSec;

            db.findUser({ playerId: params.playerId }, (err, findUserResponse) => {
                if (!!findUserResponse && !!findUserResponse.subscription && (Date.now() >= findUserResponse.subscription.startDate && Date.now() <= findUserResponse.subscription.endDate)) {
                    logDB.fetchSubscription({ subscriptionId: findUserResponse.subscription.subscriptionId }, async function (err, result) {
                        console.log("inside fetchSubscription result is", result, params.player.timeBankSec)
                        if (err || !result) {
                            console.log("unable to find subscription list for given subscription id")
                            playerSimpleMoveWithTimeBank(params, playerSimpleMoveAndSitout)
                        } else {
                            if (result.length && result[0].timeBank) {
                                logDB.getExtraTimeLog({ playerId: params.playerId, channelId: params.channelId, subscriptionId: findUserResponse.subscription.subscriptionId }, (err, savedResult) => {
                                    console.log("Already extra turn time started", err, savedResult)
                                    if (!err && !!savedResult) {
                                        let usedTime = savedResult.timeBankUsed;
                                        if ((result[0].timeBank - usedTime) >= 0) {
                                            result[0].timeBank -= usedTime;
                                        }
                                        else {
                                            result[0].timeBank = 0;
                                        }
                                    }
                                    else {
                                        console.log('No extra turn time exists for this player!!');
                                        let logData = {
                                            playerId: params.playerId,
                                            channelId: params.channelId,
                                            userName: params.playerName,
                                            subscriptionId: result[0].subscriptionId,
                                            subscriptionName: result[0].name,
                                            timeBankUsed: 0,
                                            disconnectionTimeUsed: 0,
                                            updatedAt: Date.now()
                                        }
                                        logDB.saveTimeLog({ playerId: params.playerId, channelId: params.channelId }, logData, function (err, ans) { })
                                    }
                                    params.player.updatedTimeBank = params.player.timeBankSec + result[0].timeBank;
                                    params.player.subscribedTimeBank = result[0].timeBank;
                                    if (params.player.subscribedTimeBank) {
                                        playerSimpleMoveWithTimeBank(params, playerSimpleMoveWithFreeTurnTime);
                                    }
                                    else {
                                        playerSimpleMoveWithTimeBank(params, playerSimpleMoveAndSitout);
                                    }
                                });
                            }
                            else {
                                playerSimpleMoveWithTimeBank(params, playerSimpleMoveAndSitout);
                            }
                        }
                    })
                } else {
                    playerSimpleMoveWithTimeBank(params, playerSimpleMoveAndSitout)
                }
            })


            // broadcast timebank >> timer - ((move.success ? subtract timer OR do it in moveRemote) + following code)
            //playerSimpleMoveWithTimeBank(params, playerSimpleMoveAndSitout);


            // playerSimpleMoveWithTimeBank(params, playerSimpleMoveWithFreeTurnTime);


            // performCheckOrFold(params, function(performCheckOrFoldResponse) {
            //   console.error(stateOfX.serverLogType.info, 'Player auto turn performed !', performCheckOrFoldResponse);
            //   if(performCheckOrFoldResponse.success && params.action === stateOfX.move.fold) {
            //     performAutoSitout(params, function(performAutoSitoutResponse) {
            //       serverLog(stateOfX.serverLogType.info, 'Player went to auto sitout after autoActConnected !!')
            //     });
            //   } else {
            //     serverLog(stateOfX.serverLogType.info, 'Not sitting out player as ' + params.action + ' performed as auto action.');
            //   }
            // });
        } else {
            serverLog(stateOfX.serverLogType.error, 'Error while sending ack broadcast - ' + JSON.stringify(validated))
        }
    });
}

// tournament
var tournamentAutoActsitout = function (params) {
    serverLog(stateOfX.serverLogType.info, 'In channelTimerHandler function tournamentAutoActsitout');
    keyValidator.validateKeySets("Request", "connector", "autoActDisconnected", params, function (validated) {
        if (validated.success) {
            performCheckOrFold(params, function (performCheckOrFoldResponse) {
                serverLog(stateOfX.serverLogType.info, 'Player auto turn performed for tournament == tournamentAutoActsitout!');
                if (performCheckOrFoldResponse.success && params.action === stateOfX.move.fold) {
                    performAutoSitout(params, function (performAutoSitoutResponse) {
                        serverLog(stateOfX.serverLogType.info, 'Player went to auto sitout after tournamentAutoActsitout !!')
                    });
                } else {
                    serverLog(stateOfX.serverLogType.info, 'Not sitting out player as ' + params.action + ' performed as auto action.');
                }
            });
        } else {
            serverLog(stateOfX.serverLogType.error, 'Error while sending ack broadcast - ' + JSON.stringify(validated))
        }
    });
}

// ### Handle when player is disconnected
// tournament
var tournamentAutoActDisconnected = function (params) {
    console.log(stateOfX.serverLogType.info, 'In channelTimerHandler function tournamentAutoActDisconnected');
    keyValidator.validateKeySets("Request", "connector", "autoActDisconnected", params, function (validated) {
        if (validated.success) {
            console.log(stateOfX.serverLogType.info, 'Player will performe move after extra time - ' + parseInt(stateOfX.extraTimeBank[params.channel.turnTime] || stateOfX.extraTimeBank['default']));
            broadcastHandler.firePlayerStateBroadcast({ channel: params.channel, channelId: params.channelId, state: stateOfX.playerState.disconnected, resetTimer: true, playerId: params.playerId });
            params.channel.extraTurnTimeReference = setTimeout(function () {
                performCheckOrFold(params, function (performCheckOrFoldResponse) {
                    console.log(stateOfX.serverLogType.info, 'Player auto turn performed for tournament == validateKeySets!');
                    if (performCheckOrFoldResponse.success && params.action === stateOfX.move.fold) {
                        performAutoSitout(params, function (performAutoSitoutResponse) {
                            console.log(stateOfX.serverLogType.info, 'Player went to auto sitout after tournamentAutoActDisconnected !!')
                        });
                    } else {
                        console.log(stateOfX.serverLogType.info, 'Not sitting out player as ' + params.action + ' performed as auto action.');
                    }
                });
            }, parseInt(stateOfX.extraTimeBank[params.channel.turnTime] || stateOfX.extraTimeBank['default']) * 1000)
        } else {
            console.log(stateOfX.serverLogType.error, 'Error while sending ack broadcast - ' + JSON.stringify(validated))
        }
    });
}

// Check if player has time bank left in account
// tournament
var checkTimeBankLeft = function (params, cb) {
    console.log('checkTimeBankLeftcheckTimeBankLeft ', params);
    // params.timeBankFinished = true;
    // cb(null, params);
    // return true;

    console.log(stateOfX.serverLogType.info, 'In function checkTimeBankLeft');
    if (params.timeBankLeft > 0) {
        console.log(stateOfX.serverLogType.info, 'Available time bank for this player: ' + params.timeBankLeft);
        cb(null, params)
    } else {
        console.log(stateOfX.serverLogType.info, 'No time bank is available for this player, skip further check and perform move!');
        params.timeBankFinished = true;
        cb(null, params);
    }
}

// Start time bank for tournament player
// tournament
var startTimeBank = function (params, cb) {
    // console.log(stateOfX.serverLogType.info, 'Processing for channel id: ' + params.channel.channelId);
    console.log(stateOfX.serverLogType.info, 'In function startTimeBank', params);
    // params.timeBankFinished = true;
    // cb(null, params);
    // return true;

    if (!params.timeBankFinished) {
        // Set time bank used and start time for this player
        pomelo.app.rpc.database.requestRemote.setTimeBankDetails(params.session, { playerId: params.playerId, channelId: params.channelId }, function (setTimeBankDetailsResponse) {
            console.log(stateOfX.serverLogType.info, "Response from remote for setting time bank details: " + JSON.stringify(setTimeBankDetailsResponse));
            if (setTimeBankDetailsResponse.success) {
                broadcastHandler.startTimeBank({ channel: params.channel, channelId: params.channelId, playerId: params.playerId, totalTimeBank: params.timeBankLeft, timeBankLeft: params.timeBankLeft });
                console.log(stateOfX.serverLogType.info, 'Start time bank broadcast fired, starting time bank for ' + params.timeBankLeft + ' seconds!');
                params.isTimeBankUsed = true;
                params.channel.timeBankTurnTimeReference = setTimeout(function () {
                    params.timeBankFinished = true;
                    cb(null, params);
                }, parseInt(params.timeBankLeft) * 1000)
            } else {
                cb({ setTimeBankDetailsResponse })
            }
        });
    } else {
        console.log(stateOfX.serverLogType.info, 'No time bank available for this player, skipping time bank start!');
        cb(null, params);
    }
}

// Perform player move in case of connected player in tournament
// tournament
var performMove = function (params, cb) {
    // console.log(stateOfX.serverLogType.info, 'Processing for channel id: ' + params.channel.channelId);
    if (params.timeBankFinished) {
        performCheckOrFold(params, function (performCheckOrFoldResponse) {
            console.log('Action performed: ', params.action, performCheckOrFoldResponse);
            // if(params.action === stateOfX.move.fold && params.playerState !== stateOfX.playerState.playing) {
            // // Removed as playing player after FOLD is not going on sitout because PLAYING state condition
            if (performCheckOrFoldResponse && performCheckOrFoldResponse.success && params.action === stateOfX.move.fold) {
                performAutoSitout(params, function (performAutoSitoutResponse) {
                    console.log('Player went to auto sitout after tournamentAutoActConnected !!')
                    cb(null, params);
                });
            } else {
                console.log('Not sitting out player as ' + params.action + ' performed as auto action.');
                cb(null, params);
            }
        });
    } else {
        // cb({success: false, channelId: params.channelId, info: "Time bank check not finished properly!"});
        cb({ success: false, channelId: params.channelId, info: configMsg.PERFORMMOVEFAIL_CHANNELTIMERHANDLER, isRetry: false, isDisplay: false });
        console.log(stateOfX.serverLogType.error, 'Time bank check not finished properly!')
    }
}

// ### Handle when player is connected and not making any move
// tournament
var tournamentAutoActConnected = function (params) {
    console.log('In channelTimerHandler function tournamentAutoActConnected');
    keyValidator.validateKeySets("Request", "connector", "autoActConnected", params, function (validated) {
        if (validated.success) {
            async.waterfall([
                async.apply(checkTimeBankLeft, params),
                startTimeBank,
                performMove
            ], function (err, response) {
                if (err) {
                    console.log('Error while performing tournament auto move in connected state player: ', validated)
                } else {
                    console.log('Auto move in tournament from a connected player has been processed successfully !!')
                }
            })

        } else {
            console.log('Error while sending ack broadcast - ', validated)
        }
    });
}

// validate req keys acc to req title
var validateRequestKeys = function (params, cb) {
    serverLog(stateOfX.serverLogType.info, 'Processing for channel id: ' + params.channel.channelId);
    serverLog(stateOfX.serverLogType.info, 'In channelTimerHandler function validateRequestKeys');
    keyValidator.validateKeySets("Request", "connector", "startTurnTimeOut", params, function (validated) {
        if (validated.success) {
            cb(null, params);
        } else {
            cb(validated)
        }
    });
}

// fetch table turn time
var getTableTurnTIme = function (params, cb) {
    console.log(stateOfX.serverLogType.info, 'Processing for channel id: ' + params.channel.channelId);
    console.log(stateOfX.serverLogType.info, 'In channelTimerHandler function getTableTurnTIme');
    pomelo.app.rpc.database.tableRemote.getTableAttrib(params.session, { channelId: params.channelId, key: "turnTime" }, function (getTableAttribResponse) {
        console.log(stateOfX.serverLogType.info, "getTableAttribResponse - " + JSON.stringify(getTableAttribResponse));
        if (getTableAttribResponse.success) {
            params.turnTime = getTableAttribResponse.value;
            cb(null, params);
        } else {
            cb(getTableAttribResponse);
        }
    });
}

// kill timers for channel
var killChannelTimers = function (params, cb) {
    console.log(stateOfX.serverLogType.info, 'Processing for channel id: ' + params.channel.channelId);
    console.log(stateOfX.serverLogType.info, 'In channelTimerHandler function killChannelTimers');
    killChannelLevelTimers(params);
    cb(null, params);
}

// check for disconnected player, if done precheck - act automove-by-precheck
// UPDATE - also for connected players
var checkForDisconnectedPlayerAndPrecheck = function (params, cb) {
    pomelo.app.rpc.database.tableRemote.getCurrentPlayer(params.session, { channelId: params.channelId, playerId: params.playerId, key: "state" }, function (getCurrentPlayerResponse) {
        console.log('getCurrentPlayerResponse - ', getCurrentPlayerResponse);
        if (getCurrentPlayerResponse.success) {
            params.player = getCurrentPlayerResponse.player;
            params.playerId = params.player.playerId;
            // params.playerState = getCurrentPlayerResponse.player.precheckValue;
            // params.playerState = getCurrentPlayerResponse.player.moves;
            // if (params.player.state === stateOfX.playerState.disconnected) {
            console.log('Current player-s precheckValue is ', params.player.precheckValue)
            if (!!params.player.precheckValue /*&& params.player.precheckValue !== stateOfX.playerPrecheckValue.NONE*/) {
                console.log('checkForDisconnectedPlayerAndPrecheck=====', params.player.precheckValue)
                // decide move according to precheck
                if ((params.player.state == stateOfX.playerState.onBreak || (params.player.state == stateOfX.playerState.disconnected && params.player.previousState == stateOfX.playerState.onBreak)) && (params.channel.isCTEnabledTable && params.player.playerScore > 0
                    && (
                        (params.player.playerCallTimer.status === false && params.player.callTimeGameMissed <= params.channel.ctEnabledBufferHand)
                        || (params.player.playerCallTimer.status === true
                            && !(params.player.playerCallTimer.isCallTimeOver)
                        )
                    )
                )) {
                    params.player.precheckValue = stateOfX.playerPrecheckValue.CHECK_FOLD;
                }
                var decidedMove = decideMoveAccToPrecheck(params.player.precheckValue, params.player.moves);
                // make move according to precheck
                if (!!decidedMove) {
                    serverLog(stateOfX.serverLogType.info, 'Current player-s decided move is ' + decidedMove)
                    // perform move
                    getCurrentPlayerSession(params, function (err, params) {
                        serverLog(stateOfX.serverLogType.info, 'Current player-s session is ' + JSON.stringify(err))
                        serverLog(stateOfX.serverLogType.info, 'Current player-s session is ' + JSON.stringify(params.sessionNew))
                        if (!err) {
                            params.amount = 0;
                            params.action = decidedMove;
                            params.runBy = "precheck";
                            setTimeout(function () {
                                perfromPlayerMove(params, function (moveResponse) {
                                    serverLog(stateOfX.serverLogType.info, 'Current player-s autoMove response is ' + JSON.stringify(moveResponse))
                                    if (!moveResponse.success) {
                                        cb(null, params);
                                    } else if (moveResponse.success && moveResponse.info == 'session not found') {
                                        cb(null, params);
                                    } else {
                                        cb({ info: "auto move done already." })
                                    }
                                })
                            }, 300)
                        }
                    })
                } else {
                    serverLog(stateOfX.serverLogType.info, 'Current player precheckValue is not valid anymore - ' + params.player.precheckValue + ', ' + JSON.stringify(params.player.moves));
                    cb(null, params);
                }
            } else {
                serverLog(stateOfX.serverLogType.info, 'Current player has not selected precheckValue - ' + params.player.precheckValue);
                cb(null, params);
            }
            ////// PLAYER PRECHECK MOVE IN CONNECTED OR DISCONNECTED STATE - BOTH
            // } else {
            //   serverLog(stateOfX.serverLogType.info, 'Current player state before performing move - ' + params.playerState);
            //   cb(null, params);
            // }
        } else {
            cb(getCurrentPlayerResponse);
        }
    });
}

// set current player as disconnected after waiting for FULL turn time (the main one)
var setCurrentPlayerDisconnected = function (params, cb) {
    console.log('Processing for channel id: ', params);
    console.log(stateOfX.serverLogType.info, 'In channelTimerHandler function setCurrentPlayerDisconnected');
    var currentTurnTime = params.turnTime;
    // console.error("!!!!!!!!!!!!!!!!",new Date());
    if (!!params.response && (params.response.turn.roundName == stateOfX.round.flop || params.response.turn.roundName == stateOfX.round.turn || params.response.turn.roundName == stateOfX.round.river)) {
        currentTurnTime += 2;
    }
    params.channel.turnTimeReference = setTimeout(function () {
        pomelo.app.rpc.database.tableRemote.setCurrentPlayerDisconn(params.session, { channelId: params.channelId }, function (setCurrentPlayerDisconnResponse) {
            console.log(stateOfX.serverLogType.info, 'Response of player disconnected - ' + JSON.stringify(setCurrentPlayerDisconnResponse));
            if (setCurrentPlayerDisconnResponse.success) {
                params.playerId = setCurrentPlayerDisconnResponse.playerId;
                params.playerName = setCurrentPlayerDisconnResponse.playerName;
                console.error("@@@@@@@@@@@@", new Date());
                cb(null, params);
            } else {
                cb(setCurrentPlayerDisconnResponse);
            }
        });
    }, parseInt(currentTurnTime) * 1000);
}

// fire a broadcast, so player can ack if he is online
var fireConnectionAckBroadcast = function (params, cb) {
    console.log(stateOfX.serverLogType.info, 'Processing for channel id: ' + params.channel.channelId);
    console.log(stateOfX.serverLogType.info, 'In channelTimerHandler function fireConnectionAckBroadcast');
    var record = params.channel.getMember(params.playerId) || {};
    broadcastHandler.fireAckBroadcastOnLogin({ playerId: params.playerId, serverId: record.sid, data: { channelId: params.channelId, setState: true } });
    cb(null, params);
}

// see after ack if player state changed
var getPlayerCurrentState = function (params, cb) {
    serverLog(stateOfX.serverLogType.info, 'Processing for channel id: ' + params.channel.channelId);
    serverLog(stateOfX.serverLogType.info, 'In channelTimerHandler function getPlayerCurrentState');
    // params.channel.clientConnAckReference = setTimeout(function () {
    pomelo.app.rpc.database.tableRemote.getCurrentPlayer(params.session, { channelId: params.channelId, playerId: params.playerId, key: "state" }, function (getCurrentPlayerResponse) {
        serverLog(stateOfX.serverLogType.info, 'getCurrentPlayerResponse - ' + JSON.stringify(getCurrentPlayerResponse));
        if (getCurrentPlayerResponse.success) {
            params.playerState = getCurrentPlayerResponse.player.state;
            params.player = getCurrentPlayerResponse.player;
            serverLog(stateOfX.serverLogType.info, 'Current player state before performing move - ' + params.playerState);
            cb(null, params);
        } else {
            cb(getCurrentPlayerResponse);
        }
    });
    // }, parseInt(systemConfig.isConnectedCheckTime) * 1000);
}

// find in db - user session object

// to get server id he is connected to
var getCurrentPlayerSession = function (params, cb) {
    // params.playerId
    // params.session = {} // neew
    // pomelo.app.rpc.database.dbRemote.findUserSessionInDB(params.session, params.playerId, function (response) {
    //   if (response.success && !!response.result) {
    // response.result.serverId;
    params.sessionNew = { frontendId: 'connector-server-1' };
    cb(null, params)
    //   } else {
    //     cb({ success: false, info: "User session not found in DB." });
    //   }
    // })
}

// Perform operation based on player current state
var performNormalTableAction = function (params, cb) {
    serverLog(stateOfX.serverLogType.info, 'Processing for channel id: ' + params.channel.channelId);
    serverLog(stateOfX.serverLogType.info, 'In channelTimerHandler function performNormalTableAction');
    serverLog(stateOfX.serverLogType.info, 'About to perform for player state - ' + params.playerState);
    if (params.playerState === stateOfX.playerState.disconnected) {
        autoActDisconnected(params);
    } else {

        autoActConnected(params);
    }
    cb(null, params);
}


// Get current player object from inmem table
var getCurrentPlayerObject = function (params, cb) {
    console.log(stateOfX.serverLogType.info, 'Processing for channel id: ' + params.channel.channelId);
    console.log(stateOfX.serverLogType.info, 'In channelTimerHandler function getCurrentPlayerObject');
    pomelo.app.rpc.database.tableRemote.getCurrentPlayer(params.session, { channelId: params.channelId, playerId: params.playerId }, function (getCurrentPlayerResponse) {
        console.log(stateOfX.serverLogType.info, 'Get current player from remote response: ', getCurrentPlayerResponse)
        if (getCurrentPlayerResponse.success) {
            params.playerId = getCurrentPlayerResponse.player.playerId;
            params.playerName = getCurrentPlayerResponse.player.playerName;
            params.isTournamentSitout = getCurrentPlayerResponse.player.tournamentData.isTournamentSitout;
            params.timeBankLeft = getCurrentPlayerResponse.player.tournamentData.timeBankLeft;
            params.totalTimeBank = getCurrentPlayerResponse.player.tournamentData.totalTimeBank;
            params.playerState = getCurrentPlayerResponse.player.state;
            console.log(stateOfX.serverLogType.info, 'getCurrentPlayerObject params', params)
            cb(null, params);
        } else {
            cb(getCurrentPlayerResponse);
        }
    });
}

// get player state from inmem table
var getCurrentPlayerSitoutValue = function (params, cb) {
    console.log(stateOfX.serverLogType.info, 'Processing for channel id: ' + params.channel.channelId);
    console.log(stateOfX.serverLogType.info, 'In channelTimerHandler function getCurrentPlayerSitoutValue');
    params.channel.clientConnAckReference = setTimeout(function () {
        pomelo.app.rpc.databCannot find name 'params'CurrentPlayerResponse - getCurrentPlayerSitoutValue', getCurrentPlayerResponse);
        if (getCurrentPlayerResponse.success) {
            params.isTournamentSitout = getCurrentPlayerResponse.player.tournamentData.isTournamentSitout;
            params.playerState = getCurrentPlayerResponse.player.state;
        } else {
            console.log("Get player state from key failed - ", getCurrentPlayerResponse);
        }
        cb(null, params);
    });
}
// Perform operation based on player current state
// tournament
var performTournamentTableAction = function (params, cb) {
    console.log('Processing for channel id: ', params);
    console.log('In channelTimerHandler function performTournamentTableAction');
    console.log('1. Player state - ' + params.playerState + ' and sitout - ' + params.isTournamentSitout);
    if (params.isTournamentSitout) {
        tournamentAutoActsitout(params);
    } else if (params.playerState === stateOfX.playerState.disconnected) {
        tournamentAutoActDisconnected(params);
    } else {
        tournamentAutoActConnected(params);
    }
    cb(null, params);
}

// Perform operation based on player current state
// tournament
var performTournamentSitout = function (params, cb) {
    serverLog('Processing for channel id: ', params.channel.channelId);
    serverLog('In channelTimerHandler function performTournamentSitout');
    serverLog('Player state - ', params.playerState, ' and sitout - ', params.isTournamentSitout);
    if (params.isTournamentSitout) {
        tournamentAutoActsitout(params);
    } else {
        serverLog('The player might have resume in game!');
        tournamentAutoActConnected(params);
    }
    cb(null, params);
}

// Perform actions for player in sitout mode
// tournament
var performSitoutAction = function (params, cb) {
    console.log('Processing for channel id: ', params.channel.channelId);
    console.log('In channelTimerHandler function performSitoutAction');
    async.waterfall([
        async.apply(killChannelTimers, params),
        fireConnectionAckBroadcast,
        getCurrentPlayerSitoutValue,
        performTournamentSitout
    ], function (err, params) {
        if (err) {
            console.log('========== performSitoutAction failed =========> ', err)
            cb(err);
        } else {
            console.log('========== performSitoutAction success =========', params)
            cb(null, params);
        }
    });
}

// Perform action for players in normal mode
// tournament
var performNoSitoutAction = function (params, cb) {
    console.log("inside performNoSitoutAction", params);
    console.log(stateOfX.serverLogType.info, 'Processing for channel id: ' + params.channel.channelId);
    console.log(stateOfX.serverLogType.info, 'In channelTimerHandler function performNoSitoutAction');
    if (params.isTournamentSitout) {
        console.log(stateOfX.serverLogType.info, "Player is in sitout mode so skipping auto sitout turn handling!");
        cb(null, params);
    } else {
        async.waterfall([
            async.apply(killChannelTimers, params),
            getTableTurnTIme,
            checkForDisconnectedPlayerAndPrecheck,
            setCurrentPlayerDisconnected,
            fireConnectionAckBroadcast,
            getCurrentPlayerSitoutValue,
            performTournamentTableAction
        ], function (err, response) {
            if (err) {
                console.log(stateOfX.serverLogType.error, 'err in performNoSitoutAction - ' + JSON.stringify(err));
            } else {
                console.log(stateOfX.serverLogType.info, 'response in performNoSitoutAction - ' + JSON.stringify(_.keys(response)));
            }
        });
    }
}

// fetch inmem table
var getTable = function (params, cb) {
    console.log(stateOfX.serverLogType.info, 'In channelTimerHandler in getTable');
    pomelo.app.rpc.database.tableRemote.getTable('', { channelId: params.channelId }, function (res) {
        if (res.success) {
            params.table = res.table;
            cb(null, params);
        } else {
            cb(res);
        }
    })
}

// get user session from db
var getPlayerSessionServer = function (player, params, cb) {
    // serverLog(stateOfX.serverLogType.info, 'In channelTimerHandler in getPlayerSessionServer');
    // pomelo.app.rpc.database.dbRemote.findUserSessionInDB('', player.playerId, function (res) {
    //   serverLog(stateOfX.serverLogType.info, 'response of findUserSessionInDB' + JSON.stringify(res));
    //   //console.error(res.result);
    //   if (res.success && !!res.result.serverId) {
    player.serverId = 'connector-server-1';
    cb(null, player, params);
    //   } else {
    //     cb(null, player, params);
    //   }
    // })
}

// get hit for autoLeave from connector
// WHY - because leave starts from room but redirects by connector WITH PLAYER SESSION OBJECT SETTINGS
var getHitLeave = function (player, params, cb) {
    console.log('In channelTimerHandler in getHitLeave ', player, params);
    serverLog(stateOfX.serverLogType.info, 'In channelTimerHandler in getHitLeave');
    console.log("rs3en45")
    if (player.serverId) {
        pomelo.app.sysrpc['room'].msgRemote.forwardMessage(
            { forceFrontendId: "room-server-1" },
            {
                body: { playerId: player.playerId, playerName: player.playerName, isStandup: true, channelId: params.channelId, isRequested: false, origin: 'tableIdleTimer' },
                route: "room.channelHandler.leaveTable"
            },
            sessionExport(params.session), function (err, hitLeaveResponse) {
                console.log("room.channelHandler.leaveTable res is >", hitLeaveResponse);
                serverLog(stateOfX.serverLogType.info, 'response of rpc-hitLeave' + JSON.stringify(hitLeaveResponse));
                fireRemoveBlindMissedPlayersBroadCast(params, player);
                cb(null, player, params);

            }
        );

        // pomelo.app.rpc.connector.sessionRemote.hitLeave({ frontendId: player.serverId }, { playerId: player.playerId, playerName: player.playerName, isStandup: true, channelId: params.channelId, isRequested: false, origin: 'tableIdleTimer' }, function (hitLeaveResponse) {
        //   serverLog(stateOfX.serverLogType.info, 'response of rpc-hitLeave' + JSON.stringify(hitLeaveResponse));
        //   fireRemoveBlindMissedPlayersBroadCast(params, player);
        //   cb(null, player, params);
        // })
    } else {
        serverLog(stateOfX.serverLogType.info, 'No serverId found');
        cb(null, player, params);
    }
}

// fire player removed broadcast on channel with antibanking data
var fireRemoveBlindMissedPlayersBroadCast = function (params, player) {
    var filter = {};
    filter.playerId = player.playerId;
    filter.channelId = player.channelId;
    //  console.error("!!!!!!!!!!!!!!!!!!!1",filter);
    db.getAntiBanking(filter, function (err, response) {
        if (!err && response) {
            var isAntiBanking = false;
            if (response != null) {
                var timeToNumber = parseInt(systemConfig.expireAntiBankingSeconds) + parseInt(systemConfig.antiBankingBuffer) - (Number(new Date()) - Number(response.createdAt)) / 1000;
                if (timeToNumber > 0 && response.amount > 0) {
                    isAntiBanking = true;
                }

            }
            broadcastHandler.sendMessageToUser({ playerId: player.playerId, serverId: player.serverId, msg: { playerId: player.playerId, channelId: params.channelId, isAntiBanking: isAntiBanking, timeRemains: timeToNumber, amount: response.amount, event: stateOfX.recordChange.playerLeaveTable }, route: stateOfX.broadcasts.antiBankingUpdatedData });
            //console.error(isAntiBanking,"!!!!!!!@@@@@@@@@@@@Anti banking",timeToNumber);
        } else {
            broadcastHandler.sendMessageToUser({ playerId: player.playerId, serverId: player.serverId, msg: { playerId: player.playerId, channelId: params.channelId, isAntiBanking: isAntiBanking, timeRemains: -1, amount: -1, event: stateOfX.recordChange.playerLeaveTable }, route: stateOfX.broadcasts.antiBankingUpdatedData });
            //console.error(isAntiBanking,"!!!!!!!@@@@@@@@@@@@Anti banking",timeToNumber);
        }
    })
}

// run autoLeave for every sitout player
// after game not started from some time - 2 minutes
var forEverySitoutPlayer = function (params, cb) {
    serverLog(stateOfX.serverLogType.info, 'In channelTimerHandler in forEverySitoutPlayer');
    var sitoutPlayers = _.where(params.table.players, { state: stateOfX.playerState.onBreak });
    console.log('forEverySitoutPlayer ', sitoutPlayers);
    if (sitoutPlayers.length <= 0) {
        cb(null, params); return;
    }
    async.each(sitoutPlayers, function (player, ecb) {
        async.waterfall([
            async.apply(getPlayerSessionServer, player, params),
            getHitLeave
        ], function (err, player, response) {
            ecb(err, player, response)
        })
    }, function (err, player, params) {
        cb(null, params);
    })
}



// ### Start timeout to handle events after
// after turn broadcast fired
channelTimerHandler.startTurnTimeOut = function (params) {
    console.log("channel fpund channelTimerHandler.startTurnTimeOut params", params)
    serverLog(stateOfX.serverLogType.info, 'In channelTimerHandler function startTurnTimeOut');
    if (systemConfig.playerAutoMoveRequired) {
        var channel = pomelo.app.get('channelService').getChannel(params.channelId, false);
        console.log("channel fpund channelTimerHandler.startTurnTimeOut ", channel)
        params.channel = channel;
        params.timeBankFinished = false;
        params.isTimeBankUsed = false;
        console.log("AUTO TURN STARTED FOR ", channel.channelType, " TABLE !");
        if (channel.channelType === stateOfX.gameType.normal) {
            async.waterfall([
                async.apply(validateRequestKeys, params),
                getTableTurnTIme,
                killChannelTimers,
                checkForDisconnectedPlayerAndPrecheck,
                setCurrentPlayerDisconnected,
                fireConnectionAckBroadcast,
                getPlayerCurrentState,
                getCurrentPlayerSession,
                performNormalTableAction
            ], function (err, response) {
                serverLog(stateOfX.serverLogType.error, 'Error startimeout ' + JSON.stringify(err) + '\nResponse keys - ' + JSON.stringify(_.keys(response)));
            });
        } else {
            async.waterfall([
                async.apply(validateRequestKeys, params),
                getCurrentPlayerObject,
                performNoSitoutAction,
                performSitoutAction
            ], function (err, response) {
                console.log(stateOfX.serverLogType.error, 'Error startimeout ' + JSON.stringify(err) + '\nResponse keys - ' + JSON.stringify(_.keys(response)));
            });
        }
    } else {
        serverLog(stateOfX.serverLogType.warning, 'Player auto move feature disable from system configuration.');
    }
}


// timer for idle table
// if no game starts in a time
// remove sitout players
channelTimerHandler.tableIdleTimer = function (params) {
    // console.log('tableIdleTimer', params.table.players);
    // check for conditions, if any
    serverLog(stateOfX.serverLogType.info, 'In channelTimerHandler function tableIdleTimer');
    serverLog(stateOfX.serverLogType.info, 'setting timer for idle table');
    params.channel.idleTableTimer = setTimeout(function () {
        async.waterfall([
            async.apply(function (params, cb) { cb(null, params) }, params),
            getTable,
            forEverySitoutPlayer
        ], function (err, response) {
            serverLog(stateOfX.serverLogType.info, 'err and response of tableIdleTimer');
        })
    }, systemConfig.tableIdleTimerSeconds * 1000);
}

// kill table idle timer
// some game has been started
channelTimerHandler.killTableIdleTimer = function (params) {
    serverLog(stateOfX.serverLogType.info, 'In channelTimerHandler function killTableIdleTimer');
    if (params.channel.idleTableTimer) {
        serverLog(stateOfX.serverLogType.info, 'killed idleTableTimer for channelId ' + params.channel.channelId);
        clearTimeout(params.channel.idleTableTimer);
        params.channel.idleTableTimer = null;
    }
}

function sessionExport(session) {
    var EXPORTED_SESSION_FIELDS = ['id', 'frontendId', 'uid', 'settings']
    var res = {};
    clone(session, res, EXPORTED_SESSION_FIELDS);
    return res;
};

/**
 * clone object keys
 * @method clone
 * @param  {Object} src      source of keys
 * @param  {Object} dest     destination for keys
 * @param  {Array}  includes list of keys - array of Strings
 */
function clone(src, dest, includes) {
    var f;
    for (var i = 0, l = includes.length; i < l; i++) {
        f = includes[i];
        dest[f] = src[f];
    }
};

// Schedule timer to standup player after a time crossed for reserved seat - 10 seconds
channelTimerHandler.vacantReserveSeat = function (params, cb) {
    console.error("reserver sit fired");
    serverLog(stateOfX.serverLogType.info, 'Processing for channel id: ' + params.channel.channelId);
    serverLog(stateOfX.serverLogType.info, 'In channelTimerHandler function vacantReserveSeat');
    var currentTime = new Date();
    var scheduleTime = null;
    if (params.channel.reserveSeatTimeReference[params.playerId]) {
        params.channel.reserveSeatTimeReference[params.playerId].cancel();
        params.channel.reserveSeatTimeReference[params.playerId] = null;
    }

    var isStandup = true;
    // imdb.playerJoinedRecord({ playerId: params.playerId, channelId: params.channelId }, function (err, res) {
    // console.log('vacantReserveSeat', res);
    // if (!!res) {
    //   if (res[0].alreadyjoin == false) {
    //     isStandup = false;
    //   }
    // }

    // if (!!params.isCTEnabledTable && params.player.playerScore > 0) {
    //   isStandup = false;
    // }
    console.log('vacantReserveSeat 1', isStandup);
    scheduleTime = currentTime.setSeconds(currentTime.getSeconds() + parseInt(systemConfig.vacantReserveSeatTime))
    params.channel.reserveSeatTimeReference[params.playerId] = schedule.scheduleJob(currentTime, function () {
        serverLog(stateOfX.serverLogType.info, 'Player will sitout auto now');
        console.log("rs3en45")

        pomelo.app.sysrpc['room'].msgRemote.forwardMessage(
            { forceFrontendId: pomelo.app.serverId },
            {
                body: { playerId: params.playerId, isStandup: isStandup, channelId: params.channelId, isRequested: false, playerName: params.playerName, origin: 'vacantSeat' },
                route: "room.channelHandler.leaveTable"
            },
            sessionExport(params.session), function (...arg) {
                console.log('pomelo.app.sysrpc[room].msgRemote', ...arg);
                if (isStandup == false) {
                    imdb.removePlayerJoin({ channelId: params.channelId, playerId: params.playerId }, function (joinerr, joinresponse) {
                        setTimeout(function () {
                            broadcastHandler.fireInfoBroadcastToPlayer({ playerId: params.playerId, buttonCode: 1, serverId: params.session.frontendId, channelId: params.channelId, heading: "Standup", info: "You did not act in time (" + systemConfig.vacantReserveSeatTime + " seconds), seat in " + params.channel.channelName + " is no longer reserved." });
                        }, 100)
                    })
                } else {
                    setTimeout(function () {
                        broadcastHandler.fireInfoBroadcastToPlayer({ playerId: params.playerId, buttonCode: 1, serverId: params.session.frontendId, channelId: params.channelId, heading: "Standup", info: "You did not act in time (" + systemConfig.vacantReserveSeatTime + " seconds), seat in " + params.channel.channelName + " is no longer reserved." });
                    }, 100)
                }
            });
    });
    // });
}

// Schedule timer to leave player from room is spectator time crossed - 10 minutes
channelTimerHandler.kickPlayerToLobby = function (params) {
    console.log("kick to loby fired channelTimerHandler.kickPlayerToLobby", params.data);
    console.error(params);
    serverLog(stateOfX.serverLogType.info, 'Processing for channel id: ' + params.channel.channelId);
    serverLog(stateOfX.serverLogType.info, 'In channelTimerHandler function kickPlayerToLobby');
    var currentTime = new Date();
    var scheduleTime = 0;
    if (params.channel.kickPlayerToLobby[params.playerId]) {
        params.channel.kickPlayerToLobby[params.playerId].cancel();
        params.channel.kickPlayerToLobby[params.playerId] = null;
    }
    if (!params.data) {
        scheduleTime = currentTime.setSeconds(currentTime.getSeconds() + parseInt(systemConfig.playerSpectateLimit))
    } else {
        if (params.data && params.data.isStandup && (params.data.origin == 'tableIdleTimer' || params.data.origin == 'idlePlayer')) {
            console.log("inside iff params.data.isStandup && params.data.origin",)
            scheduleTime = currentTime.setSeconds(currentTime.getSeconds() + 1)
        } else {
            scheduleTime = currentTime.setSeconds(currentTime.getSeconds() + parseInt(systemConfig.playerSpectateLimit))
        }
    }
    params.channel.kickPlayerToLobby[params.playerId] = schedule.scheduleJob(scheduleTime, function () {
        console.log("kick to loby fired ---- actually");
        serverLog(stateOfX.serverLogType.info, 'Player should kick to lobby now!');
        console.log("rs3en45")


        pomelo.app.sysrpc['room'].msgRemote.forwardMessage(
            { forceFrontendId: "room-server-1" },
            {
                body: { playerId: params.playerId, playerName: params.playerName, isStandup: false, channelId: params.channelId, isRequested: false, origin: params.data && params.data.origin ? params.data.origin : 'kickToLobby' },
                route: "room.channelHandler.leaveTable"
            },
            sessionExport(params.session), function (err, hitLeaveResponse) {
                console.log("room.channelHandler.leaveTable res is >", hitLeaveResponse);
            }
        );



        // pomelo.app.rpc.connector.sessionRemote.hitLeave(params.session, { playerId: params.playerId, playerName: params.playerName, isStandup: false, channelId: params.channelId, isRequested: false, origin: 'kickToLobby' }, function () {
        //   // broadcastHandler.fireInfoBroadcastToPlayer({self: params.self, playerId: params.playerId, buttonCode: 1, channelId: params.channelId, heading: "Standup", info: "You did not act in time (" + systemConfig.playerSpectateLimit + " seconds), seat in " + params.channel.channelName + " is no longer reserved."})
        // });
        var playerObject = {};
        playerObject.playerId = params.playerId;
        playerObject.channelId = params.channelId;
        // getPlayerSessionServer(playerObject,params,function(cbResult){
        //   console.error(cbResult);
        // })
    });
}

// Kill existing timer for reserve seat
channelTimerHandler.killReserveSeatReferennce = function (params, cb) {
    console.error("reserver kill sit fired");
    if (!params.channel) {
        console.error("if u get a error i m responsible", params);
        channelTimerHandler.killKickToLobbyTimer(params);
        //return;
    }
    //console.error("@@@@@@@@@@@@@@@@@@@@@@@@@@!!!!!!!!!!!!!!!!!!@@@@@@@@@@@@@@@@@@@@@###############",params);
    if (params.channel && params.channel.channelType === stateOfX.gameType.normal && !!params.channel.reserveSeatTimeReference[params.playerId]) {
        serverLog(stateOfX.serverLogType.info, 'Reserve seat timer exists for this player - ' + params.playerId + ', killing schedule!')
        params.channel.reserveSeatTimeReference[params.playerId].cancel();
        params.channel.reserveSeatTimeReference[params.playerId] = null;
    } else {
        serverLog(stateOfX.serverLogType.info, 'No reserve seat timer exists for player id - ' + params.playerId);
    }
    channelTimerHandler.killKickToLobbyTimer(params);

    // Also kill timer to kick player on lobby if player taken a seat
}


// Kill existing timer for any player to kick on lobby
channelTimerHandler.killKickToLobbyTimer = function (params, cb) {
    console.log("kill kick to loby fired", params);
    if (params.channel && params.channel.channelType === stateOfX.gameType.normal && !!params.channel.kickPlayerToLobby[params.playerId]) {
        serverLog(stateOfX.serverLogType.info, 'Kick to lobby timer exists for this player - ' + params.playerId + ', killing schedule!')
        params.channel.kickPlayerToLobby[params.playerId].cancel();
        params.channel.kickPlayerToLobby[params.playerId] = null;
    } else {
        serverLog(stateOfX.serverLogType.info, 'No Kick to lobby timer exists for player id - ' + params.playerId);
    }
}

// kill channel timers
channelTimerHandler.killChannelTurnTimer = function (params) {
    killChannelLevelTimers(params);
}


// Schedule timer to finish and send broadcast after calltime over
channelTimerHandler.sendCallTimeOverBroadCast = function (params) {
    console.error("sendCallTimeOverBroadCast fired", Object.keys(params));
    serverLog(stateOfX.serverLogType.info, 'Processing for channel id: ' + params.channelId);
    serverLog(stateOfX.serverLogType.info, 'In channelTimerHandler function sendCallTimeOverBroadCast');
    var channel = pomelo.app.get('channelService').getChannel(params.channelId, false);
    if (!channel) {
        console.log("need to insert new channel", channel)
        channel = pomelo.app.get('channelService').getChannel(params.channelId, true);
    }
    console.log('Channel Keys: ', channel.callTime);
    var currentTime = new Date();
    var scheduleTime = null;
    if (channel.callTimeTimeReference[params.playerId]) {
        channel.callTimeTimeReference[params.playerId].cancel();
        channel.callTimeTimeReference[params.playerId] = null;
    }
    // console.log('channel.bufferTime', channel.callTime, channel.bufferTime, channel.ctEnabledBufferTime, JSON.stringify(Object.keys(channel)));
    if (params.origin == 'sendCallTimeBufferOverBroadCast') {
        scheduleTime = currentTime.setSeconds(currentTime.getSeconds() + 10); /* systemConfig.vacantReserveSeatTime */
        channel.callTimeTimeReference[params.playerId] = schedule.scheduleJob(currentTime, function () {
            serverLog(stateOfX.serverLogType.info, 'Players call time over now');
            console.log("rs3en45")

            pomelo.app.sysrpc['room'].msgRemote.forwardMessage(
                { forceFrontendId: pomelo.app.serverId },
                {
                    body: { playerId: params.playerId, status: false, channelId: params.channelId, isRequested: false, playerName: params.playerName, origin: params.origin },
                    route: "room.channelHandler.leaveTable"
                },
                sessionExport(params.session), function (...arg) {
                    console.log('pomelo.app.sysrpc[room].msgRemote', ...arg);

                });
        });
    } else {
        scheduleTime = currentTime.setSeconds(currentTime.getSeconds() + parseInt(channel.callTime * 60));
        // scheduleTime = currentTime.setSeconds(currentTime.getSeconds() + parseInt(2 * 60));
        channel.callTimeTimeReference[params.playerId] = schedule.scheduleJob(currentTime, function () {
            serverLog(stateOfX.serverLogType.info, 'Players call time over now');
            pomelo.app.sysrpc['room'].msgRemote.forwardMessage(
                { forceFrontendId: pomelo.app.serverId },
                {
                    body: { playerId: params.playerId, status: false, channelId: params.channelId, isRequested: false, origin: params.origin },
                    route: "room.channelHandler.callTimerStatus"
                },
                params.session.export(), function (...arg) {
                    console.log('pomelo.app.sysrpc[room].msgRemote', ...arg);

                });
        });
    }
}




