import { Injectable } from "@nestjs/common";
import { PokerDatabaseService } from "shared/common/datebase/pokerdatabase.service";
import { stateOfX, popupTextManager } from "shared/common";







@Injectable()
export class QuickSeatService {

    private messages = popupTextManager.falseMessages;
    private dbMessages = popupTextManager.dbQyeryInfo;

    constructor(
        private readonly db: PokerDatabaseService,
    ) { }



    /*===================================== START ============================*/
    // New
    async getTournamentRoom(filter: any): Promise<any> {
        try {
            const result = await this.db.listTournamentRoom(filter);

            if (!result || result.length < 1) {
                return {
                    success: false,
                    info: this.dbMessages.DB_LISTTOURNAMENTROOM_NOTFOUND_QUICKSEAT,
                    isRetry: false,
                    isDisplay: true,
                    channelId: "",
                    errorId: "dbQyeryInfo.DB_LISTTOURNAMENTROOM_NOTFOUND_QUICKSEAT"
                };
            }

            return { success: true, result: result[0] };

        } catch (err) {
            return {
                success: false,
                info: this.dbMessages.DB_LISTTOURNAMENTROOM_NOTFOUND_QUICKSEAT,
                isRetry: false,
                isDisplay: true,
                channelId: "",
                errorId: "dbQyeryInfo.DB_LISTTOURNAMENTROOM_NOTFOUND_QUICKSEAT"
            };
        }
    };


    // Old
    // var getTournamentRoom = function (filter, cb) {
    // db.listTournamentRoom(filter, function (err, result) {
    //     serverLog(stateOfX.serverLogType.info, 'result is in listTournamentRoom -' + JSON.stringify(result));
    //     if (err || !result || result.length < 1) {
    //         cb({ success: false, info: dbMessages.DB_LISTTOURNAMENTROOM_NOTFOUND_QUICKSEAT, isRetry: false, isDisplay: true, channelId: "", errorId: "dbQyeryInfo.DB_LISTTOURNAMENTROOM_NOTFOUND_QUICKSEAT" });
    //     } else {
    //         cb({ success: true, result: result[0] });
    //     }
    // })
    // }
    /*===================================== END ============================*/


    /*===================================== START ============================*/
    // New
    async quickSeatInSitNGo(params: any): Promise<any> {

        const filter = {
            channelVariation: params.gameVariation,
            buyIn: params.buyIn,
            turnTime: params.turnTime,
            maxPlayersForTournament: params.maxPlayersForTournament,
            tournamentType: stateOfX.tournamentType.sitNGo,
            state: stateOfX.tournamentState.register
        };


        const response = await this.getTournamentRoom(filter);

        if (response.success) {
            response.result.prizePool = response.result.entryfees * response.result.maxPlayersForTournament;
        }


        return response;
    };

    // Old
    // quickSeat.quickSeatInSitNGo = function (params, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'in quick seat n go -' + JSON.stringify(params));
    //     var filter = {
    //         channelVariation: params.gameVariation,
    //         buyIn: params.buyIn,
    //         turnTime: params.turnTime,
    //         maxPlayersForTournament: params.maxPlayersForTournament,
    //         tournamentType: stateOfX.tournamentType.sitNGo,
    //         state: stateOfX.tournamentState.register
    //     }
    //     serverLog(stateOfX.serverLogType.info, 'filter for quickSeat is ' + JSON.stringify(filter));
    //     getTournamentRoom(filter, function (response) {
    //         if (response.success) {
    //             response.result.prizePool = response.result.entryfees * response.result.maxPlayersForTournament;
    //         }
    //         serverLog(stateOfX.serverLogType.info, 'response is in getTournamentRoom ' + JSON.stringify(response));
    //         cb(response);
    //     })
    // }
    /*===================================== END ============================*/


    /*===================================== START ============================*/
    // New
    async listTournament(params: any): Promise<any> {
        const filter = {
            channelVariation: params.gameVariation,
            buyIn: params.buyIn,
            tournamentType: params.tournamentType,
            startTime: Number(new Date()),
            endTime: Number(new Date()) + params.timeSpan * 60000
        };

        try {
            const result = await this.db.listTournamentByTimeSpan(filter);

            if (result.length > 0) {
                params.tournaments = result;
                return params;
            } else {
                return {
                    success: false,
                    info: this.dbMessages.DB_LISTTOURNAMENTBYTIMESPAN_NOTFOUND_QUICKSEAT,
                    isRetry: false,
                    isDisplay: true,
                    channelId: "",
                    errorId: "dbQyeryInfo.DB_LISTTOURNAMENTBYTIMESPAN_NOTFOUND_QUICKSEAT"
                };
            }
        } catch (err) {
            return {
                success: false,
                info: this.dbMessages.DB_LISTTOURNAMENTBYTIMESPAN_FAILED_QUICKSEAT,
                isRetry: false,
                isDisplay: false,
                channelId: "",
                errorId: "dbQyeryInfo.DB_LISTTOURNAMENTBYTIMESPAN_FAILED_QUICKSEAT"
            };
        }
    };


