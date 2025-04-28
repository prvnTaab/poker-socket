import { Injectable } from "@nestjs/common";
import async from "async";
import _ld from "lodash";
import _ from 'underscore';
import setMove from './setMove';
import adjustIndex from './adjustActiveIndex';
import handleGameOver from './handleGameOver';
import { stateOfX, popupTextManager } from "shared/common";
import tableManager from "./tableManager";

@Injectable()
export class ResponseHandlerService {
    
    constructor(){

    }

  // to check game state through out the process
   async isGameProgress(params: any): Promise<any> {
    if (params.table.state === stateOfX.gameState.running) {
      return { success: true, isGameOver: false };
    } else {
      const gameOverResponse = await handleGameOver.processGameOver(params);
      
      if (gameOverResponse.success) {
        params = gameOverResponse.params;

        // Set response keys
        params.data.overResponse = params.data.overResponse || {};
        params.data.overResponse.isGameOver = true;
        params.data.overResponse.isRoundOver = true;

        // Resetting turn broadcast for Game Over
        for (let i = 0; i < params.data.overResponse.turns?.length; i++) {
          params.data.overResponse.turns[i].isRoundOver = true;
          params.data.overResponse.turns[i].roundName = stateOfX.round.showdown;
          params.data.overResponse.turns[i].currentMoveIndex = -1;
          params.data.overResponse.turns[i].pot = _.pluck(params.table.pot, 'amount');
        }

        params.data.overResponse.round = {
          success: true,
          channelId: params.data.channelId,
          roundName: stateOfX.round.showdown,
          boardCard: params.data.remainingBoardCards
        };

        params.data.overResponse.over = {
          success: true,
          channelId: params.data.channelId,
          endingType: stateOfX.endingType.gameComplete,
          cardsToShow: gameOverResponse.cardsToShow,
          winners: gameOverResponse.winners
        };

        return {
          success: true,
          isGameOver: true,
          isRoundOver: true,
          table: gameOverResponse.params.table,
          data: params.data,
          response: params.data.overResponse
        };
      } else {
        return gameOverResponse;
      }
    }
  }

  // Get moves for current player
   async getMoves(params: any): Promise<any> {
    const isGameProgressResponse = await this.isGameProgress(params);
    if (isGameProgressResponse.success && !isGameProgressResponse.isGameOver) {
      const getMoveResponse = await setMove.getMove(params);
      if (getMoveResponse.success) {
        return getMoveResponse.params;
      } else {
        throw getMoveResponse;
      }
    } else {
      throw isGameProgressResponse;
    }
  }

  // Add additional params in existing one for calculation
   async initializeParams(params: any): Promise<any> {
    const isGameProgressResponse = await this.isGameProgress(params);
    if (isGameProgressResponse.success && !isGameProgressResponse.isGameOver) {
      params.data = _.omit(params.data, '__route__');
      params.data.playingPlayers = _.where(params.table.players, { state: stateOfX.playerState.playing });
      params.data.overResponse = params.data.overResponse || {};
      params.data.overResponse.isGameOver = false;
      params.data.overResponse.isRoundOver = false;
      params.data.overResponse.turns = [];
      params.data.isAllInOccured = false;
      return params;
    } else {
      throw isGameProgressResponse;
    }
  }

  // check if all in occured on table for any player
 async isAllInOccured(params: any): Promise<any> {
    const isGameProgressResponse = await this.isGameProgress(params);
    if (isGameProgressResponse.success && !isGameProgressResponse.isGameOver) {
      if (_.where(params.table.players, { state: stateOfX.playerState.playing, chips: 0 }).length > 0) {
        params.data.isAllInOccured = true;
        params.table.isAllInOcccured = true;
        return params;
      } else {
        throw {
          success: false,
          channelId: (params.channelId || ""),
          info: popupTextManager.falseMessages.ISGAMEPROGRESS_ISALLINOCCURED_HANDLEGAMESTARTCASE,
          isRetry: false,
          isDisplay: true
        };
      }
    } else {
      throw isGameProgressResponse;
    }
  }

  // set all in players states and turns object for broadcast
  private async setAllInPlayerAttributes(params: any): Promise<any> {
    const isGameProgressResponse = await this.isGameProgress(params);
    if (isGameProgressResponse.success && !isGameProgressResponse.isGameOver) {

      const allInPlayers = _.where(params.table.players, { state: stateOfX.playerState.playing, chips: 0 });
      
      for (let i = 0; i < allInPlayers.length; i++) {

        const indexOfPlayer = _ld.findIndex(params.table.players, { playerId: allInPlayers[i].playerId });

        allInPlayers[i].active = false;
        allInPlayers[i].lastMove = stateOfX.move.allin;
        allInPlayers[i].isPlayed = true;


        // Reset first player turn if player next to dealer went to ALLIN
        if (indexOfPlayer === params.table.firstActiveIndex) {
          params.table.firstActiveIndex = params.table.players[indexOfPlayer].nextActiveIndex;
        }

        params.data.overResponse.turns.push({
          success: true,
          channelId: params.data.channelId,
          playerId: allInPlayers[i].playerId,
          playerName: allInPlayers[i].playerName,
          amount: params.table.roundBets[_ld.findIndex(params.table.players, { playerId: allInPlayers[i].playerId })],
          action: stateOfX.move.allin,
          chips: allInPlayers[i].chips,
          currentMoveIndex: params.table.players[params.table.currentMoveIndex].seatIndex,
          moves: params.table.players[params.table.currentMoveIndex].moves,
          totalRoundBet: params.table.players[indexOfPlayer].totalRoundBet,
          totalGameBet: params.table.players[indexOfPlayer].totalGameBet,
          roundMaxBet: params.table.roundMaxBet,
          roundName: params.table.roundName,
          pot: _.pluck(params.table.pot, 'amount'),
          minRaiseAmount: params.table.minRaiseAmount,
          maxRaiseAmount: params.table.maxRaiseAmount,
          totalPot: tableManager.getTotalPot(params.table.pot) + tableManager.getTotalBet(params.table.roundBets)
        });
      }

      return params;
    } else {
      throw isGameProgressResponse;
    }
  }

