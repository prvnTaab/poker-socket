import { Injectable } from '@nestjs/common';
import * as _ from 'underscore';
import { db } from './model/dbQuery';
import { customLibrary } from './customLibrary';
import { logDb } from './model/logDbQuery';
import {stateOfX, systemConfig} from '..';



@Injectable()
export class ActivityService {

  private async insertInDb(activityObject: any): Promise<void> {
    try {
      activityObject = customLibrary.convertToJson(activityObject);
      const activity = await this.logDB.createUserActivity(activityObject);
      if (!activity) {
        console.log('Error in creating activities in db');
      }
    } catch (err) {
      console.log('DB error in creating activities', err);
    }
  }

  private async insertInDbGame(activityObject: any): Promise<void> {
    try {
      activityObject = customLibrary.convertToJson(activityObject);
      const activity = await this.logDB.createUserActivityGame(activityObject);
      
      if (activity) {
        if (activity.subCategory === stateOfX.gamePlay.subCategory.gameOver && 
            activity.rawResponse?.params) {
          
          if (activityObject.rawResponse.params.table.isRealMoney && 
              systemConfig.isLeaderBoard) {
            await this.countNumberOfHands(activityObject.rawResponse.params.table);
          }

          const winners = activity.rawResponse.winners;
          const roundNumber = activity.rawResponse.params.table.roundNumber;
          const allPlayerIds = activity.rawResponse.params.table.onStartPlayers;
          const allPlayerData = activity.rawResponse.params.table.players;
          const roundName = activity.rawResponse.params.data.roundName;
          const correctGameVariation = activity.rawResponse.params.table.channelVariation;
          
          let roundReach = [];
          if (roundName === stateOfX.round.flop || 
              roundName === stateOfX.round.turn || 
              roundName === stateOfX.round.river) {
            
            for (const player of allPlayerData) {
              if (player.lastRoundPlayed !== stateOfX.round.preflop) {
                roundReach.push({
                  playerId: player.playerId,
                  reachFlop: 1,
                  winnerAtShowDown: 0,
                  reachShowdown: 0
                });
              }
            }
          }

          if (roundName === stateOfX.round.preflop) {
            for (const player of allPlayerData) {
              if (player.state === stateOfX.playerState.outOfMoney || 
                  (player.lastRoundPlayed === stateOfX.round.preflop && 
                   (player.lastMove === 'CALL' || 
                    player.lastMove === 'RAISE' || 
                    player.lastMove === 'ALLIN'))) {
                roundReach.push({
                  playerId: player.playerId,
                  reachFlop: 0,
                  winnerAtShowDown: 0,
                  reachShowdown: 1
                });
              }
            }
          }

          if (roundName === stateOfX.round.showdown) {
            for (const player of allPlayerData) {
              if (player.lastRoundPlayed === stateOfX.round.river && player.active) {
                roundReach.push({
                  playerId: player.playerId,
                  reachFlop: 0,
                  winnerAtShowDown: 0,
                  reachShowdown: 1
                });
              }
            }
          }

          try {
            const result = await this.logDB.getRoundData(roundNumber);
            const roundsData: any[] = [];
            
            if (result.length > 0) {
              for (const round of result) {
                const playerId = round.rawResponse.data.playerId;
                
                // Remove player from allPlayerIds array
                for (let j = 0; j < allPlayerIds.length; j++) {
                  if (playerId === allPlayerIds[j]) {
                    delete allPlayerIds[j];
                  }
                }

                let isWinner = 0;
                for (const winner of winners) {
                  if (winner.playerId === playerId) {
                    isWinner = 1;
                    break;
                  }
                }

                const gameVariation = round.rawResponse.table.channelVariation;
                const roundItems: any = {
                  tableVariation: gameVariation,
                  playerId,
                  isWinner,
                  action: round.rawResponse.data.action,
                  roundName: round.rawResponse.data.roundName,
                  roundNumber: round.rawResponse.table.roundNumber,
                  isRealMoney: round.rawResponse.table.isRealMoney,
                  winnerAtShowDown: 0,
                  reachShowdown: 0,
                  reachFlop: 0
                };

                if (roundReach.length) {
                  const playerRoundReach = _.where(roundReach, { playerId });
                  if (playerRoundReach.length) {
                    roundItems.reachShowdown = playerRoundReach[0].reachShowdown;
                    roundItems.reachFlop = playerRoundReach[0].reachFlop;
                    if (roundItems.isWinner && roundItems.reachShowdown) {
                      roundItems.winnerAtShowDown = 1;
                    }
                  }
                }
                roundsData.push(roundItems);
              }

              await this.insertPlayerStats(roundsData);
            }

            if (allPlayerIds.length) {
              const roundsDataPlayerNew: any[] = [];
              for (const playerId of allPlayerIds) {
                if (typeof playerId !== 'undefined') {
                  let istempWinner = 0;
                  for (const winner of winners) {
                    if (winner.playerId === playerId) {
                      istempWinner = 1;
                      break;
                    }
                  }

                  const roundItems = {
                    tableVariation: correctGameVariation,
                    playerId,
                    action: activity.rawResponse.params.data.action,
                    roundName: activity.rawResponse.params.data.roundName,
                    roundNumber: activity.rawResponse.params.table.roundNumber,
                    isRealMoney: activity.rawResponse.params.table.isRealMoney,
                    isWinner: istempWinner,
                    winnerAtShowDown: 0,
                    reachShowdown: 0,
                    reachFlop: 0
                  };

                  const playerRoundReach = _.where(roundReach, { playerId });
                  if (playerRoundReach.length) {
                    roundItems.reachShowdown = playerRoundReach[0].reachShowdown;
                    roundItems.reachFlop = playerRoundReach[0].reachFlop;
                    if (roundItems.isWinner && roundItems.reachShowdown) {
                      roundItems.winnerAtShowDown = 1;
                    }
                  }

                  roundsDataPlayerNew.push(roundItems);
                }
              }
              await this.insertPlayerStats(roundsDataPlayerNew);
            }
          } catch (err) {
            console.log('Error getting round data:', err);
          }
        }
      }
    } catch (err) {
      console.log('Error in creating game activities:', err);
    }
  }

