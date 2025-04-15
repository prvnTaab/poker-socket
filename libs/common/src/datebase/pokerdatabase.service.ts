import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import stateOfX from '../stateOfX.sevice';
import systemConfig from '../systemConfig.json';

@Injectable()
export class PokerDatabaseService {
  constructor(@InjectConnection('db') private db: Connection) {}

  async updateSubUsedCount(query: any, updateKeys: any): Promise<any> {
    try {
      return await this.db
        .collection('subscriptionList')
        .updateOne(query, { $inc: { usedCount: 1 } });
    } catch (err) {
      throw err;
    }
  }

  async getSubscription(query: any): Promise<any[]> {
    try {
      return await this.db
        .collection('subscriptionList')
        .find(query)
        .sort({ promotionEndDate: 1 })
        .toArray();
    } catch (err) {
      throw err;
    }
  }

  // Bonus model
  async createBonus(query: any): Promise<any> {
    console.log('inside createBonus ', query);
    try {
      return await this.db.collection('bonusCollection').insertOne(query);
    } catch (err) {
      throw err;
    }
  }

  async updateBonus(query: any, updateKeys: any): Promise<any> {
    try {
      return await this.db
        .collection('bonusCollection')
        .updateOne(query, { $set: updateKeys });
    } catch (err) {
      throw err;
    }
  }

  async findBonus(query: any): Promise<any[]> {
    console.log('inside findAll in findBonus', query);
    const newQuery: any = {};

    if (query.profile) newQuery.profile = query.profile;
    if (query.codeName) newQuery.codeName = eval('/^' + query.codeName + '$/i');
    if (query.bonusPercent) newQuery.bonusPercent = query.bonusPercent;
    if (query.bonusCodeType)
      newQuery['bonusCodeType.type'] = query.bonusCodeType.type;
    if (query.type) newQuery['bonusCodeType.type'] = query.type;
    if (query.status) newQuery.status = query.status;
    if (query.createdBy) newQuery.createdBy = query.createdBy;
    if (query._id) newQuery._id = new Object(query._id);

    const skip = query.skip || 0;
    const limit = query.limit || 20;

    console.log('inside findAll211 ', newQuery);
    try {
      return await this.db
        .collection('bonusCollection')
        .find(newQuery)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .toArray();
    } catch (err) {
      throw err;
    }
  }

  // Affiliates model
  async findUserOrOperation(filter: any): Promise<any> {
    try {
      return await this.db.collection('affiliates').findOne({
        $or: [
          { email: filter.emailId },
          { userName: filter.userName },
          { mobile: filter.mobileNumber },
        ],
      });
    } catch (err) {
      throw err;
    }
  }

  async updateteAffiliateRakeBalance(
    userdata: any,
    userid: string,
  ): Promise<any> {
    console.log(
      'updateteAffiliateRakeBalance' +
        JSON.stringify(userdata) +
        'userid' +
        userid,
    );
    try {
      return await this.db
        .collection('affiliates')
        .updateOne({ _id: new Object(userid) }, { $inc: userdata });
    } catch (err) {
      throw err;
    }
  }

  async companyRakeBalance(balance: any): Promise<any> {
    try {
      return await this.db
        .collection('affiliates')
        .updateOne({ role: 'company' }, { $inc: balance });
    } catch (err) {
      throw err;
    }
  }

  async getUser(query: any): Promise<any> {
    try {
      return await this.db.collection('affiliates').findOne(query);
    } catch (err) {
      throw err;
    }
  }

  async saveTransferChipsPlayerHistory(query: any): Promise<any> {
    console.log('inside saveTransferChipsPlayerHistory db query --', query);
    try {
      return await this.db
        .collection('chipstransferToPlayerHistory')
        .insertOne(query);
    } catch (err) {
      throw err;
    }
  }

  // Loyalty points model
  async findAllLoyaltyPoints(query: any): Promise<any[]> {
    try {
      return await this.db
        .collection('loyaltyPoints')
        .find(query)
        .sort({ levelId: 1 })
        .toArray();
    } catch (err) {
      throw err;
    }
  }

  // Daily logged in user model
  async dailyLoggedInUser(userData: any): Promise<any> {
    console.log('i got data in dailyLoggedInUser', userData);
    try {
      return await this.db.collection('dailyLoggedInUser').insertOne(userData);
    } catch (err) {
      throw err;
    }
  }

  async updateDailyLoggedInUser(query: any, data: any): Promise<any> {
    try {
      return await this.db
        .collection('dailyLoggedInUser')
        .updateOne(query, { $set: data });
    } catch (err) {
      throw err;
    }
  }

  async findDevice(query: any): Promise<any[]> {
    console.log('findDeviceType rws is: query is', query);
    try {
      return await this.db
        .collection('dailyLoggedInUser')
        .find(query)
        .limit(1)
        .sort({ loginTime: -1 })
        .toArray();
    } catch (err) {
      throw err;
    }
  }

  // PAN card management
  async createPancardVerificationRequest(query: any): Promise<any> {
    console.log('in update user in dbQuery - ' + JSON.stringify(query));
    try {
      return await this.db.collection('approvePANCard').insertOne(query);
    } catch (err) {
      throw err;
    }
  }

  async findLastTenUcbToRcTransaction(playerId: string): Promise<any[]> {
    try {
      return await this.db
        .collection('loyaltyPointTransactionHistory')
        .find(
          {
            playerId: playerId,
            rakebackAmount: { $gt: 0 },
          },
          {
            projection: {
              currentDateTime: 1,
              userName: 1,
              loyaltyLevelBefore: 1,
              rakeBackPrecentage: 1,
              grossRakeGenerated: 1,
              rakebackAmount: 1,
              _id: 0,
            },
          },
        )
        .sort({ currentDateTime: -1 })
        .limit(20)
        .toArray();
    } catch (err) {
      throw err;
    }
  }

  async lastSuccessCron(): Promise<any[]> {
    try {
      return await this.db
        .collection('cron')
        .find({
          jobType: 'loyaltyPoint',
          success: true,
        })
        .sort({ endDate: -1 })
        .limit(1)
        .toArray();
    } catch (err) {
      throw err;
    }
  }

  async findUserPanCard(playerId: string): Promise<any[]> {
    try {
      return await this.db
        .collection('approvePANCard')
        .find({ playerId: playerId })
        .toArray();
    } catch (err) {
      throw err;
    }
  }

  async findUserPanCardStatus(playerId: string): Promise<any[]> {
    try {
      return await this.db
        .collection('panCardHistory')
        .find({ playerId: playerId })
        .toArray();
    } catch (err) {
      throw err;
    }
  }

  // Transaction history
  async createDepositHistory(query: any): Promise<any> {
    try {
      return await this.db.collection('transactionHistory').insertOne(query);
    } catch (err) {
      throw err;
    }
  }

  async findTransactionHistory(query: any): Promise<any[]> {
    console.log('inside findTransactionHistory ------ ', query);
    const skip = query.skip || 0;
    const limit = query.limit || 1000000;
    const sortValue = query.sortValue;

    delete query.sortValue;
    delete query.skip;
    delete query.limit;

    try {
      return await this.db
        .collection('transactionHistory')
        .find(query)
        .skip(skip)
        .limit(limit)
        .sort({ [sortValue]: -1 })
        .toArray();
    } catch (err) {
      throw err;
    }
  }

  async findAffiliates(filter: any): Promise<any> {
    try {
      return await this.db.collection('affiliates').findOne(filter);
    } catch (err) {
      throw err;
    }
  }

  // Cash out queries
  async createCashOutRequest(data: any): Promise<any> {
    try {
      return await this.db.collection('pendingCashOutRequest').insertOne(data);
    } catch (err) {
      throw err;
    }
  }

  async listPendingCashOutRequest(query: any): Promise<any[]> {
    try {
      return await this.db
        .collection('pendingCashOutRequest')
        .find(query)
        .toArray();
    } catch (err) {
      throw err;
    }
  }

  async listApproveCashOutRequest(query: any): Promise<any[]> {
    try {
      return await this.db
        .collection('approveCashOutRequest')
        .find(query)
        .toArray();
    } catch (err) {
      throw err;
    }
  }

  async listCashOutHistory(query: any): Promise<any[]> {
    try {
      return await this.db.collection('cashoutHistory').find(query).toArray();
    } catch (err) {
      throw err;
    }
  }

  async craeteCashoutRequestForPlayerThroughGame(query: any): Promise<any> {
    try {
      return await this.db.collection('cashoutDirect').insertOne(query);
    } catch (err) {
      throw err;
    }
  }

  async getAllRecordsDirectCashout(query: any): Promise<any[]> {
    try {
      return await this.db.collection('cashoutDirect').find(query).toArray();
    } catch (err) {
      throw err;
    }
  }

  async getAllFromDirectCashoutHistory(query: any): Promise<any[]> {
    try {
      return await this.db
        .collection('directCashoutHistory')
        .find(query)
        .toArray();
    } catch (err) {
      throw err;
    }
  }

  // Game versions
  async findGameVersions(query: any): Promise<any[]> {
    const skip = query.skip || 0;
    const limit = query.limit || 0;

    delete query.skip;
    delete query.limit;
    try {
      return await this.db
        .collection('gameVersions')
        .find(query)
        .skip(skip)
        .limit(limit)
        .sort({ _id: -1 })
        .toArray();
    } catch (err) {
      throw err;
    }
  }

  // Server states
  async updateServerStates(query: any, update: any): Promise<any> {
    try {
      return await this.db
        .collection('serverStates')
        .updateOne(query, update, { upsert: true });
    } catch (err) {
      throw err;
    }
  }

  async findServerStates(query: any): Promise<any> {
    try {
      return await this.db.collection('serverStates').findOne(query);
    } catch (err) {
      throw err;
    }
  }

  async findAllServerStates(query: any): Promise<any[]> {
    try {
      return await this.db.collection('serverStates').find(query).toArray();
    } catch (err) {
      throw err;
    }
  }

  // Lobby text
  async listLobbyText(query: any): Promise<any[]> {
    console.log('Inside listLobbyText adminDB Query ', query);
    try {
      return await this.db.collection('lobbyHeaderText').find(query).toArray();
    } catch (err) {
      throw err;
    }
  }

