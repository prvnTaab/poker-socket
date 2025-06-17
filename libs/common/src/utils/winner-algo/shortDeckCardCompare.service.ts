import { Injectable } from "@nestjs/common";
import _ from 'underscore';




@Injectable()
export class ShortDeckCardCompareService {


    constructor(

    ) {}





    _options = {
    // winning priority of suits are not in action now this is for future use
    wininingPriority: {
      cardType: {
        "spade": {
          priority: 4
        },
        "heart": {
          priority: 3
        },
        "diamond": {
          priority: 2
        },
        "club": {
          priority: 1
        }
      },
      // for setting the hands priority
      setType: {
        "highcard": {
          type: 'High Card',
          displayName: 'High Card',
          priority: 1
        },
        "onepair": {
          type: 'One Pair',
          displayName: 'One Pair',
          priority: 2
        },
        "twopair": {
          type: 'Two Pairs',
          displayName: 'Two Pairs',
          priority: 3
        },

        "straight": {
          type: 'Straight',
          displayName: 'Straight',
          priority: 4
        },

        "threeofakind": {
          type: 'Three Of A Kind',
          displayName: 'Three Of A Kind',
          priority: 5
        },
        "fullhouse": {
          type: 'Full House',
          displayName: 'Full House',
          priority: 6
        },
        "flush": {
          type: 'Flush',
          displayName: 'Flush',
          priority: 7
        },
        
        "fourofakind": {
          type: 'Four Of A Kind',
          displayName: 'Four Of A Kind',
          priority: 8
        },
        "straightflush": {
          type: 'Straight Flush',
          displayName: 'Straight Flush',
          priority: 9
        },
        "royalflush": {
          type: 'Royal Flush',
          displayName: 'Royal Flush',
          priority: 10
        }
      }
    }
  }

  
  /**
 * Check whether hand is royal flush 
 *
 * @method isRoyalFlush
 * @param  {Object}       cardSet  request json object
 * @return {bool}              true/false
 */
  isRoyalFlush(cardSet: any): boolean {
    if (this.isSameSuit(cardSet)) {
      const sorted = _.sortBy(cardSet, 'priority');
      const expected = [10, 11, 12, 13, 14];
      return sorted.every((card, i) => card.priority === expected[i]);
    }
    return false;
  }

  
  /**
 *  Check whether hand is of same suit 
 *
 * @method isSameSuit
 * @param  {Object}       cardSet  request json object
 * @return {bool}              true/false
 */
  isSameSuit(cardSet: any): boolean {
    const suit = cardSet[0].type;
    return cardSet.every((card) => card.type === suit);
  }
  
   /**
 *   Check whether hand is of straight flush 
 *
 * @method isStraightFlush
 * @param  {Object}       cardSet  request json object
 * @return {bool}              true/false
 */
  isStraightFlush(cardSet: any): boolean {
    if (!this.isSameSuit(cardSet)) {
      return false;
    }

    const sortedPriority = _.sortBy(cardSet, 'priority');
    const sortedRank = _.sortBy(cardSet, 'rank');

    let firstRank = sortedRank[0].rank;
    if (firstRank === 1) {
      firstRank = 5; // Ace-low straight (A-2-3-4-5)
    }

    const isConsecutivePriority =
      sortedPriority[0].priority + 1 === sortedPriority[1].priority &&
      sortedPriority[1].priority + 1 === sortedPriority[2].priority &&
      sortedPriority[2].priority + 1 === sortedPriority[3].priority &&
      sortedPriority[3].priority + 1 === sortedPriority[4].priority;

    const isConsecutiveRank =
      firstRank + 1 === sortedRank[1].rank &&
      sortedRank[1].rank + 1 === sortedRank[2].rank &&
      sortedRank[2].rank + 1 === sortedRank[3].rank &&
      sortedRank[3].rank + 1 === sortedRank[4].rank;

    return isConsecutivePriority || isConsecutiveRank;
  }
  
    /**
 * Check whether hand is of fourof a kind
 *
 * @method isStraightFlush
 * @param  {Object}       cardSet  request json object
 * @return {bool}              true/false
 */
  isFourOfAKind(cardSet: any): boolean {
    const firstCardRank = cardSet[0].rank;
    const secondCardRank = cardSet[1].rank;

    const firstCount = _.filter(cardSet, { rank: firstCardRank }).length;
    const secondCount = _.filter(cardSet, { rank: secondCardRank }).length;

    return firstCount === 4 || secondCount === 4;
  }
  
