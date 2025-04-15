import { Injectable } from "@nestjs/common";
import _ from "underscore";
import _ld from "lodash";
import systemConfig from "./../../../../../libs/common/src/systemConfig.json";
import popupTextManager from "../../../../../libs/common/src/popupTextManager";
import stateOfX from "shared/common/stateOfX.sevice";
import { validateKeySets } from "shared/common/utils/activity";

import { PokerDatabaseService } from "shared/common/datebase/pokerdatabase.service";
import { ImdbDatabaseService } from "shared/common/datebase/Imdbdatabase.service";


declare const pomelo: any; // In this place we have add socket.io

@Injectable()
export class BroadcastHandlerService {

    private configMsg = popupTextManager.falseMessages;


    constructor(
        private readonly db: PokerDatabaseService,
        private readonly imdb: ImdbDatabaseService,
    ) { }

    sendPlayerBroadCast(data) {
        // return socket.sendPlayerBroadCast(data)
        return false
    }
    sendGeneralBroadCast(data) {
        // return socket.sendGeneralBroadCast(data)
        return false
    }
    //  pomelo to socket connection 




    /*==========================  START  ========================*/
    /**
     * to broadcast a single player through entryRemote.js function
     * or USE CUSTOM MADE - channel.pushPrivateMessages in pomelo/.../channelService
     * or db query for serverId for player and then use entryRemote
     * @method sendMessageToUser
     * @param  {Object}          params contains route data playerId
     */

    // New
    async sendMessageToUser(params: any): Promise<any> {
        if (params.route === stateOfX.broadcasts.updateProfile && params.msg.sentFrom !== "wallet") {
            return true;
        } else if (
            params.route === 'playerNewChannelBroadcast' ||
            params.route === 'playerElimination' ||
            params.route === "tournamentGameStart"
        ) {

            // Pomelo Connection
            await pomelo.app.rpcInvoke("connector-server-1", {
                namespace: "user",
                service: "entryRemote",
                method: "sendMessageToUser",
                args: [params.playerId, params.msg, params.route]
            });
            // Pomelo Connection

        } else {
            if (params.msg.sentFrom) {
                delete params.msg.sentFrom;
            }

            const validated = await validateKeySets("Request", "connector", "sendMessageToUser", params);

            if (validated.success) {
                if (params.serverId) {

                    // Pomelo Connection
                    const data = await pomelo.app.rpcInvoke(params.serverId, {
                        namespace: "user",
                        service: "entryRemote",
                        method: "sendMessageToUser",
                        args: [params.playerId, params.msg, params.route]
                    });
                    // Pomelo Connection


                    const channelId = params.channelId || params.msg.channelId;
                    const channel = params.channel || pomelo.app.get('channelService').getChannel(channelId, false);
                    if (!!channel && params.route !== stateOfX.broadcasts.updateProfile) {
                        const msgs: any = {};
                        msgs[params.playerId] = { ...params.msg, action: params.route };
                        this.sendPlayerBroadCast(msgs[params.playerId]);
                    } else {
                        params.msg.action = params.route;
                        this.sendPlayerBroadCast(params.msg);
                    }
                } else {
                    console.log(stateOfX.serverLogType.info, 'trying with pushPrivateMessages room-sendMessageToUser', params);
                    const channelId = params.channelId || params.msg.channelId;

                    // Pomelo Connection
                    const channel = params.channel || pomelo.app.get('channelService').getChannel(channelId);
                    // Pomelo Connection

                    const routesToIgnore = [
                        stateOfX.broadcasts.updateProfile,
                        'playerInfo',
                        'evChopPercent',
                        'evChop',
                        'showdownAllInCards',
                        'setEvTag',
                        'waitingForEvChop',
                        'roundOver',
                        'evRIT',
                        'turn'
                    ];

                    if (!!channel && !routesToIgnore.includes(params.route)) {
                        const msgs: any = {};
                        msgs[params.playerId] = { ...params.msg, action: params.route, route: params.route };
                        channel.pushPrivateMessages(params.route, msgs);
                        this.sendPlayerBroadCast(msgs[params.playerId]);
                    } else {
                        const data = await pomelo.app.rpcInvoke("connector-server-1", {
                            namespace: "user",
                            service: "entryRemote",
                            method: "sendMessageToUser",
                            args: [params.playerId, params.msg, params.route]
                        });

                        if (params.route === 'waitingForEvChop') {
                            const videoMessage = {
                                roundId: params.msg.roundId,
                                channelId: params.channelId,
                                type: stateOfX.videoLogEventType.broadcast,
                                data: params.msg
                            };
                            await pomelo.app.rpc.database.videoGameRemote.createVideo('', videoMessage);
                        }

                        params.msg.action = params.route;
                        this.sendPlayerBroadCast(params.msg);
                    }
                }
            } else {
                console.log(stateOfX.serverLogType.error, 'Key validation failed - ' + JSON.stringify(validated));
            }
        }
    };

    // Old
    // broadcastHandler.sendMessageToUser = function (params) {
    //         if (params.route === stateOfX.broadcasts.updateProfile && params.msg.sentFrom != "wallet") {
    //             return true;
    //         } else if (params.route == 'playerNewChannelBroadcast' || params.route == 'playerElimination' || params.route == "tournamentGameStart") {
    //             pomelo.app.rpcInvoke("connector-server-1", { namespace: "user", service: "entryRemote", method: "sendMessageToUser", args: [params.playerId, params.msg, params.route] }, function (data) { });
    //         }
    //         else {
    //             if (params.msg.sentFrom) {
    //                 delete params.msg.sentFrom;
    //             }
    //             keyValidator.validateKeySets("Request", "connector", "sendMessageToUser", params, function (validated) {
    //                 if (validated.success) {
    //                     if (params.serverId) {
    //                         pomelo.app.rpcInvoke(params.serverId, { namespace: "user", service: "entryRemote", method: "sendMessageToUser", args: [params.playerId, params.msg, params.route] }, function (data) {
    //                             serverLog(stateOfX.serverLogType.broadcast, params.route + ' - ' + JSON.stringify(params.msg))
    //                             serverLog(stateOfX.serverLogType.info, 'Response from sending broadcast to individual user for - ' + params.route + ' - ' + JSON.stringify(data));
    //                         });

    //                         let channelId = params.channelId || params.msg.channelId;
    //                         let channel = params.channel || pomelo.app.get('channelService').getChannel(channelId, false);
    //                         if (!!channel && params.route !== stateOfX.broadcasts.updateProfile) {
    //                             let msgs = {};
    //                             msgs[params.playerId] = params.msg;
    //                             msgs[params.playerId].action = params.route
    //                             sendPlayerBroadCast(msgs[params.playerId]);
    //                         } else {
    //                             params.msg.action = params.route;


    //                             sendPlayerBroadCast(params.msg);
    //                         }
    //                     }
    //                     else {
    //                         console.log(stateOfX.serverLogType.info, 'trying with pushPrivateMessages room-sendMessageToUser', params);
    //                         let channelId = params.channelId || params.msg.channelId;
    //                         let channel = params.channel || pomelo.app.get('channelService').getChannel(channelId);
    //                         const routesToIgnore = [
    //                             stateOfX.broadcasts.updateProfile,
    //                             'playerInfo',
    //                             'evChopPercent',
    //                             'evChop',
    //                             'showdownAllInCards',
    //                             'setEvTag',
    //                             'waitingForEvChop',
    //                             'roundOver',
    //                             'evRIT',
    //                             'turn'
    //                         ];
    //                         if (!!channel && !routesToIgnore.includes(params.route)) {
    //                             let msgs = {};
    //                             msgs[params.playerId] = params.msg;
    //                             msgs[params.playerId].action = params.route
    //                             msgs[params.playerId].route = params.route
    //                             channel.pushPrivateMessages(params.route, msgs);
    //                             sendPlayerBroadCast(msgs[params.playerId]);
    //                         } else {
    //                             // we need to find out serverId for playerId by db query to userSession, seriously??, may be not!
    //                             // may be yes! in case of auto leave etc.
    //                             pomelo.app.rpcInvoke("connector-server-1", { namespace: "user", service: "entryRemote", method: "sendMessageToUser", args: [params.playerId, params.msg, params.route] }, function (data) {
    //                                 serverLog(stateOfX.serverLogType.broadcast, params.route + ' - ' + JSON.stringify(params.msg))
    //                                 serverLog(stateOfX.serverLogType.info, 'Response from sending broadcast to individual user for - ' + params.route + ' - ' + JSON.stringify(data));
    //                             });
    //                             if (params.route == 'waitingForEvChop') {
    //                                 let videoMessage = {};
    //                                 videoMessage = { roundId: params.msg.roundId, channelId: params.channelId, type: stateOfX.videoLogEventType.broadcast, data: params.msg };
    //                                 pomelo.app.rpc.database.videoGameRemote.createVideo('', videoMessage, function (videoResponse) {
    //                                 });
    //                             }
    //                             params.msg.action = params.route;
    //                             sendPlayerBroadCast(params.msg);
    //                         }
    //                     }
    //                 } else {
    //                     console.log(stateOfX.serverLogType.error, 'Key validation failed - ' + JSON.stringify(validated));
    //                 }
    //             });
    //         }
    // }
    /*==========================  END  ========================*/

    /*==========================  START  ========================*/
    /**
     * Broadcast to all connected players
     * @method sendMessageToallconnectedUser
     */
    //   New
    sendMessageToallconnectedUser(params: any) {

        params.info = params.info ?? params.broadcastMessage;

        const data = {
            action: 'playerInfo',
            isImp: true,
            heading: params.heading,
            info: params.broadcastMessage,
            channelId: params.channelId,
            playerId: params.playerId,
            buttonCode: 1
        };

        this.sendGeneralBroadCast(data);
    }


    // Old
    // broadcastHandler.sendMessageToallconnectedUser = function (params) {
    //         params.info = params.info ? params.info : params.broadcastMessage
    //         let data = {
    //             action: 'playerInfo',
    //             isImp: true,
    //             heading: params.heading,
    //             info: params.broadcastMessage,
    //             channelId: params.channelId,
    //             playerId: params.playerId,
    //             buttonCode: 1
    //         }
    //         sendGeneralBroadCast(data);
    //     }
    /*==========================  END  ========================*/

    /*==========================  START  ========================*/
    /**
     * Broadcast to all channels joined by any player
     * used in cases like - avtar change of player
     * @method fireBroadcastOnSession
     * @param  {Object}               params contains session, route, data, 
     */
    //   New
    async fireBroadcastOnSession(params: any) {

        const validated = await validateKeySets(
            "Request",
            "connector",
            "fireBroadcastOnSession",
            params
        );

        if (validated.success) {
            const sessionChannels: any = params.session.get("channels") || [];

            if (sessionChannels.length > 0) {

                for (const sessionChannel of sessionChannels) {
                    const channel = pomelo.app.get('channelService').getChannel(sessionChannel, false);

                    if (channel) {
                        params.broadcastData.channelId = sessionChannel;
                        channel.pushMessage(params.broadcastName, params.broadcastData);

                        params.broadcastData.action = params.broadcastName;
                        this.sendGeneralBroadCast(params.broadcastData);
                    }
                }

            } else {
                console.log(stateOfX.serverLogType.info, 'AllChannelBroadcast: Player was not joined into any channel!');
            }
        } else {
            console.log(stateOfX.serverLogType.error, 'AllChannelBroadcast: Key validation failed - ' + JSON.stringify(validated));
        }
    }


    //Old
    //   broadcastHandler.fireBroadcastOnSession = function (params) {
    //         console.log("cjjjjj2 fireBroadcastOnSession", params)

    //         keyValidator.validateKeySets("Request", "connector", "fireBroadcastOnSession", params, function (validated) {
    //             if (validated.success) {
    //                 let sessionChannels = !!params.session.get("channels") ? params.session.get("channels") : [];
    //                 if (sessionChannels.length > 0) {
    //                     serverLog(stateOfX.serverLogType.info, 'Channels joined in this session - ' + sessionChannels);
    //                     let channel = null;
    //                     async.each(sessionChannels, function (sessionChannel, ecb) {
    //                         serverLog(stateOfX.serverLogType.info, 'Processing channel on broadcast - ' + sessionChannel);
    //                         channel = pomelo.app.get('channelService').getChannel(sessionChannel, false);
    //                         if (!!channel) {
    //                             params.broadcastData.channelId = sessionChannel;
    //                             serverLog(stateOfX.serverLogType.broadcast, params.broadcastName + " - " + params.broadcastData);
    //                             channel.pushMessage(params.broadcastName, params.broadcastData);
    //                             params.broadcastData.action = params.broadcastName
    //                             // sending general broadcast using socket
    //                             sendGeneralBroadCast(params.broadcastData);
    //                         }
    //                         ecb();
    //                     }, function (err) {
    //                         if (err) {
    //                             serverLog(stateOfX.serverLogType.info, params.broadcastName + ' broadcast to all channels failed!')
    //                         } else {
    //                             serverLog(stateOfX.serverLogType.info, params.broadcastName + ' broadcast has been sent to all channels successfully!');
    //                         }
    //                     });
    //                 } else {
    //                     serverLog(stateOfX.serverLogType.info, 'AllChannelBroadcast: Player was not joined into any channel!');
    //                 }
    //             } else {
    //                 serverLog(stateOfX.serverLogType.error, 'AllChannelBroadcast: Key validation failed - ' + JSON.stringify(validated));
    //             }
    //         });
    //     }
    /*==========================  END  ========================*/


    /*==========================  START  ========================*/
    // ### Broadcast start game on table ALSO start a video json record
    // > Inform client to start a game on table and provide details
    // > Get current config for table
    // > channelId, currentPlayerId, smallBlindId, bigBlindId, dealerId, straddleId, bigBlind, smallBlind, pot, roundMaxBet, state, playerCards

    //   New
    async fireStartGameBroadcast(params: any): Promise<any> {

        const validated = await validateKeySets(
            "Request",
            "connector",
            "fireStartGameBroadcast",
            params
        );

        if (validated.success) {
            const tdata = JSON.parse(JSON.stringify(params.broadcastData));
            tdata.currentMoveIndex = undefined;

            params.channel.pushMessage("startGame", tdata);

            params.broadcastData.route = "startGame";

            const videoMessage = {
                roundId: params.channel.roundId,
                channelId: params.broadcastData.channelId,
                type: stateOfX.videoLogEventType.broadcast,
                data: params.broadcastData
            };

            // Pomelo Connection
            await pomelo.app.rpc.database.videoGameRemote.createVideo('', videoMessage);
            // Pomelo Connection

            tdata.action = "startGame";
            this.sendGeneralBroadCast(tdata);

            return { success: true };
        } else {
            console.log(stateOfX.serverLogType.error, 'Error while sending start game broadcast - ' + JSON.stringify(validated));
            return validated;
        }
    };

    //   Old
    //   broadcastHandler.fireStartGameBroadcast = function (params, cb) {
    //         console.log("cjjjjj2 fireStartGameBroadcast", params)

    //         keyValidator.validateKeySets("Request", "connector", "fireStartGameBroadcast", params, function (validated) {
    //             if (validated.success) {
    //                 serverLog(stateOfX.serverLogType.broadcast, "startGame- " + JSON.stringify(params.broadcastData));
    //                 let tdata = JSON.parse(JSON.stringify(params.broadcastData));
    //                 tdata.currentMoveIndex = undefined;
    //                 params.channel.pushMessage("startGame", tdata);
    //                 params.broadcastData.route = "startGame";
    //                 let videoMessage = {};
    //                 videoMessage = { roundId: params.channel.roundId, channelId: params.broadcastData.channelId, type: stateOfX.videoLogEventType.broadcast, data: params.broadcastData };
    //                 pomelo.app.rpc.database.videoGameRemote.createVideo('', videoMessage, function (videoResponse) {
    //                 });
    //                 tdata.action = "startGame"
    //                 // sending general broadcast using socket
    //                 sendGeneralBroadCast(tdata);
    //                 cb({ success: true });
    //             } else {
    //                 serverLog(stateOfX.serverLogType.error, 'Error while sending start game broadcast - ' + JSON.stringify(validated))
    //                 cb(validated);
    //             }
    //         });
    //     }
    /*==========================  END  ========================*/

    /*==========================  START  ========================*/
    // fire break start broadcast of a channel in normal tournament
    //   New
    async sendBroadcastForHandBreak(params: any): Promise<any> {

        const validated = await validateKeySets(
            "Request",
            "connector",
            "sendBroadcastForHandBreak",
            params
        );

        if (validated.success) {
            console.log(stateOfX.serverLogType.broadcast, "sendBroadcastForHandBreak- " + JSON.stringify(params.breakTime));
            params.channel.pushMessage("handInHand", { channelId: params.channelId });

            // sending general broadcast using socket
            const broadcast = {
                action: "handInHand",
                channelId: params.channelId
            };
            this.sendGeneralBroadCast(broadcast);
        } else {
            console.log(stateOfX.serverLogType.error, 'Error while sending sendBroadcastForHandBreak - ' + JSON.stringify(validated));
        }
    };


    //   Old
    //   broadcastHandler.sendBroadcastForHandBreak = function (params) {
    //         console.log("inside sendBroadcastForHandBreak", params);
    //         keyValidator.validateKeySets("Request", "connector", "sendBroadcastForHandBreak", params, function (validated) {
    //             if (validated.success) {
    //                 serverLog(stateOfX.serverLogType.broadcast, "sendBroadcastForHandBreak- " + JSON.stringify(params.breakTime));
    //                 params.channel.pushMessage("handInHand", { channelId: params.channelId });
    //                 // sending general broadcast using socket
    //                 let broadcast = {
    //                     action: "handInHand",
    //                     channelId: params.channelId,
    //                 }
    //                 sendGeneralBroadCast(broadcast);
    //             } else {
    //                 serverLog(stateOfX.serverLogType.error, 'Error while sending sendBroadcastForHandBreak - ' + JSON.stringify(validated))
    //             }
    //         });
    //     }
    /*==========================  END  ========================*/

