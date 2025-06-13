import { Injectable } from "@nestjs/common";
import { popupTextManager, stateOfX, systemConfig } from "shared/common";
import { ActivityService } from "shared/common/activity/activity.service";
import { ImdbDatabaseService } from "shared/common/datebase/Imdbdatabase.service";
import { PokerDatabaseService } from "shared/common/datebase/pokerdatabase.service";
import { validateKeySets } from "shared/common/utils/activity";
import _ from 'underscore';
import { BroadcastHandlerService } from "./broadcastHandler.service";
import { SessionHandlerService } from "./sessionHandler.service";
import { UpdateProfileHandlerService } from "./updateProfileHandler.service";
import { LogoutHandlerService } from "./logoutHandler.service";
import { RetryHandlerService } from "./retryHandler.service";
import { RebuyHandlerService } from "./rebuyHandler.service";
import { AddOnHandlerService } from "./addOnHandler.service";
import { GetFiltersFromDbService } from "./getFiltersFromDb.service";
import { OnlinePlayersService } from "./onlinePlayers.service";
import { DisconnectionHandlerService } from "./disconnectionHandler.service";
import { CommonHandlerService } from "./commonHandler.service";
import { TournamentLeaveHandlerService } from "./tournamentLeaveHandler.service";
import { TopupHandlerService } from "./topupHandler.service";
import { PromotionalDataHandlerService } from "./promotionalDataHandler.service";
import { CashOutHandlerFromAppService } from "./cashOutHandlerFromApp.service";
import { PanCardHandlerService } from "./panCardHandler.service";
import { SpinTheWheelHandlerService } from "./spinTheWheelHandler.service";
import { BonusHandlerService } from "./bonusHandler.service";







//   broadcastHandler = require("./broadcastHandler"),
//   sessionHandler = require("./sessionHandler"),
//   updateProfileHandler = require("./updateProfileHandler"),
// //   lateRegistrationHandler = require("./lateRegistrationHandler"),
//   logoutHandler = require("./logoutHandler"),
//   retryHandler = require("./retryHandler"),

//   rebuyHandler = require("./rebuyHandler"),
//   addOnHandler = require("./addOnHandler"),
//   getFiltersFromDb = require("./getFiltersFromDb"),
//   onlinePlayers = require("./onlinePlayers"),
//   disconnectionHandler = require("./disconnectionHandler"),
//   commonHandler = require("./commonHandler"),
//   tournamentLeaveHandler = require("./tournamentLeaveHandler"),
//   // tournamentActionHandler = require("./tournamentActionHandler"),
//   topupHandler = require("./topupHandler"),
//   promotionalDataHandler = require("./promotionalDataHandler"),
//   winnerMgmt = require("../../../../../shared/winnerAlgo/entry"),
//   contest = require("../../../../contest"),
//   cashOutHandler = require("./cashOutHandlerFromApp"),
//   panCardController = require("./panCardHandler"),
//   spinTheWheelHandler = require("./spinTheWheelHandler"),
//   milliToTime = require("../../../util/convertMilliSecondToTime"),
//   bonusCodeHandler = require("./bonusHandler");
// const wallet = require('../../walletQuery');



@Injectable()
export class EntryHandlerService {



  constructor(
    private readonly db: PokerDatabaseService,
    private readonly imdb: ImdbDatabaseService,
    private readonly activity: ActivityService,
    private readonly broadcastHandler: BroadcastHandlerService,
    private readonly sessionHandler: SessionHandlerService,
    private readonly updateProfileHandler: UpdateProfileHandlerService,
    private readonly logoutHandler: LogoutHandlerService,
    private readonly retryHandler: RetryHandlerService,
    private readonly rebuyHandler: RebuyHandlerService,
    private readonly addOnHandler: AddOnHandlerService,
    private readonly getFiltersFromDb: GetFiltersFromDbService,
    private readonly onlinePlayers: OnlinePlayersService,
    private readonly disconnectionHandler: DisconnectionHandlerService,
    private readonly commonHandler: CommonHandlerService,
    private readonly tournamentLeaveHandler: TournamentLeaveHandlerService,
    private readonly topupHandler: TopupHandlerService,
    private readonly promotionalDataHandler: PromotionalDataHandlerService,
    private readonly cashOutHandler: CashOutHandlerFromAppService,
    private readonly panCardController: PanCardHandlerService,
    private readonly spinTheWheelHandler: SpinTheWheelHandlerService,
    private readonly bonusCodeHandler: BonusHandlerService,
    private readonly app: any, // This is where your Pomelo-like `app` instance would be injected if needed
  ) { }


  /*
   * All the request functions in this file will have three default params -
   *
   * @param  {Object}   msg     request message
   * @param  {Object}   session current session object
   * @param  {Function} next    next stemp callback
   *
   * All these function contains a callback for client requests as next
   */

  // ### <<<<<<<<<<<<<<<<<<< INTERNAL FUNCTIONS STARTS >>>>>>>>>>>>>>>>>>>>>>

  // ### Handle app close or session kill event
  // var onUserLeave = function (self, session) {
  //   console.log("onUserLeaveonUserLeave", self.session.settings.playerId)
  //   if (self && self.session && self.session.settings && self.session.settings.playerId) {
  //     adminDb.updateDailyLoggedInUser({ playerId: self.session.settings.playerId, action: "login" }, { logoutTime: Number(new Date()), action: "logout" }, (err, res) => { });
  //   }
  //   if (!session || !session.uid) {
  //     return;
  //   }

  //   console.error("\n\
  // ██████╗ ██╗███████╗ ██████╗ ██████╗ ███╗   ██╗███╗   ██╗███████╗ ██████╗████████╗\n\
  // ██╔══██╗██║██╔════╝██╔════╝██╔═══██╗████╗  ██║████╗  ██║██╔════╝██╔════╝╚══██╔══╝\n\
  // ██║  ██║██║███████╗██║     ██║   ██║██╔██╗ ██║██╔██╗ ██║█████╗  ██║        ██║   \n\
  // ██║  ██║██║╚════██║██║     ██║   ██║██║╚██╗██║██║╚██╗██║██╔══╝  ██║        ██║   \n\
  // ██████╔╝██║███████║╚██████╗╚██████╔╝██║ ╚████║██║ ╚████║███████╗╚██████╗   ██║   \n\
  // ╚═════╝ ╚═╝╚══════╝ ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝  ╚═══╝╚══════╝ ╚═════╝   ╚═╝   \n\
  //                                                                                  \n\
  // ")
  //   session.set("isDisconnectedForce", true);
  //   session.push("isDisconnectedForce", function (err) {
  //     if (err) {
  //       serverLog(stateOfX.serverLogType.error, 'set disconnected for session service failed! error is : %j', err.stack);
  //       return false;
  //     }
  //   });

  //   disconnectionHandler.handle({ self: self, session: session });
  //   onlinePlayers.processOnlinePlayers({ self: self });
  // };

  async onUserLeave(self: any, session: any): Promise<any> {
    const playerId = self?.session?.settings?.playerId;
    if (playerId) {
      await this.db.updateDailyLoggedInUser(
        { playerId, action: "login" },
        { logoutTime: Date.now(), action: "logout" }
      );
    }

    if (!session?.uid) {
      return;
    }

    session.set("isDisconnectedForce", true);
    session.push("isDisconnectedForce", (err: any) => {
      if (err) {
        // Error silently ignored
        return false;
      }
    });

    this.disconnectionHandler.handle({ self, session });
    this.onlinePlayers.processOnlinePlayers({ self });
  }


  // ### This function is for bind user sessionn
  async bindUserSession(msg: any): Promise<any> {
    const validated = await validateKeySets("Request", msg.self.app.serverType, "bindUserSession", msg);

    if (!validated.success) {
      return validated;
    }

    const session = msg.session;
    session.bind(msg.playerId);
    session.on('closed', this.onUserLeave.bind(null, msg.self));

    try {
      session.set("playerId", msg.playerId);
      await session.push("playerId");

      const clientAddress = msg.self.app.get('sessionService').getClientAddressBySessionId(session.id);
      session.set("networkIp", clientAddress.ip);
      await session.push("networkIp");

      session.set("waitingChannels", []);
      await session.push("waitingChannels");

      session.set("channels", []);
      await session.push("channels");

      session.set("playerName", msg.playerName);
      await session.push("playerName");

      session.set("deviceType", msg.deviceType || 'cell');
      await session.push("deviceType");

      session.set("lastActiveTime", Number(new Date()));
      await session.push("lastActiveTime");

      await this.onlinePlayers.processOnlinePlayers({ self: msg.self });

      return {
        success: true,
        info: popupTextManager.dbQyeryInfo.BINDUSERSESSION_TRUE_ENTRYHANDLER,
        isRetry: false,
        isDisplay: false,
        channelId: ""
      };

    } catch (err) {
      return { success: false };
    }
  }


