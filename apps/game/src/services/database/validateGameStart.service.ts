import { Injectable } from "@nestjs/common";
import _ld from "lodash";
import { ImdbDatabaseService } from "shared/common/datebase/Imdbdatabase.service";
import _ from "underscore";
import { v4 as uuid } from "uuid";
import { TableManagerService } from "./tableManager.service";
import { TableConfigManagerService } from "./tableConfigManager.service";
import stateOfX from "shared/common/stateOfX.sevice";
import { UtilsService } from "../../utils/utils.service";
import { validateKeySets } from "shared/common/utils/activity";
import { systemConfig } from "shared/common";




//   cardAlgo = require("../../../util/model/deck"),
//   cardAlgoShortDeck = require("../../../util/model/shortDeck"),
//   randy = require("../../../util/model/randy"),

@Injectable()
export class ValidateGameStartService  {


    constructor(
        private readonly imdb:ImdbDatabaseService,
        private readonly videoRemote:VideoRemoteService,
        private readonly tableManager:TableManagerService,
        private readonly tableConfigManager:TableConfigManagerService,
        private readonly utilsService:UtilsService
    ) {}




    // ### Reset player state (Specially for tournament)
async resetPlayerState(params: any): Promise<any> {

  if (params.table.channelType !== stateOfX.gameType.tournament) {
    return params;
  }

  for (const player of params.table.players) {
    console.log('inside resetPlayerState', player.playerName);

    if (player.state === stateOfX.playerState.disconnected) {
      player.state = stateOfX.playerState.onBreak;
    }

    if (player.chips === 0) {
      console.log(player.playerName + ' has ' + player.chips + ', setting outOfMoney state!');
      player.state = stateOfX.playerState.outOfMoney;
    }

    if (player.chips > 0 && player.state === stateOfX.playerState.outOfMoney) {
      player.state = stateOfX.playerState.waiting;
    }

    player.precheckValue = stateOfX.playerPrecheckValue.NONE;
    player.onGameStartBuyIn = player.chips;
  }

  return params;
}


async getPlayerScore(params: any): Promise<any> {

  try {
    const res = await this.imdb.getAllPlayerBuyInSum({ channelId: params.channelId });

    for (const player of params.table.players) {
      let refNumber: any[] = [];
      try {
        refNumber = await this.imdb.findRefrenceNumber({ playerId: player.playerId, channelId: params.channelId });
      } catch {
        refNumber = [];
      }

      const Refnumber = refNumber.length > 0 ? refNumber[0].referenceNumber : 'N/F';
      player.refrenceNumber = Refnumber || 'NOTFOUND';

      const pMatch = res.filter((entry: any) => entry._id === player.playerId);
      if (pMatch.length) {
        player.playerScore = this.utilsService.convertIntToDecimal(player.chips - (pMatch[0]?.totalBuyIns || 0));
      }
    }

    return params;

  } catch (err) {
    console.log(err);
    return params;
  }
}

//  Added By Sahiq -- Changing player state if last player move was taken by system
async sittingOutPlayers(params: any): Promise<any> {
  for (const players of params.table.players) {
    if (players.state === stateOfX.playerState.playing && players.systemFoldedCount > 1) {
      players.state = stateOfX.playerState.onBreak;
    }
  }

  return params;
}

// Validate if Game is going to start or not
// Start considering players only if true
async isGameGoingToStart(params: any): Promise<any> {
  const waitingPlayers = _.where(params.table.players, { state: stateOfX.playerState.waiting });

  if (params.table.channelType === stateOfX.gameType.tournament) {
    params.tempData.startConsiderPlayer = false;
    for (let i = 0; i < params.table.players.length; i++) {
      if (params.table.players[i].state === stateOfX.playerState.waiting) {
        params.table.players[i].state = stateOfX.playerState.playing;
        params.table.players[i].active = true;
        params.table.players[i].isWaitingPlayer = false;
      }
    }
    return params;
  }

  for (let i = 0; i < params.table.players.length; i++) {
    if (params.table.players[i].state === stateOfX.playerState.disconnected) {
      params.table.players[i].state = stateOfX.playerState.onBreak;
    }
  }

  const onBreakCTPlayer = _.filter(params.table.players, (player) => {
    return (
      player.state === stateOfX.playerState.onBreak &&
      params.table.isCTEnabledTable &&
      player.playerScore > 0 &&
      (
        (player.playerCallTimer.status === false && player.callTimeGameMissed <= params.table.ctEnabledBufferHand) ||
        (player.playerCallTimer.status === true && !player.playerCallTimer.isCallTimeOver)
      )
    );
  });

  const playingPlayers = _.where(params.table.players, { state: stateOfX.playerState.playing });

  if (waitingPlayers.length + playingPlayers.length + onBreakCTPlayer.length < params.table.minPlayers) {
    throw {
      success: true,
      channelId: params.channelId,
      isRetry: false,
      isDisplay: false,
      info: 'Less players than to start game - ' + params.table.minPlayers
    };
  }

  for (let i = 0; i < onBreakCTPlayer.length; i++) {
    onBreakCTPlayer[i].state = stateOfX.playerState.onBreak;
    onBreakCTPlayer[i].active = true;
    onBreakCTPlayer[i].isWaitingPlayer = false;
    onBreakCTPlayer[i].hasPlayedOnceOnTable = true;
  }

  for (let i = 0; i < playingPlayers.length; i++) {
    playingPlayers[i].active = true;
    playingPlayers[i].isWaitingPlayer = false;
    playingPlayers[i].hasPlayedOnceOnTable = true;
  }

  if (playingPlayers.length + onBreakCTPlayer.length === 0 && waitingPlayers.length > 1) {
    params.tempData.startConsiderPlayer = false;
    for (let i = 0; i < waitingPlayers.length; i++) {
      waitingPlayers[i].state = stateOfX.playerState.playing;
      waitingPlayers[i].active = true;
      waitingPlayers[i].isWaitingPlayer = false;
      waitingPlayers[i].hasPlayedOnceOnTable = true;
    }
    return params;
  }

  if (waitingPlayers.length + playingPlayers.length + onBreakCTPlayer.length === params.table.minPlayers) {
    params.tempData.startConsiderPlayer = false;
    for (let i = 0; i < waitingPlayers.length; i++) {
      waitingPlayers[i].state = stateOfX.playerState.playing;
      waitingPlayers[i].active = true;
      waitingPlayers[i].isWaitingPlayer = false;
      waitingPlayers[i].entryPlayer = true;
    }
    return params;
  }

  if (
    waitingPlayers.length + playingPlayers.length + onBreakCTPlayer.length !== params.table.minPlayers &&
    playingPlayers.length + onBreakCTPlayer.length >= 1
  ) {
    params.tempData.startConsiderPlayer = true;
  }

  return params;
}

// start consider players
// SPECIAL CAUTION - player sitting between D,SB,BB may not become part of game even if they are ready to play
async startConsiderPlayers(params: any): Promise<any> {
  if (params.table.channelType === stateOfX.gameType.tournament) {
    return params;
  }

  if (params.tempData.startConsiderPlayer) {
    const indexBetweenSBandBB = await this.tableManager.indexBetweenSBandBB(params);
    const waitingPlayers = _.where(params.table.players, { state: stateOfX.playerState.waiting });

    for (const player of waitingPlayers) {
      const playerIndexInPlayers = _ld.findIndex(params.table.players, { playerId: player.playerId });

      if (player.hasPlayedOnceOnTable || (!player.hasPlayedOnceOnTable && player.isForceBlindEnable)) {
        params.table.players[playerIndexInPlayers].state = stateOfX.playerState.playing;
        params.table.players[playerIndexInPlayers].active = true;

        if (!player.hasPlayedOnceOnTable && player.isForceBlindEnable) {
          params.table.players[playerIndexInPlayers].isWaitingPlayer = true;
          params.table.players[playerIndexInPlayers].entryPlayer = true;
        } else {
          params.table.players[playerIndexInPlayers].isWaitingPlayer = false;
          params.table.players[playerIndexInPlayers].hasPlayedOnceOnTable = true;
        }
      } else {
        params.table.players[playerIndexInPlayers].state = stateOfX.playerState.playing;
        params.table.players[playerIndexInPlayers].active = true;
        params.table.players[playerIndexInPlayers].isWaitingPlayer = true;
        params.table.players[playerIndexInPlayers].tempPlaying = true;
        params.table.players[playerIndexInPlayers].entryPlayer = true;
      }
    }

    return params;
  } else {
    return params;
  }
}


async decidingPlayingPlayers(params: any): Promise<any> {
  if (params.table.channelType === stateOfX.gameType.tournament) {
    return params;
  }

  if (params.tempData.startConsiderPlayer) {
    await this.tableConfigManager.nextGameConfig(params);
    return params;
  } else {
    return params;
  }
}

// ### Sort players indexes
// > (NOTE: Keep non-playng players at the end of players array list)
async sortPlayerIndexes(params: any): Promise<any> {
  const validated = await validateKeySets("Request", params.serverType, "sortPlayerIndexes", params);

  if (!validated.success) {
    throw validated;
  }

  // Sort players by seatIndex
  params.table.players.sort((a, b) => parseInt(a.seatIndex) - parseInt(b.seatIndex));

  const playingPlayers: any[] = [];
  const inactivePlayers: any[] = [];

  for (const player of params.table.players) {
    const isCTEligible =
      params.table.isCTEnabledTable &&
      player.playerScore > 0 &&
      (
        (player.playerCallTimer.status === false && player.callTimeGameMissed <= params.table.ctEnabledBufferHand) ||
        (player.playerCallTimer.status === true && !player.playerCallTimer.isCallTimeOver)
      );

    if (player.state !== stateOfX.playerState.playing && !isCTEligible) {
      inactivePlayers.push(player);
    } else {
      playingPlayers.push(player);
    }
  }

  params.table.players = playingPlayers.concat(inactivePlayers);
  return params;
}


// If enough players to start the game
async isEnoughPlayingPlayers(params: any): Promise<any> {
  const validated = await validateKeySets("Request", params.serverType, "isEnoughPlayingPlayers", params);

  if (!validated.success) {
    throw validated;
  }

  const totalActivePlayersResponse = await this.tableManager.totalActivePlayer(params);

  if (!totalActivePlayersResponse.success) {
    throw totalActivePlayersResponse;
  }

  const totalPlayers = totalActivePlayersResponse.players.length;

  if (params.table.channelType === stateOfX.gameType.tournament) {
    if (totalPlayers > 1) {
      return params;
    } else {
      throw {
        success: true,
        channelId: params.channelId,
        isRetry: false,
        isDisplay: false,
        info: params.table.channelType + " There are less active players to start the game!"
      };
    }
  } else {
    if (totalPlayers >= params.table.minPlayers && totalPlayers <= params.table.maxPlayers) {
      return params;
    } else {
      throw {
        success: true,
        channelId: params.channelId,
        isRetry: false,
        isDisplay: false,
        info: params.table.channelType + " There are less active players to start the game!"
      };
    }
  }
}


// Shuffle deck using RNG algo -
async shuffleDeck(params: any): Promise<any> {
  const validated = await validateKeySets("Request", params.serverType, "shuffleDeck", params);

  if (!validated.success) {
    throw validated;
  }

  if (params.table.channelVariation === stateOfX.channelVariation.shortdeck) {
    params.table.deck = this.cardAlgoShortDeck.getCards();
  } else {
    params.table.deck = cardAlgo.getCards();
  }

  params.table.deck = randy.shuffle(params.table.deck);
  params.table.deck = randy.shuffle(params.table.deck);

  return params;
}


// Create roundId for current round
async inserRoundId(params: any): Promise<any> {
  params.table.raiseBy = '';
  params.table.lastHandRoundId = params.table.roundId;
  params.table.roundId = uuid.v4();
  params.table.gameStartTime = Number(new Date());
  params.table.roundNumber = '';

  for (let i = 0; i < 12; i++) {
    params.table.roundNumber += Math.floor(Math.random() * 10);
  }

  return params;
}

// ### Remove sitout players if
// > player missed the pre-defined big blinds during sitout
// > If player auto sitout then after 2 game missed

// var refundPlayerChips = function(params, cb) {
//   db.addRealChips({playerId: params.player.playerId}, parseInt(params.player.chips), function (err, response) {
//     console.log(stateOfX.serverLogType.info, "response in removeSitoutPlayer - " + JSON.stringify(response));
//     if(err && !response) {
//       //cb({success: false, channelId: params.channelId, info: "Refund on sitout standup failed! - " + err});
//       cb({success: false, isRetry: false, isDisplay: false, channelId: (params.channelId || ""), info: popupTextManager.dbQyeryInfo.DBADDREALCHIPSFAIL_VALIDATEGAMESTART});

//     } else {
//       console.log(stateOfX.serverLogType.info, "going  to splice");
//       params.response.data.removed.push(params.player.playerId);
//       params.table.players.splice(_ld.findIndex(params.table.players, params.player), 1);
//       console.log(stateOfX.serverLogType.info, "params.table.player" + JSON.stringify(params.table.players));
//       cb(null, params);
//     }
//   });
// }

// var removeRecordActivity = function(params, cb) {
//   imdb.removeActivity({channelId: params.channelId, playerId: params.player.playerId}, function(err, response){
//     if(!err && !!response) {
//       console.log(stateOfX.serverLogType.info, 'succefully remove activity from in memory for leave in disconnectin handling');
//       cb(null, params);
//     } else {
//       cb({success: false, isRetry: false, isDisplay: false, channelId: (params.channelId || ""), info: popupTextManager.dbQyeryInfo.DBREMOVEACTIVITYFAIL_VALIDATEGAMESTART});
//       //cb({success: false, isDisplay: false, isRetry: false, channelId: params.channelId, tableId: params.tableId, info: 'Unable to remove player activity from in memory'});
//     }
//   })
// }

// remove sitout player
// after checking conditions
// blinds missed
// sitout game missed
// etcetra
async removeSitoutPlayer(params: any): Promise<any> {
  const validated = await validateKeySets("Request", params.serverType, "removeSitoutPlayer", params);
  if (!validated.success) {
    return validated;
  }

  if (params.table.channelType === stateOfX.gameType.tournament) {
    return params;
  }

  const playerIds = _.pluck(params.table.players, 'playerId');

  for (const playerId of playerIds) {
    const playerIndex = _ld.findIndex(params.table.players, { playerId });
    const player = params.table.players[playerIndex];

    if (!player) {
      continue;
    }

    let isPlayerGoingToLeave = false;

    if (parseInt(player.disconnectedMissed) > Number(systemConfig.removeAfterDisconnectedGame)) {
      isPlayerGoingToLeave = true;
    }

    if (!isPlayerGoingToLeave && parseInt(player.bigBlindMissed) >= parseInt(params.table.blindMissed)) {
      isPlayerGoingToLeave = true;
    }

    if (!isPlayerGoingToLeave && parseInt(player.sitoutGameMissed) >= Number(systemConfig.removeAfterSitoutGameMissed)) {
      isPlayerGoingToLeave = true;
    }

    // If the player is going to leave, we skip the removal logic here
    // because it's handled elsewhere (as noted in the original comments).
  }

  return params;
}


// Remove player from tournament who is out of funds
async removeTournamentPlayers(params: any): Promise<any> {
  const validated = await validateKeySets("Request", params.serverType, "removeTournamentPlayers", params);
  if (!validated.success) {
    return validated;
  }

  let playerIdsWithNoChips: string[] = [];

  if (params.table.channelType === stateOfX.gameType.tournament) {
    const playersWithNoChips = _.where(params.table.players, { state: stateOfX.playerState.outOfMoney });
    params.table.players = _.difference(params.table.players, playersWithNoChips);
    playerIdsWithNoChips = _.pluck(playersWithNoChips, 'playerId');
  }

  params.response.data.removed = _.union(params.response.data.removed, playerIdsWithNoChips);

  // If any players were removed, additional logic can be handled here (broadcast, etc.)
  // This part is commented out in the original source

  return params;
}


// ### Initialize video log in database for current game
// > also insert base data for gamePlayers and joinResponse
async insertVideoInDB(params: any): Promise<any> {
  const gamePlayers = await this.videoRemote.createGamePlyersResponse(params);
  const joinResponse = await this.videoRemote.createJoinResponse(params);

  const history = [
    { type: "gamePlayers", data: gamePlayers, createdAt: Date.now() },
    { type: "joinResponse", data: joinResponse, createdAt: Date.now() }
  ];

  const video = {
    roundId: params.table.roundId,
    channelId: params.table.channelId,
    history,
    active: false,
    createdAt: Date.now()
  };

  try {
    const result = await this.db.insertVideo(video);
    params.table.videoLogId = result._id;
    return params;
  } catch (err) {
    return {
      success: false,
      channelId: params.channelId,
      isRetry: false,
      isDisplay: false,
      info: "Unable to initialize video log: " + JSON.stringify(err)
    };
  }
}


// init params to try start a game
initializeParams(params: any): Promise<any> {
  params.response = {};
  params.response.data = {};
  params.response.data.removed = params.removedPlayerList || [];
  params.response.data.players = params.table.players;
  params.response.state = params.table.state;
  params.response.data.startGame = false;
  params.response.success = false;

  params.tempData = {};
  params.tempData.startConsiderPlayer = true;
  params.tempData.allowedIndexes = true;
  params.tempData.skipIndexes = true;
  params.tempData.preGameState = params.table.state;

  params.table.removedPlayers = [];
  params.table.gamePlayers = [];

  return params;
}


// reset table settings if game not able to start
async resetTableOnNoGameStart(params: any): Promise<{ success: true; table: any }> {
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
  params.table.isChangeVeriation = false;

  for (let i = 0; i < params.table.players.length; i++) {
    const player = params.table.players[i];

    if (player.state === stateOfX.playerState.disconnected) {
      player.state = stateOfX.playerState.onBreak;
    }

    if (player.state === stateOfX.playerState.playing) {
      player.state = stateOfX.playerState.waiting;
      player.active = false;
    }

    if (player.state === stateOfX.playerState.playing) {
      player.hasPlayedOnceOnTable = true;
    }
  }

  return { success: true, table: params.table };
}


// try if game could be started
async validateGameStart_validate(params: any): Promise<any> {
  if (params.table.state === stateOfX.gameState.idle) {
    try {
      params = await this.initializeParams(params);
      params = await this.getPlayerScore(params);
      params = await this.sittingOutPlayers(params);
      params = await this.resetPlayerState(params);
      params = await this.isGameGoingToStart(params);
      params = await this.startConsiderPlayers(params);
      params = await this.decidingPlayingPlayers(params);
      params = await this.sortPlayerIndexes(params);
      params = await this.removeSitoutPlayer(params);
      params = await this.removeTournamentPlayers(params);
      params = await this.isEnoughPlayingPlayers(params);
      params = await this.inserRoundId(params);
      params = await this.shuffleDeck(params);
      params = await this.insertVideoInDB(params);

      params.response.success = true;
      params.response.data.startGame = true;
      params.response.data.state = params.table.state;
      params.response.table = params.table;
      params.response.data.players = params.table.players;
      params.response.data.preGameState = params.tempData.preGameState;

      return params.response;
    } catch (noStartGameResponse) {
      const resetResponse = await this.resetTableOnNoGameStart(params);
      noStartGameResponse.data = {};
      noStartGameResponse.success = true;
      noStartGameResponse.data.preGameState = params.tempData.preGameState;
      noStartGameResponse.data.startGame = false;
      noStartGameResponse.data.removed = [];
      noStartGameResponse.table = resetResponse.table;
      noStartGameResponse.data.state = resetResponse.table.state;
      noStartGameResponse.data.players = resetResponse.table.players;
      noStartGameResponse.table.stateInternal = stateOfX.gameState.idle;
      return noStartGameResponse;
    }
  } else {
    return {
      success: true,
      data: {
        players: params.table.players,
        removed: [],
        startGame: false,
        state: params.table.state,
        preGameState: params.table.state,
      },
      table: params.table,
    };
  }
} 







}