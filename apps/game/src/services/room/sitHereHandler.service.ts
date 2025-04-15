import { Injectable } from "@nestjs/common";
import _ from "underscore";
import _ld from "lodash";
import { systemConfig, stateOfX, popupTextManager } from 'shared/common';
import { ImdbDatabaseService } from "shared/common/datebase/Imdbdatabase.service";
import { PokerDatabaseService } from "shared/common/datebase/pokerdatabase.service";
import { ActionLoggerService } from "./actionLogger.service";
import { BroadcastHandlerService } from "./broadcastHandler.service";
import { StartGameHandlerService } from "./startGameHandler.service";
import { CommonHandlerService } from "./commonHandler.service";
import { ChannelTimerHandlerService } from "./channelTimerHandler.service";
import { JoinRequestUtilService } from "./joinRequestUtil.service";
import { WalletService } from "apps/wallet/src/wallet.service";
import { validateKeySets } from "shared/common/utils/activity";
import { DynamicTableHandlerService } from "./dynamicTableHandler.service";







profileMgmt = require("../../../../../shared/model/profileMgmt.js"),
    // activity = require("../../../../../shared/activity"),

    convert = require("../../database/remote/convertingIntToDecimal");


declare const pomelo: any;

@Injectable()
export class SitHereHandlerService {



    constructor(
        private readonly db: PokerDatabaseService,
        private readonly imdb: ImdbDatabaseService,
        private readonly actionLogger: ActionLoggerService,
        private readonly broadcastHandler: BroadcastHandlerService,
        private readonly startGameHandler: StartGameHandlerService,
        private readonly commonHandler: CommonHandlerService,
        private readonly channelTimerHandler: ChannelTimerHandlerService,
        private readonly joinRequestUtil: JoinRequestUtilService,
        private readonly wallet: WalletService,
        private readonly dynamicTable:DynamicTableHandlerService

    ) { }










    /*==============================  START  =============================*/
    // ### Validate if player is trying to sit with same network ip in same table

    // New
    async validateSameNetwork(params: any): Promise<any> {

        try {

            // Pomelo Connection
            const isSameNetworkSitResponse = await pomelo.app.rpc.database.tableRemote.isSameNetworkSit(
                params.session,
                {
                    channelId: params.channelId,
                    networkIp: params.networkIp,
                    playerId: params.playerId,
                    deviceType: params.deviceType,
                    byPassIp: params.byPassIp
                }
            );
            // Pomelo Connection

            if (isSameNetworkSitResponse.success) {
                return params;  // Returning the original params if successful
            } else {
                return {
                    success: false,
                    isRetry: false,
                    isDisplay: true,
                    channelId: params.channelId || "",
                    info: popupTextManager.falseMessages.ISSAMENETWORKSITFAIL_TABLEMANAGER
                };
            }
        } catch (error) {
            throw error;  // If there's an error, re-throw to be handled at a higher level
        }
    }


    // Old
    // var validateSameNetwork = function (params, cb) {
    //     console.log('processSit validateSameNetwork')

    //     pomelo.app.rpc.database.tableRemote.isSameNetworkSit(params.session, { channelId: params.channelId, networkIp: params.networkIp, playerId: params.playerId, deviceType: params.deviceType, byPassIp: params.byPassIp }, function (isSameNetworkSitResponse) {
    //     console.log('processSit validateSameNetwork resss', isSameNetworkSitResponse)

    //     if (isSameNetworkSitResponse.success) {
    //         cb(null, params);
    //     } else {
    //         cb({ success: false, isRetry: false, isDisplay: true, channelId: (params.channelId || ""), info: popupTextManager.falseMessages.ISSAMENETWORKSITFAIL_TABLEMANAGER });
    //         // cb(null, params);
    //     }
    //     });
    // }
    /*==============================  END  =============================*/



    /*==============================  START  =============================*/
    // ###Check if player is not on table already

    //   New
    async isPlayerNotOnTable(params: any): Promise<any> {
        try {

            // Pomelo Connection
            const isPlayerNotOnTableResponse = await pomelo.app.rpc.database.tableRemote.isPlayerNotOnTable(
                params.session,
                {
                    channelId: params.channelId,
                    playerId: params.playerId
                }
            );
            // Pomelo Connection

            if (isPlayerNotOnTableResponse.success) {
                params.data.playerOnTable = false;
                params.maxBuyIn = isPlayerNotOnTableResponse.table.maxBuyIn;
                return params;  // Return the updated params
            } else {
                params.data.playerOnTable = true;
                throw isPlayerNotOnTableResponse;  // Return error response if player is on table
            }
        } catch (error) {
            return error;  // Return the error if there's an issue
        }
    }

    // Old
    //   var isPlayerNotOnTable = function (params, cb) {
    //     pomelo.app.rpc.database.tableRemote.isPlayerNotOnTable(params.session, { channelId: params.channelId, playerId: params.playerId }, function (isPlayerNotOnTableResponse) {
    //       console.log("isPlayerNotOnTableResponse", isPlayerNotOnTableResponse)
    //       if (isPlayerNotOnTableResponse.success) {
    //         params.data.playerOnTable = false;
    //         params.maxBuyIn = isPlayerNotOnTableResponse.table.maxBuyIn;
    //         cb(null, params);
    //       } else {
    //         params.data.playerOnTable = true;
    //         cb(isPlayerNotOnTableResponse)
    //       }
    //     });
    //   }
    /*==============================  END  =============================*/


    /*==============================  START  =============================*/
    // check if player not in queue

    //   New
    async checkWaitingList(params: any): Promise<any> {
        try {

            // Pomelo Connection
            const getTableAttribResponse = await pomelo.app.rpc.database.tableRemote.getTableAttrib(
                params.session,
                { channelId: params.channelId, key: "queueList" }
            );
            // Pomelo Connection

            if (getTableAttribResponse.success) {
                const queueList = getTableAttribResponse.value;
                if (queueList.length <= 0) {
                    return params;  // Return updated params if the queue is empty
                } else {
                    if (params.playerId === queueList[0].playerId) {
                        return params;  // Return updated params if the player is at the front of the queue
                    } else {
                        return {
                            success: false,
                            isRetry: false,
                            isDisplay: true,
                            channelId: params.channelId || "",
                            info: popupTextManager.falseMessages.ERROR_CHECKING_WAITINGLIST
                        };  // Return error if player is not at the front
                    }
                }
            } else {
                throw getTableAttribResponse;  // If the response is not successful, throw it as an error
            }
        } catch (error) {
            return error;  // Return the error if any exception occurs
        }
    }


