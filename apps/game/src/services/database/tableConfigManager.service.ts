import { Injectable } from "@nestjs/common";
import _ld from "lodash";
import _ from 'underscore';
import { popupTextManager, stateOfX } from "shared/common";
import { TableManagerService } from "./tableManager.service";



@Injectable()
export class TableConfigManagerService {


    constructor(
        private readonly tableManager: TableManagerService
    ) { }





    // THIS FILE DOES NOT SET THESE THINGS ACTUALLY
    // It does them and revert them back
    // reason - To find players who will be part of game or not
    // WHY SUCH REASON - becoz player sitting in between dealer and SB may not become part of game

    // many functions are similar to setTableConfig.js


    // ************* DEALER INDEX DECISION BEGINS HERE **************


    /*================================  START  ============================*/
    // set all ready players as playing
    // some of them might again become waiting
    async setPlayersAsPlaying(params: any): Promise<any> {
        const waitingPlayers = _.where(params.table.players, { state: stateOfX.playerState.waiting });

        const indexBetweenSBandBB = await this.tableManager.indexBetweenSBandBB(params);
        const stateBetweenSBandBB = await this.tableManager.stateOfSBandBB(params);

        for (const player of waitingPlayers) {
            if (
                indexBetweenSBandBB.indexOf(player.seatIndex) < 0 ||
                params.table.players.length === 3 ||
                stateBetweenSBandBB
            ) {
                player.state = stateOfX.playerState.playing;
            }
            // else skip
        }

        return params;
    };

    /*================================  END  ============================*/

    /*================================  END  ============================*/
    // sort player indexes acc to state
    // put playing first
    async sortPlayerIndexes(params: any): Promise<any> {
        params.table.players.sort((a, b) => parseInt(a.seatIndex) - parseInt(b.seatIndex));

        const playingPlayers = [];
        const inactivePlayer = [];

        for (const player of params.table.players) {
            const isOnBreakAndEligible =
                player.state === stateOfX.playerState.onBreak &&
                params.table.isCTEnabledTable &&
                player.playerScore > 0 &&
                (
                    (player.playerCallTimer.status === false &&
                        player.callTimeGameMissed <= params.table.ctEnabledBufferHand) ||
                    (player.playerCallTimer.status === true &&
                        !player.playerCallTimer.isCallTimeOver)
                );

            if (player.state !== stateOfX.playerState.playing && !isOnBreakAndEligible) {
                inactivePlayer.push(player);
            } else {
                playingPlayers.push(player);
            }
        }

        params.table.players = playingPlayers.concat(inactivePlayer);

        return params;
    };
    /*================================  END  ============================*/


    /*================================  START  ============================*/
    // find out array of seat occupied
    async totalSeatOccpuied(params: any): Promise<any> {
        params.data.totalSeatIndexOccupied = _.pluck(
            _.filter(params.table.players, (player) => {
                return (
                    player.state === stateOfX.playerState.playing ||
                    (
                        player.state === stateOfX.playerState.onBreak &&
                        params.table.isCTEnabledTable &&
                        player.playerScore > 0 &&
                        (
                            (!player.playerCallTimer.status && player.callTimeGameMissed <= params.table.ctEnabledBufferHand) ||
                            (player.playerCallTimer.status && !player.playerCallTimer.isCallTimeOver)
                        )
                    )
                );
            }),
            'seatIndex'
        );

        return params;
    };

    /*================================  END  ============================*/