  // ### validate tournament whether it is ready to start of not

  async validateTournamentStart(params: any): Promise<any> {
    const validated = await validateKeySets("Request", params.serverType, "validateTournamentStart", params);

    if (!validated.success) {
      return { success: false };
    }

    const tournamentId = params.tournamentId;
    const tournamentRoom = await this.db.getTournamentRoom(tournamentId);

    if (!tournamentRoom) {
      return { success: false };
    }

    const playerRequired = tournamentRoom.maxPlayersForTournament;
    const noOfUsers = await this.db.countTournamentusers({ tournamentId: tournamentId, status: 'Registered' });

    if (noOfUsers !== playerRequired) {
      return { success: false };
    }

    await params.self.startTournament({ tournamentId: tournamentId }, "session");

    // If needed, add logic here to change the tournament state to RUNNING
    // await changeStateOfTournament(tournamentRoom._id, stateOfX.tournamentState.running);

    return {
      success: true,
      result: { tournamentId: tournamentRoom._id }
    };
  }


  // ### <<<<<<<<<<<<<<<<<<< INTERNAL FUNCTIONS FINISHED >>>>>>>>>>>>>>>>>>>>>>

  // <<<<<<<<<<<<<<<<<<<<<<<< HANDLER REQUEST FROM CLIENT >>>>>>>>>>>>>>>>>>>>>

  // ### Test function to destroy channel
  // deprecated here
  async killChannel(msg: any, session: any): Promise<any> {
    this.sessionHandler.recordLastActivityTime({ session, msg });

    const channel = this.app.get('channelService').getChannel(msg.channelId, false);
    if (channel) {
      channel.destroy();

      const success = { success: true };
      return success;
    } else {
      return {
        success: false,
        info: popupTextManager.dbQyeryInfo.KILLCHANNELFAIL_ENTRYHANDLER,
        isRetry: false,
        isDisplay: false,
        channelId: ""
      };
    }
  }

  // ### Create session for this player with server ###
  // kill old session if found
  // find player's joined channels - return array of object containing channelId
  async enter(msg: any, session: any): Promise<any> {
    if (!msg.isRequestedBySocket) {
      await this.broadcastHandler.userLoggedIn({ playerId: msg.playerId, action: 'pomeloLoggedIn' });
    }

    const self = this;
    self.session = session;

    const validated = await validateKeySets("Request", "connector", "enter", msg);

    if (!validated.success) {
      return validated;
    }

    const sessionExist = await self.app.rpc.connector.entryRemote.getUserSession(self.session, msg);

    if (sessionExist.success) {
      const prevSession = self.app.sessionService.get(sessionExist.sessionId);
      if (prevSession) {
        prevSession.set("isConnected", false);
        self.session.set("waitingChannels", prevSession.get("waitingChannels"));
        await self.app.sessionService.kickBySessionId(sessionExist.sessionId, 'elseWhere-another device');
      }

      await self.app.rpc.connector.entryRemote.killUserSession(self.session, sessionExist.sessionId);

      const userSession = await this.bindUserSession({
        playerId: msg.playerId,
        playerName: msg.playerName,
        deviceType: msg.deviceType,
        session,
        self,
      });

      const joinChannelResponse = await this.retryHandler.getJoinedChannles({ playerId: msg.playerId });

      if (joinChannelResponse.success) {
        return {
          success: userSession.success,
          joinChannels: joinChannelResponse.joinedChannels,
        };
      } else {
        return {
          success: false,
          info: popupTextManager.dbQyeryInfo.GETJOINEDCHANNELSFAIL_ENTRYHANDLER,
          isRetry: false,
          isDisplay: true,
          channelId: "",
        };
      }
    } else {
      const userSession = await this.bindUserSession({
        playerId: msg.playerId,
        playerName: msg.playerName,
        deviceType: msg.deviceType,
        session,
        self,
      });

      const joinChannelResponse = await this.retryHandler.getJoinedChannles({ playerId: msg.playerId });

      if (joinChannelResponse.success) {
        return {
          success: userSession.success,
          joinChannels: joinChannelResponse.joinedChannels,
        };
      } else {
        return {
          success: false,
          channelId: "",
          isDisplay: true,
          isRetry: false,
          info: popupTextManager.dbQyeryInfo.GETJOINEDCHANNELSFAIL_ENTRYHANDLER,
        };
      }
    }
  }


  // this api is to set isconnected true in session for player
  // and update player state if needed - to playing
  async acknowledgeIsConnected(msg: any, session: any): Promise<void> {
    this.sessionHandler.recordLastActivityTime({ session, msg });

    const self = this;

    const validated = await validateKeySets("Request", "connector", "acknowledgeIsConnected", msg);

    if (!validated.success) {
      return; // notify
    }

    const playerSessions = self.app.sessionService.getByUid(msg.playerId);
    const playerSession = Array.isArray(playerSessions) ? playerSessions[0] : null;

    if (playerSession) {
      playerSession.set("isConnected", true);
    }

    if (msg.data?.channelId && msg.data?.setState && session.uid) {
      const setPlayerAttribResponse = await self.app.rpc.database.tableRemote.setPlayerAttrib(
        session,
        {
          playerId: session.uid,
          channelId: msg.data.channelId,
          key: "state",
          value: stateOfX.playerState.playing,
          ifLastState: stateOfX.playerState.disconnected
        }
      );

      const responseValidated = await validateKeySets("Response", self.app.serverType, "isConnected", setPlayerAttribResponse);

      // Regardless of validation success/failure, this is just a notify
      return;
    }

    return; // notify
  }

  // ### Single Login
  // deprecated
  async singleLoginDep(msg: any, session: any): Promise<any> {
    this.sessionHandler.recordLastActivityTime({ session, msg });

    const validated = await validateKeySets("Request", "connector", "singleLogin", msg);

    if (!validated.success) {
      return validated;
    }

    const sessionExist = await this.app.rpc.connector.entryRemote.getUserSession(this.session, msg);

    await this.app.rpc.connector.entryRemote.killUserSession(this.session, sessionExist.sessionId);

    const params = {
      playerId: msg.playerId,
      session,
      self,
    };

    const userSession = await this.bindUserSession(params);

    const success = { success: userSession.success };
    return success;
  }

  // ### Create session with server after disconnection ###
  // Currently not killing the session of previous user some problem with session current session killed
  // TODO - We have to kill the previous session of user
  // deprecated
  async reconnectDep(msg: any, session: any): Promise<any> {
    this.sessionHandler.recordLastActivityTime({ session, msg });

    const self = this;
    const playerId = msg.playerId;

    const sessionExist = await self.app.rpc.connector.entryRemote.getUserSession(session, msg);
    const params = { playerId: msg.playerId, session, self };

    if (sessionExist.success) {
      await this.broadcastHandler.sendMessageToUser({
        self,
        playerId,
        msg: { info: "you are going to be logged out as multiple login detected" },
        route: "multipleLogin"
      });
    }

    const userSession = await this.sessionHandler.bindUserSession(params);
    const success = { success: userSession.success };
    return success;
  }


  // ### Get list of tables
  // TODO: Modify as used for test only
  async getTables(msg: any, session: any): Promise<any> {
    this.sessionHandler.recordLastActivityTime({ session, msg });

    try {
      const result = await this.db.listTable({});
      return { success: true, result };
    } catch (error) {
      return {
        success: false,
        info: popupTextManager.dbQyeryInfo.DBLISTTABLESFAIL_ENTRYHANDLER,
        isRetry: false,
        isDisplay: true,
        channelId: "",
      };
    }
  }



  // ### Client-server acknowledgement handler
  // MAJOR doubt
  // deprecated
  async isConnectedDep(msg: any, session: any): Promise<any> {
    this.sessionHandler.recordLastActivityTime({ session, msg });
    const self = this;

    const validated = await validateKeySets("Request", "connector", "isConnected", msg);
    if (!validated.success) {
      return validated;
    }

    const setPlayerAttribResponse = await self.app.rpc.database.tableRemote.setPlayerAttrib(
      session,
      {
        playerId: msg.playerId,
        channelId: msg.channelId,
        key: "state",
        value: stateOfX.playerState.playing
      }
    );

    if (!setPlayerAttribResponse.success) {
      return setPlayerAttribResponse;
    }

    const responseValidated = await validateKeySets(
      "Response",
      self.app.serverType,
      "isConnected",
      setPlayerAttribResponse
    );

    return responseValidated.success ? setPlayerAttribResponse : responseValidated;
  }


