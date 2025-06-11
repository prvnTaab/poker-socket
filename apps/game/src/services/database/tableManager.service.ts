


// This file is used to manipulate table operations
import { Injectable } from "@nestjs/common";
import _ld from "lodash";
import _ from "underscore";
import async from "async";
import { stateOfX, systemConfig, popupTextManager } from "shared/common";
import winnerMgmt from "../../../../../shared/winnerAlgo/entry";
import { ActivityService } from "shared/common/activity/activity.service";
import { convertIntToDecimal } from "shared/common";
import { validateKeySets } from "shared/common/utils/activity";
import { ImdbDatabaseService } from "shared/common/datebase/Imdbdatabase.service";
import { PokerDatabaseService } from "shared/common/datebase/pokerdatabase.service";


@Injectable()
export class TableManagerService {

  constructor(
    private readonly imdb: ImdbDatabaseService,
    private readonly db: PokerDatabaseService,
    private readonly activity: ActivityService) {
  }


  async calculatePlayerScore(player: any) {
    try {
      const res = await this.imdb.getPlayerBuyInSum({
        playerId: player.playerId,
        channelId: player.channelId
      });
      player.playerScore = convertIntToDecimal((player.chips - (res[0] ? res[0].sum : 0)));
      return player;
    } catch (err) {
      console.log(err);
      throw err;
    }
  };

  // ### Get table from database
  getTableObject(params: any) {
    return { success: true, table: params.table };
  };

  async getSavedPlayerFromIMDB(param: any) {
    const Query = {
      seatIndex: param.seatIndex,
      channelId: param.channelId
    };
    const result = await this.imdb.getCurrentPlayers(Query);
    return { success: true, prevData: result };
  };

  async removeEmptyPlayers(params: any) {
    const prevDealerseatIndex = params.table.prevDealerseatIndex;
    const dealerSeatIndex = params.table.dealerSeatIndex;
    let currentDealerFound = false;
    let player;
    const emptyPlayers: any[] = [];

    if (prevDealerseatIndex < dealerSeatIndex) {
      for (let i = prevDealerseatIndex + 1; i < dealerSeatIndex; i++) {
        player = _.where(params.table.players, { seatIndex: i });
        if (player.length && (player[0].state == "PLAYING" || player[0].state == "WAITING")) {
        } else {
          emptyPlayers.push(i);
        }
      }
    } else {
      for (let i = 1; i < dealerSeatIndex; i++) {
        player = _.where(params.table.players, { seatIndex: i });
        if (player.length && (player[0].state == "PLAYING" || player[0].state == "WAITING")) {
          console.log("CurrentRoundPlayer", player);
        } else {
          console.log("removingPlayer", player);
          emptyPlayers.push(i);
        }
      }
    }

    if (emptyPlayers.length > 0) {
      await async.eachSeries(emptyPlayers, async (emptyPlayer: any) => {
        const query = {
          seatIndex: emptyPlayer,
          channelId: params.table.channelId
        };
        await this.removeCurrentPlayer(query);
      });
    }

    return params;
  };

  async savePlayerInIMDB(param: any) {
    await this.imdb.saveCurrentPlayer(param);
    return { success: true };
  };

  async removeCurrentPlayer(param: any) {
    await this.imdb.removeCurrentPlayer(param);
    return { success: true };
  };

  addPlayerAsWaiting(params: any) {
    const res = this.seatsFullOrPlayerNotOnTable(params);
    if (res.success) {
      const indexOccupied = _.uniq(_.pluck(params.table.players, 'seatIndex'));
      if (indexOccupied.indexOf(params.data.player.seatIndex) >= 0) {
        return {
          success: false,
          isRetry: false,
          isDisplay: true,
          channelId: (params.channelId || ""),
          info: popupTextManager.falseMessages.VALIDATESEATOCCUPANCYFAIL_SITHEREHANDLER
        };
      }

      const playingPlayers = _.where(params.table.players, { state: stateOfX.playerState.playing });
      const waitingPlayers = _.where(params.table.players, { state: stateOfX.playerState.waiting });
      if (playingPlayers.length + waitingPlayers.length > 2) {
        params.data.player.isForceBlindVisible = true;
      }

      const getRes: any = this.getSavedPlayerFromIMDB(params.data.player);
      let savePlayer = 0;
      if (getRes.prevData != null) {
        if (getRes.prevData.playerId != params.data.player.playerId) {
          if (params.data.player.state != stateOfX.playerState.reserved) {
            this.removeCurrentPlayer(params.data.player);
          }
        } else {
          params.data.player.hasPlayedOnceOnTable = true;
          params.data.player.isForceBlindVisible = false;
        }
      }
      params.table.players.push(params.data.player);
      return {
        success: true,
        table: params.table,
        data: { player: params.data.player }
      };
    } else {
      return res;
    }
  };

  getTableBuyIn(params: any) {
    return {
      success: true,
      data: {
        tableMinBuyIn: params.table.minBuyIn,
        tableMaxBuyIn: params.table.maxBuyIn,
        isStraddleEnable: params.table.isStraddleEnable,
        smallBlind: params.table.smallBlind,
        bigBlind: params.table.bigBlind
      },
      table: params.table
    };
  };

  getSeatOccupied(params: any) {
    return {
      success: true,
      data: {
        indexOccupied: _.uniq(_.pluck(params.table.players, 'seatIndex'))
      },
      table: params.table
    };
  };

  getCurrentPlayer(params: any) {
    if (params.table.players.length > 0 && params.table.currentMoveIndex < (params.table.players.length) && params.table.currentMoveIndex !== -1) {
      params.data.player = params.table.players[params.table.currentMoveIndex];
      params.data.success = true;
      return {
        success: true,
        data: params.data,
        table: params.table
      };
    } else {
      return {
        success: false,
        isRetry: true,
        isDisplay: false,
        channelId: (params.channelId || ""),
        info: popupTextManager.falseMessages.GETCURRENTPLAYERFAIL_TABLEMANAGER
      };
    }
  };

  async updateTableEntitiesOnGameStart(params: any) {
    const validated = await validateKeySets("Request", "database", "updateTableEntitiesOnGameStart", params);
    if (validated.success) {
      params.table.state = stateOfX.gameState.running;
      return { success: true };
    } else {
      return validated;
    }
  };

  async totalActivePlayer(params: any) {
    const validated = await validateKeySets("Request", "database", "totalActivePlayers", params);
    if (validated.success) {
      return {
        success: true,
        players: _.filter(params.table.players, (p: any) => {
          return (p.active == true);
        })
      };
    } else {
      return validated;
    }
  };

  async totalActivePlayers(params: any) {
    const validated = await validateKeySets("Request", "database", "totalActivePlayers", params);
    if (validated.success) {
      return {
        success: true,
        players: _.filter(params.table.players, (p: any) => {
          return (p.isCurrentRoundPlayer == true && p.active == true);
        })
      };
    } else {
      return validated;
    }
  };

  async totalPlayingPlayers(params: any) {
    const validated = await validateKeySets("Request", "database", "totalActivePlayers", params);
    if (validated.success) {
      return {
        success: true,
        players: _.where(params.table.players, { state: stateOfX.playerState.playing })
      };
    } else {
      return validated;
    }
  };

  async totalWaitingPlayers(params: any) {
    const validated = await validateKeySets("Request", "database", "totalWaitingPlayers", params);
    if (validated.success) {
      return {
        success: true,
        players: _.where(params.table.players, { state: stateOfX.playerState.waiting })
      };
    } else {
      return validated;
    }
  };

