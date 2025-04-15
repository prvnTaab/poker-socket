import { Injectable } from "@nestjs/common";
import _ from "underscore";
import _ld from "lodash";
import systemConfig from "./../../../../../libs/common/src/systemConfig.json";
import popupTextManager from "../../../../../libs/common/src/popupTextManager";
import stateOfX from "shared/common/stateOfX.sevice";
import { validateKeySets } from "shared/common/utils/activity";
import { PokerDatabaseService } from "shared/common/datebase/pokerdatabase.service";
import { ImdbDatabaseService } from "shared/common/datebase/Imdbdatabase.service";
import { ResponseHandlerService } from "./responseHandler.service";
import { CommonHandlerService } from "./commonHandler.service";
import { BroadcastHandlerService } from "./broadcastHandler.service";
import { TournamentJoinHandlerService } from "./tournamentJoinHandler.service";


  sharedModule = require("../../../../../shared/sharedModule"),
  satelliteTournament = require('../../database/remote/satelliteTournament');

declare const pomelo: any;



@Injectable()
export class StartTournamentHandlerService {

  constructor(
    private readonly db: PokerDatabaseService,
    private readonly imdb: ImdbDatabaseService,
    private readonly tournamentJoinHandler: TournamentJoinHandlerService,
    private readonly responseHandler: ResponseHandlerService,
    private readonly commonHandler: CommonHandlerService,
    private readonly broadcastHandler: BroadcastHandlerService,
    private readonly satelliteTournament: SatelliteTournamentService
  ) { }












  /*===========================  START  =========================*/
  /**
   * This functioin is used to fetch tournament tables
   *
   * @method fetchTournamentTables
   * @param  {Object}       params  request json object
   * @param  {Function}     callback      callback function
   * @return {Object}               params/validated object
   */

  // New
  async fetchTournamentTables(params: any): Promise<any> {

    const validated = await validateKeySets("Request", "connector", "fetchTournamentTables", params);

    if (!validated.success) {
      return validated;
    }


    // Fire-and-forget cleanup actions
    this.db.deleteRebuy({ tournamentId: params.tournamentId }).catch(() => { });
    this.imdb.deleteRanks({ tournamentId: params.tournamentId }).catch(() => { });

    try {
      const tables = await this.db.findTable({ "tournament.tournamentId": params.tournamentId });

      if (tables && tables.length > 0) {
        params.tables = tables;
        return params;
      } else {
        return {
          success: false,
          isRetry: false,
          isDisplay: true,
          channelId: "",
          info: popupTextManager.dbQyeryInfo.DBFINDTABLE_TABLENOTEXIST_STARTTOURNAMENTHANDLER
        };
      }
    } catch (err) {
      return {
        success: false,
        isRetry: false,
        isDisplay: false,
        channelId: "",
        info: popupTextManager.dbQyeryInfo.DBFINDTABLE_DBERROR_STARTTOURNAMENTHANDLER
      };
    }
  };


  // Old
  // var fetchTournamentTables = function (params, callback) {
  //     keyValidator.validateKeySets("Request", "connector", "fetchTournamentTables", params, function (validated) {
  //       if (validated.success) {
  //         serverLog(stateOfX.serverLogType.info, "params is in fetchTournamentTables - " + _.keys(params));
  //         db.deleteRebuy({ tournamentId: params.tournamentId }, function (err, result) { })
  //         imdb.deleteRanks({ tournamentId: params.tournamentId }, function (err, result) { })
  //         db.findTable({ "tournament.tournamentId": params.tournamentId }, function (err, tables) {
  //           if (err) {
  //             callback({ success: false, isRetry: false, isDisplay: false, channelId: "", info: popupTextManager.dbQyeryInfo.DBFINDTABLE_DBERROR_STARTTOURNAMENTHANDLER });
  //             //callback({success: false, info: "error in getting table for db"});
  //           } else {
  //             serverLog(stateOfX.serverLogType.info, "tables are in fetchTournamentTables " + JSON.stringify(tables));
  //             if (!!tables && tables.length > 0) {
  //               params.tables = tables;
  //               serverLog(stateOfX.serverLogType.info, "params.tables is in fetch tournament tables is " + JSON.stringify(params.tables));
  //               callback(null, params);
  //             } else {
  //               callback({ success: false, isRetry: false, isDisplay: true, channelId: "", info: popupTextManager.dbQyeryInfo.DBFINDTABLE_TABLENOTEXIST_STARTTOURNAMENTHANDLER });
  //               //callback({success: false, info: "table doesnot exist for this tournamentId"});
  //             }
  //           }
  //         })
  //       } else {
  //         callback(validated);
  //       }
  //     })
  //   }
  /*===========================  END  =========================*/

  /*===========================  START  =========================*/
  /**
   * This function is used to create channel for tournament
   * @method fetchTournamentTables
   * @param  {Object}       params  request json object
   * @param  {Function}     callback      callback function
   * @return {Object}               params/validated object
   */

  //   New
  async createChannelForTournament(params: any): Promise<any> {

    const validated = await validateKeySets("Request", params.self.app.serverType, "createChannelForTournament", params);

    if (!validated.success) {
      return validated;
    }

    const createdChannel: any[] = [];

    try {
      for (const table of params.tables) {

        const channelId = table.channelId;
        let channel = params.self.app.get('channelService').getChannel(channelId, false);
        if (!channel) {
          channel = params.self.app.get('channelService').getChannel(channelId, true);
        }


        const createTableResponse = await this.tournamentJoinHandler.createChannel({
          self: params.self,
          session: params.session,
          channel: channel,
          channelId: channelId,
          channelType: table.channelType,
          tableId: "",
          playerId: "",
          gameVersionCount: params.gameVersionCount
        });

        if (!createTableResponse.success) {
          return {
            success: false,
            isRetry: false,
            isDisplay: false,
            channelId: "",
            info: popupTextManager.dbQyeryInfo.DBCREATECHANNELFORTOURNAMENTFAIL_STARTTOURNAMENTHANDLER
          };
        }

        createdChannel.push(createTableResponse.table);
        console.log("channel created successfully");
      }

      params.channels = createdChannel;
      return params;
    } catch (err) {
      return {
        success: false,
        isRetry: false,
        isDisplay: false,
        channelId: "",
        info: popupTextManager.dbQyeryInfo.DBCREATECHANNELFORTOURNAMENTFAIL_STARTTOURNAMENTHANDLER
      };
    }
  };

