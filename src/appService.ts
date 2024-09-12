import { claudeDeleteFile, claudeUploadFile, fetchProjectDocs } from "./claudeApis";
import { addFileElement, getFileElement, removeFileFromUI, resetFileElementContent } from "./components/FolderTree";
import { runWithLoadingElement } from "./components/uiHelper";
import { readLocalFile, selectLocalFiles, selectWorkspacePath } from "./fileUtils";
import { errCover, getRelativePath, normalizePath } from "./helper";
import { getWorkspacePath, setWorkspacePath } from "./storageUtils";
import { SyncedFile } from "./types";

export class AppService {
    static FILES: SyncedFile[] = []

    static getSyncedFiles() {
        return this.FILES
    }

    static async addSyncedFile(fileName: string, filePath: string, content: string) {
        const uuid = await claudeUploadFile(fileName, filePath, content);
        const file: SyncedFile = {
            uuid,
            fileName,
            filePath,
            content,
            lastUpdated: Date.now(),
            status: 'synced'
        }

        this.FILES.push(file)
        console.log(`ADD_FILE`, file)
        addFileElement(file)
    }

    static deleteSyncFile = errCover(async (file: SyncedFile) => {
        if (!file?.uuid) return
        this.FILES = this.FILES.filter(f => f.uuid === file.uuid)
        await claudeDeleteFile(file.uuid)
        removeFileFromUI(file.uuid)
    })

    static deleteAllFilesInPath = errCover(async (path: string) => {
        path = normalizePath(path)
        const wsPath = getWorkspacePath() ?? ''
        const filesToDelete = this.FILES.filter(f => getRelativePath(wsPath, f.filePath).startsWith(path))
        this.FILES = this.FILES.filter(f => !getRelativePath(wsPath, f.filePath).startsWith(path))
        if (filesToDelete.length <= 0) return

        await Promise.all(filesToDelete.map(f => claudeDeleteFile(f.uuid)))
    })

    static async getSyncedFilesFromClaude(): Promise<SyncedFile[]> {
        const wsPath = getWorkspacePath()
        if (!wsPath) return []

        const docs = await fetchProjectDocs()
        return docs.map((doc: any) => {
            const content: string = doc.content ?? ''
            const headerMatch = content.match(/\/\* CLAUDE_SYNC\nPath: (.+)\n/);
            const filePath = headerMatch ? headerMatch[1] : null;
            const fileContentMatch = content.match(/\/\* CLAUDE_SYNC\nPath: [^\*]* \*\/\n\n\n/)
            const fileContent = fileContentMatch ? content.substring(fileContentMatch[0].length) : content
            return <SyncedFile>{
                fileName: doc.file_name,
                filePath: filePath && [wsPath, filePath].join('/'),
                lastUpdated: new Date(doc.created_at).getTime(),
                status: 'synced',
                uuid: doc.uuid,
                content: fileContent
            };
        }).filter(doc => !!doc.filePath);
    }

    static selectAndUploadFiles = errCover(async () => {
        const existingFiles = this.getSyncedFiles();
        const localFiles = await selectLocalFiles();
        for (const localFile of localFiles) {
            const normalizedLocalPath = normalizePath(localFile.filePath);
            const existingFile = existingFiles.find(f => normalizePath(f.filePath) === normalizedLocalPath);
            if (existingFile) {
                runWithLoadingElement(getFileElement(existingFile.uuid)!, () => this.resyncFile(existingFile))().catch();
            } else {
                await this.addSyncedFile(localFile.fileName, localFile.filePath, localFile.fileContent)
            }
        }
    });

    static resyncFile = errCover(async (file: SyncedFile, autoDelete = false) => {
        if (!file) return

        const newFileContent = await readLocalFile(file)

        if (!newFileContent.exists || !newFileContent.fileContent) {
            if (!autoDelete && !confirm(`The file has been removed! Do you want to delete it from claude ?`)) return
            await this.deleteSyncFile(file)
            return
        }

        const oldUuid = file.uuid
        await claudeDeleteFile(oldUuid)
        const newUuid = await claudeUploadFile(file.fileName, file.filePath, newFileContent.fileContent)
        file.uuid = newUuid
        file.status = "synced"
        file.lastUpdated = Date.now()

        const idx = this.FILES.findIndex(f => f.uuid == oldUuid)
        if (idx >= 0) {
            this.FILES[idx] = file
        }
        resetFileElementContent(file, oldUuid)
    })

    static syncAllChangedFilesInPath = errCover(async (path: string): Promise<void> => {
        path = normalizePath(path)
        const files = this.getSyncedFiles();
        const changedFiles = files.filter(file => 
            file.status !== 'synced' && getRelativePath(getWorkspacePath() ?? '', file.filePath).startsWith(path)
        );

        console.log("syncAllChangedFilesInPath", changedFiles)
    
        for (const file of changedFiles) {
            await this.resyncFile(file, true);
        }
    });

    static isFolderHasChangedFile(path: string) {
        path = normalizePath(path)
        return this.FILES.some(file => 
            file.status !== 'synced' && getRelativePath(getWorkspacePath() ?? '', file.filePath).startsWith(path)
        );
    }

    static selectAndConfigureWorkspace = errCover(async () => {
        const path = await selectWorkspacePath();
        if (!path) return

        setWorkspacePath(path);
        location.reload();
    });
}