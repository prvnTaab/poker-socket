import { Injectable } from "@nestjs/common";
import _ from "underscore";
import _ld from "lodash";
import systemConfig from "./../../../../../libs/common/src/systemConfig.json";
import popupTextManager from "../../../../../libs/common/src/popupTextManager";
import stateOfX from "shared/common/stateOfX.sevice";

import { PokerDatabaseService } from "shared/common/datebase/pokerdatabase.service";
import { ImdbDatabaseService } from "shared/common/datebase/Imdbdatabase.service";
import { BroadcastHandlerService } from "./broadcastHandler.service";
import { SubscriptionHandlerService } from "./subscriptionHandler.service";
import { validateKeySets } from "shared/common/utils/activity";

const pomelo: any; // In this place we have add socket.io

schedule = require('node-schedule');

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


    // to get server id he is connected to
    getCurrentPlayerSession(params) {
        // params.playerId
        // params.session = {} // neew
        // pomelo.app.rpc.database.dbRemote.findUserSessionInDB(params.session, params.playerId, function (response) {
        //   if (response.success && !!response.result) {
        // response.result.serverId;
        params.sessionNew = { frontendId: 'connector-server-1' };
        return params;
        //   } else {
        //     cb({ success: false, info: "User session not found in DB." });
        //   }
        // })
    }


    async playerSimpleMoveWithTimeBank3(params: any): Promise<any> {

        console.log(stateOfX.serverLogType.info, 'In channelTimerHandler function playerSimpleMoveWithTimeBank');

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

                params.channel.playerSimpleMoveWithTimeBank = setTimeout(() => {
                    this.playerSimpleMoveWithFreeTurnTime(params);
                }, (params.player.timeBankSec || 1) * 1000);

                params.channel.currentMovePlayer = params.playerId;
                params.channel.updatedTimeBank = params.player.updatedTimeBank;
                params.channel.startedAt = Number(new Date());
            }
        } else {
            this.playerSimpleMoveWithFreeTurnTime(params);
        }
    };


    async playerSimpleMoveWithTimeBank2(params: any): Promise<any> {

        console.log(stateOfX.serverLogType.info, 'In channelTimerHandler function playerSimpleMoveWithTimeBank');

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

                params.channel.playerSimpleMoveWithTimeBank = setTimeout(() => {
                    this.playerSimpleMoveWithExtraDisconnectionTime(params);
                }, (params.player.timeBankSec || 1) * 1000);

                params.channel.currentMovePlayer = params.playerId;
                params.channel.updatedTimeBank = params.player.updatedTimeBank;
                params.channel.startedAt = Number(new Date());
            }
        } else {
            this.playerSimpleMoveWithExtraDisconnectionTime(params);
        }
    };


    /*======================  START  =====================*/
    // ### Handle when player is disconnected
    // provide extra time bank 10 seconds or remaining as available

    // New
    async playerSimpleMoveWithTimeBank(params: any): Promise<any> {

        console.log(stateOfX.serverLogType.info, 'In channelTimerHandler function playerSimpleMoveWithTimeBank');

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

                params.channel.playerSimpleMoveWithTimeBank = setTimeout(() => {
                    this.playerSimpleMoveAndSitout(params);
                }, (params.player.timeBankSec || 1) * 1000);

                params.channel.currentMovePlayer = params.playerId;
                params.channel.updatedTimeBank = params.player.updatedTimeBank;
                params.channel.startedAt = Number(new Date());
            }
        } else {
            this.playerSimpleMoveAndSitout(params);
        }
    };



    // Old
    // var playerSimpleMoveWithTimeBank = function (params, cb) {
    // serverLog(stateOfX.serverLogType.info, 'In channelTimerHandler function playerSimpleMoveWithTimeBank');
    // // params.self.app.rpc.database.tableRemote.getPlayerAttribute(params.session, {channelId: params.channelId, playerId: params.playerId, key: "timeBankSec"}, function (getPlayerTimeBank) {
    // //   serverLog(stateOfX.serverLogType.info, ' response of tableRemote.getPlayerAttribute '+ JSON.stringify(getPlayerTimeBank));
    // //   if (getPlayerTimeBank.success) { 

    // if (params.player.timeBankSec && params.player.timeBankSec > 0) {
    //     pomelo.app.rpc.database.requestRemote.setTimeBankDetails(params.session, { playerId: params.playerId, channelId: params.channelId }, function (setTimeBankResp) {
    //         if (setTimeBankResp.success && setTimeBankResp.table.state != stateOfX.gameState.idle) {
    //             broadcastHandler.startTimeBank({ channel: params.channel, channelId: params.channelId, playerId: params.playerId, totalTimeBank: (params.player.updatedTimeBank || 1), timeBankLeft: (params.player.updatedTimeBank || 1), originalTimeBank: params.player.timeBankSec, subscribedTimeBank: params.player.subscribedTimeBank });
    //             params.channel.playerSimpleMoveWithTimeBank = setTimeout(cb, (params.player.timeBankSec || 1) * 1000, params);
    //             params.channel.currentMovePlayer = params.playerId;
    //             params.channel.updatedTimeBank = params.player.updatedTimeBank;
    //             params.channel.startedAt = Number(new Date());
    //         }
    //     })
    // } else {
    //     cb(params)
    // }
    // }
    /*======================  END  =====================*/




    /*======================  START  =====================*/
    // perform auto move and then sitout if FOLDed

    // New
    async playerSimpleMoveAndSitout(params: any) {

        const performCheckOrFoldResponse = await this.performCheckOrFold(params);

        console.log(stateOfX.serverLogType.info, 'Player auto turn performed !');

        // Pomelo Connection
        const systemFoldedCount = await pomelo.app.rpc.database.tableRemote.getPlayerAttribute(
            params.session,
            { channelId: params.channelId, playerId: params.playerId, key: "systemFoldedCount" }
        );
        // Pomelo Connection

        if (systemFoldedCount.success) {

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

            console.log(stateOfX.serverLogType.info, 'setPlayerAttribResponse systemFoldedCount: ' + (systemFoldedCount.value + 1));
        }

        if (performCheckOrFoldResponse.success && params.action === stateOfX.move.fold) {
            console.log(stateOfX.serverLogType.info, 'Not sending folded player sitout in automove case');
        } else {
            console.log(stateOfX.serverLogType.info, 'Not sitting out player as ' + params.action + ' performed as auto action.');
        }
    };


    // Old
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
    /*======================  END  =====================*/






    /*======================  START  =====================*/
    // ### Kill channel timers for moves and other tasks

    // New
    async killChannelLevelTimers(params: any): Promise<any> {

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

        // Free Turn Time Reference
        if (params.channel?.freeTurnTimeReference) {
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
                        tableName: params.channel?.channelName || '',
                    };

                    await this.subscriptionHandler.saveSubscriptionHistory(data);

                } catch (err) {
                    console.error("Error saving freeTurnTime log:", err);
                }
            }

            clearTimeout(params.channel.freeTurnTimeReference);
            params.channel.freeTurnTimeReference = null;
        }

        // Extra Disconnection Time Reference
        if (params.channel?.extraDisconnectionTimeReference) {
            const timeUsed = Math.floor((Date.now() - params.channel.extraDisconnectionTimeReference.startedAt) / 1000);

            if (timeUsed > 0 && params.request) {
                try {
                    const gotHandId = await this.db.findHandIdByRoundId({ roundId: params.channel.roundId });
                    const handId = gotHandId?.[0]?.handId || '';

                    const data = {
                        type: "disconnectionEnded",
                        disconnectionTimeUsed: timeUsed,
                        channelId: params.channelId || params.request.channelId,
                        roundId: handId,
                        playerId: params.request.playerId,
                        tableName: params.channel?.channelName || '',
                    };

                    await this.subscriptionHandler.saveSubscriptionHistory(data);
                } catch (err) {
                    console.error("Error saving extraDisconnectionTime log:", err);
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
    }



    // Old
    // var killChannelLevelTimers = function (params) {
    //     console.trace("inside killChannelLevelTimers", params)
    //     serverLog(stateOfX.serverLogType.info, 'In channelTimerHandler function killChannelLevelTimers');
    //     // Kill previous timer if exists
    //     if(!!params.channel){
    //       params.channel.startedAt = null;
    //       params.channel.updatedTimeBank = 0;
    //       params.channel.currentMovePlayer = null;
    //     }
    //     if (!!params.channel.turnTimeReference) {
    //       clearTimeout(params.channel.turnTimeReference);
    //       params.channel.turnTimeReference = null;
    //     } else {
    //       serverLog(stateOfX.serverLogType.error, 'TURN TIMER NOT EXISTS, while restarting auto turn timer !!')
    //     }

    //     if (!!params.channel.extraTurnTimeReference) {
    //       clearTimeout(params.channel.extraTurnTimeReference);
    //       params.channel.extraTurnTimeReference = null;
    //     } else {
    //       serverLog(stateOfX.serverLogType.error, 'EXTRA TURN TIMER NOT EXISTS, while restarting auto turn timer !!')
    //     }

    //     //Implemented for freeTurnTime 
    //     if (!!params.channel.freeTurnTimeReference) {
    //     let timeUsed = Math.floor((Number(new Date()) - params.channel.freeTurnTimeReference.startedAt) / 1000);
    //       if (timeUsed > 0) {
    //         if (!!params.request) {
    //           //Deducting used amount of freeTurnTime
    //           logDB.findHandIdByRoundId({ roundId: params.channel.roundId }, function (err, gotHandId) {
    //             console.log("gotHandIdgotHandId", err, gotHandId)
    //             let handId = '';
    //             if (!err && gotHandId.length) {
    //               handId = gotHandId[0].handId
    //             }
    //             let data = {
    //               type: "freeTurnEnded",
    //               timeBankUsed: timeUsed,
    //               channelId: params.channelId ? params.channelId : params.request.channelId,
    //               roundId: handId,
    //               playerId: params.request.playerId,
    //               tableName: params.channel ? params.channel.channelName : '',
    //             }
    //             subscriptionHandler.saveSubscriptionHistory(data);
    //           })
    //         }
    //       }
    //       clearTimeout(params.channel.freeTurnTimeReference);
    //       params.channel.freeTurnTimeReference = null;
    //     }


    //     //Implemented for extraDisconnectionTime
    //      if(!!params.channel.extraDisconnectionTimeReference){
    //     let timeUsed = Math.floor((Number(new Date()) - params.channel.extraDisconnectionTimeReference.startedAt) / 1000);
    //        if (timeUsed > 0) {
    //          if (!!params.request) {
    //            //Note:In this condition we will deduct extraDisconnection time used by user and update the extraDisconnection used.
    //            logDB.findHandIdByRoundId({ roundId: params.channel.roundId }, function (err, gotHandId) {
    //              console.log("gotHandIdgotHandId", err, gotHandId)
    //              let handId = '';
    //              if (!err && gotHandId.length) {
    //                handId = gotHandId[0].handId
    //              }
    //              let data = {
    //                type: "disconnectionEnded",
    //                disconnectionTimeUsed: timeUsed,
    //                channelId: params.channelId ? params.channelId : params.request.channelId,
    //                roundId: handId,
    //                playerId: params.request.playerId,
    //                tableName: params.channel ? params.channel.channelName : '',
    //              }
    //              subscriptionHandler.saveSubscriptionHistory(data);
    //            })
    //          }
    //        }
    //       clearTimeout(params.channel.extraDisconnectionTimeReference);
    //       params.channel.extraDisconnectionTimeReference = null;
    //      }

    //     if (!!params.channel.timeBankTurnTimeReference) {
    //       clearTimeout(params.channel.timeBankTurnTimeReference);
    //       params.channel.timeBankTurnTimeReference = null;
    //     } else {
    //       serverLog(stateOfX.serverLogType.error, 'TIMEBANK TURN TIMER NOT EXISTS, while restarting auto turn timer !!')
    //     }

    //     // Reset delay timer while checking client connection
    //     if (!!params.channel.clientConnAckReference) {
    //       clearTimeout(params.channel.clientConnAckReference)
    //       params.channel.clientConnAckReference = null;
    //     }

    //     if (!!params.channel.playerSimpleMoveWithTimeBank) {
    //       clearTimeout(params.channel.playerSimpleMoveWithTimeBank)
    //       params.channel.playerSimpleMoveWithTimeBank = null;
    //     }

    //     if (!!params.channel.performAutoSitout) {
    //       clearTimeout(params.channel.performAutoSitout)
    //       params.channel.performAutoSitout = null;
    //     }
    //   }
    /*======================  END  =====================*/



    /*======================  START  =====================*/
    // Handling case of disconnection after starting timeBank


    // New
    async disconnectionAfterTimeBank(msg, channel) {
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
                        tableName: channel.channelName || '',
                    };

                    await this.subscriptionHandler.saveSubscriptionHistory(data);
                } catch (error) {
                    console.error('Error saving freeTurnEnded log:', error);
                }
            }

            clearTimeout(channel.freeTurnTimeReference);
            channel.freeTurnTimeReference = null;
        }

        if (!!channel.playerSimpleMoveWithTimeBank) {
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

        await this.autoActDisconnected(disconnectionData);
    };


    // Old
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
    /*======================  END  =====================*/

    /*======================  START  =====================*/
    // Handling case of reconnection after disconnection sterted

    // New
    async reconnectionAfterDisconnection(msg, channel) {
        channel.startedAt = null;

        if (!!channel.extraTurnTimeReference) {
            clearTimeout(channel.extraTurnTimeReference);
            channel.extraTurnTimeReference = null;
        }

        if (!!channel.extraDisconnectionTimeReference) {
            const timeUsed = Math.floor((Number(new Date()) - channel.extraDisconnectionTimeReference.startedAt) / 1000);

            if (timeUsed > 0) {
                try {
                    const gotHandId = await this.db.findHandIdByRoundId({ roundId: channel.roundId });
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
                } catch (err) {
                    console.error("Error logging disconnection end:", err);
                }
            }

            clearTimeout(channel.extraDisconnectionTimeReference);
            channel.extraDisconnectionTimeReference = null;
        }

        if (!!channel.playerSimpleMoveWithTimeBank) {
            clearTimeout(channel.playerSimpleMoveWithTimeBank);
            channel.playerSimpleMoveWithTimeBank = null;
        }

        try {

            // Pomelo Connection
            const getCurrentPlayerResponse = await pomelo.app.rpc.database.tableRemote.getCurrentPlayer({}, {
                channelId: msg.channelId,
                playerId: msg.playerId,
                key: "state",
            });
            // Pomelo Connection

            if (getCurrentPlayerResponse.success) {
                const gotPlayer = getCurrentPlayerResponse.player;

                if (gotPlayer.timeBankSec) {
                    gotPlayer.timeBankSec -= Math.ceil((Number(new Date()) - gotPlayer.timeBankStartedAt) / 1000);
                    gotPlayer.timeBankSec = gotPlayer.timeBankSec || 0;
                }

                const connectionData = {
                    channel: channel,
                    channelId: msg.channelId,
                    playerId: msg.playerId,
                    playerName: msg.playerName,
                    player: gotPlayer,
                    session: '',
                };

                await this.autoActConnected(connectionData);
            } else {
                await this.playerSimpleMoveAndSitout(msg);
            }
        } catch (err) {
            console.error("Error handling reconnectionAfterDisconnection:", err);
        }
    };



    // Old
    // channelTimerHandler.reconnectionAfterDisconnection = function (msg, channel) {
    //     channel.startedAt = null;
    //     if (!!channel.extraTurnTimeReference) {
    //         clearTimeout(channel.extraTurnTimeReference);
    //         channel.extraTurnTimeReference = null;
    //     }

    //     if (!!channel.extraDisconnectionTimeReference) {
    //         let timeUsed = Math.floor((Number(new Date()) - channel.extraDisconnectionTimeReference.startedAt) / 1000);
    //         if (timeUsed > 0) {
    //             //Deducting used amount of extra disconnection time
    //             logDB.findHandIdByRoundId({ roundId: channel.roundId }, function (err, gotHandId) {
    //                 let handId = '';
    //                 if (!err && gotHandId.length) {
    //                     handId = gotHandId[0].handId
    //                 }
    //                 let data = {
    //                     type: "disconnectionEnded",
    //                     disconnectionTimeUsed: timeUsed,
    //                     channelId: msg.channelId,
    //                     roundId: handId,
    //                     playerId: msg.playerId,
    //                     tableName: channel.channelName || '',
    //                 }
    //                 subscriptionHandler.saveSubscriptionHistory(data);
    //             })
    //         }
    //         clearTimeout(channel.extraDisconnectionTimeReference);
    //         channel.extraDisconnectionTimeReference = null;
    //     }

    //     if (!!channel.playerSimpleMoveWithTimeBank) {
    //         clearTimeout(channel.playerSimpleMoveWithTimeBank)
    //         channel.playerSimpleMoveWithTimeBank = null;
    //     }

    //     pomelo.app.rpc.database.tableRemote.getCurrentPlayer({}, { channelId: msg.channelId, playerId: msg.playerId, key: "state" }, async function (getCurrentPlayerResponse) {
    //         if (getCurrentPlayerResponse.success) {
    //             let gotPlayer = getCurrentPlayerResponse.player;
    //             if (gotPlayer.timeBankSec) {
    //                 gotPlayer.timeBankSec -= Math.ceil((Number(new Date()) - gotPlayer.timeBankStartedAt) / 1000);
    //                 gotPlayer.timeBankSec = gotPlayer.timeBankSec ? gotPlayer.timeBankSec : 0;
    //             }
    //             let connectionData = {
    //                 channel: channel,
    //                 channelId: msg.channelId,
    //                 playerId: msg.playerId,
    //                 playerName: msg.playerName,
    //                 player: gotPlayer,
    //                 session: ''
    //             }
    //             autoActConnected(connectionData);
    //         }
    //         else {
    //             playerSimpleMoveAndSitout(msg);
    //         }
    //     });
    // }
    /*======================  END  =====================*/

    /*======================  START  =====================*/
    // decide action move by player's selected precheck value
    // if possible, do it

    // Old
    decideMoveAccToPrecheck(precheckValue, moves) {
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
    /*======================  END  =====================*/


    /*======================  START  =====================*/
    // ### Perform any move on behalf of player from server

    // New
    async perfromPlayerMove(params: any): Promise<any> {

        const validated = await validateKeySets("Request", "connector", "perfromPlayerMove", params);


        if (!validated.success) {
            return validated;
        }


        const moveDataParams = {
            playerId: params.playerId,
            channelId: params.channelId,
            amount: params.amount,
            action: params.action,
            runBy: params.runBy || "none",
            isRequested: false,
            channelType: params.table ? params.table.channelType : params.channel.channelType,
        };

        // Pomelo Connection
        const res = await new Promise<any>((resolve, reject) => {
            pomelo.app.sysrpc['room'].msgRemote.forwardMessage(
                { forceFrontendId: "room-server-1" },
                {
                    body: moveDataParams,
                    route: "room.channelHandler.makeMove"
                },
                this.sessionExport(params.session),
                (err: any, result: any) => {
                    if (err) reject(err);
                    else resolve(result);
                }
            );
        });
        // Pomelo Connection

        return res;
    }




    // // Old
    // var perfromPlayerMove = function (params, cb) {
    //     console.log(stateOfX.serverLogType.info, 'Processing for channel id: ' + params);
    //     console.log(stateOfX.serverLogType.info, 'In channelTimerHandler function perfromPlayerMove', params.channel);
    //     console.log(stateOfX.serverLogType.info, "params.self is in performPlayerMove ---- ");
    //     // serverLog(stateOfX.serverLogType.info, _.keys(params.self));
    //     keyValidator.validateKeySets("Request", "connector", "perfromPlayerMove", params, function (validated) {
    //         // console.log("params====================", params)
    //         if (validated.success) {
    //             console.error("!!!!!!!@@@@@@@@@#########################");
    //             console.error(pomelo.app.channelhandler);
    //             var moveDataParams = {
    //                 playerId: params.playerId,
    //                 channelId: params.channelId,
    //                 amount: params.amount,
    //                 action: params.action,
    //                 runBy: params.runBy || "none",
    //                 isRequested: false,
    //                 channelType: params.table ? params.table.channelType : params.channel.channelType
    //             };
    //             // console.log("params.sessionNew >>>>>>>>>>", params.table.channelType)
    //             // params.session.forceFrontendId = params.sessionNew.frontendId;
    //             // var moveData = {};
    //             // moveData.msg = moveDataParams;
    //             // moveData.session = params.session;
    //             //pomelo.app.event.emit('makeMove',moveData);

    //             // params.self.makeMove({
    //             //   playerId    : params.playerId,
    //             //   channelId   : params.channelId,
    //             //   amount      : params.amount,
    //             //   action      : params.action,
    //             //   isRequested : false
    //             // }, params.session, function (err, makeMoveResponse) {
    //             //   cb(makeMoveResponse);
    //             // });

    //             // pomelo.app.rpc.connector.sessionRemote.hitAutoMove(params.session, moveDataParams, function (makeMoveResponse) {
    //             //   // serverLog(stateOfX.serverLogType.info, 'response of rpc-hitAutoMove' + JSON.stringify(makeMoveResponse));
    //             //   cb(makeMoveResponse);
    //             // })
    //             pomelo.app.sysrpc['room'].msgRemote.forwardMessage(
    //                 { forceFrontendId: "room-server-1" },
    //                 {
    //                     body: moveDataParams,
    //                     route: "room.channelHandler.makeMove"
    //                 },
    //                 sessionExport(params.session), function (err, res) {
    //                     console.log("room.channelHandler.makeMove res is >", err, res);
    //                     cb(res)
    //                 }
    //             );
    //         } else {
    //             cb(validated)
    //         }
    //     });
    // }
    /*======================  END  =====================*/

    /*======================  START  =====================*/
    // ### Perform CHECK or FOLD - acc to availability
    // after player has not acted in enough time

    // New
    async performCheckOrFold(params): Promise<any> {

        console.log(stateOfX.serverLogType.info, 'Processing for channel id: ' + params.channel.channelId);
        console.log(stateOfX.serverLogType.info, 'In channelTimerHandler function performCheckOrFold');

        // Pomelo Connection
        const getPlayerMoves = await pomelo.app.rpc.database.tableRemote.getPlayerAttribute(
            params.session,
            { channelId: params.channelId, playerId: params.playerId, key: "moves" }
        );
        // Pomelo Connection

        if (getPlayerMoves.success) {
            params.amount = 0;

            // Set player action
            params.action = getPlayerMoves.value.indexOf(1) >= 0 ? stateOfX.move.check : stateOfX.move.fold;
            params.action =
                params.channel.channelType === stateOfX.gameType.tournament && params.isTournamentSitout
                    ? stateOfX.move.fold
                    : params.action;

            const perfromPlayerMoveResponse = await this.perfromPlayerMove(params);
            return perfromPlayerMoveResponse;
        } else {
            console.log(
                stateOfX.serverLogType.error,
                "Get player moves from key failed - " + JSON.stringify(getPlayerMoves)
            );
            return { success: false, message: "Failed to retrieve player moves." };
        }
    };


    // Old
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
    /*======================  END  =====================*/


    /*======================  START  =====================*/
    // Perform auto sitout for any player

    // New
    async performAutoSitout(params: any): Promise<any> {

        const validated = await validateKeySets("Request", "connector", "performAutoSitout", params);

        if (validated.success) {
            params.channel.performAutoSitout = setTimeout(async () => {
                const autoSitoutResponse = await pomelo.app.rpc.database.tableRemote.autoSitoutAsync(
                    params.session,
                    {
                        playerId: params.playerId,
                        channelId: params.channelId,
                        isRequested: false,
                        isConnected: (params.playerState === stateOfX.playerState.disconnected),
                    }
                );



                this.broadcastHandler.firePlayerStateBroadcast({
                    channel: params.channel,
                    playerId: params.playerId,
                    channelId: params.channelId,
                    state: stateOfX.playerState.onBreak,
                });

                return autoSitoutResponse;

            }, (systemConfig.autositoutDelayGameOver) * 1000);
        } else {
            console.log(stateOfX.serverLogType.error, 'Error while sending ack broadcast - ' + JSON.stringify(validated));
        }
    }


    // Old
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
    /*======================  END  =====================*/


    /*======================  START  =====================*/

    // New
    playerSimpleMoveWithFreeTurnTime(params: any): any {
        console.log("inside playerSimpleMoveWithFreeTurnTime", params);

        // Starting setTimeout for extraTurn time
        params.channel.freeTurnTimeReference = setTimeout(() => {
            this.playerSimpleMoveAndSitout(params);
        }, params.player.subscribedTimeBank * 1000);

        params.channel.freeTurnTimeReference.startedAt = Number(new Date());
    }

    // Old
    // let playerSimpleMoveWithFreeTurnTime = function (params) {
    //     console.log("inside playerSimpleMoveWithFreeTurnTime", params)
    //     //starting setTimeout for extraTurn time 
    //     params.channel.freeTurnTimeReference = setTimeout(playerSimpleMoveAndSitout, params.player.subscribedTimeBank * 1000, params);
    //     params.channel.freeTurnTimeReference.startedAt = Number(new Date());
    // }
    /*======================  END  =====================*/


    /*======================  START  =====================*/
    // New
    playerSimpleMoveWithExtraDisconnectionTime(params: any): any {

        params.channel.extraDisconnectionTimeReference = setTimeout(() => {
            this.playerSimpleMoveAndSitout(params);
        }, params.player.subscribedTimeBank * 1000);

        params.channel.extraDisconnectionTimeReference.startedAt = Number(new Date());
    };

    // Old
    // let playerSimpleMoveWithExtraDisconnectionTime = function (params) {
    //     console.trace("inside playerSimpleMoveWithExtraDisconnectionTime", params)
    //     //starting setTimeout for extraDisconnection time 
    //     params.channel.extraDisconnectionTimeReference = setTimeout(playerSimpleMoveAndSitout, params.player.subscribedTimeBank * 1000, params);
    //     params.channel.extraDisconnectionTimeReference.startedAt = Number(new Date());
    // }
    /*======================  END  =====================*/



    /*======================  START  =====================*/
    // auto move flow for disconnected player

    // New
    async autoActDisconnected(params: any): Promise<any> {
        console.log('in autoActDisconnected params are', params);
        console.log(stateOfX.serverLogType.info, 'In channelTimerHandler function autoActDisconnected');

        const validated = await validateKeySets("Request", "connector", "autoActDisconnected", params);

        if (validated.success) {
            console.log(stateOfX.serverLogType.info, 'Turn time for this table - ' + parseInt(params.channel.turnTime));
            console.log(stateOfX.serverLogType.info, 'Player will perform move after extra time - ' + (stateOfX.extraTimeBank[params.channel.turnTime] || stateOfX.extraTimeBank['default']));

            this.broadcastHandler.firePlayerStateBroadcast({
                channel: params.channel,
                channelId: params.channelId,
                state: stateOfX.playerState.disconnected,
                resetTimer: true,
                playerId: params.playerId
            });

            params.channel.extraTurnTimeReference = setTimeout(async () => {


                // Pomelo Connection
                const getCurrentPlayerResponse = await pomelo.app.rpc.database.tableRemote.getCurrentPlayer(
                    params.session,
                    { channelId: params.channelId, playerId: params.playerId, key: "state" }
                );
                // Pomelo Connection

                if (getCurrentPlayerResponse.success) {
                    params.playerState = getCurrentPlayerResponse.player.state;
                    params.player = getCurrentPlayerResponse.player;

                    if (params.playerState === stateOfX.playerState.playing || params.playerState === stateOfX.playerState.disconnected) {
                        if (params.player.timeBankSec < 5) {
                            params.player.timeBankSec = 5;
                        }
                        params.player.updatedTimeBank = params.player.timeBankSec;

                        try {
                            const findUserResponse = await this.db.findUser({ playerId: params.playerId });

                            if (
                                !!findUserResponse &&
                                !!findUserResponse.subscription &&
                                Date.now() >= findUserResponse.subscription.startDate &&
                                Date.now() <= findUserResponse.subscription.endDate
                            ) {
                                const subscriptionResult = await this.db.fetchSubscription({
                                    subscriptionId: findUserResponse.subscription.subscriptionId
                                });

                                if (!subscriptionResult || !subscriptionResult.length) {
                                    this.playerSimpleMoveWithTimeBank(params);
                                }

                                const extraTimeLog = await this.db.getExtraTimeLog({
                                    playerId: params.playerId,
                                    channelId: params.channelId,
                                    subscriptionId: findUserResponse.subscription.subscriptionId
                                });

                                if (extraTimeLog) {
                                    let usedTime = extraTimeLog.disconnectionTimeUsed;
                                    if ((subscriptionResult[0].disconnectionTime - usedTime) >= 0) {
                                        subscriptionResult[0].disconnectionTime -= usedTime;
                                    } else {
                                        subscriptionResult[0].disconnectionTime = 0;
                                    }
                                } else {
                                    const logData = {
                                        playerId: params.playerId,
                                        channelId: params.channelId,
                                        userName: params.playerName,
                                        subscriptionId: subscriptionResult[0].subscriptionId,
                                        subscriptionName: subscriptionResult[0].name,
                                        timeBankUsed: 0,
                                        disconnectionTimeUsed: 0,
                                        updatedAt: Date.now()
                                    };

                                    await this.db.saveTimeLog({ playerId: params.playerId, channelId: params.channelId }, logData);

                                }

                                params.player.updatedTimeBank = params.player.timeBankSec + subscriptionResult[0].disconnectionTime;
                                params.player.subscribedTimeBank = subscriptionResult[0].disconnectionTime;

                                if (params.player.subscribedTimeBank) {
                                    this.playerSimpleMoveWithTimeBank2(params);
                                } else {
                                    this.playerSimpleMoveWithTimeBank(params);
                                }

                            } else {
                                this.playerSimpleMoveWithTimeBank(params);
                            }
                        } catch (err) {
                            this.playerSimpleMoveWithTimeBank(params);
                        }

                    } else {
                        this.playerSimpleMoveAndSitout(params);
                    }
                }
            }, (stateOfX.extraTimeBank[params.channel.turnTime] || stateOfX.extraTimeBank['default']) * 1000);

            params.channel.updatedTimeBank = (stateOfX.extraTimeBank[params.channel.turnTime] || stateOfX.extraTimeBank['default']);
            params.channel.startedAt = Number(new Date());

        } else {
            console.log(stateOfX.serverLogType.error, 'Error while sending ack broadcast - ' + JSON.stringify(validated));
        }
    };

    // Old
    // var autoActDisconnected = function (params) {
    //     console.log('in autoActDisconnected params are', params);
    //     serverLog(stateOfX.serverLogType.info, 'In channelTimerHandler function autoActDisconnected');
    //     keyValidator.validateKeySets("Request", "connector", "autoActDisconnected", params, function (validated) {
    //         if (validated.success) {
    //             serverLog(stateOfX.serverLogType.info, 'Turn time for this table - ' + parseInt(params.channel.turnTime));
    //             serverLog(stateOfX.serverLogType.info, 'Player will performe move after extra time - ' + parseInt(stateOfX.extraTimeBank[params.channel.turnTime] || stateOfX.extraTimeBank['default']));
    //             broadcastHandler.firePlayerStateBroadcast({ channel: params.channel, channelId: params.channelId, state: stateOfX.playerState.disconnected, resetTimer: true, playerId: params.playerId });
    //             params.channel.extraTurnTimeReference = setTimeout(function () {
    //                 // check for state again
    //                 // playing >> broadcast timebank >> timer - ((move.success ? subtract timer OR do it in moveRemote) + following code)
    //                 // disconnected >> (following code)
    //                 pomelo.app.rpc.database.tableRemote.getCurrentPlayer(params.session, { channelId: params.channelId, playerId: params.playerId, key: "state" }, async function (getCurrentPlayerResponse) {
    //                     if (getCurrentPlayerResponse.success) {
    //                         params.playerState = getCurrentPlayerResponse.player.state;
    //                         params.player = getCurrentPlayerResponse.player;
    //                         //if condition check player is part of this game
    //                         // if(params.table.onStartPlayers.indexOf(params.playerId) >= 0){
    //                         if (params.playerState === stateOfX.playerState.playing || params.playerState === stateOfX.playerState.disconnected) {
    //                             if (params.player.timeBankSec < 5) {
    //                                 params.player.timeBankSec = 5;
    //                             }
    //                             params.player.updatedTimeBank = params.player.timeBankSec;

    //                             db.findUser({ playerId: params.playerId }, (err, findUserResponse) => {
    //                                 if (!!findUserResponse && !!findUserResponse.subscription && (Date.now() >= findUserResponse.subscription.startDate && Date.now() <= findUserResponse.subscription.endDate)) {
    //                                     logDB.fetchSubscription({ subscriptionId: findUserResponse.subscription.subscriptionId }, async function (err, result) {
    //                                         console.log("inside fetchSubscription result is", result, params.player.timeBankSec)
    //                                         if (err || !result) {
    //                                             console.log("unable to find subscription list for given subscription id")
    //                                             playerSimpleMoveWithTimeBank(params, playerSimpleMoveAndSitout)
    //                                         } else {
    //                                             if (result.length && result[0].disconnectionTime) {
    //                                                 logDB.getExtraTimeLog({ playerId: params.playerId, channelId: params.channelId, subscriptionId: findUserResponse.subscription.subscriptionId }, (err, savedResult) => {
    //                                                     console.log("Already extra disconnection time started", err, savedResult)
    //                                                     if (!err && !!savedResult) {
    //                                                         let usedTime = savedResult.disconnectionTimeUsed;
    //                                                         if ((result[0].disconnectionTime - usedTime) >= 0) {
    //                                                             result[0].disconnectionTime -= usedTime;
    //                                                         }
    //                                                         else {
    //                                                             result[0].disconnectionTime = 0;
    //                                                         }
    //                                                     }
    //                                                     else {
    //                                                         console.log('No extra disconnection time exists for this player!!');
    //                                                         let logData = {
    //                                                             playerId: params.playerId,
    //                                                             channelId: params.channelId,
    //                                                             userName: params.playerName,
    //                                                             subscriptionId: result[0].subscriptionId,
    //                                                             subscriptionName: result[0].name,
    //                                                             timeBankUsed: 0,
    //                                                             disconnectionTimeUsed: 0,
    //                                                             updatedAt: Date.now()
    //                                                         }
    //                                                         logDB.saveTimeLog({ playerId: params.playerId, channelId: params.channelId }, logData, function (err, ans) { })
    //                                                     }
    //                                                     params.player.updatedTimeBank = params.player.timeBankSec + result[0].disconnectionTime;
    //                                                     params.player.subscribedTimeBank = result[0].disconnectionTime;
    //                                                     if (params.player.subscribedTimeBank) {
    //                                                         playerSimpleMoveWithTimeBank(params, playerSimpleMoveWithExtraDisconnectionTime);
    //                                                     }
    //                                                     else {
    //                                                         playerSimpleMoveWithTimeBank(params, playerSimpleMoveAndSitout);
    //                                                     }
    //                                                 });
    //                                             }
    //                                             else {
    //                                                 playerSimpleMoveWithTimeBank(params, playerSimpleMoveAndSitout);
    //                                             }
    //                                         }
    //                                     })
    //                                 }
    //                                 else {
    //                                     playerSimpleMoveWithTimeBank(params, playerSimpleMoveAndSitout)
    //                                 }
    //                             })
    //                         } else {
    //                             playerSimpleMoveAndSitout(params);
    //                         }
    //                         // serverLog(stateOfX.serverLogType.info, 'Current player state before performing move - ' + params.playerState);
    //                         // cb(null, params);
    //                     } else {
    //                         cb(getCurrentPlayerResponse);
    //                     }
    //                 });
    //                 // performCheckOrFold(params, function(performCheckOrFoldResponse) {
    //                 //   serverLog(stateOfX.serverLogType.info, 'Player auto turn performed !');
    //                 //   if(performCheckOrFoldResponse.success && params.action === stateOfX.move.fold) {
    //                 //     performAutoSitout(params, function(performAutoSitoutResponse) {
    //                 //       serverLog(stateOfX.serverLogType.info, 'Player went to auto sitout after autoActDisconnected !!')
    //                 //     });
    //                 //   } else {
    //                 //     serverLog(stateOfX.serverLogType.info, 'Not sitting out player as ' + params.action + ' performed as auto action.');
    //                 //   }
    //                 // });
    //             }, parseInt(stateOfX.extraTimeBank[params.channel.turnTime] || stateOfX.extraTimeBank['default']) * 1000)
    //             params.channel.updatedTimeBank = parseInt(stateOfX.extraTimeBank[params.channel.turnTime] || stateOfX.extraTimeBank['default']);
    //             params.channel.startedAt = Number(new Date());
    //         } else {
    //             console.log(stateOfX.serverLogType.error, 'Error while sending ack broadcast - ' + JSON.stringify(validated))
    //         }
    //     });
    // }
    /*======================  END  =====================*/

    /*======================  START  =====================*/
    // ### Handle when player is connected and not making any move
    // provide him timbank as available

    // New
    async autoActConnected(params: any) {
        console.log('in autoActConnected params are', params);
        console.log(stateOfX.serverLogType.info, 'In channelTimerHandler function autoActConnected');

        const validated = await validateKeySets("Request", "connector", "autoActConnected", params);

        if (!validated.success) {
            console.log(stateOfX.serverLogType.error, 'Error while sending ack broadcast - ' + JSON.stringify(validated));
        }

        console.log('successfully validated ---');

        if (params.player.timeBankSec < 5) {
            params.player.timeBankSec = 5;
        }
        params.player.updatedTimeBank = params.player.timeBankSec;

        const findUserResponse = await this.db.findUser({ playerId: params.playerId });

        if (
            findUserResponse &&
            findUserResponse.subscription &&
            (Date.now() >= findUserResponse.subscription.startDate && Date.now() <= findUserResponse.subscription.endDate)
        ) {
            const result = await this.db.fetchSubscription({ subscriptionId: findUserResponse.subscription.subscriptionId });

            console.log("inside fetchSubscription result is", result, params.player.timeBankSec);

            if (!result) {
                console.log("unable to find subscription list for given subscription id");
                this.playerSimpleMoveWithTimeBank(params);
            }

            if (result.length && result[0].timeBank) {
                const savedResult = await this.db.getExtraTimeLog({
                    playerId: params.playerId,
                    channelId: params.channelId,
                    subscriptionId: findUserResponse.subscription.subscriptionId,
                });

                console.log("Already extra turn time started", savedResult);

                if (savedResult) {
                    let usedTime = savedResult.timeBankUsed;
                    if ((result[0].timeBank - usedTime) >= 0) {
                        result[0].timeBank -= usedTime;
                    } else {
                        result[0].timeBank = 0;
                    }
                } else {
                    console.log('No extra turn time exists for this player!!');
                    const logData = {
                        playerId: params.playerId,
                        channelId: params.channelId,
                        userName: params.playerName,
                        subscriptionId: result[0].subscriptionId,
                        subscriptionName: result[0].name,
                        timeBankUsed: 0,
                        disconnectionTimeUsed: 0,
                        updatedAt: Date.now()
                    };
                    await this.db.saveTimeLog({ playerId: params.playerId, channelId: params.channelId }, logData);
                }

                params.player.updatedTimeBank = params.player.timeBankSec + result[0].timeBank;
                params.player.subscribedTimeBank = result[0].timeBank;

                if (params.player.subscribedTimeBank) {
                    this.playerSimpleMoveWithTimeBank3(params);
                } else {
                    this.playerSimpleMoveWithTimeBank(params);
                }
            } else {
                this.playerSimpleMoveWithTimeBank(params);
            }
        } else {
            this.playerSimpleMoveWithTimeBank(params);
        }
    }


    // Old
    // var autoActConnected = function (params) {
    //     console.log('in autoActConnected params are', params);
    //     serverLog(stateOfX.serverLogType.info, 'In channelTimerHandler function autoActConnected');
    //     keyValidator.validateKeySets("Request", "connector", "autoActConnected", params, async function (validated) {
    //         if (validated.success) {
    //             console.log('successfully validated ---');
    //             if (params.player.timeBankSec < 5) {
    //                 params.player.timeBankSec = 5
    //             }
    //             params.player.updatedTimeBank = params.player.timeBankSec;

    //             db.findUser({ playerId: params.playerId }, (err, findUserResponse) => {
    //                 if (!!findUserResponse && !!findUserResponse.subscription && (Date.now() >= findUserResponse.subscription.startDate && Date.now() <= findUserResponse.subscription.endDate)) {
    //                     logDB.fetchSubscription({ subscriptionId: findUserResponse.subscription.subscriptionId }, async function (err, result) {
    //                         console.log("inside fetchSubscription result is", result, params.player.timeBankSec)
    //                         if (err || !result) {
    //                             console.log("unable to find subscription list for given subscription id")
    //                             playerSimpleMoveWithTimeBank(params, playerSimpleMoveAndSitout)
    //                         } else {
    //                             if (result.length && result[0].timeBank) {
    //                                 logDB.getExtraTimeLog({ playerId: params.playerId, channelId: params.channelId, subscriptionId: findUserResponse.subscription.subscriptionId }, (err, savedResult) => {
    //                                     console.log("Already extra turn time started", err, savedResult)
    //                                     if (!err && !!savedResult) {
    //                                         let usedTime = savedResult.timeBankUsed;
    //                                         if ((result[0].timeBank - usedTime) >= 0) {
    //                                             result[0].timeBank -= usedTime;
    //                                         }
    //                                         else {
    //                                             result[0].timeBank = 0;
    //                                         }
    //                                     }
    //                                     else {
    //                                         console.log('No extra turn time exists for this player!!');
    //                                         let logData = {
    //                                             playerId: params.playerId,
    //                                             channelId: params.channelId,
    //                                             userName: params.playerName,
    //                                             subscriptionId: result[0].subscriptionId,
    //                                             subscriptionName: result[0].name,
    //                                             timeBankUsed: 0,
    //                                             disconnectionTimeUsed: 0,
    //                                             updatedAt: Date.now()
    //                                         }
    //                                         logDB.saveTimeLog({ playerId: params.playerId, channelId: params.channelId }, logData, function (err, ans) { })
    //                                     }
    //                                     params.player.updatedTimeBank = params.player.timeBankSec + result[0].timeBank;
    //                                     params.player.subscribedTimeBank = result[0].timeBank;
    //                                     if (params.player.subscribedTimeBank) {
    //                                         playerSimpleMoveWithTimeBank(params, playerSimpleMoveWithFreeTurnTime);
    //                                     }
    //                                     else {
    //                                         playerSimpleMoveWithTimeBank(params, playerSimpleMoveAndSitout);
    //                                     }
    //                                 });
    //                             }
    //                             else {
    //                                 playerSimpleMoveWithTimeBank(params, playerSimpleMoveAndSitout);
    //                             }
    //                         }
    //                     })
    //                 } else {
    //                     playerSimpleMoveWithTimeBank(params, playerSimpleMoveAndSitout)
    //                 }
    //             })


    //             // broadcast timebank >> timer - ((move.success ? subtract timer OR do it in moveRemote) + following code)
    //             //playerSimpleMoveWithTimeBank(params, playerSimpleMoveAndSitout);


    //             // playerSimpleMoveWithTimeBank(params, playerSimpleMoveWithFreeTurnTime);


    //             // performCheckOrFold(params, function(performCheckOrFoldResponse) {
    //             //   console.error(stateOfX.serverLogType.info, 'Player auto turn performed !', performCheckOrFoldResponse);
    //             //   if(performCheckOrFoldResponse.success && params.action === stateOfX.move.fold) {
    //             //     performAutoSitout(params, function(performAutoSitoutResponse) {
    //             //       serverLog(stateOfX.serverLogType.info, 'Player went to auto sitout after autoActConnected !!')
    //             //     });
    //             //   } else {
    //             //     serverLog(stateOfX.serverLogType.info, 'Not sitting out player as ' + params.action + ' performed as auto action.');
    //             //   }
    //             // });
    //         } else {
    //             serverLog(stateOfX.serverLogType.error, 'Error while sending ack broadcast - ' + JSON.stringify(validated))
    //         }
    //     });
    // }
    /*======================  END  =====================*/

    /*======================  START  =====================*/
    // tournament

    // New
    async tournamentAutoActsitout(params: any): Promise<any> {
        console.log(stateOfX.serverLogType.info, 'In channelTimerHandler function tournamentAutoActsitout');

        const validated = await validateKeySets("Request", "connector", "autoActDisconnected", params);

        if (validated.success) {
            const performCheckOrFoldResponse = await this.performCheckOrFold(params);

            console.log(stateOfX.serverLogType.info, 'Player auto turn performed for tournament == tournamentAutoActsitout!');

            if (performCheckOrFoldResponse.success && params.action === stateOfX.move.fold) {
                await this.performAutoSitout(params);
                console.log(stateOfX.serverLogType.info, 'Player went to auto sitout after tournamentAutoActsitout !!');
            } else {
                console.log(stateOfX.serverLogType.info, 'Not sitting out player as ' + params.action + ' performed as auto action.');
            }
        } else {
            console.log(stateOfX.serverLogType.error, 'Error while sending ack broadcast - ' + JSON.stringify(validated));
        }
    }


    // Old
    // var tournamentAutoActsitout = function (params) {
    //     serverLog(stateOfX.serverLogType.info, 'In channelTimerHandler function tournamentAutoActsitout');
    //     keyValidator.validateKeySets("Request", "connector", "autoActDisconnected", params, function (validated) {
    //         if (validated.success) {
    //             performCheckOrFold(params, function (performCheckOrFoldResponse) {
    //                 serverLog(stateOfX.serverLogType.info, 'Player auto turn performed for tournament == tournamentAutoActsitout!');
    //                 if (performCheckOrFoldResponse.success && params.action === stateOfX.move.fold) {
    //                     performAutoSitout(params, function (performAutoSitoutResponse) {
    //                         serverLog(stateOfX.serverLogType.info, 'Player went to auto sitout after tournamentAutoActsitout !!')
    //                     });
    //                 } else {
    //                     serverLog(stateOfX.serverLogType.info, 'Not sitting out player as ' + params.action + ' performed as auto action.');
    //                 }
    //             });
    //         } else {
    //             serverLog(stateOfX.serverLogType.error, 'Error while sending ack broadcast - ' + JSON.stringify(validated))
    //         }
    //     });
    // }
    /*======================  END  =====================*/

    /*======================  START  =====================*/
    // ### Handle when player is disconnected
    // tournament

    // New
    async tournamentAutoActDisconnected(params: any): Promise<void> {
        console.log(stateOfX.serverLogType.info, 'In channelTimerHandler function tournamentAutoActDisconnected');

        const validated = await validateKeySets("Request", "connector", "autoActDisconnected", params);

        if (validated.success) {
            console.log(
                stateOfX.serverLogType.info,
                'Player will performe move after extra time - ' +
                Number(stateOfX.extraTimeBank[params.channel.turnTime] || stateOfX.extraTimeBank['default'])
            );

            this.broadcastHandler.firePlayerStateBroadcast({
                channel: params.channel,
                channelId: params.channelId,
                state: stateOfX.playerState.disconnected,
                resetTimer: true,
                playerId: params.playerId
            });

            const delayInMs = (stateOfX.extraTimeBank[params.channel.turnTime] || stateOfX.extraTimeBank['default']) * 1000;

            params.channel.extraTurnTimeReference = setTimeout(async () => {
                const performCheckOrFoldResponse = await this.performCheckOrFold(params);
                console.log(stateOfX.serverLogType.info, 'Player auto turn performed for tournament == validateKeySets!');

                if (performCheckOrFoldResponse.success && params.action === stateOfX.move.fold) {
                    await this.performAutoSitout(params);
                    console.log(stateOfX.serverLogType.info, 'Player went to auto sitout after tournamentAutoActDisconnected !!');
                } else {
                    console.log(
                        stateOfX.serverLogType.info,
                        'Not sitting out player as ' + params.action + ' performed as auto action.'
                    );
                }
            }, delayInMs);
        } else {
            console.log(stateOfX.serverLogType.error, 'Error while sending ack broadcast - ' + JSON.stringify(validated));
        }
    }



    // Old
    // var tournamentAutoActDisconnected = function (params) {
    //     console.log(stateOfX.serverLogType.info, 'In channelTimerHandler function tournamentAutoActDisconnected');
    //     keyValidator.validateKeySets("Request", "connector", "autoActDisconnected", params, function (validated) {
    //         if (validated.success) {
    //             console.log(stateOfX.serverLogType.info, 'Player will performe move after extra time - ' + parseInt(stateOfX.extraTimeBank[params.channel.turnTime] || stateOfX.extraTimeBank['default']));
    //             broadcastHandler.firePlayerStateBroadcast({ channel: params.channel, channelId: params.channelId, state: stateOfX.playerState.disconnected, resetTimer: true, playerId: params.playerId });
    //             params.channel.extraTurnTimeReference = setTimeout(function () {
    //                 performCheckOrFold(params, function (performCheckOrFoldResponse) {
    //                     console.log(stateOfX.serverLogType.info, 'Player auto turn performed for tournament == validateKeySets!');
    //                     if (performCheckOrFoldResponse.success && params.action === stateOfX.move.fold) {
    //                         performAutoSitout(params, function (performAutoSitoutResponse) {
    //                             console.log(stateOfX.serverLogType.info, 'Player went to auto sitout after tournamentAutoActDisconnected !!')
    //                         });
    //                     } else {
    //                         console.log(stateOfX.serverLogType.info, 'Not sitting out player as ' + params.action + ' performed as auto action.');
    //                     }
    //                 });
    //             }, parseInt(stateOfX.extraTimeBank[params.channel.turnTime] || stateOfX.extraTimeBank['default']) * 1000)
    //         } else {
    //             console.log(stateOfX.serverLogType.error, 'Error while sending ack broadcast - ' + JSON.stringify(validated))
    //         }
    //     });
    // }
    /*======================  END  =====================*/

    /*======================  START  =====================*/
    // Check if player has time bank left in account
    // tournament

    // New
    async checkTimeBankLeft(params: any): Promise<any> {
        console.log('checkTimeBankLeftcheckTimeBankLeft ', params);
        console.log(stateOfX.serverLogType.info, 'In function checkTimeBankLeft');

        if (params.timeBankLeft > 0) {
            console.log(stateOfX.serverLogType.info, 'Available time bank for this player: ' + params.timeBankLeft);
        } else {
            console.log(stateOfX.serverLogType.info, 'No time bank is available for this player, skip further check and perform move!');
            params.timeBankFinished = true;
        }

        return params;
    }


    // Old
    // var checkTimeBankLeft = function (params, cb) {
    //     console.log('checkTimeBankLeftcheckTimeBankLeft ', params);
    //     // params.timeBankFinished = true;
    //     // cb(null, params);
    //     // return true;

    //     console.log(stateOfX.serverLogType.info, 'In function checkTimeBankLeft');
    //     if (params.timeBankLeft > 0) {
    //         console.log(stateOfX.serverLogType.info, 'Available time bank for this player: ' + params.timeBankLeft);
    //         cb(null, params)
    //     } else {
    //         console.log(stateOfX.serverLogType.info, 'No time bank is available for this player, skip further check and perform move!');
    //         params.timeBankFinished = true;
    //         cb(null, params);
    //     }
    // }
    /*======================  END  =====================*/


    /*======================  START  =====================*/
    // Start time bank for tournament player
    // tournament

    // New
    async startTimeBank(params: any): Promise<any> {
        console.log(stateOfX.serverLogType.info, 'In function startTimeBank', params);

        if (!params.timeBankFinished) {

            // Pomelo Connection
            const setTimeBankDetailsResponse = await pomelo.app.rpc.database.requestRemote.setTimeBankDetailsAsync(
                params.session,
                { playerId: params.playerId, channelId: params.channelId }
            );
            // Pomelo Connection

            console.log(
                stateOfX.serverLogType.info,
                "Response from remote for setting time bank details: " + JSON.stringify(setTimeBankDetailsResponse)
            );

            if (setTimeBankDetailsResponse.success) {
                this.broadcastHandler.startTimeBank({
                    channel: params.channel,
                    channelId: params.channelId,
                    playerId: params.playerId,
                    totalTimeBank: params.timeBankLeft,
                    timeBankLeft: params.timeBankLeft
                });

                console.log(
                    stateOfX.serverLogType.info,
                    'Start time bank broadcast fired, starting time bank for ' + params.timeBankLeft + ' seconds!'
                );

                params.isTimeBankUsed = true;

                await new Promise<void>((resolve) => {
                    params.channel.timeBankTurnTimeReference = setTimeout(() => {
                        params.timeBankFinished = true;
                        resolve();
                    }, parseInt(params.timeBankLeft) * 1000);
                });

                return params;
            } else {
                throw new Error(JSON.stringify(setTimeBankDetailsResponse));
            }
        } else {
            console.log(stateOfX.serverLogType.info, 'No time bank available for this player, skipping time bank start!');
            return params;
        }
    }


    // Old
    // var startTimeBank = function (params, cb) {
    //     // console.log(stateOfX.serverLogType.info, 'Processing for channel id: ' + params.channel.channelId);
    //     console.log(stateOfX.serverLogType.info, 'In function startTimeBank', params);
    //     // params.timeBankFinished = true;
    //     // cb(null, params);
    //     // return true;

    //     if (!params.timeBankFinished) {
    //         // Set time bank used and start time for this player
    //         pomelo.app.rpc.database.requestRemote.setTimeBankDetails(params.session, { playerId: params.playerId, channelId: params.channelId }, function (setTimeBankDetailsResponse) {
    //             console.log(stateOfX.serverLogType.info, "Response from remote for setting time bank details: " + JSON.stringify(setTimeBankDetailsResponse));
    //             if (setTimeBankDetailsResponse.success) {
    //                 broadcastHandler.startTimeBank({ channel: params.channel, channelId: params.channelId, playerId: params.playerId, totalTimeBank: params.timeBankLeft, timeBankLeft: params.timeBankLeft });
    //                 console.log(stateOfX.serverLogType.info, 'Start time bank broadcast fired, starting time bank for ' + params.timeBankLeft + ' seconds!');
    //                 params.isTimeBankUsed = true;
    //                 params.channel.timeBankTurnTimeReference = setTimeout(function () {
    //                     params.timeBankFinished = true;
    //                     cb(null, params);
    //                 }, parseInt(params.timeBankLeft) * 1000)
    //             } else {
    //                 cb({ setTimeBankDetailsResponse })
    //             }
    //         });
    //     } else {
    //         console.log(stateOfX.serverLogType.info, 'No time bank available for this player, skipping time bank start!');
    //         cb(null, params);
    //     }
    // }
    /*======================  END  =====================*/

    /*======================  START  =====================*/
    // Perform player move in case of connected player in tournament
    // tournament

    // New
    async performMove(params: any): Promise<any> {
        if (params.timeBankFinished) {

            const performCheckOrFoldResponse = await this.performCheckOrFold(params);

            if (
                performCheckOrFoldResponse &&
                performCheckOrFoldResponse.success &&
                params.action === stateOfX.move.fold
            ) {
                await this.performAutoSitout(params);
                console.log('Player went to auto sitout after tournamentAutoActConnected !!');
            } else {
                console.log('Not sitting out player as ' + params.action + ' performed as auto action.');
            }

            return params;
        } else {
            console.log(stateOfX.serverLogType.error, 'Time bank check not finished properly!');
            return {
                success: false,
                channelId: params.channelId,
                info: this.configMsg.PERFORMMOVEFAIL_CHANNELTIMERHANDLER,
                isRetry: false,
                isDisplay: false
            };
        }
    }


    // Old
    // var performMove = function (params, cb) {
    //     // console.log(stateOfX.serverLogType.info, 'Processing for channel id: ' + params.channel.channelId);
    //     if (params.timeBankFinished) {
    //         performCheckOrFold(params, function (performCheckOrFoldResponse) {
    //             console.log('Action performed: ', params.action, performCheckOrFoldResponse);
    //             // if(params.action === stateOfX.move.fold && params.playerState !== stateOfX.playerState.playing) {
    //             // // Removed as playing player after FOLD is not going on sitout because PLAYING state condition
    //             if (performCheckOrFoldResponse && performCheckOrFoldResponse.success && params.action === stateOfX.move.fold) {
    //                 performAutoSitout(params, function (performAutoSitoutResponse) {
    //                     console.log('Player went to auto sitout after tournamentAutoActConnected !!')
    //                     cb(null, params);
    //                 });
    //             } else {
    //                 console.log('Not sitting out player as ' + params.action + ' performed as auto action.');
    //                 cb(null, params);
    //             }
    //         });
    //     } else {
    //         // cb({success: false, channelId: params.channelId, info: "Time bank check not finished properly!"});
    //         cb({ success: false, channelId: params.channelId, info: this.configMsg.PERFORMMOVEFAIL_CHANNELTIMERHANDLER, isRetry: false, isDisplay: false });
    //         console.log(stateOfX.serverLogType.error, 'Time bank check not finished properly!')
    //     }
    // }
    /*======================  END  =====================*/


    /*======================  START  =====================*/
    // ### Handle when player is connected and not making any move
    // tournament

    // New
    async tournamentAutoActConnected(params: any): Promise<any> {
        console.log('In channelTimerHandler function tournamentAutoActConnected');

        const validated = await validateKeySets("Request", "connector", "autoActConnected", params);

        if (validated.success) {
            try {
                const withTimeCheck = await this.checkTimeBankLeft(params);
                const withStartedBank = await this.startTimeBank(withTimeCheck);
                await this.performMove(withStartedBank);
                console.log('Auto move in tournament from a connected player has been processed successfully !!');
            } catch (err) {
                console.log('Error while performing tournament auto move in connected state player: ', validated);
            }
        } else {
            console.log('Error while sending ack broadcast - ', validated);
        }
    }


    // Old
    // var tournamentAutoActConnected = function (params) {
    //     console.log('In channelTimerHandler function tournamentAutoActConnected');
    //     keyValidator.validateKeySets("Request", "connector", "autoActConnected", params, function (validated) {
    //         if (validated.success) {
    //             async.waterfall([
    //                 async.apply(checkTimeBankLeft, params),
    //                 startTimeBank,
    //                 performMove
    //             ], function (err, response) {
    //                 if (err) {
    //                     console.log('Error while performing tournament auto move in connected state player: ', validated)
    //                 } else {
    //                     console.log('Auto move in tournament from a connected player has been processed successfully !!')
    //                 }
    //             })

    //         } else {
    //             console.log('Error while sending ack broadcast - ', validated)
    //         }
    //     });
    // }
    /*======================  END  =====================*/


    /*======================  START  =====================*/
    // validate req keys acc to req title

    // New
    async validateRequestKeys(params: any): Promise<any> {
        console.log(stateOfX.serverLogType.info, 'Processing for channel id: ' + params.channel.channelId);
        console.log(stateOfX.serverLogType.info, 'In channelTimerHandler function validateRequestKeys');

        const validated = await validateKeySets("Request", "connector", "startTurnTimeOut", params);

        if (validated.success) {
            return params;
        } else {
            return validated;
        }
    }

    // Old
    // var validateRequestKeys = function (params, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'Processing for channel id: ' + params.channel.channelId);
    //     serverLog(stateOfX.serverLogType.info, 'In channelTimerHandler function validateRequestKeys');
    //     keyValidator.validateKeySets("Request", "connector", "startTurnTimeOut", params, function (validated) {
    //         if (validated.success) {
    //             cb(null, params);
    //         } else {
    //             cb(validated)
    //         }
    //     });
    // }
    /*======================  END  =====================*/


    /*======================  START  =====================*/
    // fetch table turn time

    // New
    async getTableTurnTIme(params: any): Promise<any> {
        console.log(stateOfX.serverLogType.info, 'Processing for channel id: ' + params.channel.channelId);
        console.log(stateOfX.serverLogType.info, 'In channelTimerHandler function getTableTurnTIme');

        // Pomelo Connection
        const getTableAttribResponse = await pomelo.app.rpc.database.tableRemote.getTableAttrib(
            params.session,
            { channelId: params.channelId, key: "turnTime" }
        );
        // Pomelo Connection

        console.log(stateOfX.serverLogType.info, "getTableAttribResponse - " + JSON.stringify(getTableAttribResponse));

        if (getTableAttribResponse.success) {
            params.turnTime = getTableAttribResponse.value;
            return params;
        } else {
            return getTableAttribResponse;
        }
    }


    // Old
    // var getTableTurnTIme = function (params, cb) {
    //     console.log(stateOfX.serverLogType.info, 'Processing for channel id: ' + params.channel.channelId);
    //     console.log(stateOfX.serverLogType.info, 'In channelTimerHandler function getTableTurnTIme');
    //     pomelo.app.rpc.database.tableRemote.getTableAttrib(params.session, { channelId: params.channelId, key: "turnTime" }, function (getTableAttribResponse) {
    //         console.log(stateOfX.serverLogType.info, "getTableAttribResponse - " + JSON.stringify(getTableAttribResponse));
    //         if (getTableAttribResponse.success) {
    //             params.turnTime = getTableAttribResponse.value;
    //             cb(null, params);
    //         } else {
    //             cb(getTableAttribResponse);
    //         }
    //     });
    // }
    /*======================  END  =====================*/

    /*======================  START  =====================*/
    // kill timers for channel

    // New

    async killChannelTimers(params: any): Promise<any> {
        console.log(stateOfX.serverLogType.info, 'Processing for channel id: ' + params.channel.channelId);
        console.log(stateOfX.serverLogType.info, 'In channelTimerHandler function killChannelTimers');

        this.killChannelLevelTimers(params);

        return params;
    }


    // Old
    // var killChannelTimers = function (params, cb) {
    //     console.log(stateOfX.serverLogType.info, 'Processing for channel id: ' + params.channel.channelId);
    //     console.log(stateOfX.serverLogType.info, 'In channelTimerHandler function killChannelTimers');
    //     killChannelLevelTimers(params);
    //     cb(null, params);
    // }
    /*======================  END  =====================*/

    /*======================  START  =====================*/
    // check for disconnected player, if done precheck - act automove-by-precheck
    // UPDATE - also for connected players

    // New
    async checkForDisconnectedPlayerAndPrecheck(params: any): Promise<any> {

        // Pomelo Connection
        const getCurrentPlayerResponse = await new Promise<any>((resolve) => {
            pomelo.app.rpc.database.tableRemote.getCurrentPlayer(
                params.session,
                { channelId: params.channelId, playerId: params.playerId, key: "state" },
                resolve
            );
        });
        // Pomelo Connection

        console.log('getCurrentPlayerResponse - ', getCurrentPlayerResponse);

        if (!getCurrentPlayerResponse.success) {
            throw getCurrentPlayerResponse;
        }

        params.player = getCurrentPlayerResponse.player;
        params.playerId = params.player.playerId;

        console.log('Current player-s precheckValue is ', params.player.precheckValue);

        if (!!params.player.precheckValue) {
            console.log('checkForDisconnectedPlayerAndPrecheck=====', params.player.precheckValue);

            if (
                (params.player.state == stateOfX.playerState.onBreak ||
                    (params.player.state == stateOfX.playerState.disconnected &&
                        params.player.previousState == stateOfX.playerState.onBreak)) &&
                params.channel.isCTEnabledTable &&
                params.player.playerScore > 0 &&
                ((params.player.playerCallTimer.status === false &&
                    params.player.callTimeGameMissed <= params.channel.ctEnabledBufferHand) ||
                    (params.player.playerCallTimer.status === true &&
                        !params.player.playerCallTimer.isCallTimeOver))
            ) {
                params.player.precheckValue = stateOfX.playerPrecheckValue.CHECK_FOLD;
            }

            const decidedMove = this.decideMoveAccToPrecheck(params.player.precheckValue, params.player.moves);

            if (!!decidedMove) {
                console.log(stateOfX.serverLogType.info, 'Current player-s decided move is ' + decidedMove);

                try {
                    const paramsWithSession = await this.getCurrentPlayerSession(params);
                    console.log(stateOfX.serverLogType.info, 'Current player-s session is ' + JSON.stringify(paramsWithSession.sessionNew));

                    params.amount = 0;
                    params.action = decidedMove;
                    params.runBy = "precheck";

                    await new Promise<void>((resolve) => setTimeout(resolve, 300));

                    const moveResponse = await this.perfromPlayerMove(params);
                    console.log(stateOfX.serverLogType.info, 'Current player-s autoMove response is ' + JSON.stringify(moveResponse));

                    if (!moveResponse.success || moveResponse.info === 'session not found') {
                        return params;
                    } else {
                        throw { info: "auto move done already." };
                    }
                } catch (err) {
                    throw err;
                }
            } else {
                console.log(stateOfX.serverLogType.info, 'Current player precheckValue is not valid anymore - ' + params.player.precheckValue + ', ' + JSON.stringify(params.player.moves));
                return params;
            }
        } else {
            console.log(stateOfX.serverLogType.info, 'Current player has not selected precheckValue - ' + params.player.precheckValue);
            return params;
        }
    }


    // Old
    // var checkForDisconnectedPlayerAndPrecheck = function (params, cb) {
    //     pomelo.app.rpc.database.tableRemote.getCurrentPlayer(params.session, { channelId: params.channelId, playerId: params.playerId, key: "state" }, function (getCurrentPlayerResponse) {
    //         console.log('getCurrentPlayerResponse - ', getCurrentPlayerResponse);
    //         if (getCurrentPlayerResponse.success) {
    //             params.player = getCurrentPlayerResponse.player;
    //             params.playerId = params.player.playerId;
    //             // params.playerState = getCurrentPlayerResponse.player.precheckValue;
    //             // params.playerState = getCurrentPlayerResponse.player.moves;
    //             // if (params.player.state === stateOfX.playerState.disconnected) {
    //             console.log('Current player-s precheckValue is ', params.player.precheckValue)
    //             if (!!params.player.precheckValue /*&& params.player.precheckValue !== stateOfX.playerPrecheckValue.NONE*/) {
    //                 console.log('checkForDisconnectedPlayerAndPrecheck=====', params.player.precheckValue)
    //                 // decide move according to precheck
    //                 if ((params.player.state == stateOfX.playerState.onBreak || (params.player.state == stateOfX.playerState.disconnected && params.player.previousState == stateOfX.playerState.onBreak)) && (params.channel.isCTEnabledTable && params.player.playerScore > 0
    //                     && (
    //                         (params.player.playerCallTimer.status === false && params.player.callTimeGameMissed <= params.channel.ctEnabledBufferHand)
    //                         || (params.player.playerCallTimer.status === true
    //                             && !(params.player.playerCallTimer.isCallTimeOver)
    //                         )
    //                     )
    //                 )) {
    //                     params.player.precheckValue = stateOfX.playerPrecheckValue.CHECK_FOLD;
    //                 }
    //                 var decidedMove = decideMoveAccToPrecheck(params.player.precheckValue, params.player.moves);
    //                 // make move according to precheck
    //                 if (!!decidedMove) {
    //                     serverLog(stateOfX.serverLogType.info, 'Current player-s decided move is ' + decidedMove)
    //                     // perform move
    //                     getCurrentPlayerSession(params, function (err, params) {
    //                         serverLog(stateOfX.serverLogType.info, 'Current player-s session is ' + JSON.stringify(err))
    //                         serverLog(stateOfX.serverLogType.info, 'Current player-s session is ' + JSON.stringify(params.sessionNew))
    //                         if (!err) {
    //                             params.amount = 0;
    //                             params.action = decidedMove;
    //                             params.runBy = "precheck";
    //                             setTimeout(function () {
    //                                 perfromPlayerMove(params, function (moveResponse) {
    //                                     serverLog(stateOfX.serverLogType.info, 'Current player-s autoMove response is ' + JSON.stringify(moveResponse))
    //                                     if (!moveResponse.success) {
    //                                         cb(null, params);
    //                                     } else if (moveResponse.success && moveResponse.info == 'session not found') {
    //                                         cb(null, params);
    //                                     } else {
    //                                         cb({ info: "auto move done already." })
    //                                     }
    //                                 })
    //                             }, 300)
    //                         }
    //                     })
    //                 } else {
    //                     serverLog(stateOfX.serverLogType.info, 'Current player precheckValue is not valid anymore - ' + params.player.precheckValue + ', ' + JSON.stringify(params.player.moves));
    //                     cb(null, params);
    //                 }
    //             } else {
    //                 serverLog(stateOfX.serverLogType.info, 'Current player has not selected precheckValue - ' + params.player.precheckValue);
    //                 cb(null, params);
    //             }
    //             ////// PLAYER PRECHECK MOVE IN CONNECTED OR DISCONNECTED STATE - BOTH
    //             // } else {
    //             //   serverLog(stateOfX.serverLogType.info, 'Current player state before performing move - ' + params.playerState);
    //             //   cb(null, params);
    //             // }
    //         } else {
    //             cb(getCurrentPlayerResponse);
    //         }
    //     });
    // }
    /*======================  End  =====================*/

    /*======================  START  =====================*/
    // set current player as disconnected after waiting for FULL turn time (the main one)

    // New
    async setCurrentPlayerDisconnected(params: any): Promise<any> {
        console.log('Processing for channel id: ', params);
        console.log(stateOfX.serverLogType.info, 'In channelTimerHandler function setCurrentPlayerDisconnected');

        let currentTurnTime = params.turnTime;

        if (
            !!params.response &&
            (
                params.response.turn.roundName === stateOfX.round.flop ||
                params.response.turn.roundName === stateOfX.round.turn ||
                params.response.turn.roundName === stateOfX.round.river
            )
        ) {
            currentTurnTime += 2;
        }

        await new Promise<void>((resolve) => {
            params.channel.turnTimeReference = setTimeout(resolve, parseInt(currentTurnTime) * 1000);
        });

        const setCurrentPlayerDisconnResponse = await new Promise<any>((resolve) => {
            pomelo.app.rpc.database.tableRemote.setCurrentPlayerDisconn(
                params.session,
                { channelId: params.channelId },
                resolve
            );
        });

        console.log(stateOfX.serverLogType.info, 'Response of player disconnected - ' + JSON.stringify(setCurrentPlayerDisconnResponse));

        if (setCurrentPlayerDisconnResponse.success) {
            params.playerId = setCurrentPlayerDisconnResponse.playerId;
            params.playerName = setCurrentPlayerDisconnResponse.playerName;
            return params;
        } else {
            return setCurrentPlayerDisconnResponse;
        }
    }

    // Old
    // var setCurrentPlayerDisconnected = function (params, cb) {
    //     console.log('Processing for channel id: ', params);
    //     console.log(stateOfX.serverLogType.info, 'In channelTimerHandler function setCurrentPlayerDisconnected');
    //     var currentTurnTime = params.turnTime;
    //     // console.error("!!!!!!!!!!!!!!!!",new Date());
    //     if (!!params.response && (params.response.turn.roundName == stateOfX.round.flop || params.response.turn.roundName == stateOfX.round.turn || params.response.turn.roundName == stateOfX.round.river)) {
    //         currentTurnTime += 2;
    //     }
    //     params.channel.turnTimeReference = setTimeout(function () {
    //         pomelo.app.rpc.database.tableRemote.setCurrentPlayerDisconn(params.session, { channelId: params.channelId }, function (setCurrentPlayerDisconnResponse) {
    //             console.log(stateOfX.serverLogType.info, 'Response of player disconnected - ' + JSON.stringify(setCurrentPlayerDisconnResponse));
    //             if (setCurrentPlayerDisconnResponse.success) {
    //                 params.playerId = setCurrentPlayerDisconnResponse.playerId;
    //                 params.playerName = setCurrentPlayerDisconnResponse.playerName;
    //                 console.error("@@@@@@@@@@@@", new Date());
    //                 cb(null, params);
    //             } else {
    //                 cb(setCurrentPlayerDisconnResponse);
    //             }
    //         });
    //     }, parseInt(currentTurnTime) * 1000);
    // }
    /*======================  End  =====================*/


    /*======================  START  =====================*/
    // fire a broadcast, so player can ack if he is online

    // New
    async fireConnectionAckBroadcast(params: any): Promise<any> {
        console.log(stateOfX.serverLogType.info, 'Processing for channel id: ' + params.channel.channelId);
        console.log(stateOfX.serverLogType.info, 'In channelTimerHandler function fireConnectionAckBroadcast');

        const record = params.channel.getMember(params.playerId) || {};

        this.broadcastHandler.fireAckBroadcastOnLogin({
            playerId: params.playerId,
            serverId: record.sid,
            data: {
                channelId: params.channelId,
                setState: true
            }
        });

        return params;
    }

    // Old
    // var fireConnectionAckBroadcast = function (params, cb) {
    //     console.log(stateOfX.serverLogType.info, 'Processing for channel id: ' + params.channel.channelId);
    //     console.log(stateOfX.serverLogType.info, 'In channelTimerHandler function fireConnectionAckBroadcast');
    //     var record = params.channel.getMember(params.playerId) || {};
    //     broadcastHandler.fireAckBroadcastOnLogin({ playerId: params.playerId, serverId: record.sid, data: { channelId: params.channelId, setState: true } });
    //     cb(null, params);
    // }
    /*======================  End  =====================*/


    /*======================  START  =====================*/
    // see after ack if player state changed

    // New
    async getPlayerCurrentState(params: any): Promise<any> {

        // Pomelo Connection
        const getCurrentPlayerResponse = await pomelo.app.rpc.database.tableRemote.getCurrentPlayer(
            params.session,
            { channelId: params.channelId, playerId: params.playerId, key: "state" }
        );
        // Pomelo Connection


        if (getCurrentPlayerResponse.success) {
            params.playerState = getCurrentPlayerResponse.player.state;
            params.player = getCurrentPlayerResponse.player;
            return params;
        } else {
            return getCurrentPlayerResponse;
        }
    }

    // Old
    // var getPlayerCurrentState = function (params, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'Processing for channel id: ' + params.channel.channelId);
    //     serverLog(stateOfX.serverLogType.info, 'In channelTimerHandler function getPlayerCurrentState');
    //     // params.channel.clientConnAckReference = setTimeout(function () {
    //     pomelo.app.rpc.database.tableRemote.getCurrentPlayer(params.session, { channelId: params.channelId, playerId: params.playerId, key: "state" }, function (getCurrentPlayerResponse) {
    //         serverLog(stateOfX.serverLogType.info, 'getCurrentPlayerResponse - ' + JSON.stringify(getCurrentPlayerResponse));
    //         if (getCurrentPlayerResponse.success) {
    //             params.playerState = getCurrentPlayerResponse.player.state;
    //             params.player = getCurrentPlayerResponse.player;
    //             serverLog(stateOfX.serverLogType.info, 'Current player state before performing move - ' + params.playerState);
    //             cb(null, params);
    //         } else {
    //             cb(getCurrentPlayerResponse);
    //         }
    //     });
    //     // }, parseInt(systemConfig.isConnectedCheckTime) * 1000);
    // }
    /*======================  END  =====================*/

    /*======================  START  =====================*/
    // Perform operation based on player current state

    // New
    async performNormalTableAction(params: any): Promise<any> {

        if (params.playerState === stateOfX.playerState.disconnected) {
            await this.autoActDisconnected(params);
        } else {
            await this.autoActConnected(params);
        }

        return params;
    }

    // Old
    // var performNormalTableAction = function (params, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'Processing for channel id: ' + params.channel.channelId);
    //     serverLog(stateOfX.serverLogType.info, 'In channelTimerHandler function performNormalTableAction');
    //     serverLog(stateOfX.serverLogType.info, 'About to perform for player state - ' + params.playerState);
    //     if (params.playerState === stateOfX.playerState.disconnected) {
    //         autoActDisconnected(params);
    //     } else {

    //         autoActConnected(params);
    //     }
    //     cb(null, params);
    // }
    /*======================  END  =====================*/


    /*======================  START  =====================*/
    // Get current player object from inmem table

    // New
    async getCurrentPlayerObject(params: any): Promise<any> {

        // Pomelo Connection
        const getCurrentPlayerResponse = await pomelo.app.rpc.database.tableRemote.getCurrentPlayer(
            params.session,
            { channelId: params.channelId, playerId: params.playerId }
        );
        // Pomelo Connection


        if (getCurrentPlayerResponse.success) {
            const player = getCurrentPlayerResponse.player;

            params.playerId = player.playerId;
            params.playerName = player.playerName;
            params.isTournamentSitout = player.tournamentData.isTournamentSitout;
            params.timeBankLeft = player.tournamentData.timeBankLeft;
            params.totalTimeBank = player.tournamentData.totalTimeBank;
            params.playerState = player.state;


            return params;
        } else {
            return getCurrentPlayerResponse;
        }
    }


    // Old
    // var getCurrentPlayerObject = function (params, cb) {
    //     console.log(stateOfX.serverLogType.info, 'Processing for channel id: ' + params.channel.channelId);
    //     console.log(stateOfX.serverLogType.info, 'In channelTimerHandler function getCurrentPlayerObject');
    //     pomelo.app.rpc.database.tableRemote.getCurrentPlayer(params.session, { channelId: params.channelId, playerId: params.playerId }, function (getCurrentPlayerResponse) {
    //         console.log(stateOfX.serverLogType.info, 'Get current player from remote response: ', getCurrentPlayerResponse)
    //         if (getCurrentPlayerResponse.success) {
    //             params.playerId = getCurrentPlayerResponse.player.playerId;
    //             params.playerName = getCurrentPlayerResponse.player.playerName;
    //             params.isTournamentSitout = getCurrentPlayerResponse.player.tournamentData.isTournamentSitout;
    //             params.timeBankLeft = getCurrentPlayerResponse.player.tournamentData.timeBankLeft;
    //             params.totalTimeBank = getCurrentPlayerResponse.player.tournamentData.totalTimeBank;
    //             params.playerState = getCurrentPlayerResponse.player.state;
    //             console.log(stateOfX.serverLogType.info, 'getCurrentPlayerObject params', params)
    //             cb(null, params);
    //         } else {
    //             cb(getCurrentPlayerResponse);
    //         }
    //     });
    // }
    /*======================  END  =====================*/

    /*======================  START  =====================*/
    // get player state from inmem table

    // New
    async getCurrentPlayerSitoutValue(params: any): Promise<any> {

        params.channel.clientConnAckReference = setTimeout(() => { }, 1000); // just to preserve reference if needed

        await new Promise(resolve => setTimeout(resolve, 1000));

        const getCurrentPlayerResponse = await pomelo.app.rpc.database.tableRemote.getCurrentPlayer(
            params.session,
            { channelId: params.channelId, playerId: params.playerId }
        );

        console.log('getCurrentPlayerResponse - getCurrentPlayerSitoutValue', getCurrentPlayerResponse);

        if (getCurrentPlayerResponse.success) {
            params.isTournamentSitout = getCurrentPlayerResponse.player.tournamentData.isTournamentSitout;
            params.playerState = getCurrentPlayerResponse.player.state;
        } else {
            console.log("Get player state from key failed - ", getCurrentPlayerResponse);
        }

        return params;
    }

    // Old
    // var getCurrentPlayerSitoutValue = function (params, cb) {
    //     console.log(stateOfX.serverLogType.info, 'Processing for channel id: ' + params.channel.channelId);
    //     console.log(stateOfX.serverLogType.info, 'In channelTimerHandler function getCurrentPlayerSitoutValue');
    //     params.channel.clientConnAckReference = setTimeout(function () {
    //         pomelo.app.rpc.database.tableRemote.getCurrentPlayer(params.session, { channelId: params.channelId, playerId: params.playerId }, function (getCurrentPlayerResponse) {
    //             console.log('getCurrentPlayerResponse - getCurrentPlayerSitoutValue', getCurrentPlayerResponse);
    //             if (getCurrentPlayerResponse.success) {
    //                 params.isTournamentSitout = getCurrentPlayerResponse.player.tournamentData.isTournamentSitout;
    //                 params.playerState = getCurrentPlayerResponse.player.state;
    //             } else {
    //                 console.log("Get player state from key failed - ", getCurrentPlayerResponse);
    //             }
    //             cb(null, params);
    //         });
    //     }, 1000);
    // }
    /*======================  END  =====================*/

    /*======================  START  =====================*/
    // Perform operation based on player current state
    // tournament

    // New
    async performTournamentTableAction(params: any): Promise<any> {

        if (params.isTournamentSitout) {
            await this.tournamentAutoActsitout(params);
        } else if (params.playerState === stateOfX.playerState.disconnected) {
            await this.tournamentAutoActDisconnected(params);
        } else {
            await this.tournamentAutoActConnected(params);
        }

        return params;
    }

    // Old
    // var performTournamentTableAction = function (params, cb) {
    //     console.log('Processing for channel id: ', params);
    //     console.log('In channelTimerHandler function performTournamentTableAction');
    //     console.log('1. Player state - ' + params.playerState + ' and sitout - ' + params.isTournamentSitout);
    //     if (params.isTournamentSitout) {
    //         tournamentAutoActsitout(params);
    //     } else if (params.playerState === stateOfX.playerState.disconnected) {
    //         tournamentAutoActDisconnected(params);
    //     } else {
    //         tournamentAutoActConnected(params);
    //     }
    //     cb(null, params);
    // }
    /*======================  END  =====================*/

    /*======================  START  =====================*/
    // Perform operation based on player current state
    // tournament

    // New
    async performTournamentSitout(params: any): Promise<any> {

        if (params.isTournamentSitout) {
            await this.tournamentAutoActsitout(params);
        } else {
            await this.tournamentAutoActConnected(params);
        }

        return params;
    }

    // Old
    // var performTournamentSitout = function (params, cb) {
    //     serverLog('Processing for channel id: ', params.channel.channelId);
    //     serverLog('In channelTimerHandler function performTournamentSitout');
    //     serverLog('Player state - ', params.playerState, ' and sitout - ', params.isTournamentSitout);
    //     if (params.isTournamentSitout) {
    //         tournamentAutoActsitout(params);
    //     } else {
    //         serverLog('The player might have resume in game!');
    //         tournamentAutoActConnected(params);
    //     }
    //     cb(null, params);
    // }
    /*======================  END  =====================*/

    /*======================  START  =====================*/
    // Perform actions for player in sitout mode
    // tournament

    // New
    async performSitoutAction(params: any): Promise<any> {

        try {
            await this.killChannelTimers(params);
            await this.fireConnectionAckBroadcast(params);
            await this.getCurrentPlayerSitoutValue(params);
            await this.performTournamentSitout(params);

            return params;
        } catch (err) {
            console.log('========== performSitoutAction failed =========> ', err);
            throw err;
        }
    }


    // Old
    // var performSitoutAction = function (params, cb) {
    //     console.log('Processing for channel id: ', params.channel.channelId);
    //     console.log('In channelTimerHandler function performSitoutAction');
    //     async.waterfall([
    //         async.apply(killChannelTimers, params),
    //         fireConnectionAckBroadcast,
    //         getCurrentPlayerSitoutValue,
    //         performTournamentSitout
    //     ], function (err, params) {
    //         if (err) {
    //             console.log('========== performSitoutAction failed =========> ', err)
    //             cb(err);
    //         } else {
    //             console.log('========== performSitoutAction success =========', params)
    //             cb(null, params);
    //         }
    //     });
    // }
    /*======================  END  =====================*/


    /*======================  START  =====================*/
    // Perform action for players in normal mode
    // tournament

    // New
    async performNoSitoutAction(params: any): Promise<any> {

        if (params.isTournamentSitout) {
            console.log(stateOfX.serverLogType.info, "Player is in sitout mode so skipping auto sitout turn handling!");
            return params;
        }

        try {
            await this.killChannelTimers(params);
            await this.getTableTurnTIme(params);
            await this.checkForDisconnectedPlayerAndPrecheck(params);
            await this.setCurrentPlayerDisconnected(params);
            await this.fireConnectionAckBroadcast(params);
            await this.getCurrentPlayerSitoutValue(params);
            await this.performTournamentTableAction(params);

            console.log(stateOfX.serverLogType.info, 'response in performNoSitoutAction - ' + JSON.stringify(_.keys(params)));
        } catch (err) {
            console.log(stateOfX.serverLogType.error, 'err in performNoSitoutAction - ' + JSON.stringify(err));
        }
    }


    // Old
    // var performNoSitoutAction = function (params, cb) {
    //     console.log("inside performNoSitoutAction", params);
    //     console.log(stateOfX.serverLogType.info, 'Processing for channel id: ' + params.channel.channelId);
    //     console.log(stateOfX.serverLogType.info, 'In channelTimerHandler function performNoSitoutAction');
    //     if (params.isTournamentSitout) {
    //         console.log(stateOfX.serverLogType.info, "Player is in sitout mode so skipping auto sitout turn handling!");
    //         cb(null, params);
    //     } else {
    //         async.waterfall([
    //             async.apply(killChannelTimers, params),
    //             getTableTurnTIme,
    //             checkForDisconnectedPlayerAndPrecheck,
    //             setCurrentPlayerDisconnected,
    //             fireConnectionAckBroadcast,
    //             getCurrentPlayerSitoutValue,
    //             performTournamentTableAction
    //         ], function (err, response) {
    //             if (err) {
    //                 console.log(stateOfX.serverLogType.error, 'err in performNoSitoutAction - ' + JSON.stringify(err));
    //             } else {
    //                 console.log(stateOfX.serverLogType.info, 'response in performNoSitoutAction - ' + JSON.stringify(_.keys(response)));
    //             }
    //         });
    //     }
    // }
    /*======================  END  =====================*/


    /*======================  START  =====================*/
    // fetch inmem table

    // New
    async getTable(params: { channelId: string; table?: any }): Promise<any> {

        // Pomelo Connection
        const res = await pomelo.app.rpc.database.tableRemote.getTable(
            '',
            { channelId: params.channelId }
        );
        // Pomelo Connection

        if (res.success) {
            params.table = res.table;
            return params;
        } else {
            return res;
        }
    }

    // Old
    // var getTable = function (params, cb) {
    //     console.log(stateOfX.serverLogType.info, 'In channelTimerHandler in getTable');
    //     pomelo.app.rpc.database.tableRemote.getTable('', { channelId: params.channelId }, function (res) {
    //         if (res.success) {
    //             params.table = res.table;
    //             cb(null, params);
    //         } else {
    //             cb(res);
    //         }
    //     })
    // }
    /*======================  END  =====================*/

    /*======================  END  =====================*/
    // fire player removed broadcast on channel with antibanking data

    // New
    async fireRemoveBlindMissedPlayersBroadCast(params: any, player: any): Promise<any> {
        const filter = {
            playerId: player.playerId,
            channelId: player.channelId
        };

        let isAntiBanking = false;
        let timeToNumber = -1;
        let amount = -1;

        try {
            const response = await this.db.getAntiBanking(filter);

            if (response) {
                timeToNumber = Number(systemConfig.expireAntiBankingSeconds) + Number(systemConfig.antiBankingBuffer) - ((Number(new Date()) - Number(response.createdAt)) / 1000);
                if (timeToNumber > 0 && response.amount > 0) {
                    isAntiBanking = true;
                    amount = response.amount;
                }
            }

            this.broadcastHandler.sendMessageToUser({
                playerId: player.playerId,
                serverId: player.serverId,
                msg: {
                    playerId: player.playerId,
                    channelId: params.channelId,
                    isAntiBanking,
                    timeRemains: timeToNumber,
                    amount,
                    event: stateOfX.recordChange.playerLeaveTable
                },
                route: stateOfX.broadcasts.antiBankingUpdatedData
            });

        } catch (err) {
            // In case of DB error, still broadcast with default/failure values
            this.broadcastHandler.sendMessageToUser({
                playerId: player.playerId,
                serverId: player.serverId,
                msg: {
                    playerId: player.playerId,
                    channelId: params.channelId,
                    isAntiBanking: false,
                    timeRemains: -1,
                    amount: -1,
                    event: stateOfX.recordChange.playerLeaveTable
                },
                route: stateOfX.broadcasts.antiBankingUpdatedData
            });
        }
    };


    // Old
    // var fireRemoveBlindMissedPlayersBroadCast = function (params, player) {
    //     var filter = {};
    //     filter.playerId = player.playerId;
    //     filter.channelId = player.channelId;
    //     //  console.error("!!!!!!!!!!!!!!!!!!!1",filter);
    //     db.getAntiBanking(filter, function (err, response) {
    //         if (!err && response) {
    //             var isAntiBanking = false;
    //             if (response != null) {
    //                 var timeToNumber = parseInt(systemConfig.expireAntiBankingSeconds) + parseInt(systemConfig.antiBankingBuffer) - (Number(new Date()) - Number(response.createdAt)) / 1000;
    //                 if (timeToNumber > 0 && response.amount > 0) {
    //                     isAntiBanking = true;
    //                 }

    //             }
    //             broadcastHandler.sendMessageToUser({ playerId: player.playerId, serverId: player.serverId, msg: { playerId: player.playerId, channelId: params.channelId, isAntiBanking: isAntiBanking, timeRemains: timeToNumber, amount: response.amount, event: stateOfX.recordChange.playerLeaveTable }, route: stateOfX.broadcasts.antiBankingUpdatedData });
    //             //console.error(isAntiBanking,"!!!!!!!@@@@@@@@@@@@Anti banking",timeToNumber);
    //         } else {
    //             broadcastHandler.sendMessageToUser({ playerId: player.playerId, serverId: player.serverId, msg: { playerId: player.playerId, channelId: params.channelId, isAntiBanking: isAntiBanking, timeRemains: -1, amount: -1, event: stateOfX.recordChange.playerLeaveTable }, route: stateOfX.broadcasts.antiBankingUpdatedData });
    //             //console.error(isAntiBanking,"!!!!!!!@@@@@@@@@@@@Anti banking",timeToNumber);
    //         }
    //     })
    // }
    /*======================  END  =====================*/


    /*======================  START  =====================*/
    // get user session from db

    // New
    async getPlayerSessionServer(
        player: any,
        params: any
    ): Promise<any> {
        // serverLog(stateOfX.serverLogType.info, 'In channelTimerHandler in getPlayerSessionServer');
        // const res = await pomelo.app.rpc.database.dbRemote.findUserSessionInDB('', player.playerId);
        // serverLog(stateOfX.serverLogType.info, 'response of findUserSessionInDB' + JSON.stringify(res));
        // if (res.success && !!res.result.serverId) {
        player.serverId = 'connector-server-1';
        // } else {
        //     player.serverId = undefined;
        // }
        return [player, params];
    }

    // Old
    // var getPlayerSessionServer = function (player, params, cb) {
    //     // serverLog(stateOfX.serverLogType.info, 'In channelTimerHandler in getPlayerSessionServer');
    //     // pomelo.app.rpc.database.dbRemote.findUserSessionInDB('', player.playerId, function (res) {
    //     //   serverLog(stateOfX.serverLogType.info, 'response of findUserSessionInDB' + JSON.stringify(res));
    //     //   //console.error(res.result);
    //     //   if (res.success && !!res.result.serverId) {
    //     player.serverId = 'connector-server-1';
    //     cb(null, player, params);
    //     //   } else {
    //     //     cb(null, player, params);
    //     //   }
    //     // })
    // }
    /*======================  END  =====================*/

    /*======================  START  =====================*/
    // get hit for autoLeave from connector
    // WHY - because leave starts from room but redirects by connector WITH PLAYER SESSION OBJECT SETTINGS

    // New
    async getHitLeave(player: any, params: any): Promise<any> {

        if (player.serverId) {

            // Pomelo Connection
            const hitLeaveResponse = await pomelo.app.sysrpc['room'].msgRemote.forwardMessage(
                { forceFrontendId: "room-server-1" },
                {
                    body: {
                        playerId: player.playerId,
                        playerName: player.playerName,
                        isStandup: true,
                        channelId: params.channelId,
                        isRequested: false,
                        origin: 'tableIdleTimer'
                    },
                    route: "room.channelHandler.leaveTable"
                },
                this.sessionExport(params.session)
            );
            // Pomelo Connection

            this.fireRemoveBlindMissedPlayersBroadCast(params, player);

            return [player, params];
        } else {
            return [player, params];
        }
    }


    // Old
    // var getHitLeave = function (player, params, cb) {
    //     console.log('In channelTimerHandler in getHitLeave ', player, params);
    //     serverLog(stateOfX.serverLogType.info, 'In channelTimerHandler in getHitLeave');
    //     console.log("rs3en45")
    //     if (player.serverId) {
    //         pomelo.app.sysrpc['room'].msgRemote.forwardMessage(
    //             { forceFrontendId: "room-server-1" },
    //             {
    //                 body: { playerId: player.playerId, playerName: player.playerName, isStandup: true, channelId: params.channelId, isRequested: false, origin: 'tableIdleTimer' },
    //                 route: "room.channelHandler.leaveTable"
    //             },
    //             sessionExport(params.session), function (err, hitLeaveResponse) {
    //                 console.log("room.channelHandler.leaveTable res is >", hitLeaveResponse);
    //                 serverLog(stateOfX.serverLogType.info, 'response of rpc-hitLeave' + JSON.stringify(hitLeaveResponse));
    //                 fireRemoveBlindMissedPlayersBroadCast(params, player);
    //                 cb(null, player, params);

    //             }
    //         );

    //         // pomelo.app.rpc.connector.sessionRemote.hitLeave({ frontendId: player.serverId }, { playerId: player.playerId, playerName: player.playerName, isStandup: true, channelId: params.channelId, isRequested: false, origin: 'tableIdleTimer' }, function (hitLeaveResponse) {
    //         //   serverLog(stateOfX.serverLogType.info, 'response of rpc-hitLeave' + JSON.stringify(hitLeaveResponse));
    //         //   fireRemoveBlindMissedPlayersBroadCast(params, player);
    //         //   cb(null, player, params);
    //         // })
    //     } else {
    //         serverLog(stateOfX.serverLogType.info, 'No serverId found');
    //         cb(null, player, params);
    //     }
    // }
    /*======================  END  =====================*/


    /*======================  START  =====================*/
    // run autoLeave for every sitout player
    // after game not started from some time - 2 minutes

    // New
    async forEverySitoutPlayer(params: any): Promise<any> {
        const sitoutPlayers = _.where(params.table.players, { state: stateOfX.playerState.onBreak });

        if (sitoutPlayers.length <= 0) {
            return params;
        }

        for (const player of sitoutPlayers) {
            await this.getPlayerSessionServer(player, params);
            await this.getHitLeave(player, params);
        }

        return params;
    };

    // Old
    // var forEverySitoutPlayer = function (params, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'In channelTimerHandler in forEverySitoutPlayer');
    //     var sitoutPlayers = _.where(params.table.players, { state: stateOfX.playerState.onBreak });
    //     console.log('forEverySitoutPlayer ', sitoutPlayers);
    //     if (sitoutPlayers.length <= 0) {
    //         cb(null, params); return;
    //     }
    //     async.each(sitoutPlayers, function (player, ecb) {
    //         async.waterfall([
    //             async.apply(getPlayerSessionServer, player, params),
    //             getHitLeave
    //         ], function (err, player, response) {
    //             ecb(err, player, response)
    //         })
    //     }, function (err, player, params) {
    //         cb(null, params);
    //     })
    // }
    /*======================  END  =====================*/


    /*======================  START  =====================*/
    // ### Start timeout to handle events after
    // after turn broadcast fired

    // New
    async startTurnTimeOut(params: any): Promise<any> {

        if (!systemConfig.playerAutoMoveRequired) {
            console.log(stateOfX.serverLogType.warning, 'Player auto move feature disabled from system configuration.');

        }

        const channel = pomelo.app.get('channelService').getChannel(params.channelId, false);
        params.channel = channel;
        params.timeBankFinished = false;
        params.isTimeBankUsed = false;
        try {
            if (channel.channelType === stateOfX.gameType.normal) {
                params = await this.validateRequestKeys(params);
                params = await this.getTableTurnTIme(params);
                params = await this.killChannelTimers(params);
                params = await this.checkForDisconnectedPlayerAndPrecheck(params);
                params = await this.setCurrentPlayerDisconnected(params);
                params = await this.fireConnectionAckBroadcast(params);
                params = await this.getPlayerCurrentState(params);
                params = await this.getCurrentPlayerSession(params);
                await this.performNormalTableAction(params);
            } else {
                params = await this.validateRequestKeys(params);
                params = await this.getCurrentPlayerObject(params);
                await this.performNoSitoutAction(params);
                await this.performSitoutAction(params);
            }
        } catch (err) {
            console.log(stateOfX.serverLogType.error, 'Error in startTurnTimeOut: ' + JSON.stringify(err) + '\nParams keys - ' + JSON.stringify(_.keys(params)));
        }
    };


    // Old
    // channelTimerHandler.startTurnTimeOut = function (params) {
    //     console.log("channel fpund channelTimerHandler.startTurnTimeOut params", params)
    //     serverLog(stateOfX.serverLogType.info, 'In channelTimerHandler function startTurnTimeOut');
    //     if (systemConfig.playerAutoMoveRequired) {
    //         var channel = pomelo.app.get('channelService').getChannel(params.channelId, false);
    //         console.log("channel fpund channelTimerHandler.startTurnTimeOut ", channel)
    //         params.channel = channel;
    //         params.timeBankFinished = false;
    //         params.isTimeBankUsed = false;
    //         console.log("AUTO TURN STARTED FOR ", channel.channelType, " TABLE !");
    //         if (channel.channelType === stateOfX.gameType.normal) {
    //             async.waterfall([
    //                 async.apply(validateRequestKeys, params),
    //                 getTableTurnTIme,
    //                 killChannelTimers,
    //                 checkForDisconnectedPlayerAndPrecheck,
    //                 setCurrentPlayerDisconnected,
    //                 fireConnectionAckBroadcast,
    //                 getPlayerCurrentState,
    //                 getCurrentPlayerSession,
    //                 performNormalTableAction
    //             ], function (err, response) {
    //                 serverLog(stateOfX.serverLogType.error, 'Error startimeout ' + JSON.stringify(err) + '\nResponse keys - ' + JSON.stringify(_.keys(response)));
    //             });
    //         } else {
    //             async.waterfall([
    //                 async.apply(validateRequestKeys, params),
    //                 getCurrentPlayerObject,
    //                 performNoSitoutAction,
    //                 performSitoutAction
    //             ], function (err, response) {
    //                 console.log(stateOfX.serverLogType.error, 'Error startimeout ' + JSON.stringify(err) + '\nResponse keys - ' + JSON.stringify(_.keys(response)));
    //             });
    //         }
    //     } else {
    //         serverLog(stateOfX.serverLogType.warning, 'Player auto move feature disable from system configuration.');
    //     }
    // }
    /*======================  END  =====================*/

    /*======================  START  =====================*/
    // timer for idle table
    // if no game starts in a time
    // remove sitout players

    // New
    async tableIdleTimer(params: any) {

        params.channel.idleTableTimer = setTimeout(async () => {
            try {
                params = await this.getTable(params);
                await this.forEverySitoutPlayer(params);
            } catch (err) {
                console.log(stateOfX.serverLogType.info, 'Error in tableIdleTimer: ' + JSON.stringify(err));
            }
        }, systemConfig.tableIdleTimerSeconds * 1000);
    };

    // Old
    // channelTimerHandler.tableIdleTimer = function (params) {
    //     // console.log('tableIdleTimer', params.table.players);
    //     // check for conditions, if any
    //     serverLog(stateOfX.serverLogType.info, 'In channelTimerHandler function tableIdleTimer');
    //     serverLog(stateOfX.serverLogType.info, 'setting timer for idle table');
    //     params.channel.idleTableTimer = setTimeout(function () {
    //         async.waterfall([
    //             async.apply(function (params, cb) { cb(null, params) }, params),
    //             getTable,
    //             forEverySitoutPlayer
    //         ], function (err, response) {
    //             serverLog(stateOfX.serverLogType.info, 'err and response of tableIdleTimer');
    //         })
    //     }, systemConfig.tableIdleTimerSeconds * 1000);
    // }
    /*======================  END  =====================*/

    /*======================  START  =====================*/
    // kill table idle timer
    // some game has been started

    // New
    killTableIdleTimer(params: any): void {
        if (params.channel.idleTableTimer) {
            console.log(stateOfX.serverLogType.info, 'killed idleTableTimer for channelId ' + params.channel.channelId);
            clearTimeout(params.channel.idleTableTimer);
            params.channel.idleTableTimer = null;
        }
    }

    // Old
    // channelTimerHandler.killTableIdleTimer = function (params) {
    //     serverLog(stateOfX.serverLogType.info, 'In channelTimerHandler function killTableIdleTimer');
    //     if (params.channel.idleTableTimer) {
    //         serverLog(stateOfX.serverLogType.info, 'killed idleTableTimer for channelId ' + params.channel.channelId);
    //         clearTimeout(params.channel.idleTableTimer);
    //         params.channel.idleTableTimer = null;
    //     }
    // }
    /*======================  END  =====================*/

    /*======================  START  =====================*/
    sessionExport(session) {
        var EXPORTED_SESSION_FIELDS = ['id', 'frontendId', 'uid', 'settings']
        var res = {};
        this.clone(session, res, EXPORTED_SESSION_FIELDS);
        return res;
    };

    /**
     * clone object keys
     * @method clone
     * @param  {Object} src      source of keys
     * @param  {Object} dest     destination for keys
     * @param  {Array}  includes list of keys - array of Strings
     */
    clone(src, dest, includes) {
        var f;
        for (var i = 0, l = includes.length; i < l; i++) {
            f = includes[i];
            dest[f] = src[f];
        }
    };
    /*======================  END  =====================*/

    /*======================  START  =====================*/
    // Schedule timer to standup player after a time crossed for reserved seat - 10 seconds

    // New
    async vacantReserveSeat(params: any): Promise<any> {

        const currentTime = new Date();
        let isStandup = true;

        // Clear existing job if any
        if (params.channel.reserveSeatTimeReference[params.playerId]) {
            params.channel.reserveSeatTimeReference[params.playerId].cancel();
            params.channel.reserveSeatTimeReference[params.playerId] = null;
        }

        // If needed, logic to update isStandup can go here

        const scheduleTime = new Date(currentTime.getTime() + Number(systemConfig.vacantReserveSeatTime) * 1000);

        params.channel.reserveSeatTimeReference[params.playerId] = this.schedule.scheduleJob(scheduleTime, async function () {

            // Pomelo Connection
            const forwardResponse = await pomelo.app.sysrpc['room'].msgRemote.forwardMessage(
                { forceFrontendId: pomelo.app.serverId },
                {
                    body: {
                        playerId: params.playerId,
                        isStandup: isStandup,
                        channelId: params.channelId,
                        isRequested: false,
                        playerName: params.playerName,
                        origin: 'vacantSeat'
                    },
                    route: "room.channelHandler.leaveTable"
                },
                this.sessionExport(params.session)
            );
            // Pomelo Connection

            const infoMessage = {
                playerId: params.playerId,
                buttonCode: 1,
                serverId: params.session.frontendId,
                channelId: params.channelId,
                heading: "Standup",
                info: `You did not act in time (${systemConfig.vacantReserveSeatTime} seconds), seat in ${params.channel.channelName} is no longer reserved.`
            };

            if (!isStandup) {
                await this.db.removePlayerJoin({ channelId: params.channelId, playerId: params.playerId });
            }

            setTimeout(() => {
                this.broadcastHandler.fireInfoBroadcastToPlayer(infoMessage);
            }, 100);
        });
    };


    // Old
    // channelTimerHandler.vacantReserveSeat = function (params, cb) {
    //     console.error("reserver sit fired");
    //     serverLog(stateOfX.serverLogType.info, 'Processing for channel id: ' + params.channel.channelId);
    //     serverLog(stateOfX.serverLogType.info, 'In channelTimerHandler function vacantReserveSeat');
    //     var currentTime = new Date();
    //     var scheduleTime = null;
    //     if (params.channel.reserveSeatTimeReference[params.playerId]) {
    //         params.channel.reserveSeatTimeReference[params.playerId].cancel();
    //         params.channel.reserveSeatTimeReference[params.playerId] = null;
    //     }

    //     var isStandup = true;
    //     // imdb.playerJoinedRecord({ playerId: params.playerId, channelId: params.channelId }, function (err, res) {
    //     // console.log('vacantReserveSeat', res);
    //     // if (!!res) {
    //     //   if (res[0].alreadyjoin == false) {
    //     //     isStandup = false;
    //     //   }
    //     // }

    //     // if (!!params.isCTEnabledTable && params.player.playerScore > 0) {
    //     //   isStandup = false;
    //     // }
    //     console.log('vacantReserveSeat 1', isStandup);
    //     scheduleTime = currentTime.setSeconds(currentTime.getSeconds() + parseInt(systemConfig.vacantReserveSeatTime))
    //     params.channel.reserveSeatTimeReference[params.playerId] = schedule.scheduleJob(currentTime, function () {
    //         serverLog(stateOfX.serverLogType.info, 'Player will sitout auto now');
    //         console.log("rs3en45")

    //         pomelo.app.sysrpc['room'].msgRemote.forwardMessage(
    //             { forceFrontendId: pomelo.app.serverId },
    //             {
    //                 body: { playerId: params.playerId, isStandup: isStandup, channelId: params.channelId, isRequested: false, playerName: params.playerName, origin: 'vacantSeat' },
    //                 route: "room.channelHandler.leaveTable"
    //             },
    //             sessionExport(params.session), function (...arg) {
    //                 console.log('pomelo.app.sysrpc[room].msgRemote', ...arg);
    //                 if (isStandup == false) {
    //                     imdb.removePlayerJoin({ channelId: params.channelId, playerId: params.playerId }, function (joinerr, joinresponse) {
    //                         setTimeout(function () {
    //                             broadcastHandler.fireInfoBroadcastToPlayer({ playerId: params.playerId, buttonCode: 1, serverId: params.session.frontendId, channelId: params.channelId, heading: "Standup", info: "You did not act in time (" + systemConfig.vacantReserveSeatTime + " seconds), seat in " + params.channel.channelName + " is no longer reserved." });
    //                         }, 100)
    //                     })
    //                 } else {
    //                     setTimeout(function () {
    //                         broadcastHandler.fireInfoBroadcastToPlayer({ playerId: params.playerId, buttonCode: 1, serverId: params.session.frontendId, channelId: params.channelId, heading: "Standup", info: "You did not act in time (" + systemConfig.vacantReserveSeatTime + " seconds), seat in " + params.channel.channelName + " is no longer reserved." });
    //                     }, 100)
    //                 }
    //             });
    //     });
    //     // });
    // }
    /*======================  END  =====================*/

    /*======================  START  =====================*/
    // Schedule timer to leave player from room is spectator time crossed - 10 minutes

    // New
    async kickPlayerToLobby(params: any): Promise<any> {

        const currentTime = new Date();
        let scheduleTime = 0;

        if (params.channel.kickPlayerToLobby[params.playerId]) {
            params.channel.kickPlayerToLobby[params.playerId].cancel();
            params.channel.kickPlayerToLobby[params.playerId] = null;
        }

        if (!params.data) {
            scheduleTime = currentTime.setSeconds(currentTime.getSeconds() + Number(systemConfig.playerSpectateLimit));
        } else {
            if (params.data.isStandup && (params.data.origin === 'tableIdleTimer' || params.data.origin === 'idlePlayer')) {
                console.log("inside if params.data.isStandup && params.data.origin");
                scheduleTime = currentTime.setSeconds(currentTime.getSeconds() + 1);
            } else {
                scheduleTime = currentTime.setSeconds(currentTime.getSeconds() + Number(systemConfig.playerSpectateLimit));
            }
        }

        params.channel.kickPlayerToLobby[params.playerId] = this.schedule.scheduleJob(scheduleTime, async () => {
            try {

                // Pomelo Connection
                const hitLeaveResponse = await pomelo.app.sysrpc['room'].msgRemote.forwardMessage(
                    { forceFrontendId: "room-server-1" },
                    {
                        body: {
                            playerId: params.playerId,
                            playerName: params.playerName,
                            isStandup: false,
                            channelId: params.channelId,
                            isRequested: false,
                            origin: params.data?.origin || 'kickToLobby'
                        },
                        route: "room.channelHandler.leaveTable"
                    },
                    this.sessionExport(params.session)
                );
                // Pomelo Connection

            } catch (error) {
                console.error("Error in kickPlayerToLobby forwardMessage:", error);
            }

            const playerObject = {
                playerId: params.playerId,
                channelId: params.channelId
            };
            // You can optionally use getPlayerSessionServer here if needed
        });
    };

    // Old
    // channelTimerHandler.kickPlayerToLobby(params) {
    //         var currentTime = new Date();
    //         var scheduleTime = 0;
    //         if (params.channel.kickPlayerToLobby[params.playerId]) {
    //             params.channel.kickPlayerToLobby[params.playerId].cancel();
    //             params.channel.kickPlayerToLobby[params.playerId] = null;
    //         }
    //         if (!params.data) {
    //             scheduleTime = currentTime.setSeconds(currentTime.getSeconds() + Number(systemConfig.playerSpectateLimit))
    //         } else {
    //             if (params.data && params.data.isStandup && (params.data.origin == 'tableIdleTimer' || params.data.origin == 'idlePlayer')) {
    //                 console.log("inside iff params.data.isStandup && params.data.origin",)
    //                 scheduleTime = currentTime.setSeconds(currentTime.getSeconds() + 1)
    //             } else {
    //                 scheduleTime = currentTime.setSeconds(currentTime.getSeconds() + Number(systemConfig.playerSpectateLimit))
    //             }
    //         }
    //         params.channel.kickPlayerToLobby[params.playerId] = schedule.scheduleJob(scheduleTime, function () {


    //             // Pomelo Connection
    //             pomelo.app.sysrpc['room'].msgRemote.forwardMessage(
    //                 { forceFrontendId: "room-server-1" },
    //                 {
    //                     body: { playerId: params.playerId, playerName: params.playerName, isStandup: false, channelId: params.channelId, isRequested: false, origin: params.data && params.data.origin ? params.data.origin : 'kickToLobby' },
    //                     route: "room.channelHandler.leaveTable"
    //                 },
    //                 this.sessionExport(params.session), function (err, hitLeaveResponse) {
    //                     console.log("room.channelHandler.leaveTable res is >", hitLeaveResponse);
    //                 }
    //             );
    //             // Pomelo Connection

    //             // pomelo.app.rpc.connector.sessionRemote.hitLeave(params.session, { playerId: params.playerId, playerName: params.playerName, isStandup: false, channelId: params.channelId, isRequested: false, origin: 'kickToLobby' }, function () {
    //             //   // broadcastHandler.fireInfoBroadcastToPlayer({self: params.self, playerId: params.playerId, buttonCode: 1, channelId: params.channelId, heading: "Standup", info: "You did not act in time (" + systemConfig.playerSpectateLimit + " seconds), seat in " + params.channel.channelName + " is no longer reserved."})
    //             // });
    //             var playerObject = {};
    //             playerObject.playerId = params.playerId;
    //             playerObject.channelId = params.channelId;
    //             // getPlayerSessionServer(playerObject,params,function(cbResult){
    //             //   console.error(cbResult);
    //             // })
    //         });
    // }
    /*======================  END  =====================*/

    /*======================  START  =====================*/
    // Kill existing timer for reserve seat

    // New
    killReserveSeatReferennce(params: any): void {
        console.error("reserver kill sit fired");

        if (!params.channel) {
            this.channelTimerHandler.killKickToLobbyTimer(params);
            return;
        }

        if (
            params.channel &&
            params.channel.channelType === stateOfX.gameType.normal &&
            !!params.channel.reserveSeatTimeReference[params.playerId]
        ) {
            console.log(
                stateOfX.serverLogType.info,
                'Reserve seat timer exists for this player - ' + params.playerId + ', killing schedule!'
            );
            params.channel.reserveSeatTimeReference[params.playerId].cancel();
            params.channel.reserveSeatTimeReference[params.playerId] = null;
        } else {
            console.log(
                stateOfX.serverLogType.info,
                'No reserve seat timer exists for player id - ' + params.playerId
            );
        }

        // Also kill timer to kick player on lobby if player took a seat
        this.channelTimerHandler.killKickToLobbyTimer(params);
    };

    // Old
    // channelTimerHandler.killReserveSeatReferennce = function (params, cb) {
    //         console.error("reserver kill sit fired");
    //         if (!params.channel) {
    //             console.error("if u get a error i m responsible", params);
    //             channelTimerHandler.killKickToLobbyTimer(params);
    //             //return;
    //         }
    //         //console.error("@@@@@@@@@@@@@@@@@@@@@@@@@@!!!!!!!!!!!!!!!!!!@@@@@@@@@@@@@@@@@@@@@###############",params);
    //         if (params.channel && params.channel.channelType === stateOfX.gameType.normal && !!params.channel.reserveSeatTimeReference[params.playerId]) {
    //             serverLog(stateOfX.serverLogType.info, 'Reserve seat timer exists for this player - ' + params.playerId + ', killing schedule!')
    //             params.channel.reserveSeatTimeReference[params.playerId].cancel();
    //             params.channel.reserveSeatTimeReference[params.playerId] = null;
    //         } else {
    //             serverLog(stateOfX.serverLogType.info, 'No reserve seat timer exists for player id - ' + params.playerId);
    //         }
    //         channelTimerHandler.killKickToLobbyTimer(params);

    //         // Also kill timer to kick player on lobby if player taken a seat
    // }
    /*======================  END  =====================*/

    /*======================  START  =====================*/
    // Kill existing timer for any player to kick on lobby

    // New
    killKickToLobbyTimer(params: any): void {
        console.log("kill kick to lobby fired", params);

        if (
            params.channel &&
            params.channel.channelType === stateOfX.gameType.normal &&
            !!params.channel.kickPlayerToLobby[params.playerId]
        ) {
            console.log(
                stateOfX.serverLogType.info,
                'Kick to lobby timer exists for this player - ' + params.playerId + ', killing schedule!'
            );
            params.channel.kickPlayerToLobby[params.playerId].cancel();
            params.channel.kickPlayerToLobby[params.playerId] = null;
        } else {
            console.log(
                stateOfX.serverLogType.info,
                'No Kick to lobby timer exists for player id - ' + params.playerId
            );
        }
    };

    // Old
    // channelTimerHandler.killKickToLobbyTimer = function (params, cb) {
    //         console.log("kill kick to loby fired", params);
    //         if (params.channel && params.channel.channelType === stateOfX.gameType.normal && !!params.channel.kickPlayerToLobby[params.playerId]) {
    //             serverLog(stateOfX.serverLogType.info, 'Kick to lobby timer exists for this player - ' + params.playerId + ', killing schedule!')
    //             params.channel.kickPlayerToLobby[params.playerId].cancel();
    //             params.channel.kickPlayerToLobby[params.playerId] = null;
    //         } else {
    //             serverLog(stateOfX.serverLogType.info, 'No Kick to lobby timer exists for player id - ' + params.playerId);
    //         }
    // }
    /*======================  END  =====================*/

    /*======================  START  =====================*/
    // kill channel timers
    killChannelTurnTimer(params) {
            this.killChannelLevelTimers(params);
    }
    /*======================  END  =====================*/

    /*======================  START  =====================*/
    // Schedule timer to finish and send broadcast after calltime over

    // New
    sendCallTimeOverBroadCast(params: any): void {

        // Pomelo Connection
        let channel = pomelo.app.get('channelService').getChannel(params.channelId, false);
        if (!channel) {
            console.log("need to insert new channel", channel);
            channel = pomelo.app.get('channelService').getChannel(params.channelId, true);
        }
        // Pomelo Connection


        const currentTime = new Date();
        let scheduleTime: number;

        if (channel.callTimeTimeReference[params.playerId]) {
            channel.callTimeTimeReference[params.playerId].cancel();
            channel.callTimeTimeReference[params.playerId] = null;
        }

        if (params.origin === 'sendCallTimeBufferOverBroadCast') {
            scheduleTime = currentTime.setSeconds(currentTime.getSeconds() + 10);
            channel.callTimeTimeReference[params.playerId] = schedule.scheduleJob(new Date(scheduleTime), async () => {

                try {
                    // Pomelo Connection
                    await pomelo.app.sysrpc['room'].msgRemote.forwardMessage(
                        { forceFrontendId: pomelo.app.serverId },
                        {
                            body: {
                                playerId: params.playerId,
                                status: false,
                                channelId: params.channelId,
                                isRequested: false,
                                playerName: params.playerName,
                                origin: params.origin
                            },
                            route: "room.channelHandler.leaveTable"
                        },
                        this.sessionExport(params.session)
                    );
                    // Pomelo Connection
                } catch (error) {
                    console.error("Error in forwardMessage (buffer over):", error);
                }
            });
        } else {
            scheduleTime = currentTime.setSeconds(currentTime.getSeconds() + Number(channel.callTime) * 60);
            channel.callTimeTimeReference[params.playerId] = schedule.scheduleJob(new Date(scheduleTime), async () => {
                try {
                    await pomelo.app.sysrpc['room'].msgRemote.forwardMessage(
                        { forceFrontendId: pomelo.app.serverId },
                        {
                            body: {
                                playerId: params.playerId,
                                status: false,
                                channelId: params.channelId,
                                isRequested: false,
                                origin: params.origin
                            },
                            route: "room.channelHandler.callTimerStatus"
                        },
                        this.sessionExport(params.session)
                    );
                } catch (error) {
                    console.error("Error in forwardMessage (call time):", error);
                }
            });
        }
    };


    // Old
    // channelTimerHandler.sendCallTimeOverBroadCast = function (params) {
    //         console.error("sendCallTimeOverBroadCast fired", Object.keys(params));
    //         serverLog(stateOfX.serverLogType.info, 'Processing for channel id: ' + params.channelId);
    //         serverLog(stateOfX.serverLogType.info, 'In channelTimerHandler function sendCallTimeOverBroadCast');
    //         var channel = pomelo.app.get('channelService').getChannel(params.channelId, false);
    //         if (!channel) {
    //             console.log("need to insert new channel", channel)
    //             channel = pomelo.app.get('channelService').getChannel(params.channelId, true);
    //         }
    //         console.log('Channel Keys: ', channel.callTime);
    //         var currentTime = new Date();
    //         var scheduleTime = null;
    //         if (channel.callTimeTimeReference[params.playerId]) {
    //             channel.callTimeTimeReference[params.playerId].cancel();
    //             channel.callTimeTimeReference[params.playerId] = null;
    //         }
    //         // console.log('channel.bufferTime', channel.callTime, channel.bufferTime, channel.ctEnabledBufferTime, JSON.stringify(Object.keys(channel)));
    //         if (params.origin == 'sendCallTimeBufferOverBroadCast') {
    //             scheduleTime = currentTime.setSeconds(currentTime.getSeconds() + 10); /* systemConfig.vacantReserveSeatTime */
    //             channel.callTimeTimeReference[params.playerId] = schedule.scheduleJob(currentTime, function () {
    //                 serverLog(stateOfX.serverLogType.info, 'Players call time over now');
    //                 console.log("rs3en45")

    //                 pomelo.app.sysrpc['room'].msgRemote.forwardMessage(
    //                     { forceFrontendId: pomelo.app.serverId },
    //                     {
    //                         body: { playerId: params.playerId, status: false, channelId: params.channelId, isRequested: false, playerName: params.playerName, origin: params.origin },
    //                         route: "room.channelHandler.leaveTable"
    //                     },
    //                     sessionExport(params.session), function (...arg) {
    //                         console.log('pomelo.app.sysrpc[room].msgRemote', ...arg);

    //                     });
    //             });
    //         } else {
    //             scheduleTime = currentTime.setSeconds(currentTime.getSeconds() + parseInt(channel.callTime * 60));
    //             // scheduleTime = currentTime.setSeconds(currentTime.getSeconds() + parseInt(2 * 60));
    //             channel.callTimeTimeReference[params.playerId] = schedule.scheduleJob(currentTime, function () {
    //                 serverLog(stateOfX.serverLogType.info, 'Players call time over now');
    //                 pomelo.app.sysrpc['room'].msgRemote.forwardMessage(
    //                     { forceFrontendId: pomelo.app.serverId },
    //                     {
    //                         body: { playerId: params.playerId, status: false, channelId: params.channelId, isRequested: false, origin: params.origin },
    //                         route: "room.channelHandler.callTimerStatus"
    //                     },
    //                     params.session.export(), function (...arg) {
    //                         console.log('pomelo.app.sysrpc[room].msgRemote', ...arg);

    //                     });
    //             });
    //         }
    // }
    /*======================  END  =====================*/










}
