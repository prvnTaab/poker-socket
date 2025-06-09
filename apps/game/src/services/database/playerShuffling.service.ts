import { Injectable } from "@nestjs/common";
import _ld from "lodash";
import _ from 'underscore';
import { stateOfX, popupTextManager } from "shared/common";
import { PokerDatabaseService } from "shared/common/datebase/pokerdatabase.service";
import { ImdbDatabaseService } from "shared/common/datebase/Imdbdatabase.service";
import { TableManagerService } from "./tableManager.service";
import { DynamicRanksService } from "./dynamicRanks.service";






// lib = require("../../../../../shared/customLibrary.js"),






@Injectable()
export class PlayerShufflingService {


    private messages = popupTextManager.falseMessages;
    private dbMessages = popupTextManager.dbQyeryInfo;


    constructor(
        private readonly db: PokerDatabaseService,
        private readonly imdb: ImdbDatabaseService,
        private readonly tableManager: TableManagerService,
        private readonly dynamicRanks: DynamicRanksService,
    ) { }








    /*============================  START  =================================*/
    /**
     * this function gets tournament room using tournament ID
     */
    // New
    async getTournamentRoom(tournamentId: any): Promise<any> {
        try {
            const tournament = await this.db.getTournamentRoom(tournamentId);

            if (!tournament) {
                return {
                    success: false,
                    info: this.dbMessages.DB_GETTOURNAMENTROOM_FAILED_PLAYERSHUFFLING,
                    isRetry: false,
                    isDisplay: false,
                    channelId: ""
                };
            }

            if (tournament.isTournamentRunning === undefined || tournament.isTournamentRunning === true) {
                return { success: true, isTournamentRunning: true };
            } else {
                return { success: true, isTournamentRunning: false };
            }

        } catch (err) {
            return {
                success: false,
                info: this.dbMessages.DB_GETTOURNAMENTROOM_FAILED_PLAYERSHUFFLING,
                isRetry: false,
                isDisplay: false,
                channelId: ""
            };
        }
    };


    // Old
    // let getTournamentRoom = function (tournamentId, cb) {
    //     db.getTournamentRoom(tournamentId, function (err, tournament) {
    //         if (err || !tournament) {
    //             cb({ success: false, info: dbMessages.DB_GETTOURNAMENTROOM_FAILED_PLAYERSHUFFLING, isRetry: false, isDisplay: false, channelId: "" });
    //         } else {
    //             if (tournament.isTournamentRunning === undefined || tournament.isTournamentRunning === true) {
    //                 cb({ success: true, isTournamentRunning: true });
    //             } else {
    //                 cb({ success: true, isTournamentRunning: false });
    //             }
    //         }
    //     });
    // }
    /*============================  END  =================================*/




    /*============================  START  =================================*/
    /**
     * this funciton gets all tables using tournament id 
     */
    // New
    async getAllChannels(tournamentId: any): Promise<any> {
        const filter = {
            tournamentId: tournamentId,
        };

        try {
            let channels = await this.imdb.getAllTableByTournamentId(filter);

            if (!channels) {
                return {
                    success: false,
                    info: this.dbMessages.IMDB_GETALLTABLEBYTOURNAMENTID__FAILED_PLAYERSHUFFLING,
                    isRetry: false,
                    isDisplay: false,
                    channelId: ""
                };
            }

            channels = _.filter(channels, function (channel) {
                return channel.players.length > 0;
            });

            return { success: true, result: channels };

        } catch (err) {
            return {
                success: false,
                info: this.dbMessages.IMDB_GETALLTABLEBYTOURNAMENTID__FAILED_PLAYERSHUFFLING,
                isRetry: false,
                isDisplay: false,
                channelId: ""
            };
        }
    };


    // Old
    // const getAllChannels = function (tournamentId, cb) {
    //     const filter = {
    //         tournamentId: tournamentId,
    //     }
    //     imdb.getAllTableByTournamentId(filter, function (err, channels) {
    //         if (err || !channels) {
    //             cb({ success: false, info: dbMessages.IMDB_GETALLTABLEBYTOURNAMENTID__FAILED_PLAYERSHUFFLING, isRetry: false, isDisplay: false, channelId: "" });
    //         } else {
    //             channels = _.filter(channels, function (channel) {
    //                 return channel.players.length > 0;
    //             });
    //             cb({ success: true, result: channels });
    //         }
    //     })
    // }
    /*============================  END  =================================*/



