import { Injectable } from "@nestjs/common";
import * as _ from 'underscore';
import { systemConfig, stateOfX, popupTextManager } from 'shared/common';
import { BroadcastHandlerService } from "./broadcastHandler.service";
import { StartGameHandlerService } from "./startGameHandler.service";
import { ImdbDatabaseService } from "shared/common/datebase/Imdbdatabase.service";
import { PokerDatabaseService } from "shared/common/datebase/pokerdatabase.service";
import { TournamentJoinHandlerService } from "./tournamentJoinHandler.service";










  createtable = require("../../../../../shared/createTournamentTable.js"),

  declare const pomelo:any;

@Injectable()
export class LateRegistrationHandlerService {

    constructor(

        private db: PokerDatabaseService,
        private imdb: ImdbDatabaseService,
        private broadcastHandler:BroadcastHandlerService,
        private startGameHandler:StartGameHandlerService,
        private tournamentJoinHandler:TournamentJoinHandlerService,
        private createtable:CreatetableService,

    ) {}




    /*================================  START  =========================*/


    // New
    const isChannelAvailable = async function (params: any): Promise<void> {
        try {
            // Assuming imdb.getAllTableByTournamentId is an async function now
            let channels = await this.imdb.getAllTableByTournamentId({ tournamentId: params.tournamentId });
    
            if (!channels || channels.length < 1) {
                // Handle error case similar to the callback scenario
                throw new Error(popupTextManager.dbQyeryInfo.DBGETALLTABLEBYTOURNAMENTIDFAIL_LATEREGISTRATIONHANDLER);
            }
    
            let maxPlayerOnTable = channels[0].maxPlayers;
            let playingPlayers = 0;
    
            // Counting the number of playing players
            for (let i = 0; i < channels.length; i++) {
                playingPlayers += channels[i].players.length;
            }
    
            params.playingPlayers = playingPlayers;
            params.runningTables = channels.length;
    
            // Filter channels to find those with available space
            channels = channels.filter((channel) => channel.players.length < maxPlayerOnTable);
    
            if (channels.length > 0) {
                params.isChannelAvailable = true;
                params.availableChannelId = channels[0].channelId;
                params.availableChannel = channels[0];
                params.playersInCurrentChannel = channels[0].players.length;
            }

            return params;
        } catch (err) {
            // Error handling (equivalent to calling the callback with an error)
            console.error(err);
            params.isChannelAvailable = false;
            params.errorInfo = err.message || "An error occurred while checking channel availability.";
        }
    }
    
    

    // Old
    // const isChannelAvailable = function (params, cb) {
    //     imdb.getAllTableByTournamentId({ tournamentId: params.tournamentId }, function (err, channels) {
    //       if (err || !channels || channels.length < 1) {
    //         cb({ success: false, isRetry: false, isDisplay: false, channelId: "", info: popupTextManager.dbQyeryInfo.DBGETALLTABLEBYTOURNAMENTIDFAIL_LATEREGISTRATIONHANDLER });
    //       } else {
    //         let maxPlayerOnTable = channels[0].maxPlayers;
    //         // finding all playing players
    //         let playingPlayers = 0;
    //         for (let i = 0; i < channels.length; i++) {
    //           playingPlayers += channels[i].players.length;
    //         }
    //         params.playingPlayers = playingPlayers;
    //         params.runningTables = channels.length;
    //         channels = _.filter(channels, function (channel) { return channel.players.length < maxPlayerOnTable });
    //         if (channels.length > 0) {
    //           params.isChannelAvailable = true;
    //           params.availableChannelId = channels[0].channelId;
    //           params.availableChannel = channels[0];
    //           params.playersInCurrentChannel = channels[0].players.length;
    //         }
    //         cb(null, params);
    //       }
    //     })
    //   }
    /*================================  END  =========================*/
  

    /*================================  START  =========================*/

