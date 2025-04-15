import { Injectable } from "@nestjs/common";
import { systemConfig, stateOfX } from 'shared/common';
import { ImdbDatabaseService } from "shared/common/datebase/Imdbdatabase.service";
import { PokerDatabaseService } from "shared/common/datebase/pokerdatabase.service";
import { ActionHandlerService } from "./actionHandler.service";
import { BroadcastHandlerService } from "./broadcastHandler.service";
import { ChannelTimerHandlerService } from "./channelTimerHandler.service";
import { WalletService } from "apps/wallet/src/wallet.service";




declare const pomelo:any;



@Injectable()
export class RevertLockedHandlerService  {


    constructor(
        private db: PokerDatabaseService,
        private imdb: ImdbDatabaseService,
        private actionHandler:ActionHandlerService,
        private broadcastHandler:BroadcastHandlerService,
        private channelTimerHandler:ChannelTimerHandlerService,
        private wallet: WalletService
    ) {}






	/*=====================================  START  =========================*/
		// fetch inMemoryDb table

		// New
		async getDBTable(params: any): Promise<any> {
			try {
				const result = await this.imdb.getTable(params.channelId);
		
				if (result) {
					if (result.channelType === "TOURNAMENT" || result.table.channelType === "TOURNAMENT") {
						return { success: false, info: "revert won't work on tournament table!" };
					}
		
					params.table = result;
					return params;
				}
		
				return { success: false, info: 'No game is running on this table.' };
			} catch (err) {
				// Handle any error that occurs during the database call
				return { success: false, info: 'Error retrieving table from database.' };
			}
		};	

		// Old
		// var getDBTable = function (params, cb) {
		// 	imdb.getTable(params.channelId, function (err, result) {
		// 		if (!err && result) {
		// 			if (result.channelType == "TOURNAMENT" || result.table.channelType == "TOURNAMENT") {
		// 				cb({ success: false, info: "revert won't work on tournamen table!" });
		// 			}
		// 			params.table = result;
		// 			cb(null, params);
		// 			return;
		// 		}
		// 		cb({ success: false, info: 'No game is running on this table.' });
		// 	})
		// }
	/*=====================================  END  =========================*/

	/*=====================================  START  =========================*/
	// fetch all inMemoryDb tables list

	// New
	async getAllTables(params: any): Promise<any> {
		try {
			const tables = await this.imdb.getAllTable({});
			params.tables = tables;
			return params;
		} catch (err) {
			// Handle any error that occurs during the database call
			return err;
		}
	};


	//Old
	// var getAllTables = function (params, cb) {
	// 	imdb.getAllTable({}, function (err, tables) {
	// 		if (err) {
	// 			cb(err);
	// 			return;
	// 		}
	// 		params.tables = tables;
	// 		cb(null, params);
	// 	})
	// }
	/*=====================================  END  =========================*/

	/*=====================================  START  =========================*/
	// find table locked duration
	// check if allowed

	// new
	async lockedSince(params: any): Promise<any> {
		if (params.force) {
			return params;
		} else {
			if (params.table.isOperationOn) {
				const ct = Number(new Date());
				const lt = Number(new Date(params.table.operationStartTime));
				if (ct - lt > (params.allowedLockedTime * 1000)) {
					return params;
				} else {
					return { success: false, info: 'This is not enough time to revert it.', data: { isOperationOn: params.table.isOperationOn, operationStartTime: params.table.operationStartTime } };
				}
			} else {
				return { success: false, info: 'This table is not locked, So REVERT is disabled.' };
			}
		}
	};


	// Old
	// var lockedSince = function (params, cb) {
	// 	if (params.force) {
	// 		cb(null, params);
	// 		return;
	// 	} else {
	// 		if (params.table.isOperationOn) {
	// 			var ct = Number(new Date());
	// 			var lt = Number(new Date(params.table.operationStartTime));
	// 			if (ct - lt > (params.allowedLockedTime * 1000)) {
	// 				cb(null, params);
	// 				return;
	// 			} else {
	// 				cb({ success: false, info: 'This is not enough time to revert it.', data: { isOperationOn: params.table.isOperationOn, operationStartTime: params.table.operationStartTime } });
	// 				return;
	// 			}
	// 		} else {
	// 			// cb({success: false, info: 'This table is not locked, FORCE is also disabled'});
	// 			cb({ success: false, info: 'This table is not locked, So REVERT is disabled.' });
	// 			return;
	// 		}
	// 	}
	// }
	/*=====================================  END  =========================*/

