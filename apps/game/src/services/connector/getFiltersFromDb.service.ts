import { Injectable } from "@nestjs/common";
import { PokerDatabaseService } from "shared/common/datebase/pokerdatabase.service";
import stateOfX from "shared/common/stateOfX.sevice";
import _ from 'underscore';











@Injectable()
export class GetFiltersFromDbService {


    constructor(
        private readonly db: PokerDatabaseService
    ) { }



    // fetch all kinds of tables 
    // and generate filters
    async generateResponse(): Promise<any> {
        const normalResponse = await this.db.listTable({ channelType: stateOfX.gameType.normal });
        if (!normalResponse) {
            return { success: false, info: 'db query failed - normalResponse' };
        }

        const sitngoResponse = await this.db.listTournamentRoom({
            tournamentType: stateOfX.tournamentType.sitNGo,
            state: stateOfX.tournamentState.register
        });
        if (!sitngoResponse) {
            return { success: false, info: 'db query failed - sitngoResponse' };
        }

        const tournamentResponse = await this.db.listTournamentRoom({
            tournamentType: { $ne: stateOfX.tournamentType.sitNGo },
            state: stateOfX.tournamentState.register
        });
        if (!tournamentResponse) {
            return { success: false, info: 'db query failed - tournamentResponse' };
        }

        return {
            success: true,
            normal: {
                speed: _.uniq(_.pluck(normalResponse, 'turnTime').sort((a, b) => a - b)),
                smallBlind: _.reject(
                    _.uniq(_.pluck(normalResponse, 'smallBlind').sort((a, b) => a - b)),
                    (num) => num === -1
                ),
                bigBlind: _.reject(
                    _.uniq(_.pluck(normalResponse, 'bigBlind').sort((a, b) => a - b)),
                    (num) => num === -1
                ),
                game: _.reject(
                    _.uniq(_.pluck(normalResponse, 'channelVariation').sort((a, b) => a - b)),
                    (variation) => variation === stateOfX.channelVariation.ofc
                ),
                playersRequired: _.uniq(_.pluck(normalResponse, 'maxPlayers').sort((a, b) => a - b))
            },
            sitNGo: {
                speed: _.uniq(_.pluck(sitngoResponse, 'turnTime').sort((a, b) => a - b)),
                playersRequired: _.uniq(
                    _.pluck(sitngoResponse, 'maxPlayersForTournament').sort((a, b) => a - b)
                ),
                game: _.uniq(_.pluck(sitngoResponse, 'channelVariation').sort((a, b) => a - b)),
                buyIn: _.uniq(_.pluck(sitngoResponse, 'buyIn').sort((a, b) => a - b))
            },
            tournament: {
                game: _.uniq(_.pluck(tournamentResponse, 'channelVariation').sort((a, b) => a - b)),
                buyIn: _.uniq(_.pluck(tournamentResponse, 'buyIn').sort((a, b) => a - b)),
                type: _.uniq(_.pluck(tournamentResponse, 'tournamentType').sort((a, b) => a - b)),
                starting: _.uniq(_.pluck(tournamentResponse, 'tournamentStartTime').sort((a, b) => a - b))
            }
        };
    };




}