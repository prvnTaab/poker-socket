import _ld from "lodash";
import _ from 'underscore';
import { stateOfX } from "shared/common";
import { Injectable } from "@nestjs/common";
import { UtilsService } from "../../utils/utils.service";
import { validateKeySets } from "shared/common/utils/activity";



@Injectable()
export class PostslitService {

    constructor(
        private readonly utilsService: UtilsService
    ) { }



    /*=============================  START  =============================*/
    // ### Add additional params in existing one for calculation
    // New Code
    async initializeParams(params: any): Promise<any> {

        const validated = await validateKeySets("Request", params.serverType, "initializeParams", params);

        if (validated.success) {
            params.data.player = params.table.players[params.data.index];

            params.table.contributors.sort((a: any, b: any) => {
                return this.utilsService.convertIntToDecimal(b.amount - a.amount);
            });

            _.each(params.table.contributors, (ele: any) => {
                ele.tempAmount = ele.amount;
            });

            params.data.contributors = params.table.contributors;

            params.data.considerPlayer = params.data.contributors.length - 1;
            params.data.isPotsplitRequired = false;
            params.data.currentPot = params.table.pot;
            params.data.sidePots = [];

            for (let index = params.table.contributors.length - 1; index >= 0; index--) {
                const plr = params.table.contributors[index];

                const tbplr = _.find(params.table.players, { playerId: plr.playerId });
                const tbplrRm = _.find(params.table.removedPlayers, { playerId: plr.playerId });

                if ((tbplr && tbplr.lastMove === stateOfX.move.fold) || tbplrRm) {
                    params.data.considerPlayer--;
                } else {
                    break;
                }
            }

            return params;
        } else {
            throw validated;
        }
    }


    // ### Add additional params in existing one for calculation
    // Old Code
    // var initializeParams = function (params, cb) {
    // serverLog(stateOfX.serverLogType.info, 'splitting pot function initializeParams');
    // keyValidator.validateKeySets("Request", params.serverType, "initializeParams", params, function (validated) {
    //     if (validated.success) {

    //         params.data.player = params.table.players[params.data.index];
    //         params.table.contributors.sort(function (a, b) {
    //             return convert.convert(b.amount - a.amount);
    //         });
    //         _.each(params.table.contributors, (ele) => {
    //             ele.tempAmount = ele.amount;
    //         })
    //         params.data.contributors = params.table.contributors;
    //         serverLog(stateOfX.serverLogType.info, 'Sorted amount with contributors - ' + JSON.stringify(params.data.contributors));
    //         serverLog(stateOfX.serverLogType.info, 'Actual contributors - ' + JSON.stringify(params.table.contributors));
    //         params.data.considerPlayer = params.data.contributors.length - 1;
    //         params.data.isPotsplitRequired = false;
    //         params.data.currentPot = params.table.pot;
    //         params.data.sidePots = [];
    //         // console.log('params.table.contributors',params.table.contributors, JSON.stringify(params.table));
    //         for (let index = params.table.contributors.length - 1; index >= 0; index--) {
    //             const plr = params.table.contributors[index];
    //             let tbplr = _.find(params.table.players, { playerId: plr.playerId });
    //             let tbplrRm = _.find(params.table.removedPlayers, { playerId: plr.playerId });
    //             if ((tbplr && tbplr.lastMove == stateOfX.move.fold) || tbplrRm) {
    //                 params.data.considerPlayer--;
    //             } else {
    //                 break;
    //             }
    //         }
    //         cb(null, params);
    //     } else {
    //         cb(validated);
    //     }
    // });
    // }
    /*=============================  END  =============================*/



