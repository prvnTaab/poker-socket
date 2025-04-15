import { Injectable } from "@nestjs/common";
import * as _ from 'underscore';
import { systemConfig, stateOfX, popupTextManager } from 'shared/common';
import { ImdbDatabaseService } from "shared/common/datebase/Imdbdatabase.service";



declare const pomelo: any;








@Injectable()
export class IdlePlayersHandlerService {

    private configMsg = popupTextManager.falseMessages;
    private dbConfigMsg = popupTextManager.dbQyeryInfo;


    constructor(
        private readonly imdb: ImdbDatabaseService,

    ) { }



    /*=============================  START  =======================*/
    // Get all in memory cache tables
    // created with current server

    // New
    async getAllTables(params: any): Promise<any> {
        try {
        const tables = await this.imdb.getAllTable({ "channelType": stateOfX.gameType.normal, 'serverId': params.globalThis.app.get('serverId') });
    
        if (tables && tables.length > 0) {
            params.tables = tables;
        } else {
            throw new Error(this.dbConfigMsg.DBGETALLTABLESFAIL_IDLEPLAYERSHANDLER);
        }
        } catch (err) {
        console.log(stateOfX.serverLogType.info, 'Error while fetching tables: ' + JSON.stringify(err));
        throw err; // Propagate error
        }
    }
    

    // Old
    // var getAllTables = function (params, cb) {
    //     imdb.getAllTable({ "channelType": stateOfX.gameType.normal, 'serverId': params.globalThis.app.get('serverId') }, function (err, tables) {
    //         if (!err && !!tables && tables.length > 0) {
    //             serverLog(stateOfX.serverLogType.info, 'The tables in cache database are: ' + JSON.stringify(_.pluck(tables, 'channelName')));
    //             params.tables = tables;
    //             cb(null, params);
    //         } else {
    //             serverLog(stateOfX.serverLogType.info, 'No tables are found in cache database, not cheking validation of idle players! - ' + JSON.stringify(err));
    //             // cb({success: false, info: 'No tables are found in cache database, not cheking validation of idle players!'});
    //             cb({ success: false, info: dbConfigMsg.DBGETALLTABLESFAIL_IDLEPLAYERSHANDLER, isRetry: false, isDisplay: false, channelId: "" });
    //         }
    //     });
    // }
    /*=============================  ENd  =======================*/


    /*=============================  START  =======================*/
// // Check if players are available into table

// New
async checkIfPlayersAvailable(params: any): Promise<any> {
    const tablesWithPlayers: any[] = [];

    for (const table of params.tables) {
        if (table.players.length >= 1 && table.stateInternal === stateOfX.gameState.idle) {
            console.log(
                stateOfX.serverLogType.info,
                'There are players in table ' + table.channelName + ', players: ' + JSON.stringify(_.pluck(table.players, 'playerName'))
            );
            tablesWithPlayers.push(table);
        } else {
            console.log(
                stateOfX.serverLogType.info,
                'Skipping table ' + table.channelName + ' as there are no players in this table.'
            );
        }
    }

    params.tables = tablesWithPlayers;
    return params;
}


// Old
// var checkIfPlayersAvailable = function (params, cb) {
//     var tablesWithPlayers = [];
//     async.each(params.tables, function (table, ecb) {
//         //changed length == 1 to length >= 1; 
//         if (table.players.length >= 1 && table.stateInternal == stateOfX.gameState.idle) {
//             serverLog(stateOfX.serverLogType.info, 'There are players in table ' + table.channelName + ', players: ' + JSON.stringify(_.pluck(table.players, 'playerName')));
//             tablesWithPlayers.push(table);
//         } else {
//             // console.log("i am inside else in skiping tbale checkIfPlayersAvailable in function")
//             serverLog(stateOfX.serverLogType.info, 'Skipping table ' + table.channelName + ' as there is no players in this table.');
//         }
//         ecb();
//     }, function (err) {
//         if (err) {
//             // cb({success: false, info: "Error while checking players on cache table: " + JSON.stringify(err)});
//             cb({ success: false, info: dbConfigMsg.CHECKIFPLAYERSAVAILABLEFAIL_IDLEPLAYERSHANDLER + JSON.stringify(err), isRetry: false, isDisplay: false, channelId: "" });
//         } else {
//             params.tables = tablesWithPlayers;
//             cb(null, params);
//         }
//     });
// }
    /*=============================  END  =======================*/

