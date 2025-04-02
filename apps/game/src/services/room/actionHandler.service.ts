import { Injectable } from '@nestjs/common';
import * as async from 'async';
import * as _ from 'underscore';
import * as broadcastHandler from './broadcastHandler';
import * as startGameHandler from './startGameHandler';
import * as actionLogger from './actionLogger';
import * as channelTimerHandler from './channelTimerHandler';
import * as waitingListHandler from './waitingListHandler';
import * as imdb from '../../../../../shared/model/inMemoryDbQuery';
import * as systemConfig from '../../../../../shared/systemConfig.json';
import * as stateOfX from '../../../../../shared/stateOfX';
// import * as pomelo from 'pomelo';

@Injectable()
export class ActionHandlerService {
    constructor() { }

    /**
    * Handle events after some player left
    * Send or schedule broadcast
    * Handle waiting queue
    * Start or kill some timers
    */
    async handleLeaveEvents(params: any): Promise<void> {
        try {
            await broadcastHandler.fireLeaveBroadcast({
                channel: params.channel,
                serverType: pomelo.app.serverType,
                data: params.response.broadcast,
            });

            // Broadcast next queued player for this channel
            if (params.response.isSeatsAvailable) {
                await waitingListHandler.processNextQueuedPlayer({
                    channelId: params.channelId,
                    session: params.session,
                    channel: params.channel,
                });
            }

            // Broadcast for lobby
            await broadcastHandler.fireBroadcastToAllSessions({
                app: pomelo.app,
                data: {
                    _id: params.channelId,
                    updated: { playingPlayers: params.response.playerLength },
                    event: stateOfX.recordChange.tablePlayingPlayer,
                },
                route: stateOfX.broadcasts.tableUpdate,
            });

            // Start timer for player standup or kill existing timer on leave
            if (params.request.isStandup) {
                await channelTimerHandler.kickPlayerToLobby({
                    session: params.session,
                    channel: params.channel,
                    channelId: params.channelId,
                    playerId: params.request.playerId,
                    data: params.request,
                });
            } else {
                await broadcastHandler.sendMessageToUser({
                    playerId: params.request.playerId,
                    serverId: params.session.frontendId,
                    msg: {
                        playerId: params.request.playerId,
                        channelId: params.channelId,
                        event: stateOfX.recordChange.playerLeaveTable,
                    },
                    route: stateOfX.broadcasts.joinTableList,
                });
                await channelTimerHandler.killKickToLobbyTimer({
                    channel: params.channel,
                    playerId: params.request.playerId,
                });
            }
        } catch (error) {
            throw error;
        }
    }

    sessionExport(session: any): any {
        const EXPORTED_SESSION_FIELDS = ['id', 'frontendId', 'uid', 'settings'];
        const res: any = {};
        this.clone(session, res, EXPORTED_SESSION_FIELDS);
        return res;
    }

    /**
     * Clone object keys
     * @param src source of keys
     * @param dest destination for keys
     * @param includes list of keys - array of strings
     */
    private clone(src: any, dest: any, includes: string[]): void {
        includes.forEach((field) => {
            dest[field] = src[field];
        });
    }