    /*==========================  START  ========================*/

    // New
    async sendBroadcastForBreakToSinglePlayer(params: any): Promise<any> {
        const validated = await validateKeySets(
            "Request",
            "connector",
            "sendBroadcastForBreak",
            params
        );

        if (validated.success) {

            // Pomelo Connection
            await pomelo.app.rpcInvoke(
                "connector-server-1",
                {
                    namespace: "user",
                    service: "entryRemote",
                    method: "sendMessageToUser",
                    args: [params.playerId, params.msg, 'breakTime']
                }
            );
            // Pomelo Connection

        } else {
            console.log(stateOfX.serverLogType.error, 'Error while sending sendBroadcastForBreak - ' + JSON.stringify(validated));
        }
    };


    // Old
    //   broadcastHandler.sendBroadcastForBreakToSinglePlayer = function (params) {
    //         keyValidator.validateKeySets("Request", "connector", "sendBroadcastForBreak", params, function (validated) {
    //             if (validated.success) {
    //                 pomelo.app.rpcInvoke("connector-server-1", { namespace: "user", service: "entryRemote", method: "sendMessageToUser", args: [params.playerId, params.msg, 'breakTime'] }, function (data) { });
    //             } else {
    //                 serverLog(stateOfX.serverLogType.error, 'Error while sending sendBroadcastForBreak - ' + JSON.stringify(validated))
    //             }
    //         });
    //     }
    /*==========================  END  ========================*/

    /*==========================  START  ========================*/
    // fire break timer broadcast of a channel in normal tournament

    // New
    async sendBroadcastForBreakTimer(params: any): Promise<any> {
        console.log("sending broadcast for breakTimerStart for", params.breakTime, " sec on channel ", params.channelId);

        const validated = await validateKeySets(
            "Request",
            "connector",
            "sendBroadcastForBreakTimer",
            params
        );

        if (validated.success) {
            console.log(stateOfX.serverLogType.broadcast, "sendBroadcastForBreakTimer- " + JSON.stringify(params.breakTime));

            params.channel.pushMessage("breakTimerStart", {
                breakTime: params.breakTime,
                channelId: params.channelId
            });

            const broadcast = {
                action: "breakTimerStart",
                breakTime: params.breakTime,
                channelId: params.channelId
            };

            this.sendGeneralBroadCast(broadcast);
        } else {
            console.log(stateOfX.serverLogType.error, 'Error while sending sendBroadcastForBreakTimer - ' + JSON.stringify(validated));
        }
    };

    // Old
    // broadcastHandler.sendBroadcastForBreakTimer = function (params, cb) {
    //         console.log("sending broadcast for breakTimerStart for", params.breakTime, " sec on channel ", params.channelId)
    //         keyValidator.validateKeySets("Request", "connector", "sendBroadcastForBreakTimer", params, function (validated) {
    //             if (validated.success) {
    //                 console.log(stateOfX.serverLogType.broadcast, "sendBroadcastForBreakTimer- " + JSON.stringify(params.breakTime));
    //                 params.channel.pushMessage("breakTimerStart", { breakTime: params.breakTime, channelId: params.channelId });
    //                 // sending general broadcast using socket
    //                 let broadcast = {
    //                     action: "breakTimerStart",
    //                     breakTime: params.breakTime,
    //                     channelId: params.channelId
    //                 }
    //                 sendGeneralBroadCast(broadcast);
    //             } else {
    //                 console.log(stateOfX.serverLogType.error, 'Error while sending sendBroadcastForBreakTimer - ' + JSON.stringify(validated))
    //             }
    //         });
    // }
    /*==========================  END  ========================*/

    /*==========================  START  ========================*/
    //### this function is used to fire broadcast to users who took part in tournament

    //   New
    async fireBroadcastForStartTournament(params: any): Promise<any> {

        const validated = await validateKeySets(
            "Request",
            "connector",
            "fireBroadcastForStartTournament",
            params
        );

        if (validated.success) {
            // send broadcast to users
            await this.sendMessageToUser({
                self: {},
                playerId: params.playerId,
                msg: {
                    tableId: params.tableId,
                    channelId: params.channelId,
                    playerId: params.playerId,
                    gameStartsIn: params.msg.timer,
                    tableDetails: params.msg.table.tableDetails,
                    roomConfig: params.msg.table.roomConfig,
                    settings: params.msg.table.settings,
                    forceJoin: true,
                    info: params.msg.table.table.tournamentName + " tournament has been started!"
                },
                route: params.route
            });

            return { success: true };
        } else {
            return validated;
        }
    };


    //   Old
    //   broadcastHandler.fireBroadcastForStartTournament = function (params, cb) {
    //         console.trace("fireBroadcastForStartTournament log", params)
    //         keyValidator.validateKeySets("Request", "connector", "fireBroadcastForStartTournament", params, function (validated) {
    //             if (validated.success) {
    //                 //send broadcast to users
    //                 broadcastHandler.sendMessageToUser({ self: {}, playerId: params.playerId, msg: { tableId: params.tableId, channelId: params.channelId, playerId: params.playerId, gameStartsIn: params.msg.timer, tableDetails: params.msg.table.tableDetails, roomConfig: params.msg.table.roomConfig, settings: params.msg.table.settings, forceJoin: true, info: params.msg.table.table.tournamentName + " tournament has been started!" }, route: params.route });
    //                 cb({ success: true });
    //             } else {
    //                 cb(validated);
    //             }
    //         })
    //     }
    /*==========================  END  ========================*/

    /*==========================  START  ========================*/

    // New
    async newSimilarTable(params: any): Promise<any> {

        // Pomelo Connection
        const channel = pomelo.app.get('channelService').getChannel(params.channelId);
        // Pomelo Connection

        if (channel) {
            if (params.route === "joinSimilarTable") {
                channel.pushMessage('joinSimilarTable', params.msg);
            } else {
                channel.pushMessage('playerInfo', {
                    channelId: params.channelId,
                    info: params.info
                });
            }
        }
    };

    // Old
    //   broadcastHandler.newSimilarTable = function (params, cb) {
    //         const channel = pomelo.app.get('channelService').getChannel(params.channelId);
    //         console.log("got a request to inform players channel", channel)
    //         if (channel) {
    //             if (params.route === "joinSimilarTable") {
    //                 channel.pushMessage('joinSimilarTable', params.msg);
    //             } else {
    //                 channel.pushMessage('playerInfo', { channelId: params.channelId, info: params.info });
    //             }
    //         }
    //     }
    /*==========================  END  ========================*/

    /*==========================  START  ========================*/
    // fire rebuy broadcast of a channel in normal tournament

    //   New
    async fireBroadcastForRebuyStatus(params: any): Promise<any> {

        const validated = await validateKeySets("Request", "connector", "fireBroadcastForRebuyStatus", params);

        if (validated.success) {
            console.log(stateOfX.serverLogType.broadcast, "fireBroadcastForRebuyStatus- " + params.rebuyStatus + params.channelId);

            params.channel.pushMessage("rebuyStatus", {
                status: params.rebuyStatus,
                channelId: params.channelId
            });

            const broadcast = {
                action: "rebuyStatus",
                status: params.rebuyStatus,
                channelId: params.channelId
            };

            this.sendGeneralBroadCast(broadcast);
        } else {
            console.log(stateOfX.serverLogType.error, 'Error while sending fireBroadcastForRebuyStatus - ' + JSON.stringify(validated));
        }
    };

    // Old
    //   broadcastHandler.fireBroadcastForRebuyStatus = function (params, cb) {
    //         keyValidator.validateKeySets("Request", "connector", "fireBroadcastForRebuyStatus", params, function (validated) {
    //             if (validated.success) {
    //                 serverLog(stateOfX.serverLogType.broadcast, "fireBroadcastForRebuyStatus- " + params.rebuyStatus + params.channelId);
    //                 params.channel.pushMessage("rebuyStatus", { status: params.rebuyStatus, channelId: params.channelId });
    //                 // sending general broadcast using socket
    //                 let broadcast = {
    //                     action: "rebuyStatus",
    //                     status: params.rebuyStatus,
    //                     channelId: params.channelId
    //                 }
    //                 sendGeneralBroadCast(broadcast);
    //             } else {
    //                 serverLog(stateOfX.serverLogType.error, 'Error while sending fireBroadcastForRebuyStatus - ' + JSON.stringify(validated))
    //             }
    //         });
    //     }
    /*==========================  END  ========================*/


    /*==========================  START  ========================*/

    // New
    async fireBroadcastForRebuyWaiting(params: any): Promise<any> {
        const validated = await validateKeySets("Request", "connector", "fireBroadcastForRebuyWaiting", params);

        if (validated.success) {

            // Pomelo Connection
            const data = await pomelo.app.rpcInvokeAsync("connector-server-1", {
                namespace: "user",
                service: "entryRemote",
                method: "sendMessageToUser",
                args: [params.playerId, params.msg, "rebuyWaiting"]
            });
            // Pomelo Connection

            console.log(stateOfX.serverLogType.info, 'Response from sending broadcast to individual user for fireBroadcastForRebuyWaiting ', data);
        } else {
            console.log(stateOfX.serverLogType.error, 'Error while sending fireBroadcastForRebuyWaiting - ' + JSON.stringify(validated));
        }
    };


    // Old
    //   broadcastHandler.fireBroadcastForRebuyWaiting = function (params, cb) {
    //         keyValidator.validateKeySets("Request", "connector", "fireBroadcastForRebuyWaiting", params, function (validated) {
    //             if (validated.success) {
    //                 pomelo.app.rpcInvoke("connector-server-1", { namespace: "user", service: "entryRemote", method: "sendMessageToUser", args: [params.playerId, params.msg, "rebuyWaiting"] }, function (data) {
    //                     console.log(stateOfX.serverLogType.info, 'Response from sending broadcast to individual user for fireBroadcastForRebuyWaiting ', data);
    //                 });
    //             } else {
    //                 serverLog(stateOfX.serverLogType.error, 'Error while sending fireBroadcastForRebuyWaiting - ' + JSON.stringify(validated))
    //             }
    //         });
    //     }
    /*==========================  END  ========================*/


    /*==========================  START  ========================*/
    // fire rebuy about to end broadcast of a channel in normal tournament

    //   New
    async fireBroadcastForRebuyAboutToEnd(params: any): Promise<any> {
        const validated = await validateKeySets("Request", "connector", "fireBroadcastForRebuyAboutToEnd", params);

        if (validated.success) {
            console.log(stateOfX.serverLogType.broadcast, "fireBroadcastForRebuyAboutToEnd- " + params.rebuyTimeEnds + params.channelId);

            params.channel.pushMessage("rebuyTimeEnds", {
                info: `Rebuy period is going to end in next ${params.rebuyTimeEnds} minutes`,
                channelId: params.channelId
            });

            const broadcast = {
                action: "rebuyTimeEnds",
                info: `Rebuy period is going to end in next ${params.rebuyTimeEnds} minutes`,
                channelId: params.channelId
            };

            this.sendGeneralBroadCast(broadcast);
        } else {
            console.log(stateOfX.serverLogType.error, 'Error while sending fireBroadcastForRebuyAboutToEnd - ' + JSON.stringify(validated));
        }
    };

    //   Old
    // broadcastHandler.fireBroadcastForRebuyAboutToEnd = function (params, cb) {
    //         keyValidator.validateKeySets("Request", "connector", "fireBroadcastForRebuyAboutToEnd", params, function (validated) {
    //             if (validated.success) {
    //                 serverLog(stateOfX.serverLogType.broadcast, "fireBroadcastForRebuyAboutToEnd- " + params.rebuyTimeEnds + params.channelId);
    //                 params.channel.pushMessage("rebuyTimeEnds", { info: "Rebuy period is going to end in next " + params.rebuyTimeEnds + " minutes", channelId: params.channelId });
    //                 // sending general broadcast using socket
    //                 let broadcast = {
    //                     action: "rebuyTimeEnds",
    //                     info: "Rebuy period is going to end in next " + params.rebuyTimeEnds + " minutes",
    //                     channelId: params.channelId
    //                 }
    //                 sendGeneralBroadCast(broadcast);
    //             } else {
    //                 serverLog(stateOfX.serverLogType.error, 'Error while sending fireBroadcastForRebuyAboutToEnd - ' + JSON.stringify(validated))
    //             }
    //         });
    //     }
    /*==========================  END  ========================*/

    /*==========================  START  ========================*/
    // tournament

    //   New
    async fireBroadcastForAddon(params: any): Promise<any> {

        const validated = await validateKeySets("Request", "connector", "fireBroadcastForAddon", params);

        if (validated.success) {
            console.log(stateOfX.serverLogType.broadcast, "fireBroadcastForAddon- " + params.info);

            const channel = params.channel || pomelo.app.get('channelService').getChannel(params.channelId, false);

            channel.pushMessage(params.route, {
                info: params.info,
                data: params.data,
                channelId: params.channelId
            });

            const broadcast = {
                action: params.route,
                info: params.info,
                channelId: params.channelId
            };

            this.sendGeneralBroadCast(broadcast);
        } else {
            console.log(stateOfX.serverLogType.error, 'Error while sending fireBroadcastForAddon - ' + JSON.stringify(validated));
        }
    };


    //   Old
    //   fireBroadcastForAddon = function (params, cb) {
    //         console.trace("cjjjjj2 fireBroadcastForAddon", params)
    //         keyValidator.validateKeySets("Request", "connector", "fireBroadcastForAddon", params, function (validated) {
    //             if (validated.success) {
    //                 serverLog(stateOfX.serverLogType.broadcast, "fireBroadcastForAddon- " + params.info);
    //                 let channel = params.channel || pomelo.app.get('channelService').getChannel(params.channelId, false);
    //                 channel.pushMessage(params.route, { info: params.info, data: params.data, channelId: params.channelId });
    //                 let broadcast = {
    //                     action: params.route,
    //                     info: params.info,
    //                     channelId: params.channelId
    //                 }
    //                 sendGeneralBroadCast(broadcast);
    //             } else {
    //                 serverLog(stateOfX.serverLogType.error, 'Error while sending fireBroadcastForAddon - ' + JSON.stringify(validated))
    //             }
    //         });
    //     }
    /*==========================  END  ========================*/


    /*==========================  START  ========================*/
  // ### Broadcast for client-server connection
  // deprecated

    //   New
    async fireAckBroadcastDep(params: any): Promise<any> {
        const validated = await validateKeySets("Request", "connector", "fireAckBroadcast", params);

        if (validated.success) {
            this.sendMessageToUser({
                self: {},
                playerId: params.playerId,
                msg: {
                    channelId: params.channelId,
                    playerId: params.playerId
                },
                route: "connectionAck"
            });
        } else {
            console.log(stateOfX.serverLogType.error, 'Error while sending ack broadcast - ' + JSON.stringify(validated));
        }
    };

    //   Old
    // broadcastHandler.fireAckBroadcastDep = function (params) {
    //         keyValidator.validateKeySets("Request", "connector", "fireAckBroadcast", params, function (validated) {
    //             if (validated.success) {
    //                 broadcastHandler.sendMessageToUser({ self: {}, playerId: params.playerId, msg: { channelId: params.channelId, playerId: params.playerId }, route: "connectionAck" });
    //             } else {
    //                 serverLog(stateOfX.serverLogType.error, 'Error while sending ack broadcast - ' + JSON.stringify(validated))
    //             }
    //         });
    //     }
    /*==========================  END  ========================*/

    /*==========================  START  ========================*/
    // tournament

    //   New
    async fireNewChannelBroadcast(params: any): Promise<any> {
        
        const validated = await validateKeySets("Request", "connector", "fireNewChannelBroadcast", params);

        if (validated.success) {
            this.sendMessageToUser({
                self: {},
                playerId: params.playerId,
                msg: {
                    channelId: params.channelId,
                    playerId: params.playerId,
                    newChannelId: params.newChannelId,
                    seatIndex: params.seatIndex,
                    maxPlayers: params.maxPlayers
                },
                route: "playerNewChannelBroadcast"
            });
        } else {
            console.log(stateOfX.serverLogType.error, 'Error while sending playerNewChannelBroadcast - ' + JSON.stringify(validated));
        }
    };

    //   Old
    // broadcastHandler.fireNewChannelBroadcast = function (params) {
    //         console.log("fireNewChannelBroadcast 325 ", params)
    //         keyValidator.validateKeySets("Request", "connector", "fireNewChannelBroadcast", params, function (validated) {
    //             if (validated.success) {
    //                 broadcastHandler.sendMessageToUser({ self: {}, playerId: params.playerId, msg: { channelId: params.channelId, playerId: params.playerId, newChannelId: params.newChannelId, seatIndex: params.seatIndex, maxPlayers: params.maxPlayers }, route: "playerNewChannelBroadcast" });
    //             } else {
    //                 serverLog(stateOfX.serverLogType.error, 'Error while sending playerNewChannelBroadcast - ' + JSON.stringify(validated))
    //             }
    //         });
    //     }
    /*==========================  END  ========================*/