    //   Old
    //   var checkWaitingList = function (params, cb) {
    //     pomelo.app.rpc.database.tableRemote.getTableAttrib(params.session, { channelId: params.channelId, key: "queueList" }, function (getTableAttribResponse) {
    //       if (getTableAttribResponse.success) {
    //         var queueList = getTableAttribResponse.value;
    //         if (queueList.length <= 0) {
    //           cb(null, params);
    //         } else {
    //           if (params.playerId === queueList[0].playerId) {
    //             cb(null, params);
    //           } else {
    //             cb({ success: false, isRetry: false, isDisplay: true, channelId: (params.channelId || ""), info: popupTextManager.falseMessages.ERROR_CHECKING_WAITINGLIST });
    //           }
    //         }
    //       } else {
    //         cb(getTableAttribResponse);
    //       }
    //     });
    //   }
    /*==============================  END  =============================*/


    /*==============================  START  =============================*/
    // same ip player in same table not allowed

    //   New
    async blockSameIPonTable(params: any): Promise<any> {
        if (!systemConfig.allowSameNetworkPlay && !params.byPassIp) {
            try {
                const myResult = await this.imdb.getPlayersDetailsByIPaddress(params.channelId, params.networkIp);

                if (myResult && myResult > 0) {
                    return {
                        success: false,
                        isRetry: false,
                        isDisplay: true,
                        isSitIn: true,
                        channelId: params.channelId || "",
                        info: popupTextManager.falseMessages.ISSAMENETWORKSITFAIL_TABLEMANAGER
                    };
                } else {
                    return params;
                }
            } catch (err) {
                return {
                    success: false,
                    isRetry: false,
                    isDisplay: true,
                    isSitIn: true,
                    channelId: params.channelId || "",
                    info: popupTextManager.falseMessages.ISSAMENETWORKSITFAIL_TABLEMANAGER
                };
            }
        } else {
            return params;
        }
    };


    //   Old
    //   var blockSameIPonTable = function (params, cb) {
    //     // console.log("I AM IN blockSameIPinTable***************************",params)
    //     if (!systemConfig.allowSameNetworkPlay && !params.byPassIp) {
    //       imdb.getPlayersDetailsByIPaddress(params.channelId, params.networkIp, function (err, myResult) {
    //         if (!err) {
    //           if (!!myResult && myResult > 0) {
    //             cb({ success: false, isRetry: false, isDisplay: true, isSitIn: true, channelId: (params.channelId || ""), info: popupTextManager.falseMessages.ISSAMENETWORKSITFAIL_TABLEMANAGER });
    //           } else {
    //             cb(null, params);
    //           }
    //         } else {
    //           cb({ success: false, isRetry: false, isDisplay: true, isSitIn: true, channelId: (params.channelId || ""), info: popupTextManager.falseMessages.ISSAMENETWORKSITFAIL_TABLEMANAGER });
    //         }
    //       })
    //     } else {
    //       cb(null, params);
    //     }
    //   }
    /*==============================  END  =============================*/




