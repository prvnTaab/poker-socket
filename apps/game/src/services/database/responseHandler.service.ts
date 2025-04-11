import { Injectable } from "@nestjs/common";
import { stateOfX, systemConfig } from "shared/common";
import _ from 'underscore';
import _ld from 'lodash';
import async from "async";
import { convertIntToDecimal as convert } from "shared/common";
import tableManager from "./tableManager";



@Injectable()
export class ResponseHandlerService {
    
    constructor(){

    }

    // Generate response for any action performed
    setActionKeys = async function(params: any) {
        const res: any = {};
        res.success = true;
        res.isGameOver = params.data.isGameOver;
        res.table = params.table;
        res.data = params.data;
        res.data.success = true;
        res.data.response = {};
        res.data.response.success = true;
        res.data.response.shouldCallActionHandler = params.shouldCallActionHandler;
        res.data.response.channelId = params.data.channelId;
        res.data.response.channelType = params.table.channelType;
        res.data.response.isGameOver = params.data.isGameOver;
        res.data.response.loyalityList = params.data.loyalityList;
        res.data.response.megaPointsResult = params.data.megaPointsResult;
        res.data.response.allInCards = params.data.allInCards;
        res.data.response.isCurrentPlayer = params.data.isCurrentPlayer;
        res.data.response.points = params.data.player ? params.data.player.points : (params.data.leavePoints ? params.data.leavePoints : {});
        res.data.response.leaveChips = params.data.leaveChips ? params.data.leaveChips : 0;
        res.data.response.isRoundOver = params.data.roundOver;
        res.data.response.playerLength = params.table.players.length;
        
        // ROE data
        res.data.response.isROE = params.table.isROE;
        res.data.response.channelRound = params.table.channelRound;
        res.data.response.channelRoundCount = params.table.channelRoundCount;
        res.data.response.maxPlayers = params.table.maxPlayers;
        res.data.response.channelVariation = params.table.channelVariation;
    
        // Tournament specific data
        if(params.table.channelType === stateOfX.gameType.tournament) {
            res.data.response.tournamentRules = params.table.tournamentRules;
            res.data.response.bountyWinner = params.data.bountyWinner;
        }
    
        // Leave or standup specific data
        if((params.data.action === stateOfX.move.standup || params.data.action === stateOfX.move.leave) && params.table.channelType === stateOfX.gameType.normal) {
            res.data.response.isSeatsAvailable = params.table.maxPlayers !== params.table.players.length;
            res.data.response.broadcast = {
                success: true,
                channelId: params.data.channelId,
                playerId: params.data.playerId,
                playerName: params.data.playerName,
                isStandup: params.data.action === stateOfX.move.standup
            };
            res.data.response.chips = {
                freeChips: params.data.freeChips,
                realChips: params.data.realChips
            };
        }
    
        const refundPot = _.filter(params.table.pot, (item: any) => item.contributors.length == 1);
        
        // Turn data
        res.data.response.turn = {
            success: true,
            channelId: params.data.channelId,
            isPotLimit: params.table.isPotLimit,
            runBy: params.data.runBy || "none",
            playerId: params.data.playerId,
            playerName: params.data.playerName,
            amount: params.data.amount,
            action: (params.table.channelType === stateOfX.gameType.tournament && (params.data.action === stateOfX.move.standup || params.data.action === stateOfX.move.leave)) ? stateOfX.move.fold : params.data.action,
            chips: params.data.chips,
            isRoundOver: params.data.roundOver,
            roundName: params.data.isGameOver ? stateOfX.round.showdown : params.table.roundName,
            pot: _.pluck(_.filter(params.table.pot, (item: any) => item.contributors.length > 1), 'amount'),
            currentMoveIndex: params.data.isGameOver ? "" : params.table.players[params.table.currentMoveIndex].seatIndex,
            moves: params.data.isGameOver ? [] : params.table.players[params.table.currentMoveIndex].moves,
            totalRoundBet: params.data.isGameOver || params.data.action === stateOfX.move.standup || params.data.action === stateOfX.move.leave ? 0 : params.table.players[params.data.index].totalRoundBet,
            lastPlayerBet: params.data.roundOver ? (params.data.action === stateOfX.move.standup || params.data.action === stateOfX.move.leave ? 0 : params.data.considerAmount) : 0,
            roundMaxBet: params.table.roundMaxBet,
            minRaiseAmount: params.table.minRaiseAmount,
            maxRaiseAmount: params.table.maxRaiseAmount,
            totalPot: tableManager.getTotalPot(_.filter(params.table.pot, (item: any) => item.contributors.length > 1)) + tableManager.getTotalBet(params.table.roundBets),
            refundPot: refundPot.length ? {playerId: refundPot[0].contributors[0], amount: refundPot[0].amount} : null
        };
    
        // Stack sizes
        res.data.response.largestStack = _.max(params.table.players, (player: any) => player.chips).chips;
        res.data.response.smallestStack = _.min(params.table.players, (player: any) => player.chips).chips;
    
        // Blind updates
        res.data.response.isBlindUpdated = !!params.data.isBlindUpdated ? params.data.isBlindUpdated : false;
        if(params.data.isBlindUpdated) {
            res.data.response.newBlinds = params.data.newBlinds;
        }
    
        // Round data
        res.data.response.round = {
            success: true,
            channelId: params.data.channelId,
            roundName: params.data.isGameOver ? stateOfX.round.showdown : params.table.roundName,
            boardCard: params.data.currentBoardCard
        };
    
        // Flop percentage
        res.data.response.flopPercent = !!params.data.flopPercent ? parseInt(params.data.flopPercent) : -1;
    
        // Game over data
        res.data.response.over = {
            success: true,
            channelId: params.data.channelId,
            endingType: !!params.data.endingType ? params.data.endingType : stateOfX.endingType.gameComplete,
            winners: params.data.winners,
            rakeDeducted: params.data.rakeDeducted,
            winnerRanking: params.data.winnerRanking,
            cardsToShow: params.data.cardsToShow,
            chipsBroadcast: params.data.chipsBroadcast,
            addChipsFailed: params.data.addChipsFailed
        };
    
        // Average pot
        res.data.response.avgPot = !!params.data.avgPot ? parseInt(params.data.avgPot) : -1;
    
        // Prechecks
        res.data.response.preChecks = params.table.preChecks;
    
        // Best hands
        res.data.response.bestHands = params.table.bestHands;
    
        const finalParams = res;
    
        // Clean up
        delete finalParams.data.cardsToShow;
        delete finalParams.data.rakeDeducted;
        return res;
    };
    
