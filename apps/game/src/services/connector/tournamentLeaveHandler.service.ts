import { Injectable } from "@nestjs/common";











@Injectable()
export class TournamentLeaveHandlerService {


    constructor(

    ) {}




    /**
 * this function deals with leave process in tournament when player is out of money
 *
 * @method leaveProcess
 * @param  {[type]}   params request json object
 * @param  {Function} cb     callback function
 * @return {[type]}          params object
 */
async leaveProcess(params: any): Promise<any> {
  const tempParams = {
    playerId: params.playerId,
    channelId: params.channelId
  };

  const leaveTournamentResponse = await params.self.app.rpc.database.tableRemote.leaveTournament(params.session, tempParams);

  if (leaveTournamentResponse.success) {
    return {
      success: true,
      isRetry: false,
      channelId: params.channelId || " ",
      info: "player successfuly leave"
    };
  } else {
    return leaveTournamentResponse;
  }
};





}