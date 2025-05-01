import { Injectable } from "@nestjs/common";
import _ from 'underscore';
import { stateOfX, popupTextManager, systemConfig } from "shared/common";
import { PokerDatabaseService } from "shared/common/datebase/pokerdatabase.service";
import { ImdbDatabaseService } from "shared/common/datebase/Imdbdatabase.service";











@Injectable()
export class CalculateChannelDetailsService {

    constructor(
        private readonly db: PokerDatabaseService,
        private readonly imdb: ImdbDatabaseService,
    ) { }






    /*============================  START  =================================*/
    // Getting all channels of this ID
    /**
     * this function gets all tables by tournament ID
     * @method getAllChannels
     * @param  {object}       params request json object
     * @param  {Function}     cb     callback function
     */
    // New
    async getAllChannels(params: any): Promise<any> {

        const channels = await this.imdb.getAllTableByTournamentId(params);


        if (!channels || channels.length < 1) {
            return {
                success: false,
                isRetry: false,
                isDisplay: false,
                channelId: '',
                info: popupTextManager.dbQyeryInfo.DB_CHANNEL_NOTFOUND,
                runningFor: 0,
                tournamentState: stateOfX.tournamentState.register
            };
        }

        params.channels = channels;
        return params;
    }

    // Old
    // var getAllChannels = function (params, cb) {
    //     serverLog(stateOfX.serverLogType.info, "params in getAllChannels in calculateChannelDetails - " + JSON.stringify(params));
    //     imdb.getAllTableByTournamentId(params, function (err, channels) {
    //         serverLog(stateOfX.serverLogType.info, "getting channels in get all channels in calculateChannelDetails " + JSON.stringify(channels));
    //         if (err || !channels || channels.length < 1) {
    //             cb({ success: false, isRetry: false, isDisplay: false, channelId: '', info: popupTextManager.dbQyeryInfo.DB_CHANNEL_NOTFOUND, runningFor: 0, tournamentState: stateOfX.tournamentState.register });
    //         } else {
    //             params.channels = channels;
    //             cb(null, params);
    //         }
    //     })
    // }
    /*============================  END  =================================*/




    /*============================  START  =================================*/
    //getting blind rule from db of reuired tournament ID
    /**
     * this function gets blind rule by tournament ID
     * @method getBlindRule
     * @param  {string}     tournamentId 
     * @param  {Function}   cb          callback function
     */

    // New
    async getBlindRule(tournamentId: string): Promise<any> {

        const room = await this.db.getTournamentRoom(tournamentId);
        if (!room) {
            return {
                success: false,
                isRetry: false,
                isDisplay: false,
                channelId: '',
                info: popupTextManager.dbQyeryInfo.DB_ERROR_GETTING_TOURNAMENTROOM
            };
        }


        let runningFor = 0;
        if (room.state === stateOfX.tournamentState.running) {
            runningFor = Number(new Date()) - room.tournamentStartTime;
        }

        const blindRule = await this.db.findBlindRule(room.tournamentId);

        if (!blindRule) {
            return {
                success: false,
                isRetry: false,
                isDisplay: false,
                channelId: '',
                info: popupTextManager.dbQyeryInfo.DB_ERROR_GETTING_BINDRULE
            };
        }

        return {
            success: true,
            result: blindRule.list,
            state: room.state,
            runningFor: runningFor
        };
    }

    // Old
    // var getBlindRule = function (tournamentId, cb) {
    //     serverLog(stateOfX.serverLogType.info, "tournamentId is - " + tournamentId);
    //     db.getTournamentRoom(tournamentId, function (err, room) {
    //         if (err || !room) {
    //             cb({ success: false, isRetry: false, isDisplay: false, channelId: '', info: popupTextManager.dbQyeryInfo.DB_ERROR_GETTING_TOURNAMENTROOM });
    //         } else {
    //             serverLog(stateOfX.serverLogType.info, "blind rule id is - " + JSON.stringify(room.blindRule));
    //             // calculate Running for -
    //             var runningFor = 0;
    //             if (room.state === stateOfX.tournamentState.running) {
    //                 runningFor = Number(new Date()) - room.tournamentStartTime;
    //             }
    //             serverLog(stateOfX.serverLogType.info, "tournament state is - " + room.state);
    //             serverLog(stateOfX.serverLogType.info, "running for is  - " + runningFor);
    //             db.findBlindRule(room.tournamentId, function (err, blindRule) {
    //                 serverLog(stateOfX.serverLogType.info, "blindRule is in getBlindRule in calculateChannelDetails- " + JSON.stringify(blindRule));
    //                 if (err || !blindRule) {
    //                     cb({ success: false, isRetry: false, isDisplay: false, channelId: '', info: popupTextManager.dbQyeryInfo.DB_ERROR_GETTING_BINDRULE });
    //                 } else {
    //                     cb({ success: true, result: blindRule.list, state: room.state, runningFor: runningFor });
    //                 }
    //             })
    //         }
    //     })
    // }
    /*============================  END  =================================*/



