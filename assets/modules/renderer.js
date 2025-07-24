// UI rendering functions
import { appData, saveData } from './data.js';
import { getCurrentPage, getVisibleNodes, findNodeById, toggleNodeCollapse, createSiblingNode, createChildNode, deleteNode, createFirstNode } from './nodes.js';
import { switchToPage, addNewPage, focusOnNode, unfocus, focusOnPath, navigateToBacklink } from './navigation.js';
import { findAllLinks, renderNodeContent } from './links.js';

export function renderPageTabs() {
    const tabsContainer = document.getElementById('pageTabs');
    if (!tabsContainer) return;
    
    tabsContainer.innerHTML = '';

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

export function renderBreadcrumb() {
    const breadcrumbEl = document.getElementById('breadcrumb');
    
    if (!appData.focusedNodeId) {
        breadcrumbEl.style.display = 'none';
        return;
    }

    breadcrumbEl.style.display = 'block';
    const currentPage = getCurrentPage();
    let breadcrumbHtml = `<span class="breadcrumb-link" onclick="window.unfocus()">${currentPage.name}</span>`;
    
    appData.focusPath.forEach((nodeId, index) => {
        const node = findNodeById(currentPage.nodes, nodeId);
        if (node) {
            const isLast = index === appData.focusPath.length - 1;
            if (isLast) {
                breadcrumbHtml += ` > ${node.content || 'Untitled'}`;
            } else {
                breadcrumbHtml += ` > <span class="breadcrumb-link" onclick="window.focusOnPath(${index})">${node.content || 'Untitled'}</span>`;
            }
        }
    });

    breadcrumbEl.innerHTML = breadcrumbHtml;
}

export function renderNode(node, level = 0) {
    const nodeEl = document.createElement('div');
    nodeEl.className = 'node';
    nodeEl.innerHTML = `
        <div class="node-content">
            <div class="bullet ${node.collapsed ? 'collapsed' : ''}" onclick="handleBulletClick(event, '${node.id}')"></div>
            <textarea class="node-input" rows="1" data-node-id="${node.id}" placeholder="Type here...">${node.content}</textarea>
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

export function renderOutline() {
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

export function renderBacklinks() {
    const backlinksEl = document.getElementById('backlinks');
    const currentPage = getCurrentPage();
    if (!currentPage) return;

    const { pageLinks, nodeLinks } = findAllLinks();
    const pageBacklinks = pageLinks.get(currentPage.name) || [];
    
    // Also find node backlinks for nodes in the current page
    let nodeBacklinks = [];
    const collectNodeIds = (nodes) => {
        nodes.forEach(node => {
            const links = nodeLinks.get(node.id) || [];
            nodeBacklinks = nodeBacklinks.concat(links);
            collectNodeIds(node.children);
        });
    };
    collectNodeIds(currentPage.nodes);

    const totalBacklinks = pageBacklinks.length + nodeBacklinks.length;

    if (totalBacklinks === 0) {
        backlinksEl.style.display = 'none';
        return;
    }

    backlinksEl.style.display = 'block';
    let html = '<h3>Backlinks</h3>';
    
    if (pageBacklinks.length > 0) {
        html += '<h4>Page Links</h4>';
        pageBacklinks.forEach(link => {
            html += `
                <div class="backlink-item" onclick="window.navigateToBacklink('${link.pageId}', '${link.nodeId}')">
                    <strong>${link.pageName}</strong><br>
                    ${link.content}
                </div>
            `;
        });
    }
    
    if (nodeBacklinks.length > 0) {
        html += '<h4>Node Links</h4>';
        nodeBacklinks.forEach(link => {
            html += `
                <div class="backlink-item" onclick="window.navigateToBacklink('${link.pageId}', '${link.nodeId}')">
                    <strong>${link.pageName}</strong><br>
                    ${link.content}
                </div>
            `;
        });
    }

    backlinksEl.innerHTML = html;
}

// Global function for bullet click handling
window.handleBulletClick = function(event, nodeId) {
    event.preventDefault();
    event.stopPropagation();

    if (event.shiftKey) {
        // Copy node ID to clipboard
        navigator.clipboard.writeText(nodeId).then(() => {
            console.log(`Node ID ${nodeId} copied to clipboard`);
        }).catch(err => {
            console.error('Failed to copy node ID: ', err);
        });
    } else if (event.ctrlKey || event.metaKey) {
        if (toggleNodeCollapse(nodeId)) {
            renderOutline();
            saveData();
        }
    } else {
        focusOnNode(nodeId);
    }
};