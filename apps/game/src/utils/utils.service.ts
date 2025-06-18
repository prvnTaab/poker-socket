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


    milliSecondsToTime(timeInMiliseconds: any) {
        let h, m, s;
        h = Math.floor(timeInMiliseconds / 1000 / 60 / 60);
        m = Math.floor((timeInMiliseconds / 1000 / 60 / 60 - h) * 60);
        s = Math.ceil(((timeInMiliseconds / 1000 / 60 / 60 - h) * 60 - m) * 60);

        return h + " hr " + m + " min " + s + " sec "
    }

    convertDateToMidnight(dateToConvert:any) {
    dateToConvert = new Date(dateToConvert)
    dateToConvert.setHours(0)
    dateToConvert.setMinutes(0)
    dateToConvert.setSeconds(0)
    dateToConvert.setMilliseconds(0)
    return Number(dateToConvert)
}





}