  // Bonus code
  async listBonusCode(userName: string): Promise<any[]> {
    console.log('got list in bonusCode');
    try {
      return await this.db
        .collection('bonusCollection')
        .find(
          {
            'bonusCodeType.type': 'deposit',
            $or: [
              { 'bonusCodeType.name': { $ne: 'Special Bonus' } },
              {
                'bonusCodeType.name': 'Special Bonus',
                validFor: { $elemMatch: { $eq: userName } },
              },
            ],
            ShowOnWebSiteAndApp: true,
            status: 'true',
            validTill: { $gt: Number(new Date()) },
          },
          {
            projection: {
              codeName: 1,
              tagDescription: 1,
            },
          },
        )
        .toArray();
    } catch (err) {
      throw err;
    }
  }

  // Tournament history
  async saveHistory(data: any): Promise<any> {
    try {
      return await this.db.collection('tourHistory').insertOne(data);
    } catch (err) {
      throw err;
    }
  }

  // Affiliates
  async findSuggestedAffiliates(filter: string): Promise<any[]> {
    try {
      return await this.db
        .collection('tables')
        .find({
          channelName: {
            $regex: filter,
          },
        })
        .toArray();
    } catch (err) {
      throw err;
    }
  }

  // Users
  async findUser(filter: any): Promise<any> {
    try {
      const result = await this.db.collection('users').findOne(filter);

      if (result?.points) {
        const coinType1 = result.points.find(
          ({ coinType }: any) => coinType === 1,
        );
        result.realChips = coinType1.deposit + coinType1.win;
        result.realChipBonus = coinType1.promo;

        const coinType2 = result.points.find(
          ({ coinType }: any) => coinType === 2,
        );
        result.freeChips = coinType2.totalBalance;

        const coinType3 = result.points.find(
          ({ coinType }: any) => coinType === 3,
        );
        result.unClaimedChipBonus = coinType3.promo;

        const coinType4 = result.points.find(
          ({ coinType }: any) => coinType === 4,
        );
        result.touneyChips = coinType4.deposit + coinType4.win;

        result.realChips = Math.floor(result.realChips) || 0;
        result.freeChips = Math.floor(result.freeChips) || 0;
        result.realChipBonus = Math.floor(result.realChipBonus) || 0;
      }

      return result;
    } catch (err) {
      throw err;
    }
  }

  // Chat
  async saveChat(data: any): Promise<any> {
    try {
      return await this.db.collection('chat').insertOne(data);
    } catch (err) {
      throw err;
    }
  }

  async getChat(query: any): Promise<any[]> {
    try {
      return await this.db.collection('chat').find(query).limit(1000).toArray();
    } catch (err) {
      throw err;
    }
  }

  // Users with options
  async findUsersOpts(filter: any, opts: any): Promise<any[]> {
    try {
      const result = await this.db
        .collection('users')
        .find(filter, opts)
        .toArray();
      for (const user of result) {
        if (user.points) {
          const coinType1 = user.points.find(
            ({ coinType }: any) => coinType === 1,
          );
          user.realChips = Math.floor(coinType1.deposit + coinType1.win);
          user.realChipBonus = Math.floor(coinType1.promo);

          const coinType2 = user.points.find(
            ({ coinType }: any) => coinType === 2,
          );
          user.freeChips = Math.floor(coinType2.totalBalance);

          const coinType3 = user.points.find(
            ({ coinType }: any) => coinType === 3,
          );
          user.unClaimedChipBonus = Math.floor(coinType3.promo);

          const coinType4 = user.points.find(
            ({ coinType }: any) => coinType === 4,
          );
          user.touneyChips = Math.floor(coinType4.deposit + coinType4.win);
          delete user.points;
        }
      }
      return result;
    } catch (err) {
      throw err;
    }
  }

  // Mobile OTP
  async findMobileNumber(filter: any): Promise<any> {
    try {
      return await this.db.collection('mobileOtp').findOne(filter);
    } catch (err) {
      throw err;
    }
  }

  // Rabbit data
  async insertRabbitData(data: any): Promise<any> {
    try {
      const result: any = await this.db
        .collection('rabbitData')
        .insertOne(data);
      return result.ops[0];
    } catch (err) {
      throw err;
    }
  }

  async searchRabbitData(query: any): Promise<any[]> {
    try {
      return await this.db
        .collection('rabbitData')
        .find(query)
        .sort({ date: -1 })
        .limit(5)
        .toArray();
    } catch (err) {
      throw err;
    }
  }

  // User arrays
  async findUserArray(userIds: string[]): Promise<any[]> {
    console.log('in findUserArray filter is ', userIds);
    try {
      const result = await this.db
        .collection('users')
        .find({ playerId: { $in: userIds } })
        .toArray();

      for (const user of result) {
        if (user.points) {
          const coinType1 = user.points.find(
            ({ coinType }: any) => coinType === 1,
          );
          user.realChips = Math.floor(coinType1.deposit + coinType1.win);
          user.realChipBonus = Math.floor(coinType1.promo);

          const coinType2 = user.points.find(
            ({ coinType }: any) => coinType === 2,
          );
          user.freeChips = Math.floor(coinType2.totalBalance);

          const coinType3 = user.points.find(
            ({ coinType }: any) => coinType === 3,
          );
          user.unClaimedChipBonus = Math.floor(coinType3.promo);

          const coinType4 = user.points.find(
            ({ coinType }: any) => coinType === 4,
          );
          user.touneyChips = Math.floor(coinType4.deposit + coinType4.win);
          delete user.points;
        }
      }
      return result;
    } catch (err) {
      throw err;
    }
  }

  // ----------------------------New line ------------------------------------------------

  // Bounty players
  async findPlayerFromBounty(playerIds: string[]): Promise<any[]> {
    console.log('in findUserArray filter is ', playerIds);
    try {
      return await this.db
        .collection('tourBounty')
        .find({ playerId: { $in: playerIds } })
        .toArray();
    } catch (err) {
      throw err;
    }
  }

  // User operations
  // async findUserOrOperation (filter: any): Promise<any> {
  //   const newQuery: any = {};
  //   if (filter.emailId) newQuery.emailId = filter.emailId;
  //   if (filter.userName) newQuery.userName = filter.userName;
  //   if (filter.mobileNumber) newQuery.mobileNumber = filter.mobileNumber;

  //   try {
  //     const result = await this.db.collection('users').findOne({ $or: [newQuery] });

  //     if (result?.points) {
  //       const coinType1 = result.points.find(({ coinType }: any) => coinType === 1);
  //       result.realChips = Math.floor(coinType1.deposit + coinType1.win);
  //       result.realChipBonus = Math.floor(coinType1.promo);

  //       const coinType2 = result.points.find(({ coinType }: any) => coinType === 2);
  //       result.freeChips = Math.floor(coinType2.totalBalance);

  //       const coinType3 = result.points.find(({ coinType }: any) => coinType === 3);
  //       result.unClaimedChipBonus = Math.floor(coinType3.promo);

  //       const coinType4 = result.points.find(({ coinType }: any) => coinType === 4);
  //       result.touneyChips = Math.floor(coinType4.deposit + coinType4.win);
  //       delete result.points;
  //     }

  //     return result;
  //   } catch (err) {
  //     throw err;
  //   }
  // };

  // User validation
  async validateUserAtRegisteration(filter: any): Promise<any> {
    try {
      return await this.db.collection('users').findOne({
        $or: [{ emailId: filter.emailId }, { userName: filter.userName }],
      });
    } catch (err) {
      throw err;
    }
  }

  // User management
  async removeUser(filter: any): Promise<any> {
    try {
      return await this.db.collection('users').deleteOne(filter);
    } catch (err) {
      throw err;
    }
  }

  async createUser(userData: any): Promise<any> {
    try {
      const result: any = await this.db.collection('users').insertOne(userData);

      if (result.ops[0]?.points) {
        const coinType1 = result.ops[0].points.find(
          ({ coinType }: any) => coinType === 1,
        );
        result.ops[0].realChips = coinType1.deposit + coinType1.win;
        result.ops[0].realChipBonus = coinType1.promo;

        const coinType2 = result.ops[0].points.find(
          ({ coinType }: any) => coinType === 2,
        );
        result.ops[0].freeChips = coinType2.totalBalance;

        const coinType3 = result.ops[0].points.find(
          ({ coinType }: any) => coinType === 3,
        );
        result.ops[0].unClaimedChipBonus = coinType3.promo;

        const coinType4 = result.ops[0].points.find(
          ({ coinType }: any) => coinType === 4,
        );
        result.ops[0].touneyChips = coinType4.deposit + coinType4.win;

        delete result.ops[0].points;
        result.ops[0].realChips = Math.floor(result.ops[0].realChips) || 0;
        result.ops[0].freeChips = Math.floor(result.ops[0].freeChips) || 0;
        result.ops[0].realChipBonus =
          Math.floor(result.ops[0].realChipBonus) || 0;
      }

      return result.ops[0];
    } catch (err) {
      throw err;
    }
  }

  // Chips management
  async getChips(filter: any): Promise<any> {
    try {
      return await this.db.collection('users').findOne(filter, {
        projection: { realChips: 1, points: 1, realChipBonus: 1 },
      });
    } catch (err) {
      throw err;
    }
  }

  async isTopupAllowed(filter: any): Promise<any> {
    try {
      return await this.db.collection('users').findOne(filter);
    } catch (err) {
      throw err;
    }
  }

  async deductRealChips(filter: any, chips: number): Promise<any> {
    try {
      const result = await this.db
        .collection('users')
        .findOneAndUpdate(
          filter,
          { $inc: { realChips: -chips } },
          { returnDocument: 'after' },
        );
      return result.value;
    } catch (err) {
      throw err;
    }
  }

  async deductRealChipBonus(
    filter: any,
    chips: number,
    realchipbonus: number,
  ): Promise<any> {
    try {
      const result = await this.db
        .collection('users')
        .findOneAndUpdate(
          filter,
          { $inc: { realChips: -chips, realChipBonus: -realchipbonus } },
          { returnDocument: 'after' },
        );
      return result.value;
    } catch (err) {
      throw err;
    }
  }

  async deductFreeChips(filter: any, chips: number): Promise<any> {
    try {
      const result = await this.db
        .collection('users')
        .findOneAndUpdate(
          filter,
          { $inc: { freeChips: -chips } },
          { returnDocument: 'after' },
        );
      return result.value;
    } catch (err) {
      throw err;
    }
  }

  async addRealChips(filter: any, chips: number): Promise<any> {
    try {
      const result = await this.db
        .collection('users')
        .findOneAndUpdate(
          filter,
          { $inc: { realChips: chips } },
          { returnDocument: 'after' },
        );
      return result.value;
    } catch (err) {
      throw err;
    }
  }

