
import * as _ from 'underscore';
import { validateKeySets } from 'shared/common/utils/activity';
import { ActivityService } from 'shared/common/activity/activity.service';
import { systemConfig, stateOfX, popupTextManager } from 'shared/common';
import { ServerDownManagerService } from 'shared/common/server-down-manager/server-down-manager.service';
import { DbRemoteService } from '../database/dbRemote.service';
import { PokerDatabaseService } from 'shared/common/utils/pokerdatabase.service';
import { SharedModuleService } from 'shared/common/utils/sharedModule.service';
import { UtilityService } from 'shared/common/utils/utils.service';
import { Injectable } from '@nestjs/common';
import { RedisSessionService } from '../../redis/redis-session.service';


@Injectable()
export class GateHandler {

    constructor(
        private readonly db: PokerDatabaseService,
        private readonly activity: ActivityService,
        private readonly serverDownManager: ServerDownManagerService,
        private readonly dbRemote: DbRemoteService,
        private readonly utilsService: UtilityService,
        private readonly sharedModule: SharedModuleService,
        private readonly redisSessionService:RedisSessionService
    ) { }


    async getConnector(msg: any): Promise<any> {

        // console.log("--------msg-0----",msg)

        try {
            // const clientStatus = await this.serverDownManager.checkClientStatus('login', msg);

            // if (!clientStatus) {
            //     return {
            //         success: false,
            //         info: "This installation is corrupted. Please try again.",
            //         errorType: "5012"
            //     };
            // }

            // const connectors = self.app.getServersByType('connector');
            const activityParams: any = {
                data: {},
                rawInput: msg
            };
            const activityCategory = stateOfX.profile.category.profile;
            const activitySubCategory = stateOfX.profile.subCategory.login;

            const keyValidation = await validateKeySets(
                "Request",
                "gate",
                "getConnector",
                msg
            );

            if (!keyValidation.success) {
                return keyValidation;
            }

            msg.emailId = msg.emailId.trim().toLowerCase();
            msg.userName = msg.userName.trim();

            const usernamePattern = /^[a-zA-Z0-9_]*$/;
            if (!msg.userName || !usernamePattern.test(msg.userName)) {
                return {
                    success: false,
                    isRetry: false,
                    isDisplay: false,
                    channelId: "",
                    info: popupTextManager.falseMessages.GETCONNECTOR_USERNAMEERROR_GATEHANDLER
                };
            }

            if (msg.loginType.toLowerCase() === 'login') {

                let isValidated = await this.handleLogin(msg, activityParams, activityCategory, activitySubCategory);

                if(isValidated.success) {
                    let isAddSession = await this.redisSessionService.addUserSession(isValidated.user.playerId,msg.socketId);

                    console.log("----Session Add----",isAddSession)
                }


                return isValidated;

            } else if (msg.loginType.toLowerCase() === 'registration') {

                return await this.handleRegistration(msg,activityParams, activityCategory, activitySubCategory);

            } else {
                return {
                    success: false,
                    isRetry: false,
                    isDisplay: false,
                    channelId: "",
                    info: popupTextManager.falseMessages.GETCONNECTOR_UNKOWNLOGINTYPEERROR_GATEHANDLER
                };
            }
        } catch (err) {
            console.trace("-------Error- gateHandlerService----",err.message)
            return {
                success: false,
                info: err.info || "This installation is corrupted. Please try again.",
                errorType: err.errorType || "5012"
            };
        }
    }

