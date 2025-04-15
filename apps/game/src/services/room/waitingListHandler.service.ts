import { Injectable } from "@nestjs/common";
import * as async from 'async';
import * as _ from 'underscore';
import popupTextManager from "../../../../../libs/common/src/popupTextManager";
import { systemConfig, stateOfX } from 'shared/common';
import { BroadcastHandlerService } from "./broadcastHandler.service";
import { validateKeySets } from "shared/common/utils/activity";



declare const pomelo:any;


@Injectable()
export class WaitingListHandlerService {


    constructor(
        private readonly broadcastHandler: BroadcastHandlerService,
    ) {}






    /*====================================  START  ===================================*/
        // init params

        // New
        intializeParams(params: any): any {
            params.data = {};
            params.data.key = "queueList";
            params.data.queueList = [];
            return params;
        };
        

        // Old
    // var intializeParams = function(params, cb) {
    // 	serverLog(stateOfX.serverLogType.info, 'In waitingListHandler function intializeParams');
    //   params.data           = {};
    //   params.data.key       = "queueList";
    //   params.data.queueList = [];
    // 	cb(null, params);
    // }
    /*====================================  END  ===================================*/

    /*====================================  START  ===================================*/
    // find if there is next player available to process

    // New
    getNextQueuedPlayerId(params: any): any {
    
        const getTableAttribResponse = pomelo.app.rpc.database.tableRemote.getTableAttrib(params.session, { 
        channelId: params.channelId, 
        data: params.data, 
        key: params.data.key 
        });
    
    
        if (getTableAttribResponse.success) {
        params.data.queueList = getTableAttribResponse.value;
        if (params.data.queueList.length <= 0) {
            return {
            success: false, 
            isRetry: false, 
            isDisplay: false, 
            channelId: (params.channelId || ""), 
            info: popupTextManager.falseMessages.GETNEXTQUEUEDPLAYERIDFAIL_WAITINGLISTHANDLER
            };
        } else {
            return params;
        }
        } else {
        return getTableAttribResponse;
        }
    };
    

    // Old
    // var getNextQueuedPlayerId = function(params, cb) {
    //   console.log("JOY!!!!!!!!!!are we checking any NextQueuesPlaer", params)
    // 	serverLog(stateOfX.serverLogType.info, 'In waitingListHandler function getNextQueuedPlayerId');
    // 	pomelo.app.rpc.database.tableRemote.getTableAttrib(params.session, {channelId: params.channelId, data: params.data, key: params.data.key}, function (getTableAttribResponse) {
    //     serverLog(stateOfX.serverLogType.info, "getTableAttrib response is - in waiting" + JSON.stringify(getTableAttribResponse));
    //     if(getTableAttribResponse.success) {
    //     	params.data.queueList = getTableAttribResponse.value;
    //     	if(params.data.queueList.length <= 0) {
    //         cb({success: false, isRetry: false, isDisplay: false, channelId: (params.channelId || ""), info: popupTextManager.falseMessages.GETNEXTQUEUEDPLAYERIDFAIL_WAITINGLISTHANDLER});
    //         //cb({success: false, channelId: params.channelId, info: "There is no waiting player for this table."});
    //     	} else {
    //     		cb(null, params);
    //     	}
    //     } else {
    //     	cb(getTableAttribResponse);
    //     }
    //   });
    // }
    /*====================================  END  ===================================*/


    /*====================================  START  ===================================*/
    // New
    sessionExport(session: any): any {
        const EXPORTED_SESSION_FIELDS = ['id', 'frontendId', 'uid', 'settings'];
        let res: any = {};
        this.clone(session, res, EXPORTED_SESSION_FIELDS);
        return res;
      }
      
    // Old
    // function sessionExport (session) {
    // 	var EXPORTED_SESSION_FIELDS = ['id', 'frontendId', 'uid', 'settings']
    //   var res = {};
    //   clone(session, res, EXPORTED_SESSION_FIELDS);
    //   return res;
    // };
    /*====================================  END  ===================================*/

    /*====================================  START  ===================================*/
    /**
     * clone object keys
     * @method clone
     * @param  {Object} src      source of keys
     * @param  {Object} dest     destination for keys
     * @param  {Array}  includes list of keys - array of Strings
     */

    // New
    clone(src:any, dest: any, includes: any): void {
        for (let i = 0, l = includes.length; i < l; i++) {
        const f = includes[i];
        dest[f] = src[f];
        }
    }
    

