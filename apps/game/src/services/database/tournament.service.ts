import { Injectable } from "@nestjs/common";
import { ImdbDatabaseService } from "shared/common/datebase/Imdbdatabase.service";
import { PokerDatabaseService } from "shared/common/datebase/pokerdatabase.service";
import _ from 'underscore';
import { CalculateChannelDetailsService } from "./calculateChannelDetails.service";
import popupTextManager from "shared/common/popupTextManager";
import { stateOfX } from "shared/common";
import { validateKeySets } from "shared/common/utils/activity";
import { ObjectId } from 'mongodb';




// profileMgmt = require('../../../../../shared/model/profileMgmt.js'),



let pomelo: any;



@Injectable()
export class TournamentService {


    constructor(
        private readonly db: PokerDatabaseService,
        private readonly imdb: ImdbDatabaseService,
        private readonly tournamentReg: TournamentRegService,
        private readonly satelliteTournament: SatelliteTournamentService,
        private readonly channelDetails: CalculateChannelDetailsService
    ) { }






    /**
 * Function for getting tournament room
 * @method getTournamentRoom
 * @param  {[type]}   params request json object
 * @param  {Function} cb     callback function
 */
    async getTournamentRoom(params: any): Promise<any> {
        const tournament = await this.db.getTournamentRoom(params.tournamentId);

        if (!tournament) {
            throw {
                success: false,
                isRetry: false,
                isDisplay: true,
                channelId: "",
                info: popupTextManager.falseMessages.GETTOURNAMENTROOMCALLBACK_NOTOURNAMENTROOM_TOURNAMENT
            };
        }

        params.tournamentState = tournament.state;
        params.gameVersionCount = tournament.gameVersionCount;
        params.isRebuyAllowed = !!tournament.isRebuyAllowed;

        if (params.isRebuyAllowed) {
            params.rebuyTime = tournament.rebuyTime;
            params.numberOfRebuy = tournament.numberOfRebuy;
            params.tournamentStartTime = tournament.tournamentStartTime;
        }

        return params;
    };




    /**
     * Function to insertBounty (to create Bounty data and insert into the database)
     * @method insertBounty
     * @param  {[type]}   tournamentId         
     * @param  {[type]}   gameVersionCount     
     * @param   {[type]}   playerId            
     */
    async insertBounty(tournamentId: string, gameVersionCount: number, playerId: string): Promise<void> {
        const bountyData = {
            tournamentId: tournamentId,
            gameVersionCount: gameVersionCount,
            playerId: playerId,
            bounty: 0
        };

        try {
            await this.db.createBounty(bountyData);
            // Bounty successfully inserted
        } catch (err) {
            // Error in creating bounty
        }
    };

    /**
     * Function for register user for tournament on the basis of sitNGo or on the basis of normalTournament Registration
     * @method getTournamentRoomCallBack
     * @param  {[type]}   params request json object
     * @param  {[type]}   params request json object
     * @param  {[type]}   tournamentRoom request json object
     * @param  {Function} cb     callback function
     * @return {[type]}          validated/params
     */
    async getTournamentRoomCallBack(err: any, params: any, tournamentRoom: any): Promise<any> {
        if (err || !tournamentRoom) {
            return {
                success: false,
                isRetry: false,
                isDisplay: true,
                channelId: "",
                info: popupTextManager.dbQyeryInfo.GETTOURNAMENTROOMCALLBACK_NOTOURNAMENTROOM_TOURNAMENT
            };
        }

        if (!!tournamentRoom || tournamentRoom.isActive) {
            params.tournamentStartTime = tournamentRoom.tournamentStartTime;
            params.lateRegistrationTime = tournamentRoom.lateRegistrationTime;
            params.maxPlayersForTournament = tournamentRoom.maxPlayersForTournament;
            params.isRealMoney = tournamentRoom.isRealMoney;
            params.tournamentType = tournamentRoom.tournamentType;
            params.gameVersionCount = tournamentRoom.gameVersionCount;

            if ((tournamentRoom.tournamentType).toUpperCase() === stateOfX.tournamentType.sitNGo) {
                params.tournamentState = tournamentRoom.state;
                const sitNgoResponse = await this.tournamentReg.sitNGoRegistration(params);

                if (sitNgoResponse.success && tournamentRoom.bountyfees > 0) {
                    await this.insertBounty(
                        tournamentRoom._id.toString(),
                        tournamentRoom.gameVersionCount,
                        params.playerId
                    );
                }

                sitNgoResponse.tournamentType = tournamentRoom.tournamentType;
                return sitNgoResponse;
            } else {
                params.registrationBeforeStarttime = tournamentRoom.registrationBeforeStarttime;

                const normalTournamentRegResponse = await this.tournamentReg.normalTournamentReg(params);

                if (normalTournamentRegResponse.success && tournamentRoom.bountyfees > 0) {
                    await this.insertBounty(tournamentRoom._id.toString(), tournamentRoom.gameVersionCount, params.playerId);
                }

                return normalTournamentRegResponse;
            }
        } else {
            return {
                success: false,
                isRetry: false,
                isDisplay: true,
                channelId: "",
                info: popupTextManager.falseMessages.GETTOURNAMENTROOMCALLBACK_TOURNAMENT
            };
        }
    };