    private async handleLogin(msg: any, activityParams: any, activityCategory: string, activitySubCategory: string): Promise<any> {


        if (msg.loginMode.toLowerCase() === 'normal') {



            const filterForUser: any = {};
            if (msg.userName) filterForUser.userName = msg.userName;
            if (msg.emailId) filterForUser.emailId = msg.emailId;
            filterForUser.password = msg.password;

            const validateUserResponse = await this.dbRemote.validateUser(msg);


            if (!validateUserResponse) {
                activityParams.comment = "not able to find data from db";
                activityParams.rawResponse = { success: false, info: "not able to find data from db" };
                this.activity.logUserActivity(activityParams, activityCategory, activitySubCategory, stateOfX.profile.activityStatus.error);
                return { success: false, info: "not able to find data from db" };
            }

            if (validateUserResponse.success) {
                // const hostPortData = await this.getHostAndPort({
                //     self: self,
                //     deviceType: msg.deviceType,
                //     connector: connectors,
                //     playerId: validateUserResponse.user.playerId
                // });

                const hostPortData = { success: true, host: 'staging.gamebadlo.com', port: 3050 }

                if (hostPortData.success) {
                    activityParams.playerId = validateUserResponse.user.playerId;
                    validateUserResponse.user.host = hostPortData.host;
                    validateUserResponse.user.port = hostPortData.port;
                    activityParams.comment = "user login successfully";
                    activityParams.rawResponse = { success: true, user: validateUserResponse.user };
                    activityParams.data = validateUserResponse.user;

                    this.activity.logUserActivity(
                        activityParams,
                        activityCategory,
                        activitySubCategory,
                        stateOfX.profile.activityStatus.completed
                    );

                    const userData = {
                        fullName: `${validateUserResponse.user.firstName || ''} ${validateUserResponse.user.lastName || ''}`,
                        loginTime: Date.now(),
                        userName: msg.userName.toLowerCase(),
                        contact: validateUserResponse.user.mobileNumber || "",
                        emailId: validateUserResponse.user.emailId,
                        device: msg.deviceType || "",
                        ipAddress: msg.ipV4Address || "",
                        action: "login",
                        isOrganic: validateUserResponse.user.isOrganic,
                        playerId: validateUserResponse.user?.playerId || 'N/A'
                    };

                    // console.log("--------login-----",userData)

                    await this.db.dailyLoggedInUser(userData);

                    return {
                        success: true,
                        serverVersion: systemConfig.serverVersion,
                        user: validateUserResponse.user,
                        isDecimal: systemConfig.isDecimal,
                        isLeaderBoard: systemConfig.isLeaderBoard,
                        isSpinTheWheel: systemConfig.spinTheWheel,
                        isNewYearBanner: systemConfig.isNewYearBanner
                    };
                } else {
                    activityParams.comment = "user not found";
                    activityParams.rawResponse = hostPortData;
                    this.activity.logUserActivity(activityParams, activityCategory, activitySubCategory, stateOfX.profile.activityStatus.error);
                    return hostPortData;
                }
            } else {

                activityParams.comment = validateUserResponse.info;
                activityParams.rawResponse = validateUserResponse.info;
                this.activity.logUserActivity(activityParams, activityCategory, activitySubCategory, stateOfX.profile.activityStatus.error);
                return { success: false, isDisplay: false, info: validateUserResponse.info };
            }
        } else if (msg.loginMode.toLowerCase() === 'facebook' || msg.loginMode.toLowerCase() === 'google') {
            const profile = await this.dbRemote.createProfile(msg);

            if (!profile) {
                activityParams.comment = "not able to find data from db for socialLogin";
                activityParams.rawResponse = { success: false, info: "not able to find data from db for socialLogin" };
                this.activity.logUserActivity(activityParams, activityCategory, activitySubCategory, stateOfX.profile.activityStatus.error);
                return { success: false, info: "not able to find data from db for socialLogin" };
            }

            if (profile.success) {
                // const hostPortData = await this.getHostAndPort({
                //     self: self,
                //     deviceType: msg.deviceType,
                //     connector: connectors,
                //     playerId: profile.user.playerId
                // });

                const hostPortData = { success: true, host: 'staging.gamebadlo.com', port: 3050 }

                if (hostPortData.success) {
                    profile.user.host = hostPortData.host;
                    profile.user.port = hostPortData.port;
                    activityParams.comment = "user login successfully";
                    activityParams.rawResponse = { success: true, user: profile.user };
                    activityParams.playerId = profile.user.playerId;
                    activityParams.data = profile.user;
                    this.activity.logUserActivity(activityParams, activityCategory, activitySubCategory, stateOfX.profile.activityStatus.completed);
                    return { success: true, serverVersion: systemConfig.serverVersion, user: profile.user };
                } else {
                    activityParams.comment = "error in creating user";
                    activityParams.rawResponse = hostPortData;
                    this.activity.logUserActivity(activityParams, activityCategory, activitySubCategory, stateOfX.profile.activityStatus.error);
                    return hostPortData;
                }
            } else {
                activityParams.comment = "error in creating user";
                activityParams.rawResponse = profile;
                this.activity.logUserActivity(activityParams, activityCategory, activitySubCategory, stateOfX.profile.activityStatus.error);
                return { success: false, info: profile.info };
            }
        } else {
            activityParams.comment = "unknown loginMode";
            activityParams.rawResponse = { success: false, info: "unknown loginMode" };
            this.activity.logUserActivity(activityParams, activityCategory, activitySubCategory, stateOfX.profile.activityStatus.error);
            return {
                success: false,
                isRetry: false,
                isDisplay: false,
                channelId: "",
                info: popupTextManager.falseMessages.GETCONNECTOR_UNKNOWNLOGIN_GATEHANDLER
            };
        }
    }