    /*================================  START  ============================*/
    // set dealer as normal
    // FURTHER function are as defined as in setTableConfig FILE
    async setupNewDealer(params: any): Promise<any> {
        if (params.table.roundCount === 1) {
            params.data.delaerFound = true;
            params.data.currentDealerSeatIndex = params.data.totalSeatIndexOccupied[0];
            return params;
        }

        params.data.delaerFound = false;
        const prevDealerseatIndex = params.table.prevDealerseatIndex;
        let rangePlayers = _.range(prevDealerseatIndex + 1, params.table.maxPlayers + 1);

        for (const rangePlayer of rangePlayers) {
            const player = _.where(params.table.players, { seatIndex: rangePlayer });
            if (
                player.length > 0 &&
                player[0].hasPlayedOnceOnTable === true &&
                !params.data.delaerFound &&
                (
                    player[0].state === stateOfX.playerState.playing ||
                    (
                        player[0].state === stateOfX.playerState.onBreak &&
                        params.table.isCTEnabledTable &&
                        player[0].playerScore > 0 &&
                        (
                            (!player[0].playerCallTimer.status && player[0].callTimeGameMissed <= params.table.ctEnabledBufferHand) ||
                            (player[0].playerCallTimer.status && !player[0].playerCallTimer.isCallTimeOver)
                        )
                    )
                )
            ) {
                params.data.delaerFound = true;
                params.data.currentDealerSeatIndex = player[0].seatIndex;
                break;
            }
        }

        if (!params.data.delaerFound) {
            rangePlayers = _.range(1, prevDealerseatIndex);
            for (const rangePlayer of rangePlayers) {
                const player = _.where(params.table.players, { seatIndex: rangePlayer });
                if (
                    player.length > 0 &&
                    player[0].hasPlayedOnceOnTable === true &&
                    !params.data.delaerFound &&
                    (
                        player[0].state === stateOfX.playerState.playing ||
                        (
                            player[0].state === stateOfX.playerState.onBreak &&
                            params.table.isCTEnabledTable &&
                            player[0].playerScore > 0 &&
                            (
                                (!player[0].playerCallTimer.status && player[0].callTimeGameMissed <= params.table.ctEnabledBufferHand) ||
                                (player[0].playerCallTimer.status && !player[0].playerCallTimer.isCallTimeOver)
                            )
                        )
                    )
                ) {
                    params.data.delaerFound = true;
                    params.data.currentDealerSeatIndex = player[0].seatIndex;
                    break;
                }
            }
        }

        if (!params.data.delaerFound) {
            const prevDealerEligible = _.filter(params.table.players, (plr) => {
                return (
                    plr.seatIndex === prevDealerseatIndex &&
                    (
                        plr.state === stateOfX.playerState.playing ||
                        (
                            plr.state === stateOfX.playerState.onBreak &&
                            params.table.isCTEnabledTable &&
                            plr.playerScore > 0 &&
                            (
                                (!plr.playerCallTimer.status && plr.callTimeGameMissed <= params.table.ctEnabledBufferHand) ||
                                (plr.playerCallTimer.status && !plr.playerCallTimer.isCallTimeOver)
                            )
                        )
                    )
                );
            });

            if (prevDealerEligible.length > 0) {
                params.data.delaerFound = true;
                params.data.currentDealerSeatIndex = prevDealerseatIndex;
            } else {
                params.data.delaerFound = true;
                params.data.currentDealerSeatIndex = params.data.totalSeatIndexOccupied[0];
                const playerIndexInPlayers = _ld.findIndex(params.table.players, { seatIndex: params.data.totalSeatIndexOccupied[0] });
                params.table.players[playerIndexInPlayers].tempPlaying = false;
            }
        }

        return params;
    };
    /*================================  END  ============================*/

    /*================================  START  ============================*/
    async setDealerIndexAndSeatIndex(params: any): Promise<any> {
        if (params.data.delaerFound) {
            const playerIndexOnTable = _ld.findIndex(params.table.players, { seatIndex: params.data.currentDealerSeatIndex });
            params.table.dealerIndex = playerIndexOnTable;
            params.table.dealerSeatIndex = params.data.currentDealerSeatIndex;
            params.tempConfigPlayers.dealerSeatIndex = params.table.dealerSeatIndex;
            return params;
        } else {
            throw {
                success: false,
                isRetry: false,
                isDisplay: false,
                channelId: (params.channelId || ""),
                info: popupTextManager.falseMessages.SETDEALERINDEXFAIL_TABLECONFIGMANAGER,
                errorId: "falseMessages.SETDEALERINDEXFAIL_TABLECONFIGMANAGER"
            };
        }
    };
    /*================================  END  ============================*/


