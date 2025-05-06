import { Injectable } from "@nestjs/common";
import _ld from "lodash";
import _ from 'underscore';
import { stateOfX, popupTextManager,systemConfig } from "shared/common";
import { TableManagerService } from "./tableManager.service";


// summaryRemote = require('./utils/summaryGenerator'),












@Injectable()
export class LogRemoteService {

    private popupTextManager = popupTextManager.falseMessages;

    constructor(
        private readonly tableManager: TableManagerService,
    ) { }


    convert(input: any): any {
        if (systemConfig.isDecimal === true) {
            return parseFloat(parseFloat(input.toString()).toFixed(2));
        } else {
            return Math.round(input);
        }
    };



    cardImg = {
        'd': " <img src = 'img_red_diamond'/>",
        's': " <img src = 'img_black_spade'/>",
        'h': " <img src = 'img_red_heart'/>",
        'c': " <img src = 'img_black_club'/>"
    };

    eventObj = {
        text: null
    }
    text = "";

    /*============================  START  =================================*/
    // ### Generate event log for Join Channel
    // New
    logJoinChannel(params: any): any {

        const playerIndexOnTable = _ld.findIndex(params.data.rawData.tableDetails.players, { playerId: params.data.rawData.playerId });
        let reJoinText = "";
        let spectatorText = params.data.rawData.tableDetails.channelType === stateOfX.gameType.tournament ? "" : " as spectator";

        if (params.data.rawData.isJoinedOnce) {
            reJoinText = "re-";
            spectatorText = "";
        }

        let text = params.data.rawData.playerName + " " + reJoinText + "joins the table" + spectatorText + ".";
        if (!params.data.rawData.isJoinWaiting) {
            text = '';
        }

        const eventObj = { text };
        params.table.handHistory.push(eventObj);

        return eventObj;
    };


    // Old
    // var logJoinChannel = function (params, cb) {
    //     console.log('logJoinChannel spectator', params.data.rawData, params);
    //     serverLog(stateOfX.serverLogType.info, 'in logRemote function logJoinChannel: ' + JSON.stringify(params.data.rawData));
    //     var playerIndexOnTable = _ld.findIndex(params.data.rawData.tableDetails.players, { playerId: params.data.rawData.playerId });
    //     var reJoinText = "";
    //     var spectatorText = params.data.rawData.tableDetails.channelType === stateOfX.gameType.tournament ? "" : " as spectator";
    //     if (params.data.rawData.isJoinedOnce /* || !params.data.rawData.isJoinWaiting */) {
    //         reJoinText = "re-"
    //         spectatorText = "";
    //     }
    //     text = params.data.rawData.playerName + " " + reJoinText + "joins the table" + spectatorText + ".";
    //     if (!params.data.rawData.isJoinWaiting) {
    //         text = '';
    //     }
    //     eventObj.text = text;
    //     params.table.handHistory.push(eventObj);
    //     cb(eventObj);
    // }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    // ### Generate event log for player Sit
    // New
    logSit(params: any): any {
        const text = `${params.data.rawData.playerName} sit on table with ${params.data.rawData.chips} points.`;
        const eventObj = { text };
        params.table.handHistory.push(eventObj);
        return eventObj;
    };


    // Old
    // var logSit = function (params, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'in logRemote function logSit');
    //     text = params.data.rawData.playerName + " sit on table with " + params.data.rawData.chips + " points.";
    //     eventObj.text = text;
    //     params.table.handHistory.push(eventObj);
    //     cb(eventObj);
    // }
    /*============================  END  =================================*/

    /*============================  START  =================================*/
    // ### Generate event log for player seat reserved
    // New
    logReserved(params: any): any {
        const text = `${params.data.rawData.playerName} Reserved seat number ${params.data.rawData.seatIndex}.`;
        const eventObj = { text };
        params.table.handHistory.push(eventObj);
        return eventObj;
    };


