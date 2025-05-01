import { Injectable } from "@nestjs/common";








@Injectable()
export class BlindUpdateService {







    /**
 * Process blind rule if it is time to update
 * @method getBlindRule
 * @param  {Object}       params  request json object
 * @param  {Function}     cb      callback function
 * @return {Object}               params/validated object
 */


    /*======================================  START  =============================*/
    // New
    async processBlind(params: any): Promise<any> {
        if (params.blindRule && params.blindRule.length === params.table.blindLevel) {
            return params;
        } else {

            const nextBlindUpdateTime =
                params.table.tournamentStartTime +
                params.table.blindLevel * params.blindRule[params.table.blindLevel].duration * 60000;

            const blindObject = params.blindRule[params.table.blindLevel + 1] || params.blindRule[params.table.blindLevel];

            if (Number(new Date()) >= nextBlindUpdateTime) {
                params.data.isBlindUpdated = true;
                params.table.lastBlindUpdate = Number(new Date());
                params.table.smallBlind = blindObject.smallBlind;
                params.table.bigBlind = blindObject.bigBlind;
                params.table.ante = blindObject.ante;
                params.table.blindLevel += 1;

                const nextBlindUpdateTime2 = Math.ceil(
                    (params.table.tournamentStartTime + blindObject.duration * 60000 - Number(new Date())) / 60000
                );

                params.table.nextBlindUpdateTime2 = parseInt(nextBlindUpdateTime2.toString());
                params.data.newBlinds = {
                    smallBlind: params.table.smallBlind,
                    bigBlind: params.table.bigBlind,
                    ante: params.table.ante,
                    blindLevel: params.table.blindLevel,
                    nextBlindUpdateTime: nextBlindUpdateTime2 < 0 ? 0 : nextBlindUpdateTime2,
                };

                params.table.nextBlindInfo = {
                    smallBlind: params.blindRule[params.table.blindLevel]
                        ? params.blindRule[params.table.blindLevel].smallBlind
                        : -1,
                    bigBlind: params.blindRule[params.table.blindLevel]
                        ? params.blindRule[params.table.blindLevel].bigBlind
                        : -1,
                    ante: params.blindRule[params.table.blindLevel]
                        ? params.blindRule[params.table.blindLevel].ante
                        : -1,
                    blindLevel: params.blindRule[params.table.blindLevel] ? params.table.blindLevel : -1,
                };

                if (params.blindRule[params.table.blindLevel]) {
                    params.table.nextBlindInfo.nextBlindUpdateTime =
                        params.table.tournamentStartTime +
                        params.blindRule[params.table.blindLevel].duration * 60000;
                } else {
                    params.table.nextBlindInfo.nextBlindUpdateTime = -1;
                }

                return params;
            } else {
                return params;
            }
        }
    }

    // Old
    // const processBlind = function (params, cb) {
    // 	if (params.blindRule && params.blindRule.length === params.table.blindLevel) {
    // 		cb(null, params);
    // 	} else {
    // 		console.log("params in processBlind is in blindUpdate is - - " ,params.table, params.blindRule);
    // 		//console.log(stateOfX.serverLogType.info, "params.table.tournamentStartTime is " + params.table.tournamentStartTime);
    // 		//console.log(stateOfX.serverLogType.info, "params.blindRule[params.table.blindLevel].duration*60000 - " + (params.blindRule[params.table.blindLevel].duration) * 60000);
    // 		// var nextBlindUpdateTime = params.table.tournamentStartTime + (params.blindRule[params.table.blindLevel].duration) * 60000;
    // 		var nextBlindUpdateTime = params.table.tournamentStartTime + (params.table.blindLevel * params.blindRule[params.table.blindLevel].duration) * 60000;

