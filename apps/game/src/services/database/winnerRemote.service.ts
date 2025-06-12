import { Injectable } from "@nestjs/common";
import _ld from "lodash";
import _ from "underscore";
import { TableManagerService } from "./tableManager.service";
import { UtilsService } from "../../utils/utils.service";
import stateOfX from "shared/common/stateOfX.sevice";





@Injectable()
export class WinnerRemoteService {


    constructor(
        private readonly tableManager:TableManagerService,
        private readonly utilsService:UtilsService
    ) {}


    ///////////////////////////////////////////////////////////////////////
// <<<<<<<< AWARD WINNING CHIPS TO WINNER PLAYERS START >>>>>>>>>>>> //
///////////////////////////////////////////////////////////////////////

async addChipsIfRakeNotDeducted(params: any): Promise<any> {
	if (params.data.evChopDetails) {
		for (const player of params.data.evChopDetails) {
			if (player.evChop) {
				const playerIndex = _ld.findIndex(params.table.players, { playerId: player.playerId });
				params.table.players[playerIndex].chips = this.utilsService.convertIntToDecimal(
					params.table.players[playerIndex].chips + player.evAmount + player.refundAmount
				);
				player.profit = this.utilsService.convertIntToDecimal(player.evAmount);
				player.selfProfit = this.utilsService.convertIntToDecimal(player.evAmount - player.selfAmount);
			}
		}
	}

	for (const winner of params.data.winners) {
		const playerIndex = _ld.findIndex(params.table.players, { playerId: winner.playerId });

		if (playerIndex >= 0) {
			if (params.data.evChopDetails) {
				const foundIndex = params.data.evChopDetails.findIndex(
					x => x.playerId === winner.playerId && x.evChop
				);
				const winAmount = winner.winningAmount ?? winner.amount;

				if (foundIndex >= 0) {
					params.data.evChopDetails[foundIndex].profit =
						params.data.evChopDetails[foundIndex].evAmount - this.utilsService.convertIntToDecimal(winAmount);
					winner.chips = params.table.players[playerIndex].chips;
					winner.winningAmount = params.data.evChopDetails[foundIndex].evAmount;
				} else {
					params.table.players[playerIndex].chips = this.utilsService.convertIntToDecimal(
						params.table.players[playerIndex].chips + this.utilsService.convertIntToDecimal(winAmount)
					);
					winner.chips = params.table.players[playerIndex].chips;
					winner.winningAmount = winner.winningAmount ?? winner.amount;
				}
			} else {
				params.table.players[playerIndex].chips = this.utilsService.convertIntToDecimal(params.table.players[playerIndex].chips) +
					this.utilsService.convertIntToDecimal(winner.amount);
				winner.chips = params.table.players[playerIndex].chips;
				winner.winningAmount = winner.winningAmount ?? winner.amount;
			}
		} else {
			// player not found, skip adding chips
		}
	}

	return params;
};


// tournament
async awardWinningChipsForTournamentHoldem(params: any): Promise<any> {
	const res = await this.addChipsIfRakeNotDeducted(params);
	return res;
};


// tournament
async awardWinningChipsForTournamentOmahaHiLo(params: any): Promise<any> {
	const res = await this.addChipsIfRakeNotDeducted(params);
	return res;
};


// add winning chips for player if rake deducted
async addChipsIfRakeDeducted(params: any): Promise<any> {
  if (params.data.evChopDetails) {
    for (let player of params.data.evChopDetails) {
      if (player.evChop) {
        const playerIndex = _ld.findIndex(params.table.players, { playerId: player.playerId });
        params.table.players[playerIndex].chips = this.utilsService.convertIntToDecimal(
          params.table.players[playerIndex].chips + player.evAmount + player.refundAmount
        );
        player.profit = this.utilsService.convertIntToDecimal(player.evAmount);
        player.selfProfit = this.utilsService.convertIntToDecimal(player.evAmount - player.selfAmount);
      }
    }
  }

  for (const winnerId of Object.keys(params.rakeDetails.playerWins)) {
    const playerIndex = _ld.findIndex(params.table.players, { playerId: winnerId });
    if (playerIndex >= 0) {
      if (params.data.evChopDetails) {
        const foundIndex = params.data.evChopDetails.findIndex(
          x => x.playerId === winnerId && x.evChop
        );
        if (foundIndex >= 0) {
          params.data.evChopDetails[foundIndex].profit = this.utilsService.convertIntToDecimal(
            params.data.evChopDetails[foundIndex].evAmount - params.rakeDetails.playerWins[winnerId]
          );
        } else {
          params.table.players[playerIndex].chips = this.utilsService.convertIntToDecimal(
            params.table.players[playerIndex].chips + params.rakeDetails.playerWins[winnerId]
          );
        }
      } else {
        params.table.players[playerIndex].chips = this.utilsService.convertIntToDecimal(
          params.table.players[playerIndex].chips + params.rakeDetails.playerWins[winnerId]
        );
      }

      const isRefundPlayer = _.where(params.data.decisionParams, { isRefund: true });
      params.data.rewardDistributed = true;
    }
  }

  return params;
};


// add winning chips for holdem and omaha
async awardWinningChipsHoldemAndOmaha(params: any): Promise<any> {
  if (Object.keys(params.rakeDetails.playerWins).length > 0) {
    // Rake has been deducted in this game
    return await this.addChipsIfRakeDeducted(params);
  } else {
    // Rake has not been deducted in this game
    return await this.addChipsIfRakeNotDeducted(params);
  }
};


// add winning chips for omaha-hi-lo only
async awardWinningChipsOmahaHiLo(params: any): Promise<any> {
  if (Object.keys(params.rakeDetails.playerWins).length > 0) {
    // Rake has been deducted in this game
    return await this.addChipsIfRakeDeducted(params);
  } else {
    // Rake has not been deducted in this game
    return await this.addChipsIfRakeNotDeducted(params);
  }
};


// add winning chips to players
// all variations and players
async awardWinningChips(params: any): Promise<any> {
  if (params.table.channelType === stateOfX.gameType.tournament) {
    if (params.table.channelVariation !== stateOfX.channelVariation.omahahilo) {
      return await this.awardWinningChipsForTournamentHoldem(params);
    } else {
      return await this.awardWinningChipsForTournamentOmahaHiLo(params);
    }
  } else {
    if (params.table.channelVariation !== stateOfX.channelVariation.omahahilo) {
      return await this.awardWinningChipsHoldemAndOmaha(params);
    } else {
      return await this.awardWinningChipsOmahaHiLo(params);
    }
  }
};


//////////////////////////////////////////////////////////////////////
// <<<<<<<< AWARD WINNING CHIPS TO WINNER PLAYERS ENDS >>>>>>>>>>>> //
//////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////
// <<<<<<<< GET SINGLE WINNER PLAYER START >>>>>>>>>>>> //
//////////////////////////////////////////////////////////

async getSingleWinner(params: any): Promise<any> {
  const playingPlayers = [];
  for (let i = 0; i < params.table.players.length; i++) {
    if (
      params.table.onStartPlayers.indexOf(params.table.players[i].playerId) >= 0 &&
      params.table.players[i].roundId === params.table.roundId
    ) {
      playingPlayers.push(params.table.players[i]);
    }
  }

  const tournamentSitoutPlayers = this.tableManager.getTournamentSitoutPlayers(params.table);
  const disconnectedPlayers = _.where(params.table.players, { state: stateOfX.playerState.disconnected });
  const disconnActivePlayers = _.where(disconnectedPlayers, { lastRoundPlayed: stateOfX.round.river });
  const activePlayers = _.where(playingPlayers, { active: true });
  const inactiveAllInPlayer = _.where(playingPlayers, {
    active: false,
    lastMove: stateOfX.move.allin,
  });
  const foldedPlayers = _.where(playingPlayers, { lastMove: stateOfX.move.fold });

  let winnerPlayerId: string | null = null;

  if (playingPlayers.length - foldedPlayers.length <= 1) {
    params.data.isSingleWinner = true;
    params.data.endingType =
      playingPlayers.length === 1
        ? stateOfX.endingType.onlyOnePlayerLeft
        : stateOfX.endingType.everybodyPacked;
  }

  if (params.data.isSingleWinner) {
    if (!winnerPlayerId && activePlayers.length > 0) {
      for (let i = 0; i < activePlayers.length; i++) {
        if (activePlayers[i].lastMove !== stateOfX.move.fold) {
          winnerPlayerId = activePlayers[i].playerId;
          break;
        }
      }
    }

    if (!winnerPlayerId && inactiveAllInPlayer.length > 0) {
      winnerPlayerId = inactiveAllInPlayer[0].playerId;
    }

    if (!winnerPlayerId && disconnectedPlayers.length === 1) {
      winnerPlayerId = disconnectedPlayers[0].playerId;
    }

    if (!winnerPlayerId && disconnectedPlayers.length >= 1) {
      winnerPlayerId = disconnectedPlayers[0].playerId;
    }

    if (!winnerPlayerId) {
      throw {
        success: false,
        channelId: params.channelId,
        isRetry: false,
        isDisplay: false,
        info: "Unable to perform game over, unable to decide!",
      };
    }

    for (let i = 0; i < params.table.pot.length; i++) {
      params.data.winnerPlayerId = winnerPlayerId;
      params.data.winners.push({
        playerId: winnerPlayerId,
        set: [],
        type: stateOfX.dealerChatReason[stateOfX.endingType.everybodyPacked],
        typeName: stateOfX.dealerChatReason[stateOfX.endingType.everybodyPacked],
        amount: 0,
        potIndex: i.toString(),
        cardsToShow: null,
        isRefund: false,
      });
    }

    return params;
  } else {
    return params;
  }
};


/////////////////////////////////////////////////////////
// <<<<<<<< GET SINGLE WINNER PLAYER ENDS >>>>>>>>>>>> //
/////////////////////////////////////////////////////////

// create winners response object
// that will render animation at client
// if rake deducted
assignAmountIfRakeDeducted(params: any): any {
  for (const winner of params.data.winners) {
    winner.amount = params.rakeDetails.playerWins[winner.playerId];

    const playerIndex = _ld.findIndex(params.table.players, { playerId: winner.playerId });
    if (playerIndex >= 0) {
      winner.chips = params.table.players[playerIndex].chips;
    }
  }

  return params;
};


// create winners response object
// that will render animation at client
// if rake deducted
assignAmountIfRakeNotDeducted(params: any): any {
  for (const winner of params.data.winners) {
    const playerIndex = _ld.findIndex(params.table.players, { playerId: winner.playerId });
    if (playerIndex >= 0) {
      winner.chips = params.table.players[playerIndex].chips;
    }
  }

  return params;
};


// create winners response object
// that will render animation at client
createWinnersForResponse(params: any): any {
  if (Object.keys(params.rakeDetails.playerWins).length > 0) {
    return this.assignAmountIfRakeDeducted(params);
  } else {
    return this.assignAmountIfRakeNotDeducted(params);
  }
};









}