     /**
 * Check whether hand is of fullHouse
 *
 * @method fullHouse
 * @param  {Object}       cardSet  request json object
 * @return {bool}              true/false
 */
  isFullHouse(cardSet: any): boolean {
    const sorted = _.sortBy(cardSet, 'rank').reverse();

    const firstThree = _.filter(sorted, { rank: sorted[0].rank });
    if (firstThree.length === 3) {
      const remainingTwo = _.filter(sorted, { rank: sorted[3].rank });
      return remainingTwo.length === 2;
    }

    const firstTwo = _.filter(sorted, { rank: sorted[0].rank });
    if (firstTwo.length === 2) {
      const remainingThree = _.filter(sorted, { rank: sorted[2].rank });
      return remainingThree.length === 3;
    }

    return false;
  }
  
      /**
 * Check whether hand is of flush
 *
 * @method isFlush
 * @param  {Object}       cardSet  request json object
 * @return {bool}              true/false
 */
isFlush(cardSet: any): boolean {
    return this.isSameSuit(cardSet);
  }

  isStraight(cardSet: any): boolean {
    const sortedPriority = _.sortBy(cardSet, 'priority');
    const sortedRank = _.sortBy(cardSet, 'rank');
    let firstRank = sortedRank[0].rank;
    if (firstRank === 1) {
      firstRank = 5;
    }

    const isConsecutivePriority =
      sortedPriority[0].priority + 1 === sortedPriority[1].priority &&
      sortedPriority[1].priority + 1 === sortedPriority[2].priority &&
      sortedPriority[2].priority + 1 === sortedPriority[3].priority &&
      sortedPriority[3].priority + 1 === sortedPriority[4].priority;

    const isConsecutiveRank =
      firstRank + 1 === sortedRank[1].rank &&
      sortedRank[1].rank + 1 === sortedRank[2].rank &&
      sortedRank[2].rank + 1 === sortedRank[3].rank &&
      sortedRank[3].rank + 1 === sortedRank[4].rank;

    return isConsecutivePriority || isConsecutiveRank;
  }

  isThreeOfAKind(cardSet: any): boolean {
    return (
      _.filter(cardSet, { rank: cardSet[0].rank }).length === 3 ||
      _.filter(cardSet, { rank: cardSet[1].rank }).length === 3 ||
      _.filter(cardSet, { rank: cardSet[2].rank }).length === 3
    );
  }

  isTwoPair(cardSet: any): boolean {
    const sorted = _.sortBy(cardSet, 'rank');
    let count = 0;
    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i].rank === sorted[i + 1].rank) {
        count++;
        i++; // skip next to prevent overlapping pairs
      }
    }
    return count === 2;
  }

  isOnePair(cardSet: any): boolean {
    const sorted = _.sortBy(cardSet, 'rank');
    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i].rank === sorted[i + 1].rank) {
        return true;
      }
    }
    return false;
  }

//   getSetType(cardSet: any, options: any): string {
//     const setType = options.wininingPriority.setType;

//     if (this.isRoyalFlush(cardSet)) return setType.royalflush;
//     if (this.isStraightFlush(cardSet)) return setType.straightflush;
//     if (this.isFourOfAKind(cardSet)) return setType.fourofakind;
//     if (this.isFullHouse(cardSet)) return setType.fullhouse;
//     if (this.isFlush(cardSet)) return setType.flush;
//     if (this.isStraight(cardSet)) return setType.straight;
//     if (this.isThreeOfAKind(cardSet)) return setType.threeofakind;
//     if (this.isTwoPair(cardSet)) return setType.twopair;
//     if (this.isOnePair(cardSet)) return setType.onepair;
//     return setType.highcard;
//   }

 
          /**
 *  This function is used to compare hands if hands priority are same
 *
 * @method getGreatestFromType
 * @param  {Object}       type,sets,setProp  request json object
 * @return {bool}              true/false
 */
