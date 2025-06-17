import { Injectable } from "@nestjs/common";







@Injectable()
export class CombinationService {

    constructor(

    ) { }





    combination(set: any[], k: number): any[] {
        if (k > set.length || k <= 0) {
            return [];
        }
        if (k === set.length) {
            return [set];
        }
        if (k === 1) {
            const combs: any[] = [];
            for (let i = 0; i < set.length; i++) {
                combs.push([set[i]]);
            }
            return combs;
        }

        const combs: any[] = [];
        for (let i = 0; i < set.length - k + 1; i++) {
            const head = set.slice(i, i + 1);
            const tailcombs = this.combination(set.slice(i + 1), k - 1);
            for (let j = 0; j < tailcombs.length; j++) {
                combs.push(head.concat(tailcombs[j]));
            }
        }

        return combs;
    }









}