    /*================================  START  ============================*/
    // init params in temp object
    async initializeParams(params: any): Promise<any> {
        params.data.delaerFound = false;
        params.data.smallBlindSet = false;

        params.temp = {};
        params.temp.waitingPlayers = _.where(params.table.players, { state: stateOfX.playerState.waiting });
        params.temp.dealerSeatIndex = params.table.dealerSeatIndex;
        params.temp.smallBlindSeatIndex = params.table.smallBlindSeatIndex;
        params.temp.nextSmallBlindSeatIndex = params.table.nextSmallBlindSeatIndex;
        params.temp.bigBlindSeatIndex = params.table.bigBlindSeatIndex;
        params.temp.dealerIndex = params.table.dealerIndex;
        params.temp.smallBlindIndex = params.table.smallBlindIndex;
        params.temp.bigBlindIndex = params.table.bigBlindIndex;
        params.temp.straddleIndex = params.table.straddleIndex;
        params.temp.currentMoveIndex = params.table.currentMoveIndex;
        params.temp.firstActiveIndex = params.table.firstActiveIndex;
        params.temp.nextDealerSeatIndex = params.table.nextDealerSeatIndex;

        params.tempConfigPlayers = {
            dealerSeatIndex: -1,
            smallBlindSeatIndex: -1,
            bigBlindSeatIndex: -1,
        };

        return params;
    };

    /*================================  END  ============================*/

    /*================================  START  ============================*/
    async setNextGameDealer(params: any): Promise<any> {
        const validPlayers = _.filter(params.table.players, (player) => {
            return (player.state === stateOfX.playerState.playing) ||
                (player.state === stateOfX.playerState.onBreak &&
                    params.table.isCTEnabledTable &&
                    player.playerScore > 0 &&
                    (
                        (player.playerCallTimer.status === false && player.callTimeGameMissed <= params.table.ctEnabledBufferHand) ||
                        (player.playerCallTimer.status === true && !player.playerCallTimer.isCallTimeOver)
                    )
                );
        });

        if (validPlayers.length !== 2) {
            params.table.nextDealerSeatIndex = params.table.smallBlindSeatIndex;
            return params;
        }

        params.seatIndex = params.table.dealerSeatIndex;

        const seatIndexResponse = await this.tableManager.nextActiveSeatIndex(params);

        if (seatIndexResponse.success) {
            params.table.nextDealerSeatIndex = seatIndexResponse.seatIndex;
            return params;
        } else {
            throw seatIndexResponse;
        }
    };

    /*================================  END  ============================*/


    /*================================  START  ============================*/
    async setupNewSB(params: any): Promise<any> {
        params.data.smallBlindSet = false;

        if (params.table.roundCount === 1) {
            const playingCount = _.where(params.table.players, { state: stateOfX.playerState.playing }).length;
            params.data.smallBlindSet = true;

            if (playingCount === 2) {
                params.table.smallBlindSeatIndex = params.table.dealerSeatIndex;
            } else {
                params.table.smallBlindSeatIndex = params.data.totalSeatIndexOccupied[1];
            }

            return params;
        }

        const currentDealerSeatIndex = params.table.dealerSeatIndex;
        const maxPlayers = params.table.maxPlayers;
        const players = params.table.players;

        // First pass: seatIndex > dealer
        for (let i = currentDealerSeatIndex + 1; i <= maxPlayers; i++) {
            const playerList = _.where(players, { seatIndex: i });

            if (
                playerList.length > 0 &&
                playerList[0].hasPlayedOnceOnTable &&
                !params.data.smallBlindSet &&
                (
                    playerList[0].state === stateOfX.playerState.playing ||
                    (playerList[0].state === stateOfX.playerState.onBreak &&
                        params.table.isCTEnabledTable &&
                        playerList[0].playerScore > 0 &&
                        (
                            (!playerList[0].playerCallTimer.status && playerList[0].callTimeGameMissed <= params.table.ctEnabledBufferHand) ||
                            (playerList[0].playerCallTimer.status && !playerList[0].playerCallTimer.isCallTimeOver)
                        )
                    )
                )
            ) {
                params.data.smallBlindSet = true;
                params.table.smallBlindSeatIndex = playerList[0].seatIndex;
                break;
            }
        }

        // Second pass: seatIndex < dealer
        if (!params.data.smallBlindSet) {
            for (let i = 1; i < currentDealerSeatIndex; i++) {
                const playerList = _.where(players, { seatIndex: i });

                if (
                    playerList.length > 0 &&
                    playerList[0].hasPlayedOnceOnTable &&
                    !params.data.smallBlindSet &&
                    (
                        playerList[0].state === stateOfX.playerState.playing ||
                        (playerList[0].state === stateOfX.playerState.onBreak &&
                            params.table.isCTEnabledTable &&
                            playerList[0].playerScore > 0 &&
                            (
                                (!playerList[0].playerCallTimer.status && playerList[0].callTimeGameMissed <= params.table.ctEnabledBufferHand) ||
                                (playerList[0].playerCallTimer.status && !playerList[0].playerCallTimer.isCallTimeOver)
                            )
                        )
                    )
                ) {
                    params.data.smallBlindSet = true;
                    params.table.smallBlindSeatIndex = playerList[0].seatIndex;
                    break;
                }
            }
        }

        // Fallback to dealer if no one else is eligible
        if (!params.data.smallBlindSet) {
            params.data.smallBlindSet = true;
            params.table.smallBlindSeatIndex = currentDealerSeatIndex;
        }

        return params;
    };
    /*================================  END  ============================*/


