import { Injectable } from "@nestjs/common";
import _ from 'underscore';
import { stateOfX, popupTextManager } from "shared/common";
import { ImdbDatabaseService } from "shared/common/datebase/Imdbdatabase.service";
import { PokerDatabaseService } from "shared/common/datebase/pokerdatabase.service";










@Injectable()
export class DynamicRanksService {

    private popupTextManager = popupTextManager.falseMessages;
    private popupTextManagerFromdb = popupTextManager.dbQyeryInfo;

    constructor(
        private readonly db: PokerDatabaseService,
        private readonly imdb: ImdbDatabaseService,
    ) { }





    /*============================  START  =================================*/
    //Getting tables of tournament from  memorydb
    /**
     * this function gets tables from inMemoryDb
     * @method gettingTables
     * @param  {object}      params request json object
     * @param  {Function}    cb     callback function
     */
    // New
    async gettingTables(params: any): Promise<any> {
        try {
            console.log(stateOfX.serverLogType.info, "params in getting ranks are " + JSON.stringify(params));
            const tables = await this.imdb.findTableByTournamentId(params.tournamentId, params.playerId);

            if (!tables) {
                return {
                    success: false,
                    channelId: params.channelId || "",
                    info: this.popupTextManager.GETTINGTABLES_DYNAMICRANKS,
                    isRetry: false,
                    isDisplay: true,
                };
            }

            console.log(stateOfX.serverLogType.info, "tables are --" + JSON.stringify(tables));
            params.tables = tables;
            return { success: true, result: params };
        } catch (err) {
            return {
                success: false,
                channelId: params.channelId || "",
                info: this.popupTextManager.GETTINGTABLES_DYNAMICRANKS,
                isRetry: false,
                isDisplay: true,
            };
        }
    };


    // Old
    // let gettingTables = (params, cb) => {
    //     console.log(stateOfX.serverLogType.info, "params in getting ranks are " + JSON.stringify(params));
    //     imdb.findTableByTournamentId(params.tournamentId, params.playerId, (err, tables) => {
    //       if (err || !tables) {
    //         cb({ success: false, channelId: (params.channelId || ""), info: popupTextManager.GETTINGTABLES_DYNAMICRANKS, isRetry: false, isDisplay: true });
    //       } else {
    //         console.log(stateOfX.serverLogType.info, "tables are --" + JSON.stringify(tables));
    //         params.tables = tables;
    //         cb({ success: true, result: params });
    //       }
    //     })
    //   }
    /*============================  END  =================================*/





    /*============================  START  =================================*/
    /**
     * this function removes duplicate entries from ranks
     * @method removeDuplicate
     * @param  {object}        inGameUserRank         ranks of users in game
     * @param  {object}        eliminatedUserRanks    ranks of eliminated users
     * @return {object}        unique                 object with duplicate ranks removed
     */
    //   New
    removeDuplicate(inGameUserRank: any, eliminatedUserRanks: any): any {

        let unique: any[] = [];
        for (let i = 0; i < inGameUserRank.length; i++) {
            let commonUserCount = 0;
            for (let j = 0; j < eliminatedUserRanks.length; j++) {
                if (eliminatedUserRanks[j].playerId === inGameUserRank[i].playerId) {
                    commonUserCount++;
                }
            }
            if (commonUserCount === 0) {
                unique.push(inGameUserRank[i]);
            }
        }

        unique = unique.concat(eliminatedUserRanks);
        return unique;
    };


    //   Old
    //   var removeDuplicate = function (inGameUserRank, eliminatedUserRanks) {
    //     console.log(stateOfX.serverLogType.info, "in find unique in dynamicRanks - " + JSON.stringify(inGameUserRank), eliminatedUserRanks);
    //     let unique = [];
    //     for (let i = 0; i < inGameUserRank.length; i++) {
    //       let commonUserCount = 0;
    //       for (let j = 0; j < eliminatedUserRanks.length; j++) {
    //         if (eliminatedUserRanks[j].playerId === inGameUserRank[i].playerId) {
    //           commonUserCount++;
    //         }
    //       }
    //       // console.log(stateOfX.serverLogType.info,"ttttttttttttttttttt",commonUserCount);
    //       if (commonUserCount === 0) {
    //         unique.push(inGameUserRank[i])
    //       }
    //     }
    //     // console.log(stateOfX.serverLogType.info,"unique - ",unique);
    //     unique = unique.concat(eliminatedUserRanks);
    //     // console.log(stateOfX.serverLogType.info,"final unique - ",unique);
    //     return unique;
    //   }
    /*============================  END  =================================*/





