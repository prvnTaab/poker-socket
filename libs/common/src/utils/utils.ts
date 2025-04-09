import crc from 'crc';

/**
 * Selects an item from a list based on a key using CRC32 hashing for consistent distribution
 * @param key The key used to determine the selection
 * @param list The array of items to select from
 * @returns The selected item from the list
 * @throws Error if list is empty (optional - you can remove this if you prefer the original behavior)
 */
export function dispatcher<T>(key: string, list: T[]): T {
    if (!list || list.length === 0) {
        // Changed from returning first item to throwing error since empty list is likely a programming error
        throw new Error('No items available in dispatcher list');
    }
    
    const index = Math.abs(crc.crc32(key)) % list.length;
    return list[index];
}




    // Equivalent to pluck of underscore but can extract more than one key
    // collectionArray - collection from which keys to be extracted.
    // keysArray - keys to be extract
    export function pluckKeys (collectionArray: any[], keysArray: string[]): any[] | { error: string } {
      const result: any[] = [];
      if (collectionArray && collectionArray.length > 0 && keysArray && keysArray.length > 0) {
        for (let collectionIterator = 0; collectionIterator < collectionArray.length; collectionIterator++) {
          const tempObject: any = {};
          for (let keysIterator = 0; keysIterator < keysArray.length; keysIterator++) {
            tempObject[keysArray[keysIterator]] = collectionArray[collectionIterator][keysArray[keysIterator]];
          }
          result.push(tempObject);
        }
        return result;
      } else {
        return { error: "please pass all the arguments needed" };
      }
    }
  
    // Sum all keys of a particular collection if all the value of key is number
    // collectionArray - collection from which keys to be added.
    // keysArray - keys to be added
    export function sumKeys(collectionArray: any[], keysArray: string[]): any  {
      const result: any = {};
      if (collectionArray && collectionArray.length > 0 && keysArray && keysArray.length > 0) {
        for (let keysIterator = 0; keysIterator < keysArray.length; keysIterator++) {
          let sum = 0;
          for (let collectionIterator = 0; collectionIterator < collectionArray.length; collectionIterator++) {
            if (collectionArray[collectionIterator][keysArray[keysIterator]] !== undefined) {
              sum = sum + collectionArray[collectionIterator][keysArray[keysIterator]];
            }
          }
          result[keysArray[keysIterator]] = sum;
        }
        return result;
      } else {
        return { error: "please pass all the arguments needed" };
      }
    }
  
    // Change all the keys value of a given collection
    // collectionArray - collection from which keys to be changed.
    // object - object containing key-value pairs to be changed
    export function changeKeys (collectionArray: any[], object: any): any {
      if (collectionArray && collectionArray.length > 0 && object) {
        const keysArray = Object.keys(object);
        if (keysArray.length > 0) {
          for (let collectionIterator = 0; collectionIterator < collectionArray.length; collectionIterator++) {
            for (let keysIterator = 0; keysIterator < keysArray.length; keysIterator++) {
              if (collectionArray[collectionIterator][keysArray[keysIterator]] !== undefined) {
                collectionArray[collectionIterator][keysArray[keysIterator]] = object[keysArray[keysIterator]];
              }
            }
          }
        }
        return collectionArray;
      } else {
        return { error: "please pass all the arguments needed" };
      }
    }
  
    // modifies any json key containing '.' till third nested level of keys
    // key of form {"a.b":true} is converted to {a:{b:true}}
    // json = array of json objects to be modified
    // returns the modified array
     export function convertToJson (json: any): any {
      for (const obj in json) { // for each json object
        for (const keys in json[obj]) { // first level keys
          for (const key in json[obj][keys]) { // second level keys
            for (const k in json[obj][keys][key]) { // third level keys
              convert(k, json[obj][keys][key]);
            }
            convert(key, json[obj][keys]);
          }
          convert(keys, json[obj]);
        }
      }
      return json;
    }

  
  // Helper function to convert the key at particular level
  // 'k' is the key and 'json' is the object at k's level
  // e.g {a.b:true}
  function convert(k: string, json: any): any {
    if (k.indexOf('.') !== -1) { // if key contains '.' i.e. to be split
      const a = k.split('.');
      const j: any = {};
      j[a[1]] = json[k]; // j={b:true}
      json[a[0]] = j; // creating a:{b:true}
      delete json[k]; // deleting existing a.b
      return json;
    }
    return json;
  }
  