import { Injectable } from "@nestjs/common";
import { systemConfig } from 'shared/common';
import { PokerDatabaseService } from "shared/common/datebase/pokerdatabase.service";














@Injectable()
export class CancelTournamentService {


    constructor(
        private db: PokerDatabaseService,
    ) {}






    /*====================================  START  ===================================*/
    /**
 * function initializeParams is used to initialise data for the tournament which needs to be cancelled 
 */

    // New
    async initializeParams(tournament: any): Promise<any> {
    
        const params: any = {
          tournament,
          tournamentFees: tournament.entryFees + tournament.houseFees + tournament.bountyFees,
          playerIds: [],
          enrolledPlayers: 0,
        };
    
        try {
          const count = await this.db.countTournamentusers({
            tournamentId: tournament.tournamentId,
            status: "Registered",
          });
    
          params.enrolledPlayers = count;
    
          return params;
    
        } catch (err) {
          return {
            success: false,
            info: "Error in count enrolled players",
            isRetry: false,
            isDisplay: false,
            channelId: "",
          };
        }
      }

    // Old
    // let initializeParams = function (tournament, cb) {
    //     console.log("in initializeParams in cancelTournament is - " + JSON.stringify(tournament));
    //     let params = {
    //     tournament: tournament,
    //     tournamentFees: tournament.entryFees + tournament.houseFees + tournament.bountyFees,
    //     playerIds: [],
    //     enrolledPlayers: 0,
    //     }
    //     db.countTournamentusers({ tournamentId: tournament.tournamentId, status: "Registered" }, function (err, count) {
    //     if (err) {
    //         cb({ success: false, info: "Error in count enrolled players", isRetry: false, isDisplay: false, channelId: "" });
    //     } else {
    //         console.log("enrolled players are in initializeParams are - " + params.enrolledPlayers);
    //         params.enrolledPlayers = count;
    //         cb(null, params);
    //     }
    //     })
    // }
    /*====================================  END  ===================================*/
  

    /*====================================  START  ===================================*/
    /**
     * function deActivateTournamentUsers is used to deActivate TournamentUsers  for the tournament which needs to be cancelled 
     */

    //   New
    async deActivateTournamentUsers(params: any): Promise<any> {

        if (params.enrolledPlayers) {
        try {
            await this.db.updateMultipleTournamentUser(
            { tournamentId: params.tournament.tournamentId, status: "Registered" },
            { status: "CANCELLED", isActive: false }
            );
        } catch (err) {
            console.log("Error in modifyTournamentUsers in deActivateTournamentUsers");
            return {
            success: false,
            info: "Error in changing users status",
            isRetry: false,
            isDisplay: false,
            channelId: "",
            };
        }
        }

        return params;
    }

    //   Old
    //   let deActivateTournamentUsers = function (params, cb) {
    //     console.log("in deActivateTournamentUsers in cancelTournament is - " + JSON.stringify(params));
    //     if (params.enrolledPlayers) {
    //       db.updateMultipleTournamentUser({ tournamentId: params.tournament.tournamentId, status: "Registered" }, { status: "CANCELLED", isActive: false }, function (err, result) {
    //         if (err) {
    //           console.log("Error in modifyTournamentUsers in deActivateTournamentUsers");
    //           cb({ success: false, info: "Error in changing users status", isRetry: false, isDisplay: false, channelId: "" });
    //         }
    //         cb(null, params);
    //       })
    //     } else {
    //       cb(null, params);
    //     }
    //   }
    /*====================================  END  ===================================*/
  

    /*====================================  START  ===================================*/


    // New
    async refundChips(params: any): Promise<any> {
    
        if (!params.enrolledPlayers) {
          return params;
        }
    
        const tournamentId = params.tournament.tournamentId;
    
        let response;
        try {
          response = await this.db.findTournamentUser({ tournamentId, status: "CANCELLED" });
        } catch (err) {
          return {
            success: false,
            info: 'unable to find tournament users',
            isRetry: false,
            isDisplay: true,
            channelId: "",
          };
        }
    
        if (!response || response.length === 0) {
          return {
            success: false,
            info: 'unable to find tournament users',
            isRetry: false,
            isDisplay: true,
            channelId: "",
          };
        }
    
        for (const user of response) {
          this.informPlayer(params, user.playerId);
    
          try {
            const userTicket = await this.db.getUserTicket({
              playerId: user.playerId,
              tournamentId,
              status: 0,
            });
    
            if (userTicket && userTicket.isWithdrawable) {
              const isRealMoney = params.tournament.isRealMoney;
              const isNormalOrSatellite =
                (params.tournament.tournamentType === "NORMAL" || params.tournament.tournamentType === "SATELLITE");
    
              if (isRealMoney && isNormalOrSatellite) {
                const walletResponse = await this.wallet.sendWalletBroadCast({
                  action: 'tourCancel',
                  data: {
                    playerId: user.playerId,
                    isRealMoney: isRealMoney,
                    chips: userTicket.entryFees,
                    points: userTicket.points,
                    tableName: params.tournament.tournamentName,
                    referenceNumber: userTicket.referenceNumber,
                  }
                });
                console.log("wallet respone in cancelTour is", walletResponse);
              }
    
              try {
                const updateTourTicketResponse = await this.db.updateTourTicket(
                  {
                    playerId: user.playerId,
                    tournamentId,
                    status: 0,
                  },
                  {
                    status: 3,
                    isWithdrawable: false,
                    tourCancelTime: Number(new Date()),
                  }
                );
                console.log("Updated TourTicket on withdrawal:", updateTourTicketResponse);
              } catch (err) {
                console.log("Couldn't update TourTicket on withdrawal", err);
              }
            }
          } catch (err) {
            console.log("Error processing user ticket", err);
          }
        }
    
        return params;
      }

