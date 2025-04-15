import { Injectable } from "@nestjs/common";
import _ from "underscore";
import _ld from "lodash";
import popupTextManager from "../../../../../libs/common/src/popupTextManager";
import stateOfX from "shared/common/stateOfX.sevice";
import { ImdbDatabaseService } from "shared/common/datebase/Imdbdatabase.service";
import { validateKeySets } from "shared/common/utils/activity";


declare const pomelo:any;




@Injectable()
export class TournamentJoinHandlerService {

    constructor(
        private readonly imdb: ImdbDatabaseService,
    ) {}




    /*==============================  START  =========================*/
    // Sum total pot from array of pots

    // New
    getTotalPot(pot: any): number {
        let totalPot = 0;
        for (let i = 0; i < pot.length; i++) {
        totalPot += parseInt(pot[i].amount);
        }
        return totalPot;
    }  

    // Old
    // tournamentJoinHandler.getTotalPot = function(pot) {
    //     var totalPot = 0;
    //     for (var i = 0; i < pot.length; i++) {
    //       totalPot = parseInt(totalPot) + parseInt(pot[i].amount);
    //     }
    //     return totalPot;
    // }
    /*==============================  END  =========================*/



    /*==============================  START  =========================*/
    // Get sum of total dead bets

    //   New
    getTotalBet(bets: any): any {
        let totalBets = 0;
        for (let i = 0; i < bets.length; i++) {
        totalBets += parseInt(bets[i]);
        }
        return totalBets;
    }
    

    //   Old
    // tournamentJoinHandler.getTotalBet = function(bets) {
    //     var totalBets = 0;
    //     for (var i = 0; i < bets.length; i++) {
    //     totalBets = parseInt(totalBets) + parseInt(bets[i]);
    //     }
    //     return totalBets;
    // }
    /*==============================  END  =========================*/
  

    /*==============================  START  =========================*/
    // Create table inside a channel if dosen't exists so far

    //   New
    async createChannel(params: any): Promise<any> {
    
        const validated = await validateKeySets("Request", params.self.app.serverType, "createChannel", params);
        if (validated.success) {
    
        if (!!params.channelId) {

            const channelRemoteResponse = await params.self.app.rpc.database.channelRemote.processSearch(params.session, {
            channelId: params.channelId,
            channelType: params.channelType,
            tableId: params.tableId,
            playerId: params.playerId,
            gameVersionCount: params.gameVersionCount
            });
    
            if (channelRemoteResponse.success) {
            const createTableResponse = await params.self.app.rpc.database.tableRemote.createTable(params.session, channelRemoteResponse.channelDetails);
    
            if (createTableResponse.success) {
                params.success = true;
                params.table = createTableResponse.table;
                params.channel.isTable = true;
                params.channel.roundId = "";
                params.channel.channelType = stateOfX.gameType.tournament;
                params.channel.tournamentType = channelRemoteResponse?.channelDetails?.tournament?.tournamentType || '';
                params.channel.channelName = params.table.channelName;
                params.channel.channelVariation = params.table.channelVariation;
                params.channel.tournamentId = "";
                params.channel.turnTimeReference = null;
                params.channel.extraTurnTimeReference = null;
                params.channel.timeBankTurnTimeReference = null;
                params.channel.clientConnAckReference = null;
                params.channel.reserveSeatTimeReference = [];
                params.channel.kickPlayerToLobby = [];
                params.channel.gameStartEventSet = stateOfX.startGameEventOnChannel.idle;
                params.channel.gameStartEventName = null;
                params.channel.allInOccuredOnChannel = false;
                params.channel.turnTime = params.table.turnTime;
                return;
            } else {
                return createTableResponse;
            }
            } else {
            return channelRemoteResponse;
            }
        } else if (!!params.tableId) {
            const channel = await this.imdb.getPlayerChannel(params.tableId, params.playerId);
            if (!channel) {
            return { success: false, isRetry: false, isDisplay: false, channelId: "", info: popupTextManager.dbQyeryInfo.GETPLAYERCHANNEL_DBERROR_TOURNAMENTJOINHANDLER };
            } else {
            const getTableResponse = await params.self.app.rpc.database.tableRemote.getTable(params.session, { channelId: channel.channelId });
            return getTableResponse;
            }
        } else {
            return { success: false, isRetry: false, isDisplay: false, channelId: "", info: popupTextManager.falseMessages.GETPLAYERCHANNEL_NOTABLE_TOURNAMENTJOINHANDLER };
        }
        } else {
        return validated;
        }
    }
    

