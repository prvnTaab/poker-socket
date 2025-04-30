import { Injectable } from "@nestjs/common";
import _ from "underscore";
import { stateOfX, popupTextManager } from 'shared/common';
import { PokerDatabaseService } from "shared/common/datebase/pokerdatabase.service";
import { ImdbDatabaseService } from "shared/common/datebase/Imdbdatabase.service";









@Injectable()
export class AddonManagementService {

    constructor(
        private db: PokerDatabaseService,
        private imdb: ImdbDatabaseService,
    ) { }




    /*===============================  START  ===========================*/
    //function to fetch channel from imdb
    // New
    async getChannel(params: any): Promise<any> {
        try {
            const channel = await this.imdb.getTable(params.channelId);

            // break is only allowed in normal tournaments
            params.breakLevel = channel.breakLevel;

            if (
                channel.channelType === stateOfX.gameType.tournament &&
                channel.tournamentType === stateOfX.tournamentType.normal
            ) {
                params.channelDetails = channel;
                return params;
            } else {
                console.log(stateOfX.serverLogType.info, "this is not a normal tournament");
                return { success: true, eligibleForAddon: false };
            }
        } catch (err) {
            return {
                success: false,
                isRetry: false,
                isDisplay: false,
                channelId: params.channelId || "",
                info: popupTextManager.dbQyeryInfo.DB_ERROR_GETTING_CHANNEL_MEMORYDB,
            };
        }
    };


    // Old
    // const getChannel = function (params, cb) {
    //     imdb.getTable(params.channelId, function (err, channel) {
    //         if (err) {
    //             cb({ success: false, isRetry: false, isDisplay: false, channelId: (params.channelId || ""), info: popupTextManager.dbQyeryInfo.DB_ERROR_GETTING_CHANNEL_MEMORYDB })
    //         } else {
    //             //break is only allowed in normal tournaments
    //             params.breakLevel = channel.breakLevel;
    //             if (channel.channelType === stateOfX.gameType.tournament && channel.tournamentType === stateOfX.tournamentType.normal) {
    //                 params.channelDetails = channel;
    //                 cb(null, params);
    //             } else {
    //                 console.log(stateOfX.serverLogType.info, "this is not a normal tournament");
    //                 cb({ success: true, eligibleForAddon: false });
    //             }
    //         }
    //     })
    // }
    /*===============================  END  ===========================*/



    /*===============================  START  ===========================*/
    //function to fetch channel from imdb
    // New
    async getRoom(params: any): Promise<any> {

        try {
            const rooms = await this.db.findTournamentRoom({
                tournamentId: params.channelDetails.tournamentRules.tournamentId,
            });


            params.room = rooms[0];
            return params;

        } catch (err) {
            return {
                success: false,
                isRetry: false,
                isDisplay: false,
                channelId: params.channelId || "",
                info: popupTextManager.dbQyeryInfo.DB_ERROR_GETTING_CHANNEL_MEMORYDB,
            };
        }
    };


    // Old
    // const getRoom = function (params, cb) {
    //     console.log("params.channelDetails", params.channelDetails)
    //     db.findTournamentRoom({ tournamentId: params.channelDetails.tournamentRules.tournamentId }, function (err, rooms) {
    //         console.log("inside db.findTournamentRoom--------------", err, rooms)
    //         if (err) {
    //             cb({ success: false, isRetry: false, isDisplay: false, channelId: (params.channelId || ""), info: popupTextManager.dbQyeryInfo.DB_ERROR_GETTING_CHANNEL_MEMORYDB })
    //         } else {
    //             params.room = rooms[0];
    //             cb(null, params);
    //         }
    //     })
    // }
    /*===============================  END  ===========================*/


    /*===============================  START  ===========================*/
    //function to fetch check if a tour is isEligibleForAddOn
    // New
    async isEligibleForAddOn(params: any): Promise<any> {

        try {
            const processed = await this.processAddon(params);
            const result = await this.updateRebuyAndsendBroadcastForAddOn(processed);
            return result;
        } catch (err) {
            console.log(
                stateOfX.serverLogType.info,
                "err in addOnProcess in tournament schedular " + JSON.stringify(err)
            );
            throw err;
        }
    };


