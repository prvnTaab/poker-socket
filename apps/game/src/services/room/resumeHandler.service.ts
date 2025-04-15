import { Injectable } from "@nestjs/common";
import { systemConfig, stateOfX } from 'shared/common';
import { StartGameHandlerService } from "./startGameHandler.service";
import { BroadcastHandlerService } from "./broadcastHandler.service";




declare const pomelo:any;









@Injectable()
export class ResumeHandlerService  {



    constructor(

        private broadcastHandler:BroadcastHandlerService,
        private startGameHandler:StartGameHandlerService,
    ) {}


    



    /*===============================  START  ======================*/

    // New
    async resumeProcess(params: any): Promise<void> {
    
        const channel = pomelo.app.get('channelService').getChannel(params.channelId, false); // Added for channel is already present
        try {
            const resumeResponse = await pomelo.app.rpc.database.tableRemote.resume("session", params.request);
        
            if (resumeResponse.success) {
                let alreadySent = false;
    
                if (resumeResponse.state !== stateOfX.playerState.playing || (channel.channelType === stateOfX.gameType.tournament && resumeResponse.lastMove !== stateOfX.move.fold)) {
                    if (resumeResponse.state === stateOfX.playerState.outOfMoney) {
                        // resumeResponse.state = stateOfX.playerState.onBreak;
                        console.error(resumeResponse.state);
                    } else {
                        alreadySent = true;
                        this.broadcastHandler.firePlayerStateBroadcast({
                            channel: channel,
                            self: {},
                            playerId: params.request.playerId,
                            channelId: params.channelId,
                            state: resumeResponse.state
                        });
                    }
                }
    
                if (resumeResponse.isOutOfMoney && channel.channelType !== stateOfX.gameType.tournament) {
                    this.broadcastHandler.fireBankruptBroadcast({
                        self: params.self,
                        playerId: params.request.playerId,
                        channelId: params.channelId,
                        fromJoinWaitList: resumeResponse.fromJoinWaitList
                    });
                }
    
                if (!alreadySent) {
                    this.broadcastHandler.firePlayerStateBroadcast({
                        channel: channel,
                        self: {},
                        playerId: params.request.playerId,
                        channelId: params.channelId,
                        state: resumeResponse.state
                    });
                }
    
                // Timer added if Game is over and calculation is under progress and if Game start request came from here
                // then there is a chance that a new game will try to start and then Game over broadcast
                // fired to client, because of several delays added in Game over, Game Start etc for proper animation
                setTimeout(() => {
                    this.startGameHandler.startGame({
                        self: params.self,
                        session: params.session,
                        channelId: params.channelId,
                        channel: channel,
                        eventName: stateOfX.startGameEvent.resume
                    });
                }, Number(systemConfig.startGameAfterStartEvent) * 1000);
            } else {
                console.log(stateOfX.serverLogType.response, JSON.stringify(resumeResponse));
            }
        } catch (err) {
            console.error("Error in resumeProcess: ", err);
        }
    };
    

    // Old
    // var resumeProcess = function (params, cb) {
    //     console.log('Printing params in resume resumeProcess', params);
      
    //     var channel = pomelo.app.get('channelService').getChannel(params.channelId, false); //Added for channel is already present
    //     pomelo.app.rpc.database.tableRemote.resume("session", params.request, function (resumeResponse) {
    //     console.log('Printing params in resume tableRemote.resume', resumeResponse);
      
    //       if (resumeResponse.success) {
    //         cb(resumeResponse);
    //         let alreadySent= false;
    //         serverLog(stateOfX.serverLogType.response, 'Resume response: ' + JSON.stringify(resumeResponse));
    //         if (resumeResponse.state !== stateOfX.playerState.playing || (channel.channelType === stateOfX.gameType.tournament && resumeResponse.lastMove !== stateOfX.move.fold)) {
    //           if (resumeResponse.state === stateOfX.playerState.outOfMoney) {
    //             // resumeResponse.state = stateOfX.playerState.onBreak;
    //             console.error(resumeResponse.state);
    //           } else {
    //             alreadySent = true;
    //             broadcastHandler.firePlayerStateBroadcast({ channel: channel, self: {}, playerId: params.request.playerId, channelId: params.channelId, state: resumeResponse.state });
    //           }
    //         }
    //         if (resumeResponse.isOutOfMoney && channel.channelType !== stateOfX.gameType.tournament) {
    //           broadcastHandler.fireBankruptBroadcast({ self: params.self, playerId: params.request.playerId, channelId: params.channelId, fromJoinWaitList:resumeResponse.fromJoinWaitList });
    //         }
    //         if(!alreadySent){
    //             broadcastHandler.firePlayerStateBroadcast({ channel: channel, self: {}, playerId: params.request.playerId, channelId: params.channelId, state: resumeResponse.state });
    //         }
    //         // Timer added if Game is over and calculation is under progress and if Game start request came from here
    //         // then there is a chance that a new game will try to start and then Game over broadcast
    //         // fired to client, because of several delays added in Game over, Game Start etc for proper animation
    //         setTimeout(function () {
    //           startGameHandler.startGame({ self: params.self, session: params.session, channelId: params.channelId, channel: channel, eventName: stateOfX.startGameEvent.resume });
    //         }, parseInt(systemConfig.startGameAfterStartEvent) * 1000);
    //       } else {
    //         serverLog(stateOfX.serverLogType.response, JSON.stringify(resumeResponse));
    //         cb(resumeResponse);
    //       }
    //     });
    //   }
    /*===============================  END  ======================*/
      


