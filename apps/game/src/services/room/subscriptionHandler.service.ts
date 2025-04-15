import { Injectable } from "@nestjs/common";
import { ImdbDatabaseService } from "shared/common/datebase/Imdbdatabase.service";
import { PokerDatabaseService } from "shared/common/datebase/pokerdatabase.service";
import { BroadcastHandlerService } from "./broadcastHandler.service";
import { WalletService } from '../../walletQuery';



@Injectable()
export class SubscriptionHandlerService {

    constructor(
        private readonly db: PokerDatabaseService,
        private readonly imdb: ImdbDatabaseService,
        private readonly broadcastHandler: BroadcastHandlerService,
        private readonly wallet: WalletService,
    ) {}



    /*===========================  START   ==========================*/
        //list 

        // Assuming appropriate type definitions for adminDB, logDB, and subscriptionHandler
    async list(params: any): Promise<any> {

        const currentDate = Number(new Date());
    
        const query = {
        status: true,
        promotionStartDate: { $lt: currentDate },
        promotionEndDate: { $gte: currentDate },
        };
    
        try {
        const subscriptionList = await this.db.getSubscription(query);
    
        if (!subscriptionList.length) {
            return { success: false, info: 'Sorry, Unable to find any active Subscription!' };
        }
    
        const response = await this.db.fetchSubscription({ playerId: params.playerId, status: true });
    
        if (response.length && response[0].endDate > Number(new Date())) {
            for (const subscription of subscriptionList) {
            if (subscription.name === response[0].name) {
                subscription.alreadyPurchased = true;
                subscription.purchasedType = response[0].type;
            }
            }
        }
    
        return { success: true, data: subscriptionList };
        } catch (err) {
        return { success: false, info: 'Sorry, Unable to find any active Subscription!' };
        }
    };
    

        // Old
    // subscriptionHandler.list = function (params, cb) {
    //     let currentDate = Number(new Date());  
    //     let query = { status: true, promotionStartDate: { $lt: currentDate }, promotionEndDate: { $gte: currentDate } }
    //     adminDB.getSubscription(query, (err, subscriptionList) => {
    //       if (!err && subscriptionList.length) {
    //         logDB.fetchSubscription({playerId: params.playerId, status : true}, (err, response) => {
    //           if(!err && response.length && (response[0].endDate > Number(new Date()))){
    //             for(let subscription of subscriptionList){
    //               if(subscription.name === response[0].name){
    //                 subscription.alreadyPurchased = true,
    //                 subscription.purchasedType = response[0].type;
    //               }
    //             }
    //             cb({ success: true, data: subscriptionList });
    //           }
    //           else {
    //             cb({ success: true, data: subscriptionList });
    //           }
    //         })
    //       }
    //       else {
    //         cb({ success: false, info: 'Sorry, Unable to find any active Subscription!' })
    //       }
    //     })
    //   }
    /*===========================  END   ==========================*/
  

    /*===========================  START   ==========================*/
    // getting subscription status for rabbit

    // New
    async activeStatus (params: any): Promise<any> {
        try {
        const findUserResponse = await this.db.findUser({ playerId: params.playerId });
    
        const hasValidSubscription =
            !!findUserResponse &&
            !!findUserResponse.subscription &&
            Date.now() >= findUserResponse.subscription.startDate &&
            Date.now() <= findUserResponse.subscription.endDate;
    
        if (!hasValidSubscription) {
            return { success: true, info: 'No subscription found!' };
        }
    
        const result = await this.db.fetchSubscription({
            subscriptionId: findUserResponse.subscription.subscriptionId,
        });
    
        if (!result.length) {
            return { success: true, info: 'No subscription found!' };
        }
    
        if (result[0].rabbit) {
            return { success: true, rabbitLimit: result[0].rabbit };
        } else {
            return { success: true, info: 'Rabbit limit not available' };
        }
        } catch (err) {
        return { success: true, info: 'No subscription found!' };
        }
    };
    

    //   Old
    //   subscriptionHandler.activeStatus = function (params, cb) {
    //     db.findUser({ playerId: params.playerId }, (err, findUserResponse) => {
    //       if (!!findUserResponse && !!findUserResponse.subscription && (Date.now() >= findUserResponse.subscription.startDate && Date.now() <= findUserResponse.subscription.endDate)) {
    //         logDB.fetchSubscription({ subscriptionId: findUserResponse.subscription.subscriptionId }, async function (err, result) {
    //           if (err || !result.length) {
    //             cb({ success: true, info: 'No subscription found!' })
    //           } else {
    //             if (result.length && result[0].rabbit) {
    //               cb({ success: true, rabbitLimit: result[0].rabbit });
    //             }
    //             else {
    //               cb({ success: true, info: 'Rabbit limit not available' })
    //             }
    //           }
    //         })
    //       }
    //       else {
    //         cb({ success: true, info: 'No subscription found!' })
    //       }
    //     })
    //   }
    /*===========================  END   ==========================*/
  
