import { Injectable } from "@nestjs/common";
import _ from "underscore";
import _ld from "lodash";
import popupTextManager from "../../../../../libs/common/src/popupTextManager";
import { systemConfig, stateOfX } from 'shared/common';

import { ImdbDatabaseService } from "shared/common/datebase/Imdbdatabase.service";


import { BroadcastHandlerService } from "./broadcastHandler.service";
import { ResponseHandlerService } from "./responseHandler.service";
import { CommonHandlerService } from "./commonHandler.service";
import { JoinRequestUtilService } from "./joinRequestUtil.service";
import { PokerDatabaseService } from "shared/common/datebase/pokerdatabase.service";
import { validateKeySets } from "shared/common/utils/activity";
import { ActivityService } from "shared/common/activity/activity.service";




declare const pomelo:any





@Injectable()
export class AutoSitHandlerService {


    constructor(
        private db: PokerDatabaseService,
        private imdb: ImdbDatabaseService,
        private readonly broadcastHandler: BroadcastHandlerService,
        private readonly responseHandler: ResponseHandlerService,
        private readonly commonHandler: CommonHandlerService,
        private readonly joinRequestUtil: JoinRequestUtilService,
        private readonly activity:ActivityService
        

    ) {}






  /*============================  START  ===============================*/
  // ### Store local variable used for calculations

  // New
  async initializeParams(params: any): Promise<any> {
      try {
        const res = await this.db.findDevice({ userName: params.playerName.toLowerCase() });
    
        if (res && res[0] && res[0].device) {
          params.deviceType = res[0].device;
        } else {
          params.deviceType = '';
        }
    
        
        params.tableId = "";
        params.channelType = stateOfX.gameType.normal;
        params.data = {};
        params.data.settings = {};
        params.data.antibanking = {};
        params.data.channelId = params.channelId;
        params.data.networkIp = params.networkIp;
        params.data.playerId = params.playerId;
        params.data.playerName = params.playerName;
        params.data.seatIndex = params.seatIndex;
        params.data.imageAvtar = params.imageAvtar;
        params.data.deviceType = params.deviceType;
        params.data.isPlayerSit = false;
        params.data.tableFound = false;
    
        // Return params instead of using callback
        return params;
    
      } catch (err) {
        console.log(stateOfX.serverLogType.error, 'Error in initializeParams: ' + JSON.stringify(err));
        throw err; // Rethrow or handle the error as needed
      }
    }
    
  // Old
  // var initializeParams = function(params, cb) {
  //     adminDb.findDevice({ userName: params.playerName.toLowerCase() }, (err, res) => {
  //       if (!err && res && res[0] && res[0].device) {
  //         params.deviceType = res[0].device;
  //       }
  //       else{
  //         params.deviceType = ''
  //       }
  //       serverLog(stateOfX.serverLogType.info, 'in autoSitHandler function initializeParams');
  //     params.tableId          = "";
  //     params.channelType      = stateOfX.gameType.normal;
  //     params.data             = {};
  //     params.data.settings    = {};
  //     params.data.antibanking = {};
  //     params.data.channelId   = params.channelId;
  //     params.data.networkIp   = params.networkIp;
  //     params.data.playerId    = params.playerId;
  //     params.data.playerName  = params.playerName;
  //     params.data.seatIndex   = params.seatIndex;
  //     params.data.imageAvtar  = params.imageAvtar;
  //     params.data.deviceType  = params.deviceType;
  //     params.data.isPlayerSit = false;
  //     params.data.tableFound  = false;
  //     // params.session          = !!params.self.app.sessionService.getByUid(params.playerId) ? params.self.app.sessionService.getByUid(params.playerId)[0] : null;
  //     cb(null, params);
  //   })
  //   }
  /*============================  END  ===============================*/
  
  /*============================  START  ===============================*/
  // Get table from inmemory if already exisst in database

  // New
  async getInMemoryTable(params: any): Promise<any> {
    try {
      const getInMemoryTableResponse = await this.joinRequestUtil.getInMemoryTable(params);
    
      if (getInMemoryTableResponse.success) {
        return getInMemoryTableResponse.params;
      } else {
        throw new Error('Failed to get in-memory table');
      }
  
    } catch (err) {
      console.log(stateOfX.serverLogType.error, 'Error in getInMemoryTable: ' + JSON.stringify(err));
      throw err; // Rethrow or handle the error as needed
    }
  }
  