    /*============================  START  =================================*/
    // Calculating ranks on run time on basis of ranks
    /**
     * this function calculates ranks on basis of ranks
     * @method calculateRanksForRunningState
     * @param  {object}                      params   request json object
     * @param  {Function}                    cb       callback function
     */
    //   New
    async calculateRanksForRunningState(params: any): Promise<any> {
        try {
            const gettingTablesResponse = await this.gettingTables(params);

            if (gettingTablesResponse.success) {
                let eliminatedUserRanks: any[] = [], inGameUserRank: any[] = [];
                let tables = gettingTablesResponse.result.tables;

                for (let tableIt = 0; tableIt < tables.length; tableIt++) {
                    inGameUserRank = inGameUserRank.concat(tables[tableIt].players);
                    eliminatedUserRanks = eliminatedUserRanks.concat(tables[tableIt].tournamentRules.ranks);
                }


                inGameUserRank = _.sortBy(inGameUserRank, 'chips').reverse();
                eliminatedUserRanks = _.sortBy(eliminatedUserRanks, 'rank');
                params.ranks = this.removeDuplicate(inGameUserRank, eliminatedUserRanks);


                // params.ranks = inGameUserRank.concat(eliminatedUserRanks);
                params = _.omit(params, "tables", "players");

                return { success: true, result: params };
            } else {
                return gettingTablesResponse;
            }
        } catch (error) {
            console.log(stateOfX.serverLogType.error, "Error in calculateRanksForRunningState", error);
            throw error;
        }
    };


    //   Old
    //   let calculateRanksForRunningState = (params, cb) => {
    //     console.log('------in calculateRanksForRunningState------', params);
    //     console.log(stateOfX.serverLogType.info, "params in calculating rank in tournament.js" + JSON.stringify(params));
    //     gettingTables(params, (gettingTablesResponse) => {
    //       console.log('------got gettingTablesResponse-----', gettingTablesResponse);
    //       if (gettingTablesResponse.success) {
    //         let eliminatedUserRanks = [], inGameUserRank = [];
    //         let tables = gettingTablesResponse.result.tables;
    //         console.log(stateOfX.serverLogType.info, "tables is in calculateRanksForRunningStateResponse " + JSON.stringify(tables));
    //         for (let tableIt = 0; tableIt < tables.length; tableIt++) {
    //           inGameUserRank = inGameUserRank.concat(tables[tableIt].players);
    //           eliminatedUserRanks = eliminatedUserRanks.concat(tables[tableIt].tournamentRules.ranks);
    //         }
    //         console.log('---inGameUserRank and eliminated user ranks are-----', inGameUserRank);
    //         console.log('---inGameUserRank and eliminated user ranks are-----', eliminatedUserRanks);
    //         console.log(stateOfX.serverLogType.info, "eliminatedUserRanks -- " + JSON.stringify(eliminatedUserRanks));
    //         console.log(stateOfX.serverLogType.info, "inGameUserRank -- " + JSON.stringify(inGameUserRank));
    //         inGameUserRank = _.sortBy(inGameUserRank, 'chips').reverse();
    //         eliminatedUserRanks = _.sortBy(eliminatedUserRanks, 'rank');
    //         params.ranks = removeDuplicate(inGameUserRank, eliminatedUserRanks);
    //         console.log(stateOfX.serverLogType.info, "params.ranks are - " + JSON.stringify(params.ranks));
    //         // params.ranks = inGameUserRank.concat(eliminatedUserRanks);
    //         params = _.omit(params, "tables", "players");
    //         cb({ success: true, result: params });
    //       } else {
    //         cb(gettingTablesResponse);
    //       }
    //     })
    //   }
    /*============================  END  =================================*/




