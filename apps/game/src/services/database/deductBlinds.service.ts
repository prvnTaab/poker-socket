import { Injectable } from "@nestjs/common";
import _ld from "lodash";
import _ from 'underscore';
import { stateOfX, popupTextManager } from "shared/common";
import { SetMoveService } from "./setMove.service";
import { ResponseHandlerService } from "./responseHandler.service";
import { ActivityService } from "shared/common/activity/activity.service";

import { systemConfig } from "shared/common";
import { TableManagerService } from "./tableManager.service";



@Injectable()
export class DeductBlindsService {


    constructor(
        private readonly setMove: SetMoveService,
        private readonly tableManager: TableManagerService,
        private readonly responseHandler: ResponseHandlerService,
        private readonly activity: ActivityService,

    ) { }


    convert(input: any): any {
        if (systemConfig.isDecimal === true) {
            return parseFloat(parseFloat(input.toString()).toFixed(2));
        } else {
            return Math.round(input);
        }
    };





    /*============================  START  =================================*/
    // ### Set table roundBets as 0 on game start
    // New
    async setRoundBets(params: any): Promise<any> {

        for (let i = 0; i < params.table.players.length; i++) {
            const player = params.table.players[i];

            const isPlaying = player.state === stateOfX.playerState.playing;
            const isOnBreakAndAllowed =
                player.state === stateOfX.playerState.onBreak &&
                params.table.isCTEnabledTable &&
                player.playerScore > 0 &&
                (
                    (!player.playerCallTimer.status && player.callTimeGameMissed <= params.table.ctEnabledBufferHand) ||
                    (player.playerCallTimer.status && !player.playerCallTimer.isCallTimeOver)
                );

            if (isPlaying || isOnBreakAndAllowed) {
                params.table.roundBets.push(this.convert(0));
            }

        }

        return params;
    }


    // Old
    // var setRoundBets = function (params, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'in deductBlinds function setRoundBets');
    //     for (var i = 0; i < params.table.players.length; i++) {
    //       if(params.table.players[i].state === stateOfX.playerState.playing || (params.table.players[i].state == stateOfX.playerState.onBreak && (params.table.isCTEnabledTable && params.table.players[i].playerScore > 0
    //         && (
    //           (params.table.players[i].playerCallTimer.status === false && params.table.players[i].callTimeGameMissed <= params.table.ctEnabledBufferHand)
    //           || (params.table.players[i].playerCallTimer.status === true
    //             && !(params.table.players[i].playerCallTimer.isCallTimeOver)
    //           )
    //         )
    //       ))) {
    //         params.table.roundBets.push(convert.convert(0));
    //       }
    //       serverLog(stateOfX.serverLogType.info, 'Roundbets - ' + JSON.stringify(params.table.roundBets));
    //     }
    //     cb(null, params);
    //   }
    /*============================  END  =================================*/




    /*============================  START  =================================*/
    /**
     * note contribution of player on table - first time
     * @method addContribution
     * @param  {Object}        params      contains table etc
     * @param  {Number}        playerIndex player index in array
     * @param  {Number}        amount      amount given by player - as blind etc
     * @param  {Function}      cb          callback
     */
    //   New
    async addContribution(params: any, playerIndex: number, amount: number): Promise<void> {

        if (this.convert(amount) > 0) {
            params.table.contributors.push({
                playerId: params.table.players[playerIndex].playerId,
                amount: amount,
                tempAmount: amount
            });
        } else {
            console.log(stateOfX.serverLogType.info, 'Not adding contributor as amount passed is: ' + amount);
        }

    }


    //   Old
    //   var addContribution = function (params, playerIndex, amount, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'Previous contributors: ' + JSON.stringify(params.table.contributors));
    //     if (convert.convert(amount) > 0) {
    //       params.table.contributors.push({
    //         playerId  : params.table.players[playerIndex].playerId,
    //         amount    : amount,
    //         tempAmount: amount
    //       });
    //     } else {
    //       serverLog(stateOfX.serverLogType.info, 'Not additing contributor as amount passed is: ' + amount);
    //     }
    //     serverLog(stateOfX.serverLogType.info, 'Updated contributors: ' + JSON.stringify(params.table.contributors));
    //     cb()
    //   }
    /*============================  END  =================================*/



