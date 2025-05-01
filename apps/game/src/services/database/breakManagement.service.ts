import { Injectable } from "@nestjs/common";
import _ld from "lodash";
import _ from 'underscore';
import { stateOfX, popupTextManager, systemConfig } from "shared/common";
import { ImdbDatabaseService } from "shared/common/datebase/Imdbdatabase.service";











@Injectable()
export class BreakManagementService {

    constructor(
        private readonly imdb: ImdbDatabaseService,
    ) { }







    /*============================  START  =================================*/
    /**
     * function to getChannel 
     *
     * @method getChannel
     * @param  {Object}       params  request json object
     * @param  {Function}     cb      callback function
     * @return {Object}               params/validated object
     */
    // New
    async getChannel(params: any): Promise<any> {
        try {
            // Await the result of the getTable function
            const channel: any = await this.imdb.getTable(params.channelId);

            if (!channel) {
                return {
                    success: false,
                    isRetry: false,
                    isDisplay: false,
                    channelId: params.channelId,
                    info: popupTextManager.dbQyeryInfo.DB_ERROR_GETTING_CHANNEL_MEMORYDB
                };
            }

            // Proceed if the channel exists and is a normal tournament
            params.breakLevel = channel.breakLevel;

            if (channel.channelType === stateOfX.gameType.tournament && channel.tournamentType === stateOfX.tournamentType.normal) {
                params.channelDetails = channel;
                return { success: true, params };
            } else {
                console.log(stateOfX.serverLogType.info, "this is not a normal tournament");
                return { success: true, eligibleForBreak: false };
            }
        } catch (err) {
            return {
                success: false,
                isRetry: false,
                isDisplay: false,
                channelId: params.channelId,
                info: popupTextManager.dbQyeryInfo.DB_ERROR_GETTING_CHANNEL_MEMORYDB
            };
        }
    }

    //Old
    // const getChannel = function (params, cb) {
    //     imdb.getTable(params.channelId, function (err, channel) {
    //       if (err || !channel) {
    //         cb({ success: false, isRetry: false, isDisplay: false, channelId: (params.channelId || ""), info: popupTextManager.dbQyeryInfo.DB_ERROR_GETTING_CHANNEL_MEMORYDB })
    //       } else {
    //         params.breakLevel = channel.breakLevel;
    //         if (channel.channelType === stateOfX.gameType.tournament && channel.tournamentType === stateOfX.tournamentType.normal) {
    //           params.channelDetails = channel;
    //           cb(null, params);
    //         } else {
    //           console.log(stateOfX.serverLogType.info, "this is not a normal tournament");
    //           cb({ success: true, eligibleForBreak: false });
    //         }
    //       }
    //     })
    //   }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    /**
     * this function is to check whether the current time is suitable for break or not according to the breakLevel 
     *
     * @method isEligibleForBreak
     * @param  {Object}       params  request json object
     * @param  {Function}     cb      callback function
     * @return {Object}               params/validated object
     */
    //   New
    async isEligibleForBreak(params: any): Promise<any> {
        try {
            // Get the current time
            const currentTime = new Date();

            // Calculate the time until the next tournament break
            const minutes = currentTime.getMinutes();
            const seconds = currentTime.getSeconds();

            // Calculate the remaining time until the next break
            const minutesRemaining = 60 - (minutes % 60);
            const secondsRemaining = 60 - seconds;

            // Calculate the total remaining time in seconds
            let totalSecondsRemaining = minutesRemaining * 60 + secondsRemaining;
            totalSecondsRemaining -= 60; //do not remove this logic it was added as timer was starting 60sec late

            if (totalSecondsRemaining <= (systemConfig.breakDurationInMins * 60)) {
                console.log(`*********** its break time ***********`);
                params.breakDuration = totalSecondsRemaining;
                params.eligibleForBreak = true;

                // Update isOnBreak in inMemoryDb
                await this.imdb.updateSeats(params.channelId, {
                    isOnBreak: true,
                    state: stateOfX.gameState.idle,
                    onBreakTill: Number(new Date()) + (totalSecondsRemaining * 1000)
                });

                return { success: true, params };
            } else {
                console.log(`*********** its not break time ***********`);
                return { success: true, eligibleForBreak: false };
            }
        } catch (err) {
            return {
                success: false,
                isRetry: false,
                isDisplay: false,
                channelId: params.channelId,
                info: popupTextManager.dbQyeryInfo.DB_ERROR_UPDATE_KEY
            };
        }
    }

    //   Old
    //   const isEligibleForBreak = function (params, cb) {
    //     // Get the current time
    //     const currentTime = new Date();

    //     // Calculate the time until the next tournament break
    //     const minutes = currentTime.getMinutes();
    //     const seconds = currentTime.getSeconds();

    //     // Calculate the remaining time until the next break
    //     const minutesRemaining = 60 - (minutes % 60);
    //     const secondsRemaining = 60 - seconds;

    //     // Calculate the total remaining time in seconds
    //     let totalSecondsRemaining = minutesRemaining * 60 + secondsRemaining;
    //     totalSecondsRemaining -= 60; //do not remove this logic it was added as timer was starting 60sec late
    //     if (totalSecondsRemaining <= (systemConfig.breakDurationInMins * 60)) {
    //       console.log(`*********** its break time ***********`);
    //       params.breakDuration = totalSecondsRemaining;
    //       params.eligibleForBreak = true;
    //       //update isOnBreak in inMemoryDb
    //       imdb.updateSeats(params.channelId, { isOnBreak: true, state: stateOfX.gameState.idle, onBreakTill: Number(new Date()) + (totalSecondsRemaining * 1000) }, function (err, result) {    //set the isOnBreak key to true to ensure that break is started
    //         if (err) {
    //           cb({ success: false, isRetry: false, isDisplay: false, channelId: (params.channelId || ""), info: popupTextManager.dbQyeryInfo.DB_ERROR_UPDATE_KEY })
    //         } else {
    //           cb(null, params);
    //         }
    //       })
    //     } else {
    //       console.log(`*********** its not break time ***********`);
    //       cb({ success: true, eligibleForBreak: false })
    //     }
    //   }
    /*============================  END  =================================*/



