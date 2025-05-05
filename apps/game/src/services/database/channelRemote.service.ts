import { Injectable } from "@nestjs/common";
import _ from 'underscore';
import { stateOfX, popupTextManager } from "shared/common";
import { PokerDatabaseService } from "shared/common/datebase/pokerdatabase.service";
import { ImdbDatabaseService } from "shared/common/datebase/Imdbdatabase.service";
import { validateKeySets } from "shared/common/utils/activity";












@Injectable()
export class ChannelRemoteService {



    constructor(
        private readonly db: PokerDatabaseService,
        private readonly imdb: ImdbDatabaseService
    ) { }






    /*============================  START  =================================*/
    // ### Add additional params in existing one for calculation
    // New
    async setSearchChannelParams(params: any): Promise<any> {

        const validated = await validateKeySets("Request", "database", "setSearchChannelParams", params);

        if (validated.success) {
            params.channelDetails = {};
            params.response = {};
            return params;
        } else {
            throw validated;
        }
    }


    // Old
    // var setSearchChannelParams = function(params, cb) {
    //   console.log( 'in channelRemote - setSearchChannelParams');
    //   keyValidator.validateKeySets("Request", "database", "setSearchChannelParams", params, function(validated){
    //     if(validated.success) {
    //       params.channelDetails = {};
    //       params.response = {};
    //       cb(null, params);
    //     } else {
    //       cb(validated);
    //     }
    //   });
    // }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    // ### Get a final channel ID if available
    // New
    async searchChannel(params: any): Promise<any> {

        const validated = await validateKeySets("Request", "database", "searchChannel", params);

        if (!validated.success) {
            throw validated;
        }

        // Check if this is a tournament request then search for an instance
        if (!params.channelId) {
            const channel: any = await this.imdb.findTableByTournamentId(params.channelId, params.playerId);

            params.channelId = channel.channelId;
            return params;
        } else {
            console.log("channelRemote - in searchChannel else");
            return params;
        }
    }

    // Old
    // var searchChannel = function(params, cb) {
    // console.log( 'in channelRemote - searchChannel', params);
    // keyValidator.validateKeySets("Request", "database", "searchChannel", params, function(validated){
    //   if(validated.success) {
    //     // Check if this is a tournament request then search for an instance
    //     if(!params.channelId) {
    //       imdb.findTableByTournamentId(params.channelId, params.playerId, function(err, channel) {
    //         if(err) {
    //           cb(params);
    //         } else {
    //           console.log( "channel is in seach channel",JSON.strigify(channel));
    //           params.channelId = channel.channelId;
    //           cb(null, params);
    //         }
    //       })
    //     } else {
    //       console.log( "channelRemote-in searchChannel else");
    //       cb(null, params);
    //     }
    //   } else {
    //     cb(validated);
    //   }
    // });
    // }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    // ### Get this channel details from database wired tiger
    // New
    async getChannelDetails(params: any): Promise<any> {
        console.log('in channelRemote - getChannelDetails');

        const validated = await validateKeySets("Request", "database", "getChannelDetails", params);

        if (!validated.success) {
            throw validated;
        }

        console.log('About to get table from main db', params);

        const channel = await this.db.findTableById(params.channelId);

        if (!channel) {
            throw {
                success: false,
                channelId: params.channelId,
                isRetry: false,
                isDisplay: false,
                info: popupTextManager.dbQyeryInfo.DB_CHANNEL_NOTFOUND
            };
        }

        params.channelDetails = channel;

        if (channel.channelType === stateOfX.gameType.tournament) {
            const tournamentRoom = await this.db.getTournamentRoom(channel.tournament.tournamentId);

            if (!tournamentRoom) {
                console.log("Error in setting gameVersionCount in getChannelDetails");
                return params; // return without throwing, to match old cb(params)
            }

            params.channelDetails.gameVersionCount = tournamentRoom.gameVersionCount;
        }

        return params;
    }


    // Old
    // var getChannelDetails = function (params, cb) {
    //     console.log('in channelRemote - getChannelDetails');
    //     keyValidator.validateKeySets("Request", "database", "getChannelDetails", params, function (validated) {
    //         if (validated.success) {
    //             console.log('About to get table form main db', params)
    //             db.findTableById(params.channelId, function (err, channel) {
    //                 console.log('err and channel');
    //                 console.log(err);
    //                 console.log(channel);
    //                 if (!err && !!channel) {
    //                     console.log("Channel details from main db: ", channel);
    //                     params.channelDetails = channel;
    //                     if (channel.channelType === stateOfX.gameType.tournament) {
    //                         db.getTournamentRoom(channel.tournament.tournamentId, function (err, tournamentRoom) {
    //                             if (err || !tournamentRoom) {
    //                                 console.log("Error in setting gameVersionCount in getChannelDetails");
    //                                 cb(params);
    //                             } else {
    //                                 console.log("tournamentRoom is in getChannelDetails - ", JSON.stringify(tournamentRoom));
    //                                 params.channelDetails.gameVersionCount = tournamentRoom.gameVersionCount;
    //                                 cb(null, params);
    //                             }
    //                         })
    //                     } else {
    //                         cb(null, params)
    //                     }
    //                 } else {
    //                     cb({ success: false, channelId: params.channelId, isRetry: false, isDisplay: false, info: popupTextManager.dbQyeryInfo.DB_CHANNEL_NOTFOUND });
    //                 }
    //             });
    //         } else {
    //             cb(validated);
    //         }
    //     });
    // }
    /*============================  END  =================================*/



