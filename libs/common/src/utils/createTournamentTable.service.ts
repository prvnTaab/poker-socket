import { Injectable } from "@nestjs/common";
import { PokerDatabaseService } from "../datebase/pokerdatabase.service";
import stateOfX from "../stateOfX.sevice";











@Injectable()
export class CreateTournamentTableService {

    constructor(
        private readonly db: PokerDatabaseService
    ) { }




    /**
       * Initializes basic tournament parameters
       * @param room Room configuration object
       */
    initializeParams(room: any): Promise<any> {
        const params: any = {};
        params.room = room;
        params.enrolledPlayers = 0;
        return params;
    }

    /**
     * Creates a temporary table object based on provided params
     * @param params Tournament room configuration and rules
     */
    tableKeys(params: any): any {
        const tempObj: any = {
            isActive: true,
            channelType: stateOfX.gameType.tournament,
            isRealMoney: JSON.parse(params.room.isRealMoney),
            channelName: params.room.channelName,
            turnTime: params.room.turnTime,
            callTime: params.room.callTime,
            isPotLimit: JSON.parse(params.room.isPotLimit),
            maxPlayers: params.room.maxPlayers,
            minPlayers: params.room.minPlayers,
            smallBlind: params.room.smallBlind,
            bigBlind: params.room.bigBlind,
            ante: params.room.ante,
            isStraddleEnable: false,
            minBuyIn: params.room.minBuyIn ?? null,
            maxBuyIn: params.room.maxBuyIn ?? null,
            numberOfRebuyAllowed: params.room.numberOfRebuyAllowed ?? null,
            hourLimitForRebuy: params.room.hourLimitForRebuy ?? null,
            rebuyHourFactor: params.room.rebuyHourFactor ?? null,
            isRebuyAllowed: params.room.isRebuyAllowed,
            gameInfo: params.room.gameInfo,
            gameInterval: params.room.gameInterval,
            blindMissed: params.room.blindMissed,
            channelVariation: params.room.channelVariation,
            noOfChipsAtGameStart: params.room.noOfChipsAtGameStart,
            rakeRule: null,
            tournament: {
                tournamentId: params.room._id.toString(),
                avgFlopPercent: params.room.avgFlopPercent,
                avgPot: params.room.avgPot,
                blindRule: params.room.blindRule.toString(),
                bountyFees: params.room.bountyFees,
                channelType: params.room.channelType,
                entryFees: params.room.entryFees,
                extraTimeAllowed: params.room.extraTimeAllowed,
                houseFees: params.room.houseFees,
                isBountyEnabled: params.room.isBountyEnabled,
                isActive: params.room.isActive,
                tournamentStartTime: params.room.tournamentStartTime,
                lateRegistrationAllowed: params.room.lateRegistrationAllowed,
                lateRegistrationTime: params.room.lateRegistrationTime,
                maxPlayersForTournament: params.room.maxPlayersForTournament,
                minPlayersForTournament: params.room.minPlayersForTournament,
                totalFlopPlayer: params.room.totalFlopPlayer,
                totalGame: params.room.totalGame,
                totalPlayer: params.room.totalPlayer,
                totalPot: params.room.totalPot,
                tournamentBreakTime: params.room.tournamentBreakTime,
                tournamentBreakDuration: params.room.tournamentBreakDuration,
                tournamentRules: params.room.tournamentRules,
                tournamentTime: params.room.tournamentTime,
                tournamentType: params.room.tournamentType,
                isRebuyAllowed: params.room.isRebuyAllowed,
                winTicketsForTournament: params.room.winTicketsForTournament,
                isRecurring: params.room.isRecurring,
                recurringTime: params.room.recurringTime,
                rebuyTime: params.room.rebuyTime,
                breakRuleId: params.room.breakRuleId,
                breakRuleData: params.breakRuleData.rule,
                blindRuleData: params.blindRuleData.list,
                timeBankRuleData: params.timeBankRuleData.rule,
                addOnTime: params.room.addOnTime,
                timeBankRule: params.room.timeBankRule,
                addonRule: params.room.addonRule,
                isAddonEnabled: params.room.isAddonEnabled,
            }
        };

        if (params.room.tournamentType === stateOfX.tournamentType.satelite) {
            tempObj.tournament.parentOfSatelliteId = params.room.parentOfSatelliteId;
        }

        return tempObj;
    }

