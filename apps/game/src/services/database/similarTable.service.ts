import { Injectable } from "@nestjs/common";
import _ld from "lodash";
import _ from 'underscore';
import { stateOfX, popupTextManager } from "shared/common";
import { PokerDatabaseService } from "shared/common/datebase/pokerdatabase.service";
import { ImdbDatabaseService } from "shared/common/datebase/Imdbdatabase.service";
import { validateKeySets } from "shared/common/utils/activity";



@Injectable()
export class SimilarTableService {

    constructor(
        private readonly db: PokerDatabaseService,
        private readonly imdb: ImdbDatabaseService,
    ) { }




    /*================================  START  ============================*/
    // Add additional params for further calculation
    // initialise
    async searchTableParams(params: any): Promise<any> {

        const validated = await validateKeySets("Request", "database", "searchTableParams", params);

        if (validated.success) {
            params.similarChannels = [];
            params.channelDetails = {};
            params.response = {};
            params.channelFound = false;

            return params;
        } else {
            throw validated;
        }
    };
    /*================================  END  ============================*/

    /*================================  START  ============================*/
    // Search for similar tables in db
    // based on given searchParams
    async searchSimilarTable(params: any): Promise<any> {

        const validated = await validateKeySets("Request", "database", "searchSimilarTable", params);

        if (!validated.success) {
            throw validated;
        }


        try {
            const channels = await this.db.findTable(params.searchParams);

            if (!channels || channels.length <= 0) {
                throw {
                    success: false,
                    isRetry: false,
                    isDisplay: true,
                    channelId: params.channelId || "",
                    info: popupTextManager.falseMessages.SEARCHSIMILARTABLE_TABLENOTEXISTFAIL_SIMILARTABLE,
                    errorId: "falseMessages.SEARCHSIMILARTABLE_TABLENOTEXISTFAIL_SIMILARTABLE"
                };
            }

            params.similarChannels = _.pluck(channels, '_id');
            return params;

        } catch (err) {
            throw {
                success: false,
                isRetry: false,
                isDisplay: true,
                channelId: params.channelId || "",
                info: popupTextManager.falseMessages.SEARCHSIMILARTABLE_TABLEEXISTFAIL_SIMILARTABLE,
                errorId: "falseMessages.SEARCHSIMILARTABLE_TABLEEXISTFAIL_SIMILARTABLE"
            };
        }
    };

    /*================================  END  ============================*/

    /*================================  START  ============================*/
    // Get inmemory table details
    // Check if player is not already playing into table
    // Check if table is not already full (all seats occupied)
    // Check if player is not already joined into table (as observer mode)
    async assignPlayersToChannel(params: any): Promise<any> {
        params.channelStrength = [];

        for (const channelId of params.similarChannels) {
            try {
                const table = await this.imdb.getTable(channelId);

                if (table) {
                    if (_ld.findIndex(table.players, { playerId: params.playerId }) < 0) {
                        if ((table.players.length + table.queueList.length) < table.maxPlayers) {
                            const response = await this.imdb.isPlayerJoined({
                                channelId: channelId.toString(),
                                playerId: params.playerId
                            });

                            if (!response) {
                                params.channelStrength.push({
                                    channelId: channelId,
                                    tableName: table.channelName,
                                    players:
                                        _.where(table.players, { state: stateOfX.playerState.playing }).length +
                                        _.where(table.players, { state: stateOfX.playerState.waiting }).length
                                });
                            }
                        }
                    }
                } else {
                    params.channelStrength.push({
                        channelId: channelId,
                        tableName: "No Table Name",
                        players: 0
                    });
                }
            } catch (err) {
                throw {
                    success: false,
                    isRetry: false,
                    isDisplay: true,
                    channelId: "",
                    info:
                        popupTextManager.dbQyeryInfo.DBGETTABLE_ASSIGNPLAYERSTOCHANNELFAIL_SIMILARTABLE +
                        JSON.stringify(err),
                    errorId: "dbQyeryInfo.DBGETTABLE_ASSIGNPLAYERSTOCHANNELFAIL_SIMILARTABLE"
                };
            }
        }

        return params;
    };
    /*================================  END  ============================*/


