// fileChecker.ts
import { getSyncedFiles, storeAllSyncedFiles, updateSyncedFile } from './storageUtils';
import { checkFileStatuses } from './fileUtils';
import { resetFileElementContent } from './components/FileList';
import { fetchProjectDocs } from './claudeApis';
import { SyncedFile } from './types';

export const syncFileStatuses = async (): Promise<void> => {
    const files = getSyncedFiles()
    const fileStatuses = await checkFileStatuses(files);

    Object.values(files).forEach(f => {
        const stt = fileStatuses[f.id] ?? 'synced'
        f.status = stt
        resetFileElementContent(f)
    })

    storeAllSyncedFiles(files)
};

export const startFileChecking = (): void => {
    setInterval(syncFileStatuses, 2 * 60000); // Check every 2 minute
    syncFileStatuses(); // Initial check
};

export const checkForBrokenFiles = async (): Promise<void> => {
    try {
        const projectDocs = await fetchProjectDocs();
        const syncedFiles = getSyncedFiles();
        const projectDocUuids = new Set(projectDocs.map(doc => doc.uuid));

        let changed = false
        for (const file of Object.values(syncedFiles)) {
            if (!projectDocUuids.has(file.uuid)) {
                file.status = 'broken'
                resetFileElementContent(file)
                changed = true
            }
        }

        if (changed) {
            storeAllSyncedFiles(syncedFiles)
        }
    } catch (error) {
        console.error('Error checking for broken files:', error);
    }
};