    /**
     * Function for register user for tournament
     * @method registerTournament
     * @param  {[type]}   params request json object
     * @param  {Function} cb     callback function
     * @return {[type]}          validated/params
     */
    async registerTournament(params: any): Promise<any> {
        const self = this;

        const validated = await validateKeySets("Request", pomelo.app.serverType, "tourRegistration", params)

        if (!validated.success) {
            return validated;
        }

        const tournamentRoom = await this.db.getTournamentRoom(params.tournamentId);

        if (!tournamentRoom) {
            return {
                success: false,
                isRetry: false,
                isDisplay: true,
                channelId: "",
                info: popupTextManager.falseMessages.REGISTERTOURNAMENTFAIL_TOURNAMENT
            };
        }

        return tournamentRoom;
    };

    /**
     * Function to getTournamentUsers
     * @method getTournamentUsers
     * @param  {[type]}   params request json object
     * @param  {Function} cb     callback function
     * @return {[type]}          validated/params
     */
    async getTournamentUsers(params: any): Promise<any> {
        const result = await this.db.findTournamentUser(
            {
                tournamentId: params.tournamentId,
                playerId: params.playerId,
                gameVersionCount: params.gameVersionCount
            });

        if (!result) {
            return {
                success: false,
                isRetry: false,
                isDisplay: true,
                channelId: "",
                info: popupTextManager.falseMessages.FINDTOURNAMENTUSERFAIL_TOURNAMENT
            };
        }

        if (result.length > 0) {
            if (result[0].isActive) {
                params.isEliminated = false;
            }
            params.isRegistered = true;
        }

        return params;
    };

    /**
     * Function to getRebuyStatus  (checks if rebuyTime is left or not)
     * @method getRebuyStatus
     * @param  {[type]}   params request json object
     * @param  {Function} cb     callback function
     * @return {[type]}          validated/params
     */
    async getRebuyStatus(params: any): Promise<any> {
        if (params.isRebuyAllowed && params.isRegistered) {
            const result = await this.db.countRebuyOpt({
                playerId: params.playerId,
                tournamentId: params.tournamentId,
                gameVersionCount: params.gameVersionCount
            });

            if (result) {
                const isRebuyTimeLeft = params.tournamentStartTime + params.rebuyTime * 60000 > Number(new Date());

                if (isRebuyTimeLeft && result.rebuyCount < params.numberOfRebuy) {
                    params.isRebuyLeft = true;
                }
            } else {
                params.isRebuyLeft = true;
            }

            return params;
        } else {
            return params;
        }
    };

    /**
     * Function to createResponseInRegisteredUsers
     * @method createResponseInRegisteredUsers
     * @param  {[type]}   params request json object
     * @param  {Function} cb     callback function
     * @return {[type]}          validated/params
     */
    createResponseInRegisteredUsers(params: any): any {
        const response = {
            success: true,
            result: {
                isRegistered: params.isRegistered,
                isEliminated: params.isEliminated,
                isRebuyLeft: params.isRebuyLeft,
                tournamentState: params.tournamentState
            }
        };

        return response;
    };



