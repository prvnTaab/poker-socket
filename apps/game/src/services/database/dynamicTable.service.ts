import { Injectable } from "@nestjs/common";
import _ from 'underscore';
import { ImdbDatabaseService } from "shared/common/datebase/Imdbdatabase.service";
import { PokerDatabaseService } from "shared/common/datebase/pokerdatabase.service";












@Injectable()
export class dynamicTableService {

    constructor(
        private readonly db: PokerDatabaseService,
        private readonly imdb: ImdbDatabaseService,
    ) { }




    /*============================  START  =================================*/
    // New
    async similarTableJoin(params: any): Promise<any> {

        const result: any = await this.findSuitableTable(params);

        if (!result.success || (result.success && !result.isEmptyTable)) {
            return result;
        }

        const tmpChannelId = params.channelId.split("-")[0];
        const channels = await this.imdb.getAllTable({ channelId: { $regex: tmpChannelId } });

        for (const channel of channels) {
            if (channel.players.length < channel.maxPlayers) {
                const player = channel.players.find(p => p.playerId === params.playerId);
                if (!player) {
                    return { success: true, channelId: params.channelId, newChannelId: channel.channelId };
                }
            }
        }

        return result;
    }



    // Old
    // dynamicTable.similarTableJoin = (params, cb) => {
    //     findSuitableTable(params, (result) => {
    //         console.log("s5e2f45 findSuitableTablefindSuitableTable", result)
    //         if (!result.success || (result.success && !result.isEmptyTable)) {
    //             return cb(result)
    //         } else {
    //             let tmpChannelId = params.channelId.split("-")[0];
    //             imdb.getAllTable({ channelId: { $regex: tmpChannelId } }, (err, channels) => {
    //                 if (err || !channels) {
    //                     return cb(err)
    //                 } else {
    //                     console.log("s5e2f45 channels", channels)
    //                     // Check if any other table has an empty sheet
    //                     for (let i = 0; i < channels.length; i++) {
    //                         console.log("s5e2f45 checking table", channels[i].players)
    //                         if (channels[i].players.length < channels[i].maxPlayers){
    //                             const player = channels[i].players.find(player => player.playerId === params.playerId);
    //                             console.log("s5e2f45 table has an empty seat", channels[i].players.length , channels[i].maxPlayers, player)
    //                             if(!player){
    //                                 console.log("s5e2f45 about to return 1", channels[i].channelId)
    //                                 return cb({ success: true, channelId: params.channelId, newChannelId: channels[i].channelId  });
    //                             }
    //                         }
    //                     }
    //                     console.log("s5e2f45 about to return 2", result)
    //                     return cb(result)
    //                 }
    //             })
    //         }
    //     })
    // }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    // New
    async findSuitableTable(params: any): Promise<any> {
        const tmpChannelId = params.channelId.split("-")[0];
        params.tmpChannelId = tmpChannelId;

        try {
            const channels = await this.db.findLastTables({ channelId: { $regex: tmpChannelId } });
            if (!channels || channels.length === 0) {
                return { success: false, info: "table is not available", channelId: params.channelId };
            }

            const similarChannels = channels.map(channel => channel.channelId);

            for (const channelId of similarChannels) {
                try {
                    const imdbTable = await this.imdb.getTable(channelId);
                    if (!imdbTable) {
                        return { isEmptyTable: true, success: true, channelId: params.channelId, newChannelId: channelId };
                    } else if (!imdbTable.players || imdbTable.players.length < imdbTable.maxPlayers) {
                        const player = imdbTable.players.find(player => player.playerId === params.playerId);
                        if (player) {
                            continue;
                        } else {
                            return {
                                isEmptyTable: imdbTable.players.length === 0,
                                success: true,
                                channelId: params.channelId,
                                newChannelId: imdbTable.channelId
                            };
                        }
                    } else {
                        continue;
                    }
                } catch (err) {
                    console.error(`Error processing channel ${channelId}:`, err);
                    continue;
                }
            }

            return { success: false, channelId: params.channelId, info: "You are already on the table" };
        } catch (err) {
            console.error("Error in findSuitableTable:", err);
            return { success: false, info: "table is not available", channelId: params.channelId };
        }
    }


    // Old
    // const findSuitableTable = (params, cb) => {
    //     console.log("in dynamicTable.similarTableJoin", params);
    //     params.tmpChannelId = params.channelId.split("-")[0]
    //     db.findLastTables({ channelId: { $regex: params.tmpChannelId } }, function (err, channels) {
    //         if (err || !channels) {
    //             cb({ success: false, info: "table is not available" })
    //         } else {
    //             params.similarChannels = _.pluck(channels, 'channelId');
    //             let foundChannelId = null;
    //             async.eachSeries(params.similarChannels, function (channelId, ecb) {
    //                 console.log('dynamicTable.similarTableJoin Processing channel - ' + channelId);
    //                 imdb.getTable(channelId, function (err, imdbTable) {
    //                     if (err) {
    //                         return ecb();
    //                     }
    //                     else if (!imdbTable) {
    //                         foundChannelId = channelId;
    //                         console.log('dynamicTable.similarTableJoin foundChannelId 1- ', foundChannelId);
    //                         return cb({ isEmptyTable : true, success: true, channelId: params.channelId, newChannelId: foundChannelId  });
    //                     }
    //                     else if (!imdbTable.players || imdbTable.players.length < imdbTable.maxPlayers) {
    //                         const player = imdbTable.players.find(player => player.playerId === params.playerId);
    //                         if (player) {
    //                             console.log("dynamicTable.similarTableJoin player is already on the table");
    //                             ecb();
    //                         } else {
    //                             console.log('dynamicTable.similarTableJoin foundChannelId 2- ', foundChannelId);
    //                             foundChannelId = imdbTable.channelId;
    //                             return cb({ isEmptyTable : imdbTable.players.length ? false : true, success: true, channelId: params.channelId, newChannelId: foundChannelId });
    //                         }
    //                     } else {
    //                         console.log("dynamicTable.similarTableJoin table is full");
    //                         ecb();
    //                     }
    //                 });
    //             },
    //                 function (err) {
    //                     console.log("errrrrrrrrrrrrrrr", err)
    //                     cb({ success: false, channelId: params.channelId, info: "You are already on the table" })
    //                 });
    //         }
    //     })
    // }
    /*============================  END  =================================*/





}