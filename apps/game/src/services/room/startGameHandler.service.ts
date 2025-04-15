import { Injectable } from "@nestjs/common";
import _ from "underscore";
import _ld from "lodash";
import systemConfig from "./../../../../../libs/common/src/systemConfig.json";
import popupTextManager from "../../../../../libs/common/src/popupTextManager";
import stateOfX from "shared/common/stateOfX.sevice";
import { validateKeySets } from "shared/common/utils/activity";
import * as schedule from 'node-schedule';


import { PokerDatabaseService } from "shared/common/datebase/pokerdatabase.service";
import { ImdbDatabaseService } from "shared/common/datebase/Imdbdatabase.service";
import { ChannelTimerHandlerService } from "./channelTimerHandler.service";
import { BroadcastHandlerService } from "./broadcastHandler.service"

 calculateRanks = require("../../database/remote/calculateRanks.js");

import { ActionLoggerService } from "./actionLogger.service";

declare const pomelo: any;


@Injectable()
export class StartGameHandlerService {

    private gameStartJob:any;

    constructor(
        private readonly db: PokerDatabaseService,
        private readonly imdb: ImdbDatabaseService,
        private readonly channelTimerHandler: ChannelTimerHandlerService,
        private readonly startTournamentHandler: StartTournamentHandlerService,
        private readonly broadcastHandler: BroadcastHandlerService,
        private readonly tournamentActionHandler: TournamentActionHandlerService,
        private readonly actionLogger: ActionLoggerService,
        private readonly calculateRanks:CalculateRanksService

    ) { }

    /*==============================  START  ==========================*/
    // reset ev Chop on Game start

    //   New
    async resetEvChop(params: any): Promise<void> {
        if (params.channel?.isEvChopTable) {
            try {
                await this.imdb.resetEvChop({ channelId: params.channelId });
            } catch (err) {
                console.error("Error in resetEvChop:", err);
            }
        }
    };

    //   Old
    //   var resetEvChop = function (params, cb) {
    //     console.log("inside resetEvChop", params.table)
    //     if (params.channel?.isEvChopTable) {
    //         imdb.resetEvChop({ channelId: params.channelId }, function (err, res) { })
    //     }
    // }      
    /*==============================  END  ==========================*/


    /*==============================  START  ==========================*/
    // Handle start game and validate everything before starting a game

    // New
    async startGame(params: any): Promise<any> {
        try {
            // Reset all in occured value in channel
            params.channel.allInOccuredOnChannel = false;
            this.resetEvChop(params);

            const validated = await validateKeySets("Request", "connector", "startGame", params);
            if (!validated.success) {
                console.log(stateOfX.serverLogType.info, 'Start game key validation response - ' + JSON.stringify(validated));
            }

            let response = await this.initializeParams(params);
            response = await this.addOnManagement(response);
            response = await this.breakManagement(response);
            response = await this.bubbleManagement(response);
            response = await this.waitForRebuy(response);
            response = await this.removeSitoutPlayers(response);
            response = await this.checkGameStartOnChannelLevel(response);
            response = await this.waitForOutOfMoney(response);
            response = await this.shuffleTournamentPlayers(response);
            response = await this.removeWinnerPlayerInTournament(response);
            response = await this.startGameProcess(response);
            response = await this.validateCurrentPlayers(response);
            response = await this.fireGamePlayersBroadcast(response);
            response = await this.setOnBreakAndStartReserveTimer(response); // <- fixed typo
            response = await this.checkGameStart(response);
            response = await this.fireCardDistributeBroadcast(response);
            response = await this.fireDeductBlindBroadcast(response);
            response = await this.firePlayerSettings(response);
            response = await this.updateEveryPlayerStats(response);
            response = await this.fireStartGameBroadcast(response);
            response = await this.removeBlindMissedPlayers(response);
            response = await this.firePrecheckBroadcast(response);
            response = await this.fireDealerChatTableInfo(response);
            response = await this.fireDealerChatGameStart(response);

            console.log("startGame res final", null, response);
            this.handleAdditionalCases(params);

        } catch (err) {
            console.log(stateOfX.serverLogType.error, 'Game will not start, REASON - ' + JSON.stringify(err));
            if (params.channel.channelType !== stateOfX.gameType.normal) {
                this.changeStateOfTournament(params);
            }
        }
    }



    // Old
    // startGameHandler.startGame = function (params, cb) {
    // console.trace("params in startGameHandler.startGame", params)
    // serverLog(stateOfX.serverLogType.info, 'Starting game from event - ' + params.eventName);
    // // Reset all in occured value in channel
    // params.channel.allInOccuredOnChannel = false;
    // resetEvChop(params);

    // keyValidator.validateKeySets("Request", "connector", "startGame", params, function (validated) {
    //     if (validated.success) {
    //         async.waterfall([
    //             async.apply(initializeParams, params),
    //             addOnManagement,
    //             breakManagement,
    //             bubbleManagement,
    //             waitForRebuy,
    //             removeSitoutPlayers,
    //             checkGameStartOnChannelLevel,
    //             waitForOutOfMoney,
    //             shuffleTournamentPlayers,
    //             removeWinnerPlayerInTournament,
    //             startGameProcess,
    //             validateCurrentPlayers,
    //             fireGamePlayersBroadcast,
    //             setOnBreakAndStartReserveTimer,
    //             checkGameStart,
    //             fireCardDistributeBroadcast,
    //             fireDeductBlindBroadcast,
    //             firePlayerSettings,
    //             updateEveryPlayerStats,
    //             fireStartGameBroadcast,
    //             removeBlindMissedPlayers,
    //             firePrecheckBroadcast,
    //             fireDealerChatTableInfo,
    //             fireDealerChatGameStart,
    //             // resetEvChop

    //         ], function (err, response) {
    //             console.log("startGame res final", err, response)
    //             if (err && !response) {
    //                 console.log(stateOfX.serverLogType.error, 'Game will not start, REASON - ' + JSON.stringify(err));
    //                 if (params.channel.channelType !== stateOfX.gameType.normal) {
    //                     changeStateOfTournament(params);
    //                 }
    //             } else {
    //                 handleAdditionalCases(params);
    //             }
    //         })
    //     } else {
    //         serverLog(stateOfX.serverLogType.info, 'Start game key validation response - ' + JSON.stringify(validated));
    //     }
    // });
    // }
    /*==============================  END  ==========================*/



    convertIntoDecimal(input: number): number {
        if (systemConfig.isDecimal === true) {
            return parseFloat(parseFloat(input.toString()).toFixed(2));
        } else {
            return Math.round(input);
        }
    };



    /*==============================  START  ==========================*/

    // New
    sessionExport(session: any): any{
        const EXPORTED_SESSION_FIELDS: string[] = ['id', 'frontendId', 'uid', 'settings'];
        const res: Record<string, any> = {};
        this.clone(session, res, EXPORTED_SESSION_FIELDS);
        return res;
    };

    // Old
    // let sessionExport = (session) => {
    //     let EXPORTED_SESSION_FIELDS = ['id', 'frontendId', 'uid', 'settings']
    //     let res = {};
    //     clone(session, res, EXPORTED_SESSION_FIELDS);
    //     return res;
    //   };
    /*==============================  END  ==========================*/


    /*==============================  START  ==========================*/
    /**
     * clone object keys
     * @method clone
     * @param  {Object} src      source of keys
     * @param  {Object} dest     destination for keys
     * @param  {Array}  includes list of keys - array of Strings
     */

    //   New
    clone(src: Record<string, any>, dest: any, includes: any) {
        for (let i = 0; i < includes.length; i++) {
            const key = includes[i];
            dest[key] = src[key];
        }
    }

    //   Old
    //   let clone = (src, dest, includes) => {
    //     let f;
    //     for (let i = 0, l = includes.length; i < l; i++) {
    //       f = includes[i];
    //       dest[f] = src[f];
    //     }
    //   };
    /*==============================  END  ==========================*/

    // handleAdditionalCases - game start - blinds allin cases - SPECIAL in file

    /*==============================  START  ==========================*/
    // Fire turn broadcast if required after Game start cases

    //   New
    async removeSitoutPlayers(params: any): Promise<any> {
        const getTableAttribResponse = await pomelo.app.rpc.database.tableRemote.getTableAttrib(
            params.session,
            { channelId: params.channelId, key: "players" }
        );

        if (getTableAttribResponse.success !== true || getTableAttribResponse.value.length === 0) {
            return params;
        }

        const gamePlayers = getTableAttribResponse.value;

        try {
            const res = await this.imdb.getAllPlayerBuyInSum({ channelId: params.channelId });

            for (const player of gamePlayers) {
                const pMatch = res.filter((r: any) => r._id === player.playerId);
                if (pMatch.length) {
                    player.playerScore = this.convertIntoDecimal(player.chips - (pMatch[0]?.totalBuyIns ?? 0));
                }
            }

            let playerToRemove = gamePlayers.filter((player: any) =>
                player.roundMissed === systemConfig.roundMissedPlayerLeave
            );

            playerToRemove = playerToRemove.filter((player: any) => {
                return !(
                    params.channel.isCTEnabledTable &&
                    player.playerScore > 0 &&
                    (
                        (!player.playerCallTimer.status && player.callTimeGameMissed <= params.channel.ctEnabledBufferHand) ||
                        (player.playerCallTimer.status && !player.playerCallTimer.isCallTimeOver)
                    )
                );
            });

            console.log('playerToRemove list', playerToRemove);

            if (playerToRemove.length > 0) {
                for (const player of playerToRemove) {
                    console.error(player);
                    await this.getPlayerSessionServer(player, params);
                    await this.getHitLeave(player, params);
                    this.fireRemoveBlindMissedPlayersBroadCast(params, player, player.channelId);
                }
            }

            return params;
        } catch (err) {
            console.error(err);
            return params;
        }
    };

    //   Old
    //   const removeSitoutPlayers = function (params, cb) {
    //     pomelo.app.rpc.database.tableRemote.getTableAttrib(params.session, { channelId: params.channelId, key: "players" }, function (getTableAttribResponse) {
    //       if (getTableAttribResponse.success == true && getTableAttribResponse.value.length > 0) {
    //         let gamePlayers = getTableAttribResponse.value;
    //         imdb.getAllPlayerBuyInSum({
    //           channelId: params.channelId
    //         }, function (err, res) {
    //           if (err) {
    //             console.log(err);
    //           } else {
    //             _.each(gamePlayers, (player) => {
    //               let pMatch = _.where(res, { _id: player.playerId })
    //               if (pMatch.length) {
    //                 player.playerScore = convert.convert((player.chips - (pMatch[0] ? pMatch[0].totalBuyIns : 0)));
    //                 // console.log('playerscore and chips at game end: ', pMatch);
    //               }
    //             });
    //           }
    //           var playerToRemove = _.where(gamePlayers, { roundMissed: systemConfig.roundMissedPlayerLeave });
    //           var playerToRemove = _.reject(playerToRemove, (player) => {
    //             // table not avalable
    //             return params.channel.isCTEnabledTable && player.playerScore > 0
    //               && (
    //                 (player.playerCallTimer.status === false && player.callTimeGameMissed <= params.channel.ctEnabledBufferHand)
    //                 || (player.playerCallTimer.status === true
    //                   && !(player.playerCallTimer.isCallTimeOver)
    //                 )
    //               );
    //           });

    //           console.log('playerToRemove list', playerToRemove);
    //           if (!!playerToRemove && playerToRemove.length > 0) {
    //             async.each(playerToRemove, function (player, ecb) {
    //               getPlayerSessionServer(player, params, function (err, responsePlayer) {
    //                 console.error(player);
    //                 getHitLeave(player, params, function (err, leaveResponse) {
    //                   fireRemoveBlindMissedPlayersBroadCast(params, player, player.channelId)
    //                   ecb();
    //                 })
    //               })
    //             }, function (err) {
    //               cb(null, params);
    //             });
    //           } else {
    //             cb(null, params);
    //           }
    //         })
    //       } else {
    //         cb(null, params);
    //       }
    //     })
    //   }
    /*==============================  END  ==========================*/

    /*==============================  START  ==========================*/

    // New
    async fireGameStartTurnBroadcast(params: any, handleGameStartResponse: any): Promise<void> {
        if (handleGameStartResponse.turns.length > 0) {

            // kill first turn timer, if turns are there in this case
            clearTimeout(params.channel.firstTurnTimer);

            for (let i = 0; i < handleGameStartResponse.turns.length; i++) {
                handleGameStartResponse.turns[i].channel = params.channel;

                try {
                    const fireOnTurnBroadcastResponse = await this.broadcastHandler.fireOnTurnBroadcast(handleGameStartResponse.turns[i]);
                    if (fireOnTurnBroadcastResponse.success) {
                        ///////////////////////////////////////////////////
                        this.channelTimerHandler.startTurnTimeOut(params);   //
                        console.error("@@@@@@@@@@!!!!!!!!!!!@@@@@@@@@@@!!!!!!!!!!!!!");
                        ///////////////////////////////////////////////////
                    } else {
                        console.log(stateOfX.serverLogType.error, 'Unable to broadcast turn, in Game start auto turn condition!');
                    }
                } catch (err) {
                    console.log(stateOfX.serverLogType.error, 'Error in fireOnTurnBroadcast: ' + err);
                }
            }
        }
    };


    // Old
    //   const fireGameStartTurnBroadcast = function (params, handleGameStartResponse) {
    //     if (handleGameStartResponse.turns.length > 0) {

    //       // kill first turn timer, if turns are there in this case
    //       clearTimeout(params.channel.firstTurnTimer);

    //       for (var i = 0; i < handleGameStartResponse.turns.length; i++) {
    //         // handleGameStartResponse.turns[i].self = params.self;
    //         handleGameStartResponse.turns[i].channel = params.channel;
    //         broadcastHandler.fireOnTurnBroadcast(handleGameStartResponse.turns[i], function (fireOnTurnBroadcastResponse) {
    //           if (fireOnTurnBroadcastResponse.success) {
    //             ///////////////////////////////////////////////////
    //             channelTimerHandler.startTurnTimeOut(params); //
    //             console.error("@@@@@@@@@@!!!!!!!!!!!@@@@@@@@@@@!!!!!!!!!!!!!");
    //             ///////////////////////////////////////////////////
    //             // Commenting this out in order to prevent multiple timer start for 
    //             // first player with move as a timer might have been started
    //             // on normal game start broadcast fire event
    //           } else {
    //             serverLog(stateOfX.serverLogType.error, 'Unable to broadcast turn, in Game start auto turn condition!');
    //           }
    //         });
    //       };
    //     }
    //   }
    /*==============================  END  ==========================*/

    /*==============================  START  ==========================*/
    // tournament

    //   New
    async getTournamentRoom(tournamentId: any): Promise<any> {
        console.log(stateOfX.serverLogType.info, "tournamentId is in getTournamentRoom is  ", tournamentId);

        try {
            const tournament = await this.db.getTournamentRoom(tournamentId);

            if (!tournament) {
                return {
                    success: false,
                    isRetry: false,
                    isDisplay: true,
                    info: popupTextManager.falseMessages.DBGETTOURNAMENTROOMFAIL_TOURNAMENT,
                    channelId: "",
                };
            }

            return {
                success: true,
                isTournamentRunning: tournament.isTournamentRunning,
                enrolledPlayer: tournament.enrolledPlayer,
            };
        } catch (err) {
            return {
                success: false,
                isRetry: false,
                isDisplay: true,
                info: popupTextManager.falseMessages.DBGETTOURNAMENTROOMFAIL_TOURNAMENT,
                channelId: "",
            };
        }
    };


    //   Old
    //   const getTournamentRoom = function (tournamentId, cb) {
    //     console.log(stateOfX.serverLogType.info, "tournamentId is in getTournamentRoom is  ", tournamentId);
    //     db.getTournamentRoom(tournamentId, function (err, tournament) {
    //       if (err || !tournament) {
    //         // cb({success: false, info: "No tournament room found"});
    //         cb({ success: false, isRetry: false, isDisplay: true, info: popupTextManager.falseMessages.DBGETTOURNAMENTROOMFAIL_TOURNAMENT, channelId: "" });
    //       } else {
    //         cb({ success: true, isTournamentRunning: tournament.isTournamentRunning, enrolledPlayer: tournament.enrolledPlayer })
    //       }
    //     });
    //   }
    /*==============================  END  ==========================*/

    /*==============================  START  ==========================*/
    // tournament

    //   New
    async countCurrentPlayers(params: any): Promise<any> {

        const channelId = params.channelId.toString();

        try {
            const channel = await this.db.findTableById(channelId);

            if (!channel || channel.channelType === stateOfX.gameType.normal) {
                console.log(stateOfX.serverLogType.info, "Change Tournament state failed,  No channel found or NORMAL game is running !");
                return { success: false };
            }


            const tournamentId = channel.tournament.tournamentId.toString();

            const channels = await this.imdb.findChannels({ tournamentId });


            let playingPlayers = 0;
            let playerIds: string[] = [];
            let allPlayers: any[] = [];

            for (let i = 0; i < channels.length; i++) {

                allPlayers = allPlayers.concat(channels[i].players);

                const playingPlayerList = _.where(channels[i].players, { state: stateOfX.playerState.playing });
                const waitingPlayerList = _.where(channels[i].players, { state: stateOfX.playerState.waiting });


                playingPlayers += playingPlayerList.length + waitingPlayerList.length;

                playerIds = _.pluck(playingPlayerList, "playerId");
            }


            if (playingPlayers === 1) {
                playerIds = _.pluck(allPlayers, "playerId");
            }

            return {
                success: true,
                playersCount: playingPlayers,
                tournamentId,
                channels,
                playerIds,
            };
        } catch (err) {
            console.log(stateOfX.serverLogType.info, "Error in changeStateOfTournament logic", err);
            return { success: false };
        }
    };

    //   Old
    //   const countCurrentPlayers = function (params, cb) {
    //     console.log(stateOfX.serverLogType.info, "channelId is in change state of tornament is  ", params.channelId);
    //     channelId = params.channelId.toString();
    //     db.findTableById(channelId, function (err, channel) {
    //       if (err || !channel || channel.channelType === stateOfX.gameType.normal) {
    //         console.log(stateOfX.serverLogType.info, "Change Tournament state failed,  No channel found or NORMAL game is running !", err);
    //         cb({ success: false });
    //       } else {
    //         console.log(stateOfX.serverLogType.info, "channel in changeStateOfTournament is - ", JSON.stringify(channel));
    //         var tournamentId = (channel.tournament.tournamentId).toString();
    //         console.log(stateOfX.serverLogType.info, "tournament ID is in changeStateOfTournament -", tournamentId);
    //         imdb.findChannels({ tournamentId: tournamentId }, function (err, channels) {
    //           console.log(stateOfX.serverLogType.info, "channels is getting players in changeStateOfTournament is - " + JSON.stringify(channels));
    //           if (err) {
    //             console.log(stateOfX.serverLogType.info, "Error in getting channels from db in changeStateOfTournament in changeStateOfTournament");
    //             cb({ success: false })
    //           } else {
    //             var playingPlayers = 0;
    //             var playerIds = [];
    //             var allPlayers = [];
    //             for (var i = 0; i < channels.length; i++) {

    //               console.log(stateOfX.serverLogType.info, "current channel is - " + JSON.stringify(channels[i]));
    //               allPlayers = allPlayers.concat(channels[i].players);
    //               var playingPlayerList = _.where(channels[i].players, { state: stateOfX.playerState.playing });
    //               var waitingPlayerList = _.where(channels[i].players, { state: stateOfX.playerState.waiting });
    //               console.log(stateOfX.serverLogType.info, "waiting playerList - " + JSON.stringify(waitingPlayerList));
    //               console.log(stateOfX.serverLogType.info, "playingPlayerList playerList - " + JSON.stringify(playingPlayerList));
    //               playingPlayers = playingPlayers + playingPlayerList.length + waitingPlayerList.length;

