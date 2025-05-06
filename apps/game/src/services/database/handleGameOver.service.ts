import { Injectable } from "@nestjs/common";
import _ from 'underscore';
import { stateOfX, popupTextManager, systemConfig } from "shared/common";
import { ImdbDatabaseService } from "shared/common/datebase/Imdbdatabase.service";
import { PokerDatabaseService } from "shared/common/datebase/pokerdatabase.service";











@Injectable()
export class HandleGameOverService {

    constructor(
        private readonly db: PokerDatabaseService,
        private readonly imdb: ImdbDatabaseService,
    ) { }




    /*============================  START  =================================*/
    // function to getAllChannels 
    // New
    async getAllChannels(params: any): Promise<any> {
        params.tournamentId = params.channelId.replace(/-\d+$/, '');
      
        try {
          const channels = await this.imdb.getAllTableByTournamentId({ tournamentId: params.tournamentId });
      
          if (!channels) {
            throw {
              success: false,
              info: dbMessages.IMDB_GETALLTABLEBYTOURNAMENTID__FAILED_PLAYERSHUFFLING,
              isRetry: false,
              isDisplay: false,
              channelId: "",
            };
          }
      
          params.channels = _.filter(channels, (channel) => channel.players.length > 0);
          return params;
        } catch (err) {
          throw {
            success: false,
            info: dbMessages.IMDB_GETALLTABLEBYTOURNAMENTID__FAILED_PLAYERSHUFFLING,
            isRetry: false,
            isDisplay: false,
            channelId: "",
          };
        }
      }
      

    // Old
    // const getAllChannels = function (params, cb) {
    //     params.tournamentId = params.channelId.replace(/-\d+$/, '');
    //     imdb.getAllTableByTournamentId({ tournamentId: params.tournamentId }, function (err, channels) {
    //         if (err || !channels) {
    //             cb({ success: false, info: dbMessages.IMDB_GETALLTABLEBYTOURNAMENTID__FAILED_PLAYERSHUFFLING, isRetry: false, isDisplay: false, channelId: "" });
    //         } else {
    //             params.channels = _.filter(channels, function (channel) {
    //                 return channel.players.length > 0;
    //             });
    //             cb(null, params);
    //         }
    //     })
    // }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    //this function is to check whether the current time is suitable for break or not according to the breakLevel 
    // New
    async isEligibleForHadInHand(params: any): Promise<any> {
    
        try {
        const res = await this.db.getPrizeRule(params.tournamentId);
    
        const prizeNumber = res?.prize?.length || 0;
        let allPlayingPlayers = 0;
    
        for (const channel of params.channels) {
            allPlayingPlayers += channel.players.length;
            if (channel.breakLevel) {
            params.breakLevel = channel.breakLevel;
            }
        }
    
        if (allPlayingPlayers <= (prizeNumber + systemConfig.bufferHadToHad)) {
            // Eligible for hand-to-hand
            return params;
        } else {
            // Not eligible
            return { success: true, info: "not eligible for hand in hand" };
        }
        } catch (err) {
        console.log("Error fetching prize rule", err);
        return { success: true, info: "prize rule not found" };
        }
    };
    

    // Old
    // const isEligibleForHadInHand = function (params, cb) {
    //     console.log("inside isEligibleForHadInHand", params);
    //     db.getPrizeRule(params.tournamentId, function (err, res) {
    //         console.log("got this prize rule is", err, res);
    //         if (!err && res) {
    //             let prizeNumber = res.prize && res.prize.length ? res.prize.length : 0;
    //             let allPlayingPlayers = 0;
    //             async.eachSeries(params.channels, function (channel, callback) {
    //                 allPlayingPlayers += channel.players.length;
    //                 if (channel.breakLevel) {
    //                     params.breakLevel = channel.breakLevel
    //                 }
    //                 callback();
    //             }, function (err) {
    //                 if (err) {
    //                     console.log("error in players length", err);
    //                     cb(err);
    //                 } else {
    //                     if (allPlayingPlayers <= (prizeNumber + systemConfig.bufferHadToHad)) {
    //                         //eligible for had to had
    //                         cb(null, params);
    //                     } else {
    //                         //no need to stop tables
    //                         cb({ success: true, info: "not eligible for hand in hand" });
    //                     }
    //                 }
    //             })
    //         } else {
    //             // cb(null, params);
    //             cb({ success: true, info: "prize rule not found" });
    //         }
    //     })
    //     //     //update isOnBreak in inMemoryDb
    //     //     imdb.updateSeats(params.channelId, { isOnBreak: true, state: stateOfX.gameState.idle, onBreakTill: Number(new Date()) + (totalSecondsRemaining * 1000) }, function (err, result) {    //set the isOnBreak key to true to ensure that break is started
    //     //         if (err) {
    //     //             cb({ success: false, isRetry: false, isDisplay: false, channelId: (params.channelId || ""), info: popupTextManager.dbQyeryInfo.DB_ERROR_UPDATE_KEY })
    //     //         } else {
    //     //             cb(null, params);
    //     //         }
    //     //     })
    // }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    // function isTimeToStartBreakTimer  
    // New
    async isTimeToStartBreakTimer(params: any): Promise<any> {
        let runningChannels = 0;
        let onBreakChannels = 0;
        params.allChannels = _.pluck(params.channels, "channelId");
    
        for (const channel of params.channels) {
        if (channel.players.length > 1) {
            runningChannels++;
        }
        if (channel.isOnBreak) {
            onBreakChannels++;
        }
        }
    
        // Check if all channels are on break
        if (
        params.eventName === stateOfX.startGameEvent.handAfterBreak ||
        runningChannels + onBreakChannels <= 1
        ) {
        return { success: true, info: "Not eligible for hand in hand" };
        } else if (runningChannels === onBreakChannels + 1) {
        params.shouldStartNow = true;
        params.gameResumeTime = Date.now() + 5000;
        return params;
        } else {
        params.shouldStartNow = false;
        params.isEligibleForHadToHad = true;
        try {
            await this.imdb.updateSeats(params.channelId, {
            isOnBreak: true,
            state: stateOfX.gameState.idle,
            onBreakTill: -1,
            });
            return params;
        } catch (err) {
            return {
            success: false,
            isRetry: false,
            isDisplay: false,
            channelId: params.channelId || "",
            info: popupTextManager.dbQyeryInfo.DB_ERROR_UPDATE_KEY,
            };
        }
        }
    };
    
