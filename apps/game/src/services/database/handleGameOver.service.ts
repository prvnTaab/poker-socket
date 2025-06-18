import { Injectable } from "@nestjs/common";
import _ from 'underscore';
import _ld from "lodash";
import { stateOfX, popupTextManager, UtilityService } from "shared/common";
import { ImdbDatabaseService } from "shared/common/datebase/Imdbdatabase.service";
import { PokerDatabaseService } from "shared/common/datebase/pokerdatabase.service";
import { WalletQueryService } from "../../utils/walletQuery.service";
import { ActivityService } from "shared/common/activity/activity.service";
import { DeductRakeService } from "./utils/deductRake.service";
import { DecideWinnerService } from "./utils/decideWinner.service";
import { MegaPointsManagerService } from "./megaPointsManager.service";
import { UserRemoteService } from "./userRemote.service";
import { SummaryGeneratorService } from "./utils/summaryGenerator.service";
import { AdjustActiveIndexService } from "./adjustActiveIndex.service";
import { CalculateRanksService } from "./calculateRanks.service";
import { DynamicRanksService } from "./dynamicRanks.service";
import { ManageBountyService } from "./manageBounty.service";
import { BlindUpdateService } from "./blindUpdate.service";
import { TimeBankRemoteService } from "./timeBankRemote.service";
import { AutoAddonRemoteService } from "./autoAddonRemote.service";
import { PostsplitService } from "./potsplit.service";
import { TableManagerService } from "./tableManager.service";
import { ResponseHandlerDbService } from "./responseHandlerDb.service";
import { WinnerRemoteService } from "./winnerRemote.service";
import { TableConfigManagerService } from "./tableConfigManager.service";
import { RewardRakeService } from "./rewardRake.service";
import { AutoRebuyRemoteService } from "./autoRebuyRemote.service";
import * as PokerOddsCalc from 'poker-odds-calc';
import { validateKeySets } from "shared/common/utils/activity";
import { OutsScriptService } from "shared/common/utils/outsScript.service";

declare const pomelo: any;

@Injectable()
export class HandleGameOverService {

    private moveDataMap = new Map();
    private infoMessage = popupTextManager.falseMessages;
    private dbInfoMessage = popupTextManager.dbQyeryInfo;

    constructor(
        private readonly db: PokerDatabaseService,
        private readonly imdb: ImdbDatabaseService,
        private readonly utilsService: UtilityService,
        private readonly wallet: WalletQueryService,
        private readonly decideWinner: DecideWinnerService,
        private readonly deductRake: DeductRakeService,
        private readonly megaPointsManager: MegaPointsManagerService,
        private readonly userRemote: UserRemoteService,
        private readonly summary: SummaryGeneratorService,
        private readonly adjustIndex: AdjustActiveIndexService,
        private readonly calculateRanks: CalculateRanksService,
        private readonly dynamicRanks: DynamicRanksService,
        private readonly manageBounty: ManageBountyService,
        private readonly blindUpdate: BlindUpdateService,
        private readonly timeBankRemote: TimeBankRemoteService,
        private readonly potsplit: PostsplitService,
        private readonly tableManager: TableManagerService,
        private readonly responseHandler: ResponseHandlerDbService,
        private readonly winnerRemote: WinnerRemoteService,
        private readonly tableConfigManager: TableConfigManagerService,
        private readonly rewardRake: RewardRakeService,
        private readonly autoRebuyRemote: AutoRebuyRemoteService,
        private readonly outsScript: OutsScriptService,
        private readonly activity: ActivityService

    ) { }




    // ### Validate if Game State remains same throughout calculation of Game Over
    async isGameProgress(params: any): Promise<any> {
        if (params.table.state === stateOfX.gameState.gameOver) {
            return {
                success: true,
                isSingleWinner: params.data.isSingleWinner,
                winners: params.data.winners,
                endingType: params.data.endingType,
                params,
            };
        } else {
            return {
                success: false,
                channelId: params.channelId || '',
                info: this.infoMessage.ISGAMEPROGRESS_HANDLEGAMEOVER,
                isRetry: false,
                isDisplay: true,
            };
        }
    }

    // ### Add additional params in existing one for calculation
    async initializeParams(params: any): Promise<any> {
        const isGameProgressResponse = await this.isGameProgress(params);
        if (isGameProgressResponse.success) {
            params.data = _.omit(params.data, '__route__');
            params.data.isBlindUpdated = false;
            params.data.decisionParams = [];
            params.data.cardSets = null;
            params.data.winners = [];
            params.data.isSingleWinner = false;
            params.data.endingType = stateOfX.endingType.gameComplete;
            params.data.rakeDeducted = 0;
            params.data.remainingBoardCards = [[], []];
            params.data.pot = [];
            params.data.cardsToShow = {};
            params.data.rewardDistributed = false;
            params.data.rakeShouldDeduct = false;
            return params;
        } else {
            throw isGameProgressResponse;
        }
    }

    // get single winner that means - 
    // no one else is available to compete
    // either all other players have folded or left
    async isSingleWinner(params: any): Promise<any> {
        const isGameProgressResponse = await this.isGameProgress(params);
        if (isGameProgressResponse.success) {
            const getSingleWinnerResponse = await this.winnerRemote.getSingleWinner(params);
            return getSingleWinnerResponse;
        } else {
            throw isGameProgressResponse;
        }
    }

    // assign pot index to each pot
    async assignPotIndexAndBoard(params: any): Promise<any> {
        const isGameProgressResponse = await this.isGameProgress(params);
        if (isGameProgressResponse.success) {
            for (const pot of params.table.pot) {
                const potIndex = _.indexOf(params.table.pot, pot);
                pot.amount = this.utilsService.convertIntToDecimal(pot.amount);
                pot.potIndex = potIndex;
                pot.borardSet = 0;
            }
            return params;
        } else {
            throw {
                success: false,
                channelId: params.channelId || '',
                info: this.infoMessage.ASSIGNPOTINDEXANDBOARD_HANDLEGAMEOVER,
                isRetry: false,
                isDisplay: true,
            };
        }
    }

    // ### Unique contributor for pots

    async refinePotContributors(params: any): Promise<any> {
        const isGameProgressResponse = await this.isGameProgress(params);
        if (isGameProgressResponse.success) {
            for (const pot of params.table.pot) {
                pot.contributors = _.uniq(pot.contributors);
            }
            return params;
        } else {
            throw {
                success: false,
                channelId: params.channelId || '',
                info: this.infoMessage.REFINEPOTCONTRIBUTORS_HANDLEGAMEOVER,
                isRetry: false,
                isDisplay: true,
            };
        }
    }

    // create pots in params.data for further calculations and decisionParams
    assignBoardAndAmount(
        params: any,
        pot: any,
        amount: number,
        potIndex: number,
        boardSet: number,
        isRefund: boolean,
        internalPotSplitIndex: string,
    ): void {
        params.data.pot.push({
            amount,
            contributors: pot.contributors,
            potIndex,
            borardSet: boardSet,
            isRefund,
            internalPotSplitIndex,
        });
    }

