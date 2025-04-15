import { Injectable } from "@nestjs/common";
import { PokerDatabaseService } from "shared/common/datebase/pokerdatabase.service";
import { ImdbDatabaseService } from "shared/common/datebase/Imdbdatabase.service";

import _ from "underscore";
import _ld from "lodash";
import { systemConfig } from "shared/common";
import { popupTextManager } from "shared/common";
import stateOfX from "shared/common/stateOfX.sevice";
import * as keyValidator from '../../../../../libs/common/src/utils/keysDictionary';

import { ActionLoggerService } from "./actionLogger.service";
import { JoinRequestUtilService } from "./joinRequestUtil.service";
import { CommonHandlerService } from "./commonHandler.service";
import { ChannelTimerHandlerService } from "./channelTimerHandler.service";
import { BroadcastHandlerService } from "./broadcastHandler.service";
import { ResponseHandlerService } from "./responseHandler.service";




declare const pomelo: any; // In this place we have add socket.io


@Injectable()
export class JoinChannelHandler {

    constructor(
        private readonly db: PokerDatabaseService,
        private readonly imdb: ImdbDatabaseService,
        private readonly actionLogger: ActionLoggerService,
        private readonly joinRequestUtil: JoinRequestUtilService,
        private readonly commonHandler: CommonHandlerService,
        private readonly channelTimerHandler: ChannelTimerHandlerService,
        private readonly broadcastHandler: BroadcastHandlerService,
        private readonly responseHandler: ResponseHandlerService
    ) { }



    // Get table from inmemory if already exisst in database
    async getInMemoryTable(params: any): Promise<any> {
        const response = await this.joinRequestUtil.getInMemoryTable(params);

        if (response.success) {
            return response.params;
        } else {
            throw response; // or throw new Error(response.message) if you want a cleaner error
        }
    }





    // table can not join more tables than allowed // 4 on browser, 2 on phone
    async checkTableCountForPlayer(params: any): Promise<any> {
        const result = await this.imdb.playerJoinedRecord({ playerId: params.playerId });

        if (result && result.length >= 0) {
            try {
                const devices = await this.db.findDevice({ userName: params.playerName });

                if (devices?.[0]?.device) {
                    params.data.deviceType = devices[0].device;
                } else {
                    params.data.deviceType = '';
                }
            } catch (err) {
                params.data.deviceType = '';
            }

            const deviceType = params.data.deviceType || params.deviceType || '';
            const allowedTables = systemConfig.tableCountAllowed[deviceType] ?? 3;

            if (result.length < allowedTables) {
                return params;
            }

            for (const record of result) {
                if (record.channelId === params.channelId) {
                    return params;
                }
            }

            return {
                success: false,
                isRetry: false,
                isDisplay: true,
                channelId: params.channelId || '',
                info: popupTextManager.falseMessages.CHECKTABLECOUNTFORPLAYERFAIL_TABLEMANAGER
            };
        }

        return params;
    }

    // bypass password // if no password,  // player knows password and rejoins table
    async shouldBypassPassword(params: any): Promise<any> {
        if (!params.data.tableFound) {
            return params;
        }

        if (!params.table.isPrivate) {
            params.bypassPassword = true;
            return params;
        }

        const result = await this.imdb.playerJoinedRecord({
            playerId: params.playerId,
            channelId: params.channelId,
        });

        params.bypassPassword = !!(result && result.length > 0);
        return params;
    }

    // fetch a table data for validation  // mainly for password check
    async getTableDataForValidation(params: any): Promise<any> {

        const response: any = await this.joinRequestUtil.getTableDataForValidation(params);

        if (!response.success) {
            throw response;
        }

        return response;
    }

    // If there is no table exists in database then create new one
    async createChannelInDatabase(params: any): Promise<any> {
        const response: any = await this.joinRequestUtil.createChannelInDatabase(params);

        if (!response.success) {
            throw response;
        }

        return response;
    }

    // in such code style, these returns are MUST due to more code
    async rejectIfPassword(params: any): Promise<any> {

        if (!params.table.isPrivate) {
            return params; // PASS: table is not protected
        }

        if (params.bypassPassword) {
            return params; // PASS: player already joined before
        }

        // match with input password;
        if (params.table.password === params.password) {
            return params; // PASS: correct password entered
        }

        // FAIL: wrong or no password
        return {
            success: false,
            isRetry: false,
            isDisplay: true,
            tableId: params.tableId,
            channelId: params.channelId || "",
            info: popupTextManager.falseMessages.TABLEPASSWORDFAIL_JOINCHANNELHANDLER
        };
    }

    async addPlayerAsSpectator(params: any): Promise<any> {

        const result = await this.commonHandler.assignTableSettings(params);

        return result;
    }

