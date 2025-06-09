import { Injectable } from "@nestjs/common";
import { popupTextManager, stateOfX } from "shared/common";
import { PokerDatabaseService } from "shared/common/datebase/pokerdatabase.service";
import _ from 'underscore';
import shortid from 'shortid32';
import { UtilsService } from "../../utils/utils.service";








@Injectable()
export class RewardRakeService {
    private messages = popupTextManager.falseMessages;
    private dbMessages = popupTextManager.dbQyeryInfo;

    constructor(
        private readonly db: PokerDatabaseService,
        private readonly utilsService: UtilsService
    ) { }





    /*===================================== START ============================*/
    // this is the function
    // which distributes rake to affiliates or
    // sub-affiliates if needed
    // - process rake to affiliate or sub affiliate
    // New
    async processRaketoAffiliate(params: any): Promise<any> {

        if (!params.isParentUserName) {
            return params;
        }

        let affdata: any = {};
        if (!params.rakeBack) {
            params.rakeBack = 0;
        }

        affdata.userName = params.isParentUserName;

        const subAffUserData = await this.db.getUser(affdata);
        if (!subAffUserData) {
            return params;
        }

        if (subAffUserData?.parentUser) {
            affdata.userName = subAffUserData.parentUser;

            let affUserData;
            try {
                affUserData = await this.db.getUser(affdata);
            } catch (err) {
                throw {
                    success: false,
                    info: this.dbMessages.DB_FINDAFFILIATE_FAILED_REWARDRAKE,
                    isRetry: false,
                    isDisplay: true,
                    channelId: "",
                    errorId: "dbQyeryInfo.DB_FINDAFFILIATE_FAILED_REWARDRAKE"
                };
            }

            const subaffuserdata = affUserData;
            const affuserdata = subAffUserData;

            const playerRakeBackTemp = (params.rakeBack > 0) ? (params.playerRake * params.rakeBack) / 100 : 0;
            params.playerRakeBack = this.utilsService.roundOff(playerRakeBackTemp);

            const affAmount1 = Number((params.playerRake * subaffuserdata.rakeCommision) / 100);
            let affAmount = this.utilsService.roundOff(affAmount1);

            const subaffAmount1 = Number((params.playerRake * affuserdata.rakeCommision) / 100);
            let subaffAmount = this.utilsService.roundOff(subaffAmount1);
            subaffAmount -= params.playerRakeBack;

            affAmount = Number(affAmount - subaffAmount - params.playerRakeBack);

            const transactiondata = {
                transactionid: params.transactionid,
                transactionByUserid: params.playerId,
                transactionByName: params.userName,
                transactionByRole: 'Player',
                transactionToUserid: affuserdata._id,
                transactionToName: affuserdata.name,
                transactionToRole: affuserdata.role,
                transactionToAmount: subaffAmount,
                fundtransactionType: 'Debit',
                transactionReason: 'Rake',
                transactionAction: 'Completed',
                transactionStatus: "Completed",
                addeddate: new Date().getTime()
            };

            await this.transactionhistroy(transactiondata);
            await this.manageaffandsubaffrakebal(affuserdata._id, subaffAmount);
            await this.managecompanyrakebal(subaffAmount);

            const admindata = {
                transactionid: params.transactionid,
                transactionByUserid: params.playerId,
                transactionByName: 'Company',
                transactionByRole: 'admin',
                transactionByAmount: subaffAmount,
                fundtransactionType: 'Credit',
                transactionReason: 'Rake',
                transactionAction: 'Completed',
                transactionStatus: "Completed",
                addeddate: new Date().getTime()
            };
            await this.transactionhistroy(admindata);

            const subaffdata = {
                transactionid: params.transactionid,
                transactionByUserid: params.playerId,
                transactionByName: params.userName,
                transactionByRole: 'Player',
                transactionToUserid: subaffuserdata._id,
                transactionToName: subaffuserdata.name,
                transactionToRole: subaffuserdata.role,
                transactionToAmount: affAmount,
                fundtransactionType: 'Debit',
                transactionReason: 'Rake',
                transactionAction: 'Completed',
                transactionStatus: "Completed",
                addeddate: new Date().getTime()
            };

            await this.ransactionhistroy(subaffdata);
            await this.manageaffandsubaffrakebal(subaffuserdata._id, affAmount);
            await this.managecompanyrakebal(affAmount);

            const subadmindata = {
                transactionid: params.transactionid,
                transactionByUserid: params.playerId,
                transactionByName: params.userName,
                transactionByRole: 'Player',
                transactionToName: 'Company',
                transactionToRole: 'admin',
                transactionToAmount: affAmount,
                fundtransactionType: 'Credit',
                transactionReason: 'Rake',
                transactionAction: 'Completed',
                transactionStatus: "Completed",
                addeddate: new Date().getTime()
            };
            await this.transactionhistroy(subadmindata);

            const fundrake = {
                rakeRefType: params.rakeRefType,
                rakeRefVariation: params.rakeRefVariation,
                channelId: params.channelId,
                channelName: params.channelName,
                rakeRefSubType: params.rakeRefSubType,
                rakeRefId: params.rakeRefId,
                transactionid: params.transactionid,
                rakeByUserid: params.playerId,
                rakeByName: params.firstName + " " + params.lastName,
                megaCircle: params.statistics.megaPointLevel,
                megaPoints: params.statistics.megaPoints,
                rakeByUsername: params.userName,
                amount: params.playerRakeOriginalBeforGST,
                amountGST: params.playerRakeOriginal,
                debitToCompany: Number(params.playerRakeOriginal - (affAmount + subaffAmount + params.playerRakeBack)),
                GST: params.GST2,
                debitToSubaffiliateid: (affuserdata._id).toString(),
                debitToSubaffiliatename: affuserdata.userName,
                debitToSubaffiliateamount: subaffAmount,
                debitToAffiliateid: (subaffuserdata._id).toString(),
                debitToAffiliatename: subaffuserdata.userName,
                debitToAffiliateamount: affAmount,
                playerRakeBack: params.playerRakeBack,
                playerRakeBackPercent: params.rakeBack,
                addeddate: new Date().getTime()
            };

            params.parentUserType = "Sub-Affiliate";
            await this.managerakefund(fundrake);
            return params;

        } else {
            const subaffuserdata = subAffUserData;
            const playerRakeBackTemp = (params.rakeBack > 0) ? (params.playerRake * params.rakeBack) / 100 : 0;
            params.playerRakeBack = this.utilsService.roundOff(playerRakeBackTemp);

            const affAmount1 = Number((params.playerRake * subaffuserdata.rakeCommision) / 100);
            let affAmount = this.utilsService.roundOff(affAmount1);
            affAmount -= params.playerRakeBack;

            const transactiondata = {
                transactionid: params.transactionid,
                transactionByUserid: params.playerId,
                transactionByName: params.userName,
                transactionByRole: 'Player',
                transactionToUserid: subaffuserdata._id,
                transactionToName: subaffuserdata.name,
                transactionToRole: subaffuserdata.role,
                transactionByAmount: affAmount,
                fundtransactionType: 'Debit',
                transactionReason: 'Rake',
                transactionAction: 'Completed',
                transactionStatus: "Completed",
                addeddate: new Date().getTime()
            };

            await this.transactionhistroy(transactiondata);
            await this.manageaffandsubaffrakebal(subaffuserdata._id, affAmount);
            await this.managecompanyrakebal(affAmount);

            const admindata = {
                transactionid: params.transactionid,
                transactionByUserid: params.playerId,
                transactionByName: params.userName,
                transactionByRole: 'Player',
                transactionToName: 'Company',
                transactionToRole: 'admin',
                transactionToAmount: affAmount,
                fundtransactionType: 'Credit',
                transactionReason: 'Rake',
                transactionAction: 'Completed',
                transactionStatus: "Completed",
                addeddate: new Date().getTime()
            };
            await this.transactionhistroy(admindata);

            const fundrake = {
                rakeRefType: params.rakeRefType,
                rakeRefVariation: params.rakeRefVariation,
                channelId: params.channelId,
                channelName: params.channelName,
                rakeRefSubType: params.rakeRefSubType,
                rakeRefId: params.rakeRefId,
                transactionid: params.transactionid,
                rakeByUserid: params.playerId,
                rakeByName: params.firstName + " " + params.lastName,
                megaCircle: params.statistics.megaPointLevel,
                megaPoints: params.statistics.megaPoints,
                rakeByUsername: params.userName,
                amount: params.playerRakeOriginalBeforGST,
                amountGST: params.playerRakeOriginal,
                debitToCompany: Number(params.playerRakeOriginal - affAmount - params.playerRakeBack),
                GST: params.GST2,
                debitToAffiliateid: (subaffuserdata._id).toString(),
                debitToAffiliatename: subaffuserdata.userName,
                debitToAffiliateamount: affAmount,
                playerRakeBack: params.playerRakeBack,
                playerRakeBackPercent: params.rakeBack,
                addeddate: new Date().getTime()
            };

            params.parentUserType = "Affiliate";
            await this.managerakefund(fundrake);
            return params;
        }
    }


    // Old
    // var processRaketoAffiliate = function (params, callback) {
    //     serverLog(stateOfX.serverLogType.info, 'processRaketoAffiliate' + JSON.stringify(params));
    //     //if player has no any parenets;
    //     if (!params.isParentUserName) { //if user has been directly under admin
    //         callback(null, params);
    //         return;
    //     }
    //     var affdata = {};
    //     if (!!params.rakeBack) {
    //         console.error(params.rakeBack);
    //     } else {
    //         params.rakeBack = 0;
    //     }
    //     affdata.userName = params.isParentUserName;