    // Old
    // var listTournament = function (params, cb) {
    // var filter = {
    //     channelVariation: params.gameVariation,
    //     buyIn: params.buyIn,
    //     tournamentType: params.tournamentType,
    //     startTime: Number(new Date()),
    //     endTime: Number(new Date()) + params.timeSpan * 60000
    // }
    // serverLog(stateOfX.serverLogType.info, 'filter for quickSeat is ' + JSON.stringify(filter));
    // db.listTournamentByTimeSpan(filter, function (err, result) {
    //     if (!err) {
    //         serverLog(stateOfX.serverLogType.info, 'result is in quick seat tournament' + JSON.stringify(result));
    //         if (result.length > 0) {
    //             params.tournaments = result;
    //             cb(null, params);
    //         } else {
    //             cb({ success: false, info: dbMessages.DB_LISTTOURNAMENTBYTIMESPAN_NOTFOUND_QUICKSEAT, isRetry: false, isDisplay: true, channelId: "", errorId: "dbQyeryInfo.DB_LISTTOURNAMENTBYTIMESPAN_NOTFOUND_QUICKSEAT" })
    //         }
    //     } else {
    //         cb({ success: false, info: dbMessages.DB_LISTTOURNAMENTBYTIMESPAN_FAILED_QUICKSEAT, isRetry: false, isDisplay: false, channelId: "", errorId: "dbQyeryInfo.DB_LISTTOURNAMENTBYTIMESPAN_FAILED_QUICKSEAT" })
    //     }
    // })
    // }
    /*===================================== END ============================*/


    /*===================================== START ============================*/
    // New
    async getEnrolledPlayers(params: any): Promise<any> {
        try {
            for (const tournament of params.tournaments) {
                try {
                    const result = await this.db.countTournamentusers({ tournamentId: tournament._id.toString() });
                    tournament.enrolledPlayers = result;
                } catch (err) {
                    return {
                        success: false,
                        info: this.dbMessages.DB_COUNTTOURNAMENTUSERS_FAILED_QUICKSEAT,
                        isRetry: false,
                        isDisplay: true,
                        channelId: "",
                        errorId: "dbQyeryInfo.DB_COUNTTOURNAMENTUSERS_FAILED_QUICKSEAT"
                    };
                }
            }

            return { success: true, result: params.tournaments };
        } catch (err) {
            return {
                success: false,
                info: this.messages.ASYNC_EACHSERIES_GETENROLLEDPLAYERS_FAILED_QUICKSEAT,
                isRetry: false,
                isDisplay: true,
                channelId: "",
                errorId: "falseMessages.ASYNC_EACHSERIES_GETENROLLEDPLAYERS_FAILED_QUICKSEAT"
            };
        }
    };


    // Old
    // var getEnrolledPlayers = function (params, cb) {
    // serverLog(stateOfX.serverLogType.info, 'in getEnrolledPlayers  ');
    // async.eachSeries(params.tournaments, function (tournament, callback) {
    //     db.countTournamentusers({ tournamentId: tournament._id.toString() }, function (err, result) {
    //         if (!err) {
    //             tournament.enrolledPlayers = result;
    //             callback();
    //         } else {
    //             cb({ success: false, info: dbMessages.DB_COUNTTOURNAMENTUSERS_FAILED_QUICKSEAT, isRetry: false, isDisplay: true, channelId: "", errorId: "dbQyeryInfo.DB_COUNTTOURNAMENTUSERS_FAILED_QUICKSEAT" });
    //             return;
    //         }
    //     })
    // }, function (err) {
    //     if (err) {
    //         cb({ success: false, info: messages.ASYNC_EACHSERIES_GETENROLLEDPLAYERS_FAILED_QUICKSEAT, isRetry: false, isDisplay: true, channelId: "", errorId: "falseMessages.ASYNC_EACHSERIES_GETENROLLEDPLAYERS_FAILED_QUICKSEAT" });
    //     } else {
    //         cb({ success: true, result: params.tournaments });
    //     }
    // })
    // }
    /*===================================== END ============================*/


    /*===================================== END ============================*/
    // New
    async quickSeatInTournament(params: any): Promise<any> {
        params.response = {};

        try {
            const listed = await this.listTournament(params); // listTournament must be async/await-based
            const enrolled = await this.getEnrolledPlayers(listed); // getEnrolledPlayers must be async/await-based
            return enrolled;
        } catch (err) {
            return err;
        }
    };

    // Old
    // quickSeat.quickSeatInTournament = function (params, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'in quick seat tournament  ' + JSON.stringify(params));
    //     params.response = {};
    //     async.waterfall([
    //         async.apply(listTournament, params),
    //         getEnrolledPlayers
    //     ], function (err, result) {
    //         if (!!err) {
    //             cb(err)
    //         } else {
    //             cb(result);
    //         }
    //     })
    // }
    /*===================================== END ============================*/



}