    // divide pot and if run it twice, assign board cards
    async dividePotAndAssignBoardSet(params: any): Promise<any> {
        const potList = params.table.pot;

        for (const pot of potList) {
            if (pot.contributors.length === 1) {
                const internalPotSplitIndex = pot.potIndex.toString();
                this.assignBoardAndAmount(params, pot, pot.amount, pot.potIndex, 0, true, internalPotSplitIndex);
            } else {
                let allRITValue = false;
                let allEvValue = false;

                if (params.data.evChopDetails) {
                    allRITValue = params.data.evChopDetails.every((player: any) => player.evRIT === true);
                    allEvValue = params.table?.evChopDetails?.every((player: any) => player.evChop === false);
                }

                const isRITapplied = await this.tableManager.isRunItTwice(params, pot.contributors);
                if (
                    (isRITapplied && !params.table.isEvChopTable) ||
                    (!!params.table.isEvChopTable && !!params.table.isRunItTwiceTable && !!allEvValue) ||
                    (!!params.table.isEvChopTable && !params.table.isRunItTwiceTable && allRITValue)
                ) {
                    const tempPotAmount = this.utilsService.convertIntToDecimal(pot.amount / 2);
                    const internalPotSplitIndexHigh = pot.potIndex.toString() + '0';
                    const internalPotSplitIndexLow = pot.potIndex.toString() + '1';

                    this.assignBoardAndAmount(params, pot, tempPotAmount, pot.potIndex, 0, false, internalPotSplitIndexHigh);
                    this.assignBoardAndAmount(params, pot, tempPotAmount, pot.potIndex, 1, false, internalPotSplitIndexLow);
                    params.data.rakeShouldDeduct = true;
                } else {
                    const internalPotSplitIndex = pot.potIndex.toString();
                    const potClone = JSON.parse(JSON.stringify(pot));
                    this.assignBoardAndAmount(params, potClone, potClone.amount, potClone.potIndex, 0, false, internalPotSplitIndex);
                }
            }
        }

        return params;
    }
    // ### Validate pot amount
    // > in case of all other players folded in PRECHECK round
    // > Insert amount in pot from player bet
    async validatePotAmount(params: any): Promise<any> {
        const processSplitResponse = await this.potsplit.processSplit(params);

        if (processSplitResponse.success) {
            params = processSplitResponse.params;

            if (params.data.sidePots && params.data.sidePots.length > 0) {
                params.table.pot = params.data.sidePots;
                return params;

                for (let i = 0; i < params.data.sidePots.length; i++) {
                    for (let j = 0; j < params.table.pot.length; j++) {
                        if (params.table.pot[j].contributors.length === params.data.sidePots[i].contributors.length) {
                            params.table.pot[j].amount += params.data.sidePots[i].amount;
                            params.data.sidePots[i].processed = true;
                        }
                    }
                }

                for (let k = 0; k < params.data.sidePots.length; k++) {
                    if (params.data.sidePots[k].processed === false) {
                        params.table.pot.push(params.data.sidePots[k]);
                    }
                }
            }

            return params;
        } else {
            throw processSplitResponse;
        }
    }

    // Set average pot value for this table
    // statistical feature - shown on lobby for each row
    // represents - average of pots made in all games played on this table
    async updateAvgPot(params: any): Promise<any> {

        if (params.table.channelType === stateOfX.gameType.tournament) {
            return params;
        }

        const result = await this.db.findTableById(params.channelId);

        const totalStack = result.totalStack + this.tableManager.getTotalPot(params.table.pot);
        const totalGame = result.totalGame + 1;
        const avgStack = this.utilsService.convertIntToDecimal(totalStack / totalGame);
        params.data.avgPot = avgStack;

        await this.db.updateStackTable(params.channelId, totalGame, totalStack, avgStack);

        params.table.totalPotForRound = this.utilsService.convertIntToDecimal(this.tableManager.getTotalPot(params.table.pot));
        return params;
    }

    // ### Reset table values on game over
    async resetTableOnGameOver(params: any): Promise<any> {

        const isGameProgressResponse = await this.isGameProgress(params);
        if (!isGameProgressResponse.success) {
            throw isGameProgressResponse;
        }

        if (params.table.currentChannelVariation === stateOfX.channelVariation.roe) {
            if (params.table.isROE && params.table.channelRound === 1) {
                switch (params.table.channelVariation) {
                    case stateOfX.channelVariation.holdem:
                        params.table.channelVariation = stateOfX.channelVariation.omaha;
                        params.table.isPotLimit = true;
                        break;
                    case stateOfX.channelVariation.omaha:
                        params.table.channelVariation = stateOfX.channelVariation.FiveCardOmaha;
                        params.table.isPotLimit = true;
                        break;
                    case stateOfX.channelVariation.FiveCardOmaha:
                        params.table.channelVariation = stateOfX.channelVariation.SixCardOmaha;
                        params.table.isPotLimit = true;
                        break;
                    case stateOfX.channelVariation.SixCardOmaha:
                        params.table.channelVariation = stateOfX.channelVariation.holdem;
                        params.table.isPotLimit = false;
                        break;
                }
                params.table.channelRoundCount = 1;
                params.table.isROE = true;
                params.table.channelRound = params.table.maxPlayers;
            } else {
                params.table.isROE = true;
                params.table.channelRound = params.table.channelRound ? params.table.channelRound - 1 : 1;
                params.table.channelRoundCount++;
            }
        }

        params.table.state = stateOfX.gameState.idle;
        params.table.stateInternal = stateOfX.gameState.starting;
        params.table.roundCount++;
        params.table.prevDealerseatIndex = params.table.dealerSeatIndex;
        params.table.prevDealerIndex = params.table.dealerIndex;
        params.table.lastRoundName = params.table.roundName;
        params.table.roundName = null;
        params.table.roundBets = [];
        params.table.roundMaxBet = 0;
        params.table.maxBetAllowed = 0;
        params.table.minRaiseAmount = 0;
        params.table.maxRaiseAmount = 0;
        params.table.lastBetOnTable = 0;
        params.table.contributors = [];
        params.table.roundContributors = [];
        params.table.boardCard = [[], []];
        params.table.preChecks = [];
        params.table.isAllInOcccured = false;
        params.table.isOperationOn = false;
        params.table.isBettingRoundLocked = false;
        params.table.isRunItTwiceApplied = false;
        params.table.actionName = "";
        params.table._v = 1;

        return params;
    }

    // tournament
    async getPlayingPlayers(tournamentId: string, channelId: string): Promise<any> {
        const channels = await this.imdb.findChannels({ tournamentId });

        let playingPlayers = 0;
        for (const channel of channels) {
            for (const player of channel.players) {
                if (
                    player.state === stateOfX.playerState.playing ||
                    player.state === stateOfX.playerState.waiting
                ) {
                    playingPlayers++;
                }
            }
        }

        return { success: true, playingPlayers };
    }

    // tournament
    async deleteUserActivity(playersWithNoChips: any[], tournamentId: string): Promise<void> {
        for (const player of playersWithNoChips) {
            await this.imdb.removeActivity({ playerId: player.playerId, tableId: tournamentId });
        }
    }

    // tournament

    async distributeBounty(params: any): Promise<any> {
        if (
            params.table.channelType === stateOfX.gameType.tournament &&
            params.table.tournamentRules.isBountyEnabled
        ) {
            const bountyResponse = await this.manageBounty.process(params);
            if (bountyResponse.success) {
                return bountyResponse.result;
            } else {
                throw bountyResponse;
            }
        } else {
            return params;
        }
    }

    //### update blind rule in tournament
    async updateBlindRule(params: any): Promise<any> {

        if (params.table.channelType === stateOfX.gameType.tournament) {
            const updateBlindResponse = await this.blindUpdate.updateBlind(params);

            if (updateBlindResponse.success) {
                params.table = updateBlindResponse.params.table;
                return params;
            } else {
                throw updateBlindResponse;
            }
        } else {
            return params;
        }
    }

    //this function is used to update the timebank if blind level is equal to the timebank level
    async updateTimeBank(params: any): Promise<any> {
        if (params.table.channelType !== stateOfX.gameType.normal) {
            await this.dynamicRanks.getRegisteredTournamentUsers(params.table.tournamentRules.tournamentId);
            const updateTimeBankResponse = await this.timeBankRemote.updateTimeBank(params);


            if (updateTimeBankResponse.success) {
                return updateTimeBankResponse.params;
            } else {
                throw updateTimeBankResponse;
            }
        } else {
            return params;
        }
    }

