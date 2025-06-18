import { forwardRef, Global, Module } from '@nestjs/common';
import { PokerDatabaseService } from './pokerdatabase.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { ImdbDatabaseService } from './Imdbdatabase.service';
import { CommonModule } from '../common.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    MongooseModule.forRoot(process.env.IMDB, { connectionName: 'inMemoryDb' }),
    MongooseModule.forRoot(process.env.DB, { connectionName: 'db' }),
  ],
  controllers: [],
  providers: [PokerDatabaseService, ImdbDatabaseService],
  exports: [PokerDatabaseService, ImdbDatabaseService]
})
export class DatabaseModule { }
