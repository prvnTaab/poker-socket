
import { Injectable } from "@nestjs/common";
import async from "async";
import _ld from "lodash";
import _ from "underscore";
import { stateOfX , systemConfig, popupTextManager} from "shared/common";
// import cardAlgo from "../../../util/model/deck";
// import lockTable from "./lockTable";
import { ResponseHandlerService } from "./responseHandler.service";
import { validateKeySets } from "shared/common/utils/activity";
import { PokerDatabaseService } from "shared/common/datebase/pokerdatabase.service";
import { ImdbDatabaseService } from "shared/common/datebase/Imdbdatabase.service";

@Injectable()
export class TableRemoteService {
    
    constructor(private db: PokerDatabaseService,
        private imdb : ImdbDatabaseService,
        private responseHandler : ResponseHandlerService
    ){

    }


    // ### Deduct amount from player profile
    async deductChipsOnSit(params: any) {
        try {
        const validated = await validateKeySets("Request", params.serverType, "deductChipsOnSit", params);
        
        if (validated.success) {
                const response = await this.db.deductRealChips({ playerId: params.playerId }, params.chips);
                return { success: true };
            
        }
        return validated;
    } catch (err) {
        return { 
            success: false, 
            isRetry: false, 
            isDisplay: false, 
            channelId: "", 
            info: popupTextManager.dbQyeryInfo.DBDEDUCTREALCHIPS_DEDUCTCHIPSONSIT_TABLEREMOTE 
        };
    }
    }

    // Generate waiting player structure
    async generatePlayer(params: any) {
        
        const validated = await validateKeySets("Request", params.serverType, "generatePlayer", params);
        if (validated.success) {
            return { success: true, player: tableManager.createPlayer(params) };
        }
        return validated;
    }

    // #####################RIT_POT_DISTRIBUTION######################
    async getInMemoryTableDetails(params: any) {
        
        const validated = await validateKeySets("Request", params.serverType, "getInMemoryTableDetails", params);
        if (validated.success) {
            try {
                const response = await this.imdb.findTableByChannelId(params.channelId);
                if (response.isRunItTwiceTable) {
                    params.isRunItTwiceApplied = true;
                } else {
                    params.isRunItTwiceApplied = false;
                }
                return params;
            } catch (err) {
                return { 
                    success: false, 
                    isRetry: false, 
                    isDisplay: false, 
                    channelId: "", 
                    info: popupTextManager.dbQyeryInfo.DBDEDUCTREALCHIPS_DEDUCTCHIPSONSIT_TABLEREMOTE 
                };
            }
        }
        return validated;
    }

    // <<<<<<<<<<<<<<<<<<< RPC CALLS HANDLER STARTS >>>>>>>>>>>>>>>>>>>>>>>>>

    // ### Distribute cards to players
    async distributecards(params: any) {
        const validated = await validateKeySets("Request", "database", "distributecards", params);
        if (!validated.success) return validated;

        const lockTableResponse = await lockTable.lock({ 
            channelId: params.channelId, 
            actionName: "distributecards", 
            data: {} 
        });

        if (!lockTableResponse.success) return lockTableResponse;

        const successResponse = { success: true, players: lockTableResponse.data.players };
        const responseValidated = await validateKeySets("Response", "database", "distributecards", successResponse);
        
        return responseValidated.success ? successResponse : responseValidated;
    }

    // ### Get table config details
    async tableConfig(params: any) {
        const validated = await validateKeySets("Request", "database", "tableConfig", params);
        if (!validated.success) return validated;

        const lockTableResponse = await lockTable.lock({ 
            channelId: params.channelId, 
            actionName: "getTable", 
            data: {} 
        });

        if (!lockTableResponse.success) return lockTableResponse;

        const setGameStartKeysResponse = await this.responseHandler.setGameStartKeys({ 
            channelId: params.channelId, 
            table: lockTableResponse.table 
        });

        const responseValidated = await validateKeySets("Response", "database", "tableConfig", setGameStartKeysResponse);
        return responseValidated.success ? setGameStartKeysResponse : responseValidated;
    }

    // ### Handle sit out in next hand
    async sitoutNextHand(params: any) {
        const validated = await validateKeySets("Request", "database", "sitoutNextHand", params);
        if (!validated.success) return validated;

        const lockTableResponse = await lockTable.lock({ 
            channelId: params.channelId, 
            actionName: "sitoutNextHand", 
            data: params 
        });

        if (!lockTableResponse.success) return lockTableResponse;

        const responseValidated = await validateKeySets("Response", "database", "sitoutNextHand", lockTableResponse.data);
        return responseValidated.success ? lockTableResponse.data : responseValidated;
    }

    // ### Handle sit out in next big blind
    async sitoutNextBigBlind(params: any) {
        const validated = await validateKeySets("Request", "database", "sitoutNextBigBlind", params);
        if (!validated.success) return validated;

        const lockTableResponse = await lockTable.lock({ 
            channelId: params.channelId, 
            actionName: "sitoutNextBigBlind", 
            data: params 
        });

        if (!lockTableResponse.success) return lockTableResponse;

        const responseValidated = await validateKeySets("Response", "database", "sitoutNextBigBlind", lockTableResponse.data);
        return responseValidated.success ? lockTableResponse.data : responseValidated;
    }

