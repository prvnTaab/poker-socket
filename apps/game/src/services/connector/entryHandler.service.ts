import { Injectable } from "@nestjs/common";
import { ActivityService } from "shared/common/activity/activity.service";
import { ImdbDatabaseService } from "shared/common/datebase/Imdbdatabase.service";
import { PokerDatabaseService } from "shared/common/datebase/pokerdatabase.service";



import _ from 'underscore';







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
export class EntryHandlerService  {



    constructor(
        private readonly db:PokerDatabaseService,
        private readonly imdb:ImdbDatabaseService,
        private readonly activity:ActivityService,
        private readonly broadcastHandler:BroadcastHandlerService,
        private readonly sessionHandler:SessionHandlerService,
        private readonly updateProfileHandler:UpdateProfileHandlerService,
        private readonly logoutHandler:LogoutHandlerService,
        private readonly retryHandler:RetryHandlerService,
        private readonly rebuyHandler:RebuyHandlerService,
        private readonly addOnHandler:AddOnHandlerService,
        private readonly getFiltersFromDb:GetFiltersFromDbService,
        private readonly onlinePlayers:OnlinePlayersService,
        private readonly disconnectionHandler:DisconnectionHandlerService,
        private readonly commonHandler:CommonHandlerService,
        private readonly tournamentLeaveHandler:TournamentLeaveHandlerService,
        private readonly topupHandler:TopupHandlerService,
        private readonly promotionalDataHandler:PromotionalDataHandlerService,
        private readonly cashOutHandler:CashOutHandlerService,
        private readonly panCardController:PanCardControllerService,
        private readonly spinTheWheelHandler:SpinTheWheelHandlerService,
        private readonly bonusCodeHandler:BonusCodeHandlerService
    ) {}








// var Handler = function (app) {
//   this.app = app;
//   this.registerCounter = null;
// };

// module.exports = function (app) {
//   return new Handler(app);
// };

// var handler = Handler.prototype;
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

onUserLeave(self: any, session: any): void {
  console.log("onUserLeave", self.session.settings.playerId);

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
var bindUserSession = function (msg, cb) {
  //set user as loggedout
  
  keyValidator.validateKeySets("Request", msg.self.app.serverType, "bindUserSession", msg, function (validated) {
    if (validated.success) {
      var session = msg.session;
      session.bind(msg.playerId);
      session.on('closed', onUserLeave.bind(null, msg.self));
      // Set all session values
      session.push("waitingChannels", function (err) {
        if (err) {
          serverLog(stateOfX.serverLogType.error, 'set waitingChannels for session service failed! error is : %j', err.stack);
          cb({ success: false });
          return false;
        }
      });
      session.set("playerId", msg.playerId);
      var clientAddress = msg.self.app.get('sessionService').getClientAddressBySessionId(session.id);
      // { ip: '::ffff:127.0.0.17', port: 56844 } clientAddress - in this format
      session.set("networkIp", clientAddress.ip);
      session.push("networkIp", function (err) {
        if (err) {
          serverLog(stateOfX.serverLogType.error, 'set networkIp for session service failed! error is : %j', err.stack);
          cb({ success: false });
          return false;
        }
      });
      console.log('bindUserSession', session.get("networkIp"));
      session.push("playerId", function (err) {
        if (err) {
          serverLog(stateOfX.serverLogType.error, 'set playerId for session service failed! error is : %j', err.stack);
          cb({ success: false });
          return false;
        }
      });
      session.set("channels", []);
      session.push("channels", function (err) {
        if (err) {EntryHandlerService
          serverLog(stateOfX.serverLogType.error, 'set channels for session service failed! error is : %j', err.stack);
          cb({ success: false });
          return false;
        }
      });
      session.set("playerName", msg.playerName);
      session.push("playerName", function (err) {
        if (err) {
          serverLog(stateOfX.serverLogType.error, 'set playerName for session service failed! error is : %j', err.stack);
          cb({ success: false });
          return false;
        }
      });
      session.set("deviceType", msg.deviceType || 'cell');
      session.push("deviceType", function (err) {
        if (err) {
          serverLog(stateOfX.serverLogType.error, 'set deviceType for session service failed! error is : %j', err.stack);
          cb({ success: false });
          return false;
        }
      });
      session.set("lastActiveTime", Number(new Date()));
      session.push("lastActiveTime", function (err) {
        if (err) {
          serverLog(stateOfX.serverLogType.error, 'set lastActiveTime for session service failed! error is : %j', err.stack);
          cb({ success: false });
          return false;
        }
      });
      onlinePlayers.processOnlinePlayers({ self: msg.self });
      // cb({success: true, info: "Session has been binded and session values has been also set."});
      cb({ success: true, info: configMsg.BINDUSERSESSION_TRUE_ENTRYHANDLER, isRetry: false, isDisplay: false, channelId: "" });
    } else {
      cb(validated);
    }
  })
}

// ### validate tournament whether it is ready to start of not

var validateTournamentStart = function (params, cb) {
  serverLog(stateOfX.serverLogType.info, "in validate start tournament");
  keyValidator.validateKeySets("Request", params.serverType, "validateTournamentStart", params, function (validated) {
    if (validated.success) {
      var tournamentId = params.tournamentId;
      db.getTournamentRoom(tournamentId, function (err, tournamentRoom) {
        if (err) {
          serverLog(stateOfX.serverLogType.info, "error in getting tournament room");
          serverLog(stateOfX.serverLogType.info, err);
          cb({ success: false });
        } else {
          if (!!tournamentRoom) {
            serverLog(stateOfX.serverLogType.info, "tournamentRoom is in validate tournament start is - " + JSON.stringify(tournamentRoom));
            var playerRequired = tournamentRoom.maxPlayersForTournament;
            db.countTournamentusers({ tournamentId: tournamentId, status: 'Registered'}, function (err, noOfUsers) {
              if (err) {
                serverLog(stateOfX.serverLogType.info + "error in getting count of toirnament user")
                serverLog(stateOfX.serverLogType.info + err);
                cb({ success: false });
              } else {
                serverLog(stateOfX.serverLogType.info, "noOfUsers and playerRequired are - " + noOfUsers + playerRequired);
                if (noOfUsers === playerRequired) {
                  serverLog(stateOfX.serverLogType.info, "tournament is going to start");
                  params.self.startTournament({ tournamentId: tournamentId}, "session", function () {
                    //needs to be complete this part;
                    // chnage the state of tournament room to RUNNING
                    // serverLog(stateOfX.serverLogType.info, "tournamentRoom._id,stateOfX.tournamentState.running ----",tournamentRoom._id,stateOfX.tournamentState.running);
                    // changeStateOfTournament(tournamentRoom._id,stateOfX.tournamentState.running);
                    cb({ success: true, result: { tournamentId: tournamentRoom._id } });
                  });
                } else {
                  serverLog(stateOfX.serverLogType.info, "tournament not eligible to start");
                  serverLog(stateOfX.serverLogType.info, "in validateTournamentStart")
                  cb({ success: false });
                }
              }
            });
          } else {
            serverLog(stateOfX.serverLogType.info, "this is not a tournament room");
            serverLog(stateOfX.serverLogType.info, "in validateTournamentStart")
            cb({ success: false });
          }
        }
      });
    } else {
      serverLog(stateOfX.serverLogType.info, "more key required in validateTournamentStart");
      serverLog(stateOfX.serverLogType.info, "in validateTournamentStart")
      cb({ success: false });
    }
  })
}

// ### <<<<<<<<<<<<<<<<<<< INTERNAL FUNCTIONS FINISHED >>>>>>>>>>>>>>>>>>>>>>

// <<<<<<<<<<<<<<<<<<<<<<<< HANDLER REQUEST FROM CLIENT >>>>>>>>>>>>>>>>>>>>>

// ### Test function to destroy channel
// deprecated here
handler.killChannel = function (msg, session, next) {
  sessionHandler.recordLastActivityTime({ session: session, msg: msg });
  serverLog(stateOfX.serverLogType.request, JSON.stringify(msg));
  var self = this,
    channel = self.app.get('channelService').getChannel(msg.channelId, false);
  if (channel) {
    channel.destroy();
    var success = { success: true };
    serverLog(stateOfX.serverLogType.response, JSON.stringify(success));
    next(null, success);
  } else {
    // var fail = {success: false, info: "Chennl not found!"};
    var fail = { success: false, info: configMsg.KILLCHANNELFAIL_ENTRYHANDLER, isRetry: false, isDisplay: false, channelId: "" };
    serverLog(stateOfX.serverLogType.response, JSON.stringify(fail));
    next(null, fail);
  }
};

// ### Create session for this player with server ###
// kill old session if found
// find player's joined channels - return array of object containing channelId
handler.enter = function (msg, session, next) {
  // console.log("printing client info", session.__session__.__socket__.socket.upgradeReq.headers["user-agent"]);
  if (!msg.isRequestedBySocket) {
    broadcastHandler.userLoggedIn({ playerId: msg.playerId, action: 'pomeloLoggedIn' })
  }
  serverLog(stateOfX.serverLogType.request, JSON.stringify(msg));
  var self = this;
  self.session = session;
  // msg.playerName = !!msg.playerName ? msg.playerName : "Player";
  keyValidator.validateKeySets("Request", "connector", "enter", msg, function (validated) {
    if (validated.success) {
      // get user session
      self.app.rpc.connector.entryRemote.getUserSession(self.session, msg, function (sessionExist) {
        // console.log("Session Exist :",sessionExist);
        // if user session already exist on the server
        if (sessionExist.success) {

          let prevSession = self.app.sessionService.get(sessionExist.sessionId);
          console.log('prevSession', prevSession)
          prevSession.set("isConnected", false); // set isConnected false

          self.session.set("waitingChannels", prevSession.get("waitingChannels"));

          self.app.sessionService.kickBySessionId(sessionExist.sessionId, ('elseWhere-' + ("another device")));

          self.app.rpc.connector.entryRemote.killUserSession(self.session, sessionExist.sessionId, function (killUserSessionResponse) {
            bindUserSession({ playerId: msg.playerId, playerName: msg.playerName, deviceType: msg.deviceType, session: session, self: self }, function (userSession) {
            retryHandler.getJoinedChannles({ playerId: msg.playerId }, function (joinChannelResponse) {
              if (joinChannelResponse.success) {
                var success = { success: userSession.success, joinChannels: joinChannelResponse.joinedChannels };
                serverLog(stateOfX.serverLogType.response, JSON.stringify(success));
                next(null, success);
                if (success.success) {
                  next(null, success);
                }
              } else {
                next(null, { success: false, info: configMsg.GETJOINEDCHANNELSFAIL_ENTRYHANDLER, isRetry: false, isDisplay: true, channelId: "" });
              }
            })
          });
        });
        }
        else { // If player session not exist on the server
          bindUserSession({ playerId: msg.playerId, playerName: msg.playerName, deviceType: msg.deviceType, session: session, self: self }, function (userSession) {
            retryHandler.getJoinedChannles({ playerId: msg.playerId }, function (joinChannelResponse) {
              if (joinChannelResponse.success) {
                // serverLog(stateOfX.serverLogType.request," get user table on resume-----------" + JSON.stringify(msg));
                var success = { success: userSession.success, joinChannels: joinChannelResponse.joinedChannels };
                serverLog(stateOfX.serverLogType.response, JSON.stringify(success));
                next(null, success);
                if (success.success) {
                  next(null, success);
                }
              } else {
                next(null, { success: false, channelId: "", isDisplay: true, isRetry: false, info: configMsg.GETJOINEDCHANNELSFAIL_ENTRYHANDLER });
              }
            })
          });
        }
      })
    } else {
      serverLog(stateOfX.serverLogType.response, JSON.stringify(validated));
      next(null, validated);
    }
  })
};

// this api is to set isconnected true in session for player
// and update player state if needed - to playing
handler.acknowledgeIsConnected = function (msg, session, next) {
  sessionHandler.recordLastActivityTime({ session: session, msg: msg });
  serverLog(stateOfX.serverLogType.request, JSON.stringify(msg));
  var self = this;
  keyValidator.validateKeySets("Request", "connector", "acknowledgeIsConnected", msg, function (validated) {
    if (validated.success) {
      var playerSession = !!self.app.sessionService.getByUid(msg.playerId) ? self.app.sessionService.getByUid(msg.playerId)[0] : null;
      playerSession.set("isConnected", true); // setting is connected true in session.
      if (!!msg.data && !!msg.data.channelId && !!msg.data.setState && !!session.uid) {
        self.app.rpc.database.tableRemote.setPlayerAttrib(session, { playerId: session.uid, channelId: msg.data.channelId, key: "state", value: stateOfX.playerState.playing, ifLastState: stateOfX.playerState.disconnected }, function (setPlayerAttribResponse) {
          if (setPlayerAttribResponse.success) {
            keyValidator.validateKeySets("Response", self.app.serverType, "isConnected", setPlayerAttribResponse, function (validated) {
              if (validated.success) {
                serverLog(stateOfX.serverLogType.response, JSON.stringify(setPlayerAttribResponse));
                next(); // this is a notify
              } else {
                serverLog(stateOfX.serverLogType.response, JSON.stringify(validated));
                next(); // this is a notify
              }
            });
          } else {
            serverLog(stateOfX.serverLogType.response, JSON.stringify(setPlayerAttribResponse));
            next(); // this is a notify
          }
        });
      }

    } else {
      // next(null, validated);
      next(); // this is a notify
    }
  })
}

// ### Single Login
// deprecated
handler.singleLoginDep = function (msg, session, next) {
  sessionHandler.recordLastActivityTime({ session: session, msg: msg });
  serverLog(stateOfX.serverLogType.request, JSON.stringify(msg));
  var self = this;
  keyValidator.validateKeySets("Request", "connector", "singleLogin", msg, function (validated) {
    if (validated.success) {
      self.app.rpc.connector.entryRemote.getUserSession(self.session, msg, function (sessionExist) {
        self.app.rpc.connector.entryRemote.killUserSession(self.session, sessionExist.sessionId, function (killUserSessionResponse) {
          serverLog(stateOfX.serverLogType.request, "kill user session response is - " + JSON.stringify(killUserSessionResponse));
          var params = {
            playerId: msg.playerId,
            session: session,
            self: self
          }
          bindUserSession(params, function (userSession) {
            var success = { success: userSession.success };
            serverLog(stateOfX.serverLogType.response, JSON.stringify(success));
            next(null, success);
          });
        })
      })
    } else {
      serverLog(stateOfX.serverLogType.response, JSON.stringify(validated));
      next(null, validated);
    }
  })
};

// ### Create session with server after disconnection ###
// Currently not killing the session of previous user some problem with session current session killed
// TODO - We have to kill the previous session of user
// deprecated
handler.reconnectDep = function (msg, session, next) {
  sessionHandler.recordLastActivityTime({ session: session, msg: msg });
  serverLog(stateOfX.serverLogType.request, JSON.stringify(msg));
  var self = this,
    playerId = msg.playerId;

  self.app.rpc.connector.entryRemote.getUserSession(session, msg, function (sessionExist) {
    var params;
    if (sessionExist.success) {
      broadcastHandler.sendMessageToUser({ self: self, playerId: playerId, msg: { info: "you are going to be logged out as multiple login detected" }, route: "multipleLogin" });
      params = { playerId: msg.playerId, session: session, self: self };
      sessionHandler.bindUserSession(params, function (userSession) {
        var success = { success: userSession.success }
        serverLog(stateOfX.serverLogType.response, JSON.stringify(success));
        next(null, success);
      });
    } else {
      params = { playerId: msg.playerId, session: session, self: self };
      sessionHandler.bindUserSession(params, function (userSession) {
        var success = { success: userSession.success }
        serverLog(stateOfX.serverLogType.response, JSON.stringify(success));
        next(null, success);
      });
    }
  })
};

// ### Get list of tables
// TODO: Modify as used for test only
handler.getTables = function (msg, session, next) {
  sessionHandler.recordLastActivityTime({ session: session, msg: msg });
  serverLog(stateOfX.serverLogType.request, JSON.stringify(msg));
  db.listTable({}, function (err, result) {
    if (err) {
      // var fail = {success: false, info: "Something went wrong!! unable to get table!"};
      var fail = { success: false, info: dbConfigMsg.DBLISTTABLESFAIL_ENTRYHANDLER, isRetry: false, isDisplay: true, channelId: "" };
      serverLog(stateOfX.serverLogType.response, JSON.stringify(fail));
      next(null, fail);
    } else {
      var success = { success: true, result: result };
      serverLog(stateOfX.serverLogType.response, JSON.stringify(success));
      next(null, success);
    }
  });
};


// ### Client-server acknowledgement handler
// MAJOR doubt
// deprecated
handler.isConnectedDep = function (msg, session, next) {
  sessionHandler.recordLastActivityTime({ session: session, msg: msg });
  serverLog(stateOfX.serverLogType.request, JSON.stringify(msg));
  var self = this;
  keyValidator.validateKeySets("Request", "connector", "isConnected", msg, function (validated) {
    if (validated.success) {
      self.app.rpc.database.tableRemote.setPlayerAttrib(session, { playerId: msg.playerId, channelId: msg.channelId, key: "state", value: stateOfX.playerState.playing }, function (setPlayerAttribResponse) {
        if (setPlayerAttribResponse.success) {
          keyValidator.validateKeySets("Response", self.app.serverType, "isConnected", setPlayerAttribResponse, function (validated) {
            if (validated.success) {
              serverLog(stateOfX.serverLogType.response, JSON.stringify(setPlayerAttribResponse));
              next(null, setPlayerAttribResponse);
            } else {
              serverLog(stateOfX.serverLogType.response, JSON.stringify(validated));
              next(null, validated);
            }
          });
        } else {
          serverLog(stateOfX.serverLogType.response, JSON.stringify(setPlayerAttribResponse));
          next(null, setPlayerAttribResponse);
        }
      });
    } else {
      serverLog(stateOfX.serverLogType.response, JSON.stringify(validated));
      next(null, validated);
    }
  })
};

// ### Update user profile
// Request : query,updateKeys
// Response : {success: true, info: "user successfully updated"}
handler.updateProfile = function (msg, session, next) {
  sessionHandler.recordLastActivityTime({ session: session, msg: msg });
  serverLog(stateOfX.serverLogType.request, JSON.stringify(msg));
  msg.serverType = "connector";
  msg.session = session;
  msg.self = this;
  keyValidator.validateKeySets("Request", "connector", "updateProfile", msg, function (validated) {
    if (validated.success) {
      updateProfileHandler.updateProfile(msg, function (updateProfileResponse) {
        activity.updateProfile(msg, stateOfX.profile.category.profile, stateOfX.profile.subCategory.update, updateProfileResponse, stateOfX.logType.success);
        next(null, updateProfileResponse);
      })
    } else {
      serverLog(stateOfX.serverLogType.response, JSON.stringify(validated));
      activity.updateProfile(msg, stateOfX.profile.category.profile, stateOfX.profile.subCategory.update, validated, stateOfX.logType.error);
      next(null, validated);
    }
  })
}
// ### Update user profile
// Request : query,updateKeys
// Response : {success: true, info: "user successfully updated"}
handler.blockMe = function (msg, session, next) {
  sessionHandler.recordLastActivityTime({ session: session, msg: msg });
  serverLog(stateOfX.serverLogType.request, JSON.stringify(msg));
  msg.serverType = "connector";
  msg.session = session;
  msg.self = this;
  msg.query = {};
  msg.updateKeys = {};
  msg.query.playerId = msg.playerId;
  msg.updateKeys.isBlocked = true;
  msg.updateKeys.reasonForBan = "self deleted account";
  msg.updateKeys.status = "Block";
  console.log('inside block me', msg);
  keyValidator.validateKeySets("Request", "connector", "blockMe", msg, function (validated) {
    if (validated.success) {
      updateProfileHandler.updateProfile(msg, function (updateProfileResponse) {
        activity.updateProfile(msg, stateOfX.profile.category.profile, stateOfX.profile.subCategory.update, updateProfileResponse, stateOfX.logType.success);
        next(null, updateProfileResponse);
      })
    } else {
      serverLog(stateOfX.serverLogType.response, JSON.stringify(validated));
      activity.updateProfile(msg, stateOfX.profile.category.profile, stateOfX.profile.subCategory.update, validated, stateOfX.logType.error);
      next(null, validated);
    }
  })
}
//### Get player profile
// Request : playerId,keys
// Response : user profile with above keys
handler.getProfile = function (msg, session, next) {
  sessionHandler.recordLastActivityTime({ session: session, msg: msg });
  serverLog(stateOfX.serverLogType.request, JSON.stringify(msg));
  keyValidator.validateKeySets("Request", "connector", "getProfile", msg, function (validated) {
    if (validated.success) {
      updateProfileHandler.getProfile(msg, function (getProfileResponse) {
        serverLog(stateOfX.serverLogType.response, JSON.stringify(getProfileResponse));
        next(null, getProfileResponse);
      })
    } else {
      serverLog(stateOfX.serverLogType.response, JSON.stringify(validated));
      next(null, validated);
    }
  })
}

handler.getCashoutDetails = function (msg, sesison, next) {
  cashOutHandler.getCashoutDetails(msg, function (err, response) {
    if (err) {
      next(null, err);
    } else {
      next(null, response)
    }
  })
}

// ### Handle sitout on next big blind option
// feature removed
handler.sitoutNextBigBlind = function (msg, session, next) {
  sessionHandler.recordLastActivityTime({ session: session, msg: msg });
  serverLog(stateOfX.serverLogType.request, JSON.stringify(msg));
  var self = this;
  keyValidator.validateKeySets("Request", "database", "sitoutNextBigBlind", msg, function (validated) {
    if (validated.success) {
      self.app.rpc.database.tableRemote.sitoutNextBigBlind(session, msg, function (sitoutNextBigBlindResponse) {
        if (sitoutNextBigBlindResponse.success) {
          keyValidator.validateKeySets("Response", "database", "sitoutNextBigBlind", sitoutNextBigBlindResponse, function (validated) {
            if (validated.success) {
              serverLog(stateOfX.serverLogType.response, JSON.stringify(sitoutNextBigBlindResponse));
              next(null, sitoutNextBigBlindResponse);
            } else {
              serverLog(stateOfX.serverLogType.response, JSON.stringify(validated));
              next(null, validated);
            }
          });
        } else {
          serverLog(stateOfX.serverLogType.response, JSON.stringify(sitoutNextBigBlindResponse));
          next(null, sitoutNextBigBlindResponse);
        }
      });
    } else {
      serverLog(stateOfX.serverLogType.response, JSON.stringify(validated));
      next(null, validated);
    }
  })
};

// ### Handler to get list of tables on lobby
handler.getLobbyTables = function (msg, session, next) {
  console.log("getLobbyTables request ~~~~~~~~~~~~~~", msg)
  serverLog(stateOfX.serverLogType.request, JSON.stringify(msg));
  var self = this; //
  keyValidator.validateKeySets("Request", "connector", "getLobbyTables", msg, function (validated) {
    if (validated.success) {
      if (msg.channelVariation != 'All') {
        var tempObj = { isActive: true, isOrganic:msg.isOrganic, channelType: !!msg.channelType ? msg.channelType : "NORMAL", isRealMoney: JSON.parse(msg.isRealMoney), channelVariation: msg.channelVariation, playerId: msg.playerId };
      } else {
        var tempObj = { isActive: true,isOrganic:msg.isOrganic, channelType: !!msg.channelType ? msg.channelType : "NORMAL", isRealMoney: JSON.parse(msg.isRealMoney), channelVariation: msg.channelVariation, playerId: msg.playerId };
      }
      tempObj.isOrganic = msg.isOrganic;
      serverLog(stateOfX.serverLogType.info, "tempObj is in getLobbyTables is in entryHandler is - " + JSON.stringify(tempObj));
      self.app.rpc.database.dbRemote.getTablesForGames(session, tempObj, function (lobbyResponse) {
        activity.getLobbyTables(msg, stateOfX.profile.category.lobby, stateOfX.lobby.subCategory.fetchTables, lobbyResponse, stateOfX.logType.success);
        serverLog(stateOfX.serverLogType.response, "RESPONSE in getLobbyTables is" + JSON.stringify(lobbyResponse));
        next(null, lobbyResponse);
      });
    } else {
      serverLog(stateOfX.serverLogType.response, JSON.stringify(validated));
      activity.getLobbyTables(msg, stateOfX.profile.category.lobby, stateOfX.lobby.subCategory.fetchTables, validated, stateOfX.logType.error)
      next(null, validated);
    }
  })
};

// deprecated
handler.getLobbyTablesForBot = function (msg, session, next) {
  sessionHandler.recordLastActivityTime({ session: session, msg: msg });
  serverLog(stateOfX.serverLogType.request, JSON.stringify(msg));
  var self = this;
  var tempObj = { isActive: true, channelType: !!msg.channelType ? msg.channelType : "NORMAL", isRealMoney: { $in: [true, false] }, channelVariation: { $in: ["Texas Hold’em", "Omaha Hi-Lo", "Omaha", "Six Plus Texas Hold’em"] }, playerId: msg.playerId };
  serverLog(stateOfX.serverLogType.info, "tempObj is in getLobbyTables is in entryHandler is - " + JSON.stringify(tempObj));
  self.app.rpc.database.dbRemote.getTablesForGames(session, tempObj, function (lobbyResponse) {
    activity.getLobbyTables(msg, stateOfX.profile.category.lobby, stateOfX.lobby.subCategory.fetchTables, lobbyResponse, stateOfX.logType.success);
    serverLog(stateOfX.serverLogType.response, "RESPONSE in getLobbyTables is" + JSON.stringify(lobbyResponse));
    next(null, lobbyResponse);
  });
};

// ### Handler to create tournament table
// tournament
handler.createTournamentTables = function (msg, session, next) {
  sessionHandler.recordLastActivityTime({ session: session, msg: msg });
  serverLog(stateOfX.serverLogType.request, JSON.stringify(msg));
  var self = this;
  keyValidator.validateKeySets("Request", "connector", "createTournamentTables", msg, function (validated) {
    if (validated.success) {
      self.app.rpc.database.dbRemote.createTablesForTournament(session, msg, function (lobbyResponse) {
        serverLog(stateOfX.serverLogType.response, JSON.stringify(lobbyResponse));
        next(null, lobbyResponse);
      });
    } else {
      serverLog(stateOfX.serverLogType.response, JSON.stringify(validated));
      next(null, validated);
    }
  })
};

// ### Handler to report issue from player
// internally uses feedback function
handler.reportIssue = function (msg, session, next) {
  handler.feedback.call(this, msg, session, next);
  return;
};

// ### Handler to get issue for player
// deprecated
handler.getIssue = function (msg, session, next) {
  sessionHandler.recordLastActivityTime({ session: session, msg: msg });
  serverLog(stateOfX.serverLogType.request, JSON.stringify(msg));
  var self = this;
  keyValidator.validateKeySets("Request", "connector", "getIssue", msg, function (validated) {
    if (validated.success) {
      msg = _.omit(msg, '__route__');
      self.app.rpc.database.dbRemote.getIssue(session, msg, function (getIssueResponse) {
        serverLog(stateOfX.serverLogType.response, JSON.stringify(getIssueResponse));
        next(null, getIssueResponse);
      });
    } else {
      serverLog(stateOfX.serverLogType.response, JSON.stringify(validated));
      next(null, validated);
    }
  })
};

// ### Join player to similar table
handler.joinSimilarTable = function (msg, session, next) {
  sessionHandler.recordLastActivityTime({ session: session, msg: msg });
  console.log(stateOfX.serverLogType.request, JSON.stringify(msg));
  var self = this;
  keyValidator.validateKeySets("Request", "connector", "joinSimilarTable", msg, function (validated) {
    if (validated.success) {
      self.app.rpc.database.dynamicTable.similarTableJoin(session, { playerId: msg.playerId, channelId: msg.channelId }, function (searchTableResponse) {
        console.log("found this res for similarTableJoin", searchTableResponse)
        next(null, searchTableResponse);
      });
    } else {
      next(null, validated);
    }
  })
};

//### check whether user is registered in tournament or not
//tournament
handler.isRegisteredUserInTournament = function (msg, session, next) {
  sessionHandler.recordLastActivityTime({ session: session, msg: msg });
  serverLog(stateOfX.serverLogType.request, JSON.stringify(msg));
  var self = this;
  serverLog(stateOfX.serverLogType.info, "in isRegisteredUserInTournament in entryHandler", "connector");
  keyValidator.validateKeySets("Request", "connector", "isRegisteredUserInTournament", msg, function (validated) {
    if (validated.success) {
      self.app.rpc.database.tournament.isRegisteredUserInTournament(session, { playerId: msg.playerId, tournamentId: msg.tournamentId, gameVersionCount: msg.gameVersionCount }, function (registeredUserResponse) {
        serverLog(stateOfX.serverLogType.response, JSON.stringify(registeredUserResponse));
        next(null, registeredUserResponse);
      })
    } else {
      serverLog(stateOfX.serverLogType.response, JSON.stringify(validated));
      next(null, validated);
    }
  });
}

//### handler for start tournament
//tournament
handler.startTournament = function (msg, session, next) {
  // sessionHandler.recordLastActivityTime({session: session, msg: msg});
  serverLog(stateOfX.serverLogType.request, JSON.stringify(msg));
  var self = this;
  keyValidator.validateKeySets("Request", "connector", "startTournament", msg, function (validated) {
    if (validated) {
      var params = { tournamentId: msg.tournamentId, gameVersionCount: msg.gameVersionCount, self: self, session: session };
      startTournamentHandler.process(params, function (tournamentStartResponse) {
        serverLog(stateOfX.serverLogType.info, "tournament process response" + JSON.stringify(_.keys(tournamentStartResponse)));
        if (tournamentStartResponse.success) {
          // serverLog(stateOfX.serverLogType.response + "tournamnet start response" + JSON.stringify(tournamentStartResponse.result));
          next(null, tournamentStartResponse.result);
        } else {
          serverLog(stateOfX.serverLogType.response, JSON.stringify(tournamentStartResponse));
          next(null, tournamentStartResponse);
        }
      });
    } else {
      serverLog(stateOfX.serverLogType.response, JSON.stringify(validated));
      next(null, validated);
    }
  })
}

//### handler for quick seat management for cash games
// msg contains various filters - minBuyIn maxPlayers isRealMoney channelVariation maxPlayers
handler.quickSeat = function (msg, session, next) {
  sessionHandler.recordLastActivityTime({ session: session, msg: msg });
  serverLog(stateOfX.serverLogType.request, JSON.stringify(msg));
  var self = this;
  keyValidator.validateKeySets("Request", "connector", "quickSeat", msg, function (validated) {
    if (validated) {
      if (typeof (msg.minBuyIn) !== "number" || typeof (msg.maxPlayers) !== "number") {
        serverLog(stateOfX.serverLogType.response, "invalid big blind or max player type");
        next(null, "invalid big blind or max player type");
      } else {
        var params = {
          isRealMoney: JSON.parse(msg.isRealMoney),
          channelVariation: msg.channelVariation,
          minBuyIn: Number(msg.minBuyIn),
          maxPlayers: Number(msg.maxPlayers),
          channelType: "NORMAL"
        }

        self.app.rpc.database.dbRemote.getQuickSeatTable(session, params, function (quickSeatResponse) {
          serverLog(stateOfX.serverLogType.response, JSON.stringify(quickSeatResponse));
          next(null, quickSeatResponse);
        });
      }
    } else {
      serverLog(stateOfX.serverLogType.response, JSON.stringify(validated));
      next(null, validated);
    }
  })
}

//### handler for quick seat management for SIT N GO Tournament
//tournament
handler.getQuickSeatSitNGo = function (msg, session, next) {
  sessionHandler.recordLastActivityTime({ session: session, msg: msg });
  serverLog(stateOfX.serverLogType.request, JSON.stringify(msg));
  var self = this;
  keyValidator.validateKeySets("Request", "connector", "quickSeatSitNGo", msg, function (validated) {
    if (validated) {
      if (typeof (msg.minBuyIn) !== "number" || typeof (msg.maxPlayers) !== "number") {
        serverLog(stateOfX.serverLogType.response, "invalid big blind or max player type");
        next(null, "invalid big blind or max player type");
      } else {
        var params = {
          isRealMoney: JSON.parse(msg.isRealMoney),
          channelVariation: msg.channelVariation,
          buyIn: Number(msg.buyIn),
          maxPlayersForTournament: Number(msg.maxPlayersForTournament),
          tournamentType: "SIT N GO"
        }

        self.app.rpc.database.dbRemote.getQuickSeatSitNGo(session, params, function (quickSeatResponse) {
          serverLog(stateOfX.serverLogType.response, JSON.stringify(quickSeatResponse));
          next(null, quickSeatResponse);
        });
      }
    } else {
      serverLog(stateOfX.serverLogType.response, JSON.stringify(validated));
      next(null, validated);
    }
  })
}

//### handler for quick seat management for Tournament
//tournament
handler.getQuickSeatTournament = function (msg, session, next) {
  sessionHandler.recordLastActivityTime({ session: session, msg: msg });
  serverLog(stateOfX.serverLogType.request, JSON.stringify(msg));
  var self = this;
  keyValidator.validateKeySets("Request", "connector", "quickSeatTournament", msg, function (validated) {
    if (validated) {
      if (typeof (msg.minBuyIn) !== "number" || typeof (msg.maxPlayers) !== "number") {
        serverLog(stateOfX.serverLogType.response, "invalid big blind or max player type");
        next(null, "invalid big blind or max player type");
      } else {
        var params = {
          isRealMoney: JSON.parse(msg.isRealMoney),
          channelVariation: msg.channelVariation,
          buyIn: Number(msg.buyIn),
          maxPlayersForTournament: Number(msg.maxPlayersForTournament),
          tournamentType: msg.tournamentType
        }

        self.app.rpc.database.dbRemote.getQuickSeatSitNGo(session, params, function (quickSeatResponse) {
          serverLog(stateOfX.serverLogType.response, JSON.stringify(quickSeatResponse));
          next(null, quickSeatResponse);
        });
      }
    } else {
      serverLog(stateOfX.serverLogType.response, JSON.stringify(validated));
      next(null, validated);
    }
  })
}

// get various filters for quick seat inputs
// for like - turnTime smallBlind bigBlind channelVariation maxPlayers
handler.getFilters = function (msg, session, next) {
  sessionHandler.recordLastActivityTime({ session: session, msg: msg });
  var self = this;
  keyValidator.validateKeySets("Request", "connector", "getFilters", msg, function (validated) {
    if (validated.success) {
      getFiltersFromDb.generateResponse(function (result) {
        serverLog(stateOfX.serverLogType.response, JSON.stringify(result));
        next(null, result);
      });
    } else {
      serverLog(stateOfX.serverLogType.response, JSON.stringify(validated));
      next(null, validated);
    }
  })
}

//### handler for add favourate seat management (Not applicable for any kind of tournament, as in tournament no seat is fixed)
//deprecated
handler.addFavourateSeat = function (msg, session, next) {
  sessionHandler.recordLastActivityTime({ session: session, msg: msg });
  serverLog(stateOfX.serverLogType.request, JSON.stringify(msg));
  var self = this;
  keyValidator.validateKeySets("Request", "connector", "addFavourateSeat", msg, function (validated) {
    if (validated) {
      if (msg.favourateSeat.channelId === undefined) {
        serverLog(stateOfX.serverLogType.response, "missing channelId");
        next(null, { success: false, info: configMsg.ADDFAVOURATESEATFAIL_MISSINGCHANNELID_ENTRYHANDLER, isRetry: false, isDisplay: false, channelId: "" });
      } else if (msg.favourateSeat.position === undefined) {
        serverLog(stateOfX.serverLogType.response, "missing position");
        next(null, { success: false, info: configMsg.ADDFAVOURATESEATFAIL_MISSINGPOSITION_ENTRYHANDLER, isRetry: false, isDisplay: false, channelId: "" });
      } else if (typeof (msg.favourateSeat.position) !== "number") {
        serverLog(stateOfX.serverLogType.response, "invalid position");
        next(null, { success: false, info: configMsg.ADDFAVOURATESEATFAIL_MISSINGPOSITION_ENTRYHANDLER, isRetry: false, isDisplay: false, channelId: "" });
      } else {
        var params = {
          playerId: msg.playerId,
          favourateSeat: {
            channelName: msg.favourateSeat.channelName,
            channelVariation: msg.favourateSeat.channelVariation,
            channelId: msg.favourateSeat.channelId,
            position: JSON.parse(msg.favourateSeat.position)
          }
        }

        self.app.rpc.database.dbRemote.addFavourateSeat(session, params, function (quickSeatResponse) {
          serverLog(stateOfX.serverLogType.response, JSON.stringify(quickSeatResponse));
          next(null, quickSeatResponse);
        });
      }
    } else {
      serverLog(stateOfX.serverLogType.response, JSON.stringify(validated));
      next(null, validated);
    }
  })
}

//### handler to remove favourate seat (Not applicable for any kind of tournament, as in tournament no seat is fixed)
//deprecated
handler.removeFavourateSeat = function (msg, session, next) {
  sessionHandler.recordLastActivityTime({ session: session, msg: msg });
  serverLog(stateOfX.serverLogType.request, JSON.stringify(msg));
  var self = this;
  keyValidator.validateKeySets("Request", "connector", "removeFavourateSeat", msg, function (validated) {
    if (validated) {
      var params = {
        playerId: msg.playerId,
        channelId: msg.channelId
      }

      self.app.rpc.database.dbRemote.removeFavourateSeat(session, params, function (removeFavourateSeatResponse) {
        serverLog(stateOfX.serverLogType.response, JSON.stringify(removeFavourateSeatResponse));
        next(null, removeFavourateSeatResponse);
      });

    } else {
      serverLog(stateOfX.serverLogType.response, JSON.stringify(validated));
      next(null, validated);
    }
  })
}

//### handler for add favourate table management (records for both normal game or tournament, diffrenciated by type)
handler.addFavourateTable = function (msg, session, next) {
  sessionHandler.recordLastActivityTime({ session: session, msg: msg });
  serverLog(stateOfX.serverLogType.request, JSON.stringify(msg));
  var self = this;
  keyValidator.validateKeySets("Request", "connector", "addFavourateTable", msg, function (validated) {
    if (validated) {
      if (msg.favourateTable.channelId == undefined) {
        var fail = { success: false, channelId: (msg.channelId || ""), info: configMsg.ADDFAVOURATETABLEFAIL_MISSINGCHANNELID_ENTRYHANDLER, isRetry: false, isDisplay: false }
        serverLog(stateOfX.serverLogType.response, JSON.stringify(fail));
        next(null, fail);
      } else if (msg.favourateTable.type == undefined) {
        var fail = { success: false, channelId: (msg.channelId || ""), info: configMsg.ADDFAVOURATESEATFAIL_MISSINGPOSITION_ENTRYHANDLER, isRetry: false, isDisplay: false }
        serverLog(stateOfX.serverLogType.response, JSON.stringify(fail));
        next(null, fail);
      } else if (msg.favourateTable.type == 'TOURNAMENT' || msg.favourateTable.type == 'NORMAL') {
        var params = {
          playerId: msg.playerId,
          favourateTable: { type: msg.favourateTable.type, channelId: msg.favourateTable.channelId }
        }

        self.app.rpc.database.dbRemote.addFavourateTable(session, params, function (quickSeatResponse) {
          serverLog(stateOfX.serverLogType.response, JSON.stringify(quickSeatResponse));
          next(null, quickSeatResponse);
        });
      } else {
        serverLog(stateOfX.serverLogType.response, "invalid table type");
        next(null, "invalid table type");
      }
    } else {
      serverLog(stateOfX.serverLogType.response, JSON.stringify(validated));
      next(null, validated);
    }
  })
}

//### handler to remove favourate table
handler.removeFavourateTable = function (msg, session, next) {
  sessionHandler.recordLastActivityTime({ session: session, msg: msg });
  serverLog(stateOfX.serverLogType.request, JSON.stringify(msg));
  var self = this;
  keyValidator.validateKeySets("Request", "connector", "removeFavourateTable", msg, function (validated) {
    if (validated) {
      var params = { playerId: msg.playerId, channelId: msg.channelId };
      self.app.rpc.database.dbRemote.removeFavourateTable(session, params, function (removeFavourateTableResponse) {
        serverLog(stateOfX.serverLogType.response, JSON.stringify(removeFavourateTableResponse));
        next(null, removeFavourateTableResponse);
      });
    } else {
      serverLog(stateOfX.serverLogType.response, JSON.stringify(validated));
      next(null, validated);
    }
  })
}

//### handler to update Avg Stack for a table (Not applicable for tournament)
//deprecated - not used from here
handler.updateStackTable = function (msg, session, next) {
  sessionHandler.recordLastActivityTime({ session: session, msg: msg });
  serverLog(stateOfX.serverLogType.request, JSON.stringify(msg));
  var self = this;
  keyValidator.validateKeySets("Request", "connector", "updateStackTable", msg, function (validated) {
    if (validated) {
      var params = { id: msg.id, stack: JSON.parse(msg.stack) };
      self.app.rpc.database.dbRemote.updateStackTable(session, params, function (removeFavourateTableResponse) {
        serverLog(stateOfX.serverLogType.response, JSON.stringify(removeFavourateTableResponse));
        next(null, removeFavourateTableResponse);
      });
    } else {
      serverLog(stateOfX.serverLogType.response, JSON.stringify(validated));
      next(null, validated);
    }
  })
}

//### handler to update Avg Stack for a tournament room
//tournament
handler.updateStackTournamentRoom = function (msg, session, next) {
  sessionHandler.recordLastActivityTime({ session: session, msg: msg });
  serverLog(stateOfX.serverLogType.request, JSON.stringify(msg));
  var self = this;
  keyValidator.validateKeySets("Request", "connector", "updateStackTournamentRoom", msg, function (validated) {
    if (validated) {
      var params = { id: msg.id, stack: JSON.parse(msg.stack) };
      self.app.rpc.database.dbRemote.updateStackTournamentRoom(session, params, function (removeFavourateTableResponse) {
        serverLog(stateOfX.serverLogType.response, JSON.stringify(removeFavourateTableResponse));
        next(null, removeFavourateTableResponse);
      });
    } else {
      serverLog(stateOfX.serverLogType.response, JSON.stringify(validated));
      next(null, validated);
    }
  })
}

//### get tournament registered users
//tournament
handler.getRegisteredTournamentUsers = function (msg, session, next) {
  sessionHandler.recordLastActivityTime({ session: session, msg: msg });
  serverLog(stateOfX.serverLogType.request, JSON.stringify(msg));
  var self = this;
  keyValidator.validateKeySets("Request", "connector", "getRegisteredTournamentUsers", msg, function (validated) {
    if (validated.success) {
      self.app.rpc.database.tournament.getRegisteredTournamentUsers(session, { playerId: msg.playerId, tournamentId: msg.tournamentId, gameVersionCount: msg.gameVersionCount }, function (tournamentUserResponse) {
        serverLog(stateOfX.serverLogType.response, JSON.stringify(tournamentUserResponse));
        next(null, tournamentUserResponse);
      })
    } else {
      serverLog(stateOfX.serverLogType.response, JSON.stringify(validated));
      next(validated);
    }
  })
}

// ### Handle request to get inside table structure to be displayed on lobby
handler.getTable = function (msg, session, next) {
  // console.log("here user wants the report regarding table",  msg)
  sessionHandler.recordLastActivityTime({ session: session, msg: msg });
  serverLog(stateOfX.serverLogType.request, JSON.stringify(msg));
  var self = this;
  keyValidator.validateKeySets("Request", "connector", "getTable", msg, function (validated) {
    if (validated.success) {
      self.app.rpc.database.tableRemote.getTableView(session, { channelId: msg.channelId, playerId: msg.playerId, deviceType: msg.deviceType }, function (getTableViewResponse) {
        // console.log("this is what we received from the db",  getTableViewResponse)
        serverLog(stateOfX.serverLogType.response, JSON.stringify(getTableViewResponse));
        activity.getTable(msg, stateOfX.profile.category.lobby, stateOfX.lobby.subCategory.fetchTables, getTableViewResponse, stateOfX.logType.success);
        next(null, getTableViewResponse);
      });
    } else {
      serverLog(stateOfX.serverLogType.response, JSON.stringify(validated));
      activity.getTable(msg, stateOfX.profile.category.lobby, stateOfX.lobby.subCategory.fetchTables, validated, stateOfX.logType.error);
      next(null, validated);
    }
  })
};

handler.getTableStructure = function (msg, session, next) {
  sessionHandler.recordLastActivityTime({ session: session, msg: msg });
  serverLog(stateOfX.serverLogType.request, JSON.stringify(msg));
  var self = this;
  keyValidator.validateKeySets("Request", "connector", "getTableStructure", msg, function (validated) {
    if (validated.success) {
      self.app.rpc.database.tournament.getChannelStructure(session, { tournamentId: msg.tournamentId, gameVersionCount: msg.gameVersionCount }, function (getChannelStructureResponse) {
        serverLog(stateOfX.serverLogType.response, JSON.stringify(getChannelStructureResponse));
        next(null, getChannelStructureResponse);
      });
    } else {
      serverLog(stateOfX.serverLogType.response, JSON.stringify(validated));
      next(null, validated);
    }
  })
};

// Update player entities directly from client request
// like - runItTwice
handler.setPlayerValueOnTable = function (msg, session, next) {
  sessionHandler.recordLastActivityTime({ session: session, msg: msg });
  serverLog(stateOfX.serverLogType.request, JSON.stringify(msg));
  var self = this;
  keyValidator.validateKeySets("Request", "connector", "setPlayerValueOnTable", msg, function (validated) {
    if (validated.success) {

      // /  added by sahiq to fix auto straddle issue checkbox blank

      var settings = {};
      settings["settings." + msg.key] = msg.value;

      imdb.updateTableSetting({ channelId: msg.channelId, playerId: msg.playerId }, { $set: settings }, function (err, result) {
        if (err) {
          serverLog(stateOfX.serverLogType.response, JSON.stringify(err));
        } else {
          serverLog(stateOfX.serverLogType.response, JSON.stringify(result));
          activity.updateTableSettings(msg, stateOfX.profile.category.game, stateOfX.game.subCategory.updateTableSettings, stateOfX.logType.success, session.settings.playerName);

          self.app.rpc.database.requestRemote.setPlayerValueOnTable(session, { channelId: msg.channelId, playerId: msg.playerId, key: msg.key, value: msg.value }, function (setPlayerValueOnTableResponse) {
            serverLog(stateOfX.serverLogType.response, JSON.stringify(setPlayerValueOnTableResponse));
            next(null, setPlayerValueOnTableResponse);
          });

        }
      });
    } else {
      serverLog(stateOfX.serverLogType.response, JSON.stringify(validated));
      next(null, validated);
    }
  })
};

// Get Blind Structure
// tournament
handler.getBlindAndPrize = function (msg, session, next) {
  sessionHandler.recordLastActivityTime({ session: session, msg: msg });
  serverLog(stateOfX.serverLogType.request, JSON.stringify(msg));
  var self = this;
  keyValidator.validateKeySets("Request", "connector", "getBlindAndPrize", msg, function (validated) {
    if (validated.success) {
      self.app.rpc.database.tournament.getBlindAndPrize(session, { blindRule: msg.blindRule, gameVersionCount: msg.gameVersionCount, prizeRule: msg.prizeRule }, function (response) {
        serverLog(stateOfX.serverLogType.info, "response in getBlindAndPrize is in entryHandler is - ", JSON.stringify(response));
        serverLog(stateOfX.serverLogType.response, JSON.stringify(response));
        next(null, response);
      });
    } else {
      serverLog(stateOfX.serverLogType.response, JSON.stringify(validated));
      next(null, validated);
    }
  })
}

// tournament
handler.getBlindAndPrizeForNormalTournament = function (msg, session, next) {
  sessionHandler.recordLastActivityTime({ session: session, msg: msg });
  serverLog(stateOfX.serverLogType.request, JSON.stringify(msg));
  var self = this;
  keyValidator.validateKeySets("Request", "connector", "getBlindAndPrizeForNormalTournament", msg, function (validated) {
    if (validated.success) {
      self.app.rpc.database.tournament.getBlindAndPrizeForNormalTournament(session, { tournamentId: msg.tournamentId, noOfPlayers: msg.noOfPlayers }, function (response) {
        serverLog(stateOfX.serverLogType.response, JSON.stringify(response));
        next(null, response);
      });
    } else {
      serverLog(stateOfX.serverLogType.response, JSON.stringify(validated));
      next(null, validated)
    }
  });
}

// ### Get prize for satellite tournament
// tournament
handler.getBlindAndPrizeForSatelliteTournament = function (msg, session, next) {
  sessionHandler.recordLastActivityTime({ session: session, msg: msg });
  serverLog(stateOfX.serverLogType.request, JSON.stringify(msg));
  var self = this;
  keyValidator.validateKeySets("Request", "connector", "getBlindAndPrizeForSatelliteTournament", msg, function (validated) {
    if (validated.success) {
      self.app.rpc.database.tournament.getBlindAndPrizeForSatelliteTournament(session, { tournamentId: msg.tournamentId, noOfPlayers: msg.noOfPlayers }, function (response) {
        serverLog(stateOfX.serverLogType.response, JSON.stringify(response));
        next(null, response);
      });
    } else {
      next(null, validated);
    }
  })
}

// Get prize list won by user
// tournament
handler.getPlayerPrize = function (msg, session, next) {
  sessionHandler.recordLastActivityTime({ session: session, msg: msg });
  serverLog(stateOfX.serverLogType.request, JSON.stringify(msg));
  var self = this;
  keyValidator.validateKeySets("Request", "connector", "getPlayerPrize", msg, function (validated) {
    if (validated.success) {
      self.app.rpc.database.tournament.getPlayerPrize(session, { playerId: msg.playerId }, function (response) {
        serverLog(stateOfX.serverLogType.info, "response in getPlayerPrize is in entryHandler is - ", JSON.stringify(response));
        serverLog(stateOfX.serverLogType.response, JSON.stringify(response));
        next(null, response);
      });
    } else {
      serverLog(stateOfX.serverLogType.response, JSON.stringify(validated));
      next(null, validated);
    }
  })
}

// tournament
handler.collectPrize = function (msg, session, next) {
  sessionHandler.recordLastActivityTime({ session: session, msg: msg });
  serverLog(stateOfX.serverLogType.request, JSON.stringify(msg));
  var self = this;
  keyValidator.validateKeySets("Request", "connector", "collectPrize", msg, function (validated) {
    if (validated.success) {
      self.app.rpc.database.tournament.collectPrize(session, { playerId: msg.playerId, gameVersionCount: msg.gameVersionCount, tournamentId: msg.tournamentId }, function (response) {
        serverLog(stateOfX.serverLogType.info, "response in collectPrize is in entryHandler is - ", JSON.stringify(response));
        serverLog(stateOfX.serverLogType.response, JSON.stringify(response));
        next(null, response);
      });
    } else {
      serverLog(stateOfX.serverLogType.response, JSON.stringify(validated));
      next(null, validated);
    }
  })
}


// save player notes for other players
// independent of table
//{playerId : "String" ,forPlayerId : "String" ,notes: "String", color: "Object"}
handler.createNotes = function (msg, session, next) {
  sessionHandler.recordLastActivityTime({ session: session, msg: msg });
  serverLog(stateOfX.serverLogType.request, JSON.stringify(msg));
  var self = this;
  keyValidator.validateKeySets("Request", "connector", "createNotes", msg, function (validated) {
    if (validated.success) {
      self.app.rpc.database.playerNotes.createNotes(session, msg, function (response) {
        serverLog(stateOfX.serverLogType.info, "response in createNotes is in entryHandler is - ", JSON.stringify(response));
        serverLog(stateOfX.serverLogType.response, JSON.stringify(response));
        next(null, response);
      });
    } else {
      serverLog(stateOfX.serverLogType.response, JSON.stringify(validated));
      next(null, validated);
    }
  })
}

// update player notes for other players
handler.updateNotes = function (msg, session, next) {
  sessionHandler.recordLastActivityTime({ session: session, msg: msg });
  serverLog(stateOfX.serverLogType.request, JSON.stringify(msg));
  var self = this;
  keyValidator.validateKeySets("Request", "connector", "updateNotes", msg, function (validated) {
    if (validated.success) {
      self.app.rpc.database.playerNotes.updateNotes(session, msg, function (response) {
        serverLog(stateOfX.serverLogType.info, "response in updateNotes is in entryHandler is - ", JSON.stringify(response));
        serverLog(stateOfX.serverLogType.response, JSON.stringify(response));
        next(null, response);
      });
    } else {
      serverLog(stateOfX.serverLogType.response, JSON.stringify(validated));
      next(null, validated);
    }
  })
}

// delete player notes
handler.deleteNotes = function (msg, session, next) {
  sessionHandler.recordLastActivityTime({ session: session, msg: msg });
  serverLog(stateOfX.serverLogType.request, JSON.stringify(msg));
  var self = this;
  keyValidator.validateKeySets("Request", "connector", "deleteNotes", msg, function (validated) {
    if (validated.success) {
      self.app.rpc.database.playerNotes.deleteNotes(session, msg, function (response) {
        serverLog(stateOfX.serverLogType.info, "response in deleteNotes is in entryHandler is - ", JSON.stringify(response));
        serverLog(stateOfX.serverLogType.response, JSON.stringify(response));
        next(null, response);
      });
    } else {
      serverLog(stateOfX.serverLogType.response, JSON.stringify(validated));
      next(null, validated);
    }
  })
}

// fetch player's notes for other players sitting in the room
handler.getNotes = function (msg, session, next) {
  sessionHandler.recordLastActivityTime({ session: session, msg: msg });
  serverLog(stateOfX.serverLogType.request, JSON.stringify(msg));
  var self = this;
  keyValidator.validateKeySets("Request", "connector", "getNotes", msg, function (validated) {
    if (validated.success) {
      self.app.rpc.database.playerNotes.getNotes(session, msg, function (response) {
        serverLog(stateOfX.serverLogType.info, "response in getNotes is in entryHandler is - ", JSON.stringify(response));
        serverLog(stateOfX.serverLogType.response, JSON.stringify(response));
        next(null, response);
      });
    } else {
      serverLog(stateOfX.serverLogType.response, JSON.stringify(validated));
      next(null, validated);
    }
  })
}

///////////////////////////////////////////////////////////////
// Quick seat in sitNGo                                      //
//{gameVariation, buyIn, turnTime, maxPlayersForTournament } //
///////////////////////////////////////////////////////////////
// tournament
handler.quickSeatInSitNGo = function (msg, session, next) {
  sessionHandler.recordLastActivityTime({ session: session, msg: msg });
  serverLog(stateOfX.serverLogType.request, JSON.stringify(msg));
  var self = this;
  keyValidator.validateKeySets("Request", "connector", "quickSeatInSitNGo", msg, function (validated) {
    if (validated.success) {
      self.app.rpc.database.quickSeat.quickSeatInSitNGo(session, msg, function (response) {
        next(null, response);
      });
    } else {
      next(null, validated);
    }
  })
}

// fetch hand history - from hand tab
// msg contains handHistoryId i.e. unique to every game as well as roundId
handler.getHandHistory = function (msg, session, next) {
  sessionHandler.recordLastActivityTime({ session: session, msg: msg });
  serverLog(stateOfX.serverLogType.request, JSON.stringify(msg));
  var self = this;
  keyValidator.validateKeySets("Request", "connector", "getHandHistory", msg, function (validated) {
    if (validated.success) {
      //      console.error(msg.handHistoryId);
      ///msg.handHistoryId = "59ba7fd4b3ee87a86c39faaf";
      logDB.getHandHistory(msg.handHistoryId, function (err, handHistoryResponse) {
        if (err) {
          console.log('logDB.getHandHistory error')
          handHistoryResponse.channelId = msg.channelId;
          next(null, handHistoryResponse);
        } else {
          console.log("getting hand history", handHistoryResponse)
          next(null, { success: true, handHistory: handHistoryResponse, channelId: msg.channelId })
        }
      })
    } else {
      next(null, validated);
    }
  })
}

//////////////////////////////////////////////////////////////////////
// Get hand tab details for hand history, video and community cards //
//////////////////////////////////////////////////////////////////////
handler.getHandTab = function (msg, session, next) {
  sessionHandler.recordLastActivityTime({ session: session, msg: msg });
  serverLog(stateOfX.serverLogType.request, JSON.stringify(msg));
  var self = this;
  keyValidator.validateKeySets("Request", "connector", "getHandTab", msg, function (validated) {
    if (validated.success) {
      logDB.getHandTab(msg.channelId, function (err, handTabResponse) {
        if (err) {
          handTabResponse.channelId = msg.channelId;
          next(null, handTabResponse);
        } else {
          next(null, { success: true, handHistory: handTabResponse.reverse(), channelId: msg.channelId });
        }
      });
    } else {
      next(null, validated);
    }
  })
}

// Quick seat in tournament
//{gameVariation, buyIn, tournamentType, tournamentStartTime }
//tournament
handler.quickSeatInTournament = function (msg, session, next) {
  sessionHandler.recordLastActivityTime({ session: session, msg: msg });
  serverLog(stateOfX.serverLogType.request, JSON.stringify(msg));
  // msg.timeSpan = 200;
  var self = this;
  keyValidator.validateKeySets("Request", "connector", "quickSeatInTournament", msg, function (validated) {
    if (validated.success) {
      self.app.rpc.database.quickSeat.quickSeatInTournament(session, msg, function (response) {
        next(null, response);
      });
    } else {
      next(null, validated);
    }
  })
}

// getOnlinePlayer - API for first time use to fetch count of online players
handler.getOnlinePlayer = function (msg, session, next) {
  sessionHandler.recordLastActivityTime({ session: session, msg: msg });
  serverLog(stateOfX.serverLogType.request, JSON.stringify(msg));
  onlinePlayers.getOnlinePlayer({ self: this }, function (getOnlinePlayerResponse) {
    next(null, getOnlinePlayerResponse);
  });
}

//////////////////////////////////////////////////////////
// ### Send broadcast to any player from client request //
// > Dashboard data change for player                   //
//////////////////////////////////////////////////////////

// this API is used by dashboard
handler.broadcastPlayer = function (msg, session, next) {
  console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>boradcast player", msg);
  serverLog(stateOfX.serverLogType.request, JSON.stringify(msg));
  var self = this;
  keyValidator.validateKeySets("Request", "connector", "broadcastPlayer", msg, function (validated) {
    if (validated.success) {
      var sessionOnCurrServer = self.app.get('sessionService').getByUid(msg.playerId);
      if (sessionOnCurrServer || !sessionOnCurrServer) {
        broadcastHandler.sendMessageToUser({ self: self, msg: msg.data, playerId: msg.playerId, route: msg.route })
      } else {
        self.app.rpc.connector.sessionRemote.broadcastPlayer({ frontendId: 'connector-server-1' }, msg, function (result) {
          serverLog(stateOfX.serverLogType.info, 'broadcast to player redirected - ' + JSON.stringify(result))
        })
      }
      next(null, { success: true });
    } else {
      next(null, validated);
    }
  });
}

//////////////////////////////////////////////////
// Broadcast on channel level at client request //
// > Used for show/hide cards on winning        //
//////////////////////////////////////////////////
// deprecated
handler.channelBroadcastto = function (msg, session, next) {
  serverLog(stateOfX.serverLogType.request, JSON.stringify(msg));
  msg = !!msg.__route__ ? _.omit(msg, "__route__") : msg;
  var self = this;
  keyValidator.validateKeySets("Request", "connector", "channelBroadcast", msg, function (validated) {
    if (validated.success) {
      var channel = self.app.get('channelService').getChannel(msg.channelId, false);
      if(!channel){
        console.log("need to insert new channel", channel)
        channel = self.app.get('channelService').getChannel(msg.channelId, true);
      }
      msg.data.route = msg.route;
      msg.data.channelId = msg.channelId;
      broadcastHandler.fireChannelBroadcast({ channel: channel, data: msg.data, route: msg.route });
      next(null, { success: true, channelId: msg.channelId });
    } else {
      next(null, validated);
    }
  });
}

/////////////////////////////
// Rebuy in tournament     //
//{playerId, tournamentId} //
/////////////////////////////
handler.rebuyInTournament = function (msg, session, next) {
  sessionHandler.recordLastActivityTime({ session: session, msg: msg });
  serverLog(stateOfX.serverLogType.request, JSON.stringify(msg));
  var self = this;
  msg.session = session;
  msg.self = self;
  keyValidator.validateKeySets("Request", "connector", "rebuyInTournament", msg, function (validated) {
    if (validated.success) {
      rebuyHandler.rebuy(msg, function (rebuyResponse) {
        // tournamentActionHandler.prizePool({ self: self, session: session, tournamentId: msg.tournamentId, gameVersionCount: msg.gameVersionCount });
        next(null, rebuyResponse);
      })
    } else {
      next(null, validated);
    }
  })
}

/////////////////////////////
// Addon in tournament     //
//{playerId, tournamentId, channelId} //
/////////////////////////////
handler.addOnData = function (msg, session, next) {
  console.log("addOnData 0>", msg)
  keyValidator.validateKeySets("Request", "connector", "addOnData", msg, function (validated) {
    console.log("addOnData 1>", validated)
    if (validated.success) {
      db.getTournamentRoom(msg.tournamentId, function (err, result) {
        console.log("addOnData 2>", result)
        if (!!result) {
          db.getCustomUser(msg.playerId, { isOrganic: 1, points: 1 }, function (err, user) {
            console.log("addOnData 3>", user)
            if (!err && user) {
              next(null, { success: true, userChips: user.isOrganic ? user.realChips : user.touneyChips, addOnChips: 1000, addOnAmount: 500 });
            } else {
              next({ success: false, isRetry: false, isDisplay: false, channelId: "", info: dbConfigMsg.DBFINDTOURNAMENTUSERFAIL_REBUYHANDLER });
            }
          })
        } else {
          next({ success: false, isRetry: false, isDisplay: true, channelId: "", info: dbConfigMsg.DBGETTOURNAMENTROOMFAIL_REBUYHANDLER });
        }
      })
    } else {
      next(null, validated);
    }
  })
}

handler.reBuyData = function (msg, session, next) {
  console.log("reBuyData 0>", msg)
  keyValidator.validateKeySets("Request", "connector", "reBuyData", msg, function (validated) {
    console.log("reBuyData 1>", validated)
    if (validated.success) {
      db.getTournamentRoom(msg.tournamentId, function (err, result) {
        console.log("reBuyData 2>", result)
        if (!!result) {
          db.getCustomUser(msg.playerId, { isOrganic: 1, points: 1 }, function (err, user) {
            console.log("addOnData 3>", user)
            if (!err && user) {
              db.getUserTicket({ playerId: msg.playerId, tournamentId: msg.tournamentId, status: 0 },function (err, userTicket) {
                next(null, { success: true, userChips: user.isOrganic ? user.realChips : user.touneyChips, entryFees: result.entryFees, houseFees: result.houseFees, ticket : userTicket ? 1 :0 , delay: systemConfig.delayForRebuyPlayer });
              })
            } else {
              next({ success: false, isRetry: false, isDisplay: false, channelId: "", info: dbConfigMsg.DBFINDTOURNAMENTUSERFAIL_REBUYHANDLER });
            }
          })
        } else {
          next({ success: false, isRetry: false, isDisplay: true, channelId: "", info: dbConfigMsg.DBGETTOURNAMENTROOMFAIL_REBUYHANDLER });
        }
      })
    } else {
      next(null, validated);
    }
  })
}

handler.addOnInTournament = function (msg, session, next) {
  var self = this;
  msg.session = session;
  msg.self = self;
  keyValidator.validateKeySets("Request", "connector", "rebuyInTournament", msg, function (validated) {
    if (validated.success) {
      addOnHandler.addOn(msg, function (addOnResponse) {
        next(null, addOnResponse);
      })
    } else {
      next(null, validated);
    }
  })
}

/////////////////////////////
// update auto rebuy in tournament     //
//{playerId, channelId, isAutoRebuy} //
/////////////////////////////
handler.updateAutoRebuy = function (msg, session, next) {
  console.log("Inside updateAutoRebuy", msg);
  sessionHandler.recordLastActivityTime({ session: session, msg: msg });
  serverLog(stateOfX.serverLogType.request, JSON.stringify(msg));
  var self = this;
  msg.session = session;
  msg.self = self;
  keyValidator.validateKeySets("Request", "connector", "updateAutoRebuy", msg, function (validated) {
    if (validated.success) {
      rebuyHandler.updateAutoRebuy(msg, function (updateAutoRebuyResponse) {
        serverLog(stateOfX.serverLogType.request, "updateAutoRebuyin entryHandler is - " + JSON.stringify(updateAutoRebuyResponse));
        next(null, updateAutoRebuyResponse);
      })
    } else {
      next(null, validated);
    }
  })
}


///////////////////////////
//update auto rebuy in tournament     //
//{playerId, channelId, isAutoAddOn} //
///////////////////////////
handler.updateAutoAddon = function (msg, session, next) {
  console.log("Inside updateAutoAddon", msg);
  sessionHandler.recordLastActivityTime({ session: session, msg: msg });
  serverLog(stateOfX.serverLogType.request, JSON.stringify(msg));
  var self = this;
  msg.session = session;
  msg.self = self;
  keyValidator.validateKeySets("Request", "connector", "updateAutoAddon", msg, function (validated) { //validate keys in file keyConfig file
    if (validated.success) {
      addOnHandler.updateAutoAddon(msg, function (updateAutoAddonResponse) {
        serverLog(stateOfX.serverLogType.request, "updateAutoAddonin entryHandler is - " + JSON.stringify(updateAutoAddonResponse));
        next(null, updateAutoAddonResponse);
      })
    } else {
      next(null, validated);
    }
  })
}



/////////////////////////////////////////
// ### Log out player from the game:   //
// - Remove from all tables and        //
// - kill player's session from pomelo //
// Request: {playerId: }               //
/////////////////////////////////////////

handler.logout = function (msg, session, next) {
  // sessionHandler.recordLastActivityTime({session: session, msg: msg});
  serverLog(stateOfX.serverLogType.request, JSON.stringify(msg));
  // sessionHandler.recordLastActivityTime({ session: session, msg: msg });
  serverLog(stateOfX.serverLogType.request, JSON.stringify(msg));
  serverLog(stateOfX.serverLogType.request, 'msg in entryHandler in logout is - ' + JSON.stringify(msg));
  var self = this;
  msg.session = session;
  msg.self = self;
  keyValidator.validateKeySets("Request", "connector", "logout", msg, function (validated) {
    if (validated.success) {
      logoutHandler.logout(msg, function (logoutResponse) {
        next(null, logoutResponse);
        onlinePlayers.processOnlinePlayers({ self: self });
      })
    } else {
      next(null, validated);
    }
  })
}

// leave tournament
// Request: {playerId: , channelId: }
// Response: {success: , playerId: , channelId: }
handler.leaveTournament = function (msg, session, next) {
  sessionHandler.recordLastActivityTime({ session: session, msg: msg });
  serverLog(stateOfX.serverLogType.request, JSON.stringify(msg));
  serverLog(stateOfX.serverLogType.request, 'msg in entryHandler in leaveTournament is - ' + JSON.stringify(msg));
  msg.self = this;
  keyValidator.validateKeySets("Request", "connector", "leaveTournament", msg, function (validated) {
    if (validated.success) {
      tournamentLeaveHandler.leaveProcess(msg, function (leaveResponse) {
        next(null, leaveResponse);
      })
    } else {
      next(null, validated);
    }
  })
}

// API - for cashier button from game lobby
// fetch various details about player's account details
handler.getCashDetails = function (msg, session, next) {
  console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!msg", msg)
  var self = this;
  self.app.rpc.database.userRemote.getCashDetails(session, { playerId: msg.playerId }, function (response) {
    var channels = session.get('channels');
    // if (channels.length <= 0) {
    //   next(null, response);
    // } else {
      if(response.success){
        self.app.rpc.database.tableRemote.getTotalGameChips(session, { playerId: msg.playerId, channels: channels }, function (res) {
          response.result.inGameRealChips = (res ? res.realChips : 0) || 0;
          response.result.totalRealChips = response.result.inGameRealChips + response.result.realChips;
          response.result.inGameFreeChips = (res ? res.playChips : 0) || 0;
          response.result.totalFreeChips = response.result.inGameFreeChips + response.result.freeChips;
          next(null, response);
        })
      }
      else {
        next(null, response);
      }
    // }
  })
}

// API - for cashier button from game lobby
handler.getUcbHistory = function (msg, session, next) {
  console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!msg", msg)
  var self = this;
  self.app.rpc.database.userRemote.getUCBDetails(session, { playerId: msg.playerId }, function (response) {
      next(null, response);
  })
}

// API - for cashier button from game lobby
handler.getLoyaltyPointHistory = function (msg, session, next) {
  console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!msg", msg)
  var self = this;
  self.app.rpc.database.userRemote.getRakeBackDetails(session, { playerId: msg.playerId }, function (response) {
      next(null, response);
  })
}

// API - for cashier button from game lobby
handler.getRabbitHistory = function (msg, session, next) {
  console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!msg", msg)
  var self = this;
  self.app.rpc.database.userRemote.getRabbitDetails(session, { playerId: msg.playerId }, function (response) {
      next(null, response);
  })
}

// API - for subscription History button from game lobby
handler.getSubscriptionHistory = function (msg, session, next) {
  console.log("!!!!!!!!!!!!!!!!!!!!!getSubscriptionHistory", msg, session)
  logDB.fetchSubscription({ playerId: msg.playerId, status: true }, function (err, res) {
    if (err || !res.length) {
      next(null, { success: false, info: 'No subscription history found!', isDisplay: true, isRetry: false });
    }
    else {
      next(null, {success: true, data: res[0]});
    }
  })
}

// API - for subscription Purchase History button from game lobby
handler.getPurchaseHistory = function (msg, session, next) {
  console.log("!!!!!!!!!!!!!!!!!!!!!getPurchaseHistory", msg, session)
  logDB.fetchSubscription({ playerId: msg.playerId }, function (err, res) {
    if (err || !res.length) {
      next(null, { success: false, info: 'No subscription history found!', isDisplay: true, isRetry: false });
    }
    else {
      next(null, {success: true, data: res});
    }
  });
}

// API - for EV history button from game lobby
handler.getEVHistory = function (msg, session, next) {
  console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!msg", msg)
  sessionHandler.recordLastActivityTime({ session: session, msg: msg });
  keyValidator.validateKeySets("Request", "connector", "getEVHistory", msg, function (validated) {
    if (validated.success) {
      logDB.findEVHistory({playerId: msg.playerId}, function (err, evHistory) {
        if (err || !evHistory.length) {
          console.log('logDB.findEVHistory error', err, evHistory)
          next(null, { success: false, info: 'No EV History found!', isDisplay: true, isRetry: false });
        } else {
          console.log("getting ev history", evHistory)
          next(null, { success: true, evHistory: evHistory })
        }
      })
    } else {
      next(null, validated);
    }
  })
}

// API - used in website, called via dashboard
// fetch bonus data details for player
handler.getBonusHistory = function (msg, session, next) {
  var self = this;
  db.findBounsData({ playerId: msg.playerId }, function (err, user) {
    if (err || !user) {
      next(null, { success: false, info: 'db query failed' });
    } else {
      next(null, { success: true, result: user.bonus });
    }
  })
}

// drops a mail to support staff - at systemConfig.feedbackMail
// used from feedback inside game - option near by dealer chat
handler.feedback = function (msg, session, next) {
  var self = this;
  self.app.get('devMailer').sendToAdmin(Object.assign({}, (msg ? msg.data && { data: msg.data } : {}), (msg ? msg.issue && { issue: msg.issue } : {}), { playerId: msg.playerId, timestamp: new Date() }), systemConfig.feedbackMail || systemConfig.from_email, 'Feedback from user');
  next(null, { success: true, info: 'feedback received succefully.' });
}


// ### Set table level settings by players
// > Get key: value from client and save in settings.key: value
// > in spectator collection of inMemory databse
// > response true/false to client as response

handler.updateTableSettings = function (msg, session, next) {
  sessionHandler.recordLastActivityTime({ session: session, msg: msg });
  serverLog(stateOfX.serverLogType.request, JSON.stringify(msg));
  var settings = {};
  settings["settings." + msg.key] = msg.value;

  imdb.updateTableSetting({ channelId: msg.channelId, playerId: msg.playerId }, { $set: settings }, function (err, result) {
    if (err) {
      serverLog(stateOfX.serverLogType.response, JSON.stringify(err));
      next(null, { success: false, info: dbConfigMsg.dbQyeryInfo.DB_PLAYER_TABLESETTING_UPDATE_FAIL, isRetry: false, isDisplay: false, channelId: (msg.channelId || "") });
    } else {
      if (msg.key == 'tableColor') {
        handler.updateProfile({ "query": { "playerId": msg.playerId }, "updateKeys": { "settings.tableColor": msg.value } }, session, function (err, res) {
          // also tableColor changed for global
        });
      }
      if (msg.key == 'tableBackground') {
        handler.updateProfile({ "query": { "playerId": msg.playerId }, "updateKeys": { "settings.tableBackground": msg.value } }, session, function (err, res) {
        });
      }
      serverLog(stateOfX.serverLogType.response, JSON.stringify(result));
      activity.updateTableSettings(msg, stateOfX.profile.category.game, stateOfX.game.subCategory.updateTableSettings, stateOfX.logType.success, session.settings.playerName);
      next(null, { success: true, channelId: msg.channelId });
    }
  });
}

// cashout request by player from game build
// msg contains playerId, realChips
handler.cashOutForPlayerAffilate = function (msg, session, next) {
  sessionHandler.recordLastActivityTime({ session: session, msg: msg });
  serverLog(stateOfX.serverLogType.request, JSON.stringify(msg));
  var self = this;
  keyValidator.validateKeySets("Request", "connector", "cashOutForPlayerAffilate", msg, function (validated) {
    if (validated.success) {
      self.app.rpc.database.cashOutForPlayer.processCashout(session, msg, function (res) {
        commonHandler.sendCashoutSms({ userName: res.affUsername, mobileNumber: res.affMobileNo, cashOutAmount: res.cashOutAmount })
        next(null, { success: res.success, info: res.info, isRetry: false, isDisplay: true });
      })
    } else {
      next(null, validated);
    }
  })
}



handler.gameResultUpdate = function (msg, session, next) {
  // sessionHandler.recordLastActivityTime({session: session, msg: msg});
  serverLog(stateOfX.serverLogType.request, JSON.stringify(msg));
  var self = this;
  var channelId = msg.channel;
  console.log("=========================");
  console.log('channelId', msg)
  console.log("=========================");
  imdb.getTable(channelId, function (err, tableData) {

    console.log('tableData', tableData);
    var broadData = {};
    broadData.players = [];
    if (tableData) {
      var channelVariation = tableData.channelVariation;
      var boardCards = [];
      var players = {}
      for (var i = 0; i < 5; i++) {
        boardCards.push(tableData.deck[i]);
      }
      var playerdata = {};
      playerdata.players = [];
      tableData.players.forEach(players => {
        var player = {};
        var bestHandForPlayer = winnerMgmt.findCardsConfiguration({ boardCards: boardCards, playerCards: [{ playerId: players.playerId, cards: players.cards }] }, channelVariation);
        player.name = players.playerName;
        var bestHandText = "";
        if (!!bestHandForPlayer && tableData.channelVariation !== stateOfX.channelVariation.omahahilo) {
          bestHandText = bestHandForPlayer[0].text;
        } else {
          if (!!bestHandForPlayer && bestHandForPlayer[0].winnerHigh.length > 0) {
            bestHandText += " " + bestHandForPlayer[0].winnerHigh[0].text
          }
          if (!!bestHandForPlayer && bestHandForPlayer[0].winnerLo.length > 0) {
            bestHandText += "\n " + _.pluck(bestHandForPlayer[0].winnerLo[0].set, 'name')
          }
        }
        player.bestHands = bestHandText;
        playerdata.players.push(player);
      });
      next(null, { success: 'success', data: playerdata.players });
    } else {
      next(null, { success: 'success', data: 'no table' });
    }
  })
}

handler.playerGameList = function (msg, session, next) {
  sessionHandler.recordLastActivityTime({ session: session, msg: msg });
  var query = {};
  var response = {
    success: false,
    data: {},
    errMsg: ''
  };
  if (!!msg.playerId) {
    query.playerId = msg.playerId;
    query.handId = !!msg.handId ? msg.handId : '';
    query.date = !!msg.date ? msg.date : '';
    query.time = !!msg.time ? msg.time : '';
    query.dateStr = '';
    if (query.date != '') {
      query.dateStr = new Date(query.date + " " + query.time).getTime();
      query.dateStrEnd = query.dateStr + (1000 * 60 * 30); //Making end with extra 30 mintues
    }
    console.log('entering in log Db with Query:', query);
    logDB.getPlayerGames(query, function (err, result) {
      if (err) {
        response.success = false;
        response.errMsg = err;
        next(null, response)
      }
      else {
        var handsData = [];
        var date;
        var handsArr;
        var timeStamp;
        async.each(result, function (player, ecb) {
          handsArr = {};
          handsArr = player.rawResponse.params.table;
          handsArr.roundId = player.roundId;
          timeStamp = new Date(handsArr.gameStartTime + 330 * 60 * 1000).toLocaleDateString(undefined, {
            day: 'numeric',
            month: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });
          handsArr.gameStartTime = timeStamp;
          handsData.push(handsArr);
          ecb();
        }, function (err) {
          response.success = true;
          response.data = handsData;
          // next(null, {success: true, gameHistory: response})
          next(null, response)
        });
      }
    })
  } else {

    response.errMsg = "Player Id Missing";
    next(null, response)
  }

}

var getVideo = function (params, cb) {
  console.log("paramsValueAftergetVideo", params)
  logDB.findVideoById(params.videoId, function (err, video) {
    if (!err) {
      if (!!video) {
        params.video = video;
        cb(null, params);
      } else {
        cb({ success: false, info: infoMessage.dbQyeryInfo.DB_NOVIDEOEXISTS, isDisplay: false, isRetry: false, channelId: "" });
      }
    } else {
      cb({ success: false, info: infoMessage.dbQyeryInfo.DB_GETVIDEO_FAIL, isDisplay: false, isRetry: false, channelId: "" });
    }
  });
}
var getHandHistory = function (params, cb) {
  console.log("paramsValueAftergetVideo", params)
  logDB.getHandHistoryByVideoId(params.videoId, function (err, res) {
    console.log("After getHandHistoryByVideoId", err)
    if (!err && res) {
      params.handHistoryId = res.handHistoryId;
      params.handId = res.handId;
      cb(null, params);
    } else {
      cb({ success: false, info: infoMessage.dbQyeryInfo.DB_GETHISTORYBYVIDEO_FAIL, isDisplay: false, isRetry: false, channelId: "" });
    }
  });
}
var generateResponse = function (params, cb) {
  console.log("getHandHistory", params)
  var firstCreation = params.video.createdAt; //find the value of first time the document is created
  var response = {};
  response.success = true;
  response.handHistoryId = params.handHistoryId;
  response.gamePlayers = _.where(params.video.history, { type: "gamePlayers" })[0].data;   //finding those data where history type is response
  response.joinResponse = _.where(params.video.history, { type: "joinResponse" })[0].data;   //finding those data where history type is response
  response.joinResponse.playerId = params.playerId;
  response.joinResponse.playerName = params.playerName;
  response.roundId = params.video.roundId;
  response.handId = params.handId;
  var broadCastType = _.where(params.video.history, { type: "broadcast" }); //finding those data where history type is broadcast
  var responseType = _.where(params.video.history, { type: "response" });   //finding those data where history type is response
  var broadcasts = [];
  var responses = [];
  var duration = 0;
  var timeStamp = 0;
  for (var i = 0; i < broadCastType.length; i++) {
    timeStamp = (broadCastType[i].createdAt - firstCreation) / 1000; //calculating the timestamp in seconds
    if (broadCastType[i].data.route === "preCheck" || broadCastType[i].data.route === "bestHands" || broadCastType[i].data.route === "playerCards") {
      if (params.playerId === broadCastType[i].data.playerId) { // push only if player is authorise for data
        broadcasts.push({ timestamp: timeStamp, data: broadCastType[i].data });
      }
    } else {
      broadcasts.push({ timestamp: timeStamp, data: broadCastType[i].data });
    }
    if (broadCastType[i].data.route === "gameOver") {
      duration = timeStamp;
    }
  }
  for (var i = 0; i < responseType.length; i++) {
    var responseTimeStamp = (responseType[i].createdAt - firstCreation) / 1000; //calculating the timestamp in seconds
    responses.push({
      timestamp: (responseType[i].createdAt - firstCreation) / 1000, //calculating the timestamp in seconds
      data: responseType[i].data
    });
  }
  response.broadcasts = broadcasts;
  response.duration = duration;
  response.responses = responses;
  params.response = response;
  console.log("generateResponse", params)
  cb(null, response);
}
handler.getVideoData = function (msg, session, next) {
  var query = {};
  var response = {
    success: false,
    data: {},
    errMsg: ''
  };
  if (!!msg.roundId) {
    query.roundId = msg.roundId;
    console.log('entering in log Db with Query:', query);
    logDB.getRoundVideoData(query, function (err, result) {
      if (err) {
        response.success = false;
        response.errMsg = err;
        next(null, response)
      }
      else {
        var params = {};
        params.videoId = String(result._id);
        params.playerId = msg.playerId;
        params.playerName = msg.playerName;
        async.waterfall([
          async.apply(getVideo, params),
          getHandHistory,
          generateResponse
        ], function (err, res) {
          console.log("responseVideo", res);
          response.success = true;
          response.data = res;
          console.log("response", JSON.stringify(res))
          // next(null, {success: true, gameHistory: response})
          next(null, res)
        });
      }
    })
  } else {
    response.errMsg = "Round Id Missing";
    next(null, response)
  }
}

//check playerSession
handler.checkPlayerSession = function (msg, session, next) {
  var self = this;
  self.app.rpc.connector.entryRemote.getUserSession(self.session, msg, function (sessionExist) {
    if (sessionExist.success) {
      next(null, { success: true });
    } else {
      next(null, { success: false });
    }
  })
}
//get my topup
handler.getPlayerTopup = function (msg, session, next) {
  // msg.playerId= 'c054d72f-f38f-4a55-9fcd-6eebc51e2520',
  // msg.amount= 130;
  topupHandler.handle(msg, function (response) {
    if (response.success) {

      next(null, { success: true, channelId: msg.channelId, data: response.topUp, updated: response.updated, heading: "Points Transfer", info: response.amount + " Points added your account. Good Luck" });
    } else {
      next(null, { success: false, channelId: msg.channelId, heading: "Points Transfer", info: response.info });

    }
  })
}

//for promotional data
handler.promotionalData = function (msg, session, next) {

  contest.pullData(function (data) {

    var playerData = {};
    var getMyRankData = _.where(data.players, { playerId: msg.playerId });

    console.log("getMyRankData", getMyRankData)
    var myCurrentRank = '', myCurrentHands;
    if (typeof getMyRankData !== 'undefined' && getMyRankData.length > 0) {
      myCurrentRank = getMyRankData[0].rank;
      myCurrentHands = getMyRankData[0].numberOfHands;
    } else {
      myCurrentRank = 'NA';
      myCurrentHands = 0;
    }
    playerData.rank = myCurrentRank;
    playerData.numberOfHands = myCurrentHands;
    data.myRank = playerData;

    var headerText = { rank: "Rank", Players: "Players", Hands: "Hands" };
    data.headerText = headerText;
    var maxLength = data.players.length;
    if (maxLength >= 10) {
      maxLength = 10;
    }
    getTopPlayers = [];
    for (var i = 0; i < maxLength; i++) {
      var element = data.players[i];
      getTopPlayers.push(element);
    }
    data.players = getTopPlayers;
    console.log("hiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii===>", data)

    next(null, { success: true, data: data });
  })
}


handler.getLeaderboardData = function (msg, session, next) {
  promotionalDataHandler.getLeaderboardData(msg, function (err, response) {
    if (err) {
      console.log("............errrrrrr contest", err)
    }
    else {
      next(null, {
        success: true,
        data: response
      });
    }

  })
}


handler.cashOutHandlerFromApp = function (msg, sesison, next) {
  cashOutHandler.cashOutFromApp(msg, function (err, response) {
    if (err) {
      next(null, err);
    } else {
      next(null, response)
    }
  })
}

handler.bonusCode = function (msg, sesison, next) {
  bonusCodeHandler.listBonusCode(msg, function (err, response) {
    if (err) {
      next({ success: false, data: "Bonus Codes Are Not Avilable" });
    } else {
      next(null, { success: true, data: response })
    }
  })
}
handler.panCardHandler = function (msg, sesison, next) {
  console.log(".............oooooooooooooooooo", msg);
  panCardController.panCardInsertAndUpdate(msg, function (err, response) {
    if (err) {
      next(null, err);
    } else {
      next(null, { success: true, data: response });
    }
  })
}
handler.bankDetailsFromApp = function (msg, sesison, next) {
  console.log(".............oooooooooooooooooo", msg);
  delete msg.isLoggedIn;
  delete msg.__route__;
  db.saveBankDetailsuser({ playerId: msg.playerId }, msg, function (err, response) {
    if (err) {
      next({ success: false, data: "Something Went Wrong!! Please try it again." })
    } else {
      console.log("???????????????>>>>>>>>>", response);
      next(null, { success: true, data: "Bank Details Submitted Successfully." })
    }
  })
}
handler.spinTheWheel = function (msg, sesison, next) {
  db.findUser({ playerId: msg.playerId }, function (err, result) {
    if ('spinActivate' in result) {
      let currentTime = Date.now()
      if (currentTime < result.spinActivate) {
        let time = milliToTime.convert(result.spinActivate - currentTime)
        next(null, { success: false, info: " Oops !! Seems like you've already played today. Come back in " + time + "to play again !!" })
      } else {
        next(null, { success: true, data: { spinTheWheelPrize: systemConfig.spinTheWheelPrize, poolPrizeForDay: systemConfig.poolPrizeForDay } });
      }
    } else {
      next(null, { success: true, data: { spinTheWheelPrize: systemConfig.spinTheWheelPrize, poolPrizeForDay: systemConfig.poolPrizeForDay } });
    }
  })
}
handler.getSpinIndex = function (msg, session, next) {
  delete msg.__route__;
  delete msg.isLoggedIn;
  spinTheWheelHandler.spin(msg, function (err, response) {
    if (err) {
      next({ success: false, data: "Something Went Wrong" });
    } else {
      let spinActivate = (Date.now() + systemConfig.spinTime); // 86400000 for adding a day extra in current time 
      db.updatePlayerById(msg, { spinActivate: spinActivate }, function (err, result) {
        next(null, { success: true, data: response });
      })
    }
  });
}














}