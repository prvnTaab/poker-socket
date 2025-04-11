import { Injectable } from "@nestjs/common";
import async from 'async';
import lodash from 'lodash';
import { stateOfX } from "shared/common";
import { PokerDatebaseService } from "shared/common/datebase/pokerdatebase.service";


@Injectable()
export class UserRemoteService {
    
    constructor(private db: PokerDatebaseService){

    }


// update player win, lose stats
async updateStats (data: any) {
    const query = this.getPlayerIdsQuery(data);
    const updateData = data.data; // verify keys
    
    if (!query) {
        return { success: false, info: 'Invalid query' };
    }

    try {
        const res = await this.db.increaseUserStats(query, updateData);
        return { success: true, result: res };
    } catch (err) {
        return { success: false, info: err };
    }
};

// some tasks done after user first time created
// register| inorganic player creation
 async afterUserCreated (userData: any) {
    const data = {
        playerId: userData.playerId,
        createdAt: userData.createdAt,
        level: userData.statistics.megaPointLevel
    };
    const megaPointsManager = require('./megaPointsManager');
    megaPointsManager.createFirstExpirySlot(data);
};

// CASHIER API - get chips related details for a player
 async getCashDetails (data: any) {
    const megaPointsManager = require('./megaPointsManager');

    try {
        const user = await this.db.findUser({ playerId: data.playerId });
        if (!user) {
            return { success: false, info: 'No record found!' };
        }

        const panCard = await this.checkPANCardStatus(data.playerId);
        let bankDetails;
        try {
            bankDetails = await this.getBankDetails(data.playerId);
        } catch (err) {
            bankDetails = null;
        }

        const query = {
            player: data.playerId,
            userData: user,
            loyaltyPoints: user.loyaltyPoint ? user.loyaltyPoint : 0,
            userRank: user.userRank ? user.userRank : 0
        };

        const lpdata = await this.currentLoyaltyPoint(query);
        
        const result = {
            userName: user.userName,
            emailId: user.emailId,
            realChips: user.realChips,
            inGameRealChips: 0,
            totalRealChips: user.realChips,
            lockedCashout: user.lockedCashout ? user.lockedCashout : 0,
            tourChips: 0,
            inGAmeTourChips: 0,
            totalTourChips: 0,
            freeChips: user.freeChips,
            inGameFreeChips: 0,
            totalFreeChips: user.freeChips,
            megaPoints: parseInt(user.statistics.megaPoints || 0),
            megaPointLevel: user.statistics.megaPointLevel || 'Bronze',
            totalMegaChipsClaimed: user.statistics.megaChipsGainedTotal || 0,
            percentOfLevel: 0,
            realChipBonus: user.realChipBonus,
            unClaimedChipBonus: user.totalClaimedUcb ? (user.unClaimedChipBonus + user.totalClaimedUcb) : user.unClaimedChipBonus,
            totalBalance: (user.realChips + user.realChipBonus),
            panCardStatus: panCard.panCardStatus,
            loyaltyPointLevel: lpdata.userRank ? lpdata.userRank : "Bronze",
            loyaltyPoints: lpdata.newLp ? lpdata.newLp : 0,
            ucbAfter: user.unClaimedChipBonus ? user.unClaimedChipBonus : user.unClaimedChipBonus,
            ucbBefore: user.totalClaimedUcb ? (user.unClaimedChipBonus + user.totalClaimedUcb) : user.unClaimedChipBonus,
            bankDetails: bankDetails
        };

        const response = await megaPointsManager.getPercentOfLevel({ points: user.statistics.megaPoints });
        if (response) {
            result.percentOfLevel = response.percentOfLevel;
            result.megaPointLevel = response.megaPointLevel;
        }

        return { success: true, result: result };
    } catch (err) {
        return { success: false, info: 'No record found!' };
    }
};

// CASHIER API - get chips related details for a player
 async getUCBDetails (data: any) {
    try {
        const user = await this.db.findUser({ playerId: data.playerId });
        if (!user) {
            return { success: false, info: 'No record found!' };
        }

        const userBonus = await this.BonusData({ player: data.playerId });
        return {
            success: true,
            result: {
                BonusData: userBonus,
                unClaimedChipBonus: user.totalClaimedUcb ? (user.unClaimedChipBonus + user.totalClaimedUcb) : user.unClaimedChipBonus,
            }
        };
    } catch (err) {
        return { success: false, info: 'No record found!' };
    }
};

// CASHIER API - get chips related details for a player
 async getRakeBackDetails (data: any) {
    try {
        const user = await this.db.findUser({ playerId: data.playerId });
        if (!user) {
            return { success: false, info: 'No record found!' };
        }

        let transactions, transactionsInorganic, dailyRakeGeneratedByUser, dailyRakeGeneratedByOrganicPlayer;
        
   
            transactions = await this.lastTenTransactions(data.playerId);
            if (!transactions) transactions = null;
            transactions.forEach((eachTransactions: any) => {
                eachTransactions.loyaltyLevel = eachTransactions.loyaltyLevelBefore;
            });
       

            transactionsInorganic = await this.lastTenTransactionsInorganicPlayer(data.playerId);
            if (!transactionsInorganic) transactionsInorganic = null;
            transactionsInorganic.forEach((eachTransactionsInorganic: any) => {
                eachTransactionsInorganic.currentDateTime = eachTransactionsInorganic.createdAt;
                eachTransactionsInorganic.loyaltyLevel = "Bronze";
                eachTransactionsInorganic.rakebackAmount = eachTransactionsInorganic.playerRakeBack;
                eachTransactionsInorganic.rakeBackPrecentage = eachTransactionsInorganic.rakeBack;
            });
    

   
            dailyRakeGeneratedByUser = await this.dailyRakeGenerated(data.playerId);
            if (!dailyRakeGeneratedByUser) dailyRakeGeneratedByUser = null;
            let totalRackTillNow = 0;
            dailyRakeGeneratedByUser.forEach((eachData: any) => {
                if (eachData.playerRakeBack) {
                    totalRackTillNow += eachData.playerRakeBack;
                }
            });


            dailyRakeGeneratedByOrganicPlayer = await this.dailyRakeGeneratedOrganicPlayer(data.playerId);
            if (!dailyRakeGeneratedByOrganicPlayer) dailyRakeGeneratedByOrganicPlayer = null;
            let totalRackTillNowOrganicPlayer = 0;
            let rakebackAmount = 0;

            dailyRakeGeneratedByOrganicPlayer.forEach((eachData: any) => {
                if (eachData.amount > 0) {
                    totalRackTillNowOrganicPlayer += eachData.amountGST;
                }
            });

            if (user.userRank === "Chrome") {
                rakebackAmount = Math.floor(totalRackTillNowOrganicPlayer / 10);
            } else if (user.userRank === "Silver") {
                rakebackAmount += Math.floor(totalRackTillNowOrganicPlayer / 5);
            } else if (user.userRank === "Gold") {
                rakebackAmount += Math.floor(totalRackTillNowOrganicPlayer * 0.3);
            } else if (user.userRank === "Platinum") {
                rakebackAmount += Math.floor(totalRackTillNowOrganicPlayer / 2.5);
            } else if (user.userRank === "Titanium") {
                rakebackAmount += Math.floor(totalRackTillNowOrganicPlayer / 2);
            }
        

        return {
            success: true,
            result: {
                rbPending: user.isOrganic ? rakebackAmount : totalRackTillNow,
                loyaltyPointData: user.isOrganic ? transactions : transactionsInorganic,
            }
        };
    } catch (err) {
        return { success: false, info: 'No record found!' };
    }
};

// CASHIER API - get chips related details for a player
 async getRabbitDetails (data: any) {
    try {
        const rabbitdata = await this.rabbitData({ player: data.playerId });
        return { success: true, result: { rabbit: rabbitdata } };
    } catch (err) {
        return { success: false, info: err };
    }
};

// --------- local functions are down this line -----------

// prepare a query for one or more players
async getPlayerIdsQuery(obj: any) {
    if (obj.playerIds instanceof Array) {
        if (obj.playerIds.length <= 0) {
            return false;
        }
        return { playerId: { $in: obj.playerIds } };
    }
    if (!obj.playerId) {
        return false;
    }
    return { playerId: obj.playerId };
}

// sum of player bonus amount
async totalBonuses(arr: any[]) {
    let u = 0, c = 0;
    if (!(arr instanceof Array)) {
        return [u, c];
    }
    arr.forEach((item: any) => {
        u += item.unClaimedBonus || 0;
        c += item.claimedBonus || 0;
    });
    return [u, c];
}