    /*==============================  END  =============================*/
  ///////////////////////////////////////////////////
  // Validate anti banking if exist with an amount //
  ///////////////////////////////////////////////////


//   New
async validateAntiBanking (params: any): Promise<any> {
    try {
        const res = await this.joinRequestUtil.getAntiBanking(params);
        params.data.playerScore = {};
        params.data.playerScore.isAntiBanking = params.data.antibanking.isAntiBanking;
        params.data.playerScore.antibankingAmount = params.data.antibanking.amount;
        params.data.playerScore.currentAmount = res.chips;
        params.data.playerScore.playerId = res.playerId;
        params.data.playerScore.channelId = res.channelId;

        console.error("anti banking check on sit ", params.data.antibanking);

        if (!params.data.antibanking.isAntiBanking) {
            // No anti-banking record for this player
            return params;
        }

        params.data.buyinCheckRequired = false;

        if (params.chips < params.data.antibanking.amount) {
            // Validate amount
            return {
                success: false,
                isRetry: false,
                isDisplay: true,
                channelId: params.channelId || "",
                info: popupTextManager.falseMessages.ANTIBANKINGPREVENT + params.data.antibanking.amount
            };
        }

        // Pomelo Connection
        const tableBuyInResponse = await pomelo.app.rpc.database.tableRemote.tableBuyIn(params.session, { channelId: params.channelId });
        // Pomelo Connection

        if (tableBuyInResponse.success) {
            if (params.chips > 0 &&
                ((tableBuyInResponse.isStraddleEnable && params.chips >= Number(tableBuyInResponse.bigBlind * 2)) ||
                    (!tableBuyInResponse.isStraddleEnable && params.chips >= Number(tableBuyInResponse.bigBlind)))) {
                return params;
            } else {
                return {
                    success: false,
                    isRetry: false,
                    isDisplay: true,
                    channelId: params.channelId || "",
                    info: popupTextManager.falseMessages.TABLEBUYRESPONSEFAIL_SITHEREHANDLER
                };
            }
        } else {
            return {
                success: false,
                info: tableBuyInResponse,
                isRetry: false,
                isDisplay: false,
                channelId: ""
            };
        }

    } catch (err) {
        console.error('Error during anti-banking validation', err);
        return {
            success: false,
            info: 'Error during anti-banking validation'
        };
    }
};


//   Old
//   var validateAntiBanking = function (params, cb) {
//     joinRequestUtil.getAntiBanking(params, function (err, res) {
//       params.data.playerScore = {};
//       params.data.playerScore.isAntiBanking = params.data.antibanking.isAntiBanking;
//       params.data.playerScore.antibankingAmount = params.data.antibanking.amount;
//       params.data.playerScore.currentAmount = res.chips;
//       params.data.playerScore.playerId = res.playerId;
//       params.data.playerScore.channelId = res.channelId;
//       if (!err) { // No error in response
//         console.error("anti banking check on sit ", params.data.antibanking);
//         if (!params.data.antibanking.isAntiBanking) { // There is no record exists for this player in anti banking
//           cb(null, params);
//           return true;
//         }

//         params.data.buyinCheckRequired = false;
//         if (params.chips < params.data.antibanking.amount) { // Validate amount
//           cb({ success: false, isRetry: false, isDisplay: true, channelId: (params.channelId || ""), info: popupTextManager.falseMessages.ANTIBANKINGPREVENT + params.data.antibanking.amount });
//           return false;
//         }
//       }
//       pomelo.app.rpc.database.tableRemote.tableBuyIn(params.session, { channelId: params.channelId }, function (tableBuyInResponse) {
//         if (tableBuyInResponse.success) {
//           if (params.chips > 0 && ((tableBuyInResponse.isStraddleEnable && params.chips >= parseInt(tableBuyInResponse.bigBlind * 2)) || (!tableBuyInResponse.isStraddleEnable && params.chips >= parseInt(tableBuyInResponse.bigBlind)))) {
//             cb(null, params);
//           } else {
//             cb({ success: false, isRetry: false, isDisplay: true, channelId: (params.channelId || ""), info: popupTextManager.falseMessages.TABLEBUYRESPONSEFAIL_SITHEREHANDLER });
//             //cb({success: false, channelId: params.channelId, info: "Invalid chips buyin!"})
//           }
//         } else {
//           cb({ success: false, info: tableBuyInResponse, isRetry: false, isDisplay: false, channelId: "" })
//         }
//       });
//     });
//   }
/*==============================  END  =============================*/


/*==============================  START  =============================*/

// New
async validateExtraTimeBank(params: any): Promise<any> {
    try {

      const findUserResponse = await this.db.findUser({ playerId: params.playerId });
  
      if (findUserResponse && findUserResponse.subscription && (Date.now() >= findUserResponse.subscription.startDate && Date.now() <= findUserResponse.subscription.endDate)) {
        
        const result = await this.db.fetchSubscription({ subscriptionId: findUserResponse.subscription.subscriptionId });
  
        if (!result.length) {
          return {
            success: false,
            info: "Subscription Data Not Found",
            isRetry: false,
            isDisplay: false,
            channelId: params.channelId
          };
        } else {
          if (params.data.antibanking && !params.data.antibanking.isAntiBanking) {
            const logData = {
              playerId: params.playerId,
              channelId: params.channelId,
              userName: params.playerName,
              subscriptionId: result[0].subscriptionId,
              subscriptionName: result[0].name,
              timeBankUsed: 0,
              disconnectionTimeUsed: 0,
              updatedAt: Date.now()
            };
  
            await this.db.saveTimeLog({ playerId: params.playerId, channelId: params.channelId }, logData);
          }
          return params;
        }
  
      } else {
        return params;
      }
  
    } catch (err) {
      return {
        success: false,
        info: 'Error during extra time bank validation'
      };
    }
  };
  

// Old
//   var validateExtraTimeBank = function (params, cb) {
//     db.findUser({ playerId: params.playerId }, (err, findUserResponse) => {
//       if (!!findUserResponse && !!findUserResponse.subscription && (Date.now() >= findUserResponse.subscription.startDate && Date.now() <= findUserResponse.subscription.endDate)) {
//         logDb.fetchSubscription({ subscriptionId: findUserResponse.subscription.subscriptionId }, function (err, result) {
//           if (err || !result.length) {
//             cb({ success: false, info: "Subscription Data Not Found", isRetry: false, isDisplay: false, channelId: params.channelId })
//           } else {
//             if (!!params.data.antibanking && !params.data.antibanking.isAntiBanking) {
//               let logData = {
//                 playerId: params.playerId,
//                 channelId: params.channelId,
//                 userName: params.playerName,
//                 subscriptionId: result[0].subscriptionId,
//                 subscriptionName: result[0].name,
//                 timeBankUsed: 0,
//                 disconnectionTimeUsed: 0,
//                 updatedAt: Date.now()
//               }
//               logDb.saveTimeLog({ playerId: params.playerId, channelId: params.channelId }, logData, function (err, ans) {
//                 cb(null, params)
//               })
//             }
//             else {
//               cb(null, params)
//             }
//           }
//         })
//       } else {
//         cb(null, params)
//       }
//     })
//   }
/*==============================  END  =============================*/


/*==============================  START  =============================*/

// New
async updatePlayerScore(params: any): Promise<any> {

    let query:any = {
      playerId: params.data.playerScore.playerId,
      channelId: params.data.playerScore.channelId,
    };
  
    if (!params.data.playerScore.isAntiBanking) {
      try {
        const removeRes = await this.imdb.removePlayerScore(query);
  
        query.amount = params.data.playerScore.currentAmount;
        query.createdAt = new Date();
  
        if (query.amount > 0) {
          const insertQuery = {
            playerId: query.playerId,
            channelId: query.channelId,
            createdAt: new Date(),
            active: true,
          };
          await this.db.insertPlayerSession(insertQuery);
          await this.imdb.addPlayerScore(query);
        }
        
      } catch (err) {
        console.error('Error while updating player score (remove, insert, add)', err);
      }
    } else {
      query.createdAt = new Date();
      query.amount = params.data.playerScore.currentAmount - params.data.playerScore.antibankingAmount;
  
      if (query.amount > 0) {
        try {
          await this.imdb.addPlayerScore(query);
        } catch (err) {
          console.error('Error while adding player score (anti-banking)', err);
        }
      }
    }
  
    return params;
  };
  

// Old
// var updatePlayerScore = function (params, cb) {
//     var query = {};
//     query.playerId = params.data.playerScore.playerId;
//     query.channelId = params.data.playerScore.channelId;
//     if (!params.data.playerScore.isAntiBanking) {
//         imdb.removePlayerScore(query, function (removeErr, removeRes) {
//             query.amount = params.data.playerScore.currentAmount;
//             query.createdAt = new Date();
//             if (!removeErr) {
//                 if (query.amount > 0) {
//                     var insertQuery = {};
//                     insertQuery.playerId = query.playerId;
//                     insertQuery.channelId = query.channelId;
//                     insertQuery.createdAt = new Date();
//                     insertQuery.active = true;
//                     db.insertPlayerSession(insertQuery, function (insErr, insRes) {
//                         imdb.addPlayerScore(query, function (addErr, addRes) {
//                             cb(null, params);
//                         })
//                     })
//                 } else {
//                     cb(null, params);
//                 }
//             } else {
//                 cb(null, params);
//             }
//         })
//     } else {
//         query.createdAt = new Date();
//         query.amount = params.data.playerScore.currentAmount - params.data.playerScore.antibankingAmount;
//         if (query.amount > 0) {
//             imdb.addPlayerScore(query, function (addErr, addRes) {
//                 cb(null, params);
//             })
//         } else {
//             cb(null, params);
//         }
//     }
// }
/*==============================  END  =============================*/



    /*==============================  START  =============================*/
    //////////////////////////////////////////////////////////
    // Check if min and max buy in allowed success on table //
    //////////////////////////////////////////////////////////