  async resumePlayer(params: any) {
    if (_.where(params.table.players, { playerId: params.data.playerId }).length < 0) {
      return {
        success: false,
        code: 401,
        isRetry: false,
        isDisplay: true,
        channelId: (params.channelId || ""),
        info: popupTextManager.falseMessages.RESUMEPLAYER_NOTSITTING_TABLEMANAGER
      };
    }

    const player = _.where(params.table.players, { playerId: params.data.playerId })[0];

    if (!player) {
      return {
        success: false,
        code: 402,
        isRetry: false,
        isDisplay: true,
        channelId: (params.channelId || ""),
        info: popupTextManager.falseMessages.RESUMEPLAYER_NOTSITTING_TABLEMANAGER
      };
    }

    player.activityRecord.lastActivityTime = Number(new Date());

    const normalGameSitout = params.table.channelType === stateOfX.gameType.normal && ((player.state === stateOfX.playerState.onBreak) || player.state === stateOfX.playerState.outOfMoney);
    const tournamentSitout = params.table.channelType === stateOfX.gameType.tournament && !player.tournamentData.isTournamentSitout;

    if (!normalGameSitout && (player.state === stateOfX.playerState.playing || player.state === stateOfX.playerState.waiting) && (params.table.channelType !== stateOfX.gameType.tournament)) {
      return {
        success: false,
        code: 403,
        isRetry: false,
        isDisplay: true,
        channelId: (params.channelId || ""),
        info: popupTextManager.falseMessages.ALREADY_PLAYING_ON_TABLE
      };
    }

    const newPlayer = _.where(params.table.players, { playerId: params.data.playerId })[0];
    const Query = {
      seatIndex: newPlayer.seatIndex,
      channelId: newPlayer.channelId
    };
    const result = await this.imdb.getCurrentPlayers(Query);

    if (result == null) {
      player.hasPlayedOnceOnTable = false;
    }

    params.data.success = true;
    params.data.channelId = params.table.channelId;
    params.data.isOutOfMoney = false;
    params.data.fromJoinWaitList = false;
    params.data.lastMove = player.lastMove;

    player.sitoutNextHand = false;
    player.sitoutNextBigBlind = false;
    player.autoSitout = false;
    player.bigBlindMissed = 0;
    player.roundMissed = 0;
    player.disconnectedMissed = 0;
    player.sitoutGameMissed = 0;

    console.log('Printing previous state and current state ', params.data.previousState, player.previousState, player.state, params.table.players);
    params.data.previousState = player.state;

    if (params.table.channelType !== stateOfX.gameType.tournament) {
      if (convertIntToDecimal(player.chips) === 0) {
        params.data.isOutOfMoney = true;
        if (player.previousState === stateOfX.playerState.reserved) {
          params.data.fromJoinWaitList = true;
        }
        player.state = stateOfX.playerState.outOfMoney;
      } else {
        if (player.playerCallTimer.isCallTimeOver && player.callTimeGameMissed === params.table.ctEnabledBufferHand + 1) {
          player.state = stateOfX.playerState.onBreak;
        }
        else if (player.active || player.lastMove !== stateOfX.move.fold && params.table.players.length === 2) {
          player.state = stateOfX.playerState.playing;
        } else {
          player.state = stateOfX.playerState.waiting;
        }
      }
      params.data.state = player.state;
      await this.activity.resume(params, stateOfX.profile.category.game, stateOfX.game.subCategory.resume, stateOfX.logType.success);
      return {
        success: true,
        data: params.data,
        table: params.table
      };
    } else {
      player.tournamentData.isTournamentSitout = false;
      if (player.active || player.lastMove !== stateOfX.move.fold && params.table.players.length === 2) {
        player.state = stateOfX.playerState.playing;
      } else {
        player.state = stateOfX.playerState.waiting;
      }
      params.data.state = player.state;
      return {
        success: true,
        data: params.data,
        table: params.table
      };
    }
  };

  async processSitoutNextHand(params: any) {
    if (_.where(params.table.players, { playerId: params.data.playerId }).length > 0) {
      const player = _.where(params.table.players, { playerId: params.data.playerId })[0];
      player.activityRecord.lastActivityTime = Number(new Date());
      player.sitoutNextBigBlind = false;
      player.sitoutNextHand = true;

      if (params.table.channelType !== stateOfX.gameType.tournament && player.state === stateOfX.playerState.waiting) {
        player.state = stateOfX.playerState.onBreak;
      }

      params.data.success = true;
      params.data.state = player.state;
      params.data.lastMove = player.lastMove;
      params.data.channelId = params.table.channelId;
      await this.activity.sitoutNextHand(params, stateOfX.profile.category.game, stateOfX.game.subCategory.sitoutNextHand, stateOfX.logType.success);
      return {
        success: true,
        data: params.data,
        table: params.table
      };
    } else {
      return {
        success: false,
        isRetry: false,
        isDisplay: true,
        channelId: (params.channelId || ""),
        info: popupTextManager.falseMessages.PROCESSSITOUTNEXTHANDFAIL_TABLEMANAGER
      };
    }
  };

  async processSitoutNextBigBlind(params: any) {
    if (params.table.channelType === stateOfX.gameType.tournament) {
      return {
        success: false,
        isRetry: false,
        isDisplay: false,
        channelId: (params.channelId || ""),
        info: popupTextManager.falseMessages.PROCESSSITOUTNEXTBIGBLINDFAIL_TABLEMANAGER
      };
    }

    if (_.where(params.table.players, { playerId: params.data.playerId }).length > 0) {
      const player = _.where(params.table.players, { playerId: params.data.playerId })[0];
      player.activityRecord.lastActivityTime = Number(new Date());
      player.sitoutNextHand = false;
      player.sitoutNextBigBlind = true;
      params.data.success = true;
      params.data.channelId = params.table.channelId;
      params.data.state = player.state;
      await this.activity.sitoutNextBigBlind(params, stateOfX.profile.category.game, stateOfX.game.subCategory.sitoutNextBigBlind, stateOfX.logType.success);
      return {
        success: true,
        data: params.data,
        table: params.table
      };
    } else {
      return {
        success: false,
        isRetry: false,
        isDisplay: true,
        channelId: (params.channelId || ""),
        info: popupTextManager.falseMessages.PROCESSSITOUTNEXTBIGBLIND_NOTSITTING_TABLEMANAGER
      };
    }
  };

  async resetSitOut(params: any) {
    if (_.where(params.table.players, { playerId: params.data.playerId }).length > 0) {
      _.where(params.table.players, { playerId: params.data.playerId })[0].sitoutNextHand = false;
      _.where(params.table.players, { playerId: params.data.playerId })[0].sitoutNextBigBlind = false;
      const currentPlayer = params.table.players.find((e: any) => e.playerId === params.data.playerId);
      if (currentPlayer) {
        currentPlayer.tournamentData.isTournamentSitout = false;
      }
      params.data.success = true;
      params.data.state = _.where(params.table.players, { playerId: params.data.playerId })[0].state;
      params.data.channelId = params.table.channelId;
      await this.activity.resetSitOut(params, stateOfX.profile.category.game, stateOfX.game.subCategory.resetSitOut, stateOfX.logType.success);
      return {
        success: true,
        data: params.data,
        table: params.table
      };
    } else {
      return {
        success: false,
        isRetry: false,
        isDisplay: true,
        channelId: (params.channelId || ""),
        info: popupTextManager.falseMessages.RESETSITOUTFAIL_TABLEMANAGER
      };
    }
  };

  async joinPlayerInQueue(params: any) {
    const reject = await this.rejectIfPassword(params);
    if (reject) {
      return {
        success: false,
        isRetry: false,
        isDisplay: true,
        channelId: (params.channelId || ""),
        info: popupTextManager.falseMessages.TABLEPASSWORDFAIL_JOINCHANNELHANDLER
      };
    }

    if (params.table.players.length >= params.table.maxPlayers) {
      if (_ld.findIndex(params.table.queueList, { playerId: params.data.playerId }) < 0) {
        const result = await this.isSameNetworkSit(params);
        const abResult = await this.db.getAntiBanking({ playerId: params.data.playerId, channelId: params.channelId });
        let minChips = params.table.minBuyIn;
        if (!!abResult) {
          minChips = abResult.amount;
        }
        if (result.success) {
          if (systemConfig.allowSameNetworkPlay || params.data.byPassIp || _ld.findIndex(params.table.queueList, { networkIp: params.data.networkIp }) < 0) {
            const typeofChips = params.table.isRealMoney ? { "realChips": 1, "realChipBonus": 1, "points": 1 } : { "freeChips": 1, "points": 1 };
            const response = await this.db.getCustomUser(params.data.playerId, typeofChips);
            if (((typeof response.realChips == 'number') || (typeof response.freeChips == 'number'))) {
              const chips = params.table.isRealMoney ? (response.realChips + response.realChipBonus || 0) : (response.freeChips || 0);
              if (convertIntToDecimal(chips) >= convertIntToDecimal(minChips)) {
                params.table.queueList.push({
                  playerId: params.data.playerId,
                  playerName: params.data.playerName,
                  networkIp: params.data.networkIp,
                  joinedAt: Number(new Date())
                });
                params.data.success = true;
                params.data.info = params.data.playerName + ", you have been queued at no " + params.table.queueList.length + ".";
                return {
                  success: true,
                  data: params.data,
                  table: params.table
                };
              } else {
                return {
                  success: false,
                  isRetry: false,
                  isDisplay: true,
                  channelId: (params.channelId || ""),
                  info: popupTextManager.dbQyeryInfo.DBGETCUSTOMERUSER_JOINPLAYERINQUEUE_INSUFFICIENTAMOUNT_TABLEMANAGER
                };
              }
            } else {
              return {
                success: false,
                isRetry: false,
                isDisplay: true,
                channelId: (params.channelId || ""),
                info: popupTextManager.dbQyeryInfo.DBGETCUSTOMERUSER_JOINPLAYERINQUEUEFAIL_TABLEMANAGER
              };
            }
          } else {
            return {
              success: false,
              isRetry: false,
              isDisplay: true,
              channelId: (params.channelId || ""),
              info: popupTextManager.falseMessages.ISSAMENETWORKSITFAIL_TABLEMANAGER
            };
          }
        } else {
          return result;
        }
      } else {
        return {
          success: false,
          isRetry: false,
          isDisplay: true,
          channelId: (params.channelId || ""),
          info: params.data.playerName + ", " + popupTextManager.dbQyeryInfo.DBGETCUSTOMERUSER_JOINPLAYERINQUEUEALREADYINWAITINGLIST_TABLEMANAGER
        };
      }
    } else {
      return {
        success: false,
        isRetry: false,
        isDisplay: true,
        channelId: (params.channelId || ""),
        info: params.data.playerName + popupTextManager.dbQyeryInfo.DBGETCUSTOMERUSER_JOINPLAYERINQUEUEEMPTYSEATS_TABLEMANAGER
      };
    }
  };

