import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { UtilsService } from 'apps/game/src/utils/utils.service';
import { Connection } from 'mongoose';
import { configData } from 'shared/common/utils/config/config.service';
import { PokerDatabaseService } from 'shared/common/utils/pokerdatabase.service';
// const pomelo_client = require('pomelo-node-client-websocket');
// const pomelo = pomelo_client.create();

// const pomeloConnection = async () => {
//     try {
//         setTimeout(() => {
//             pomelo.init({
//                 host: configData.rootTools.connectorHost,
//                 port: configData.rootTools.connectorPort,
//             });
//         }, 7 * 1000)
//     } catch (e) {
//         pomeloConnection()
//     }
// }
// pomeloConnection()

declare const pomelo:any;

@Injectable()
export class WalletService {
    constructor(
        private readonly pokerDbConnection: PokerDatabaseService,
        private utilsService: UtilsService
    ) { }

    async walletProcess(params: any) {
        try {
            console.log("got one request for ", params.action, " data got in the request is:", params)
            if (!params.data.hasOwnProperty('isRealMoney')) {
                return { channelId: params.data.channelId ?? '', success: false, info: 'Please Specify the points Type' }
            }
            let query = { playerId: params.data.playerId };
            if (params.data.filter) { query = params.data.filter }
            let fetchedUser = await this.fetchUser(query);
            if (!fetchedUser.success) { return fetchedUser; }
            params.user = fetchedUser.data;
            params.data.chips = params.data.chips ? params.data.chips : params.data.amount;
            switch (params.action) {
                //WDP +
                case 'stoodUp':
                case 'revert':
                case 'onlineTransfer':
                case 'signUp':
                case 'tourUnRegistration':
                case 'tourCancel':
                case 'cashoutRejectRC':
                case 'pushRc':
                case 'pushRcb':
                case 'rakeBack':
                case 'loyaltyPoint':
                case 'ucbRelease':
                case 'bounty':
                case 'tourWin':
                    return await this.addCoinOne(params) //add into deposit win promo

                // WDP - 
                case 'chipsTaken':
                case 'addOn':
                case 'rabbit':
                case 'subscription':
                case 'tourRegistration':
                case 'reBuy':
                    return await this.deductCoinOne({ params: params, term: 'WDP' }) //deduct from deposit win promo
                case 'topUp':
                    return await this.deductTopUp({ params: params, term: 'WDP' }) //deduct from deposit win promo

                //WD -
                case 'pullRc':
                case 'cashoutRc':
                    return await this.deductCoinOne({ params: params, term: 'WD' }) //deduct from deposit win

                //P -
                case 'pullRcb':
                    return await this.deductCoinOne({ params: params, term: 'P' }) //deduct from deposit win

                default:
                    return { success: false, channelId: params.data.channelId ?? '', info: 'event not listed yet' }
            }
        } catch (error) {
            return { success: false, channelId: params.data.channelId ?? '', info: error.message };
        }
    }

    async addCoinOne(params: any) {
        let coinTypeSelection = params.data.isRealMoney ? 1 : 2;
        if ((params.action == "tourUnRegistration" || params.action == "tourCancel" || params.action == "tourWin" || params.action == "bounty") && !params.user.isOrganic) {
            coinTypeSelection = 4;
        }
        let coinTypeOne = params.user.points.find(({ coinType }) => coinType === coinTypeSelection);
        if (!coinTypeOne) {
            return { success: false, channelId: params.data.channelId ?? '', info: 'You have insufficient points in your account. Please update your points balance.' };
        }
        if (!params.data.points) {
            console.log('===============points not found in the request===========', params.action)
            return { success: false, channelId: params.data.channelId ?? '', info: 'points not found in the request' }
        } else {
            if (params.action == "ucbRelease") {
                this.updateQuery(params, {
                    coinType: 3,
                    win: 0,
                    deposit: 0,
                    promo: params.data.unClaimedChipBonus,
                    totalBalance: params.data.unClaimedChipBonus
                })
            }
            if (params.data.chips) {
                if ((params.action == 'onlineTransfer' || params.action == 'signUp') && params.data.locked) {
                    let generalCoinType = params.user.points.find(({ coinType }) => coinType === 3);
                    generalCoinType.promo += params.data.locked;
                    generalCoinType.totalBalance += params.data.locked
                    this.updateQuery(params, generalCoinType)
                }
                let remainingCoin = params.data.chips; //20000
                // console.log("points 1> ", remainingCoin)

                if (remainingCoin <= params.data.points.promo) {
                    coinTypeOne.promo += remainingCoin;
                    remainingCoin = 0;
                    // console.log("points 2> ", remainingCoin, coinTypeOne)

                } else {
                    coinTypeOne.promo += params.data.points.promo;
                    remainingCoin -= params.data.points.promo;//17700
                    // console.log("points 3> ", remainingCoin, coinTypeOne)

                    if (remainingCoin <= params.data.points.deposit) {
                        coinTypeOne.deposit += remainingCoin;
                        remainingCoin = 0;
                        // console.log("points 4> ", remainingCoin, coinTypeOne)

                    } else {
                        // console.log("points 5> ", remainingCoin, coinTypeOne)

                        coinTypeOne.deposit += params.data.points.deposit; //+5100
                        remainingCoin -= params.data.points.deposit;
                        // console.log("points 6> ", remainingCoin, coinTypeOne)

                    }
                    coinTypeOne.win += remainingCoin;
                    coinTypeOne.totalBalance = coinTypeOne.deposit + coinTypeOne.promo + coinTypeOne.win;
                    // console.log("points 7> ", remainingCoin, coinTypeOne)

                }
                this.updateQuery(params, coinTypeOne)
                return { success: true, info: 'chips updated successfully....!', channelId: params.data.channelId ?? '' }
            } else {
                return { success: false, channelId: params.data.channelId ?? '', info: `chips value is ${params.data.chips} ` }
            }
        }

    }
    async deductTopUp(data: any) {
        let value: any = await this.deductCoinOne(data)
        if (data.params.action === 'topUp' && value.success) {
            let tempPoints = value.points;
            value.points = {
                coinType: tempPoints.coinType,
                deposit: tempPoints.deposit + data.params.data.points.deposit,
                win: tempPoints.win + data.params.data.points.win,
                promo: tempPoints.promo + data.params.data.points.promo,
                totalBalance: tempPoints.totalBalance + data.params.data.points.totalBalance
            }
            return value;
        }
        else {
            return value;
        }
    }