  // Old
  // var getInMemoryTable = function (params, cb) {
  //   joinRequestUtil.getInMemoryTable(params, function(getInMemoryTableResponse){
  //     serverLog(stateOfX.serverLogType.info, 'In autoSitHandler getInMemoryTableResponse - ', getInMemoryTableResponse);
  //     if(getInMemoryTableResponse.success) {
  //       cb(null, getInMemoryTableResponse.params);
  //     } else {
  //       cb(getInMemoryTableResponse);
  //     }
  //   });
  // }
  /*============================  END  ===============================*/
  

  /*============================  START  ===============================*/
  // If there is no table exists in database then create new one

  // New
  async createChannelInDatabase(params: any): Promise<any> {
    try {
  
      const createChannelInDatabaseResponse = await this.joinRequestUtil.createChannelInDatabase(params);
  
  
      return createChannelInDatabaseResponse;
  
    } catch (err) {
      console.log(stateOfX.serverLogType.error, 'Error in createChannelInDatabase: ' + JSON.stringify(err));
      throw err; // Rethrow or handle the error as needed
    }
  }
  

  // Old
  // var createChannelInDatabase = function (params, cb) {
  //   console.log("line 71 createChannelInDatabase ", params);
  //   joinRequestUtil.createChannelInDatabase(params, function(createChannelInDatabaseResponse){
  //     serverLog(stateOfX.serverLogType.info, 'In autoSitHandler createChannelInDatabaseResponse - ', createChannelInDatabaseResponse);
  //     cb(null, createChannelInDatabaseResponse);
  //   });
  // }
  /*============================  END  ===============================*/
  
  
    /*============================  START  ===============================*/
    /**
     * if table is protected, user needs to join with password
     * @method rejectIfPassword
     * @param  {Object}         params data from waterfall, contains surely table
     * @param  {Function}       cb     callback
     */

    // New
    async rejectIfPassword(params: any): Promise<any> {
    
      if (!params.table.isPrivate) {
        return params; // PASS, table is not protected
      }
    
      if (!params.isRequested) {
        return params; // PASS, if player already joined
      }
    
      // match with input password;
      if (params.table.password === params.password) {
        return params; // PASS, user knows correct password
      }
    
      // Reject with an error if password does not match
      throw {
        success: false,
        isRetry: false,
        isDisplay: true,
        tableId: params.tableId,
        channelId: params.channelId || "",
        info: popupTextManager.falseMessages.TABLEPASSWORDFAIL_JOINCHANNELHANDLER
      };
    }  

    // Old
    // var rejectIfPassword = function (params, cb) {
    //   // in such code style, these returns are MUST due to more code
    //   console.log("line 126 .......... ", params);
    //   if(!params.table.isPrivate){
    //     cb(null, params); return; // PASS, table is not protected
    //   }
    //    if(!params.isRequested){
    //     cb(null, params); return; // PASS, if player already joined
    //   }
    //   // match with input password;
    //   if(params.table.password === params.password){
    //     cb(null, params); return; // PASS, user knows correct password
    //   }
    //   cb({success: false, isRetry: false, isDisplay: true, tableId: params.tableId, channelId: (params.channelId || ""), info: popupTextManager.falseMessages.TABLEPASSWORDFAIL_JOINCHANNELHANDLER})
    // }
    /*============================  END  ===============================*/
  
  
    /*============================  START  ===============================*/
    // Join a player into channel if not already exists

    // New
    async joinPlayerToChannel(params: any): Promise<any> {
      const joinPlayerToChannelResponse = await this.joinRequestUtil.joinPlayerToChannel(params);
      
      return joinPlayerToChannelResponse;
    }
    
    // Old
    // var joinPlayerToChannel = function (params, cb) {
    //   joinRequestUtil.joinPlayerToChannel(params, function(joinPlayerToChannelResponse){
    //     serverLog(stateOfX.serverLogType.info, 'In autoSitHandler joinPlayerToChannelResponse - ', joinPlayerToChannelResponse);
    //     cb(null, joinPlayerToChannelResponse);
    //   });
    // }
    /*============================  END  ===============================*/
  
