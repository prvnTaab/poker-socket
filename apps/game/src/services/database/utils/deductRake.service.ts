import { Injectable } from "@nestjs/common";
import { UtilsService } from "apps/game/src/utils/utils.service";
import { systemConfig } from "shared/common";
import { ActivityService } from "shared/common/activity/activity.service";
import stateOfX from "shared/common/stateOfX.sevice";
import { validateKeySets } from "shared/common/utils/activity";
import _ from "underscore";


@Injectable()
export class DeductRakeService {


    constructor(
        private readonly activity:ActivityService,
        private readonly utilsService:UtilsService
    ) {} 



    // init params as empty or zero
initializeParams(params: any): Promise<any> {
  params.rakesToDeduct = [];
  params.rakesFromPlayers = [];
  params.potAmount = 0;
  params.rakeFromTable = 0;
  params.rakeDetails = {
    rakeDeducted: false,
    playerWins: {}
  };
  return params;
}

// ### Check if rake should deduct in this game or not
// this function is also used in - rewardMegaPoints
shouldRakeDeduct(params: any): any{
  console.log("Inside deductRake function shouldrakededuct params", params);

  if (params.table.channelType !== stateOfX.gameType.normal) {
    return {
      success: true,
      params,
      info: "This is not the case where rake should deduct!",
      isRetry: false,
      isDisplay: false,
      channelId: ""
    };
  }

  if (!params.table.isRealMoney) {
    return {
      success: true,
      params,
      info: "This is not the case where rake should deduct!",
      isRetry: false,
      isDisplay: false,
      channelId: ""
    };
  }

  if (params.table.roundName === stateOfX.round.preflop) {
    return {
      success: true,
      params,
      info: "This is not the case where rake should deduct!",
      isRetry: false,
      isDisplay: false,
      channelId: ""
    };
  }

  if (!params.data.rakeShouldDeduct && !!params.data.winnerRanking) {
    const sameWinnerLength = _.where(params.data.winnerRanking, { winnerRank: 1 }).length;

    if (params.data.winnerRanking.length === sameWinnerLength) {
      const totalPot = params.table.totalPotForRound;
      let playerTotalBets = 0;

      for (let i = 0; i < params.data.winnerRanking.length; i++) {
        const player = _.findWhere(params.table.players, {
          playerId: params.data.winnerRanking[i].playerId
        });

        if (player) {
          playerTotalBets += player.totalGameBet;
        }
      }

      if (totalPot === playerTotalBets) {
        console.log("Finally this condition triggers");
        return {
          success: true,
          params,
          info: "This is not the case where rake should deduct!",
          isRetry: false,
          isDisplay: false,
          channelId: ""
        };
      }
    }
  }

  return params;
};


// ### Decide the value of rakePercent to be used
decideRakeDeductValues(params: any): any{
  params.rakePercent = Number(systemConfig.rakePercent); // rakePercent can be a decimal

  if (
    !!params.table.rake &&
    !!params.table.rake.rakePercentTwo &&
    !!params.table.rake.rakePercentThreeFour &&
    !!params.table.rake.rakePercentMoreThanFive
  ) {
    if (params.table.onStartPlayers.length === 2) {
      params.rakePercent = params.table.rake.rakePercentTwo;
    } else if (
      params.table.onStartPlayers.length === 3 ||
      params.table.onStartPlayers.length === 4
    ) {
      params.rakePercent = params.table.rake.rakePercentThreeFour;
    } else if (params.table.onStartPlayers.length >= 5) {
      params.rakePercent = params.table.rake.rakePercentMoreThanFive;
    }
  }

  return params;
};


// ### Calculate rake value generated from table
async calculateRakeValues(params: any): Promise<any> {
  params.potAmount = 0;

  for (let i = 0; i < params.data.decisionParams.length; i++) {
    if (!params.data.decisionParams[i].isRefund) {
      if (
        params.table.isRunItTwiceApplied ||
        params.data.decisionParams[i].winners.length <= 1
      ) {
        params.potAmount += params.data.decisionParams[i].amount;
      }
    }
  }

  params.rakeFromTable = (params.rakePercent * params.potAmount) / 100;
  params.rakeFromTable = await this.roundOffInt(params.rakeFromTable);

  return params;
};


// calculate actual rake-able amount
// total pot minus refund pot
async calculateRakeValuesSingleWinner(params: any): Promise<any> {
  params.potAmount = 0;

  let maxCont = -1;
  let secondMaxCont = -1;

  if (params.table.contributors[0].amount > params.table.contributors[1].amount) {
    secondMaxCont = params.table.contributors[1].amount;
    maxCont = params.table.contributors[0].amount;
  } else {
    secondMaxCont = params.table.contributors[0].amount;
    maxCont = params.table.contributors[1].amount;
  }

  for (let i = 0; i < params.table.contributors.length; i++) {
    params.potAmount += params.table.contributors[i].amount;

    if (i >= 2 && params.table.contributors[i].amount >= maxCont) {
      secondMaxCont = maxCont;
      maxCont = params.table.contributors[i].amount;
    } else if (i >= 2 && params.table.contributors[i].amount >= secondMaxCont) {
      secondMaxCont = params.table.contributors[i].amount;
    }
  }

  params.potAmount -= (maxCont - secondMaxCont);
  params.rakeFromTable = (params.rakePercent * params.potAmount) / 100;
  params.rakeFromTable = await this.roundOffInt(params.rakeFromTable);

  return params;
};


// ### Calculate rake to be deducted according to cap
applyCapOnRake(params: any): Promise<any> {
  if (!!params.table.rake) {
    let rakeCap = params.rakeFromTable;

    rakeCap = (params.table.onStartPlayers.length === 2)
      ? params.table.rake.capTwo
      : rakeCap;

    rakeCap = (params.table.onStartPlayers.length === 3 || params.table.onStartPlayers.length === 4)
      ? params.table.rake.capThreeFour
      : rakeCap;

    rakeCap = (params.table.onStartPlayers.length >= 5)
      ? params.table.rake.capMoreThanFive
      : rakeCap;

    params.rakeFromTable = (params.rakeFromTable > rakeCap) ? rakeCap : params.rakeFromTable;
  } else {
    params.rakeFromTable = (params.rakeFromTable > systemConfig.rakeCapValue)
      ? systemConfig.rakeCapValue
      : params.rakeFromTable;
  }

  return params;
};

// assign winningamount to winners after
assignWinningAmount(winners: any[], winningAmount: number): any {
  for (let i = 0; i < winners.length; i++) {
    const winner = winners[i];
    winner.winningAmount = winningAmount;
  }
  return winners;
};


// set each pot, each winner winning amount
async setEachPotRake(params: any): Promise<any> {
  params.rakeDetails = {};
  let totalPotAmount = 0;
  let winningAmount = 0;
  let winningAmountHigh = 0;
  let winningAmountLow = 0;

  for (let i = 0; i < params.data.decisionParams.length; i++) {
    const decisionParamTemp = JSON.stringify(params.data.decisionParams[i]);
    let decisionParam = JSON.parse(decisionParamTemp);

    totalPotAmount += decisionParam.amount;

    if (params.table.channelVariation !== stateOfX.channelVariation.omahahilo) {
      params.winners = _.union(params.winners, decisionParam.winners);
    } else {
      if (!!decisionParam.winners.winnerHigh) {
        params.winners = _.union(params.winners, decisionParam.winners.winnerHigh);
        params.winners = _.union(params.winners, decisionParam.winners.winnerLo);
      } else {
        params.winners = _.union(params.winners, decisionParam.winners);
      }
    }

    if (!decisionParam.isRefund) {
      if (params.table.isRunItTwiceApplied || params.data.decisionParams[i].winners.length <= 1) {
        decisionParam.rake = params.rakeFromTable * Math.min((decisionParam.amount / params.potAmount), 1);
        decisionParam.rake = decisionParam.rake || 0;
        decisionParam.rake = await this.roundOffInt(decisionParam.rake);
      } else {
        decisionParam.rake = 0;
      }
    } else {
      decisionParam.rake = 0;
    }

    params.totalPotAmount = totalPotAmount;
    params.rakeDetails.totalPotAmount = totalPotAmount;

    if (params.table.channelVariation !== stateOfX.channelVariation.omahahilo) {
      winningAmount = (decisionParam.amount - decisionParam.rake) / decisionParam.winners.length;
    } else {
      if (!!decisionParam.winners.winnerHigh && !!decisionParam.winners.winnerLo) {
        if (decisionParam.winners.winnerLo.length === 0) {
          winningAmountHigh = (decisionParam.amount - decisionParam.rake) / decisionParam.winners.winnerHigh.length;
        } else {
          winningAmountHigh = (decisionParam.amount - decisionParam.rake) / (decisionParam.winners.winnerHigh.length * 2);
          winningAmountLow = (decisionParam.amount - decisionParam.rake) / (decisionParam.winners.winnerLo.length * 2);
        }
      } else {
        winningAmount = (decisionParam.amount - decisionParam.rake) / decisionParam.winners.length;
      }
    }

    const roundOffWinAmount = await this.roundOffInt(winningAmount);

    if (params.table.channelVariation !== stateOfX.channelVariation.omahahilo || !decisionParam.winners.winnerHigh) {
      decisionParam.winners = await this.assignWinningAmount(decisionParam.winners, roundOffWinAmount);
      params.data.decisionParams[i] = decisionParam;
    } else {
      const roundOffWinAmountHigh = await this.roundOffInt(winningAmountHigh);
      const roundOffWinAmountLow = await this.roundOffInt(winningAmountLow);

      decisionParam.winners.winnerHigh = await this.assignWinningAmount(decisionParam.winners.winnerHigh, roundOffWinAmountHigh);
      decisionParam.winners.winnerLo = await this.assignWinningAmount(decisionParam.winners.winnerLo, roundOffWinAmountLow);
      params.data.decisionParams[i] = decisionParam;
    }
  }

  return params;
};

// assign totalRake in params
playerWins(params: any): any{
    let totalRake = 0;

    for (const decisionParam of params.data.decisionParams) {
        // Grouping all wins of each player
        params.winnersGrouped = _.groupBy(params.winners, 'playerId');
        totalRake += decisionParam.rake;
    }

    params.totalRake = totalRake;
    return params;
}


// handle rake round off
async handleRakeRoundOff(params: any): Promise<any> {
    let sumOfRoundedWinAmt = 0;
    params.rakeDetails.playerWins = {};

    for (const winnerGroup of Object.values(params.winnersGrouped)) {
        const winnerList = winnerGroup as any[];
        let winamt = 0;

        for (const singleWinner of winnerList) {
            winamt += singleWinner.winningAmount;
        }

        const roundedWinamt = await this.roundOffInt(winamt);
        sumOfRoundedWinAmt += roundedWinamt;

        const diff = roundedWinamt - winamt;
        params.rakeDetails.playerWins[winnerList[0].playerId] = roundedWinamt;
        params.totalRake -= diff;
    }

    params.rakeDetails.rakeDeducted = true;
    sumOfRoundedWinAmt += params.totalRake;
    params.totalRake = this.utilsService.convertIntToDecimal(params.totalRake);
    params.rakeDetails.totalRake = this.utilsService.convertIntToDecimal(params.totalRake);
    params.table.summaryOfAllPlayers["rake"] = params.totalRake;

    // Keeping logic the same (even failed case returns params)
    return params;
}

// ### Deduct rake on table

async deductRakeOnTable(params: any): Promise<any> {
	try {
		const validated = await validateKeySets("Request", "database", "deductRakeOnTable", params);
		
		if (!validated.success) {
			this.activity.rakeDeducted(
				validated,
				stateOfX.profile.category.game,
				stateOfX.game.subCategory.rakeDeduct,
				stateOfX.logType.error
			);
			return validated;
		}

		params = await this.initializeParams(params);
		params = await this.shouldRakeDeduct(params);
		params = await this.decideRakeDeductValues(params);
		params = await this.calculateRakeValues(params);
		params = await this.applyCapOnRake(params);
		params = await this.setEachPotRake(params);
		params = await this.playerWins(params);
		params = await this.handleRakeRoundOff(params);

		this.activity.rakeDeducted(
			params,
			stateOfX.profile.category.game,
			stateOfX.game.subCategory.rakeDeduct,
			stateOfX.logType.success
		);

		return { success: true, params };
	} catch (err) {
		this.activity.rakeDeducted(
			err,
			stateOfX.profile.category.game,
			stateOfX.game.subCategory.rakeDeduct,
			stateOfX.logType.error
		);
		return err;
	}
};

// deduct rake single conpetitor case
async deductRakeOnTableSingleWinner(params: any): Promise<any> {
	try {
		const validated = await validateKeySets("Request", "database", "deductRakeOnTable", params);

		if (!validated.success) {
			this.activity.rakeDeducted(
				validated,
				stateOfX.profile.category.game,
				stateOfX.game.subCategory.rakeDeduct,
				stateOfX.logType.error
			);
			return validated;
		}

		params = await this.initializeParams(params);
		params = await this.shouldRakeDeduct(params);
		params = await this.decideRakeDeductValues(params);
		params = await this.calculateRakeValuesSingleWinner(params);
		params = await this.applyCapOnRake(params);
		params = await this.setEachPotRake(params);
		params = await this.playerWins(params);
		params = await this.handleRakeRoundOff(params);

		this.activity.rakeDeducted(
			params,
			stateOfX.profile.category.game,
			stateOfX.game.subCategory.rakeDeduct,
			stateOfX.logType.success
		);

		return { success: true, params };
	} catch (err) {
		this.activity.rakeDeducted(
			err,
			stateOfX.profile.category.game,
			stateOfX.game.subCategory.rakeDeduct,
			stateOfX.logType.error
		);
		return err;
	}
};








}