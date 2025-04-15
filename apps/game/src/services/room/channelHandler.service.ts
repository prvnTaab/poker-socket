import { Injectable } from "@nestjs/common";
import { popupTextManager } from "shared/common";
import { ImdbDatabaseService } from "shared/common/datebase/Imdbdatabase.service";
import { PokerDatabaseService } from "shared/common/datebase/pokerdatabase.service";










@Injectable()
export class ChannelHandlerService {

    constructor(

        private readonly db: PokerDatabaseService,
        private readonly imdb: ImdbDatabaseService,


    ) { }

/*=============================  START  ===============================*/
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
// New
async assignTableSettings(params: any): Promise<any> {
    try {
      const result = await this.imdb.findTableSetting({ playerId: params.playerId, channelId: params.channelId });
  
      if (result) {
        params.data.settings = result.settings;
        return params;
      }
  
      const user = await this.db.getCustomUser(params.playerId, {
        settings: 1,
        prefrences: 1,
        isMuckHand: 1,
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
          tableBackground: user.settings.tableBackground,
          cardColor: user.prefrences.cardColor,
          isMuckHand: user.isMuckHand,
          isStraddleOpted: false,
        },
        status: "spectator",
      };
  
      const response = await this.imdb.insertTableSetting(data);
      params.data.settings = response.settings;
      return params;
  
    } catch (err: any) {
      const info = err?.code === 'DB_GETSPACTATOR_SETTING_FAIL' ? popupTextManager.dbQyeryInfo.DB_GETSPACTATOR_SETTING_FAIL :
                   err?.code === 'DB_GETUSERSETTINGS_FAIL' ? popupTextManager.dbQyeryInfo.DB_GETUSERSETTINGS_FAIL :
                   popupTextManager.dbQyeryInfo.DB_SAVETABLESPECTATOR_FAIL;
  
      return {
        success: false,
        isRetry: false,
        tableId: params.tableId,
        isDisplay: false,
        channelId: params.channelId || "",
        info,
      };
    }
  };
  

// Old
// commonHandler.assignTableSettings = function(params, cb) {
// 	imdb.findTableSetting({playerId: params.playerId, channelId: params.channelId}, function(err, result){
//     if(err){
//       cb({success: false, isRetry: false, tableId: params.tableId, isDisplay: false, channelId: (params.channelId || ""), info: popupTextManager.dbQyeryInfo.DB_GETSPACTATOR_SETTING_FAIL});
//     } else {
//       if (!!result){
//         params.data.settings = result.settings;
//         cb(null, params);
//       } else {
//         // Get player setting details from database and assign as default setting for this table
//         db.getCustomUser(params.playerId, {settings: 1, prefrences:1, isMuckHand: 1}, function(err, user) {
//           if(err) {
//             cb({success: false, isRetry: false, tableId: params.tableId, isDisplay: false, channelId: (params.channelId || ""), info: popupTextManager.dbQyeryInfo.DB_GETUSERSETTINGS_FAIL});
//           } else {
//             var data = {playerId: params.playerId, channelId: params.channelId, playerName: params.playerName, createdAt: new Date(), settings: {}};
//             data.settings.muteGameSound = user.settings.muteGameSound;
//             data.settings.dealerChat    = user.settings.dealerChat;
//             data.settings.playerChat    = user.settings.playerChat;
//             data.settings.tableColor    = user.settings.tableColor;
//             data.settings.tableBackground    = user.settings.tableBackground;
//             data.settings.cardColor     = user.prefrences.cardColor;
//             data.settings.isMuckHand    = user.isMuckHand;
//             data.settings.isStraddleOpted    =false;
//             data.status                 =  "spectator";
//             imdb.insertTableSetting(data, function(err, response){
//               if(err) {
//                 cb({success: false, isRetry: false, tableId: params.tableId, isDisplay: false, channelId: (params.channelId || ""), info: popupTextManager.dbQyeryInfo.DB_SAVETABLESPECTATOR_FAIL});
//               } else {
//                 params.data.settings = response.settings;
//                 cb(null, params);
//               }
//             });
//           }
//         });
//       }
//     }
//   });
// };
/*=============================  END  ===============================*/

// Fire chips broadcast to individual player
// Request {playerId: , self}
broadcastChips(params) {
}










}