import { Injectable } from '@nestjs/common';
import { writeFile, readFile } from 'fs/promises';
import { join } from 'path';
import * as _ from 'underscore';
import { PokerDatabaseService } from '../datebase/pokerdatabase.service';

@Injectable()
export class ContestService {
  constructor(
    private readonly db: PokerDatabaseService
  ) {}

  async pushData(): Promise<void> {
    try {
      const params = {};
      const playersWithHands = await this.findAllUsers(params);
      const enrichedPlayers = await this.getTopPlayers(playersWithHands);
      const filePath = join(process.cwd(), 'contest.json');
      await writeFile(filePath, JSON.stringify(enrichedPlayers));
      console.log('Successfully Written to File.');
    } catch (err) {
      console.log('Error In contest Data', err);
    }
  }

  async pullData(): Promise<any> {
    const filePath = join(process.cwd(), 'contest.json');
    const data = await readFile(filePath, 'utf-8');
    const parsed = JSON.parse(data);
    return parsed;
  }

  private async findAllUsers(params: any): Promise<any> {

    const result = await this.db.findAllUserwithNoOfHands();
    
    if (result && result.length > 0) {
      params.allPlayers = [];
      let tempRank = 0;
      for (const player of result) {
        const temData: any = {};
        temData.playerId = player._id;
        temData.rank = ++tempRank;
        temData.totalHands = player.numberOfHands;
        params.allPlayers.push(temData);
      }
      return params;
    } else {
      throw new Error('Player ID does not exist');
    }
  }

  private async getTopPlayers(params: any): Promise<any> {
    const getTopPlayers = params.allPlayers;

    if (params && getTopPlayers.length > 0) {
      const playerData: any[] = [];

      for (const player of getTopPlayers) {
        const user = await this.db.findUser({ playerId: player.playerId });
        if (user) {
          const temData: any = {
            rank: player.rank,
            playerId: user.playerId,
            userName: user.userName,
            profileImage: user.profileImage,
            numberOfHands: player.totalHands,
          };
          playerData.push(temData);
        }
      }

      delete params.allPlayers;
      params.players = _.sortBy(playerData, 'rank');
      return params;
    } else {
      throw new Error('No any player is found!!');
    }
  }
}
