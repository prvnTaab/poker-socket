import { Injectable } from "@nestjs/common";
import _ld from "lodash";
import _ from 'underscore';
import { stateOfX, popupTextManager, convertIntToDecimal } from "shared/common";
import async from "async";
import { validateKeySets } from "shared/common/utils/activity";
import { TableManagerService } from "./tableManager.service";

@Injectable()
export class SetMoveService {
    
    constructor(
      private readonly tableManager:TableManagerService
    ){}


  // Return call amount for current turn player
    callAmount(table: any): number {
    return convertIntToDecimal(table.roundMaxBet) - convertIntToDecimal(table.roundBets[table.currentMoveIndex]);
  }

  // Return true if current turn player has chips more or equal than his callAmount
   enoughCallAmount(table: any, player: any): boolean {
    return convertIntToDecimal(player.chips) > convertIntToDecimal(table.roundMaxBet) - convertIntToDecimal(table.roundBets[table.currentMoveIndex]);
  }

  // Return true if current turn player has chips more or equal than min raise (minus his current bet)
   enoughRaiseAmount(table: any, player: any): boolean {
    return convertIntToDecimal(player.chips) >= (table.minRaiseAmount - convertIntToDecimal(table.players[table.currentMoveIndex].totalRoundBet));
  }

  // Return true if player is small blind, round on table is preflop
  isPreflopSmallBlind(table: any, player: any): boolean {
    return (
      this.enoughRaiseAmount(table, player) && 
      table.roundName === stateOfX.round.preflop && 
      table.roundMaxBet == table.roundBets[table.bigBlindIndex] && 
      table.currentMoveIndex === table.smallBlindIndex
    );
  }

  // Insert CHECK based on condition
   assignCheck(table: any, player: any): void {
    if (table.roundBets[table.currentMoveIndex] == table.roundMaxBet) {
      player.moves.push(stateOfX.moveValue.check);
    }
    player.moves = _.uniq(player.moves);
  }

  // Insert CALL based on condition
   assignCall(table: any, player: any): void {
    if (this.callAmount(table) > 0) {
      if (this.enoughCallAmount(table, player)) {
        player.moves.push(stateOfX.moveValue.call);
      }
    }
    player.moves = _.uniq(player.moves);
  }

  // Insert BET in moves based on condition
   assignBet(table: any, player: any): void {
    if (
      player.moves.indexOf(stateOfX.moveValue.raise) >= 0 || 
      convertIntToDecimal(player.chips) <= 0 || 
      convertIntToDecimal(player.chips) <= table.roundMaxBet
    ) return;

    if (table.roundBets[table.currentMoveIndex] == table.roundMaxBet) {
      player.moves.push(stateOfX.moveValue.bet);
    }

    player.moves = _.uniq(player.moves);
  }

  // Insert RAISE in moves based on conditions
    assignRaise(table: any, player: any): void {
    if (table.raiseBy == player.playerId) {
      player.moves = _.uniq(player.moves);
      table.isBettingRoundLocked = true;
      return;
    } else {
      console.log(stateOfX.serverLogType.info, 'Else of if 4 in assignRaise');
    }

    if (player.isPlayed && table.isBettingRoundLocked) {
      player.moves = _.uniq(player.moves);
      return;
    } else {
      console.log(stateOfX.serverLogType.info, 'Else of if 1 in assignRaise');
    }

    if (table.roundMaxBet > 0 && this.enoughRaiseAmount(table, player)) {
      player.moves.push(stateOfX.moveValue.raise);
    } else {
        console.log(stateOfX.serverLogType.info, 'Else of if 2 in assignRaise -' + JSON.stringify(table.roundMaxBet));
    }

    if (
      player.moves.indexOf(stateOfX.moveValue.raise) < 0 && 
      this.isPreflopSmallBlind(table, player)
    ) {
      player.moves.push(stateOfX.moveValue.raise);
    } else {
        console.log(stateOfX.serverLogType.info, 'Else of if 3 in assignRaise');
    }

    player.moves = _.uniq(player.moves);
  }