    // create record for hand tab
    async createBasicHandTab(params: any): Promise<any> {
        const totalPot = this.tableManager.getTotalCompetitionPot(params.table.pot);
        params.table.summaryOfAllPlayers["boardCard"] = params.table.boardCard;

        try {
            await this.db.createHandTab(params, totalPot);
            return params;
        } catch (err) {
            throw {
                success: false,
                isRetry: false,
                isDisplay: false,
                channelId: params.channelId || "",
                info: popupTextManager.dbQyeryInfo.DBCREATEHANDTAB_FAIL_SETTABLECONFIG + JSON.stringify(err)
            };
        }
    }
    // update hand tab - the row which shows history and video in game
    async updateHandTab(params: any): Promise<any> {
        const totalPot = await this.tableManager.getTotalCompetitionPot(params.table.pot);
        params.table.summaryOfAllPlayers["boardCard"] = params.table.boardCard;

        try {
            await this.db.updateHandTab(
                params.channelId,
                params.table.roundId,
                {
                    pot: totalPot,
                    hands: params.table.boardCard,
                    active: true,
                    allPots: params.table.pot
                }
            );
            return params;
        } catch (err) {
            throw {
                success: false,
                channelId: params.channelId,
                info: "Error while updating handtab: " + JSON.stringify(err),
                isRetry: false,
                isDisplay: false
            };
        }
    }

    /**
     *
     * 
     * @method autoRebuy
     * @param  {[type]}   params request json object
     * @param  {Function} cb     callback function
     * @return {[type]}          validated/params
     */
    async autoRebuy(params) {
        if (params.table.channelType === stateOfX.gameType.tournament && params.table.isRebuyAllowed) {
            const updateAutoRebuyResponse = await this.autoRebuyRemote.updateAutoRebuy(params);
            console.log("updateAutoRebuyResponse in handleGameOver is ", JSON.stringify(updateAutoRebuyResponse));
            if (updateAutoRebuyResponse.success) {
                params = updateAutoRebuyResponse.params;
                return params;
            } else {
                return updateAutoRebuyResponse;
            }
        } else {
            return params;
        }
    }


    /**
     * this function deals with auto addOn for each player according to blind level
     *
     * @method autoAddonProcess
     * @param  {[type]}   params request json object
     * @param  {Function} cb     callback function
     * @return {[type]}          validated/params
     */
    async autoAddonProcess(params) {
        if (params.table.channelType === stateOfX.gameType.tournament && params.table.isAddOnAllowed) {
            const autoAddonProcessResponse = await this.autoAddonProcess(params);
            if (autoAddonProcessResponse.success) {
                params = autoAddonProcessResponse.params;
                return params;
            } else {
                return autoAddonProcessResponse;
            }
        } else {
            return params;
        }
    }

    // update every player stats about win(real/play money)/lose
    async updateEveryPlayerStats(params) {
        let playerIds = this.getWinnerPlayerIds(params);
        let keyName = params.table && params.table.isRealMoney ? "statistics.handsWonRM" : "statistics.handsWonPM";
        this.userRemote.updateStats({ playerIds: playerIds, data: { [keyName]: 1 }, bySystem: true });

        playerIds = this.getLosserPlayerIds(params);
        this.userRemote.updateStats({ playerIds: playerIds, data: { "statistics.handsLost": 1 }, bySystem: true });

        await this.activity.logWinnings(
            params.table.channelType,
            params.table.channelVariation,
            params.table.channelId,
            Number(new Date()),
            params.data.winners,
            params.table.contributors
        );

        return params;
    }
    // return array of playerIds who won
    getWinnerPlayerIds(params) {
        return _.uniq(_.pluck(params.data.winners, 'playerId'));
    }


    // return array of playerIds who did not win
    getLosserPlayerIds(params) {

        return _.difference(params.table.onStartPlayers, _.uniq(_.pluck(params.data.winners, 'playerId')));
    }

    // update summary of each player on game over, 
    // seat wise, pot wise, winner wise
    async summaryOnGameOver(params) {
        params.table.gamePlayers = params.table.players.concat(params.table.removedPlayers || []);
        const response = await this.summary.updateSummaryOfEachPlayer(params);
        const resp = {
            success: true,
            winners: response.data.winners,
            rakeDetails: response.rakeDetails,
            boardCard: response.data.boardCard,
            endingType: response.data.endingType,
            rakeDeducted: response.data.rakeDeducted,
            cardsToShow: response.data.cardsToShow,
            params: response
        };
        await this.activity.gameOver(response, stateOfX.profile.category.gamePlay, stateOfX.gamePlay.subCategory.gameOver, resp, stateOfX.logType.success);
        return response;
    }

    // ### Set state of player as playing if state is not playing
    async setStatePlaying(params: any): Promise<any> {
        if (params.table.channelType === stateOfX.gameType.tournament) {
            for (let i = 0; i < params.table.players.length; i++) {
                if (params.table.players[i].state !== stateOfX.playerState.outOfMoney) {
                    params.table.players[i].state = stateOfX.playerState.playing;
                }
            }
        }
        return params;
    }

    // Change state for bankrupt players
    setBankruptPlayerState(player: any): boolean {
        if (player.state === stateOfX.playerState.onBreak) {
            return true;
        }

        player.state = player.chips <= 0 ? stateOfX.playerState.outOfMoney : player.state;
        player.state = player.chips > 0 && player.state === stateOfX.playerState.outOfMoney ? stateOfX.playerState.playing : player.state;
        return true;
    }

    // ### Add chips in players on-table amount
    // > If player have opted auto rebuy option
    async deductAutoBuyIn(params: any): Promise<any> {
        if (params.table.channelType === stateOfX.gameType.normal) {
            const isGameProgressResponse = await this.isGameProgress(params);
            if (!isGameProgressResponse.success) {
                throw isGameProgressResponse;
            }

            for (const player of params.table.players) {
                player.autoBuyInFlag = false;
                if (
                    player.chips <= 0 &&
                    player.isAutoReBuy &&
                    this.utilsService.convertIntToDecimal(player.onSitBuyIn) >= params.table.minBuyIn &&
                    this.utilsService.convertIntToDecimal(player.onSitBuyIn) <= params.table.maxBuyIn
                ) {
                    player.autoBuyInFlag = true;

                    try {
                        const refNumber = await this.imdb.findRefrenceNumber({ playerId: params.playerId, channelId: params.channelId });

                        params.referenceNumber = refNumber.length ? refNumber[0].referenceNumber : 'aa';
                    } catch {
                        params.referenceNumber = 'aa';
                    }

                    const dataForWallet = {
                        action: 'topUp',
                        data: {
                            playerId: player.playerId,
                            points: player.points,
                            isKYCVerified: player.isKYCVerified,
                            isRealMoney: params.table.isRealMoney,
                            chips: this.utilsService.convertIntToDecimal(player.onSitBuyIn),
                            channelId: params.channelId,
                            channelName: params.table.channelName,
                            transactionType: 'Top Up',
                            referenceNumber: params.referenceNumber
                        }
                    };

                    const deductChipsResponse = await this.wallet.sendWalletBroadCast(dataForWallet);

                    if (deductChipsResponse.success) {
                        player.points = deductChipsResponse.points;

                        if (player.lastRealChipBonus <= player.chips) {
                            const tmpData = player.chips - player.lastRealChipBonus || 0;
                            player.lastRealChipBonus = this.utilsService.convertIntToDecimal(player.chips - tmpData);
                            player.lastRealChip = player.chips - player.lastRealChipBonus;
                        } else {
                            player.lastRealChipBonus = player.chips;
                        }

                        player.chips = this.utilsService.convertIntToDecimal(player.onSitBuyIn);
                        let lastRCDetected = 0;
                        let lastRCBDetected = 0;

                        if (deductChipsResponse.data.detectChipsFromRC) {
                            lastRCDetected = deductChipsResponse.data.detectChipsFromRC;
                            player.lastRealChip += this.utilsService.convertIntToDecimal(lastRCDetected);
                        }

                        if (deductChipsResponse.data.realChipBonusDetected) {
                            lastRCBDetected = deductChipsResponse.data.realChipBonusDetected;
                            player.lastRealChipBonus += this.utilsService.convertIntToDecimal(lastRCBDetected);
                            player.currentRCBstack += this.utilsService.convertIntToDecimal(lastRCBDetected);
                        }

                        const query = {
                            playerId: player.playerId,
                            channelId: player.channelId,
                            amount: player.chips,
                            createdAt: new Date()
                        };

                        await this.imdb.addPlayerScore(query);
                        await this.setBankruptPlayerState(player);
                    }
                }
            }
        }
        return params;
    }