 async checkPANCardStatus (playerId: string) {
    try {
        const response :any = await this.pendingPANCheck(playerId);
        if (response.length == 0) {
            const result = await this.verifiedPANCheck(playerId);
            return result;
        } else {
            response.panCardStatus = "PAN Card Approval Pending";
            return response;
        }
    } catch (err) {
        throw err;
    }
};

// last 20 cron transaction >> loyaltyPoint
async lastTenTransactions (playerId: string) {
    try {
        return await this.db.findLastTenUcbToRcTransaction(playerId);
    } catch (err) {
        throw err;
    }
};

// last 20 cron transaction >> In-Organic Player (dashboard % set) 
async lastTenTransactionsInorganicPlayer (playerId: string) {
    try {
        return await this.db.findLastTenTransactionInorganic(playerId);
    } catch (err) {
        throw err;
    }
};

// total addOn of dailyRake generated by a player >> In-Organic Player (dashboard % set) // PENDING
 async dailyRakeGenerated (playerId: string) {
    try {
        return await this.db.rakeGeneratedByInOrganicPlayer(playerId);
    } catch (err) {
        throw err;
    }
};

// total addOn of dailyRake generated by a player >> based on last success cron
 async dailyRakeGeneratedOrganicPlayer (playerId: string) {
    try {
        const result = await this.db.lastSuccessCron();
        if (!result[0]) {
            return [];
        }
        const data = {
            playerID: playerId,
            date: result[0].endDate
        };
        return await this.db.findLastRakeGeneratedByUser(data);
    } catch (err) {
        throw err;
    }
};

async rabbitData (data: any) {
    try {
        return await this.db.searchRabbitData({ playerId: data.player });
    } catch (err) {
        return [];
    }
};

async BonusData (data: any) {
    try {
        return await this.db.searchBonusData({ playerId: data.player });
    } catch (err) {
        return [];
    }
};