    /*=============================  START  =======================*/
    // Check if player is PLAYING or not
    // Check players last activity
    // Take a difference with current time and if it crosses pre-defined allowed idle interval
    // Get this player's session
    // If no session found then remove player from table immediately

    // New
    async isPlayerPlaying(params: any): Promise<any> {

        if (params.processingPlayer.state === stateOfX.playerState.onBreak) {
            console.log(stateOfX.serverLogType.info, 'Player is in playing mode, so skipping removal of this player!');
            return params;
        } else {
            console.log(stateOfX.serverLogType.info, 'Player is not in playing mode, considering for removal because of idle time crossed!');
            throw {
                success: false,
                info: "Player is in playing mode, so skipping removal of this player!",
                isRetry: false,
                isDisplay: false,
                channelId: ""
            };
        }
    }


    // Old
    // var isPlayerPlaying = function (params, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'In function isPlayerPlaying!')
    //     //cb(null, params);
    //     if (params.processingPlayer.state == stateOfX.playerState.onBreak) {
    //         serverLog(stateOfX.serverLogType.info, 'Player is in playing mode, so skipping removal of this player!');
    //         cb(null, params);
    //     } else {
    //         serverLog(stateOfX.serverLogType.info, 'Player is not in playing mode, considering for removal because of idle time crossed!');
    //         cb({ success: false, info: "Player is in playing mode, so skipping removal of this player!", isRetry: false, isDisplay: false, channelId: "" });
    //     }
    // }
    /*=============================  END  =======================*/


    /*=============================  START  =======================*/
    // Check if player crossed the idle time limit

    // New
    async isPlayerCrossedLimit(params: any): Promise<any> {

        const idleTimeForCurrentPlayer = Number(new Date()) - params.processingPlayer.activityRecord.lastActivityTime;

        if (parseInt(String(idleTimeForCurrentPlayer / 1000)) >= parseInt(String(systemConfig.removeIdlePlayersAfter))) {
            console.log(stateOfX.serverLogType.info, 'Player crossed the idle time limit, remove from the table!');
            return params;
        } else {
            console.log(stateOfX.serverLogType.info, 'Player yet not crossed the idle time limit, remove from the table!');
            throw {
                success: false,
                info: this.configMsg.ISPLAYERCROSSEDLIMITFAIL_IDLEPLAYERSHANDLER,
                isRetry: false,
                isDisplay: false,
                channelId: ""
            };
        }
    }


    // Old
    // var isPlayerCrossedLimit = function (params, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'In function isPlayerCrossedLimit!')
    //     var idleTimeForCurrentPlayer = Number(new Date()) - (params.processingPlayer.activityRecord.lastActivityTime);
    //     serverLog(stateOfX.serverLogType.info, 'This player idle time: ' + parseInt(idleTimeForCurrentPlayer / 1000));
    //     if (parseInt(idleTimeForCurrentPlayer / 1000) >= parseInt(systemConfig.removeIdlePlayersAfter)) {
    //         serverLog(stateOfX.serverLogType.info, 'Player crossed the idle time limit, remove from the table!');
    //         cb(null, params);
    //     } else {
    //         serverLog(stateOfX.serverLogType.info, 'Player yet not crossed the idle time limit, remove from the table!');
    //         // cb({success: false, info: "Player still not crossed the idle limit, not removing from table!"});
    //         cb({ success: false, info: configMsg.ISPLAYERCROSSEDLIMITFAIL_IDLEPLAYERSHANDLER, isRetry: false, isDisplay: false, channelId: "" });
    //     }
    // }
    /*=============================  END  =======================*/