    // ### Set player state based on different conditions
    async setPlayerState(params: any, player: any): Promise<any> {
        if (player.state === stateOfX.playerState.disconnected) {
            player.disconnectedMissed = player.disconnectedMissed + 1;
        }

        // If player is reserved then skip changing player state
        if (player.state === stateOfX.playerState.reserved) {
            return params;
        }

        // Change state for bankrupt players
        this.setBankruptPlayerState(player);

        // Set player state SITOUT for those players who have opted
        // > to sit out in next hand
        // > In tournament if only two player left and player state is OUTOFMONEY then do not reset it to ONBREAK otherwise Game will never end
        if (params.table.channelType === stateOfX.gameType.tournament) {
            if (player.state !== stateOfX.playerState.outOfMoney) {
                if (player.sitoutNextHand) {
                    player.tournamentData.isTournamentSitout = true;
                }
            }
        } else {
            player.state = (player.sitoutNextHand) ? stateOfX.playerState.onBreak : player.state;
        }

        if (!player.sitoutNextBigBlind) {
            return params;
        }

        this.activity.playerState(player, stateOfX.profile.category.game, stateOfX.game.subCategory.playerState, stateOfX.logType.info);
        return params;
    }

    // Calculate Player Score
    async calculatePlayerScore(player: any): Promise<any> {
        const res = await this.imdb.getPlayerBuyInSum({
            playerId: player.playerId,
            channelId: player.channelId
        });

        player.playerScore = this.utilsService.convertIntToDecimal((player.chips - (res[0] ? res[0].sum : 0)));
        return player;
    }


    // ### Reset players attributes on game over
    // update player chips (if he opted some feature for that) + deduct from profile balance
    async resetPlayersOnGameOver(params: any): Promise<any> {
        if (params.table.onStartPlayers[0] == null) {
            params.table.onStartPlayers = [];
            params.table.onStartPlayers = params.table.onStartPlayersCustom;
        }

        let playerAfter: any;
        let playerBefore: any;

        try {
            const isGameProgressResponse = await this.isGameProgress(params);
            if (!isGameProgressResponse.success) {
                throw isGameProgressResponse;
            }

            params.data.tempBBIndex = params.table.bigBlindIndex;

            if (params.table.players.filter(p => p.state === stateOfX.playerState.playing).length > 2) {
                playerAfter = params.table.players.slice(params.table.bigBlindIndex);
                playerBefore = params.table.players.slice(0, params.table.bigBlindIndex);
                params.table.players = playerAfter.concat(playerBefore);
                params.data.tempBBIndex = 0;
            }

            for (const player of params.table.players) {
                try {
                    player.sitoutGameMissed = player.autoSitout && params.table.channelType === stateOfX.gameType.normal
                        ? player.sitoutGameMissed + 1
                        : player.sitoutGameMissed;

                    if (player.state === stateOfX.playerState.onBreak &&
                        (params.table.isCTEnabledTable && player.playerScore > 0 &&
                            ((player.playerCallTimer.status === false &&
                                player.callTimeGameMissed <= params.table.ctEnabledBufferHand) ||
                                (player.playerCallTimer.status === true && !player.playerCallTimer.isCallTimeOver))
                        )) {
                        player.sitoutGameMissed = 0;
                    }

                    player.chips = this.utilsService.convertIntToDecimal(player.chips) + (player.tournamentData?.rebuyChips || 0);

                    let chipsAddedActually = 0;
                    let scoreQuery: any;
                    const playerOldChips = player.chips;

                    if (this.utilsService.convertIntToDecimal(player.chipsToBeAdded) > 0) {
                        scoreQuery = {
                            playerId: player.playerId,
                            channelId: player.channelId,
                            amount: 0,
                            createdAt: new Date()
                        };

                        if (player.chips <= 0) {
                            player.lastRealChipBonus = 0;
                            player.lastRealChip = 0;
                        }

                        if (player.chips + player.chipsToBeAdded >= params.table.maxBuyIn && player.chips < params.table.maxBuyIn) {
                            chipsAddedActually = params.table.maxBuyIn - player.chips;

                            if (player.chips + player.chipsToBeAdded >= params.table.maxBuyIn) {
                                if (player.RCtoBeAdded >= chipsAddedActually) {
                                    player.RCtoBeAdded = chipsAddedActually;
                                    player.realChipBonusToBeAdded = 0;
                                } else if (player.RCtoBeAdded && player.realChipBonusToBeAdded && player.realChipBonusToBeAdded < chipsAddedActually) {
                                    player.realChipBonusToBeAdded = chipsAddedActually - player.RCtoBeAdded;
                                    player.RCtoBeAdded = chipsAddedActually - player.realChipBonusToBeAdded;
                                } else if (player.RCtoBeAdded <= 0 && player.realChipBonusToBeAdded >= chipsAddedActually) {
                                    player.realChipBonusToBeAdded = chipsAddedActually;
                                    player.RCtoBeAdded = 0;
                                } else if (player.RCtoBeAdded && player.realChipBonusToBeAdded && player.realChipBonusToBeAdded >= chipsAddedActually) {
                                    player.RCtoBeAdded = player.RCtoBeAdded;
                                    player.realChipBonusToBeAdded = chipsAddedActually - player.RCtoBeAdded;
                                } else {
                                    player.RCtoBeAdded = 0;
                                    player.realChipBonusToBeAdded = 0;
                                }
                            }

                            player.realChipBonusToBeAdded = 0;
                            player.RCtoBeAdded = 0;
                            player.chips = this.utilsService.convertIntToDecimal(params.table.maxBuyIn);
                            scoreQuery.amount = chipsAddedActually;
                            player.onSitBuyIn = player.chips;
                        }
                        else if (player.chips + player.chipsToBeAdded <= params.table.maxBuyIn) {
                            chipsAddedActually = this.utilsService.convertIntToDecimal(player.chipsToBeAdded);
                            if (player.RCtoBeAdded >= chipsAddedActually) {
                                player.RCtoBeAdded = chipsAddedActually;
                                player.realChipBonusToBeAdded = 0;
                            } else if (player.RCtoBeAdded && player.realChipBonusToBeAdded && player.realChipBonusToBeAdded < chipsAddedActually) {
                                player.realChipBonusToBeAdded = chipsAddedActually - player.RCtoBeAdded;
                                player.RCtoBeAdded = chipsAddedActually - player.realChipBonusToBeAdded;
                            } else if (player.RCtoBeAdded <= 0 && player.realChipBonusToBeAdded >= chipsAddedActually) {
                                player.realChipBonusToBeAdded = chipsAddedActually;
                                player.RCtoBeAdded = 0;
                            } else if (player.RCtoBeAdded && player.realChipBonusToBeAdded && player.realChipBonusToBeAdded >= chipsAddedActually) {
                                player.RCtoBeAdded = player.RCtoBeAdded;
                                player.realChipBonusToBeAdded = chipsAddedActually - player.RCtoBeAdded;
                            } else {
                                player.RCtoBeAdded = 0;
                                player.realChipBonusToBeAdded = 0;
                            }

                            player.realChipBonusToBeAdded = 0;
                            player.RCtoBeAdded = 0;
                            player.chips = this.utilsService.convertIntToDecimal(player.chips + player.chipsToBeAdded);
                            scoreQuery.amount = chipsAddedActually;
                            player.onSitBuyIn = player.chips;
                        } else {
                            chipsAddedActually = 0;
                            player.lastRealChipBonus = player.currentRCBstack || 0;
                            player.currentRCBstack = player.lastRealChipBonus;
                            player.lastRealChip = 0;
                        }
                    } else {
                        if (player.lastRealChip <= 0 && player.chips >= player.currentRCBstack) {
                            player.lastRealChipBonus = player.currentRCBstack;
                        }
                    }

                    if (this.utilsService.convertIntToDecimal(player.chips) > 0 && player.state === stateOfX.playerState.outOfMoney) {
                        player.state = stateOfX.playerState.waiting;
                    }

                    player.playerScore = 0;
                    await this.calculatePlayerScore(player);

                    if (player.state === stateOfX.playerState.disconnected) {
                        player.state = stateOfX.playerState.onBreak;
                    }

                    if (params.table.isCTEnabledTable) {
                        player.callTimeGameMissed = !player.playerCallTimer.status && player.playerCallTimer.isCallTimeOver
                            ? player.callTimeGameMissed + 1
                            : player.callTimeGameMissed;

                        if (player.playerCallTimer.status) {
                            player.callTimeGameMissed = 0;
                        }

                        if (player.playerCallTimer.isCallTimeOver &&
                            player.callTimeGameMissed === params.table.ctEnabledBufferHand + 1 &&
                            player.playerScore > 0) {
                            player.state = stateOfX.playerState.onBreak;
                            player.active = false;
                        }
                    }

                    player.isPlayed = false;
                    player.active = true;
                    player.isCurrentRoundPlayer = false;
                    player.lastMove = null;
                    player.lastBet = 0;
                    player.chipsToBeAdded = 0;
                    player.cards = [];
                    player.moves = [];
                    player.lastRoundPlayed = "";
                    player.preCheck = -1;
                    player.bestHands = "";
                    player.totalRoundBet = 0;
                    player.totalGameBet = 0;
                    player.preActiveIndex = -1;
                    player.nextActiveIndex = -1;
                    player.isActionBySystem = false;
                    player.tournamentData.rebuyChips = 0;

                    if (chipsAddedActually > 0) {
                        try {
                            const refNumber = await this.imdb.findRefrenceNumber({
                                playerId: player.playerId,
                                channelId: params.channelId
                            });

                            params.referenceNumber = !refNumber.length ? 'aa' : refNumber[0].referenceNumber;

                            const dataForWallet = {
                                action: 'topUp',
                                data: {
                                    transactionType: "Top Up",
                                    points: player.points,
                                    playerId: player.playerId,
                                    isRealMoney: params.table.isRealMoney,
                                    chips: this.utilsService.convertIntToDecimal(chipsAddedActually),
                                    channelId: params.channelId,
                                    tableName: params.table.channelName,
                                    referenceNumber: params.referenceNumber
                                }
                            };

                            const deductChipsResponse = await this.wallet.sendWalletBroadCast(dataForWallet);
                            if (deductChipsResponse.success) {
                                player.points = deductChipsResponse.points;
                                params.data.chipsBroadcast = params.data.chipsBroadcast || [];
                                params.data.chipsBroadcast.push(player.playerId);
                                player.lastRealChipBonus += deductChipsResponse.data.realChipBonusDetected;
                                player.lastRealChip += deductChipsResponse.data.detectChipsFromRC;

                                if (player.chips > 0 && player.lastRealChip <= 0) {
                                    player.currentRCBstack += deductChipsResponse.data.realChipBonusDetected;
                                } else if (player.chips > 0 && deductChipsResponse.data.realChipBonusDetected) {
                                    player.currentRCBstack += deductChipsResponse.data.realChipBonusDetected;
                                }

                                const result = await this.db.getChips({ playerId: player.playerId });
                                if (result && scoreQuery.amount > 0) {
                                    await this.imdb.addPlayerScore(scoreQuery);
                                }
                            } else {
                                throw new Error("Wallet broadcast failed");
                            }
                        } catch (error) {
                            player.chips = playerOldChips;
                            player.onSitBuyIn = player.chips;
                            if (this.utilsService.convertIntToDecimal(player.chips) <= 0) {
                                player.state = stateOfX.playerState.outOfMoney;
                            }
                            if (this.utilsService.convertIntToDecimal(player.chips) > 0 && player.state === stateOfX.playerState.outOfMoney) {
                                player.state = stateOfX.playerState.waiting;
                            }
                            params.data.addChipsFailed = params.data.addChipsFailed || [];
                            params.data.addChipsFailed.push(player.playerId);
                        }
                    }
                } catch (error) {
                    // Handle individual player errors
                    continue;
                }
            }

            if (params.table.players.filter(p => p.state === stateOfX.playerState.playing).length > 2 && playerAfter) {
                const newPlayerAfter = params.table.players.slice(playerAfter.length);
                const newPlayerBefore = params.table.players.slice(0, playerAfter.length);
                params.table.players = newPlayerAfter.concat(newPlayerBefore);
            }

            return params;
        } catch (error) {
            throw error;
        }
    };

