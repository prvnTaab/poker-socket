import { Injectable } from "@nestjs/common";
import { PokerDatabaseService } from "shared/common/datebase/pokerdatabase.service";
import { BroadcastHandlerService } from "../room/broadcastHandler.service";
import popupTextManager from "shared/common/popupTextManager";
import stateOfX from "shared/common/stateOfX.sevice";
import { systemConfig } from "shared/common";









// profileMgmt = require("../../../../../shared/model/profileMgmt.js"),
// sharedModule = require('../../../../../shared/sharedModule.js'),



@Injectable()
export class TourStartRemoteService {




    constructor(
        private readonly db: PokerDatabaseService,
        private readonly broadcastHandler: BroadcastHandlerService,

    ) { }



    tourStart(): void {
        console.log(`
████████╗ ██████╗ ██╗   ██╗██████╗ ███╗   ██╗ █████╗ ███╗   ███╗███████╗███╗   ██╗████████╗
╚══██╔══╝██╔═══██╗██║   ██║██╔══██╗████╗  ██║██╔══██╗████╗ ████║██╔════╝████╗  ██║╚══██╔══╝
   ██║   ██║   ██║██║   ██║██████╔╝██╔██╗ ██║███████║██╔████╔██║█████╗  ██╔██╗ ██║   ██║   
   ██║   ██║   ██║██║   ██║██╔══██╗██║╚██╗██║██╔══██║██║╚██╔╝██║██╔══╝  ██║╚██╗██║   ██║   
   ██║   ╚██████╔╝╚██████╔╝██║  ██║██║ ╚████║██║  ██║██║ ╚═╝ ██║███████╗██║ ╚████║   ██║   
   ╚═╝    ╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝╚═╝     ╚═╝╚══════╝╚═╝  ╚═══╝   ╚═╝   

 ██████╗██████╗  ██████╗ ███╗   ██╗    ███████╗████████╗ █████╗ ██████╗ ████████╗███████╗██████╗  
██╔════╝██╔══██╗██╔═══██╗████╗  ██║    ██╔════╝╚══██╔══╝██╔══██╗██╔══██╗╚══██╔══╝██╔════╝██╔══██╗ 
██║     ██████╔╝██║   ██║██╔██╗ ██║    ███████╗   ██║   ███████║██████╔╝   ██║   █████╗  ██║  ██║ 
██║     ██╔══██╗██║   ██║██║╚██╗██║    ╚════██║   ██║   ██╔══██║██╔══██╗   ██║   ██╔══╝  ██║  ██║ 
╚██████╗██║  ██║╚██████╔╝██║ ╚████║    ███████║   ██║   ██║  ██║██║  ██║   ██║   ███████╗██████╔╝ 
 ╚═════╝╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝    ╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═════╝  
`);
        // Uncomment and adapt as needed:
        // setInterval(async () => {
        //   const currentTime = Date.now();
        //   const rooms = await db.findTournamentRoom({ 
        //     state: 'REGISTRATION', 
        //     tournamentStartTime: { $gte: currentTime - 60000 } 
        //   });
        //   for (const room of rooms) {
        //     console.log("Starting tournament:", room);
        //     await startTournament(room);
        //   }
        // }, 60 * 1000);
    };


    async startTournament(tourRoom: any): Promise<any> {

        if (tourRoom.enrolledPlayer >= tourRoom.minPlayers) {
            const result = await this.createTables(tourRoom);
            if (result.success) {
                // You can uncomment and adapt delay logic if needed:
                // const delayInStartTournament = systemConfig.delayInNormalTournament * 1000;
                // setTimeout(() => {
                //   startTournamentHandler.process({ tournamentId: tourRoom.tournamentId, self: { app: params.globalThis }, session: "session" });
                // }, delayInStartTournament);
                return result;
            } else {
                return {
                    success: false,
                    isRetry: false,
                    isDisplay: false,
                    tournamentId: tourRoom.tournamentId,
                    info: popupTextManager.falseMessages.CREATETABLEFORNORMALTOURNAMENTFAIL_TOURNAMENTSCHEDULER
                };
            }
        } else {
            await this.cancelTournament(tourRoom);
            return {
                success: false,
                isRetry: false,
                isDisplay: false,
                tournamentId: tourRoom.tournamentId,
                info: "Insufficient players; tournament canceled."
            };
        }
    };


