import { Injectable } from "@nestjs/common";
import { systemConfig } from "shared/common";
import { validateKeySets } from "shared/common/utils/activity";
import { SocketGateway } from "../../socket-gateway/socket.gateway";






let pomelo: any;


@Injectable()
export class BroadcastHandlerService1 {



    constructor(
        private readonly gameGateway: SocketGateway
    ) { }



    /**
     * Send a direct broadcast to a specific player.
     */
    async sendPlayerBroadCast(data: any): Promise<boolean> {
        console.log('Got one request to send player broadcast in broadcastHandler', data);

        try {
            const playerId = data.playerId;
            const message = data.msg;
            const eventName = 'lobbyPlayerResponse';

            if (!playerId || !message) {
                console.warn('Invalid data:', data);
                return false;
            }

            this.gameGateway.sendMessageToPlayer(playerId, eventName, message);
            return true;
        } catch (err) {
            console.error('Error sending player broadcast via socket:', err);
            return false;
        }
    }

    /**
     * Send a general broadcast to the whole lobby (room: allPlayers).
     */
    async sendGeneralBroadCast(data: any): Promise<boolean> {
        console.log('Got one request to send general broadcast in broadcastHandler', data);

        try {
            const message = data.msg;
            const eventName = 'lobbyGeneralResponse';

            if (!message) {
                console.warn('Missing msg in data:', data);
                return false;
            }

            this.gameGateway.broadcastToLobby(eventName, message);
            return true;
        } catch (err) {
            console.error('Error sending general broadcast via socket:', err);
            return false;
        }
    }


    /**
 * to broadcast a single player through entryRemote.js function
 * @method sendMessageToUser
 * @param  {Object}          params contains route data playerId
 */
    async userLoggedIn(msg: any): Promise<void> {
        this.sendPlayerBroadCast(msg);
    }

    async sendMessageToUser(params: any): Promise<void> {
        if (params.route === "tournamentCancelled") {
            params.route = "playerInfo"; // fallback route
        }

        const validated = await validateKeySets("Request", "connector", "sendMessageToUser", params);
        if (!validated.success) return;

        const eventName = params.route;
        const message = params.msg;

        // Send direct message to specific player via Socket.IO
        this.gameGateway.sendMessageToPlayer(params.playerId, eventName, message);

        // Optionally send a broadcast (if needed globally)
        this.sendPlayerBroadCast({
            playerId: params.playerId,
            msg: {
                ...message,
                action: eventName, // attach route info for listeners
            },
        });
    }



    /**
     * Broadcast to all channels joined by any player
     * used in cases like - avtar change of player
     * @method fireBroadcastOnSession
     * @param  {Object}               params contains session, route, data, 
     */
    async fireBroadcastOnSession(params: any): Promise<void> {
        const validated = await validateKeySets("Request", "connector", "fireBroadcastOnSession", params);
        if (!validated.success) return;

        const sessionChannels = params.session?.get("channels") || [];
        if (sessionChannels.length === 0) return;

        for (const sessionChannelId of sessionChannels) {
            // Prepare the data
            const message = {
                ...params.broadcastData,
                channelId: sessionChannelId,
                action: params.broadcastName,
            };

            // ✅ Broadcast to the room (e.g. "game-123")
            this.gameGateway.broadcastToRoom(sessionChannelId, params.broadcastName, message);

            // ✅ Optional: also send a general broadcast to all players
            this.sendGeneralBroadCast(message);
        }
    }

    // async fireBroadcastOnSession(params: any): Promise<void> {
    //     const validated = await validateKeySets("Request", "connector", "fireBroadcastOnSession", params);

    //     if (!validated.success) return;

    //     const sessionChannels = params.session.get("channels") || [];
    //     if (sessionChannels.length === 0) return;

    //     for (const sessionChannelId of sessionChannels) {
    //         params.broadcastData.channelId = sessionChannelId;

    //         await pomelo.app.rpc.room.broadcastRemote.pushMessage(params.session, {
    //             channelId: sessionChannelId,
    //             route: params.broadcastName,
    //             msg: params.broadcastData,
    //         });

    //         params.broadcastData.action = params.broadcastName;
    //         this.sendGeneralBroadCast(params.broadcastData);
    //     }
    // }

    async fireBroadcastForStartTournament(params: any): Promise<{ success: boolean }> {
        const validated = await validateKeySets("Request", "connector", "fireBroadcastForStartTournament", params);
        if (!validated.success) return validated;

        // Send initial broadcast
        await this.sendMessageToUser({
            self: pomelo,
            playerId: params.playerId,
            msg: {
                tableId: params.tableId,
                channelId: params.channelId,
                playerId: params.playerId,
                gameStartsIn: params.msg.timer,
                tableDetails: params.msg.table.tableDetails,
                roomConfig: params.msg.table.roomConfig,
                settings: params.msg.table.settings,
                forceJoin: true,
                info: `${params.msg.table.tableDetails.tournamentName.toUpperCase()} tournament has been started!`
            },
            route: params.route
        });

        // Schedule second broadcast after delay
        setTimeout(async () => {
            await this.sendMessageToUser({
                self: pomelo,
                playerId: params.playerId,
                msg: {
                    tableId: params.tableId,
                    channelId: params.channelId,
                    playerId: params.playerId,
                    info: `${params.msg.table.tableDetails.tournamentName.toUpperCase()} rebuy time has been started!`
                },
                route: params.route
            });
        }, 10000);

        return { success: true };
    }

