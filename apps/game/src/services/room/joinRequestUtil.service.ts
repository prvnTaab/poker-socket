import { Injectable } from "@nestjs/common";
import _ from "underscore";
import _ld from "lodash";
import { systemConfig } from "shared/common";
import { popupTextManager } from "shared/common";
import stateOfX from "shared/common/stateOfX.sevice";
import * as keyValidator from '../../../../../libs/common/src/utils/keysDictionary';
import dbQyeryInfo   from "../../../../../libs/common/src/popupTextManager";

import { ImdbDatabaseService } from "shared/common/datebase/Imdbdatabase.service";
import { PokerDatabaseService } from "shared/common/datebase/pokerdatabase.service";


import { ActionLoggerService } from "./actionLogger.service";
import { validateKeySets } from "shared/common/utils/activity";
import { BroadcastHandlerService } from "./broadcastHandler.service";

declare const pomelo: any; // In this place we have add socket.io

@Injectable()
export class JoinRequestUtilService {

    constructor(
        private readonly db: PokerDatabaseService,
        private readonly imdb: ImdbDatabaseService,
        private readonly broadcastHandler: BroadcastHandlerService,
        private readonly ActionLogger: ActionLoggerService
    ) { }



    /*=============================  START  ========================*/
    // fetch inmem table
    // mark if found


    async getInMemoryTable(params: any): Promise<any> {

        console.log(stateOfX.serverLogType.info, "in joinRequestUtil function getInMemoryTable");

        if (!!params.channelId) {

            console.log(stateOfX.serverLogType.info, "Channel id present, check if table is available in Channel");

            if ((!!params.channel && params.channelType === 'TOURNAMENT') || (!!params.channel?.isTable)) {

                console.log(stateOfX.serverLogType.info, 'Table for this channel is already in database!');

                try {
                    const getTableResponse = await new Promise<any>((resolve, reject) => {

                        // Pomelo Connection
                        pomelo.app.rpc.database.tableRemote.getTable(
                            params.session,
                            { channelId: params.channelId },
                            (res: any) => {
                                if (res?.success) {
                                    resolve(res);
                                } else {
                                    reject(res);
                                }
                            }
                        );
                        // Pomelo Connection
                    });

                    console.log(stateOfX.serverLogType.info, "getInMemoryTable getTable response - " + JSON.stringify(getTableResponse));

                    params.data.tableFound = true;
                    params.table = getTableResponse.table;

                    return { success: true, params };
                } catch (error) {
                    return error;
                }

            } else {
                console.log(stateOfX.serverLogType.info, 'No table is created for this channel, create one in next step!');
                return { success: true, params };
            }

        } else {
            console.log(stateOfX.serverLogType.info, 'This request is for tournament table join!');
            return { success: true, params };
        }
    };


    // joinRequestUtil.getInMemoryTable = function (params, cb) {
    //     console.log("joinRequestUtil.getInMemoryTable", params)
    //     serverLog(stateOfX.serverLogType.info, "in joinRequestUtil function getInMemoryTable");
    //     if (!!params.channelId) {
    //         serverLog(stateOfX.serverLogType.info, "Channel id present, check if table is available in Channel");
    //         if ((!!params.channel && params.channelType == 'TOURNAMENT') || (!!params.channel.isTable)) {
    //             serverLog(stateOfX.serverLogType.info, 'Table for this channel is already in database!');
    //             pomelo.app.rpc.database.tableRemote.getTable(params.session, { channelId: params.channelId }, function (getTableResponse) {
    //                 serverLog(stateOfX.serverLogType.info, "in joinRequestUtil function getInMemoryTable getTable response - " + JSON.stringify(getTableResponse));
    //                 if (getTableResponse.success) {
    //                     params.data.tableFound = true;
    //                     params.table = getTableResponse.table;
    //                     cb({ success: true, params: params });
    //                 } else {
    //                     cb(getTableResponse);
    //                 }
    //             });
    //         } else {
    //             serverLog(stateOfX.serverLogType.info, 'No table is created for this channel, create one in next step!')
    //             cb({ success: true, params: params });
    //         }
    //     } else {
    //         serverLog(stateOfX.serverLogType.info, 'This request is for tournament table join !');
    //         cb({ success: true, params: params });
    //     }
    // }
    /*=============================  END  ========================*/


