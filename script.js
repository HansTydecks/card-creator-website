// Global variables
let currentTab = 'project';
let projectConfig = {
    name: 'Meine Karten',
    grid: { width: 3, height: 3 },
    maxCardCount: 9,  // Maximum cards based on grid (determines card size)
    actualCardCount: 9  // Actual cards to create (can be less than max)
};

let masterCard = {
    front: {
        backgroundColor: '#ffffff',
        borderWidth: 2,
        borderColor: '#000000',
        borderStyle: 'solid',
        watermark: '',
        watermarkSize: 12,
        watermarkPosition: 'bottom-right',
        watermarkImage: null,
        watermarkImageSize: 30,
        watermarkImageOpacity: 30,
        textboxes: [],
        imageboxes: []
    },
    back: {
        backgroundColor: '#ffffff',
        borderWidth: 2,
        borderColor: '#000000',
        borderStyle: 'solid',
        watermark: '',
        watermarkSize: 12,
        watermarkPosition: 'bottom-right',
        watermarkImage: null,
        watermarkImageSize: 30,
        watermarkImageOpacity: 30,
        textboxes: [],
        imageboxes: []
    }
};

let currentSide = 'front';

let cardContents = [];
let textboxCounter = 0;
let imageboxCounter = 0;

// Global Color Picker Functions
function initColorPickers() {
    console.log('Initializing color pickers...'); // Debug log
    
    // Initialize color preset functionality
    const presetContainers = document.querySelectorAll('.color-presets');
    console.log('Found preset containers:', presetContainers.length); // Debug log
    
    presetContainers.forEach(presetContainer => {
        const targetInput = presetContainer.getAttribute('data-target');
        console.log('Setting up container for:', targetInput); // Debug log
        
        presetContainer.addEventListener('click', (e) => {
            console.log('Color preset clicked:', e.target); // Debug log
            
            if (e.target.classList.contains('color-preset')) {
                const color = e.target.getAttribute('data-color');
                const input = document.getElementById(targetInput);
                
                console.log('Selected color:', color, 'for input:', targetInput); // Debug log
                
                if (input) {
                    // Update input value
                    input.value = color;
                    
                    // Update masterCard data
                    masterCard[currentSide][targetInput] = color;
                    
                    // Update visual indicators
                    updateColorDisplay(targetInput, color);
                    updateActivePreset(presetContainer, e.target);
                    updateCardPreview();
                }
            }
        });
    });
    
    // Initialize displays for current values
    const backgroundColor = document.getElementById('backgroundColor');
    const borderColor = document.getElementById('borderColor');
    
    if (backgroundColor && borderColor) {
        updateColorDisplay('backgroundColor', backgroundColor.value);
        updateColorDisplay('borderColor', borderColor.value);
        updateActivePresetForColor('backgroundColor', backgroundColor.value);
        updateActivePresetForColor('borderColor', borderColor.value);
    }
}

function updateColorDisplay(inputId, color) {
    const display = document.getElementById(inputId + 'Display');
    if (display) {
        display.style.backgroundColor = color;
    }
}

function updateActivePreset(container, activeElement) {
    container.querySelectorAll('.color-preset').forEach(preset => {
        preset.classList.remove('active');
    });
    activeElement.classList.add('active');
}

function updateActivePresetForColor(inputId, color) {
    const container = document.querySelector(`.color-presets[data-target="${inputId}"]`);
    if (container) {
        container.querySelectorAll('.color-preset').forEach(preset => {
            preset.classList.remove('active');
            if (preset.getAttribute('data-color') === color) {
                preset.classList.add('active');
            }
        });
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeTabs();
    initializeProject();
    initializeDesign();
    updateGridPreview();
    
    // Initialize card count display
    updateActualCardCountOptions();
    updatePageInfo();
    
    // Initialize color pickers after all other initialization
    setTimeout(() => {
        initColorPickers();
    }, 100);
});

// Tab Management
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            
            // Save current tab data before switching
            if (currentTab === 'project') {
                saveProjectConfig();
            } else if (currentTab === 'design') {
                saveMasterCard();
            } else if (currentTab === 'content') {
                saveCardContents();
            }
            
            switchTab(targetTab);
        });
    });

    // Navigation buttons
    document.getElementById('nextToDesign').addEventListener('click', () => {
        saveProjectConfig();
        switchTab('design');
    });

    document.getElementById('nextToContent').addEventListener('click', () => {
        saveMasterCard();
        generateContentInputs();
        switchTab('content');
    });

    document.getElementById('nextToExport').addEventListener('click', () => {
        saveCardContents();
        generatePDFPreview();
        switchTab('export');
    });

    document.getElementById('generatePDF').addEventListener('click', generatePDF);
}

function switchTab(tabName) {
    // Update active tab
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(tabName).classList.add('active');

    currentTab = tabName;

    // Execute tab-specific initialization functions
    if (tabName === 'design') {
        // Initialize color pickers when switching to design tab
        setTimeout(() => {
            initColorPickers();
            updateCardPreviewDimensions(); // Ensure correct card dimensions
        }, 50);
    } else if (tabName === 'content') {
        // Always regenerate content inputs (preserves existing values internally)
        if (masterCard.front.textboxes.length > 0 || masterCard.front.imageboxes.length > 0 || 
            masterCard.back.textboxes.length > 0 || masterCard.back.imageboxes.length > 0) {
            generateContentInputs();
        }
    } else if (tabName === 'export') {
        // Ensure PDF preview is generated when switching to export tab
        if (cardContents.length > 0) {
            generatePDFPreview();
        }
    }
}

// Project Setup (Tab 1)
function initializeProject() {
    const projectNameInput = document.getElementById('projectName');
    const gridInput = document.getElementById('gridInput');
    const gridPresets = document.querySelectorAll('.grid-preset');
    
    // New grid controls
    const gridWidth = document.getElementById('gridWidth');
    const gridHeight = document.getElementById('gridHeight');
    const gridWidthSlider = document.getElementById('gridWidthSlider');
    const gridHeightSlider = document.getElementById('gridHeightSlider');
    const gridWidthValue = document.getElementById('gridWidthValue');
    const gridHeightValue = document.getElementById('gridHeightValue');
    const actualCardCountSelect = document.getElementById('actualCardCount');

    // Project name
    projectNameInput.addEventListener('input', () => {
        projectConfig.name = projectNameInput.value || 'Meine Karten';
    });

    // Actual card count selection (number input)
    actualCardCountSelect.addEventListener('change', () => {
        const val = parseInt(actualCardCountSelect.value);
        if (val && val > 0) {
            projectConfig.actualCardCount = val;
        }
        updatePageInfo();
        updateCardContentsForNewGrid();
        
        // If we're currently on the content or export tab, update those as well
        const activeTab = document.querySelector('.tab-content.active');
        if (activeTab) {
            if (activeTab.id === 'content') {
                generateContentInputs();
            } else if (activeTab.id === 'export') {
                generatePDFPreview();
            }
        }
    });

    // Grid presets
    gridPresets.forEach(preset => {
        preset.addEventListener('click', () => {
            gridPresets.forEach(p => p.classList.remove('selected'));
            preset.classList.add('selected');
            
            const gridValue = preset.getAttribute('data-grid');
            const [width, height] = gridValue.split('x');
            
            // Update all controls
            updateAllGridControls(parseInt(width), parseInt(height));
        });
    });

    // Dropdown changes
    gridWidth.addEventListener('change', () => {
        const width = parseInt(gridWidth.value);
        const height = parseInt(gridHeight.value);
        updateAllGridControls(width, height);
        clearPresetSelection();
    });

    gridHeight.addEventListener('change', () => {
        const width = parseInt(gridWidth.value);
        const height = parseInt(gridHeight.value);
        updateAllGridControls(width, height);
        clearPresetSelection();
    });

    // Slider changes
    gridWidthSlider.addEventListener('input', () => {
        const width = parseInt(gridWidthSlider.value);
        const height = parseInt(gridHeight.value);
        updateAllGridControls(width, height);
        clearPresetSelection();
    });

    gridHeightSlider.addEventListener('input', () => {
        const width = parseInt(gridWidth.value);
        const height = parseInt(gridHeightSlider.value);
        updateAllGridControls(width, height);
        clearPresetSelection();
    });

    function updateAllGridControls(width, height) {
        // Update dropdowns
        gridWidth.value = width;
        gridHeight.value = height;
        
        // Update sliders
        gridWidthSlider.value = width;
        gridHeightSlider.value = height;
        
        // Update value displays
        gridWidthValue.textContent = width;
        gridHeightValue.textContent = height;
        
        // Update hidden input for backend compatibility
        gridInput.value = `${width}x${height}`;
        
        // Update project config
        updateGridFromInput(`${width}x${height}`);
    }

    function clearPresetSelection() {
        gridPresets.forEach(p => p.classList.remove('selected'));
    }
}

function updateGridFromInput(gridValue) {
    const match = gridValue.match(/^(\d+)x(\d+)$/);
    if (match) {
        projectConfig.grid.width = parseInt(match[1]);
        projectConfig.grid.height = parseInt(match[2]);
        projectConfig.maxCardCount = projectConfig.grid.width * projectConfig.grid.height;
        
        // Update actual card count dropdown - behält aktuellen Wert bei
        updateActualCardCountOptions();
        
        // Update card contents array to match new grid size
        updateCardContentsForNewGrid();
        
        updateGridPreview();
        
        // Update card preview in design tab if it exists
        if (document.getElementById('masterCard')) {
            updateCardPreview();
        }
        
        // If we're currently on the content or export tab, update those as well
        const activeTab = document.querySelector('.tab-content.active');
        if (activeTab) {
            if (activeTab.id === 'content') {
                generateContentInputs();
            } else if (activeTab.id === 'export') {
                generatePDFPreview();
            }
        }
    }
}

function updateActualCardCountOptions() {
    const input = document.getElementById('actualCardCount');
    input.value = projectConfig.actualCardCount;
    updatePageInfo();
}

function updatePageInfo() {
    const cardsPerPage = projectConfig.maxCardCount;
    const totalCards = projectConfig.actualCardCount;
    const pagesNeeded = Math.ceil(totalCards / cardsPerPage);
    
    const pageInfoEl = document.getElementById('pageInfo');
    if (pageInfoEl) {
        if (pagesNeeded > 1) {
            pageInfoEl.textContent = `\u2192 ${cardsPerPage} Karten pro Seite, ${pagesNeeded} Seiten ben\u00f6tigt`;
        } else {
            pageInfoEl.textContent = `\u2192 ${totalCards} von ${cardsPerPage} Pl\u00e4tzen auf einer Seite belegt`;
        }
    }
}

function updateCardContentsForNewGrid() {
    const currentCardCount = cardContents.length;
    const newCardCount = projectConfig.actualCardCount;
    
    if (newCardCount > currentCardCount) {
        // Add new cards with master design structure
        for (let i = currentCardCount; i < newCardCount; i++) {
            const newCard = {
                cardIndex: i,
                front: {
                    textboxes: masterCard.front.textboxes.map(() => ''),
                    imageboxes: masterCard.front.imageboxes.map(() => null)
                },
                back: {
                    textboxes: masterCard.back.textboxes.map(() => ''),
                    imageboxes: masterCard.back.imageboxes.map(() => null)
                }
            };
            cardContents.push(newCard);
        }
    } else if (newCardCount < currentCardCount) {
        // Remove excess cards
        cardContents = cardContents.slice(0, newCardCount);
    }
    
    // Update existing cards to match current master design structure
    cardContents.forEach((card, index) => {
        // Ensure front side has correct structure
        if (!card.front) card.front = { textboxes: [], imageboxes: [] };
        
        // Adjust textboxes array length
        while (card.front.textboxes.length < masterCard.front.textboxes.length) {
            card.front.textboxes.push('');
        }
        if (card.front.textboxes.length > masterCard.front.textboxes.length) {
            card.front.textboxes = card.front.textboxes.slice(0, masterCard.front.textboxes.length);
        }
        
        // Adjust imageboxes array length
        while (card.front.imageboxes.length < masterCard.front.imageboxes.length) {
            card.front.imageboxes.push(null);
        }
        if (card.front.imageboxes.length > masterCard.front.imageboxes.length) {
            card.front.imageboxes = card.front.imageboxes.slice(0, masterCard.front.imageboxes.length);
        }
        
        // Ensure back side has correct structure
        if (!card.back) card.back = { textboxes: [], imageboxes: [] };
        
        // Adjust back textboxes array length
        while (card.back.textboxes.length < masterCard.back.textboxes.length) {
            card.back.textboxes.push('');
        }
        if (card.back.textboxes.length > masterCard.back.textboxes.length) {
            card.back.textboxes = card.back.textboxes.slice(0, masterCard.back.textboxes.length);
        }
        
        // Adjust back imageboxes array length
        while (card.back.imageboxes.length < masterCard.back.imageboxes.length) {
            card.back.imageboxes.push(null);
        }
        if (card.back.imageboxes.length > masterCard.back.imageboxes.length) {
            card.back.imageboxes = card.back.imageboxes.slice(0, masterCard.back.imageboxes.length);
        }
    });
}