    /**
     * Function to check user is registered in particluar tournament or not
     * @method isRegisteredUserInTournament
     * @param  {[type]}   params request json object
     * @param  {Function} cb     callback function
     * @return {[type]}          validated/params
     */
    async isRegisteredUserInTournament(params: any): Promise<any> {
        const validated = await validateKeySets("Request", pomelo.app.serverType, "isRegisteredUserInTournament", params);

        if (!validated.success) {
            return validated;
        }

        params.isEliminated = true;
        params.isRegistered = false;
        params.isRebuyLeft = false;

        const tournamentRoom = await this.getTournamentRoom(params);
        const tournamentUsers = await this.getTournamentUsers(tournamentRoom);
        const rebuyStatus = await this.getRebuyStatus(tournamentUsers);
        const response = await this.createResponseInRegisteredUsers(rebuyStatus);

        return response;
    };

    /**
     * Function to validateAndDeRegisterTournament
     * @method validateAndDeRegisterTournament
     * @param  {[type]}   params request json object
     * @param  {Function} cb     callback function
     * @return {[type]}          validated/params
     */
    async validateAndDeRegisterTournament(params: any): Promise<any> {
        let validTimeForRegistration = params.tournamentStartTime;
        const currentTime = Number(new Date());

        if (params.lateRegistrationAllowed) {
            validTimeForRegistration += params.lateRegistrationTime;
        }

        const conditonForSitNGoTournament =
            (params.tournamentType).toUpperCase() === stateOfX.tournamentType.sitNGo &&
            (params.tournamentState).toUpperCase() === stateOfX.tournamentState.register;

        const conditonForNormalTournament =
            (params.tournamentType).toUpperCase() === stateOfX.tournamentType.normal &&
            currentTime < validTimeForRegistration;

        if (conditonForSitNGoTournament || conditonForNormalTournament) {
            const deRegisterationResponse = await this.tournamentReg.deRegisteration(params);
            return deRegisterationResponse;
        } else {
            return {
                success: false,
                isRetry: false,
                isDisplay: true,
                channelId: "",
                info: popupTextManager.falseMessages.VALIDATEANDREGISTERTOURNAMENTFAIL_TOURNAMENT
            };
        }
    };




    /**
     * Function to createParamsForDegisterTournament
     * @method createParamsForDeregisterTournament
     * @param  {[type]}   params request json object
     * @param  {Function} cb     callback function
     * @return {[type]}          validated/params
     */
    createParamsForDeregisterTournament(tournamentRoom: any, params: any): any {
        params.tournamentType = tournamentRoom.tournamentType;
        params.tournamentState = tournamentRoom.state;
        params.tournamentStartTime = tournamentRoom.tournamentStartTime;
        params.lateRegistrationAllowed = tournamentRoom.lateRegistrationAllowed;
        params.lateRegistrationTime = tournamentRoom.lateRegistrationTime;
        params.isRealMoney = tournamentRoom.isRealMoney;
        params.entryFees = tournamentRoom.entryfees + tournamentRoom.housefees + tournamentRoom.bountyfees;
        params.gameVersionCount = tournamentRoom.gameVersionCount;
        return params;
    };