  //   Old
  //   var createChannelForTournament = function (params, callback) {
  //     console.log("params.tables in createChannelForTournament", params)
  //     keyValidator.validateKeySets("Request", params.self.app.serverType, "createChannelForTournament", params, function (validated) {
  //       if (validated.success) {
  //         var createdChannel = [];
  //         // Iterate through tables
  //         serverLog(stateOfX.serverLogType.info, "params.tables are in createChannelForTournament ", JSON.stringify(params.tables));
  //         async.each(params.tables, function (table, cb) {
  //           serverLog(stateOfX.serverLogType.info, "control current processing tabble - " + JSON.stringify(table));
  //           var channelId = table.channelId;
  //           var channel = params.self.app.get('channelService').getChannel(channelId, false);
  //           if (!channel) {
  //             // console.log("need to insert new channel", channel)
  //             channel = params.self.app.get('channelService').getChannel(channelId, true);
  //           }
  //           // create channel
  //           serverLog(stateOfX.serverLogType.info, "pomelo channel while creating table in inMemory");
  //           tournamentJoinHandler.createChannel({ self: params.self, session: params.session, channel: channel, channelId: channelId, channelType: table.channelType, tableId: "", playerId: "", gameVersionCount: params.gameVersionCount }, function (createTableResponse) {
  //             createdChannel.push(createTableResponse.table);
  //             if (createTableResponse.success) {
  //               console.log("channel created successfully");
  //             } else {
  //               callback(createTableResponse);
  //             }
  //             cb();
  //           })
  //         }, function (err) {
  //           if (err) {
  //             callback({ success: false, isRetry: false, isDisplay: false, channelId: "", info: popupTextManager.dbQyeryInfo.DBCREATECHANNELFORTOURNAMENTFAIL_STARTTOURNAMENTHANDLER });
  //             //next({success: false, info: "Error in channelCreate"});
  //           } else {
  //             params.channels = createdChannel;
  //             callback(null, params);
  //           }
  //         })
  //       } else {
  //         callback(validated);
  //       }
  //     });
  //   }
  /*===========================  END  =========================*/


  /*===========================  START  =========================*/
  /**
   * this functioin is for getting users for tournament who are registered
   * @method getTournamentUsers
   * @param  {Object}       params  request json object
   * @param  {Function}     callback      callback function
   * @return {Object}               params/validated object
   */

  //   New
  async getTournamentUsers(params: any): Promise<any> {
    const validated = await validateKeySets(
      "Request",
      params.self.app.serverType,
      "getTournamentUsers",
      params
    );

    if (!validated.success) {
      return validated;
    }

    try {
      const result = await this.db.findTournamentUser({ status: "Registered", tournamentId: params.tournamentId });

      if (!!result) {
        const playerIds = _.pluck(result, 'playerId');
        params.playerIds = playerIds;
        return params;
      } else {
        return {
          success: false,
          isRetry: false,
          isDisplay: true,
          channelId: "",
          info: popupTextManager.dbQyeryInfo.DBFINDTOURNAMENTUSER_NOUSER_STARTTOURNAMENTHANDLER
        };
      }
    } catch (err) {
      return {
        success: false,
        isRetry: false,
        isDisplay: true,
        channelId: "",
        info: popupTextManager.dbQyeryInfo.DBFINDTOURNAMENTUSER_DBERROR_STARTTOURNAMENTHANDLER
      };
    }
  };

  //   Old
  //   var getTournamentUsers = function (params, callback) {
  //     // serverLog(stateOfX.serverLogType.info, "params is in getTournamentUsers in startTournamentHandler is - ",params);
  //     keyValidator.validateKeySets("Request", params.self.app.serverType, "getTournamentUsers", params, function (validated) {
  //       if (validated.success) {
  //         db.findTournamentUser({ status: "Registered", tournamentId: params.tournamentId }, function (err, result) {
  //           if (err) {
  //             callback({ success: false, isRetry: false, isDisplay: true, channelId: "", info: popupTextManager.dbQyeryInfo.DBFINDTOURNAMENTUSER_DBERROR_STARTTOURNAMENTHANDLER });
  //             //cb({success: false, info: "Error in getting tournamentUser"});
  //           } else {
  //             if (!!result) {
  //               var playerIds = _.pluck(result, 'playerId');
  //               params.playerIds = playerIds;
  //               callback(null, params);
  //             } else {
  //               callback({ success: false, isRetry: false, isDisplay: true, channelId: "", info: popupTextManager.dbQyeryInfo.DBFINDTOURNAMENTUSER_NOUSER_STARTTOURNAMENTHANDLER });
  //               //cb({success: false, info: "No tournament users for this this tournament"});
  //             }
  //           }
  //         })
  //       } else {
  //         callback(validated);
  //       }
  //     });
  //   }
  /*===========================  END  =========================*/


  /*===========================  START  =========================*/
  /**
   * This function is used to get number of rebuy opt
   *
   * @method isRebuyOpt
   * @param  {Object}       params  request json object
   * @param  {Function}     cb      callback function
   * @return {Object}               params/validated object
   */

  //   New
  async isRebuyOpt(params: any): Promise<any> {
    const filter = {
      tournamentId: params.tournamentId,
      gameVersionCount: params.gameVersionCount,
      playerId: params.playerId
    };

    try {
      const rebuy = await this.db.countRebuyOpt(filter);
      const rebuyCount = (!!rebuy && !!rebuy.rebuyCount) ? rebuy.rebuyCount : 0;

      return {
        success: true,
        rebuyOpt: rebuyCount !== 0
      };
    } catch (err) {
      return {
        success: false,
        isRetry: false,
        isDisplay: false,
        channelId: "",
        info: popupTextManager.dbQyeryInfo.DBCOUNTREBUYOPTFAIL_STARTTOURNAMENTHANDLER
      };
    }
  };


