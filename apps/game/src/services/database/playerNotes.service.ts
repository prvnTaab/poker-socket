import { Injectable } from "@nestjs/common";
import { PokerDatabaseService } from "shared/common/datebase/pokerdatabase.service";
import { stateOfX, popupTextManager, systemConfig } from "shared/common";











@Injectable()
export class PlayerNotesService {

    private dbMessages = popupTextManager.dbQyeryInfo;

    constructor(
        private readonly db: PokerDatabaseService,
    ) { }







    /*============================  START  =================================*/
    /**
     * this function creates new game note
     * saved by player A for player B
     * @method createNotes
     * @param  {object}    params request json object
     * @param  {Function}  cb     callback function
     */
    // New
    async createNotes(params: any): Promise<any> {

        try {
            const notesResponse = await this.db.findNotes({ playerId: params.playerId, forPlayerId: params.forPlayerId });


            if (!!notesResponse) {
                return {
                    success: false,
                    info: this.dbMessages.DB_FINDNOTES_DUPLICATE_PLAYERNOTES,
                    isRetry: false,
                    isDisplay: false,
                    channelId: ""
                };
            }

            const dataToInsert = {
                playerId: params.playerId,
                forPlayerId: params.forPlayerId,
                notes: params.notes,
                color: params.color || null,
                createdAt: Number(new Date())
            };

            const notes = await this.db.createNotes(dataToInsert);

            if (!notes) {
                return {
                    success: false,
                    info: this.dbMessages.DB_CREATENOTES_FAILED_PLAYERNOTES,
                    isRetry: false,
                    isDisplay: false,
                    channelId: ""
                };
            }

            return {
                success: true,
                info: this.dbMessages.DB_CREATENOTES_SUCCESS_PLAYERNOTES,
                isRetry: false,
                isDisplay: false,
                channelId: ""
            };

        } catch (err) {
            return {
                success: false,
                info: this.dbMessages.DB_FINDNOTES_FAILED_PLAYERNOTES,
                isRetry: false,
                isDisplay: false,
                channelId: ""
            };
        }
    };

    // Old
    // playerNotes.prototype.createNotes = function (params, cb) {
    //         serverLog(stateOfX.serverLogType.info, "in create notes params is - " + JSON.stringify(params));
    //         db.findNotes({ playerId: params.playerId, forPlayerId: params.forPlayerId }, function (err, notesResponse) {
    //             serverLog(stateOfX.serverLogType.info, "notes response is in create notes - " + notesResponse);
    //             if (err) {
    //                 serverLog(stateOfX.serverLogType.info, "error in getNotes in createNotes in playerNotes");
    //                 cb({ success: false, info: dbMessages.DB_FINDNOTES_FAILED_PLAYERNOTES, isRetry: false, isDisplay: false, channelId: "" });
    //             } else if (!!notesResponse) {
    //                 serverLog(stateOfX.serverLogType.info, "notes for this player already exist");
    //                 cb({ success: false, info: dbMessages.DB_FINDNOTES_DUPLICATE_PLAYERNOTES, isRetry: false, isDisplay: false, channelId: "" });
    //             } else {
    //                 var dataToInsert = {
    //                     playerId: params.playerId,
    //                     forPlayerId: params.forPlayerId,
    //                     notes: params.notes,
    //                     color: params.color || null,
    //                     createdAt: Number(new Date())
    //                 }
    //                 db.createNotes(dataToInsert, function (err, notes) {
    //                     if (err || !notes) {
    //                         cb({ success: false, info: dbMessages.DB_CREATENOTES_FAILED_PLAYERNOTES, isRetry: false, isDisplay: false, channelId: "" });
    //                     } else {
    //                         cb({ success: true, info: dbMessages.DB_CREATENOTES_SUCCESS_PLAYERNOTES, isRetry: false, isDisplay: false, channelId: "" });
    //                     }
    //                 })
    //             }
    //         })
    //     }
    /*============================  END  =================================*/




    /*============================  START  =================================*/
    /**
     * this function updates already existing notes in the game
     * saved by player A for player B
     * @method updateNotes
     * @param  {object}    params request json object
     * @param  {Function}  cb     callback function
     */
    // New
    async updateNotes(params: any): Promise<any> {

        try {
            const notes = await this.db.updateNotes(params.query, params.updateKeys);

            if (!notes) {
                return {
                    success: false,
                    info: this.dbMessages.DB_UPDATENOTES_FAILED_PLAYERNOTES,
                    isRetry: false,
                    isDisplay: false,
                    channelId: ""
                };
            }

            return {
                success: true,
                info: this.dbMessages.DB_UPDATENOTES_SUCCESS_PLAYERNOTES,
                isRetry: false,
                isDisplay: false,
                channelId: ""
            };
        } catch (err) {
            return {
                success: false,
                info: this.dbMessages.DB_UPDATENOTES_FAILED_PLAYERNOTES,
                isRetry: false,
                isDisplay: false,
                channelId: ""
            };
        }
    };