  async addRealChipswithBonus(
    filter: any,
    chips: number,
    bonuschip: number,
  ): Promise<any> {
    try {
      const result = await this.db
        .collection('users')
        .findOneAndUpdate(
          filter,
          { $inc: { realChips: chips, realChipBonus: bonuschip } },
          { returnDocument: 'after' },
        );
      return result.value;
    } catch (err) {
      throw err;
    }
  }

  async addChipsInPlayerDeposit(filter: any, chips: number): Promise<any> {
    try {
      return await this.db
        .collection('users')
        .updateOne(filter, { $inc: { 'chipsManagement.deposit': chips } });
    } catch (err) {
      throw err;
    }
  }

  async returnRealChipsToPlayer(filter: any, update: any): Promise<any> {
    try {
      return await this.db.collection('users').updateOne(filter, update);
    } catch (err) {
      throw err;
    }
  }

  async addFreeChips(filter: any, chips: number): Promise<any> {
    try {
      return await this.db
        .collection('users')
        .updateOne(filter, { $inc: { freeChips: chips } });
    } catch (err) {
      throw err;
    }
  }

  async addFreeChipsToMultiplePlayers(
    playerIds: string[],
    chips: number,
  ): Promise<any> {
    try {
      return await this.db
        .collection('users')
        .updateMany(
          { playerId: { $in: playerIds } },
          { $inc: { freeChips: chips } },
        );
    } catch (err) {
      throw err;
    }
  }

  async addRealChipsToMultiplePlayers(
    playerIds: string[],
    chips: number,
  ): Promise<any> {
    try {
      return await this.db
        .collection('users')
        .updateMany(
          { playerId: { $in: playerIds } },
          { $inc: { realChips: chips } },
        );
    } catch (err) {
      throw err;
    }
  }

  // Favorite seats
  async addFavourateSeat(
    playerId: string,
    favourateSeat: Number,
  ): Promise<any> {
    try {
      return await this.db.collection('users').updateOne(
        { playerId },
        {
          $push: {
            favourateSeat: {
              $each: [favourateSeat],
              $sort: { createdAt: -1 },
            },
          } as any,
        },
      );
    } catch (err) {
      throw err;
    }
  }

  async removeFavourateSeat(playerId: string, channelId: string): Promise<any> {
    channelId = channelId.split('-')[0];
    try {
      return await this.db.collection('users').updateOne(
        { playerId: playerId },
        {
          $pull: {
            favourateSeat: {
              channelId: channelId,
            },
          } as any,
        },
      );
    } catch (err) {
      throw err;
    }
  }

  // Favorite tables
  async addFavourateTable(playerId: string, favTableData: any): Promise<any> {
    try {
      return await this.db.collection('users').updateOne(
        { playerId: playerId },
        {
          $push: {
            favourateTable: {
              $each: [favTableData],
              $sort: { createdAt: -1 },
            },
          } as any,
        },
      );
    } catch (err) {
      throw err;
    }
  }

  async removeFavourateTable(
    playerId: string,
    channelId: string,
  ): Promise<any> {
    channelId = channelId.split('-')[0];
    try {
      return await this.db.collection('users').updateOne(
        { playerId: playerId },
        {
          $pull: {
            favourateTable: {
              channelId: channelId,
            },
          } as any,
        },
      );
    } catch (err) {
      throw err;
    }
  }

  // Tables management
  async createTable(database: string, userData: any): Promise<any> {
    try {
      return await this.db.collection(database).insertOne(userData);
    } catch (err) {
      throw err;
    }
  }

  async createBounty(data: any): Promise<any> {
    try {
      return await this.db.collection('tourBounty').insertOne(data);
    } catch (err) {
      throw err;
    }
  }

  async updateBounty(query: any, bounty: number): Promise<any> {
    console.log(
      'query and bounty is in updateBounty is - ' +
        JSON.stringify(query) +
        bounty,
    );
    try {
      return await this.db
        .collection('tourBounty')
        .updateOne(query, { $inc: { bounty: bounty } }, { upsert: true });
    } catch (err) {
      throw err;
    }
  }

  async listTable(query: any): Promise<any[]> {
    const skip = query.skip || 0;
    const limit = query.limit || 0;

    if (query.channelVariation == 'All') {
      delete query.channelVariation;
    }
    delete query.skip;
    delete query.limit;

    try {
      if (query.channelType == 'TOURNAMENT') {
        delete query.isActive;
        delete query.isRealMoney;
        return await this.db
          .collection('tourList')
          .find(query)
          .skip(skip)
          .limit(limit)
          .toArray();
      } else {
        if (query.isOrganic) {
          query.isRealMoney = false;
        }
        delete query.isOrganic;

        return await this.db
          .collection('tables')
          .find(query)
          .skip(skip)
          .limit(limit)
          .toArray();
      }
    } catch (err) {
      throw err;
    }
  }

  async countlistTable(query: any): Promise<number> {
    try {
      if (query.channelType == 'TOURNAMENT') {
        return await this.db.collection('tourList').countDocuments(query);
      } else {
        return await this.db.collection('tables').countDocuments(query);
      }
    } catch (err) {
      throw err;
    }
  }

  async quickSeatTable(query: any): Promise<any[]> {
    try {
      return await this.db
        .collection('tables')
        .find(query)
        .sort({ minBuyIn: -1 })
        .limit(30)
        .toArray();
    } catch (err) {
      throw err;
    }
  }

  async findTableById(id: string): Promise<any> {
    try {
      return await this.db.collection('tables').findOne({ channelId: id });
    } catch (err) {
      throw err;
    }
  }

  async findTableByChannelId(channelId: string): Promise<any> {
    try {
      return await this.db
        .collection('tables')
        .findOne({ channelId: channelId.toString() });
    } catch (err) {
      throw err;
    }
  }

  async findPrizePoolStructure(query: any): Promise<any> {
    console.log('Inside db finding prizePool', query);
    try {
      const prizePool1 = await this.db
        .collection('mttPayout')
        .findOne({ type: query.type });
      const prizePool2 = prizePool1.prizePool.find(
        (o: any) =>
          query.totalplayers >= o.enrolledUsers[0] &&
          query.totalplayers <= o.enrolledUsers[1],
      );
      return prizePool2;
    } catch (err) {
      throw err;
    }
  }

  async findTable(query: any): Promise<any[]> {
    const skip = query.skip || 0;
    const limit = query.limit || 0;
    delete query.skip;
    delete query.limit;

    try {
      return await this.db
        .collection('tables')
        .find(query)
        .skip(skip)
        .limit(limit)
        .sort({ _id: -1 })
        .toArray();
    } catch (err) {
      throw err;
    }
  }

  async findLastTables(query: any): Promise<any[]> {
    try {
      return await this.db
        .collection('tables')
        .find(query)
        .sort({ createdAt: -1 })
        .toArray();
    } catch (err) {
      throw err;
    }
  }

  async removeCloneTable(query: any): Promise<any> {
    try {
      return await this.db.collection('tables').deleteMany(query);
    } catch (err) {
      throw err;
    }
  }

  async removeTournamentTable(id: string): Promise<any> {
    try {
      return await this.db.collection('tables').deleteMany({
        'tournament.tournamentId': id.toString(),
      });
    } catch (err) {
      throw err;
    }
  }

  async createTournamentTables(userDataArray: any[]): Promise<any> {
    console.log('got this data for creating tour tables', userDataArray);
    try {
      return await this.db
        .collection('tables')
        .insertMany(userDataArray, { ordered: false });
    } catch (err) {
      throw err;
    }
  }

  async createOneTournamentTables(data: any): Promise<any> {
    console.log('got this data for creating tour tables', data);
    try {
      return await this.db.collection('tables').insertOne(data);
    } catch (err) {
      throw err;
    }
  }

  async createNewTable(table: any): Promise<any> {
    try {
      return await this.db.collection('tables').insertOne(table);
    } catch (err) {
      throw err;
    }
  }

  async createTournamentTable(table: any): Promise<any> {
    try {
      return await this.db.collection('tables').insertOne(table);
    } catch (err) {
      throw err;
    }
  }

  async getTournamentTables(tournamentId: string): Promise<any[]> {
    try {
      return await this.db
        .collection('tables')
        .find({
          channelType: 'TOURNAMENT',
          'tournament.tournamentId': tournamentId.toString(),
        })
        .toArray();
    } catch (err) {
      throw err;
    }
  }

  async updateStackTable(
    id: string,
    totalGame: number,
    totalStack: number,
    avgStack: number,
  ): Promise<any> {
    id = id.split('-')[0];
    try {
      return await this.db
        .collection('tables')
        .updateOne(
          { channelId: id },
          { $set: { totalGame, totalStack, avgStack } },
        );
    } catch (err) {
      throw err;
    }
  }

  async updateFlopPlayerTable(
    id: string,
    totalFlopPlayer: number,
    totalPlayer: number,
    flopPercent: number,
  ): Promise<any> {
    id = id.split('-')[0];
    try {
      return await this.db
        .collection('tables')
        .updateOne(
          { channelId: id },
          { $set: { totalFlopPlayer, totalPlayer, flopPercent } },
        );
    } catch (err) {
      throw err;
    }
  }

  // Tournament rooms
  async createTournamentRoom(userData: any): Promise<any> {
    try {
      return await this.db.collection('tourList').insertOne(userData);
    } catch (err) {
      throw err;
    }
  }

  async listTournamentRoom(query: any): Promise<any[]> {
    try {
      return await this.db.collection('tourList').find(query).toArray();
    } catch (err) {
      throw err;
    }
  }

  async listTournamentByTimeSpan(query: any): Promise<any[]> {
    try {
      return await this.db
        .collection('tourList')
        .find({
          channelVariation: query.channelVariation,
          buyIn: query.buyIn,
          tournamentType: query.tournamentType,
          $and: [
            { tournamentStartTime: { $gte: query.startTime } },
            { tournamentStartTime: { $lte: query.endTime } },
          ],
        })
        .toArray();
    } catch (err) {
      throw err;
    }
  }

  async updateTournamentRoom(query: any, userData: any): Promise<any> {
    try {
      const result = await this.db
        .collection('tourList')
        .findOneAndUpdate(
          query,
          { $set: userData },
          { returnDocument: 'after' },
        );
      return result.value;
    } catch (err) {
      throw err;
    }
  }