    /*=============================  START  =============================*/
    // check if pot split is required or not
    // if atleast a player has done allin and cotributed unequal
    // New Code
    async isPotsplitRequired(params: any): Promise<any> {
        const playingPlayers = [];

        for (let i = 0; i < params.table.players.length; i++) {
            if (params.table.onStartPlayers.indexOf(params.table.players[i].playerId) >= 0) {
                playingPlayers.push(params.table.players[i]);
            }
        }

        const foldedPlayers = _.where(playingPlayers, { lastMove: stateOfX.move.fold });
        const inActivePlayers = _.where(playingPlayers, { active: false });
        const playedinRound = _.where(playingPlayers, { isPlayed: true });

        if (params.table.pot.length > 1) {
            params.data.isPotsplitRequired = true;
        }

        if (!params.data.isPotsplitRequired && params.table.isAllInOcccured) {
            if (inActivePlayers.length + playedinRound.length >= playingPlayers.length) {
                const maxBet = _.max(_.pluck(playingPlayers, 'totalRoundBet'));
                const minBet = _.min(_.pluck(playingPlayers, 'totalRoundBet'));

                if (maxBet !== minBet) {
                    params.data.isPotsplitRequired = true;
                }
            }
        }

        if (playingPlayers.length - foldedPlayers.length <= 1) {
            params.data.isPotsplitRequired = false;
        }

        return params;
    }

    // Old Code
    // var isPotsplitRequired = function (params, cb) {
    //     serverLog(stateOfX.serverLogType.info, ' splitting pot function isPotsplitRequired');
    //     serverLog(stateOfX.serverLogType.info, 'Players while spliting pot - ' + JSON.stringify(params.table.players));
    //     var playingPlayers = [];
    //     for (var i = 0; i < params.table.players.length; i++) {
    //         if (params.table.onStartPlayers.indexOf(params.table.players[i].playerId) >= 0) {
    //             playingPlayers.push(params.table.players[i]);
    //         }
    //     }
    //     // var playingPlayers    = _.where(params.table.players, {state: stateOfX.playerState.playing});
    //     var foldedPlayers = _.where(playingPlayers, { lastMove: stateOfX.move.fold });
    //     // var playingPlayers    = _.where(params.table.players, {state: stateOfX.playerState.playing});
    //     var inActivePlayers = _.where(playingPlayers, { active: false });
    //     var playedinRound = _.where(playingPlayers, { isPlayed: true });
    //     /*
    //       var playingPlayers    = _.where(params.table.players, {state: stateOfX.playerState.playing});
    //       var foldedPlayers    = _.where(params.table.players, {state: stateOfX.playerState.playing, lastMove: stateOfX.move.fold});
    //       // var playingPlayers    = _.where(params.table.players, {state: stateOfX.playerState.playing});
    //       var inActivePlayers   = _.where(params.table.players, {state: stateOfX.playerState.playing, active: false});
    //       var playedinRound     = _.where(params.table.players, {state: stateOfX.playerState.playing, isPlayed: true});
    //     */
    //     serverLog(stateOfX.serverLogType.info, 'Players moves so far');
    //     serverLog(stateOfX.serverLogType.info, 'ALL IN occured on table - ' + params.table.isAllInOcccured);
    //     serverLog(stateOfX.serverLogType.info, 'Total player played in this round - ' + JSON.stringify(playedinRound));
    //     serverLog(stateOfX.serverLogType.info, 'Total playing players in the game - ' + playingPlayers.length);
    //     //console.error(inActivePlayers.length ,"!@#@@@@@#####@@@@@@#$%^^^^^^^^^^^^", playedinRound.length, "!@@@@@@@@@@" ,playingPlayers.length);

    //     // If pot is already splitted then do not check any condition
    //     if (params.table.pot.length > 1) {
    //         // serverLog(stateOfX.serverLogType.info, 'Pot is already splitted, no need to check cases.');
    //         params.data.isPotsplitRequired = true;
    //     }

