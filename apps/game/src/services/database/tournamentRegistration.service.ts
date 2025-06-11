import { Injectable } from "@nestjs/common";
import { DynamicRanksService } from "./dynamicRanks.service";
import _ from "underscore";
import popupTextManager from "shared/common/popupTextManager";
import { stateOfX } from "shared/common";


// profileMgmt = require('../../../../../shared/model/profileMgmt.js'),
// let wallet = require('../../walletQuery');




@Injectable()
export class TournamentRegistrationService {


    constructor(
        private readonly db: PokerDatabaseService,
        private readonly dynamicRanks: DynamicRanksService,
        private readonly profileMgmt: ProfileMgmtService,
    ) { }







async createTournamentUserCallback(deductChipsResponse: any, params: any): Promise<any> {
    if (deductChipsResponse.success) {
        // Save records to in-memory DB
        await this.dynamicRanks.getRegisteredTournamentUsers(params.tournamentId, params.gameVersionCount);

        return {
            success: true,
            info: "user registered successfully",
            isRetry: false,
            isDisplay: false,
            channelId: ""
        };
    } else {
        throw deductChipsResponse;
    }
}



/**
 * this function is used to prepare quey for TournamentUser (buildQueryForTournamentUser)
 * @method buildQueryForTournamentUser
 * @param  {[type]}   params request json object reqObject {tournamentId, playerId}
 * @return {[type]}          query/params
 */
buildQueryForTournamentUser(params: any): any {
    const query = {
        tournamentId: params.tournamentId,
        playerId: params.playerId,
        gameVersionCount: params.gameVersionCount
    };

    const updateData:any = { ...query };
    updateData.isActive = true;
    updateData.registrationTime = Date.now();

    return {
        query,
        updateData,
        isRealMoney: params.isRealMoney,
        entryFees: params.entryFees
    };
}

/**
 * this function is used to prepare quey for buildArgForvalidateAndCreateTournamentUsers (buildArgForvalidateAndCreateTournamentUsers)
 * @method buildArgForvalidateAndCreateTournamentUsers
 * @param  {[type]}   params request json object reqObject {tournamentId, playerId,isRealMoney,entryFees,maxPlayersForTournament,gameVersionCount}
 * @return {[type]}          query/params
 */
buildArgForvalidateAndCreateTournamentUsers(
    tournamentId: string,
    playerId: string,
    isRealMoney: boolean,
    entryFees: number,
    maxPlayersForTournament: number,
    gameVersionCount: number
): any {
    return {
        tournamentId,
        playerId,
        maxPlayersForTournament,
        isRealMoney,
        entryFees,
        gameVersionCount
    };
}

/**
 * this function is used to updatePlayerChips
 * @method updatePlayerChips
 * @param  {[type]}   params request json object reqObject {tournamentId, playerId,isRealMoney,entryFees,maxPlayersForTournament,gameVersionCount}
 * @return {[type]}          query/params
 */
async updatePlayerChips(params: {
    tournamentId: string;
    playerId: string;
    isActive?: boolean;
    isRealMoney: boolean;
    entryFees: number;
    gameVersionCount: number;
}): Promise<any> {
    const response = await this.db.deleteTournamentUser({
        tournamentId: params.tournamentId,
        playerId: params.playerId,
        isActive: true
    });

    if (!response) {
        return {
            success: false,
            isRetry: false,
            isDisplay: true,
            channelId: "",
            info: popupTextManager.dbQyeryInfo.DBDELETETOURNAMENTUSERFAIL_TOURNAMENTREGISTRATION
        };
    } else {
        const paramsForAddChips = {
            playerId: params.playerId,
            isRealMoney: params.isRealMoney,
            chips: params.entryFees
        };

        // no need to change
        // profileMgmt.addChips(paramsForAddChips, function () {
        //     dynamicRanks.getRegisteredTournamentUsers(params.tournamentId, params.gameVersionCount);
        //     cb({ success: true, info: "deRegister successfully", isRetry: false, isDisplay: false, channelId: "" });
        // });

        // Since the above is commented out and async/await is not needed here yet,
        // you might choose to resolve success explicitly only if chips are added in future.
        return {
            success: true,
            isRetry: false,
            isDisplay: false,
            channelId: "",
            info: "deRegister successfully"
        };
    }
}


/**
 * this function is used to checkUserBalance
 * @method checkUserBalance
 * @param  {[type]}   params request json object 
 * @cb      callbackFunction
 * @return {[type]}          validated/params
 */
async checkUserBalance(params: {
    updateData: { playerId: string };
    isRealMoney: boolean;
    entryFees: number;
}): Promise<any> {
    const user = await this.db.getCustomUser(params.updateData.playerId, {
        freeChips: 1,
        realChips: 1,
        points: 1,
    });

    if (!user) {
        return {
            success: false,
            isRetry: false,
            isDisplay: true,
            channelId: "",
            info: popupTextManager.dbQyeryInfo.DBGETCUSTOMUSER_DBERRORCHECKUSERBALANCE_TOURNAMENTREGISTRATION,
        };
    }

    if (params.isRealMoney) {
        if (params.entryFees > user.realChips) {
            return {
                success: false,
                isRetry: false,
                isDisplay: true,
                channelId: "",
                info: popupTextManager.dbQyeryInfo.DBGETCUSTOMER_CHECKUSERBALANCENOREALMONEY_TOURNAMENTREGISTRATION,
            };
        }
    } else {
        if (params.entryFees > user.freeChips) {
            return {
                success: false,
                isRetry: false,
                isDisplay: true,
                channelId: "",
                info: popupTextManager.dbQyeryInfo.DBGETCUSTOMER_CHECKUSERBALANCENOSUFFICIENTPLAYCHIPS_TOURNAMENTREGISTRATION,
            };
        }
    }

    return { success: true };
}



/**
 * this function is used to createTournamentUser
 * @method createTournamentUser
 * @param  {[type]}   params request json object 
 * @param  {[type]}   isEligibleForRebuy request json object 
 * @cb      callbackFunction
 */
async createTournamentUser(isEligibleForRebuy: boolean,params: any): Promise<any> {
    const balanceResponse = await this.checkUserBalance(params);
    if (!balanceResponse.success) {
        return balanceResponse;
    }

    if (isEligibleForRebuy) {
        const dataForWallet = {
            action: 'topUp',
            data: {
                playerId: params.updateData.playerId,
                isRealMoney: params.isRealMoney,
                chips: params.entryFees
            }
        };

        const deductChipsResponse = await wallet.sendWalletBroadCast(dataForWallet);
        return await this.createTournamentUserCallback(deductChipsResponse, params.query);
    }

    const result = await this.db.upsertTournamentUser(params.query, params.updateData);

    if (!result) {
        return {
            success: false,
            isRetry: false,
            isDisplay: true,
            channelId: "",
            info: popupTextManager.dbQyeryInfo.DBUPSERTTOURNAMENTUSER_DBERROR_TOURNAMENTREGISTRATION
        };
    }

    if (result.nModified) {
        return {
            success: false,
            isRetry: false,
            isDisplay: true,
            channelId: "",
            info: popupTextManager.dbQyeryInfo.DBUPSERTTOURNAMENTUSER_USERALREADYEXIST_TOURNAMENTREGISTRATION
        };
    }

    if (!!result.upserted) {
        const dataForWallet = {
            action: 'topUp',
            data: {
                playerId: params.updateData.playerId,
                isRealMoney: params.isRealMoney,
                chips: params.entryFees
            }
        };

        const deductChipsResponse = await wallet.sendWalletBroadCast(dataForWallet);
        return await this.createTournamentUserCallback(deductChipsResponse, params.query);
    }

    // Default fallback in case no conditions matched
    return {
        success: false,
        isRetry: false,
        isDisplay: true,
        channelId: "",
        info: "Unknown error during tournament registration"
    };
};


/**
 * this function is used to validateAndCreateTournamentUsers
 * @method validateAndCreateTournamentUsers
 * @param  {[type]}   params request json object - {tournamentId, playerId, maxPlayersForTournament, isRealMoney, entryFees}
 * @cb      callbackFunction
 */
async validateAndCreateTournamentUsers(params: any): Promise<any> {
    const filterForTournamentUser = {
        tournamentId: params.tournamentId,
        isActive: true,
        gameVersionCount: params.gameVersionCount
    };

    const noOfUsers: number = await this.db.countTournamentusers(filterForTournamentUser);

    if (noOfUsers === null) {
        return {
            success: false,
            isRetry: false,
            isDisplay: true,
            channelId: "",
            info: popupTextManager.dbQyeryInfo.DBCOUNTTOURNAMENTUSERS_VALIDATENCREATEDBERROR_TOURNAMENTREGISTRATION
        };
    }

    if (noOfUsers < params.maxPlayersForTournament) {
        const queryParams = this.buildQueryForTournamentUser({
            tournamentId: params.tournamentId,
            playerId: params.playerId,
            isRealMoney: params.isRealMoney,
            entryFees: params.entryFees,
            gameVersionCount: params.gameVersionCount
        });

        const result = await this.createTournamentUser(params.isEligibleForRebuy, queryParams);
        return result;
    } else {
        return {
            success: false,
            isRetry: false,
            isDisplay: true,
            channelId: "",
            info: popupTextManager.dbQyeryInfo.DBCOUNTTOURNAMENTUSERS_VALIDATENCREATE_TOURNAMENTREGISTRATION
        };
    }
};





/**
 * this function is for Registration in sitNgo
 * @method sitNGoRegistration
 * @param  {[type]}   params request json object 
 * @cb      callbackFunction
 */
async sitNGoRegistration(params: any): Promise<any> {
    if (params.tournamentState === stateOfX.tournamentState.register) {
        const query = await this.buildArgForvalidateAndCreateTournamentUsers(
            params.tournamentId,
            params.playerId,
            params.isRealMoney,
            params.entryFees,
            params.maxPlayersForTournament,
            params.gameVersionCount
        );

        const result = await this.validateAndCreateTournamentUsers(query);
        return result;
    } else {
        return {
            success: false,
            isRetry: false,
            isDisplay: true,
            channelId: "",
            info: popupTextManager.falseMessages.SITNGOREGISTRATIONFAIL_TOURNAMENTREGISTRATION
        };
    }
};


/**
 * this function is for Registration in normal Tounament
 * @method normalTournamentReg
 * @param  {[type]}   params request json object 
 * @cb      callbackFunction
 */
async normalTournamentReg(params: any): Promise<any> {

    const currentTime = Number(new Date());
    let startTime = params.tournamentStartTime;

    if (params.lateRegistrationAllowed) {
        startTime += params.lateRegistrationTime * 60000;
        // lateRegistrationTime is in minutes
    }

    const regTimeStarts = params.tournamentStartTime - params.registrationBeforeStarttime * 60000;

    let info;
    if (currentTime <= startTime) {
        info = "Tournament is upcoming. You can register once registration starts";
    }
    if (currentTime > regTimeStarts) {
        info = "Tournament join time is over";
    }

    if (currentTime <= startTime || params.isEligibleForRebuy) {
        if (currentTime <= regTimeStarts) {
            return {
                success: false,
                isRetry: false,
                isDisplay: true,
                channelId: "",
                info: popupTextManager.falseMessages.NORMALTOURNAMENTREGISTRATIONFAIL_REGISTRATIONNOTSTARTED
            };
        } else {
            const result = await this.validateAndCreateTournamentUsers(params);
            return result;
        }
    } else {
        return {
            success: false,
            isRetry: false,
            isDisplay: true,
            channelId: "",
            info: popupTextManager.falseMessages.NORMALTOURNAMENTREGISTRATIONFAIL_TOURNAMENTREGISTRATION
        };
    }
};





/**
 * this function is for SitNGo Deregistration
 * @method deRegisteration
 * @param  {[type]}   params request json object 
 * @cb      callbackFunction
 */
async deRegisteration(params: any): Promise<any> {
    const updatePlayerChipsResponse = await this.updatePlayerChips(params);

    // Fire-and-forget update of in-memory rankings
    await this.dynamicRanks.getRegisteredTournamentUsers(params.tournamentId, params.gameVersionCount);

    return updatePlayerChipsResponse;
};














}