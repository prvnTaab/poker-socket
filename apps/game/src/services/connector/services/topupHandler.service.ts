import { Injectable } from "@nestjs/common";
import { ImdbDatabaseService } from "shared/common/datebase/Imdbdatabase.service";
import { PokerDatabaseService } from "shared/common/datebase/pokerdatabase.service";
import { BroadcastHandlerService } from "./broadcastHandler.service";
import shortid = require('shortid32');
import stateOfX from "shared/common/stateOfX.sevice";
import { systemConfig } from "shared/common";

// Set your custom character set
shortid.characters('QWERTYUIOPASDFGHJKLZXCVBNM012345');








// const wallet = require("../../walletQuery")
// var  imdb = require("../../../../../shared/model/inMemoryDbQuery.js"),
//  stateOfX = require("../../../../../shared/stateOfX.js"),
//  broadcastHandler = require("./broadcastHandler"),
//  db  = require("../../../../../shared/model/dbQuery.js"),
//  admindb  = require("../../../../../shared/model/adminDbQuery.js"),
//  financedb  = require("../../../../../shared/model/financeDbQuery.js"),
//  sharedModule = require('../../../../../shared/sharedModule.js'),
//  systemConfig            = require("../../../../../shared/systemConfig.json"),
//  shortid        = require('shortid32'),
//  async = require('async'),
//  pomelo = require('pomelo')
//  shortid.characters('QWERTYUIOPASDFGHJKLZXCVBNM012345')




@Injectable()
export class TopupHandlerService {