    /*============================  START  =================================*/
    /**
     * this function creates response when tournament state is finished
     * @method createResponseForFinishedState
     * @param  {object}                         params request json object
     * @param  {Function}                       cb     callback function
     */
    //   New
    async createResponseForFinishedState(params: any): Promise<any> {

        for (let userIt = 0; userIt < params.players.length; userIt++) {
            let tempPlayer = _.where(params.playerRanks, { playerId: params.players[userIt].playerId });

            if (tempPlayer && tempPlayer[0]) {
                params.players[userIt].rank = tempPlayer[0].rank;
                params.players[userIt].chipsWon = tempPlayer[0].chipsWon;
            }
        }

        return params.players;
    };


    //   Old
    //   var createResponseForFinishedState = function (params, cb) {
    //     console.log("params.playerRanks is", params.playerRanks, params.players);
    //     for (let userIt = 0; userIt < params.players.length; userIt++) {
    //         let tempPlayer = _.where(params.playerRanks, { playerId: params.players[userIt].playerId });
    //         console.log(stateOfX.serverLogType.info, "tempPlayer is" + tempPlayer, params.players[userIt]);
    //         if (tempPlayer && tempPlayer[0]) {
    //             params.players[userIt].rank = tempPlayer[0].rank;
    //             params.players[userIt].chipsWon = tempPlayer[0].chipsWon;
    //         }
    //     }
    //     console.log(stateOfX.serverLogType.info, "players is in createResponseForFinishedState is - " + JSON.stringify(params.players));
    //     cb(params.players);
    // }
    /*============================  END  =================================*/



    /*============================  START  =================================*/
    /**
     * this function finds unique players from player ids
     * @method filterUniquePlayerRanks
     * @param  {object}          players    json object containing players
     * @return {object}          uniquePlayers    json object containing unique players
     */
    // New
    filterUniquePlayerRanks(players: any): any {

        let playerIds = _.pluck(players, "playerId");
        playerIds = _.uniq(playerIds);


        const uniquePlayers: any[] = [];

        for (let i = 0; i < playerIds.length; i++) {
            const matchingPlayer = _.where(players, { playerId: playerIds[i] })[0];
            if (matchingPlayer) {
                uniquePlayers.push(matchingPlayer);
            }
        }

        console.log(stateOfX.serverLogType.info, 'unique players are - ' + JSON.stringify(uniquePlayers));
        return uniquePlayers;
    };


    // Old
    // var filterUniquePlayerRanks = function (players) {
    //     console.log(stateOfX.serverLogType.info, 'players are in filterUniquePlayerRanks -' + JSON.stringify(players));
    //     let playerIds = _.pluck(players, "playerId");
    //     playerIds = _.uniq(playerIds);
    //     console.log(stateOfX.serverLogType.info, 'playerIds are in ranks - ' + JSON.stringify(playerIds));
    //     let uniquePlayers = [];
    //     for (let i = 0; i < playerIds.length; i++) {
    //         uniquePlayers.push(_.where(players, { playerId: playerIds[i] })[0]);
    //     }
    //     console.log(stateOfX.serverLogType.info, 'unique players are - ' + JSON.stringify(uniquePlayers));
    //     return uniquePlayers;
    // }
    /*============================  END  =================================*/



