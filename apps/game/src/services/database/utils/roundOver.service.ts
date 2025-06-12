import { Injectable } from "@nestjs/common";
import _ld from "lodash";
import { PokerDatabaseService } from "shared/common/datebase/pokerdatabase.service";
import _ from "underscore";
import { HandleGameOverService } from "../handleGameOver.service";
import { PostsplitService } from "../potsplit.service";
import { TableManagerService } from "../tableManager.service";
import { ResponseHandlerService } from "../responseHandler.service";
import stateOfX from "shared/common/stateOfX.sevice";
import { validateKeySets } from "shared/common/utils/activity";



@Injectable()
export class RoundOverService {

    constructor(
        private readonly db: PokerDatabaseService,
        private readonly handleGameOver: HandleGameOverService,
        private readonly potsplit: PostsplitService,
        private readonly tableManager: TableManagerService,
        private readonly responseHandler: ResponseHandlerService
    ) { }




    // check if round is over
    // acc to player turn and round contribution
    async checkRoundOver(params: any): Promise<any> {
        let roundIsOver = true;
        const { players, onStartPlayers, roundMaxBet, isCTEnabledTable, ctEnabledBufferHand } = params.table;
        const { playerState, move } = stateOfX;

        for (const player of players) {
            if (!onStartPlayers.includes(player.playerId)) {
                continue;
            }

            const ctCondition =
                player.state === playerState.playing ||
                player.state === playerState.disconnected ||
                (
                    player.state === playerState.onBreak &&
                    isCTEnabledTable &&
                    player.playerScore > 0 &&
                    (
                        (!player.playerCallTimer.status && player.callTimeGameMissed <= ctEnabledBufferHand) ||
                        (player.playerCallTimer.status && !player.playerCallTimer.isCallTimeOver)
                    )
                );

            if (!ctCondition) {
                continue;
            }

            if (player.active) {
                if (!player.isPlayed) {
                    roundIsOver = false;
                    break;
                }
                if (roundMaxBet !== player.totalRoundBet && player.lastMove !== move.allin) {
                    roundIsOver = false;
                    break;
                }
            }
        }

        return { success: true, roundIsOver };
    }

    // ### Validate Game state to be RUNNING throughout performing move calculation
    async isGameProgress(params: any): Promise<any> {
        const validated = await validateKeySets("Request", "database", "isGameProgress", params);
        if (!validated.success) {
            return validated;
        }

        if (params.table.state === stateOfX.gameState.running) {
            return { success: true, isGameOver: false };
        }

        const gameOverResponse = await this.handleGameOver.processGameOver(params);
        if (!gameOverResponse.success) {
            return gameOverResponse;
        }

        Object.assign(params, gameOverResponse.params);
        Object.assign(params.data, {
            success: true,
            roundOver: true,
            isGameOver: true,
            currentBoardCard: params.data.remainingBoardCards,
            winners: gameOverResponse.winners,
            rakeDeducted: gameOverResponse.rakeDeducted,
            cardsToShow: gameOverResponse.cardsToShow
        });

        const setActionKeysResponse = await this.responseHandler.setActionKeys(params);
        return setActionKeysResponse;
    }

    // ### Reset table values on round end

