import { Injectable } from "@nestjs/common";
import { stateOfX } from "shared/common";
import { ImdbDatabaseService } from "shared/common/datebase/Imdbdatabase.service";
import { LockTableService } from "./lockTable.service";
import { BroadcastHandlerService } from "../room/broadcastHandler.service";
import { HandleGameOverService } from "./handleGameOver.service";
import { validateKeySets } from "shared/common/utils/activity";


@Injectable()
export class RequestRemoteService {


    constructor(
        private readonly imdb: ImdbDatabaseService,
        private readonly lockTable: LockTableService,
        private readonly broadcastHandler: BroadcastHandlerService,
        private readonly handleGameOver: HandleGameOverService
    ) { }



    // Start zmq publisher
    // zmqPublish.startPublisher(7002);

    // var requestRemote = function (app) {
    //     this.app = app;
    //     // this.channelService = app.get('channelService');
    // };

    // <<<<<<<<<<<<<<<<<<< RPC CALLS HANDLER Started >>>>>>>>>>>>>>>>>>>>>>>>>

    /*===============================  START ==========================*/
    /**
     * set one player setting on table
     * @method setPlayerValueOnTable
     */
    // New
    async setPlayerValueOnTable(params: any): Promise<any> {

        const lockTableResponse = await this.lockTable.lock({
            channelId: params.channelId,
            actionName: 'setPlayerValueOnTable',
            data: params,
        });

        if (!lockTableResponse.success) {
            return lockTableResponse;
        }

        const validated = await validateKeySets(
            'Response',
            'database',
            'setPlayerValueOnTable',
            lockTableResponse.data,
        );

        if (validated.success) {
            return lockTableResponse.data;
        } else {
            return validated;
        }
    }

    // Old
    // requestRemote.prototype.setPlayerValueOnTable = function (params, cb) {
    //     var self = this;
    //     lockTable.lock({ channelId: params.channelId, actionName: "setPlayerValueOnTable", data: params }, function (lockTableResponse) {
    //         if (lockTableResponse.success) {
    //             keyValidator.validateKeySets("Response", "database", "setPlayerValueOnTable", lockTableResponse.data, function (validated) {
    //                 if (validated.success) {
    //                     cb(lockTableResponse.data);
    //                 } else {
    //                     cb(validated);
    //                 }
    //             });
    //         } else {
    //             cb(lockTableResponse);
    //         }
    //     });
    // }
    /*===============================  END ==========================*/

    /*===============================  START ==========================*/
    // New
    async updateTournamentRules(params: any): Promise<any> {
        const lockTableResponse = await this.lockTable.lock({
            channelId: params.channelId,
            actionName: "updateTournamentRules",
            data: params
        });

        if (lockTableResponse.success) {
            return lockTableResponse.data;
        } else {
            return lockTableResponse;
        }
    }

    // Old
    // requestRemote.prototype.updateTournamentRules = function (params, cb) {
    //     var self = this;
    //     lockTable.lock({ channelId: params.channelId, actionName: "updateTournamentRules", data: params }, function (lockTableResponse) {
    //         serverLog(stateOfX.serverLogType.info, 'response from lockTableResponse - ' + JSON.stringify(lockTableResponse));
    //         if (lockTableResponse.success) {
    //             cb(lockTableResponse.data);
    //         } else {
    //             cb(lockTableResponse);
    //         }
    //     });
    // }
    /*===============================  END ==========================*/


    /*===============================  START ==========================*/
    // Lock table and process autosit player into table
    // WHEN? when somebody leaves a table and autosit happens for the other player who was in queue
    // New
    async processAutoSit(params: any): Promise<any> {
        const lockTableResponse = await this.lockTable.lock({
            channelId: params.channelId,
            actionName: "autosit",
            data: params
        });

        if (lockTableResponse.success) {
            const validated = await validateKeySets(
                "Response",
                "database",
                "processAutoSit",
                lockTableResponse
            );

            if (validated.success) {
                return lockTableResponse;
            } else {
                return validated;
            }
        } else {
            return lockTableResponse;
        }
    }