    /*============================  START  =================================*/
    // ### Deduct small blind on table
    // handle if player chips are less than table small blind
    //   New
    async deductSmallBlind(params: any): Promise<any> {

        if (
            params.table.smallBlindIndex >= 0 &&
            !params.table.players[params.table.smallBlindIndex].isWaitingPlayer // extra check - sushiljainam
        ) {
            let smallBlindToDeduct = this.convert(params.table.smallBlind);


            if (params.table.players[params.table.smallBlindIndex].chips < smallBlindToDeduct) {
                smallBlindToDeduct = this.convert(params.table.players[params.table.smallBlindIndex].chips);
            }


            const player = params.table.players[params.table.smallBlindIndex];
            player.chips -= smallBlindToDeduct;
            player.totalRoundBet = smallBlindToDeduct;
            player.totalGameBet = smallBlindToDeduct;
            params.table.roundBets[params.table.smallBlindIndex] = smallBlindToDeduct;

            await this.addContribution(params, params.table.smallBlindIndex, smallBlindToDeduct);
        } else {
            console.log(stateOfX.serverLogType.info, 'No small blind will deduct in this case.');
        }

        return params;
    }


    //   Old
    //   var deductSmallBlind = function (params, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'in deductBlinds function deductSmallBlind');
    //     serverLog(stateOfX.serverLogType.info, 'Round bets so far - ' + params.table.roundBets);
    //     if(params.table.smallBlindIndex >= 0 && !params.table.players[params.table.smallBlindIndex].isWaitingPlayer) { // extra check - sushiljainam
    //       var smallBlindToDeduct = convert.convert(params.table.smallBlind);

    //       // Decide small blind to deduct
    //       serverLog(stateOfX.serverLogType.info, 'Small blind allin - ' + (params.table.players[params.table.smallBlindIndex].chips < smallBlindToDeduct));
    //       if(params.table.players[params.table.smallBlindIndex].chips < smallBlindToDeduct) {
    //         smallBlindToDeduct = convert.convert(params.table.players[params.table.smallBlindIndex].chips);
    //       }
    //       serverLog(stateOfX.serverLogType.info, 'Small blind deducted will be - ' + smallBlindToDeduct);

    //       params.table.players[params.table.smallBlindIndex].chips          = params.table.players[params.table.smallBlindIndex].chips - smallBlindToDeduct;
    //       params.table.players[params.table.smallBlindIndex].totalRoundBet  = smallBlindToDeduct;
    //       params.table.players[params.table.smallBlindIndex].totalGameBet   = smallBlindToDeduct;
    //       params.table.roundBets[params.table.smallBlindIndex]              = smallBlindToDeduct;

    //       addContribution(params, params.table.smallBlindIndex, smallBlindToDeduct, function(){cb(null, params)});
    //     } else {
    //       serverLog(stateOfX.serverLogType.info, 'No small blind will deduct in this case.');
    //       cb(null, params);
    //     }
    //   };
    /*============================  END  =================================*/




    /*============================  START  =================================*/
    // ### Deduct big blind on table
    // handle if player chips are less than table big blind
    //   New
    async deductBigBlind(params: any): Promise<any> {

        let bigBlindToDedect = this.convert(params.table.bigBlind);

        if (params.table.players[params.table.bigBlindIndex].chips < bigBlindToDedect) {
            bigBlindToDedect = this.convert(params.table.players[params.table.bigBlindIndex].chips);
        }


        const player = params.table.players[params.table.bigBlindIndex];
        player.chips -= bigBlindToDedect;
        player.totalRoundBet = bigBlindToDedect;
        player.totalGameBet = bigBlindToDedect;
        params.table.roundBets[params.table.bigBlindIndex] = bigBlindToDedect;

        await this.addContribution(params, params.table.bigBlindIndex, bigBlindToDedect);

        return params;
    }


    //   Old
    //   var deductBigBlind = function (params, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'in deductBlinds function deductBigBlind');
    //     var bigBlindToDedect = convert.convert(params.table.bigBlind);


    //     // Decide big blind to deduct
    //     serverLog(stateOfX.serverLogType.info, 'Big blind allin - ' + (params.table.players[params.table.bigBlindIndex].chips < bigBlindToDedect));
    //     if(params.table.players[params.table.bigBlindIndex].chips < bigBlindToDedect) {
    //       bigBlindToDedect = convert.convert(params.table.players[params.table.bigBlindIndex].chips);
    //     }