    /*================================  START  ============================*/
    async setFirstSmallBlind(params: any): Promise<any> {
        params.data.smallBlindSet = false;

        if (params.table.roundCount === 1) {
            const playingCount = _.where(params.table.players, { state: stateOfX.playerState.playing }).length;

            params.data.smallBlindSet = true;

            if (playingCount === 2) {
                params.table.smallBlindSeatIndex = params.table.dealerSeatIndex;
            } else {
                params.table.smallBlindSeatIndex = params.data.totalSeatIndexOccupied[1];
            }
        }

        return params;
    };
    /*================================  END  ============================*/

    /*================================  START  ============================*/
    async setSmallBlindToDealer(params: any): Promise<any> {
        const playingCount = _.where(params.table.players, { state: stateOfX.playerState.playing }).length;

        if (playingCount === 2) {
            params.data.smallBlindSet = true;
            params.table.smallBlindSeatIndex = params.table.dealerSeatIndex;
        }

        return params;
    };
    /*================================  END  ============================*/

    /*================================  START  ============================*/
    async setPreDecideSmallBlind(params: any): Promise<any> {
        if (!params.data.smallBlindSet) {
            const thisSmallBlindIndex = _ld.findIndex(params.table.players, { seatIndex: params.table.nextSmallBlindSeatIndex });

            const isInvalidSBIndex = thisSmallBlindIndex < 0 &&
                _.where(params.table.players, { state: stateOfX.playerState.playing }).length > 2;
            const isValidPlayingSB = thisSmallBlindIndex >= 0 &&
                params.table.players[thisSmallBlindIndex].state === stateOfX.playerState.playing;

            if (isInvalidSBIndex || isValidPlayingSB) {
                params.data.smallBlindSet = true;
                params.table.smallBlindSeatIndex = params.table.nextSmallBlindSeatIndex;
            } else {
                params.seatIndex = params.table.nextSmallBlindSeatIndex;
                const seatIndexResponse = await this.tableManager.nextActiveSeatIndex(params);

                if (seatIndexResponse.success) {
                    params.table.smallBlindSeatIndex = seatIndexResponse.seatIndex;
                    params.data.smallBlindSet = true;
                } else {
                    throw seatIndexResponse;
                }
            }
        }

        return params;
    };

    /*================================  END  ============================*/

    /*================================  START  ============================*/
    async resetSmallBlind(params: any): Promise<any> {
        const totalPlayers = _.where(params.table.players, { state: stateOfX.playerState.playing }).length;

        if (totalPlayers > 2) {
            if (params.table.dealerSeatIndex === params.table.smallBlindSeatIndex) {
                params.seatIndex = params.table.smallBlindSeatIndex;
                const seatIndexResponse = await this.tableManager.nextActiveSeatIndex(params);

                if (seatIndexResponse.success) {
                    params.table.smallBlindSeatIndex = seatIndexResponse.seatIndex;
                    params.data.smallBlindSet = true;
                } else {
                    throw seatIndexResponse;
                }
            }
        }

        return params;
    };

    /*================================  END  ============================*/

    /*================================  START  ============================*/
    async setSmallBlindIndexAndSeatIndex(params: any): Promise<any> {
        if (params.data.smallBlindSet) {
            const playerIndexOnTable = _ld.findIndex(params.table.players, { seatIndex: params.table.smallBlindSeatIndex });
            params.tempConfigPlayers.smallBlindSeatIndex = params.table.smallBlindSeatIndex;
            params.table.smallBlindIndex = playerIndexOnTable;
            return params;
        } else {
            throw {
                success: false,
                isRetry: false,
                isDisplay: false,
                channelId: params.channelId || "",
                info: popupTextManager.falseMessages.SETSMALLBLINDINDEXFAIL_TABLECONFIGMANAGER,
                errorId: "falseMessages.SETSMALLBLINDINDEXFAIL_TABLECONFIGMANAGER"
            };
        }
    };