  // ### Update user profile
  // Request : query,updateKeys
  // Response : {success: true, info: "user successfully updated"}
  async updateProfile(msg: any, session: any): Promise<any> {
    this.sessionHandler.recordLastActivityTime({ session, msg });

    msg.serverType = "connector";
    msg.session = session;
    msg.self = this;

    const validated = await validateKeySets("Request", "connector", "updateProfile", msg);
    if (!validated.success) {
      this.activity.updateProfile(msg, stateOfX.profile.category.profile, stateOfX.profile.subCategory.update, validated, stateOfX.logType.error);
      return validated;
    }

    const updateProfileResponse = await this.updateProfileHandler.updateProfile(msg);
    this.activity.updateProfile(msg, stateOfX.profile.category.profile, stateOfX.profile.subCategory.update, updateProfileResponse, stateOfX.logType.success);
    return updateProfileResponse;
  }




  // ### Update user profile
  // Request : query,updateKeys
  // Response : {success: true, info: "user successfully updated"}
  async blockMe(msg: any, session: any): Promise<any> {
    this.sessionHandler.recordLastActivityTime({ session, msg });

    msg.serverType = "connector";
    msg.session = session;
    msg.self = this;
    msg.query = { playerId: msg.playerId };
    msg.updateKeys = {
      isBlocked: true,
      reasonForBan: "self deleted account",
      status: "Block"
    };

    console.log('inside block me', msg);

    const validated = await validateKeySets("Request", "connector", "blockMe", msg);
    if (!validated.success) {
      this.activity.updateProfile(
        msg,
        stateOfX.profile.category.profile,
        stateOfX.profile.subCategory.update,
        validated,
        stateOfX.logType.error
      );
      return validated;
    }

    const updateProfileResponse = await this.updateProfileHandler.updateProfile(msg);
    this.activity.updateProfile(
      msg,
      stateOfX.profile.category.profile,
      stateOfX.profile.subCategory.update,
      updateProfileResponse,
      stateOfX.logType.success
    );

    return updateProfileResponse;
  }




  //### Get player profile
  // Request : playerId,keys
  // Response : user profile with above keys
  async getProfile(msg: any, session: any): Promise<any> {
    this.sessionHandler.recordLastActivityTime({ session, msg });

    const validated = await validateKeySets("Request", "connector", "getProfile", msg);
    if (!validated.success) {
      return validated;
    }

    const getProfileResponse = await this.updateProfileHandler.getProfile(msg);
    return getProfileResponse;
  }



  async getCashoutDetails(msg: any, session: any): Promise<any> {
    const { err, response } = await this.cashOutHandler.getCashoutDetails(msg);

    return err ? err : response;
  }


  // ### Handle sitout on next big blind option
  // feature removed
  async sitoutNextBigBlind(msg: any, session: any): Promise<any> {
    this.sessionHandler.recordLastActivityTime({ session, msg });
    const self = this;

    const validated = await validateKeySets("Request", "database", "sitoutNextBigBlind", msg);
    if (!validated.success) {
      return validated;
    }

    const sitoutResponse = await self.app.rpc.database.tableRemote.sitoutNextBigBlind(session, msg);

    if (!sitoutResponse.success) {
      return sitoutResponse;
    }

    const respValidated = await validateKeySets("Response", "database", "sitoutNextBigBlind", sitoutResponse);
    return respValidated.success ? sitoutResponse : respValidated;
  }





  // ### Handler to get list of tables on lobby
  async getLobbyTables(msg: any, session: any): Promise<any> {
    const self = this;

    const validated = await validateKeySets("Request", "connector", "getLobbyTables", msg);
    if (!validated.success) {
      this.activity.getLobbyTables(
        msg,
        stateOfX.profile.category.lobby,
        stateOfX.lobby.subCategory.fetchTables,
        validated,
        stateOfX.logType.error
      );
      return validated;
    }

    const tempObj = {
      isActive: true,
      isOrganic: msg.isOrganic,
      channelType: msg.channelType ?? "NORMAL",
      isRealMoney: JSON.parse(msg.isRealMoney),
      channelVariation: msg.channelVariation,
      playerId: msg.playerId,
    };

    const lobbyResponse = await self.app.rpc.database.dbRemote.getTablesForGames(session, tempObj);
    this.activity.getLobbyTables(
      msg,
      stateOfX.profile.category.lobby,
      stateOfX.lobby.subCategory.fetchTables,
      lobbyResponse,
      stateOfX.logType.success
    );
    return lobbyResponse;
  }

  // deprecated
  async getLobbyTablesForBot(msg, session, next) {
    this.sessionHandler.recordLastActivityTime({ session, msg });

    const self = this;
    const tempObj = {
      isActive: true,
      channelType: msg.channelType ?? "NORMAL",
      isRealMoney: { $in: [true, false] },
      channelVariation: {
        $in: ["Texas Hold’em", "Omaha Hi-Lo", "Omaha", "Six Plus Texas Hold’em"],
      },
      playerId: msg.playerId,
    };

    try {
      const lobbyResponse = await new Promise<any>((resolve, reject) => {
        self.app.rpc.database.dbRemote.getTablesForGames(
          session,
          tempObj,
          (res: any) => {
            resolve(res);
          }
        );
      });

      this.activity.getLobbyTables(
        msg,
        stateOfX.profile.category.lobby,
        stateOfX.lobby.subCategory.fetchTables,
        lobbyResponse,
        stateOfX.logType.success
      );

      next(null, lobbyResponse);
    } catch (err) {
      const errorResponse = { success: false, info: "Failed to fetch tables." };
      this.activity.getLobbyTables(
        msg,
        stateOfX.profile.category.lobby,
        stateOfX.lobby.subCategory.fetchTables,
        errorResponse,
        stateOfX.logType.error
      );
      next(null, errorResponse);
    }
  };




  // ### Handler to create tournament table
  // tournament
  createTournamentTables(msg, session, next) {
    this.sessionHandler.recordLastActivityTime({ session, msg });
    const self = this;

    const validated = await validateKeySets(
      "Request",
      "connector",
      "createTournamentTables",
      msg
    );

    if (validated.success) {
      const lobbyResponse = await new Promise<any>((resolve) => {
        self.app.rpc.database.dbRemote.createTablesForTournament(
          session,
          msg,
          (res: any) => resolve(res)
        );
      });

      next(null, lobbyResponse);
    } else {
      next(null, validated);
    }
  };




  // ### Handler to report issue from player
  // internally uses feedback function
  async reportIssue(msg, session, next) {
    await this.handler.feedback.call(this, msg, session, next);
  };


  // ### Handler to get issue for player
  // deprecated
  async getIssue(msg: any, session: any, next: Function) {
    this.sessionHandler.recordLastActivityTime({ session, msg });

    const self = this;

    const validated = await validateKeySets("Request", "connector", "getIssue", msg);
    if (validated.success) {
      msg = _.omit(msg, '__route__');
      const getIssueResponse = await self.app.rpc.database.dbRemote.getIssue(session, msg);
      next(null, getIssueResponse);
    } else {
      next(null, validated);
    }
  };




  // ### Join player to similar table
  async joinSimilarTable(msg: any, session: any, next: Function) {
    this.sessionHandler.recordLastActivityTime({ session, msg });

    const self = this;

    const validated = await validateKeySets("Request", "connector", "joinSimilarTable", msg);
    if (validated.success) {
      const searchTableResponse = await self.app.rpc.database.dynamicTable.similarTableJoin(session, {
        playerId: msg.playerId,
        channelId: msg.channelId,
      });
      next(null, searchTableResponse);
    } else {
      next(null, validated);
    }
  };


  //### check whether user is registered in tournament or not
  //tournament
  async isRegisteredUserInTournament(msg: any, session: any, next: Function) {
    this.sessionHandler.recordLastActivityTime({ session, msg });

    const self = this;

    const validated = await validateKeySets("Request", "connector", "isRegisteredUserInTournament", msg);
    if (validated.success) {
      const registeredUserResponse = await self.app.rpc.database.tournament.isRegisteredUserInTournament(session, {
        playerId: msg.playerId,
        tournamentId: msg.tournamentId,
        gameVersionCount: msg.gameVersionCount,
      });
      next(null, registeredUserResponse);
    } else {
      next(null, validated);
    }
  };