    // Old
    // var logReserved = function (params, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'in logRemote function logReserved');
    //     text = params.data.rawData.playerName + " Reserved seat number " + params.data.rawData.seatIndex + ".";
    //     eventObj.text = text;
    //     params.table.handHistory.push(eventObj);
    //     cb(eventObj);
    // }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    // Generate event log for table info when game starts
    // New
    logTableinfo(params: any): any {

        const currentTime = new Date(new Date().getTime() + 330 * 60 * 1000).toString().substring(0, 25);
        const gameType = params.data.rawData.isPotLimit ? 'Pot Limit' : 'No Limit';
        const currencyType = params.data.rawData.isRealMoney ? 'Real Points' : 'Points';
        const channelName = params.data.rawData.channelName;
        const dealerSeat = params.data.rawData.dealerSeatIndex;

        const text = `${stateOfX.gameDetails.name}: ${params.data.rawData.channelVariation} ${gameType} (${params.data.rawData.smallBlind}/${params.data.rawData.bigBlind}) - ${currentTime}
        ----------------Hand: # ${params.table.roundNumber}----------------
        ${channelName}(${currencyType}) 
        Seat #${dealerSeat} is the button.`;

        const eventObj = { text };
        params.table.handHistory.push(eventObj);

        return eventObj;
    };


    // Old
    // var logTableinfo = function (params, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'in logRemote function logTableinfo');
    //     text = stateOfX.gameDetails.name + ": " + params.data.rawData.channelVariation + " " + (params.data.rawData.isPotLimit ? "Pot Limit" : "No Limit") + " (" + params.data.rawData.smallBlind + "/" + params.data.rawData.bigBlind + ") - " + new Date(new Date().getTime() + 330 * 60 * 1000).toString().substring(0, 25); // put gameStartTime
    //     text = text + "\n----------------Hand: # " + params.table.roundNumber + "----------------\n";
    //     text = text + "\n" + params.data.rawData.channelName + "(" + (params.data.rawData.isRealMoney ? "Real Points" : "Points") + ") \nSeat #" + params.data.rawData.dealerSeatIndex + " is the button.";
    //     eventObj.text = text;
    //     params.table.handHistory.push(eventObj);
    //     cb(eventObj);
    // }
    /*============================  END  =================================*/



    /*============================  START  =================================*/
    // ### Generate event log for Start Game
    // New
    logStartGame(params: any): any {
        let forceBlindText = "";
        let text = "";

        for (const player of params.data.rawData.players) {
            const playerIndexOnTable = _ld.findIndex(params.table.players, { playerId: player.playerId });

            if (playerIndexOnTable >= 0) {
                player.chips = this.convert(player.chips) + this.convert(params.table.roundBets[playerIndexOnTable]);

                if (playerIndexOnTable !== params.table.smallBlindIndex && playerIndexOnTable !== params.table.bigBlindIndex && playerIndexOnTable !== params.table.straddleIndex) {
                    if (this.convert(params.table.roundBets[playerIndexOnTable]) > 0) {
                        forceBlindText = forceBlindText + player.playerName + " posted force blind " + this.convert(params.table.roundBets[playerIndexOnTable]) + ' and became part of the game.' + "\n";
                    } else {
                        console.log(stateOfX.serverLogType.info, player.playerName + ' hasn’t posted anything in pot yet, skipping force blind chat.');
                    }
                } else {
                    console.log(stateOfX.serverLogType.info, player.playerName + ' is either SB/BB/STRADDLE, skipping force blind chat.');
                }
            }

            text = text + "Seat " + player.seatIndex + ": " + player.playerName + " with points " + player.chips + ".\n";
        }

        if (params.table.smallBlindIndex >= 0) {
            if (params.data.rawData.blindDetails.smallBlind <= params.table.smallBlind) {
                text = text + params.data.rawData.blindDetails.smallBlindPlayerName + ": posts small blind " + params.data.rawData.blindDetails.smallBlind + ".\n";
            } else {
                text = text + params.data.rawData.blindDetails.smallBlindPlayerName + " posted force blind " + params.data.rawData.blindDetails.smallBlind + " and became part of the game.\nNo player posted small blind in this game.\n";
            }
        } else {
            text = text + "No player posted small blind in this game.";
        }

        text = text + params.data.rawData.blindDetails.bigBlindPlayerName + ": posts big blind " + params.data.rawData.blindDetails.bigBlind + ".\n";

        if (params.data.rawData.blindDetails.isStraddle) {
            text = text + params.data.rawData.blindDetails.straddlePlayerName + ": posts straddle amount " + params.data.rawData.blindDetails.straddle + ".\n";
        }

        if (!!forceBlindText) {
            text = text + forceBlindText + "\n";
        }

        text = text + '***' + stateOfX.round.holeCard + '***';
        const eventObj = { text };

        params.table.handHistory.push(eventObj);

        return eventObj;
    };