    // New
    async validateBuyInAllowed(params: any): Promise<any> {
        // Do not check buy-in range if already checked in anti-banking
        if (!params.data.buyinCheckRequired) {
        return params;
        }
    
        try {
        const tableBuyInResponse = await pomelo.app.rpc.database.tableRemote.tableBuyIn(params.session, { channelId: params.channelId });
    
        if (tableBuyInResponse.success) {
            if (params.chips > 0 && params.chips >= parseInt(tableBuyInResponse.tableMinBuyIn) && params.chips <= parseInt(tableBuyInResponse.tableMaxBuyIn)) {
            return params;
            } else {
            return {
                success: false,
                isRetry: false,
                isDisplay: true,
                channelId: params.channelId || "",
                info: popupTextManager.falseMessages.TABLEBUYRESPONSEFAIL_SITHEREHANDLER,
            };
            }
        } else {
            return {
            success: false,
            info: tableBuyInResponse,
            isRetry: false,
            isDisplay: false,
            channelId: "",
            };
        }
        } catch (error) {
        console.error('Error while validating buy-in:', error);
        return {
            success: false,
            info: 'Error validating buy-in',
            isRetry: false,
            isDisplay: false,
            channelId: "",
        };
        }
    };
    

    // Old
    // var validateBuyInAllowed = function (params, cb) {

    //     // Do not check buy in range if already checked in anti banking
    //     if (!params.data.buyinCheckRequired) {
    //         cb(null, params);
    //         return true;
    //     }

    //     pomelo.app.rpc.database.tableRemote.tableBuyIn(params.session, { channelId: params.channelId }, function (tableBuyInResponse) {
    //         if (tableBuyInResponse.success) {
    //             if (params.chips > 0 && params.chips >= parseInt(tableBuyInResponse.tableMinBuyIn) && params.chips <= parseInt(tableBuyInResponse.tableMaxBuyIn)) {
    //                 cb(null, params);
    //             } else {
    //                 cb({ success: false, isRetry: false, isDisplay: true, channelId: (params.channelId || ""), info: popupTextManager.falseMessages.TABLEBUYRESPONSEFAIL_SITHEREHANDLER });
    //                 //cb({success: false, channelId: params.channelId, info: "Invalid chips buyin!"})
    //             }
    //         } else {
    //             cb({ success: false, info: tableBuyInResponse, isRetry: false, isDisplay: false, channelId: "" })
    //         }
    //     });
    // }
    /*==============================  END  =============================*/



    /*==============================  START  =============================*/
    // Check if seat is not already occupied success

    // New
    async validateSeatOccupancy(params: any): Promise<any> {
        try {
        const seatOccupiedResponse = await pomelo.app.rpc.database.tableRemote.seatOccupied(params.session, { channelId: params.channelId });
    
        if (seatOccupiedResponse.success) {
            if (params.seatIndex > 0 && seatOccupiedResponse.indexOccupied.indexOf(params.seatIndex) < 0) {
            return params;
            } else {
            return {
                success: false,
                isRetry: false,
                isDisplay: true,
                channelId: params.channelId || "",
                info: popupTextManager.falseMessages.VALIDATESEATOCCUPANCYFAIL_SITHEREHANDLER,
            };
            }
        } else {
            return { seatOccupiedResponse };
        }
        } catch (error) {
        console.error('Error while validating seat occupancy:', error);
        return {
            success: false,
            info: 'Error validating seat occupancy',
            isRetry: false,
            isDisplay: false,
            channelId: "",
        };
        }
    };
    

    // Old
    // var validateSeatOccupancy = function (params, cb) {
    //     pomelo.app.rpc.database.tableRemote.seatOccupied(params.session, { channelId: params.channelId }, function (seatOccupiedResponse) {
    //         if (seatOccupiedResponse.success) {
    //             if (params.seatIndex > 0 && seatOccupiedResponse.indexOccupied.indexOf(params.seatIndex) < 0) {
    //                 cb(null, params);
    //             } else {
    //                 cb({ success: false, isRetry: false, isDisplay: true, channelId: (params.channelId || ""), info: popupTextManager.falseMessages.VALIDATESEATOCCUPANCYFAIL_SITHEREHANDLER });
    //                 //cb({success: false, channelId: params.channelId, info: "Seat is already occupied!"})
    //             }
    //         } else {
    //             cb({ seatOccupiedResponse })
    //         }
    //     });
    // }
    /*==============================  END  =============================*/


    /*==============================  START  =============================*/
    // Check if player has sufficient amount as requested in profile

    // New
    async validateProfileAmount(params: any): Promise<any> {
        if (params.channel.channelType === stateOfX.gameType.normal) {
        try {

            // Pomelo Connection
            const getTableAttribResponse = await pomelo.app.rpc.database.tableRemote.getTableAttrib(params.session, {
            channelId: params.channelId,
            key: "isRealMoney",
            });
            // Pomelo Connection
    
            // chipsTaken
            const refNumber = await this.imdb.findRefrenceNumber({ playerId: params.playerId, channelId: params.channelId });
    
            if (!refNumber || refNumber.length === 0) {
            params.referenceNumber = 'aa';
            } else {
            params.referenceNumber = refNumber[0].referenceNumber;
            }
    
            const dataForWallet = {
            action: 'chipsTaken',
            data: {
                playerId: params.playerId,
                isRealMoney: getTableAttribResponse.value,
                chips: convert.convert(params.chips),
                channelId: params.channelId,
                tableName: params.channel.channelName,
                referenceNumber: params.referenceNumber,
            },
            };
    
            const deductChipsResponse = await this.wallet.sendWalletBroadCast(dataForWallet);
    
            if (deductChipsResponse.success) {
            params.realChipBonusDetected = deductChipsResponse.points.promo || 0;
            params.totalRCB = (deductChipsResponse.userPoints.promo + deductChipsResponse.points.promo) || 0;
            params.totalRC = (deductChipsResponse.userPoints.deposit + deductChipsResponse.userPoints.win) +
                            (deductChipsResponse.points.deposit + deductChipsResponse.points.win) || 0;
            params.lastRealChip = (deductChipsResponse.points.deposit + deductChipsResponse.points.win) || 0;
            params.points = deductChipsResponse.points;
            return params;
            } else {
            return deductChipsResponse;
            }
    
        } catch (error) {
            console.error('Error in validateProfileAmount:', error);
            return { success: false, info: 'An error occurred while validating profile amount' };
        }
        } else {
        return params;
        }
    };
    

