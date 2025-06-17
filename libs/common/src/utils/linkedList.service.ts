import { Injectable } from "@nestjs/common";








@Injectable()
export class LinkedListService {
    private head: any = null;
    private last: any = null;
    public length = 0;

    /**
     * Add an item at the end of list
     */
    push(obj: any): any {
        const elm: any = {
            data: obj,
            nextElm: null,
        };

        if (this.last) {
            this.last.nextElm = elm;
            this.last = elm;
        } else {
            this.head = this.last = elm;
        }

        this.length++;
        return this;
    }

    /**
     * Fetch first item of list and remove it from list
     */
    shift(): any {
        if (!this.head) return undefined;

        const value = this.head.data;
        this.head = this.head.nextElm;

        if (!this.head) {
            this.last = null;
        }

        this.length--;
        return value;
    }

    /**
     * Fetch first item of list
     */
    firstElm(): any {
        return this.head?.data;
    }

    /**
     * Print items of list on console
     */
    print(): void {
        let current = this.head;
        while (current) {
            console.log(current.data);
            current = current.nextElm;
        }
    }

    /**
     * Export list to array format
     */
    toArray(): any {
        const result: any = [];
        let current = this.head;
        while (current) {
            if (current.data) {
                result.push(current.data);
            }
            current = current.nextElm;
        }
        return result;
    }
}