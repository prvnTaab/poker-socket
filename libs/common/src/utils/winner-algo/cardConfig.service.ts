







import { Injectable } from '@nestjs/common';

@Injectable()
export class CardsConfigService {
  readonly shortDeckCard: Record<string, string> = {
    '1': 'Ace',
    '2': '2',
    '3': '3',
    '4': '4',
    '5': 'Ace',
    '6': '6',
    '7': '7',
    '8': '8',
    '9': '9',
    '10': '10',
    '11': 'J',
    '12': 'Q',
    '13': 'K',
    '14': 'Ace',
  };

  readonly card: Record<string, string> = {
    '1': 'Ace',
    '2': 'Two',
    '3': 'Three',
    '4': 'Four',
    '5': 'Five',
    '6': 'Six',
    '7': 'Seven',
    '8': 'Eight',
    '9': 'Nine',
    '10': 'Ten',
    '11': 'Jack',
    '12': 'Queen',
    '13': 'King',
    '14': 'Ace',
  };

  readonly cardPlural: Record<string, string> = {
    '1': 'Aces',
    '2': 'Twos',
    '3': 'Threes',
    '4': 'Fours',
    '5': 'Fives',
    '6': 'Sixes',
    '7': 'Sevens',
    '8': 'Eights',
    '9': 'Nines',
    '10': 'Tens',
    '11': 'Jacks',
    '12': 'Queens',
    '13': 'Kings',
    '14': 'Aces',
  };

  readonly cardChar: Record<string, string> = {
    '1': 'A',
    '2': '2',
    '3': '3',
    '4': '4',
    '5': '5',
    '6': '6',
    '7': '7',
    '8': '8',
    '9': '9',
    '10': '10',
    '11': 'J',
    '12': 'Q',
    '13': 'K',
    '14': 'A',
  };

  readonly highCard = 'High Card ';
  readonly onePair = 'One Pair ';
  readonly twoPair = 'Two Pairs: ';
  readonly threeOfAKind = 'Three Of A Kind ';
  readonly straight = 'Straight: ';
  readonly flush = 'Flush: ';
  readonly fullHouse = 'Full house: ';
  readonly fourOfAKind = 'Four Of A Kind ';
  readonly straightFlush = 'Straight Flush: ';
  readonly royalFlush = 'Royal Flush: Ace to Ten';
}