    // Handle player action move
    async makeMove(params: any) {
        const validated = await validateKeySets("Request", "database", "makeMove", params);
        if (!validated.success) return validated;

        const lockTableResponse = await lockTable.lock({ 
            channelId: params.channelId, 
            actionName: "makeMove", 
            data: params 
        });

        if (!lockTableResponse.success) return lockTableResponse;

        const successResponse = lockTableResponse.data.response;

        const responseValidated = await validateKeySets("Response", "database", "makeMove", successResponse);
        return responseValidated.success ? successResponse : responseValidated;
    }

    async updatePrecheckOrMakeMove(params: any) {
        const lockTableResponse = await lockTable.lock({ 
            channelId: params.channelId, 
            actionName: "updatePrecheckOrMakeMove", 
            data: params 
        });

        if (!lockTableResponse.success) return lockTableResponse;

        if (lockTableResponse.data && lockTableResponse.data.moveResponse) {
            return { 
                success: true, 
                msg: lockTableResponse.data.msg || {}, 
                makeMoveResponse: lockTableResponse.data.moveResponse 
            };
        }
        return { success: true };
    }

    // Leave or standup a player
    async leave(params: any) {
        
        const validated = await validateKeySets("Request", "database", "leave", params);
        if (!validated.success) return validated;

        const lockTableResponse = await lockTable.lock({ 
            channelId: params.channelId, 
            actionName: "leave", 
            data: params 
        });

        if (!lockTableResponse.success) return lockTableResponse;

        const successResponse = lockTableResponse.data.response;

        const responseValidated = await validateKeySets("Response", "database", "leave", successResponse);
        return responseValidated.success ? successResponse : responseValidated;
    }

    // Handle additional game start cases (Auto ALLIN or GAME OVER)
    async processCases(params: any) {
        const validated = await validateKeySets("Request", "database", "processCases", params);
        if (!validated.success) return validated;

        const lockTableResponse = await lockTable.lock({ 
            channelId: params.channelId, 
            actionName: "processCases", 
            data: params 
        });

        return lockTableResponse;
    }

    // ### Auto sitout (mainly when no action taken)
    async autoSitout(params: any) {
        
        const validated = await validateKeySets("Request", "database", "autoSitout", params);
        if (!validated.success) return validated;

        const lockTableResponse = await lockTable.lock({ 
            channelId: params.channelId, 
            actionName: "autoSitout", 
            data: params 
        });

        return lockTableResponse;
    }

    // ### Resume player from sitout mode
    async resume(params: any) {
        const validated = await validateKeySets("Request", "database", "resume", params);
        if (!validated.success) return validated;

        const lockTableResponse = await lockTable.lock({ 
            channelId: params.channelId, 
            actionName: "resume", 
            data: params 
        });

        if (!lockTableResponse.success) return lockTableResponse;

        const responseValidated = await validateKeySets("Response", "database", "resume", lockTableResponse.data);
        return responseValidated.success ? lockTableResponse.data : responseValidated;
    }

    // ### Join player in waiting list for this channel
    async joinQueue(params: any) {
        const validated = await validateKeySets("Request", "database", "joinQueue", params);
        if (!validated.success) return validated;

        const lockTableResponse = await lockTable.lock({ 
            channelId: params.channelId, 
            actionName: "joinQueue", 
            data: params 
        });

        if (!lockTableResponse.success) return lockTableResponse;

        const responseValidated = await validateKeySets("Response", "database", "joinQueue", lockTableResponse);
        return responseValidated.success ? lockTableResponse.data : responseValidated;
    }

    // ### Set player attribute
    async setPlayerAttrib(params: any) {
        const validated = await validateKeySets("Request", "database", "setPlayerAttrib", params);
        if (!validated.success) return validated;

        const lockTableResponse = await lockTable.lock({ 
            channelId: params.channelId, 
            actionName: "setPlayerAttrib", 
            data: params 
        });

        return lockTableResponse.success ? lockTableResponse.data : lockTableResponse;
    }

    // ### Set player attribute
    async getTableAttrib(params: any) {
        const validated = await validateKeySets("Request", "database", "getTableAttrib", params);
        if (!validated.success) return validated;

        const lockTableResponse = await lockTable.lock({ 
            channelId: params.channelId, 
            actionName: "getTableAttrib", 
            data: params 
        });

        return lockTableResponse.success ? lockTableResponse.data : lockTableResponse;
    }

    // ### Set current player state as DISCONNECTED
    async setCurrentPlayerDisconn(params: any) {
        const validated = await validateKeySets("Request", "database", "setCurrentPlayerDisconn", params);
        if (!validated.success) return validated;

        const lockTableResponse = await lockTable.lock({ 
            channelId: params.channelId, 
            actionName: "setCurrentPlayerDisconn", 
            data: params 
        });

        return lockTableResponse.success ? lockTableResponse.data : lockTableResponse;
    }

