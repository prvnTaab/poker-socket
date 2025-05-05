import { Injectable } from "@nestjs/common";
import _ from 'underscore';
import { stateOfX } from "shared/common";
import { PokerDatabaseService } from "shared/common/datebase/pokerdatabase.service";
import { WalletService } from "apps/wallet/src/wallet.service";











@Injectable()
export class CashOutForPlayerService {


    constructor(
        private readonly db: PokerDatabaseService,
        private readonly wallet: WalletService
    ) { }





    /*============================  START  =================================*/
    // init params
    // validate some keys and
    // not less than 100
    // New
    initializeParams(params: any) {
        if (!params.tds) {
            return { success: true, info: 'Error in processing request', isDisplay: true };
        }

        let data = { ...params };
        data.cashOutAmount = convert.convert(params.realChips);
        data.tds = convert.convert(params.tds);
        data.playerId = params.playerId;

        if (params.realChips < 500) {
            return { success: false, info: "Minimum amount should be 500." };
        } else {
            if (params.playerId) {
                return data;
            } else {
                return { success: false, info: "Player not Found" };
            }
        }
    };


    // Old
    // var initializeParams = function (params, cb) {
    //     if (!params.tds) {
    //       cb({ success: true, info: 'Error in processing request', isDisplay: true })
    //   }
    //     var data = Object.assign({}, params);
    //     data.cashOutAmount = convert.convert(params.realChips);
    //     data.tds = convert.convert(params.tds)
    //     data.playerId = params.playerId;
    //     if (params.realChips < 500) {
    //       cb({ success: false, info: "Minimum amount should be 500." });
    //     } else {
    //       if (params.playerId) {
    //         cb(null, data);
    //       } else {
    //         cb({ success: false, info: "Player not Found" });
    //       }
    //     }
    //   }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    // fetch player from db
    // should be affiliated
    // player should have that many chips
    //   New
    async findPlayer(params: any) {
        const filter = { playerId: params.playerId };

        const playerResult = await this.db.findUser(filter);

        if (!playerResult || playerResult.isBlocked) {
            return { success: false, info: "Player Not Found" };
        }

        if (playerResult.isParentUserName === "") {
            return { success: false, info: "Player Affilate Not Found" };
        }

        if (playerResult.realChips < params.realChips) {
            return { success: false, info: "You have insufficient points to process the request." };
        }

        params.playerResult = playerResult;
        return params;
    };


    //   Old
    //   var findPlayer = function (params, cb) {
    //     var filter = {};
    //     filter.playerId = params.playerId;
    //     db.findUser(filter, function (err, playerResult) {
    //       if (err || playerResult == null || playerResult.isBlocked) {
    //         cb({ success: false, info: "Player Not Found" });
    //       } else {
    //         if (playerResult.isParentUserName == "") {
    //           cb({ success: false, info: "Player Affilate Not Found" });
    //         } else {
    //           if (playerResult.realChips < params.realChips) {
    //             cb({ success: false, info: "You have insufficient points to process the request." });
    //           } else {
    //             params.playerResult = playerResult;
    //             cb(null, params);
    //           }
    //         }
    //       }
    //     })
    //   }
    /*============================  END  =================================*/



    /*============================  START  =================================*/
    // New
    async findBankDetails(params: any) {
        const bankDetails = await this.db.findBankDetailsuser({ playerId: params.playerId });

        if (bankDetails && bankDetails.length > 0) {
            params.WithdrawAcName = bankDetails[0].WithdrawAcName;
            params.WithdrawAcType = bankDetails[0].WithdrawAcType;
            params.WithdrawAcNumber = bankDetails[0].WithdrawAcNumber;
            params.WithdrawAcIfsc = bankDetails[0].WithdrawAcIfsc;
            params.WithdrawAcBank = bankDetails[0].WithdrawAcBank;
            params.WithdrawAcBranch = bankDetails[0].WithdrawAcBranch;
        }

        return params;
    };


