// import { Injectable } from "@nestjs/common";
// import { validateKeySets } from "shared/common/utils/activity";
// import { PokerDatabaseService } from "shared/common/utils/pokerdatabase.service";
// import { Socket } from "socket.io";
// import { RedisSessionService } from "../redis/redis-session.service";
// import { ServerDownManagerService } from "shared/common/server-down-manager/server-down-manager.service";
// import { RoomManagerService } from "../room-manager/room-manager.service";
// import { ImdbDatabaseService } from "shared/common/utils/Imdbdatabase.service";
// import { popupTextManager, stateOfX, systemConfig } from "shared/common";
// import { BroadcastHandlerService } from "../services/room/broadcastHandler.service";
// import { JoinRequestUtilService } from "../services/room/joinRequestUtil.service";






// @Injectable()
// export class JoinChannelEvent {

//     private callTimerFromDb = 0;

//     constructor(
//         private readonly db: PokerDatabaseService, // Common
//         private readonly imdb: ImdbDatabaseService, // Common
//         private readonly redisSessionService: RedisSessionService, // Common
//         private readonly serverDownManager: ServerDownManagerService, // Common
//         private readonly roomManagerService: RoomManagerService, // Common
//         private readonly broadcastHandler: BroadcastHandlerService, //Common
//         private readonly joinRequestUtil:JoinRequestUtilService

//     ) { }



//     public async joinChannel(client: Socket, msg: any): Promise<any> {
//         // Simulate setTimeout
//         setTimeout(() => {
//             this.similarTableBroadcast(msg);
//         }, 1000);

//         if (this.serverDownManager.checkServerState('joinReq')) {
//             return {
//                 success: false,
//                 channelId: msg.channelId || "",
//                 info: "Server is going under maintenance. No new game will start now."
//             };
//         }

//         await this.redisSessionService.recordLastActivityTime(msg);

//         const validated = await validateKeySets("Request", "connector", "joinChannel", msg);


//         if (!validated.success) {
//             return validated;
//         }

//         // Socket.IO handles channel creation when joining
//         await client.join(msg.channelId);

//         const channelId = msg.channelId;

//         // Optional: store or fetch room data (if needed)
//         const channel = await this.roomManagerService.getOrCreateRoom(channelId);

//         const deviceType = await this.redisSessionService.getDeviceType(client.id);

//         // console.log("---------Channel-----",channel)

//         const processJoinResponse = await this.processJoin({
//             channel,
//             channelId: msg.channelId,
//             channelType: msg.channelType,
//             tableId: msg.tableId,
//             playerId: msg.playerId,
//             playerName: msg.playerName,
//             password: msg.password,
//             networkIp: msg.networkIp,
//             deviceType
//         });

//         console.log("---------- Inside joinChannel----------")

//         const res = await this.imdb.getCardShow({ channelId });

//         if (res?.length > 0) {
//             const eyeResponse = res.map(result => ({
//                 playerId: result.playerId,
//                 channelId: result.channelId,
//                 cards: result.cards
//             }));

//             await this.broadcastHandler.sendMessageToUser({
//                 msg: {
//                     playerId: msg.playerId,
//                     channelId: msg.channelId,
//                     data: eyeResponse
//                 },
//                 playerId: msg.playerId,
//                 route: "muckedCardsUpdate"
//             });
//         }

//         const myparams: any = {};
//         myparams.channel = channel;

//         if (
//             (channel.playerSimpleMoveWithTimeBank || channel.extraTurnTimeReference) &&
//             processJoinResponse?.tableDetails
//         ) {
//             processJoinResponse.tableDetails.finalTimeLeft = Math.floor(
//                 channel.updatedTimeBank - (Date.now() - channel.startedAt) / 1000
//             );

//             if (channel.currentMovePlayer === msg.playerId) {
//                 await this.roomRemote.playerReconnected(msg);
//             }
//         }

//         const evResponse = await this.requestRemote.checkEvHappens(msg);

