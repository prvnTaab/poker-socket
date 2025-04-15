import { Injectable } from "@nestjs/common";
import { PokerDatabaseService } from "shared/common/datebase/pokerdatabase.service";
import { popupTextManager } from 'shared/common';












@Injectable()
export class PrizePoolHandlerService  {


    constructor(
        private db: PokerDatabaseService,

    ) {}









    /*===============================  START  =============================*/
    /**
     * [get tournament rooms from give tournament ID]
     */

    // New
    async getTournamentRooms(params: any): Promise<any> {

        if (!!params.tournamentId) {
            try {
                const result = await this.db.findTournamentRoom({ tournamentId: params.tournamentId });

                if (result && result.length > 0) {
                    params.tournamentRoomData = result[0];
                    return params;  // Resolve with params
                } else {
                    throw {
                        success: false,
                        tournamentId: params.tournamentId || "",
                        info: popupTextManager.dbQyeryInfo.DBGETTOURNAMENTROOM_FINDTOURNAMENTROOM_TOURNAMENT
                    };
                }
            } catch (err) {
                throw {
                    success: false,
                    tournamentId: params.tournamentId || "",
                    info: popupTextManager.dbQyeryInfo.DBGETTOURNAMENTROOM_FINDTOURNAMENTROOM_TOURNAMENT
                };
            }
        } else {
            throw {
                success: false,
                tournamentId: params.tournamentId || "",
                info: popupTextManager.dbQyeryInfo.DB_GETTOURNAMENTROOM_TOURNAMENTID
            };
        }
    };


    // Old
    // const getTournamentRooms = function (params, cb) {
    // 	console.log("params is in getTournamentRooms is - " + JSON.stringify(params));
    // 	if (!!params.tournamentId) {
    // 		db.findTournamentRoom({ tournamentId: params.tournamentId }, function (err, result) {
    // 			if (!err && result && result.length > 0) {
    // 				params.tournamentRoomData = result[0];
    // 				cb(null, params);
    // 			}
    // 			else {
    // 				cb({ success: false, tournamentId: (params.tournamentId || ""), info: popupTextManager.dbQyeryInfo.DBGETTOURNAMENTROOM_FINDTOURNAMENTROOM_TOURNAMENT });
    // 			}
    // 		})
    // 	}
    // 	else {
    // 		cb({ success: false, tournamentId: (params.tournamentId || ""), info: popupTextManager.dbQyeryInfo.DB_GETTOURNAMENTROOM_TOURNAMENTID });
    // 	}
    // }
    /*===============================  END  =============================*/


    /*===============================  START  =============================*/
    /**
     * [this function checks whether late registration or rebuy is enabled in the current tournament]
     */

    // New
    async isEnabledLateRegistrationOrRebuy(params: any): Promise<any> {

        if (params.tournamentRoomData.isGuaranteed && params.tournamentRoomData.gtdAmount) {
            params.isGtdEnabled = true;
            if (params.tournamentRoomData.isLateRegistrationAllowed || params.tournamentRoomData.isRebuyAllowed) {
                params.prizePool = params.gtdAmount;
            }
        }

        return params;  // Return the modified params
    };


    // Old
    // const isEnabledLateRegistrationOrRebuy = function (params, cb) {
    // 	console.log("params is in isEnabledLateRegistrationOrRebuy is - " + JSON.stringify(params));
    // 	if (params.tournamentRoomData.isGuaranteed && params.tournamentRoomData.gtdAmount) {
    // 		params.isGtdEnabled = true;
    // 		if (params.tournamentRoomData.isLateRegistrationAllowed || params.tournamentRoomData.isRebuyAllowed) {
    // 			params.prizePool = params.gtdAmount;
    // 		}
    // 	}
    // 	cb(null, params);
    // }
    /*===============================  END  =============================*/


    /*===============================  START  =============================*/
    /**
     * [this function finds the total tournament users count]
     */

    // New
    async calculateTournamentUsers(params: any): Promise<any> {

        if (!params.prizePool) {
            try {
                const count = await this.db.countTournamentusers({ tournamentId: params.tournamentId.toString() });

                if (count >= 0) {
                    params.usersCount = count;
                    return params;
                } else {
                    return { success: false, tournamentId: params.tournamentId || "", info: popupTextManager.dbQyeryInfo.DB_GETTOURNAMENTROOM_GETTOURNAMENTUSERS };
                }
            } catch (err) {
                console.log("error in getting tournament users in getEnrolledPlayersInTounaments: " + JSON.stringify(err));
                return { success: false, tournamentId: params.tournamentId || "", info: popupTextManager.dbQyeryInfo.DB_GETTOURNAMENTROOM_GETTOURNAMENTUSERS };
            }
        } else {
            return params;
        }
    };


    // Old
    // const calculateTournamentUsers = function (params, cb) {
    // 	console.log("params is in calculateTournamentUsers is - " + JSON.stringify(params));
    // 	if (!params.prizePool) {
    // 		db.countTournamentusers({ tournamentId: params.tournamentId.toString() }, function (err, count) {
    // 			console.log("result is in calculateTournamentUsers  is - " + JSON.stringify(count));
    // 			if (!err && count >= 0) {
    // 				console.log("params is in db.calculateTournamentUsers is - " + JSON.stringify(count));
    // 				params.usersCount = count;
    // 				cb(null, params)
    // 			}
    // 			else {
    // 				console.log("error in getting tournament users in getEnrolledPlayersInTounaments: " + JSON.stringify(err));
    // 				cb({ success: false, tournamentId: (params.tournamentId || ""), info: popupTextManager.dbQyeryInfo.DB_GETTOURNAMENTROOM_GETTOURNAMENTUSERS })
    // 			}
    // 		});
    // 	}
    // 	else {
    // 		cb(null, params)
    // 	}
    // }
    /*===============================  END  =============================*/