    /*=============================  START  ========================*/
    // ### Broadcast table details to all players
    // > if table is created in cache only

    async broadcastTableData(app: any, table: any) {
        this.broadcastHandler.fireBroadcastToAllSessions({
            app,
            data: {
                _id: table.channelId,
                updated: {
                    isRealMoney: table.isRealMoney,
                    channelName: table.channelName,
                    turnTime: table.turnTime,
                    callTime: table.callTime,
                    isPotLimit: table.isPotLimit,
                    maxPlayers: table.maxPlayers,
                    minPlayers: table.minPlayers,
                    smallBlind: table.smallBlind,
                    bigBlind: table.bigBlind,
                    minBuyIn: table.minBuyIn,
                    maxBuyIn: table.maxBuyIn,
                    channelVariation: table.channelVariation,
                    channelType: table.channelType,
                },
                event: stateOfX.recordChange.tableNewValues,
            },
            route: stateOfX.broadcasts.tableUpdate,
        });
    };

    // var broadcastTableData = function (app, table) {
    // broadcastHandler.fireBroadcastToAllSessions({
    //     app: app, data: {
    //         _id: table.channelId,
    //         updated: {
    //             isRealMoney: table.isRealMoney,
    //             channelName: table.channelName,
    //             turnTime: table.turnTime,
    //             callTime: table.callTime,
    //             isPotLimit: table.isPotLimit,
    //             maxPlayers: table.maxPlayers,
    //             minPlayers: table.minPlayers,
    //             smallBlind: table.smallBlind,
    //             bigBlind: table.bigBlind,
    //             minBuyIn: table.minBuyIn,
    //             maxBuyIn: table.maxBuyIn,
    //             channelVariation: table.channelVariation,
    //             channelType: table.channelType
    //         },
    //         event: stateOfX.recordChange.tableNewValues
    //     }, route: stateOfX.broadcasts.tableUpdate
    // });

    /*=============================  END  ========================*/

    /*=============================  START  ========================*/
    // table not found in in-memory db
    // create it by copying wiredTiger table object
    // save keys also in pomelo channel object

    async createChannelInDatabase(params: any): Promise<any> {

        params.success = true;

        if (!params.channelId) {
            return params;
        }

        if (params.data.tableFound) {
            return params;
        }

        try {
            const channelRemoteResponse = await new Promise<any>((resolve, reject) => {

                // Pomelo Connection
                pomelo.app.rpc.database.channelRemote.processSearch(
                    params.session,
                    {
                        channelId: params.channelId,
                        channelType: params.channelType,
                        tableId: params.tableId,
                        playerId: params.playerId,
                        gameVersionCount: params.gameVersionCount,
                    },
                    (response: any) => resolve(response)
                );
                // Pomelo Connection

            });

            if (!channelRemoteResponse.success) {
                params.success = false;
                return channelRemoteResponse;
            }

            channelRemoteResponse.channelDetails.serverId = pomelo.app.get('serverId');

            const createTableResponse = await new Promise<any>((resolve, reject) => {
                pomelo.app.rpc.database.tableRemote.createTable(
                    params.session,
                    channelRemoteResponse.channelDetails,
                    (response: any) => resolve(response)
                );
            });

            if (!createTableResponse.success) {
                params.success = false;
                return createTableResponse;
            }

            params.data.tableFound = true;
            params.table = createTableResponse.table;

            // Set channel-level variables
            const table = params.table;
            const channel = params.channel;

            Object.assign(channel, {
                isTable: true,
                roundId: "",
                channelType: table.channelType,
                channelName: table.channelName,
                channelVariation: table.channelVariation,
                tournamentId: "",
                turnTimeReference: null,
                extraTurnTimeReference: null,
                timeBankTurnTimeReference: null,
                clientConnAckReference: null,
                reserveSeatTimeReference: [],
                kickPlayerToLobby: [],
                callTimeTimeReference: [],
                callTimeTimeBufferTimeReference: [],
                gameStartEventSet: stateOfX.startGameEventOnChannel.idle,
                gameStartEventName: null,
                allInOccuredOnChannel: false,
                turnTime: table.turnTime,
                callTime: table.callTime,
                ctEnabledBufferTime: table.ctEnabledBufferTime,
                ctEnabledBufferHand: table.ctEnabledBufferHand,
                isCTEnabledTable: table.isCTEnabledTable,
                isEvChopTable: table.isEvChopTable || false,
                evPopupTime: table.evPopupTime || 0,
                evEquityFee: table.evEquityFee || 0,
                ritPopupTime: table.ritPopupTime || 0,
            });

            // Optionally broadcast:
            // broadcastTableData(pomelo.app, table);

            return params;
        } catch (error) {
            params.success = false;
            throw error;
        }
    };

