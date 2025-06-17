import { Injectable } from "@nestjs/common";
import stateOfX from "shared/common/stateOfX.sevice";
import _ from 'underscore';
import { Card } from "./card.service";
import { CardComparerService } from "./cardComparer.service";
import { ShortDeckCardCompareService } from "./shortDeckCardCompare.service";
import { CombinationService } from "./combination.service";
import { CardConfigurationService } from "./cardConfiguration.service";
import { PointsService } from "./points.service";
import { WinnerRankingService } from "./winnerRanking.service";


// Card 						= require("./card.js"),
// 	cardComparer 			= require("./cardComparer.js"),
// 	shortDeckCardCompare 			= require("./shortDeckCardCompare.js"),
//   comb 							= require("./combination.js"),
//   stateOfX 					= require("../stateOfX.js"),
//   cardConfiguration = require("./cardConfiguration.js"),
//   points            = require("./points.js"),
//   winnerRanking     = require("./winnerRanking.js"),
//   _ 								= require("underscore"),

@Injectable()
export class EntryService {


    constructor(
        private readonly card: Card,
        private readonly cardComparer: CardComparerService,
        private readonly shortDeckCardCompare: ShortDeckCardCompareService,
        private readonly comb: CombinationService,
        private readonly cardConfiguration: CardConfigurationService,
        private readonly points: PointsService,
        private readonly winnerRanking: WinnerRankingService
    ) { }




    //### This function is used to make player cards using player cards and board cards

    /**
     * This function is used to make player cards using player cards and board cards
     * @method makeCards
     * @param  {object}  params contains required player cards and board cards
     * @return {object}         players containing playerObject
     */
    makeCards(params: any): any {
        const players: any = [];
        const boardCardsArray = this.makeBoardCards(params.boardCards);

        for (let i = 0; i < params.playerCards.length; i++) {
            const playerObject: { playerId: string; cards: any } = {
                playerId: params.playerCards[i].playerId,
                cards: [],
            };

            for (let j = 0; j < params.playerCards[i].cards.length; j++) {
                let card = new Card(
                    params.playerCards[i].cards[j].type,
                    params.playerCards[i].cards[j].rank
                );
                playerObject.cards.push(card);
            }

            playerObject.cards.push(...boardCardsArray);
            players.push(playerObject);
        }

        return players;
    }

    /**
     * This function is used to make board cards
     * @method makeBoardCards
     * @param  cards Raw board cards
     * @return Card[] array of card objects
     */
    makeBoardCards(cards: any): any {
        return cards.map(card => new card(card.type, card.rank));
    }

    /**
     * This function finds the best hand combination of cards among cards array
     * @param paramsObject Object containing playerCards and boardCards
     * @returns Best card combination for each player
     */
    makeBestCombination(paramsObject: any): any {
        const players = this.makeCards(paramsObject);
        const tempWinner: any = [];

        for (let i = 0; i < players.length; i++) {
            const allCombos: any = this.comb.combination(players[i].cards, 5);
            const tempArray: any = allCombos.map(combo => ({ set: combo }));
            const bestComb = this.cardComparer.getGreatest(tempArray);

            tempWinner.push({
                playerId: players[i].playerId,
                set: bestComb,
            });
        }

        return tempWinner;
    }

    makeBestCombinationShortDeck(paramsObject: any): any {
        const players = this.makeCards(paramsObject);
        const tempWinner: any = [];

        for (let i = 0; i < players.length; i++) {
            if (paramsObject.playerCards[i].cards.length > 0) {
                const allCombos = this.comb.combination(players[i].cards, 5);
                const tempArray: any = allCombos.map(set => ({ set }));
                const bestComb = this.shortDeckCardCompare.getGreatest(tempArray);

                tempWinner.push({
                    playerId: players[i].playerId,
                    set: bestComb,
                });
            }
        }

        return tempWinner;
    }

    //### This function is used to decide winner for texas hold'em and main function called by client using algo
    findWinner(paramsObject: any): any {
        const tempWinners = this.makeBestCombination(paramsObject);
        const tempArray: any = [];

        for (let j = 0; j < tempWinners.length; j++) {
            const entry = tempWinners[j];
            const bestSet = Array.isArray(entry.set) && entry.set.length > 0 ? entry.set[0] : entry.set;

            tempArray.push({
                playerId: entry.playerId,
                set: bestSet.set,
                type: bestSet.type,
                priority: this.points.handsPriority[bestSet.type],
            });
        }

        const finalWinners = this.winnerRanking.findWinnersRanking(tempArray);
        return finalWinners;
    };