    /*===============================  START  =============================*/
    /**
     * [this function calculates the rebuy count and add On]
     */

    // New
    async calculateRebuyAndAddOn(params: any): Promise<any> {

        if (!params.prizePool) {
            try {
                const result = await this.db.findAllRebuy({ tournamentId: params.tournamentId.toString() });

                if (result) {
                    params.rebuyCount = 0;
                    params.addOn = 0;
                    for (let i in result) {
                        const rebuyCount = result[i].rebuyCount || 0;
                        const addOn = result[i].addOn || 0;
                        params.rebuyCount += rebuyCount;
                        params.addOn += addOn;
                    }
                    return params;
                } else {
                    console.log("error in getting tournament users in getEnrolledPlayersInTounaments");
                    return { success: false, tournamentId: params.tournamentId || "", info: popupTextManager.dbQyeryInfo.DB_GETTOURNAMENTROOM_GETTOURNAMENTUSERS };
                }
            } catch (err) {
                console.log("error in getting tournament users in getEnrolledPlayersInTounaments: " + JSON.stringify(err));
                return { success: false, tournamentId: params.tournamentId || "", info: popupTextManager.dbQyeryInfo.DB_GETTOURNAMENTROOM_GETTOURNAMENTUSERS };
            }
        } else {
            return params;
        }
    };


    // Old
    // const calculateRebuyAndAddOn = function (params, cb) {
    // 	console.log("params is in calculateRebuyAndAddOn is - " + JSON.stringify(params));
    // 	if (!params.prizePool) {
    // 		db.findAllRebuy({ tournamentId: params.tournamentId.toString() }, function (err, result) {
    // 			console.log("result is in calculateRebuyAndAddOn is - " + JSON.stringify(result));
    // 			if (!err && result) {
    // 				params.rebuyCount = 0;
    // 				params.addOn = 0;
    // 				for (var i in result) {
    // 					var rebuyCount = (result[i].rebuyCount) ? result[i].rebuyCount : 0
    // 					var addOn = (result[i].addOn) ? result[i].addOn : 0
    // 					params.rebuyCount += rebuyCount;
    // 					params.addOn += addOn;
    // 				}
    // 				cb(null, params);
    // 			}
    // 			else {
    // 				console.log("error in getting tournament users in getEnrolledPlayersInTounaments: " + JSON.stringify(err));
    // 				cb({ success: false, tournamentId: (params.tournamentId || ""), info: popupTextManager.dbQyeryInfo.DB_GETTOURNAMENTROOM_GETTOURNAMENTUSERS })
    // 			}
    // 		});
    // 	}
    // 	else {
    // 		cb(null, params);
    // 	}
    // }
    /*===============================  END  =============================*/


    /*===============================  START  =============================*/
    /**
     * [this function calculates final prize pool based on usersCount, rebuyCount, entryFees, and addOn]
     */

    // New
    async finalPrizePool(params: any): Promise<any> {
        if (!params.prizePool) {
            const prizePool = ((params.usersCount + params.rebuyCount) * params.tournamentRoomData.entryFees) + params.addOn;
            return prizePool;
        } else {
            return params;
        }
    };


    // Old
    // const finalPrizePool = function (params, cb) {
    // 	if (!params.prizePool) {
    // 		const prizePool = ((params.usersCount + params.rebuyCount) * params.tournamentRoomData.entryFees) + params.addOn;
    // 		console.log("prizePool------", prizePool);
    // 		cb(null, prizePool);
    // 	}
    // 	else {
    // 		console.log("prizePool------", params.prizePool);
    // 		cb(null, params);
    // 	}
    // }
    /*===============================  END  =============================*/



    /*===============================  START  =============================*/
    /**
     * calculate prize pool in series of steps
     */

    // New
    async calculatePrizePool(params: any): Promise<any> {

        try {
            let result = params;
            result = await this.getTournamentRooms(result);
            result = await this.isEnabledLateRegistrationOrRebuy(result);
            result = await this.calculateTournamentUsers(result);
            result = await this.calculateRebuyAndAddOn(result);
            result = await this.finalPrizePool(result);

            console.log("result in prizePool......", result);
            return result;
        } catch (err) {
            console.error("Error in calculatePrizePool: ", err);
            throw err;
        }
    };


    // Old
    // prizePoolHandler.calculatePrizePool = function (params, cb) {
    // 	console.log("tournamentId,is in tournamentActionHandler in prizePool " + params.tournamentId);
    // 	async.waterfall([
    // 		async.apply(getTournamentRooms, params),
    // 		isEnabledLateRegistrationOrRebuy,
    // 		calculateTournamentUsers,
    // 		calculateRebuyAndAddOn,
    // 		finalPrizePool
    // 	], function (err, result) {
    // 		console.log("result in prizePool......", result);
    // 		cb(err, result);
    // 	})
    // }

    /*===============================  END  =============================*/




















}