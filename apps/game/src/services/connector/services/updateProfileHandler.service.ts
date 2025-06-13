import { Injectable } from "@nestjs/common";
import { ActivityService } from "shared/common/activity/activity.service";
import { PokerDatabaseService } from "shared/common/datebase/pokerdatabase.service";
import _ from 'underscore';
import { BroadcastHandlerService } from "./broadcastHandler.service";
import popupTextManager from "shared/common/popupTextManager";
import { validateKeySets } from "shared/common/utils/activity";
import { stateOfX } from "shared/common";





@Injectable()
export class UpdateProfileHandlerService {


    constructor(
        private readonly db: PokerDatabaseService,
        private readonly activity: ActivityService,
        private readonly broadcastHandler: BroadcastHandlerService,
        private readonly encryptDecrypt: EncryptDecryptService
    ) { }








    /**
     *  This function is used to validate EmailId
     *
     * @method process
     * @param  {Object}       msg  request json object
     * @param  {Function}     cb      callback function
     * @return {Object}               params/validated object
     */
    async validateEmail(msg: any): Promise<any> {
        if (!!msg.updateKeys.emailId) {
            const user = await this.db.findUser({ emailId: msg.updateKeys.emailId });
            if (user) {
                return {
                    success: false,
                    isRetry: false,
                    isDisplay: true,
                    channelId: "",
                    info: popupTextManager.dbQyeryInfo.DBFINDUSEREMAILERROR_UPDATEPROFILEHANDLER
                };
            }
        }
        return msg;
    };
    /**
     *  This function is used to checkIfAvatar
     *
     * @method checkIfAvatar
     * @param  {Object}       msg  request json object
     * @param  {Function}     cb      callback function
     * @return {Object}               params/validated object
     */
    async checkIfAvatar(msg: any): Promise<any> {
        if (!!msg.updateKeys.profileImage) {
            msg.broadcastName = "avatarChanged";
            msg.broadcastData = {
                playerId: msg.query.playerId,
                avtarImage: msg.updateKeys.profileImage
            };
            this.broadcastHandler.fireBroadcastOnSession(msg);
        }

        msg = _.omit(msg, "session");
        msg = _.omit(msg, "self");

        return msg;
    };

    /**
     *  This function is used to validateMobileNumber
     *
     * @method validateMobileNumber
     * @param  {Object}       msg  request json object
     * @param  {Function}     cb      callback function
     * @return {Object}               params/validated object
     */
    async validateMobileNumber(msg: any): Promise<any> {
        if (!!msg.updateKeys.mobileNumber) {
            if (Number.isInteger(msg.updateKeys.mobileNumber) && msg.updateKeys.mobileNumber > 0) {
                const user = await this.db.findUser({ mobileNumber: msg.updateKeys.mobileNumber });
                if (!!user) {
                    return {
                        success: false,
                        isRetry: false,
                        isDisplay: false,
                        channelId: "",
                        info: popupTextManager.dbQyeryInfo.DBVALIDATEMOBILENUMBER_EXISTINGMOBILENUMBER_UPDATEPROFILEHANDLER
                    };
                } else {
                    return msg;
                }
            } else {
                return {
                    success: false,
                    isRetry: false,
                    isDisplay: true,
                    channelId: "",
                    info: popupTextManager.dbQyeryInfo.DBVALIDATEMOBILENUMBER_INVALIDMOBILENUMBER_UPDATEPROFILEHANDLER
                };
            }
        } else {
            return msg;
        }
    };

    /**
     *  This function is used to updateUser
     *
     * @method update user
     * @param  {Object}       msg  request json object(pancard number,isMobileVerified)
     * @param  {Function}     cb      callback function
     * @return {Object}               params/validated object
     */
    async updateUser(msg: any): Promise<any> {
        const validated = await validateKeySets("Request", msg.serverType, "updateUser", msg);

        if (!validated.success) {
            return validated;
        }

        if (!!msg.updateKeys.emailId) {
            msg.updateKeys.isEmailVerified = false;
        }

        if (!!msg.updateKeys.mobileNumber) {
            msg.updateKeys.isMobileNumberVerified = false;
        }

        if (!!msg.updateKeys.panNumber) {
            const encryptPanNumber = this.encryptDecrypt.encrypt(msg.updateKeys.panNumber);
            if (encryptPanNumber.success) {
                msg.updateKeys.panNumber = encryptPanNumber.result;
            } else {
                return {
                    success: false,
                    isRetry: false,
                    isDisplay: false,
                    channelId: "",
                    info: popupTextManager.falseMessages.UPDATEUSERENCRYPTIONERROR_UPDATEPROFILEHANDLER
                };
            }
        }

        const response = await this.db.updateUser(msg.query, msg.updateKeys);

        if (!!response && !!response.result) {
            return {
                success: true,
                info: "user updated successfully",
                isRetry: false,
                isDisplay: false,
                channelId: ""
            };
        } else {
            return {
                success: false,
                isRetry: false,
                isDisplay: false,
                channelId: "",
                info: popupTextManager.dbQyeryInfo.DBUPDATEUSER_NOUSERERROR_UPDATEPROFILEHANDLER
            };
        }
    };


    /**
     *  This function is used to updateProfile through a series of async functions defined above
     *
     * @method updateProfile
     * @param  {Object}       params  request json object
     * @param  {Function}     cb      callback function
     * @return {Object}               params/validated object
     */
    async updateProfile(params: any): Promise<any> {
        const activityParams: any = {};
        activityParams.data = {};
        const activityCategory = stateOfX.profile.category.profile;
        const activitySubCategory = stateOfX.profile.subCategory.update;
        activityParams.rawInput = _.omit(params, ["self", "session"]);
        activityParams.playerId = params.query.playerId;

        try {
            let step1 = await this.validateEmail(params);
            let step2 = await this.validateMobileNumber(step1);
            let step3 = await this.checkIfAvatar(step2);
            let response = await this.updateUser(step3);

            activityParams.rawResponse = response;
            if (response.success) {
                activityParams.comment = "Profile updated successfully";
                this.activity.logUserActivity(
                    activityParams,
                    activityCategory,
                    activitySubCategory,
                    stateOfX.profile.activityStatus.completed
                );
            } else {
                activityParams.comment = "Error in profile update";
                this.activity.logUserActivity(
                    activityParams,
                    activityCategory,
                    activitySubCategory,
                    stateOfX.profile.activityStatus.error
                );
            }

            return { success: true, info: "Profile details updated successfully!" };
        } catch (err) {
            return {
                success: false,
                isRetry: false,
                isDisplay: true,
                channelId: "",
                info: popupTextManager.falseMessages.UPDATEPROFILEFAIL_UPDATEPROFILEHANDLER
            };
        }
    };



    /**
     *  This function is used to getProfile of a player
     *
     * @method getProfile
     * @param  {Object}       params  request json object
     * @param  {Function}     cb      callback function
     * @return {Object}               params/validated object
     */
    async getProfile(params: any): Promise<any> {
        const onesArray = [];
        for (let itr = 0; itr < params.keys.length; itr++) {
            onesArray.push(1);
        }

        const keys = _.object(params.keys, onesArray);

        const profile = await this.db.getCustomUser(params.playerId, keys);
        if (!profile) {
            return {
                success: false,
                isRetry: false,
                isDisplay: true,
                channelId: "",
                info: popupTextManager.dbQyeryInfo.DBGETCUSTOMUSERFAIL_UPDATEPROFILEHANDLER
            };
        }

        profile.playerId = params.playerId;
        return { success: true, result: profile };
    };























}