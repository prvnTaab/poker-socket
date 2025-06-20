import { Global, Module } from "@nestjs/common";
import { UtilsService } from "./utils.service";
import { WalletQueryService } from "./walletQuery.service";
import { ClientsModule, Transport } from '@nestjs/microservices';

@Global()
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'WALLET_SERVICE', // ✅ must match the token injected in WalletQueryService
        transport: Transport.TCP,
        options: {
          host: 'localhost',
          port: 4000,
        },
      },
    ]),
  ],
  providers: [
    UtilsService, 
    WalletQueryService
  ],
  exports: [
    UtilsService, 
    WalletQueryService,
    ClientsModule],
})
export class UtilsModule {}