    /**
     * Function for deRegister user from tournament two things are mainly checked here i.e. if the player is registered and the deregistration time is valid or not
     * @method deRegisterTournament
     * @param  {[type]}   params request json object
     * @param  {Function} cb     callback function
     * @return {[type]}          validated/params
     */
    async deRegisterTournament(params: any): Promise<any> {
        const self = this;

        const validated = await validateKeySets("Request", pomelo.app.serverType, "deRegisterTournament", params);
        if (!validated.success) {
            return validated;
        }

        const isRegisteredUserInTournamentResponse = await self.isRegisteredUserInTournament({
            isActive: true,
            tournamentId: params.tournamentId,
            playerId: params.playerId,
            gameVersionCount: params.gameVersionCount,
        });

        if (
            isRegisteredUserInTournamentResponse.success &&
            isRegisteredUserInTournamentResponse.result.isRegistered
        ) {
            const tournamentRoom = await this.db.getTournamentRoom(params.tournamentId);

            if (!tournamentRoom) {
                return {
                    success: false,
                    isRetry: false,
                    isDisplay: true,
                    channelId: "",
                    info: popupTextManager.dbQyeryInfo.DBGETTOURNAMENTROOM_DEREGISTERTOURNAMENTDBERROR_TOURNAMENT,
                };
            }

            const updatedParams = await this.createParamsForDeregisterTournament(tournamentRoom, params);

            const response = await this.validateAndDeRegisterTournament(updatedParams);

            return response;
        } else {
            return {
                success: false,
                isRetry: false,
                isDisplay: true,
                channelId: "",
                info: popupTextManager.dbQyeryInfo.DBGETTOURNAMENTROOM_DEREGISTERTOURNAMENT_TOURNAMENT,
            };
        }
    };



    /**
     * Change the state of tournament
     * @method changeStateOfTournament
     * @param  {[type]}   params request json object
     * @param  {Function} cb     callback function
     * @return {[type]}          validated/params
     */
    async changeStateOfTournament(params: any): Promise<any> {

        const validated = await validateKeySets("Request", pomelo.app.serverType, "changeStateOfTournament", params);
        if (!validated.success) {
            return validated;
        }

        const result = await this.db.updateTournamentStateAndTime(params.tournamentId.toString(), params.sate);

        return result;
    };




    /**
     * Get TournamentUser and ranks dynamically
     * @method getRegisteredTournamentUsers
     * @param  {[type]}   params request json object
     * @param  {Function} cb     callback function
     * @return {[type]}          validated/params
     */
    async getRegisteredTournamentUsers(params: any): Promise<any> {

        const validated = await validateKeySets("Request", pomelo.app.serverType, "getTournamentUsers", params);
        if (!validated.success) {
            return validated;
        }

        const tournament = await this.db.getTournamentRoom(params.tournamentId);

        if (!tournament) {
            return {
                success: false,
                isRetry: false,
                isDisplay: true,
                channelId: "",
                info: popupTextManager.dbQyeryInfo.DBGETTOURNAMENTROOMFAIL_TOURNAMENT
            };
        }

        if (tournament.state === stateOfX.tournamentState.finished) {
            params.gameVersionCount = tournament.gameVersionCount - 1;
        }

        const userRanks = await this.imdb.getRanks(params)

        if (userRanks) {
            userRanks.ranks = _.sortBy(userRanks.ranks, "rank");
            return {
                success: true,
                result: userRanks
            };
        }

        return {
            success: true,
            result: {}
        };
    };


    // Get every table structure at run time
    async getChannelStructure(params: any): Promise<any> {
        const channelDetailsResponse = await this.channelDetails.getChannelDetails(params);

        return channelDetailsResponse;
    };


    // Get blind structure
    async getBlindAndPrize(params: any): Promise<any> {
        const response: any = {};

        const blindRule = await this.db.listBlindRule({ _id: new ObjectId(params.blindRule) });
        if (!blindRule) {
            return {
                success: false,
                info: "Error in getting blind structure from db",
                isRetry: false,
                isDisplay: false,
                channelId: ""
            };
        }

        response.blindRule = blindRule;

        const prizeRule = await this.db.listPrizeRule({ _id: new ObjectId(params.prizeRule) });
        if (!prizeRule) {
            return {
                success: false,
                info: "Error in getting prize structure from db",
                isRetry: false,
                isDisplay: false,
                channelId: ""
            };
        }

        response.prizeRule = prizeRule;

        return {
            success: true,
            result: response
        };
    };


