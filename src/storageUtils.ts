import { getProjectId } from './helper';

// export const storeAllSyncedFiles = (files: Record<string, SyncedFile>): void => {
//     const projectId = getProjectId();
//     const storageKey = getStorageKey(projectId);
//     localStorage.setItem(storageKey, JSON.stringify(files));
// };

// export const addSyncedFile = (file: Omit<SyncedFile, 'id'>): SyncedFile => {
//     const projectId = getProjectId();
//     const storageKey = getStorageKey(projectId);
//     const syncedFiles = getSyncedFiles();
//     const newFile = createSyncedFile(file);
//     syncedFiles[newFile.id] = newFile;
//     localStorage.setItem(storageKey, JSON.stringify(syncedFiles));
//     return newFile;
// };

// export const getSyncedFiles = (): Record<string, SyncedFile> => {
//     const projectId = getProjectId();
//     const storageKey = getStorageKey(projectId);
//     const syncedFiles = localStorage.getItem(storageKey);
//     return syncedFiles ? JSON.parse(syncedFiles) : {};
// };

// export const removeSyncedFile = (id: string): void => {
//     const projectId = getProjectId();
//     const storageKey = getStorageKey(projectId);
//     const syncedFiles = getSyncedFiles();
//     delete syncedFiles[id];
//     localStorage.setItem(storageKey, JSON.stringify(syncedFiles));
// };

// export const updateSyncedFile = (id: string, updates: Partial<SyncedFile>) => {
//     const projectId = getProjectId();
//     const storageKey = getStorageKey(projectId);
//     const syncedFiles = getSyncedFiles();
//     if (syncedFiles[id]) {
//         syncedFiles[id] = { ...syncedFiles[id], ...updates };
//         localStorage.setItem(storageKey, JSON.stringify(syncedFiles));
//     }
//     return syncedFiles[id]
// };

const WORKSPACE_PATH_KEY_PREFIX = 'workspacePath_';

export const setWorkspacePath = (path: string): void => {
  const projectId = getProjectId();
  localStorage.setItem(`${WORKSPACE_PATH_KEY_PREFIX}${projectId}`, path);
};

export const getWorkspacePath = (): string | null => {
  const projectId = getProjectId();
  return localStorage.getItem(`${WORKSPACE_PATH_KEY_PREFIX}${projectId}`);
};

export const clearWorkspacePath = (): void => {
  const projectId = getProjectId();
  localStorage.removeItem(`${WORKSPACE_PATH_KEY_PREFIX}${projectId}`);
};