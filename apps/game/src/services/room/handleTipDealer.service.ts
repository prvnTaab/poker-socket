import { Injectable } from "@nestjs/common";
import { PokerDatabaseService } from "shared/common/datebase/pokerdatabase.service";








@Injectable()
export class HandleTipDealerService {

    constructor(
        private readonly db: PokerDatabaseService

    ) { }



    /*===========================  START  ===============================*/
    // award tip amount to host
    // PENDING
    // New
    async handle(params: any): Promise<void> {
        try {
            const res = await this.db.updateBalanceSheet({
                $inc: { tip: params.tipAmount || 0 },
            });
            console.log('from handleTipDealer.handle updateBalanceSheet', null, res);
        } catch (err) {
            console.log('from handleTipDealer.handle updateBalanceSheet', err, null);
        }

        const tipHistory = {
            tipAmount: params.tipAmount,
            playerId: params.playerId,
            channelId: params.channelId,
            playerName: params.playerName,
            createdAt: new Date(),
            chipsBeforeTip: params.chipsBeforeTip,
            chipsAfterTip: params.chips,
        };

        try {
            const logRes = await this.db.createTipLog(tipHistory);
            console.log('handleTipDealer.handle lobDb.createTipLog', null, logRes);
        } catch (err) {
            console.log('handleTipDealer.handle lobDb.createTipLog', err, null);
        }
    }

    // Old
    // handleTipDealer.handle = function(params) {
    //     financeDB.updateBalanceSheet({ $inc: { "tip": params.tipAmount || 0 } }, function(err, res) {
    //         console.log(" from handleTipDealer.handle updateBalanceSheet", err, res);
    //     });

    //     var tipHistory = {
    //         tipAmount: params.tipAmount,
    //         playerId: params.playerId,
    //         channelId: params.channelId,
    //         playerName: params.playerName,
    //         createdAt: new Date(),
    //         chipsBeforeTip: params.chipsBeforeTip,
    //         chipsAfterTip: params.chips
    //     };
    //     // lobDb.createTipLog(tipHistory, function(err, res) {
    //     //     console.log("handleTipDealer.handle lobDb.createTipLog", err, res);
    //     // });
    // }




}