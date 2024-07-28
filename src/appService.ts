import { trackChange } from "./changeTracker";
import { claudeDeleteFile, claudeUploadFile, fetchProjectDocs } from "./claudeApis";
import { addFileElement, removeFileFromUI, resetFileElementContent } from "./components/FileList";
import { readLocalFile, selectLocalFile } from "./fileUtils";
import { errCover, getRelativePath, showConfirmationDialog } from "./helper";
import { clearWorkspacePath, getWorkspacePath } from "./storageUtils";
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
    console.log("[loadSyncedFiles]", syncedFiles)
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
            const localFile = await selectLocalFile()
            const uuid = await claudeUploadFile(localFile.fileName, localFile.filePath, localFile.fileContent)
            claudeDeleteFile(file.uuid).catch()
            file.filePath = localFile.filePath
            file.fileName = localFile.fileName
            file.uuid = uuid
            file.status = "synced"
            resetFileElementContent(file)
            trackChange()
        })()
        return
    }

    await claudeDeleteFile(file.uuid)

    const newUuid = await claudeUploadFile(file.fileName, file.filePath, newFileContent.fileContent)
    file.uuid = newUuid
    file.status = "synced"
    file.lastUpdated = Date.now()

    resetFileElementContent(file)
    trackChange()
})

export const hardDeleteFiles = errCover(async (file: SyncedFile) => {
    if (!file) return;
    const wsPath = getWorkspacePath()
    if (!wsPath) throw new Error(`Cannot HARD delete files without Workspace configured!!`)

    const shouldProceed = await showConfirmationDialog("Hard Resync", "This will delete all files with the same relative path to a file in the project. Are you sure you want to proceed?");
    if (!shouldProceed) return;

    const files = await getSyncedFilesFromClaude()
    for (const file of files) {
        if (getRelativePath(wsPath, file.filePath) === file.filePath) {
            claudeDeleteFile(file.uuid).catch()
            removeFileFromUI(file.uuid)
            trackChange();
        }
    }
});

export const resetWorkspace = errCover(async () => {
    const confirm = await showConfirmationDialog(
        'Reset Project Workspace',
        'This will delete all synced file information and reset the workspace for this project. Are you sure you want to proceed?'
    );
    if (!confirm) return


    const files = await getSyncedFilesFromClaude()
    for (const file of files) {
        claudeDeleteFile(file.uuid).catch()
    }

    clearWorkspacePath();
    location.reload();
});