  //### handler for start tournament
  //tournament
  async startTournament(msg: any, session: any, next: Function) {
    // sessionHandler.recordLastActivityTime({ session, msg });

    const self = this;

    const validated = await validateKeySets("Request", "connector", "startTournament", msg);
    if (validated) {
      const params = {
        tournamentId: msg.tournamentId,
        gameVersionCount: msg.gameVersionCount,
        self,
        session,
      };

      const tournamentStartResponse = await this.startTournamentHandler.process(params);

      if (tournamentStartResponse.success) {
        next(null, tournamentStartResponse.result);
      } else {
        next(null, tournamentStartResponse);
      }
    } else {
      next(null, validated);
    }
  };


  //### handler for quick seat management for cash games
  // msg contains various filters - minBuyIn maxPlayers isRealMoney channelVariation maxPlayers
  async quickSeat(msg: any, session: any, next: Function) {
    this.sessionHandler.recordLastActivityTime({ session, msg });

    const validated = await validateKeySets("Request", "connector", "quickSeat", msg);
    if (validated) {
      if (typeof msg.minBuyIn !== "number" || typeof msg.maxPlayers !== "number") {
        next(null, "invalid big blind or max player type");
      } else {
        const params = {
          isRealMoney: JSON.parse(msg.isRealMoney),
          channelVariation: msg.channelVariation,
          minBuyIn: Number(msg.minBuyIn),
          maxPlayers: Number(msg.maxPlayers),
          channelType: "NORMAL"
        };

        const quickSeatResponse = await this.app.rpc.database.dbRemote.getQuickSeatTable(session, params);
        next(null, quickSeatResponse);
      }
    } else {
      next(null, validated);
    }
  };



  //### handler for quick seat management for SIT N GO Tournament
  //tournament
  async getQuickSeatSitNGo(msg: any, session: any, next: any): Promise<void> {
    this.sessionHandler.recordLastActivityTime({ session, msg });

    const validated = await validateKeySets("Request", "connector", "quickSeatSitNGo", msg);
    if (!validated) {
      next(null, validated);
      return;
    }

    if (typeof msg.minBuyIn !== "number" || typeof msg.maxPlayers !== "number") {
      next(null, "invalid big blind or max player type");
      return;
    }

    const params = {
      isRealMoney: JSON.parse(msg.isRealMoney),
      channelVariation: msg.channelVariation,
      buyIn: Number(msg.buyIn),
      maxPlayersForTournament: Number(msg.maxPlayersForTournament),
      tournamentType: "SIT N GO"
    };

    const quickSeatResponse = await this.app.rpc.database.dbRemote.getQuickSeatSitNGo(session, params);
    next(null, quickSeatResponse);
  };


  //### handler for quick seat management for Tournament
  //tournament
  async getQuickSeatTournament(msg: any, session: any, next: any): Promise<void> {
    this.sessionHandler.recordLastActivityTime({ session, msg });

    const validated = await validateKeySets("Request", "connector", "quickSeatTournament", msg);

    if (!validated) {
      next(null, validated);
      return;
    }

    if (typeof msg.minBuyIn !== "number" || typeof msg.maxPlayers !== "number") {
      next(null, "invalid big blind or max player type");
      return;
    }

    const params = {
      isRealMoney: JSON.parse(msg.isRealMoney),
      channelVariation: msg.channelVariation,
      buyIn: Number(msg.buyIn),
      maxPlayersForTournament: Number(msg.maxPlayersForTournament),
      tournamentType: msg.tournamentType
    };

    const quickSeatResponse = await this.app.rpc.database.dbRemote.getQuickSeatSitNGo(session, params);
    next(null, quickSeatResponse);
  };


  // get various filters for quick seat inputs
  // for like - turnTime smallBlind bigBlind channelVariation maxPlayers
  async getFilters(msg: any, session: any, next: any): Promise<void> {
    this.sessionHandler.recordLastActivityTime({ session, msg });

    const validated = await validateKeySets("Request", "connector", "getFilters", msg);

    if (!validated.success) {
      next(null, validated);
      return;
    }

    const result = await this.getFiltersFromDb.generateResponse();
    next(null, result);
  };


  //### handler for add favourate seat management (Not applicable for any kind of tournament, as in tournament no seat is fixed)
  //deprecated
  async addFavourateSeat(msg: any, session: any): Promise<any> {
    this.sessionHandler.recordLastActivityTime({ session: session, msg: msg });

    const validated = await validateKeySets("Request", "connector", "addFavourateSeat", msg);
    if (!validated) {
      return validated;
    }

    if (msg.favourateSeat.channelId === undefined) {
      return {
        success: false,
        info: popupTextManager.dbQyeryInfo.ADDFAVOURATESEATFAIL_MISSINGCHANNELID_ENTRYHANDLER,
        isRetry: false,
        isDisplay: false,
        channelId: "",
      };
    }

    if (msg.favourateSeat.position === undefined || typeof msg.favourateSeat.position !== "number") {
      return {
        success: false,
        info: popupTextManager.dbQyeryInfo.ADDFAVOURATESEATFAIL_MISSINGPOSITION_ENTRYHANDLER,
        isRetry: false,
        isDisplay: false,
        channelId: "",
      };
    }

    const params = {
      playerId: msg.playerId,
      favourateSeat: {
        channelName: msg.favourateSeat.channelName,
        channelVariation: msg.favourateSeat.channelVariation,
        channelId: msg.favourateSeat.channelId,
        position: msg.favourateSeat.position,
      },
    };

    const quickSeatResponse = await this.app.rpc.database.dbRemote.addFavourateSeat(session, params);

    return quickSeatResponse;
  };


  //### handler to remove favourate seat (Not applicable for any kind of tournament, as in tournament no seat is fixed)
  //deprecated
  async removeFavourateSeat(msg: any, session: any): Promise<any> {
    this.sessionHandler.recordLastActivityTime({ session: session, msg: msg });

    const validated = await validateKeySets("Request", "connector", "removeFavourateSeat", msg);
    if (!validated) {
      return validated;
    }

    const params = {
      playerId: msg.playerId,
      channelId: msg.channelId
    };

    const removeFavourateSeatResponse = await this.app.rpc.database.dbRemote.removeFavourateSeat(session, params);

    return removeFavourateSeatResponse;
  };


  //### handler for add favourate table management (records for both normal game or tournament, diffrenciated by type)
  async addFavourateTable(msg: any, session: any): Promise<any> {
    this.sessionHandler.recordLastActivityTime({ session: session, msg: msg });

    const validated = await validateKeySets("Request", "connector", "addFavourateTable", msg);
    if (!validated) {
      return validated;
    }

    if (msg.favourateTable.channelId === undefined) {
      return {
        success: false,
        channelId: msg.channelId || "",
        info: popupTextManager.dbQyeryInfo.ADDFAVOURATETABLEFAIL_MISSINGCHANNELID_ENTRYHANDLER,
        isRetry: false,
        isDisplay: false,
      };
    }

    if (msg.favourateTable.type === undefined) {
      return {
        success: false,
        channelId: msg.channelId || "",
        info: popupTextManager.dbQyeryInfo.ADDFAVOURATESEATFAIL_MISSINGPOSITION_ENTRYHANDLER,
        isRetry: false,
        isDisplay: false,
      };
    }

    if (msg.favourateTable.type === 'TOURNAMENT' || msg.favourateTable.type === 'NORMAL') {
      const params = {
        playerId: msg.playerId,
        favourateTable: {
          type: msg.favourateTable.type,
          channelId: msg.favourateTable.channelId,
        },
      };

      const quickSeatResponse = await this.app.rpc.database.dbRemote.addFavourateTable(session, params);

      return quickSeatResponse;
    }

    return "invalid table type";
  };


  //### handler to remove favourate table
  async removeFavourateTable(msg: any, session: any): Promise<any> {
    this.sessionHandler.recordLastActivityTime({ session: session, msg: msg });

    const validated = await validateKeySets("Request", "connector", "removeFavourateTable", msg);
    if (!validated) {
      return validated;
    }

    const params = {
      playerId: msg.playerId,
      channelId: msg.channelId,
    };

    const removeFavourateTableResponse = await this.app.rpc.database.dbRemote.removeFavourateTable(session, params);

    return removeFavourateTableResponse;
  };