    // Old
    // var logStartGame = function (params, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'in logRemote function logStartGame - ' + JSON.stringify(params.data.rawData));
    //     var forceBlindText = "";
    //     async.each(params.data.rawData.players, function (player, ecb) {
    //         serverLog(stateOfX.serverLogType.info, 'Processing player while creating game start dealer chat - ' + JSON.stringify(player));
    //         var playerIndexOnTable = _ld.findIndex(params.table.players, { playerId: player.playerId });
    //         serverLog(stateOfX.serverLogType.info, 'Player index on table - ' + playerIndexOnTable);
    //         if (playerIndexOnTable >= 0) {
    //             serverLog(stateOfX.serverLogType.info, 'Previous chips of this player - ' + player.chips);
    //             serverLog(stateOfX.serverLogType.info, 'Bets posted on Game start - ' + params.table.roundBets);
    //             player.chips = convert.convert(player.chips) + convert.convert(params.table.roundBets[playerIndexOnTable])
    //             serverLog(stateOfX.serverLogType.info, 'Updated chips of this player - ' + player.chips);
    //             // Set force blind text if player is not SB/BB/STRADDLE
    //             if (playerIndexOnTable !== params.table.smallBlindIndex && playerIndexOnTable !== params.table.bigBlindIndex && playerIndexOnTable !== params.table.straddleIndex) {
    //                 serverLog(stateOfX.serverLogType.info, 'Bets posted by this player - ' + params.table.roundBets[playerIndexOnTable]);
    //                 if (convert.convert(params.table.roundBets[playerIndexOnTable]) > 0) {
    //                     forceBlindText = forceBlindText + player.playerName + " posted force blind " + convert.convert(params.table.roundBets[playerIndexOnTable]) + ' and become part of the game.' + "\n";
    //                 } else {
    //                     serverLog(stateOfX.serverLogType.info, player.playerName + ' hasnt posted anything in pot yet, skipping force blind chat.');
    //                 }
    //             } else {
    //                 serverLog(stateOfX.serverLogType.info, player.playerName + ' is either SB/BB/STRADDLE, skipping force blind chat.');
    //             }
    //         }
    //         text = text + "Seat " + player.seatIndex + ": " + player.playerName + " with points " + player.chips + ".\n";

    //         ecb();
    //     }, function (err) {
    //         if (!err) {
    //             if (params.table.smallBlindIndex >= 0) {
    //                 if (params.data.rawData.blindDetails.smallBlind <= params.table.smallBlind) {
    //                     text = text + params.data.rawData.blindDetails.smallBlindPlayerName + ": posts small blind " + params.data.rawData.blindDetails.smallBlind + ".\n";
    //                 } else {
    //                     text = text + params.data.rawData.blindDetails.smallBlindPlayerName + " posted force blind " + params.data.rawData.blindDetails.smallBlind + " and become part of the game.\nNo player posted small blind in this game.\n";
    //                 }
    //             } else {
    //                 text = text + "No player posted small blind in this game.";
    //             }
    //             text = text + params.data.rawData.blindDetails.bigBlindPlayerName + ": posts big blind " + params.data.rawData.blindDetails.bigBlind + ".\n";
    //             if (params.data.rawData.blindDetails.isStraddle) {
    //                 text = text + params.data.rawData.blindDetails.straddlePlayerName + ": posts straddle amount " + params.data.rawData.blindDetails.straddle + ".\n";
    //             }
    //             if (!!forceBlindText) {
    //                 text = text + forceBlindText + "\n";
    //             }
    //             text = text + '***' + stateOfX.round.holeCard + '***';
    //             eventObj.text = text;

    //             params.table.handHistory.push(eventObj);
    //             cb(eventObj);
    //         } else {
    //             cb({ success: false, channelId: (params.channelId || ""), info: popupTextManager.ASYNCEACH_LOGSTARTGAME_LOGREMOTE, isRetry: false, isDisplay: true })
    //             //cb({success: false, channelId: params.channelId, info: "Error while creating dealer chat on game start."})
    //         }
    //     });
    // }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    // ### Generate event log for Round Over
    // New
    logRoundOver(params: any): any {
        let cardText = "";

        for (let i = 0; i < params.table.boardCard[0].length; i++) {
            if (i >= 0 && i < 3) {
                if (i === 0) {
                    cardText += "[";
                }
                cardText += params.table.boardCard[0][i].name + this.cardImg[params.table.boardCard[0][i].type[0].toLowerCase()];

                if (i < 2) {
                    cardText += ", ";
                }
                if (i === 2) {
                    cardText += "]";
                }
            }

            if (i >= 3 && i < 4) {
                cardText += " [" + params.table.boardCard[0][i].name + this.cardImg[params.table.boardCard[0][i].type[0].toLowerCase()] + "]";
            }

            if (i >= 4 && i < 5) {
                cardText += " [" + params.table.boardCard[0][i].name + this.cardImg[params.table.boardCard[0][i].type[0].toLowerCase()] + "]";
            }
        }

        const text = "*** " + params.data.rawData.roundName + "*** Round starts " + cardText + ".";
        const eventObj = { text };

        params.table.handHistory.push(eventObj);

        return eventObj;
    };


