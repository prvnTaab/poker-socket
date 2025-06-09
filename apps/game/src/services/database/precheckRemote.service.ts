import { Injectable } from "@nestjs/common";
import _ld from "lodash";
import { stateOfX, popupTextManager } from "shared/common";
import { MoveRemoteService } from "./moveRemote.service";




@Injectable()
export class PrecheckRemoteService {


    constructor(
        private readonly moveRemote: MoveRemoteService
    ) { }



    /*===================================  START  ==========================*/
    // when player tick/untick a precheck
    // save this in table-player object when table is locked
    // if player has move currently, then also execute move according to precheck
    // New
    async updatePrecheckOrMakeMoveAfterLock(params: any): Promise<any> {
        const playerIndex = _ld.findIndex(params.table.players, { playerId: params.data.playerId });

        if (playerIndex < 0) {
            return {
                success: false,
                isRetry: false,
                isDisplay: true,
                channelId: (params.channelId || ""),
                info: popupTextManager.falseMessages.SETPLAYERVALUEFAIL_TABLEMANAGER
            };
        }

        params.data.success = true;
        params.data.channelId = params.table.channelId;
        params.table.players[playerIndex].activityRecord.lastActivityTime = Number(new Date());

        if (params.data.keyValues) {

            Object.assign(params.table.players[playerIndex], params.data.keyValues);
            if (
                params.table.state === stateOfX.gameState.running &&
                playerIndex === params.table.currentMoveIndex
            ) {

                const decision = this.updateMoveActionAccToPrecheck(params, params.table.players[playerIndex]);

                if (decision) {
                    params.data.runBy = "precheck";
                    const moveMsg = JSON.parse(JSON.stringify(params.data));

                    const response = await this.moveRemote.takeAction(params);

                    return {
                        success: true,
                        table: params.table,
                        data: {
                            ...params.data,
                            msg: moveMsg,
                            moveResponse: response.data.response
                        }
                    };
                } else {
                    return {
                        success: true,
                        table: params.table,
                        data: params.data
                    };
                }
            } else {
                return {
                    success: true,
                    table: params.table,
                    data: params.data
                };
            }
        }

        return {
            success: true,
            table: params.table,
            data: params.data
        };
    };


    // Old
    // module.exports.updatePrecheckOrMakeMoveAfterLock = function (params, cb) {
    //     var playerIndex = _ld.findIndex(params.table.players, { playerId: params.data.playerId });
    //     if (playerIndex >= 0) {
    //         serverLog(stateOfX.serverLogType.info, 'Initial value of ' + params.data.key + ' for player - ' + params.table.players[playerIndex].playerName + ', ' + params.table.players[playerIndex][params.data.key])

    //         params.data.success = true;
    //         params.data.channelId = params.table.channelId;
    //         params.table.players[playerIndex].activityRecord.lastActivityTime = Number(new Date()); // Record last activity of player


    //         if (params.data.keyValues) {
    //             console.error("---- in precheckRemote 1111111111111", params.data.keyValues, JSON.stringify(params.table.players[playerIndex]))
    //             // console.log(JSON.stringify(params.table));
    //             Object.assign(params.table.players[playerIndex], params.data.keyValues)
    //             serverLog(stateOfX.serverLogType.info, 'Updated value of ' + params.data.key + ' for player - ' + params.table.players[playerIndex].playerName + ', ' + params.table.players[playerIndex][params.data.key])
    //             if (params.table.state == stateOfX.gameState.running && playerIndex == params.table.currentMoveIndex) {
    //                 console.error("---- in precheckRemote 222222222222222", params.table.state, playerIndex, params.table.currentMoveIndex)
    //                 var decision = updateMoveActionAccToPrecheck(params, params.table.players[playerIndex]);
    //                 console.error("---- in precheckRemote 555555555", JSON.stringify(decision))
    //                 if (!!decision) {
    //                     params.data.runBy = "precheck";
    //                     var moveMsg = JSON.parse(JSON.stringify(params.data));

    //                     moveRemote.takeAction(params, function (response) {
    //                         console.error("---- in precheckRemote 4444444444", JSON.stringify(response))
    //                         cb({ success: true, table: params.table, data: Object.assign(params.data, { msg: moveMsg, moveResponse: response.data.response }) })
    //                     })
    //                 } else {
    //                     cb({ success: true, table: params.table, data: params.data });
    //                 }
    //             } else {
    //                 console.error("---- in precheckRemote 3333333333333333", params.table.state, playerIndex, params.table.currentMoveIndex)
    //                 cb({ success: true, table: params.table, data: params.data });
    //             }
    //         }

    //     } else {
    //         cb({ success: false, isRetry: false, isDisplay: true, channelId: (params.channelId || ""), info: popupTextManager.falseMessages.SETPLAYERVALUEFAIL_TABLEMANAGER });
    //         //cb({success: false, channelId: params.channelId, info: "Setting player attribute failed, player not on table!"})
    //     }
    // };
    /*===================================  End  ==========================*/


