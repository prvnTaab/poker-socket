import { Global, Module } from '@nestjs/common';
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
import { EntryService } from './utils/winner-algo/entry.service';
import { Card } from './utils/winner-algo/card.service';
import { CardComparerService } from './utils/winner-algo/cardComparer.service';
import { ShortDeckCardCompareService } from './utils/winner-algo/shortDeckCardCompare.service';
import { CombinationService } from './utils/winner-algo/combination.service';
import { CardConfigurationService } from './utils/winner-algo/cardConfiguration.service';
import { PointsService } from './utils/winner-algo/points.service';
import { WinnerRankingService } from './utils/winner-algo/winnerRanking.service';
import { CardsConfigService } from './utils/winner-algo/cardConfig.service';
import { CustomLibraryService } from './utils/custumLibrary.service';
import { LinkedListService } from './utils/linkedList.service';
import { OutsScriptService } from './utils/outsScript.service';
import { PasswordencrytpdecryptService } from './utils/passwordencrytpdecrypt.service';
import { ContestService } from './utils/contest.service';
import { DatabaseModule } from './datebase/database.module';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

@Global()
@Module({
  imports: [

    // DatabaseModule
  ],
  providers: [
    ActivityService,
    ServerDownManagerService,
    ProfileMgmtService,
    PrizeAlgoService,
    CreateTournamentTableService,
    RandyService,
    ShortDeckService,
    CardService,
    DeckService,
    CardsService,
    EntryService,
    Card,
    CardComparerService,
    ShortDeckCardCompareService,
    CombinationService,
    CardConfigurationService,
    PointsService,
    WinnerRankingService,
    CardsConfigService,
    CustomLibraryService,
    LinkedListService,
    OutsScriptService,
    PasswordencrytpdecryptService,
    ContestService,

  ],
  exports: [
    
    ActivityService,
    ServerDownManagerService
  ],
})
export class CommonModule { }
