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