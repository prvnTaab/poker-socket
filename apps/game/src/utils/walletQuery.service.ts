import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class walletQueryService {
  constructor(@Inject('WALLET_SERVICE') private wallet: ClientProxy,
    ) { }

    async sendWalletBroadCast (data :any) {
        console.log("Got one request to send to wallet")
        try {
            let walletReponse = await firstValueFrom(this.wallet.send('wallet',data))
            return walletReponse;
        }
        catch (err) {
            console.error("Error sending request to wallet:", err);
            return { success: false, channelId: data.data.channelId ?? '', info: 'Unable to process your request at the moment, please try later' }
        }
    };

}