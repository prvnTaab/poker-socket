import { Injectable } from "@nestjs/common";
import { stateOfX } from 'shared/common';
import { ImdbDatabaseService } from "shared/common/datebase/Imdbdatabase.service";
import { PokerDatabaseService } from "shared/common/datebase/pokerdatabase.service";
import { validateKeySets } from "shared/common/utils/activity";





declare const pomelo:any;






@Injectable()
export class SessionHandlerService {



    constructor(
        private db: PokerDatabaseService,
        private imdb: ImdbDatabaseService,
    ) {}




    /*=====================================  START  =============================*/
        // ### This function is for bind user session

        // New
        
        async bindUserSession(msg: any): Promise<any> {
            try {
                const validated = await validateKeySets("Request", msg.self.app.serverType, "bindUserSession", msg);
        
                if (validated.success) {
                    const session = msg.session;
                    session.bind(msg.playerId);

                    session.on('closed', onUserLeave.bind(null, msg.self.app));
        
                    session.set("playerId", msg.playerId);


                    await new Promise<void>((resolve, reject) => {
                        session.push("playerId", (err: Error | null) => {
                            if (err) {
                                console.error('set playerId for session service failed! error is : %j', err.stack);
                                reject(err);
                            } else {
                                resolve();
                            }
                        });
                    });
        
                    session.set("playerName", msg.playerName);
                    await new Promise<void>((resolve, reject) => {
                        session.push("playerName", (err: Error | null) => {
                            if (err) {
                                console.error('set playerName for session service failed! error is : %j', err.stack);
                                reject(err);
                            } else {
                                resolve();
                            }
                        });
                    });
        
                    return { success: true };
                } else {
                    return validated;
                }
            } catch (err) {
                console.error('Error in bindUserSession:', err);
                return { success: false };
            }
        };
        

        // Old
    // sessionHandler.bindUserSession = function (msg, cb) {
    //     keyValidator.validateKeySets("Request", msg.self.app.serverType, "bindUserSession", msg, function (validated){
    //       if(validated.success) {
    //         var session = msg.session;
    //         session.bind(msg.playerId);
    //         session.on('closed', onUserLeave.bind(null, msg.self.app));
    //         // Set all session values
    //         session.set("playerId", msg.playerId);
    //         session.push("playerId",function (err){
    //           if(err) {
    //             console.error('set playerId for session service failed! error is : %j', err.stack);
    //             cb({success : false});
    //             return false;
    //           }
    //           cb({success : true});
    //           return true;
    //         });
    
    //         session.set("playerName", msg.playerName);
    //         session.push("playerName",function (err){
    //           if(err) {
    //             console.error('set playerName for session service failed! error is : %j', err.stack);
    //             cb({success : false});
    //             return false;
    //           }
    //           cb({success : true});
    //           return true;
    //         });
    //       } else {
    //         cb(validated);
    //       }
    //     })
    // }
    /*=====================================  END  =============================*/
  


    /*=====================================  START  =============================*/
  // ### Store channel with player's session
  // > When player session gets closed then handle event
  // > Remove player from all associated channels

//   New
async bindChannelInSession(params: any): Promise<any> {
    try {
        const validated = await validateKeySets("Request", params.self.app.serverType, "bindChannelInSession", params);

        if (validated.success) {
            let sessionChannels = params.session.get("channels") ?? [];

            if (sessionChannels.indexOf(params.channelId) < 0) {
                sessionChannels.push(params.channelId);
                params.session.set("channels", sessionChannels);

                try {
                    await new Promise<void>((resolve, reject) => {
                        params.session.push("channels", (err: Error | null) => {
                            if (err) {
                                console.error('set channels for session service failed! error is : %j', err.stack);
                                reject(err);
                            } else {
                                resolve();
                            }
                        });
                    });
                } catch (err) {
                    console.error('Error while pushing channels:', err);
                }
            } else {
                console.error('This channel already exists in player sessions');
            }

            return { success: true };
        } else {
            return validated;
        }
    } catch (err) {
        console.error('Error in bindChannelInSession:', err);
        return { success: false };
    }
};

//   Old
//   sessionHandler.bindChannelInSession = function (params, cb) {
//     keyValidator.validateKeySets("Request", params.self.app.serverType, "bindChannelInSession", params, function (validated){
//       if(validated.success) {
//         // Get channels from session of this player
//         var sessionChannels =  !!params.session.get("channels") ? params.session.get("channels") : [];
//         if(sessionChannels.indexOf(params.channelId) < 0) {
//           sessionChannels.push(params.channelId);
//           params.session.set("channels", sessionChannels);
//           params.session.push("channels", function(err){
//             if(err) {
//               console.error('set channels for session service failed! error is : %j', err.stack);
//             }
//           });
//         } else {
//           console.error('This channel already exists in player sessions');
//         }
//         cb({success: true});
//       } else {
//         cb(validated);
//       }
//     });
//   }
    /*=====================================  END  =============================*/
  