  //   Old
  //   var isRebuyOpt = function (params, cb) {
  //     // serverLog(stateOfX.serverLogType.info, "params is in countRebuyOpt in start tournament handler " + JSON.stringify(params));
  //     var filter = {
  //       tournamentId: params.tournamentId,
  //       gameVersionCount: params.gameVersionCount,
  //       playerId: params.playerId
  //     }
  //     db.countRebuyOpt(filter, function (err, rebuy) {
  //       if (!err) {
  //         var rebuyCount = (!!rebuy && !!rebuy.rebuyCount) ? rebuy.rebuyCount : 0;
  //         if (rebuyCount === 0) {
  //           cb({ success: true, rebuyOpt: false });
  //         } else {
  //           cb({ success: true, rebuyOpt: true });
  //         }
  //       } else {
  //         cb({ success: false, isRetry: false, isDisplay: false, channelId: "", info: popupTextManager.dbQyeryInfo.DBCOUNTREBUYOPTFAIL_STARTTOURNAMENTHANDLER });
  //         //cb({success: false, info: "Error in rebuy count"});
  //       }
  //     })
  //   }
  /*===========================  END  =========================*/


  /*===========================  START  =========================*/
  /**
   * Save this record for disconnection handling
   *
   * @method saveActivityRecord
   * @param  {Object}       params  request json object
   * 
   * @return {Object}               params/validated object
   */

  //   New
  async saveActivityRecord(params: any): Promise<void> {

    const generateCOTRefrenceId = (): string => {
      let result = 'COT-';
      const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      for (let i = 0; i < 16; i++) {
        result += possible.charAt(Math.floor(Math.random() * possible.length));
      }
      return result;
    };

    const dataToInsert = {
      channelId: params.channelId,
      playerId: params.playerId,
      isRequested: true,
      playerName: params.playerName,
      channelType: stateOfX.gameType.tournament,
      tableId: params.tableId,
      deviceType: params.deviceType || '',
      referenceNumber: generateCOTRefrenceId(),
      networkIp: ''
    };

    try {
      await this.imdb.upsertPlayerJoin(
        { channelId: dataToInsert.channelId, playerId: dataToInsert.playerId },
        {
          $setOnInsert: {
            playerName: dataToInsert.playerName,
            channelType: dataToInsert.channelType,
            referenceNumber: dataToInsert.referenceNumber,
            firstJoined: Number(new Date()),
            observerSince: Number(new Date())
          },
          $set: {
            networkIp: dataToInsert.networkIp,
            event: 'join'
          }
        }
      );

      await this.imdb.upsertActivity(
        { channelId: params.channel, playerId: params.playerId },
        dataToInsert
      );

    } catch (err) {
      console.log(stateOfX.serverLogType.info, 'Error in saving activity');
    }
  };


  //   Old
  //   var saveActivityRecord = function (params) {
  //     // serverLog(stateOfX.serverLogType.info, "in startTournamentHandler for function saveActivityRecord");
  //     serverLog(stateOfX.serverLogType.info, 'params is in saveActivityRecord' + JSON.stringify(params));

  //     const generateCOTRefrenceId = () => {
  //       var result = 'COT-';
  //       var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  //       for (var i = 0; i < 16; i++) {
  //         result += possible.charAt(Math.floor(Math.random() * possible.length));
  //       } return result;
  //     }
  //     var dataToInsert = {
  //       channelId: params.channelId,
  //       playerId: params.playerId,
  //       isRequested: true,
  //       playerName: params.playerName,
  //       channelType: stateOfX.gameType.tournament,
  //       tableId: params.tableId,
  //       deviceType: params.deviceType || '',
  //       referenceNumber: generateCOTRefrenceId(),
  //       networkIp: ''
  //     }
  //     //add function to save player record
  //     // saveJoinRecord(dataToInsert);
  //     imdb.upsertPlayerJoin({ channelId: dataToInsert.channelId, playerId: dataToInsert.playerId }, { $setOnInsert: { playerName: dataToInsert.playerName, channelType: dataToInsert.channelType, referenceNumber: dataToInsert.referenceNumber, firstJoined: Number(new Date()), observerSince: Number(new Date()) }, $set: { networkIp: dataToInsert.networkIp, event: 'join' } }, (err, result) => { })


  //     imdb.upsertActivity({ channelId: params.channel, playerId: params.playerId }, dataToInsert, function (err, result) {
  //       if (!err && !!result) {
  //         serverLog(stateOfX.serverLogType.info, 'successfully saved ActivityRecord');
  //       } else {
  //         serverLog(stateOfX.serverLogType.info, "Error in saving activity");
  //       }
  //     })
  //   }
  /*===========================  END  =========================*/



  /*===========================  START  =========================*/
  /**
   * This function is used to  join channel for tournamnt
   *
   * @method joinChannelForTournament
   * @param  {Object}       params  request json object
   * @param  {Function}     callback      callback function
   * @return {Object}               params/validated object
   */