    // New
    preparePlayer(channel: any, player: any): any {
        const freeIndex = (_.difference(_.range(1, channel.maxPlayers + 1), _.pluck(channel.players, "seatIndex")))[0];
    
        return {
            playerId: player.playerId,
            channelId: channel.channelId,
            bounty: channel.tournamentRules && channel.tournamentRules.bountyFees ? channel.tournamentRules.bountyFees : 0,
            playerName: player.playerName || player.userName,
            networkIp: player.networkIp,
            active: false,
            chips: parseInt(channel.noOfChipsAtGameStart),
            lastRealChipBonus: 0,
            lastRealChip: 0,
            currentRCBstack: 0,
            totalRCB: 0,
            totalRC: 0,
            seatIndex: freeIndex,
            imageAvtar: player.imageAvtar || "",
            cards: [],
            moves: [],
            preCheck: -1,
            bestHands: "",
            state: stateOfX.playerState.waiting,
            lastBet: 0,
            lastMove: null,
            totalRoundBet: 0,
            totalGameBet: 0,
            lastRoundPlayed: "",
            isMuckHand: false,
            preActiveIndex: -1,
            nextActiveIndex: -1,
            isDisconnected: false,
            bigBlindMissed: 0,
            isAutoReBuy: false,
            autoReBuyAmount: 0,
            isRunItTwice: false,
            isPlayed: false,
            sitoutNextHand: false,
            sitoutNextBigBlind: false,
            autoSitout: false,
            isSkipped: false,
            sitoutGameMissed: 0,
            roundMissed: 0,
            disconnectedMissed: 0,
            hasPlayedOnceOnTabl: false,
            isForceBlindEnable: false,
            isWaitingPlayer: true,
            isStraddleOpted: false,
            onGameStartBuyIn: parseInt(channel.onGameStartBuyIn),
            onSitBuyIn: parseInt(channel.onSitBuyIn),
            roundId: null,
            totalGames: 0,
            systemFoldedCount: 0,
            timeBankSec: systemConfig.timebank.initialSec,
            isJoinedOnce: false,
            isAutoReBuyEnabled: false,
            isAutoAddOnEnabled: false,
            isCurrentRoundPlayer: false,
            isActionBySystem: false,
            activityRecord: {
                seatReservedAt: !!player.state && player.state === stateOfX.playerState.reserved ? new Date() : null,
                lastMovePlayerAt: null,
                disconnectedAt: null,
                lastActivityAction: "",
                lastActivityTime: Number(new Date())
            },
            tournamentData: {
                userName: player.userName,
                isTournamentSitout: false,
                isTimeBankUsed: false,
                timeBankStartedAt: null,
                totalTimeBank: channel.timeBankRuleData && channel.timeBankRuleData[0] && channel.timeBankRuleData[0].blindLevel === 1 ? channel.timeBankRuleData[0].duration : 0,
                timeBankLeft: channel.timeBankRuleData && channel.timeBankRuleData[0] && channel.timeBankRuleData[0].blindLevel === 1 ? channel.timeBankRuleData[0].duration : 0,
                timeAddedAtBlindLevel: channel.timeBankRuleData && channel.timeBankRuleData[0] && channel.timeBankRuleData[0].blindLevel === 1 ? channel.timeBankRuleData[0].blindLevel : 0,
            },
            playerCallTimer: {
                playerId: null,
                timer: 0,
                status: false,
                createdAt: null,
                isCallTimeOver: false
            },
            isForceBlindVisible: false,
            autoBuyInFlag: false
        }
    }
    
    