  private async insertPlayerStats(rounds: any[]): Promise<void> {
    console.log('Inside insertPlayerStats', rounds);
    const playersStats: any = {};
    const playersArr: string[] = [];
    let tempFlopOpen = 0;
    let flopRaises = 1;
    let lastRaisePreFlop: string;
    let flopRaise = 0;

    for (const round of rounds) {
      if (typeof playersStats[round.playerId] === 'undefined') {
        playersArr.push(round.playerId);
        playersStats[round.playerId] = {
          gameVariation: round.tableVariation,
          roundNumber: round.roundNumber,
          playerId: round.playerId,
          isWinner: round.isWinner,
          isRealMoney: round.isRealMoney,
          reachShowdown: round.reachShowdown,
          winnerAtShowDown: round.winnerAtShowDown
        };
      }

      if (round.action === stateOfX.move.call && 
          round.roundName === stateOfX.round.flop && 
          tempFlopOpen === 0) {
        tempFlopOpen = 1;
        round.roundName = stateOfX.round.preflop;
      }

      // Calculating CBet
      if ((round.action === stateOfX.move.raise || 
           round.action === stateOfX.move.bet) && 
          round.roundName === stateOfX.round.flop && 
          flopRaise === 0 && 
          round.playerId === lastRaisePreFlop) {
        playersStats[round.playerId].CBet = 1;
      }

      if ((round.action === stateOfX.move.raise || 
           round.action === stateOfX.move.bet) && 
          round.roundName === stateOfX.round.flop) {
        playersStats[round.playerId].FlopRaise = 1;
      }

      if ((round.action === stateOfX.move.raise || 
           round.action === stateOfX.move.bet) && 
          round.roundName === stateOfX.round.turn) {
        playersStats[round.playerId].TurnRaise = 1;
      }

      if ((round.action === stateOfX.move.raise || 
           round.action === stateOfX.move.bet) && 
          round.roundName === stateOfX.round.river) {
        playersStats[round.playerId].RiverRaise = 1;
      }

      if (round.reachShowdown === 1) {
        playersStats[round.playerId].VPIP = 1;
      }

      if (round.reachFlop === 1) {
        playersStats[round.playerId].VPIP = 1;
      }

      if ((round.action === stateOfX.move.call || 
           round.action === stateOfX.move.raise || 
           round.action === stateOfX.move.bet) && 
          round.roundName === stateOfX.round.preflop) {
        
        if (round.action === stateOfX.move.raise || 
            round.action === stateOfX.move.bet) {
          playersStats[round.playerId].PFR = 1;
          flopRaises++;
          if (flopRaises > 2) {
            playersStats[round.playerId].threePlusBet = 1;
          }
          lastRaisePreFlop = round.playerId;
        }
      }
    }

    console.log('playerStats After:', playersStats);

    for (const playerId of playersArr) {
      const query = {
        roundNumber: playersStats[playerId].roundNumber,
        playerId: playersStats[playerId].playerId,
        gameVariation: playersStats[playerId].gameVariation
      };

      try {
        const result = await db.insertUserStats(query, playersStats[playerId]);
        console.log('Inserted player stats in DB successfully');
      } catch (err) {
        console.log('DB error in insert player stats:', err);
      }
    }
  }