    /*============================  START  =================================*/
    // Response when state is running
    /**
     * this function creates response when tournament state is running
     * @method createResponseForRunningState
     * @param  {object}                         params request json object
     * @param  {Function}                       cb     callback function
     */
    // New
    createResponseForRunningState(params: any): any {
    
        let players: any[] = [];
    
        for (let playerIt = 0; playerIt < params.ranks.length; playerIt++) {
    
        if (!_.isArray(params.ranks[playerIt])) {
            const temp: any = {};
            temp.playerId = params.ranks[playerIt].playerId;
    
            if (!!params.ranks[playerIt].tournamentData) {
            temp.userName = params.ranks[playerIt].tournamentData.userName || params.ranks[playerIt].playerName;
            } else {
            temp.userName = params.ranks[playerIt].userName;
            }
    
            temp.userName = params.ranks[playerIt].userName || params.ranks[playerIt].playerName;
            temp.eliminated = !!params.ranks[playerIt].rank;
            temp.rank = params.ranks[playerIt].rank || playerIt + 1;
            temp.chipsWon = (params.ranks[playerIt].chips - params.startingChips);
    
            players.push(temp);
        }
        }
    
    
        // In some case player player ranks are duplicate so make them unique.
        players = this.filterUniquePlayerRanks(players);
    
        return players;
    };
    

    // Old
    // var createResponseForRunningState = function (params, cb) {
    //     console.log('in dynamicRanks in createResponseForRunningState params are', params);
    //     console.log(stateOfX.serverLogType.info, "in createResponseForRunningState in dynamicRanks are" + JSON.stringify(params));
    //     let players = [];
    //     for (let playerIt = 0; playerIt < params.ranks.length; playerIt++) {
    //         console.log(stateOfX.serverLogType.info, 'params.ranks[playerIt] ' + JSON.stringify(params.ranks[playerIt]));
    //         if (!_.isArray(params.ranks[playerIt])) {
    //             let temp = {};
    //             temp.playerId = params.ranks[playerIt].playerId;
    //             if (!!params.ranks[playerIt].tournamentData) {
    //                 temp.userName = params.ranks[playerIt].tournamentData.userName || params.ranks[playerIt].playerName;
    //             } else {
    //                 temp.userName = params.ranks[playerIt].userName;
    //             }
    //             temp.userName = params.ranks[playerIt].userName || params.ranks[playerIt].playerName;
    //             temp.eliminated = !!params.ranks[playerIt].rank ? true : false;
    //             temp.rank = params.ranks[playerIt].rank || playerIt + 1;
    //             // temp.chipsWon = params.ranks[playerIt].chipsWon || params.ranks[playerIt].chips || 0;
    //             temp.chipsWon = (params.ranks[playerIt].chips - params.startingChips);
    //             players.push(temp)
    //         }
    //     }
    //     console.log(stateOfX.serverLogType.info, "createResponseForRunningState is - " + JSON.stringify(players));
    //     // In some case player player ranks are duplicate so make them unique.
    //     players = filterUniquePlayerRanks(players);
    //     cb(players);
    // }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    // Create response for tournament users
    /**
     * this function creates response for tournament users
     * @method createResponseForTournamentUsers
     * @param  {object}                         params request json object
     * @param  {Function}                       cb     callback function
     */
    async  createResponseForTournamentUsers(params: any): Promise<any>{
    
        if ((!!params.userIds && params.userIds.length > 0) || (!!params.players && params.players.length > 0) || (!!params.ranks && !! (params.ranks.length > 0))) {
        switch (params.tournamentState) {
            case stateOfX.tournamentState.register:
            return params.players;
    
            case stateOfX.tournamentState.started:
            case stateOfX.tournamentState.running:
            const runningPlayers = await this.createResponseForRunningState(params);
            return runningPlayers;
    
            case stateOfX.tournamentState.finished:
            const finishedPlayers = await this.createResponseForFinishedState(params);
            return finishedPlayers;
    
            default:

            throw {
                success: false,
                channelId: params.channelId || "",
                info: this.popupTextManager.CREATERESPONSEFORTOURNAMENTUSERS_DYNAMICRANKS,
                isRetry: false,
                isDisplay: true
            };
        }
        } else {
        return [];
        }
    };
  
    /*============================  END  =================================*/