    //     admindb.getUser(affdata, function (err, subAffUserData) {
    //         if (!subAffUserData) { //if user has been directly under admin
    //             callback(null, params);
    //             return;
    //         }
    //         //console.error(subAffUserData);
    //         if (err) {
    //             serverLog(stateOfX.serverLogType.info, 'error on rakeCommision' + JSON.stringify(err));
    //             return callback({ success: false, info: messages.DISTRIBUTERAKE_FAILED_REWARDRAKE, isRetry: false, isDisplay: false, channelId: "", errorId: "falseMessages.DISTRIBUTERAKE_FAILED_REWARDRAKE" });
    //         }
    //         var transactiondata = {}, affAmount = 0, subaffAmount = 0, adminAmount = 0, admindata = {};
    //         serverLog(stateOfX.serverLogType.info, "subaffuserdata" + JSON.stringify(subAffUserData));
    //         if (subAffUserData?.parentUser) {
    //             //previous user is sub affiliate needs to process previosly aff
    //             affdata.userName = subAffUserData.parentUser;
    //             admindb.getUser(affdata, function (err, affUserData) {
    //                 if (err) {
    //                     callback({ success: false, info: dbMessages.DB_FINDAFFILIATE_FAILED_REWARDRAKE, isRetry: false, isDisplay: true, channelId: "", errorId: "dbQyeryInfo.DB_FINDAFFILIATE_FAILED_REWARDRAKE" })
    //                 } else {
    //                     var subaffuserdata = affUserData;
    //                     var affuserdata = subAffUserData;
    //                     //manage affiliate data
    //                     var playerRakeBackTemp = 0;
    //                     if (params.rakeBack > 0) {
    //                         playerRakeBackTemp = (params.playerRake * params.rakeBack) / 100;
    //                         // params.playerRakeBack = (Math.ceil(playerRakeBackTemp)-playerRakeBackTemp==0.5 && Math.ceil(playerRakeBackTemp)%2 != 0) ? Math.floor(playerRakeBackTemp) : Math.round(playerRakeBackTemp);
    //                         params.playerRakeBack = roundOff(playerRakeBackTemp);
    //                     } else {
    //                         params.playerRakeBack = 0;
    //                     }
    //                     var affAmount1 = Number((params.playerRake * subaffuserdata.rakeCommision) / 100);
    //                     // affAmount = (Math.ceil(affAmount1)-affAmount1==0.5 && Math.ceil(affAmount1)%2 != 0) ? Math.floor(affAmount1) : Math.round(affAmount1);
    //                     affAmount = roundOff(affAmount1);
    //                     console.error(params.playerRake, " %%%%%%%%%%&&&&&&&&&&&&&&&&&&& ", subaffAmount, " @@@@@@@@@@@@@@@@@@@@@@@@@@@ ", affAmount);
    //                     //adminAmount 	= Number(params.playerRake - affAmount);
    //                     var subaffAmount1 = Number((params.playerRake * affuserdata.rakeCommision) / 100);//Number((affAmount * affuserdata.rakeCommision)/100) ;
    //                     // subaffAmount = (Math.ceil(subaffAmount1)-subaffAmount1==0.5 && Math.ceil(subaffAmount1)%2 != 0) ? Math.floor(subaffAmount1) : Math.round(subaffAmount1);
    //                     subaffAmount = roundOff(subaffAmount1);
    //                     subaffAmount = subaffAmount - params.playerRakeBack;
    //                     //console.error( params.playerRake," %%%%%%%%%%&&&&&&&&&&&&&&&&&&& ",subaffAmount , " @@@@@@@@@@@@@@@@@@@@@@@@@@@ ", affAmount);
    //                     affAmount = Number(affAmount - subaffAmount - params.playerRakeBack);
    //                     //console.error( params.playerRake," %%%%%%%%%%&&&&&&&&&&&&&&&&&&& ",subaffuserdata.rakeCommision , " @@@@@@@@@@@@@@@@@@@@@@@@@@@ ", subaffuserdata.rakeCommision);
    //                     //console.error( params.playerRake," %%%%%%%%%%&&&&&&&&&&&&&&&&&&& ",subaffAmount , " @@@@@@@@@@@@@@@@@@@@@@@@@@@ ", affAmount);
    //                     transactiondata.transactionid = params.transactionid;
    //                     transactiondata.transactionByUserid = params.playerId;
    //                     transactiondata.transactionByName = params.userName;
    //                     transactiondata.transactionByRole = 'Player';

    //                     transactiondata.transactionToUserid = affuserdata._id;
    //                     transactiondata.transactionToName = affuserdata.name;
    //                     transactiondata.transactionToRole = affuserdata.role;
    //                     transactiondata.transactionToAmount = subaffAmount;
    //                     transactiondata.fundtransactionType = 'Debit';
    //                     transactiondata.transactionReason = 'Rake';
    //                     transactiondata.transactionAction = 'Completed';
    //                     transactiondata.transactionStatus = "Completed";
    //                     transactiondata.addeddate = new Date().getTime();
    //                     transactionhistroy(transactiondata, function (res) {
    //                         //process to balance on affiliate
    //                         manageaffandsubaffrakebal(affuserdata._id, subaffAmount, function (res) {
    //                             //decrease comp bal
    //                             managecompanyrakebal(subaffAmount, function (res) {
    //                                 //process transaction histroy to admin
    //                                 admindata.transactionid = params.transactionid;
    //                                 admindata.transactionByUserid = params.playerId;
    //                                 admindata.transactionByName = params.userName;
    //                                 admindata.transactionByRole = 'Player';
    //                                 admindata.transactionByName = 'Company';
    //                                 admindata.transactionByRole = 'admin';
    //                                 admindata.transactionByAmount = subaffAmount;
    //                                 admindata.fundtransactionType = 'Credit';
    //                                 admindata.transactionReason = 'Rake';
    //                                 admindata.transactionAction = 'Completed';
    //                                 admindata.transactionStatus = "Completed";
    //                                 admindata.addeddate = new Date().getTime();
    //                                 transactionhistroy(admindata, function (res) {

    //                                 })
    //                             });

    //                         })
    //                     });
    //                     // process to sub affiliate data
    //                     var subaffdata = {}
    //                     subaffdata.transactionid = params.transactionid;
    //                     subaffdata.transactionByUserid = params.playerId;
    //                     subaffdata.transactionByName = params.userName;
    //                     subaffdata.transactionByRole = 'Player';

    //                     subaffdata.transactionToUserid = subaffuserdata._id;
    //                     subaffdata.transactionToName = subaffuserdata.name;
    //                     subaffdata.transactionToRole = subaffuserdata.role;
    //                     subaffdata.transactionToAmount = affAmount;
    //                     subaffdata.fundtransactionType = 'Debit';
    //                     subaffdata.transactionReason = 'Rake';
    //                     subaffdata.transactionAction = 'Completed';
    //                     subaffdata.transactionStatus = "Completed";
    //                     subaffdata.addeddate = new Date().getTime();
    //                     transactionhistroy(subaffdata, function (res) {
    //                         //process to balance on affiliate
    //                         manageaffandsubaffrakebal(subaffuserdata._id, affAmount, function (res) {
    //                             //decrease comp bal
    //                             managecompanyrakebal(affAmount, function (res) {
    //                                 //process transaction histroy to admin
    //                                 var subadmindata = {};
    //                                 subadmindata.transactionid = params.transactionid;
    //                                 subadmindata.transactionByUserid = params.playerId;
    //                                 subadmindata.transactionByName = params.userName;
    //                                 subadmindata.transactionByRole = 'Player';
    //                                 subadmindata.transactionToName = 'Company';
    //                                 subadmindata.transactionToRole = 'admin';
    //                                 subadmindata.transactionToAmount = affAmount;
    //                                 subadmindata.fundtransactionType = 'Credit';
    //                                 subadmindata.transactionReason = 'Rake';
    //                                 subadmindata.transactionAction = 'Completed';
    //                                 subadmindata.transactionStatus = "Completed";
    //                                 subadmindata.addeddate = new Date().getTime();
    //                                 transactionhistroy(subadmindata, function (res) {

    //                                 })
    //                             });


