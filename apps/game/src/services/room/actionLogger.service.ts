import { Injectable } from "@nestjs/common";
import _ from "underscore";
import stateOfX from "shared/common/stateOfX.sevice";
import { ImdbDatabaseService } from "shared/common/datebase/Imdbdatabase.service";
import { PokerDatabaseService } from "shared/common/datebase/pokerdatabase.service";

import { BroadcastHandlerService } from "./broadcastHandler.service";

declare const pomelo: any; // In this place we have add socket.io



@Injectable()
export class ActionLoggerService {


    constructor(
        private db: PokerDatabaseService,
        private imdb: ImdbDatabaseService,
        private readonly broadcastHandler: BroadcastHandlerService
    ) { }

    /*=================  START   ==================*/
    /**
    * broadcsat for disable chat if all in occured on table in room
    * @method handlePlayerTurnBroadcast
    * @param  {Object}                  channel    pomelo channel for room
    * @param  {String}                  channelId  channel name
    * @param  {String}                  eventName  eventName of action
    * @param  {String}                  actionName action of player move
    * @param  {String}                  text       log text
    */

    handlePlayerTurnBroadcast(channel: any, channelId: string, eventName: string, actionName: string, text: string): void {
        if (eventName === stateOfX.logEvents.playerTurn) {
            text = text.replace(/\n/g, "");

            // Set all-in occurred in this channel, disable chat and send dealer message
            if (!channel.allInOccuredOnChannel && actionName === stateOfX.move.allin) {
                this.broadcastHandler.fireChatDisabled({ channel, channelId });
                this.broadcastHandler.fireDealerChat({
                    channel,
                    channelId,
                    message: "The player chat has been disabled now due to All In."
                });
                channel.allInOccuredOnChannel = true;
            }
        }
    };


    // var handlePlayerTurnBroadcast = function (channel, channelId, eventName, actionName, text) {
    //     if (eventName === stateOfX.logEvents.playerTurn) {
    //         text = text.replace("\n", "");
    //         // Set all in occured in this channel, disable chat and text in dealer chat as well
    //         if (!channel.allInOccuredOnChannel && actionName === stateOfX.move.allin) {
    //             if (!channel.allInOccuredOnChannel) {
    //                 broadcastHandler.fireChatDisabled({ channel: channel, channelId: channelId });
    //                 broadcastHandler.fireDealerChat({ channel: channel, channelId: channelId, message: "The player chat has been disabled now due to All In." });
    //             }
    //             channel.allInOccuredOnChannel = true;
    //         }
    //     }
    // }
    /*=================  END   ==================*/



    /*=================  START   ==================*/
    /**
    * broadcasts dealer chat on every action
    * @method fireDealerChat
    * @param  {Object}       channel   pomelo channel for room
    * @param  {String}       channelId channel name
    * @param  {Object}       message   data for dealer chat
    */

    fireDealerChat(channel: any, channelId: string, message: string): void {
        this.broadcastHandler.fireDealerChat({ channel, channelId, message });
    };

    // var fireDealerChat = function (channel, channelId, message) {
    //     broadcastHandler.fireDealerChat({ channel: channel, channelId: channelId, message: message });
    // }
    /*=================  END   ==================*/

    /*=================  START   ==================*/
    /**
    * This function broadcast a new hand tab entry on game over
    * @method fireHandTabOnSummaryBroadcast
    * @param  {String}                      eventName eventName of action
    * @param  {Object}                      channel   pomelo channel object for room
    * @param  {String}                      channelId channel name
    * @param  {Object}                      handTab   data of hand tab; contains cards and pot
    */

    fireHandTabOnSummaryBroadcast(eventName: string, channel: any, channelId: string, handTab: any): void {
        if (eventName === stateOfX.logEvents.summary) {
            this.broadcastHandler.fireHandtabBroadcast({
                channel,
                channelId,
                handTab,
            });
        }
    };

    // var fireHandTabOnSummaryBroadcast = function (eventName, channel, channelId, handTab) {
    //     if (eventName === stateOfX.logEvents.summary) {
    //         broadcastHandler.fireHandtabBroadcast({ channel: channel, channelId: channelId, handTab: handTab });
    //     }
    // }
    /*=================  END   ==================*/


    /*=================  START   ==================*/
    // ### Create game event logs and Dealer chat
    // // > If the dealer sends last chat as SUMMARY
    // > Send hand tab broadcast at the same time
    // > So that a new hand histroy tab will be added into client hand tab

    async createEventLog(params: any): Promise<void> {
        if (!!params.data && !!params.data.channelId) {
            try {
                const createLogResponse = await new Promise<any>((resolve, reject) => {
                    pomelo.app.rpc.database.tableRemote.createLog(
                        {},
                        { channelId: params.data.channelId, data: params.data },
                        (response: any) => {
                            if (response?.success) {
                                resolve(response);
                            } else {
                                reject(response);
                            }
                        }
                    );
                });

                const { channel, data } = params;

                // Only fire chat if not firstJoined during joinChannel event
                if (!(data.eventName === stateOfX.logEvents.joinChannel && !data.rawData.firstJoined)) {
                    this.fireDealerChat(channel, data.channelId, createLogResponse.data.text);
                }

                this.handlePlayerTurnBroadcast(channel, data.channelId, data.eventName, data.rawData.actionName, createLogResponse.data.text);
                this.fireHandTabOnSummaryBroadcast(data.eventName, channel, data.channelId, createLogResponse.data.handTab);

            } catch (error) {
                console.log(stateOfX.serverLogType.error, 'createLogResponse - ' + JSON.stringify(error));
            }
        } else {
            console.log(
                stateOfX.serverLogType.error,
                'Not creating log for an event as some argument channelId is missing, to prevent table lock issue. ' +
                JSON.stringify(_.keys(params))
            );
        }
    };

    // actionLogger.createEventLog = function (params) {
    //     if (!!params.data && !!params.data.channelId) {
    //         serverLog(stateOfX.serverLogType.info, "params in createEventLog keys - " + JSON.stringify(_.keys(params)));
    //         serverLog(stateOfX.serverLogType.info, "params.data in createEventLog keys - " + JSON.stringify(_.keys(params.data)));
    //         serverLog(stateOfX.serverLogType.info, "params.data.rawData in createEventLog keys - " + JSON.stringify(_.keys(params.data.rawData)));
    //         pomelo.app.rpc.database.tableRemote.createLog({}, { channelId: params.data.channelId, data: params.data }, function (createLogResponse) {
    //             if (createLogResponse.success) {
    //                 serverLog(stateOfX.serverLogType.info, 'createLogResponse.data' + JSON.stringify(createLogResponse.data));
    //                 if (!(params.data.eventName == stateOfX.logEvents.joinChannel && !params.data.rawData.firstJoined)) {
    //                     fireDealerChat(params.channel, params.data.channelId, createLogResponse.data.text);
    //                 }
    //                 handlePlayerTurnBroadcast(params.channel, params.data.channelId, params.data.eventName, params.data.rawData.actionName, createLogResponse.data.text);
    //                 fireHandTabOnSummaryBroadcast(params.data.eventName, params.channel, params.data.channelId, createLogResponse.data.handTab);
    //             } else {
    //                 serverLog(stateOfX.serverLogType.error, 'createLogResponse - ' + JSON.stringify(createLogResponse));
    //             }
    //         });
    //     } else {
    //         serverLog(stateOfX.serverLogType.error, 'Not creating log for an event in as some argument channelId is missing, to prevent table lock issue. ' + JSON.stringify(_.keys(params)));
    //     }
    // }
    /*=================  END   ==================*/


}