    // Old
    // const isEligibleForAddOn = function (params, cb) {
    //     console.log(stateOfX.serverLogType.info, "in addOnProcess in tournament schedular " + params.room);
    //     async.waterfall([
    //         async.apply(processAddon, params),
    //         updateRebuyAndsendBroadcastForAddOn
    //     ], function (err, result) {
    //         if (!err && result) {
    //             cb(null, result)
    //         }
    //         else {
    //             console.log(stateOfX.serverLogType.info, "err in addOnProcess in tournament schedular " + JSON.stringify(err));
    //             cb(err)
    //         }
    //     })
    // }
    /*===============================  END  ===========================*/


    /*===============================  START  ===========================*/
    //function to fetch check if a isAddOnAllowed & if its right time for addOn
    // New
    async processAddon(params: any): Promise<any> {

        if (params.room.isAddOnAllow && params.room.addOnTime && params.room.addOnTime.length > 0) {
            try {
                const result = await this.db.findBlindRule(params.room.tournamentId);

                if (result) {
                    params.blindRuleResult = result.blinds;
                    return params;
                } else {
                    return {
                        success: false,
                        isRetry: false,
                        isDisplay: false,
                        channelId: "",
                        info: popupTextManager.dbQyeryInfo.DBLASTBLINDRULE_GETBLINDANDPRIZE_TOURNAMENT,
                    };
                }
            } catch (err) {
                return {
                    success: false,
                    isRetry: false,
                    isDisplay: false,
                    channelId: "",
                    info: popupTextManager.dbQyeryInfo.DBLASTBLINDRULE_GETBLINDANDPRIZE_TOURNAMENT,
                };
            }
        } else {
            return {
                success: true,
                eligibleForAddon: false,
            };
        }
    };


    // Old
    // const processAddon = function (params, cb) {
    //     console.log(stateOfX.serverLogType.info, "in processAddon in addOnProcess ", params);
    //     if (params.room.isAddOnAllow && params.room.addOnTime && params.room.addOnTime.length > 0) {
    //         db.findBlindRule(params.room.tournamentId, function (err, result) {
    //             if (!err && result) {
    //                 params.blindRuleResult = result.blinds;
    //                 cb(null, params);
    //             }
    //             else {
    //                 cb({ success: false, isRetry: false, isDisplay: false, channelId: "", info: popupTextManager.dbQyeryInfo.DBLASTBLINDRULE_GETBLINDANDPRIZE_TOURNAMENT });
    //             }
    //         })
    //     } else {
    //         cb({ success: true, eligibleForAddon: false });
    //     }
    // }
    /*===============================  END  ===========================*/