    //               console.log(stateOfX.serverLogType.info, "playing players - " + JSON.stringify(playingPlayerList));
    //               playerIds = _.pluck(playingPlayerList, "playerId");
    //               console.log(stateOfX.serverLogType.info, playerIds);
    //             }
    //             console.log(stateOfX.serverLogType.info, "playingPlayers is in getPlayingPlayers on changeStateOfTournament is " + playingPlayers);
    //             if (playingPlayers === 1) {
    //               playerIds = _.pluck(allPlayers, "playerId");
    //             }
    //             cb({ success: true, playersCount: playingPlayers, tournamentId: tournamentId, channels: channels, playerIds: playerIds });
    //           }
    //         })
    //       }
    //     })
    //   }
    /*==============================  END  ==========================*/


    /*==============================  START  ==========================*/
    // Fire round over broadcast if required after Game start cases

    //   New
    async fireGameStartRoundOverBroadcast(params: any, handleGameStartResponse: any): Promise<void> {
        if (handleGameStartResponse.isRoundOver) {
            console.log(stateOfX.serverLogType.info, 'About to fire Round over broadcast on Game start');

            handleGameStartResponse.round.channel = params.channel;

            await this.broadcastHandler.fireRoundOverBroadcast(handleGameStartResponse.round);

            // channelTimerHandler.killChannelTurnTimer({channel: params.channel});
        }
    };

    //   Old
    //   const fireGameStartRoundOverBroadcast = function (params, handleGameStartResponse) {
    //     if (handleGameStartResponse.isRoundOver) {
    //       serverLog(stateOfX.serverLogType.info, 'About to fire Round over broadcast on Game start')
    //       // handleGameStartResponse.round.self = params.self;
    //       handleGameStartResponse.round.channel = params.channel;
    //       broadcastHandler.fireRoundOverBroadcast(handleGameStartResponse.round);
    //       // channelTimerHandler.killChannelTurnTimer({channel: params.channel});
    //     }
    //   }
    /*==============================  END  ==========================*/

    /*==============================  START  ==========================*/
    // Fire Game over broadcast if required after Game start cases

    //   New
    async fireGameStartGameOverBroadcast(params: any, handleGameStartResponse: any, table: any): Promise<any> {
        if (handleGameStartResponse.isGameOver) {

            if (params.channel.channelType !== stateOfX.gameType.normal) {
                await this.startTournamentHandler.eliminationProcess(params.self, table);
            }

            if (!handleGameStartResponse.isGameOver) {
                await this.channelTimerHandler.startTurnTimeOut(params);
            } else {
                console.log(
                    stateOfX.serverLogType.error,
                    'Not starting channel turn timer and resetting previous ones as Game is over now, ON GAME START OVER!'
                );
                await this.channelTimerHandler.killChannelTurnTimer({ channel: params.channel });
            }

            await this.actionLogger.createEventLog({
                session: params.session,
                channel: params.channel,
                data: {
                    channelId: params.channelId,
                    eventName: stateOfX.logEvents.gameOver,
                    rawData: _.omit(handleGameStartResponse.over, 'self', 'session', 'channel'),
                },
            });

            setTimeout(async () => {
                await this.actionLogger.createEventLog({
                    session: params.session,
                    channel: params.channel,
                    data: {
                        channelId: params.channelId,
                        eventName: stateOfX.logEvents.summary,
                        rawData: _.omit(handleGameStartResponse.over, 'self', 'session', 'channel'),
                    },
                });
            }, Number(systemConfig.recordSummaryAfterGameOver) * 1000);

            handleGameStartResponse.over.channel = params.channel;
            handleGameStartResponse.over.session = params.session;

            const extraDelay = 2;

            setTimeout(async () => {
                await this.broadcastHandler.fireGameOverBroadcast(handleGameStartResponse.over);
            }, extraDelay * 1000);

            console.log('Time Delay in Game Start', systemConfig.deleayInGames + extraDelay);

            setTimeout(async () => {
                await this.startGame({
                    session: params.session,
                    channelId: params.channelId,
                    channel: params.channel,
                    eventName: stateOfX.startGameEvent.gameOver,
                });
            }, (systemConfig.deleayInGames + extraDelay) * 1000);
        }
    };

    //   Old
    // const fireGameStartGameOverBroadcast = function (params, handleGameStartResponse, table) {
    //     if (handleGameStartResponse.isGameOver) {
    //         serverLog(stateOfX.serverLogType.info, 'About to fire Game over broadcast on Game start');
    //         if (params.channel.channelType !== stateOfX.gameType.normal) {
    //             startTournamentHandler.eliminationProcess(params.self, table);
    //         }

    //         // Kill chennel level timer for player turn as Game is over
    //         if (!handleGameStartResponse.isGameOver) {
    //             channelTimerHandler.startTurnTimeOut(params);
    //         } else {
    //             serverLog(stateOfX.serverLogType.error, 'Not starting channel turn timer and resetting previous ones as Game is over now, ON GAME START OVER!');
    //             channelTimerHandler.killChannelTurnTimer({ channel: params.channel });
    //         }

    //         serverLog(stateOfX.serverLogType.info, 'Keys in Game over initial level over - ' + JSON.stringify(_.keys(handleGameStartResponse.over)));
    //         serverLog(stateOfX.serverLogType.info, 'Keys in Game over initial level over.data - ' + JSON.stringify(_.keys(handleGameStartResponse.over.data)));
    //         actionLogger.createEventLog({ session: params.session, channel: params.channel, data: { channelId: params.channelId, eventName: stateOfX.logEvents.gameOver, rawData: _.omit(handleGameStartResponse.over, 'self', 'session', 'channel') } });
    //         setTimeout(function () {
    //             actionLogger.createEventLog({ session: params.session, channel: params.channel, data: { channelId: params.channelId, eventName: stateOfX.logEvents.summary, rawData: _.omit(handleGameStartResponse.over, 'self', 'session', 'channel') } });
    //         }, parseInt(systemConfig.recordSummaryAfterGameOver) * 1000);

    //         // handleGameStartResponse.over.self    = params.self;
    //         handleGameStartResponse.over.channel = params.channel;
    //         handleGameStartResponse.over.session = params.session;
    //         var extraDelay = 2;
    //         setTimeout(function () {
    //             broadcastHandler.fireGameOverBroadcast(handleGameStartResponse.over);
    //         }, extraDelay * 1000);
    //         console.log('Time Delay in Game Start', systemConfig.deleayInGames + extraDelay)
    //         setTimeout(function () {
    //             startGameHandler.startGame({ session: params.session, channelId: params.channelId, channel: params.channel, eventName: stateOfX.startGameEvent.gameOver });
    //         }, (systemConfig.deleayInGames + extraDelay) * 1000)
    //     }
    // }
    /*==============================  END  ==========================*/

    /*==============================  START  ==========================*/
    // ### Handle exceptional behavior - check for blinds allin

    // New
    async handleAdditionalCases(params: any): Promise<void> {
        try {
            const validated = await validateKeySets("Request", "connector", "handleAdditionalCases", params);
            if (validated.success) {

                // Pomelo Connection
                const processCasesResponse = await pomelo.app.rpc.database.tableRemote.processCases(
                    params.session,
                    { serverType: "connector", channelId: params.channelId }
                );
                // Pomelo Connection

                if (processCasesResponse.success) {
                    // Handle if there are ALLIN turn occur during game start
                    this.fireGameStartTurnBroadcast(params, processCasesResponse.data.overResponse);

                    // Broadcast round over data if the Round is Over
                    this.fireGameStartRoundOverBroadcast(params, processCasesResponse.data.overResponse);

                    // Handle if Game Over occur due to ALLIN occur on game start
                    this.fireGameStartGameOverBroadcast(params, processCasesResponse.data.overResponse, processCasesResponse.table);
                } else {
                    console.log(stateOfX.serverLogType.error, 'processCasesResponse . ' + JSON.stringify(processCasesResponse));
                }
            } else {
                console.log(stateOfX.serverLogType.error, 'Key validation failed in handleAdditionalCases - ' + JSON.stringify(validated));
            }
        } catch (err) {
            console.log(stateOfX.serverLogType.error, 'Error in handleAdditionalCases - ' + JSON.stringify(err));
        }
    };


    // Old
    // const handleAdditionalCases = function (params) {
    //     keyValidator.validateKeySets("Request", "connector", "handleAdditionalCases", params, function (validated) {
    //         if (validated.success) {
    //             pomelo.app.rpc.database.tableRemote.processCases(params.session, { serverType: "connector", channelId: params.channelId }, function (processCasesResponse) {
    //                 serverLog(stateOfX.serverLogType.info, 'processCasesResponse ------> ' + JSON.stringify(processCasesResponse))
    //                 if (processCasesResponse.success) {
    //                     // Handle if there are ALLIN turn occur during game start
    //                     fireGameStartTurnBroadcast(params, processCasesResponse.data.overResponse);

    //                     // Broadcast round over data if the Round is Over
    //                     fireGameStartRoundOverBroadcast(params, processCasesResponse.data.overResponse);

    //                     // Handle if Game Over occur due to ALLIN occur on game start
    //                     fireGameStartGameOverBroadcast(params, processCasesResponse.data.overResponse, processCasesResponse.table);
    //                 } else {
    //                     serverLog(stateOfX.serverLogType.error, 'processCasesResponse . ' + JSON.stringify(processCasesResponse))
    //                 }
    //             });
    //         } else {
    //             serverLog(stateOfX.serverLogType.error, 'Key validation failed in handleAdditionalCases - ' + JSON.stringify(validated))
    //         }
    //     });
    // }
    /*==============================  END  ==========================*/


    /*==============================  START  ==========================*/
    // sending broadcast to channels when all channels is on break
    // tournament

    // New
    sendBroadcastForBreakTimer(params: any, breakDuration: number): void {
        for (let channelIt = 0; channelIt < params.allChannels.length; channelIt++) {
            const channelId = params.allChannels[channelIt];
            const channel = pomelo.app.get('channelService').getChannel(channelId, false); // Use false to get existing channel only
            this.broadcastHandler.sendBroadcastForBreakTimer({
                channel: channel,
                breakTime: breakDuration,
                channelId: channelId
            });
        }
    };

    // Old
    // const sendBroadcastForBreakTimer = function (params, breakDuration) {
    //     console.log("in send broadcastForBreakTimer - ", params.allChannels);
    //     for (var channelIt = 0; channelIt < params.allChannels.length; channelIt++) {
    //         var channel = pomelo.app.get('channelService').getChannel(params.allChannels[channelIt], false);//Added for channel is already present
    //         broadcastHandler.sendBroadcastForBreakTimer({ channel: channel, breakTime: breakDuration, channelId: params.allChannels[channelIt] });
    //     }
    // }
    /*==============================  END  ==========================*/

    /*==============================  Start  ==========================*/
    // start the game of all the channels after break
    // tournament

    // New
    scheduleNextGameStart(params: any, gameResumeTime: Date, breakLevel: number): void {

        const channelsArray = params.allChannels.map((channelId: string) => ({ channelId }));

        schedule.scheduleJob(gameResumeTime, async () => {

            for (const channel of channelsArray) {
                try {
                    const result = await this.imdb.updateSeats(channel.channelId, {
                        isOnBreak: false,
                        isAddOnLive: false,
                        breakLevel: breakLevel + 1,
                        isBreakTimerStart: false
                    });


                    // Pomelo Connection
                    let foundChannel = pomelo.app.get('channelService').getChannel(channel.channelId, false);
                    const newChannel = pomelo.app.get('channelService').getChannel(channel.channelId, true);
                    // Pomelo Connection

                    if (!foundChannel) foundChannel = newChannel;

                    if (foundChannel) {
                        foundChannel.gameStartEventSet = stateOfX.startGameEventOnChannel.idle;
                        foundChannel.gameStartEventName = null;
                    }

                    const paramsData = {
                        self: params.self,
                        session: params.session,
                        channelId: channel.channelId,
                        channel: foundChannel,
                        eventName:
                            params.eventName === stateOfX.startGameEvent.handAfterBreak
                                ? stateOfX.startGameEvent.handAfterBreak
                                : stateOfX.startGameEvent.tournamentAfterBreak
                    };

                    console.log(stateOfX.serverLogType.info, "GOING TO START GAME --------");
                    console.log(stateOfX.serverLogType.info, "GOING TO START GAME --------", gameResumeTime, Date.now());

                    await this.startGame(paramsData);

                } catch (err) {
                    console.log(stateOfX.serverLogType.info, "Error in scheduleNextGameStart for channel " + channel.channelId, err);
                }
            }
        });
    };


    // Old
    // const scheduleNextGameStart = function (params, gameResumeTime, breakLevel) {
    //     console.log("params.tournamentId is in scheduleNextGameStart - ", params, gameResumeTime, breakLevel);
    //     console.log("game resume time is - ", new Date(gameResumeTime));
    //     //prepare collection for async operation
    //     var channelsArray = [];
    //     for (var channelIt = 0; channelIt < params.allChannels.length; channelIt++) {
    //         channelsArray.push({
    //             channelId: params.allChannels[channelIt]
    //         })
    //     }
    //     console.log("allChannels is in scheduleNextGameStart - ", channelsArray);

    //     schedule.scheduleJob(gameResumeTime, function () {
    //         console.log("inside schedule to check")
    //         async.eachSeries(channelsArray, function (channel, callback) {
    //             //update the breakLevel and set the isOnBreak key to false after the current break is over
    //             imdb.updateSeats(channel.channelId, { isOnBreak: false, isAddOnLive: false, breakLevel: (breakLevel + 1), isBreakTimerStart: false }, function (err, result) {
    //                 console.log("in updateSeats of scheduleNextGameStart", err, result);
    //                 if (err) {
    //                     console.log(stateOfX.serverLogType.info + "Error in updating isOnBreak key");
    //                 } else {
    //                     let foundChannel = pomelo.app.get('channelService').getChannel(channel.channelId, false);
    //                     let newChannel = pomelo.app.get('channelService').getChannel(channel.channelId, true);
    //                     if (!foundChannel) foundChannel = newChannel
    //                     if (!!foundChannel) {
    //                         foundChannel.gameStartEventSet = stateOfX.startGameEventOnChannel.idle;
    //                         foundChannel.gameStartEventName = null;
    //                     }
    //                     var paramsData = {
    //                         self: params.self,
    //                         session: params.session,
    //                         channelId: channel.channelId,
    //                         channel: foundChannel,
    //                         eventName: params.eventName == stateOfX.startGameEvent.handAfterBreak ? stateOfX.startGameEvent.handAfterBreak : stateOfX.startGameEvent.tournamentAfterBreak
    //                     }
    //                     console.log(stateOfX.serverLogType.info, "GOING TO START GAME --------");
    //                     console.log(stateOfX.serverLogType.info, "GOING TO START GAME --------", gameResumeTime, Date.now());
    //                     startGameHandler.startGame(paramsData);
    //                     callback();
    //                 }
    //             })
    //         }, function (err) {
    //             console.log(stateOfX.serverLogType.info, "error in scheduleNextGameStart is  - " + err);
    //         })
    //     })
    // }
    /*==============================  END  ==========================*/

    /*==============================  START  ==========================*/
    // Intialize params that will be used during calculation

    // New
    initializeParams(params: any): Promise<any> {
        params.data = {};
        params.removedPlayerList = [];
        params.data.startGame = false;
        params.data.deductBlindsResponse = null;
        params.data.players = [];
        params.data.tableDetails = null;
        
        return params;
    }
    

    // Old
    // const initializeParams = function (params, cb) {
    //     params.data = {};
    //     params.removedPlayerList = [];
    //     params.data.startGame = false;
    //     params.data.deductBlindsResponse = null;
    //     params.data.players = [];
    //     params.data.tableDetails = null;
    //     serverLog(stateOfX.serverLogType.info, "params keys in  initializeParams - " + _.keys(params));
    //     console.log('Inside initialize params: ', params.data.players);
    //     cb(null, params);
    // }
    /*==============================  END  ==========================*/

    /*==============================  START  ==========================*/
    // ### Validate if a game start event is already set on channel leve
    // If yes then skip start game process from current event
    // If not then set start event on channel level
    // If Game will not start then reset start event on channel level

    // New
    checkGameStartOnChannelLevel(params: any): Promise<any> {
    
        if (!params.channel) {
            console.log("inside 1", params.channel);
            throw {
                success: false,
                isRetry: false,
                isDisplay: false,
                channelId: params.channelId || "",
                info: popupTextManager.falseMessages.CHECKGAMESTARTONCHANNELLEVEL_CHANNELMISSINGFAIL_STARTGAMEHANDLER
            };
        }
    
        if (
            params.eventName !== stateOfX.startGameEvent.gameOver &&
            params.channel.gameStartEventSet !== stateOfX.startGameEventOnChannel.idle
        ) {
            console.log("inside 2", params.eventName !== stateOfX.startGameEvent.gameOver);
            throw {
                success: false,
                isRetry: false,
                isDisplay: false,
                channelId: params.channelId || "",
                info: popupTextManager.falseMessages.CHECKGAMESTARTONCHANNELLEVEL_GAMEALREADYSETFAIL_STARTGAMEHANDLER
            };
        }
    
        params.channel.gameStartEventSet = stateOfX.startGameEventOnChannel.starting;
        params.channel.gameStartEventName = params.eventName;
        return params;
    };
    

    // Old
    // const checkGameStartOnChannelLevel = function (params, cb) {
    //     console.log("inside checkGameStartOnChannelLevel", params)
    //     serverLog(stateOfX.serverLogType.info, "params keys in  checkGameStartOnChannelLevel - " + _.keys(params));
    //     //  serverLog(stateOfX.serverLogType.info,'startGameHandler params.channel', params.channel)
    //     if (!params.channel) {
    //         console.log("inside 1", params.channel)
    //         cb({ success: false, isRetry: false, isDisplay: false, channelId: (params.channelId || ""), info: popupTextManager.falseMessages.CHECKGAMESTARTONCHANNELLEVEL_CHANNELMISSINGFAIL_STARTGAMEHANDLER });
    //         //cb({success: false, channelId: params.channelId, info: "Channel missing while starting game!"});
    //         return false;
    //     }

    //     // Validate if game start event not already set for this channel
    //     if ((params.eventName !== stateOfX.startGameEvent.gameOver) && params.channel.gameStartEventSet !== stateOfX.startGameEventOnChannel.idle) {
    //         console.log("inside 2", params.eventName !== stateOfX.startGameEvent.gameOver)
    //         cb({ success: false, isRetry: false, isDisplay: false, channelId: (params.channelId || ""), info: popupTextManager.falseMessages.CHECKGAMESTARTONCHANNELLEVEL_GAMEALREADYSETFAIL_STARTGAMEHANDLER });
    //         //cb({success: false, channelId: params.channelId, info: "A game start event already set for this channel!"});
    //         return false;
    //     }
    //     // DOUBT
    //     else {
    //         params.channel.gameStartEventSet = stateOfX.startGameEventOnChannel.starting;
    //         params.channel.gameStartEventName = params.eventName;
    //         cb(null, params);
    //     }
    // }
    /*==============================  END  ==========================*/

    /*==============================  START  ==========================*/
    //breakManagement
    // tournament

    // New
    async breakManagement(params: any): Promise<any> {
        if (params.channel.channelType !== stateOfX.gameType.normal) {

            // Pomelo Connection
            const breakManagementResponse = await new Promise<any>((resolve, reject) => {
                pomelo.app.rpc.database.breakManagement.process(
                    params.session,
                    { channelId: params.channelId },
                    (response: any) => resolve(response)
                );
            });
            // Pomelo Connection
    
    
            if (breakManagementResponse.success) {
                if (!breakManagementResponse.eligibleForBreak) {
                    return params;
                } else {
                    // Send broadcast to channel for break
                    this.broadcastHandler.sendBroadcastForBreakTimer(params);
    
                    // Reset channel state
                    params.channel.gameStartEventSet = stateOfX.startGameEventOnChannel.idle;
                    params.channel.gameStartEventName = null;
    
                    if (breakManagementResponse.isTimeToStartBreakTimer) {
                        params.allChannels = breakManagementResponse.allChannels;
                        params.tournamentBreakDuration = breakManagementResponse.channelDetails.tournamentBreakDuration;
                        this.sendBroadcastForBreakTimer(params, breakManagementResponse.breakDuration);
                        params.tournamentId = breakManagementResponse.channelDetails.tournamentRules.tournamentId;
                        this.scheduleNextGameStart(params, breakManagementResponse.gameResumeTime, breakManagementResponse.breakLevel);
                    }
    
                    throw {
                        success: false,
                        isRetry: false,
                        isDisplay: true,
                        channelId: params.channelId || "",
                        info: popupTextManager.falseMessages.CHECKBREAKMANAGEMENTFAIL_STARTGAMEHANDLER
                    };
                }
            } else {
                throw breakManagementResponse;
            }
        } else {
            console.log(stateOfX.serverLogType.info, 'Skipping break management as channel is for - ' + params.channel.channelType + ' table game.');
            return params;
        }
    };
    