    /*============================  START  ===============================*/
    // ### Sit player based on sit preference

    // New
    async sitPlayerOnTable(params: any): Promise<any> {
    
      const processAutoSitResponse = await pomelo.app.rpc.database.requestRemote.processAutoSit({}, params.data);
    
    
      params.data.isTableFull = !!processAutoSitResponse.data && !!processAutoSitResponse.data.isTableFull ? processAutoSitResponse.data.isTableFull : false;
    
      if (processAutoSitResponse.success && !processAutoSitResponse.data.isTableFull) {
        try {
          await this.imdb.updateTableSetting({ channelId: params.channelId, playerId: params.playerId }, { $set: { status: "Playing" } });
          
          params.table = processAutoSitResponse.table;
          params.data.player = processAutoSitResponse.data.player;
          params.data.seatIndex = processAutoSitResponse.data.seatIndex; // Reset updated seat index
          params.data.isPlayerSit = processAutoSitResponse.data.isPlayerSit;
          
          return params; // Return updated params
        } catch (err) {
          throw { success: false, isRetry: false, isDisplay: false, channelId: params.channelId || "", info: popupTextManagerFromdb.DB_REMOVETABLESPECTATOR_FAIL };
        }
      } else {
        throw processAutoSitResponse; // Return the processAutoSitResponse if the player could not sit
      }
    }
    

    // Old
    // var sitPlayerOnTable = function(params, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'in autoSitHandler function sitPlayerOnTable');
    //     pomelo.app.rpc.database.requestRemote.processAutoSit({}, params.data, function (processAutoSitResponse) {
    //         serverLog(stateOfX.serverLogType.info, 'sitPlayerOnTable processAutoSitResponse response ' + JSON.stringify(processAutoSitResponse));
    //     params.data.isTableFull = !!processAutoSitResponse.data && !!processAutoSitResponse.data.isTableFull ? processAutoSitResponse.data.isTableFull : false;
    //     if(processAutoSitResponse.success && !processAutoSitResponse.data.isTableFull) {
    //       imdb.updateTableSetting({ channelId: params.channelId, playerId: params.playerId }, { $set: { status : "Playing"} }, function (err, res) {
    //         if(err) {
    //           cb({success: false, isRetry: false, isDisplay: false, channelId: (channelId || ""), info: popupTextManagerFromdb.DB_REMOVETABLESPECTATOR_FAIL});
    //         }
    //       })
    
    //         params.table             = processAutoSitResponse.table;
    //         params.data.player       = processAutoSitResponse.data.player;
    //       params.data.seatIndex    = processAutoSitResponse.data.seatIndex; // Reset updated seat index
    //         params.data.isPlayerSit  = processAutoSitResponse.data.isPlayerSit;
    //             cb(null, params);
    //     } else {
    //         cb(processAutoSitResponse);
    //     }
    //   });
    // }
    /*============================  END  ===============================*/
  

    /*============================  START  ===============================*/
    // ### Add this player as spectator for this table

    // New
    async addPlayerAsSpectator(params: any): Promise<any> {    
      try {
        const res = await this.commonHandler.assignTableSettings(params);
        return res; // Return the result after assignment
      } catch (err) {
        throw err; // Propagate any error that occurs
      }
    }
    

    // Old
    // var addPlayerAsSpectator = function(params, cb) {
    //   serverLog(stateOfX.serverLogType.info, "in joinChannelHandler function addPlayerAsSpectator");
    //   commonHandler.assignTableSettings(params, function(err, res){
    //     cb(err, res);
    //   });
    // }
    /*============================  END  ===============================*/
  
    /*============================  END  ===============================*/
    // Set this channel into session of player

    // New
    async setChannelIntoSession(params: any): Promise<any> {
      if (!params.session) {
        return params;
      }
    
      let sessionChannels = params.session.get("channels") || [];
    
      if (sessionChannels.indexOf(params.channelId) < 0) {
        sessionChannels.push(params.channelId);
      }
    
      params.session.set("channels", sessionChannels);
    
      // Using await to push session changes
      try {
        await params.session.pushAll(params.session.frontendId, params.session.id, params.session.settings);
        console.log('pushed session changes to frontend session');
      } catch (err) {
        console.error('Error pushing session changes', err);
      }
    
      return params;
    }
    