    /*=============================  START  =======================*/
    // get player session setting from frontend server

    // New
    async getPlayerSession(params: any): Promise<any> {

        params.processingPlayer.serverId = 'connector-server-1';


        // Pomelo Connection
        const sessionExist = await new Promise<any>((resolve, reject) => {
            pomelo.app.rpc.connector.entryRemote.getUserSession(
                { frontendId: params.processingPlayer.serverId },
                { playerId: params.processingPlayer.playerId },
                (sessionExist: any) => {
                    resolve(sessionExist);
                }
            );
        });
        // Pomelo Connection


        params.sessionDetails.isSessionExists = true;
        params.sessionDetails.sessionId = 'connector-server-1';

        return params;
    }


    // Old
    // var getPlayerSession = function (params, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'In function getPlayerSession!')
    //     serverLog(stateOfX.serverLogType.info, 'Going to get session for playerId: ' + params.processingPlayer.playerId);
    //     // db.findUserSessionInDB(params.processingPlayer.playerId, function (err, result) {
    //     // if(err || !result){
    //     // 	cb('db query failed - findUserSessionInDB'); return;
    //     // }
    //     params.processingPlayer.serverId = 'connector-server-1';
    //     pomelo.app.rpc.connector.entryRemote.getUserSession({ frontendId: params.processingPlayer.serverId }, { playerId: params.processingPlayer.playerId }, function (sessionExist) {
    //         serverLog(stateOfX.serverLogType.info, 'Getting player session response: ' + JSON.stringify(sessionExist));
    //         // if(sessionExist.success && !sessionExist.isDisconnectedForce) {
    //         params.sessionDetails.isSessionExists = true;
    //         params.sessionDetails.sessionId = 'connector-server-1';
    //         // }
    //         cb(null, params);
    //     });
    //     // })
    // }
    /*=============================  END  =======================*/


    /*=============================  START  =======================*/
    // Set this player's session as disconnected forecefully

    // New
    async setPlayerDisconnected(params: any): Promise<any> {

        if (params.sessionDetails.isSessionExists) {

            // Pomelo Connection
            pomelo.app.rpc.connector.entryRemote.sessionKeyValue(
                { frontendId: params.processingPlayer.serverId },
                { playerId: params.processingPlayer.playerId, key: 'isConnected', value: false },
                (valueOfKey: any) => {
                    console.log(stateOfX.serverLogType.info, 'Setting player session key-value: isConnected ' + JSON.stringify(valueOfKey));
                }
            );
            // Pomelo Connection
        }

        return params;
    }

    // Old
    // var setPlayerDisconnected = function (params, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'In function setPlayerDisconnected!')
    //     if (params.sessionDetails.isSessionExists) {
    //         pomelo.app.rpc.connector.entryRemote.sessionKeyValue({ frontendId: params.processingPlayer.serverId }, { playerId: params.processingPlayer.playerId, key: 'isConnected', value: false }, function (valueOfKey) {
    //             serverLog(stateOfX.serverLogType.info, 'Setting player session key-value: isConnected' + JSON.stringify(valueOfKey));
    //             cb(null, params);
    //         });
    //     } else {
    //         cb(null, params);
    //     }
    //     // 	var currentSession = params.globalThis.app.get('sessionService').getByUid(params.processingPlayer.playerId) ? params.globalThis.app.get('sessionService').getByUid(params.processingPlayer.playerId) : null;
    //     // 	if(!!currentSession) {
    //     // 		currentSession[0]["settings"]["isConnected"] = false;
    //     // 	}
    //     // 	cb(null, params);
    //     // } else {
    //     // 	cb(null, params);
    //     // }
    // }
    /*=============================  END  =======================*/

