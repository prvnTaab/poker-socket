import { Injectable } from "@nestjs/common";
import { systemConfig, stateOfX } from "shared/common";











@Injectable()
export class TipRemoteService {





    /**
     * checks wether the current player has moves now
     * @method isPlayerWithCurrentMove
     * @param  {Object}     data {data, table}
     * @param  {Function}   cb     callback function
     */
    isPlayerWithCurrentMove(data: any): Promise<any> {
        if (
            data.table.players.length > 0 &&
            data.table.currentMoveIndex < data.table.players.length &&
            data.table.currentMoveIndex !== -1
        ) {
            data.isPlayerWithMove = data.table.players[data.table.currentMoveIndex].playerId === data.data.playerId;
            return data;
        } else {
            throw {
                success: false,
                info: "Invalid Attempt For Tip",
                channelId: data.data.channelId
            };
        }
    }

    /**
     * returns the tip amount based on the conditions
     * @method getTipAmount
     * @param  {Object}     data {data, table}
     * @return {Number}            tip amount
     */
    getTipAmount(data: any): number {
        return systemConfig.considerChipsForTip ? data.data.chips : data.table.bigBlind;
    }


    /**
     * checks wether the game has started on this channel
     * @method isGameRunning
     * @param  {Object}      data  {data, table}
     * @param  {Function}   cb     callback function
     */
    isGameRunning(data: any): Promise<any> {
        if (data.table.players.length >= data.table.minPlayers) {
            return data;
        } else {
            throw {
                success: false,
                info: "Can not Tip as Game is not Running",
                channelId: data.data.channelId
            };
        }
    }


    /**
     * checks whether the user chips to tip is valid or not
     * @method validateUserChips
     * @param  {Object}      data  {data, table}
     * @param  {Function}   cb     callback function
     */
    validateUserChips(data: any): Promise<any> {
        if (systemConfig.considerChipsForTip) {
            if (data.data.chips >= systemConfig.minimumTipAmount) {
                return data;
            } else {
                throw {
                    success: false,
                    info: "Invalid Points to Tip",
                    channelId: data.data.channelId
                };
            }
        } else {
            return data;
        }
    }


    /**
     * checks whether the game is being played with real money
     * @method isPlayingWithRealMoney
     * @param  {Object}      data  {data, table}
     * @param  {Function}   cb     callback function
     */
    isPlayingWithRealMoney(data: any): Promise<any> {
        if (data.table.isRealMoney) {
            return data;
        } else {
            throw {
                success: false,
                info: "Only real money can be tip",
                channelId: data.data.channelId
            };
        }
    }


    /**
     * [hasPlayerEnoughChips description]
     * @method hasPlayerEnoughChips
     * @param  {Object}             data [description]
     * @param  {Function}           cb   callback      function
     * @return {Boolean}                 [description]
     */
    hasPlayerEnoughChips(data: any): Promise<any> {
        if (data.player.chips >= data.tipAmount && data.player.chips >= 2 * data.table.bigBlind) {
            return data;
        } else {
            throw {
                success: false,
                info: "You don't have enough points to tip",
                channelId: data.data.channelId
            };
        }
    }


    /**
     * checks if the player has current move then after tip will the player have enough chips for call
     * @method checkEnoughCallAmountAfterTip
     * @param  {Object}     data  {data, table}
     * @param  {Function}   cb     callback function
     * @return {Object} 			status object
     */
    checkEnoughCallAmountAfterTip(data: any): Promise<any> {
        if (!data.isPlayerWithMove) {
            return data;
        }

        if (data.player.moves.includes(stateOfX.moveValue.call)) {
            const callAmount = data.table.roundMaxBet - data.player.totalRoundBet;
            if ((data.player.chips - data.tipAmount) >= callAmount) {
                return data;
            } else {
                throw {
                    success: false,
                    info: "You can not tip as low points",
                    channelId: data.data.channelId
                };
            }
        }

        return data;
    }


    /**
     * initializes waterfall params
     * @method initializeParams
     * @param  {Object}         params {data, table}
     * @param  {Function}       cb     callback      function
     */
    initializeParams(params: any): Promise<any> {
        const data = { ...params };
        data.tipAmount = this.getTipAmount(params);
        data.player = params.table.players.find((player: any) => player.playerId === params.data.playerId);

        if (data.player) {
            return data;
        } else {
            throw {
                success: false,
                info: "Player Not Found or is Observer",
                channelId: data.data.channelId
            };
        }
    }


    /**
     * creates response for to return
     * @method initializeParams
     * @param  {Object}         data {data, table}
     * @param  {Function}       cb     callback      function
     */
    createResponse(data: any): Promise<any> {
        data.response = {
            tipAmount: data.tipAmount,
            playerId: data.player.playerId,
            playerName: data.player.playerName,
            chipsBeforeTip: data.player.chips,
            channelId: data.data.channelId,
        };

        return data;
    }

    /**
     * processing of tip starts here
     * @method processTip
     * @param  {Object}         params {data, table}
     * @param  {Function}       cb     callback      function
     */
    async processTip(params: any): Promise<any> {
        try {
            let data = await this.initializeParams(params);
            data = await this.isGameRunning(data);
            data = await this.isPlayingWithRealMoney(data);
            data = await this.validateUserChips(data);
            data = await this.hasPlayerEnoughChips(data);
            data = await this.isPlayerWithCurrentMove(data);
            data = await this.checkEnoughCallAmountAfterTip(data);
            data = await this.createResponse(data);

            data.player.chips -= data.tipAmount;
            data.response.chips = data.player.chips;

            return {
                success: true,
                info: "Tip deducted successfully",
                data: data.response,
                table: params.table
            };
        } catch (err) {
            throw err;
        }
    };






}