	/*=====================================  START  =========================*/
	// now lock the table to perform operations

	// New
	async getTableLocked(params: any): Promise<any> {
		if (params.table.isOperationOn) {
			return params;
		} else {
			params.channelId = params.channelId || params.table.channelId;

			const result = await this.imdb.updateTableAndModify(
				{ channelId: params.channelId, isOperationOn: false },
				[],
				{ 
					$set: { isOperationOn: true, actionName: 'revertLockedTable', operationStartTime: new Date() },
					$inc: { _v: 1 }
				},
				{ upsert: false, new: true }
			);

			params.table = result.value;
			return params;
		}
	};


	// Old
	// var getTableLocked = function (params, cb) {
	// 	if (params.table.isOperationOn) {
	// 		cb(null, params);
	// 	} else {
	// 		params.channelId = params.channelId || params.table.channelId;
	// 		mongodb.inMemoryDb.collection("tables").findAndModify(
	// 			{ channelId: params.channelId, isOperationOn: false },
	// 			[],
	// 			{ $set: { isOperationOn: true, actionName: 'revertLockedTable', operationStartTime: (new Date()) }, $inc: { _v: 1 } },
	// 			{ upsert: false, new: true }, function (err, result) {
	// 				params.table = result.value;
	// 				cb(null, params);
	// 			})
	// 	}
	// }
	/*=====================================  END  =========================*/


	/*=====================================  START  =========================*/
	// player only game refunds
	// money is in three places - add all three
	// players[$].chips
	// players[$].chipsToBeAdded
	// contributors[$].amount

	// New
	async calculateRefunds(params: any): Promise<any> {
		const refunds: Record<string, any> = {};
		
		for (const contributor of params.table.contributors) {
			if (refunds[contributor.playerId]) {
				refunds[contributor.playerId].chips += (contributor.amount || 0);
			} else {
				refunds[contributor.playerId] = {
					points: contributor.points || 0,
					playerId: contributor.playerId,
					chips: (contributor.amount || 0)
				};
			}
		}

		params.isRealMoney = params.table.isRealMoney;
		params.refunds = refunds;
		
		return params;
	};

	// Old
	// var calculateRefunds = function (params, cb) {
	// 	var refunds = {};
	// 	// for (var i = 0; i < params.table.players.length; i++) {
	// 	// 	refunds[params.table.players[i].playerId] = {playerId: params.table.players[i].playerId, chips: ((params.table.players[i].chips||0) + (params.table.players[i].chipsToBeAdded||0))};
	// 	// }
	// 	for (var i = 0; i < params.table.contributors.length; i++) {
	// 		if (refunds[params.table.contributors[i].playerId]) {
	// 			refunds[params.table.contributors[i].playerId].chips += (params.table.contributors[i].amount || 0);
	// 		} else {
	// 			refunds[params.table.contributors[i].playerId] = {
	// 				points: params.table.contributors[i].points || 0,
	// 				playerId: params.table.contributors[i].playerId,
	// 				chips: (params.table.contributors[i].amount || 0)
	// 			};
	// 		}
	// 	}
	// 	params.isRealMoney = params.table.isRealMoney;
	// 	params.refunds = refunds;
	// 	cb(null, params);
	// }
	/*=====================================  END  =========================*/

	/*=====================================  START  =========================*/
	// refund player chips and inform

	// New

	async refundChipsAndBroadcast(params: any): Promise<any> {
		// Update player chips based on refunds
		for (const player of params.table.players) {
			const refund = params.refunds[player.playerId];
			if (refund) {
				player.chips += (refund.chips || 0);
				refund.refunded = true;
			}
		}

		// Process each refund
		for (const item of params.refunds) {
			if (!item.refunded) {
				try {
					// Find reference number
					const refNumber = await this.imdb.findRefrenceNumber({ playerId: item.playerId, channelId: params.table.channelId });
					params.referenceNumber = refNumber.length ? refNumber[0].referenceNumber : 'aa';

					// Prepare data for wallet operation
					const dataForWallet = {
						action: 'revert',
						line: 137,
						data: {
							playerId: item.playerId,
							isRealMoney: params.isRealMoney,
							points: item.points,
							chips: item.chips || 0,
							tableName: params.table.channelName,
							referenceNumber: params.referenceNumber
						}
					};

					// Send wallet broadcast
					const addChipsResponse = await this.wallet.sendWalletBroadCast(dataForWallet);
					item.refunded = addChipsResponse.success;

				} catch (err) {
					item.refunded = false;
				}
			}
		}

		return params;
	};