  async updateTournamentGeneralize(id: string, userData: any): Promise<any> {
    try {
      return await this.db
        .collection('tourList')
        .updateOne({ _id: new Object(id) }, { $set: userData });
    } catch (err) {
      throw err;
    }
  }

  async updateTourState(id: string, state: string): Promise<any> {
    try {
      const result = await this.db
        .collection('tourList')
        .findOneAndUpdate(
          { tournamentId: id },
          { $set: { state } },
          { returnDocument: 'after' },
        );
      console.log('result is in updateTourState ', JSON.stringify(result));
      return result.value;
    } catch (err) {
      throw err;
    }
  }

  async updateTournamentStateAndVersionGenralized(
    filter: any,
    updateData: any,
  ): Promise<any> {
    try {
      return await this.db
        .collection('tourList')
        .updateOne(filter, { $set: updateData, $inc: { gameVersionCount: 1 } });
    } catch (err) {
      throw err;
    }
  }

  async getTournamentRoom(id: string): Promise<any> {
    try {
      return await this.db.collection('tourList').findOne({ tournamentId: id });
    } catch (err) {
      throw err;
    }
  }

  async getTourRoom(id: string): Promise<any> {
    console.log('in getTournamentRoom id is ', id);
    try {
      return await this.db.collection('tourList').findOne({ tournamentId: id });
    } catch (err) {
      throw new Error(err);
    }
  }

  async getTournamentRoomUpdated(id: string): Promise<any> {
    console.log('in getTournamentRoom id is ', id);
    try {
      return await this.db.collection('tourList').findOne({ tournamentId: id });
    } catch (err) {
      throw err;
    }
  }

  async countTournamentusersUpdated(filter: any): Promise<number> {
    console.log('filter is in countTournamentusers is - ', filter);
    try {
      return await this.db.collection('tourUsers').countDocuments(filter);
    } catch (err) {
      throw new Error('Got error in getting tournament room!');
    }
  }

  async findTimeBankRuleUpdated(id: string): Promise<any> {
    try {
      return await this.db
        .collection('tourTimeBank')
        .findOne({ timeBankId: id });
    } catch (err) {
      throw err;
    }
  }

  async createTournamentTableUpdated(table: any): Promise<any> {
    console.log('in findTimeBankRule id is===', table);
    try {
      return await this.db.collection('tables').insertOne(table);
    } catch (err) {
      throw err;
    }
  }

  async getUserTicket(query: any): Promise<any> {
    try {
      return await this.db.collection('tourTicket').findOne(query);
    } catch (err) {
      throw err;
    }
  }

  async updateTourTicket(filter: any, data: any): Promise<any> {
    try {
      return await this.db
        .collection('tourTicket')
        .updateOne(filter, { $set: data });
    } catch (err) {
      throw err;
    }
  }

  async getTimeBankDetails(id: string): Promise<any> {
    try {
      return await this.db
        .collection('tourTimeBank')
        .findOne({ timeBankId: id });
    } catch (err) {
      throw err;
    }
  }

  async updateStackTournamentRoom(
    id: string,
    totalGame: number,
    totalStack: number,
  ): Promise<any> {
    try {
      return await this.db
        .collection('tourList')
        .updateOne(
          { _id: new Object(id) },
          { $inc: { totalGame, totalStack } },
        );
    } catch (err) {
      throw err;
    }
  }

  async updateTournamentState(id: string, state: string): Promise<any> {
    try {
      return await this.db
        .collection('tourList')
        .updateOne({ _id: new Object(id) }, { $set: { state } });
    } catch (err) {
      throw err;
    }
  }

  async updateTournamentStateAndTime(id: string, state: string): Promise<any> {
    try {
      return await this.db
        .collection('tourList')
        .updateOne(
          { _id: new Object(id) },
          { $set: { state, tournamentStartTime: Number(new Date()) } },
        );
    } catch (err) {
      throw err;
    }
  }

  async findTournamentRoom(query: any): Promise<any[]> {
    try {
      return await this.db.collection('tourList').find(query).toArray();
    } catch (err) {
      throw err;
    }
  }

  async updateTournamentStateToRunning(tournamentId: string): Promise<any> {
    try {
      return await this.db
        .collection('tourList')
        .updateOne(
          { _id: new Object(tournamentId) },
          { $set: { state: stateOfX.tournamentState.running } },
        );
    } catch (err) {
      throw err;
    }
  }

  async quickSeatTournament(query: any): Promise<any[]> {
    try {
      return await this.db
        .collection('tourList')
        .find(query)
        .sort({ tournamentStartTime: -1 })
        .limit(30)
        .toArray();
    } catch (err) {
      throw err;
    }
  }

  async countTournaments(query: any): Promise<number> {
    try {
      return await this.db.collection('tourList').countDocuments(query);
    } catch (err) {
      throw err;
    }
  }

  // Blind rules
  async listBlindRule(query: any): Promise<any[]> {
    try {
      return await this.db.collection('tourBlinds').find(query).toArray();
    } catch (err) {
      throw err;
    }
  }

  async findBlindRule(id: string): Promise<any> {
    try {
      return await this.db
        .collection('tourBlinds')
        .findOne({ tournamentId: id });
    } catch (err) {
      throw err;
    }
  }

  async updateBlindRule(id: string, userData: any): Promise<any> {
    try {
      const result = await this.db
        .collection('tourBlinds')
        .findOneAndUpdate(
          { _id: new Object(id) },
          { $set: userData },
          { returnDocument: 'after' },
        );
      return result.value;
    } catch (err) {
      throw err;
    }
  }

  // Time bank rule
  async findTimeBankRule(id: string): Promise<any> {
    try {
      return await this.db
        .collection('tourTimeBank')
        .findOne({ timeBankId: id });
    } catch (err) {
      throw err;
    }
  }

  // Prize rules
  async createPrizeRule(prizeData: any): Promise<any> {
    try {
      return await this.db
        .collection('prizeRules')
        .updateOne(
          { tournamentId: prizeData.tournamentId },
          { $set: prizeData },
          { upsert: true },
        );
    } catch (err) {
      throw err;
    }
  }

  async getPrizeRule(id: string): Promise<any> {
    try {
      return await this.db
        .collection('prizeRules')
        .findOne({ tournamentId: id });
    } catch (err) {
      throw err;
    }
  }

  async findNormalPrizeRule(id: string): Promise<any[]> {
    try {
      return await this.db
        .collection('prizeRules')
        .find({
          tournamentId: id.toString(),
          type: 'server',
        })
        .toArray();
    } catch (err) {
      throw err;
    }
  }

  async listPrizeRule(query: any): Promise<any[]> {
    console.log('query in listPrizeRule ', query);
    try {
      return await this.db.collection('prizeRules').find(query).toArray();
    } catch (err) {
      throw err;
    }
  }

  async updatePrizeRule(id: string, userData: any): Promise<any> {
    try {
      const result = await this.db
        .collection('prizeRules')
        .findOneAndUpdate(
          { _id: new Object(id) },
          { $set: userData },
          { returnDocument: 'after' },
        );
      return result.value;
    } catch (err) {
      throw err;
    }
  }

  async listPrizeRuleWithLimitedData(query: any): Promise<any[]> {
    try {
      return await this.db
        .collection('prizeRules')
        .find(query, {
          projection: { _id: 1, name: 1 },
        })
        .toArray();
    } catch (err) {
      throw err;
    }
  }

  async deletePrizeRule(tournamentId: string): Promise<any> {
    try {
      return await this.db
        .collection('prizeRules')
        .deleteMany({ tournamentId });
    } catch (err) {
      throw err;
    }
  }

  // User updates
  async updateUser(query: any, updateKeys: any): Promise<any> {
    try {
      return await this.db
        .collection('users')
        .updateOne(query, { $set: updateKeys });
    } catch (err) {
      throw err;
    }
  }

  // Bonus data
  async createBonusData(bonusData: any): Promise<any> {
    try {
      return await this.db.collection('bonusdata').insertOne(bonusData);
    } catch (err) {
      throw err;
    }
  }

  async findBounsData(query: any): Promise<any> {
    try {
      return await this.db.collection('bonusdata').findOne(query);
    } catch (err) {
      throw err;
    }
  }

  async updateBounsDataSetKeys(query: any, updateKeys: any): Promise<any> {
    try {
      return await this.db
        .collection('bonusdata')
        .updateOne(query, { $set: updateKeys });
    } catch (err) {
      throw err;
    }
  }

  async increaseUserStats(query: any, updateKeys: any): Promise<any> {
    try {
      return await this.db
        .collection('users')
        .updateMany(query, { $inc: updateKeys });
    } catch (err) {
      throw err;
    }
  }

  async findAndModifyUser(query: any, updateKeys: any): Promise<any> {
    try {
      const result = await this.db
        .collection('users')
        .findOneAndUpdate(
          query,
          { $set: updateKeys },
          { returnDocument: 'after' },
        );

      if (result?.value?.points) {
        const coinType1 = result.value.points.find(
          ({ coinType }: any) => coinType === 1,
        );
        result.value.realChips = coinType1.deposit + coinType1.win;
        result.value.realChipBonus = coinType1.promo;

        const coinType2 = result.value.points.find(
          ({ coinType }: any) => coinType === 2,
        );
        result.value.freeChips = coinType2.totalBalance;

        const coinType3 = result.value.points.find(
          ({ coinType }: any) => coinType === 3,
        );
        result.value.unClaimedChipBonus = coinType3.promo;

        const coinType4 = result.value.points.find(
          ({ coinType }: any) => coinType === 4,
        );
        result.value.touneyChips = coinType4.deposit + coinType4.win;

        delete result.value.points;
        result.value.realChips = Math.floor(result.value.realChips) || 0;
        result.value.freeChips = Math.floor(result.value.freeChips) || 0;
        result.value.realChipBonus =
          Math.floor(result.value.realChipBonus) || 0;
      }

      return result.value;
    } catch (err) {
      throw err;
    }
  }

  async setSubscription(filter: any, data: any): Promise<any> {
    try {
      const result = await this.db
        .collection('users')
        .findOneAndUpdate(
          filter,
          { $set: { subscription: data } },
          { returnDocument: 'after' },
        );
      return result.value;
    } catch (err) {
      throw err;
    }
  }

  // Notes
  async createNotes(notesData: any): Promise<any> {
    try {
      const result: any = await this.db
        .collection('notes')
        .insertOne(notesData);
      return result.ops[0];
    } catch (err) {
      throw err;
    }
  }

  async updateNotes(query: any, updateKeys: any): Promise<any> {
    try {
      return await this.db
        .collection('notes')
        .updateOne(query, { $set: updateKeys });
    } catch (err) {
      throw err;
    }
  }

