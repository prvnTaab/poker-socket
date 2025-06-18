import { Injectable } from "@nestjs/common";


// @Injectable()
export class Card {

  type: string;
  rank: any;
  name: string;
  priority: number;
  id:number;


  constructor(type: any, rank: any) {
    this.type = type;
    this.rank = rank;
    this.priority = this.getPriority();
    this.name = this.getName();
  }

   getName(): string {
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
        return this.rank?.toString();
    }
  }

   getPriority(): number {
    return this.rank === 1 ? 14 : this.rank;
  }
}