    // Old
    // function clone(src, dest, includes) {
    //   var f;
    //   for(var i=0, l=includes.length; i<l; i++) {
    //     f = includes[i];
    //     dest[f] = src[f];
    //   }
    // };
    /*====================================  END  ===================================*/

    /*====================================  START  ===================================*/
    // find user session in db and
    // hit auto autoSit "JOIN TABLE" API
    // rpc to connector to rpc back to room

    // New
    async getUserServerId(params: any): Promise<any> {
    
        try {
        const res = await pomelo.app.sysrpc['room'].msgRemote.forwardMessage(
            { forceFrontendId: 'room-server-1' },
            {
            body: {
                playerId: params.data.queueList[0].playerId,
                playerName: params.data.queueList[0].playerName,
                channelId: params.channelId,
                seatIndex: 1,
                networkIp: "",
                imageAvtar: "",
                isRequested: false,
                channel: { channelType: params.channel.channelType, channelName: params.channel.channelName }
            },
            route: "room.channelHandler.autoSit"
            },
            this.sessionExport(params.session)
        );
    
        console.log("room.channelHandler.autoSit res is >", res);
    
        if (res.success) {
            const time = Number(new Date().getTime()) + 9800;
            console.log("deff > in hit move response about to send broad");
    
            this.broadcastHandler.autoJoinBroadcast({
            channelId: params.channelId,
            playerId: params.data.queueList[0].playerId,
            self: pomelo,
            channelType: params.channel.channelType,
            tableId: "",
            heading: 'Seat Reserved',
            info: `A seat is reserved for you in table ${params.channel.channelName}, Please join within ${systemConfig.vacantReserveSeatTime} seconds or seat will be no longer reserved for you.`,
            forceJoin: false,
            validTill: time
            });
    
            // Process next in queue
            params.nextToNext = false;
            params.res = {};
            params.res.antibanking = res.antibanking;
            params.res.playerId = res.playerId;
            params.res.channelId = res.channelId;
            if (res.nextToNext) {
            params.nextToNext = true;
            }
    
            return params;
        } else {
            this.broadcastHandler.fireInfoBroadcastToPlayer({
            self: pomelo,
            playerId: params.data.queueList[0].playerId,
            heading: 'Information',
            info: res.info,
            channelId: params.channelId,
            buttonCode: 1
            });
    
            return params;
        }
        } catch (error) {
        console.error("Error in getUserServerId:", error);
        throw error;
        }
    }
    
    // Old
    // var getUserServerId = function(params, cb){
    //    // pomelo.app.rpc.database.dbRemote.findUserSessionInDB({}, params.data.queueList[0].playerId, function (response) {
    //     console.log("-------------getUserServerId lol--- room -------------",params.data.queueList);
    //   //   if(response.success && !!response.result){

    //   //temp
    //   pomelo.app.sysrpc['room'].msgRemote.forwardMessage(
    //     { forceFrontendId: 'room-server-1' },
    //     {
    //       body: { playerId : params.data.queueList[0].playerId, playerName : params.data.queueList[0].playerName, channelId: params.channelId,seatIndex: 1, networkIp: "", imageAvtar: "", isRequested: false , channel : { channelType: params.channel.channelType, channelName: params.channel.channelName}},
    //       route: "room.channelHandler.autoSit"
    //     },
    //     sessionExport(params.session), function (err, res) {
    //       console.log("room.channelHandler.autoSit res is >", err, res);
    //       if (res.success) {
    //         let time = Number(new Date().getTime()) + 9800;
    //         console.log("deff > in hit move response about to send broad")
    //         broadcastHandler.autoJoinBroadcast({ channelId: params.channelId, playerId: params.data.queueList[0].playerId, self: pomelo, channelType: params.channel.channelType, tableId: "", heading: 'Seat Reserved', info: 'A seat is reserved for you in table ' + params.channel.channelName + ', Please join within ' + systemConfig.vacantReserveSeatTime + ' seconds or seat will be no longer reserved for you.', forceJoin: false, validTill: time });
    //         // cb(res);
    //         // process next in queue
    //                 params.nextToNext = false;
    //                 params.res = {};
    //                 params.res.antibanking = res.antibanking;
    //                 params.res.playerId = res.playerId;
    //                 params.res.channelId = res.channelId;
    //                 if(res.nextToNext){
    //                   params.nextToNext = true;
    //                 }
    //                 cb(null, params);

