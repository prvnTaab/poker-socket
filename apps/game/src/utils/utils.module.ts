import { Global, Module } from "@nestjs/common";
import { UtilsService } from "./utils.service";
import { SocketQueryService } from "./socketQuery.service";
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
          port: 4005,
        },
      },
    ]),
  ],
  providers: [UtilsService, SocketQueryService, WalletQueryService],
  exports: [UtilsService, SocketQueryService, WalletQueryService,ClientsModule],
})
export class UtilsModule {}