function updateCardContentsStructure() {
    // Update existing cards to match current master design structure
    cardContents.forEach((card, index) => {
        // Ensure front side has correct structure
        if (!card.front) card.front = { textboxes: [], imageboxes: [] };
        
        // Adjust textboxes array length
        while (card.front.textboxes.length < masterCard.front.textboxes.length) {
            card.front.textboxes.push('');
        }
        if (card.front.textboxes.length > masterCard.front.textboxes.length) {
            card.front.textboxes = card.front.textboxes.slice(0, masterCard.front.textboxes.length);
        }
        
        // Adjust imageboxes array length
        while (card.front.imageboxes.length < masterCard.front.imageboxes.length) {
            card.front.imageboxes.push(null);
        }
        if (card.front.imageboxes.length > masterCard.front.imageboxes.length) {
            card.front.imageboxes = card.front.imageboxes.slice(0, masterCard.front.imageboxes.length);
        }
        
        // Ensure back side has correct structure
        if (!card.back) card.back = { textboxes: [], imageboxes: [] };
        
        // Adjust back textboxes array length
        while (card.back.textboxes.length < masterCard.back.textboxes.length) {
            card.back.textboxes.push('');
        }
        if (card.back.textboxes.length > masterCard.back.textboxes.length) {
            card.back.textboxes = card.back.textboxes.slice(0, masterCard.back.textboxes.length);
        }
        
        // Adjust back imageboxes array length
        while (card.back.imageboxes.length < masterCard.back.imageboxes.length) {
            card.back.imageboxes.push(null);
        }
        if (card.back.imageboxes.length > masterCard.back.imageboxes.length) {
            card.back.imageboxes = card.back.imageboxes.slice(0, masterCard.back.imageboxes.length);
        }
    });
}

function updateGridPreview() {
    const preview = document.getElementById('gridPreview');
    const { width, height } = projectConfig.grid;
    
    preview.style.gridTemplateColumns = `repeat(${width}, 1fr)`;
    preview.style.gridTemplateRows = `repeat(${height}, 1fr)`;
    
    preview.innerHTML = '';
    // Always show the full grid (maxCardCount) to visualize card size
    for (let i = 0; i < projectConfig.maxCardCount; i++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.textContent = `Karte ${i + 1}`;
        preview.appendChild(cell);
    }
    
    // Update card preview dimensions to match grid proportions
    updateCardPreviewDimensions();
}

function updateCardPreviewDimensions() {
    const cardTemplate = document.getElementById('masterCard');
    if (!cardTemplate) return;
    
    const { width, height } = projectConfig.grid;
    
    // Calculate card aspect ratio based on A4 paper (210mm x 297mm) divided by grid
    const a4Width = 210;
    const a4Height = 297;
    
    // Account for margins (approximately 20mm on each side)
    const usableWidth = a4Width - 40;
    const usableHeight = a4Height - 40;
    
    const cardWidth = usableWidth / width;
    const cardHeight = usableHeight / height;
    
    // Calculate aspect ratio
    const aspectRatio = cardWidth / cardHeight;
    
    // Use a larger base size for better usability
    // Minimum height of 350px for small grids, scale up for larger grids
    const baseHeight = Math.max(350, 280 + (Math.max(width, height) - 3) * 30);
    const previewHeight = baseHeight;
    const previewWidth = previewHeight * aspectRatio;
    
    // Ensure minimum width of 250px for usability
    const finalWidth = Math.max(250, previewWidth);
    const finalHeight = aspectRatio < 1 ? finalWidth / aspectRatio : previewHeight;
    
    // Apply dimensions
    cardTemplate.style.width = `${finalWidth}px`;
    cardTemplate.style.height = `${finalHeight}px`;
    
    console.log(`Grid: ${width}x${height}, Card dimensions: ${cardWidth.toFixed(1)}mm x ${cardHeight.toFixed(1)}mm, Preview: ${finalWidth.toFixed(0)}px x ${finalHeight.toFixed(0)}px`);
}

function saveProjectConfig() {
    projectConfig.name = document.getElementById('projectName').value || 'Meine Karten';
    
    // Speichere den aktuellen actualCardCount Wert
    const actualCardCountInput = document.getElementById('actualCardCount');
    const val = parseInt(actualCardCountInput.value);
    if (val && val > 0) {
        projectConfig.actualCardCount = val;
    }
    
    updateGridFromInput(document.getElementById('gridInput').value);
}

// Master Design (Tab 2)
function initializeDesign() {
    const backgroundColor = document.getElementById('backgroundColor');
    const borderWidth = document.getElementById('borderWidth');
    const borderWidthValue = document.getElementById('borderWidthValue');
    const borderColor = document.getElementById('borderColor');
    const watermarkText = document.getElementById('watermarkText');
    const watermarkSize = document.getElementById('watermarkSize');
    const watermarkSizeValue = document.getElementById('watermarkSizeValue');
    const addTextboxBtn = document.getElementById('addTextbox');
    const addImageboxBtn = document.getElementById('addImagebox');
    
    // Side selector buttons
    const frontSideBtn = document.getElementById('frontSideBtn');
    const backSideBtn = document.getElementById('backSideBtn');

    // Side switching
    frontSideBtn.addEventListener('click', () => switchSide('front'));
    backSideBtn.addEventListener('click', () => switchSide('back'));

    // Background color
    backgroundColor.addEventListener('change', () => {
        masterCard[currentSide].backgroundColor = backgroundColor.value;
        updateCardPreview();
        updateColorDisplay('backgroundColor', backgroundColor.value);
        updateActivePresetForColor('backgroundColor', backgroundColor.value);
    });

    // Border width
    borderWidth.addEventListener('input', () => {
        masterCard[currentSide].borderWidth = borderWidth.value;
        borderWidthValue.textContent = borderWidth.value + 'px';
        updateCardPreview();
    });

    // Border color
    borderColor.addEventListener('change', () => {
        masterCard[currentSide].borderColor = borderColor.value;
        updateCardPreview();
        updateColorDisplay('borderColor', borderColor.value);
        updateActivePresetForColor('borderColor', borderColor.value);
    });

    // Watermark
    watermarkText.addEventListener('input', () => {
        masterCard[currentSide].watermark = watermarkText.value;
        // Show/hide watermark options based on whether text is entered
        const hasText = watermarkText.value.trim().length > 0;
        document.getElementById('watermarkOptionsGroup').style.display = hasText ? 'block' : 'none';
        document.getElementById('watermarkPositionGroup').style.display = hasText ? 'block' : 'none';
        updateCardPreview();
    });

    // Watermark size
    watermarkSize.addEventListener('input', () => {
        masterCard[currentSide].watermarkSize = parseInt(watermarkSize.value);
        watermarkSizeValue.textContent = watermarkSize.value + 'px';
        updateCardPreview();
    });

    // Watermark position buttons
    document.querySelectorAll('.wm-pos-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.wm-pos-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            masterCard[currentSide].watermarkPosition = btn.getAttribute('data-position');
            updateCardPreview();
        });
    });

    // Watermark image
    const watermarkImageInput = document.getElementById('watermarkImage');
    const watermarkImageSize = document.getElementById('watermarkImageSize');
    const watermarkImageSizeValue = document.getElementById('watermarkImageSizeValue');
    const watermarkImageOpacity = document.getElementById('watermarkImageOpacity');
    const watermarkImageOpacityValue = document.getElementById('watermarkImageOpacityValue');
    const removeWatermarkImageBtn = document.getElementById('removeWatermarkImage');

    watermarkImageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                masterCard[currentSide].watermarkImage = ev.target.result;
                updateWatermarkImageControls();
                updateCardPreview();
            };
            reader.readAsDataURL(file);
        }
    });

    watermarkImageSize.addEventListener('input', () => {
        masterCard[currentSide].watermarkImageSize = parseInt(watermarkImageSize.value);
        watermarkImageSizeValue.textContent = watermarkImageSize.value + 'px';
        updateCardPreview();
    });

    watermarkImageOpacity.addEventListener('input', () => {
        masterCard[currentSide].watermarkImageOpacity = parseInt(watermarkImageOpacity.value);
        watermarkImageOpacityValue.textContent = watermarkImageOpacity.value + '%';
        updateCardPreview();
    });

    removeWatermarkImageBtn.addEventListener('click', () => {
        masterCard[currentSide].watermarkImage = null;
        document.getElementById('watermarkImage').value = '';
        updateWatermarkImageControls();
        updateCardPreview();
    });

    // Border style buttons
    document.querySelectorAll('.border-style-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.border-style-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            masterCard[currentSide].borderStyle = btn.getAttribute('data-style');
            updateCardPreview();
        });
    });

    // Add textbox
    addTextboxBtn.addEventListener('click', addTextbox);

    // Add imagebox
    addImageboxBtn.addEventListener('click', addImagebox);

    // Image controls event listeners
    document.getElementById('imageWidth').addEventListener('input', (e) => {
        updateImageProperty('width', e.target.value);
    });
    
    document.getElementById('imageHeight').addEventListener('input', (e) => {
        updateImageProperty('height', e.target.value);
    });
    
    document.getElementById('imageBorderWidth').addEventListener('input', (e) => {
        updateImageProperty('borderWidth', e.target.value);
        document.getElementById('imageBorderWidthValue').textContent = e.target.value + 'px';
    });
    
    document.getElementById('imageBorderColor').addEventListener('change', (e) => {
        updateImageProperty('borderColor', e.target.value);
        updateColorDisplay('imageBorderColor', e.target.value);
        updateActivePresetForColor('imageBorderColor', e.target.value);
    });
    
    document.getElementById('imageOpacity').addEventListener('input', (e) => {
        updateImageProperty('opacity', e.target.value);
        document.getElementById('imageOpacityValue').textContent = e.target.value + '%';
    });
    
    document.getElementById('lockAspectRatio').addEventListener('click', toggleAspectRatioLock);
    document.getElementById('deleteSelectedImage').addEventListener('click', deleteSelectedImage);

    // Initialize card preview
    updateCardPreview();
}

function switchSide(side) {
    currentSide = side;
    
    // Update button states
    document.getElementById('frontSideBtn').classList.remove('active');
    document.getElementById('backSideBtn').classList.remove('active');
    document.getElementById(side + 'SideBtn').classList.add('active');
    
    // Update form controls to show current side's values
    updateFormControls();
    updateElementLists();
    updateCardPreview();
}