    // 		//console.log(stateOfX.serverLogType.info, "nextBlindUpdateTime is in processBlind is - " + nextBlindUpdateTime);
    // 		var blindObject = params.blindRule[params.table.blindLevel + 1] || params.blindRule[params.table.blindLevel];
    // 		if (Number(new Date()) >= nextBlindUpdateTime) {
    // 			//console.log(stateOfX.serverLogType.info, "It is right time to update blind in blindupdate");
    // 			params.data.isBlindUpdated = true; // Used to broadcast client for new blind details
    // 			params.table.lastBlindUpdate = Number(new Date());
    // 			params.table.smallBlind = blindObject.smallBlind;
    // 			params.table.bigBlind = blindObject.bigBlind;
    // 			params.table.ante = blindObject.ante;
    // 			params.table.blindLevel = params.table.blindLevel + 1;
    // 			//console.log(stateOfX.serverLogType.info, "params.table.tournamentStartTime in processBlind is - " + params.table.tournamentStartTime);
    // 			var nextBlindUpdateTime2 = Math.ceil((params.table.tournamentStartTime + (blindObject.duration) * 60000) - (Number(new Date())));
    // 			params.table.nextBlindUpdateTime2 = parseInt(nextBlindUpdateTime2 / 60000);
    // 			//console.log(stateOfX.serverLogType.info, "nextBlindUpdateTime2 in processBlind is - " + params.table.nextBlindUpdateTime2);
    // 			params.data.newBlinds = {
    // 				smallBlind: params.table.smallBlind,
    // 				bigBlind: params.table.bigBlind,
    // 				ante: params.table.ante,
    // 				blindLevel: params.table.blindLevel,
    // 				nextBlindUpdateTime: nextBlindUpdateTime2 < 0 ? 0 : nextBlindUpdateTime2
    // 			}
    // 			params.table.nextBlindInfo = {
    // 				smallBlind: !!params.blindRule[params.table.blindLevel] ? params.blindRule[params.table.blindLevel].smallBlind : -1,
    // 				bigBlind: !!params.blindRule[params.table.blindLevel] ? params.blindRule[params.table.blindLevel].bigBlind : -1,
    // 				ante: !!params.blindRule[params.table.blindLevel] ? params.blindRule[params.table.blindLevel].ante : -1,
    // 				blindLevel: !!params.blindRule[params.table.blindLevel] ? params.table.blindLevel : -1
    // 			}
    // 			if (!!params.blindRule[params.table.blindLevel]) {
    // 				params.table.nextBlindInfo.nextBlindUpdateTime = params.table.tournamentStartTime + (params.blindRule[params.table.blindLevel].duration) * 60000;
    // 			} else {
    // 				params.table.nextBlindInfo.nextBlindUpdateTime = -1;
    // 			}
    // 			//console.log(stateOfX.serverLogType.info, "params.table.nextBlindInfo processBlind is --- " + JSON.stringify(params.table.nextBlindInfo));
    // 			//console.log(stateOfX.serverLogType.info, "The updated params in processBlind is --- " + JSON.stringify(params));
    // 			cb(null, params);
    // 		} else {
    // 			//console.log(stateOfX.serverLogType.info, "There is no need to update Blind  at - " + new Date());
    // 			cb(null, params);
    // 		}
    // 	}
    // }
    /*======================================  END  =============================*/

// var processBlind = function (params, cb) {
// 	// cb(null, params);
// 	if (params.blindRule && params.blindRule.length === params.table.blindLevel) {
// 		cb(null, params);
// 	} else {
// 		//console.log(stateOfX.serverLogType.info, "params in processBlind is in blindUpdate is - - " + JSON.stringify(params));
// 		//console.log(stateOfX.serverLogType.info, "params.table.tournamentStartTime is " + params.table.tournamentStartTime);
// 		//console.log(stateOfX.serverLogType.info, "params.blindRule[params.table.blindLevel].duration*60000 - " + (params.blindRule[params.table.blindLevel].duration) * 60000);
// 		// var nextBlindUpdateTime = params.table.tournamentStartTime + (params.blindRule[params.table.blindLevel].duration) * 60000;
// 		// //console.log(stateOfX.serverLogType.info, "nextBlindUpdateTime is in processBlind is - " + nextBlindUpdateTime);



// 		// ////console.log("getBlindsDetailsresponse", getBlindsDetailsresponse)

// 		const mintSinceTourRunning = Math.floor((Date.now() - params.table.tournamentStartTime) / (1000 * 60));

// 		// Calculate the number of breaks taken within the elapsed time
// 		let currentLevel = Math.floor(mintSinceTourRunning / params.blindRule[0].blindDuration ? params.blindRule[0].blindDuration : 5);

// 		// Output the results
// 		////console.log("mintSinceTourRunning completed:", mintSinceTourRunning);
// 		////console.log("Current blind level:", currentLevel);
// 		if (currentLevel >= 98) {
// 			currentLevel = 98
// 		}
// 		var nextBlindUpdateTime = params.table.tournamentStartTime + (params.blindRule[currentLevel].duration) * 60000;
// 		//console.log(stateOfX.serverLogType.info, "nextBlindUpdateTime is in processBlind is - " + nextBlindUpdateTime);
// 		var blindObject = params.blindRule[currentLevel];
// 		if (params.table.blindLevel != currentLevel) {
// 			//console.log(stateOfX.serverLogType.info, "It is right time to update blind in blindupdate");
// 			params.data.isBlindUpdated = true; // Used to broadcast client for new blind details
// 			params.table.lastBlindUpdate = Number(new Date());
// 			params.table.smallBlind = blindObject.smallBlind;
// 			params.table.bigBlind = blindObject.bigBlind;
// 			params.table.ante = blindObject.ante;
// 			params.table.blindLevel = params.table.blindLevel + 1;
// 			//console.log(stateOfX.serverLogType.info, "params.table.tournamentStartTime in processBlind is - " + params.table.tournamentStartTime);
// 			var nextBlindUpdateTime2 = Math.ceil((params.table.tournamentStartTime + (blindObject.duration) * 60000) - (Number(new Date())));
// 			params.table.nextBlindUpdateTime2 =  parseInt(nextBlindUpdateTime2/60000);
// 			//console.log(stateOfX.serverLogType.info, "nextBlindUpdateTime2 in processBlind is - " + params.table.nextBlindUpdateTime2);
// 			params.data.newBlinds = {
// 				smallBlind: params.table.smallBlind,
// 				bigBlind: params.table.bigBlind,
// 				ante: params.table.ante,
// 				blindLevel: params.table.blindLevel,
// 				nextBlindUpdateTime: nextBlindUpdateTime2 < 0 ? 0 : nextBlindUpdateTime2
// 			}
// 			params.table.nextBlindInfo = {
// 				smallBlind: !!params.blindRule[params.table.blindLevel] ? params.blindRule[params.table.blindLevel].smallBlind : -1,
// 				bigBlind: !!params.blindRule[params.table.blindLevel] ? params.blindRule[params.table.blindLevel].bigBlind : -1,
// 				ante: !!params.blindRule[params.table.blindLevel] ? params.blindRule[params.table.blindLevel].ante : -1,
// 				blindLevel: !!params.blindRule[params.table.blindLevel] ? params.table.blindLevel : -1
// 			}
// 			if (!!params.blindRule[params.table.blindLevel]) {
// 				params.table.nextBlindInfo.nextBlindUpdateTime = params.table.tournamentStartTime + (params.blindRule[params.table.blindLevel].duration) * 60000;
// 			} else {
// 				params.table.nextBlindInfo.nextBlindUpdateTime = -1;
// 			}
// 			//console.log(stateOfX.serverLogType.info, "params.table.nextBlindInfo processBlind is --- " + JSON.stringify(params.table.nextBlindInfo));
// 			//console.log(stateOfX.serverLogType.info, "The updated params in processBlind is --- " + JSON.stringify(params));
// 			cb(null, params);
// 		} else {
// 			//console.log(stateOfX.serverLogType.info, "There is no need to update Blind  at - " + new Date());
// 			cb(null, params);
// 		}
// 	}
// }