    /*==========================  START  ========================*/
  /**
   * broadcast when player gets a seat from waiting list
   * @method autoJoinBroadcast
   * @param  {Object}          params contains data, route
   */

//   New
async autoJoinBroadcast(params: any): Promise<any> {
    const validated = await validateKeySets("Request", "connector", "autoJoinBroadcast", params);

    if (validated.success) {
        this.sendMessageToUser({
            self: {},
            playerId: params.playerId,
            serverId: params.serverId,
            msg: _.omit(params, "self", "session"),
            route: "autoJoinBroadcast"
        });
    } else {
        console.log(stateOfX.serverLogType.error, 'Error while sending playerNewChannelBroadcast - ' + JSON.stringify(validated));
    }
};


//   Old
//   broadcastHandler.autoJoinBroadcast = function (params) {
//         console.log("cjjjjj2 autoJoinBroadcast", params)
//         keyValidator.validateKeySets("Request", "connector", "autoJoinBroadcast", params, function (validated) {
//             if (validated.success) {
//                 broadcastHandler.sendMessageToUser({ self: {}, playerId: params.playerId, serverId: params.serverId, msg: _.omit(params, "self", "session"), route: "autoJoinBroadcast" });
//             } else {
//                 serverLog(stateOfX.serverLogType.error, 'Error while sending playerNewChannelBroadcast - ' + JSON.stringify(validated))
//             }
//         });
//     }
    /*==========================  END  ========================*/

    /*==========================  START  ========================*/
  //### this function send broadcast when any player eliminate.
  // tournament

//   New
async firePlayerEliminateBroadcast(params: any): Promise<any> {
    const validated = await validateKeySets("Request", "connector", "firePlayerEliminateBroadcast", params);

    if (validated.success) {
        setTimeout(() => {
            this.sendMessageToUser({
                self: {},
                playerId: params.playerId,
                msg: {
                    channelId: params.channelId,
                    playerId: params.playerId,
                    tournamentId: params.tournamentId,
                    chipsWon: Math.round(params.chipsWon) || 0,
                    rank: params.rank,
                    isGameRunning: params.isGameRunning,
                    isRebuyAllowed: params.isRebuyAllowed,
                    tournamentName: params.tournamentName,
                    tournamentType: params.tournamentType,
                    ticketsWon: params.ticketsWon || 0,
                    info: params.info
                },
                route: params.route
            });
        }, (systemConfig.gameOverBroadcastDelay * 1000 + 100));

        return { success: true };
    } else {
        console.log(stateOfX.serverLogType.error, 'Error while sending firePlayerEliminateBroadcast - ' + JSON.stringify(validated));
        return validated;
    }
};


//   Old
//   broadcastHandler.firePlayerEliminateBroadcast = function (params, cb) {
//         console.log("cjjjjj2 firePlayerEliminateBroadcast", params)
//         keyValidator.validateKeySets("Request", "connector", "firePlayerEliminateBroadcast", params, function (validated) {
//             if (validated.success) {
//                 setTimeout(function () {
//                     broadcastHandler.sendMessageToUser({ self: {}, playerId: params.playerId, msg: { channelId: params.channelId, playerId: params.playerId, tournamentId: params.tournamentId, chipsWon: Math.round(params.chipsWon) || 0, rank: params.rank, isGameRunning: params.isGameRunning, isRebuyAllowed: params.isRebuyAllowed, tournamentName: params.tournamentName, tournamentType: params.tournamentType, ticketsWon: params.ticketsWon || 0, info: params.info }, route: params.route });
//                 }, (systemConfig.gameOverBroadcastDelay * 1000 + 100))
//                 cb({ success: true });
//             } else {
//                 cb(validated);
//             }
//         })
//     }
    /*==========================  END  ========================*/

    /*==========================  START  ========================*/
    /**
     * function to send message to registered users about tournament cancellation
     *
     * @method fireTournamentCancelledBroadcast
     * @param  {Object}       params  request json object
     * @return {Object}               validated object
     */

    //   New
    async fireTournamentCancelledBroadcast(params: any): Promise<any> {
        console.log(stateOfX.serverLogType.info, "in fireTournamentCancelledBroadcast  " + params);

        const validated = await validateKeySets("Request", "connector", "fireTournamentCancelledBroadcast", params);

        if (validated.success) {
            console.log(stateOfX.serverLogType.info, "going to send broadcast for tournament cancelled ");
            this.sendMessageToUser({
                self: {},
                playerId: params.playerId,
                msg: {
                    playerId: params.playerId,
                    tournamentId: params.tournamentId,
                    info: "Tournament has been cancelled."
                },
                route: params.route
            });
        } else {
            console.log(stateOfX.serverLogType.info, "error in key validation in fireTournamentCancelledBroadcast ");
        }
    };


    //   Old
    //   broadcastHandler.fireTournamentCancelledBroadcast = function (params) {
    //         serverLog(stateOfX.serverLogType.info, "in fireTournamentCancelledBroadcast  " + params);
    //         keyValidator.validateKeySets("Request", "connector", "fireTournamentCancelledBroadcast", params, function (validated) {
    //             if (validated.success) {
    //                 serverLog(stateOfX.serverLogType.info, "going to send broadcast for tournament cancelled ")
    //                 broadcastHandler.sendMessageToUser({ self: {}, playerId: params.playerId, msg: { playerId: params.playerId, tournamentId: params.tournamentId, info: "Tournament has been cancelled." }, route: params.route });
    //             } else {
    //                 serverLog(stateOfX.serverLogType.info, "error in key validation in fireTournamentCancelledBroadcast ")

    //             }
    //         })
    //     }
        /*==========================  END  ========================*/

        /*==========================  START  ========================*/
  // ### Broadcast sit of this player

    //   New
    async fireSitBroadcast(params: any): Promise<any> {

        const validated = await validateKeySets("Request", "connector", "fireSitBroadcast", params);

        if (validated.success) {
            let data:any = {
                channelId: params.table.channelId,
                playerId: params.player.playerId,
                chips: params.player.chips,
                seatIndex: params.player.seatIndex,
                playerName: params.player.playerName,
                imageAvtar: params.player.imageAvtar,
                state: params.player.state,
            };

            console.log(stateOfX.serverLogType.broadcast, 'sit- ' + JSON.stringify(data));

            params.channel.pushMessage('sit', data);

            data.route = "sit";

            let videoMessage = {
                roundId: params.channel.roundId,
                channelId: params.table.channelId,
                type: stateOfX.videoLogEventType.broadcast,
                data: data
            };

            // Pomelo Connection
            await pomelo.app.rpc.database.videoGameRemote.createVideo('', videoMessage);
            // Pomelo Connection

            // sending general broadcast using socket
            data.action = 'sit';
            this.sendGeneralBroadCast(data);
        } else {
            console.log("Couldn't send the fireSitBroadcast", params.player.playerName);
            console.log(stateOfX.serverLogType.error, 'Error while sending sit broadcast - ' + JSON.stringify(validated));
        }
    };


    //   Old
    //   broadcastHandler.fireSitBroadcast = function (params) {
    //         console.log("cjjjjj2 fireSitBroadcast", params)
    //         keyValidator.validateKeySets("Request", "connector", "fireSitBroadcast", params, function (validated) {
    //             if (validated.success) {
    //                 let data = { channelId: params.table.channelId, playerId: params.player.playerId, chips: params.player.chips, seatIndex: params.player.seatIndex, playerName: params.player.playerName, imageAvtar: params.player.imageAvtar, state: params.player.state, };
    //                 serverLog(stateOfX.serverLogType.broadcast, 'sit- ' + JSON.stringify(data));
    //                 params.channel.pushMessage('sit', data);
    //                 data.route = "sit";
    //                 let videoMessage = {};
    //                 videoMessage = { roundId: params.channel.roundId, channelId: params.table.channelId, type: stateOfX.videoLogEventType.broadcast, data: data };
    //                 pomelo.app.rpc.database.videoGameRemote.createVideo('', videoMessage, function (videoResponse) {
    //                 });
    //                 // sending general broadcast using socket
    //                 data.action = 'sit';
    //                 sendGeneralBroadCast(data);
    //             } else {
    //                 console.log("Couldn't send the fireSitBroadcast", params.player.playerName);
    //                 serverLog(stateOfX.serverLogType.error, 'Error while sending sit broadcast - ' + JSON.stringify(validated))
    //             }
    //         });
    //     }
        /*==========================  END  ========================*/

    /*==========================  START  ========================*/
    // player sit broadcast while shuffling
    // tournament

    //   New
    async fireSitBroadcastInShuffling(params: any): Promise<any> {
        console.log(stateOfX.serverLogType.info, "params is in fireSitBroadcastInShuffling - ", params);

        const validated = await validateKeySets("Request", "connector", "fireSitBroadcastInShuffling", params);

        if (validated.success) {
            if (!params.channel) {
                console.log("need to insert new channel", params.channel);
                params.channel = pomelo.app.get('channelService').getChannel(params.newChannelId, true);
            }

            const data:any = {
                channelId: params.newChannelId,
                playerId: params.playerId,
                chips: params.chips,
                seatIndex: params.seatIndex,
                playerName: params.playerName,
                imageAvtar: params.imageAvtar
            };

            params.channel.pushMessage('sit', data);

            console.log(stateOfX.serverLogType.broadcast, 'sit- ' + JSON.stringify(data));

            data.route = "sit";

            const videoMessage = {
                roundId: params.channel.roundId,
                channelId: params.newChannelId,
                type: stateOfX.videoLogEventType.broadcast,
                data: data
            };

            // Pomelo Connection
            await pomelo.app.rpc.database.videoGameRemote.createVideo('', videoMessage);
            // Pomelo Connection

            // sending general broadcast using socket
            data.action = 'sit';
            this.sendGeneralBroadCast(data);
        } else {
            console.log(stateOfX.serverLogType.error, 'Error while sending sit broadcast - ' + JSON.stringify(validated));
        }
    };

    //   Old
    //   broadcastHandler.fireSitBroadcastInShuffling = function (params) {
    //         console.log(stateOfX.serverLogType.info, "params is in fireSitBroadcastInShuffling - ", params);
    //         keyValidator.validateKeySets("Request", "connector", "fireSitBroadcastInShuffling", params, function (validated) {
    //             if (validated.success) {
    //                 if (!params.channel) {
    //                     console.log("need to insert new channel", params.channel)
    //                     params.channel = pomelo.app.get('channelService').getChannel(params.newChannelId, true);
    //                 }
    //                 let data = { channelId: params.newChannelId, playerId: params.playerId, chips: params.chips, seatIndex: params.seatIndex, playerName: params.playerName, imageAvtar: params.imageAvtar };
    //                 params.channel.pushMessage('sit', data);
    //                 console.log(stateOfX.serverLogType.broadcast, 'sit- ' + JSON.stringify(data));
    //                 data.route = "sit";
    //                 let videoMessage = {};
    //                 videoMessage = { roundId: params.channel.roundId, channelId: params.newChannelId, type: stateOfX.videoLogEventType.broadcast, data: data };
    //                 pomelo.app.rpc.database.videoGameRemote.createVideo('', videoMessage, function (videoResponse) { });
    //                 // sending general broadcast using socket
    //                 data.action = 'sit';
    //                 sendGeneralBroadCast(data);
    //             } else {
    //                 console.log(stateOfX.serverLogType.error, 'Error while sending sit broadcast - ' + JSON.stringify(validated))
    //             }
    //         });
    //     }
    /*==========================  END  ========================*/


    /*==========================  START  ========================*/
  // ### Broadcast players with state before next game start
  // game might start OR not
  // but this broadcast should be pushed
  // to reset table

    //   New
    async fireTablePlayersBroadcast(params: any): Promise<any> {

        const validated = await validateKeySets("Request", "connector", "fireTablePlayersBroadcast", params);

        if (validated.success) {
            const data:any = {
                channelId: params.channelId,
                players: _.map(params.players, function (player) {
                    const p = _.pick(player, 'playerId', 'playerName', 'channelId', 'seatIndex', 'bestHands', 'chips', 'state', 'moves', 'isPartOfGame');
                    p.isPartOfGame = p.isPartOfGame || (
                        p.state === stateOfX.playerState.playing ||
                        p.state === stateOfX.playerState.disconnected
                    );
                    return p;
                }),
                removed: params.removed
            };

            console.log(stateOfX.serverLogType.broadcast, "gamePlayers- " + JSON.stringify(data));

            params.channel.pushMessage("gamePlayers", data);

            if (params.channel.gameStartEventSet !== stateOfX.startGameEventOnChannel.idle) {
                data.route = "gamePlayers";

                const videoMessage = {
                    roundId: params.channel.roundId,
                    channelId: params.channelId,
                    type: stateOfX.videoLogEventType.broadcast,
                    data: data
                };

                // Pomelo Connection
                await pomelo.app.rpc.database.videoGameRemote.createVideo('', videoMessage);
                // Pomelo Connection

            } else {
                console.log(stateOfX.serverLogType.info, "Not storing this game players for video log, as game is not going to start here!");
            }

            data.action = 'gamePlayers';
            this.sendGeneralBroadCast(data);
        } else {
            console.log(stateOfX.serverLogType.error, 'Error while sending game players broadcast - ' + JSON.stringify(validated));
        }
    };

    //   Old
    //   broadcastHandler.fireTablePlayersBroadcast = function (params) {
    //         console.log("fireTablePlayersBroadcast sdfg", params.removed)
    //         keyValidator.validateKeySets("Request", "connector", "fireTablePlayersBroadcast", params, function (validated) {
    //             if (validated.success) {
    //                 let data = {
    //                     channelId: params.channelId, players: _.map(params.players, function (player) {
    //                         let p = _.pick(player, 'playerId', 'playerName', 'channelId', 'seatIndex', 'bestHands', 'chips', 'state', 'moves', 'isPartOfGame');
    //                         p.isPartOfGame = p.isPartOfGame || (p.state == stateOfX.playerState.playing ||
    //                             p.state == stateOfX.playerState.disconnected);
    //                         return p;
    //                     }), removed: params.removed,
    //                 };
    //                 serverLog(stateOfX.serverLogType.broadcast, "gamePlayers- " + JSON.stringify(data));
    //                 params.channel.pushMessage("gamePlayers", data);
    //                 if (params.channel.gameStartEventSet !== stateOfX.startGameEventOnChannel.idle) {
    //                     data.route = "gamePlayers";
    //                     let videoMessage = {};
    //                     videoMessage = { roundId: params.channel.roundId, channelId: params.channelId, type: stateOfX.videoLogEventType.broadcast, data: data };
    //                     pomelo.app.rpc.database.videoGameRemote.createVideo('', videoMessage, function (videoResponse) {
    //                     });
    //                 } else {
    //                     serverLog(stateOfX.serverLogType.info, "Not storing this game players for video log, as game is not going to start here!");
    //                 }
    //                 data.action = 'gamePlayers';
    //                 sendGeneralBroadCast(data);
    //             } else {
    //                 serverLog(stateOfX.serverLogType.error, 'Error while sending game players broadcast - ' + JSON.stringify(validated))
    //             }
    //         });
    //     }
    /*==========================  END  ========================*/


    /*==========================  START  ========================*/
    // ### Broadcast cards distribution to each players
    // USE CUSTOM MADE - channel.pushPrivateMessages in pomelo/.../channelService

    async fireCardDistributeBroadcast(params: any): Promise<any> {
        const validated = await validateKeySets("Request", "connector", "fireCardDistributeBroadcast", params);

        if (validated.success) {
            const playerCards: Record<string, any> = {};

            for (let i = 0; i < params.players.length; i++) {
                const player = params.players[i];
                playerCards[player.playerId] = {
                    channelId: params.channelId,
                    playerId: player.playerId,
                    cards: player.cards,
                    route: "playerCards"
                };

                const videoMessage = {
                    roundId: params.channel.roundId,
                    channelId: params.channelId,
                    type: stateOfX.videoLogEventType.broadcast,
                    data: playerCards[player.playerId]
                };

                // Pomelo Connection
                await pomelo.app.rpc.database.videoGameRemote.createVideo('', videoMessage);
                // Pomelo Connection

                playerCards[player.playerId].action = 'playerCards';

                this.sendPlayerBroadCast(playerCards[player.playerId]);
            }

            params.channel.pushPrivateMessages("playerCards", playerCards);

            return { success: true };
        } else {
            return validated;
        }
    };


    //   broadcastHandler.fireCardDistributeBroadcast = function (params, cb) {
    //         keyValidator.validateKeySets("Request", "connector", "fireCardDistributeBroadcast", params, function (validated) {
    //             if (validated.success) {
    //                 let playerCards = {};
    //                 for (let i = 0; i < params.players.length; i++) {
    //                     let player = params.players[i];
    //                     // console.log('Printing sitout player', player);
    //                     playerCards[player.playerId] = { channelId: params.channelId, playerId: player.playerId, cards: player.cards };
    //                     playerCards[player.playerId].route = "playerCards";
    //                     let videoMessage = {};
    //                     videoMessage = { roundId: params.channel.roundId, channelId: params.channelId, type: stateOfX.videoLogEventType.broadcast, data: playerCards[player.playerId] };
    //                     pomelo.app.rpc.database.videoGameRemote.createVideo('', videoMessage, function (videoResponse) {

    //                     });
    //                     // sending player broadcast using socket
    //                     playerCards[player.playerId].action = 'playerCards';
    //                     sendPlayerBroadCast(playerCards[player.playerId]);
    //                 }
    //                 console.log("cjjjjj2 fireCardDistributeBroadcast.channel", params.channel)
    //                 params.channel.pushPrivateMessages("playerCards", playerCards);
    //                 cb({ success: true })
    //             } else {
    //                 cb(validated);
    //             }
    //         });
    //     }
    /*==========================  END  ========================*/

