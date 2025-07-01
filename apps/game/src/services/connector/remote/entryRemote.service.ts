import { Injectable } from "@nestjs/common";







@Injectable()
export class EntryRemoteService {


    constructor(

    ) { }





    // async getUserSession(msg: any): Promise<any> {


    //     const sessions = this.sessionService.getByUid(msg.playerId);


    //     const session = sessions && sessions.length > 0 ? sessions[0] : null;

    //     if (session) {
    //         const disconnectedStatus = session.get("isDisconnectedForce") || false;
    //         console.error(disconnectedStatus);
    //         return {
    //             success: true,
    //             sessionId: session.id,
    //             isDisconnectedForce: disconnectedStatus,
    //         };
    //     } else {
    //         return {
    //             success: false,
    //             info: "user session not found",
    //             isRetry: false,
    //             isDisplay: false,
    //             channelId: "",
    //         };
    //     }
    // }





}