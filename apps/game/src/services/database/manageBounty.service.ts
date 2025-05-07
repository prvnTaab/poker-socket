import { Injectable } from "@nestjs/common";
import _ from 'underscore';
import { stateOfX, popupTextManager } from "shared/common";
import { ImdbDatabaseService } from "shared/common/datebase/Imdbdatabase.service";
import { PokerDatabaseService } from "shared/common/datebase/pokerdatabase.service";

wallet = require("../../walletQuery");










@Injectable()
export class ManageBountyService {

    private popupTextManager = popupTextManager.falseMessages;

    constructor(
        private readonly db: PokerDatabaseService,
        private readonly imdb: ImdbDatabaseService,
        private readonly wallet: WalletService
    ) { }





    /*============================  START  =================================*/
    // New
    prepareCurrentPotLosers(currentPotLosers: any, players: any): any {
        const losers: any = [];

        for (let loserIt = 0; loserIt < currentPotLosers.length; loserIt++) {
            const playerId = currentPotLosers[loserIt];
            const player = players.find(p => p.playerId === playerId);
            if (player) {
                losers.push({
                    playerId: player.playerId,
                    playerName: player.playerName
                });
            }
        }

        console.log("losers are in prepareCurrentPotLosers are - " + JSON.stringify(losers));
        return losers;
    }

    // Old
    // const prepareCurrentPotLosers = function (currentPotLosers, players) {
    //     console.log("currentPotLosers and players are - " + JSON.stringify(currentPotLosers) + JSON.stringify(players));
    //     var losers = [];
    //     for (var loserIt = 0; loserIt < currentPotLosers.length; loserIt++) {
    //         losers.push({
    //             playerId: currentPotLosers[loserIt],
    //             playerName: (_.where(players, { playerId: currentPotLosers[loserIt] }))[0].playerName
    //         })
    //     }
    //     console.log("losers are in prepareCurrentPotLosers are - " + JSON.stringify(losers));
    //     return losers;
    // }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    /**
     * this function is used to findBountyWinners
     * @method findBountyWinners
     * @param  {Object}       params  request json object
     * @param  {cb}     cb      callback function
     */
    // New
    findBountyWinners(params: any): any {

        const outOfMoneyPlayers = params.table.players
            .filter((player) => player.state === "outOfMoney")
            .map((player) => player.playerId);


        if (outOfMoneyPlayers.length > 0) {
            for (let potIt = 0; potIt < params.data.decisionParams.length; potIt++) {
                const participatePlayers = params.data.decisionParams[potIt].playerCards.map(
                    (card) => card.playerId
                );


                let currentPotLosers = outOfMoneyPlayers.filter((id) =>
                    participatePlayers.includes(id)
                );


                if (potIt !== params.data.decisionParams.length - 1) {
                    const nextPotPlayers = params.data.decisionParams[potIt + 1].playerCards.map(
                        (card) => card.playerId
                    );

                    const notAllInPlayers = currentPotLosers.filter((id) =>
                        nextPotPlayers.includes(id)
                    );


                    if (notAllInPlayers.length > 0) {
                        currentPotLosers = currentPotLosers.filter(
                            (id) => !notAllInPlayers.includes(id)
                        );
                    }
                }


                if (currentPotLosers.length > 0) {
                    const formattedLosers = this.prepareCurrentPotLosers(
                        currentPotLosers,
                        params.table.players
                    );


                    for (const winner of params.data.decisionParams[potIt].winners) {
                        let winBounty = 0;

                        for (const loser of formattedLosers) {
                            const foundPlayer = params.table.players.find(
                                (p) => p.playerId === loser.playerId
                            );
                            if (foundPlayer) {
                                winBounty += foundPlayer.bounty;
                                foundPlayer.bounty = params.table.tournamentRules.bountyFees;
                            }
                        }

                        winBounty = Math.round(winBounty / params.data.decisionParams[potIt].winners.length);

                        params.data.bountyWinner.push({
                            winnerPlayerId: winner.playerId,
                            looserPlayers: formattedLosers,
                            bountyMoney: winBounty,
                        });
                    }
                }
            }
        } else {
            console.log("No need to distribute bounty there are no losers");
        }

        return params;
    }

    // Old
    // const findBountyWinners = function (params, cb) {
    //     console.log("in find bounty winners - ", params);
    //     console.log("in find bounty winners - table ", params.table);
    //     console.log("in find bounty winners - table players", params.table.players);
    //     console.log("in find bounty winners - data is", params.data);