    // Generate response for Game start broadcast
    setGameStartKeys = async function(params: any) {
        const res: any = {};
        res.success = true;
    
        // Adjust blind indices if needed
        if(params.table.smallBlindIndex >= params.table.players.length && (params.table.smallBlindIndex - 1) >= 0) {
            params.table.smallBlindIndex -= 1;
            if((params.table.bigBlindIndex - 1) >= 0) {
                params.table.bigBlindIndex -= 1;
            }
        }
    
        if(params.table.bigBlindIndex >= params.table.players.length && (params.table.bigBlindIndex - 1) >= 0) {
            params.table.bigBlindIndex -= 1;
            if((params.table.smallBlindIndex - 1) >= 0) {
                params.table.smallBlindIndex -= 1;
            }
        }
    
        // Config data
        res.config = {
            channelId: params.channelId,
            roundId: params.table.roundId,
            roundNumber: params.table.roundNumber,
            dealerIndex: params.table.dealerSeatIndex,
            smallBlindIndex: params.table.smallBlindSeatIndex,
            bigBlindIndex: params.table.players && params.table.players[params.table.bigBlindIndex].seatIndex || 0,
            straddleIndex: (params.table.straddleIndex > -1 && !!params.table.players[params.table.straddleIndex]) ? params.table.players[params.table.straddleIndex].seatIndex : -1,
            currentMoveIndex: params.table.players[params.table.currentMoveIndex].seatIndex,
            moves: params.table.players[params.table.currentMoveIndex].moves,
            smallBlind: params.table.smallBlindIndex >= 0 ? params.table.roundBets[params.table.smallBlindIndex] : 0,
            bigBlind: params.table.roundBets[params.table.bigBlindIndex],
            pot: _.pluck(params.table.pot, 'amount'),
            roundMaxBet: params.table.roundMaxBet,
            state: params.table.state,
            roundName: params.table.roundName,
            minRaiseAmount: params.table.minRaiseAmount,
            maxRaiseAmount: params.table.maxRaiseAmount,
            totalPot: tableManager.getTotalPot(params.table.pot) + tableManager.getTotalBet(params.table.roundBets)
        };
    
        // Event details
        res.eventDetails = {
            players: _.map(_.filter(params.table.players, (player: any) => {
                return player.state == stateOfX.playerState.playing ||
                    player.state == stateOfX.playerState.disconnected ||
                    (player.state == stateOfX.playerState.onBreak && 
                    (params.table.isCTEnabledTable && player.playerScore > 0 &&
                    ((player.playerCallTimer.status === false) || 
                    (player.playerCallTimer.status === true && !(player.playerCallTimer.isCallTimeOver)))));
            })),
            blindDetails: {
                isStraddle: params.table.straddleIndex >= 0,
                smallBlindPlayerName: params.table.smallBlindIndex >= 0 ? params.table.players[params.table.smallBlindIndex].playerName : "No SB",
                bigBlindPlayerName: params.table.players[params.table.bigBlindIndex].playerName,
                straddlePlayerName: (params.table.straddleIndex > -1 && !!params.table.players[params.table.straddleIndex]) ? params.table.players[params.table.straddleIndex].playerName : "",
                smallBlind: params.table.smallBlindIndex >= 0 ? params.table.roundBets[params.table.smallBlindIndex] : 0,
                bigBlind: params.table.roundBets[params.table.bigBlindIndex],
                straddle: params.table.straddleIndex > -1 ? params.table.roundBets[params.table.straddleIndex] : -1
            },
            tableDetails: {
                channelVariation: params.table.channelVariation,
                isPotLimit: params.table.isPotLimit,
                isRealMoney: params.table.isRealMoney,
                channelName: params.table.channelName,
                smallBlind: params.table.smallBlind,
                bigBlind: params.table.bigBlind,
                dealerSeatIndex: params.table.dealerSeatIndex
            }
        };
    
        // Check for players to remove due to missed blinds
        res.removed = [];
        for (const player of params.table.players) {
            if(player.roundMissed > systemConfig.roundMissedPlayerLeave) {
                res.removed.push({
                    playerId: player.playerId,
                    channelId: params.channelId,
                    isStandup: true,
                    isRequested: false,
                    playerName: player.playerName
                });
            }
        }
    
        return res;
    };
    