    //     serverLog(stateOfX.serverLogType.info, 'Big blind deducted will be - ' + bigBlindToDedect)

    //     params.table.players[params.table.bigBlindIndex].chips         = params.table.players[params.table.bigBlindIndex].chips - bigBlindToDedect;
    //     params.table.players[params.table.bigBlindIndex].totalRoundBet = bigBlindToDedect;
    //     params.table.players[params.table.bigBlindIndex].totalGameBet  = bigBlindToDedect;
    //     params.table.roundBets[params.table.bigBlindIndex]             = bigBlindToDedect;
    //     addContribution(params, params.table.bigBlindIndex, bigBlindToDedect, function(){cb(null, params)});
    //   };
    /*============================  END  =================================*/



    /*============================  START  =================================*/
    // ### Deduct straddle amount on table
    // handle if player chips are less than table straddle
    //   New
    async deductStraddle(params: any): Promise<any> {

        if (params.table.straddleIndex >= 0) {
            // Decide straddle amount to deduct
            let straddleToDeduct = 2 * this.convert(params.table.bigBlind);

            if (params.table.players[params.table.straddleIndex].chips < straddleToDeduct) {
                straddleToDeduct = params.table.players[params.table.straddleIndex].chips;
            }


            const player = params.table.players[params.table.straddleIndex];
            player.chips -= straddleToDeduct;
            player.totalRoundBet = straddleToDeduct;
            player.totalGameBet = straddleToDeduct;
            params.table.roundBets[params.table.straddleIndex] = straddleToDeduct;

            await this.addContribution(params, params.table.straddleIndex, straddleToDeduct);
        } else {
            console.log(stateOfX.serverLogType.info, 'No straddle set in this game so skipping straddle amount deduction');
        }

        return params;
    }


    //   Old
    //   var deductStraddle = function (params, cb) {




    //     serverLog(stateOfX.serverLogType.info, 'in deductBlinds function deductStraddle');
    //     // Deduct straddle player amount only if enable on table
    //     serverLog(stateOfX.serverLogType.info, 'Straddle table - ' + params.table.isStraddleEnable + ' && Straddle index - ' + params.table.straddleIndex);
    //     if(params.table.straddleIndex >= 0) {




    //       // Decide straddle amount to deduct
    //       var straddleToDeduct = 2 * convert.convert(params.table.bigBlind);
    //       serverLog(stateOfX.serverLogType.info, 'Straddle allin - ' + (params.table.players[params.table.straddleIndex].chips < straddleToDeduct));
    //       if(params.table.players[params.table.straddleIndex].chips < straddleToDeduct) {
    //         straddleToDeduct = params.table.players[params.table.straddleIndex].chips;
    //       }

    //       serverLog(stateOfX.serverLogType.info, 'Straddle deducted will be - ' + straddleToDeduct)

    //       params.table.players[params.table.straddleIndex].chips         = params.table.players[params.table.straddleIndex].chips - straddleToDeduct;
    //       params.table.players[params.table.straddleIndex].totalRoundBet = straddleToDeduct;
    //       params.table.players[params.table.straddleIndex].totalGameBet  = straddleToDeduct;
    //       params.table.roundBets[params.table.straddleIndex]             = straddleToDeduct;
    //       addContribution(params, params.table.straddleIndex, straddleToDeduct, function(){cb(null, params)});
    //     } else {
    //       serverLog(stateOfX.serverLogType.info, 'No straddle set in this game so skipping straddle amount deduction');
    //       cb(null, params);
    //     }
    //   };
    /*============================  END  =================================*/



