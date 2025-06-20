import { Body, Controller,Post} from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { WalletService } from './wallet.service';

@Controller('wallet')
export class WalletController {
    constructor(private readonly walletService: WalletService) { } 
    // @Post('walletProcess')
    // async walletProcess(@Body() body ){
    //   console.log('------------',body)
    //   return await this.walletService.walletProcess(body)
    // }
    @MessagePattern('wallet')
    async walletProcess2(@Body() body ){
      // console.log('------------',body)
      let res = await this.walletService.walletProcess(body)
      // console.log("res in controller", res)
      return res;
    }

}