    /*======================================  START  =============================*/
    /**
     * This function contains a series of async functions that have been defined above 
     * @method updateBlind
     * @param  {Object}       params  request json object
     * @param  {Function}     cb      callback function
     * @return {Object}               params/validated object
     */
    // New
    async updateBlind(params: any): Promise<any> {
        // Check if blindRuleData exists and assign it to blindRule if present
        if (!!params.table.blindRuleData) {
        params.blindRule = params.table.blindRuleData;
        }
    
        try {
        // Process the blind update logic
        const result = await this.processBlind(params);
        
        // Return the result in the expected format
        return { success: true, params: result };
        } catch (err) {
        // Handle any error during the blind update
        return { success: false };
        }
    }

    // Old
    // blindUpdate.updateBlind = function (params, cb) {
    //         //console.log(stateOfX.serverLogType.info, "params is in updateBlind is " + JSON.stringify(params));
    //         if (!!params.table.blindRuleData) {
    //             params.blindRule = params.table.blindRuleData;
    //         }
    //         async.waterfall([
    //             async.apply(processBlind, params),
    //         ], function (err, result) {
    //             if (err) {
    //                 //console.log(stateOfX.serverLogType.info, "ERROR in updatting blind in blind update")
    //                 cb({ success: false });
    //             } else {
    //                 // //console.log(stateOfX.serverLogType.info, "The result in updateBlind is ----- ", result);
    //                 cb({ success: true, params: result });
    //             }
    //         })
    //     }
    /*======================================  END  =============================*/






}