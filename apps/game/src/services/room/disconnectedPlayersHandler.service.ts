import { Injectable } from "@nestjs/common";
import { ImdbDatabaseService } from "shared/common/datebase/Imdbdatabase.service";
import { systemConfig, stateOfX, popupTextManager } from 'shared/common';
import { BroadcastHandlerService } from "./broadcastHandler.service";







declare const pomelo: any;







@Injectable()
export class DisconnectedPlayersHandlerService {

    private configMsg = popupTextManager.falseMessages;
    private dbConfigMsg = popupTextManager.dbQyeryInfo;

    constructor(
        private imdb: ImdbDatabaseService,
        private broadcastHandler: BroadcastHandlerService
    ) { }





    /*========================  START  ============================*/
    // Get all in memory cache tables
    // created with current server

    // New
    async getAllTables(params: any): Promise<any> {
        try {
            const tables = await this.imdb.getAllTable({
                channelType: stateOfX.gameType.normal,
                serverId: params.globalThis.app.get('serverId'),
            });

            if (tables && tables.length > 0) {

                params.tables = tables;
                return params;
            } else {

                return {
                    success: false,
                    info: this.dbConfigMsg.DBGETALLTABLESFAIL_IDLEPLAYERSHANDLER,
                    isRetry: false,
                    isDisplay: false,
                    channelId: '',
                };
            }
        } catch (err) {

            return {
                success: false,
                info: this.dbConfigMsg.DBGETALLTABLESFAIL_IDLEPLAYERSHANDLER,
                isRetry: false,
                isDisplay: false,
                channelId: '',
            };
        }
    }

    // Old
    // var getAllTables = function(params, cb) {
    // 	imdb.getAllTable({"channelType": stateOfX.gameType.normal, 'serverId': params.globalThis.app.get('serverId')}, function(err, tables){
    // 		if(!err && !!tables && tables.length > 0) {
    // 			serverLog(stateOfX.serverLogType.info, 'The tables in cache database are: ' + JSON.stringify(_.pluck(tables, 'channelName')));
    // 			params.tables = tables;
    // 			cb(null, params);
    // 		} else {
    // 			serverLog(stateOfX.serverLogType.info, 'No tables are found in cache database, not cheking validation of idle players! - ' + JSON.stringify(err));
    // 			 cb({success: false, info: dbConfigMsg.DBGETALLTABLESFAIL_IDLEPLAYERSHANDLER, isRetry: false, isDisplay: false, channelId: ""});
    // 		}
    // 	});
    // }
    /*========================  END  ============================*/


    /*========================  START  ============================*/
    // // Check if players are available into table

    // New
    async checkIfPlayersAvailable(params: any): Promise<any> {
        const tablesWithPlayers = [];

        for (const table of params.tables) {
            if (table.players.length === 1 && table.stateInternal === stateOfX.gameState.idle) {

                tablesWithPlayers.push(table);
            } else {
                console.log(
                    stateOfX.serverLogType.info,
                    `Skipping table ${table.channelName} as there is no player in this table.`
                );
            }
        }

        if (tablesWithPlayers.length > 0) {
            params.tables = tablesWithPlayers;
            return params;
        } else {
            return {
                success: false,
                info: this.dbConfigMsg.CHECKIFPLAYERSAVAILABLEFAILnLEPLAYERSHANDLER,
                isRetry: false,
                isDisplay: false,
                channelId: '',
            };
        }
    }

    // Old
    // var checkIfPlayersAvailable = function (params, cb) {
    // 	var tablesWithPlayers = [];
    // 	async.each(params.tables, function(table, ecb){
    // 		if(table.players.length == 1 && table.stateInternal == stateOfX.gameState.idle) {
    // 			serverLog(stateOfX.serverLogType.info, 'There are players in table ' + table.channelName + ', players: ' + JSON.stringify(_.pluck(table.players, 'playerName')));
    // 			tablesWithPlayers.push(table);
    // 		} else {
    // 			serverLog(stateOfX.serverLogType.info, 'Skipping table ' + table.channelName + ' as there is no players in this table.');
    // 		}
    // 		ecb();
    // 	}, function(err) {
    // 		if(err) {
    // 			// cb({success: false, info: "Error while checking players on cache table: " + JSON.stringify(err)});
    // 			cb({success: false, info: dbConfigMsg.CHECKIFPLAYERSAVAILABLEFAILnLEPLAYERSHANDLER + JSON.stringify(err), isRetry: false, isDisplay: false, channelId: ""});
    // 		} else {
    // 			params.tables = tablesWithPlayers;
    // 			cb(null, params);
    // 		}
    // 	});
    // }
    /*========================  END  ============================*/


