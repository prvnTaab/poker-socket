import { Injectable } from "@nestjs/common";
import _ from 'underscore';
import { CardConfigurationService } from "./cardConfiguration.service";






@Injectable()
export class WinnerRankingService {



    constructor(
        private readonly cardConfig: CardConfigurationService

    ) { }





    /**
 * this function finds the difference in two arrays
 * @method differenceTwoArray
 * @param  {array}           array1 
 * @param  {array}           array2 
 * @return {array}                  difference in array1 & array2
 */
  differenceTwoArray(array1: any[], array2: any[]): any[] {
    console.log('\narray1 - ' + JSON.stringify(array1));
    console.log('\narray2 - ' + JSON.stringify(array2));

    const newArray = Array.from(array1);
    for (let i = 0; i < newArray.length; i++) {
      for (let j = 0; j < array2.length; j++) {
        if (newArray[i].playerId === array2[j].playerId) {
          newArray.splice(i, 1);
          i--;
          break;
        }
      }
    }
    return newArray;
  }

/**
 * this function calculates ranks in royalFlush
 * @method rankInRoyalFlush
 * @param  {array}         winnerArray 
 * @param  {array}         winnerRank  
 * @return {object}                     
 */
  rankInRoyalFlush(winnerArray: any[], winnerRank: number): any {
    for (let i = 0; i < winnerArray.length; i++) {
      winnerArray[i].winnerRank = winnerRank;
    }
    return { players: winnerArray, winnerRank: ++winnerRank };
  }

/**
 * this function calculates ranks in straighFlush
 * @method rankInStraightFlush
 * @param  {array}         winnerArray 
 * @param  {array}         winnerRank  
 * @return {object}                     
 */
  rankInStraightFlush(winnerArray: any[], winnerRank: number): any {
    const sortedWinnerArray: any[] = [];

    for (let i = 0; i < winnerArray.length; i++) {
      let temp = _.sortBy(winnerArray[i].set, 'priority').reverse();

      if (
        temp[0].priority === 14 &&
        temp[1].priority === 5 &&
        temp[2].priority === 4 &&
        temp[3].priority === 3 &&
        temp[4].priority === 2
      ) {
        temp[0].priority = 1;
        temp = _.sortBy(winnerArray[i].set, 'priority').reverse();
      }

      sortedWinnerArray.push({
        playerId: winnerArray[i].playerId,
        set: temp,
        priority: winnerArray[i].priority,
        type: winnerArray[i].type,
      });
    }

    return this.rankInFlush(sortedWinnerArray, winnerRank);
  }

/**
 * this function calculates rank in four of a kind
 * @method rankInFourOfAKind
 * @param  {array}          winnerArray 
 * @param  {array}          winnerRank  
 * @return {object}                      
 */
rankInFourOfAKind(winnerArray: any[], winnerRank: number): any {
    const winnerRankArray: any[] = [];
    const originalArray = Array.from(winnerArray);
    const tempWinners: any[] = [];

    for (let i = 0; i < winnerArray.length; i++) {
      winnerArray[i].set = _.sortBy(winnerArray[i].set, 'priority').reverse();
    }

    while (winnerArray.length > 0) {
      let maxFourofakind = 0;
      tempWinners.length = 0;

      for (let i = 0; i < winnerArray.length; i++) {
        const temp =
          winnerArray[i].set[0].priority === winnerArray[i].set[1].priority
            ? winnerArray[i].set[0].priority
            : winnerArray[i].set[4].priority;

        if (maxFourofakind < temp) {
          maxFourofakind = temp;
        }
      }

      for (let i = 0; i < winnerArray.length; i++) {
        const temp =
          winnerArray[i].set[0].priority === winnerArray[i].set[1].priority
            ? winnerArray[i].set[0].priority
            : winnerArray[i].set[1].priority;

        if (maxFourofakind === temp) {
          tempWinners.push(winnerArray[i]);
        }
      }

      if (tempWinners.length > 1) {
        let maxFifthCard = 0;

        for (let i = 0; i < tempWinners.length; i++) {
          const temp =
            tempWinners[i].set[0].priority === tempWinners[i].set[1].priority
              ? tempWinners[i].set[4].priority
              : tempWinners[i].set[0].priority;

          if (maxFifthCard < temp) {
            maxFifthCard = temp;
          }
        }

        winnerArray.length = 0;
        for (let i = 0; i < tempWinners.length; i++) {
          const temp =
            tempWinners[i].set[0].priority === tempWinners[i].set[1].priority
              ? tempWinners[i].set[4].priority
              : tempWinners[i].set[0].priority;

          if (maxFifthCard === temp) {
            winnerArray.push(tempWinners[i]);
          }
        }

        if (winnerArray.length > 1) {
          for (let i = 0; i < winnerArray.length; i++) {
            winnerArray[i].winnerRank = winnerRank;
            winnerRankArray.push(winnerArray[i]);
          }
        } else {
          winnerArray[0].winnerRank = winnerRank;
          winnerRankArray.push(winnerArray[0]);
        }

        winnerRank++;
        winnerArray = this.differenceTwoArray(originalArray, winnerRankArray);
      } else {
        tempWinners[0].winnerRank = winnerRank++;
        winnerRankArray.push(tempWinners[0]);
        winnerArray = this.differenceTwoArray(originalArray, winnerRankArray);
      }
    }

    return { players: winnerRankArray, winnerRank };
  }
/**
 * this function calculates rank in full house
 * @method rankInFullHouse
 * @param  {array}        winnerArray 
 * @param  {array}        winnerRank  
 * @return {object}                   
 */
rankInFullHouse(winnerArray: any[], winnerRank: number): any {
    const winnerRankArray: any[] = [];
    const originalArray = Array.from(winnerArray);
    const tempWinners: any[] = [];

    for (let i = 0; i < winnerArray.length; i++) {
      winnerArray[i].set = _.sortBy(winnerArray[i].set, 'priority').reverse();
    }

    while (winnerArray.length > 0) {
      let max3 = 0;
      let tempMax3 = 0;
      tempWinners.length = 0;

      for (let i = 0; i < winnerArray.length; i++) {
        tempMax3 =
          winnerArray[i].set[0].priority ^
          winnerArray[i].set[1].priority ^
          winnerArray[i].set[2].priority ^
          winnerArray[i].set[3].priority ^
          winnerArray[i].set[4].priority;

        if (tempMax3 > max3) {
          max3 = tempMax3;
        }
      }

      for (let i = 0; i < winnerArray.length; i++) {
        tempMax3 =
          winnerArray[i].set[0].priority ^
          winnerArray[i].set[1].priority ^
          winnerArray[i].set[2].priority ^
          winnerArray[i].set[3].priority ^
          winnerArray[i].set[4].priority;

        if (tempMax3 === max3) {
          tempWinners.push(winnerArray[i]);
        }
      }

      if (tempWinners.length > 0) {
        let max2 = 0;
        let tempMax2 = 0;

        for (let i = 0; i < tempWinners.length; i++) {
          tempMax2 =
            tempWinners[i].set[0].priority === tempWinners[i].set[2].priority
              ? tempWinners[i].set[3].priority
              : tempWinners[i].set[0].priority;

          if (tempMax2 > max2) {
            max2 = tempMax2;
          }
        }

        winnerArray.length = 0;

        for (let i = 0; i < tempWinners.length; i++) {
          tempMax2 =
            tempWinners[i].set[0].priority === tempWinners[i].set[2].priority
              ? tempWinners[i].set[3].priority
              : tempWinners[i].set[0].priority;

          if (tempMax2 === max2) {
            winnerArray.push(tempWinners[i]);
          }
        }

        if (winnerArray.length > 1) {
          for (let i = 0; i < winnerArray.length; i++) {
            winnerArray[i].winnerRank = winnerRank;
            winnerRankArray.push(winnerArray[i]);
          }
          winnerRank++;
        } else {
          winnerArray[0].winnerRank = winnerRank++;
          winnerRankArray.push(winnerArray[0]);
        }

        winnerArray = this.differenceTwoArray(originalArray, winnerRankArray);
      } else {
        tempWinners[0].winnerRank = winnerRank++;
        winnerRankArray.push(tempWinners[0]);
        winnerArray = this.differenceTwoArray(originalArray, winnerRankArray);
      }
    }

    return { players: winnerRankArray, winnerRank };
  }

/**
 * this function calculates rank in flush
 * @method rankInFlush
 * @param  {array}    winnerArray 
 * @param  {array}    winnerRank  
 * @return {object}               
 */
rankInFlush(winnerArray: any[], winnerRank: number): any {
    const winnerRankArray: any[] = [];
    const tempWinners: any[] = [];
    const originalArray = Array.from(winnerArray);

    for (let i = 0; i < winnerArray.length; i++) {
      winnerArray[i].set = _.sortBy(winnerArray[i].set, 'priority').reverse();
    }

    console.log('\nwinnerArray after sorting is  - ' + JSON.stringify(winnerArray));

    while (winnerArray.length > 0) {
      let max1 = 0;
      tempWinners.length = 0;

      for (let i = 0; i < winnerArray.length; i++) {
        if (max1 < winnerArray[i].set[0].priority) {
          max1 = winnerArray[i].set[0].priority;
        }
      }

      console.log('\n max1 is -- ' + max1);

      for (let i = 0; i < winnerArray.length; i++) {
        if (max1 === winnerArray[i].set[0].priority) {
          tempWinners.push(winnerArray[i]);
        }
      }

      winnerArray.length = 0;
      console.log('\ntempWinners after first comparison - ' + JSON.stringify(tempWinners));

      if (tempWinners.length > 1) {
        let max2 = 0;
        for (let i = 0; i < tempWinners.length; i++) {
          if (max2 < tempWinners[i].set[1].priority) {
            max2 = tempWinners[i].set[1].priority;
          }
        }

        for (let i = 0; i < tempWinners.length; i++) {
          if (max2 === tempWinners[i].set[1].priority) {
            winnerArray.push(tempWinners[i]);
          }
        }

        tempWinners.length = 0;
        console.log('\n winnerArray after second comparison - ' + JSON.stringify(winnerArray));

        if (winnerArray.length > 1) {
          let max3 = 0;
          for (let i = 0; i < winnerArray.length; i++) {
            if (max3 < winnerArray[i].set[2].priority) {
              max3 = winnerArray[i].set[2].priority;
            }
          }

          for (let i = 0; i < winnerArray.length; i++) {
            if (max3 === winnerArray[i].set[2].priority) {
              tempWinners.push(winnerArray[i]);
            }
          }

          winnerArray.length = 0;

          if (tempWinners.length > 1) {
            let max4 = 0;
            for (let i = 0; i < tempWinners.length; i++) {
              if (max4 < tempWinners[i].set[3].priority) {
                max4 = tempWinners[i].set[3].priority;
              }
            }

            for (let i = 0; i < tempWinners.length; i++) {
              if (max4 === tempWinners[i].set[3].priority) {
                winnerArray.push(tempWinners[i]);
              }
            }

            tempWinners.length = 0;
            console.log('\nwinnerArray length is -- ' + JSON.stringify(winnerArray));

            if (winnerArray.length > 1) {
              let max5 = 0;
              for (let i = 0; i < winnerArray.length; i++) {
                if (max5 < winnerArray[i].set[4].priority) {
                  max5 = winnerArray[i].set[4].priority;
                }
              }

              for (let i = 0; i < winnerArray.length; i++) {
                if (max5 === winnerArray[i].set[4].priority) {
                  tempWinners.push(winnerArray[i]);
                }
              }

              winnerArray.length = 0;

              if (tempWinners.length > 1) {
                for (let i = 0; i < tempWinners.length; i++) {
                  tempWinners[i].winnerRank = winnerRank;
                  winnerRankArray.push(tempWinners[i]);
                }
                winnerRank++;
              } else {
                tempWinners[0].winnerRank = winnerRank++;
                winnerRankArray.push(tempWinners[0]);
              }

              console.log('\n originalArray - ' + JSON.stringify(originalArray));
              console.log('\n winnerRankArray - ' + JSON.stringify(winnerRankArray));
              winnerArray = this.differenceTwoArray(originalArray, winnerRankArray);
              console.log('\nwinner array after final calculation - ' + JSON.stringify(winnerArray));
            } else {
              winnerArray[0].winnerRank = winnerRank++;
              winnerRankArray.push(winnerArray[0]);
              winnerArray = this.differenceTwoArray(originalArray, winnerRankArray);
              console.log('\nwinner array after final calculation in single case - ' + JSON.stringify(winnerArray));
            }
          } else {
            tempWinners[0].winnerRank = winnerRank++;
            winnerRankArray.push(tempWinners[0]);
            winnerArray = this.differenceTwoArray(originalArray, winnerRankArray);
            console.log('\nwinner array after final calculation in single case - ' + JSON.stringify(winnerArray));
          }
        } else {
          winnerArray[0].winnerRank = winnerRank++;
          winnerRankArray.push(winnerArray[0]);
          winnerArray = this.differenceTwoArray(originalArray, winnerRankArray);
          console.log('\nwinner array after final calculation in single case - ' + JSON.stringify(winnerArray));
        }
      } else {
        tempWinners[0].winnerRank = winnerRank++;
        winnerRankArray.push(tempWinners[0]);
        winnerArray = this.differenceTwoArray(originalArray, winnerRankArray);
        console.log('\nwinner array after final calculation in single case - ' + JSON.stringify(winnerArray));
      }
    }

    return { players: winnerRankArray, winnerRank };
  }

/**
 * this function calculates rank in three of a kind
 * @method rankInThreeOfAKind
 * @param  {array}           winnerArray 
 * @param  {array}           winnerRank  
 * @return {object}                      
 */
  rankInThreeOfAKind(winnerArray: any[], winnerRank: number): { players: any[]; winnerRank: number } {
    const winnerRankArray: any[] = [];
    const tempWinners: any[] = [];
    const originalArray = [...winnerArray];

    for (let i = 0; i < winnerArray.length; i++) {
      winnerArray[i].set = _.sortBy(winnerArray[i].set, 'priority').reverse();
    }

    console.log('\nwinnerArray after sorting is -', JSON.stringify(winnerArray));

    while (winnerArray.length > 0) {
      tempWinners.length = 0;

      let max3 = 0;
      for (let i = 0; i < winnerArray.length; i++) {
        const tempMax3 = winnerArray[i].set[2].priority;
        if (tempMax3 > max3) {
          max3 = tempMax3;
        }
      }

      for (let i = 0; i < winnerArray.length; i++) {
        if (max3 === winnerArray[i].set[2].priority) {
          tempWinners.push(winnerArray[i]);
        }
      }

      console.log('tempWinners after max3 comparison -', JSON.stringify(tempWinners));

      if (tempWinners.length > 1) {
        let max2 = 0;
        winnerArray.length = 0;

        for (let i = 0; i < tempWinners.length; i++) {
          const isTriple =
            tempWinners[i].set[0].priority === tempWinners[i].set[1].priority &&
            tempWinners[i].set[1].priority === tempWinners[i].set[2].priority;

          const value = isTriple ? tempWinners[i].set[3].priority : tempWinners[i].set[0].priority;
          if (value > max2) {
            max2 = value;
          }
        }

        for (let i = 0; i < tempWinners.length; i++) {
          const isTriple =
            tempWinners[i].set[0].priority === tempWinners[i].set[1].priority &&
            tempWinners[i].set[1].priority === tempWinners[i].set[2].priority;

          const tempMax2 = isTriple ? tempWinners[i].set[3].priority : tempWinners[i].set[0].priority;

          if (tempMax2 === max2) {
            winnerArray.push(tempWinners[i]);
          }
        }

        console.log('tempWinners after max2 comparison -', JSON.stringify(winnerArray));

        if (winnerArray.length > 1) {
          tempWinners.length = 0;
          let max1 = 0;

          for (let i = 0; i < winnerArray.length; i++) {
            let value: number;
            if (
              winnerArray[i].set[0].priority === winnerArray[i].set[1].priority &&
              winnerArray[i].set[1].priority === winnerArray[i].set[2].priority
            ) {
              value = winnerArray[i].set[4].priority;
            } else if (
              winnerArray[i].set[1].priority === winnerArray[i].set[2].priority &&
              winnerArray[i].set[2].priority === winnerArray[i].set[3].priority
            ) {
              value = winnerArray[i].set[4].priority;
            } else {
              value = winnerArray[i].set[1].priority;
            }
            if (value > max1) {
              max1 = value;
            }
          }

          for (let i = 0; i < winnerArray.length; i++) {
            let tempMax1: number;
            if (
              winnerArray[i].set[0].priority === winnerArray[i].set[1].priority &&
              winnerArray[i].set[1].priority === winnerArray[i].set[2].priority
            ) {
              tempMax1 = winnerArray[i].set[4].priority;
            } else if (
              winnerArray[i].set[1].priority === winnerArray[i].set[2].priority &&
              winnerArray[i].set[2].priority === winnerArray[i].set[3].priority
            ) {
              tempMax1 = winnerArray[i].set[4].priority;
            } else {
              tempMax1 = winnerArray[i].set[1].priority;
            }
            if (tempMax1 === max1) {
              tempWinners.push(winnerArray[i]);
            }
          }

          if (tempWinners.length > 1) {
            for (let i = 0; i < tempWinners.length; i++) {
              tempWinners[i].winnerRank = winnerRank;
              winnerRankArray.push(tempWinners[i]);
            }
            winnerRank++;
          } else {
            tempWinners[0].winnerRank = winnerRank++;
            winnerRankArray.push(tempWinners[0]);
          }

          console.log('\noriginalArray -', JSON.stringify(originalArray));
          console.log('\nwinnerRankArray -', JSON.stringify(winnerRankArray));
          winnerArray = this.differenceTwoArray(originalArray, winnerRankArray);
          console.log('\nwinner array after final calculation -', JSON.stringify(winnerArray));
        } else {
          winnerArray[0].winnerRank = winnerRank++;
          winnerRankArray.push(winnerArray[0]);
          winnerArray = this.differenceTwoArray(originalArray, winnerRankArray);
          console.log('\nwinner array after final calculation in single case --', JSON.stringify(winnerArray));
        }
      } else {
        tempWinners[0].winnerRank = winnerRank++;
        winnerRankArray.push(tempWinners[0]);
        winnerArray = this.differenceTwoArray(originalArray, winnerRankArray);
        console.log('\nwinner array after final calculation in single case -', JSON.stringify(winnerArray));
      }
    }

    return { players: winnerRankArray, winnerRank };
  }

/**
 * this function calculates rank in two pair
 * @method rankInTwoPair
 * @param  {array}      winnerArray 
 * @param  {array}      winnerRank  
 * @return {object}                 
 */
 rankInTwoPair(winnerArray: any[], winnerRank: number): { players: any[]; winnerRank: number } {
    const winnerRankArray: any[] = [];
    const tempWinners: any[] = [];
    const originalArray = [...winnerArray];

    for (let i = 0; i < winnerArray.length; i++) {
      winnerArray[i].set = _.sortBy(winnerArray[i].set, 'priority').reverse();
    }

    while (winnerArray.length > 0) {
      tempWinners.length = 0;

      let max1 = 0;
      for (let i = 0; i < winnerArray.length; i++) {
        if (winnerArray[i].set[1].priority > max1) {
          max1 = winnerArray[i].set[1].priority;
        }
      }

      for (let i = 0; i < winnerArray.length; i++) {
        if (winnerArray[i].set[1].priority === max1) {
          tempWinners.push(winnerArray[i]);
        }
      }

      if (tempWinners.length > 1) {
        winnerArray.length = 0;

        let max2 = 0;
        for (let i = 0; i < tempWinners.length; i++) {
          if (tempWinners[i].set[3].priority > max2) {
            max2 = tempWinners[i].set[3].priority;
          }
        }

        for (let i = 0; i < tempWinners.length; i++) {
          if (tempWinners[i].set[3].priority === max2) {
            winnerArray.push(tempWinners[i]);
          }
        }

        if (winnerArray.length > 1) {
          tempWinners.length = 0;

          let max3 = 0;
          for (let i = 0; i < winnerArray.length; i++) {
            const tempMax3 =
              winnerArray[i].set[0].priority ^
              winnerArray[i].set[1].priority ^
              winnerArray[i].set[2].priority ^
              winnerArray[i].set[3].priority ^
              winnerArray[i].set[4].priority;

            if (tempMax3 > max3) {
              max3 = tempMax3;
            }
          }

          for (let i = 0; i < winnerArray.length; i++) {
            const tempMax3 =
              winnerArray[i].set[0].priority ^
              winnerArray[i].set[1].priority ^
              winnerArray[i].set[2].priority ^
              winnerArray[i].set[3].priority ^
              winnerArray[i].set[4].priority;

            if (tempMax3 === max3) {
              tempWinners.push(winnerArray[i]);
            }
          }

          if (tempWinners.length > 1) {
            for (let i = 0; i < tempWinners.length; i++) {
              tempWinners[i].winnerRank = winnerRank;
              winnerRankArray.push(tempWinners[i]);
            }
            winnerRank++;
          } else {
            tempWinners[0].winnerRank = winnerRank++;
            winnerRankArray.push(tempWinners[0]);
          }

          winnerArray = this.differenceTwoArray(originalArray, winnerRankArray);
        } else {
          winnerArray[0].winnerRank = winnerRank++;
          winnerRankArray.push(winnerArray[0]);
          winnerArray = this.differenceTwoArray(originalArray, winnerRankArray);
        }
      } else {
        tempWinners[0].winnerRank = winnerRank++;
        winnerRankArray.push(tempWinners[0]);
        winnerArray = this.differenceTwoArray(originalArray, winnerRankArray);
      }
    }

    return { players: winnerRankArray, winnerRank };
  }

/**
 * this function calculates rank in one pair
 * @method rankInOnePair
 * @param  {array}      winnerArray 
 * @param  {array}      winnerRank  
 * @return {object}                 
 */
  rankInOnePair(winnerArray: any[], winnerRank: number): { players: any[]; winnerRank: number } {
    const winnerRankArray: any[] = [];
    const tempWinners: any[] = [];
    const originalArray = Array.from(winnerArray);

    for (let i = 0; i < winnerArray.length; i++) {
      winnerArray[i].set = _.sortBy(winnerArray[i].set, 'priority').reverse();
    }

    while (winnerArray.length > 0) {
      tempWinners.length = 0;
      let maxPair1 = 0;

      for (let i = 0; i < winnerArray.length; i++) {
        const s = winnerArray[i].set;
        if (s[0].priority === s[1].priority && s[0].priority > maxPair1) maxPair1 = s[0].priority;
        else if (s[1].priority === s[2].priority && s[1].priority > maxPair1) maxPair1 = s[1].priority;
        else if (s[2].priority === s[3].priority && s[2].priority > maxPair1) maxPair1 = s[2].priority;
        else if (s[3].priority === s[4].priority && s[3].priority > maxPair1) maxPair1 = s[3].priority;
      }

      for (let i = 0; i < winnerArray.length; i++) {
        const s = winnerArray[i].set;
        if (s[0].priority === s[1].priority && maxPair1 === s[0].priority) tempWinners.push(winnerArray[i]);
        else if (s[1].priority === s[2].priority && maxPair1 === s[1].priority) tempWinners.push(winnerArray[i]);
        else if (s[2].priority === s[3].priority && maxPair1 === s[2].priority) tempWinners.push(winnerArray[i]);
        else if (s[3].priority === s[4].priority && maxPair1 === s[3].priority) tempWinners.push(winnerArray[i]);
      }

      if (tempWinners.length > 1) {
        winnerArray.length = 0;
        let maxInOtherCard1 = 0;

        for (let i = 0; i < tempWinners.length; i++) {
          const s = tempWinners[i].set;
          if (s[0].priority === s[1].priority && s[2].priority > maxInOtherCard1) maxInOtherCard1 = s[2].priority;
          else if (s[1].priority === s[2].priority && s[0].priority > maxInOtherCard1) maxInOtherCard1 = s[0].priority;
          else if (s[2].priority === s[3].priority && s[0].priority > maxInOtherCard1) maxInOtherCard1 = s[0].priority;
          else if (s[3].priority === s[4].priority && s[0].priority > maxInOtherCard1) maxInOtherCard1 = s[0].priority;
        }

        for (let i = 0; i < tempWinners.length; i++) {
          const s = tempWinners[i].set;
          if (s[0].priority === s[1].priority && maxInOtherCard1 === s[2].priority) winnerArray.push(tempWinners[i]);
          else if (s[1].priority === s[2].priority && maxInOtherCard1 === s[0].priority) winnerArray.push(tempWinners[i]);
          else if (s[2].priority === s[3].priority && maxInOtherCard1 === s[0].priority) winnerArray.push(tempWinners[i]);
          else if (s[3].priority === s[4].priority && maxInOtherCard1 === s[0].priority) winnerArray.push(tempWinners[i]);
        }

        if (winnerArray.length > 1) {
          tempWinners.length = 0;
          let maxInOtherCard2 = 0;

          for (let i = 0; i < winnerArray.length; i++) {
            const s = winnerArray[i].set;
            if (s[0].priority === s[1].priority && s[3].priority > maxInOtherCard2) maxInOtherCard2 = s[3].priority;
            else if (s[1].priority === s[2].priority && s[3].priority > maxInOtherCard2) maxInOtherCard2 = s[3].priority;
            else if (s[2].priority === s[3].priority && s[1].priority > maxInOtherCard2) maxInOtherCard2 = s[1].priority;
            else if (s[3].priority === s[4].priority && s[1].priority > maxInOtherCard2) maxInOtherCard2 = s[1].priority;
          }

          for (let i = 0; i < winnerArray.length; i++) {
            const s = winnerArray[i].set;
            if (s[0].priority === s[1].priority && maxInOtherCard2 === s[3].priority) tempWinners.push(winnerArray[i]);
            else if (s[1].priority === s[2].priority && maxInOtherCard2 === s[3].priority) tempWinners.push(winnerArray[i]);
            else if (s[2].priority === s[3].priority && maxInOtherCard2 === s[1].priority) tempWinners.push(winnerArray[i]);
            else if (s[3].priority === s[4].priority && maxInOtherCard2 === s[1].priority) tempWinners.push(winnerArray[i]);
          }

          if (tempWinners.length > 1) {
            let maxInOtherCard3 = 0;
            winnerArray.length = 0;

            for (let i = 0; i < tempWinners.length; i++) {
              const s = tempWinners[i].set;
              if (s[0].priority === s[1].priority && s[4].priority > maxInOtherCard3) maxInOtherCard3 = s[4].priority;
              else if (s[1].priority === s[2].priority && s[4].priority > maxInOtherCard3) maxInOtherCard3 = s[4].priority;
              else if (s[2].priority === s[3].priority && s[4].priority > maxInOtherCard3) maxInOtherCard3 = s[4].priority;
              else if (s[3].priority === s[4].priority && s[2].priority > maxInOtherCard3) maxInOtherCard3 = s[2].priority;
            }

            for (let i = 0; i < tempWinners.length; i++) {
              const s = tempWinners[i].set;
              if (s[0].priority === s[1].priority && maxInOtherCard3 === s[4].priority) winnerArray.push(tempWinners[i]);
              else if (s[1].priority === s[2].priority && maxInOtherCard3 === s[4].priority) winnerArray.push(tempWinners[i]);
              else if (s[2].priority === s[3].priority && maxInOtherCard3 === s[4].priority) winnerArray.push(tempWinners[i]);
              else if (s[3].priority === s[4].priority && maxInOtherCard3 === s[2].priority) winnerArray.push(tempWinners[i]);
            }

            if (winnerArray.length > 1) {
              for (let i = 0; i < winnerArray.length; i++) {
                winnerArray[i].winnerRank = winnerRank;
                winnerRankArray.push(winnerArray[i]);
              }
              winnerRank++;
            } else {
              winnerArray[0].winnerRank = winnerRank++;
              winnerRankArray.push(winnerArray[0]);
            }

            winnerArray = this.differenceTwoArray(originalArray, winnerRankArray);
          } else {
            tempWinners[0].winnerRank = winnerRank++;
            winnerRankArray.push(tempWinners[0]);
            winnerArray = this.differenceTwoArray(originalArray, winnerRankArray);
          }
        } else {
          winnerArray[0].winnerRank = winnerRank++;
          winnerRankArray.push(winnerArray[0]);
          winnerArray = this.differenceTwoArray(originalArray, winnerRankArray);
        }
      } else {
        tempWinners[0].winnerRank = winnerRank++;
        winnerRankArray.push(tempWinners[0]);
        winnerArray = this.differenceTwoArray(originalArray, winnerRankArray);
      }
    }

    return { players: winnerRankArray, winnerRank };
  }

/**
 * this function finds winner rankings
 * @method findWinnersRanking
 * @param  {array}           winnerArray 
 * @return {array}                       
 */
findWinnersRanking(winnerArray: any[]): any[] {
    let winnerRank = 1;
    let winnerRankArray: any[] = [];

    for (let i = 10; i > 0; i--) {
      const sameGroup = _.where(winnerArray, { priority: i });

      if (sameGroup.length === 1) {
        sameGroup[0].winnerRank = winnerRank++;
        winnerRankArray.push(sameGroup[0]);
      } else if (sameGroup.length > 1) {
        let sameGroupByRank: { players: any[]; winnerRank: number };

        switch (sameGroup[0].type) {
          case 'Royal Flush':
            sameGroupByRank = this.rankInRoyalFlush(sameGroup, winnerRank);
            break;
          case 'Straight Flush':
            sameGroupByRank = this.rankInStraightFlush(sameGroup, winnerRank);
            break;
          case 'Four Of A Kind':
            sameGroupByRank = this.rankInFourOfAKind(sameGroup, winnerRank);
            break;
          case 'Full House':
            sameGroupByRank = this.rankInFullHouse(sameGroup, winnerRank);
            break;
          case 'Flush':
            sameGroupByRank = this.rankInFlush(sameGroup, winnerRank);
            break;
          case 'Straight':
            sameGroupByRank = this.rankInStraightFlush(sameGroup, winnerRank);
            break;
          case 'Three Of A Kind':
            sameGroupByRank = this.rankInThreeOfAKind(sameGroup, winnerRank);
            break;
          case 'Two Pairs':
            sameGroupByRank = this.rankInTwoPair(sameGroup, winnerRank);
            break;
          case 'One Pair':
            sameGroupByRank = this.rankInOnePair(sameGroup, winnerRank);
            break;
          case 'High Card':
            sameGroupByRank = this.rankInFlush(sameGroup, winnerRank);
            break;
          default:
            console.log('No case handle for this form!');
            continue;
        }

        winnerRankArray = winnerRankArray.concat(sameGroupByRank.players);
        winnerRank = sameGroupByRank.winnerRank;
      }
    }

    console.log('winnerRankArray is - ' + JSON.stringify(winnerRankArray));
    for (let i = 0; i < winnerRankArray.length; i++) {
      winnerRankArray[i].text = this.cardConfig.findCardConfig(winnerRankArray[i]);
    }

    return winnerRankArray;
  }

//### this function finds the winner in omahaLo
/**
 * this function finds the winner in omahaLo
 * @method findWinnerOmahaLo
 * @param  {array}          sets
 * @return {array}              
 */
  findWinnerOmahaLo(sets: any[]): any[] {
    return this.compareHighCardInOmahaLo(sets);
  }

//### function to comapre and find best hands in omaha hi lo
compareHighCardInOmahaLo(winnerArray: any[]): any[] {
    const winnerRankArray: any[] = [];
    let tempWinners: any[] = [];
    const originalArray = Array.from(winnerArray);
    let winnerRank = 1;

    for (let i = 0; i < winnerArray.length; i++) {
      winnerArray[i].set = _.sortBy(winnerArray[i].set, 'rank').reverse();
    }

    console.log('\n winnerArray after sorting - ' + JSON.stringify(winnerArray));

    while (winnerArray.length > 0) {
      tempWinners = [];
      let max1 = winnerArray[0].set[0].rank;

      for (let i = 0; i < winnerArray.length; i++) {
        if (max1 > winnerArray[i].set[0].rank) {
          max1 = winnerArray[i].set[0].rank;
        }
      }

      for (let i = 0; i < winnerArray.length; i++) {
        if (max1 === winnerArray[i].set[0].rank) {
          tempWinners.push(winnerArray[i]);
        }
      }

      if (tempWinners.length > 1) {
        winnerArray = [];
        let max2 = tempWinners[0].set[1].rank;

        for (let i = 0; i < tempWinners.length; i++) {
          if (max2 > tempWinners[i].set[1].rank) {
            max2 = tempWinners[i].set[1].rank;
          }
        }

        for (let i = 0; i < tempWinners.length; i++) {
          if (max2 === tempWinners[i].set[1].rank) {
            winnerArray.push(tempWinners[i]);
          }
        }

        if (winnerArray.length > 1) {
          tempWinners = [];
          let max3 = winnerArray[0].set[2].rank;

          for (let i = 0; i < winnerArray.length; i++) {
            if (max3 > winnerArray[i].set[2].rank) {
              max3 = winnerArray[i].set[2].rank;
            }
          }

          for (let i = 0; i < winnerArray.length; i++) {
            if (max3 === winnerArray[i].set[2].rank) {
              tempWinners.push(winnerArray[i]);
            }
          }

          if (tempWinners.length > 1) {
            winnerArray = [];
            let max4 = tempWinners[0].set[3].rank;

            for (let i = 0; i < tempWinners.length; i++) {
              if (max4 > tempWinners[i].set[3].rank) {
                max4 = tempWinners[i].set[3].rank;
              }
            }

            for (let i = 0; i < tempWinners.length; i++) {
              if (max4 === tempWinners[i].set[3].rank) {
                winnerArray.push(tempWinners[i]);
              }
            }

            if (winnerArray.length > 1) {
              tempWinners = [];
              let max5 = winnerArray[0].set[4].rank;

              for (let i = 0; i < winnerArray.length; i++) {
                if (max5 > winnerArray[i].set[4].rank) {
                  max5 = winnerArray[i].set[4].rank;
                }
              }

              for (let i = 0; i < winnerArray.length; i++) {
                if (max5 === winnerArray[i].set[4].rank) {
                  tempWinners.push(winnerArray[i]);
                }
              }

              if (tempWinners.length >= 1) {
                winnerArray = [];
                for (let i = 0; i < tempWinners.length; i++) {
                  winnerArray.push(tempWinners[i]);
                  winnerArray[i].winnerRank = winnerRank;
                  winnerRankArray.push(winnerArray[i]);
                }
                winnerRank++;
              } else {
                winnerArray[0].winnerRank = winnerRank++;
                winnerRankArray.push(winnerArray[0]);
              }

              console.log('\n originalArray - ' + JSON.stringify(originalArray));
              console.log('\n winnerRankArray - ' + JSON.stringify(winnerRankArray));
              winnerArray = this.differenceTwoArray(originalArray, winnerRankArray);
              console.log('\nwinner array after final calculation - ' + JSON.stringify(winnerArray));
            } else {
              winnerArray[0].winnerRank = winnerRank++;
              winnerRankArray.push(winnerArray[0]);
              winnerArray = this.differenceTwoArray(originalArray, winnerRankArray);
              console.log('\nwinner array after final calculation in single case - ' + JSON.stringify(winnerArray));
            }
          } else {
            tempWinners[0].winnerRank = winnerRank++;
            winnerRankArray.push(tempWinners[0]);
            winnerArray = this.differenceTwoArray(originalArray, winnerRankArray);
            console.log('\nwinner array after final calculation in single case - ' + JSON.stringify(winnerArray));
          }
        } else {
          winnerArray[0].winnerRank = winnerRank++;
          winnerRankArray.push(winnerArray[0]);
          winnerArray = this.differenceTwoArray(originalArray, winnerRankArray);
          console.log('\nwinner array after final calculation in single case - ' + JSON.stringify(winnerArray));
        }
      } else {
        tempWinners[0].winnerRank = winnerRank++;
        winnerRankArray.push(tempWinners[0]);
        winnerArray = this.differenceTwoArray(originalArray, winnerRankArray);
        console.log('\nwinner array after final calculation in single case - ' + JSON.stringify(winnerArray));
      }
    }

    for (let i = 0; i < winnerRankArray.length; i++) {
      winnerRankArray[i].text = _.pluck(winnerRankArray[i].set, 'name');
    }

    return winnerRankArray;
  }
// TODO: omaha lo hand comparison - is WRONG - correct this
//  // Ace's priority should be 1 - may be
set1 = {
    "set": [
        { "type": "diamond", "rank": 1, "name": "A", "priority": 14 },
        { "type": "spade", "rank": 7, "name": "7", "priority": 7 },
        { "type": "heart", "rank": 2, "name": "2", "priority": 2 },
        { "type": "heart", "rank": 3, "name": "3", "priority": 3 },
        { "type": "diamond", "rank": 4, "name": "4", "priority": 4 }]
}
set2 = {
    "set": [
        { "type": "heart", "rank": 5, "name": "5", "priority": 5 },
        { "type": "spade", "rank": 6, "name": "6", "priority": 6 },
        { "type": "spade", "rank": 3, "name": "3", "priority": 3 },
        { "type": "spade", "rank": 2, "name": "2", "priority": 2 },
        { "type": "diamond", "rank": 4, "name": "4", "priority": 4 }]
}
set3 = {
    "set": [
        { "type": "diamond", "rank": 1, "name": "A", "priority": 14 },
        { "type": "spade", "rank": 6, "name": "6", "priority": 6 },
        { "type": "heart", "rank": 2, "name": "2", "priority": 2 },
        { "type": "heart", "rank": 3, "name": "3", "priority": 3 },
        { "type": "diamond", "rank": 8, "name": "8", "priority": 8 }]
}














}