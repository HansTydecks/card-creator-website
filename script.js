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
        watermark: '',
        backgroundImage: null,
        textboxes: [],
        imageboxes: []
    },
    back: {
        backgroundColor: '#ffffff',
        borderWidth: 2,
        borderColor: '#000000',
        watermark: '',
        backgroundImage: null,
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
    
    // Initialize card count dropdown
    updateActualCardCountOptions();
    
    // Stelle sicher, dass das Dropdown den korrekten initialen Wert zeigt
    const actualCardCountSelect = document.getElementById('actualCardCount');
    if (actualCardCountSelect) {
        actualCardCountSelect.value = projectConfig.actualCardCount;
    }
    
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
        // Only generate content inputs if they don't exist or if master card has changed
        const container = document.getElementById('contentInputs');
        const needsRegeneration = container.innerHTML === '' || 
                                cardContents.length !== projectConfig.cardCount;
        
        if (needsRegeneration && (masterCard.front.textboxes.length > 0 || masterCard.front.imageboxes.length > 0 || 
            masterCard.back.textboxes.length > 0 || masterCard.back.imageboxes.length > 0)) {
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

    // Actual card count selection
    actualCardCountSelect.addEventListener('change', () => {
        projectConfig.actualCardCount = parseInt(actualCardCountSelect.value);
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
    const select = document.getElementById('actualCardCount');
    const currentValue = projectConfig.actualCardCount; // Aktuellen Wert speichern
    select.innerHTML = '';
    
    // Add options from 1 to maxCardCount
    for (let i = 1; i <= projectConfig.maxCardCount; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i + ' Karten';
        if (i === projectConfig.maxCardCount) {
            option.textContent += ' (alle)';
        }
        // Setze den aktuellen Wert als selected, oder Maximum falls der aktuelle Wert zu groß ist
        if (i === currentValue || (currentValue > projectConfig.maxCardCount && i === projectConfig.maxCardCount)) {
            option.selected = true;
        }
        select.appendChild(option);
    }
    
    // Stelle sicher, dass actualCardCount nicht größer als maxCardCount ist
    if (projectConfig.actualCardCount > projectConfig.maxCardCount) {
        projectConfig.actualCardCount = projectConfig.maxCardCount;
    }
    
    // Aktualisiere das Dropdown-Element, um den korrekten Wert anzuzeigen
    select.value = projectConfig.actualCardCount;
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
    
    // Set preview dimensions - base height of 280px, width calculated from aspect ratio
    const previewHeight = 280;
    const previewWidth = previewHeight * aspectRatio;
    
    // Apply dimensions
    cardTemplate.style.width = `${previewWidth}px`;
    cardTemplate.style.height = `${previewHeight}px`;
    
    console.log(`Grid: ${width}x${height}, Card dimensions: ${cardWidth.toFixed(1)}mm x ${cardHeight.toFixed(1)}mm, Preview: ${previewWidth.toFixed(0)}px x ${previewHeight}px`);
}

function saveProjectConfig() {
    projectConfig.name = document.getElementById('projectName').value || 'Meine Karten';
    
    // Speichere den aktuellen actualCardCount Wert aus dem Dropdown
    const actualCardCountSelect = document.getElementById('actualCardCount');
    if (actualCardCountSelect.value) {
        projectConfig.actualCardCount = parseInt(actualCardCountSelect.value);
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
    const backgroundImage = document.getElementById('backgroundImage');
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
        updateCardPreview();
    });

    // Background image
    backgroundImage.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                masterCard[currentSide].backgroundImage = e.target.result;
                updateCardPreview();
            };
            reader.readAsDataURL(file);
        }
    });

    // Add textbox
    addTextboxBtn.addEventListener('click', addTextbox);

    // Add imagebox
    addImageboxBtn.addEventListener('click', addImagebox);

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
    
    // Update color displays and presets
    updateColorDisplay('backgroundColor', currentCardSide.backgroundColor);
    updateColorDisplay('borderColor', currentCardSide.borderColor);
    updateActivePresetForColor('backgroundColor', currentCardSide.backgroundColor);
    updateActivePresetForColor('borderColor', currentCardSide.borderColor);
    
    // Reset background image input (file inputs can't be set programmatically)
    document.getElementById('backgroundImage').value = '';
}

