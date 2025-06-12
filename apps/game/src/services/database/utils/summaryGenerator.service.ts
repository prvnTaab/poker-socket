import { Injectable } from "@nestjs/common";
import { UtilsService } from "apps/game/src/utils/utils.service";
import stateOfX from "shared/common/stateOfX.sevice";
import _ from "underscore";










@Injectable()
export class SummaryGeneratorService {



    constructor(
        private readonly utilsService: UtilsService
    ) { }



    private cardImg = {
        'd': " <img src = 'img_red_diamond'/>",
        's': " <img src = 'img_black_spade'/>",
        'h': " <img src = 'img_red_heart'/>",
        'c': " <img src = 'img_black_club'/>"
    };

    private upperBranchText = "FLOP1";
    private lowerBranchText = "FLOP2";

    onFold(params: any): void {
        const { table, data } = params;
        if (table.players?.length) {
            const player = _.find(table.players, { playerId: data.playerId });
            if (!player) return;

            let message = `Seat ${player.seatIndex} :${player.playerName}`;
            if (player.seatIndex === table.smallBlindSeatIndex) {
                message += ' (small blind)';
            } else if (player.seatIndex === table.bigBlindSeatIndex) {
                message += ' (big blind)';
            }
            message += ` folded before ${stateOfX.nextRoundOf[data.roundName]}`;

            table.summaryOfAllPlayers[player.seatIndex] = message;
        }
    }

    onLeave(params: any): void {
        const { table, data } = params;
        if (table.players?.length) {
            const player = _.find(table.players, { playerId: data.playerId });
            if (!player) return;

            let message = `Seat ${player.seatIndex} :${player.playerName}`;
            if (player.seatIndex === table.smallBlindSeatIndex) {
                message += ' (small blind)';
            } else if (player.seatIndex === table.bigBlindSeatIndex) {
                message += ' (big blind)';
            }
            message += ` left before ${stateOfX.nextRoundOf[table.roundName]}`;

            table.summaryOfAllPlayers[player.seatIndex] = message;
        }
    }


