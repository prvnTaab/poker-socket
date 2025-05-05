import { Injectable } from "@nestjs/common";
import _ld from "lodash";
import { stateOfX, popupTextManager } from "shared/common";
import { validateKeySets } from "shared/common/utils/activity";










@Injectable()
export class DistributeCardsService  {


    constructor(
        private readonly tableManager:TableManagerService
    ) {}




    /*============================  START  =================================*/
    // ### Get total cards to be distributed based on Game Variation and Types
    // New
    async totalCardToBeDistributed(params: any): Promise<any> {
        try {
          const validated = await validateKeySets("Request", params.serverType, "totalCardToBeDistributed", params);
      
          if (validated.success) {
            return { success: true, count: stateOfX.totalPlayerCards[params.table.channelVariation] };
          } else {
            return validated;
          }
        } catch (error) {
          return { success: false, count: 0 }; // Handle the error case (you can modify this based on your needs)
        }
      };
      

    // Old
    // var totalCardToBeDistributed = function (params, cb) {
    //     keyValidator.validateKeySets("Request", params.serverType, "totalCardToBeDistributed", params, function (validated){
    //     if(validated.success) {
    //         cb({success: true, count: stateOfX.totalPlayerCards[params.table.channelVariation]});
    //     } else {
    //         cb(validated);
    //     }
    //     });
    // };
    /*============================  END  =================================*/
  


    /*============================  START  =================================*/
    // Distribute card to players after locking table object
    //   New
    async distribute(params: any): Promise<any> {
        try {
        const totalActivePlayersResponse = await this.tableManager.totalActivePlayers(params);

        if (totalActivePlayersResponse.success) {
            // Iterate over players to distribute cards
            for (const player of totalActivePlayersResponse.players) {
            // Get total cards to be distributed
            const totalCardToBeDistributedResponse = await this.totalCardToBeDistributed(params);

            if (totalCardToBeDistributedResponse.success) {
                params.count = totalCardToBeDistributedResponse.count;

                // Pop a card for the player
                const popCardResponse = await this.tableManager.popCard(params);

                if (popCardResponse.success) {
                player.currentCards = [];
                // Distribute cards to each player here
                player.cards = popCardResponse.cards;
                player.currentCards = popCardResponse.cards;
                } else {
                throw popCardResponse; // Handle the error from popping cards
                }
            } else {
                throw totalCardToBeDistributedResponse; // Handle missing keys error
            }
            }

            return { success: true, data: { players: totalActivePlayersResponse.players }, table: params.table };
        } else {
            return totalActivePlayersResponse; // Return the error response from totalActivePlayers
        }
        } catch (err) {
        return { success: false, channelId: (params.channelId || ""), info: popupTextManager.DISTRIBUTE_DISTRIBUTECARDS + JSON.stringify(err), isRetry: false, isDisplay: true };
        }
    }
    

    //   Old
    //   distributeCards.distribute = function (params, cb) {
    //     tableManager.totalActivePlayers(params, function (totalActivePlayersResponse){
    //       if(totalActivePlayersResponse.success) {
    //         // Iterate over player to distribute card
    //         async.each(totalActivePlayersResponse.players, function (player, ecb){
    //           // Get total cards to be distributed
    //           totalCardToBeDistributed(params, function (totalCardToBeDistributedResponse){
    //             if(totalCardToBeDistributedResponse.success) {
    //               params.count = totalCardToBeDistributedResponse.count;
    //               tableManager.popCard(params, function (popCardResponse){
    //                 if(popCardResponse.success) {
    //                   player.currentCards = [];
    //                   //Distribute cards to each player here
    //                   player.cards = popCardResponse.cards;
    //                   player.currentCards = popCardResponse.cards;
    //                   ecb();
    //                 } else {
    //                   ecb(popCardResponse);
    //                 }
    //               })
    //             } else {
    //               serverLog(stateOfX.serverLogType.error, 'Missing keys in distributecards - ' + JSON.stringify(totalCardToBeDistributedResponse));
    //               ecb(totalCardToBeDistributedResponse);
    //             }
    //           })
    //         }, function (err){
    //           if(err) {
    //             serverLog(stateOfX.serverLogType.error, err);
    //             cb({success: false, channelId: (params.channelId || ""), info: popupTextManager.DISTRIBUTE_DISTRIBUTECARDS + JSON.stringify(err), isRetry : false, isDisplay : true});
    //           } else {
    //             cb({success: true, data: {players: totalActivePlayersResponse.players}, table: params.table})
    //           }
    //         });
    //       } else {
    //         cb(totalActivePlayersResponse);
    //       }
    //     });
    //   };
    /*============================  END  =================================*/








}