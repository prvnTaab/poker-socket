import { Injectable } from "@nestjs/common";
import _ from "underscore";
import _ld from "lodash";
import { popupTextManager, stateOfX } from "shared/common";
import { ServerDownManagerService } from "shared/common/server-down-manager/server-down-manager.service";
import { validateKeySets } from "shared/common/utils/activity";
import { ImdbDatabaseService } from "shared/common/utils/Imdbdatabase.service";
import { PokerDatabaseService } from "shared/common/utils/pokerdatabase.service";
import { JoinChannelHandler } from "./joinChannelHandler";
import { BroadcastHandlerService } from "./broadcastHandler.service";
import { SessionHandlerService } from "./sessionHandler.service";
import { RoomRemoteService } from "./remote/roomRemote.service";
import { RequestRemoteService } from "../database/requestRemote.service";
import { AutoSitHandlerService } from "./autoSitHandler.service";
import { systemConfig } from "shared/common";
import { ActionLoggerService } from "./actionLogger.service";
import { ChannelTimerHandlerService } from "./channelTimerHandler.service";






declare const pomelo: any;


@Injectable()
export class ChannelHandlerService {

  private readonly callTimerFromDb = 0;

  constructor(

    private readonly db: PokerDatabaseService,
    private readonly imdb: ImdbDatabaseService,
    private readonly serverDownManager: ServerDownManagerService,
    private readonly joinChannelHandler: JoinChannelHandler,
    private readonly broadcastHandler: BroadcastHandlerService,
    private readonly sessionHandler: SessionHandlerService,
    private readonly roomRemote: RoomRemoteService,
    private readonly requestRemote: RequestRemoteService,
    private readonly autoSitHandler: AutoSitHandlerService,
    private readonly actionLogger: ActionLoggerService,
    private readonly channelTimerHandler: ChannelTimerHandlerService



  ) { }

  /*=============================  START  ===============================*/
  // Assign player settings while joining table
  // for tournament, for open table and for autosit (join) table
  // // > Save table level settings as well
  // a) Sound
  // b) Player Chat
  // c) Dealer Chat
  // d) Table Color
  // e) Muck Winning Hand
  // f) 4 Card Color Deck
  // 
  // Request: {playerId: , channelId: , tableId: (optional), data: {}, playerName: }
  // New
  async assignTableSettings(params: any): Promise<any> {
    try {
      const result = await this.imdb.findTableSetting({ playerId: params.playerId, channelId: params.channelId });

      if (result) {
        params.data.settings = result.settings;
        return params;
      }

      const user = await this.db.getCustomUser(params.playerId, {
        settings: 1,
        prefrences: 1,
        isMuckHand: 1,
      });

      const data: any = {
        playerId: params.playerId,
        channelId: params.channelId,
        playerName: params.playerName,
        createdAt: new Date(),
        settings: {
          muteGameSound: user.settings.muteGameSound,
          dealerChat: user.settings.dealerChat,
          playerChat: user.settings.playerChat,
          tableColor: user.settings.tableColor,
          tableBackground: user.settings.tableBackground,
          cardColor: user.prefrences.cardColor,
          isMuckHand: user.isMuckHand,
          isStraddleOpted: false,
        },
        status: "spectator",
      };

      const response = await this.imdb.insertTableSetting(data);
      params.data.settings = response.settings;
      return params;

    } catch (err: any) {
      const info = err?.code === 'DB_GETSPACTATOR_SETTING_FAIL' ? popupTextManager.dbQyeryInfo.DB_GETSPACTATOR_SETTING_FAIL :
        err?.code === 'DB_GETUSERSETTINGS_FAIL' ? popupTextManager.dbQyeryInfo.DB_GETUSERSETTINGS_FAIL :
          popupTextManager.dbQyeryInfo.DB_SAVETABLESPECTATOR_FAIL;

      return {
        success: false,
        isRetry: false,
        tableId: params.tableId,
        isDisplay: false,
        channelId: params.channelId || "",
        info,
      };
    }
  };
  /*=============================  END  ===============================*/

  // Fire chips broadcast to individual player
  // Request {playerId: , self}
  broadcastChips(params) {
  }