    // ### Get attribute of any player on table
    async getPlayerAttribute(params: any) {
        const validated = await validateKeySets("Request", "database", "getPlayerAttribute", params);
        if (!validated.success) return validated;

        const lockTableResponse = await lockTable.lock({ 
            channelId: params.channelId, 
            actionName: "getPlayerAttribute", 
            data: params 
        });

        return lockTableResponse.success ? lockTableResponse.data : lockTableResponse;
    }

    // ### Get attribute of any player on table
    async getCurrentPlayer(params: any) {
        const validated = await validateKeySets("Request", "database", "getCurrentPlayer", params);
        if (!validated.success) return validated;

        const lockTableResponse = await lockTable.lock({ 
            channelId: params.channelId, 
            actionName: "getCurrentPlayer", 
            data: params 
        });

        return lockTableResponse.success ? lockTableResponse.data : lockTableResponse;
    }

    //### Add playes to table when tournament
    async addWaitingPlayerForTournament(params: any) {
        console.log("inside add waiting player for tournament--------------------", params);
        console.log(arguments);
        
        const validated = await validateKeySets("Request", "database", "addWaitingPlayerForTournament", params);
        if (!validated.success) return validated;

        params.serverType = "database";
        pomelo.app.get('channelService').getChannel(params.channelId, false);
        
        const generatePlayerResponse = await this.generatePlayer(params);
        if (!generatePlayerResponse.success) return generatePlayerResponse;

        const lockTableResponse = await lockTable.lock({ 
            channelId: params.channelId, 
            actionName: "addWaitingPlayerForTournament", 
            data: { player: generatePlayerResponse.player } 
        });

        if (!lockTableResponse.success) return lockTableResponse;

        const successResponse = { 
            success: true, 
            player: generatePlayerResponse.player, 
            table: lockTableResponse.table 
        };

        const responseValidated = await validateKeySets("Response", "database", "addWaitingPlayerForTournament", successResponse);
        return responseValidated.success ? successResponse : responseValidated;
    }

    // try starting a game on a channelId
    async startGameProcess(params: any) {
        const validated = await validateKeySets("Request", "database", "shouldStartGame", params);
        if (!validated.success) return validated;

        params.self = this;
        const lockTableResponse = await lockTable.lock({ 
            channelId: params.channelId, 
            actionName: "startGameProcess", 
            data: {}, 
            self: this 
        });

        if (!lockTableResponse.success) return lockTableResponse;

        return { 
            success: true, 
            data: lockTableResponse.data, 
            table: lockTableResponse.table 
        };
    }

    // ### Validate game condition to start or not
    async shouldStartGame(params: any) {
        const validated = await validateKeySets("Request", "database", "shouldStartGame", params);
        if (!validated.success) return validated;

        params.self = this;
        const lockTableResponse = await lockTable.lock({ 
            channelId: params.channelId, 
            actionName: "shouldStartGame", 
            data: {} 
        });

        if (!lockTableResponse.success) return lockTableResponse;

        const successResponse = { 
            success: true, 
            players: lockTableResponse.data.players, 
            removed: lockTableResponse.data.removed, 
            startGame: lockTableResponse.data.startGame, 
            table: lockTableResponse.table, 
            state: lockTableResponse.data.state, 
            preGameState: lockTableResponse.data.preGameState 
        };

        const responseValidated = await validateKeySets("Response", "database", "shouldStartGame", successResponse);
        return responseValidated.success ? successResponse : responseValidated;
    }