    /*========================  START  ============================*/
    // Check if player is PLAYING or not
    // Check players last activity
    // Take a difference with current time and if it crosses pre-defined allowed idle interval
    // Get this player's session
    // If no session found then remove player from table immediately

    // New
    async isPlayerPlaying(params: any): Promise<any> {

        if (params.processingPlayer.state === stateOfX.playerState.disconnected) {

            return params;
        } else {
            return {
                success: false,
                info: 'Player is in playing mode, so skipping removal of this player!',
                isRetry: false,
                isDisplay: false,
                channelId: '',
            };
        }
    }
    // Old
    // var isPlayerPlaying = function(params, cb) {
    // 	serverLog(stateOfX.serverLogType.info, 'In function isPlayerPlaying!')
    // 		//cb(null, params);
    // 	if(params.processingPlayer.state == stateOfX.playerState.disconnected ) {
    // 		serverLog(stateOfX.serverLogType.info, 'Player is in playing mode, so skipping removal of this player!');
    // 		cb(null, params);
    // 	} else {
    // 		serverLog(stateOfX.serverLogType.info, 'Player is not in playing mode, considering for removal because of idle time crossed!');
    // 		cb({success: false, info: "Player is in playing mode, so skipping removal of this player!", isRetry: false, isDisplay: false, channelId: ""});
    // 	}
    // }
    /*========================  END  ============================*/


    /*========================  START  ============================*/
    // get player session setting from frontend server

    // New
    async getPlayerSession(params: any): Promise<any> {
        // Log the request to retrieve the session
        // Using a simple console log here as an example

        // Simulating session data assignment
        // In the original code, this would be from an external service like Pomelo
        params.sessionDetails.isSessionExists = true;
        params.sessionDetails.sessionId = 'connector-server-1';

        // Returning the updated params object
        return params;
    }

    // Old
    // var getPlayerSession = function(params, cb) {
    // 	// serverLog(stateOfX.serverLogType.info, 'In function getPlayerSession!')
    // 	// serverLog(stateOfX.serverLogType.info, 'Going to get session for playerId: ' + params.processingPlayer.playerId); 
    // 	// 	params.processingPlayer.serverId =  'connector-server-1' ;
    // 	// 	pomelo.app.rpc.connector.entryRemote.getUserSession({frontendId: params.processingPlayer.serverId}, {playerId: params.processingPlayer.playerId}, function (sessionExist) {
    // 	// 		serverLog(stateOfX.serverLogType.info, 'Getting player session response: ' + JSON.stringify(sessionExist));
    // 	// 		if(sessionExist.success && !sessionExist.isDisconnectedForce) {
    // 				params.sessionDetails.isSessionExists = true;
    // 				params.sessionDetails.sessionId       = 'connector-server-1' ;
    // 			// }
    // 			cb(null, params);
    // 		// });
    // }
    /*========================  END  ============================*/


    /*========================  START  ============================*/
    // fetch player session object from db

    // New
    async getPlayerSessionServer(params: any): Promise<any> {

        // Pomelo Connection
        // Simulate the database call and await the result
        const res = await pomelo.app.rpc.database.dbRemote.findUserSessionInDB('', params.processingPlayer.playerId);
        // Pomelo Connection

        if (res.success) {
            params.processingPlayer.serverId = res.result.serverId;
        }

        return params;
    }

    // Old
    // var getPlayerSessionServer = function (params, cb) {
    //   serverLog(stateOfX.serverLogType.info, 'In channelTimerHandler in getPlayerSessionServer');
    //   pomelo.app.rpc.database.dbRemote.findUserSessionInDB('', params.processingPlayer.playerId, function (res) {
    //     if (res.success) {
    //       params.processingPlayer.serverId = res.result.serverId;
    //       cb(null, params);
    //     } else {
    //       cb(null, params);
    //     }
    //   })
    // }
    /*========================  END  ============================*/


    /*========================  START  ============================*/
    // run change player state on disconnection via connector

