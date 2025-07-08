import { Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@Injectable()
export class RoomManagerService {
    private readonly logger = new Logger(RoomManagerService.name);
    private server: Server;

    // Set the Socket.IO server instance (called from Gateway)
    setServer(server: Server) {
        this.server = server;
    }

    /**
     * Join a room by channelId
     */
    async joinRoom(socket: Socket, channelId: string): Promise<void> {
        await socket.join(channelId);
        this.logger.log(`Socket ${socket.id} joined room ${channelId}`);
    }


    /**
     * Leave a room by channelId
     */
    async leaveRoom(socket: Socket, channelId: string): Promise<void> {
        await socket.leave(channelId);
        this.logger.log(`Socket ${socket.id} left room ${channelId}`);
    }

    /**
     * Get all socket IDs or playerIds in a room
     */
    async getMembersFromRoom(channelId: string): Promise<string[]> {
        if (!this.server) {
            this.logger.error('Server instance not set');
            return [];
        }

        const sockets = await this.server.in(channelId).fetchSockets();
        return sockets.map(socket => socket.data.playerId || socket.id);
    }

    /**
     * Broadcast a message to all users in a room
     */
    async broadcastToRoom(channelId: string, event: string, data: any): Promise<void> {
        if (!this.server) return;

        this.server.to(channelId).emit(event, data);
        this.logger.log(`Broadcasted event "${event}" to room "${channelId}"`);
    }

    /**
     * Check if a room exists
     */
    async roomExists(channelId: string): Promise<boolean> {
        const sockets = await this.server.in(channelId).fetchSockets();
        return sockets.length > 0;
    }

    /**
    * Check if a room exists
    */
    async getRooms(channelId: string): Promise<any> {
        const sockets = await this.server.in(channelId).fetchSockets();

        return sockets;
    }


    /**
     * Send a message to a specific socket in the room (by playerId or socket.id)
     */
    async sendToUserInRoom(channelId: string, playerId: string, event: string, data: any): Promise<void> {
        const sockets = await this.server.in(channelId).fetchSockets();

        for (const socket of sockets) {
            if (socket.data.playerId === playerId) {
                socket.emit(event, data);
                this.logger.log(`Sent event "${event}" to player ${playerId} in room ${channelId}`);
                return;
            }
        }

        this.logger.warn(`Player ${playerId} not found in room ${channelId}`);
    }

    /**
     * Destroy room: send event, optionally remove tracked data
     */
    async destroyRoom(channelId: string): Promise<void> {
        const sockets = await this.server.in(channelId).fetchSockets();

        for (const socket of sockets) {
            await socket.leave(channelId);
        }

        // Optional: broadcast that room is destroyed
        this.server.to(channelId).emit('roomDestroyed', { channelId });
        this.logger.log(`Room ${channelId} destroyed`);
    }

    getRoom(channelId) {

    }
}