    async allInPlayersCards(params: any): Promise<any> {
        const rabbit = {
            round: params.table.roundName,
            cards: params.table.deck
        };

        if (params.table.isRabbitTable) {
            params.table.rabbitData = rabbit;
        }

        params.table.allInPLayerCardsCards = [];
        const allInPlayers = _.where(params.table.players, { lastMove: 'ALLIN' });
        let activePlayer = _.where(params.table.players, { active: true });

        if (activePlayer.length === 1 && allInPlayers.length) {
            const player = activePlayer[0];
            params.table.allInPLayerCardsCards.push({
                playerId: player.playerId,
                cards: player.cards
            });
        }

        for (const player of allInPlayers) {
            params.table.allInPLayerCardsCards.push({
                playerId: player.playerId,
                cards: player.cards
            });
        }

        params.data.allInCards = params.table.allInPLayerCardsCards;
        return params;
    }

    /**
     * ALL new implementation of loyalty/loyality points is named as MegaPoints (its business name)<br>
     * TO AVOID CONFUSION
     * 
     * @method rewardMegaPoints
     */
    async rewardMegaPoints(params: any): Promise<any> {
        const shouldDeduct = await this.deductRake.shouldRakeDeduct(params);

        if (!shouldDeduct) {
            return params;
        }

        const result = await this.megaPointsManager.incMegaPoints({
            event: 'gameOver',
            subEvent: 'beforeDecideWinner',
            players: params.table.contributors
        });

        if (result) {
            params.data.megaPointsResult = result;
        }

        return params;
    }

    // update flop players percent - 
    // a statistical feature shown on lobby for each table
    // - represents how many players have played rounds later than FLOP (including flop) on this table
    async updateFlopPlayers(params: any): Promise<any> {
        if (!params.data.isSingleWinner && params.table.roundName === stateOfX.round.preflop) {
            const result = await this.db.findTableById(params.channelId);
            if (!result) {
                return {
                    success: false,
                    channelId: params.channelId,
                    info: "Something went wrong!! unable to update",
                    isRetry: false,
                    isDisplay: false
                };
            }

            const totalFlopPlayer = result.totalFlopPlayer + _.where(params.table.players, { state: stateOfX.playerState.playing }).length;
            const totalPlayer = result.totalPlayer + params.table.onStartPlayers.length;
            const flopPercent = (totalFlopPlayer / totalPlayer) * 100;
            params.data.flopPercent = flopPercent;

            await this.db.updateFlopPlayerTable(params.channelId, totalFlopPlayer, totalPlayer, flopPercent);
        }
        return params;
    }

    // ### Decide winner using algos for different variations
    async decideTableWinner(params: any): Promise<any> {
        if (!params.data.isSingleWinner) {
            const decideWinnerResponse = await this.decideWinner.processWinnerDecision(params);
            if (decideWinnerResponse.success) {
                return decideWinnerResponse.params;
            } else {
                throw decideWinnerResponse;
            }
        }
        return params;
    }

    // Set decision params only if single winner case

    setDecisionParamsSingleWinner(params: any): any {
        if (params.data.isSingleWinner) {
            for (const pot of params.data.pot) {
                params.data.winners[pot.potIndex].amount = pot.amount;
                params.data.winners[pot.potIndex].winningAmount = pot.amount;
                params.data.winners[pot.potIndex].isRefund = pot.isRefund;

                params.data.decisionParams.push({
                    boardCards: params.table.boardCard[pot.borardSet],
                    playerCards: [],
                    winners: [{
                        playerId: params.data.winnerPlayerId,
                        typeName: stateOfX.dealerChatReason[stateOfX.endingType.everybodyPacked],
                        amount: pot.amount,
                        potIndex: pot.potIndex,
                        winningAmount: pot.amount,
                        isRefund: pot.isRefund
                    }],
                    contributors: pot.contributors,
                    amount: pot.amount,
                    isRefund: pot.isRefund,
                    winningAmount: 0,
                    internalPotSplitIndex: pot.potIndex.toString()
                });
            }
        }
        return params;
    }