    /*============================  START  =================================*/
    /**
     * this function calculates rank when tournament finishes
     * @method calculateRanksForFinishedState
     * @param  {object}                       params request json object
     * @param  {Function}                     cb     callback function
     */
    // New
    async calculateRanksForFinishedState(params: any): Promise<any> {
        const filterForPrizes = {
            tournamentId: params.tournamentId.toString()
        };

        console.log(stateOfX.serverLogType.info, "filter for calcculateRank for finished state in dynamic ranks ", filterForPrizes);

        try {
            const tournamentRanks = await this.db.getTournamentRanks(filterForPrizes);

            if (!tournamentRanks) {
                return {
                    success: false,
                    channelId: params.channelId || "",
                    info: this.popupTextManager.CALCULATERANKSFORFINISHEDSTATE_DB_DYNAMICRANKS,
                    isRetry: false,
                    isDisplay: true
                };
            }

            params.playerRanks = tournamentRanks;

            return { success: true, result: params };
        } catch (err) {
            return {
                success: false,
                channelId: params.channelId || "",
                info: this.popupTextManager.CALCULATERANKSFORFINISHEDSTATE_DB_DYNAMICRANKS,
                isRetry: false,
                isDisplay: true
            };
        }
    }


    // Old
    // let calculateRanksForFinishedState = (params, cb) => {
    //     let filterForPrizes = {
    //         tournamentId: (params.tournamentId).toString()
    //     }
    //     console.log(stateOfX.serverLogType.info, "filter for calcculateRank for finished state in dynamic ranks " + filterForPrizes);
    //     db.getTournamentRanks(filterForPrizes, (err, tournamentRanks) => {
    //         if (err || !tournamentRanks) {
    //             cb({ success: false, channelId: (params.channelId || ""), info: popupTextManager.CALCULATERANKSFORFINISHEDSTATE_DB_DYNAMICRANKS, isRetry: false, isDisplay: true });
    //         } else {
    //             console.log(stateOfX.serverLogType.info, "ranks is in calculateRanksForFinishedState in dynamicRanks " + JSON.stringify(tournamentRanks));
    //             params.playerRanks = tournamentRanks;
    //             console.log(stateOfX.serverLogType.info, "tournament ranks is in calculateRanksForFinishedState" + JSON.stringify(params));
    //             cb({ success: true, result: params });
    //         }
    //     })
    // }
    /*============================  END  =================================*/



    /*============================  START  =================================*/
    //Get Tournament State
    /**
     * this function processes registered users and calculate ranks
     * @method processRegisteredUser
     * @param  {object}              params request json object
     * @param  {Function}            cb     callback function
     */
    // New
    async processRegisteredUser(params: any): Promise<any> {

        if ((params.userIds?.length > 0) || (params.players?.length > 0)) {
            if (params.tournamentState === stateOfX.tournamentState.register) {
                return params;
            }

            if (params.tournamentState === stateOfX.tournamentState.started || params.tournamentState === stateOfX.tournamentState.running) {
                const ranks = await this.calculateRanksForRunningState(params);
                if (ranks.success) {
                    return ranks.result;
                } else {
                    throw ranks;
                }
            }

            if (params.tournamentState === stateOfX.tournamentState.finished) {
                const calculateRanksForFinishedStateResponse = await this.calculateRanksForFinishedState(params);
                if (calculateRanksForFinishedStateResponse.success) {
                    return calculateRanksForFinishedStateResponse.result;
                } else {
                    throw calculateRanksForFinishedStateResponse;
                }
            }

            throw {
                success: false,
                channelId: params.channelId || "",
                info: this.popupTextManager.PROCESSREGISTEREDUSER_DYNAMICRANKS,
                isRetry: false,
                isDisplay: true
            };
        }

        return params;
    }