    // handle after move or leave
    // for broadcast
    // and timers
    async handle(params: any) {
        console.trace('actionHandler.handle ', params);
        let channelTry = pomelo.app.get('channelService').getChannel(params.channelId, false);
        console.log("channeltrychanneltry", channelTry);
        if (!params.channel) {
            params.channel = channelTry;
        }
        // Broadcast precheck
        if (!params.response.isGameOver && params.response.preChecks.length > 0) {
            // params.response.preChecks.self      = params.self;
            params.response.preChecks.session = params.session;
            params.response.preChecks.channel = params.channel;
            params.response.preChecks.channelId = params.channelId;

            this.broadcastHandler.firePrecheckBroadcast(params.response.preChecks);
        }

        if (params.response.isCurrentPlayer && !params.alreadySentTurn) {
            // params.response.turn.self 		= params.self;
            params.response.turn.channel = params.channel;
            params.response.turn.session = params.session;
            // Send player turn broadcast to channel level
            let fireOnTurnBroadcastResponse = await this.broadcastHandler.fireOnTurnBroadcast(params.response.turn)
            if (fireOnTurnBroadcastResponse.success) {
                if (!params.response.isGameOver) {
                    channelTimerHandler.startTurnTimeOut(params);
                    //}, 500);
                } else {
                    channelTimerHandler.killChannelTurnTimer({ channel: params.channel });
                }
            } else {
                channelTimerHandler.killChannelTurnTimer({ channel: params.channel, request: params.request });
            }
        }

        // Broadcast for lobby details
        if (!!params.response.turn.playerId) {
            var broadcastData: any = { _id: params.channelId, playerId: params.response.turn.playerId, updated: { playerName: params.response.turn.playerName, chips: params.response.turn.chips }, channelType: params.channel.channelType, event: stateOfX.recordChange.tableViewChipsUpdate };
            if (params.channel.channelType === stateOfX.gameType.tournament) {
                broadcastData.updated.largestStack = params.response.largestStack;
                broadcastData.updated.smallestStack = params.response.smallestStack;
            }
            //broadcastHandler.fireBroadcastToAllSessions({app: pomelo.app, data: broadcastData, route: stateOfX.broadcasts.tableView});

            // Broadcast if blind has been updated
            if (params.channel.channelType === stateOfX.gameType.tournament && params.response.isBlindUpdated) {
                broadcastData = _.omit(broadcastData, 'playerId');
                broadcastData.event = stateOfX.recordChange.tournamentBlindChange;
                broadcastData.updated = params.response.newBlinds;
                broadcastHandler.fireBroadcastToAllSessions({ app: pomelo.app, data: broadcastData, route: stateOfX.broadcasts.tournamentLobby });
            }
        }

        // If leave broadcast is prsent then handle leave additional events
        if (!!params.response.broadcast) {
            this.handleLeaveEvents(params);
        }

        // Fire round over broadcast
        if (params.response.isRoundOver) {
            if (params.response.flopPercent >= 0) {
                broadcastHandler.fireBroadcastToAllSessions({ app: pomelo.app, data: { _id: params.channelId, updated: { flopPercent: params.response.flopPercent }, event: stateOfX.recordChange.tableFlopPercent }, route: stateOfX.broadcasts.tableUpdate });
            }
            if (params.response.round.roundName !== stateOfX.round.showdown) {
                actionLogger.createEventLog({ session: params.session, channel: params.channel, data: { channelId: params.channelId, eventName: stateOfX.logEvents.roundOver, rawData: params.response.round } });
            }
            // params.response.round.self 		= params.self;
            params.response.round.channel = params.channel;
            setTimeout(() => {

                this.broadcastHandler.fireRoundOverBroadcast(params.response.round);
            }, 500);

            // Broadcast players best hand individually
            if (!params.response.isGameOver && params.response.bestHands.length > 0) {
                // params.response.bestHands.self      = params.self;
                params.response.bestHands.session = params.session;
                params.response.bestHands.channelId = params.channelId;
                params.response.bestHands.channel = params.channel;
                setTimeout(function () {
                    broadcastHandler.fireBestHandBroadcast(params.response.bestHands);
                }, 1000);
            }
        }

        // Fire game over broadcast
        if (params.response.isGameOver) {
            pomelo.app.sysrpc['room'].msgRemote.forwardMessage(
                { forceFrontendId: "room-server-1" }, { body: { channelId: params.channelId }, route: "room.channelHandler.getFormattedHandsData" },
                this.sessionExport(params.session), function (err, res) { });
            console.log('isGameOver aa', params)
            var removeQuery: any = {};
            removeQuery.channelId = params.response.channelId;
            // setTimeout(function () {
            imdb.removeCardShow(removeQuery, function (rErr, rRes) {
                //console.log("-------------------removedEyeCards-----------------------");
            })
            // }, 2500);

            console.log("params.response.over.endingType", params.response.over.endingType)
            // if(params.response.over.endingType != 'EVERYBODYPACKED' && params.response.allInCards.length > 0){
            if (params.response.over.endingType != 'EVERYBODYPACKED' && !!params.response.allInCards && params.response.allInCards.length > 0 && !params.alreadySentTurn) {
                var channelIdOriginal = params.response.channelId;
                var channel = pomelo.app.get('channelService').getChannel(channelIdOriginal, false);
                if (!channel) {
                    console.log("need to insert new channel", channel)
                    channel = pomelo.app.get('channelService').getChannel(channelIdOriginal, true);
                }
                var broadcastData: any = {};
                broadcastData.channelId = channelIdOriginal;
                broadcastData.allInCards = params.response.allInCards;
                broadcastHandler.fireAllInCards({ channel: channel, channelId: channelIdOriginal, data: broadcastData });
            }
            if (params.response.avgPot >= 0) {
                broadcastHandler.fireBroadcastToAllSessions({ app: pomelo.app, data: { _id: params.channelId, updated: { avgPot: params.response.avgPot }, event: stateOfX.recordChange.tableAvgPot }, route: stateOfX.broadcasts.tableUpdate });
            }
            setTimeout(function () {
                actionLogger.createEventLog({ session: params.session, channel: params.channel, data: { channelId: params.channelId, eventName: stateOfX.logEvents.summary, rawData: _.omit(params.response.over, 'self', 'session', 'channel') } });
            }, parseInt(systemConfig.recordSummaryAfterGameOver) * 1000);

            params.response.over.channel = params.channel;
            params.response.over.session = params.session;
            var cardAnim = (params.response.round.boardCard[0].length + params.response.round.boardCard[1].length) * 360 + 650;
            var extraDelay = params.response.round.boardCard[0].length > 0 ? 2000 : 0;
            var extraAniMationTime = 0;
            if (params.response.round.boardCard[1].length > 0 && params.response.round.boardCard[1].length < 3) {
                cardAnim += 400;
                extraAniMationTime = 400;
            }
            extraAniMationTime += 1000;
            cardAnim += 1000;

            //rabbit
            // extraAniMationTime += 3000; // for rabbit
            // cardAnim += 3000; // for rabbit
            //rabbit end
            setTimeout(function () {
                broadcastHandler.fireGameOverBroadcast(params.response.over);
            }, (cardAnim));

            console.log('Printing cardAnim extraDelay ', cardAnim, extraDelay, extraAniMationTime);

            //Broadcast for ROE after gameOver
            if (params.response.isROE) {
                var isRoeTime = cardAnim + parseInt(systemConfig.gameROEBroadcastDelay) * 1000;
                setTimeout(function () {
                    var tableDetails = {
                        channel: params.channel,
                        channelId: params.response.channelId,
                        isROE: params.response.isROE,
                        channelVariation: params.response.channelVariation,
                        message: params.response.channelRoundCount + "/" + params.response.maxPlayers
                    }
                    broadcastHandler.fireGameVariationBroadcast(tableDetails);
                }, isRoeTime);
                if (params.response.channelRound == params.response.maxPlayers) {
                    var variationDetails = {
                        channel: params.channel,
                        channelId: params.response.channelId,
                        isROE: params.response.isROE,
                        channelVariation: params.response.channelVariation
                    }
                    broadcastHandler.fireROEGameVariationBroadcast(variationDetails);
                }
            }

            var broadcastForAddChipsFailed = params.response.over.addChipsFailed || [];
            var msgsPlayer = {};
            for (var i = 0; i < broadcastForAddChipsFailed.length; i++) {
                msgsPlayer[broadcastForAddChipsFailed[i]] = { heading: "Add Points Failed", serverId: params.session.frontendId, info: "Unable to add points since enough points not available in account.", channelId: params.channelId, playerId: broadcastForAddChipsFailed[i], buttonCode: 1 };
                broadcastHandler.fireInfoBroadcastToPlayer(msgsPlayer[broadcastForAddChipsFailed[i]]);
            }

            let table = await imdb.getTable(params.channelId)
            if (table.players.length > 0) {
                async.eachSeries(table.players, function (player, ecb) {
                    if (table.isCTEnabledTable) {
                        console.log(" i am printing the playerscore ", player.playerScore);
                        if (player.callTimeGameMissed === table.ctEnabledBufferHand + 1 && player.playerScore > 0) {
                            console.log('firePlayerSettings', player.callTimeGameMissed, table.ctEnabledBufferHand, table.ctEnabledBufferTime);
                            setTimeout(() => {
                                broadcastHandler.playerCallTimerEnds({
                                    channel: params.channel,
                                    channelId: params.channelId,
                                    playerId: player.playerId,
                                    status: player.playerCallTimer.status,
                                    timer: player.playerCallTimer.timer,
                                    timerInSeconds: player.playerCallTimer.timerInSeconds || (player.playerCallTimer.timer * 60),
                                    createdAt: player.playerCallTimer.createdAt,
                                    info: `${player.playerName}, your call time was over, If you wish to continue please give fresh Call Time or leave the Table`,
                                    isCallTimeOver: false,//player.playerCallTimer.isCallTimeOver,
                                    callTimeGameMissed: true
                                })
                            }, 3000 + cardAnim + extraDelay + extraAniMationTime + (isRoeTime || 0))
                            if (params.channel.callTimeTimeBufferTimeReference[player.playerId]) {
                                clearTimeout(params.channel.callTimeTimeBufferTimeReference[player.playerId]);
                                params.channel.callTimeTimeBufferTimeReference[player.playerId] = null;
                            }
                            console.log("rs3en45")
                            params.channel.callTimeTimeBufferTimeReference[player.playerId] = setTimeout(() => {
                                pomelo.app.sysrpc['room'].msgRemote.forwardMessage(
                                    { forceFrontendId: "room-server-1" },
                                    {
                                        body: { playerId: player.playerId, playerName: player.playerName, isStandup: true, channelId: params.channelId, isRequested: false, origin: 'idlePlayer' },
                                        route: "room.channelHandler.leaveTable"
                                    },
                                    this.sessionExport(params.session), function (err, res) {
                                        pomelo.app.sysrpc['room'].msgRemote.forwardMessage(
                                            { forceFrontendId: "room-server-1" },
                                            {
                                                body: { playerId: player.playerId, playerName: player.playerName, isStandup: false, channelId: params.channelId, isRequested: false, origin: 'kickToLobby' },
                                                route: "room.channelHandler.leaveTable"
                                            },
                                            this.sessionExport(params.session), function (err, res) {
                                            }
                                        );
                                    }
                                );
                            }, ((table.ctEnabledBufferTime + 3) * 1000) + cardAnim + extraDelay + extraAniMationTime + (isRoeTime || 0))
                        }
                        else {
                            console.log("************** FIRE GAMEOVER BROADCAST else if**************************", params);
                            if (player.callTimeGameMissed === table.ctEnabledBufferHand + 1 && player.playerScore <= 0) {
                                for (player of table.players) {
                                    player.callTimeGameMissed = 0;
                                    player.playerCallTimer.isCallTimeOver = false;
                                    let query = {
                                        channelId: player.channelId,
                                        playerId: player.playerId,
                                        callTimeGameMissed: 0,
                                        isCallTimeOver: false
                                    }
                                    imdb.updateIsCallTimeOver(query, function (err, result) {
                                        //imdb.playerStateUpdateOnDisconnections(channelId,playerId,state,previousState, function (err, res)
                                        if (err) {
                                            console.log("couldn't update ****************************************", err);
                                        } else {
                                            console.log("Suuccessffuullyyyyy update ****************************************", result);
                                        }
                                    })
                                }
                            }
                        }
                    }
                    ecb();
                });
            }

            var rabbitPossible = table.isRabbitTable;
            var wl = params.response.over.winners.length;
            var wr = _.where(params.response.over.winners, { isRefund: false });
            var wrl = wr.length;
            var uwrl = _.uniq(_.pluck(wr, "internalPotSplitIndex")).length;
            var dc = ((wl == 1 ? 1 : 0) + 2.5 * parseInt(uwrl + (wl > wrl ? 1 : 0)) + 1) * 1000 + (cardAnim) + extraDelay - extraAniMationTime; //Time reduced for reducing delay time after RIT.
            console.log(`wl: ${wl} wrl: ${wrl} uwrl: ${uwrl} dc: ${dc} cardAnim: ${cardAnim} extraDelay: ${extraDelay} extraAniMationTime: ${extraAniMationTime}`);
            console.log('startGame Delay', dc);
            params.channel.isGameOverActionHandler = true;
            // if ()
            setTimeout(function () {
                params.channel.isGameOverActionHandler = false;
                startGameHandler.startGame({ session: params.session, channelId: params.channelId, channel: params.channel, eventName: stateOfX.startGameEvent.gameOver });
            }, dc); // if rabbit possible will give time for cards else set it to 2500 for button time

            channelTimerHandler.tableIdleTimer({ channelId: params.channelId, channel: params.channel, session: params.session });

        }
    }

