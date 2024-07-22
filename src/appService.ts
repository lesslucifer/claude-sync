import { trackChange } from "./changeTracker";
import { claudeDeleteFile, claudeUploadFile } from "./claudeApis";
import { addFileElement, removeFileFromUI, resetFileElementContent } from "./components/FileList";
import { readLocalFile, selectLocalFile } from "./fileUtils";
import { errCover } from "./helper";
import { removeSyncedFile, storeSyncedFile } from "./storageUtils";
import { SyncedFile } from "./types";

export const selectAndUploadFile = errCover(async () => {
    const localFile = await selectLocalFile()
    const uuid = await claudeUploadFile(localFile.fileName, localFile.fileContent)
    const file: SyncedFile = {
        fileName: localFile.fileName,
        filePath: localFile.filePath,
        lastUpdated: Date.now(),
        status: "synced",
        uuid: uuid
    }
    storeSyncedFile(file)
    addFileElement(file)
    trackChange()
})

export const deleteSyncFile = errCover(async (fileUuid: string) => {
    await claudeDeleteFile(fileUuid)
    removeSyncedFile(fileUuid)
    removeFileFromUI(fileUuid)
    trackChange()
})

export const resyncFile = errCover(async (file: SyncedFile) => {
    const newFileContent = await readLocalFile(file)

    if (!newFileContent.exists || !newFileContent.fileContent) {
        await deleteSyncFile(file.uuid)
        return
    }
    
    await claudeDeleteFile(file.uuid)
    removeSyncedFile(file.uuid)
    const newUuid = await claudeUploadFile(file.fileName, newFileContent.fileContent)
    
    const newFile: SyncedFile = {
        uuid: newUuid,
        fileName: file.fileName,
        filePath: file.filePath,
        lastUpdated: Date.now(),
        status: 'synced'
    }

    storeSyncedFile(newFile)
    resetFileElementContent(newFile, undefined, file.uuid)
    trackChange()
})