  private async logDBGeneral(colName: string, query: string, data: any): Promise<void> {
    try {
      const result = await this.logDB.genericQuery(colName, query, [data]);
    } catch (err) {
      console.log('Error in generic query:', err);
    }
  }

  private init(category: string, subCategory: string, logType: string): any {
    return {
      category,
      subCategory,
      logType,
      createdAt: Number(new Date())
    };
  }

  // Public Methods - All converted to async/await

  public async logUserActivity(params: any, category: string, subCategory: string, status: string): Promise<void> {
    const activityObject = this.init(category, subCategory, status);
    activityObject.playerId = params.playerId;
    activityObject.category = category;
    activityObject.subCategory = subCategory;
    activityObject.status = status;
    activityObject.comment = params.comment;
    activityObject.channelId = params.channelId || '';

    if (params.rawInput) {
      activityObject.rawInput = params.rawInput;
    }
    if (params.rawResponse) {
      activityObject.rawResponse = params.rawResponse;
    }

    if (category === stateOfX.profile.category.profile) {
      activityObject[stateOfX.profile.category.profile] = params.data;
    }

    await this.insertInDb(activityObject);
  }

  public async getLobbyTables(rawInput: any, category: string, subCategory: string, rawResponse: any, logType: string): Promise<void> {
    const activityObject = this.init(category, subCategory, logType);
    activityObject.rawInput = rawInput;
    activityObject.playerId = rawInput.playerId;
    activityObject.channelId = rawInput.channelId || '';
    activityObject.channelType = rawInput.channelType || 'NORMAL';
    activityObject.rawResponse = rawResponse;

    if (rawResponse.success) {
      activityObject.comment = `Player fetched lobby tables for ${activityObject.channelType}`;
      if (rawResponse.result[0]?.channelVariation && rawResponse.result[0]?.channelName) {
        activityObject.comment += ` : ${rawResponse.result[0].channelVariation} : ${rawResponse.result[0].channelName}`;
      }
    } else {
      activityObject.comment = rawResponse.info;
    }

    await this.insertInDb(activityObject);
  }

  public async getTable(rawInput: any, category: string, subCategory: string, rawResponse: any, logType: string): Promise<void> {
    const activityObject = this.init(category, subCategory, logType);
    if (rawInput) {
      activityObject.channelType = rawInput.channelType || 'NORMAL';
      activityObject.rawInput = rawInput;
      activityObject.playerId = rawInput.playerId;
    }

    if (rawResponse.success) {
      activityObject.rawResponse = rawResponse;
      if (activityObject.channelType === stateOfX.tournamentType.normal) {
        activityObject.comment = 'Details of table selected in cash games fetched.';
      } else {
        activityObject.comment = 'Details of table selected in SitNGo or Tournament fetched';
      }
    } else {
      activityObject.rawResponse = rawResponse;
      activityObject.comment = rawResponse.info;
    }

    activityObject.channelId = rawInput?.channelId || '';
    await this.insertInDb(activityObject);
  }

  public async updateProfile(rawInput: any, category: string, subCategory: string, rawResponse: any, logType: string): Promise<void> {
    const activityObject = this.init(category, subCategory, logType);
    activityObject.rawInput = _.omit(rawInput, 'session', 'self');
    activityObject.rawResponse = rawResponse;
    activityObject.playerId = rawInput.playerId;
    activityObject.channelId = rawInput.channelId || '';

    if (rawResponse.success) {
      activityObject.comment = 'Player updated profile successfully';
    } else {
      activityObject.comment = 'Player profile update failed';
    }

    await this.insertInDb(activityObject);
  }

  public async lobbyRegisterTournament(rawInput: any, category: string, subCategory: string, rawResponse: any, logType: string): Promise<void> {
    const activityObject = this.init(category, subCategory, logType);
    activityObject.rawInput = rawInput;
    activityObject.rawResponse = rawResponse;
    activityObject.playerId = rawInput.playerId;
    activityObject.channelId = rawInput.channelId || '';

    if (rawResponse.success) {
      activityObject.comment = `${rawResponse.info} for tournament.`;
    } else {
      activityObject.comment = `Unable to register since ${rawResponse.info}`;
    }

    await this.insertInDb(activityObject);
  }