    async removeCloneTable(params: any) {
        console.log("strgstyf< - got a request to remote clone table, ", params);
        
        //set chnnaelId for queries
        let tmpChannelId = params.channelId.split("-")[0];
        
        try {
            const dbTables = await this.db.findLastTables({ channelId: { $regex: tmpChannelId } });
            if (!dbTables) {
                console.log("strgstyf< - not found any table in pokerDb");
                return { success: true, info: "not found any table in pokerDb" };
            }

            //calculate availablwe seats
            let totalSeats = dbTables[0].maxPlayers * dbTables.length;
            let playingPlayers = 0;
            
            const imdbTables = await this.imdb.getAllTable({ channelId: { $regex: tmpChannelId } });
            if (!imdbTables || !imdbTables[0]) {
                console.log("strgstyf< - remove all clone tables");
                if (dbTables.length > 1) {
                    for (let n = 0; n < dbTables.length; n++) {
                        if (dbTables[n].secondId > 1) {
                            try {
                                const res = await this.db.removeCloneTable({ channelId: dbTables[n].channelId });
                                broadcastHandler.fireBroadcastToAllSessions({ 
                                    app: {}, 
                                    data: { event: 'DISABLETABLE', _id: dbTables[n] }, 
                                    route: "removeTable" 
                                });
                                console.log("strgstyf< - err while removing a clone tables", dbTables[n].channelId, res);
                            } catch (err) {
                                console.log("strgstyf< - err while removing a clone tables", err);
                            }
                        }
                    }
                } else {
                    console.log("strgstyf< - only master table is avaialkfjhs");
                }
                return { success: true, info: "Tables removed successfully" };
            }

            //calculate occupied seats
            for (let i = 0; i < imdbTables.length; i++) {
                playingPlayers += imdbTables[i].players.length;
            }

            //calculate max required tables for occupied tables
            let totalRequiredTable = Math.ceil(playingPlayers / imdbTables[0].maxPlayers);
            
            // if all tables are full then we need a empty table
            if (playingPlayers === totalRequiredTable * imdbTables[0].maxPlayers) {
                totalRequiredTable++;
            }

            console.log("strgstyf< - 6r4tcee2ef playingPlayers", playingPlayers, "totalSeats", totalSeats, "totalRequiredTable", totalRequiredTable);

            // if there is any unnecessory table then we'll check if its running or not
            if (totalRequiredTable < dbTables.length) {
                let tablesToDelete = [];
                for (let j = 0; j < imdbTables.length; j++) {
                    for (let k = 0; k < dbTables.length; k++) {
                        if (imdbTables[j].channelId !== dbTables[k].channelId && !dbTables[k].isMasterTable && !imdbTables[j].players.length) {
                            tablesToDelete.push(dbTables[k].channelId);
                        }
                    }
                }

                tablesToDelete = _.uniq(tablesToDelete);
                for (let l = 0; l < tablesToDelete.length; l++) {
                    for (let m = 0; m < imdbTables.length; m++) {
                        if (imdbTables[m].channelId == tablesToDelete[l]) {
                            const index = tablesToDelete.indexOf(tablesToDelete[l]);
                            if (index !== -1) {
                                tablesToDelete.splice(index, 1);
                            }
                        }
                    }
                }

                console.log("strgstyf< - Below tables must be deleted:", tablesToDelete);
                for (let n = 0; n < tablesToDelete.length; n++) {
                    try {
                        const res = await this.db.removeCloneTable({ channelId: tablesToDelete[n], secondId: { $gt: 1 } });
                        broadcastHandler.fireBroadcastToAllSessions({ 
                            app: {}, 
                            data: { event: 'DISABLETABLE', _id: tablesToDelete[n] }, 
                            route: "removeTable" 
                        });
                        console.log("strgstyf< - err while removing a clone tables", res);
                    } catch (err) {
                        console.log("strgstyf< - err while removing a clone tables", err);
                    }
                }
                return { success: true, info: "Tables removed successfully" };
            } else {
                console.log("strgstyf< - no need to remove any table");
                return { success: true, info: "no need to remove any table" };
            }
        } catch (err) {
            console.log("strgstyf< - error in removeCloneTable", err);
            return { success: false, info: "Error removing tables" };
        }
    }

    // delete inmemory table
    async removeTable(params: any) {

        try {
            const data = await this.imdb.removeTable({ channelId: params.channelId });
            return { success: true, info: "Table removed successfully" };
        } catch (err) {
            return { 
                success: false, 
                isRetry: false, 
                isDisplay: false, 
                channelId: (params.channelId || ""), 
                info: popupTextManager.dbQyeryInfo.DBREMOVETABLEFAIL_TABLEREMOTE 
            };
        }
    }

    async removeCurrentTable(params: any) {
        try {
            const data = await this.imdb.removeCurrentPlayerWithChannelId({ channelId: params.channelId });
            return { success: true, info: "Table removed successfully" };
        } catch (err) {
            return { 
                success: false, 
                isRetry: false, 
                isDisplay: false, 
                channelId: (params.channelId || ""), 
                info: popupTextManager.dbQyeryInfo.DBREMOVETABLEFAIL_TABLEREMOTE 
            };
        }
    }