    /*============================  START  =================================*/
    /**
     * this function initializes params
     * @method initializeParams
     * @param  {object}         params request json object
     * @param  {Function}       cb     callback function
     */
    // New
    initializeParams(params: any): any {
        const tempParams = {
            table: params.table,
            maxPlayerOnTable: params.table.maxPlayers,
            isChannelReductionPossible: false,
            allChannels: [],
            shiftedPlayers: [],
            shiftedPlayersData: [],
            outOfMoneyPlayers: []
        };

        return tempParams;
    };


    // Old
    // const initializeParams = function (params, cb) {
    //     const tempParams = {
    //         table: params.table,
    //         maxPlayerOnTable: params.table.maxPlayers,
    //         isChannelReductionPossible: false,
    //         allChannels: [],
    //         shiftedPlayers: [],
    //         shiftedPlayersData: [],
    //         outOfMoneyPlayers: []
    //     }
    //     cb(null, tempParams);
    // }
    /*============================  END  =================================*/



    /*============================  START  =================================*/
    // update seats while going for shuffling
    /**
     * this function updates seats while going for shuffling
     * @method updateSeats
     * @param  {object}    params request json object
     * @param  {Function}  cb     callback function
     */
    // New
    async updateSeats(params: any): Promise<any> {
        // console.log(stateOfX.serverLogType.info, "in update seats in player shuffling - ", JSON.stringify(params));
        const channelsResponse = await this.getAllChannels(params.table.tournamentRules.tournamentId);

        if (!channelsResponse.success) {
            throw {
                success: false,
                info: this.messages.GETALLCHANNELS_UPDATESEATS_FAILED_PLAYERSHUFFLING,
                isRetry: false,
                isDisplay: false,
                channelId: ""
            };
        }

        for (const channel of channelsResponse.result) {
            const updateFields = {
                vacantSeats: channel.maxPlayers - channel.players.length,
                occupiedSeats: channel.players.length
            };

            const response = await this.imdb.updateSeats(channel.channelId, updateFields);
            if (!response) {
                throw {
                    success: false,
                    info: this.dbMessages.IMDBUPDATESEATS_UPDATESEATSANDSHUFFLEID_FAILED_PLAYERSHUFFLING,
                    isRetry: false,
                    isDisplay: false,
                    channelId: ""
                };
            }
        }

        return params;
    };


    // Old
    // const updateSeats = function (params, cb) {
    //     //console.log(stateOfX.serverLogType.info,"in update seats in player shuffling - ",JSON.stringify(params));
    //     getAllChannels(params.table.tournamentRules.tournamentId, function (channelsResponse) {
    //         if (channelsResponse.success) {
    //             async.eachSeries(channelsResponse.result, function (channel, callback) {
    //                 let updateFields = {};
    //                 updateFields.vacantSeats = channel.maxPlayers - channel.players.length;
    //                 updateFields.occupiedSeats = channel.players.length;
    //                 imdb.updateSeats(channel.channelId, updateFields, function (err, response) {
    //                     if (err || !response) {
    //                         cb({ success: false, info: dbMessages.IMDBUPDATESEATS_UPDATESEATSANDSHUFFLEID_FAILED_PLAYERSHUFFLING, isRetry: false, isDisplay: false, channelId: "" });
    //                     } else {
    //                         callback()
    //                     }
    //                 })
    //             }, function (err) {
    //                 if (err) {
    //                     cb({ success: false, info: messages.ASYNCEACHSERIES_UPDATESEATS_FAILED_PLAYERSHUFFLING, isRetry: false, isDisplay: false, channelId: "" });
    //                 } else {
    //                     cb(null, params);
    //                 }
    //             })
    //         } else {
    //             cb({ success: false, info: messages.GETALLCHANNELS_UPDATESEATS_FAILED_PLAYERSHUFFLING, isRetry: false, isDisplay: false, channelId: "" });
    //         }
    //     })
    // }
    /*============================  END  =================================*/




    /*============================  START  =================================*/
    // Remove out of money players from params
    // New
    removeOutOfMoneyPlayers(params: any): any {
        // console.log(stateOfX.serverLogType.info, "params is in removeOutOfMoneyPlayers are - ", JSON.stringify(params));
        const outOfMoneyPlayers = _.where(params.table.players, { state: stateOfX.playerState.outOfMoney });
        params.table.players = _.difference(params.table.players, outOfMoneyPlayers);
        params.outOfMoneyPlayers = _.pluck(outOfMoneyPlayers, "playerId");
        return params;
    };