    // Old
    // const isTimeToStartBreakTimer = function (params, cb) {
    //     let runningChannels = 0;
    //     let onBreakChannels = 0;
    //     params.allChannels = _.pluck(params.channels, "channelId");
    //     for (let channelIt = 0; channelIt < params.channels.length; channelIt++) {
    //         if (params.channels[channelIt].players.length > 1) {
    //             runningChannels++;
    //         }
    //         if (params.channels[channelIt].isOnBreak) {
    //             onBreakChannels++;
    //         }
    //     }
    //     //check if all channels are on break
    //     if ((params.eventName == stateOfX.startGameEvent.handAfterBreak) || (runningChannels + onBreakChannels) <= 1) {
    //         cb({ success: true, info: "Not eligible for hand in hand" });
    //     }
    //     else if (runningChannels == (onBreakChannels + 1)) {
    //         params.shouldStartNow = true;
    //         params.gameResumeTime = Number(new Date()) + 5000;
    //         cb(null, params);
    //     }
    //     else {
    //         params.shouldStartNow = false;
    //         params.isEligibleForHadToHad = true;
    //         imdb.updateSeats(params.channelId, { isOnBreak: true, state: stateOfX.gameState.idle, onBreakTill: -1 }, function (err, result) {    //set the isOnBreak key to true to ensure that break is started
    //             if (err) {
    //                 cb({ success: false, isRetry: false, isDisplay: false, channelId: (params.channelId || ""), info: popupTextManager.dbQyeryInfo.DB_ERROR_UPDATE_KEY })
    //             } else {
    //                 cb(null, params);
    //             }
    //         })
    //     }
    //     // cb(null, params);
    // }
    /*============================  END  =================================*/



    /*============================  START  =================================*/
    //this function updates break timer status and the time at which break timer started
    // New
    async updateBreakTimer(params: any): Promise<any> {
        try {
        await this.imdb.updateAllTable(
            { 'tournamentRules.tournamentId': params.tournamentId.toString() },
            {
            isBreakTimerStart: true,
            breakEndsAt: params.gameResumeTime,
            timerStarted: Date.now(),
            }
        );
        return params;
        } catch (err) {
        return { success: false, info: 'Error in updating break timer in db' };
        }
    };
    

    // Old
    // const updateBreakTimer = function (params, cb) {
    //     imdb.updateAllTable({ 'tournamentRules.tournamentId': params.tournamentId.toString() }, { isBreakTimerStart: true, breakEndsAt: params.gameResumeTime, timerStarted: Number(new Date()) }, function (err, tables) {
    //         if (!err) {
    //             cb(null, params);
    //         } else {
    //             cb({ success: false, info: "Error in updating break timer in db" })
    //         }
    //     })
    // }
    /*============================  END  =================================*/



    /*============================  START  =================================*/
    // function to process all the async functions written above 
    // new
    async process(params: any): Promise<any> {
        try {

        // Sequentially execute the functions
        await this.getAllChannels(params);
        await this.isEligibleForHadInHand(params);
        await this.isTimeToStartBreakTimer(params);
        await this.updateBreakTimer(params);

        // If all functions succeed, return success
        return { ...params, success: true };
        } catch (err) {
        // If any function throws an error, return the error
        console.log("errr in handInHandManagement", err);
        return err;
        }
    }
    

    // Old
    // handInHandManagement.process = function (params, cb) {
    //     console.trace("inside handInHandManagement.process", params)
    //     async.waterfall([
    //         async.apply(getAllChannels, params),
    //         isEligibleForHadInHand,
    //         isTimeToStartBreakTimer,
    //         updateBreakTimer
    //     ], function (err, result) {
    //         console.log("errr & result in handInHandManagement", err, result)
    //         if (err) {
    //             cb(err);
    //         } else {
    //             result.success = true;
    //             cb(result);
    //         }
    //     })
    // }
    /*============================  END  =================================*/











}