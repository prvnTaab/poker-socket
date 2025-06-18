import { Injectable } from "@nestjs/common";
import { ImdbDatabaseService } from "shared/common/datebase/Imdbdatabase.service";
import { PokerDatabaseService } from "shared/common/datebase/pokerdatabase.service";
import _ from 'underscore';
import { validateKeySets } from "shared/common/utils/activity";






//  _               = require('underscore'),
//   keyValidator      = require("../../../../../shared/keysDictionary"),
//   imdb              = require("../../../../../shared/model/inMemoryDbQuery.js"),
//   stateOfX          = require("../../../../../shared/stateOfX.js"),
//   db                = require("../../../../../shared/model/dbQuery.js"),
//   systemConfig      =  require("../../../../../shared/systemConfig.json"),
//   broadcastHandler  = require('./broadcastHandler'),
//   sendMessage       = require('./sendMessageToSessions'),
//   zmqPublish        = require("../../../../../shared/infoPublisher.js");




@Injectable()
export class OnlinePlayersService {



    constructor(
        private readonly db: PokerDatabaseService,
        private readonly imdb: ImdbDatabaseService

    ) { }




    /**
 * function to processOnlinePlayers 
 *
 * @method initilizeParams
 * @param  {Object}       params  request json object {self}
 */
    async processOnlinePlayers(params: any): Promise<void> {
        const validated = await validateKeySets("Request", "connector", "processOnlinePlayers", params);
        if (validated.success) {
            let onlinePlayersCount = 0;
            const resultCount = await this.db.findUserSessionCountInDB({});
            if (resultCount) {
                onlinePlayersCount = resultCount;
                // sendMessage.sendMessageToSessions({
                //   data: { onlinePlayers: onlinePlayersCount, event: stateOfX.recordChange.onlinePlayers },
                //   route: stateOfX.broadcasts.onlinePlayers
                // });
            }
        }
    };

    /**
     * function to getOnlinePlayer 
     *
     * @method getOnlinePlayer
     * cb                     callback
     * @param  {Object}       params  request json object {self}
     */
    async getOnlinePlayer(params: any): Promise<{ success: boolean; onlinePlayersCount?: number }> {
        const validated = await validateKeySets("Request", "connector", "getOnlinePlayer", params);
        if (validated.success) {
            const onlinePlayersCount = params.self.app.sessionService.getSessionsCount();
            return { success: true, onlinePlayersCount };
        } else {
            return validated;
        }
    };











}