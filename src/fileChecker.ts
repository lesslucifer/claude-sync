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