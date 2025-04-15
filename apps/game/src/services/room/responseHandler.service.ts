import { Injectable } from "@nestjs/common";
import _ from "underscore";
import _ld from "lodash";
import systemConfig from "./../../../../../libs/common/src/systemConfig.json";
import stateOfX from "shared/common/stateOfX.sevice";
import { BroadcastHandlerService } from "./broadcastHandler.service";

declare const pomelo: any; // In this place we have add socket.io



@Injectable()
export class ResponseHandlerService {


    constructor(
        private readonly broadcastHandler: BroadcastHandlerService,
    ) { }

    convertIntoDecimal(input: number): number {
        if (systemConfig.isDecimal === true) {
            return parseFloat(parseFloat(input.toString()).toFixed(2));
        } else {
            return Math.round(input);
        }
    };



    /*========================  START   ======================*/
    // Sum total pot from array of pots

    // New
    getTotalPot(pot: any): number {
        let totalPot = 0;
        for (let i = 0; i < pot.length; i++) {
            totalPot = this.convertIntoDecimal(totalPot) + this.convertIntoDecimal(pot[i].amount);
        }
        return totalPot;
    };

    // Old
    // createHandlerResponse.getTotalPot = function (pot) {
    //         var totalPot = 0;
    //         for (var i = 0; i < pot.length; i++) {
    //             totalPot = convert.convert(totalPot) + convert.convert(pot[i].amount);
    //         }
    //         return totalPot;
    //     }
    /*========================  END   ======================*/

    /*========================  START   ======================*/
    // Get sum of total dead bets

    //   New
    getTotalBet(bets: number[]): number {
        let totalBets = 0;
        for (let i = 0; i < bets.length; i++) {
            totalBets = this.convertIntoDecimal(totalBets) + this.convertIntoDecimal(bets[i]);
        }
        return totalBets;
    };

    //   Old
    //   createHandlerResponse.getTotalBet = function (bets) {
    //         var totalBets = 0;
    //         for (var i = 0; i < bets.length; i++) {
    //             totalBets = convert.convert(totalBets) + convert.convert(bets[i]);
    //         }
    //         return totalBets;
    //     }
    /*========================  END   ======================*/

    /*========================  START   ======================*/
    //this function updates the next blind info into the response
    //tournament

    //   New
    setNextBlindInfoForJoinChannelKeys(params: any): any {

        const nextBlindData = {
            nextBigBlind: 100, // You can replace with actual logic if needed
            nextSmallBlind: 100,
            nextAnte: 100,
            // Uncomment below to re-enable the actual blind logic:
            // nextBigBlind: params.nextBlindInfo ? params.nextBlindInfo.bigBlind : params.blindRuleData[0].bigBlind,
            // nextSmallBlind: params.nextBlindInfo ? params.nextBlindInfo.smallBlind : params.blindRuleData[0].smallBlind,
            // nextAnte: params.nextBlindInfo ? params.nextBlindInfo.ante : params.blindRuleData[0].ante,
        };

        return nextBlindData;
    };


    //   Old
    //   var setNextBlindInfoForJoinChannelKeys = function (params) {
    //     console.log("current date in ", Number(new Date()))
    //     console.log("tournament start time ", new Date(params.tournamentStartTime), params.tournamentStartTime);
    //     console.log("blindRuleData", Number(new Date()), params.blindRuleData);
    //     console.log("nextBlindInfo", Number(new Date()), params.nextBlindInfo)


    //     var nextBlindData = {};
    //     nextBlindData.nextBigBlind = 100 //!!(params.nextBlindInfo)?(params.nextBlindInfo.bigBlind):(params.blindRuleData[0].bigBlind);
    //     nextBlindData.nextSmallBlind = 100 //!!(params.nextBlindInfo)?(params.nextBlindInfo.smallBlind):(params.blindRuleData[0].smallBlind);
    //     nextBlindData.nextAnte = 100 //!!(params.nextBlindInfo)?(params.nextBlindInfo.ante):(params.blindRuleData[0].ante);