getGreatest(sets: any[], setProp: string = 'set'): any[] {
    const arrNew = [];
    let maxPriority = -1;

    for (const set of sets) {
      const setType = this.getSetType(set[setProp]);
      set.type = setType.type;
      set.typeName = setType.displayName;

      arrNew.push({
        type: setType.type,
        typeName: setType.displayName,
        priority: setType.priority,
        set,
      });
    }

    const sorted = _.sortBy(arrNew, 'priority').reverse();
    maxPriority = sorted[0].priority;
    const typeLeft = _.where(sorted, { priority: maxPriority });

    if (typeLeft.length >= 1) {
      return this.getGreatestFromType(typeLeft[0].type, typeLeft.map(a => a.set));
    }

    return [sorted[0].set];
  }

  private getGreatestFromType(type: string, sets: any[], setProp: string = 'set'): any[] {
    switch (type) {
      case 'Royal Flush': return this.compareRoyalFlush(sets, setProp);
      case 'Straight Flush': return this.compareStraightFlush(sets, setProp);
      case 'Four Of A Kind': return this.compareFourOfAKind(sets, setProp);
      // Add more cases as needed...
      default:
        console.log('No case handle for this form!');
        return sets;
    }
  }

  private compareRoyalFlush(sets: any[], _setProp: string): any[] {
    return sets;
  }

  private compareStraightFlush(sets: any[], _setProp: string): any[] {
    const sortedSet = sets.map(set => {
      const sorted = _.sortBy(set.set, 'priority').reverse();
      if (sorted[0].priority === 14 && sorted[1].priority !== 13) {
        const aceLow = {
          ...sorted[0],
          priority: 5,
        };
        sorted.shift();
        sorted.push(aceLow);
      }
      return {
        ...set,
        set: _.sortBy(sorted, 'priority').reverse(),
      };
    });

    const maxPriority = Math.max(...sortedSet.map(s => s.set[0].priority));
    return sortedSet.filter(s => s.set[0].priority === maxPriority);
  }

  private compareFourOfAKind(sets: any[], _setProp: string): any[] {
    const sortedSet = sets.map(set => ({
      ...set,
      set: _.sortBy(set.set, 'priority').reverse(),
    }));

    const maxFour = Math.max(...sortedSet.map(s => s.set[2].priority));
    const tempWinner = sortedSet.filter(s => s.set[2].priority === maxFour);

    if (tempWinner.length > 1) {
      const maxFifth = Math.max(
        ...tempWinner.map(t =>
          t.set[0].priority === t.set[1].priority ? t.set[4].priority : t.set[0].priority,
        ),
      );
      return tempWinner.filter(t =>
        (t.set[0].priority === t.set[1].priority ? t.set[4].priority : t.set[0].priority) === maxFifth,
      );
    }

    return tempWinner;
  }

  // Add remaining comparison methods here...

  private getSetType(cardSet: any[]): any {
    // Replace this with actual logic or import if already implemented
    // Example dummy structure
    return {
      type: 'Flush',
      displayName: 'Flush',
      priority: 5,
    };
  }
  
  /**
 * Compare hand with in compareFullHouse
 *
 * @method compareFullHouse
 * @param  {Object}       type,sets,setProp  request json object
 * @return {bool}              true/false
 */
compareFullHouse(sets: any[], _setProp: string): any[] {
  const sortedSet: any[] = [];
  const tempWinnerSets: any[] = [];
  const winnerSets: any[] = [];
  let maxThree = 0;
  let maxTwo = 0;

  for (const set of sets) {
    const sortedCards = _.sortBy(set.set, 'priority').reverse();
    sortedSet.push({
      ...set,
      set: sortedCards,
    });
  }

  // Step 1: Find maxThree value among all full houses
  for (const hand of sortedSet) {
    const triplePriority =
      hand.set[0].priority === hand.set[1].priority &&
      hand.set[1].priority === hand.set[2].priority
        ? hand.set[0].priority
        : hand.set[4].priority;

    if (triplePriority > maxThree) {
      maxThree = triplePriority;
    }
  }

  // Step 2: Filter sets with matching maxThree
  for (const hand of sortedSet) {
    const triplePriority =
      hand.set[0].priority === hand.set[1].priority &&
      hand.set[1].priority === hand.set[2].priority
        ? hand.set[0].priority
        : hand.set[4].priority;

    if (triplePriority === maxThree) {
      tempWinnerSets.push(hand);
    }
  }

  // Step 3: If multiple hands have the same triple, compare the pair
  if (tempWinnerSets.length > 1) {
    for (const hand of tempWinnerSets) {
      const pairPriority =
        hand.set[0].priority === hand.set[1].priority &&
        hand.set[1].priority === hand.set[2].priority
          ? hand.set[4].priority
          : hand.set[0].priority;

      if (pairPriority > maxTwo) {
        maxTwo = pairPriority;
      }
    }

    for (const hand of tempWinnerSets) {
      const pairPriority =
        hand.set[0].priority === hand.set[1].priority &&
        hand.set[1].priority === hand.set[2].priority
          ? hand.set[4].priority
          : hand.set[0].priority;

      if (pairPriority === maxTwo) {
        winnerSets.push(hand);
      }
    }
  } else {
    return tempWinnerSets;
  }

  return winnerSets;
}
  
  /**
 * Compare hand with in compareFlush
 *
 * @method compareFlush
 * @param  {Object}       type,sets,setProp  request json object
 * @return {bool}              true/false
 */