  async deleteNotes(query: any): Promise<any> {
    try {
      return await this.db.collection('notes').deleteOne(query);
    } catch (err) {
      throw err;
    }
  }

  async findNotes(filter: any): Promise<any> {
    try {
      return await this.db.collection('notes').findOne(filter);
    } catch (err) {
      throw err;
    }
  }

  async getCustomUser(playerId: string, keys: any): Promise<any> {
    try {
      const result = await this.db
        .collection('users')
        .findOne({ playerId }, { projection: keys });

      if (result?.points) {
        const coinType1 = result.points.find(
          ({ coinType }: any) => coinType === 1,
        );
        result.realChips = coinType1.deposit + coinType1.win;
        result.realChipBonus = coinType1.promo;

        const coinType2 = result.points.find(
          ({ coinType }: any) => coinType === 2,
        );
        result.freeChips = coinType2.totalBalance;

        const coinType3 = result.points.find(
          ({ coinType }: any) => coinType === 3,
        );
        result.unClaimedChipBonus = coinType3.promo;

        const coinType4 = result.points.find(
          ({ coinType }: any) => coinType === 4,
        );
        result.touneyChips = coinType4.deposit + coinType4.win;

        delete result.points;
        result.realChips = Math.floor(result.realChips) || 0;
        result.freeChips = Math.floor(result.freeChips) || 0;
        result.realChipBonus = Math.floor(result.realChipBonus) || 0;
      }

      return result;
    } catch (err) {
      throw err;
    }
  }

  // Report issue
  async reportIssue(issueDetails: any): Promise<any> {
    try {
      const result: any = await this.db
        .collection('issues')
        .insertOne(issueDetails);
      return result.ops[0];
    } catch (err) {
      throw err;
    }
  }

  async getIssue(filter: any): Promise<any[]> {
    try {
      return await this.db.collection('issues').find(filter).toArray();
    } catch (err) {
      throw err;
    }
  }

  // Tournament users
  async countTournamentusers(filter: any): Promise<number> {
    try {
      return await this.db.collection('tourUsers').countDocuments(filter);
    } catch (err) {
      throw err;
    }
  }

  async createTournamentUsers(data: any): Promise<any> {
    try {
      const result: any = await this.db
        .collection('tournamentusers')
        .insertOne(data);
      return result.ops[0];
    } catch (err) {
      throw err;
    }
  }

  async findTournamentUser(filter: any): Promise<any[]> {
    try {
      return await this.db.collection('tourUsers').find(filter).toArray();
    } catch (err) {
      throw err;
    }
  }

  async findActiveTournamentUser(filter: any): Promise<any[]> {
    try {
      return await this.db
        .collection('tournamentusers')
        .find(filter, { projection: { isActive: 1 } })
        .toArray();
    } catch (err) {
      throw err;
    }
  }

  async updateTournamentUser(query: any, data: any): Promise<any> {
    try {
      return await this.db
        .collection('tournamentusers')
        .updateOne(query, { $set: data });
    } catch (err) {
      throw err;
    }
  }

  async updateMultipleTournamentUser(query: any, data: any): Promise<any> {
    try {
      return await this.db
        .collection('tourUsers')
        .updateMany(query, { $set: data });
    } catch (err) {
      throw err;
    }
  }

  async upsertTournamentUser(query: any, data: any): Promise<any> {
    try {
      return await this.db
        .collection('tournamentusers')
        .updateOne(query, { $set: data }, { upsert: true });
    } catch (err) {
      throw err;
    }
  }

  async deleteTournamentUser(query: any): Promise<any> {
    try {
      return await this.db.collection('tournamentusers').deleteMany(query);
    } catch (err) {
      throw err;
    }
  }

  // Tournament ranks
  async insertRanks(data: any): Promise<any> {
    try {
      return await this.db.collection('tournamentRanks').insertOne(data);
    } catch (err) {
      throw err;
    }
  }

  async getTournamentRanks(params: any): Promise<any[]> {
    try {
      return await this.db.collection('tournamentRanks').find(params).toArray();
    } catch (err) {
      throw err;
    }
  }

  async findTournamentRanks(params: any): Promise<any[]> {
    try {
      return await this.db
        .collection('tournamentRanks')
        .find(params)
        .sort({ createdAt: 1 })
        .toArray();
    } catch (err) {
      throw err;
    }
  }

  async updateTournamentRanks(filter: any): Promise<any> {
    try {
      return await this.db
        .collection('tournamentRanks')
        .updateOne(filter, { $set: { isCollected: true } });
    } catch (err) {
      throw err;
    }
  }

  async modifyTournamentRanks(filter: any, updatedValue: any): Promise<any> {
    try {
      return await this.db
        .collection('tournamentRanks')
        .updateOne(filter, { $set: updatedValue });
    } catch (err) {
      throw err;
    }
  }

  async InsertInPrize(data: any): Promise<any> {
    try {
      const result: any = await this.db.collection('prizes').insertOne(data);
      return result.ops[0];
    } catch (err) {
      throw err;
    }
  }

  // Video log
  async insertVideoLog(
    channelId: string,
    roundId: string,
    logData: any,
  ): Promise<any> {
    channelId = channelId.split('-')[0];
    const data = {
      channelId,
      roundId,
      logData,
      createdAt: new Date().getTime(),
    };

    try {
      return await this.db.collection('videoLog').insertOne(data);
    } catch (err) {
      throw err;
    }
  }

  // Spam words
  async findAllSpamWords(): Promise<any[]> {
    try {
      return await this.db.collection('spamWords').find({}).toArray();
    } catch (err) {
      throw err;
    }
  }

  // Tournament rebuy
  async updateRebuy(query: any, updatedData: any): Promise<any> {
    try {
      return await this.db
        .collection('tourRebuy')
        .updateOne(query, updatedData, { upsert: true });
    } catch (err) {
      throw err;
    }
  }

  async deleteRebuy(query: any): Promise<any> {
    try {
      return await this.db.collection('tourRebuy').deleteMany(query);
    } catch (err) {
      throw err;
    }
  }

  async updateRebuyWithoutInsert(query: any, updatedData: any): Promise<any> {
    console.log(
      stateOfX.serverLogType.info,
      'query and updated data are in updateRebuy2- ' +
        JSON.stringify(query) +
        JSON.stringify(updatedData),
    );
    try {
      return await this.db
        .collection('tourRebuy')
        .updateOne(query, { $set: updatedData });
    } catch (err) {
      throw err;
    }
  }

  async countRebuyOpt(query: any): Promise<any> {
    try {
      return await this.db.collection('tourRebuy').findOne(query);
    } catch (err) {
      throw err;
    }
  }

  async findAllRebuy(query: any): Promise<any[]> {
    try {
      return await this.db.collection('tourRebuy').find(query).toArray();
    } catch (err) {
      throw err;
    }
  }

  // Anti-banking
  async insertAntiBanking(data: any): Promise<any> {
    try {
      return await this.db.collection('antibanking').insertOne(data);
    } catch (err) {
      throw err;
    }
  }

  async updateAntiBanking(data: any, update: any): Promise<any> {
    try {
      return await this.db
        .collection('antibanking')
        .updateOne(
          { playerId: data.playerId, channelId: data.channelId },
          { $set: update },
        );
    } catch (err) {
      throw err;
    }
  }

  async removeAntiBankingEntry(query: any): Promise<any> {
    try {
      return await this.db.collection('antibanking').deleteOne(query);
    } catch (err) {
      throw err;
    }
  }

  async getAntiBanking(query: any): Promise<any> {
    try {
      return await this.db.collection('antibanking').findOne(query);
    } catch (err) {
      throw err;
    }
  }

  async getTableAntiBanking(filter: any): Promise<any[]> {
    try {
      return await this.db
        .collection('antibanking')
        .find(filter)
        .sort({ createdAt: -1 })
        .limit(2)
        .toArray();
    } catch (err) {
      throw err;
    }
  }

  async getAllAntiBanking(
    channelId: string,
    existingPlayers: string[],
  ): Promise<any[]> {
    const query = {
      channelId,
      playerId: { $nin: existingPlayers },
    };

    try {
      return await this.db
        .collection('antibanking')
        .aggregate([
          {
            $match: query,
          },
          {
            $lookup: {
              from: 'users',
              localField: 'playerId',
              foreignField: 'playerId',
              as: 'userdetails',
            },
          },
          {
            $project: {
              _id: 0,
              playerId: 1,
              amount: 1,
              stack: 1,
              channelId: 1,
              userdetails: 1,
              createdAt: 1,
            },
          },
        ])
        .toArray();
    } catch (err) {
      throw err;
    }
  }

  // Player count
  async getPlayersCount(query: any): Promise<number> {
    const newQuery: any = {};
    if (query.userName) newQuery.isParentUserName = query.userName;
    if (query.userId) newQuery.userName = new RegExp('^' + query.userId, 'i');
    if (query.mobileNumber)
      newQuery.mobileNumber = new RegExp('^' + query.mobileNumber, 'i');
    if (query.emailId) newQuery.emailId = new RegExp('^' + query.emailId, 'i');
    if (query.firstName)
      newQuery.firstName = new RegExp('^' + query.firstName, 'i');
    if (query.lastName)
      newQuery.lastName = new RegExp('^' + query.lastName, 'i');
    newQuery.isOrganic = query.isOrganic;
    if (newQuery.isOrganic == 'All') delete newQuery.isOrganic;

    if (query.startDate && query.endDate) {
      newQuery.createdAt = { $gte: query.startDate, $lte: query.endDate };
    }
    console.log('newQuery  ', newQuery);

    try {
      return await this.db.collection('users').countDocuments(newQuery);
    } catch (err) {
      throw err;
    }
  }

  async updatePlayer(id: string, userData: any): Promise<any> {
    try {
      return await this.db
        .collection('users')
        .updateOne({ _id: new Object(id) }, { $set: userData });
    } catch (err) {
      throw err;
    }
  }

  // Scheduled expiry
  async createExpirySlot(data: any): Promise<any> {
    try {
      return await this.db.collection('scheduledExpiry').insertOne(data);
    } catch (err) {
      throw err;
    }
  }

  async updateExpirySlot(query: any, update: any): Promise<any> {
    try {
      return await this.db
        .collection('scheduledExpiry')
        .updateOne(query, update);
    } catch (err) {
      throw err;
    }
  }