    /*============================  START  =================================*/
    // ### Deduct forceblind for remaining playing players
    //   New
    async deductForceBlinds(params: any): Promise<any> {

        // Return early if tournament
        if (params.table.channelType === stateOfX.gameType.tournament) {
            return params;
        }

        params.table.roundContributors = params.table.contributors;

        const playingPlayers = _.where(params.table.players, { state: stateOfX.playerState.playing });

        for (const player of playingPlayers) {

            const playerIndex = _ld.findIndex(params.table.players, player);

            let forceBlindToDeduct = player.chips >= params.table.bigBlind ? params.table.bigBlind : player.chips;

            if (params.table.straddleIndex >= 0) {
                forceBlindToDeduct = player.chips >= (2 * params.table.bigBlind)
                    ? (2 * params.table.bigBlind)
                    : player.chips;
            }

            const isNotConfigured =
                playerIndex !== params.table.bigBlindIndex &&
                playerIndex !== params.table.straddleIndex;

            if (isNotConfigured) {

                if (player.isWaitingPlayer) {
                    player.isWaitingPlayer = false;
                    player.chips -= forceBlindToDeduct;
                    player.totalRoundBet = forceBlindToDeduct;
                    player.totalGameBet = forceBlindToDeduct;
                    params.table.roundBets[playerIndex] = forceBlindToDeduct;
                    params.data.forceBlind[player.playerId] = forceBlindToDeduct;
                    await this.addContribution(params, playerIndex, forceBlindToDeduct);
                } else {
                    console.log(stateOfX.serverLogType.info, 'This player was already playing the game !');
                }
            } else {
                player.isWaitingPlayer = false;
            }
        }

        params.table.roundContributors = params.table.contributors;

        return params;
    }


    //   Old
    //   var deductForceBlinds = function (params, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'in deductBlinds function deductForceBlinds');

    //     // Return function in case of tournament
    //     if (params.table.channelType === stateOfX.gameType.tournament) {
    //         serverLog(stateOfX.serverLogType.info, 'Not deducting force blind as this table is for tournament!');
    //         cb(null, params);
    //         return;
    //     }

    //     params.table.roundContributors = params.table.contributors;
    //     // cb(null, params);

    //     // console.log('deductForceBlinds',params.table.players)
    //     async.each(_.where(params.table.players, { state: stateOfX.playerState.playing }), function (player, ecb) {
    //         serverLog(stateOfX.serverLogType.info, 'Considering player while deducting force blind - ' + JSON.stringify(player));

    //         var playerIndex = _ld.findIndex(params.table.players, player);
    //         var forceBlindToDeduct = player.chips >= params.table.bigBlind ? params.table.bigBlind : player.chips;
    //         if (params.table.straddleIndex >= 0) {
    //             forceBlindToDeduct = player.chips >= (2 * params.table.bigBlind) ? (2 * params.table.bigBlind) : player.chips;  // TODO
    //         }
    //         if (/*playerIndex != params.table.smallBlindIndex && */playerIndex != params.table.bigBlindIndex && playerIndex != params.table.straddleIndex) {
    //             serverLog(stateOfX.serverLogType.info, player.playerName + ' is not a config player, deduct force blind - ' + forceBlindToDeduct + ' !');
    //             if (player.isWaitingPlayer) {
    //                 player.isWaitingPlayer = false;
    //                 player.chips = player.chips - forceBlindToDeduct;
    //                 player.totalRoundBet = forceBlindToDeduct;
    //                 player.totalGameBet = forceBlindToDeduct;
    //                 params.table.roundBets[playerIndex] = forceBlindToDeduct;
    //                 params.data.forceBlind[player.playerId] = forceBlindToDeduct;
    //                 addContribution(params, playerIndex, forceBlindToDeduct, function () { });
    //             } else {
    //                 serverLog(stateOfX.serverLogType.info, 'This player was already playing the game !')
    //             }
    //         } else {
    //             serverLog(stateOfX.serverLogType.info, 'This is a config player for this Game !');
    //             player.isWaitingPlayer = false;
    //         }
    //         ecb();
    //     }, function (err) {
    //         if (err) {
    //             serverLog(stateOfX.serverLogType.info, 'Deducting force b`lind failed !');
    //             cb({ success: false, channelId: (params.channelId || ""), info: popupTextManager.DEDUCTFORCEBLIND_DEDUCTBLINDS, isRetry: false, isDisplay: true })
    //         } else {
    //             params.table.roundContributors = params.table.contributors;
    //             serverLog(stateOfX.serverLogType.info, 'Contributors - ' + JSON.stringify(params.table.contributors))
    //             serverLog(stateOfX.serverLogType.info, 'Round Contributors - ' + JSON.stringify(params.table.roundContributors))
    //             cb(null, params);
    //         }
    //     });
    // }
    /*============================  END  =================================*/