    // Old
    // var validateProfileAmount = function (params, cb) {
    //     if (params.channel.channelType === stateOfX.gameType.normal) {
    //         pomelo.app.rpc.database.tableRemote.getTableAttrib(params.session, {
    //             channelId: params.channelId, key: "isRealMoney"
    //         }, async function (getTableAttribResponse) {
    //             //chipsTaken
    //             imdb.findRefrenceNumber({ playerId: params.playerId, channelId: params.channelId }, async function (err, refNumber) {
    //                 if (err || !refNumber.length) {
    //                     params.referenceNumber = 'aa'
    //                 }
    //                 else {
    //                     params.referenceNumber = refNumber[0].referenceNumber;
    //                 }
    //                 let dataForWallet = {
    //                     action: 'chipsTaken',
    //                     data: {
    //                         playerId: params.playerId,
    //                         isRealMoney: getTableAttribResponse.value,
    //                         chips: convert.convert(params.chips),
    //                         channelId: params.channelId,
    //                         tableName: params.channel.channelName,
    //                         referenceNumber: params.referenceNumber
    //                     }
    //                 }
    //                 let deductChipsResponse = await wallet.sendWalletBroadCast(dataForWallet)
    //                 if (deductChipsResponse.success) {
    //                     params.realChipBonusDetected = deductChipsResponse.points.promo || 0;
    //                     params.totalRCB = (deductChipsResponse.userPoints.promo) + (deductChipsResponse.points.promo) || 0;
    //                     params.totalRC = (deductChipsResponse.userPoints.deposit + deductChipsResponse.userPoints.win) + (deductChipsResponse.points.deposit + deductChipsResponse.points.win) || 0;
    //                     params.lastRealChip = (deductChipsResponse.points.deposit) + (deductChipsResponse.points.win) || 0;
    //                     params.points = deductChipsResponse.points;
    //                     cb(null, params);
    //                 } else {
    //                     cb(deductChipsResponse)
    //                 }
    //             });
    //         });
    //     } else {
    //         cb(null, params);
    //     }
    // }
    /*==============================  END  =============================*/


    /*==============================  START  =============================*/
    // ### Check if there is any antibaking entry exists for this player
    // If yes then valiate buyin amount, it must be higher or equalthan anti banking entry amount
    // If no then proceed player to sit on table with requested buyin amount

    // New
    async checkAntiBankingEntry(params: any): Promise<any> {
    
        try {
        const res = await this.db.getAntiBanking({ playerId: params.playerId, channelId: params.channelId });
        
        if (res != null) {
            const timeRemains = Number(systemConfig.expireAntiBankingSeconds) + Number(systemConfig.antiBankingBuffer) - (Number(new Date()) - Number(res.createdAt)) / 1000;
    
            if (timeRemains > 0) {
            if (parseInt(params.chips) < parseInt(res.amount)) {
                return { success: false, channelId: (params.channelId || ""), info: popupTextManager.falseMessages.ANTIBANKINGPREVENT + parseInt(res.amount), isRetry: false, isDisplay: true };
            } else {
                return params;
            }
            } else {
            await this.removeAntiBanking(params);
            return params;
            }
        } else {
            return params;
        }
    
        } catch (err) {
        console.log(stateOfX.serverLogType.error, 'Unable to get anti banking details from database.');
        return { success: false, channelId: (params.channelId || ""), info: popupTextManager.dbQyeryInfo.DB_GETANTIBANKING_FAIL, isRetry: false, isDisplay: false };
        }
    };
    

    // // Old
    // var checkAntiBankingEntry = function (params, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'In function checkAntiBankingEntry.');
    //     db.getAntiBanking({ playerId: params.playerId, channelId: params.channelId }, function (err, res) {
    //         console.error("!!!!!!!!!!!!!!@((((((((((()))))))))))))))))))))))))))", stateOfX.serverLogType.info, 'Anti banking details for this player: ' + JSON.stringify(res));
    //         if (!err) {
    //             if (res != null) {
    //                 var timeRemains = parseInt(systemConfig.expireAntiBankingSeconds) + parseInt(systemConfig.antiBankingBuffer) - (Number(new Date()) - Number(res.createdAt)) / 1000;
    //                 if (timeRemains > 0) {
    //                     if (parseInt(params.chips) < parseInt(res.amount)) {
    //                         cb({ success: false, channelId: (params.channelId || ""), info: popupTextManager.falseMessages.ANTIBANKINGPREVENT + parseInt(res.amount), isRetry: false, isDisplay: true });
    //                     } else {
    //                         cb(null, params);
    //                     }
    //                 } else {
    //                     removeAntiBanking(params, function (cbdata) {
    //                         console.error(cbdata);
    //                     });
    //                     cb(null, params);
    //                 }
    //             } else {
    //                 cb(null, params);
    //             }
    //         } else {
    //             serverLog(stateOfX.serverLogType.error, 'Unable to get anti banking details from database.');
    //             cb({ success: false, channelId: (params.channelId || ""), info: popupTextManager.dbQyeryInfo.DB_GETANTIBANKING_FAIL, isRetry: false, isDisplay: false });
    //         }
    //     });
    // }
    /*==============================  END  =============================*/


    /*==============================  START  =============================*/
    // remove antibanking if time got over

    // New
    async removeAntiBanking(params: any): Promise<any> {
    
        try {
        const res = await this.db.removeAntiBankingEntry({ playerId: params.playerId, channelId: params.channelId });
    
        if (res) {
            return params;
        } else {
            return { success: false, channelId: (params.channelId || ""), info: popupTextManagerFromdb.DB_REMOVEANTIBANKING_FAIL, isRetry: false, isDisplay: false };
        }
        } catch (err) {
        console.log(stateOfX.serverLogType.error, 'Error during anti banking removal: ' + JSON.stringify(err));
        return { success: false, channelId: (params.channelId || ""), info: popupTextManagerFromdb.DB_REMOVEANTIBANKING_FAIL, isRetry: false, isDisplay: false };
        }
    };
    

    // Old
    // var removeAntiBanking = function (params, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'in leaveRemote function removeAntiBanking');
    //     db.removeAntiBankingEntry({ playerId: params.playerId, channelId: params.channelId }, function (err, res) {
    //         if (!err && res) {
    //             cb(null, params);
    //         } else {
    //             serverLog(stateOfX.serverLogType.error, 'Unable to insert anti banking details in database: ' + JSON.stringify(err));
    //             cb({ success: false, channelId: (params.channelId || ""), info: popupTextManagerFromdb.DB_REMOVEANTIBANKING_FAIL, isRetry: false, isDisplay: false });
    //         }
    //     });
    // }
    /*==============================  END  =============================*/


    /*==============================  START  =============================*/