    /*============================  START  =================================*/
    // ### Get rake rule for this channel
    // New
    async assignRakeRule(params: any): Promise<any> {
        if (params.channelDetails.channelType === stateOfX.gameType.normal) {

            params.channelDetails.rake = params.channelDetails.rake;
        } else {
            console.log('Not assigning rake rule as Game type is - ' + params.channelDetails.channelType);
        }

        return params;
    }


    // Old
    // var assignRakeRule = function (params, cb) {
    //     if (params.channelDetails.channelType === stateOfX.gameType.normal) {
    //         serverLog(stateOfX.serverLogType.info, 'Getting rake rule for this channel using id - ' + JSON.stringify(params.channelDetails.rakeRule));
    //         params.channelDetails.rake = params.channelDetails.rake;
    //     } else {
    //         console.log('Not assigning rake rule as Game type is - ' + params.channelDetails.channelType);
    //         cb(null, params);
    //     }
    // }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    // ### Create final response using details from database
    // New
    async createChannelResponse(params: any): Promise<any> {

        const validated = await validateKeySets("Request", "database", "createChannelResponse", params);

        if (validated.success) {
            return {
                success: true,
                channelId: params.channelId,
                channelType: params.channelType,
                tableId: params.tableId,
                channelDetails: {
                    channelId: params.channelDetails.channelId || params.channelId,
                    channelType: params.channelDetails.channelType,
                    isMasterTable: params.channelDetails.isMasterTable,
                    secondId: params.channelDetails.secondId,
                    jwlLimit: params.channelDetails.jwlLimit,
                    masterChannelId: params.channelDetails.masterChannelId,
                    masterTableName: params.channelDetails.masterTableName,
                    channelName: params.channelDetails.channelName,
                    channelVariation: params.channelDetails.channelVariation,
                    turnTime: params.channelDetails.turnTime,
                    callTime: params.channelDetails.callTime,
                    ctEnabledBufferTime: params.channelDetails.ctEnabledBufferTime,
                    ctEnabledBufferHand: params.channelDetails.ctEnabledBufferHand,
                    isCTEnabledTable: params.channelDetails.isCTEnabledTable,
                    maxPlayers: params.channelDetails.maxPlayers,
                    minPlayers: params.channelDetails.minPlayers,
                    smallBlind: params.channelDetails.smallBlind,
                    bigBlind: params.channelDetails.bigBlind,
                    isRabbitTable: params.channelDetails.isRabbitTable,
                    buyRabbit: params.channelDetails.buyRabbit,
                    ante: params.channelDetails.ante,
                    isStraddleEnable: params.channelDetails.isStraddleEnable,
                    runItTwiceEnable: params.channelDetails.runItTwiceEnable,
                    minBuyIn: params.channelDetails.minBuyIn,
                    maxBuyIn: params.channelDetails.maxBuyIn,
                    numberOfRebuyAllowed: params.channelDetails.numberOfRebuyAllowed,
                    hourLimitForRebuy: params.channelDetails.hourLimitForRebuy,
                    gameInfo: params.channelDetails.gameInfo,
                    rakeRule: params.channelDetails.rakeRule,
                    rake: params.channelDetails.rake,
                    gameInterval: params.channelDetails.gameInterval,
                    isPotLimit: params.channelDetails.isPotLimit,
                    isPrivate: JSON.parse(params.channelDetails.isPrivateTabel) || false,
                    password: params.channelDetails.passwordForPrivate || '123',
                    isRealMoney: params.channelDetails.isRealMoney,
                    rebuyHourFactor: params.channelDetails.rebuyHourFactor,
                    blindMissed: params.channelDetails.blindMissed,
                    tournament: params.channelDetails.tournament,
                    tournamentName: params.channelDetails.tournamentName || "",
                    noOfChipsAtGameStart: params.channelDetails.noOfChipsAtGameStart,
                    gameVersionCount: params.channelDetails.gameVersionCount || 0,
                    isRunItTwiceTable: params.channelDetails.isRunItTwiceTable || false,
                    isEvChopTable: params.channelDetails.isEvChopTable || false,
                    evPopupTime: params.channelDetails.evPopupTime || 0,
                    evEquityFee: params.channelDetails.evEquityFee || 0,
                    ritPopupTime: params.channelDetails.ritPopupTime || 0,
                    tableAutoStraddle: params.channelDetails.tableAutoStraddle || false
                }
            };
        } else {
            return validated;
        }
    }


