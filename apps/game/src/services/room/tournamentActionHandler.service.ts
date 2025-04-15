import { Injectable } from "@nestjs/common";
import _ from "underscore";
import _ld from "lodash";
import { systemConfig, stateOfX } from 'shared/common';

import { PrizePoolHandlerService } from "./prizePoolHandler.service";
import { BroadcastHandlerService } from "./broadcastHandler.service";
import { PokerDatabaseService } from "shared/common/datebase/pokerdatabase.service";
import { ImdbDatabaseService } from "shared/common/datebase/Imdbdatabase.service";
import { CalculateDynamicBountyHandlerService } from "./calculateDynamicBountyHandler.service";








declare const pomelo: any;



@Injectable()
export class TournamentActionHandlerService {



    constructor(
        private readonly db: PokerDatabaseService,
        private readonly imdb: ImdbDatabaseService,
        private prizePoolHandler: PrizePoolHandlerService,
        private broadcastHandler: BroadcastHandlerService,
        private calculateDynamicBountyHandler: CalculateDynamicBountyHandlerService

    ) { }





    /*=================================  START  ===========================*/
    // this method will handle tournament tourListChange
    // New
    async tourListChange(params: any): Promise<void> {
        this.broadcastHandler.fireBroadcastToAllSessions({
            app: params.self.app,
            data: {},
            route: stateOfX.broadcasts.tourListChange
        });
    }
    // Old
    // tournamentActionHandler.tourListChange = function (params) {
    //     broadcastHandler.fireBroadcastToAllSessions({ app: params.self.app, data: {}, route: stateOfX.broadcasts.tourListChange });
    //   }
    /*=================================  END  ===========================*/

    /*=================================  START  ===========================*/
    // this method will handle tournament tourListUpdate
    //   New
    async tourListUpdate(params: any): Promise<void> {
        this.broadcastHandler.fireBroadcastToAllSessions({
            app: params.self.app,
            data: {},
            route: stateOfX.broadcasts.tourListUpdate
        });
    }


    //   OLd
    //   tournamentActionHandler.tourListUpdate = function (params) {
    //     broadcastHandler.fireBroadcastToAllSessions({ app: params.self.app, data: {}, route: stateOfX.broadcasts.tourListUpdate });
    //   }
    /*=================================  END  ===========================*/

    /*=================================  START  ===========================*/
    // this method will handle tournament tourDetailsUpdate
    //   New
    async tourDetailsUpdate(params: any): Promise<void> {
        this.broadcastHandler.fireBroadcastToAllSessions({
            app: params.self.app,
            data: {},
            route: stateOfX.broadcasts.tourDetailsUpdate
        });
    }

    //   Old
    //   tournamentActionHandler.tourDetailsUpdate = function (params) {
    //     broadcastHandler.fireBroadcastToAllSessions({ app: params.self.app, data: {}, route: stateOfX.broadcasts.tourDetailsUpdate });
    //   }
    /*=================================  END  ===========================*/

    /*=================================  START  ===========================*/
    // New
    async handleTournamentState(params: any): Promise<void> {
        this.broadcastHandler.fireBroadcastToAllSessions({
            app: pomelo.app,
            data: {
                _id: params.tournamentId,
                updated: { state: params.tournamentState },
                event: stateOfX.recordChange.tournamentStateChanged
            },
            route: stateOfX.broadcasts.tournamentStateChange
        });

        if (params.tournamentState === stateOfX.tournamentState.finished) {
            const date = new Date();
            const seconds = date.getSeconds();
            const timeOutTournamentRegister = systemConfig.sitNGoRecurringTimer - (seconds % systemConfig.sitNGoRecurringTimer);

            setTimeout(() => {
                this.broadcastHandler.fireBroadcastToAllSessions({
                    app: pomelo.app,
                    data: {
                        _id: params.tournamentId,
                        state: stateOfX.tournamentState.register,
                        event: stateOfX.recordChange.tournamentStateChanged
                    },
                    route: stateOfX.broadcasts.tournamentStateChange
                });
            }, timeOutTournamentRegister * 1000);
        }
    }

    // Old
    //   tournamentActionHandler.handleTournamentState = function (params) {
    //     broadcastHandler.fireBroadcastToAllSessions({ app: pomelo.app, data: { _id: params.tournamentId, updated: { state: params.tournamentState }, event: stateOfX.recordChange.tournamentStateChanged }, route: stateOfX.broadcasts.tournamentStateChange });
    //     if (params.tournamentState === stateOfX.tournamentState.finished) {
    //       let date = new Date();
    //       let seconds = date.getSeconds(), timeOutTournamentRegister = systemConfig.sitNGoRecurringTimer - (seconds % systemConfig.sitNGoRecurringTimer);
    //       setTimeout(function () {
    //         broadcastHandler.fireBroadcastToAllSessions({ app: pomelo.app, data: { _id: params.tournamentId, state: stateOfX.tournamentState.register, event: stateOfX.recordChange.tournamentStateChanged }, route: stateOfX.broadcasts.tournamentStateChange });
    //       }, timeOutTournamentRegister * 1000);
    //     }
    //   }
    /*=================================  END  ===========================*/


    /*=================================  START  ===========================*/
    // Handle events after player de-register in tournament

    //   New
    async handleDynamicRanks(params: any): Promise<void> {
        const result = await this.imdb.getRanks({ tournamentId: params.tournamentId });

        if (result && !result.err) {
            this.broadcastHandler.fireBroadcastToAllSessions({
                app: pomelo.app,
                data: {
                    tournamentId: params.tournamentId,
                    updated: { ranks: result.ranks },
                    event: stateOfX.recordChange.tournamentRankUpdate
                },
                route: stateOfX.broadcasts.tournamentRankUpdate
            });
        }
    }


