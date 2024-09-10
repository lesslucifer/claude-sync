import { trackChange } from "./changeTracker";
import { claudeDeleteFile, claudeUploadFile, fetchProjectDocs } from "./claudeApis";
import { addFileElement, getFileElement, removeFileFromUI, resetFileElementContent, updateFileList } from "./components/FileList";
import { readLocalFile, selectLocalFiles, selectWorkspacePath, verifyFileChanges } from "./fileUtils";
import { errCover, normalizePath } from "./helper";
import { getWorkspacePath, setWorkspacePath } from "./storageUtils";
import { SyncedFile } from "./types";
import { getAllFilesFromElement } from "./components/FileList";
import { runWithLoadingElement } from "./components/uiHelper";
import { updateSyncAllButtonVisibility } from "./components/Header";

export const getSyncedFilesFromClaude = async (): Promise<SyncedFile[]> => {
    const wsPath = getWorkspacePath()
    if (!wsPath) return []
    
    const docs = await fetchProjectDocs()
    return docs.map((doc: any) => {
        const content: string = doc.content ?? ''
        const headerMatch = content.match(/\/\* CLAUDE_SYNC\nPath: (.+)\n/);
        const filePath = headerMatch ? headerMatch[1] : null;
        const fileContentMatch = content.match(/\/\* CLAUDE_SYNC\nPath: [^\*]* \*\/\n\n\n/)
        const fileContent = fileContentMatch ? content.substring(fileContentMatch[0].length) : content
        return <SyncedFile> {
            fileName: doc.file_name,
            filePath: filePath && [wsPath, filePath].join('/'),
            lastUpdated: new Date(doc.created_at).getTime(),
            status: 'synced',
            uuid: doc.uuid,
            content: fileContent
        };
    }).filter(doc => !!doc.filePath);
}

export const loadSyncedFiles = async () => {
    const syncedFiles = await getSyncedFilesFromClaude();
    syncedFiles.forEach(file => addFileElement(file));
    sortFiles('name')
}

export const selectAndUploadFiles = errCover(async () => {
    const existingFiles = getAllFilesFromElement();
    const localFiles = await selectLocalFiles();
    for (const localFile of localFiles) {
        const normalizedLocalPath = normalizePath(localFile.filePath);
        const existingFile = existingFiles.find(f => normalizePath(f.filePath) === normalizedLocalPath);
        if (existingFile) {
            // File already exists, update it instead of adding a new one
            runWithLoadingElement(getFileElement(existingFile.uuid)!, () => resyncFile(existingFile))().catch();
        } else {
            const uuid = await claudeUploadFile(localFile.fileName, localFile.filePath, localFile.fileContent);
            const file: SyncedFile = {
                fileName: localFile.fileName,
                filePath: localFile.filePath,
                lastUpdated: Date.now(),
                status: 'synced',
                uuid: uuid,
                content: localFile.fileContent
            };
            addFileElement(file);
        }
    }
    trackChange();
});

export const deleteSyncFile = errCover(async (file: SyncedFile) => {
    if (file?.uuid) {
        await claudeDeleteFile(file.uuid)
        removeFileFromUI(file.uuid)
    }
})

export const resyncFile = errCover(async (file: SyncedFile) => {
    if (!file) return

    const newFileContent = await readLocalFile(file)

    if (!newFileContent.exists || !newFileContent.fileContent) {
        await errCover(async () => {
            const oldUuid = file.uuid
            const localFiles = await selectLocalFiles({ singleFile: true })
            if (!localFiles.length) return

            const localFile = localFiles[0]
            const existingFiles = getAllFilesFromElement();
            const existingFile = existingFiles.find(f => f.filePath === localFile.filePath);

            if (existingFile && existingFile.uuid !== file.uuid) {
                // The selected file already exists in the synced files, but under a different UUID
                await claudeDeleteFile(file.uuid).catch()
                file.filePath = existingFile.filePath
                file.fileName = existingFile.fileName
                file.uuid = existingFile.uuid
                file.status = existingFile.status
                file.lastUpdated = existingFile.lastUpdated
            } else {
                const uuid = await claudeUploadFile(localFile.fileName, localFile.filePath, localFile.fileContent)
                await claudeDeleteFile(file.uuid).catch()
                file.filePath = localFile.filePath
                file.fileName = localFile.fileName
                file.uuid = uuid
                file.status = "synced"
                file.lastUpdated = Date.now()
            }
            resetFileElementContent(file, oldUuid)
            trackChange()
        })()
        return
    }

    await claudeDeleteFile(file.uuid)

    const oldUuid = file.uuid
    const newUuid = await claudeUploadFile(file.fileName, file.filePath, newFileContent.fileContent)
    file.uuid = newUuid
    file.status = "synced"
    file.lastUpdated = Date.now()

    resetFileElementContent(file, oldUuid)
    trackChange()
    updateSyncAllButtonVisibility();
})

export const selectAndConfigureWorkspace = errCover(async () => {
    const path = await selectWorkspacePath();
    if (!path) return
    
    setWorkspacePath(path);
    location.reload();
});

export const sortFiles = (sortBy: 'name' | 'date'): void => {
    const files = getAllFilesFromElement();
    if (sortBy === 'name') {
        files.sort((a, b) => a.fileName.localeCompare(b.fileName));
    } else {
        files.sort((a, b) => b.lastUpdated - a.lastUpdated);
    }
    updateFileList(files);
};

export const syncAllChangedFiles = async (): Promise<void> => {
    const files = getAllFilesFromElement();
    const changedFiles = files.filter(file => file.status === 'changed');

    for (const file of changedFiles) {
        await resyncFile(file);
    }

    updateSyncAllButtonVisibility();
};