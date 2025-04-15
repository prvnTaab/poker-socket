import { Injectable } from "@nestjs/common";
import _ from "underscore";
import { systemConfig, stateOfX } from 'shared/common';

import { BroadcastHandlerService } from "./broadcastHandler.service";
import { PokerDatabaseService } from "shared/common/datebase/pokerdatabase.service";








@Injectable()
export class TournamentActivePlayersService {


    constructor(
        private readonly db: PokerDatabaseService,
        private readonly broadcastHandler:BroadcastHandlerService
    ) {}



/*==================================  START  ===================================*/
    /**
 * this function finds active players of tournament and sends broadcast about total players and active players in  tournament
 * @method findActivePlayers
 * @param  {[type]}          self   contains information about app, helps in sending broadcast
 * @param  {[type]}          params request JSON object
 * @return {[type]}                 broadcast to all sessions
 */
// New
async findActivePlayers(self: any, params: any): Promise<void> {
    try {
      const result = await this.db.findActiveTournamentUser({
        tournamentId: params.tournamentRules.tournamentId,
        gameVersionCount: params.tournamentRules.gameVersionCount,
      });
  
      if (result) {
        const tournamentPlayersCount = result.length;
        const activePlayersCount = _.where(result, { isActive: true }).length;
  
        this.broadcastHandler.fireBroadcastToAllSessions({
          app: self.app,
          data: {
            _id: params.tournamentRules.tournamentId,
            updated: {
              totalPlayers: tournamentPlayersCount,
              activePlayers: activePlayersCount,
            },
            event: stateOfX.recordChange.tournamentActivePlayers,
          },
          route: stateOfX.broadcasts.tournamentTableUpdate,
        });
      }
    } catch (err) {
      // Log or handle error if needed, silently ignoring for now as in original logic
      console.log("----------------tournamentActivePlayers.service-----------",err);
    }
  };
  
    // Old
// tournamentActivePlayers.findActivePlayers = function (self, params) {
//     db.findActiveTournamentUser({ tournamentId: params.tournamentRules.tournamentId, gameVersionCount: params.tournamentRules.gameVersionCount }, function (err, result) {
//       if (!err && result) {
//         let tournamentPlayersCount = result.length, activePlayersCount = _.where(result, { 'isActive': true }).length;
//         broadcastHandler.fireBroadcastToAllSessions({ app: self.app, data: { _id: params.tournamentRules.tournamentId, updated: { totalPlayers: tournamentPlayersCount, activePlayers: activePlayersCount }, event: stateOfX.recordChange.tournamentActivePlayers }, route: stateOfX.broadcasts.tournamentTableUpdate });
//       }
//     })
//   }
/*==================================  END  ===================================*/



}