    //       } else {
    //         broadcastHandler.fireInfoBroadcastToPlayer({ self: pomelo, playerId: params.data.queueList[0].playerId, heading: 'Information', info: res.info, channelId: params.channelId, buttonCode: 1 });
    //         cb(null, params);
    //       }
    //     }
    //   );
    //   //temp
    //           //  pomelo.app.rpc.connector.sessionRemote.hitAutoSit({ frontendId: 'connector-server-1' }, { playerId : params.data.queueList[0].playerId, playerName : params.data.queueList[0].playerName, channelId: params.channelId,seatIndex: 1, networkIp: "", imageAvtar: "", isRequested: false , channel : { channelType: params.channel.channelType, channelName: params.channel.channelName}}, function (hitAutoSitResponse) {
    //           //     // console.log("-------------response--- room -------------",hitAutoSitResponse);
    //           //     if(hitAutoSitResponse.success){
    //           //       // process next in queue
    //           //       params.nextToNext = false;
    //           //       params.res = {};
    //           //       params.res.antibanking = hitAutoSitResponse.antibanking;
    //           //       params.res.playerId = hitAutoSitResponse.playerId;
    //           //       params.res.channelId = hitAutoSitResponse.channelId;
    //           //       if(hitAutoSitResponse.nextToNext){
    //           //         params.nextToNext = true;
    //           //       }
    //           //       cb(null, params);
    //           //     }else{
    //           //       cb(hitAutoSitResponse);
    //           //     }
    //           //  });
        
    //            //     }else{
    //     //        cb({success: false, isRetry: false, isDisplay: false, channelId: (params.channelId || ""), info: popupTextManager.falseMessages.ERROR_GETTING_SERVER_ID});
    //     //     }
    //     // });
    // }
    /*====================================  END  ===================================*/

// var replaceCurrentSession = function(params, cb) {
//   serverLog(stateOfX.serverLogType.info, 'In waitingListHandler function replaceCurrentSession');
//   params.session = !!params.self.app.sessionService.getByUid(params.data.queueList[0].playerId) ? params.self.app.sessionService.getByUid(params.data.queueList[0].playerId)[0] : {};
//   cb(null, params);
// }

// var getPlayerProfileDetails = function(params, cb) {
// 	serverLog(stateOfX.serverLogType.info, 'In waitingListHandler function getPlayerProfileDetails');
//   updateProfileHandler.getProfile({playerId: params.data.queueList[0].playerId, keys: ['profileImage', 'firstName', 'lastName', 'userName']}, function(getProfileResponse){
//     if(getProfileResponse.success){
//       params.data.profile = getProfileResponse.result;
//       serverLog(stateOfX.serverLogType.info, 'Profile details of waiting player - ' + JSON.stringify(params.data.profile));
//       cb(null, params);
//     } else {
//       cb({success: false, isRetry: false, isDisplay: true, channelId: (params.channelId || ""), info: popupTextManager.falseMessages.UPDATEPROFILEHANDLERFAIL_WAITINGLISTHANDLER + params.data.queueList[0].playerId});
//       //cb({success: false, channelId: params.channelId, info: "Get profile details from database failed for playerId - " + params.data.queueList[0].playerId});
//     }
//   });
// }

// var processPlayerAutoSit = function(params, cb) {
// 	serverLog(stateOfX.serverLogType.info, 'In waitingListHandler function processPlayerAutoSit');
//   autoSitHandler.processAutoSit({self: params.self, session: params.session, channel: params.channel, channelId: params.channelId, playerId: params.data.queueList[0].playerId, playerName: (params.data.profile.userName), seatIndex: 1, networkIp: "", imageAvtar: "", isRequested: false}, function(processAutoSitResponse){
//     serverLog(stateOfX.serverLogType.info, 'processPlayerAutoSit processAutoSitResponse response - ' + JSON.stringify(processAutoSitResponse));
//     if(!!processAutoSitResponse.isPlayerSit) {
//       actionLogger.createEventLog ({self: params.self, session: params.session, channel: params.channel, data: {channelId: params.channelId, eventName: stateOfX.logEvents.reserved, rawData: {playerName: processAutoSitResponse.player.playerName, chips: processAutoSitResponse.player.chips, seatIndex: processAutoSitResponse.data.seatIndex}}});
//       broadcastHandler.fireSitBroadcast({self: params.self, channel: params.channel, player: processAutoSitResponse.player, table: processAutoSitResponse.table});
//       channelTimerHandler.vacantReserveSeat({self: params.self, session: params.session, channel: params.channel, channelId: params.channelId, playerId: params.data.queueList[0].playerId});
//       broadcastHandler.fireBroadcastToAllSessions({app: params.self.app, data: {_id: params.channelId, channelType: params.channel.channelType, playerId: params.data.queueList[0].playerId, event: stateOfX.recordChange.tableViewLeftWaitingPlayer}, route: stateOfX.broadcasts.tableView});
//       cb(null, params);
//     } else {
//       if(processAutoSitResponse.data.isTableFull) {
//         cb({success: false, isRetry: false, isDisplay: true, channelId: (params.channelId || ""), info: popupTextManager.falseMessages.PROCESSPLAYERAUTOSITFAIL_WAITINGLISTHANDLER});
//         //cb({success: false, channelId: params.channelId, info: 'The table is already full, you can observe or please choose another.'})
//       } else {
//         serverLog(stateOfX.serverLogType.info, JSON.stringify(processAutoSitResponse));
//         cb(null, params);
//       }
//     }
//   });
// 	cb(null, params);
// }

// var informPlayerSeatReserved = function(params, cb) {
//   serverLog(stateOfX.serverLogType.info, 'In waitingListHandler function informPlayerSeatReserved');
//   broadcastHandler.autoJoinBroadcast({channelId: params.channelId, playerId: params.data.queueList[0].playerId, serverId: params.session.frontendId, self: params.self, channelType: params.channel.channelType, tableId: "", heading: 'Seat Reserved', info: 'A seat is reserved for you in table ' + params.channel.channelName + ', Please join within ' + systemConfig.vacantReserveSeatTime + ' seconds or seat will be no longer reserved for you.', forceJoin: false})
//   cb(null, params);
// }