	// Old
	// var refundChipsAndBroadcast = function (params, cb) {
	// 	for (var i = 0; i < params.table.players.length; i++) {
	// 		if (params.refunds[params.table.players[i].playerId]) {
	// 			params.table.players[i].chips += (params.refunds[params.table.players[i].playerId].chips || 0);
	// 			params.refunds[params.table.players[i].playerId].refunded = true;
	// 		}
	// 	}
	// 	async.each(params.refunds, async function (item, ecb) {
	// 		if (item.refunded) {
	// 			ecb(null);
	// 		} else {
	// 			imdb.findRefrenceNumber({ playerId: item.playerId, channelId: params.table.channelId }, async function (err, refNumber) {
	// 				if (err || !refNumber.length) {
	// 					params.referenceNumber = 'aa'
	// 				}
	// 				else {
	// 					params.referenceNumber = refNumber[0].referenceNumber;
	// 				}
	// 				let dataForWallet = {
	// 					action: 'revert',
	// 					line: 137,
	// 					data: {
	// 						playerId: item.playerId,
	// 						isRealMoney: params.isRealMoney,
	// 						points: item.points,
	// 						chips: (item.chips || 0),
	// 						tableName: params.table.channelName,
	// 						referenceNumber: params.referenceNumber
	// 					}
	// 				}
	// 				let addChipsResponse = await wallet.sendWalletBroadCast(dataForWallet)
	// 				if (addChipsResponse.success) {
	// 					item.refunded = true;
	// 					ecb(null);
	// 				} else {
	// 					item.refunded = false;
	// 					ecb(null);
	// 				}
	// 			})
	// 		}
	// 	}, function (err) {
	// 		cb(null, params);
	// 	})
	// }
	/*=====================================  END  =========================*/


	/*=====================================  START  =========================*/
	// player game and table refunds
	// also add player chips
	// award in player profile

	// New
	async calculateRefundsAndReturnToPlayer(params: any): Promise<any> {
		if (params.channelType === "TOURNAMENT" || params.table.channelType === "TOURNAMENT") {
			return params;
		} else {
			const refunds: any = {};

			// Calculate refunds for each player
			for (const player of params.table.players) {
				const chipsToRefund = player.chips || 0;
				const lastRealChipBonus = player.lastRealChipBonus || 0;
				const totalRCB = player.totalRCB || 0;
				let refundinRCB = 0, refundinRC = 0;

				if (lastRealChipBonus <= totalRCB) {
					if (chipsToRefund - lastRealChipBonus > 0) {
						refundinRC = chipsToRefund - lastRealChipBonus;
						refundinRCB = chipsToRefund - refundinRC;
					} else {
						refundinRCB = chipsToRefund;
						refundinRC = 0;
					}
				} else {
					refundinRCB = chipsToRefund - lastRealChipBonus;
					refundinRC = 0;
				}

				refunds[player.playerId] = {
					playerId: player.playerId,
					points: player.points || 0,
					chips: refundinRC + (player.chipsToBeAdded || 0),
					bonusChips: refundinRCB + (player.chipsToBeAdded || 0),
				};
			}

			// Update refunds with contributors
			for (const contributor of params.table.contributors) {
				if (refunds[contributor.playerId]) {
					refunds[contributor.playerId].chips += contributor.amount || 0;
				} else {
					refunds[contributor.playerId] = {
						playerId: contributor.playerId,
						chips: contributor.amount || 0,
						points: 0,
						bonusChips: 0,
					};
				}
			}

			// Process each refund asynchronously
			for (const item of refunds) {
				try {
					const refNumber = await this.imdb.findRefrenceNumber({ playerId: item.playerId, channelId: params.table.channelName });
					params.referenceNumber = refNumber.length ? refNumber[0].referenceNumber : 'aa';

					// Prepare data for wallet operation
					const dataForWallet = {
						action: 'revert',
						line: 211,
						data: {
							playerId: item.playerId,
							isRealMoney: params.table.isRealMoney,
							points: item.points,
							chips: item.chips || 0,
							bonusChips: item.bonusChips || 0,
							tableName: params.table.channelName,
							referenceNumber: params.referenceNumber,
						},
					};

					// Send wallet broadcast
					const addChipsResponse = await this.wallet.sendWalletBroadCast(dataForWallet);
					item.refunded = addChipsResponse.success;

				} catch (err) {
					item.refunded = false;
				}
			}

			return params;
		}
	};