    /**
     * gets blind id for blind rule on current tournament
     * @method getBlindId
     * @param  {[type]}   params request json object
     * @param  {Function} cb     callback function
     * @return {[type]}          validated/params
     */
    async getBlindId(params: any): Promise<any> {
        try {
            const response = await this.db.getTournamentRoom(params.tournamentId);
            if (!response) {
                return {
                    success: false,
                    isRetry: false,
                    isDisplay: true,
                    channelId: "",
                    info: popupTextManager.dbQyeryInfo.DBTOURNAMENTROOMFAIL_TOURNAMENT
                };
            }

            params.blindId = response.blindRule;
            params.breakRuleId = response.breakRuleId;
            params.timeBankRuleId = response.timeBankRule;
            params.addonRule = response.addonRule;

            return params;
        } catch (err) {
            return {
                success: false,
                info: "Error in getting blindId",
                isRetry: false,
                isDisplay: false,
                channelId: ""
            };
        }
    }


    /**
     * gets blind rule on current tournament
     * @method getBlindRule
     * @param  {[type]}   params request json object
     * @param  {Function} cb     callback function
     * @return {[type]}          validated/params
     */
    async getBlindRule(params: any): Promise<any> {
        try {
            const response = await this.db.findBlindRule(params.blindId);
            params.blindRule = response;
            return params;
        } catch (err) {
            return {
                success: false,
                isRetry: false,
                isDisplay: true,
                channelId: "",
                info: popupTextManager.dbQyeryInfo.DBFINDBLINDRULE_GETBLINDRULEDBERROR_TOURNAMENT
            };
        }
    }



    /**
     * gets timeBank rule on current tournament
     * @method getBlindRule
     * @param  {[type]}   params request json object
     * @param  {Function} cb     callback function
     * @return {[type]}          validated/params
     */
    async getTimeBankRule(params: any): Promise<any> {
        try {
            const response = await this.db.findTimeBankRule(params.timeBankRuleId);
            params.timeBankRule = response;
            return params;
        } catch (err) {
            return {
                success: false,
                isRetry: false,
                isDisplay: true,
                channelId: "",
                info: popupTextManager.dbQyeryInfo.DBFINDTIMEBANKRULE_GETTIMEBANKRULEDBERROR_TOURNAMENT
            };
        }
    }


    /**
     * gets getBreakRule rule on current tournament
     * @method getBlindRule
     * @param  {[type]}   params request json object
     * @param  {Function} cb     callback function
     * @return {[type]}          validated/params
     */
    async getBreakRule(params: any): Promise<any> {
        try {
            const response = await this.db.findBreakRule(params.breakRuleId);
            params.breakRule = response;
            return params;
        } catch (err) {
            return {
                success: false,
                isRetry: false,
                isDisplay: true,
                channelId: "",
                info: popupTextManager.dbQyeryInfo.DBFINDBREAKRULE_GETBREAKRULEDBERROR_TOURNAMENT
            };
        }
    }




    async findTournamentRoom(params: any): Promise<any> {
        try {
            const tournament = await this.db.getTournamentRoom(params.tournamentId);
            params.isLateRegistrationOpened = tournament.isLateRegistrationOpened;
            params.isRebuyOpened = tournament.isRebuyOpened;
            params.state = tournament.state;
            return params;
        } catch (err) {
            return {
                success: false,
                isRetry: false,
                isDisplay: true,
                channelId: "",
                info: popupTextManager.dbQyeryInfo.DBGETTOURNAMENTROOM_FINDTOURNAMENTROOM_TOURNAMENT
            };
        }
    }



    async getPrizeStructure(params: any): Promise<any> {
        const noOfPlayers = params.noOfPlayers.toString();
        params.isPrizeDecided = false;

        const query: any = {
            tournamentId: params.tournamentId
        };

        if (
            !params.isLateRegistrationOpened &&
            !params.isRebuyOpened &&
            (params.state === stateOfX.tournamentState.running || params.state === stateOfX.tournamentState.finished)
        ) {
            params.isPrizeDecided = true;
            query.type = "server";
        }

        try {
            const response = await this.db.listPrizeRule(query);
            params.prizeRule = response[0].prize;
            return params;
        } catch (err) {
            return {
                success: false,
                isRetry: false,
                isDisplay: true,
                channelId: "",
                info: popupTextManager.dbQyeryInfo.DBLISTPRIZERULE_GETPRIZESTRUCTUREDBERROR_TOURNAMENT
            };
        }
    }