    // New
    async getHitChangeState(params: any): Promise<any> {

        if (params.processingPlayer.serverId) {
            // Simulate fetching player record
            const res = await this.imdb.playerJoinedRecord({ playerId: params.processingPlayer.playerId });

            if (!res || res.length <= 0) {
                return;
            }

            for (const record of res) {
                const channelId = record.channelId;
                const playerId = record.playerId;
                const state = stateOfX.playerState.onBreak;
                const previousState = stateOfX.playerState.disconnected;
                const currentMinutes = this.diffMinutes(new Date(), params.processingPlayer.lastChangedStateTime);

                if (currentMinutes >= stateOfX.disconnectedMoveSitout && params.processingPlayer.state === stateOfX.playerState.disconnected) {
                    const playerStateUpdateRes = await this.imdb.playerStateUpdateOnDisconnections(channelId, playerId, state, previousState);

                    if (playerStateUpdateRes) {
                        const channel = pomelo.app.get('channelService').getChannel(channelId, false);
                        this.broadcastHandler.firePlayerStateOnDisconnected({
                            channel: channel,
                            channelId: channelId,
                            playerId: playerId,
                            state: state,
                        });
                    }
                }
            }
        }

        return params;
    }

    // Old
    // var getHitChangeState = function (params, cb) {
    // serverLog(stateOfX.serverLogType.info, 'In channelTimerHandler in getHitChangeState',params);
    //   if( params.processingPlayer.serverId){
    //   	imdb.playerJoinedRecord({playerId: params.processingPlayer.playerId}, function (err, res) {
    // 		if (err || !res) {
    // 			return;
    // 		}
    // 		if(res.length <= 0){
    // 			return;
    // 		}
    // 		async.each(res, function (record, ecb) {
    // 		var channelId = record.channelId;
    // 		var playerId = record.playerId;
    // 		var state = stateOfX.playerState.onBreak;
    // 		var previousState = stateOfX.playerState.disconnected;
    // 		var currentMinuts = diffMinutes(new Date(),params.processingPlayer.lastChangedStateTime);

    //  if(currentMinuts >= stateOfX.disconnectedMoveSitout && params.processingPlayer.state === stateOfX.playerState.disconnected){
    //   imdb.playerStateUpdateOnDisconnections(channelId,playerId,state,previousState, function (err, res) {
    //        if(res){
    //    	var channel   = pomelo.app.get('channelService').getChannel(channelId, false); 
    //    	broadcastHandler.firePlayerStateOnDisconnected({channel: channel,channelId: channelId, playerId: playerId,state: state});
    // 			}
    // 		  })
    //       }
    //       }, function () {
    // 			return;
    // 	 })
    // 	})

    //   } else{
    //     cb(null, params);
    //   }
    // }
    /*========================  END  ============================*/

    /*========================  START  ============================*/

    // New
    diffMinutes(date2: Date, date1: Date): number {
        const different = (date2.getTime() - date1.getTime()) / 1000;
        const minutes = different / 60;
        return Math.abs(Math.round(minutes));
    }


    // Old
    // var diffMinutes = function(date2, date1) 
    //  {
    //   var diffrent =(date2.getTime() - date1.getTime()) / 1000;
    //   diffrent /= 60;
    //   return Math.abs(Math.round(diffrent));
    //  }
    /*========================  END  ============================*/

    /*========================  START  ============================*/
    // process a player

    // New
    async processPlayer(params: any): Promise<any> {
        try {
            // Call the functions in sequence
            await this.isPlayerPlaying(params);
            await this.getPlayerSession(params);
            await this.getHitChangeState(params);

            // Return success response if all functions are successful
            return { success: true, info: this.configMsg.PROCESSPLAYERTRUE_IDLEPLAYERSHANDLER, isRetry: false, isDisplay: false, channelId: "" };
        } catch (err) {
            // Return error response if any function fails
            return { success: false, info: this.configMsg.PROCESSPLAYERFAIL_IDLEPLAYERSHANDLER + JSON.stringify(err), isRetry: false, isDisplay: false, channelId: "" };
        }
    }


