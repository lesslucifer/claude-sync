import { SyncedFile } from './types';

export const storeSyncedFile = (file: SyncedFile): void => {
    const syncedFiles = getSyncedFiles();
    syncedFiles[file.uuid] = file;
    localStorage.setItem('syncedFiles', JSON.stringify(syncedFiles));
};

export const getSyncedFiles = (): Record<string, SyncedFile> => {
    const syncedFiles = localStorage.getItem('syncedFiles');
    return syncedFiles ? JSON.parse(syncedFiles) : {};
};

export const removeSyncedFile = (uuid: string): void => {
    const syncedFiles = getSyncedFiles();
    delete syncedFiles[uuid];
    localStorage.setItem('syncedFiles', JSON.stringify(syncedFiles));
};