  public async lobbyDeRegisterTournament(rawInput: any, category: string, subCategory: string, rawResponse: any, logType: string): Promise<void> {
    const activityObject = this.init(category, subCategory, logType);
    activityObject.rawInput = rawInput;
    activityObject.rawResponse = rawResponse;
    activityObject.playerId = rawInput.playerId;
    activityObject.channelId = rawInput.channelId || '';

    if (rawResponse.success) {
      activityObject.comment = 'Player de-registered successfully for tournament.';
    } else {
      activityObject.comment = `Unable to de-register since ${rawResponse.info}`;
    }

    await this.insertInDb(activityObject);
  }

  public async leaveGame(params: any, category: string, subCategory: string, logType: string): Promise<void> {
    const activityObject = this.init(category, subCategory, logType);
    activityObject.channelId = params.channelId || '';

    if (params.data?.playerId) {
      activityObject.playerId = params.data.playerId;
    }

    if (params.table.channelType === stateOfX.gameType.normal) {
      if (logType === stateOfX.logType.success) {
        activityObject.roundId = params.table.roundId;
        activityObject.comment = `${params.data.playerName} ${params.data.action} the game `;
        
        if (params.table.roundName) {
          activityObject.comment += `in round ${params.table.roundName}`;
        }

        if (params.data.isCurrentPlayer) {
          activityObject.comment += '. Player left on his turn';
        } else {
          activityObject.comment += '. Player did not leave on his turn';
        }
      } else {
        activityObject.comment = 'Player leave request failed';
      }

      if (params.table.players[params.table.currentMoveIndex]) {
        activityObject.comment += `. Next turn - ${params.table.players[params.table.currentMoveIndex].playerName}`;
      }
    } else {
      activityObject.comment = `Player cannot leave because it is ${params.table.channelType}`;
    }

    if (params.table.channelType && params.table.channelVariation && params.table.channelName) {
      activityObject.comment += ` in ${params.table.channelType} : ${params.table.channelVariation} : ${params.table.channelName}`;
    }

    if (category === stateOfX.profile.category.gamePlay) {
      await this.insertInDbGame(activityObject);
    }
    await this.insertInDb(activityObject);
  }

  public async playerSit(rawResponse: any, category: string, subCategory: string, logType: string): Promise<void> {
    const activityObject = this.init(category, subCategory, logType);
    if (rawResponse) {
      activityObject.rawResponse = _.omit(rawResponse, 'self', 'session', 'channel');
      activityObject.channelId = rawResponse.response?.channelId || '';

      if (rawResponse.player) {
        activityObject.playerId = rawResponse.player.playerId;
        if (rawResponse.response.success) {
          activityObject.comment = `${rawResponse.player.playerName} sat on seat ${rawResponse.player.seatIndex} with ${rawResponse.player.chips} points in ${rawResponse.player.state} state `;
          
          if (rawResponse.table?.channelType && rawResponse.table?.channelVariation && rawResponse.table?.channelName) {
            activityObject.comment += `in ${rawResponse.table.channelType} : ${rawResponse.table.channelVariation} : ${rawResponse.table.channelName}`;
          }
        } else {
          activityObject.comment = `Player could not sit - ${rawResponse.info}`;
        }
      }
    }

    if (category === stateOfX.profile.category.gamePlay) {
      await this.insertInDbGame(activityObject);
    }
    await this.insertInDb(activityObject);
  }

  public async makeMove(params: any, category: string, subCategory: string, rawResponse: any, logType: string): Promise<void> {
    const activityObject = this.init(category, subCategory, logType);
    activityObject.channelId = params.channelId || '';

    if (rawResponse) {
      activityObject.rawResponse = rawResponse;
      if (params.data && rawResponse.success) {
        activityObject.playerId = params.data.playerId;
        activityObject.comment = `${params.data.playerName} made a ${params.data.action}`;
        const preChips = params.data.amount + params.data.chips;
        
        if (params.data.amount > 0) {
          activityObject.comment += ` with ${params.data.amount} points.`;
        }

        activityObject.comment += ` Pre Points = ${preChips}. Post Points = ${params.data.chips}`;
        activityObject.comment += ` in round ${params.data.roundName}`;
        
        if (params.table?.channelType && params.table?.channelVariation && params.table?.channelName) {
          activityObject.comment += ` of ${params.table.channelType} : ${params.table.channelVariation} : ${params.table.channelName}`;
        }

        activityObject.comment += `. Next turn - ${params.table.players[params.table.currentMoveIndex].playerName}`;
        
        if (params.data.roundId) {
          activityObject.roundId = params.data.roundId;
        }
      } else {
        activityObject.comment = `Player move request failed-${rawResponse.info}`;
      }
    }

    if (category === stateOfX.profile.category.gamePlay) {
      await this.insertInDbGame(activityObject);
    }
    await this.insertInDb(activityObject);
  }