    // ### Create table object for a channel
    async createTable(params: any) {
        
        const validated = await validateKeySets("Request", "database", "createTable", params);
        if (!validated.success) return validated;

        
        if (params.channelVariation == stateOfX.channelVariation.roe) {
            params.channelVariation = stateOfX.channelVariation.holdem;
            params.isROE = true;
            params.currentChannelVariation = stateOfX.channelVariation.roe;
            params.channelRound = params.maxPlayers;
            params.channelRoundCount = 0;
            params.isPotLimit = false;
        }

        const table: any = {
            channelId: params.channelId,
            isMasterTable: params.isMasterTable,
            secondId: params.secondId,
            jwlLimit: params.jwlLimit,
            masterChannelId: params.masterChannelId,
            masterTableName: params.masterTableName,
            channelType: (params.channelType).toUpperCase(),
            channelName: params.channelName,
            serverId: params.serverId,
            channelVariation: params.channelVariation,
            turnTime: params.turnTime,
            callTime: params.callTime,
            isCTEnabledTable: params.isCTEnabledTable || false,
            ctEnabledBufferTime: params.ctEnabledBufferTime || false,
            ctEnabledBufferHand: params.ctEnabledBufferHand || false,
            isPotLimit: params.isPotLimit || false,
            maxPlayers: params.maxPlayers,
            minPlayers: params.minPlayers,
            smallBlind: params.smallBlind,
            bigBlind: params.bigBlind,
            isRabbitTable: params.isRabbitTable,
            buyRabbit: params.buyRabbit ? params.buyRabbit : params.bigBlind,
            isStraddleEnable: params.isStraddleEnable,
            minBuyIn: params.minBuyIn,
            maxBuyIn: params.maxBuyIn,
            numberOfRebuyAllowed: params.numberOfRebuyAllowed,
            hourLimitForRebuy: params.hourLimitForRebuy,
            gameInfo: params.gameInfo,
            rakeRules: params.rakeRule,
            rake: params.rake,
            gameInterval: params.gameInterval,
            isRealMoney: params.isRealMoney,
            rebuyHourFactor: params.rebuyHourFactor,
            isEvChopTable: params.isEvChopTable || false,
            evEquityFee: params.evEquityFee || 0,
            isPrivate: params.isPrivate,
            password: params.password,
            evPopupTime: params.evPopupTime || 0,
            ritPopupTime: params.ritPopupTime || 0,
            blindMissed: parseInt(`${systemConfig.blindMissed}`),
            tournamentRules: {},
            roundId: null,
            videoLogId: null,
            state: stateOfX.gameState.idle,
            stateInternal: stateOfX.gameState.starting,
            roundCount: 1,
            deck: cardAlgo.getCards(),
            players: [],
            onStartPlayers: [],
            queueList: [],
            handHistory: [],
            roundName: null,
            roundBets: [],
            roundMaxBet: 0,
            lastBetOnTable: 0,
            minRaiseAmount: 0,
            maxRaiseAmount: 0,
            raiseDifference: 0,
            considerRaiseToMax: 0,
            lastRaiseAmount: 0,
            isBettingRoundLocked: false,
            isRunItTwiceApplied: false,
            isRunItTwiceTable: params.isRunItTwiceTable,
            tableAutoStraddle: params.tableAutoStraddle,
            maxBetAllowed: 0,
            pot: [],
            contributors: [],
            roundContributors: [],
            boardCard: [[], []],
            preChecks: [],
            bestHands: [],
            dealerSeatIndex: -1,
            prevDealerseatIndex: -1,
            prevDealerIndex: -1,
            nextDealerSeatIndex: -1,
            smallBlindSeatIndex: -1,
            nextSmallBlindSeatIndex: -1,
            bigBlindSeatIndex: -1,
            dealerIndex: -1,
            smallBlindIndex: -1,
            bigBlindIndex: -1,
            straddleIndex: -1,
            currentMoveIndex: -1,
            firstActiveIndex: -1,
            turnTimeStartAt: null,
            timeBankStartedAt: null,
            isAllInOcccured: false,
            isOperationOn: false,
            actionName: "",
            operationStartTime: null,
            operationEndTime: null,
            createdAt: Number(new Date()),
            gameStartTime: Number(new Date()),
            lastBlindUpdate: Number(new Date()),
            blindLevel: 1,
            vacantSeats: 0,
            occupiedSeats: 0,
            isROE: params.isROE || false,
            channelRound: params.channelRound || 0,
            channelRoundCount: params.channelRoundCount || 1,
            currentChannelVariation: params.currentChannelVariation || params.channelVariation,
            _v: 1
        };

        if (table.channelType === stateOfX.gameType.tournament) {
            table.rebuyDataForBroadcast = {
                outOfMoneyPlayer: [],
                playingPlayer: [],
                endsAt: -1
            };
            table.tournamentType = params.tournament.tournamentType;
            table.tournamentName = params.tournamentName;
            table.shuffleTableId = "";
            table.gameVersionCount = params.gameVersionCount;
            table.noOfChipsAtGameStart = params.noOfChipsAtGameStart;
            table.tournamentRules.ranks = [];
            table.tournamentRules.timeBank = params.tournament.extraTimeAllowed;
            table.tournamentRules.entryFees = params.tournament.entryFees;
            table.tournamentRules.isGameRunning = true;
            table.tournamentRules.houseFees = params.tournament.houseFees;
            table.tournamentRules.isBountyEnabled = params.tournament.isBountyEnabled;
            table.tournamentRules.bountyFees = params.tournament.bountyFees;
            table.tournamentRules.totalPlayer = params.tournament.maxPlayersForTournament;
            table.tournamentRules.tournamentId = params.tournament.tournamentId;
            table.ante = params.ante;
            table.tournamentRules.winner = [];
        }

        if (!!params.tournament && params.tournament.tournamentType === stateOfX.tournamentType.sitNGo) {
            table.tournamentRules.prizeId = params.tournament.prizeRule;
        }

        if (!!params.tournament) {
            table.lateRegistrationAllowed = params.tournament.lateRegistrationAllowed;
            table.tournamentBreakDuration = params.tournament.tournamentBreakDuration;
            table.tournamentBreakTime = params.tournament.tournamentBreakTime;
            table.tournamentStartTime = params.tournament.tournamentStartTime;
            table.lateRegistrationTime = params.tournament.lateRegistrationTime || 0;
            table.isRebuyAllowed = params.tournament.isRebuyAllowed;
            table.rebuyTime = params.tournament.rebuyTime;
            table.isOnBreak = false;
            table.isTournamentRunning = true;
            table.addOnTime = params.tournament.addOnTime;
            table.addonRule = params.tournament.addonRule;
            table.breakLevel = 0;
            table.blindRuleData = params.tournament.blindRuleData || {};
            table.timeBankRuleData = params.tournament.timeBankRuleData || {};
            table.timeBankLeft = params.tournament.timeBankRuleData[0] && params.tournament.timeBankRuleData[0].blindLevel == 1 ? 
                params.tournament.timeBankRuleData[0].duration : 0;
            table.timeBankLevel = params.tournament.timeBankRuleData && params.tournament.timeBankRuleData[0] && 
                params.tournament.timeBankRuleData[0].blindLevel ? params.tournament.timeBankRuleData[0].blindLevel : 0;
            table.timeBankRule = params.tournament.timeBankRule;
            table.isAddOnAllowed = params.tournament.isAddOnAllowed;
            table.isBreakTimerStart = false;
            table.timerStarted = "";
        }

        if (!!params.tournament && params.tournament.tournamentType === stateOfX.tournamentType.satelite) {
            try {
                const tourDetail :any = await this.db.findTournamentRoom({
                    "tournamentName": params.tournament.parentTournament, 
                    "isActive": true
                });
                console.log("got this tourDetail while creating tabel for satellite", tourDetail);
                table.tournamentRules.parentId = tourDetail.tournamentId;
                table.tournamentRules.parentName = params.tournament.parentTournament;
            } catch (err) {
                console.log("error finding tournament room", err);
            }
        }

        
        try {
            const data = await this.imdb.saveTable(table);
            
            const successResponse = { success: true, table: table };
            const responseValidated = await validateKeySets("Response", "database", "createTable", successResponse);
            
            return responseValidated.success ? successResponse : responseValidated;
        } catch (err) {
            return { 
                success: false, 
                isRetry: false, 
                isDisplay: false, 
                channelId: (params.channelId || ""), 
                info: popupTextManager.dbQyeryInfo.DBSAVETABLEFAIL_TABLEREMOTE 
            };
        }
    }