    // broadcast players their megapoints after game over
    async megaPointsBroadcaster(
        megaPointsResult: any,
        params: { channel: string }
    ) {
        if (!megaPointsResult?.players) return;

        const broadcastData: Record<string, any> = {};

        megaPointsResult.players.forEach((player: any) => {
            const levelId = player.levelChange?.value ?? player.megaPointLevel;
            const megaPointsTotal = player.megaPoints + player.addMegaPoints;

            broadcastData[player.playerId] = {
                megaPointLevel: this.getLevelName(levelId, megaPointsResult.allLevels),
                megaPoints: megaPointsTotal,
                megaPointsPercent: this.getLevelPercent(megaPointsTotal, megaPointsResult.allLevels),
            };
        });

        console.info('Broadcasting megapoints:', JSON.stringify(broadcastData));
        await broadcastHandler.pushMegaPoints({ channel: params.channel, data: broadcastData });
    }

    getLevelName(levelId: number, levels: any[]): string {
        const level = levels.find((lvl) => lvl.levelId === levelId);
        return level?.loyaltyLevel || 'Bronze';
    }

    getLevelPercent(points: number, levels: any[]): number {
        if (points <= 0 || levels.length === 0) return 0;

        for (let i = 0; i < levels.length; i++) {
            if (levels[i].levelThreshold > points) {
                return Math.floor((100 * (points - levels[i - 1].levelThreshold)) /
                    (levels[i].levelThreshold - levels[i - 1].levelThreshold) * 100) / 100;
            }
        }

        return 101; // Value greater than 100 represents the highest level
    }


