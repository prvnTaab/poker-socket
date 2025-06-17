import { Global, Injectable } from "@nestjs/common";
import { systemConfig } from "shared/common";
import * as crc from 'crc';




@Injectable()
export class UtilsService {

    constructor() { }


    convertIntToDecimal(input: number): number {
        if (systemConfig.isDecimal === true) {
            return parseFloat(input.toFixed(2));
        } else {
            return Math.round(input);
        }
    }

    roundOff(n: number): number {
        return Math.round(n * 100) / 100;
    }

    // Convert date to seconds (start of the day in milliseconds)
    dateToEpoch(thedate: number): number {
        return thedate - (thedate % 86400000);
    }

    /**
 * Selects an item from a list based on a hashed key.
 * @param key The string to be hashed.
 * @param list The list of items to select from.
 * @returns Selected item or undefined.
 */
    dispatch<T>(key: string, list: T[]): T | undefined {
        if (!list || list.length === 0) {
            return undefined;
        }

        const index = Math.abs(crc.crc32(key)) % list.length;
        return list[index];
    }





}