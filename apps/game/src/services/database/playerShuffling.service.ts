import { Injectable } from "@nestjs/common";
import _ld from "lodash";
import _ from 'underscore';
import { stateOfX, popupTextManager, UtilityService } from "shared/common";
import { PokerDatabaseService } from "shared/common/datebase/pokerdatabase.service";
import { ImdbDatabaseService } from "shared/common/datebase/Imdbdatabase.service";
import { TableManagerService } from "./tableManager.service";
import { DynamicRanksService } from "./dynamicRanks.service";
import { CustomLibraryService } from "shared/common/utils/custumLibrary.service";






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
        private readonly utilsService: UtilityService,
        private readonly lib: CustomLibraryService,
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

    /*============================  END  =================================*/


    /*============================  START  =================================*/
    /**
     * this function checks whether is shuufling required or not
     * @method isShufflingRequired
     * @param  {string}            channel1 
     * @param  {string}            channel2 
     * @return {Boolean}           true or false whether shuffling is required or not
     */
isShufflingRequired(channel1: any, channel2: any): boolean {
    return Math.abs(channel1.players.length - channel2.players.length) > 1;
}
/*============================  END  =================================*/

/**
 * this function gets no. of players shifted
 * @method getNoOfPlayerShifted
 * @param  {integer}             totalPlayers  
 * @param  {integer}             occupiedSeats 
 */
getNoOfPlayerShifted (totalPlayers, occupiedSeats) {
    return (totalPlayers & 1) === 0 ? Math.abs(occupiedSeats - totalPlayers / 2) : Math.abs(occupiedSeats - Math.ceil(totalPlayers / 2));
}

/**
 * this function finds free seat index
 * @method findFreeSeatIndex
 * @param  {string}          channelId 
 * @param  {Function}        cb        callback funciton
 */
async findFreeSeatIndex(channelId: string): Promise<any> {
  try {
    const channel = await this.imdb.getTable(channelId);
    if (!channel) {
      return {
        success: false,
        info: popupTextManager.dbQyeryInfo.IMDB_GETTABLE_FINDFREESEATINDEX_FAILED_PLAYERSHUFFLING,
        isRetry: false,
        isDisplay: false,
        channelId: channelId || "",
      };
    }

    // Get all seat indexes from 1 to maxPlayers, and subtract occupied ones
    const occupiedIndexes = channel.players.map((p: any) => p.seatIndex);
    const freeIndex = _.difference(_.range(1, channel.maxPlayers + 1), occupiedIndexes);

    return {
      success: true,
      result: freeIndex,
    };
  } catch (error) {
    return {
      success: false,
      info: popupTextManager.dbQyeryInfo.IMDB_GETTABLE_FINDFREESEATINDEX_FAILED_PLAYERSHUFFLING,
      isRetry: false,
      isDisplay: false,
      channelId: channelId || "",
    };
  }
}

/**
 * this function prepares the players to be shifted
 * @method preparePlayers
 * @param  {array}       players   array of players
 * @param  {string}       channelId 
 * @param  {Function}     cb        callback function
 */
async preparePlayers(players: any, channelId: string): Promise<any> {
  const playersToBeShifted = [];

  const seatIndexResponse = await this.findFreeSeatIndex(channelId);
  if (!seatIndexResponse.success || !seatIndexResponse.result) {
    return {
      success: false,
      info: popupTextManager.dbQyeryInfo.IMDB_GETTABLE_FINDFREESEATINDEX_FAILED_PLAYERSHUFFLING,
      isRetry: false,
      isDisplay: false,
      channelId: channelId || "",
    };
  }

  const seatIndexArray = seatIndexResponse.result;

  for (let index = 0; index < players.length; index++) {
    const player = players[index];
    const seatIndex = seatIndexArray[index];

    const newPlayer = this.tableManager.createPlayer({
      playerId: player.playerId,
      channelId,
      playerName: player.playerName,
      userName: player.playerName,
      networkIp: "",
      maxBuyIn: player.chips,
      chips: player.chips,
      seatIndex,
      imageAvtar: player.imageAvtar,
      state: stateOfX.playerState.waiting,
      onGameStartBuyIn: this.utilsService.convertIntToDecimal(player.chips),
      onSitBuyIn: this.utilsService.convertIntToDecimal(player.chips),
      timeBankLeft: parseInt(player.tournamentData.totalTimeBank.toString(), 10),
      roundId: null,
    });
    newPlayer.bounty = player.bounty;
    playersToBeShifted.push(newPlayer);
  }

  return { success: true, result: playersToBeShifted };
}