	// Old
	// var calculateRefundsAndReturnToPlayer = function (params, cb) {
	// 	if (params.channelType == "TOURNAMENT" || params.table.channelType == "TOURNAMENT") {
	// 		cb(null, params);
	// 	} else {
	// 		var refunds = {};
	// 		for (var i = 0; i < params.table.players.length; i++) {
	// 			var chipsToRefund = params.table.players[i].chips || 0;
	// 			var lastRealChipBonus = params.table.players[i].lastRealChipBonus || 0;
	// 			var totalRCB = params.table.players[i].totalRCB || 0;
	// 			var refundinRCB = 0, refundinRC = 0;
	// 			if (lastRealChipBonus <= totalRCB) {
	// 				if (chipsToRefund - lastRealChipBonus > 0) {
	// 					refundinRC = chipsToRefund - lastRealChipBonus;
	// 					refundinRCB = chipsToRefund - refundinRC;
	// 				} else {
	// 					refundinRCB = chipsToRefund;
	// 					refundinRC = 0
	// 				}
	// 			} else {
	// 				refundinRCB = chipsToRefund - lastRealChipBonus;
	// 				refundinRC = 0;
	// 			}
	// 			refunds[params.table.players[i].playerId] = {
	// 				playerId: params.table.players[i].playerId,
	// 				points: params.table.players[i].points || 0,
	// 				chips: ((refundinRC) + (params.table.players[i].chipsToBeAdded || 0)),
	// 				bonusChips: ((refundinRCB) + (params.table.players[i].chipsToBeAdded || 0))
	// 			};
	// 		}
	// 		for (var i = 0; i < params.table.contributors.length; i++) {
	// 			if (refunds[params.table.contributors[i].playerId]) {
	// 				refunds[params.table.contributors[i].playerId].chips += (params.table.contributors[i].amount || 0);
	// 			} else {
	// 				refunds[params.table.contributors[i].playerId] = { playerId: params.table.contributors[i].playerId, chips: (params.table.contributors[i].amount || 0) };
	// 			}
	// 		}
	// 		async.each(refunds, function (item, ecb) {
	// 			imdb.findRefrenceNumber({ playerId: item.playerId, channelId: params.table.channelId }, async function (err, refNumber) {
	// 				if (err || !refNumber.length) {
	// 					params.referenceNumber = 'aa'
	// 				}
	// 				else {
	// 					params.referenceNumber = refNumber[0].referenceNumber;
	// 				}
	// 				console.log("params in revrt", params)
	// 				console.log("params in revrt table", params.table)
	// 				let dataForWallet = {
	// 					action: 'revert',
	// 					line: 211,
	// 					data: {
	// 						playerId: item.playerId,
	// 						isRealMoney: params.table.isRealMoney,
	// 						points: item.points,
	// 						chips: (item.chips || 0),
	// 						bonusChips: (item.bonusChips || 0),
	// 						tableName: params.table.channelName,
	// 						referenceNumber: params.referenceNumber
	// 					}
	// 				}
	// 				let addChipsResponse = await wallet.sendWalletBroadCast(dataForWallet)
	// 				if (addChipsResponse.success) {
	// 					item.refunded = true;
	// 					ecb(null);
	// 				} else {
	// 					item.refunded = false;
	// 					ecb(null); // should it pass error?
	// 				}
	// 			})
	// 		}, function (err) {
	// 			cb(null, params);
	// 		})
	// 	}
	// }
	/*=====================================  END  =========================*/


	/*=====================================  START  =========================*/
	// reset table settings