    // ### Get complete table object from in memory database
    async getTable(params: any) {
        const validated = await validateKeySets("Request", "database", "getTable", params);
        if (!validated.success) return validated;

        const lockTableResponse = await lockTable.lock({ 
            channelId: params.channelId, 
            actionName: "getTable", 
            data: {} 
        });

        if (!lockTableResponse.success) return lockTableResponse;

        const successResponse = { success: true, table: lockTableResponse.table };
        const responseValidated = await validateKeySets("Response", "database", "getTable", successResponse);
        
        return responseValidated.success ? successResponse : responseValidated;
    }

    // ### Sit a player into table
    async addWaitingPlayer(params: any) {
        const validated = await validateKeySets("Request", "database", "addWaitingPlayer", params);
        if (!validated.success) return validated;

        params.serverType = "database";
        
        const tableDetailsResponse = await this.getInMemoryTableDetails(params);
        if (!tableDetailsResponse.success) return tableDetailsResponse;

        const generatePlayerResponse = await this.generatePlayer(params);
        if (!generatePlayerResponse.success) return generatePlayerResponse;

        const lockTableResponse = await lockTable.lock({ 
            channelId: params.channelId, 
            actionName: "addWaitingPlayer", 
            data: { player: generatePlayerResponse.player } 
        });

        if (!lockTableResponse.success) return lockTableResponse;

        const successResponse = { 
            success: true, 
            player: generatePlayerResponse.player, 
            table: lockTableResponse.table 
        };

        const responseValidated = await validateKeySets("Response", "database", "addWaitingPlayer", successResponse);
        return responseValidated.success ? successResponse : responseValidated;
    }

    // fetch buy in details of table
    async tableBuyIn(params: any) {
        const validated = await validateKeySets("Request", "database", "tableBuyIn", params);
        if (!validated.success) return validated;

        const lockTableResponse = await lockTable.lock({ 
            channelId: params.channelId, 
            actionName: "tableBuyIn", 
            data: {} 
        });

        if (!lockTableResponse.success) return lockTableResponse;

        const successResponse = { 
            success: true, 
            tableMinBuyIn: lockTableResponse.data.tableMinBuyIn, 
            tableMaxBuyIn: lockTableResponse.data.tableMaxBuyIn, 
            isStraddleEnable: lockTableResponse.data.isStraddleEnable, 
            smallBlind: lockTableResponse.data.smallBlind, 
            bigBlind: lockTableResponse.data.bigBlind 
        };

        const responseValidated = await validateKeySets("Response", "database", "tableBuyIn", successResponse);
        return responseValidated.success ? successResponse : responseValidated;
    }

