import { Global, Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { ActivityService } from './activity/activity.service';
import { ServerDownManagerService } from './server-down-manager/server-down-manager.service';
import { ProfileMgmtService } from './utils/profileMgmt.service';
import { PrizeAlgoService } from './utils/prizeAlgo.service';
import { CreateTournamentTableService } from './utils/createTournamentTable.service';
import { RandyService } from './utils/cards/randy.service';
import { CardService } from './utils/cards/shortDeckCard.service';
import { ShortDeckService } from './utils/cards/shortDeck.service';
import { DeckService } from './utils/cards/deck.service';
import { CardsService } from './utils/cards/cards.service';

@Global()
@Module({
  providers: [
    CommonService,
    ActivityService,
    ServerDownManagerService,
    ProfileMgmtService,
    PrizeAlgoService,
    CreateTournamentTableService,
    RandyService,
    ShortDeckService,
    CardService,
    DeckService,
    CardsService
  ],
  exports: [
    CommonService,
    ActivityService,
    ServerDownManagerService
  ],
})
export class CommonModule { }