  public async similarTableBroadcast(params: any): Promise<any> {

    const imdbTable = await this.imdb.getTable(params.channelId);

    console.log("--------ChannelHandler Line---121", imdbTable)

    if (imdbTable && imdbTable.players && imdbTable.players.length && imdbTable.maxPlayers === imdbTable.players.length) {
      const tmpChannelId = params.channelId.split('-')[0];

      const tablesRecord = await this.imdb.playerJoinedRecord({ channelId: { $regex: tmpChannelId } });

      const uniquePlayers: Record<string, any> = {};
      tablesRecord.forEach(item => {
        uniquePlayers[item.playerId] = item;
      });

      const uniquePlayersArray = Object.values(uniquePlayers);

      for (const eachJoinedPlayer of uniquePlayersArray) {
        const playerOnSeat = imdbTable.players.find(p => p.playerId === eachJoinedPlayer.playerId);

        if (!playerOnSeat) {
          const allChannels = await this.imdb.getAllTable({ channelId: { $regex: tmpChannelId } });

          if (!allChannels) {
            continue;
          }

          let fullTableCount = 0;
          let isTableAvailable = false;

          for (const table of allChannels) {
            if (table.players.length === table.maxPlayers) {
              fullTableCount++;
              continue;
            }

            const alreadyInTable = table.players.find(p => p.playerId === eachJoinedPlayer.playerId);
            if (!alreadyInTable) {
              isTableAvailable = true;
            }
          }

          console.log('sf7herkwe checking if we can send a broadcast or not', fullTableCount, allChannels.length, isTableAvailable);

          if (fullTableCount === allChannels.length || isTableAvailable) {
            for (const channel of allChannels) {
              this.broadcastHandler.newSimilarTable({
                channelId: channel.channelId,
                msg: { channelId: channel.channelId, info: 'join Now' },
                route: 'joinSimilarTable'
              });
            }
            console.log('sf7herkwe inside sending broadcast', params.playerId);
          }
        } else {
          console.log('player is sf7herkwe already in the table');
        }
      }
    } else {
      console.log('player is sf7herkwe an empty seat is available');
    }
  }



  async joinChannel(msg: any): Promise<any> {

    setTimeout(() => {
      this.similarTableBroadcast(msg);
    }, 1000);

    if (this.serverDownManager.checkServerState('joinReq')) {
      return {
        success: false,
        channelId: msg.channelId || '',
        info: 'Server is going under maintenance. No new game will start now.'
      };
    }

    // this.sessionHandler.recordLastActivityTime({ session, msg });

    const validated = await validateKeySets('Request', 'connector', 'joinChannel', msg);
    if (!validated.success) {
      return validated;
    }

    const channelService = pomelo.app.get('channelService');


    let channel = channelService.getChannel(msg.channelId, false);
    if (!channel) {
      console.log('need to insert new channel', channel);
      channel = channelService.getChannel(msg.channelId, true);
    }

    const processJoinResponse = await this.joinChannelHandler.processJoin({
      channel,
      channelId: msg.channelId,
      channelType: msg.channelType,
      tableId: msg.tableId,
      playerId: msg.playerId,
      playerName: msg.playerName,
      password: msg.password,
      networkIp: msg.networkIp,
      deviceType: msg.deviceType
    });

    const playerId = msg.playerId;
    const channelId = msg.channelId;

    const res = await this.imdb.getCardShow({ channelId });
    if (res?.length > 0) {
      const eyeResponse = res.map((result: any) => ({
        playerId: result.playerId,
        channelId: result.playerId,
        cards: result.cards
      }));
      this.broadcastHandler.sendMessageToUser({
        msg: { playerId, channelId, data: eyeResponse },
        playerId,
        route: 'muckedCardsUpdate'
      });
    }

    const myparams: any = {};
    myparams.channel = channelService.getChannel(msg.channelId, false);

    if (
      myparams.channel &&
      (myparams.channel.playerSimpleMoveWithTimeBank || myparams.channel.extraTurnTimeReference) &&
      processJoinResponse?.tableDetails
    ) {
      processJoinResponse.tableDetails.finalTimeLeft = Math.floor(
        myparams.channel.updatedTimeBank - (Date.now() - myparams.channel.startedAt) / 1000
      );

      if (myparams.channel.currentMovePlayer === msg.playerId) {
        this.roomRemote.playerReconnected(msg);
      }

    }

    const evResponse = await this.requestRemote.checkEvHappens(msg);


    if (evResponse.success && processJoinResponse?.tableDetails) {
      const potAmount = processJoinResponse.tableDetails.roundBets.reduce((acc: number, bet: number) => acc + bet, 0);
      processJoinResponse.tableDetails.totalPot -= potAmount;
    }

    const playerData = await this.imdb.getPlayerData(channelId);


    myparams.channelId = channelId;
    // myparams.session = session;
    myparams.table = { channelId };
    myparams.player = { playerCallTimer: {} };

    if (playerData?.players?.length > 0) {
      const playerIndex = _ld.findIndex(playerData.players, { playerId: msg.playerId });
      const player = playerData.players[playerIndex];

      if (playerIndex >= 0 && player.state === stateOfX.playerState.waiting) {
        myparams.player = player;
        myparams.player.isForceBlindVisible = player.isForceBlindVisible;
        myparams.player.RITstatus = player.isRunItTwice;
        myparams.player.playerCallTimer.channelId = channelId;
        myparams.player.playerCallTimer.playerId = msg.playerId;

        const callTimer = player.playerCallTimer;
        if (callTimer.status) {
          callTimer.callTimer = this.callTimerFromDb;
          callTimer.timer -= Math.floor((Date.now() - callTimer.createdAt) / systemConfig.secondToMinutsConvert);
          callTimer.timer = parseFloat(callTimer.timer);
          player.callTimeGameMissed = 0;

          if (callTimer.timer >= 1) {
            callTimer.timerInSeconds = systemConfig.playerCallTime * 60 - Math.floor((Date.now() - callTimer.createdAt) / 1000);
          } else {
            callTimer.callTimer = this.callTimerFromDb;
            callTimer.timer = 0;
            callTimer.timerInSeconds = 0;
            callTimer.status = false;
            callTimer.createdAt = 0;
          }
        }

        this.broadcastHandler.playerSettings(myparams);

        await this.requestRemote.playerLeftEv(msg);

        return processJoinResponse;;
      }
    }


    await this.requestRemote.playerLeftEv(msg);

    if (processJoinResponse?.tableDetails?.players?.length > 0 && processJoinResponse.tableDetails.isROE) {
      const tableDetails = {
        channel,
        channelId: processJoinResponse.tableDetails.channelId,
        isROE: processJoinResponse.tableDetails.isROE,
        channelVariation: processJoinResponse.tableDetails.channelVariation,
        message: `${processJoinResponse.tableDetails.channelRoundCount}/${processJoinResponse.tableDetails.maxPlayers}`
      };
      this.broadcastHandler.fireGameVariationBroadcast(tableDetails);
    }

    return processJoinResponse;
  }




