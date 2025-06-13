import { Injectable } from "@nestjs/common";
import { systemConfig } from "shared/common";
import { ImdbDatabaseService } from "shared/common/datebase/Imdbdatabase.service";














@Injectable()
export class RetryHandlerService {

    constructor(
        private readonly imdb: ImdbDatabaseService
    ) { }




    /**
 * get list of channels joined by a player
 * @method getJoinedChannles
 * @param  {Object}          params contains playerId
 * @param  {Function}        cb     callback
 */
    async getJoinedChannles(params: any): Promise<any> {
        const currentTime = Number(new Date()) - systemConfig.removeObserverRecord * 60000;

        const result = await this.imdb.playerJoinedRecord({ playerId: params.playerId });

        return { success: true, joinedChannels: result };
    };





}