  async upsertExpirySlot(query: any, update: any): Promise<any> {
    try {
      return await this.db
        .collection('scheduledExpiry')
        .updateOne(query, update, { upsert: true });
    } catch (err) {
      throw err;
    }
  }

  async findExpirySlots(query: any): Promise<any[]> {
    try {
      return await this.db.collection('scheduledExpiry').find(query).toArray();
    } catch (err) {
      throw err;
    }
  }

  // User session
  async findUserSessionInDB(params: string): Promise<any> {
    try {
      return await this.db
        .collection('userSession')
        .findOne({ playerId: params });
    } catch (err) {
      throw err;
    }
  }

  async findUserSessionCountInDB(params: any): Promise<number> {
    try {
      return await this.db.collection('userSession').countDocuments(params);
    } catch (err) {
      throw err;
    }
  }

  async removeUserSessionFromDB(params: string): Promise<any> {
    try {
      return await this.db
        .collection('userSession')
        .deleteOne({ playerId: params });
    } catch (err) {
      throw err;
    }
  }

  async findPlayerWithId(filter: any): Promise<any> {
    try {
      return await this.db.collection('users').findOne(filter);
    } catch (err) {
      throw err;
    }
  }

  // Bank details
  async saveBankDetailsuser(filter: any, details: any): Promise<any> {
    try {
      return await this.db
        .collection('palyerBankDetails')
        .updateOne(filter, { $set: details }, { upsert: true });
    } catch (err) {
      throw err;
    }
  }

  async findBankDetailsuser(filter: any): Promise<any[]> {
    try {
      return await this.db
        .collection('palyerBankDetails')
        .find(filter)
        .toArray();
    } catch (err) {
      throw err;
    }
  }

  async getBankDetailsuser(filter: any): Promise<any> {
    try {
      return await this.db.collection('palyerBankDetails').findOne(filter);
    } catch (err) {
      throw err;
    }
  }

  // Schedule tasks
  async updateScheduleTask(query: any, update: any): Promise<any> {
    try {
      return await this.db.collection('scheduleTasks').updateOne(query, update);
    } catch (err) {
      throw err;
    }
  }

  async addScheduleTask(query: any): Promise<any> {
    if (query.type == 'serverDown' || query.type == 'serverUp') {
      try {
        const result = await this.db
          .collection('scheduleTasks')
          .find({
            type: query.type,
            status: 'PENDING',
          })
          .toArray();

        if (result && result.length <= 0) {
          const insertResult = await this.db
            .collection('scheduleTasks')
            .insertOne(query);
          return insertResult;
        } else {
          if (result && result.length >= 1) {
            throw new Error('Already scheduled such task. Cancel that first.');
          }
        }
      } catch (err) {
        throw err;
      }
    } else {
      throw new Error('undefined type');
    }
  }

  async findScheduleTask(query: any): Promise<any> {
    try {
      return await this.db.collection('scheduleTasks').findOne(query);
    } catch (err) {
      throw err;
    }
  }

  async findMultipleScheduleTasks(query: any): Promise<any[]> {
    const skip = query.skip;
    const limit = query.limit;
    delete query.skip;
    delete query.limit;

    try {
      return await this.db
        .collection('scheduleTasks')
        .find(query)
        .skip(skip || 0)
        .limit(limit || 0)
        .sort({ _id: -1 })
        .toArray();
    } catch (err) {
      throw err;
    }
  }

  // User stats
  async insertUserStats(query: any, userData: any): Promise<any> {
    try {
      return await this.db
        .collection('userStats')
        .updateOne(query, { $set: userData }, { upsert: true });
    } catch (err) {
      throw err;
    }
  }

  async getPlayerAllHandCount(
    channelVariation: string,
    isRealMoney: boolean,
    playerId: string,
  ): Promise<number> {
    try {
      return await this.db.collection('userStats').countDocuments({
        gameVariation: channelVariation,
        isRealMoney: isRealMoney,
        playerId: playerId,
      });
    } catch (err) {
      throw err;
    }
  }

  async getVVIPPanelData(
    channelVariation: string,
    isRealMoney: boolean,
    playerId: string,
    queryTypes: string[],
  ): Promise<any[]> {
    const aggregationPipeline: any[] = [
      {
        $match: {
          gameVariation: channelVariation,
          isRealMoney: isRealMoney,
          playerId: playerId,
        },
      },
      {
        $group: {
          _id: null,
        },
      },
      {
        $project: {
          _id: 0,
        },
      },
    ];

    queryTypes.forEach(function (queryType) {
      aggregationPipeline[1].$group[queryType] = {
        $sum: { $cond: [{ $ifNull: [`$${queryType}`, false] }, 1, 0] },
      };
      aggregationPipeline[2].$project[queryType] = `$${queryType}`;
    });

    try {
      return await this.db
        .collection('userStats')
        .aggregate(aggregationPipeline)
        .toArray();
    } catch (err) {
      throw err;
    }
  }

  // Topup
  async saveTopUp(data: any): Promise<any> {
    try {
      return await this.db.collection('userTopup').insertOne(data);
    } catch (err) {
      throw err;
    }
  }

  async getTopupSum(query: any): Promise<any[]> {
    try {
      return await this.db
        .collection('userTopup')
        .aggregate([
          {
            $match: {
              userName: query.userName,
              type: query.type,
            },
          },
          {
            $group: {
              _id: null,
              totalAmount: { $sum: '$amount' },
            },
          },
        ])
        .toArray();
    } catch (err) {
      throw err;
    }
  }

  // Player sessions
  async insertPlayerSession(query: any): Promise<any> {
    try {
      return await this.db.collection('playerSessions').insertOne(query);
    } catch (err) {
      throw err;
    }
  }

  async updatePlayerSession(query: any, params: any): Promise<any> {
    try {
      return await this.db
        .collection('playerSessions')
        .updateOne(query, { $set: params });
    } catch (err) {
      throw err;
    }
  }

  async updatePlayerById(query: any, update: any): Promise<any> {
    try {
      return await this.db
        .collection('users')
        .updateOne({ playerId: query.playerId }, { $set: update });
    } catch (err) {
      throw err;
    }
  }

  // Spin wheel
  async insertSpinWheelData(playerInfo: any): Promise<any> {
    try {
      return await this.db.collection('spinTheWheel').insertOne(playerInfo);
    } catch (err) {
      throw err;
    }
  }

  // Call timer
  async callTimer(params: any): Promise<any> {
    try {
      return await this.db.collection('callTimerData').insertOne(params);
    } catch (err) {
      throw err;
    }
  }

  // Player avatar
  async getPlayerAvatar(query: any): Promise<any> {
    try {
      return await this.db
        .collection('users')
        .findOne(query, {
          projection: { playerId: 1, userName: 1, profileImage: 1 },
        });
    } catch (err) {
      throw err;
    }
  }

  //  FinanceQuery Db
  /*----------------- fund rake query START ---------------------*/

  async fundrake(userdata: any): Promise<any> {
    try {
      return await this.db.collection('fundrake').insertOne(userdata);
    } catch (err) {
      throw err;
    }
  }

  async fundtotal(data: {
    playerId: string;
    startingDate: number;
  }): Promise<any[]> {
    try {
      return await this.db
        .collection('fundrake')
        .aggregate([
          {
            $match: {
              rakeByUserid: data.playerId,
              addeddate: {
                $gt: data.startingDate,
              },
            },
          },
          {
            $group: {
              _id: { userId: '$rakeByUserid' },
              rakeContributed: { $sum: '$amountGST' },
            },
          },
        ])
        .toArray();
    } catch (err) {
      throw err;
    }
  }

  async findLastRakeGeneratedByUser(data: {
    playerID: string;
    date: number;
  }): Promise<any[]> {
    try {
      return await this.db
        .collection('fundrake')
        .aggregate([
          {
            $match: {
              rakeByUserid: data.playerID,
              addeddate: { $gt: data.date },
            },
          },
        ])
        .toArray();
    } catch (err) {
      throw err;
    }
  }

  async findRakeOntable(data: {
    playerId: string;
    channelId: string;
    addeddate: number;
  }): Promise<any[]> {
    try {
      return await this.db
        .collection('fundrake')
        .aggregate([
          {
            $match: {
              rakeByUserid: data.playerId,
              channelId: data.channelId,
              addeddate: { $gte: data.addeddate },
            },
          },
          {
            $group: {
              _id: '$rakeByUserid',
              rakeGenerated: { $sum: '$amount' },
            },
          },
        ])
        .toArray();
    } catch (err) {
      throw err;
    }
  }

  async findLastTenTransactionInorganic(playerId: string): Promise<any[]> {
    try {
      return await this.db
        .collection('playerRakeBack')
        .find(
          {
            rakeByUserid: playerId,
            transfer: true,
            playerRakeBack: { $gt: 0 },
          },
          {
            projection: {
              success: 1,
              createdAt: 1,
              rakeByUsername: 1,
              rakeBack: 1,
              playerRakeBack: 1,
              _id: 0,
            },
          },
        )
        .sort({ transferAt: -1 })
        .limit(20)
        .toArray();
    } catch (err) {
      throw err;
    }
  }

  async rakeGeneratedByInOrganicPlayer(playerId: string): Promise<any[]> {
    try {
      return await this.db
        .collection('playerRakeBack')
        .find({
          rakeByUserid: playerId,
          transfer: false,
        })
        .toArray();
    } catch (err) {
      throw err;
    }
  }

  /*----------------- balance sheet query START ---------------------*/

  async updateBalanceSheet(query: any): Promise<any> {
    try {
      return await this.db.collection('balanceSheet').updateOne({}, query);
    } catch (err) {
      throw err;
    }
  }

  async playerRakeBack(params: any): Promise<any> {
    const handsPlayed = 1;
    const playerRakeBack = params.playerRakeBack;
    const amount = params.amount;
    const amountGST = params.amountGST;

    delete params.playerRakeBack;
    delete params.handsPlayed;
    delete params.amount;
    delete params.amountGST;

    params.createdAt = params.addedDate;
    const find = {
      rakeByUsername: params.rakeByUsername,
      transfer: false,
    };

    try {
      return await this.db.collection('playerRakeBack').updateOne(
        find,
        {
          $set: params,
          $inc: {
            playerRakeBack,
            handsPlayed,
            amount,
            amountGST,
          },
        },
        { upsert: true },
      );
    } catch (err) {
      throw err;
    }
  }