    // New
    async  refundChipsToRejectedPlayers(refundData: { playerId: string; chips: number }): Promise<void> {
      
        try {
          const user = await this.db.findUser({ playerId: refundData.playerId });
      
          // If user is found
          if (user) {
            const totalChips = Number(refundData.chips);
            const filter = { playerId: refundData.playerId };
            const update = { '$inc': { realChips: totalChips } };
      
      
            // Returning real chips to the player
            await this.db.returnRealChipsToPlayer(filter, update);
          }
        } catch (err) {
          console.error('Error while processing refund for player: ', err);
        }
      };
      

    // Old
    // var refundChipsToRejectedPlayers = function (refundData) {
    //     console.log('enter in refundChipsToRejectedPlayers function.', refundData)
    //     db.findUser({ playerId: refundData.playerId }, function (err, user) {
    //         if (err) {
    //             console.log('error in find user.');
    //         } else {
    //             // Number(user.realChips) + 
    //             var totalChips = Number(refundData.chips);
    //             var filter = {}
    //             filter.playerId = refundData.playerId;

    //             var update = {}
    //             update['$inc'] = { realChips: totalChips };
    //             console.log('filters:', filter, 'update:', update);
    //             db.returnRealChipsToPlayer(filter, update, function (error, result) {

    //                 if (error) {
    //                     console.error('Error! while returning realChips to player.')
    //                 } else {
    //                     console.log('realChips added back to rejected player.')
    //                 }
    //             })
    //         }


    //     });
    // }
    /*==============================  END  =============================*/


    /*==============================  START  =============================*/
// add player in players array

// New
async addWaitingPlayer(params: any): Promise<void> {
  
    try {

        // Pomelo Connection
      const addWaitingPlayerResponse = await pomelo.app.rpc.database.tableRemote.addWaitingPlayer(params.session, {
        points: params.points,
        channelId: params.channelId,
        playerId: params.playerId,
        chips: params.chips,
        lastRealChipBonus: params.realChipBonusDetected,
        lastRealChip: params.lastRealChip,
        totalRC: params.totalRC,
        totalRCB: params.totalRCB || 0,
        seatIndex: params.seatIndex,
        playerName: params.playerName,
        imageAvtar: params.imageAvtar,
        networkIp: params.networkIp,
        maxBuyIn: params.maxBuyIn,
        deviceType: params.deviceType,
        isRunItTwiceApplied: params.isRunItTwiceApplied,
      });
        // Pomelo Connection
  
      if (addWaitingPlayerResponse.success) {
        params.player = addWaitingPlayerResponse.player;
        params.table = addWaitingPlayerResponse.table;
      } else {
        if (addWaitingPlayerResponse.success === false) {
          const refundData = {
            playerId: params.playerId,
            chips: params.chips,
          };
  
          await this.refundChipsToRejectedPlayers(refundData);
        }
      }
    } catch (err) {
      console.error('Error in addWaitingPlayer:', err);
    }
  };
  

    // Old
    // var addWaitingPlayer = function (params, cb) {
    //     console.log("new player added to waiting list here", params)
    //     pomelo.app.rpc.database.tableRemote.addWaitingPlayer(params.session, { points: params.points, channelId: params.channelId, playerId: params.playerId, chips: params.chips, lastRealChipBonus: params.realChipBonusDetected, lastRealChip: params.lastRealChip, totalRC: params.totalRC, totalRCB: params.totalRCB || 0, seatIndex: params.seatIndex, playerName: params.playerName, imageAvtar: params.imageAvtar, networkIp: params.networkIp, maxBuyIn: params.maxBuyIn, deviceType: params.deviceType, isRunItTwiceApplied: params.isRunItTwiceApplied }, function (addWaitingPlayerResponse) {
    //         if (addWaitingPlayerResponse.success) {
    //             params.player = addWaitingPlayerResponse.player;
    //             params.table = addWaitingPlayerResponse.table;
    //             cb(null, params);
    //         } else {
    //             if (addWaitingPlayerResponse.success == false) {
    //                 console.log("REFUND AMOUNT==========", params)
    //                 var refundData = {};
    //                 refundData.playerId = params.playerId;
    //                 refundData.chips = params.chips;

    //                 refundChipsToRejectedPlayers(refundData)

    //                 // console.log('---------------------------------------');
    //                 // console.log('params', params);
    //                 // console.log('params.chips', params.chips);
    //                 // console.log('---------------------------------------');
    //             }
    //             cb({ addWaitingPlayerResponse })
    //         }
    //     });
    // }
    /*==============================  END  =============================*/


    /*==============================  START  =============================*/
    // update isSitHere in record user activity
    // not used anymore

    // New
    async updateObserverRecord(params: any): Promise<void> {
    
        try {
        const result = await this.imdb.updateIsSit({ playerId: params.playerId, channelId: params.channelId });
    
        if (result) {
            // Proceed with your logic after the update
            return;
        } else {
            throw { success: false, channelId: params.channelId || "", info: popupTextManager.dbQyeryInfo.DB_UPDATEOBSERVERRECORD_FAIL, isRetry: false, isDisplay: false };
        }
        } catch (err) {
        console.error('Error in updateObserverRecord:', err);
        throw err;  // Propagate error if needed
        }
    };
    

    // Old
    // var updateObserverRecord = function (params, cb) {
    //     serverLog(stateOfX.serverLogType.error, "going to update isSit");
    //     imdb.updateIsSit({ playerId: params.playerId, channelId: params.channelId }, function (err, result) {
    //         if (!!result) {
    //             cb(null, params);
    //         } else {
    //             cb({ success: false, channelId: (params.channelId || ""), info: popupTextManager.dbQyeryInfo.DB_UPDATEOBSERVERRECORD_FAIL, isRetry: false, isDisplay: false });
    //         }
    //     })
    // }
    /*==============================  END  =============================*/



    /*==============================  START  =============================*/
    ////////////////////////////////////////////
    // ### Broadcast player details for lobby //
    ////////////////////////////////////////////

    // New
    async broadcastLobbyDetails(params: { channelId: string; table: { players: any[] }; }): Promise<void> {
        this.broadcastHandler.fireBroadcastToAllSessions({
        app: {},
        data: {
            _id: params.channelId,
            updated: { playingPlayers: params.table.players.length },
            event: stateOfX.recordChange.tablePlayingPlayer
        },
        route: stateOfX.broadcasts.tableUpdate
        });
    
        // The commented-out broadcast logic can be added if needed in the future.
        // broadcastHandler.fireBroadcastToAllSessions({
        //   app: {},
        //   data: {
        //     _id: params.channelId,
        //     playerId: params.playerId,
        //     channelType: params.channel.channelType,
        //     updated: { playerName: params.playerName, chips: params.chips },
        //     event: stateOfX.recordChange.tableViewNewPlayer
        //   },
        //   route: stateOfX.broadcasts.tableView
        // });
    
        return;  // No callback needed, just return
    };
    