    // Old
    // var setChannelIntoSession = function(params, cb) {
    //   if(!params.session) {
    //     serverLog(stateOfX.serverLogType.error, 'Unable to set this channelId into player session, session object missing')
    //     cb(null, params);
    //     return false;
    //   }
    
    //   var sessionChannels =  !!params.session.get("channels") ? params.session.get("channels") : [];
    
    //   if(sessionChannels.indexOf(params.channelId) < 0){
    //     sessionChannels.push(params.channelId);
    //   }
    
    //   params.session.set("channels", sessionChannels);
    //   params.session.pushAll(params.session.frontendId, params.session.id, params.session.settings, function(err,res){
    //       console.log('pushed session changes to frontend session')
    //     })
    //   cb(null, params);
    // }

    /*============================  END  ===============================*/
  

    /*============================  START  ===============================*/
    // ### Broadcast player details for lobby

    // New
    async broadcastLobbyDetails(params: any): Promise<any> {
      // Fire broadcast to all sessions
      this.broadcastHandler.fireBroadcastToAllSessions({
        app: {},
        data: {
          _id: params.channelId,
          updated: { playingPlayers: params.table.players.length },
          event: stateOfX.recordChange.tablePlayingPlayer
        },
        route: stateOfX.broadcasts.tableUpdate
      });
    
      // Uncomment the next line if you need to broadcast to table view as well
      // broadcastHandler.fireBroadcastToAllSessions({
      //   app: {},
      //   data: {
      //     _id: params.channelId,
      //     playerId: params.playerId,
      //     channelType: params.channel.channelType,
      //     updated: { playerName: params.playerName, chips: params.chips },
      //     event: stateOfX.recordChange.tableViewNewPlayer
      //   },
      //   route: stateOfX.broadcasts.tableView
      // });
    
      return params;
    }
    

    // Old
    // var broadcastLobbyDetails = function (params, cb) {
    //   broadcastHandler.fireBroadcastToAllSessions({app: {}, data: {_id: params.channelId, updated : {playingPlayers: params.table.players.length}, event: stateOfX.recordChange.tablePlayingPlayer}, route: stateOfX.broadcasts.tableUpdate});
    //   //broadcastHandler.fireBroadcastToAllSessions({app: {}, data: {_id: params.channelId, playerId: params.playerId, channelType: params.channel.channelType, updated: {playerName: params.playerName, chips: params.chips}, event: stateOfX.recordChange.tableViewNewPlayer}, route: stateOfX.broadcasts.tableView});
    //   cb(null, params);
    // }
    /*============================  END  ===============================*/

  
  
    /*============================  START  ===============================*/
  // ### Get anti banking details for this player

  // New
  async getAntiBankingDetails(params: any): Promise<any> {
  
    try {
      const res = await this.joinRequestUtil.getAntiBanking(params);
      return res;
    } catch (err) {
      return { error: err };
    }
  }
  

  // Old
  // var getAntiBankingDetails = function(params, cb) {
  //   serverLog(stateOfX.serverLogType.info, "in joinChannelHandler function getAntiBankingDetails");
  //   joinRequestUtil.getAntiBanking(params, function(err, res){
  //     cb(err, res);
  //   });
  // }
    /*============================  END  ===============================*/
  

    /*============================  START  ===============================*/
    // ### Update player state (in case of DISCONNECTED state players)

    // New
    async updatePlayerState(params: any): Promise<any> {
    
      const changeDisconnPlayerStateResponse = await pomelo.app.rpc.database.requestRemote.changeDisconnPlayerState(
        {},
        { channelId: params.channelId, playerId: params.playerId }
      );
    
    
      if (changeDisconnPlayerStateResponse.success) {
        if (changeDisconnPlayerStateResponse.data.previousState === stateOfX.playerState.disconnected) {
          console.log(
            "I am inside updatePlayerState function printing previous state of the player",
            changeDisconnPlayerStateResponse.data.previousState
          );

          this.broadcastHandler.firePlayerStateBroadcast({
            channel: params.channel,
            channelId: params.channelId,
            playerId: params.playerId,
            state: changeDisconnPlayerStateResponse.data.currentState,
          });
        } else {
          console.log(
            stateOfX.serverLogType.info,
            'Player was not in DISCONNECTED state, so skipping playerState broadcast on autosit request.'
          );
        }
        return params;
      } else {
        throw changeDisconnPlayerStateResponse;
      }
    }
    