    // Old
    // const removeOutOfMoneyPlayers = function (params, cb) {
    //     //console.log(stateOfX.serverLogType.info,"parmas is in removeOutOfMoneyPlayers are - ",JSON.stringify(params));
    //     let outOfMoneyPlayers = _.where(params.table.players, { state: stateOfX.playerState.outOfMoney });
    //     params.table.players = _.difference(params.table.players, outOfMoneyPlayers)
    //     params.outOfMoneyPlayers = _.pluck(outOfMoneyPlayers, "playerId");
    //     cb(null, params);
    // }
    /*============================  END  =================================*/



    /*============================  START  =================================*/
    /**
     * this function checks whether channel reduction is possible or not
     * @method checkChannelReduction
     * @param  {object}              params request json object
     * @param  {Function}            cb     callback function
     */
    // New
    async checkChannelReduction(params: any): Promise<any> {
        // console.log(stateOfX.serverLogType.info, "params in checkTableReduction in playerShuffling - ", JSON.stringify(params));
        const channelsResponse = await this.getAllChannels(params.table.tournamentRules.tournamentId);

        if (channelsResponse.success) {
            let allPlayingPlayers = 0;
            params.allChannels = this.lib.pluckKeys(channelsResponse.result, ["channelId", "occupiedSeats", "vacantSeats", "players"]);
            const currentChannelIndex = _ld.findIndex(params.allChannels, { "channelId": (params.table.channelId).toString() });
            params.allChannels.splice(currentChannelIndex, 1);

            channelsResponse.result.forEach(function (channel: any) {
                allPlayingPlayers += channel.occupiedSeats;
            });

            let totalChannels = 0;
            for (let i = 0; i < channelsResponse.result.length; i++) {
                if (channelsResponse.result[i].occupiedSeats > 0) {
                    totalChannels++;
                }
            }

            allPlayingPlayers = allPlayingPlayers - params.outOfMoneyPlayers.length;
            const totalChannelsRequired = Math.ceil(allPlayingPlayers / params.maxPlayerOnTable);
            params.isChannelReductionPossible = totalChannelsRequired < totalChannels ? true : false;
            return params;
        } else {
            throw channelsResponse;
        }
    };


    // Old
    // const checkChannelReduction = function (params, cb) {
    //     //console.log(stateOfX.serverLogType.info,"params in checkTableReduction in playerShuffling - ",JSON.stringify(params));
    //     getAllChannels(params.table.tournamentRules.tournamentId, function (channelsResponse) {
    //         if (channelsResponse.success) {
    //             let allPlayingPlayers = 0;
    //             // params.totalChannels = channelsResponse.result;
    //             params.allChannels = lib.pluckKeys(channelsResponse.result, ["channelId", "occupiedSeats", "vacantSeats", "players"]);
    //             let currentChannelIndex = _ld.findIndex(params.allChannels, { "channelId": (params.table.channelId).toString() });
    //             params.allChannels.splice(currentChannelIndex, 1);
    //             channelsResponse.result.forEach(function (channel) {
    //                 allPlayingPlayers += channel.occupiedSeats;
    //             });
    //             let totalChannels = 0;
    //             for (let i = 0; i < channelsResponse.result.length; i++) {
    //                 if (channelsResponse.result[i].occupiedSeats > 0) {
    //                     totalChannels++;
    //                 }
    //             }
    //             allPlayingPlayers = allPlayingPlayers - params.outOfMoneyPlayers.length;
    //             const totalChannelsRequired = Math.ceil(allPlayingPlayers / params.maxPlayerOnTable);
    //             params.isChannelReductionPossible = totalChannelsRequired < totalChannels ? true : false;
    //             cb(null, params);
    //         } else {
    //             cb(channelsResponse);
    //         }
    //     })
    // }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    /**
     * this function pushes players into new channels 
     * @method pushPlayersInToNewChannel
     * @param  {array}                  players   players array
     * @param  {string}                  channelId 
     * @param  {Function}                cb        callback function
     */
    // New
    async pushPlayersInToNewChannel(players: any, channelId: any): Promise<any> {
        // console.log(stateOfX.serverLogType.info, "players and channelId id is in pushPlayersInToNewChannel in playerShuffling is - ", JSON.stringify(players), channelId);
        const response: any = await this.preparePlayers(players, channelId);

        if (response.success) {
            players = response.result;
            const result = await this.imdb.pushPlayersInTable(players, channelId);

            if (result) {
                return { success: true, result: players };
            } else {
                throw { success: false, info: this.messages.IMDB_PUSHPLAYERSINTABLE_FAILED_PLAYERSHUFFLING, isRetry: false, isDisplay: false, channelId: (channelId || "") };
            }
        } else {
            throw response;
        }
    };