  //### handler to update Avg Stack for a table (Not applicable for tournament)
  //deprecated - not used from here
  async updateStackTable(msg: any, session: any): Promise<any> {
    this.sessionHandler.recordLastActivityTime({ session: session, msg: msg });

    const validated = await validateKeySets("Request", "connector", "updateStackTable", msg);
    if (!validated) {
      return validated;
    }

    const params = { id: msg.id, stack: JSON.parse(msg.stack) };

    const response = await this.app.rpc.database.dbRemote.updateStackTable(session, params)

    return response;
  };


  //### handler to update Avg Stack for a tournament room
  //tournament
  async updateStackTournamentRoom(msg: any, session: any): Promise<any> {
    this.sessionHandler.recordLastActivityTime({ session: session, msg: msg });

    const validated = await validateKeySets("Request", "connector", "updateStackTournamentRoom", msg);
    if (!validated) {
      return validated;
    }

    const params = { id: msg.id, stack: JSON.parse(msg.stack) };

    const response = await new Promise<any>((resolve) =>
      this.app.rpc.database.dbRemote.updateStackTournamentRoom(session, params, (res) => resolve(res))
    );

    return response;
  };

  //### get tournament registered users
  //tournament
  async getRegisteredTournamentUsers(msg: any, session: any): Promise<any> {
    this.sessionHandler.recordLastActivityTime({ session: session, msg: msg });

    const validated = await validateKeySets("Request", "connector", "getRegisteredTournamentUsers", msg);
    if (!validated.success) {
      return validated;
    }

    const response = await this.app.rpc.database.tournament.getRegisteredTournamentUsers(
      session,
      {
        playerId: msg.playerId,
        tournamentId: msg.tournamentId,
        gameVersionCount: msg.gameVersionCount,
      });
    return response;
  };


  // ### Handle request to get inside table structure to be displayed on lobby
  async getTable(msg: any, session: any): Promise<any> {
    this.sessionHandler.recordLastActivityTime({ session: session, msg: msg });

    const validated = await validateKeySets("Request", "connector", "getTable", msg);
    if (!validated.success) {
      this.activity.getTable(msg, stateOfX.profile.category.lobby, stateOfX.lobby.subCategory.fetchTables, validated, stateOfX.logType.error);
      return validated;
    }

    const response = await this.app.rpc.database.tableRemote.getTableView(
      session,
      {
        channelId: msg.channelId,
        playerId: msg.playerId,
        deviceType: msg.deviceType,
      });

    this.activity.getTable(msg, stateOfX.profile.category.lobby, stateOfX.lobby.subCategory.fetchTables, response, stateOfX.logType.success);
    return response;
  };


  async getTableStructure(msg: any, session: any): Promise<any> {
    this.sessionHandler.recordLastActivityTime({ session, msg });

    const validated = await validateKeySets("Request", "connector", "getTableStructure", msg);
    if (!validated.success) {
      return validated;
    }

    const response = await this.app.rpc.database.tournament.getChannelStructure(
      session,
      {
        tournamentId: msg.tournamentId,
        gameVersionCount: msg.gameVersionCount,
      }
    )

    return response;
  };


  // Update player entities directly from client request
  // like - runItTwice
  async setPlayerValueOnTable(msg: any, session: any): Promise<any> {
    this.sessionHandler.recordLastActivityTime({ session, msg });

    const validated = await validateKeySets("Request", "connector", "setPlayerValueOnTable", msg);
    if (!validated.success) {
      return validated;
    }

    const settings: any = {};
    settings["settings." + msg.key] = msg.value;

    try {
      await this.imdb.updateTableSetting(
        { channelId: msg.channelId, playerId: msg.playerId },
        { $set: settings }
      );

      this.activity.updateTableSettings(
        msg,
        stateOfX.profile.category.game,
        stateOfX.game.subCategory.updateTableSettings,
        stateOfX.logType.success,
        session.settings.playerName
      );

      const response = await this.app.rpc.database.requestRemote.setPlayerValueOnTable(
        session,
        {
          channelId: msg.channelId,
          playerId: msg.playerId,
          key: msg.key,
          value: msg.value,
        }
      )

      return response;

    } catch (err) {
      return { success: false, error: err };
    }
  };


  // Get Blind Structure
  // tournament
  async getBlindAndPrize(msg: any, session: any): Promise<any> {
    this.sessionHandler.recordLastActivityTime({ session, msg });

    const validated = await validateKeySets("Request", "connector", "getBlindAndPrize", msg);
    if (!validated.success) {
      return validated;
    }

    const response = await this.app.rpc.database.tournament.getBlindAndPrize(
      session,
      {
        blindRule: msg.blindRule,
        gameVersionCount: msg.gameVersionCount,
        prizeRule: msg.prizeRule,
      }
    );

    return response;
  };


  // tournament
  async getBlindAndPrizeForNormalTournament(msg: any, session: any): Promise<any> {
    this.sessionHandler.recordLastActivityTime({ session, msg });

    const validated = await validateKeySets("Request", "connector", "getBlindAndPrizeForNormalTournament", msg);
    if (!validated.success) {
      return validated;
    }

    const response = await this.app.rpc.database.tournament.getBlindAndPrizeForNormalTournament(
      session,
      {
        tournamentId: msg.tournamentId,
        noOfPlayers: msg.noOfPlayers,
      });

    return response;
  };


  // ### Get prize for satellite tournament
  // tournament
  async getBlindAndPrizeForSatelliteTournament(msg: any, session: any): Promise<any> {
    this.sessionHandler.recordLastActivityTime({ session, msg });

    const validated = await validateKeySets("Request", "connector", "getBlindAndPrizeForSatelliteTournament", msg);
    if (!validated.success) {
      return validated;
    }

    const response = await this.app.rpc.database.tournament.getBlindAndPrizeForSatelliteTournament(
      session,
      {
        tournamentId: msg.tournamentId,
        noOfPlayers: msg.noOfPlayers,
      });

    return response;
  };


  // Get prize list won by user
  // tournament
  async getPlayerPrize(msg: any, session: any): Promise<any> {
    this.sessionHandler.recordLastActivityTime({ session, msg });

    const validated = await validateKeySets("Request", "connector", "getPlayerPrize", msg);
    if (!validated.success) {
      return validated;
    }

    return await this.app.rpc.database.tournament.getPlayerPrize(session, {
      playerId: msg.playerId,
    });
  }


  // tournament
  async collectPrize(msg: any, session: any): Promise<any> {
    this.sessionHandler.recordLastActivityTime({ session, msg });

    const validated = await validateKeySets("Request", "connector", "collectPrize", msg);
    if (!validated.success) {
      return validated;
    }

    return await this.app.rpc.database.tournament.collectPrize(session, {
      playerId: msg.playerId,
      gameVersionCount: msg.gameVersionCount,
      tournamentId: msg.tournamentId,
    });
  }



  // save player notes for other players
  // independent of table
  //{playerId : "String" ,forPlayerId : "String" ,notes: "String", color: "Object"}
  async createNotes(msg: any, session: any): Promise<any> {
    this.sessionHandler.recordLastActivityTime({ session, msg });

    const validated = await validateKeySets("Request", "connector", "createNotes", msg);
    if (!validated.success) {
      return validated;
    }

    return await this.app.rpc.database.playerNotes.createNotes(session, msg);
  }

  // update player notes for other players
  async updateNotes(msg: any, session: any): Promise<any> {
    this.sessionHandler.recordLastActivityTime({ session, msg });

    const validated = await validateKeySets("Request", "connector", "updateNotes", msg);
    if (!validated.success) {
      return validated;
    }

    return await this.app.rpc.database.playerNotes.updateNotes(session, msg);
  }


  // delete player notes
  async deleteNotes(msg: any, session: any): Promise<any> {
    this.sessionHandler.recordLastActivityTime({ session, msg });

    const validated = await validateKeySets("Request", "connector", "deleteNotes", msg);
    if (!validated.success) {
      return validated;
    }

    return await this.app.rpc.database.playerNotes.deleteNotes(session, msg);
  }

  // fetch player's notes for other players sitting in the room
  async getNotes(msg: any, session: any): Promise<any> {
    this.sessionHandler.recordLastActivityTime({ session, msg });

    const validated = await validateKeySets("Request", "connector", "getNotes", msg);
    if (!validated.success) {
      return validated;
    }

    return await this.app.rpc.database.playerNotes.getNotes(session, msg);
  }