    // Old
    // const breakManagement = function (params, cb) {
    //     if (params.channel.channelType !== stateOfX.gameType.normal) {
    //         pomelo.app.rpc.database.breakManagement.process(params.session, { channelId: params.channelId }, function (breakManagementResponse) {
    //             console.log(stateOfX.serverLogType.info, "breakManagementResponse is - " + JSON.stringify(breakManagementResponse));
    //             if (breakManagementResponse.success) {
    //                 //No need to give break
    //                 if (!breakManagementResponse.eligibleForBreak) {
    //                     cb(null, params);
    //                 } else {
    //                     //channel is eligible for break
    //                     // send broadcast to channel for break
    //                     broadcastHandler.sendBroadcastForBreakTimer(params);

    //                     // set channel status as idle for again game start after break;
    //                     params.channel.gameStartEventSet = stateOfX.startGameEventOnChannel.idle;
    //                     params.channel.gameStartEventName = null;

    //                     if (breakManagementResponse.isTimeToStartBreakTimer) {
    //                         //send broadcast to all channels for timertournament
    //                         // start timer for break;
    //                         params.allChannels = breakManagementResponse.allChannels;
    //                         params.tournamentBreakDuration = breakManagementResponse.channelDetails.tournamentBreakDuration;
    //                         sendBroadcastForBreakTimer(params, breakManagementResponse.breakDuration);
    //                         params.tournamentId = breakManagementResponse.channelDetails.tournamentRules.tournamentId;
    //                         scheduleNextGameStart(params, breakManagementResponse.gameResumeTime, breakManagementResponse.breakLevel);
    //                     }
    //                     cb({ success: false, isRetry: false, isDisplay: true, channelId: (params.channelId || ""), info: popupTextManager.falseMessages.CHECKBREAKMANAGEMENTFAIL_STARTGAMEHANDLER });
    //                 }
    //             } else {
    //                 cb(breakManagementResponse);
    //             }
    //         });
    //     } else {
    //         serverLog(stateOfX.serverLogType.info, 'Skipping break management as channel is for - ' + params.channel.channelType + ' table game.');
    //         cb(null, params);
    //     }
    // }
    /*==============================  END  ==========================*/

    /*==============================  START  ==========================*/

    // New
    async bubbleManagement(params: any): Promise<any> {
    
        if (params.channel.channelType !== stateOfX.gameType.normal) {

            // Pomelo Connection
            const handInHandRes = await new Promise<any>((resolve) => {
                pomelo.app.rpc.database.handInHandManagement.process(
                    params.session,
                    { channelId: params.channelId, eventName: params.eventName },
                    (response: any) => resolve(response)
                );
            });
            // Pomelo Connection

    
            if (handInHandRes.success && handInHandRes.isEligibleForHadToHad) {
                // Yes, stop next hand, send broadcast to channel for break
                this.broadcastHandler.sendBroadcastForHandBreak(params);
                throw {
                    success: false,
                    isRetry: false,
                    isDisplay: true,
                    channelId: (params.channelId || ""),
                    info: "Hands are on break, will start game after some time"
                };
            } else if (handInHandRes.success && handInHandRes.shouldStartNow) {
                // Game will resume on all channels
                params.allChannels = handInHandRes.allChannels;
                params.tournamentId = handInHandRes.tournamentId;
                params.channel.gameStartEventSet = stateOfX.startGameEventOnChannel.idle;
                params.channel.gameStartEventName = null;
                params.eventName = stateOfX.startGameEvent.handAfterBreak;
                this.scheduleNextGameStart(params, handInHandRes.gameResumeTime, handInHandRes.breakLevel);
    
                throw {
                    success: false,
                    isRetry: false,
                    isDisplay: true,
                    channelId: (params.channelId || ""),
                    info: "Scheduled the game start"
                };
            } else {
                return params;
            }
        } else {
            return params;
        }
    };
    

    // Old
    // const bubbleManagement = function (params, cb) {
    //     console.log("inside bubbleManagement 382 ", params)
    //     if (params.channel.channelType !== stateOfX.gameType.normal) {
    //         pomelo.app.rpc.database.handInHandManagement.process(params.session, { channelId: params.channelId, eventName: params.eventName }, function (handInHandRes) {
    //             if (handInHandRes.success && handInHandRes.isEligibleForHadToHad) {
    //                 //yes stop next hand
    //                 // send broadcast to channel for break
    //                 broadcastHandler.sendBroadcastForHandBreak(params);
    //                 cb({ success: false, isRetry: false, isDisplay: true, channelId: (params.channelId || ""), info: "Hands are on break, will start game after some time" });
    //             }
    //             else if (handInHandRes.success && handInHandRes.shouldStartNow) {
    //                 //game will resume on all channels
    //                 params.allChannels = handInHandRes.allChannels;
    //                 params.tournamentId = handInHandRes.tournamentId;
    //                 params.channel.gameStartEventSet = stateOfX.startGameEventOnChannel.idle;
    //                 params.channel.gameStartEventName = null;
    //                 params.eventName = stateOfX.startGameEvent.handAfterBreak;
    //                 scheduleNextGameStart(params, handInHandRes.gameResumeTime, handInHandRes.breakLevel);
    //                 cb({ success: false, isRetry: false, isDisplay: true, channelId: (params.channelId || ""), info: "Scheduled the game start" });
    //             }
    //             else {
    //                 cb(null, params);
    //             }
    //         })
    //     } else {
    //         cb(null, params);
    //     }
    // }
    /*==============================  END  ==========================*/

    /*==============================  START  ==========================*/
    //addOnManagement

    // New
    async addOnManagement(params: any): Promise<any> {
    
        if (params.channel.channelType !== stateOfX.gameType.normal) {
            console.log(stateOfX.serverLogType.info, 'current channelId is  - ' + params.channelId);
            let tournamentIdFromChannel = params.channelId.replace(/-\d+$/, '');
            console.log("tournamentIdFromChannel", tournamentIdFromChannel);
    
            const tournament = await this.db.getTournamentRoom(tournamentIdFromChannel);
    
            params.tournamentDetails = tournament;
    
            if (params.tournamentDetails.tournamentType !== stateOfX.tournamentType.sitNGo) {

                // Pomelo Connection
                const addonManagementResponse = await new Promise<any>((resolve) => {
                    pomelo.app.rpc.database.addonManagement.process(
                        params.session,
                        { channelId: params.channelId },
                        (response: any) => resolve(response)
                    );
                });
                // Pomelo Connection
    
    
                if (addonManagementResponse.success) {
                    if (!addonManagementResponse.eligibleForAddon) {
                        console.log("Not eligible for addOn");
                        return params;
                    } else {
    
                        this.broadcastHandler.fireBroadcastForAddon({
                            route: "addonTimeStarts",
                            channelId: params.channelId,
                            data: addonManagementResponse.AddOnData,
                            info: "Addon time started"
                        });
    
                        schedule.scheduleJob(addonManagementResponse.gameResumeTime, function () {
                            this.broadcastHandler.fireBroadcastForAddon({
                                route: "addonTimeEnds",
                                channelId: params.channelId,
                                data: {},
                                info: "Addon time ended"
                            });
                        });
    
                        params.channel.gameStartEventSet = stateOfX.startGameEventOnChannel.idle;
                        params.channel.gameStartEventName = null;
    
                        if (addonManagementResponse.isTimeToStartBreakTimer) {

                            params.allChannels = addonManagementResponse.allChannels;
                            params.tournamentBreakDuration = addonManagementResponse.channelDetails.tournamentBreakDuration;

                            this.sendBroadcastForBreakTimer(params, addonManagementResponse.breakDuration);
                            params.tournamentId = addonManagementResponse.channelDetails.tournamentRules.tournamentId;
                            params.gameVersionCount = addonManagementResponse.channelDetails.gameVersionCount;
                            this.scheduleNextGameStart(params, addonManagementResponse.gameResumeTime, addonManagementResponse.breakLevel);
                        }
    
                        throw {
                            success: false,
                            isRetry: false,
                            isDisplay: true,
                            channelId: (params.channelId || ""),
                            info: popupTextManager.falseMessages.CHECKBREAKMANAGEMENTFAIL_STARTGAMEHANDLER
                        };
                    }
                } else {
                    throw addonManagementResponse;
                }
            } else {
                return params;
            }
        } else {
            console.log(stateOfX.serverLogType.info, 'Skipping addOnManagement as channel is for - ' + params.channel.channelType + ' table game.');
            return params;
        }
    };
    
    // Old
    // const addOnManagement = function (params, cb) {
    //     console.log("inside addOnManagement 455 ", params)
    //     if (params.channel.channelType !== stateOfX.gameType.normal) {
    //         console.log(stateOfX.serverLogType.info, 'current channelId is  - ' + params.channelId);
    //         let tournamentIdFromChannel = params.channelId.replace(/-\d+$/, '');
    //         console.log("tournamentIdFromChannel", tournamentIdFromChannel)
    //         db.getTournamentRoom(tournamentIdFromChannel, function (err, tournament) {
    //             console.log("got this tournament addOnManagementaddOnManagement", err, tournament)
    //             params.tournamentDetails = tournament;
    //             if (params.tournamentDetails.tournamentType !== stateOfX.tournamentType.sitNGo) {
    //                 pomelo.app.rpc.database.addonManagement.process(params.session, { channelId: params.channelId }, function (addonManagementResponse) {
    //                     console.log("addonManagementResponse is - ", addonManagementResponse.breakDuration);
    //                     if (addonManagementResponse.success) {
    //                         //No need to give addOn
    //                         if (!addonManagementResponse.eligibleForAddon) {
    //                             console.log("Not eligible for addOn");
    //                             cb(null, params);
    //                         } else {
    //                             //channel is eligible for addOn
    //                             console.log("Channel is eligible for break");
    //                             broadcastHandler.fireBroadcastForAddon({ route: "addonTimeStarts", channelId: params.channelId, data: addonManagementResponse.AddOnData, info: "Addon time started" });
    //                             schedule.scheduleJob(addonManagementResponse.gameResumeTime, function () {
    //                                 console.log('right time to schedule addOn broadcast');
    //                                 broadcastHandler.fireBroadcastForAddon({ route: "addonTimeEnds", channelId: params.channelId, data: {}, info: "Addon time ended" });
    //                             });
    //                             // set channel status as idle for again game start after break;
    //                             params.channel.gameStartEventSet = stateOfX.startGameEventOnChannel.idle;
    //                             params.channel.gameStartEventName = null;

    //                             if (addonManagementResponse.isTimeToStartBreakTimer) {
    //                                 //send broadcast to all channels for timertournament
    //                                 // start timer for break;
    //                                 console.log("All Channels are eligible for break");
    //                                 params.allChannels = addonManagementResponse.allChannels;
    //                                 params.tournamentBreakDuration = addonManagementResponse.channelDetails.tournamentBreakDuration;
    //                                 console.log("Tournament break duration: ", params.tournamentBreakDuration);
    //                                 sendBroadcastForBreakTimer(params, addonManagementResponse.breakDuration);
    //                                 params.tournamentId = addonManagementResponse.channelDetails.tournamentRules.tournamentId;
    //                                 params.gameVersionCount = addonManagementResponse.channelDetails.gameVersionCount;
    //                                 scheduleNextGameStart(params, addonManagementResponse.gameResumeTime, addonManagementResponse.breakLevel);
    //                             }
    //                             cb({ success: false, isRetry: false, isDisplay: true, channelId: (params.channelId || ""), info: popupTextManager.falseMessages.CHECKBREAKMANAGEMENTFAIL_STARTGAMEHANDLER });
    //                             //cb({success: false, channelId: params.channelId, info: "Time to take a break for this tournament."});
    //                         }
    //                     } else {
    //                         cb(addonManagementResponse);
    //                     }
    //                 });
    //             }
    //             else {
    //                 cb(null, params);
    //             }
    //         })
    //     } else {
    //         serverLog(stateOfX.serverLogType.info, 'Skipping addOnManagement as channel is for - ' + params.channel.channelType + ' table game.');
    //         cb(null, params);
    //     }
    // }
    /*==============================  END  ==========================*/


    /*==============================  START  ==========================*/
    // Decides next game starts for satellite management
    // tournament

    // New
    async satelliteManagement(params: any): Promise<any> {
        if (params.channel.channelType === stateOfX.gameType.tournament && params.table.tournamentType === stateOfX.tournamentType.satelite) {

            const getTournamentRoomResponse = await this.getTournamentRoom(params.table.tournamentRules.tournamentId);
        
            if (getTournamentRoomResponse.success) {
                if (params.channel.channelType === stateOfX.gameType.tournament && params.table.tournamentType === stateOfX.tournamentType.satelite && !getTournamentRoomResponse.isTournamentRunning) {
                    if (params.table.isTournamentRunning) {
                        // calling calculateRanks
                        const calculateRanksResponse = await this.calculateRanks.manageRanksForNormalTournament({ table: params.table }, params.table.players);
    
    
                        if (calculateRanksResponse.success) {
                            this.startTournamentHandler.eliminationProcess(params.self, calculateRanksResponse.result.table);
                        }
                    }
    
                    return { success: false, info: "Satellite tournament for this channel is over", isRetry: false, isDisplay: false, channelId: "" };
                }
            } else {
                return getTournamentRoomResponse;
            }
        } else {
            console.log(stateOfX.serverLogType.info, 'This is not a satellite tournament so skipping satellite management');
            return params;
        }
    };
    

    // Old
    // const satelliteManagement = function (params, cb) {
    //     if (params.channel.channelType === stateOfX.gameType.tournament && params.table.tournamentType === stateOfX.tournamentType.satelite) {
    //         serverLog(stateOfX.serverLogType.info, "In satelliteManagement table is - " + JSON.stringify(params.table));
    //         serverLog(stateOfX.serverLogType.info, "In satelliteManagement channelId is - " + params.channelId);
    //         serverLog(stateOfX.serverLogType.info, "In satelliteManagement channelType is - " + params.channel.channelType);
    //         serverLog(stateOfX.serverLogType.info, "In satelliteManagement tournamentType is - " + params.table.tournamentType);
    //         serverLog(stateOfX.serverLogType.info, "In satelliteManagement isTournamentRunning is  - " + params.table.tournamentRules.tournamentId);
    //         getTournamentRoom(params.table.tournamentRules.tournamentId, function (getTournamentRoomResponse) {
    //             console.log("getTournamentRoomResponse in satellitemnagement is - ", getTournamentRoomResponse);
    //             if (getTournamentRoomResponse.success) {
    //                 if (params.channel.channelType === stateOfX.gameType.tournament && params.table.tournamentType === stateOfX.tournamentType.satelite && !getTournamentRoomResponse.isTournamentRunning) {
    //                     if (params.table.isTournamentRunning) {
    //                         //calling calculateRanks
    //                         calculateRanks.manageRanksForNormalTournament({ table: params.table }, params.table.players, function (calculateRanksResponse) {
    //                             serverLog(stateOfX.serverLogType.info, "calculateRanks response at game start - " + JSON.stringify(calculateRanksResponse));
    //                             if (calculateRanksResponse.success) {
    //                                 startTournamentHandler.eliminationProcess(params.self, calculateRanksResponse.result.table);
    //                             }
    //                         })
    //                         cb({ success: false, info: "Satellite tournament for this channel is over", isRetry: false, isDisplay: false, channelId: "" });
    //                     }
    //                 } else {
    //                     serverLog(stateOfX.serverLogType.info, 'Skipping satellite management as channel is for - ' + params.channel.channelType + ' table game.');
    //                     cb(null, params);
    //                 }
    //             } else {
    //                 cb(getTournamentRoomResponse)
    //             }
    //         })
    //     } else {
    //         serverLog(stateOfX.serverLogType.info, 'This is not a satellite tournament so skipping sateelite management');
    //         cb(null, params);
    //     }
    // }
    /*==============================  END  ==========================*/

    /*==============================  START  ==========================*/
    // Save this record for disconnection handling
    // not used anymore

    // New
    async upateActivityRecord(params: any): Promise<any> {
        const dataToInsert = {
            channelId: params.newChannelId,
            playerId: params.playerId,
            isRequested: true,
            playerName: params.playerName,
            channelType: stateOfX.gameType.tournament,
            tableId: params.tableId,
            deviceType: params.deviceType || ''
        };
    
        const { err, result } = await this.imdb.upsertActivity(
            { channelId: params.channelId, playerId: params.playerId },
            dataToInsert
        );
    
        if (!err && !!result) {
            return { success: true };
        } else {
            return {
                success: false,
                isRetry: true,
                isDisplay: false,
                channelId: params.channelId || "",
                info: popupTextManager.dbQyeryInfo.DBUPSERTACTIVITYFAIL_STARTGAMEHANDLER
            };
        }
    };
    

    // Old
    // const upateActivityRecord = function (params, cb) {
    //     let dataToInsert = {
    //         channelId: params.newChannelId,
    //         playerId: params.playerId,
    //         isRequested: true,
    //         playerName: params.playerName,
    //         channelType: stateOfX.gameType.tournament,
    //         tableId: params.tableId,
    //         deviceType: params.deviceType || ''
    //     }
    //     imdb.upsertActivity({ channelId: params.channelId, playerId: params.playerId }, dataToInsert, function (err, result) {
    //         if (!err && !!result) {
    //             cb({ success: true });
    //         } else {
    //             cb({ success: false, isRetry: true, isDisplay: false, channelId: (params.channelId || ""), info: popupTextManager.dbQyeryInfo.DBUPSERTACTIVITYFAIL_STARTGAMEHANDLER });
    //         }
    //     })
    // }
    /*==============================  END  ==========================*/

    /*==============================  START  ==========================*/
    // Shuffle players for tournament

