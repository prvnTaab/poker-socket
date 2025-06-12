import { Injectable } from "@nestjs/common";







@Injectable()
export class DeductRakefromTableService {


    constructor(

    ) { }


// Initialize page level params used for rake deduction calculations
initializeParams(params: any): any{
  return params;
}


// Get total rake to be deducted from this table

// Start deducting rake for decision params
// Each decision params inclide end level pot and its winners as well

// deprecated
// Converts the callback-style processRakeDeduction to an async function returning a Promise.
// Function name preserved; serverLog calls removed.

async processRakeDeduction(params: any): Promise<any> {
  // initializeParams now returns a Promise resolving to the same params
  const response = await this.initializeParams(params);
  return response;
}




}