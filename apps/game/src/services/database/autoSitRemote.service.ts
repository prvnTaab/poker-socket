import { Injectable } from "@nestjs/common";
import _ld from "lodash";
import _ from 'underscore';
import { stateOfX, popupTextManager } from "shared/common";
import TableManagerService from "./tableManager";










@Injectable()
export class AutoSitRemoteService {


    constructor(
        private readonly tableManager: TableManagerService,

    ) { }





    /*============================  START  =================================*/
    // ### Store local variable used for calculations
    // New
    initializeParams(params: any): Promise<any> {

        params.data.chips = 0;
        params.data.isProcessRequired = true;
        params.data.isTableFull = false;


        return params;
    }

    // Old
    // var initializeParams = function(params, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'in autoSitRemote function initializeParams');
    //     params.data.chips             = 0;
    //     params.data.isProcessRequired = true;
    //     params.data.isTableFull       = false;
    //     serverLog(stateOfX.serverLogType.info, 'Seat index for which autosit is going to process - ' + params.data.seatIndex);
    //     cb(null, params);
    // }
    /*============================  END  =================================*/

    /*============================  START  =================================*/
    // ### Validate the seatIndex requested from client
    // New
    isValidSeatRequest(params: any): Promise<any> {

        if (params.data.seatIndex <= params.table.maxPlayers) {
            return params;
        } else {
            throw {
                success: false,
                isRetry: false,
                isDisplay: false,
                channelId: params.channelId || "",
                info: popupTextManager.falseMessages.INVALID_SEAT_INDEX_REQUEST +
                    params.data.seatIndex +
                    " for " + params.table.maxPlayers + " player table."
            };
        }
    }

    // Old
    // var isValidSeatRequest = function(params, cb) {
    // 	console.log(params.table)
    // 	if(params.data.seatIndex <= params.table.maxPlayers) {
    // 		cb(null, params);
    // 	} else {
    // 		cb({success: false, isRetry: false, isDisplay: false, channelId: (params.channelId || "") , info:popupTextManager.falseMessages.INVALID_SEAT_INDEX_REQUEST + params.data.seatIndex + " for " + params.table.maxPlayers + " player table."})
    // 	}
    // }
    /*============================  END  =================================*/

    /*============================  START  =================================*/
    // ### Check if there is seats available on table
    // New
    isSeatAvailable(params: any): Promise<any> {

        if (params.data.isProcessRequired) {
            params.data.isProcessRequired = params.table.maxPlayers !== params.table.players.length;
            params.data.isTableFull = !params.data.isProcessRequired;
            return params;
        } else {
            params.data.isTableFull = true;
            throw {
                success: true,
                data: params.data,
                isRetry: false,
                isDisplay: false,
                channelId: '',
                info: popupTextManager.falseMessages.TABLEFULL_JOIN_WAITING_LIST
            };
        }
    }

    // Old
    // var isSeatAvailable = function (params, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'in autoSitRemote function isSeatAvailable');
    //     if (params.data.isProcessRequired) {
    //         params.data.isProcessRequired = params.table.maxPlayers !== params.table.players.length;
    //         params.data.isTableFull = !params.data.isProcessRequired;
    //         cb(null, params);
    //     } else {
    //         params.data.isTableFull = true;
    //         cb({ success: true, data: params.data, isRetry: false, isDisplay: false, channelId: '', info: popupTextManager.falseMessages.TABLEFULL_JOIN_WAITING_LIST });
    //     }
    // }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    // ### Check if player is already sitting on the table
    // New
    isPlayerAlreadySit(params: any): Promise<any> {

        if (params.data.isProcessRequired) {
            params.data.isProcessRequired = _ld.findIndex(params.table.players, { playerId: params.data.playerId }) < 0;
        }

        return params;
    }

    // Old
    // var isPlayerAlreadySit = function (params, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'in autoSitRemote function isPlayerAlreadySit');
    //     if (params.data.isProcessRequired) {
    //         params.data.isProcessRequired = _ld.findIndex(params.table.players, { playerId: params.data.playerId }) < 0;
    //         cb(null, params);
    //     } else {
    //         cb(null, params);
    //     }
    // }
    /*============================  END  =================================*/




    /*============================  START  =================================*/
    // ### Check if player's prefered seat is available
    // New
    isPreferSeatVacant(params: any): Promise<any> {
    
        if (params.data.isProcessRequired) {
        const occupiedSeatIndex = _ld.findIndex(params.table.players, { seatIndex: params.data.seatIndex });
    
        if (occupiedSeatIndex >= 0) {
    
            params.data.seatIndex = _.difference(_.range(1, params.table.maxPlayers + 1), _.pluck(params.table.players, 'seatIndex'))[0];
        }
        }
    
        return params;
    }

