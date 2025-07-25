// Page management functions
import { appData, generatePageId, generateId, saveData } from './data.js';
import { getCurrentPage, findNodeById, findPathToNode } from './nodes.js';

export function switchToPage(pageId) {
    appData.currentPageId = pageId;
    appData.focusedNodeId = null;
    appData.focusPath = [];
    
    // Import render functions to avoid circular dependency
    import('./renderer.js').then(({ renderOutline, renderPageSelect, renderBreadcrumb, renderBacklinks }) => {
        renderOutline();
        renderPageSelect();
        renderBreadcrumb();
        renderBacklinks();
    });
    
    saveData();
}

export function addNewPage() {
    const name = prompt('Enter page name:');
    if (!name) return;

    if (!appData.pages || !Array.isArray(appData.pages)) {
        console.error('appData.pages is not an array:', appData.pages);
        return;
    }

    const newPage = {
        id: generatePageId(),
        name: name,
        nodes: [{
            id: generateId(),
            content: '',
            children: []
        }]
    };

    appData.pages.push(newPage);
    switchToPage(newPage.id);
    
    // Focus the empty node immediately
    setTimeout(() => {
        const firstInput = document.querySelector('.node-input');
        if (firstInput) firstInput.focus();
    }, 100);
}

export function deletePage(pageId) {
    // Don't delete if it's the only page
    if (appData.pages.length <= 1) {
        return;
    }

    const pageIndex = appData.pages.findIndex(p => p.id === pageId);
    if (pageIndex === -1) return;

    appData.pages.splice(pageIndex, 1);

    // Switch to another page
    if (appData.currentPageId === pageId) {
        const newCurrentPage = appData.pages[0];
        switchToPage(newCurrentPage.id);
    }

    // Import render functions to avoid circular dependency
    import('./renderer.js').then(({ renderPageSelect }) => {
        renderPageSelect();
    });
    
    saveData();
}

export function navigateToPage(pageName) {
    let targetPage = appData.pages.find(p => p.name === pageName);
    
    if (!targetPage) {
        // Create new page with an empty node
        targetPage = {
            id: generatePageId(),
            name: pageName,
            nodes: [{
                id: generateId(),
                content: '',
                children: []
            }]
        };
        appData.pages.push(targetPage);
    }
    
    switchToPage(targetPage.id);
}

export function focusOnNode(nodeId) {
    const currentPage = getCurrentPage();
    const path = findPathToNode(currentPage.nodes, nodeId, []);
    if (path) {
        appData.focusedNodeId = nodeId;
        appData.focusPath = path;
        
        // Import render functions to avoid circular dependency
        import('./renderer.js').then(({ renderOutline, renderBreadcrumb }) => {
            renderOutline();
            renderBreadcrumb();
        });
        
        saveData();
    }
}

export function unfocus() {
    appData.focusedNodeId = null;
    appData.focusPath = [];
    
    // Import render functions to avoid circular dependency
    import('./renderer.js').then(({ renderOutline, renderBreadcrumb }) => {
        renderOutline();
        renderBreadcrumb();
    });
}

export function focusOnPath(pathIndex) {
    appData.focusPath = appData.focusPath.slice(0, pathIndex + 1);
    appData.focusedNodeId = appData.focusPath[pathIndex];
    
    // Import render functions to avoid circular dependency
    import('./renderer.js').then(({ renderOutline, renderBreadcrumb }) => {
        renderOutline();
        renderBreadcrumb();
    });
}

export function navigateToNode(nodeId) {
    const currentPage = getCurrentPage();
    const targetNode = findNodeById(currentPage.nodes, nodeId);
    
    if (targetNode) {
        // Focus on the target node
        focusOnNode(nodeId);
        
        // Scroll to and highlight the node
        setTimeout(() => {
            const nodeInput = document.querySelector(`[data-node-id="${nodeId}"]`);
            if (nodeInput) {
                nodeInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                nodeInput.focus();
                nodeInput.select();
            }
        }, 100);
    } else {
        console.warn(`Node with ID ${nodeId} not found in current page`);
    }
}

export function navigateToBacklink(pageId, nodeId) {
    switchToPage(pageId);
}