    //     let outOfMoneyPlayers = _.pluck(_.where(params.table.players, { state: stateOfX.playerState.outOfMoney }), "playerId");
    //     console.log("out of money players are in findBountyWinners - ", outOfMoneyPlayers);
    //     if (outOfMoneyPlayers.length > 0) {
    //         for (let potIt = 0; potIt < params.data.decisionParams.length; potIt++) {
    //             //participated players is in current pot
    //             let participatePlayers = _.pluck(params.data.decisionParams[potIt].playerCards, "playerId");
    //             console.log("participatePlayers are in findBountyWinners are - ", participatePlayers);
    //             // find current pot out of money
    //             let currentPotLosers = _.intersection(outOfMoneyPlayers, participatePlayers);
    //             console.log("currentPotLosers are in findBountyWinners are - ", currentPotLosers);
    //             // If this is not last pot remove that players
    //             if (potIt !== (params.data.decisionParams.length - 1)) {
    //                 // players who not all in this pot
    //                 let notAllInPlayers = _.intersection(currentPotLosers, _.pluck(params.data.decisionParams[potIt + 1].playerCards, "playerId"));
    //                 console.log("not all in players are - ", notAllInPlayers);
    //                 if (notAllInPlayers.length > 0) {
    //                     currentPotLosers = _.difference(currentPotLosers, notAllInPlayers);
    //                 }
    //             }
    //             console.log("currentPotLosers after removing not all in players - ", currentPotLosers);
    //             if (currentPotLosers.length > 0) {
    //                 //calculate bounty money
    //                 // let bountyMoney = parseInt(params.table.tournamentRules.bountyFees * currentPotLosers.length / params.data.decisionParams[potIt].winners.length);
    //                 currentPotLosers = prepareCurrentPotLosers(currentPotLosers, params.table.players);
    //                 console.log("currentPotLosers are after inserting player name - ", currentPotLosers);
    //                 for (let winnerIt = 0; winnerIt < params.data.decisionParams[potIt].winners.length; winnerIt++) {
    //                     let winBounty = 0;
    //                     for (let looserIt = 0; looserIt < currentPotLosers.length; looserIt++) {
    //                         let foundIndex = _.findIndex(params.table.players, { playerId: currentPotLosers[looserIt].playerId })
    //                         if (foundIndex >= 0) {
    //                             winBounty += params.table.players[foundIndex].bounty;
    //                             params.table.players[foundIndex].bounty = params.table.tournamentRules.bountyFees;
    //                         }
    //                     }
    //                     winBounty = Math.round(winBounty / params.data.decisionParams[potIt].winners.length);
    //                     params.data.bountyWinner.push({
    //                         winnerPlayerId: params.data.decisionParams[potIt].winners[winnerIt].playerId,
    //                         looserPlayers: currentPotLosers,
    //                         bountyMoney: winBounty,
    //                     })
    //                 }
    //             }
    //         }
    //         cb(null, params);
    //     } else {
    //         console.log("No need to distribute bounty there are no loosers");
    //         cb(null, params);
    //     }
    // }
    /*============================  END  =================================*/



    /*============================  START  =================================*/
    /**
     * this function is used to add money to bounty winner players profile
     * @method addMoneyToProfile
     * @param  {Object}       params  request json object
     * @param  {cb}     cb      callback function
     */
    // New
    async addMoneyToProfile(params: any): Promise<any> {

    if (params.data.bountyWinner.length > 0) {
        for (const winner of params.data.bountyWinner) {
            console.log("Processing winner:", winner);

            let refNum = 'aa';
            try {
                const refNumber = await this.imdb.findRefrenceNumber({
                    playerId: params.data.playerId,
                    channelId: params.channelId,
                });

                if (refNumber.length > 0) {
                    refNum = refNumber[0].referenceNumber;
                }
            } catch (err) {
                console.error("Error fetching reference number:", err);
            }

            if (!winner.isBountyAdded) {
                const player = params.table.players.find(
                    (p) => p.playerId === winner.winnerPlayerId
                );
                let stackBounty = 0;

                if (player) {
                    stackBounty = Math.round(winner.bountyMoney / 2);
                    player.bounty += stackBounty;
                }

                this.wallet.sendWalletBroadCast({
                    action: 'bounty',
                    data: {
                        playerId: winner.winnerPlayerId,
                        isRealMoney: params.table.isRealMoney,
                        channelId: params.table.channelId,
                        tableName: params.table.channelName,
                        chips: winner.bountyMoney - stackBounty,
                        referenceNumber: refNum,
                        points: {
                            win: winner.bountyMoney - stackBounty,
                            promo: 0,
                            deposit: 0,
                            totalBalance: winner.bountyMoney - stackBounty,
                        },
                    },
                });
            }
        }

        console.log("Player chips added successfully");
    } else {
        console.log("There are no bounty winners in addMoneyToProfile");
    }

    return params;
    }