    // Handle events after join waiting list
    async handleWaitingList(params: any) {
        try {
            // Increment waiting player length on channel
            params.channel.waitingPlayers = params.channel.waitingPlayers ? params.channel.waitingPlayers + 1 : 1;

            // Send info broadcast to the player
            await this.broadcastHandler.fireInfoBroadcastToPlayer({
                playerId: params.request.playerId,
                serverId: params.session.frontendId,
                heading: "Waiting List Info",
                info: params.response.info,
                buttonCode: 1,
                channelId: params.channelId,
            });

            // Manage waiting channels in session
            const waitingChannels = params.session.get("waitingChannels") || [];
            waitingChannels.push(params.channelId);
            params.session.set("waitingChannels", waitingChannels);

            params.session.push("waitingChannels", (err: any) => {
                if (err) {
                    console.error("Failed to set new waiting channel in session:", err.stack);
                }
            });

            // Fire broadcasts to update details in the lobby and table view
            await this.broadcastHandler.fireBroadcastToAllSessions({
                data: {
                    _id: params.channelId,
                    updated: { queuePlayers: params.channel.waitingPlayers },
                    event: stateOfX.recordChange.tableWaitingPlayer,
                },
                route: stateOfX.broadcasts.tableUpdate,
            });
        } catch (error) {
            console.error("Error in handleWaitingList:", error);
        }
    }