    async createTables(tourRoom: any): Promise<any> {

        const dataToCreateTable: any = { tourRoom };

        // 1. Remove any existing tables
        const removed = await this.db.removeTournamentTable(tourRoom.tournamentId);
        if (!removed) {
            throw { success: false, tournamentId: tourRoom.tournamentId, info: "Error in deleteExistingTables" };
        }

        // 2. Fetch blind rule data
        const blindRuleData = await this.db.findBlindRule(tourRoom.blindId.toString());
        if (!blindRuleData) {
            throw { success: false };
        }
        dataToCreateTable.blindRuleData = blindRuleData;

        // 3. Fetch break rule data
        const breakRuleData = await this.db.findBreakRule(tourRoom.breakId.toString());
        if (!breakRuleData) {
            throw { success: false };
        }
        console.log("Successfully found break rule", breakRuleData);
        dataToCreateTable.breakRuleData = breakRuleData;

        // 4. (Optional) Fetch time bank rule if needed...
        // const timeBankRuleData = await db.findTimeBankRule(tourRoom.timeBankId.toString());
        // dataToCreateTable.timeBankRuleData = timeBankRuleData;

        // 5. Compute number of tables and build each
        const noOfTables = Math.ceil(tourRoom.enrolledPlayer / tourRoom.playerPerTable);
        const tables = Array.from({ length: noOfTables }, () => tableKeys(dataToCreateTable));

        // 6. Create each tournament table sequentially
        let index = 1;
        for (const tableConfig of tables) {
            tableConfig.channelName += ` ${index++}`;
            const created = await this.db.createTournamentTable(tableConfig);
            if (!created) {
                throw { success: false, info: "Error in inserting tables in database" };
            }
            console.log("Table created successfully:", tableConfig.channelName);
        }

        // 7. Update tournament state to STARTED (fire-and-forget)
        await this.db.updateTourState(tourRoom.tournamentId, "STARTED").catch(() => {
            console.error("Couldn't update tournament state to STARTED.");
        });

        return { success: true, tourRoom };
    };