    /*=====================================  START  =============================*/
  // record last activity time in user session
  // as a key value in session.settings

    //   New
    async recordLastActivityTime(params: any): Promise<any> {
        if (params && params.session && params.session.set && params.session.push) {
            if ((params.msg.isRequested && params.msg.isRequested === true) || !params.msg.isRequested) {
                params.session.set("lastActiveTime", Number(new Date()));

                try {
                    await new Promise<void>((resolve, reject) => {
                        params.session.push("lastActiveTime", (err: Error | null) => {
                            if (err) {
                                reject(err);
                            } else {
                                resolve();
                            }
                        });
                    });
                } catch (err) {
                    // Error already logged inside push callback
                }

            } else {
                console.log(stateOfX.serverLogType.info, 'No need to record time this api is called from server');
            }
        }
    };

    //   Old
    //   sessionHandler.recordLastActivityTime = function (params) {
    //     if ((params && params.session && params.session.set && params.session.push)) {
    //       if((params.msg.isRequested && params.msg.isRequested === true) || !params.msg.isRequested) {
    //         params.session.set("lastActiveTime" , Number(new Date()));
    //         params.session.push("lastActiveTime",function (err){
    //           if(err) {
    //             serverLog(stateOfX.serverLogType.error, 'set lastActiveTime for session service failed! error is : %j', err.stack);
    //           } else {
    //             serverLog(stateOfX.serverLogType.info, 'set lastActiveTime for session service success');
    //           }
    //         });
    //         serverLog(stateOfX.serverLogType.info, 'Last active time recorded for - ' + params.session.uid + ' => ' + params.session.get("lastActiveTime"));
    //     } else {
    //       serverLog(stateOfX.serverLogType.info, 'No need to record time this api is called from server');
    //     }
    //     }
    //   }
    /*=====================================  END  =============================*/
  
 
    /*=====================================  START  =============================*/
  /**
   * this function removes player from all tables
   * @method removefromChannels
   * @param  {object}           self     
   * @param  {object}           app      
   * @param  {object}           session  contains session
   * @param  {Function}         callback callback function
   * @return {callback}           callback
   */

//   New
async removefromChannels(self: any, app: any, session: any): Promise<any> {

    const sessionChannels = session.get("channels") || [];

    if (sessionChannels.length > 0) {

        for (const sessionChannel of sessionChannels) {

            try {
                const table = await this.db.findTableById(sessionChannel);

                if (table) {
                    if (table.channelVariation === stateOfX.channelVariation.ofc) {
                        continue;
                    } else {
                        await new Promise<void>((resolve) => {
                            self.leaveTable(
                                {
                                    self: { app: app, keepThisApp: true },
                                    playerId: session.uid,
                                    isStandup: true,
                                    channelId: sessionChannel,
                                    isRequested: false,
                                    playerName: session.playerName
                                },
                                session,
                                () => {
                                    resolve();
                                }
                            );
                        });
                    }
                } else {
                    console.log(stateOfX.serverLogType.error, 'Error while leaving player from channel - ' + sessionChannel + ' ! DB error - ' + JSON.stringify(null));
                }
            } catch (error) {
                console.log(stateOfX.serverLogType.error, 'Error during processing channel - ' + sessionChannel + ' Error: ' + JSON.stringify(error));
            }
        }

        console.log(stateOfX.serverLogType.info, 'Player has been left from all the channels joined');
    } else {
        console.log(stateOfX.serverLogType.info, 'Player was not joined into any channel!');
    }
}

//   Old
//   var removefromChannels = function(self, app, session, callback) {
//     serverLog(stateOfX.serverLogType.info, 'in function removefromChannels.');
//     var sessionChannels = !!session.get("channels") ? session.get("channels") : [];
//     serverLog(stateOfX.serverLogType.info, 'session channels are - ' + JSON.stringify(sessionChannels))
//     if(sessionChannels.length > 0) {
//       serverLog(stateOfX.serverLogType.info, 'Channels joined in this session - ' + JSON.stringify(sessionChannels));
//       async.each(sessionChannels, function(sessionChannel, ecb){
//         serverLog(stateOfX.serverLogType.info, 'Removing from channel - ' + JSON.stringify(sessionChannel));
//         db.findTableById(sessionChannel, function(err, table){
//           if(!err && table) {
//             if(table.channelVariation === stateOfX.channelVariation.ofc) {
//               serverLog(stateOfX.serverLogType.info, 'Player left from session close event OFC table.');
//               ecb();
//             } else {
//               self.leaveTable({self: {app: app, keepThisApp: true}, playerId: session.uid, isStandup: true, channelId: sessionChannel, isRequested: false, playerName: session.playerName}, session, function(){
//                 serverLog(stateOfX.serverLogType.error, 'Player left, session killed !');
//                 ecb();
//               });
//             }
//           } else {
//             serverLog(stateOfX.serverLogType.error, 'Error while leaving player from channel - ' + sessionChannel + ' ! DB error - ' + JSON.stringify(err))
//             ecb()
//           }
//         })
//       }, function(err){
//         if(err) {
//           serverLog(stateOfX.serverLogType.error, 'Removing player from channels failed!')
//           callback(null, self, app, session);
//         } else {
//           serverLog(stateOfX.serverLogType.info, 'Player has been left form all the channels joined');
//           callback(null, self, app, session);
//         }
//       });
//     } else {
//       serverLog(stateOfX.serverLogType.info, 'Player was not joined into any channel!');
//       callback(null, self, app, session);
//     }
//   }
    /*=====================================  END  =============================*/
  