    //                         })
    //                     });
    //                     //fund rate date entry
    //                     serverLog(stateOfX.serverLogType.info, 'paramsparamsparamsparams', JSON.stringify(params));
    //                     var fundrake = {};
    //                     fundrake.rakeRefType = params.rakeRefType;
    //                     fundrake.rakeRefVariation = params.rakeRefVariation;
    //                     fundrake.channelId = params.channelId;
    //                     fundrake.channelName = params.channelName;
    //                     fundrake.rakeRefSubType = params.rakeRefSubType;
    //                     fundrake.rakeRefId = params.rakeRefId;
    //                     fundrake.transactionid = params.transactionid;
    //                     fundrake.rakeByUserid = params.playerId;
    //                     fundrake.rakeByName = params.firstName + " " + params.lastName;
    //                     fundrake.megaCircle = params.statistics.megaPointLevel;
    //                     fundrake.megaPoints = params.statistics.megaPoints;
    //                     fundrake.rakeByUsername = params.userName;
    //                     fundrake.amount = params.playerRakeOriginalBeforGST;
    //                     fundrake.amountGST = params.playerRakeOriginal;
    //                     var tempAmount = Number(params.playerRakeOriginal - (affAmount + subaffAmount + params.playerRakeBack));
    //                     //var tempAmount1 = (Math.ceil(tempAmount)-tempAmount==0.5 && Math.ceil(tempAmount)%2 != 0) ? Math.floor(tempAmount) : Math.round(tempAmount);
    //                     fundrake.debitToCompany = tempAmount;
    //                     fundrake.GST = params.GST2;
    //                     fundrake.debitToSubaffiliateid = (affuserdata._id).toString();
    //                     fundrake.debitToSubaffiliatename = affuserdata.userName
    //                     fundrake.debitToSubaffiliateamount = subaffAmount;
    //                     fundrake.debitToAffiliateid = (subaffuserdata._id).toString();
    //                     fundrake.debitToAffiliatename = subaffuserdata.userName;
    //                     fundrake.debitToAffiliateamount = affAmount;
    //                     if (params.playerRakeBack > 0) {
    //                         fundrake.playerRakeBack = params.playerRakeBack;
    //                         fundrake.playerRakeBackPercent = params.rakeBack;
    //                         params.parentUserType = "Sub-Affiliate";
    //                     }
    //                     fundrake.addeddate = new Date().getTime();
    //                     managerakefund(fundrake, function (res) { })
    //                     callback(null, params);
    //                 }
    //             })
    //         } else {
    //             var subaffuserdata = subAffUserData;
    //             var playerRakeBackTemp = 0;
    //             if (params.rakeBack > 0) {
    //                 playerRakeBackTemp = (params.playerRake * params.rakeBack) / 100;
    //                 // params.playerRakeBack = (Math.ceil(playerRakeBackTemp)-playerRakeBackTemp==0.5 && Math.ceil(playerRakeBackTemp)%2 != 0) ? Math.floor(playerRakeBackTemp) : Math.round(playerRakeBackTemp);
    //                 params.playerRakeBack = roundOff(playerRakeBackTemp);
    //             } else {
    //                 params.playerRakeBack = 0;
    //             }
    //             //previous user is affiliate direly process to aff & admin
    //             var affAmount1 = Number((params.playerRake * subaffuserdata.rakeCommision) / 100);

    //             // affAmount = (Math.ceil(affAmount1)-affAmount1==0.5 && Math.ceil(affAmount1)%2 != 0) ? Math.floor(affAmount1) : Math.round(affAmount1);
    //             affAmount = roundOff(affAmount1);
    //             console.error(params.playerRake, " @@@@@@@@@@@@@@@@@@@@@@ ", affAmount);
    //             affAmount = affAmount - params.playerRakeBack;
    //             //console.error(params.playerRake," @@@@@@@@@@@@@@@@@@@@@@ ", subaffuserdata.rakeCommision);
    //             transactiondata.transactionid = params.transactionid;
    //             transactiondata.transactionByUserid = params.playerId;
    //             transactiondata.transactionByName = params.userName;
    //             transactiondata.transactionByRole = 'Player';
    //             transactiondata.transactionToUserid = subaffuserdata._id;
    //             transactiondata.transactionToName = subaffuserdata.name;
    //             transactiondata.transactionToRole = subaffuserdata.role;
    //             transactiondata.transactionByAmount = affAmount;
    //             transactiondata.fundtransactionType = 'Debit';
    //             transactiondata.transactionReason = 'Rake';
    //             transactiondata.transactionAction = 'Completed';
    //             transactiondata.transactionStatus = "Completed";
    //             transactiondata.addeddate = new Date().getTime();

    //             transactionhistroy(transactiondata, function (res) {
    //                 //process to balance on affiliate
    //                 manageaffandsubaffrakebal(subaffuserdata._id, affAmount, function (res) {
    //                     //	serverLog(stateOfX.serverLogType.info, 'get after rake update'+res)
    //                     //drcrease company bal
    //                     managecompanyrakebal(affAmount, function (res) {
    //                         //manage admin transaction histroy
    //                         admindata.transactionid = params.transactionid;
    //                         admindata.transactionByUserid = params.playerId;
    //                         admindata.transactionByName = params.userName;
    //                         admindata.transactionByRole = 'Player';
    //                         admindata.transactionToName = 'Company';
    //                         admindata.transactionToRole = 'admin';
    //                         admindata.transactionToAmount = affAmount;
    //                         admindata.fundtransactionType = 'Credit';
    //                         admindata.transactionReason = 'Rake';
    //                         admindata.transactionAction = 'Completed';
    //                         admindata.transactionStatus = "Completed";
    //                         admindata.addeddate = new Date().getTime();
    //                         transactionhistroy(admindata, function (res) {

    //                         })
    //                     })
    //                     //manage fund rake from table
    //                     serverLog(stateOfX.serverLogType.info, 'paramsparamsparamsparams', JSON.stringify(params));
    //                     var fundrake = {};
    //                     fundrake.rakeRefType = params.rakeRefType;
    //                     fundrake.rakeRefVariation = params.rakeRefVariation;
    //                     fundrake.channelId = params.channelId;
    //                     fundrake.channelName = params.channelName;
    //                     fundrake.rakeRefSubType = params.rakeRefSubType;
    //                     fundrake.rakeRefId = params.rakeRefId;
    //                     fundrake.transactionid = params.transactionid;
    //                     fundrake.rakeByUserid = params.playerId;
    //                     fundrake.rakeByName = params.firstName + " " + params.lastName;
    //                     fundrake.megaCircle = params.statistics.megaPointLevel;
    //                     fundrake.megaPoints = params.statistics.megaPoints;
    //                     fundrake.rakeByUsername = params.userName;
    //                     fundrake.amount = params.playerRakeOriginalBeforGST;
    //                     fundrake.amountGST = params.playerRakeOriginal;
    //                     var tempAmount = Number(params.playerRakeOriginal - affAmount - params.playerRakeBack);
    //                     //var tempAmount1 = (Math.ceil(tempAmount)-tempAmount==0.5 && Math.ceil(tempAmount)%2 != 0) ? Math.floor(tempAmount) : Math.round(tempAmount);
    //                     fundrake.debitToCompany = tempAmount;
    //                     fundrake.GST = params.GST2;
    //                     fundrake.debitToAffiliateid = (subaffuserdata._id).toString();
    //                     fundrake.debitToAffiliatename = subaffuserdata.userName
    //                     fundrake.debitToAffiliateamount = affAmount;
    //                     if (params.playerRakeBack > 0) {
    //                         fundrake.playerRakeBack = params.playerRakeBack;
    //                         fundrake.playerRakeBackPercent = params.rakeBack;
    //                         params.parentUserType = "Affiliate";
    //                     }
    //                     fundrake.addeddate = new Date().getTime();
    //                     managerakefund(fundrake, function (res) { })
    //                     callback(null, params);
    //                 })

    //             });

    //         }
    //     })
    // }
    /*===================================== END ============================*/

    /*===================================== START ============================*/
    // create Player RakeBack For Player
    // insert record
    // New
    async processPlayerRakeBack(params: any): Promise<any> {
        const playerRakeBackData: any = {};
        playerRakeBackData.rakeByUserid = params.playerId;
        playerRakeBackData.rakeByName = params.firstName + " " + params.lastName;
        playerRakeBackData.rakeByUsername = params.userName;
        playerRakeBackData.amount = params.playerRakeOriginalBeforGST;
        playerRakeBackData.amountGST = params.playerRakeOriginal;
        playerRakeBackData.rakeBack = params.rakeBack;
        playerRakeBackData.playerRakeBack = params.playerRakeBack;
        playerRakeBackData.addedDate = this.utilsService.dateToEpoch(Date.now()); // +21600000;
        playerRakeBackData.parentUser = params.isParentUserName;
        playerRakeBackData.handsPlayed = 1;
        playerRakeBackData.emailId = params.emailId;
        playerRakeBackData.referenceNumber = shortid.generate().toUpperCase();
        playerRakeBackData.transfer = false;

        if (params.playerRakeBack > 0) {
            playerRakeBackData.playerRakeBack = params.playerRakeBack;
            await this.managecompanyrakebal(params.playerRakeBack);
            await this.db.playerRakeBack(playerRakeBackData);
        }

        return params;
    }


    // Old
    // var processPlayerRakeBack = function (params, cb) {
    //     var playerRakeBackData = {};
    //     playerRakeBackData.rakeByUserid = params.playerId;
    //     playerRakeBackData.rakeByName = params.firstName + " " + params.lastName;
    //     playerRakeBackData.rakeByUsername = params.userName;
    //     playerRakeBackData.amount = params.playerRakeOriginalBeforGST;
    //     playerRakeBackData.amountGST = params.playerRakeOriginal;
    //     playerRakeBackData.rakeBack = params.rakeBack;
    //     playerRakeBackData.playerRakeBack = params.playerRakeBack;
    //     playerRakeBackData.addedDate = dateToEpoch(Number(new Date())); //+ 21600000;
    //     playerRakeBackData.parentUser = params.isParentUserName;
    //     playerRakeBackData.handsPlayed = 1;
    //     playerRakeBackData.emailId = params.emailId;
    //     playerRakeBackData.referenceNumber = shortid.generate().toUpperCase();
    //     playerRakeBackData.transfer = false;

    //     if (params.playerRakeBack > 0) {
    //         playerRakeBackData.playerRakeBack = params.playerRakeBack;
    //         managecompanyrakebal(params.playerRakeBack, function (res) {
    //             financeDB.playerRakeBack(playerRakeBackData, function (err, result) {
    //                 cb(null, params);

    //             });
    //         });
    //     } else {
    //         cb(null, params);
    //     }
    // }
    /*===================================== END ============================*/