    tableKeys(params: any): Record<string, any> {
        const { tourRoom, blindRuleData, breakRuleData } = params;

        const tempObj: any = {
            isActive: true,
            channelType: stateOfX.gameType.tournament,
            isRealMoney: JSON.parse(tourRoom.isRealMoney),
            channelName: tourRoom.tournamentName,
            turnTime: tourRoom.turnTime,
            callTime: tourRoom.callTime || 0,
            isPotLimit: tourRoom.isPotLimit || false,
            maxPlayers: tourRoom.playerPerTable,
            minPlayers: tourRoom.minPlayers,
            smallBlind: tourRoom.smallBlind || 100,
            bigBlind: tourRoom.bigBlind || 200,
            ante: tourRoom.ante || 0,
            isStraddleEnable: false,
            minBuyIn: tourRoom.minBuyIn || 0,
            maxBuyIn: tourRoom.maxBuyIn || 0,
            numberOfRebuyAllowed: tourRoom.numberOfRebuyAllowed ?? null,
            hourLimitForRebuy: tourRoom.hourLimitForRebuy ?? null,
            rebuyHourFactor: tourRoom.rebuyHourFactor ?? null,
            isRebuyAllowed: tourRoom.isRebuyAllowed || false,
            gameInfo: tourRoom.gameInfo,
            gameInterval: tourRoom.gameInterval || false,
            blindMissed: tourRoom.blindMissed || false,
            channelVariation: tourRoom.channelVariation || false,
            noOfChipsAtGameStart: tourRoom.chips,
            rakeRule: null,
            tournament: {
                tournamentId: String(tourRoom.tournamentId),
                avgFlopPercent: tourRoom.avgFlopPercent || 0,
                avgPot: tourRoom.avgPot || 0,
                blindId: String(tourRoom.blindId),
                bountyfees: tourRoom.bountyPrice,
                channelType: tourRoom.channelType,
                entryfees: tourRoom.entryFees,
                extraTimeAllowed: tourRoom.extraTimeAllowed || false,
                housefees: tourRoom.houseFees,
                isBountyEnabled: tourRoom.isBounty || false,
                isActive: tourRoom.isActive ?? true,
                tournamentStartTime: tourRoom.tournamentStartTime,
                lateRegistrationAllowed: tourRoom.isLateRegistrationAllowed,
                lateRegistrationTime: tourRoom.lateRegistrationTime,
                maxPlayersForTournament: tourRoom.maxPlayers,
                minPlayersForTournament: tourRoom.minPlayers,
                totalFlopPlayer: tourRoom.totalFlopPlayer || 0,
                totalGame: tourRoom.totalGame || 0,
                totalPlayer: tourRoom.enrolledPlayer,
                totalPot: tourRoom.totalPot || 0,
                tournamentBreakTime: tourRoom.tournamentBreakTime || 0,
                tournamentBreakDuration: tourRoom.tournamentBreakDuration || 0,
                tournamentRules: tourRoom.tournamentRules || 0,
                tournamentTime: tourRoom.tournamentTime || 0,
                tournamentType: tourRoom.tournamentType || 0,
                isRebuyAllowed: tourRoom.isRebuyAllowed || false,
                winTicketsForTournament: tourRoom.winTicketsForTournament || 0,
                isRecurring: tourRoom.isRecurring || false,
                recurringTime: tourRoom.recurringTime || 0,
                rebuyTime: tourRoom.rebuyTime || 0,
                breakRuleId: tourRoom.breakId,
                breakRuleData: breakRuleData.breaks,
                blindRuleData: blindRuleData.blinds
            }
        };

        if (tourRoom.tournamentType === stateOfX.tournamentType.satelite) {
            tempObj.tournament.parentOfSatelliteId = tourRoom.parentOfSatelliteId;
        }

        return tempObj;
    }


    async cancelTournament(tourRoom: any): Promise<any> {

        if (tourRoom.enrolledPlayer > 0) {
            const filter = {
                tournamentId: tourRoom.tournamentId,
                status: "Registered"
            };

            // Change tournament state immediately
            await this.changeTournamentState(tourRoom);

            // 1. Deactivate all registered users
            const updateResult = await this.db.updateMultipleTournamentUser(filter, { isActive: false });
            if (!updateResult) {
                throw {
                    success: false,
                    info: dbConfigMsg.DBUPDATEMULTIPLETOURNAMENTUSERFAIL_CANCELTOURNAMENT,
                    isRetry: false,
                    isDisplay: false,
                    channelId: ""
                };
            }

            // 2. Fetch all now-inactive tournament users
            const users = await db.findTournamentUser({ ...filter, isActive: false });
            if (!users) {
                throw {
                    success: false,
                    info: dbConfigMsg.DBFINDTOURNAMENTUSERFAIL_CANCELTOURNAMENT,
                    isRetry: false,
                    isDisplay: false,
                    channelId: ""
                };
            }

            // 3. For each user, handle ticket withdrawal and refund
            for (const user of users) {
                const query1 = {
                    playerId: user.playerId,
                    tournamentId: tourRoom.tournamentId,
                    status: 0
                };

                const userTicket = await this.db.getUserTicket(query1);
                if (userTicket && userTicket.isWithdrawable) {
                    await this.notifyUser(tourRoom, user.playerId);

                    if (tourRoom.isRealMoney &&
                        (tourRoom.tournamentType === "NORMAL" || tourRoom.tournamentType === "SATELLITE")) {
                        await addRealChips(userTicket);
                    }

                    const tourUpdateData = {
                        status: 3,
                        isWithdrawable: false,
                        tourCancelTime: Date.now()
                    };
                    // update ticket (fire-and-forget)
                    await this.db.updateTourTicket(query1, tourUpdateData);
                }
            }

            return { success: true };
        } else {
            return { success: true, info: "No players enrolled" };
        }
    };