    // New
    async shuffleTournamentPlayers(params: any): Promise<any> {
    
        if (params.channel.channelType !== stateOfX.gameType.normal) {

            // Pomelo Connection
            const shufflePlayersResponse = await pomelo.app.rpc.database.tableRemote.shufflePlayers(params.session, { channelId: params.channelId });
            // Pomelo Connection
        
            if (shufflePlayersResponse.success && shufflePlayersResponse.isPlayerShuffled) {
                console.log(stateOfX.serverLogType.info, "current channel id is - ", params.channelId);
    
                if (shufflePlayersResponse.isChannelReductionPossible) {
                    this.tournamentActionHandler.handleDestroyChannel({
                        app: pomelo.app,
                        tournamentId: shufflePlayersResponse.tournamentId,
                        channelId: params.channelId
                    });
                }
    
                params.removedPlayerList = shufflePlayersResponse.outOfMoneyPlayers;
                console.log(stateOfX.serverLogType.info, "Players to removed from shuffling - " + params.removedPlayerList);
    
                for (const player of shufflePlayersResponse.shiftedPlayersData) {
                    console.log(stateOfX.serverLogType.info, "player in shuffleTournamentPlayers in startGameHandler is - ", JSON.stringify(player));
    
                    const response = await this.upateActivityRecord({
                        playerName: player.playerName,
                        playerId: player.playerId,
                        newChannelId: player.channelId,
                        channelId: params.channelId,
                        tableId: shufflePlayersResponse.tournamentId
                    });
    
                    if (response.success) {
                        const broadcastData:any= {
                            session: params.session,
                            maxPlayers: shufflePlayersResponse.maxPlayerOnTable,
                            playerId: player.playerId,
                            newChannelId: player.channelId,
                            seatIndex: player.seatIndex,
                            channelId: params.channelId,
                        };
    
                        const data = {
                            success: true,
                            isStandup: false,
                            channelId: params.channelId,
                            playerId: player.playerId,
                            playerName: player.playerName
                        };
    
                        this.broadcastHandler.fireLeaveBroadcast({ channel: params.channel, serverType: "connector", data: data });
    
                        params.channel.leave(player.playerId);
    
                        this.broadcastHandler.fireNewChannelBroadcast(broadcastData);
    
                        broadcastData.chips = player.chips;
                        broadcastData.seatIndex = player.seatIndex;
                        broadcastData.playerName = player.playerName;
                        broadcastData.imageAvtar = player.imageAvtar;
                        broadcastData.channel = pomelo.app.get('channelService').getChannel(player.channelId, false);
    
                        this.broadcastHandler.fireSitBroadcastInShuffling(broadcastData);
    
                        if (player.channelId !== params.channelId) {
                            await this.startGame({
                                session: params.session,
                                channelId: player.channelId,
                                channel: pomelo.app.get('channelService').getChannel(player.channelId, false),
                                eventName: stateOfX.startGameEvent.gameOver
                            });
                        } else {
                            console.log(stateOfX.serverLogType.info, 'Not starting game for current table, skipping!');
                        }
                    } else {
                        return {
                            success: false,
                            isRetry: false,
                            isDisplay: false,
                            channelId: (params.channelId || ""),
                            info: popupTextManager.falseMessages.SHUFFLETOURNAMENTPLAYERSFAIL_STARTGAMEHANDLER
                        };
                    }
                }
    
                return null;
            } else if (shufflePlayersResponse.totalChannels === 1) {
                const response = await this.countCurrentPlayers(params);
    
                let usedChannel = response.channels.find((e: any) => e.channelId === params.channelId);
                console.log("now got the used channel is", usedChannel);
    
                let playingPlayers = _.filter(usedChannel.players, (player: any) => player.state === stateOfX.playerState.playing);
                let waitingPlayers = _.where(usedChannel.players, { state: stateOfX.playerState.waiting });
                let breakPlayers = _.where(usedChannel.players, { state: stateOfX.playerState.onBreak });
        
                if (response.success && ((playingPlayers.length + waitingPlayers.length + breakPlayers.length) === 1) &&
                    (!params.tournamentDetails.isLateRegistrationAllowed || (Number(new Date()) >= (params.tournamentDetails.tournamentStartTime + params.tournamentDetails.lateRegistrationTime * 60 * 1000)))) {
        
                    await this.db.updateTournamentRoom({ tournamentId: usedChannel.tournamentRules.tournamentId }, { state: stateOfX.tournamentState.finished });
        
                    if (playingPlayers.length + waitingPlayers.length + breakPlayers.length === 1) {
                        this.saveHistory(usedChannel.channelId);
    
                        let leavedPlayer: any[] = [];
    
                        if (playingPlayers.length) {
                            leavedPlayer = playingPlayers;
                        } else if (waitingPlayers.length) {
                            leavedPlayer = waitingPlayers;
                        } else {
                            leavedPlayer = breakPlayers;
                        }
    
                        this.broadcastHandler.fireLeaveBroadcast({
                            channel: params.channel,
                            serverType: "connector",
                            data: {
                                success: true,
                                isStandup: false,
                                channelId: usedChannel.channelId,
                                playerId: leavedPlayer[0].playerId,
                                playerName: leavedPlayer[0].playerName
                            }
                        });
    
                        if (params.tournamentDetails.tournamentType === 'SITNGO') {
                            console.log("ab main request khud bhejunga");
                            await pomelo.app.sysrpc['room'].msgRemote.forwardMessage(
                                { forceFrontendId: "room-server-1" },
                                {
                                    body: {
                                        playerId: leavedPlayer[0].playerId,
                                        playerName: leavedPlayer[0].playerName,
                                        isStandup: false,
                                        channelId: usedChannel.channelId,
                                        isRequested: false,
                                        origin: params.data && params.data.origin ? params.data.origin : 'kickToLobby',
                                        isRankGenerated: true
                                    },
                                    route: "room.channelHandler.leaveTable"
                                },
                                this.sessionExport(params.session)
                            );
                        }
                    }
                    return null;
                } else {
                    return null;
                }
            } else if (shufflePlayersResponse.success && !shufflePlayersResponse.isPlayerShuffled) {
                return null;
            } else {
                return shufflePlayersResponse;
            }
        } else {
            console.log(stateOfX.serverLogType.info, 'Skipping shuffling as channel is for - ' + params.channel.channelType + ' table game.');
            return null;
        }
    };
    

    // Old
    // const shuffleTournamentPlayers = function (params, cb) {
    //     console.log("inside shuffleTournamentPlayers", params)
    //     if (params.channel.channelType !== stateOfX.gameType.normal) {
    //         pomelo.app.rpc.database.tableRemote.shufflePlayers(params.session, { channelId: params.channelId }, function (shufflePlayersResponse) {
    //             console.log('shufflePlayersResponse inside shuffleTournamentPlayers is- ', shufflePlayersResponse);
    //             if (shufflePlayersResponse.success && shufflePlayersResponse.isPlayerShuffled) {
    //                 console.log(stateOfX.serverLogType.info, "current channel id is - ", params.channelId);
    //                 // broadcast for lobby optimization
    //                 if (shufflePlayersResponse.isChannelReductionPossible) {
    //                     tournamentActionHandler.handleDestroyChannel({ app: pomelo.app, tournamentId: shufflePlayersResponse.tournamentId, channelId: params.channelId });
    //                 }
    //                 params.removedPlayerList = shufflePlayersResponse.outOfMoneyPlayers;
    //                 console.log(stateOfX.serverLogType.info, "Players to removed from shuffling - " + params.removedPlayerList);
    //                 async.each(shufflePlayersResponse.shiftedPlayersData, function (player, callback) {
    //                     console.log(stateOfX.serverLogType.info, "player in shuffleTournamentPlayers in startGameHandler is - ", JSON.stringify(player));
    //                     upateActivityRecord({ playerName: player.playerName, playerId: player.playerId, newChannelId: player.channelId, channelId: params.channelId, tableId: shufflePlayersResponse.tournamentId }, function (response) {
    //                         if (response.success) {
    //                             var broadcastData = {
    //                                 session: params.session,
    //                                 maxPlayers: shufflePlayersResponse.maxPlayerOnTable,
    //                                 playerId: player.playerId,
    //                                 newChannelId: player.channelId,
    //                                 seatIndex: player.seatIndex,
    //                                 channelId: params.channelId,
    //                             }
    //                             var data = {
    //                                 success: true,
    //                                 isStandup: false,
    //                                 channelId: params.channelId,
    //                                 playerId: player.playerId,
    //                                 playerName: player.playerName
    //                             }
    //                             broadcastHandler.fireLeaveBroadcast({ channel: params.channel, serverType: "connector", data: data });
    //                             console.log("params.channel ddddddddddddd sd before", params.channel)
    //                             params.channel.leave(player.playerId);
    //                             console.log("params.channel ddddddddddddd sd after", params.channel)
    //                             broadcastHandler.fireNewChannelBroadcast(broadcastData);
    //                             broadcastData.chips = player.chips;
    //                             broadcastData.seatIndex = player.seatIndex;
    //                             broadcastData.playerName = player.playerName;
    //                             broadcastData.imageAvtar = player.imageAvtar;
    //                             broadcastData.channel = pomelo.app.get('channelService').getChannel(player.channelId, false);
    //                             broadcastHandler.fireSitBroadcastInShuffling(broadcastData);
    //                             if (player.channelId != params.channelId) {
    //                                 startGameHandler.startGame({ session: params.session, channelId: player.channelId, channel: pomelo.app.get('channelService').getChannel(player.channelId, false), eventName: stateOfX.startGameEvent.gameOver });
    //                             } else {
    //                                 console.log(stateOfX.serverLogType.info, 'Not starting game for current table, skipping!');
    //                             }
    //                             callback();
    //                         } else {
    //                             cb({ success: false, isRetry: false, isDisplay: false, channelId: (params.channelId || ""), info: popupTextManager.falseMessages.SHUFFLETOURNAMENTPLAYERSFAIL_STARTGAMEHANDLER });
    //                         }
    //                     })
    //                 }, function (err) {
    //                     if (err) {
    //                         console.log(stateOfX.serverLogType.info, "Error in player shuffling in shuffle tournament players");
    //                         cb(params);
    //                     } else {
    //                         cb(null, params);
    //                     }
    //                 })
    //             } else if (shufflePlayersResponse.totalChannels == 1) {
    //                 countCurrentPlayers(params, function (response) {
    //                     let usedChannel = response.channels.find(e => e.channelId == params.channelId);
    //                     console.log("now got the ised channel is", usedChannel)
    //                     let playingPlayers = _.filter(usedChannel.players, player => {
    //                         return player.state === stateOfX.playerState.playing;
    //                     });
    //                     let waitingPlayers = _.where(usedChannel.players, { state: stateOfX.playerState.waiting });
    //                     let breakPlayers = _.where(usedChannel.players, { state: stateOfX.playerState.onBreak });
    //                     console.log(stateOfX.serverLogType.info, "response of countCurrentPlayers is in shuffle - ", response);
    //                     console.log("playingPlayersplayingPlayersplayingPlayers", playingPlayers, waitingPlayers, breakPlayers, playingPlayers.length + waitingPlayers.length + breakPlayers.length, Number(new Date()), params.tournamentDetails.tournamentStartTime, Number(new Date()) >= (params.tournamentDetails.tournamentStartTime + params.tournamentDetails.lateRegistrationTime * 60 * 1000));
    //                     if (response.success && ((playingPlayers.length + waitingPlayers.length + breakPlayers.length) === 1) && (!params.tournamentDetails.isLateRegistrationAllowed || (Number(new Date()) >= (params.tournamentDetails.tournamentStartTime + params.tournamentDetails.lateRegistrationTime * 60 * 1000)))) {
    //                         console.log("ab remove kar dega");
    //                         db.updateTournamentRoom({ tournamentId: usedChannel.tournamentRules.tournamentId }, { state: stateOfX.tournamentState.finished }, function (err, response) { })
    //                         console.log(stateOfX.serverLogType.info, "removed playersIds in remove winner is - ", usedChannel);
    //                         // let eliminatePlayer = []
    //                         console.log(stateOfX.serverLogType.info, "removed player while last winner check is - ", playingPlayers);
    //                         if (playingPlayers.length + waitingPlayers.length + breakPlayers.length === 1) {
    //                             // eliminatePlayer.push(playingPlayers[0])
    //                             saveHistory(usedChannel.channelId)
    //                             console.log("sending broadcast of leave")
    //                             let leavedPlayer = [];
    //                             if (playingPlayers.length) {
    //                                 leavedPlayer = playingPlayers;
    //                             }
    //                             else if (waitingPlayers.length) {
    //                                 leavedPlayer = waitingPlayers;
    //                             }
    //                             else {
    //                                 leavedPlayer = breakPlayers;
    //                             }
    //                             broadcastHandler.fireLeaveBroadcast({ channel: params.channel, serverType: "connector", data: { success: true, isStandup: false, channelId: usedChannel.channelId, playerId: leavedPlayer[0].playerId, playerName: leavedPlayer[0].playerName } });
    //                             if (params.tournamentDetails.tournamentType === 'SITNGO') {
    //                                 console.log("ab main request khud bhejunga");
    //                                 pomelo.app.sysrpc['room'].msgRemote.forwardMessage(
    //                                     { forceFrontendId: "room-server-1" },
    //                                     {
    //                                         body: { playerId: leavedPlayer[0].playerId, playerName: leavedPlayer[0].playerName, isStandup: false, channelId: usedChannel.channelId, isRequested: false, origin: params.data && params.data.origin ? params.data.origin : 'kickToLobby', isRankGenerated: true },
    //                                         route: "room.channelHandler.leaveTable"
    //                                     },
    //                                     sessionExport(params.session), function (err, hitLeaveResponse) {
    //                                         console.log("room.channelHandler.leaveTable res is >", hitLeaveResponse);
    //                                     }
    //                                 );
    //                             }
    //                         }
    //                         // manageOutOfMoneyPlayer({ table: usedChannel, outOfMoneyPlayer: eliminatePlayer })
    //                         cb(null, params);
    //                     } else {
    //                         cb(null, params);
    //                     }
    //                 });
    //             } else if (shufflePlayersResponse.success && !shufflePlayersResponse.isPlayerShuffled) {
    //                 cb(null, params);
    //             } else {
    //                 cb(shufflePlayersResponse);
    //             }
    //         });
    //     } else {
    //         serverLog(stateOfX.serverLogType.info, 'Skipping shuffling as channel is for - ' + params.channel.channelType + ' table game.');
    //         cb(null, params);
    //     }
    // }
    /*==============================  END  ==========================*/

    /*==============================  START  ==========================*/

    // New
    async saveHistory(channelId: any): Promise<void>{
        try {
            const result = await this.imdb.getTable(channelId);
    
            if (result && result.channelType === "TOURNAMENT") {
                await this.db.saveHistory(result);
            }
    
            await this.imdb.removeTable(channelId);
        } catch (err) {
            console.error("Error in saveHistory:", err);
        }
    };
    

    // Old
    // const saveHistory = (channelId) => {
    //     imdb.getTable(channelId, function (err, result) {
    //         if (!err && result && result.channelType == "TOURNAMENT" || params.table.channelType == "TOURNAMENT") {
    //             db.saveHistory(result, (err, result) => { })
    //         }
    //     })
    //     imdb.removeTable(channelId, function (err, data) { });
    // }
    /*==============================  END  ==========================*/

    /*==============================  START  ==========================*/
    // tournament

    // New
    async removeWinnerPlayerInTournament(params: any): Promise<any> {
        
        if (params.channel.channelType !== stateOfX.gameType.normal) {
            console.log(stateOfX.serverLogType.info, "params is in removeWinnerPlayerInTournament in startGameHandler - " + JSON.stringify(params.channelId));
            
            try {
                const response = await this.countCurrentPlayers(params);
    
                if (response.success && response.playersCount === 1 && (params.tournamentDetails && !params.tournamentDetails.isLateRegistrationAllowed)) {
                    params.removedPlayerList = params.removedPlayerList.concat(response.playerIds);
                }
                return params;
            } catch (err) {
                console.error("Error in countCurrentPlayers:", err);
                throw err;  // Propagate error if needed
            }
        } else {
            console.log(stateOfX.serverLogType.info, 'Skipping winner player reward distribution, as channel is for - ' + params.channel.channelType + ' table game.');
            return params;
        }
    };
    

    // Old
    // const removeWinnerPlayerInTournament = function (params, cb) {
    //     console.log("inside removeWinnerPlayerInTournament channel", params.channel)
    //     if (params.channel.channelType !== stateOfX.gameType.normal) {
    //         console.log(stateOfX.serverLogType.info, "params is in removeWinnerPlayerInTournament in startGameHandler - " + JSON.stringify(params.channelId));
    //         countCurrentPlayers(params, function (response) {
    //             console.log(stateOfX.serverLogType.info, "response of countCurrentPlayers is - ", response);
    //             if (response.success && response.playersCount === 1 && (params.tournamentDetails && !params.tournamentDetails.isLateRegistrationAllowed)) {
    //                 params.removedPlayerList = params.removedPlayerList.concat(response.playerIds);
    //             }
    //             cb(null, params);
    //         });
    //     } else {
    //         console.log(stateOfX.serverLogType.info, 'Skipping winner player reward distribution, as channel is for - ' + params.channel.channelType + ' table game.');
    //         cb(null, params);
    //     }
    // }
    /*==============================  END  ==========================*/


    /*==============================  START  ==========================*/
    // NEW: wait for Rebuy players for little time
    // they can add chips and become part of game

    // New
    async waitForRebuy(params: any): Promise<any> {
    
        if (params.channel.channelType !== stateOfX.gameType.normal) {

            const channel = await this.imdb.getTable(params.channelId);
    
            if (!channel || channel.channelType === stateOfX.gameType.normal) {
                return params;
            }
    
            const outOfMoneyPlayer = _.where(channel.players, { state: stateOfX.playerState.outOfMoney });
            const playingPlayers = _.where(channel.players, { state: stateOfX.playerState.playing });
            const waitingPlayers = _.where(channel.players, { state: stateOfX.playerState.waiting });
            const breakPlayers = _.where(channel.players, { state: stateOfX.playerState.onBreak });
    
    
            const tournament = await this.db.getTournamentRoom(channel.tournamentRules.tournamentId);
    
            if (outOfMoneyPlayer.length) {
                if (!tournament || !tournament.isRebuyAllowed) {
                    const eliminatePlayer: any[] = [];
    
                    for (const cp of outOfMoneyPlayer) {
                        const data = {
                            success: true,
                            isStandup: false,
                            channelId: channel.channelId,
                            playerId: cp.playerId,
                            playerName: cp.playerName,
                        };
                        eliminatePlayer.push(cp);
                        this.broadcastHandler.fireLeaveBroadcast({ channel: params.channel, serverType: "connector", data });
    
                        if (params.tournamentDetails.tournamentType === 'SITNGO') {
                            await pomelo.app.sysrpc['room'].msgRemote.forwardMessage(
                                { forceFrontendId: "room-server-1" },
                                {
                                    body: {
                                        playerId: data.playerId,
                                        playerName: data.playerName,
                                        isStandup: false,
                                        channelId: data.channelId,
                                        isRequested: false,
                                        origin: params.data?.origin || 'kickToLobby',
                                        isRankGenerated: true,
                                    },
                                    route: "room.channelHandler.leaveTable"
                                },
                                this.sessionExport(params.session)
                            );
                        }
                    }
    
                    if (eliminatePlayer.length) {
                        this.manageOutOfMoneyPlayer({ table: channel, outOfMoneyPlayer: eliminatePlayer, tournament, channel: params.channel });
                    }
    
                    return params;
                } else {
                    for (const pp of playingPlayers) {
                        this.broadcastHandler.fireBroadcastForRebuyWaiting({
                            playerId: pp.playerId,
                            msg: { delay: systemConfig.delayForRebuyPlayer }
                        });
                    }
    
                    const rebuyTime = tournament.tournamentStartTime + tournament.rebuyTime * 60000;
                    const currentTime = Date.now();
    
                    if (rebuyTime > currentTime) {
                        const eliminatePlayer: any[] = [];
    
                        for (const cp of outOfMoneyPlayer) {
                            const rebuyThreshold = currentTime - (systemConfig.delayForRebuyPlayer * 1000) - 5000;
    
                            if (cp.lastRebuyBroadcastSentAt >= rebuyThreshold) {
                                const data = {
                                    success: true,
                                    isStandup: false,
                                    channelId: channel.channelId,
                                    playerId: cp.playerId,
                                    playerName: cp.playerName
                                };
                                this.broadcastHandler.fireLeaveBroadcast({ channel: params.channel, serverType: "connector", data });
    
                                if (params.tournamentDetails.tournamentType === 'SITNGO') {
                                    await pomelo.app.sysrpc['room'].msgRemote.forwardMessage(
                                        { forceFrontendId: "room-server-1" },
                                        {
                                            body: {
                                                playerId: data.playerId,
                                                playerName: data.playerName,
                                                isStandup: false,
                                                channelId: data.channelId,
                                                isRequested: false,
                                                origin: params.data?.origin || 'kickToLobby',
                                                isRankGenerated: true
                                            },
                                            route: "room.channelHandler.leaveTable"
                                        },
                                        this.sessionExport(params.session)
                                    );
                                }
    
                                eliminatePlayer.push(cp);
                            } else {
                                await this.imdb.setPlayersData(
                                    { channelId: channel.channelId, playerId: cp.playerId },
                                    { currentTime }
                                );
                                this.broadcastHandler.sendMessageToUser({
                                    self: {},
                                    playerId: cp.playerId,
                                    msg: {
                                        channelId: channel.channelId,
                                        playerId: cp.playerId,
                                        fromJoinWaitList: {}
                                    },
                                    route: "bankrupt"
                                });
                            }
                        }
    
                        if (eliminatePlayer.length) {
                            this.manageOutOfMoneyPlayer({ table: channel, outOfMoneyPlayer: eliminatePlayer, tournament, channel: params.channel });
                        }
    
                        this.handleOutOfMoneyTournament({
                            channelId: params.channelId,
                            data: {
                                outOfMoneyPlayer: _.pluck(outOfMoneyPlayer, 'playerId'),
                                playingPlayer: _.pluck(playingPlayers, 'playerId'),
                                endsAt: currentTime + systemConfig.delayForRebuyPlayer * 1000
                            }
                        });
    
                        schedule.scheduleJob(new Date(currentTime + systemConfig.delayForRebuyPlayer * 1000), () => {
                            this.handleOutOfMoneyTournament({
                                channelId: params.channelId,
                                data: {
                                    outOfMoneyPlayer: [],
                                    playingPlayer: [],
                                    endsAt: -1
                                }
                            });
                            this.startGame({
                                session: params.session,
                                channelId: params.channelId,
                                channel: params.channel,
                                eventName: stateOfX.startGameEvent.gameOver
                            });
                        });
    
                        if (eliminatePlayer.length === outOfMoneyPlayer.length) {
                            return params;
                        } else {
                            throw {
                                success: false,
                                isRetry: false,
                                isDisplay: true,
                                channelId: params.channelId || "",
                                info: "Waiting for ReBuy PLayers"
                            };
                        }
                    } else {
                        return params;
                    }
                }
            } else if ((playingPlayers.length + waitingPlayers.length + breakPlayers.length) === 1 &&
                (!tournament.isLateRegistrationAllowed ||
                    (Date.now() >= (tournament.tournamentStartTime + tournament.lateRegistrationTime * 60 * 1000)))) {
                this.manageOutOfMoneyPlayer({ table: channel, outOfMoneyPlayer: [], tournament, channel: params.channel });
                return params;
            } else {
                return params;
            }
        } else {
            return params;
        }
    };
    