    // Old
    //   var findBankDetails = function (params, cb) {
    //     db.findBankDetailsuser({ playerId: params.playerId }, function (err, bankDetails) {
    //       if (err) {
    //         cb(err, null);
    //       } else {
    //         if (bankDetails.length > 0) {
    //           params.WithdrawAcName = bankDetails[0].WithdrawAcName
    //           params.WithdrawAcType = bankDetails[0].WithdrawAcType
    //           params.WithdrawAcNumber = bankDetails[0].WithdrawAcNumber
    //           params.WithdrawAcIfsc = bankDetails[0].WithdrawAcIfsc
    //           params.WithdrawAcBank = bankDetails[0].WithdrawAcBank
    //           params.WithdrawAcBranch = bankDetails[0].WithdrawAcBranch
    //           cb(null, params);
    //         } else {
    //           cb(null, params);
    //         }
    //       }
    //     })
    //   }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    // is cashout requested valid
    // transaction in a day?
    //   New
    async cashOutValid(params: any) {
        if (params.playerResult.chipsManagement.withdrawlCount >= 10) {
            const lastTransactionDate = new Date(params.playerResult.chipsManagement.withdrawlDate).toDateString();
            const todaysDate = new Date().toDateString();


            if (this.convertDateToMidnight(todaysDate) >= this.convertDateToMidnight(lastTransactionDate)) {
                params.playerResult.chipsManagement.withdrawlCount = 0;
                return params;
            } else {
                throw {
                    success: false,
                    info: "Number of withdrawl exausted for today",
                    isDisplay: true,
                    playerChips: params.realChips
                };
            }
        } else {
            params.playerResult.chipsManagement.withdrawlCount += 1;
            return params;
        }
    };


    //   Old
    //   var cashOutValid = function (params, cb) {
    //     if (params.playerResult.chipsManagement.withdrawlCount >= 10) {
    //       var lastTransactionDate = new Date(params.playerResult.chipsManagement.withdrawlDate).toDateString();
    //       var todaysDate = new Date().toDateString();
    //       console.error(lastTransactionDate, " !!!!!&&&&&&&&&&&& ", todaysDate);
    //       console.error(lastTransactionDate > todaysDate);
    //       console.error(lastTransactionDate < todaysDate);
    //       if (convertDateToMidnight(todaysDate) >= convertDateToMidnight(lastTransactionDate)) {
    //         // if(todaysDate >lastTransactionDate){
    //         params.playerResult.chipsManagement.withdrawlCount = 0;
    //         cb(null, params);
    //       } else {
    //         cb({ success: false, info: "Number of withdrawl exausted for today", isDisplay: true, playerChips: params.realChips });
    //       }
    //     } else {
    //       //             console.error("!!!!!!@@@@@@@############  ");
    //       params.playerResult.chipsManagement.withdrawlCount += 1;
    //       cb(null, params);
    //     }
    //   }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    // convert timestamp to timestamp
    // modified -> acc to midnight time
    //   New
    convertDateToMidnight(dateToConvert: any): any {
        const date = new Date(dateToConvert);
        date.setHours(0, 0, 0, 0);
        return Number(date);
    };


    //   Old
    //   var convertDateToMidnight = function (dateToConvert) {
    //     dateToConvert = new Date(dateToConvert)
    //     dateToConvert.setHours(0)
    //     dateToConvert.setMinutes(0)
    //     dateToConvert.setSeconds(0)
    //     dateToConvert.setMilliseconds(0)
    //     return Number(dateToConvert)
    //     }
    /*============================  END  =================================*/

    // check if given date is of today
    Date.prototype.sameDay = function (d) {
        return this.getFullYear() === d.getFullYear()
            && this.getDate() === d.getDate()
            && this.getMonth() === d.getMonth();
    }


    /*============================  START  =================================*/
    // save cashout request related data in user profile
    // New
    async generateWithdrawlRequest(params: any): Promise<any> {
        const query: any = {
            playerId: params.playerId
        };

        if (params.playerResult.chipsManagement.deposit < 0) {
            params.playerResult.chipsManagement.deposit = 0;
        }

        const chipManagement = {
            deposit: params.playerResult.chipsManagement.deposit,
            WithDrawl: 0,
            withdrawlCount: params.playerResult.chipsManagement.withdrawlCount,
            withdrawlPercent: params.playerResult.chipsManagement.withdrawlPercent,
            withdrawlDate: Number(new Date())
        };

        const updateKeys: any = {
            chipsManagement: chipManagement
        };

        try {
            const updatedUser = await this.db.updateUser(query, updateKeys);
            if (!updatedUser) {
                return { success: false, info: "Could Not process request", isDisplay: true };
            }
            return params;
        } catch (err) {
            return { success: false, info: "Could Not process request", isDisplay: true };
        }
    };


