import { getSyncedFiles } from './storageUtils';
import { createSyncFileSection } from './components/SyncFileSection';
import { addFileElement } from './components/FileList';

let projectSectionElem: Element | null;

const injectSyncFileSection = (): void => {
  const observer = new MutationObserver((mutations, obs) => {
    const allUploadFileInputs = document.querySelectorAll('[data-testid="project-doc-upload"]');
    const uploadFileInput = allUploadFileInputs.length ? allUploadFileInputs[allUploadFileInputs.length - 1] : null;
    if (uploadFileInput && uploadFileInput.parentNode?.parentNode) {
      obs.disconnect();

      projectSectionElem = uploadFileInput.parentNode?.parentElement;
      const syncFileSection = createSyncFileSection();
      syncFileSection.classList.add('sync-file-section');
      projectSectionElem?.parentNode?.insertBefore(syncFileSection, projectSectionElem);

      loadSyncedFiles();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
};

const loadSyncedFiles = (): void => {
  const syncedFiles = getSyncedFiles();
  Object.values(syncedFiles).forEach(file => addFileElement(file));
};

injectSyncFileSection();