  ///////////////////////////////////////////////////////////////
  // Quick seat in sitNGo                                      //
  //{gameVariation, buyIn, turnTime, maxPlayersForTournament } //
  ///////////////////////////////////////////////////////////////
  // tournament
  async quickSeatInSitNGo(msg: any, session: any): Promise<any> {
    this.sessionHandler.recordLastActivityTime({ session, msg });

    const validated = await validateKeySets("Request", "connector", "quickSeatInSitNGo", msg);
    if (!validated.success) {
      return validated;
    }

    return await this.app.rpc.database.quickSeat.quickSeatInSitNGo(session, msg);
  }


  // fetch hand history - from hand tab
  // msg contains handHistoryId i.e. unique to every game as well as roundId
  async getHandHistory(msg: any, session: any): Promise<any> {
    this.sessionHandler.recordLastActivityTime({ session, msg });

    const validated = await validateKeySets("Request", "connector", "getHandHistory", msg);
    if (!validated.success) {
      return validated;
    }

    try {
      const handHistoryResponse = await this.db.getHandHistory(msg.handHistoryId);
      return {
        success: true,
        handHistory: handHistoryResponse,
        channelId: msg.channelId
      };
    } catch (err) {
      return {
        ...err,
        channelId: msg.channelId
      };
    }
  }


  //////////////////////////////////////////////////////////////////////
  // Get hand tab details for hand history, video and community cards //
  //////////////////////////////////////////////////////////////////////
  async getHandTab(msg: any, session: any): Promise<any> {
    this.sessionHandler.recordLastActivityTime({ session, msg });

    const validated = await validateKeySets("Request", "connector", "getHandTab", msg);
    if (!validated.success) {
      return validated;
    }

    try {
      const handTabResponse = await this.db.getHandTab(msg.channelId);
      return {
        success: true,
        handHistory: handTabResponse.reverse(),
        channelId: msg.channelId
      };
    } catch (err) {
      return {
        ...err,
        channelId: msg.channelId
      };
    }
  }

  // Quick seat in tournament
  //{gameVariation, buyIn, tournamentType, tournamentStartTime }
  //tournament
  async quickSeatInTournament(msg: any, session: any): Promise<any> {
    this.sessionHandler.recordLastActivityTime({ session, msg });

    const validated = await validateKeySets("Request", "connector", "quickSeatInTournament", msg);
    if (!validated.success) {
      return validated;
    }

    return await this.app.rpc.database.quickSeat.quickSeatInTournament(session, msg);
  }


  // getOnlinePlayer - API for first time use to fetch count of online players
  async getOnlinePlayer(msg: any, session: any): Promise<any> {
    this.sessionHandler.recordLastActivityTime({ session, msg });

    return await this.onlinePlayers.getOnlinePlayer({ self: this });
  }


  //////////////////////////////////////////////////////////
  // ### Send broadcast to any player from client request //
  // > Dashboard data change for player                   //
  //////////////////////////////////////////////////////////

  // this API is used by dashboard
  async broadcastPlayer(msg: any, session: any): Promise<any> {
    const validated = await validateKeySets("Request", "connector", "broadcastPlayer", msg);
    if (!validated.success) {
      return validated;
    }

    const sessionOnCurrServer = this.app.get('sessionService').getByUid(msg.playerId);
    if (sessionOnCurrServer || !sessionOnCurrServer) {
      this.broadcastHandler.sendMessageToUser({
        self: this,
        msg: msg.data,
        playerId: msg.playerId,
        route: msg.route
      });
    } else {
      await this.app.rpc.connector.sessionRemote.broadcastPlayer(
        { frontendId: 'connector-server-1' },
        msg
      );
    }

    return { success: true };
  }

  //////////////////////////////////////////////////
  // Broadcast on channel level at client request //
  // > Used for show/hide cards on winning        //
  //////////////////////////////////////////////////
  // deprecated
  async channelBroadcastto(msg: any, session: any): Promise<any> {
    msg = msg.__route__ ? _.omit(msg, "__route__") : msg;

    const validated = await validateKeySets("Request", "connector", "channelBroadcast", msg);
    if (!validated.success) {
      return validated;
    }

    let channel = this.app.get('channelService').getChannel(msg.channelId, false);
    if (!channel) {
      channel = this.app.get('channelService').getChannel(msg.channelId, true);
    }

    msg.data.route = msg.route;
    msg.data.channelId = msg.channelId;

    this.broadcastHandler.fireChannelBroadcast({
      channel,
      data: msg.data,
      route: msg.route
    });

    return {
      success: true,
      channelId: msg.channelId
    };
  }


  /////////////////////////////
  // Rebuy in tournament     //
  //{playerId, tournamentId} //
  /////////////////////////////
  async rebuyInTournament(msg: any, session: any): Promise<any> {
    this.sessionHandler.recordLastActivityTime({ session, msg });

    msg.session = session;
    msg.self = this;

    const validated = await validateKeySets("Request", "connector", "rebuyInTournament", msg);
    if (!validated.success) {
      return validated;
    }

    return await this.rebuyHandler.rebuy(msg);
  }


  /////////////////////////////
  // Addon in tournament     //
  //{playerId, tournamentId, channelId} //
  /////////////////////////////
  async addOnData(msg: any, session: any): Promise<any> {
    const validated = await validateKeySets("Request", "connector", "addOnData", msg);
    if (!validated.success) {
      return validated;
    }

    const result = await this.db.getTournamentRoom(msg.tournamentId);
    if (!result) {
      return {
        success: false,
        isRetry: false,
        isDisplay: true,
        channelId: "",
        info: popupTextManager.dbQyeryInfo.DBGETTOURNAMENTROOMFAIL_REBUYHANDLER
      };
    }

    const user = await this.db.getCustomUser(msg.playerId, { isOrganic: 1, points: 1 });
    if (user) {
      return {
        success: true,
        userChips: user.isOrganic ? user.realChips : user.touneyChips,
        addOnChips: 1000,
        addOnAmount: 500
      };
    }

    return {
      success: false,
      isRetry: false,
      isDisplay: false,
      channelId: "",
      info: popupTextManager.dbQyeryInfo.DBFINDTOURNAMENTUSERFAIL_REBUYHANDLER
    };
  }


  async reBuyData(msg: any, session: any): Promise<any> {
    const validated = await validateKeySets("Request", "connector", "reBuyData", msg);
    if (!validated.success) {
      return validated;
    }

    const result = await this.db.getTournamentRoom(msg.tournamentId);
    if (!result) {
      return {
        success: false,
        isRetry: false,
        isDisplay: true,
        channelId: "",
        info: popupTextManager.dbQyeryInfo.DBGETTOURNAMENTROOMFAIL_REBUYHANDLER
      };
    }

    const user = await this.db.getCustomUser(msg.playerId, { isOrganic: 1, points: 1 });
    if (!user) {
      return {
        success: false,
        isRetry: false,
        isDisplay: false,
        channelId: "",
        info: popupTextManager.dbQyeryInfo.DBFINDTOURNAMENTUSERFAIL_REBUYHANDLER
      };
    }

    const userTicket = await this.db.getUserTicket({
      playerId: msg.playerId,
      tournamentId: msg.tournamentId,
      status: 0
    });

    return {
      success: true,
      userChips: user.isOrganic ? user.realChips : user.touneyChips,
      entryFees: result.entryFees,
      houseFees: result.houseFees,
      ticket: userTicket ? 1 : 0,
      delay: systemConfig.delayForRebuyPlayer
    };
  }


  async addOnInTournament(msg: any, session: any): Promise<any> {
    msg.session = session;
    msg.self = this;

    const validated = await validateKeySets("Request", "connector", "rebuyInTournament", msg);
    if (!validated.success) {
      return validated;
    }

    return await this.addOnHandler.addOn(msg);
  }

  /////////////////////////////
  // update auto rebuy in tournament     //
  //{playerId, channelId, isAutoRebuy} //
  /////////////////////////////
  async updateAutoRebuy(msg: any, session: any): Promise<any> {
    this.sessionHandler.recordLastActivityTime({ session, msg });

    msg.session = session;
    msg.self = this;

    const validated = await validateKeySets("Request", "connector", "updateAutoRebuy", msg);
    if (!validated.success) {
      return validated;
    }

    const updateAutoRebuyResponse = await this.rebuyHandler.updateAutoRebuy(msg);
    return updateAutoRebuyResponse;
  }


