import { Injectable } from "@nestjs/common";
import { systemConfig, stateOfX, popupTextManager } from 'shared/common';
import { SessionHandlerService } from "./sessionHandler.service";










 = require("./sessionHandler"),







@Injectable()
export class LogoutHandlerService  {


    constructor(
        private readonly sessionHandler:SessionHandlerService
    ) {}




    /*===================================  START  =============================*/
    // ### Get user session with server ###
    /**
     * this function gets user session from server
     * @method getUserSession
     * @param  {object}       params request json object
     * @param  {Function}     cb     callback function
     * @return               callback
     */

    // New
    async getUserSession(params: any): Promise<any> {
        const sessions = params.self.app.sessionService.getByUid(params.playerId);
        const session = sessions?.[0] || null;

        // Log the player ID
        console.log(stateOfX.serverLogType.info, 'uid is ' + params.playerId);

        if (session) {
        return { success: true, sessionId: session.id };
        } else {
        return {
            success: false,
            isRetry: false,
            isDisplay: false,
            channelId: '',
            info: popupTextManager.falseMessages.GETUSERSESSIONFAIL_LOGOUTHANDLER,
        };
        }
    }

    // Old
    // var	getUserSession =  function(params, cb) {
    // 	var session = !!params.self.app.sessionService.getByUid(params.playerId) ? params.self.app.sessionService.getByUid(params.playerId)[0] : null;
    // 	serverLog(stateOfX.serverLogType.info,"uid is " + params.playerId);
    // 	if(!!session) {
    // 		cb({success: true, sessionId: session.id});
    // 	} else {
    // 		cb({success: false, isRetry: false, isDisplay: false, channelId: "", info: popupTextManager.falseMessages.GETUSERSESSIONFAIL_LOGOUTHANDLER});
    // 		//cb({success: false, info: "user session not found"});
    // 	}
    // }
    /*===================================  END  =============================*/


    /*===================================  START  =============================*/
    // ### Kill a user's session with server ###
    /**
     * this function kills a user's session on server
     * @method killUserSession
     * @param  {object}        params request json object
     * @param  {Function}      cb     callback function
     * @return               callback
     */

    // New
    async killUserSession(params: any): Promise<any> {

        const session = params.self.app.sessionService.get(params.sessionId);

        if (session) {
        await new Promise<void>((resolve) => {
            params.self.app.sessionService.kickBySessionId(params.sessionId, () => resolve());
        });
        return { success: true };
        } else {
        return {
            success: false,
            isRetry: false,
            isDisplay: false,
            channelId: '',
            info: popupTextManager.falseMessages.KILLUSERSESSIONFAIL_LOGOUTHANDLER,
        };
        }
    }

    // Old
    // var killUserSession = function(params, cb) {
    // 	serverLog(stateOfX.serverLogType.error,'Kick user for this session forcefully!! - ' + params.sessionId);
    // 	var session = params.self.app.sessionService.get(params.sessionId);
    // 	if(!!session) {
    // 		params.self.app.sessionService.kickBySessionId(params.sessionId, function(data) {
    // 			cb({success: true});
    // 		});
    // 	} else {
    // 		cb({success: false, isRetry: false, isDisplay: false, channelId: "", info: popupTextManager.falseMessages.KILLUSERSESSIONFAIL_LOGOUTHANDLER});
    // 		//cb({success: false, info: "Error in kill user session"});
    // 	}
    // }
    /*===================================  END  =============================*/


    /*===================================  START  =============================*/
/**
 * this fucntion deals with the complete logout process
 * @method logout
 * @param  {object}   params   		request json object
 * @param  {Function} callback 		callback function
 * @return             		callback
 */

// New
async logout(params: any): Promise<any> {

    const sessions = params.self.app.sessionService.getByUid(params.playerId);
    const session = sessions && sessions.length > 0 ? sessions[0] : null;


    if (session) {
      await this.sessionHandler.leaveUserFromAllChannels(params.self, params.self.app, params.session);

      return {
        success: true,
        isRetry: false,
        isDisplay: false,
        channelId: '',
        info: popupTextManager.falseMessages.GETUSERSESSION_TRUE_LOGOUTHANDLER,
      };
    } else {
      return {
        success: false,
        isRetry: false,
        isDisplay: false,
        channelId: '',
        info: popupTextManager.falseMessages.GETUSERSESSIONFAIL_LOGOUTHANDLER,
      };
    }
  }

// Old
// logoutHandler.logout = function(params, callback) {
// 	serverLog(stateOfX.serverLogType.info,'in logoutHandler.logout' + params);
// 	getUserSession(params, function(playerSession){
// 		serverLog(stateOfX.serverLogType.info, 'playerSession - ' + playerSession);
// 		if(playerSession.success) {
// 			sessionHandler.leaveUserFromAllChannels(params.self,params.self.app, params.session, function(leaveResponse){
// 				serverLog(stateOfX.serverLogType.info,'Player has been removed from all channels!');
// 			});
// 			// params.sessionId = playerSession.sessionId;
// 			callback({success: true,isRetry: false, isDisplay: false, channelId: "", info: popupTextManager.falseMessages.GETUSERSESSION_TRUE_LOGOUTHANDLER});
// 			//callback({success: true, info: "user logged out successfully"})
// 			// killUserSession(params, function(killUserSessionResponse) {
// 			// 	serverLog(stateOfX.serverLogType.info,'killUserSessionResponse - ', killUserSessionResponse);
// 			// })
// 		} else {
// 			callback(playerSession);
// 		}
// 	})
// }
    /*===================================  END  =============================*/











}