    // Old
    // var broadcastLobbyDetails = function (params, cb) {
    //     broadcastHandler.fireBroadcastToAllSessions({ app: {}, data: { _id: params.channelId, updated: { playingPlayers: params.table.players.length }, event: stateOfX.recordChange.tablePlayingPlayer }, route: stateOfX.broadcasts.tableUpdate });
    //     //broadcastHandler.fireBroadcastToAllSessions({app: {}, data: {_id: params.channelId, playerId: params.playerId, channelType: params.channel.channelType, updated: {playerName: params.playerName, chips: params.chips}, event: stateOfX.recordChange.tableViewNewPlayer}, route: stateOfX.broadcasts.tableView});
    //     cb(null, params);
    // }
    /*==============================  END  =============================*/


    /*==============================  START  =============================*/
    // Kill reserve seat timer for this player
    // > If player sit on a reserve sit

    // New
    async killReserveSeatTimer(params: any): Promise<any> {
        // Perform necessary actions to kill timers
        this.channelTimerHandler.killReserveSeatReferennce({ playerId: params.playerId, channel: params.channel });
        this.channelTimerHandler.killKickToLobbyTimer({ playerId: params.playerId, channel: params.channel });
    
        // No callback needed, just return
        return params;
    };  

    // Old
    // var killReserveSeatTimer = function (params, cb) {
    //     //  console.error(params.channel);
    //     channelTimerHandler.killReserveSeatReferennce({ playerId: params.playerId, channel: params.channel });
    //     channelTimerHandler.killKickToLobbyTimer({ playerId: params.playerId, channel: params.channel });
    //     cb(null, params);
    // }
    /*==============================  END  =============================*/


    /*==============================  START  =============================*/
// Set this channel into session settings of player

// New
async setChannelIntoSession(params: { session: any; channelId: string }): Promise<void> {
    const sessionChannels = params.session.get("channels");

    if (sessionChannels.indexOf(params.channelId) < 0) {
        sessionChannels.push(params.channelId);
    }

    params.session.set("channels", sessionChannels);

    try {
        await params.session.push("channels");
    } catch (err) {
        console.log(stateOfX.serverLogType.error, 'set playerId for session service failed! error is : %j', err.stack);
        throw { success: false, channelId: params.channelId, info: err, isRetry: false, isDisplay: false };
    }
};


// Old
// var setChannelIntoSession = function (params, cb) {
//     console.log("Inside sitHereHandler function setChannelIntoSession", params);
//     var sessionChannels = params.session.get("channels");

//     if (sessionChannels.indexOf(params.channelId) < 0) {
//         sessionChannels.push(params.channelId);
//     }

//     params.session.set("channels", sessionChannels);
//     params.session.push("channels", function (err) {
//         if (err) {
//             serverLog(stateOfX.serverLogType.error, 'set playerId for session service failed! error is : %j', err.stack);
//             cb({ success: false, channelId: params.channelId, info: err, isRetry: false, isDisplay: false });
//         } else {
//             console.error("Hellllllllll");
//             console.error(sessionChannels);
//             cb(null, params);
//         }
//     });
// }
    /*==============================  END  =============================*/


    /*==============================  END  =============================*/
// set player auto buyin

// New
async setPlayerAutoBuyIn(params: any): Promise<void> {
    
    try {

        // Pomelo Connection
        const setPlayerAttribResponse = await pomelo.app.rpc.database.tableRemote.setPlayerAttrib(params.session, {
            playerId: params.playerId,
            channelId: params.channelId,
            key: "isAutoReBuy",
            value: params.isAutoReBuy
        });
        // Pomelo Connection

        if (setPlayerAttribResponse.success) {
            // No callback needed
            return params
        } else {
            throw { setPlayerAttribResponse };
        }
    } catch (error) {
        throw error;
    }
};


// Old
// var setPlayerAutoBuyIn = function (params, cb) {
//     serverLog(stateOfX.serverLogType.info, 'setPlayerAutoBuyIn')
//     pomelo.app.rpc.database.tableRemote.setPlayerAttrib(params.session, { playerId: params.playerId, channelId: params.channelId, key: "isAutoReBuy", value: params.isAutoReBuy }, function (setPlayerAttribResponse) {
//         if (setPlayerAttribResponse.success) {
//             cb(null, params);
//         } else {
//             cb({ setPlayerAttribResponse })
//         }
//     });
// }
    /*==============================  END  =============================*/


    /*==============================  END  =============================*/
    // Check if seat is not already occupied success

    // New
    async validateResponse(params: { channelId: string; response: any }): Promise<void> {
        params.response = { success: true, channelId: params.channelId };

        try {
            const validated = await validateKeySets("Response", "connector", "sitHere", params.response);

            if (validated.success) {
                // No callback needed
                return params;
            } else {
                throw { validated };
            }
        } catch (error) {
            throw error;
        }
    };


    // Old
    // var validateResponse = function (params, cb) {
    //     params.response = { success: true, channelId: params.channelId };
    //     keyValidator.validateKeySets("Response", "connector", "sitHere", params.response, function (validated) {
    //         if (validated.success) {
    //             cb(null, params);
    //         } else {
    //             cb({ validated })
    //         }
    //     });
    // }
    /*==============================  END  =============================*/


    /*==============================  START  =============================*/
    // Check if seat is not already occupied success

    // new
    async logEventandStartGame(params: any): Promise<any> {

        this.actionLogger.createEventLog({
            session: params.session,
            channel: params.channel,
            data: {
                channelId: params.channelId,
                eventName: stateOfX.logEvents.sit,
                rawData: {
                    playerName: params.player.playerName,
                    chips: params.player.chips
                }
            }
        });

        this.broadcastHandler.fireSitBroadcast({
            channel: params.channel,
            channelId: params.channelId,
            session: params.session,
            player: params.player,
            table: params.table
        });

        // Call start game function to validate game start condition
        this.startGameHandler.startGame({
            session: params.session,
            channelId: params.channelId,
            channel: params.channel,
            eventName: stateOfX.startGameEvent.sit
        });

        setTimeout(() => {
            this.startGameHandler.startGame({
                session: params.session,
                channelId: params.channelId,
                channel: params.channel,
                eventName: stateOfX.startGameEvent.sit
            });
        }, Number(systemConfig.startGameAfterStartEvent) * 1000);

        return params;
    }


