// Global variables
let currentTab = 'project';
let projectConfig = {
    name: 'Meine Karten',
    grid: { width: 3, height: 3 },
    cardCount: 9
};

let masterCard = {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#000000',
    watermark: '',
    backgroundImage: null,
    textboxes: [],
    imageboxes: []
};

let cardContents = [];
let textboxCounter = 0;
let imageboxCounter = 0;

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeTabs();
    initializeProject();
    initializeDesign();
    updateGridPreview();
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
    if (tabName === 'content') {
        // Ensure content inputs are generated when switching to content tab
        if (masterCard.textboxes.length > 0 || masterCard.imageboxes.length > 0) {
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

    // Project name
    projectNameInput.addEventListener('input', () => {
        projectConfig.name = projectNameInput.value || 'Meine Karten';
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
        projectConfig.cardCount = projectConfig.grid.width * projectConfig.grid.height;
        updateGridPreview();
    }
}

function updateGridPreview() {
    const preview = document.getElementById('gridPreview');
    const { width, height } = projectConfig.grid;
    
    preview.style.gridTemplateColumns = `repeat(${width}, 1fr)`;
    preview.style.gridTemplateRows = `repeat(${height}, 1fr)`;
    
    preview.innerHTML = '';
    for (let i = 0; i < projectConfig.cardCount; i++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.textContent = `Karte ${i + 1}`;
        preview.appendChild(cell);
    }
}

function saveProjectConfig() {
    projectConfig.name = document.getElementById('projectName').value || 'Meine Karten';
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

    // Background color
    backgroundColor.addEventListener('change', () => {
        masterCard.backgroundColor = backgroundColor.value;
        updateCardPreview();
    });

    // Border width
    borderWidth.addEventListener('input', () => {
        masterCard.borderWidth = borderWidth.value;
        borderWidthValue.textContent = borderWidth.value + 'px';
        updateCardPreview();
    });

    // Border color
    borderColor.addEventListener('change', () => {
        masterCard.borderColor = borderColor.value;
        updateCardPreview();
    });

    // Watermark
    watermarkText.addEventListener('input', () => {
        masterCard.watermark = watermarkText.value;
        updateCardPreview();
    });

    // Background image
    backgroundImage.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                masterCard.backgroundImage = e.target.result;
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

    masterCard.textboxes.push(textbox);
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

    masterCard.imageboxes.push(imagebox);
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

    masterCard.textboxes.forEach((textbox, index) => {
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
    masterCard.textboxes[index].text = text;
    updateCardPreview();
}

function updateTextboxFontSize(index, fontSize) {
    masterCard.textboxes[index].fontSize = parseInt(fontSize) || 12;
    updateCardPreview();
}

function updateTextboxColor(index, color) {
    masterCard.textboxes[index].fontColor = color;
    updateCardPreview();
}

function removeTextbox(index) {
    masterCard.textboxes.splice(index, 1);
    updateElementLists();
    updateCardPreview();
}

function updateImageboxList() {
    const list = document.getElementById('imageboxList');
    list.innerHTML = '';

    masterCard.imageboxes.forEach((imagebox, index) => {
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
    masterCard.imageboxes[index].name = name;
    updateCardPreview();
}

function updateImageboxImage(index, input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            masterCard.imageboxes[index].image = e.target.result;
            updateElementLists();
            updateCardPreview();
        };
        reader.readAsDataURL(file);
    }
}

function removeImagebox(index) {
    masterCard.imageboxes.splice(index, 1);
    updateElementLists();
    updateCardPreview();
}

function updateCardPreview() {
    const card = document.getElementById('masterCard');
    
    // Apply basic styles
    card.style.backgroundColor = masterCard.backgroundColor;
    card.style.borderWidth = masterCard.borderWidth + 'px';
    card.style.borderColor = masterCard.borderColor;
    card.style.borderStyle = 'solid';

    // Background image
    if (masterCard.backgroundImage) {
        card.style.backgroundImage = `url(${masterCard.backgroundImage})`;
        card.style.backgroundSize = 'cover';
        card.style.backgroundPosition = 'center';
    } else {
        card.style.backgroundImage = 'none';
    }

    // Clear existing content
    card.innerHTML = '';

    // Add textboxes
    masterCard.textboxes.forEach((textbox, index) => {
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
    masterCard.imageboxes.forEach((imagebox, index) => {
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
    if (masterCard.watermark) {
        const watermark = document.createElement('div');
        watermark.className = 'card-watermark';
        watermark.textContent = masterCard.watermark;
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
            initialX = masterCard.textboxes[index].x;
            initialY = masterCard.textboxes[index].y;
        } else if (type === 'imagebox') {
            initialX = masterCard.imageboxes[index].x;
            initialY = masterCard.imageboxes[index].y;
        }
        
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        
        let elementWidth, elementHeight;
        if (type === 'textbox') {
            elementWidth = masterCard.textboxes[index].width;
            elementHeight = masterCard.textboxes[index].height;
        } else if (type === 'imagebox') {
            elementWidth = masterCard.imageboxes[index].width;
            elementHeight = masterCard.imageboxes[index].height;
        }
        
        const newX = Math.max(0, Math.min(200 - elementWidth, initialX + deltaX));
        const newY = Math.max(0, Math.min(280 - elementHeight, initialY + deltaY));
        
        if (type === 'textbox') {
            masterCard.textboxes[index].x = newX;
            masterCard.textboxes[index].y = newY;
        } else if (type === 'imagebox') {
            masterCard.imageboxes[index].x = newX;
            masterCard.imageboxes[index].y = newY;
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
    container.innerHTML = '';

    // Initialize card contents array
    cardContents = [];
    
    for (let i = 0; i < projectConfig.cardCount; i++) {
        const cardInput = document.createElement('div');
        cardInput.className = 'card-input';
        
        let textboxInputs = '';
        masterCard.textboxes.forEach((textbox, textboxIndex) => {
            textboxInputs += `
                <div class="textbox-input">
                    <label>📝 Textbox ${textbox.id}:</label>
                    <textarea 
                        id="card_${i}_textbox_${textboxIndex}" 
                        placeholder="Inhalt für ${textbox.text}"
                        onchange="updateCardContent(${i}, 'textbox', ${textboxIndex}, this.value)"
                    ></textarea>
                </div>
            `;
        });

        let imageboxInputs = '';
        masterCard.imageboxes.forEach((imagebox, imageboxIndex) => {
            imageboxInputs += `
                <div class="textbox-input">
                    <label>🖼️ Bild ${imagebox.id}:</label>
                    <input 
                        type="file" 
                        accept="image/*"
                        id="card_${i}_imagebox_${imageboxIndex}"
                        onchange="updateCardImageContent(${i}, ${imageboxIndex}, this)"
                    >
                </div>
            `;
        });

        cardInput.innerHTML = `
            <h4>Karte ${i + 1}</h4>
            ${textboxInputs}
            ${imageboxInputs}
        `;

        container.appendChild(cardInput);

        // Initialize card content
        const cardContent = {
            cardIndex: i,
            textboxes: masterCard.textboxes.map(() => ''),
            imageboxes: masterCard.imageboxes.map(() => null)
        };
        cardContents.push(cardContent);
    }
}

function updateCardContent(cardIndex, type, elementIndex, value) {
    if (type === 'textbox') {
        cardContents[cardIndex].textboxes[elementIndex] = value;
    }
}

function updateCardImageContent(cardIndex, imageboxIndex, input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            cardContents[cardIndex].imageboxes[imageboxIndex] = e.target.result;
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

    const pdfPage = document.createElement('div');
    pdfPage.className = 'pdf-page';
    pdfPage.style.gridTemplateColumns = `repeat(${projectConfig.grid.width}, 1fr)`;
    pdfPage.style.gridTemplateRows = `repeat(${projectConfig.grid.height}, 1fr)`;

    cardContents.forEach((cardContent, index) => {
        const pdfCard = createPDFCard(cardContent, index);
        pdfPage.appendChild(pdfCard);
    });

    preview.appendChild(pdfPage);
}

function createPDFCard(cardContent, cardIndex) {
    const card = document.createElement('div');
    card.className = 'pdf-card';
    
    // Apply master card styles
    card.style.backgroundColor = masterCard.backgroundColor;
    card.style.borderWidth = (masterCard.borderWidth * 0.5) + 'px'; // Scale down for preview
    card.style.borderColor = masterCard.borderColor;
    card.style.borderStyle = 'solid';

    if (masterCard.backgroundImage) {
        card.style.backgroundImage = `url(${masterCard.backgroundImage})`;
        card.style.backgroundSize = 'cover';
        card.style.backgroundPosition = 'center';
    }

    // Add textboxes with content
    masterCard.textboxes.forEach((textbox, textboxIndex) => {
        const textboxElement = document.createElement('div');
        textboxElement.className = 'pdf-card-textbox';
        textboxElement.textContent = cardContent.textboxes[textboxIndex] || textbox.text;
        
        // Scale positions and sizes for PDF
        textboxElement.style.left = (textbox.x * 0.5) + 'px';
        textboxElement.style.top = (textbox.y * 0.5) + 'px';
        textboxElement.style.width = (textbox.width * 0.5) + 'px';
        textboxElement.style.height = (textbox.height * 0.5) + 'px';
        textboxElement.style.fontSize = (textbox.fontSize * 0.4) + 'px';
        textboxElement.style.color = textbox.fontColor;
        
        card.appendChild(textboxElement);
    });

    // Add imageboxes with content
    masterCard.imageboxes.forEach((imagebox, imageboxIndex) => {
        const imageboxElement = document.createElement('div');
        imageboxElement.className = 'pdf-card-textbox';
        imageboxElement.style.left = (imagebox.x * 0.5) + 'px';
        imageboxElement.style.top = (imagebox.y * 0.5) + 'px';
        imageboxElement.style.width = (imagebox.width * 0.5) + 'px';
        imageboxElement.style.height = (imagebox.height * 0.5) + 'px';
        imageboxElement.style.overflow = 'hidden';
        
        const imageData = cardContent.imageboxes[imageboxIndex] || imagebox.image;
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

    // Add watermark
    if (masterCard.watermark) {
        const watermark = document.createElement('div');
        watermark.className = 'card-watermark';
        watermark.textContent = masterCard.watermark;
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

    // Create cards
    for (let i = 0; i < cardContents.length; i++) {
        const row = Math.floor(i / projectConfig.grid.width);
        const col = i % projectConfig.grid.width;
        
        const x = margin + (col * cardWidth);
        const y = margin + (row * cardHeight);

        // Draw card background
        pdf.setFillColor(masterCard.backgroundColor);
        pdf.rect(x, y, cardWidth, cardHeight, 'F');

        // Draw border
        pdf.setDrawColor(masterCard.borderColor);
        pdf.setLineWidth(masterCard.borderWidth * 0.1);
        pdf.rect(x, y, cardWidth, cardHeight);

        // Add textboxes
        masterCard.textboxes.forEach((textbox, textboxIndex) => {
            const content = cardContents[i].textboxes[textboxIndex] || textbox.text;
            
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

        // Add watermark
        if (masterCard.watermark) {
            pdf.setFontSize(6);
            pdf.setTextColor(128, 128, 128);
            pdf.text(masterCard.watermark, x + cardWidth - 15, y + cardHeight - 2);
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
        backgroundColor: '#ffffff',
        borderWidth: 2,
        borderColor: '#000000',
        watermark: '',
        backgroundImage: null,
        textboxes: [],
        imageboxes: []
    };
    
    cardContents = [];
    textboxCounter = 0;
    imageboxCounter = 0;
    
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