  //   New
  async joinChannelForTournament(params: any): Promise<any> {

    const validated = await validateKeySets("Request", params.self.app.serverType, "joinChannelForTournament", params);
    if (!validated.success) {
      return validated;
    }

    try {
      const players = await this.db.findUserArray(params.playerIds);
      if (!players || players.length === 0) {
        return {
          success: false,
          isRetry: false,
          isDisplay: true,
          channelId: "",
          info: popupTextManager.dbQyeryInfo.DBFINDUSERARRAYFAIL_NOPLAYERS_STARTTOURNAMENTHANDLER
        };
      }

      let channelIndex = 0;
      let tableIndex = 1;
      const maxPlayerOnChannel = params.tables[0].maxPlayers;

      for (const player of players) {
        let startingChips = params.tables[0].noOfChipsAtGameStart;

        const rebuyOptResult = await this.isRebuyOpt({
          tournamentId: params.tables[0].tournament.tournamentId,
          gameVersionCount: params.gameVersionCount,
          playerId: player.playerId
        });

        if (!rebuyOptResult.success) {
          return rebuyOptResult;
        }

        startingChips = rebuyOptResult.rebuyOpt ? 2 * startingChips : startingChips;

        const addWaitingPlayerResponse = await params.self.app.rpc.database.tableRemote.addWaitingPlayerForTournament(
          params.session,
          {
            channelId: params.channels[channelIndex].channelId,
            playerId: player.playerId,
            seatIndex: tableIndex++,
            timeBankRuleData: params.channels[channelIndex].timeBankRuleData,
            playerName: player.userName || player.firstName,
            imageAvtar: player.profileImage,
            chips: startingChips,
            userName: player.userName,
            timeBank: params.channels[channelIndex].tournamentRules.timeBank,
            tournamentDetails: params.tables[0].tournament
          }
        );


        await this.saveActivityRecord({
          tableId: params.tables[0].tournament.tournamentId,
          channelId: params.channels[channelIndex].channelId,
          playerId: player.playerId,
          playerName: player.userName || player.firstName
        });

        for (let i = 0; i < params.channels.length; i++) {
          if (params.channels[i].channelId === params.channels[channelIndex].channelId) {
            params.channels[i].players.push(addWaitingPlayerResponse.player);
          }
        }

        if ((tableIndex - 1) === maxPlayerOnChannel) {
          channelIndex++;
          tableIndex = 1;
        }
      }

      return params;
    } catch (err) {
      return {
        success: false,
        info: "Error in async in sit player",
        isRetry: false,
        isDisplay: false,
        channelId: ""
      };
    }
  };
  //   Old
  //   var joinChannelForTournament = function (params, callback) {
  //     console.log("inaise joinChannelForTournament--------------", params)
  //     console.log("inaise joinChannelForTournament--------------222", params.tables)
  //     keyValidator.validateKeySets("Request", params.self.app.serverType, "joinChannelForTournament", params, function (validated) {
  //       if (validated.success) {
  //         //getting users from db
  //         db.findUserArray(params.playerIds, function (err, players) {
  //           if (err) {
  //             callback({ success: false, isRetry: false, isDisplay: false, channelId: "", info: popupTextManager.dbQyeryInfo.DBFINDUSERARRAYFAIL_DBERROR_STARTTOURNAMENTHANDLER });
  //             //callback({success: false, info: "Error in getting players"});
  //           } else {
  //             if (!!players && players.length > 0) {
  //               let channelIndex = 0, tableIndex = 1;
  //               let maxPlayerOnChannel = params.tables[0].maxPlayers;
  //               console.log(stateOfX.serverLogType.info, "max players on the channel is - " + maxPlayerOnChannel);
  //               //Iterate over players and add to waiting players for tournament
  //               async.eachSeries(players, function (player, cb) {
  //                 console.log(stateOfX.serverLogType.info, "chips at game start is ", params.tables[0])
  //                 console.log(stateOfX.serverLogType.info, "chips at game start is params.channels[channelIndex] 258", params.channels)
  //                 let startingChips = params.tables[0].noOfChipsAtGameStart;
  //                 isRebuyOpt({ tournamentId: params.tables[0].tournament.tournamentId, gameVersionCount: params.gameVersionCount, playerId: player.playerId }, function (isRebuyOpt) {
  //                   if (isRebuyOpt.success) {
  //                     let startingChips = isRebuyOpt.rebuyOpt ? 2 * params.tables[0].noOfChipsAtGameStart : params.tables[0].noOfChipsAtGameStart;
  //                     params.self.app.rpc.database.tableRemote.addWaitingPlayerForTournament(params.session, { channelId: params.channels[channelIndex].channelId, playerId: player.playerId, seatIndex: tableIndex++, timeBankRuleData: params.channels[channelIndex].timeBankRuleData, playerName: player.userName || player.firstName, imageAvtar: player.profileImage, chips: startingChips, userName: player.userName, timeBank: params.channels[channelIndex].tournamentRules.timeBank, tournamentDetails: params.tables[0].tournament }, function (addWaitingPlayerResponse) {
  //                       console.log("addWaitingPlayerForTournament response is - " + JSON.stringify(addWaitingPlayerResponse));
  //                       saveActivityRecord({ tableId: params.tables[0].tournament.tournamentId, channelId: params.channels[channelIndex].channelId, playerId: player.playerId, playerName: player.userName || player.firstName })
  //                       for (let i = 0; i < params.channels.length; i++) {
  //                         if (params.channels[i].channelId === params.channels[channelIndex].channelId) {
  //                           params.channels[i].players.push(addWaitingPlayerResponse.player);
  //                         }
  //                       }
  //                       if ((tableIndex - 1) === maxPlayerOnChannel) {
  //                         console.log(stateOfX.serverLogType.info, 'In memory table: ' + JSON.stringify(params.channels[channelIndex]))
  //                         channelIndex++;
  //                         tableIndex = 1;
  //                       }
  //                       cb();
  //                     })
  //                   } else {
  //                     console.log(stateOfX.serverLogType.info, 'Error in Rebuy opt count');
  //                     callback(isRebuyOpt);
  //                   }
  //                 })
  //               }, function (err) {
  //                 if (err) {
  //                   callback({ success: false, info: "Error in async in sit player", isRetry: false, isDisplay: false, channelId: "" });
  //                 }
  //                 serverLog(stateOfX.serverLogType.info, "channels in result in async.series - " + JSON.stringify(params.channels));
  //                 callback(null, params);
  //               })
  //             } else {
  //               callback({ success: false, isRetry: false, isDisplay: true, channelId: "", info: popupTextManager.dbQyeryInfo.DBFINDUSERARRAYFAIL_NOPLAYERS_STARTTOURNAMENTHANDLER });
  //               //callback({success: false, info: "players not found"});
  //             }
  //           }
  //         })
  //       } else {
  //         callback(validated);
  //       }
  //     })
  //   }
  /*===========================  END  =========================*/