    findWinnerShortDeck(paramsObject: any): any {
        const tempWinners = this.makeBestCombinationShortDeck(paramsObject);
        const tempArray: any = [];

        for (let j = 0; j < tempWinners.length; j++) {
            const entry = tempWinners[j];
            const bestSet = Array.isArray(entry.set) && entry.set.length > 0 ? entry.set[0] : entry.set;

            tempArray.push({
                playerId: entry.playerId,
                set: bestSet.set,
                type: bestSet.type,
                priority: this.points.handsPriorityShortDeck[bestSet.type],
            });
        }

        const finalWinners = this.winnerRanking.findWinnersRanking(tempArray);
        return finalWinners;
    };

    //### This function is used to decide winner for OMAHA game and main function called by client using algo
    findWinnerOmaha(paramsObject: any): any {
        const tempWinners = this.makeBestCombinationOmaha(paramsObject);
        const finalWinners = this.winnerRanking.findWinnersRanking(tempWinners);
        return finalWinners;
    };

    //### This function is used to make cards for omaha
    makeBestCombinationOmaha(paramsObject: any): any {
        const allCombos = this.comb.combination(paramsObject.boardCards, 3);
        const tempWinners: any = [];

        for (let i = 0; i < paramsObject.playerCards.length; i++) {
            const player = paramsObject.playerCards[i];
            if (player.cards.length > 0) {
                const allCombosPlayer = this.comb.combination(player.cards, 2);
                const allCombos5 = this.makeCardsOmaha(allCombos, allCombosPlayer);

                const paramsArray = allCombos5.map((combo) => ({
                    set: combo,
                }));

                const bestComb = this.cardComparer.getGreatest(paramsArray);

                if (bestComb && bestComb[0]) {
                    tempWinners.push({
                        playerId: player.playerId,
                        set: bestComb[0].set,
                        type: bestComb[0].type!,
                        priority: this.points.handsPriority[bestComb[0].type!],
                    });
                }
            }
        }

        return tempWinners;
    };

    //### This function is used to make best combination cards for omaha hi lo
    makeBestCombinationOmahaHiLo(paramsObject: any): any {
        const allCombos = this.comb.combination(paramsObject.boardCards, 3);
        const tempWinnersFinal: any = [];

        for (let i = 0; i < paramsObject.playerCards.length; i++) {
            const player = paramsObject.playerCards[i];
            if (player.cards.length > 0) {
                const allCombosPlayer = this.comb.combination(player.cards, 2);
                const tempArray = this.makeCardsOmaha(allCombos, allCombosPlayer);

                const paramsArray = tempArray.map((combo) => ({
                    set: combo,
                    playerId: player.playerId,
                }));

                const bestComb = this.cardComparer.getGreatestOmahaLo(paramsArray);

                if (bestComb) {
                    tempWinnersFinal.push(bestComb);
                }
            }
        }

        return tempWinnersFinal;
    };

    //### This function is used to make cards for omaha
    makeCardsOmaha = function (boardCardsCombos: any, playerCardsCombos: any): any {
        const tempArray: any = [];

        for (let i = 0; i < boardCardsCombos.length; i++) {
            for (let j = 0; j < playerCardsCombos.length; j++) {
                const playerCardsObject = this.makeBoardCards(playerCardsCombos[j]);
                const boardCardsArray = this.makeBoardCards(boardCardsCombos[i]);
                tempArray.push(playerCardsObject.concat(boardCardsArray));
            }
        }

        return tempArray;
    };

    //### This function is used to create response for best hand
    createResponseForBestHand(params: any): any {
        for (let i = 0; i < params.length; i++) {
            const tempSet = params[i].set[0];
            params[i] = _.omit(params[i], "set");
            params[i].set = tempSet.set;
            params[i].type = tempSet.type;
            params[i].typeName = tempSet.typeName;
        }

        return params;
    };

