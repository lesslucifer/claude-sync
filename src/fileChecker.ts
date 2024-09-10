import { getAllFilesFromElement as getAllFilesFromUIElement, resetFileElementContent } from './components/FileList';
import { updateSyncAllButtonVisibility } from './components/Header';
import { checkFileStatuses, verifyFileChanges } from './fileUtils';

export const syncFileStatuses = async (): Promise<void> => {
    const files = getAllFilesFromUIElement()
    const fileStatuses = await checkFileStatuses(files);

    const potentiallyChangedFiles = files.filter(f => fileStatuses[f.uuid] === 'changed');
    console.log('potentiallyChangedFiles', potentiallyChangedFiles)
    const actualChanges = await verifyFileChanges(potentiallyChangedFiles);

    files.forEach(f => {
        let status = fileStatuses[f.uuid] ?? 'synced';
        if (status === 'changed' && !actualChanges[f.uuid]) {
            status = 'synced';
            f.lastUpdated = Date.now()
        }
        f.status = status;
        resetFileElementContent(f, f.uuid)
    })
    updateSyncAllButtonVisibility();
};

export const startFileChecking = (): void => {
    setInterval(syncFileStatuses, 2 * 60000); // Check every 2 minute
    syncFileStatuses(); // Initial check
};
