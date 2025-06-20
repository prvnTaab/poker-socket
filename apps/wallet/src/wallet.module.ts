import { forwardRef, Module } from '@nestjs/common';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { CommonModule } from 'shared/common/common.module';
import { UtilsModule } from 'apps/game/src/utils/utils.module';

@Module({
  imports: [

    forwardRef(()=>UtilsModule),
    forwardRef(() => CommonModule),
  ],
  controllers: [WalletController],
  providers: [WalletService],
})
export class WalletModule {}
