let appData = {
    pages: [
        {
            id: 'page1',
            name: 'Main Page',
            nodes: [
                {
                    id: 'node1',
                    content: 'Welcome to your outliner',
                    children: [
                        {
                            id: 'node2',
                            content: 'Press Enter to create a new node at the same level',
                            children: []
                        },
                        {
                            id: 'node3',
                            content: 'Press Ctrl+Enter to create a child node',
                            children: []
                        },
                        {
                            id: 'node4',
                            content: 'Click a bullet point to focus on that node',
                            children: []
                        },
                        {
                            id: 'node5',
                            content: 'Use [[Page Name]] to link to other pages',
                            children: []
                        }
                    ]
                }
            ]
        }
    ],
    currentPageId: 'page1',
    focusedNodeId: null,
    focusPath: []
};

let nodeCounter = 6;
let pageCounter = 2;

function saveData() {
    localStorage.setItem('outlinerData', JSON.stringify(appData));
}

function loadData() {
    const saved = localStorage.getItem('outlinerData');
    if (saved) {
        try {
            const parsedData = JSON.parse(saved);
            // Validate the data structure
            if (parsedData && parsedData.pages && Array.isArray(parsedData.pages)) {
                appData = parsedData;
            } else {
                console.warn('Invalid saved data, using default');
                // Keep default appData
            }
        } catch (e) {
            console.warn('Failed to parse saved data, using default');
            // Keep default appData
        }
    }
    
    // Ensure we have at least one page
    if (!appData.pages || appData.pages.length === 0) {
        appData.pages = [
            {
                id: 'page1',
                name: 'Main Page',
                nodes: [
                    {
                        id: 'node1',
                        content: 'Welcome to your outliner',
                        children: [
                            {
                                id: 'node2',
                                content: 'Press Enter to create a new node at the same level',
                                children: []
                            },
                            {
                                id: 'node3',
                                content: 'Press Ctrl+Enter to create a child node',
                                children: []
                            },
                            {
                                id: 'node4',
                                content: 'Click a bullet point to focus on that node',
                                children: []
                            },
                            {
                                id: 'node5',
                                content: 'Use [[Page Name]] to link to other pages',
                                children: []
                            }
                        ]
                    }
                ]
            }
        ];
        appData.currentPageId = 'page1';
        appData.focusedNodeId = null;
        appData.focusPath = [];
    }
    
    // Ensure currentPageId is valid
    if (!appData.currentPageId || !appData.pages.find(p => p.id === appData.currentPageId)) {
        appData.currentPageId = appData.pages[0].id;
    }

    // Ensure all nodes have a collapsed property
    function ensureCollapsedProperty(nodes) {
        nodes.forEach(node => {
            if (node.collapsed === undefined) {
                node.collapsed = false;
            }
            ensureCollapsedProperty(node.children);
        });
    }

    if (appData.pages) {
        appData.pages.forEach(page => {
            ensureCollapsedProperty(page.nodes);
        });
    }
}

function generateId() {
    return 'node' + (++nodeCounter);
}

function generatePageId() {
    return 'page' + (++pageCounter);
}

function getCurrentPage() {
    return appData.pages.find(p => p.id === appData.currentPageId);
}

function findNodeById(nodes, id) {
    for (let node of nodes) {
        if (node.id === id) return node;
        const found = findNodeById(node.children, id);
        if (found) return found;
    }
    return null;
}

function findNodeInAllPages(id) {
    for (let page of appData.pages) {
        const found = findNodeById(page.nodes, id);
        if (found) return { page, node: found };
    }
    return null;
}

function getVisibleNodes() {
    const currentPage = getCurrentPage();
    if (!currentPage) return [];

    if (appData.focusedNodeId) {
        const focused = findNodeById(currentPage.nodes, appData.focusedNodeId);
        return focused ? focused.children : [];
    }
    return currentPage.nodes;
}

function renderPageTabs() {
    const tabsContainer = document.getElementById('pageTabs');
    if (!tabsContainer) return;
    
    tabsContainer.innerHTML = '';

    // Safety check
    if (!appData.pages || !Array.isArray(appData.pages)) {
        console.error('appData.pages is not an array:', appData.pages);
        return;
    }

    appData.pages.forEach(page => {
        const tab = document.createElement('div');
        tab.className = 'page-tab';
        tab.textContent = page.name;
        if (page.id === appData.currentPageId) {
            tab.classList.add('active');
        }
        tab.onclick = () => switchToPage(page.id);
        tabsContainer.appendChild(tab);
    });
}

