import { Injectable } from '@nestjs/common';

export type CardType = 'Spade' | 'Heart' | 'Diamond' | 'Club';

// @Injectable()
export class Card {
    
  type: CardType;
  rank: number;
  name: string;
  priority: number;

  constructor(type: CardType, rank: number) {
    this.type = type;
    this.rank = rank;
    this.name = this.getName();
    this.priority = this.getPriority();
  }

  private getName(): string {
    switch (this.rank) {
      case 1:
        return 'A';
      case 11:
        return 'J';
      case 12:
        return 'Q';
      case 13:
        return 'K';
      default:
        return this.rank.toString();
    }
  }

  private getPriority(): number {
    if (this.rank === 1) {
      return 14;
    }
    return this.rank;
  }
}