    // Old
//   let refundChips = function (params, cb) {
//     console.log("params in refundChips is>", params)
//     if (params.enrolledPlayers) {
//       db.findTournamentUser({ tournamentId: params.tournament.tournamentId, status: "CANCELLED" }, function (err, response) {
//         if (err || !response) {
//           cb({ success: false, info: 'unable to find tournament users', isRetry: false, isDisplay: true, channelId: "" });
//         } else {
//           for (let i = 0; i < response.length; i++) {
//             informPlayer(params, response[i].playerId);
//             db.getUserTicket({ playerId: response[i].playerId, tournamentId: params.tournament.tournamentId, status: 0 }, function (err, userTicket) {
//               if (err || !userTicket) {
//                 console.log("didn't find any ticket")
//               }
//               else {
//                 console.log("fetched ticket is", userTicket)
//                 if (userTicket.isWithdrawable) {
//                   console.log("in userTicket.isWithdrawable")
//                   if ((params.tournament.isRealMoney && params.tournament.tournamentType === "NORMAL" || params.tournamentType === "SATELLITE") && userTicket.isWithdrawable) {
//                     console.log("in isRealMoney & NOR & State")
//                     let walletResponse = wallet.sendWalletBroadCast({
//                       action: 'tourCancel',
//                       data: {
//                         playerId: response[i].playerId,
//                         isRealMoney: params.tournament.isRealMoney,
//                         chips: userTicket.entryFees,
//                         points: userTicket.points,
//                         tableName: params.tournament.tournamentName,
//                         referenceNumber: userTicket.referenceNumber,
//                       }
//                     })
//                     console.log("wallet respone in calceltour is", walletResponse)
//                   }
//                   // updateTicket 
//                   db.updateTourTicket({ playerId: response[i].playerId, tournamentId: params.tournament.tournamentId, status: 0 }, { status: 3, isWithdrawable: false, tourCancelTime: Number(new Date()) }, function (err, updateTourTicketResponse) {
//                     if (err || updateTourTicketResponse) {
//                       console.log("Couldn/t update TourTicket on withdrawn", err, updateTourTicketResponse)
//                     }
//                   })
//                 }
//                 else {
//                   // register to next tourNament
//                   //as user couldn't withdrawa his/her ticket and tournament is recuring
//                 }
//               }
//             })
//           }
//           cb(null, params)
//         }
//       })
//     } else {
//       cb(null, params)
//     }
//   }
    /*====================================  END  ===================================*/
  
    /*====================================  START  ===================================*/

    // New
    async informPlayer(params: any, playerId: string): Promise<void> {
        let user;
        try {
          user = await this.db.findPlayerWithId({ playerId });
        } catch (err) {
          return;
        }
    
        if (!user) {
          return;
        }
    
    
        // Mail notification
        if (systemConfig.tourNotification.mail) {
          const mailData = {
            to_email: user.emailId,
            subject: 'Tournament Cancelled.',
            template: 'tourCancelled',
            content: {
              userName: user.userName,
              tourName: params.tournament.tournamentName,
            }
          };
    
          try {
            const result = await this.sharedModule.sendMailWithHtml(mailData);
            if (result.success) {
              console.log("Mail sent successfully to", user.emailId);
            } else {
              console.log("Mail not sent.");
            }
          } catch (error) {
            console.log("Error sending mail:", error);
          }
        }
    
        // SMS notification
        if (systemConfig.tourNotification.sms) {
          try {
            const otpApiResponse = await this.sharedModule.sendOtp({
              mobileNumber: '91' + '9009993455', // Replace with dynamic number if required
              msg: `Dear ${user.userName}, We are sorry to inform you that the tournament ${params.tournament.tournamentName} is cancelled due to technical issue/fewer entries. Try to register in other tournaments on pokermagnet.com`,
            });
    
            if (otpApiResponse.success) {
              console.log("MSG sent successfully");
            } else {
              console.log("MSG not sent.");
            }
          } catch (error) {
            console.log("Error sending SMS:", error);
          }
        }
      }