    // Old
    // requestRemote.prototype.processAutoSit = function (params, cb) {
    //     var self = this;
    //     lockTable.lock({ channelId: params.channelId, actionName: "autosit", data: params }, function (lockTableResponse) {
    //         if (lockTableResponse.success) {
    //             keyValidator.validateKeySets("Response", "database", "processAutoSit", lockTableResponse, function (validated) {
    //                 if (validated.success) {
    //                     cb(lockTableResponse);
    //                 } else {
    //                     cb(validated);
    //                 }
    //             });
    //         } else {
    //             cb(lockTableResponse);
    //         }
    //     });
    // }
    /*===============================  END ==========================*/



    /*===============================  START ==========================*/
    // Remove player from waiting list for a table
    // New
    async removeWaitingPlayer(params: any): Promise<any> {
        const lockTableResponse = await this.lockTable.lock({
            channelId: params.channelId,
            actionName: "removeWaitingPlayer",
            data: params
        });

        if (lockTableResponse.success) {
            const validated = await validateKeySets(
                "Response",
                "database",
                "removeWaitingPlayer",
                lockTableResponse
            );

            if (validated.success) {
                return lockTableResponse;
            } else {
                return validated;
            }
        } else {
            return lockTableResponse;
        }
    }


    // Old
    // requestRemote.prototype.removeWaitingPlayer = function (params, cb) {
    //     var self = this;
    //     lockTable.lock({ channelId: params.channelId, actionName: "removeWaitingPlayer", data: params }, function (lockTableResponse) {
    //         if (lockTableResponse.success) {
    //             keyValidator.validateKeySets("Response", "database", "removeWaitingPlayer", lockTableResponse, function (validated) {
    //                 if (validated.success) {
    //                     cb(lockTableResponse);
    //                 } else {
    //                     cb(validated);
    //                 }
    //             });
    //         } else {
    //             cb(lockTableResponse);
    //         }
    //     });
    // }
    /*===============================  END ==========================*/


    /*===============================  START ==========================*/
    // Change player state from DISCONNECTED (On join)
    // New
    async changeDisconnPlayerState(params: any): Promise<any> {
        const lockTableResponse = await this.lockTable.lock({
            channelId: params.channelId,
            actionName: "changeDisconnPlayerState",
            data: params
        });
        return lockTableResponse;
    }


    //Old
    // requestRemote.prototype.changeDisconnPlayerState = function (params, cb) {
    //     console.log("Request Remote changeDisConnPlayerState function ", params);
    //     lockTable.lock({ channelId: params.channelId, actionName: "changeDisconnPlayerState", data: params }, function (lockTableResponse) {
    //         cb(lockTableResponse);
    //     });
    // }
    /*===============================  END ==========================*/


    /*===============================  START ==========================*/
    // Set timebank details for requested player
    // New
    async setTimeBankDetails(params: any): Promise<any> {
        const lockTableResponse = await this.lockTable.lock({
            channelId: params.channelId,
            actionName: "setTimeBankDetails",
            data: params
        });
        return lockTableResponse;
    }


    // Old
    // requestRemote.prototype.setTimeBankDetails = function (params, cb) {
    //     lockTable.lock({ channelId: params.channelId, actionName: "setTimeBankDetails", data: params }, function (lockTableResponse) {
    //         cb(lockTableResponse);
    //     });
    // }
    /*===============================  END ==========================*/


    /*===============================  START ==========================*/
    // calling evRit Process
    // New
    async handleEVRIT(params: any): Promise<{ success: boolean }> {
        await this.handleGameOver.startRITProcess(params);
        return { success: true };
    }


    // Old
    // requestRemote.prototype.handleEVRIT = function (params, cb) {
    //     console.log("inside requestRemote handlegameOver", params)
    //     handleGameOver.startRITProcess(params);
    //     cb({ success: true });
    // }
    /*===============================  END ==========================*/


    /*===============================  START ==========================*/
    // calling handleGameOver
    // New
    async afterProcess(params: any): Promise<{ success: boolean }> {
        await this.handleGameOver.afterProcess(params);
        return { success: true };
    }