	// New
	async resetTableAndPlayers(params: any): Promise<any> {
		params.table.state = "IDLE";
		params.table.roundId = null;
		params.table.deck = [];
		params.table.roundName = null;
		params.table.roundBets = [];
		params.table.roundMaxBet = 0;
		params.table.maxBetAllowed = 0;
		params.table.pot = [];
		params.table.contributors = [];
		params.table.roundContributors = [];
		params.table.boardCard = [[], []];
		params.table.preChecks = [];
		params.table.summaryOfAllPlayers = {};
		params.table.handHistory = [];
		params.table.isAllInOcccured = false;
		params.table.currentMoveIndex = -1;
		params.table._v = 0;

		// Resetting players
		for (const player of params.table.players) {
			console.log(stateOfX.serverLogType.info, `Setting player ${player.playerName} state as onbreak.`);
			player.state = stateOfX.playerState.onBreak;
			player.totalRoundBet = 0;
			player.lastMove = null;
		}

		return params;
	};

	// Old
	// var resetTableAndPlayers = function (params, cb) {
	// 	params.table.state = "IDLE";
	// 	params.table.roundId = null;
	// 	params.table.deck = [];
	// 	params.table.roundName = null;
	// 	params.table.roundBets = [];
	// 	params.table.roundMaxBet = 0;
	// 	params.table.maxBetAllowed = 0;
	// 	params.table.pot = [];
	// 	params.table.contributors = [];
	// 	params.table.roundContributors = [];
	// 	params.table.boardCard = [[], []];
	// 	params.table.preChecks = [];
	// 	params.table.summaryOfAllPlayers = {};
	// 	params.table.handHistory = [];
	// 	params.table.isAllInOcccured = false;
	// 	params.table.currentMoveIndex = -1;
	// 	params.table._v = 0;

	// 	// Resetting players
	// 	for (var i = 0; i < params.table.players.length; i++) {
	// 		// if(params.table.players[i].state === stateOfX.playerState.playing) {
	// 		console.log(stateOfX.serverLogType.info, 'Setting player ' + params.table.players[i].playerName + ' state as onbreak.')
	// 		params.table.players[i].state = stateOfX.playerState.onBreak;
	// 		params.table.players[i].totalRoundBet = 0;
	// 		params.table.players[i].lastMove = null;
	// 		// params.table.players[i].active  = false;
	// 		// }

	// 	}

	// 	cb(null, params);
	// }
	/*=====================================  END  =========================*/


	/*=====================================  START  =========================*/
	// broadcsat to inform about
	// table revert happened

	// New

	async broadcastEventInfo(params: any): Promise<any> {
		params.channel = params.app.get('channelService').getChannel(params.channelId, false);

		// Using setTimeout in an async manner
		await new Promise(resolve => setTimeout(resolve, 100));

		this.broadcastHandler.generalPlayerInfoAfterRevert({
			channelId: params.channelId,
			channel: params.channel,
			heading: 'table reset',
			info: 'Current Hand is reverted due to some technical issue. All the points has been refunded for this hand, Kindly SitIn again to play the next hand.'
		});

		return params;
	};


	// Old
	// var broadcastEventInfo = function (params, cb) {
	// 	params.channel = params.app.get('channelService').getChannel(params.channelId, false);
	// 	setTimeout(function () {
	//     broadcastHandler.generalPlayerInfoAfterRevert({channelId: params.channelId, channel: params.channel, heading: 'table reset',
	// 	info: 'Current Hand is reverted due to some technical issue. All the points has been refunded for this hand, Kindly SitIn again to play the next hand.'});

	// 		// params.channel.pushMessage(/*'channelInfo'*/ 'playerInfo', {channelId: params.channelId, heading: 'table reset',
	// 		// info: 'Current Hand is reverted due to some technical issue. All the money has been refunded for this hand, Kindly SitIn again to play the next hand.'});
	// 	}, 100);
	// 	cb(null, params);
	// }
	/*=====================================  END  =========================*/


	/*=====================================  START  =========================*/
	// broadcast to reset game view

