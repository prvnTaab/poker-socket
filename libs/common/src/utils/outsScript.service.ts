import { Injectable } from "@nestjs/common";
import { EntryService } from "./winner-algo/entry.service";












@Injectable()
export class OutsScriptService {


    constructor(
        private readonly winnerMgmt: EntryService
    ) { }



    private findRank(strength: string): number {
        switch (strength) {
            case 'Royal Flush': return 10;
            case 'Straight Flush': return 9;
            case 'Four Of A Kind': return 8;
            case 'Full House': return 7;
            case 'Flush': return 6;
            case 'Straight': return 5;
            case 'Three Of A Kind': return 4;
            case 'Two Pairs': return 3;
            case 'One Pair': return 2;
            case 'High Card': return 1;
            default: return 0;
        }
    }

    private winnerAlgo(channelVariation: string, data: any): any {
        switch (channelVariation) {
            case 'Texas Hold’em':
                return this.winnerMgmt.findWinner(data);
            case 'Six Plus Texas Hold’em':
                return this.winnerMgmt.findWinnerShortDeck(data);
            case 'Omaha':
            case 'Five Card Omaha':
            case 'Six Card Omaha':
                return this.winnerMgmt.findWinnerOmaha(data);
            case 'Omaha Hi-Lo':
                return this.winnerMgmt.findWinnerOmahaHiLo(data);
            default:
                return 'not defined';
        }
    }

    private findOuts(
        data: any,
        finalOuts: any[],
        channelVariation: string,
        finalDeck: any[],
    ): any[] {
        const oldOutput = this.winnerAlgo(channelVariation, {
            playerCards: data.playerCards,
            boardCards: data.boardCards,
        });

        for (const card of finalDeck) {
            const newBoardCards = [...data.boardCards, card];

            const newOutput = this.winnerAlgo(channelVariation, {
                playerCards: data.playerCards,
                boardCards: newBoardCards,
            });

            const newWinnersRank1 = newOutput.filter(
                (newWinner: any) =>
                    newWinner.winnerRank === 1 &&
                    oldOutput.some(
                        (oldWinner: any) =>
                            oldWinner.playerId === newWinner.playerId &&
                            oldWinner.winnerRank !== 1 &&
                            this.findRank(newWinner.type) > this.findRank(oldWinner.type),
                    ),
            );

            for (const newWinner of newWinnersRank1) {
                const idx = finalOuts.findIndex(p => p.playerId === newWinner.playerId);
                if (idx !== -1) {
                    finalOuts[idx].outs.push(card);
                    finalOuts[idx].outCount++;
                }
            }
        }

        return finalOuts;
    }

    getOuts(
        evChopDetails: any[],
        boardCard: any[],
        channelVariation: string,
        finalDeck: any[],
    ): any[] {
        const dataForWinnerCalculation = {
            playerCards: evChopDetails.map(p => ({
                playerId: p.playerId,
                cards: p.cards,
            })),
            boardCards: boardCard,
        };

        const finalOuts = dataForWinnerCalculation.playerCards.map((p: any) => ({
            playerId: p.playerId,
            outs: [],
            outCount: 0,
        }));

        return this.findOuts(dataForWinnerCalculation, finalOuts, channelVariation, finalDeck);
    }





}