    // Old
    // playerNotes.prototype.updateNotes = function (params, cb) {
    //         serverLog(stateOfX.serverLogType.info, "in update notes params is - " + JSON.stringify(params));
    //         db.updateNotes(params.query, params.updateKeys, function (err, notes) {
    //             if (err || !notes) {
    //                 cb({ success: false, info: dbMessages.DB_UPDATENOTES_FAILED_PLAYERNOTES, isRetry: false, isDisplay: false, channelId: "" });
    //             } else {
    //                 cb({ success: true, info: dbMessages.DB_UPDATENOTES_SUCCESS_PLAYERNOTES, isRetry: false, isDisplay: false, channelId: "" });
    //             }
    //         })
    //     }
    /*============================  END  =================================*/




    /*============================  START  =================================*/
    /**
     * this function delete already existing notes in the game
     * @method deleteNotes
     * @param  {object}    params request json object
     * @param  {Function}  cb     callback function
     */
    // New
    async deleteNotes(params: any): Promise<any> {

        try {
            const notes = await this.db.deleteNotes(params.query, params.updateKeys);

            if (!notes) {
                return {
                    success: false,
                    info: this.dbMessages.DB_DELETENOTES_FAILED_PLAYERNOTES,
                    isRetry: false,
                    isDisplay: false,
                    channelId: ""
                };
            }

            return {
                success: true,
                info: this.dbMessages.DB_DELETENOTES_SUCCESS_PLAYERNOTES,
                isRetry: false,
                isDisplay: false,
                channelId: ""
            };
        } catch (err) {
            return {
                success: false,
                info: this.dbMessages.DB_DELETENOTES_FAILED_PLAYERNOTES,
                isRetry: false,
                isDisplay: false,
                channelId: ""
            };
        }
    };

    // Old
    // playerNotes.prototype.deleteNotes = function (params, cb) {
    //         serverLog(stateOfX.serverLogType.info, "in delete notes params is - " + JSON.stringify(params));
    //         db.deleteNotes(params.query, params.updateKeys, function (err, notes) {
    //             if (err || !notes) {
    //                 cb({ success: false, info: dbMessages.DB_DELETENOTES_FAILED_PLAYERNOTES, isRetry: false, isDisplay: false, channelId: "" });
    //             } else {
    //                 cb({ success: true, info: dbMessages.DB_DELETENOTES_SUCCESS_PLAYERNOTES, isRetry: false, isDisplay: false, channelId: "" });
    //             }
    //         })
    //     }
    /*============================  END  =================================*/



    /*============================  START  =================================*/
    /**
     * this function gets the already created notes in the game
     * saved by player A for another player B
     * @method getNotes
     * @param  {object}   params request json object, contains both playerIds
     * @param  {Function} cb     callback functions
     */
    // New
    async getNotes(params: any): Promise<any> {

        try {
            const notes = await this.db.findNotes({ playerId: params.playerId, forPlayerId: params.forPlayerId });

            if (!notes) {
                return {
                    success: false,
                    info: this.dbMessages.DB_FINDNOTES_NOTFOUND_PLAYERNOTES,
                    isRetry: false,
                    isDisplay: false,
                    channelId: ""
                };
            }

            return {
                success: true,
                result: notes
            };
        } catch (err) {
            return {
                success: false,
                info: this.dbMessages.DB_FINDNOTES_NOTFOUND_PLAYERNOTES,
                isRetry: false,
                isDisplay: false,
                channelId: ""
            };
        }
    };

    // Old
    // playerNotes.prototype.getNotes = function (params, cb) {
    //         serverLog(stateOfX.serverLogType.info, "in get notes params is - " + JSON.stringify(params));
    //         db.findNotes({ playerId: params.playerId, forPlayerId: params.forPlayerId }, function (err, notes) {
    //             if (err || !notes) {
    //                 cb({ success: false, info: dbMessages.DB_FINDNOTES_NOTFOUND_PLAYERNOTES, isRetry: false, isDisplay: false, channelId: "" });
    //             } else {
    //                 cb({ success: true, result: notes });
    //             }
    //         })
    //     }
    /*============================  END  =================================*/

















}