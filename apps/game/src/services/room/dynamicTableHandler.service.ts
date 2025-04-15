import { Injectable } from "@nestjs/common";
import { ImdbDatabaseService } from "shared/common/datebase/Imdbdatabase.service";
import { PokerDatabaseService } from "shared/common/datebase/pokerdatabase.service";
import { BroadcastHandlerService } from "./broadcastHandler.service";
import { systemConfig, stateOfX, popupTextManager } from 'shared/common';
import { Cron } from "@nestjs/schedule";












@Injectable()
export class DynamicTableHandlerService {

    constructor(
        private readonly db: PokerDatabaseService,
        private readonly imdb: ImdbDatabaseService,
        private readonly broadcastHandler:BroadcastHandlerService

    ) { }






    /*====================================  START  ============================*/

    // New
    async process(params: any): Promise<void> {

        const tmpChannelId = params.table.channelId.split('-')[0];

        try {
            const channels = await this.imdb.getAllTable({ channelId: { $regex: tmpChannelId } });

            if (!channels) {
                return;
            }


            let playingPlayers = 0;
            for (const channel of channels) {
                playingPlayers += channel.players.length;
            }

            if (params.table.maxPlayers * channels.length === playingPlayers) {
                let channelId = params.table.channelId;
                if (!params.table.isMasterTable) {
                    channelId = params.table.masterChannelId;
                }

                const res = await this.db.findLastTables({ channelId: { $regex: channelId } });

                if (res && res[0]) {
                    const totalSeats = res[0].maxPlayers * res.length;

                    if (totalSeats <= playingPlayers) {
                        if (res[0].secondId > res.length) {
                            let secondIds = res.map((r) => r.secondId);
                            console.log('table no need to verify', secondIds);
                            secondIds.sort((a, b) => a - b);

                            let smallestMissing = 1;
                            for (const id of secondIds) {
                                if (id < smallestMissing) {
                                    continue;
                                } else if (id === smallestMissing) {
                                    smallestMissing++;
                                } else {
                                    break;
                                }
                            }

                            res[0].secondId = smallestMissing > 1 ? smallestMissing - 1 : 1;
                        }

                        for (const table of res) {
                            this.informOnTable({ channelId: table.channelI });
                        }

                        await this.createTable(res[0]);
                    }
                }
            } else {
                console.log(
                    `${params.table.maxPlayers * channels.length - playingPlayers
                    } seats are already empty, so no need to create a new table!`,
                );
            }
        } catch (err) {
            console.error('Error in dynamicTable.process:', err);
        }
    }

    // Old
        // dynamicTable.process = params => {
        //     console.log("got a request to check if we need to clone a table or not", params.table);
        //     // Fetch all the tables
        //     let tmpChannelId = params.table.channelId.split("-")[0]
        //     console.log("this is the channelID", tmpChannelId)
        //     imdb.getAllTable({ channelId: { $regex: tmpChannelId } }, (err, channels) => {
        //         if (err || !channels) {
        //             console.log("error", err);
        //         } else {
        //             console.log("6r4tcee26f channels", channels)
        //             // Check if any other table has an empty sheet
        //             let playingPlayers = 0;
        //             for (let i = 0; i < channels.length; i++) {
        //                 playingPlayers += channels[i].players.length
        //             }
        //             console.log("6r4tcee26f playingPlayers", playingPlayers)
        //             console.log("should we create a new table 2 >", playingPlayers, params.table.maxPlayers * channels.length);
        //             if (params.table.maxPlayers * channels.length === playingPlayers) {
        //                 // All tables are full, so we need to create a new table
        //                 let channelId = params.table.channelId;
        //                 if (!params.table.isMasterTable) {
        //                     channelId = params.table.masterChannelId;
        //                 }
        //                 db.findLastTables({ channelId: { $regex: channelId } }, async (err, res) => {
        //                     console.log("6r4tcee26f res is", channelId, res)
        //                     if (!err && res && res[0]) {
        //                         // Check if we have already reached the maximum number of tables
        //                         let totalSeats = res[0].maxPlayers * res.length;
        //                         console.log("6r4tcee26f totalSeats", totalSeats, "playingPlayers", playingPlayers)
        //                         if (totalSeats > playingPlayers) {
        //                             // We already have sufficient tables
        //                         } else {
        //                             // We need to create a new table
        //                             console.log("6r4tcee26f res[0]", res[0])
        //                             if (res[0].secondId > res.length) {
        //                                 let secondIds = _.pluck(res, "secondId");
        //                                 console.log("table no need to verify", secondIds)
        //                                 secondIds.sort((a, b) => a - b);
        //                                 let smallestMissing = 1;
        //                                 for (let i = 0; i < secondIds.length; i++) {
        //                                     if (secondIds[i] < smallestMissing) {
        //                                         continue;
        //                                     } else if (secondIds[i] === smallestMissing) {
        //                                         smallestMissing++;
        //                                     } else {
        //                                         break;
        //                                     }
        //                                 }
        //                                 res[0].secondId = smallestMissing > 1 ? smallestMissing - 1 : 1;
        //                             }
        //                             for (let i = 0; i < res.length; i++) {
        //                                 informOnTable({ channelId: res[i].channelI })
        //                             }
        //                             createTable(res[0]);
        //                         }
        //                     }
        //                 });
        //             } else {
        //                 console.log(`${params.table.maxPlayers * channels.length - playingPlayers} seats are already empty, so no need to create a new table!`);
        //             }
        //         }
        //     });
        // };
    /*====================================  START  ============================*/


