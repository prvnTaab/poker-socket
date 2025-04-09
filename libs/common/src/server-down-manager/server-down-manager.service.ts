import { Injectable } from '@nestjs/common';


/*
* @Author: sushiljainam
* @Date:   2017-12-02 17:12:45
* @Last Modified by:   sushiljainam
* @Last Modified time: 2018-04-20 21:25:14
*/
import { PokerDatebaseService } from '../datebase/pokerdatebase.service';
import { ImdbDatebaseService } from '../datebase/Imdbdatebase.service copy';
import { systemConfig } from '..';
import * as async from "async";

const confServerDown :any = systemConfig.serverDown || {};

// import * as broadcastHandler from "../servers/room/handler/broadcastHandler";
// import * as actionHandler from '../servers/room/handler/actionHandler';



@Injectable()
export class ServerDownManagerService {

constructor(private adminDb: PokerDatebaseService,
    private imdb :ImdbDatebaseService
){

}

private pomelo;

// generic function to drop mail
// to some people
// about maintenance
 dropMail (data: any): void {
  data.mailCreatedBy = { serverId: this.pomelo.app.serverId, timestamp: Number(new Date()) };
  const mailTo = confServerDown.reportTos;
  this.pomelo.app.get('devMailer').sendToAdminMulti(data, mailTo, data.subject || "from " + systemConfig.originalName + " - Server Code");
};

// enable all services
// save in app and db
async  enableAll(app: any, message: any): Promise<void> {
  const stateOfServer: any = app.get('serverStates') || {};
  stateOfServer.createdAt = Date.now();
  stateOfServer.disableLogin = {
    status: false,
    byScheduleId: message.meta?.scheduleId,
    timestamp: new Date().getTime()
  };

  stateOfServer.disableGameStart = {
    status: false,
    byScheduleId: message.meta?.scheduleId,
    timestamp: new Date().getTime()
  };

  stateOfServer.disableJoin = {
    status: false,
    byScheduleId: message.meta?.scheduleId,
    timestamp: new Date().getTime()
  };

  stateOfServer.disableSit = {
    status: false,
    byScheduleId: message.meta?.scheduleId,
    timestamp: new Date().getTime()
  };

  app.set('serverStates', stateOfServer);

  this.dropMail({
    subject: `Server Up Process: ${systemConfig.userNameForMail}`,
    msg: "Reporting from different server instances. This server has enabled all blocked tasks- login, join, sit, gamestart. Check if any server(s) have not reported in near time same message."
  });

  const query = { type: 'serverStates', serverId: app.serverId };
  try {
    await this.adminDb.updateServerStates(query, { $set: stateOfServer, $setOnInsert: query });
  } catch (err) {
    console.log('Error updating server states:');
  }
};

// disable a service
// disable login
// save in app and db
async disableLogin(app: any, message: any): Promise<any> {
  const stateOfServer: any = app.get('serverStates') || {};
  stateOfServer.disableLogin = {
    status: true,
    byScheduleId: message.meta?.scheduleId,
    timestamp: new Date().getTime()
  };

  app.set('serverStates', stateOfServer);
  const query = { type: 'serverStates', serverId: app.serverId };
  
  try {
    await this.adminDb.updateServerStates(query, { $set: stateOfServer, $setOnInsert: query });
  } catch (err) {
    console.log('Error updating server states:', err);
  }

}

// disable a service
// disable new game start
// save in app and db
async  disableGameStart(app: any, message: any): Promise<void> {
  const stateOfServer: any = app.get('serverStates') || {};
  stateOfServer.disableGameStart = {
    status: true,
    byScheduleId: message.meta?.scheduleId,
    timestamp: new Date().getTime()
  };

  app.set('serverStates', stateOfServer);
  const query = { type: 'serverStates', serverId: app.serverId };
  
  try {
    await this.adminDb.updateServerStates(query, { $set: stateOfServer, $setOnInsert: query });
  } catch (err) {
    console.log('Error updating server states:', err);
  }

}

// disable a service
// disable join
// save in app and db
async  disableJoin(app: any, message: any): Promise<void> {
  const stateOfServer: any = app.get('serverStates') || {};
  stateOfServer.disableJoin = {
    status: true,
    byScheduleId: message.meta?.scheduleId,
    timestamp: new Date().getTime()
  };

  app.set('serverStates', stateOfServer);
  const query = { type: 'serverStates', serverId: app.serverId };
  
  try {
    await this.adminDb.updateServerStates(query, { $set: stateOfServer, $setOnInsert: query });
  } catch (err) {
    console.log('Error updating server states:', err);
  }
 
}

// disable a service
// disable sit
// save in app and db
async  disableSit(app: any, message: any): Promise<void> {
  const stateOfServer: any = app.get('serverStates') || {};
  stateOfServer.disableSit = {
    status: true,
    byScheduleId: message.meta?.scheduleId,
    timestamp: new Date().getTime()
  };

  app.set('serverStates', stateOfServer);
  const query = { type: 'serverStates', serverId: app.serverId };
  
  try {
    await this.adminDb.updateServerStates(query, { $set: stateOfServer, $setOnInsert: query });
  } catch (err) {
    console.log('Error updating server states:', err);
  }
 
}

// prepare receivers
// inform a message to all receivers
// using RPC in loop
async  informServers(app: any, message: any): Promise<void> {
  const receiverServerIds: string[] = [];
  const namespace = 'user';
  const service = 'adminManagerRemote';
  const method = 'inform';

  // find all receiver servers
  if (message.to.all === true) {
    const servers = app.servers; // is an object - 
    for (const key of Object.keys(servers)) {
      receiverServerIds.push(servers[key].id);
    }
  } else {
    if (message.to && message.to.serverType && (message.to.serverType instanceof Array)) {
      for (let i = 0; i < message.to.serverType.length; i++) {
        const servers = app.getServersByType(message.to.serverType[i]);
        for (let j = 0; j < servers.length; j++) {
          receiverServerIds.push(servers[j].id);
        }
      }
    }
    if (message.to && message.to.serverId && (message.to.serverId instanceof Array)) {
      for (let i = 0; i < message.to.serverId.length; i++) {
        receiverServerIds.push(message.to.serverId[i]);
      }
    }
  }

  // send message
  if (receiverServerIds.length > 0) {
    const promises = receiverServerIds.map(serverId => {
      return new Promise<void>(resolve => {
        app.rpcInvoke(serverId, { namespace, service, method, args: [message] }, () => {
          resolve();
        });
      });
    });

    await Promise.all(promises);
    console.log('all messages sent, rpcInvoke all done.');
  }
}

// fetch services disable states from db and update in app
 async recoverServerStatesFromDB(app: any): Promise<{ success: boolean, info: string }> {
  const query = { type: 'serverStates', serverId: app.serverId };
  
  try {
    const result = await this.adminDb.findServerStates(query);
    const stateOfServer: any = app.get('serverStates') || {};
    
    if (result instanceof Object) {
      stateOfServer.disableLogin = result.disableLogin;
      stateOfServer.disableGameStart = result.disableGameStart;
      stateOfServer.disableJoin = result.disableJoin;
      stateOfServer.disableSit = result.disableSit;
    }

    app.set('serverStates', stateOfServer);
    return { success: true, info: "server states recovered." };
  } catch (err) {
    console.log('db query failed - findServerStates');
    process.exit();
    return { success: false, info: "Failed to recover server states" }; // This will never execute due to process.exit()
  }
}

// fetch server states - for dashboard
 async fetchServerState(): Promise<{ success: boolean, status?: boolean, info: string }> {
  try {
    const result = await this.adminDb.findAllServerStates({ type: 'serverStates' });
    
    if (!result || result.length < 0) {
      return { success: true, status: true, info: "Everything is up and running." };
    } else {
      let status = true;
      for (let i = 0; i < result.length; i++) {
        if (result[i].disableSit && result[i].disableSit.status == true) {
          status = false;
          break;
        }
        if (result[i].disableLogin && result[i].disableLogin.status == true) {
          status = false;
          break;
        }
      }
      
      if (status) {
        return { success: true, status: true, info: "Everything is up and running." };
      } else {
        return { 
          success: true, 
          status: false, 
          info: "Some/all servers are under maintenance, and has disabled some features. Click 'Switch to running' to make all servers up and running. By clicking on this, you understand its risks and all impacts." 
        };
      }
    }
  } catch (err) {
    return { success: false, info: 'db query failed - findAllServerStates' };
  }
}

// start enabling all services
// prepare message
// set receivers to 'all'
 async startEnablingAll(app: any, scheduleId?: string): Promise<void> {
  const message: any = {
    from: {
      serverType: app.serverType,
      serverId: app.serverId,
      ackRcv: false,
      ackTaskDone: false,
      timestamp: new Date().getTime()
    },
    to: {
      all: true
    },
    title: 'enableAll',
    meta: {
      scheduleId: scheduleId || ""
    }
  };
  
  await this.informServers(app, message);
}

// start disabling a service - login
// prepare message
// set receivers to 'gate connector'
 async startDisablingLogin(app: any, scheduleId?: string): Promise<void> {
  const message: any = {
    from: {
      serverType: app.serverType,
      serverId: app.serverId,
      ackRcv: false,
      ackTaskDone: false,
      timestamp: new Date().getTime()
    },
    to: {
      serverType: ['gate', 'connector']
    },
    title: 'disableLogin',
    meta: {
      scheduleId: scheduleId
    }
  };
  
  await this.informServers(app, message);
}

// start disabling a service - game start
// prepare message
// set receivers to 'all'
 async  startDisablingGameStart(app: any, scheduleId?: string): Promise<void> {
  const message: any = {
    from: {
      serverType: app.serverType,
      serverId: app.serverId,
      ackRcv: false,
      ackTaskDone: true,
      timestamp: new Date().getTime()
    },
    to: {
      all: true
    },
    title: 'disableGameStart',
    meta: {
      scheduleId: scheduleId
    }
  };
  
  await this.informServers(app, message);
}

// render all players leave
// altogether
 renderLeaveOnClient (actionHandlerObj: any, params: any, item: any): void {
  setTimeout(() => {
    actionHandlerObj.handleLeave({
      session: {}, 
      channel: params.channel,
      channelId: params.channelId,
      response: { 
        playerLength: 0,
        isSeatsAvailable: false,
        broadcast: {
          success: true,
          channelId: params.channelId,
          playerId: item.playerId,
          playerName: item.playerName,
          isStandup: false
        }
      },
      request: { playerId: item.playerId, isStandup: false }
    });
  }, 100);
  
  setTimeout(() => {
    actionHandlerObj.handleLeave({
      self: params, 
      session: {}, 
      channel: params.channel,
      channelId: params.channelId,
      response: { 
        playerLength: 0,
        isSeatsAvailable: false,
        broadcast: {
          success: true,
          channelId: params.channelId,
          playerId: item.playerId,
          playerName: item.playerName,
          isStandup: false
        }
      },
      request: { playerId: item.playerId, isStandup: false }
    }); // loop
  }, 200);
};

// start auto leave for all players
// internal leave
// only affects database
// inform client separately
// async  startForcedLeave(app: any, scheduleId?: string): Promise<void> {
  
//   if (app.serverType == 'room') {
//     const params: any = {};
    
//     try {
//       const tables = await this.imdb.getAllTable({ serverId: app.serverId })
      
//       params.tables = tables;
//       params.totalSittingPlayers = 0;
      
//       for (let i = 0; i < params.tables.length; i++) {
//         params.totalSittingPlayers += params.tables[i].players.length;
//         const channel = app.get('channelService').getChannel(params.tables[i].channelId);
        
//         if (channel) {
//           setTimeout(() => {
//             this.broadcastHandler.serverDownBroadcast({
//               channelId: (channel.name), 
//               heading: 'Server down',
//               info: 'Everybody will be made leave his/her seat, forcefully. Server is going under maintenance.', 
//               buttonCode: 1
//             });
//           }, 50);
//         }
//       }
      
//       params.totalLeaveSuccess = 0;
//       params.totalLeavefail = 0;
      
//       for (const table of params.tables) {
//         for (const player of table.players) {
//           try {
//             const leaveResponse = await new Promise<any>((resolve) => {
//               app.rpc.database.tableRemote.leave(
//                 {}, 
//                 { 
//                   isRequested: false, 
//                   playerId: player.playerId, 
//                   channelId: table.channelId, 
//                   isStandup: false, 
//                   playerName: player.playerName 
//                 }, 
//                 resolve
//               );
//             });
            
//             if (leaveResponse.success) {
//               params.totalLeaveSuccess += 1;
//               const channel = app.get('channelService').getChannel(table.channelId);
//               if (channel) {
//                 this.renderLeaveOnClient(actionHandler, { channel: channel, channelId: table.channelId }, { playerId: player.playerId, playerName: player.playerName });
//               }
//             } else {
//               params.totalLeavefail += 1;
//             }
//           } catch (err) {
//             params.totalLeavefail += 1;
//           }
//         }
//       }
      
//       if (params.totalSittingPlayers == (params.totalLeaveSuccess + params.totalLeavefail)) {
//         if (params.totalSittingPlayers == params.totalLeaveSuccess) {
//         }
//         if (params.totalLeavefail > 0) {
//           setTimeout(() => this.startForcedLeave(app, scheduleId), (confServerDown.iterativeForceLeaveAfter_Minutes || 2) * 60 * 1000);
//         }
//       }
      
//     } catch (err) {
//     }
//   } else {
//   }
// }

// kick sessions with reason
// logout for everybody
// runs at every connector
 kickSessions(app: any, data: any): void {
  this.dropMail({
    subject: `Scheduling Server Down - ${systemConfig.userNameForMail}: Kicking Users Started`, 
    msg: "Players will be made force LOG-OUT now. Reporting from different (connector) server instances. This is last step of SERVER DOWN PROCESS. Check for a clean cluster and PUT IT DOWN."
  });
  
  app.sessionService.forEachSession((session: any) => {
    app.sessionService.kickBySessionId(session.id, 'elseWhere-ServerDown');
  });
}

// start a service - force logout
// prepare message
// set receivers to 'connector'
async  startKickingSessions(app: any, data: any): Promise<void> {
  const message: any = {
    from: {
      serverType: app.serverType,
      serverId: app.serverId,
      ackRcv: false,
      ackTaskDone: false,
      timestamp: new Date().getTime()
    },
    to: {
      serverType: ['connector']
    },
    title: 'kickSessions',
    meta: {
      scheduleId: data.meta && data.meta.scheduleId
    }
  };
  
  await this.informServers(app, message);
}

// start a service - force leave
// prepare message
// set receivers to 'room'
 async startForcedLeave(app: any, scheduleId?: string): Promise<void> {
  const message: any = {
    from: {
      serverType: app.serverType,
      serverId: app.serverId,
      ackRcv: false,
      ackTaskDone: false,
      timestamp: new Date().getTime()
    },
    to: {
      serverType: ['room']
    },
    title: 'forceLeave',
    meta: {
      scheduleId: scheduleId
    }
  };
  
  await this.informServers(app, message);
  
  setTimeout(() => {
    this.startKickingSessions(app, message);
  }, (confServerDown.startKickSessionAfterStartForceLeave_Minutes || 2) * 60 * 1000);
}

// message received on this server
// sent by any server
 async  msgRcvd(app: any, message: any): Promise<string | null> {
  if (!(message && message.title)) {
    return 'message title is mandatory.';
  }
  
  switch(message.title) {
    case 'enableAll': 
      await this.enableAll(app, message); 
      break;
    case 'disableLogin': 
      await this.disableLogin(app, message); 
      break;
    case 'disableGameStart': 
      await this.disableGameStart(app, message); 
      break;
    case 'forceLeave': 
      this.startForcedLeave(app, message.meta?.scheduleId); 
      await this.disableJoin(app, message); 
      await this.disableSit(app, message); 
      break;
    case 'kickSessions': 
      this.kickSessions(app, message); 
      break;
    default: 
      return 'message title is invalid';
  }
  
  if (message.from.ackRcv) {
    // TODO - low priority
  }
  
  return null;
}

// check service state in app context
checkServerState(event: string, app: any): boolean {
  return false;
}

// check client version status by db
 async checkClientStatus(event: string, msg: any, app: any): Promise<any> {
  if ((!msg.deviceType) || (!msg.appVersion)) {
    return { success: false };
  }
  
  try {
    const results = await this.adminDb.findGameVersions({ deviceType: msg.deviceType, appVersion: msg.appVersion });
    
    if (!results || results.length === 0) {
      return { success: false };
    }
    
    const result = results[0];
    if (result.isUpdateRequired) {
      let infoUpdateNeeded = "An updated version is required to continue playing the game.";
      
      if (msg.deviceType === "website" || msg.deviceType === "browser") {
        infoUpdateNeeded = "An updated version is required to continue playing the game. Kindly reload the game.";
      } else if (msg.deviceType === "iosApp" || msg.deviceType === "androidApp") {
        infoUpdateNeeded = "An updated version is required to continue playing the game. Kindly download/install the new build.";
      }
      
      return { 
        success: false, 
        info: infoUpdateNeeded, 
        errorType: "5011" /*update game code*/
      };
    } else if (result.isInMaintainance) {
      return { 
        success: false, 
        info: "Server is under maintenance. Please try again later." 
      };
    } else {
      return { success: true };
    }
    
  } catch (err) {
    return { success: false };
  }
}




}