    /*====================================  START  ===================================*/
    // remove player from queue if processed

    // New
    async removePlayerFromQueueList(params: any): Promise<any> {
    
        params.data.playerId = params.data.queueList[0].playerId;
    
        try {
        const removeWaitingPlayer = await pomelo.app.rpc.database.requestRemote.removeWaitingPlayer(
            params.session,
            { channelId: params.channelId, data: params.data, playerId: params.data.queueList[0].playerId }
        );
    
    
        if (removeWaitingPlayer.success) {
            params.channel.waitingPlayers = (!!params.channel.waitingPlayers && params.channel.waitingPlayers > 0) 
            ? params.channel.waitingPlayers - 1 
            : 0;
    
            this.broadcastHandler.fireBroadcastToAllSessions({
            app: pomelo.app,
            data: {
                _id: params.channelId,
                updated: { queuePlayers: params.channel.waitingPlayers },
                event: stateOfX.recordChange.tableWaitingPlayer
            },
            route: stateOfX.broadcasts.tableUpdate
            });
    
            let isTableFull = false;
            if (removeWaitingPlayer.table.players.length >= removeWaitingPlayer.maxPlayers) {
            isTableFull = true;
            }
    
            // New Condition Added to handle if two players leave at the same time
            if (removeWaitingPlayer.table.players.length >= removeWaitingPlayer.table.maxPlayers) {
            isTableFull = true;
            }
    
            if (!isTableFull && !!removeWaitingPlayer.table.queueList.length && removeWaitingPlayer.table.queueList.length >= 1) {
            params.nextToNext = true;
            }
    
            // New Condition Ended
            this.broadcastHandler.fireBroadcastToAllSessions({
            app: pomelo.app,
            data: {
                _id: params.channelId,
                playingPlayers: `${removeWaitingPlayer.table.players.length}/${removeWaitingPlayer.table.maxPlayers}`,
                isTableFull,
                waitingPlayers: params.channel.waitingPlayers
            },
            route: stateOfX.broadcasts.updatePlayer
            });
        
            return params;
        } else {
            throw removeWaitingPlayer;
        }
        } catch (error) {
        console.error("Error in removePlayerFromQueueList:", error);
        throw error;
        }
    }
    

    // Old
    // var removePlayerFromQueueList = function(params, cb) {
    //   serverLog(stateOfX.serverLogType.info, 'In waitingListHandler function removePlayerFromQueueList'+params.channel.waitingPlayers);
    //   params.data.playerId = params.data.queueList[0].playerId;
    //   pomelo.app.rpc.database.requestRemote.removeWaitingPlayer(params.session, {channelId: params.channelId, data: params.data, playerId: params.data.queueList[0].playerId}, function (removeWaitingPlayer) {

