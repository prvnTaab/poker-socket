import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { PokerDatebaseService } from 'shared/common/datebase/pokerdatebase.service';

@Injectable()
export class GameService {
  constructor(
    @InjectConnection('db') private dbConnection: Connection,
    private db :PokerDatebaseService
  ) { }

  
  async getHello(): Promise<any> {
    return this.db.getHello()

    // let result = await this.dbConnection.collection('users').findOne({});
    // return result;
  }
}
