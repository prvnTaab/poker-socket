import { Module } from '@nestjs/common';
import { PokerDatabaseService } from './pokerdatabase.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ImdbDatabaseService } from './Imdbdatabase.service';

@Module({
  imports:[
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    MongooseModule.forRoot(process.env.IMDB, {connectionName: 'inMemoryDb'}),
    MongooseModule.forRoot(process.env.DB, {connectionName: 'db'}),
    
],
  controllers: [],
  providers: [PokerDatabaseService, ImdbDatabaseService],
  exports:[PokerDatabaseService, ImdbDatabaseService]
})
export class DatabaseModule {}