    /*================================  END  ============================*/


    /*================================  START  ============================*/
    async setNextGameSmallBlind(params: any): Promise<any> {
        params.seatIndex = params.table.smallBlindSeatIndex;

        const activePlayersCount = _.filter(params.table.players, (player) => {
            return (
                player.state === stateOfX.playerState.playing ||
                (
                    player.state === stateOfX.playerState.onBreak &&
                    params.table.isCTEnabledTable &&
                    player.playerScore > 0 &&
                    (
                        (player.playerCallTimer.status === false && player.callTimeGameMissed <= params.table.ctEnabledBufferHand) ||
                        (player.playerCallTimer.status === true && !player.playerCallTimer.isCallTimeOver)
                    )
                )
            );
        }).length;

        if (activePlayersCount === 2) {
            params.table.nextSmallBlindSeatIndex = params.table.nextDealerSeatIndex;
            return params;
        }

        const seatIndexResponse = await this.tableManager.nextActiveSeatIndex(params);
        if (seatIndexResponse.success) {
            params.table.nextSmallBlindSeatIndex = seatIndexResponse.seatIndex;
            return params;
        } else {
            throw seatIndexResponse;
        }
    };
    /*================================  END  ============================*/


    /*================================  START  ============================*/
    async setBigBlindDetails(params: any): Promise<any> {
        params.data.bigBlindSet = false;

        const smallBlindSeatIndex = params.table.smallBlindSeatIndex;
        const totalIndexes = _.range(1, params.table.maxPlayers + 1);
        let rangePlayers = _.range(smallBlindSeatIndex + 1, params.table.maxPlayers + 1);

        let player: any[];

        for (const rangePlayer of rangePlayers) {
            player = _.where(params.table.players, { seatIndex: rangePlayer });

            if (
                player.length > 0 &&
                !params.data.bigBlindSet &&
                (
                    player[0].state === stateOfX.playerState.playing ||
                    (
                        player[0].state === stateOfX.playerState.onBreak &&
                        params.table.isCTEnabledTable &&
                        player[0].playerScore > 0 &&
                        (
                            (!player[0].playerCallTimer.status && player[0].callTimeGameMissed <= params.table.ctEnabledBufferHand) ||
                            (player[0].playerCallTimer.status && !player[0].playerCallTimer.isCallTimeOver)
                        )
                    )
                )
            ) {
                params.data.bigBlindSet = true;
                params.table.bigBlindSeatIndex = player[0].seatIndex;
                params.table.bigBlindIndex = _ld.findIndex(params.table.players, { seatIndex: params.table.bigBlindSeatIndex });
                params.tempConfigPlayers.bigBlindSeatIndex = params.table.bigBlindSeatIndex;

                if (player[0].tempPlaying === true) {
                    params.table.players[params.table.bigBlindIndex].tempPlaying = false;
                }

                break;
            }
        }

        if (!params.data.bigBlindSet) {
            rangePlayers = _.range(1, smallBlindSeatIndex);

            for (const rangePlayer of rangePlayers) {
                player = _.where(params.table.players, { seatIndex: rangePlayer });

                if (
                    player.length > 0 &&
                    !params.data.bigBlindSet &&
                    (
                        player[0].state === stateOfX.playerState.playing ||
                        (
                            player[0].state === stateOfX.playerState.onBreak &&
                            params.table.isCTEnabledTable &&
                            player[0].playerScore > 0 &&
                            (
                                (!player[0].playerCallTimer.status && player[0].callTimeGameMissed <= params.table.ctEnabledBufferHand) ||
                                (player[0].playerCallTimer.status && !player[0].playerCallTimer.isCallTimeOver)
                            )
                        )
                    )
                ) {
                    params.data.bigBlindSet = true;
                    params.table.bigBlindSeatIndex = player[0].seatIndex;
                    params.table.bigBlindIndex = _ld.findIndex(params.table.players, { seatIndex: params.table.bigBlindSeatIndex });
                    params.tempConfigPlayers.bigBlindSeatIndex = params.table.bigBlindSeatIndex;

                    if (player[0].tempPlaying === true) {
                        params.table.players[params.table.bigBlindIndex].tempPlaying = false;
                    }

                    break;
                }
            }
        }

        return params;
    };
    /*================================  END  ============================*/

