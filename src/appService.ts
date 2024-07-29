import { trackChange } from "./changeTracker";
import { claudeDeleteFile, claudeUploadFile, fetchProjectDocs } from "./claudeApis";
import { addFileElement, resetFileElementContent } from "./components/FileList";
import { readLocalFile, selectLocalFile, selectWorkspacePath } from "./fileUtils";
import { errCover, showConfirmationDialog } from "./helper";
import { getWorkspacePath, setWorkspacePath } from "./storageUtils";
import { SyncedFile } from "./types";

export const getSyncedFilesFromClaude = async (): Promise<SyncedFile[]> => {
    const wsPath = getWorkspacePath()
    if (!wsPath) return []
    
    const docs = await fetchProjectDocs()
    return docs.map((doc: any) => {
        const headerMatch = doc.content.match(/\/\* CLAUDE_SYNC\nPath: (.+)\n/);
        const filePath = headerMatch ? headerMatch[1] : null;
        return <SyncedFile> {
            fileName: doc.file_name,
            filePath: filePath && [wsPath, filePath].join('/'),
            lastUpdated: new Date(doc.created_at).getTime(),
            status: 'synced',
            uuid: doc.uuid
        };
    }).filter(doc => !!doc.filePath);
}

export const loadSyncedFiles = async () => {
    const syncedFiles = await getSyncedFilesFromClaude();
    syncedFiles.forEach(file => addFileElement(file));
}

export const selectAndUploadFile = errCover(async () => {
    const localFile = await selectLocalFile();
    const uuid = await claudeUploadFile(localFile.fileName, localFile.filePath, localFile.fileContent);
    const file: SyncedFile = {
        fileName: localFile.fileName,
        filePath: localFile.filePath,
        lastUpdated: Date.now(),
        status: 'synced',
        uuid: uuid
    };
    addFileElement(file);
    trackChange();
});

export const deleteSyncFile = errCover(async (file: SyncedFile) => {
    if (file?.uuid) {
        await claudeDeleteFile(file.uuid)
    }
})

export const resyncFile = errCover(async (file: SyncedFile) => {
    if (!file) return

    const newFileContent = await readLocalFile(file)

    if (!newFileContent.exists || !newFileContent.fileContent) {
        await errCover(async () => {
            const oldUuid = file.uuid
            const localFile = await selectLocalFile()
            const uuid = await claudeUploadFile(localFile.fileName, localFile.filePath, localFile.fileContent)
            claudeDeleteFile(file.uuid).catch()
            file.filePath = localFile.filePath
            file.fileName = localFile.fileName
            file.uuid = uuid
            file.status = "synced"
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
})

export const selectAndConfigureWorkspace = errCover(async () => {
    const path = await selectWorkspacePath();
    if (!path) return
    
    setWorkspacePath(path);
    location.reload();
});