    // joinRequestUtil.createChannelInDatabase = function (params, cb) {
    //     console.log("createChannelInDatabasecreateChannelInDatabase", params)
    //     params.success = true;
    //     serverLog(stateOfX.serverLogType.info, "in joinRequestUtil function createChannelInDatabase - " + JSON.stringify(params.data));
    //     if (!!params.channelId) {
    //         if (!params.data.tableFound) {
    //             serverLog(stateOfX.serverLogType.info, 'Creating new table into database for this channel!');
    //             pomelo.app.rpc.database.channelRemote.processSearch(params.session, { channelId: params.channelId, channelType: params.channelType, tableId: params.tableId, playerId: params.playerId, gameVersionCount: params.gameVersionCount }, function (channelRemoteResponse) {
    //                 if (channelRemoteResponse.success) {
    //                     channelRemoteResponse.channelDetails.serverId = pomelo.app.get('serverId');
    //                     pomelo.app.rpc.database.tableRemote.createTable(params.session, channelRemoteResponse.channelDetails, function (createTableResponse) {
    //                         if (createTableResponse.success) {
    //                             params.data.tableFound = true;
    //                             params.table = createTableResponse.table;
    //                             // Set channel level variables
    //                             params.channel.isTable = true;
    //                             params.channel.roundId = "";
    //                             params.channel.channelType = params.table.channelType;
    //                             params.channel.channelName = params.table.channelName;
    //                             params.channel.channelVariation = params.table.channelVariation;
    //                             params.channel.tournamentId = "";
    //                             params.channel.turnTimeReference = null;
    //                             params.channel.extraTurnTimeReference = null;
    //                             params.channel.timeBankTurnTimeReference = null;
    //                             params.channel.clientConnAckReference = null;
    //                             params.channel.reserveSeatTimeReference = [];
    //                             params.channel.kickPlayerToLobby = [];
    //                             params.channel.callTimeTimeReference = [];
    //                             params.channel.callTimeTimeBufferTimeReference = [];
    //                             params.channel.gameStartEventSet = stateOfX.startGameEventOnChannel.idle;
    //                             params.channel.gameStartEventName = null;
    //                             params.channel.allInOccuredOnChannel = false;
    //                             params.channel.turnTime = params.table.turnTime;
    //                             params.channel.callTime = params.table.callTime;
    //                             params.channel.ctEnabledBufferTime = params.table.ctEnabledBufferTime;
    //                             params.channel.ctEnabledBufferHand = params.table.ctEnabledBufferHand;
    //                             params.channel.isCTEnabledTable = params.table.isCTEnabledTable;
    //                             params.channel.isEvChopTable = params.table.isEvChopTable || false;
    //                             params.channel.evPopupTime = params.table.evPopupTime || 0;
    //                             params.channel.evEquityFee = params.table.evEquityFee || 0;
    //                             params.channel.ritPopupTime = params.table.ritPopupTime || 0;

    //                             // Broadcast table details to each connected players
    //                             // broadcastTableData(pomelo.app, params.table);

    //                             cb(params);
    //                         } else {
    //                             serverLog(stateOfX.serverLogType.error, 'Error while generating table!');
    //                             params.success = false;
    //                             cb(createTableResponse);
    //                         }
    //                     });
    //                 } else {
    //                     params.success = false;
    //                     cb(channelRemoteResponse);
    //                 }
    //             });
    //         } else {
    //             serverLog(stateOfX.serverLogType.info, 'Table from inmemory database already found for this request!')
    //             cb(params);
    //         }
    //     } else {
    //         serverLog(stateOfX.serverLogType.info, 'This request is for tournament table join !');
    //         cb(params);
    //     }
    // }

    /*=============================  END  ========================*/


    /*=============================  START  ========================*/
    ///////////////////////////////////
    // Join player to pomelo channel //
    ///////////////////////////////////