    // Old
    // var generateWithdrawlRequest = function (params, cb) {
    //     var query = {};
    //     query.playerId = params.playerId;
    //     var updateKeys = {};
    //     if (params.playerResult.chipsManagement.deposit < 0) {
    //         params.playerResult.chipsManagement.deposit = 0;
    //     }
    //     var chipManagement = {};
    //     chipManagement.deposit = params.playerResult.chipsManagement.deposit;
    //     chipManagement.WithDrawl = 0;
    //     chipManagement.withdrawlCount = params.playerResult.chipsManagement.withdrawlCount;
    //     chipManagement.withdrawlPercent = params.playerResult.chipsManagement.withdrawlPercent;
    //     chipManagement.withdrawlDate = Number(new Date());
    //     updateKeys.chipsManagement = chipManagement;
    //     //  console.error("!!!!!!@@@@@@@############  ",updateKeys);
    //     db.updateUser(query, updateKeys, function (err, updatedUser) {
    //         if (err) {
    //             cb({ success: false, info: "Could Not process request", isDisplay: true });
    //         }

    //         if (!!updatedUser) {
    //             cb(null, params);
    //         }
    //     })
    // }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    // fetch affiliate from db
    // should be active
    // New
    async findAffilate(params: any): Promise<any> {

        const filter = {
            userName: params.playerResult.isParentUserName
        };

        try {
            const affilateResult = await this.db.findAffiliates(filter);
            if (!affilateResult) {
                return { success: false, info: "Affilate Not Found" };
            }

            if (affilateResult.status !== "Active") {
                return { success: false, info: "Affilate is Blocked" };
            }

            params.affilateResult = affilateResult;
            return params;
        } catch (err) {
            return { success: false, info: "Affilate Not Found" };
        }
    };

    // Old
    // var findAffilate = function (params, cb) {
    //     var filter = {};
    //     filter.userName = params.playerResult.isParentUserName;
    //     //    console.error(params.playerResult);
    //     adminDb.findAffiliates(filter, function (err, affilateResult) {
    //         //        console.error(affilateResult);
    //         if (err || affilateResult == null) {
    //             cb({ success: false, info: "Affilate Not Found" });
    //         } else {
    //             if (affilateResult.status != "Active") {
    //                 cb({ success: false, info: "Affilate is Blocked" });
    //             } else {
    //                 params.affilateResult = affilateResult;
    //                 cb(null, params);
    //             }
    //         }
    //     })
    // }
    /*============================  END  =================================*/


    /*============================  END  =================================*/
    // deduct player chips from profile
    // New
    async deductChips(params: any): Promise<any> {
        const filter = {
            playerId: params.playerId
        };

        const dataForWallet = {
            action: 'cashoutRc',
            data: {
                isRealMoney: true,
                playerId: params.playerId,
                chips: params.realChips,
            }
        };

        const resultData = await this.wallet.sendWalletBroadCast(dataForWallet);

        if (!resultData.success) {
            return resultData;
        }

        params.playerResult.points = resultData.points;
        params.playerResult.realChips = resultData.data.realChips;

        if ((params.playerResult.chipsManagement.deposit - params.realChips) <= 0) {
            params.currentDepositChips = params.playerResult.chipsManagement.deposit;
        } else {
            params.currentDepositChips = params.playerResult.chipsManagement.deposit - params.realChips;
        }

        params.playerResult.chipsManagement.deposit -= params.realChips;

        return params;
    };


    // Old
    // var deductChips = async function (params, cb) {
    //     var filter = {};
    //     filter.playerId = params.playerId;
    //     let dataForWallet = {
    //         action: 'cashoutRc',
    //         data: {
    //             isRealMoney: true,
    //             playerId: params.playerId,
    //             chips: params.realChips,
    //         }
    //     }
    //     let resultData = await wallet.sendWalletBroadCast(dataForWallet)
    //     if (!resultData.success) {
    //         cb(resultData);
    //     } else {
    //         params.playerResult.points = resultData.points;
    //         params.playerResult.realChips = resultData.data.realChips;
    //         if ((params.playerResult.chipsManagement.deposit - params.realChips) <= 0) {
    //             params.currentDepositChips = params.playerResult.chipsManagement.deposit;
    //         } else {
    //             params.currentDepositChips = params.playerResult.chipsManagement.deposit - params.realChips;
    //         }
    //         params.playerResult.chipsManagement.deposit = params.playerResult.chipsManagement.deposit - params.realChips;
    //         cb(null, params);
    //     }
    // }
    /*============================  END  =================================*/