//         if (
//             evResponse.success &&
//             processJoinResponse?.tableDetails?.roundBets?.length > 0
//         ) {
//             const potAmount = processJoinResponse.tableDetails.roundBets.reduce((sum, bet) => sum + bet, 0);
//             processJoinResponse.tableDetails.totalPot -= potAmount;
//             console.log("now roundbets added is", potAmount);
//         }

//         const playerData = await this.imdb.getPlayerData(channelId);
//         myparams.channelId = channelId;
//         myparams.session = client;
//         myparams.table = { channelId };
//         myparams.player = { playerCallTimer: {} };

//         if (playerData?.players?.length > 0) {
//             const playerIndex = _ld.findIndex(playerData.players, { playerId: msg.playerId });
//             if (playerIndex >= 0 && playerData.players[playerIndex].state === stateOfX.playerState.waiting) {
//                 const player = playerData.players[playerIndex];
//                 myparams.player = player;
//                 myparams.player.isForceBlindVisible = player.isForceBlindVisible;
//                 myparams.player.RITstatus = player.isRunItTwice;
//                 myparams.player.playerCallTimer.channelId = channelId;
//                 myparams.player.playerCallTimer.playerId = msg.playerId;

//                 if (player.playerCallTimer.status) {
//                     myparams.player.playerCallTimer.callTimer = this.callTimerFromDb;
//                     const createdAt = player.playerCallTimer.createdAt;
//                     const diff = Math.floor((Date.now() - createdAt) / systemConfig.secondToMinutsConvert);
//                     myparams.player.playerCallTimer.timer = Math.max(0, player.playerCallTimer.timer - diff);
//                     myparams.player.callTimeGameMissed = 0;

//                     if (myparams.player.playerCallTimer.timer >= 1) {
//                         myparams.player.playerCallTimer.timerInSeconds = systemConfig.playerCallTime * 60 - Math.floor((Date.now() - createdAt) / 1000);
//                     } else {
//                         myparams.player.playerCallTimer.timerInSeconds = 0;
//                         myparams.player.playerCallTimer.status = false;
//                         myparams.player.playerCallTimer.createdAt = 0;
//                     }
//                 }

//                 await this.broadcastHandler.playerSettings(myparams);
//             }
//         }

//         if (
//             processJoinResponse?.tableDetails?.players?.length > 0 &&
//             processJoinResponse.tableDetails.isROE
//         ) {
//             const tableDetails = {
//                 channel,
//                 channelId: processJoinResponse.tableDetails.channelId,
//                 isROE: processJoinResponse.tableDetails.isROE,
//                 channelVariation: processJoinResponse.tableDetails.channelVariation,
//                 message: `${processJoinResponse.tableDetails.channelRoundCount}/${processJoinResponse.tableDetails.maxPlayers}`
//             };
//             this.broadcastHandler.fireGameVariationBroadcast(tableDetails);
//         }

//         await this.requestRemote.playerLeftEv(msg);

//         return processJoinResponse;
//     }


//     private async similarTableBroadcast(params: any): Promise<any> {

//         const imdbTable = await this.imdb.getTable(params.channelId);

//         // console.log("--------ChannelHandler Line---121", imdbTable)

//         if (imdbTable && imdbTable.players && imdbTable.players.length && imdbTable.maxPlayers === imdbTable.players.length) {
//             const tmpChannelId = params.channelId.split('-')[0];

//             const tablesRecord = await this.imdb.playerJoinedRecord({ channelId: { $regex: tmpChannelId } });

//             const uniquePlayers: Record<string, any> = {};
//             tablesRecord.forEach(item => {
//                 uniquePlayers[item.playerId] = item;
//             });

//             const uniquePlayersArray = Object.values(uniquePlayers);

//             for (const eachJoinedPlayer of uniquePlayersArray) {
//                 const playerOnSeat = imdbTable.players.find(p => p.playerId === eachJoinedPlayer.playerId);

//                 if (!playerOnSeat) {
//                     const allChannels = await this.imdb.getAllTable({ channelId: { $regex: tmpChannelId } });