    // Old
    // var updatePlayerState = function(params, cb) {
    //   console.log("params inside updatePlayerState function  are ",params);
    //   pomelo.app.rpc.database.requestRemote.changeDisconnPlayerState({}, {channelId: params.channelId, playerId: params.playerId}, function (changeDisconnPlayerStateResponse) {
    //     console.log(
    //       "ChangeDisconnPlayer state response is printing from here ",changeDisconnPlayerStateResponse
    //     )
    //     serverLog(stateOfX.serverLogType.info, 'Response while updating player state from DISCONNECTED on autosit request - ' + JSON.stringify(changeDisconnPlayerStateResponse));
    //     if(changeDisconnPlayerStateResponse.success) {
    //       if(changeDisconnPlayerStateResponse.data.previousState === stateOfX.playerState.disconnected){
    //         console.log("I am inside updatePlayerState function printing previous state of the player",changeDisconnPlayerStateResponse.data.previousState)
    //         serverLog(stateOfX.serverLogType.info, 'Player was in DISCONNECTED state, so firing playerState broadcast with state - ' + changeDisconnPlayerStateResponse.data.currentState);
    //         console.log("I am inside updatePlayerStae functioin current state of the player ",changeDisconnPlayerStateResponse.data.currentState);
    //         broadcastHandler.firePlayerStateBroadcast({channel: params.channel, channelId: params.channelId, playerId: params.playerId, state: changeDisconnPlayerStateResponse.data.currentState})
    //       } else {
    //         serverLog(stateOfX.serverLogType.info, 'Player was not in DISCONNECTED state, so skipping playerState broadcast on autosit request.');
    //       }
    //       cb(null, params);
    //     } else {
    //       cb(changeDisconnPlayerStateResponse);
    //     }
    //   });
    // }
    /*============================  END  ===============================*/
  
    /*============================  START  ===============================*/
    // ### Store this player record in inmemory database for this join

    // New
    async saveJoinRecord(params: any): Promise<any> {
      // if(params.isRequested) {
      // console.error(params);
    
      const res = await this.imdb.playerJoinedRecord({ playerId: params.playerId, channelId: params.channelId });
    
      let alreadyJoin = false;
      if (res && res.length > 0) {
        alreadyJoin = true;
      }
    
      try {
        await this.imdb.upsertPlayerJoin(
          { channelId: params.channelId, playerId: params.playerId },
          {
            $setOnInsert: {
              playerName: params.playerName,
              channelType: params.channelType,
              firstJoined: Number(new Date()),
              observerSince: Number(new Date()),
            },
            $set: {
              networkIp: params.networkIp,
              event: 'autosit',
              alreadyjoin: alreadyJoin,
            },
          }
        );
    
        return params;
      } catch (err) {
        throw {
          success: false,
          isRetry: false,
          isDisplay: false,
          channelId: params.channelId || '',
          tableId: params.tableId,
          info: popupTextManager.falseMessages.SAVEJOINRECORDFAIL_AUTOSITHANDLER + JSON.stringify(err),
        };
      }
    }
    

    // Old
    // var saveJoinRecord = function(params, cb) {
    //   // if(params.isRequested) {
    //     //console.error(params);
    //     imdb.playerJoinedRecord({playerId: params.playerId, channelId: params.channelId}, function (err, res){
    //       var alreadyJoin = false;
    //       if(!!res && res.length > 0){
    //         alreadyJoin = true;
    //       }
    //       imdb.upsertPlayerJoin({channelId: params.channelId, playerId: params.playerId}, {$setOnInsert: {playerName: params.playerName, channelType: params.channelType, firstJoined: Number(new Date()), observerSince: Number(new Date())}, $set: {networkIp: params.networkIp, event: 'autosit', alreadyjoin: alreadyJoin}}, function (err, result) {
    //       if (err) {
    //         cb({success: false, isRetry: false, isDisplay: false, channelId: (params.channelId || ""), tableId: params.tableId,info: popupTextManager.falseMessages.SAVEJOINRECORDFAIL_AUTOSITHANDLER + JSON.stringify(err)});
    //       } else {
    //         cb(null, params);
    //       }
    //       })
    //     })
    // }
    /*============================  END  ===============================*/
  