    /*=============================  START  =======================*/
    // deprecated

    // New
    async pingPlayerForConnection(params: any): Promise<any> {

        if (params.sessionDetails.isSessionExists) {
            const broadcastHandler = require("./broadcastHandler");
            broadcastHandler.fireAckBroadcastOnLogin({
                self: { app: params.globalThis.app },
                playerId: params.processingPlayer.playerId,
                serverId: params.processingPlayer.serverId,
                data: {}
            });
        }

        await new Promise<void>(resolve => setTimeout(resolve, Number(systemConfig.isConnectedCheckTime) * 1000));

        return params;
    }

    // Old
    // var pingPlayerForConnection = function (params, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'In function pingPlayerForConnection!', params)
    //     if (params.sessionDetails.isSessionExists) {
    //         var broadcastHandler = require("./broadcastHandler");
    //         serverLog(stateOfX.serverLogType.info, 'Session exists for this player so going to ping for connection!');
    //         broadcastHandler.fireAckBroadcastOnLogin({ self: { "app": params.globalThis.app }, playerId: params.processingPlayer.playerId, serverId: params.processingPlayer.serverId, data: {} });
    //     }
    //     setTimeout(function () {
    //         cb(null, params);
    //     }, parseInt(systemConfig.isConnectedCheckTime) * 1000);
    // }
    /*=============================  END  =======================*/

// Remove player from the table if idle time limit has been crossed
// var leavePlayer = function(params, cb){
// 	serverLog(stateOfX.serverLogType.info, 'In function leavePlayer!',params)
// 	if(!params.sessionDetails.isSessionExists) {
// 		serverLog(stateOfX.serverLogType.info, 'Leaving this player as session not found in pomelo!')
// 		params.handler.leaveTable({self: {app: null, keepThisApp: false}, playerId: params.processingPlayer.playerId, channelId: params.processingPlayer.channelId, isStandup: true, isRequested: false, playerName: params.processingPlayer.playerName}, {}, function(leaveTableResponse){
// 			serverLog(stateOfX.serverLogType.info, 'leaveTableResponse - ' + JSON.stringify(leaveTableResponse));
// 			cb(null, params);
// 		});
// 	} else {
// 		params.globalThis.app.rpc.connector.entryRemote.sessionKeyValue({frontendId: params.processingPlayer.serverId}, {playerId: params.processingPlayer.playerId, key: 'isConnected'}, function (valueOfKey) {
// 			serverLog(stateOfX.serverLogType.info, 'Getting player session key-value: isConnected' + JSON.stringify(valueOfKey));
// 			serverLog(stateOfX.serverLogType.info, 'Is current player still connected: ' + valueOfKey);
// 			if(valueOfKey.success && !!valueOfKey.value){
// 				serverLog(stateOfX.serverLogType.info, 'The player is connected, so skipping leave from table as idle player!');
// 				cb(null, params);
// 			} else{
// 				serverLog(stateOfX.serverLogType.info, 'Leaving this player as session is no more connected!')
// 				params.handler.leaveTable({self: {app: null, keepThisApp: false}, playerId: params.processingPlayer.playerId, channelId: params.processingPlayer.channelId, isStandup: true, isRequested: false, playerName: params.processingPlayer.playerName}, 'session', function(leaveTableResponse){
// 					serverLog(stateOfX.serverLogType.info, 'leaveTableResponse - ' + JSON.stringify(leaveTableResponse));
// 					// TODO: Kill this player session from pomelo as well
// 					// if(valueOfKey.success){
// 					// 	params.globalThis.app.rpc.connector.entryRemote.killUserSessionByUid({frontendId: params.processingPlayer.serverId}, params.processingPlayer.playerId, function (killUserSessionResponse) {
// 					// 		cb(null, params); return;
// 					// 	});
// 					// }
// 					serverLog(stateOfX.serverLogType.info, 'Session details missing for this player, removing from table!')
// 					cb(null, params);
// 				});
// 			}
// 		});
// 		// var currentSession = params.globalThis.app.get('sessionService').getByUid(params.processingPlayer.playerId) ? params.globalThis.app.get('sessionService').getByUid(params.processingPlayer.playerId) : null;

// 		// if(!!currentSession && currentSession.length > 0) {
// 		// 	if(!currentSession[0]["settings"]["isConnected"]) {

// 		// 	} else {
// 		// 		serverLog(stateOfX.serverLogType.info, 'The player is connected, so skipping leave from table as idle player!');
// 		// 		cb(null, params);
// 		// 	}
// 		// } else {
// 		// 	params.handler.leaveTable({self: {app: null, keepThisApp: false}, playerId: params.processingPlayer.playerId, channelId: params.processingPlayer.channelId, isStandup: false, isRequested: false, playerName: params.processingPlayer.playerName}, {}, function(leaveTableResponse){
// 		// 		serverLog(stateOfX.serverLogType.info, 'leaveTableResponse - ' + JSON.stringify(leaveTableResponse));
// 		// 		cb(null, params);
// 		// 	});
// 		// }
// 	}
// }

