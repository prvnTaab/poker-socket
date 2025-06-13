import { Injectable } from "@nestjs/common";
import { UtilsService } from "apps/game/src/utils/utils.service";
import { systemConfig } from "shared/common";
import { PokerDatabaseService } from "shared/common/datebase/pokerdatabase.service";









// var adminDb = require('../../../../../shared/model/adminDbQuery');
// var db = require('../../../../../shared/model/dbQuery');
// var convert = require('../../database/remote/convertingIntToDecimal');
// var sharedModule = require('../../../../../shared/sharedModule');
// const wallet = require("../../walletQuery");
// const systemConfig = require('../../../../../shared/systemConfig.json')




@Injectable()
export class CashOutHandlerFromAppService {

    constructor(
        private readonly db: PokerDatabaseService,
        private readonly wallet,
        private readonly utilsService: UtilsService
    ) { }









    async cashOutFromApp(params: any): Promise<any> {
        params.WithdrawAmmount = this.utilsService.convertIntToDecimal(params.WithdrawAmmount);

        await this.saveBankDetails(params);
        await this.generateWithdrawlRequest(params);
        await new Promise((resolve) => setTimeout(resolve, 500));

        return {
            success: true,
            info: 'Withdrawl Request Generated Successfully.',
            isDisplay: true
        };
    }

    generateORCPRefrenceId(): string {
        let result = 'CFA-';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 16; i++) {
            result += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return result;
    }

    async checkPlayerData(params: any): Promise<any> {
        const player = await this.db.findUser({ playerId: params.playerId });

        if (player !== null) {
            params.playerData = player;
            return params;

            // Additional validation logic can be uncommented and migrated similarly
        } else {
            throw {
                success: false,
                info: 'Player does not found',
                isDisplay: true
            };
        }
    }

    async checkPlayerWithdrawl(params: any): Promise<any> {
        if (
            this.utilsService.convertIntToDecimal(params.WithdrawAmmount) <= this.utilsService.convertIntToDecimal(params.playerData.realChips) &&
            this.utilsService.convertIntToDecimal(params.WithdrawAmmount) >= 500
        ) {
            if (params.playerData.chipsManagement.withdrawlCount >= 0) {
                const lastTransactionDate = new Date(params.playerData.chipsManagement.withdrawlDate).toDateString();
                const todaysDate = new Date().toDateString();
                if (convertDateToMidnight(todaysDate) >= convertDateToMidnight(lastTransactionDate)) {
                    params.playerData.chipsManagement.withdrawlCount = 0;
                } else {
                    throw {
                        success: false,
                        info: 'Number of withdrawl exausted for today',
                        isDisplay: true,
                        playerChips: params.realChips
                    };
                }
            }

            if (params.playerData.statistics.handsPlayedRM > 0) {
                params.claculateTax = true;
                return params;
            } else {
                params.claculateTax = false;
                if (params.WithdrawAmmount < 1000) {
                    throw {
                        success: false,
                        info: 'Requested Amount is not Allowed',
                        isDisplay: true,
                        playerChips: params.realChips
                    };
                } else {
                    return params;
                }
            }
        } else {
            throw {
                success: false,
                info: 'Requested Amount is not Allowed',
                isDisplay: true,
                playerChips: params.realChips
            };
        }
    }

    async calculatePlayerTDSZeroHand(params: any): Promise<any> {
        if (!params.claculateTax) {
            let DeductAmount = (params.WithdrawAmmount * params.playerData.chipsManagement.withdrawlPercent) / 100;
            DeductAmount = this.utilsService.convertIntToDecimal(DeductAmount);
            if (DeductAmount < 100) {
                DeductAmount = 100;
            }

            if (params.playerData.chipsManagement.withdrawlPercent === 5) {
                params.playerData.chipsManagement.withdrawlPercent = 7;
            } else {
                params.playerData.chipsManagement.withdrawlPercent = 10;
            }

            params.playerData.realChips -= params.WithdrawAmmount;
            params.currentDepositAmount = params.playerData.chipsManagement.deposit;
            params.playerData.chipsManagement.deposit -= params.WithdrawAmmount;
            params.playerData.chipsManagement.withdrawlCount += 1;
            params.playerData.chipsManagement.withdrawlDate = Number(new Date());
            params.DeductAmount = 0;
            params.processingFees = DeductAmount;
            params.effectiveWithdrawlAmount = params.WithdrawAmmount - DeductAmount;

            return params;
        } else {
            return params;
        }
    }

    async calculatePlayerTDSNoneHand(params: any): Promise<any> {
        if (params.claculateTax) {
            const tempCalculator = params.WithdrawAmmount - params.playerData.chipsManagement.deposit;
            params.playerData.realChips -= params.WithdrawAmmount;
            params.currentDepositAmount = params.playerData.chipsManagement.deposit;
            params.playerData.chipsManagement.deposit -= params.WithdrawAmmount;

            if (params.playerData.chipsManagement.deposit >= 0) {
                params.currentDepositAmount = params.WithdrawAmmount;
            }

            params.playerData.chipsManagement.withdrawlCount += 1;
            params.playerData.chipsManagement.withdrawlDate = Number(new Date());
            params.DeductAmount = 0;
            params.processingFees = 0;
            params.effectiveWithdrawlAmount = params.WithdrawAmmount;

            if (tempCalculator > 0 && tempCalculator >= 10000) {
                params.DeductAmount = (tempCalculator * 30) / 100;
                params.effectiveWithdrawlAmount = params.WithdrawAmmount - params.DeductAmount;
            }

            return params;
        } else {
            return params;
        }
    }



