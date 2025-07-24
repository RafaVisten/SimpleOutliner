// Link detection and management
import { appData } from './data.js';

export function findAllLinks() {
    const pageLinks = new Map(); // pageName -> [{ pageId, nodeId, content }]
    const nodeLinks = new Map(); // nodeId -> [{ pageId, nodeId, content }]
    
    appData.pages.forEach(page => {
        const collectLinks = (nodes) => {
            nodes.forEach(node => {
                // Find page links [[pageName]]
                const pageLinkRegex = /\[\[([^\]]+)\]\]/g;
                let match;
                while ((match = pageLinkRegex.exec(node.content)) !== null) {
                    const linkTarget = match[1];
                    if (!pageLinks.has(linkTarget)) {
                        pageLinks.set(linkTarget, []);
                    }
                    pageLinks.get(linkTarget).push({
                        pageId: page.id,
                        pageName: page.name,
                        nodeId: node.id,
                        content: node.content
                    });
                }
                
                // Find node links [[[nodeId]]]
                const nodeLinkRegex = /\[\[\[([^\]]+)\]\]\]/g;
                while ((match = nodeLinkRegex.exec(node.content)) !== null) {
                    const linkTarget = match[1];
                    if (!nodeLinks.has(linkTarget)) {
                        nodeLinks.set(linkTarget, []);
                    }
                    nodeLinks.get(linkTarget).push({
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
    
    return { pageLinks, nodeLinks };
}

export function renderNodeContent(input, content) {
    if (document.activeElement === input) return;
    
    // Clean up any existing display element first
    let displayEl = input.parentNode.querySelector('.node-display');
    if (displayEl) {
        displayEl.remove();
    }
    
    // Always show the input first
    input.style.display = 'block';
    
    // Replace different types of links with clickable elements
    let html = content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    // Handle [[[nodeId]]] links (node links within the same page)
    const nodeLinkRegex = /\[\[\[([^\]]+)\]\]\]/g;
    html = html.replace(nodeLinkRegex, (match, nodeId) => {
        return `<span class="node-link node-id-link" onclick="window.navigateToNode('${nodeId}')">${nodeId}</span>`;
    });
    
    // Handle [[pageName]] links (page links)
    const pageLinkRegex = /\[\[([^\]]+)\]\]/g;
    html = html.replace(pageLinkRegex, (match, linkText) => {
        return `<span class="node-link page-link" onclick="window.navigateToPage('${linkText}')">${linkText}</span>`;
    });
    
    // Handle [name](url) links (regular web links)
    const urlLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    html = html.replace(urlLinkRegex, (match, linkText, url) => {
        return `<a href="${url}" class="node-link web-link" target="_blank" rel="noopener noreferrer">${linkText}</a>`;
    });
    
    // Only create display element if there are actual links to render
    if (html !== content) {
        input.style.display = 'none';
        displayEl = document.createElement('div');
        displayEl.className = 'node-display';
        displayEl.style.flex = '1';
        displayEl.style.padding = '4px 0';
        displayEl.style.lineHeight = '1.5';
        displayEl.style.cursor = 'text';
        displayEl.style.minHeight = '1.5em'; // Ensure it takes up space
        displayEl.onclick = (e) => {
            e.stopPropagation(); // Prevent event bubbling
            displayEl.style.display = 'none';
            input.style.display = 'block';
            input.focus();
        };
        input.parentNode.insertBefore(displayEl, input);
        displayEl.innerHTML = html;
    }
}