function switchToPage(pageId) {
    appData.currentPageId = pageId;
    appData.focusedNodeId = null;
    appData.focusPath = [];
    renderOutline();
    renderPageTabs();
    renderBreadcrumb();
    renderBacklinks();
    saveData();
}

function addNewPage() {
    const name = prompt('Enter page name:');
    if (!name) return;

    // Safety check
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

function renderBreadcrumb() {
    const breadcrumbEl = document.getElementById('breadcrumb');
    
    if (!appData.focusedNodeId) {
        breadcrumbEl.style.display = 'none';
        return;
    }

    breadcrumbEl.style.display = 'block';
    const currentPage = getCurrentPage();
    let breadcrumbHtml = `<span class="breadcrumb-link" onclick="unfocus()">${currentPage.name}</span>`;
    
    appData.focusPath.forEach((nodeId, index) => {
        const node = findNodeById(currentPage.nodes, nodeId);
        if (node) {
            const isLast = index === appData.focusPath.length - 1;
            if (isLast) {
                breadcrumbHtml += ` > ${node.content || 'Untitled'}`;
            } else {
                breadcrumbHtml += ` > <span class="breadcrumb-link" onclick="focusOnPath(${index})">${node.content || 'Untitled'}</span>`;
            }
        }
    });

    breadcrumbEl.innerHTML = breadcrumbHtml;
}

function unfocus() {
    appData.focusedNodeId = null;
    appData.focusPath = [];
    renderOutline();
    renderBreadcrumb();
}

function focusOnPath(pathIndex) {
    appData.focusPath = appData.focusPath.slice(0, pathIndex + 1);
    appData.focusedNodeId = appData.focusPath[pathIndex];
    renderOutline();
    renderBreadcrumb();
}

function focusOnNode(nodeId) {
    const currentPage = getCurrentPage();
    const path = findPathToNode(currentPage.nodes, nodeId, []);
    if (path) {
        appData.focusedNodeId = nodeId;
        appData.focusPath = path;
        renderOutline();
        renderBreadcrumb();
        saveData();
    }
}

function findPathToNode(nodes, targetId, currentPath) {
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

function renderNode(node, level = 0) {
    const nodeEl = document.createElement('div');
    nodeEl.className = 'node';
    nodeEl.innerHTML = `
        <div class="node-content">
            <div class="bullet ${node.collapsed ? 'collapsed' : ''}" onclick="handleBulletClick(event, '${node.id}')"></div>            <textarea class="node-input" rows="1" data-node-id="${node.id}" placeholder="Type here...">${node.content}</textarea>
        </div>
        <div class="children"></div>
    `;

    const input = nodeEl.querySelector('.node-input');
    const childrenContainer = nodeEl.querySelector('.children');

    // Auto-resize textarea
    input.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = this.scrollHeight + 'px';
        
        // Update node content
        node.content = this.value;
        saveData();
        
        // Re-render to update links
        setTimeout(() => renderBacklinks(), 100);
    });

    // Process content for links
    input.addEventListener('blur', function() {
        renderNodeContent(input, node.content);
    });

    input.addEventListener('focus', function() {
        input.innerHTML = '';
        input.value = node.content;
    });

    // Handle keyboard events
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (e.ctrlKey) {
                createChildNode(node);
            } else {
                createSiblingNode(node);
            }
        } else if (e.key === 'Backspace' && input.value === '') {
            e.preventDefault();
            deleteNode(node);
        }
    });

    // Initial content rendering
    setTimeout(() => {
        input.style.height = input.scrollHeight + 'px';
        renderNodeContent(input, node.content);
    });

    // Render children (only if not collapsed)
    if (!node.collapsed) {
        node.children.forEach(child => {
            childrenContainer.appendChild(renderNode(child, level + 1));
        });
    }

    return nodeEl;
}

function handleBulletClick(event, nodeId) {
    event.preventDefault();
    event.stopPropagation();

    if (event.ctrlKey || event.metaKey) {
        toggleNodeCollapse(nodeId);
    } else {
        focusOnNode(nodeId);
    }
}

function toggleNodeCollapse(nodeId) {
    const currentPage = getCurrentPage();
    const node = findNodeById(currentPage.nodes, nodeId);
    
    if (node && node.children.length > 0) {
        node.collapsed = !node.collapsed;
        renderOutline();
        saveData();
    }
}