    /*===================================  START  ==========================*/
    // decide move action according to
    // precheck selected by player
    // New
    updateMoveActionAccToPrecheck(params: any, player: any): any {
        const precheckValue = player.precheckValue;
        const callPCAmount = player.callPCAmount;
        const moves = player.moves;

        let decidedMove: any;

        switch (precheckValue) {
            case stateOfX.playerPrecheckValue.CALL:
                if (moves.includes(stateOfX.moveValue.call)) {
                    if ((params.table.roundMaxBet - (player.totalRoundBet || 0)) === (callPCAmount || 0)) {
                        decidedMove = stateOfX.move.call;
                    }
                }
                break;

            case stateOfX.playerPrecheckValue.CALL_ANY:
                if (moves.includes(stateOfX.moveValue.call)) {
                    decidedMove = stateOfX.move.call;
                } else if (moves.includes(stateOfX.moveValue.check)) {
                    decidedMove = stateOfX.move.check;
                } else if (moves.includes(stateOfX.moveValue.allin)) {
                    decidedMove = stateOfX.move.allin;
                }
                break;

            case stateOfX.playerPrecheckValue.FOLD:
                if (moves.includes(stateOfX.moveValue.fold)) {
                    decidedMove = stateOfX.move.fold;
                }
                break;

            case stateOfX.playerPrecheckValue.CHECK:
                if (moves.includes(stateOfX.moveValue.check)) {
                    decidedMove = stateOfX.move.check;
                }
                break;

            case stateOfX.playerPrecheckValue.ALLIN:
                if (moves.includes(stateOfX.moveValue.allin)) {
                    decidedMove = stateOfX.move.allin;
                }
                break;

            case stateOfX.playerPrecheckValue.CHECK_FOLD:
                if (moves.includes(stateOfX.moveValue.check)) {
                    decidedMove = stateOfX.move.check;
                } else if (moves.includes(stateOfX.moveValue.fold)) {
                    decidedMove = stateOfX.move.fold;
                }
                break;

            case stateOfX.playerPrecheckValue.CALL_ANY_CHECK:
                if (moves.includes(stateOfX.moveValue.call)) {
                    decidedMove = stateOfX.move.call;
                } else if (moves.includes(stateOfX.moveValue.check)) {
                    decidedMove = stateOfX.move.check;
                } else if (moves.includes(stateOfX.moveValue.allin)) {
                    decidedMove = stateOfX.move.allin;
                }
                break;

            case stateOfX.playerPrecheckValue.NONE:
                decidedMove = false;
                break;

            default:
                decidedMove = false;
        }

        params.data.action = decidedMove;
        params.data.amount = 0;
        params.data.playerName = player.playerName;

        return decidedMove;
    };


    // Old
    // var updateMoveActionAccToPrecheck = function (params, player) {
    // var precheckValue = player.precheckValue;
    // var callPCAmount = player.callPCAmount;
    // var moves = player.moves;

    // var decidedMove;
    // switch (precheckValue) {
    //     case stateOfX.playerPrecheckValue.CALL:
    //         if (moves.indexOf(stateOfX.moveValue.call) >= 0) {
    //             if (params.table.roundMaxBet - (player.totalRoundBet || 0) == (player.callPCAmount || 0)) {
    //                 decidedMove = stateOfX.move.call;
    //             }
    //         }
    //         break;
    //     case stateOfX.playerPrecheckValue.CALL_ANY:
    //         if (moves.indexOf(stateOfX.moveValue.call) >= 0) {
    //             decidedMove = stateOfX.move.call;
    //         } else if (moves.indexOf(stateOfX.moveValue.check) >= 0) {
    //             decidedMove = stateOfX.move.check;
    //         } else if (moves.indexOf(stateOfX.moveValue.allin) >= 0) {
    //             decidedMove = stateOfX.move.allin;
    //         }
    //         break;
    //     case stateOfX.playerPrecheckValue.FOLD:
    //         if (moves.indexOf(stateOfX.moveValue.fold) >= 0) {
    //             decidedMove = stateOfX.move.fold;
    //         }
    //         break;
    //     case stateOfX.playerPrecheckValue.CHECK:
    //         if (moves.indexOf(stateOfX.moveValue.check) >= 0) {
    //             decidedMove = stateOfX.move.check;
    //         }
    //         break;
    //     case stateOfX.playerPrecheckValue.ALLIN:
    //         if (moves.indexOf(stateOfX.moveValue.allin) >= 0) {
    //             decidedMove = stateOfX.move.allin;
    //         }
    //         break;
    //     case stateOfX.playerPrecheckValue.CHECK_FOLD:
    //         if (moves.indexOf(stateOfX.moveValue.check) >= 0) {
    //             decidedMove = stateOfX.move.check;
    //         } else if (moves.indexOf(stateOfX.moveValue.fold) >= 0) {
    //             decidedMove = stateOfX.move.fold;
    //         }
    //         break;
    //     case stateOfX.playerPrecheckValue.CALL_ANY_CHECK:
    //         if (moves.indexOf(stateOfX.moveValue.call) >= 0) {
    //             decidedMove = stateOfX.move.call;
    //         } else if (moves.indexOf(stateOfX.moveValue.check) >= 0) {
    //             decidedMove = stateOfX.move.check;
    //         } else if (moves.indexOf(stateOfX.moveValue.allin) >= 0) {
    //             decidedMove = stateOfX.move.allin;
    //         }
    //         break;
    //     case stateOfX.playerPrecheckValue.NONE:
    //         decidedMove = false;
    //         break;
    //     default:
    //         decidedMove = false;
    // }
    // params.data.action = decidedMove;
    // params.data.amount = 0;
    // params.data.playerName = player.playerName;
    // return decidedMove;
    // }
    /*===================================  End  ==========================*/





}