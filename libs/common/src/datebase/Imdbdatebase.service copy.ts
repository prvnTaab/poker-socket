import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class ImdbDatebaseService {
    constructor(@InjectConnection('inMemoryDb') private db: Connection) { }

  
}