  // player will add chips and then a game may start
  // async autoSit(msg: any): Promise<any> {


  //   // 1. Check if server is under maintenance
  //   if (this.serverDownManager.checkServerState('autoSitReq')) {
  //     return {
  //       success: false,
  //       channelId: msg.channelId || "",
  //       info: "Server is going under maintenance. No new game will start now."
  //     };
  //   }

  //   // 2. Validate input keys
  //   const validated = await validateKeySets("Request", "connector", "autoSit", msg);
  //   if (!validated.success) {
  //     return validated;
  //   }

  //   // 3. Get player info and prepare
  //   const foundUser = await this.db.findUser({ playerId: msg.playerId });
  //   const seatIndex = !!parseInt(msg.seatIndex) ? parseInt(msg.seatIndex) : 1;

  //   // 4. Process autoSit request
  //   const processAutoSitResponse = await this.autoSitHandler.processAutoSit({
  //     channelId: msg.channelId,
  //     playerId: msg.playerId,
  //     playerName: msg.playerName,
  //     byPassIp: foundUser.byPassIp,
  //     seatIndex,
  //     networkIp: msg.networkIp,
  //     imageAvtar: msg.imageAvtar,
  //     password: msg.password,
  //     isRequested: msg.isRequested,
  //     deviceType: msg.deviceType || '',
  //   });

  //   // 5. Handle table full edge case
  //   if (
  //     processAutoSitResponse?.data?.playerId &&
  //     processAutoSitResponse?.table?.players &&
  //     processAutoSitResponse.table.players.some(p => p.playerId === processAutoSitResponse.data.playerId) &&
  //     processAutoSitResponse.data.isTableFull
  //   ) {
  //     return processAutoSitResponse;
  //   }

  //   // 6. Handle success sit
  //   if (processAutoSitResponse.isPlayerSit) {
  //     await this.imdb.updateTableSetting(
  //       { channelId: msg.channelId, playerId: msg.playerId },
  //       { $set: { status: "Playing" } }
  //     );