    /*==========================  START  ========================*/
    // ### Send blind deduction on table

    //   New
    async fireDeductBlindBroadcast(params: any): Promise<any> {

        const validated = await validateKeySets("Request", "connector", "fireDeductBlindBroadcast", params.data);

        if (validated.success) {
            console.log(stateOfX.serverLogType.broadcast, "blindDeduction: " + JSON.stringify(params.data));

            params.channel.pushMessage("blindDeduction", params.data);

            params.data.route = "blindDeduction";

            const videoMessage = {
                roundId: params.channel.roundId,
                channelId: params.data.channelId,
                type: stateOfX.videoLogEventType.broadcast,
                data: params.data
            };

            // Pomelo Connection
            await pomelo.app.rpc.database.videoGameRemote.createVideo('', videoMessage);
            // Pomelo Connection

            params.data.action = 'blindDeduction';

            this.sendGeneralBroadCast(params.data);

            return { success: true };
        } else {
            return validated;
        }
    };


    //   Old
    //   broadcastHandler.fireDeductBlindBroadcast = function (params, cb) {
    //         console.log("cjjjjj2 fireDeductBlindBroadcast", params)
    //         keyValidator.validateKeySets("Request", "connector", "fireDeductBlindBroadcast", params.data, function (validated) {
    //             if (validated.success) {
    //                 serverLog(stateOfX.serverLogType.broadcast, "blindDeduction: " + JSON.stringify(params.data));
    //                 params.channel.pushMessage("blindDeduction", params.data);
    //                 params.data.route = "blindDeduction";
    //                 let videoMessage = {};
    //                 videoMessage = { roundId: params.channel.roundId, channelId: params.data.channelId, type: stateOfX.videoLogEventType.broadcast, data: params.data };

    //                 pomelo.app.rpc.database.videoGameRemote.createVideo('', videoMessage, function (videoResponse) {
    //                 });
    //                 params.data.action = 'blindDeduction'
    //                 sendGeneralBroadCast(params.data);
    //                 cb({ success: true });
    //             } else {
    //                 cb(validated);
    //             }
    //         });
    //     }
    /*==========================  END  ========================*/
  
    /*==========================  START  ========================*/

    // New
    async fireOnFirstTurnBroadcast(params: any): Promise<any> {
    
        const data = _.omit(params, 'self', 'channel', 'session');
    
        let tableResponse;
        try {
            tableResponse = await this.imdb.getTable(data.channelId);
        } catch (err) {
            console.log(stateOfX.serverLogType.error, 'Error while sending on turn broadcast - ' + JSON.stringify(err));
            return {
                success: false,
                info: this.configMsg.FIREONTURNBROADCASTFAIL_BROADCASTHANDLER + JSON.stringify(err),
                isRetry: false,
                isDisplay: false,
                channelId: ""
            };
        }
    
        if (!tableResponse) {
            return {
                success: false,
                isRetry: false,
                isDisplay: false,
                channelId: ""
            };
        }
    
        if (tableResponse.removedPlayers.length > 0) {
            return {
                success: false,
                isRetry: false,
                isDisplay: false,
                channelId: ""
            };
        }
    
        const validated = await validateKeySets("Request", "connector", "fireOnTurnBroadcast", params);
    
        if (validated.success) {
            params.channel.pushMessage("turn", data);
            data.route = "turn";
    
            const videoMessage = {
                roundId: params.channel.roundId,
                channelId: data.channelId,
                type: stateOfX.videoLogEventType.broadcast,
                data: data
            };
    
            // Pomelo Connection
            await pomelo.app.rpc.database.videoGameRemote.createVideo('', videoMessage);
            // Pomelo Connection
    
            data.playerAction = data.action;
            data.action = "turn";
    
            this.sendGeneralBroadCast(data);
    
            return { success: true, isRetry: false, isDisplay: true, channelId: data.channelId };
        } else {
            return {
                success: false,
                isRetry: false,
                isDisplay: false,
                channelId: ""
            };
        }
    };
    

    // Old
    //   broadcastHandler.fireOnFirstTurnBroadcast = function (params, cb) {
    //         console.log("cjjjjj2 fireOnFirstTurnBroadcast", params)

    //         let data = _.omit(params, 'self', 'channel', 'session');
    //         imdb.getTable(data.channelId, function (err, tableResponse) {
    //             if (!!tableResponse) {
    //                 if (tableResponse.removedPlayers.length > 0) {
    //                     cb({ success: false, isRetry: false, isDisplay: false, channelId: "" });
    //                 } else {
    //                     keyValidator.validateKeySets("Request", "connector", "fireOnTurnBroadcast", params, function (validated) {
    //                         if (validated.success) {
    //                             params.channel.pushMessage("turn", data);
    //                             data.route = "turn";
    //                             let videoMessage = {};
    //                             videoMessage = { roundId: params.channel.roundId, channelId: data.channelId, type: stateOfX.videoLogEventType.broadcast, data: data };

    //                             pomelo.app.rpc.database.videoGameRemote.createVideo('', videoMessage, function (videoResponse) {
    //                             });
    //                             data.playerAction = data.action;
    //                             data.action = "turn";
    //                             sendGeneralBroadCast(data);
    //                             cb({ success: true });
    //                         } else {
    //                             cb({ success: false, isRetry: false, isDisplay: false, channelId: "" });
    //                         }
    //                     });
    //                 }
    //             } else {
    //                 serverLog(stateOfX.serverLogType.error, 'Error while sending on turn broadcast - ' + JSON.stringify(validated))
    //                 cb({ success: false, info: configMsg.FIREONTURNBROADCASTFAIL_BROADCASTHANDLER + JSON.stringify(validated), isRetry: false, isDisplay: false, channelId: "" });
    //             }
    //         });
    //     }
        /*==========================  END  ========================*/


        /*==========================  START  ========================*/
    // Broadcast after an action performed

    //   New
    async fireOnTurnBroadcast(params: any): Promise<any> {

        try {
            const tableResponse = await this.imdb.getTable(params.channelId);

            if (!tableResponse) {
                return {
                    success: false,
                    info: this.configMsg.FIREONTURNBROADCASTFAIL_BROADCASTHANDLER,
                    isRetry: false,
                    isDisplay: false,
                    channelId: ""
                };
            }

            const isValidMoveIndex = params.currentMoveIndex === '' ||
                params.currentMoveIndex === tableResponse.players[tableResponse.currentMoveIndex].seatIndex;

            if (!isValidMoveIndex) {
                return {
                    success: false,
                    info: this.configMsg.FIREONTURNBROADCASTFAIL_BROADCASTHANDLER,
                    isRetry: false,
                    isDisplay: false,
                    channelId: ""
                };
            }

            const validated = await validateKeySets("Request", "connector", "fireOnTurnBroadcast", params);

            if (!validated.success) {

                console.log(stateOfX.serverLogType.error, 'Error while sending on turn broadcast - ' + JSON.stringify(validated));

                return {
                    success: false,
                    info: this.configMsg.FIREONTURNBROADCASTFAIL_BROADCASTHANDLER + JSON.stringify(validated),
                    isRetry: false,
                    isDisplay: false,
                    channelId: ""
                };
            }

            const data = _.omit(params, 'self', 'channel', 'session');
            console.log(stateOfX.serverLogType.broadcast, "turn- " + JSON.stringify(data));

            if (params.sentFromReconnection) {
                const newData = _.omit(data, 'sentFromReconnection');
                const userData = {
                    playerId: params.originalPlayerId,
                    route: 'turn',
                    msg: {
                        ...newData,
                        route: "turn",
                    }
                };
                this.sendMessageToUser(userData);

                return { success: true };
            } else {
                params.channel.pushMessage("turn", data);
                data.route = "turn";

                const videoMessage = {
                    roundId: params.channel.roundId,
                    channelId: data.channelId,
                    type: stateOfX.videoLogEventType.broadcast,
                    data: data
                };

                await pomelo.app.rpc.database.videoGameRemote.createVideo('', videoMessage);

                data.playerAction = data.action;
                data.action = "turn";

                this.sendGeneralBroadCast(data);
                return { success: true };
            }
        } catch (err) {
            console.log(stateOfX.serverLogType.error, 'Unexpected error in fireOnTurnBroadcast - ' + JSON.stringify(err));
            return {
                success: false,
                info: this.configMsg.FIREONTURNBROADCASTFAIL_BROADCASTHANDLER + JSON.stringify(err),
                isRetry: false,
                isDisplay: false,
                channelId: ""
            };
        }
    };


    //   Old
    //   broadcastHandler.fireOnTurnBroadcast = function (params, cb) {
    //         console.log("cjjjjj2 fireOnTurnBroadcast", params)

    //         imdb.getTable(params.channelId, function (err, tableResponse) {
    //             if (!!tableResponse) {
    //                 if (params.currentMoveIndex == '' || params.currentMoveIndex === tableResponse.players[tableResponse.currentMoveIndex].seatIndex) {
    //                     keyValidator.validateKeySets("Request", "connector", "fireOnTurnBroadcast", params, function (validated) {
    //                         if (validated.success) {
    //                             let data = _.omit(params, 'self', 'channel', 'session');
    //                             serverLog(stateOfX.serverLogType.broadcast, "turn- " + JSON.stringify(_.omit(params, 'self', 'channel', 'session')));
    //                             if (params.sentFromReconnection) {
    //                                 let newData = _.omit(data, 'sentFromReconnection');
    //                                 let userData = {
    //                                     playerId: params.originalPlayerId,
    //                                     route: 'turn',
    //                                     msg: {
    //                                         ...newData,
    //                                         route: "turn",
    //                                     }
    //                                 }
    //                                 console.log("now sending private message turn", userData)
    //                                 broadcastHandler.sendMessageToUser(userData);
    //                                 cb({ success: true });
    //                             }
    //                             else {
    //                                 params.channel.pushMessage("turn", data);
    //                                 data.route = "turn";
    //                                 let videoMessage = {};
    //                                 videoMessage = { roundId: params.channel.roundId, channelId: data.channelId, type: stateOfX.videoLogEventType.broadcast, data: data };
    //                                 pomelo.app.rpc.database.videoGameRemote.createVideo('', videoMessage, function (videoResponse) {
    //                                 });
    //                                 // sending general broadcast using socket
    //                                 data.playerAction = data.action;
    //                                 data.action = "turn";
    //                                 sendGeneralBroadCast(data);
    //                                 cb({ success: true });
    //                             }
    //                         } else {
    //                             serverLog(stateOfX.serverLogType.error, 'Error while sending on turn broadcast - ' + JSON.stringify(validated))
    //                             cb({ success: false, info: configMsg.FIREONTURNBROADCASTFAIL_BROADCASTHANDLER + JSON.stringify(validated), isRetry: false, isDisplay: false, channelId: "" });
    //                         }
    //                     });
    //                 }
    //                 else {
    //                     cb({ success: false, info: configMsg.FIREONTURNBROADCASTFAIL_BROADCASTHANDLER, isRetry: false, isDisplay: false, channelId: "" });
    //                 }
    //             } else {
    //                 cb({ success: false, info: configMsg.FIREONTURNBROADCASTFAIL_BROADCASTHANDLER, isRetry: false, isDisplay: false, channelId: "" });
    //             }
    //         });
    //     }
    /*==========================  END  ========================*/


    /*==========================  START  ========================*/
    // Broadcast round over
    // PREFLOP, FLOP, TURN, RIVER got finished new start

    //   New
    async fireRoundOverBroadcast(params: any): Promise<any> {

        const validated = await validateKeySets("Request", "connector", "fireRoundOverBroadcast", params);

        if (validated.success) {
            const data = _.omit(params, 'self', 'channel');
            console.log(stateOfX.serverLogType.broadcast, "roundOver- " + JSON.stringify(data));

            if (params.sentFromReconnection) {
                const userData = {
                    playerId: params.playerId,
                    route: 'roundOver',
                    msg: {
                        channelId: params.channelId,
                        playerId: params.playerId,
                        success: true,
                        roundName: 'SHOWDOWN',
                        isEv: true,
                        route: "roundOver",
                        action: 'roundOver'
                    }
                };
                console.log("now sending private message roundOver", userData);
                this.sendMessageToUser(userData);
            } else {
                params.channel.pushMessage("roundOver", data);
                data.route = "roundOver";

                const videoMessage = {
                    roundId: params.channel.roundId,
                    channelId: data.channelId,
                    type: stateOfX.videoLogEventType.broadcast,
                    data: data
                };

                // Pomelo Connection
                await new Promise((resolve) => {
                    pomelo.app.rpc.database.videoGameRemote.createVideo('', videoMessage, () => resolve(null));
                });
                // Pomelo Connection

                data.action = 'roundOver';
                this.sendGeneralBroadCast(data);
            }
        } else {
            console.log(stateOfX.serverLogType.error, 'Error while sending sit broadcast - ' + JSON.stringify(validated));
        }
    };


    //   Old
    //   broadcastHandler.fireRoundOverBroadcast = function (params) {
    //         console.log("cjjjjj2 fireRoundOverBroadcast", params)
    //         keyValidator.validateKeySets("Request", "connector", "fireRoundOverBroadcast", params, function (validated) {
    //             if (validated.success) {
    //                 let data = _.omit(params, 'self', 'channel');
    //                 serverLog(stateOfX.serverLogType.broadcast, "roundOver- " + JSON.stringify(_.omit(params, 'self', 'channel')));
    //                 if (params.sentFromReconnection) {
    //                     let userData = {
    //                         playerId: params.playerId,
    //                         route: 'roundOver',
    //                         msg: {
    //                             channelId: params.channelId,
    //                             playerId: params.playerId,
    //                             success: true,
    //                             roundName: 'SHOWDOWN',
    //                             isEv: true,
    //                             route: "roundOver",
    //                             action: 'roundOver'
    //                         }
    //                     }
    //                     console.log("now sending private message roundOver", userData)
    //                     broadcastHandler.sendMessageToUser(userData);
    //                 }
    //                 else {
    //                     params.channel.pushMessage("roundOver", data);
    //                     data.route = "roundOver";
    //                     let videoMessage = {};
    //                     videoMessage = { roundId: params.channel.roundId, channelId: data.channelId, type: stateOfX.videoLogEventType.broadcast, data: data };
    //                     pomelo.app.rpc.database.videoGameRemote.createVideo('', videoMessage, function (videoResponse) {
    //                     });
    //                     // sending general broadcast using socket
    //                     data.action = 'roundOver';
    //                     sendGeneralBroadCast(data);
    //                 }
    //             } else {
    //                 serverLog(stateOfX.serverLogType.error, 'Error while sending sit broadcast - ' + JSON.stringify(validated))
    //             }
    //         });
    //     }
    /*==========================  END  ========================*/

    /*==========================  START  ========================*/
    // Player state broadcast to player only

    //   New
    // TypeScript version with async/await, no callbacks or Promises   
    async firePlayerStateBroadcast(params: any) {

        const validated = await validateKeySets(
            "Request",
            "connector",
            "firePlayerStateBroadcast",
            params
        );

        if (validated.success) {
            const data:any = {
                channelId: params.channelId,
                playerId: params.playerId,
                resetTimer: !!params.resetTimer,
                state: params.state,
            };

            console.log(
                stateOfX.serverLogType.broadcast,
                "playerState- " + JSON.stringify({
                    channelId: params.channelId,
                    playerId: params.playerId,
                    state: params.state,
                })
            );

            params.channel.pushMessage('playerState', data);

            data.route = "playerState";

            const videoMessage = {
                roundId: params.channel.roundId,
                channelId: params.channel.channelId,
                type: stateOfX.videoLogEventType.broadcast,
                data: data,
            };

            // Pomelo Connection
            await pomelo.app.rpc.database.videoGameRemote.createVideo(
                '',
                videoMessage
            );
            // Pomelo Connection

            // sending general broadcast using socket
            data.action = 'playerState';
            this.sendGeneralBroadCast(data);
        } else {
            console.log(
                stateOfX.serverLogType.error,
                'Error while sending player state broadcast - ' + JSON.stringify(validated)
            );
        }
    };


        // Old
    //   broadcastHandler.firePlayerStateBroadcast = function (params) {
    //         console.log("cjjjjj2 firePlayerStateBroadcast", params.playerId, params.state)
    //         keyValidator.validateKeySets("Request", "connector", "firePlayerStateBroadcast", params, function (validated) {
    //             if (validated.success) {
    //                 let data = { channelId: params.channelId, playerId: params.playerId, resetTimer: !!params.resetTimer, state: params.state, };
    //                 serverLog(stateOfX.serverLogType.broadcast, "playerState- " + JSON.stringify({ channelId: params.channelId, playerId: params.playerId, state: params.state }));
    //                 params.channel.pushMessage('playerState', data)
    //                 data.route = "playerState";
    //                 let videoMessage = {};
    //                 videoMessage = { roundId: params.channel.roundId, channelId: params.channel.channelId, type: stateOfX.videoLogEventType.broadcast, data: data };

    //                 pomelo.app.rpc.database.videoGameRemote.createVideo('', videoMessage, function (videoResponse) {
    //                 });
    //                 // sending general broadcast using socket
    //                 data.action = 'playerState';
    //                 sendGeneralBroadCast(data);
    //             } else {
    //                 serverLog(stateOfX.serverLogType.error, 'Error while sending player state broadcast - ' + JSON.stringify(validated))
    //             }
    //         });
    // }
    /*==========================  END  ========================*/



    /*==========================  START  ========================*/
    // Send player broadcast in order to display buyin popup
    // > In cases when player perform events when bankrupt

