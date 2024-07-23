import { trackChange } from "./changeTracker";
import { claudeDeleteFile, claudeUploadFile, fetchProjectDocs } from "./claudeApis";
import { addFileElement, removeFileFromUI, resetFileElementContent } from "./components/FileList";
import { readLocalFile, selectLocalFile } from "./fileUtils";
import { errCover, showConfirmationDialog } from "./helper";
import { addSyncedFile, getSyncedFiles, removeSyncedFile, updateSyncedFile } from "./storageUtils";
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
    if (!file) return

    const newFileContent = await readLocalFile(file)

    if (!newFileContent.exists || !newFileContent.fileContent) {
        await errCover(async () => {
            const localFile = await selectLocalFile()
            const uuid = await claudeUploadFile(localFile.fileName, localFile.fileContent)
            claudeDeleteFile(file.uuid).catch()
            file.filePath = localFile.filePath
            file.fileName = localFile.fileName
            file.uuid = uuid
            file.status = "synced"
            updateSyncedFile(file.id, file)
            resetFileElementContent(file)
            trackChange()
        })()
        return
    }
    
    await claudeDeleteFile(file.uuid)

    const newUuid = await claudeUploadFile(file.fileName, newFileContent.fileContent)
    file.uuid = newUuid
    file.status = "synced"
    file.lastUpdated = Date.now()
    updateSyncedFile(file.id, file)
    
    resetFileElementContent(file)
    trackChange()
})

const hardResyncDeleteFiles = async (file: SyncedFile) => {
    const projectDocs = await fetchProjectDocs();
    const filesToDelete = projectDocs.filter(doc => doc.name === file.fileName || doc.uuid === file.uuid);
  
    for (const docToDelete of filesToDelete) {
      await claudeDeleteFile(docToDelete.uuid);
    }
}

export const hardResyncFile = errCover(async (file: SyncedFile) => {
    if (!file) return;
  
    const shouldProceed = await showConfirmationDialog("Hard Resync", "This will delete all files with the same name in the project. Are you sure you want to proceed?");
    if (!shouldProceed) return;
  
    const newFileContent = await readLocalFile(file);
  
    if (!newFileContent.exists || !newFileContent.fileContent) {
        await errCover(async () => {
            const localFile = await selectLocalFile()
            const uuid = await claudeUploadFile(localFile.fileName, localFile.fileContent)
            hardResyncDeleteFiles(file).catch()
            file.filePath = localFile.filePath
            file.fileName = localFile.fileName
            file.uuid = uuid
            file.status = "synced"
            updateSyncedFile(file.id, file)
            resetFileElementContent(file)
            trackChange()
        })()
        return
    }
    
    hardResyncDeleteFiles(file).catch()
    const newUuid = await claudeUploadFile(file.fileName, newFileContent.fileContent);
    file.uuid = newUuid;
    file.status = "synced";
    file.lastUpdated = Date.now();
    updateSyncedFile(file.id, file);
    
    resetFileElementContent(file);
    trackChange();
  });