    // Decide rake in case of single winner on table (Due to fold or leave by all other players except one)
    async deductRakeSingleWinnerCase(params: any): Promise<any> {
        if (params.data.isSingleWinner) {
            const deductRakeOnTableResponse = await this.deductRake.deductRakeOnTableSingleWinner(params);

            if (deductRakeOnTableResponse.success) {
                if (params.data.winners.length > 0 && Object.keys(params.rakeDetails.playerWins).length > 0) {
                    params.data.winners[0].amount = params.rakeDetails.playerWins[params.data.winners[0].playerId];
                    params.data.winners[0].winningAmount = deductRakeOnTableResponse.params.winners[0].winningAmount;
                }
                return deductRakeOnTableResponse.params;
            } else {
                throw deductRakeOnTableResponse;
            }
        }
        return params;
    }

    // distribute rake to refer-parents of players
    // sub-affiliates, affiliates and/or admin
    async awardRakeToAffiliates(params: any): Promise<any> {
        if (params.rakeDetails.rakeDeducted) {
            const updatedParams = await this.rewardRake.processRakeDistribution(params);
            updatedParams.data.loyalityList = updatedParams.loyalityList;
            return updatedParams;
        }
        return params;
    }

    // ### start processing EV Chop if it exists on table
    async startEVProcessNew(params: any): Promise<any> {
        const channel = pomelo.app.get('channelService').getChannel(params.channelId, true);

        let tableValue;
        if (params.table.channelVariation.includes('Omaha')) {
            tableValue = PokerOddsCalc.Omaha;
        } else {
            tableValue = PokerOddsCalc.TexasHoldem;
        }

        const types = {
            club: 'c',
            spade: 's',
            heart: 'h',
            diamond: 'd',
        };

        const table = new tableValue();
        let array: string[] = [];
        for (let card of params.table.boardCard[0]) {
            if (card.name === '10') card.name = 'T';
            array.push(card.name + types[card.type]);
        }
        table.setBoard(array);

        const players = params.table.allInPLayerCardsCards;
        const finalArray: any[] = [];

        for (let i = 0; i < players.length; i++) {
            array = [];
            let potAmount = 0;
            let rakeAmount = 0;
            let refundAmount = 0;
            let allContributors: string[] = [];
            let selfAmount = 0;

            for (let card of players[i].cards) {
                if (card.name === '10') card.name = 'T';
                array.push(card.name + types[card.type]);
            }

            for (let pot of params.table.pot) {
                if (pot.contributors.length > 1 && pot.contributors.includes(players[i].playerId)) {
                    potAmount += pot.amount;
                    selfAmount += this.utilsService.convertIntToDecimal(pot.amount / pot.contributors.length);
                    allContributors = pot.contributors;
                } else if (pot.contributors.length === 1 && pot.contributors.includes(players[i].playerId)) {
                    refundAmount += pot.amount;
                }
            }

            const uniqueContributors = [...new Set(allContributors)];

            finalArray.push({
                playerId: players[i].playerId,
                potAmount,
                rakeAmount,
                refundAmount,
                contributors: uniqueContributors.length,
                selfAmount
            });

            table.addPlayer(array);
        }

        const Result = table.calculate();
        const finalPlayers = Result.getPlayers();
        let highestPlayer = null;
        let totalWin = 0;

        for (let i = 0; i < finalPlayers.length; i++) {
            finalArray[i].tie = Math.round(finalPlayers[i].getTiesPercentage() * 1e2) / 1e2;
            finalArray[i].equitywithoutTie = Math.round(finalPlayers[i].getWinsPercentage() * 1e2) / 1e2;
            const sameTieCount = finalPlayers.filter(player => Math.round(player.getTiesPercentage() * 1e2) / 1e2 === finalArray[i].tie).length;
            finalArray[i].equity = Math.round((finalArray[i].equitywithoutTie + (finalArray[i].tie / sameTieCount)) * 1e2) / 1e2;
            finalArray[i].equityFees = Math.round(finalArray[i].potAmount * (params.table.evEquityFee / 100) * 1e2) / 1e2;
            finalArray[i].evAmount = this.utilsService.convertIntToDecimal((finalArray[i].potAmount - finalArray[i].rakeAmount - finalArray[i].equityFees) * finalArray[i].equity / 100);
            totalWin += finalArray[i].equity;

            if (!highestPlayer || finalArray[i].equity > highestPlayer.equity) {
                highestPlayer = finalArray[i];
            }
        }

        highestPlayer.equity += (100 - totalWin);
        highestPlayer.equity = Math.round(highestPlayer.equity * 1e2) / 1e2;

        await new Promise<void>((resolve, reject) => {
            pomelo.app.rpc.room.roomRemote.evChop(pomelo, { evChop: finalArray, channelId: params.channelId, tablePlayers: params.table.players }, async (evRes: any) => {
                for (let i = 0; i < finalArray.length; i++) {
                    if (finalArray[i].equity === 0) {
                        finalArray.splice(i, 1);
                        i--;
                    }
                }

                if (finalArray.length > 1) {
                    params.data.evChopDetails = finalArray;
                    await this.imdb.EvChopDetails(params.channelId, { evChopDetails: finalArray });

                    channel.evChopTimer = setTimeout(async () => {
                        const table = await this.imdb.getTable(params.channelId);

                        for (let player of params.data.evChopDetails) {
                            const foundIndex = table.players.findIndex((x: any) => x.playerId === player.playerId);
                            player.evChop = !!table.players[foundIndex].evChop;
                            player.userName = table.players[foundIndex].playerName;
                            player.cards = table.players[foundIndex].cards;
                        }

                        await this.imdb.EvChopDetails(params.channelId, { evChopDetails: params.data.evChopDetails });
                        resolve();
                    }, params.table.evPopupTime * 1000);
                } else {
                    resolve();
                }
            });
        });

        return params;
    }