  async playerHandsPlayedRakeBack(params: any): Promise<any> {
    const handsPlayed = params.handsPlayed;
    delete params.handsPlayed;

    try {
      return await this.db.collection('playerRakeBack').updateOne(
        {
          createdAt: params.addedDate,
          rakeByUsername: params.rakeByUsername,
          transfer: false,
        },
        {
          $set: { handsPlayed },
        },
      );
    } catch (err) {
      throw err;
    }
  }

  async playerRakeBackDateData(params: any): Promise<any[]> {
    try {
      return await this.db.collection('playerRakeBack').find(params).toArray();
    } catch (err) {
      throw err;
    }
  }

  async updateStatusOfManyRakeBackData(params: any): Promise<any> {
    const transferAt = Number(new Date());

    try {
      return await this.db.collection('playerRakeBack').updateMany(params, {
        $set: {
          transfer: true,
          transferAt,
        },
      });
    } catch (err) {
      throw err;
    }
  }

  /*----------------- fund transaction history START ---------------------*/

  async fundtransferhistroy(req: any): Promise<any> {
    try {
      return await this.db.collection('fundtransactionhistroy').insertOne(req);
    } catch (err) {
      throw err;
    }
  }

  // log db Query

  /*----------------- Subscription Related Queries START ---------------------*/

  async fetchSubscription(query: any): Promise<any[]> {
    try {
      return await this.db
        .collection('subscriptionHistory')
        .find(query)
        .sort({ startDate: -1 })
        .toArray();
    } catch (err) {
      throw err;
    }
  }

  async saveSubscriptionRecord(data: any): Promise<any> {
    try {
      const result: any = await this.db
        .collection('subscriptionHistory')
        .insertOne(data);
      return result.ops[0];
    } catch (err) {
      throw err;
    }
  }

  async lockedCashoutHistory(data: any): Promise<any> {
    try {
      const result: any = await this.db
        .collection('lockedCashoutConversion')
        .insertOne(data);
      return result.ops[0];
    } catch (err) {
      throw err;
    }
  }

  async updateSubscriptionRecord(query: any, updatedData: any): Promise<any> {
    try {
      return await this.db
        .collection('subscriptionHistory')
        .updateOne(query, { $set: updatedData });
    } catch (err) {
      throw err;
    }
  }

  async saveTimeLog(query: any, data: any): Promise<any> {
    try {
      return await this.db
        .collection('extraTimeEntry')
        .updateOne(query, { $set: data }, { upsert: true });
    } catch (err) {
      throw err;
    }
  }

  async updateTimeLog(query: any, data: any): Promise<any> {
    try {
      return await this.db
        .collection('extraTimeEntry')
        .updateMany(query, { $set: data });
    } catch (err) {
      throw err;
    }
  }

  async saveTourHistory(data: any): Promise<any> {
    try {
      const result: any = await this.db
        .collection('tourHistory')
        .insertOne(data);
      return result.ops[0];
    } catch (err) {
      throw err;
    }
  }

  async updateOldSubscriptionRecord(
    query: any,
    updatedData: any,
  ): Promise<any> {
    try {
      return await this.db
        .collection('subscriptionHistory')
        .updateOne(query, { $set: updatedData });
    } catch (err) {
      throw err;
    }
  }

  async getExtraTimeLog(query: any): Promise<any> {
    try {
      return await this.db.collection('extraTimeEntry').findOne(query);
    } catch (err) {
      throw err;
    }
  }

  async saveSubscriptionUsage(query: any, data: any): Promise<any> {
    try {
      let key: string, value: number;

      if (data.timeBank || data.disconnectionTime || data.emoji) {
        if (data.timeBank) {
          key = 'timeBank';
          value = data.timeBank;
          delete data.timeBank;
        } else if (data.disconnectionTime) {
          key = 'disconnectionTime';
          value = data.disconnectionTime;
          delete data.disconnectionTime;
        } else if (data.emoji) {
          key = 'emojicount';
          value = 1;
          delete data.emoji;
        }

        return await this.db.collection('subscriptionUsage').updateOne(
          query,
          {
            $inc: { [key]: value },
            $set: data,
          },
          { upsert: true },
        );
      } else {
        return await this.db
          .collection('subscriptionUsage')
          .updateOne(query, { $set: data }, { upsert: true });
      }
    } catch (err) {
      throw err;
    }
  }

  async findHandIdByRoundId(query: any): Promise<any[]> {
    try {
      return await this.db
        .collection('handTab')
        .find(query, { projection: { _id: 0, handId: 1 } })
        .toArray();
    } catch (err) {
      throw err;
    }
  }

  /*----------------- Hand History Related Queries START ---------------------*/

  handHistoryStore: Record<string, any[]> = {};
  channelIdStore: string;

  async insertHandHistoryArray(data: any): Promise<any> {
    try {
      const existing = await this.db
        .collection('handHistoryArray')
        .find({
          channelId: data.channelId,
          roundId: data.roundId,
          handId: data.handId,
        })
        .toArray();

      if (!existing.length) {
        const insertResult = await this.db
          .collection('handHistoryArray')
          .insertOne({
            _id: data.roundId,
            channelId: data.channelId,
            roundId: data.roundId,
            channelVariation: data.channelVariation,
            handId: data.handId,
            channelName: data.channelName,
            timeDetails: data.timeDetails,
            playersData: data.playersData,
            seats: data.seats,
            turn: data.turn,
            SHOWDOWN: data.SHOWDOWN,
            boardCards: data.boardCards,
            timeStamp: new Date(),
            createdAt: Number(new Date()),
          });

        data.success = true;
        this.channelIdStore = data.channelId;
        this.handHistoryStore[this.channelIdStore] =
          this.handHistoryStore[this.channelIdStore] || [];

        const latestResult = await this.db
          .collection('handHistoryArray')
          .find({ channelId: data.channelId })
          .sort({ timeStamp: -1 })
          .limit(1)
          .toArray();

        if (latestResult.length) {
          data.success = true;
          this.channelIdStore = data.channelId;
          if (this.handHistoryStore[this.channelIdStore]) {
            this.handHistoryStore[this.channelIdStore].unshift(latestResult[0]);
          }
          if (this.handHistoryStore[this.channelIdStore]?.length > 5) {
            this.handHistoryStore[this.channelIdStore].pop();
          }
          return latestResult;
        } else {
          data.success = false;
          throw new Error('No results found');
        }
      } else {
        console.log('Record already exists in insertHandHistoryArray');
        return existing;
      }
    } catch (err) {
      console.log('insertion error from handHistory', err);
      data.success = false;
      throw err;
    }
  }

  async getHandHistoryArray(params: any): Promise<any[]> {
    try {
      const result = await this.db
        .collection('handHistoryArray')
        .find({ channelId: params.channelId })
        .sort({ timeStamp: -1 })
        .limit(10)
        .toArray();

      if (result) {
        params.success = true;
        this.handHistoryStore[this.channelIdStore] = result;
        params.active = true;
      } else {
        params.success = false;
        params.active = false;
      }
      return result;
    } catch (err) {
      throw err;
    }
  }

  /*----------------- Video Related Queries START ---------------------*/

  async insertNextVideo(query: any, historyContent: any): Promise<any> {
    try {
      const result = await (
        this.db.collection('videos') as any
      ).findOneAndUpdate(
        query,
        { $push: { history: historyContent } },
        { returnDocument: 'after' },
      );
      return result.value;
    } catch (err) {
      throw err;
    }
  }

  async updateVideo(query: any, updatedData: any): Promise<any> {
    try {
      return await this.db
        .collection('videos')
        .updateOne(query, { $set: updatedData });
    } catch (err) {
      throw err;
    }
  }

  async insertRabbiCardInGameHistory(
    filter: any,
    rabbitData: any,
  ): Promise<any> {
    try {
      // Using setTimeout with async/await requires wrapping in a Promise
      return await new Promise((resolve) => {
        setTimeout(async () => {
          const updateResult = await this.db
            .collection('handHistoryArray')
            .updateOne(filter, {
              $push: { rabbitData: rabbitData } as any,
            });
          resolve(updateResult);
        }, 3000);
      });
    } catch (err) {
      throw err;
    }
  }

  async findVideoById(id: string): Promise<any> {
    try {
      return await this.db
        .collection('videos')
        .findOne({ _id: new Object(id) });
    } catch (err) {
      throw err;
    }
  }

  async findFormatedHands(query: any): Promise<any[]> {
    const limit = 1;

    try {
      return await this.db
        .collection('videos')
        .aggregate([
          {
            $match: {
              $and: [{ channelId: query.channelId }, { active: true }],
            },
          },
          { $sort: { _id: -1 } },
          { $limit: limit },
          {
            $lookup: {
              from: 'handTab',
              localField: 'roundId',
              foreignField: 'roundId',
              as: 'handData',
            },
          },
        ])
        .toArray();
    } catch (err) {
      throw err;
    }
  }

  async insertVideo(video: any): Promise<any> {
    try {
      const result: any = await this.db.collection('videos').insertOne(video);
      return result.ops[0];
    } catch (err) {
      throw err;
    }
  }

  /*----------------- HandTab Related Queries START ---------------------*/

  async createHandTab(params: any, totalPot: number): Promise<any> {
    const data = {
      channelId: params.channelId,
      roundId: params.table.roundId,
      handId: params.table.roundNumber,
      createdAt: new Date().getTime(),
      pot: totalPot,
      hands: params.table.boardCard,
      active: true,
      allPots: params.table.pot,
    };

    try {
      return await this.db.collection('handTab').insertOne(data);
    } catch (err) {
      throw err;
    }
  }

  async updateHandTab(
    channelId: string,
    roundId: string,
    data: any,
  ): Promise<any> {
    try {
      const result = await this.db
        .collection('handTab')
        .findOneAndUpdate(
          { channelId, roundId },
          { $set: data },
          { returnDocument: 'after' },
        );
      return result.value;
    } catch (err) {
      throw err;
    }
  }

  async getHandTab(channelId: string): Promise<any[]> {
    try {
      return await this.db
        .collection('handTab')
        .find(
          { channelId, active: true },
          {
            projection: {
              pot: 1,
              hands: 1,
              handHistoryId: 1,
              channelId: 1,
              videoId: 1,
            },
          },
        )
        .sort({ _id: -1 })
        .limit(systemConfig.handTabRecordCount)
        .toArray();
    } catch (err) {
      throw err;
    }
  }

  async getHandTabData(handId: string): Promise<any> {
    try {
      return await this.db
        .collection('handTab')
        .findOne({ handId }, { projection: { pot: 1, allPots: 1 } });
    } catch (err) {
      throw err;
    }
  }