    /**
     * creates the response for the client
     * @method createResponse
     * @param  {[params]}   params request json object
     * @param  {Function} cb     callback function
     */
    createResponse(params: any): any {
        return {
            success: true,
            result: {
                blindRule: params.blindRule,
                prizeRule: params.prizeRule,
                timeBankRule: params.timeBankRule,
                breakRule: params.breakRule,
                addonRule: params.addonRule,
                isPrizeDecided: params.isPrizeDecided
            }
        };
    }

    /**
     * getBlindAndPrizeForNormalTournament contains a series of async functions that have been defined above
     * @method getBlindAndPrizeForNormalTournament
     * @param  {[params]}   params request json object
     * @param  {Function} cb     callback function
     */
    async getBlindAndPrizeForNormalTournament(params: any): Promise<any> {
        const noOfPlayers = params.noOfPlayers.toString();

        try {
            let updatedParams = await this.getBlindId(params);
            updatedParams = await this.getBlindRule(updatedParams);
            updatedParams = await this.getTimeBankRule(updatedParams);
            updatedParams = await this.getBreakRule(updatedParams);
            updatedParams = await this.findTournamentRoom(updatedParams);
            updatedParams = await this.getPrizeStructure(updatedParams);
            const response = await this.createResponse(updatedParams);
            return response;
        } catch (err) {
            return err;
        }
    };


    // {tournamentId,gameVersionCount}
    async getEnrolledPlayersInTournament(params: any): Promise<any> {
        try {
            const count = await this.db.countTournamentusers({ tournamentId: params.tournamentId, gameVersionCount: params.gameVersionCount });
            return { success: true, count };
        } catch (err) {
            return { success: false };
        }
    };


    async getEnrollPlayersChildTournament(params: any): Promise<any> {
        const enrolledPlayerResponse = await this.getEnrolledPlayersInTournament({
            tournamentId: params.tournamentId,
            gameVersionCount: params.gameVersionCount,
        });

        if (enrolledPlayerResponse.success) {
            params.enrolledPlayers = enrolledPlayerResponse.count;
            return params;
        } else {
            return {
                success: false,
                isRetry: false,
                isDisplay: false,
                channelId: "",
                info: popupTextManager.falseMessages.GETENROLLEDPLAYERSCHILDTOURNAMENTFAIL_TOURNAMENT,
            };
        }
    };

    async getParentTournament(params: any): Promise<any> {
        const result = await this.db.getTournamentRoom(params.tournamentId);

        if (!result) {
            return {
                success: false,
                isRetry: false,
                isDisplay: false,
                channelId: "",
                info: popupTextManager.dbQyeryInfo.DBGETTOURNAMENTROOM_GETPARENTTOURNAMENT_NOTOURNAMENT_TOURNAMENT
            };
        }

        params.tournament = result;

        try {
            const parentTournament = await this.db.getTournamentRoom(result.parentOfSatelliteId);

            if (!parentTournament) {
                return {
                    success: false,
                    isRetry: false,
                    isDisplay: false,
                    channelId: "",
                    info: popupTextManager.dbQyeryInfo.DBGETTOURNAMENTROOM_GETPARENTTOURNAMENT_NOPARENTTOURNAMENT_TOURNAMENT
                };
            }

            params.parentTournament = parentTournament;
            return params;
        } catch (err) {
            return {
                success: false,
                isRetry: false,
                isDisplay: false,
                channelId: "",
                info: popupTextManager.dbQyeryInfo.DBGETTOURNAMENTROOM_GETPARENTTOURNAMENT_DBERROR_TOURNAMENT
            };
        }
    };


    async getEnrollPlayersParentTournament(params: any): Promise<any> {
        const enrolledPlayerResponse = await this.getEnrolledPlayersInTournament({
            tournamentId: params.parentTournament._id.toString(),
            gameVersionCount: params.parentTournament.gameVersionCount
        });

        if (enrolledPlayerResponse.success) {
            params.parentTournament.enrolledPlayer = enrolledPlayerResponse.count;
            return params;
        } else {
            return {
                success: false,
                info: "Error in getting enrolled players of child",
                isDisplay: false,
                isRetry: false,
                channelId: ""
            };
        }
    };

