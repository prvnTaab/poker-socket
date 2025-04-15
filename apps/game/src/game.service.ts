import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { PokerDatabaseService } from 'shared/common/datebase/pokerdatabase.service';

@Injectable()
export class GameService {
  constructor(
    @InjectConnection('db') private dbConnection: Connection,
    private db :PokerDatabaseService
  ) { }

  
  async getHello(): Promise<any> {
    return this.db.findAllSpamWords()

    // let result = await this.dbConnection.collection('users').findOne({});
    // return result;
  }
}