    /*================================  START  ============================*/
    async revertingPlayerToWaiting(params: any): Promise<any> {
        for (const player of params.table.players) {
            if (
                player.tempPlaying === true &&
                player.isForceBlindEnable === false &&
                (player.state === stateOfX.playerState.playing || player.state === stateOfX.playerState.waiting)
            ) {
                params.temp.waitingPlayers.push(player);
            }
        }

        return params;
    };
    /*================================  END  ============================*/


    /*================================  START  ============================*/
    // replace actual variables
    // (revert table settings)
    async replaceActualVariables(params: any): Promise<any> {
        params.table.dealerSeatIndex = params.temp.dealerSeatIndex;
        params.table.smallBlindSeatIndex = params.temp.smallBlindSeatIndex;
        params.table.nextSmallBlindSeatIndex = params.temp.nextSmallBlindSeatIndex;
        params.table.bigBlindSeatIndex = params.temp.bigBlindSeatIndex;
        params.table.dealerIndex = params.temp.dealerIndex;
        params.table.smallBlindIndex = params.temp.smallBlindIndex;
        params.table.bigBlindIndex = params.temp.bigBlindIndex;
        params.table.straddleIndex = params.temp.straddleIndex;
        params.table.currentMoveIndex = params.temp.currentMoveIndex;
        params.table.firstActiveIndex = params.temp.firstActiveIndex;
        params.table.nextDealerSeatIndex = params.temp.nextDealerSeatIndex;

        try {
            for (const player of params.temp.waitingPlayers) {
                const playerIndexOnTable = _ld.findIndex(params.table.players, { playerId: player.playerId });

                if (playerIndexOnTable >= 0) {
                    params.table.players[playerIndexOnTable].state = stateOfX.playerState.waiting;
                }
            }

            return params;
        } catch (err) {
            throw {
                success: false,
                isRetry: false,
                isDisplay: false,
                channelId: params.channelId || "",
                info: popupTextManager.falseMessages.REPLACEACTUALVARIABLESFAIL_TABLECONFIGMANAGER + JSON.stringify(err),
                errorId: "falseMessages.REPLACEACTUALVARIABLESFAIL_TABLECONFIGMANAGER",
            };
        }
    };

    /*================================  END  ============================*/


    /*================================  START  ============================*/
    // set next game config
    // THIS FILE DOES NOT SET THESE THINGS ACTUALLY
    // It does them and revert them back
    // reason - To find players who will be part of game or not
    // WHY SUCH REASON - becoz player sitting in between dealer and SB may not become part of game
    async nextGameConfig(params: any): Promise<any> {
        try {
            params = await this.initializeParams(params);
            params = await this.sortPlayerIndexes(params);
            params = await this.totalSeatOccpuied(params);
            params = await this.setupNewDealer(params);
            params = await this.setDealerIndexAndSeatIndex(params);
            params = await this.setupNewSB(params);
            params = await this.setSmallBlindIndexAndSeatIndex(params);
            params = await this.setNextGameDealer(params);
            params = await this.setNextGameSmallBlind(params);
            params = await this.setBigBlindDetails(params);
            params = await this.revertingPlayerToWaiting(params);
            params = await this.replaceActualVariables(params);

            return { success: true, params };
        } catch (err: any) {
            return {
                success: false,
                isRetry: false,
                isDisplay: false,
                channelId: params?.channelId || "",
                info: popupTextManager.falseMessages.GETNEXTDEALERSEATINDEXFAIL_TABLECONFIGMANAGER,
                errorId: "falseMessages.GETNEXTDEALERSEATINDEXFAIL_TABLECONFIGMANAGER",
            };
        }
    };


    /*================================  END  ============================*/

    // ************* DEALER INDEX DECISION ENDS HERE **************


    // ************* SET NEXT GAME DEALER BEGINS HERE **************



    // ************* SET NEXT GAME DEALER ENDS HERE **************


    /*================================  START  ============================*/
    // deprecated
    async getNextSmallBlindSeatIndex(params: any): Promise<any> {
        return { success: true, params };
    };

    /*================================  END  ============================*/


    /*================================  START  ============================*/
    // deprecated

    async getNextBigBlindSeatIndex(params: any): Promise<any> {
        return { success: true, params };
    };

    /*================================  END  ============================*/




}