    /*=====================================  START  =============================*/
  /**
   * this function removes player from waiting
   * @method removeFromWaiting
   * @param  {object}           self     
   * @param  {object}           app      
   * @param  {object}           session  contains session
   * @param  {Function}         callback callback function
   * @return {callback}           callback
   */

    //   New
    async removeFromWaiting(self: any, app: any, session: any): Promise<void> {

        const waitingChannels = session.get("waitingChannels") || [];

        if (waitingChannels.length > 0) {

            for (const waitingChannel of waitingChannels) {

                try {
                    const table = await this.db.findTableById(waitingChannel);

                    if (table) {
                        if (table.channelVariation === stateOfX.channelVariation.ofc) {
                            continue;
                        } else {
                            await new Promise<void>((resolve) => {
                                app.rpc.database.requestRemote.removeWaitingPlayer(
                                    session,
                                    { playerId: session.uid, channelId: waitingChannel, playerName: session.playerName },
                                    (_leaveWaitingResponse: any) => {
                                        resolve();
                                    }
                                );
                            });
                        }
                    } else {
                        console.log(stateOfX.serverLogType.error, 'Error while leaving player from channel - ' + waitingChannel + ' ! DB error - ' + JSON.stringify(null));
                    }
                } catch (error) {
                    console.log(stateOfX.serverLogType.error, 'Error during processing channel - ' + waitingChannel + ' Error: ' + JSON.stringify(error));
                }
            }

        } else {
            console.log(stateOfX.serverLogType.info, 'Player was not joined any waiting list!');
        }
    }


    //   Old
    //   var removeFromWaiting = function(self, app, session, callback) {
    //     serverLog(stateOfX.serverLogType.info, 'in function removeFromWaiting.');
    //     var waitingChannels = !!session.get("waitingChannels") ? session.get("waitingChannels") : [];
    //     serverLog(stateOfX.serverLogType.info, 'waiting channels are - ' + JSON.stringify(waitingChannels))
    //     if(waitingChannels.length > 0) {
    //       serverLog(stateOfX.serverLogType.info, 'Channels joined in this session - ' + JSON.stringify(waitingChannels));
    //       async.each(waitingChannels, function(waitingChannel, ecb){
    //         serverLog(stateOfX.serverLogType.info, 'Removing from channel - ' + JSON.stringify(waitingChannel));
    //         db.findTableById(waitingChannel, function(err, table){
    //           if(!err && table) {
    //             if(table.channelVariation === stateOfX.channelVariation.ofc) {
    //               serverLog(stateOfX.serverLogType.info, 'Player left from session close event OFC table.');
    //               ecb();
    //             } else {
    //               app.rpc.database.requestRemote.removeWaitingPlayer(session, {playerId: session.uid, channelId: waitingChannel, playerName: session.playerName}, function (leaveWaitingResponse) {
    //                 serverLog(stateOfX.serverLogType.info, 'Player removed from waiting list!');
    //                 ecb();
    //               });
    //             }
    //           } else {
    //             serverLog(stateOfX.serverLogType.error, 'Error while leaving player from channel - ' + waitingChannel + ' ! DB error - ' + JSON.stringify(err))
    //             ecb()
    //           }
    //         })
    //       }, function(err){
    //         if(err) {
    //           serverLog(stateOfX.serverLogType.error, 'Removing player from channels failed!')
    //           callback(null, self, app, session);
    //         } else {
    //           serverLog(stateOfX.serverLogType.info, 'Player has been left form all the channels joined');
    //           callback(null, self, app, session);
    //         }
    //       });
    //     } else {
    //       serverLog(stateOfX.serverLogType.info, 'Player was not joined any waiting list!');
    //       callback(null, self, app, session);
    //     }
    //   }
    /*=====================================  END  =============================*/
  

