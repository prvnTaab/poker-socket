import { Injectable } from "@nestjs/common";
import _ld from "lodash";
import _ from "underscore";
import { SetMoveService } from "./setMove.service";
import { HandleGameOverService } from "./handleGameOver.service";
import { TableManagerService } from "./tableManager.service";
import { ResponseHandlerService } from "./responseHandler.service";
import { AdjustActiveIndexService } from "./adjustActiveIndex.service";
import { PostsplitService } from "./potsplit.service";
import { validateKeySets } from "shared/common/utils/activity";
import stateOfX from "shared/common/stateOfX.sevice";
import popupTextManager from "shared/common/popupTextManager";







// roundOver = require('./utils/roundOver')



@Injectable()
export class TournamentLeaveService {


    constructor(
        private readonly setMove: SetMoveService,
        private readonly potsplit: PostsplitService,
        private readonly adjustIndex: AdjustActiveIndexService,
        private readonly handleGameOver: HandleGameOverService,
        private readonly tableManager: TableManagerService,
        private readonly responseHandler: ResponseHandlerService,

    ) { }








async isGameProgress(params: any): Promise<any> {
    const validated = await validateKeySets("Request", params.serverType, "isGameProgress", params);
    
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

    params = gameOverResponse.params;
    params.data.success = true;
    params.data.roundOver = true;
    params.data.isGameOver = true;
    params.data.currentBoardCard = params.data.remainingBoardCards;
    params.data.winners = gameOverResponse.winners;
    params.data.rakeDeducted = gameOverResponse.rakeDeducted;
    params.data.cardsToShow = gameOverResponse.cardsToShow;

    const setActionKeysResponse = await this.responseHandler.setActionKeys(params);
    return setActionKeysResponse;
};


async validateGameOver(params: any): Promise<any> {
    const isGameProgressResponse = await this.isGameProgress(params);

    if (isGameProgressResponse.success && !isGameProgressResponse.isGameOver) {
        if (params.data.index >= 0) {
            const playerState = params.data.state;
            const inactiveStates = [
                stateOfX.playerState.waiting,
                stateOfX.playerState.outOfMoney,
                stateOfX.playerState.onBreak,
            ];

            if (!inactiveStates.includes(playerState)) {
                const hasPlayerWithMove = this.tableManager.isPlayerWithMove(params);
                if (!hasPlayerWithMove) {
                    params.table.state = stateOfX.gameState.gameOver;
                }
            }
        }
        return params;
    } else {
        return isGameProgressResponse;
    }
};


intializeParams(params: any): Promise<any> {
    params.data = _.omit(params.data, '__route__');
    params.data.action = params.data.isStandup
        ? stateOfX.move.standup.toUpperCase()
        : stateOfX.move.leave.toUpperCase();

    params.data.index = _ld.findIndex(params.table.players, { playerId: params.data.playerId });
    params.data.chips = 0;

    if (params.data.index >= 0) {
        params.data.state = params.table.players[params.data.index].state;
        params.data.chips = params.table.players[params.data.index].chips;
        params.data.nextActiveIndex = params.table.players[params.data.index].nextActiveIndex;
    }

    params.data.isCurrentPlayer = false;
    params.data.roundOver = false;
    params.data.isGameOver = (params.table.state === stateOfX.gameState.gameOver);
    params.data.amount = 0;
    params.data.pot = _.pluck(params.table.pot, 'amount');

    return params;
};


// Validate if this standup or leave is allowed for this player
// > Spectator player cannot opt to standup
async validateAction(params: any): Promise<any> {
    if (params.data.index < 0 && params.data.action === stateOfX.move.standup) {
        return {
            success: false,
            isRetry: false,
            isDisplay: false,
            channelId: params.channelId || "",
            info: popupTextManager.falseMessages.VALIDATEACTIONFAIL_TOURNAMENTLEAVE
        };
    } else {
        return params;
    }
};



updatePlayer(params: any): Promise<any> {
    if (params.data.index >= 0) {
        params.table.players[params.data.index].tournamentData.isTournamentSitout = true;
        params.table.players[params.data.index].lastMove = stateOfX.move.fold;
        params.table.players[params.data.index].active = false;
    }
    return params;
};


isCurrentPlayer(params: any): Promise<any> {
    if (params.data.index >= 0) {
        params.data.isCurrentPlayer = params.data.index === params.table.currentMoveIndex;
        if (params.data.isCurrentPlayer) {
            params.table.currentMoveIndex = params.table.players[params.data.index].nextActiveIndex;
        }
    }
    return params;
};


adjustActiveIndexes(params: any): Promise<any> {
    const performResponse = await this.adjustIndex.perform(params);
    return performResponse.params;
};


// ### Update current player and first active player indexes

async updateConfigIndexes(params: any): Promise<any> {
    const isGameProgressResponse = await this.isGameProgress(params);

    if (isGameProgressResponse.success && !isGameProgressResponse.isGameOver) {
        if (params.data.index >= 0) {
            if (
                params.table.dealerIndex > params.data.index &&
                params.data.index < params.table.firstActiveIndex
            ) {
                if (params.table.firstActiveIndex - 1 >= 0) {
                    params.table.firstActiveIndex = params.table.firstActiveIndex - 1;
                }
            } else if (params.data.index === params.table.firstActiveIndex) {
                params.table.firstActiveIndex = params.table.players[params.table.dealerIndex].nextActiveIndex;
            }
        }
        return params;
    } else {
        return isGameProgressResponse;
    }
};

async isRoundOver(params: any): Promise<any> {
    const isGameProgressResponse = await this.isGameProgress(params);

    if (isGameProgressResponse.success && !isGameProgressResponse.isGameOver) {
        const processRoundOverResponse = await this.roundOver.processRoundOver(params);

        if (processRoundOverResponse.success && !processRoundOverResponse.isGameOver) {
            return processRoundOverResponse.params;
        } else {
            return processRoundOverResponse;
        }
    } else {
        return isGameProgressResponse;
    }
};


async setNextPlayer(params: any): Promise<any> {
    const isGameProgressResponse = await this.isGameProgress(params);

    if (isGameProgressResponse.success && !isGameProgressResponse.isGameOver) {
        if (params.data.isCurrentPlayer) {
            if (params.data.roundOver) {
                // Round is over after this leave, setting first player index as next player with turn
                params.table.currentMoveIndex = params.table.firstActiveIndex;
                return params;
            } else {
                // Round doesn't end after this leave; next move index may already be set elsewhere
                return params;
            }
        } else {
            // Player was not the player with turn, so skipping turn transfer
            return params;
        }
    } else {
        return isGameProgressResponse;
    }
};


// ### Set maximum raise for next player
async setMaxRaise(params: any): Promise<any> {
    const isGameProgressResponse = await this.isGameProgress(params);

    if (isGameProgressResponse.success && !isGameProgressResponse.isGameOver) {
        params.table.maxRaiseAmount = await this.tableManager.maxRaise(params.table);
        return params;
    } else {
        return isGameProgressResponse;
    }
};


async getMoves(params: any): Promise<any> {
    const isGameProgressResponse = await this.isGameProgress(params);

    if (isGameProgressResponse.success && !isGameProgressResponse.isGameOver) {
        if (params.data.isCurrentPlayer) {
            const getMoveResponse = await this.setMove.getMove(params);
            if (getMoveResponse.success) {
                return getMoveResponse.params;
            } else {
                return getMoveResponse;
            }
        } else {
            return params;
        }
    } else {
        return isGameProgressResponse;
    }
};

async decidePlayerPrechecks(params: any): Promise<any> {
    const assignPrechecksResponse = await this.setMove.assignPrechecks(params);

    if (assignPrechecksResponse.success) {
        return assignPrechecksResponse.params;
    } else {
        return assignPrechecksResponse;
    }
};

async createResponse(params: any): Promise<any> {
    const setActionKeysResponse = await this.responseHandler.setActionKeys(params);
    return setActionKeysResponse;
};


async processLeave(params: any): Promise<any> {
    try {
        let updatedParams = await this.intializeParams(params);
        updatedParams = await this.validateAction(updatedParams);
        updatedParams = await this.updatePlayer(updatedParams);
        updatedParams = await this.isCurrentPlayer(updatedParams);
        updatedParams = await this.adjustActiveIndexes(updatedParams);
        updatedParams = await this.updateConfigIndexes(updatedParams);
        updatedParams = await this.validateGameOver(updatedParams);
        updatedParams = await this.isRoundOver(updatedParams);
        updatedParams = await this.setNextPlayer(updatedParams);
        updatedParams = await this.setMaxRaise(updatedParams);
        updatedParams = await this.getMoves(updatedParams);
        updatedParams = await this.adjustActiveIndexes(updatedParams);
        updatedParams = await this.decidePlayerPrechecks(updatedParams);
        const finalResponse = await this.createResponse(updatedParams);

        return {
            success: true,
            table: finalResponse.table,
            data: finalResponse.data
        };
    } catch (err: any) {
        if (!!err.data && err.data.success) {
            return {
                success: true,
                table: err.table,
                data: err.data
            };
        } else {
            throw err;
        }
    }
};







}