    // send braodcast on player joining the table  // table row becomes green on lobby
    async broadcastOnJoinTable(params: any): Promise<any> {

        this.broadcastHandler.sendMessageToUser({
            self: {},
            playerId: params.playerId,
            serverId: params.session.frontendId,
            msg: {
                playerId: params.playerId,
                channelId: params.channelId,
                event: stateOfX.recordChange.playerJoinTable
            },
            route: stateOfX.broadcasts.joinTableList
        });

        return params;
    }

    // If request is for tournament then found channel for this player // > In which this player is already playing
    //=============================    START   ==================================//
    async getTournamentChannel(params: any): Promise<any> {
        if (params.tableId) {
            try {
                const channel = await this.imdb.getPlayerChannel(params.channelId, params.playerId);
                if (!channel) {
                    return {
                        success: false,
                        isRetry: false,
                        tableId: params.tableId,
                        isDisplay: false,
                        channelId: params.channelId || '',
                        info: popupTextManager.falseMessages.GETTOURNAMENTCHANNELFAIL_JOINCHANNELHANDLER
                    };
                }

                // Pomelo Connection
                const getTableResponse = await this.getTableAsync(params.session, { channelId: channel.channelId });

                if (getTableResponse.success && getTableResponse.table) {
                    params.data.tableFound = true;
                    params.table = getTableResponse.table;
                    params.channelId = getTableResponse.table.channelId;
                    params.channel = pomelo.app.get('channelService').getChannel(getTableResponse.table.channelId, false);
                    return params;
                } else {
                    return getTableResponse;
                }
            } catch (error) {
                return {
                    success: false,
                    isRetry: false,
                    tableId: params.tableId,
                    isDisplay: false,
                    channelId: params.channelId || '',
                    info: popupTextManager.falseMessages.GETTOURNAMENTCHANNELFAIL_JOINCHANNELHANDLER
                };
            }
        } else {
            return params;
        }
    }

    private async getTableAsync(session: any, params: any): Promise<any> {
        return await new Promise((resolve) => {
            pomelo.app.rpc.database.tableRemote.getTable(session, params, (response: any) => {
                resolve(response);
            });
        });
    }
    // getTournamentChannel = (params, cb) => {
    //     this.serverLog(stateOfX.serverLogType.info, "in joinChannelHandler function getTournamentChannel" + params);
    //     if (!!params.tableId) {
    //         imdb.getPlayerChannel(params.channelId, params.playerId, (err, channel) => {
    //             if (err || !channel) {
    //                 cb({ success: false, isRetry: false, tableId: params.tableId, isDisplay: false, channelId: (params.channelId || ""), info: popupTextManager.falseMessages.GETTOURNAMENTCHANNELFAIL_JOINCHANNELHANDLER });
    //             } else {
    //                 pomelo.app.rpc.database.tableRemote.getTable(params.session, { channelId: channel.channelId }, (getTableResponse) => {
    //                     if (getTableResponse.success) {
    //                         params.data.tableFound = true;
    //                         params.table = getTableResponse.table;
    //                         params.channelId = getTableResponse.table.channelId;
    //                         params.channel = pomelo.app.get('channelService').getChannel(getTableResponse.table.channelId, false);
    //                         cb(null, params);
    //                     } else {
    //                         cb(getTableResponse);
    //                     }
    //                 });
    //             }
    //         });
    //     } else {
    //         this.serverLog(stateOfX.serverLogType.info, 'This request is for normal table join !');
    //         cb(null, params);
    //     }
    // }
    //=============================    END   ==================================//


    // Join a player into channel if not already exists // add member into pomelo channel
    //=========  START ======
    async joinPlayerToChannel(params: any): Promise<any> {
        const joinPlayerToChannelResponse = await this.joinRequestUtil.joinPlayerToChannel(params);
        return joinPlayerToChannelResponse;
    }
    // joinPlayerToChannel = (params, cb) => {
    //     this.serverLog(stateOfX.serverLogType.info, "in joinChannelHandler function joinPlayerToChannel");
    //     joinRequestUtil.joinPlayerToChannel(params, (joinPlayerToChannelResponse) => {
    //         cb(null, joinPlayerToChannelResponse)
    //     });
    // }
    //========= END  ======