    async joinPlayerToChannel(params: any): Promise<any> {

        const validated = await validateKeySets("Request", "connector", "joinPlayerToChannel", params);


        if (!validated.success) {
            return validated;
        }

        const channelMembers = params.channel.getMembers();

        if (channelMembers.includes(params.playerId)) {
            params.channel.leave(params.playerId);
        } else {
            console.log(stateOfX.serverLogType.info, 'Player is already present in pomelo channel, not adding here!');
        }

        params.channel.add(params.playerId, params.session.frontendId);

        console.log(stateOfX.serverLogType.info, "channel members are after - " + JSON.stringify(params.channel.getMembers()));

        return params;
    };

    // joinRequestUtil.joinPlayerToChannel = function (params, cb) {
    //     serverLog(stateOfX.serverLogType.info, "in joinRequestUtil function joinPlayerToChannel");
    //     keyValidator.validateKeySets("Request", "connector", "joinPlayerToChannel", params, function (validated) {
    //         if (validated.success) {
    //             // Check if player doesn't exists in the channel already
    //             var channelMembers = params.channel.getMembers();
    //             serverLog(stateOfX.serverLogType.info, "channel members are  previous- " + JSON.stringify(params.channel.getMembers()));
    //             if (channelMembers.indexOf(params.playerId) >= 0) {
    //                 params.channel.leave(params.playerId);
    //             } else { // can be removed if log not important
    //                 serverLog(stateOfX.serverLogType.info, 'Player is already present in pomelo channel, not adding here!');
    //             }
    //             params.channel.add(params.playerId, params.session.frontendId);
    //             serverLog(stateOfX.serverLogType.info, "channel members are  after- " + JSON.stringify(params.channel.getMembers()));
    //             cb(params);
    //         } else {
    //             cb(validated);
    //         }
    //     });
    // }
    /*=============================  END  ========================*/

    /*=============================  START  ========================*/
    //////////////////////////////////////////////////////////////////////
    // Get anti banking details for player who requested to join a room //
    //////////////////////////////////////////////////////////////////////

    async getAntiBanking(params: any): Promise<any> {
        try {
            const res = await this.db.getAntiBanking({ playerId: params.playerId, channelId: params.channelId });

            const now = Date.now();
            const createdAt = res ? Number(res.createdAt) : 0;
            const timeElapsed = (now - createdAt) / 1000;

            if (res) {
                console.log(stateOfX.serverLogType.info, 'Remaining anti banking time: ' + timeElapsed);
            }

            params.data.antibanking.isAntiBanking = !!res;
            params.data.antibanking.amount = res ? parseInt(res.amount) : -1;
            params.data.antibanking.timeRemains = res
                ? systemConfig.expireAntiBankingSeconds +
                systemConfig.antiBankingBuffer -
                timeElapsed
                : -1;

            params.data.antibankingAmount = params.data.antibanking.amount;

            if (params.data.antibanking.timeRemains <= 0) {
                params.data.antibanking.isAntiBanking = false;
                params.data.antibanking.amount = -1;
                params.data.antibanking.timeRemains = -1;

                await this.closePlayerSession(params);
                await this.removeAntiBanking(params);
            }

            return params;
        } catch (err) {
            throw {
                success: false,
                channelId: params.channelId || "",
                info: popupTextManager.dbQyeryInfo.DB_GETANTIBANKING_FAIL,
                isRetry: false,
                isDisplay: false,
            };
        }
    }