    async resetTable(params: any): Promise<any> {
        const validated = await validateKeySets("Request", "database", "resetTable", params);
        if (!validated.success) {
            return validated;
        }

        const isGameProgressResponse = await this.isGameProgress(params);
        if (!isGameProgressResponse.success || isGameProgressResponse.isGameOver) {
            return isGameProgressResponse;
        }

        const processSplitResponse = await this.potsplit.processSplit(params);
        if (!processSplitResponse.success) {
            return processSplitResponse;
        }

        params = processSplitResponse.params;

        params.table.roundName = stateOfX.nextRoundOf[params.table.roundName];
        if (params.table.roundName === stateOfX.round.showdown) {
            params.table.state = stateOfX.gameState.gameOver;
        }
        params.data.roundName = params.table.roundName;

        params.table.isBettingRoundLocked = false;

        if (params.data.sidePots && params.data.sidePots.length > 0) {
            params.table.pot = params.data.sidePots;
        }

        params.table.roundContributors = [];
        params.table.roundBets = [];
        params.table.roundMaxBet = 0;
        params.table.raiseBy = '';
        params.table.minRaiseAmount = params.table.bigBlind;
        params.table.lastBetOnTable = 0;
        params.table.raiseDifference = params.table.bigBlind;
        params.table.lastRaiseAmount = 0;
        params.table.considerRaiseToMax = 0;
        params.table.preChecks = [];

        for (let i = 0; i < params.table.players.length; i++) {
            const player = params.table.players[i];
            params.table.roundBets[i] = 0;

            if (player.state === stateOfX.playerState.playing && !player.active) {
                player.isPlayed = true;
            }
        }

        return params;
    }


    // Update flop players percent when flop round starts
    async updateFlopPlayers(params: any): Promise<any> {
        if (params.table.roundName === stateOfX.round.flop) {
            const result = await this.db.findTableById(params.channelId);
            if (!result) {
                return {
                    success: false,
                    channelId: params.channelId,
                    info: "Something went wrong!! unable to update",
                    isRetry: false,
                    isDisplay: false,
                };
            }

            const totalFlopPlayer =
                result.totalFlopPlayer +
                params.table.players.filter(
                    (p: any) => p.state === stateOfX.playerState.playing
                ).length;

            const totalPlayer = result.totalPlayer + params.table.onStartPlayers.length;
            const flopPercent = (totalFlopPlayer / totalPlayer) * 100;
            params.data.flopPercent = flopPercent;

            const updateResult = await this.db.updateFlopPlayerTable(
                params.channelId,
                totalFlopPlayer,
                totalPlayer,
                flopPercent
            );

            if (!updateResult) {
                return {
                    success: false,
                    channelId: params.channelId,
                    info: "Something went wrong!! unable to update",
                    isRetry: false,
                    isDisplay: false,
                };
            }

            return params;
        } else {
            return params;
        }
    };


    // ### Reset player values on round end
    async resetPlayer(params: any): Promise<any> {
        const validated = await validateKeySets("Request", "database", "resetPlayer", params);
        if (!validated.success) {
            return validated;
        }

        const isGameProgressResponse = await this.isGameProgress(params);
        if (!isGameProgressResponse.success || isGameProgressResponse.isGameOver) {
            return isGameProgressResponse;
        }

        try {
            for (const player of params.table.players) {
                if (params.table.onStartPlayers.includes(player.playerId)) {
                    player.isPlayed = false;
                    player.totalRoundBet = 0;

                    if (player.lastMove === stateOfX.move.allin) {
                        player.lastRoundPlayed = params.table.roundName;
                    }
                }

                if (player.state === stateOfX.playerState.disconnected && player.lastMove !== stateOfX.move.fold) {
                    player.lastRoundPlayed = params.table.roundName;
                }
            }

            return params;
        } catch (err) {
            return {
                success: false,
                info: "Reseting player on round over failed",
                isRetry: false,
                isDisplay: false,
                channelId: ""
            };
        }
    };


    // ### pop some card from deck on table
    async popCardFromDeck(params: any): Promise<any> {
        const validated = await validateKeySets("Request", "database", "popCardFromDeck", params);
        if (!validated.success) {
            return validated;
        }

        const cards = params.table.deck.slice(0, params.count);
        params.table.deck.splice(0, params.count);
        return { success: true, cards };
    }