  async setPlayerValue(params: any) {
    const playerIndex = _ld.findIndex(params.table.players, { playerId: params.data.playerId });
    if (playerIndex >= 0) {

      params.data.success = true;
      params.data.channelId = params.table.channelId;
      params.table.players[playerIndex].activityRecord.lastActivityTime = Number(new Date());

      if (params.data.key === "state") {
        if (params.data.value == stateOfX.playerState.playing) {
          await this.imdb.updateTableSetting({ channelId: params.channelId, playerId: params.data.playerId }, { $set: { status: "Playing" } });
          console.log("removed spectator in table manager state change");

          if (params.table.onStartPlayers.indexOf(params.data.playerId) >= 0) {
            if (params.table.players[playerIndex].roundId == params.table.roundId) {
              if (!!params.data.ifLastState && params.table.players[playerIndex].state == params.data.ifLastState) {
                params.table.players[playerIndex][params.data.key] = params.data.value;
                return {
                  success: true,
                  table: params.table,
                  data: params.data
                };
              } else if (params.table.players[playerIndex][params.data.key] !== stateOfX.playerState.outOfMoney) {
                params.table.players[playerIndex][params.data.key] = params.data.value;
                return {
                  success: true,
                  table: params.table,
                  data: params.data
                };
              } else {
                return {
                  success: true,
                  table: params.table,
                  data: params.data
                };
              }
            } else {
              return {
                success: false,
                isRetry: false,
                isDisplay: true,
                channelId: (params.channelId || ""),
                info: popupTextManager.falseMessages.SETPLAYERVALUEFAIL_TABLEMANAGER
              };
            }
          } else {
            return {
              success: false,
              isRetry: false,
              isDisplay: true,
              channelId: (params.channelId || ""),
              info: popupTextManager.falseMessages.SETPLAYERVALUEFAIL_TABLEMANAGER
            };
          }
        } else {
          params.table.players[playerIndex][params.data.key] = params.data.value;
          return {
            success: true,
            table: params.table,
            data: params.data
          };
        }
      }

      if (params.data.keyValues) {
        Object.assign(params.table.players[playerIndex], params.data.keyValues);
      } else {
        params.table.players[playerIndex][params.data.key] = params.data.value;
      }

      return {
        success: true,
        table: params.table,
        data: params.data
      };
    } else {
      return {
        success: false,
        isRetry: false,
        isDisplay: true,
        channelId: (params.channelId || ""),
        info: popupTextManager.falseMessages.SETPLAYERVALUEFAIL_TABLEMANAGER
      };
    }
  };

  getTableValue(params: any) {
    return {
      success: true,
      table: params.table,
      data: {
        success: true,
        value: params.table[params.data.key]
      }
    };
  };

  async disconnectCurrentPlayer(params: any) {
    if (params.table.players.length > 0 && params.table.currentMoveIndex < (params.table.players.length) && params.table.currentMoveIndex !== -1) {
      params.data.success = true;
      params.table.players[params.table.currentMoveIndex].activityRecord.disconnectedAt = new Date();
      return {
        success: true,
        table: params.table,
        data: {
          success: true,
          playerId: params.table.players[params.table.currentMoveIndex].playerId,
          playerName: params.table.players[params.table.currentMoveIndex].playerName
        }
      };
    } else {
      return {
        success: false,
        isRetry: false,
        isDisplay: true,
        channelId: (params.channelId || ""),
        info: popupTextManager.falseMessages.DISCONNECTCURRENTPLAYERFAIL_TABLEMANAGER
      };
    }
  };

  async getPlayerValue(params: any) {
    const playerIndex = _ld.findIndex(params.table.players, { playerId: params.data.playerId });
    if (playerIndex >= 0) {
      return {
        success: true,
        table: params.table,
        data: {
          success: true,
          value: params.table.players[playerIndex][params.data.key]
        }
      };
    } else {
      return {
        success: false,
        isRetry: false,
        isDisplay: false,
        channelId: (params.channelId || ""),
        info: popupTextManager.falseMessages.GETPLAYERVALUEFAIL_TABLEMANAGER
      };
    }
  };

  async getPlayerChipsWithFilter(params: any) {
    const playerIndex = _ld.findIndex(params.table.players, { playerId: params.data.playerId });
    if (params.table.channelType == stateOfX.gameType.normal) {
      if (playerIndex >= 0) {
        return {
          success: true,
          table: params.table,
          data: {
            success: true,
            isRealMoney: params.table.isRealMoney,
            value: params.table.players[playerIndex][params.data.key]
          }
        };
      }
    }
    return {
      success: false,
      isRetry: false,
      isDisplay: false,
      channelId: (params.channelId || ""),
      info: " filter failed or player not there"
    };
  };

  performAutoSitout(params: any) {
    if (_.where(params.table.players, { playerId: params.data.playerId }).length > 0) {
      if (_.where(params.table.players, { playerId: params.data.playerId })[0].state === stateOfX.playerState.playing) {
        _.where(params.table.players, { playerId: params.data.playerId })[0].state = stateOfX.playerState.onBreak;
        return {
          success: true,
          data: params.data,
          table: params.table
        };
      } else {
        _.where(params.table.players, { playerId: params.data.playerId })[0].autoSitout = true;
        _.where(params.table.players, { playerId: params.data.playerId })[0].state = stateOfX.playerState.onBreak;
        return {
          success: true,
          data: params.data,
          table: params.table
        };
      }
    } else {
      return {
        success: false,
        isRetry: false,
        isDisplay: true,
        channelId: (params.channelId || ""),
        info: popupTextManager.falseMessages.PERFORMAUTOSITFAIL_TABLEMANAGER
      };
    }
  };

  seatsFullOrPlayerNotOnTable(params: any) {
    if (params.table.players.length !== params.table.maxPlayers) {
      if (_ld.findIndex(params.table.players, { playerId: params.data.playerId }) < 0) {
        return {
          success: true,
          table: params.table
        };
      } else {
        return {
          success: false,
          isRetry: false,
          isDisplay: true,
          channelId: (params.channelId || ""),
          info: popupTextManager.falseMessages.PLAYERONTABLEFAIL_TABLEMANAGER
        };
      }
    } else {
      return {
        success: false,
        isRetry: false,
        isDisplay: true,
        channelId: (params.channelId || ""),
        info: popupTextManager.falseMessages.SEATSFULLONTABLEFAIL_TABLEMANAGER
      };
    }
  };

  async popCard(params: any) {
    const validated = await validateKeySets("Request", "database", "popCard", params);
    if (validated.success) {
      const cards = params.table.deck.slice(0, params.count);
      params.table.deck.splice(0, params.count);
      return {
        success: true,
        cards: cards
      };
    } else {
      return validated;
    }
  };

  getNextSuitableIndex(index: number, length: number) {
    if (index + 1 > length - 1) {
      return 0;
    } else {
      return (index + 1);
    }
  };

  getPreSuitableIndex(index: number, length: number) {
    if (index - 1 < 0) {
      return (length - 1);
    } else {
      return (index - 1);
    }
  };

  getTournamentSitoutPlayers(table: any) {
    const totalTournamentSitoutPlayers: any[] = [];
    if (table.channelType === stateOfX.gameType.tournament) {
      for (let i = 0; i < table.players.length; i++) {
        if (table.players[i].tournamentData.isTournamentSitout) {
          totalTournamentSitoutPlayers.push(table.players[i]);
        }
      }
    }
    return totalTournamentSitoutPlayers;
  };