    // ### start processing RIT if it exists on table
    async startRITProcess(params: any): Promise<any> {

        const channel = pomelo.app.get('channelService').getChannel(params.channelId, false);

        if (channel?.evChopTimer) {
            clearTimeout(channel.evChopTimer);
            channel.evChopTimer = null;
        }

        if (channel?.evRITTimer) {
            clearTimeout(channel.evRITTimer);
            channel.evRITTimer = null;
        }

        console.log("find channel in processGameOver ritprocess after clearing is", channel);

        const moveData = this.moveDataMap.get(params.channelId);
        moveData.data.evChopDetails = params.data.evChopDetails;

        const calledAfterRIT = !!params.calledFromChannelHandler;
        params = moveData;
        params.calledAfterRIT = calledAfterRIT;

        console.log("params in startRitzprocvess", params);
        console.log("inside startRITProcess checking fields", params.data.evChopDetails, params.table.isRunItTwiceTable, params.table.players.length);

        if (params.data.evChopDetails && params.table.isRunItTwiceTable) {
            const finalResponse = await this.afterProcess(params);
            return finalResponse;
        }

        if (params.data.evChopDetails && !params.table.isRunItTwiceTable && params.data.evChopDetails.length === 2) {

            const allEvChopFalse = params.data.evChopDetails.every(player => player.evChop === false);

            if (allEvChopFalse) {
                params.data.evChopDetails.sort((a, b) => b.equity - a.equity);
                let [maxEquityPlayer, otherPlayer] = params.data.evChopDetails;


                const restPlayers = params.table.players
                    .filter(player => player.playerId !== maxEquityPlayer.playerId)
                    .map(player => ({ playerId: player.playerId, cards: player.cards }));

                let outCards: any[] = [];
                let outCount = 0;
                maxEquityPlayer.outCount = 0;

                if (params.calledAfterRIT) {
                    [maxEquityPlayer, otherPlayer] = [otherPlayer, maxEquityPlayer];
                    console.log("maximum equity player after reversing is", maxEquityPlayer, otherPlayer);
                    console.log("params.data for outs script is", params.data);

                    restPlayers.length = 0;
                    restPlayers.push(otherPlayer);

                    if (params.data.roundName !== 'PREFLOP') {
                        console.log("params.table.deck is", params.table.deck);
                        const outsData = await this.outsScript.getOuts(
                            params.data.evChopDetails,
                            params.table.boardCard[0],
                            params.table.channelVariation,
                            params.table.deck
                        );
                        console.log("final outs data is", outsData);

                        const outsIndex = outsData.findIndex(e => e.playerId === maxEquityPlayer.playerId);
                        outCards = outsData[outsIndex].outs;
                        outCount = outsData[outsIndex].outCount;
                        maxEquityPlayer.outCount = outCount;
                    }
                }

                const ritData = {
                    channelId: params.channelId,
                    playerId: maxEquityPlayer.playerId,
                    otherPlayerId: otherPlayer.playerId,
                    boardCards: params.table.boardCard[0],
                    players: [
                        {
                            userName: maxEquityPlayer.userName,
                            evPercent: maxEquityPlayer.equity,
                            cards: maxEquityPlayer.cards,
                            outCount: maxEquityPlayer.outCount
                        },
                        {
                            opponentUserName: otherPlayer.userName,
                            evPercent: otherPlayer.equity,
                            cards: otherPlayer.cards,
                            outCount: 0
                        }
                    ],
                    potAmount: maxEquityPlayer.potAmount,
                    outs: {
                        count: outCount,
                        cards: outCards
                    },
                    timer: params.table.ritPopupTime,
                    restPlayers
                };

                console.log("ritPopupData is", ritData);

                await new Promise<void>((resolveRpc) => {
                    pomelo.app.rpc.room.roomRemote.evRIT(pomelo, ritData, async () => {
                        console.log("finally sent RIT broadcast");

                        await this.imdb.EvChopDetails(params.channelId, { ritDetails: ritData });

                        channel.evRITTimer = setTimeout(async () => {
                            const table = await this.imdb.getTable(params.channelId);

                            console.log("imdb players in startRITProcess", table.players);
                            console.log("table players in startRITProcess", params.table.players);

                            for (const player of params.data.evChopDetails) {
                                const foundIndex = table.players.findIndex(x => x.playerId === player.playerId);
                                const evRITValue = !!table.players[foundIndex].evRIT;
                                player.evRIT = evRITValue;
                            }

                            console.log("params.data.evChopDetails after editing is", params.data.evChopDetails);

                            const finalResponse = await this.afterProcess(params);
                            console.log("final Response is", finalResponse);
                            resolveRpc(finalResponse);
                        }, (params.table.ritPopupTime + 1) * 1000);

                        (channel.evRITTimer as any).startedAt = Number(new Date());
                    });
                });

                return; // return after RIT timer handles resolution
            }

            const finalResponse = await this.afterProcess(params);
            console.log("final Response is", finalResponse);
            return finalResponse;
        }

        const finalResponse = await this.afterProcess(params);
        console.log("final Response is", finalResponse);
        return finalResponse;
    };

    // ### Add winning chips into player's chips on table
    async awardWinningChips(params: any): Promise<any> {
        if (params.data.evChopDetails) {
            let rakeAmount;
            for (let data of params.data.evChopDetails) {
                rakeAmount = 0;
                for (let decision of params.data.decisionParams) {
                    if ((decision.contributors.length > 1) && decision.contributors.includes(data.playerId) && decision.rake) {
                        rakeAmount += decision.rake;
                    }
                }
                data.rakeAmount = Math.round(rakeAmount * 1e2) / 1e2;
                data.evAmount = this.utilsService.convertIntToDecimal(data.evAmount - rakeAmount * (data.equity / 100));
            }
        }

        const isGameProgressResponse = await this.isGameProgress(params);
        if (!isGameProgressResponse.success) {
            return isGameProgressResponse;
        }

        const awardWinningChipsResponse = await this.winnerRemote.awardWinningChips(params);
        console.log("evChopDetails me winner change karo", params.data.evChopDetails);
        console.log("is me se nikal ke", params.data.winners);

        if (params.data.evChopDetails) {
            for (let player of params.data.evChopDetails) {
                if (player.evChop) {
                    const indexes = params.data.winners.reduce((acc: number[], curr: any, index: number) => {
                        if (curr.playerId === player.playerId) {
                            acc.push(index);
                        }
                        return acc;
                    }, []);


                    if (indexes.length) {
                        for (let index of indexes) {
                            console.log("picking first index", index);
                            const percentage = player.evAmount / player.potAmount;
                            if (params.data.winners[index].isRefund && player.refundAmount) {
                                params.data.winners[index].winningAmount = this.utilsService.convertIntToDecimal(
                                    params.data.winners[index].amount * percentage + player.refundAmount
                                );
                            } else {
                                params.data.winners[index].winningAmount = this.utilsService.convertIntToDecimal(
                                    params.data.winners[index].amount * percentage
                                );
                            }
                        }
                    }

                    const foundIndex = params.table.players.findIndex(x => x.playerId == player.playerId);
                    const playerName = params.table.players[foundIndex].playerName;

                    const query = {
                        handId: params.table.roundNumber,
                        userName: playerName,
                    };

                    const data = {
                        tableName: params.table.channelName,
                        handId: params.table.roundNumber,
                        userName: playerName,
                        playerId: player.playerId,
                        createdAt: Number(new Date()),
                        potAmount: player.potAmount,
                        profit: player.profit,
                        selfAmount: player.selfAmount,
                        contributors: player.contributors,
                        selfProfit: player.selfProfit,
                    };

                    const response = await this.db.evHistory(query, data);
                }
            }

        }

        return awardWinningChipsResponse;
    }

    // ### Reward winning amount to players chips
    async createWinningResponse(params: any): Promise<any> {
        const isGameProgressResponse = await this.isGameProgress(params);
        if (isGameProgressResponse.success) {
            const winnerResponse = await this.winnerRemote.createWinnersForResponse(params);
            return winnerResponse;
        } else {
            return isGameProgressResponse;
        }
    }

    // ### Adjust active player indexes among each other
    // > Set preActiveIndex and nextActiveIndex values for each player
    // > Used for turn transfer importantly
    async adjustActiveIndexes(params: any): Promise<any> {
        const performResponse = await this.adjustIndex.perform(params);
        return performResponse.params;
    }

    // ### Assign player cards based on conditions (muckhand feature)
    // > Get player's muck hand details for this table from cache database
    // > If this is a single winner case without card comparison then check muckhand for winner player
    // > If there is a winner with card comparision then show cards of all players (except FOLDed ones)

    async assignPlayercards(params: any): Promise<any> {
        const playingPlayers = this.tableManager.activePlayersForWinner(params);

        if (params.data.isSingleWinner) {
            const playerIndexOnTable = _ld.findIndex(params.table.players, { playerId: params.data.winners[0].playerId });

            if (playerIndexOnTable >= 0) {
                const player = params.table.players[playerIndexOnTable];
                const result = await this.imdb.findTableSetting({ playerId: player.playerId, channelId: params.channelId });

                const isMuckHand = !!result?.settings?.isMuckHand;
                player.isMuckHand = isMuckHand;

                if (!isMuckHand) {
                    const moveData = {
                        cards: player.cards,
                        lastMove: player.lastMove,
                        playerId: player.playerId,
                        name: player.playerName
                    };
                    params.data.cardsToShow[player.playerId] = moveData;
                }

                return params;
            } else {
                return params; // Winner not on table, skip
            }
        }

        if (!params.data.isSingleWinner) {
            for (const player of playingPlayers) {
                if (player.lastMove !== stateOfX.move.fold) {
                    const moveData = {
                        cards: player.cards,
                        lastMove: player.lastMove,
                        playerId: player.playerId,
                        name: player.playerName
                    };
                    params.data.cardsToShow[player.playerId] = moveData;
                }
            }
            return params;
        }

        return params;
    }

