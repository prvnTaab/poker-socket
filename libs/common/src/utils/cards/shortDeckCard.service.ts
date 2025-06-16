import { Injectable } from "@nestjs/common";








@Injectable()
export class CardService {

    public readonly type: string;
    public readonly rank: number;
    public readonly name: string;
    public readonly priority: number;
    public id?: number;

    constructor(type: string, rank: number) {
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
        return this.rank === 1 ? 14 : this.rank;
    }





}