    // Old
    // var logRoundOver = function (params, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'in logRemote function logRoundOver');
    //     var cardText = "";
    //     for (var i = 0; i < params.table.boardCard[0].length; i++) {
    //         if (i >= 0 && i < 3) {
    //             if (i == 0) {
    //                 cardText += "[";
    //             }
    //             cardText += params.table.boardCard[0][i].name + cardImg[params.table.boardCard[0][i].type[0].toLowerCase()];

    //             if (i < 2) {
    //                 cardText += ", ";
    //             }
    //             if (i == 2) {
    //                 cardText += "]";
    //             }
    //         }

    //         if (i >= 3 && i < 4) {
    //             cardText += " [" + params.table.boardCard[0][i].name + cardImg[params.table.boardCard[0][i].type[0].toLowerCase()] + "]";
    //         }

    //         if (i >= 4 && i < 5) {
    //             cardText += " [" + params.table.boardCard[0][i].name + cardImg[params.table.boardCard[0][i].type[0].toLowerCase()] + "]";
    //         }
    //     }

    //     text = "*** " + params.data.rawData.roundName + "*** Round starts " + cardText + "."
    //     eventObj.text = text;

    //     params.table.handHistory.push(eventObj);
    //     cb(eventObj);
    // }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    // ### Generate event log for Player Turn
    // New
    logPlayerTurn(params: any): any {
        let text = `${params.data.rawData.playerName} ${stateOfX.delaerChatMove[params.data.rawData.actionName]}`;

        switch (params.data.rawData.actionName) {
            case stateOfX.move.check:
            case stateOfX.move.fold:
                text += ".";
                break;
            default:
                text += ` ${params.data.rawData.amount}.`;
        }

        const eventObj = { text };
        params.table.handHistory.push(eventObj);

        console.log('logPlayerTurn end', params.data.rawData.playerName);

        return eventObj;
    };


    // Old
    // var logPlayerTurn = function (params, cb) {
    //     console.log('logPlayerTurn begin', params.data.rawData.playerName);
    //     serverLog(stateOfX.serverLogType.info, 'in logRemote function logPlayerTurn');
    //     text = params.data.rawData.playerName + " " + stateOfX.delaerChatMove[params.data.rawData.actionName];
    //     switch (params.data.rawData.actionName) {
    //         case stateOfX.move.check:
    //         case stateOfX.move.fold:
    //             text = text + ".";
    //             break;
    //         default: text = text + " " + params.data.rawData.amount + "."
    //     }
    //     eventObj.text = text;
    //     params.table.handHistory.push(eventObj);
    //     console.log('logPlayerTurn end', params.data.rawData.playerName);
    //     cb(eventObj);
    // }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    // ### Generate event log for Leave player
    // New
    logLeave(params: any): any {
        const text = `${params.data.rawData.playerName} left the table and game.`;
        const eventObj = { text };

        params.table.handHistory.push(eventObj);

        return eventObj;
    };


    // Old
    // var logLeave = function (params, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'in logRemote function logLeave');
    //     text = params.data.rawData.playerName + " left the table and game."
    //     eventObj.text = text;
    //     params.table.handHistory.push(eventObj);
    //     cb(eventObj);
    // }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    // ### Generate event log for Ev Chop
    // New
    logEvChop(params: any): any {
        if (!params.table.handHistory.some(e => e.text.includes(" EV broadcast"))) {
            let text = " EV broadcast sent to players named ";

            params.table?.allInPLayerCardsCards?.forEach((card, i) => {
                const evPlayer = params.table.players.find(e => e.playerId === card.playerId);
                if (evPlayer) {
                    text += (i === params.table?.allInPLayerCardsCards.length - 1)
                        ? evPlayer.playerName
                        : `${evPlayer.playerName}, `;
                }
            });

            const eventObj = { text };
            params.table.handHistory.push(eventObj);

            return eventObj;
        }

        return null;
    };