    generateSummary(params: any): string {
        const { table } = params;
        table.summaryOfAllPlayers.summary = "";

        if (table.pot?.length) {
            const totalPot = _(table.pot)
                .map('amount')
                .reduce((sum, n) => this.utilsService.convertIntToDecimal(sum + n), 0);

            table.summaryOfAllPlayers.summary += `Total pot ${totalPot}.`;

            let mainPotContributors = _(table.pot[0].contributors)
                .map(pid => _.find(table.gamePlayers, { playerId: pid }))
                .filter(p => p && p.onGameStartBuyIn !== p.chips)
                .map(p => p!.playerName)
                .join(',');

            table.summaryOfAllPlayers.summary += `\n Main pot ${table.pot[0].amount}(${mainPotContributors})`;

            if (table.pot.length > 1) {
                for (let i = 1; i < table.pot.length; i++) {
                    const side = table.pot[i];
                    const contributors = _(side.contributors)
                        .map(pid => _.find(table.players, { playerId: pid }))
                        .filter(p => p)
                        .map(p => p!.playerName)
                        .join(',');

                    table.summaryOfAllPlayers.summary += `\n Side pot-${side.potIndex} ${side.amount}(${contributors})`;
                }
            }
        }

        if (table.summaryOfAllPlayers.rake) {
            table.summaryOfAllPlayers.summary += ` \n Rake ${table.summaryOfAllPlayers.rake}`;
        }

        const runItTwiceEnabledFor = _(table.pot[0].contributors)
            .map(pid => _.find(table.players, { playerId: pid }))
            .filter(p => p && p.isRunItTwice)
            .map(p => p!.playerName)
            .join(',');

        const isRITHappened = table.handHistory.some(e => e.text.includes('RIT Accepted by'));
        if (!isRITHappened) {
            if (!runItTwiceEnabledFor) {
                table.summaryOfAllPlayers.summary += `\nNo one enabled run it twice\n`;
            } else {
                table.summaryOfAllPlayers.summary += `\nRun It Twice Enabled by (${runItTwiceEnabledFor})\n`;
                const disabled = _(table.pot[0].contributors)
                    .map(pid => _.find(table.players, { playerId: pid }))
                    .filter(p => p && !p.isRunItTwice)
                    .map(p => p!.playerName)
                    .join(',');

                if (disabled) {
                    table.summaryOfAllPlayers.summary += `Run It Twice Disabled by (${disabled})\n`;
                }
            }
        }

        if (table.isStraddleEnable) {
            table.summaryOfAllPlayers.summary += `Straddle is mandatory.\n`;
        } else {
            const straddlers = _(table.pot[0].contributors)
                .map(pid => _.find(table.gamePlayers, { playerId: pid }))
                .filter(p => p && p.isStraddleOpted)
                .map(p => p!.playerName)
                .join(', ');

            table.summaryOfAllPlayers.summary += straddlers
                ? `Straddle enabled by ${straddlers}.\n`
                : `No one enabled Straddle.\n`;
        }

        const boardCard = table.summaryOfAllPlayers.boardCard;
        let board1 = "", board2 = "";
        if (boardCard?.[0]?.length) {
            board1 = boardCard[0]
                .map(c => `${c.name}${this.cardImg[c.type[0].toLowerCase()]}`)
                .join(' ');
        }

        if (boardCard?.[1]?.length) {
            let nullCount = 0;
            board2 = boardCard[1]
                .map((c, i) => {
                    if (c == null) {
                        nullCount++;
                        return `${boardCard[0][i].name}${this.cardImg[boardCard[0][i].type[0].toLowerCase()]}`;
                    }
                    return `${c.name}${this.cardImg[c.type[0].toLowerCase()]}`;
                })
                .join(' ');
            if (nullCount >= boardCard[1].length) board2 = "";
        }

        if (board1) {
            table.summaryOfAllPlayers.summary += board2
                ? `\nBoard ${this.upperBranchText} [${board1}]\n`
                : `\nBoard [${board1}]\n`;
        }

        table.summaryOfAllPlayers.summary += `\n${table.summaryOfAllPlayers.hands1 || ""}`;
        if (board2) {
            table.summaryOfAllPlayers.summary += `\n\nand ${this.lowerBranchText} [${board2}]`;
        }
        table.summaryOfAllPlayers.summary += `\n${table.summaryOfAllPlayers.hands2 || ""}`;
        table.summaryOfAllPlayers.summary += `\n${table.summaryOfAllPlayers.winners || ""}`;

        return table.summaryOfAllPlayers.summary;
    }

    // Sub function to generate summary for each players

    getCurrentPlayer(params: any): any {
        const players = params.table.players || [];
        params.summary.currentPlayer = _.filter(players, { seatIndex: params.summary.seatIndex });
        return params;
    };


    generateSeatLevelText(params: any): any {
        const { summary } = params;

        if (!summary.currentPlayer?.length) {
            return params;
        }

        const seatIndex = parseInt(summary.seatIndex as string, 10);
        const playerName = summary.currentPlayer[0].playerName;
        summary.seatLevelText = `Seat ${seatIndex} :${playerName}`;

        return params;
    };

    assignConfigDetails(params: any): any {
        const { summary, table } = params;

        if (!summary.currentPlayer?.length) {
            return params;
        }

        const seatIdx = summary.seatIndex;
        if (seatIdx == table.smallBlindSeatIndex && table.smallBlindSeatIndex != null) {
            summary.seatLevelText += ' (small blind)';
        } else if (seatIdx == table.bigBlindSeatIndex && table.bigBlindSeatIndex != null) {
            summary.seatLevelText += ' (big blind)';
        }

        return params;
    };


    getWinnerDetails(params: any): any {
        const playerArr = params.summary.currentPlayer;
        if (!playerArr?.length) {
            return params;
        }

        const playerId = playerArr[0].playerId;

        // Replace deprecated _.where with _.filter :contentReference[oaicite:1]{index=1}
        const matched = _.filter(params.data.winners, { playerId });
        params.summary.currentWinner = matched;

        if (matched.length > 0) {
            // Replace _.pluck + _.reduce with native lodash chain or map + reduce :contentReference[oaicite:2]{index=2}
            const amounts = _.map(matched, 'amount');
            params.summary.winAmount = _.reduce(amounts, (memo, num) => memo + num, 0);
        }

        return params;
    };