    private async handleRegistration(
        msg: any,
        activityParams: any,
        activityCategory: string,
        activitySubCategory: string
    ): Promise<any> {
        if (!msg.userName && !msg.emailId || !msg.password) {
            return {
                success: false,
                isRetry: false,
                isDisplay: false,
                channelId: "",
                info: popupTextManager.falseMessages.GETCONNECTOR_MINREQFIELDERROR_GATEHANDLER
            };
        }

        if (!this.validatePassword(msg.password)) {
            return {
                success: false,
                isRetry: false,
                isDisplay: false,
                channelId: "",
                info: popupTextManager.falseMessages.GETCONNECTOR_INVALIDPASSWORD_GATEHANDLER
            };
        }

        if (!this.validateUserName(msg.userName)) {
            return {
                success: false,
                isRetry: false,
                isDisplay: false,
                channelId: "",
                info: popupTextManager.falseMessages.GETCONNECTOR_USERNAMEERROR_GATEHANDLER
            };
        }

        if (!this.validateEmail(msg.emailId)) {
            return {
                success: false,
                isRetry: false,
                isDisplay: false,
                channelId: "",
                info: popupTextManager.falseMessages.GETCONNECTOR_INVALIDEMAIL_GATEHANDLER
            };
        }

        const createdProfile = await this.dbRemote.createProfile(msg);

        if (!createdProfile) {
            activityParams.comment = "not able to create user in db";
            activityParams.rawResponse = { success: false, info: "not able to create user in db" };
            this.activity.logUserActivity(activityParams, activityCategory, activitySubCategory, stateOfX.profile.activityStatus.error);
            return {
                success: false,
                isRetry: false,
                isDisplay: false,
                channelId: "",
                info: popupTextManager.falseMessages.GETCONNECTOR_UNABLETOCREATEUSER_GATEHANDLER
            };
        }

        if (createdProfile.success) {
            if (createdProfile.user.emailId) {
                const emailVerificationLink = `${systemConfig.protocol}${systemConfig.emailHost}:${systemConfig.emailPort}/verifyEmail/?token=${createdProfile.user.emailVerificationToken}`;
                const params = {
                    from_email: stateOfX.mailMessages.from_emailLogin.toString(),
                    to_email: createdProfile.user.emailId,
                    userName: createdProfile.user.userName,
                    verifyLink: emailVerificationLink,
                    linkTitle: "Click here to verify your mail",
                    content: `${stateOfX.mailMessages.mail_contentEmailVerification.toString()}${emailVerificationLink}`,
                    subject: stateOfX.mailMessages.mail_subjectEmailVerification.toString()
                };

                let mailSentResponse = this.sharedModule.sendMailWithHtml(params);
            }

            // const hostPortData = await this.getHostAndPort({
            //     self: self,
            //     deviceType: msg.deviceType,
            //     connector: connectors,
            //     playerId: createdProfile.user.playerId
            // });

            const hostPortData = { success: true, host: 'staging.gamebadlo.com', port: 3050 };

            if (hostPortData.success) {
                createdProfile.user.host = hostPortData.host;
                createdProfile.user.port = hostPortData.port;
                activityParams.comment = "profile created successfully";
                activityParams.rawResponse = { success: true, info: createdProfile.user };
                activityParams.playerId = createdProfile.user.playerId;
                activityParams.data = createdProfile.user;
                this.activity.logUserActivity(activityParams, activityCategory, stateOfX.profile.subCategory.signUp, stateOfX.profile.activityStatus.completed);

                await this.db.dailyLoggedInUser({
                    fullName: `${createdProfile.user.firstName || ''} ${createdProfile.user.lastName || ''}`,
                    loginTime: Date.now(),
                    userName: msg.userName.toLowerCase(),
                    contact: createdProfile.user.mobileNumber || "",
                    emailId: createdProfile.user.emailId,
                    isOrganic: createdProfile.user.isOrganic,
                    device: msg.deviceType || "",
                    ipAddress: msg.ipV4Address || "",
                    action: "login",
                    playerId: createdProfile.user?.playerId || 'N/A'
                });

                return {
                    success: true,
                    serverVersion: systemConfig.serverVersion,
                    user: createdProfile.user,
                    isDecimal: systemConfig.isDecimal,
                    isLeaderBoard: systemConfig.isLeaderBoard,
                    isSpinTheWheel: systemConfig.spinTheWheel,
                    isNewYearBanner: systemConfig.isNewYearBanner
                };
            } else {
                activityParams.comment = "not able to find suitable connector";
                activityParams.rawResponse = { success: false, info: hostPortData };
                this.activity.logUserActivity(activityParams, activityCategory, activitySubCategory, stateOfX.profile.activityStatus.error);
                return hostPortData;
            }
        } else {
            activityParams.comment = createdProfile.info;
            activityParams.rawResponse = { success: false, info: createdProfile.info };
            this.activity.logUserActivity(activityParams, activityCategory, activitySubCategory, stateOfX.profile.activityStatus.error);
            return {
                success: false,
                info: createdProfile.info,
                suggestions: createdProfile.suggestions,
                code: 409
            };
        }
    }