    // Old
//   const preparePlayer = function (channel, player) {
//     let freeIndex = (_.difference(_.range(1, channel.maxPlayers + 1), _.pluck(channel.players, "seatIndex")))[0];
//     return {
//       playerId: player.playerId,
//       channelId: channel.channelId,
//       bounty: channel.tournamentRules && channel.tournamentRules.bountyFees ? channel.tournamentRules.bountyFees : 0,
//       playerName: player.playerName || player.userName,
//       networkIp: player.networkIp,
//       active: false,
//       chips: parseInt(channel.noOfChipsAtGameStart),
//       lastRealChipBonus: 0,
//       lastRealChip: 0,
//       currentRCBstack: 0,
//       totalRCB: 0,
//       totalRC: 0,
//       seatIndex: freeIndex,
//       imageAvtar: player.imageAvtar || "",
//       cards: [],
//       moves: [],
//       preCheck: -1,
//       bestHands: "",
//       state: stateOfX.playerState.waiting,
//       lastBet: 0,
//       lastMove: null,
//       totalRoundBet: 0,
//       totalGameBet: 0,
//       lastRoundPlayed: "",
//       isMuckHand: false,
//       preActiveIndex: -1,
//       nextActiveIndex: -1,
//       isDisconnected: false,
//       bigBlindMissed: 0,
//       isAutoReBuy: false,
//       autoReBuyAmount: 0,
//       isRunItTwice: false,
//       isPlayed: false,
//       sitoutNextHand: false,
//       sitoutNextBigBlind: false,
//       autoSitout: false,
//       isSkipped: false,
//       sitoutGameMissed: 0,
//       roundMissed: 0,
//       disconnectedMissed: 0,
//       hasPlayedOnceOnTabl: false,
//       isForceBlindEnable: false,
//       isWaitingPlayer: true,
//       isStraddleOpted: false,
//       onGameStartBuyIn: parseInt(channel.onGameStartBuyIn),
//       onSitBuyIn: parseInt(channel.onSitBuyIn),
//       roundId: null,
//       totalGames: 0,
//       systemFoldedCount: 0,
//       timeBankSec: systemConfig.timebank.initialSec,
//       isJoinedOnce: false,
//       isAutoReBuyEnabled: false,
//       isAutoAddOnEnabled: false,
//       isCurrentRoundPlayer: false,
//       isActionBySystem: false,
//       activityRecord: {
//         seatReservedAt: !!player.state && player.state === stateOfX.playerState.reserved ? new Date() : null,
//         lastMovePlayerAt: null,
//         disconnectedAt: null,
//         lastActivityAction: "",
//         lastActivityTime: Number(new Date())
//       },
//       tournamentData: {
//         userName: player.userName,
//         isTournamentSitout: false,
//         isTimeBankUsed: false,
//         timeBankStartedAt: null,
//         totalTimeBank: channel.timeBankRuleData && channel.timeBankRuleData[0] && channel.timeBankRuleData[0].blindLevel == 1 ? channel.timeBankRuleData[0].duration : 0,
//         timeBankLeft: channel.timeBankRuleData && channel.timeBankRuleData[0] && channel.timeBankRuleData[0].blindLevel == 1 ? channel.timeBankRuleData[0].duration : 0,
//         timeAddedAtBlindLevel: channel.timeBankRuleData && channel.timeBankRuleData[0] && channel.timeBankRuleData[0].blindLevel == 1 ? channel.timeBankRuleData[0].blindLevel : 0,
//       },
//       playerCallTimer: {
//         playerId: null,
//         timer: 0,
//         status: false,
//         createdAt: null,
//         isCallTimeOver: false
//       },
//       isForceBlindVisible: false,
//       autoBuyInFlag: false
//     }
//   }
    /*================================  END  =========================*/
  

    /*================================  START  =========================*/