    //   Old
    //   tournamentJoinHandler.createChannel = function (params, cb) {
    //     console.log( "ssbw6dnwdd777tgw", stateOfX.serverLogType.info, "in tournament join handler create channel is");
    //     console.log( "ssbw6dnwdd777tgw", stateOfX.serverLogType.info, "pomelo channel while creating channel in tournament join handler");
    //     keyValidator.validateKeySets("Request", params.self.app.serverType, "createChannel", params, function (validated){
    //       if(validated.success) {
    //         console.log( "ssbw6dnwdd777tgw", stateOfX.serverLogType.info, "key validation passed");
    //         // If channelId present then simply check channel.isTable, in order to check if in memeory table
    //         // is associated with this channel. If true then simply respond table details from in memory
    //         // If false then create a table after getting config details from maindb and then create in memory table
    
    //         // If tableId present, then iterate over channelIds (in-memory) associated with this tableId, find this playerId
    //         // If a channelId found then simply respond the details of this channelId (in-memory)
    
    //         if(!!params.channelId) {
    //           console.log( "ssbw6dnwdd777tgw", stateOfX.serverLogType.info, "channel is is present");
    //           console.log( "ssbw6dnwdd777tgw", stateOfX.serverLogType.error, 'Going to create a new table in database cache for channelId: ' + params.channelId);
    //           params.self.app.rpc.database.channelRemote.processSearch(params.session, {channelId: params.channelId, channelType: params.channelType, tableId: params.tableId, playerId: params.playerId,gameVersionCount: params.gameVersionCount}, function (channelRemoteResponse) {
    //           console.log( "ssbw6dnwdd777tgw processSearch res is", channelRemoteResponse);
    //             if(channelRemoteResponse.success) {
    //               params.self.app.rpc.database.tableRemote.createTable(params.session, channelRemoteResponse.channelDetails, function (createTableResponse) {
    //                 console.log( "ssbw6dnwdd777tgw", stateOfX.serverLogType.info, 'createTableResponse - ' + JSON.stringify(createTableResponse));
    //                 if(createTableResponse.success) {
    //                   params.success                           = true;
    //                   params.table                             = createTableResponse.table;
    //                   params.channel.isTable                   = true;
    //                   params.channel.roundId                   = "";
    //                   params.channel.channelType               = stateOfX.gameType.tournament;
    //                   params.channel.tournamentType            = channelRemoteResponse?.channelDetails?.tournament?.tournamentType || '';
    //                   params.channel.channelName               = params.table.channelName;
    //                   params.channel.channelVariation          = params.table.channelVariation;
    //                   params.channel.tournamentId              = "";
    //                   params.channel.turnTimeReference         = null;
    //                   params.channel.extraTurnTimeReference    = null;
    //                   params.channel.timeBankTurnTimeReference = null;
    //                   params.channel.clientConnAckReference    = null;
    //                   params.channel.reserveSeatTimeReference  = [];
    //                   params.channel.kickPlayerToLobby         = [];
    //                   params.channel.gameStartEventSet         = stateOfX.startGameEventOnChannel.idle;
    //                   params.channel.gameStartEventName        = null;
    //                   params.channel.allInOccuredOnChannel     = false;
    //                   params.channel.turnTime                  =  params.table.turnTime;
    //                   cb(params);
    //                 } else {
    //                   console.log( "ssbw6dnwdd777tgw", stateOfX.serverLogType.error, 'Error while generating table!')
    //                   cb(createTableResponse);
    //                 }
    //               });
    //             } else {
    //               cb(channelRemoteResponse);
    //             }
    //           });
    //         } else if(!!params.tableId) {
    //           imdb.getPlayerChannel(params.tableId, params.playerId, function(err, channel) {
    //             if(err || !channel) {
    //               cb({success: false, isRetry: false, isDisplay: false, channelId: "", info: popupTextManager.dbQyeryInfo.GETPLAYERCHANNEL_DBERROR_TOURNAMENTJOINHANDLER});
    //               //cb({success:false, info: "players channel not found in inMemoryDb"});
    //             } else {
    //               console.log( "ssbw6dnwdd777tgw", stateOfX.serverLogType.info, "channel is ",channel);
    //               params.self.app.rpc.database.tableRemote.getTable(params.session, {channelId: channel.channelId}, function (getTableResponse) {
    //                 console.log( "ssbw6dnwdd777tgw", stateOfX.serverLogType.info, "get table response is -",getTableResponse);
    //                 cb(getTableResponse);
    //               });
    //             }
    //           });
    //         } else {
    //           cb({success: false, isRetry: false, isDisplay: false, channelId: "", info: popupTextManager.falseMessages.GETPLAYERCHANNEL_NOTABLE_TOURNAMENTJOINHANDLER});
    //           //cb({success:false, info: "channelId and tableId not found"});
    //         }
    //       } else {
    //         cb(validated);
    //       }
    //     });
    //   }
    /*==============================  END  =========================*/
  