    /*================================  START  ============================*/
    // sort tables (if found mroe than 1) by channel strength -
    // count of playing + waiting player
    sortChannelStrength(params: any) {

        if (params.channelStrength.length >= 1) {

            params.channelStrength.sort((a: any, b: any) => parseInt(a.players) - parseInt(b.players));

            return params;
        } else {
            throw {
                success: false,
                isRetry: false,
                isDisplay: true,
                channelId: params.channelId || "",
                info: popupTextManager.falseMessages.SORTCHANNELSTRENGTH_FAIL_SIMILARTABLE,
                errorId: "falseMessages.SORTCHANNELSTRENGTH_FAIL_SIMILARTABLE"
            };
        }
    };
    /*================================  END  ============================*/

    /*================================  START  ============================*/
    // validate channel and finally select ONE channel
    async validateAndAssignChannel(params: any): Promise<any> {
        // Remove channels with 0 players strength
        const lastIndexOfZero = _.lastIndexOf(_.pluck(params.channelStrength, 'players'), 0);

        if (lastIndexOfZero >= 0) {
            const channelsWithZeroPlayers = params.channelStrength.slice(0, lastIndexOfZero + 1);
            params.channelStrength.splice(0, lastIndexOfZero + 1);

            if (params.channelStrength.length >= 1) {
                params.similarChannelId = params.channelStrength[0].channelId;
            } else {
                params.similarChannelId = channelsWithZeroPlayers[0].channelId;
            }
        } else {
            params.similarChannelId = params.channelStrength[0].channelId;
        }

        return params;
    };

    /*================================  END  ============================*/


    /*================================  START  ============================*/
    // Get all similar tables
    // Get total playing players of that particular table and assign to channel
    // Sort channel based on playing players
    // Iterate over sorted channels and make sure if player is not joined into that particular channel
    async assignChannelToPlayer(params: any): Promise<any> {
        try {
            const updatedParams = await this.assignPlayersToChannel(params);
            const sortedParams = await this.sortChannelStrength(updatedParams);
            const finalParams = await this.validateAndAssignChannel(sortedParams);
            finalParams.success = true;
            return finalParams;
        } catch (err: any) {
            err.success = false;
            return err;
        }
    };

    /*================================  END  ============================*/

    /*================================  START  ============================*/
    // Validated all the channels if any of it is suitable for request
    async validateSuitableTable(params: any): Promise<any> {
        const validated = await validateKeySets("Request", "database", "validateSuitableTable", params);

        if (validated.success) {
            const assignChannelResponse = await this.assignChannelToPlayer(params);

            if (assignChannelResponse.success) {
                return assignChannelResponse;
            } else {
                throw assignChannelResponse;
            }
        } else {
            throw validated;
        }
    };

    /*================================  END  ============================*/

    /*================================  START  ============================*/
    // ### Create final response - just add similarChannelId
    async createSimilarTbaleResponse (params: any): Promise<any> {
        const validated = await validateKeySets("Request", "database", "createSimilarTbaleResponse", params);

        if (validated.success) {
            params.response = {
                success: true,
                channelType: params.channelType,
                similarChannelId: params.similarChannelId,
                channelId: params.channelId
            };
            return params.response;
        } else {
            throw validated;
        }
    };
    /*================================  END  ============================*/


    /*================================  START  ============================*/
    // find similar configuration table
    // for API - JOIN SIMILAR TABLE
    async searchTable (params: any): Promise<any> {
        const validated = await validateKeySets("Request", "database", "searchTable", params);

        if (!validated.success) {
            throw validated;
        }

        const result1 = await  this.searchTableParams(params);
        const result2 = await  this.searchSimilarTable(result1);
        const result3 = await  this.validateSuitableTable(result2);
        const response = await this.createSimilarTbaleResponse(result3);

        return response;
    };

    /*================================  END  ============================*/






}