    /*============================  START  =================================*/
    // ### Deduct ante of all players
    // tournament
    // New
    async deductAnte(params: any): Promise<any> {
        params.table.roundContributors = params.table.contributors;

        // Run only in the case of tournament
        if (params.table.channelType === stateOfX.gameType.tournament) {
            const playingPlayers = _.where(params.table.players, { state: stateOfX.playerState.playing });

            for (const player of playingPlayers) {
                const playerIndex = _ld.findIndex(params.table.players, player);
                const AnteToDeduct = player.chips >= params.table.ante ? params.table.ante : player.chips;

                if (AnteToDeduct > 0) {
                    player.chips -= AnteToDeduct;
                    player.totalRoundBet = this.convert(player.totalRoundBet) + this.convert(AnteToDeduct);
                    player.totalGameBet = this.convert(player.totalGameBet) + this.convert(AnteToDeduct);
                    params.table.roundBets[playerIndex] =
                        !!params.table.roundBets[playerIndex] && params.table.roundBets[playerIndex] > 0
                            ? params.table.roundBets[playerIndex] + AnteToDeduct
                            : AnteToDeduct;
                    params.data.forceBlind[player.playerId] = AnteToDeduct;

                    await this.addContribution(params, playerIndex, AnteToDeduct);
                }
            }

            params.table.roundContributors = params.table.contributors;
            return params;
        } else {
            return params;
        }
    }


    // Old
    // var deductAnte = function (params, cb) {
    //     console.log(stateOfX.serverLogType.info, 'in deductAnte', params.table.ante, params.table);
    //     params.table.roundContributors = params.table.contributors;

    //     // Run only in the case of tournament
    //     if (params.table.channelType === stateOfX.gameType.tournament) {
    //         async.each(_.where(params.table.players, { state: stateOfX.playerState.playing }), function (player, ecb) {
    //             console.log(stateOfX.serverLogType.info, 'Considering player while deducting ante - ' + JSON.stringify(player));
    //             let playerIndex = _ld.findIndex(params.table.players, player);
    //             let AnteToDeduct = player.chips >= params.table.ante ? params.table.ante : player.chips;

    //             // If no ante is going to deduct then skip steps
    //             if (AnteToDeduct > 0) {
    //                 console.log(stateOfX.serverLogType.info, player.playerName + ' is not a config player, deduct ante - ' + AnteToDeduct + ' !');
    //                 player.chips = player.chips - AnteToDeduct;
    //                 player.totalRoundBet = convert.convert(player.totalRoundBet) + convert.convert(AnteToDeduct);
    //                 player.totalGameBet = convert.convert(player.totalGameBet) + convert.convert(AnteToDeduct);
    //                 params.table.roundBets[playerIndex] = !!params.table.roundBets[playerIndex] && params.table.roundBets[playerIndex] > 0 ? params.table.roundBets[playerIndex] + AnteToDeduct : AnteToDeduct;
    //                 params.data.forceBlind[player.playerId] = AnteToDeduct;
    //                 addContribution(params, playerIndex, AnteToDeduct, function () { });
    //             }
    //             ecb();
    //         }, function (err) {
    //             if (err) {
    //                 console.log(stateOfX.serverLogType.info, 'Deducting ante failed !');
    //                 cb({ success: false, channelId: (params.channelId || ""), info: popupTextManager.DEDUCTANTE_DEDUCTBLINNDS, isRetry: false, isDisplay: true })
    //             } else {
    //                 params.table.roundContributors = params.table.contributors;
    //                 console.log(stateOfX.serverLogType.info, 'Contributors - ' + JSON.stringify(params.table.contributors))
    //                 console.log(stateOfX.serverLogType.info, 'Round Contributors - ' + JSON.stringify(params.table.roundContributors))
    //                 cb(null, params);
    //             }
    //         });
    //     } else {
    //         console.log(stateOfX.serverLogType.info, 'This is not a tournament not deduction ante');
    //         cb(null, params);
    //     }
    // }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    // ### Update entities for table here
    // these keys helps in deciding further moves and calculations
    // New
    updateTableEntities(params: any): any {
        // Set amount for current player in round max bet
        if (!params.table.roundBets[params.table.currentMoveIndex]) {
            params.table.roundBets[params.table.currentMoveIndex] = this.convert(0);
        }

        // Set round max bet
        params.table.roundMaxBet = this.convert(_.max(params.table.roundBets));

        params.table.minRaiseAmount = 2 * params.table.bigBlind;
        params.table.lastBetOnTable = params.table.straddleIndex >= 0 ? 2 * params.table.bigBlind : params.table.bigBlind;
        params.table.raiseDifference = params.table.lastBetOnTable;

        // Updating minRaiseAmount to fix min Raise straddle Raise issue
        params.table.minRaiseAmount = 2 * params.table.lastBetOnTable;

        params.table.lastRaiseAmount = params.table.raiseDifference;
        params.table.considerRaiseToMax = params.table.raiseDifference;
        params.table.maxRaiseAmount = this.tableManager.maxRaise(params.table);

        if (params.table.maxRaiseAmount < params.table.minRaiseAmount) {
            params.table.maxRaiseAmount = params.table.minRaiseAmount;
        }

        // Change round name
        params.table.roundName = stateOfX.round.preflop;

        return params;
    }