  isPlayerWithMove(params: any) {
    const totalTournamentSitoutPlayers = this.getTournamentSitoutPlayers(params.table);
    const playingPlayers = _.filter(params.table.players, (player: any) => {
      return player.state == stateOfX.playerState.playing || (player.state == stateOfX.playerState.onBreak && (params.table.isCTEnabledTable && player.playerScore > 0)
        && (
          (player.playerCallTimer.status === false && player.callTimeGameMissed <= params.table.ctEnabledBufferHand)
          || (player.playerCallTimer.status === true
            && !(player.playerCallTimer.isCallTimeOver)
          )
        ))
    });
    let totalPlayingPlayers = playingPlayers;
    const foldedPlayers = _.where(params.table.players, { state: stateOfX.playerState.playing, lastMove: stateOfX.move.fold });
    const disconnectedPlayers = _.where(params.table.players, { state: stateOfX.playerState.disconnected });
    const disconnectedOnAllInPlayers = _.where(params.table.players, { state: stateOfX.playerState.disconnected, lastMove: stateOfX.move.allin });
    const disconnectedActivePlayers: any[] = [];
    const disconnectedAllInActivePlayers: any[] = [];

    for (let i = 0; i < disconnectedPlayers.length; i++) {
      if (disconnectedPlayers[i].lastMove !== stateOfX.move.fold && disconnectedPlayers[i].lastMove !== stateOfX.move.allin && disconnectedPlayers[i].active === true) {
        if (params.table.onStartPlayers.indexOf(disconnectedPlayers[i].playerId) >= 0) {
          disconnectedActivePlayers.push(disconnectedPlayers[i]);
        }
      }
    }

    for (let i = 0; i < disconnectedOnAllInPlayers.length; i++) {
      if (disconnectedOnAllInPlayers[i].lastMove == stateOfX.move.allin) {
        if (params.table.onStartPlayers.indexOf(disconnectedPlayers[i].playerId) >= 0) {
          disconnectedAllInActivePlayers.push(disconnectedOnAllInPlayers[i]);
        }
      }
    }

    const totalActivePlayers = _.where(totalPlayingPlayers, { active: true }).concat(disconnectedActivePlayers);
    totalPlayingPlayers = totalPlayingPlayers.concat(disconnectedActivePlayers);
    totalPlayingPlayers = totalPlayingPlayers.concat(disconnectedAllInActivePlayers);
    if (totalPlayingPlayers.length <= 1 || totalActivePlayers.length === 0) {
      return false;
    }

    if (totalPlayingPlayers.length - foldedPlayers.length === 1) {
      return false;
    }

    if (totalActivePlayers.length === 1) {
      const indexOfActivePlayer = _ld.findIndex(params.table.players, { playerId: totalActivePlayers[0].playerId });
      return (params.table.roundBets[indexOfActivePlayer] != params.table.roundMaxBet && params.table.players[indexOfActivePlayer].chips > 0);
    } else {
      return true;
    }
  };

  callAmount(table: any) {
    return convertIntToDecimal(table.roundMaxBet - table.roundBets[table.currentMoveIndex]);
  };

  getTotalPot(pot: any) {
    let totalPot = 0;
    for (let i = 0; i < pot.length; i++) {
      totalPot = convertIntToDecimal(totalPot + pot[i].amount);
    }
    return convertIntToDecimal(totalPot);
  };

  getTotalCompetitionPot(pot: any) {
    let totalPot = 0;
    for (let i = 0; i < pot.length; i++) {
      if (typeof pot[i].isRefund == 'boolean') {
        totalPot += pot[i].isRefund ? 0 : convertIntToDecimal(pot[i].amount);
      } else {
        totalPot += (pot[i].contributors.length > 1) ? convertIntToDecimal(pot[i].amount) : 0;
      }
    }
    return convertIntToDecimal(totalPot);
  };

  getTotalBet(bets: any) {
    let totalBets = 0;
    for (let i = 0; i < bets.length; i++) {
      totalBets = convertIntToDecimal(totalBets + bets[i]);
    }
    return convertIntToDecimal(totalBets);
  };

  getTotalGameContribution(table: any) {
    let sum = 0;
    for (let i = 0; i < table.contributors.length; i++) {
      sum += table.contributors[i].amount;
    }
    return convertIntToDecimal(sum);
  };

  maxRaise(table: any) {
    if (!table.isPotLimit && table.channelVariation != stateOfX.channelVariation.omaha) {
      return (table.players[table.currentMoveIndex].chips + (table.players[table.currentMoveIndex].totalRoundBet || 0));
    }

    if (_.where(table.players, { isPlayed: true }).length >= 0 || table.roundName === stateOfX.round.preflop) {

      let expectedMaxRaise;
      if (table.players[table.currentMoveIndex].seatIndex === table.smallBlindSeatIndex) {
        expectedMaxRaise = convertIntToDecimal(2 * table.roundMaxBet + this.getTotalGameContribution(table) - (table.players[table.currentMoveIndex].totalRoundBet || 0));
      } else {
        expectedMaxRaise = convertIntToDecimal(2 * table.roundMaxBet + this.getTotalGameContribution(table) - (table.players[table.currentMoveIndex].totalRoundBet || 0));
      }

      return expectedMaxRaise <= convertIntToDecimal(table.players[table.currentMoveIndex].chips + (table.players[table.currentMoveIndex].totalRoundBet || 0)) ? expectedMaxRaise : (table.players[table.currentMoveIndex].chips + (table.players[table.currentMoveIndex].totalRoundBet || 0));
    } else {
      return table.bigBlind;
    }
  };

  isPlayerAblind(index: number, table: any) {
    if (index == -1) {
      return false;
    }
    const player = table.players[index];
    const blindIndexes = [table.smallBlindSeatIndex, table.bigBlindSeatIndex];
    return blindIndexes.indexOf(player.seatIndex) >= 0;
  };

  minRaise(params: any) {
    return convertIntToDecimal(params.table.raiseDifference + params.table.lastRaiseAmount);
  };

  async checkTableCountForPlayer(params: any) {
    const result = await this.imdb.playerJoinedRecord({ playerId: params.data.playerId });
    if (result) {
      if ((result.length || 0) < (systemConfig.tableCountAllowed[params.data.deviceType] || 3)) {
        return {
          success: true,
          table: params.table,
          data: params.data
        };
      } else {
        for (let i = 0; i < result.length; i++) {
          if (result[i].channelId == params.table.channelId) {
            return {
              success: true,
              table: params.table,
              data: params.data
            };
          }
        }
        return {
          success: false,
          isRetry: false,
          isDisplay: true,
          channelId: (params.channelId || ""),
          info: popupTextManager.falseMessages.CHECKTABLECOUNTFORPLAYERFAIL_TABLEMANAGER
        };
      }
    } else {
      return {
        success: true,
        table: params.table,
        data: params.data
      };
    }
  };

  async isSameNetworkSit(params: any) {
    if (systemConfig.allowSameNetworkPlay || params.data.byPassIp) {
      return await this.checkTableCountForPlayer(params);
    }

    const result = await this.imdb.getPlayersDetailsByIPaddress(params.table.channelId, params.data.networkIp);
    if (result > 0) {
      return {
        success: false,
        isRetry: false,
        isDisplay: true,
        isSitIn: true,
        channelId: (params.channelId || ""),
        info: popupTextManager.falseMessages.ISSAMENETWORKSITFAIL_TABLEMANAGER
      };
    } else {
      if (_ld.findIndex(params.table.queueList, { networkIp: params.data.networkIp }) < 0) {
        return await this.checkTableCountForPlayer(params);
      } else {
        if (_ld.findIndex(params.table.queueList, { networkIp: params.data.networkIp, playerId: params.data.playerId }) < 0) {
          return {
            success: false,
            isRetry: false,
            isDisplay: true,
            channelId: (params.channelId || ""),
            info: popupTextManager.falseMessages.ISSAMENETWORKSITFAIL_TABLEMANAGER
          };
        } else {
          return await this.checkTableCountForPlayer(params);
        }
      }
    }
  };

  async setPlayerValueOnTable(params: any) {
    if (_ld.findIndex(params.table.players, { playerId: params.data.playerId }) >= 0) {
      if (_.keys(params.table.players[0]).indexOf(params.data.key) >= 0) {
        params.table.players[_ld.findIndex(params.table.players, { playerId: params.data.playerId })][params.data.key] = params.data.value;
        params.data.success = true;
        params.data.ritMessage = popupTextManager.falseMessages.RUNIT_TWICE_MESSAGE;
        await this.activity.runItTwice(params, stateOfX.profile.category.game, stateOfX.game.subCategory.runItTwice, stateOfX.logType.success);
        return {
          success: true,
          data: params.data,
          table: params.table
        };
      } else {
        return {
          success: false,
          isRetry: false,
          isDisplay: false,
          channelId: (params.channelId || ""),
          info: popupTextManager.falseMessages.SETPLAYERVALUEONTABLE_KEYNOTPRESENT_TABLEMANAGER
        };
      }
    } else {
      return {
        success: false,
        isRetry: false,
        isDisplay: true,
        channelId: (params.channelId || ""),
        info: popupTextManager.falseMessages.SETPLAYERVALUEONTABLE_PLAYERNOTSIT_TABLEMANAGER
      };
    }
  };

  indexBetweenSBandBB(params: any) {
    const totalIndexes = _.range(1, params.table.maxPlayers + 1);
    if (params.table.smallBlindSeatIndex === -1 || params.table.bigBlindSeatIndex === -1) {
      return [];
    }

    if (params.table.bigBlindSeatIndex > params.table.smallBlindSeatIndex) {
      return _.range(params.table.smallBlindSeatIndex + 1, params.table.bigBlindSeatIndex);
    } else {
      return _.difference(totalIndexes, _.range(params.table.bigBlindSeatIndex, params.table.smallBlindSeatIndex + 1));
    }
  };