    /*===========================  START   ==========================*/
    //getting subscription.

    //   New
    async getSubscription(params: any): Promise<any> {
    
        const query = {
        name: params.subscriptionName,
        status: true,
        };
    
        try {
        const subscriptionData = await this.db.getSubscription(query);
    
        if (!subscriptionData || !subscriptionData.length) {
            console.log("got one request for getSubscription > else 2");
            return {
            success: false,
            info: `Sorry, ${params.subscriptionName} is not active, Please try again later!`,
            };
        }
    
        console.log("got one request for getSubscription > adminDB.getSubscription ? !err && subscriptionData");
        const currentTime = Number(new Date());
    
        const currentSubscription = subscriptionData[0];
        if (
            currentTime >= currentSubscription.promotionStartDate &&
            currentTime < currentSubscription.promotionEndDate
        ) {
            const subscriptionType = currentSubscription.subscription.find(
            ({ type }: any) => type === params.type
            );
    
            const dataForWallet = {
            action: 'subscription',
            data: {
                playerId: params.playerId,
                chips: subscriptionType.charges,
                isRealMoney: true,
            },
            };
    
            console.log(
            "got one request for getSubscription > adminDB.getSubscription > dataForWallet",
            dataForWallet
            );
    
            const generateSubId = () => {
            let result = 'SID-';
            let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            for (let i = 0; i < 16; i++) {
                result += possible.charAt(Math.floor(Math.random() * possible.length));
            }
            return result;
            };
    
            const walletResponse = await this.wallet.sendWalletBroadCast(dataForWallet);
    
            if (walletResponse.success) {
            const subscriptionId = generateSubId();
            const endDate =
                currentTime + subscriptionType.validity * 24 * 60 * 60 * 1000;
            const userData = {
                subscriptionId,
                startDate: currentTime,
                endDate,
            };
    
            // Fire and forget
            this.db.updateSubscriptionRecord(
                { playerId: params.playerId, status: true },
                { status: false }
            ).catch(() => {});
            this.db.updateSubUsedCount(
                {
                name: currentSubscription.name,
                subscriptionId: currentSubscription.subscriptionId,
                },
                {}
            ).catch(() => {});
    
            const setUserResult = await this.db.setSubscription(
                { playerId: params.playerId },
                userData
            );

            const data = {
                name: currentSubscription.name,
                subscriptionId,
                type: subscriptionType.type,
                startDate: currentTime,
                endDate,
                VIPData: subscriptionType.VIPData,
                initialDisconnectionTime: subscriptionType.disconnectionTime,
                disconnectionTime: subscriptionType.disconnectionTime,
                initialRabbit: subscriptionType.rabbit,
                rabbit: subscriptionType.rabbit,
                initialTimeBank: subscriptionType.timeBank,
                timeBank: subscriptionType.timeBank,
                charges: subscriptionType.charges,
                userName: setUserResult.value.userName,
                playerId: params.playerId,
                initialEmoji: subscriptionType.emojiLimit,
                emojicount: subscriptionType.emojiLimit,
                rcBefore: Math.round(walletResponse.currentPoints.rc + subscriptionType.charges),
                rcAfter: Math.round(walletResponse.currentPoints.rc),
                status: true,
            };
    
            await this.db.saveSubscriptionRecord(data);
    
            this.broadcastHandler.sendMessageToUser({
                self: {},
                playerId: params.playerId,
                msg: {
                heading: 'Premium User',
                info: 'Congratulation for the subscription, you can now enjoy the subscription benefits!',
                playerId: params.playerId,
                buttonCode: '',
                },
                route: 'playerInfo',
            });
    
            const logData = {
                timeBankUsed: 0,
                disconnectionTimeUsed: 0,
            };
    
            // Fire and forget
            this.db.updateTimeLog({ playerId: params.playerId }, logData).catch(() => {});
    
            return {
                success: true,
                info: `Hurray!, you have successfully subscribed to ${params.subscriptionName}, enjoy the benefits!`,
            };
            } else {
            return walletResponse;
            }
        } else {
            console.log("got one request for getSubscription > else 1");
            return {
            success: false,
            info: `Sorry, promotion date for ${params.subscriptionName} is over, Please try another!`,
            };
        }
        } catch (err) {
        console.log("got one request for getSubscription > catch block", err);
        return {
            success: false,
            info: `Sorry, ${params.subscriptionName} is not active, Please try again later!`,
        };
        }
    };
    

