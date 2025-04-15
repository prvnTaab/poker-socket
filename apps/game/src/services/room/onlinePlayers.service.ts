import { Injectable } from "@nestjs/common";

import * as _ from 'underscore';
import { systemConfig, stateOfX, popupTextManager } from 'shared/common';
import { ImdbDatabaseService } from "shared/common/datebase/Imdbdatabase.service";
import { validateKeySets } from "shared/common/utils/activity";
import { SendMessageToSessionsService } from "./sendMessageToSessions.service";












@Injectable()
export class OnlinePlayersService {



    constructor(
        private imdb: ImdbDatabaseService,
        private sendMessage: SendMessageToSessionsService,
    ) {}




    /*=============================  START  ==========================*/
    /**
     * function to processOnlinePlayers 
     *
     * @method initilizeParams
     * @param  {Object}       params  request json object {self}
     */

    // New
    async processOnlinePlayers(params: any): Promise<void> {
        try {
            const validated = await validateKeySets("Request", "connector", "processOnlinePlayers", params);
            
            if (validated.success) {
                const onlinePlayers = params.self.app.sessionService.getSessionsCount();
                
                await this.imdb.updateOnlinePlayers(onlinePlayers);
                
                await this.sendMessage.sendMessageToSessions({
                    self: params.self,
                    data: { onlinePlayers, event: stateOfX.recordChange.onlinePlayers },
                    route: stateOfX.broadcasts.onlinePlayers
                });
            } else {
                console.log(stateOfX.serverLogType.info, validated);
            }
        } catch (err) {
            console.log(stateOfX.serverLogType.error, `Error in processOnlinePlayers: ${err}`);
        }
    };


    // Old
    // onlinePlayers.processOnlinePlayers = function(params) {
    //     keyValidator.validateKeySets("Request", "connector", "processOnlinePlayers", params, function (validated){
    //       if(validated.success) {
    //         onlinePlayers = params.self.app.sessionService.getSessionsCount();
    //         serverLog(stateOfX.serverLogType.info,'onlinePlayers are - ' + onlinePlayers);
    //         imdb.updateOnlinePlayers(onlinePlayers);
    //         sendMessage.sendMessageToSessions({self:params.self, data: {onlinePlayers : onlinePlayers, event: stateOfX.recordChange.onlinePlayers}, route: stateOfX.broadcasts.onlinePlayers});
    //       } else {
    //         serverLog(stateOfX.serverLogType.info,validated);
    //       }
    //     })
    //   }
    /*=============================  END  ==========================*/



    /*=============================  START  ==========================*/
  /**
   * function to getOnlinePlayer 
   *
   * @method getOnlinePlayer
   * cb                     callback
   * @param  {Object}       params  request json object {self}
   */

    //   New
    async getOnlinePlayer(params: any): Promise<any> {
        try {
            const validated = await validateKeySets("Request", "connector", "getOnlinePlayer", params);

            if (validated.success) {
                const onlinePlayers = params.self.app.sessionService.getSessionsCount();
                console.log(stateOfX.serverLogType.info, `online players count is - ${onlinePlayers}`);
                
                return { success: true, onlinePlayersCount: onlinePlayers };

            } else {
                return validated;
            }
        } catch (err) {
            console.log(stateOfX.serverLogType.error, `Error in getOnlinePlayer: ${err}`);
        }
    };


    //   Old
    // onlinePlayers.getOnlinePlayer = function(params, cb) {
    //     keyValidator.validateKeySets("Request", "connector", "getOnlinePlayer", params, function (validated){
    //     if(validated.success) {
    //         onlinePlayers = params.self.app.sessionService.getSessionsCount();
    //         serverLog(stateOfX.serverLogType.info,"online players count is - " + onlinePlayers);
    //         cb({success: true, onlinePlayersCount: onlinePlayers})
    //     } else {
    //         serverLog(stateOfX.serverLogType.info,validated);
    //         cb(validated)
    //     }
    //     })
    // }
    /*=============================  END  ==========================*/







}