    /*==============================  START  =========================*/
    // Join a player into channel if not already exists

    //   New
    async joinPlayerToChannel(params: any): Promise<any> {
        const validated = await validateKeySets("Request", params.self.app.serverType, "joinPlayerToChannel", params);
        
        if (validated.success) {
        // Check if player doesn't exist in the channel already
        const channelMembers = params.channel.getMembers();
    
        if (channelMembers.indexOf(params.playerId) < 0) {
            params.channel.add(params.playerId, params.self.app.get('serverId'));
        } else { // can be removed if log is not important
            console.log(stateOfX.serverLogType.info, 'Player is already present in pomelo channel, not adding here!');
        }
    
        return { success: true };
        } else {
        return validated;
        }
    }
    
    //   Old
    //   tournamentJoinHandler.joinPlayerToChannel = function (params, cb) {
    //     keyValidator.validateKeySets("Request", params.self.app.serverType, "joinPlayerToChannel", params, function (validated){
    //       if(validated.success) {
    //         // Check if player doesn't exists in the channel already
    //         var channelMembers = params.channel.getMembers();
    //         serverLog(stateOfX.serverLogType.info, "channel members are  previous- ");
    //         serverLog(stateOfX.serverLogType.info, 'Previous Members in pomelo channel: ' + JSON.stringify(params.channel.getMembers()));
    //         if(channelMembers.indexOf(params.playerId) < 0) {
    //           params.channel.add(params.playerId, params.self.app.get('serverId'));
    //         } else { // can be removed if log not important 
    //           serverLog(stateOfX.serverLogType.info, 'Player is already present in pomelo channel, not adding here!');
    //         }
    //         serverLog(stateOfX.serverLogType.info, "channel members are  after- ");
    //         serverLog(stateOfX.serverLogType.info, 'Updated Members in pomelo channel: ' + JSON.stringify(params.channel.getMembers()));
    //         cb({success: true})
    //       } else {
    //         cb(validated);
    //       }
    //     });
    //   }
    /*==============================  END  =========================*/
  
