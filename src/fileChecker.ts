// fileChecker.ts
import { fetchProjectDocs } from './claudeApis';
import { getAllFilesFromElement as getAllFilesFromUIElement, resetFileElementContent } from './components/FileList';
import { checkFileStatuses } from './fileUtils';

export const syncFileStatuses = async (): Promise<void> => {
    const files = getAllFilesFromUIElement()
    const fileStatuses = await checkFileStatuses(files);

    files.forEach(f => {
        const stt = fileStatuses[f.uuid] ?? 'synced'
        f.status = stt
        resetFileElementContent(f, f.uuid)
    })
};

export const startFileChecking = (): void => {
    setInterval(syncFileStatuses, 2 * 60000); // Check every 2 minute
    syncFileStatuses(); // Initial check
};

export const checkForBrokenFiles = async (): Promise<void> => {
    try {
        const projectDocs = await fetchProjectDocs();
        const syncedFiles = getAllFilesFromUIElement();
        const projectDocUuids = new Set(projectDocs.map(doc => doc.uuid));

        for (const file of Object.values(syncedFiles)) {
            if (!projectDocUuids.has(file.uuid)) {
                file.status = 'broken'
                resetFileElementContent(file, file.uuid)
            }
        }
    } catch (error) {
        console.error('Error checking for broken files:', error);
    }
};