    //Old
    // const pushPlayersInToNewChannel = function (players, channelId, cb) {
    //     //console.log(stateOfX.serverLogType.info,"players and channelId id is in pushPlayersInToNewChannel in playerShuffling is - ",JSON.stringify(players),channelId);
    //     preparePlayers(players, channelId, function (response) {
    //         if (response.success) {
    //             players = response.result;
    //             imdb.pushPlayersInTable(players, channelId, function (err, result) {
    //                 if (err || !result) {
    //                     cb({ success: false, info: messages.IMDB_PUSHPLAYERSINTABLE_FAILED_PLAYERSHUFFLING, isRetry: false, isDisplay: false, channelId: (channelId || "") });
    //                 }
    //                 cb({ success: true, result: players })
    //             })
    //         } else {
    //             cb(response);
    //         }
    //     })
    // }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    /**
     * this function prepares players to push into new channels
     * @method preparePlayersToPush
     * @param  {object}             allChannels    object containing allChannels
     * @param  {string}             currentChannel 
     * @return {array}              playersToPush              array containing players to push
     */
    // New
    preparePlayersToPush(allChannels: any, currentChannel: any): any {
        // console.log(stateOfX.serverLogType.info,"allChannels and currentChannel in preparePlayersToPush in playerShuffling is -",JSON.stringify(allChannels),JSON.stringify(currentChannel));
        let playersToPush: { players: any[]; channelId: string }[] = [];
        let players: any[] = [];
        let allChannelsIterartor = 0;

        for (let currentChannelIterator = 0; currentChannelIterator < currentChannel.players.length;) {
            if (players.length < allChannels[allChannelsIterartor].vacantSeats) {
                players.push(currentChannel.players[currentChannelIterator]);
                currentChannelIterator++;
            } else {
                playersToPush.push({
                    players: players,
                    channelId: allChannels[allChannelsIterartor].channelId
                });
                allChannelsIterartor++;
                players = [];
            }
        }

        if (players.length) {
            playersToPush.push({
                players: players,
                channelId: allChannels[allChannelsIterartor].channelId
            });
        }

        return playersToPush;
    };


    // Old
    // const preparePlayersToPush = function (allChannels, currentChannel) {
    //     //console.log(stateOfX.serverLogType.info,"allChannels and currentChannel in preparePlayersToPush in playerShuffling is -",JSON.stringify(allChannels),JSON.stringify(currentChannel));
    //     let playersToPush = [], players = [], allChannelsIterartor = 0;
    //     for (let currentChannelIterator = 0; currentChannelIterator < currentChannel.players.length;) {
    //         if (players.length < allChannels[allChannelsIterartor].vacantSeats) {
    //             players.push(currentChannel.players[currentChannelIterator]);
    //             currentChannelIterator++;
    //         } else {
    //             playersToPush.push({
    //                 players: players,
    //                 channelId: allChannels[allChannelsIterartor].channelId
    //             })
    //             allChannelsIterartor++;
    //             players = [];
    //         }
    //     }
    //     if (players.length) {
    //         playersToPush.push({
    //             players: players,
    //             channelId: allChannels[allChannelsIterartor].channelId
    //         })
    //     }
    //     return playersToPush;
    // }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    /**
     * this function checks whether is shuufling required or not
     * @method isShufflingRequired
     * @param  {string}            channel1 
     * @param  {string}            channel2 
     * @return {Boolean}           true or false whether shuffling is required or not
     */
    // New
    

    // Old
    const isShufflingRequired = function (channel1, channel2) {
        // //console.log(stateOfX.serverLogType.info,"channel 1 is - ",JSON.stringify(_.omit(channel1,"players")));
        if (Math.abs(channel1.players.length - channel2.players.length) > 1) {
            return true;
        } else {
            return false;
        }
    }
    /*============================  END  =================================*/

    /**
     * this function gets no. of players shifted
     * @method getNoOfPlayerShifted
     * @param  {integer}             totalPlayers  
     * @param  {integer}             occupiedSeats 
     */
    const getNoOfPlayerShifted = function (totalPlayers, occupiedSeats) {
        return (totalPlayers & 1) === 0 ? Math.abs(occupiedSeats - totalPlayers / 2) : Math.abs(occupiedSeats - Math.ceil(totalPlayers / 2));
    }