    //     // if(inActivePlayers.length == playingPlayers.length-1){
    //     //   return cb(null, params);
    //     // }
    //     // If pot is not splitted yet then check if it can split
    //     if (!params.data.isPotsplitRequired && params.table.isAllInOcccured) {
    //         // serverLog(stateOfX.serverLogType.info, 'ALLIN occured on the table.');
    //         //console.error(inActivePlayers.length ,"!@#$%^^^^^^^^^^^^", playedinRound.length, "!@@@@@@@@@@" ,playingPlayers.length);
    //         if (inActivePlayers.length + playedinRound.length >= playingPlayers.length) {
    //             // serverLog(stateOfX.serverLogType.info, 'All players have made their move with bets - ');
    //             // serverLog(stateOfX.serverLogType.info, _.pluck(playingPlayers, 'totalRoundBet'));
    //             // serverLog(stateOfX.serverLogType.info, 'Max bet placed by playing players in this round - ' + _.max(_.pluck(playingPlayers, 'totalRoundBet')));
    //             // serverLog(stateOfX.serverLogType.info, 'Min bet placed by playing players in this round - ' + _.min(_.pluck(playingPlayers, 'totalRoundBet')));

    //             // TODO: ADD this case below if required
    //             // _.min(_.pluck(playingPlayers, 'totalRoundBet')) != 0 &&
    //             // Removing as - 3 player, ALLIN/CALL/CALL, BET/CALL [62, 0, 62], 0 is for all in player and will fail the pot split case

    //             if (_.max(_.pluck(playingPlayers, 'totalRoundBet')) != _.min(_.pluck(playingPlayers, 'totalRoundBet'))) {
    //                 params.data.isPotsplitRequired = true;
    //             }
    //         }
    //     } else {
    //         // serverLog(stateOfX.serverLogType.info, 'No ALLIN occured on table yet!');
    //     }
    //     // IN CASE OF SINGLE COMPETETOR WINNER - sushiljainam
    //     // pot split is not required
    //     if (playingPlayers.length - foldedPlayers.length <= 1) {
    //         params.data.isPotsplitRequired = false;
    //     }

    //     cb(null, params);
    // }
    /*=============================  END  =============================*/


    /*=============================  START  =============================*/
    // Add amount to pot directly if splitting is not required
    // New Code
    async addAmountToPot(params: any): Promise<any> {
        // serverLog(stateOfX.serverLogType.info, 'splitting pot function addAmountToPot');

        if (!params.data.isPotsplitRequired) {

            params.table.pot = [{
                amount: 0,
                contributors: []
            }];

            for (let i = 0; i < params.table.contributors.length; i++) {

                params.table.pot[0].amount = this.utilsService.convertIntToDecimal(
                    params.table.pot[0].amount + params.table.contributors[i].amount
                );

                params.table.pot[0].contributors.push(params.table.contributors[i].playerId);
            }
        }

        return params;
    }

    // Old Code
    // var addAmountToPot = function (params, cb) {
    //     // serverLog(stateOfX.serverLogType.info, ' splitting pot function addAmountToPot');
    //     if (!params.data.isPotsplitRequired) {
    //         serverLog(stateOfX.serverLogType.info, "========== POT WILL NOT SPLIT IN THIS CASE ============");
    //         params.table.pot = [];
    //         params.table.pot.push({
    //             amount: 0,
    //             contributors: []
    //         })
    //         for (var i = 0; i < params.table.contributors.length; i++) {
    //             console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~", params.table.contributors[i])
    //             params.table.pot[0].amount = convert.convert(params.table.pot[0].amount + params.table.contributors[i].amount);
    //             params.table.pot[0].contributors.push(params.table.contributors[i].playerId);
    //         };
    //     }
    //     cb(null, params);
    // }
    /*=============================  END  =============================*/


    /*=============================  START  =============================*/
    // create side pots
    // New Code
    async createPot(params: any): Promise<any> {
        const sidepot = {
            amount: 0,
            contributors: [],
            processed: false
        };

        const considerIndex = params.data.considerPlayer;
        const contributors = params.data.contributors;

        if (contributors[considerIndex]) {
            const potForAmount = contributors[considerIndex].tempAmount;

            for (let i = 0; i < contributors.length; i++) {
                const contributor = contributors[i];

                if (contributor.tempAmount > 0) {
                    const playerIndexOnTable = _ld.findIndex(params.table.players, { playerId: contributor.playerId });

                    if (
                        playerIndexOnTable >= 0 &&
                        params.table.players[playerIndexOnTable].lastMove !== stateOfX.move.fold &&
                        params.table.players[playerIndexOnTable].state !== stateOfX.playerState.waiting
                    ) {
                        sidepot.contributors.push(contributor.playerId);
                    }

                    const deductAmount = Math.min(potForAmount, contributor.tempAmount);

                    sidepot.amount = this.utilsService.convertIntToDecimal(sidepot.amount + deductAmount);
                    contributor.tempAmount = this.utilsService.convertIntToDecimal(contributor.tempAmount - deductAmount);
                }
            }
        }

        return { success: true, sidepot };
    }