    // Old
    // var isPreferSeatVacant = function (params, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'in autoSitRemote function isPreferSeatVacant');
    //     if (params.data.isProcessRequired) {
    //         serverLog(stateOfX.serverLogType.info, 'Prefered seat index occupied if >= 0 => ' + _ld.findIndex(params.table.players, { seatIndex: params.data.seatIndex }));
    //         if (_ld.findIndex(params.table.players, { seatIndex: params.data.seatIndex }) >= 0) {
    //             serverLog(stateOfX.serverLogType.warning, 'Prefered seat index of this player is already occupied, resetting to new index.');;
    //             serverLog(stateOfX.serverLogType.info, 'Total seats for this table will be - ' + _.range(1, params.table.maxPlayers + 1));
    //             serverLog(stateOfX.serverLogType.info, 'Occupied seat indexes are - ' + _.pluck(params.table.players, 'seatIndex'));
    //             serverLog(stateOfX.serverLogType.info, 'Remaining seat indexes as vacant - ' + _.difference(_.range(1, params.table.maxPlayers + 1), _.pluck(params.table.players, 'seatIndex')));
    //             params.data.seatIndex = _.difference(_.range(1, params.table.maxPlayers + 1), _.pluck(params.table.players, 'seatIndex'))[0];
    //             serverLog(stateOfX.serverLogType.info, 'New reset index will be - ' + params.data.seatIndex);
    //         }
    //         cb(null, params);
    //     } else {
    //         cb(null, params);
    //     }
    // }
    /*============================  END  =================================*/



    /*============================  START  =================================*/
    // ### add player as waiting into table
    // New
    async addPlayerAsReserved(params: any): Promise<any> {
    
        if (params.data.isProcessRequired) {
        // Generate player object
        params.data.state = stateOfX.playerState.reserved;
        params.data.maxBuyIn = params.table.maxBuyIn;
        params.data.player = this.tableManager.createPlayer(params.data);
    
        // Add player as waiting
        const addPlayerAsWaitingResponse = await this.tableManager.addPlayerAsWaiting(params);
        
        params.data.isPlayerSit = true;
        }
    
        return params;
    }

    // Old
    // var addPlayerAsReserved = function (params, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'in autoSitRemote function addPlayerAsReserved');
    //     if (params.data.isProcessRequired) {
    //         // Generate player object
    //         params.data.state = stateOfX.playerState.reserved;
    //         params.data.maxBuyIn = params.table.maxBuyIn;
    //         params.data.player = tableManager.createPlayer(params.data);

    //         // Add player as waiting
    //         tableManager.addPlayerAsWaiting(params, function (addPlayerAsWaitingResponse) {
    //             params.data.isPlayerSit = true;
    //             serverLog(stateOfX.serverLogType.info, 'Player sit set to true')
    //             cb(null, params);
    //         });
    //     } else {
    //         cb(null, params);
    //     }
    // }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    // ### create response for handler request
    // New
    createResponse(params: any): Promise<any> {
    
        // Since the callback is redundant, simply return params
        return params;
    }

    // Old
    // var createResponse = function (params, cb) {
    //     serverLog(stateOfX.serverLogType.info, 'in autoSitRemote function createResponse');
    //     if (params.data.isProcessRequired) {
    //         cb(null, params);
    //     } else {
    //         cb(null, params);
    //     }
    // }
    /*============================  END  =================================*/


    /*============================  START  =================================*/
    /**
     * process auto sit - from API "JOIN TABLE"
     * this function is executed after locking table
     * @method processAutoSit
     * @param  {Object}       params contains request data - channelId, playerId
     * @param  {Function}     cb     callback
     */
    // New
    async processAutoSit(params: any): Promise<any> {
        try {
        // Sequentially await each function instead of using async.waterfall
        const initializedParams = await this.initializeParams(params);
        const validSeatRequest = await this.isValidSeatRequest(initializedParams);
        const seatAvailable = await this.isSeatAvailable(validSeatRequest);
        const playerAlreadySit = await this.isPlayerAlreadySit(seatAvailable);
        const preferSeatVacant = await this.isPreferSeatVacant(playerAlreadySit);
        const playerAsReserved = await this.addPlayerAsReserved(preferSeatVacant);
        const response = await this.createResponse(playerAsReserved);
    
    
        return { success: true, table: response.table, data: response.data };
        } catch (err) {
        console.log(stateOfX.serverLogType.info, 'remote processAutoSit err ' + JSON.stringify(err));
        throw err;
        }
    }

    // Old
    // autoSitRemote.processAutoSit = function (params, cb) {
    //     async.waterfall([
    //         async.apply(initializeParams, params),
    //         isValidSeatRequest,
    //         isSeatAvailable,
    //         isPlayerAlreadySit,
    //         isPreferSeatVacant,
    //         addPlayerAsReserved,
    //         createResponse
    //     ], function (err, response) {
    //         serverLog(stateOfX.serverLogType.info, 'remote processAutoSit err ' + JSON.stringify(err))
    //         serverLog(stateOfX.serverLogType.info, 'remote processAutoSit response ' + JSON.stringify(response))
    //         if (err && !response) {
    //             cb(err);
    //         } else {
    //             cb({ success: true, table: response.table, data: response.data });
    //         }
    //     });
    // };

    /*============================  END  =================================*/










}