  stateOfSBandBB(params: any) {
    const totalIndexes = _.range(1, params.table.maxPlayers + 1);

    if (params.table.smallBlindSeatIndex === -1 || params.table.bigBlindSeatIndex === -1) {
      return true;
    }

    const smallBlindPlayer = _.findWhere(params.table.players, { seatIndex: params.table.smallBlindSeatIndex });
    const bigBlindPlayer = _.findWhere(params.table.players, { seatIndex: params.table.bigBlindSeatIndex });

    if (!smallBlindPlayer) {
      return true;
    }
    if (!bigBlindPlayer) {
      return true;
    }

    const bigBlindState = bigBlindPlayer.state;
    const smallBlindState = smallBlindPlayer.state;

    return bigBlindState == stateOfX.playerState.onBreak || smallBlindState == stateOfX.playerState.onBreak;
  };

  createPlayer(params: any) {
    console.trace("inside createPlayer-------------------", params);
    const player = {
      playerId: params.playerId,
      sitAt: Number(new Date()),
      points: params.points,
      channelId: params.channelId,
      playerName: params.playerName || params.userName,
      networkIp: params.networkIp,
      deviceType: params.deviceType,
      active: false,
      chips: convertIntToDecimal(params.chips),
      chipsToBeAdded: 0,
      lastRealChipBonus: params.lastRealChipBonus || 0,
      lastRealChip: params.lastRealChip || 0,
      currentRCBstack: params.lastRealChipBonus || 0,
      totalRCB: params.totalRCB || 0,
      totalRC: params.totalRC || 0,
      seatIndex: params.seatIndex,
      imageAvtar: params.imageAvtar,
      cards: [],
      moves: [],
      preCheck: -1,
      bestHands: "",
      state: params.state || stateOfX.playerState.waiting,
      lastBet: 0,
      lastMove: null,
      totalRoundBet: 0,
      totalGameBet: 0,
      isMuckHand: false,
      lastRoundPlayed: "",
      preActiveIndex: -1,
      nextActiveIndex: -1,
      isDisconnected: false,
      bigBlindMissed: 0,
      roundMissed: 0,
      isAutoReBuy: false,
      isRunItTwice: params.isRunItTwiceApplied,
      autoReBuyAmount: 0,
      isPlayed: false,
      sitoutNextHand: false,
      sitoutNextBigBlind: false,
      autoSitout: false,
      sitoutGameMissed: 0,
      disconnectedMissed: 0,
      callTimeGameMissed: 0,
      hasPlayedOnceOnTable: false,
      isForceBlindEnable: false,
      isWaitingPlayer: true,
      isStraddleOpted: false,
      isJoinedOnce: false,
      isAutoReBuyEnabled: false,
      isAutoAddOnEnabled: false,
      isCurrentRoundPlayer: false,
      isActionBySystem: false,
      onGameStartBuyIn: convertIntToDecimal(params.chips),
      onSitBuyIn: convertIntToDecimal(params.chips) <= convertIntToDecimal(params.maxBuyIn) ? convertIntToDecimal(params.chips) : convertIntToDecimal(params.maxBuyIn),
      roundId: null,
      totalGames: 0,
      systemFoldedCount: 0,
      timeBankSec: systemConfig.timebank.initialSec,
      activityRecord: {
        seatReservedAt: !!params.state && params.state === stateOfX.playerState.reserved ? new Date() : null,
        lastMovePlayerAt: null,
        disconnectedAt: null,
        lastActivityAction: "",
        lastActivityTime: Number(new Date())
      },
      tournamentData: {
        userName: params.userName,
        isTournamentSitout: false,
        isTimeBankUsed: false,
        timeBankStartedAt: null,
        totalTimeBank: params.timeBankRuleData && params.timeBankRuleData[0] && params.timeBankRuleData[0].blindLevel == 1 ? params.timeBankRuleData[0].duration : 0,
        timeBankLeft: params.timeBankRuleData && params.timeBankRuleData[0] && params.timeBankRuleData[0].blindLevel == 1 ? params.timeBankRuleData[0].duration : 0,
        timeAddedAtBlindLevel: params.timeBankRuleData && params.timeBankRuleData[0] && params.timeBankRuleData[0].blindLevel == 1 ? params.timeBankRuleData[0].blindLevel : 0,
      },
      playerCallTimer: {
        playerId: null,
        timer: 0,
        status: false,
        createdAt: null,
        isCallTimeOver: false
      },
      isForceBlindVisible: false,
      autoBuyInFlag: false,
      bounty: (params.tournamentDetails && params.tournamentDetails.isBountyEnabled) ? params.tournamentDetails.bountyFees : 0
    };
    return player;
  };

  async findNewSB(params: any) {
    const dealerSeatIndex = params.table.dealerSeatIndex;
    let playerIndexOnTable;
    let player;
    const availableForSB: any[] = [];

    for (let i = 1; i <= params.table.maxPlayers; i++) {
      playerIndexOnTable = 0;
      player = _.where(params.table.players, { active: true, seatIndex: i });
      playerIndexOnTable = _ld.findIndex(params.table.players, { seatIndex: i });
      if (player.length > 0) {
        player = player[0];
        if (player.entryPlayer != true) {
          availableForSB.push(player);
        }
      }
    }

    params.data.smallBlindSet = false;
    let seatIndex = -1;

    if (availableForSB.length > 0) {
      for (let i = dealerSeatIndex + 1; i <= params.table.maxPlayers; i++) {
        playerIndexOnTable = 0;
        player = _.where(availableForSB, { seatIndex: i });
        playerIndexOnTable = _ld.findIndex(availableForSB, { seatIndex: i });
        if (player.length > 0) {
          params.data.smallBlindSet = true;
          params.data.smallBlindSeatIndex = i;
          seatIndex = i;
          break;
        }
      }

      if (!params.data.smallBlindSet) {
        for (var i = 1; i < dealerSeatIndex; i++) {
          playerIndexOnTable = 0;
          player = _.where(availableForSB, { seatIndex: i });
          playerIndexOnTable = _ld.findIndex(availableForSB, { seatIndex: i });
          if (player.length > 0) {
            params.data.smallBlindSet = true;
            params.data.smallBlindSeatIndex = i;
            seatIndex = i;
            break;
          }
        }
      }
      if (!params.data.smallBlindSet) {
        params.data.smallBlindSet = true;
        seatIndex = dealerSeatIndex;
        params.data.smallBlindSeatIndex = i;
      }
    } else {
      params.data.smallBlindSet = true;
      playerIndexOnTable = _ld.findIndex(params.table.players, { seatIndex: params.data.totalSeatIndexOccupied[0] });
      params.table.players[playerIndexOnTable].entryPlayer = false;
      params.data.smallBlindSeatIndex = dealerSeatIndex;
      seatIndex = dealerSeatIndex;
    }

    return {
      success: true,
      seatIndex: seatIndex
    };
  };

  async findNextBB(params: any) {
    const BBSeatIndex = params.table.bigBlindSeatIndex;
    let playerIndexOnTable;
    let player;
    const availableForBB: any[] = [];

    for (let i = 1; i <= params.table.maxPlayers; i++) {
      playerIndexOnTable = 0;
      player = _.where(params.table.players, { state: stateOfX.playerState.playing, seatIndex: i });
      playerIndexOnTable = _ld.findIndex(params.table.players, { seatIndex: i });
      if (player.length > 0) {
        player = player[0];
        availableForBB.push(player);
      }
    }

    params.data.nextBBSet = false;
    let seatIndex = -1;

    if (availableForBB.length > 0) {
      for (let i = BBSeatIndex + 1; i <= params.table.maxPlayers; i++) {
        playerIndexOnTable = 0;
        player = _.where(availableForBB, { seatIndex: i });
        playerIndexOnTable = _ld.findIndex(availableForBB, { seatIndex: i });
        if (player.length > 0) {
          params.data.nextBBSet = true;
          seatIndex = i;
          break;
        }
      }

      if (!params.data.nextBBSet) {
        for (let i = 1; i < BBSeatIndex; i++) {
          playerIndexOnTable = 0;
          player = _.where(availableForBB, { seatIndex: i });
          playerIndexOnTable = _ld.findIndex(availableForBB, { seatIndex: i });
          if (player.length > 0) {
            params.data.nextBBSet = true;
            seatIndex = i;
            break;
          }
        }
      }

      return {
        success: true,
        seatIndex: seatIndex
      };
    }
    return {
      success: false
    };
  };