    // Old
    // var logEvChop = function (params, cb) {
    //     if (!params.table.handHistory.find(e => e.text.includes(" EV broadcast"))) {
    //         text = " EV broadcast sent to players named "
    //         for (let i = 0; i < params.table?.allInPLayerCardsCards?.length; i++) {
    //             const evPlayer = params.table.players.find(e => e.playerId === params.table.allInPLayerCardsCards[i].playerId);
    //             if (evPlayer) {
    //                 text += i == params.table?.allInPLayerCardsCards.length - 1 ? evPlayer.playerName : `${evPlayer.playerName}, `;
    //             }
    //         }
    //         eventObj.text = text;
    //         params.table.handHistory.push(eventObj);
    //         cb(eventObj);
    //     }
    //     else {
    //         cb(eventObj);
    //     }
    // }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    // ### Generate event log for Ev Chop
    // New
    logEvRIT(params: any): any {
        if (!params.table.handHistory.some(e => e.text.includes(" RIT broadcast"))) {
            let text = " RIT broadcast sent to players named ";

            params.table?.allInPLayerCardsCards?.forEach((card, i) => {
                const evPlayer = params.table.players.find(e => e.playerId === card.playerId);
                if (evPlayer) {
                    text += (i === params.table?.allInPLayerCardsCards.length - 1)
                        ? evPlayer.playerName
                        : `${evPlayer.playerName}, `;
                }
            });

            const eventObj = { text };
            params.table.handHistory.push(eventObj);

            return eventObj;
        }

        return null;
    };


    // Old
    // var logEvRIT = function (params, cb) {
    //     if (!params.table.handHistory.find(e => e.text.includes(" RIT broadcast"))) {
    //         text = " RIT broadcast sent to players named "
    //         for (let i = 0; i < params.table?.allInPLayerCardsCards?.length; i++) {
    //             const evPlayer = params.table.players.find(e => e.playerId === params.table.allInPLayerCardsCards[i].playerId);
    //             if (evPlayer) {
    //                 text += i == params.table?.allInPLayerCardsCards.length - 1 ? evPlayer.playerName : `${evPlayer.playerName}, `;
    //             }
    //         }
    //         eventObj.text = text;
    //         params.table.handHistory.push(eventObj);
    //         cb(eventObj);
    //     }
    //     else {
    //         cb(eventObj);
    //     }
    // }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    // ### Generate event log for Game Over
    // New
    logGameOver(params: any): any {

        params.data.rawData.winners = _.sortBy(params.data.rawData.winners, 'potIndex').reverse();
        let playerIndex = -1;
        let playerCards = null;
        let counter = 0;
        let text = '*** ' + stateOfX.round.showdown + ' ***\n';

        params.data.rawData.winners.forEach((winner: any) => {
            playerIndex = _ld.findIndex(params.table.players, { playerId: winner.playerId });

            if (playerIndex >= 0) {

                if (counter !== 0) {
                    text = playerCards ? text + "\n" : text;
                }

                text = playerCards ? text + params.table.players[playerIndex].playerName + ': shows [' + playerCards + '] ( ' + winner.type + ' ).' : text;
                text = text + params.table.players[playerIndex].playerName + ' collected ' + (this.convert(winner.amount) || 0) + ' from pot -> ' + (winner.potIndex + 1);
            } else {
                console.log(stateOfX.serverLogType.info, 'Winner not found while generating Game Over / SHOWDOWN dealer chat.');
            }
            counter++;
        });

        const eventObj = { text };
        params.table.handHistory.push(eventObj);

        return eventObj;
    };