  async getHandHistoryByVideoId(videoId: string): Promise<any> {
    try {
      return await this.db.collection('handTab').findOne({ videoId });
    } catch (err) {
      throw err;
    }
  }

  /*----------------- Hand History Related Queries START ---------------------*/

  async insertHandHistory(
    channelId: string,
    roundId: string,
    roundCount: number,
    startedAt: number,
    finishedAt: number,
    historyLog: any,
  ): Promise<any> {
    try {
      return await this.db.collection('handHistory').insertOne({
        channelId,
        roundId,
        roundCount,
        startedAt,
        finishedAt,
        historyLog,
      });
    } catch (err) {
      throw err;
    }
  }

  async getHandHistory(handHistoryId: string): Promise<any> {
    try {
      return await this.db
        .collection('handHistory')
        .findOne({ _id: new Object(handHistoryId) });
    } catch (err) {
      throw err;
    }
  }

  /*----------------- Game Activity Related Queries START ---------------------*/

  async createUserActivityGame(activity: any): Promise<any> {
    try {
      if (
        activity.subCategory == 'START GAME' ||
        activity.subCategory == 'GAME OVER'
      ) {
        const result: any = await this.db
          .collection('gameActivity')
          .insertOne(activity);
        return result.ops[0];
      } else {
        activity.expireAt = new Date();
        const result: any = await this.db
          .collection('gameActivityReductant')
          .insertOne(activity);
        return result.ops[0];
      }
    } catch (err) {
      throw err;
    }
  }

  /*----------------- Generic Query Function ---------------------*/

  async genericQuery(col: string, query: string, data: any[]): Promise<any> {
    if (typeof col !== 'string') {
      throw new Error('wrong collection name');
    }
    if (!(this.db.collection(col)[query] instanceof Function)) {
      throw new Error('wrong query name');
    }
    if (typeof data !== 'object') {
      throw new Error('data should be array object');
    }

    try {
      // Using spread operator to pass array elements as separate arguments
      return await this.db.collection(col)[query](...data);
    } catch (err) {
      throw err;
    }
  }

  /*----------------- User Activity Related Queries START ---------------------*/

  async createUserActivity(activity: any): Promise<any> {
    activity.expireAt = new Date();
    activity.createdAt = Date.now();

    try {
      const result: any = await this.db
        .collection('userActivity')
        .insertOne(activity);
      return result?.ops?.[0]; // error - result may be null
    } catch (err) {
      throw err;
    }
  }

  async createTipLog(data: any): Promise<any> {
    console.log('createTipLog', JSON.stringify(data));
    try {
      return await this.db.collection('usersTipHistory').insertOne(data);
    } catch (err) {
      throw err;
    }
  }

  async findPlayerFromPlayerArchive(filter: any): Promise<any[]> {
    try {
      return await this.db.collection('playerArchive').find(filter).toArray();
    } catch (err) {
      throw err;
    }
  }

  async insertPlayerLeave(data: any): Promise<any> {
    try {
      const result: any = await this.db
        .collection('playerLeaveActivity')
        .insertOne(data);
      return result.ops[0];
    } catch (err) {
      throw err;
    }
  }

  async findLastLeaveData(query: any): Promise<any[]> {
    try {
      return await this.db
        .collection('playerLeaveActivity')
        .find(query)
        .limit(1)
        .sort({ _id: -1 })
        .toArray();
    } catch (err) {
      throw err;
    }
  }

  async updateLeaveActivity(id: string, queryData: any): Promise<any> {
    try {
      return await this.db
        .collection('playerLeaveActivity')
        .updateOne({ _id: new Object(id) }, { $set: queryData });
    } catch (err) {
      throw err;
    }
  }

  async findLastHandID(query: any): Promise<any[]> {
    try {
      return await this.db
        .collection('gameActivity')
        .find(query)
        .limit(1)
        .sort({ _id: -1 })
        .toArray();
    } catch (err) {
      throw err;
    }
  }

  async getRoundData(roundNumber: string): Promise<any[]> {
    try {
      return await this.db
        .collection('gameActivityReductant')
        .find({ 'rawResponse.table.roundNumber': roundNumber })
        .toArray();
    } catch (err) {
      throw err;
    }
  }

  async getPlayerGames(query: any): Promise<any[]> {
    const limit = 25;
    const projectedFields = {
      'rawResponse.params.table.channelName': 1,
      'rawResponse.params.table.roundNumber': 1,
      'rawResponse.params.table.gameStartTime': 1,
      'rawResponse.params.table.channelId': 1,
      roundId: 1,
      _id: 0,
    };

    try {
      if (query.handId == '' && query.dateStr == '') {
        return await this.db
          .collection('gameActivity')
          .find(
            {
              subCategory: 'GAME OVER',
              'rawResponse.params.table.onStartPlayers': query.playerId,
            },
            { projection: projectedFields },
          )
          .sort({ _id: -1 })
          .limit(limit)
          .toArray();
      } else if (query.dateStr > 0) {
        const mongoQuery: any = {
          subCategory: 'GAME OVER',
          'rawResponse.params.table.onStartPlayers': query.playerId,
          createdAt: {
            $gt: parseInt(query.dateStr),
            $lte: parseInt(query.dateStrEnd),
          },
        };

        if (query.handId != '') {
          mongoQuery.roundNumber = query.handId;
        }

        return await this.db
          .collection('gameActivity')
          .find(mongoQuery, { projection: projectedFields })
          .limit(limit)
          .toArray();
      } else {
        return await this.db
          .collection('gameActivity')
          .find(
            {
              subCategory: 'GAME OVER',
              'rawResponse.params.table.onStartPlayers': query.playerId,
              'rawResponse.params.table.roundNumber': query.handId,
            },
            { projection: projectedFields },
          )
          .limit(limit)
          .toArray();
      }
    } catch (err) {
      throw err;
    }
  }

  async getRoundVideoData(query: any): Promise<any> {
    try {
      return await this.db
        .collection('videos')
        .findOne({ roundId: query.roundId });
    } catch (err) {
      throw err;
    }
  }

  async addBonusHistory(data: any): Promise<any> {
    try {
      return await this.db.collection('bonusHistory').insertOne(data);
    } catch (err) {
      throw err;
    }
  }

  async findAllUserwithNoOfHands(): Promise<any[]> {
    try {
      return await this.db
        .collection('gameActivity')
        .aggregate([
          {
            $match: {
              category: 'GAMEPLAY',
              subCategory: 'GAME OVER',
              'rawResponse.params.table.isRealMoney': true,
              createdAt: { $gt: 1559158200000, $lte: 1563157800000 },
            },
          },
          { $unwind: { path: '$rawResponse.params.table.onStartPlayers' } },
          {
            $group: {
              _id: '$rawResponse.params.table.onStartPlayers',
              numberOfHands: { $sum: 1 },
            },
          },
          { $sort: { numberOfHands: -1 } },
        ])
        .toArray();
    } catch (err) {
      throw err;
    }
  }

  async insertAndUpdateContestData(query: any, update: any): Promise<any> {
    try {
      return await this.db
        .collection('contest')
        .updateOne(query, update, { upsert: true });
    } catch (err) {
      throw err;
    }
  }

  /*----------------- EV History Related Queries START ---------------------*/

  async evHistory(query: any, data: any): Promise<any> {
    try {
      return await this.db
        .collection('evHistory')
        .updateOne(query, data, { upsert: true });
    } catch (err) {
      throw err;
    }
  }

  async evHistoryHandHistory(query: any): Promise<any[]> {
    try {
      return await this.db.collection('evHistory').find(query).toArray();
    } catch (err) {
      throw err;
    }
  }

  async findEVHistory(query: any): Promise<any[]> {
    query.createdAt = {
      $gt: Number(new Date()) - systemConfig.evHistoryInHours * 60 * 60 * 1000,
      $lte: Number(new Date()),
    };

    try {
      return await this.db
        .collection('evHistory')
        .find(query)
        .limit(50)
        .sort({ createdAt: -1 })
        .toArray();
    } catch (err) {
      throw err;
    }
  }

  async findEVHistoryForScore(query: any): Promise<any[]> {
    try {
      return await this.db
        .collection('evHistory')
        .aggregate([
          {
            $match: {
              tableName: query,
              userName: { $ne: 'admin' },
              createdAt: {
                $gt:
                  Number(new Date()) -
                  systemConfig.evHistoryInHours * 60 * 60 * 1000,
                $lte: Number(new Date()),
              },
            },
          },
          {
            $group: {
              _id: '$tableName',
              profit: { $sum: '$profit' },
            },
          },
        ])
        .toArray();
    } catch (err) {
      throw err;
    }
  }

  /*----------------- IPL Contest Related Queries START ---------------------*/

  async insertAndUpdateContestDataIPL(query: any, update: any): Promise<any> {
    try {
      return await this.db
        .collection('contestIPL')
        .updateOne(query, update, { upsert: true });
    } catch (err) {
      throw err;
    }
  }

  async getAllContestData(query: {
    month: number;
    year: number;
  }): Promise<any[]> {
    try {
      return await this.db
        .collection('contest')
        .aggregate([
          {
            $match: {
              $and: [{ month: query.month }, { year: query.year }],
            },
          },
          { $sort: { noOfHands: -1 } },
          {
            $group: {
              _id: '$slab',
              players: {
                $push: {
                  playerId: '$playerId',
                  noOfHands: '$noOfHands',
                  userName: '$userName',
                  profileImage: {
                    $concat: [
                      systemConfig.imageUploadHost,
                      '/profileImage/playerId/',
                      '$playerId',
                    ],
                  },
                },
              },
            },
          },
        ])
        .toArray();
    } catch (err) {
      throw err;
    }
  }

  async getAllContestDataIPL(query: { year: number }): Promise<any[]> {
    try {
      return await this.db
        .collection('contestIPL')
        .aggregate([
          {
            $match: {
              $and: [{ year: query.year }],
            },
          },
          { $sort: { noOfHands: -1 } },
          {
            $group: {
              _id: '$slab',
              players: {
                $push: {
                  playerId: '$playerId',
                  noOfHands: '$noOfHands',
                  userName: '$userName',
                  profileImage: {
                    $concat: [
                      systemConfig.imageUploadHost,
                      '/profileImage/playerId/',
                      '$playerId',
                    ],
                  },
                },
              },
            },
          },
        ])
        .toArray();
    } catch (err) {
      throw err;
    }
  }
}
