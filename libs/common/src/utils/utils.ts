import crc from 'crc';
import { systemConfig } from '..';
import fetch from 'node-fetch';

const url = new URL('https://control.msg91.com/api/v5/email/send');



const headers = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
  authkey: '417385A5Wuzmi065e6b3b8P1',
};

const crypto = require('crypto'),
    algorithm = 'aes-256-ctr',
    privateKey = '37LvDSm4XvjYOh9Y';

/**
 * Selects an item from a list based on a key using CRC32 hashing for consistent distribution
 * @param key The key used to determine the selection
 * @param list The array of items to select from
 * @returns The selected item from the list
 * @throws Error if list is empty (optional - you can remove this if you prefer the original behavior)
 */
export function dispatcher<T>(key: string, list: T[]): T {
    if (!list || list.length === 0) {
        // Changed from returning first item to throwing error since empty list is likely a programming error
        throw new Error('No items available in dispatcher list');
    }
    
    const index = Math.abs(crc.crc32(key)) % list.length;
    return list[index];
}




    // Equivalent to pluck of underscore but can extract more than one key
    // collectionArray - collection from which keys to be extracted.
    // keysArray - keys to be extract
    export function pluckKeys (collectionArray: any[], keysArray: string[]): any[] | { error: string } {
      const result: any[] = [];
      if (collectionArray && collectionArray.length > 0 && keysArray && keysArray.length > 0) {
        for (let collectionIterator = 0; collectionIterator < collectionArray.length; collectionIterator++) {
          const tempObject: any = {};
          for (let keysIterator = 0; keysIterator < keysArray.length; keysIterator++) {
            tempObject[keysArray[keysIterator]] = collectionArray[collectionIterator][keysArray[keysIterator]];
          }
          result.push(tempObject);
        }
        return result;
      } else {
        return { error: "please pass all the arguments needed" };
      }
    }
  
    // Sum all keys of a particular collection if all the value of key is number
    // collectionArray - collection from which keys to be added.
    // keysArray - keys to be added
    export function sumKeys(collectionArray: any[], keysArray: string[]): any  {
      const result: any = {};
      if (collectionArray && collectionArray.length > 0 && keysArray && keysArray.length > 0) {
        for (let keysIterator = 0; keysIterator < keysArray.length; keysIterator++) {
          let sum = 0;
          for (let collectionIterator = 0; collectionIterator < collectionArray.length; collectionIterator++) {
            if (collectionArray[collectionIterator][keysArray[keysIterator]] !== undefined) {
              sum = sum + collectionArray[collectionIterator][keysArray[keysIterator]];
            }
          }
          result[keysArray[keysIterator]] = sum;
        }
        return result;
      } else {
        return { error: "please pass all the arguments needed" };
      }
    }
  
    // Change all the keys value of a given collection
    // collectionArray - collection from which keys to be changed.
    // object - object containing key-value pairs to be changed
    export function changeKeys (collectionArray: any[], object: any): any {
      if (collectionArray && collectionArray.length > 0 && object) {
        const keysArray = Object.keys(object);
        if (keysArray.length > 0) {
          for (let collectionIterator = 0; collectionIterator < collectionArray.length; collectionIterator++) {
            for (let keysIterator = 0; keysIterator < keysArray.length; keysIterator++) {
              if (collectionArray[collectionIterator][keysArray[keysIterator]] !== undefined) {
                collectionArray[collectionIterator][keysArray[keysIterator]] = object[keysArray[keysIterator]];
              }
            }
          }
        }
        return collectionArray;
      } else {
        return { error: "please pass all the arguments needed" };
      }
    }
  
    // modifies any json key containing '.' till third nested level of keys
    // key of form {"a.b":true} is converted to {a:{b:true}}
    // json = array of json objects to be modified
    // returns the modified array
     export function convertToJson (json: any): any {
      for (const obj in json) { // for each json object
        for (const keys in json[obj]) { // first level keys
          for (const key in json[obj][keys]) { // second level keys
            for (const k in json[obj][keys][key]) { // third level keys
              convert(k, json[obj][keys][key]);
            }
            convert(key, json[obj][keys]);
          }
          convert(keys, json[obj]);
        }
      }
      return json;
    }

  
  // Helper function to convert the key at particular level
  // 'k' is the key and 'json' is the object at k's level
  // e.g {a.b:true}
  function convert(k: string, json: any): any {
    if (k.indexOf('.') !== -1) { // if key contains '.' i.e. to be split
      const a = k.split('.');
      const j: any = {};
      j[a[1]] = json[k]; // j={b:true}
      json[a[0]] = j; // creating a:{b:true}
      delete json[k]; // deleting existing a.b
      return json;
    }
    return json;
  }
  

   export function convertIntToDecimal (input) {
    if (systemConfig.isDecimal === true) {
    return parseFloat(parseFloat(input).toFixed(2));
    } else {
        return Math.round(input);
    }
}



