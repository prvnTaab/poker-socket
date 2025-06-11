import { Injectable } from "@nestjs/common";







@Injectable()
export class TimeBankRemoteService {


    /**
 * this function is used to update time bank 
 *
 * @method processTimeBank
 * @param  {Object}       params  request json object
 * @param  {Function}     cb      callback function
 * @return {Object}               params/validated object
 */
    async processTimeBank(params: any): Promise<any> {
        const timeBankLevelForUpdate = params.table.timeBankLevel;
        const timeBankRule = params.table.timeBankRuleData;
        let timeBankValue: number | undefined;
        let i: number;

        for (i = 0; i < timeBankRule.length; i++) {
            if (timeBankRule[i].blindLevel === timeBankLevelForUpdate) {
                timeBankValue = timeBankRule[i].time;
                break;
            }
        }

        if (typeof timeBankValue === 'undefined') {
            throw new Error("Time bank value not found for the given blind level.");
        }

        params.table.timeBankLevel = timeBankRule[i + 1]?.blindLevel ?? timeBankRule[i].blindLevel;

        for (let j = 0; j < params.table.players.length; j++) {
            const player = params.table.players[j];
            const tData = player.tournamentData;

            if (tData.timeBankLeft === -1) {
                tData.totalTimeBank += timeBankValue;
                tData.timeBankLeft += timeBankValue + 1;
            } else {
                tData.totalTimeBank += timeBankValue;
                tData.timeBankLeft += timeBankValue;
            }
        }

        return params;
    };




    /**
     * This function consists of a series of async functions to update time bank
     *
     * @method updateTimeBank
     * @param  {Object}       params  request json object
     * @param  {Function}     cb      callback function
     * @return {Object}               params/validated object
     */
    async updateTimeBank(params: any): Promise<{ success: boolean; params?: any }> {
        try {
            const result = await this.processTimeBank(params);
            return { success: true, params: result };
        } catch (error) {
            return { success: false };
        }
    };




}