    // ### Generate game over response
    async createGameOverResponse(params: any): Promise<any> {
        params.data.success = true;

        const responseStr = {
            success: true,
            winners: params.data.winners,
            rakeDetails: params.rakeDetails,
            boardCard: params.data.boardCard,
            endingType: params.data.endingType,
            rakeDeducted: params.data.rakeDeducted,
            cardsToShow: params.data.cardsToShow,
            chipsBroadcast: params.data.chipsBroadcast,
            addChipsFailed: params.data.addChipsFailed,
            params: params
        };

        return responseStr;
    }



    async afterProcess(params) {
        const channel = pomelo.app.get('channelService').getChannel(params.channelId, false);

        if (!!channel?.evRITTimer) {
            clearTimeout(channel.evRITTimer);
            channel.evRITTimer = null;
        }
        if (!!channel?.evChopTimer) {
            clearTimeout(channel.evChopTimer);
            channel.evChopTimer = null;
        }

        const moveData = this.moveDataMap.get(params.channelId);
        moveData.data.evChopDetails = params.data.evChopDetails;
        moveData.table = params.table;
        params = moveData;

        const table = await this.imdb.getTable(params.channelId);
        if (table && !params.doNotCallActionHandler) {
            params.table = table;
        }

        try {
            const response = await this.assignPotIndexAndBoard(params)
                .then(this.dividePotAndAssignBoardSet)
                .then(this.updateFlopPlayers)
                .then(this.decideTableWinner)
                .then(this.rewardMegaPoints)
                .then(this.assignPlayercards)
                .then(this.setDecisionParamsSingleWinner)
                .then(this.deductRakeSingleWinnerCase)
                .then(this.awardRakeToAffiliates)
                .then(this.awardWinningChips)
                .then(this.createWinningResponse)
                .then(this.createBasicHandTab)
                .then(this.updateEveryPlayerStats)
                .then(this.summaryOnGameOver)
                .then(this.updateBlindRule)
                .then(this.autoRebuy)
                .then(this.autoAddonProcess)
                .then(this.resetPlayersOnGameOver)
                .then(this.deductAutoBuyIn)
                .then(this.resetTableOnGameOver)
                // .ththis.en(manageRanks)
                .then(this.distributeBounty)
                .then(this.updateTimeBank)
                .then(this.setStatePlaying)
                .then(this.adjustActiveIndexes)
                .then(this.createGameOverResponse);

            this.activity.winner(params, stateOfX.profile.category.game, stateOfX.game.subCategory.info, response, stateOfX.logType.success);
            this.activity.winner(params, stateOfX.profile.category.game, stateOfX.game.subCategory.winner, response, stateOfX.logType.success);

            if (response?.params?.data) {
                const requestMade = {
                    playerId: response.params.data.playerId,
                    channelId: response.params.data.channelId,
                    amount: response.params.data.amount,
                    action: response.params.data.action,
                    runBy: 'none',
                    isRequested: false,
                    channelType: response.params.data.channelType,
                    __route__: 'room.channelHandler.makeMove'
                };

                const tableValue = _.omit(response.params.table, '_id');
                await this.imdb.updateTableData(params.channelId, tableValue);

                response.params.data.success = true;
                response.params.data.roundOver = true;
                response.params.data.isGameOver = true;
                response.params.data.currentBoardCard = response.params.data.remainingBoardCards;
                response.params.data.winners = response.winners;
                response.params.data.rakeDeducted = response.rakeDeducted;
                response.params.data.cardsToShow = response.cardsToShow;

                if (!params.doNotCallActionHandler) {
                    const setActionKeysResponse = await this.responseHandler.setActionKeys(response.params);
                    await pomelo.app.rpc.room.roomRemote.handle(pomelo, {
                        session: {},
                        channelId: setActionKeysResponse.data.response.channelId,
                        response: setActionKeysResponse.data.response,
                        request: requestMade,
                        alreadySentTurn: true
                    });
                }
            }

            return response;
        } catch (err) {
            this.activity.gameOver(params, stateOfX.profile.category.gamePlay, stateOfX.gamePlay.subCategory.gameOver, err, stateOfX.logType.error);
            return err;
        }
    };


    /**
     * process game over after no player has moves,
     * check pots and pot split, update stats
     * find winners, reward pot distibutions
     * deduct rake
     * add to summary object
     * update hand tab and other tasks
     * @method processGameOver
     */
    async processGameOver(params): Promise<any> {

        let validated = await validateKeySets("Request", "database", "processGameOver", params);


        if (!validated.success) {
            this.activity.gameOver(params, stateOfX.profile.category.gamePlay, stateOfX.gamePlay.subCategory.gameOver, validated, stateOfX.logType.error);
            return validated;
        }

        const response = await this.initializeParams(params)
            .then(this.allInPlayersCards)
            .then(this.validatePotAmount)
            .then(this.updateAvgPot)
            .then(this.isSingleWinner)
            .then(this.createGameOverResponse);

        this.moveDataMap.set(response.params.channelId, response.params);

        if (
            !!params.table.isEvChopTable &&
            params.data.roundName !== stateOfX.round.river &&
            params.data.roundName !== stateOfX.round.showdown &&
            params.table.allInPLayerCardsCards.length >= 2
        ) {
            let finalConsiderPot = 0;
            for (let pot of params.table.pot) {
                if (pot.contributors.length > 1) {
                    finalConsiderPot += pot.amount;
                }
            }

            if (finalConsiderPot >= 10 * params.table.bigBlind) {
                response.params.shouldCallActionHandler = true;
                const nextParams = JSON.parse(JSON.stringify(response.params));

                if (response.params.data.isCurrentPlayer) {
                    const refundPot = _.filter(response.params.table.pot, (item) => item.contributors.length == 1);
                    const turnData = {
                        success: true,
                        channelId: response.params.channelId,
                        isPotLimit: response.params.table.isPotLimit,
                        runBy: response.params.data.runBy || "none",
                        playerId: response.params.data.playerId,
                        playerName: response.params.data.playerName,
                        amount: response.params.data.amount,
                        action:
                            response.params.table.channelType === stateOfX.gameType.tournament &&
                                (response.params.data.action === stateOfX.move.standup ||
                                    response.params.data.action === stateOfX.move.leave)
                                ? stateOfX.move.fold
                                : response.params.data.action,
                        chips: response.params.data.chips,
                        isRoundOver: true,
                        isGameOver: true,
                        roundName: stateOfX.round.showdown,
                        pot: _.pluck(_.filter(response.params.table.pot, (item) => item.contributors.length > 1), "amount"),
                        currentMoveIndex: "",
                        moves: [],
                        totalRoundBet: 0,
                        lastPlayerBet:
                            response.params.data.action === stateOfX.move.standup ||
                                response.params.data.action === stateOfX.move.leave
                                ? 0
                                : response.params.data.considerAmount,
                        roundMaxBet: response.params.table.roundMaxBet,
                        minRaiseAmount: response.params.table.minRaiseAmount,
                        maxRaiseAmount: response.params.table.maxRaiseAmount,
                        totalPot: this.tableManager.getTotalPot(
                            _.filter(response.params.table.pot, (item) => item.contributors.length > 1)
                        ),
                        refundPot: refundPot.length ? { playerId: refundPot[0].contributors[0], amount: refundPot[0].amount } : null
                    };

                    await this.imdb.EvChopDetails(response.params.channelId, { turnEvData: turnData });
                    await pomelo.app.rpc.room.roomRemote.turn(pomelo, turnData);
                }

                const roundOverData = {
                    success: true,
                    channelId: response.params.channelId,
                    roundName: stateOfX.round.showdown,
                    isEv: true
                };

                await pomelo.app.rpc.room.roomRemote.roundOver(pomelo, roundOverData);

                const fireAllInCards = {
                    channelId: nextParams.channelId,
                    allInCards: nextParams.data.allInCards
                };

                await pomelo.app.rpc.room.roomRemote.fireAllInCards(pomelo, fireAllInCards);

                const res1 = await this.startEVProcessNew(nextParams);
                const res2 = await this.startRITProcess(res1);
                return res2;
            } else {
                response.params.doNotCallActionHandler = true;
                const res = await this.afterProcess(response.params);
                return res;
            }
        } else {
            response.params.doNotCallActionHandler = true;
            const res = await this.afterProcess(response.params);
            return res;
        }
    };







}