    // ### Burn cards on table
    // > Consider run it twice case where another similar no of
    // > burn cards open at same time
    async burnCards(params: any): Promise<any> {
        const validated = await validateKeySets("Request", "database", "burnCards", params);
        if (!validated.success) return validated;

        const gameProgress = await this.isGameProgress(params);
        if (!(gameProgress.success && !gameProgress.isGameOver)) {
            return gameProgress;
        }

        const cardsToPop = params.table.roundName === stateOfX.round.flop ? 3 : 1;

        // Pop board cards based on current round
        const popResult = await this.popCardFromDeck({ serverType: "database", table: params.table, count: cardsToPop });
        if (!popResult.success) {
            return {
                success: false,
                channelId: params.channelId,
                info: `ERROR: popping card for round - ${params.table.roundName}`,
                isRetry: false,
                isDisplay: false,
            };
        }

        for (const card of popResult.cards) {
            params.table.boardCard[0].push(card);
        }

        // Handle Run It Twice logic
        if (params.table.isRunItTwiceApplied) {
            const popResultRIT = await this.popCardFromDeck({ serverType: "database", table: params.table, count: cardsToPop });

            if (!popResultRIT.success) {
                return {
                    success: false,
                    channelId: params.channelId,
                    info: `ERROR: popping card for round - ${params.table.roundName}`,
                    isRetry: false,
                    isDisplay: false,
                };
            }

            for (const card of popResultRIT.cards) {
                if (params.table.roundName === stateOfX.round.flop) {
                    params.table.boardCard[1].push(null);
                } else {
                    params.table.boardCard[1].push(card);
                }
            }
        } else {
            for (let i = 0; i < cardsToPop; i++) {
                params.table.boardCard[1].push(null);
            }
        }

        return params;
    }

    // ### Set current board card for broadcast
    async setCurrentBoardCard(params: any): Promise<any> {
        const isGameProgressResponse = await this.isGameProgress(params);

        if (isGameProgressResponse.success && !isGameProgressResponse.isGameOver) {
            switch (params.table.roundName) {
                case stateOfX.round.preflop:
                    params.data.currentBoardCard = [[], []];
                    break;
                case stateOfX.round.flop:
                    params.data.currentBoardCard = params.table.boardCard;
                    break;
                case stateOfX.round.turn:
                    params.data.currentBoardCard = [
                        [params.table.boardCard[0][3]],
                        [params.table.boardCard[1][3]],
                    ];
                    break;
                case stateOfX.round.river:
                    params.data.currentBoardCard = [
                        [params.table.boardCard[0][4]],
                        [params.table.boardCard[1][4]],
                    ];
                    break;
                case stateOfX.round.showdown:
                    // No card updates needed during showdown
                    break;
                default:
                    // No action for unknown round
                    break;
            }
            return params;
        } else {
            return isGameProgressResponse;
        }
    }

    // Set best hand for players after round over
    async setPlayersBestHand(params: any): Promise<any> {
        const getBestHandResponse = await this.tableManager.getBestHand(params);

        if (getBestHandResponse.success && getBestHandResponse.params) {
            return getBestHandResponse.params;
        } else {
            return getBestHandResponse;
        }
    }


    // process round over, update table and players, best hands
    async processRoundOver(params: any): Promise<any> {
        const isGameProgressResponse = await this.isGameProgress(params);
        if (!(isGameProgressResponse.success && !isGameProgressResponse.isGameOver)) {
            return isGameProgressResponse;
        }

        const roundOverResponse = await this.checkRoundOver(params);
        if (!roundOverResponse.success) {
            return roundOverResponse;
        }

        params.data.roundOver = roundOverResponse.roundIsOver;

        if (!params.data.roundOver) {
            return { success: true, params };
        }

        try {
            let response = await this.resetTable(params);
            response = await this.updateFlopPlayers(response);
            response = await this.resetPlayer(response);
            response = await this.burnCards(response);
            response = await this.setCurrentBoardCard(response);
            response = await this.setPlayersBestHand(response);

            return { success: true, params: response };
        } catch (err: any) {
            if (err?.data?.success) {
                return err;
            } else {
                return err;
            }
        }
    };






}