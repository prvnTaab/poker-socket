import { Injectable } from "@nestjs/common";
import _ld from "lodash";
import _ from 'underscore';
import { stateOfX } from "shared/common";
import { SetTableConfigService } from "./setTableConfig.service";
import { DeductBlindsService } from "./deductBlinds.service";
import { DistributeCardsService } from "./distributeCards.service";
import { TableManagerService } from "./tableManager.service";
import { ActivityService } from "shared/common/activity/activity.service";





@Injectable()
export class StartGameRemoteService {

    constructor(
        private readonly validateGameStart: ValidateGameStartService,
        private readonly setTableConfig: SetTableConfigService,
        private readonly deductBlinds: DeductBlindsService,
        private readonly distributeCards: DistributeCardsService,
        private readonly tableManager: TableManagerService,
        private readonly activity: ActivityService

    ) { }





    /*================================  START  ============================*/
    async initializeParams(params: any): Promise<any> {
        return params;
    };

    /*================================  END  ============================*/

    /*================================  END  ============================*/
    // validate if game can be started
    // see detail in corresponding file
    async validateStartGame(params: any): Promise<any> {
        const response = await this.validateGameStart.validate(params);
        params.data.startGame = response.data.startGame;
        params.data.vgsResponse = response.data;
        params.vgsResponse = response.data;
        params.table = response.table;
        return params;
    };
    /*================================  END  ============================*/

    /*================================  START  ============================*/
    // broadcast game players to channel
    // RPC - becoz this is backend server
    async rpcGamePlayersBroadcast(params: any): Promise<any> {
        params.dataPlayers = JSON.parse(JSON.stringify(
            _.map(params.data.vgsResponse.players, player =>
                _.pick(player, 'playerId', 'playerName', 'chips', 'state', 'moves')
            )
        ));
        return params;
    };
    /*================================  END  ============================*/

    /*================================  START  ============================*/
    // return if game not to start
    async checkGameStart(params: any): Promise<any> {
        if (params.data.startGame) {
            return params;
        } else {
            throw _.omit(params, 'self');
        }
    };
    /*================================  END  ============================*/

    /*================================  START  ============================*/
    // set game dealer and other marked players
    // see detail in corresponding file
    async setGameConfig(params: any): Promise<any> {
        const response = await this.setTableConfig.setConfig(params);
        // params.data.sgcResponse = response.data;
        return params;
    };
    /*================================  END  ============================*/

    /*================================  START  ============================*/
    // deduct blinds for various players
    // see detail in corresponding file
    async deductBlindsFn(params: any): Promise<any> {
        const response = await this.deductBlinds.deduct(params);
        params.data.dbResponse = response.data;
        return params;
    };
    /*================================  END  ============================*/

    /*================================  START  ============================*/
    // distribute cards to all players acc to game variation
    // see detail in corresponding file
    async distributecards(params: any): Promise<any> {
        const response = await this.distributeCards.distribute(params);
        params.data.dcResponse = response.data;
        return params;
    };
    /*================================  END  ============================*/



    /*================================  START  ============================*/
    // flow position like moveRemote or leaveRemote  		
    // check and process start game
    async processStartGame(params: any): Promise<any> {

        try {
            params = await this.initializeParams(params);
            params = await this.validateStartGame(params);
            params = await this.rpcGamePlayersBroadcast(params);
            params = await this.checkGameStart(params);
            params = await this.setGameConfig(params);
            params = await this.deductBlindsFn(params);
            params = await this.distributecards(params);

            params.data.dataPlayers = params.dataPlayers;
            params.data.vgsResponse = params.vgsResponse;

            const playerToAvoid = _.where(params.table.players, { state: stateOfX.playerState.disconnected });
            const playerToAvoid1 = _.where(params.data.dataPlayers, { state: stateOfX.playerState.disconnected });

            for (const player of playerToAvoid) {
                const avoidPlayerIndex = _ld.findIndex(params.table.players, { playerId: player.playerId });
                const tablePlayer = params.table.players[avoidPlayerIndex];

                tablePlayer.state = stateOfX.playerState.onBreak;
                tablePlayer.active = false;
                tablePlayer.cards = [];
                tablePlayer.moves = [];
                tablePlayer.hasPlayedOnceOnTable = false;
                tablePlayer.entryPlayer = true;

                const query = {
                    seatIndex: tablePlayer.seatIndex,
                    channelId: params.table.channelId
                };

                await this.tableManager.removeCurrentPlayer(query);
            }

            for (const player of playerToAvoid1) {
                const avoidPlayerIndex = _ld.findIndex(params.data.dataPlayers, { playerId: player.playerId });
                const dataPlayer = params.data.dataPlayers[avoidPlayerIndex];

                dataPlayer.state = stateOfX.playerState.onBreak;
                dataPlayer.cards = [];
                dataPlayer.moves = [];
            }

            this.activity.startGameInfo(
                params,
                stateOfX.profile.category.gamePlay,
                stateOfX.gamePlay.subCategory.startGame,
                stateOfX.logType.info
            );

            return Object.assign({ success: true }, _.omit(params, 'self'));
        } catch (err: any) {
            if (params) {
                params.data.dataPlayers = params.dataPlayers;
                this.activity.startGameInfo(
                    params,
                    stateOfX.profile.category.gamePlay,
                    stateOfX.gamePlay.subCategory.startGame,
                    stateOfX.logType.info
                );
            }
            return Object.assign({ success: true }, err);
        }
    };
    /*================================  END  ============================*/




}