    async notifyUser(tourRoom: any, playerId: string): Promise<void> {
        // 1. Fetch user
        const user = await this.db.findUser({ playerId });
        if (!user) return;

        // 2. Send email notification if enabled
        if (systemConfig.tourNotification.mail) {
            const mailData = {
                to_email: user.emailId,
                from_email: systemConfig.from_email,
                subject: 'Tournament Cancelled.',
                template: 'tourCancelled',
                html: `
Dear ${user.userName},<br>
We are sorry to inform you regarding the tournament '${tourRoom.tournamentName}' you have registered for.<br>
Due to one of the below mentioned reasons:<br>
1) Minimum Registered Players criteria for this tournament didn't get fulfilled.<br>
2) Technical Error.<br><br>
No need to panic! Your registration charges will be refunded and added to your ${systemConfig.userNameForMail} Wallet.<br><br>
See you in the next tournament.<br><br>
Regards,<br>
${systemConfig.userNameForMail}
`
            };
            await this.sharedModule.sendMailWithHtml(mailData).catch(() => { /* swallow errors */ });
        }

        // 3. Send SMS notification if enabled
        if (systemConfig.tourNotification.sms) {
            const messageData = {
                mobileNumber: '91' + user.mobileNumber,
                msg: `
Dear ${user.userName},<br>
We are sorry to inform you that the tournament '${tourRoom.tournamentName}' got cancelled.<br><br>
Regards,<br>
${systemConfig.userNameForMail}
`
            };
            await this.sharedModule.sendOtp(messageData).catch(() => { /* swallow errors */ });
        }
    }


async changeTournamentState(tourRoom: any): Promise<void> {
    try {
        await this.db.updateTourState(tourRoom.tournamentId, "CANCEL");
    } catch {
        console.log("couldn't update tournament state to CANCEL");
    }
}


async addRealChips(params: any): Promise<void> {
    console.log("in addRealChips", params);

    try {
        // 1. Fetch user data
        const user = await this.db.findUserDataForMth(params.playerId);

        // 2. Add chips to user profile
        const addChipsResponse = await profileMgmt.addChips({
            playerId: params.playerId,
            chips: params.entryFees,
            bonusChips: 0,
            isRealMoney: true
        });

        // 3. Broadcast updated profile to user
        await this.broadcastHandler.sendMessageToUser({
            msg: {
                playerId: params.playerId,
                updated: {
                    freeChips: user.freeChips,
                    realChips: (user.realChips + user.realChipBonus + params.entryFees) || 0,
                    RC_Amt: user.realChips || 0,
                    RCB_Amt: user.realChipBonus || 0
                }
            },
            playerId: params.playerId,
            route: stateOfX.broadcasts.updateProfile
        });

        if (!addChipsResponse.success) {
            console.log("Couldn't update real chips on cancellation", addChipsResponse);
        }

        // 4. Insert transaction history
        const mthData = {
            isOrganic: user.isOrganic,
            createdAt: new Date(),
            userName: user.userName,
            playerId: params.playerId,
            tableName: params.tournamentName,
            transactionType: "Tournament Cancel",
            transactionId: "-",
            refrenceNumber: params.refrenceNumber,
            amount: params.entryFees,
            beforeAmount: (user.realChips + user.realChipBonus) - params.entryFees,
            afterAmount: user.realChips + user.realChipBonus,
            transactionMode: "Credit",
            balanceType: 1,
            chipType: "Real Money",
            parentId: user.isParentUserName ? user.isParentUserName : "-",
            transferBy: "System"
        };

        await this.db.insertIntoMTH(mthData);
    } catch (err) {
        console.error("Error in addRealChips:", err);
    }
}






}