function renderNodeContent(input, content) {
    if (document.activeElement === input) return;
    
    // Replace [[links]] with clickable elements
    const linkRegex = /\[\[([^\]]+)\]\]/g;
    let html = content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    html = html.replace(linkRegex, (match, linkText) => {
        return `<span class="node-link" onclick="navigateToPage('${linkText}')">${linkText}</span>`;
    });
    
    if (html !== content) {
        input.style.display = 'none';
        let displayEl = input.parentNode.querySelector('.node-display');
        if (!displayEl) {
            displayEl = document.createElement('div');
            displayEl.className = 'node-display';
            displayEl.style.flex = '1';
            displayEl.style.padding = '4px 0';
            displayEl.style.lineHeight = '1.5';
            displayEl.style.cursor = 'text';
            displayEl.onclick = () => {
                displayEl.style.display = 'none';
                input.style.display = 'block';
                input.focus();
            };
            input.parentNode.insertBefore(displayEl, input);
        }
        displayEl.innerHTML = html;
    }
}

function navigateToPage(pageName) {
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

function createSiblingNode(referenceNode) {
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
    
    renderOutline();
    
    // Focus the new node
    setTimeout(() => {
        const newInput = document.querySelector(`[data-node-id="${newNode.id}"]`);
        if (newInput) newInput.focus();
    }, 50);
    
    saveData();
}

function createChildNode(parentNode) {
    const newNode = {
        id: generateId(),
        content: '',
        children: []
    };

    parentNode.children.push(newNode);
    renderOutline();
    
    // Focus the new node
    setTimeout(() => {
        const newInput = document.querySelector(`[data-node-id="${newNode.id}"]`);
        if (newInput) newInput.focus();
    }, 50);
    
    saveData();
}

function deleteNode(nodeToDelete) {
    const currentPage = getCurrentPage();
    const visibleNodes = getVisibleNodes();
    
    // Find the previous node to focus on
    let previousNodeId = null;
    const findPreviousNode = (nodes, targetId, prevId = null) => {
        for (let i = 0; i < nodes.length; i++) {
            if (nodes[i].id === targetId) {
                return prevId;
            }
            const prevInChildren = findPreviousNode(nodes[i].children, targetId, nodes[i].id);
            if (prevInChildren) return prevInChildren;
            
            // Check if any child contains the target
            if (findNodeById(nodes[i].children, targetId)) {
                return nodes[i].id;
            }
        }
        return null;
    };
    
    // Get the previous node in the visible hierarchy
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
            deletePage(currentPage.id);
            return;
        }
        // If we're focused and this is the only child, don't delete
        if (appData.focusedNodeId) {
            return;
        }
    }

    removeNodeFromTree(currentPage.nodes, nodeToDelete.id);
    renderOutline();
    
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

function deletePage(pageId) {
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

    renderPageTabs();
    saveData();
}

function findParentNode(nodes, targetId) {
    for (let node of nodes) {
        if (node.children.some(child => child.id === targetId)) {
            return node;
        }
        const found = findParentNode(node.children, targetId);
        if (found) return found;
    }
    return null;
}

function removeNodeFromTree(nodes, targetId) {
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

function findAllLinks() {
    const links = new Map(); // pageName -> [{ pageId, nodeId, content }]
    
    appData.pages.forEach(page => {
        const collectLinks = (nodes) => {
            nodes.forEach(node => {
                const linkRegex = /\[\[([^\]]+)\]\]/g;
                let match;
                while ((match = linkRegex.exec(node.content)) !== null) {
                    const linkTarget = match[1];
                    if (!links.has(linkTarget)) {
                        links.set(linkTarget, []);
                    }
                    links.get(linkTarget).push({
                        pageId: page.id,
                        pageName: page.name,
                        nodeId: node.id,
                        content: node.content
                    });
                }
                collectLinks(node.children);
            });
        };
        collectLinks(page.nodes);
    });
    
    return links;
}

