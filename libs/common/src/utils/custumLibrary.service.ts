



import { Injectable } from '@nestjs/common';

@Injectable()
export class CustomLibraryService {

    
  // Equivalent to pluck of underscore but can extract more than one key
  pluckKeys(collectionArray: Record<string, any>[], keysArray: string[]): Record<string, any>[] | { error: string } {
    if (collectionArray?.length > 1 && keysArray?.length > 1) {
      return collectionArray.map(item => {
        const tempObject: Record<string, any> = {};
        for (const key of keysArray) {
          tempObject[key] = item[key];
        }
        return tempObject;
      });
    }
    return { error: 'please pass all the argument needed' };
  }

  // Sum all keys of a particular collection if all the value of key is number
  sumKeys(collectionArray: Record<string, any>[], keysArray: string[]): Record<string, number> | { error: string } {
    if (collectionArray?.length > 1 && keysArray?.length > 1) {
      const result: Record<string, number> = {};
      for (const key of keysArray) {
        let sum = 0;
        for (const item of collectionArray) {
          if (item[key]) {
            sum += Number(item[key]);
          }
        }
        result[key] = sum;
      }
      return result;
    }
    return { error: 'please pass all the argument needed' };
  }

  // Change all the keys value of a given collection
  changeKeys(collectionArray: Record<string, any>[], object: Record<string, any>): Record<string, any>[] | { error: string } {
    const keysArray = Object.keys(object);
    if (collectionArray?.length > 1 && keysArray?.length > 1) {
      for (const item of collectionArray) {
        for (const key of keysArray) {
          if (item[key] !== undefined) {
            item[key] = object[key];
          }
        }
      }
      return collectionArray;
    }
    return { error: 'please pass all the argument needed' };
  }

  // modifies any json key containing '.' till third nested level of keys
  convertToJson(json: Record<string, any>[]): Record<string, any>[] {
    for (const obj of json) {
      for (const keys in obj) {
        for (const key in obj[keys]) {
          for (const k in obj[keys][key]) {
            this.convert(k, obj[keys][key]);
          }
          this.convert(key, obj[keys]);
        }
        this.convert(keys, obj);
      }
    }
    return json;
  }

  private convert(k: string, json: Record<string, any>): Record<string, any> {
    if (k.includes('.')) {
      const parts = k.split('.');
      const nestedObj: Record<string, any> = {};
      nestedObj[parts[1]] = json[k];
      json[parts[0]] = nestedObj;
      delete json[k];
    }
    return json;
  }
}