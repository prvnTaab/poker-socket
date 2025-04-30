import { Injectable } from "@nestjs/common";
import _ld from "lodash";
import _ from 'underscore';
import async from "async";
import { stateOfX, popupTextManager } from "shared/common";
import tableManager from "./tableManager";
import { validateKeySets } from "shared/common/utils/activity";


@Injectable()
export class AdjustActiveIndexService {

  constructor() {

  }


  // ### Get next active player index
  // > Return next active index corresponding to current player
  async getNextActiveIndex(params: any) {
    const validated = await validateKeySets("Request", params.serverType, "getNextActiveIndex", params);
    if (validated.success) {
      const totalActivePlayersResponse = await tableManager.totalActivePlayers(params);
      if (totalActivePlayersResponse.success) {
        const activePlayers = totalActivePlayersResponse.players;
        if (activePlayers.length > 1) {
          const indexInActivePlayers = _ld.findIndex(activePlayers, params.table.players[params.index]);
          const nextSuitableIndex = tableManager.getNextSuitableIndex(indexInActivePlayers, activePlayers.length);
          const indexInPlayers = _ld.findIndex(params.table.players, activePlayers[nextSuitableIndex]);
          return { success: true, index: indexInPlayers };
        } else {
          return { success: true, index: params.index };
        }
      } else {
        return totalActivePlayersResponse;
      }
    } else {
      return validated;
    }
  };

  // ### Get previous active player index
  // > Return previous active index corresponding to current player
  async getPreActiveIndex(params: any) {
    const validated = await validateKeySets("Request", params.serverType, "getPreActiveIndex", params);
    if (validated.success) {
      const totalActivePlayersResponse = await tableManager.totalActivePlayers(params);
      if (totalActivePlayersResponse.success) {
        const activePlayers = totalActivePlayersResponse.players;
        if (activePlayers.length > 1) {
          const indexInActivePlayers = _ld.findIndex(activePlayers, params.table.players[params.index]);
          const preSuitableIndex = tableManager.getPreSuitableIndex(indexInActivePlayers, activePlayers.length);
          const indexInPlayers = _ld.findIndex(params.table.players, activePlayers[preSuitableIndex]);
          return { success: true, index: indexInPlayers };
        } else {
          return { success: true, index: params.index };
        }
      } else {
        return totalActivePlayersResponse;
      }
    } else {
      return validated;
    }
  };

  // ### Adjust next and previous active players indexes among players
  async perform(params: any) {
    try {
      await async.each(params.table.players, async (player: any) => {
        let isActivePlayer = false;
        if (params.table.onStartPlayers.indexOf(player.playerId) >= 0 && player.active) {
          isActivePlayer = true;
        }

        if (params.table.channelType === stateOfX.gameType.tournament) {
          isActivePlayer = player.lastMove !== stateOfX.move.fold;
        }


        if (isActivePlayer) {
          const index = _ld.findIndex(params.table.players, player);
          const getPreActiveIndexResponse = await this.getPreActiveIndex({
            serverType: params.serverType,
            channelId: params.channelId,
            index: index,
            table: params.table
          });

          const getNextActiveIndexResponse = await this.getNextActiveIndex({
            serverType: params.serverType,
            channelId: params.channelId,
            index: index,
            table: params.table
          });

          if (getPreActiveIndexResponse.success && getNextActiveIndexResponse.success) {
            player.preActiveIndex = getPreActiveIndexResponse.index;
            player.nextActiveIndex = getNextActiveIndexResponse.index;
          } else {
            throw new Error('Failed to get active indexes');
          }
        } else {
          player.preActiveIndex = -1;
          player.nextActiveIndex = -1;
        }
      });

      return { success: true, params: params };
    } catch (err) {
      return {
        success: false,
        isRetry: false,
        isDisplay: false,
        channelId: (params.channelId || ""),
        info: popupTextManager.falseMessages.ACTIVE_PLAYER_ADJUSTMENT_FAILED + JSON.stringify(err)
      };
    }
  }

  // Get previous playing player index by index of current player
  async getPrePlayingByIndex(params: any) {
    let index = params.index - 1 < 0 ? params.table.players.length - 1 : params.index - 1;

    for (let i = 0; i < params.table.players.length; i++) {
      const player = params.table.players[index];

      if (player.state === stateOfX.playerState.playing) {
        break;
      } else {
        console.log(stateOfX.serverLogType.info, 'This is not a playing or waiting player');
      }

      index--;
      if (index < 0) {
        index = params.table.players.length - 1;
      }
    }

    return { success: true, index: index };
  }

  // Get previous player index by seatIndex of current player
  // Previous player state must be playing
  // If getting big blind index then skip state check
  async getPrePlayerBySeatIndex(params: any) {
    // Return if requesting from a seat that exceed boundary limits
    if (parseInt(params.seatIndex) < 1 || parseInt(params.seatIndex) > parseInt(params.table.maxPlayers)) {
      return {
        success: false,
        isRetry: false,
        isDisplay: false,
        channelId: (params.channelId || ""),
        info: popupTextManager.falseMessages.EXCEED_BOUNDARY_LIMITS
      };
    }

    // if looking from first seat then return last seat index player details
    if (parseInt(params.seatIndex) === 1) {
      return { success: true, seatIndex: parseInt(params.table.maxPlayers) };
    }

    // Return seatIndex -1 if looking for any other seat
    return { success: true, seatIndex: parseInt(params.seatIndex) - 1 };
  };

}