    // export async function fireBroadcastForRebuyStatus(params: any): Promise<void> {
    //   // Placeholder implementation — update with actual logic if needed.
    // }



    // ### Broadcast for client-server connection
    // deprecated
    async fireAckBroadcastDep(params: any): Promise<void> {
        const validated = await validateKeySets("Request", "connector", "fireAckBroadcast", params);
        if (!validated.success) return;

        await this.sendMessageToUser({
            self: pomelo,
            playerId: params.playerId,
            msg: {
                channelId: params.channelId,
                playerId: params.playerId
            },
            route: "connectionAck"
        });
    }

    async fireNewChannelBroadcast(params: any): Promise<void> {
        const validated = await validateKeySets("Request", "connector", "fireNewChannelBroadcast", params);
        if (!validated.success) return;

        await this.sendMessageToUser({
            self: pomelo,
            playerId: params.playerId,
            msg: {
                channelId: params.channelId,
                playerId: params.playerId,
                newChannelId: params.newChannelId
            },
            route: "playerNewChannelBroadcast"
        });
    }

    async autoJoinBroadcast(params: any): Promise<void> {
        const validated = await validateKeySets("Request", "connector", "autoJoinBroadcast", params);
        if (!validated.success) return;

        const msgPayload = { ...params };
        delete msgPayload.self;
        delete msgPayload.session;

        await this.sendMessageToUser({
            self: pomelo,
            playerId: params.playerId,
            msg: msgPayload,
            route: "autoJoinBroadcast"
        });
    }


    //### this function send broadcast when any player eliminate.
    // tournament
    async firePlayerEliminateBroadcast(params: any): Promise<{ success: boolean }> {
        const validated = await validateKeySets("Request", "connector", "firePlayerEliminateBroadcast", params);
        if (!validated.success) return validated;

        setTimeout(() => {
            this.sendMessageToUser({
                self: pomelo,
                playerId: params.playerId,
                msg: {
                    channelId: params.channelId,
                    playerId: params.playerId,
                    tournamentId: params.tournamentId,
                    chipsWon: Math.round(params.chipsWon) || 0,
                    rank: params.rank,
                    isGameRunning: params.isGameRunning,
                    isRebuyAllowed: params.isRebuyAllowed,
                    tournamentName: params.tournamentName,
                    tournamentType: params.tournamentType,
                    ticketsWon: params.ticketsWon || 0
                },
                route: params.route
            });
        }, (systemConfig.gameOverBroadcastDelay * 1000 + 100));

        return { success: true };
    }


    //### this function send broadcast when tournament gets cancelled.
    /**
     * function to send message to registered users about tournament cancellation
     *
     * @method fireTournamentCancelledBroadcast
     * @param  {Object}       params  request json object
     * @return {Object}               validated object
     */
    async fireTournamentCancelledBroadcast(params: any): Promise<void> {
        const validated = await validateKeySets("Request", "connector", "fireTournamentCancelledBroadcast", params);
        if (!validated.success) return;

        await this.sendMessageToUser({
            self: pomelo,
            playerId: params.playerId,
            msg: {
                playerId: params.playerId,
                tournamentId: params.tournamentId,
                info: "Tournament has been cancelled."
            },
            route: params.route
        });
    }

    // player sit broadcast while shuffling
    async fireSitBroadcastInShuffling(params: any): Promise<void> {
        const validated = await validateKeySets("Request", "connector", "fireSitBroadcastInShuffling", params);
        if (!validated.success) return;

        const data: any = {
            channelId: params.newChannelId,
            playerId: params.playerId,
            chips: params.chips,
            seatIndex: params.seatIndex,
            playerName: params.playerName,
            imageAvtar: params.imageAvtar
        };

        params.channel.pushMessage('sit', data);

        // await this.videoHandler.createVideo({
        //     roundId: params.channel.roundId,
        //     channelId: params.newChannelId,
        //     type: stateOfX.videoLogEventType.broadcast,
        //     data
        // });

        data.action = 'sit';
        this.sendGeneralBroadCast(data);
    }

    // ### Player state broadcast to player only