    // Old Code
    // var createPot = function (params, cb) {
    //     var sidepot = {
    //         amount: 0,
    //         contributors: [],
    //         processed: false
    //     };
    //     if (params.data.contributors[params.data.considerPlayer]) {
    //         let potForAmount = params.data.contributors[params.data.considerPlayer].tempAmount;
    //         for (var i = 0; i < params.data.contributors.length; i++) {
    //             if (params.data.contributors[i].tempAmount > 0) {
    //                 // Check if player still on the table
    //                 // Otherwise remove from contribution list
    //                 var playerIndexOnTable = _ld.findIndex(params.table.players, { playerId: params.data.contributors[i].playerId })
    //                 if (playerIndexOnTable >= 0 && params.table.players[playerIndexOnTable].lastMove !== stateOfX.move.fold && params.table.players[playerIndexOnTable].state !== stateOfX.playerState.waiting) {
    //                     sidepot.contributors.push(params.data.contributors[i].playerId);
    //                 } else {
    //                     //  sidepot.contributors.push(params.data.contributors[i].playerId);
    //                     // serverLog(stateOfX.serverLogType.info, 'This player ' + params.data.contributors[i].playerId + '  has left the table.');
    //                 }
    //                 let deductAmount = 0;
    //                 if (potForAmount <= params.data.contributors[i].tempAmount) {
    //                     deductAmount = potForAmount;
    //                 } else {
    //                     deductAmount = params.data.contributors[i].tempAmount;
    //                 }
    //                 sidepot.amount = convert.convert(sidepot.amount + deductAmount);
    //                 params.data.contributors[i].tempAmount = convert.convert(params.data.contributors[i].tempAmount - deductAmount);
    //             }
    //         }
    //     }
    //     console.log('createPot end', sidepot)
    //     // params.contributors.splice(params.contributors.length-1, 1);
    //     if (sidepot.amount > 0) {
    //         // serverLog(stateOfX.serverLogType.info, "New sidepot - " + JSON.stringify(sidepot));
    //     }
    //     cb({ success: true, sidepot: sidepot })
    // }
    /*=============================  END  =============================*/


    /*=============================  START  =============================*/
    // process pot split according to unequal contribution
    // New
    async splitPot(params: any): Promise<{ success: boolean, params?: any }> {

        const validated = await validateKeySets("Request", params.serverType, "splitPot", params);

        if (!validated.success) {
            return validated;
        }

        if (!params.data.isPotsplitRequired) {
            return { success: true, params };
        }


        for (let contributor of params.data.contributors) {
            const createPotResponse = await this.createPot(params);

            if (!createPotResponse.success) {
                throw createPotResponse;
            }


            if (createPotResponse.sidepot.amount > 0) {
                if (params.data.sidePots.length > 0) {
                    const lastSidePot = params.data.sidePots[params.data.sidePots.length - 1];
                    if (lastSidePot.contributors.length === createPotResponse.sidepot.contributors.length) {
                        lastSidePot.amount = this.utilsService.convertIntToDecimal(lastSidePot.amount + createPotResponse.sidepot.amount);
                    } else {
                        params.data.sidePots.push(createPotResponse.sidepot);
                    }
                } else {
                    params.data.sidePots.push(createPotResponse.sidepot);
                }
            }

            params.data.considerPlayer = params.data.considerPlayer - 1;
        }

        for (let i = 0; i < params.data.contributors.length; i++) {
            params.table.contributors[i].amount = params.data.contributors[i].amount;
            params.table.contributors[i].tempAmount = params.data.contributors[i].amount;
        }

        return { success: true, params };
    }