compareFlush(sets: any[], _setProp: string): any[] {
  const sortedSet: any[] = sets.map((set) => ({
    set: _.sortBy(set.set, 'priority').reverse(),
    playerId: set.playerId,
    type: set.type,
    typeName: set.typeName,
  }));

  let winnerSets: any[] = [...sortedSet];
  let tempWinnerSets: any[] = [];

  // Compare card by card from highest to lowest (index 0 to 4)
  for (let cardIndex = 0; cardIndex < 5; cardIndex++) {
    const maxPriority = Math.max(...winnerSets.map((set) => set.set[cardIndex].priority));
    tempWinnerSets = winnerSets.filter((set) => set.set[cardIndex].priority === maxPriority);

    winnerSets = tempWinnerSets;
    tempWinnerSets = [];

    if (winnerSets.length === 1) {
      break; // Found the single winner
    }
  }

  return winnerSets;
}

  
/**
 * Compare hand with in compareStraight
 *
 * @method compareStraight
 * @param  {Object}       type,sets,setProp  request json object
 * @return {bool}              true/false
 */
compareStraight(sets: any[], _setProp: string): any[] {
  const sortedSet = sets.map((set) => {
    const sorted = _.sortBy(set.set, 'priority').reverse();
    return {
      set: sorted,
      playerId: set.playerId,
      type: set.type,
      typeName: set.typeName,
    };
  });

  // Handle special case for Ace-low straight (A-2-3-4-5)
  for (const set of sortedSet) {
    set.set = _.sortBy(set.set, 'priority').reverse();

    if (set.set[0].priority === 14 && set.set[1].priority !== 13) {
      const aceAsFive = {
        type: set.set[0].type,
        rank: set.set[0].rank,
        name: set.set[0].name,
        priority: 5, // Adjust Ace to act as 5
      };

      set.set.shift(); // Remove Ace
      set.set.push(aceAsFive); // Push as low card
      set.set = _.sortBy(set.set, 'priority').reverse(); // Re-sort
    }
  }

  let winnerSets = [...sortedSet];
  let tempWinnerSets: any[] = [];

  // Compare card-by-card from index 0 to 4
  for (let cardIndex = 0; cardIndex < 5; cardIndex++) {
    const maxPriority = Math.max(...winnerSets.map((s) => s.set[cardIndex].priority));
    tempWinnerSets = winnerSets.filter((s) => s.set[cardIndex].priority === maxPriority);
    winnerSets = tempWinnerSets;
    tempWinnerSets = [];

    if (winnerSets.length === 1) break; // Found the sole winner early
  }

  return winnerSets;
}

 
  /**
 * Compare hand with in compareThreeOfAKind
 *
 * @method compareThreeOfAKind
 * @param  {Object}       type,sets,setProp  request json object
 * @return {bool}              true/false
 */
