export interface File {
    fileName: string;
    lastUpdated: string;
    filePath: string;
}

export interface SyncedFile extends File {
    uuid: string;
    status: 'synced' | 'changed' | 'deleted';
}