    // Old
    // const addMoneyToProfile = function (params, cb) {
    //     console.log("tournament rules is in addMoneyToProfile is - ", params.table);
    //     console.log("tournament rules bounty----------", params.data.bountyWinner);
    //     console.log("bountyWinner are in addMoneyToProfile is - " + JSON.stringify(params.data.bountyWinner));
    //     if (params.data.bountyWinner.length > 0) {
    //         async.eachSeries(params.data.bountyWinner, function (winner, callback) {
    //             console.log("winner is here guys- ", winner);
    //             imdb.findRefrenceNumber({ playerId: params.data.playerId, channelId: params.channelId }, async function (err, refNumber) {
    //                 let refNum = 'aa';
    //                 if (!err && refNumber.length) {
    //                     refNum = refNumber[0].referenceNumber;
    //                 }
    //                 if (!winner.isBountyAdded) {
    //                     let playerIndex = _.findIndex(params.table.players, { playerId: winner.winnerPlayerId });
    //                     let stackBounty = 0;
    //                     if (playerIndex >= 0) {
    //                         stackBounty = Math.round(winner.bountyMoney) / 2;
    //                         params.table.players[playerIndex].bounty += stackBounty;
    //                     }
    //                     wallet.sendWalletBroadCast({
    //                         action: 'bounty',
    //                         data: {
    //                             playerId: winner.winnerPlayerId,
    //                             isRealMoney: params.table.isRealMoney,
    //                             channelId: params.table.channelId,
    //                             tableName: params.table.channelName,
    //                             chips: winner.bountyMoney - stackBounty,
    //                             referenceNumber: refNum,
    //                             points: {
    //                                 win: winner.bountyMoney - stackBounty,
    //                                 promo: 0,
    //                                 deposit: 0,
    //                                 totalBalance: winner.bountyMoney - stackBounty,
    //                             }
    //                         }
    //                     })
    //                     callback();
    //                 } else {
    //                     callback();
    //                 }
    //             })
    //         }, function (err) {
    //             console.log("player chips added succesfully");
    //             cb(null, params);
    //         })
    //     } else {
    //         console.log("there are no bounty winners in addMoneyToProfile")
    //         cb(null, params);
    //     }
    // }
    /*============================  END  =================================*/




    /*============================  START  =================================*/
    /**
     * this function is used to updateBounty 
     * @method updateBounty
     * @param  {Object}       params  request json object
     * @param  {cb}     cb      callback function
     */
    // New
    async updateBounty(params: any): Promise<any> {
    
        if (params.data.bountyWinner.length > 0) {
        for (const bountyWinner of params.data.bountyWinner) {
            console.log("bounty is here guys- ", bountyWinner);
            const query = {
            tournamentId: params.table.tournamentRules.tournamentId,
            playerId: bountyWinner.winnerPlayerId,
            };
    
            try {
            await this.db.updateBounty(query, bountyWinner.bountyMoney);
            console.log("successfully updated bounty");
            } catch (err) {
            console.error("Error updating bounty:", err);
            throw new Error("Failed to update bounty");
            }
        }
        }
    
        return params;
    }

    // Old
    // const updateBounty = function (params, cb) {
    //     console.log("in saveBounty - " + JSON.stringify(params));
    //     if (params.data.bountyWinner.length > 0) {
    //         async.eachSeries(params.data.bountyWinner, function (bountyWinner, callback) {
    //             console.log("bounty is here guys- ", bountyWinner);
    //             var query = {
    //                 tournamentId: params.table.tournamentRules.tournamentId,
    //                 playerId: bountyWinner.winnerPlayerId
    //             }
    //             db.updateBounty(query, bountyWinner.bountyMoney, function (err, result) {
    //                 console.log("successfully updated bounty");
    //                 if (err) {
    //                     cb({ success: false });
    //                 } else {
    //                     callback();
    //                 }
    //             })
    //         }, function (err) {
    //             if (err) {
    //                 cb({ success: false });
    //             } else {
    //                 cb(null, params);
    //             }
    //         })
    //     } else {
    //         cb(null, params);
    //     }
    // }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    /**
     * this function is used to manageBounty through a series of async functions  defined above
     * @method process
     * @param  {Object}       params  request json object
     * @param  {cb}     cb      callback function
     */
    // New
    async process(params: any): Promise<any> {
        params.data.bountyWinner = [];

        try {
        const updatedParams = await this.findBountyWinners(params);
        await this.addMoneyToProfile(updatedParams);
        await this.updateBounty(updatedParams);
        return { success: true, result: updatedParams };
        } catch (err) {
        console.error("Error in manageBounty.process:", err);
        return {
            success: false,
            channelId: params.channelId || "",
            info: this.popupTextManager.MANAGEBOUNTYPROCESS_MANAGEBOUNTY,
            isRetry: false,
            isDisplay: true,
        };
        }
    }

    // Old
    // manageBounty.process = function (params, cb) {
    //     params.data.bountyWinner = [];
    //     console.log("params.data in manageBounty.process is - " + JSON.stringify(params.data));
    //     async.waterfall([
    //         async.apply(findBountyWinners, params),
    //         addMoneyToProfile,
    //         updateBounty
    //     ], function (err, response) {
    //         console.log("err and response is in manageBounty process - ", err, response);
    //         if (err) {
    //             cb({ success: false, channelId: (params.channelId || ""), info: popupTextManager.MANAGEBOUNTYPROCESS_MANAGEBOUNTY, isRetry: false, isDisplay: true });
    //             //cb({success: false, info: "Error in distributeBounty"});
    //         } else {
    //             cb({ success: true, result: params });
    //         }
    //     })
    // }
    /*============================  END  =================================*/















}