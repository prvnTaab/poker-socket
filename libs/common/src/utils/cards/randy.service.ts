import { Injectable } from '@nestjs/common';
import * as os from 'os';
import * as crypto from 'crypto';
import * as well1024a from 'prng-well1024a'; // use namespace import ✅

@Injectable()
export class RandyService {
  private readonly randy: any;

  constructor() {
    const entropy = this.getEntropy();
    const generator = well1024a(entropy); // no 'new' ✅
    this.randy = this.attachFunctions(generator);
  }

  private getEntropy(): number[] {
    const mu = process.memoryUsage();
    const la = os.loadavg();
    const crb = crypto.randomBytes(4);
    const cryptoRand =
      0x01000000 * crb[0] +
      0x00010000 * crb[1] +
      0x00000100 * crb[2] +
      0x00000001 * crb[3];
    const osUptime = os.uptime?.() ?? 0;
    const processUptime = process.uptime?.() ?? osUptime;

    return [
      cryptoRand,
      Date.now(),
      process.pid,
      Math.floor(processUptime * 16777216),
      mu.rss,
      mu.heapTotal,
      mu.heapUsed,
      Math.floor(osUptime * 16777216),
      Math.floor(la[0] * 4294967296),
      Math.floor(la[1] * 4294967296),
      Math.floor(la[2] * 4294967296),
      os.totalmem(),
      os.freemem()
    ];
  }

  private attachFunctions(generator: any) {
    const getUInt32 = generator.getUInt32.bind(generator);

    const randInt32 = (max?: number): number => {
      const r = getUInt32();
      return typeof max === 'undefined' ? r : r % max;
    };
    randInt32['defaultPrecision'] = 32;

    const MIN_FLOAT = 1 / Math.pow(2, randInt32['defaultPrecision']);

    return {
      randInt: (min?: number, max?: number, step?: number): number => {
        if (typeof min === 'undefined') return randInt32();
        if (typeof max === 'undefined') {
          max = min;
          min = 0;
        }
        if (typeof step === 'undefined') {
          return min + randInt32(max - min);
        }
        const span = Math.ceil((max - min) / step);
        return min + randInt32(span) * step;
      },
      choice: (arr: any[]): any => {
        if (!arr.length) throw new Error('arr not an array of length > 0');
        return arr[randInt32(arr.length)];
      },
      shuffle: (arr: any[]): any[] => {
        const arrCopy = arr.slice();
        for (let i = arrCopy.length - 1; i > 0; i--) {
          const j = randInt32(i + 1);
          [arrCopy[i], arrCopy[j]] = [arrCopy[j], arrCopy[i]];
        }
        return arrCopy;
      },
      random: (): number => MIN_FLOAT * randInt32(),
      uniform: (min: number, max?: number): number => {
        if (typeof max === 'undefined') {
          max = min;
          min = 0;
        }
        return min + (MIN_FLOAT * randInt32()) * (max - min);
      }
    };
  }

  randInt(min?: number, max?: number, step?: number): number {
    return this.randy.randInt(min, max, step);
  }

  random(): number {
    return this.randy.random();
  }

  uniform(min: number, max: number): number {
    return this.randy.uniform(min, max);
  }

  choice<T>(arr: T[]): T {
    return this.randy.choice(arr);
  }

  shuffle<T>(arr: T[]): T[] {
    return this.randy.shuffle(arr);
  }
}