    // Old
    // const waitForRebuy = function (params, cb) {
    //     console.log("inside waitForRebuy", params)
    //     if (params.channel.channelType !== stateOfX.gameType.normal) {
    //         imdb.getTable(params.channelId, function (err, channel) {
    //             console.log("sdfgfgsfg channel is ,", channel.players)
    //             if (err || !channel || channel.channelType === stateOfX.gameType.normal) {
    //                 return cb(null, params);
    //             } else {
    //                 let outOfMoneyPlayer = _.where(channel.players, { state: stateOfX.playerState.outOfMoney });
    //                 console.log("sdfgfgsfg channel is ,", channel.players)
    //                 let playingPlayers = _.where(channel.players, { state: stateOfX.playerState.playing });
    //                 let waitingPlayers = _.where(channel.players, { state: stateOfX.playerState.waiting });
    //                 let breakPlayers = _.where(channel.players, { state: stateOfX.playerState.onBreak })
    //                 console.log("sdfgfgsfg outOfMoneyPlayer is ,", outOfMoneyPlayer, playingPlayers, waitingPlayers, breakPlayers)
    //                 db.getTournamentRoom(channel.tournamentRules.tournamentId, function (err, tournament) {
    //                     console.log("sdfgfgsfg tournament is ,", tournament)
    //                     if (outOfMoneyPlayer.length) {
    //                         if (err || !tournament) {
    //                             return cb(null, params);
    //                         } else if (!tournament.isRebuyAllowed) {
    //                             let eliminatePlayer = []
    //                             for (let cp of outOfMoneyPlayer) {
    //                                 const data = {
    //                                     success: true,
    //                                     isStandup: false,
    //                                     channelId: channel.channelId,
    //                                     playerId: cp.playerId,
    //                                     playerName: cp.playerName,
    //                                 }
    //                                 eliminatePlayer.push(cp)
    //                                 broadcastHandler.fireLeaveBroadcast({ channel: params.channel, serverType: "connector", data: data });
    //                                 if (params.tournamentDetails.tournamentType === 'SITNGO') {
    //                                     pomelo.app.sysrpc['room'].msgRemote.forwardMessage(
    //                                         { forceFrontendId: "room-server-1" },
    //                                         {
    //                                             body: { playerId: data.playerId, playerName: data.playerName, isStandup: false, channelId: data.channelId, isRequested: false, origin: params.data && params.data.origin ? params.data.origin : 'kickToLobby', isRankGenerated: true },
    //                                             route: "room.channelHandler.leaveTable"
    //                                         },
    //                                         sessionExport(params.session), function (err, hitLeaveResponse) {
    //                                             console.log("room.channelHandler.leaveTable res is >", hitLeaveResponse);
    //                                         }
    //                                     );
    //                                 }
    //                             }

    //                             if (eliminatePlayer.length) {
    //                                 let data = {
    //                                     table: channel,
    //                                     outOfMoneyPlayer: eliminatePlayer,
    //                                     tournament: tournament,
    //                                     channel: params.channel
    //                                 }
    //                                 manageOutOfMoneyPlayer(data)
    //                             }
    //                             return cb(null, params);
    //                         }
    //                         else {
    //                             //broadcast to playing player 
    //                             for (let pp of playingPlayers) {
    //                                 broadcastHandler.fireBroadcastForRebuyWaiting({ playerId: pp.playerId, msg: { delay: systemConfig.delayForRebuyPlayer } })
    //                             }
    //                             //rebuy is allowed now check for timing
    //                             const rebuyTime = tournament.tournamentStartTime + tournament.rebuyTime * 60000;
    //                             const currentTime = Number(new Date());
    //                             if (rebuyTime > currentTime) {
    //                                 let eliminatePlayer = []
    //                                 for (let cp of outOfMoneyPlayer) {
    //                                     const rebuyThreshold = currentTime - (systemConfig.delayForRebuyPlayer * 1000) - (5 * 1000);
    //                                     console.log("sdfgfgsfg outOfMoney player is ,", cp.lastRebuyBroadcastSentAt, rebuyThreshold, currentTime, cp.lastRebuyBroadcastSentAt >= rebuyThreshold)
    //                                     if (cp.lastRebuyBroadcastSentAt >= rebuyThreshold) {
    //                                         console.log("inside if")
    //                                         //start sending him leave broadcast
    //                                         const data = {
    //                                             success: true,
    //                                             isStandup: false,
    //                                             channelId: channel.channelId,
    //                                             playerId: cp.playerId,
    //                                             playerName: cp.playerName
    //                                         }
    //                                         broadcastHandler.fireLeaveBroadcast({ channel: params.channel, serverType: "connector", data: data });
    //                                         if (params.tournamentDetails.tournamentType === 'SITNGO') {
    //                                             console.log("ab main request khud bhejunga");
    //                                             pomelo.app.sysrpc['room'].msgRemote.forwardMessage(
    //                                                 { forceFrontendId: "room-server-1" },
    //                                                 {
    //                                                     body: { playerId: data.playerId, playerName: data.playerName, isStandup: false, channelId: data.channelId, isRequested: false, origin: params.data && params.data.origin ? params.data.origin : 'kickToLobby', isRankGenerated: true },
    //                                                     route: "room.channelHandler.leaveTable"
    //                                                 },
    //                                                 sessionExport(params.session), function (err, hitLeaveResponse) {
    //                                                     console.log("room.channelHandler.leaveTable res is >", hitLeaveResponse);
    //                                                 }
    //                                             );
    //                                         }
    //                                         eliminatePlayer.push(cp)
    //                                     } else {
    //                                         console.log("inside else", currentTime)
    //                                         imdb.setPlayersData({ channelId: channel.channelId, playerId: cp.playerId }, { currentTime }, function (err, res) {
    //                                             console.log("inside set ct", err, res, currentTime)
    //                                         })
    //                                         broadcastHandler.sendMessageToUser({ self: {}, playerId: cp.playerId, msg: { channelId: channel.channelId, playerId: cp.playerId, fromJoinWaitList: {} }, route: "bankrupt" });
    //                                     }
    //                                 }
    //                                 if (eliminatePlayer.length) {
    //                                     manageOutOfMoneyPlayer({ table: channel, outOfMoneyPlayer: eliminatePlayer, tournament: tournament, channel: params.channel })
    //                                 }
    //                                 handleOutOfMoneyTournament({
    //                                     channelId: params.channelId, data: {
    //                                         outOfMoneyPlayer: _.pluck(outOfMoneyPlayer, 'playerId'),
    //                                         playingPlayer: _.pluck(playingPlayers, 'playerId'),
    //                                         endsAt: currentTime + systemConfig.delayForRebuyPlayer * 1000
    //                                     }
    //                                 })
    //                                 schedule.scheduleJob((currentTime + systemConfig.delayForRebuyPlayer * 1000), function () {
    //                                     handleOutOfMoneyTournament({
    //                                         channelId: params.channelId, data: {
    //                                             outOfMoneyPlayer: [],
    //                                             playingPlayer: [],
    //                                             endsAt: -1
    //                                         }
    //                                     })
    //                                     startGameHandler.startGame({ session: params.session, channelId: params.channelId, channel: params.channel, eventName: stateOfX.startGameEvent.gameOver });
    //                                 });
    //                                 if (eliminatePlayer.length == outOfMoneyPlayer.length) {
    //                                     return cb(null, params);
    //                                 } else {
    //                                     cb({ success: false, isRetry: false, isDisplay: true, channelId: (params.channelId || ""), info: "Waiting for ReBuy PLayers" });
    //                                 }
    //                             } else {
    //                                 return cb(null, params);
    //                             }
    //                         }
    //                     } else if ((playingPlayers.length + waitingPlayers.length + breakPlayers.length) === 1 && (!tournament.isLateRegistrationAllowed || (Number(new Date()) >= (tournament.tournamentStartTime + tournament.lateRegistrationTime * 60 * 1000)))) {
    //                         console.log("now remove kar do")
    //                         let data = {
    //                             table: channel,
    //                             outOfMoneyPlayer: [],
    //                             tournament: tournament,
    //                             channel: params.channel
    //                         }
    //                         manageOutOfMoneyPlayer(data)
    //                         return cb(null, params);
    //                     }
    //                     else {
    //                         return cb(null, params);
    //                     }
    //                 })
    //             }
    //         })
    //     } else {
    //         cb(null, params);
    //     }
    // }
    /*==============================  END  ==========================*/

    /*==============================  START  ==========================*/

    // New
    async deleteUserActivity(playersWithNoChips: any, tournamentId: any): Promise<void> {
        for (const player of playersWithNoChips) {
            await this.imdb.removeActivity({ playerId: player.playerId, tableId: tournamentId });
        }
    
        console.log(stateOfX.serverLogType.info, "all user activity deleted successfully");
    };
    

    // Old
    // const deleteUserActivity = function (playersWithNoChips, tournamentId) {
    //     async.eachSeries(playersWithNoChips, function (player, cb) {
    //         imdb.removeActivity({ playerId: player.playerId, tableId: tournamentId }, function (err, result) { });
    //     }, function (err) {
    //         serverLog(stateOfX.serverLogType.info, "all user activity deleted successfully");
    //     })
    // }
    /*==============================  END  ==========================*/

    /*==============================  START  ==========================*/

    // New
    async getPlayingPlayers(tournamentId: any): Promise<any> {
        try {
            const channels = await this.imdb.findChannels({ tournamentId });
    
            let playingPlayers = 0;
            for (const channel of channels) {
                for (const player of channel.players) {
                    if (
                        player.state === stateOfX.playerState.playing ||
                        player.state === stateOfX.playerState.waiting
                    ) {
                        playingPlayers++;
                    }
                }
            }
    
            return { success: true, playingPlayers };
        } catch (err) {
            return {
                success: false,
                channelId: "", // params.channelId not available here
                info: infoMessage.GETPLAYINGPLAYERS_HANDLEGAMEOVER,
                isRetry: false,
                isDisplay: true
            };
        }
    };
    

    // Old
    // const getPlayingPlayers = function (tournamentId, cb) {
    //     imdb.findChannels({ tournamentId: tournamentId }, function (err, channels) {
    //         if (err) {
    //             cb({ success: false, channelId: (params.channelId || ""), info: infoMessage.GETPLAYINGPLAYERS_HANDLEGAMEOVER, isRetry: false, isDisplay: true });
    //         } else {
    //             let playingPlayers = 0;
    //             for (let i = 0; i < channels.length; i++) {
    //                 for (let j = 0; j < channels[i].players.length; j++) {
    //                     if (channels[i].players[j].state === stateOfX.playerState.playing || channels[i].players[j].state === stateOfX.playerState.waiting) {
    //                         playingPlayers++
    //                     }
    //                 }
    //             }
    //             cb({ success: true, playingPlayers: playingPlayers });
    //         }
    //     })
    // }
    /*==============================  END  ==========================*/

    /*==============================  START  ==========================*/
    // New
    async manageOutOfMoneyPlayer(params: any) {
    
        const playersWithNoChips = params.outOfMoneyPlayer;
        const playerWithChips = _.difference(params.table.players, playersWithNoChips);
    
        await this.deleteUserActivity(playersWithNoChips, params.table.tournamentRules.tournamentId);
    
        const playingPlayerResponse = await this.getPlayingPlayers(params.table.tournamentRules.tournamentId);
    
        if (playingPlayerResponse.success) {
            const isOnlyOnePlayerWithChips = playerWithChips.length === 1;
            const isLateRegistrationAllowed = !!params.tournament.isLateRegistrationAllowed;
            const isInLateRegistrationTime = Number(new Date()) <= (params.tournament.tournamentStartTime + params.tournament.lateRegistrationTime * 60 * 1000);
    
            if (isOnlyOnePlayerWithChips && isLateRegistrationAllowed && isInLateRegistrationTime) {
    
                if (this.gameStartJob) {

                    this.gameStartJob.cancel();
                }
    
                params.channel.gameStartEventSet = stateOfX.startGameEventOnChannel.idle;
                params.channel.gameStartEventName = null;
    
                const gameResumeTime = params.tournament.tournamentStartTime + params.tournament.lateRegistrationTime * 60 * 1000;
    
                this.gameStartJob = schedule.scheduleJob(gameResumeTime, async function () {    
                    try {
                        await this.imdb.updateSeats(params.table.channelId, {
                            isOnBreak: false,
                            isAddOnLive: false,
                            isBreakTimerStart: false
                        });
    
                        const foundChannel = pomelo.app.get('channelService').getChannel(params.table.channelId, false);
    
                        if (!!foundChannel) {
                            foundChannel.gameStartEventSet = stateOfX.startGameEventOnChannel.idle;
                            foundChannel.gameStartEventName = null;
                        }
    
                        const paramsData = {
                            self: {},
                            session: {},
                            channelId: params.table.channelId,
                            channel: params.channel,
                            eventName: params.eventName == stateOfX.startGameEvent.tournamentAfterBreak
                        };
    
                        this.startGame(paramsData);
    
                    } catch (err) {
                        console.log(stateOfX.serverLogType.info + "Error in updating isOnBreak key", err);
                    }
                });
            } else if (isOnlyOnePlayerWithChips && playingPlayerResponse?.playingPlayers === 1) {
                params.table.tournamentRules.isGameRunning = false;
                params.table.tournamentRules.winner = playerWithChips;
            }
    
            if ([stateOfX.tournamentType.normal, stateOfX.tournamentType.satelite, stateOfX.tournamentType.sitNGo].includes(params.table.tournamentType)) {
                const response = await this.calculateRanks.manageRanksForNormalTournament(params, playersWithNoChips);
                if (response.success) {
                    this.startTournamentHandler.eliminationProcess(params.self, response.result.table);
                }
            } else {
                const response = await this.calculateRanks.manageRanks(params, playersWithNoChips);
                if (response.success) {
                    this.startTournamentHandler.eliminationProcess(params.self, response.result.table);
                }
            }
        }
    }
    

    // Old
    // const manageOutOfMoneyPlayer = function (params) {
    //     console.trace("manageOutOfMoneyPlayermanageOutOfMoneyPlayer", params)
    //     let playersWithNoChips = params.outOfMoneyPlayer;
    //     let playerWithChips = _.difference(params.table.players, playersWithNoChips);
    //     deleteUserActivity(playersWithNoChips, params.table.tournamentRules.tournamentId);
    //     getPlayingPlayers(params.table.tournamentRules.tournamentId, async function (playingPlayerResponse) {
    //         console.log("response of plaing player in manageRanks are - ", playingPlayerResponse, playerWithChips);
    //         if (playingPlayerResponse.success) {
    //             // playingPlayerResponse.playingPlayers = playingPlayerResponse.playingPlayers + playerWithChips.length;
    //             if (playerWithChips.length === 1 && (!!params.tournament.isLateRegistrationAllowed && Number(new Date()) <= (params.tournament.tournamentStartTime + params.tournament.lateRegistrationTime * 60 * 1000))) {
    //                 console.log("ab game rokna hai")
    //                 if (gameStartJob) {
    //                     console.log("gameStartJobgameStartJob", gameStartJob);
    //                     gameStartJob.cancel();
    //                 }
    //                 //channel is eligible for break
    //                 // set channel status as idle for again game start after break;
    //                 params.channel.gameStartEventSet = stateOfX.startGameEventOnChannel.idle;
    //                 params.channel.gameStartEventName = null;

    //                 let gameResumeTime = params.tournament.tournamentStartTime + params.tournament.lateRegistrationTime * 60 * 1000;
    //                 gameStartJob = schedule.scheduleJob(gameResumeTime, function () {
    //                     console.log("inside schedule to check")
    //                     //update the breakLevel and set the isOnBreak key to false after the current break is over
    //                     imdb.updateSeats(params.table.channelId, { isOnBreak: false, isAddOnLive: false, isBreakTimerStart: false }, function (err, result) {
    //                         console.log("in updateSeats of scheduleNextGameStart", err, result);
    //                         if (err) {
    //                             console.log(stateOfX.serverLogType.info + "Error in updating isOnBreak key");
    //                         } else {
    //                             let foundChannel = pomelo.app.get('channelService').getChannel(params.table.channelId, false);
    //                             if (!!foundChannel) {
    //                                 foundChannel.gameStartEventSet = stateOfX.startGameEventOnChannel.idle;
    //                                 foundChannel.gameStartEventName = null;
    //                             }
    //                             var paramsData = {
    //                                 self: {},
    //                                 session: {},
    //                                 channelId: params.table.channelId,
    //                                 channel: params.channel,
    //                                 eventName: params.eventName == stateOfX.startGameEvent.tournamentAfterBreak
    //                             }
    //                             console.log("GOING TO START GAME --------", gameResumeTime, Date.now(), paramsData);
    //                             startGameHandler.startGame(paramsData);
    //                         }
    //                     })
    //                 })
    //             }
    //             else if (playerWithChips.length === 1 && playingPlayerResponse?.playingPlayers == 1) {
    //                 params.table.tournamentRules.isGameRunning = false;
    //                 params.table.tournamentRules.winner = playerWithChips;
    //                 console.log("player with no chips are in manageRanks are ", playersWithNoChips);
    //             }
    //             // else if (params.table.tournamentType === stateOfX.tournamentType.sitNGo && playingPlayerResponse.playingPlayers == 1) {
    //             //   params.table.tournamentRules.isGameRunning = false;
    //             //   params.table.tournamentRules.winner = playerWithChips;
    //             // }
    //             //Ranks for normal tournaments
    //             if (params.table.tournamentType === stateOfX.tournamentType.normal || params.table.tournamentType === stateOfX.tournamentType.satelite || params.table.tournamentType === stateOfX.tournamentType.sitNGo) {
    //                 await new Promise(resolve => {
    //                     calculateRanks.manageRanksForNormalTournament(params, playersWithNoChips, function (response) {
    //                         console.log(stateOfX.serverLogType.info, "response in manageRanksForNormalTournament in handle game over is -  ", response);
    //                         if (response.success) {
    //                             startTournamentHandler.eliminationProcess(params.self, response.result.table);
    //                         }
    //                     });
    //                     resolve(); // Resolve the promise to indicate the completion of rank calculation
    //                 });
    //             } else {
    //                 calculateRanks.manageRanks(params, playersWithNoChips, function (response) {
    //                     console.log("response in manageRanks in handle game over is -  ", response);
    //                     if (response.success) {
    //                         startTournamentHandler.eliminationProcess(params.self, response.result.table);
    //                     }
    //                 });
    //             }
    //         }
    //     })
    // }
    /*==============================  END  ==========================*/