  // again set available moves options in all turns broadcast objects
    resetMoveInTurnResponse(params: any): any {
    for (let i = 0; i < params.data.overResponse.turns.length; i++) {
      params.data.overResponse.turns[i].moves = params.table.players[params.table.currentMoveIndex].moves;
    }
    return params;
  }

  // check for game over by is there any player with move?
   async checkIfOnStartGameOver(params: any): Promise<any> {
    const isGameProgressResponse = await this.isGameProgress(params);
    if (isGameProgressResponse.success && !isGameProgressResponse.isGameOver) {
      if (tableManager.isPlayerWithMove(params) === false) {
        params.table.state = stateOfX.gameState.gameOver;
      }
      return params;
    } else {
      throw isGameProgressResponse;
    }
  }

  // check for game over by small blind player all in + 2 playing players
   async smallBlindAllInGameOver(params: any): Promise<any> {
    const isGameProgressResponse = await this.isGameProgress(params);
    if (isGameProgressResponse.success && !isGameProgressResponse.isGameOver) {
      if (params.data.playingPlayers.length === 2 && params.table.players[params.table.smallBlindIndex].lastMove === stateOfX.move.allin) {
        params.table.state = stateOfX.gameState.gameOver;
      }
      return params;
    } else {
      throw isGameProgressResponse;
    }
  }

  // check for game over by big blind player all in + 2 playing players + small blind posted more than big blind posted
   async bigBlindAllInGameOver(params: any): Promise<any> {
    const isGameProgressResponse = await this.isGameProgress(params);
    if (isGameProgressResponse.success && !isGameProgressResponse.isGameOver) {
      if (params.data.playingPlayers.length === 2 && params.table.players[params.table.bigBlindIndex].lastMove === stateOfX.move.allin) {
        if (params.table.roundBets[params.table.bigBlindIndex] <= params.table.roundBets[params.table.smallBlindIndex]) {
          params.table.state = stateOfX.gameState.gameOver;
        }
      }
      return params;
    } else {
      throw isGameProgressResponse;
    }
  }

  // again set round over info and name in turns broadcast IF game got over
   async addRoundOverInTurn(params: any): Promise<any> {
    if (params.table.state === stateOfX.gameState.gameOver) {
      for (let i = 0; i < params.data.overResponse.turns.length; i++) {
        params.data.overResponse.turns[i].isRoundOver = true;
        params.data.overResponse.turns[i].roundName = stateOfX.round.showdown;
      }
    }
    return params;
  }

  // initialize - does nothing as yet
   async setTableEntitiesOnStart(params: any): Promise<any> {
    const isGameProgressResponse = await this.isGameProgress(params);
    if (isGameProgressResponse.success && !isGameProgressResponse.isGameOver) {
      return params;
    } else {
      throw isGameProgressResponse;
    }
  }

  // create "game-start-game-over" response
   async createGameStartCaseResponse(params: any): Promise<any> {
    const isGameProgressResponse = await this.isGameProgress(params);
    if (isGameProgressResponse.success && !isGameProgressResponse.isGameOver) {
      return {
        success: true,
        table: params.table,
        data: params.data,
        response: params.data.overResponse
      };
    } else {
      throw isGameProgressResponse;
    }
  }

  // Adjust active player indexes among each other
   async adjustActiveIndexes(params: any): Promise<any> {
    const performResponse = await adjustIndex.perform(params);
    return performResponse.params;
  }

  // Handle all cases required to handle an action
   async processGameStartCases(params: any): Promise<any> {
    params = _.omit(params, 'self');
    const validated = await keyValidator.validateKeySets("Request", "database", "processGameStartCases", params);
    
    if (validated.success) {
      try {
        let result = await this.initializeParams(params);
        result = await this.isAllInOccured(result);
        result = await this.setAllInPlayerAttributes(result);
        result = await this.getMoves(result);
        result = this.resetMoveInTurnResponse(result);
        result = await this.checkIfOnStartGameOver(result);
        result = await this.smallBlindAllInGameOver(result);
        result = await this.bigBlindAllInGameOver(result);
        result = await this.addRoundOverInTurn(result);
        result = await this.setTableEntitiesOnStart(result);
        result = await this.adjustActiveIndexes(result);
        result = await this.createGameStartCaseResponse(result);
        
        return result;
      } catch (err) {
        throw err;
      }
    } else {
      throw validated;
    }
  }


}