type StorageType = "local" | "session";

export function getStorageValue<T>(key: string, storage: StorageType = "local"): T | null {
    try {
        const storageType = storage === "local" ? localStorage : sessionStorage;
        const item = storageType.getItem(key);

        if (!item) {
            return null;
        }

        return JSON.parse(item) as T;
    }
    catch (error) {
        console.error(`Error getting item ${key} from ${storage}Storage:`, error);
        return null;
    }
}

export function setStorageValue<T>(
    key: string,
    value: T,
    storage: StorageType = "local",
): void {
    try {
        const storageType = storage === "local" ? localStorage : sessionStorage;
        const serializedValue = JSON.stringify(value);
        storageType.setItem(key, serializedValue);
    }
    catch (error) {
        console.error(`Error setting item ${key} in ${storage}Storage:`, error);
    }
}

export function removeStorageValue(
    key: string,
    storage: StorageType = "local",
): void {
    try {
        const storageType = storage === "local" ? localStorage : sessionStorage;
        storageType.removeItem(key);
    }
    catch (error) {
        console.error(`Error removing item ${key} from ${storage}Storage:`, error);
    }
}
