import { Injectable } from "@nestjs/common";
import { systemConfig } from "shared/common";





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





}