    /*=====================================  END  =============================*/
    /**
     * this function removes player's join record
     * @method removeJoinRecord
     * @param  {object}           self     
     * @param  {object}           app      
     * @param  {object}           session  contains session
     * @param  {Function}         callback callback function
     * @return {callback}           callback
     */

    //   New
    async removeJoinRecord(self: any, app: any, session: any): Promise<any> {
        try {
            const result = await this.imdb.removePlayerJoin({ playerId: session.uid });

            console.log(stateOfX.serverLogType.info, 'All join record successfully removed');
        } catch (err) {
            console.log(stateOfX.serverLogType.info, 'err in remove join record');
        }
        return [null, self, app, session];
    }


    //   Old
    //   var removeJoinRecord = function(self, app, session, callback) {
    //     imdb.removePlayerJoin({playerId: session.uid}, function(err, result) {
    //       if(!err) {
    //         serverLog(stateOfX.serverLogType.info, 'All join record successfully removed');
    //       } else {
    //         serverLog(stateOfX.serverLogType.info, 'err in remove join record');
    //       }
    //       callback(null, self, app, session);
    //     })
    //   }
    /*=====================================  END  =============================*/

  
  
    /*=====================================  START  =============================*/
    /**
     * this function removes player's activity
     * @method removePlayerActivity
     * @param  {object}           self     
     * @param  {object}           app      
     * @param  {object}           session  contains session
     * @param  {Function}         callback callback function
     * @return {callback}           callback
     */

    //   New
    async removePlayerActivity(self: any, app: any, session: any): Promise<any> {
        try {
            const result = await this.imdb.removeActivity({ playerId: session.uid });
        } catch (err) {
            console.log(stateOfX.serverLogType.info, 'err in remove player activity');
        }
        return [null, self, app, session];
    }


    //   Old
    //   var removePlayerActivity = function(self, app, session, callback) {
    //     imdb.removeActivity({playerId: session.uid}, function(err, result) {
    //       if(!err) {
    //         serverLog(stateOfX.serverLogType.info, 'Allplayer activity record successfully removed');
    //       } else {
    //         serverLog(stateOfX.serverLogType.info, 'err in remove player activity');
    //       }
    //       callback(null, self, app, session);
    //     })
    //   }
    /*=====================================  END  =============================*/



    /*====================================  START  ======================================*/
    /**
 * this function removes user from all tables in series of functions
 * @method leaveUserFromAllChannels
 * @param  {object}                 self     
 * @param  {object}                 app      
 * @param  {object}                 session  contains session
 * @param  {Function}               callback callback function
 * @return {callback}                 callback
 */

    // New
    async leaveUserFromAllChannels(self: any, app: any, session: any): Promise<void> {
        // try {
        //   await this.removeFromChannels(self, app, session);
        //   await this.removeFromWaiting();
        //   await this.removePlayerActivity();
        //   await this.removeJoinRecord();
    
        //   serverLog(stateOfX.serverLogType.info, 'Leave player from channel and waiting list processed successfully!');
        // } catch (err) {
        //   serverLog(stateOfX.serverLogType.error, 'Leave player from channel and waiting list failed!', err);
        //   throw {
        //     success: false,
        //     isRetry: false,
        //     isDisplay: true,
        //     channelId: '',
        //     info: popupTextManager.falseMessages.LEAVEUSERFROMALLCHANNEL_SESSIONHANDLER,
        //   };
        // }
      }

    // Old
// sessionHandler.leaveUserFromAllChannels = function (self, app, session, callback) {
//     //  console.log("I am not to be called");
//       // serverLog(stateOfX.serverLogType.info, 'in function leaveUserFromAllChannels.');
//       // async.waterfall([
//       //   async.apply(removefromChannels, self, app, session),
//       //   removeFromWaiting,
//       //   removePlayerActivity,
//       //   removeJoinRecord
//       //   // async.apply(removeFromWaiting, self, app, session)
//       // ], function(err, response){
//       //   if(err) {
//       //     serverLog(stateOfX.serverLogType.error, 'Leave player from channel and waiting list failed!');
//       //     callback({success: false, isRetry: false, isDisplay: true, channelId: "", info: popupTextManager.falseMessages.LEAVEUSERFROMALLCHANNEL_SESSIONHANDLER});
//       //     //callback({success: false, info: "Unable to process leave from channels !"});
//       //   } else {
//       //     serverLog(stateOfX.serverLogType.info, 'Leave player from channel and waiting list processed successfully!');
//       //     callback();
//       //   }
//       // });
//     };
    /*====================================  END  ======================================*/







}