    // Old
//   let informPlayer = function (params, playerId) {
//     db.findPlayerWithId({ 'playerId': playerId }, (err, user) => {
//       if (!user) {
//         console.log("Couldn/t find user to update rc on withdrawn", user)
//       } else {
//         console.log("params in notify user on cancel 2222222222222--- >", params)
//         if (systemConfig.tourNotification.mail) {
//           let mailData = {
//             to_email: user.emailId,
//             // to_email: "jagdeep@pokermagnet.com",
//             subject: 'Tournament Cancelled.',
//             template: 'tourCancelled',
//             content: {
//               userName: user.userName,
//               tourName: params.tournament.tournamentName,
//             }
//           }
//           sharedModule.sendMailWithHtml(mailData, (result) => {
//             if (result.success) {
//               console.log("Mail sent successfully to", user.emailId);
//             } else {
//               console.log("Mail not sent.");
//             }
//           })
//         }
//         if (systemConfig.tourNotification.sms) {
//           sharedModule.sendOtp({
//             // mobileNumber: '91' + user.mobileNumber,
//             mobileNumber: '91' + '9009993455',
//             msg: `Dear ${user.userName}, We are sorry to inform you that the tournament ${params.tournament.tournamentName} is cancelled due to technical issue/fewer entries. Try to register in other tournaments on pokermagnet.com`
//           }, (otpApiResponse) => {
//             if (otpApiResponse.success) {
//               console.log("MSG sent successfully");
//             } else {
//               console.log("MSG not sent.");
//             }
//           })
//         }
//       }
//     })
//   }
    /*====================================  END  ===================================*/
  

    /*====================================  START  ===================================*/
    /**
     * function changeTournamentState is used to change tournament state from running to cancelled
     */

    //   New
    async changeTournamentState(params: any): Promise<any> {

        const query:any = {
        tournamentId: params.tournament.tournamentId,
        };

        const updateData:any = {
        state: "CANCELLED",
        };

        // Check if the tournament is recurring
        if (params.tournament.isRecurring) {
        query.isRecurring = params.tournament.isRecurring;
        updateData.tournamentStartTime = params.tournament.tournamentStartTime + params.tournament.recurringTime * 60 * 60000;
        }

        try {
        // Perform the database update
        await this.db.updateTournamentStateAndVersionGenralized(query, updateData);
        console.log("successfully changed state of tournament");

        return params;  // Return params indicating success
        } catch (err) {
        console.error("Error in change tournament state", err);
        throw {
            success: false,
            info: "Error in change tournament state",
            isRetry: false,
            isDisplay: false,
            channelId: "",
        };
        }
    }

    //   Old
    //   let changeTournamentState = function (params, cb) {
    //     console.log("params is in changeTournamentState in cancelTournament is - " + JSON.stringify(params));
    //     let query = {
    //       tournamentId: params.tournament.tournamentId
    //     }
    //     let updateData = {
    //       state: "CANCELLED"
    //     }
    //     if (params.tournament.isRecurring) {
    //       query.isRecurring = params.tournament.isRecurring;
    //       updateData.tournamentStartTime = params.tournament.tournamentStartTime + params.tournament.recurringTime * 60 * 60000;
    //     }
    //     db.updateTournamentStateAndVersionGenralized(query, updateData, function (err, result) {
    //       if (err) {
    //         cb({ success: false, info: "Error in change tournament state", isRetry: false, isDisplay: false, channelId: "" });
    //       } else {
    //         console.log("successfully changed state of tournament");
    //         cb(null, params);
    //       }
    //     })
    //   }
    /*====================================  END  ===================================*/
 
    
    /*====================================  START  ===================================*/
  /**
   * function cancelTournament is used to cancelTournament  through a series of async funtions defined above
   */

//   New
async cancel(tournament: any): Promise<void> {

    try {
      // Call initializeParams
      const params = await this.initializeParams(tournament);

      // Call deActivateTournamentUsers
      await this.deActivateTournamentUsers(params);

      // Call refundChips
      await this.refundChips(params);

      // Call changeTournamentState
      await this.changeTournamentState(params);

      console.log("tournament cancelled successfully");
    } catch (err) {
      console.log("err in cancel tournament", err);
    }
  }


//   Old
//   cancelTournament.cancel = function (tournament) {
//     console.log("in cancel tournament, tournament is - " + JSON.stringify(tournament));
//     async.waterfall([
//       async.apply(initializeParams, tournament),
//       deActivateTournamentUsers,
//       refundChips,
//       changeTournamentState,
//     ], function (err, result) {
//       if (err) {
//         console.log("err in cancel tournament" + err);
//       } else {
//         console.log("tournament cancelled successfully");
//       }
//     })
//   }
    /*====================================  END  ===================================*/











}