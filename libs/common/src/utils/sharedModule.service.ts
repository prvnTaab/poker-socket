import { Injectable } from '@nestjs/common';
import * as sgMail from '@sendgrid/mail';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import stateOfX from '../stateOfX.sevice';
import { systemConfig } from '..';

@Injectable()
export class SharedModuleService {

  private templateIds = {
    default: 'fc9685d8-5526-4fb9-b3b4-770d0d5fe287',
    welcome: 'fc9685d8-5526-4fb9-b3b4-770d0d5fe287',
    forgot: 'be39e9fd-f44e-456d-a291-9a69686563b8',
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

  constructor(private readonly httpService: HttpService) {
    sgMail.setApiKey(stateOfX.SendGridApiKey);
  }

  async sendEmail(data: any): Promise<{ success: boolean }> {
    const msg = {
      to: data.to_email,
      from: data.let || systemConfig.from_email,
      subject: data.subject,
      text: ' ',
      html: data.content,
    };
    try {
      await sgMail.send(msg);
      return { success: true };
    } catch (error) {
      console.error('Email sending error', error);
      return { success: false };
    }
  }

  async sendOtp(data: { msg: string; mobileNumber: string }): Promise<{ success: boolean; result?: any }> {
    const reqObject = {
      authentication: {
        username: systemConfig.sendSmsUsername,
        password: systemConfig.sendSmsPassword,
      },
      messages: [
        {
          sender: systemConfig.sendSmsSender,
          text: data.msg,
          recipients: [{ gsm: data.mobileNumber }],
        },
      ],
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post(systemConfig.sendSmsUrl, reqObject)
      );
      if (response.data.results[0].status === 0) {
        return { success: true };
      } else {
        return { success: false, result: response.data.results[0].status };
      }
    } catch (error) {
      console.error('SMS sending error', error);
      return { success: false };
    }
  }

  async sendMailWithHtml(data: any): Promise<{ success: boolean }> {
    const templateId = this.templateIds[data.template || 'default'];
    const msg: any = {
      to: data.to_email,
      from: data.let || systemConfig.from_email,
      subject: data.subject || `Welcome to ${systemConfig.userNameForMail}`,
      text: ' ',
      html: '<p></p>',
      templateId,
      substitutions: this.getSubstitutions(data),
    };

    if (data.template === 'rakeback') {
      msg.bcc = systemConfig.operation_email;
    }

    try {
      await sgMail.send(msg);
      return { success: true };
    } catch (error) {
      console.error('HTML Email sending error', error);
      return { success: false };
    }
  }

  private getSubstitutions(data: any): Record<string, string> {
    const username = data.userName || data.content?.userName || systemConfig.userNameForMail + '-User';
    const content = data.content || {};
    const defaultSubstitutions = {
      player_name: username,
      player_verify_link: data.verifyLink,
      player_link_title: data.linkTitle || 'Click here to verify your mail',
    };

    const templates: Record<string, Record<string, string>> = {
      forgot: {
        player_name: username,
        player_forgot_link: data.resetPasswordLink,
      },
      fundTransferPlayer: {
        player_name: username,
        player_referenceNo: content.referenceNo,
        player_amount: content.amount,
        player_totalAmount: content.totalAmount,
      },
      // ...add remaining templates from the original switch block
    };

    return templates[data.template] || defaultSubstitutions;
  }
}