    /*==============================  START  ==========================*/
    async handleOutOfMoneyTournament(params) {
        await this.imdb.updateSeats(params.channelId, { rebuyDataForBroadcast: params.data })
    }
    /*==============================  END  ==========================*/

    /*==============================  START  ==========================*/

    // New
    async waitForOutOfMoney(params: any): Promise<any> {
    
        if (params.channel.channelType !== stateOfX.gameType.normal) {
            return params;
        }
    
        // Pomelo Connection
        const getPlayersRes = await pomelo.app.rpc.database.tableRemote.getTableAttrib(params.session, { channelId: params.channelId, key: "players" });
        // Pomelo Connection
    
        if (getPlayersRes.success) {
            const players = getPlayersRes.value;
            params.tablePlayersForBroadcast = players;
    
            const bankruptCount = players.filter((p: any) => p.state === stateOfX.playerState.outOfMoney).length;
    
            if (bankruptCount > 0) {
                const bplayers = players.map(({ playerId, chips, state }: any) => ({ playerId, chips, state }));
                this.broadcastHandler.fireTablePlayersBroadcast({
                    channelId: params.channelId,
                    channel: params.channel,
                    players: bplayers,
                    removed: []
                });
    
                await new Promise(resolve => setTimeout(resolve, systemConfig.waitForOutOfMoneySeconds * 1000));
            }
        }
    
        return params;
    };
    

    // Old
    // const waitForOutOfMoney = function (params, cb) {
    //     console.log("inside waitForOutOfMoney", params.channelId)
    //     console.log(stateOfX.serverLogType.info, 'In startGameHandler function waitForOutOfMoney !');
    //     if (params.channel.channelType !== stateOfX.gameType.normal) {
    //         return cb(null, params);
    //     } else {
    //         pomelo.app.rpc.database.tableRemote.getTableAttrib(params.session, { channelId: params.channelId, key: "players" }, function (getPlayersRes) {
    //             if (getPlayersRes.success) {
    //                 var players = getPlayersRes.value;
    //                 params.tablePlayersForBroadcast = players; // for server down thing
    //                 var bankruptCount = _.where(players, { state: stateOfX.playerState.outOfMoney }).length;
    //                 if (bankruptCount > 0) {
    //                     var bplayers = players.map(function ({ playerId, chips, state }) {
    //                         return { playerId, chips, state };
    //                     })
    //                     broadcastHandler.fireTablePlayersBroadcast({ channelId: params.channelId, channel: params.channel, players: bplayers, removed: [] })
    //                     setTimeout(cb.bind(null, null, params), systemConfig.waitForOutOfMoneySeconds * 1000);
    //                 } else {
    //                     return cb(null, params);
    //                 }
    //             } else {
    //                 return cb(null, params);
    //             }
    //         })
    //     }
    // }
    /*==============================  END  ==========================*/

    /*==============================  END  ==========================*/

    // New
    async startGameProcess(params: any): Promise<any> {
        const channelId = params.channelId;
    

        // Pomelo Connection
        const startGameProcessRes = await pomelo.app.rpc.database.tableRemote.startGameProcess(
            params.session,
            { channelId: params.channelId }
        );
        // Pomelo Connection
    
        console.log("================== startGameProcess=================", startGameProcessRes);
    
        if (startGameProcessRes.success) {
            params.data = startGameProcessRes.data;
            params.data.players = startGameProcessRes.data.vgsResponse.players;
            params.data.preGameState = startGameProcessRes.data.vgsResponse.preGameState;
            params.table = startGameProcessRes.table;
    
            // Set roundId in Pomelo channel if available
            const pomeloChannel = pomelo.app.get('channelService').channels[channelId];
            if (pomeloChannel) {
                pomeloChannel.roundId = params.table.roundId;
            }
    
            if (startGameProcessRes.data.vgsResponse.startGame) {
                params.channel.roundId = params.table.roundId;
    
                this.channelTimerHandler.killChannelTurnTimer({ channel: params.channel, channelId: params.channelId });
                this.channelTimerHandler.killTableIdleTimer({ channel: params.channel });
            }
    
            if (params.table.state !== stateOfX.gameState.running) {
                this.channelTimerHandler.killChannelTurnTimer(params);
            }
    
        }
    } 
    // Old
    // const startGameProcess = function (params, cb) {
    //     let channelId = params.channelId;
    //     serverLog(stateOfX.serverLogType.info, 'In startGameHandler function startGameProcess!');
    //     pomelo.app.rpc.database.tableRemote.startGameProcess(params.session, { channelId: params.channelId }, function (startGameProcessRes) {
    //         console.log("================== startGameProcess=================", startGameProcessRes)
    //         if (startGameProcessRes.success) {
    //             params.data = startGameProcessRes.data;
    //             params.data.players = startGameProcessRes.data.vgsResponse.players;
    //             params.data.preGameState = startGameProcessRes.data.vgsResponse.preGameState;
    //             params.table = startGameProcessRes.table;
    //             // New Condition Added For Missing RoundId In Pomelo Channel
    //             if (pomelo.app.get('channelService').channels[channelId]) pomelo.app.get('channelService').channels[channelId].roundId = params.table.roundId;
    //             // New Condition Ends
    //             // if (params.channel.channelType === stateOfX.gameType.tournament) {
    //             //   tournamentActionHandler.handleDynamicRanks({ session: params.session, tournamentId: params.table.tournamentRules.tournamentId, gameVersionCount: params.table.tournamentRules.gameVersionCount });
    //             // }
    //             if (startGameProcessRes.data.vgsResponse.startGame) {
    //                 serverLog(stateOfX.serverLogType.info, 'table round id: ' + JSON.stringify(params.table))
    //                 params.channel.roundId = params.table.roundId; // Set current roundId to channel level
    //                 serverLog(stateOfX.serverLogType.info, 'channel round id: ', params.channel);
    //                 channelTimerHandler.killChannelTurnTimer({ channel: params.channel, channelId: params.channelId });
    //                 channelTimerHandler.killTableIdleTimer({ channel: params.channel });
    //             }
    //             if (params.table.state !== stateOfX.gameState.running) {
    //                 channelTimerHandler.killChannelTurnTimer(params);
    //             }
    //             cb(null, params);
    //         } else {
    //             cb(null, params);
    //         }
    //     })
    // }
    /*==============================  END  ==========================*/

    /*==============================  START  ==========================*/

    // New
    async validateCurrentPlayers (params: any): Promise<any> {

        const result = await this.imdb.getTable(params.channelId);
    
        if (!!result) {
            const newPlayerData = result.players.map((player: any) => ({
                playerId: player.playerId,
                playerName: player.playerName,
                channelId: params.channelId,
                bestHands: player.bestHands,
                seatIndex: player.seatIndex,
                chips: player.chips + player.totalRoundBet,
                state: player.state,
                moves: player.moves
            }));
    
            params.playersData = newPlayerData;
        }
    
        return params;
    };
    
    // Old
    // const validateCurrentPlayers = function (params, cb) {
    //     imdb.getTable(params.channelId, function (err, result) {
    //         if (!!result) {
    //             var newPlayerData = [];
    //             for (var i = 0; i < result.players.length; i++) {
    //                 var tepObj = {
    //                     playerId: result.players[i].playerId,
    //                     playerName: result.players[i].playerName,
    //                     channelId: params.channelId,
    //                     bestHands: result.players[i].bestHands,
    //                     seatIndex: result.players[i].seatIndex,
    //                     chips: result.players[i].chips + result.players[i].totalRoundBet,
    //                     state: result.players[i].state,
    //                     moves: result.players[i].moves
    //                 };
    //                 newPlayerData.push(tepObj);
    //             }
    //             params.playersData = newPlayerData;
    //         }
    //         cb(null, params);
    //     })
    // }
    /*==============================  END  ==========================*/


    /*==============================  START  ==========================*/
    // broadcast game players
    // game start or not
    // states and chips - mainly

    // New
    async fireGamePlayersBroadcast(params: any): Promise<any> {
        if (!params.eventName) {
            return {
                success: false,
                isRetry: false,
                isDisplay: false,
                channelId: (params.channelId || ""),
                info: popupTextManager.falseMessages.FIREGAMEPLAYERSBROADCASTFAIL_STARTGAMEHANDLER
            };
        }
    
        if (params.data.preGameState !== stateOfX.gameState.idle) {
            return params;
        }
    
        // Added to avoid two buyin popup
        for (const player of params.data.dataPlayers) {
            if (params.data.vgsResponse.startGame) {
                const fullPlayer = _.find(params.data.players, { playerId: player.playerId });
                player.isPartOfGame = fullPlayer?.active;
            }
            if (
                player.state === stateOfX.playerState.outOfMoney &&
                player.chips <= 0 &&
                params.eventName !== 'RESUME'
            ) {
                this.broadcastHandler.fireBankruptBroadcast({
                    playerId: player.playerId,
                    channelId: params.channelId,
                    fromJoinWaitList: false
                });
            }
        }
    
        if (params.data.vgsResponse.startGame) {
            params.channel.gameStartEventSet = stateOfX.startGameEventOnChannel.running;
    
            if (params.channel.channelType !== stateOfX.gameType.normal) {
                for (let i = 0; i < params.data.dataPlayers.length; i++) {
                    if (
                        params.data.dataPlayers[i].tournamentData &&
                        params.data.dataPlayers[i].tournamentData.isTournamentSitout
                    ) {
                        params.data.dataPlayers[i].state = stateOfX.playerState.onBreak;
                    }
                }
            }
    
            for (const player of params.data.dataPlayers) {
                const fullPlayer = _.find(params.data.players, { playerId: player.playerId });
                player.isPartOfGame = fullPlayer?.active;
            }
    
            this.broadcastHandler.fireTablePlayersBroadcast({
                channelId: params.channelId,
                channel: params.channel,
                players: params.data.dataPlayers,
                removed: params.data.vgsResponse.removed
            });
    
            return params;
        }
    
        params.channel.gameStartEventSet = stateOfX.startGameEventOnChannel.idle;
        params.channel.gameStartEventName = null;
        params.channel.roundId = "";
    
        this.broadcastHandler.fireTablePlayersBroadcast({
            channelId: params.channelId,
            channel: params.channel,
            players: params.data.dataPlayers,
            removed: params.data.vgsResponse.removed
        });
    
        return params;
    };    

    // Old
    // const fireGamePlayersBroadcast = function (params, cb) {
    //     if (!params.eventName) {
    //         cb({ success: false, isRetry: false, isDisplay: false, channelId: (params.channelId || ""), info: popupTextManager.falseMessages.FIREGAMEPLAYERSBROADCASTFAIL_STARTGAMEHANDLER });
    //         return false;
    //     }
    //     if (params.data.preGameState !== stateOfX.gameState.idle) {
    //         cb(null, params);
    //         return false;
    //     }

    //     // added to avoid two buyin popup
    //     _.each(params.data.dataPlayers, (player) => {
    //         if (params.data.vgsResponse.startGame) {
    //             let fullPlayer = _.find(params.data.players, { playerId: player.playerId });
    //             player.isPartOfGame = fullPlayer.active;
    //         }
    //         if (player.state == stateOfX.playerState.outOfMoney && player.chips <= 0 && params.eventName != 'RESUME') {
    //             broadcastHandler.fireBankruptBroadcast({ playerId: player.playerId, channelId: params.channelId, fromJoinWaitList: false });
    //         }
    //     })

    //     if (params.data.vgsResponse.startGame) {
    //         params.channel.gameStartEventSet = stateOfX.startGameEventOnChannel.running;
    //         if (params.channel.channelType !== stateOfX.gameType.normal) {
    //             for (var i = 0; i < params.data.dataPlayers.length; i++) {
    //                 console.log("params.data.dataPlayers[i].tournamentData 444444444", params.data.dataPlayers[i])
    //                 if (params.data.dataPlayers[i].tournamentData && params.data.dataPlayers[i].tournamentData.isTournamentSitout) {
    //                     params.data.dataPlayers[i].state = stateOfX.playerState.onBreak;
    //                 }
    //             }
    //         }
    //         _.each(params.data.dataPlayers, (player) => {
    //             let fullPlayer = _.find(params.data.players, { playerId: player.playerId });
    //             player.isPartOfGame = fullPlayer.active;
    //         })
    //         // console.error('====+++++++', params.data)
    //         broadcastHandler.fireTablePlayersBroadcast({ channelId: params.channelId, channel: params.channel, players: params.data.dataPlayers, removed: params.data.vgsResponse.removed });
    //         // firePlayerChipsLobbyBroadcast(pomelo.app, params.channelId, params.channel.channelType, params.data.dataPlayers);
    //         cb(null, params);
    //         return true;
    //     }

    //     params.channel.gameStartEventSet = stateOfX.startGameEventOnChannel.idle;
    //     params.channel.gameStartEventName = null;
    //     params.channel.roundId = "";

    //     broadcastHandler.fireTablePlayersBroadcast({ channelId: params.channelId, channel: params.channel, players: params.data.dataPlayers, removed: params.data.vgsResponse.removed });
    //     //not need at present commented by Sonu Yadav
    //     //firePlayerChipsLobbyBroadcast(pomelo.app, params.channelId, params.channel.channelType, params.data.dataPlayers);
    //     cb(null, params);
    //     return true;
    // }
    /*==============================  END  ==========================*/

    /*==============================  START  ==========================*/

    // New
    async firePlayerSettings(params: any): Promise<any> {
        let settings: any;
        params.table.table = [];
        params.table.cards = [];
        params.table.data = [];
    
        for (let i = 0; i < params.table.players.length; i++) {
            settings = {};
            settings.table = {};
            settings.player = {};
            settings.player.playerCallTimer = {};
    
            settings.table.channelId = params.table.channelId;
    
            const player = params.table.players[i];
            settings.player.playerId = player.playerId;
            settings.player.seatIndex = player.seatIndex;
            settings.player.playerName = player.playerName;
            settings.player.RITstatus = player.isRunItTwice;
            settings.player.state = player.state;
            settings.channel = params.channel;
    
            settings.player.playerCallTimer.channelId = params.table.channelId;
            settings.player.playerCallTimer.playerId = player.playerId;
            settings.player.playerCallTimer.timer =
                player.playerCallTimer.timer -
                Math.floor((Date.now() - player.playerCallTimer.createdAt) / systemConfig.secondToMinutsConvert);
    
            if (
                player.callTimeGameMissed > 0 &&
                player.callTimeGameMissed <= params.table.ctEnabledBufferHand
            ) {
                console.log("===================timerInSeconds============= 4", params);
                settings.player.playerCallTimer.isCallTimeOver = true;
            }
    
            console.log("====================================timerInSeconds 111111111===============", player.callTimeGameMissed);
            console.log("====================================timerInSeconds 111111111=================", player.callTimeGameMissed);
            console.log("====================================timerInSeconds 111111111======================", params.table.ctEnabledBufferHand);
    
            if (
                player.playerCallTimer.status &&
                settings.player.playerCallTimer.timer >= 1
            ) {
                console.log("timerInSeconds 5");
                settings.player.playerCallTimer.status = player.playerCallTimer.status;
                settings.player.playerCallTimer.timer = settings.player.playerCallTimer.timer;
                settings.player.playerCallTimer.timerInSeconds =
                    systemConfig.playerCallTime * 60 -
                    Math.floor((Date.now() - player.playerCallTimer.createdAt) / 1000);
                settings.player.playerCallTimer.createdAt = player.playerCallTimer.createdAt;
                settings.player.playerCallTimer.isCallTimeOver = player.playerCallTimer.isCallTimeOver;
                settings.player.callTimeGameMissed = 0;
            } else {
                console.log("timerInSeconds 6", player.playerCallTimer.isCallTimeOver);
                settings.player.playerCallTimer.timer = 0;
                settings.player.playerCallTimer.timerInSeconds = 0;
                settings.player.playerCallTimer.status = false;
                settings.player.playerCallTimer.createdAt = 0;
    
                if (player.playerCallTimer.isCallTimeOver !== "null") {
                    settings.player.playerCallTimer.isCallTimeOver = player.playerCallTimer.isCallTimeOver;
                } else {
                    settings.player.playerCallTimer.isCallTimeOver = undefined;
                }
            }
    
            if (player.state === stateOfX.playerState.waiting) {
                settings.player.isForceBlindVisible = player.isForceBlindVisible;
            } else {
                settings.player.isForceBlindVisible = false;
                await this.imdb.updatePlayerAPB(params.table.channelId, settings.player.playerId, false);
            }
    
            this.broadcastHandler.playerSettings(settings);
        }
    
        return params;
    };
    

    // Old
    // const firePlayerSettings = function (params, cb) {
    //     var settings;
    //     params.table.table = [];
    //     params.table.cards = [];
    //     params.table.data = [];
    //     for (let i = 0; i < params.table.players.length; i++) {
    //         settings = {};
    //         settings.table = {};
    //         settings.player = {};
    //         settings.player.playerCallTimer = {};
    //         settings.table.channelId = params.table.channelId;
    //         settings.player.playerId = params.table.players[i].playerId;
    //         settings.player.seatIndex = params.table.players[i].seatIndex;
    //         settings.player.playerName = params.table.players[i].playerName;
    //         settings.player.RITstatus = params.table.players[i].isRunItTwice;
    //         settings.player.state = params.table.players[i].state;
    //         settings.channel = params.channel;

    //         settings.player.playerCallTimer.channelId = params.table.channelId;
    //         settings.player.playerCallTimer.playerId = params.table.players[i].playerId;
    //         settings.player.playerCallTimer.timer = params.table.players[i].playerCallTimer.timer - (Math.floor((Date.now() - params.table.players[i].playerCallTimer.createdAt) / systemConfig.secondToMinutsConvert));

    //         if (params.table.players[i].callTimeGameMissed > 0 && params.table.players[i].callTimeGameMissed <= params.table.ctEnabledBufferHand) {
    //             console.log("===================timerInSeconds============= 4", params);
    //             settings.player.playerCallTimer.isCallTimeOver = true;
    //         }
    //         console.log("====================================timerInSeconds 111111111===============", params.table.players[i].callTimeGameMissed);
    //         console.log("====================================timerInSeconds 111111111=================", params.table.players[i].callTimeGameMissed);
    //         console.log("====================================timerInSeconds 111111111======================", params.table.ctEnabledBufferHand);
    //         // Removed the condition from below - CT value was disapperaing
    //         // && params.table.players[i].playerCallTimer.timer <= systemConfig.playerCallTime
    //         if (params.table.players[i].playerCallTimer.status && settings.player.playerCallTimer.timer >= 1) {
    //             console.log("timerInSeconds 5");
    //             settings.player.playerCallTimer.status = params.table.players[i].playerCallTimer.status;
    //             settings.player.playerCallTimer.timer = settings.player.playerCallTimer.timer;
    //             settings.player.playerCallTimer.timerInSeconds = (systemConfig.playerCallTime * 60) - Math.floor((Date.now() - params.table.players[i].playerCallTimer.createdAt) / 1000);
    //             settings.player.playerCallTimer.createdAt = params.table.players[i].playerCallTimer.createdAt;
    //             // Adding isCallTimeOver in the broadcast
    //             settings.player.playerCallTimer.isCallTimeOver = params.table.players[i].playerCallTimer.isCallTimeOver;
    //             settings.player.callTimeGameMissed = 0;
    //         } else {
    //             console.log("timerInSeconds 6", params.table.players[i].playerCallTimer.isCallTimeOver);
    //             settings.player.playerCallTimer.timer = 0;
    //             settings.player.playerCallTimer.timerInSeconds = 0;
    //             settings.player.playerCallTimer.status = false;
    //             settings.player.playerCallTimer.createdAt = 0;
    //             if (params.table.players[i].playerCallTimer.isCallTimeOver != "null") {
    //                 settings.player.playerCallTimer.isCallTimeOver = params.table.players[i].playerCallTimer.isCallTimeOver;
    //             }
    //             else {
    //                 settings.player.playerCallTimer.isCallTimeOver;
    //             }
    //         }

