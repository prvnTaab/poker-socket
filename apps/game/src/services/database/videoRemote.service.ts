import { Injectable } from "@nestjs/common";
import { popupTextManager } from "shared/common";
import { PokerDatabaseService } from "shared/common/datebase/pokerdatabase.service";
import stateOfX from "shared/common/stateOfX.sevice";












@Injectable()
export class VideoRemoteService {


    constructor(
        private readonly db:PokerDatabaseService
    ) {}




    // prepare MAIN platform step for video json data
// joinresponse + table settings
createJoinResponse(params: any): any {
	const players = params.table.players.map((player: any) => ({
		channelId: player.channelId,
		playerId: player.playerId,
		playerName: player.playerName,
		refrenceNumber: player.refrenceNumber,
		chips: player.chips,
		seatIndex: player.seatIndex,
		state: player.state,
		imageAvtar: player.imageAvtar,
		totalRoundBet: player.totalRoundBet,
		lastMove: player.lastMove,
		moves: player.moves,
		bestHands: player.bestHands,
		preCheck: player.preCheck,
		sitoutNextBigBlind: player.sitoutNextBigBlind,
		sitoutNextHand: player.sitoutNextHand,
		callTimeGameMissed: player.callTimeGameMissed,
		isTournamentSitout: player.tournamentData?.isTournamentSitout,
		playerCallTimer: player.playerCallTimer,
		playerScore: player.playerScore
	}));

	const roomConfig = {
		id: params.table.channelId,
		tableId: "",
		channelType: params.table.channelType,
		smallBlind: params.table.smallBlind,
		bigBlind: params.table.bigBlind,
		rabbit: params.table.buyRabbit || params.table.bigBlind,
		isStraddleEnable: params.table.isStraddleEnable,
		turnTime: params.table.turnTime,
		callTime: params.table.callTime,
		isCTEnabledTable: params.table.isCTEnabledTable,
		ctEnabledBufferTime: params.table.ctEnabledBufferTime,
		ctEnabledBufferHand: params.table.ctEnabledBufferHand,
		extraTurnTime: 2 * params.table.turnTime,
		channelName: params.table.channelName,
		channelVariation: params.table.channelVariation,
		isRealMoney: params.table.isRealMoney,
		minBuyIn: params.table.minBuyIn,
		maxBuyIn: params.table.maxBuyIn,
		minPlayers: params.table.minPlayers,
		maxPlayers: params.table.maxPlayers,
		info: params.table.gameInfo
	};

	const tableDetails = {
		channelType: params.table.channelType,
		roundId: params.table.roundId,
		smallBlind: params.table.smallBlind,
		bigBlind: params.table.bigBlind,
		turnTime: params.table.turnTime,
		callTime: params.table.callTime,
		isCTEnabledTable: params.table.isCTEnabledTable,
		ctEnabledBufferTime: params.table.ctEnabledBufferTime,
		ctEnabledBufferHand: params.table.ctEnabledBufferHand,
		extraTurnTime: 2 * params.table.turnTime,
		isStraddleEnable: params.table.isStraddleEnable,
		state: stateOfX.gameState.idle,
		roundCount: 0,
		roundName: params.table.roundName,
		roundBets: params.table.roundBets,
		roundMaxBet: params.table.roundMaxBet,
		maxBetAllowed: params.table.maxBetAllowed,
		pot: params.table.pot,
		boardCard: params.table.boardCard,
		dealerIndex: params.table.dealerIndex,
		smallBlindIndex: params.table.smallBlindIndex,
		bigBlindIndex: params.table.bigBlindIndex,
		straddleIndex: params.table.straddleIndex,
		currentMoveIndex: params.table.currentMoveIndex,
		minRaiseAmount: params.table.minRaiseAmount,
		maxRaiseAmount: params.table.maxRaiseAmount,
		totalPot: 0,
		isTimeBankUsed: false,
		totalTimeBank: null,
		timeBankLeft: null,
		additionalTurnTime: 0,
		remainingMoveTime: 0,
		players
	};

	const joinResponse = {
		success: true,
		tableDetails,
		roomConfig,
		channelId: params.table.channelId,
		tableId: "",
		playerId: "",
		playerName: "",
		cards: [],
		isJoinWaiting: false,
		isJoinedOnce: false,
		settings: {
			muteGameSound: true,
			dealerChat: false,
			playerChat: false,
			tableColor: 3,
			isMuckHand: false
		},
		antibanking: {
			isAntiBanking: false,
			amount: -1,
			timeRemains: -1
		},
		route: "room.channelHandler.joinChannel"
	};

	return joinResponse;
};

// prepare game players data for video json data
createGamePlyersResponse(params: any): any {
	const gamePlayers: any = {
		data: {
			removed: [],
			players: [],
			route: "gamePlayers"
		}
	};

	for (let i = 0; i < params.table.players.length; i++) {
		const player = params.table.players[i];
		gamePlayers.data.players.push({
			playerId: player.playerId,
			chips: player.chips,
			state: player.state,
			referenceNumber: player.referenceNumber,
			moves: [],
			playerName: player.playerName
			// Uncomment below if needed:
			// isCallTimeOver: player.playerCallTimer?.isCallTimeOver,
			// callTimeGameMissed: player.callTimeGameMissed
		});
	}

	return gamePlayers;
};

// update hand tab record for cards and video id
async updateHandTab(params: any): Promise<any> {
	try {
		const response = await this.db.updateHandTab(params.channelId, params.roundId, params.data);
		return {
			success: true,
			response: response,
			channelId: params.channelId,
			info: "video added successfully",
			isRetry: false,
			isDisplay: false
		};
	} catch (err) {
		return {
			success: false,
			channelId: params.channelId,
			info: popupTextManager.falseMessages.INSERTVIDEOLOGFAIL_ENTRYHANDLER,
			isRetry: false,
			isDisplay: false
		};
	}
};






}