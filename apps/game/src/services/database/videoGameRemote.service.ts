import { Injectable } from "@nestjs/common";
import _ from "underscore";
import { ImdbDatabaseService } from "shared/common/datebase/Imdbdatabase.service";
import stateOfX from "shared/common/stateOfX.sevice";
import { PokerDatabaseService } from "shared/common/datebase/pokerdatabase.service";
import { popupTextManager } from "shared/common";


@Injectable()
export class VideoGameRemoteService {

    constructor(
        private readonly imdb: ImdbDatabaseService,
        private readonly db: PokerDatabaseService

    ) { }





    // this function is for create video logs
    // params : {roundId, channelId, type, data}
    async createVideo(params: any): Promise<any> {
        const channelId = params.channelId || (params.data ? params.data.channelId : '');

        const table = await this.imdb.getTable(channelId);

        if (!params.roundId && !!table) {
            params.roundId = table.roundId;
        } else if (!params.roundId) {
            params.roundId = '';
        }

        const history = {
            type: params.type,
            data: params.data,
            createdAt: Number(new Date())
        };

        const query = {
            roundId: params.roundId,
            channelId: params.channelId
        };

        console.trace("updating video is like", query, history);

        try {
            const updatedVideo = await this.db.insertNextVideo(query, history);

            if (
                params.type === stateOfX.videoLogEventType.broadcast &&
                params.data.route === "gameOver"
            ) {
                try {
                    await this.db.updateVideo(query, { active: true });
                    return { success: true, result: { videoId: updatedVideo._id } };
                } catch (err) {
                    return {
                        success: false,
                        info: "Error while setting video as active true.",
                        isDisplay: false,
                        isRetry: false,
                        channelId: ""
                    };
                }
            } else {
                return {
                    success: false,
                    info: "Error while setting video as active true.",
                    isDisplay: false,
                    isRetry: false,
                    channelId: ""
                };
            }
        } catch (err) {
            return {
                success: false,
                info: "Error in insert new video in db",
                isDisplay: false,
                isRetry: false,
                channelId: ""
            };
        }
    };

    // Get video details from video Id passed from video collection
    async getVideo(params: any): Promise<any> {
        const video = await this.db.findVideoById(params.videoId);

        if (video) {
            params.video = video;
            return params;
        } else {
            throw {
                success: false,
                info: popupTextManager.dbQyeryInfo.DB_NOVIDEOEXISTS,
                isDisplay: false,
                isRetry: false,
                channelId: ""
            };
        }
    }


    // Get hand history id for this video id from handtab collection
    async getHandHistory(params: any): Promise<any> {
        const res = await this.db.getHandHistoryByVideoId(params.videoId);

        if (res) {
            params.handHistoryId = res.handHistoryId;
            params.handId = res.handId;
            return params;
        } else {
            throw {
                success: false,
                info: popupTextManager.dbQyeryInfo.DB_GETHISTORYBYVIDEO_FAIL,
                isDisplay: false,
                isRetry: false,
                channelId: ""
            };
        }
    }


    // Generate response for video player (as requested by client)
    async generateResponse(params: any): Promise<any> {
        const firstCreation = params.video.createdAt;
        const response: any = {};

        response.success = true;
        response.handHistoryId = params.handHistoryId;
        response.gamePlayers = _.where(params.video.history, { type: "gamePlayers" })[0]?.data;
        response.joinResponse = _.where(params.video.history, { type: "joinResponse" })[0]?.data;

        if (response.joinResponse) {
            response.joinResponse.playerId = params.playerId;
            response.joinResponse.playerName = params.playerName;
        }

        response.roundId = params.video.roundId;
        response.handId = params.handId;

        const broadCastType = _.where(params.video.history, { type: "broadcast" });
        const responseType = _.where(params.video.history, { type: "response" });

        const broadcasts: any[] = [];
        const responses: any[] = [];
        let duration = 0;
        let timeStamp = 0;

        for (let i = 0; i < broadCastType.length; i++) {
            timeStamp = (broadCastType[i].createdAt - firstCreation) / 1000;
            if (
                broadCastType[i].data.route === "preCheck" ||
                broadCastType[i].data.route === "bestHands" ||
                broadCastType[i].data.route === "playerCards"
            ) {
                if (params.playerId === broadCastType[i].data.playerId) {
                    broadcasts.push({ timestamp: timeStamp, data: broadCastType[i].data });
                }
            } else {
                broadcasts.push({ timestamp: timeStamp, data: broadCastType[i].data });
            }
            if (broadCastType[i].data.route === "gameOver") {
                duration = timeStamp;
            }
        }

        for (let i = 0; i < responseType.length; i++) {
            const responseTimeStamp = (responseType[i].createdAt - firstCreation) / 1000;
            responses.push({ timestamp: responseTimeStamp, data: responseType[i].data });
        }

        response.broadcasts = broadcasts;
        response.duration = duration;
        response.responses = responses;

        params.response = response;

        return response;
    }

    // this function is for get video data from database and create response
    // params : {videoId, playerId}
    async getVideoData(params: any): Promise<any> {
        try {
            const withVideo = await this.getVideo(params);
            const withHandHistory = await this.getHandHistory(withVideo);
            const response = await this.generateResponse(withHandHistory);
            return response;
        } catch (error) {
            return {
                success: false,
                info: "Error in getting video from db",
                isDisplay: false,
                isRetry: false,
                channelId: ""
            };
        }
    }


    // EXPERIMENTAL USE
    getVideoDataByRoundId(params: any): any {
        return {
            success: false,
            info: "Error in getting video from db",
            isDisplay: false,
            isRetry: false,
            channelId: ""
        };
    };

    // find roundId (alpha-numeric unique for game)
    // by handId (numeric unique for game, visible to player and admin)
    findRoundIdByHandId(params: any, response: any): any {
        return {
            success: false,
            info: "There are no games with this handId."
        };
    };


    // EXPERIMENTAL USE
    getVideoAndText(params: any): any {
        // params = {by: "roundId"/"handId", value: "r934t854t8", responses: ["video", "text"]}
        return {
            success: false,
            info: "Error in getting video from db",
            isDisplay: false,
            isRetry: false,
            channelId: ""
        };
    };









}