    // Old
    // var createChannelResponse = function (params, cb) {
    //     console.log('in channelRemote - createChannelResponse', params.channelDetails);
    //     keyValidator.validateKeySets("Request", "database", "createChannelResponse", params, function (validated) {
    //         if (validated.success) {
    //             cb(null, {
    //                 success: true,
    //                 channelId: params.channelId,
    //                 channelType: params.channelType,
    //                 tableId: params.tableId,
    //                 channelDetails: {
    //                     channelId: params.channelDetails.channelId || params.channelId,
    //                     channelType: params.channelDetails.channelType,
    //                     isMasterTable: params.channelDetails.isMasterTable,
    //                     secondId: params.channelDetails.secondId,
    //                     jwlLimit: params.channelDetails.jwlLimit,
    //                     masterChannelId: params.channelDetails.masterChannelId,
    //                     masterTableName: params.channelDetails.masterTableName,
    //                     channelName: params.channelDetails.channelName,
    //                     channelVariation: params.channelDetails.channelVariation,
    //                     turnTime: params.channelDetails.turnTime,
    //                     callTime: params.channelDetails.callTime,
    //                     ctEnabledBufferTime: params.channelDetails.ctEnabledBufferTime,
    //                     ctEnabledBufferHand: params.channelDetails.ctEnabledBufferHand,
    //                     isCTEnabledTable: params.channelDetails.isCTEnabledTable,
    //                     maxPlayers: params.channelDetails.maxPlayers,
    //                     minPlayers: params.channelDetails.minPlayers,
    //                     smallBlind: params.channelDetails.smallBlind,
    //                     bigBlind: params.channelDetails.bigBlind,
    //                     isRabbitTable: params.channelDetails.isRabbitTable,
    //                     buyRabbit: params.channelDetails.buyRabbit,
    //                     ante: params.channelDetails.ante,
    //                     isStraddleEnable: params.channelDetails.isStraddleEnable,
    //                     runItTwiceEnable: params.channelDetails.runItTwiceEnable,
    //                     minBuyIn: params.channelDetails.minBuyIn,
    //                     maxBuyIn: params.channelDetails.maxBuyIn,
    //                     numberOfRebuyAllowed: params.channelDetails.numberOfRebuyAllowed,
    //                     hourLimitForRebuy: params.channelDetails.hourLimitForRebuy,
    //                     gameInfo: params.channelDetails.gameInfo,
    //                     rakeRule: params.channelDetails.rakeRule,
    //                     rake: params.channelDetails.rake,
    //                     gameInterval: params.channelDetails.gameInterval,
    //                     isPotLimit: params.channelDetails.isPotLimit,
    //                     isPrivate: JSON.parse(params.channelDetails.isPrivateTabel) || false,
    //                     password: params.channelDetails.passwordForPrivate || '123',
    //                     isRealMoney: params.channelDetails.isRealMoney,
    //                     rebuyHourFactor: params.channelDetails.rebuyHourFactor,
    //                     blindMissed: params.channelDetails.blindMissed,
    //                     tournament: params.channelDetails.tournament,
    //                     tournamentName: params.channelDetails.tournamentName || "",
    //                     noOfChipsAtGameStart: params.channelDetails.noOfChipsAtGameStart,
    //                     gameVersionCount: params.channelDetails.gameVersionCount || 0,
    //                     isRunItTwiceTable: params.channelDetails.isRunItTwiceTable || false,
    //                     isEvChopTable: params.channelDetails.isEvChopTable || false,
    //                     evPopupTime: params.channelDetails.evPopupTime || 0,
    //                     evEquityFee: params.channelDetails.evEquityFee || 0,
    //                     ritPopupTime: params.channelDetails.ritPopupTime || 0,
    //                     tableAutoStraddle: params.channelDetails.tableAutoStraddle || false
    //                 }
    //             });
    //         } else {
    //             cb(validated);
    //         }
    //     });
    // }
    /*============================  END  =================================*/



    /*============================  START  =================================*/
    /**
     * search for a table in wired tiger DB
     * at time of first join
     * @method processSearch
     * @param  {Object}      params contains channelId mainly
     * @param  {Function}    cb     callback
     */
    // New
    async processSearch(params: any): Promise<any> {
        const validated = await validateKeySets("Request", "database", "processSearch", params);
    
        if (!validated.success) {
        return validated;
        }
    
        try {
        const step1 = await this.setSearchChannelParams(params);
        const step2 = await this.searchChannel(step1);
        const step3 = await this.getChannelDetails(step2);
        // const step4 = await assignRakeRule(step3); // Uncomment if needed
        const finalResponse = await this.createChannelResponse(step3);
    
        return finalResponse;
        } catch (err) {
        return err;
        }
    }
    

    // Old
    // channelRemote.processSearch = function (params, cb) {
    //     keyValidator.validateKeySets("Request", "database", "processSearch", params, function (validated) {
    //         if (validated.success) {
    //             async.waterfall([
    //                 async.apply(setSearchChannelParams, params),
    //                 searchChannel,
    //                 getChannelDetails,
    //                 // assignRakeRule,
    //                 createChannelResponse

    //             ], function (err, response) {
    //                 if (!err) {
    //                     cb(response);
    //                 } else {
    //                     cb(err);
    //                 }
    //             })
    //         } else {
    //             cb(validated);
    //         }
    //     })
    // }
    /*============================  END  =================================*/






}