    /*============================  START  =================================*/
// prepare data of blind info required by client
/**
 * this fucntion  calculates the blind info
 * @method calculateBlindInfo
 * @param  {object}           params request json object
 * @param  {Function}         cb     callback function
 */
// New
async calculateBlindInfo(params: any): Promise<any> {

    const blindInfo: any = {};
    blindInfo.currentBlindLevel = params.channels[0].blindLevel;
    blindInfo.currentSmallBlind = params.channels[0].smallBlind;
    blindInfo.currentBigBlind = params.channels[0].bigBlind;

    const blindRule = await this.getBlindRule(params.tournamentId);

    if (blindRule.success) {
        const blindsList = blindRule.result;
        params.runningFor = blindRule.runningFor;
        params.tournamentState = blindRule.state;

        if (blindsList.length > blindInfo.currentBlindLevel) {
            blindInfo.nextBlindLevel = params.channels[0].blindLevel + 1;
            blindInfo.nextSmallBlind = blindsList[params.channels[0].blindLevel].smallBlind;
            blindInfo.nextBigBlind = blindsList[params.channels[0].blindLevel].bigBlind;
            blindInfo.nextBlindUpdateTime = params.channels[0].gameStartTime + blindsList[params.channels[0].blindLevel].duration;
        } else {
            blindInfo.nextBlindLevel = "This is last level";
            blindInfo.nextSmallBlind = "This is last small blind";
            blindInfo.nextBigBlind = "This is last big blind";
            blindInfo.nextBlindUpdateTime = "This is last level";
        }

        params.blindInfo = blindInfo;
        return params;
    } else {
        return {
            success: false,
            isRetry: false,
            isDisplay: false,
            channelId: '',
            info: popupTextManager.dbQyeryInfo.DB_ERROR_GETTING_BINDINFO
        };
    }
}

// Old
// var calculateBlindInfo = function (params, cb) {
//     serverLog(stateOfX.serverLogType.info, "params in calculateBlindInfo in calculateChannelDetails are - " + JSON.stringify(params));
//     var blindInfo = {}, blindsList;
//     blindInfo.currentBlindLevel = params.channels[0].blindLevel;
//     blindInfo.currentSmallBlind = params.channels[0].smallBlind;
//     blindInfo.currentBigBlind = params.channels[0].bigBlind;
//     getBlindRule(params.tournamentId, function (blindRule) {
//         serverLog(stateOfX.serverLogType.info, "blindRule is in calculateBlindInfo is - " + JSON.stringify(blindRule));
//         if (blindRule.success) {
//             blindsList = blindRule.result;
//             params.runningFor = blindRule.runningFor;
//             params.tournamentState = blindRule.state;
//             if (blindsList.length > blindInfo.currentBlindLevel) {
//                 blindInfo.nextBlindLevel = params.channels[0].blindLevel + 1;
//                 blindInfo.nextSmallBlind = blindsList[params.channels[0].blindLevel].smallBlind;
//                 blindInfo.nextBigBlind = blindsList[params.channels[0].blindLevel].bigBlind;
//                 blindInfo.nextBlindUpdateTime = params.channels[0].gameStartTime + blindsList[params.channels[0].blindLevel].duration;
//             } else {
//                 blindInfo.nextBlindLevel = "This is last level";
//                 blindInfo.nextSmallBlind = "This is last small blind";
//                 blindInfo.nextBigBlind = "This is last big blind";
//                 blindInfo.nextBlindUpdateTime = "This is last level"
//             }
//             params.blindInfo = blindInfo;
//             cb(null, params);
//         } else {
//             cb({ success: false, isRetry: false, isDisplay: false, channelId: '', info: popupTextManager.dbQyeryInfo.DB_ERROR_GETTING_BINDINFO })
//         }
//     })
// }
    /*============================  END  =================================*/