function renderBacklinks() {
    const backlinksEl = document.getElementById('backlinks');
    const currentPage = getCurrentPage();
    if (!currentPage) return;

    const allLinks = findAllLinks();
    const backlinks = allLinks.get(currentPage.name) || [];

    if (backlinks.length === 0) {
        backlinksEl.style.display = 'none';
        return;
    }

    backlinksEl.style.display = 'block';
    let html = '<h3>Backlinks</h3>';
    
    backlinks.forEach(link => {
        html += `
            <div class="backlink-item" onclick="navigateToBacklink('${link.pageId}', '${link.nodeId}')">
                <strong>${link.pageName}</strong><br>
                ${link.content}
            </div>
        `;
    });

    backlinksEl.innerHTML = html;
}

function navigateToBacklink(pageId, nodeId) {
    switchToPage(pageId);
}

function renderOutline() {
    const container = document.getElementById('outlineContainer');
    const visibleNodes = getVisibleNodes();

    container.innerHTML = '';

    if (visibleNodes.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = 'No nodes yet. Start typing to create your first node.';
        
        // Add invisible input to capture keypresses
        const hiddenInput = document.createElement('textarea');
        hiddenInput.style.position = 'absolute';
        hiddenInput.style.opacity = '0';
        hiddenInput.style.pointerEvents = 'none';
        hiddenInput.style.height = '1px';
        hiddenInput.style.width = '1px';
        
        // Handle Enter key to create first node
        hiddenInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                createFirstNode();
            }
        });
        
        container.appendChild(emptyState);
        container.appendChild(hiddenInput);
        
        // Focus the hidden input and make the empty state clickable
        hiddenInput.focus();
        emptyState.style.cursor = 'pointer';
        emptyState.onclick = () => {
            hiddenInput.focus();
        };
        
        // Also listen for any keypress on the container
        container.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                createFirstNode();
            }
        });
        
        // Make container focusable
        container.tabIndex = 0;
        container.focus();
        
        return;
    }

    visibleNodes.forEach(node => {
        container.appendChild(renderNode(node));
    });
}

function createFirstNode() {
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

    renderOutline();
    
    // Focus the new node
    setTimeout(() => {
        const newInput = document.querySelector(`[data-node-id="${newNode.id}"]`);
        if (newInput) newInput.focus();
    }, 50);
    
    saveData();
}

function saveToClipboard() {
    // Ensure we have the latest data
    const dataToSave = {
        pages: appData.pages,
        currentPageId: appData.currentPageId,
        focusedNodeId: appData.focusedNodeId,
        focusPath: appData.focusPath
    };
    
    const data = JSON.stringify(dataToSave, null, 2);
    navigator.clipboard.writeText(data).then(() => {
        alert('Data copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy data: ', err);
        alert('Failed to copy data to clipboard. Please try again.');
    });
}

function loadFromPrompt() {
    const jsonData = prompt('Paste your JSON data here:');
    if (!jsonData) return;

    try {
        const parsedData = JSON.parse(jsonData);
        // Validate the data structure
        if (parsedData && parsedData.pages && Array.isArray(parsedData.pages)) {
            // Completely replace appData
            appData = {
                pages: parsedData.pages,
                currentPageId: parsedData.currentPageId || parsedData.pages[0]?.id || '',
                focusedNodeId: null,
                focusPath: []
            };

            // Reset counters based on loaded data
            nodeCounter = findMaxNodeId();
            pageCounter = findMaxPageId();

            // Force localStorage update
            saveData();

            // Complete UI refresh
            loadData(); // This handles data validation
            renderPageTabs();
            renderOutline();
            renderBreadcrumb();
            renderBacklinks();

            alert('Data loaded successfully!');
        } else {
            alert('Invalid data format. Please check your JSON.');
        }
    } catch (e) {
        alert('Failed to parse JSON. Please check your data.');
        console.error('Failed to parse JSON:', e);
    }
}

// Helper functions to find max IDs
function findMaxNodeId() {
    let max = 0;
    appData.pages.forEach(page => {
        const traverse = (nodes) => {
            nodes.forEach(node => {
                const num = parseInt(node.id.replace(/[^\d]/g, '') || '0');
                if (num > max) max = num;
                traverse(node.children);
            });
        };
        traverse(page.nodes);
    });
    return max;
}

function findMaxPageId() {
    let max = 0;
    appData.pages.forEach(page => {
        const num = parseInt(page.id.replace(/[^\d]/g, '') || '0');
        if (num > max) max = num;
    });
    return max;
}

// Initialize the app
function init() {
    loadData();
    renderPageTabs();
    renderOutline();
    renderBreadcrumb();
    renderBacklinks();
}

// Start the app
init();