import { Injectable } from "@nestjs/common";
import { ImdbDatabaseService } from "shared/common/datebase/Imdbdatabase.service";
import { PokerDatabaseService } from "shared/common/datebase/pokerdatabase.service";
import stateOfX from "shared/common/stateOfX.sevice";
import { validateKeySets } from "shared/common/utils/activity";












@Injectable()
export class SessionHandlerService {


    constructor(
        private readonly db: PokerDatabaseService,
        private readonly imdb: ImdbDatabaseService
    ) { }





    // ### This function is for bind user session
    async bindUserSession(msg: any): Promise<{ success: boolean }> {
        const validated = await validateKeySets("Request", msg.self.app.serverType, "bindUserSession", msg);
        if (!validated.success) return validated;

        const session = msg.session;
        session.bind(msg.playerId);
        session.on("closed", this.onUserLeave.bind(null, msg.self.app));

        session.set("playerId", msg.playerId);
        await session.push("playerId");

        session.set("playerName", msg.playerName);
        await session.push("playerName");

        return { success: true };
    }
    // ### Store channel with player's session
    // > When player session gets closed then handle event
    // > Remove player from all associated channels

    async bindChannelInSession(params: any): Promise<{ success: boolean }> {
        const validated = await validateKeySets("Request", params.self.app.serverType, "bindChannelInSession", params);
        if (!validated.success) return validated;

        const sessionChannels: string[] = params.session.get("channels") || [];

        if (!sessionChannels.includes(params.channelId)) {
            sessionChannels.push(params.channelId);
            params.session.set("channels", sessionChannels);
            await params.session.push("channels");
        }

        return { success: true };
    }
    // record last activity time in user session
    // as a key value in session.settings
    async recordLastActivityTime(params: any): Promise<void> {
        if (!params?.session?.set || !params?.session?.push) return;
        if (params.msg.isRequested === false) return;

        params.session.set("lastActiveTime", Date.now());
        await params.session.push("lastActiveTime");
    }


    /**
     * this function removes player from all tables
     * @method removefromChannels
     * @param  {object}           self     
     * @param  {object}           app      
     * @param  {object}           session  contains session
     * @param  {Function}         callback callback function
     * @return {callback}           callback
     */
    async removefromChannels(self: any, app: any, session: any): Promise<any> {
        const sessionChannels = session.get("channels") || [];
        const query = { playerId: session.uid };

        const joinRecords = await this.imdb.findRunningTable(query);
        if (!joinRecords) return [self, app, session];

        for (const joinRecord of joinRecords) {
            const sessionChannel = joinRecord.channelId;
            const table = await this.db.findTableById(sessionChannel);
            if (table) {
                if (table.channelVariation !== stateOfX.channelVariation.ofc) {
                    await app.rpc.room.roomRemote.handleDisconnection(session, {
                        channelId: sessionChannel,
                        playerId: session.uid
                    });
                }
            }
        }

        return [self, app, session];
    }

    /**
     * this function removes player from waiting
     * @method removeFromWaiting
     * @param  {object}           self     
     * @param  {object}           app      
     * @param  {object}           session  contains session
     * @param  {Function}         callback callback function
     * @return {callback}           callback
     */
    async removeFromWaiting(self: any, app: any, session: any): Promise<[any, any, any]> {
        const waitingChannels = session.get("waitingChannels") || [];

        if (waitingChannels.length === 0) {
            return [self, app, session];
        }

        for (const waitingChannel of waitingChannels) {
            const table = await this.db.findTableById(waitingChannel);
            if (!table) continue;

            if (table.channelVariation !== stateOfX.channelVariation.ofc) {
                const leaveWaitingResponse = await app.rpc.room.roomRemote.leaveWaitingList(session, {
                    playerId: session.uid,
                    channelId: waitingChannel,
                    playerName: session.settings.playerName
                });

                if (leaveWaitingResponse.success) {
                    const updatedWaitingChannels = session.get("waitingChannels") || [];
                    const index = updatedWaitingChannels.indexOf(waitingChannel);
                    if (index >= 0) {
                        updatedWaitingChannels.splice(index, 1);
                        session.set("waitingChannels", updatedWaitingChannels);
                        await session.push("waitingChannels");
                    }
                }
            }
        }

        return [self, app, session];
    }



    /**
     * this function removes player's join record
     * @method removeJoinRecord
     * @param  {object}           self     
     * @param  {object}           app      
     * @param  {object}           session  contains session
     * @param  {Function}         callback callback function
     * @return {callback}           callback
     */
    async removeJoinRecord(self, app, session) {
        await this.imdb.removePlayerJoin({ playerId: session.uid });
        return [null, self, app, session];
    };

    /**
     * this function removes player's activity
     * @method removePlayerActivity
     * @param  {object}           self     
     * @param  {object}           app      
     * @param  {object}           session  contains session
     * @param  {Function}         callback callback function
     * @return {callback}           callback
     */
    async removePlayerActivity(self, app, session) {
        await this.imdb.removeActivity({ playerId: session.uid });
        return [null, self, app, session];
    };


    /**
     * this function removes user from all tables in series of functions
     * @method leaveUserFromAllChannels
     * @param  {object}                 self     
     * @param  {object}                 app      
     * @param  {object}                 session  contains session
     * @param  {Function}               callback callback function
     * @return {callback}                 callback
     */
    async leaveUserFromAllChannels(self, app, session) {
        await this.removefromChannels(self, app, session);
        await this.removeFromWaiting(self, app, session);
        // await removePlayerActivity(self, app, session);
        // await removeJoinRecord(self, app, session);
        return { success: true };
    };















}