    /*============================  START  =================================*/
    /**
     * process channels one by one and prepare data required by client
     * @method processChannels
     * @param  {object}        params request json object
     * @param  {Function}      cb     callback function
     */
    // New
    async processChannels(params: any): Promise<any> {

        const channelsData: any[] = [];
        let channelNo = 0;

        for (const channel of params.channels) {
            if (channel.players.length > 0) {
                const playerInfo: any = {};
                playerInfo.channelNo = channelNo++;
                playerInfo.channelId = channel.channelId;

                const players = channel.players.map((player: any) => ({
                    playerId: player.playerId,
                    chips: player.chips,
                    seatIndex: player.seatIndex,
                    userName: player.playerName
                }));

                playerInfo.players = players;
                playerInfo.largestStack = _.max(players, function (player) { return player.chips; });
                playerInfo.smallestStack = _.min(players, function (player) { return player.chips; });

                channelsData.push(playerInfo);
            }
        }

        params.channels = channelsData;
        return params;
    }

    // Old
    // var processChannels = function (params, cb) {
    //     serverLog(stateOfX.serverLogType.info, "in processChannels in calculate channel details - " + JSON.stringify(params));
    //     var channelsData = [], channelNo = 0;
    //     async.each(params.channels, function (channel, callback) {
    //         if (channel.players.length > 0) {
    //             var playerInfo = {};
    //             playerInfo.channelNo = channelNo++;
    //             playerInfo.channelId = channel.channelId;
    //             var players = [];
    //             async.each(channel.players, function (player, playerCb) {
    //                 players.push({
    //                     playerId: player.playerId,
    //                     chips: player.chips,
    //                     seatIndex: player.seatIndex,
    //                     userName: player.playerName
    //                 })
    //                 playerCb();
    //             }, function (err) {
    //                 if (err) {
    //                     serverLog(stateOfX.serverLogType.info, "Error in async while getting players from channel in processChannels in calculateChannelDetails");
    //                     callback();
    //                 }
    //                 playerInfo.players = players;
    //                 playerInfo.largestStack = _.max(players, function (player) { return player.chips; });
    //                 playerInfo.smallestStack = _.min(players, function (player) { return player.chips; });
    //                 serverLog(stateOfX.serverLogType.info, "player in fo is in processChannels is - ", JSON.stringify(playerInfo));
    //                 channelsData.push(playerInfo);
    //                 callback();
    //             })
    //         } else {
    //             callback();
    //         }
    //     }, function (err) {
    //         if (err) {
    //             serverLog(stateOfX.serverLogType.info, "Error in async while process channels in processChannels in calculateChannelDetails");
    //             cb({ success: false, isRetry: false, isDisplay: false, channelId: '', info: popupTextManager.dbQyeryInfo.DB_ERROR_PROCESS_CHANNELDETAILS });
    //         }
    //         params.channels = channelsData;
    //         serverLog(stateOfX.serverLogType.info, "final param is processChannels in calculate channel details is - " + JSON.stringify(params));
    //         cb(null, params);
    //     });
    // }
    /*============================  END  =================================*/




    /*============================  START  =================================*/
// Get channel details initial function
// By this all the other function called in waterfall

/**
 * this function contains all the function calls required for calculating channel details
 * @method getChannelDetails
 * @param  params request JSON object
 * @param  cb     callbcak function
 */
// New
async getChannelDetails(params: any): Promise<any> {
    
    try {
        params = await this.getAllChannels(params);
        params = await this.calculateBlindInfo(params);
        params = await this.processChannels(params);

        return {
            success: true,
            result: params,
            runningFor: params.runningFor,
            tournamentState: params.tournamentState
        };
    } catch (err) {
        return err;
    }
}
// Old
// channelDetails.getChannelDetails = function (params, cb) {
//     serverLog(stateOfX.serverLogType.info, "params in get all the channelDetails - " + JSON.stringify(params));
//     async.waterfall([
//         async.apply(getAllChannels, params),
//         calculateBlindInfo,
//         processChannels
//     ], function (err) {
//         if (err) {
//             cb(err);
//         } else {
//             serverLog(stateOfX.serverLogType.info, "params is in getChannelDetails - " + JSON.stringify(params));
//             cb({ success: true, result: params, runningFor: params.runningFor, tournamentState: params.tournamentState });
//         }
//     })
// }

    /*============================  END  =================================*/























}