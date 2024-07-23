import { trackChange } from "./changeTracker";
import { claudeDeleteFile, claudeUploadFile } from "./claudeApis";
import { addFileElement, removeFileFromUI, resetFileElementContent } from "./components/FileList";
import { readLocalFile, selectLocalFile } from "./fileUtils";
import { errCover } from "./helper";
import { removeSyncedFile, addSyncedFile, getSyncedFiles, updateSyncedFile } from "./storageUtils";
import { createSyncedFile, SyncedFile } from "./types";

export const selectAndUploadFile = errCover(async () => {
    const localFile = await selectLocalFile()
    const uuid = await claudeUploadFile(localFile.fileName, localFile.fileContent)
    const file = createSyncedFile({
        fileName: localFile.fileName,
        filePath: localFile.filePath,
        lastUpdated: Date.now(),
        status: "synced",
        uuid: uuid
    })
    const storedFile = addSyncedFile(file)
    addFileElement(storedFile)
    trackChange()
})

export const deleteSyncFile = errCover(async (fileId: string) => {
    const file = getSyncedFiles()[fileId];
    if (file) {
        await claudeDeleteFile(file.uuid)
        removeSyncedFile(fileId)
        removeFileFromUI(fileId)
        trackChange()
    }
})

export const resyncFile = errCover(async (file: SyncedFile) => {
    const newFileContent = await readLocalFile(file)

    if (!newFileContent.exists || !newFileContent.fileContent) {
        await deleteSyncFile(file.id)
        return
    }
    
    await claudeDeleteFile(file.uuid)
    removeSyncedFile(file.id)
    const newUuid = await claudeUploadFile(file.fileName, newFileContent.fileContent)
    
    const newFile = createSyncedFile({
        uuid: newUuid,
        fileName: file.fileName,
        filePath: file.filePath,
        lastUpdated: Date.now(),
        status: 'synced'
    })

    const storedFile = updateSyncedFile(file.id, newFile)
    resetFileElementContent(storedFile, undefined, file.id)
    trackChange()
})