function updateFormControls() {
    const currentCardSide = masterCard[currentSide];
    
    document.getElementById('backgroundColor').value = currentCardSide.backgroundColor;
    document.getElementById('borderWidth').value = currentCardSide.borderWidth;
    document.getElementById('borderWidthValue').textContent = currentCardSide.borderWidth + 'px';
    document.getElementById('borderColor').value = currentCardSide.borderColor;
    document.getElementById('watermarkText').value = currentCardSide.watermark;
    document.getElementById('watermarkSize').value = currentCardSide.watermarkSize || 12;
    document.getElementById('watermarkSizeValue').textContent = (currentCardSide.watermarkSize || 12) + 'px';
    
    // Show/hide watermark options
    const hasWatermark = currentCardSide.watermark.trim().length > 0;
    document.getElementById('watermarkOptionsGroup').style.display = hasWatermark ? 'block' : 'none';
    document.getElementById('watermarkPositionGroup').style.display = hasWatermark ? 'block' : 'none';
    
    // Update watermark position buttons
    document.querySelectorAll('.wm-pos-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-position') === (currentCardSide.watermarkPosition || 'bottom-right'));
    });
    
    // Update border style buttons
    document.querySelectorAll('.border-style-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-style') === (currentCardSide.borderStyle || 'solid'));
    });
    
    // Update color displays and presets
    updateColorDisplay('backgroundColor', currentCardSide.backgroundColor);
    updateColorDisplay('borderColor', currentCardSide.borderColor);
    updateActivePresetForColor('backgroundColor', currentCardSide.backgroundColor);
    updateActivePresetForColor('borderColor', currentCardSide.borderColor);

    // Update watermark image controls
    updateWatermarkImageControls();
}

function updateWatermarkImageControls() {
    const currentCardSide = masterCard[currentSide];
    const hasImage = !!currentCardSide.watermarkImage;
    document.getElementById('watermarkImagePreviewGroup').style.display = hasImage ? 'block' : 'none';
    document.getElementById('watermarkImageSizeGroup').style.display = hasImage ? 'block' : 'none';
    document.getElementById('watermarkImageOpacityGroup').style.display = hasImage ? 'block' : 'none';

    if (hasImage) {
        const previewEl = document.getElementById('watermarkImagePreview');
        previewEl.innerHTML = '';
        const img = document.createElement('img');
        img.src = currentCardSide.watermarkImage;
        img.style.maxWidth = '60px';
        img.style.maxHeight = '60px';
        previewEl.appendChild(img);
    }

    document.getElementById('watermarkImageSize').value = currentCardSide.watermarkImageSize || 30;
    document.getElementById('watermarkImageSizeValue').textContent = (currentCardSide.watermarkImageSize || 30) + 'px';
    document.getElementById('watermarkImageOpacity').value = currentCardSide.watermarkImageOpacity || 30;
    document.getElementById('watermarkImageOpacityValue').textContent = (currentCardSide.watermarkImageOpacity || 30) + '%';
}

function addTextbox() {
    // Get current card dimensions for proportional sizing
    const cardTemplate = document.getElementById('masterCard');
    const cardWidth = cardTemplate ? parseInt(cardTemplate.style.width) || 200 : 200;
    const cardHeight = cardTemplate ? parseInt(cardTemplate.style.height) || 280 : 280;
    
    // Scale default values based on card size (reference: 200x280)
    const widthScale = cardWidth / 200;
    const heightScale = cardHeight / 280;
    const avgScale = (widthScale + heightScale) / 2;
    
    const textbox = {
        id: ++textboxCounter,
        text: 'Textbox ' + textboxCounter,
        x: Math.round(10 * widthScale),
        y: Math.round(10 * heightScale),
        width: Math.round(80 * widthScale),
        height: Math.round(30 * heightScale),
        fontSize: Math.round(12 * avgScale),
        fontColor: '#000000',
        fontFamily: 'Arial',
        bold: false,
        italic: false,
        underline: false,
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        borderWidth: 0
    };

    masterCard[currentSide].textboxes.push(textbox);
    
    // Update all existing cards to match new master structure
    updateCardContentsStructure();
    
    updateElementLists();
    updateCardPreview();
}

function addImagebox() {
    // Get current card dimensions for proportional sizing
    const cardTemplate = document.getElementById('masterCard');
    const cardWidth = cardTemplate ? parseInt(cardTemplate.style.width) || 200 : 200;
    const cardHeight = cardTemplate ? parseInt(cardTemplate.style.height) || 280 : 280;
    
    // Scale default values based on card size (reference: 200x280)
    const widthScale = cardWidth / 200;
    const heightScale = cardHeight / 280;
    
    const imagebox = {
        id: ++imageboxCounter,
        name: 'Bild ' + imageboxCounter,
        x: Math.round(10 * widthScale),
        y: Math.round(50 * heightScale),
        width: Math.round(100 * widthScale),
        height: Math.round(100 * heightScale),
        image: null,
        borderWidth: 0,
        borderColor: '#000000',
        opacity: 100,
        originalAspectRatio: 1
    };

    masterCard[currentSide].imageboxes.push(imagebox);
    
    // Update all existing cards to match new master structure
    updateCardContentsStructure();
    
    updateElementLists();
    updateCardPreview();
}

function updateElementLists() {
    updateTextboxList();
    updateImageboxList();
}

function updateTextboxList() {
    const list = document.getElementById('textboxList');
    list.innerHTML = '';

    masterCard[currentSide].textboxes.forEach((textbox, index) => {
        const item = document.createElement('div');
        item.className = 'textbox-item';
        item.innerHTML = `
            <label>Textbox ${textbox.id}:</label>
            <input type="text" value="${textbox.text}" onchange="updateTextboxText(${index}, this.value)">
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px;">
                <!-- Erste Zeile: Schriftgröße und Schriftfarbe -->
                <div style="display: flex; gap: 5px; align-items: center;">
                    <label style="font-size: 12px;">Größe:</label>
                    <input type="number" value="${textbox.fontSize}" onchange="updateTextboxFontSize(${index}, this.value)" style="width: 60px;">
                </div>
                <div style="display: flex; gap: 5px; align-items: center;">
                    <label style="font-size: 12px;">Farbe:</label>
                    <input type="color" value="${textbox.fontColor}" onchange="updateTextboxColor(${index}, this.value)" style="width: 40px;">
                </div>
                
                <!-- Zweite Zeile: Schriftart und Stil-Buttons -->
                <div style="display: flex; gap: 5px; align-items: center;">
                    <label style="font-size: 12px;">Font:</label>
                    <select onchange="updateTextboxFontFamily(${index}, this.value)" style="width: 80px; font-size: 11px;">
                        <option value="Arial" ${textbox.fontFamily === 'Arial' ? 'selected' : ''}>Arial</option>
                        <option value="Times New Roman" ${textbox.fontFamily === 'Times New Roman' ? 'selected' : ''}>Times</option>
                        <option value="Helvetica" ${textbox.fontFamily === 'Helvetica' ? 'selected' : ''}>Helvetica</option>
                        <option value="Georgia" ${textbox.fontFamily === 'Georgia' ? 'selected' : ''}>Georgia</option>
                        <option value="Verdana" ${textbox.fontFamily === 'Verdana' ? 'selected' : ''}>Verdana</option>
                    </select>
                </div>
                <div style="display: flex; gap: 3px;">
                    <button onclick="toggleTextboxBold(${index})" style="padding: 2px 6px; font-size: 11px; background: ${textbox.bold ? '#0d7377' : '#444'}; color: white; border: none; border-radius: 3px;"><b>B</b></button>
                    <button onclick="toggleTextboxItalic(${index})" style="padding: 2px 6px; font-size: 11px; background: ${textbox.italic ? '#0d7377' : '#444'}; color: white; border: none; border-radius: 3px;"><i>I</i></button>
                    <button onclick="toggleTextboxUnderline(${index})" style="padding: 2px 6px; font-size: 11px; background: ${textbox.underline ? '#0d7377' : '#444'}; color: white; border: none; border-radius: 3px;"><u>U</u></button>
                </div>
                
                <!-- Dritte Zeile: Hintergrund und Rahmen -->
                <div style="display: flex; gap: 5px; align-items: center;">
                    <label style="font-size: 12px;">Hintergr.:</label>
                    <input type="color" value="${textbox.backgroundColor === 'transparent' ? '#ffffff' : textbox.backgroundColor}" onchange="updateTextboxBackgroundColor(${index}, this.value)" style="width: 40px;">
                    <button onclick="clearTextboxBackground(${index})" style="padding: 2px 4px; font-size: 10px; background: #666; color: white; border: none; border-radius: 2px;">✕</button>
                </div>
                <div style="display: flex; gap: 5px; align-items: center;">
                    <label style="font-size: 12px;">Rahmen:</label>
                    <input type="color" value="${textbox.borderColor === 'transparent' ? '#000000' : textbox.borderColor}" onchange="updateTextboxBorderColor(${index}, this.value)" style="width: 30px;">
                    <input type="number" value="${textbox.borderWidth}" onchange="updateTextboxBorderWidth(${index}, this.value)" style="width: 35px;" min="0" max="5">
                    <button onclick="clearTextboxBorder(${index})" style="padding: 2px 4px; font-size: 10px; background: #666; color: white; border: none; border-radius: 2px;">✕</button>
                </div>
            </div>
            
            <div style="margin-top: 10px;">
                <button class="btn btn-danger" onclick="removeTextbox(${index})" style="font-size: 12px; padding: 4px 8px;">Löschen</button>
            </div>
        `;
        list.appendChild(item);
    });
}

function updateTextboxText(index, text) {
    masterCard[currentSide].textboxes[index].text = text;
    updateCardPreview();
}

function updateTextboxFontSize(index, fontSize) {
    masterCard[currentSide].textboxes[index].fontSize = parseInt(fontSize) || 12;
    updateCardPreview();
}

function updateTextboxColor(index, color) {
    masterCard[currentSide].textboxes[index].fontColor = color;
    updateCardPreview();
}

function updateTextboxFontFamily(index, fontFamily) {
    masterCard[currentSide].textboxes[index].fontFamily = fontFamily;
    updateCardPreview();
}

function toggleTextboxBold(index) {
    masterCard[currentSide].textboxes[index].bold = !masterCard[currentSide].textboxes[index].bold;
    updateElementLists();
    updateCardPreview();
}

function toggleTextboxItalic(index) {
    masterCard[currentSide].textboxes[index].italic = !masterCard[currentSide].textboxes[index].italic;
    updateElementLists();
    updateCardPreview();
}

function toggleTextboxUnderline(index) {
    masterCard[currentSide].textboxes[index].underline = !masterCard[currentSide].textboxes[index].underline;
    updateElementLists();
    updateCardPreview();
}

function updateTextboxBackgroundColor(index, color) {
    masterCard[currentSide].textboxes[index].backgroundColor = color;
    updateCardPreview();
}

function clearTextboxBackground(index) {
    masterCard[currentSide].textboxes[index].backgroundColor = 'transparent';
    updateElementLists();
    updateCardPreview();
}

function updateTextboxBorderColor(index, color) {
    masterCard[currentSide].textboxes[index].borderColor = color;
    updateCardPreview();
}

function updateTextboxBorderWidth(index, width) {
    masterCard[currentSide].textboxes[index].borderWidth = parseInt(width) || 0;
    updateCardPreview();
}

function clearTextboxBorder(index) {
    masterCard[currentSide].textboxes[index].borderColor = 'transparent';
    masterCard[currentSide].textboxes[index].borderWidth = 0;
    updateElementLists();
    updateCardPreview();
}

function removeTextbox(index) {
    masterCard[currentSide].textboxes.splice(index, 1);
    
    // Update all existing cards to match new master structure
    updateCardContentsStructure();
    
    updateElementLists();
    updateCardPreview();
}

function updateImageboxList() {
    const list = document.getElementById('imageboxList');
    list.innerHTML = '';

    masterCard[currentSide].imageboxes.forEach((imagebox, index) => {
        const item = document.createElement('div');
        item.className = 'imagebox-item';
        item.innerHTML = `
            <label>Bildbereich ${imagebox.id}:</label>
            <input type="text" value="${imagebox.name}" onchange="updateImageboxName(${index}, this.value)" placeholder="Name für Bildbereich">
            <div style="display: flex; gap: 10px; margin-top: 5px; align-items: center;">
                <button class="btn btn-danger" onclick="removeImagebox(${index})">Bildbereich löschen</button>
            </div>
            <div style="margin-top: 10px;">
                <button class="btn btn-secondary" onclick="selectImageForEditing(${index})" style="font-size: 12px; padding: 5px 10px;">
                    Bereich-Eigenschaften bearbeiten
                </button>
            </div>
            <div style="margin-top: 5px; font-size: 12px; color: #666;">
                💡 Bilder werden später bei den Karteninhalten hochgeladen
            </div>
        `;
        list.appendChild(item);
    });
}