    // update isSitHere in record user activity
    async updateObserverRecord(playerId: any, channelId: any) {
        console.info("Going to update isSit in actionHandler");
        try {
            const result = await imdb.updateIsSit({ playerId, channelId });
            if (result) {
                console.info("Update observer record success");
            } else {
                console.info("Update observer record failed");
            }
        } catch (error) {
            console.error("Error updating observer record:", error);
        }
    }


    // Handle events after adding chips on table

    async handleAddChipsEvent(params: any): Promise<void> {
        if (params.response.success) {
            params.response.channel = params.channel;

            channelTimerHandler.killReserveSeatReferennce({ playerId: params.request.playerId, channel: params.channel });
            channelTimerHandler.killKickToLobbyTimer({ playerId: params.request.playerId, channel: params.channel });

            if (params.response.previousState === stateOfX.playerState.reserved) {
                await this.updateObserverRecord(params.request.playerId, params.channelId);
                await this.actionLogger.createEventLog({
                    session: params.session,
                    channel: params.channel,
                    data: {
                        channelId: params.channelId,
                        eventName: stateOfX.logEvents.sit,
                        rawData: {
                            playerName: params.response.playerName,
                            chips: params.response.amount,
                        },
                    },
                });
            }

            params.serverId = params.session.frontendId;
            params.route = "updateProfile";

            if (
                (params.response.previousState === stateOfX.playerState.playing ||
                    (params.response.previousState === stateOfX.playerState.onBreak &&
                        params.response.channel.isCTEnabledTable)) &&
                params.response.chipsAdded > 0
            ) {
                setTimeout(() => {
                    this.broadcastHandler.fireInfoBroadcastToPlayer({
                        playerId: params.request.playerId,
                        heading: "Points Info",
                        info: `${params.request.amount} more points will be added in next hand.`,
                        buttonCode: 1,
                        channelId: params.channelId,
                    });
                }, 100);
            }

            if (params.response.previousState === stateOfX.playerState.outOfMoney) {
                this.broadcastHandler.firePlayerStateBroadcast({
                    channel: params.channel,
                    playerId: params.request.playerId,
                    channelId: params.channelId,
                    state: stateOfX.playerState.waiting,
                });
            }

            this.broadcastHandler.firePlayerCoinBroadcast(params.response);

            setTimeout(() => {
                startGameHandler.startGame({
                    session: params.session,
                    channelId: params.channelId,
                    channel: params.channel,
                    eventName: stateOfX.startGameEvent.addChips,
                });
            }, parseInt(systemConfig.startGameAfterStartEvent) * 1000);

            this.broadcastHandler.firePlayerStateBroadcast({
                channel: params.channel,
                playerId: params.request.playerId,
                channelId: params.channelId,
                state: params.response.state,
            });
        } else {
            console.error(`Add chips request failed for playerId - ${params.request.playerId} - ${JSON.stringify(params.response)}`);

            if (params.response.state && params.response.state === stateOfX.playerState.reserved) {
                pomelo.app.sysrpc["room"].msgRemote.forwardMessage(
                    { forceFrontendId: pomelo.app.serverId },
                    {
                        body: {
                            playerId: params.request.playerId,
                            isStandup: true,
                            channelId: params.channelId,
                            isRequested: false,
                            origin: "addChipsFail",
                        },
                        route: "room.channelHandler.leaveTable",
                    },
                    this.sessionExport(params.session),
                    () => {
                        setTimeout(() => {
                            broadcastHandler.fireInfoBroadcastToPlayer({
                                playerId: params.request.playerId,
                                buttonCode: 1,
                                channelId: params.channelId,
                                heading: "Standup",
                                info: "You do not have sufficient points",
                            });
                        }, 2000);
                    }
                );
            }
        }
    }