    //   New
    // TypeScript version with async/await, no callbacks or Promises
    async fireBankruptBroadcast(params: any) {

        const validated = await validateKeySets(
            "Request",
            "connector",
            "fireBankruptBroadcast",
            params
        );

        if (validated.success) {
            this.sendMessageToUser({
                self: {},
                playerId: params.playerId,
                msg: {
                    channelId: params.channelId,
                    playerId: params.playerId,
                    fromJoinWaitList: params.fromJoinWaitList
                },
                route: "bankrupt"
            });
        } else {
            console.log(
                stateOfX.serverLogType.error,
                'Error while sending player state broadcast - ' + JSON.stringify(validated)
            );
        }
    };


    //   Old
    // broadcastHandler.fireBankruptBroadcast = function (params) {
    //         console.log("sdfgfgsfg playfireBankruptBroadcaster is ,", params)
    //         keyValidator.validateKeySets("Request", "connector", "fireBankruptBroadcast", params, function (validated) {
    //             if (validated.success) {
    //                 broadcastHandler.sendMessageToUser({ self: {}, playerId: params.playerId, msg: { channelId: params.channelId, playerId: params.playerId, fromJoinWaitList: params.fromJoinWaitList }, route: "bankrupt" });
    //             } else {
    //                 serverLog(stateOfX.serverLogType.error, 'Error while sending player state broadcast - ' + JSON.stringify(validated))
    //             }
    //         });
    //     }
    /*==========================  END  ========================*/

    /*==========================  START  ========================*/
    // ### Fire player amount (that he has in game) broadcast to channel level
    // > If player have opted to add chips in the middle of the game

    //   New
    // TypeScript version with async/await, no callbacks or Promises
    async firePlayerCoinBroadcast(params: any) {
        const validated = await validateKeySets(
            "Request",
            "connector",
            "firePlayerCoinBroadcast",
            params
        );

        if (validated.success) {
            const data:any = {
                channelId: params.channelId,
                playerId: params.playerId,
                amount: params.amount,
            };

            console.log(
                stateOfX.serverLogType.broadcast,
                "playerCoins- " + JSON.stringify(data)
            );

            params.channel.pushMessage("playerCoins", data);

            data.route = "playerCoins";

            const videoMessage = {
                roundId: params.channel.roundId,
                channelId: data.channelId,
                type: stateOfX.videoLogEventType.broadcast,
                data: data,
            };

            // Pomelo Connection
            await pomelo.app.rpc.database.videoGameRemote.createVideo('', videoMessage);
            // Pomelo Connection

            // sending general broadcast using socket
            data.action = 'playerCoins';
            this.sendGeneralBroadCast(data);

            // Optional: If you want to use the videoHandler version instead
            // await videoHandler.createVideo(videoMessage);
        } else {
            console.log(
                stateOfX.serverLogType.error,
                'Error while sending player state broadcast - ' + JSON.stringify(validated)
            );
        }
    };


    //   Old
    //   broadcastHandler.firePlayerCoinBroadcast = function (params) {
    //         keyValidator.validateKeySets("Request", "connector", "firePlayerCoinBroadcast", params, function (validated) {
    //             if (validated.success) {
    //                 let data = { channelId: params.channelId, playerId: params.playerId, amount: params.amount };
    //                 serverLog(stateOfX.serverLogType.broadcast, "playerCoins- " + JSON.stringify({ channelId: params.channelId, playerId: params.playerId, amount: params.amount }));
    //                 params.channel.pushMessage("playerCoins", data);
    //                 data.route = "playerCoins";
    //                 let videoMessage = {};
    //                 videoMessage = { roundId: params.channel.roundId, channelId: data.channelId, type: stateOfX.videoLogEventType.broadcast, data: data };
    //                 pomelo.app.rpc.database.videoGameRemote.createVideo('', videoMessage, function (videoResponse) {

    //                 });
    //                 // sending general broadcast using socket
    //                 data.action = 'playerCoins';
    //                 sendGeneralBroadCast(data);
    //                 // videoHandler.createVideo({roundId: params.channel.roundId, channelId: data.channelId, type: stateOfX.videoLogEventType.broadcast, data: data}, function(res){});
    //             } else {
    //                 serverLog(stateOfX.serverLogType.error, 'Error while sending player state broadcast - ' + JSON.stringify(validated))
    //             }
    //         });
    //     }
    /*==========================  END  ========================*/


    /*==========================  START  ========================*/
    // Broadcast dealer chat to table
    //   New
    async fireDealerChat(params: any) {

        console.log(
            stateOfX.serverLogType.broadcast,
            "delaerChat- " + JSON.stringify({
                channelId: params.channelId,
                message: params.message,
            })
        );

        await new Promise(resolve => setTimeout(resolve, 2000));

        params.channel.pushMessage('delaerChat', {
            channelId: params.channelId,
            message: params.message,
        });

        // sending general broadcast using socket
        const broadcast = {
            action: 'delaerChat',
            channelId: params.channelId,
            message: params.message,
        };

        this.sendGeneralBroadCast(broadcast);
    };

    //   Old
    // broadcastHandler.fireDealerChat = function (params) {
    //         console.log("cjjjjj2 fireDealerChat", params)
    //         serverLog(stateOfX.serverLogType.broadcast, "delaerChat- " + JSON.stringify({ channelId: params.channelId, message: params.message }));
    //         setTimeout(function () {
    //             params.channel.pushMessage('delaerChat', { channelId: params.channelId, message: params.message });
    //             // sending general broadcast using socket
    //             let broadcast = {
    //                 action: 'delaerChat',
    //                 channelId: params.channelId,
    //                 message: params.message
    //             }
    //             sendGeneralBroadCast(broadcast);
    //         }, 2000);
    //         // }
    //     }
    /*==========================  END  ========================*/

    /*==========================  START  ========================*/
    // Player ev Chop broadcast to players

    //   New
    async evChop(params: any) {
        if (!params.channel) {
            const channel = pomelo.app.get('channelService').getChannel(params.channelId, false);
            console.log("find channel in evChop broadcastHandler", channel);
            params.channel = channel;
        }

        if (params.sentFromReconnection) {
            const userData = {
                playerId: params.evChop[0].playerId,
                route: 'evChop',
                msg: {
                    channelId: params.channelId,
                    playerId: params.evChop[0].playerId,
                    potAmount: params.evChop[0].potAmount,
                    evAmount: params.evChop[0].evAmount,
                    route: "evChop",
                    action: 'evChop',
                },
            };

            this.sendMessageToUser(userData);
        } else {
            const data: Record<string, any> = {};

            for (const ev of params.evChop) {
                data[ev.playerId] = {
                    channelId: params.channelId,
                    playerId: ev.playerId,
                    potAmount: ev.potAmount,
                    evAmount: ev.evAmount,
                    route: "evChop",
                };

                const videoMessage = {
                    roundId: params.channel!.roundId,
                    channelId: params.channelId,
                    type: stateOfX.videoLogEventType.broadcast,
                    data: data[ev.playerId],
                };

                // Pomelo Connection
                await pomelo.app.rpc.database.videoGameRemote.createVideo('', videoMessage);
                // Pomelo Connection

                // sending general broadcast using socket
                data[ev.playerId].action = 'evChop';
                this.sendPlayerBroadCast(data);
            }

            params.channel!.pushPrivateMessages('evChop', data);
        }
    };

    //   Old
    //   broadcastHandler.evChop = function (params) {
    //         if (!params.channel) {
    //             let channel = pomelo.app.get('channelService').getChannel(params.channelId, false);
    //             console.log("find channel in evChop broadcastHandler", channel)
    //             params.channel = channel;
    //         }
    //         if (params.sentFromReconnection) {
    //             let userData = {
    //                 playerId: params.evChop[0].playerId,
    //                 route: 'evChop',
    //                 msg: {
    //                     channelId: params.channelId,
    //                     playerId: params.evChop[0].playerId,
    //                     potAmount: params.evChop[0].potAmount,
    //                     evAmount: params.evChop[0].evAmount,
    //                     route: "evChop",
    //                     action: 'evChop'
    //                 }
    //             }
    //             console.log("now sending private message evChop", userData)
    //             broadcastHandler.sendMessageToUser(userData);
    //         }
    //         else {
    //             let data = {};
    //             for (let ev of params.evChop) {
    //                 data[ev.playerId] = { channelId: params.channelId, playerId: ev.playerId, potAmount: ev.potAmount, evAmount: ev.evAmount, route: "evChop" }
    //                 let videoMessage = { roundId: params.channel.roundId, channelId: params.channelId, type: stateOfX.videoLogEventType.broadcast, data: data[ev.playerId] };
    //                 pomelo.app.rpc.database.videoGameRemote.createVideo('', videoMessage, function (videoResponse) {
    //                 });
    //                 // sending general broadcast using socket
    //                 data[ev.playerId].action = 'evChop';
    //                 sendPlayerBroadCast(data);
    //             }
    //             params.channel.pushPrivateMessages('evChop', data)
    //         }
    //     }
    /*==========================  END  ========================*/
  
    /*==========================  START  ========================*/

    // New
    async evChopPercent(params: any) {

        if (!params.channel) {
            const channel = pomelo.app.get('channelService').getChannel(params.channelId, false);
            console.log("find channel in evChopPercent broadcastHandler", channel);
            params.channel = channel;
        }
    
        const data:any = {
            channelId: params.channelId,
            evChopPercent: [] as { playerId: string; evPercent: number }[],
        };
    
        for (const ev of params.evChop) {
            const obj = { playerId: ev.playerId, evPercent: ev.equity };
            data.evChopPercent.push(obj);
        }
    
        if (params.sentFromReconnection) {
            const userData = {
                playerId: params.playerId,
                route: 'evChopPercent',
                msg: {
                    channelId: params.channelId,
                    route: 'evChopPercent',
                    evChopPercent: data.evChopPercent,
                },
            };
            this.sendMessageToUser(userData);
        } else {
            params.channel!.pushMessage('evChopPercent', data);
            data.route = "evChopPercent";
    
            const videoMessage = {
                roundId: params.channel!.roundId,
                channelId: params.channelId,
                type: stateOfX.videoLogEventType.broadcast,
                data: data,
            };
    
            await pomelo.app.rpc.database.videoGameRemote.createVideo('', videoMessage);
    
            // sending general broadcast using socket
            data.action = 'evChopPercent';
            this.sendGeneralBroadCast(data);
        }
    };
    

        // Old
    //   broadcastHandler.evChopPercent = function (params) {
    //         console.log("cjjjjj2 evChop percent", params)
    //         if (!params.channel) {
    //             let channel = pomelo.app.get('channelService').getChannel(params.channelId, false);
    //             console.log("find channel in evChopPercent broadcastHandler", channel)
    //             params.channel = channel;
    //         }
    //         let data = { channelId: params.channelId, evChopPercent: [] };
    //         for (let ev of params.evChop) {
    //             let obj = { playerId: ev.playerId, evPercent: ev.equity }
    //             data.evChopPercent.push(obj);
    //         }

    //         if (params.sentFromReconnection) {
    //             let userData = {
    //                 playerId: params.playerId,
    //                 route: 'evChopPercent',
    //                 msg: {
    //                     channelId: params.channelId,
    //                     route: 'evChopPercent',
    //                     evChopPercent: data.evChopPercent
    //                 }
    //             }
    //             console.log("now sending private message", userData)
    //             broadcastHandler.sendMessageToUser(userData);
    //         }
    //         else {
    //             params.channel.pushMessage('evChopPercent', data)
    //             data.route = "evChopPercent";
    //             let videoMessage = { roundId: params.channel.roundId, channelId: params.channelId, type: stateOfX.videoLogEventType.broadcast, data: data };
    //             pomelo.app.rpc.database.videoGameRemote.createVideo('', videoMessage, function (videoResponse) {
    //             });
    //             // sending general broadcast using socket
    //             data.action = 'evChopPercent';
    //             sendGeneralBroadCast(data);
    //         }
    //     }
    /*==========================  END  ========================*/

    /*==========================  START  ========================*/
    // show evTag

    //   New
    async setEvTag(params: any) {

        if (!params.channel) {
            const channel = pomelo.app.get('channelService').getChannel(params.channelId, false);
            params.channel = channel;
        }

        if (params.sentFromReconnection) {
            const userData = {
                playerId: params.playerId,
                route: 'setEvTag',
                msg: {
                    channelId: params.channelId,
                    route: 'setEvTag',
                    action: 'setEvTag',
                    playerId: params.playerId,
                },
            };
            this.sendMessageToUser(userData);
        } else {
            const data:any = {
                channelId: params.channelId,
                playerId: params.playerId,
            };

            params.channel!.pushMessage('setEvTag', data);
            data.route = "setEvTag";

            const videoMessage = {
                roundId: params.channel!.roundId,
                channelId: params.channelId,
                type: stateOfX.videoLogEventType.broadcast,
                data: data,
            };

            await pomelo.app.rpc.database.videoGameRemote.createVideo('', videoMessage);

            // sending general broadcast using socket
            data.action = 'setEvTag';
            this.sendGeneralBroadCast(data);
        }
    };


    //   Old
    //   broadcastHandler.setEvTag = function (params) {
    //         console.log("cjjjjj2 setEvTag", params)
    //         if (!params.channel) {
    //             let channel = pomelo.app.get('channelService').getChannel(params.channelId, false);
    //             console.log("find channel in setEvTag broadcastHandler", channel)
    //             params.channel = channel;
    //         }

    //         if (params.sentFromReconnection) {
    //             let userData = {
    //                 playerId: params.playerId,
    //                 route: 'setEvTag',
    //                 msg: {
    //                     channelId: params.channelId,
    //                     route: 'setEvTag',
    //                     action: 'setEvTag',
    //                     playerId: params.playerId,
    //                 }
    //             }
    //             console.log("now sending private message setEvTag", userData)
    //             broadcastHandler.sendMessageToUser(userData);
    //         }
    //         else {
    //             let data = { channelId: params.channelId, playerId: params.playerId };
    //             params.channel.pushMessage('setEvTag', data)
    //             data.route = "setEvTag";
    //             let videoMessage = { roundId: params.channel.roundId, channelId: params.channelId, type: stateOfX.videoLogEventType.broadcast, data: data };
    //             pomelo.app.rpc.database.videoGameRemote.createVideo('', videoMessage, function (videoResponse) {
    //             });
    //             // sending general broadcast using socket
    //             data.action = 'setEvTag';
    //             sendGeneralBroadCast(data);
    //         }
    //     }
    /*==========================  END  ========================*/

    /*==========================  START  ========================*/
    // Player RIT after EV Chop broadcast to players

    //   New
    async ritEvChop(params: any) {

        if (!params.channel) {
            const channel = pomelo.app.get('channelService').getChannel(params.channelId, false);
            console.log("find channel in ritEvChop broadcastHandler", channel);
            params.channel = channel;
        }

        const paramsData = _.omit(params.data, 'restPlayers');
        console.log("paramsData in EvRIT is", paramsData);

        if (params.sentFromReconnection) {
            const userData = {
                playerId: paramsData.playerId,
                route: 'evRIT',
                msg: {
                    route: 'evRIT',
                    action: 'evRIT',
                    ...paramsData,
                },
            };
            console.log("now sending private message evRIT", userData);
            this.sendMessageToUser(userData);
        } else {
            const data: Record<string, any> = {};
            data[paramsData.playerId] = {
                ...paramsData,
                route: 'evRIT',
            };

            params.channel!.pushPrivateMessages('evRIT', data);
            console.log("finalData in EvRIT is", data);

            const videoMessage = {
                roundId: params.channel!.roundId,
                channelId: paramsData.channelId,
                type: stateOfX.videoLogEventType.broadcast,
                data: data[paramsData.playerId],
            };

            // Pomelo Connection
            await pomelo.app.rpc.database.videoGameRemote.createVideo('', videoMessage);
            // Pomelo Connection

            // sending general broadcast using socket
            data[paramsData.playerId].action = 'evRIT';
            this.sendPlayerBroadCast(data);
        }
    };


    //   Old
    //   broadcastHandler.ritEvChop = function (params) {
    //         console.trace("cjjjjj2 rit evChop", params)
    //         if (!params.channel) {
    //             let channel = pomelo.app.get('channelService').getChannel(params.channelId, false);
    //             console.log("find channel in ritEvChop broadcastHandler", channel)
    //             params.channel = channel;
    //         }
    //         let paramsData = _.omit(params.data, 'restPlayers');
    //         console.log("paramsData in EvRIT is", paramsData)

    //         if (params.sentFromReconnection) {
    //             let userData = {
    //                 playerId: paramsData.playerId,
    //                 route: 'evRIT',
    //                 msg: {
    //                     route: 'evRIT',
    //                     action: 'evRIT',
    //                     ...paramsData
    //                 }
    //             }
    //             console.log("now sending private message evRIT", userData)
    //             broadcastHandler.sendMessageToUser(userData);
    //         }
    //         else {
    //             let data = {};
    //             data[paramsData.playerId] = paramsData;
    //             data[paramsData.playerId].route = 'evRIT';
    //             params.channel.pushPrivateMessages('evRIT', data)
    //             console.log("finalData in EvRIT is", data)
    //             let videoMessage = { roundId: params.channel.roundId, channelId: paramsData.channelId, type: stateOfX.videoLogEventType.broadcast, data: data[paramsData.playerId] };
    //             pomelo.app.rpc.database.videoGameRemote.createVideo('', videoMessage, function (videoResponse) {
    //             });
    //             // sending general broadcast using socket
    //             data[paramsData.playerId].action = 'evRIT';
    //             sendPlayerBroadCast(data);
    //         }
    //     }
    /*==========================  END  ========================*/