  public async info(params: any, category: string, subCategory: string, logType: string): Promise<void> {
    if (logType === stateOfX.logType.error) {
      const activityObject = this.init(category, subCategory, logType);
      activityObject.comment = `Could not fetch Details-${params}`;
      activityObject.channelId = params.channelId || '';
      await this.insertInDb(activityObject);
    } else {
      if (params.table?.players) {
        for (const player of params.table.players) {
          const activityObject = this.init(category, subCategory, logType);
          activityObject.channelId = params.channelId || '';
          activityObject.comment = '';
          activityObject.playerId = player.playerId;

          if (player.seatIndex === params.table.smallBlindSeatIndex) {
            activityObject.comment += `${player.playerName} becomes small blind. `;
            activityObject.subCategory = stateOfX.game.subCategory.blindsAndStraddle;
          }

          if (player.seatIndex === params.table.bigBlindSeatIndex) {
            activityObject.comment += `${player.playerName} becomes big blind. `;
            activityObject.subCategory = stateOfX.game.subCategory.blindsAndStraddle;
          }

          if (player.seatIndex === params.table.dealerSeatIndex) {
            activityObject.comment += `${player.playerName} becomes dealer. `;
          }

          if (player.seatIndex === params.table.straddleIndex) {
            activityObject.comment += `${player.playerName} becomes straddle. `;
            activityObject.subCategory = stateOfX.game.subCategory.blindsAndStraddle;
          }

          if (player.seatIndex === params.table.firstActiveIndex) {
            activityObject.comment += `${player.playerName} gets first turn. `;
          }

          if (category === stateOfX.profile.category.gamePlay) {
            await this.insertInDbGame(activityObject);
          }
          await this.insertInDb(activityObject);
        }
      }
    }
  }

  public async deductBlinds(params: any, category: string, subCategory: string, logType: string): Promise<void> {
    if (logType === stateOfX.logType.error) {
      const activityObject = this.init(category, subCategory, logType);
      activityObject.comment = `Could not fetch Details-${params}`;
      activityObject.channelId = params.channelId || '';
      await this.insertInDb(activityObject);
    } else {
      if (params.table?.players) {
        for (const player of params.table.players) {
          const activityObject = this.init(category, subCategory, logType);
          activityObject.channelId = params.channelId || '';
          activityObject.comment = '';
          activityObject.playerId = player.playerId;

          if (logType === stateOfX.logType.success) {
            if (player.seatIndex === params.table.smallBlindSeatIndex) {
              activityObject.comment += `Amount deducted = ${params.table.roundBets[params.table.smallBlindIndex]}. `;
            }

            if (player.seatIndex === params.table.bigBlindSeatIndex) {
              activityObject.comment += `Amount deducted = ${params.table.roundBets[params.table.bigBlindIndex]}. `;
            }

            if (player.seatIndex === params.table.straddleIndex) {
              activityObject.comment += `Amount deducted = ${params.table.roundBets[params.table.straddleIndex]}. `;
            }

            if (params.data?.playerId && player.playerId === params.data.playerId) {
              activityObject.comment += `Force blind deducted from ${player.playerName}`;
            }

            if (player.cards) {
              activityObject.comment += `${player.playerName} has cards `;
              for (const card of player.cards) {
                activityObject.comment += `${card.name}${card.type[0].toUpperCase()} `;
              }
            }
          } else {
            activityObject.comment = `Could not fetch player information-${params.info}`;
          }

          if (category === stateOfX.profile.category.gamePlay) {
            await this.insertInDbGame(activityObject);
          }
          await this.insertInDb(activityObject);
        }
      }
    }
  }

  public async playerState(player: any, category: string, subCategory: string, logType: string): Promise<void> {
    const activityObject = this.init(category, subCategory, logType);
    activityObject.channelId = player.channelId || '';

    if (player) {
      if (player.state && player.playerId) {
        activityObject.playerId = player.playerId;
        activityObject.comment = `${player.playerName} is in ${player.state} state.`;
      }

      if (category === stateOfX.profile.category.gamePlay) {
        await this.insertInDbGame(activityObject);
      }
      await this.insertInDb(activityObject);
    }
  }

  public async playerCards(player: any, category: string, subCategory: string, logType: string): Promise<void> {
    const activityObject = this.init(category, subCategory, logType);
    activityObject.channelId = player.channelId || '';

    if (player) {
      if (player.cards?.[0] && player.playerId) {
        activityObject.playerId = player.playerId;
        activityObject.comment = `${player.playerName} has following cards ${player.cards[0].name}${player.cards[0].type[0].toLowerCase()} ${player.cards[1].name}${player.cards[1].type[0].toLowerCase()}.`;
      }

      if (category === stateOfX.profile.category.gamePlay) {
        await this.insertInDbGame(activityObject);
      }
      await this.insertInDb(activityObject);
    }
  }