    // Generate blind deduction response
    setDeductBlindKeys = async function(params: any) {
        const res: any = {};
        res.success = true;
        res.table = params.table;
        res.data = {
            success: true,
            channelId: params.channelId,
            smallBlindChips: params.table.smallBlindIndex >= 0 ? params.table.players[params.table.smallBlindIndex].chips : 0,
            bigBlindChips: params.table.players[params.table.bigBlindIndex].chips,
            straddleChips: params.table.straddleIndex >= 0 ? params.table.players[params.table.straddleIndex].chips : -1,
            smallBlindIndex: params.table.smallBlindSeatIndex,
            bigBlindIndex: params.table.players[params.table.bigBlindIndex].seatIndex,
            straddleIndex: params.table.straddleIndex >= 0 ? params.table.players[params.table.straddleIndex].seatIndex : -1,
            smallBlind: params.table.smallBlindIndex >= 0 ? params.table.roundBets[params.table.smallBlindIndex] : 0,
            bigBlind: params.table.roundBets[params.table.bigBlindIndex],
            pot: _.pluck(params.table.pot, 'amount'),
            totalPot: tableManager.getTotalPot(params.table.pot) + tableManager.getTotalBet(params.table.roundBets),
            moves: params.table.players[params.table.currentMoveIndex].moves,
            forceBlind: params.data.forceBlind,
            tableSmallBlind: params.table.smallBlind,
            tableBigBlind: params.table.bigBlind
        };
        return res;
    };
    
