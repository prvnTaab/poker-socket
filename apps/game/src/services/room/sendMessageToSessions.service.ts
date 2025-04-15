import { Injectable } from "@nestjs/common";

import { systemConfig, stateOfX, popupTextManager } from 'shared/common';
import { BroadcastHandlerService } from "./broadcastHandler.service";
import { validateKeySets } from "shared/common/utils/activity";










@Injectable()
export class SendMessageToSessionsService  {


    constructor(
        private broadcastHandler:BroadcastHandlerService
    ){}


    /*====================================  START  ============================*/
    //{self,data,route}
    /**
     * this function sends message to all binded sessions
     * @method sendMessageToSessions
     * @param  {[type]}              params   object containing app, required for sending brodacast
     * 
     */

    // New
    async sendMessageToSessions(params: any): Promise<void> {
        try {
            const validated = await validateKeySets("Request", "connector", "sendMessageToSessions", params);

            if (validated.success) {
                params.self.app.sessionService.forEachBindedSession(async (session: any) => {
                    const playerId = session.get("playerId");

                    // Sending broadcast to all players.
                    await this.broadcastHandler.sendCustomMessageToUser({
                        self: params.self,
                        playerId: playerId,
                        route: params.route,
                        data: params.data
                    });
                });
            } else {
                console.log(stateOfX.serverLogType.info, validated);
            }
        } catch (err) {
            console.log(stateOfX.serverLogType.error, `Error in sendMessageToSessions: ${err}`);
        }
    };


    // Old
    // sendMessage.sendMessageToSessions = function(params) {
    //     keyValidator.validateKeySets("Request", "connector", "sendMessageToSessions", params, function (validated){
    //       if(validated.success) {
    //         params.self.app.sessionService.forEachBindedSession(function(session) {
    //           var playerId = session.get("playerId");
    //           serverLog(stateOfX.serverLogType.info,'session for playerId is - ' + session.get("playerId"));
    //           broadcastHandler.sendCustomMessageToUser({self: params.self, playerId: playerId, route: params.route, data: params.data}) // Sending broadcast to all players.
    //         })
    //       } else {
    //         serverLog(stateOfX.serverLogType.info,validated);
    //       }
    //     })
    //   }

    /*====================================  END  ============================*/
  




}