  ///////////////////////////
  //update auto rebuy in tournament     //
  //{playerId, channelId, isAutoAddOn} //
  ///////////////////////////
  async updateAutoAddon(msg: any, session: any): Promise<any> {
    this.sessionHandler.recordLastActivityTime({ session, msg });

    msg.session = session;
    msg.self = this;

    const validated = await validateKeySets("Request", "connector", "updateAutoAddon", msg);
    if (!validated.success) {
      return validated;
    }

    const updateAutoAddonResponse = await this.addOnHandler.updateAutoAddon(msg);
    return updateAutoAddonResponse;
  }



  /////////////////////////////////////////
  // ### Log out player from the game:   //
  // - Remove from all tables and        //
  // - kill player's session from pomelo //
  // Request: {playerId: }               //
  /////////////////////////////////////////

  async logout(msg: any, session: any): Promise<any> {
    msg.session = session;
    msg.self = this;

    const validated = await validateKeySets("Request", "connector", "logout", msg);
    if (!validated.success) {
      return validated;
    }

    const logoutResponse = await this.logoutHandler.logout(msg);
    await this.onlinePlayers.processOnlinePlayers({ self: this });

    return logoutResponse;
  }

  // leave tournament
  // Request: {playerId: , channelId: }
  // Response: {success: , playerId: , channelId: }
  async leaveTournament(msg: any, session: any): Promise<any> {
    this.sessionHandler.recordLastActivityTime({ session, msg });
    msg.self = this;

    const validated = await validateKeySets("Request", "connector", "leaveTournament", msg);
    if (!validated.success) {
      return validated;
    }

    const leaveResponse = await this.tournamentLeaveHandler.leaveProcess(msg);
    return leaveResponse;
  }


  // API - for cashier button from game lobby
  // fetch various details about player's account details
  async getCashDetails(msg: any, session: any): Promise<any> {
    const response = await this.app.rpc.database.userRemote.getCashDetails(session, { playerId: msg.playerId });

    if (!response.success) {
      return response;
    }

    const channels = session.get('channels');
    const res = await this.app.rpc.database.tableRemote.getTotalGameChips(session, { playerId: msg.playerId, channels });

    response.result.inGameRealChips = (res?.realChips || 0);
    response.result.totalRealChips = response.result.inGameRealChips + response.result.realChips;

    response.result.inGameFreeChips = (res?.playChips || 0);
    response.result.totalFreeChips = response.result.inGameFreeChips + response.result.freeChips;

    return response;
  }


  // API - for cashier button from game lobby
  async getUcbHistory(msg: any, session: any): Promise<any> {
    const response = await this.app.rpc.database.userRemote.getUCBDetails(session, { playerId: msg.playerId });
    return response;
  }

  // API - for cashier button from game lobby
  async getLoyaltyPointHistory(msg: any, session: any): Promise<any> {

    const response = await this.app.rpc.database.userRemote.getRakeBackDetails(session, { playerId: msg.playerId });
    return response;
  }


  // API - for cashier button from game lobby
  async getRabbitHistory(msg: any, session: any): Promise<any> {
    const response = await this.app.rpc.database.userRemote.getRabbitDetails(session, { playerId: msg.playerId });
    return response;
  }

  // API - for subscription History button from game lobby
  async getSubscriptionHistory(msg: any, session: any): Promise<any> {
    const res = await this.db.fetchSubscription({ playerId: msg.playerId, status: true });

    if (!res || !res.length) {
      return { success: false, info: 'No subscription history found!', isDisplay: true, isRetry: false };
    }

    return { success: true, data: res[0] };
  }


  // API - for subscription Purchase History button from game lobby
  async getPurchaseHistory(msg: any, session: any): Promise<any> {
    const res = await this.db.fetchSubscription({ playerId: msg.playerId });

    if (!res || !res.length) {
      return { success: false, info: 'No subscription history found!', isDisplay: true, isRetry: false };
    }

    return { success: true, data: res };
  }

  // API - for EV history button from game lobby
  async getEVHistory(msg: any, session: any): Promise<any> {
    this.sessionHandler.recordLastActivityTime({ session, msg });

    const validated = await validateKeySets("Request", "connector", "getEVHistory", msg);
    if (!validated.success) {
      return validated;
    }

    const evHistory = await this.db.findEVHistory({ playerId: msg.playerId });

    if (!evHistory || !evHistory.length) {
      return { success: false, info: 'No EV History found!', isDisplay: true, isRetry: false };
    }

    return { success: true, evHistory };
  }


  // API - used in website, called via dashboard
  // fetch bonus data details for player
  async getBonusHistory(msg: any, session: any): Promise<any> {
    const user = await this.db.findBounsData({ playerId: msg.playerId });

    if (!user) {
      return { success: false, info: 'db query failed' };
    }

    return { success: true, result: user.bonus };
  }


  // drops a mail to support staff - at systemConfig.feedbackMail
  // used from feedback inside game - option near by dealer chat
  async feedback(msg: any, session: any): Promise<any> {
    const mailPayload = Object.assign(
      {},
      msg?.data ? { data: msg.data } : {},
      msg?.issue ? { issue: msg.issue } : {},
      { playerId: msg.playerId, timestamp: new Date() }
    );
    this.app.get('devMailer').sendToAdmin(
      mailPayload,
      systemConfig.feedbackMail || systemConfig.from_email,
      'Feedback from user'
    );
    return { success: true, info: 'feedback received succefully.' };
  }


  // ### Set table level settings by players
  // > Get key: value from client and save in settings.key: value
  // > in spectator collection of inMemory databse
  // > response true/false to client as response
  async updateTableSettings(msg: any, session: any): Promise<any> {
    this.sessionHandler.recordLastActivityTime({ session, msg });

    const settings = {};
    settings["settings." + msg.key] = msg.value;

    const result = await this.imdb.updateTableSetting(
      { channelId: msg.channelId, playerId: msg.playerId },
      { $set: settings }
    );

    if (!result) {
      return {
        success: false,
        info: popupTextManager.dbQyeryInfo.DB_PLAYER_TABLESETTING_UPDATE_FAIL,
        isRetry: false,
        isDisplay: false,
        channelId: msg.channelId || ""
      };
    }

    if (msg.key === 'tableColor') {
      await this.updateProfile({ query: { playerId: msg.playerId }, updateKeys: { 'settings.tableColor': msg.value } }, session);
    }
    if (msg.key === 'tableBackground') {
      await this.updateProfile({ query: { playerId: msg.playerId }, updateKeys: { 'settings.tableBackground': msg.value } }, session);
    }

    this.activity.updateTableSettings(
      msg,
      stateOfX.profile.category.game,
      stateOfX.game.subCategory.updateTableSettings,
      stateOfX.logType.success,
      session.settings.playerName
    );

    return { success: true, channelId: msg.channelId };
  }

  // cashout request by player from game build
  // msg contains playerId, realChips
  async cashOutForPlayerAffilate(msg: any, session: any): Promise<any> {
    this.sessionHandler.recordLastActivityTime({ session, msg });

    const validated = await validateKeySets("Request", "connector", "cashOutForPlayerAffilate", msg);
    if (!validated.success) return validated;

    const res = await this.app.rpc.database.cashOutForPlayer.processCashout(session, msg);

    await this.commonHandler.sendCashoutSms({
      userName: res.affUsername,
      mobileNumber: res.affMobileNo,
      cashOutAmount: res.cashOutAmount
    });

    return { success: res.success, info: res.info, isRetry: false, isDisplay: true };
  }



  async gameResultUpdate(msg: any, session: any): Promise<any> {
    const channelId = msg.channel;
    const tableData = await this.imdb.getTable(channelId);

    const broadData = { players: [] as any[] };

    if (!tableData) {
      return { success: 'success', data: 'no table' };
    }

    const boardCards = tableData.deck.slice(0, 5);
    const playerdata = { players: [] as any[] };

    tableData.players.forEach(players => {
      const player: any = {};
      const bestHandForPlayer = winnerMgmt.findCardsConfiguration(
        { boardCards, playerCards: [{ playerId: players.playerId, cards: players.cards }] },
        tableData.channelVariation
      );

      player.name = players.playerName;
      let bestHandText = "";

      if (!!bestHandForPlayer && tableData.channelVariation !== stateOfX.channelVariation.omahahilo) {
        bestHandText = bestHandForPlayer[0].text;
      } else {
        if (!!bestHandForPlayer?.[0]?.winnerHigh?.length) {
          bestHandText += " " + bestHandForPlayer[0].winnerHigh[0].text;
        }
        if (!!bestHandForPlayer?.[0]?.winnerLo?.length) {
          bestHandText += "\n " + bestHandForPlayer[0].winnerLo[0].set.map((card: any) => card.name).join(', ');
        }
      }

      player.bestHands = bestHandText;
      playerdata.players.push(player);
    });

    return { success: 'success', data: playerdata.players };
  }

