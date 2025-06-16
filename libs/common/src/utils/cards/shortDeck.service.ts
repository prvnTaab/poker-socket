




// deck.service.ts
import { Injectable } from '@nestjs/common';
import { CardService } from './shortDeckCard.service';

@Injectable()
export class ShortDeckService {

    private deck: CardService[] = [];

    private readonly types = {
        heart: { priority: 3 },
        spade: { priority: 4 },
        diamond: { priority: 2 },
        club: { priority: 1 },
    };

    constructor() {
        this.makeCards();
    }

    private makeCards(): void {
        const avoidCards = [2, 3, 4, 5]; // short deck
        for (const type in this.types) {
            for (let number = 1; number <= 13; number++) {
                if (!avoidCards.includes(number)) {
                    this.deck.push(new CardService(type, number));
                }
            }
        }
    }

    getCards(): CardService[] {
        return this.deck;
    }

    shuffle(): void {
        let len = this.deck.length;
        while (len > 0) {
            const randIdx = Math.floor(Math.random() * len);
            len--;
            this.deck[len].id = Math.random();
            this.deck[randIdx].id = Math.random();
            const temp = this.deck[len];
            this.deck[len] = this.deck[randIdx];
            this.deck[randIdx] = temp;
        }
    }

    getRandomCards(num: number): CardService[] {
        const randCards: CardService[] = [];
        const cardInserted: Record<number, boolean> = {};
        while (randCards.length < num) {
            const n = this.getRandomArbitrary(1, this.deck.length);
            if (!cardInserted[n]) {
                const card:any = { ...this.deck[n - 1], id: Math.random() };
                randCards.push(card);
                cardInserted[n] = true;
            }
        }
        return randCards;
    }

    private getRandomArbitrary(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min) + min);
    }
}