    /*===================================== START ============================*/
    // distribute rake - main function
    // process GST, player rake back,
    // rake to sub affiliate
    // rake to affiliate
    // rake to admin
    // New
    async distributeRake(params: any): Promise<any> {
        params.loyalityList = [];
        const playerdata = params.rakeToAffiliates.players;

        if (playerdata.length === 0) {
            return params;
        }

        try {
            for (const playerdetails of playerdata) {
                playerdetails.rakeRefType = params.rakeToAffiliates.rakeRefType;
                playerdetails.rakeRefVariation = params.rakeToAffiliates.rakeRefVariation;
                playerdetails.rakeRefSubType = params.rakeToAffiliates.rakeRefSubType;
                playerdetails.rakeRefId = params.rakeToAffiliates.rakeRefId;
                playerdetails.channelId = params.table.channelId;
                playerdetails.channelName = params.table.channelName;

                const GSTAmount1Temp = (playerdetails.rakeAmount / (100 + 28)) * 0;
                const GSTAmount1 = this.utilsService.roundOff(GSTAmount1Temp);
                playerdetails.rakeAmount1 = playerdetails.rakeAmount - GSTAmount1;

                const GSTAmount2Temp = (playerdetails.rakeAmountOriginal / (100 + 28)) * 0;
                const GSTAmount2 = this.utilsService.roundOff(GSTAmount2Temp);
                playerdetails.rakeAmountOriginal1 = playerdetails.rakeAmountOriginal - GSTAmount2;

                playerdetails.GST1 = GSTAmount1;
                playerdetails.GST2 = GSTAmount2;


                try {
                    const playerParent = await this.findPlayerParentforRake(playerdetails);
                    const chkResult = await this.chkProcessforRake(playerParent);
                    const affiliateResult = await this.processRaketoAffiliate(chkResult);
                    const rakeBackResult = await this.processPlayerRakeBack(affiliateResult);

                    const loyalityPlayer = rakeBackResult?.result?.loyalityListAmount?.[0] ?? {};

                    if (Object.keys(loyalityPlayer).length > 0) {
                        params.loyalityList.push(loyalityPlayer);
                    }

                } catch (err: any) {

                    if (err.success) {
                        throw {
                            status: true,
                            info: this.messages.COMMISIONDISTRIBUTION_SUCCESS_REWARDRAKE,
                            isRetry: false,
                            isDisplay: false,
                            channelId: "",
                            errorId: "falseMessages.COMMISIONDISTRIBUTION_SUCCESS_REWARDRAKE"
                        };
                    } else {
                        throw {
                            status: false,
                            info: this.messages.COMMISIONDISTRIBUTION_FAILED_REWARDRAKE + JSON.stringify(err),
                            isRetry: false,
                            isDisplay: false,
                            channelId: "",
                            errorId: "falseMessages.COMMISIONDISTRIBUTION_FAILED_REWARDRAKE"
                        };
                    }
                }
            }

            return params;

        } catch (err) {
            throw {
                status: false,
                info: this.messages.DISTRIBUTERAKE_FAILED_REWARDRAKE,
                isRetry: false,
                isDisplay: false,
                channelId: "",
                errorId: "falseMessages.DISTRIBUTERAKE_FAILED_REWARDRAKE"
            };
        }
    }


    // Old
    // var distributeRake = function (params, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'params.rakeToAffiliates - ' + JSON.stringify(params.rakeToAffiliates));
    //     //console.error("1111111111111111!!!!!!!!!!!!!!!!!!!!!!@@@@@@@@@@@@@@@",params.table);
    //     params.loyalityList = [];
    //     var playerdata = params.rakeToAffiliates.players;
    //     serverLog(stateOfX.serverLogType.info, 'player length' + playerdata.length);
    //     if (playerdata.length > 0) {
    //         async.eachSeries(playerdata, function (playerdetails, callback) {
    //             playerdetails.rakeRefType = params.rakeToAffiliates.rakeRefType;
    //             playerdetails.rakeRefVariation = params.rakeToAffiliates.rakeRefVariation;
    //             playerdetails.rakeRefSubType = params.rakeToAffiliates.rakeRefSubType;
    //             playerdetails.rakeRefId = params.rakeToAffiliates.rakeRefId;
    //             playerdetails.channelId = params.table.channelId;
    //             playerdetails.channelName = params.table.channelName;
    //             var GSTAmount1Temp = (playerdetails.rakeAmount / (100 + 28)) * 0;
    //             // var GSTAmount1 = Math.round(GSTAmount1Temp * 100) / 100;
    //             var GSTAmount1 = roundOff(GSTAmount1Temp);
    //             playerdetails.rakeAmount1 = playerdetails.rakeAmount - GSTAmount1;
    //             var GSTAmount2Temp = (playerdetails.rakeAmountOriginal / (100 + 28)) * 0;
    //             // var GSTAmount2 = Math.round(GSTAmount2Temp * 100) / 100;
    //             var GSTAmount2 = roundOff(GSTAmount2Temp);
    //             playerdetails.rakeAmountOriginal1 = playerdetails.rakeAmountOriginal - GSTAmount2;
    //             playerdetails.GST1 = GSTAmount1;
    //             playerdetails.GST2 = GSTAmount2;

    //             serverLog(stateOfX.serverLogType.info, 'transactionid transactionidtransactionid' + JSON.stringify(playerdetails));
    //             async.waterfall([

    //                 async.apply(findPlayerParentforRake, playerdetails),
    //                 chkProcessforRake,
    //                 processRaketoAffiliate,
    //                 processPlayerRakeBack,
    //                 // chkLoyalityPointOfPlayer
    //             ], function (err, rakeResult) {

    //                 serverLog(stateOfX.serverLogType.info, 'err and result in waterfall')
    //                 serverLog(stateOfX.serverLogType.error, JSON.stringify(err))
    //                 serverLog(stateOfX.serverLogType.info, "loyalityListAmount is - " + JSON.stringify(rakeResult));
    //                 if (err) {
    //                     if (err.success) {
    //                         // callback(null, {status: true, info: "Commission Distributed !!"});
    //                         callback(null, { status: true, info: messages.COMMISIONDISTRIBUTION_SUCCESS_REWARDRAKE, isRetry: false, isDisplay: false, channelId: "", errorId: "falseMessages.COMMISIONDISTRIBUTION_SUCCESS_REWARDRAKE" });
    //                     } else {
    //                         // callback({status: false, info:"Commission Distribution failed !! - " + JSON.stringify(err)});
    //                         callback({ status: false, info: messages.COMMISIONDISTRIBUTION_FAILED_REWARDRAKE + JSON.stringify(err), isRetry: false, isDisplay: false, channelId: "", errorId: "falseMessages.COMMISIONDISTRIBUTION_FAILED_REWARDRAKE" });
    //                     }
    //                 } else {
    //                     // cb(result);
    //                     var loyalityPlayer = !!rakeResult.result && rakeResult.result.loyalityListAmount && rakeResult.result.loyalityListAmount.length > 0 ? rakeResult.result.loyalityListAmount[0] : {};
    //                     serverLog(stateOfX.serverLogType.info, "loyality player is -" + JSON.stringify(loyalityPlayer));
    //                     if (!!loyalityPlayer && Object.keys(loyalityPlayer).length > 0) {
    //                         params.loyalityList.push(loyalityPlayer);
    //                     }
    //                     // callback(null, {status: true, info: "Commission Distributed !!"});
    //                     callback(null, { status: true, info: messages.COMMISIONDISTRIBUTION_SUCCESS_REWARDRAKE, isRetry: false, isDisplay: false, channelId: "", errorId: "falseMessages.COMMISIONDISTRIBUTION_SUCCESS_REWARDRAKE" });
    //                 }
    //             });


    //         }, function (err) {
    //             if (err) {
    //                 serverLog(stateOfX.serverLogType.info, 'error on rakeCommision' + JSON.stringify(err))
    //                 // cb({status:false, info:"Error occurred while commission distribution !!"})
    //                 cb({ status: false, info: messages.DISTRIBUTERAKE_FAILED_REWARDRAKE, isRetry: false, isDisplay: false, channelId: "", errorId: "falseMessages.DISTRIBUTERAKE_FAILED_REWARDRAKE" })
    //             } else {
    //                 serverLog(stateOfX.serverLogType.info, 'commission updated & manage transaction histroy for admin')
    //                 //transaction histroy for admin bal
    //                 cb(null, params);
    //             }
    //         })
    //     } else {
    //         serverLog(stateOfX.serverLogType.info, 'No players passed for rake calculation, skipping.');
    //         cb(null, params);
    //     }
    // }
    /*===================================== END ============================*/


    /*===================================== START ============================*/
    // find player parent
    // may be sub affiliate
    // may be affiliate
    // if none then admin
    // New
    async findPlayerParentforRake(params: any): Promise<any> {

        const player = { playerId: params.playerId };

        try {
            const result = await this.db.findUser(player);

            result.playerRake = params.rakeAmount1;
            result.playerRakeBeforGST = params.rakeAmount;
            result.playerRakeOriginal = params.rakeAmountOriginal1;
            result.playerRakeOriginalBeforGST = params.rakeAmountOriginal;
            result.GST1 = params.GST1;
            result.GST2 = params.GST2;
            result.transactionid = this.uuid.v4();
            result.rakeRefType = params.rakeRefType;
            result.rakeRefVariation = params.rakeRefVariation;
            result.rakeRefSubType = params.rakeRefSubType;
            result.rakeRefId = params.rakeRefId;
            result.channelId = params.channelId;
            result.channelName = params.channelName;


            params.result = result;

            return params;
        } catch (err) {
            throw {
                success: false,
                info: this.dbMessages.DB_FINDUSER_FAILED_REWARDRAKE,
                isRetry: false,
                isDisplay: true,
                channelId: "",
                errorId: "dbQyeryInfo.DB_FINDUSER_FAILED_REWARDRAKE"
            };
        }
    }