    // var createCashOutRequest = function(params, cb) {
    //      cb(null,params);
    // }


    /*============================  START  =================================*/
    // New
    generateORCPRefrenceId(): string {
        let result = 'llll-';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 16; i++) {
            result += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return result;
    };


    // Old
    // const generateORCPRefrenceId = () => {
    //     var result = 'llll-';
    //     var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    //     for (var i = 0; i < 16; i++) {
    //         result += possible.charAt(Math.floor(Math.random() * possible.length));
    //     } return result;
    // }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    // create cashout request in databse in cashoutDirect coll
    // New
    async createCashOutRequest(params: any): Promise<any> {
        const dataToInsert: any = {};
        dataToInsert.points = params.playerResult.points;
        dataToInsert.name = params.playerResult.firstName;
        dataToInsert.userName = params.playerResult.userName;
        dataToInsert.playerId = params.playerResult.playerId;
        dataToInsert.profile = "Player";
        dataToInsert.currentDepositChips = params.currentDepositChips;
        dataToInsert.amount = params.realChips;
        dataToInsert.netAmount = params.realChips - params.tds;
        dataToInsert.type = "Total Chips";
        dataToInsert.requesttype = "Cash Out";
        dataToInsert.affilateId = params.affilateResult.userName;
        dataToInsert.nameOnAccount = params.WithdrawAcName || "N/A";
        dataToInsert.accountNumber = params.WithdrawAcNumber || "N/A";
        dataToInsert.ifcsCode = params.WithdrawAcIfsc || "N/A";
        dataToInsert.bankName = params.WithdrawAcBank || "N/A";
        dataToInsert.branchName = params.WithdrawAcBranch || "N/A";
        dataToInsert.accountType = params.WithdrawAcType || "N/A";
        dataToInsert.tds = params.tds;
        dataToInsert.createdAt = Number(new Date());

        const resultHistory = await this.db.craeteCashoutRequestForPlayerThroughGame(dataToInsert);


        const playerDatas = {
            playerId: params.playerResult.playerId,
            realChips: params.playerResult.realChips,
            realChipBonus: params.playerResult.realChipBonus,
            totalBalance: params.playerResult.realChips + params.playerResult.realChipBonus,
        };

        if (resultHistory) {
            const content = {
                name: params.playerResult.firstName,
                fullname: params.playerResult.firstName + ' ' + params.playerResult.lastName,
                userName: params.playerResult.userName,
                cashoutamount: params.cashOutAmount,
                affiliateName: params.affilateResult.name
            };

            const subjectAffiliate = `Cashout request from ${content.fullname} (${content.userName}) for ${content.cashoutamount} points`;

            const mailDataAffiliate = this.createMailData({
                content,
                toEmail: params.affilateResult.email,
                from_email: stateOfX.mailMessages.from_email.toString(),
                subject: subjectAffiliate,
                template: 'CashoutByPlayerMailToAffiliate'
            });

            const mailData = this.createMailData({
                content,
                toEmail: params.playerResult.emailId,
                from_email: stateOfX.mailMessages.from_email.toString(),
                subject: "Cashout Request",
                template: 'cashoutPlayerMail'
            });

            await sharedModule.sendMailWithHtml(mailData);
            await sharedModule.sendMailWithHtml(mailDataAffiliate);
        }

        return params;
    };