    // Old
    // var logGameOver = function (params, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'in logRemote function logGameOver - ' + JSON.stringify(params.data.rawData));
    //     params.data.rawData.winners = _.sortBy(params.data.rawData.winners, 'potIndex').reverse();
    //     var playerIndex = -1;
    //     var playerCards = null;
    //     var counter = 0;
    //     text = text + '*** ' + stateOfX.round.showdown + ' ***\n';
    //     async.each(params.data.rawData.winners, function (winner, ecb) {
    //         serverLog(stateOfX.serverLogType.info, 'Processing winner while generating SHOWDOWN dealer chat: ' + JSON.stringify(winner));
    //         playerIndex = _ld.findIndex(params.table.players, { playerId: winner.playerId });
    //         if (playerIndex >= 0) {
    //             serverLog(stateOfX.serverLogType.info, "params.data.rawData.cardsToShow - " + JSON.stringify(params.data.rawData.cardsToShow));
    //             //playerCards = !!params.data.rawData.cardsToShow ? params.data.rawData.cardsToShow[winner.playerId][0].name + "" + cardImg[params.data.rawData.cardsToShow[winner.playerId][0].type[0].toLowerCase()] + " " + params.data.rawData.cardsToShow[winner.playerId][1].name + "" + cardImg[params.data.rawData.cardsToShow[winner.playerId][1].type[0].toLowerCase()] : null;
    //             if (counter != 0) {
    //                 text = !!playerCards ? text + "\n" : text;
    //             }
    //             text = !!playerCards ? text + params.table.players[playerIndex].playerName + ': shows [' + playerCards + '] ( ' + winner.type + ' ).' : text;
    //             text = text + params.table.players[playerIndex].playerName + ' collected ' + (convert.convert(winner.amount) || 0) + ' from pot -> ' + (winner.potIndex + 1);
    //         } else {
    //             serverLog(stateOfX.serverLogType.info, 'Winner not found while generating Game Over / SHOWDOWN dealer chat.');
    //         }
    //         counter++;
    //         ecb();
    //     }, function (err) {
    //         if (err) {
    //             cb(err);
    //         } else {
    //             eventObj.text = text;
    //             params.table.handHistory.push(eventObj);
    //             cb(eventObj);
    //         }
    //     });
    // }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    // ### Generate event log for Summary
    // New
    async logSummary(params: any): Promise<any> {
        const summaryHeadLine = "\nSummary of the game is as follows -";
        let text = "";

        if (params.table.evChopDetails) {
            const evObj = { text: 'EV Tags: [' };
            const resumeObj = { text: 'Resume Tags: [' };
            const evRITObj = { text: 'RIT Accepted by : [' };

            let isEvHappen = false;
            let isResumeHappen = false;
            let isRITHappen = false;

            params.table.evChopDetails.forEach((evPlayer, i) => {
                if (evPlayer.evChop) {
                    evObj.text += `${evPlayer.userName}${i === params.table.evChopDetails.length - 1 ? '' : ','}`;
                    isEvHappen = true;
                } else {
                    resumeObj.text += `${evPlayer.userName}${i === params.table.evChopDetails.length - 1 ? '' : ','}`;
                    isResumeHappen = true;
                }
            });

            params.table.players.forEach((ritPlayer, i) => {
                if (ritPlayer.evRIT) {
                    evRITObj.text += `${ritPlayer.playerName}${i === params.table.players.length - 1 ? '' : ','}`;
                    isRITHappen = true;
                }
            });

            evObj.text += ']';
            resumeObj.text += ']';
            evRITObj.text += ']';

            if (isEvHappen) params.table.handHistory.push(evObj);
            if (isResumeHappen) params.table.handHistory.push(resumeObj);
            if (isRITHappen) params.table.handHistory.push(evRITObj);
        }

        const previousTexts = params.table.handHistory.map(item => item.text);
        previousTexts.forEach(textItem => {
            if (textItem) {
                text += `\n${textItem}`;
            }
        });

        const summary = text + summaryHeadLine;
        const seatSummaryResponse = await this.summaryRemote.generateSummary(params);
        const finalSummary = summary + seatSummaryResponse;

        await this.tableManager.insertHandHistory(params, finalSummary);

        return {
            handTab: finalSummary,
            text: summaryHeadLine + seatSummaryResponse
        };
    };

    // Old
    // var logSummary = function (params, cb) {
    //     // console.log('logSummary potA ', params, params.table);
    //     serverLog(stateOfX.serverLogType.info, 'in logRemote function logSummary');
    //     serverLog(stateOfX.serverLogType.info, "in logSummary params is" + params);
    //     serverLog(stateOfX.serverLogType.info, "in logSummary params.table.pot is" + params.table.pot);
    //     serverLog(stateOfX.serverLogType.info, "handHistory is" + params.table.handHistory);
    //     // console.log('logSummary potA  params.table.handHistory b ', params.table.handHistory);