    // Generate table view response
   setTableViewKeys = async function(params: any) {
        
        if(params.table.isROE) {
            params.table.channelVariation = stateOfX.channelVariation.roe;
        }
    
        const res: any = {};
        const tableObj: any = {};
        res.success = true;
        res.channelId = params.channelId;
        res.isTableFull = (!!params.table && !!params.table.players && !!params.table.queueList) && 
                         (params.table.players.length + params.table.queueList.length >= params.table.maxPlayers);
        res.isJoinedWaitingList = (!!params.table && !!params.table.queueList) && 
                                (_ld.findIndex(params.table.queueList, {playerId: params.playerId}) >= 0);
        res.isAlreadyPlaying = (!!params.table && !!params.table.players) && 
                             (_ld.findIndex(params.table.players, {playerId: params.playerId}) >= 0);
        res.players = [];
        res.waitingPlayer = params.table.queueList;
    
        // Table configuration data
        tableObj.channelName = params.table.channelName;
        tableObj.channelVariation = this.getchannelVariation(params.table.channelVariation);
        tableObj.isRealMoney = params.table.isRealMoney ? "Real Points" : "Points";
        tableObj.buyIn = convert(params.table.minBuyIn) + "/" + convert(params.table.maxBuyIn);
        tableObj.blinds = convert(params.table.smallBlind) + "/" + convert(params.table.bigBlind);
        tableObj.rakePercentMoreThanFive = convert(params.table.rake ? params.table.rake.rakePercentMoreThanFive : 0) + '%';
        tableObj.rakePercentThreeFour = convert(params.table.rake ? params.table.rake.rakePercentThreeFour : 0) + '%';
        tableObj.rakeHeadsUp = convert(params.table.rake ? params.table.rake.rakePercentTwo : 0) + '%';
        tableObj.capAmount = convert(params.table.rake ? Math.max(params.table.rake.capTwo, params.table.rake.capThreeFour, params.table.rake.capMoreThanFive) : 0).toString();
        tableObj.maxPlayers = params.table.maxPlayers.toString();
        tableObj.straddle = ((params.table.isStraddleEnable == true) ? ("Mandatory") : ("Optional"));
        tableObj.turnTime = params.table.turnTime + ' Sec';
        tableObj.callTime = params.table.callTime + ' Min';
        tableObj.antiBankingTime = this.secondsToMinuts(systemConfig.expireAntiBankingSeconds) + ' min.';
        tableObj.isRabbitTable = params.table.isRabbitTable ? params.table.isRabbitTable : false;
        tableObj.rabbitAmount = params.table.isRabbitTable ? params.table.buyRabbit : params.table.bigBlind;
        res.table = [];
    
        // Convert table object to array
        for(const key in tableObj) {
            res.table.push(tableObj[key]);
        }
    
        // Add player data if available
        if(!!params.table.players && params.table.players.length > 0) {
            for(let playerIt = 0; playerIt < params.table.players.length; playerIt++) {
                res.players.push({
                    playerName: params.table.players[playerIt].playerName,
                    playerId: params.table.players[playerIt].playerId,
                    chips: !!params.table.players[playerIt].chips ? params.table.players[playerIt].chips : 
                          !!params.table.players[playerIt].coins ? params.table.players[playerIt].coins : 0
                });
            }
        }
        return res;
    };
    
    // Helper functions
    secondsToMinuts(value: any): any {
        return Math.floor(value / 60) + (value % 60 ? value % 60 : null);
    }
    
 getchannelVariation(params: string): string {
        switch(params) {
            case stateOfX.channelVariation.omaha: return 'Omaha';
            case stateOfX.channelVariation.holdem: return 'Holdem';
            case stateOfX.channelVariation.shortdeck: return "6+ Hold'em";
            case stateOfX.channelVariation.FiveCardOmaha: return '5 Card PLO';
            case stateOfX.channelVariation.SixCardOmaha: return '6 Card PLO';
            case stateOfX.channelVariation.roe: return 'ROE';
            default: return 'Not Found';
        }
    }


}