function updateImageboxName(index, name) {
    masterCard[currentSide].imageboxes[index].name = name;
    updateCardPreview();
}

function updateImageboxImage(index, input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            // Create a temporary image to get dimensions
            const img = new Image();
            img.onload = function() {
                const aspectRatio = this.width / this.height;
                masterCard[currentSide].imageboxes[index].image = e.target.result;
                masterCard[currentSide].imageboxes[index].originalAspectRatio = aspectRatio;
                
                // Adjust height to maintain aspect ratio if needed
                const imagebox = masterCard[currentSide].imageboxes[index];
                imagebox.height = Math.round(imagebox.width / aspectRatio);
                
                updateElementLists();
                updateCardPreview();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

function removeImagebox(index) {
    masterCard[currentSide].imageboxes.splice(index, 1);
    
    // Update all existing cards to match new master structure
    updateCardContentsStructure();
    
    // Hide image controls panel if it was visible
    document.getElementById('imageControlsPanel').style.display = 'none';
    selectedImageIndex = -1;
    
    updateElementLists();
    updateCardPreview();
}

// Variable to track selected image
let selectedImageIndex = -1;
let aspectRatioLocked = false;

function selectImageForEditing(index) {
    selectedImageIndex = index;
    const imagebox = masterCard[currentSide].imageboxes[index];
    
    // Show image controls panel
    const panel = document.getElementById('imageControlsPanel');
    panel.style.display = 'block';
    
    // Populate controls with current values
    document.getElementById('imageWidth').value = imagebox.width;
    document.getElementById('imageHeight').value = imagebox.height;
    document.getElementById('imageBorderWidth').value = imagebox.borderWidth;
    document.getElementById('imageBorderWidthValue').textContent = imagebox.borderWidth + 'px';
    document.getElementById('imageBorderColor').value = imagebox.borderColor;
    document.getElementById('imageOpacity').value = imagebox.opacity;
    document.getElementById('imageOpacityValue').textContent = imagebox.opacity + '%';
    
    // Update color display and presets
    updateColorDisplay('imageBorderColor', imagebox.borderColor);
    updateActivePresetForColor('imageBorderColor', imagebox.borderColor);
    
    // Highlight selected image in preview
    updateCardPreview();
}

function updateImageProperty(property, value) {
    if (selectedImageIndex >= 0) {
        const imagebox = masterCard[currentSide].imageboxes[selectedImageIndex];
        
        if (property === 'width') {
            imagebox.width = parseInt(value);
            if (aspectRatioLocked && imagebox.originalAspectRatio) {
                imagebox.height = Math.round(imagebox.width / imagebox.originalAspectRatio);
                document.getElementById('imageHeight').value = imagebox.height;
            }
        } else if (property === 'height') {
            imagebox.height = parseInt(value);
            if (aspectRatioLocked && imagebox.originalAspectRatio) {
                imagebox.width = Math.round(imagebox.height * imagebox.originalAspectRatio);
                document.getElementById('imageWidth').value = imagebox.width;
            }
        } else {
            imagebox[property] = value;
        }
        
        updateCardPreview();
    }
}

function toggleAspectRatioLock() {
    aspectRatioLocked = !aspectRatioLocked;
    const button = document.getElementById('lockAspectRatio');
    button.textContent = aspectRatioLocked ? '🔒' : '🔓';
    button.title = aspectRatioLocked ? 'Seitenverhältnis freigeben' : 'Seitenverhältnis beibehalten';
}

function deleteSelectedImage() {
    if (selectedImageIndex >= 0) {
        removeImagebox(selectedImageIndex);
    }
}

function updateCardPreview() {
    const card = document.getElementById('masterCard');
    const currentCardSide = masterCard[currentSide];
    
    // Ensure card dimensions match current grid proportions
    updateCardPreviewDimensions();
    
    // Apply basic styles
    card.style.backgroundColor = currentCardSide.backgroundColor;
    card.style.borderWidth = currentCardSide.borderWidth + 'px';
    card.style.borderColor = currentCardSide.borderColor;
    card.style.borderStyle = currentCardSide.borderStyle || 'solid';

    // No background image support anymore
    card.style.backgroundImage = 'none';

    // Clear existing content
    card.innerHTML = '';

    // Add textboxes
    currentCardSide.textboxes.forEach((textbox, index) => {
        const textboxElement = document.createElement('div');
        textboxElement.className = 'card-textbox';
        textboxElement.textContent = textbox.text;
        textboxElement.style.left = textbox.x + 'px';
        textboxElement.style.top = textbox.y + 'px';
        
        // Use explicit width/height for resizable elements
        textboxElement.style.width = Math.max(textbox.width, 40) + 'px';
        textboxElement.style.height = Math.max(textbox.height, 20) + 'px';
        
        textboxElement.style.fontSize = textbox.fontSize + 'px';
        textboxElement.style.color = textbox.fontColor;
        
        // Apply new style properties
        textboxElement.style.fontFamily = textbox.fontFamily || 'Arial';
        textboxElement.style.fontWeight = textbox.bold ? 'bold' : 'normal';
        textboxElement.style.fontStyle = textbox.italic ? 'italic' : 'normal';
        textboxElement.style.textDecoration = textbox.underline ? 'underline' : 'none';
        
        // Apply background color
        if (textbox.backgroundColor && textbox.backgroundColor !== 'transparent') {
            textboxElement.style.backgroundColor = textbox.backgroundColor;
        } else {
            textboxElement.style.backgroundColor = 'rgba(30, 30, 30, 0.9)';
        }
        
        // Apply border
        if (textbox.borderColor && textbox.borderColor !== 'transparent' && textbox.borderWidth > 0) {
            textboxElement.style.border = `${textbox.borderWidth}px solid ${textbox.borderColor}`;
        } else {
            textboxElement.style.border = '1px dashed #0d7377';
        }
        
        // Make draggable
        makeDraggable(textboxElement, 'textbox', index);
        
        // Add resize handle
        addResizeHandle(textboxElement, 'textbox', index);
        
        card.appendChild(textboxElement);
    });

    // Add imageboxes
    currentCardSide.imageboxes.forEach((imagebox, index) => {
        const imageboxElement = document.createElement('div');
        imageboxElement.className = 'card-image';
        imageboxElement.style.left = imagebox.x + 'px';
        imageboxElement.style.top = imagebox.y + 'px';
        imageboxElement.style.width = imagebox.width + 'px';
        imageboxElement.style.height = imagebox.height + 'px';
        
        // Apply border styles
        if (imagebox.borderWidth > 0) {
            imageboxElement.style.border = `${imagebox.borderWidth}px solid ${imagebox.borderColor}`;
            imageboxElement.style.boxSizing = 'border-box';
        } else {
            imageboxElement.style.border = '2px dashed #0d7377';
            imageboxElement.style.boxSizing = 'border-box';
        }
        
        // Apply opacity
        imageboxElement.style.opacity = imagebox.opacity / 100;
        
        // Highlight if selected
        if (index === selectedImageIndex) {
            imageboxElement.classList.add('selected');
        }
        
        if (imagebox.image) {
            const img = document.createElement('img');
            img.src = imagebox.image;
            img.alt = imagebox.name;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            img.style.display = 'block';
            imageboxElement.appendChild(img);
        } else {
            imageboxElement.textContent = imagebox.name;
            imageboxElement.style.display = 'flex';
            imageboxElement.style.alignItems = 'center';
            imageboxElement.style.justifyContent = 'center';
            imageboxElement.style.fontSize = '12px';
            imageboxElement.style.color = '#0d7377';
            imageboxElement.style.backgroundColor = 'rgba(13, 115, 119, 0.1)';
        }
        
        // Make draggable and clickable
        makeDraggable(imageboxElement, 'imagebox', index);
        addResizeHandle(imageboxElement, 'imagebox', index);
        imageboxElement.addEventListener('click', (e) => {
            e.stopPropagation();
            selectImageForEditing(index);
        });
        
        card.appendChild(imageboxElement);
    });

    // Add watermark with size and position
    if (currentCardSide.watermark) {
        const watermark = document.createElement('div');
        watermark.className = 'card-watermark';
        watermark.textContent = currentCardSide.watermark;
        
        const wmSize = currentCardSide.watermarkSize || 12;
        const wmPos = currentCardSide.watermarkPosition || 'bottom-right';
        watermark.style.fontSize = wmSize + 'px';
        
        // Reset positioning
        watermark.style.top = 'auto';
        watermark.style.bottom = 'auto';
        watermark.style.left = 'auto';
        watermark.style.right = 'auto';
        watermark.style.transform = 'none';
        watermark.style.textAlign = 'left';
        watermark.style.width = 'auto';
        
        switch (wmPos) {
            case 'top-left':
                watermark.style.top = '5px'; watermark.style.left = '5px'; break;
            case 'top-center':
                watermark.style.top = '5px'; watermark.style.left = '50%'; watermark.style.transform = 'translateX(-50%)'; break;
            case 'top-right':
                watermark.style.top = '5px'; watermark.style.right = '5px'; break;
            case 'middle-left':
                watermark.style.top = '50%'; watermark.style.left = '5px'; watermark.style.transform = 'translateY(-50%)'; break;
            case 'center':
                watermark.style.top = '50%'; watermark.style.left = '50%'; watermark.style.transform = 'translate(-50%, -50%)'; break;
            case 'middle-right':
                watermark.style.top = '50%'; watermark.style.right = '5px'; watermark.style.transform = 'translateY(-50%)'; break;
            case 'bottom-left':
                watermark.style.bottom = '5px'; watermark.style.left = '5px'; break;
            case 'bottom-center':
                watermark.style.bottom = '5px'; watermark.style.left = '50%'; watermark.style.transform = 'translateX(-50%)'; break;
            case 'bottom-right':
            default:
                watermark.style.bottom = '5px'; watermark.style.right = '5px'; break;
        }
        
        card.appendChild(watermark);
    }

    // Add watermark image
    if (currentCardSide.watermarkImage) {
        const wmImgEl = document.createElement('div');
        wmImgEl.style.position = 'absolute';
        wmImgEl.style.pointerEvents = 'none';
        wmImgEl.style.zIndex = '1';
        
        const wmImg = document.createElement('img');
        wmImg.src = currentCardSide.watermarkImage;
        wmImg.style.width = (currentCardSide.watermarkImageSize || 30) + 'px';
        wmImg.style.height = 'auto';
        wmImg.style.opacity = (currentCardSide.watermarkImageOpacity || 30) / 100;
        wmImg.style.display = 'block';
        wmImgEl.appendChild(wmImg);
        
        const wmPos = currentCardSide.watermarkPosition || 'bottom-right';
        wmImgEl.style.top = 'auto';
        wmImgEl.style.bottom = 'auto';
        wmImgEl.style.left = 'auto';
        wmImgEl.style.right = 'auto';
        wmImgEl.style.transform = 'none';
        
        switch (wmPos) {
            case 'top-left':
                wmImgEl.style.top = '5px'; wmImgEl.style.left = '5px'; break;
            case 'top-center':
                wmImgEl.style.top = '5px'; wmImgEl.style.left = '50%'; wmImgEl.style.transform = 'translateX(-50%)'; break;
            case 'top-right':
                wmImgEl.style.top = '5px'; wmImgEl.style.right = '5px'; break;
            case 'middle-left':
                wmImgEl.style.top = '50%'; wmImgEl.style.left = '5px'; wmImgEl.style.transform = 'translateY(-50%)'; break;
            case 'center':
                wmImgEl.style.top = '50%'; wmImgEl.style.left = '50%'; wmImgEl.style.transform = 'translate(-50%, -50%)'; break;
            case 'middle-right':
                wmImgEl.style.top = '50%'; wmImgEl.style.right = '5px'; wmImgEl.style.transform = 'translateY(-50%)'; break;
            case 'bottom-left':
                wmImgEl.style.bottom = '5px'; wmImgEl.style.left = '5px'; break;
            case 'bottom-center':
                wmImgEl.style.bottom = '5px'; wmImgEl.style.left = '50%'; wmImgEl.style.transform = 'translateX(-50%)'; break;
            case 'bottom-right':
            default:
                wmImgEl.style.bottom = '5px'; wmImgEl.style.right = '5px'; break;
        }
        
        card.appendChild(wmImgEl);
    }
}

function addResizeHandle(element, type, index) {
    const handle = document.createElement('div');
    handle.className = 'resize-handle-se';
    element.appendChild(handle);
    
    let isResizing = false;
    let startX, startY, startWidth, startHeight;
    
    handle.addEventListener('mousedown', (e) => {
        isResizing = true;
        startX = e.clientX;
        startY = e.clientY;
        startWidth = element.offsetWidth;
        startHeight = element.offsetHeight;
        e.preventDefault();
        e.stopPropagation();
        
        const onMouseMove = (e) => {
            if (!isResizing) return;
            
            const newWidth = Math.max(30, startWidth + (e.clientX - startX));
            const newHeight = Math.max(20, startHeight + (e.clientY - startY));
            
            element.style.width = newWidth + 'px';
            element.style.height = newHeight + 'px';
            
            if (type === 'textbox') {
                masterCard[currentSide].textboxes[index].width = newWidth;
                masterCard[currentSide].textboxes[index].height = newHeight;
            } else if (type === 'imagebox') {
                masterCard[currentSide].imageboxes[index].width = newWidth;
                masterCard[currentSide].imageboxes[index].height = newHeight;
                // Update image controls if panel is open
                if (index === selectedImageIndex) {
                    document.getElementById('imageWidth').value = newWidth;
                    document.getElementById('imageHeight').value = newHeight;
                }
            }
        };
        
        const onMouseUp = () => {
            isResizing = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
        
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });
}

function makeDraggable(element, type, index) {
    let isDragging = false;
    let startX, startY, initialX, initialY;

    element.addEventListener('mousedown', (e) => {
        isDragging = true;
        element.classList.add('dragging');
        
        startX = e.clientX;
        startY = e.clientY;
        
        if (type === 'textbox') {
            initialX = masterCard[currentSide].textboxes[index].x;
            initialY = masterCard[currentSide].textboxes[index].y;
        } else if (type === 'imagebox') {
            initialX = masterCard[currentSide].imageboxes[index].x;
            initialY = masterCard[currentSide].imageboxes[index].y;
        }
        
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        
        // Get current card dimensions dynamically
        const card = document.getElementById('masterCard');
        const cardRect = card.getBoundingClientRect();
        const cardWidth = cardRect.width;
        const cardHeight = cardRect.height;
        
        let elementWidth, elementHeight;
        if (type === 'textbox') {
            elementWidth = masterCard[currentSide].textboxes[index].width;
            elementHeight = masterCard[currentSide].textboxes[index].height;
        } else if (type === 'imagebox') {
            elementWidth = masterCard[currentSide].imageboxes[index].width;
            elementHeight = masterCard[currentSide].imageboxes[index].height;
        }
        
        const newX = Math.max(0, Math.min(cardWidth - elementWidth, initialX + deltaX));
        const newY = Math.max(0, Math.min(cardHeight - elementHeight, initialY + deltaY));
        
        if (type === 'textbox') {
            masterCard[currentSide].textboxes[index].x = newX;
            masterCard[currentSide].textboxes[index].y = newY;
        } else if (type === 'imagebox') {
            masterCard[currentSide].imageboxes[index].x = newX;
            masterCard[currentSide].imageboxes[index].y = newY;
        }
        
        element.style.left = newX + 'px';
        element.style.top = newY + 'px';
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        element.classList.remove('dragging');
    });
}

function saveMasterCard() {
    // Master card is already saved in real-time
    console.log('Master card saved:', masterCard);
}

// Content Input (Tab 3)
function generateContentInputs() {
    const container = document.getElementById('contentInputs');
    
    // Save existing values before regenerating
    const existingValues = {};
    if (container.innerHTML !== '') {
        const inputs = container.querySelectorAll('textarea, input[type="file"]');
        inputs.forEach(input => {
            if (input.type === 'file') {
                return;
            } else {
                existingValues[input.id] = input.value;
            }
        });
    }
    
    container.innerHTML = '';

    // Ensure card contents array is properly sized and structured
    if (cardContents.length === 0) {
        updateCardContentsForNewGrid();
    } else {
        while (cardContents.length < projectConfig.actualCardCount) {
            const newCard = {
                cardIndex: cardContents.length,
                front: {
                    textboxes: masterCard.front.textboxes.map(() => ''),
                    imageboxes: masterCard.front.imageboxes.map(() => null)
                },
                back: {
                    textboxes: masterCard.back.textboxes.map(() => ''),
                    imageboxes: masterCard.back.imageboxes.map(() => null)
                }
            };
            cardContents.push(newCard);
        }
    }

    // Add bulk paste section at the top for each textbox
    const hasFrontTextboxes = masterCard.front.textboxes.length > 0;
    const hasBackTextboxes = masterCard.back.textboxes.length > 0;
    
    if (hasFrontTextboxes || hasBackTextboxes) {
        const bulkSection = document.createElement('div');
        bulkSection.className = 'bulk-paste-section';
        bulkSection.innerHTML = '<h3>Massenimport</h3><p class="form-help">F\u00fcgen Sie Inhalte f\u00fcr alle Karten auf einmal ein. W\u00e4hlen Sie ein Trennzeichen und f\u00fcgen Sie den Text ein.</p>';
        
        // Create bulk paste for front textboxes
        if (hasFrontTextboxes) {
            masterCard.front.textboxes.forEach((textbox, textboxIndex) => {
                const bulkItem = document.createElement('div');
                bulkItem.className = 'bulk-paste-item';
                bulkItem.innerHTML = `
                    <label>\ud83d\udcc4 Vorderseite \u2013 ${textbox.text}:</label>
                    <div class="bulk-paste-controls">
                        <select id="bulkSep_front_${textboxIndex}" class="bulk-separator-select">
                            <option value="newline">Zeilenumbruch</option>
                            <option value="comma">Komma (,)</option>
                            <option value="semicolon">Semikolon (;)</option>
                            <option value="tab">Tabulator</option>
                        </select>
                        <button class="btn btn-secondary btn-small" onclick="toggleBulkPaste('front', ${textboxIndex})">Einf\u00fcgen</button>
                    </div>
                    <div id="bulkArea_front_${textboxIndex}" class="bulk-paste-area" style="display: none;">
                        <textarea id="bulkText_front_${textboxIndex}" placeholder="Inhalte hier einf\u00fcgen\u2026\nJede Zeile wird einer Karte zugewiesen." rows="5"></textarea>
                        <button class="btn btn-primary btn-small" onclick="applyBulkPaste('front', ${textboxIndex})">\u00dcbernehmen</button>
                    </div>
                `;
                bulkSection.appendChild(bulkItem);
            });
        }
        
        // Create bulk paste for back textboxes
        if (hasBackTextboxes) {
            masterCard.back.textboxes.forEach((textbox, textboxIndex) => {
                const bulkItem = document.createElement('div');
                bulkItem.className = 'bulk-paste-item';
                bulkItem.innerHTML = `
                    <label>\ud83d\udd04 R\u00fcckseite \u2013 ${textbox.text}:</label>
                    <div class="bulk-paste-controls">
                        <select id="bulkSep_back_${textboxIndex}" class="bulk-separator-select">
                            <option value="newline">Zeilenumbruch</option>
                            <option value="comma">Komma (,)</option>
                            <option value="semicolon">Semikolon (;)</option>
                            <option value="tab">Tabulator</option>
                        </select>
                        <button class="btn btn-secondary btn-small" onclick="toggleBulkPaste('back', ${textboxIndex})">Einf\u00fcgen</button>
                    </div>
                    <div id="bulkArea_back_${textboxIndex}" class="bulk-paste-area" style="display: none;">
                        <textarea id="bulkText_back_${textboxIndex}" placeholder="Inhalte hier einf\u00fcgen\u2026\nJede Zeile wird einer Karte zugewiesen." rows="5"></textarea>
                        <button class="btn btn-primary btn-small" onclick="applyBulkPaste('back', ${textboxIndex})">\u00dcbernehmen</button>
                    </div>
                `;
                bulkSection.appendChild(bulkItem);
            });
        }
        
        container.appendChild(bulkSection);
    }
    
    for (let i = 0; i < projectConfig.actualCardCount; i++) {
        const cardInput = document.createElement('div');
        cardInput.className = 'card-input';
        
        // Card header
        let cardHTML = `<h4>Karte ${i + 1}</h4>`;
        
        // Front side section
        const hasFrontElements = masterCard.front.textboxes.length > 0 || masterCard.front.imageboxes.length > 0;
        if (hasFrontElements) {
            cardHTML += `<div class="card-side-section">
                <h5 class="side-title">📄 Vorderseite</h5>`;
            
            // Front textboxes
            masterCard.front.textboxes.forEach((textbox, textboxIndex) => {
                const inputId = `card_${i}_front_textbox_${textboxIndex}`;
                const savedValue = existingValues[inputId] || cardContents[i]?.front?.textboxes[textboxIndex] || '';
                
                cardHTML += `
                    <div class="input-field">
                        <label for="${inputId}">📝 ${textbox.text}:</label>
                        <textarea 
                            id="${inputId}" 
                            placeholder="Inhalt für ${textbox.text}"
                            onchange="updateCardContent(${i}, 'front', 'textbox', ${textboxIndex}, this.value)"
                            tabindex="${(i * 10) + (textboxIndex * 2) + 1}"
                        >${savedValue}</textarea>
                    </div>
                `;
                
                // Update cardContents with saved value
                if (cardContents[i]) {
                    cardContents[i].front.textboxes[textboxIndex] = savedValue;
                }
            });

            // Front imageboxes
            masterCard.front.imageboxes.forEach((imagebox, imageboxIndex) => {
                const tabIndex = (i * 10) + (masterCard.front.textboxes.length * 2) + (imageboxIndex * 2) + 1;
                const inputId = `card_${i}_front_imagebox_${imageboxIndex}`;
                const hasImage = cardContents[i]?.front?.imageboxes[imageboxIndex];
                const imageName = hasImage ? cardContents[i].front.imageboxes[imageboxIndex].name : '';
                
                cardHTML += `
                    <div class="input-field">
                        <label for="${inputId}">🖼️ ${imagebox.name}:</label>
                        <input 
                            type="file" 
                            accept="image/*"
                            id="${inputId}"
                            onchange="updateCardImageContent(${i}, 'front', ${imageboxIndex}, this)"
                            tabindex="${tabIndex}"
                        >
                        <div class="upload-indicator" style="margin-top: 5px; font-size: 12px; color: ${hasImage ? '#14a085' : '#666'};">
                            ${hasImage ? '✓ Bild hochgeladen: ' + imageName : 'Kein Bild hochgeladen'}
                        </div>
                    </div>
                `;
            });
            
            cardHTML += `</div>`; // Close front side section
        }

        // Back side section
        const hasBackElements = masterCard.back.textboxes.length > 0 || masterCard.back.imageboxes.length > 0;
        if (hasBackElements) {
            cardHTML += `<div class="card-side-section">
                <h5 class="side-title">🔄 Rückseite</h5>`;
            
            // Back textboxes
            masterCard.back.textboxes.forEach((textbox, textboxIndex) => {
                const frontElementsCount = masterCard.front.textboxes.length + masterCard.front.imageboxes.length;
                const tabIndex = (i * 10) + (frontElementsCount * 2) + (textboxIndex * 2) + 1;
                const inputId = `card_${i}_back_textbox_${textboxIndex}`;
                const savedValue = existingValues[inputId] || cardContents[i]?.back?.textboxes[textboxIndex] || '';
                
                cardHTML += `
                    <div class="input-field">
                        <label for="${inputId}">📝 ${textbox.text}:</label>
                        <textarea 
                            id="${inputId}" 
                            placeholder="Inhalt für ${textbox.text}"
                            onchange="updateCardContent(${i}, 'back', 'textbox', ${textboxIndex}, this.value)"
                            tabindex="${tabIndex}"
                        >${savedValue}</textarea>
                    </div>
                `;
                
                // Update cardContents with saved value
                if (cardContents[i]) {
                    cardContents[i].back.textboxes[textboxIndex] = savedValue;
                }
            });

            // Back imageboxes
            masterCard.back.imageboxes.forEach((imagebox, imageboxIndex) => {
                const frontElementsCount = masterCard.front.textboxes.length + masterCard.front.imageboxes.length;
                const tabIndex = (i * 10) + (frontElementsCount * 2) + (masterCard.back.textboxes.length * 2) + (imageboxIndex * 2) + 1;
                const inputId = `card_${i}_back_imagebox_${imageboxIndex}`;
                const hasImage = cardContents[i]?.back?.imageboxes[imageboxIndex];
                const imageName = hasImage ? cardContents[i].back.imageboxes[imageboxIndex].name : '';
                
                cardHTML += `
                    <div class="input-field">
                        <label for="${inputId}">🖼️ ${imagebox.name}:</label>
                        <input 
                            type="file" 
                            accept="image/*"
                            id="${inputId}"
                            onchange="updateCardImageContent(${i}, 'back', ${imageboxIndex}, this)"
                            tabindex="${tabIndex}"
                        >
                        <div class="upload-indicator" style="margin-top: 5px; font-size: 12px; color: ${hasImage ? '#14a085' : '#666'};">
                            ${hasImage ? '✓ Bild hochgeladen: ' + imageName : 'Kein Bild hochgeladen'}
                        </div>
                    </div>
                `;
            });
            
            cardHTML += `</div>`; // Close back side section
        }

        cardInput.innerHTML = cardHTML;
        container.appendChild(cardInput);
    }
    
    // Update image upload indicators after content is rendered
    setTimeout(() => {
        updateImageUploadIndicators();
    }, 100);
}

function updateCardContent(cardIndex, side, type, elementIndex, value) {
    if (type === 'textbox') {
        cardContents[cardIndex][side].textboxes[elementIndex] = value;
    }
}

function updateCardImageContent(cardIndex, side, imageboxIndex, input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            // Store image data in the format expected by PDF generation
            cardContents[cardIndex][side].imageboxes[imageboxIndex] = {
                src: e.target.result,
                name: file.name,
                size: file.size
            };
            
            // Update the visual indicator if it exists
            const indicator = input.parentElement.querySelector('.upload-indicator');
            if (indicator) {
                indicator.textContent = '✓ Bild hochgeladen: ' + file.name;
                indicator.style.color = '#14a085';
            }
        };
        reader.readAsDataURL(file);
    } else {
        // Clear the image data if no file is selected
        if (cardContents[cardIndex] && cardContents[cardIndex][side] && cardContents[cardIndex][side].imageboxes) {
            cardContents[cardIndex][side].imageboxes[imageboxIndex] = null;
        }
        
        // Update the visual indicator
        const indicator = input.parentElement.querySelector('.upload-indicator');
        if (indicator) {
            indicator.textContent = 'Kein Bild hochgeladen';
            indicator.style.color = '#666';
        }
    }
}

function saveCardContents() {
    console.log('Card contents saved:', cardContents);
}

// Bulk paste functions
function toggleBulkPaste(side, textboxIndex) {
    const area = document.getElementById(`bulkArea_${side}_${textboxIndex}`);
    area.style.display = area.style.display === 'none' ? 'block' : 'none';
}

function applyBulkPaste(side, textboxIndex) {
    const separator = document.getElementById(`bulkSep_${side}_${textboxIndex}`).value;
    const rawText = document.getElementById(`bulkText_${side}_${textboxIndex}`).value;
    
    let parts;
    switch (separator) {
        case 'comma': parts = rawText.split(','); break;
        case 'semicolon': parts = rawText.split(';'); break;
        case 'tab': parts = rawText.split('\t'); break;
        case 'newline':
        default: parts = rawText.split('\n'); break;
    }
    
    // Trim whitespace from each part
    parts = parts.map(p => p.trim()).filter(p => p.length > 0);
    
    // Distribute across cards
    for (let i = 0; i < projectConfig.actualCardCount && i < parts.length; i++) {
        if (!cardContents[i]) continue;
        if (!cardContents[i][side]) continue;
        
        cardContents[i][side].textboxes[textboxIndex] = parts[i];
        
        // Update the textarea in the UI
        const inputId = `card_${i}_${side}_textbox_${textboxIndex}`;
        const textarea = document.getElementById(inputId);
        if (textarea) {
            textarea.value = parts[i];
        }
    }
    
    // Hide the bulk paste area
    document.getElementById(`bulkArea_${side}_${textboxIndex}`).style.display = 'none';
    document.getElementById(`bulkText_${side}_${textboxIndex}`).value = '';
}

// Function to update visual indicators after content inputs are regenerated
function updateImageUploadIndicators() {
    cardContents.forEach((card, cardIndex) => {
        // Check front side
        if (card.front && card.front.imageboxes) {
            card.front.imageboxes.forEach((imageData, imageboxIndex) => {
                const indicator = document.querySelector(`#card_${cardIndex}_front_imagebox_${imageboxIndex}`);
                const indicatorDiv = indicator?.parentElement?.querySelector('.upload-indicator');
                if (indicatorDiv && imageData) {
                    indicatorDiv.textContent = '✓ Bild hochgeladen: ' + imageData.name;
                    indicatorDiv.style.color = '#14a085';
                }
            });
        }
        
        // Check back side
        if (card.back && card.back.imageboxes) {
            card.back.imageboxes.forEach((imageData, imageboxIndex) => {
                const indicator = document.querySelector(`#card_${cardIndex}_back_imagebox_${imageboxIndex}`);
                const indicatorDiv = indicator?.parentElement?.querySelector('.upload-indicator');
                if (indicatorDiv && imageData) {
                    indicatorDiv.textContent = '✓ Bild hochgeladen: ' + imageData.name;
                    indicatorDiv.style.color = '#14a085';
                }
            });
        }
    });
}

// PDF Export (Tab 4)
function generatePDFPreview() {
    const preview = document.getElementById('pdfPreview');
    preview.innerHTML = '<h3>PDF Vorschau:</h3>';

    // Check if we have back side content or design differences
    const hasBackContent = masterCard.back && (
        (masterCard.back.textboxes && masterCard.back.textboxes.length > 0) ||
        (masterCard.back.imageboxes && masterCard.back.imageboxes.length > 0) ||
        (masterCard.back.backgroundColor !== masterCard.front.backgroundColor) ||
        (masterCard.back.borderWidth !== masterCard.front.borderWidth) ||
        (masterCard.back.borderColor !== masterCard.front.borderColor) ||
        (masterCard.back.borderStyle !== masterCard.front.borderStyle) ||
        (masterCard.back.watermark !== masterCard.front.watermark) ||
        (masterCard.back.watermarkImage !== masterCard.front.watermarkImage)
    );

    const cardsPerPage = projectConfig.maxCardCount;
    const totalCards = projectConfig.actualCardCount;
    const pagesNeeded = Math.ceil(totalCards / cardsPerPage);

    for (let page = 0; page < pagesNeeded; page++) {
        const startCard = page * cardsPerPage;
        const endCard = Math.min(startCard + cardsPerPage, totalCards);

        // Front page
        const frontPageContainer = document.createElement('div');
        frontPageContainer.style.marginBottom = '20px';
        
        const frontTitle = document.createElement('h4');
        frontTitle.textContent = pagesNeeded > 1 ? `Vorderseiten (Seite ${page + 1})` : 'Vorderseiten';
        frontTitle.style.textAlign = 'center';
        frontTitle.style.color = 'white';
        frontTitle.style.margin = '0 0 10px 0';
        frontPageContainer.appendChild(frontTitle);

        const frontPage = document.createElement('div');
        frontPage.className = 'pdf-page';
        frontPage.style.gridTemplateColumns = `repeat(${projectConfig.grid.width}, 1fr)`;
        frontPage.style.gridTemplateRows = `repeat(${projectConfig.grid.height}, 1fr)`;

        for (let i = 0; i < cardsPerPage; i++) {
            const cardIndex = startCard + i;
            if (cardIndex < endCard && cardIndex < cardContents.length) {
                const frontCard = createPDFCard(cardContents[cardIndex], cardIndex, 'front');
                frontPage.appendChild(frontCard);
            } else {
                const emptyCard = document.createElement('div');
                emptyCard.className = 'pdf-card';
                emptyCard.style.backgroundColor = '#f5f5f5';
                emptyCard.style.border = '1px dashed #ccc';
                emptyCard.style.display = 'flex';
                emptyCard.style.alignItems = 'center';
                emptyCard.style.justifyContent = 'center';
                emptyCard.style.color = '#999';
                emptyCard.style.fontSize = '10px';
                emptyCard.textContent = cardIndex >= totalCards ? '(nicht verwendet)' : '(leer)';
                frontPage.appendChild(emptyCard);
            }
        }

        frontPageContainer.appendChild(frontPage);
        preview.appendChild(frontPageContainer);

        // Back page if needed
        if (hasBackContent) {
            const backPageContainer = document.createElement('div');
            backPageContainer.style.marginBottom = '20px';
            
            const backTitle = document.createElement('h4');
            backTitle.textContent = pagesNeeded > 1 ? `Rückseiten (Seite ${page + 1})` : 'Rückseiten';
            backTitle.style.textAlign = 'center';
            backTitle.style.color = 'white';
            backTitle.style.margin = '0 0 10px 0';
            backPageContainer.appendChild(backTitle);

            const backPage = document.createElement('div');
            backPage.className = 'pdf-page';
            backPage.style.gridTemplateColumns = `repeat(${projectConfig.grid.width}, 1fr)`;
            backPage.style.gridTemplateRows = `repeat(${projectConfig.grid.height}, 1fr)`;

            for (let i = 0; i < cardsPerPage; i++) {
                const cardIndex = startCard + i;
                if (cardIndex < endCard && cardIndex < cardContents.length) {
                    const backCard = createPDFCard(cardContents[cardIndex], cardIndex, 'back');
                    backPage.appendChild(backCard);
                } else {
                    const emptyCard = document.createElement('div');
                    emptyCard.className = 'pdf-card';
                    emptyCard.style.backgroundColor = '#f5f5f5';
                    emptyCard.style.border = '1px dashed #ccc';
                    emptyCard.style.display = 'flex';
                    emptyCard.style.alignItems = 'center';
                    emptyCard.style.justifyContent = 'center';
                    emptyCard.style.color = '#999';
                    emptyCard.style.fontSize = '10px';
                    emptyCard.textContent = cardIndex >= totalCards ? '(nicht verwendet)' : '(leer)';
                    backPage.appendChild(emptyCard);
                }
            }

            backPageContainer.appendChild(backPage);
            preview.appendChild(backPageContainer);
        }
    }
}

function createPDFCard(cardContent, cardIndex, side) {
    const card = document.createElement('div');
    card.className = 'pdf-card';
    
    const cardSideData = masterCard[side];
    const contentSideData = cardContent[side] || { textboxes: [], imageboxes: [] };
    
    // Apply master card styles
    card.style.backgroundColor = cardSideData.backgroundColor;
    card.style.borderWidth = (cardSideData.borderWidth * 0.5) + 'px'; // Scale down for preview
    card.style.borderColor = cardSideData.borderColor;
    card.style.borderStyle = cardSideData.borderStyle || 'solid';

    // No background image support

    // Add textboxes with content
    if (cardSideData.textboxes) {
        cardSideData.textboxes.forEach((textbox, textboxIndex) => {
            const textboxElement = document.createElement('div');
            textboxElement.className = 'pdf-card-textbox';
            textboxElement.textContent = contentSideData.textboxes?.[textboxIndex] || textbox.text;
            
            // Scale positions and sizes for PDF
            textboxElement.style.left = (textbox.x * 0.5) + 'px';
            textboxElement.style.top = (textbox.y * 0.5) + 'px';
            textboxElement.style.width = (textbox.width * 0.5) + 'px';
            textboxElement.style.height = (textbox.height * 0.5) + 'px';
            textboxElement.style.fontSize = (textbox.fontSize * 0.4) + 'px';
            textboxElement.style.color = textbox.fontColor;
            
            // Apply new style properties with scaling
            textboxElement.style.fontFamily = textbox.fontFamily || 'Arial';
            textboxElement.style.fontWeight = textbox.bold ? 'bold' : 'normal';
            textboxElement.style.fontStyle = textbox.italic ? 'italic' : 'normal';
            textboxElement.style.textDecoration = textbox.underline ? 'underline' : 'none';
            
            // Apply background color
            if (textbox.backgroundColor && textbox.backgroundColor !== 'transparent') {
                textboxElement.style.backgroundColor = textbox.backgroundColor;
            }
            
            // Apply border with scaling
            if (textbox.borderColor && textbox.borderColor !== 'transparent' && textbox.borderWidth > 0) {
                textboxElement.style.border = `${(textbox.borderWidth * 0.5)}px solid ${textbox.borderColor}`;
            }
            
            card.appendChild(textboxElement);
        });
    }

    // Add imageboxes with content
    if (cardSideData.imageboxes) {
        cardSideData.imageboxes.forEach((imagebox, imageboxIndex) => {
            const imageboxElement = document.createElement('div');
            imageboxElement.className = 'pdf-card-textbox';
            imageboxElement.style.left = (imagebox.x * 0.5) + 'px';
            imageboxElement.style.top = (imagebox.y * 0.5) + 'px';
            imageboxElement.style.width = (imagebox.width * 0.5) + 'px';
            imageboxElement.style.height = (imagebox.height * 0.5) + 'px';
            imageboxElement.style.overflow = 'hidden';
            imageboxElement.style.boxSizing = 'border-box';
            
            // Apply border styles for PDF preview
            if (imagebox.borderWidth > 0) {
                imageboxElement.style.border = `${(imagebox.borderWidth * 0.5)}px solid ${imagebox.borderColor}`;
            }
            
            // Apply opacity
            if (imagebox.opacity !== undefined) {
                imageboxElement.style.opacity = imagebox.opacity / 100;
            }
            
            const imageData = contentSideData.imageboxes?.[imageboxIndex]?.src || imagebox.image;
            if (imageData) {
                const img = document.createElement('img');
                img.src = imageData;
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'cover';
                imageboxElement.appendChild(img);
            } else {
                imageboxElement.style.border = '1px dashed #ccc';
                imageboxElement.style.display = 'flex';
                imageboxElement.style.alignItems = 'center';
                imageboxElement.style.justifyContent = 'center';
                imageboxElement.style.fontSize = '6px';
                imageboxElement.style.color = '#999';
                imageboxElement.textContent = imagebox.name;
            }
            
            card.appendChild(imageboxElement);
        });
    }

    // Add watermark with size and position
    if (cardSideData.watermark) {
        const watermark = document.createElement('div');
        watermark.className = 'card-watermark';
        watermark.textContent = cardSideData.watermark;
        
        const wmSize = (cardSideData.watermarkSize || 12) * 0.4;
        const wmPos = cardSideData.watermarkPosition || 'bottom-right';
        watermark.style.fontSize = wmSize + 'px';
        
        // Reset positioning
        watermark.style.top = 'auto';
        watermark.style.bottom = 'auto';
        watermark.style.left = 'auto';
        watermark.style.right = 'auto';
        watermark.style.transform = 'none';
        
        switch (wmPos) {
            case 'top-left':
                watermark.style.top = '2px'; watermark.style.left = '2px'; break;
            case 'top-center':
                watermark.style.top = '2px'; watermark.style.left = '50%'; watermark.style.transform = 'translateX(-50%)'; break;
            case 'top-right':
                watermark.style.top = '2px'; watermark.style.right = '2px'; break;
            case 'middle-left':
                watermark.style.top = '50%'; watermark.style.left = '2px'; watermark.style.transform = 'translateY(-50%)'; break;
            case 'center':
                watermark.style.top = '50%'; watermark.style.left = '50%'; watermark.style.transform = 'translate(-50%, -50%)'; break;
            case 'middle-right':
                watermark.style.top = '50%'; watermark.style.right = '2px'; watermark.style.transform = 'translateY(-50%)'; break;
            case 'bottom-left':
                watermark.style.bottom = '2px'; watermark.style.left = '2px'; break;
            case 'bottom-center':
                watermark.style.bottom = '2px'; watermark.style.left = '50%'; watermark.style.transform = 'translateX(-50%)'; break;
            case 'bottom-right':
            default:
                watermark.style.bottom = '2px'; watermark.style.right = '2px'; break;
        }
        
        card.appendChild(watermark);
    }

    // Add watermark image
    if (cardSideData.watermarkImage) {
        const wmImgEl = document.createElement('div');
        wmImgEl.style.position = 'absolute';
        wmImgEl.style.pointerEvents = 'none';
        wmImgEl.style.zIndex = '1';
        
        const wmImg = document.createElement('img');
        wmImg.src = cardSideData.watermarkImage;
        wmImg.style.width = ((cardSideData.watermarkImageSize || 30) * 0.5) + 'px';
        wmImg.style.height = 'auto';
        wmImg.style.opacity = (cardSideData.watermarkImageOpacity || 30) / 100;
        wmImg.style.display = 'block';
        wmImgEl.appendChild(wmImg);
        
        const wmImgPos = cardSideData.watermarkPosition || 'bottom-right';
        wmImgEl.style.top = 'auto';
        wmImgEl.style.bottom = 'auto';
        wmImgEl.style.left = 'auto';
        wmImgEl.style.right = 'auto';
        wmImgEl.style.transform = 'none';
        
        switch (wmImgPos) {
            case 'top-left': wmImgEl.style.top = '2px'; wmImgEl.style.left = '2px'; break;
            case 'top-center': wmImgEl.style.top = '2px'; wmImgEl.style.left = '50%'; wmImgEl.style.transform = 'translateX(-50%)'; break;
            case 'top-right': wmImgEl.style.top = '2px'; wmImgEl.style.right = '2px'; break;
            case 'middle-left': wmImgEl.style.top = '50%'; wmImgEl.style.left = '2px'; wmImgEl.style.transform = 'translateY(-50%)'; break;
            case 'center': wmImgEl.style.top = '50%'; wmImgEl.style.left = '50%'; wmImgEl.style.transform = 'translate(-50%, -50%)'; break;
            case 'middle-right': wmImgEl.style.top = '50%'; wmImgEl.style.right = '2px'; wmImgEl.style.transform = 'translateY(-50%)'; break;
            case 'bottom-left': wmImgEl.style.bottom = '2px'; wmImgEl.style.left = '2px'; break;
            case 'bottom-center': wmImgEl.style.bottom = '2px'; wmImgEl.style.left = '50%'; wmImgEl.style.transform = 'translateX(-50%)'; break;
            case 'bottom-right': default: wmImgEl.style.bottom = '2px'; wmImgEl.style.right = '2px'; break;
        }
        
        card.appendChild(wmImgEl);
    }

    return card;
}

async function generatePDF() {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('portrait', 'mm', 'a4');

    // Calculate card dimensions in mm
    const pageWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const margin = 10;
    const availableWidth = pageWidth - (2 * margin);
    const availableHeight = pageHeight - (2 * margin);
    
    const cardWidth = availableWidth / projectConfig.grid.width;
    const cardHeight = availableHeight / projectConfig.grid.height;

    // Helper: convert SVG data URL to PNG data URL
    async function convertSvgToPng(svgDataUrl, width, height) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                canvas.width = width * 2;
                canvas.height = height * 2;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/png'));
            };
            img.onerror = function() {
                resolve(null);
            };
            img.src = svgDataUrl;
        });
    }

    // Helper: detect image format from data URL
    function getImageFormat(dataUrl) {
        if (dataUrl.startsWith('data:image/svg')) return 'SVG';
        if (dataUrl.startsWith('data:image/png')) return 'PNG';
        if (dataUrl.startsWith('data:image/gif')) return 'GIF';
        return 'JPEG';
    }

    // Helper: add image to PDF with SVG support
    async function addImageToPdf(imageDataUrl, x, y, w, h) {
        let format = getImageFormat(imageDataUrl);
        let src = imageDataUrl;
        
        if (format === 'SVG') {
            // Convert SVG to PNG for PDF compatibility
            const pngData = await convertSvgToPng(imageDataUrl, Math.round(w * 10), Math.round(h * 10));
            if (pngData) {
                src = pngData;
                format = 'PNG';
            } else {
                return; // Skip if conversion fails
            }
        }
        
        try {
            pdf.addImage(src, format, x, y, w, h);
        } catch (error) {
            console.warn('Error adding image to PDF:', error);
        }
    }

    // Helper: draw border with style
    function drawStyledBorder(x, y, w, h, borderWidth, borderColor, borderStyle) {
        pdf.setDrawColor(borderColor);
        const lineWidth = borderWidth * 0.1;
        pdf.setLineWidth(lineWidth);
        
        if (borderStyle === 'dashed') {
            // Draw dashed rectangle
            const dashLen = 2;
            const gapLen = 1.5;
            drawDashedLine(x, y, x + w, y, dashLen, gapLen);
            drawDashedLine(x + w, y, x + w, y + h, dashLen, gapLen);
            drawDashedLine(x + w, y + h, x, y + h, dashLen, gapLen);
            drawDashedLine(x, y + h, x, y, dashLen, gapLen);
        } else if (borderStyle === 'dotted') {
            const dotSpacing = 0.8;
            drawDashedLine(x, y, x + w, y, 0.2, dotSpacing);
            drawDashedLine(x + w, y, x + w, y + h, 0.2, dotSpacing);
            drawDashedLine(x + w, y + h, x, y + h, 0.2, dotSpacing);
            drawDashedLine(x, y + h, x, y, 0.2, dotSpacing);
        } else if (borderStyle === 'double') {
            const offset = lineWidth * 2;
            pdf.rect(x, y, w, h);
            pdf.rect(x + offset, y + offset, w - offset * 2, h - offset * 2);
        } else {
            pdf.rect(x, y, w, h);
        }
    }

    function drawDashedLine(x1, y1, x2, y2, dashLen, gapLen) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.sqrt(dx * dx + dy * dy);
        const ux = dx / len;
        const uy = dy / len;
        let pos = 0;
        while (pos < len) {
            const endPos = Math.min(pos + dashLen, len);
            pdf.line(x1 + ux * pos, y1 + uy * pos, x1 + ux * endPos, y1 + uy * endPos);
            pos = endPos + gapLen;
        }
    }

    // Helper: add watermark to PDF card
    function addWatermarkToPdf(wmText, wmSize, wmPos, x, y, cardW, cardH) {
        const fontSize = (wmSize || 12) * 0.25;
        pdf.setFontSize(fontSize);
        pdf.setTextColor(128, 128, 128);
        
        const textWidth = pdf.getTextWidth(wmText);
        let wmX, wmY;
        
        switch (wmPos) {
            case 'top-left':
                wmX = x + 1; wmY = y + fontSize * 0.4; break;
            case 'top-center':
                wmX = x + (cardW - textWidth) / 2; wmY = y + fontSize * 0.4; break;
            case 'top-right':
                wmX = x + cardW - textWidth - 1; wmY = y + fontSize * 0.4; break;
            case 'middle-left':
                wmX = x + 1; wmY = y + cardH / 2; break;
            case 'center':
                wmX = x + (cardW - textWidth) / 2; wmY = y + cardH / 2; break;
            case 'middle-right':
                wmX = x + cardW - textWidth - 1; wmY = y + cardH / 2; break;
            case 'bottom-left':
                wmX = x + 1; wmY = y + cardH - 1; break;
            case 'bottom-center':
                wmX = x + (cardW - textWidth) / 2; wmY = y + cardH - 1; break;
            case 'bottom-right':
            default:
                wmX = x + cardW - textWidth - 1; wmY = y + cardH - 1; break;
        }
        
        pdf.text(wmText, wmX, wmY);
    }

    // Multi-page support
    const cardsPerPage = projectConfig.maxCardCount;
    const totalCards = projectConfig.actualCardCount;
    const pagesNeeded = Math.ceil(totalCards / cardsPerPage);

    // Check if we have back side content or design differences
    const hasBackContent = masterCard.back && (
        (masterCard.back.textboxes && masterCard.back.textboxes.length > 0) ||
        (masterCard.back.imageboxes && masterCard.back.imageboxes.length > 0) ||
        (masterCard.back.backgroundColor !== masterCard.front.backgroundColor) ||
        (masterCard.back.borderWidth !== masterCard.front.borderWidth) ||
        (masterCard.back.borderColor !== masterCard.front.borderColor) ||
        (masterCard.back.borderStyle !== masterCard.front.borderStyle) ||
        (masterCard.back.watermark !== masterCard.front.watermark) ||
        (masterCard.back.watermarkImage !== masterCard.front.watermarkImage)
    );

    // Helper to render one side of cards on a PDF page
    async function renderPageSide(side, startIdx, endIdx) {
        const sideData = masterCard[side];
        
        for (let i = startIdx; i < endIdx; i++) {
            const localIndex = i - startIdx;
            const row = Math.floor(localIndex / projectConfig.grid.width);
            const col = localIndex % projectConfig.grid.width;
            
            const x = margin + (col * cardWidth);
            const y = margin + (row * cardHeight);

            // Draw card background
            pdf.setFillColor(sideData.backgroundColor);
            pdf.rect(x, y, cardWidth, cardHeight, 'F');

            // Draw border with style
            drawStyledBorder(x, y, cardWidth, cardHeight, sideData.borderWidth, sideData.borderColor, sideData.borderStyle || 'solid');

            // Add textboxes
            if (sideData.textboxes && i < cardContents.length) {
                sideData.textboxes.forEach((textbox, textboxIndex) => {
                    const content = cardContents[i][side]?.textboxes?.[textboxIndex] || textbox.text;
                    
                    const textX = x + (textbox.x * cardWidth / 200);
                    const textY = y + (textbox.y * cardHeight / 280) + (textbox.fontSize * 0.1);
                    
                    pdf.setFontSize(textbox.fontSize * 0.3);
                    pdf.setTextColor(textbox.fontColor);
                    
                    const maxWidth = (textbox.width * cardWidth / 200);
                    const lines = pdf.splitTextToSize(content, maxWidth);
                    
                    pdf.text(lines, textX, textY);
                });
            }

            // Add images (with SVG support)
            if (sideData.imageboxes && i < cardContents.length) {
                for (const [imageboxIndex, imagebox] of sideData.imageboxes.entries()) {
                    const imageData = cardContents[i][side]?.imageboxes?.[imageboxIndex];
                    
                    if (imageData && imageData.src) {
                        const imgX = x + (imagebox.x * cardWidth / 200);
                        const imgY = y + (imagebox.y * cardHeight / 280);
                        const imgWidth = imagebox.width * cardWidth / 200;
                        const imgHeight = imagebox.height * cardHeight / 280;
                        
                        await addImageToPdf(imageData.src, imgX, imgY, imgWidth, imgHeight);
                    }
                }
            }

            // Add watermark text
            if (sideData.watermark) {
                addWatermarkToPdf(sideData.watermark, sideData.watermarkSize, sideData.watermarkPosition, x, y, cardWidth, cardHeight);
            }

            // Add watermark image
            if (sideData.watermarkImage) {
                const wmImgSize = (sideData.watermarkImageSize || 30) * cardWidth / 200;
                const wmPos = sideData.watermarkPosition || 'bottom-right';
                const wmOpacity = (sideData.watermarkImageOpacity || 30) / 100;
                
                let wmX, wmY;
                switch (wmPos) {
                    case 'top-left': wmX = x + 1; wmY = y + 1; break;
                    case 'top-center': wmX = x + (cardWidth - wmImgSize) / 2; wmY = y + 1; break;
                    case 'top-right': wmX = x + cardWidth - wmImgSize - 1; wmY = y + 1; break;
                    case 'middle-left': wmX = x + 1; wmY = y + (cardHeight - wmImgSize) / 2; break;
                    case 'center': wmX = x + (cardWidth - wmImgSize) / 2; wmY = y + (cardHeight - wmImgSize) / 2; break;
                    case 'middle-right': wmX = x + cardWidth - wmImgSize - 1; wmY = y + (cardHeight - wmImgSize) / 2; break;
                    case 'bottom-left': wmX = x + 1; wmY = y + cardHeight - wmImgSize - 1; break;
                    case 'bottom-center': wmX = x + (cardWidth - wmImgSize) / 2; wmY = y + cardHeight - wmImgSize - 1; break;
                    case 'bottom-right': default: wmX = x + cardWidth - wmImgSize - 1; wmY = y + cardHeight - wmImgSize - 1; break;
                }
                
                try {
                    pdf.saveGraphicsState();
                    pdf.setGState(new pdf.GState({ opacity: wmOpacity }));
                    await addImageToPdf(sideData.watermarkImage, wmX, wmY, wmImgSize, wmImgSize);
                    pdf.restoreGraphicsState();
                } catch(e) {
                    await addImageToPdf(sideData.watermarkImage, wmX, wmY, wmImgSize, wmImgSize);
                }
            }
        }
    }

    // Render pages (interleaved: front, back, front, back, ...)
    let isFirstPage = true;
    for (let page = 0; page < pagesNeeded; page++) {
        const startCard = page * cardsPerPage;
        const endCard = Math.min(startCard + cardsPerPage, totalCards);
        
        // Front page
        if (!isFirstPage) pdf.addPage();
        isFirstPage = false;
        await renderPageSide('front', startCard, endCard);

        // Back page
        if (hasBackContent) {
            pdf.addPage();
            await renderPageSide('back', startCard, endCard);
        }
    }

    // Download PDF
    const fileName = projectConfig.name.replace(/[^a-zA-Z0-9]/g, '_') + '.pdf';
    pdf.save(fileName);
}