    /*============================  START  =================================*/
    /**
     * function isTimeToStartBreakTimer  
     *
     * @method isTimeToStartBreakTimer
     * @param  {Object}       params  request json object
     * @param  {Function}     cb      callback function
     * @return {Object}               params/validated object
     */
    // New
    async isTimeToStartBreakTimer(params: any): Promise<any> {
        try {
            const channels = await this.imdb.getAllTableByTournamentId({ tournamentId: params.channelDetails.tournamentRules.tournamentId });

            let runningChannels = 0;
            let onBreakChannels = 0;
            params.allChannels = channels.map(channel => channel.channelId);

            for (let channelIt = 0; channelIt < channels.length; channelIt++) {
                if (channels[channelIt].players.length > 0) {
                    runningChannels++;
                }
                if (channels[channelIt].isOnBreak) {
                    onBreakChannels++;
                }
            }

            if (runningChannels === onBreakChannels) {
                params.isTimeToStartBreakTimer = true;
                params.gameResumeTime = Number(new Date()) + (params.breakDuration! * 1000);
            } else {
                params.isTimeToStartBreakTimer = false;
            }

            return params;
        } catch (err) {
            return {
                success: false,
                isRetry: false,
                isDisplay: false,
                channelId: '',
                info: popupTextManager.dbQyeryInfo.DB_ERROR_GETTING_CHANNEL_MEMORY,
            };
        }
    }

    // Old
    // const isTimeToStartBreakTimer = function (params, cb) {
    //     imdb.getAllTableByTournamentId({ tournamentId: params.channelDetails.tournamentRules.tournamentId }, function (err, channels) {
    //         if (err) {
    //             cb({ success: false, isRetry: false, isDisplay: false, channelId: '', info: popupTextManager.dbQyeryInfo.DB_ERROR_GETTING_CHANNEL_MEMORY });
    //         } else {
    //             let runningChannels = 0;
    //             let onBreakChannels = 0;
    //             params.allChannels = _.pluck(channels, "channelId");
    //             for (let channelIt = 0; channelIt < channels.length; channelIt++) {
    //                 if (channels[channelIt].players.length > 0) {
    //                     runningChannels++;
    //                 }
    //                 if (channels[channelIt].isOnBreak) {
    //                     onBreakChannels++;
    //                 }
    //             }
    //             if (runningChannels === onBreakChannels) {
    //                 params.isTimeToStartBreakTimer = true;
    //                 params.gameResumeTime = Number(new Date()) + (params.breakDuration * 1000);
    //             } else {
    //                 params.isTimeToStartBreakTimer = false;
    //             }
    //             cb(null, params);
    //         }
    //     })
    // }
    /*============================  END  =================================*/



    /*============================  START  =================================*/
    /**
     * this function updates break timer status and the time at which break timer started
     *
     * @method updateBreakTimer
     * @param  {Object}       params  request json object
     * @param  {Function}     cb      callback function
     * @return {Object}               params/validated object
     */
    // New
    async updateBreakTimer(params: any): Promise<any> {
        try {
            await this.imdb.updateAllTable(
                { 'tournamentRules.tournamentId': params.channelDetails.tournamentRules.tournamentId.toString() },
                { isBreakTimerStart: true, breakEndsAt: params.gameResumeTime, timerStarted: Number(new Date()) }
            );

            return params;
        } catch (err) {
            return { success: false, info: "Error in updating break timer in db" };
        }
    }

    // Old
    // const updateBreakTimer = function (params, cb) {
    //     imdb.updateAllTable({ 'tournamentRules.tournamentId': params.channelDetails.tournamentRules.tournamentId.toString() }, { isBreakTimerStart: true, breakEndsAt: params.gameResumeTime, timerStarted: Number(new Date()) }, function (err, tables) {
    //         if (!err) {
    //             cb(null, params);
    //         } else {
    //             cb({ success: false, info: "Error in updating break timer in db" })
    //         }
    //     })
    // }
    /*============================  END  =================================*/





    /*============================  START  =================================*/
    /**
     * function to process all the async functions written above 
     *
     * @method process
     * @param  {Object}       params  request json object
     * @param  {Function}     cb      callback function
     * @return {Object}               params/validated object
     */
    //   New
    async process(params: any): Promise<any> {
        try {
            // Get channel details
            await this.getChannel(params);

            // Check if eligible for break
            await this.isEligibleForBreak(params);

            // Check if it's time to start break timer
            await this.isTimeToStartBreakTimer(params);

            // Update break timer
            const result = await this.updateBreakTimer(params);

            result.success = true;
            return result;

        } catch (err) {
            console.log("Error in break management process:", err);
            return { success: false, error: err };
        }
    };


    //   Old
    //   breakManagement.process = function (params, cb) {
    //         async.waterfall([
    //             async.apply(getChannel, params),
    //             isEligibleForBreak,
    //             isTimeToStartBreakTimer,
    //             updateBreakTimer
    //         ], function (err, result) {
    //             console.log("errr & result in break", err, result)
    //             if (err) {
    //                 cb(err);
    //             } else {
    //                 result.success = true;
    //                 cb(result);
    //             }
    //         })
    //     }
    /*============================  END  =================================*/











}