    async deductCoinOne(data: any) {
        // console.log("Got one request to deductWDP", data.params.action, data.params.data)
        let term = data.term;
        let params = data.params;
        params.type = "deduct"
        let coinTypeSelection = params.data.isRealMoney ? 1 : 2;
        if ((params.action == "tourRegistration" || params.action == "addOn" || params.action == "reBuy") && !params.user.isOrganic) {
            coinTypeSelection = 4;
        }
        let coinTypeOne = params.user.points.find(({ coinType }) => coinType === coinTypeSelection);
        let coinTypeTwo = params.user.points.find(({ coinType }) => coinType === 2);
        if (!coinTypeOne) {
            return { success: false, channelId: params.data.channelId ?? '', info: 'You have insufficient points in your account. Please update your points balance.' };
        }
        if (coinTypeSelection == 1 && !params.user.isKYCVerified && term === 'WDP') {
            term = 'WD';
        }
        if (coinTypeSelection == 2 && term === 'WD') {
            term = 'WDP';
        }
        if (term === 'WDP' && coinTypeOne.totalBalance >= params.data.chips) {
            let deductedDeposit = 0, deductedWin = 0, deductedPromo = 0;
            if (coinTypeOne.win >= params.data.chips) {
                deductedWin = params.data.chips;
                coinTypeOne.win -= deductedWin;
            } else {
                deductedWin = coinTypeOne.win || 0;
                coinTypeOne.win = 0;

                const remainingChipsToDeduct = params.data.chips - deductedWin;
                if (coinTypeOne.deposit >= remainingChipsToDeduct) {
                    deductedDeposit = remainingChipsToDeduct;
                    coinTypeOne.deposit -= deductedDeposit;
                } else {
                    deductedDeposit = coinTypeOne.deposit || 0;
                    coinTypeOne.deposit = 0;
                    deductedPromo = remainingChipsToDeduct - deductedDeposit;
                    coinTypeOne.promo -= deductedPromo;
                }
            }

            coinTypeOne.totalBalance -= params.data.chips;
            this.updateQuery(params, coinTypeOne);
            return {
                success: true,
                user: params.user,
                points: {
                    coinType: coinTypeSelection,
                    deposit: deductedDeposit,
                    win: deductedWin,
                    promo: deductedPromo,
                    totalBalance: deductedDeposit + deductedWin + deductedPromo
                },
                userPoints: coinTypeOne,
                currentPoints: {
                    rc: coinTypeOne.win + coinTypeOne.deposit + deductedDeposit,
                    rcb: coinTypeOne.promo + deductedPromo,
                    freeChips: coinTypeTwo.totalBalance
                },
                data: {
                    detectChipsFromRC: deductedDeposit + deductedWin,
                    realChipBonusDetected: deductedPromo,
                    totalBalance: coinTypeOne.win + coinTypeOne.deposit + deductedDeposit + coinTypeOne.promo + deductedPromo,  //current rc +rcb
                    realChips: coinTypeOne.win + coinTypeOne.deposit + deductedDeposit, //current rc 
                    realChipBonus: coinTypeOne.promo + deductedPromo, //current rcb
                    totalRC: coinTypeOne.win + coinTypeOne.deposit + deductedDeposit + deductedDeposit + deductedWin,  //deducted rc + availavle rc
                    totalRCB: coinTypeOne.win + coinTypeOne.deposit + deductedDeposit + deductedPromo, //deducted rc + availavle rc
                    freeChips: coinTypeTwo.totalBalance
                }
            };
        }
        else if (term === 'WD' && (coinTypeOne.deposit + coinTypeOne.win) >= params.data.chips) {
            let remainingChipsToDeduct = params.data.chips;
            let deductedDeposit = 0, deductedWin = 0;
            if (coinTypeOne.win >= params.data.chips) {
                coinTypeOne.win -= params.data.chips;
                deductedWin = params.data.chips;
            } else {
                deductedWin = coinTypeOne.win ? coinTypeOne.win : 0; //1000
                coinTypeOne.win = 0;
                remainingChipsToDeduct -= deductedWin;
                deductedDeposit = remainingChipsToDeduct; //1000
                coinTypeOne.deposit -= deductedDeposit;
            }

            coinTypeOne.totalBalance -= params.data.chips;
            this.updateQuery(params, coinTypeOne)
            return {
                success: true,
                user: params.user,
                data: {
                    realchips: (coinTypeOne.deposit + coinTypeOne.win) - (deductedDeposit + deductedWin),
                    realChipBonus: coinTypeOne.promo
                },
                points: {
                    coinType: 1,
                    deposit: deductedDeposit,
                    win: deductedWin,
                    promo: 0,
                    totalBalance: deductedDeposit + deductedWin
                },
                userPoints: coinTypeOne,
                currentPoints: {
                    rc: coinTypeOne.win + coinTypeOne.deposit + deductedDeposit,
                    rcb: coinTypeOne.promo,
                    freeChips: coinTypeTwo.totalBalance
                }
            }

        }
        else if (term === 'P' && coinTypeOne.promo >= params.data.chips) {
            coinTypeOne.promo -= params.data.chips;
            coinTypeOne.totalBalance -= params.data.chips;
            this.updateQuery(params, coinTypeOne)
            return {
                success: true,
                user: params.user,
                points: {
                    coinType: 1,
                    deposit: 0,
                    win: 0,
                    promo: params.data.chips,
                    totalBalance: params.data.chips
                },
                userPoints: coinTypeOne,
                currentPoints: {
                    rc: coinTypeOne.win + coinTypeOne.deposit,
                    rcb: coinTypeOne.promo,
                    freeChips: coinTypeTwo.totalBalance
                }
            }
        } else {
            return { success: false, channelId: params.data.channelId ?? '', info: 'You have insufficient points in your account. Please update your points balance.' };
        }
    }