    async saveBankDetails(params: any): Promise<any> {
        if (!params.tds) {
            // Early exit on missing TDS
            throw { success: true, info: 'Error in processing request', isDisplay: true };
        }

        params.tds = this.utilsService.convertIntToDecimal(params.tds);

        const player = await this.db.findUser({ playerId: params.playerId });
        params.playerData = player;

        const bankDetails = await this.db.findBankDetailsuser({ playerId: params.playerId });
        const bd = bankDetails[0];

        params.WithdrawAcName = bd.WithdrawAcName;
        params.WithdrawAcType = bd.WithdrawAcType;
        params.WithdrawAcNumber = bd.WithdrawAcNumber;
        params.WithdrawAcIfsc = bd.WithdrawAcIfsc;
        params.WithdrawAcBank = bd.WithdrawAcBank;
        params.WithdrawAcBranch = bd.WithdrawAcBranch;

        return params;
    }

    async generateWithdrawlRequest(params: any): Promise<any> {
        // ensure deposit non‑negative
        if (params.playerData.chipsManagement.deposit < 0) {
            params.playerData.chipsManagement.deposit = 0;
        }

        const updateKeys: any = {
            chipsManagement: {
                deposit: params.playerData.chipsManagement.deposit,
                WithDrawl: 0,
                withdrawlCount: params.playerData.chipsManagement.withdrawlCount + 1,
                withdrawlPercent: params.playerData.chipsManagement.withdrawlPercent,
                withdrawlDate: Number(new Date())
            }
        };

        await this.db.updateUser({ playerId: params.playerId }, updateKeys);

        params.referenceNo = this.generateORCPRefrenceId();

        const walletResponse = await this.wallet.sendWalletBroadCast({
            action: 'cashoutRc',
            data: {
                isRealMoney: true,
                playerId: params.playerId,
                chips: params.WithdrawAmmount,
                referenceNumber: params.referenceNo
            }
        });

        if (!walletResponse.success) {
            throw { success: false, info: walletResponse.info, isDisplay: true };
        }

        params.points = walletResponse.points;

        // Generate the withdrawal request record
        await this.createWithdrawlRequest(params);

        return params;
    }

    async createWithdrawlRequest(params: any): Promise<void> {
        const w: any = {};
        w.requestedAmount = params.WithdrawAmmount;
        w.points = params.points;
        w.tds = params.tds;
        w.netAmount = params.WithdrawAmmount - params.tds;
        w.name = params.WithdrawAcName;
        w.realName = params.playerData.firstName;
        w.userName = params.playerData.userName;
        w.emailId = params.playerData.emailId;
        w.accountNumber = params.WithdrawAcNumber;
        w.ifcsCode = params.WithdrawAcIfsc;
        w.bankName = params.WithdrawAcBank;
        w.branchName = params.WithdrawAcBranch;
        w.affiliateId = params.playerData.isParentUserName;
        w.affiliateMobile = params.affilateMobileNumber;
        w.profile = 'PLAYER';
        w.accountType = params.WithdrawAcType;
        w.referenceNo = params.referenceNo;
        w.panNumber = params.withdrawPan;
        w.requestedAt = Number(new Date());
        w.currentDepositAmount = params.currentDepositAmount || 0;
        w.processingFees = params.processingFees || 0;
        w.transferMode = 'ONLINE TRANSFER';
        w.tdsType = 'Real Chips';
        w.effectiveWithdrawlAmount = params.effectiveWithdrawlAmount;

        await this.db.createCashOutRequest(w);

        // Fire off a notification to the player (fire-and-forget)
        const messageData: any = {
            playerData: params.playerData,
            WithdrawAmmount: params.WithdrawAmmount,
            referenceNo: params.referenceNo
        };
        this.sendMsgToPlayer(messageData);
    }

    /** Utility to zero out a date to midnight */
    convertDateToMidnight(dateToConvert: string | Date): number {
        const d = new Date(dateToConvert);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
    }

    /** Send both SMS and email notification to the player */
    async sendMsgToPlayer(params: any): Promise<void> {
        if (!params.playerData.userName) return;

        // SMS
        const smsPayload = {
            mobileNumber: params.playerData.mobileNumber,
            msg: `Hi ${params.playerData.userName}, ` +
                `${systemConfig.domain} has received your cash out request for ` +
                `${params.WithdrawAmmount} chips (ID:${params.referenceNo}). ` +
                `It will be processed within 2-3 business days.`
        };
        await this.sharedModule.sendOtp({
            mobileNumber: '91' + smsPayload.mobileNumber,
            msg: smsPayload.msg
        });

        // Email
        const mailData = {
            to_email: params.playerData.emailId,
            from_email: systemConfig.from_email,
            subject: 'Cashout request processed',
            template: 'organicPlayerTemplate',
            content: {
                name: params.playerData.firstName,
                userName: params.playerData.userName,
                referenceNo: params.referenceNo,
                cashoutamount: params.WithdrawAmmount
            }
        };
        await this.sharedModule.sendMailWithHtml(mailData);
    }