    // Old
    // let processRegisteredUser = (params, cb) => {
    //     console.log('-------in processRegisteredUser params are---', params);
    //     console.log(stateOfX.serverLogType.info, "params is in processRegisteredUser is - ", JSON.stringify(params));
    //     if ((!!params.userIds && params.userIds.length > 0) || (!!params.players && params.players.length > 0)) {
    //         if (params.tournamentState === stateOfX.tournamentState.register) {
    //             cb(null, params);
    //         } else if (params.tournamentState === stateOfX.tournamentState.started || params.tournamentState === stateOfX.tournamentState.running) {
    //             calculateRanksForRunningState(params, (ranks) => {
    //                 if (ranks.success) {
    //                     cb(null, ranks.result);
    //                 } else {
    //                     cb(ranks);
    //                 }
    //             })
    //         } else if (params.tournamentState === stateOfX.tournamentState.finished) {
    //             calculateRanksForFinishedState(params, (calculateRanksForFinishedStateResponse) => {
    //                 console.log('---successfully got ranks of players in finished state----', calculateRanksForFinishedStateResponse);
    //                 if (calculateRanksForFinishedStateResponse.success) {
    //                     cb(null, calculateRanksForFinishedStateResponse.result)
    //                 } else {
    //                     cb(calculateRanksForFinishedStateResponse);
    //                 }
    //             })
    //         } else {
    //             cb({ success: false, channelId: (params.channelId || ""), info: popupTextManager.PROCESSREGISTEREDUSER_DYNAMICRANKS, isRetry: false, isDisplay: true })
    //         }
    //     } else {
    //         cb(null, params);
    //     }
    // }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    //get userInfo
    /**
     * this function gets user info using userId
     * @method getUserInfo
     * @param  {object}    params request json object
     * @param  {Function}  cb     callback function
     */
    // New
    async getUserInfo(params: any): Promise<any> {

        if (params.userIds.length > 0) {
            try {
                const users = await this.db.findUserArray(params.userIds);

                if (users && users.length > 0) {
                    const players = [];
                    for (let userIt = 0; userIt < users.length; userIt++) {
                        players.push({
                            playerId: users[userIt].playerId,
                            userName: users[userIt].userName,
                            rank: 0,
                            chipsWon: params.startingChips
                        });
                    }

                    params = _.omit(params, 'userIds');
                    params.players = players;

                    console.log(stateOfX.serverLogType.info, "params in getUserInfo - " + JSON.stringify(params));
                    return params;
                } else {
                    throw {
                        success: false,
                        channelId: params.channelId || "",
                        info: this.popupTextManager.GETUSERINFO_DYNAMICRANKS,
                        isRetry: false,
                        isDisplay: true
                    };
                }
            } catch (err) {
                console.log('Got error in getUserInfo in dynamicRanks', err);
                throw {
                    success: false,
                    isRetry: false,
                    isDisplay: true,
                    channelId: "",
                    info: this.popupTextManagerFromdb.GETUSERINFO_DB_DYNAMICRANKS
                };
            }
        }

        return params;
    }


    // Old
    // let getUserInfo = async (params, cb) => {
    //     console.log('------in getUserInfo-----', params);
    //     if (params.userIds.length > 0) {
    //         // try {
    //         //   let users = await db.findUserArray(params.userIds);
    //         //   console.log('got users in dynamicRanks is', users);
    //         //   if (!!users && users.length > 0) {
    //         //     let players = [];
    //         //     for (let userIt = 0; userIt < users.length; userIt++) {
    //         //       players.push({ playerId: users[userIt].playerId, userName: users[userIt].userName, rank: 0, chipsWon: params.startingChips });
    //         //     }
    //         //     params = _.omit(params, 'userIds');
    //         //     params.players = players;
    //         //     console.log(stateOfX.serverLogType.info, "params in getUserInfo - " + JSON.stringify(params));
    //         //     cb(null, params);
    //         //   } else {
    //         //     cb({ success: false, channelId: (params.channelId || ""), info: popupTextManager.GETUSERINFO_DYNAMICRANKS, isRetry: false, isDisplay: true });
    //         //   }
    //         // } catch (err) {
    //         //   console.log('Got error in getUserInfo in dynamicRanks', err);
    //         //   cb({ success: false, isRetry: false, isDisplay: true, channelId: "", info: popupTextManagerFromdb.GETUSERINFO_DB_DYNAMICRANKS });
    //         // }