    //     var summaryHeadLine = "\nSummary of the game is as follows -";
    //     var text = "";
    //     if (params?.table?.evChopDetails) {
    //         const evObj = {
    //             'text': 'EV Tags: ['
    //         };
    //         const resumeObj = {
    //             'text': 'Resume Tags: ['
    //         };
    //         const evRITObj = {
    //             'text': 'RIT Accepted by : ['
    //         }
    //         let isEvHappen = false; let isResumeHappen = false; let isRITHappen = false;
    //         for (let i = 0; i < params.table.evChopDetails.length; i++) {
    //             const evPlayer = params.table.evChopDetails[i]
    //             if (evPlayer.evChop) {
    //                 evObj['text'] += (i == params.table.evChopDetails.length - 1 ? evPlayer.userName : `${evPlayer.userName},`);
    //                 isEvHappen = true;
    //             }
    //             else {
    //                 resumeObj['text'] += (i == params.table.evChopDetails.length - 1 ? evPlayer.userName : `${evPlayer.userName},`);
    //                 isResumeHappen = true;
    //             }
    //         }

    //         for (let i = 0; i < params.table.players.length; i++) {
    //             const ritPlayer = params.table.players[i];
    //             if (ritPlayer.evRIT) {
    //                 evRITObj['text'] += (i == params.table.players.length - 1 ? ritPlayer.playerName : `${ritPlayer.playerName},`);
    //                 isRITHappen = true;
    //             }
    //         }

    //         evObj['text'] += ']';
    //         resumeObj['text'] += ']'
    //         evRITObj['text'] += ']';

    //         if (isEvHappen) params.table.handHistory.push(evObj);
    //         if (isResumeHappen) params.table.handHistory.push(resumeObj);
    //         if (isRITHappen) params.table.handHistory.push(evRITObj);

    //     }

    //     var previousTexts = _.pluck(params.table.handHistory, 'text');
    //     // console.log("previousTextspreviousTexts",previousTexts[0])
    //     if (previousTexts.length > 0) {
    //         for (var i = 0; i < previousTexts.length; i++) {
    //             serverLog(stateOfX.serverLogType.info, 'Processing text: ' + previousTexts[i]);
    //             if (previousTexts[i]) {
    //                 text += "\n" + previousTexts[i];
    //                 console.log("inside iffffffffffffffffff", previousTexts[i])
    //             }
    //         }
    //     }
    //     serverLog(stateOfX.serverLogType.info, 'Updated text: ' + previousTexts[i]);
    //     // console.log('logSummary potA text b ',text);
    //     var summary = text + summaryHeadLine;
    //     serverLog(stateOfX.serverLogType.info, "text in summary - " + summary);
    //     summaryRemote.generateSummary(params, function (seatSummaryResponse) {
    //         serverLog(stateOfX.serverLogType.info, "summary in logSummary - " + seatSummaryResponse);
    //         summary += seatSummaryResponse;
    //         serverLog(stateOfX.serverLogType.info, "final summary generated is - " + summary);
    //         // console.log("sending Summary", summary)
    //         tableManager.insertHandHistory(params, summary, function (err, result) {
    //             if (err) {
    //                 cb({ success: false, channelId: (params.channelId || ""), info: popupTextManager.TABLEMANAGERINSERTHANDHISTORY_SUMMARYREMOTEGENERATESUMMARY_LOGSUMMARY_LOGREMOTE, isRetry: false, isDisplay: true });
    //             } else {
    //                 eventObj.handTab = result.value;
    //                 serverLog(stateOfX.serverLogType.info, "eventObj in summary - " + summary);
    //                 eventObj.text = summaryHeadLine + seatSummaryResponse;
    //                 cb(eventObj);
    //             }
    //         })
    //     });
    // }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    // Generate log text acc to event
    // New
    async createLogOnEvent(params: any): Promise<any> {
        try {
            switch (params.data.eventName) {
                case stateOfX.logEvents.joinChannel:
                    return await this.logJoinChannel(params);
                case stateOfX.logEvents.reserved:
                    return await this.logReserved(params);
                case stateOfX.logEvents.sit:
                    return await this.logSit(params);
                case stateOfX.logEvents.tableInfo:
                    return await this.logTableinfo(params);
                case stateOfX.logEvents.startGame:
                    return await this.logStartGame(params);
                case stateOfX.logEvents.playerTurn:
                    return await this.logPlayerTurn(params);
                case stateOfX.logEvents.leave:
                    return await this.logLeave(params);
                case stateOfX.logEvents.roundOver:
                    return await this.logRoundOver(params);
                case stateOfX.logEvents.gameOver:
                    return await this.logGameOver(params);
                case stateOfX.logEvents.evChop:
                    return await this.logEvChop(params);
                case stateOfX.logEvents.evRIT:
                    return await this.logEvRIT(params);
                case stateOfX.logEvents.summary:
                    return await this.logSummary(params);
                default:
                    console.log(stateOfX.serverLogType.info, 'No event log for this event.');
                    return {
                        success: false,
                        channelId: params.channelId || '',
                        info: this.popupTextManager.CREATELOGONEVENT_LOGREMOTE,
                        isRetry: false,
                        isDisplay: true,
                    };
            }
        } catch (error) {
            console.log(stateOfX.serverLogType.error, `Error in createLogOnEvent: ${error}`);
            return {
                success: false,
                channelId: params.channelId || '',
                info: this.popupTextManager.CREATELOGONEVENT_LOGREMOTE,
                isRetry: false,
                isDisplay: true,
            };
        }
    };