  // Insert ALLIN in moves based on conditions
  assignAllin(table: any, player: any): void {
    if (table.raiseBy == player.playerId) {
      if (
        player.moves.indexOf(stateOfX.moveValue.call) < 0 && 
        player.moves.indexOf(stateOfX.moveValue.check) < 0
      ) {
        player.moves.push(stateOfX.moveValue.allin);
      }
      player.moves = _.uniq(player.moves);
      return;
    } else {
        console.log(stateOfX.serverLogType.info, 'Else of if 4 in assignAllin');
    }

    if (player.isPlayed && table.isBettingRoundLocked) {
      if (!this.enoughCallAmount(table, player)) {
        player.moves.push(stateOfX.moveValue.allin);
      } else {
        console.log(stateOfX.serverLogType.info, 'Player have enough amount to call, not allowing ALLIN');
      }
      player.moves = _.uniq(player.moves);
      return;
    }

    if (this.tableManager.maxRaise(table) >= player.chips) {
      player.moves.push(stateOfX.moveValue.allin);
    }

    player.moves = _.uniq(player.moves);
  }

  // Remove some moves based on special game requirement cases
 removeCommonCases(table: any, player: any, playingPlayers: number, move: number): void {
    
    if (player.moves.indexOf(move) < 0) return;
    if (player.moves.indexOf(stateOfX.moveValue.call) >= 0) {
      player.moves.splice(player.moves.indexOf(move), 1);
      return;
    }
  }

  // Remove raise and allin cases based on some special cases
   removeRaiseAllin(params: any, table: any, player: any): void {
    const playingPlayers = _.filter(table.players, (plr) => {
      return (
        plr.state == stateOfX.playerState.playing || 
        (
          plr.state == stateOfX.playerState.onBreak && 
          params.table.isCTEnabledTable && 
          plr.playerScore > 0 &&
          (
            (plr.playerCallTimer.status === false && plr.callTimeGameMissed <= params.table.ctEnabledBufferHand) ||
            (plr.playerCallTimer.status === true && !(plr.playerCallTimer.isCallTimeOver))
          )
        )
      );
    }).length;

    const activePlayers = _.filter(table.players, (plr) => {
      return (
        (
          plr.state == stateOfX.playerState.playing || 
          (
            plr.state == stateOfX.playerState.onBreak && 
            params.table.isCTEnabledTable && 
            plr.playerScore > 0 &&
            (
              (plr.playerCallTimer.status === false && plr.callTimeGameMissed <= params.table.ctEnabledBufferHand) ||
              (plr.playerCallTimer.status === true && !(plr.playerCallTimer.isCallTimeOver))
            )
          )
        ) && 
        plr.active == true
      );
    }).length;

    const disconnectedPlayers = _.where(table.players, {state: stateOfX.playerState.disconnected, active: true}).length;

    const indexOfMaxBet = table.roundBets.indexOf(table.roundMaxBet);
    if (
      indexOfMaxBet >= 0 && 
      !!table.players[indexOfMaxBet] && 
      table.players[indexOfMaxBet].lastMove === stateOfX.move.allin && 
      playingPlayers > 2
    ) {
      console.log(stateOfX.serverLogType.info, 'Max bet of round placed by ALLIN player, consider as active');
    }

    if ((activePlayers + disconnectedPlayers) === 1 && this.tableManager.isPlayerWithMove(params)) {
      this.removeCommonCases(table, player, playingPlayers, stateOfX.moveValue.raise);
      this.removeCommonCases(table, player, playingPlayers, stateOfX.moveValue.allin);
    } else {
        console.log(stateOfX.serverLogType.info, 'More than 1 active player case !');
    }
  }