    /*==========================  START  ========================*/
    // Leave barodcast to channel

    //   New
    async fireLeaveBroadcast(params: any) {

        const validated = await validateKeySets("Request", "connector", "fireLeaveBroadcast", params);
        
        if (validated.success) {

            params.channel.pushMessage("leave", params.data);
            params.data.route = "leave";

            const videoMessage = {
                roundId: params.channel.roundId,
                channelId: params.data.channelId,
                type: stateOfX.videoLogEventType.broadcast,
                data: params.data,
            };

            // Pomelo Connection
            await pomelo.app.rpc.database.videoGameRemote.createVideo('', videoMessage);
            // Pomelo Connection

            params.data.action = 'leave';

            // sending general broadcast using socket
            this.sendGeneralBroadCast(params.data);
        } else {
            console.log(stateOfX.serverLogType.error, 'Error while sending leave broadcast - ' + JSON.stringify(validated));
        }
    };


    //   Old
    //   broadcastHandler.fireLeaveBroadcast = function (params) {
    //         console.trace("leave broadcast", params)
    //         keyValidator.validateKeySets("Request", "connector", "fireLeaveBroadcast", params, function (validated) {
    //             if (validated.success) {
    //                 console.trace(stateOfX.serverLogType.info, "leave broadcast data --" + JSON.stringify(params.data));
    //                 console.log(stateOfX.serverLogType.broadcast, "leave- " + JSON.stringify(params.data));
    //                 console.log(stateOfX.serverLogType.info, '----- Leave Broadcast Fired --------');
    //                 params.channel.pushMessage("leave", params.data);
    //                 params.data.route = "leave";
    //                 let videoMessage = {};
    //                 videoMessage = { roundId: params.channel.roundId, channelId: params.data.channelId, type: stateOfX.videoLogEventType.broadcast, data: params.data };
    //                 pomelo.app.rpc.database.videoGameRemote.createVideo('', videoMessage, function (videoResponse) {
    //                 });
    //                 params.data.action = 'leave';
    //                 // sending general broadcast using socket
    //                 sendGeneralBroadCast(params.data);
    //                 // videoHandler.createVideo({roundId: params.channel.roundId, channelId: params.data.channelId, type: stateOfX.videoLogEventType.broadcast, data: params.data}, function(res){});
    //             } else {
    //                 console.log(stateOfX.serverLogType.error, 'Error while sending leave broadcast - ' + JSON.stringify(validated))
    //             }
    //         });
    //     }
    /*==========================  END  ========================*/

    /*==========================  START  ========================*/
    // ### Broadcast game over
    // also finishes video json record

    //   New
    async fireGameOverBroadcast(params: any) {
        const validated = await validateKeySets("Request", "connector", "fireGameOverBroadcast", params);

        if (validated.success) {
            const data = _.omit(params, 'self', 'channel', 'session');

            await new Promise(resolve => setTimeout(resolve, Number(systemConfig.gameOverBroadcastDelay) * 1000));

            params.channel.pushMessage("gameOver", data);
            data.route = "gameOver";

            const videoMessage = {
                roundId: params.channel.roundId,
                channelId: data.channelId,
                type: stateOfX.videoLogEventType.broadcast,
                data: data,
            };

            // Pomelo Connection
            await pomelo.app.rpc.database.videoGameRemote.createVideo('', videoMessage);
            await pomelo.app.rpc.room.roomRemote.storeHandHistory(pomelo, { session: {}, channelId: params.channelId });
            // Pomelo Connection

            data.action = 'gameOver';
            this.sendGeneralBroadCast(data);
        } else {
            console.log(stateOfX.serverLogType.error, 'Error while sending game over broadcast - ' + JSON.stringify(validated));
        }
    };


    //   Old
    //   broadcastHandler.fireGameOverBroadcast = function (params) {
    //         // console.log("cjjjjj2 fireGameOverBroadcast", params)

    //         keyValidator.validateKeySets("Request", "connector", "fireGameOverBroadcast", params, function (validated) {
    //             if (validated.success) {
    //                 let data = _.omit(params, 'self', 'channel', 'session');
    //                 serverLog(stateOfX.serverLogType.info, "Game over broadcast will be fired after a delay of " + parseInt(systemConfig.gameOverBroadcastDelay) + " seconds.");
    //                 setTimeout(function () {
    //                     serverLog(stateOfX.serverLogType.broadcast, "gameOver- " + JSON.stringify(_.omit(params, 'self', 'channel', 'session')));
    //                     params.channel.pushMessage("gameOver", data);
    //                     data.route = "gameOver";
    //                     let videoMessage = {};
    //                     videoMessage = { roundId: params.channel.roundId, channelId: data.channelId, type: stateOfX.videoLogEventType.broadcast, data: data };
    //                     pomelo.app.rpc.database.videoGameRemote.createVideo('', videoMessage, function (videoResponse) {
    //                         pomelo.app.rpc.room.roomRemote.storeHandHistory(pomelo, { session: {}, channelId: params.channelId }, function (err, res) {
    //                         });
    //                     });
    //                     data.action = 'gameOver';
    //                     // sending general broadcast using socket
    //                     sendGeneralBroadCast(data);
    //                 }, parseInt(systemConfig.gameOverBroadcastDelay) * 1000)
    //             } else {
    //                 serverLog(stateOfX.serverLogType.error, 'Error while sending game over broadcast - ' + JSON.stringify(validated))
    //             }
    //         });
    //     }
    /*==========================  END  ========================*/

    /*==========================  START  ========================*/
    // from revertLockedHandler

    //   New
    generalGameOverAfterRevert(params: any) {
        const data = {
            action: 'gameOver',
            channelId: params.channelId,
            winners: params.winners,
        };

        params.channel.pushMessage('gameOver', {
            channelId: params.channelId,
            winners: params.winners,
        });

        this.sendGeneralBroadCast(data);
    };

    // Old
    //   broadcastHandler.generalGameOverAfterRevert = function (params) {
    //         let data = {
    //             action: 'gameOver',
    //             channelId: params.channelId,
    //             winners: params.winners,
    //         }
    //         params.channel.pushMessage('gameOver', { channelId: params.channelId, winners: params.winners });
    //         sendGeneralBroadCast(data)
    //     }
    /*==========================  END  ========================*/


    /*==========================  START  ========================*/

    // New
    async fireGameVariationBroadcast(params: any) {
        const validated = await validateKeySets("Request", "connector", "fireGameVariationBroadcast", params);
        
        if (validated.success) {
            const data = _.omit(params, 'self', 'channel', 'session');
            params.channel.pushMessage("getRoeRoundInfo", data);
            data.action = 'getRoeRoundInfo';
            this.sendGeneralBroadCast(data);
            data.route = "getRoeRoundInfo";
        } else {
            console.log(stateOfX.serverLogType.error, 'Error while sending game over broadcast - ' + JSON.stringify(validated));
        }
    };
    

    // Old
    //   broadcastHandler.fireGameVariationBroadcast = function (params) {
    //         keyValidator.validateKeySets("Request", "connector", "fireGameVariationBroadcast", params, function (validated) {
    //             if (validated.success) {
    //                 let data = _.omit(params, 'self', 'channel', 'session');
    //                 params.channel.pushMessage("getRoeRoundInfo", data);
    //                 data.action = 'getRoeRoundInfo';
    //                 // sending general broadcast using socket
    //                 sendGeneralBroadCast(data);
    //                 data.route = "getRoeRoundInfo";
    //             } else {
    //                 serverLog(stateOfX.serverLogType.error, 'Error while sending game over broadcast - ' + JSON.stringify(validated))
    //             }
    //         });
    //     }
    /*==========================  END  ========================*/


    /*==========================  START  ========================*/

    // New
    async fireROEGameVariationBroadcast(params: any) {
        const validated = await validateKeySets("Request", "connector", "fireROEGameVariationBroadcast", params);
    
        if (validated.success) {
            const data = _.omit(params, 'self', 'channel', 'session');
            params.channel.pushMessage("getRoeVariationInfo", data);
            data.action = 'getRoeVariationInfo';
            this.sendGeneralBroadCast(data);
            data.route = "getRoeVariationInfo";
        } else {
            console.log(stateOfX.serverLogType.error, 'Error while sending game over broadcast - ' + JSON.stringify(validated));
        }
    };
    

    // Old
//   broadcastHandler.fireROEGameVariationBroadcast = function (params) {
//         keyValidator.validateKeySets("Request", "connector", "fireROEGameVariationBroadcast", params, function (validated) {
//             if (validated.success) {
//                 let data = _.omit(params, 'self', 'channel', 'session');
//                 params.channel.pushMessage("getRoeVariationInfo", data);
//                 data.action = 'getRoeVariationInfo';
//                 // sending general broadcast using socket
//                 sendGeneralBroadCast(data);
//                 data.route = "getRoeVariationInfo";
//             } else {
//                 serverLog(stateOfX.serverLogType.error, 'Error while sending game over broadcast - ' + JSON.stringify(validated))
//             }
//         });
//     }
    /*==========================  END  ========================*/



    /*==========================  START  ========================*/
    // Fire precheck broadcast to individual players
    // USE CUSTOM MADE - channel.pushPrivateMessages in pomelo/.../channelService

    //   New
    async firePrecheckBroadcast(params: any) {
        let prechecks: { [playerId: string]: any } = {};

        for (let i = 0; i < params.length; i++) {
            let precheck = params[i];
            prechecks[precheck.playerId] = {
                channelId: params.channelId,
                playerId: precheck.playerId,
                set: precheck.set,
                precheckValue: precheck.precheckValue,
                route: "preCheck",
                action: "preCheck"
            };

            let videoMessage = {
                roundId: params.channel.roundId,
                channelId: params.channelId,
                type: stateOfX.videoLogEventType.broadcast,
                data: prechecks[precheck.playerId]
            };

            await pomelo.app.rpc.database.videoGameRemote.createVideoAsync('', videoMessage);

            // sending player broadcast using socket
            let broadcast = prechecks[precheck.playerId];
            this.sendPlayerBroadCast(broadcast);
        }

        params.channel.pushPrivateMessages("preCheck", prechecks);
    };

    
    //   Old
    //   broadcastHandler.firePrecheckBroadcast = function (params) {
    //         console.log('.pushPrecheck - called12141616', params)
    //         let prechecks = {};
    //         for (let i = 0; i < params.length; i++) {
    //             let precheck = params[i];
    //             prechecks[precheck.playerId] = { channelId: params.channelId, playerId: precheck.playerId, set: precheck.set, precheckValue: precheck.precheckValue };
    //             prechecks[precheck.playerId].route = "preCheck";
    //             let videoMessage = {};
    //             videoMessage = { roundId: params.channel.roundId, channelId: params.channelId, type: stateOfX.videoLogEventType.broadcast, data: prechecks[precheck.playerId] };
    //             prechecks[precheck.playerId].action = "preCheck";
    //             pomelo.app.rpc.database.videoGameRemote.createVideo('', videoMessage, function (videoResponse) {

    //             });
    //             // sending player broadcast using socket
    //             let broadcast = prechecks[precheck.playerId];
    //             sendPlayerBroadCast(broadcast);
    //             // videoHandler.createVideo({roundId: params.channel.roundId, channelId: params.channelId, type: stateOfX.videoLogEventType.broadcast, data: prechecks[precheck.playerId]}, function(res){});
    //         }
    //         params.channel.pushPrivateMessages("preCheck", prechecks);
    //     }
    /*==========================  END  ========================*/
  
  
    /*==========================  START  ========================*/
    // New
    async fireCustomBestHandBroadcast(params: any) {
        const { bestHand } = params;

        const message = {
            channelId: params.channelId,
            playerId: bestHand.playerId,
            bestHand: bestHand.bestHand,
            route: "bestHands",
            action: "bestHands"
        };
    
        const messages: { [playerId: string]: typeof message } = {
            [bestHand.playerId]: message
        };
    
        params.channel.pushPrivateMessages("bestHands", messages);
        this.sendPlayerBroadCast(message);
    };    

    // Old
    //   broadcastHandler.fireCustomBestHandBroadcast = function (params) {
    //         bestHands[bestHand.playerId] = { channelId: params.channelId, playerId: bestHand.playerId, bestHand: bestHand.bestHand }
    //         bestHands[bestHand.playerId].route = "bestHands";
    //         params.channel.pushPrivateMessages("bestHands", bestHands);
    //         bestHands[bestHand.playerId].action = "bestHands";
    //         // sending player broadcast using socket
    //         sendPlayerBroadCast(bestHands[bestHand.playerId]);
    //     }
    /*==========================  END  ========================*/


    /*==========================  START  ========================*/
    // Fire best hand broadcast to individual players
    // USE CUSTOM MADE - channel.pushPrivateMessages in pomelo/.../channelService

    //   New
    async fireBestHandBroadcast(params: any) {
        const bestHands: { [playerId: string]: any } = {};

        for (let i = 0; i < params.length; i++) {
            const bestHand = params[i];
            const playerData = {
                channelId: params.channelId,
                playerId: bestHand.playerId,
                bestHand: bestHand.bestHand,
                route: "bestHands",
                action: "bestHands"
            };

            bestHands[bestHand.playerId] = playerData;

            const videoMessage = {
                roundId: params.channel.roundId,
                channelId: params.channelId,
                type: stateOfX.videoLogEventType.broadcast,
                data: playerData
            };

            // Pomelo Connection
            await pomelo.app.rpc.database.videoGameRemote.createVideo('', videoMessage);
            // Pomelo Connection

            this.sendPlayerBroadCast(playerData);
        }

        console.log('besthandsf', bestHands);
        params.channel.pushPrivateMessages("bestHands", bestHands);
    };

    //   Old
    //   broadcastHandler.fireBestHandBroadcast = function (params) {

    //         let bestHands = {};
    //         for (let i = 0; i < params.length; i++) {
    //             let bestHand = params[i];
    //             bestHands[bestHand.playerId] = { channelId: params.channelId, playerId: bestHand.playerId, bestHand: bestHand.bestHand }
    //             bestHands[bestHand.playerId].route = "bestHands";
    //             let videoMessage = {};
    //             videoMessage = { roundId: params.channel.roundId, channelId: params.channelId, type: stateOfX.videoLogEventType.broadcast, data: bestHands[bestHand.playerId] };
    //             pomelo.app.rpc.database.videoGameRemote.createVideo('', videoMessage, function (videoResponse) {

    //             });
    //             bestHands[bestHand.playerId].action = "bestHands";
    //             // sending player broadcast using socket
    //             sendPlayerBroadCast(bestHands[bestHand.playerId]);
    //             // videoHandler.createVideo({roundId: params.channel.roundId, channelId: params.channelId, type: stateOfX.videoLogEventType.broadcast, data: bestHands[bestHand.playerId]}, function(res){});
    //         }
    //         console.log('besthandsf', bestHands)
    //         params.channel.pushPrivateMessages("bestHands", bestHands);
    //     }
    /*==========================  END  ========================*/


    /*==========================  START  ========================*/
    // broadcast megapoints to each player seperate after game over
    // USE CUSTOM MADE - channel.pushPrivateMessages in pomelo/.../channelService
    pushMegaPoints(params) {
            if (params.channel) {
                params.channel.pushPrivateMessages("megaPoints", params.data);
                params.data.action = 'megaPoints';
                // sending player broadcast using socket
                this.sendPlayerBroadCast(params.data);
            }
        }
    /*==========================  END  ========================*/

    /*==========================  START  ========================*/
    // General info broadcast to client (player level)

    //   New
    async fireInfoBroadcastToPlayer(params: any) {
        try {
            const validated = await validateKeySets("Request", "connector", "fireInfoBroadcastToPlayer", params);

            if (validated.success) {
                const channel = params.channel || pomelo.app.get('channelService').getChannel(params.channelId, false);
                const msgs = {
                    [params.playerId]: {
                        heading: params.heading,
                        info: params.info,
                        channelId: params.channelId,
                        playerId: params.playerId,
                        buttonCode: params.buttonCode
                    }
                };

                this.sendMessageToUser({
                    self: {},
                    playerId: params.playerId,
                    serverId: params.serverId,
                    msg: {
                        heading: params.heading,
                        info: params.info,
                        channelId: params.channelId,
                        playerId: params.playerId,
                        buttonCode: params.buttonCode
                    },
                    route: "playerInfo"
                });
            } else {
                console.log(stateOfX.serverLogType.error, 'Error while sending info broadcast to player - ' + JSON.stringify(validated));
            }
        } catch (error) {
            console.log(stateOfX.serverLogType.error, 'Error in fireInfoBroadcastToPlayer - ' + error.message);
        }
    };

    //   Old
    //   broadcastHandler.fireInfoBroadcastToPlayer = function (params) {
    //         //console.error("I have to be fired fro here always for leave waiting list", params);
    //         keyValidator.validateKeySets("Request", "connector", "fireInfoBroadcastToPlayer", params, function (validated) {
    //             if (validated.success) {
    //                 let channel = params.channel || pomelo.app.get('channelService').getChannel(params.channelId, false);
    //                 let msgs = {};
    //                 msgs[params.playerId] = { heading: params.heading, info: params.info, channelId: params.channelId, playerId: params.playerId, buttonCode: params.buttonCode };
    //                 broadcastHandler.sendMessageToUser({ self: {}, playerId: params.playerId, serverId: params.serverId, msg: { heading: params.heading, info: params.info, channelId: params.channelId, playerId: params.playerId, buttonCode: params.buttonCode }, route: "playerInfo" });
    //             } else {
    //                 serverLog(stateOfX.serverLogType.error, 'Error while sending info broadcast to player - ' + JSON.stringify(validated))
    //             }
    //         });
    //     }
    /*==========================  END  ========================*/