    /*===============================  START  ======================*/
      // API - "SITIN"
      // player resumes in a table

    //   New
    async resume(params: any): Promise<void> {
        
        try {
            // Fetch systemFoldedCount asynchronously
            const systemFoldedCount = await pomelo.app.rpc.database.tableRemote.getPlayerAttribute(
                params.session,
                { channelId: params.channelId, playerId: params.request.playerId, key: "systemFoldedCount" }
            );
            
            console.log('Printing params in resume systemFoldedCount', systemFoldedCount);
    
            if (systemFoldedCount.success) {
                // Resetting player systemFoldedCount to 0 if player is taking a move
                if (systemFoldedCount.value > 0) {

                    // Pomelo Connection
                    await pomelo.app.rpc.database.tableRemote.setPlayerAttrib(
                        params.session,
                        { playerId: params.request.playerId, channelId: params.channelId, key: "systemFoldedCount", value: 0 }
                    );
                    // Pomelo Connection

                }
            }
    
            // Call resumeProcess and log the response
            const resumeProcessResponse = await this.resumeProcess(params);

            return resumeProcessResponse;
        } catch (err) {
            console.error("Error in resumeHandler.resume:", err);
        }
    };
    

    //   Old
    //   resumeHandler.resume = function (params, cb) {
        
    //     console.log('Printing params in resume ', params);
    //     pomelo.app.rpc.database.tableRemote.getPlayerAttribute(params.session, { channelId: params.channelId, playerId: params.request.playerId, key: "systemFoldedCount" }, function (systemFoldedCount) {
    //     console.log('Printing params in resume systemFoldedCount', systemFoldedCount);
          
    //       if (systemFoldedCount.success) {
    //         //  Added By Sahiq -- reseting player systemFoldedCount to 0 if player is taking move
    //         // console.log("______________________systemFoldedCount.success_______________________", systemFoldedCount)
    //         if (systemFoldedCount.value > 0) {
      
    //           pomelo.app.rpc.database.tableRemote.setPlayerAttrib(params.session, { playerId: params.request.playerId, channelId: params.channelId, key: "systemFoldedCount", value: 0 }, function (setPlayerAttribResponse) {
      
    //           });
    //         }
      
    //       }
      
    //     });
    //     resumeProcess(params, function (resumeProcessResponse) {
    //       cb(resumeProcessResponse);
      
    //       console.log('resumeProcessResponse', resumeProcessResponse);
    //     })
    //   }
    /*===============================  END  ======================*/
      


    /*===============================  START  ======================*/
      // API - "SITIN ALL"
      // player resume all tables

    //   New
    async resumeAll(params: any): Promise<any> {
        const sessionChannels = params.session.get("channels") || [];
    
        try {
            for (const sessionChannel of sessionChannels) {
                params.request.channelId = sessionChannel;
    
                // Call resumeProcess for each session channel
                await this.resumeProcess({ 
                    self: params.self, 
                    channelId: sessionChannel, 
                    session: params.session, 
                    request: params.request 
                });
    
            }
    
            // Return success when all channels are processed
            return { success: true };
        } catch (err) {
            // Handle any error that occurs during processing
            console.log(stateOfX.serverLogType.error, `Error in processing channels: ${err}`);
            return { success: false };
        }
    };
    

    //   Old
    //   resumeHandler.resumeAll = function (params, cb) {
    //     var sessionChannels = !!params.session.get("channels") ? params.session.get("channels") : [];
    //     serverLog(stateOfX.serverLogType.response, "session channels are - " + JSON.stringify(sessionChannels));
    //     async.eachSeries(sessionChannels, function (sessionChannel, ecb) {
    //       serverLog(stateOfX.serverLogType.response, "session channel is - " + sessionChannel);
    //       params.request.channelId = sessionChannel;
    //       resumeProcess({ self: params.self, channelId: sessionChannel, session: params.session, request: params.request }, function (resumeProcessResponse) {
    //         serverLog(stateOfX.serverLogType.response, "channel processed" + JSON.stringify(resumeProcessResponse));
    //         ecb();
    //       })
    //     }, function (err) {
    //       if (!err) {
    //         cb({ success: true });
    //       } else {
    //         cb({ success: false });
    //       }
    //     })
    //   }

    /*===============================  END  ======================*/












}