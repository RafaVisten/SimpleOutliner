// Data management and persistence
export let appData = {
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

export function saveData() {
    localStorage.setItem('outlinerData', JSON.stringify(appData));
}

export function loadData() {
    const saved = localStorage.getItem('outlinerData');
    if (saved) {
        try {
            const parsedData = JSON.parse(saved);
            // Validate the data structure
            if (parsedData && parsedData.pages && Array.isArray(parsedData.pages)) {
                Object.assign(appData, parsedData);
            } else {
                console.warn('Invalid saved data, using default');
            }
        } catch (e) {
            console.warn('Failed to parse saved data, using default');
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

export function generateId() {
    return 'node' + (++nodeCounter);
}

export function generatePageId() {
    return 'page' + (++pageCounter);
}

export function saveToClipboard() {
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

export function loadFromPrompt() {
    const jsonData = prompt('Paste your JSON data here:');
    if (!jsonData) return;

    try {
        const parsedData = JSON.parse(jsonData);
        if (parsedData && parsedData.pages && Array.isArray(parsedData.pages)) {
            Object.assign(appData, {
                pages: parsedData.pages,
                currentPageId: parsedData.currentPageId || parsedData.pages[0]?.id || '',
                focusedNodeId: null,
                focusPath: []
            });

            nodeCounter = findMaxNodeId();
            pageCounter = findMaxPageId();
            
            saveData();
            
            // Import render functions dynamically to avoid circular dependency
            import('./renderer.js').then(({ renderPageTabs, renderOutline, renderBreadcrumb, renderBacklinks }) => {
                loadData();
                renderPageTabs();
                renderOutline();
                renderBreadcrumb();
                renderBacklinks();
                alert('Data loaded successfully!');
            });
        } else {
            alert('Invalid data format. Please check your JSON.');
        }
    } catch (e) {
        alert('Failed to parse JSON. Please check your data.');
        console.error('Failed to parse JSON:', e);
    }
}

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