/**
 * this function merges two tables
 * @method mergeTwoTables
 * @param  {object}       channelToBeFilled 
 * @param  {object}       params            request json object
 * @param  {Function}     cb                callback function
 */
async mergeTwoTables(
  channelToBeFilled: any,
  params: any
): Promise<any> {

  const totalPlayers = channelToBeFilled.players.length + params.table.players.length;
  const noOfPlayerShifted = this.getNoOfPlayerShifted(totalPlayers, params.table.players.length);
  let playersToBeShifted = params.table.players.splice(0, noOfPlayerShifted);

  const response = await this.preparePlayers(playersToBeShifted, channelToBeFilled.channelId);
  if (!response.success) {
    return response;
  }

  playersToBeShifted = response.result;

  try {
    const result = await this.imdb.pushPlayersInTable(playersToBeShifted, channelToBeFilled.channelId);
    if (!result) {
      return {
        success: false,
        info: popupTextManager.dbQyeryInfo.IMDB_PUSHPLAYERSINTABLE_FAILED_PLAYERSHUFFLING,
        isRetry: false,
        isDisplay: false,
        channelId: channelToBeFilled.channelId || ""
      };
    }
    return { success: true, result: playersToBeShifted };
  } catch (err) {
    return {
      success: false,
      info: popupTextManager.dbQyeryInfo.IMDB_PUSHPLAYERSINTABLE_FAILED_PLAYERSHUFFLING,
      isRetry: false,
      isDisplay: false,
      channelId: channelToBeFilled.channelId || ""
    };
  }
}

/**
 * this function shuffles with shuffle table id
 * @method shufflingWithShuffleTableId
 * @param  {object}                       channelToBeFilled 
 * @param  {object}                       params            
 * @param  {Function}                     cb                callback function
 */