    // joinRequestUtil.getAntiBanking = function (params, cb) {
    //     serverLog(stateOfX.serverLogType.info, "in joinRequestUtil function getAntiBanking");
    //     db.getAntiBanking({ playerId: params.playerId, channelId: params.channelId }, function (err, res) {
    //         serverLog(stateOfX.serverLogType.info, 'Anti banking details for this player: ' + JSON.stringify(res));
    //         if (!err) {
    //             if (!!res) {
    //                 serverLog(stateOfX.serverLogType.info, 'Remaining anti banking time: ' + ((Number(new Date()) - Number(res.createdAt)) / 1000));
    //             }
    //             params.data.antibanking.isAntiBanking = !!res ? true : false;
    //             params.data.antibanking.amount = !!res ? parseInt(res.amount) : -1;
    //             params.data.antibanking.timeRemains = !!res ? parseInt(systemConfig.expireAntiBankingSeconds) + parseInt(systemConfig.antiBankingBuffer) - (Number(new Date()) - Number(res.createdAt)) / 1000 : -1;
    //             params.data.antibankingAmount = params.data.antibanking.amount;
    //             // Old antibanking logic
    //             if (params.data.antibanking.timeRemains <= 0) {
    //                 params.data.antibanking.isAntiBanking = false;
    //                 params.data.antibanking.amount = -1;
    //                 params.data.antibanking.timeRemains = -1;
    //                 closePlayerSession(params, function (callBack) {
    //                     console.error("closePlayerSession - callBack", callBack);
    //                     removeAntiBanking(params, function (cb) {
    //                         console.error("removeAntiBanking - cb", cb);
    //                         // if(!!res){
    //                         //   imdb.removePlayerScore({playerId: params.playerId, channelId: params.channelId},(re)=>{
    //                         //     console.error("removePlayerScore - re", re);
    //                         //   });
    //                         // }
    //                     })
    //                 })
    //             }
    //             cb(null, params);
    //             // // new code for skip lower anti. banking
    //             // var findQuery = {};
    //             // findQuery.playerId = params.data.playerId;
    //             // findQuery.channelId = params.channelId;
    //             // imdb.getPlayerBuyInSum(findQuery, function(err, res){
    //             //     console.log('table table',res,params.data)

    //             //     if(params.data.antibanking.timeRemains <=0 || playerScore < 0){
    //             //       params.data.antibanking.isAntiBanking = false;
    //             //       params.data.antibanking.amount        = -1;
    //             //       params.data.antibanking.timeRemains   = -1;
    //             //       closePlayerSession(params, function(callBack){
    //             //         console.error("closePlayerSession - callBack", callBack);
    //             //         removeAntiBanking(params,function(cb){
    //             //           console.error("removeAntiBanking - cb", cb);
    //             //         })
    //             //       })
    //             //     }
    //             //     var playerScore = 0;
    //             //     if(params.data.antibanking.isAntiBanking){
    //             //       var playerScore = convert.convert((params.data.antibanking.amount - (res[0]? res[0].sum:0)));
    //             //       if(playerScore < 0){
    //             //         params.data.antibanking.isAntiBanking = false;
    //             //         params.data.antibanking.amount        = -1;
    //             //         params.data.antibanking.timeRemains   = -1;
    //             //         params.data.antibanking.isLower = true; 
    //             //       }
    //             //     }
    //             //     cb(null, params);
    //             // })
    //         } else {
    //             serverLog(stateOfX.serverLogType.error, popupTextManager.dbQyeryInfo.DB_GETANTIBANKING_FAIL);
    //             cb({ success: false, channelId: (params.channelId || ""), info: popupTextManager.dbQyeryInfo.DB_GETANTIBANKING_FAIL, isRetry: false, isDisplay: false });
    //         }
    //     });
    // }
/*=============================  END  ========================*/

    /*=============================  START  ========================*/
    async  closePlayerSession(params: any): Promise<any> {
    const updateQuery = {
        playerId: params.playerId,
        channelId: params.channelId,
        active: true,
    };

    try {
        const res: any = await this.imdb.getPlayerBuyIn(updateQuery);

        const updateParams = {
            buyins: [],
            score: 0,
            endDate: new Date(),
            active: false,
            totalBuyins: 0,
        };

        if (res && res.length > 0) {
            for (const entry of res) {
                updateParams.buyins.push({
                    amount: entry.amount,
                    createdAt: entry.createdAt,
                });
                updateParams.totalBuyins += entry.amount;
            }
        }

        updateParams.score = params.data.antibankingAmount - updateParams.totalBuyins;

        const updateResult = await this.db.updatePlayerSession(updateQuery, updateParams);

        if (updateResult) {
            return params;
        } else {
            throw {
                success: false,
                channelId: params.channelId || "",
                info: popupTextManagerFromdb.DB_REMOVEANTIBANKING_FAIL,
                isRetry: false,
                isDisplay: false,
            };
        }
    } catch (error) {
        throw error;
    }
}
    // var closePlayerSession = function (params, cb) {
    //     var updateQuery = {};
    //     updateQuery.playerId = params.playerId;
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
    //         updateParams.score = params.data.antibankingAmount - totalBuyins;
    //         updateQuery.active = true;
    //         updateParams.endDate = new Date();
    //         updateParams.active = false;
    //         updateParams.totalBuyins = totalBuyins;
    //         db.updatePlayerSession(updateQuery, updateParams, function (err, res) {
    //             if (!err && res) {
    //                 cb(null, params);
    //             } else {
    //                 cb({ success: false, channelId: (params.channelId || ""), info: popupTextManagerFromdb.DB_REMOVEANTIBANKING_FAIL, isRetry: false, isDisplay: false });
    //             }
    //         });
    //     })
    // }
/*=============================  END  ========================*/