    /*============================  START  ===============================*/
    // Save this record for disconnection handling

    // New
    async saveActivityRecord(params: any): Promise<any> {
    
      const dataToInsert = {
        channelId: params.channelId,
        playerId: params.playerId,
        isRequested: true,
        playerName: params.playerName,
        channelType: params.channelType,
        tableId: params.tableId,
        deviceType: params.deviceType || ''
        // referenceNumber: generateCOTRefrenceId()
      };
    
      const query: any = {
        playerId: params.playerId
      };
    
      if (params.channelId) {
        query.channelId = params.channelId;
      }
    
      if (params.tableId) {
        query.tableId = params.tableId;
      }
    
      try {
        const result = await this.imdb.upsertActivity(query, dataToInsert);
    
        if (result) {
          return params;
        } else {
          throw {
            success: false,
            isRetry: true,
            isDisplay: false,
            channelId: params.channelId || "",
            tableId: params.tableId,
            info: popupTextManager.falseMessages.SAVEACTIVITYRECORDFAIL_AUTOSITHANDLER
          };
        }
      } catch (err) {
        throw {
          success: false,
          isRetry: true,
          isDisplay: false,
          channelId: params.channelId || "",
          tableId: params.tableId,
          info: popupTextManager.falseMessages.SAVEACTIVITYRECORDFAIL_AUTOSITHANDLER
        };
      }
    }
    

    // Old
    // var saveActivityRecord = function(params, cb) {
    //   serverLog(stateOfX.serverLogType.info, "in autoSitHandler function saveActivityRecord");
    //   // const generateCOTRefrenceId = () => {
    //   //   var result = 'COT-';
    //   //   var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    //   //   for (var i = 0; i < 16; i++) {
    //   //     result += possible.charAt(Math.floor(Math.random() * possible.length));
    //   //   } return result;
    //   // }
    //   // referenceNumber: generateCOTRefrenceId()
    //   var dataToInsert = {
    //     channelId:  params.channelId,
    //     playerId:   params.playerId,
    //     isRequested:true,
    //     playerName: params.playerName,
    //     channelType:params.channelType,
    //     tableId:    params.tableId,
    //     deviceType: params.deviceType || ''
    //     // referenceNumber: generateCOTRefrenceId()
    //   }
    //   var query = {
    //     playerId: params.playerId
    //   }
    //   if(!!params.channelId) {
    //     query.channelId = params.channelId
    //   }
    //   if(!!params.tableId) {
    //     query.tableId = params.tableId
    //   }
    //   imdb.upsertActivity(query, dataToInsert, function(err, result) {
    //     if(!err && !!result) {
    //       cb(null, params);
    //     } else {
    //       cb({success: false, isRetry: true, isDisplay: false,channelId: (params.channelId || ""), tableId: params.tableId,info: popupTextManager.falseMessages.SAVEACTIVITYRECORDFAIL_AUTOSITHANDLER});
    //       //cb({success: false, isDisplay: false, isRetry: true, channelId: params.channelId, tableId: params.tableId, info: 'Unable to store player activity record for disconnection handling'});
    //     }
    //   })
    // }
    /*============================  END  ===============================*/
  

    /*============================  START  ===============================*/
    // ### Create response for autosit player

    // New
    async createResponse(params: any): Promise<any> {
    
      const setJoinChannelKeysResponse = await this.responseHandler.setJoinChannelKeys(params);
    
      return {
        response: setJoinChannelKeysResponse,
        player: params.data.player,
        isTableFull: params.data.isTableFull,
        isPlayerSit: params.data.isPlayerSit,
        table: params.table,
        data: params.data
      };
    }
    
    // Old
    // var createResponse = function(params, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'in autoSitHandler function createResponse');
    //     responseHandler.setJoinChannelKeys(params, function(setJoinChannelKeysResponse){
    //         cb(null, {response: setJoinChannelKeysResponse, player: params.data.player, isTableFull: params.data.isTableFull, isPlayerSit: params.data.isPlayerSit, table: params.table, data: params.data});
    //     });
    // }
    /*============================  END  ===============================*/
  
