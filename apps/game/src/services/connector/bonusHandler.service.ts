import { Injectable } from "@nestjs/common";
import { PokerDatabaseService } from "shared/common/utils/pokerdatabase.service";













@Injectable()
export class BonusHandlerService {


    constructor(
        private readonly db: PokerDatabaseService
    ) { }




    async listBonusCode(param: { userName: string }): Promise<any> {
        return await this.db.listBonusCode(param.userName);
    };










}