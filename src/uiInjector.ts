import { loadSyncedFiles } from './appService';
import { updateSyncAllButtonVisibility } from './components/Header';
import { createSyncFileSection } from './components/SyncFileSection';
import { startFileChecking } from './fileChecker';

let projectSectionElem: Element | null;

const injectSyncFileSection = (): void => {
  const observer = new MutationObserver((mutations, obs) => {
    const allUploadFileInputs = document.querySelectorAll('[data-testid="project-doc-upload"]');
    const uploadFileInput = allUploadFileInputs.length ? allUploadFileInputs[allUploadFileInputs.length - 1] : null;
    if (uploadFileInput && uploadFileInput.parentNode?.parentNode) {
      obs.disconnect();

      projectSectionElem = uploadFileInput.parentNode?.parentElement;
      const syncFileSection = createSyncFileSection()
      syncFileSection.classList.add('sync-file-section');
      projectSectionElem?.parentNode?.insertBefore(syncFileSection, projectSectionElem);

      loadSyncedFiles().then(() => {
        startFileChecking();
      }).catch()
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
};

injectSyncFileSection();