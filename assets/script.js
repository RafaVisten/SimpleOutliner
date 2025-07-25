// Main application entry point
import { loadData, exportToFile, importFromFile } from './modules/data.js';
import { renderPageSelect, renderOutline, renderBreadcrumb, renderBacklinks, renderFooter } from './modules/renderer.js';
import { switchToPage, addNewPage, navigateToPage, navigateToNode, unfocus, focusOnPath, navigateToBacklink } from './modules/navigation.js';

// Make functions globally available 
window.addNewPage = addNewPage;
window.navigateToPage = navigateToPage;
window.navigateToNode = navigateToNode;
window.unfocus = unfocus;
window.focusOnPath = focusOnPath;
window.navigateToBacklink = navigateToBacklink;

// Handles Import Export Buttons
document.querySelector('.control-btn.export').addEventListener('click', exportToFile);
document.querySelector('.control-btn.import').addEventListener('click', async () => {
    await importFromFile();
    window.location.reload();
});

// Global page select handler
document.addEventListener('change', (e) => {
    if (e.target.id === 'pageSelect') {
        switchToPage(e.target.value);
    }
});

function init() {
    loadData();
    renderPageSelect();
    renderOutline();
    renderBreadcrumb();
    renderBacklinks();
    renderFooter();
}

init();