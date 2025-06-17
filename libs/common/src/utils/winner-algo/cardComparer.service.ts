import { Injectable } from "@nestjs/common";
import _ from 'underscore';







@Injectable()
export class CardComparerService {






    _options = {
        wininingPriority: {
            cardType: {
                spade: { priority: 4 },
                heart: { priority: 3 },
                diamond: { priority: 2 },
                club: { priority: 1 },
            },
            setType: {
                highcard: {
                    type: 'High Card',
                    displayName: 'High Card',
                    priority: 1,
                },
                onepair: {
                    type: 'One Pair',
                    displayName: 'One Pair',
                    priority: 2,
                },
                twopair: {
                    type: 'Two Pairs',
                    displayName: 'Two Pairs',
                    priority: 3,
                },
                threeofakind: {
                    type: 'Three Of A Kind',
                    displayName: 'Three Of A Kind',
                    priority: 4,
                },
                straight: {
                    type: 'Straight',
                    displayName: 'Straight',
                    priority: 5,
                },
                flush: {
                    type: 'Flush',
                    displayName: 'Flush',
                    priority: 6,
                },
                fullhouse: {
                    type: 'Full House',
                    displayName: 'Full House',
                    priority: 7,
                },
                fourofakind: {
                    type: 'Four Of A Kind',
                    displayName: 'Four Of A Kind',
                    priority: 8,
                },
                straightflush: {
                    type: 'Straight Flush',
                    displayName: 'Straight Flush',
                    priority: 9,
                },
                royalflush: {
                    type: 'Royal Flush',
                    displayName: 'Royal Flush',
                    priority: 10,
                },
            },
        },
    };

    /**
    * Check whether hand is royal flush 
    *
    * @method isRoyalFlush
    * @param  {Object}       cardSet  request json object
    * @return {bool}              true/false
    */
    isRoyalFlush(cardSet: any): boolean {
        if (!this.isSameSuit(cardSet)) return false;

        const sortedPriority = _.sortBy(cardSet, 'priority');

        return (
            sortedPriority.length === 5 &&
            sortedPriority[0].priority === 10 &&
            sortedPriority[1].priority === 11 &&
            sortedPriority[2].priority === 12 &&
            sortedPriority[3].priority === 13 &&
            sortedPriority[4].priority === 14
        );
    }


    /**
    *  Check whether hand is of same suit 
    *
    * @method isSameSuit
    * @param  {Object}       cardSet  request json object
    * @return {bool}              true/false
    */
    isSameSuit(cardSet: any): boolean {
        if (cardSet.length === 0) return false;
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
    isStraightFlush(cardSet: any): any {
        if (!this.isSameSuit(cardSet)) return false;

        const sortedPriority = _.sortBy(cardSet, 'priority');
        const sortedRank = _.sortBy(cardSet, 'rank');

        const checkingPriority =
            sortedPriority[0].priority + 1 === sortedPriority[1].priority &&
            sortedPriority[1].priority + 1 === sortedPriority[2].priority &&
            sortedPriority[2].priority + 1 === sortedPriority[3].priority &&
            sortedPriority[3].priority + 1 === sortedPriority[4].priority;

        const checkingRank =
            sortedRank[0].rank + 1 === sortedRank[1].rank &&
            sortedRank[1].rank + 1 === sortedRank[2].rank &&
            sortedRank[2].rank + 1 === sortedRank[3].rank &&
            sortedRank[3].rank + 1 === sortedRank[4].rank;

        return checkingPriority || checkingRank;
    }

    /**
     * Check whether hand is Four of a Kind
     * @param cardSet - array of cards
     */
    isFourOfAKind(cardSet: any): boolean {
        const firstCardCount = _.filter(cardSet, { rank: cardSet[0].rank });
        const secondCardCount = _.filter(cardSet, { rank: cardSet[1].rank });

        return firstCardCount.length === 4 || secondCardCount.length === 4;
    }

    /**
     * Check whether hand is a Full House
     * @param cardSet - array of cards
     */
    isFullHouse(cardSet: any): any {
        const sortedRank = _.sortBy(cardSet, 'rank').reverse();

        const firstCardCount = _.filter(sortedRank, { rank: sortedRank[0].rank });

        if (firstCardCount.length === 3) {
            const remainingTwo = _.filter(sortedRank, { rank: sortedRank[3].rank });
            return remainingTwo.length === 2;
        }

        if (firstCardCount.length === 2) {
            const remainingThree = _.filter(sortedRank, { rank: sortedRank[2].rank });
            return remainingThree.length === 3;
        }

        return false;
    }

    //   /**
    //    * Helper to check if all cards are of the same suit
    //    */
    //   private isSameSuit(cardSet: Card[]): boolean {
    //     if (cardSet.length === 0) return false;
    //     const suit = cardSet[0].type;
    //     return cardSet.every((card) => card.type === suit);
    //   }


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

        const checkingPriority =
            sortedPriority[0].priority + 1 === sortedPriority[1].priority &&
            sortedPriority[1].priority + 1 === sortedPriority[2].priority &&
            sortedPriority[2].priority + 1 === sortedPriority[3].priority &&
            sortedPriority[3].priority + 1 === sortedPriority[4].priority;

        const checkingRank =
            sortedRank[0].rank + 1 === sortedRank[1].rank &&
            sortedRank[1].rank + 1 === sortedRank[2].rank &&
            sortedRank[2].rank + 1 === sortedRank[3].rank &&
            sortedRank[3].rank + 1 === sortedRank[4].rank;

        return checkingPriority || checkingRank;
    }