    constructor(
        private readonly db:PokerDatabaseService,
        private readonly imd:ImdbDatabaseService,
        private readonly broadcastHandler:BroadcastHandlerService,

    ) {}







async handle(params: any): Promise<any> {
  try {
    const userParams = await this.findUsers(params);
    await this.checkTopupAllowed(userParams);
    await this.addChipsToUser(userParams);
    await this.checkAvailableCredit(userParams);
    await this.saveRecordsInTopupHistory(userParams);
    await this.addChipsInPlayerDeposit(userParams);
    await this.saveTransferHistoryToPlayer(userParams);
    await this.saveToFundTransactionHistoryPlayer(userParams);
    await this.increaseAmountInFinanceDb(userParams);
    await this.getTopupDetails(userParams);
    await this.sendEmailPlayerChipsTransfer(userParams);
    await this.sendEmailAdminPlayerChipsTransfer(userParams);

    return userParams;
  } catch (err: any) {
    return { success: false, info: err?.info || "VIP is not allow for you" };
  }
};

 
async findUsers(params: any): Promise<any> {
  const filter = {
    playerId: params.playerId,
  };

  const result = await this.db.findUser(filter);

  if (result) {
    params.names = result.firstName;
    params.childEmail = result.emailId;
    params.childMobile = result.mobileNumber;
    params.playerRealChips = result.realChips;
    params.transferTo = result.userName;
    params.userName = result.userName;
    params.topupLimit = result.topupLimit || 0;
    params.isTopupAllow = result.isTopupAllow || false;

    if (result.chipsManagement) {
      params.playerDepositChips = result.chipsManagement.deposit;
    }
    return params;
  } else {
    throw { success: false, info: "Player ID is not exist" };
  }
};


//check player is under topup feature
async checkTopupAllowed(params: any): Promise<any> {
  const query = {
    playerId: params.playerId,
    isTopupAllow: true,
  };

  const result = await this.db.isTopupAllowed(query);

  if (result) {
    return params;
  } else {
    throw { success: false, info: "VIP is not allow for you" };
  }
};


async checkAvailableCredit(params: any): Promise<any> {
  try {
    params = await this.findCreditTopup(params);
    params = await this.findDebitTopup(params);
    params = await this.topUpCalculation(params);
    params = await this.isAmountUnderCreditLimit(params);
    return params;
  } catch (err: any) {
    throw { success: false, info: err.info || "Can't find topup for this player" };
  }
};


// add chips to specific player when admin or affiliate transfers amount to user
async addChipsToUser(params: any): Promise<any> {
  params.playerRealChips = params.playerRealChips + chips;

  const result = await wallet.sendWalletBroadCast({
    action: 'pushRc',
    filter: {
      userName: params.userName,
    },
    data: {
      playerId: params.playerId,
      isRealMoney: true,
      chips: params.amount,
    },
  });

  if (result) {
    params.updated = { playerRealChips: params.playerRealChips || 0 };
    return params;
  } else {
    throw {
      success: false,
      isRetry: false,
      isDisplay: false,
      channelId: '',
      info: 'Points not transfered to this player',
    };
  }
};


// add saveRecordsInTopupHistory
async saveRecordsInTopupHistory(params: any): Promise<any> {
  const query = {
    userName: params.userName,
    amount: params.amount,
    type: 'credit',
    date: Number(new Date()),
    comment: 'Points transferred through topup on credit',
  };

  const result = await this.db.saveTopUp(query);

  if (result) {
    return params;
  } else {
    throw {
      success: false,
      isRetry: false,
      isDisplay: false,
      channelId: '',
      info: 'Points not transfered to this player',
    };
  }
};



// Converted to TypeScript with async/await
async addChipsInPlayerDeposit(params: any): Promise<any> {
  const filter = { userName: params.transferTo };
  const chips = params.amount;
  params.playerDepositChips = (params.playerDepositChips || 0) + chips;

  const result = await this.db.addChipsInPlayerDeposit(filter, chips);
  if (!result) {
    throw { success: false, isRetry: false, isDisplay: false, channelId: "", info: "Points not transfered to this player" };
  }
  return params;
}

async saveTransferHistoryToPlayer(params: any): Promise<any> {
  const filter = {
    transferTo: params.transferTo,
    amount: params.amount,
    transferBy: params.transferTo,
    referenceNoAff: shortid.generate().toUpperCase(),
    transactionType: stateOfX.transaction.topUp,
    description: "Points transferred through topup on credit",
    date: Number(new Date()),
    names: params.names
  };
  params.referenceNoAff = filter.referenceNoAff;

  const result = await this.db.saveTransferChipsPlayerHistory(filter);
  if (!result) {
    throw { success: false, isRetry: false, isDisplay: false, channelId: "", info: "Could not save  transfer to Affiliate History" };
  }
  return params;
}

async saveToFundTransactionHistoryPlayer(params: any): Promise<any> {
  const temp = params.names;
  const query = {
    Name: params.names,
    loginId: params.userName,
    date: Number(new Date()),
    referenceNumber: shortid.generate().toUpperCase(),
    amount: params.amount,
    transferMode: stateOfX.transaction.topUp,
    paymentId: 'N/A',
    bonusCode: 'N/A',
    bonusAmount: 'N/A',
    approvedBy: "MagnetAdmin",
    transactionType: stateOfX.transaction.topUp,
    names: params.names,
    loginType: `${temp}/PLAYER`,
    status: 'SUCCESS'
  };
  params.referenceNo = query.referenceNumber;

  const result = await this.db.createDepositHistory(query);
  if (!result) {
    throw { success: false, isRetry: false, isDisplay: false, channelId: "", info: "Could not save  history in fundTranasaction History" };
  }
  return params;
}

async increaseAmountInFinanceDb(params: any): Promise<any> {
  const result = await this.db.updateBalanceSheet({ $inc: { deposit: params.amount || 0 } });
  if (!result) {
    throw {
      success: false,
      isRetry: false,
      isDisplay: false,
      channelId: "",
      info: "Could not increaseAmountInFinanceDb History"
    };
  }
  return params;
}

// this function sends email on successful chips transfer
async sendEmailAdminPlayerChipsTransfer(params: any): Promise<any> {
  const content = {
    userName: params.userName,
    playerName: "Admin",
    referenceNo: params.referenceNo || params.referenceNoAff,
    amount: params.amount,
    message: `${params.userName} has used ${params.amount} points with ${stateOfX.transaction.topUp} ID - ${params.referenceNo || params.referenceNoAff} on ${new Date(new Date().toLocaleString().slice(0, -3))}`,
    totalAmount: `His current available balance is ${params.playerRealChips}`
  };

  const mailSubject = `${content.userName} ${stateOfX.transaction.topUp}`;
  const mailData = createMailData({
    content,
    toEmail: systemConfig.operation_email,
    subject: mailSubject,
    template: 'creditTransferPlayer'
  });

  try {
    const result = await sharedModule.sendMailWithHtml(mailData);
    if (!result) {
      throw {
        success: false,
        isRetry: false,
        isDisplay: false,
        channelId: "",
        info: "Can't send email"
      };
    }
    params.success = true;
    return params;
  } catch {
    throw {
      success: true,
      isRetry: false,
      isDisplay: false,
      channelId: "",
      info: "Something went wrong. Can't send email, Please share code with user manually"
    };
  }
}

// this function sends email on successful chips transfer
async sendEmailPlayerChipsTransfer(params: any): Promise<any> {
  if (params.childMobile) {
    const messageData = {
      mobileNumber: '91' + params.childMobile,
      msg: `Hi ${params.userName}, ${params.amount} points have been used by you with VIP credit ID - ${params.referenceNo}. Your current points balance is ${params.playerRealChips}.` + systemConfig.originalName + "."
    };
    params.otpApiResponse = await sharedModule.sendOtp(messageData);
  }

  const content = {
    userName: params.userName,
    playerName: params.userName,
    referenceNo: params.referenceNo || params.referenceNoAff,
    amount: params.amount,
    message: `${params.amount} points have been used by you in ${systemConfig.sendSmsUsername} account on ${new Date(new Date().toLocaleString().slice(0, -3))} with VIP credit ID : ${params.referenceNo || params.referenceNoAff}`,
    totalAmount: `Your current point balance is ${params.playerRealChips}. Good luck at the tables.`
  };

  const mailSubject = stateOfX.transaction.topUp;
  const mailData = this.createMailData({
    content,
    toEmail: params.childEmail,
    subject: mailSubject,
    template: 'creditTransferPlayer'
  });

  try {
    const result = await sharedModule.sendMailWithHtml(mailData);
    if (!result) {
      throw {
        success: false,
        isRetry: false,
        isDisplay: false,
        channelId: "",
        info: "Can't send email"
      };
    }
    return params;
  } catch {
    throw {
      success: false,
      isRetry: false,
      isDisplay: false,
      channelId: "",
      info: "Something went wrong. Can't send email, Please share code with user manually"
    };
  }
}

createMailData(params: any): any {
  const mailData: any = {};
  mailData.from_email = stateOfX.mailMessages.from_email.toString();
  mailData.to_email = params.toEmail;
  mailData.subject = params.subject;
  mailData.content = params.content;
  mailData.template = params.template;
  return mailData;
}

async getTopupDetails(params: any): Promise<any> {
  params = await this.findCreditTopup(params);
  params = await this.findDebitTopup(params);
  params = await this.topUpCalculation(params);
  return params;
}

async findCreditTopup(params: any): Promise<any> {
  const query = { userName: params.userName, type: 'credit' };
  const res = await this.db.getTopupSum(query);
  if (res && res.length > 0 && res[0].totalAmount) {
    params.totalCrAmount = res[0].totalAmount;
  }
  return params;
}

async findDebitTopup(params: any): Promise<any> {
  const query = { userName: params.userName, type: 'debit' };
  const res = await this.db.getTopupSum(query);
  if (res && res.length > 0 && res[0].totalAmount) {
    params.totalDrAmount = res[0].totalAmount;
  }
  return params;
}

async topUpCalculation(params: any): Promise<any> {
  if (params.topupLimit) {
    params.totalDrAmount = params.totalDrAmount || 0;
    params.totalCrAmount = params.totalCrAmount || 0;

    params.availableCredit = params.topupLimit - params.totalCrAmount + params.totalDrAmount;
    params.totalCreditUsed = params.totalCrAmount - params.totalDrAmount;
  }

  params.topUp = {
    isTopupAllow: params.isTopupAllow || false,
    topupLimit: params.topupLimit || 0,
    creditAvailable: params.availableCredit || 0
  };

  return params;
}

async isAmountUnderCreditLimit(params: any): Promise<any> {
  if (params.amount <= params.availableCredit) {
    return params;
  } else {
    const channelId = params.channelId || "";
    throw {
      success: false,
      channelId: channelId,
      info: "Amount should not be greater then maximum available balance"
    };
  }
}













}