  public async winner(params: any, category: string, subCategory: string, rawResponse: any, logType: string): Promise<void> {
    if (params) {
      for (const player of params.table.players) {
        const activityObject = this.init(category, subCategory, logType);
        activityObject.rawResponse = rawResponse;
        activityObject.playerId = player.playerId;
        activityObject.channelId = player.channelId || '';

        if (rawResponse.success) {
          const winner = _.findWhere(params.data.winners, { playerId: player.playerId });
          if (winner) {
            activityObject.comment = `${player.playerName} won ${winner.amount} points by ${winner.type}.`;
          } else {
            activityObject.comment = `${player.playerName} lost the game.`;
          }
        } else {
          activityObject.comment = 'Failed to fetch winners';
        }

        if (category === stateOfX.profile.category.gamePlay) {
          await this.insertInDbGame(activityObject);
        }
        await this.insertInDb(activityObject);
      }
    }
  }

  public async startGame(params: any, category: string, subCategory: string, rawResponse: any, logType: string): Promise<void> {
    const activityObject = this.init(category, subCategory, logType);

    if (logType === stateOfX.logType.success) {
      activityObject.comment = 'Game starts ';
    } else {
      activityObject.comment = `Game did not start ${rawResponse.info}`;
    }

    if (params.channel?.channelType && params.channel?.channelName && params.channel?.channelVariation) {
      activityObject.comment += `in ${params.channel.channelType} : ${params.channel.channelName} : ${params.channel.channelVariation}`;
    }

    activityObject.rawResponse = _.omit(rawResponse, 'app', 'session', 'self', 'channel');
    await this.insertInDb(activityObject);
  }

  public async startGameInfo(params: any, category: string, subCategory: string, logType: string): Promise<void> {
    const activityObject = this.init(category, subCategory, logType);
    activityObject.channelId = params.channelId || '';
    activityObject.comment = `Game starts at ${new Date().toString().substring(0, 25)}`;

    if (params.table?.channelType && params.table?.channelName && params.table?.channelVariation) {
      activityObject.comment += `in ${params.table.channelType} : ${params.table.channelName} : ${params.table.channelVariation}`;
    }

    if (params) {
      activityObject.rawResponse = _.omit(params, 'app', 'session', 'self', 'channel');
    }

    await this.insertInDbGame(activityObject);
    await this.insertInDb(activityObject);
  }

  public async gameOver(params: any, category: string, subCategory: string, rawResponse: any, logType: string): Promise<void> {
    const activityObject = this.init(category, subCategory, logType);
    activityObject.rawResponse = rawResponse;
    activityObject.channelId = params.channelId || (params.table ? params.table.channelId : '');
    activityObject.roundId = params.roundId || (params.table ? params.table.roundId : '');

    if (logType === stateOfX.logType.success) {
      activityObject.comment = 'Game over. ';
      if (rawResponse.params?.table?.channelType && 
          rawResponse.params?.table?.channelName && 
          rawResponse.params?.table?.channelVariation) {
        activityObject.comment += `in ${rawResponse.params.table.channelType} : ${rawResponse.params.table.channelName} : ${rawResponse.params.table.channelVariation}`;
      }

      for (const contributor of params.data.contributors) {
        const player = _.findWhere(params.table.players, { playerId: contributor.playerId });
        if (player) {
          activityObject.comment += `${player.playerName} contributed ${contributor.amount}. `;
        }
      }

      for (const pot of params.table.pot) {
        activityObject.comment += `Pot ${pot.potIndex + 1}. Amount ${pot.amount} contributed by `;
        
        for (const contributor of params.table.pot[pot.potIndex].contributors) {
          const player = _.findWhere(params.table.players, { playerId: contributor });
          if (player) {
            activityObject.comment += `${player.playerName}, `;
          }
        }
        
        activityObject.comment += '. ';
      }
    } else {
      activityObject.comment = `Game over failed ${rawResponse.info}`;
    }

    await this.insertInDbGame(activityObject);
  }

  public async potWinner(params: any, category: string, subCategory: string, logType: string): Promise<void> {
    const activityObject = this.init(category, subCategory, logType);
    activityObject.channelId = params.channelId || '';
    activityObject.comment = 'Pot winners: ';

    for (const winner of params.winners) {
      const player = _.where(params.table.players, { playerId: winner.playerId });
      activityObject.comment += ` Pot ${winner.potIndex + 1} of amount ${winner.amount} won by ${player[0].playerName}`;
    }

    await this.insertInDbGame(activityObject);
  }