    /**
     * this function finds free seat index
     * @method findFreeSeatIndex
     * @param  {string}          channelId 
     * @param  {Function}        cb        callback funciton
     */
    const findFreeSeatIndex = function (channelId, cb) {
        //console.log(stateOfX.serverLogType.info,"channelId is in findFreeSeatIndex is in playerShuffling is - ",channelId);
        imdb.getTable(channelId, function (err, channel) {
            if (err || !channel) {
                cb({ success: false, info: messages.IMDB_GETTABLE_FINDFREESEATINDEX_FAILED_PLAYERSHUFFLING, isRetry: false, isDisplay: false, channelId: (channelId || "") });
            }
            const freeIndex = _.difference(_.range(1, channel.maxPlayers + 1), _.pluck(channel.players, "seatIndex"));
            cb({ success: true, result: freeIndex });
        })
    }

    /**
     * this function prepares the players to be shifted
     * @method preparePlayers
     * @param  {array}       players   array of players
     * @param  {string}       channelId 
     * @param  {Function}     cb        callback function
     */
    const preparePlayers = function (players, channelId, cb) {
        console.log("inside preparePlayers shuffling--------------------", players, channelId)
        let playersToBeShifted = [];
        findFreeSeatIndex(channelId, function (seatIndexResponse) {
            let index = 0;
            let seatIndexArray = seatIndexResponse.result;
            async.eachSeries(players, function (player, callback) {
                const newPlayer = tableManager.createPlayer({
                    playerId: player.playerId,
                    channelId: channelId,
                    playerName: player.playerName,
                    userName: player.playerName,
                    networkIp: "",
                    maxBuyIn: player.chips,
                    chips: player.chips,
                    seatIndex: seatIndexArray[index++],
                    imageAvtar: player.imageAvtar,
                    state: stateOfX.playerState.waiting,
                    onGameStartBuyIn: convert.convert(player.chips),
                    onSitBuyIn: convert.convert(player.chips),
                    timeBankLeft: parseInt(player.tournamentData.totalTimeBank),
                    roundId: null,
                });
                newPlayer.bounty = player.bounty;
                playersToBeShifted.push(newPlayer);
                callback();
            }, function (err) {
                if (err) {
                    cb({ success: false, info: messages.ASYNC_PREPAREPLAYERS_FAILED_PLAYERSHUFFLING, isRetry: false, isDisplay: false, channelId: (channelId || "") });
                } else {
                    cb({ success: true, result: playersToBeShifted });
                }
            })
        })
    }

    /**
     * this function merges two tables
     * @method mergeTwoTables
     * @param  {object}       channelToBeFilled 
     * @param  {object}       params            request json object
     * @param  {Function}     cb                callback function
     */
    const mergeTwoTables = function (channelToBeFilled, params, cb) {
        console.log("inside mergeTwoTables---", params)
        console.log("inside mergeTwoTables---222", params.table)
        //console.log(stateOfX.serverLogType.info,"channelToBeFilled and params are in mergeTwoTables in playerShuffling is ",JSON.stringify(channelToBeFilled), JSON.stringify(params));
        let totalPlayers = channelToBeFilled.players.length + params.table.players.length;
        let noOfPlayerShifted = getNoOfPlayerShifted(totalPlayers, params.table.players.length);
        let playersToBeShifted = params.table.players.splice(0, noOfPlayerShifted);
        preparePlayers(playersToBeShifted, channelToBeFilled.channelId, function (response) {
            if (response.success) {
                playersToBeShifted = response.result;
                imdb.pushPlayersInTable(playersToBeShifted, channelToBeFilled.channelId, function (err, result) {
                    if (err || !result) {
                        cb({ success: false, info: messages.IMDB_PUSHPLAYERSINTABLE_FAILED_PLAYERSHUFFLING, isRetry: false, isDisplay: false, channelId: (channelToBeFilled.channelId || "") });
                    }
                    cb({ success: true, result: playersToBeShifted })
                })
            } else {
                cb(response);
            }
        })
    }

    /**
     * this function shuffles with shuffle table id
     * @method shufflingWithShuffleTableId
     * @param  {object}                       channelToBeFilled 
     * @param  {object}                       params            
     * @param  {Function}                     cb                callback function
     */
    const shufflingWithShuffleTableId = function (channelToBeFilled, params, cb) {
        // //console.log(stateOfX.serverLogType.info,"parmas is in shufflingWithShuffleTableId is in playerShuffling is - ",JSON.stringify(params.table));
        // Check if shuffling required
        if (isShufflingRequired(channelToBeFilled[0], params.table)) { //If shuffling required
            if (params.table.occupiedSeats > channelToBeFilled[0].occupiedSeats) { // If current channel have more occupiedseats
                mergeTwoTables(channelToBeFilled[0], params, function (response) { //merge two tables
                    if (response.success) {
                        cb({ success: true, isShuffleByTableId: true, playerShuffled: response.result });
                    } else {
                        cb({ success: false });
                    }
                })
            } else { // If current channel have less occupied seats
                cb({ success: true, isShuffleByTableId: false })
            }
        } else { //No shuffling required
            cb({ success: true });
        }
    }