    //     // console.log('removeWaitingPlayer', removeWaitingPlayer);
    //     serverLog(stateOfX.serverLogType.info, "removeWaitingPlayer response is -" + JSON.stringify(removeWaitingPlayer));
    //     if(removeWaitingPlayer.success) {
    //       params.channel.waitingPlayers = (!!params.channel.waitingPlayers && params.channel.waitingPlayers > 0) ? params.channel.waitingPlayers - 1 : 0;
    //       broadcastHandler.fireBroadcastToAllSessions({app: pomelo.app, data: {_id: params.channelId, updated : {queuePlayers: params.channel.waitingPlayers}, event: stateOfX.recordChange.tableWaitingPlayer}, route: stateOfX.broadcasts.tableUpdate});
    //       var isTableFull = false;
    //       if(removeWaitingPlayer.table.players.length >= removeWaitingPlayer.maxPlayers){
    //         isTableFull = true;
    //       }
    //       // New Condition Added to handle if two player leaves at same time
    //       if(removeWaitingPlayer.table.players.length >= removeWaitingPlayer.table.maxPlayers){
    //         isTableFull = true;
    //         }
    //       if(!isTableFull && !!removeWaitingPlayer.table.queueList.length && removeWaitingPlayer.table.queueList.length>=1){
    //         params.nextToNext = true;
    //       }
    //       // New Condition Ended
    //       broadcastHandler.fireBroadcastToAllSessions({app: pomelo.app, data: {_id: params.channelId,playingPlayers: removeWaitingPlayer.table.players.length+"/"+removeWaitingPlayer.table.maxPlayers,isTableFull:isTableFull, waitingPlayers: params.channel.waitingPlayers}, route: stateOfX.broadcasts.updatePlayer});
    //       serverLog(stateOfX.serverLogType.info, "Player has been successfully removed from player list -" + JSON.stringify(removeWaitingPlayer));
    //       cb(null, params);
    //     } else{
    //       cb(removeWaitingPlayer);
    //     }
    //   });
    // }
    /*====================================  END  ===================================*/



    /*====================================  START  ===================================*/

    // New
    async addChipsIfAntiBankingOn(params: any): Promise<any> {
      
        if (params.res.antibanking.isAntiBanking) {
          // Simulating setTimeout with async/await pattern
          await new Promise(resolve => setTimeout(resolve, 1000));
      
          try {
            // Pomelo Connection
            const hitAddChipsOnTableResponse = await pomelo.app.sysrpc['room'].msgRemote.forwardMessage(
              { forceFrontendId: "room-server-1" },
              {
                body: {
                  playerId: params.res.playerId,
                  amount: params.res.antibanking.amount,
                  channelId: params.channelId,
                  networkIp: "",
                  imageAvtar: "",
                  isRequested: false,
                  channel: { channelType: params.channel.channelType, channelName: params.channel.channelName }
                },
                route: "room.channelHandler.addChipsOnTable"
              }
            );
            // Pomelo Connection
      
      
            if (hitAddChipsOnTableResponse.success) {
              return params;
            } else {
              throw hitAddChipsOnTableResponse;
            }
          } catch (error) {
            console.error("Error in addChipsIfAntiBankingOn:", error);
            throw error;
          }
        } else {
          throw { success: false, isRetry: false, isDisplay: false, channelId: (params.channelId || ""), info: popupTextManager.falseMessages.ERROR_GETTING_SERVER_ID };
        }
      }
      

    // Old
    // var addChipsIfAntiBankingOn = function(params, cb){
    //   console.log("-------------addChipsIfAntiBankingOn----------------",params);
    //   if(params.res.antibanking.isAntiBanking){
    //     // pomelo.app.rpc.database.dbRemote.findUserSessionInDB({}, params.res.playerId, function (response) {
    //     //   if(response.success && !!response.result){
    //         setTimeout(()=>{
    //           pomelo.app.sysrpc['room'].msgRemote.forwardMessage(
    //             { forceFrontendId: "room-server-1" },
    //             {
    //               body: { playerId : params.res.playerId, amount: params.res.antibanking.amount, channelId: params.channelId, networkIp: "", imageAvtar: "", isRequested: false , channel : { channelType: params.channel.channelType, channelName: params.channel.channelName}},
    //               route: "room.channelHandler.addChipsOnTable"
    //             },
    //             function (err, hitAddChipsOnTableResponse) {
    //               console.log("room.channelHandler.addChipsOnTable res is >", hitAddChipsOnTableResponse);
    //               if (hitAddChipsOnTableResponse.success) {
    //                 cb(null, params);
    //               } else {
    //                 cb( hitAddChipsOnTableResponse);
    //               }
    //             }
    //           );