    //         if (params.table.players[i].state == stateOfX.playerState.waiting) {
    //             settings.player.isForceBlindVisible = params.table.players[i].isForceBlindVisible;
    //         } else {
    //             settings.player.isForceBlindVisible = false;
    //             imdb.updatePlayerAPB(params.table.channelId, settings.player.playerId, false, function (err, result) {
    //             })
    //         }
    //         broadcastHandler.playerSettings(settings);
    //     }
    //     cb(null, params);
    // }
    /*==============================  END  ==========================*/

    /*==============================  START  ==========================*/
    // Start seat reserve timer for players with OUTOFMONEY state
    // wait has been done

    // New
    async setOnBreakAndStartReserveTimer(params: any): Promise<any> {
    
        if (params.channel.channelType !== stateOfX.gameType.normal) {
            return params;
        }
    
        for (const player of params.data.players) {
    
            if (player.state === stateOfX.playerState.outOfMoney) {
                const setPlayerAttribResponse = await pomelo.app.rpc.database.tableRemote.setPlayerAttrib(
                    params.session,
                    {
                        playerId: player.playerId,
                        channelId: params.channelId,
                        key: "state",
                        value: stateOfX.playerState.onBreak
                    }
                );
    
                if (setPlayerAttribResponse.success) {
                    this.broadcastHandler.firePlayerStateBroadcast({
                        channel: params.channel,
                        playerId: player.playerId,
                        channelId: params.channelId,
                        state: stateOfX.playerState.onBreak
                    });
                } else {
                    throw {
                        success: false,
                        isRetry: false,
                        isDisplay: false,
                        channelId: (params.channelId || ""),
                        info: popupTextManager.falseMessages.SETONBREAKANDSTARTRESERVETIMERFAIL_STARTGAMEHANDLER
                    };
                }
            } else {
                console.log(stateOfX.serverLogType.info, player.playerName + ' is not bankrupt and in state - ' + player.state);
            }
        }
    
        console.log(stateOfX.serverLogType.info, 'ON GAME START || Setting bankrupt players state as onbreak - SUCCESS');
        return params;
    };
    
    // Old
    // const setOnBreakAndStartReserveTimer = function (params, cb) {
    //     console.log("inside setOnBreakAndStartReserveTimer 958")
    //     serverLog(stateOfX.serverLogType.info, 'In startGameHandler function setOnBreakAndStartReserveTimer !');


    //     if (params.channel.channelType !== stateOfX.gameType.normal) {
    //         serverLog(stateOfX.serverLogType.info, 'This is a tournament so skipping bankrupt player to SITOUT and start seat reserve timer!');
    //         cb(null, params);
    //         return true;
    //     }

    //     async.each(params.data.players, function (player, ecb) {
    //         serverLog(stateOfX.serverLogType.info, 'Processing player for bankrupt to onBreak - ' + JSON.stringify(player));
    //         if (player.state === stateOfX.playerState.outOfMoney) {
    //             pomelo.app.rpc.database.tableRemote.setPlayerAttrib(params.session, { playerId: player.playerId, channelId: params.channelId, key: "state", value: stateOfX.playerState.onBreak }, function (setPlayerAttribResponse) {
    //                 if (setPlayerAttribResponse.success) {
    //                     serverLog(stateOfX.serverLogType.info, player.playerName + ' is bankrupt and onBreak now.');
    //                     broadcastHandler.firePlayerStateBroadcast({ channel: params.channel, playerId: player.playerId, channelId: params.channelId, state: stateOfX.playerState.onBreak });
    //                     ecb();
    //                 } else {
    //                     ecb({ success: false, isRetry: false, isDisplay: false, channelId: (params.channelId || ""), info: popupTextManager.falseMessages.SETONBREAKANDSTARTRESERVETIMERFAIL_STARTGAMEHANDLER });
    //                     //ecb({success: false, channelId: params.channelId, info: "Setting bankrupt player state as onbreak failed!"});
    //                 }
    //             });
    //         } else {
    //             serverLog(stateOfX.serverLogType.info, player.playerName + ' is not bankrupt and in state - ' + player.state);
    //             ecb();
    //         }
    //     }, function (err) {
    //         if (err) {
    //             serverLog(stateOfX.serverLogType.info, 'ON GAME START || Setting bankrupt players state as onbreak - FAILED')
    //         } else {
    //             serverLog(stateOfX.serverLogType.info, 'ON GAME START || Setting bankrupt players state as onbreak - SUCCESS')
    //         }
    //         cb(null, params);
    //     });
    // }
    /*==============================  END  ==========================*/

    /*==============================  START  ==========================*/
    // Continue if Game is going to start or not

    // New
    async checkGameStart(params: any): Promise<any> {
    
        if (params.data.vgsResponse && params.data.vgsResponse.startGame) {
            params.data.players = params.data.dcResponse.players;
            return params;
        } else {
            throw {
                success: false,
                isRetry: false,
                isDisplay: true,
                channelId: (params.channelId || ""),
                info: popupTextManager.falseMessages.CHECKGAMESTARTFAIL_STARTGAMEHANDLER
            };
        }
    };    

    // Old
    // const checkGameStart = function (params, cb) {
    //     console.log('paramsDataPlayers', params.data.players);

    //     if (params.data.vgsResponse && params.data.vgsResponse.startGame) {
    //         params.data.players = params.data.dcResponse.players;
    //         // console.log('paramsDataPlayers', params.data.players);
    //         cb(null, params);
    //     } else {
    //         cb({ success: false, isRetry: false, isDisplay: true, channelId: (params.channelId || ""), info: popupTextManager.falseMessages.CHECKGAMESTARTFAIL_STARTGAMEHANDLER });
    //         //cb({success: false, channelId: params.channelId, info: 'No need to start game in this case!'});
    //     }
    // }
    /*==============================  END  ==========================*/


    /*==============================  START  ==========================*/
    // Set configuration on the table (Dealer, Small Blind, Big Blind and Straddle players)
    // deprecated

    // New
    async setGameConfig(params: any): Promise<any> {

        // Pomelo Connection
        const setGameConfigResponse = await new Promise<any>((resolve) => {
            pomelo.app.rpc.database.tableRemote.setGameConfig(params.session, { channelId: params.channelId }, (res: any) => {
                resolve(res);
            });
        });
        // Pomelo Connection
    
    
        if (setGameConfigResponse.success) {
            return params;
        } else {
            if (systemConfig.playerAutoMoveRequired) {
                this.broadcastHandler.fireDealerChat({
                    channel: params.channel,
                    channelId: params.channelId,
                    message: ' Error while setting table config  - ' + JSON.stringify(setGameConfigResponse)
                });
            }
            throw setGameConfigResponse;
        }
    };
    
    // Old
    // const setGameConfig = function (params, cb) {
    //     pomelo.app.rpc.database.tableRemote.setGameConfig(params.session, { channelId: params.channelId }, function (setGameConfigResponse) {
    //         serverLog(stateOfX.serverLogType.info, 'setGameConfigResponse', setGameConfigResponse)
    //         if (setGameConfigResponse.success) {
    //             cb(null, params);
    //         } else {
    //             serverLog(stateOfX.serverLogType.error, ' Error while setting table config  - ' + JSON.stringify(setGameConfigResponse));
    //             if (systemConfig.playerAutoMoveRequired) {
    //                 broadcastHandler.fireDealerChat({ channel: params.channel, channelId: params.channelId, message: ' Error while setting table config  - ' + JSON.stringify(setGameConfigResponse) });
    //             }
    //             cb(setGameConfigResponse);
    //         }
    //     });
    // }
    /*==============================  END  ==========================*/


    /*==============================  END  ==========================*/
    // Distribute cards to players
    // deprecated

    // New
    async distributecards(params: any): Promise<any> {

        // Pomelo Connection
        const distributecardsResponse = await new Promise<any>((resolve) => {
            pomelo.app.rpc.database.tableRemote.distributecards(
                params.session,
                { channelId: params.channelId },
                (res: any) => resolve(res)
            );
        });
        // Pomelo Connection
    
        if (distributecardsResponse.success) {
            params.data.players = distributecardsResponse.players;
            return params;
        } else {
            throw distributecardsResponse;
        }
    };    

    // Old
    // const distributecards = function (params, cb) {
    //     pomelo.app.rpc.database.tableRemote.distributecards(params.session, { channelId: params.channelId }, function (distributecardsResponse) {
    //         if (distributecardsResponse.success) {
    //             params.data.players = distributecardsResponse.players;
    //             cb(null, params);
    //         } else {
    //             cb(distributecardsResponse);
    //         }
    //     });
    // }
    /*==============================  END  ==========================*/


    /*==============================  START  ==========================*/
    // Fire broadcast for card distribution

    // New
    async fireCardDistributeBroadcast(params: any): Promise<any> {
    
        const players: any[] = [];
        for (let i = 0; i < params.data.players.length; i++) {
            if (params.data.players[i].active === true) {
                players[i] = params.data.players[i];
            }
        }
    
        const fireCardDistributeBroadcastResponse = await this.broadcastHandler.fireCardDistributeBroadcast({
            channel: params.channel,
            players,
            channelId: params.channelId
        });
    
        if (fireCardDistributeBroadcastResponse.success) {
            return params;
        } else {
            throw fireCardDistributeBroadcastResponse;
        }
    };
    
    

    // Old
    // const fireCardDistributeBroadcast = function (params, cb) {
    //     console.log("inside fireCardDistributeBroadcast 1040")
    //     var players = []
    //     for (var i = 0; i < params.data.players.length; i++) {
    //         // if (params.data.players[i].state === stateOfX.playerState.playing) {
    //         if (params.data.players[i].active === true) {
    //             players[i] = params.data.players[i];
    //         }
    //     }
    //     broadcastHandler.fireCardDistributeBroadcast({ channel: params.channel, players: players, channelId: params.channelId }, function (fireCardDistributeBroadcastResponse) {
    //         if (fireCardDistributeBroadcastResponse.success) {
    //             cb(null, params);
    //         } else {
    //             cb(fireCardDistributeBroadcastResponse);
    //         }
    //     });
    // }
    /*==============================  END  ==========================*/


    /*==============================  START  ==========================*/
    /**
     * increment hands played count for the player(in profile.statistics)
     * @method updateEveryPlayerStats
     * @param  {Object}          params   data from waterfall
     * @param  {Function}        cb       callback function
     */

    // New
    async updateEveryPlayerStats(params: any): Promise<any> {

        const playerIds = params.data.players.map((player: any) => player.playerId);
    
        let keyName: string;
        if (params.table && params.table.isRealMoney) {
            keyName = "statistics.handsPlayedRM";
        } else {
            keyName = "statistics.handsPlayedPM";
        }
    
        const res = await pomelo.app.rpc.database.userRemote.updateStats('session', { 
            playerIds: playerIds, 
            data: { [keyName]: 1 }, 
            bySystem: true 
        });
    
        console.log(stateOfX.serverLogType.info, 'done --- app.rpc.logic.userRemote.incrementInProfile' + JSON.stringify(res));
    
        return params;
    };
    

    // Old
    // const updateEveryPlayerStats = function (params, cb) {
    //     var playerIds = _.pluck(params.data.players, 'playerId');
    //     if (params.table && params.table.isRealMoney) {
    //         var keyName = "statistics.handsPlayedRM"
    //     } else {
    //         var keyName = "statistics.handsPlayedPM"
    //     }
    //     pomelo.app.rpc.database.userRemote.updateStats('session', { playerIds: playerIds, data: { [keyName]: 1 }, bySystem: true }, function (res) {
    //         serverLog(stateOfX.serverLogType.info, 'done --- app.rpc.logic.userRemote.incrementInProfile' + JSON.stringify(res));
    //     })
    //     cb(null, params);
    // }
    /*==============================  END  ==========================*/

    /*==============================  START  ==========================*/
    // Deduct blinds on table (includes straddle if required)
    // deprecated

    // New
    async deductBlinds(params: any): Promise<any> {

        // Pomelo Connection
        const deductBlindsResponse = await pomelo.app.rpc.database.tableRemote.deductBlinds(params.session, { channelId: params.channelId });
        // Pomelo Connection
    
        if (deductBlindsResponse.success) {
            params.data.deductBlindsResponse = deductBlindsResponse;
        } else {
            throw new Error(JSON.stringify(deductBlindsResponse));
        }
    
        return params;
    };    

    // Old
    // const deductBlinds = function (params, cb) {
    //     pomelo.app.rpc.database.tableRemote.deductBlinds(params.session, { channelId: params.channelId }, function (deductBlindsResponse) {
    //         if (deductBlindsResponse.success) {
    //             params.data.deductBlindsResponse = deductBlindsResponse;
    //             cb(null, params);
    //         } else {
    //             cb(deductBlindsResponse);
    //         }

    //     });
    // }
    /*==============================  END  ==========================*/


    /*==============================  START  ==========================*/
    // Fire deduct blind broadcast

    // New
    async fireDeductBlindBroadcast(params: any): Promise<any> {
        console.log("inside fireDeductBlindBroadcast 1093");
    
        const fireDeductBlindBroadcastResponse = await this.broadcastHandler.fireDeductBlindBroadcast({ 
            channel: params.channel, 
            data: params.data.dbResponse 
        });
    
        if (fireDeductBlindBroadcastResponse.success) {
            return params;
        } else {
            throw new Error(JSON.stringify(fireDeductBlindBroadcastResponse));
        }
    };
    

    // Old
    // const fireDeductBlindBroadcast = function (params, cb) {
    //     console.log("inside fireDeductBlindBroadcast 1093")
    //     broadcastHandler.fireDeductBlindBroadcast({ channel: params.channel, data: params.data.dbResponse }, function (fireDeductBlindBroadcastResponse) {
    //         if (fireDeductBlindBroadcastResponse.success) {
    //             cb(null, params);
    //         } else {
    //             cb(fireDeductBlindBroadcastResponse);
    //         }
    //     });
    // }
    /*==============================  END  ==========================*/

    /*==============================  END  ==========================*/
    // Fire start game broadcast on channel

    // New
    async fireStartGameBroadcast(params: any): Promise<any> {
        try {
            // Fetch table config
            const tableConfigResponse = await pomelo.app.rpc.database.tableRemote.tableConfig(params.session, { channelId: params.channelId });
    
    
            if (tableConfigResponse.success) {
                tableConfigResponse.config.isPotLimit = tableConfigResponse.eventDetails.tableDetails.isPotLimit;
                params.data.tableDetails = tableConfigResponse;
                params.broadcastData = tableConfigResponse.config;
    
                // Fire start game broadcast
                const fireStartGameBroadcastReseponse = await this.broadcastHandler.fireStartGameBroadcast(params);
    
    
                if (fireStartGameBroadcastReseponse.success) {
                    // Set timeout for the first turn
                    params.channel.firstTurnTimer = setTimeout(async () => {
                        // Send player turn broadcast
                        const fireOnTurnBroadcastResponse = await this.broadcastHandler.fireOnTurnBroadcast({
                            ...params.broadcastData, 
                            channel: params.channel, 
                            playerId: '', 
                            amount: 0, 
                            action: 'CHECK', 
                            chips: 0, 
                            totalRoundBet: 0
                        });
    
                        if (fireOnTurnBroadcastResponse.success) {
                            this.channelTimerHandler.startTurnTimeOut(params);
                        } else {
                            console.log(stateOfX.serverLogType.error, 'Unable to broadcast turn, in Game start auto turn condition!');
                        }
                    }, 1000 * 1.5, params);
    
                    return params;
                } else {
                    throw new Error(JSON.stringify(fireStartGameBroadcastReseponse));
                }
            } else {
                console.log(stateOfX.serverLogType.error, 'startGame broadcast failed !' + JSON.stringify(tableConfigResponse));
                throw new Error(JSON.stringify(tableConfigResponse));
            }
        } catch (error) {
            throw error;
        }
    };    

    // Old
    // const fireStartGameBroadcast = function (params, cb) {
    //     pomelo.app.rpc.database.tableRemote.tableConfig(params.session, { channelId: params.channelId }, function (tableConfigResponse) {

    //         serverLog(stateOfX.serverLogType.info, 'Start game response from remote - ' + JSON.stringify(tableConfigResponse));

    //         if (tableConfigResponse.success) {
    //             tableConfigResponse.config.isPotLimit = tableConfigResponse.eventDetails.tableDetails.isPotLimit;
    //             params.data.tableDetails = tableConfigResponse;
    //             params.broadcastData = tableConfigResponse.config;
    //             broadcastHandler.fireStartGameBroadcast(params, function (fireStartGameBroadcastReseponse) {
    //                 serverLog(stateOfX.serverLogType.info, 'fireStartGameBroadcastReseponse')
    //                 serverLog(stateOfX.serverLogType.info, fireStartGameBroadcastReseponse);
    //                 if (fireStartGameBroadcastReseponse.success) {
    //                     params.channel.firstTurnTimer = setTimeout(function (params) {
    //                         // only if move is needed : currentMoveIndex >= 1 (for seatIndex) : TODO maybe
    //                         // Send player turn broadcast to channel level
    //                         broadcastHandler.fireOnTurnBroadcast(Object.assign({}, params.broadcastData, { channel: params.channel, playerId: '', amount: 0, action: 'CHECK', chips: 0, totalRoundBet: 0 }), function (fireOnTurnBroadcastResponse) {
    //                             if (fireOnTurnBroadcastResponse.success) {
    //                                 channelTimerHandler.startTurnTimeOut(params);
    //                             } else {
    //                                 serverLog(stateOfX.serverLogType.error, 'Unable to broadcast turn, in Game start auto turn condition!');
    //                             }
    //                         });
    //                     }, 1000 * 1.5, params);

    //                     // channelTimerHandler.startTurnTimeOut(params);
    //                     cb(null, params);
    //                 } else {
    //                     cb(fireStartGameBroadcastReseponse);
    //                 }
    //             });
    //         } else {
    //             serverLog(stateOfX.serverLogType.error, 'startGame broadcast failed !' + JSON.stringify(tableConfigResponse));
    //             cb(tableConfigResponse);
    //         }
    //     });

    // }
    /*==============================  END  ==========================*/


    /*==============================  START  ==========================*/
    // Remove big blind missed players from table

    // New
    async removeBlindMissedPlayers(params: any): Promise<any> {
        if (params.channel.channelType !== stateOfX.gameType.normal) {
            console.log(stateOfX.serverLogType.info, 'This is a tournament so skipping standup player after BB missed case!');
            return params;
        }
    
        if (!!params.data.tableDetails.removed && params.data.tableDetails.removed.length >= 1) {
            console.log(stateOfX.serverLogType.info, 'There are players to be removed from table because of BB missed ! - ' + JSON.stringify(params.data.tableDetails.removed));
    
            try {
                // Use for-loop instead of async.each for handling asynchronous tasks in sequence
                for (const removedPlayer of params.data.tableDetails.removed) {
    
                    const responsePlayer = await this.getPlayerSessionServer(removedPlayer, params);
                    console.error(responsePlayer);
    
                    const leaveResponse = await this.getHitLeave(responsePlayer, params);
                    console.log(leaveResponse);
    
                    await this.fireRemoveBlindMissedPlayersBroadCast(params, responsePlayer, params.broadcastData.channelId);
                }
    
            } catch (err) {
                console.log(stateOfX.serverLogType.error, 'Error while removing player after BB missed ! - ' + JSON.stringify(err));
            }
        } else {
            console.log(stateOfX.serverLogType.info, 'No player found to be removed after BB missed !');
        }
    
        return params;
    };
    
    // Old
    // const removeBlindMissedPlayers = function (params, cb) {
    //     if (params.channel.channelType !== stateOfX.gameType.normal) {
    //         serverLog(stateOfX.serverLogType.info, 'This is a tournament so skipping standup player after BB missed case!');
    //         cb(null, params);
    //         return true;
    //     }