    // Old
    // var updateTableEntities = function (params, cb) {
    //     // console.error(stateOfX.serverLogType.info, 'in deductBlinds function updateTableEntities');
    //     // Set amount for current player in round max bet
    //     //  console.error(stateOfX.serverLogType.info, 'Total roundBets added so far - ' + params.table.roundBets);
    //     if (!params.table.roundBets[params.table.currentMoveIndex]) {
    //         params.table.roundBets[params.table.currentMoveIndex] = convert.convert(0);
    //         // console.error(stateOfX.serverLogType.info, 'Total roundBets set to zero for current move ' + params.table.currentMoveIndex);
    //     }
    //     //  console.error(stateOfX.serverLogType.info, 'Total roundBets after update so far - ' + params.table.roundBets);

    //     // Set round max bet
    //     console.error(stateOfX.serverLogType.info, 'Updating roundMaxBet for table.')
    //     // params.table.roundMaxBet = parseInt((_.max(params.table.roundBets)));
    //     params.table.roundMaxBet = convert.convert((_.max(params.table.roundBets)));
    //     console.error(stateOfX.serverLogType.info, 'Big blind on table on Game start - ' + params.table.bigBlind);



    //     params.table.minRaiseAmount = 2 * params.table.bigBlind;
    //     params.table.lastBetOnTable = params.table.straddleIndex >= 0 ? 2 * params.table.bigBlind : params.table.bigBlind;
    //     params.table.raiseDifference = params.table.lastBetOnTable;


    //     // Updating minRaiseAmount to fix min Raise traddle Raise issue

    //     params.table.minRaiseAmount = 2 * params.table.lastBetOnTable;

    //     //        ----------------------------------------------------------


    //     params.table.lastRaiseAmount = params.table.raiseDifference;
    //     params.table.considerRaiseToMax = params.table.raiseDifference;
    //     params.table.maxRaiseAmount = tableManager.maxRaise(params.table);




    //     // console.log('*****************************************');

    //     // console.log('params.table', params.table);
    //     // console.log('params.table.lastBetOnTable', params.table.lastBetOnTable);  

    //     // console.log('*****************************************');



    //     // chnages done by sahiq for button missing issue
    //     if (params.table.maxRaiseAmount < params.table.minRaiseAmount) {
    //         params.table.maxRaiseAmount = params.table.minRaiseAmount;
    //     }




    //     serverLog(stateOfX.serverLogType.info, 'Updated minRaiseAmount on Game start - ' + params.table.minRaiseAmount);
    //     serverLog(stateOfX.serverLogType.info, 'Updated maxRaiseAmount on Game start - ' + params.table.maxRaiseAmount);
    //     serverLog(stateOfX.serverLogType.info, 'Updated roundMaxBet on Game start - ' + params.table.roundMaxBet);

    //     // Change round name
    //     params.table.roundName = stateOfX.round.preflop;

    //     cb(null, params);
    // };
    /*============================  END  =================================*/



    /*============================  START  =================================*/
    // ### Set move for first player
    // New
    async setFirstPlayerMove(params: any): Promise<any> {

        const getMoveResponse = await this.setMove.getMove(params);

        if (getMoveResponse.success) {
            return params;
        } else {
            throw getMoveResponse;
        }
    }