    // Old
    // requestRemote.prototype.afterProcess = function (params, cb) {
    //         console.log("inside requestRemote afterProcess", params)
    //         handleGameOver.afterProcess(params);
    //         cb({ success: true });
    // }
    /*===============================  END ==========================*/

    /*===============================  START ==========================*/
    // New
    async checkEvHappens(params: any): Promise<{ success: boolean }> {
        const channel = this.app.get('channelService').getChannel(params.channelId, false);

        if (channel && (channel.evChopTimer || channel.evRITTimer)) {
            return { success: true };
        } else {
            return { success: false };
        }
    }


    // Old
    // requestRemote.prototype.checkEvHappens = function (params, cb) {
    //     console.log("inside checkEvHappens data", params)
    //     let self = this;
    //     let channel = self.app.get('channelService').getChannel(params.channelId, false);
    //     console.log("got this channel in checkEvHappens", channel)
    //     if (!!channel && (channel.evChopTimer || channel.evRITTimer)) {
    //         cb({ success: true });
    //     }
    //     else {
    //         cb({ success: false });
    //     }
    // }
    /*===============================  END ==========================*/

    /*===============================  START ==========================*/
    // New
    sendPrivateMessage(params: any): void {
        const msgData: any = {
            self: {},
            msg: {
                playerId: params.playerId,
                channelId: params.channelId,
                info: params.info,
            },
            playerId: params.playerId,
            channelId: params.channelId,
            route: 'waitingForEvChop',
        };

        if (params.isEvRIT) {
            msgData.msg.isEvRIT = true;
        }

        this.broadcastHandler.sendMessageToUser(msgData);
    }


    // Old
    // const sendPrivateMessage = (params) => {
    //     console.log("inside requestRemote private messanger", params)
    //     let msgData = {
    //         self: {},
    //         msg: {
    //             playerId: params.playerId,
    //             channelId: params.channelId,
    //             info: params.info,
    //         },
    //         playerId: params.playerId,
    //         channelId: params.channelId,
    //         route: 'waitingForEvChop'
    //     }
    //     if (params.isEvRIT) {
    //         msgData.msg.isEvRIT = true;
    //     }
    //     broadcastHandler.sendMessageToUser(msgData);
    // }
    /*===============================  END ==========================*/