  async playerGameList(msg, session, next) {
    this.sessionHandler.recordLastActivityTime({ session: session, msg: msg });

    const response = {
      success: false,
      data: {},
      errMsg: ''
    };

    if (!msg.playerId) {
      response.errMsg = "Player Id Missing";
      next(null, response);
      return;
    }

    const query: any = {
      playerId: msg.playerId,
      handId: msg.handId || '',
      date: msg.date || '',
      time: msg.time || '',
      dateStr: ''
    };

    if (query.date !== '') {
      query.dateStr = new Date(`${query.date} ${query.time}`).getTime();
      query.dateStrEnd = query.dateStr + 1000 * 60 * 30;
    }

    try {
      const result = await this.getPlayerGames(query);
      const handsData: any[] = [];

      for (const player of result) {
        const handsArr = player.rawResponse.params.table;
        handsArr.roundId = player.roundId;
        handsArr.gameStartTime = new Date(handsArr.gameStartTime + 330 * 60 * 1000).toLocaleDateString(undefined, {
          day: 'numeric',
          month: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
        handsData.push(handsArr);
      }

      response.success = true;
      response.data = handsData;
      next(null, response);
    } catch (err) {
      response.success = false;
      response.errMsg = err;
      next(null, response);
    }
  };

  async getVideo(params: any): Promise<any> {
    const video = await this.db.findVideoById(params.videoId);
    if (!video) {
      throw {
        success: false,
        info: popupTextManager.dbQyeryInfo.DB_NOVIDEOEXISTS,
        isDisplay: false,
        isRetry: false,
        channelId: ""
      };
    }
    params.video = video;
    return params;
  };



  // async getHandHistory(params: any): Promise<any> {
  //   const res = await this.db.getHandHistoryByVideoId(params.videoId);
  //   if (!res) {
  //     throw {
  //       success: false,
  //       info: popupTextManager.dbQyeryInfo.DB_GETHISTORYBYVIDEO_FAIL,
  //       isDisplay: false,
  //       isRetry: false,
  //       channelId: ""
  //     };
  //   }
  //   params.handHistoryId = res.handHistoryId;
  //   params.handId = res.handId;
  //   return params;
  // };





  async generateResponse(params: any): Promise<any> {
    const firstCreation = params.video.createdAt;
    const response: any = {
      success: true,
      handHistoryId: params.handHistoryId,
      gamePlayers: _.where(params.video.history, { type: "gamePlayers" })[0].data,
      joinResponse: _.where(params.video.history, { type: "joinResponse" })[0].data,
      roundId: params.video.roundId,
      handId: params.handId,
      broadcasts: [],
      responses: [],
      duration: 0
    };

    response.joinResponse.playerId = params.playerId;
    response.joinResponse.playerName = params.playerName;

    const broadCastType = _.where(params.video.history, { type: "broadcast" });
    const responseType = _.where(params.video.history, { type: "response" });

    for (const item of broadCastType) {
      const timeStamp = (item.createdAt - firstCreation) / 1000;
      if (["preCheck", "bestHands", "playerCards"].includes(item.data.route)) {
        if (params.playerId === item.data.playerId) {
          response.broadcasts.push({ timestamp: timeStamp, data: item.data });
        }
      } else {
        response.broadcasts.push({ timestamp: timeStamp, data: item.data });
      }
      if (item.data.route === "gameOver") {
        response.duration = timeStamp;
      }
    }

    for (const item of responseType) {
      const responseTimeStamp = (item.createdAt - firstCreation) / 1000;
      response.responses.push({ timestamp: responseTimeStamp, data: item.data });
    }

    params.response = response;
    return response;
  };


  async getVideoData(msg, session, next) {
    const response = {
      success: false,
      data: {},
      errMsg: ''
    };

    if (!msg.roundId) {
      response.errMsg = "Round Id Missing";
      return next(null, response);
    }

    const query = { roundId: msg.roundId };

    try {
      const result = await this.db.getRoundVideoData(query);

      const params: any = {
        videoId: String(result._id),
        playerId: msg.playerId,
        playerName: msg.playerName
      };

      const videoParams = await this.getVideo(params);
      const handHistoryParams = await this.getHandHistory(videoParams);
      const finalResponse = await this.generateResponse(handHistoryParams);

      response.success = true;
      response.data = finalResponse;
      return next(null, finalResponse);
    } catch (err) {
      response.success = false;
      response.errMsg = (err as Error).message;
      return next(null, response);
    }
  };

  //check playerSession
  async checkPlayerSession(msg, session, next) {
    const sessionExist = await this.app.rpc.connector.entryRemote.getUserSession(session, msg);

    if (sessionExist.success) {
      next(null, { success: true });
    } else {
      next(null, { success: false });
    }
  };

  //get my topup
  async getPlayerTopup(msg, session, next) {
    const response = await this.topupHandler.handle(msg);

    if (response.success) {
      next(null, {
        success: true,
        channelId: msg.channelId,
        data: response.topUp,
        updated: response.updated,
        heading: "Points Transfer",
        info: response.amount + " Points added your account. Good Luck"
      });
    } else {
      next(null, {
        success: false,
        channelId: msg.channelId,
        heading: "Points Transfer",
        info: response.info
      });
    }
  };

  //for promotional data
  async promotionalData(msg: any, session: any): Promise<any> {
    const data = await this.contest.pullData();

    const getMyRankData = _.where(data.players, { playerId: msg.playerId });

    let myCurrentRank: string | number = 'NA';
    let myCurrentHands = 0;
    if (getMyRankData && getMyRankData.length > 0) {
      myCurrentRank = getMyRankData[0].rank;
      myCurrentHands = getMyRankData[0].numberOfHands;
    }

    const playerData = {
      rank: myCurrentRank,
      numberOfHands: myCurrentHands,
    };

    data.myRank = playerData;
    data.headerText = { rank: "Rank", Players: "Players", Hands: "Hands" };

    const maxLength = Math.min(data.players.length, 10);
    const getTopPlayers = [];

    for (let i = 0; i < maxLength; i++) {
      const element = data.players[i];
      getTopPlayers.push(element);
    }

    data.players = getTopPlayers;

    return { success: true, data };
  }


  async getLeaderboardData(msg: any, session: any): Promise<any> {
    const response = await this.promotionalDataHandler.getLeaderboardData(msg);
    return { success: true, data: response };
  }

  async cashOutHandlerFromApp(msg: any, session: any): Promise<any> {
    const response = await this.cashOutHandler.cashOutFromApp(msg);
    return response;
  }

  async bonusCode(msg: any, session: any): Promise<{ success: boolean; data: any }> {
    const response = await this.bonusCodeHandler.listBonusCode(msg);
    if (response) {
      return { success: true, data: response };
    } else {
      return { success: false, data: "Bonus Codes Are Not Avilable" };
    }
  }

  async panCardHandler(msg: any, session: any): Promise<any> {
    const response = await this.panCardController.panCardInsertAndUpdate(msg);
    return { success: true, data: response };
  }

  async bankDetailsFromApp(msg: any, session: any): Promise<{ success: boolean; data: string }> {
    delete msg.isLoggedIn;
    delete msg.__route__;

    const response = await this.db.saveBankDetailsuser({ playerId: msg.playerId }, msg);
    return { success: true, data: "Bank Details Submitted Successfully." };
  }

  async spinTheWheel(msg: any, session: any): Promise<{ success: boolean; data?: any; info?: string }> {
    const result = await this.db.findUser({ playerId: msg.playerId });

    if ('spinActivate' in result) {
      const currentTime = Date.now();
      if (currentTime < result.spinActivate) {
        const time = this.milliToTime.convert(result.spinActivate - currentTime);
        return {
          success: false,
          info: " Oops !! Seems like you've already played today. Come back in " + time + "to play again !!"
        };
      }
    }

    return {
      success: true,
      data: {
        spinTheWheelPrize: systemConfig.spinTheWheelPrize,
        poolPrizeForDay: systemConfig.poolPrizeForDay
      }
    };
  }

  async getSpinIndex(msg: any, session: any): Promise<{ success: boolean; data: any }> {
    delete msg.__route__;
    delete msg.isLoggedIn;

    const response = await this.spinTheWheelHandler.spin(msg);

    const spinActivate = Date.now() + systemConfig.spinTime;
    await this.db.updatePlayerById(msg, { spinActivate });

    return { success: true, data: response };
  }














}