  /*===========================  START  =========================*/
  /**
   *  This function is used to join players channel in tournament
   *
   * @method joinPlayerToChannelForTournament
   * @param  {Object}       params  request json object
   * @param  {Function}     callback      callback function
   * @return {Object}               params/validated object
   */

  //   New
  async joinPlayerToChannelForTournament(params: any): Promise<any> {
    const validated = await validateKeySets(
      "Request",
      params.self.app.serverType,
      "joinPlayerToChannelForTournament",
      params
    );

    if (!validated.success) {
      return validated;
    }

    for (const channel of params.channels) {

      const tempChannel = params.self.app.get('channelService').getChannel(channel.channelId, false);

      for (const player of channel.players) {
        const temp = {
          channel: tempChannel,
          self: params.self,
          playerId: player.playerId,
          playerName: player.playerName
        };

        const joinPlayerToChannelResponse = await this.tournamentJoinHandler.joinPlayerToChannel(temp);

        if (!joinPlayerToChannelResponse.success) {
          return joinPlayerToChannelResponse;
        }

        await this.db.updateTourTicket(
          { player: player.playerId, status: 0, tournamentId: channel.tournamentRules.tournamentId },
          { status: 1, isWithdrawable: false }
        );

        const assignTableSettingsResponse = await this.commonHandler.assignTableSettings({
          playerId: player.playerId,
          channelId: channel.channelId,
          tableId: "",
          data: {},
          playerName: player.playerName || "A player"
        });

        if (assignTableSettingsResponse.err) {
          return assignTableSettingsResponse;
        }

        assignTableSettingsResponse.self = params.self;
        assignTableSettingsResponse.table = channel;

        const keysResponse = await this.responseHandler.setJoinChannelKeys(assignTableSettingsResponse);

        if (!keysResponse.success) {
          return keysResponse;
        }

        keysResponse.table = channel;
        keysResponse.table.roomConfig = { tableId: channel.tournamentRules.tournamentId };

        this.broadcastHandler.sendMessageToUser({
          self: {},
          playerId: player.playerId,
          msg: {
            playerId: player.playerId,
            tableId: params.tableId,
            channelId: channel.channelId,
            tableDetails: keysResponse.tableDetails,
            roomConfig: keysResponse.roomConfig,
            settings: keysResponse.settings,
            forceJoin: true,
            info: `${keysResponse.table.tournamentName} tournament has been started!`
          },
          route: "tournamentGameStart"
        });
      }

      const paramsForStartGame = {
        self: params.self,
        session: params.session,
        channelId: channel.channelId,
        channel: tempChannel,
        eventName: stateOfX.startGameEvent.tournament
      };

      setTimeout(() => {
        const startGameHandler = require('./startGameHandler');
        startGameHandler.startGame(paramsForStartGame);
      }, Number(systemConfig.delayInSitNGoTimer) * 1000);
    }

    return params;
  }

  //   Old
  // var joinPlayerToChannelForTournament = function (params, callback) {
  //   keyValidator.validateKeySets("Request", params.self.app.serverType, "joinPlayerToChannelForTournament", params, function (validated) {
  //     if (validated.success) {
  //       // iterate through channels
  //       async.eachSeries(params.channels, function (channel, cb) {
  //         serverLog(stateOfX.serverLogType.info, 'Processing channel - ' + JSON.stringify(channel))
  //         var tempChannel;
  //         async.eachSeries(channel.players, function (player, cbe) {
  //           tempChannel = params.self.app.get('channelService').getChannel(channel.channelId, false);
  //           //create object to join channels
  //           var temp = {
  //             channel: tempChannel,
  //             self: params.self,
  //             playerId: player.playerId,
  //             playerName: player.playerName
  //           }
  //           // call join player to channel function
  //           tournamentJoinHandler.joinPlayerToChannel(temp, function (joinPlayerToChannelResponse) {
  //             if (joinPlayerToChannelResponse.success) {
  //               //update user ticket to used i.e; status: 1
  //               db.updateTourTicket({ player: player.playerId, status: 0, tournamentId: channel.tournamentRules.tournamentId }, { status: 1, isWithdrawable: false, }, function (err, res) { })
  //               commonHandler.assignTableSettings({ playerId: player.playerId, channelId: channel.channelId, tableId: "", data: {}, playerName: player.playerName || "A player" }, function (err, assignTableSettingsResponse) {
  //                 if (!err) {
  //                   assignTableSettingsResponse.self = params.self;
  //                   assignTableSettingsResponse.table = channel;
  //                   responseHandler.setJoinChannelKeys(assignTableSettingsResponse, function (keysResponse) {
  //                     if (keysResponse.success) {
  //                       //create data for braodast
  //                       console.log("key response is - " + JSON.stringify(keysResponse));
  //                       keysResponse.table = channel;
  //                       keysResponse.table.roomConfig = {};
  //                       keysResponse.table.roomConfig.tableId = channel.tournamentRules.tournamentId;
  //                       //fire braodcast ot users
  //                       broadcastHandler.sendMessageToUser({
  //                         self: {},
  //                         playerId: player.playerId,
  //                         msg: {
  //                           playerId: player.playerId,
  //                           tableId: params.tableId,
  //                           channelId: channel.channelId,
  //                           tableDetails: keysResponse.tableDetails,
  //                           roomConfig: keysResponse.roomConfig,
  //                           settings: keysResponse.settings,
  //                           forceJoin: true,
  //                           info: keysResponse.table.tournamentName + " tournament has been started!"
  //                         },
  //                         route: "tournamentGameStart"
  //                       });
  //                     } else {
  //                       callback(keysResponse);
  //                     }
  //                   });
  //                 } else {
  //                   callback(assignTableSettingsResponse);
  //                 }
  //               });
  //             } else {
  //               callback(joinPlayerToChannelResponse);
  //             }
  //           })
  //           cbe();
  //         }, function (err) {
  //           if (err) {
  //             cb();
  //           }
  //           var paramsForStartGame = {
  //             self: params.self,
  //             session: params.session,
  //             channelId: channel.channelId,
  //             channel: tempChannel,
  //             eventName: stateOfX.startGameEvent.tournament
  //           }
  //           setTimeout(function () {
  //             const startGameHandler = require('./startGameHandler');
  //             startGameHandler.startGame(paramsForStartGame);
  //           }, parseInt(systemConfig.delayInSitNGoTimer) * 1000);
  //           cb();
  //         })
  //       }, function (err) {
  //         if (err) {
  //           callback(err);
  //         }
  //         callback(null, params);
  //       })
  //     } else {
  //       callback(validated);
  //     }
  //   })
  // }
  /*===========================  END  =========================*/