  findNewBB(params: any) {
    const smallBlindSeatIndex = params.table.smallBlindSeatIndex;
    let playerIndexOnTable;
    let player;
    const availableForBB: any[] = [];

    for (let i = 1; i <= params.table.maxPlayers; i++) {
      playerIndexOnTable = 0;
      player = _.where(params.table.players, { active: true, seatIndex: i });
      playerIndexOnTable = _ld.findIndex(params.table.players, { seatIndex: i });
      if (player.length > 0) {
        player = player[0];
        availableForBB.push(player);
      }
    }

    params.data.BBSet = false;
    let seatIndex = -1;

    if (availableForBB.length > 0) {
      for (let i = smallBlindSeatIndex + 1; i <= params.table.maxPlayers; i++) {
        playerIndexOnTable = 0;
        player = _.where(availableForBB, { seatIndex: i });
        playerIndexOnTable = _ld.findIndex(availableForBB, { seatIndex: i });
        if (player.length > 0) {
          params.data.BBSet = true;
          seatIndex = i;
          break;
        }
      }

      if (!params.data.BBSet) {
        for (let i = 1; i < smallBlindSeatIndex; i++) {
          playerIndexOnTable = 0;
          player = _.where(availableForBB, { seatIndex: i });
          playerIndexOnTable = _ld.findIndex(availableForBB, { seatIndex: i });
          if (player.length > 0) {
            params.data.BBSet = true;
            seatIndex = i;
            break;
          }
        }
      }

      return {
        success: true,
        seatIndex: seatIndex
      };
    }
    return {
      success: false
    };
  };

  findNewDealer(params: any) {
    const prevDealerseatIndex = params.table.prevDealerseatIndex;
    let playerIndexOnTable;
    let player;
    const availableForDealer: any[] = [];
    console.log('findNewDealer', params.table.players);

    for (let i = 1; i <= params.table.maxPlayers; i++) {
      playerIndexOnTable = 0;
      player = _.filter(params.table.players, (plr: any) => {

        return (plr.state == stateOfX.playerState.playing || (plr.state == stateOfX.playerState.onBreak && (params.table.isCTEnabledTable && plr.playerScore > 0
          && (
            (plr.playerCallTimer.status === false && plr.callTimeGameMissed <= params.table.ctEnabledBufferHand)
            || (plr.playerCallTimer.status === true
              && !(plr.playerCallTimer.isCallTimeOver)
            )
          )
        ))) && plr.seatIndex == i;
      });

      playerIndexOnTable = _ld.findIndex(params.table.players, { seatIndex: i });
      if (player.length > 0) {
        player = player[0];
        if (player.entryPlayer != true) {
          availableForDealer.push(player);
        }
      }
    }

    params.data.delaerFound = false;
    let seatIndex = -1;

    if (availableForDealer.length > 0) {
      for (let i = prevDealerseatIndex + 1; i <= params.table.maxPlayers; i++) {
        playerIndexOnTable = 0;
        player = _.where(availableForDealer, { seatIndex: i });
        playerIndexOnTable = _ld.findIndex(availableForDealer, { seatIndex: i });
        if (player.length > 0) {
          params.data.delaerFound = true;
          params.data.currentDealerSeatIndex = i;
          seatIndex = i;
          break;
        }
      }

      if (!params.data.delaerFound) {
        for (var i = 1; i < prevDealerseatIndex; i++) {
          playerIndexOnTable = 0;
          player = _.where(availableForDealer, { seatIndex: i });
          playerIndexOnTable = _ld.findIndex(availableForDealer, { seatIndex: i });
          if (player.length > 0) {
            params.data.delaerFound = true;
            params.data.currentDealerSeatIndex = i;
            seatIndex = i;
            break;
          }
        }
      }
      if (!params.data.delaerFound) {
        params.data.delaerFound = true;
        seatIndex = prevDealerseatIndex;
        params.data.currentDealerSeatIndex = i;
      }
    } else {
      params.data.delaerFound = true;
      playerIndexOnTable = _ld.findIndex(params.table.players, { seatIndex: params.data.totalSeatIndexOccupied[0] });
      params.table.players[playerIndexOnTable].entryPlayer = false;
      params.data.currentDealerSeatIndex = params.data.totalSeatIndexOccupied[0];
      seatIndex = params.data.totalSeatIndexOccupied[0];
    }

    return {
      success: true,
      seatIndex: seatIndex
    };
  };

  async nextActiveSeatIndex(params: any) {
    const totalPlayingPlayers = _.filter(params.table.players, (player: any) => {
      return (player.state == stateOfX.playerState.playing) || (player.state == stateOfX.playerState.onBreak && (params.table.isCTEnabledTable && player.playerScore > 0
        && (
          (player.playerCallTimer.status === false && player.callTimeGameMissed <= params.table.ctEnabledBufferHand)
          || (player.playerCallTimer.status === true
            && !(player.playerCallTimer.isCallTimeOver)
          )
        )
      ));
    });

    const totalSeatOccupied = _.pluck(totalPlayingPlayers, 'seatIndex').sort((a: any, b: any) => a - b);
    const indexOfSeatIndexInOccupied = totalSeatOccupied.indexOf(params.seatIndex);
    const nextActivePlayerSeatIndex = totalSeatOccupied[this.getNextSuitableIndex(indexOfSeatIndexInOccupied, totalSeatOccupied.length)];
    let seatIndexFound = false;

    if (indexOfSeatIndexInOccupied >= 0) {
      if (nextActivePlayerSeatIndex >= 0) {
        return {
          success: true,
          seatIndex: nextActivePlayerSeatIndex
        };
      } else {
        return {
          success: false,
          isRetry: false,
          isDisplay: false,
          channelId: (params.channelId || ""),
          info: popupTextManager.falseMessages.NEXTACTIVESEATINDEXFAIL_TABLEMANAGER
        };
      }
    } else {
      for (let i = 0; i < totalSeatOccupied.length; i++) {
        if (!seatIndexFound && totalSeatOccupied[i] > params.seatIndex) {
          seatIndexFound = true;
          params.data.currentDealerSeatIndex = totalSeatOccupied[i];
          return {
            success: true,
            seatIndex: totalSeatOccupied[i]
          };
        }
      }

      if (!seatIndexFound) {
        for (let i = 0; i < totalSeatOccupied.length; i++) {
          if (!seatIndexFound && totalSeatOccupied[i] < params.seatIndex) {
            seatIndexFound = true;
            params.data.currentDealerSeatIndex = totalSeatOccupied[i];
            return {
              success: true,
              seatIndex: totalSeatOccupied[i]
            };
          }
        }
      }
    }
    return {
      success: false
    };
  };

  async nextConsiderSeatIndex(params: any) {
    const totalPlayingPlayers = _.where(params.table.players, { state: stateOfX.playerState.playing });
    const totalWaitingPlayers = _.where(params.table.players, { state: stateOfX.playerState.waiting });
    const totalSeatOccupied = _.pluck(totalPlayingPlayers.concat(totalWaitingPlayers), 'seatIndex').sort((a: any, b: any) => a - b);
    const indexOfSeatIndexInOccupied = totalSeatOccupied.indexOf(params.seatIndex);
    const nextActivePlayerSeatIndex = totalSeatOccupied[this.getNextSuitableIndex(indexOfSeatIndexInOccupied, totalSeatOccupied.length)];

    if (nextActivePlayerSeatIndex >= 0) {
      return {
        success: true,
        seatIndex: nextActivePlayerSeatIndex
      };
    } else {
      return {
        success: false,
        isRetry: false,
        isDisplay: false,
        channelId: (params.channelId || ""),
        info: popupTextManager.falseMessages.NEXTCONSIDERSEATINDEXFAIL_TABLEMANAGER
      };
    }
  };

  async insertHandHistory(params: any, eventObj: any) {
    const time = new Date().getTime();
    console.log('Finding Hand History eventObj', eventObj);

    try {
      const result = await this.db.insertHandHistory(params.channelId, params.table.roundId, params.table.roundCount, params.table.gameStartTime, time, eventObj);
      console.log('Finding Hand Tab', result.ops[0].channelId, result.ops[0].roundId, result.ops[0]._id.toString(), params.table.videoLogId);

      const response = await this.db.updateHandTab(result.ops[0].channelId, result.ops[0].roundId, {
        handHistoryId: result.ops[0]._id.toString(),
        videoId: params.table.videoLogId.toString(),
        active: true
      });

      params.table.handHistory = [];
      params.table.videoLogId = null;
      return response;
    } catch (err) {
      throw err;
    }
  };

  async nextExpectedBBseatIndex(params: any) {
    const expectedSBIndex = params.table.nextSmallBlindSeatIndex;
    const thisSmallBlindIndex = _ld.findIndex(params.table.players, { seatIndex: expectedSBIndex });

    params.seatIndex = expectedSBIndex;
    const nextConsiderSeatIndexResponse = await this.nextConsiderSeatIndex(params);
    if (nextConsiderSeatIndexResponse.success) {
      return {
        success: true,
        bigBlindSeatIndex: nextConsiderSeatIndexResponse.seatIndex
      };
    } else {
      return nextConsiderSeatIndexResponse;
    }
  };

