import { Injectable } from "@nestjs/common";
import _ from 'underscore';
import _ld from "lodash";
import shortid = require('shortid32');
import { PokerDatabaseService } from "shared/common/datebase/pokerdatabase.service";
import { systemConfig } from "shared/common";
shortid.characters('QWERTYUIOPASDFGHJKLZXCVBNM012345');




//  _= require('underscore'),
//  tateOfX = require("../../../../../shared/stateOfX.js"),
//  broadcastHandler = require("./broadcastHandler"),
//  db  = require("../../../../../shared/model/dbQuery.js"),
//  logDB           = require("../../../../../shared/model/logDbQuery.js"),
//  sharedModule = require('../../../../../shared/sharedModule.js'),
//  systemConfig = require("../../../../../shared/systemConfig"),
//  stateOfX                = require("../../../../../shared/stateOfX.js"),
//   zmqPublish              = require("../../../../../shared/infoPublisher.js"),
//   _ld                = require("lodash"),
//  shortid  = require('shortid32'),
//  async = require('async'),
//  pomelo = require('pomelo')
//  shortid.characters('QWERTYUIOPASDFGHJKLZXCVBNM012345');






@Injectable()
export class PromotionalDataHandlerService {

    constructor(
        private readonly db: PokerDatabaseService
    ) { }





    async handle(params: any): Promise<any> {
        try {
            params = await this.findAllUsers(params);
            params = await this.getMyRank(params);
            params = await this.getTopPlayers(params);
            params = await this.getStaticHeader(params);
            return params;
        } catch (err: any) {
            return { success: false, info: err.info || "VIP is not allow for you" };
        }
    }

    async findAllUsers(params: any): Promise<any> {
        const result = await this.db.findAllUserwithNoOfHands();

        if (result && result.length > 0) {
            params.allPlayers = [];
            let tempRank = 0;

            for (const player of result) {
                const temData: any = {};
                temData.playerId = player._id;
                temData.rank = ++tempRank;
                temData.totalHands = player.numberOfHands;
                params.allPlayers.push(temData);
            }

            return params;
        } else {
            throw { success: false, info: "Player ID is not exist" };
        }
    }

    async getMyRank(params: any): Promise<any> {
        const getMyRankData = _.where(params.allPlayers, { playerId: params.playerId });
        let myCurrentRank: number | string = 'NA';
        let myCurrentHands = 0;

        if (getMyRankData && getMyRankData.length > 0) {
            myCurrentRank = getMyRankData[0].rank;
            myCurrentHands = getMyRankData[0].totalHands;
        }

        params.myRank = {
            rank: myCurrentRank,
            numberOfHands: myCurrentHands
        };

        return params;
    }



    async getTopPlayers(params: any): Promise<any> {
        const getTopPlayers = [];
        for (let i = 0; i < 10; i++) {
            const element = params.allPlayers[i];
            if (element) getTopPlayers.push(element);
        }

        if (!!params && getTopPlayers.length > 0) {
            const playerData: any[] = [];

            for (const player of getTopPlayers) {
                const user = await this.db.findUser({ playerId: player.playerId });

                if (user) {
                    const temData: any = {
                        rank: player.rank,
                        playerId: user.playerId,
                        userName: user.userName,
                        profileImage: user.profileImage,
                        numberOfHands: player.totalHands
                    };
                    playerData.push(temData);
                }
            }

            delete params.allPlayers;
            params.players = _.sortBy(playerData, "rank");
            return params;
        } else {
            throw { success: false, info: "No any player is found!!" };
        }
    }

    async getStaticHeader(params: any): Promise<any> {
        params.headerText = { rank: "Rank", Players: "Players", Hands: "Hands" };
        return params;
    }


    async getPlayerDetails(playerId: string, rank: number, noOfhands: number): Promise<any> {
        const user = await this.db.findUser({ playerId });

        if (user) {
            const temData = {
                rank: rank,
                playerId: user.playerId,
                userName: user.userName,
                profileImage: user.profileImage,
                numberOfHands: noOfhands
            };
            return temData;
        }

        return null;
    }

    //   module.exports.getLeaderboardData = function (params, cb) {
    //   console.log(".........................................i m here params get leaderborad", params);
    //    let query = {};
    //    let date = new Date();
    //    query.year = date.getUTCFullYear();
    //    query.month = date.getUTCMonth() + 1;
    //    logDB.getAllContestData(query, function (err, result) {
    //      if (err) {
    //        console.log("....................... uggghhhhh err in contest data", err);
    //        cb(err,null);
    //      } else {

    //        let resultData = {}

    //        for (let i = 0; i < result.length; i++) {
    //          for (j = 0; j < result[i].players.length; j++) {
    //            result[i].players[j].noOfHands = result[i].players[j].noOfHands.toString();
    //          }
    //          var playerData = _.where(result[i].players, {
    //            playerId: params.playerId
    //          })
    //          var rank = _ld.findIndex(result[i].players, {
    //            playerId: params.playerId
    //          });
    //          if (rank >= 0) {
    //            playerData = playerData[0];
    //          } else {
    //            playerData = {
    //              playerId: params.playerId,
    //              noOfHands: "0",
    //              userName: params.userName,
    //              profileImage: systemConfig.imageUploadHost + "/profileImage/playerId/" + params.playerId
    //            }
    //          }


    //          // playerData.rank = 9;

    //         //  console.log("rankdata ---", rank);
    //          var tempData = {};
    //          tempData[result[i]._id] = {};
    //          tempData[result[i]._id].players = result[i].players.slice(0, 5);
    //          tempData[result[i]._id].myRank = playerData;
    //         //  console.log("...................playerDAta", playerData)
    //          tempData[result[i]._id].myRank.rank = (rank + 1) || "N/A";
    //            tempData[result[i]._id].myRank.rank = (tempData[result[i]._id].myRank.rank).toString();
    //          Object.assign(resultData, tempData);
    //          // console.log("........pluck data",);
    //        }
    // console.log("...............................resurlt data....",resultData)
    //        cb(null,resultData)
    //      }
    //    });
    // }

    // Added by Kunal - for IPL

    async getLeaderboardData(params: any): Promise<any> {
        const query: any = {};
        const date = new Date();
        query.year = date.getUTCFullYear();
        query.month = date.getUTCMonth() + 1;

        const result = await this.db.getAllContestData(query);
        const resultData: any = {};

        for (let i = 0; i < result.length; i++) {
            for (let j = 0; j < result[i].players.length; j++) {
                result[i].players[j].noOfHands = result[i].players[j].noOfHands.toString();
            }

            let playerData: any = _.where(result[i].players, {
                playerId: params.playerId,
            });

            const rank = _ld.findIndex(result[i].players, {
                playerId: params.playerId,
            });

            if (rank >= 0) {
                playerData = playerData[0];
            } else {
                playerData = {
                    playerId: params.playerId,
                    noOfHands: "0",
                    userName: params.userName,
                    profileImage: `${systemConfig.imageUploadHost}/profileImage/playerId/${params.playerId}`,
                };
            }

            const tempData: any = {};
            tempData[result[i]._id] = {};
            tempData[result[i]._id].players = result[i].players.slice(0, 5);
            tempData[result[i]._id].myRank = playerData;
            tempData[result[i]._id].myRank.rank = (rank + 1 || "N/A").toString();

            Object.assign(resultData, tempData);
        }

        return resultData;
    }







}