function addTextbox() {
    const textbox = {
        id: ++textboxCounter,
        text: 'Textbox ' + textboxCounter,
        x: 10,
        y: 10,
        width: 80,
        height: 30,
        fontSize: 12,
        fontColor: '#000000'
    };

    masterCard[currentSide].textboxes.push(textbox);
    
    // Update all existing cards to match new master structure
    updateCardContentsStructure();
    
    updateElementLists();
    updateCardPreview();
}

function addImagebox() {
    const imagebox = {
        id: ++imageboxCounter,
        name: 'Bild ' + imageboxCounter,
        x: 10,
        y: 50,
        width: 60,
        height: 60,
        image: null
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
            <div style="display: flex; gap: 10px; margin-top: 5px;">
                <input type="number" placeholder="Schriftgröße" value="${textbox.fontSize}" onchange="updateTextboxFontSize(${index}, this.value)" style="width: 80px;">
                <input type="color" value="${textbox.fontColor}" onchange="updateTextboxColor(${index}, this.value)" style="width: 50px;">
                <button class="btn btn-danger" onclick="removeTextbox(${index})">Löschen</button>
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
            <label>Bild ${imagebox.id}:</label>
            <input type="text" value="${imagebox.name}" onchange="updateImageboxName(${index}, this.value)" placeholder="Bildname">
            <div style="display: flex; gap: 10px; margin-top: 5px; align-items: center;">
                <input type="file" accept="image/*" onchange="updateImageboxImage(${index}, this)" style="flex: 1;">
                <button class="btn btn-danger" onclick="removeImagebox(${index})">Löschen</button>
            </div>
            ${imagebox.image ? '<div style="margin-top: 5px; font-size: 12px; color: #0d7377;">✓ Bild hochgeladen</div>' : ''}
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
            masterCard[currentSide].imageboxes[index].image = e.target.result;
            updateElementLists();
            updateCardPreview();
        };
        reader.readAsDataURL(file);
    }
}