// method to decrypt data(password) 
export function decrypt(password :any) {
  try{
    var decipher = crypto.createDecipher(algorithm, privateKey);
    var dec = decipher.update(password, 'hex', 'utf8');
    dec += decipher.final('utf8');
    return {success: true, result: dec};    
  } catch(ex){
    return {success: false, info: "Bad input"}
  }
}

// method to encrypt data(password)
export function encrypt(password :any) {
  try{
    var cipher = crypto.createCipher(algorithm, privateKey);
    var crypted = cipher.update(password, 'utf8', 'hex');
    crypted += cipher.final('hex');
    return {success: true, result: crypted} ;
  } catch(ex){
    return {success: false, info: "Bad input"}
  }
}





// Send OTP and other SMSes to player/aff/sub-aff/admin
export async function sendOtp(data: any): Promise<any> {
  console.log('Inside sharedModule sendOtp , ', data);
  const reqObject = {
    authentication: {
      username: systemConfig.sendSmsUsername,
      password: systemConfig.sendSmsPassword,
    },
    messages: [
      {
        sender: systemConfig.sendSmsSender,
        text: data.msg,
        recipients: [
          {
            gsm: data.mobileNumber,
          },
        ],
      },
    ],
  };
  
  console.log('request reqObject in sendOtp - ' + JSON.stringify(reqObject));
  
  try {
    const response = await fetch(systemConfig.sendSmsUrl, {
      method: 'POST',
      body: JSON.stringify(reqObject),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const body = await response.json();
    
    if (response.status === 200 && body.results[0].status === 0) {
      return { success: true };
    } else {
      return { success: false, result: body.results[0].status };
    }
  } catch (error) {
    console.log(error);
    return { success: false };
  }
};

// SEND HTML TEMPLATE MAILS
export async function sendMailWithHtml(data: any): Promise<any> {
  const templateId = templateIds[data.template || 'default'];
  const body = {
    recipients: [
      {
        to: [
          {
            name: data.userName || 'Gamebadlo User',
            email: data.to_email,
          },
        ],
        variables: getSubstitutions(data),
      },
    ],
    from: {
      email: 'no-reply@taabsolutions.com',
    },
    domain: 'taabsolutions.com',
    template_id: templateId,
  };

  console.log('body is', body);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body),
    });
    return { success: true };
  } catch (error) {
    return { success: false };
  }
};