    // Old
    // var splitPot = function (params, cb) {
    //     // serverLog(stateOfX.serverLogType.info, ' splitting pot function splitPot');
    //     keyValidator.validateKeySets("Request", params.serverType, "splitPot", params, function (validated) {
    //         if (validated.success) {
    //             if (params.data.isPotsplitRequired) {
    //                 // Check if amount needs to be added
    //                 serverLog(stateOfX.serverLogType.info, "==== POT MIGHT SPLIT IN THIS CASE =====");
    //                 // if(params.data.amount <= 0) {
    //                 //   cb({success: true, params: params});
    //                 //   return;
    //                 // }

    //                 // Start spliting pot
    //                 // params.table.pot = [];
    //                 serverLog(stateOfX.serverLogType.info, "======1 CONTRIBUTORS =============" + JSON.stringify(params.data.contributors));
    //                 async.each(params.data.contributors, function (contributor, ecb) {
    //                     createPot(params, function (createPotResponse) {
    //                         if (createPotResponse.success) {
    //                             // serverLog(stateOfX.serverLogType.info, '====== Sidepot created ========');
    //                             serverLog(stateOfX.serverLogType.info, 'Create pot response: ' + JSON.stringify(createPotResponse.sidepot));

    //                             // var newSidepots = [];

    //                             if (createPotResponse.sidepot.amount > 0) {
    //                                 if (params.data.sidePots.length > 0) {
    //                                     if (params.data.sidePots[params.data.sidePots.length - 1].contributors.length === createPotResponse.sidepot.contributors.length) {
    //                                         params.data.sidePots[params.data.sidePots.length - 1].amount = convert.convert(params.data.sidePots[params.data.sidePots.length - 1].amount + createPotResponse.sidepot.amount);
    //                                     } else {
    //                                         params.data.sidePots.push(createPotResponse.sidepot);
    //                                     }
    //                                     // for (var i = 0; i < params.data.sidePots.length; i++) {

    //                                     //   // serverLog(stateOfX.serverLogType.info, 'Processing sidepot - ' + JSON.stringify(params.data.sidePots[i]));

    //                                     //   serverLog(stateOfX.serverLogType.info, params.data.sidePots[i].contributors.length + "< Contri  && New contri>" + createPotResponse.sidepot.contributors.length);

    //                                     //   if (params.data.sidePots[i].contributors.length === createPotResponse.sidepot.contributors.length) {
    //                                     //     // serverLog(stateOfX.serverLogType.info, 'Similar sidepot exists, adding amount only');
    //                                     //     // serverLog(stateOfX.serverLogType.info, 'Previous sidepot amount - ' + params.data.sidePots[i].amount);
    //                                     //     params.data.sidePots[i].amount = convert.convert(params.data.sidePots[i].amount + createPotResponse.sidepot.amount);
    //                                     //     // serverLog(stateOfX.serverLogType.info, 'After sidepot amount - ' + params.data.sidePots[i].amount);
    //                                     //   } else {
    //                                     //     if (newSidepots.length <= 0) {
    //                                     //       // serverLog(stateOfX.serverLogType.info, 'No newsidepot exists, insert new one!');
    //                                     //       newSidepots.push(createPotResponse.sidepot);
    //                                     //     } else {
    //                                     //       for (var j = 0; j < newSidepots.length; j++) {
    //                                     //         serverLog(stateOfX.serverLogType.info, params.data.sidePots[j].contributors.length + "< NContri  && NNew Ncontri>" + createPotResponse.sidepot.contributors.length);
    //                                     //         if (newSidepots[j].contributors.length !== createPotResponse.sidepot.contributors.length) {
    //                                     //           // serverLog(stateOfX.serverLogType.info, 'A new sidepot will be inserted later on - ' + JSON.stringify(newSidepots[j]));
    //                                     //           newSidepots.push(createPotResponse.sidepot);
    //                                     //         }
    //                                     //       };
    //                                     //     }
    //                                     //   }
    //                                     // };