    // Old
    // var findPlayerParentforRake = function (params, callback) {
    //     serverLog(stateOfX.serverLogType.info, 'Player info' + JSON.stringify(params));
    //     var player = {};
    //     player.playerId = params.playerId;
    //     db.findUser(player, function (err, result) {
    //         if (err) {
    //             callback({ success: false, info: dbMessages.DB_FINDUSER_FAILED_REWARDRAKE, isRetry: false, isDisplay: true, channelId: "", errorId: "dbQyeryInfo.DB_FINDUSER_FAILED_REWARDRAKE" })
    //         } else {
    //             result.playerRake = params.rakeAmount1;
    //             result.playerRakeBeforGST = params.rakeAmount;
    //             result.playerRakeOriginal = params.rakeAmountOriginal1;
    //             result.playerRakeOriginalBeforGST = params.rakeAmountOriginal;
    //             result.GST1 = params.GST1;
    //             result.GST2 = params.GST2;
    //             result.transactionid = uuid.v4();
    //             result.rakeRefType = params.rakeRefType;
    //             result.rakeRefVariation = params.rakeRefVariation;
    //             result.rakeRefSubType = params.rakeRefSubType;
    //             result.rakeRefId = params.rakeRefId;
    //             result.channelId = params.channelId;
    //             result.channelName = params.channelName;
    //             serverLog(stateOfX.serverLogType.info, 'params result', JSON.stringify(result));
    //             params.result = result;
    //             //console.log(params.result);
    //             //console.log(result);
    //             callback(null, params);
    //         }
    //     })
    // }
    /*===================================== END ============================*/

    /*===================================== START ============================*/
    // check process for rake, admin, affiliate or sub affiliate needs to process
    // New
    async chkProcessforRake(params: any): Promise<any> {
        const admindata: any = {};
        params = params.result;

        const adminAmount = params.playerRake;
        const adminAmountOriginal = params.playerRakeOriginal;

        admindata.transactionid = params.transactionid;
        admindata.transactionByUserid = params.playerId;
        admindata.transactionByName = params.userName;
        admindata.transactionByRole = 'Player';

        admindata.transactionToName = 'admin';
        admindata.transactionToRole = 'admin';
        admindata.transactionToAmount = adminAmount;
        admindata.fundtransactionType = 'Debit';
        admindata.transactionReason = 'Rake';
        admindata.transactionAction = 'Completed';
        admindata.transactionStatus = "Completed";
        admindata.addeddate = Date.now();

        await this.transactionhistroy(admindata);

        if (!params.rakeBack) {
            params.rakeBack = 0;
        } else {
            console.error(params.rakeBack);
        }

        const compbal: any = {
            balance: adminAmountOriginal,
            GST: params.GST2
        };

        if (params.isParentUserName) {
            await this.managecompanybal(compbal);
            return params;
        } else {
            if (params.rakeBack > 0) {
                const playerRakeBackTemp = (adminAmountOriginal * params.rakeBack) / 100;
                params.playerRakeBack = this.utilsService.roundOff(playerRakeBackTemp);
            } else {
                params.playerRakeBack = 0;
            }

            await this.managecompanybal(compbal);

            const fundrake: any = {
                rakeRefType: params.rakeRefType,
                rakeRefVariation: params.rakeRefVariation,
                rakeRefSubType: params.rakeRefSubType,
                channelId: params.channelId,
                channelName: params.channelName,
                transactionid: params.transactionid,
                rakeByUserid: params.playerId,
                rakeByName: params.firstName + " " + params.lastName,
                megaCircle: params.statistics?.megaPointLevel,
                megaPoints: params.statistics?.megaPoints,
                rakeByUsername: params.userName,
                amount: params.playerRakeOriginalBeforGST,
                amountGST: params.playerRakeOriginal,
                GST: params.GST2,
                debitToCompany: adminAmountOriginal - params.playerRakeBack,
                addeddate: Date.now()
            };

            if (params.playerRakeBack > 0) {
                fundrake.playerRakeBack = params.playerRakeBack;
                fundrake.playerRakeBackPercent = params.rakeBack;
                params.parentUserType = "N/A";
            }

            await this.managerakefund(fundrake);
            return params;
        }
    }


    // Old
    // var chkProcessforRake = function (params, callback) {
    //     serverLog(stateOfX.serverLogType.info, 'chkProcessforRake    ', JSON.stringify(params));
    //     //if user has parent then rake will be distributed on affiliate & sub aff also
    //     //if (params.isParent) {
    //     //	callback(null, params);
    //     //	} else {
    //     //process to directly to admin on transaction histroy
    //     //console.error("!!!!!!!!!!!!!!!!!!!!!!@@@@@@@@@@@@@@@",params);
    //     var admindata = {};
    //     var params = params.result;
    //     var adminAmount = params.playerRake;
    //     var adminAmountOriginal = params.playerRakeOriginal;
    //     admindata.transactionid = params.transactionid;
    //     admindata.transactionByUserid = params.playerId;
    //     admindata.transactionByName = params.userName;
    //     admindata.transactionByRole = 'Player';

    //     admindata.transactionToName = 'admin';
    //     admindata.transactionToRole = 'admin';
    //     admindata.transactionToAmount = adminAmount;
    //     admindata.fundtransactionType = 'Debit';
    //     admindata.transactionReason = 'Rake';
    //     admindata.transactionAction = 'Completed';
    //     admindata.transactionStatus = "Completed";
    //     admindata.addeddate = new Date().getTime();
    //     transactionhistroy(admindata, function (res) {
    //         //serverLog(stateOfX.serverLogType.info, '!!!!!!!!!!!!!!!!!!!!!'+JSON.stringify('res'))
    //         //process to balance on Company account
    //         //var CompanyId = '57bfcebef29de70c75a30659';
    //         //	serverLog(stateOfX.serverLogType.info, '@@@@@@@@@@@@@@@@@@@@@'+JSON.stringify(res));
    //         //console.error(params);
    //         if (!!params.rakeBack) {
    //             console.error("!!!!!!!!!!!@@@@@@@@@@##########$$$$$$$$$$$$$$$$$$$$");
    //             console.error("!!!!!!!!!!!@@@@@@@@@@##########$$$$$$$$$$$$$$$$$$$$");
    //             console.error(params.rakeBack);
    //             console.error("!!!!!!!!!!!@@@@@@@@@@##########$$$$$$$$$$$$$$$$$$$$");
    //             console.error("!!!!!!!!!!!@@@@@@@@@@##########$$$$$$$$$$$$$$$$$$$$");

    //         } else {
    //             params.rakeBack = 0;
    //             console.error("################################################");
    //             console.error("################################################");
    //             console.error("################################################");
    //             console.error("################################################");

    //         }
    //         if (params.isParentUserName) {
    //             var compbal = {};
    //             compbal.balance = adminAmountOriginal;
    //             compbal.GST = params.GST2;
    //             managecompanybal(compbal, function (res) {
    //                 callback(null, params);
    //             })
    //         } else {
    //             //manage fund rake for admin
    //             if (params.rakeBack > 0) {
    //                 var playerRakeBackTemp = (adminAmountOriginal * params.rakeBack) / 100;
    //                 // params.playerRakeBack = (Math.ceil(playerRakeBackTemp)-playerRakeBackTemp==0.5 && Math.ceil(playerRakeBackTemp)%2 != 0) ? Math.floor(playerRakeBackTemp) : Math.round(playerRakeBackTemp);
    //                 params.playerRakeBack = roundOff(playerRakeBackTemp);
    //             } else {
    //                 params.playerRakeBack = 0;
    //             }
    //             var compbal = {};
    //             compbal.balance = adminAmountOriginal;
    //             compbal.GST = params.GST2;
    //             managecompanybal(compbal, function (res) {
    //                 var fundrake = {}
    //                 fundrake.rakeRefType = params.rakeRefType;
    //                 fundrake.rakeRefVariation = params.rakeRefVariation;
    //                 fundrake.rakeRefSubType = params.rakeRefSubType;
    //                 fundrake.channelId = params.channelId;
    //                 fundrake.channelName = params.channelName;
    //                 fundrake.transactionid = params.transactionid;
    //                 fundrake.rakeByUserid = params.playerId;
    //                 fundrake.rakeByName = params.firstName + " " + params.lastName;
    //                 fundrake.megaCircle = params.statistics.megaPointLevel;
    //                 fundrake.megaPoints = params.statistics.megaPoints;
    //                 fundrake.rakeByUsername = params.userName;
    //                 if (params.playerRakeBack > 0) {
    //                     fundrake.playerRakeBack = params.playerRakeBack;
    //                     fundrake.playerRakeBackPercent = params.rakeBack;
    //                     params.parentUserType = "N/A";
    //                 }
    //                 fundrake.amount = params.playerRakeOriginalBeforGST;
    //                 fundrake.amountGST = params.playerRakeOriginal;
    //                 fundrake.GST = params.GST2;
    //                 fundrake.debitToCompany = adminAmountOriginal - params.playerRakeBack;
    //                 fundrake.addeddate = new Date().getTime();
    //                 managerakefund(fundrake, function (res) {
    //                     //callback(res);
    //                     callback(null, params);
    //                 })
    //             })
    //         }
    //     })
    //     //}
    // }
    /*===================================== END ============================*/