    // Save this record for disconnection handling // not used anymore
    //=============  START  ==============
    async saveActivityRecord(params: any): Promise<any> {

        const generateCOTReferenceId = (): string => {
            const prefix = 'COT-';
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let result = prefix;
            for (let i = 0; i < 16; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return result;
        };

        const dataToInsert = {
            channelId: params.channelId,
            playerId: params.playerId,
            isRequested: true,
            deviceType: params.deviceType || '',
            playerName: params.playerName,
            channelType: params.channelType,
            tableId: params.tableId,
            referenceNumber: generateCOTReferenceId()
        };

        const query: Record<string, any> = {
            playerId: params.playerId
        };

        if (params.channelId) {
            query.channelId = params.channelId;
        }

        try {
            const result: any = await this.imdb.upsertActivity(query, dataToInsert); // must be async
            if (result) {
                params.referenceNum = generateCOTReferenceId();
                return params;
            } else {
                throw new Error('No result from upsert');
            }
        } catch (err) {
            return {
                success: false,
                isRetry: true,
                isDisplay: false,
                tableId: params.tableId,
                channelId: params.channelId || '',
                info: popupTextManager.falseMessages.DBUPSERTACTIVITYFAIL_JOINCHANNELHANDLER
            };
        }
    }


    // saveActivityRecord = (params, cb) => {
    //     console.log("params in saveactivityRecord in joichannel", params)
    //     this.serverLog(stateOfX.serverLogType.info, "in joinChannelHandler function saveActivityRecord");
    //     const generateCOTRefrenceId = () => {
    //         var result = 'COT-';
    //         var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    //         for (var i = 0; i < 16; i++) {
    //             result += possible.charAt(Math.floor(Math.random() * possible.length));
    //         } return result;
    //     }
    //     var dataToInsert = {
    //         channelId: params.channelId,
    //         playerId: params.playerId,
    //         isRequested: true,
    //         deviceType: params.deviceType || '',
    //         playerName: params.playerName,
    //         channelType: params.channelType,
    //         tableId: params.tableId,
    //         referenceNumber: generateCOTRefrenceId()
    //     }
    //     var query = {
    //         playerId: params.playerId
    //     }
    //     if (!!params.channelId) {
    //         query.channelId = params.channelId
    //     }
    //     // if (!!params.tableId) {
    //     //   query.tableId = params.tableId
    //     // }
    //     this.serverLog(stateOfX.serverLogType.info, 'data to insert is - ', query, dataToInsert);
    //     imdb.upsertActivity(query, dataToInsert, (err, result) => {
    //         if (!err && !!result) {
    //             params.referenceNum = generateCOTRefrenceId();
    //             cb(null, params);
    //         } else {
    //             cb({ success: false, isRetry: true, isDisplay: false, tableId: params.tableId, channelId: (params.channelId || ""), info: popupTextManager.falseMessages.DBUPSERTACTIVITYFAIL_JOINCHANNELHANDLER });
    //         }
    //     })
    // }
    //=============  END  ==============

    // upsert join record - inmem db - tableJoinRecord
    /*==================  START   =================*/

    async saveJoinRecord(params: any): Promise<any> {

        const query = {
            channelId: params.channelId,
            playerId: params.playerId,
        };

        const update = {
            $setOnInsert: {
                playerName: params.playerName,
                channelType: params.channelType,
                referenceNumber: params.referenceNumber,
                firstJoined: Date.now(),
                observerSince: Date.now()
            },
            $set: {
                networkIp: params.networkIp,
                event: 'join'
            }
        };

        try {
            const result: any = await this.imdb.upsertPlayerJoin(query, update); // Must be async

            if (result?.result?.upserted) {
                params.firstJoined = true;
            }

            return params;
        } catch (err) {
            return {
                success: false,
                isRetry: false,
                isDisplay: false,
                tableId: params.tableId,
                channelId: params.channelId || "",
                info: popupTextManager.dbQyeryInfo.DBSAVEJOINRECORDFAIL_JOINCHANNELHANDLER + JSON.stringify(err)
            };
        }
    }

    // saveJoinRecord = (params, cb) => {
    //     this.serverLog(stateOfX.serverLogType.info, "in joinChannelHandler function saveJoinRecord");
    //     imdb.upsertPlayerJoin({ channelId: params.channelId, playerId: params.playerId }, { $setOnInsert: { playerName: params.playerName, channelType: params.channelType, referenceNumber: params.referenceNumber, firstJoined: Number(new Date()), observerSince: Number(new Date()) }, $set: { networkIp: params.networkIp, event: 'join' } }, (err, result) => {
    //         if (err) {
    //             cb({ success: false, isRetry: false, isDisplay: false, tableId: params.tableId, channelId: (params.channelId || ""), info: popupTextManager.dbQyeryInfo.DBSAVEJOINRECORDFAIL_JOINCHANNELHANDLER + JSON.stringify(err) })
    //         } else {
    //             if (result && result.result && result.result.upserted) {
    //                 params.firstJoined = true;
    //             }
    //             cb(null, params);
    //         }
    //     })
    // }
    /*==================  END   =================*/

    /*==================  START   =================*/

    handleTournament(params: any): Promise<any> {
        if (params.tableDetails.channelType === stateOfX.gameType.tournament) {
            if (params.tableDetails.isOnBreak) {
                this.broadcastHandler.sendBroadcastForBreakToSinglePlayer({
                    playerId: params.playerId,
                    breakTime: params.tableDetails.breakEnds
                });
            }
            return params;
        }

        return params;
    }

    // handleTournament = (params, cb) => {
    //     console.log("logs in handleTournament", params.tableDetails)
    //     cb(null, params);
    //     if (params.tableDetails.channelType === stateOfX.gameType.tournament) {
    //         //check if tabe is on break
    //         if (params.tableDetails.isOnBreak) {
    //             this.broadcastHandler.sendBroadcastForBreakToSinglePlayer({
    //                 playerId: params.playerId,
    //                 breakTime: params.tableDetails.breakEnds
    //             });
    //         }
    //         cb(null, params);
    //     } else {
    //         cb(null, params);
    //     }
    // }
    /*==================  END   =================*/

    // ### Update player state (in case of DISCONNECTED state players) // player rejoins
    /*==================  START   =================*/

    async updatePlayerState(params: any): Promise<any> {
        // Pomelo Connection
        const changeDisconnPlayerStateResponse: any = await pomelo.app.rpc.database.requestRemote.changeDisconnPlayerState(
            params.session,
            {
                channelId: params.channelId,
                playerId: params.playerId,
                deviceType: params.deviceType
            }
        );
        // Pomelo Connection

        // this.serverLog(
        //   stateOfX.serverLogType.info,
        //   'Response while updating player state from DISCONNECTED on join - ' + JSON.stringify(response)
        // );

        if (changeDisconnPlayerStateResponse.success) {
            params.table = changeDisconnPlayerStateResponse.table;
            params.data = {
                ...params.data,
                ...changeDisconnPlayerStateResponse.data
            };

            if (changeDisconnPlayerStateResponse.data.previousState === stateOfX.playerState.disconnected) {

                this.broadcastHandler.firePlayerStateBroadcast({
                    channel: params.channel,
                    channelId: params.channelId,
                    playerId: params.playerId,
                    state: changeDisconnPlayerStateResponse.data.currentState
                });
            } else {
                console.log(
                    stateOfX.serverLogType.info,
                    'Player was not in DISCONNECTED state, so skipping playerState broadcast on join.'
                );
            }

            return params;
        } else {
            return changeDisconnPlayerStateResponse;
        }
    }

    // updatePlayerState = (params, cb) => {
    //     console.log('updatePlayerState ', params)
    //     this.serverLog(stateOfX.serverLogType.info, "in joinChannelHandler function updatePlayerState");
    //     pomelo.app.rpc.database.requestRemote.changeDisconnPlayerState(params.session, { channelId: params.channelId, playerId: params.playerId, deviceType: params.deviceType }, (changeDisconnPlayerStateResponse) => {
    //         this.serverLog(stateOfX.serverLogType.info, 'Response while updating player state from DISCONNECTED on join - ' + JSON.stringify(changeDisconnPlayerStateResponse));
    //         if (changeDisconnPlayerStateResponse.success) {
    //             params.table = changeDisconnPlayerStateResponse.table;
    //             params.data = _.extend(params.data, changeDisconnPlayerStateResponse.data);
    //             if (changeDisconnPlayerStateResponse.data.previousState === stateOfX.playerState.disconnected) {
    //                 this.serverLog(stateOfX.serverLogType.info, 'Player was in DISCONNECTED state, so firing playerState broadcast with state - ' + changeDisconnPlayerStateResponse.data.currentState);
    //                 broadcastHandler.firePlayerStateBroadcast({ channel: params.channel, channelId: params.channelId, playerId: params.playerId, state: changeDisconnPlayerStateResponse.data.currentState })
    //             } else {
    //                 this.serverLog(stateOfX.serverLogType.info, 'Player was not in DISCONNECTED state, so skipping playerState broadcast on join.');
    //             }
    //             cb(null, params);
    //         } else {
    //             cb(changeDisconnPlayerStateResponse);
    //         }
    //     });
    // }
    /*==================  END   =================*/

    // Set this channel into session of player // in session settings, for future use
    /*==================  START   =================*/
    async setChannelIntoSession(params: any): Promise<any> {

        const sessionChannels = params.session.get("channels") || [];

        sessionChannels.push(params.channelId);

        params.session.set("channels", sessionChannels);

        try {
            await params.session.push("channels");

            return params;
        } catch (err: any) {
            return {
                success: false,
                channelId: params.channelId,
                info: err,
                isRetry: false,
                isDisplay: false
            };
        }
    }

    // setChannelIntoSession = (params, cb) => {
    //     this.serverLog(stateOfX.serverLogType.info, "in joinChannelHandler function setChannelIntoSession");
    //     this.serverLog(stateOfX.serverLogType.info, "channel from sessions - " + JSON.stringify(params.session.get("channels")));
    //     var sessionChannels = params.session.get("channels");
    //     this.serverLog(stateOfX.serverLogType.info, "sessionChannels are in joinchannel handler before push" + JSON.stringify(sessionChannels));
    //     sessionChannels.push(params.channelId);
    //     params.session.set("channels", sessionChannels);
    //     params.session.push("channels", (err) => {
    //         if (err) {
    //             this.serverLog(stateOfX.serverLogType.error, 'set new channel for session service failed! error is : %j', err.stack);
    //             cb({ success: false, channelId: params.channelId, info: err, isRetry: false, isDisplay: false });
    //         } else {
    //             this.serverLog(stateOfX.serverLogType.info, "sessionChannels are in joinchannel handler after push" + JSON.stringify(params.session.get("channels")));
    //             cb(null, params);
    //         }
    //     });
    // }
    /*==================  END   =================*/

    // ### Get anti banking details for this player
    /*==================  START   =================*/

    async getAntiBankingDetails(params: any): Promise<any> {
        try {
            const res = await this.joinRequestUtil.getAntiBanking(params);
            return res;
        } catch (err) {
            // You can customize error response here if needed
            throw err;
        }
    }

    // getAntiBankingDetails = (params, cb) => {
    //     this.serverLog(stateOfX.serverLogType.info, "in joinChannelHandler function getAntiBankingDetails");
    //     joinRequestUtil.getAntiBanking(params, (err, res) => {
    //         cb(err, res);
    //     });
    // }
    /*==================  END   =================*/

    // ### Generate join channel response as required by client
    /*==================  START   =================*/

    async joinChannelKeys(params: any): Promise<any> {

        const setJoinChannelKeysResponse = await this.responseHandler.setJoinChannelKeys(params);

        params.response = setJoinChannelKeysResponse;
        params.response.isJoinedOnce = params.data.isJoinedOnce;
        params.response.firstJoined = params.firstJoined;

        return params;
    }


    // joinChannelKeys = (params, cb) => {
    //     console.log(stateOfX.serverLogType.info, "in joinChannelHandler function 56 joinChannelKeys");
    //     responseHandler.setJoinChannelKeys(params, (setJoinChannelKeysResponse) => {
    //         params.response = setJoinChannelKeysResponse;
    //         params.response.isJoinedOnce = params.data.isJoinedOnce;
    //         params.response.firstJoined = params.firstJoined;
    //         this.serverLog(stateOfX.serverLogType.info, 'Response keys for log: ' + JSON.stringify(params.response));
    //         cb(null, params);
    //     });
    // }
    /*==================  END   =================*/



    // ### Start timer to kick player from lobby only if player is not already sitted in NORMAL games
    /*==================  START   =================*/

    async startKickToLobbyTimer(params: any): Promise<any> {
        const isTournamentChannel = params.channel.channelType === stateOfX.gameType.tournament || params.channelType === stateOfX.gameType.tournament;

        if (isTournamentChannel) {
            return params;
        }

        const playerIndex = _ld.indexOf(params.table.players, { playerId: params.playerId });

        if (playerIndex < 0 && !!params.firstJoined) {
            await this.channelTimerHandler.kickPlayerToLobby({
                session: params.session,
                channel: params.channel,
                channelId: params.channelId,
                playerId: params.playerId
            });
        }

        return params;
    }


    // startKickToLobbyTimer = (params, cb) => {
    //     if (params.channel.channelType === stateOfX.gameType.tournament || params.channelType === stateOfX.gameType.tournament) {
    //         this.serverLog(stateOfX.serverLogType.info, 'This is tournament channel so not starting timer for kick to lobby!');
    //         cb(null, params);
    //         return true;
    //     }

    //     var playerIndex = _ld.indexOf(params.table.players, { playerId: params.playerId });
    //     if (playerIndex < 0 && !!params.firstJoined) {
    //         channelTimerHandler.kickPlayerToLobby({ session: params.session, channel: params.channel, channelId: params.channelId, playerId: params.playerId })
    //     } else {
    //         this.serverLog(stateOfX.serverLogType.info, "The player is already sitted, not starting kick to lobby timer.");
    //     }
    //     cb(null, params);
    // }
    /*==================  END   =================*/




    // save an action log - hand history text 
    /*==================  START   =================*/

    async validateKeyAndCreateLog(params: any): Promise<any> { // Pending

        const validated: any = await keyValidator.validateKeySets(
            "Response",
            "connector",
            "joinChannel",
            params.response
        );

        if (validated.success) {
            if (params.channelId) {
                actionLogger.createEventLog({
                    self: {},
                    session: params.session,
                    channel: params.channel,
                    data: {
                        channelId: params.channelId,
                        eventName: stateOfX.logEvents.joinChannel,
                        rawData: params.response
                    }
                });
            }

            return params.response;
        } else {
            throw validated;
        }
    }

    // validateKeyAndCreateLog = (params, cb) => {
    //     this.serverLog(stateOfX.serverLogType.info, "in joinChannelHandler function validateKeyAndCreateLog");
    //     keyValidator.validateKeySets("Response", "connector", "joinChannel", params.response, (validated) => {
    //         if (validated.success) {
    //             if (!!params.channelId) {
    //                 actionLogger.createEventLog({ self: {}, session: params.session, channel: params.channel, data: { channelId: params.channelId, eventName: stateOfX.logEvents.joinChannel, rawData: params.response } });
    //             } else {
    //                 this.serverLog(stateOfX.serverLogType.error, "not logging of this join as channelId missing");
    //             }
    //             cb(null, params.response)
    //         } else {
    //             cb(validated);
    //         }
    //     });
    // }
    /*==================  END   =================*/



    // init params as emoty
    /*==================  START   =================*/

    initializeParams(params: any): any {
        params.data = {
            settings: {},
            antibanking: {},
            tableFound: false,
        };
        params.table = null;

        return params;
    };

    // initializeParams = (params, cb) => {
    //     params.data = {};
    //     params.data.settings = {};
    //     params.data.antibanking = {};
    //     params.table = null;
    //     params.data.tableFound = false;
    //     cb(null, params)
    // }
    /*==================  END   =================*/



    // validate request keys
    /*==================  START   =================*/

    validateKeyOnJoin(params: any): any {

        // Validate
        if (params.channelId || params.tableId) {
            return params;
        } else {
            return {
                success: false,
                isRetry: false,
                isDisplay: false,
                channelId: params.channelId || "",
                info: popupTextManager.falseMessages.VALIDATEKEYONJOINFAIL_JOINCHANNELHANDLER,
            };
        }
    }

    // validateKeyOnJoin = (params, cb) => {
    //     this.serverLog(stateOfX.serverLogType.info, "in joinChannelHandler function validateKeyOnJoin");
    //     if (!!params.channelId || !!params.tableId) {
    //         cb(null, params);
    //     } else {
    //         cb({ success: false, isRetry: false, isDisplay: false, channelId: (params.channelId || ""), info: popupTextManager.falseMessages.VALIDATEKEYONJOINFAIL_JOINCHANNELHANDLER });
    //     }
    // }
    /*==================  END   =================*/


    /*==================  START   =================*/


    firingRITBroadCast(params: any): Promise<any> {

        const { tableDetails } = params;

        if (tableDetails.players.length > 0) {

            // Pomelo Connection
            let channel = pomelo.app.get('channelService').getChannel(tableDetails.channelId, false);

            if (!channel) {

                channel = pomelo.app.get('channelService').getChannel(tableDetails.channelId, true);
            }
            // Pomelo Connection

            for (const player of tableDetails.players) {
                const broadcastData = {
                    channelId: player.channelId,
                    playerId: player.playerId,
                    RITstatus: tableDetails.isRunItTwiceTable || player.isRunItTwice || false,
                };

                this.broadcastHandler.playerRITStatus({
                    channel,
                    channelId: player.channelId,
                    data: broadcastData,
                });
                return params;
            }

            if (tableDetails.isROE) {
                const variationBroadcast = {
                    channel,
                    channelId: tableDetails.channelId,
                    isROE: tableDetails.isROE,
                    channelVariation: tableDetails.channelVariation,
                    message: `${tableDetails.channelRoundCount}/${tableDetails.maxPlayers}`,
                };

                this.broadcastHandler.fireGameVariationBroadcast(variationBroadcast);
            }
        }

        return params;
    };


    // firingRITBroadCast = (params, cb) => {
    //     if (params.tableDetails.players.length > 0) {
    //         var channel = pomelo.app.get('channelService').getChannel(params.tableDetails.channelId, false);
    //         if (!channel) {
    //             console.log("need to insert new channel", channel)
    //             channel = pomelo.app.get('channelService').getChannel(params.tableDetails.channelId, true);
    //         }
    //         async.each(params.tableDetails.players, (players, ecb) => {
    //             var channelId = players.channelId;
    //             var broadcastData = {};
    //             broadcastData.channelId = channelId;
    //             broadcastData.playerId = players.playerId;
    //             if (params.tableDetails.isRunItTwiceTable || players.isRunItTwice) {
    //                 broadcastData.RITstatus = true;
    //                 broadcastHandler.playerRITStatus({ channel: channel, channelId: channelId, data: broadcastData });
    //                 ecb();
    //             } else {
    //                 broadcastData.RITstatus = false;
    //                 broadcastHandler.playerRITStatus({ channel: channel, channelId: channelId, data: broadcastData });
    //                 ecb();
    //             }
    //             cb(null, params);
    //         });
    //         console.log("=======================joinPlayer firingRITBroadCast= params=======", params)
    //         if (params.tableDetails.isROE) {
    //             var tableDetails = {
    //                 channel: channel,
    //                 channelId: params.tableDetails.channelId,
    //                 isROE: params.tableDetails.isROE,
    //                 channelVariation: params.tableDetails.channelVariation,
    //                 message: params.tableDetails.channelRoundCount + "/" + params.tableDetails.maxPlayers
    //             }
    //             broadcastHandler.fireGameVariationBroadcast(tableDetails);
    //         }
    //     } else {
    //         cb(null, params);
    //     }
    // }
    /*==================  END   =================*/


    /*==================  START   =================*/

    async firingCallTimeBroadCast(params: any): Promise<any> {

        const players = params.tableDetails.players;

        if (!players.length) return params;

        for (const player of players) {

            const { playerId, channelId, playerCallTimer } = player;

            // Pomelo Connection
            let channel = pomelo.app.get('channelService').getChannel(channelId, false);

            if (!channel) {
                channel = pomelo.app.get('channelService').getChannel(channelId, true);
            }
            // Pomelo Connection

            const broadcastData: any = {
                channelId,
                playerId,
            };

            const now = Date.now();
            const elapsed = Math.floor((now - playerCallTimer.createdAt) / systemConfig.secondToMinutsConvert);
            const timerInSeconds = (systemConfig.playerCallTime * 60) - Math.floor((now - playerCallTimer.createdAt) / 1000);

            if (playerCallTimer.status || playerCallTimer.isCallTimeOver) {
                broadcastData.timer = playerCallTimer.timer - elapsed;
                broadcastData.timerInSeconds = timerInSeconds;
                broadcastData.createdAt = playerCallTimer.createdAt;
                broadcastData.status = broadcastData.timer >= 1 ? playerCallTimer.status : false;

                if (broadcastData.timer < 1) {
                    broadcastData.timer = 0;
                    broadcastData.timerInSeconds = 0;
                    broadcastData.status = false;
                    broadcastData.createdAt = 0;
                }

                if (playerCallTimer.isCallTimeOver) {
                    broadcastData.isCallTimeOver = true;
                }

                await new Promise<void>((resolve) => {
                    setTimeout(() => {
                        this.broadcastHandler.playerCallTimer({
                            channel,
                            channelId,
                            data: broadcastData,
                        });
                        resolve();
                    }, 500);
                });
            }
        }

        return params;
    };


    // firingCallTimeBroadCast = (params, cb) => {
    //     console.log("params inside firing calltimer broad cast ", params);
    //     if (params.tableDetails.players.length > 0) {
    //         async.each(params.tableDetails.players, (players, ecb) => {
    //             console.log("i am printing players inside firing broadcast ", players);
    //             var channelId = players.channelId;
    //             var channel = pomelo.app.get('channelService').getChannel(channelId, false);
    //             if (!channel) {
    //                 console.log("need to insert new channel", channel)
    //                 channel = pomelo.app.get('channelService').getChannel(channelId, true);
    //             }
    //             var broadcastData = {};
    //             broadcastData.channelId = channelId;
    //             broadcastData.playerId = players.playerId;
    //             if (players.playerCallTimer.status) {
    //                 broadcastData.status = players.playerCallTimer.status;
    //                 broadcastData.timer = players.playerCallTimer.timer - (Math.floor((Date.now() - players.playerCallTimer.createdAt) / systemConfig.secondToMinutsConvert));
    //                 if (broadcastData.status && broadcastData.timer >= 1) {
    //                     console.log("timerInSeconds 7");
    //                     broadcastData.timer = broadcastData.timer;
    //                     broadcastData.timerInSeconds = (systemConfig.playerCallTime * 60) - Math.floor((Date.now() - players.playerCallTimer.createdAt) / 1000);
    //                     broadcastData.status = players.playerCallTimer.status;
    //                     broadcastData.createdAt = players.playerCallTimer.createdAt;
    //                 } else {
    //                     console.log("timerInSeconds 8");
    //                     broadcastData.timer = 0
    //                     broadcastData.timerInSeconds = 0
    //                     broadcastData.status = false;
    //                     broadcastData.createdAt = 0;
    //                 }
    //                 setTimeout(() => {
    //                     broadcastHandler.playerCallTimer({ channel: channel, channelId: channelId, data: broadcastData });
    //                     ecb();
    //                 }, 500);
    //             } else {
    //                 if (players.playerCallTimer.isCallTimeOver) {
    //                     broadcastData.status = players.playerCallTimer.status;
    //                     broadcastData.timer = players.playerCallTimer.timer - (Math.floor((Date.now() - players.playerCallTimer.createdAt) / systemConfig.secondToMinutsConvert));
    //                     if (broadcastData.status && broadcastData.timer >= 1) {
    //                         console.log("timerInSeconds 7");
    //                         broadcastData.timer = broadcastData.timer;
    //                         broadcastData.timerInSeconds = (systemConfig.playerCallTime * 60) - Math.floor((Date.now() - players.playerCallTimer.createdAt) / 1000);
    //                         broadcastData.status = players.playerCallTimer.status;
    //                         broadcastData.createdAt = players.playerCallTimer.createdAt;
    //                     } else {
    //                         console.log("timerInSeconds 8");
    //                         broadcastData.timer = 0
    //                         broadcastData.timerInSeconds = 0
    //                         broadcastData.status = false;
    //                         broadcastData.createdAt = 0;
    //                         broadcastData.isCallTimeOver = players.playerCallTimer.isCallTimeOver;
    //                     }
    //                     setTimeout(() => {
    //                         broadcastHandler.playerCallTimer({ channel: channel, channelId: channelId, data: broadcastData });
    //                         ecb();
    //                     }, 500);
    //                 }
    //             }
    //             cb(null, params);
    //         });
    //     } else {
    //         cb(null, params);
    //     }
    // };
    /*==================  END   =================*/



    // process join all steps
    /*==================  START   =================*/

    async processJoin(params: any): Promise<any> {      
        try {
          params = await this.validateKeyOnJoin(params);
          params = await this.initializeParams(params);
          params = await this.getInMemoryTable(params);
          params = await this.shouldBypassPassword(params);
          params = await this.getTableDataForValidation(params);
          params = await this.rejectIfPassword(params);
          params = await this.createChannelInDatabase(params);
          params = await this.addPlayerAsSpectator(params);
          params = await this.broadcastOnJoinTable(params);
          params = await this.getTournamentChannel(params);
          params = await this.joinPlayerToChannel(params);
          params = await this.saveActivityRecord(params);
          params = await this.saveJoinRecord(params);
          params = await this.updatePlayerState(params);
          params = await this.setChannelIntoSession(params);
          params = await this.getAntiBankingDetails(params);
          params = await this.joinChannelKeys(params);
          params = await this.startKickToLobbyTimer(params);
          params = await this.validateKeyAndCreateLog(params);
          params = await this.firingRITBroadCast(params);
          params = await this.firingCallTimeBroadCast(params);
      
          // Optionally include:
          // params = await this.handleTournament(params);
      
          return params;
        } catch (err) {
          console.error("in joinChannelHandler processJoin err", err);
          throw err;
        }
      };


    // processJoin = (params, cb) => {
    //     console.error(stateOfX.serverLogType.info, "in joinChannelHandler function processJoin", params);
    //     async.waterfall([
    //         async.apply(this.validateKeyOnJoin, params),
    //         this.initializeParams,
    //         this.getInMemoryTable,
    //         this.shouldBypassPassword,
    //         this.getTableDataForValidation,
    //         this.rejectIfPassword,
    //         this.createChannelInDatabase,
    //         this.addPlayerAsSpectator,
    //         this.broadcastOnJoinTable,
    //         this.getTournamentChannel,
    //         this.joinPlayerToChannel,
    //         this.saveActivityRecord,
    //         this.saveJoinRecord,
    //         this.updatePlayerState,
    //         this.setChannelIntoSession,
    //         this.getAntiBankingDetails,
    //         this.joinChannelKeys,
    //         this.startKickToLobbyTimer,
    //         this.validateKeyAndCreateLog,
    //         this.firingRITBroadCast,
    //         this.firingCallTimeBroadCast,
    //         // this.handleTournament
    //     ], (err, response) => {
    //         console.error("in joinChannelHandler processJoin err, response", err, response);
    //         if (err) {
    //             if (err.isInside) {
    //             }
    //             cb(err);
    //         } else {
    //             cb(response);
    //         }
    //     });
    // }
    /*==================  END   =================*/
}