	// New
	async broadcastGamePlayers(params: any): Promise<any> {
		// Broadcasting the game over message after revert
		this.broadcastHandler.generalGameOverAfterRevert({
			channelId: params.channelId,
			channel: params.channel,
			winners: []
		});

		// Broadcasting table players
		this.broadcastHandler.fireTablePlayersBroadcast({
			self: params.self,
			channelId: params.channelId,
			channel: params.channel,
			players: params.table.players,
			removed: []
		});

		// Triggering table idle timer
		this.channelTimerHandler.tableIdleTimer({
			channelId: params.channelId,
			channel: params.channel
		});

		return params;
	};

	// Old
	// var broadcastGamePlayers = function (params, cb) {
	// 	// params.channel.pushMessage('gameOver', {channelId: params.channelId, winners: []});
	// 	broadcastHandler.generalGameOverAfterRevert({ channelId: params.channelId, channel: params.channel, winners: [] })
	// 	broadcastHandler.fireTablePlayersBroadcast({ self: params.self, channelId: params.channelId, channel: params.channel, players: params.table.players, removed: [] });
	// 	channelTimerHandler.tableIdleTimer({ channelId: params.channelId, channel: params.channel });
	// 	cb(null, params);
	// }
	/*=====================================  END  =========================*/


	/*=====================================  START  =========================*/
	// now unlock the table

	// New
	async unlockTable (params: any): Promise<any> {
		params.channel.gameStartEventSet = "IDLE";
		params.table.isOperationOn = false;
		params.table.operationEndTime = new Date();

		// Using MongoDB's findAndModify (or MongoDB v4+ equivalent)
		const result = await this.imdb.updateTableAndModify(
			{ channelId: params.channelId, isOperationOn: true },
			[],
			{ $set: params.table },
			{ upsert: false, new: true }
		);

		if (result.value) {
			params.table = result.value;
		}

		return params;
	};

	// Old
	// var unlockTable = function (params, cb) {
	// 	params.channel.gameStartEventSet = "IDLE";
	// 	params.table.isOperationOn = false;
	// 	params.table.operationEndTime = (new Date());
	// 	mongodb.inMemoryDb.collection("tables").findAndModify(
	// 		{ channelId: params.channelId, isOperationOn: true },
	// 		[],
	// 		{ $set: params.table },
	// 		{ upsert: false, new: true }, function (err, result) {
	// 			if (!err && result) {
	// 				params.table = result.value;
	// 			}
	// 			cb(null, params);
	// 		})
	// }
	/*=====================================  END  =========================*/


	/*=====================================  START  =========================*/
	// render all players leave
	// altogether
	// not used now

	// New
	async broadcastLeave(params: any): Promise<any> {


		// Handle players' leave
		for (const item of params.table.players) {
			await this.actionHandler.handleLeave({
				self: params, session: {}, channel: params.channel,
				channelId: params.channelId,
				response: {
					playerLength: 0,
					isSeatsAvailable: false,
					broadcast: {
						success: true,
						channelId: params.channelId,
						playerId: item.playerId,
						playerName: item.playerName,
						isStandup: false
					}
				},
				request: { playerId: item.playerId, isStandup: false }
			});
		}

		// Handle members' leave
		for (const item of params.channel.getMembers()) {
			await this.actionHandler.handleLeave({
				self: params, session: {}, channel: params.channel,
				channelId: params.channelId,
				response: {
					playerLength: 0,
					isSeatsAvailable: false,
					broadcast: {
						success: true,
						channelId: params.channelId,
						playerId: item,
						playerName: item,
						isStandup: false
					}
				},
				request: { playerId: item, isStandup: false }
			});
		}

		return params;
	};


	// Old
	// var broadcastLeave = function (params, cb) {
	// 	async.each(params.table.players, function (item, ecb) {
	// 		actionHandler.handleLeave({
	// 			self: params, session: {}, channel: params.channel,
	// 			channelId: params.channelId,
	// 			response: {
	// 				playerLength: 0,
	// 				isSeatsAvailable: false,
	// 				broadcast: {
	// 					success: true,
	// 					channelId: params.channelId,
	// 					playerId: item.playerId,
	// 					playerName: item.playerName,
	// 					isStandup: false
	// 				}
	// 			},
	// 			request: { playerId: item.playerId, isStandup: false }
	// 		}); // loop
	// 		ecb()
	// 	}, function () {
	// 		// cb(null, params);
	// 		async.each(params.channel.getMembers(), function (item, ecb) {
	// 			actionHandler.handleLeave({
	// 				self: params, session: {}, channel: params.channel,
	// 				channelId: params.channelId,
	// 				response: {
	// 					playerLength: 0,
	// 					isSeatsAvailable: false,
	// 					broadcast: {
	// 						success: true,
	// 						channelId: params.channelId,
	// 						playerId: item,
	// 						playerName: item,
	// 						isStandup: false
	// 					}
	// 				},
	// 				request: { playerId: item, isStandup: false }
	// 			}); // loop
	// 			ecb()
	// 		}, function () {
	// 			cb(null, params);
	// 		})
	// 	})
	// }
	/*=====================================  END  =========================*/