    // Old
    // var processPlayer = function(params, cb) {
    // 	async.waterfall([
    // 		async.apply(isPlayerPlaying, params),
    // 		getPlayerSession,
    // 		getHitChangeState
    // 	], function(err, response){
    // 		if(err) {
    // 			cb({success: false, info: configMsg.PROCESSPLAYERFAIL_IDLEPLAYERSHANDLER + JSON.stringify(err), isRetry: false, isDisplay: false, channelId: ""});
    // 		} else {
    // 			// cb({success:  true, info: "Player processed successfully!"});
    // 			cb({success:  true, info: configMsg.PROCESSPLAYERTRUE_IDLEPLAYERSHANDLER, isRetry: false, isDisplay: false, channelId: ""});
    // 		}
    // 	});
    // }
    /*========================  END  ============================*/

    /*========================  START  ============================*/
    // Start processing player from each inmem table each player

    // New
    async startProcessingPlayers(params: any): Promise<{ success: boolean; info: string; isRetry: boolean; isDisplay: boolean; channelId: string }> {
        try {
            for (const table of params.tables) {

                for (const player of table.players) {
                    params.processingPlayer = player;

                    const processPlayerResponse = await this.processPlayer(params);

                    if (!processPlayerResponse.success) {
                        continue; // If the player processing fails, continue to the next player
                    }
                }
            }

            return { success: true, info: "", isRetry: false, isDisplay: false, channelId: "" };
        } catch (err) {
            return { success: false, info: this.configMsg.STARTPROCESSINGPLAYERFAIL_IDLEPLAYERSHANDLER + JSON.stringify(err), isRetry: false, isDisplay: false, channelId: "" };
        }
    }


    // Old
    // var startProcessingPlayers = function(params, cb) {
    // 	async.eachSeries(params.tables, function(table, ecb) {
    // 		serverLog(stateOfX.serverLogType.info, 'Processing players from cache table: ' + table.channelName + ' for players: ' + JSON.stringify(_.pluck(table.players, 'playerName')));
    // 		async.eachSeries(table.players, function(player, secb){
    // 			serverLog(stateOfX.serverLogType.info, 'Going to start process player: ' + JSON.stringify(player));
    // 			params.processingPlayer = player;
    // 			processPlayer(params, function(processPlayerResponse){
    // 				if(processPlayerResponse.success) {
    // 					secb();
    // 				} else {
    // 					secb();
    // 				}
    // 			})
    // 		}, function(err) {
    // 			if(err) {
    // 				// cb({success: false, info: "PLAYERS: Error while processing players on cache table: " + JSON.stringify(err)});
    // 				cb({success: false, info: configMsg.STARTPROCESSINGPLAYERFAIL_IDLEPLAYERSHANDLER + JSON.stringify(err), isRetry: false, isDisplay: false, channelId: ""});
    // 			} else {
    // 				ecb();
    // 			}
    // 		})
    // 	}, function(err) {
    // 		if(err) {
    // 			cb({success: false, info: "TABLE: Error while processing players on cache table: " + JSON.stringify(err),isRetry: false, isDisplay: false, channelId: ""});
    // 		} else {
    // 			cb(null, params);
    // 		}
    // 	})
    // }
    /*========================  END  ============================*/


    /*========================  START  ============================*/
    // run by cron - remove idle sitting players from table
    // time and player state dependent

    // New
    async process(params: any): Promise<void> {
        params.sessionDetails = {
            isSessionExists: false,
            sessionId: -1
        };

        try {
            // Get all tables with the current serverId
            await this.getAllTables(params);

            // Check if players are available
            await this.checkIfPlayersAvailable(params);

            // Start processing players
            await this.startProcessingPlayers(params);

        } catch (err) {
            console.log(stateOfX.serverLogType.info, 'Error while performing idle player removal: ' + JSON.stringify(err));
        }
    }


    // Old
    // disconnectedPlayersHandler.process = function(params) {
    // 	params.sessionDetails = {
    // 		isSessionExists: false,
    // 		sesisonId: -1
    // 	}
    // 	// setInterval(function(){
    // 		async.waterfall([
    // 			async.apply(getAllTables, params), // get all tables only with current serverId
    // 			checkIfPlayersAvailable,
    // 			startProcessingPlayers
    // 		], function(err, response){
    // 			if(err) {
    // 				serverLog(stateOfX.serverLogType.info, 'Error while performing idle player removal: ' + JSON.stringify(err))
    // 			} else {
    // 				serverLog(stateOfX.serverLogType.info, 'Idle players check performed successfully!')
    // 			}
    // 		});
    // }
    /*========================  END  ============================*/

















}