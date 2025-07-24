// Main application entry point
import { loadData, exportToFile, importFromFile } from './modules/data.js';
import { renderPageTabs, renderOutline, renderBreadcrumb, renderBacklinks } from './modules/renderer.js';
import { addNewPage, navigateToPage, navigateToNode, unfocus, focusOnPath, navigateToBacklink } from './modules/navigation.js';

// Make functions globally available for HTML onclick handlers
window.addNewPage = addNewPage;
window.navigateToPage = navigateToPage;
window.navigateToNode = navigateToNode;
window.unfocus = unfocus;
window.focusOnPath = focusOnPath;
window.navigateToBacklink = navigateToBacklink;
window.exportToFile = exportToFile;
window.importFromFile = importFromFile;

function init() {
    loadData();
    renderPageTabs();
    renderOutline();
    renderBreadcrumb();
    renderBacklinks();
}

init();