    assignPlayerCardsAndText(params: any): any {
        const currentPlayerArr = params.summary.currentPlayer;
        if (!currentPlayerArr?.length || !currentPlayerArr[0].cards?.length) {
            return params;
        }

        const player = currentPlayerArr[0];
        const cards = player.cards;
        params.summary.playerCards = cards
            .map(c => `${c.name}${this.cardImg[c.type[0].toLowerCase()]}`)
            .join(' ');

        const winners = params.summary.currentWinner || [];
        const isEverybodyPacked = winners.length > 0 && winners[0].type === stateOfX.dealerChatReason[stateOfX.endingType.everybodyPacked];
        const isSingleWinner = !!params.data.isSingleWinner;

        let temp = '';
        if (isEverybodyPacked || isSingleWinner) {
            if (player.lastMove !== stateOfX.move.fold.toString()) {
                temp = player.state === stateOfX.move.fold.toString()
                    ? ` folded at ${player.lastRoundPlayed}`
                    : ` collected ${winners[0]?.winningAmount}`;
            } else {
                temp = ` folded at ${player.lastRoundPlayed}`;
            }
        } else {
            temp = player.lastMove !== stateOfX.move.fold.toString()
                ? ` showed [${params.summary.playerCards}] and`
                : ` folded at ${player.lastRoundPlayed}`;
        }

        params.summary.seatLevelText = (params.summary.seatLevelText || '') + temp;
        params.summary.seatLevelText2 = params.summary.seatLevelText;
        return params;
    }




    assignPlayerHands(params: any): any {
        const currentPlayerArr = params.summary.currentPlayer;
        if (!currentPlayerArr?.length) {
            return params;
        }

        const player = currentPlayerArr[0];
        if (!player.cards?.length) {
            return params;
        }

        const winners = params.summary.currentWinner || [];
        const isEverybodyPacked =
            winners.length > 0 &&
            winners[0].type ===
            stateOfX.dealerChatReason[stateOfX.endingType.everybodyPacked];
        const isSingleWinner = !!params.data.isSingleWinner;

        let temp = '';
        if (player.lastMove !== stateOfX.move.fold.toString()) {
            if (!isEverybodyPacked && !isSingleWinner) {
                const ranking = params.data.winnerRanking;
                if (ranking.winnerHigh) {
                    const high = _.find(ranking.winnerHigh, { playerId: player.playerId });
                    if (high) {
                        temp += ` has HI- ${high.text || high.type}`;
                    }
                    const loList = ranking.winnerLo;
                    if (loList) {
                        const lo = _.find(loList, { playerId: player.playerId });
                        if (lo) {
                            temp += `, LO- ${lo.text || lo.type}`;
                        }
                    }
                } else {
                    const t = _.find(ranking as any as any[], { playerId: player.playerId });
                    temp += t ? ` has ${t.text || t.type}` : ' has ';
                }
            } else {
                // Everybody packed OR single winner, no change to seatLevelText
            }
        }

        params.summary.seatLevelText = (params.summary.seatLevelText || '') + temp;
        return params;
    }



    assignPlayerHands2(params: any): any {
        const currentPlayerArr = params.summary.currentPlayer;
        if (!currentPlayerArr?.length) return params;

        const player = currentPlayerArr[0];
        if (!params.data.ritWinnerRanking) {
            params.summary.seatLevelText2 = "";
            return params;
        }

        if (!player.cards?.length || !player.isRunItTwice) {
            params.summary.seatLevelText2 = "";
            return params;
        }

        const winners = params.summary.currentWinner || [];
        const isEverybodyPacked =
            winners.length > 0 &&
            winners[0].type ===
            stateOfX.dealerChatReason[stateOfX.endingType.everybodyPacked];
        const isSingleWinner = !!params.data.isSingleWinner;

        if (!isEverybodyPacked && !isSingleWinner && player.lastMove !== stateOfX.move.fold.toString()) {
            let temp = "";
            const rit = params.data.ritWinnerRanking!;

            if (rit.winnerHigh) {
                const high = _.find(rit.winnerHigh, { playerId: player.playerId });
                if (high) {
                    temp += ` has HI- ${high.text || high.type}`;
                }
                if (rit.winnerLo) {
                    const lo = _.find(rit.winnerLo, { playerId: player.playerId });
                    if (lo) {
                        temp += `, LO- ${lo.text || lo.type}`;
                    }
                }
            } else {
                const t = _.find(
                    (params.data.ritWinnerRanking as any),
                    { playerId: player.playerId }
                );
                if (t) {
                    temp = ` has ${t.text || t.type}`;
                }
            }

            params.summary.seatLevelText2 = (params.summary.seatLevelText2 || "") + temp;
        }

        return params;
    }