    /*====================================  START  ============================*/

    // New
    async createTable(params: any): Promise<any> {
        params.secondId += 1;
    
        if (params.isMasterTable) {
          params.masterChannelId = params.channelId;
          params.masterTableName = params.channelName;
          params.channelName = params.channelName + params.secondId;
          params.channelId = params.channelId + '-' + params.secondId;
        } else {
          params.masterChannelId = params.masterChannelId;
          params.masterTableName = params.masterTableName;
          params.channelName = params.masterTableName + params.secondId;
          params.channelId = params.masterChannelId + '-' + params.secondId;
        }
    
        params.isMasterTable = false;
        params.createdAt = Number(new Date());
        params._id = params.channelId;
    
        const tableData = {
          _id: params.channelId,
          channelId: params.channelId,
          updated: {
            isRealMoney: params.isRealMoney,
            channelName: params.channelName,
            turnTime: params.turnTime,
            callTime: params.callTime,
            maxPlayers: params.maxPlayers,
            smallBlind: params.smallBlind,
            bigBlind: params.bigBlind,
            minBuyIn: params.minBuyIn,
            maxBuyIn: params.maxBuyIn,
            channelVariation: params.channelVariation,
            minPlayers: params.minPlayers,
            favourite: params.favourite,
            channelType: params.channelType,
            tableAutoStraddle: params.isStraddleEnable || false,
            isRunItTwiceTable: params.isRunItTwiceTable || false,
            isPrivateTabel: params.isPrivateTabel,
            avgStack: params.avgStack || 0,
            flopPercent: params.flopPercent || 0,
            isPotLimit: params.isPotLimit,
            playingPlayers: params.playingPlayers || 0,
            queuePlayers: params.queuePlayers || 0,
          },
          event: 'CASHGAMETABLECHANGE',
        };
    
        this.broadcastHandler.fireBroadcastToAllSessions({
          app: {},
          data: tableData,
          route: 'addTable',
        });
    
        console.log('going to save table', params);
    
        try {
          const result = await this.db.createNewTable(params);
          console.log('err, res while creating a clone table', null, result);
          return { success: true };
        } catch (err) {
          console.log('err, res while creating a clone table', err, null);
          return { success: false };
        }
      }

    // Old
    // const createTable = params => {
    //     params.secondId += 1;
    //     if (params.isMasterTable) {
    //         params.masterChannelId = params.channelId;
    //         params.masterTableName = params.channelName;
    //         params.channelName = params.channelName + params.secondId;
    //         params.channelId = params.channelId + "-" + params.secondId;
    //     } else {
    //         params.masterChannelId = params.masterChannelId;
    //         params.masterTableName = params.masterTableName;
    //         params.channelName = params.masterTableName + params.secondId;
    //         params.channelId = params.masterChannelId + "-" + params.secondId;
    //     }
    //     params.isMasterTable = false;
    //     params.createdAt = Number(new Date())
    //     params._id = params.channelId