    async mthEntry(params: any, generalCoinType: any) {
        const fetchedUser = await this.fetchUser({ playerId: params.data.playerId });
        const coin1 = fetchedUser.data.points.find(({ coinType }) => coinType === 1);
        const coin2 = fetchedUser.data.points.find(({ coinType }) => coinType === 2);
        if (generalCoinType.coinType === 1 || generalCoinType.coinType === 4) {
            const coinDetails = fetchedUser.data.points.find(({ coinType }) => coinType === generalCoinType.coinType);
            let beforeAmount = 0, afterAmount = 0, amount = params.data.chips;

            if (params.type != 'deduct') {
                beforeAmount = coinDetails.totalBalance - amount;
                afterAmount = coinDetails.totalBalance;
            }
            else {
                beforeAmount = coinDetails.totalBalance + amount;
                afterAmount = coinDetails.totalBalance;
            }
            //mth entry
            let getTransactionType = (action: any) => {
                const actions = {
                    "onlineTransfer": "Online Transfer",
                    "cashoutRc": "Cashout",
                    "cashoutRejectRC": "Cashout Reject",
                    "pushRc": "Push RC",
                    "pullRc": "PULL RC",
                    "pushRcb": "Push RCB",
                    "pullRcb": "PULL RCB",
                    "rakeBack": "RakeBack",
                    "loyaltyPoint": "RakeBack",
                    "chipsTaken": "Chips Taken",
                    "topUp": "Top Up",
                    "stoodUp": "Stood Up",
                    "revert": "Revert",
                    "rabbit": "Rabbit",
                    "subscription": "Subscription",
                    "ucbRelease": "UCB Release",
                    "bounty": "bounty",
                    "reBuy": "Re Buy",
                    "addOn": "Add On",
                    "tourWin": "Tour Win",
                    "tourRegistration": "Tour Registration",
                    "tourUnRegistration": "Tour Un-Registration",
                    "tourCancel": "Tour Cancel"
                };

                return actions[action] ?? "N?A";
            }

            await this.pokerDbConnection.insertingDataInMTH({
                isOrganic: params.user.isOrganic ? 1 : 0,
                createdAt: Number(new Date()),
                userName: params.user.userName,
                playerId: params.user.playerId,
                tableName: params.data.tableName ?? "-",
                transactionType: getTransactionType(params.action),
                transactionId: params.data.transactionId ?? "-",
                refrenceNumber: params.data.referenceNumber ?? "-",
                beforeAmount: beforeAmount,
                amount: amount,
                afterAmount: afterAmount,
                transactionMode: "Credit",
                balanceType: coinDetails.coinType,
                chipType: coinDetails.coinType,
                parentId: params.user.isParentUserName ?? "-",
                transferBy: params.data.transferBy ? params.data.transferBy : "System"
            });
        }

        this.chipsBroadcast({
            msg: {
                playerId: params.user.playerId,
                updated: {
                    freeChips: Math.floor(coin2.totalBalance),
                    realChips: Math.floor(coin1.totalBalance) || 0, //rc +rcb
                    totalBalance: Math.floor(coin1.totalBalance) || 0, //rc +rcb
                    RC_Amt: Math.floor(coin1.totalBalance - coin1.promo) || 0, //rc only
                    RCB_Amt: Math.floor(coin1.promo) || 0,    //rcb only
                    lockedCashout: params.user.lockedCashout ? Math.floor(params.user.lockedCashout) : 0
                },
                cashier: {
                    RC: Math.floor(coin1.totalBalance - coin1.promo) || 0, //rc only
                }
            }, playerId: params.user.playerId, route: "updateProfile"
        })
    }