    //           // pomelo.app.rpc.connector.sessionRemote.hitAddChipsOnTable({ frontendId: 'connector-server-1' }, { playerId : params.res.playerId, amount: params.res.antibanking.amount, channelId: params.channelId, networkIp: "", imageAvtar: "", isRequested: false , channel : { channelType: params.channel.channelType, channelName: params.channel.channelName}}, function (hitAutoSitResponse) {
    //           //   console.log("-------------addChipsIfAntiBankingOnresponse--- room -------------",hitAutoSitResponse);
    //           //   if(hitAutoSitResponse.success){
    //           //     cb(null, params);
    //           //   }else{
    //           //     cb(hitAutoSitResponse);
    //           //   }
    //           // });
    //         },1000);
    //       }else{
    //           cb({success: false, isRetry: false, isDisplay: false, channelId: (params.channelId || ""), info: popupTextManager.falseMessages.ERROR_GETTING_SERVER_ID});
    //       }
    //   //   });
    //   // } else {
    //   //   cb(null, params);
    //   // }
    // }
    /*====================================  END  ===================================*/



    /*====================================  START  ===================================*/
// process the first/next player in queue for table
// when seat becomes available in table after some leave event

// New
async processNextQueuedPlayer(params: any): Promise<void> {
  
    try {
      const validated = await validateKeySets("Request", "connector", "processNextQueuedPlayer", params);
  
      if (validated.success) {
        let response = await this.intializeParams(params);
        response = await this.getNextQueuedPlayerId(response);
        response = await this.getUserServerId(response);
        // response = await replaceCurrentSession(response);
        // response = await getPlayerProfileDetails(response);
        // response = await processPlayerAutoSit(response);
        // response = await informPlayerSeatReserved(response);
        response = await this.removePlayerFromQueueList(response);
        // response = await addChipsIfAntiBankingOn(response);
    
        if (response.nextToNext) {
          // Recursion to process the next player
          await this.processNextQueuedPlayer({ channelId: params.channelId, session: params.session, channel: params.channel });
        }
      } else {
        console.log(stateOfX.serverLogType.error, JSON.stringify(validated));
      }
    } catch (err) {
      console.log(stateOfX.serverLogType.error, 'Unable to process next waiting list player - ' + JSON.stringify(err));
    }
  }
  

// Old
// waitingListHandler.processNextQueuedPlayer = function (params) {
//   console.log("JOY!!!!!!!!!! inside waitingListHandler.processNextQueuedPlayer", params)
//   serverLog(stateOfX.serverLogType.info, 'Starting to process waiting list with keys - ' + JSON.stringify(_.keys(params)));
//   keyValidator.validateKeySets("Request", "connector", "processNextQueuedPlayer", params, function (validated){
//     if(validated.success) {
//       async.waterfall([
//         async.apply(intializeParams, params),
//         getNextQueuedPlayerId,
//         getUserServerId,
//         // replaceCurrentSession,
//         // getPlayerProfileDetails,
//         // processPlayerAutoSit,
//         // informPlayerSeatReserved,
//         removePlayerFromQueueList,
//         // addChipsIfAntiBankingOn
//       ], function(err, response){
//         if(!err && response) {
//           serverLog(stateOfX.serverLogType.info, 'Waiting player processed - ' + JSON.stringify(_.keys(response)));
//           if(response.nextToNext){
//             serverLog(stateOfX.serverLogType.info, '-- recursion happened -- --- ');
//             // recursion
//             waitingListHandler.processNextQueuedPlayer({channelId: params.channelId, session: params.session,  channel: params.channel});
//           }
// 				} else {
// 					serverLog(stateOfX.serverLogType.error, 'Unable to process next waiting list player - ' + JSON.stringify(err));
// 				}
// 			});
//     } else{
//     	serverLog(stateOfX.serverLogType.error, JSON.stringify(validated));
//     }
//   });
// }

    /*====================================  END  ===================================*/






}