    assignWinningText(params: any): any {
        const { summary, data, table } = params;
        if (!summary.currentPlayer) return params;

        const winners = summary.currentWinner || [];
        if (winners.length > 0) {
            let winnerText = "";

            const firstWinner = winners[0];
            const packedType = stateOfX.dealerChatReason[stateOfX.endingType.everybodyPacked];

            if (firstWinner.type !== packedType) {
                if (table.channelVariation !== stateOfX.channelVariation.omahahilo) {
                    const wds = _.filter(
                        data.winnerRanking,
                        { playerId: summary.currentPlayer[0].playerId }
                    );
                    if (wds[0]?.text) {
                        winnerText = wds[0].text;
                    }
                } else {
                    const rit = data.winnerRanking as any;
                    const hi = _.find(rit.winnerHigh, { playerId: summary.currentPlayer[0].playerId });
                    const lo = _.find(rit.winnerLo, { playerId: summary.currentPlayer[0].playerId });

                    if (hi?.text) {
                        winnerText += `HI: ${hi.text}`;
                    }
                    if (lo?.text) {
                        const loNames = _.map(lo.set, "name").join(",");
                        winnerText += `, LO: ${loNames}`;
                    }
                }
            } else {
                winnerText = firstWinner.type || "";
            }

            const amount = summary.winAmount ?? 0;
            summary.seatLevelText = `${summary.seatLevelText || ""} won ${amount} with ${winnerText}.`;
        }

        return params;
    }

    assignLooserText(params: any): any {
        const { summary, data, table } = params;

        const playerArr = summary.currentPlayer;
        if (!playerArr?.length) return params;

        const winners = summary.currentWinner || [];
        if (winners.length > 0) return params; // this player won, skip

        if (data.isSingleWinner) {
            summary.seatLevelText = (summary.seatLevelText || '') + ' lost.';
            return params;
        }

        const playerId = playerArr[0].playerId;
        let looserText = '';

        if (table.channelVariation !== stateOfX.channelVariation.omahahilo) {
            const details = _.filter(data.winnerRanking, { playerId });
            if (details[0]?.text) {
                looserText = details[0].text;
            }
        } else {
            // Omaha Hi-Lo variant
            const rit = data.winnerRanking as any;
            const hi = _.find(rit.winnerHigh, { playerId });
            const lo = _.find(rit.winnerLo, { playerId });

            if (hi?.text) {
                looserText = `HI: ${hi.text}`;
            }
            if (lo?.set) {
                const names = _.map(lo.set, 'name').join(',');
                looserText += looserText ? `, LO: ${names}` : `LO: ${names}`;
            }
        }

        const player = playerArr[0];
        if (player.lastMove !== stateOfX.move.fold.toString()) {
            summary.seatLevelText = (summary.seatLevelText || '') + ` lost with ${looserText}`;
        }

        return params;
    }



    refundText(params: any): any {
        let refundTotal = 0;
        let refundPlayerId: string | undefined;

        for (const w of params.data.winners) {
            if (w.isRefund) {
                refundTotal += w.winningAmount || 0;
                refundPlayerId = w.playerId;
            }
        }

        if (refundTotal > 0 && refundPlayerId) {
            const t = _.find(params.table.players, { playerId: refundPlayerId });
            const refundPlayerName = t ? t.playerName : 'a player';

            params.table.summaryOfAllPlayers.winners =
                (params.table.summaryOfAllPlayers.winners || '') +
                `\n${refundTotal} returned to ${refundPlayerName}.`;
        }

        return params;
    };