    // New
    async createChannel(params: any): Promise<any> {
        if (params.isChannelAvailable) {
            try {
                const player = await this.db.findUser({ playerId: params.playerId });
                let updatedPlayer: any[] = [];
                params.player = this.preparePlayer(params.availableChannel, player);
                updatedPlayer.push(params.player);
    
                const result = await this.imdb.pushPlayersInTable(updatedPlayer, params.availableChannelId);
    
                return params; // Return params with updated player
            } catch (err) {
                return { success: false, isRetry: false, isDisplay: true, channelId: "", info: popupTextManager.dbQyeryInfo.DBFINDUSERFAIL_LATEREGISTRATIONHANDLER };
            }
        } else {
            try {
                const response = await this.createtable.createTableByTournamentId({ tournamentId: params.tournamentId, runningTables: params.runningTables });
    
                if (response.success) {
                    let channelId = response.table.channelId;
                    let channel = pomelo.app.get('channelService').getChannel(channelId, false);
                    if (!channel) {
                        channel = pomelo.app.get('channelService').getChannel(channelId, true);
                    }
    
                    const createTableResponse = await this.tournamentJoinHandler.createChannel({
                        self: pomelo,
                        session: params.session,
                        channel: channel,
                        channelId: channelId,
                        channelType: response.table.channelType,
                        tableId: "",
                        playerId: ""
                    });
    
                    if (createTableResponse.success) {
                        params.availableChannelId = createTableResponse.table.channelId;
                        const player = await this.db.findUser({ playerId: params.playerId });
    
                        let updatedPlayer: any[] = [];
                        params.player = this.preparePlayer(createTableResponse.table, player);
                        params.availableChannel = createTableResponse.table;
                        updatedPlayer.push(params.player);
    
                        const result = await this.imdb.pushPlayersInTable(updatedPlayer, params.availableChannelId);
    
                        return params; // Return params with updated player
                    } else {
                        return { success: false, isRetry: false, isDisplay: false, channelId: "", info: popupTextManager.falseMessages.ERRORCREATINGCHANNELFAIL_LATEREGISTRATIONHANDLER };
                    }
                } else {
                    return { success: false, isRetry: false, isDisplay: false, channelId: "", info: popupTextManager.falseMessages.ERRORCREATINGTABLEINCHANNELFAIL_LATEREGISTRATIONHANDLER };
                }
            } catch (err) {
                return { success: false, isRetry: false, isDisplay: false, channelId: "", info: popupTextManager.dbQyeryInfo.DBFINDUSERFAIL_LATEREGISTRATIONHANDLER };
            }
        }
    }
    

    // Old
    //   const createChannel = function (params, cb) {
    //     if (params.isChannelAvailable) {
    //       db.findUser({ playerId: params.playerId }, function (err, player) {
    //         if (err) {
    //           cb({ success: false, isRetry: false, isDisplay: true, channelId: "", info: popupTextManager.dbQyeryInfo.DBFINDUSERFAIL_LATEREGISTRATIONHANDLER });
    //         } else {
    //           let updatedPlayer = [];
    //           params.player = preparePlayer(params.availableChannel, player);
    //           updatedPlayer.push(params.player);
    //           imdb.pushPlayersInTable(updatedPlayer, params.availableChannelId, function (err, result) {
    //             if (err) {
    //               cb({ success: false, isRetry: false, isDisplay: false, channelId: "", info: popupTextManager.dbQyeryInfo.DBPUSHPLAYERSINTABLEFAIL_LATEREGISTRATIONHANDLER });
    //             } else {
    //               cb(null, params)
    //             }
    //           })
    //         }
    //       })
    //     } else {
    //       createtable.createTableByTournamentId({ tournamentId: params.tournamentId, runningTables: params.runningTables }, function (response) {
    //         if (response.success) {
    //           let channelId = response.table.channelId;
    //           let channel = pomelo.app.get('channelService').getChannel(channelId, false);
    //           if (!channel) {
    //             channel = pomelo.app.get('channelService').getChannel(channelId, true);
    //           }
    //           // create channel
    //           tournamentJoinHandler.createChannel({ self: pomelo, session: params.session, channel: channel, channelId: channelId, channelType: response.table.channelType, tableId: "", playerId: "" }, function (createTableResponse) {
    //             if (createTableResponse.success) {
    //               params.availableChannelId = createTableResponse.table.channelId;
    //               db.findUser({ playerId: params.playerId }, function (err, player) {
    //                 if (err) {
    //                   cb({ success: false, isRetry: false, isDisplay: true, channelId: "", info: popupTextManager.dbQyeryInfo.DBFINDUSERFAIL_LATEREGISTRATIONHANDLER });
    //                 } else {
    //                   let updatedPlayer = [];
    //                   params.player = preparePlayer(createTableResponse.table, player);
    //                   params.availableChannel = createTableResponse.table;
    //                   updatedPlayer.push(params.player);
    //                   imdb.pushPlayersInTable(updatedPlayer, params.availableChannelId, function (err, result) {
    //                     if (err) {
    //                       cb({ success: false, isRetry: false, isDisplay: false, channelId: "", info: popupTextManager.dbQyeryInfo.DBPUSHPLAYERSINTABLEFAIL_LATEREGISTRATIONHANDLER });
    //                     } else {
    //                       cb(null, params)
    //                     }
    //                   })
    //                 }
    //               })
    //             } else {
    //               cb({ success: false, isRetry: false, isDisplay: false, channelId: "", info: popupTextManager.falseMessages.ERRORCREATINGCHANNELFAIL_LATEREGISTRATIONHANDLER });
    //             }
    //           })
    //         } else {
    //           cb({ success: false, isRetry: false, isDisplay: false, channelId: "", info: popupTextManager.falseMessages.ERRORCREATINGTABLEINCHANNELFAIL_LATEREGISTRATIONHANDLER });
    //         }
    //       })
    //     }
    //   }
    /*================================  END  =========================*/
  

