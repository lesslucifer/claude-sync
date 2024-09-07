import { errCover } from './helper';
import { getWorkspacePath } from './storageUtils';
import { SyncedFile, SyncedFileStatus } from './types';

export const API_PORT = 38451;

export interface ISelectLocalFileOptions {
  singleFile: boolean
}

export interface ILocalFile {
  fileName: string,
  fileContent: string,
  filePath: string,
}

export const selectLocalFiles = async (opts?: ISelectLocalFileOptions): Promise<ILocalFile[]> => {
  const workspacePath = getWorkspacePath();
  if (!workspacePath) {
    throw new Error('Workspace path not configured');
  }

  const query: string[] = []
  if (opts?.singleFile) {
    query.push('singleFile')
  }

  const response = await fetch(`http://127.0.0.1:${API_PORT}/open-file?${query.join('&')}`);
  if (!response.ok) {
    throw new Error('Failed to open files');
  }
  
  const data: ILocalFile[] = await response.json();
  return data;
}

export const readLocalFile = async (file: SyncedFile): Promise<{ exists: boolean, fileContent: string }> => {
  const response = await fetch(`http://localhost:${API_PORT}/read-file?path=${encodeURIComponent(file.filePath)}`);
  if (!response.ok) {
    throw new Error('Failed to read file');
  }
  const data = await response.json();

  return {
    exists: data.exists,
    fileContent: data.fileContent
  }
};

export const checkFileStatuses = async (files: SyncedFile[]): Promise<Record<string, SyncedFileStatus>> => {
  const response = await fetch(`http://localhost:${API_PORT}/check-files`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      files: files.map(file => ({
        id: file.uuid,
        path: file.filePath
      }))
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to check files');
  }

  const results = await response.json();
  const resultById: any = results.reduce((m: any, r: any) => {
    m[r.id] = r
    return m
  }, {})

  return files.reduce((m: Record<string, SyncedFileStatus>, f) => {
    const r = resultById[f.uuid]
    m[f.uuid] = r?.exists === false ? 'deleted' : (r?.lastModified ?? 0) > f.lastUpdated ? 'changed' : 'synced'
    console.log("[checkFileStatuses]", f.fileName, (r?.lastModified ?? 0), f.lastUpdated, m[f.uuid])
    return m
  }, {})
};

export const verifyFileChanges = async (files: SyncedFile[]): Promise<Record<string, boolean>> => {
  const response = await fetch(`http://localhost:${API_PORT}/verify-file-changes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      files: await Promise.all(files.map(async file => ({
        id: file.uuid,
        path: file.filePath,
        content: file.content
      })))
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to verify file changes');
  }

  const results = await response.json();
  return results.reduce((m: Record<string, boolean>, r: any) => {
    m[r.id] = r.hasChanged;
    return m;
  }, {});
};

export const selectWorkspacePath = errCover(async () => {
  const response = await fetch(`http://127.0.0.1:${API_PORT}/select-workspace`);
  if (!response.ok) {
    throw new Error('Failed to select workspace');
  }
  const { path } = await response.json();
  return path;
});

export const openWorkspaceInFileExplorer = async (path: string): Promise<void> => {
  await fetch(`http://localhost:38451/open-workspace?path=${encodeURIComponent(path)}`);
};