    /*==========================  START  ========================*/
    // jwl remove from dashboard 

    //   New
    async removePlayerFromJWL(params: any) {
        const data = {
            action: 'removePlayerFromJWL',
            channelId: params.channelId,
            playerId: params.playerId,
            isRemoveJWL: params.isRemoveJWL,
            route: params.route
        };

        // Push the private message to the channel
        params.channel.pushPrivateMessages("removePlayerFromJWL", { [params.playerId]: data });

        // Send a player broadcast
        this.sendPlayerBroadCast(data);
    };

    //   Old
    //   broadcastHandler.removePlayerFromJWL = function (params) {
    //         let data = {
    //             action: 'removePlayerFromJWL',
    //             channelId: params.channelId,
    //             playerId: params.playerId,
    //             isRemoveJWL: params.isRemoveJWL,
    //             route: params.route
    //         }
    //         params.channel.pushPrivateMessages("removePlayerFromJWL", { [params.playerId]: data });
    //         sendPlayerBroadCast(data)
    //     }
    /*==========================  END  ========================*/

    /*==========================  START  ========================*/
    // from revertLockedHandler 

    //   New
    async generalPlayerInfoAfterRevert(params: any) {
        // Set info to either params.info or params.broadcastMessage if info is not provided
        params.info = params.info || params.broadcastMessage;

        const data = {
            action: 'playerInfo',
            channelId: params.channelId,
            heading: params.heading,
            info: params.info
        };

        // If not broadcast from admin, push the message to the channel
        if (!params.broadcastFromAdmin) {
            params.channel.pushMessage('playerInfo', { channelId: params.channelId, heading: params.heading, info: params.info });
        }

        // Send the general broadcast using socket
        this.sendGeneralBroadCast(data);
    };

    //   Old
    // broadcastHandler.generalPlayerInfoAfterRevert = function (params) {
    //         params.info = params.info ? params.info : params.broadcastMessage
    //         let data = {
    //             action: 'playerInfo',
    //             channelId: params.channelId,
    //             heading: params.heading,
    //             info: params.info
    //         }
    //         if (!params.broadcastFromAdmin) {
    //             params.channel.pushMessage('playerInfo', { channelId: params.channelId, heading: params.heading, info: params.info });
    //         }
    //         sendGeneralBroadCast(data)
    //     }
    /*==========================  END  ========================*/

    /*==========================  START  ========================*/
    // General info broadcast to client (channel level)

    //   New
    async fireInfoBroadcastToChannel(params: any) {
        const validated = await validateKeySets("Request", "connector", "fireInfoBroadcastToChannel", params);
        
        if (validated.success) {
            params.channel.pushMessage("channelInfo", { heading: params.heading, info: params.info, channelId: params.channelId });

            const broadcast = {
                action: 'channelInfo',
                heading: params.heading,
                info: params.info,
                channelId: params.channelId
            };

            this.sendGeneralBroadCast(broadcast);
        } else {
            console.log(stateOfX.serverLogType.error, 'Error while sending info broadcast on channel - ' + JSON.stringify(validated));
        }
    };


    //   Old
    // broadcastHandler.fireInfoBroadcastToChannel = function (params) {
    //         keyValidator.validateKeySets("Request", "connector", "fireInfoBroadcastToChannel", params, function (validated) {
    //             if (validated.success) {
    //                 serverLog(stateOfX.serverLogType.broadcast, "channelInfo- " + JSON.stringify({ heading: params.heading, info: params.info, channelId: params.channelId }));
    //                 params.channel.pushMessage("channelInfo", { heading: params.heading, info: params.info, channelId: params.channelId });
    //                 // sending general broadcast using socket
    //                 let broadcast = {
    //                     action: 'channelInfo',
    //                     heading: params.heading,
    //                     info: params.info,
    //                     channelId: params.channelId
    //                 }
    //                 sendGeneralBroadCast(broadcast);
    //             } else {
    //                 serverLog(stateOfX.serverLogType.error, 'Error while sending info broadcast on channel - ' + JSON.stringify(validated))
    //             }
    //         });
    //     }
    /*==========================  END  ========================*/

    /*==========================  START  ========================*/
    // Broadcast chat message to any channel

    //   New
    async fireChatBroadcast(params: any) {
        const validated = await validateKeySets("Request", "connector", "fireChatBroadcast", params);

        if (validated.success) {
            const chatData = {
                channelId: params.channelId,
                playerId: params.playerId,
                playerName: params.playerName,
                message: params.message
            };

            console.log(stateOfX.serverLogType.broadcast, "chat- " + JSON.stringify(chatData));
            params.channel.pushMessage('chat', chatData);

            const broadcast = {
                ...chatData,
                action: 'chat'
            };

            this.sendGeneralBroadCast(broadcast);
        } else {
            console.log(stateOfX.serverLogType.error, 'Error while sending info broadcast on channel - ' + JSON.stringify(validated));
        }
    };

    //   Old
    //   broadcastHandler.fireChatBroadcast = function (params) {
    //         keyValidator.validateKeySets("Request", "connector", "fireChatBroadcast", params, function (validated) {
    //             if (validated.success) {
    //                 serverLog(stateOfX.serverLogType.broadcast, "chat- " + JSON.stringify({ channelId: params.channelId, playerId: params.playerId, playerName: params.playerName, message: params.message }));
    //                 params.channel.pushMessage('chat', { channelId: params.channelId, playerId: params.playerId, playerName: params.playerName, message: params.message });
    //                 // sending general broadcast using socket
    //                 let broadcast = {
    //                     action: 'chat',
    //                     channelId: params.channelId,
    //                     playerId: params.playerId,
    //                     playerName: params.playerName,
    //                     message: params.message
    //                 }
    //                 sendGeneralBroadCast(broadcast);
    //             } else {
    //                 serverLog(stateOfX.serverLogType.error, 'Error while sending info broadcast on channel - ' + JSON.stringify(validated))
    //             }
    //         });
    //     }
    /*==========================  END  ========================*/

    /*==========================  START  ========================*/
    // Add a new hand history row into hand tab to all player on table

    //   New
    async fireHandtabBroadcast(params: any) {
        const validated = await validateKeySets("Request", "connector", "fireHandtabBroadcast", params);

        if (validated.success) {
            const handTabData = {
                channelId: params.channelId,
                handTab: params.handTab
            };

            console.log(stateOfX.serverLogType.broadcast, "handTab- " + JSON.stringify(handTabData));

            params.channel.pushMessage('handTab', handTabData);

            const broadcast = {
                ...handTabData,
                action: 'handTab'
            };

            this.sendGeneralBroadCast(broadcast);
        } else {
            console.log(stateOfX.serverLogType.error, 'Error while sending hand tab broadcast on channel - ' + JSON.stringify(validated));
        }
    };


    //   Old
    //   broadcastHandler.fireHandtabBroadcast = function (params) {
    //         keyValidator.validateKeySets("Request", "connector", "fireHandtabBroadcast", params, function (validated) {
    //             if (validated.success) {
    //                 serverLog(stateOfX.serverLogType.broadcast, "handTab- " + JSON.stringify({ channelId: params.channelId, handTab: params.handTab }));
    //                 params.channel.pushMessage('handTab', { channelId: params.channelId, handTab: params.handTab });
    //                 // sending general broadcast using socket
    //                 let broadcast = {
    //                     action: 'handTab',
    //                     channelId: params.channelId,
    //                     handTab: params.handTab
    //                 }
    //                 sendGeneralBroadCast(broadcast);
    //             } else {
    //                 serverLog(stateOfX.serverLogType.error, 'Error while sending hand tab broadcast on channel - ' + JSON.stringify(validated))
    //             }
    //         });
    //     }
    /*==========================  END  ========================*/


    /*==========================  START  ========================*/
    // Fire connection acknowledgement broadcast on session

    //   New
    async fireAckBroadcastOnLogin(params: any) {
        const validated = await validateKeySets("Request", "connector", "fireAckBroadcastOnLogin", params);

        if (validated.success) {
            this.sendMessageToUser({
                self: {},
                playerId: params.playerId,
                serverId: params.serverId,
                msg: { playerId: params.playerId, data: params.data },
                route: "isConnectedOnLogin"
            });
        } else {
            console.log(stateOfX.serverLogType.error, 'Error while fireAckBroadcastOnLogin - ' + JSON.stringify(validated));
        }
    };


    //   Old
    //   broadcastHandler.fireAckBroadcastOnLogin = function (params) {
    //         keyValidator.validateKeySets("Request", "connector", "fireAckBroadcastOnLogin", params, function (validated) {
    //             if (validated.success) {
    //                 broadcastHandler.sendMessageToUser({ self: {}, playerId: params.playerId, serverId: params.serverId, msg: { playerId: params.playerId, data: params.data }, route: "isConnectedOnLogin" });
    //             } else {
    //                 serverLog(stateOfX.serverLogType.error, 'Error while fireAckBroadcastOnLogin - ' + JSON.stringify(validated));
    //             }
    //         })
    //     }
    /*==========================  END  ========================*/


    /*==========================  START  ========================*/
    // sends a broadcast to single player - dynamic route
    // params contains data, playerId, route

    //   New
    async sendCustomMessageToUser(params: any) {
        const validated = await validateKeySets("Request", "connector", "sendCustomMessageToUser", params);

        if (validated.success) {
            this.sendMessageToUser({
                self: {},
                playerId: params.playerId,
                msg: { playerId: params.playerId, data: params.data },
                route: params.route
            });
        } else {
            console.log(stateOfX.serverLogType.error, 'Error while sendCustomMessageToUser - ' + JSON.stringify(validated));
        }
    };


    //   Old
    //   broadcastHandler.sendCustomMessageToUser = function (params) {
    //         keyValidator.validateKeySets("Request", "connector", "sendCustomMessageToUser", params, function (validated) {
    //             if (validated.success) {
    //                 broadcastHandler.sendMessageToUser({ self: {}, playerId: params.playerId, msg: { playerId: params.playerId, data: params.data }, route: params.route });
    //             } else {
    //                 serverLog(stateOfX.serverLogType.error, 'Error while sendCustomMessageToUser - ' + JSON.stringify(validated));
    //             }
    //         })
    //     }
    /*==========================  END  ========================*/

    /*==========================  START  ========================*/
    // ### Broadcast delaer chat disabled in case of ALLIN

    //   New
    async fireChatDisabled(params: any) {

        const validated = await validateKeySets("Request", "connector", "fireChatDisabled", params);

        if (validated.success) {

            params.channel.pushMessage('disableChat', { channelId: params.channelId });

            const broadcast = {
                action: 'disableChat',
                channelId: params.channelId,
            };

            this.sendGeneralBroadCast(broadcast);
        } else {
            console.log(stateOfX.serverLogType.error, 'Error while sending player state broadcast - ' + JSON.stringify(validated));
        }
    };

    //   Old
    //   broadcastHandler.fireChatDisabled = function (params) {
    //         keyValidator.validateKeySets("Request", "connector", "fireChatDisabled", params, function (validated) {
    //             if (validated.success) {
    //                 serverLog(stateOfX.serverLogType.broadcast, "disableChat- " + JSON.stringify({ channelId: params.channelId }));
    //                 params.channel.pushMessage('disableChat', { channelId: params.channelId })
    //                 // sending general broadcast using socket
    //                 let broadcast = {
    //                     action: 'disableChat',
    //                     channelId: params.channelId,
    //                 }
    //                 sendGeneralBroadCast(broadcast);
    //             } else {
    //                 serverLog(stateOfX.serverLogType.error, 'Error while sending player state broadcast - ' + JSON.stringify(validated))
    //             }
    //         });
    //     }
    /*==========================  END  ========================*/

    /*==========================  START  ========================*/
    // ### Fire time bank timer start notification to players

    //   New
    async startTimeBank(params: any) {
        const validated = await validateKeySets("Request", "connector", "fireStartTimeBank", params);

        if (validated.success) {
            let data = { ...params };
            delete data.channel;

            params.channel.pushMessage('startTimeBank', data);
            data.route = "startTimeBank";

            let videoMessage = {
                roundId: params.channel.roundId,
                channelId: params.channel.channelId,
                type: stateOfX.videoLogEventType.broadcast,
                data: data,
            };

            // Pomelo Connection
            // Call video creation without using callback
            await pomelo.app.rpc.database.videoGameRemote.createVideo('', videoMessage);
            // Pomelo Connection

            data.action = 'startTimeBank';

            // Sending general broadcast using socket
            this.sendGeneralBroadCast(data);
        } else {
            console.log(stateOfX.serverLogType.error, 'Error while sending start timebank broadcast - ' + JSON.stringify(validated));
        }
    };


    //   Old
    //   broadcastHandler.startTimeBank = function (params) {

    //         keyValidator.validateKeySets("Request", "connector", "fireStartTimeBank", params, function (validated) {
    //             if (validated.success) {
    //                 let data = _.omit(params, 'channel');
    //                 serverLog(stateOfX.serverLogType.broadcast, "startTimeBank- " + JSON.stringify(_.omit(params, 'channel')));
    //                 params.channel.pushMessage('startTimeBank', data)
    //                 data.route = "startTimeBank";
    //                 let videoMessage = {};
    //                 videoMessage = { roundId: params.channel.roundId, channelId: params.channel.channelId, type: stateOfX.videoLogEventType.broadcast, data: data };
    //                 pomelo.app.rpc.database.videoGameRemote.createVideo('', videoMessage, function (videoResponse) {

    //                 });
    //                 data.action = 'startTimeBank';
    //                 // sending general broadcast using socket
    //                 sendGeneralBroadCast(data);
    //                 // videoHandler.createVideo({roundId: params.channel.roundId, channelId: params.channel.channelId, type: stateOfX.videoLogEventType.broadcast, data: data}, function(res){});
    //             } else {
    //                 serverLog(stateOfX.serverLogType.error, 'Error while sending start timebank broadcast - ' + JSON.stringify(validated))
    //             }
    //         });
    //     }
    /*==========================  END  ========================*/

    /*==========================  START  ========================*/
    // ### Broadcast to each binded session

    //   New
    fireBroadcastToAllSessions(params: any): any {
        console.log("got a request in broadcastToAllSessions in broad", params);

        // Pomelo Connection
        const channelService = pomelo.app.get('channelService');
        const frontendType = pomelo.app.get('frontendType');
        // Pomelo Connection

        channelService.broadcast(frontendType, params.route, params.data);

        params.data.action = params.route;
        this.sendGeneralBroadCast(params.data);
    }

    //   Old
    //   broadcastHandler.fireBroadcastToAllSessions = function (params) {
    //         console.log("got a request in broadcastToAllSessions in broad", params)
    //         pomelo.app.get('channelService').broadcast(pomelo.app.get('frontendType'), params.route, params.data);
    //         params.data.action = params.route;
    //         sendGeneralBroadCast(params.data)
    //     }
    /*==========================  END  ========================*/
  
    /*==========================  START  ========================*/

    // New
    fireBroadcastToLobby(params: any): void {

        // Pomelo Connection
        const channelService = pomelo.app.get('channelService');
        const frontendType = pomelo.app.get('frontendType');
        // Pomelo Connection

    
        channelService.broadcast(frontendType, params.route, params.data);
    
        params.data.action = params.route;
        this.sendGeneralBroadCast(params.data);
    }
    

        // Old
    //   broadcastHandler.fireBroadcastToLobby = function (params) {
    //         pomelo.app.get('channelService').broadcast(pomelo.app.get('frontendType'), params.route, params.data);
    //         params.data.action = params.route;
    //         sendGeneralBroadCast(params.data)
    //     }
    /*==========================  END  ========================*/

    
  ///////////////////////////////////////////////////////////////////
  // General broadcast function to broadcast data on channel level //
  ///////////////////////////////////////////////////////////////////
  // Used for show/hide cards on winning - specially
  
    /*==========================  START  ========================*/

    // New
    async fireChannelBroadcast(params: any) {
        const validated = await validateKeySets(
            "Request",
            "connector",
            "fireChannelBroadcast",
            params
        );
    
        if (validated.success) {
            params.channel.pushMessage(params.route, params.data);
    
            params.data.action = params.route;
            this.sendGeneralBroadCast(params.data);
        } else {
            console.log(
                stateOfX.serverLogType.error,
                'Error while sending broadcast on channel level - ' + JSON.stringify(validated)
            );
        }
    };
    

    // Old
    //   broadcastHandler.fireChannelBroadcast = function (params) {
    //         keyValidator.validateKeySets("Request", "connector", "fireChannelBroadcast", params, function (validated) {
    //             if (validated.success) {
    //                 serverLog(stateOfX.serverLogType.broadcast, params.route + ": " + JSON.stringify(params.data));
    //                 params.channel.pushMessage(params.route, params.data);
    //                 // sending general broadcast using socket
    //                 params.data.action = params.route;
    //                 sendGeneralBroadCast(params.data)
    //             } else {
    //                 serverLog(stateOfX.serverLogType.error, 'Error while sending broadcast  on channel level - ' + JSON.stringify(validated))
    //             }
    //         });
    //     }
    /*==========================  END  ========================*/


    /*==========================  START  ========================*/
    //This function is used to send broadcast on blind level update
    // tournament