    async updateQuery(params: any, generalCoinType: any) {
        // console.log("updated chips is>", generalCoinType)
        await this.pokerDbConnection.updateUser({ playerId: params.user.playerId, points: { $elemMatch: { coinType: generalCoinType.coinType } } },
            {
                "points.$.win": this.utilsService.convertIntToDecimal(generalCoinType.win),
                "points.$.deposit": this.utilsService.convertIntToDecimal(generalCoinType.deposit),
                "points.$.promo": this.utilsService.convertIntToDecimal(generalCoinType.promo),
                "points.$.totalBalance": this.utilsService.convertIntToDecimal(generalCoinType.deposit + generalCoinType.win + generalCoinType.promo),
                "points.$.updatedAt": Number(new Date())
            }
        );
        if ((generalCoinType.coinType == 1 || generalCoinType.coinType == 2 || generalCoinType.coinType == 4) && params.data.chips) {
            this.mthEntry(params, generalCoinType);
        }
        else {
            console.log("cointype not 1", generalCoinType)
        }
    }

    async fetchUser(filter: any) {
        if (filter.userName) { filter.userName = filter.userName.toLowerCase(); }
        const fetchedUser: any = await this.pokerDbConnection.findUser(filter);
        if (!fetchedUser) {
            return { success: false, info: 'User not found!' };
        }

        if (!fetchedUser.points) {
            const tempPoints = [
                {
                    coinType: 1,
                    deposit: fetchedUser.realChips,
                    win: 0,
                    promo: fetchedUser.realChipBonus,
                    totalBalance: fetchedUser.realChips + fetchedUser.realChipBonus,
                    updatedAt: Date.now(),
                },
                {
                    coinType: 2,
                    deposit: 0,
                    win: 0,
                    promo: fetchedUser.freeChips,
                    totalBalance: fetchedUser.freeChips,
                    updatedAt: Date.now(),
                },
                {
                    coinType: 3,
                    deposit: 0,
                    win: 0,
                    promo: fetchedUser.unClaimedChipBonus,
                    totalBalance: fetchedUser.unClaimedChipBonus,
                    updatedAt: Date.now(),
                },
                {
                    coinType: 4,
                    deposit: 0,
                    win: 0,
                    promo: 0,
                    totalBalance: 0,
                    updatedAt: Date.now(),
                },
            ];

            await this.pokerDbConnection.updateUser(filter, {
                points: tempPoints,
                freeChips: 0,
                realChips: 0,
                realChipBonus: 0,
                unClaimedChipBonus: 0,
            });
            fetchedUser.points = tempPoints;
        }
        return { success: true, data: fetchedUser };
    }

    async chipsBroadcast(params: any) {
        // console.log("in chipsBroadcast", params)
        params.msg.sentFrom = "wallet";
        return new Promise((resolve, reject) => {
            try {
                pomelo.request('room.channelHandler.chipsBroadcast', { self: {}, msg: params.msg, playerId: params.playerId, }, (data: any) => {
                    // console.log('line 301', data)
                    return resolve(data);
                })
            }
            catch (err) {
                // console.error("in chipsBroadcast err",err);
                return ({ success: false, info: err })
            }
        })
    }
}