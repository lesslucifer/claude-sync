import { AppService } from './appService';
import { resetFileElementContent } from './components/FolderTree';
import { checkFileStatuses, verifyFileChanges } from './fileUtils';

export const syncFileStatuses = async (): Promise<void> => {
    const files = AppService.getSyncedFiles()
    const fileStatuses = await checkFileStatuses(files);

    const potentiallyChangedFiles = files.filter(f => fileStatuses[f.uuid] === 'changed');
    const actualChanges = await verifyFileChanges(potentiallyChangedFiles);

    console.log("syncFileStatuses", potentiallyChangedFiles, actualChanges)

    files.forEach(f => {
        let status = fileStatuses[f.uuid] ?? 'synced';
        if (status === 'changed' && !actualChanges[f.uuid]) {
            status = 'synced';
            f.lastUpdated = Date.now()
        }
        
        if (f.status !== status) {
            f.status = status;
            resetFileElementContent(f, f.uuid)
        }
    })
};

export const startFileChecking = (): void => {
    setInterval(syncFileStatuses, 2 * 60000); // Check every 2 minute
    // setInterval(syncFileStatuses, 5000);
    syncFileStatuses(); // Initial check
};