  /*===========================  START  =========================*/
  /**
   *  This function is used to process a series of async functions 
   *
   * @method process
   * @param  {Object}       params  request json object
   * @param  {Function}     callback      callback function
   * @return {Object}               params/validated object
   */

  // New
  async process(params: any): Promise<any> {
    try {
      // Step 1: fetchTournamentTables
      const tournamentTables = await this.fetchTournamentTables(params);

      // Step 2: createChannelForTournament
      const channelsCreated = await this.createChannelForTournament(tournamentTables);

      // Step 3: getTournamentUsers
      const users = await this.getTournamentUsers(channelsCreated);

      // Step 4: joinChannelForTournament
      const channelsJoined = await this.joinChannelForTournament(users);

      // Step 5: joinPlayerToChannelForTournament
      const finalResult = await this.joinPlayerToChannelForTournament(channelsJoined);

      return { success: true, result: finalResult };

    } catch (err) {
      console.log("startTournamentHandler.process", err);

      return {
        success: false,
        isRetry: false,
        isDisplay: false,
        channelId: "",
        info: popupTextManager.falseMessages.STARTTOURNAMENTFAIL_STARTTOURNAMENTHANDLER,
      };
    }
  }


  // Old
  // startTournamentHandler.process = function (params, cb) {
  //   // serverLog(stateOfX.serverLogType.info, "params is in startTournamentHandler ",params);
  //   async.waterfall([
  //     async.apply(fetchTournamentTables, params),
  //     createChannelForTournament,
  //     getTournamentUsers,
  //     joinChannelForTournament,
  //     joinPlayerToChannelForTournament
  //   ], function (err, result) {
  //     console.log("startTournamentHandler.process", err, result);
  //     serverLog(stateOfX.serverLogType.info, "result is in start tournament --- " + err + result);
  //     if (err) {
  //       cb({ success: false, isRetry: false, isDisplay: false, channelId: "", info: popupTextManager.falseMessages.STARTTOURNAMENTFAIL_STARTTOURNAMENTHANDLER });
  //     } else {
  //       cb({ success: true, result: result });
  //     }
  //   });
  // }
  /*===========================  END  =========================*/




  /*===========================  START  =========================*/
  /**
   *  This function is used to saveTournamentRanks
   *
   * @method saveTournamentRanks
   * @param  {Object}       data  request json object
   */

  // New
  async saveTournamentRanks(data: any): Promise<void> {

    // For autoRegistration
    if (data.ticketWon) {
      try {
        const registerResponse = await this.satelliteTournament.register({
          playerId: data.playerId,
          tournamentId: data.parentId,
        });

      } catch (error) {
        console.error("Error during satellite tournament registration:", error);
      }
    }
  };


  // Old
  // var saveTournamentRanks = function (data) {
  //   console.log("insie saveTournamentRanks", data)
  //       // For autoRegistration
  //       if (data.ticketWon) {
  //         satelliteTournament.register({
  //           playerId: data.playerId,
  //           tournamentId: data.parentId
  //         }, function (registerResponse) {
  //           console.log("inside registerTournamentresponse satellite", registerResponse)
  //           serverLog(stateOfX.serverLogType.info, 'satellite register response is - ' + JSON.stringify(registerResponse));
  //         })
  //       }
  // }
  /*===========================  END  =========================*/

  /*===========================  START  =========================*/

  // New

  addSuffixToNumber(number: number): string {
    if (typeof number !== 'number' || isNaN(number)) {
      return '0';
    }

    // Handling special cases for 11, 12, and 13
    if (number % 100 >= 11 && number % 100 <= 13) {
      return number + 'th';
    }

    // Adding suffix based on the last digit
    switch (number % 10) {
      case 1:
        return number + 'st';
      case 2:
        return number + 'nd';
      case 3:
        return number + 'rd';
      default:
        return number + 'th';
    }
  }


  // Old
  // function addSuffixToNumber(number) {
  //   if (typeof number !== 'number' || isNaN(number)) {
  //     return 0
  //   }

  //   // Handling special cases for 11, 12, and 13
  //   if (number % 100 >= 11 && number % 100 <= 13) {
  //     return number + 'th';
  //   }

  //   // Adding suffix based on the last digit
  //   switch (number % 10) {
  //     case 1:
  //       return number + 'st';
  //     case 2:
  //       return number + 'nd';
  //     case 3:
  //       return number + 'rd';
  //     default:
  //       return number + 'th';
  //   }
  // }
  /*===========================  END  =========================*/


    /*===========================  START  =========================*/
    /**
     *  This function is used for eliminationProcess 
     *
     * @method process
     * @param  {Object}       self , channel request json object
     * @return {Object}               params/validated object
     */