    //     console.log("nextBlindData is - ", nextBlindData);
    //     return nextBlindData;
    // }
    /*========================  END   ======================*/

    /*========================  START   ======================*/
    //this function calculates the addOn time remaining
    //tournament

    // New

    calculateAddonTimeRemaining(params: any): number {

        let level = 0;
        for (let i = 0; i < params.addOnTime.length; i++) {
            if (params.blindLevel < params.addOnTime[i].level) {
                level = params.addOnTime[i].level;
                break;
            }
        }


        const addOnTime = params.blindRuleData.filter(rule => rule.level === level);

        if (
            addOnTime.length === 0 ||
            params.blindLevel >= params.addOnTime[params.addOnTime.length - 1].level
        ) {
            return -1;
        }

        return params.tournamentStartTime + addOnTime[0].duration * 60000 - Number(new Date());
    };


    // Old
    // var calculateAddonTimeRemaining = function (params) {
    //     console.log("params in calculateAddonTimeRemaining is ", JSON.stringify(params));
    //     var level = 0;
    //     for (var i = 0; i < params.addOnTime.length; i++) {
    //         if (params.blindLevel < params.addOnTime[i].level) {
    //             level = params.addOnTime[i].level;
    //             break;
    //         }
    //     }
    //     console.log("params.addOnTime in responseHanler is ", params.addOnTime.length);
    //     console.log("params.blindRuleData in responseHandler is   ", params.blindRuleData);
    //     console.log("the value of level is    ", level);
    //     var addOnTime = _.where(params.blindRuleData, { level: level });
    //     console.log("addOnTime in responseHandler is ", addOnTime);
    //     console.log(params.blindRuleData, level, "inside calculateAddonTimeRemaining...........", addOnTime[0]);
    //     if (addOnTime || params.blindLevel >= params.addOnTime[params.addOnTime.length - 1].level) {
    //         return -1;
    //     }

    //     return (params.tournamentStartTime + addOnTime[0].duration * 60000 - Number(new Date()));
    // }
    /*========================  END   ======================*/

