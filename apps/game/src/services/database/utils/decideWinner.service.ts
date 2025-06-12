import { Injectable } from "@nestjs/common";
import _ld from "lodash";
import _ from "underscore";
import { ActivityService } from "shared/common/activity/activity.service";
import { PokerDatabaseService } from "shared/common/datebase/pokerdatabase.service";

import { TableManagerService } from "../tableManager.service";
import stateOfX from "shared/common/stateOfX.sevice";





    // winnerMgmt   = require('../../../../../../shared/winnerAlgo/entry'),


@Injectable()
export class DecideWinnerService {


    constructor(
        private readonly activity:ActivityService,
        private readonly db:PokerDatabaseService,
        private readonly tableManager:TableManagerService,
        private readonly deductRake:DeductRakeService
    ) {}



// ### Validate if Game state in GAMEOVER throughout the calculation
isGameProgress(params: any): any {
  if (params.table.state === stateOfX.gameState.gameOver) {
    return {
      success: true,
      isSingleWinner: params.data.isSingleWinner,
      winners: params.data.winners,
      endingType: params.data.endingType,
      params: params
    };
  } else {
    return {
      success: false,
      info: "Game is not running on table !",
      isRetry: false,
      isDisplay: false,
      channelId: ""
    };
  }
};


// Pop board card for normal case
// remainingBoardCards = Number - how many cards to pop??
popBoardCard(params: any, remainingBoardCards: number): any {
  const cards = params.table.deck.slice(0, remainingBoardCards);

  for (let i = 0; i < cards.length; i++) {
    params.table.boardCard[0].push(cards[i]);
    params.data.remainingBoardCards[0].push(cards[i]);
  }

  params.table.deck.splice(0, remainingBoardCards);

  return params;
};


// Pop board card in case of run-it-twice enabled by all players
// remainingBoardCards = Number - how many cards to pop??
popRunItTwiceBoardCard(params: any, remainingBoardCards: number): any {
  let allRITValue = false;
  let allEvValue = false;

  if (params.data.evChopDetails) {
    allRITValue = params.data.evChopDetails.every((player: any) => player.evRIT === true);
    allEvValue = params.data.evChopDetails.every((player: any) => player.evChop === false);
  }

  const shouldRunItTwice =
    (params.table.isRunItTwiceApplied && !params.table.isEvChopTable) ||
    (!!params.table.isEvChopTable && !!params.table.isRunItTwiceTable && !!allEvValue) ||
    (!!params.table.isEvChopTable && !params.table.isRunItTwiceTable && allRITValue);

  if (shouldRunItTwice) {
    const ritCards = params.table.deck.slice(0, remainingBoardCards);
    for (let j = 0; j < ritCards.length; j++) {
      params.table.boardCard[1].push(ritCards[j]);
      params.data.remainingBoardCards[1].push(ritCards[j]);
    }
    params.table.deck.splice(0, remainingBoardCards);
  }

  return params;
};

// ### Pop-out remaining board cards on table if required

async popRemainingBoardCards(params: any): Promise<any> {
  const totalBoardCards = params.table.boardCard[0].length;
  const remainingBoardCards = 5 - totalBoardCards;

  if (remainingBoardCards > 0) {
    await this.popBoardCard(params, remainingBoardCards);
    await this.popRunItTwiceBoardCard(params, remainingBoardCards);
  }

  return params;
};


// Store boardcards for comparision of winner
// runintwice cards can be - 
// card card card card card
// null null null null card
// null null null card card
// These null are adjusted here
storeBoardCards(params: any): void {
  // Store normal board cards
  for (let j = 0; j < params.table.boardCard[0].length; j++) {
    params.data.cardSets.boardCards[0].push({
      type: params.table.boardCard[0][j].type,
      rank: params.table.boardCard[0][j].rank
    });
  }

  // Store run it twice board cards
  for (let k = 0; k < params.table.boardCard[1].length; k++) {
    if (params.table.boardCard[1][k]) {
      params.data.cardSets.boardCards[1].push({
        type: params.table.boardCard[1][k].type,
        rank: params.table.boardCard[1][k].rank
      });
    } else {
      params.data.cardSets.boardCards[1].push({
        type: params.table.boardCard[0][k].type,
        rank: params.table.boardCard[0][k].rank
      });
    }
  }
};

// Store player cards for comparision of winner

storePlayerCards(params: any): void {
  const playingPlayers = [];

  for (let i = 0; i < params.table.players.length; i++) {
    if (params.table.onStartPlayers.indexOf(params.table.players[i].playerId) >= 0) {
      playingPlayers.push(params.table.players[i]);
    }
  }

  for (let k = 0; k < playingPlayers.length; k++) {
    const cards = [];

    for (let l = 0; l < playingPlayers[k].cards.length; l++) {
      cards.push({
        type: playingPlayers[k].cards[l].type,
        rank: playingPlayers[k].cards[l].rank
      });
    }

    params.data.cardSets.playerCards.push({
      playerId: playingPlayers[k].playerId,
      cards: cards
    });
  }
};


// ### Store board and player cards combination
// > In order to decide winner on table

storeCardSets(params: any): Promise<any> {
  const isGameProgressResponse = this.isGameProgress(params);

  if (isGameProgressResponse.success) {
    if (!isGameProgressResponse.isSingleWinner) {
      params.data.cardSets = {
        playerCards: [],
        boardCards: [[], []]
      };

      // Store board cards
      this.storeBoardCards(params);

      // Store player cards
      this.storePlayerCards(params);

      return params;
    } else {
      return params;
    }
  } else {
    throw isGameProgressResponse;
  }
};


getWinnerRaking(params: any): Promise<any> {
  const playerCards: any[] = [];
  let normalBoardInputs: any = {};
  let ritBoardInputs: any = {};

  const playingPlayers: any[] = [];
  for (let i = 0; i < params.table.players.length; i++) {
    if (params.table.onStartPlayers.indexOf(params.table.players[i].playerId) >= 0) {
      playingPlayers.push(params.table.players[i]);
    }
  }

  let player = null;
  let playerCard = [];
  for (let i = 0; i < playingPlayers.length; i++) {
    player = playingPlayers[i];
    if (player.lastMove !== stateOfX.move.fold) {
      if (player.state === stateOfX.playerState.playing || player.state === stateOfX.playerState.disconnected) {
        playerCard = _.where(params.data.cardSets.playerCards, { playerId: player.playerId })[0];
        playerCards.push(playerCard);
      } else if (player.state == stateOfX.playerState.onBreak) {
        if (params.table.isCTEnabledTable) {
          if (player.playerScore < 0) {
            playerCard = _.where(params.data.cardSets.playerCards, { playerId: player.playerId })[0];
            playerCards.push(playerCard);
          } else if (player.playerScore > 0) {
            if (
              (player.playerCallTimer.status === false && player.callTimeGameMissed <= params.table.ctEnabledBufferHand) ||
              (player.playerCallTimer.status === true && !player.playerCallTimer.isCallTimeOver)
            ) {
              playerCard = _.where(params.data.cardSets.playerCards, { playerId: player.playerId })[0];
              playerCards.push(playerCard);
            }
          }
        } else {
          playerCard = _.where(params.data.cardSets.playerCards, { playerId: player.playerId })[0];
          playerCards.push(playerCard);
        }
      }
    }
  }

  normalBoardInputs = {
    playerCards: playerCards,
    boardCards: params.table.boardCard[0]
  };

  const tempRitCards = Array.from(params.table.boardCard[1]);

  let allRITValue = false;
  let allEvValue = false;
  if (params.data.evChopDetails) {
    allRITValue = params.data.evChopDetails.every((player: any) => player.evRIT === true);
    allEvValue = params.data?.evChopDetails.every((player: any) => player.evChop === false);
  }

  if ((params.table.isRunItTwiceApplied && !params.table.isEvChopTable) ||
    (params.table.isEvChopTable && params.table.isRunItTwiceTable && allEvValue) ||
    (params.table.isEvChopTable && !params.table.isRunItTwiceTable && allRITValue)) {

    for (let i = 0; i < params.table.boardCard[0].length; i++) {
      if (tempRitCards[i] === null) {
        tempRitCards[i] = params.table.boardCard[0][i];
      }
    }

    params.data.tempRitBoardCards = tempRitCards;
    ritBoardInputs = {
      playerCards: playerCards,
      boardCards: tempRitCards
    };
  }

  switch (params.table.channelVariation) {
    case stateOfX.channelVariation.holdem:
      params.data.winnerRanking = winnerMgmt.findWinner(normalBoardInputs);
      break;
    case stateOfX.channelVariation.shortdeck:
      params.data.winnerRanking = winnerMgmt.findWinnerShortDeck(normalBoardInputs);
      break;
    case stateOfX.channelVariation.omaha:
    case stateOfX.channelVariation.FiveCardOmaha:
    case stateOfX.channelVariation.SixCardOmaha:
      params.data.winnerRanking = winnerMgmt.findWinnerOmaha(normalBoardInputs);
      break;
    case stateOfX.channelVariation.omahahilo:
      params.data.winnerRanking = winnerMgmt.findWinnerOmahaHiLo(normalBoardInputs);
      break;
    default:
      break;
  }

  if ((params.table.isRunItTwiceApplied && !params.table.isEvChopTable) ||
    (params.table.isEvChopTable && params.table.isRunItTwiceTable && allEvValue) ||
    (params.table.isEvChopTable && !params.table.isRunItTwiceTable && allRITValue)) {

    switch (params.table.channelVariation) {
      case stateOfX.channelVariation.holdem:
        params.data.ritWinnerRanking = winnerMgmt.findWinner(ritBoardInputs);
        break;
      case stateOfX.channelVariation.shortdeck:
        params.data.ritWinnerRanking = winnerMgmt.findWinnerShortDeck(ritBoardInputs);
        break;
      case stateOfX.channelVariation.omaha:
      case stateOfX.channelVariation.FiveCardOmaha:
      case stateOfX.channelVariation.SixCardOmaha:
        params.data.ritWinnerRanking = winnerMgmt.findWinnerOmaha(ritBoardInputs);
        break;
      case stateOfX.channelVariation.omahahilo:
        params.data.ritWinnerRanking = winnerMgmt.findWinnerOmahaHiLo(ritBoardInputs);
        break;
      default:
        break;
    }
  }

  return params;
};


// Set player cards for any decision params generated for a pot

// Check if player still exists on table (Didn't left the game)
// Do not consider playerCards for player with last move fold
// Consider disconnected player as well if player played till round RIVER

setPlayerCardForDecisionParam(params: any, pot: any): void {
  let player: any = null;
  let playerCard: any = [];

  for (let i = 0; i < pot.contributors.length; i++) {
    const playerIndex = _ld.findIndex(params.table.players, { playerId: pot.contributors[i] });

    if (playerIndex >= 0) {
      player = params.table.players[playerIndex];

      if (player.lastMove !== stateOfX.move.fold) {
        if (
          player.state === stateOfX.playerState.playing ||
          player.state === stateOfX.playerState.disconnected
        ) {
          playerCard = _.where(params.data.cardSets.playerCards, {
            playerId: pot.contributors[i],
          })[0];
          params.data.decisionParams[params.data.decisionParams.length - 1].playerCards.push(playerCard);
        } else if (player.state === stateOfX.playerState.onBreak) {
          if (params.table.isCTEnabledTable) {
            if (player.playerScore < 0) {
              playerCard = _.where(params.data.cardSets.playerCards, {
                playerId: pot.contributors[i],
              })[0];
              params.data.decisionParams[params.data.decisionParams.length - 1].playerCards.push(playerCard);
            } else if (player.playerScore > 0) {
              if (
                (player.playerCallTimer.status === false &&
                  player.callTimeGameMissed <= params.table.ctEnabledBufferHand) ||
                (player.playerCallTimer.status === true &&
                  !player.playerCallTimer.isCallTimeOver)
              ) {
                playerCard = _.where(params.data.cardSets.playerCards, {
                  playerId: pot.contributors[i],
                })[0];
                params.data.decisionParams[params.data.decisionParams.length - 1].playerCards.push(playerCard);
              }
            }
          } else {
            playerCard = _.where(params.data.cardSets.playerCards, {
              playerId: pot.contributors[i],
            })[0];
            params.data.decisionParams[params.data.decisionParams.length - 1].playerCards.push(playerCard);
          }
        }
      }
    }
  }
}

// ### Generate player and board cards as per number of pots and contributors
async generateDecisionParams(params: any): Promise<any> {
  const isGameProgressResponse = await this.isGameProgress(params);

  if (!isGameProgressResponse.success) {
    throw isGameProgressResponse;
  }

  if (!isGameProgressResponse.isSingleWinner) {
    for (const pot of params.data.pot) {
      params.data.decisionParams.push({
        boardCards: params.data.cardSets.boardCards[pot.borardSet],
        playerCards: [],
        amount: pot.amount,
        potIndex: pot.potIndex,
        winners: [],
        winningAmount: 0,
        isRit: pot.borardSet === 1,
        isRefund: pot.isRefund,
        internalPotSplitIndex: pot.internalPotSplitIndex,
        contributors: pot.contributors,
      });

      this.setPlayerCardForDecisionParam(params, pot);
    }
  }

  return params;
}

// filters winners if not contributors
differenceBy(arr1: any, arr2: any, key: any): any {
  const result: any = [];

  for (let i = 0; i < arr1.length; i++) {
    const filter = { [key]: arr1[i][key] };
    if (_.findWhere(arr2, filter)) {
      result.push(arr1[i]);
    }
  }

  return result;
}


// find winners for each pot for holdem and omaha
extractWinners(contributors: any,winnerRanking: any,indexOfPots: number): any{
  const sortedWinnerRanking = _.sortBy(winnerRanking, "winnerRank");
  let tempWinner: { playerId: string; winnerRank: number } | undefined;
  let isFound = false;

  for (let i = 0; i < sortedWinnerRanking.length && !isFound; i++) {
    for (let j = 0; j < contributors.length && !isFound; j++) {
      if (
        sortedWinnerRanking[i].playerId.toString() ===
        contributors[j].playerId.toString()
      ) {
        tempWinner = sortedWinnerRanking[i];
        isFound = true;
      }
    }
  }

  if (!tempWinner) return [];

  let finalWinner = _.where(
    sortedWinnerRanking,
    { winnerRank: tempWinner.winnerRank }
  );

  finalWinner = this.differenceBy(finalWinner, contributors, "playerId");

  return finalWinner;
}


// find winners for each pot for omaha-hilo
extractWinnersOmahaHiLo(contributors: any,winnerRanking: any,indexOfPots: number): any {
  const sortedWinnerHighRanking = _.sortBy(winnerRanking.winnerHigh, "winnerRank");
  const sortedWinnerLoRanking = _.sortBy(winnerRanking.winnerLo, "winnerRank");

  let tempWinnerHigh: { playerId: string; winnerRank: number } | undefined;
  let tempWinnerLo: { playerId: string; winnerRank: number } | undefined;
  let findWinnerLo: { playerId: string; winnerRank: number }[] = [];

  highLoop:
  for (let i = 0; i < sortedWinnerHighRanking.length; i++) {
    for (let j = 0; j < contributors.length; j++) {
      if (sortedWinnerHighRanking[i].playerId.toString() === contributors[j].playerId.toString()) {
        tempWinnerHigh = sortedWinnerHighRanking[i];
        break highLoop;
      }
    }
  }

  if (sortedWinnerLoRanking.length > 0) {
    lowLoop:
    for (let i = 0; i < sortedWinnerLoRanking.length; i++) {
      for (let j = 0; j < contributors.length; j++) {
        if (sortedWinnerLoRanking[i].playerId.toString() === contributors[j].playerId.toString()) {
          tempWinnerLo = sortedWinnerLoRanking[i];
          break lowLoop;
        }
      }
    }

    if (tempWinnerLo) {
      findWinnerLo = _.where(sortedWinnerLoRanking, {
        winnerRank: tempWinnerLo.winnerRank,
      });
      findWinnerLo = this.differenceBy(findWinnerLo, contributors, "playerId");
    }
  }

  const winnerHighRaw = _.where(sortedWinnerHighRanking, {
    winnerRank: tempWinnerHigh?.winnerRank,
  });
  const winnerHigh = this.differenceBy(winnerHighRaw, contributors, "playerId");

  return {
    winnerHigh,
    winnerLo: findWinnerLo,
  };
}

// ### Decide winner based on Game type

async decidewinner(params: any): Promise<any> {
  const isGameProgressResponse = await this.isGameProgress(params);

  if (isGameProgressResponse.success) {
    if (!isGameProgressResponse.isSingleWinner) {
      for (const decisionSet of params.data.decisionParams) {
        const tempWinnerSet = decisionSet.isRit
          ? params.data.ritWinnerRanking
          : params.data.winnerRanking;

        switch (params.table.channelVariation) {
          case stateOfX.channelVariation.holdem:
          case stateOfX.channelVariation.shortdeck:
          case stateOfX.channelVariation.omaha:
          case stateOfX.channelVariation.FiveCardOmaha:
          case stateOfX.channelVariation.SixCardOmaha:
            decisionSet.winners = this.extractWinners(
              decisionSet.playerCards,
              tempWinnerSet,
              decisionSet.internalPotSplitIndex
            );
            break;

          case stateOfX.channelVariation.omahahilo:
            decisionSet.winners = this.extractWinnersOmahaHiLo(
              decisionSet.playerCards,
              tempWinnerSet,
              decisionSet.internalPotSplitIndex
            );
            break;

          default:
            // No handler for unknown variation; you may want to throw or handle it differently
            break;
        }
      }

      params.data.boardCard = params.table.boardCard;
      return params;
    } else {
      return params;
    }
  } else {
    return isGameProgressResponse;
  }
}


// Add winning factor text for winner players

refineDecisionParams(params: any): any {
  if (params.table.channelVariation !== stateOfX.channelVariation.omahahilo) {
    for (const decisionSet of params.data.decisionParams) {
      for (const winner of decisionSet.winners) {
        winner.winningAmount = 0;
        delete winner.typeName;
      }
    }
    return params;
  } else {
    for (const decisionSet of params.data.decisionParams) {
      for (const winner of decisionSet.winners.winnerHigh) {
        delete winner.typeName;
      }

      for (const winner of decisionSet.winners.winnerLo) {
        delete winner.typeName;
      }
    }
    return params;
  }
}


// ### Add winning amount for Holdem and Omaha
// > The cases are same for both variations
// > POTINDEX is adding here in each winners array

async addWinningAmount(params: any): Promise<any> {
  const isGameProgressResponse = await this.isGameProgress(params);

  if (isGameProgressResponse.isSingleWinner) {
    return params;
  }

  if (params.table.channelVariation === stateOfX.channelVariation.omahahilo) {
    return params;
  }

  for (const decisionSet of params.data.decisionParams) {
    const winningAmount = decisionSet.amount;
    const clonedDesicionParams = JSON.parse(JSON.stringify(decisionSet.winners));

    for (let i = 0; i < clonedDesicionParams.length; i++) {
      clonedDesicionParams[i].potIndex = decisionSet.potIndex;
      clonedDesicionParams[i].amount = Math.round(winningAmount / clonedDesicionParams.length);
      clonedDesicionParams[i].internalPotSplitIndex = decisionSet.internalPotSplitIndex;
      clonedDesicionParams[i].isRefund = decisionSet.isRefund;
      clonedDesicionParams[i].isRit = decisionSet.isRit;

      decisionSet.winners[i] = clonedDesicionParams[i];
      params.data.winners.push(clonedDesicionParams[i]);
    }
  }

  params.data.boardCard = params.table.boardCard;
  return params;
}

// ### Add winning amount for Omaha-HiLo
// POTINDEX is adding here in each winners array

async addWinningAmountOmahaHiLo(params: any): Promise<any> {
  const isGameProgressResponse = await this.isGameProgress(params);

  if (isGameProgressResponse.isSingleWinner) {
    return params;
  }

  if (params.table.channelVariation !== stateOfX.channelVariation.omahahilo) {
    return params;
  }

  for (const decisionSet of params.data.decisionParams) {
    const winningAmount = decisionSet.amount;
    const clonedDesicionParams = JSON.parse(JSON.stringify(decisionSet.winners));

    if (clonedDesicionParams.winnerLo.length > 0) {
      for (let i = 0; i < clonedDesicionParams.winnerHigh.length; i++) {
        clonedDesicionParams.winnerHigh[i].potIndex = decisionSet.potIndex;
        clonedDesicionParams.winnerHigh[i].amount = Math.round(winningAmount / (2 * clonedDesicionParams.winnerHigh.length));
        clonedDesicionParams.winnerHigh[i].internalPotSplitIndex = decisionSet.internalPotSplitIndex + "0";
        clonedDesicionParams.winnerHigh[i].isRefund = decisionSet.isRefund;
        clonedDesicionParams.winnerHigh[i].isRit = decisionSet.isRit;
        params.data.winners.push(clonedDesicionParams.winnerHigh[i]);
      }

      for (let j = 0; j < clonedDesicionParams.winnerLo.length; j++) {
        clonedDesicionParams.winnerLo[j].potIndex = decisionSet.potIndex;
        clonedDesicionParams.winnerLo[j].amount = Math.round(winningAmount / (2 * clonedDesicionParams.winnerLo.length));
        clonedDesicionParams.winnerLo[j].internalPotSplitIndex = decisionSet.internalPotSplitIndex + "1";
        clonedDesicionParams.winnerLo[j].isRefund = decisionSet.isRefund;
        clonedDesicionParams.winnerLo[j].isRit = decisionSet.isRit;
        params.data.winners.push(clonedDesicionParams.winnerLo[j]);
      }
    } else {
      for (let k = 0; k < clonedDesicionParams.winnerHigh.length; k++) {
        clonedDesicionParams.winnerHigh[k].potIndex = decisionSet.potIndex;
        clonedDesicionParams.winnerHigh[k].amount = Math.round(winningAmount / clonedDesicionParams.winnerHigh.length);
        clonedDesicionParams.winnerHigh[k].internalPotSplitIndex = decisionSet.internalPotSplitIndex + "0";
        clonedDesicionParams.winnerHigh[k].isRefund = decisionSet.isRefund;
        clonedDesicionParams.winnerHigh[k].isRit = decisionSet.isRit;
        params.data.winners.push(clonedDesicionParams.winnerHigh[k]);
      }
    }

    decisionSet.winners = clonedDesicionParams;
  }

  params.data.boardCard = params.table.boardCard;
  return params;
}

// Intitialize params for the calculation of winner decision
initializeParams(params: any): any {
  params.data.cardsToShow = {};
  params.data.winners = [];
  params.table.roundName = stateOfX.round.showdown;
  return params;
}


// ### Deduct rake on this table

async deductRakeOnTable(params: any): Promise<any> {
  const deductRakeOnTableResponse = await this.deductRake.deductRakeOnTable(params);
  
  if (deductRakeOnTableResponse.success) {
    return deductRakeOnTableResponse.params;
  } else {
    throw deductRakeOnTableResponse;
  }
}


// process winners by pot
// add winning amount
async processWinnerDecision(params: any): Promise<any> {
  try {
    params = await this.initializeParams(params);
    params = await this.popRemainingBoardCards(params);
    params = await this.storeCardSets(params);
    params = await this.getWinnerRaking(params);
    params = await this.generateDecisionParams(params);
    params = await this.decidewinner(params);
    params = await this.refineDecisionParams(params);
    params = await this.deductRakeOnTable(params);
    params = await this.addWinningAmount(params);
    params = await this.addWinningAmountOmahaHiLo(params);

    console.error("!!!!!!!!!!!!!!!!!!!!!!!");
    console.error(JSON.stringify(params));

    this.activity.potWinner(params, stateOfX.profile.category.gamePlay, stateOfX.gamePlay.subCategory.info, stateOfX.logType.success);
    return { success: true, params };
  } catch (err) {
    this.activity.potWinner(err, stateOfX.profile.category.gamePlay, stateOfX.gamePlay.subCategory.info, stateOfX.logType.error);
    throw err;
  }
}










}