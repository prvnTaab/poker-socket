import { Injectable } from "@nestjs/common";
import { ImdbDatabaseService } from "shared/common/datebase/Imdbdatabase.service";
import { PokerDatabaseService } from "shared/common/datebase/pokerdatabase.service";
import { SessionHandlerService } from "./sessionHandler.service";
import popupTextManager from "shared/common/popupTextManager";







@Injectable()
export class LogoutHandlerService {

    constructor(
        private readonly db: PokerDatabaseService,
        private readonly imdb: ImdbDatabaseService,
        private readonly sessionHandler: SessionHandlerService,
    ) { }






    	// ### Get user session with server ###

/**
 * this function gets user session from server
 * @method getUserSession
 * @param  {object}       params request json object
 * @param  {Function}     cb     callback function
 * @return               callback
 */
async getUserSession(params: any): Promise<any> {
    const session = params.self.app.sessionService.getByUid(params.playerId)?.[0] ?? null;

    if (session) {
        return { success: true, sessionId: session.id };
    } else {
        return {
            success: false,
            isRetry: false,
            isDisplay: false,
            channelId: "",
            info: popupTextManager.falseMessages.GETUSERSESSIONFAIL_LOGOUTHANDLER
        };
    }
}


// ### Kill a user's session with server ###
/**
 * this function kills a user's session on server
 * @method killUserSession
 * @param  {object}        params request json object
 * @param  {Function}      cb     callback function
 * @return               callback
 */
async killUserSession(params: any): Promise<any> {
    const session = params.self.app.sessionService.get(params.sessionId);

    if (session) {
        await params.self.app.sessionService.kickBySessionId(params.sessionId);
        return { success: true };
    } else {
        return {
            success: false,
            isRetry: false,
            isDisplay: false,
            channelId: "",
            info: popupTextManager.falseMessages.KILLUSERSESSIONFAIL_LOGOUTHANDLER
        };
    }
}

/**
 * remove UserSession Doc From Dataase
 * @method removeUserSessionFromDB
 * @param  {String}                playerId playerId of player
 */
async removeUserSessionFromDB(playerId: string): Promise<void> {
    await this.db.removeUserSessionFromDB(playerId);
}


/**
 * this fucntion deals with the complete logout process
 * @method logout
 * @param  {object}   params   		request json object
 * @param  {Function} callback 		callback function
 * @return             		callback
 */
async logout(params: any): Promise<any> {
    const playerSession = await this.getUserSession(params);

    if (playerSession.success) {
        await this.sessionHandler.leaveUserFromAllChannels(params.self, params.self.app, params.session);

        const query2 = { playerId: params.session.uid };
        const results = await this.imdb.findRunningTable(query2);

        if (Array.isArray(results) && results.length === 0) {
            await this.removeUserSessionFromDB(params.playerId);
        }

        return {
            success: true,
            isRetry: false,
            isDisplay: false,
            channelId: "",
            info: popupTextManager.falseMessages.GETUSERSESSION_TRUE_LOGOUTHANDLER
        };
    } else {
        return playerSession;
    }
};






}