    /*===================================== START ============================*/
    // insert recod transaction history
    // New
    async transactionhistroy(data: any): Promise<any> {
        try {
            await this.db.fundtransferhistroy(data);
            return {
                success: true,
                info: this.dbMessages.DB_FUNDTRANSFERHISTROY_SUCCESS_REWARDRAKE,
                isRetry: false,
                isDisplay: true,
                channelId: "",
                errorId: "dbQyeryInfo.DB_FUNDTRANSFERHISTROY_SUCCESS_REWARDRAKE"
            };
        } catch (err) {
            return {
                success: false,
                info: this.dbMessages.DB_FUNDTRANSFERHISTROY_FAILED_REWARDRAKE,
                isRetry: false,
                isDisplay: true,
                channelId: "",
                errorId: "dbQyeryInfo.DB_FUNDTRANSFERHISTROY_FAILED_REWARDRAKE"
            };
        }
    }


    // Old
    // var transactionhistroy = function (data, callback) {
    //     serverLog(stateOfX.serverLogType.info, 'transactionhistroy data' + JSON.stringify(data));
    //     // db.fundtransferhistroy(data, function(err, result){
    //     financeDB.fundtransferhistroy(data, function (err, result) {
    //         if (err) {
    //             // callback({success: false, info: "Something went wrong"})
    //             callback({ success: false, info: dbMessages.DB_FUNDTRANSFERHISTROY_FAILED_REWARDRAKE, isRetry: false, isDisplay: true, channelId: "", errorId: "dbQyeryInfo.DB_FUNDTRANSFERHISTROY_FAILED_REWARDRAKE" })
    //         } else {
    //             // callback({success: true, info: "fund successfully transfered"});
    //             callback({ success: true, info: dbMessages.DB_FUNDTRANSFERHISTROY_SUCCESS_REWARDRAKE, isRetry: false, isDisplay: true, channelId: "", errorId: "dbQyeryInfo.DB_FUNDTRANSFERHISTROY_SUCCESS_REWARDRAKE" });
    //         }
    //     })
    // }
    /*===================================== END ============================*/

    /*===================================== START ============================*/
    // insert record fund rake for company, affiliate & sub affiliate to manage report
    // New
    async managerakefund(data: any): Promise<any> {
        if (!data.debitToCompany) data.debitToCompany = 0;
        if (!data.amountGST) data.amountGST = 0;
        if (!data.amount) data.amount = 0;
        if (!data.GST) data.GST = 0;

        try {
            await this.db.fundrake(data);
            return {
                success: true,
                info: this.dbMessages.DB_FUNDRAKE_SUCCESS_REWARDRAKE,
                isRetry: false,
                isDisplay: false,
                channelId: "",
                errorId: "dbQyeryInfo.DB_FUNDRAKE_SUCCESS_REWARDRAKE",
            };
        } catch (err) {
            return {
                success: false,
                info: this.dbMessages.DB_FUNDRAKE_FAILED_REWARDRAKE,
                isRetry: false,
                isDisplay: true,
                channelId: "",
                errorId: "dbQyeryInfo.DB_FUNDRAKE_FAILED_REWARDRAKE",
            };
        }
    }


    // Old
    // var managerakefund = function (data, callback) {
    //     if (!data.debitToCompany) { data.debitToCompany = 0 }
    //     if (!data.amountGST) { data.amountGST = 0 }
    //     if (!data.amount) { data.amount = 0 }
    //     if (!data.GST) { data.GST = 0 }
    //     financeDB.fundrake(data, function (err, result) {
    //         if (err) {
    //             // callback({success: false, info: "Something went wrong"});
    //             callback({ success: false, info: dbMessages.DB_FUNDRAKE_FAILED_REWARDRAKE, isRetry: false, isDisplay: true, channelId: "", errorId: "dbQyeryInfo.DB_FUNDRAKE_FAILED_REWARDRAKE" });
    //         } else {
    //             // callback({success: true, info: "Rake fund submitted successfully"});
    //             callback({ success: true, info: dbMessages.DB_FUNDRAKE_SUCCESS_REWARDRAKE, isRetry: false, isDisplay: false, channelId: "", errorId: "dbQyeryInfo.DB_FUNDRAKE_SUCCESS_REWARDRAKE" });
    //         }
    //     });
    // }
    /*===================================== END ============================*/


    /*===================================== START ============================*/
    // manage affiliate & sub-affiliate rake balance
    // New
    async manageaffandsubaffrakebal(userid: string, balance: number): Promise<any> {
        const userbal = {
            profit: balance,
        };
        const res = await this.manageaffiliatebal(userid, userbal);
        return res;
    }


    // Old
    // var manageaffandsubaffrakebal = function (userid, balance, callback) {
    //     //serverLog(stateOfX.serverLogType.info, 'manageaffandsubaffbal'+JSON.stringify(userid)+'balance'+balance);
    //     var userbal = {};
    //     // userbal.balance = balance;         // old value
    //     // userbal.rakebalance = balance;	 // old value

    //     userbal.profit = balance;
    //     manageaffiliatebal(userid, userbal, function (res) {
    //         callback(null, res);
    //     })

    // }
    /*===================================== END ============================*/


    /*===================================== START ============================*/
    // update balance of affiliate
    // New
    async manageaffiliatebal(userid: string, data: any): Promise<any> {
        try {
            await this.db.updateteAffiliateRakeBalance(data, userid);
            return {
                success: true,
                info: this.dbMessages.DB_UPDATETEAFFILIATERAKEBALANCE_SUCCESS_REWARDRAKE,
                isRetry: false,
                isDisplay: false,
                channelId: "",
                errorId: "dbQyeryInfo.DB_UPDATETEAFFILIATERAKEBALANCE_SUCCESS_REWARDRAKE",
            };
        } catch (err) {
            return {
                success: false,
                info: this.dbMessages.DB_UPDATETEAFFILIATERAKEBALANCE_FAILED_REWARDRAKE,
                isRetry: false,
                isDisplay: true,
                channelId: "",
                errorId: "dbQyeryInfo.DB_UPDATETEAFFILIATERAKEBALANCE_FAILED_REWARDRAKE",
            };
        }
    }


    // Old
    // var manageaffiliatebal = function (userid, data, callback) {
    //     admindb.updateteAffiliateRakeBalance(data, userid, function (err, result) {
    //         if (err) {
    //             // callback({success: false, info:"Something went wrong"});
    //             callback({ success: false, info: dbMessages.DB_UPDATETEAFFILIATERAKEBALANCE_FAILED_REWARDRAKE, isRetry: false, isDisplay: true, channelId: "", errorId: "dbQyeryInfo.DB_UPDATETEAFFILIATERAKEBALANCE_FAILED_REWARDRAKE" });
    //         } else {
    //             callback({ success: true, info: dbMessages.DB_UPDATETEAFFILIATERAKEBALANCE_SUCCESS_REWARDRAKE, isRetry: false, isDisplay: false, channelId: "", errorId: "dbQyeryInfo.DB_UPDATETEAFFILIATERAKEBALANCE_SUCCESS_REWARDRAKE" });
    //         }
    //     });
    // }
    /*===================================== END ============================*/


    /*===================================== START ============================*/
    // decrease company rake balance after process rake commision of affiliate or sub affiliate
    // New
    async managecompanyrakebal(balance: number): Promise<any> {
        const bal = {
            balance: -balance,
            rakebalance: -balance,
        };

        const res = await this.managecompanybalNegative(bal);
        return res;
    }


    // Old
    // var managecompanyrakebal = function (balance, callback) {
    //     var bal = {};
    //     bal.balance = -balance;
    //     bal.rakebalance = -balance;
    //     managecompanybalNegative(bal, function (res) {
    //         callback(res);
    //     })
    // }
    /*===================================== END ============================*/


    /*===================================== START ============================*/
    // decrease company chips
    // New
    async managecompanychipsbal(balance: number): Promise<any> {
        const bal = {
            balance: -balance,
            chipsbalance: -balance,
        };

        const res = await this.managecompanybalNegative(bal);
        return res;
    }


    //Old
    // var managecompanychipsbal = function (balance, callback) {
    //     var bal = {};
    //     bal.balance = -balance;
    //     bal.chipsbalance = -balance;
    //     managecompanybalNegative(bal, function (res) {
    //         callback(res);
    //     })
    // }
    /*===================================== END ============================*/


    /*===================================== START ============================*/
    // update company balance and GST details
    // New
    async managecompanybal(balancedata: { balance?: number; GST?: number }): Promise<any> {
        const data = { $inc: { profit: balancedata.balance || 0, GST: balancedata.GST || 0 } };

        try {
            await this.db.updateBalanceSheet(data);
            return {
                success: true,
                info: this.dbMessages.DB_COMPANYRAKEBALANCE_SUCCESS_REWARDRAKE,
                isRetry: false,
                isDisplay: false,
                channelId: "",
                errorId: "dbQyeryInfo.DB_COMPANYRAKEBALANCE_SUCCESS_REWARDRAKE",
            };
        } catch (err) {
            return {
                success: false,
                info: this.dbMessages.DB_COMPANYRAKEBALANCE_FAILED_REWARDRAKE,
                isRetry: false,
                isDisplay: true,
                channelId: "",
                errorId: "dbQyeryInfo.DB_COMPANYRAKEBALANCE_FAILED_REWARDRAKE",
            };
        }
    }