    //   New
    async updateBlind(params: any) {
        console.log("broadcast for next blind", params);

        const validated = await validateKeySets(
            "Request",
            "connector",
            "updateBlind",
            params
        );

        if (validated.success) {
            console.log("updateBlind broadcast key validated successfully");

            if (!params.channel) {
                // Pomelo Connection
                params.channel = pomelo.app.get('channelService').getChannel(params.channelId, false);
                // Pomelo Connection
            }

            params.channel.pushMessage("updateBlind", params.data);

            params.data.action = "updateBlind";
            this.sendGeneralBroadCast(params.data);
        } else {
            console.log("updatedBlind broadcast key validation unsuccessfull");
        }
    };


    //   Old
    //   broadcastHandler.updateBlind = function (params) {
    //         console.log("broadcast for next blind", params)
    //         keyValidator.validateKeySets("Request", "connector", "updateBlind", params, function (validated) {
    //             if (validated.success) {
    //                 console.log("updateBlind broadcast key validated successfully");
    //                 if (!params.channel) {
    //                     params.channel = pomelo.app.get('channelService').getChannel(params.channelId, false);
    //                 }
    //                 params.channel.pushMessage("updateBlind", params.data);
    //                 // sending general broadcast using socket
    //                 params.data.action = "updateBlind";
    //                 sendGeneralBroadCast(params.data);
    //             } else {
    //                 console.log("updatedBlind broadcast key validation unsuccessfull");
    //                 //cb(validated);
    //             }
    //         });
    //     }
    /*==========================  END  ========================*/

    /*==========================  START  ========================*/
    // Created  by sahiq for emooji broadcast Start

    //   New
    async fireSelfEmojiMessage(params: any) {
        const validated = await validateKeySets(
            "Request",
            "connector",
            "fireSelfEmojiMessage",
            params
        );

        if (validated.success) {
            params.channel.pushMessage('updateEmoji', params.data);
            params.data.action = "updateEmoji";
            this.sendGeneralBroadCast(params.data);
        } else {
            console.log(stateOfX.serverLogType.error, 'Error while sending broadcast  on channel level - ' + JSON.stringify(validated));
        }
    };


    //   Old
    //   broadcastHandler.fireSelfEmojiMessage = function (params) {
    //         keyValidator.validateKeySets("Request", "connector", "fireSelfEmojiMessage", params, function (validated) {
    //             if (validated.success) {
    //                 serverLog(stateOfX.serverLogType.broadcast, params.route + ": " + JSON.stringify(params.data));
    //                 params.channel.pushMessage('updateEmoji', params.data);
    //                 // sending general broadcast using socket
    //                 params.data.action = "updateEmoji";
    //                 sendGeneralBroadCast(params.data);
    //             } else {
    //                 serverLog(stateOfX.serverLogType.error, 'Error while sending broadcast  on channel level - ' + JSON.stringify(validated))
    //             }
    //         });
    //     }
    // Created  by sahiq for emooji broadcast End
    /*==========================  END  ========================*/

    /*==========================  START  ========================*/

    // New
    fireMuckedCards = function (params: any) {
        params.channel.pushMessage('muckedCards', params.data);
        params.data.action = 'muckedCards';
        this.sendGeneralBroadCast(params.data);
    };
    

    // Old
    //   broadcastHandler.fireMuckedCards = function (params) {
    //         serverLog(stateOfX.serverLogType.broadcast, params.route + ": " + JSON.stringify(params.data));
    //         params.channel.pushMessage('muckedCards', params.data);
    //         // sending general broadcast using socket
    //         params.data.action = 'muckedCards';
    //         sendGeneralBroadCast(params.data);
    //     }
    /*==========================  END  ========================*/
  
    /*==========================  START  ========================*/

    // New
    fireAllInCards(params: any) {
    
        if (params.sentFromReconnection) {
            const userData = {
                playerId: params.playerId,
                route: 'showdownAllInCards',
                msg: {
                    channelId: params.channelId,
                    playerId: params.playerId,
                    allInCards: params.data.allInCards,
                    route: "showdownAllInCards",
                    action: 'showdownAllInCards',
                    fromReconnection: true
                }
            };
            this.sendMessageToUser(userData);
        } else {
            params.channel.pushMessage('showdownAllInCards', params.data);
            params.data.action = 'showdownAllInCards';
            this.sendGeneralBroadCast(params.data);
        }
    };
    

    // Old
    //   broadcastHandler.fireAllInCards = function (params) {
    //         console.log("inside showing allIn cards", params)
    //         serverLog(stateOfX.serverLogType.broadcast, "showdownAllInCards" + ": " + JSON.stringify(params.data));
    //         if (params.sentFromReconnection) {
    //             let userData = {
    //                 playerId: params.playerId,
    //                 route: 'showdownAllInCards',
    //                 msg: {
    //                     channelId: params.channelId,
    //                     playerId: params.playerId,
    //                     allInCards: params.data.allInCards,
    //                     route: "showdownAllInCards",
    //                     action: 'showdownAllInCards',
    //                     fromReconnection: true
    //                 }
    //             }
    //             console.log("now sending private message showdownAllInCards", userData)
    //             broadcastHandler.sendMessageToUser(userData);
    //         }
    //         else {
    //             params.channel.pushMessage('showdownAllInCards', params.data);
    //             // sending general broadcast using socket
    //             params.data.action = 'showdownAllInCards';
    //             sendGeneralBroadCast(params.data)
    //             console.log("I M in all In Cards Broadcast ", params.data)
    //         }
    //     }
    /*==========================  END  ========================*/
  
    /*==========================  START  ========================*/

    // New
    playerSettings(params: any) {
    
        const data = {
            channelId: params.table.channelId,
            playerId: params.player.playerId,
            seatIndex: params.player.seatIndex,
            playerName: params.player.playerName,
            isForceBlindVisible: params.player.isForceBlindVisible,
            RITstatus: params.player.RITstatus,
            state: params.player.state,
            playerCallTimer: params.player.playerCallTimer,
            route: 'playerSettings',
            action: 'playerSettings',
        };
    
        params.channel.pushMessage(data.route, data);
        this.sendGeneralBroadCast(data);
    };
    
    // Old
    //   broadcastHandler.playerSettings = function (params) {
    //         console.log("CT > 1 > broadcastHandler.playerSettings", params)
    //         let data = {
    //             channelId: params.table.channelId,
    //             playerId: params.player.playerId,
    //             seatIndex: params.player.seatIndex,
    //             playerName: params.player.playerName,
    //             isForceBlindVisible: params.player.isForceBlindVisible,
    //             RITstatus: params.player.RITstatus,
    //             state: params.player.state,
    //             playerCallTimer: params.player.playerCallTimer,
    //             route: 'playerSettings',
    //             action: 'playerSettings',
    //         };
    //         serverLog(stateOfX.serverLogType.broadcast, data.route + ' - ' + JSON.stringify(data));
    //         params.channel.pushMessage(data.route, data);
    //         // sending general broadcast using socket
    //         sendGeneralBroadCast(data);
    //     }
    /*==========================  END  ========================*/

    /*==========================  START  ========================*/
    // broadcastHandler.firePlayerStateOnDisconnected = function (params){

    //   New

    async firePlayerStateOnDisconnected(params: any) {
        const validated = await validateKeySets("Request", "connector", "firePlayerStateOnDisconnected", params);

        if (validated.success) {
            const data:any = { channelId: params.channelId, playerId: params.playerId, state: params.state };
            params.channel.pushMessage('playerState', data);

            // sending general broadcast using socket
            data.action = 'playerState';
            this.sendGeneralBroadCast(data);
        } else {
            console.log(stateOfX.serverLogType.error, 'Error while sending broadcast  on channel level - ' + JSON.stringify(validated));
        }
    };


    //   Old
    //   broadcastHandler.firePlayerStateOnDisconnected = function (params) {
    //         keyValidator.validateKeySets("Request", "connector", "firePlayerStateOnDisconnected", params, function (validated) {
    //             if (validated.success) {
    //                 let data = { channelId: params.channelId, playerId: params.playerId, state: params.state };
    //                 serverLog(stateOfX.serverLogType.broadcast, "playerState" + ": " + JSON.stringify(data));
    //                 params.channel.pushMessage('playerState', data);
    //                 // sending general broadcast using socket
    //                 data.action = 'playerState';
    //                 sendGeneralBroadCast(data);
    //             } else {
    //                 serverLog(stateOfX.serverLogType.error, 'Error while sending broadcast  on channel level - ' + JSON.stringify(validated))
    //             }
    //         });
    //     }
    /*==========================  END  ========================*/
  
    /*==========================  START  ========================*/

    // New
    async playerRITStatus(params: any) {
        params.channelId = params.data.channelId;
        params.playerId = params.data.playerId;
        params.RITstatus = params.data.RITstatus;
    
        const validated = await validateKeySets("Request", "connector", "playerRITStatus", params);
    
        if (validated.success) {
            params.channel.pushMessage('playerRITStatus', params.data);
    
            // sending general broadcast using socket
            params.data.action = 'playerRITStatus';
            this.sendGeneralBroadCast(params.data);
        } else {
            console.log(stateOfX.serverLogType.error, 'Error while sending broadcast  on channel level - ' + JSON.stringify(validated));
        }
    };
    

    // Old
    //   broadcastHandler.playerRITStatus = function (params) {

    //         params.channelId = params.data.channelId;
    //         params.playerId = params.data.playerId;
    //         params.RITstatus = params.data.RITstatus;
    //         keyValidator.validateKeySets("Request", "connector", "playerRITStatus", params, function (validated) {
    //             if (validated.success) {
    //                 serverLog(stateOfX.serverLogType.broadcast, "playerRITStatus" + ": " + JSON.stringify(params.data));
    //                 params.channel.pushMessage('playerRITStatus', params.data);
    //                 // sending general broadcast using socket
    //                 params.data.action = 'playerRITStatus';
    //                 sendGeneralBroadCast(params.data);
    //                 // console.log("I M in playerRITStatus Broadcast ", params.data)
    //             } else {
    //                 serverLog(stateOfX.serverLogType.error, 'Error while sending broadcast  on channel level - ' + JSON.stringify(validated))
    //             }
    //         });
    //     }
    /*==========================  END  ========================*/
  
    /*==========================  START  ========================*/

    // New
    async playerCallTimer(params: any) {
    
        params.channelId = params.data.channelId;
        params.playerId = params.data.playerId;
        params.status = params.data.status;
        params.timer = params.data.timer;
        params.timerInSeconds = params.data.timerInSeconds || (params.data.timer * 60);
        params.createdAt = params.data.createdAt;
        params.info = params.data.info;
        params.isCallTimeOver = params.data.isCallTimeOver;
    
    
        const validated = await validateKeySets("Request", "connector", "playerCallTimer", params);
    
        if (validated.success) {    
            const data:any = {
                channelId: params.channelId,
                playerId: params.playerId,
                status: params.status,
                timer: params.timer,
                timerInSeconds: params.timerInSeconds,
                createdAt: params.createdAt,
                info: params.info || null,
                isCallTimeOver: params.isCallTimeOver
            };
    
            const dataForCallTime = {
                channelId: params.channelId,
                status: params.status,
                timer: params.timer,
                createdAt: params.createdAt,
                userName: params.data.userName
            };
    
            try {
                const result = await this.imdb.findDataForCallTime(dataForCallTime);
    
                if (result?.players?.length) {
                    const callTime = {
                        playerId: result.players[0].playerId,
                        channelId: result.players[0].channelId,
                        status: params.status,
                        timer: params.timer,
                        createdAt: Date.now(),
                        userName: result.players[0].playerName,
                        chips: result.players[0].chips,
                        channelName: params.channel.channelName
                    };
                    await this.db.callTimer(callTime);
                }
            } catch (err) {
                console.log(">>>>>>>>>>> err in call timer", err);
            }
    
            params.channel.pushMessage('playerCallTimer', data);
    
            // sending general broadcast using socket
            data.action = "playerCallTimer";
            this.sendGeneralBroadCast(data);
        } else {
            console.log(stateOfX.serverLogType.error, 'Error while sending broadcast  on channel level - ' + JSON.stringify(validated));
        }
    };   

    // Old
    //   broadcastHandler.playerCallTimer = function (params) {
    //         console.log("CT > 2 > broadcastHandler.playerCallTimer", params)

    //         console.log('params', params)
    //         params.channelId = params.data.channelId;
    //         params.playerId = params.data.playerId;
    //         params.status = params.data.status;
    //         params.timer = params.data.timer;
    //         params.timerInSeconds = params.data.timerInSeconds || (params.data.timer * 60);
    //         params.createdAt = params.data.createdAt;
    //         params.info = params.data.info;
    //         params.isCallTimeOver = params.data.isCallTimeOver      //isCallTimeOver added for tesing purposes
    //         console.log('params', params)
    //         keyValidator.validateKeySets("Request", "connector", "playerCallTimer", params, function (validated) {
    //             if (validated.success) {
    //                 serverLog(stateOfX.serverLogType.broadcast, "playerCallTimer" + ": " + JSON.stringify(params.data));

    //                 let data = {
    //                     channelId: params.channelId,
    //                     playerId: params.playerId,
    //                     status: params.status,
    //                     timer: params.timer,
    //                     timerInSeconds: params.data.timerInSeconds,
    //                     createdAt: params.createdAt,
    //                     info: params.info || null,
    //                     isCallTimeOver: params.isCallTimeOver    //isCallTimeOver added for tesing purposes
    //                 }
    //                 let dataForCallTime = {
    //                     channelId: params.channelId,
    //                     status: params.status,
    //                     timer: params.timer,
    //                     createdAt: params.createdAt,
    //                     userName: params.data.userName
    //                 }
    //                 imdb.findDataForCallTime(dataForCallTime, function (err, result) {
    //                     if (err) {
    //                         console.log("Err", err)
    //                     } else {
    //                         if (result.players) {
    //                             let callTime = {
    //                                 playerId: result.players[0].playerId,
    //                                 channelId: result.players[0].channelId,
    //                                 status: params.status,
    //                                 timer: params.timer,
    //                                 createdAt: Date.now(),
    //                                 userName: result.players[0].playerName,
    //                                 chips: result.players[0].chips,
    //                                 channelName: params.channel.channelName
    //                             }
    //                             pokerDB.callTimer(callTime, function (err, result) {
    //                                 if (err) {
    //                                     console.log(">>>>>>>>> err in call timer", err);
    //                                 }
    //                             })
    //                         }
    //                     }
    //                 });
    //                 params.channel.pushMessage('playerCallTimer', data);
    //                 // sending general broadcast using socket
    //                 data.action = "playerCallTimer";
    //                 sendGeneralBroadCast(data);
    //             } else {
    //                 serverLog(stateOfX.serverLogType.error, 'Error while sending broadcast  on channel level - ' + JSON.stringify(validated))
    //             }
    //         });
    //     }
    /*==========================  END  ========================*/
  
    /*==========================  START  ========================*/

    // New
    async playerCallTimerEnds(params: any) {
        console.log('params after player callTimerEnds', params);
    
        const validated = await validateKeySets("Request", "connector", "playerCallTimer", params);
        
        if (validated.success) {
    
            const data = {
                channelId: params.channelId,
                playerId: params.playerId,
                status: params.status,
                timer: params.timer,
                timerInSeconds: params.timerInSeconds,
                createdAt: params.createdAt,
                info: params.info,
                isCallTimeOver: params.isCallTimeOver,
                callTimeGameMissed: params.callTimeGameMissed,
                action: 'playerCallTimer'
            };
    
            params.channel.pushPrivateMessages('playerCallTimer', { [params.playerId]: data });
            this.sendPlayerBroadCast(data);
        } else {
            console.log(stateOfX.serverLogType.error, 'Error while sending broadcast  on channel level - ' + JSON.stringify(validated));
        }
    };
    

    // Old
    //   broadcastHandler.playerCallTimerEnds = function (params) {
    //         console.log('params after player callTimerEnds', params)
    //         keyValidator.validateKeySets("Request", "connector", "playerCallTimer", params, function (validated) {
    //             if (validated.success) {
    //                 serverLog(stateOfX.serverLogType.broadcast, "playerCallTimer" + ": " + JSON.stringify(params.data));
    //                 let data = {
    //                     channelId: params.channelId,
    //                     playerId: params.playerId,
    //                     status: params.status,
    //                     timer: params.timer,
    //                     timerInSeconds: params.timerInSeconds,
    //                     createdAt: params.createdAt,
    //                     info: params.info,
    //                     isCallTimeOver: params.isCallTimeOver,
    //                     callTimeGameMissed: params.callTimeGameMissed,
    //                     action: 'playerCallTimer'
    //                 }
    //                 params.channel.pushPrivateMessages('playerCallTimer', { [params.playerId]: data });
    //                 sendPlayerBroadCast(data);
    //             } else {
    //                 serverLog(stateOfX.serverLogType.error, 'Error while sending broadcast  on channel level - ' + JSON.stringify(validated))
    //             }
    //         });
    //     }
    /*==========================  END  ========================*/
  
    /*==========================  START  ========================*/

    // New
    aserverDownBroadcast(params: any) {
        params.channel.pushMessage('playerInfo', {
            serverDown: true,
            channelId: params.channelId,
            heading: 'Server Down',
            info: 'Server is going under maintenance. No new game will be started now.'
        });
    
        params.action = "playerInfo";
        this.sendGeneralBroadCast(params);
    };    

    // Old
    //   broadcastHandler.serverDownBroadcast = function (params) {
    //         params.channel.pushMessage('playerInfo', { serverDown: true, channelId: params.channelId, heading: 'Server Down', info: 'Server is going under maintenance. No new game will be started now.' });
    //         params.action = "playerInfo";
    //         sendGeneralBroadCast(params);
    //     }
    /*==========================  END  ========================*/











}