  // Update player selected precheck value
  updatePlayerPrecheckSelection(
    oldPrecheckValue: string,
    newPrecheckSet: number,
    oldCallPCAmountStillValid: boolean,
    roundOver: boolean
  ): string {
    if (roundOver) {
      return stateOfX.playerPrecheckValue.NONE;
    }

    let newPrecheckValue: string;
    switch (oldPrecheckValue) {
      case stateOfX.playerPrecheckValue.NONE:
        newPrecheckValue = stateOfX.playerPrecheckValue.NONE;
        break;
      case stateOfX.playerPrecheckValue.CALL:
        if (newPrecheckSet == 1) {
          newPrecheckValue = stateOfX.playerPrecheckValue.NONE;
        } else if (newPrecheckSet == 2) {
          newPrecheckValue = oldCallPCAmountStillValid 
            ? stateOfX.playerPrecheckValue.CALL 
            : stateOfX.playerPrecheckValue.NONE;
        } else {
          newPrecheckValue = stateOfX.playerPrecheckValue.NONE;
        }
        break;
      case stateOfX.playerPrecheckValue.CALL_ANY_CHECK:
      case stateOfX.playerPrecheckValue.CALL_ANY:
      case stateOfX.playerPrecheckValue.ALLIN:
        if (newPrecheckSet == 1) {
          newPrecheckValue = stateOfX.playerPrecheckValue.CALL_ANY_CHECK;
        } else if (newPrecheckSet == 2) {
          newPrecheckValue = stateOfX.playerPrecheckValue.CALL_ANY;
        } else {
          newPrecheckValue = stateOfX.playerPrecheckValue.ALLIN;
        }
        break;
      case stateOfX.playerPrecheckValue.FOLD:
        if (newPrecheckSet == 1) {
          newPrecheckValue = stateOfX.playerPrecheckValue.NONE;
        } else if (newPrecheckSet == 2) {
          newPrecheckValue = stateOfX.playerPrecheckValue.FOLD;
        } else {
          newPrecheckValue = stateOfX.playerPrecheckValue.FOLD;
        }
        break;
      case stateOfX.playerPrecheckValue.CHECK:
        if (newPrecheckSet == 1) {
          newPrecheckValue = stateOfX.playerPrecheckValue.CHECK;
        } else if (newPrecheckSet == 2) {
          newPrecheckValue = stateOfX.playerPrecheckValue.NONE;
        } else {
          newPrecheckValue = stateOfX.playerPrecheckValue.NONE;
        }
        break;
      case stateOfX.playerPrecheckValue.CHECK_FOLD:
        if (newPrecheckSet == 1) {
          newPrecheckValue = stateOfX.playerPrecheckValue.CHECK_FOLD;
        } else if (newPrecheckSet == 2) {
          newPrecheckValue = stateOfX.playerPrecheckValue.FOLD;
        } else {
          newPrecheckValue = stateOfX.playerPrecheckValue.FOLD;
        }
        break;
      default:
        newPrecheckValue = stateOfX.playerPrecheckValue.NONE;
    }
    return newPrecheckValue;
  }

  // Set moves for current turn player
  async getMove(params: any): Promise<any> {
    const validated = await validateKeySets("Request", "database", "getMove", params);
    if (validated.success) {
      const player = params.table.players[params.table.currentMoveIndex];

      player.moves = [];
      player.moves.push(stateOfX.moveValue.fold);

      this.assignCheck(params.table, player);
      this.assignCall(params.table, player);
      this.assignRaise(params.table, player);
      this.assignBet(params.table, player);
      this.assignAllin(params.table, player);
      this.removeRaiseAllin(params, params.table, player);

      return { success: true, params: params };
    } else {
      return validated;
    }
  }

  // Assign players prechecks according to their bets, remaining chips
  async assignPrechecks(params: any): Promise<any> {
    try {
      const playingPlayers = _.where(params.table.players, { state: stateOfX.playerState.playing, active: true });
      params.table.preChecks = [];

      await async.each(playingPlayers, async (player: any) => {
        const playerIndex = _ld.findIndex(params.table.players, player);
        
        if (params.table.currentMoveIndex !== playerIndex) {
          if (!player.tournamentData.isTournamentSitout) {
            player.preCheck = stateOfX.preCheck.setThree;
            
            if (params.table.roundBets[playerIndex] == params.table.roundMaxBet) {
              player.preCheck = stateOfX.preCheck.setOne;
            } else if ((convertIntToDecimal(player.chips) + (params.table.roundBets[playerIndex])) >= params.table.roundMaxBet) {
              player.preCheck = stateOfX.preCheck.setTwo;
            }
            
            if (player.chips <= 0) {
              player.preCheck = -1;
            }
            
            player.precheckValue = this.updatePlayerPrecheckSelection(
              player.precheckValue || stateOfX.playerPrecheckValue.NONE,
              player.preCheck,
              (params.table.roundMaxBet - (player.totalRoundBet || 0) == (player.callPCAmount || 0)),
              params.data.roundOver
            );
            
            params.table.preChecks.push({
              playerId: player.playerId,
              set: player.preCheck,
              precheckValue: player.precheckValue
            });
            
          } else {
            console.log(stateOfX.serverLogType.info, 'Player is in tournament sitout so not assigning precheck!');
          }
        } else {
          player.precheckValue = this.updatePlayerPrecheckSelection(
            player.precheckValue || stateOfX.playerPrecheckValue.NONE,
            player.preCheck,
            (params.table.roundMaxBet - (player.totalRoundBet || 0) == (player.callPCAmount || 0)),
            params.data.roundOver
          );
        }
      });

      return { success: true, params: params };
    } catch (err) {
      return {
        success: false,
        isRetry: false,
        isDisplay: false,
        channelId: "",
        info: popupTextManager.falseMessages.ASSIGNPRECHECKS_FAIL_SETTABLECONFIG
      };
    }
  }


}