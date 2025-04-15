import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class ImdbDatabaseService {
  constructor(@InjectConnection('inMemoryDb') private inMemoryDb: Connection) {}

  /*----------------- Table Operations START ---------------------*/

  async removeTable(params: { channelId: string }): Promise<any> {
    try {
      return await this.inMemoryDb
        .collection('tables')
        .deleteOne({ channelId: params.channelId });
    } catch (err) {
      throw err;
    }
  }

  async removeCurrentPlayerWithChannelId(params: {
    channelId: string;
  }): Promise<any> {
    try {
      return await this.inMemoryDb
        .collection('currentPlayers')
        .deleteMany({ channelId: params.channelId });
    } catch (err) {
      throw err;
    }
  }

  async saveTable(params: any): Promise<any> {
    try {
      return await this.inMemoryDb
        .collection('tables')
        .updateOne({ channelId: params.channelId }, params, { upsert: true });
    } catch (err) {
      throw err;
    }
  }

  async setPlayerPoints(
    query: { channelId: string; playerId: string },
    points: any,
  ): Promise<any> {
    try {
      return await this.inMemoryDb
        .collection('tables')
        .updateOne(
          { channelId: query.channelId, 'players.playerId': query.playerId },
          { $set: { 'players.$.points': points.points } },
        );
    } catch (err) {
      throw err;
    }
  }

  async setPlayersData(
    query: { channelId: string; playerId: string },
    data: any,
  ): Promise<any> {
    try {
      return await this.inMemoryDb
        .collection('tables')
        .updateOne(
          { channelId: query.channelId, 'players.playerId': query.playerId },
          { $set: { 'players.$.lastRebuyBroadcastSentAt': data.currentTime } },
        );
    } catch (err) {
      throw err;
    }
  }

  async getPlayers(): Promise<any[]> {
    try {
      return await this.inMemoryDb
        .collection('tables')
        .aggregate([
          { $project: { channelId: 1, onlinePlayers: { $size: '$players' } } },
        ])
        .toArray();
    } catch (err) {
      throw err;
    }
  }

  async getAllTable(filter: any): Promise<any[]> {
    try {
      return await this.inMemoryDb.collection('tables').find(filter).toArray();
    } catch (err) {
      throw err;
    }
  }

  async findRunningTable(filter: any): Promise<any[]> {
    try {
      return await this.inMemoryDb
        .collection('tableJoinRecord')
        .find(filter)
        .toArray();
    } catch (err) {
      throw err;
    }
  }

  async getTable(channelId: string): Promise<any> {
    try {
      return await this.inMemoryDb
        .collection('tables')
        .findOne({ channelId: channelId.toString() });
    } catch (err) {
      throw err;
    }
  }

  async updateAllTable(filter: any, fieldUpdate: any): Promise<any> {
    try {
      return await this.inMemoryDb
        .collection('tables')
        .updateMany(filter, { $set: fieldUpdate });
    } catch (err) {
      throw err;
    }
  }

  async updateSeats(channelId: string, fieldUpdate: any): Promise<any> {
    try {
      return await this.inMemoryDb
        .collection('tables')
        .updateOne({ channelId: channelId }, { $set: fieldUpdate });
    } catch (err) {
      throw err;
    }
  }

  async pushPlayersInTable(players: any[], channelId: string): Promise<any> {
    try {
      const result = await this.inMemoryDb
        .collection('tables')
        .updateOne({ channelId: channelId.toString() }, {
          $push: { players: { $each: players } },
        } as any);
      const updatedTable = await this.inMemoryDb
        .collection('tables')
        .findOne({ channelId: channelId.toString() });
      return result;
    } catch (err) {
      throw err;
    }
  }

  async pushPlayersOnTableNew(players: any[], channelId: string): Promise<any> {
    try {
      return await this.inMemoryDb
        .collection('tables')
        .updateOne({ channelId: channelId }, {
          $push: { players: { $each: players } },
        } as any);
    } catch (err) {
      throw err;
    }
  }

  async getAllTableByTournamentIdNew(params: {
    tournamentId: string;
  }): Promise<any[]> {
    try {
      return await this.inMemoryDb
        .collection('tables')
        .find({ 'tournamentRules.tournamentId': params.tournamentId })
        .toArray();
    } catch (err) {
      throw err;
    }
  }

  async pullPlayersFromTable(
    players: string[],
    channelId: string,
  ): Promise<any> {
    try {
      return await this.inMemoryDb
        .collection('tables')
        .updateOne({ channelId: channelId.toString() }, {
          $pull: { players: { playerId: { $in: players } } },
        } as any);
    } catch (err) {
      throw err;
    }
  }

  async updateTableShuffleId(
    channelToBeFilledId: string,
    channelId: string,
  ): Promise<any> {
    try {
      return await this.inMemoryDb
        .collection('tables')
        .updateOne(
          { channelId: channelToBeFilledId.toString() },
          { $set: { shuffleTableId: channelId.toString() } },
        );
    } catch (err) {
      throw err;
    }
  }

  async findTableByTournamentId(
    tournamentId: string,
    playerId: string,
  ): Promise<any[]> {
    try {
      return await this.inMemoryDb
        .collection('tables')
        .find(
          { 'tournamentRules.tournamentId': tournamentId },
          { projection: { tournamentRules: 1, players: 1 } },
        )
        .toArray();
    } catch (err) {
      throw err;
    }
  }

  async findTableByChannelId(channelId: string): Promise<any> {
    try {
      return await this.inMemoryDb
        .collection('tables')
        .findOne({ channelId: channelId.toString() });
    } catch (err) {
      throw err;
    }
  }

  async getAllTableByTournamentId(params: {
    tournamentId: string;
  }): Promise<any[]> {
    try {
      return await this.inMemoryDb
        .collection('tables')
        .find({ 'tournamentRules.tournamentId': params.tournamentId })
        .toArray();
    } catch (err) {
      throw err;
    }
  }

  async setPrizeBroadcast(channelId: string, playerId: string): Promise<any> {
    try {
      return await this.inMemoryDb
        .collection('tables')
        .findOneAndUpdate(
          { channelId, 'tournamentRules.ranks.playerId': playerId },
          { $set: { 'tournamentRules.ranks.$.isPrizeBroadcastSent': true } },
          { returnDocument: 'after' },
        );
    } catch (err) {
      throw err;
    }
  }

  async findChannels(params: { tournamentId: string }): Promise<any[]> {
    try {
      return await this.inMemoryDb
        .collection('tables')
        .find({ 'tournamentRules.tournamentId': params.tournamentId })
        .toArray();
    } catch (err) {
      throw err;
    }
  }

  async getPlayerChannel(tournamentId: string, playerId: string): Promise<any> {
    try {
      return await this.inMemoryDb
        .collection('tables')
        .findOne({ channelId: tournamentId.toString() });
    } catch (err) {
      throw err;
    }
  }

  /*----------------- Tournament Ranks Operations START ---------------------*/

  async upsertRanks(query: any, data: any): Promise<any> {
    try {
      return await this.inMemoryDb
        .collection('tournamentRanks')
        .updateOne(query, { $set: data }, { upsert: true });
    } catch (err) {
      throw err;
    }
  }

  async deleteRanks(query: any): Promise<any> {
    try {
      return await this.inMemoryDb
        .collection('tournamentRanks')
        .deleteMany(query);
    } catch (err) {
      throw err;
    }
  }

  async getRanks(query: { tournamentId: string }): Promise<any> {
    try {
      return await this.inMemoryDb
        .collection('tournamentRanks')
        .findOne({ tournamentId: query.tournamentId });
    } catch (err) {
      throw err;
    }
  }

  /*----------------- Player Join Operations START ---------------------*/

  async savePlayerJoin(params: any): Promise<any> {
    try {
      return await this.inMemoryDb
        .collection('tableJoinRecord')
        .insertOne(params);
    } catch (err) {
      throw err;
    }
  }

  async upsertPlayerJoin(query: any, update: any): Promise<any> {
    try {
      return await this.inMemoryDb
        .collection('tableJoinRecord')
        .updateOne(query, update, { upsert: true });
    } catch (err) {
      throw err;
    }
  }

  async removePlayerJoin(filter: any): Promise<any> {
    try {
      return await this.inMemoryDb
        .collection('tableJoinRecord')
        .deleteMany(filter);
    } catch (err) {
      throw err;
    }
  }

  async isPlayerJoined(filter: any): Promise<number> {
    try {
      return await this.inMemoryDb
        .collection('tableJoinRecord')
        .countDocuments(filter);
    } catch (err) {
      throw err;
    }
  }

  async playerJoinedRecord(filter: any): Promise<any[]> {
    try {
      return await this.inMemoryDb
        .collection('tableJoinRecord')
        .find(filter, { projection: { _id: 0 } })
        .toArray();
    } catch (err) {
      throw err;
    }
  }

  /*----------------- User Activity Operations START ---------------------*/

  async findRefrenceNumber(filter: any): Promise<any[]> {
    try {
      return await this.inMemoryDb
        .collection('userActivity')
        .find(filter, { projection: { _id: 0, referenceNumber: 1 } })
        .toArray();
    } catch (err) {
      throw err;
    }
  }

  async upsertActivity(query: any, data: any): Promise<any> {
    data.updatedAt = Number(new Date());
    try {
      return await this.inMemoryDb
        .collection('userActivity')
        .updateOne(query, data, { upsert: true });
    } catch (err) {
      throw err;
    }
  }

  async updateIsCallTimeOver(query: {
    channelId: string;
    playerId: string;
    callTimeGameMissed: boolean;
    isCallTimeOver: boolean;
  }): Promise<any> {
    try {
      return await this.inMemoryDb.collection('tables').updateOne(
        { channelId: query.channelId, 'players.playerId': query.playerId },
        {
          $set: {
            'players.$.callTimeGameMissed': query.callTimeGameMissed,
            'players.$.playerCallTimer.isCallTimeOver': query.isCallTimeOver,
          },
        },
      );
    } catch (err) {
      throw err;
    }
  }

  /*----------------- EV Chop Operations START ---------------------*/

  async updateEvChop(query: {
    channelId: string;
    playerId: string;
    evChop: any;
  }): Promise<any> {
    try {
      return await this.inMemoryDb.collection('tables').findOneAndUpdate(
        {
          channelId: query.channelId,
          'players.playerId': query.playerId,
        },
        {
          $set: { 'players.$.evChop': query.evChop },
        },
        {
          returnDocument: 'after',
        },
      );
    } catch (err) {
      throw err;
    }
  }

  async updateEvRIT(query: {
    channelId: string;
    playerId: string;
    evRIT: any;
  }): Promise<any> {
    console.log('printing Query inside updateEvChopToGiven', query);
    try {
      return await this.inMemoryDb.collection('tables').findOneAndUpdate(
        {
          channelId: query.channelId,
          'players.playerId': query.playerId,
        },
        {
          $set: { 'players.$.evRIT': query.evRIT },
        },
        {
          returnDocument: 'after',
        },
      );
    } catch (err) {
      throw err;
    }
  }

  async EvChopDetails(channelId: string, fieldUpdate: any): Promise<any> {
    console.log('evchop update to details are', channelId, fieldUpdate);
    try {
      return await this.inMemoryDb
        .collection('tables')
        .findOneAndUpdate(
          { channelId: channelId },
          { $set: fieldUpdate },
          { returnDocument: 'after' },
        );
    } catch (err) {
      throw err;
    }
  }

  async resetEvChop(query: { channelId: string }): Promise<any> {
    try {
      return await this.inMemoryDb
        .collection('tables')
        .findOneAndUpdate(
          { channelId: query.channelId },
          {
            $unset: {
              'players.$[].evChop': 1,
              'players.$[].evRIT': 1,
              evChopDetails: 1,
            },
          },
          { returnDocument: 'after' },
        );
    } catch (err) {
      throw err;
    }
  }

  /*----------------- User Activity Operations START ---------------------*/

  async updateIsSit(query: any): Promise<any> {
    try {
      return await this.inMemoryDb
        .collection('userActivity')
        .updateOne(query, { $set: { isSit: true } });
    } catch (err) {
      throw err;
    }
  }

  async getActivity(query: any): Promise<any[]> {
    try {
      return await this.inMemoryDb
        .collection('userActivity')
        .find(query, { projection: { _id: 0 } })
        .toArray();
    } catch (err) {
      throw err;
    }
  }

  async removeActivity(filter: any): Promise<any> {
    try {
      return await this.inMemoryDb
        .collection('userActivity')
        .deleteMany(filter);
    } catch (err) {
      throw err;
    }
  }

  /*----------------- Logging Operations START ---------------------*/

  async insertLog(params: { log: any }): Promise<any> {
    try {
      return await this.inMemoryDb.collection('infoLogs').insertOne({
        createdAt: new Date(),
        log: params.log,
      });
    } catch (err) {
      throw err;
    }
  }

  async updateOnlinePlayers(onlinePlayers: any[]): Promise<any> {
    try {
      return await this.inMemoryDb
        .collection('onlinePlayers')
        .updateOne({}, { onlinePlayers: onlinePlayers }, { upsert: true });
    } catch (err) {
      throw err;
    }
  }

  /*----------------- Table Settings Operations START ---------------------*/

  async findTableSetting(query: any): Promise<any> {
    try {
      return await this.inMemoryDb.collection('tableSetting').findOne(query);
    } catch (err) {
      throw err;
    }
  }

  async insertTableSetting(data: any): Promise<any> {
    try {
      const result: any = await this.inMemoryDb
        .collection('tableSetting')
        .insertOne(data);
      return result.ops[0];
    } catch (err) {
      throw err;
    }
  }

  async updateTableSetting(query: any, updateKeys: any): Promise<any> {
    try {
      return await this.inMemoryDb
        .collection('tableSetting')
        .updateOne(query, updateKeys);
    } catch (err) {
      throw err;
    }
  }

  async removeTableSetting(query: any): Promise<any> {
    try {
      return await this.inMemoryDb.collection('tableSetting').deleteMany(query);
    } catch (err) {
      throw err;
    }
  }

  async getPlayerAsSpectatorById(query: any): Promise<any> {
    try {
      return await this.inMemoryDb
        .collection('tableSetting')
        .find(query, { projection: { playerName: 1, playerId: 1, _id: 0 } })
        .toArray();
    } catch (err) {
      throw err;
    }
  }

  /*----------------- Current Players Operations START ---------------------*/

  async saveCurrentPlayer(data: any): Promise<any> {
    try {
      return await this.inMemoryDb.collection('currentPlayers').insertOne(data);
    } catch (err) {
      throw err;
    }
  }

  async getCurrentPlayers(player: {
    seatIndex: number;
    channelId: string;
  }): Promise<any> {
    try {
      return await this.inMemoryDb
        .collection('currentPlayers')
        .findOne({ seatIndex: player.seatIndex, channelId: player.channelId });
    } catch (err) {
      throw err;
    }
  }

  async removeCurrentPlayer(player: {
    seatIndex: number;
    channelId: string;
  }): Promise<any> {
    try {
      return await this.inMemoryDb
        .collection('currentPlayers')
        .deleteMany({
          seatIndex: player.seatIndex,
          channelId: player.channelId,
        });
    } catch (err) {
      throw err;
    }
  }

  /*----------------- Player State Operations START ---------------------*/

  async getDisconnectedPlayerDetails(channelId: string): Promise<any> {
    try {
      return await this.inMemoryDb
        .collection('tables')
        .findOne({ channelId: channelId });
    } catch (err) {
      throw err;
    }
  }

  async playerStateUpdateOnDisconnections(
    channelId: string,
    playerId: string,
    state: string,
    previousState: string,
  ): Promise<any> {
    try {
      return await this.inMemoryDb.collection('tables').updateOne(
        { channelId: channelId, 'players.playerId': playerId },
        {
          $set: {
            'players.$.state': state,
            'players.$.previousState': previousState,
            'players.$.lastChangedStateTime': new Date(),
          },
        },
      );
    } catch (err) {
      throw err;
    }
  }

  async getPlayerData(channelId: string): Promise<any> {
    try {
      return await this.inMemoryDb
        .collection('tables')
        .findOne({ channelId: channelId });
    } catch (err) {
      throw err;
    }
  }

  async getCallTime(query: any): Promise<any> {
    try {
      const result = await this.inMemoryDb
        .collection('tables')
        .findOne(query, { projection: { callTime: 1, _id: 0 } });
      return result?.callTime;
    } catch (err) {
      throw err;
    }
  }

  async updatePlayerAPB(
    channelId: string,
    playerId: string,
    apbFlag: boolean,
  ): Promise<any> {
    try {
      return await this.inMemoryDb.collection('tables').updateOne(
        { channelId: channelId, 'players.playerId': playerId },
        {
          $set: {
            'players.$.isForceBlindEnable': apbFlag,
            'players.$.isForceBlindVisible': apbFlag,
          },
        },
      );
    } catch (err) {
      throw err;
    }
  }

  async updatePlayerCallTimer(
    query: {
      channelId: string;
      playerId: string;
    },
    fieldUpdate: any,
  ): Promise<any> {
    try {
      return await this.inMemoryDb
        .collection('tables')
        .updateOne(
          { channelId: query.channelId, 'players.playerId': query.playerId },
          { $set: { 'players.$.playerCallTimer': fieldUpdate } },
        );
    } catch (err) {
      throw err;
    }
  }

  async updateChannelVariation(
    channelId: string,
    fieldUpdate: any,
  ): Promise<any> {
    try {
      return await this.inMemoryDb
        .collection('tables')
        .updateOne({ channelId: channelId }, { $set: fieldUpdate });
    } catch (err) {
      throw err;
    }
  }

  async findDataForCallTime(params: {
    channelId: string;
    userName: string;
  }): Promise<any> {
    try {
      return await this.inMemoryDb
        .collection('tables')
        .findOne(
          { channelId: params.channelId },
          {
            projection: {
              players: { $elemMatch: { playerName: params.userName } },
            },
          },
        );
    } catch (err) {
      throw err;
    }
  }

  /*----------------- Player Score Operations START ---------------------*/

  async removePlayerScore(params: any): Promise<any> {
    try {
      return await this.inMemoryDb.collection('playerScore').deleteMany(params);
    } catch (err) {
      throw err;
    }
  }

  async addPlayerScore(params: any): Promise<any> {
    try {
      return await this.inMemoryDb.collection('playerScore').insertOne(params);
    } catch (err) {
      throw err;
    }
  }

  async getPlayerBuyInSum(params: {
    playerId: string;
    channelId: string;
  }): Promise<any[]> {
    try {
      return await this.inMemoryDb
        .collection('playerScore')
        .aggregate([
          {
            $match: {
              $and: [
                { playerId: params.playerId },
                { channelId: params.channelId },
              ],
            },
          },
          { $group: { _id: null, sum: { $sum: '$amount' } } },
        ])
        .toArray();
    } catch (err) {
      throw err;
    }
  }

  async getAllPlayerBuyInSum(params: { channelId: string }): Promise<any[]> {
    try {
      return await this.inMemoryDb
        .collection('playerScore')
        .aggregate([
          {
            $match: {
              channelId: params.channelId,
            },
          },
          { $group: { _id: '$playerId', totalBuyIns: { $sum: '$amount' } } },
        ])
        .toArray();
    } catch (err) {
      throw err;
    }
  }

  async getPlayerBuyIn(query: any): Promise<any[]> {
    try {
      return await this.inMemoryDb
        .collection('playerScore')
        .find(query)
        .toArray();
    } catch (err) {
      throw err;
    }
  }

  /*----------------- Card Show Operations START ---------------------*/

  async insertCardShow(params: any): Promise<any> {
    try {
      return await this.inMemoryDb.collection('cardShow').insertOne(params);
    } catch (err) {
      throw err;
    }
  }

  async removeCardShow(params: any): Promise<any> {
    try {
      return await this.inMemoryDb.collection('cardShow').deleteMany(params);
    } catch (err) {
      throw err;
    }
  }

  async getCardShow(params: any): Promise<any[]> {
    try {
      return await this.inMemoryDb
        .collection('cardShow')
        .find(params)
        .toArray();
    } catch (err) {
      throw err;
    }
  }

  /*----------------- Network IP Operations START ---------------------*/

  async getPlayersDetailsByIPaddress(
    channelId: string,
    netWorkIP: string,
  ): Promise<number> {
    try {
      return await this.inMemoryDb
        .collection('tables')
        .countDocuments({
          channelId: channelId,
          'players.networkIp': netWorkIP,
        });
    } catch (err) {
      throw err;
    }
  }

  async getPlayersCountsForIP(
    channelId: string,
    netWorkIP: string,
    playerId: string,
  ): Promise<number> {
    try {
      return await this.inMemoryDb.collection('tables').countDocuments({
        channelId: channelId,
        'players.networkIp': netWorkIP,
        'players.playerId': { $ne: playerId },
      });
    } catch (err) {
      throw err;
    }
  }


  async updateTableAndModify(a1:any,a2:any,a3:any,a4:any) {

    try {
      

      const result = await this.inMemoryDb.collection("tables").findAndModify(
        a1,
        a2,
        a3,
        a4
    );

    return result;


    } catch (error) {
      throw error;
    }

  }


}