    //     const tableData = {
    //         '_id': params.channelId,
    //         'channelId': params.channelId,
    //         'updated': {
    //             'isRealMoney': params.isRealMoney,
    //             'channelName': params.channelName,
    //             'turnTime': params.turnTime,
    //             'callTime': params.callTime,
    //             'maxPlayers': params.maxPlayers,
    //             'smallBlind': params.smallBlind,
    //             'bigBlind': params.bigBlind,
    //             'minBuyIn': params.minBuyIn,
    //             'maxBuyIn': params.maxBuyIn,
    //             'channelVariation': params.channelVariation,
    //             'minPlayers': params.minPlayers,
    //             'favourite': params.favourite,
    //             'channelType': params.channelType,
    //             'tableAutoStraddle': params.isStraddleEnable || false,
    //             'isRunItTwiceTable': params.isRunItTwiceTable || false,
    //             'isPrivateTabel': params.isPrivateTabel,
    //             'avgStack': params.avgStack || 0,
    //             'flopPercent': params.flopPercent || 0,
    //             'isPotLimit': params.isPotLimit,
    //             'playingPlayers': params.playingPlayers || 0,
    //             'queuePlayers': params.queuePlayers || 0
    //         },
    //         'event': "CASHGAMETABLECHANGE"
    //     }
    //     broadcastHandler.fireBroadcastToAllSessions({ app: {}, data: tableData, route: "addTable" });
    //     console.log("going to save table", params)
    //     db.createNewTable(params, (err, result) => {
    //         console.log("err , res while creating a clone table", err, result)
    //         if (!err) {
    //             return { success: true }
    //         } else {
    //             return { success: false }
    //         }
    //     })
    // }
    /*====================================  END  ============================*/

    /*====================================  START  ============================*/

    // New
    informOnTable(params: any): void {
        this.broadcastHandler.newSimilarTable({
          channelId: params.channelId,
          info: 'a new table has been started, Please join!',
        });
      }

    // Old
    // const informOnTable = (params) => {
    //     console.log("got a request to inform players", params)
    //     broadcastHandler.newSimilarTable({ channelId: params.channelId, info: `a new table has been started, Please join!` })
    // }
    /*====================================  END  ============================*/
    
    
    /*====================================  START  ============================*/

