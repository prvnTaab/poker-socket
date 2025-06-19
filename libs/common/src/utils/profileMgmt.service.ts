import { Injectable } from "@nestjs/common";
import { PokerDatabaseService } from "./pokerdatabase.service";
import { UtilityService } from "./utils.service";















@Injectable()
export class ProfileMgmtService {

    constructor(
        private readonly db: PokerDatabaseService,
        private readonly utilsService: UtilityService
    ) { }



    /**
 * this function deducts real chips to player
 * @method deductRealChips
 * @param  {object}     params request json object containaing desired player id 
 * @param  {Function}   cb     callback function
 */
    async deductRealChips(params: any): Promise<any> {
        if (params.realChips >= params.chips) {
            const result = await this.db.deductRealChips({ playerId: params.playerId }, params.chips);
            return {
                success: true,
                totalBalance: result.value.realChips + result.value.realChipBonus,
                realChips: result.value.realChips,
                realChipBonus: result.value.realChipBonus,
                detectChipsFromRC: params.chips,
                realChipBonusDetected: 0,
                totalRC: result.value.realChips + params.chips,
                totalRCB: result.value.realChipBonus,
                freeChips: result.value.freeChips,
            };
        }

        if (params.isKYCVerified && params.realChipBonus + params.realChips >= params.chips) {
            const detectChipsFromRCB = params.chips - params.realChips;
            const detectChipsFromRC = params.realChips;
            const result = await this.db.deductRealChipBonus({ playerId: params.playerId }, params.realChips, detectChipsFromRCB);
            return {
                success: true,
                totalBalance: result.value.realChips + result.value.realChipBonus,
                realChips: result.value.realChips,
                realChipBonus: result.value.realChipBonus,
                detectChipsFromRC,
                realChipBonusDetected: detectChipsFromRCB,
                totalRC: result.value.realChips,
                totalRCB: result.value.realChipBonus + detectChipsFromRCB,
                freeChips: result.value.freeChips,
            };
        }

        return {
            success: false,
            channelId: params.channelId,
            info: 'You have insufficient chips to process request.',
        };
    };

    /**
     * this function deducts free chips to player
     * @method deductFreeChips
     * @param  {object}     params request json object containaing desired player id 
     * @param  {Function}   cb     callback function
     */
    async deductFreeChips(params: any): Promise<any> {
        if (params.freeChips >= params.chips) {
            const result = await this.db.deductFreeChips({ playerId: params.playerId }, params.chips);
            return {
                success: true,
                totalBalance: result.value.realChips + result.value.realChipBonus,
                realChips: result.value.realChips,
                realChipBonus: result.value.realChipBonus,
                freeChips: result.value.freeChips,
            };
        }

        return {
            success: false,
            channelId: params.channelId,
            info: 'You have insufficient chips to process request.',
        };
    };

    /**
     * this function adds real chips to player
     * @method addRealChips
     * @param  {object}     params request json object containaing desired player id 
     * @param  {Function}   cb     callback function
     */
    async addRealChips(params: any): Promise<any> {
        await this.db.addRealChipswithBonus({ playerId: params.playerId }, params.chips, params.bonusChips);
        return { success: true };
    };

    async addRealChipsWithoutBonus(params: any): Promise<any> {
        const result = await this.db.addRealChips({ playerId: params.playerId }, params.chips);
        return { success: true, result };
    }

    /**
     * Adds free chips to player
     */
    async addFreeChips(params: any): Promise<any> {
        await this.db.addFreeChips({ playerId: params.playerId }, params.chips);
        return { success: true };
    }

    /**
     * Returns user chip info with chip distribution logic
     */
    async getUserChips(params: any): Promise<any> {
        params.channelId = params.channelId || '';
        params.chips = this.utilsService.convertIntToDecimal(params.chips);

        const user = await this.db.findUser({ playerId: params.playerId });
        if (!user) {
            return {
                success: false,
                channelId: params.channelId,
                info: `Unable to deduct chips, user not found. Player id - ${params.playerId}`,
            };
        }

        let detectChipsFromRC = 0;
        let detectChipsFromRCB = 0;

        if (user.realChips >= params.chips) {
            detectChipsFromRC = params.chips;
        } else if (user.realChips && user.realChipBonus && user.realChipBonus < params.chips) {
            detectChipsFromRCB = params.chips - user.realChips;
            detectChipsFromRC = this.utilsService.convertIntToDecimal(params.chips - detectChipsFromRCB);
        } else if (user.realChips <= 0 && user.realChipBonus >= params.chips) {
            detectChipsFromRCB = params.chips;
        } else if (user.realChips && user.realChipBonus >= params.chips) {
            detectChipsFromRC = user.realChips;
            detectChipsFromRCB = params.chips - detectChipsFromRC;
        }

        return {
            success: true,
            totalBalance: user.realChips + user.realChipBonus,
            realChips: user.realChips,
            realChipBonus: user.realChipBonus,
            realChipBonusDetected: detectChipsFromRCB,
            detectChipsFromRC,
            freeChips: user.freeChips,
        };
    }

    /**
     * Deducts chips based on whether it's real or free chips
     */
    async deductChips(params: any): Promise<any> {
        params.channelId = params.channelId || '';
        const user = await this.db.findUser({ playerId: params.playerId });

        if (!user) {
            return {
                success: false,
                channelId: params.channelId,
                info: `Unable to deduct chips, user not found. Player id - ${params.playerId}`,
            };
        }

        if (params.isRealMoney) {
            params.realChips = user.realChips;
            params.realChipBonus = user.realChipBonus;
            params.isKYCVerified = user.isKYCVerified;
            return await this.deductRealChips(params);
        } else {
            params.freeChips = user.freeChips;
            return await this.deductFreeChips(params);
        }
    }

    /**
     * Adds real or free chips depending on the mode
     */
    async addOnlyRealChips(params: any): Promise<any> {
        params.channelId = params.channelId || '';
        params.chips = Math.round(params.chips);

        const user = await this.db.findUser({ playerId: params.playerId });
        if (!user) {
            return {
                success: false,
                channelId: params.channelId,
                info: `Unable to add chips, user not found. Player id - ${params.playerId}`,
            };
        }

        if (params.isRealMoney) {
            return await this.addRealChipsWithoutBonus(params);
        } else {
            return await this.addFreeChips(params);
        }
    }

    /**
     * Adds real chips (with bonus) or free chips depending on mode
     */
    async addChips(params: any): Promise<any> {
        params.channelId = params.channelId || '';
        params.chips = this.utilsService.convertIntToDecimal(params.chips);
        params.bonusChips = this.utilsService.convertIntToDecimal(params.bonusChips);

        const user = await this.db.findUser({ playerId: params.playerId });
        if (!user) {
            return {
                success: false,
                channelId: params.channelId,
                info: `Unable to add chips, user not found. Player id - ${params.playerId}`,
            };
        }

        if (params.isRealMoney) {
            return await this.addRealChips(params);
        } else {
            return await this.addFreeChips(params);
        }
    }





}