    // Old
    // var setFirstPlayerMove = function (params, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'in deductBlinds function setFirstPlayerMove');
    //     setMove.getMove(params, function (getMoveResponse) {
    //         if (getMoveResponse.success) {
    //             cb(null, params);
    //         } else {
    //             cb(getMoveResponse);
    //         }
    //     });
    // };
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    // ### Decide precheks for players
    // New
    async decidePlayerPrechecks(params: any): Promise<any> {

        const assignPrechecksResponse = await this.setMove.assignPrechecks(params);

        if (assignPrechecksResponse.success) {
            return assignPrechecksResponse.params;
        } else {
            throw assignPrechecksResponse;
        }
    }


    // Old
    // var decidePlayerPrechecks = function (params, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'in deductBlinds function decidePlayerPrechecks');
    //     setMove.assignPrechecks(params, function (assignPrechecksResponse) {
    //         if (assignPrechecksResponse.success) {
    //             params = assignPrechecksResponse.params;
    //             cb(null, params);
    //         } else {
    //             cb(assignPrechecksResponse)
    //         }
    //     });
    // }
    /*============================  END  =================================*/



    /*============================  START  =================================*/
    // ### Generate response for deduct blind
    // New
    async createDeductBlindResponse(params: any): Promise<any> {

        const setDeductBlindKeysResponse = await this.responseHandler.setDeductBlindKeys({
            channelId: params.channelId,
            table: params.table,
            data: params.data,
        });

        return setDeductBlindKeysResponse;
    }


    // Old
    // var createDeductBlindResponse = function (params, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'in deductBlinds function createDeductBlindResponse');
    //     responseHandler.setDeductBlindKeys({ channelId: params.channelId, table: params.table, data: params.data }, function (setDeductBlindKeysResponse) {
    //         cb(null, setDeductBlindKeysResponse);
    //     });
    // };
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    // process blind deduction on table after game has been started
    // New
    async deduct(params: any): Promise<any> {
        try {
            params.data.forceBlind = {};

            await this.setRoundBets(params);
            await this.deductSmallBlind(params);
            await this.deductBigBlind(params);
            await this.deductStraddle(params);
            await this.deductForceBlinds(params);
            await this.deductAnte(params);
            await this.updateTableEntities(params);
            await this.setFirstPlayerMove(params);
            await this.decidePlayerPrechecks(params);

            const response = await this.createDeductBlindResponse(params);

            this.activity.deductBlinds(params, stateOfX.profile.category.game, stateOfX.game.subCategory.info, stateOfX.logType.success);
            this.activity.deductBlinds(params, stateOfX.profile.category.gamePlay, stateOfX.gamePlay.subCategory.info, stateOfX.logType.success);

            return response;

        } catch (err) {
            this.activity.deductBlinds(err, stateOfX.profile.category.game, stateOfX.game.subCategory.info, stateOfX.logType.error);
            this.activity.deductBlinds(err, stateOfX.profile.category.gamePlay, stateOfX.gamePlay.subCategory.info, stateOfX.logType.error);

            throw err;
        }
    };


    // Old
    // deductBlinds.deduct = function (params, cb) {
    //         params.data.forceBlind = {};
    //         serverLog(stateOfX.serverLogType.info, 'in deductBlinds function deduct');
    //         async.waterfall([
    //             async.apply(setRoundBets, params),
    //             deductSmallBlind,
    //             deductBigBlind,
    //             deductStraddle,
    //             deductForceBlinds,
    //             deductAnte,
    //             updateTableEntities,
    //             setFirstPlayerMove,
    //             decidePlayerPrechecks,
    //             createDeductBlindResponse

    //         ], function (err, response) {
    //             if (!err) {
    //                 activity.deductBlinds(params, stateOfX.profile.category.game, stateOfX.game.subCategory.info, stateOfX.logType.success);
    //                 activity.deductBlinds(params, stateOfX.profile.category.gamePlay, stateOfX.gamePlay.subCategory.info, stateOfX.logType.success);
    //                 cb(response);
    //             } else {
    //                 activity.deductBlinds(err, stateOfX.profile.category.game, stateOfX.game.subCategory.info, stateOfX.logType.error);
    //                 activity.deductBlinds(err, stateOfX.profile.category.gamePlay, stateOfX.gamePlay.subCategory.info, stateOfX.logType.error);
    //                 cb(err);
    //             }
    //         });
    //     };
    /*============================  END  =================================*/










}

