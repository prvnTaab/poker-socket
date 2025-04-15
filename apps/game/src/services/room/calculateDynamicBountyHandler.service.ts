import { Injectable } from "@nestjs/common";
import _ from "underscore";
import { PokerDatabaseService } from "shared/common/datebase/pokerdatabase.service";











@Injectable()
export class CalculateDynamicBountyHandlerService {

    constructor(
        private db: PokerDatabaseService,
    ) {}







    /*====================================  START  ============================*/

    // New
    async getTournamentUsers(params: any): Promise<any> {
      
        try {
          const tournamentUsers = await this.db.findTournamentUser({
            tournamentId: params.tournamentId,
            status: 'Registered',
          });
      
          if (tournamentUsers && tournamentUsers.length > 0) {
            console.log("the tournament users in calculate dynamic bounty are", tournamentUsers);
            params.tournamentUsers = tournamentUsers;
            return params;
          } else {
            console.log("No tournament user found for the given tournament id");
            return { maxBounty: 0, minBounty: 0, averageBounty: 0 };
          }
        } catch (err) {
          console.error("Error in getTournamentUsers:", err);
          return { maxBounty: 0, minBounty: 0, averageBounty: 0 };
        }
      };
      

    // Old
    // const getTournamentUsers = function (params, cb) {
    //     console.log("Inside getTournamentUsers the params is ", params);
    //     db.findTournamentUser({ tournamentId: params.tournamentId, status: 'Registered' }, function (err, tournamentUsers) {
    //       if (!err && tournamentUsers && tournamentUsers.length > 0) {
    //         console.log("the tournament users in calculate dynamic bounty are", tournamentUsers);
    //         params.tournamentUsers = tournamentUsers;
    //         cb(null, params);
    //       }
    //       else {
    //         console.log("No tournament user found for the given tournament id"); //if there are no tournament user return max,min and average bounty as 0
    //         cb({ maxBounty: 0, minBounty: 0, averageBounty: 0 });
    //       }
    //     })
    //   }
    /*====================================  END  ============================*/
      
    /*====================================  START  ============================*/

    // New
    async pluckPlayers(params: any): Promise<any> {
        params.playerIds = _.pluck(params.tournamentUsers, "playerId"); // extract playerIds from tournamentUsers
        return params;
      };
      

    // Old
    //   const pluckPlayers = function (params, cb) {
    //     console.log("before plucking the params is ", JSON.stringify(params));
    //     params.playerIds = _.pluck(params.tournamentUsers, "playerId");     //extract playerIds from tournamentUsers
    //     console.log("After plucking the params is", JSON.stringify(params));
    //     cb(null, params);
      
      
    //   }
    /*====================================  END  ============================*/


    /*====================================  START  ============================*/

    // New
    async filterPlayersFromBounty(params: any): Promise<any> {
        const findPlayerFromBountyResponse = await this.db.findPlayerFromBounty(params.playerIds);
      
        if (findPlayerFromBountyResponse) {
          params.filterPlayers = findPlayerFromBountyResponse;
          return params;
        } else {
          return params;
        }
      };
      

    // Old
    //   const filterPlayersFromBounty = function (params, cb) {
    //     db.findPlayerFromBounty(params.playerIds, function (err, findPlayerFromBountyResponse) {
    //       if (!err && findPlayerFromBountyResponse) {
    //         console.log("the findPlayerFromBountyResponse is", JSON.stringify(findPlayerFromBountyResponse));
    //         params.filterPlayers = findPlayerFromBountyResponse;
    //         cb(null, params);
    //       }
    //       else {
    //         console.log("Some error in finding data from findPlayerFromBounty");
    //         cb(params);
    //       }
    //     })
      
    //   }
    /*====================================  END  ============================*/


    /*====================================  START  ============================*/

    // New
    async getActivePlayers(params: any): Promise<any> {
        const getActivePlayers = _.where(params.filterPlayers, {
          gameVersionCount: params.gameVersionCount,
          tournamentId: params.tournamentId
        });
      
      
        if (getActivePlayers.length > 0) {
          let maxBounty = getActivePlayers[0].bounty;
          let minBounty = getActivePlayers[0].bounty;
          let sum = getActivePlayers[0].bounty;
      
          for (let i = 1; i < getActivePlayers.length; i++) {
            const bounty = getActivePlayers[i].bounty;
            if (bounty > maxBounty) {
              maxBounty = bounty;
            }
            if (bounty < minBounty) {
              minBounty = bounty;
            }
            sum += bounty;
          }
      
          const averageBounty = Math.round(sum / getActivePlayers.length);
            
          return { maxBounty, minBounty, averageBounty };
        } else {
          return { maxBounty: 0, minBounty: 0, averageBounty: 0 };
        }
      };
      

    // Old
    //   const getActivePlayers = function (params, cb) {
    //     let getActivePlayers = _.where(params.filterPlayers, { gameVersionCount: params.gameVersionCount, tournamentId: params.tournamentId });
    //     console.log(JSON.stringify(getActivePlayers));
    //     if (getActivePlayers.length > 0) {
    //       let maxBounty = getActivePlayers[0].bounty;
    //       let minBounty = getActivePlayers[0].bounty;
    //       let averageBounty = 0;
    //       let sum = getActivePlayers[0].bounty;
    //       let numberOfActivePlayers = getActivePlayers.length;
    //       for (let i = 1; i < getActivePlayers.length; i++) {
    //         if (getActivePlayers[i].bounty > maxBounty) {
    //           maxBounty = getActivePlayers[i].bounty;
    //         }
    //         if (getActivePlayers[i].bounty < minBounty) {
    //           minBounty = getActivePlayers[i].bounty;
    //         }
    //         sum = sum + getActivePlayers[i].bounty;
    //       }
    //       averageBounty = Math.round(sum / numberOfActivePlayers);
    //       console.log("maxBounty-- ", maxBounty);
    //       console.log("minBounty-- ", minBounty);
    //       console.log("averageBounty--", averageBounty);
    //       cb(null, { maxBounty: maxBounty, minBounty: minBounty, averageBounty: averageBounty });
    //     }
    //     else {
    //       cb({ maxBounty: 0, minBounty: 0, averageBounty: 0 });
      
    //     }
    //   }
    /*====================================  END  ============================*/
      

    /*====================================  START  ============================*/

    // New
    async calculateDynamicBounty(params: any): Promise<any> {
      
        try {
          let result = await this.getTournamentUsers(params);
          result = await this.pluckPlayers(result);
          result = await this.filterPlayersFromBounty(result);
          const bountyStats = await this.getActivePlayers(result);
      
          bountyStats.success = true;
          return bountyStats;
        } catch (err) {
          console.error("Error in calculateDynamicBounty:", err);
          throw err;
        }
      };
      

    // Old
    //   calculateDynamicBountyHandler.calculateDynamicBounty = function (params, cb) {
    //     console.log("params is in breakManagement process - " + JSON.stringify(params));
    //     console.log("Inside calculateDynamicBounty handler ---------", JSON.stringify(params));
    //     async.waterfall([
    //       async.apply(getTournamentUsers, params),
    //       pluckPlayers,
    //       filterPlayersFromBounty,
    //       getActivePlayers
    //     ], function (err, result) {
    //       if (err) {
    //         cb(err);
    //       } else {
    //         result.success = true;
    //         console.log("the final result is ", JSON.stringify(result));
    //         cb(result);
    //       }
    //     })
    //   }
    /*====================================  END  ============================*/









}