	/*=====================================  START  =========================*/
	// delete table from inMemoryDb
	// and remove channel object
	// not used now

	// New
	async destroyTable(params: any): Promise<any> {
		const removeTableResp = await pomelo.app.rpc.database.tableRemote.removeTable({}, { channelId: params.channelId });

		// serverLog(stateOfX.serverLogType.error, removeTableResp);
		// serverLog(stateOfX.serverLogType.error, 'CHANNEL ' + channel.channelName + ' IS GOING TO BE DESTROYED!');
		params.channel.isTable = false;

		// params.channel.destroy();
		params.app.get('channelService').destroyChannel(params.channelId);

		// serverLog(stateOfX.serverLogType.error, 'CHANNEL HAS BEEN DESTROYED!');
		return params;
	}

	// Old
	// var destroyTable = function (params, cb) {
	// 	pomelo.app.rpc.database.tableRemote.removeTable({}, { channelId: params.channelId }, function (removeTableResp) {
	// 		// serverLog(stateOfX.serverLogType.error, removeTableResp);
	// 		// serverLog(stateOfX.serverLogType.error, 'CHANNEL ' + channel.channelName + ' IS GOING TO BE DESTROYED!');
	// 		params.channel.isTable = false;
	// 		// params.channel.destroy();
	// 		params.app.get('channelService').destroyChannel(params.channelId);
	// 		// serverLog(stateOfX.serverLogType.error, 'CHANNEL HAS BEEN DESTROYED!');
	// 		cb(null, params);
	// 	});
	// }
	/*=====================================  END  =========================*/



	/*=====================================  START  =========================*/

	// New
	
	async saveHistory(params: any): Promise<any> {
	
		if (params.channelType === "TOURNAMENT" || params.table.channelType === "TOURNAMENT") {
			params.table.isRevertedTable = true;
			// delete params.table._id;
	
			try {
				const result = await this.db.saveHistory(params.table);
				if (!result) {
					console.log("COULDN'T Store the tour history", result);
				} else {
					console.log("Stored tour history");
				}
			} catch (err) {
				console.log("COULDN'T Store the tour history", err);
			}
		}
	
		return params;
	};
	

	// Old
	// var saveHistory = function (params, cb) {
	// 	console.trace("i wasdfdksakdjdklkd", params)
	// 	if (params.channelType == "TOURNAMENT" || params.table.channelType == "TOURNAMENT") {
	// 		params.table.isRevertedTable = true;
	// 		// delete params.table._id;
	// 		db.saveHistory(params.table, (err, result) => {
	// 			if (err || !result) {
	// 				console.log("COULDN'T Store the tour histort", err, result)
	// 			} else {
	// 				console.log("Stored tour history")
	// 			}
	// 		})
	// 	}
	// 	cb(null, params);
	// }
	/*=====================================  END  =========================*/

	/*=====================================  START  =========================*/
	// delete table from inMemoryDb

	// New
	async deleteTable(params: any): Promise<any> {
		try {
			const result = await this.imdb.removeTable({ channelId: params.channelId || params.table.channelId });
			return params;
		} catch (err) {
			throw err;
		}
	};

	// Old
	// var deleteTable = function (params, cb) {
	// 	imdb.removeTable({ channelId: params.channelId || params.table.channelId }, function (err, result) {
	// 		if (err) {
	// 			return cb(err);
	// 		}
	// 		cb(null, params);
	// 	})
	// }
	/*=====================================  END  =========================*/


	/*=====================================  START  =========================*/
	// do tasks for every table from inMemoryDb