    /*============================  START  ===============================*/
    // check for same ip player already on table
    // joined, sitting or in queue - anywhere

    // New
    async validateSameNetwork(params: any): Promise<any> {
      if (params.data.tableFound) {
        const isSameNetworkSitResponse = await pomelo.app.rpc.database.tableRemote.isSameNetworkSit(
          {},
          {
            channelId: params.channelId,
            byPassIp: params.byPassIp,
            networkIp: params.networkIp,
            playerId: params.playerId,
            deviceType: params.deviceType,
          }
        );
    
        if (isSameNetworkSitResponse.success) {
          return params;
        } else {
          throw isSameNetworkSitResponse;
          // Alternative option if you want a custom error structure:
          // throw { success: false, isRetry: false, isDisplay: true, channelId: (params.channelId || ""), info: "Someone has already joined this room from same IP." };
        }
      } else {
        return await this.checkTableCountForPlayer(params);
      }
    }
    

    // Old
    // var validateSameNetwork = function (params, cb) {
    //   if (params.data.tableFound) {
    //   pomelo.app.rpc.database.tableRemote.isSameNetworkSit({}, {channelId: params.channelId, byPassIp: params.byPassIp, networkIp: params.networkIp, playerId: params.playerId, deviceType: params.deviceType}, function (isSameNetworkSitResponse) {
    //     if(isSameNetworkSitResponse.success) {
    //       cb(null, params);
    //     } else {
    //       cb(isSameNetworkSitResponse);
    //       // cb({success: false, isRetry: false, isDisplay: true, channelId: (params.channelId || ""), info: "Someone has already joined this room from same IP."});
    //       // cb(null, params);
    //     }
    //   });
    //   } else {
    //     checkTableCountForPlayer(params, cb);
    //   }
    // }
    /*============================  END  ===============================*/
  


    /*============================  START  ===============================*/
    // fetch a table data for validation
    // mainly for password check

    // New
    async getTableDataForValidation(params: any): Promise<any> {
      const getTableDataForValidationResponse = await this.joinRequestUtil.getTableDataForValidation(params);
    
      if (getTableDataForValidationResponse.success) {
        return getTableDataForValidationResponse;
      } else {
        throw getTableDataForValidationResponse;
      }
    }
    
    // Old
    // var getTableDataForValidation = function(params, cb){
    //   joinRequestUtil.getTableDataForValidation(params, function(getTableDataForValidationResponse){
    //     serverLog(stateOfX.serverLogType.info, "getTableDataForValidationResponse response - " + (getTableDataForValidationResponse));
    //     console.log("getTableDataForValidationResponse response - ", getTableDataForValidationResponse);
    //     if(getTableDataForValidationResponse.success) {
    //       cb(null, getTableDataForValidationResponse);
    //     } else {
    //       cb(getTableDataForValidationResponse);
    //     }
    //   });
    // }
    /*============================  END  ===============================*/
  

    /*============================  START  ===============================*/
    // how many tables player has joined
    // he cannont join more than 4 on system, 2 on phone

    // New
    async checkTableCountForPlayer(params: any): Promise<any> {
      const result = await this.imdb.playerJoinedRecord({ playerId: params.playerId });
    
      if (result) {
        const tableLimit = systemConfig.tableCountAllowed[params.deviceType] || 3;
    
        if ((result.length || 0) < tableLimit) {
          return params;
        } else {
          for (let i = 0; i < result.length; i++) {
            if (result[i].channelId === params.channelId) {
              return params;
            }
          }
    
          throw {
            success: false,
            isRetry: false,
            isDisplay: true,
            channelId: params.channelId || "",
            info: popupTextManager.falseMessages.CHECKTABLECOUNTFORPLAYERFAIL_TABLEMANAGER
          };
        }
      } else {
        return params;
      }
    }
    

