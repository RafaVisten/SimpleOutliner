// Node utility functions for finding and manipulating nodes
import { appData, saveData, generateId } from './data.js';

export function getCurrentPage() {
    return appData.pages.find(p => p.id === appData.currentPageId);
}

export function findNodeById(nodes, id) {
    for (let node of nodes) {
        if (node.id === id) return node;
        const found = findNodeById(node.children, id);
        if (found) return found;
    }
    return null;
}

export function findNodeInAllPages(id) {
    for (let page of appData.pages) {
        const found = findNodeById(page.nodes, id);
        if (found) return { page, node: found };
    }
    return null;
}

export function getVisibleNodes() {
    const currentPage = getCurrentPage();
    if (!currentPage) return [];

    if (appData.focusedNodeId) {
        const focused = findNodeById(currentPage.nodes, appData.focusedNodeId);
        return focused ? focused.children : [];
    }
    return currentPage.nodes;
}

export function findParentNode(nodes, targetId) {
    for (let node of nodes) {
        if (node.children.some(child => child.id === targetId)) {
            return node;
        }
        const found = findParentNode(node.children, targetId);
        if (found) return found;
    }
    return null;
}

export function removeNodeFromTree(nodes, targetId) {
    for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].id === targetId) {
            nodes.splice(i, 1);
            return true;
        }
        if (removeNodeFromTree(nodes[i].children, targetId)) {
            return true;
        }
    }
    return false;
}

export function findPathToNode(nodes, targetId, currentPath) {
    for (let node of nodes) {
        const newPath = [...currentPath, node.id];
        if (node.id === targetId) {
            return newPath;
        }
        const found = findPathToNode(node.children, targetId, newPath);
        if (found) return found;
    }
    return null;
}

export function toggleNodeCollapse(nodeId) {
    const currentPage = getCurrentPage();
    const node = findNodeById(currentPage.nodes, nodeId);
    
    if (node && node.children.length > 0) {
        node.collapsed = !node.collapsed;
        return true;
    }
    return false;
}

export function createSiblingNode(referenceNode) {
    const currentPage = getCurrentPage();
    const visibleNodes = getVisibleNodes();
    
    const newNode = {
        id: generateId(),
        content: '',
        children: []
    };

    // Find parent and insert after reference node
    const parent = findParentNode(currentPage.nodes, referenceNode.id);
    const targetArray = parent ? parent.children : visibleNodes;
    const index = targetArray.findIndex(n => n.id === referenceNode.id);
    
    targetArray.splice(index + 1, 0, newNode);
    
    // Import render function to avoid circular dependency
    import('./renderer.js').then(({ renderOutline }) => {
        renderOutline();
    });
    
    // Focus the new node
    setTimeout(() => {
        const newInput = document.querySelector(`[data-node-id="${newNode.id}"]`);
        if (newInput) newInput.focus();
    }, 50);
    
    saveData();
}

export function createChildNode(parentNode) {
    const newNode = {
        id: generateId(),
        content: '',
        children: []
    };

    parentNode.children.push(newNode);
    
    // Import render function to avoid circular dependency
    import('./renderer.js').then(({ renderOutline }) => {
        renderOutline();
    });
    
    // Focus the new node
    setTimeout(() => {
        const newInput = document.querySelector(`[data-node-id="${newNode.id}"]`);
        if (newInput) newInput.focus();
    }, 50);
    
    saveData();
}

export function deleteNode(nodeToDelete) {
    const currentPage = getCurrentPage();
    const visibleNodes = getVisibleNodes();
    
    // Find the previous node to focus on
    let previousNodeId = null;
    const parent = findParentNode(currentPage.nodes, nodeToDelete.id);
    const targetArray = parent ? parent.children : visibleNodes;
    const nodeIndex = targetArray.findIndex(n => n.id === nodeToDelete.id);
    
    if (nodeIndex > 0) {
        // Focus on the previous sibling
        previousNodeId = targetArray[nodeIndex - 1].id;
    } else if (parent) {
        // Focus on the parent if this was the first child
        previousNodeId = parent.id;
    }
    
    // If this is the last node in the visible area, check if we should delete the page
    if (visibleNodes.length === 1 && visibleNodes[0].id === nodeToDelete.id) {
        // If we're at the root level and this is the only node, delete the page
        if (!appData.focusedNodeId && currentPage.nodes.length === 1) {
            import('./navigation.js').then(({ deletePage }) => {
                deletePage(currentPage.id);
            });
            return;
        }
        // If we're focused and this is the only child, don't delete
        if (appData.focusedNodeId) {
            return;
        }
    }

    removeNodeFromTree(currentPage.nodes, nodeToDelete.id);
    
    // Import render function to avoid circular dependency
    import('./renderer.js').then(({ renderOutline }) => {
        renderOutline();
    });
    
    // Focus the previous node
    if (previousNodeId) {
        setTimeout(() => {
            const previousInput = document.querySelector(`[data-node-id="${previousNodeId}"]`);
            if (previousInput) {
                previousInput.focus();
                // Position cursor at the end
                previousInput.setSelectionRange(previousInput.value.length, previousInput.value.length);
            }
        }, 50);
    }
    
    saveData();
}

export function createFirstNode() {
    const currentPage = getCurrentPage();
    if (!currentPage) return;

    const newNode = {
        id: generateId(),
        content: '',
        children: []
    };

    if (appData.focusedNodeId) {
        // Add to focused node's children
        const focusedNode = findNodeById(currentPage.nodes, appData.focusedNodeId);
        if (focusedNode) {
            focusedNode.children.push(newNode);
        }
    } else {
        // Add to root level
        currentPage.nodes.push(newNode);
    }

    // Import render function to avoid circular dependency
    import('./renderer.js').then(({ renderOutline }) => {
        renderOutline();
    });
    
    // Focus the new node
    setTimeout(() => {
        const newInput = document.querySelector(`[data-node-id="${newNode.id}"]`);
        if (newInput) newInput.focus();
    }, 50);
    
    saveData();
}