    // Add chips into player table buyin direct from table
    async buyRabbit(params: any) {
        const validated = await validateKeySets("Request", "database", "buyRabbit", params);
        if (!validated.success) return validated;

        try {
            const table = await this.imdb.findTableByChannelId(params.channelId);
            if (!table) {
                return { success: false, info: 'Table not Found!' };
            }

            params.table = table;
            const response = await tableManager.buyRabbit(params);
            console.log("response from tableManager.buyRabbit");

            if (response.success) {
                return { success: true, table: response.table, info: response.info };
            }
            return response;
        } catch (err) {
            return { success: false, info: 'Error finding table' };
        }
    }

    async addChipsOnTable(params: any) {
        const validated = await validateKeySets("Request", "database", "addChipsOnTable", params);
        if (!validated.success) return validated;

        const lockTableResponse = await lockTable.lock({ 
            channelId: params.channelId, 
            actionName: "addChipsOnTable", 
            data: params 
        });

        return lockTableResponse.success ? lockTableResponse.data : lockTableResponse;
    }

    // Add chips into player directly in tournament in rebuy option
    async addChipsOnTableInTournament(params: any) {
        const validated = await validateKeySets("Request", "database", "addChipsOnTable", params);
        if (!validated.success) return validated;

        const lockTableResponse = await lockTable.lock({ 
            channelId: params.channelId, 
            actionName: "addChipsOnTableInTournament", 
            data: params 
        });

        return lockTableResponse.success ? lockTableResponse.data : lockTableResponse;
    }

    // toggle autoRebuy enabled key in player object in inmemory
    async updateAutoRebuy(params: any) {
        const lockTableResponse = await lockTable.lock({ 
            channelId: params.channelId, 
            actionName: "updateAutoRebuy", 
            data: params 
        });

        if (lockTableResponse.success) {
            lockTableResponse.data.success = true;
            return lockTableResponse.data;
        }
        return lockTableResponse;
    }

    // toggle isAutoAddOn enabled key in player object in inmemory
    async updateAutoAddon(params: any) {
        const lockTableResponse = await lockTable.lock({ 
            channelId: params.channelId, 
            actionName: "updateAutoAddon", 
            data: params 
        });

        if (lockTableResponse.success) {
            lockTableResponse.data.success = true;
            return lockTableResponse.data;
        }
        return lockTableResponse;
    }

    // ### Reset player sitout option if player uncheck sitout options
    async resetSitout(params: any) {
        const validated = await validateKeySets("Request", "database", "resetSitout", params);
        if (!validated.success) return validated;

        const lockTableResponse = await lockTable.lock({ 
            channelId: params.channelId, 
            actionName: "resetSitout", 
            data: params 
        });

        return lockTableResponse;
    }

    // ### Check if any player with same IP
    async isSameNetworkSit(params: any) {
        const validated = await validateKeySets("Request", "database", "isSameNetworkSit", params);
        if (!validated.success) return validated;

        const lockTableResponse = await lockTable.lock({ 
            channelId: params.channelId, 
            actionName: "isSameNetworkSit", 
            data: params 
        });

        return lockTableResponse;
    }

    // Get table details for client request
    async getTableView(params: any) {
        const validated = await validateKeySets("Request", "database", "getTableView", params);
        if (!validated.success) return validated;

        try {
            const table = await this.imdb.getTable(params.channelId);
            if (!table) {
                try {
                    const dbTable = await this.db.findTableById(params.channelId);
                    if (!dbTable) {
                        return { 
                            success: false, 
                            isRetry: false, 
                            isDisplay: true, 
                            channelId: (params.channelId || ""), 
                            info: popupTextManager.dbQyeryInfo.DBGETTABLE_GETTABLEVIEW_TABLEREMOTE 
                        };
                    }
                    return await this.responseHandler.setTableViewKeys({ 
                        table: dbTable, 
                        channelId: params.channelId, 
                        playerId: params.playerId, 
                        deviceType: params.deviceType 
                    });
                } catch (err) {
                    return { 
                        success: false, 
                        isRetry: false, 
                        isDisplay: true, 
                        channelId: (params.channelId || ""), 
                        info: popupTextManager.dbQyeryInfo.DBGETTABLE_GETTABLEVIEW_TABLEREMOTE 
                    };
                }
            }
            return await this.responseHandler.setTableViewKeys({ 
                table: table, 
                channelId: params.channelId, 
                playerId: params.playerId 
            });
        } catch (err) {
            return { 
                success: false, 
                isRetry: false, 
                isDisplay: true, 
                channelId: (params.channelId || ""), 
                info: popupTextManager.dbQyeryInfo.DBGETTABLE_GETTABLEVIEW_TABLEREMOTE 
            };
        }
    }

    // ### Shuffle players for tournament, lock table here
    async shufflePlayers(params: any) {
        const validated = await validateKeySets("Request", "database", "shufflePlayers", params);
        if (!validated.success) return validated;

        const lockTableResponse = await lockTable.lock({ 
            channelId: params.channelId, 
            actionName: "shufflePlayers", 
            data: params 
        });

        return lockTableResponse.success ? lockTableResponse.data : lockTableResponse;
    }

