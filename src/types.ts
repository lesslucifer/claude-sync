import { getRandomToken } from "./helper";

export interface File {
    fileName: string;
    lastUpdated: number;
    filePath: string;
}

export type SyncedFileStatus = 'synced' | 'changed' | 'deleted' | 'broken'

export interface SyncedFile extends File {
    uuid: string;
    status: SyncedFileStatus;
}