    //update table shuffle id
    /**
     * this function updates table shuffle id
     * @method updateTableShuffleId
     * @param  {object}             channelToBeFilledId 
     * @param  {string}             channelId           
     * @param  {Function}           cb                  callback function
     */
    const updateTableShuffleId = function (channelToBeFilledId, channelId, cb) {
        //console.log(stateOfX.serverLogType.info,"channelToBeFilled and channelId is in updateTableShuffleId is in playerShuffling is - ",channelToBeFilledId,channelId);
        imdb.updateTableShuffleId(channelToBeFilledId, channelId, function (err, result) {
            if (err || !result) {
                cb({ success: false });
            }
            cb({ success: true });
        })

    }

    /**
     * this function shuffles without shuffle table id
     * @method shufflingWithoutShuffleTableId
     * @param  {object}                       channelToBeFilled 
     * @param  {object}                       params            
     * @param  {Function}                     cb                callback function
     */
    const shufflingWithoutShuffleTableId = function (channelToBeFilled, params, cb) {
        //console.log(stateOfX.serverLogType.info,"channelToBeFilled is in shufflingWithoutShuffleTableId in playerShuffling is - ",JSON.stringify(channelToBeFilled));
        if (isShufflingRequired(channelToBeFilled, params.table)) {
            if (params.table.players.length > channelToBeFilled.players.length) { // If current channel have more occupiedseats
                mergeTwoTables(channelToBeFilled, params, function (response) { //merge two tables
                    if (response.success) {
                        const playerShuffled = !!response.result ? response.result : [];
                        cb({ success: true, playerShuffled: playerShuffled });
                    } else {
                        cb({ success: false });
                    }
                })
            } else {
                updateTableShuffleId(channelToBeFilled.channelId, params.table.channelId, function (response) {
                    if (response.success) {
                        cb({ success: true, playerShuffled: [] })
                    } else {
                        cb({ success: false })
                    }
                })
            }
        } else {
            cb({ success: true, playerShuffled: [] })
        }
    }

    const prepareShiftedPlayersForChannelWithoutReduction = function (players) {
        let shiftedPlayers = [];
        for (let playerIterator = 0; playerIterator < players.length; playerIterator++) {
            shiftedPlayers.push({
                playerId: players[playerIterator].playerId,
                newChannelId: players[playerIterator].channelId
            })
        }
        return shiftedPlayers;
    }

    /**
     * this funciton performs shuffling without channel reduction
     * @method shufflingWithoutChannelReduction
     * @param  {object}                      params request json object
     * @param  {Function}                    cb     callback function
     */
    const shufflingWithoutChannelReduction = function (params, cb) {
        //console.log(stateOfX.serverLogType.info,"params is in shufflingWithoutChannelReduction is in players shuffling - ",JSON.stringify(params.table));
        params.allChannels = _.sortBy(params.allChannels, "vacantSeats").reverse();
        //If table shuffle id is available
        if (!!params.table.shuffleTableId) {
            // get the channel by which it is shuffled
            let channelToBeFilled = _.where(params.allChannels, { channelId: params.table.shuffleTableId });
            // check that channel is still availble
            if (channelToBeFilled.length > 0) {
                //shuffle these two tables
                shufflingWithShuffleTableId(channelToBeFilled, params, function (response) {
                    if (response.success) {
                        if (!!response.isShuffleByTableId) { // Shuffle by table Id success just resturn table
                            params.outOfMoneyPlayers = _.pluck(response.playerShuffled, "playerId");
                            params.table.shuffleTableId = "";
                            cb(response)
                        } else {
                            //Shuffle by tableId not happen - try to shuffle by sort players
                            shufflingWithoutShuffleTableId(params.allChannels[0], params, function (response) {
                                if (response.success) {
                                    cb(response);
                                } else {
                                    cb(response);
                                }
                            })
                        }
                    } else {
                        cb(response);
                    }
                });
            } else {// that channel is not availble
                cb({ success: true });
            }
        } else { // if table shuffle id is not availabe available
            shufflingWithoutShuffleTableId(params.allChannels[0], params, function (response) {
                cb(response);
            })
        }
    }

