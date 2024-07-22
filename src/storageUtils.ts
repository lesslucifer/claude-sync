import { SyncedFile } from './types';
import { getProjectId } from './helper';

const getStorageKey = (projectId: string): string => `syncedFiles_${projectId}`;

export const storeAllSyncedFiles = (files: Record<string, SyncedFile>): void => {
    const projectId = getProjectId();
    const storageKey = getStorageKey(projectId);
    localStorage.setItem(storageKey, JSON.stringify(files));
};

export const storeSyncedFile = (file: SyncedFile): void => {
    const projectId = getProjectId();
    const storageKey = getStorageKey(projectId);
    const syncedFiles = getSyncedFiles();
    syncedFiles[file.uuid] = file;
    localStorage.setItem(storageKey, JSON.stringify(syncedFiles));
};

export const getSyncedFiles = (): Record<string, SyncedFile> => {
    const projectId = getProjectId();
    const storageKey = getStorageKey(projectId);
    const syncedFiles = localStorage.getItem(storageKey);
    return syncedFiles ? JSON.parse(syncedFiles) : {};
};

export const removeSyncedFile = (uuid: string): void => {
    const projectId = getProjectId();
    const storageKey = getStorageKey(projectId);
    const syncedFiles = getSyncedFiles();
    delete syncedFiles[uuid];
    localStorage.setItem(storageKey, JSON.stringify(syncedFiles));
};

export const updateSyncedFile = (uuid: string, updates: Partial<SyncedFile>): void => {
    const projectId = getProjectId();
    const storageKey = getStorageKey(projectId);
    const syncedFiles = getSyncedFiles();
    if (syncedFiles[uuid]) {
        syncedFiles[uuid] = { ...syncedFiles[uuid], ...updates };
        localStorage.setItem(storageKey, JSON.stringify(syncedFiles));
    }
};