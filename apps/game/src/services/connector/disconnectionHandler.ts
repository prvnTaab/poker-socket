import { Injectable } from "@nestjs/common";
import { ImdbDatabaseService } from "shared/common/datebase/Imdbdatabase.service";
import { PokerDatabaseService } from "shared/common/datebase/pokerdatabase.service";
import stateOfX from "shared/common/stateOfX.sevice";








@Injectable()
export class DisconnectionHandler {

    constructor(
        private db: PokerDatabaseService,
        private imdb: ImdbDatabaseService
    ) { }


    async handle(params:any):Promise<void> {

        let playerId = params.route == 'socket' ? params.playerId : params.session.get('playerId');
        
        if (!playerId) {
            return;
        }

        try {
            
            const records = await this.imdb.playerJoinedRecord({ playerId });

            if (!records || records.length === 0) {
                return;
            }

            await Promise.all(records.map(async (record: any) => {
                const channelId = record.channelId.toString();
                const state = stateOfX.playerState.disconnected;

                const result = await this.imdb.getDisconnectedPlayerDetails(channelId);

                let previousState = '';
                for (const player of result.players) {
                    if (player.playerId === playerId && player.channelId === channelId) {
                        previousState = player.state;
                        break;
                    }
                }

                const updateRes = await this.imdb.playerStateUpdateOnDisconnections(
                    channelId,
                    playerId,
                    state,
                    previousState
                );

                if (updateRes) {
                    await new Promise<void>((resolve) => {

                        pomelo.app.rpc.room.roomRemote.playerDisconnected(
                            params.session,
                            {
                                channelId,
                                playerId,
                                state,
                                playerName: record.playerName
                            },
                            () => resolve()
                        );

                    });
                }
            }));
        } catch (err) {
            console.error('Error handling disconnection:', err);
        }
    }




}