// TemplateIds substitute variables according to template type
function getSubstitutions(data: any): any {
  console.log('line 150 ', data);
  switch (data.template) {
    case 'forgot':
      return {
        VAR1: data.userName || 'Gamebadlo User',
        VAR2: data.passwordLink,
      };
    case 'fundTransferPlayer':
      return {
        player_name: data.content.userName || 'Gamebadlo User',
        player_referenceNo: data.content.referenceNo,
        player_amount: data.content.amount,
        player_totalAmount: data.content.totalAmount,
      };
    case 'signUpNew':
      return {
        player_name: data.content.userName || 'Gamebadlo User',
        player_referenceNo: data.content.referenceNo,
        player_amount: data.content.amount,
        player_totalAmount: data.content.totalAmount,
      };
    case 'topupPlayerTemplate':
      return {
        player_name: data.content.userName || 'Gamebadlo User',
        player_amount: data.content.amount,
        player_totalAmount: data.content.totalAmount,
      };
    case 'creditTransferPlayer':
      return {
        player_name: data.content.userName || 'Gamebadlo User',
        playerName: data.content.playerName || 'Admin',
        player_amount: data.content.amount,
        player_totalAmount: data.content.totalAmount,
        message: data.content.message,
      };
    case 'scratchCardAffiliate':
      return {
        affiliate_name: data.content.name || 'Gamebadlo User',
        affiliate_userName: data.content.userName,
        affiliate_scratchCardDetails: data.content.scratchCardDetails,
      };
    case 'scratchCardPlayer':
      return {
        player_name: data.content.name || 'Gamebadlo User',
        player_userName: data.content.userName,
        player_scratchCardDetails: data.content.scratchCardDetails,
      };
    case 'cashoutRejected':
      return {
        player_name: data.userName,
        player_referenceNo: data.transactionid,
      };
    case 'fundTransferPlayerFail':
      return {
        player_name: data.content.userName,
      };
    case 'cashoutApproved':
      return {
        player_name: data.content.userName,
        player_chips: data.content.chips,
        player_referenceNo: data.content.referenceNo,
      };
    case 'cashoutUnsuccessful':
      return {
        player_name: data.content.userName,
        player_referenceNo: data.content.referenceNo,
      };
    case 'cashoutSuccessful':
      return {
        player_name: data.content.userName,
        player_chips: data.content.chips,
        player_referenceNo: data.content.referenceNo,
        player_amount: data.content.amount,
        player_accountNumber: data.content.accountNumber,
        player_tds: data.content.tds,
        player_panNumber: data.content.panNumber,
      };
    case 'scratchCardExpiration':
      return {
        player_name: data.content.name,
        player_userName: data.content.userName,
        player_scratchCardId: data.content.scratchCardId,
        player_date: data.content.date,
      };
    case 'updatePlayerMail':
      return {
        affiliate_name: data.content.parentName,
        player_name: data.content.playerName,
      };
    case 'rakeback':
      return {
        player_name: data.content.playerName,
        date: data.content.date,
        rakeBack_amount: data.content.rakeback,
        dateStart: data.content.dateStart,
        dateEnd: data.content.dateEnd,
        RealChips: data.content.realChips,
      };
    case 'affiliateSignUp':
      return {
        affiliate_name: data.content.affiliateName,
        affiliate_userName: data.content.userName,
        link: data.content.link,
      };
    case 'SubAffiliateSignUp':
      return {
        affiliate_name: data.content.affiliateName,
        affiliate_userName: data.content.userName,
        affiliate_parentUser: data.content.parentUser,
        link: data.content.link,
      };
    case 'cashoutPlayerMail':
      return {
        player_name: data.content.name,
        player_userName: data.content.userName,
        player_fullname: data.content.fullname,
        cashoutamount: data.content.cashoutamount,
      };
    case 'CashoutByPlayerMailToAffiliate':
      return {
        aff_name: data.content.affiliateName,
        player_userName: data.content.userName,
        player_fullname: data.content.fullname,
        cashoutamount: data.content.cashoutamount,
      };
    case 'cashoutStatusPlayerMail':
      return {
        player_name: data.content.name,
        player_userName: data.content.userName,
        player_fullname: data.content.fullname,
        amount: data.content.amount,
        referenceNumber: data.content.referenceNumber,
        status: data.content.status,
      };
    case 'organicPlayerTemplate':
      return {
        player_name: data.content.userName,
        amount: data.content.cashoutamount,
        referenceNumber: data.content.referenceNo,
      };
    case 'signUpBonus':
      return {
        player_name: data.content.playerName,
        bonus_percent: data.content.bonusPercent,
        bonus_code: data.content.bonusCode,
        date: data.content.date,
      };
    case 'SpinTheWheelContest':
      return {
        playerName: data.content.playerName,
        amount: data.content.amount,
      };
    case 'rcbFundTransfer':
      return {
        userName: data.content.userName,
        realChipBonus: data.content.realChipBonus,
        rcbAmount: data.content.rcbAmount,
      };
    case 'signupwithBonus':
      return {
        userName: data.content.userName,
        amount: data.content.amount,
      };
    case 'inactivePlayer':
      return {
        playerName: data.content.playerName,
      };
    case 'PanCardApproved':
      return {
        userName: data.content.playerName,
      };
    case 'PanCardRejection':
      return {
        userName: data.content.playerName,
      };
    case 'welcome':
    default:
      return {
        player_name: data.userName || 'PokerMagnet-Player',
        player_verify_link: data.verifyLink,
        player_link_title: data.linkTitle || 'Click here to verify your mail',
      };
  }
}