    // Old
    // var managecompanybal = function (balancedata, callback) {
    // // admindb.companyRakeBalance(balancedata, function(err, result){
    // // 	if (err) {
    // // 		// callback({success: false, info: "Something went wrong"});
    // // 		callback({success: false, info: dbMessages.DB_COMPANYRAKEBALANCE_FAILED_REWARDRAKE, isRetry: false, isDisplay: true, channelId: ""});
    // // 	} else {
    // // 		// callback({success: true, info: "Company bal is going to decrease after rake commision"});
    // // 		callback({success: true, info: dbMessages.DB_COMPANYRAKEBALANCE_SUCCESS_REWARDRAKE, isRetry: false, isDisplay: false, channelId: ""});
    // // 	}
    // // });
    // var data = { $inc: { "profit": balancedata.balance || 0, "GST": balancedata.GST || 0 } };
    // financeDB.updateBalanceSheet(data, function (err, result) {
    //     if (err) {
    //         callback({ success: false, info: dbMessages.DB_COMPANYRAKEBALANCE_FAILED_REWARDRAKE, isRetry: false, isDisplay: true, channelId: "", errorId: "dbQyeryInfo.DB_COMPANYRAKEBALANCE_FAILED_REWARDRAKE" });
    //     } else {
    //         callback({ success: true, info: dbMessages.DB_COMPANYRAKEBALANCE_SUCCESS_REWARDRAKE, isRetry: false, isDisplay: false, channelId: "", errorId: "dbQyeryInfo.DB_COMPANYRAKEBALANCE_SUCCESS_REWARDRAKE" });
    //     }
    // });
    // }
    /*===================================== END ============================*/



    /*===================================== START ============================*/
    // update company balance
    // decrease
    // New
    async managecompanybalNegative(balancedata: { balance?: number }): Promise<any> {
        const data = { $inc: { profit: balancedata.balance || 0 } };

        try {
            await this.db.updateBalanceSheet(data);
            return {
                success: true,
                info: this.dbMessages.DB_COMPANYRAKEBALANCE_SUCCESS_REWARDRAKE,
                isRetry: false,
                isDisplay: false,
                channelId: "",
                errorId: "dbQyeryInfo.DB_COMPANYRAKEBALANCE_SUCCESS_REWARDRAKE",
            };
        } catch (err) {
            return {
                success: false,
                info: this.dbMessages.DB_COMPANYRAKEBALANCE_FAILED_REWARDRAKE,
                isRetry: false,
                isDisplay: true,
                channelId: "",
                errorId: "dbQyeryInfo.DB_COMPANYRAKEBALANCE_FAILED_REWARDRAKE",
            };
        }
    }


    // Old
    // var managecompanybalNegative = function (balancedata, callback) {
    //     // admindb.companyRakeBalance(balancedata, function(err, result){
    //     // 	if (err) {
    //     // 		// callback({success: false, info: "Something went wrong"});
    //     // 		callback({success: false, info: dbMessages.DB_COMPANYRAKEBALANCE_FAILED_REWARDRAKE, isRetry: false, isDisplay: true, channelId: ""});
    //     // 	} else {
    //     // 		// callback({success: true, info: "Company bal is going to decrease after rake commision"});
    //     // 		callback({success: true, info: dbMessages.DB_COMPANYRAKEBALANCE_SUCCESS_REWARDRAKE, isRetry: false, isDisplay: false, channelId: ""});
    //     // 	}
    //     // });
    //     var data = { $inc: { "profit": balancedata.balance || 0 } };
    //     financeDB.updateBalanceSheet(data, function (err, result) {
    //         if (err) {
    //             callback({ success: false, info: dbMessages.DB_COMPANYRAKEBALANCE_FAILED_REWARDRAKE, isRetry: false, isDisplay: true, channelId: "", errorId: "dbQyeryInfo.DB_COMPANYRAKEBALANCE_FAILED_REWARDRAKE" });
    //         } else {
    //             callback({ success: true, info: dbMessages.DB_COMPANYRAKEBALANCE_SUCCESS_REWARDRAKE, isRetry: false, isDisplay: false, channelId: "", errorId: "dbQyeryInfo.DB_COMPANYRAKEBALANCE_SUCCESS_REWARDRAKE" });
    //         }
    //     });
    // }
    /*===================================== END ============================*/


    /*===================================== START ============================*/
    // set input keys
    // find refund amount if any
    // find rake-able amount
    // New
    async setInputKeysNormal(params: any): Promise<any> {
        params.rakeToAffiliates.rakeRefId = params.channelId;
        params.rakeToAffiliates.rakeRefType = stateOfX.gameType.normal;
        params.rakeToAffiliates.rakeRefVariation = params.table.channelVariation;
        params.rakeToAffiliates.rakeRefSubType = "";
        params.rakeToAffiliates.players = [];
        params.rakeToAffiliates.players1 = [];

        if (params.rakeDetails.totalRake > params.rakeFromTable) {
            params.rakeDetails.totalRake = params.rakeFromTable;
        }

        let contributions = JSON.parse(JSON.stringify(params.table.contributors));
        let maxCont = -1, secondMaxCont = -1, maxPlayerId: any = null;

        if (!!contributions[0].amount && contributions[0].amount > contributions[1].amount) {
            secondMaxCont = contributions[1].amount;
            maxCont = contributions[0].amount;
            maxPlayerId = contributions[0].playerId;
        } else {
            secondMaxCont = contributions[0].amount;
            maxCont = contributions[1].amount;
            maxPlayerId = contributions[1].playerId;
        }

        for (let i = 0; i < contributions.length; i++) {
            if (i >= 2 && contributions[i].amount >= maxCont) {
                secondMaxCont = maxCont;
                maxCont = contributions[i].amount;
                maxPlayerId = contributions[i].playerId;
            } else if (i >= 2 && contributions[i].amount >= secondMaxCont) {
                secondMaxCont = contributions[i].amount;
            }
        }

        const refundedAmt = maxCont - secondMaxCont;
        const maxPlayerContribution = contributions.find((c: any) => c.playerId === maxPlayerId);
        if (maxPlayerContribution) {
            maxPlayerContribution.amount -= refundedAmt;
        }

        for (let beta = 0; beta < contributions.length; beta++) {
            const playerRakeTemp = params.rakeDetails.totalRake * (contributions[beta].amount / params.potAmount);
            const tempAmount1 = this.utilsService.roundOff(playerRakeTemp);
            params.rakeToAffiliates.players.push({
                playerId: contributions[beta].playerId,
                rakeAmount: tempAmount1,
                rakeAmountOriginal: playerRakeTemp,
            });
        }

        return params;
    }


    // Old
    // var setInputKeysNormal = function (params, cb) {
    //     params.rakeToAffiliates.rakeRefId = params.channelId;
    //     params.rakeToAffiliates.rakeRefType = stateOfX.gameType.normal;
    //     params.rakeToAffiliates.rakeRefVariation = params.table.channelVariation;
    //     params.rakeToAffiliates.rakeRefSubType = "";
    //     params.rakeToAffiliates.players = [];
    //     params.rakeToAffiliates.players1 = [];
    //     serverLog(stateOfX.serverLogType.info, 'Rake details - ' + JSON.stringify(params));
    //     if (params.rakeDetails.totalRake > params.rakeFromTable) {
    //         params.rakeDetails.totalRake = params.rakeFromTable;
    //     }
    //     var playerContribution = 0;
    //     console.error("@!@!@!@!@!@!@!@!@!@!@", JSON.stringify(params));
    //     var contributions = JSON.parse(JSON.stringify(params.table.contributors));
    //     var maxCont = -1, secondMaxCont = -1, maxPlayerId = null;
    //     if (!!contributions[0].amount && contributions[0].amount > contributions[1].amount) {
    //         secondMaxCont = contributions[1].amount;
    //         maxCont = contributions[0].amount;
    //         maxPlayerId = contributions[0].playerId;
    //     } else {
    //         secondMaxCont = contributions[0].amount;
    //         maxCont = contributions[1].amount;
    //         maxPlayerId = contributions[1].playerId;
    //     }
    //     for (var i = 0; i < contributions.length; i++) {
    //         if (i >= 2 && contributions[i].amount >= maxCont) {
    //             secondMaxCont = maxCont;
    //             maxCont = contributions[i].amount;
    //             maxPlayerId = contributions[i].playerId;
    //         } else if (i >= 2 && contributions[i].amount >= secondMaxCont) {
    //             secondMaxCont = contributions[i].amount;
    //         }
    //     }
    //     var refundedAmt = (maxCont - secondMaxCont);
    //     _.findWhere(contributions, { playerId: maxPlayerId }).amount -= refundedAmt
    //     console.error("--------WWWWWWWWW", contributions);
    //     // for(var alpha = 0 ; alpha < params.data.decisionParams.length; alpha++){
    //     for (var beta = 0; beta < contributions.length; beta++) {
    //         var playerRakeTemp = params.rakeDetails.totalRake * (contributions[beta].amount / params.potAmount);
    //         // var tempAmount1 = (Math.ceil(playerRakeTemp)-playerRakeTemp==0.5 && Math.ceil(playerRakeTemp)%2 != 0) ? Math.floor(playerRakeTemp) : Math.round(playerRakeTemp);
    //         var tempAmount1 = roundOff(playerRakeTemp);
    //         params.rakeToAffiliates.players.push({
    //             playerId: contributions[beta].playerId,
    //             rakeAmount: tempAmount1,
    //             rakeAmountOriginal: playerRakeTemp
    //         });
    //     }

    //     // }