compareThreeOfAKind(sets: any, setProp: any): any {
    const sortedSet = sets.map(set => ({
      ...set,
      set: _.sortBy(set.set, 'priority').reverse()
    }));

    let max3 = 0;
    const tempWinnerSets: any = [];
    let winnerSets: any = [];

    for (const hand of sortedSet) {
      const s = hand.set;
      if (s[0].priority === s[1].priority && s[1].priority === s[2].priority) {
        max3 = Math.max(max3, s[0].priority);
      } else if (s[1].priority === s[2].priority && s[2].priority === s[3].priority) {
        max3 = Math.max(max3, s[1].priority);
      } else {
        max3 = Math.max(max3, s[3].priority);
      }
    }

    for (const hand of sortedSet) {
      const s = hand.set;
      const tempMax3 = (s[0].priority === s[1].priority && s[1].priority === s[2].priority)
        ? s[0].priority
        : (s[1].priority === s[2].priority && s[2].priority === s[3].priority)
          ? s[2].priority
          : s[3].priority;
      if (tempMax3 === max3) tempWinnerSets.push(hand);
    }

    if (tempWinnerSets.length <= 1) return tempWinnerSets;

    let max2 = 0;
    for (const hand of tempWinnerSets) {
      const s = hand.set;
      const tempMax2 = (s[0].priority === s[1].priority && s[1].priority === s[2].priority)
        ? s[3].priority
        : s[0].priority;
      max2 = Math.max(max2, tempMax2);
    }

    winnerSets = tempWinnerSets.filter(hand => {
      const s = hand.set;
      const tempMax2 = (s[0].priority === s[1].priority && s[1].priority === s[2].priority)
        ? s[3].priority
        : s[0].priority;
      return tempMax2 === max2;
    });

    if (winnerSets.length <= 1) return winnerSets;

    let max1 = 0;
    const finalWinners: any = [];
    for (const hand of winnerSets) {
      const s = hand.set;
      const tempMax1 = (s[0].priority === s[1].priority && s[1].priority === s[2].priority)
        ? s[4].priority
        : (s[1].priority === s[2].priority && s[2].priority === s[3].priority)
          ? s[4].priority
          : s[1].priority;
      max1 = Math.max(max1, tempMax1);
    }

    for (const hand of winnerSets) {
      const s = hand.set;
      const tempMax1 = (s[0].priority === s[1].priority && s[1].priority === s[2].priority)
        ? s[4].priority
        : (s[1].priority === s[2].priority && s[2].priority === s[3].priority)
          ? s[4].priority
          : s[1].priority;
      if (tempMax1 === max1) finalWinners.push(hand);
    }

    return finalWinners;
  }

  
/**
 * Compare hand with in compareTwoPair
 *
 * @method compareTwoPair
 * @param  {Object}       type,sets,setProp  request json object
 * @return {bool}              true/false
 */
compareTwoPair(sets: any, setProp: any): any {
    const sortedSet = sets.map(set => ({
      ...set,
      set: _.sortBy(set.set, 'priority').reverse()
    }));

    let maxPair1 = 0, maxPair2 = 0, maxFifthCard = 0;
    const tempWinnerSets: any = [];
    let winnerSets: any = [];

    for (const hand of sortedSet) {
      for (let j = 0; j < 4; j++) {
        if (hand.set[j].priority === hand.set[j + 1].priority) {
          maxPair1 = Math.max(maxPair1, hand.set[j].priority);
          break;
        }
      }
    }

    for (const hand of sortedSet) {
      let tempMaxPair1 = 0;
      for (let j = 0; j < 4; j++) {
        if (hand.set[j].priority === hand.set[j + 1].priority) {
          tempMaxPair1 = hand.set[j].priority;
          break;
        }
      }
      if (tempMaxPair1 === maxPair1) tempWinnerSets.push(hand);
    }

    if (tempWinnerSets.length <= 1) return tempWinnerSets;

    for (const hand of tempWinnerSets) {
      for (let j = 4; j > 0; j--) {
        if (hand.set[j].priority === hand.set[j - 1].priority) {
          maxPair2 = Math.max(maxPair2, hand.set[j].priority);
          break;
        }
      }
    }

    for (const hand of tempWinnerSets) {
      let tempMaxPair2 = 0;
      for (let j = 4; j > 0; j--) {
        if (hand.set[j].priority === hand.set[j - 1].priority) {
          tempMaxPair2 = hand.set[j].priority;
          break;
        }
      }
      if (tempMaxPair2 === maxPair2) winnerSets.push(hand);
    }

    if (winnerSets.length <= 1) return winnerSets;

    const finalWinners: any = [];
    for (const hand of winnerSets) {
      let xor = 0;
      for (const card of hand.set) xor ^= card.priority;
      maxFifthCard = Math.max(maxFifthCard, xor);
    }

    for (const hand of winnerSets) {
      let xor = 0;
      for (const card of hand.set) xor ^= card.priority;
      if (xor === maxFifthCard) finalWinners.push(hand);
    }

    return finalWinners;
  }

  