    //### This function is used to decide winner for OMAHA HI LO game and main function called by client who using algo
    //### Main function to find Omaha Hi/Lo winners
    findWinnerOmahaHiLo(paramsObject: any): any {
        let finalWinnerForLo:any = [];

        const tempWinnersForHi = this.makeBestCombination(paramsObject);
        let finalWinnerForHi = this.winnerRanking.findWinnersRanking(tempWinnersForHi);

        const tempWinnersForLo = this.makeBestCombinationShortDeck(paramsObject); // Assuming it returns Lo hands
        if (tempWinnersForLo.length > 0) {
            finalWinnerForLo = this.winnerRanking.findWinnerOmahaLo(tempWinnersForLo);
        }

        if (!finalWinnerForHi[0]) {
            finalWinnerForHi = [finalWinnerForHi as any];
        }

        if (!finalWinnerForLo[0] && Object.keys(finalWinnerForLo).length > 0) {
            finalWinnerForLo = [finalWinnerForLo as any];
        }

        return {
            winnerHigh: finalWinnerForHi,
            winnerLo: finalWinnerForLo,
        };
    };

    //### Returns best hand depending on number of hole cards
    findBestHand(params: any): any {
        if (params.playerCards[0].cards.length === 2) {
            return this.createResponseForBestHand(this.makeBestCombinationShortDeck(params));
        }

        if (params.playerCards[0].cards.length === 4) {
            return this.findWinnerOmaha(params);
        }

        return -1;
    };

    //### Finds hand configuration for multiple game types
    findCardsConfiguration(params: any, gameType: string): any {
        const result: any[] = [];

        // Texas Hold'em
        if (params.playerCards[0].cards.length === 2 && gameType === stateOfX.channelVariation.holdem) {
            for (let i = 0; i < params.playerCards.length; i++) {
                const tempParams: any = {
                    boardCards: params.boardCards,
                    playerCards: [params.playerCards[i]],
                };
                const bestHand = this.createResponseForBestHand(this.makeBestCombination(tempParams));
                const text = this.cardConfiguration.findCardConfig(bestHand[0]);
                bestHand[0].text = text;
                result.push(bestHand[0]);
            }
            return result;
        }

        // Short Deck
        if (params.playerCards[0].cards.length === 2 && gameType === stateOfX.channelVariation.shortdeck) {
            for (let i = 0; i < params.playerCards.length; i++) {
                const tempParams: any = {
                    boardCards: params.boardCards,
                    playerCards: [params.playerCards[i]],
                };
                const bestHand = this.createResponseForBestHand(this.makeBestCombinationShortDeck(tempParams));
                const text = this.cardConfiguration.findCardConfig(bestHand[0]);
                bestHand[0].text = text;
                result.push(bestHand[0]);
            }
            return result;
        }

        // Omaha Variants
        const isOmaha =
            (params.playerCards[0].cards.length === 5 && gameType === stateOfX.channelVariation.FiveCardOmaha) ||
            (params.playerCards[0].cards.length === 6 && gameType === stateOfX.channelVariation.SixCardOmaha) ||
            (params.playerCards[0].cards.length === 4 && gameType === stateOfX.channelVariation.omaha);

        if (isOmaha) {
            for (let i = 0; i < params.playerCards.length; i++) {
                const tempParams: any = {
                    boardCards: params.boardCards,
                    playerCards: [params.playerCards[i]],
                };
                const bestHand = this.findWinnerOmaha(tempParams);
                const text = this.cardConfiguration.findCardConfig(bestHand[0]);
                bestHand[0].text = text;
                result.push(bestHand[0]);
            }
            return result;
        }

        // Omaha Hi/Lo
        if (params.playerCards[0].cards.length === 4 && gameType === stateOfX.channelVariation.omahahilo) {
            for (let i = 0; i < params.playerCards.length; i++) {
                const tempParams: any = {
                    boardCards: params.boardCards,
                    playerCards: [params.playerCards[i]],
                };

                const tempWinners = this.findWinnerOmahaHiLo(tempParams);
                const textForHigh = this.cardConfiguration.findCardConfig(tempWinners.winnerHigh[0]);
                tempWinners.winnerHigh[0].text = textForHigh;

                result.push({
                    winnerHigh: tempWinners.winnerHigh,
                    winnerLo: tempWinners.winnerLo,
                });
            }
            return result;
        }

        return result;
    };






}