    //     if (!!params.data.tableDetails.removed && params.data.tableDetails.removed.length >= 1) {
    //         serverLog(stateOfX.serverLogType.info, 'There are players to be removed from table because of BB missed ! - ' + JSON.stringify(params.data.tableDetails.removed));
    //         async.each(params.data.tableDetails.removed, function (removedPlayer, ecb) {
    //             serverLog(stateOfX.serverLogType.info, 'Processing player to remove after BB missed ! - ' + JSON.stringify(removedPlayer));
    //             getPlayerSessionServer(removedPlayer, params, function (err, responsePlayer) {
    //                 console.error(responsePlayer);
    //                 getHitLeave(responsePlayer, params, function (err, leaveResponse) {
    //                     console.log(leaveResponse);
    //                     fireRemoveBlindMissedPlayersBroadCast(params, responsePlayer, params.broadcastData.channelId)
    //                     ecb();
    //                 })
    //             })
    //             // params.self.leaveTable(removedPlayer, params.session, function(leaveTableResponse){
    //             //   console.error(params,"!!!!!!@@@@@@@@@@@#########$$$$$$$$$$$",leaveTableResponse);
    //             //   serverLog(stateOfX.serverLogType.info, 'Player has been removed successfully after BB missed');
    //             //   fireRemoveBlindMissedPlayersBroadCast(params,removedPlayer.playerId,params.broadcastData.channelId);
    //             // });
    //         }, function (err) {
    //             if (err) {
    //                 serverLog(stateOfX.serverLogType.error, 'Error while removing player after BB missed ! - ' + JSON.stringify(err));
    //             } else {
    //                 serverLog(stateOfX.serverLogType.info, 'All players has been removed successfully after BB missed !');
    //             }
    //         });
    //     } else {
    //         serverLog(stateOfX.serverLogType.info, 'No player found to be removed after BB missed !');
    //     }
    //     cb(null, params);
    // }
    /*==============================  END  ==========================*/


    /*==============================  START  ==========================*/
    // get db player session object

    // New
    getPlayerSessionServer(player: any, params: any): Promise<any> {
        // Simulate the original behavior as no async database call is needed anymore
        player.serverId = 'connector-server-1';
        return player;
    };
    
    // Old
    // const getPlayerSessionServer = function (player, params, cb) {
    //     // serverLog(stateOfX.serverLogType.info, 'In channelTimerHandler in getPlayerSessionServer');
    //     // pomelo.app.rpc.database.dbRemote.findUserSessionInDB('', player.playerId, function (res) {
    //     //   if (res.success) {
    //     player.serverId = 'connector-server-1';
    //     cb(null, player);
    //     //   } else {
    //     //     cb(null, player);
    //     //   }
    //     // })
    // }
    /*==============================  END  ==========================*/

    /*==============================  END  ==========================*/
    // hit autoLeave for player

    // New
    async getHitLeave(player: any, params: any): Promise<any> {

    
        if (player.serverId) {
    
            const hitLeaveResponse = await pomelo.app.sysrpc['room'].msgRemote.forwardMessage(
                { forceFrontendId: "room-server-1" },
                {
                    body: { playerId: player.playerId, playerName: player.playerName, isStandup: true, channelId: params.channelId, isRequested: false, origin: 'blindMissed' },
                    route: "room.channelHandler.leaveTable"
                },
                this.sessionExport(params.session)
            );
                
            return player;
        } else {
            return player;
        }
    };
    

    // Old
    // getHitLeave(player, params, cb) {
    //     console.log('startGameHandler ', player)
    //     serverLog(stateOfX.serverLogType.info, 'In channelTimerHandler in getHitLeave');
    //     if (player.serverId) {
    //         console.log("rs3en45")

    //         pomelo.app.sysrpc['room'].msgRemote.forwardMessage(
    //             { forceFrontendId: "room-server-1" },
    //             {
    //                 body: { playerId: player.playerId, playerName: player.playerName, isStandup: true, channelId: params.channelId, isRequested: false, origin: 'blindMissed' },
    //                 route: "room.channelHandler.leaveTable"
    //             },
    //             sessionExport(params.session), function (err, hitLeaveResponse) {
    //                 serverLog(stateOfX.serverLogType.info, 'response of rpc-hitLeave' + JSON.stringify(hitLeaveResponse));
    //                 cb(null, player);
    //             }
    //         );

    //         // pomelo.app.rpc.connector.sessionRemote.hitLeave({ frontendId: player.serverId }, { playerId: player.playerId, playerName: player.playerName, isStandup: true, channelId: params.channelId, isRequested: false, origin: 'blindMissed' }, function (hitLeaveResponse) {
    //         //   serverLog(stateOfX.serverLogType.info, 'response of rpc-hitLeave' + JSON.stringify(hitLeaveResponse));
    //         //   cb(null, player);
    //         // })
    //     } else {
    //         cb(null, player);
    //     }
    // }
    /*==============================  END  ==========================*/


    /*==============================  START  ==========================*/
    // fire removed plaayers broadcast

    // New
    async fireRemoveBlindMissedPlayersBroadCast(params: any, player: any, channelId: string): Promise<void> {
        const filter = {
            playerId: player.playerId,
            channelId: channelId
        };
    
        try {
            const response = await this.db.getAntiBanking(filter);
    
            if (response) {
                const timeToNumber = Number(systemConfig.expireAntiBankingSeconds) + Number(systemConfig.antiBankingBuffer) - (Number(new Date()) - Number(response.createdAt)) / 1000;
                const isAntiBankingStatus = timeToNumber > 0;
    
                this.broadcastHandler.sendMessageToUser({
                    playerId: player.playerId,
                    serverId: player.serverId,
                    msg: {
                        playerId: player.playerId,
                        channelId: channelId,
                        isAntiBanking: isAntiBankingStatus,
                        timeRemains: timeToNumber,
                        amount: response.amount,
                        event: stateOfX.recordChange.playerLeaveTable
                    },
                    route: stateOfX.broadcasts.antiBankingUpdatedData
                });
    
            }
        } catch (err) {
            console.error('Error fetching Anti Banking data:', err);
        }
    };
    

    // Old
    // const fireRemoveBlindMissedPlayersBroadCast = function (params, player, channelId) {
    //     var filter = {};
    //     filter.playerId = player.playerId;
    //     filter.channelId = channelId;
    //     //console.error("!!!!!!!!!!!!!!!!!!!1",params);
    //     db.getAntiBanking(filter, function (err, response) {
    //         if (!err && response) {
    //             if (response != null) {
    //                 var timeToNumber = parseInt(systemConfig.expireAntiBankingSeconds) + parseInt(systemConfig.antiBankingBuffer) - (Number(new Date()) - Number(response.createdAt)) / 1000;
    //                 var isAntiBankingStatus = (timeToNumber > 0);
    //                 broadcastHandler.sendMessageToUser({ playerId: player.playerId, serverId: player.serverId, msg: { playerId: player.playerId, channelId: channelId, isAntiBanking: isAntiBankingStatus, timeRemains: timeToNumber, amount: response.amount, event: stateOfX.recordChange.playerLeaveTable }, route: stateOfX.broadcasts.antiBankingUpdatedData });
    //                 console.error(isAntiBankingStatus, "!!!!!!!@@@@@@@@@@@@Anti banking", timeToNumber);
    //             }
    //         }
    //     })
    // }
    /*==============================  END  ==========================*/


    /*==============================  START  ==========================*/
    // Fire precheck broadcast to individual players

    // New
    async firePrecheckBroadcast(params: any): Promise<void> {
        try {
            const getTableAttribResponse = await pomelo.app.rpc.database.tableRemote.getTableAttrib(params.session, { channelId: params.channelId, key: "preChecks" });
    
            if (getTableAttribResponse.success) {
                // Attach additional values to the response
                getTableAttribResponse.value.session = params.session;
                getTableAttribResponse.value.channelId = params.channelId;
                getTableAttribResponse.value.channel = params.channel;
    
                // Broadcast the precheck data
                this.broadcastHandler.firePrecheckBroadcast(getTableAttribResponse.value);
            } else {
                console.error('Error getting table attributes:', getTableAttribResponse);
            }
        } catch (err) {
            console.error('Error in firePrecheckBroadcast:', err);
        }
    };
    
    // Old
    // const firePrecheckBroadcast = function (params, cb) {
    //     pomelo.app.rpc.database.tableRemote.getTableAttrib(params.session, { channelId: params.channelId, key: "preChecks" }, function (getTableAttribResponse) {
    //         if (getTableAttribResponse.success) {
    //             // getTableAttribResponse.value.self      = params.self;
    //             getTableAttribResponse.value.session = params.session;
    //             getTableAttribResponse.value.channelId = params.channelId;
    //             getTableAttribResponse.value.channel = params.channel;

    //             broadcastHandler.firePrecheckBroadcast(getTableAttribResponse.value);
    //             cb(null, params);
    //         } else {
    //             cb(getTableAttribResponse);
    //         }
    //     });
    // }
    /*==============================  END  ==========================*/


    /*==============================  END  ==========================*/
    // tournament

    // New
    async killChannel(self: any, channels: any[]): Promise<void> {
    
        for (const channelObject of channels) {
            try {
                const channel = pomelo.app.get('channelService').getChannel(channelObject.channelId, false);
    
                if (channel) {
                    channel.isTable = false;
                    channel.destroy();
                    console.log(stateOfX.serverLogType.info, "channel destroyed successfully");
                } else {
                    console.log(stateOfX.serverLogType.info, "no channel found in pomelo");
                }
            } catch (err) {
                console.log(stateOfX.serverLogType.info, "error in deleting channel from pomelo:", err);
            }
        }
    
    };
    
    // Old
    // const killChannel = function (self, channels) {
    //     serverLog(stateOfX.serverLogType.info, "channels is in killChannel are - ", JSON.stringify(channels));
    //     async.each(channels, function (channelObject, callback) {
    //         //  serverLog(stateOfX.serverLogType.info,'===============');
    //         //  serverLog(stateOfX.serverLogType.info,"self",self);
    //         //  serverLog(stateOfX.serverLogType.info,"self.app",self.app);
    //         var channel = pomelo.app.get('channelService').getChannel(channelObject.channelId, false);
    //         if (channel) {
    //             channel.isTable = false;
    //             channel.destroy();
    //             serverLog(stateOfX.serverLogType.info, "channel destroy successfully");
    //             callback();
    //         } else {
    //             serverLog(stateOfX.serverLogType.info, "no channel found in pomelo");
    //             callback();
    //         }
    //     }, function (err) {
    //         if (err) {
    //             serverLog(stateOfX.serverLogType.info, "error in deleting channel from pomelo");
    //         } else {
    //             serverLog(stateOfX.serverLogType.info, "all channel deleted successfully in async");
    //         }
    //     })
    // }
    /*==============================  END  ==========================*/

    /*==============================  START  ==========================*/
    //decide tournament finished or not

    // New
    async decideTournamentFinished(tournamentId: string): Promise<any> {
        try {
            const tournament = await this.db.getTournamentRoom(tournamentId);
    
            if (!tournament) {
                return { success: false, isRetry: false, isDisplay: true, info: popupTextManager.falseMessages.DBGETTOURNAMENTROOMFAIL_TOURNAMENT, channelId: "" };
            }
    
            if (tournament.isLateRegistrationAllowed && Number(new Date()) <= (tournament.tournamentStartTime + tournament.lateRegistrationTime * 60 * 1000)) {
                return { success: false, isRetry: false, isDisplay: true, channelId: "" };
            } else {
                const decideTournamentFinished = tournament.state === "RUNNING" || tournament.state === "STARTED";
                console.log(stateOfX.serverLogType.info, 'decideTournamentFinished - ' + decideTournamentFinished);
                return { success: true, isRetry: false, isDisplay: true, channelId: "" };
            }
        } catch (err) {
            console.error('Error in deciding tournament finished:', err);
            return { success: false, isRetry: false, isDisplay: true, info: popupTextManager.falseMessages.DBGETTOURNAMENTROOMFAIL_TOURNAMENT, channelId: "" };
        }
    };
    

    // Old
    // const decideTournamentFinished = function (tournamentId, cb) {
    //     db.getTournamentRoom(tournamentId, function (err, tournament) {
    //         console.log("found this tournamnet while changing state is ", err, tournament);
    //         if (err || !tournament) {
    //             cb({ success: false, isRetry: false, isDisplay: true, info: popupTextManager.falseMessages.DBGETTOURNAMENTROOMFAIL_TOURNAMENT, channelId: "" });
    //             //cb({success: false, info: "No tournament room found"});
    //         } else {
    //             if (tournament.isLateRegistrationAllowed && Number(new Date()) <= (tournament.tournamentStartTime + tournament.lateRegistrationTime * 60 * 1000)) {
    //                 cb({ success: false, isRetry: false, isDisplay: true, channelId: "" });
    //             }
    //             else {
    //                 var decideTournamentFinished = tournament.state === "RUNNING" || tournament.state === "STARTED";
    //                 serverLog(stateOfX.serverLogType.info, 'decideTournamentFinished - ' + decideTournamentFinished);
    //                 cb({ success: true, isRetry: false, isDisplay: true, channelId: "" });
    //             }
    //         }
    //     });
    // }
    /*==============================  END  ==========================*/

    /*==============================  START  ==========================*/
    // tournament

    // New
    async changeStateOfTournament(params: any): Promise<void> {
        const channelId = params.channelId.toString();
    
        try {
            // Count current players
            const countPlayersResponse = await this.countCurrentPlayers(params);
    
    
            if (countPlayersResponse.success && countPlayersResponse.playersCount === 1) {
                // Decide if the tournament should be finished
                const decideTournamentFinishedResponse = await this.decideTournamentFinished(countPlayersResponse.tournamentId);
    
                console.log("decideTournamentFinishedResponse", decideTournamentFinishedResponse);
    
                if (decideTournamentFinishedResponse.success) {
                    // Handle the tournament state change
                    await this.tournamentActionHandler.handleTournamentState({ 
                        session: params.session, 
                        tournamentId: countPlayersResponse.tournamentId, 
                        tournamentState: stateOfX.tournamentState.finished 
                    });
    
                    // Update tournament state in the database
                    const updateResponse = await this.db.updateTournamentRoom({ tournamentId: countPlayersResponse.tournamentId }, { state: stateOfX.tournamentState.finished });
    
                    if (updateResponse) {
    
                        // Kill channels
                        await this.killChannel(params.self, countPlayersResponse.channels);
    
                        // Handle Sit and Go tournaments
                        if (params.table && params.table.tournamentType === stateOfX.tournamentType.sitNGo) {
                            await this.dynamicRanks.getRegisteredTournamentUsers(updateResponse._id);
                            await this.tournamentActionHandler.handleDynamicRanks({ session: params.session, tournamentId: countPlayersResponse.tournamentId });
                        }
                    } else {
                        console.log(stateOfX.serverLogType.info, "Error or response in state and version update", updateResponse);
                    }
                } else {
                    console.log(stateOfX.serverLogType.info, 'Rebuy or Late registration is opened no need to finish tournament');
                }
            } else {
                console.log(stateOfX.serverLogType.info, "Error in getting current users");
            }
        } catch (error) {
            console.error('Error in changing state of tournament:', error);
        }
    };
    

    // Old
    // const changeStateOfTournament = function (params) {
    //     console.log("for ranks in tournament changeStateOfTournament", params)
    //     console.log("channelId is in change state of tornament is  ", params.channelId);
    //     //  console.log(stateOfX.serverLogType.info,'params is in change state of tournament - ',params);
    //     channelId = params.channelId.toString();
    //     countCurrentPlayers(params, function (countPlayersResponse) {
    //         console.log("countPlayersResponse is in change state of tournament is - ", countPlayersResponse);
    //         if (countPlayersResponse.success && countPlayersResponse.playersCount === 1) {
    //             decideTournamentFinished(countPlayersResponse.tournamentId, function (decideTournamentFinishedResponse) {
    //                 console.log("decideTournamentFinishedResponsedecideTournamentFinishedResponse", decideTournamentFinishedResponse)
    //                 if (decideTournamentFinishedResponse.success) {
    //                     tournamentActionHandler.handleTournamentState({ session: params.session, tournamentId: countPlayersResponse.tournamentId, tournamentState: stateOfX.tournamentState.finished });
    //                     // pomelo.app.rpc.database.rewardRake.tournamentRakeProcess(params.session, { tournamentId: countPlayersResponse.tournamentId }, function (rakeResponse) {
    //                     // console.log(stateOfX.serverLogType.info, "response from tournament rake - " + JSON.stringify(rakeResponse));
    //                     db.updateTournamentRoom({ tournamentId: countPlayersResponse.tournamentId }, { state: stateOfX.tournamentState.finished }, function (err, response) {
    //                         console.log(stateOfX.serverLogType.info, "Error or response in state and version update", err, response);
    //                         if (err || !response) {
    //                             console.log(stateOfX.serverLogType.info, "Error or response in state and version update", err, response);
    //                         } else {
    //                             console.log(stateOfX.serverLogType.info, "updated tournament state successfully" + JSON.stringify(response));
    //                             console.log(stateOfX.serverLogType.info, "response._id,response.gameVersionCount-1 -- " + response._id + response.gameVersionCount - 1);
    //                             // pomelo.app.rpc.database.rewardRake.tournamentRakeProcess(params.session, { tournamentId: response._id }, function (rakeResponse) {
    //                             //   console.log(stateOfX.serverLogType.info, "response from tournament rake - " + JSON.stringify(rakeResponse));
    //                             // })
    //                             killChannel(params.self, countPlayersResponse.channels)
    //                             if (params.table && params.table.tournamentType === stateOfX.tournamentType.sitNGo) {
    //                                 console.log(stateOfX.serverLogType.info, "this is sitNGo tournament going to calculate dynamicRanks");
    //                                 dynamicRanks.getRegisteredTournamentUsers(response._id);
    //                                 tournamentActionHandler.handleDynamicRanks({ session: params.session, tournamentId: countPlayersResponse.tournamentId });
    //                             }
    //                         }
    //                     })
    //                     // })
    //                 } else {
    //                     console.log(stateOfX.serverLogType.info, 'Rebuy or Late registrtion is opened no need to finish tournament');
    //                 }
    //             })
    //         } else {
    //             console.log(stateOfX.serverLogType.info, "Error in getting current users");
    //         }
    //     })
    // }
    /*==============================  END  ==========================*/


    /*==============================  START  ==========================*/
    // Fire Dealer chat broadcast on Game start

    // New
    async fireDealerChatGameStart(params: any): Promise<void> {
    
        // Create event log using actionLogger
        await this.actionLogger.createEventLog({
            session: params.session,
            channel: params.channel,
            data: {
                channelId: params.channelId,
                eventName: stateOfX.logEvents.startGame,
                rawData: params.data.tableDetails.eventDetails
            }
        });
    
        // Return the params, function now doesn't need a callback
        return params;
    };
    
    // Old
    // const fireDealerChatGameStart = function (params, cb) {
    //     console.log("inside fireDealerChatGameStart")
    //     actionLogger.createEventLog({
    //         // self: params.self,
    //         session: params.session,
    //         channel: params.channel,
    //         data: {
    //             channelId: params.channelId,
    //             eventName: stateOfX.logEvents.startGame,
    //             rawData: params.data.tableDetails.eventDetails
    //         }
    //     });


    //     cb(null, params);
    // }
    /*==============================  END  ==========================*/


    /*==============================  START  ==========================*/
    // Fire dealer chat for table info

    // New

    async fireDealerChatTableInfo(params: any): Promise<any> {
        // Create event log using actionLogger
        await this.actionLogger.createEventLog({
            session: params.session,
            channel: params.channel,
            data: {
                channelId: params.channelId,
                eventName: stateOfX.logEvents.tableInfo,
                rawData: params.data.tableDetails.eventDetails.tableDetails
            }
        });
    
        // Return params after the event log is created
        return params;
    };
    

    // Old
    // const fireDealerChatTableInfo = function (params, cb) {
    //     actionLogger.createEventLog({
    //         // self: params.self,
    //         session: params.session,
    //         channel: params.channel,
    //         data: {
    //             channelId: params.channelId,
    //             eventName: stateOfX.logEvents.tableInfo,
    //             rawData: params.data.tableDetails.eventDetails.tableDetails
    //         }
    //     });
    //     cb(null, params);
    // }
    /*==============================  END  ==========================*/





}