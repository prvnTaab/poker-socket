import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class PokerDatebaseService {
    constructor(@InjectConnection('db') private db: Connection) { }

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
async saveHistory (data: any): Promise<any> {
  try {
    return await mongodb.db.collection('tourHistory').insertOne(data);
  } catch (err) {
    throw err;
  }
};

// Affiliates
async findSuggestedAffiliates (filter: string): Promise<any[]> {
  try {
    return await mongodb.db.collection('tables').find({
      "channelName": {
        '$regex': filter
      }
    }).toArray();
  } catch (err) {
    throw err;
  }
};

// Users
async findUser (filter: any): Promise<any> {
  try {
    const result = await mongodb.db.collection('users').findOne(filter);
    
    if (result?.points) {
      const coinType1 = result.points.find(({ coinType }: any) => coinType === 1);
      result.realChips = coinType1.deposit + coinType1.win;
      result.realChipBonus = coinType1.promo;
  
      const coinType2 = result.points.find(({ coinType }: any) => coinType === 2);
      result.freeChips = coinType2.totalBalance;
      
      const coinType3 = result.points.find(({ coinType }: any) => coinType === 3);
      result.unClaimedChipBonus = coinType3.promo;
  
      const coinType4 = result.points.find(({ coinType }: any) => coinType === 4);
      result.touneyChips = coinType4.deposit + coinType4.win;
      
      result.realChips = Math.floor(result.realChips) || 0;
      result.freeChips = Math.floor(result.freeChips) || 0;
      result.realChipBonus = Math.floor(result.realChipBonus) || 0;
    }
    
    return result;
  } catch (err) {
    throw err;
  }
};

// Chat
async saveChat (data: any): Promise<any>{
  try {
    return await mongodb.db.collection('chat').insertOne(data);
  } catch (err) {
    throw err;
  }
};

async getChat (query: any): Promise<any[]> {
  try {
    return await mongodb.db.collection('chat').find(query).limit(1000).toArray();
  } catch (err) {
    throw err;
  }
};

// Users with options
async findUsersOpts (filter: any, opts: any): Promise<any[]> {
  try {
    const result = await mongodb.db.collection('users').find(filter, opts).toArray();
    for (const user of result) {
      if (user.points) {
        const coinType1 = user.points.find(({ coinType }: any) => coinType === 1);
        user.realChips = Math.floor(coinType1.deposit + coinType1.win);
        user.realChipBonus = Math.floor(coinType1.promo);

        const coinType2 = user.points.find(({ coinType }: any) => coinType === 2);
        user.freeChips = Math.floor(coinType2.totalBalance);
      
        const coinType3 = user.points.find(({ coinType }: any) => coinType === 3);
        user.unClaimedChipBonus = Math.floor(coinType3.promo);

        const coinType4 = user.points.find(({ coinType }: any) => coinType === 4);
        user.touneyChips = Math.floor(coinType4.deposit + coinType4.win);
        delete user.points;
      }
    }
    return result;
  } catch (err) {
    throw err;
  }
};

// Mobile OTP
async findMobileNumber (filter: any): Promise<any> {
  try {
    return await mongodb.db.collection('mobileOtp').findOne(filter);
  } catch (err) {
    throw err;
  }
};

// Rabbit data
async insertRabbitData (data: any): Promise<any> {
  try {
    const result = await mongodb.db.collection('rabbitData').insertOne(data);
    return result.ops[0];
  } catch (err) {
    throw err;
  }
};

async searchRabbitData (query: any): Promise<any[]> {
  try {
    return await mongodb.db.collection('rabbitData').find(query)
      .sort({ 'date': -1 })
      .limit(5)
      .toArray();
  } catch (err) {
    throw err;
  }
};

// User arrays
async findUserArray (userIds: string[]): Promise<any[]> {
  console.log("in findUserArray filter is ", userIds);
  try {
    const result = await mongodb.db.collection('users').find({ playerId: { $in: userIds } }).toArray();
    
    for (const user of result) {
      if (user.points) {
        const coinType1 = user.points.find(({ coinType }: any) => coinType === 1);
        user.realChips = Math.floor(coinType1.deposit + coinType1.win);
        user.realChipBonus = Math.floor(coinType1.promo);

        const coinType2 = user.points.find(({ coinType }: any) => coinType === 2);
        user.freeChips = Math.floor(coinType2.totalBalance);
      
        const coinType3 = user.points.find(({ coinType }: any) => coinType === 3);
        user.unClaimedChipBonus = Math.floor(coinType3.promo);

        const coinType4 = user.points.find(({ coinType }: any) => coinType === 4);
        user.touneyChips = Math.floor(coinType4.deposit + coinType4.win);
        delete user.points;
      }
    }
    return result;
  } catch (err) {
    throw err;
  }
};



    // ----------------------------New line ------------------------------------------------

// Bounty players
export const findPlayerFromBounty = async (playerIds: string[]): Promise<any[]> => {
  console.log("in findUserArray filter is ", playerIds);
  try {
    const result = await mongodb.db.collection('tourBounty').find({ playerId: { $in: playerIds } }).toArray();
    console.log("result in findUserArray ", JSON.stringify(result));
    return result;
  } catch (err) {
    throw err;
  }
};

// User operations
export const findUserOrOperation = async (filter: any): Promise<any> => {
  const newQuery: any = {};
  if (filter.emailId) newQuery.emailId = filter.emailId;
  if (filter.userName) newQuery.userName = filter.userName;
  if (filter.mobileNumber) newQuery.mobileNumber = filter.mobileNumber;

  try {
    const result = await mongodb.db.collection('users').findOne({ $or: [newQuery] });
    
    if (result?.points) {
      const coinType1 = result.points.find(({ coinType }: any) => coinType === 1);
      result.realChips = Math.floor(coinType1.deposit + coinType1.win);
      result.realChipBonus = Math.floor(coinType1.promo);

      const coinType2 = result.points.find(({ coinType }: any) => coinType === 2);
      result.freeChips = Math.floor(coinType2.totalBalance);
    
      const coinType3 = result.points.find(({ coinType }: any) => coinType === 3);
      result.unClaimedChipBonus = Math.floor(coinType3.promo);

      const coinType4 = result.points.find(({ coinType }: any) => coinType === 4);
      result.touneyChips = Math.floor(coinType4.deposit + coinType4.win);
      delete result.points;
    }
    
    return result;
  } catch (err) {
    throw err;
  }
};

// User validation
export const validateUserAtRegisteration = async (filter: any): Promise<any> => {
  try {
    const result = await mongodb.db.collection('users').findOne({ 
      $or: [{ emailId: filter.emailId }, { userName: filter.userName }] 
    });
    return result;
  } catch (err) {
    throw err;
  }
};

// User management
export const removeUser = async (filter: any): Promise<any> => {
  try {
    const result = await mongodb.db.collection('users').deleteOne(filter);
    return result;
  } catch (err) {
    throw err;
  }
};

export const createUser = async (userData: any): Promise<any> => {
  try {
    const result = await mongodb.db.collection('users').insertOne(userData);
    
    if (result.ops[0]?.points) {
      const coinType1 = result.ops[0].points.find(({ coinType }: any) => coinType === 1);
      result.ops[0].realChips = coinType1.deposit + coinType1.win;
      result.ops[0].realChipBonus = coinType1.promo;
      
      const coinType2 = result.ops[0].points.find(({ coinType }: any) => coinType === 2);
      result.ops[0].freeChips = coinType2.totalBalance;
      
      const coinType3 = result.ops[0].points.find(({ coinType }: any) => coinType === 3);
      result.ops[0].unClaimedChipBonus = coinType3.promo;
      
      const coinType4 = result.ops[0].points.find(({ coinType }: any) => coinType === 4);
      result.ops[0].touneyChips = coinType4.deposit + coinType4.win;
      
      delete result.ops[0].points;
      result.ops[0].realChips = Math.floor(result.ops[0].realChips) || 0;
      result.ops[0].freeChips = Math.floor(result.ops[0].freeChips) || 0;
      result.ops[0].realChipBonus = Math.floor(result.ops[0].realChipBonus) || 0;
    }
    
    return result.ops[0];
  } catch (err) {
    throw err;
  }
};

// Chips management
export const getChips = async (filter: any): Promise<any> => {
  try {
    const result = await mongodb.db.collection('users').findOne(filter, { 
      projection: { realChips: 1, points: 1, realChipBonus: 1 } 
    });
    return result;
  } catch (err) {
    throw err;
  }
};

export const isTopupAllowed = async (filter: any): Promise<any> => {
  try {
    const result = await mongodb.db.collection('users').findOne(filter);
    return result;
  } catch (err) {
    throw err;
  }
};

export const deductRealChips = async (filter: any, chips: number): Promise<any> => {
  try {
    const result = await mongodb.db.collection('users').findOneAndUpdate(
      filter, 
      { $inc: { realChips: -chips } }, 
      { returnDocument: 'after' }
    );
    console.log("inside pm_game_server/old/shared/model/dbQuery");
    return result.value;
  } catch (err) {
    throw err;
  }
};

export const deductRealChipBonus = async (filter: any, chips: number, realchipbonus: number): Promise<any> => {
  try {
    const result = await mongodb.db.collection('users').findOneAndUpdate(
      filter, 
      { $inc: { realChips: -chips, realChipBonus: -realchipbonus } }, 
      { returnDocument: 'after' }
    );
    return result.value;
  } catch (err) {
    throw err;
  }
};

export const deductFreeChips = async (filter: any, chips: number): Promise<any> => {
  try {
    const result = await mongodb.db.collection('users').findOneAndUpdate(
      filter, 
      { $inc: { freeChips: -chips } }, 
      { returnDocument: 'after' }
    );
    return result.value;
  } catch (err) {
    throw err;
  }
};

export const addRealChips = async (filter: any, chips: number): Promise<any> => {
  try {
    const result = await mongodb.db.collection('users').findOneAndUpdate(
      filter, 
      { $inc: { realChips: chips } }, 
      { returnDocument: 'after' }
    );
    return result.value;
  } catch (err) {
    throw err;
  }
};

export const addRealChipswithBonus = async (filter: any, chips: number, bonuschip: number): Promise<any> => {
  try {
    const result = await mongodb.db.collection('users').findOneAndUpdate(
      filter, 
      { $inc: { realChips: chips, realChipBonus: bonuschip } }, 
      { returnDocument: 'after' }
    );
    return result.value;
  } catch (err) {
    throw err;
  }
};

export const addChipsInPlayerDeposit = async (filter: any, chips: number): Promise<any> => {
  try {
    const result = await mongodb.db.collection('users').updateOne(
      filter, 
      { $inc: { 'chipsManagement.deposit': chips } }
    );
    return result;
  } catch (err) {
    throw err;
  }
};

export const returnRealChipsToPlayer = async (filter: any, update: any): Promise<any> => {
  try {
    const result = await mongodb.db.collection('users').updateOne(filter, update);
    return result;
  } catch (err) {
    throw err;
  }
};

export const addFreeChips = async (filter: any, chips: number): Promise<any> => {
  serverLog(stateOfX.serverLogType.info, "in addFreeChips dbQuery" + JSON.stringify(filter));
  serverLog(stateOfX.serverLogType.info, "chips" + chips);
  try {
    const result = await mongodb.db.collection('users').updateOne(
      filter, 
      { $inc: { freeChips: chips } }
    );
    return result;
  } catch (err) {
    serverLog(stateOfX.serverLogType.error, "err: " + JSON.stringify(err));
    throw err;
  }
};

export const addFreeChipsToMultiplePlayers = async (playerIds: string[], chips: number): Promise<any> => {
  serverLog(stateOfX.serverLogType.info, "in add free chips to multiple players - ", JSON.stringify(playerIds), chips);
  try {
    const result = await mongodb.db.collection('users').updateMany(
      { playerId: { $in: playerIds } }, 
      { $inc: { freeChips: chips } }
    );
    return result;
  } catch (err) {
    throw err;
  }
};

export const addRealChipsToMultiplePlayers = async (playerIds: string[], chips: number): Promise<any> => {
  serverLog(stateOfX.serverLogType.info, "in add real chips to multiple players - ", JSON.stringify(playerIds), chips);
  try {
    const result = await mongodb.db.collection('users').updateMany(
      { playerId: { $in: playerIds } }, 
      { $inc: { realChips: chips } }
    );
    return result;
  } catch (err) {
    throw err;
  }
};

// Favorite seats
export const addFavourateSeat = async (playerId: string, favourateSeat: any): Promise<any> => {
  try {
    const result = await mongodb.db.collection('users').updateOne(
      { 'playerId': playerId }, 
      { 
        $push: {
          favourateSeat: {
            $each: [favourateSeat],
            $sort: { createdAt: -1 }
          }
        }
      }
    );
    return result;
  } catch (err) {
    throw err;
  }
};

export const removeFavourateSeat = async (playerId: string, channelId: string): Promise<any> => {
  channelId = channelId.split("-")[0];
  try {
    const result = await mongodb.db.collection('users').updateOne(
      { 'playerId': playerId }, 
      { 
        $pull: {
          favourateSeat: {
            channelId: channelId
          }
        }
      }
    );
    return result;
  } catch (err) {
    throw err;
  }
};

// Favorite tables
export const addFavourateTable = async (playerId: string, favTableData: any): Promise<any> => {
  try {
    const result = await mongodb.db.collection('users').updateOne(
      { 'playerId': playerId }, 
      { 
        $push: {
          favourateTable: {
            $each: [favTableData],
            $sort: { createdAt: -1 }
          }
        }
      }
    );
    return result;
  } catch (err) {
    throw err;
  }
};

export const removeFavourateTable = async (playerId: string, channelId: string): Promise<any> => {
  channelId = channelId.split("-")[0];
  try {
    const result = await mongodb.db.collection('users').updateOne(
      { 'playerId': playerId }, 
      { 
        $pull: {
          favourateTable: {
            channelId: channelId
          }
        }
      }
    );
    return result;
  } catch (err) {
    throw err;
  }
};

// Tables management
export const createTable = async (database: string, userData: any): Promise<any> => {
  try {
    const result = await mongodb.db.collection(database).insertOne(userData);
    return result;
  } catch (err) {
    throw err;
  }
};

export const createBounty = async (data: any): Promise<any> => {
  try {
    const result = await mongodb.db.collection("tourBounty").insertOne(data);
    return result;
  } catch (err) {
    throw err;
  }
};

export const updateBounty = async (query: any, bounty: number): Promise<any> => {
  console.log("query and bounty is in updateBounty is - " + JSON.stringify(query) + bounty);
  try {
    const result = await mongodb.db.collection("tourBounty").updateOne(
      query, 
      { $inc: { "bounty": bounty } }, 
      { upsert: true }
    );
    return result;
  } catch (err) {
    throw err;
  }
};

export const listTable = async (query: any): Promise<any[]> => {
  const skip = query.skip || 0;
  const limit = query.limit || 0;
  
  if (query.channelVariation == 'All') {
    delete query.channelVariation;
  }
  
  delete query.skip;
  delete query.limit;
  
  serverLog(stateOfX.serverLogType.dbQuery, ' Query while listing table - ' + JSON.stringify(query));
  
  try {
    if (query.channelType == "TOURNAMENT") {
      delete query.isActive;
      delete query.isRealMoney;
      console.log("in listTable dbQuery later", query);
      const result = await mongodb.db.collection('tourList').find(query)
        .skip(skip)
        .limit(limit)
        .toArray();
      return result;
    } else {
      if (query.isOrganic) {
        query.isRealMoney = false;
      }
      delete query.isOrganic;

      console.log("in listTable dbQuery 413", query);
      const result = await mongodb.db.collection('tables').find(query)
        .skip(skip)
        .limit(limit)
        .toArray();
      return result;
    }
  } catch (err) {
    throw err;
  }
};

export const countlistTable = async (query: any): Promise<number> => {
  console.log("in listTable count dbQuery", query);
  serverLog(stateOfX.serverLogType.dbQuery, ' Query while listing table - ' + JSON.stringify(query));
  
  try {
    if (query.channelType == "TOURNAMENT") {
      const count = await mongodb.db.collection('tourList').countDocuments(query);
      return count;
    } else {
      const count = await mongodb.db.collection('tables').countDocuments(query);
      return count;
    }
  } catch (err) {
    throw err;
  }
};

export const quickSeatTable = async (query: any): Promise<any[]> => {
  try {
    const result = await mongodb.db.collection('tables').find(query)
      .sort({ 'minBuyIn': -1 })
      .limit(30)
      .toArray();
    return result;
  } catch (err) {
    throw err;
  }
};

export const findTableById = async (id: string): Promise<any> => {
  try {
    const result = await mongodb.db.collection('tables').findOne({ channelId: id });
    return result;
  } catch (err) {
    throw err;
  }
};

export const findTableByChannelId = async (channelId: string): Promise<any> => {
  try {
    const result = await mongodb.db.collection('tables').findOne({ channelId: channelId.toString() });
    return result;
  } catch (err) {
    throw err;
  }
};

export const findPrizePoolStructure = async (query: any): Promise<any> => {
  console.log("Inside db finding prizePool", query);
  try {
    const prizePool1 = await mongodb.db.collection('mttPayout').findOne({ "type": query.type });
    const prizePool2 = prizePool1.prizePool.find((o: any) => 
      (query.totalplayers >= o.enrolledUsers[0] && query.totalplayers <= o.enrolledUsers[1]));
    console.log("final document is ", prizePool2);
    return prizePool2;
  } catch (err) {
    throw err;
  }
};

export const findTable = async (query: any): Promise<any[]> => {
  const skip = query.skip || 0;
  const limit = query.limit || 0;
  delete query.skip;
  delete query.limit;
  
  try {
    const result = await mongodb.db.collection('tables').find(query)
      .skip(skip)
      .limit(limit)
      .sort({ '_id': -1 })
      .toArray();
    return result;
  } catch (err) {
    throw err;
  }
};

export const findLastTables = async (query: any): Promise<any[]> => {
  try {
    const result = await mongodb.db.collection('tables').find(query)
      .sort({ 'createdAt': -1 })
      .toArray();
    return result;
  } catch (err) {
    throw err;
  }
};

export const removeCloneTable = async (query: any): Promise<any> => {
  try {
    const result = await mongodb.db.collection('tables').deleteMany(query);
    return result;
  } catch (err) {
    throw err;
  }
};

export const removeTournamentTable = async (id: string): Promise<any> => {
  try {
    const result = await mongodb.db.collection('tables').deleteMany({ 
      "tournament.tournamentId": id.toString() 
    });
    return result;
  } catch (err) {
    throw err;
  }
};

export const createTournamentTables = async (userDataArray: any[]): Promise<any> => {
  console.log("got this data for creating tour tables", userDataArray);
  try {
    const result = await mongodb.db.collection('tables').insertMany(userDataArray, { ordered: false });
    return result;
  } catch (err) {
    throw err;
  }
};

export const createOneTournamentTables = async (data: any): Promise<any> => {
  console.log("got this data for creating tour tables", data);
  try {
    const result = await mongodb.db.collection('tables').insertOne(data);
    return result;
  } catch (err) {
    throw err;
  }
};

export const createNewTable = async (table: any): Promise<any> => {
  try {
    const result = await mongodb.db.collection('tables').insertOne(table);
    return result;
  } catch (err) {
    throw err;
  }
};

export const createTournamentTable = async (table: any): Promise<any> => {
  try {
    const result = await mongodb.db.collection('tables').insertOne(table);
    return result;
  } catch (err) {
    throw err;
  }
};

export const getTournamentTables = async (tournamentId: string): Promise<any[]> => {
  try {
    const result = await mongodb.db.collection('tables').find({ 
      'channelType': 'TOURNAMENT', 
      'tournament.tournamentId': tournamentId.toString() 
    }).toArray();
    return result;
  } catch (err) {
    throw err;
  }
};

export const updateStackTable = async (id: string, totalGame: number, totalStack: number, avgStack: number): Promise<any> => {
  id = id.split("-")[0];
  try {
    const result = await mongodb.db.collection('tables').updateOne(
      { channelId: id }, 
      { $set: { totalGame, totalStack, avgStack } }
    );
    return result;
  } catch (err) {
    throw err;
  }
};

export const updateFlopPlayerTable = async (id: string, totalFlopPlayer: number, totalPlayer: number, flopPercent: number): Promise<any> => {
  id = id.split("-")[0];
  try {
    const result = await mongodb.db.collection('tables').updateOne(
      { channelId: id }, 
      { $set: { totalFlopPlayer, totalPlayer, flopPercent } }
    );
    return result;
  } catch (err) {
    throw err;
  }
};

// Tournament rooms
export const createTournamentRoom = async (userData: any): Promise<any> => {
  try {
    const result = await mongodb.db.collection('tourList').insertOne(userData);
    return result;
  } catch (err) {
    throw err;
  }
};

export const listTournamentRoom = async (query: any): Promise<any[]> => {
  serverLog(stateOfX.serverLogType.info, JSON.stringify(query));
  try {
    const result = await mongodb.db.collection('tourList').find(query).toArray();
    return result;
  } catch (err) {
    throw err;
  }
};

export const listTournamentByTimeSpan = async (query: any): Promise<any[]> => {
  console.log(query);
  try {
    const result = await mongodb.db.collection('tourList').find({ 
      channelVariation: query.channelVariation, 
      buyIn: query.buyIn, 
      tournamentType: query.tournamentType, 
      $and: [
        { tournamentStartTime: { $gte: query.startTime } }, 
        { tournamentStartTime: { $lte: query.endTime } }
      ] 
    }).toArray();
    return result;
  } catch (err) {
    throw err;
  }
};

export const updateTournamentRoom = async (query: any, userData: any): Promise<any> => {
  console.trace("updateTournamentRoomupdateTournamentRoom", query, userData);
  try {
    const result = await mongodb.db.collection('tourList').findOneAndUpdate(
      query, 
      { $set: userData }, 
      { returnDocument: 'after' }
    );
    return result.value;
  } catch (err) {
    throw err;
  }
};

export const updateTournamentGeneralize = async (id: string, userData: any): Promise<any> => {
  console.trace("id and user data is in updateTournamentGeneralize - " + id + " " + userData);
  try {
    const result = await mongodb.db.collection('tourList').updateOne(
      { _id: new ObjectId(id) }, 
      { $set: userData }
    );
    return result;
  } catch (err) {
    throw err;
  }
};

export const updateTourState = async (id: string, state: string): Promise<any> => {
  console.trace("now going to update tour state", id, state);
  try {
    const result = await mongodb.db.collection('tourList').findOneAndUpdate(
      { tournamentId: id }, 
      { $set: { state } }, 
      { returnDocument: 'after' }
    );
    console.log("result is in updateTourState ", JSON.stringify(result));
    return result.value;
  } catch (err) {
    throw err;
  }
};

export const updateTournamentStateAndVersionGenralized = async (filter: any, updateData: any): Promise<any> => {
  console.trace("filer, updateData in updateTournamentStateAndVersionGenralized ", filter, updateData);
  try {
    const result = await mongodb.db.collection('tourList').updateOne(
      filter, 
      { $set: updateData, $inc: { gameVersionCount: 1 } }
    );
    console.log("result is in updateTournamentStateAndVersion ", JSON.stringify(result));
    return result;
  } catch (err) {
    throw err;
  }
};

export const getTournamentRoom = async (id: string): Promise<any> => {
  try {
    const result = await mongodb.db.collection('tourList').findOne({ tournamentId: id });
    return result;
  } catch (err) {
    throw err;
  }
};

export const getTourRoom = async (id: string): Promise<any> => {
  console.log("in getTournamentRoom id is ", id);
  try {
    const result = await mongodb.db.collection('tourList').findOne({ tournamentId: id });
    console.log("result in finding tour is", result);
    return result;
  } catch (err) {
    throw new Error(err);
  }
};

export const getTournamentRoomUpdated = async (id: string): Promise<any> => {
  console.log("in getTournamentRoom id is ", id);
  try {
    const result = await mongodb.db.collection('tourList').findOne({ tournamentId: id });
    if (result) {
      return result;
    } else {
      throw new Error("Got error in getting tournament room!");
    }
  } catch (err) {
    throw err;
  }
};

export const countTournamentusersUpdated = async (filter: any): Promise<number> => {
  console.log("filter is in countTournamentusers is - ", filter);
  try {
    const count = await mongodb.db.collection('tourUsers').countDocuments(filter);
    return count;
  } catch (err) {
    throw new Error("Got error in getting tournament room!");
  }
};

export const findTimeBankRuleUpdated = async (id: string): Promise<any> => {
  console.log("in findTimeBankRule id is===", id);
  try {
    const result = await mongodb.db.collection('tourTimeBank').findOne({ timeBankId: id });
    if (result) {
      return result;
    } else {
      throw new Error("Got error in finding timeBankRule!");
    }
  } catch (err) {
    throw err;
  }
};

export const createTournamentTableUpdated = async (table: any): Promise<any> => {
  console.log("in findTimeBankRule id is===", table);
  try {
    const result = await mongodb.db.collection('tables').insertOne(table);
    if (result) {
      return result;
    } else {
      throw new Error("Got error in inserting table in db!");
    }
  } catch (err) {
    throw err;
  }
};

export const getUserTicket = async (query: any): Promise<any> => {
  console.log("in getUserTicket id is ", query);
  try {
    const result = await mongodb.db.collection('tourTicket').findOne(query);
    return result;
  } catch (err) {
    throw err;
  }
};

export const updateTourTicket = async (filter: any, data: any): Promise<any> => {
  console.log("in updateTourTicket filter is ", filter);
  console.log("in updateTourTicket data is ", data);
  try {
    const result = await mongodb.db.collection('tourTicket').updateOne(
      filter, 
      { $set: data }
    );
    return result;
  } catch (err) {
    throw err;
  }
};

export const getTimeBankDetails = async (id: string): Promise<any> => {
  console.log("in getTimeBankDetails id is ", id);
  try {
    const result = await mongodb.db.collection('tourTimeBank').findOne({ timeBankId: id });
    return result;
  } catch (err) {
    throw err;
  }
};

export const updateStackTournamentRoom = async (id: string, totalGame: number, totalStack: number): Promise<any> => {
  try {
    const result = await mongodb.db.collection('tourList').updateOne(
      { _id: new ObjectId(id) }, 
      { $inc: { totalGame, totalStack } }
    );
    return result;
  } catch (err) {
    throw err;
  }
};

export const updateTournamentState = async (id: string, state: string): Promise<any> => {
  console.trace("updateTournamentState is in dbQuery - " + id, state);
  try {
    const result = await mongodb.db.collection('tourList').updateOne(
      { _id: new ObjectId(id) }, 
      { $set: { state } }
    );
    console.log(result);
    return result;
  } catch (err) {
    throw err;
  }
};

export const updateTournamentStateAndTime = async (id: string, state: string): Promise<any> => {
  console.trace("updateTournamentState is in dbQuery - " + id, state);
  try {
    const result = await mongodb.db.collection('tourList').updateOne(
      { _id: new ObjectId(id) }, 
      { $set: { state, tournamentStartTime: Number(new Date()) } }
    );
    console.log(result);
    return result;
  } catch (err) {
    throw err;
  }
};

export const findTournamentRoom = async (query: any): Promise<any[]> => {
  try {
    const result = await mongodb.db.collection('tourList').find(query).toArray();
    return result;
  } catch (err) {
    throw err;
  }
};

export const updateTournamentStateToRunning = async (tournamentId: string): Promise<any> => {
  try {
    const result = await mongodb.db.collection('tourList').updateOne(
      { _id: new ObjectId(tournamentId) }, 
      { $set: { state: stateOfX.tournamentState.running } }
    );
    return result;
  } catch (err) {
    throw err;
  }
};

export const quickSeatTournament = async (query: any): Promise<any[]> => {
  try {
    const result = await mongodb.db.collection('tourList').find(query)
      .sort({ 'tournamentStartTime': -1 })
      .limit(30)
      .toArray();
    return result;
  } catch (err) {
    throw err;
  }
};

export const countTournaments = async (query: any): Promise<number> => {
  try {
    const count = await mongodb.db.collection('tourList').countDocuments(query);
    return count;
  } catch (err) {
    throw err;
  }
};

// Blind rules
export const listBlindRule = async (query: any): Promise<any[]> => {
  try {
    const result = await mongodb.db.collection('tourBlinds').find(query).toArray();
    return result;
  } catch (err) {
    throw err;
  }
};

export const findBlindRule = async (id: string): Promise<any> => {
  try {
    const result = await mongodb.db.collection('tourBlinds').findOne({ tournamentId: id });
    return result;
  } catch (err) {
    throw err;
  }
};

export const updateBlindRule = async (id: string, userData: any): Promise<any> => {
  try {
    const result = await mongodb.db.collection('tourBlinds').findOneAndUpdate(
      { _id: new ObjectId(id) }, 
      { $set: userData }, 
      { returnDocument: 'after' }
    );
    return result.value;
  } catch (err) {
    throw err;
  }
};

// Time bank rule
export const findTimeBankRule = async (id: string): Promise<any> => {
  console.log("in findTimeBankRule");
  try {
    const result = await mongodb.db.collection('tourTimeBank').findOne({ timeBankId: id });
    return result;
  } catch (err) {
    throw err;
  }
};

// Prize rules
export const createPrizeRule = async (prizeData: any): Promise<any> => {
  console.log("prize data is - " + prizeData);
  try {
    const result = await mongodb.db.collection('prizeRules').updateOne(
      { 'tournamentId': prizeData.tournamentId }, 
      { $set: prizeData }, 
      { upsert: true }
    );
    return result;
  } catch (err) {
    throw err;
  }
};

export const getPrizeRule = async (id: string): Promise<any> => {
  try {
    const result = await mongodb.db.collection('prizeRules').findOne({ 'tournamentId': id });
    return result;
  } catch (err) {
    throw err;
  }
};

export const findNormalPrizeRule = async (id: string): Promise<any[]> => {
  console.log("in findNormalPrizeRule id is ", id);
  try {
    const result = await mongodb.db.collection('prizeRules').find({ 
      tournamentId: id.toString(), 
      type: "server" 
    }).toArray();
    console.log("list prize rule result is ", result);
    return result;
  } catch (err) {
    throw err;
  }
};

export const listPrizeRule = async (query: any): Promise<any[]> => {
  console.log("query in listPrizeRule ", query);
  try {
    const result = await mongodb.db.collection('prizeRules').find(query).toArray();
    console.log("list prize rule result is ", result);
    return result;
  } catch (err) {
    throw err;
  }
};

export const updatePrizeRule = async (id: string, userData: any): Promise<any> => {
  try {
    const result = await mongodb.db.collection('prizeRules').findOneAndUpdate(
      { _id: new ObjectId(id) }, 
      { $set: userData }, 
      { returnDocument: 'after' }
    );
    return result.value;
  } catch (err) {
    throw err;
  }
};

export const listPrizeRuleWithLimitedData = async (query: any): Promise<any[]> => {
  try {
    const result = await mongodb.db.collection('prizeRules').find(query, { 
      projection: { _id: 1, name: 1 } 
    }).toArray();
    return result;
  } catch (err) {
    throw err;
  }
};

export const deletePrizeRule = async (tournamentId: string): Promise<any> => {
  try {
    const result = await mongodb.db.collection('prizeRules').deleteMany({ tournamentId });
    return result;
  } catch (err) {
    throw err;
  }
};

// User updates
export const updateUser = async (query: any, updateKeys: any): Promise<any> => {
  console.log('in update user in dbQuery - ' + JSON.stringify(query) + JSON.stringify(updateKeys));
  try {
    const result = await mongodb.db.collection('users').updateOne(
      query, 
      { $set: updateKeys }
    );
    return result;
  } catch (err) {
    throw err;
  }
};

// Bonus data
export const createBonusData = async (bonusData: any): Promise<any> => {
  try {
    const result = await mongodb.db.collection('bonusdata').insertOne(bonusData);
    return result;
  } catch (err) {
    throw err;
  }
};

export const findBounsData = async (query: any): Promise<any> => {
  try {
    const result = await mongodb.db.collection('bonusdata').findOne(query);
    return result;
  } catch (err) {
    throw err;
  }
};

export const updateBounsDataSetKeys = async (query: any, updateKeys: any): Promise<any> => {
  try {
    const result = await mongodb.db.collection('bonusdata').updateOne(
      query, 
      { $set: updateKeys }
    );
    return result;
  } catch (err) {
    throw err;
  }
};

export const increaseUserStats = async (query: any, updateKeys: any): Promise<any> => {
  console.log('in increament user stats in dbQuery - ' + JSON.stringify(query) + JSON.stringify(updateKeys));
  try {
    const result = await mongodb.db.collection('users').updateMany(
      query, 
      { $inc: updateKeys }
    );
    return result;
  } catch (err) {
    throw err;
  }
};

export const findAndModifyUser = async (query: any, updateKeys: any): Promise<any> => {
  console.log("query is ", query);
  console.log("updateKeys is ", updateKeys);
  try {
    const result = await mongodb.db.collection('users').findOneAndUpdate(
      query, 
      { $set: updateKeys }, 
      { returnDocument: 'after' }
    );
    
    if (result?.value?.points) {
      const coinType1 = result.value.points.find(({ coinType }: any) => coinType === 1);
      result.value.realChips = coinType1.deposit + coinType1.win;
      result.value.realChipBonus = coinType1.promo;
      
      const coinType2 = result.value.points.find(({ coinType }: any) => coinType === 2);
      result.value.freeChips = coinType2.totalBalance;
      
      const coinType3 = result.value.points.find(({ coinType }: any) => coinType === 3);
      result.value.unClaimedChipBonus = coinType3.promo;
      
      const coinType4 = result.value.points.find(({ coinType }: any) => coinType === 4);
      result.value.touneyChips = coinType4.deposit + coinType4.win;
      
      delete result.value.points;
      result.value.realChips = Math.floor(result.value.realChips) || 0;
      result.value.freeChips = Math.floor(result.value.freeChips) || 0;
      result.value.realChipBonus = Math.floor(result.value.realChipBonus) || 0;
    }
    
    return result.value;
  } catch (err) {
    throw err;
  }
};

export const setSubscription = async (filter: any, data: any): Promise<any> => {
  try {
    const result = await mongodb.db.collection('users').findOneAndUpdate(
      filter, 
      { $set: { subscription: data } }, 
      { returnDocument: 'after' }
    );
    return result.value;
  } catch (err) {
    throw err;
  }
};

// Notes
export const createNotes = async (notesData: any): Promise<any> => {
  try {
    const result = await mongodb.db.collection('notes').insertOne(notesData);
    return result.ops[0];
  } catch (err) {
    throw err;
  }
};

export const updateNotes = async (query: any, updateKeys: any): Promise<any> => {
  try {
    const result = await mongodb.db.collection('notes').updateOne(
      query, 
      { $set: updateKeys }
    );
    return result;
  } catch (err) {
    throw err;
  }
};

export const deleteNotes = async (query: any): Promise<any> => {
  try {
    const result = await mongodb.db.collection('notes').deleteOne(query);
    return result;
  } catch (err) {
    throw err;
  }
};

export const findNotes = async (filter: any): Promise<any> => {
  console.log("in get notes", filter);
  try {
    const result = await mongodb.db.collection('notes').findOne(filter);
    return result;
  } catch (err) {
    throw err;
  }
};

export const getCustomUser = async (playerId: string, keys: any): Promise<any> => {
  try {
    const result = await mongodb.db.collection('users').findOne(
      { playerId }, 
      { projection: keys }
    );
    
    if (result?.points) {
      const coinType1 = result.points.find(({ coinType }: any) => coinType === 1);
      result.realChips = coinType1.deposit + coinType1.win;
      result.realChipBonus = coinType1.promo;
  
      const coinType2 = result.points.find(({ coinType }: any) => coinType === 2);
      result.freeChips = coinType2.totalBalance;
      
      const coinType3 = result.points.find(({ coinType }: any) => coinType === 3);
      result.unClaimedChipBonus = coinType3.promo;
  
      const coinType4 = result.points.find(({ coinType }: any) => coinType === 4);
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
};

// Report issue
export const reportIssue = async (issueDetails: any): Promise<any> => {
  try {
    const result = await mongodb.db.collection('issues').insertOne(issueDetails);
    return result.ops[0];
  } catch (err) {
    throw err;
  }
};

export const getIssue = async (filter: any): Promise<any[]> => {
  console.log("in get issue");
  try {
    const result = await mongodb.db.collection('issues').find(filter).toArray();
    console.log("inside query");
    console.log(result);
    return result;
  } catch (err) {
    console.log(err);
    throw err;
  }
};

// Tournament users
export const countTournamentusers = async (filter: any): Promise<number> => {
  console.log("filter is in countTournamentusers is - ", JSON.stringify(filter));
  try {
    const count = await mongodb.db.collection('tourUsers').countDocuments(filter);
    console.log("users are ", count);
    return count;
  } catch (err) {
    console.log("err ", err);
    throw err;
  }
};

export const createTournamentUsers = async (data: any): Promise<any> => {
  try {
    const result = await mongodb.db.collection('tournamentusers').insertOne(data);
    return result.ops[0];
  } catch (err) {
    throw err;
  }
};

export const findTournamentUser = async (filter: any): Promise<any[]> => {
  console.log("in findTournamentUser filter is ", filter);
  try {
    const result = await mongodb.db.collection('tourUsers').find(filter).toArray();
    console.log("result in findTournamentUser ", JSON.stringify(result));
    return result;
  } catch (err) {
    throw err;
  }
};

export const findActiveTournamentUser = async (filter: any): Promise<any[]> => {
  console.log("in findActiveTournamentUser filter is ", filter);
  try {
    const result = await mongodb.db.collection('tournamentusers').find(
      filter, 
      { projection: { 'isActive': 1 } }
    ).toArray();
    console.log("result in findActiveTournamentUser ", JSON.stringify(result));
    return result;
  } catch (err) {
    throw err;
  }
};

export const updateTournamentUser = async (query: any, data: any): Promise<any> => {
  try {
    const result = await mongodb.db.collection('tournamentusers').updateOne(
      query, 
      { $set: data }
    );
    console.log("result -----");
    console.log(result);
    return result;
  } catch (err) {
    throw err;
  }
};

export const updateMultipleTournamentUser = async (query: any, data: any): Promise<any> => {
  try {
    const result = await mongodb.db.collection('tourUsers').updateMany(
      query, 
      { $set: data }
    );
    return result;
  } catch (err) {
    throw err;
  }
};

export const upsertTournamentUser = async (query: any, data: any): Promise<any> => {
  try {
    const result = await mongodb.db.collection('tournamentusers').updateOne(
      query, 
      { $set: data }, 
      { upsert: true }
    );
    return result;
  } catch (err) {
    throw err;
  }
};

export const deleteTournamentUser = async (query: any): Promise<any> => {
  try {
    const result = await mongodb.db.collection('tournamentusers').deleteMany(query);
    console.log("response in deleted tournamentusers ", result);
    return result;
  } catch (err) {
    throw err;
  }
};

// Tournament ranks
export const insertRanks = async (data: any): Promise<any> => {
  console.trace("inside insertng ranks", data);
  try {
    const result = await mongodb.db.collection('tournamentRanks').insertOne(data);
    return result;
  } catch (err) {
    throw err;
  }
};

export const getTournamentRanks = async (params: any): Promise<any[]> => {
  try {
    const result = await mongodb.db.collection('tournamentRanks').find(params).toArray();
    return result;
  } catch (err) {
    throw err;
  }
};

export const findTournamentRanks = async (params: any): Promise<any[]> => {
  try {
    const result = await mongodb.db.collection('tournamentRanks').find(params)
      .sort({ createdAt: 1 })
      .toArray();
    return result;
  } catch (err) {
    throw err;
  }
};

export const updateTournamentRanks = async (filter: any): Promise<any> => {
  console.trace("inside updateTournamentRanks ranks", filter);
  try {
    const result = await mongodb.db.collection('tournamentRanks').updateOne(
      filter, 
      { $set: { isCollected: true } }
    );
    return result;
  } catch (err) {
    throw err;
  }
};

export const modifyTournamentRanks = async (filter: any, updatedValue: any): Promise<any> => {
  console.trace("inside modifyTournamentRanks ranks", filter, updatedValue);
  try {
    const result = await mongodb.db.collection('tournamentRanks').updateOne(
      filter, 
      { $set: updatedValue }
    );
    return result;
  } catch (err) {
    throw err;
  }
};

export const InsertInPrize = async (data: any): Promise<any> => {
  try {
    const result = await mongodb.db.collection("prizes").insertOne(data);
    return result.ops[0];
  } catch (err) {
    throw err;
  }
};

// Video log
export const insertVideoLog = async (channelId: string, roundId: string, logData: any): Promise<any> => {
  channelId = channelId.split("-")[0];
  const data = {
    channelId,
    roundId,
    logData,
    createdAt: new Date().getTime()
  };
  
  try {
    const result = await mongodb.db.collection("videoLog").insertOne(data);
    return result;
  } catch (err) {
    throw err;
  }
};

// Spam words
export const findAllSpamWords = async (): Promise<any[]> => {
  try {
    const result = await mongodb.db.collection('spamWords').find({}).toArray();
    return result;
  } catch (err) {
    throw err;
  }
};

// Tournament rebuy
export const updateRebuy = async (query: any, updatedData: any): Promise<any> => {
  console.log(stateOfX.serverLogType.info, "query and updated data are in updateRebuy1- " + JSON.stringify(query) + JSON.stringify(updatedData));
  try {
    const result = await mongodb.db.collection('tourRebuy').updateOne(
      query, 
      updatedData, 
      { upsert: true }
    );
    return result;
  } catch (err) {
    throw err;
  }
};

export const deleteRebuy = async (query: any): Promise<any> => {
  console.log(stateOfX.serverLogType.info, "query in deleteRebuy- ", query);
  try {
    const result = await mongodb.db.collection('tourRebuy').deleteMany(query);
    return result;
  } catch (err) {
    throw err;
  }
};

export const updateRebuyWithoutInsert = async (query: any, updatedData: any): Promise<any> => {
  console.log(stateOfX.serverLogType.info, "query and updated data are in updateRebuy2- " + JSON.stringify(query) + JSON.stringify(updatedData));
  try {
    const result = await mongodb.db.collection('tourRebuy').updateOne(
      query, 
      { $set: updatedData }
    );
    return result;
  } catch (err) {
    throw err;
  }
};

export const countRebuyOpt = async (query: any): Promise<any> => {
  serverLog(stateOfX.serverLogType.info, "query is in countRebuyOpt - " + JSON.stringify(query));
  try {
    const result = await mongodb.db.collection('tourRebuy').findOne(query);
    serverLog(stateOfX.serverLogType.info, 'tourRebuy count in db is - ' + JSON.stringify(result));
    return result;
  } catch (err) {
    throw err;
  }
};

export const findAllRebuy = async (query: any): Promise<any[]> => {
  serverLog(stateOfX.serverLogType.info, "query is in findAllRebuy - " + JSON.stringify(query));
  try {
    const result = await mongodb.db.collection('tourRebuy').find(query).toArray();
    serverLog(stateOfX.serverLogType.info, 'tourRebuy result in db is - ' + JSON.stringify(result));
    return result;
  } catch (err) {
    throw err;
  }
};

// Anti-banking
export const insertAntiBanking = async (data: any): Promise<any> => {
  try {
    const result = await mongodb.db.collection('antibanking').insertOne(data);
    return result;
  } catch (err) {
    throw err;
  }
};

export const updateAntiBanking = async (data: any, update: any): Promise<any> => {
  try {
    const result = await mongodb.db.collection('antibanking').updateOne(
      { playerId: data.playerId, channelId: data.channelId }, 
      { $set: update }
    );
    return result;
  } catch (err) {
    throw err;
  }
};

export const removeAntiBankingEntry = async (query: any): Promise<any> => {
  try {
    const result = await mongodb.db.collection('antibanking').deleteOne(query);
    return result;
  } catch (err) {
    throw err;
  }
};

export const getAntiBanking = async (query: any): Promise<any> => {
  try {
    const result = await mongodb.db.collection('antibanking').findOne(query);
    return result;
  } catch (err) {
    throw err;
  }
};

export const getTableAntiBanking = async (filter: any): Promise<any[]> => {
  try {
    const result = await mongodb.db.collection('antibanking').find(filter)
      .sort({ "createdAt": -1 })
      .limit(2)
      .toArray();
    return result;
  } catch (err) {
    throw err;
  }
};

export const getAllAntiBanking = async (channelId: string, existingPlayers: string[]): Promise<any[]> => {
  const query = {
    channelId,
    playerId: { "$nin": existingPlayers }
  };
  
  try {
    const result = await mongodb.db.collection('antibanking').aggregate([
      {
        $match: query
      }, 
      {
        $lookup: {
          from: "users",
          localField: "playerId",
          foreignField: "playerId",
          as: "userdetails"
        }
      }, 
      {
        $project: {
          _id: 0,
          playerId: 1,
          amount: 1,
          stack: 1,
          channelId: 1,
          userdetails: 1,
          createdAt: 1
        }
      }
    ]).toArray();
    
    return result;
  } catch (err) {
    throw err;
  }
};

// Player count
export const getPlayersCount = async (query: any): Promise<number> => {
  console.log("inside get getPlayersCount,,, ", query);
  const newQuery: any = {};
  
  if (query.userName) newQuery.isParentUserName = query.userName;
  if (query.userId) newQuery.userName = new RegExp('^' + query.userId, 'i');
  if (query.mobileNumber) newQuery.mobileNumber = new RegExp('^' + query.mobileNumber, 'i');
  if (query.emailId) newQuery.emailId = new RegExp('^' + query.emailId, 'i');
  if (query.firstName) newQuery.firstName = new RegExp('^' + query.firstName, 'i');
  if (query.lastName) newQuery.lastName = new RegExp('^' + query.lastName, 'i');
  
  newQuery.isOrganic = query.isOrganic;
  if (newQuery.isOrganic == 'All') delete newQuery.isOrganic;
  
  if (query.startDate && query.endDate) {
    newQuery.createdAt = { $gte: query.startDate, $lte: query.endDate };
  }
  
  console.log("newQuery  ", newQuery);
  
  try {
    const count = await mongodb.db.collection('users').countDocuments(newQuery);
    console.log(" count of number of players.... ", JSON.stringify(count));
    return count;
  } catch (err) {
    throw err;
  }
};

export const updatePlayer = async (id: string, userData: any): Promise<any> => {
  console.log("Inside update player dbQuery ---", id);
  try {
    const result = await mongodb.db.collection('users').updateOne(
      { _id: new ObjectId(id) }, 
      { $set: userData }
    );
    return result;
  } catch (err) {
    throw err;
  }
};

// Scheduled expiry
export const createExpirySlot = async (data: any): Promise<any> => {
  console.log("createExpirySlot data " + JSON.stringify(data));
  try {
    const result = await mongodb.db.collection('scheduledExpiry').insertOne(data);
    return result;
  } catch (err) {
    throw err;
  }
};

export const updateExpirySlot = async (query: any, update: any): Promise<any> => {
  console.log("updateExpirySlot data " + JSON.stringify(query) + JSON.stringify(update));
  try {
    const result = await mongodb.db.collection('scheduledExpiry').updateOne(query, update);
    return result;
  } catch (err) {
    throw err;
  }
};

export const upsertExpirySlot = async (query: any, update: any): Promise<any> => {
  console.log("upsertExpirySlot data " + JSON.stringify(query) + JSON.stringify(update));
  try {
    const result = await mongodb.db.collection('scheduledExpiry').updateOne(
      query, 
      update, 
      { upsert: true }
    );
    return result;
  } catch (err) {
    throw err;
  }
};

export const findExpirySlots = async (query: any): Promise<any[]> => {
  console.log("findExpirySlot data " + JSON.stringify(query));
  try {
    const result = await mongodb.db.collection('scheduledExpiry').find(query).toArray();
    return result;
  } catch (err) {
    throw err;
  }
};

// User session
export const findUserSessionInDB = async (params: string): Promise<any> => {
  try {
    const result = await mongodb.db.collection('userSession').findOne({ playerId: params });
    return result;
  } catch (err) {
    throw err;
  }
};

export const findUserSessionCountInDB = async (params: any): Promise<number> => {
  try {
    const count = await mongodb.db.collection('userSession').countDocuments(params);
    return count;
  } catch (err) {
    throw err;
  }
};

export const removeUserSessionFromDB = async (params: string): Promise<any> => {
  console.log("module.exports.removeUserSessionFromDB", params);
  try {
    const result = await mongodb.db.collection('userSession').deleteOne({ playerId: params });
    console.log("removed ", result);
    return result;
  } catch (err) {
    throw err;
  }
};

export const findPlayerWithId = async (filter: any): Promise<any> => {
  console.log("Inside findPlayerWithId dbQuery");
  try {
    const result = await mongodb.db.collection('users').findOne(filter);
    return result;
  } catch (err) {
    throw err;
  }
};

// Bank details
export const saveBankDetailsuser = async (filter: any, details: any): Promise<any> => {
  try {
    const result = await mongodb.db.collection('palyerBankDetails').updateOne(
      filter, 
      { $set: details }, 
      { upsert: true }
    );
    console.log(filter, details, "@#@#@#@#@#@#@#@#@#@#@#@#@", result);
    return result;
  } catch (err) {
    throw err;
  }
};

export const findBankDetailsuser = async (filter: any): Promise<any[]> => {
  try {
    const result = await mongodb.db.collection('palyerBankDetails').find(filter).toArray();
    return result;
  } catch (err) {
    throw err;
  }
};

export const getBankDetailsuser = async (filter: any): Promise<any> => {
  try {
    const result = await mongodb.db.collection('palyerBankDetails').findOne(filter);
    console.log(filter, "@#@#@#@#@#@#@#@#@#@#@#@#@", result);
    return result;
  } catch (err) {
    throw err;
  }
};

// Schedule tasks
export const updateScheduleTask = async (query: any, update: any): Promise<any> => {
  try {
    const result = await mongodb.db.collection('scheduleTasks').updateOne(query, update);
    return result;
  } catch (err) {
    throw err;
  }
};

export const addScheduleTask = async (query: any): Promise<any> => {
  if (query.type == 'serverDown' || query.type == 'serverUp') {
    try {
      const result = await mongodb.db.collection('scheduleTasks').find({ 
        type: query.type, 
        status: 'PENDING' 
      }).toArray();
      
      if (result && result.length <= 0) {
        const insertResult = await mongodb.db.collection('scheduleTasks').insertOne(query);
        return insertResult;
      } else {
        if (result && result.length >= 1) {
          throw new Error("Already scheduled such task. Cancel that first.");
        }
      }
    } catch (err) {
      throw err;
    }
  } else {
    throw new Error("undefined type");
  }
};

export const findScheduleTask = async (query: any): Promise<any> => {
  try {
    const result = await mongodb.db.collection('scheduleTasks').findOne(query);
    return result;
  } catch (err) {
    throw err;
  }
};

export const findMultipleScheduleTasks = async (query: any): Promise<any[]> => {
  const skip = query.skip;
  const limit = query.limit;
  delete query.skip;
  delete query.limit;

  try {
    const result = await mongodb.db.collection('scheduleTasks').find(query)
      .skip(skip || 0)
      .limit(limit || 0)
      .sort({ '_id': -1 })
      .toArray();
    return result;
  } catch (err) {
    throw err;
  }
};

// User stats
export const insertUserStats = async (query: any, userData: any): Promise<any> => {
  try {
    const result = await mongodb.db.collection('userStats').updateOne(
      query, 
      { $set: userData }, 
      { upsert: true }
    );
    return result;
  } catch (err) {
    throw err;
  }
};

export const getPlayerAllHandCount = async (channelVariation: string, isRealMoney: boolean, playerId: string): Promise<number> => {
  try {
    const count = await mongodb.db.collection('userStats').countDocuments({ 
      "gameVariation": channelVariation, 
      "isRealMoney": isRealMoney, 
      "playerId": playerId 
    });
    return count;
  } catch (err) {
    throw err;
  }
};

export const getVVIPPanelData = async (channelVariation: string, isRealMoney: boolean, playerId: string, queryTypes: string[]): Promise<any[]> => {
  const aggregationPipeline: any[] = [
    {
      $match: {
        "gameVariation": channelVariation,
        "isRealMoney": isRealMoney,
        "playerId": playerId,
      }
    },
    {
      $group: {
        _id: null
      }
    },
    {
      $project: {
        _id: 0
      }
    }
  ];

  queryTypes.forEach(function (queryType) {
    aggregationPipeline[1].$group[queryType] = {
      $sum: { $cond: [{ $ifNull: [`$${queryType}`, false] }, 1, 0] }
    };
    aggregationPipeline[2].$project[queryType] = `$${queryType}`;
  });

  try {
    const results = await mongodb.db.collection('userStats').aggregate(aggregationPipeline).toArray();
    return results;
  } catch (err) {
    throw err;
  }
};

// Topup
export const saveTopUp = async (data: any): Promise<any> => {
  try {
    const result = await mongodb.db.collection('userTopup').insertOne(data);
    return result;
  } catch (err) {
    throw err;
  }
};

export const getTopupSum = async (query: any): Promise<any[]> => {
  try {
    const result = await mongodb.db.collection('userTopup').aggregate([
      {
        $match: {
          userName: query.userName,
          type: query.type,
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" }
        }
      }
    ]).toArray();
    return result;
  } catch (err) {
    throw err;
  }
};

// Player sessions
export const insertPlayerSession = async (query: any): Promise<any> => {
  try {
    const result = await mongodb.db.collection('playerSessions').insertOne(query);
    return result;
  } catch (err) {
    throw err;
  }
};

export const updatePlayerSession = async (query: any, params: any): Promise<any> => {
  try {
    const result = await mongodb.db.collection('playerSessions').updateOne(
      query, 
      { $set: params }
    );
    return result;
  } catch (err) {
    throw err;
  }
};

export const updatePlayerById = async (query: any, update: any): Promise<any> => {
  try {
    const result = await mongodb.db.collection('users').updateOne(
      { playerId: query.playerId }, 
      { $set: update }
    );
    return result;
  } catch (err) {
    throw err;
  }
};

// Spin wheel
export const insertSpinWheelData = async (playerInfo: any): Promise<any> => {
  try {
    const result = await mongodb.db.collection('spinTheWheel').insertOne(playerInfo);
    return result;
  } catch (err) {
    throw err;
  }
};

// Call timer
export const callTimer = async (params: any): Promise<any> => {
  try {
    const result = await mongodb.db.collection('callTimerData').insertOne(params);
    return result;
  } catch (err) {
    throw err;
  }
};

// Player avatar
export const getPlayerAvatar = async (query: any): Promise<any> => {
  try {
    const result = await mongodb.db.collection('users').findOne(
      query, 
      { projection: { playerId: 1, userName: 1, profileImage: 1 } }
    );
    return result;
  } catch (err) {
    throw err;
  }
};
}