    //         db.findUserArray(params.userIds, (err, users) => {
    //             console.log('----found users from db------', users);
    //             if (err) {
    //                 cb({ success: false, isRetry: false, isDisplay: true, channelId: "", info: popupTextManagerFromdb.GETUSERINFO_DB_DYNAMICRANKS });
    //                 //cb({success: false, info: "Error in getting users"});
    //             } else {
    //                 if (!!users && users.length > 0) {
    //                     let players = [];
    //                     for (let userIt = 0; userIt < users.length; userIt++) {
    //                         players.push({ playerId: users[userIt].playerId, userName: users[userIt].userName, rank: 0, chipsWon: params.startingChips });
    //                     }
    //                     params = _.omit(params, 'userIds');
    //                     params.players = players;
    //                     console.log(stateOfX.serverLogType.info, "params in getUserInfo - " + JSON.stringify(params));
    //                     cb(null, params);
    //                 } else {
    //                     cb({ success: false, channelId: (params.channelId || ""), info: popupTextManager.GETUSERINFO_DYNAMICRANKS, isRetry: false, isDisplay: true });
    //                 }
    //             }
    //         })

    //     } else {
    //         cb(null, params);
    //     }
    // }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    //getting tournament registerd users
    /**
     * this function gets all registered tournament users in a given tournament
     * @method getAllRegisteredTournamentUsers
     * @param  {object}                        params request json object
     * @param  {Function}                      cb     callback function
     */
    // New
    async getAllRegisteredTournamentUsers(params: any): Promise<any> {

        try {
            const users = await this.db.findTournamentUser({
                tournamentId: (params.tournamentId).toString(),
                status: 'Registered'
            });

            if (!!users) {
                params.userIds = _.pluck(users, "playerId");
                console.log(stateOfX.serverLogType.info, "params.userId in getAllRegisteredTournamentUsers in tournament.js" + params.userIds);
                return params;
            } else {
                throw {
                    success: false,
                    channelId: (params.channelId || ""),
                    info: this.popupTextManager.GETREGISTEREDTOURNAMENTUSERS_DYNAMICRANKS,
                    isRetry: false,
                    isDisplay: true
                };
            }
        } catch (err) {
            throw {
                success: false,
                isRetry: false,
                isDisplay: true,
                channelId: "",
                info: this.popupTextManagerFromdb.GETREGISTEREDTOURNAMENTUSERS_DB_DYNAMICRANKS
            };
        }
    }


    // Old
    // let getAllRegisteredTournamentUsers = (params, cb) => {
    //     console.log(' -----in getAllRegisteredTournamentUsers params are---', params);
    //     console.log(stateOfX.serverLogType.info, "params are in getAllRegisteredTournamentUsers " + params);
    //     db.findTournamentUser({ tournamentId: (params.tournamentId).toString(), status: 'Registered' }, (err, users) => {
    //         if (err) {
    //             cb({ success: false, isRetry: false, isDisplay: true, channelId: "", info: popupTextManagerFromdb.GETREGISTEREDTOURNAMENTUSERS_DB_DYNAMICRANKS });
    //             //cb({success: false, info: "Error in getAllRegisteredTournamentUsers"});
    //         } else {
    //             if (!!users) {
    //                 params.userIds = _.pluck(users, "playerId");
    //                 console.log(stateOfX.serverLogType.info, "params.userId in getAllRegisteredTournamentUsers in tournament.js" + params.userIds);
    //                 cb(null, params);
    //             } else {
    //                 cb({ success: false, channelId: (params.channelId || ""), info: popupTextManager.GETREGISTEREDTOURNAMENTUSERS_DYNAMICRANKS, isRetry: false, isDisplay: true });
    //             }
    //         }
    //     })
    // }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    /**
     * this function gets tournament room using tournamentId
     * @method getTournamentRoom
     * @param  {object}          params reuqest json object
     * @param  {Function}        cb     callback function
     */
    // New
    async getTournamentRoom(params: any): Promise<any> {

        try {
            const tournament = await this.db.getTournamentRoom(params.tournamentId);

            if (!tournament) {
                throw {
                    success: false,
                    channelId: (params.channelId || ""),
                    info: this.popupTextManager.GETTOURNAMENTROOM_DYNAMICRANKS,
                    isRetry: false,
                    isDisplay: true
                };
            } else {
                params.tournamentState = tournament.state;
                params.startingChips = tournament.noOfChipsAtGameStart ?? tournament.chips;
                //params.gameVersionCount = tournament.gameVersionCount;
                return params;
            }
        } catch (err) {
            throw {
                success: false,
                channelId: (params.channelId || ""),
                info: this.popupTextManager.GETTOURNAMENTROOM_DYNAMICRANKS,
                isRetry: false,
                isDisplay: true
            };
        }
    }


