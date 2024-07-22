// fileChecker.ts
import { getSyncedFiles, storeAllSyncedFiles } from './storageUtils';
import { checkFileStatuses } from './fileUtils';
import { resetFileElementContent } from './components/FileList';

export const syncFileStatuses = async (): Promise<void> => {
    const files = getSyncedFiles()
    const fileStatuses = await checkFileStatuses(files);

    Object.values(files).forEach(f => {
        const stt = fileStatuses[f.uuid] ?? 'synced'
        f.status = stt
        resetFileElementContent(f)
    })
    
    storeAllSyncedFiles(files)
};

export const startFileChecking = (): void => {
    setInterval(syncFileStatuses, 2 * 60000); // Check every 2 minute
    syncFileStatuses(); // Initial check
};