    /*=============================  START  =======================*/
    // fetch player session object from db

    // New
    async getPlayerSessionServer(params: any): Promise<any> {


        // Pomelo Connection
        const res = await new Promise<any>(resolve => {
            pomelo.app.rpc.database.dbRemote.findUserSessionInDB('', params.processingPlayer.playerId, (res: any) => {
                resolve(res);
            });
        });
        // Pomelo Connection

        if (res.success) {
            params.processingPlayer.serverId = res.result.serverId;
        }

        return params;
    }


    // Old
    // var getPlayerSessionServer = function (params, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'In channelTimerHandler in getPlayerSessionServer');
    //     pomelo.app.rpc.database.dbRemote.findUserSessionInDB('', params.processingPlayer.playerId, function (res) {
    //         if (res.success) {
    //             params.processingPlayer.serverId = res.result.serverId;
    //             cb(null, params);
    //         } else {
    //             cb(null, params);
    //         }
    //     })
    // }
    /*=============================  END  =======================*/


    /*=============================  START  =======================*/
// run autoLeave via connector

// New
async getHitLeave(params: any): Promise<any> {

    if (params.processingPlayer.serverId) {
        const currentTime = new Date();
        const currentMinuts = this.diffMinutes(Number(new Date()), params.processingPlayer.activityRecord.lastActivityTime);

        if (currentMinuts >= Number(systemConfig.removeIdelPlayerInMinuts) && params.processingPlayer.state === stateOfX.playerState.onBreak) {

            // Pomelo Connection
            // Forward message RPC (fire and forget style)
            pomelo.app.sysrpc['room'].msgRemote.forwardMessage(
                { forceFrontendId: "room-server-1" },
                {
                    body: { 
                        playerId: params.processingPlayer.playerId, 
                        playerName: params.processingPlayer.playerName, 
                        isStandup: true, 
                        channelId: params.processingPlayer.channelId, 
                        isRequested: false, 
                        origin: 'idlePlayer' 
                    },
                    route: "room.channelHandler.leaveTable"
                },
                (err: any, hitLeaveResponse: any) => {
                    console.log(stateOfX.serverLogType.info, 'response of rpc-hitLeave' + JSON.stringify(hitLeaveResponse));
                }
            );
            // Pomelo Connection
        }
    }

    return params;
}

// Old
// var getHitLeave = function (params, cb) {
//     console.log('idlePlayersHandler getHitLeave', params);
//     serverLog(stateOfX.serverLogType.info, 'In channelTimerHandler in getHitLeave', params);
//     if (params.processingPlayer.serverId) {
//         var currentTime = new Date();
//         var currentMinuts = diffMinutes(Number(new Date()), params.processingPlayer.activityRecord.lastActivityTime);
//         console.log('Inside idlePlayersHandler getHitLeave', params.player, params.table);
//         if (currentMinuts >= parseInt(systemConfig.removeIdelPlayerInMinuts) && params.processingPlayer.state === stateOfX.playerState.onBreak) {
//             console.log("rs3en45")

//             pomelo.app.sysrpc['room'].msgRemote.forwardMessage(
//                 { forceFrontendId: "room-server-1" },
//                 {
//                     body: { playerId: params.processingPlayer.playerId, playerName: params.processingPlayer.playerName, isStandup: true, channelId: params.processingPlayer.channelId, isRequested: false, origin: 'idlePlayer' },
//                     route: "room.channelHandler.leaveTable"
//                 },
//                 function (err, hitLeaveResponse) {
//                     serverLog(stateOfX.serverLogType.info, 'response of rpc-hitLeave' + JSON.stringify(hitLeaveResponse));
//                     cb(null, params);
//                 }
//             );

//             // pomelo.app.rpc.connector.sessionRemote.hitLeave({ frontendId: 'connector-server-1' }, { playerId:  params.processingPlayer.playerId, playerName: params.processingPlayer.playerName, isStandup: true, channelId:  params.processingPlayer.channelId, isRequested: false, origin: 'idlePlayer'}, function (hitLeaveResponse) {
//             //   serverLog(stateOfX.serverLogType.info, 'response of rpc-hitLeave' + JSON.stringify(hitLeaveResponse));
//             //   cb(null, params);
//             // })
//         } else {
//             cb(null, params);
//         }
//     } else {
//         cb(null, params);
//     }
// }
    /*=============================  END  =======================*/