    // New
    async eliminationProcess(self: any, channel: any) {
      if (!!channel && channel.tournamentRules) {
        try {
          const result = await this.db.getTournamentRoom(channel.tournamentRules.tournamentId);

          if (!!channel.channelType && channel.channelType.toUpperCase() === stateOfX.gameType.tournament) {

            for (const player of channel.tournamentRules.ranks) {
              console.log("creating broadcast data for playerEliminationBroadcast ---", player);

              if (!player.isPrizeBroadcastSent) {
                let rank = this.addSuffixToNumber(player.rank);

                const broadcastData = {
                  self,
                  playerId: player.playerId,
                  tournamentId: player.tournamentId,
                  channelId: player.channelId,
                  rank,
                  chipsWon: player.chipsWon,
                  isGameRunning: channel.tournamentRules.isGameRunning,
                  tournamentName: player.tournamentName,
                  isRebuyAllowed: !!result.isRebuyAllowed ? result.isRebuyAllowed : false,
                  route: "playerElimination",
                  tournamentType: channel.tournamentType,
                  ticketWon: player.ticketWon || false,
                  parentId: channel.tournamentRules.parentId,
                  userName: player.userName,
                  heading: "Info",
                  info: `Hi ${player.userName}, Congratulations on scoring ${rank} Rank in ${player.tournamentName}. Good Luck with other Tournaments`
                };

                player.tmpRank = rank;

                if (player.chipsWon) {
                  broadcastData.info = `Hi ${player.userName}, Congratulations on scoring ${rank} Rank & winning ${player.chipsWon} chips in ${player.tournamentName}. Good Luck with other Tournaments`;
                }

                if (player.rank === 0) {
                  broadcastData.info = `Hi ${player.userName}, Thanks for playing ${player.tournamentName}. Good Luck with other Tournaments`;
                }

                if (player.ticketWon) {
                  broadcastData.info = `Hi ${player.userName}, Congratulations on scoring ${rank} Rank & winning a ticket. Good Luck with other Tournaments!`;
                }

                this.informUser({ playerId: player.playerId, tmpRank: rank, tournamentName: player.tournamentName, chipsWon: player.chipsWon });

                if (channel.tournamentType === stateOfX.tournamentType.satelite) {
                  this.saveTournamentRanks(broadcastData);
                }

                player.isPrizeBroadcastSent = true;

                await this.broadcastHandler.firePlayerEliminateBroadcast(broadcastData);

                await pomelo.app.rpc.database.requestRemote.updateTournamentRules("session", {
                  channelId: player.channelId,
                  playerId: player.playerId
                });

                await this.imdb.setPrizeBroadcast(player.channelId, player.playerId);
                await this.imdb.removeActivity({ tableId: player.tournamentId, playerId: player.playerId });
                await this.imdb.removePlayerJoin({ channelId: player.channelId, playerId: player.playerId });

              }
            }

          }
        } catch (error) {
          console.log(stateOfX.serverLogType.info, 'Error in getting tournament room');
        }
      }
    };

    // Old
    // startTournamentHandler.eliminationProcess = function (self, channel) {
    //   console.trace(stateOfX.serverLogType.info, "channel is in elimination process is - ", channel);
    //   if (!!channel && channel.tournamentRules) {
    //     db.getTournamentRoom(channel.tournamentRules.tournamentId, function (err, result) {
    //       console.log(stateOfX.serverLogType.info, 'result is-' + JSON.stringify(result));
    //       if (!!result) {
    //         console.log(stateOfX.serverLogType.info, 'in result');
    //         if (!!channel.channelType && (channel.channelType).toUpperCase() === stateOfX.gameType.tournament) {
    //           console.log('in channelType tournamentRules', channel.tournamentRules.ranks);
    //           async.eachSeries(channel.tournamentRules.ranks, function (player, callback) {
    //             console.log("creating broadcast data for playerEliminationBroadcast ---", player);
    //             if (!player.isPrizeBroadcastSent) {
    //               let rank = addSuffixToNumber(player.rank)
    //               var broadcastData = {
    //                 self: self,
    //                 playerId: player.playerId,
    //                 tournamentId: player.tournamentId,
    //                 channelId: player.channelId,
    //                 rank: rank,
    //                 chipsWon: player.chipsWon,
    //                 isGameRunning: channel.tournamentRules.isGameRunning,
    //                 tournamentName: player.tournamentName,
    //                 isRebuyAllowed: !!result.isRebuyAllowed ? result.isRebuyAllowed : false,
    //                 route: "playerElimination",
    //                 tournamentType: channel.tournamentType,
    //                 ticketWon: player.ticketWon || false,
    //                 parentId: channel.tournamentRules.parentId,
    //                 userName: player.userName,
    //                 heading: "Info",
    //                 info: `Hi ${player.userName}, Congratulations on scoring ${rank} Rank in ${player.tournamentName}. Good Luck with other Tournaments`
    //               }
    //               player.tmpRank = rank;
    //               if (player.chipsWon) {
    //                 broadcastData.info = `Hi ${player.userName}, Congratulations on scoring ${rank} Rank & winning ${player.chipsWon} chips in ${player.tournamentName}. Good Luck with other Tournaments`
    //               }
    //               if (player.rank == 0) {
    //                 broadcastData.info = `Hi ${player.userName}, Thanks for playing ${player.tournamentName}. Good Luck with other Tournaments`;
    //               }
    //               if (player.ticketWon) {
    //                 broadcastData.info = `Hi ${player.userName}, Congratulations on scoring ${rank} Rank & winning a ticket. Good Luck with other Tournaments!`;
    //               }
    //               //send mail to eliminated player 
    //               informUser({ playerId: player.playerId, tmpRank: rank, tournamentName: player.tournamentName, chipsWon: player.chipsWon })
    //               console.log("broadcastData is - ", broadcastData);
    //               if (channel.tournamentType === stateOfX.tournamentType.satelite) {
    //                 saveTournamentRanks(broadcastData);
    //               }
    //               player.isPrizeBroadcastSent = true;
    //               broadcastHandler.firePlayerEliminateBroadcast(broadcastData, function () {
    //                 console.log(stateOfX.serverLogType.info, "player elimination broadcast sent successfully in make move");
    //                 //update values in db of isbroadcastsent and isgiftdistributed
    //                 pomelo.app.rpc.database.requestRemote.updateTournamentRules("session", { channelId: player.channelId, playerId: player.playerId }, function (updateTournamentRulesResponse) {
    //                   console.log(stateOfX.serverLogType.info, 'response from updateTournamentRules - ' + JSON.stringify(updateTournamentRulesResponse));
    //                 })
    //                 imdb.setPrizeBroadcast(player.channelId, player.playerId, function (err, result) {
    //                   console.log(stateOfX.serverLogType.info, "err result " + err + result);
    //                 });
    //                 // remove player record activity from imdb
    //                 imdb.removeActivity({ tableId: player.tournamentId, playerId: player.playerId }, function (err, result) { });
    //                 imdb.removePlayerJoin({ channelId: player.channelId, playerId: player.playerId }, function (err, response) { })
    //                 callback();
    //               })
    //             } else {
    //               callback();
    //             }
    //           }, function (error) {
    //             if (error) {
    //               serverLog(stateOfX.serverLogType.info, 'Error in sending broadcast for rank');
    //             } else {
    //               serverLog(stateOfX.serverLogType.info, 'Broadcast for ranks send successfully');
    //             }
    //           })
    //         }
    //       } else {
    //         serverLog(stateOfX.serverLogType.info, 'Error in getting tournament room');
    //       }
    //     })
    //   }
    // }
  /*===========================  END  =========================*/