    // Old
    // var logEventandStartGame = function (params, cb) {
    //     console.log("inside logEventandStartGame !!!!!!!!!!!!!!!!!!!!!!!!!!!!", params)
    //     actionLogger.createEventLog({ session: params.session, channel: params.channel, data: { channelId: params.channelId, eventName: stateOfX.logEvents.sit, rawData: { playerName: params.player.playerName, chips: params.player.chips } } });
    //     broadcastHandler.fireSitBroadcast({ channel: params.channel, channelId: params.channelId, session: params.session, player: params.player, table: params.table });
    //     // Call start game function to validate game start condition
    //     startGameHandler.startGame({ session: params.session, channelId: params.channelId, channel: params.channel, eventName: stateOfX.startGameEvent.sit });
    //     setTimeout(function () {
    //         startGameHandler.startGame({ session: params.session, channelId: params.channelId, channel: params.channel, eventName: stateOfX.startGameEvent.sit });
    //     }, parseInt(systemConfig.startGameAfterStartEvent) * 1000);
    //     cb(null, params);
    // }
    /*==============================  END  =============================*/

    /*==============================  START  =============================*/

    // New
    async generateDynamicTable(params: any): Promise<any> {
        // If table is full and not private, process for dynamic table creation
        if (params.table.maxPlayers === params.table.players.length && !params.table.isPrivate) {
            this.dynamicTable.process(params);
        }
    
        return params;
    }
    

    // Old
    // const generateDynamicTable = function (params, cb) {
    //     //if table is full then only we'll create a table
    //     if (params.table.maxPlayers == params.table.players.length && !params.table.isPrivate) {
    //         dynamicTable.process(params)
    //     }
    //     cb(null, params);
    // }
    /*==============================  END  =============================*/

    /*==============================  START  =============================*/

    // New
    async updateParams(params: any): Promise<any> {
    
        params.player.RITstatus = params.player.isRunItTwice;
    
        this.broadcastHandler.playerSettings({
            channel: params.channel,
            channelId: params.channelId,
            session: params.session,
            player: params.player,
            table: params.table
        });
    
        return params;
    }
    

    // Old
    // var updateParams = function (params, cb) {
    //     console.log("08022023 updateParams  in sitHere")
    //     params.player.RITstatus = params.player.isRunItTwice;
    //     broadcastHandler.playerSettings({ channel: params.channel, channelId: params.channelId, session: params.session, player: params.player, table: params.table });

    //     cb(null, params);
    // }
    /*==============================  END  =============================*/


    /*==============================  START  =============================*/
// process SIT HERE api - all steps

// New
async processSit(params: any): Promise<any> {

    params.data = {};
    params.data.antibanking = {};
    params.data.buyinCheckRequired = true;
    console.log('processSit ', params);

    const validated = await validateKeySets("Request", pomelo.app.serverType, "processSit", params);

    if (!validated.success) {
        return validated;
    }

    try {
        await this.validateSameNetwork(params);
        await this.isPlayerNotOnTable(params);
        await this.blockSameIPonTable(params);
        await this.checkWaitingList(params);
        await this.validateAntiBanking(params);
        await this.validateExtraTimeBank(params);
        await this.validateBuyInAllowed(params);
        await this.validateSeatOccupancy(params);
        await this.checkAntiBankingEntry(params);
        await this.validateProfileAmount(params); // adds chips taken and top-up
        await this.addWaitingPlayer(params);
        await this.updatePlayerScore(params);
        await this.updateParams(params);
        await this.updateObserverRecord(params);
        await this.broadcastLobbyDetails(params);
        await this.killReserveSeatTimer(params);
        await this.setChannelIntoSession(params);
        await this.setPlayerAutoBuyIn(params);
        await this.validateResponse(params);
        await this.logEventandStartGame(params);
        await this.generateDynamicTable(params);

        params.success = true;

        this.activity.playerSit(
            params,
            stateOfX.profile.category.game,
            stateOfX.game.subCategory.sit,
            stateOfX.logType.success
        );

        return params;
    } catch (err: any) {
        this.activity.playerSit(
            params,
            stateOfX.profile.category.game,
            stateOfX.game.subCategory.sit,
            stateOfX.logType.error
        );

        if (err?.addWaitingPlayerResponse?.success === false) {
            return err.addWaitingPlayerResponse;
        }

        return err;
    }
}


// Old
// sitHereHandler.processSit = function (params, cb) {
//     serverLog(stateOfX.serverLogType.info, "in processSit");
//     params.data = {};
//     params.data.antibanking = {};
//     params.data.buyinCheckRequired = true;
//     console.log('processSit ', params)

//     keyValidator.validateKeySets("Request", pomelo.app.serverType, "processSit", params, function (validated) {
//         if (validated.success) {
//             async.waterfall([
//                 async.apply(validateSameNetwork, params),
//                 isPlayerNotOnTable,
//                 blockSameIPonTable,
//                 checkWaitingList,
//                 validateAntiBanking,
//                 validateExtraTimeBank,
//                 validateBuyInAllowed,
//                 validateSeatOccupancy,
//                 checkAntiBankingEntry,
//                 validateProfileAmount, //here we are adding chips taken and topup 
//                 addWaitingPlayer,
//                 updatePlayerScore,
//                 updateParams,
//                 updateObserverRecord,
//                 broadcastLobbyDetails,
//                 killReserveSeatTimer,
//                 setChannelIntoSession,
//                 setPlayerAutoBuyIn,
//                 validateResponse,
//                 logEventandStartGame,
//                 generateDynamicTable
//             ], function (err, response) {
//                 console.log('process sit here response:', err);
//                 // console.log('err', err);
//                 // console.log('response', response);
//                 if (!err && response) {
//                     // console.log('processSit on success',response, params);
//                     params.success = true;
//                     activity.playerSit(response, stateOfX.profile.category.game, stateOfX.game.subCategory.sit, stateOfX.logType.success);
//                     // console.log('processSit after playerSit ', params);
//                     // broadcastHandler.fireTablePlayersBroadcast({self: params.self, channelId: params.channelId, channel: params.channel, players: params.table.players, removed: []});   // This broadcast was added to stop the player from going to playing state on sit-in during the same hand after sitout
//                     cb(params);
//                 } else {
//                     activity.playerSit(response, stateOfX.profile.category.game, stateOfX.game.subCategory.sit, stateOfX.logType.error);
//                     if (!!err.addWaitingPlayerResponse && err.addWaitingPlayerResponse.success == false) {
//                         cb(err.addWaitingPlayerResponse);
//                     } else {

//                         cb(err);
//                     }
//                 }
//             });
//         } else {
//             cb(validated);
//         }
//     });
// }
    /*==============================  END  =============================*/










}




