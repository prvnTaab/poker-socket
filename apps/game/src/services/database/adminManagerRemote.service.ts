import { Injectable } from "@nestjs/common";

var serverDownManager = require(appDir+ "game-server/app/util/serverDownManager");



declare const pomelo:any;

@Injectable()
export class AdminManagerRemoteService {

    constructor(

    ) {}



    async inform(message: any): Promise<void> {
        await serverDownManager.msgRcvd(pomelo.app, message);
      }



}