    /** Async wrapper for your waterfall in getCashoutDetails */
    async getCashoutDetails(params: any): Promise<any> {
        params.WithdrawAmmount = this.utilsService.convertIntToDecimal(params.WithdrawAmmount);

        // these two functions must themselves be async/await versions
        params = await this.checkPlayerData(params);
        params = await this.calculateTDS(params);

        return params;
    }


    async calculateTDS(params: any): Promise<any> {
        // Check available balance
        const coinType1 = params.playerData.points.find((c: any) => c.coinType === 1);
        const available = (coinType1.deposit + coinType1.win) - (params.playerData.lockedCashout ?? 0);

        if (available < params.WithdrawAmmount) {
            throw {
                success: false,
                info: "You've Insufficient chips to process request",
                isDisplay: true
            };
        }

        // Financial year start: April 1 of current year
        const now = new Date();
        const fyStart = new Date(now.getFullYear(), 3, 1).getTime();

        // 1) Total amount added this FY
        const depositHistory = await this.db.findTransactionHistory({
            loginId: params.playerData.userName,
            status: "SUCCESS",
            date: { $gte: fyStart },
            sortValue: "date"
        });
        params.totalAddedInFY = depositHistory.reduce((sum: number, txn: any) => sum + txn.amount, 0);

        // 2) Pending cashout requests this FY
        const pending = await this.db.listPendingCashOutRequest({
            userName: params.playerData.userName,
            requestedAt: { $gte: fyStart }
        });
        params.totalPendingAmount = pending.reduce((sum: number, r: any) => sum + r.requestedAmount, 0);

        // 3) Approved-but-not-paid this FY
        const approvedNotPaid = await this.db.listApproveCashOutRequest({
            userName: params.playerData.userName,
            requestedAt: { $gte: fyStart }
        });
        params.totalApprovedAmountButNotGiven = approvedNotPaid.reduce((sum: number, r: any) => sum + r.requestedAmount, 0);

        // 4) Total paid cashouts this FY
        const paidHistory = await this.db.listCashOutHistory({
            userName: params.playerData.userName,
            requestedAt: { $gte: fyStart }
        });
        params.totalApprovedAmount = paidHistory.reduce((sum: number, r: any) => sum + r.requestedAmount, 0);

        // 5) Direct cashouts initiated this FY
        const directRequests = await this.db.getAllRecordsDirectCashout({
            userName: params.playerData.userName,
            createdAt: { $gte: fyStart }
        });
        params.totalDirectCashout = directRequests.reduce((sum: number, r: any) => sum + Number(r.amount), 0);

        // 6) Direct cashouts approved this FY
        const directApproved = await this.db.getAllFromDirectCashoutHistory({
            userName: params.playerData.userName,
            status: "Approved",
            actionTakenAt: { $gte: fyStart }
        });
        params.totalDirectCashoutApproved = directApproved.reduce((sum: number, r: any) => sum + Number(r.amount), 0);

        // Compute TDS
        const totalWithdraw = params.totalPendingAmount
            + params.totalApprovedAmountButNotGiven
            + params.totalApprovedAmount
            + params.totalDirectCashout
            + params.totalDirectCashoutApproved;

        const eligibleWithoutDeduction = params.totalAddedInFY - totalWithdraw;
        let depositPortion = 0;
        let winningPortion = 0;
        let remainder = params.WithdrawAmmount;

        if (eligibleWithoutDeduction > 0) {
            if (remainder <= eligibleWithoutDeduction) {
                depositPortion = remainder;
                remainder = 0;
            } else {
                depositPortion = eligibleWithoutDeduction;
                remainder -= eligibleWithoutDeduction;
                winningPortion = remainder;
                remainder = 0;
            }
        } else {
            winningPortion = remainder;
            remainder = 0;
        }

        // Round to 2 decimal places if needed
        depositPortion = Number.isInteger(depositPortion) ? depositPortion : Number(depositPortion.toFixed(2));
        winningPortion = Number.isInteger(winningPortion) ? winningPortion : Number(winningPortion.toFixed(2));

        const tdsRaw = winningPortion * 0.30;
        const tds = Number.isInteger(tdsRaw) ? tdsRaw : Number(tdsRaw.toFixed(2));
        const netAmountRaw = params.WithdrawAmmount - tds;
        const netAmount = Number.isInteger(netAmountRaw) ? netAmountRaw : Number(netAmountRaw.toFixed(2));

        return {
            success: true,
            info: "TDS calculated",
            isDisplay: false,
            data: {
                amount: params.WithdrawAmmount,
                deposit: depositPortion,
                winning: winningPortion,
                tds,
                netAmount
            }
        };
    }











}