// Utility functions
function resetApp() {
    projectConfig = {
        name: 'Meine Karten',
        grid: { width: 3, height: 3 },
        maxCardCount: 9,
        actualCardCount: 9
    };
    
    masterCard = {
        front: {
            backgroundColor: '#ffffff',
            borderWidth: 2,
            borderColor: '#000000',
            borderStyle: 'solid',
            watermark: '',
            watermarkSize: 12,
            watermarkPosition: 'bottom-right',
            watermarkImage: null,
            watermarkImageSize: 30,
            watermarkImageOpacity: 30,
            textboxes: [],
            imageboxes: []
        },
        back: {
            backgroundColor: '#ffffff',
            borderWidth: 2,
            borderColor: '#000000',
            borderStyle: 'solid',
            watermark: '',
            watermarkSize: 12,
            watermarkPosition: 'bottom-right',
            watermarkImage: null,
            watermarkImageSize: 30,
            watermarkImageOpacity: 30,
            textboxes: [],
            imageboxes: []
        }
    };
    
    cardContents = [];
    textboxCounter = 0;
    imageboxCounter = 0;
    currentSide = 'front';
    
    switchTab('project');
    updateGridPreview();
}

// Save/Load JSON functions
function saveProjectAsJSON() {
    const projectData = {
        version: 1,
        projectConfig: projectConfig,
        masterCard: masterCard,
        cardContents: cardContents,
        textboxCounter: textboxCounter,
        imageboxCounter: imageboxCounter
    };
    
    const json = JSON.stringify(projectData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (projectConfig.name || 'project').replace(/[^a-zA-Z0-9\u00e4\u00f6\u00fc\u00c4\u00d6\u00dc\u00df]/g, '_') + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function loadProjectFromJSON() {
    document.getElementById('jsonFileInput').click();
}

function handleJSONFileLoad(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            
            // Restore state
            if (data.projectConfig) {
                projectConfig = data.projectConfig;
                // Ensure required fields exist
                if (!projectConfig.maxCardCount) {
                    projectConfig.maxCardCount = projectConfig.grid.width * projectConfig.grid.height;
                }
                if (!projectConfig.actualCardCount) {
                    projectConfig.actualCardCount = projectConfig.maxCardCount;
                }
            }
            if (data.masterCard) {
                masterCard = data.masterCard;
                // Ensure watermarkImage fields exist
                ['front', 'back'].forEach(side => {
                    if (masterCard[side].watermarkImage === undefined) masterCard[side].watermarkImage = null;
                    if (masterCard[side].watermarkImageSize === undefined) masterCard[side].watermarkImageSize = 30;
                    if (masterCard[side].watermarkImageOpacity === undefined) masterCard[side].watermarkImageOpacity = 30;
                });
            }
            if (data.cardContents) {
                cardContents = data.cardContents;
            }
            if (data.textboxCounter !== undefined) {
                textboxCounter = data.textboxCounter;
            }
            if (data.imageboxCounter !== undefined) {
                imageboxCounter = data.imageboxCounter;
            }
            
            // Update UI
            document.getElementById('projectName').value = projectConfig.name;
            document.getElementById('gridInput').value = `${projectConfig.grid.width}x${projectConfig.grid.height}`;
            document.getElementById('gridWidth').value = projectConfig.grid.width;
            document.getElementById('gridHeight').value = projectConfig.grid.height;
            document.getElementById('gridWidthSlider').value = projectConfig.grid.width;
            document.getElementById('gridHeightSlider').value = projectConfig.grid.height;
            document.getElementById('gridWidthValue').textContent = projectConfig.grid.width;
            document.getElementById('gridHeightValue').textContent = projectConfig.grid.height;
            document.getElementById('actualCardCount').value = projectConfig.actualCardCount;
            
            updateGridPreview();
            updatePageInfo();
            updateFormControls();
            updateElementLists();
            updateCardPreview();
            updateWatermarkImageControls();
            
            alert('Projekt erfolgreich geladen!');
        } catch (error) {
            alert('Fehler beim Laden der Datei: ' + error.message);
        }
    };
    reader.readAsText(file);
    
    // Reset file input for re-loading
    event.target.value = '';
}