  async removeWaitingPlayer(params: any) {
    if (params.data.playerId) {
      if (_ld.findIndex(params.table.queueList, { playerId: params.data.playerId }) >= 0) {
        params.data.success = true;
        params.data.info = params.data.playerName + ", you have been removed from waiting list successfully!";
        if (_ld.findIndex(params.table.players, { playerId: params.data.playerId }) < 0) {
          params.table.queueList.splice(_ld.findIndex(params.table.queueList, { playerId: params.data.playerId }), 1);
          return {
            success: true,
            data: params.data,
            table: params.table
          };
        } else {
          params.table.queueList.splice(_ld.findIndex(params.table.queueList, { playerId: params.data.playerId }), 1);
          return {
            success: true,
            channelId: params.channelId,
            table: params.table,
            info: "Player is already playing the game, removed from waiting list.",
            isRetry: false,
            isDisplay: false
          };
        }
      } else {
        params.data.success = false;
        return {
          success: false,
          isRetry: false,
          isDisplay: true,
          channelId: (params.channelId || ""),
          info: popupTextManager.falseMessages.REMOVEWAITINGPLAYERINDEX_NOTINWAITINGLIST_TABLEMANAGER
        };
      }
    } else {
      params.data.success = false;
      return {
        success: false,
        isRetry: false,
        isDisplay: false,
        channelId: (params.channelId || ""),
        info: popupTextManager.falseMessages.REMOVEWAITINGPLAYERFAIL_TABLEMANAGER
      };
    }
  };

  getPreviousOccupiedSeatIndex(params: any) {
    if (parseInt(params.seatIndex) < 1 || parseInt(params.seatIndex) > parseInt(params.table.maxPlayers)) {
      return -1;
    }

    const totalSeatOccupied = _.pluck(params.table.players, 'seatIndex').sort(function (a: any, b: any) { return a - b });
    const indexOfRequestedSeat = totalSeatOccupied.indexOf(parseInt(params.seatIndex));
    if (indexOfRequestedSeat >= 0) {
      if (indexOfRequestedSeat === 0) {
        return totalSeatOccupied[totalSeatOccupied.length - 1];
      } else {
        return totalSeatOccupied[indexOfRequestedSeat - 1];
      }
    } else {
      return -1;
    }
  };

  getNextActivePlayerBySeatIndex(params: any) {
    if (parseInt(params.seatIndex) < 1 || parseInt(params.seatIndex) > parseInt(params.table.maxPlayers)) {
      return -1;
    }

    const totalSeatOccupied = _.pluck(_.filter(params.table.players, (player: any) => {
      return (player.state == stateOfX.playerState.playing) || (player.state == stateOfX.playerState.onBreak && (params.table.isCTEnabledTable && player.playerScore > 0
        && (
          (player.playerCallTimer.status === false && player.callTimeGameMissed <= params.table.ctEnabledBufferHand)
          || (player.playerCallTimer.status === true
            && !(player.playerCallTimer.isCallTimeOver)
          )
        )
      ));
    }), 'seatIndex').sort(function (a: any, b: any) { return a - b });

    const indexOfRequestedSeat = totalSeatOccupied.indexOf(parseInt(params.seatIndex));

    let nextIndexWithHigherSeat = -1;

    let i = totalSeatOccupied.length;
    while (totalSeatOccupied[--i] > parseInt(params.seatIndex));
    nextIndexWithHigherSeat = ++i;

    nextIndexWithHigherSeat = !!nextIndexWithHigherSeat ? nextIndexWithHigherSeat : 0;
    nextIndexWithHigherSeat = !!nextIndexWithHigherSeat && nextIndexWithHigherSeat < totalSeatOccupied.length ? nextIndexWithHigherSeat : 0;
    return totalSeatOccupied[nextIndexWithHigherSeat];
  };

  async getBestHand(params: any) {
    params.table.bestHands = [];
    let bestHandForPlayer = null;

    await async.each(params.table.players, async (player: any) => {
      if (params.table.onStartPlayers.includes(player.playerId) && (player.state == stateOfX.playerState.playing || player.state == stateOfX.playerState.disconnected || player.state == stateOfX.playerState.onBreak)) {
        bestHandForPlayer = winnerMgmt.findCardsConfiguration({
          boardCards: params.table.boardCard[0],
          playerCards: [{ playerId: player.playerId, cards: player.cards }]
        }, params.table.channelVariation);

        let bestHandText = "";

        if (!!bestHandForPlayer && params.table.channelVariation !== stateOfX.channelVariation.omahahilo) {
          bestHandText = bestHandForPlayer[0].text;
        } else {
          if (!!bestHandForPlayer && bestHandForPlayer[0].winnerHigh.length > 0) {
            bestHandText += " " + bestHandForPlayer[0].winnerHigh[0].text;
          }
          if (!!bestHandForPlayer && bestHandForPlayer[0].winnerLo.length > 0) {
            bestHandText += "\n " + _.pluck(bestHandForPlayer[0].winnerLo[0].set, 'name');
          }
        }

        params.table.bestHands.push({
          playerId: player.playerId,
          bestHand: bestHandText
        });

        player.bestHands = bestHandText;
      }
    });

    return {
      success: true,
      params: params
    };
  };

  async validateEntities(params: any) {
    if (!systemConfig.validateGameToPreventLock) {
      return params;
    }

    if (params.table.currentMoveIndex === -1 && params.table.currentMoveIndex < (params.table.players.length - 1)) {
      return {
        success: false,
        isRetry: false,
        isDisplay: false,
        channelId: (params.channelId || ""),
        info: popupTextManager.falseMessages.VALIDATEENTITIES_CURRENTPLAYERSETFAIL_TABLEMANAGER
      };
    }

    if (params.table.firstActiveIndex === -1 && params.table.firstActiveIndex < (params.table.players.length - 1)) {
      return {
        success: false,
        isRetry: false,
        isDisplay: false,
        channelId: (params.channelId || ""),
        info: popupTextManager.falseMessages.VALIDATEENTITIES_NEXTPLAYERSETFAIL_TABLEMANAGER
      };
    }

    if (params.table.bigBlindIndex === -1 && params.table.bigBlindIndex < (params.table.players.length - 1)) {
      return {
        success: false,
        isRetry: false,
        isDisplay: false,
        channelId: (params.channelId || ""),
        info: popupTextManager.falseMessages.VALIDATEENTITIES_BIGBLINDPLAYERSETFAIL_TABLEMANAGER
      };
    }

    if (params.table.players[params.table.currentMoveIndex].nextActiveIndex === -1) {
      return {
        success: false,
        isRetry: false,
        isDisplay: false,
        channelId: (params.channelId || ""),
        info: popupTextManager.falseMessages.VALIDATEENTITIES_NEXTACTIVEINDEXFAIL_TABLEMANAGER
      };
    }

    return params;
  };

