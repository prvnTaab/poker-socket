import * as dispatcher from '../../../util/dispatcher';
import * as _ from 'underscore';
import * as keyValidator from '../../../../../shared/keysDictionary';
import * as db from '../../../../../shared/model/dbQuery';
import * as adminDB from '../../../../../shared/model/adminDbQuery';
import * as activity from '../../../../../shared/activity';
import * as sharedModule from '../../../../../shared/sharedModule';
import { systemConfig, stateOfX, popupTextManager } from 'shared/common';
import * as serverDownManager from '../../../util/serverDownManager';



export class GateHandler {


    async getConnector(msg: any, session: any, next: (err: any, data?: any) => void): Promise<void> {
        const self = this;
        
        if (serverDownManager.checkServerState('login', self.app)) {
            try {
                const result = await db.findMultipleScheduleTasks({ 
                    limit: 1, 
                    type: 'serverDown', 
                    status: { $in: ["STARTED", "PENDING"] } 
                });

                const ct = new Date().getTime();
                let infoServerUpTime = 0;
                if (result && result[0] && result[0].serverUpTime) {
                    infoServerUpTime = result[0].serverUpTime;
                }

                let minutes = infoServerUpTime ? (infoServerUpTime - ct) / 60000 : 0;
                if (minutes <= 0) minutes = 30;

                const timeString = minutes >= 60 
                    ? `${Math.floor(minutes / 60)} hour(s) and ${Math.floor(minutes % 60)} minute(s)`
                    : `${minutes} minute(s)`;

                next(null, { 
                    success: false, 
                    info: `Server is under maintenance. Please try again after ${timeString}. We appreciate your support.` 
                });
                return;
            } catch (err) {
                next(null, { 
                    success: false, 
                    info: "Server maintenance information unavailable. Please try again later." 
                });
                return;
            }
        }

        try {
            const clientStatus = await serverDownManager.checkClientStatus('login', msg, self.app);
            
            if (!clientStatus) {
                next(null, { 
                    success: false, 
                    info: "This installation is corrupted. Please try again.", 
                    errorType: "5012" 
                });
                return;
            }

            const connectors = self.app.getServersByType('connector');
            const activityParams: any = { 
                data: {},
                rawInput: msg 
            };
            const activityCategory = stateOfX.profile.category.profile;
            const activitySubCategory = stateOfX.profile.subCategory.login;

            const keyValidation = await keyValidator.validateKeySets(
                "Request", 
                self.app.serverType, 
                "getConnector", 
                msg
            );

            if (!keyValidation.success) {
                next(null, keyValidation);
                return;
            }

            msg.emailId = msg.emailId.trim().toLowerCase();
            msg.userName = msg.userName.trim();

            const usernamePattern = /^[a-zA-Z0-9_]*$/;
            if (!msg.userName || !usernamePattern.test(msg.userName)) {
                next(null, { 
                    success: false, 
                    isRetry: false, 
                    isDisplay: false, 
                    channelId: "", 
                    info: popupTextManager.falseMessages.GETCONNECTOR_USERNAMEERROR_GATEHANDLER 
                });
                return;
            }

            if (msg.loginType.toLowerCase() === 'login') {
                await this.handleLogin(msg, self, connectors, activityParams, activityCategory, activitySubCategory, next);
            } else if (msg.loginType.toLowerCase() === 'registration') {
                await this.handleRegistration(msg, self, connectors, activityParams, activityCategory, activitySubCategory, next);
            } else {
                next(null, { 
                    success: false, 
                    isRetry: false, 
                    isDisplay: false, 
                    channelId: "", 
                    info: popupTextManager.falseMessages.GETCONNECTOR_UNKOWNLOGINTYPEERROR_GATEHANDLER 
                });
            }
        } catch (err) {
            next(null, { 
                success: false, 
                info: err.info || "This installation is corrupted. Please try again.", 
                errorType: err.errorType || "5012" 
            });
        }
    }