    // Old
    // var createCashOutRequest = function (params, cb) {
    //     var dataToInsert = {};
    //     dataToInsert.points = params.playerResult.points;
    //     dataToInsert.name = params.playerResult.firstName;
    //     dataToInsert.userName = params.playerResult.userName;
    //     dataToInsert.playerId = params.playerResult.playerId;
    //     dataToInsert.profile = "Player";
    //     dataToInsert.currentDepositChips = params.currentDepositChips;
    //     dataToInsert.amount = params.realChips;
    //     dataToInsert.netAmount = params.realChips - params.tds
    //     dataToInsert.type = "Total Chips";
    //     dataToInsert.requesttype = "Cash Out";
    //     dataToInsert.affilateId = params.affilateResult.userName;
    //     dataToInsert.nameOnAccount = params.WithdrawAcName || "N/A",
    //         dataToInsert.accountNumber = params.WithdrawAcNumber || "N/A"
    //     dataToInsert.ifcsCode = params.WithdrawAcIfsc || "N/A"
    //     dataToInsert.bankName = params.WithdrawAcBank || "N/A"
    //     dataToInsert.branchName = params.WithdrawAcBranch || "N/A"
    //     dataToInsert.accountType = params.WithdrawAcType || "N/A"
    //     dataToInsert.tds = params.tds;
    //     dataToInsert.createdAt = Number(new Date());
    //     adminDb.craeteCashoutRequestForPlayerThroughGame(dataToInsert, function (err, resultHistory) {
    //         // console.error(err,resultHistory); 
    //         let playerDatas = {};
    //         playerDatas.playerId = params.playerResult.playerId;
    //         playerDatas.realChips = params.playerResult.realChips;
    //         playerDatas.realChipBonus = params.playerResult.realChipBonus;
    //         playerDatas.totalBalance = params.playerResult.realChips + params.playerResult.realChipBonus
    //         if (resultHistory) {
    //             var content = {};
    //             content.name = params.playerResult.firstName;
    //             content.fullname = params.playerResult.firstName + ' ' + params.playerResult.lastName;
    //             content.userName = params.playerResult.userName;
    //             content.cashoutamount = params.cashOutAmount;
    //             content.affiliateName = params.affilateResult.name;
    //             var subjectAffiliate = "Cashout request from " + content.fullname + " (" + content.userName + ") for " + content.cashoutamount + " points";
    //             var mailDataAffiliate = createMailData({ content: content, toEmail: params.affilateResult.email, from_email: stateOfX.mailMessages.from_email.toString(), subject: subjectAffiliate, template: 'CashoutByPlayerMailToAffiliate' })
    //             var mailData = createMailData({ content: content, toEmail: params.playerResult.emailId, from_email: stateOfX.mailMessages.from_email.toString(), subject: "Cashout Request", template: 'cashoutPlayerMail' })
    //             sharedModule.sendMailWithHtml(mailData, function (result) {
    //                 // if (result.success) {
    //                 //   cb(null, params);
    //                 // } else {
    //                 //   cb(null, params);
    //                 // }
    //             })
    //             //for affiliate email send
    //             sharedModule.sendMailWithHtml(mailDataAffiliate, function (result) {
    //                 // if (result.success) {
    //                 //   cb(null, params);
    //                 // } else {
    //                 //   cb(null, params);
    //                 // }
    //             })
    //         }
    //         cb(null, params);
    //     });
    // }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    createMailData(params) {
        let mailData: any = {}
        mailData.from_email = stateOfX.mailMessages.from_email.toString()
        mailData.to_email = params.toEmail
        mailData.subject = params.subject
        mailData.content = params.content
        mailData.template = params.template
        return mailData;
    }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    // process player cashout - all steps
    // New
    async processCashout(params: any): Promise<any> {
        try {
            const step1 = await this.initializeParams(params);
            const step2 = await this.findPlayer(step1);
            const step3 = await this.cashOutValid(step2);
            const step4 = await this.findAffilate(step3);
            const step5 = await this.deductChips(step4);
            const step6 = await this.findBankDetails(step5);
            const step7 = await this.generateWithdrawlRequest(step6);
            const step8 = await this.createCashOutRequest(step7);

            console.log(step8);

            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve({
                        success: true,
                        info: "CashOut Request Generated Successfully",
                        playerChips: step8.playerResult.realChips,
                        affUsername: step8.playerResult.userName,
                        affMobileNo: step8.affilateResult.mobile,
                        cashOutAmount: step8.realChips
                    });
                }, 500);
            });

        } catch (err) {
            console.log("err", err);
            throw err;
        }
    }


    // Old
    // cashOutForPlayer.prototype.processCashout = function (params, cb) {
    //     async.waterfall([
    //         async.apply(initializeParams, params),
    //         findPlayer,
    //         cashOutValid,
    //         findAffilate,
    //         deductChips,
    //         findBankDetails,
    //         generateWithdrawlRequest,
    //         createCashOutRequest,
    //     ], function (err, data) {
    //         console.log("err, data", err, data)

    //         if (err) {
    //             cb(err);
    //         } else {
    //             console.log(data);
    //             setTimeout(() => {
    //                 cb({ success: true, info: "CashOut Request Generated Successfully", playerChips: data.playerResult.realChips, affUsername: data.playerResult.userName, affMobileNo: data.affilateResult.mobile, cashOutAmount: data.realChips });
    //             }, 500)
    //         }
    //     });
    // } 
    /*============================  END  =================================*/


















}