    /*=============================  START  =======================*/

    diffMinutes(date2, date1) {
        let diffrent = (date2 - date1) / 1000;
        diffrent /= 60;
        return Math.abs(Math.round(diffrent));
    }
    /*=============================  END  =======================*/


    /*=============================  START  =======================*/
    // process a player

    // New
    async processPlayer(params: any): Promise<any> {
        try {
            // Execute the functions sequentially
            await this.isPlayerPlaying(params);
            await this.getPlayerSession(params);
            await this.getHitLeave(params);

            // Return success result after all steps
            return { success: true, info: this.configMsg.PROCESSPLAYERTRUE_IDLEPLAYERSHANDLER, isRetry: false, isDisplay: false, channelId: "" };
        } catch (err) {
            // Handle any errors during the process
            return { success: false, info: this.configMsg.PROCESSPLAYERFAIL_IDLEPLAYERSHANDLER + JSON.stringify(err), isRetry: false, isDisplay: false, channelId: "" };
        }
    }


    // Old
    // var processPlayer = function (params, cb) {
    //     async.waterfall([
    //         async.apply(isPlayerPlaying, params),
    //         //isPlayerCrossedLimit,
    //         getPlayerSession,
    //         //setPlayerDisconnected,
    //         //pingPlayerForConnection,
    //         //getPlayerSessionServer,
    //         getHitLeave
    //         // leavePlayer
    //     ], function (err, response) {
    //         if (err) {
    //             // cb({success: false, info: "Error while processing a player for idle cases! - " + JSON.stringify(err)});
    //             cb({ success: false, info: configMsg.PROCESSPLAYERFAIL_IDLEPLAYERSHANDLER + JSON.stringify(err), isRetry: false, isDisplay: false, channelId: "" });
    //         } else {
    //             // cb({success:  true, info: "Player processed successfully!"});
    //             cb({ success: true, info: configMsg.PROCESSPLAYERTRUE_IDLEPLAYERSHANDLER, isRetry: false, isDisplay: false, channelId: "" });
    //         }
    //     });
    // }
    /*=============================  END  =======================*/