    /*===============================  START ==========================*/
    // New
    async playerLeftEv(params: any) {
        const self = this;
        const channel = self.app.get('channelService').getChannel(params.channelId, false);

        if (channel && (channel.evChopTimer || channel.evRITTimer)) {
            try {
                // Wrap imdb.getTable into a promise to await it
                const table = await this.imdb.getTable(params.channelId);

                if (table) {
                    this.broadcastHandler.fireAllInCards({
                        playerId: params.playerId,
                        channel: channel,
                        channelId: params.channelId,
                        data: { allInCards: table.allInPLayerCardsCards, channelId: params.channelId },
                        sentFromReconnection: true,
                    });

                    this.broadcastHandler.fireRoundOverBroadcast({
                        playerId: params.playerId,
                        channelId: params.channelId,
                        roundName: stateOfX.round.showdown,
                        channel: channel,
                        sentFromReconnection: true,
                    });

                    if (table.turnEvData) {
                        const turnData = {
                            ...table.turnEvData,
                            channel: channel,
                            sentFromReconnection: true,
                            originalPlayerId: params.playerId,
                        };

                        // Wrap fireOnTurnBroadcast callback in Promise to await
                        await this.broadcastHandler.fireOnTurnBroadcast(turnData);
                    }

                    const evChopDetails = table.evChopDetails || [];
                    let playerData: any[] = [];
                    const foundData = evChopDetails.find((e: any) => e.playerId === params.playerId);

                    const evData = {
                        channel: channel,
                        evChop: evChopDetails,
                        sentFromReconnection: true,
                        channelId: params.channelId,
                        playerId: params.playerId,
                    };

                    this.broadcastHandler.evChopPercent(evData);

                    if (foundData) {
                        playerData.push(foundData);
                        console.log("playerData saved details", playerData);

                        if (channel.evChopTimer) {
                            for (let i = 0; i < evChopDetails.length; i++) {
                                if (evChopDetails[i].equity === 0) {
                                    evChopDetails.splice(i, 1);
                                    i--;
                                }
                            }

                            const tablePlayer = table.players.find((e: any) => e.playerId == params.playerId);
                            console.log("got my player data", tablePlayer);

                            if (!tablePlayer.hasOwnProperty('evChop')) {
                                if (evChopDetails.length) {
                                    this.broadcastHandler.evChop({
                                        channelId: params.channelId,
                                        playerId: params.playerId,
                                        evChop: playerData,
                                        sentFromReconnection: true,
                                    });
                                }
                            } else {
                                if (!!tablePlayer.evChop) {
                                    const evTagData = {
                                        channelId: params.channelId,
                                        playerId: params.playerId,
                                        sentFromReconnection: true,
                                    };
                                    this.broadcastHandler.setEvTag(evTagData);
                                }
                                this.sendPrivateMessage({
                                    playerId: params.playerId,
                                    channelId: params.channelId,
                                    info: "Waiting for other player's decision on Ev Chop",
                                    successId: 'successMessage.WAITING_EV_CHOP',
                                });
                            }
                        } else if (channel.evRITTimer) {
                            const tablePlayer = table.players.find((e: any) => e.playerId == params.playerId);

                            if (tablePlayer.playerId == table.ritDetails.playerId) {
                                const popUpTime = Math.floor(
                                    table.ritPopupTime - (Number(new Date()) - channel.evRITTimer.startedAt) / 1000
                                );
                                table.ritDetails.timer = popUpTime;
                                this.broadcastHandler.ritEvChop({
                                    channel: channel,
                                    channelId: params.channelId,
                                    data: table.ritDetails,
                                    sentFromReconnection: true,
                                });
                            } else {
                                this.sendPrivateMessage({
                                    playerId: params.playerId,
                                    channelId: params.channelId,
                                    info: "Waiting for other player decision on RIT",
                                    isEvRIT: true,
                                    successId: "successMessage.WAITING_RIT",
                                });
                            }
                        }
                    } else {
                        if (channel.evChopTimer) {
                            this.sendPrivateMessage({
                                playerId: params.playerId,
                                channelId: params.channelId,
                                info: "Waiting for other player's decision on Ev Chop",
                                successId: 'successMessage.WAITING_EV_CHOP',
                            });
                        } else if (channel.evRITTimer) {
                            this.sendPrivateMessage({
                                playerId: params.playerId,
                                channelId: params.channelId,
                                info: "Waiting for other player decision on RIT",
                                isEvRIT: true,
                                successId: "successMessage.WAITING_RIT",
                            });
                        }
                    }
                }
            } catch (error) {
                console.error("Error getting table:", error);
            }
        }
    };


    // Old
    // requestRemote.prototype.playerLeftEv = function (params, cb) {
    //     console.log("inside playerLeftEv data", params)
    //     let self = this;
    //     let channel = self.app.get('channelService').getChannel(params.channelId, false);
    //     console.log("got this channel in leftEv", channel)
    //     if (!!channel && (channel.evChopTimer || channel.evRITTimer)) {
    //         imdb.getTable(params.channelId, (err, table) => {
    //             console.log("got these saved details", err, table);
    //             if (!err && table) {
    //                 broadcastHandler.fireAllInCards({ playerId: params.playerId, channel: channel, channelId: params.channelId, data: { allInCards: table.allInPLayerCardsCards, channelId: params.channelId }, sentFromReconnection: true });
    //                 broadcastHandler.fireRoundOverBroadcast({ playerId: params.playerId, channelId: params.channelId, roundName: stateOfX.round.showdown, channel: channel, sentFromReconnection: true });
    //                 if (table.turnEvData) {
    //                     console.log("got these turnEvData turnEvData", table.turnEvData);
    //                     let turnData = {
    //                         ...table.turnEvData,
    //                         channel: channel,
    //                         sentFromReconnection: true,
    //                         originalPlayerId: params.playerId
    //                     }
    //                     broadcastHandler.fireOnTurnBroadcast(turnData, function (fireOnTurnBroadcastResponse) {
    //                         console.log("got this fireOnTurnBroadcastResponse", fireOnTurnBroadcastResponse)
    //                     });
    //                 }
    //                 let evChopDetails = table.evChopDetails;
    //                 let playerData = [];
    //                 let foundData = evChopDetails?.find(e => e.playerId === params.playerId);
    //                 let evData = {
    //                     channel: channel,
    //                     evChop: evChopDetails,
    //                     sentFromReconnection: true,
    //                     channelId: params.channelId,
    //                     playerId: params.playerId
    //                 }
    //                 broadcastHandler.evChopPercent(evData);