    winnerText(params: any): any {
        const { data, table, summary } = params;
        const winners = _.filter(data.winners, w => !w.isRefund);

        for (const winner of winners) {
            let text = '\n';
            const player = _.find(table.players, { playerId: winner.playerId });
            const name = player?.playerName ?? 'a player';

            text += `${name} won`;

            const ifHiLo = table.channelVariation === stateOfX.channelVariation.omahahilo;
            const ifTableRIT = table.isRunItTwiceApplied;
            const ifRIT = winner.isRit;

            if (winner.internalPotSplitIndex) {
                const arrPotSplit = Array.from(winner.internalPotSplitIndex);
                const potAmount = ifHiLo || ifTableRIT || ifRIT
                    ? this.utilsService.convertIntToDecimal(winner.winningAmount)
                    : Math.round(winner.winningAmount);

                const potLabel = ifHiLo && Array.isArray(winner.text) && !ifRIT ? " Lo-pot (" : ifHiLo ? " Hi-pot (" : " pot (";

                text += `${potLabel}${potAmount}) with ${winner.text}`;

                if (ifHiLo || ifTableRIT || ifRIT) {
                    const branch = arrPotSplit[1] === 1 ? this.lowerBranchText : this.upperBranchText;
                    text += ` - ${branch}`;
                }
            }

            text += '.';

            summary.summaryOfAllPlayers.winners =
                (summary.summaryOfAllPlayers.winners || '') + text;
        }

        return params;
    }

    assignWinnersText(params: any): any {
        if (params.data.winners && params.data.winners.length) {
            const validWinners = _.filter(params.data.winners, w => !w.isRefund);
            if (validWinners.length > 0) {
                params = refundText(params);
                params = winnerText(params);
            }
        }
        return params;
    }

    // update summary (for hand history) of each player at game over
    updateSummaryOfEachPlayer(params: any): any {
        if (!params || params.table.players.length === 0) {
            return params;
        }

        // Filter only players who started the hand
        const playedPlayers = params.table.players.filter(p =>
            params.table.onStartPlayers.includes(p.playerId)
        );

        const seatIndexArray = playedPlayers.map(p => p.seatIndex);

        // Initialize summaryOfAllPlayers hands placeholders
        params.table.summaryOfAllPlayers["hands1"] = params.table.summaryOfAllPlayers["hands1"] || "";
        params.table.summaryOfAllPlayers["hands2"] = params.table.summaryOfAllPlayers["hands2"] || "";

        for (const seatIndex of seatIndexArray) {
            params.summary = { seatIndex };
            // sequentially build summary for each player
            params = this.getCurrentPlayer(params);
            params = this.generateSeatLevelText(params);
            params = this.assignConfigDetails(params);
            params = this.getWinnerDetails(params);
            params = this.assignPlayerCardsAndText(params);
            params = this.assignPlayerHands(params);
            params = this.assignPlayerHands2(params);

            const text1 = params.summary.seatLevelText || "";
            const text2 = params.summary.seatLevelText2 || "";

            params.table.summaryOfAllPlayers[seatIndex] = text1;
            params.table.summaryOfAllPlayers["hands1"] += text1 ? `\n${text1}` : "";
            params.table.summaryOfAllPlayers["hands2"] += text2 ? `\n${text2}` : "";
        }

        // Post-processing after per-player summaries
        const wr = params.data.winnerRanking;
        if (wr && wr.winnerHigh && Array.isArray(wr.winnerLo) && wr.winnerLo.length === 0) {
            params.table.summaryOfAllPlayers["hands1"] += "\nThere is no low hand.";
        }
        const rwr = params.data.ritWinnerRanking;
        if (rwr && rwr.winnerHigh && Array.isArray(rwr.winnerLo) && rwr.winnerLo.length === 0) {
            params.table.summaryOfAllPlayers["hands2"] += "\nThere is no low hand.";
        }

        params = this.assignWinnersText(params);
        delete params.summary;

        return params;
    }







}