  /*===========================  START  =========================*/
  // New
  async informUser(params: any): Promise<void> {
    const user = await this.db.findPlayerWithId({ playerId: params.playerId });
  
    if (!user) {
      return;
    }
  
    if (systemConfig.tourNotification.mail) {
      let templateName = 'tourRank';
      let mailData: any = {
        to_email: user.emailId,
        subject: 'Tournament Rank.',
        template: templateName,
        content: {
          userName: user.userName,
          tourName: params.tournamentName,
          rank: params.tmpRank,
        }
      };
  
      if (params.chipsWon) {
        mailData.template = 'tourWin';
        mailData.content.chipsWon = params.chipsWon;
      }
  
      const result = await this.sharedModule.sendMailWithHtml(mailData);
  
      if (result.success) {
        console.log("Mail sent successfully to", user.emailId);
      } else {
        console.log("Mail not sent.");
      }
    }
  };
  
  // Old
  // const informUser = function (params) {
  //   db.findPlayerWithId({ 'playerId': params.playerId }, (err, user) => {
  //     if (!user) {
  //       console.log("Couldn/t find user to update on rank", user)
  //     } else {
  //       if (systemConfig.tourNotification.mail) {
  //         let templateName = 'tourRank'
  //         let mailData = {
  //           to_email: user.emailId,
  //           subject: 'Tournament Rank.',
  //           template: templateName,
  //           content: {
  //             userName: user.userName,
  //             tourName: params.tournamentName,
  //             rank: params.tmpRank
  //           }
  //         }
  //         if (params.chipsWon) {
  //           mailData.template = 'tourWin',
  //             mailData.content.chipsWon = params.chipsWon;
  //         }
  //         sharedModule.sendMailWithHtml(mailData, (result) => {
  //           if (result.success) {
  //             console.log("Mail sent successfully to", user.emailId);
  //           } else {
  //             console.log("Mail not sent.");
  //           }
  //         })
  //       }
  //     }
  //   })
  // }
  /*===========================  END  =========================*/


  /*===========================  START  =========================*/
  /**
   *  This method is used for sending bounty Broadcast. 
   *
   * @method process
   * @param  {Object}       self,channel  request json object
   */

  // New
  sendBountyBroadcast(self, channel) {
    let bountyPlayers = channel.bountyWinner || [];
    for (let playerIt = 0; playerIt < bountyPlayers.length; playerIt++) {
      let info = "You won bounty of " + bountyPlayers[playerIt].bountyMoney + " from ";
      console.log(stateOfX.serverLogType.info, "bounty info is - " + info);
      for (let bountyIt = 0; bountyIt < bountyPlayers[playerIt].looserPlayers.length; bountyIt++) {
        info = info + bountyPlayers[playerIt].looserPlayers[bountyIt].playerName + " ";
      }
      let broadcastData = {
        self: self,
        playerId: bountyPlayers[playerIt].winnerPlayerId,
        heading: "Bounty Winner",
        info: info,
        channelId: channel.channelId,
        buttonCode: 1
      }
      this.broadcastHandler.fireInfoBroadcastToPlayer(broadcastData);
    }
  }

  // Old
  // startTournamentHandler.sendBountyBroadcast = function (self, channel) {
  //   console.log(stateOfX.serverLogType.info, "channel is in sendBountyBroadcast is - ", channel);
  //   let bountyPlayers = channel.bountyWinner || [];
  //   console.log(stateOfX.serverLogType.info, "bountyPlayers are in send bounty broadcast - " + JSON.stringify(bountyPlayers));
  //   for (let playerIt = 0; playerIt < bountyPlayers.length; playerIt++) {
  //     let info = "You won bounty of " + bountyPlayers[playerIt].bountyMoney + " from ";
  //     console.log(stateOfX.serverLogType.info, "bounty info is - " + info);
  //     for (let bountyIt = 0; bountyIt < bountyPlayers[playerIt].looserPlayers.length; bountyIt++) {
  //       info = info + bountyPlayers[playerIt].looserPlayers[bountyIt].playerName + " ";
  //     }
  //     let broadcastData = {
  //       self: self,
  //       playerId: bountyPlayers[playerIt].winnerPlayerId,
  //       heading: "Bounty Winner",
  //       info: info,
  //       channelId: channel.channelId,
  //       buttonCode: 1
  //     }
  //     console.log(stateOfX.serverLogType.info, "going to send bounty broad cast");
  //     broadcastHandler.fireInfoBroadcastToPlayer(broadcastData);
  //   }
  // }

  /*===========================  END  =========================*/
















}