    /*=============================  START  ========================*/
    // remove antibanking data from db
    async removeAntiBanking(params: any): Promise<any> {
      
        try {
          const res = await this.db.removeAntiBankingEntry({
            playerId: params.data.playerId,
            channelId: params.channelId,
          });
      
          if (res) {
            return params;
          } else {
            throw {
              success: false,
              channelId: params.channelId || '',
              info: popupTextManagerFromdb.DB_REMOVEANTIBANKING_FAIL,
              isRetry: false,
              isDisplay: false,
            };
          }
        } catch (err) {
          console.log(
            stateOfX.serverLogType.error,
            'Unable to remove anti banking details in database: ' + JSON.stringify(err)
          );
          return {
            success: false,
            channelId: params.channelId || '',
            info: popupTextManagerFromdb.DB_REMOVEANTIBANKING_FAIL,
            isRetry: false,
            isDisplay: false,
          };
        }
    }
    // var removeAntiBanking = function (params, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'in join room function removeAntiBanking');
    //     db.removeAntiBankingEntry({ playerId: params.data.playerId, channelId: params.channelId }, function (err, res) {
    //         if (!err && res) {
    //             cb(null, params);
    //         } else {
    //             serverLog(stateOfX.serverLogType.error, 'Unable to insert anti banking details in database: ' + JSON.stringify(err));
    //             cb({ success: false, channelId: (params.channelId || ""), info: popupTextManagerFromdb.DB_REMOVEANTIBANKING_FAIL, isRetry: false, isDisplay: false });
    //         }
    //     });
    // }
    /*=============================  END  ========================*/

    /*=============================  START  ========================*/
    // get table data for password validation

    async getTableDataForValidation(params: any): Promise<any> {

        console.log(stateOfX.serverLogType.info, "in joinChannelHandler function getTableDataForValidation " + JSON.stringify(params));
        console.log("in joinChannelHandler function getTableDataForValidation", params);
      
        if (params.data.tableFound) {
          params.success = true;
          return params;
        }
      
        try {
          const result = await this.db.findTableById(params.channelId); // Assumes `db.findTableByIdAsync` exists or is created
      
          result.isPrivate = JSON.parse(result.isPrivateTabel);
          result.password = result.passwordForPrivate;
      
          params.table = result;
          params.success = true;
      
          return params;
        } catch (error) {
          console.log(stateOfX.serverLogType.error, "Error in getTableDataForValidation: " + error);
          return {
            success: false,
            isRetry: false,
            isDisplay: true,
            channelId: params.channelId || "",
            info: popupTextManager.falseMessages.DB_CHANNEL_NOTFOUND,
          };
        }
      }


    // joinRequestUtil.getTableDataForValidation = function (params, cb) {
    //     serverLog(stateOfX.serverLogType.info, "in joinChannelHandler function getTableDataForValidation " + params);
    //     console.log("in joinChannelHandler function getTableDataForValidation ", params);
    //     if (params.data.tableFound) {
    //         params.success = true;
    //         cb(params);
    //         return;
    //     }
    //     db.findTableById(params.channelId, function (err, result) {
    //         console.log("err, result ", err, result);
    //         if (!err && result) {
    //             result.isPrivate = JSON.parse(result.isPrivateTabel);
    //             result.password = result.passwordForPrivate;
    //             params.table = result;
    //             params.success = true;
    //             cb(params);
    //             return;
    //         } else {
    //             return cb({ success: false, isRetry: false, isDisplay: true, channelId: (params.channelId || ""), info: popupTextManager.falseMessages.DB_CHANNEL_NOTFOUND });
    //         }
    //     })
    // }
    /*=============================  END  ========================*/
}