    // preparing array for sending broadcast later
    /**
     * this function prepares array for sending broadcast later
     * @method prepareShiftedPlayers
     * @param  {array}              players players array
     */
    const prepareShiftedPlayers = function (players) {
        let shiftPlayers = [];
        let shiftedPlayersData = [];
        for (let channelIterator = 0; channelIterator < players.length; channelIterator++) {
            let playersArray = players[channelIterator].players;
            for (let playerIterator = 0; playerIterator < playersArray.length; playerIterator++) {
                playersArray[playerIterator].channelId = players[channelIterator].channelId;
                shiftedPlayersData.push(playersArray[playerIterator]);
                shiftPlayers.push({
                    playerId: playersArray[playerIterator].playerId,
                    newChannelId: players[channelIterator].channelId
                })
            }
        }
        return {
            shiftPlayers: shiftPlayers,
            shiftedPlayersData: shiftedPlayersData
        };
    }


    /**
     * this funciton performs shuffling with channel reduction
     * @method shufflingWithChannelReduction
     * @param  {object}                      params request json object
     * @param  {Function}                    cb     callback function
     */
    const shufflingWithChannelReduction = function (params, cb) {
        console.log("inside shufflingWithChannelReduction", params)
        console.log("inside shufflingWithChannelReduction2222", params.allChannels)
        console.log("inside shufflingWithChannelReduction23333", params.table)
        params.allChannels = _.sortBy(params.allChannels, "vacantSeats");
        let playersToPush = preparePlayersToPush(params.allChannels, params.table);
        params.shiftedPlayers = (prepareShiftedPlayers(playersToPush)).shiftPlayers;
        //params.shiftedPlayersData = (prepareShiftedPlayers(playersToPush)).shiftedPlayersData;
        async.eachSeries(playersToPush, function (player, callback) {
            pushPlayersInToNewChannel(player.players, player.channelId, function (response) {
                if (response.success) {
                    params.shiftedPlayersData = _.union(params.shiftedPlayersData, response.result);
                    callback();
                } else {
                    cb(response);
                }
            })
        }, function (err) {
            if (err) {
                cb(params);
            } else {
                cb({ success: true, result: params });
            }
        })
    }

    /**
     * this function process shuffling both with or without channelReduction
     * @method processShuffling
     * @param  {[type]}         params [description]
     * @param  {Function}       cb     [description]
     * @return {[type]}                [description]
     */
    const processShuffling = function (params, cb) {
        //console.log(stateOfX.serverLogType.info,"params is in processShuffling in playerShuffling is - ",JSON.stringify(params));
        if (params.isChannelReductionPossible) {
            shufflingWithChannelReduction(params, function (shufflingWithChannelReductionResponse) {
                if (shufflingWithChannelReductionResponse.success) {
                    cb(null, shufflingWithChannelReductionResponse.result);
                } else {
                    cb(shufflingWithChannelReductionResponse);
                }
            })
        } else {
            shufflingWithoutChannelReduction(params, function (shufflingWithoutChannelReductionResponse) {
                if (shufflingWithoutChannelReductionResponse.success) {
                    params.shiftedPlayers = prepareShiftedPlayersForChannelWithoutReduction(shufflingWithoutChannelReductionResponse.playerShuffled);
                    params.shiftedPlayersData = shufflingWithoutChannelReductionResponse.playerShuffled;
                    cb(null, params);
                } else {
                    cb(shufflingWithoutChannelReductionResponse);
                }
            })
        }
    }

    // remove shifted players from current channel
    /**
     * this function removes shifted players from current chaanel
     * @method removeShiftedPlayers
     * @param  {object}             params request json object
     * @param  {Function}           cb     callback function
     */
    const removeShiftedPlayers = function (params, cb) {
        //console.log(stateOfX.serverLogType.info,"params is in remove shifted players are in playerShuffling is - ",JSON.stringify(params.shiftedPlayers));
        if (params.shiftedPlayers.length > 0) {
            let newPlayers = [];
            for (let playerIterator = 0; playerIterator < params.table.players.length; playerIterator++) {
                let countPlayers = 0;
                for (let shiftedPlayersIterator = 0; shiftedPlayersIterator < params.shiftedPlayers.length; shiftedPlayersIterator++) {
                    if (params.table.players[playerIterator].playerId === params.shiftedPlayers[shiftedPlayersIterator].playerId) {
                        countPlayers++;
                    }
                }
                if (countPlayers === 0) {
                    newPlayers.push(params.table.players[playerIterator]);
                }
            }
            params.table.players = newPlayers;
            cb(null, params);
        } else {
            cb(null, params);
        }
    }

