import { Injectable } from '@nestjs/common';
import { Card } from './card'; // <-- updated import

@Injectable()
export class DeckService {
  private deck: any = [];

  private readonly types: Record<string, { priority: number }> = {
    heart: { priority: 3 },
    spade: { priority: 4 },
    diamond: { priority: 2 },
    club: { priority: 1 },
  };

  constructor() {
    this.makeCards();
  }

  private makeCards(): void {
    for (const type in this.types) {
      for (let rank = 1; rank <= 13; rank++) {
        this.deck.push(new Card(type, rank));
      }
    }
  }

  public getCards(): any {
    return this.deck;
  }

  public shuffle(): void {
    let len = this.deck.length;
    while (len !== 0) {
      const randIdx = Math.floor(Math.random() * len);
      len--;
      this.deck[len].id = Math.random();
      this.deck[randIdx].id = Math.random();
      const tempVal = this.deck[len];
      this.deck[len] = this.deck[randIdx];
      this.deck[randIdx] = tempVal;
    }
  }

  public getRandomCards(num: number): any {
    const randCards: any = [];
    const cardInserted: Record<number, boolean> = {};

    for (let count = 1; count <= num;) {
      const nCard = this.getRandomArbitrary(1, 52);
      if (!cardInserted[nCard]) {
        const newCard: any = { ...this.deck[nCard - 1], id: Math.random() };
        randCards.push(newCard);
        cardInserted[nCard] = true;
        count++;
      }
    }

    return randCards;
  }

  private getRandomArbitrary(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min) + min);
  }
}