  public async rakeDeducted(params: any, category: string, subCategory: string, logType: string, playerChipDetails?: any): Promise<void> {
    const activityObject = this.init(category, subCategory, logType);
    
    if (logType === stateOfX.logType.success) {
      activityObject.channelId = params.data?.channelId || '';
      const player = _.where(params.table.players, { playerId: Object.keys(params.rakeDetails.playerWins)[0] });
      const contribute = _.where(params.table.contributors, { playerId: player[0].playerId });
      activityObject.playerId = player[0].playerId;
      activityObject.rawInput = params;
      
      activityObject.comment = `${player[0].playerName}: contribute ${contribute[0].amount}, for total pot: ${params.rakeDetails.totalPotAmount}, table rake: ${params.rakeFromTable}, get: ${params.rakeDetails.playerWins[player[0].playerId]}, totalRake ${params.rakeDetails.totalRake}`;
    } else {
      activityObject.comment = `Rake was not deducted - ${params.info}`;
    }

    await this.insertInDbGame(activityObject);
    await this.insertInDb(activityObject);
  }

  public async gameEndInfo(params: any, category: string, subCategory: string, logType: string): Promise<void> {
    const activityObject = this.init(category, subCategory, logType);
    activityObject.channelId = params.channelId || '';
    activityObject.comment = `Game ends at ${new Date().toString().substring(0, 25)}`;

    if (params.table?.channelType && params.table?.channelName && params.table?.channelVariation) {
      activityObject.comment += `in ${params.table.channelType} : ${params.table.channelName} : ${params.table.channelVariation}`;
    }

    await this.insertInDbGame(activityObject);
  }

  public async chat(params: any, category: string, subCategory: string, logType: string): Promise<void> {
    const activityObject = this.init(category, subCategory, logType);
    
    if (params) {
      activityObject.playerId = params.playerId || '';
      activityObject.channelId = params.channelId || '';
      activityObject.comment = `${params.playerName}: ${params.message}`;
    }

    await this.insertInDb(activityObject);
    await this.insertInDbGame(activityObject);
  }

  public async runItTwice(params: any, category: string, subCategory: string, logType: string): Promise<void> {
    const activityObject = this.init(category, subCategory, logType);
    const player = _.where(params.table.players, { playerId: params.data.playerId });
    
    if (params) {
      activityObject.playerId = params.data.playerId || '';
      activityObject.channelId = params.data.channelId || '';
      activityObject.rawInput = params;
      
      if (params.data.value) {
        activityObject.comment = `${player[0].playerName}: enabled run it twice in ${params.table.channelName}`;
      } else {
        activityObject.comment = `${player[0].playerName}: disabled run it twice in ${params.table.channelName}`;
      }
    }

    await this.insertInDb(activityObject);
    await this.insertInDbGame(activityObject);
  }

  public async sitoutNextHand(params: any, category: string, subCategory: string, logType: string): Promise<void> {
    const activityObject = this.init(category, subCategory, logType);
    const player = _.where(params.table.players, { playerId: params.data.playerId });
    
    if (params) {
      activityObject.playerId = params.data.playerId || '';
      activityObject.channelId = params.data.channelId || '';
      activityObject.rawInput = params;
      activityObject.comment = `${player[0].playerName}: enabled sitoutNextHand in ${params.table.channelName}`;
    }

    await this.insertInDb(activityObject);
    await this.insertInDbGame(activityObject);
  }

  public async sitoutNextBigBlind(params: any, category: string, subCategory: string, logType: string): Promise<void> {
    const activityObject = this.init(category, subCategory, logType);
    const player = _.where(params.table.players, { playerId: params.data.playerId });
    
    if (params) {
      activityObject.playerId = params.data.playerId || '';
      activityObject.channelId = params.data.channelId || '';
      activityObject.rawInput = params;
      activityObject.comment = `${player[0].playerName}: enabled sitoutNextBigBlind in ${params.table.channelName}`;
    }

    await this.insertInDb(activityObject);
    await this.insertInDbGame(activityObject);
  }

  public async resetSitOut(params: any, category: string, subCategory: string, logType: string): Promise<void> {
    const activityObject = this.init(category, subCategory, logType);
    const player = _.where(params.table.players, { playerId: params.data.playerId });
    
    if (params) {
      activityObject.playerId = params.data.playerId || '';
      activityObject.channelId = params.data.channelId || '';
      activityObject.rawInput = params;
      activityObject.comment = `${player[0].playerName}: reset sit out in ${params.table.channelName}`;
    }

    await this.insertInDb(activityObject);
    await this.insertInDbGame(activityObject);
  }