    /*================================  START  =========================*/

    // New
    async saveActivityRecord(params: any): Promise<any> {

        const generateCOTRefrenceId = (): string => {
            let result = 'COT-';
            let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            for (let i = 0; i < 16; i++) {
                result += possible.charAt(Math.floor(Math.random() * possible.length));
            }
            return result;
        };
    
        const dataToInsert = {
            channelId: params.availableChannelId,
            playerId: params.playerId,
            isRequested: true,
            playerName: params.player.playerName,
            channelType: stateOfX.gameType.tournament,
            tableId: "",
            deviceType: '',
            referenceNumber: generateCOTRefrenceId(),
            networkIp: ''
        };
    
        // Use await on the upsert operations
        await this.imdb.upsertPlayerJoin(
            { channelId: dataToInsert.channelId, playerId: dataToInsert.playerId },
            {
                $setOnInsert: {
                    playerName: dataToInsert.playerName,
                    channelType: dataToInsert.channelType,
                    referenceNumber: dataToInsert.referenceNumber,
                    firstJoined: Number(new Date()),
                    observerSince: Number(new Date())
                },
                $set: { networkIp: dataToInsert.networkIp, event: 'join' }
            }
        );
    
        await this.imdb.upsertActivity({ channelId: dataToInsert.channelId, playerId: dataToInsert.playerId }, dataToInsert);
    };
    

    // Old
    //   const saveActivityRecord = function (params) {
    //     const generateCOTRefrenceId = () => {
    //       let result = 'COT-';
    //       let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    //       for (let i = 0; i < 16; i++) {
    //         result += possible.charAt(Math.floor(Math.random() * possible.length));
    //       } return result;
    //     }
    //     const dataToInsert = {
    //       channelId: params.availableChannelId,
    //       playerId: params.playerId,
    //       isRequested: true,
    //       playerName: params.player.playerName,
    //       channelType: stateOfX.gameType.tournament,
    //       tableId: "",
    //       deviceType: '',
    //       referenceNumber: generateCOTRefrenceId(),
    //       networkIp: ''
    //     }
    //     imdb.upsertPlayerJoin({ channelId: dataToInsert.channelId, playerId: dataToInsert.playerId }, { $setOnInsert: { playerName: dataToInsert.playerName, channelType: dataToInsert.channelType, referenceNumber: dataToInsert.referenceNumber, firstJoined: Number(new Date()), observerSince: Number(new Date()) }, $set: { networkIp: dataToInsert.networkIp, event: 'join' } }, (err, result) => { })
    //     imdb.upsertActivity({ channelId: dataToInsert.channelId, playerId: dataToInsert.playerId }, dataToInsert, function (err, result) { })
    //   }
    /*================================  END  =========================*/
  

    /*================================  START  =========================*/

    // New
    async sendAutoJoinBroadcast(params: any): Promise<any> {

        // Pomelo Connection
        let channel = pomelo.app.get('channelService').getChannel(params.availableChannelId, false);
        if (!channel) {
            channel = pomelo.app.get('channelService').getChannel(params.availableChannelId, true);
        }
        // Pomelo Connection


        params.channel = channel;
    
        // Sending message to user using the broadcast handler
        this.broadcastHandler.sendMessageToUser({
            self: {}, 
            playerId: params.playerId,
            msg: {
                playerId: params.playerId,
                tableId: params.tableId,
                channelId: params.availableChannelId,
                tableDetails: params.availableChannel,
                forceJoin: true,
                info: "Tournament has been started!"
            }, 
            route: "tournamentGameStart"
        });
    
        // No need for callback as we are using async/await
        return params;
    };
    