    // New
@Cron('*/30 * * * * *') // runs every 30 seconds
  async removeTable(): Promise<void> {
    const dbTables = await this.db.findLastTables({});
    if (dbTables?.length) {
      for (const table of dbTables) {
        if (!table.isMasterTable) {
          console.log('x4d0006: each table is >', table.channelName);

          const imdbTables = await this.imdb.getAllTable({ channelId: table.channelId });
          if (imdbTables?.length) {
            console.log('x4d0006: can not remove running table >', imdbTables[0].channelName);
          } else {
            const antiBankingData = await this.db.getTableAntiBanking({ channelId: table.channelId });
            console.log('x4d0006: antiBankingData', Number(new Date()), antiBankingData);

            const createdAt = antiBankingData?.[0]?.createdAt ? Number(antiBankingData[0].createdAt) : 0;
            const expiringAt = systemConfig.expireAntiBankingSeconds * 1000 + createdAt;


            if (expiringAt < Number(new Date())) {

              const tmpChannelId = table.channelId.split('-')[0];
              const relatedTables = await this.imdb.getAllTable({ channelId: { $regex: tmpChannelId } });

              let playingPlayers = 0;
              let totalRequiredTable = 0;
              let sameTable = 0;

              if (relatedTables?.length) {
                for (const relatedTable of relatedTables) {
                  playingPlayers += relatedTable.players.length;
                }

                totalRequiredTable = Math.ceil(playingPlayers / relatedTables[0].maxPlayers);
                if (playingPlayers === totalRequiredTable * relatedTables[0].maxPlayers) {
                  totalRequiredTable++;
                }

                for (const eachTable of dbTables) {
                  const eachTableChannelId = eachTable.channelId.split('-')[0];
                  console.log('x4d0006: eachTableChannelId, tmpChannelId', eachTableChannelId, tmpChannelId);
                  if (eachTableChannelId === tmpChannelId) {
                    sameTable++;
                  }
                }
              } else {
                console.log('x4d0006: no running table found', tmpChannelId);
              }

              console.log('x4d0006: playingPlayers', playingPlayers, 'totalRequiredTable', totalRequiredTable, 'sameTable', sameTable);

              if (!totalRequiredTable || totalRequiredTable < sameTable) {
                await this.db.removeCloneTable({ channelId: table.channelId });
                this.broadcastHandler.fireBroadcastToAllSessions({
                  app: {},
                  data: { event: 'DISABLETABLE', _id: table.channelId },
                  route: 'removeTable',
                });
                console.log('x4d0006: removed clone table', table.channelId);
              }
            } else {
              console.log('x4d0006: can not remove table with active antibanking');
            }
          }
        }
      }
    }



    // Old
    // dynamicTable.removeTable = () => {
    //     schedule.scheduleJob('*/30 * * * * *', function () {
    //         db.findLastTables({}, (err, dbTables) => {
    //             if (!err && dbTables && dbTables.length) {
    //                 for (let table of dbTables) {
    //                     if (!table.isMasterTable) {
    //                         console.log(" x4d0006: each tables is >", table.channelName)
    //                         imdb.getAllTable({ channelId: table.channelId }, (err, imdbTables) => {
    //                             // console.log(` x4d0006: imdb table for ${table.channelId} is`, imdbTables)
    //                             if (!err && imdbTables && imdbTables.length) {
    //                                 console.log(" x4d0006: can not remove running table >", imdbTables[0].channelName)
    //                             } else {
    //                                 db.getTableAntiBanking({ channelId: table.channelId }, (err, antiBankingData) => {
    //                                     console.log(" x4d0006: antiBankingData", Number(new Date()), antiBankingData)
    //                                     let expiringAt = systemConfig.expireAntiBankingSeconds * 1000 + Number(antiBankingData && antiBankingData[0] && antiBankingData[0].createdAt ? antiBankingData[0].createdAt : 0);
    //                                     console.log(" x4d0006: expiring at", new Date(expiringAt), "c T : >", new Date())
    //                                     if (expiringAt < Number(new Date())) {
    //                                         console.log(" x4d0006: either antiBanking not found or it has been expired", antiBankingData)
    //                                         let tmpChannelId = table.channelId.split("-")[0];
    //                                         imdb.getAllTable({ channelId: { $regex: tmpChannelId } }, (err, imdbTables) => {
    //                                             let playingPlayers = 0;
    //                                             let totalRequiredTable = 0;
    //                                             let sameTable = 0;
    //                                             if (!err && imdbTables && imdbTables[0]) {
    //                                                 //calculate occupied seats
    //                                                 for (let i = 0; i < imdbTables.length; i++) {
    //                                                     playingPlayers += imdbTables[i].players.length
    //                                                 }
    //                                                 //calculate max required tables for occupied tables
    //                                                 totalRequiredTable = Math.ceil(playingPlayers / imdbTables[0].maxPlayers);
    //                                                 // /if all tables are full then we need a empty table
    //                                                 if (playingPlayers === totalRequiredTable * imdbTables[0].maxPlayers) {
    //                                                     totalRequiredTable++
    //                                                 }
    //                                                 for (let eachTable of dbTables) {
    //                                                     let eachTableChannelId = eachTable.channelId.split("-")[0];
    //                                                     console.log(" x4d0006: eachTableChannelId, tmpChannelId", eachTableChannelId, tmpChannelId)
    //                                                     if (eachTableChannelId === tmpChannelId) {
    //                                                         sameTable++;
    //                                                     }
    //                                                 }
    //                                             } else {
    //                                                 console.log(" x4d0006: no running table found", tmpChannelId)
    //                                             }
    //                                             console.log(" x4d0006: playingPlayers", playingPlayers, "totalRequiredTable", totalRequiredTable, "sameTable", sameTable)
    //                                             if (!totalRequiredTable || totalRequiredTable < sameTable) {
    //                                                 db.removeCloneTable({ channelId: table.channelId }, (err, res) => {
    //                                                     broadcastHandler.fireBroadcastToAllSessions({ app: {}, data: { event: 'DISABLETABLE', _id: table.channelId }, route: "removeTable" });
    //                                                     console.log(" x4d0006: err while removing a clone tables", table.channelId, err, res)
    //                                                 })
    //                                             }
    //                                         })
    //                                     } else {
    //                                         console.log(" x4d0006: can not remove table with antibanking")
    //                                     }
    //                                 })
    //                             }
    //                         })
    //                     }
    //                 }
    //             }
    //         })
    //     })
    // }
    /*====================================  END  ============================*/























}