    /*===============================  START  ===========================*/
    // New
    async updateRebuyAndsendBroadcastForAddOn(params: any): Promise<any> {
        let addonTimeExist = _.where(params.room.addOnTime, { level: params.channelDetails.blindLevel });

        if (!!addonTimeExist && !!addonTimeExist[0] && !!addonTimeExist[0].level) {
            addonTimeExist = addonTimeExist[0];

            const blindLevelIndex = addonTimeExist.level - 1;
            const levelMultiplier = addonTimeExist.level > 1 ? blindLevelIndex : 0;
            const blindDuration = params.blindRuleResult[blindLevelIndex]?.duration || 2;

            const timeToStart = params.room.tournamentStartTime + blindDuration * levelMultiplier * 60000;


            const timeToEnd = timeToStart + (addonTimeExist.duration || 2) * 60000;
            const currentTime = Number(new Date());

            if (currentTime >= timeToStart && currentTime < timeToEnd) {
                try {
                    await this.imdb.updateSeats(params.channelId, {
                        isOnBreak: true,
                        isAddOnLive: true,
                        state: stateOfX.gameState.idle,
                        onBreakTill: timeToEnd,
                    });

                    this.broadcastForAddon(params, "ADDONSTART");

                    params.gameResumeTime = timeToEnd;
                    params.eligibleForAddon = true;
                    params.breakDuration = Math.floor((timeToEnd - currentTime) / 1000);
                    params.AddOnData = {
                        amount: params.room.entryFees + params.room.houseFees,
                        chips: params.room.addOnChips,
                        duration: timeToEnd,
                    };
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

            return params;
        } else {
            return {
                success: true,
                eligibleForAddon: false,
            };
        }
    };


    // Old
    // const updateRebuyAndsendBroadcastForAddOn = function (params, cb) {
    //     // console.log("params.blindLevel", params);
    //     let addonTimeExist = _.where(params.room.addOnTime, { level: params.channelDetails.blindLevel });
    //     console.log("addonTimeExist", addonTimeExist);
    //     if (!!addonTimeExist && !!addonTimeExist[0] && !!addonTimeExist[0].level) {
    //         addonTimeExist = addonTimeExist[0];
    //         let timeToStart = params.room.tournamentStartTime + (addonTimeExist.duration && addonTimeExist.level ? params.blindRuleResult[addonTimeExist.level - 1].duration * (addonTimeExist.level > 1 ? addonTimeExist.level - 1 : 0) : 2) * 60000;
    //         console.log("all dates >", params.room.tournamentStartTime, addonTimeExist.duration, params.blindRuleResult[addonTimeExist.level - 1].duration, addonTimeExist.duration)
    //         const timeToEnd = timeToStart + (addonTimeExist.duration ? addonTimeExist.duration : 2) * 60000;
    //         const currentTime = Number(new Date());
    //         if (currentTime >= timeToStart && currentTime < timeToEnd) {
    //             imdb.updateSeats(params.channelId, { isOnBreak: true, isAddOnLive: true, state: stateOfX.gameState.idle, onBreakTill: timeToEnd }, function (err, result) {    //set the isOnBreak key to true to ensure that break is started
    //                 if (err) {
    //                     cb({ success: false, isRetry: false, isDisplay: false, channelId: (params.channelId || ""), info: popupTextManager.dbQyeryInfo.DB_ERROR_UPDATE_KEY })
    //                 } else {
    //                     cb(null, params);
    //                 }
    //             })

    //             broadcastForAddon(params, "ADDONSTART");
    //             params.gameResumeTime = timeToEnd;
    //             params.eligibleForAddon = true;
    //             params.breakDuration = Math.floor((timeToEnd - currentTime) / 1000);
    //             params.AddOnData = {
    //                 amount: params.room.entryFees + params.room.houseFees,
    //                 chips: params.room.addOnChips,
    //                 duration: timeToEnd
    //             }
    //         }
    //         cb(null, params);
    //     } else {
    //         cb({ success: true, eligibleForAddon: false });
    //     }
    // }
    /*===============================  END  ===========================*/



    /*===============================  START  ===========================*/
    // New
    async broadcastForAddon(params: any, callerFunction: string): Promise<void> {
      
        try {
          const channels = await this.imdb.getAllTableByTournamentId({ tournamentId: params.room.tournamentId });
      
          for (const channel of channels) {
            if (callerFunction === "ADDONEND") {
              await this.updateAddonEligibility({ tournamentId: params.room.tournamentId }, { isEligibleForAddon: false });
            } else {
              await this.updateAddonEligibility({ tournamentId: params.room.tournamentId }, { isEligibleForAddon: true });
            }
          }
      
          console.log(stateOfX.serverLogType.info, 'Successfully send addOn status broadcast');
        } catch (err) {
          console.log(stateOfX.serverLogType.info, 'Error in sending addOn status broadcast');
        }
      };
      

    // Old
    // const broadcastForAddon = function (params, callerFunction) {
    //     console.log(stateOfX.serverLogType.info, 'tournamentroom is - ' + JSON.stringify(params.room));
    //     imdb.getAllTableByTournamentId({ tournamentId: params.room.tournamentId }, function (err, channels) {
    //         if (err) {
    //         } else {
    //             async.each(channels, function (channel, callback) {
    //                 if (callerFunction == "ADDONEND") {
    //                     updateAddonEligibility({ tournamentId: params.room.tournamentId }, { isEligibleForAddon: false });
    //                 }
    //                 else {
    //                     updateAddonEligibility({ tournamentId: params.room.tournamentId, }, { isEligibleForAddon: true });
    //                 }
    //                 callback();
    //             }, function (err) {
    //                 if (err) {
    //                     console.log(stateOfX.serverLogType.info, 'Error in sending addOn status broadcast');
    //                 } else {
    //                     console.log(stateOfX.serverLogType.info, 'Successfully send addOn status broadcast');
    //                 }
    //             })
    //         }
    //     })
    // }
    /*===============================  END  ===========================*/



    /*===============================  START  ===========================*/
    // New
    async updateAddonEligibility(filter: any, updateData: any): Promise<any> {
        try {
          const result = await this.db.updateRebuyWithoutInsert(filter, updateData);
          if (result) {
            console.log(stateOfX.serverLogType.info, 'success in sending addOn status broadcast');
          } else {
            console.log(stateOfX.serverLogType.info, 'Error in sending addOn status broadcast');
          }
        } catch (err) {
          console.log(stateOfX.serverLogType.info, 'Error in sending addOn status broadcast');
        }
      };
      

    // Old
    // const updateAddonEligibility = function (filter, updateData) {
    //     db.updateRebuyWithoutInsert(filter, updateData, function (err, result) {
    //         if (!err && result) {
    //             console.log(stateOfX.serverLogType.info, 'success in sending addOn status broadcast');
    //         }
    //         else {
    //             console.log(stateOfX.serverLogType.info, 'Error in sending addOn status broadcast');
    //         }
    //     })
    // }
    /*===============================  END  ===========================*/



    /*===============================  START  ===========================*/
    // function to check if its right time to Start Break Timer
    // New
    async isTimeToStartBreakTimer(params: any): Promise<any> {
        if (params.eligibleForAddon) {
          try {
            const channels = await this.imdb.getAllTableByTournamentId({
              tournamentId: params.channelDetails.tournamentRules.tournamentId,
            });
      
            let runningChannels = 0;
            let onBreakChannels = 0;
            params.allChannels = _.pluck(channels, "channelId");
      
            for (let channelIt = 0; channelIt < channels.length; channelIt++) {
              if (channels[channelIt].players.length > 0) {
                runningChannels++;
              }
              if (channels[channelIt].isOnBreak) {
                onBreakChannels++;
              }
            }
      
            params.isTimeToStartBreakTimer = runningChannels === onBreakChannels;
            return params;
          } catch (err) {
            throw {
              success: false,
              isRetry: false,
              isDisplay: false,
              channelId: '',
              info: popupTextManager.dbQyeryInfo.DB_ERROR_GETTING_CHANNEL_MEMORY,
            };
          }
        } else {
          return {
            success: true,
            eligibleForAddon: false,
          };
        }
      };
      

    // Old
    // const isTimeToStartBreakTimer = function (params, cb) {
    //     if (params.eligibleForAddon) {
    //         imdb.getAllTableByTournamentId({ tournamentId: params.channelDetails.tournamentRules.tournamentId, }, function (err, channels) {
    //             if (err) {
    //                 cb({ success: false, isRetry: false, isDisplay: false, channelId: '', info: popupTextManager.dbQyeryInfo.DB_ERROR_GETTING_CHANNEL_MEMORY });
    //             } else {
    //                 let runningChannels = 0;
    //                 let onBreakChannels = 0;
    //                 params.allChannels = _.pluck(channels, "channelId");
    //                 for (let channelIt = 0; channelIt < channels.length; channelIt++) {
    //                     if (channels[channelIt].players.length > 0) {
    //                         runningChannels++;
    //                     }
    //                     if (channels[channelIt].isOnBreak) {
    //                         onBreakChannels++;
    //                     }
    //                 }
    //                 if (runningChannels === onBreakChannels) {
    //                     params.isTimeToStartBreakTimer = true;
    //                 } else {
    //                     params.isTimeToStartBreakTimer = false;
    //                 }
    //                 cb(null, params);
    //             }
    //         })
    //     } else {
    //         cb({ success: true, eligibleForAddon: false })
    //     }
    // }
    /*===============================  END  ===========================*/


    /*===============================  START  ===========================*/
    // function to update Break Timer in imdb
    // New
    async updateBreakTimer(params: any): Promise<any> {
        try {
          await this.imdb.updateAllTable(
            { 'tournamentRules.tournamentId': params.channelDetails.tournamentRules.tournamentId.toString() },
            {
              isBreakTimerStart: true,
              breakEndsAt: params.gameResumeTime,
              timerStarted: Number(new Date())
            }
          );
          return params;
        } catch (err) {
          throw {
            success: false,
            info: "Error in updating break timer in db"
          };
        }
      };
      

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
    /*===============================  END  ===========================*/



    /*===============================  START  ===========================*/
  //function to process all the async functions written above 
//   New
async process(params: any): Promise<any> {
    try {
      let result = await this.getChannel(params);
      result = await this.getRoom(result);
      result = await this.isEligibleForAddOn(result);
      result = await this.isTimeToStartBreakTimer(result);
      result = await this.updateBreakTimer(result);
  
      result.success = true;
      return result;
    } catch (err) {
      console.log("err in addOn", err);
      throw err;
    }
  };
  

//   Old
//   addonManagement.process = function (params, cb) {
//         async.waterfall([
//             async.apply(getChannel, params),
//             getRoom,
//             isEligibleForAddOn,
//             isTimeToStartBreakTimer,
//             updateBreakTimer
//         ], function (err, result) {
//             console.log("errr & result in addOn", err, result)
//             if (err) {
//                 cb(err);
//             } else {
//                 result.success = true;
//                 cb(result);
//             }
//         })
//     }
    /*===============================  END  ===========================*/














}