    /*=============================  START  =======================*/
    // Start processing player from each inmem table each player

    // New
    async startProcessingPlayers(params: any): Promise<any> {
        try {
            for (const table of params.tables) {
                
                for (const player of table.players) {
                    params.processingPlayer = player;

                    const processPlayerResponse = await this.processPlayer(params);

                    if (!processPlayerResponse.success) {
                        // Handle player processing failure
                        continue;
                    }
                }
            }

            // Return the final params if all processing is successful
            return params;
        } catch (err) {
            // Handle any errors during processing
            return { success: false, info: this.configMsg.STARTPROCESSINGPLAYERFAIL_IDLEPLAYERSHANDLER + JSON.stringify(err), isRetry: false, isDisplay: false, channelId: "" };
        }
    }


    // Old
    // var startProcessingPlayers = function (params, cb) {
    //     async.eachSeries(params.tables, function (table, ecb) {
    //         serverLog(stateOfX.serverLogType.info, 'Processing players from cache table: ' + table.channelName + ' for players: ' + JSON.stringify(_.pluck(table.players, 'playerName')));
    //         async.eachSeries(table.players, function (player, secb) {
    //             serverLog(stateOfX.serverLogType.info, 'Going to start process player: ' + JSON.stringify(player));
    //             params.processingPlayer = player;
    //             processPlayer(params, function (processPlayerResponse) {
    //                 if (processPlayerResponse.success) {
    //                     secb();
    //                 } else {
    //                     secb();
    //                 }
    //             })
    //         }, function (err) {
    //             if (err) {
    //                 // cb({success: false, info: "PLAYERS: Error while processing players on cache table: " + JSON.stringify(err)});
    //                 cb({ success: false, info: configMsg.STARTPROCESSINGPLAYERFAIL_IDLEPLAYERSHANDLER + JSON.stringify(err), isRetry: false, isDisplay: false, channelId: "" });
    //             } else {
    //                 ecb();
    //             }
    //         })
    //     }, function (err) {
    //         if (err) {
    //             cb({ success: false, info: "TABLE: Error while processing players on cache table: " + JSON.stringify(err), isRetry: false, isDisplay: false, channelId: "" });
    //         } else {
    //             cb(null, params);
    //         }
    //     })
    // }
    /*=============================  END  =======================*/

    /*=============================  START  =======================*/
    // run by cron - remove idle sitting players from table
    // time and player state dependent

    // New
    async process(params: any): Promise<void> {
        // Initial session details setup
        params.sessionDetails = {
            isSessionExists: false,
            sesisonId: -1
        };

        try {
            // Get all tables with current serverId
            await this.getAllTables(params);

            // Check if players are available
            await this.checkIfPlayersAvailable(params);

            // Start processing players
            await this.startProcessingPlayers(params);

        } catch (err) {
            // Log error message if something goes wrong
            console.log(stateOfX.serverLogType.info, 'Error while performing idle player removal: ' + JSON.stringify(err));
        }
    }


    // Old
    // idlePlayersHandler.process = function (params) {
    //     // console.log("i am inside idlePlayersHandler processsss function ",params)
    //     params.sessionDetails = {
    //         isSessionExists: false,
    //         sesisonId: -1
    //     }
    //     // setInterval(function(){
    //     async.waterfall([
    //         async.apply(getAllTables, params), // get all tables only with current serverId
    //         checkIfPlayersAvailable,
    //         startProcessingPlayers
    //     ], function (err, response) {
    //         if (err) {
    //             serverLog(stateOfX.serverLogType.info, 'Error while performing idle player removal: ' + JSON.stringify(err))
    //         } else {
    //             serverLog(stateOfX.serverLogType.info, 'Idle players check performed successfully!')
    //         }
    //     });
    //     // }, parseInt(systemConfig.checkIdlePlayerInterval)*1000);
    // }
    /*=============================  END  =======================*/




}