 async currentLoyaltyPoint (data: any) {
    if (data.userData.isOrganic) {
        try {
            const result = await this.db.lastSuccessCron();
            let startDate = result[0] ? result[0].endDate : Number(new Date());
            
            const query = {
                playerId: data.player,
                startingDate: startDate,
                endDate: Number(new Date())
            };
            
            const fundResult = await this.db.fundtotal(query);
            
            const tempData: any = {
                newLp: data.loyaltyPoints,
                userRank: data.userRank
            };
            
            if (fundResult.length) {
                tempData.newLp = data.loyaltyPoints + Math.floor(fundResult[0].rakeContributed / 20);
                
                if (tempData.newLp >= 0 && tempData.newLp < 250) tempData.userRank = "Bronze";
                if (tempData.newLp >= 250 && tempData.newLp < 1000) tempData.userRank = "Chrome";
                if (tempData.newLp >= 1000 && tempData.newLp < 5000) tempData.userRank = "Silver";
                if (tempData.newLp >= 5000 && tempData.newLp < 20000) tempData.userRank = "Gold";
                if (tempData.newLp >= 20000 && tempData.newLp < 50000) tempData.userRank = "Platinum";
                if (tempData.newLp >= 50000) tempData.userRank = "Titanium";
            }
            
            return tempData;
        } catch (err) {
            return {
                newLp: data.loyaltyPoints,
                userRank: data.userRank
            };
        }
    } else {
        return {
            newLp: 0,
            userRank: "Bronze"
        };
    }
};

async pendingPANCheck (playerId: string) {
    try {
        return await this.db.findUserPanCard(playerId);
    } catch (err) {
        throw err;
    }
};

async verifiedPANCheck (playerId: string) {
    try {
        const result :any = await this.db.findUserPanCardStatus(playerId);
        if (result.length > 0) {
            if ('reasonOfRejection' in result[0]) {
                result.panCardStatus = "PAN Card Rejected";
            } else {
                result.panCardStatus = "PAN Card Verified";
            }
        } else {
            result.panCardStatus = null;
        }
        return result;
    } catch (err) {
        throw err;
    }
};

async getBankDetails (playerId: string) {
    try {
        return await this.db.getBankDetailsuser({ playerId: playerId });
    } catch (err) {
        throw err;
    }
};

    
}