function removeImagebox(index) {
    masterCard[currentSide].imageboxes.splice(index, 1);
    
    // Update all existing cards to match new master structure
    updateCardContentsStructure();
    
    updateElementLists();
    updateCardPreview();
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
    card.style.borderStyle = 'solid';

    // Background image
    if (currentCardSide.backgroundImage) {
        card.style.backgroundImage = `url(${currentCardSide.backgroundImage})`;
        card.style.backgroundSize = 'cover';
        card.style.backgroundPosition = 'center';
    } else {
        card.style.backgroundImage = 'none';
    }

    // Clear existing content
    card.innerHTML = '';

    // Add textboxes
    currentCardSide.textboxes.forEach((textbox, index) => {
        const textboxElement = document.createElement('div');
        textboxElement.className = 'card-textbox';
        textboxElement.textContent = textbox.text;
        textboxElement.style.left = textbox.x + 'px';
        textboxElement.style.top = textbox.y + 'px';
        textboxElement.style.width = textbox.width + 'px';
        textboxElement.style.height = textbox.height + 'px';
        textboxElement.style.fontSize = textbox.fontSize + 'px';
        textboxElement.style.color = textbox.fontColor;
        
        // Make draggable
        makeDraggable(textboxElement, 'textbox', index);
        
        card.appendChild(textboxElement);
    });

    // Add imageboxes
    currentCardSide.imageboxes.forEach((imagebox, index) => {
        const imageboxElement = document.createElement('div');
        imageboxElement.className = 'card-imagebox';
        imageboxElement.style.left = imagebox.x + 'px';
        imageboxElement.style.top = imagebox.y + 'px';
        imageboxElement.style.width = imagebox.width + 'px';
        imageboxElement.style.height = imagebox.height + 'px';
        
        if (imagebox.image) {
            const img = document.createElement('img');
            img.src = imagebox.image;
            img.alt = imagebox.name;
            imageboxElement.appendChild(img);
        } else {
            imageboxElement.textContent = imagebox.name;
        }
        
        // Make draggable
        makeDraggable(imageboxElement, 'imagebox', index);
        
        card.appendChild(imageboxElement);
    });

    // Add watermark
    if (currentCardSide.watermark) {
        const watermark = document.createElement('div');
        watermark.className = 'card-watermark';
        watermark.textContent = currentCardSide.watermark;
        card.appendChild(watermark);
    }
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
        
        let elementWidth, elementHeight;
        if (type === 'textbox') {
            elementWidth = masterCard[currentSide].textboxes[index].width;
            elementHeight = masterCard[currentSide].textboxes[index].height;
        } else if (type === 'imagebox') {
            elementWidth = masterCard[currentSide].imageboxes[index].width;
            elementHeight = masterCard[currentSide].imageboxes[index].height;
        }
        
        const newX = Math.max(0, Math.min(200 - elementWidth, initialX + deltaX));
        const newY = Math.max(0, Math.min(280 - elementHeight, initialY + deltaY));
        
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
        // Extract values from existing form elements
        const inputs = container.querySelectorAll('textarea, input[type="file"]');
        inputs.forEach(input => {
            if (input.type === 'file') {
                // For file inputs, we keep the data in cardContents already
                return;
            } else {
                existingValues[input.id] = input.value;
            }
        });
    }
    
    container.innerHTML = '';

    // Ensure card contents array is properly sized and structured
    // This is now handled by updateCardContentsForNewGrid() when grid changes
    if (cardContents.length === 0) {
        // Only initialize if completely empty (first time)
        updateCardContentsForNewGrid();
    } else {
        // Ensure we have enough cards for current actual count
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
                        ${cardContents[i]?.front?.imageboxes[imageboxIndex] ? '<div style="margin-top: 5px; font-size: 12px; color: #0d7377;">✓ Bild hochgeladen</div>' : ''}
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
                        ${cardContents[i]?.back?.imageboxes[imageboxIndex] ? '<div style="margin-top: 5px; font-size: 12px; color: #0d7377;">✓ Bild hochgeladen</div>' : ''}
                    </div>
                `;
            });
            
            cardHTML += `</div>`; // Close back side section
        }

        cardInput.innerHTML = cardHTML;
        container.appendChild(cardInput);
    }
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
            cardContents[cardIndex][side].imageboxes[imageboxIndex] = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

function saveCardContents() {
    console.log('Card contents saved:', cardContents);
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
        (masterCard.back.watermark !== masterCard.front.watermark) ||
        (masterCard.back.backgroundImage !== masterCard.front.backgroundImage)
    );

    // Create container for front page
    const frontPageContainer = document.createElement('div');
    frontPageContainer.style.marginBottom = '20px';
    
    const frontTitle = document.createElement('h4');
    frontTitle.textContent = 'Vorderseiten';
    frontTitle.style.textAlign = 'center';
    frontTitle.style.color = 'white';
    frontTitle.style.margin = '0 0 10px 0';
    frontPageContainer.appendChild(frontTitle);

    // Create front sides page
    const frontPage = document.createElement('div');
    frontPage.className = 'pdf-page';
    frontPage.style.gridTemplateColumns = `repeat(${projectConfig.grid.width}, 1fr)`;
    frontPage.style.gridTemplateRows = `repeat(${projectConfig.grid.height}, 1fr)`;

    // Ensure we have the right number of cards
    const totalCards = projectConfig.maxCardCount;  // Show full grid
    const actualCards = projectConfig.actualCardCount;  // Only fill up to actual count
    for (let i = 0; i < totalCards; i++) {
        if (i < actualCards && i < cardContents.length) {
            const frontCard = createPDFCard(cardContents[i], i, 'front');
            frontPage.appendChild(frontCard);
        } else {
            // Create empty placeholder card
            const emptyCard = document.createElement('div');
            emptyCard.className = 'pdf-card';
            emptyCard.style.backgroundColor = '#f5f5f5';
            emptyCard.style.border = '1px dashed #ccc';
            emptyCard.style.display = 'flex';
            emptyCard.style.alignItems = 'center';
            emptyCard.style.justifyContent = 'center';
            emptyCard.style.color = '#999';
            emptyCard.style.fontSize = '10px';
            if (i >= actualCards) {
                emptyCard.textContent = '(nicht verwendet)';
            } else {
                emptyCard.textContent = '(leer)';
            }
            frontPage.appendChild(emptyCard);
        }
    }

    frontPageContainer.appendChild(frontPage);
    preview.appendChild(frontPageContainer);

    // Create back sides page only if there's back content
    if (hasBackContent) {
        const backPageContainer = document.createElement('div');
        backPageContainer.style.marginBottom = '20px';
        
        const backTitle = document.createElement('h4');
        backTitle.textContent = 'Rückseiten';
        backTitle.style.textAlign = 'center';
        backTitle.style.color = 'white';
        backTitle.style.margin = '0 0 10px 0';
        backPageContainer.appendChild(backTitle);

        const backPage = document.createElement('div');
        backPage.className = 'pdf-page';
        backPage.style.gridTemplateColumns = `repeat(${projectConfig.grid.width}, 1fr)`;
        backPage.style.gridTemplateRows = `repeat(${projectConfig.grid.height}, 1fr)`;

        // Same order as front sides (no reversal needed, printer handles alignment)
        for (let i = 0; i < totalCards; i++) {
            if (i < actualCards && i < cardContents.length) {
                const backCard = createPDFCard(cardContents[i], i, 'back');
                // No mirroring - printer will handle proper alignment
                backPage.appendChild(backCard);
            } else {
                // Create empty placeholder card
                const emptyCard = document.createElement('div');
                emptyCard.className = 'pdf-card';
                emptyCard.style.backgroundColor = '#f5f5f5';
                emptyCard.style.border = '1px dashed #ccc';
                // No mirroring for empty cards either
                emptyCard.style.display = 'flex';
                emptyCard.style.alignItems = 'center';
                emptyCard.style.justifyContent = 'center';
                emptyCard.style.color = '#999';
                emptyCard.style.fontSize = '10px';
                if (i >= actualCards) {
                    emptyCard.textContent = '(nicht verwendet)';
                } else {
                    emptyCard.textContent = '(leer)';
                }
                backPage.appendChild(emptyCard);
            }
        }

        backPageContainer.appendChild(backPage);
        preview.appendChild(backPageContainer);
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
    card.style.borderStyle = 'solid';

    if (cardSideData.backgroundImage) {
        card.style.backgroundImage = `url(${cardSideData.backgroundImage})`;
        card.style.backgroundSize = 'cover';
        card.style.backgroundPosition = 'center';
    }

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

    // Add watermark
    if (cardSideData.watermark) {
        const watermark = document.createElement('div');
        watermark.className = 'card-watermark';
        watermark.textContent = cardSideData.watermark;
        watermark.style.fontSize = '4px';
        card.appendChild(watermark);
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

    // Create cards for front side - only export actual cards, not the full grid
    const totalCards = projectConfig.actualCardCount;
    for (let i = 0; i < totalCards; i++) {
        const row = Math.floor(i / projectConfig.grid.width);
        const col = i % projectConfig.grid.width;
        
        const x = margin + (col * cardWidth);
        const y = margin + (row * cardHeight);

        // Get current side data
        const currentSide = masterCard.front;

        // Draw card background
        pdf.setFillColor(currentSide.backgroundColor);
        pdf.rect(x, y, cardWidth, cardHeight, 'F');

        // Draw border
        pdf.setDrawColor(currentSide.borderColor);
        pdf.setLineWidth(currentSide.borderWidth * 0.1);
        pdf.rect(x, y, cardWidth, cardHeight);

        // Add textboxes
        if (currentSide.textboxes && i < cardContents.length) {
            currentSide.textboxes.forEach((textbox, textboxIndex) => {
                const content = cardContents[i].front?.textboxes?.[textboxIndex] || textbox.text;
                
                // Scale textbox position and size
                const textX = x + (textbox.x * cardWidth / 200);
                const textY = y + (textbox.y * cardHeight / 280) + (textbox.fontSize * 0.1);
                
                pdf.setFontSize(textbox.fontSize * 0.3);
                pdf.setTextColor(textbox.fontColor);
                
                // Split text into lines that fit the textbox width
                const maxWidth = (textbox.width * cardWidth / 200);
                const lines = pdf.splitTextToSize(content, maxWidth);
                
                pdf.text(lines, textX, textY);
            });
        }

        // Add images
        if (currentSide.imageboxes && i < cardContents.length) {
            currentSide.imageboxes.forEach((imagebox, imageboxIndex) => {
                const imageData = cardContents[i].front?.imageboxes?.[imageboxIndex];
                
                if (imageData && imageData.src) {
                    const imgX = x + (imagebox.x * cardWidth / 200);
                    const imgY = y + (imagebox.y * cardHeight / 280);
                    const imgWidth = imagebox.width * cardWidth / 200;
                    const imgHeight = imagebox.height * cardHeight / 280;
                    
                    try {
                        pdf.addImage(imageData.src, 'JPEG', imgX, imgY, imgWidth, imgHeight);
                    } catch (error) {
                        console.warn('Error adding image to PDF:', error);
                    }
                }
            });
        }

        // Add watermark
        if (currentSide.watermark) {
            pdf.setFontSize(6);
            pdf.setTextColor(128, 128, 128);
            pdf.text(currentSide.watermark, x + cardWidth - 15, y + cardHeight - 2);
        }
    }

    // Add new page for back side if it has content or design differences
    const hasBackContent = masterCard.back && (
        (masterCard.back.textboxes && masterCard.back.textboxes.length > 0) ||
        (masterCard.back.imageboxes && masterCard.back.imageboxes.length > 0) ||
        (masterCard.back.backgroundColor !== masterCard.front.backgroundColor) ||
        (masterCard.back.borderWidth !== masterCard.front.borderWidth) ||
        (masterCard.back.borderColor !== masterCard.front.borderColor) ||
        (masterCard.back.watermark !== masterCard.front.watermark) ||
        (masterCard.back.backgroundImage !== masterCard.front.backgroundImage)
    );

    if (hasBackContent) {
        pdf.addPage();
        
        // Create cards for back side (same order as front side)
        for (let i = 0; i < totalCards; i++) {
            const row = Math.floor(i / projectConfig.grid.width);
            const col = i % projectConfig.grid.width;
            
            const x = margin + (col * cardWidth);
            const y = margin + (row * cardHeight);

            // Get current side data
            const currentSide = masterCard.back;

            // Draw card background
            pdf.setFillColor(currentSide.backgroundColor);
            pdf.rect(x, y, cardWidth, cardHeight, 'F');

            // Draw border
            pdf.setDrawColor(currentSide.borderColor);
            pdf.setLineWidth(currentSide.borderWidth * 0.1);
            pdf.rect(x, y, cardWidth, cardHeight);

            // Add textboxes
            if (currentSide.textboxes && i < cardContents.length) {
                currentSide.textboxes.forEach((textbox, textboxIndex) => {
                    const content = cardContents[i].back?.textboxes?.[textboxIndex] || textbox.text;
                    
                    // Scale textbox position and size
                    const textX = x + (textbox.x * cardWidth / 200);
                    const textY = y + (textbox.y * cardHeight / 280) + (textbox.fontSize * 0.1);
                    
                    pdf.setFontSize(textbox.fontSize * 0.3);
                    pdf.setTextColor(textbox.fontColor);
                    
                    // Split text into lines that fit the textbox width
                    const maxWidth = (textbox.width * cardWidth / 200);
                    const lines = pdf.splitTextToSize(content, maxWidth);
                    
                    pdf.text(lines, textX, textY);
                });
            }

            // Add images
            if (currentSide.imageboxes && i < cardContents.length) {
                currentSide.imageboxes.forEach((imagebox, imageboxIndex) => {
                    const imageData = cardContents[i].back?.imageboxes?.[imageboxIndex];
                    
                    if (imageData && imageData.src) {
                        const imgX = x + (imagebox.x * cardWidth / 200);
                        const imgY = y + (imagebox.y * cardHeight / 280);
                        const imgWidth = imagebox.width * cardWidth / 200;
                        const imgHeight = imagebox.height * cardHeight / 280;
                        
                        try {
                            pdf.addImage(imageData.src, 'JPEG', imgX, imgY, imgWidth, imgHeight);
                        } catch (error) {
                            console.warn('Error adding image to PDF:', error);
                        }
                    }
                });
            }

            // Add watermark
            if (currentSide.watermark) {
                pdf.setFontSize(6);
                pdf.setTextColor(128, 128, 128);
                pdf.text(currentSide.watermark, x + cardWidth - 15, y + cardHeight - 2);
            }
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
        cardCount: 9
    };
    
    masterCard = {
        front: {
            backgroundColor: '#ffffff',
            borderWidth: 2,
            borderColor: '#000000',
            watermark: '',
            backgroundImage: null,
            textboxes: [],
            imageboxes: []
        },
        back: {
            backgroundColor: '#ffffff',
            borderWidth: 2,
            borderColor: '#000000',
            watermark: '',
            backgroundImage: null,
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

// Make functions global for HTML onclick handlers
window.updateTextboxText = updateTextboxText;
window.updateTextboxFontSize = updateTextboxFontSize;
window.updateTextboxColor = updateTextboxColor;
window.removeTextbox = removeTextbox;
window.updateImageboxName = updateImageboxName;
window.updateImageboxImage = updateImageboxImage;
window.removeImagebox = removeImagebox;
window.updateCardContent = updateCardContent;
window.updateCardImageContent = updateCardImageContent;