    // Old
    // let getTournamentRoom = (params, cb) => {
    //     console.log('----in getTournamentRoom params are----', params);
    //     db.getTournamentRoom(params.tournamentId, (err, tournament) => {
    //         console.log('------got tournamentRoom from db err and tournament-------', err, tournament);
    //         if (err || !tournament) {
    //             cb({ success: false, channelId: (params.channelId || ""), info: popupTextManager.GETTOURNAMENTROOM_DYNAMICRANKS, isRetry: false, isDisplay: true });
    //         } else {
    //             params.tournamentState = tournament.state;
    //             params.startingChips = tournament.noOfChipsAtGameStart ?? tournament.chips;
    //             //params.gameVersionCount = tournament.gameVersionCount;
    //             cb(null, params);
    //         }
    //     });
    // }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
// Get TournamentUser and ranks dynamically
/**
 * this function gets tournamentUsers and ranks dynamically in a series of steps
 * @method getRegisteredTournamentUsers
 * @param  {string}                     tournamentId     
 * @param  {string}                     gameVersionCount 
 */
// New
async getRegisteredTournamentUsers(tournamentId: any) {

    let params = {
        tournamentId: tournamentId,
    };

    try {
        // Chain of async operations
        const tournamentRoom = await this.getTournamentRoom(params);
        const registeredUsersParams = await this.getAllRegisteredTournamentUsers(tournamentRoom);
        const userInfoParams = await this.getUserInfo(registeredUsersParams);
        const registeredUserParams = await this.processRegisteredUser(userInfoParams);
        const response = await this.createResponseForTournamentUsers(registeredUserParams);

        let updatedData = {
            ranks: response,
            tournamentId: (params.tournamentId).toString(),
        };

        let query = {
            tournamentId: (params.tournamentId).toString(),
        };

        // Upsert the ranks in IMDB
        const result = await this.imdb.upsertRanks(query, updatedData);

    } catch (err) {
        console.log(stateOfX.serverLogType.info, "Error in calculating getRegisteredTournamentUsers saveRanks", err);
    }
};


// Old
// dynamicRanks.getRegisteredTournamentUsers = (tournamentId) => {
//     console.trace('in dynamicRanks got this', tournamentId)
//     console.log(stateOfX.serverLogType.info, "in getRegisteredTournamentUsers in tournament.js - " + tournamentId);
//     let params = {
//         tournamentId: tournamentId,
//     }
//     async.waterfall([
//         async.apply(getTournamentRoom, params),
//         getAllRegisteredTournamentUsers,
//         getUserInfo,
//         processRegisteredUser,
//         createResponseForTournamentUsers
//     ], (err, response) => {
//         console.log('------got error or response --------', err, response);
//         if (err) {
//             console.log(stateOfX.serverLogType.info, "Error in calculating get getRegisteredTournamentUsersfsaveRanks");
//         } else {
//             console.log(stateOfX.serverLogType.info, "final response in getRegisteredTournamentUsers" + JSON.stringify(response));
//             let updatedData = {
//                 ranks: response,
//                 tournamentId: (params.tournamentId).toString(),
//             }
//             let query = {
//                 tournamentId: (params.tournamentId).toString(),
//             }
//             imdb.upsertRanks(query, updatedData, (err, result) => {
//                 if (err || !result) {
//                     console.log(stateOfX.serverLogType.info, "error in saving ranks in imdb");
//                 } else {
//                     console.log('--------Ranks Successfully Upserted in IMDB-----------', result);
//                     console.log(stateOfX.serverLogType.info, "ranks saved successfully in imdb");
//                 }
//             })
//         }
//     })
// }
    /*============================  END  =================================*/














}