async shufflingWithShuffleTableId(
  channelToBeFilled: any[],
  params: any
): Promise<any> {
  if (this.isShufflingRequired(channelToBeFilled[0], params.table)) {
    if (params.table.occupiedSeats > channelToBeFilled[0].occupiedSeats) {
      const response = await this.mergeTwoTables(channelToBeFilled[0], params);
      if (response.success) {
        return {
          success: true,
          isShuffleByTableId: true,
          playerShuffled: response.result
        };
      } else {
        return { success: false };
      }
    } else {
      return { success: true, isShuffleByTableId: false };
    }
  } else {
    return { success: true };
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
async updateTableShuffleId(
  channelToBeFilledId: string,
  channelId: string
): Promise<any> {
  try {
    const result = await this.imdb.updateTableShuffleId(channelToBeFilledId, channelId);
    if (!result) {
      return { success: false };
    }
    return { success: true };
  } catch (err) {
    return { success: false };
  }
}

/**
 * this function shuffles without shuffle table id
 * @method shufflingWithoutShuffleTableId
 * @param  {object}                       channelToBeFilled 
 * @param  {object}                       params            
 * @param  {Function}                     cb                callback function
 */
async shufflingWithoutShuffleTableId(channelToBeFilled: any, params: any): Promise<{ success: boolean; playerShuffled?: any[] }> {
  if (this.isShufflingRequired(channelToBeFilled, params.table)) {
    if (params.table.players.length > channelToBeFilled.players.length) {
      // Merge two tables
      const response = await this.mergeTwoTables(channelToBeFilled, params);
      if (response.success) {
        const playerShuffled = response.result || [];
        return { success: true, playerShuffled };
      } else {
        return { success: false };
      }
    } else {
      // Update shuffle ID
      const response = await this.updateTableShuffleId(channelToBeFilled.channelId, params.table.channelId);
      if (response.success) {
        return { success: true, playerShuffled: [] };
      } else {
        return { success: false };
      }
    }
  } else {
    return { success: true, playerShuffled: [] };
  }
}

prepareShiftedPlayersForChannelWithoutReduction(players: any[]): any {
  return players.map(player => ({
    playerId: player.playerId,
    newChannelId: player.channelId
  }));
}
/**
 * this funciton performs shuffling without channel reduction
 * @method shufflingWithoutChannelReduction
 * @param  {object}                      params request json object
 * @param  {Function}                    cb     callback function
 */
async shufflingWithoutChannelReduction(params: any): Promise<any> {
  params.allChannels = _.sortBy(params.allChannels, "vacantSeats").reverse();

  if (params.table.shuffleTableId) {
    const channelToBeFilled = _.where(params.allChannels, { channelId: params.table.shuffleTableId });

    if (channelToBeFilled.length > 0) {
      const response = await this.shufflingWithShuffleTableId(channelToBeFilled, params);

      if (response.success) {
        if (response.isShuffleByTableId) {
          params.outOfMoneyPlayers = _.pluck(response.playerShuffled, "playerId");
          params.table.shuffleTableId = "";
          return response;
        } else {
          const fallbackResponse = await this.shufflingWithoutShuffleTableId(params.allChannels[0], params);
          return fallbackResponse;
        }
      } else {
        return response;
      }
    } else {
      return { success: true };
    }
  } else {
    return await this.shufflingWithoutShuffleTableId(params.allChannels[0], params);
  }
}
// preparing array for sending broadcast later


/**
 * this function prepares array for sending broadcast later
 * @method prepareShiftedPlayers
 * @param  {array}              players players array
 */
prepareShiftedPlayers(players: any) {
  const shiftPlayers: { playerId: string; newChannelId: string }[] = [];
  const shiftedPlayersData: any = [];

  for (const playerGroup of players) {
    for (const player of playerGroup.players) {
      player.channelId = playerGroup.channelId;
      shiftedPlayersData.push(player);
      shiftPlayers.push({
        playerId: player.playerId,
        newChannelId: playerGroup.channelId,
      });
    }
  }

  return {
    shiftPlayers,
    shiftedPlayersData,
  };
}

/**
 * this funciton performs shuffling with channel reduction
 * @method shufflingWithChannelReduction
 * @param  {object}                      params request json object
 * @param  {Function}                    cb     callback function
 */
async shufflingWithChannelReduction(params: any): Promise<{ success: boolean; result?: any }> {

  params.allChannels = _.sortBy(params.allChannels, "vacantSeats");
  const playersToPush = this.preparePlayersToPush(params.allChannels, params.table);
  const { shiftPlayers, shiftedPlayersData } = this.prepareShiftedPlayers(playersToPush);

  params.shiftedPlayers = shiftPlayers;
  params.shiftedPlayersData = [];

  for (const playerGroup of playersToPush) {
    const response = await this.pushPlayersInToNewChannel(playerGroup.players, playerGroup.channelId);
    if (!response.success) {
      return response;
    }
    params.shiftedPlayersData = _.union(params.shiftedPlayersData, response.result);
  }

  return { success: true, result: params };
}

/**
 * this function process shuffling both with or without channelReduction
 * @method processShuffling
 * @param  {[type]}         params [description]
 * @param  {Function}       cb     [description]
 * @return {[type]}                [description]
 */
async processShuffling(params: any): Promise<any> {
  if (params.isChannelReductionPossible) {
    const response = await this.shufflingWithChannelReduction(params);
    if (response.success) {
      return response.result;
    } else {
      throw response;
    }
  } else {
    const response = await this.shufflingWithoutChannelReduction(params);
    if (response.success) {
      params.shiftedPlayers = this.prepareShiftedPlayersForChannelWithoutReduction(response.playerShuffled);
      params.shiftedPlayersData = response.playerShuffled;
      return params;
    } else {
      throw response;
    }
  }
}

// remove shifted players from current channel
/**
 * this function removes shifted players from current chaanel
 * @method removeShiftedPlayers
 * @param  {object}             params request json object
 * @param  {Function}           cb     callback function
 */
removeShiftedPlayers(params: any): Promise<any> {
  if (params.shiftedPlayers.length > 0) {
    const newPlayers = params.table.players.filter((player: any) =>
      !params.shiftedPlayers.some((shifted: any) => shifted.playerId === player.playerId)
    );
    params.table.players = newPlayers;
  }
  return params;
}
/**
 * this function updates seats and shuufle id
 * @method updateSeatsAndShuffleId
 * @param  {object}                params request json object
 * @param  {Function}              cb     callback function
 */
async updateSeatsAndShuffleId(params: any): Promise<any> {
  params.table.occupiedSeats -= params.outOfMoneyPlayers.length;
  params.table.vacantSeats += params.outOfMoneyPlayers.length;

  for (const player of params.shiftedPlayers) {
    const result = await this.imdb.getTable(player.newChannelId);
    if (!result) {
      throw {
        success: false,
        info: popupTextManager.dbQyeryInfo.IMDB_GETTABLE_UPDATESEATSANDSHUFFLEID_FAILED_PLAYERSHUFFLING,
        isRetry: false,
        isDisplay: false,
        channelId: player.newChannelId || ""
      };
    }

    const updateFields: any = {};
    if (result.channelId !== params.table.channelId) {
      updateFields.vacantSeats = result.maxPlayers - result.players.length;
      updateFields.occupiedSeats = result.players.length;
    } else {
      updateFields.shuffleTableId = "";
    }

    const response = await this.imdb.updateSeats(params.table.channelId, updateFields);
    if (!response) {
      throw {
        success: false,
        info: popupTextManager.dbQyeryInfo.IMDBUPDATESEATS_UPDATESEATSANDSHUFFLEID_FAILED_PLAYERSHUFFLING,
        isRetry: false,
        isDisplay: false,
        channelId: params.table.channelId || ""
      };
    }

    const upsertResult = await this.imdb.upsertPlayerJoin(
      { playerId: player.playerId, channelId: params.table.channelId },
      { $set: { channelId: player.newChannelId } }
    );

    if (!upsertResult) {
      throw {
        success: false,
        info: popupTextManager.dbQyeryInfo.IMDBUPDATESEATS_UPDATESEATSANDSHUFFLEID_FAILED_PLAYERSHUFFLING,
        isRetry: false,
        isDisplay: false,
        channelId: params.table.channelId || ""
      };
    }
  }

  return params;
}

/**
 * this function contains the entire shuffle processs in series of steps
 * @method shuffle
 * @param  {object}   params requst json object
 * @param  {Function} cb     callback function
 */
async shuffle(params: any): Promise<any> {
  const tournamentResponse = await this.getTournamentRoom(params.table.tournamentRules.tournamentId);
  if (!tournamentResponse.success) {
    return tournamentResponse;
  }

  if (params.table.roundCount === 1 || !tournamentResponse.isTournamentRunning) {
    params.data.isPlayerShuffled = false;
    params.data.success = true;
    return { success: true, table: params.table, data: params.data };
  }

  await this.dynamicRanks.getRegisteredTournamentUsers(params.table.tournamentRules.tournamentId);

  if (params.table.channelType === stateOfX.gameType.tournament) {
    const channelsResponse = await this.getAllChannels(params.table.tournamentRules.tournamentId);
    if (channelsResponse.success && channelsResponse.result.length > 1) {
      let response: any = await this.initializeParams(params)
        .then(this.removeOutOfMoneyPlayers)
        .then(this.updateSeats)
        .then(this.checkChannelReduction)
        .then(this.processShuffling)
        .then(this.removeShiftedPlayers)
        .then(this.updateSeatsAndShuffleId);

      response.isPlayerShuffled = true;
      response.success = true;
      response.tournamentId = response.table.tournamentRules.tournamentId;
      return { success: true, table: response.table, data: _.omit(response, 'table') };
    } else {
      params.data.isPlayerShuffled = false;
      params.data.success = true;
      params.data.totalChannels = 1;
      return { success: true, table: params.table, data: params.data };
    }
  } else {
    params.data.isPlayerShuffled = false;
    params.data.success = true;
    return { success: true, table: params.table, data: params.data };
  }
}

















}