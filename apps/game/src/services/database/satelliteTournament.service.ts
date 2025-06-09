import { Injectable } from "@nestjs/common";
import { popupTextManager } from "shared/common";
import { PokerDatabaseService } from "shared/common/datebase/pokerdatabase.service";









@Injectable()
export class SatelliteTournamentService {

    private messages = popupTextManager.falseMessages;
    private dbMessages = popupTextManager.dbQyeryInfo;

    constructor(
        private readonly db: PokerDatabaseService,

    ) { }





    /*===================================== START ============================*/
    //getting tournament room
    // New
    async getTournamentRoom(params: any): Promise<any> {
        try {
            const tournament = await this.db.getTournamentRoom(params.tournamentId);
            if (!tournament) {
                return {
                    success: false,
                    info: this.dbMessages.DBGETTOURNAMENTROOMFAIL_TOURNAMENT,
                    isRetry: false,
                    isDisplay: true,
                    channelId: ""
                };
            }
            params.gameVersionCount = tournament.gameVersionCount;
            return params;
        } catch (err) {
            return {
                success: false,
                info: this.dbMessages.DBGETTOURNAMENTROOMFAIL_TOURNAMENT,
                isRetry: false,
                isDisplay: true,
                channelId: ""
            };
        }
    };


    // OLd
    // var getTournamentRoom = function (params, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'params is in getTournamentRoom in satelliteTournament' + JSON.stringify(params));
    //     db.getTournamentRoom(params.tournamentId, function (err, tournament) {
    //         if (err || !tournament) {
    //             // cb({success: false, info: "No tournament room found"});
    //             cb({ success: false, info: dbMessages.DBGETTOURNAMENTROOMFAIL_TOURNAMENT, isRetry: false, isDisplay: true, channelId: "" });
    //         } else {
    //             serverLog(stateOfX.serverLogType.info, 'tournament is in getTournamentRoom in satelliteTournament' + JSON.stringify(tournament));
    //             params.gameVersionCount = tournament.gameVersionCount;
    //             cb(null, params);
    //         }
    //     });
    // }
    /*===================================== END ============================*/



    /*===================================== START ============================*/
    // create tournament user for satellite
    // New
    async createTournamentUser(params: any): Promise<any> {

        const tournamentUserObj = {
            tournamentId: params.tournamentId,
            isActive: true,
            playerId: params.playerId,
            gameVersionCount: params.gameVersionCount
        };


        try {
            const result = await this.db.createTournamentUsers(tournamentUserObj);
            if (result) {
                return params;
            } else {
                return {
                    success: false,
                    info: this.dbMessages.DB_CREATETOURNAMENTUSERS_FAILED_SATELLITETOURNAMENT,
                    isRetry: false,
                    isDisplay: false,
                    channelId: ""
                };
            }
        } catch (err) {
            return {
                success: false,
                info: this.dbMessages.DB_CREATETOURNAMENTUSERS_FAILED_SATELLITETOURNAMENT,
                isRetry: false,
                isDisplay: false,
                channelId: ""
            };
        }
    };


    // Old
    // var createTournamentUser = function (params, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'params is in createTournamentUser in satelliteTournament' + JSON.stringify(params));
    //     var tournamentUserObj = {
    //         tournamentId: params.tournamentId,
    //         isActive: true,
    //         playerId: params.playerId,
    //         gameVersionCount: params.gameVersionCount
    //     }
    //     serverLog(stateOfX.serverLogType.info, 'tournamentUserObj is in createTournamentUser in satelliteTournament' + JSON.stringify(tournamentUserObj));
    //     db.createTournamentUsers(tournamentUserObj, function (err, result) {
    //         if (!err && !!result) {
    //             cb(null, params);
    //         } else {
    //             // cb({success: false, info: "Error in create tournament user"})
    //             cb({ success: false, info: dbMessages.DB_CREATETOURNAMENTUSERS_FAILED_SATELLITETOURNAMENT, isRetry: false, isDisplay: false, channelId: "" })
    //         }
    //     })
    // }
    /*===================================== END ============================*/


    /*===================================== START ============================*/
    // New
    async register(params: any): Promise<any> {
        try {
            const roomResult = await this.getTournamentRoom(params);
            if (roomResult && roomResult.success === false) {
                return roomResult;
            }

            const userResult = await this.createTournamentUser(roomResult);
            if (userResult && userResult.success === false) {
                return userResult;
            }

            return {
                success: true,
                info: this.messages.REGISTER_SUCCESS_SATELLITETOURNAMENT,
                isRetry: false,
                isDisplay: true,
                channelId: ""
            };
        } catch (err) {
            return err;
        }
    };


    // Old
    // satelliteTournament.register = function (params, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'params is in register in satelliteTournament' + JSON.stringify(params));
    //     async.waterfall([
    //         async.apply(getTournamentRoom, params),
    //         createTournamentUser
    //     ], function (err, result) {
    //         if (err) {
    //             serverLog(stateOfX.serverLogType.info, 'err registered in tournament via satelliteTournament' + JSON.stringify(err));
    //             cb(err);
    //         } else {
    //             serverLog(stateOfX.serverLogType.info, 'successfully registered in tournament via satelliteTournament' + JSON.stringify(result));
    //             // cb({success: true, info: "Successfully Registered!!"});
    //             cb({ success: true, info: messages.REGISTER_SUCCESS_SATELLITETOURNAMENT, isRetry: false, isDisplay: true, channelId: "" });
    //         }
    //     })
    // }
    /*===================================== END ============================*/





}