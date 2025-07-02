import { Injectable } from "@nestjs/common";






@Injectable()
export class RoomManagerService {


    private rooms: any = new Map();


    /**
 * Get room. If not found and `createIfNotExists`, it creates a new one.
 */
    getOrCreateRoom(channelId: string): any {

        let room = this.rooms.get(channelId);

        if (!room) {
            room = {
                channelId,
                createdAt: Date.now(),
                players: new Map()
            };
            this.rooms.set(channelId, room);
        }
        return room || null;
    }

    /**
     * Check if room exists
     */
    hasRoom(channelId: string): boolean {
        return this.rooms.has(channelId);
    }

    /**
     * Add player to room
     */
    addPlayer(channelId: string, playerInfo: any): void {
        const room = this.getOrCreateRoom(channelId);
        room.players.set(playerInfo.playerId, playerInfo);
    }

    /**
     * Remove player from room
     */
    removePlayer(channelId: string, playerId: string): void {
        const room = this.rooms.get(channelId);
        if (room) {
            room.players.delete(playerId);
            // Optionally remove room if empty
            if (room.players.size === 0) {
                this.rooms.delete(channelId);
            }
        }
    }

    /**
     * Get player info from room
     */
    getPlayer(channelId: string, playerId: string): any {
        const room = this.rooms.get(channelId);
        return room?.players.get(playerId);
    }

    /**
     * List all players in room
     */
    getPlayers(channelId: string): any {
        const room = this.rooms.get(channelId);
        return room ? Array.from(room.players.values()) : [];
    }

    /**
     * Set or update room metadata
     */
    setRoomMetadata(channelId: string, metadata: any): void {
        const room = this.getOrCreateRoom(channelId);
        Object.assign(room, metadata);
    }

    /**
     * Get full room details
     */
    getRoom(channelId: string): any {
        return this.rooms.get(channelId) || null;
    }

    /**
     * Delete entire room
     */
    deleteRoom(channelId: string): void {
        this.rooms.delete(channelId);
    }






}