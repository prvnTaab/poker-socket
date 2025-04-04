import { Module } from '@nestjs/common';
import { PokerDatebaseService } from './pokerdatebase.service';
import { DatebaseController } from './datebase.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ImdbDatebaseService } from './Imdbdatebase.service copy';

@Module({
  imports:[
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    MongooseModule.forRoot(process.env.IMDB, {connectionName: 'inMemoryDb'}),
    MongooseModule.forRoot(process.env.DB, {connectionName: 'db'}),
    
],
  controllers: [DatebaseController],
  providers: [PokerDatebaseService, ImdbDatebaseService],
  exports:[PokerDatebaseService, ImdbDatebaseService]
})
export class DatebaseModule {}