    /**
     * this function updates seats and shuufle id
     * @method updateSeatsAndShuffleId
     * @param  {object}                params request json object
     * @param  {Function}              cb     callback function
     */
    const updateSeatsAndShuffleId = function (params, cb) {
        params.table.occupiedSeats = params.table.occupiedSeats - params.outOfMoneyPlayers.length;
        params.table.vacantSeats = params.table.vacantSeats + params.outOfMoneyPlayers.length;
        async.eachSeries(params.shiftedPlayers, function (players, callback) {
            imdb.getTable(players.newChannelId, function (err, result) {
                if (err || !result) {
                    cb({ success: false, info: messages.IMDB_GETTABLE_UPDATESEATSANDSHUFFLEID_FAILED_PLAYERSHUFFLING, isRetry: false, isDisplay: false, channelId: (players.newChannelId || "") });
                } else {
                    let updateFields = {};
                    if (result.channelId != params.table.channelId) {
                        updateFields.vacantSeats = result.maxPlayers - result.players.length;
                        updateFields.occupiedSeats = result.players.length;
                    } else {
                        updateFields.shuffleTableId = "";
                    }
                    imdb.updateSeats(params.table.channelId, updateFields, function (err, response) {
                        if (err || !response) {
                            cb({ success: false, info: dbMessages.IMDBUPDATESEATS_UPDATESEATSANDSHUFFLEID_FAILED_PLAYERSHUFFLING, isRetry: false, isDisplay: false, channelId: (params.table.channelId || "") });
                        } else {
                            imdb.upsertPlayerJoin({ playerId: players.playerId, channelId: params.table.channelId }, { $set: { channelId: players.newChannelId } }, (err, result) => {
                                if (err) {
                                    cb({ success: false, info: dbMessages.IMDBUPDATESEATS_UPDATESEATSANDSHUFFLEID_FAILED_PLAYERSHUFFLING, isRetry: false, isDisplay: false, channelId: (params.table.channelId || "") });
                                } else {
                                    callback()
                                }
                            })
                        }
                    })
                }
            })
        }, function (err) {
            if (err) {
                cb(params);
            } else {
                cb(null, params);
            }
        })
    }

/**
 * this function contains the entire shuffle processs in series of steps
 * @method shuffle
 * @param  {object}   params requst json object
 * @param  {Function} cb     callback function
 */
playerShuffling.shuffle = function (params, cb) {
        // //console.log(stateOfX.serverLogType.info,"params in shuffle in playerShuffling is - " + JSON.stringify(params));
        getTournamentRoom(params.table.tournamentRules.tournamentId, function (tournamentResponse) {
            if (tournamentResponse.success) {
                if (params.table.roundCount === 1 || !tournamentResponse.isTournamentRunning) {
                    //console.log(stateOfX.serverLogType.info,"This is first round no need to shuffle or may be tournament is not running rigth now satellite case !!!");
                    params.data.isPlayerShuffled = false;
                    params.data.success = true;
                    cb({ success: true, table: params.table, data: params.data });
                    return;
                }
                dynamicRanks.getRegisteredTournamentUsers(params.table.tournamentRules.tournamentId);
                if (params.table.channelType === stateOfX.gameType.tournament) {
                    getAllChannels(params.table.tournamentRules.tournamentId, function (channelsResponse) {
                        // check whether more than one channel available
                        if (channelsResponse.success && channelsResponse.result.length > 1) {
                            async.waterfall([
                                async.apply(initializeParams, params),
                                removeOutOfMoneyPlayers,
                                updateSeats,
                                checkChannelReduction,
                                processShuffling,
                                removeShiftedPlayers,
                                updateSeatsAndShuffleId
                            ], function (err, response) {
                                if (!err && !!response) {
                                    response.isPlayerShuffled = true;
                                    response.success = true;
                                    response.tournamentId = response.table.tournamentRules.tournamentId;
                                    cb({ success: true, table: response.table, data: _.omit(response, 'table') });
                                } else {
                                    cb(err);
                                }
                            });
                        } else {
                            //console.log(stateOfX.serverLogType.info,"*********** NO NEED TO SHUFFLE CHANNEL ONLY ONE CHANNEL AVAILABLE *************" + JSON.stringify(channelsResponse));
                            params.data.isPlayerShuffled = false;
                            params.data.success = true;
                            params.data.totalChannels = 1;
                            cb({ success: true, table: params.table, data: params.data });
                        }
                    })
                } else {
                    //console.log(stateOfX.serverLogType.info,"No need to shuffling this is not a tournament");
                    params.data.isPlayerShuffled = false;
                    params.data.success = true;
                    cb({ success: true, table: params.table, data: params.data });
                }
            } else {
                cb(tournamentResponse);
            }
        })
    }

















}