    // Old
    //   const sendAutoJoinBroadcast = function (params, cb) {
    //     let channel = pomelo.app.get('channelService').getChannel(params.availableChannelId, false);
    //     if (!channel) {
    //       channel = pomelo.app.get('channelService').getChannel(params.availableChannelId, true);
    //     }
    //     params.channel = channel;
    //     broadcastHandler.sendMessageToUser({
    //       self: {}, playerId: params.playerId,
    //       msg: {
    //         playerId: params.playerId,
    //         tableId: params.tableId,
    //         channelId: params.availableChannelId,
    //         tableDetails: params.availableChannel,
    //         forceJoin: true,
    //         info: "Tournament has been started!"
    //       }, route: "tournamentGameStart"
    //     });
    //     cb(null, params);
    //   }
    /*================================  END  =========================*/
  

    /*================================  START  =========================*/

    // new
    async sendSitBroadcast(params: any): Promise<any> {
        // Fire the sit broadcast
        this.broadcastHandler.fireSitBroadcast({
            self: params.self,
            channel: params.channel,
            player: params.player,
            table: params.availableChannel
        });
    
        // No need for callback, just return the params
        return params;
    };
    

    // Old
    //   const sendSitBroadcast = function (params, cb) {
    //     broadcastHandler.fireSitBroadcast({
    //       self: params.self,
    //       channel: params.channel,
    //       player: params.player,
    //       table: params.availableChannel
    //     });
    //     cb(null, params);
    //   }
    /*================================  END  =========================*/
  

    /*================================  START  =========================*/

    // New
    async process(params: any, session: any): Promise<any> {
        
        params.isChannelAvailable = false;
        params.availableChannelId = "";
        params.session = session;
    
        try {
            // Use async/await instead of waterfall
            await this.isChannelAvailable(params);
            await this.createChannel(params);
            await this.sendAutoJoinBroadcast(params);
            await this.sendSitBroadcast(params);
    
            // Save activity record
            this.saveActivityRecord(params);
    
            // Check if game can start
            if (params.playersInCurrentChannel < 2) {
                await this.startGameHandler.startGame({
                    self: pomelo,
                    session: "session",
                    channelId: params.availableChannelId,
                    channel: pomelo.app.get('channelService').getChannel(params.availableChannelId, false),
                    eventName: stateOfX.startGameEvent.tournament
                });
            }
    
            return { success: true, isRetry: false, isDisplay: false, channelId: "", info: popupTextManager.falseMessages.PROCESS_TRUE_LATEREGISTRATIONHANDLER };
        } catch (err) {
            console.log("ssbw6dnwdd777tgw inside err, result", err);
            return err; // Return error directly if any async operation fails
        }
    };
    

    // Old
    //   lateRegistrationHandler.process = function (params, session, cb) {
    //     console.log("ssbw6dnwdd777tgw inside lateRegistrationHandler.proces", params, session, cb)
    //     params.isChannelAvailable = false;
    //     params.availableChannelId = "";
    //     params.session = session;
    //     async.waterfall([
    //       async.apply(isChannelAvailable, params),
    //       createChannel,
    //       sendAutoJoinBroadcast,
    //       sendSitBroadcast
    //     ], function (err, result) {
    //       console.log("ssbw6dnwdd777tgw inside err, result", err, result)
    //       if (err) {
    //         cb(null, err);
    //       } else {
    //         saveActivityRecord(result)
    //         if (params.playersInCurrentChannel < 2) {
    //           startGameHandler.startGame({
    //             self: pomelo,
    //             session: "session",
    //             channelId: params.availableChannelId,
    //             channel: pomelo.app.get('channelService').getChannel(params.availableChannelId, false),
    //             eventName: stateOfX.startGameEvent.tournament
    //           });
    //         }
    //         cb(null, { success: true, isRetry: false, isDisplay: false, channelId: "", info: popupTextManager.falseMessages.PROCESS_TRUE_LATEREGISTRATIONHANDLER });
    //       }
    //     })
    //   }

    /*================================  END  =========================*/












}