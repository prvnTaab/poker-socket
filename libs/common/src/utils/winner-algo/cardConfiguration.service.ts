import { Injectable } from "@nestjs/common";
import _ from 'underscore';
import { CardsConfigService } from "./cardConfig.service";








@Injectable()
export class CardConfigurationService  {

    private kickerText = ' Kicker';
    
    constructor(
        private readonly cardsConfig:CardsConfigService
    ) {}

  private makeHighCardText(cards: any[]): string {
    const sorted = _.sortBy(cards, 'priority').reverse();
    return this.cardsConfig.highCard + this.cardsConfig.card[sorted[0].priority] + ', ' + this.cardsConfig.cardChar[sorted[1].priority] + this.kickerText;
  }

  private makeOnePairText(cards: any[]): string {
    const sorted = _.sortBy(cards, 'priority');
    let tmp = '';
    let kickerIndex = 4;

    if (sorted[0].priority === sorted[1].priority) {
      tmp = this.cardsConfig.onePair + this.cardsConfig.cardPlural[sorted[0].priority];
    }
    if (sorted[1].priority === sorted[2].priority) {
      tmp = this.cardsConfig.onePair + this.cardsConfig.cardPlural[sorted[1].priority];
    }
    if (sorted[2].priority === sorted[3].priority) {
      tmp = this.cardsConfig.onePair + this.cardsConfig.cardPlural[sorted[2].priority];
    }
    if (sorted[3].priority === sorted[4].priority) {
      tmp = this.cardsConfig.onePair + this.cardsConfig.cardPlural[sorted[3].priority];
      kickerIndex = 2;
    }

    return tmp + ', ' + this.cardsConfig.cardChar[sorted[kickerIndex].priority] + this.kickerText;
  }

  private makeTwoPairText(cards: any[]): string {
    const priorities = cards.map(c => c.priority);
    let single = 0;
    for (const p of priorities) {
      single ^= p;
    }

    const diff = _.difference(priorities, [single]);
    const uniq = _.uniq(diff);

    return this.cardsConfig.twoPair + this.cardsConfig.cardPlural[uniq[0]] + ' and ' + this.cardsConfig.cardPlural[uniq[1]] + ', ' + this.cardsConfig.cardChar[single] + this.kickerText;
  }

  private makeThreeOfAKindText(cards: any[]): string {
    const sorted = _.sortBy(cards, 'priority');
    return this.cardsConfig.threeOfAKind + this.cardsConfig.cardPlural[sorted[2].priority];
  }

  private makeStraightText(cards: any[]): string {
    const sorted = _.sortBy(cards, 'priority');
    if (sorted[4].priority === 14 && sorted[3].priority === 5) {
      return this.cardsConfig.straight + this.cardsConfig.card[sorted[3].priority] + ' High';
    } else if (sorted[0].priority === 5 && sorted[0].rank === 1 && sorted[4].priority === 13) {
      return this.cardsConfig.straight + this.cardsConfig.shortDeckCard[sorted[0].priority] + ' High';
    } else {
      return this.cardsConfig.straight + this.cardsConfig.card[sorted[4].priority] + ' High';
    }
  }

  private makeFlushText(cards: any[]): string {
    const sorted = _.sortBy(cards, 'priority');
    return this.cardsConfig.flush + this.cardsConfig.card[sorted[4].priority] + ' High';
  }

  private makeFullHouseText(cards: any[]): string {
    const sorted = _.sortBy(cards, 'priority');
    const three = sorted[2].priority;
    const priorities = cards.map(c => c.priority);
    const two = _.difference(priorities, [three])[0];
    return this.cardsConfig.fullHouse + this.cardsConfig.cardPlural[three] + ' full of ' + this.cardsConfig.cardPlural[two];
  }

  private makeFourOfAKindText(cards: any[]): string {
    const sorted = _.sortBy(cards, 'priority');
    return this.cardsConfig.fourOfAKind + this.cardsConfig.cardPlural[sorted[2].priority];
  }

  private makeStraightFlushText(cards: any[]): string {
    const sorted = _.sortBy(cards, 'priority');
    if (sorted[4].priority === 14 && sorted[3].priority === 5) {
      return this.cardsConfig.straightFlush + this.cardsConfig.card[sorted[3].priority] + ' High';
    } else if (sorted[4].priority === 14 && sorted[3].priority === 9) {
      return this.cardsConfig.straight + this.cardsConfig.card[sorted[3].priority] + ' High';
    } else {
      return this.cardsConfig.straightFlush + this.cardsConfig.card[sorted[4].priority] + ' High';
    }
  }

  private makeRoyalFlushText(cards: any[]): string {
    return this.cardsConfig.royalFlush;
  }

  findCardConfig(params: any): string | undefined {
    switch (params.type) {
      case 'High Card': return this.makeHighCardText(params.set);
      case 'One Pair': return this.makeOnePairText(params.set);
      case 'Two Pairs': return this.makeTwoPairText(params.set);
      case 'Three Of A Kind': return this.makeThreeOfAKindText(params.set);
      case 'Straight': return this.makeStraightText(params.set);
      case 'Flush': return this.makeFlushText(params.set);
      case 'Full House': return this.makeFullHouseText(params.set);
      case 'Four Of A Kind': return this.makeFourOfAKindText(params.set);
      case 'Straight Flush': return this.makeStraightFlushText(params.set);
      case 'Royal Flush': return this.makeRoyalFlushText(params.set);
      default:
        console.log('this case is exceptional');
        return undefined;
    }
  }





}