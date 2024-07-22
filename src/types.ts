export interface File {
    fileName: string;
    lastUpdated: number;
    filePath: string;
}

export type SyncedFileStatus = 'synced' | 'changed' | 'deleted'

export interface SyncedFile extends File {
    uuid: string;
    status: SyncedFileStatus;
}