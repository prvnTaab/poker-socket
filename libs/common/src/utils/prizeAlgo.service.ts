import { Injectable } from "@nestjs/common";
import _ from 'underscore';
import { PokerDatabaseService } from "../datebase/pokerdatabase.service";







@Injectable()
export class PrizeAlgoService  {


    constructor(
        private readonly db:PokerDatabaseService
    ) {}




/**
   * This function calculates the prize distribution based on total players, minimum players,
   * entry fees, rebuys, and addons. Uses a tiered grouping logic to determine increment ratios
   * and distribute the prize money proportionally.
   */
async prizeDistributionAlgo (
  isGuaranteed: boolean,
  guaranteedAmount: number,
  priceStructure: string,
  totalplayers: number,
  minplayers: number,
  entryFees: number,
  rebuys: number,
  addons: number
): Promise<any>{
  if (minplayers > totalplayers) {
    return;
  }

  const prizePoolType =
    priceStructure.toUpperCase() === 'PLATINUM'
      ? 'C'
      : priceStructure.toUpperCase() === 'GOLD'
      ? 'B'
      : priceStructure.toUpperCase() === 'SITNGO'
      ? 'SITNGO'
      : 'A';

  const prizePoolFromDb = await this.db.findPrizePoolStructure({
    type: prizePoolType,
    totalplayers: totalplayers,
  });

  const prizeStructureList = prizePoolFromDb.prize;
  const prize_to_be_distributed = prizeStructureList.length;
  const minimum_prize_pool = minplayers * entryFees + rebuys + addons;
  const total_prize_pool = isGuaranteed
    ? guaranteedAmount
    : totalplayers * entryFees + rebuys + addons;

  if (prize_to_be_distributed === 1) {
    return [
      {
        position: 1,
        prizeMoney: total_prize_pool,
        percentage: 100,
      },
    ];
  }

  const player1st_from_minimum_prize_pool = Math.round(minimum_prize_pool * 0.2);
  const player2nd_from_minimum_prize_pool = Math.round(minimum_prize_pool * 0.1);
  const remaining_prize_pool = Math.round(
    total_prize_pool - minimum_prize_pool * 0.3
  );

  const group = this.formGroup(prize_to_be_distributed);
  const groupLength = group.length;

  for (let i = 0; i < groupLength; i++) {
    const outstanding_amount = (prizeStructureList[i] / 100) * remaining_prize_pool;
    group[i].percentage = prizeStructureList[i];
    group[i].prizeMoney = Math.round(outstanding_amount);
  }

  group[0].prizeMoney = Math.round(
    group[0].prizeMoney + player1st_from_minimum_prize_pool
  );
  group[1].prizeMoney = Math.round(
    group[1].prizeMoney + player2nd_from_minimum_prize_pool
  );

  return group;
};


  /**
   * Form prize groups based on player count. Players are grouped in ranges with different sizes:
   * - 1-10: One per group
   * - 11-40: Groups of 3
   * - 41-100: Groups of 5
   * - 101-200: Groups of 7
   * - 201+: Groups of 10
   */
  formGroup(totalPlayer: number): any {
    const group: { position: number }[][] = [];

    // 1–10: one per group
    const maxSingle = Math.min(totalPlayer, 10);
    for (let i = 1; i <= maxSingle; i++) {
      group.push([{ position: i }]);
    }
    if (totalPlayer <= 10) return group;

    // 11–40: group of 3
    let obj: { position: number }[] = [];
    for (let i = 11; i <= Math.min(totalPlayer, 40); i++) {
      obj.push({ position: i });
      if ((i - 10) % 3 === 0) {
        group.push(obj);
        obj = [];
      }
    }
    if (obj.length) group.push(obj);
    if (totalPlayer <= 40) return group;

    // 41–100: group of 5
    obj = [];
    for (let i = 41; i <= Math.min(totalPlayer, 100); i++) {
      obj.push({ position: i });
      if ((i - 40) % 5 === 0) {
        group.push(obj);
        obj = [];
      }
    }
    if (obj.length) group.push(obj);
    if (totalPlayer <= 100) return group;

    // 101–200: group of 7
    obj = [];
    for (let i = 101; i <= Math.min(totalPlayer, 200); i++) {
      obj.push({ position: i });
      if ((i - 100) % 7 === 0) {
        group.push(obj);
        obj = [];
      }
    }
    if (obj.length) group.push(obj);
    if (totalPlayer <= 200) return group;

    // 201+: group of 10
    obj = [];
    for (let i = 201; i <= totalPlayer; i++) {
      obj.push({ position: i });
      if ((i - 200) % 10 === 0) {
        group.push(obj);
        obj = [];
      }
    }
    if (obj.length) group.push(obj);

    return group;
  }


  /**
   * This method processes the prize distribution using the prize distribution algorithm
   * and prepares the output for DB insertion by omitting internal computation fields.
   * 
   * @param totalPlayers Total number of players in the tournament
   * @param minPlayers Minimum players required to start the tournament
   * @param entryFees Entry fees per player
   * @param rebuys Total chips from rebuys
   * @param addons Total chips from addons
   * @returns Cleaned prize structure ready for DB
   */
async prizeForDb (isGuaranteed, guaranteedAmount, priceStructure, totalPlayers?:any, minPlayers?:any, entryFees?:any, rebuys?:any, addons?:any) {
	return await this.prizeDistributionAlgo(isGuaranteed, guaranteedAmount, priceStructure, totalPlayers, minPlayers, entryFees, rebuys, addons);
}


  /**
   * This method generates a prize structure for multiple prize tiers between minPlayers to totalPlayers.
   * 
   * @param totalPlayers Final upper limit for player count
   * @param minPlayers Starting lower limit for player count
   * @param entryFees Entry fee per player
   * @param rebuys Rebuy chips value
   * @param addons Addon chips value
   * @returns Array of prize structures for each 4-player increment
   */
generalizePrizeStructure(totalPlayers, minPlayers, entryFees, rebuys, addons) {
	let prizeArray = [];
	for (let i = minPlayers; i < totalPlayers; i += 4) {
		let prizes:any = this.prizeForDb(i + 4, i, entryFees, rebuys, addons);
		prizeArray.push({
			lowerLimit: i,
			upperlimit: i + 4,
			noOfPrizes: prizes?.length,
			prizes: prizes
		})
	}
	console.log('value of prizeArray in prizeAlgo is', prizeArray);
	return prizeArray;
}








}