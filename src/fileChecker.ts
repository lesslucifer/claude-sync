// fileChecker.ts
import { getSyncedFiles, updateSyncedFile } from './storageUtils';
import { API_PORT } from './apiUtils';
import { checkFiles } from './fileUtils';

export const syncFileStatuses = async (): Promise<void> => {
    const files = getSyncedFiles()
    const fileStatuses = checkFiles(Object.values(files));

    try {
        const response = await fetch(`http://localhost:${API_PORT}/check-files`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ files }),
        });

        if (!response.ok) {
            throw new Error('Failed to check files');
        }

        const results = await response.json();
        results.forEach((result: any) => {
            const file = syncedFiles[result.id];
            if (file) {
                if (!result.exists) {
                    file.status = 'deleted';
                } else if (new Date(result.lastModified) > new Date(file.lastUpdated)) {
                    file.status = 'changed';
                } else {
                    file.status = 'synced';
                }
                updateSyncedFile(file);
                updateFileStatus(file);
            }
        });
    } catch (error) {
        console.error('Error checking files:', error);
    }
};

export const startFileChecking = (): void => {
    setInterval(checkFiles, 60000); // Check every minute
    checkFiles(); // Initial check
};