import { Injectable } from "@nestjs/common";
import { PokerDatabaseService } from "shared/common/datebase/pokerdatabase.service";





// var db = require("../../../../../shared/model/dbQuery");
// var adminDB = require("../../../../../shared/model/adminDbQuery");
// var encryptDecrypt = require('../../../../../shared/passwordencrytpdecrypt');




@Injectable()
export class PanCardHandlerService {

    constructor(
        private readonly db: PokerDatabaseService,
        private readonly encryptDecrypt: EncryptDecryptService
    ) { }






    async panCardInsertAndUpdate(params: any): Promise<any> {
        // strip framework properties
        delete params.isLoggedIn;
        delete params.__route__;

        // encrypt PAN
        const encryptedPan = this.encryptDecrypt.encrypt(params.PANNumber).result;

        // ensure no other user has same PAN
        const existing = await this.db.findUser({ panNumber: encryptedPan });
        if (existing) {
            throw { success: false, info: "This PAN number is associated with other account" };
        }

        // build request record
        const data: any = {
            userName: params.userName,
            createdAt: Date.now(),
            playerId: params.playerId,
            panNumber: encryptedPan,
            dateOfBirth: params.DOB,
            name: params.NameOnPAN,
            verifiedAt: '',
            emailId: params.emailId
        };

        // insert verification request
        const panCard = await this.db.createPancardVerificationRequest(data);
        if (!panCard) {
            throw { success: false, info: "Something Went Wrong!! Please try it again." };
        }

        return { success: true, data: "PAN Card Details Submitted Successfully." };
    }







}