/**
 *  Compare hand with in compareOnePair
 *
 * @method compareOnePair
 * @param  {Object}       type,sets,setProp  request json object
 * @return {bool}              true/false
 */
compareOnePair(sets: any[], setProp: any): any[] {
    const sortedSet: any[] = [];
    let winnerSets: any[] = [];
    let tempWinnerSets: any[] = [];

    let maxPair1 = 0;
    let maxInOtherCard1 = 0;
    let maxInOtherCard2 = 0;
    let maxInOtherCard3 = 0;

    for (let i = 0; i < sets.length; i++) {
      const setObj: any = {
        set: _.sortBy(sets[i].set, 'priority').reverse(),
        playerId: sets[i].playerId,
        type: sets[i].type,
        typeName: sets[i].typeName,
      };
      sortedSet.push(setObj);
    }

    for (let i = 0; i < sortedSet.length; i++) {
      const s = sortedSet[i].set;
      if (s[0].priority === s[1].priority && s[0].priority > maxPair1) maxPair1 = s[0].priority;
      else if (s[1].priority === s[2].priority && s[1].priority > maxPair1) maxPair1 = s[1].priority;
      else if (s[2].priority === s[3].priority && s[2].priority > maxPair1) maxPair1 = s[2].priority;
      else if (s[3].priority === s[4].priority && s[3].priority > maxPair1) maxPair1 = s[3].priority;
    }

    for (let i = 0; i < sortedSet.length; i++) {
      const s = sortedSet[i].set;
      if ((s[0].priority === s[1].priority && maxPair1 === s[0].priority) ||
          (s[1].priority === s[2].priority && maxPair1 === s[1].priority) ||
          (s[2].priority === s[3].priority && maxPair1 === s[2].priority) ||
          (s[3].priority === s[4].priority && maxPair1 === s[3].priority)) {
        tempWinnerSets.push(sortedSet[i]);
      }
    }

    if (tempWinnerSets.length > 1) {
      for (let i = 0; i < tempWinnerSets.length; i++) {
        const s = tempWinnerSets[i].set;
        if (s[0].priority === s[1].priority && s[2].priority > maxInOtherCard1) maxInOtherCard1 = s[2].priority;
        else if (s[1].priority === s[2].priority && s[0].priority > maxInOtherCard1) maxInOtherCard1 = s[0].priority;
        else if (s[2].priority === s[3].priority && s[0].priority > maxInOtherCard1) maxInOtherCard1 = s[0].priority;
        else if (s[3].priority === s[4].priority && s[0].priority > maxInOtherCard1) maxInOtherCard1 = s[0].priority;
      }

      for (let i = 0; i < tempWinnerSets.length; i++) {
        const s = tempWinnerSets[i].set;
        if ((s[0].priority === s[1].priority && maxInOtherCard1 === s[2].priority) ||
            (s[1].priority === s[2].priority && maxInOtherCard1 === s[0].priority) ||
            (s[2].priority === s[3].priority && maxInOtherCard1 === s[0].priority) ||
            (s[3].priority === s[4].priority && maxInOtherCard1 === s[0].priority)) {
          winnerSets.push(tempWinnerSets[i]);
        }
      }

      if (winnerSets.length > 1) {
        tempWinnerSets = [];

        for (let i = 0; i < winnerSets.length; i++) {
          const s = winnerSets[i].set;
          if (s[0].priority === s[1].priority && s[3].priority > maxInOtherCard2) maxInOtherCard2 = s[3].priority;
          else if (s[1].priority === s[2].priority && s[3].priority > maxInOtherCard2) maxInOtherCard2 = s[3].priority;
          else if (s[2].priority === s[3].priority && s[1].priority > maxInOtherCard2) maxInOtherCard2 = s[1].priority;
          else if (s[3].priority === s[4].priority && s[1].priority > maxInOtherCard2) maxInOtherCard2 = s[1].priority;
        }

        for (let i = 0; i < winnerSets.length; i++) {
          const s = winnerSets[i].set;
          if ((s[0].priority === s[1].priority && maxInOtherCard2 === s[3].priority) ||
              (s[1].priority === s[2].priority && maxInOtherCard2 === s[3].priority) ||
              (s[2].priority === s[3].priority && maxInOtherCard2 === s[1].priority) ||
              (s[3].priority === s[4].priority && maxInOtherCard2 === s[1].priority)) {
            tempWinnerSets.push(winnerSets[i]);
          }
        }

        if (tempWinnerSets.length > 1) {
          winnerSets = [];

          for (let i = 0; i < tempWinnerSets.length; i++) {
            const s = tempWinnerSets[i].set;
            if (s[0].priority === s[1].priority && s[4].priority > maxInOtherCard3) maxInOtherCard3 = s[4].priority;
            else if (s[1].priority === s[2].priority && s[4].priority > maxInOtherCard3) maxInOtherCard3 = s[4].priority;
            else if (s[2].priority === s[3].priority && s[4].priority > maxInOtherCard3) maxInOtherCard3 = s[4].priority;
            else if (s[3].priority === s[4].priority && s[2].priority > maxInOtherCard3) maxInOtherCard3 = s[2].priority;
          }

          for (let i = 0; i < tempWinnerSets.length; i++) {
            const s = tempWinnerSets[i].set;
            if ((s[0].priority === s[1].priority && maxInOtherCard3 === s[4].priority) ||
                (s[1].priority === s[2].priority && maxInOtherCard3 === s[4].priority) ||
                (s[2].priority === s[3].priority && maxInOtherCard3 === s[4].priority) ||
                (s[3].priority === s[4].priority && maxInOtherCard3 === s[2].priority)) {
              winnerSets.push(tempWinnerSets[i]);
            }
          }

          return winnerSets;
        } else {
          return tempWinnerSets;
        }
      } else {
        return winnerSets;
      }
    } else {
      return tempWinnerSets;
    }
  }
  
  /**
 * Compare hand with in high cards
 *
 * @method compareHighcard
 * @param  {Object}       type,sets,setProp  request json object
 * @return {bool}              true/false
 */