    // Handle events after player leave waiting list successfully
    async handleLeaveWaitingList(params: any) {
        try {
            params.channel.waitingPlayers = Math.max((params.channel.waitingPlayers || 0) - 1, 0);
            // Fire broadcast to update details on lobby table and inside table view
            this.broadcastHandler.fireBroadcastToAllSessions({
                app: pomelo.app,
                data: {
                    _id: params.channelId,
                    updated: { queuePlayers: params.channel.waitingPlayers },
                    event: stateOfX.recordChange.tableWaitingPlayer,
                },
                route: stateOfX.broadcasts.tableUpdate,
            });

            // Notify the player if session info is available
            if (params.session?.frontendId) {
                this.broadcastHandler.fireInfoBroadcastToPlayer({
                    playerId: params.request.playerId,
                    serverId: params.session.frontendId,
                    heading: "Waiting List Info",
                    info: params.response.data.info,
                    buttonCode: 1,
                    channelId: params.channelId,
                });
            }

            // Update session waiting channels
            if (params.session?.get) {
                const waitingChannels: string[] = params.session.get("waitingChannels") || [];
                const index = waitingChannels.indexOf(params.request.channelId);
                if (index >= 0) {
                    waitingChannels.splice(index, 1);
                    params.session.set("waitingChannels", waitingChannels);

                    params.session.push("waitingChannels", (err: any) => {
                        if (err) {
                        }
                    });
                }
            }
        } catch (error) {
            throw Error('')
        }
    };

}