  async changeDisconnPlayerState(params: any) {
    const playerIndexOnTable = _ld.findIndex(params.table.players, { playerId: params.data.playerId });
    let previousState = '';
    params.data.previousState = null;
    params.data.currentState = null;
    params.data.isJoinedOnce = false;
    let isPartOfGame = false;
    let tableState = '';

    if (playerIndexOnTable < 0) {
      return {
        success: true,
        data: params.data,
        table: params.table,
        isRetry: false,
        isDisplay: false,
        channelId: (params.channelId || ""),
        info: popupTextManager.falseMessages.CHANGEDISCONNPLAYERSTATE_PLAYERNOTINTABLE_TABLEMANAGER
      };
    }


    const player = params.table.players[playerIndexOnTable];
    isPartOfGame = params.table.onStartPlayers[playerIndexOnTable];
    tableState = params.table.state;
    previousState = player.previousState;
    player.deviceType = params.data.deviceType;

    params.data.isJoinedOnce = player.isJoinedOnce;
    player.isJoinedOnce = true;
    console.log('changeDisconnPlayerState 0', previousState, player.previousState, player.currentState, isPartOfGame, params.table.state);

    if (player.state !== stateOfX.playerState.disconnected) {
      await this.imdb.updateTableSetting({ channelId: params.channelId, playerId: params.data.playerId }, { $set: { status: "Playing" } });
      return {
        success: true,
        table: params.table,
        data: params.data,
        isRetry: false,
        isDisplay: false,
        channelId: (params.channelId || ""),
        info: popupTextManager.falseMessages.CHANGEDISSCONNPLAYERSTATE_PLAYERNOTDISCONNECTED_TABLEMANAGER
      };
    }

    if (!!isPartOfGame && params.table.state == stateOfX.startGameEventOnChannel.running) {
      await this.imdb.updateTableSetting({ channelId: params.channelId, playerId: params.data.playerId }, { $set: { status: "Playing" } });
      console.log("I am in table running ", params.data.previousState);
      params.data.previousState = params.table.players[playerIndexOnTable].state;

      if (player.isWaitingPlayer) {
        if (params.table.players[playerIndexOnTable].previousState === stateOfX.playerState.reserved) {
          params.table.players[playerIndexOnTable].state = stateOfX.playerState.reserved;
        } else {
          params.table.players[playerIndexOnTable].state = stateOfX.playerState.waiting;
        }
      } else {
        if (params.table.players[playerIndexOnTable].state == stateOfX.playerState.disconnected && (player.active || player.lastMove !== 'FOLD') && (previousState !== stateOfX.playerState.onBreak)) {
          params.table.players[playerIndexOnTable].state = stateOfX.playerState.playing;
        } else if (previousState === stateOfX.playerState.onBreak) {
          params.table.players[playerIndexOnTable].state = stateOfX.playerState.onBreak;
        } else {
          params.table.players[playerIndexOnTable].state = stateOfX.playerState.playing;
        }
      }
      params.data.currentState = params.table.players[playerIndexOnTable].state;
    } else if (!isPartOfGame && params.table.state == stateOfX.startGameEventOnChannel.idle) {
      console.log("I am in the room but table is not running");
      params.data.previousState = params.table.players[playerIndexOnTable].state;

      if (params.table.players[playerIndexOnTable].previousState == stateOfX.playerState.waiting) {
        params.table.players[playerIndexOnTable].state = stateOfX.playerState.waiting;
        await this.imdb.updateTableSetting({ channelId: params.channelId, playerId: params.data.playerId }, { $set: { status: "Playing" } });
        console.log("PLayer removed inside tableManager222222");
      } else {
        params.table.players[playerIndexOnTable].state = stateOfX.playerState.onBreak;
      }
      params.data.currentState = params.table.players[playerIndexOnTable].state;
      await this.imdb.updateTableSetting({ channelId: params.channelId, playerId: params.playerId }, { $set: { status: "Playing" } });
      console.log("PLayer removed inside tableManager333333");
    } else {
      console.log("I am at else");
      const newChannel = pomelo.app.get('channelService').getChannel(params.channelId, false);
      console.log("????newChannel is", newChannel);

      params.data.previousState = params.table.players[playerIndexOnTable].state;

      if (params.table.players[playerIndexOnTable].previousState == stateOfX.playerState.waiting) {
        console.log("IFFF params.table.players[playerIndexOnTable].previousState", params.table.players[playerIndexOnTable]);
        params.table.players[playerIndexOnTable].state = stateOfX.playerState.waiting;
      } else if (params.table.players[playerIndexOnTable].previousState == stateOfX.playerState.outOfMoney && params.table.players[playerIndexOnTable].chips > 0) {
        console.log("else IFFFF params.table.players[playerIndexOnTable].previousState", params.table.players[playerIndexOnTable]);
        params.table.players[playerIndexOnTable].state = stateOfX.playerState.playing;
      } else {
        if (!!newChannel && (!!newChannel.evChopTimer || !!newChannel.evRITTimer)) {
          params.table.players[playerIndexOnTable].state = stateOfX.playerState.playing;
        } else {
          console.log("last ELSE I am at else", params.table.players[playerIndexOnTable]);
          params.table.players[playerIndexOnTable].state = stateOfX.playerState.onBreak;
        }
      }
      params.data.currentState = params.table.players[playerIndexOnTable].state;
      await this.imdb.updateTableSetting({ channelId: params.channelId, playerId: params.data.playerId }, { $set: { status: "Playing" } });
      console.log("inside table manager spectating player removed");
    }

    params.data.success = true;
    return {
      success: true,
      data: params.data,
      table: params.table,
      isRetry: false,
      isDisplay: false,
      channelId: (params.channelId || ""),
      info: popupTextManager.falseMessages.CHANGEDISSCONNPLAYERSTATE_PLAYERINDISCONNECTEDSTATE_CURRENTGAME_TABLEMANAGER
    };
  };

  async setTimeBankDetails(params: any) {
    console.log('in tableManager in setTimeBankDetails params are', params);
    const playerIndexOnTable = _ld.findIndex(params.table.players, { playerId: params.data.playerId });
    if (playerIndexOnTable < 0) {
      return {
        success: false,
        isRetry: false,
        data: params.data,
        table: params.table,
        isDisplay: false,
        channelId: (params.channelId || ""),
        info: popupTextManager.falseMessages.SETTIMEBANKDETAILSFAIL_TABLEMANAGER
      };
    }

    console.log("i was called in saveTImeBank", params.table.channelType, params.table.players[playerIndexOnTable]);
    if (params.table.channelType !== stateOfX.gameType.tournament) {
      params.table.players[playerIndexOnTable].isTimeBankUsed = true;
      params.table.players[playerIndexOnTable].timeBankStartedAt = Number(new Date());
    } else {
      params.table.players[playerIndexOnTable].tournamentData.isTimeBankUsed = true;
      params.table.players[playerIndexOnTable].tournamentData.timeBankStartedAt = Number(new Date());
    }

    params.table.timeBankStartedAt = Number(new Date());
    return {
      success: true,
      data: params.data,
      table: params.table,
      isRetry: false,
      isDisplay: false,
      channelId: (params.channelId || ""),
      info: popupTextManager.falseMessages.SETTIMEBANKDETAILSTRUE_TABLEMANAGER
    };
  };

  async handleDisconnection(params: any) {
    const playerIndex = _ld.findIndex(params.table.players, { playerId: params.data.playerId });
    if (playerIndex < 0) {
      return {
        success: false,
        data: params.data,
        table: params.table,
        channelId: (params.channelId || ""),
        info: "Player is not sitting."
      };
    } else {
      if (params.table.state === stateOfX.gameState.running) {
        if (params.table.players[playerIndex].state === stateOfX.playerState.waiting) {
          params.table.players[playerIndex].state = stateOfX.playerState.onBreak;
        }
        if (params.table.players[playerIndex].state === stateOfX.playerState.playing) {
          params.table.players[playerIndex].state = stateOfX.playerState.disconnected;
        }
      } else {
        params.table.players[playerIndex].state = stateOfX.playerState.onBreak;
      }
      params.data.success = true;
      params.data.state = params.table.players[playerIndex].state;
      return {
        success: true,
        data: params.data,
        table: params.table,
        channelId: (params.channelId || "")
      };
    }
  };

  async updateTournamentRules(params: any) {
    for (let i = 0; i < params.table.tournamentRules.ranks.length; i++) {
      if (params.data.playerId === params.table.tournamentRules.ranks[i].playerId) {
        params.table.tournamentRules.ranks[i].isPrizeBroadcastSent = true;
        break;
      }
    }
    return {
      success: true,
      data: {},
      table: params.table,
      isRetry: false,
      isDisplay: false,
      channelId: params.data.channelId || " ",
      info: popupTextManager.falseMessages.UPDATETOURNAMENTRULESTRUE_TABLEMANAGER
    };
  };

  differenceByPlayerId(array1: any[], array2: any[]) {
    const res: any[] = [];
    for (let i = 0; i < array1.length; i++) {
      for (let j = 0; j < array2.length; j++) {
        if (array1[i].playerId != array2[j].playerId) {
          res.push(array2[j]);
        }
      }
    }
    return res;
  };

  async leaveTournamentPlayer(params: any) {
    const player = _.where(params.table.players, { playerId: params.data.playerId });

    if (!!player && !!player[0] && player[0].chips <= 0) {
      params.table.players = this.differenceByPlayerId(params.table.players, [player[0]]);

      const query = {
        playerId: player[0].playerId,
        tournamentId: params.table.tournamentRules.tournamentId,
        status: "Registered"
      };

      const updatedTournamentUser = await this.db.updateTournamentUser(query, { isActive: false, status: "PLAYED" });

      if (!!updatedTournamentUser) {
        return {
          success: true,
          isRetry: false,
          data: {},
          table: params.table,
          channelId: params.data.channelId || " "
        };
      } else {
        return {
          success: false,
          isRetry: false,
          data: {},
          table: params.table,
          channelId: params.data.channelId || " ",
          info: "something went wrong try after some time"
        };
      }
    } else {
      return {
        success: false,
        isRetry: false,
        data: {},
        table: params.table,
        channelId: params.data.channelId || " ",
        info: "player have enough points to play no leave option available"
      };
    }
  };

  activePlayersForWinner(params: any) {
    const activePlayers: any[] = [];

    for (let i = 0; i < params.table.players.length; i++) {
      if (params.table.onStartPlayers.indexOf(params.table.players[i].playerId) >= 0) {
        activePlayers.push(params.table.players[i]);
      }
    }
    const foldedPlayers = _.where(params.table.players, { lastMove: stateOfX.move.fold });
    const remainingPlayers = _.difference(activePlayers, foldedPlayers);
    return remainingPlayers;
  };



  async rejectIfPassword(params: any) {
    if (!params.table.isPrivate) {
      return false;
    }

    const result = await this.imdb.isPlayerJoined({ channelId: params.channelId, playerId: params.data.playerId });
    if (result >= 1) {
      return false;
    } else {
      return params.table.password !== params.data.password;
    }
  }


}