    isThreeOfAKind(cardSet: any): boolean {
        const first = _.filter(cardSet, { rank: cardSet[0].rank });
        const second = _.filter(cardSet, { rank: cardSet[1].rank });
        const third = _.filter(cardSet, { rank: cardSet[2].rank });

        return first.length === 3 || second.length === 3 || third.length === 3;
    }

    isTwoPair(cardSet: any): boolean {
        const sorted = _.sortBy(cardSet, 'rank');
        let count = 0;

        for (let i = 0; i < sorted.length - 1; i++) {
            if (sorted[i].rank === sorted[i + 1].rank) {
                count++;
                i++; // Skip next to prevent double-count
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

    getSetType(cardSet: any): { type: string; displayName: string; priority: number } {
        if (this.isRoyalFlush(cardSet)) {
            return this._options.wininingPriority.setType.royalflush;
        }
        if (this.isStraightFlush(cardSet)) {
            return this._options.wininingPriority.setType.straightflush;
        }
        if (this.isFourOfAKind(cardSet)) {
            return this._options.wininingPriority.setType.fourofakind;
        }
        if (this.isFullHouse(cardSet)) {
            return this._options.wininingPriority.setType.fullhouse;
        }
        if (this.isFlush(cardSet)) {
            return this._options.wininingPriority.setType.flush;
        }
        if (this.isStraight(cardSet)) {
            return this._options.wininingPriority.setType.straight;
        }
        if (this.isThreeOfAKind(cardSet)) {
            return this._options.wininingPriority.setType.threeofakind;
        }
        if (this.isTwoPair(cardSet)) {
            return this._options.wininingPriority.setType.twopair;
        }
        if (this.isOnePair(cardSet)) {
            return this._options.wininingPriority.setType.onepair;
        }

        return this._options.wininingPriority.setType.highcard;
    }

    // --- Private or previously defined helpers reused here --


    /**
    *  This function is used to compare hands if hands priority are same
    *
    * @method getGreatestFromType
    * @param  {Object}       type,sets,setProp  request json object
    * @return {bool}              true/false
    */
    getGreatestFromType(type: string, sets: any[], setProp: string = 'set'): any[] {
        switch (type) {
            case 'Royal Flush': return this.compareRoyalflush(sets, setProp);
            case 'Straight Flush': return this.compareStraightFlush(sets, setProp);
            case 'Four Of A Kind': return this.compareFourOfAKind(sets, setProp);
            case 'Full House': return this.compareFullHouse(sets, setProp);
            case 'Flush': return this.compareFlush(sets, setProp);
            case 'Straight': return this.compareStraight(sets, setProp);
            case 'Three Of A Kind': return this.compareThreeOfAKind(sets, setProp);
            case 'Two Pairs': return this.compareTwoPair(sets, setProp);
            case 'One Pair': return this.compareOnePair(sets, setProp);
            case 'High Card': return this.compareHighcard(sets, setProp);
            default:
                console.warn(`Unhandled hand type in comparison: ${type}`);
                break;
        }
        return [sets[0]];
    }

    /**
    * This function is used to find the greatest from the hands 
    *
    * @method getGreatest
    * @param  {Object}       type,sets,setProp  request json object
    * @return {bool}              true/false
    */
    getGreatest(sets: any[], setProp: string = 'set'): any[] {
        const evaluatedSets = sets.map((entry) => {
            const set = entry[setProp];
            const setType = this.getSetType(set);
            return {
                type: setType.type,
                typeName: setType.displayName,
                priority: setType.priority,
                set: entry,
            };
        });

        const sorted = _.sortBy(evaluatedSets, 'priority').reverse();
        const maxPriority = sorted[0]?.priority ?? -1;

        const topSets = sorted.filter((item) => item.priority === maxPriority);
        if (topSets.length > 1) {
            return this.getGreatestFromType(topSets[0].type, topSets.map((item) => item.set), setProp);
        }

        return [sorted[0].set];
    }


    /**
    * Compare hand with in royalFlush
    *
    * @method getGreatestFromType
    * @param  {Object}       type,sets,setProp  request json object
    * @return {bool}              true/false
    */
    compareRoyalflush(sets: any[], setProp: string = 'set'): any[] {
        // All Royal Flushes are equal in rank — no further comparison
        return sets;
    }


    /**
    *  Compare hand with in staraightFlush
    *
    * @method compareStraightFlush
    * @param  {Object}       sets,setProp  request json object
    * @return {bool}              true/false
    */
    compareStraightFlush(sets: any[], setProp: string = 'set'): any[] {
        const winnerSets: any[] = [];
        const sortedSet = sets.map(setEntry => {
            const sortedCards = _.sortBy(setEntry[setProp], 'priority').reverse();
            return {
                set: sortedCards,
                playerId: setEntry.playerId,
                type: setEntry.type,
                typeName: setEntry.typeName,
            };
        });

        for (const entry of sortedSet) {
            const isWheel = (
                entry.set[0].priority === 14 &&
                entry.set[1].priority === 5 &&
                entry.set[2].priority === 4 &&
                entry.set[3].priority === 3 &&
                entry.set[4].priority === 2
            );

            if (isWheel) {
                const lowAce = {
                    ...entry.set[0],
                    priority: 1, // Treat Ace as low for wheel
                };
                entry.set.shift();
                entry.set.push(lowAce);
                entry.set = _.sortBy(entry.set, 'priority').reverse();
            }
        }

        let highest = sortedSet[0];
        for (let i = 1; i < sortedSet.length; i++) {
            if (sortedSet[i].set[0].priority > highest.set[0].priority) {
                highest = sortedSet[i];
            }
        }

        for (const entry of sortedSet) {
            if (entry.set[0].priority === highest.set[0].priority) {
                winnerSets.push(entry);
            }
        }

        return winnerSets;
    }

    /**
     * Compare hand with in FourOfAKind
     *
     * @method compareFourOfAKind
     * @param  {Object}       type,sets,setProp  request json object
     * @return {bool}              true/false
     */
    compareFourOfAKind(sets: any[], setProp: string = 'set'): any[] {
        const sortedSet = sets.map(setEntry => {
            const sortedCards = _.sortBy(setEntry[setProp], 'priority').reverse();
            return {
                set: sortedCards,
                playerId: setEntry.playerId,
                type: setEntry.type,
                typeName: setEntry.typeName,
            };
        });

        let maxFourPriority = 0;
        for (const entry of sortedSet) {
            const quadPriority = entry.set[2].priority;
            if (quadPriority > maxFourPriority) {
                maxFourPriority = quadPriority;
            }
        }

        const tempWinners = sortedSet.filter(entry => entry.set[2].priority === maxFourPriority);

        if (tempWinners.length > 1) {
            let maxFifthCard = 0;
            for (const entry of tempWinners) {
                const kicker = entry.set[0].priority === entry.set[1].priority
                    ? entry.set[4].priority
                    : entry.set[0].priority;
                if (kicker > maxFifthCard) {
                    maxFifthCard = kicker;
                }
            }

            return tempWinners.filter(entry => {
                const kicker = entry.set[0].priority === entry.set[1].priority
                    ? entry.set[4].priority
                    : entry.set[0].priority;
                return kicker === maxFifthCard;
            });
        }

        return tempWinners;
    }

    /**
    * Compare hand with in compareFullHouse
    *
    * @method compareFullHouse
    * @param  {Object}       type,sets,setProp  request json object
    * @return {bool}              true/false
    */
    compareFullHouse(sets: any[], setProp: string = 'set'): any[] {
        const sortedSet = sets.map(setEntry => {
            const sortedCards = _.sortBy(setEntry[setProp], 'priority').reverse();
            return {
                set: sortedCards,
                playerId: setEntry.playerId,
                type: setEntry.type,
                typeName: setEntry.typeName,
            };
        });

        let maxThree = 0;
        for (const entry of sortedSet) {
            const triple = (entry.set[0].priority === entry.set[1].priority &&
                entry.set[1].priority === entry.set[2].priority)
                ? entry.set[0].priority
                : entry.set[4].priority;

            if (triple > maxThree) {
                maxThree = triple;
            }
        }

        const tempWinners = sortedSet.filter(entry => {
            const triple = (entry.set[0].priority === entry.set[1].priority &&
                entry.set[1].priority === entry.set[2].priority)
                ? entry.set[0].priority
                : entry.set[4].priority;

            return triple === maxThree;
        });

        if (tempWinners.length > 1) {
            let maxPair = 0;
            for (const entry of tempWinners) {
                const pair = (entry.set[0].priority === entry.set[1].priority &&
                    entry.set[1].priority === entry.set[2].priority)
                    ? entry.set[4].priority
                    : entry.set[0].priority;

                if (pair > maxPair) {
                    maxPair = pair;
                }
            }

            return tempWinners.filter(entry => {
                const pair = (entry.set[0].priority === entry.set[1].priority &&
                    entry.set[1].priority === entry.set[2].priority)
                    ? entry.set[4].priority
                    : entry.set[0].priority;

                return pair === maxPair;
            });
        }

        return tempWinners;
    }

    /**
    * Compare hand with in compareFlush
    *
    * @method compareFlush
    * @param  {Object}       type,sets,setProp  request json object
    * @return {bool}              true/false
    */
    compareFlush(sets: any, setProp: string): any {
        const sortedSets: any = sets.map(setObj => ({
            ...setObj,
            set: [...setObj.set].sort((a, b) => b.priority - a.priority),
        }));

        let winnerSets = sortedSets;
        for (let cardIndex = 0; cardIndex < 5; cardIndex++) {
            const maxPriority = Math.max(...winnerSets.map(s => s.set[cardIndex].priority));
            const filtered = winnerSets.filter(s => s.set[cardIndex].priority === maxPriority);
            winnerSets = filtered;

            if (winnerSets.length === 1) {
                return winnerSets;
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
    compareStraight(sets: any, setProp: string): any {
        const sortedSets: any = sets.map(setObj => {
            const sorted = [...setObj.set].sort((a, b) => b.priority - a.priority);

            // Check for wheel straight (A-2-3-4-5)
            const isWheel = sorted[0].priority === 14 &&
                sorted[1].priority === 5 &&
                sorted[2].priority === 4 &&
                sorted[3].priority === 3 &&
                sorted[4].priority === 2;

            if (isWheel) {
                const aceCard = {
                    ...sorted[0],
                    priority: 1
                };
                sorted.shift(); // remove Ace
                sorted.push(aceCard); // push Ace as low
                sorted.sort((a, b) => b.priority - a.priority);
            }

            return {
                ...setObj,
                set: sorted
            };
        });

        let winnerSets = sortedSets;
        for (let i = 0; i < 5; i++) {
            const maxPriority = Math.max(...winnerSets.map(s => s.set[i].priority));
            const filtered = winnerSets.filter(s => s.set[i].priority === maxPriority);
            winnerSets = filtered;

            if (winnerSets.length === 1) {
                return winnerSets;
            }
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
    compareThreeOfAKind(sets: any, setProp: string): any {
        const sortedSets: any = sets.map(setObj => ({
            ...setObj,
            set: [...setObj.set].sort((a, b) => b.priority - a.priority)
        }));

        let winnerSets: any = [];
        let tempWinnerSets: any = [];

        let max3 = 0;

        // Step 1: Find max triple
        for (const setObj of sortedSets) {
            const s = setObj.set;
            let tripletPriority = 0;

            if (s[0].priority === s[1].priority && s[1].priority === s[2].priority) {
                tripletPriority = s[0].priority;
            } else if (s[1].priority === s[2].priority && s[2].priority === s[3].priority) {
                tripletPriority = s[1].priority;
            } else {
                tripletPriority = s[3].priority;
            }

            if (tripletPriority > max3) {
                max3 = tripletPriority;
            }
        }

        // Step 2: Filter by max3
        for (const setObj of sortedSets) {
            const s = setObj.set;
            let tripletPriority = 0;

            if (s[0].priority === s[1].priority && s[1].priority === s[2].priority) {
                tripletPriority = s[0].priority;
            } else if (s[1].priority === s[2].priority && s[2].priority === s[3].priority) {
                tripletPriority = s[1].priority;
            } else {
                tripletPriority = s[3].priority;
            }

            if (tripletPriority === max3) {
                tempWinnerSets.push(setObj);
            }
        }

        if (tempWinnerSets.length === 1) return tempWinnerSets;

        // Step 3: Break tie with next highest card
        let max2 = 0;
        for (const setObj of tempWinnerSets) {
            const s = setObj.set;
            let kicker = 0;

            if (s[0].priority === s[1].priority && s[1].priority === s[2].priority) {
                kicker = s[3].priority;
            } else {
                kicker = s[0].priority;
            }

            if (kicker > max2) {
                max2 = kicker;
            }
        }

        winnerSets = tempWinnerSets.filter(setObj => {
            const s = setObj.set;
            const kicker = (s[0].priority === s[1].priority && s[1].priority === s[2].priority)
                ? s[3].priority
                : s[0].priority;
            return kicker === max2;
        });

        if (winnerSets.length === 1) return winnerSets;

        // Step 4: Final tie-breaker with last card
        let max1 = 0;
        for (const setObj of winnerSets) {
            const s = setObj.set;
            let lastCard = 0;

            if (s[0].priority === s[1].priority && s[1].priority === s[2].priority) {
                lastCard = s[4].priority;
            } else if (s[1].priority === s[2].priority && s[2].priority === s[3].priority) {
                lastCard = s[4].priority;
            } else {
                lastCard = s[1].priority;
            }

            if (lastCard > max1) {
                max1 = lastCard;
            }
        }

        tempWinnerSets = winnerSets.filter(setObj => {
            const s = setObj.set;
            const lastCard = (s[0].priority === s[1].priority && s[1].priority === s[2].priority)
                ? s[4].priority
                : (s[1].priority === s[2].priority && s[2].priority === s[3].priority)
                    ? s[4].priority
                    : s[1].priority;
            return lastCard === max1;
        });

        return tempWinnerSets;
    }

    /**
     * Compare hand with in compareTwoPair
     *
     * @method compareTwoPair
     * @param  {Object}       type,sets,setProp  request json object
     * @return {bool}              true/false
     */
    compareTwoPair(sets: any, setProp: string): any {
        const sortedSets: any = sets.map(setObj => ({
            ...setObj,
            set: [...setObj.set].sort((a, b) => b.priority - a.priority)
        }));

        let maxPair1 = 0;
        let maxPair2 = 0;
        let maxFifthCard = 0;
        let tempWinnerSets: any = [];
        let winnerSets: any = [];

        // Step 1: Identify highest first pair (maxPair1)
        for (const setObj of sortedSets) {
            const s = setObj.set;
            for (let j = 0; j < 4; j++) {
                if (s[j].priority === s[j + 1].priority) {
                    if (s[j].priority > maxPair1) {
                        maxPair1 = s[j].priority;
                    }
                    break;
                }
            }
        }

        // Step 2: Filter sets with highest first pair
        for (const setObj of sortedSets) {
            const s = setObj.set;
            let tempMaxPair1 = 0;
            for (let j = 0; j < 4; j++) {
                if (s[j].priority === s[j + 1].priority) {
                    tempMaxPair1 = s[j].priority;
                    break;
                }
            }
            if (tempMaxPair1 === maxPair1) {
                tempWinnerSets.push(setObj);
            }
        }

        if (tempWinnerSets.length === 1) return tempWinnerSets;

        // Step 3: Identify highest second pair (maxPair2)
        for (const setObj of tempWinnerSets) {
            const s = setObj.set;
            for (let j = 4; j > 0; j--) {
                if (s[j].priority === s[j - 1].priority) {
                    if (s[j].priority > maxPair2) {
                        maxPair2 = s[j].priority;
                    }
                    break;
                }
            }
        }

        // Step 4: Filter by second pair
        for (const setObj of tempWinnerSets) {
            const s = setObj.set;
            let tempMaxPair2 = 0;
            for (let j = 4; j > 0; j--) {
                if (s[j].priority === s[j - 1].priority) {
                    tempMaxPair2 = s[j].priority;
                    break;
                }
            }
            if (tempMaxPair2 === maxPair2) {
                winnerSets.push(setObj);
            }
        }

        if (winnerSets.length === 1) return winnerSets;

        // Step 5: Tie-breaker using fifth card (computed via XOR)
        tempWinnerSets = [];

        for (const setObj of winnerSets) {
            let xorFifthCard = 0;
            for (const card of setObj.set) {
                xorFifthCard ^= card.priority;
            }
            if (xorFifthCard > maxFifthCard) {
                maxFifthCard = xorFifthCard;
            }
        }

        for (const setObj of winnerSets) {
            let tempXor = 0;
            for (const card of setObj.set) {
                tempXor ^= card.priority;
            }
            if (tempXor === maxFifthCard) {
                tempWinnerSets.push(setObj);
            }
        }

        return tempWinnerSets;
    }


    /**
     *  Compare hand with in compareOnePair
     *
     * @method compareOnePair
     * @param  {Object}       type,sets,setProp  request json object
     * @return {bool}              true/false
     */
    compareOnePair(sets: any, setProp: any): any {
        const sortedSet: any[] = [];
        const winnerSets: any[] = [];
        let tempWinnerSets: any[] = [];
        let maxPair1 = 0;
        let maxInOtherCard1 = 0;
        let maxInOtherCard2 = 0;
        let maxInOtherCard3 = 0;

        for (const hand of sets) {
            const temp = _.sortBy(hand.set, 'priority').reverse();
            sortedSet.push({
                set: temp,
                playerId: hand.playerId,
                type: hand.type,
                typeName: hand.typeName,
            });
        }

        for (const hand of sortedSet) {
            const p = hand.set.map(card => card.priority);
            for (let i = 0; i < 4; i++) {
                if (p[i] === p[i + 1]) {
                    maxPair1 = Math.max(maxPair1, p[i]);
                    break;
                }
            }
        }

        for (const hand of sortedSet) {
            const p = hand.set.map(card => card.priority);
            for (let i = 0; i < 4; i++) {
                if (p[i] === p[i + 1] && p[i] === maxPair1) {
                    tempWinnerSets.push(hand);
                    break;
                }
            }
        }

        if (tempWinnerSets.length <= 1) return tempWinnerSets;

        for (const hand of tempWinnerSets) {
            const p = hand.set.map(card => card.priority);
            if (p[0] === p[1]) maxInOtherCard1 = Math.max(maxInOtherCard1, p[2]);
            else if (p[1] === p[2]) maxInOtherCard1 = Math.max(maxInOtherCard1, p[0]);
            else if (p[2] === p[3]) maxInOtherCard1 = Math.max(maxInOtherCard1, p[0]);
            else if (p[3] === p[4]) maxInOtherCard1 = Math.max(maxInOtherCard1, p[0]);
        }

        for (const hand of tempWinnerSets) {
            const p = hand.set.map(card => card.priority);
            if ((p[0] === p[1] && p[2] === maxInOtherCard1) ||
                (p[1] === p[2] && p[0] === maxInOtherCard1) ||
                (p[2] === p[3] && p[0] === maxInOtherCard1) ||
                (p[3] === p[4] && p[0] === maxInOtherCard1)) {
                winnerSets.push(hand);
            }
        }

        if (winnerSets.length <= 1) return winnerSets;
        tempWinnerSets = [];

        for (const hand of winnerSets) {
            const p = hand.set.map(card => card.priority);
            if (p[0] === p[1]) maxInOtherCard2 = Math.max(maxInOtherCard2, p[3]);
            else if (p[1] === p[2]) maxInOtherCard2 = Math.max(maxInOtherCard2, p[3]);
            else if (p[2] === p[3]) maxInOtherCard2 = Math.max(maxInOtherCard2, p[1]);
            else if (p[3] === p[4]) maxInOtherCard2 = Math.max(maxInOtherCard2, p[1]);
        }

        for (const hand of winnerSets) {
            const p = hand.set.map(card => card.priority);
            if ((p[0] === p[1] && p[3] === maxInOtherCard2) ||
                (p[1] === p[2] && p[3] === maxInOtherCard2) ||
                (p[2] === p[3] && p[1] === maxInOtherCard2) ||
                (p[3] === p[4] && p[1] === maxInOtherCard2)) {
                tempWinnerSets.push(hand);
            }
        }

        if (tempWinnerSets.length <= 1) return tempWinnerSets;
        winnerSets.length = 0;

        for (const hand of tempWinnerSets) {
            const p = hand.set.map(card => card.priority);
            if (p[0] === p[1]) maxInOtherCard3 = Math.max(maxInOtherCard3, p[4]);
            else if (p[1] === p[2]) maxInOtherCard3 = Math.max(maxInOtherCard3, p[4]);
            else if (p[2] === p[3]) maxInOtherCard3 = Math.max(maxInOtherCard3, p[4]);
            else if (p[3] === p[4]) maxInOtherCard3 = Math.max(maxInOtherCard3, p[2]);
        }

        for (const hand of tempWinnerSets) {
            const p = hand.set.map(card => card.priority);
            if ((p[0] === p[1] && p[4] === maxInOtherCard3) ||
                (p[1] === p[2] && p[4] === maxInOtherCard3) ||
                (p[2] === p[3] && p[4] === maxInOtherCard3) ||
                (p[3] === p[4] && p[2] === maxInOtherCard3)) {
                winnerSets.push(hand);
            }
        }

        return winnerSets;
    }

    /**
    * Compare hand with in high cards
    *
    * @method compareHighcard
    * @param  {Object}       type,sets,setProp  request json object
    * @return {bool}              true/false
    */
    compareHighcard(sets, setProp) {
        // console.log("in compare high card"); 
        return this.compareFlush(sets, setProp);
    }


    /**
    * This function is used to find the greatest from the hands of omaha lo if their priority are same
    *
    * @method getGreatestOmahaLo
    * @param  {Object}       type,sets,setProp  request json object
    * @return {bool}              true/false
    */
    getGreatestOmahaLo(sets) {
        let validSets = [];
        for (let i = 0; i < sets.length; i++) {
            if (!this.isRankHighThan8(sets[i].set) && !this.isOnePair(sets[i].set)) {
                validSets.push(sets[i])
            }
        }
        if (validSets.length > 0) {
            let bestLo = this.compareHighCardInOmahaLo(validSets);
            return bestLo[0];
        } else {
            return null;
        }
    }

    //### this function finds the winner in omahaLo
    findWinnerOmahaLo(sets) {
        return this.compareHighCardInOmahaLo(sets);
    }

    //### function to check any cards rank are not greator than 8
    isRankHighThan8(sets) {
        let tempSets = _.filter(sets, function (set) {
            return (set.rank > 8)
        });
        return tempSets.length > 0 ? true : false;
    }

    //### function to comapre and find best hands in omaha hi lo
    compareHighCardInOmahaLo(sets: any): any {
        const sortedSets: any = sets.map((setObj) => ({
            playerId: setObj.playerId,
            set: _.sortBy(setObj.set, 'rank').reverse(),
        }));

        let winnerSets = sortedSets;

        // Compare up to 5 card positions (index 0 to 4)
        for (let position = 0; position < 5; position++) {
            if (winnerSets.length <= 1) {
                break;
            }

            // Find lowest rank at this position
            const minRank = Math.min(...winnerSets.map((s) => s.set[position].rank));

            // Filter to those who match this lowest rank
            winnerSets = winnerSets.filter((s) => s.set[position].rank === minRank);
        }

        return winnerSets;
    }
}