    // Create event log (Dealer chat and hand history storage)
    async createLog(params: any) {
        const validated = await validateKeySets("Request", "database", "createLog", params);
        if (!validated.success) return validated;

        const lockTableResponse = await lockTable.lock({ 
            channelId: params.channelId, 
            actionName: "createLog", 
            data: params.data 
        });

        return lockTableResponse;
    }

    // ### Get all the occupied seats
    async seatOccupied(params: any) {
        const validated = await validateKeySets("Request", "database", "seatOccupied", params);
        if (!validated.success) return validated;

        const lockTableResponse = await lockTable.lock({ 
            channelId: params.channelId, 
            actionName: "seatOccupied", 
            data: {} 
        });

        if (!lockTableResponse.success) return lockTableResponse;

        const successResponse = { 
            success: true, 
            indexOccupied: lockTableResponse.data.indexOccupied 
        };

        const responseValidated = await validateKeySets("Response", "database", "seatOccupied", successResponse);
        return responseValidated.success ? successResponse : responseValidated;
    }

    // ### Check if player is not already playing on table
    async isPlayerNotOnTable(params: any) {
        const validated = await validateKeySets("Request", "database", "isPlayerNotOnTable", params);
        if (!validated.success) return validated;

        const lockTableResponse = await lockTable.lock({ 
            channelId: params.channelId, 
            actionName: "isPlayerNotOnTable", 
            data: { playerId: params.playerId } 
        });

        if (!lockTableResponse.success) return lockTableResponse;

        const successResponse = { 
            success: true, 
            table: lockTableResponse.table 
        };

        const responseValidated = await validateKeySets("Response", "database", "isPlayerNotOnTable", successResponse);
        return responseValidated.success ? successResponse : responseValidated;
    }

    // ### Deduct blind amount from Blind players
    async deductBlinds(params: any) {
        const validated = await validateKeySets("Request", "database", "deductBlinds", params);
        if (!validated.success) return validated;

        const lockTableResponse = await lockTable.lock({ 
            channelId: params.channelId, 
            actionName: "deductBlinds", 
            data: { playerId: params.playerId } 
        });

        if (!lockTableResponse.success) return lockTableResponse;

        const responseValidated = await validateKeySets("Response", "database", "deductBlinds", lockTableResponse.data);
        
        
        return responseValidated.success ? lockTableResponse.data : responseValidated;
    }

    // ### Set game start variables - dealer, blind etc.
    async setGameConfig(params: any) {
        const validated = await validateKeySets("Request", "database", "setGameConfig", params);
        if (!validated.success) return validated;

        const lockTableResponse = await lockTable.lock({ 
            channelId: params.channelId, 
            actionName: "setGameConfig", 
            data: {} 
        });

        if (!lockTableResponse.success) return lockTableResponse;

        const successResponse = { success: true };
        const responseValidated = await validateKeySets("Response", "database", "setGameConfig", successResponse);
        
        return responseValidated.success ? successResponse : responseValidated;
    }

    // leave tournament
    async leaveTournament(params: any) {
        const lockTableResponse = await lockTable.lock({ 
            channelId: params.channelId, 
            actionName: "leaveTournament", 
            data: { channelId: params.channelId, playerId: params.playerId } 
        });
        return lockTableResponse;
    }

    // get player chips balance
    async getPlayerChipsWithFilter(params: any) {
        const lockTableResponse = await lockTable.lock({ 
            channelId: params.channelId, 
            actionName: "getPlayerChipsWithFilter", 
            data: { channelId: params.channelId, playerId: params.playerId, key: params.key } 
        });

        return lockTableResponse;
    }

    // handle sitting player disconnections
    async handleDisconnection(params: any) {
        
        const lockTableResponse = await lockTable.lock({ 
            channelId: params.channelId, 
            actionName: "handleDisconnection", 
            data: { channelId: params.channelId, playerId: params.playerId } 
        });

        return lockTableResponse;
    }

    // get chips total a player has on various tables
    async getTotalGameChips(params: any) {
        let totalRealChips = 0;
        let totalPlayChips = 0;

        await Promise.all(params.channels.map(async (channelId: string) => {
            const result = await this.getPlayerChipsWithFilter({ 
                channelId: channelId, 
                playerId: params.playerId, 
                key: 'chips' 
            });
            
            totalRealChips += result.success ? (result.data ? (result.data.isRealMoney ? result.data.value : 0) : 0) : 0;
            totalPlayChips += result.success ? (result.data ? (result.data.isRealMoney ? 0 : result.data.value) : 0) : 0;
        }));

        return { success: true, realChips: totalRealChips, playChips: totalPlayChips };
    }

    //handles tip to dealer
    async processTip(params: any) {
        const lockTableResponse = await lockTable.lock({ 
            channelId: params.channelId, 
            actionName: "TIPDEALER", 
            data: { channelId: params.channelId, playerId: params.playerId, chips: params.chips } 
        });

        return lockTableResponse;
    }
}