    createResponseForSatellite(params: any): any {
        const response = {
            blindRule: params.blindRule,
            addonRule: params.addonRule,
            timeBankRule: params.timeBankRule,
            breakRule: params.breakRule,
            usersPerPrize: Math.round(params.parentTournament.buyIn / params.tournament.buyIn),
            parentTournament: params.parentTournament,
            enrolledPlayers: params.enrolledPlayers,
        };

        return { success: true, result: response };
    };


    async getBlindAndPrizeForSatelliteTournament(params: any): Promise<any> {
        try {
            let updatedParams = await this.getBlindId(params);
            updatedParams = await this.getEnrollPlayersChildTournament(updatedParams);
            updatedParams = await this.getBlindRule(updatedParams);
            updatedParams = await this.getTimeBankRule(updatedParams);
            updatedParams = await this.getBreakRule(updatedParams);
            updatedParams = await this.getParentTournament(updatedParams);
            updatedParams = await this.getEnrollPlayersParentTournament(updatedParams);
            const response = await this.createResponseForSatellite(updatedParams);
            return response;
        } catch (err) {
            throw err;
        }
    };

    /**
     * this function is to  getPlayerPrize which is called on login to get those players whose chipsWon is more than 0 and who have not clicked on Ok i.e. their isCollected is false 
     * @method getPlayerPrize
     * @param  {Object} params  request json object 
     * @param  {cb}     cb      callback function  
     */
    async getPlayerPrize(params: any): Promise<any> {
        const filter = {
            playerId: params.playerId,
            isCollected: false,
            chipsWon: { $gt: 0 }
        };

        try {
            const prize = await this.db.getTournamentRanks(filter);
            if (!prize) {
                return {
                    success: false,
                    isRetry: false,
                    isDisplay: false,
                    channelId: "",
                    info: popupTextManager.dbQyeryInfo.DBGETTOURNAMENTRANKS_GETPLAYERPRIZE_TOURNAMENT
                };
            }

            return { success: true, result: prize };
        } catch (err) {
            return {
                success: false,
                isRetry: false,
                isDisplay: false,
                channelId: "",
                info: popupTextManager.dbQyeryInfo.DBGETTOURNAMENTRANKS_GETPLAYERPRIZE_TOURNAMENT
            };
        }
    };


    /**
     * this function is for updating the value of isCollected key if a players has seen his rank,prize and clicked Ok
     * @method process
     * @param  {Object} params  request json object 
     * @param  {cb}     cb      callback function  
     */
    async collectPrize(params: any): Promise<any> {
        const filter = {
            playerId: params.playerId,
            gameVersionCount: params.gameVersionCount,
            tournamentId: params.tournamentId,
            isCollected: false
        };

        try {
            const prize = await this.db.updateTournamentRanks(filter);
            if (!prize) {
                return {
                    success: false,
                    isRetry: false,
                    isDisplay: false,
                    channelId: "",
                    info: popupTextManager.dbQyeryInfo.DBUPDATETOURNAMENTRANKS_COLLECTPRIZE_TOURNAMENT
                };
            }

            return { success: true, result: "prize updated successfully" };
        } catch (err) {
            return {
                success: false,
                isRetry: false,
                isDisplay: false,
                channelId: "",
                info: popupTextManager.dbQyeryInfo.DBUPDATETOURNAMENTRANKS_COLLECTPRIZE_TOURNAMENT
            };
        }
    };


    /**
     * this function is for registration in satellite tournaments
     * @method registrationInSatelliteTournament 
     * @param  {Object} params  request json object - {tournamentId,playerId}
     * @param  {cb}     cb      callback function  
     */
    async registrationInSatelliteTournament(params: any): Promise<any> {
        const registerResponse = await this.satelliteTournament.register(params);
        return registerResponse;
    };










}