    private async handleLogin(
        msg: any,
        self: GateHandler,
        connectors: any[],
        activityParams: any,
        activityCategory: string,
        activitySubCategory: string,
        next: (err: any, data?: any) => void
    ): Promise<void> {
        if (msg.loginMode.toLowerCase() === 'normal') {
            const filterForUser: any = {};
            if (msg.userName) filterForUser.userName = msg.userName;
            if (msg.emailId) filterForUser.emailId = msg.emailId;
            filterForUser.password = msg.password;

            const validateUserResponse = await self.app.rpc.database.dbRemote.validateUser(self.session, msg);

            if (!validateUserResponse) {
                activityParams.comment = "not able to find data from db";
                activityParams.rawResponse = { success: false, info: "not able to find data from db" };
                activity.logUserActivity(activityParams, activityCategory, activitySubCategory, stateOfX.profile.activityStatus.error);
                next(null, { success: false, info: "not able to find data from db" });
                return;
            }

            if (validateUserResponse.success) {
                const hostPortData = await this.getHostAndPort({
                    self: self,
                    deviceType: msg.deviceType,
                    connector: connectors,
                    playerId: validateUserResponse.user.playerId
                });

                if (hostPortData.success) {
                    activityParams.playerId = validateUserResponse.user.playerId;
                    validateUserResponse.user.host = hostPortData.host;
                    validateUserResponse.user.port = hostPortData.port;
                    activityParams.comment = "user login successfully";
                    activityParams.rawResponse = { success: true, user: validateUserResponse.user };
                    activityParams.data = validateUserResponse.user;
                    
                    activity.logUserActivity(
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

                    await adminDB.dailyLoggedInUser(userData);

                    next(null, {
                        success: true,
                        serverVersion: systemConfig.serverVersion,
                        user: validateUserResponse.user,
                        isDecimal: systemConfig.isDecimal,
                        isLeaderBoard: systemConfig.isLeaderBoard,
                        isSpinTheWheel: systemConfig.spinTheWheel,
                        isNewYearBanner: systemConfig.isNewYearBanner
                    });
                } else {
                    activityParams.comment = "user not found";
                    activityParams.rawResponse = hostPortData;
                    activity.logUserActivity(activityParams, activityCategory, activitySubCategory, stateOfX.profile.activityStatus.error);
                    next(null, hostPortData);
                }
            } else {
                activityParams.comment = validateUserResponse.info;
                activityParams.rawResponse = validateUserResponse.info;
                activity.logUserActivity(activityParams, activityCategory, activitySubCategory, stateOfX.profile.activityStatus.error);
                next(null, { success: false, isDisplay: false, info: validateUserResponse.info });
            }
        } else if (msg.loginMode.toLowerCase() === 'facebook' || msg.loginMode.toLowerCase() === 'google') {
            const profile = await self.app.rpc.database.dbRemote.createProfile(self.session, msg);

            if (!profile) {
                activityParams.comment = "not able to find data from db for socialLogin";
                activityParams.rawResponse = { success: false, info: "not able to find data from db for socialLogin" };
                activity.logUserActivity(activityParams, activityCategory, activitySubCategory, stateOfX.profile.activityStatus.error);
                next(null, { success: false, info: "not able to find data from db for socialLogin" });
                return;
            }

            if (profile.success) {
                const hostPortData = await this.getHostAndPort({
                    self: self,
                    deviceType: msg.deviceType,
                    connector: connectors,
                    playerId: profile.user.playerId
                });

                if (hostPortData.success) {
                    profile.user.host = hostPortData.host;
                    profile.user.port = hostPortData.port;
                    activityParams.comment = "user login successfully";
                    activityParams.rawResponse = { success: true, user: profile.user };
                    activityParams.playerId = profile.user.playerId;
                    activityParams.data = profile.user;
                    activity.logUserActivity(activityParams, activityCategory, activitySubCategory, stateOfX.profile.activityStatus.completed);
                    next(null, { success: true, serverVersion: systemConfig.serverVersion, user: profile.user });
                } else {
                    activityParams.comment = "error in creating user";
                    activityParams.rawResponse = hostPortData;
                    activity.logUserActivity(activityParams, activityCategory, activitySubCategory, stateOfX.profile.activityStatus.error);
                    next(null, hostPortData);
                }
            } else {
                activityParams.comment = "error in creating user";
                activityParams.rawResponse = profile;
                activity.logUserActivity(activityParams, activityCategory, activitySubCategory, stateOfX.profile.activityStatus.error);
                next(null, { success: false, info: profile.info });
            }
        } else {
            activityParams.comment = "unknown loginMode";
            activityParams.rawResponse = { success: false, info: "unknown loginMode" };
            activity.logUserActivity(activityParams, activityCategory, activitySubCategory, stateOfX.profile.activityStatus.error);
            next(null, { 
                success: false, 
                isRetry: false, 
                isDisplay: false, 
                channelId: "", 
                info: popupTextManager.falseMessages.GETCONNECTOR_UNKNOWNLOGIN_GATEHANDLER 
            });
        }
    }

    private async handleRegistration(
        msg: any,
        self: GateHandler,
        connectors: any[],
        activityParams: any,
        activityCategory: string,
        activitySubCategory: string,
        next: (err: any, data?: any) => void
    ): Promise<void> {
        if (!msg.userName && !msg.emailId || !msg.password) {
            next(null, { 
                success: false, 
                isRetry: false, 
                isDisplay: false, 
                channelId: "", 
                info: popupTextManager.falseMessages.GETCONNECTOR_MINREQFIELDERROR_GATEHANDLER 
            });
            return;
        }

        if (!this.validatePassword(msg.password)) {
            next(null, { 
                success: false, 
                isRetry: false, 
                isDisplay: false, 
                channelId: "", 
                info: popupTextManager.falseMessages.GETCONNECTOR_INVALIDPASSWORD_GATEHANDLER 
            });
            return;
        }

        if (!this.validateUserName(msg.userName)) {
            next(null, { 
                success: false, 
                isRetry: false, 
                isDisplay: false, 
                channelId: "", 
                info: popupTextManager.falseMessages.GETCONNECTOR_USERNAMEERROR_GATEHANDLER 
            });
            return;
        }

        if (!this.validateEmail(msg.emailId)) {
            next(null, { 
                success: false, 
                isRetry: false, 
                isDisplay: false, 
                channelId: "", 
                info: popupTextManager.falseMessages.GETCONNECTOR_INVALIDEMAIL_GATEHANDLER 
            });
            return;
        }

        const createdProfile = await self.app.rpc.database.dbRemote.createProfile(self.session, msg);

        if (!createdProfile) {
            activityParams.comment = "not able to create user in db";
            activityParams.rawResponse = { success: false, info: "not able to create user in db" };
            activity.logUserActivity(activityParams, activityCategory, activitySubCategory, stateOfX.profile.activityStatus.error);
            next({ 
                success: false, 
                isRetry: false, 
                isDisplay: false, 
                channelId: "", 
                info: popupTextManager.falseMessages.GETCONNECTOR_UNABLETOCREATEUSER_GATEHANDLER 
            });
            return;
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

                sharedModule.sendMailWithHtml(params, (mailSentResponse) => {
                    console.log("mail sent successfully", mailSentResponse);
                });
            }

            const hostPortData = await this.getHostAndPort({
                self: self,
                deviceType: msg.deviceType,
                connector: connectors,
                playerId: createdProfile.user.playerId
            });

            if (hostPortData.success) {
                createdProfile.user.host = hostPortData.host;
                createdProfile.user.port = hostPortData.port;
                activityParams.comment = "profile created successfully";
                activityParams.rawResponse = { success: true, info: createdProfile.user };
                activityParams.playerId = createdProfile.user.playerId;
                activityParams.data = createdProfile.user;
                activity.logUserActivity(activityParams, activityCategory, stateOfX.profile.subCategory.signUp, stateOfX.profile.activityStatus.completed);

                await adminDB.dailyLoggedInUser({
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

                next(null, {
                    success: true, 
                    serverVersion: systemConfig.serverVersion,
                    user: createdProfile.user,
                    isDecimal: systemConfig.isDecimal,
                    isLeaderBoard: systemConfig.isLeaderBoard,
                    isSpinTheWheel: systemConfig.spinTheWheel,
                    isNewYearBanner: systemConfig.isNewYearBanner
                });
            } else {
                activityParams.comment = "not able to find suitable connector";
                activityParams.rawResponse = { success: false, info: hostPortData };
                activity.logUserActivity(activityParams, activityCategory, activitySubCategory, stateOfX.profile.activityStatus.error);
                next(null, hostPortData);
            }
        } else {
            activityParams.comment = createdProfile.info;
            activityParams.rawResponse = { success: false, info: createdProfile.info };
            activity.logUserActivity(activityParams, activityCategory, activitySubCategory, stateOfX.profile.activityStatus.error);
            next(null, { 
                success: false, 
                info: createdProfile.info, 
                suggestions: createdProfile.suggestions, 
                code: 409 
            });
        }
    }

    private async getHostAndPort(params: {
        self: GateHandler,
        deviceType: string,
        connector: any[],
        playerId: string
    }): Promise<any> {
        console.log("in gate-------------", params.playerId);
        if (params.deviceType === "website") {
            return { success: true, host: "", port: 0 };
        }

        const validated = await keyValidator.validateKeySets(
            "Request", 
            params.self.app.serverType, 
            "getHostAndPort", 
            params
        );

        if (!validated.success) {
            return validated;
        }

        try {
            const response = await params.self.app.rpc.database.dbRemote.findUserSessionInDB(
                params.self.session, 
                params.playerId
            );

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

            const res = dispatcher.dispatch(params.playerId, params.connector);
            await params.self.app.rpc.database.dbRemote.insertUserSessionInDB(
                params.self.session, 
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