    // Old
    // var createLogOnEvent = function (params, cb) {
    //     // console.log("createLogOnEvent h", params.data.eventName, params.table.handHistory)
    //     switch (params.data.eventName) {
    //         case stateOfX.logEvents.joinChannel: logJoinChannel(params, function (eventResponse) { cb(eventResponse) }); break;
    //         case stateOfX.logEvents.reserved: logReserved(params, function (eventResponse) { cb(eventResponse) }); break;
    //         case stateOfX.logEvents.sit: logSit(params, function (eventResponse) { cb(eventResponse) }); break;
    //         case stateOfX.logEvents.tableInfo: logTableinfo(params, function (eventResponse) { cb(eventResponse) }); break;
    //         case stateOfX.logEvents.startGame: logStartGame(params, function (eventResponse) { cb(eventResponse) }); break;
    //         case stateOfX.logEvents.playerTurn: logPlayerTurn(params, function (eventResponse) { cb(eventResponse) }); break;
    //         case stateOfX.logEvents.leave: logLeave(params, function (eventResponse) { cb(eventResponse) }); break;
    //         case stateOfX.logEvents.roundOver: logRoundOver(params, function (eventResponse) { cb(eventResponse) }); break;
    //         case stateOfX.logEvents.gameOver: logGameOver(params, function (eventResponse) { cb(eventResponse) }); break;
    //         case stateOfX.logEvents.evChop: logEvChop(params, function (eventResponse) { cb(eventResponse) }); break;
    //         case stateOfX.logEvents.evRIT: logEvRIT(params, function (eventResponse) { cb(eventResponse) }); break;
    //         case stateOfX.logEvents.summary: logSummary(params, function (eventResponse) { cb(eventResponse) }); break;
    //         default: serverLog(stateOfX.serverLogType.info, 'No event log for this event.');
    //             cb({ success: false, channelId: (params.channelId || ""), info: popupTextManager.CREATELOGONEVENT_LOGREMOTE, isRetry: false, isDisplay: true }); break;
    //     }
    // }
    /*============================  END  =================================*/



    /*============================  START  =================================*/
    // ### Handle all cases to generate log text
    // used in hand history
    // > Params: {self, channelId, table, data {channelId, playerId, amount, action, isRequested}, table}
    // New
    async generateLog(params: any): Promise<any> {

        // Omit 'self' from params and initialize rawData
        params = _.omit(params, 'self');
        params.rawData = '';

        try {
            // Await the response from createLogOnEvent
            const createLogOnEventResponse = await this.createLogOnEvent(params);

            // Update params.data with the response
            params.data.text = createLogOnEventResponse.text;
            params.data.handTab = createLogOnEventResponse.handTab;

            // Return the final response
            return {
                success: true,
                table: params.table,
                data: params.data,
            };
        } catch (error) {
            // Handle any errors that occur during the process
            console.log(stateOfX.serverLogType.error, `Error in generateLog: ${error}`);
            return {
                success: false,
                table: params.table,
                data: params.data,
            };
        }
    };

    // Old
    // logRemote.generateLog = function (params, cb) {
    //         console.log('generateLog logRemote.generateLog', params);
    //         serverLog(stateOfX.serverLogType.info, 'in logRemote function generateLog');
    //         params = _.omit(params, 'self');
    //         params.rawData = ""
    //         createLogOnEvent(params, function (createLogOnEventResponse) {
    //             text = "";
    //             params.data.text = createLogOnEventResponse.text;
    //             params.data.handTab = createLogOnEventResponse.handTab;
    //             cb({ success: true, table: params.table, data: params.data });
    //         });
    //     };
    /*============================  END  =================================*/





















}