    /*========================  START   ======================*/
    // Generate keys for join channel or autosit player response
    // params contains table, data
    async setJoinChannelKeys(params) {

        let res: any = {};
        res.success = true;
        params.table = _.omit(params.table, 'deck');
        res.tableDetails = {};
        res.roomConfig = {};

        // Add general values for join channel res
        let playerIndex = _ld.findIndex(params.table.players, { playerId: params.playerId });
        res.success = true;
        res.channelId = params.table.channelId;
        res.tableId = !!params.tableId ? params.tableId : "";
        res.playerId = params.playerId;
        res.playerName = params.playerName;
        res.cards = playerIndex >= 0 ? params.table.players[playerIndex].cards : [];
        res.bestHands = playerIndex >= 0 ? params.table.players[playerIndex].bestHands : "";
        res.lastMove = playerIndex >= 0 ? params.table.players[playerIndex].lastMove : "";
        res.isRunItTwice = playerIndex >= 0 ? params.table.players[playerIndex].isRunItTwice : false,
            res.isForceBlindEnable = playerIndex >= 0 ? params.table.players[playerIndex].isForceBlindEnable : false,
            res.isJoinWaiting = _ld.findIndex(params.table.queueList, { playerId: params.playerId }) >= 0;
        res.settings = params.data.settings || { muteGameSound: true, dealerChat: false, playerChat: false, tableColor: "", isMuckHand: false };
        res.antibanking = params.data.antibanking || { isAntiBanking: false, amount: -1, timeRemains: -1 };
        // Sending RIT Broadcast on Chennel to Show player RIT Enable/Disable in re conection
        // var channelIdOriginal = params.table.channelId;
        // var channel = pomelo.app.get('channelService').getChannel(channelIdOriginal, true);
        // var broadcastData = {};
        // broadcastData.channelId = channelIdOriginal;
        // broadcastData.playerId = params.playerId;
        // broadcastData.RITstatus = res.isRunItTwice;
        // broadcastHandler.playerRITStatus({channel: channel, channelId: channelIdOriginal,data:broadcastData });  
        //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



        // Set antibanking key only for normal games, not in tournament
        if (params.table.channelType !== stateOfX.gameType.tournament) {
        }
        res.antibanking = params.data.antibanking || { isAntiBanking: false, amount: -1, timeRemains: -1 };

        // Add table details for join res

        // Dynamic data for inside Game playe (table details)
        res.tableDetails.channelType = params.table.channelType;
        res.tableDetails.isRunItTwiceTable = params.table.isRunItTwiceTable;
        res.tableDetails.isEvChopTable = params.table.isEvChopTable || false
        res.tableDetails.roundId = params.table.roundId;
        res.tableDetails.smallBlind = params.table.smallBlind;
        res.tableDetails.bigBlind = params.table.bigBlind;
        res.tableDetails.turnTime = params.table.turnTime;
        res.tableDetails.callTime = params.table.callTime;
        res.tableDetails.ctEnabledBufferTime = params.table.ctEnabledBufferTime;
        res.tableDetails.ctEnabledBufferHand = params.table.ctEnabledBufferHand;
        res.tableDetails.isCTEnabledTable = params.table.isCTEnabledTable;
        res.tableDetails.extraTurnTime = stateOfX.extraTimeBank[params.table.turnTime] || stateOfX.extraTimeBank['default'];
        res.tableDetails.isStraddleEnable = params.table.isStraddleEnable;
        res.tableDetails.runItTwiceEnable = params.table.runItTwiceEnable;
        res.tableDetails.state = params.table.state;
        res.tableDetails.roundCount = params.table.roundCount;
        res.tableDetails.roundNumber = params.table.roundNumber;
        res.tableDetails.roundName = params.table.roundName;
        res.tableDetails.roundBets = params.table.roundBets;
        res.tableDetails.roundMaxBet = params.table.roundMaxBet;
        res.tableDetails.maxBetAllowed = params.table.maxBetAllowed;
        res.tableDetails.pot = _.pluck(params.table.pot, 'amount');
        res.tableDetails.boardCard = params.table.boardCard;
        res.tableDetails.dealerIndex = params.table.dealerSeatIndex;
        res.tableDetails.smallBlindIndex = params.table.smallBlindIndex >= 0 && !!params.table.players[params.table.smallBlindIndex] ? params.table.players[params.table.smallBlindIndex].seatIndex : -1;
        res.tableDetails.bigBlindIndex = params.table.bigBlindIndex >= 0 && !!params.table.players[params.table.bigBlindIndex] ? params.table.players[params.table.bigBlindIndex].seatIndex : -1;
        res.tableDetails.straddleIndex = params.table.straddleIndex >= 0 && !!params.table.players[params.table.straddleIndex] ? params.table.players[params.table.straddleIndex].seatIndex : -1;
        res.tableDetails.currentMoveIndex = params.table.currentMoveIndex >= 0 && !!params.table.players[params.table.currentMoveIndex] ? params.table.players[params.table.currentMoveIndex].seatIndex : -1;
        res.tableDetails.minRaiseAmount = params.table.minRaiseAmount;
        res.tableDetails.maxRaiseAmount = params.table.maxRaiseAmount;
        res.tableDetails.rabbit = params.table.buyRabbit ? params.table.buyRabbit : res.tableDetails.bigBlind;
        res.tableDetails.totalPot = this.getTotalPot(params.table.pot) + this.getTotalBet(params.table.roundBets);
        // res.tableDetails.breakLevel       = 0;
        if (params.table.channelType === stateOfX.gameType.tournament) {
            res.tableDetails.blindLevel = params.table.blindLevel;
            res.tableDetails.rebuyDataForBroadcast = params.table.rebuyDataForBroadcast ? params.table.rebuyDataForBroadcast : [];
            // res.tableDetails.nextBlindLevel = !!(params.table.blindRuleData[params.table.blindLevel+1])?(params.table.blindRuleData[params.table.blindLevel+1].level) : -1;
            res.tableDetails.nextBlindLevel = 1;
            res.tableDetails.blindRuleData = params.table.blindRuleData || {};
            // res.tableDetails.timeBankRuleData = params.table.timeBankRuleData || {};
            // res.tableDetails.nextBigBlind = params.table.nextBlindInfo.bigBlind;
            res.tableDetails.isOnBreak = params.table.isOnBreak;
            res.tableDetails.isAddOnLive = params.table.isAddOnLive;
            if (params.table.isOnBreak) {
                res.tableDetails.isBreakTimerStart = params.table.isBreakTimerStart;
                if (params.table.isBreakTimerStart) {
                    res.tableDetails.breakEnds = params.table.breakEndsAt;
                }
            }
            res.tableDetails.rebuyTimeRemaining = params.table.tournamentStartTime + params.table.rebuyTime * 60000 - Number(new Date());
            if (res.tableDetails.rebuyTimeRemaining <= 0) {
                res.tableDetails.rebuyTimeRemaining = -1;
            }
            res.tableDetails.tournamentName = params.table.tournamentName;
            res.tableDetails.tournamentId = params.table.tournamentRules.tournamentId;
            res.tableDetails.isBreak = params.table.isOnBreak;
            res.tableDetails.isAddOnLive = params.table.isAddOnLive;
            res.tableDetails.isRebuyAllowed = params.table.isRebuyAllowed || false;
            res.tableDetails.isAddOnAllowed = params.table.isAddOnAllowed || false;
            res.tableDetails.addonTimeRemaining = params.table.addOnTime ? this.calculateAddonTimeRemaining(params.table) : 0;
            res.tableDetails.isAutoRebuy = false //params.table.players[playerIndex].isAutoReBuyEnabled;
            res.tableDetails.isAutoAddOn = false //params.table.players[playerIndex].isAutoAddOnEnabled;
            var nextBlindData = this.setNextBlindInfoForJoinChannelKeys(params.table);
            console.log("nextBlindData-----------", nextBlindData)
            res.roomConfig.nextBigBlind = 100 //nextBlindData.nextBigBlind;
            res.roomConfig.nextSmallBlind = 100 //nextBlindData.nextSmallBlind;
            res.roomConfig.nextAnte = 100 //nextBlindData.nextAnte;
            res.roomConfig.tournamentType = params.table.tournamentType;


            console.log("res.tableDetails......", res.tableDetails);
            console.log("res.tableDetails......", res.roomConfig);


        }

        // Set time bank details in case of tournament
        res.tableDetails.isTimeBankUsed = false;
        res.tableDetails.totalTimeBank = null;
        res.tableDetails.timeBankLeft = null;

        if (params.table.isROE) {
            res.tableDetails.channelId = params.table.channelId;
            res.tableDetails.channelVariation = params.table.channelVariation;
            res.tableDetails.isROE = params.table.isROE;
            res.tableDetails.channelRound = params.table.channelRound;
            res.tableDetails.maxPlayers = params.table.maxPlayers;
            res.tableDetails.channelRoundCount = params.table.channelRoundCount;
        }
        // Get extra time value for current player with move
        if (params.table.channelType === stateOfX.gameType.tournament) {
            if (params.table.state === stateOfX.gameState.running && params.table.currentMoveIndex >= 0) {
                if (params.table.players[params.table.currentMoveIndex].tournamentData.isTimeBankUsed) {
                    res.tableDetails.isTimeBankUsed = true;
                    res.tableDetails.totalTimeBank = params.table.players[params.table.currentMoveIndex].tournamentData.timeBankLeft;
                    res.tableDetails.timeBankLeft = Number(res.tableDetails.totalTimeBank) - Number((((new Date().getTime()) - (params.table.timeBankStartedAt)) / 1000) % 60)
                } else {
                    console.log(stateOfX.serverLogType.info, 'Not calculating time bank values as current player havent use time bank yet!');
                }
            } else {
                console.log(stateOfX.serverLogType.info, 'Not calculating time bank values as either game is not running or no current player index set!')
            }
        } else {
            if (params.table.state === stateOfX.gameState.running && params.table.currentMoveIndex >= 0) {
                if (params.table.players[params.table.currentMoveIndex].isTimeBankUsed) {
                    res.tableDetails.isTimeBankUsed = true;
                    res.tableDetails.totalTimeBank = params.table.players[params.table.currentMoveIndex].timeBankSec;
                    res.tableDetails.timeBankLeft = Number(res.tableDetails.totalTimeBank) - Number((((new Date().getTime()) - (params.table.players[params.table.currentMoveIndex].timeBankStartedAt)) / 1000) % 60)
                } else {
                    console.log(stateOfX.serverLogType.info, 'Not calculating time bank values as current player havent use time bank yet!');
                }
            } else {
                console.log(stateOfX.serverLogType.info, 'Not calculating time bank values as either game is not running or no current player index set!')
            }
        }

        // Static details for inside Game (Client request)
        res.roomConfig._id = params.table.channelId;
        res.roomConfig.tableId = (!!params.table.tournamentRules && !!params.table.tournamentRules.tournamentId) ? params.table.tournamentRules.tournamentId : "";
        res.roomConfig.channelType = params.table.channelType;
        res.roomConfig.smallBlind = params.table.smallBlind;
        res.roomConfig.bigBlind = params.table.bigBlind;
        res.roomConfig.rabbit = params.table.buyRabbit ? params.table.buyRabbit : res.tableDetails.bigBlind;
        res.roomConfig.isStraddleEnable = params.table.isStraddleEnable;
        res.roomConfig.turnTime = params.table.turnTime;
        res.roomConfig.callTime = params.table.callTime;
        res.roomConfig.ctEnabledBufferTime = params.table.ctEnabledBufferTime;
        res.roomConfig.ctEnabledBufferHand = params.table.ctEnabledBufferHand;
        res.roomConfig.isCTEnabledTable = params.table.isCTEnabledTable;
        res.roomConfig.isPotLimit = params.table.isPotLimit;
        res.roomConfig.extraTurnTime = stateOfX.extraTimeBank[params.table.turnTime] || stateOfX.extraTimeBank['default'];
        res.roomConfig.channelName = params.table.channelName;
        res.roomConfig.channelVariation = params.table.channelVariation;
        res.roomConfig.isRealMoney = params.table.isRealMoney;
        res.roomConfig.smallBlind = params.table.smallBlind;
        res.roomConfig.bigBlind = params.table.bigBlind;
        res.roomConfig.minBuyIn = params.table.minBuyIn;
        res.roomConfig.maxBuyIn = params.table.maxBuyIn;
        res.roomConfig.minPlayers = params.table.minPlayers;
        res.roomConfig.maxPlayers = params.table.maxPlayers;
        res.roomConfig.info = params.table.gameInfo;
        // res.roomConfig.info['Cap Amount']             = 100 //convert.convert(params.table.gameInfo['Cap Amount'])
        res.roomConfig.tableAutoStraddle = params.table.tableAutoStraddle;
        res.roomConfig.isRunItTwiceTable = params.table.isRunItTwiceTable;
        // res.roomConfig.nextBigBlind     = params.table.nextBlindInfo.bigBlind;
        // res.roomConfig.nextSmallBlind   = params.table.nextBlindInfo.smallBlind;
        // res.roomConfig.nextAnte         = params.table.nextBlindInfo.nextAnte;





        let timeLapsed = Number((((new Date().getTime()) - (params.table.turnTimeStartAt)) / 1000));


        // var totalTurnTime =  playerIndex >= 0 ? (params.table.players[playerIndex].state === stateOfX.playerState.disconnected) ? parseInt(params.table.turnTime) +  : -1;
        res.tableDetails.additionalTurnTime = parseInt(params.table.turnTime);
        res.tableDetails.remainingMoveTime = params.table.state === stateOfX.gameState.running ? Number(params.table.turnTime) - Number(timeLapsed) : 0;

        if (params.table.currentMoveIndex >= 0) {
            console.log(stateOfX.serverLogType.info, 'Current player details: ' + JSON.stringify(params.table.players[params.table.currentMoveIndex]));
        }

        let detTimeAllowed = (params.table.state === stateOfX.gameState.running && params.table.currentMoveIndex >= 0 && params.table.players[params.table.currentMoveIndex].state === stateOfX.playerState.disconnected);
        if (!detTimeAllowed) {
            detTimeAllowed = params.table.state === stateOfX.gameState.running && params.table.currentMoveIndex >= 0 && (params.table.players[params.table.currentMoveIndex].playerId === params.playerId && params.data.previousState === stateOfX.playerState.disconnected);
        }

        console.log(stateOfX.serverLogType.info, 'Extra time allowed for disconnected player in this join response: ' + detTimeAllowed);

        if (detTimeAllowed) {
            if (Number(timeLapsed) > Number(params.table.turnTime)) {
                res.tableDetails.remainingMoveTime = parseInt(res.tableDetails.extraTurnTime) + parseInt(params.table.turnTime) + systemConfig.isConnectedCheckTime - Number(timeLapsed);
                res.tableDetails.additionalTurnTime = res.tableDetails.extraTurnTime;// -  systemConfig.isConnectedCheckTime;
            } else {
                res.tableDetails.remainingMoveTime = Number(params.table.turnTime) - Number(timeLapsed);
                res.tableDetails.additionalTurnTime = Number(params.table.turnTime);
            }
            // res.tableDetails.remainingMoveTime  = parseInt(params.table.turnTime) + parseInt(res.tableDetails.extraTurnTime) - parseInt(timeLapsed)
        }
        console.error(stateOfX.serverLogType.info, 'Additional turn time: ' + res.tableDetails.additionalTurnTime + ' and remaining move time: ' + res.tableDetails.remainingMoveTime);
        res.tableDetails.remainingMoveTime
        if (res.tableDetails.remainingMoveTime < 0) {
            res.tableDetails.remainingMoveTime = parseInt(params.table.turnTime) + parseInt(res.tableDetails.extraTurnTime) + systemConfig.isConnectedCheckTime - Number(timeLapsed);
            res.tableDetails.additionalTurnTime = res.tableDetails.extraTurnTime;
        }



        /*if(res.tableDetails.remainingMoveTime > parseInt(res.tableDetails.extraTurnTime)){
          res.tableDetails.remainingMoveTime = parseInt(res.tableDetails.extraTurnTime) - parseInt(timeLapsed);
          res.tableDetails.additionalTurnTime = res.tableDetails.extraTurnTime;
        }*/

        res.tableDetails.players = [];


        for (const player of params.table.players) {
            res.tableDetails.players.push({
                channelId: player.channelId,
                playerId: player.playerId,
                playerName: player.playerName,
                chips: player.chips,
                seatIndex: player.seatIndex,
                state: player.state,
                isPartOfGame: (
                    params.table.state === stateOfX.gameState.running &&
                    params.table.roundId === player.roundId
                ),
                imageAvtar: "",
                totalRoundBet: player.totalRoundBet,
                lastMove: player.lastMove,
                moves: player.moves,
                preCheck: player.preCheck,
                precheckValue: player.precheckValue || stateOfX.playerPrecheckValue.NONE,
                sitoutNextBigBlind: player.sitoutNextBigBlind,
                sitoutNextHand: player.sitoutNextHand,
                isTournamentSitout: player.tournamentData.isTournamentSitout,
                isRunItTwice: player.isRunItTwice,
                playerCallTimer: player.playerCallTimer
            });
        }

        return res;

    }
    /*========================  END   ======================*/

}