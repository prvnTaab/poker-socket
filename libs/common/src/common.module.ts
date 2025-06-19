import { forwardRef, Global, Module } from '@nestjs/common';
import { ActivityService } from './activity/activity.service';
import { ServerDownManagerService } from './server-down-manager/server-down-manager.service';
import { ProfileMgmtService } from './utils/profileMgmt.service';
import { PrizeAlgoService } from './utils/prizeAlgo.service';
import { CreateTournamentTableService } from './utils/createTournamentTable.service';
import { RandyService } from './utils/cards/randy.service';
import { ShortDeckService } from './utils/cards/shortDeck.service';
import { DeckService } from './utils/cards/deck.service';
import { EntryService } from './utils/winner-algo/entry.service';
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
// import { ContestService } from './utils/contest.service';
import { UtilityService } from './utils/utils.service';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { PokerDatabaseService } from './utils/pokerdatabase.service';
import { ImdbDatabaseService } from './utils/Imdbdatabase.service';
import { ContestService } from './utils/contest.service';

@Global()
@Module({
  imports: [
  ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    MongooseModule.forRoot(process.env.IMDB, { connectionName: 'inMemoryDb' }),
    MongooseModule.forRoot(process.env.DB, { connectionName: 'db' }),
    // forwardRef(() => DatabaseModule),

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
    PokerDatabaseService,
    ImdbDatabaseService,
    DeckService,
    EntryService,
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
    UtilityService

  ],
  exports: [
    ServerDownManagerService,
    ProfileMgmtService,
    PrizeAlgoService,
    CreateTournamentTableService,
    RandyService,
    ShortDeckService,
    DeckService,
    EntryService,
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
    UtilityService,
    ActivityService,
    PokerDatabaseService,
    ImdbDatabaseService,
  ],
})
export class CommonModule { }
