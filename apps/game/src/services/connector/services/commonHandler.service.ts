import { Injectable } from "@nestjs/common";
import { systemConfig } from "shared/common";
import { ImdbDatabaseService } from "shared/common/datebase/Imdbdatabase.service";
import { PokerDatabaseService } from "shared/common/datebase/pokerdatabase.service";
import _ from 'underscore';







// _                = require('underscore'),
//     sharedModule     = require("../../../../../shared/sharedModule"),
//     imdb             = require("../../../../../shared/model/inMemoryDbQuery.js"),
//     db             = require("../../../../../shared/model/dbQuery.js"),
//     systemConfig     = require("../../../../../shared/systemConfig.json"),
//     popupTextManager = require("../../../../../shared/popupTextManager");




@Injectable()
export class CommonHandlerService {




    constructor(
        private readonly db:PokerDatabaseService,
        private readonly imdb:ImdbDatabaseService
    ) {}





    // Assign player settings while joining table
// for tournament, for open table and for autosit (join) table
// // > Save table level settings as well
// a) Sound
// b) Player Chat
// c) Dealer Chat
// d) Table Color
// e) Muck Winning Hand
// f) 4 Card Color Deck
// 
// Request: {playerId: , channelId: , tableId: (optional), data: {}, playerName: }
async assignTableSettings(params: any): Promise<any> {
  const result = await this.imdb.findTableSetting({ playerId: params.playerId, channelId: params.channelId });

  if (result) {
    params.data.settings = result.settings;
    return params;
  }

  const user = await this.db.getCustomUser(params.playerId, {
    settings: 1,
    prefrences: 1,
    isMuckHand: 1
  });

  const data: any = {
    playerId: params.playerId,
    channelId: params.channelId,
    playerName: params.playerName,
    createdAt: new Date(),
    settings: {
      muteGameSound: user.settings.muteGameSound,
      dealerChat: user.settings.dealerChat,
      playerChat: user.settings.playerChat,
      tableColor: user.settings.tableColor,
      cardColor: user.prefrences.cardColor,
      isMuckHand: user.isMuckHand,
      isStraddleOpted: false
    },
    status: "spectator"
  };

  const response = await this.imdb.insertTableSetting(data);
  params.data.settings = response.settings;
  return params;
};


// send sms to affiliate mobile
async sendCashoutSms(params: any): Promise<void> {
  const data = {
    msg:
      params.userName +
      ", has made cashout request of " +
      params.cashOutAmount +
      ".Please take necessary action.Contact player for balance adjustment." +
      systemConfig.userNameForMail +
      ".",
    mobileNumber: "91" + params.mobileNumber
  };

  await sharedModule.sendOtp(data);
};







}