    //   Old
    //   subscriptionHandler.getSubscription = async function (params, cb) {
    //     console.log(" got one request for getSubscription > getSubscription", params)
    //     let query = {
    //       name: params.subscriptionName,
    //       status: true,
    //     }
    //     adminDB.getSubscription(query, async function (err, subscriptionData) {
    //       console.log(" got one request for getSubscription > adminDB.getSubscription", subscriptionData)
    //       if (!err && subscriptionData) {
    //         console.log(" got one request for getSubscription > adminDB.getSubscription ? !err && subscriptionData ")
    //         let currentTime = Number(new Date());
    //         if (currentTime >= subscriptionData[0].promotionStartDate && currentTime < subscriptionData[0].promotionEndDate) {
    //           // send event to wallet & get it done
    //           let subscriptionType = subscriptionData[0].subscription.find(({ type }) => type === params.type);
    //           let dataForWallet = {
    //             action: 'subscription',
    //             data: {
    //               playerId: params.playerId,
    //               chips: subscriptionType.charges,
    //               isRealMoney: true
    //             }
    //           }
    //           console.log("got one request for getSubscription > adminDB.getSubscription > dataForWallet", dataForWallet)
    //           const generateSubId = () => {
    //             let result = 'SID-';
    //             let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    //             for (let i = 0; i < 16; i++) {
    //               result += possible.charAt(Math.floor(Math.random() * possible.length));
    //             } return result;
    //           }
    //           let walletResponse = await wallet.sendWalletBroadCast(dataForWallet)
    //           console.log(" got one request for getSubscription > adminDB.getSubscription ? !err && subscriptionData > walletResponse", walletResponse)
    //           if (walletResponse.success) {
    //             let subscriptionId = generateSubId()
    //             let endDate = currentTime + (subscriptionType.validity * 24 * 60 * 60 * 1000);
    //             let userData = {
    //               subscriptionId: subscriptionId,
    //               startDate: currentTime,
    //               endDate: endDate
    //             }
    //             logDB.updateSubscriptionRecord({ playerId: params.playerId, status: true }, { status: false }, function (err, res) { })
    //             adminDB.updateSubUsedCount({ name: subscriptionData[0].name, subscriptionId: subscriptionData[0].subscriptionId }, {}, function (err, res) { })
    //             pokerDb.setSubscription({ playerId: params.playerId }, userData, function (err, res) {
    //               console.log(" got one request for getSubscription > adminDB.getSubscription ? !err && subscriptionData > user", err, res)
    //               let data = {
    //                 "name": subscriptionData[0].name,
    //                 "subscriptionId": subscriptionId,
    //                 "type": subscriptionType.type,
    //                 "startDate": currentTime,
    //                 "endDate": endDate,
    //                 "VIPData": subscriptionType.VIPData,
    //                 "initialDisconnectionTime": subscriptionType.disconnectionTime,
    //                 "disconnectionTime": subscriptionType.disconnectionTime,
    //                 "initialRabbit": subscriptionType.rabbit,
    //                 "rabbit": subscriptionType.rabbit,
    //                 "initialTimeBank": subscriptionType.timeBank,
    //                 "timeBank": subscriptionType.timeBank,
    //                 "charges": subscriptionType.charges,
    //                 "userName": res.value.userName,
    //                 "playerId": params.playerId,
    //                 "initialEmoji": subscriptionType.emojiLimit,
    //                 "emojicount": subscriptionType.emojiLimit,
    //                 "rcBefore": Math.round(walletResponse.currentPoints.rc + subscriptionType.charges),
    //                 "rcAfter": Math.round(walletResponse.currentPoints.rc),
    //                 "status": true
    //               }
    //               logDB.saveSubscriptionRecord(data, (err, res) => {
    //                 broadcastHandler.sendMessageToUser({ self: {}, playerId: params.playerId, msg: { heading: "Premium User", info: 'Congratulation for the subscription, you can now enjoy the subscription benefits!', playerId: params.playerId, buttonCode: '' }, route: "playerInfo" });
    //                 let logData = {
    //                   // subscriptionId: subscriptionId,
    //                   // subscriptionName: subscriptionData[0].name,
    //                   timeBankUsed: 0,
    //                   disconnectionTimeUsed: 0
    //                 }
    //                 logDB.updateTimeLog({ playerId: params.playerId }, logData, function (err, ans) { })
    //                 cb({ success: true, info: `Hurray!, you have successfully subscribed to ${params.subscriptionName}, enjoy the benefits!` })
    //               })
    //             })
    //           }
    //           else {
    //             cb(walletResponse);
    //           }
    //         }
    //         else {
    //           console.log(" got one request for getSubscription > else 1 ")
    //           cb({ success: false, info: `Sorry, promotion date for ${params.subscriptionName} is over, Please try another!` })
    //         }
    //       }
    //       else {
    //         console.log(" got one request for getSubscription > else 2 ")
    //         cb({ success: false, info: `Sorry, ${params.subscriptionName} is not active, Please try again later!` })
    //       }
    //     })
    //   }
    /*===========================  END   ==========================*/
  