    //                                     // Insert new sidepots
    //                                     // serverLog(stateOfX.serverLogType.info, 'newSidepots');
    //                                     // serverLog(stateOfX.serverLogType.info, 'New side pots: ' + JSON.stringify(newSidepots));

    //                                     // for (var k = 0; k < newSidepots.length; k++) {
    //                                     //   // serverLog(stateOfX.serverLogType.info, 'Inserting new sidepots - ' + JSON.stringify(newSidepots[k]));
    //                                     //   params.data.sidePots.push(newSidepots[k]);
    //                                     // };
    //                                 } else {
    //                                     // serverLog(stateOfX.serverLogType.info, 'No side pot exists, pushing new one');
    //                                     params.data.sidePots.push(createPotResponse.sidepot);
    //                                     // params.data.sidePots[params.data.sidePots.length-1].processed = true;
    //                                 }
    //                             }
    //                             params.data.considerPlayer = params.data.considerPlayer - 1;
    //                             ecb();
    //                         } else {
    //                             ecb(createPotResponse);
    //                         }
    //                     });
    //                 }, function (err) {
    //                     if (err) {
    //                         cb(err);
    //                     } else {
    //                         // serverLog(stateOfX.serverLogType.info, 'Resetting contributors of table');
    //                         for (var i = 0; i < params.data.contributors.length; i++) {
    //                             // params.table.roundContributors[i].playerId   = params.data.contributors[i].playerId;
    //                             params.table.contributors[i].amount = params.data.contributors[i].amount;
    //                             params.table.contributors[i].tempAmount = params.data.contributors[i].amount;
    //                         }
    //                         serverLog(stateOfX.serverLogType.info, '============FINAL POT AND CONTRI===========');
    //                         serverLog(stateOfX.serverLogType.info, 'Pot - ' + JSON.stringify(params.table.pot));
    //                         serverLog(stateOfX.serverLogType.info, 'Contributors - ' + JSON.stringify(params.table.contributors));


    //                         // delete params.data.sidePots;
    //                         // delete params.data.considerPlayer;

    //                         cb({ success: true, params: params });
    //                     }
    //                 });
    //             } else {
    //                 cb({ success: true, params: params });
    //             }
    //         } else {
    //             cb(validated);
    //         }
    //     });
    // }
    /*=============================  END  =============================*/


    /*=============================  START  =============================*/
    // process all steps of pot split
    // check if needed
    // then split pot
    // New
    async processSplit(params: any): Promise<any> {
        const validated = await validateKeySets("Request", "database", "processSplit", params);
        if (!validated.success) {
            return validated;
        }

        try {
            let updatedParams = await this.initializeParams(params);
            updatedParams = await this.isPotsplitRequired(updatedParams);
            updatedParams = await this.addAmountToPot(updatedParams);
            updatedParams = await this.splitPot(updatedParams);
            return updatedParams;
        } catch (error) {
            return error;
        }
    }

    // Old
    // potsplit.processSplit = function (params, cb) {
    //     keyValidator.validateKeySets("Request", "database", "processSplit", params, function (validated) {
    //         if (validated.success) {
    //             // serverLog(stateOfX.serverLogType.info, '======== POT SPLIT STARTED ========');

    //             async.waterfall([

    //                 async.apply(initializeParams, params),
    //                 isPotsplitRequired,
    //                 addAmountToPot,
    //                 splitPot

    //             ], function (err, response) {
    //                 if (!err) {
    //                     // serverLog(stateOfX.serverLogType.info, '======== POT SPLIT FINISHED (ERROR) ========');
    //                     cb(response);
    //                 } else {
    //                     // serverLog(stateOfX.serverLogType.info, '======== POT SPLIT FINISHED (NO ERROR) ========');
    //                     cb(err);
    //                 }
    //             })
    //         } else {
    //             cb(validated);
    //         }
    //     })
    // }

    /*=============================  END  =============================*/




}