	// New
	async forEveryTable(params: any): Promise<any> {

		for (const table of params.tables) {
			params.table = table;

			try {
				await this.calculateRefundsAndReturnToPlayer(params);
				await this.saveHistory(params);
				await this.deleteTable(params);
			} catch (err) {
				throw err;
			}
		}

		return params;
	};

	// Old
	// var forEveryTable = function (params, cb) {
	// 	console.log("all tablesa ares adda", params.tables)
	// 	async.eachSeries(params.tables, function (table, ecb) {
	// 		params.table = table;
	// 		async.waterfall([
	// 			async.apply(function (params, cb) { cb(null, params); }, params),
	// 			calculateRefundsAndReturnToPlayer,
	// 			saveHistory,
	// 			deleteTable
	// 		], function (err, res) {
	// 			ecb(err, res);
	// 		})
	// 	}, function (err, result) {
	// 		cb(err, result)
	// 	})
	// }
	/*=====================================  END  =========================*/


	/*=====================================  START  =========================*/
	// revert a table from dashboard
	// put all players sitout
	// refunds of game

	// New

	async revertLockedTable(params: any): Promise<any> {
		try {
			// Retrieve the table from the database
			const dbTable = await this.getDBTable(params);
			// Check if the table is locked and since how long
			const lockedTime = await this.lockedSince(dbTable);
			const lockedTable = await this.getTableLocked({ ...params, table: dbTable, lockedTime });

			// Calculate refunds based on the table's state and contributors
			await this.calculateRefunds(lockedTable);

			// Refund chips and broadcast the result
			await this.refundChipsAndBroadcast(lockedTable);

			// Reset the table and players for the next round
			await this.resetTableAndPlayers(lockedTable);

			// Broadcast event info and game players' details
			await this.broadcastEventInfo(lockedTable);
			await this.broadcastGamePlayers(lockedTable);

			// Unlock the table for further operations
			await this.unlockTable(lockedTable);

			return { success: true, info: "Table has been reverted, refunds done." };
		} catch (err) {
			throw err;
		}
	};


	// Old
	// module.exports.revertLockedTable = function (params, cb) {
	// 	// msg = {channelId: '', lockedTime: 'numberSeconds'}
	// 	// get imdb table - 
	// 	// check if locked
	// 	// check locked time
	// 	// save this table
	// 	// calculate refund (pocket amt + pot contributions)
	// 	// process refund -> add chips -> broadcast
	// 	// channel -> leave broadcast
	// 	// channel -> info 'what just happened' brd
	// 	// destroy channel
	// 	// delete table
	// 	// return saved table object, success, players refund amt
	// 	async.waterfall([
	// 		async.apply(getDBTable, params),
	// 		lockedSince,
	// 		getTableLocked,
	// 		calculateRefunds,
	// 		refundChipsAndBroadcast,
	// 		resetTableAndPlayers,
	// 		broadcastEventInfo,
	// 		broadcastGamePlayers,
	// 		unlockTable
	// 		// broadcastLeave,
	// 		// destroyTable
	// 	], function (err, res) {
	// 		if (err) {
	// 			cb(err)
	// 		} else {
	// 			cb({ success: true, info: "table has been reverted, refunds done." });
	// 		}
	// 		// cb(err || res);
	// 	})
	// }
	/*=====================================  END  =========================*/



	/*=====================================  START  =========================*/
	// revert all tables on server start
	// refunds from game and table to profile

	// New
	async revertAllTables(params: any): Promise<any> {
		try {
			// Fetch all tables
			const allTables = await this.getAllTables(params);

			// Process each table
			await this.forEveryTable({ ...params, tables: allTables });

			return { success: true, info: "All tables have been deleted, refunds done." };
		} catch (err) {
			throw err;
		}
	};

	// Old
	// module.exports.revertAllTables = function (params, cb) {
	// 	params = params || {};
	// 	console.log('--- revertAllTables -- ');
	// 	async.waterfall([
	// 		async.apply(getAllTables, params),
	// 		forEveryTable
	// 	], function (err, res) {
	// 		if (err) {
	// 			return cb(err);
	// 		}
	// 		cb({ success: true, info: "All tables has been deleted, refunds done." });
	// 	})
	// }

	/*=====================================  END  =========================*/














}