    //                 if (!!foundData) {
    //                     playerData.push(foundData)
    //                     console.log("playerData saved details", playerData);

    //                     if (channel.evChopTimer) {
    //                         for (let i = 0; i < evChopDetails.length; i++) {
    //                             if (evChopDetails[i].equity == 0) {
    //                                 evChopDetails.splice(i, 1);
    //                                 i--;
    //                             }
    //                         }

    //                         let tablePlayer = table.players.find(e => e.playerId == params.playerId);
    //                         console.log("got my player data", tablePlayer)
    //                         if (!tablePlayer.hasOwnProperty('evChop')) {
    //                             if (evChopDetails.length) {
    //                                 broadcastHandler.evChop({ channelId: params.channelId, playerId: params.playerId, evChop: playerData, sentFromReconnection: true });
    //                             }
    //                         }
    //                         else {
    //                             if (!!tablePlayer.evChop) {
    //                                 const evTagData = {
    //                                     channelId: params.channelId,
    //                                     playerId: params.playerId,
    //                                     sentFromReconnection: true
    //                                 }
    //                                 console.log("evTagData is", evTagData)
    //                                 broadcastHandler.setEvTag(evTagData);
    //                             }
    //                             sendPrivateMessage({ playerId: params.playerId, channelId: params.channelId, info: "Waiting for other player's decision on Ev Chop", successId: 'successMessage.WAITING_EV_CHOP' })
    //                         }
    //                     }

    //                     else if (channel.evRITTimer) {

    //                         let tablePlayer = table.players.find(e => e.playerId == params.playerId);
    //                         console.log("got my player data", tablePlayer, table.ritDetails)

    //                         if (tablePlayer.playerId == table.ritDetails.playerId) {
    //                             let popUpTime = Math.floor(table.ritPopupTime - (Number(new Date()) - channel.evRITTimer.startedAt) / 1000);
    //                             table.ritDetails.timer = popUpTime;
    //                             broadcastHandler.ritEvChop({ channel: channel, channelId: params.channelId, data: table.ritDetails, sentFromReconnection: true });
    //                         }
    //                         else {
    //                             sendPrivateMessage({ playerId: params.playerId, channelId: params.channelId, info: "Waiting for other player decision on RIT", isEvRIT: true, successId: "successMessage.WAITING_RIT" })
    //                         }
    //                     }
    //                 }
    //                 else {
    //                     if (channel.evChopTimer) {
    //                         sendPrivateMessage({ playerId: params.playerId, channelId: params.channelId, info: "Waiting for other player's decision on Ev Chop", successId: 'successMessage.WAITING_EV_CHOP' })
    //                     }
    //                     else if (channel.evRITTimer) {
    //                         sendPrivateMessage({ playerId: params.playerId, channelId: params.channelId, info: "Waiting for other player decision on RIT", isEvRIT: true, successId: "successMessage.WAITING_RIT" })
    //                     }
    //                 }
    //             }
    //         })
    //     }
    //     cb({ success: true });
    // };
    /*===============================  END ==========================*/

    // <<<<<<<<<<<<<<<<<<< RPC CALLS HANDLER FINISHED >>>>>>>>>>>>>>>>>>>>>>>>>


}