    async firePlayerStateBroadcast(params: any): Promise<void> {
        const validated = await validateKeySets("Request", "connector", "firePlayerStateBroadcast", params);
        if (!validated.success) return;

        const data = {
            channelId: params.channelId,
            playerId: params.playerId,
            resetTimer: !!params.resetTimer,
            state: params.state,
            action: "playerState"
        };

        pomelo.app.rpc.room.broadcastRemote.pushMessage("playerState", data);
        this.sendGeneralBroadCast(data);
    }


    // ### Send player broadcast in order to display buyin popup
    // > In cases when player perform events when bankrupt
    async fireBankruptBroadcast(params: any): Promise<void> {
        const validated = await validateKeySets("Request", "connector", "fireBankruptBroadcast", params);
        if (!validated.success) return;

        await this.sendMessageToUser({
            self: pomelo,
            playerId: params.playerId,
            msg: {
                channelId: params.channelId,
                playerId: params.playerId
            },
            route: "bankrupt"
        });
    }

    // ### Fire player amount broadcast to channel level
    // > If player have opted to add chips in the middle of the game
    // It updates game balance of player
    async firePlayerCoinBroadcast(params: any): Promise<void> {
        const validated = await validateKeySets("Request", "connector", "firePlayerCoinBroadcast", params);
        if (!validated.success) return;

        const data = {
            channelId: params.channelId,
            playerId: params.playerId,
            amount: params.amount,
            action: "playerCoins"
        };
        params.channel.pushMessage("playerCoins", data);
        this.sendGeneralBroadCast(data);
    }


    // General info broadcast to client (player level)
    async fireInfoBroadcastToPlayer(params: any): Promise<void> {
        const validated = await validateKeySets("Request", "connector", "fireInfoBroadcastToPlayer", params);
        if (!validated.success) return;

        await this.sendMessageToUser({
            self: pomelo,
            playerId: params.playerId,
            msg: {
                heading: params.heading,
                info: params.info,
                channelId: params.channelId,
                playerId: params.playerId,
                buttonCode: params.buttonCode
            },
            route: "playerInfo"
        });
    }


    // Fire connection acknowledgement broadcast on session
    async fireAckBroadcastOnLogin(params: any): Promise<void> {
        const validated = await validateKeySets("Request", "connector", "fireAckBroadcastOnLogin", params);
        if (!validated.success) return;

        await this.sendMessageToUser({
            self: pomelo,
            playerId: params.playerId,
            msg: {
                playerId: params.playerId,
                data: params.data
            },
            route: "isConnectedOnLogin"
        });
    }


    // sends a broadcast to single player - dynamic route
    // params contains data, playerId, route
    async sendCustomMessageToUser(params: any): Promise<void> {
        const validated = await validateKeySets("Request", "connector", "sendCustomMessageToUser", params);
        if (!validated.success) return;

        await this.sendMessageToUser({
            self: pomelo,
            playerId: params.playerId,
            msg: {
                playerId: params.playerId,
                data: params.data
            },
            route: params.route
        });
    }



    // ### Broadcast to each binded session
    async fireBroadcastToAllSessions(params: any): Promise<void> {
        const validated = await validateKeySets("Request", "connector", "fireBroadcastToAllSessions", params);
        if (!validated.success) return;

        const channelService = pomelo.app.get("channelService");
        channelService.broadcast(pomelo.app.get("frontendType"), params.route, params.data);

        params.data.action = params.route;
        this.sendGeneralBroadCast(params.data);
    }
    ///////////////////////////////////////////////////////////////////
    // General broadcast function to broadcast data on channel level //
    ///////////////////////////////////////////////////////////////////
    // deprecated here
    async fireChannelBroadcast(params: any): Promise<void> {
        const validated = await validateKeySets("Request", "connector", "fireChannelBroadcast", params);
        if (!validated.success) return;

        params.channel.pushMessage(params.route, params.data);
        params.data.action = params.route;
        this.sendGeneralBroadCast(params.data);
    }


    //This function is used to send broadcast on blind level update
    // tournament
    async updateBlind(params: any): Promise<void> {
        const validated = await validateKeySets("Request", "connector", "updateBlind", params);
        if (!validated.success) return;

        params.channel.pushMessage("updateBlind", params.data);
        params.data.action = "updateBlind";
        this.sendGeneralBroadCast(params.data);
    }


    async firePlayerStateOnDisconnected(params: any): Promise<void> {
        const channelService = pomelo.app.get("channelService");
        channelService.broadcast(pomelo.app.get("frontendType"), "playerDisconnected", params);

        params.action = "playerDisconnected";
        this.sendGeneralBroadCast(params);
    }

    async isKYCBroadcast(params: any): Promise<void> {
        const validated = await validateKeySets("Request", "connector", "isKYCBroadcast", params);
        if (!validated.success) return;

        await this.sendMessageToUser({
            self: pomelo,
            playerId: params.playerId,
            msg: {
                playerId: params.playerId,
                data: params.data
            },
            route: params.route
        });
    }













}