//                     if (!allChannels) {
//                         continue;
//                     }

//                     let fullTableCount = 0;
//                     let isTableAvailable = false;

//                     for (const table of allChannels) {
//                         if (table.players.length === table.maxPlayers) {
//                             fullTableCount++;
//                             continue;
//                         }

//                         const alreadyInTable = table.players.find(p => p.playerId === eachJoinedPlayer.playerId);
//                         if (!alreadyInTable) {
//                             isTableAvailable = true;
//                         }
//                     }

//                     console.log('sf7herkwe checking if we can send a broadcast or not', fullTableCount, allChannels.length, isTableAvailable);

//                     if (fullTableCount === allChannels.length || isTableAvailable) {
//                         for (const channel of allChannels) {
//                             this.broadcastHandler.newSimilarTable({
//                                 channelId: channel.channelId,
//                                 msg: { channelId: channel.channelId, info: 'join Now' },
//                                 route: 'joinSimilarTable'
//                             });
//                         }
//                         console.log('sf7herkwe inside sending broadcast', params.playerId);
//                     }
//                 } else {
//                     console.log('player is sf7herkwe already in the table');
//                 }
//             }
//         } else {
//             console.log('player is sf7herkwe an empty seat is available');
//         }
//     }

//     private async processJoin(params: any): Promise<any> {
//         try {

//             params = await this.validateKeyOnJoin(params);

//             params = await this.initializeParams(params);
//             params = await this.getInMemoryTable(params);



//             params = await this.shouldBypassPassword(params);


//             params = await this.getTableDataForValidation(params);

//             params = await this.rejectIfPassword(params);

//             params = await this.createChannelInDatabase(params);



//             params = await this.addPlayerAsSpectator(params);



//             params = await this.broadcastOnJoinTable(params);

//             console.log("------- Inside Process Join Function------------")

//             params = await this.getTournamentChannel(params);


//             params = await this.joinPlayerToChannel(params);



//             params = await this.saveActivityRecord(params);



//             params = await this.saveJoinRecord(params);
//             params = await this.updatePlayerState(params);
//             params = await this.setChannelIntoSession(params);
//             params = await this.getAntiBankingDetails(params);
//             params = await this.joinChannelKeys(params);
//             params = await this.startKickToLobbyTimer(params);
//             params = await this.validateKeyAndCreateLog(params);
//             params = await this.firingRITBroadCast(params);
//             params = await this.firingCallTimeBroadCast(params);

//             // Optionally include:
//             // params = await this.handleTournament(params);

//             return params;
//         } catch (err) {
//             console.error("in joinChannelHandler processJoin err", err.message);
//             throw err;
//         }
//     };

//     private validateKeyOnJoin(params: any): any {

//         // Validate
//         if (params.channelId || params.tableId) {
//             return params;
//         } else {
//             return {
//                 success: false,
//                 isRetry: false,
//                 isDisplay: false,
//                 channelId: params.channelId || "",
//                 info: popupTextManager.falseMessages.VALIDATEKEYONJOINFAIL_JOINCHANNELHANDLER,
//             };
//         }
//     }

//     private initializeParams(params: any): any {
//         params.data = {
//             settings: {},
//             antibanking: {},
//             tableFound: false,
//         };
//         params.table = null;

//         return params;
//     };

//         // bypass password // if no password,  // player knows password and rejoins table
//     private async shouldBypassPassword(params: any): Promise<any> {

//         if (!params.data.tableFound) {
//             return params;
//         }

//         // console.log("---------shouldBypassPassword 1-------",params)

//         if (!params.table.isPrivate) {
//             params.bypassPassword = true;
//             return params;
//         }

//         // console.log("---------shouldBypassPassword 2-------")
        
//         const result = await this.imdb.playerJoinedRecord({
//             playerId: params.playerId,
//             channelId: params.channelId,
//         });


//         params.bypassPassword = !!(result && result.length > 0);
//         return params;
//     }




// }