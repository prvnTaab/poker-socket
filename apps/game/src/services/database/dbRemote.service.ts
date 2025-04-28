import { Injectable } from "@nestjs/common";


import { PokerDatebaseService } from "shared/common/datebase/pokerdatebase.service.js";
import { ImdbDatebaseService } from "shared/common/datebase/Imdbdatebase.service copy.js";
import _ from "underscore";
import _ld from "lodash";
import async from 'async';
import { v4 as uuid } from "uuid";
import { stateOfX, systemConfig , popupTextManager, convertIntToDecimal, encrypt, decrypt, sendMailWithHtml} from "shared/common";
import { UserRemoteService } from "./userRemote.service";
import { ResponseHandlerService } from "./responseHandler.service";

// import shortid from 'shortid32';
import { walletQueryService } from "../../utils/walletQuery.service";
import { validateKeySets } from "shared/common/utils/activity";
// shortid.characters('QWERTYUIOPASDFGHJKLZXCVBNM012345');


@Injectable()
export class DbRemoteService {
    constructor(private db : PokerDatebaseService,
        private imdb : ImdbDatebaseService,
        private userRemote : UserRemoteService,
        private responseHandler : ResponseHandlerService, 
        private wallet : walletQueryService
    ){
    }

  /**
   * create unique id of given length
   */
  createUniqueId(length: number): string {
    let text = "";
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  /**
   * create suggestions for user ids
   * @deprecated old feature
   */
    async generateUserIds(playerId: string): Promise<any>{
    const userIds = [];
    const uniqueUserIds: string[] = [];
    
    for (let i = 0; i < 50; i++) {
      const tempUserId = {
        playerId: playerId + this.createUniqueId(4)
      };
      userIds.push(tempUserId);
    }

    for (const userIdObject of userIds) {
      try {
        const user = await this.db.findUser({ playerId: userIdObject.playerId });
        if (!user && uniqueUserIds.length < 6) {
          uniqueUserIds.push(userIdObject.playerId);
        }
      } catch (err) {
        console.log('db remote ', err)
      }
    }

    return uniqueUserIds;
  }

  // Format user response at the time of login/signUp
   async formatUser(user: any): Promise<any> {
    console.log('formattedUser', user);

    if (typeof user.realMoneyFlag == 'undefined') {
      user.realMoneyFlag = true;
    }

    const topUpDetails = {
      isTopupAllow: user.isTopupAllow || false,
      topupLimit: user.topupLimit || 0,
      creditAvailable: user.availableCredit || 0
    };

    const userData: any = {
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      emailId: user.emailId || "",
      playerId: user.playerId,
      byPassIp: user.byPassIp || false,
      userName: user.userName || "",
      profileImage: user.profileImage || "",
      prefrences: user.prefrences || "",
      settings: user.settings || "",
      isEmailVerified: user.isEmailVerified,
      isOrganic: user.isOrganic,
      isMobileNumberVerified: user.isMobileNumberVerified,
      dailyBonusCollectionTime: user.dailyBonusCollectionTime,
      freeChips: user.freeChips,
      realChips: user.realChips,
      realChipBonus: user.realChipBonus, // RCB
      totalBalance: convertIntToDecimal(user.realChips + user.realChipBonus), // Bonus Point
      topUp: topUpDetails,
      isMuckHand: user.isMuckHand,
      ipV4Address: user.ipV4Address,
      address: user.address,
      gender: user.gender,
      deviceType: user.deviceType,
      realMoneyFlag: user.realMoneyFlag,
      dateOfBirth: user.dateOfBirth,
      mobileNumber: user.mobileNumber,
      isParentUserName: user.isParentUserName,
      isParent: user.isParent,
      loyalityRakeLevel: user.loyalityRakeLevel || 0,
      panNumber: decrypt(user.panNumber).result,
      panNumberVerified: user.panNumberVerified || false,
      panNumberVerifiedFailed: user.panNumberVerifiedFailed || false,
      panNumberNameVerifiedFailed: user.panNumberNameVerifiedFailed || false,
      panNumberNameSelfVerified: user.panNumberNameSelfVerified || false,
      letter: user.letter || [false, false],
      offers: user.offers || [false, false],
      tournaments: user.tournaments || [false, false],
      anouncement: user.anouncement || [false, false],
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      statistics: user.statistics,
      tournamentsPlayed: 0,
      tournamentsEarnings: 0,
      unclamedBonus: user.unclamedBonus || 0,
      emailVerificationToken: user.emailVerificationToken || 0,
      isKYCVerified: user.isKYCVerified,
      spinActivate: user.spinActivate
    };

    await this.updateMegaPointsPercent(userData);
    await this.unclaimedBonusData(userData);
    
    return userData;
  }

 async getTopupDetails(params: any): Promise<any> {
    try {
      const creditResult = await this.findCreditTopup(params);
      const debitResult = await this.findDebitTopup(creditResult);
      return this.topUpCalculation(debitResult);
    } catch (err) {
      return params;
    }
  }

   async findCreditTopup(params: any): Promise<any> {
    const query = { userName: params.userName, type: 'credit' };
    const res = await this.db.getTopupSum(query);
    if (res.length > 0 && res[0].totalAmount) {
      params.totalCrAmount = res[0].totalAmount;
    }
    return params;
  }

   async findDebitTopup(params: any): Promise<any> {
    const query = { userName: params.userName, type: 'debit' };
    const res = await this.db.getTopupSum(query);
    if (res.length > 0 && res[0].totalAmount) {
      params.totalDrAmount = res[0].totalAmount;
    }
    return params;
  }

   topUpCalculation(params: any): any {
    if (params.topupLimit) {
      params.totalDrAmount = params.totalDrAmount || 0;
      params.totalCrAmount = params.totalCrAmount || 0;
      params.availableCredit = params.topupLimit - params.totalCrAmount + params.totalDrAmount;
      params.totalCreditUsed = params.totalCrAmount - params.totalDrAmount;
    }
    return params;
  }

  /**
   * update players megapoint percent acc to new/old user
   * may be start with 0 megapoints, hence first level bronze
   */
   async updateMegaPointsPercent(userData: any): Promise<void> {
    try {
      const res = await this.db.findAllLoyaltyPoints({});
      userData.statistics.megaPointsPercent = this.getLevelPercent(userData.statistics.megaPoints, res);
      userData.statistics.megaPointLevel = this.getLevelName(userData.statistics.megaPointLevel, res);
    } catch (err) {
        console.log('response of findAllMegaPointLevels', err);
    }
  }

   getLevelName(levelId: number, levels: any[]): string {
    const t = _.findWhere(levels, { levelId: levelId }) || levels[0];
    return t && t.loyaltyLevel || "Bronze";
  }

   getLevelPercent(points: number, levels: any[]): number {
    if (points <= 0 || levels.length <= 0) return 0;

    function calculator(arr: any[], value: number): number {
      let i = 0;
      for (; i < arr.length; i++) {
        if (arr[i].levelThreshold > value) break;
      }
      if (i >= arr.length) return 101;
      return (100 * (value - arr[i - 1].levelThreshold) / (arr[i].levelThreshold - arr[i - 1].levelThreshold));
    }

    const c = calculator(levels, points);
    return Math.floor(c * 100) / 100 || 0;
  }

  /**
   * get total unclaimed bonus data
   */
   async unclaimedBonusData(userData: any): Promise<void> {
    try {
      const query = { playerId: userData.playerId };
      const res = await this.db.findBounsData(query);
      if (res) {
        userData.unclamedBonus = res.bonus.reduce((sum: number, bonus: any) => sum + bonus.unClaimedBonus, 0);
      } else {
        userData.unclamedBonus = 0;
      }
    } catch (err) {
      userData.unclamedBonus = 0;
    }
  }

  /**
   * find user, check if banned or email not verified,
   * decrypt password, if same password in request then able to login
   */
   async findAndModifyUserForValidateUser(msg: any, filterForUser: any, userUpdateKeys: any): Promise<any> {
    try {
      const result = await this.db.findAndModifyUser(filterForUser, userUpdateKeys);
      
      if (!result.value) {
        return { success: false, isRetry: false, isDisplay: false, channelId: "", info: popupTextManager.dbQyeryInfo.DB_USERNAME_PASSWORD_INCORRECT };
      }

      const user = result.value;

      if (user.isBlocked) {
        if (!user.isEmailVerified) {
          return { success: false, isRetry: false, isDisplay: true, channelId: "", info: popupTextManager.dbQyeryInfo.DB_PLAYER_EMAIL_NOT_VERIFIED };
        }
        return { success: false, isRetry: false, isDisplay: true, channelId: "", info: popupTextManager.dbQyeryInfo.DB_BLOCK_USER_BY_ADMIN };
      }

      const decryptPassword = decrypt(user.password);
      if (!decryptPassword.success) {
        return { success: false, info: "error in decrypting password", isRetry: false, isDisplay: false, channelId: "" };
      }

      if (msg.password !== decryptPassword.result) {
        return { success: false, isRetry: false, isDisplay: false, channelId: "", info: popupTextManager.dbQyeryInfo.DB_INVALID_PASSWORD };
      }

      const topupDetails = await this.getTopupDetails(user);
      const formattedUser = await this.formatUser(topupDetails);
      
      // Added for lobby header text for IOS instant play
      const LobbyTextQuery = {};
      formattedUser.captionText = null;
      const lobbyTextResult = await this.db.listLobbyText(LobbyTextQuery);
      formattedUser.captionText = lobbyTextResult;

      return { success: true, user: formattedUser };
    } catch (err) {
      return { success: false, isRetry: false, isDisplay: false, channelId: "", info: popupTextManager.dbQyeryInfo.DB_ERROR_FINDING_USER };
    }
  }

   getRandomInt(max: number): number {
    return Math.ceil(Math.random() * Math.floor(max));
  }

  // This function will called only when normal users are trying to logged in not for social login
  async validateUser(msg: any): Promise<any> {
    if (!msg) return;

    const userUpdateKeys: any = {
      ipV4Address: msg.ipV4Address,
      ipV6Address: msg.ipV6Address,
      lastLogin: Number(new Date())
    };

    const filterForUser: any = {};
    if (msg.userName) {
      filterForUser.userName = eval('/^' + msg.userName + '$/i');
    }
    if (msg.emailId) {
      filterForUser.emailId = msg.emailId;
    }

    return this.findAndModifyUserForValidateUser(msg, filterForUser, userUpdateKeys);
  }

  // Helper functions for user creation
    setFirstName(dataOfUser: any): string { return dataOfUser?.firstName || ""; }
    setLastName(dataOfUser: any): string { return dataOfUser?.lastName || ""; }
    setGender(dataOfUser: any): string { return dataOfUser?.gender || ""; }
    setDateOfBirth(dataOfUser: any): any { return dataOfUser?.dateOfBirth || ""; }
    setEmailId(dataOfUser: any): string { return dataOfUser?.emailId || ""; }
    setMobileNumber(dataOfUser: any): string { return dataOfUser?.mobileNumber || ""; }
    setUserName(dataOfUser: any): string { return dataOfUser?.userName || ""; }
    setIpV4Address(dataOfUser: any): string { return dataOfUser?.ipV4Address || ""; }
    setIpV6Address(dataOfUser: any): string { return dataOfUser?.ipV6Address || ""; }
    setProfileImage(dataOfUser: any): number { return dataOfUser?.profileImage || this.getRandomInt(15); }
    setDeviceType(dataOfUser: any): string { return dataOfUser?.deviceType || ""; }
    setLoginMode(dataOfUser: any): string { return dataOfUser?.loginMode || ""; }
    setGoogleObject(dataOfUser: any): any { return dataOfUser?.googleObject || ""; }
    setFacebookObject(dataOfUser: any): any { return dataOfUser?.facebookObject || ""; }

   async checkAffiliateDetails(paramsData: any): Promise<any> {
    if (!paramsData.isParentUserName) return paramsData;

    try {
      const affilate = await this.db.getUser({ userName: eval('/^' + paramsData.isParentUserName + '$/i') });
      if (!affilate) {
        return { success: false, info: 'Affilate does not exist.', isDisplay: true };
      }

      paramsData.isParent = '';
      if (affilate.role.level == 0) {
        paramsData.parentType = 'AFFILIATE';
        paramsData.isParentUserName = affilate.userName;
      }
      if (affilate.role.level == -1) {
        paramsData.parentType = 'SUB-AFFILIATE';
        paramsData.isParentUserName = affilate.userName;
      }

      return paramsData;
    } catch (err) {
      return { success: false, info: 'Db Error in getting user', isDisplay: true };
    }
  }

   async checkSignUPBonus(params: any): Promise<any> {
    if (!params.bonusCode) return params;

    try {
      const query = { codeName: params.bonusCode, type: 'signUp', 'status': 'true' };
      const result = await this.db.findBonus(query);
      
      if (result.length === 0) {
        return { success: false, info: 'Bonus code does not exist.', isDisplay: true };
      }

      const currentTime = Number(new Date());
      const expiresOndate = result[0].validTill;
      
      if (this.convertDateToMidnight(expiresOndate) < this.convertDateToMidnight(currentTime)) {
        return { success: false, info: 'Bonus Code Expired', isDisplay: true };
      }

      params.rcbAmount = this.setPercent(result[0].bonusAmount) * this.setPercent(result[0].rcbPercent) / 100;
      params.ucbAmount = this.setPercent(result[0].bonusAmount) * this.setPercent(result[0].ucbPercent) / 100;
      params.bonusData = result[0];
      return params;
    } catch (err) {
      return { success: false, info: 'Database issues', isDisplay: true };
    }
  }

   async updateBonusUsed(bonusCode: string): Promise<void> {
    if (!bonusCode) return;

    try {
      const query = { codeName: bonusCode, type: 'signUp', 'status': 'true' };
      const result = await this.db.findBonus(query);
      
      if (result.length > 0 && result[0].codeName === bonusCode) {
        const updateQuery = { codeName: bonusCode };
        const dataForUpdate = { totalUsed: result[0].totalUsed + 1 };
        await this.db.updateBonus(updateQuery, dataForUpdate);
      }
    } catch (err) {
      // Handle error silently
    }
  }

   setPercent(dataOfBonus: any): number {
    return dataOfBonus || 0;
  }

   convertDateToMidnight(dateToConvert: number): number {
    const date = new Date(dateToConvert);
    date.setHours(0, 0, 0, 0);
    return Number(date);
  }

  // Create data for user at signup
   async createDataForUser(dataOfUser: any): Promise<any> {
    
    const userObject: any = {};
    const address = {
      pincode: "",
      city: "",
      state: "",
      address2: "",
      address1: ""
    };
    
    const statistics = {
      bestHand: "",
      handsPlayedRM: 0,
      handsPlayedPM: 0,
      handsWonRM: 0,
      handsWonPM: 0,
      handsLost: 0,
      megaPoints: 0,
      megaPointLevel: 1,
      countPointsToChips: 0,
      countPointsForBonus: 0
    };
    
    const prefrences = {
      tableLayout: "",
      autoBuyIn: "",
      autoBuyInAmountInPercent: "",
      cardColor: false
    };
    
    const settings = {
      seatPrefrence: 1,
      seatPrefrenceTwo: 1,
      seatPrefrenceSix: 1,
      muteGameSound: false,
      dealerChat: true,
      playerChat: true,
      runItTwice: false,
      avatarId: 1,
      tableColor: ""
    };
    
    const chipsManagement = {
      deposit: 0,
      withdrawl: 0,
      withdrawlPercent: 5,
      withdrawlCount: 0,
      withdrawlDate: Number(new Date())
    };

    const encryptPass = encrypt(dataOfUser.password);
    if (!encryptPass.success) {
      return { success: false };
    }

    userObject.password = encryptPass.result;
    userObject.firstName = this.setFirstName(dataOfUser);
    userObject.lastName = this.setLastName(dataOfUser);
    userObject.gender = this.setGender(dataOfUser);
    userObject.dateOfBirth = this.setDateOfBirth(dataOfUser);
    userObject.emailId = this.setEmailId(dataOfUser);
    userObject.mobileNumber = this.setMobileNumber(dataOfUser);
    userObject.userName = this.setUserName(dataOfUser);
    userObject.ipV4Address = this.setIpV4Address(dataOfUser);
    userObject.ipV6Address = this.setIpV6Address(dataOfUser);
    userObject.profileImage = this.setProfileImage(dataOfUser);
    userObject.deviceType = this.setDeviceType(dataOfUser);
    userObject.realMoneyFlag = true;
    
    if (userObject.deviceType == 'iosApp') {
      userObject.realMoneyFlag = false;
    }
    
    userObject.loginMode = this.setLoginMode(dataOfUser);
    userObject.googleObject = this.setGoogleObject(dataOfUser);
    userObject.facebookObject = this.setFacebookObject(dataOfUser);
    userObject.isParent = dataOfUser.isParent || "";
    userObject.isParentUserName = dataOfUser.isParentUserName || "";
    userObject.parentType = dataOfUser.parentType || "";
    userObject.playerId = uuid();
    userObject.createdAt = Number(new Date());
    userObject.address = address;
    userObject.statistics = statistics;
    userObject.prefrences = prefrences;
    userObject.settings = settings;
    userObject.isEmailVerified = false;
    userObject.isMobileNumberVerified = true;
    userObject.isNewUser = true;
    userObject.isBlocked = false;
    userObject.isMuckHand = false;
    userObject.dailyBonusCollectionTime = Number(new Date());
    userObject.previousBonusCollectedTime = 0;
    userObject.panNumber = "";
    userObject.lastLogin = Number(new Date());
    userObject.profilelastUpdated = "";
    userObject.points = [
      {
        "coinType": 1,
        "deposit": 0,
        "win": 0,
        "promo": dataOfUser.rcbAmount || 0,
        "totalBalance": dataOfUser.rcbAmount || 0,
        "updatedAt": Number(new Date())
      },
      {
        "coinType": 2,
        "deposit": 0,
        "win": 0,
        "promo": 50000,
        "totalBalance": 50000,
        "updatedAt": Number(new Date())
      },
      {
        "coinType": 3,
        "deposit": 0,
        "win": 0,
        "promo": dataOfUser.ucbAmount || 0,
        "totalBalance": dataOfUser.ucbAmount || 0,
        "updatedAt": Number(new Date())
      },
      {
        "coinType": 4,
        "deposit": 0,
        "win": 0,
        "promo": 0,
        "totalBalance": 0,
        "updatedAt": Number(new Date())
      },
    ];
    userObject.topupLimit = 0;
    userObject.isTopupAllow = false;
    userObject.passwordResetToken = "";
    userObject.isResetPasswordTokenExpire = "";
    userObject.emailVerificationToken = "";
    userObject.isEmailVerificationTokenExpire = "";
    userObject.loyalityRakeLevel = 0;
    userObject.isBot = !!dataOfUser.isBot;
    userObject.panNumberVerified = false;
    userObject.panNumberVerifiedFailed = false;
    userObject.panNumberNameVerifiedFailed = false;
    userObject.panNumberNameSelfVerified = false;
    userObject.offers = [false, false];
    userObject.tournaments = [false, false];
    userObject.letter = [false, false];
    userObject.anouncement = [false, false];
    userObject.chipsManagement = chipsManagement;
    userObject.isOrganic = true;
    userObject.rakeBack = 0;
    userObject.status = 'Active';
    userObject.signupBonus = dataOfUser.bonusCode;
    userObject.isKYCVerified = false;

    return { success: true, result: userObject };
  }

   async existingUser(filter: any, filterForUser: any, user: any): Promise<any> {
    let infoMessage;
    
    if (filter.loginType.toLowerCase() === 'registration' && filter.loginMode.toLowerCase() === 'normal') {
      if (user.emailId && filterForUser.emailId === user.emailId) {
        infoMessage = "Email ID already exists. Please try with a different email address.";
      } else if (user.mobileNumber && filterForUser.mobileNumber === user.mobileNumber) {
        infoMessage = "Mobile number already Exists try with different mobile number";
      } else {
        infoMessage = "userName already Exists try with different playerId";
      }

      if (user.userName && filterForUser.userName && user.userName === filterForUser.userName) {
        const userIds = await this.generateUserIds(filter.userName);
        return { success: false, info: infoMessage, suggestions: userIds };
      }
      return { success: false, info: infoMessage };
    } else {
      if (user.isBlocked) {
        if (!user.isEmailVerified) {
          return { success: false, isRetry: false, isDisplay: true, channelId: "", info: popupTextManager.dbQyeryInfo.DB_PLAYER_EMAIL_NOT_VERIFIED };
        }
        return { success: false, isRetry: false, isDisplay: true, channelId: "", info: popupTextManager.dbQyeryInfo.DB_BLOCK_USER_BY_ADMIN };
      }

      const userUpdateKeys = {
        ipV4Address: filter.ipV4Address,
        ipV6Address: filter.ipV6Address,
        lastLogin: Number(new Date())
      };

      const dataForWallet = {
        action: 'updateUser',
        data: {
          filter: { userName: filter.userName },
          updateKeys: userUpdateKeys
        }
      };

      const walletResponse = await this.wallet.sendWalletBroadCast(dataForWallet);
      if (!walletResponse?.success) {
        return { success: false, isRetry: false, isDisplay: false, channelId: "", info: popupTextManager.dbQyeryInfo.DB_ERROR_UPDATE_FAILED_USER };
      }

      const formattedUser = await this.formatUser(walletResponse.data);
      return { success: true, user: formattedUser };
    }
  }

   async newUser(filter: any, filterForUser: any, user: any): Promise<any> {
    try {
      const affiliateCheck = await this.checkAffiliateDetails(filter);
      if (!affiliateCheck.success) return affiliateCheck;

      const bonusCheck = await this.checkSignUPBonus(affiliateCheck);
      if (!bonusCheck.success) return bonusCheck;

      const userData = await this.createDataForUser(bonusCheck);
      if (!userData.success) {
        return { success: false, isRetry: false, isDisplay: false, channelId: "", info: popupTextManager.falseMessages.ERROR_DECRYPTING_PASSWORD };
      }

      const userObj = userData.result;
      const emailVerificationToken = this.createUniqueId(10);
      userObj.emailVerificationToken = emailVerificationToken;

      const createdUser = await this.db.createUser(userObj);
      if (!createdUser) {
        return { success: false, isRetry: false, isDisplay: false, channelId: "", info: popupTextManager.dbQyeryInfo.DB_ERROR_CREATE_USERDOCUMENT };
      }

      const bonusDataofThisUser = {
        playerId: createdUser.playerId,
        bonus: []
      };

      if (createdUser.realChipBonus || createdUser.unClaimedChipBonus) {
        bonusDataofThisUser.bonus.push({
          createdAt: Number(new Date()),
          name: "SIGNUP BONUS",
          realChipBonus: createdUser.realChipBonus || 0,
          unClaimedBonus: createdUser.unClaimedChipBonus || 0
        });
      }

      await this.db.createBonusData(bonusDataofThisUser);
      await this.updateBonusUsed(filter.bonusCode);

      if (filter.bonusData) {
        const year = new Date().getFullYear();
        const month = new Date().getMonth();
        const day = new Date().getDate() + (filter.bonusData.ucbExpiry || 0);

        const bonusData = {
          playerId: userObj.playerId,
          userName: userObj.userName,
          name: filter.bonusData.bonusCodeType.name,
          type: "SIGNUP BONUS",
          codeName: filter.bonusData.codeName,
          bonusAmount: filter.bonusData.bonusAmount || 0,
          realChipBonus: this.setPercent(filter.bonusData.bonusAmount) * this.setPercent(filter.bonusData.rcbPercent) / 100 || 0,
          unClaimedBonus: this.setPercent(filter.bonusData.bonusAmount) * this.setPercent(filter.bonusData.ucbPercent) / 100 || 0,
          ucbReceived: this.setPercent(filter.bonusData.bonusAmount) * this.setPercent(filter.bonusData.ucbPercent) / 100 || 0,
          ucbExpiryDate: Number(new Date(year, month, day)),
          instantbonus: 0,
          amountDeposited: 0,
          totalBonusAmount: convertIntToDecimal(this.setPercent(filter.bonusData.bonusAmount) * this.setPercent(filter.bonusData.rcbPercent) / 100) + 
          convertIntToDecimal(this.setPercent(filter.bonusData.bonusAmount) * this.setPercent(filter.bonusData.ucbPercent) / 100) + 0,
          createdAt: Number(new Date()),
          status: "Active",
          ucbClaimed: 0
        };

        await this.db.addBonusHistory(bonusData);

        const mailData = {
          to_email: userObj.emailId,
          from_email: systemConfig.from_email,
          subject: 'Welcome To ' + systemConfig.originalName,
          template: 'signupwithBonus',
          content: {
            userName: bonusData.userName,
            amount: bonusData.totalBonusAmount,
          }
        };

       let result = await sendMailWithHtml(mailData)
      }

      const formattedUser = await this.formatUser(createdUser);
      if (this.userRemote.afterUserCreated instanceof Function) {
        this.userRemote.afterUserCreated(createdUser);
      }

      return { success: true, user: formattedUser };
    } catch (err) {
      return { success: false, isRetry: false, isDisplay: false, channelId: "", info: popupTextManager.dbQyeryInfo.DB_ERROR_CREATE_USERDOCUMENT };
    }
  }

   async findUserOrOperation(filter: any, filterForUser: any): Promise<any> {
    try {
      const user = await this.db.validateUserAtRegisteration(filterForUser);
      if (!user) {
        if (filterForUser.mobileNumber) {
          const mobileOTPResult = await this.checkMobileNumberOTP(filter);
          if (!mobileOTPResult.success) return mobileOTPResult;
        }
        return this.newUser(filter, filterForUser, user);
      }
      return this.existingUser(filter, filterForUser, user);
    } catch (err) {
      return { success: false, isRetry: false, isDisplay: false, channelId: "", info: popupTextManager.dbQyeryInfo.DBFINDUSER_VALIDATEKEYSETS_SENDOTP_USERCONTROLLER_USER };
    }
  }

   async checkMobileNumberOTP(mobileOTPResult: any): Promise<any> {
    try {
      const result = await this.db.findMobileNumber({ mobileNumber: mobileOTPResult.mobileNumber });
      if (!result) {
        return { success: false, info: "OTP doesn't match." };
      }

      const currentTime = Number(new Date());
      if (mobileOTPResult.mobileNumber === result.mobileNumber && 
          mobileOTPResult.regotp === result.otp.toString() && 
          (currentTime - result.createdAt) <= (60 * 5000)) {
        return { success: true };
      }
      return { success: false, info: "OTP doesn't match." };
    } catch (err) {
      return { success: false, info: "Database error" };
    }
  }

  async createProfile(filter: any): Promise<any> {
    console.error(stateOfX.serverLogType.info, "data of user getting from client in create profile in dbRemote - " + JSON.stringify(filter));
    if (!filter.userName && !filter.emailId) {
      return { success: false, info: "username or emailId is required" };
    }

    const filterForUser: any = {};
    if (filter.userName) filterForUser.userName = eval('/^' + filter.userName + '$/i');
    if (filter.emailId) filterForUser.emailId = filter.emailId;
    if (filter.mobileNumber) filterForUser.mobileNumber = filter.mobileNumber;
    if (filter.bonusCode) filterForUser.bonusCode = filter.previousBonusCollectedTime;

    try {
      const user = await this.db.findUserOrOperation(filterForUser);
      if (user) {
        return { success: false, info: "User With same Details Exists" };
      }
      return this.findUserOrOperation(filter, filterForUser);
    } catch (err) {
      return { success: false, info: "Please try again!!" };
    }
  }

   async getTablesForNormalGamesWithCount(params: any): Promise<any> {
    if (params.allTables[0]?.channelType === "NORMAL") {
      for (const table of params.allTables) {
        try {
          const result = await this.imdb.getTable(table.channelId);
          if (result) {
            table.playingPlayers = result.players.length;
            table.queuePlayers = result.queueList.length;
          } else {
            table.playingPlayers = 0;
            table.queuePlayers = 0;
          }
        } catch (err) {
          return { success: false, isRetry: false, isDisplay: false, channelId: "", info: popupTextManager.dbQyeryInfo.DB_ERROR_GETTING_MEMORY };
        }
      }
    }
    return params;
  }

   async getEnrolledPlayersInTounaments(params: any): Promise<any> {
    if (params.allTables[0]?.channelType === "TOURNAMENT") {
      for (let i = 0; i < params.allTables.length; i++) {
        const room = params.allTables[i];
        try {
          const filter = { gameVersionCount: room.gameVersionCount, status: "Registered" };
          const result = await this.db.countTournamentusers(filter);
          
          params.allTables[i]["enrolledPlayers"] = result;
          params.allTables[i]["prizePool"] = room.isGuaranteed ? 
            room.guaranteedAmount : 
            room.entryFees * room.maxPlayers;
          
          params.allTables[i]["runningFor"] = room.state === stateOfX.gameState.running ? 
            Number(new Date()) - room.tournamentStartTime : 
            0;
        } catch (err) {
          return { success: false, info: "Error in count tournament users", isRetry: false, isDisplay: false, channelId: "" };
        }
      }
    }
    return params;
  }

   async listTable(params: any): Promise<any> {
    try {
      const result = await this.db.listTable(_.omit(params, "playerId"));
      params.allTables = result;
      return params;
    } catch (err) {
      return { success: false, isRetry: false, isDisplay: true, channelId: "", info: popupTextManager.dbQyeryInfo.DB_ERROR_SOMETHING_WRONG_TABLE };
    }
  }

   async resetAvgPotandFlopPercentValues(params: any): Promise<any> {
    for (const table of params.allTables) {
      table.avgStack = table.avgStack || 0;
      table.flopPercent = table.flopPercent || 0;
    }
    return params;
  }

   async removeExtraKeys(params: any): Promise<any> {
    for (let i = 0; i < params.allTables.length; i++) {
      const table = params.allTables[i];
      if (table.channelVariation !== stateOfX.channelVariation.ofc) {
        params.allTables[i] = _.omit(table, 
          "isStraddleEnable", "numberOfRebuyAllowed", "hourLimitForRebuy", "rebuyHourFactor", 
          "gameInfo", "gameInterval", "blindMissed", "rakeRule", "isActive", "totalGame", 
          "totalPot", "avgPot", "totalPlayer", "totalFlopPlayer", "avgFlopPercent", 
          "totalStack", "gameInfoString", "createdAt", "updatedBy", "updatedAt", "rake", "createdBy");
      } else {
        params.allTables[i] = _.omit(table,
          "smallBlind", "bigBlind", "flopPercent", "avgStack", "minPlayers", 
          "isStraddleEnable", "numberOfRebuyAllowed", "hourLimitForRebuy", "rebuyHourFactor", 
          "gameInfo", "gameInterval", "blindMissed", "rakeRule", "isActive", "totalGame", 
          "totalPot", "avgPot", "totalPlayer", "totalFlopPlayer", "avgFlopPercent", 
          "totalStack", "gameInfoString", "createdAt", "updatedBy", "updatedAt", "rake", "createdBy");
      }
      params.allTables[i]._id = params.allTables[i].channelId;
    }
    return params;
  }

   async getPlayerFavouriteTables(params: any): Promise<any> {
    try {
      const player = await this.db.findUser({ playerId: params.playerId });
      params.favouriteTables = player?.favourateTable || [];
      return params;
    } catch (err) {
      return { success: false, isRetry: false, isDisplay: true, channelId: "", info: popupTextManager.dbQyeryInfo.DB_ERROR_GETTING_FAVOURITE_SEAT_PLAYER };
    }
  }

   async processingFavouriteTables(params: any): Promise<any> {
    for (const favTable of params.favouriteTables) {
      for (const table of params.allTables) {
        if (favTable.channelId === table.channelId) {
          table.favourite = true;
          break;
        }
      }
    }
    return params;
  }

   async getTableData(params: any): Promise<any> {
    const validated = await validateKeySets("Request", "database", "getTableView", params);
    if (!validated.success) return validated;

    try {
      let table = await this.imdb.getTable(params.channelId);
      if (!table) {
        table = await this.db.findTableById(params.channelId);
        if (!table) {
          return { success: false, isRetry: false, isDisplay: true, channelId: (params.channelId || ""), info: popupTextManager.dbQyeryInfo.DBGETTABLE_GETTABLEVIEW_TABLEREMOTE };
        }
      }
      return this.responseHandler.setTableViewKeys({ table, channelId: params.channelId, playerId: params.playerId });
    } catch (err) {
      return { success: false, isRetry: false, isDisplay: true, channelId: (params.channelId || ""), info: popupTextManager.dbQyeryInfo.DBGETTABLE_GETTABLEVIEW_TABLEREMOTE };
    }
  }

   async insideLobbyData(params: any): Promise<any> {
    params.insideData = {};
    for (const table of params.allTables) {
      try {
        const tableViewResponse = await this.getTableData({ channelId: table._id, playerId: params.playerId });
        delete tableViewResponse.success;
        params.insideData[table._id] = tableViewResponse;
      } catch (err) {
        return { success: false, isRetry: false, isDisplay: false, channelId: "", info: popupTextManager.dbQyeryInfo.DBGETTABLE_GETTABLEVIEW_TABLEREMOTE + JSON.stringify(err) };
      }
    }
    return params;
  }

  async getTablesForGames(msg: any): Promise<any> {
    console.log("got this params", msg);
    const validated = await validateKeySets("Request", "database", "getTablesForGames", msg);
    if (!validated.success) return validated;

    try {
      const result = await async.waterfall([
        async () => this.listTable(msg),
        this.getTablesForNormalGamesWithCount,
        this.getEnrolledPlayersInTounaments,
        this.resetAvgPotandFlopPercentValues,
        this.removeExtraKeys,
        this.getPlayerFavouriteTables,
        this.processingFavouriteTables
      ]);

      return { success: true, result: result.allTables, tableData: result.insideData };
    } catch (err) {
      return err;
    }
  }

  async getQuickSeatTable(msg: any): Promise<any> {
    const validated = await validateKeySets("Request", "database", "getQuickSeatTable", msg);
    if (!validated.success) return validated;

    const query = {
      isRealMoney: msg.isRealMoney,
      channelVariation: msg.channelVariation,
      minBuyIn: { $lte: msg.minBuyIn },
      maxPlayers: msg.maxPlayers,
      channelType: msg.channelType
    };

    try {
      const result = await this.db.quickSeatTable(query);
      return { success: true, result };
    } catch (err) {
      return { success: false, isRetry: false, isDisplay: true, channelId: "", info: popupTextManager.dbQyeryInfo.DB_ERROR_SOMETHING_WRONG_TABLE };
    }
  }

  async getQuickSeatSitNGo(msg: any): Promise<any> {
    const validated = await validateKeySets("Request", "database", "getQuickSeatSitNGo", msg);
    if (!validated.success) return validated;

    const query = {
      isRealMoney: msg.isRealMoney,
      channelVariation: msg.channelVariation,
      buyIn: { $lte: msg.buyIn },
      maxPlayersForTournament: { $lte: msg.maxPlayersForTournament },
      tournamentType: msg.tournamentType
    };

    try {
      const result = await this.db.quickSeatTournament(query);
      return { success: true, result };
    } catch (err) {
      return { success: false, isRetry: false, isDisplay: true, channelId: "", info: popupTextManager.dbQyeryInfo.DB_ERROR_SOMETHING_WRONG_GETTING_TOURNAMENT };
    }
  }

   async addtoFav(playerId: string, channelId: string, favdata: any): Promise<any> {
    try {
      await this.db.addFavourateSeat(playerId, favdata);
      return { success: true, isRetry: false, isDisplay: false, channelId: channelId || "", info: popupTextManager.falseMessages.SUCCESS_ADD_FAVOURATELIST };
    } catch (err) {
      return { success: false, isRetry: false, isDisplay: false, channelId: channelId || " ", info: popupTextManager.dbQyeryInfo.DB_ERROR_SOMETHING_WRONG_GET_LIST };
    }
  }

  async addFavourateSeat(msg: any): Promise<any> {
    const validated = await validateKeySets("Request", "database", "addFavourateSeat", msg);
    if (!validated.success) return validated;

    const favdata = msg.favourateSeat;
    favdata.createdAt = new Date().getTime();

    try {
      const result = await this.db.findUser({ 'playerId': msg.playerId });
      if (result.favourateSeat && result.favourateSeat.length >= systemConfig.favourateSeatCap) {
        return { success: true, channelId: (msg.channelId || ""), info: "You have exceeded the favourite list limit. Please delete some from list.", isRetry: false, isDisplay: false };
      }
      return this.addtoFav(msg.playerId, msg.channelId, favdata);
    } catch (err) {
      return this.addtoFav(msg.playerId, msg.channelId, favdata);
    }
  }

  async removeFavourateSeat(msg: any): Promise<any> {
    const validated = await validateKeySets("Request", "database", "removeFavourateSeat", msg);
    if (!validated.success) return validated;

    try {
      await this.db.removeFavourateSeat(msg.playerId, msg.channelId);
      return { success: true, channelId: msg.channelId, info: "Successfully removed from list", isRetry: false, isDisplay: false };
    } catch (err) {
      return { success: false, channelId: msg.channelId, info: "Something went wrong!! unable to get list", isRetry: false, isDisplay: false };
    }
  }

   async addtoFavTable(playerId: string, channelId: string, favTableData: any): Promise<any> {
    try {
      await this.db.addFavourateTable(playerId, favTableData);
      return { success: true, isRetry: false, isDisplay: false, channelId: channelId || "", info: popupTextManager.falseMessages.SUCCESS_ADD_FAVOURATELIST };
    } catch (err) {
      return { success: false, isRetry: false, isDisplay: false, channelId: "", info: popupTextManager.dbQyeryInfo.DB_ERROR_SOMETHING_WRONG_GET_LIST };
    }
  }

  async addFavourateTable(msg: any): Promise<any> {
    const validated = await validateKeySets("Request", "database", "addFavourateTable", msg);
    if (!validated.success) return validated;

    const favTableData = msg.favourateTable;
    favTableData.createdAt = new Date().getTime();

    try {
      const result = await this.db.findUser({ 'playerId': msg.playerId });
      if (result.favourateTable && result.favourateTable.length >= systemConfig.favourateTableCap) {
        return { success: false, isRetry: false, isDisplay: true, channelId: (msg.channelId || ""), info: popupTextManager.falseMessages.EXCEED_FAVOURATELIST_LIMITS };
      }
      return this.addtoFavTable(msg.playerId, msg.channelId, favTableData);
    } catch (err) {
      return this.addtoFavTable(msg.playerId, msg.channelId, favTableData);
    }
  }

  async removeFavourateTable(msg: any): Promise<any> {
    const validated = await validateKeySets("Request", "database", "removeFavourateTable", msg);
    if (!validated.success) return validated;

    try {
      await this.db.removeFavourateTable(msg.playerId, msg.channelId);
      return { success: true, isRetry: false, isDisplay: false, channelId: (msg.channelId || ""), info: popupTextManager.falseMessages.SUCCESS_REMOVE };
    } catch (err) {
      return { success: false, isRetry: false, isDisplay: false, channelId: (msg.channelId || ""), info: popupTextManager.dbQyeryInfo.DB_ERROR_SOMETHING_WRONG_GET_LIST };
    }
  }

  async updateStackTable(msg: any): Promise<any> {
    const validated = await validateKeySets("Request", "database", "updateStackTable", msg);
    if (!validated.success) return validated;

    try {
      await this.db.updateStackTable(msg.id, 1, msg.stack);
      return { success: true, info: "Successfully updated", isRetry: false, isDisplay: false, channelId: "" };
    } catch (err) {
      return { success: false, isRetry: false, isDisplay: false, channelId: "", info: popupTextManager.dbQyeryInfo.DB_ERROR_SOMETHING_WRONG_UPDATE };
    }
  }

  async updateStackTournamentRoom(msg: any): Promise<any> {
    const validated = await validateKeySets("Request", "database", "updateStackTournamentRoom", msg);
    if (!validated.success) return validated;

    try {
      await this.db.updateStackTournamentRoom(msg.id, 1, msg.stack);
      return { success: true, info: "Successfully updated", isRetry: false, isDisplay: false, channelId: "" };
    } catch (err) {
      return { success: false, isRetry: false, isDisplay: false, channelId: "", info: popupTextManager.dbQyeryInfo.DB_ERROR_SOMETHING_WRONG_UPDATE };
    }
  }

   createTableStructureForTournament(result: any): any {
    const tempObj: any = {
      'isActive': true,
      'channelType': 'TOURNAMENT',
      'isRealMoney': JSON.parse(result.isRealMoney),
      'channelName': result.channelName,
      'turnTime': result.turnTime,
      'isPotLimit': JSON.parse(result.isPotLimit),
      'maxPlayers': result.maxPlayers,
      'minPlayers': result.minPlayers,
      'smallBlind': result.smallBlind,
      'bigBlind': result.bigBlind,
      'isStraddleEnable': JSON.parse(result.isStraddleEnable),
      'runItTwiceEnable': JSON.parse(result.runItTwiceEnable),
      'minBuyIn': null,
      'maxBuyIn': null,
      'numberOfRebuyAllowed': null,
      'hourLimitForRebuy': null,
      'rebuyHourFactor': null,
      'gameInfo': result.gameInfo,
      'gameInterval': result.gameInterval,
      'blindMissed': result.blindMissed,
      'channelVariation': result.channelVariation,
      'rakeRule': null,
      'tournament': {
        'tournamentId': result._id,
        'avgFlopPercent': result.avgFlopPercent,
        'avgPot': result.avgPot,
        'blindRule': result.blindRule,
        'bountyFees': result.bountyFees,
        'channelType': result.channelType,
        'entryFees': result.entryFees,
        'extraTimeAllowed': result.extraTimeAllowed,
        'houseFees': result.houseFees,
        'isActive': result.isActive,
        'totalFlopPlayer': result.totalFlopPlayer,
        'totalGame': result.totalGame,
        'totalStack': result.totalStack,
        'totalPlayer': result.totalPlayer,
        'totalPot': result.totalPot,
        'tournamentBreakTime': result.tournamentBreakTime,
        'tournamentRules': result.tournamentRules,
        'tournamentRunningTime': result.tournamentRunningTime,
        'tournamentTime': result.tournamentTime,
        'tournamentType': result.tournamentType,
        'winTicketsForTournament': result.winTicketsForTournament,
        'prizeRule': result.prizeRule
      }
    };

    if (result.lateRegistrationAllowed) {
      tempObj.tournament.lateRegistrationAllowed = result.lateRegistrationAllowed;
    }
    if (result.lateRegistrationTime) {
      tempObj.tournament.lateRegistrationTime = result.lateRegistrationTime;
    }
    if (result.maxPlayersForTournament) {
      tempObj.tournament.maxPlayersForTournament = result.maxPlayersForTournament;
    }
    if (result.minPlayersForTournament) {
      tempObj.tournament.minPlayersForTournament = result.minPlayersForTournament;
    }

    return tempObj;
  }

  async createTablesForTournament(msg: any): Promise<any> {
    const validated = await validateKeySets("Request", "database", "createTablesForTournament", msg);
    if (!validated.success) return validated;

    try {
      const result = await this.db.getTournamentRoom(msg.tournamentId);
      if (!result) {
        return { success: false, isRetry: false, isDisplay: true, channelId: "", info: popupTextManager.dbQyeryInfo.DB_INVALID_TOURNAMENT };
      }

      const totalChannellRequired = Math.ceil((result.maxPlayersForTournament) / (result.maxPlayers));
      const obj = [];
      for (let i = 1; i <= totalChannellRequired; i++) {
        const temp = this.createTableStructureForTournament(result);
        temp.channelName = (temp.channelName) + i;
        obj.push(temp);
      }

      const createdTables = await this.db.createTournamentTables(obj);
      return { success: true, result: createdTables };
    } catch (err) {
      return { success: false, isRetry: false, isDisplay: false, channelId: "", info: popupTextManager.dbQyeryInfo.DB_ERROR_SOMETHING_WRONG_CREATE_TABLE_TOURNAMENT };
    }
  }

  async reportIssue(params: any): Promise<any> {
    const validated = await validateKeySets("Request", "database", "reportIssue", params);
    if (!validated.success) return validated;

    try {
      const result = await this.db.reportIssue(params);
      return { success: true, result };
    } catch (err) {
      return { success: false, isRetry: false, isDisplay: false, channelId: "", info: popupTextManager.dbQyeryInfo.DB_ERROR_REPORT_ISSUE_FAIL };
    }
  }

  async getIssue(params: any): Promise<any> {
    const validated = await validateKeySets("Request", "database", "getIssue", params);
    if (!validated.success) return validated;

    try {
      const result = await this.db.getIssue(params);
      return { success: true, result };
    } catch (err) {
      return { success: false, isRetry: false, isDisplay: false, channelId: "", info: popupTextManager.dbQyeryInfo.DB_ERROR_GET_ISSUE_FAIL };
    }
  }

  async findUserSessionInDB(params: any): Promise<any> {
    console.log(")))))))))))))))))))))(((((((((((((", params);
    try {
      const result = await this.db.findUserSessionInDB(params);
      return result ? { success: true, result } : { success: false, info: " " };
    } catch (err) {
      return { success: false, info: " " };
    }
  }

  async insertUserSessionInDB(params: any): Promise<any> {
    return { success: true, result: '' };
  }
}