const templateIds: Record<string, string> = {
  default: 'fc9685d8-5526-4fb9-b3b4-770d0d5fe287',
  welcome: 'new_user_password',
  forgot: 'forgot_pass_2',
  scratchCardPlayer: '04b4e250-833e-4723-b77c-90fe0f296ad4',
  scratchCardAffiliate: '784cd9b0-0dc9-4ac6-835f-70ee41371922',
  cashoutApproved: '598422fd-9dd3-4914-b12c-cd734e9d77df',
  cashoutRejected: '75e988c5-b47f-4abf-a9bc-2188f3bd02b5',
  fundTransferPlayerFail: '98883d89-cbdf-4037-bc58-89eb0cd2731f',
  cashoutSuccessful: '8fca831e-d49c-439d-adbc-2b73195750ce',
  cashoutUnsuccessful: '71bb4ad3-8a98-40a4-8e5a-c2252ecc5ffa',
  fundTransferPlayer: '9be34f8f-10b7-4595-8c65-07a64adc1927',
  ChipsTransferNewTemp: 'a58a7b14-b14e-48c1-98eb-6a0afeb28d7a',
  scratchCardExpiration: 'c328def3-f9f3-43c9-af6c-1a9361f9ec7d',
  updatePlayerMail: '595e337d-babc-42f4-9565-0c0959b72678',
  rakeback: '1a10d3fc-0ac5-4033-b642-9511c06bd463',
  affiliateSignUp: '60c4d368-a756-47c0-9327-33884eea91bf',
  signUpBonus: '35d445dc-c8d5-47d4-894e-d2f6958128ad',
  inactivePlayer: '7cb971ea-dca2-45aa-b70b-6c427bc0ddc3',
  SubAffiliateSignUp: '1386c209-2e45-421b-bf3a-936df7308197',
  cashoutPlayerMail: 'a024b33e-93f3-409e-b4d0-ef310e384832',
  CashoutByPlayerMailToAffiliate: '542cc08f-ed0c-4e0b-b315-12b7bd4a1c6a',
  cashoutStatusPlayerMail: 'e035974b-08f0-428a-a4ac-65a9482e3437',
  organicPlayerTemplate: 'eb4bf9b3-27eb-4551-9ade-7ffefc711109',
  topupPlayerTemplate: '8af680c3-083a-45db-ad64-fa5bdf667a6a',
  creditTransferPlayer: '9ac1ec9d-5604-49c6-8ba7-686c6268f0d6',
  SpinTheWheelContest: 'b4b54ac0-6353-482d-9559-0ba3f650ce3a',
  rcbFundTransfer: 'f1c1d85c-c649-4a34-848d-8ff9c4371bbb',
  signupwithBonus: 'aa3bd62f-7122-4996-b549-6f100a3fde52',
  PanCardApproved: '1af0fbc0-51f3-4f3c-84e5-ec580380df3e',
  PanCardRejection: '01dc9eb2-7969-413f-93eb-92e509e4e11f',
};



