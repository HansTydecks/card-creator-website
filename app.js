// Card Creator - Main Application
class CardCreator {
    constructor() {
        this.currentStep = 'project-setup';
        this.project = {
            paperSize: 'a4',
            layout: '2x2',
            cardCount: 4,
            masterCard: {
                front: {
                    backgroundColor: '#ffffff',
                    texture: 'none',
                    textFields: [],
                    imageFields: [],
                    showCutMarks: false,
                    showCardNumbers: false,
                    showWatermark: false
                },
                back: {
                    backgroundColor: '#ffffff',
                    texture: 'none',
                    textFields: [],
                    imageFields: [],
                    showCutMarks: false,
                    showCardNumbers: false,
                    showWatermark: false
                }
            },
            cards: []
        };
        this.currentSide = 'front';
        this.canvas = null;
        this.ctx = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initCanvas();
        this.showStep('project-setup');
    }

    setupEventListeners() {
        // Project Setup
        document.getElementById('start-design').addEventListener('click', () => {
            this.collectProjectSettings();
            this.showStep('master-design');
        });

        // Paper size selection
        document.querySelectorAll('input[name="paper-size"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.project.paperSize = e.target.value;
            });
        });

        // Layout selection
        document.querySelectorAll('.layout-option').forEach(option => {
            option.addEventListener('click', (e) => {
                document.querySelectorAll('.layout-option').forEach(o => o.classList.remove('selected'));
                option.classList.add('selected');
                this.project.layout = option.dataset.layout;
            });
        });

        // Card count
        document.getElementById('card-count').addEventListener('change', (e) => {
            this.project.cardCount = parseInt(e.target.value);
        });

        // Master Design
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchSide(e.target.dataset.side);
            });
        });

        document.getElementById('bg-color').addEventListener('change', (e) => {
            this.project.masterCard[this.currentSide].backgroundColor = e.target.value;
            this.updateCanvasPreview();
        });

        document.getElementById('bg-texture').addEventListener('change', (e) => {
            this.project.masterCard[this.currentSide].texture = e.target.value;
            this.updateCanvasPreview();
        });

        document.getElementById('show-cut-marks').addEventListener('change', (e) => {
            this.project.masterCard[this.currentSide].showCutMarks = e.target.checked;
            this.updateCanvasPreview();
        });

        document.getElementById('show-card-numbers').addEventListener('change', (e) => {
            this.project.masterCard[this.currentSide].showCardNumbers = e.target.checked;
            this.updateCanvasPreview();
        });

        document.getElementById('show-watermark').addEventListener('change', (e) => {
            this.project.masterCard[this.currentSide].showWatermark = e.target.checked;
            this.updateCanvasPreview();
        });

        document.getElementById('add-text-field').addEventListener('click', () => {
            this.addTextField();
        });

        document.getElementById('add-image-field').addEventListener('click', () => {
            this.addImageField();
        });

        // Navigation
        document.getElementById('back-to-setup').addEventListener('click', () => {
            this.showStep('project-setup');
        });

        document.getElementById('continue-to-cards').addEventListener('click', () => {
            this.initializeCards();
            this.showStep('cards-edit');
        });

        document.getElementById('back-to-master').addEventListener('click', () => {
            this.showStep('master-design');
        });

        document.getElementById('generate-preview').addEventListener('click', () => {
            this.generatePreview();
        });

        document.getElementById('download-pdf').addEventListener('click', () => {
            this.downloadPDF();
        });

        document.getElementById('back-to-cards').addEventListener('click', () => {
            this.showStep('cards-edit');
        });

        document.getElementById('new-project').addEventListener('click', () => {
            this.newProject();
        });

        // Canvas click for positioning elements
        document.getElementById('card-preview').addEventListener('click', (e) => {
            this.handleCanvasClick(e);
        });
    }

    collectProjectSettings() {
        // Paper size is already collected via radio button event
        // Layout is already collected via click event
        // Card count is already collected via change event
        
        // Set default layout selection if none selected
        if (!document.querySelector('.layout-option.selected')) {
            document.querySelector('.layout-option[data-layout="2x2"]').classList.add('selected');
            this.project.layout = '2x2';
        }
    }

    showStep(stepId) {
        document.querySelectorAll('.step').forEach(step => {
            step.classList.remove('active');
        });
        document.getElementById(stepId).classList.add('active');
        this.currentStep = stepId;

        if (stepId === 'master-design') {
            this.initCanvas();
            this.updateCanvasPreview();
        }
    }

    switchSide(side) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-side="${side}"]`).classList.add('active');
        this.currentSide = side;
        
        // Update UI to reflect current side settings
        this.updateSideControls();
        this.updateCanvasPreview();
    }

    updateSideControls() {
        const sideData = this.project.masterCard[this.currentSide];
        
        document.getElementById('bg-color').value = sideData.backgroundColor;
        document.getElementById('bg-texture').value = sideData.texture;
        document.getElementById('show-cut-marks').checked = sideData.showCutMarks;
        document.getElementById('show-card-numbers').checked = sideData.showCardNumbers;
        document.getElementById('show-watermark').checked = sideData.showWatermark;
        
        this.updateFieldsLists();
    }

    updateFieldsLists() {
        const sideData = this.project.masterCard[this.currentSide];
        
        // Update text fields list
        const textFieldsList = document.getElementById('text-fields-list');
        textFieldsList.innerHTML = '';
        sideData.textFields.forEach((field, index) => {
            const fieldElement = this.createFieldElement('text', field, index);
            textFieldsList.appendChild(fieldElement);
        });

        // Update image fields list
        const imageFieldsList = document.getElementById('image-fields-list');
        imageFieldsList.innerHTML = '';
        sideData.imageFields.forEach((field, index) => {
            const fieldElement = this.createFieldElement('image', field, index);
            imageFieldsList.appendChild(fieldElement);
        });
    }

    createFieldElement(type, field, index) {
        const div = document.createElement('div');
        div.className = 'field-element';
        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <strong>${type === 'text' ? 'Text' : 'Bild'} ${index + 1}</strong>
                <button class="btn btn-sm" onclick="cardCreator.removeField('${type}', ${index})" style="background: #dc3545; color: white; padding: 0.2rem 0.5rem; font-size: 0.8rem;">×</button>
            </div>
            <div style="font-size: 0.9rem; color: #6c757d;">
                Position: ${field.x}, ${field.y}<br>
                ${type === 'text' ? `Schrift: ${field.fontSize}px ${field.fontFamily}` : `Größe: ${field.width}×${field.height}`}
            </div>
        `;
        return div;
    }

    addTextField() {
        const sideData = this.project.masterCard[this.currentSide];
        const newField = {
            x: 50,
            y: 50 + (sideData.textFields.length * 30),
            width: 200,
            height: 30,
            fontSize: 16,
            fontFamily: 'Arial',
            fontWeight: 'normal',
            textAlign: 'left',
            color: '#000000',
            placeholder: 'Textinhalt'
        };
        
        sideData.textFields.push(newField);
        this.updateFieldsLists();
        this.updateCanvasPreview();
    }

    addImageField() {
        const sideData = this.project.masterCard[this.currentSide];
        const newField = {
            x: 50,
            y: 100 + (sideData.imageFields.length * 80),
            width: 80,
            height: 60,
            alignment: 'center',
            placeholder: 'Bild'
        };
        
        sideData.imageFields.push(newField);
        this.updateFieldsLists();
        this.updateCanvasPreview();
    }

    removeField(type, index) {
        const sideData = this.project.masterCard[this.currentSide];
        if (type === 'text') {
            sideData.textFields.splice(index, 1);
        } else {
            sideData.imageFields.splice(index, 1);
        }
        this.updateFieldsLists();
        this.updateCanvasPreview();
    }

    initCanvas() {
        this.canvas = document.getElementById('card-preview');
        this.ctx = this.canvas.getContext('2d');
        
        // Set canvas size based on paper format and layout
        const cardSize = this.getCardSize();
        this.canvas.width = cardSize.width;
        this.canvas.height = cardSize.height;
    }

    getCardSize() {
        // Return card dimensions in pixels for preview
        // This is simplified - in real implementation you'd calculate based on DPI
        const sizes = {
            'a4': { '2x2': {width: 200, height: 280}, '2x4': {width: 150, height: 210}, '3x3': {width: 120, height: 170} },
            'a3': { '2x2': {width: 280, height: 400}, '2x4': {width: 210, height: 300}, '3x3': {width: 170, height: 240} }
        };
        
        return sizes[this.project.paperSize][this.project.layout] || {width: 200, height: 280};
    }

    updateCanvasPreview() {
        if (!this.ctx) return;
        
        const sideData = this.project.masterCard[this.currentSide];
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background
        this.ctx.fillStyle = sideData.backgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw texture
        this.drawTexture(sideData.texture);
        
        // Draw text fields
        sideData.textFields.forEach(field => {
            this.drawTextField(field);
        });
        
        // Draw image fields
        sideData.imageFields.forEach(field => {
            this.drawImageField(field);
        });
        
        // Draw cut marks
        if (sideData.showCutMarks) {
            this.drawCutMarks();
        }
        
        // Draw card number
        if (sideData.showCardNumbers) {
            this.drawCardNumber();
        }
        
        // Draw watermark
        if (sideData.showWatermark) {
            this.drawWatermark();
        }
    }

    drawTexture(texture) {
        if (texture === 'none') return;
        
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.lineWidth = 1;
        
        switch (texture) {
            case 'lines':
                for (let y = 0; y < this.canvas.height; y += 20) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(0, y);
                    this.ctx.lineTo(this.canvas.width, y);
                    this.ctx.stroke();
                }
                break;
            case 'dots':
                for (let x = 10; x < this.canvas.width; x += 20) {
                    for (let y = 10; y < this.canvas.height; y += 20) {
                        this.ctx.beginPath();
                        this.ctx.arc(x, y, 1, 0, 2 * Math.PI);
                        this.ctx.fill();
                    }
                }
                break;
            case 'grid':
                for (let x = 0; x < this.canvas.width; x += 20) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(x, 0);
                    this.ctx.lineTo(x, this.canvas.height);
                    this.ctx.stroke();
                }
                for (let y = 0; y < this.canvas.height; y += 20) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(0, y);
                    this.ctx.lineTo(this.canvas.width, y);
                    this.ctx.stroke();
                }
                break;
        }
    }

    drawTextField(field) {
        this.ctx.fillStyle = field.color;
        this.ctx.font = `${field.fontWeight} ${field.fontSize}px ${field.fontFamily}`;
        this.ctx.textAlign = field.textAlign;
        
        const x = field.textAlign === 'center' ? field.x + field.width / 2 : 
                  field.textAlign === 'right' ? field.x + field.width : field.x;
        
        this.ctx.fillText(field.placeholder, x, field.y + field.fontSize);
        
        // Draw field border for preview
        this.ctx.strokeStyle = 'rgba(102, 126, 234, 0.5)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(field.x, field.y, field.width, field.height);
    }

    drawImageField(field) {
        // Draw placeholder rectangle
        this.ctx.fillStyle = '#f8f9fa';
        this.ctx.fillRect(field.x, field.y, field.width, field.height);
        
        this.ctx.strokeStyle = 'rgba(102, 126, 234, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(field.x, field.y, field.width, field.height);
        
        // Draw placeholder text
        this.ctx.fillStyle = '#6c757d';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(field.placeholder, field.x + field.width / 2, field.y + field.height / 2 + 4);
    }

    drawCutMarks() {
        this.ctx.strokeStyle = this.getContrastColor(this.project.masterCard[this.currentSide].backgroundColor);
        this.ctx.lineWidth = 1;
        
        const markLength = 10;
        const offset = 5;
        
        // Corner marks
        // Top-left
        this.ctx.beginPath();
        this.ctx.moveTo(-offset, -offset);
        this.ctx.lineTo(-offset + markLength, -offset);
        this.ctx.moveTo(-offset, -offset);
        this.ctx.lineTo(-offset, -offset + markLength);
        this.ctx.stroke();
        
        // Similar for other corners...
    }

    drawCardNumber() {
        this.ctx.fillStyle = '#666';
        this.ctx.font = '10px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('#1', 5, this.canvas.height - 5);
    }

    drawWatermark() {
        this.ctx.save();
        this.ctx.globalAlpha = 0.1;
        this.ctx.fillStyle = '#000';
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.rotate(-Math.PI / 4);
        this.ctx.fillText('SERIES-001', 0, 0);
        this.ctx.restore();
    }

    getContrastColor(backgroundColor) {
        // Simple contrast calculation
        const hex = backgroundColor.substring(1);
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness > 128 ? '#000000' : '#ffffff';
    }

    handleCanvasClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // For now, just log the click position
        // In a full implementation, this would handle element positioning
        console.log(`Canvas clicked at: ${x}, ${y}`);
        document.getElementById('canvas-info-text').textContent = `Geklickt bei: ${Math.round(x)}, ${Math.round(y)}`;
    }

    initializeCards() {
        this.project.cards = [];
        for (let i = 0; i < this.project.cardCount; i++) {
            this.project.cards.push({
                id: i + 1,
                front: this.createCardSide(),
                back: this.createCardSide()
            });
        }
        this.renderCardsAccordion();
    }

    createCardSide() {
        return {
            textFields: {},
            imageFields: {},
            customBackground: null
        };
    }

    renderCardsAccordion() {
        const accordion = document.getElementById('cards-accordion');
        accordion.innerHTML = '';
        
        this.project.cards.forEach((card, index) => {
            const cardElement = document.createElement('div');
            cardElement.className = 'card-accordion-item';
            cardElement.innerHTML = `
                <div class="card-accordion-header" onclick="cardCreator.toggleCardAccordion(${index})">
                    <span>Karte ${card.id}</span>
                    <span>▼</span>
                </div>
                <div class="card-accordion-content" id="card-content-${index}">
                    <div style="margin-bottom: 1rem;">
                        <strong>Vorderseite</strong>
                        <div id="card-${index}-front-fields"></div>
                    </div>
                    <div>
                        <strong>Rückseite</strong>
                        <div id="card-${index}-back-fields"></div>
                    </div>
                </div>
            `;
            accordion.appendChild(cardElement);
            
            // Render field inputs for this card
            this.renderCardFields(index);
        });
    }

    renderCardFields(cardIndex) {
        ['front', 'back'].forEach(side => {
            const container = document.getElementById(`card-${cardIndex}-${side}-fields`);
            const masterSide = this.project.masterCard[side];
            
            // Text fields
            masterSide.textFields.forEach((field, fieldIndex) => {
                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'field-input';
                input.placeholder = field.placeholder;
                input.addEventListener('change', (e) => {
                    this.updateCardField(cardIndex, side, 'text', fieldIndex, e.target.value);
                });
                
                const label = document.createElement('label');
                label.className = 'field-label';
                label.textContent = `${field.placeholder}:`;
                
                container.appendChild(label);
                container.appendChild(input);
            });
            
            // Image fields
            masterSide.imageFields.forEach((field, fieldIndex) => {
                const input = document.createElement('input');
                input.type = 'file';
                input.className = 'field-input';
                input.accept = 'image/*';
                input.addEventListener('change', (e) => {
                    this.updateCardField(cardIndex, side, 'image', fieldIndex, e.target.files[0]);
                });
                
                const label = document.createElement('label');
                label.className = 'field-label';
                label.textContent = `${field.placeholder}:`;
                
                container.appendChild(label);
                container.appendChild(input);
            });
        });
    }

    toggleCardAccordion(cardIndex) {
        const content = document.getElementById(`card-content-${cardIndex}`);
        content.classList.toggle('active');
    }

    updateCardField(cardIndex, side, type, fieldIndex, value) {
        if (type === 'text') {
            this.project.cards[cardIndex][side].textFields[fieldIndex] = value;
        } else {
            this.project.cards[cardIndex][side].imageFields[fieldIndex] = value;
        }
    }

    generatePreview() {
        this.showStep('preview-download');
        // In a real implementation, this would generate a PDF preview
        document.getElementById('pdf-preview').src = 'data:text/html,<h2>PDF Vorschau wird hier angezeigt</h2><p>Implementierung folgt...</p>';
    }

    async downloadPDF() {
        const loadingOverlay = document.getElementById('loading-overlay');
        loadingOverlay.classList.remove('hidden');
        
        try {
            // Simulate PDF generation
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // This is where you'd use jsPDF to generate the actual PDF
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: this.project.paperSize
            });
            
            pdf.text('Card Creator - Generated Cards', 20, 20);
            pdf.text(`Layout: ${this.project.layout}`, 20, 30);
            pdf.text(`Paper Size: ${this.project.paperSize.toUpperCase()}`, 20, 40);
            pdf.text(`Number of Cards: ${this.project.cardCount}`, 20, 50);
            
            pdf.save('cards.pdf');
            
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Fehler beim Generieren der PDF. Bitte versuchen Sie es erneut.');
        } finally {
            loadingOverlay.classList.add('hidden');
        }
    }

    newProject() {
        if (confirm('Möchten Sie wirklich ein neues Projekt starten? Alle aktuellen Änderungen gehen verloren.')) {
            location.reload();
        }
    }
}

// Initialize the application when the page loads
let cardCreator;
document.addEventListener('DOMContentLoaded', () => {
    cardCreator = new CardCreator();
});

// Service Worker registration for PWA functionality
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