    //   Old
    //   tournamentActionHandler.handleDynamicRanks = function (params) {
    //     imdb.getRanks({ tournamentId: params.tournamentId }, function (err, result) {
    //       if (!err) {
    //         broadcastHandler.fireBroadcastToAllSessions({ app: pomelo.app, data: { tournamentId: params.tournamentId, updated: { ranks: result.ranks }, event: stateOfX.recordChange.tournamentRankUpdate }, route: stateOfX.broadcasts.tournamentRankUpdate });
    //       }
    //     });
    //   };
    /*=================================  END  ===========================*/


    /*=================================  START  ===========================*/
    // info about destroy channel during player shuffling in tournament lobby
    //   New
    async handleDestroyChannel(params: any): Promise<void> {
        this.broadcastHandler.fireBroadcastToAllSessions({
            app: params.app,
            data: {
                tournamentId: params.tournamentId,
                updated: { channelId: params.channelId },
                event: stateOfX.recordChange.destroyTable
            },
            route: stateOfX.broadcasts.tournamentLobby
        });
    }

    //   Old
    //   tournamentActionHandler.handleDestroyChannel = function (params) {
    //     broadcastHandler.fireBroadcastToAllSessions({ app: params.app, data: { tournamentId: params.tournamentId, updated: { channelId: params.channelId }, event: stateOfX.recordChange.destroyTable }, route: stateOfX.broadcasts.tournamentLobby });
    //   };
    /*=================================  END  ===========================*/


    /*=================================  START  ===========================*/
    //info about prizePool change during Gameplay

    //   New
    async prizePool(params: any): Promise<void> {
        const result = await this.prizePoolHandler.calculatePrizePool({ tournamentId: params.tournamentId });

        if (result) {
            this.broadcastHandler.fireBroadcastToAllSessions({
                app: pomelo.app,
                data: {
                    tournamentId: params.tournamentId,
                    updated: { prizePool: result, channelId: params.channelId },
                    event: stateOfX.recordChange.prizePool
                },
                route: stateOfX.broadcasts.tournamentLobby
            });
        }
    }


    //   Old
    //   tournamentActionHandler.prizePool = function (params) {
    //     prizePoolHandler.calculatePrizePool({ tournamentId: params.tournamentId }, function (err, result) {
    //       broadcastHandler.fireBroadcastToAllSessions({ app: pomelo.app, data: { tournamentId: params.tournamentId, updated: { prizePool: result, channelId: params.channelId }, event: stateOfX.recordChange.prizePool }, route: stateOfX.broadcasts.tournamentLobby });
    //     });
    //   }
    /*=================================  END  ===========================*/

    /*=================================  START  ===========================*/
    // this function calculates active players in the game and sends bounty broadcast

    //   New
    async calculateActivePlayers(self: any, params: any): Promise<void> {
        const playerPrizeBroadcastArray = _.where(params.tournamentRules.ranks, { isPrizeBroadcastSent: false });

        if (playerPrizeBroadcastArray.length > 0) {
            const result = await this.db.findActiveTournamentUser({ tournamentId: params.tournamentRules.tournamentId });

            if (result) {
                const tournamentPlayersCount = result.length;
                const activePlayersCount = _.where(result, { 'isActive': true }).length;

                this.broadcastHandler.fireBroadcastToAllSessions({
                    app: self.app,
                    data: {
                        _id: params.tournamentRules.tournamentId,
                        updated: { totalPlayers: tournamentPlayersCount, activePlayers: activePlayersCount },
                        event: stateOfX.recordChange.tournamentActivePlayers
                    },
                    route: stateOfX.broadcasts.tournamentTableUpdate
                });
            }

            const dynamicBountyResponse = await this.calculateDynamicBountyHandler.calculateDynamicBounty(params.tournamentRules);

            this.broadcastHandler.fireBroadcastToAllSessions({
                app: self.app,
                data: {
                    tournamentId: params.tournamentRules.tournamentId,
                    updated: dynamicBountyResponse,
                    event: stateOfX.recordChange.bountyChanged
                },
                route: stateOfX.broadcasts.tournamentLobby
            });
        }
    }


    //   Old
    //   tournamentActionHandler.calculateActivePlayers = function (self, params) {
    //     var playerPrizeBroadcastArray = _.where(params.tournamentRules.ranks, { isPrizeBroadcastSent: false });
    //     if (playerPrizeBroadcastArray.length > 0) {
    //       db.findActiveTournamentUser({ tournamentId: params.tournamentRules.tournamentId }, function (err, result) {
    //         if (!err && result) {
    //           let tournamentPlayersCount = result.length, activePlayersCount = _.where(result, { 'isActive': true }).length;
    //           broadcastHandler.fireBroadcastToAllSessions({ app: self.app, data: { _id: params.tournamentRules.tournamentId, updated: { totalPlayers: tournamentPlayersCount, activePlayers: activePlayersCount }, event: stateOfX.recordChange.tournamentActivePlayers }, route: stateOfX.broadcasts.tournamentTableUpdate });
    //         }
    //       })
    //       calculateDynamicBountyHandler.calculateDynamicBounty(params.tournamentRules, function (dynamicBountyResponse) {
    //         broadcastHandler.fireBroadcastToAllSessions({ app: self.app, data: { tournamentId: params.tournamentRules.tournamentId, updated: dynamicBountyResponse, event: stateOfX.recordChange.bountyChanged }, route: stateOfX.broadcasts.tournamentLobby });
    //       })
    //     }
    //   }
    /*=================================  END  ===========================*/













}