import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class GameService {
  constructor(
    @InjectConnection('db') private dbConnection: Connection,
   

  ) { }
  async getHello(): Promise<any> {
    let result = await this.dbConnection.collection('users').findOne({});
    return result;
  }
}