    private async getHostAndPort(params: any): Promise<any> {
        // console.log("in gate-------------", params.playerId);
        if (params.deviceType === "website") {
            return { success: true, host: "", port: 0 };
        }

        const validated = await validateKeySets(
            "Request",
            'connector',
            "getHostAndPort",
            params
        );

        if (!validated.success) {
            return validated;
        }

        try {
            const response = await this.db.findUserSessionInDB(params);

            if (response.success && response.result) {
                const res = _.findWhere(params.connector, { id: response.result.serverId });
                if (typeof res === 'object') {
                    return {
                        success: true,
                        host: res.connectHost,
                        port: res.clientPort
                    };
                }
            }

            const res: any = this.utilsService.dispatcher(params.playerId, params.connector);

            await this.dbRemote.insertUserSessionInDB(
                { playerId: params.playerId, serverId: res.id }
            );

            return {
                success: true,
                host: res.connectHost,
                port: res.clientPort
            };
        } catch (err) {
            console.error("Error in getHostAndPort:", err);
            return {
                success: false,
                host: "",
                port: 0
            };
        }
    }

    private validatePassword(password: string): boolean {
        return password.length >= 6 && password.length <= 25;
    }

    private validateUserName(userName: string): boolean {
        const patt = /^[a-zA-Z0-9_]*$/;
        return patt.test(userName);
    }

    private validateEmail(emailId: string): boolean {
        const patt = /\S+@\S+\.\S+/;
        return patt.test(emailId);
    }
}