    // Old
    // var checkTableCountForPlayer = function (params, cb) {
    //   imdb.playerJoinedRecord({playerId: params.playerId}, function (err, result) {
    //     // console.error('--------======`````',systemConfig.tableCountAllowed[params.deviceType], result)
    //     if (result) {
    //       if ((result.length||0)< (systemConfig.tableCountAllowed[params.deviceType]||3)) {
    //         cb(null, params);
    //       } else {
    //         for (var i = 0; i < result.length; i++) {
    //           if(result[i].channelId == params.channelId){
    //             return cb(null, params);
    //           }
    //         }
    //         return cb({success: false, isRetry: false, isDisplay: true, channelId: (params.channelId || ""), info: popupTextManager.falseMessages.CHECKTABLECOUNTFORPLAYERFAIL_TABLEMANAGER});
    //       }
    //     } else {
    //       cb(null, params);
    //     }
    //   })
    // }
    /*============================  END  ===============================*/
  

    /*============================  START  ===============================*/
  // process auto sit
  // - get (anyone) seat in reserved mode
  // - confirm (player input) seat by adding chips in 10 seconds

  // New
  async processAutoSit(params: any): Promise<any> {
  
    const validated = await validateKeySets("Request", "connector", "processAutoSit", params);
    if (!validated.success) {
      return validated;
    }
  
    try {
      let context = await this.initializeParams(params);
      context = await this.getInMemoryTable(context);
      context = await this.validateSameNetwork(context);
      context = await this.getTableDataForValidation(context);
      context = await this.rejectIfPassword(context);
      context = await this.createChannelInDatabase(context);
      context = await this.addPlayerAsSpectator(context);
      context = await this.updatePlayerState(context);
      context = await this.saveJoinRecord(context);
      context = await this.saveActivityRecord(context);
      context = await this.sitPlayerOnTable(context);
      context = await this.joinPlayerToChannel(context);
      context = await this.setChannelIntoSession(context);
      context = await this.broadcastLobbyDetails(context);
      context = await this.getAntiBankingDetails(context);
      context = await this.createResponse(context);
  
      this.activity.playerSit(context, stateOfX.profile.category.game, stateOfX.game.subCategory.sit, stateOfX.logType.success);
  
      setTimeout(() => {
        // broadcastHandler.fireBankruptBroadcast({self: params.self, playerId: params.playerId, channelId: params.channelId})
      }, Number(systemConfig.autositAndBankruptDelay) * 1000);
  
      return context;
    } catch (err: any) {
      activity.playerSit(
        err?.data || params,
        stateOfX.profile.category.game,
        stateOfX.game.subCategory.sit,
        stateOfX.logType.error
      );
      return err;
    }
  }

  // Old
  // autoSitHandler.processAutoSit = function(params, cb) {
  //   console.log("console in processAutoSit", params)
  //     serverLog(stateOfX.serverLogType.info, 'in autoSitHandler function processAutoSit');
  //   keyValidator.validateKeySets("Request", "connector", "processAutoSit", params, function (validated){
  //     if(validated.success) {
  //         async.waterfall([
  //             async.apply(initializeParams, params),
  //         getInMemoryTable,
  //         validateSameNetwork,
  //         getTableDataForValidation,
  //         rejectIfPassword,
  //             createChannelInDatabase,
  //         addPlayerAsSpectator,
  //         updatePlayerState,
  //         saveJoinRecord,
  //         saveActivityRecord,
  //         sitPlayerOnTable,
  //         joinPlayerToChannel,
  //         setChannelIntoSession,
  //         broadcastLobbyDetails,
  //         getAntiBankingDetails,
  //             createResponse
  //         ], function(err, response){
  //         serverLog(stateOfX.serverLogType.info, 'handler processAutoSit err ' + JSON.stringify(err));
  //         serverLog(stateOfX.serverLogType.info, 'handler processAutoSit response ' + JSON.stringify(response));
  //         if(err && !response) {
  //           cb(err);
  //           activity.playerSit(response,stateOfX.profile.category.game,stateOfX.game.subCategory.sit,stateOfX.logType.error);
  //             } else {
  //           activity.playerSit(response,stateOfX.profile.category.game,stateOfX.game.subCategory.sit,stateOfX.logType.success);
  //           setTimeout(function(){
  //           //  broadcastHandler.fireBankruptBroadcast({self: params.self, playerId: params.playerId, channelId: params.channelId})
  //           }, parseInt(systemConfig.autositAndBankruptDelay)*1000);
  //                 cb(response);
  //             }
  //         });
  //     } else {
  //       cb(validated);
  //     }
  //   });
  // }
    /*============================  END  ===============================*/








}