    /**
     * Gets the number of enrolled players for a given tournament
     * @param params Contains tournamentId and gameVersionCount
     */
    async enrolledPlayers(params: any): Promise<any> {
        const filter = {
            tournamentId: params.room._id.toString(),
            gameVersionCount: params.room.gameVersionCount
        };

        const result = await this.db.countTournamentusers(filter);
        params.enrolledPlayers = result;
        return params;
    }

    /**
     * Deletes all existing tournament tables for a given room
     * @param params Contains room ID
     */
    async deleteExistingTables(params: any): Promise<any> {
        await this.db.removeTournamentTable(params.room._id.toString());
        return params;
    }

    /**
     * Creates multiple tables based on enrolled players and maxPlayers per table
     * @param params Contains room and enrolled player count
     */
    async createTable(params: any): Promise<any> {
        const noOfTables = Math.ceil(params.enrolledPlayers / params.room.maxPlayers);
        const tables = [];

        for (let i = 0; i < noOfTables; i++) {
            tables.push(this.tableKeys(params));
        }

        await this.db.createTournamentTables(tables);
        return params;
    }

    /**
     * this function creates a single table
     * @method createOnetable
     * @param  {object}       params request json object
     * @param  {Function}     cb     callback function
     */
    async createOnetable(params: any): Promise<any> {
        const table = this.tableKeys(params);
        const result = await this.db.createTournamentTables(table);
        params.table = result[0];
        return params;
    }
    /**
     * this function gets break rule from breakRuleId
     * @method getBreakRule
     * @param  {object}     params request json object
     * @param  {Function}   cb     callback function
     */
    async getBreakRule(params: any): Promise<any> {
        const result = await this.db.findBreakRule(params.room.breakRuleId);
        if (!result) throw new Error('Break rule not found');
        params.breakRuleData = result;
        return params;
    }


    /**
     * this function gets blind rule using blind id
     * @method getBlindRule
     * @param  {object}        params request json object
     * @param  {Function}      cb     callback function
     */
    async getBlindRule(params: any): Promise<any> {
        const result = await this.db.findBlindRule(params.room.blindRule);
        if (!result) throw new Error('Blind rule not found');
        params.blindRuleData = result;
        return params;
    }

    /**
     * this function gets timebank rule using timebankrule id
     * @method getTimeBankRule
     * @param  {object}        params request json object
     * @param  {Function}      cb     callback function
     */
    async getTimeBankRule(params: any): Promise<any> {
        const result = await this.db.findTimeBankRule(params.room.timeBankRule);
        if (!result) throw new Error('Time bank rule not found');
        params.timeBankRuleData = result;
        return params;
    }

    /**
     * this function creates tables when the game starts
     * @method create
     * @param  {object}   room request json object
     * @param  {Function} cb   callback function
     */
    async create(room: any): Promise<{ success: boolean }> {
        try {
            let params = await this.initializeParams(room);
            params = await this.enrolledPlayers(params);
            params = await this.deleteExistingTables(params);
            params = await this.getBlindRule(params);
            params = await this.getBreakRule(params);
            params = await this.getTimeBankRule(params);
            await this.createTable(params);
            return { success: true };
        } catch {
            return { success: false };
        }
    }

    /**
     * this function gets tounament room on the basis of tournament id
     * @method getTournamentRoom
     * @param  {object}          params request json object
     * @param  {Function}        cb     callback function
     */
    async getTournamentRoom(params: any): Promise<any> {
        const result = await this.db.getTournamentRoom(params.tournamentId);
        if (!result) throw new Error('Tournament room not found');
        params.room = result;
        return params;
    }

    /**
     * this function creates table for late registration player if no table is vacant, using tournament id
     * @method createTableByTournamentId
     * @param  {object}                  tournamentId 
     * @param  {Function}                cb           callback function
     */
    async createTableByTournamentId(tournamentId: any): Promise<any> {
        try {
            let params: any = { tournamentId };
            params = await this.getTournamentRoom(params);
            params = await this.enrolledPlayers(params);
            params = await this.getBlindRule(params);
            params = await this.getBreakRule(params);
            params = await this.getTimeBankRule(params);
            params = await this.createOnetable(params);
            return { success: true, table: params.table };
        } catch {
            return { success: false };
        }
    }




}