  //     const myparams: any = {
  //       channelId: msg.channelId,
  //       table: { channelId: msg.channelId },
  //       waitListFlag: msg.waitListFlag,
  //       player: null,
  //     };

  //     // 7. Fire anti-banking broadcast
  //     if (processAutoSitResponse.data.antibanking.isAntiBanking) {
  //       this.fireAntiBankingUpdatePlayersBroadCast({
  //         serverId: client.handshake.address, // Approximate replacement for session.frontendId
  //         playerId: msg.playerId
  //       }, msg.channelId);
  //     }

  //     // 8. Get player data from DB
  //     const playerData = await this.imdb.getPlayerData(msg.channelId);
  //     const playerIndex = _ld.findIndex(playerData.players, { playerId: msg.playerId });
  //     myparams.player = playerData.players[playerIndex];
  //     myparams.player.RITstatus = myparams.player.isRunItTwice;

  //     // 9. Check force blind visibility
  //     const query = {
  //       seatIndex: myparams.player.seatIndex,
  //       channelId: myparams.player.channelId
  //     };

  //     const currentPlayer = await this.imdb.getCurrentPlayers(query);
  //     if (currentPlayer?.playerId === myparams.player.playerId) {
  //       myparams.player.isForceBlindVisible = false;
  //     }

  //     // 10. Fire broadcasts
  //     this.broadcastHandler.playerSettings(myparams);

  //     this.actionLogger.createEventLog({
  //       client, // no session
  //       channelId: msg.channelId,
  //       data: {
  //         channelId: msg.channelId,
  //         eventName: stateOfX.logEvents.reserved,
  //         rawData: {
  //           playerName: processAutoSitResponse.player.playerName,
  //           chips: processAutoSitResponse.player.chips,
  //           seatIndex: processAutoSitResponse.data.seatIndex
  //         }
  //       }
  //     });

  //     this.broadcastHandler.fireSitBroadcast({
  //       player: processAutoSitResponse.player,
  //       table: processAutoSitResponse.table,
  //       channelId: msg.channelId
  //     });

  //     this.channelTimerHandler.vacantReserveSeat({
  //       channelId: msg.channelId,
  //       playerId: msg.playerId,
  //       playerName: msg.playerName,
  //       socket: client
  //     });

  //     this.broadcastHandler.sendMessageToUser({
  //       playerId: msg.playerId,
  //       serverId: client.handshake.address,
  //       msg: {
  //         playerId: msg.playerId,
  //         channelId: msg.channelId,
  //         event: stateOfX.recordChange.playerJoinTable
  //       },
  //       route: stateOfX.broadcasts.joinTableList
  //     });

  //     return processAutoSitResponse.response;
  //   }

  //   // 11. If not sit but table is full
  //   if (processAutoSitResponse?.data?.isTableFull) {
  //     return {
  //       success: false,
  //       channelId: msg.channelId || "",
  //       info: popupTextManager.falseMessages.AUTOSITFAIL_ENTRYHANDLER,
  //       isRetry: false,
  //       isDisplay: true
  //     };
  //   }

  //   // 12. Default response
  //   return processAutoSitResponse;
  // }


  async fireAntiBankingUpdatePlayersBroadCast(player: any, channelId: string): Promise<void> {
    const filter = {
      playerId: player.playerId,
      channelId: channelId
    };

    try {
      const response = await this.db.getAntiBanking(filter);

      if (response) {
        const createdAt = Number(response.createdAt);
        const now = Number(new Date());
        const timeToNumber =
          Number(systemConfig.expireAntiBankingSeconds) +
          Number(systemConfig.antiBankingBuffer) -
          (now - createdAt) / 1000;

        const isAntiBankingStatus = timeToNumber > 0;

        this.broadcastHandler.sendMessageToUser({
          playerId: player.playerId,
          serverId: player.serverId,
          msg: {
            playerId: player.playerId,
            channelId: channelId,
            isAntiBanking: isAntiBankingStatus,
            timeRemains: timeToNumber,
            amount: response.amount,
            event: stateOfX.recordChange.playerLeaveTable
          },
          route: stateOfX.broadcasts.antiBankingUpdatedData
        });
      }
    } catch (err) {
      // Handle error if needed (optional)
      console.error('fireAntiBankingUpdatePlayersBroadCast error:', err);
    }
  }









}