import { Injectable } from "@nestjs/common";
import { systemConfig } from "shared/common";
import { PokerDatabaseService } from "shared/common/datebase/pokerdatabase.service";
import _ from 'underscore';




// var systemConfig = require("../../../../../shared/systemConfig.json");
// var _            = require('underscore');
// var spinHandler = {};
// var db          =  require("../../../../../shared/model/dbQuery");
// var logDB       =  require("../../../../../shared/model/logDbQuery");
// var rootTools = require('../../../../../config/keys').rootTools;
// var pomelo_client = require('pomelo-node-client-websocket');
// var pomelo = pomelo_client.create();
// var sharedModule = require('../../../../../shared/sharedModule');
// var financeDB    = require('../../../../../shared/model/financeDbQuery');








@Injectable()
export class SpinTheWheelHandlerService {

    constructor(
        private readonly db: PokerDatabaseService
    ) { }


    maxPrize = _.max(systemConfig.spinTheWheelPrize)!;

    async spin(playerInfo: any): Promise<{ success: true; indexValue: number }> {
        let index = this.randomNumber(0, systemConfig.spinTheWheelPrize.length - 1);
        const pool = systemConfig.poolPrizeForDay ?? 0;

        if (pool > 0) {
            if (pool > this.maxPrize) {
                // use initial index
            } else {
                // find an index whose prize ≤ remaining pool
                while (systemConfig.spinTheWheelPrize[index] > pool) {
                    index = this.randomNumber(0, systemConfig.spinTheWheelPrize.length - 1);
                }
            }
        } else {
            // no pool left → pick from a fixed set
            index = this.randomNumberForZero();
        }

        playerInfo.prizeValue = systemConfig.spinTheWheelPrize[index];

        // record in DB
        const result = await this.insertDataOfPlayer(playerInfo);
        if (!result) {
            throw new Error('Failed to insert spin record');
        }

        // decrement the pool
        systemConfig.poolPrizeForDay = pool - systemConfig.spinTheWheelPrize[index];

        return { success: true, indexValue: index };
    }

    randomNumber(min: number, max: number): number {
        return _.random(min, max);
    }

    randomNumberForZero(): number {
        const tempArr = [1, 3, 5, 7];
        return _.sample(tempArr)!;
    }


    async insertDataOfPlayer(playerInfo: any): Promise<any> {
        // build spin record
        const spinRecord = {
            playerId: playerInfo.playerId,
            userName: playerInfo.userName,
            prizeValue: playerInfo.prizeValue,
            createdAt: Date.now()
        };

        // insert into spin wheel table
        const result = await this.db.insertSpinWheelData(spinRecord);
        if (!result) {
            throw new Error('Failed to insert spin wheel data');
        }

        // if prize awarded, record bonus history and update finance
        if (playerInfo.prizeValue) {
            await this.insertDataOfPlayerInBonusHistory(playerInfo);
            await this.db.updateBalanceSheet({ $inc: { deposit: playerInfo.prizeValue, bonus: playerInfo.prizeValue } });
        }

        return result;
    }

    async insertDataOfPlayerInBonusHistory(playerInfo: any): Promise<void> {
        const bonusRecord = {
            playerId: playerInfo.playerId,
            userName: playerInfo.userName,
            name: 'Contest',
            type: 'Spin The Wheel',
            codeName: 'N/A',
            bonusAmount: playerInfo.prizeValue,
            typeOfDeposit: 'N/A',
            realChipBonus: playerInfo.prizeValue,
            unClaimedBonus: 0,
            instantbonus: 0,
            totalBonusAmount: playerInfo.prizeValue,
            createdAt: Date.now(),
            status: 'Active',
            ucbClaimed: 0
        };

        const hist = await this.db.addBonusHistory(bonusRecord);
        if (!hist) {
            throw new Error('Failed to insert bonus history');
        }

        await this.informPlayer(playerInfo);
    }

    async informPlayer(data: any): Promise<void> {
        // fetch latest user balances
        const user = await this.db.findUser({ playerId: data.playerId });
        if (!user) throw new Error('User not found for informPlayer');

        // update data object
        data.totalBalance = user.realChips + (user.realChipBonus || 0) + data.prizeValue;
        data.rc = user.realChips;
        data.rcb = (user.realChipBonus || 0) + data.prizeValue;
        data.mobileNumber = user.mobileNumber;
        data.emailId = user.emailId;

        // credit chips to player
        await this.addChipsToPlayer({ playerId: data.playerId }, 0, data.prizeValue);

        // notify the player
        await this.sendMsgToPlayer(data);
    }

    /** Send both OTP and email notification to the player */
    async sendMsgToPlayer(params: {
        mobileNumber: string;
        userName: string;
        prizeValue: number;
        emailId: string;
    }): Promise<any> {
        // 1) Send SMS
        const smsPayload = {
            mobileNumber: '91' + params.mobileNumber,
            msg: `Hello ${params.userName}, Thank you for rolling the wheel. Congratulations on winning ${params.prizeValue} real cash bonus on ${systemConfig.originalName}! Hurry now! Tables running...`
        };
        await this.sharedModule.sendOtp(smsPayload);

        // 2) Send email
        const mailData = {
            to_email: params.emailId,
            from_email: systemConfig.from_email,
            subject: 'Wohoo! you have won bonus points | Spin and Win',
            template: 'SpinTheWheelContest',
            content: {
                playerName: params.userName,
                amount: params.prizeValue
            }
        };
        await this.sharedModule.sendMailWithHtml(mailData);

        return params;
    }

    /** Wrapper around sharedModule.sendOtp */
    async sendOtpFunction(params: { mobileNumber: string; msg: string }): Promise<any> {
        const smsPayload = {
            mobileNumber: '91' + params.mobileNumber,
            msg: params.msg
        };
        return await this.sharedModule.sendOtp(smsPayload);
    }

    /** Add real & bonus chips to a player */
    async addChipsToPlayer(
        filter: { playerId: string },
        chips: number,
        bonuschip: number
    ): Promise<any> {
        return await this.db.addRealChipswithBonus(filter, chips, bonuschip);
    }





}