// Make functions global for HTML onclick handlers
window.updateTextboxText = updateTextboxText;
window.updateTextboxFontSize = updateTextboxFontSize;
window.updateTextboxColor = updateTextboxColor;
window.updateTextboxFontFamily = updateTextboxFontFamily;
window.toggleTextboxBold = toggleTextboxBold;
window.toggleTextboxItalic = toggleTextboxItalic;
window.toggleTextboxUnderline = toggleTextboxUnderline;
window.updateTextboxBackgroundColor = updateTextboxBackgroundColor;
window.clearTextboxBackground = clearTextboxBackground;
window.updateTextboxBorderColor = updateTextboxBorderColor;
window.updateTextboxBorderWidth = updateTextboxBorderWidth;
window.clearTextboxBorder = clearTextboxBorder;
window.removeTextbox = removeTextbox;
window.updateImageboxName = updateImageboxName;
window.updateImageboxImage = updateImageboxImage;
window.removeImagebox = removeImagebox;
window.selectImageForEditing = selectImageForEditing;
window.updateCardContent = updateCardContent;
window.updateCardImageContent = updateCardImageContent;
window.toggleBulkPaste = toggleBulkPaste;
window.applyBulkPaste = applyBulkPaste;
window.saveProjectAsJSON = saveProjectAsJSON;
window.loadProjectFromJSON = loadProjectFromJSON;
window.handleJSONFileLoad = handleJSONFileLoad;