    /*==============================  START  =========================*/
  // Generate join channel response as required by client

//   New
async joinChannelKeys(params: any): Promise<any> {
    const validated = await validateKeySets("Request", params.self.app.serverType, "joinChannelKeys", params);
    
    if (validated.success) {
      let res: any = {};
      res.success = true;
      params.table = _.omit(params.table, 'deck');
      res.tableDetails = {};
      res.roomConfig = {};
  
      // Add general values for join channel res
      const playerIndex = _ld.findIndex(params.table.players, { playerId: params.playerId });
  
      res.success = true;
      res.channelId = params.table.channelId;
      res.tableId = !res.channelId ? params.table.tournamentRules.tournamentId : "";
      res.playerId = params.playerId;
      res.playerName = params.playerName;
      res.cards = playerIndex >= 0 ? params.table.players[playerIndex].cards : [];
      res.isRunItTwice = playerIndex >= 0 ? params.table.players[playerIndex].isRunItTwice : false;
      res.bestHands = playerIndex >= 0 ? params.table.players[playerIndex].bestHands : "";
      res.isJoinWaiting = false;
      res.settings = { muteGameSound: true, dealerChat: false, playerChat: false, tableColor: 3, isMuckHand: false };
      res.antibanking = { isAntiBanking: false, amount: -1 };
  
      // Add table details for join res
  
      res.tableDetails.channelType = params.table.channelType;
      res.tableDetails.tournamentName = params.table.tournamentName;
      res.tableDetails.tournamentId = params.table.tournamentId;
      res.tableDetails.roundId = params.table.roundId;
      res.tableDetails.smallBlind = params.table.smallBlind;
      res.tableDetails.bigBlind = params.table.bigBlind;
      res.tableDetails.turnTime = params.table.turnTime;
      res.tableDetails.extraTurnTime = stateOfX.extraTimeBank[params.table.turnTime];
      res.tableDetails.isStraddleEnable = params.table.isStraddleEnable;
      res.tableDetails.runItTwiceEnable = params.table.runItTwiceEnable;
      res.tableDetails.state = params.table.state;
      res.tableDetails.roundCount = params.table.roundCount;
      res.tableDetails.roundName = params.table.roundName;
      res.tableDetails.roundBets = params.table.roundBets;
      res.tableDetails.roundMaxBet = params.table.roundMaxBet;
      res.tableDetails.maxBetAllowed = params.table.maxBetAllowed;
      res.tableDetails.pot = _.pluck(params.table.pot, 'amount');
      res.tableDetails.boardCard = params.table.boardCard;
      res.tableDetails.dealerIndex = params.table.dealerSeatIndex;
      res.tableDetails.smallBlindIndex = params.table.smallBlindIndex >= 0 && !!params.table.players[params.table.smallBlindIndex] ? params.table.players[params.table.smallBlindIndex].seatIndex : -1;
      res.tableDetails.bigBlindIndex = params.table.bigBlindIndex >= 0 && !!params.table.players[params.table.bigBlindIndex] ? params.table.players[params.table.bigBlindIndex].seatIndex : -1;
      res.tableDetails.straddleIndex = params.table.straddleIndex >= 0 && !!params.table.players[params.table.straddleIndex] ? params.table.players[params.table.straddleIndex].seatIndex : -1;
      res.tableDetails.currentMoveIndex = params.table.currentMoveIndex >= 0 && !!params.table.players[params.table.currentMoveIndex] ? params.table.players[params.table.currentMoveIndex].seatIndex : -1;
      res.tableDetails.minRaiseAmount = params.table.minRaiseAmount;
      res.tableDetails.maxRaiseAmount = params.table.maxRaiseAmount;
      res.tableDetails.totalPot = this.getTotalPot(params.table.pot) + this.getTotalBet(params.table.roundBets);
  
      if (params.table.channelType === stateOfX.gameType.tournament) {
        res.tableDetails.isOnBreak = params.table.isOnBreak;
      }
  
      res.roomConfig._id = params.table.channelId;
      res.roomConfig.tableId = params.table.tournamentRules.tournamentId;
      res.roomConfig.channelType = params.table.channelType;
      res.roomConfig.smallBlind = params.table.smallBlind;
      res.roomConfig.bigBlind = params.table.bigBlind;
      res.roomConfig.isStraddleEnable = params.table.isStraddleEnable;
      res.roomConfig.turnTime = params.table.turnTime;
      res.roomConfig.extraTurnTime = stateOfX.extraTimeBank[params.table.turnTime];
      res.roomConfig.channelName = params.table.channelName;
      res.roomConfig.channelVariation = params.table.channelVariation;
      res.roomConfig.isRealMoney = params.table.isRealMoney;
      res.roomConfig.smallBlind = params.table.smallBlind;
      res.roomConfig.bigBlind = params.table.bigBlind;
      res.roomConfig.minBuyIn = params.table.minBuyIn;
      res.roomConfig.maxBuyIn = params.table.maxBuyIn;
      res.roomConfig.minPlayers = params.table.minPlayers;
      res.roomConfig.maxPlayers = params.table.maxPlayers;
      res.roomConfig.info = params.table.info;
  
      res.tableDetails.remainingMoveTime = params.table.state === stateOfX.gameState.running ? Number((((new Date().getTime()) - (params.table.turnTimeStartAt)) / (1000 * 60))) : 0;
  
      // res.tableDetails.players = params.table.players;
      res.tableDetails.players = [];
  
      for (let player of params.table.players) {
        res.tableDetails.players.push({
          channelId: player.channelId,
          playerId: player.playerId,
          playerName: player.playerName,
          chips: player.chips,
          seatIndex: player.seatIndex,
          state: player.state,
          imageAvtar: "",
          totalRoundBet: player.totalRoundBet,
          lastMove: player.lastMove,
          moves: player.moves,
          preCheck: player.preCheck,
          sitoutNextBigBlind: player.sitoutNextBigBlind,
          sitoutNextHand: player.sitoutNextHand,
          isRunItTwice: player.isRunItTwice,
          isTournamentSitout: player.tournamentData.isTournamentSitout
        });
      }
  
  
      return { success: true, table: res };
    } else {
      return validated;
    }
  };
  
//   Old
//   tournamentJoinHandler.joinChannelKeys = function (params, cb) {
//     keyValidator.validateKeySets("Request", params.self.app.serverType, "joinChannelKeys", params, function (validated){
//       if(validated.success) {
  
//         var res          = {};
//         res.success      = true;
//         params.table     = _.omit(params.table, 'deck');
//         res.tableDetails = {};
//         res.roomConfig   = {};
  
//         // Add general values for join channel res
//         var playerIndex   = _ld.findIndex(params.table.players, {playerId: params.playerId});
  
//         res.success       = true;
//         res.channelId     = params.table.channelId;
//         res.tableId       = !res.channelId ? params.table.tournamentRules.tournamentId : "";
//         res.playerId      = params.playerId;
//         res.playerName    = params.playerName;
//         res.cards         = playerIndex >= 0 ? params.table.players[playerIndex].cards : [];
//         res.isRunItTwice  = playerIndex >= 0 ? params.table.players[playerIndex].isRunItTwice : false,
//         res.bestHands     = playerIndex >= 0 ? params.table.players[playerIndex].bestHands : "";
//         res.isJoinWaiting = false;
//         res.settings      = {muteGameSound: true, dealerChat: false, playerChat: false, tableColor: 3, isMuckHand: false};
//         res.antibanking   = {isAntiBanking: false, amount: -1};
  
//         // Add table details for join res
//         serverLog(stateOfX.serverLogType.info,'Table while sending start tournament res - ' + JSON.stringify(params.table));
  
//         res.tableDetails.channelType      = params.table.channelType;
//         res.tableDetails.tournamentName   = params.table.tournamentName;
//         res.tableDetails.tournamentId   = params.table.tournamentId;
//         res.tableDetails.roundId          = params.table.roundId;
//         res.tableDetails.smallBlind       = params.table.smallBlind;
//         res.tableDetails.bigBlind         = params.table.bigBlind;
//         res.tableDetails.turnTime         = params.table.turnTime;
//         res.tableDetails.extraTurnTime    = stateOfX.extraTimeBank[params.table.turnTime];
//         res.tableDetails.isStraddleEnable = params.table.isStraddleEnable;
//         res.tableDetails.runItTwiceEnable = params.table.runItTwiceEnable;
//         res.tableDetails.state            = params.table.state;
//         res.tableDetails.roundCount       = params.table.roundCount;
//         res.tableDetails.roundName        = params.table.roundName;
//         res.tableDetails.roundBets        = params.table.roundBets;
//         res.tableDetails.roundMaxBet      = params.table.roundMaxBet;
//         res.tableDetails.maxBetAllowed    = params.table.maxBetAllowed;
//         res.tableDetails.pot              = _.pluck(params.table.pot, 'amount');
//         res.tableDetails.boardCard        = params.table.boardCard;
//         res.tableDetails.dealerIndex      = params.table.dealerSeatIndex;
//         res.tableDetails.smallBlindIndex  = params.table.smallBlindIndex >= 0 && !!params.table.players[params.table.smallBlindIndex] ? params.table.players[params.table.smallBlindIndex].seatIndex : -1;
//         res.tableDetails.bigBlindIndex    = params.table.bigBlindIndex >= 0 && !!params.table.players[params.table.bigBlindIndex] ? params.table.players[params.table.bigBlindIndex].seatIndex : -1;
//         res.tableDetails.straddleIndex    = params.table.straddleIndex >= 0 && !!params.table.players[params.table.straddleIndex] ? params.table.players[params.table.straddleIndex].seatIndex : -1;
//         res.tableDetails.currentMoveIndex = params.table.currentMoveIndex >= 0 && !!params.table.players[params.table.currentMoveIndex] ? params.table.players[params.table.currentMoveIndex].seatIndex : -1;
//         res.tableDetails.minRaiseAmount   = params.table.minRaiseAmount;
//         res.tableDetails.maxRaiseAmount   = params.table.maxRaiseAmount;
//         res.tableDetails.totalPot         = tournamentJoinHandler.getTotalPot(params.table.pot) + tournamentJoinHandler.getTotalBet(params.table.roundBets);
  
//         if(params.table.channelType === stateOfX.gameType.tournament) {
//           res.tableDetails.isOnBreak      = params.table.isOnBreak;
//         }
  
//         res.roomConfig._id              = params.table.channelId;
//         res.roomConfig.tableId          = params.table.tournamentRules.tournamentId;
//         res.roomConfig.channelType      = params.table.channelType;
//         res.roomConfig.smallBlind       = params.table.smallBlind;
//         res.roomConfig.bigBlind         = params.table.bigBlind;
//         res.roomConfig.isStraddleEnable = params.table.isStraddleEnable;
//         res.roomConfig.turnTime         = params.table.turnTime;
//         res.roomConfig.extraTurnTime    = stateOfX.extraTimeBank[params.table.turnTime];
//         res.roomConfig.channelName      = params.table.channelName;
//         res.roomConfig.channelVariation = params.table.channelVariation;
//         res.roomConfig.isRealMoney      = params.table.isRealMoney;
//         res.roomConfig.smallBlind       = params.table.smallBlind;
//         res.roomConfig.bigBlind         = params.table.bigBlind;
//         res.roomConfig.minBuyIn         = params.table.minBuyIn;
//         res.roomConfig.maxBuyIn         = params.table.maxBuyIn;
//         res.roomConfig.minPlayers       = params.table.minPlayers;
//         res.roomConfig.maxPlayers       = params.table.maxPlayers;
//         res.roomConfig.info             = params.table.info;
  
//         res.tableDetails.remainingMoveTime = params.table.state === stateOfX.gameState.running ? parseInt(( ((new Date().getTime()) - (params.table.turnTimeStartAt))/(1000*60) )) : 0;
  
//         // res.tableDetails.players = params.table.players;
//         res.tableDetails.players = [];
//         async.each(params.table.players, function(player, ecb) {
//           serverLog(stateOfX.serverLogType.info, 'Player in join - ' + JSON.stringify(player));
//           res.tableDetails.players.push({
//             channelId           : player.channelId,
//             playerId            : player.playerId,
//             playerName          : player.playerName,
//             chips               : player.chips,
//             seatIndex           : player.seatIndex,
//             state               : player.state,
//             imageAvtar          : "",
//             totalRoundBet       : player.totalRoundBet,
//             lastMove            : player.lastMove,
//             moves               : player.moves,
//             preCheck            : player.preCheck,
//             sitoutNextBigBlind  : player.sitoutNextBigBlind,
//             sitoutNextHand      : player.sitoutNextHand,
//             isRunItTwice        : player.isRunItTwice,
//             isTournamentSitout  : player.tournamentData.isTournamentSitout
//           });
//           ecb();
//         }, function(err){
//           serverLog(stateOfX.serverLogType.info, 'Final join res - ' + JSON.stringify(res))
//           cb({success: true, table: res});
//         });
//       } else {
//         cb(validated);
//       }
//     });
//   }
    /*==============================  END  =========================*/









}