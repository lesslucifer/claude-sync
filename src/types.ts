import { getRandomToken } from "./helper";

export interface File {
    fileName: string;
    lastUpdated: number;
    filePath: string;
}

export type SyncedFileStatus = 'synced' | 'changed' | 'deleted'

export interface SyncedFile extends File {
    id: string;
    uuid: string;
    status: SyncedFileStatus;
}

export const createSyncedFile = (file: Omit<SyncedFile, 'id'>): SyncedFile => ({
    ...file,
    id: getRandomToken()
});