compareHighcard(sets: any[], setProp: any): any {
    // Forwarding to compareFlush (assumed to be defined elsewhere or injected if needed)
    return this.compareFlush(sets, setProp);
  }

  getGreatestOmahaLo(sets: any[], setProp: any): any {
    const validSets: any[] = [];

    for (let i = 0; i < sets.length; i++) {
      if (!this.isRankHighThan8(sets[i].set) && !this.isOnePair(sets[i].set)) {
        validSets.push(sets[i]);
      }
    }

    if (validSets.length > 0) {
      const bestLo = this.compareHighCardInOmahaLo(validSets);
      return bestLo[0];
    } else {
      return null;
    }
  }

  findWinnerOmahaLo(sets: any[]): any[] {
    return this.compareHighCardInOmahaLo(sets);
  }

  private isRankHighThan8(sets: any[]): boolean {
    const filtered = sets.filter((set) => set.rank > 8);
    return filtered.length > 0;
  }

  private compareHighCardInOmahaLo(sets: any[]): any[] {
    const sortedSet: any[] = [];
    for (let i = 0; i < sets.length; i++) {
      const sorted = [...sets[i].set].sort((a, b) => b.rank - a.rank);
      sortedSet.push({ set: sorted, playerId: sets[i].playerId });
    }

    let winnerSets = this.findMinRankSets(sortedSet, 0);
    if (winnerSets.length > 1) winnerSets = this.findMinRankSets(winnerSets, 1);
    if (winnerSets.length > 1) winnerSets = this.findMinRankSets(winnerSets, 2);
    if (winnerSets.length > 1) winnerSets = this.findMinRankSets(winnerSets, 3);
    if (winnerSets.length > 1) winnerSets = this.findMinRankSets(winnerSets, 4);

    return winnerSets;
  }

  private findMinRankSets(sets: any[], index: number): any[] {
    let minRank = sets[0].set[index].rank;
    for (const s of sets) {
      if (s.set[index].rank < minRank) {
        minRank = s.set[index].rank;
      }
    }
    return sets.filter((s) => s.set[index].rank === minRank);
  }






}