    /*===========================  START   ==========================*/
  // saving subscription usage history of extra times 

//   New
async saveSubscriptionHistory(params: any): Promise<any> {
  
    try {
      const response = await this.db.findUser({ playerId: params.playerId });
  
      if (
        !response.subscription ||
        Date.now() < response.subscription.startDate ||
        Date.now() > response.subscription.endDate
      ) {
        console.log('subscription not found in user data!!');
        return { success: false };
      }
  
      const subscriptionResult = await this.db.fetchSubscription({
        subscriptionId: response.subscription.subscriptionId,
      });
  
      if (!subscriptionResult || !subscriptionResult.length) {
        return { success: false };
      }
  
      const logData: any = {
        playerId: params.playerId,
        channelId: params.channelId,
        subscriptionId: response.subscription.subscriptionId,
        subscriptionName: subscriptionResult[0].name,
        updatedAt: Date.now(),
      };
  
      const usageLogData: any = {
        playerId: params.playerId,
        roundId: params.roundId,
        channelId: params.channelId,
        tableName: params.tableName,
        date: Date.now(),
        subscriptionId: response.subscription.subscriptionId,
        subscriptionName: subscriptionResult[0].name,
        subscriptionType: subscriptionResult[0].type,
      };
  
      const query: any = {
        playerId: params.playerId,
        channelId: params.channelId,
        subscriptionId: response.subscription.subscriptionId,
      };
  
      const type = params.type.toUpperCase();
  
      if (type === "FREETURNENDED") {
        const result = await this.db.getExtraTimeLog(query);
        console.log("getExtra turn details", result);
  
        if (!result) {
          console.log('Extra Turn Time Started History not found!!');
          return { success: false };
        }
  
        logData.timeBankUsed = params.timeBankUsed || 0;
        if (result.timeBankUsed) {
          logData.timeBankUsed += result.timeBankUsed;
        }
  
        const saveLogResult = await this.db.saveTimeLog(query, logData);
        if (!saveLogResult) {
          console.log('log failed to save in logDb!!');
          return { success: false };
        }
  
        console.log('log successfully saved to logDb!');
        usageLogData.timeBank = params.timeBankUsed;
        usageLogData.userName = result.userName;
        query.roundId = params.roundId;
  
        const saveUsageResult = await this.db.saveSubscriptionUsage(query, usageLogData);
        if (!saveUsageResult) {
          console.log('Not able to update subscription usage');
          return { success: false };
        }
  
        return { success: true };
  
      } else if (type === "DISCONNECTIONENDED") {
        const responseLog = await this.db.getExtraTimeLog(query);
        console.log("getExtra disconnection details", responseLog);
  
        if (!responseLog) {
          console.log('Extra Disconnection Time Started History not found!!');
          return { success: false };
        }
  
        logData.disconnectionTimeUsed = params.disconnectionTimeUsed || 0;
        if (responseLog.disconnectionTimeUsed) {
          logData.disconnectionTimeUsed += responseLog.disconnectionTimeUsed;
        }
  
        const saveLogResult = await this.db.saveTimeLog(query, logData);
        if (!saveLogResult) {
          console.log('log failed to save in logDb!!');
          return { success: false };
        }
  
        console.log('log successfully saved to logDb!');
        usageLogData.disconnectionTime = params.disconnectionTimeUsed;
        usageLogData.userName = responseLog.userName;
        query.roundId = params.roundId;
  
        const saveUsageResult = await this.db.saveSubscriptionUsage(query, usageLogData);
        if (!saveUsageResult) {
          console.log('Not able to update subscription usage');
          return { success: false };
        }
  
        return { success: true };
  
      } else {
        console.log('Log is unable to save in logDb!!');
        return { success: false };
      }
  
    } catch (err) {
      console.log('Unexpected error in saveSubscriptionHistory:', err);
      return { success: false };
    }
  };
  

//   Old
//   subscriptionHandler.saveSubscriptionHistory = async function (params) {
//     console.log("inside subscriptionHandler.saveSubscriptionHistory", params)
//     db.findUser({ playerId: params.playerId }, function (err, response) {
//       console.log("user response is", err, response)
//       if (!!response.subscription && (Date.now() >= response.subscription.startDate && Date.now() <= response.subscription.endDate)) {
//         logDB.fetchSubscription({ subscriptionId: response.subscription.subscriptionId }, function (err, subscriptionResult) {
//           if (err || !subscriptionResult.length) {
//             return ({ success: false })
//           } else {
//             let logData = {
//               playerId: params.playerId,
//               channelId: params.channelId,
//               subscriptionId: response.subscription.subscriptionId,
//               subscriptionName: subscriptionResult[0].name,
//               updatedAt: Date.now()
//             }
//             let usageLogData = {
//               playerId: params.playerId,
//               roundId: params.roundId,
//               channelId: params.channelId,
//               tableName: params.tableName,
//               date: Date.now(),
//               subscriptionId: response.subscription.subscriptionId,
//               subscriptionName: subscriptionResult[0].name,
//               subscriptionType: subscriptionResult[0].type,
//             }
//             let query = {
//               playerId: params.playerId,
//               channelId: params.channelId,
//               subscriptionId: response.subscription.subscriptionId
//             }
//             if (params.type.toUpperCase() === "FREETURNENDED") {
//               logDB.getExtraTimeLog(query, (err, result) => {
//                 console.log("getExtra turn details", result)
//                 if (err || !result) {
//                   console.log('Extra Turn Time Started History not found!!');
//                   return ({ success: false })
//                 }
//                 else {
//                   logData.timeBankUsed = params.timeBankUsed;
//                   if (!!result.timeBankUsed) {
//                     logData.timeBankUsed += result.timeBankUsed;
//                   }
//                   //will save log of extraTurnTime ends.
//                   logDB.saveTimeLog(query, logData, (err, res) => {
//                     if (err || !res) {
//                       console.log('log failed to save in logDb!!');
//                       return ({ success: false })
//                     }
//                     else {
//                       console.log('log successfully saved to logDb!')
//                       usageLogData.timeBank = params.timeBankUsed;
//                       usageLogData.userName = result.userName;
//                       query.roundId = params.roundId;
//                       logDB.saveSubscriptionUsage(query, usageLogData, function (err, response) {
//                         if (err || !response) {
//                           console.log('Not able to update subscription usage');
//                           return ({ success: false })
//                         }
//                         else {
//                           return { success: true };
//                         }
//                       });
//                     }
//                   })
//                 }
//               })
//             }
//             else if (params.type.toUpperCase() === "DISCONNECTIONENDED") {
//               logDB.getExtraTimeLog(query, function (err, response) {
//                 console.log("getExtra disconnection details", response)
//                 if (err || !response) {
//                   console.log('Extra Disconnection Time Started History not found!!');
//                   return ({ success: false })
//                 }
//                 else {
//                   logData.disconnectionTimeUsed = params.disconnectionTimeUsed;
//                   if (!!response.disconnectionTimeUsed) {
//                     logData.disconnectionTimeUsed += response.disconnectionTimeUsed;
//                   }
//                   //will save log of extraDisconnectTime ends.
//                   logDB.saveTimeLog(query, logData, (err, res) => {
//                     if (err || !res) {
//                       console.log('log failed to save in logDb!!');
//                       return ({ success: false })
//                     } else {
//                       console.log('log successfully saved to logDb!')
//                       usageLogData.disconnectionTime = params.disconnectionTimeUsed;
//                       usageLogData.userName = response.userName;
//                       query.roundId = params.roundId;
//                       logDB.saveSubscriptionUsage(query, usageLogData, function (err, finalResult) {
//                         if (err || !finalResult) {
//                           console.log('Not able to update subscription usage');
//                           return ({ success: false })
//                         }
//                         else {
//                           return { success: true };
//                         }
//                       });
//                     }
//                   })
//                 }
//               })
//             }
//             else {
//               console.log('Log is unable to save in logDb!!');
//               return ({ success: false })
//             }
//           }
//         })
//       } else {
//         console.log('subscription not found in user data!!');
//         return ({ success: false })
//       }
//     })
//   }
    /*===========================  END   ==========================*/



    
}