    //     /*console.error("@!@!@!@!@@!^&^&^&^&^&^",JSON.stringify(params));*/
    //     cb(null, params);
    //     // async.each(params.table.contributors, function(contributor, ecb) {
    //     // 	serverLog(stateOfX.serverLogType.info, 'Processing contributor - ' + JSON.stringify(contributor));
    //     // 		params.rakeToAffiliates.players.push({
    //     // 			playerId		: contributor.playerId,
    //     // 			rakeAmount	: params.rakeDetails.totalRake * ( contributor.amount / params.potAmount)
    //     // 		});
    //     // 	ecb()
    //     // }, function(err) {
    //     // 	if(!err) {
    //     // 		cb(null, params);
    //     // 	} else {
    //     // 		cb(err);
    //     // 	}
    //     // });
    // }
    /*===================================== END ============================*/



    /*===================================== START ============================*/
    // process rake distribution from table pots
    // awarded to parents of players
    // affiliates and/or sub-affiliates and admin
    // New
    async processRakeDistribution(params: any): Promise<any> {

        params.rakeToAffiliates = {};

        try {
            // Await the converted async setInputKeysNormal function
            const paramsWithKeys = await this.setInputKeysNormal(params);

            // Await the distributeRake function which must also be converted to async/await
            const response = await this.distributeRake(paramsWithKeys);


            return response;
        } catch (err) {
            throw err;
        }
    }


    // Old
    // rewardRake.processRakeDistribution = function (params, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'In rewardRake function processRakeDistribution');
    //     serverLog(stateOfX.serverLogType.info, "=========== RAKE DISTRIBUTION STARTED ===========");
    //     params.rakeToAffiliates = {};
    //     async.waterfall([

    //         async.apply(setInputKeysNormal, params),
    //         distributeRake

    //     ], function (err, response) {
    //         serverLog(stateOfX.serverLogType.info, "=========== RAKE DISTRIBUTION FINISHED ===========");
    //         cb(err, response)
    //     });
    // }
    /*===================================== END ============================*/


    /*===================================== END ============================*/
    // tournament
    // New
    async getTournamentRoom(params: any): Promise<any> {

        try {
            const tournamentRoom = await this.db.getTournamentRoom(params.tournamentId.toString());

            if (!tournamentRoom) {
                return {
                    success: false,
                    info: this.dbMessages.DB_GETTOURNAMENTROOM_FAILED_REWARDRAKE,
                    isRetry: false,
                    isDisplay: false,
                    channelId: "",
                    errorId: "dbQyeryInfo.DB_GETTOURNAMENTROOM_FAILED_REWARDRAKE"
                };
            }

            params.rakeAmount = tournamentRoom.housefees;
            params.rakeRefId = params.tournamentId;
            params.rakeRefType = stateOfX.gameType.tournament;
            params.rakeRefVariation = tournamentRoom.channelVariation;
            params.rakeRefSubType = tournamentRoom.tournamentType;
            params.gameVersionCount = tournamentRoom.gameVersionCount;

            return params;
        } catch (err) {
            return {
                success: false,
                info: this.dbMessages.DB_GETTOURNAMENTROOM_FAILED_REWARDRAKE,
                isRetry: false,
                isDisplay: false,
                channelId: "",
                errorId: "dbQyeryInfo.DB_GETTOURNAMENTROOM_FAILED_REWARDRAKE"
            };
        }
    }


    // Old
    // var getTournamentRoom = function (params, cb) {
    // serverLog(stateOfX.serverLogType.info, "in get tournament room in tournament rake " + JSON.stringify(params));
    // db.getTournamentRoom((params.tournamentId).toString(), function (err, tournamentRoom) {
    //     serverLog(stateOfX.serverLogType.info, "tournament room is - " + JSON.stringify(tournamentRoom));
    //     if (err || !tournamentRoom) {
    //         // cb({success : false, info: "Error in getting tournament Room"});
    //         cb({ success: false, info: dbMessages.DB_GETTOURNAMENTROOM_FAILED_REWARDRAKE, isRetry: false, isDisplay: false, channelId: "", errorId: "dbQyeryInfo.DB_GETTOURNAMENTROOM_FAILED_REWARDRAKE" });
    //     } else {
    //         params.rakeAmount = tournamentRoom.housefees;
    //         params.rakeRefId = params.tournamentId;
    //         params.rakeRefType = stateOfX.gameType.tournament;
    //         params.rakeRefVariation = tournamentRoom.channelVariation;
    //         params.rakeRefSubType = tournamentRoom.tournamentType;
    //         params.gameVersionCount = tournamentRoom.gameVersionCount;
    //         cb(null, params);
    //     }
    // })
    // }
    /*===================================== END ============================*/


    /*===================================== START ============================*/
    // tournament
    // New
    async getTournamentUsers(params: any): Promise<any> {
        try {
            const result = await this.db.findTournamentUser({ tournamentId: params.tournamentId, gameVersionCount: params.gameVersionCount });
            if (result) {
                const playerIds = _.pluck(result, 'playerId');
                params.playerIds = playerIds;
                return params;
            } else {
                return {
                    success: false,
                    info: this.dbMessages.DB_FINDTOURNAMENTUSER_NOUSER_REWARDRAKE,
                    isRetry: false,
                    isDisplay: true,
                    channelId: "",
                    errorId: "dbQyeryInfo.DB_FINDTOURNAMENTUSER_NOUSER_REWARDRAKE"
                };
            }
        } catch (err) {
            return {
                success: false,
                info: this.dbMessages.DB_FINDTOURNAMENTUSER_FAILED_REWARDRAKE,
                isRetry: false,
                isDisplay: false,
                channelId: "",
                errorId: "dbQyeryInfo.DB_FINDTOURNAMENTUSER_FAILED_REWARDRAKE"
            };
        }
    }


    // Old
    // var getTournamentUsers = function (params, cb) {
    //     serverLog(stateOfX.serverLogType.info, " in get tournament users" + JSON.stringify(params));
    //     db.findTournamentUser({ tournamentId: params.tournamentId, gameVersionCount: params.gameVersionCount }, function (err, result) {
    //         if (err) {
    //             // cb({success: false, info: "Error in getting tournamentUser"});
    //             cb({ success: false, info: dbMessages.DB_FINDTOURNAMENTUSER_FAILED_REWARDRAKE, isRetry: false, isDisplay: false, channelId: "", errorId: "dbQyeryInfo.DB_FINDTOURNAMENTUSER_FAILED_REWARDRAKE" });
    //         } else {
    //             if (!!result) {
    //                 var playerIds = _.pluck(result, 'playerId');
    //                 params.playerIds = playerIds;
    //                 cb(null, params);
    //             } else {
    //                 // cb({success: false, info: "No tournament users for this this tournament"});
    //                 cb({ success: false, info: dbMessages.DB_FINDTOURNAMENTUSER_NOUSER_REWARDRAKE, isRetry: false, isDisplay: true, channelId: "", errorId: "dbQyeryInfo.DB_FINDTOURNAMENTUSER_NOUSER_REWARDRAKE" });
    //             }
    //         }
    //     })
    // }
    /*===================================== END ============================*/


    /*===================================== END ============================*/
    // tournament
    // New
    createResponse(params: any): any {

        const tempData = [];
        for (let playerIt = 0; playerIt < params.playerIds.length; playerIt++) {
            tempData.push({
                playerId: params.playerIds[playerIt],
                rakeAmount: params.rakeAmount,
            });
        }


        const result = {
            rakeToAffiliates: {
                rakeRefId: params.rakeRefId,
                rakeRefType: params.rakeRefType,
                rakeRefVariation: params.rakeRefVariation,
                rakeRefSubType: params.rakeRefSubType,
                players: tempData,
            }
        };


        return result;
    };


//Old
// var createResponse = function (params, cb) {
//     serverLog(stateOfX.serverLogType.info, " in get createResponse " + JSON.stringify(params));
//     serverLog(stateOfX.serverLogType.info, " playerIds in get createResponse " + JSON.stringify(params.playerIds.length));
//     var tempData = [];
//     for (var playerIt = 0; playerIt < params.playerIds.length; playerIt++) {
//         tempData.push({
//             playerId: params.playerIds[playerIt],
//             rakeAmount: params.rakeAmount
//         })
//     }
//     serverLog(stateOfX.serverLogType.info, "temp data in create response in tournamentRake is - " + JSON.stringify(tempData));
//     var result = {};
//     result.rakeToAffiliates = {
//         rakeRefId: params.rakeRefId,
//         rakeRefType: params.rakeRefType,
//         rakeRefVariation: params.rakeRefVariation,
//         rakeRefSubType: params.rakeRefSubType,
//         players: tempData
//     }
//     serverLog(stateOfX.serverLogType.info, "create response in tournament rake process - " + JSON.stringify(result))
//     cb(null, result);
// }
/*===================================== END ============================*/


    /*===================================== START ============================*/
    // tournament
    // New
    async tournamentRakeProcess(params: any): Promise<any> {
            try {
                const roomResult = await this.getTournamentRoom(params);
                const usersResult = await this.getTournamentUsers(roomResult);
                const response = this.createResponse(usersResult);
                const distributed = await this.distributeRake(response);
                return { success: true, result: distributed };
            } catch (err) {
                return err;
            }
    };


    // Old
    // rewardRake.tournamentRakeProcess = function (params, cb) {
    //         serverLog(stateOfX.serverLogType.info, "in tournament rake process - ", JSON.stringify(params));
    //         async.waterfall([
    //             async.apply(getTournamentRoom, params),
    //             getTournamentUsers,
    //             createResponse,
    //             distributeRake
    //         ], function (err, response) {
    //             if (err) {
    //                 serverLog(stateOfX.serverLogType.info, "Error occured in tournament rake process");
    //                 cb(err);
    //             } else {
    //                 cb({ success: true, result: response });
    //             }
    //         })
    //     }
    /*===================================== END ============================*/






}