  public async resume(params: any, category: string, subCategory: string, logType: string): Promise<void> {
    const activityObject = this.init(category, subCategory, logType);
    const player = _.where(params.table.players, { playerId: params.data.playerId });
    
    if (params) {
      activityObject.playerId = params.data.playerId || '';
      activityObject.channelId = params.data.channelId || '';
      activityObject.rawInput = params;
      activityObject.comment = `${player[0].playerName}: resume in ${params.table.channelName} from ${params.data.previousState} state to ${params.data.state}`;
    }

    await this.insertInDb(activityObject);
    await this.insertInDbGame(activityObject);
  }

  public async addChipsOnTable(params: any, category: string, subCategory: string, logType: string, playerChipDetails: any): Promise<void> {
    const activityObject = this.init(category, subCategory, logType);
    const player = _.where(params.table.players, { playerId: params.data.playerId });
    
    if (params && playerChipDetails) {
      activityObject.playerId = params.data.playerId || '';
      activityObject.channelId = params.data.channelId || '';
      activityObject.rawInput = params;
      
      if (!playerChipDetails.isChipsToUpdate) {
        activityObject.comment = `${player[0].playerName}: added chip(s) ${playerChipDetails.newChips} to ${playerChipDetails.chipsInHand} in ${params.table.channelName} has ${player[0].chips} points.`;
      } else {
        activityObject.comment = `${player[0].playerName}: added chip(s) ${playerChipDetails.newChipsToAdd} for next game in ${params.table.channelName} will have ${player[0].chipsToBeAdded} more points. and currently has ${playerChipDetails.chipsInHand} points in hand.`;
      }
    }

    await this.insertInDb(activityObject);
    await this.insertInDbGame(activityObject);
  }

  public async updateTableSettings(params: any, category: string, subCategory: string, logType: string, playerName: string): Promise<void> {
    const activityObject = this.init(category, subCategory, logType);
    
    if (params && params.key === 'isMuckHand') {
      activityObject.playerId = params.playerId || '';
      activityObject.channelId = params.channelId || '';
      activityObject.rawInput = params;
      
      if (params.value) {
        activityObject.comment = `${playerName} enabled muck hand.`;
      } else {
        activityObject.comment = `${playerName} disabled muck hand.`;
      }
    }

    await this.insertInDb(activityObject);
    await this.insertInDbGame(activityObject);
  }

  public async logWinnings(channelType: string, channelVariation: string, channelId: string, timestamp: number, winners: any[], contributors: any[]): Promise<void> {
    for (const winner of winners) {
      const t = _.findWhere(contributors, { playerId: winner.playerId }) || { amount: 0 };
      const amount = winner.amount - t.amount;
      const logObject = {
        channelType,
        channelVariation,
        channelId,
        timestamp,
        playerId: winner.playerId,
        amount
      };

      await this.logDBGeneral('winAmount', 'insert', logObject);
    }
  }

  private async countNumberOfHands(params: any): Promise<void> {
    let slab = 'N/A';
    const blinds = [params.smallBlind, params.bigBlind];
    
    for (const segment in stateOfX.contestSegment) {
      if (
        stateOfX.contestSegment[segment][0] <= params.bigBlind &&
        stateOfX.contestSegment[segment][1] >= params.bigBlind
      ) {
        slab = segment;
      }
    }
    
    const date = new Date();
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    
    // IPL logic
    const IPLdate = date.toLocaleString();
    const queryIPL = {
      IPLStart: new Date('1 April 2021 00:00:00').toLocaleString(),
      IPLEnd: new Date('30 May 2021 23:59:59').toLocaleString(),
    };
    
    for (const playerId of params.onStartPlayers) {
      const userName = _.pluck(
        _.where(params.gamePlayers, { playerId }),
        'playerName'
      );
      
      const query = {
        playerId,
        slab,
        month,
        year,
        userName: userName[0],
      };
      
      const queryIPLFilter = {
        playerId,
        slab,
        year,
        userName: userName[0],
      };
      
      let noOfHands = 0;
      if (
        params.roundName === stateOfX.round.flop ||
        params.roundName === stateOfX.round.turn ||
        params.roundName === stateOfX.round.river ||
        params.roundName === stateOfX.round.showdown
      ) {
        noOfHands = 1;
      }
      
      const update = {
        $inc: { noOfHands },
        $set: { blinds },
      };
      
      // IPL logic would go here
      await this.logDB.insertAndUpdateContestData(query, update);
      await this.logDB.insertAndUpdateContestDataIPL(queryIPLFilter, update);
    }
  }
}

