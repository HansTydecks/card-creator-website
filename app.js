// Card Creator - Main Application
console.log('App.js script loaded');

class CardCreator {
    constructor() {
        console.log('CardCreator constructor called');
        this.currentStep = 'project-setup';
        this.project = {
            paperSize: 'a4',
            layout: '2x2',
            cardCount: 4,
            template: 'blank',
            customCardSize: { width: 85, height: 55 }, // mm
            borderSettings: {
                width: 2,
                color: '#333333',
                style: 'solid'
            },
            watermarkSettings: {
                text: '',
                opacity: 0.3,
                size: 16,
                position: 'bottom-right'
            },
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
        this.selectedElement = null;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.snapToGrid = true;
        this.gridSize = 10;
        this.undoStack = [];
        this.redoStack = [];
        this.maxUndoSteps = 50;
        
        this.init();
    }

    init() {
        console.log('Init method called, readyState:', document.readyState);
        
        // Initialize tab navigation
        this.initTabNavigation();
        
        // Ensure DOM is ready
        if (document.readyState === 'loading') {
            console.log('DOM still loading, waiting for DOMContentLoaded');
            document.addEventListener('DOMContentLoaded', () => {
                console.log('DOMContentLoaded in init method');
                this.setupEventListeners();
                this.initCanvas();
                this.switchTab('project-setup', 0);
            });
        } else {
            console.log('DOM ready, setting up immediately');
            this.setupEventListeners();
            this.initCanvas();
            this.switchTab('project-setup', 0);
        }
    }

    initTabNavigation() {
        console.log('Initializing tab navigation');
        
        // Wait for DOM to be ready
        const setupTabs = () => {
            const tabBtns = document.querySelectorAll('.tab-btn');
            const tabContents = document.querySelectorAll('.tab-content');
            const tabIndicator = document.querySelector('.tab-indicator');
            
            console.log('Found tab buttons:', tabBtns.length);
            console.log('Found tab contents:', tabContents.length);
            
            // Add click handlers to tab buttons
            tabBtns.forEach((btn, index) => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const targetTab = btn.getAttribute('data-tab');
                    console.log('Tab clicked:', targetTab);
                    this.switchTab(targetTab, index);
                });
            });
            
            // Add keyboard navigation
            this.setupKeyboardNavigation();
        };
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setupTabs);
        } else {
            setupTabs();
        }
    }

    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // Only handle if no input is focused
            if (document.activeElement.tagName === 'INPUT' || 
                document.activeElement.tagName === 'TEXTAREA' || 
                document.activeElement.tagName === 'SELECT') {
                return;
            }

            const stepToTabIndex = {
                'project-setup': 0,
                'master-design': 1,
                'cards-edit': 2,
                'export-options': 3
            };

            const currentIndex = stepToTabIndex[this.currentStep] || 0;
            const tabs = ['project-setup', 'master-design', 'cards-edit', 'export-options'];

            switch(e.key) {
                case 'ArrowLeft':
                case 'ArrowUp':
                    e.preventDefault();
                    if (currentIndex > 0) {
                        this.switchTab(tabs[currentIndex - 1], currentIndex - 1);
                    }
                    break;

                case 'ArrowRight':
                case 'ArrowDown':
                    e.preventDefault();
                    if (currentIndex < tabs.length - 1) {
                        this.switchTab(tabs[currentIndex + 1], currentIndex + 1);
                    }
                    break;

                case '1':
                    e.preventDefault();
                    this.switchTab('project-setup', 0);
                    break;

                case '2':
                    e.preventDefault();
                    this.switchTab('master-design', 1);
                    break;

                case '3':
                    e.preventDefault();
                    this.switchTab('cards-edit', 2);
                    break;

                case '4':
                    e.preventDefault();
                    this.switchTab('export-options', 3);
                    break;
            }
        });
    }

    switchTab(tabId, tabIndex) {
        console.log('=== SWITCHING TAB ===');
        console.log('Target tab:', tabId, 'index:', tabIndex);
        
        // Remove active class from all tabs and contents
        const allTabBtns = document.querySelectorAll('.tab-btn');
        const allTabContents = document.querySelectorAll('.tab-content');
        
        console.log('Found tab buttons:', allTabBtns.length);
        console.log('Found tab contents:', allTabContents.length);
        
        allTabBtns.forEach((btn, i) => {
            btn.classList.remove('active');
            console.log(`Removed active from tab button ${i}:`, btn.getAttribute('data-tab'));
        });
        
        allTabContents.forEach((content, i) => {
            content.classList.remove('active');
            console.log(`Removed active from content ${i}:`, content.id);
        });
        
        // Add active class to current tab and content
        const activeTabBtn = document.querySelector(`[data-tab="${tabId}"]`);
        const activeTabContent = document.getElementById(tabId);
        
        console.log('Active tab button found:', !!activeTabBtn);
        console.log('Active tab content found:', !!activeTabContent);
        
        if (activeTabBtn) {
            activeTabBtn.classList.add('active');
            console.log('Added active to tab button:', tabId);
        } else {
            console.error('Tab button not found:', tabId);
        }
        
        if (activeTabContent) {
            activeTabContent.classList.add('active');
            console.log('Added active to tab content:', tabId);
            console.log('Content classes:', activeTabContent.className);
            console.log('Content computed display:', window.getComputedStyle(activeTabContent).display);
        } else {
            console.error('Tab content not found:', tabId);
        }
        
        // Move indicator
        const indicator = document.querySelector('.tab-indicator');
        if (indicator) {
            indicator.className = `tab-indicator tab-${tabIndex + 1}`;
            console.log('Moved indicator to position:', tabIndex + 1);
        }
        
        // Update current step for backward compatibility
        this.currentStep = tabId;
        
        // Handle tab-specific initialization
        this.handleTabSwitch(tabId);
        
        console.log('=== TAB SWITCH COMPLETE ===');
    }

    handleTabSwitch(tabId) {
        console.log('Handling tab switch to:', tabId);
        
        switch(tabId) {
            case 'project-setup':
                // Initialize project setup if needed
                this.loadProjectSettings();
                break;
                
            case 'master-design':
                // Initialize canvas and design tools
                setTimeout(() => {
                    this.initCanvas();
                    this.initializeCanvas();
                }, 100);
                break;
                
            case 'cards-edit':
                // Initialize cards editing
                this.initializeCards();
                break;
                
            case 'export-options':
                // Initialize export options
                this.updateExportPreview();
                break;
        }
    }

    setupEventListeners() {
        console.log('setupEventListeners called');
        
        // Add a visual indicator that the script is working
        document.body.style.border = '3px solid green';
        console.log('Green border added to body as visual indicator');
        
        // BRUTE FORCE BUTTON FIX - Multiple strategies to ensure it works
        setTimeout(() => {
            console.log('=== BRUTE FORCE BUTTON FIX ===');
            
            // Strategy 1: Force CSS overrides to make button clickable
            const btn = document.getElementById('continue-to-cards');
            if (btn) {
                console.log('Button found, applying aggressive fixes');
                
                // Remove any CSS that might block clicking
                btn.style.setProperty('pointer-events', 'auto', 'important');
                btn.style.setProperty('position', 'relative', 'important');
                btn.style.setProperty('z-index', '99999', 'important');
                btn.style.setProperty('display', 'block', 'important');
                btn.style.setProperty('visibility', 'visible', 'important');
                btn.style.setProperty('border', '5px solid red', 'important');
                btn.style.setProperty('background', 'yellow', 'important');
                btn.style.setProperty('color', 'black', 'important');
                btn.style.setProperty('padding', '10px', 'important');
                btn.style.setProperty('cursor', 'pointer', 'important');
                
                // Force parent containers to be visible and clickable
                let parent = btn.parentElement;
                while (parent && parent !== document.body) {
                    parent.style.setProperty('pointer-events', 'auto', 'important');
                    parent.style.setProperty('position', 'relative', 'important');
                    parent.style.setProperty('z-index', '9999', 'important');
                    parent.style.setProperty('display', 'block', 'important');
                    parent.style.setProperty('visibility', 'visible', 'important');
                    parent = parent.parentElement;
                }
                
                // Strategy 2: Multiple event binding methods
                btn.onclick = function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('ONCLICK METHOD TRIGGERED');
                    alert('Onclick method worked!');
                    if (window.cardCreator) {
                        window.cardCreator.initializeCards();
                        window.cardCreator.showStep('cards-edit');
                    }
                    return false;
                };
                
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('ADDEVENTLISTENER METHOD TRIGGERED');
                    alert('AddEventListener method worked!');
                    if (window.cardCreator) {
                        window.cardCreator.initializeCards();
                        window.cardCreator.showStep('cards-edit');
                    }
                }, true); // Use capture phase
                
                btn.addEventListener('mousedown', function(e) {
                    console.log('MOUSEDOWN TRIGGERED');
                    setTimeout(() => {
                        if (window.cardCreator) {
                            window.cardCreator.initializeCards();
                            window.cardCreator.showStep('cards-edit');
                        }
                    }, 100);
                });
                
                // Strategy 3: Force the button to be absolutely positioned and visible
                const masterSection = document.getElementById('master-design');
                if (masterSection) {
                    masterSection.style.setProperty('display', 'block', 'important');
                    masterSection.classList.add('active');
                }
                
                console.log('All button fixes applied');
                
                // Strategy 5: Add keyboard shortcut as backup
                document.addEventListener('keydown', function(e) {
                    if (e.ctrlKey && e.key === 'Enter') {
                        console.log('KEYBOARD SHORTCUT TRIGGERED (Ctrl+Enter)');
                        e.preventDefault();
                        if (window.cardCreator) {
                            window.cardCreator.initializeCards();
                            window.cardCreator.showStep('cards-edit');
                        }
                    }
                });
                
                // Strategy 6: Auto-advance after 5 seconds as ultimate fallback
                setTimeout(() => {
                    const masterSection = document.getElementById('master-design');
                    if (masterSection && masterSection.classList.contains('active')) {
                        console.log('AUTO-ADVANCE: Going to cards page automatically');
                        alert('Auto-advancing to cards page (button workaround)');
                        if (window.cardCreator) {
                            window.cardCreator.initializeCards();
                            window.cardCreator.showStep('cards-edit');
                        }
                    }
                }, 5000);
                
            } else {
                console.error('BUTTON NOT FOUND');
                
                // Strategy 4: Create a floating emergency button as ultimate backup
                const emergencyBtn = document.createElement('button');
                emergencyBtn.innerHTML = '🚨 EMERGENCY: Go to Cards 🚨';
                emergencyBtn.style.cssText = `
                    position: fixed !important;
                    top: 20px !important;
                    right: 20px !important;
                    z-index: 100000 !important;
                    background: red !important;
                    color: white !important;
                    padding: 15px !important;
                    border: none !important;
                    border-radius: 5px !important;
                    cursor: pointer !important;
                    font-size: 14px !important;
                    font-weight: bold !important;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.3) !important;
                `;

                emergencyBtn.onclick = function() {
                    console.log('EMERGENCY BUTTON CLICKED');
                    alert('Emergency button worked!');
                    if (window.cardCreator) {
                        window.cardCreator.initializeCards();
                        window.cardCreator.showStep('cards-edit');
                    }
                };

                document.body.appendChild(emergencyBtn);
                console.log('Emergency button created');
            }
        }, 500);
        // Project Setup - Debug version
        const startButton = document.getElementById('start-design');
        console.log('Start-Design Button gefunden:', startButton);
        
        if (startButton) {
            startButton.addEventListener('click', (e) => {
                console.log('Button geklickt!');
                this.collectProjectSettings();
                this.showStep('master-design');
            });
        } else {
            console.error('Start-Design Button nicht gefunden!');
        }

        // Paper size selection
        document.getElementById('paper-size').addEventListener('change', (e) => {
            this.project.paperSize = e.target.value;
            console.log('Paper size changed to:', e.target.value);
        });

        // Layout selection
        document.getElementById('layout').addEventListener('change', (e) => {
            this.project.layout = e.target.value;
            this.project.cardCount = this.getCardCountFromLayout(e.target.value);
            console.log('Layout changed to:', e.target.value, 'Cards:', this.project.cardCount);
        });

        // Custom card size controls
        document.getElementById('custom-width').addEventListener('input', (e) => {
            this.project.customCardSize.width = parseInt(e.target.value);
            this.updateCardSizeDisplay();
        });

        document.getElementById('custom-height').addEventListener('input', (e) => {
            this.project.customCardSize.height = parseInt(e.target.value);
            this.updateCardSizeDisplay();
        });

        // Border controls
        document.getElementById('border-width').addEventListener('input', (e) => {
            this.project.borderSettings.width = parseFloat(e.target.value);
            document.querySelector('#border-width + .value-display').textContent = e.target.value + 'px';
            this.updateCanvasPreview();
        });

        document.getElementById('border-color').addEventListener('change', (e) => {
            this.project.borderSettings.color = e.target.value;
            this.updateCanvasPreview();
        });

        document.getElementById('border-style').addEventListener('change', (e) => {
            this.project.borderSettings.style = e.target.value;
            this.updateCanvasPreview();
        });

        // Watermark controls
        document.getElementById('watermark-text').addEventListener('input', (e) => {
            this.project.watermarkSettings.text = e.target.value;
            this.updateCanvasPreview();
        });

        document.getElementById('watermark-opacity').addEventListener('input', (e) => {
            this.project.watermarkSettings.opacity = parseFloat(e.target.value);
            document.querySelector('#watermark-opacity + .value-display').textContent = Math.round(e.target.value * 100) + '%';
            this.updateCanvasPreview();
        });

        document.getElementById('watermark-size').addEventListener('change', (e) => {
            this.project.watermarkSettings.size = parseInt(e.target.value);
            this.updateCanvasPreview();
        });

        document.getElementById('watermark-position').addEventListener('change', (e) => {
            this.project.watermarkSettings.position = e.target.value;
            this.updateCanvasPreview();
        });

        // Card count - automatically determined by layout
        // Remove card count control since it's now automatic

        // Template selection - Remove template system
        // Templates are no longer used

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
        
        // Texture selection
        document.querySelectorAll('.texture-option').forEach(option => {
            option.addEventListener('click', (e) => {
                document.querySelectorAll('.texture-option').forEach(o => o.classList.remove('selected'));
                option.classList.add('selected');
                this.project.masterCard[this.currentSide].texture = option.dataset.texture;
                this.updateCanvasPreview();
            });
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

        // Canvas settings
        document.getElementById('snap-to-grid').addEventListener('change', (e) => {
            this.snapToGrid = e.target.checked;
        });

        document.getElementById('grid-size').addEventListener('input', (e) => {
            this.gridSize = parseInt(e.target.value);
            document.getElementById('grid-size-value').textContent = `${e.target.value}px`;
        });

        // Watermark controls
        document.getElementById('watermark-text').addEventListener('input', (e) => {
            this.setWatermarkText(e.target.value);
        });

        document.getElementById('watermark-opacity').addEventListener('input', (e) => {
            this.setWatermarkOpacity(parseFloat(e.target.value));
            document.querySelector('#watermark-opacity + .value-display').textContent = `${Math.round(e.target.value * 100)}%`;
        });

        document.getElementById('watermark-size').addEventListener('input', (e) => {
            this.setWatermarkSize(parseInt(e.target.value));
            document.querySelector('#watermark-size + .value-display').textContent = `${e.target.value}px`;
        });

        document.getElementById('watermark-position').addEventListener('change', (e) => {
            this.setWatermarkPosition(e.target.value);
        });

        // Canvas toolbar
        document.getElementById('duplicate-element').addEventListener('click', () => {
            this.duplicateElement();
        });

        document.getElementById('align-left').addEventListener('click', () => {
            this.alignElement('left');
        });

        document.getElementById('align-center').addEventListener('click', () => {
            this.alignElement('center');
        });

        document.getElementById('align-right').addEventListener('click', () => {
            this.alignElement('right');
        });

        // Undo/Redo
        document.getElementById('undo').addEventListener('click', () => {
            this.undo();
        });

        document.getElementById('redo').addEventListener('click', () => {
            this.redo();
        });

        // Project Management
        document.getElementById('save-project').addEventListener('click', () => {
            this.saveProject();
        });

        document.getElementById('load-project').addEventListener('click', () => {
            this.loadProject();
        });

        document.getElementById('file-input').addEventListener('change', (e) => {
            this.handleFileLoad(e);
        });

        // Export Options
        document.getElementById('export-png').addEventListener('click', () => {
            this.exportAsPNG();
        });

        document.getElementById('export-svg').addEventListener('click', () => {
            this.exportAsSVG();
        });

        document.getElementById('download-word').addEventListener('click', () => {
            this.exportAsWord();
        });

        document.getElementById('download-images').addEventListener('click', () => {
            this.exportAsImages();
        });

        // Preview Functions
        document.getElementById('preview-pdf').addEventListener('click', () => {
            this.previewPDF();
        });

        document.getElementById('download-final-pdf').addEventListener('click', () => {
            this.downloadPDF();
        });

        // Navigation
        document.getElementById('back-to-setup').addEventListener('click', () => {
            this.showStep('project-setup');
        });

        const continueButton = document.getElementById('continue-to-cards');
        console.log('Looking for continue-to-cards button:', continueButton);
        
        if (continueButton) {
            console.log('Continue button found!');
            console.log('Button style display:', window.getComputedStyle(continueButton).display);
            console.log('Button visibility:', window.getComputedStyle(continueButton).visibility);
            console.log('Button parent element:', continueButton.parentElement);
            console.log('Button is visible:', continueButton.offsetParent !== null);
            
            // Check if button is in the active step
            const masterDesignSection = document.getElementById('master-design');
            console.log('Master design section:', masterDesignSection);
            console.log('Master design section has active class:', masterDesignSection?.classList.contains('active'));
            
            // Check which step is currently active
            const activeStep = document.querySelector('.step.active');
            console.log('Currently active step:', activeStep?.id);
            
            // Add both event listener and onclick as backup
            continueButton.addEventListener('click', function(e) {
                console.log('Event listener fired!', e);
                alert('Event listener worked!');
                try {
                    cardCreator.initializeCards();
                    cardCreator.showStep('cards-edit');
                } catch (error) {
                    console.error('Error:', error);
                }
            });
            
            // Also add onclick as backup
            continueButton.onclick = function(e) {
                console.log('Onclick fired!', e);
                alert('Onclick worked!');
                return false;
            };
            
            // Test if we can trigger the click programmatically
            setTimeout(() => {
                console.log('Testing programmatic click in 2 seconds...');
                continueButton.click();
            }, 2000);
            
            console.log('Continue to cards button event listener attached');
        } else {
            console.error('continue-to-cards button not found during setup');
            alert('Continue button not found!');
        }

        const backToDesignButton = document.getElementById('back-to-design');
        if (backToDesignButton) {
            backToDesignButton.addEventListener('click', () => {
                console.log('Back to design button clicked');
                this.showStep('master-design');
            });
            console.log('Back to design button event listener attached');
        } else {
            console.error('back-to-design button not found during setup');
        }

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
        const canvas = document.getElementById('card-preview');
        canvas.addEventListener('click', (e) => {
            this.handleCanvasClick(e);
        });
        
        canvas.addEventListener('mousedown', (e) => {
            this.handleCanvasMouseDown(e);
        });
        
        canvas.addEventListener('mousemove', (e) => {
            this.handleCanvasMouseMove(e);
        });
        
        canvas.addEventListener('mouseup', (e) => {
            this.handleCanvasMouseUp(e);
        });
        
        canvas.addEventListener('mouseleave', (e) => {
            this.handleCanvasMouseUp(e);
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyDown(e);
        });

        // Modal events
        document.getElementById('modal-cancel').addEventListener('click', () => {
            this.hideModal();
        });

        document.getElementById('modal-confirm').addEventListener('click', () => {
            this.handleModalConfirm();
        });

        // Custom Card Size Events
        document.getElementById('card-preset-standard').addEventListener('click', () => {
            this.setCardSize(85, 55);
        });

        document.getElementById('card-preset-large').addEventListener('click', () => {
            this.setCardSize(105, 74);
        });

        document.getElementById('card-preset-jumbo').addEventListener('click', () => {
            this.setCardSize(120, 85);
        });

        document.getElementById('card-preset-mini').addEventListener('click', () => {
            this.setCardSize(60, 40);
        });

        // Border Settings Events
        document.getElementById('border-width').addEventListener('input', (e) => {
            this.setBorderWidth(e.target.value);
        });

        document.getElementById('border-style').addEventListener('change', (e) => {
            this.setBorderStyle(e.target.value);
        });

        document.getElementById('border-color').addEventListener('change', (e) => {
            this.setBorderColor(e.target.value);
        });

        // Border color presets
        document.querySelectorAll('.border-color-preset').forEach(preset => {
            preset.addEventListener('click', (e) => {
                this.setBorderColor(e.target.dataset.color);
            });
        });

        // Watermark Settings Events
        document.getElementById('watermark-text').addEventListener('input', (e) => {
            this.setWatermarkText(e.target.value);
        });

        document.getElementById('watermark-opacity').addEventListener('input', (e) => {
            this.setWatermarkOpacity(e.target.value);
        });

        document.getElementById('watermark-size').addEventListener('change', (e) => {
            this.setWatermarkSize(e.target.value);
        });

        document.getElementById('watermark-position').addEventListener('change', (e) => {
            this.setWatermarkPosition(e.target.value);
        });
    }

    collectProjectSettings() {
        // Get values from form elements
        this.project.paperSize = document.getElementById('paper-size').value;
        this.project.layout = document.getElementById('layout').value;
        
        // Automatically determine card count based on layout
        this.project.cardCount = this.getCardCountFromLayout(this.project.layout);
        
        console.log('Project settings collected:', this.project);

        // Apply template (simplified - no more template selection)
        this.applyTemplate();
    }

    getCardCountFromLayout(layout) {
        const layoutMap = {
            '2x2': 4,
            '2x4': 8, 
            '3x3': 9,
            'custom': 4 // Default for custom
        };
        return layoutMap[layout] || 4;
    }

    applyTemplate() {
        const templates = {
            blank: {
                front: { textFields: [], imageFields: [] },
                back: { textFields: [], imageFields: [] }
            },
            flashcard: {
                front: {
                    textFields: [
                        { x: 20, y: 20, width: 160, height: 100, fontSize: 18, fontFamily: 'Arial', fontWeight: 'bold', textAlign: 'center', color: '#000000', placeholder: 'Frage' }
                    ],
                    imageFields: []
                },
                back: {
                    textFields: [
                        { x: 20, y: 20, width: 160, height: 100, fontSize: 16, fontFamily: 'Arial', fontWeight: 'normal', textAlign: 'center', color: '#000000', placeholder: 'Antwort' }
                    ],
                    imageFields: []
                }
            },
            quiz: {
                front: {
                    textFields: [
                        { x: 20, y: 20, width: 160, height: 30, fontSize: 14, fontFamily: 'Arial', fontWeight: 'bold', textAlign: 'left', color: '#000000', placeholder: 'Frage' },
                        { x: 20, y: 60, width: 160, height: 20, fontSize: 12, fontFamily: 'Arial', fontWeight: 'normal', textAlign: 'left', color: '#000000', placeholder: 'A)' },
                        { x: 20, y: 85, width: 160, height: 20, fontSize: 12, fontFamily: 'Arial', fontWeight: 'normal', textAlign: 'left', color: '#000000', placeholder: 'B)' },
                        { x: 20, y: 110, width: 160, height: 20, fontSize: 12, fontFamily: 'Arial', fontWeight: 'normal', textAlign: 'left', color: '#000000', placeholder: 'C)' }
                    ],
                    imageFields: []
                },
                back: {
                    textFields: [
                        { x: 20, y: 50, width: 160, height: 30, fontSize: 16, fontFamily: 'Arial', fontWeight: 'bold', textAlign: 'center', color: '#28a745', placeholder: 'Richtige Antwort' }
                    ],
                    imageFields: []
                }
            },
            vocabulary: {
                front: {
                    textFields: [
                        { x: 20, y: 30, width: 160, height: 40, fontSize: 20, fontFamily: 'Arial', fontWeight: 'bold', textAlign: 'center', color: '#000000', placeholder: 'Deutsch' }
                    ],
                    imageFields: [
                        { x: 60, y: 80, width: 80, height: 60, alignment: 'center', placeholder: 'Bild', imageData: null, maintainAspectRatio: true }
                    ]
                },
                back: {
                    textFields: [
                        { x: 20, y: 50, width: 160, height: 40, fontSize: 18, fontFamily: 'Arial', fontWeight: 'normal', textAlign: 'center', color: '#0c5460', placeholder: 'English' }
                    ],
                    imageFields: []
                }
            },
            math: {
                front: {
                    textFields: [
                        { x: 20, y: 30, width: 160, height: 40, fontSize: 24, fontFamily: 'Arial', fontWeight: 'bold', textAlign: 'center', color: '#004085', placeholder: '2 + 2 = ?' }
                    ],
                    imageFields: []
                },
                back: {
                    textFields: [
                        { x: 20, y: 50, width: 160, height: 40, fontSize: 32, fontFamily: 'Arial', fontWeight: 'bold', textAlign: 'center', color: '#28a745', placeholder: '4' }
                    ],
                    imageFields: []
                }
            },
            timeline: {
                front: {
                    textFields: [
                        { x: 20, y: 20, width: 160, height: 25, fontSize: 14, fontFamily: 'Arial', fontWeight: 'bold', textAlign: 'center', color: '#000000', placeholder: 'Ereignis' },
                        { x: 20, y: 50, width: 160, height: 20, fontSize: 16, fontFamily: 'Arial', fontWeight: 'normal', textAlign: 'center', color: '#6c757d', placeholder: 'Datum' }
                    ],
                    imageFields: [
                        { x: 60, y: 80, width: 80, height: 60, alignment: 'center', placeholder: 'Bild', imageData: null, maintainAspectRatio: true }
                    ]
                },
                back: {
                    textFields: [
                        { x: 20, y: 30, width: 160, height: 80, fontSize: 12, fontFamily: 'Arial', fontWeight: 'normal', textAlign: 'left', color: '#000000', placeholder: 'Beschreibung des historischen Ereignisses...' }
                    ],
                    imageFields: []
                }
            }
        };

        const template = templates[this.project.template];
        if (template) {
            this.project.masterCard.front.textFields = [...template.front.textFields];
            this.project.masterCard.front.imageFields = [...template.front.imageFields];
            this.project.masterCard.back.textFields = [...template.back.textFields];
            this.project.masterCard.back.imageFields = [...template.back.imageFields];
        }
    }

    showStep(stepId) {
        console.log('showStep called with:', stepId);
        
        // Map step IDs to tab indexes for backward compatibility
        const stepToTabIndex = {
            'project-setup': 0,
            'master-design': 1,
            'cards-edit': 2,
            'export-options': 3
        };
        
        const tabIndex = stepToTabIndex[stepId];
        if (tabIndex !== undefined) {
            this.switchTab(stepId, tabIndex);
        } else {
            console.error('Unknown step ID:', stepId);
        }
    }

    // Add global navigation functions for easy access
    goToProjectSetup() {
        this.switchTab('project-setup', 0);
    }

    goToDesign() {
        this.switchTab('master-design', 1);
    }

    goToCards() {
        this.switchTab('cards-edit', 2);
    }

    goToExport() {
        this.switchTab('export-options', 3);
    }

    switchSide(side) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-side="${side}"]`).classList.add('active');
        this.currentSide = side;
        
        // Update UI to reflect current side settings
        this.updateSideControls();
        
        // Only update canvas preview without reinitializing canvas
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
        this.saveState(); // Save state before modification
        
        const sideData = this.project.masterCard[this.currentSide];
        const cardSize = this.getCardSize();
        
        // Create larger, more visible text fields
        const newField = {
            x: 20,
            y: 20 + (sideData.textFields.length * 50),
            width: Math.min(cardSize.width - 40, 200),
            height: 40,
            fontSize: 18,
            fontFamily: 'Arial',
            fontWeight: 'normal',
            fontStyle: 'normal',
            textDecoration: 'none',
            textAlign: 'left',
            color: '#000000',
            backgroundColor: 'rgba(255, 255, 0, 0.2)',
            borderWidth: 2,
            borderColor: '#007bff',
            borderStyle: 'dashed',
            placeholder: `Textfeld ${sideData.textFields.length + 1}`,
            rotation: 0,
            opacity: 1,
            zIndex: sideData.textFields.length
        };
        
        sideData.textFields.push(newField);
        this.updateFieldsLists();
        this.updateCanvasPreview();
        
        // Auto-select the new field
        this.selectedElement = { type: 'text', index: sideData.textFields.length - 1 };
        this.showElementProperties(this.selectedElement);
    }

    addImageField() {
        this.saveState(); // Save state before modification
        
        const sideData = this.project.masterCard[this.currentSide];
        const cardSize = this.getCardSize();
        
        // Create larger, more visible image fields
        const newField = {
            x: 20,
            y: 80 + (sideData.imageFields.length * 100),
            width: Math.min(cardSize.width - 40, 120),
            height: 80,
            alignment: 'center',
            placeholder: `Bildfeld ${sideData.imageFields.length + 1}`,
            imageData: null,
            maintainAspectRatio: true,
            rotation: 0,
            opacity: 1,
            borderWidth: 2,
            borderColor: '#28a745',
            borderStyle: 'dashed',
            borderRadius: 0,
            backgroundColor: 'rgba(0, 255, 0, 0.1)',
            zIndex: sideData.imageFields.length
        };
        
        sideData.imageFields.push(newField);
        this.updateFieldsLists();
        this.updateCanvasPreview();
        
        // Auto-select the new field
        this.selectedElement = { type: 'image', index: sideData.imageFields.length - 1 };
        this.showElementProperties(this.selectedElement);
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
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        
        // Set much larger canvas size for better editing experience
        const baseCardSize = this.getCardSize();
        
        // Scale up the canvas for better editing (minimum 600x400, but maintain aspect ratio)
        const minWidth = 600;
        const minHeight = 400;
        const scaleX = minWidth / baseCardSize.width;
        const scaleY = minHeight / baseCardSize.height;
        const scale = Math.max(scaleX, scaleY, 2); // Minimum 2x scale
        
        // Check if canvas already has the correct dimensions to avoid unnecessary resizing
        const newCanvasWidth = Math.round(baseCardSize.width * scale);
        const newCanvasHeight = Math.round(baseCardSize.height * scale);
        
        if (this.canvas.width === newCanvasWidth && 
            this.canvas.height === newCanvasHeight && 
            this.canvasScale === scale) {
            // Canvas is already properly sized, just return
            return;
        }
        
        this.canvasScale = scale;
        this.canvas.width = newCanvasWidth;
        this.canvas.height = newCanvasHeight;
        
        // Set canvas display size (responsive but large enough for editing)
        const maxDisplayWidth = Math.min(800, window.innerWidth * 0.8);
        const maxDisplayHeight = Math.min(600, window.innerHeight * 0.6);
        
        const displayScaleX = maxDisplayWidth / this.canvas.width;
        const displayScaleY = maxDisplayHeight / this.canvas.height;
        const displayScale = Math.min(displayScaleX, displayScaleY, 1);
        
        this.canvas.style.width = Math.round(this.canvas.width * displayScale) + 'px';
        this.canvas.style.height = Math.round(this.canvas.height * displayScale) + 'px';
        
        // Store the display scale for coordinate calculations
        this.displayScale = displayScale;
        
        // Add canvas event listeners if not already added
        if (!this.canvas.hasAttribute('data-events-added')) {
            this.addCanvasEventListeners();
            this.canvas.setAttribute('data-events-added', 'true');
        }
        
        // Initial render
        this.updateCanvasPreview();
        
        // Update canvas info
        document.getElementById('canvas-info-text').textContent = 
            `Canvas: ${this.canvas.width}×${this.canvas.height}px (Skalierung: ${scale.toFixed(1)}x)`;
    }

    addCanvasEventListeners() {
        const canvas = this.canvas;
        
        canvas.addEventListener('mousedown', (e) => {
            this.handleCanvasMouseDown(e);
        });

        canvas.addEventListener('mousemove', (e) => {
            this.handleCanvasMouseMove(e);
        });

        canvas.addEventListener('mouseup', (e) => {
            this.handleCanvasMouseUp(e);
        });

        canvas.addEventListener('mouseleave', (e) => {
            this.handleCanvasMouseUp(e);
        });
    }

    getCardSize() {
        // Convert mm to pixels (roughly 3.78 pixels per mm at 96 DPI)
        const mmToPixels = 3.78;
        
        if (this.project.layout === 'custom') {
            return {
                width: Math.round(this.project.customCardSize.width * mmToPixels),
                height: Math.round(this.project.customCardSize.height * mmToPixels)
            };
        }
        
        // Standard card sizes based on layout and paper size
        const standardSizes = {
            'a4': { 
                '2x2': {width: 200, height: 280}, 
                '2x4': {width: 150, height: 210}, 
                '3x3': {width: 120, height: 170} 
            },
            'a3': { 
                '2x2': {width: 280, height: 400}, 
                '2x4': {width: 210, height: 300}, 
                '3x3': {width: 170, height: 240} 
            }
        };
        
        return standardSizes[this.project.paperSize]?.[this.project.layout] || {width: 200, height: 280};
    }

    updateCanvasPreview() {
        if (!this.ctx) return;
        
        const sideData = this.project.masterCard[this.currentSide];
        
        // Reset transform matrix to identity before clearing
        this.ctx.resetTransform();
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Save context and apply scaling
        this.ctx.save();
        this.ctx.scale(this.canvasScale, this.canvasScale);
        
        // Get original card size for drawing
        const originalCardSize = this.getCardSize();
        
        // Draw background
        this.ctx.fillStyle = sideData.backgroundColor;
        this.ctx.fillRect(0, 0, originalCardSize.width, originalCardSize.height);
        
        // Draw custom border
        this.drawCustomBorderScaled(originalCardSize);
        
        // Draw texture
        this.drawTextureScaled(sideData.texture, originalCardSize);
        
        // Draw watermark first (under content)
        if (this.project.watermarkSettings.text) {
            this.drawWatermarkScaled(originalCardSize);
        }
        
        // Sort elements by zIndex for proper layering
        const allElements = [
            ...sideData.textFields.map((field, index) => ({ ...field, type: 'text', index })),
            ...sideData.imageFields.map((field, index) => ({ ...field, type: 'image', index }))
        ].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
        
        // Draw all elements in proper order
        allElements.forEach(element => {
            if (element.type === 'text') {
                this.drawTextField(element);
            } else {
                this.drawImageField(element);
            }
        });
        
        // Draw selection highlight
        if (this.selectedElement) {
            this.drawSelectionHighlight();
        }
        
        // Draw cut marks
        if (sideData.showCutMarks) {
            this.drawCutMarks();
        }
        
        // Restore context
        this.ctx.restore();
    }

    drawCustomBorderScaled(cardSize) {
        const border = this.project.borderSettings;
        if (border.width <= 0) return;
        
        this.ctx.save();
        this.ctx.strokeStyle = border.color;
        this.ctx.lineWidth = border.width;
        
        // Set line style
        switch (border.style) {
            case 'dashed':
                this.ctx.setLineDash([10, 5]);
                break;
            case 'dotted':
                this.ctx.setLineDash([2, 3]);
                break;
            case 'double':
                // Draw outer border
                this.ctx.strokeRect(border.width/2, border.width/2, 
                    cardSize.width - border.width, cardSize.height - border.width);
                // Draw inner border
                this.ctx.strokeRect(border.width * 1.5, border.width * 1.5, 
                    cardSize.width - border.width * 3, cardSize.height - border.width * 3);
                this.ctx.restore();
                return;
            default:
                this.ctx.setLineDash([]);
        }
        
        this.ctx.strokeRect(border.width/2, border.width/2, 
            cardSize.width - border.width, cardSize.height - border.width);
        this.ctx.restore();
    }

    drawWatermarkScaled(cardSize) {
        const watermark = this.project.watermarkSettings;
        if (!watermark.text) return;
        
        this.ctx.save();
        this.ctx.globalAlpha = watermark.opacity;
        this.ctx.fillStyle = '#cccccc';
        this.ctx.font = `${watermark.size}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        let x, y;
        switch (watermark.position) {
            case 'center':
                x = cardSize.width / 2;
                y = cardSize.height / 2;
                break;
            case 'top-left':
                this.ctx.textAlign = 'left';
                this.ctx.textBaseline = 'top';
                x = 10;
                y = 10;
                break;
            case 'top-right':
                this.ctx.textAlign = 'right';
                this.ctx.textBaseline = 'top';
                x = cardSize.width - 10;
                y = 10;
                break;
            case 'bottom-left':
                this.ctx.textAlign = 'left';
                this.ctx.textBaseline = 'bottom';
                x = 10;
                y = cardSize.height - 10;
                break;
            case 'bottom-right':
            default:
                this.ctx.textAlign = 'right';
                this.ctx.textBaseline = 'bottom';
                x = cardSize.width - 10;
                y = cardSize.height - 10;
                break;
        }
        
        this.ctx.fillText(watermark.text, x, y);
        this.ctx.restore();
    }

    drawTextureScaled(texture, cardSize) {
        if (texture === 'none') return;
        
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.lineWidth = 1;
        
        switch (texture) {
            case 'lines':
                for (let lineY = 0; lineY < cardSize.height; lineY += 20) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(0, lineY);
                    this.ctx.lineTo(cardSize.width, lineY);
                    this.ctx.stroke();
                }
                break;
            case 'dots':
                for (let dotX = 10; dotX < cardSize.width; dotX += 20) {
                    for (let dotY = 10; dotY < cardSize.height; dotY += 20) {
                        this.ctx.beginPath();
                        this.ctx.arc(dotX, dotY, 1, 0, 2 * Math.PI);
                        this.ctx.fill();
                    }
                }
                break;
            case 'grid':
                for (let gridX = 0; gridX < cardSize.width; gridX += 20) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(gridX, 0);
                    this.ctx.lineTo(gridX, cardSize.height);
                    this.ctx.stroke();
                }
                for (let gridY = 0; gridY < cardSize.height; gridY += 20) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(0, gridY);
                    this.ctx.lineTo(cardSize.width, gridY);
                    this.ctx.stroke();
                }
                break;
            case 'diagonal':
                for (let line = -cardSize.height; line < cardSize.width + cardSize.height; line += 25) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(line, 0);
                    this.ctx.lineTo(line - cardSize.height, cardSize.height);
                    this.ctx.stroke();
                }
                break;
            case 'hexagon':
                const hexRadius = 15;
                const hexHeight = hexRadius * Math.sqrt(3);
                for (let row = 0; row < cardSize.height / hexHeight + 2; row++) {
                    for (let col = 0; col < cardSize.width / (hexRadius * 1.5) + 2; col++) {
                        const x = col * hexRadius * 1.5;
                        const y = row * hexHeight + (col % 2) * hexHeight / 2;
                        this.drawHexagon(x, y, hexRadius * 0.8);
                    }
                }
                break;
            case 'circles':
                for (let circleX = 25; circleX < cardSize.width; circleX += 50) {
                    for (let circleY = 25; circleY < cardSize.height; circleY += 50) {
                        this.ctx.beginPath();
                        this.ctx.arc(circleX, circleY, 8, 0, 2 * Math.PI);
                        this.ctx.stroke();
                    }
                }
                break;
            case 'waves':
                for (let waveY = 0; waveY < cardSize.height; waveY += 30) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(0, waveY);
                    for (let x = 0; x <= cardSize.width; x += 10) {
                        const y = waveY + Math.sin(x / 20) * 5;
                        this.ctx.lineTo(x, y);
                    }
                    this.ctx.stroke();
                }
                break;
            case 'crosshatch':
                // Diagonal lines one direction
                for (let line = -cardSize.height; line < cardSize.width + cardSize.height; line += 15) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(line, 0);
                    this.ctx.lineTo(line - cardSize.height, cardSize.height);
                    this.ctx.stroke();
                }
                // Diagonal lines other direction
                for (let line = 0; line < cardSize.width + cardSize.height; line += 15) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(line, 0);
                    this.ctx.lineTo(line + cardSize.height, cardSize.height);
                    this.ctx.stroke();
                }
                break;
            case 'paper':
                // Subtle paper texture with random dots
                for (let i = 0; i < 200; i++) {
                    const x = Math.random() * cardSize.width;
                    const y = Math.random() * cardSize.height;
                    this.ctx.globalAlpha = Math.random() * 0.1;
                    this.ctx.beginPath();
                    this.ctx.arc(x, y, 0.5, 0, 2 * Math.PI);
                    this.ctx.fill();
                }
                break;
        }
        
        this.ctx.restore();
    }

    drawHexagon(x, y, radius) {
        this.ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i * 60) * Math.PI / 180;
            const hexX = x + radius * Math.cos(angle);
            const hexY = y + radius * Math.sin(angle);
            if (i === 0) {
                this.ctx.moveTo(hexX, hexY);
            } else {
                this.ctx.lineTo(hexX, hexY);
            }
        }
        this.ctx.closePath();
        this.ctx.stroke();
    }

    drawCustomBorder() {
        const border = this.project.borderSettings;
        if (border.width <= 0) return;
        
        this.ctx.save();
        this.ctx.strokeStyle = border.color;
        this.ctx.lineWidth = border.width;
        
        // Set line style
        switch (border.style) {
            case 'dashed':
                this.ctx.setLineDash([10, 5]);
                break;
            case 'dotted':
                this.ctx.setLineDash([2, 3]);
                break;
            case 'double':
                // Draw outer border
                this.ctx.strokeRect(border.width/2, border.width/2, 
                    this.canvas.width - border.width, this.canvas.height - border.width);
                // Draw inner border
                this.ctx.strokeRect(border.width * 1.5, border.width * 1.5, 
                    this.canvas.width - border.width * 3, this.canvas.height - border.width * 3);
                this.ctx.restore();
                return;
            default:
                this.ctx.setLineDash([]);
        }
        
        this.ctx.strokeRect(border.width/2, border.width/2, 
            this.canvas.width - border.width, this.canvas.height - border.width);
        this.ctx.restore();
    }

    drawWatermark() {
        const watermark = this.project.watermarkSettings;
        if (!watermark.text) return;
        
        this.ctx.save();
        this.ctx.globalAlpha = watermark.opacity;
        this.ctx.fillStyle = '#cccccc';
        this.ctx.font = `${watermark.size}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        let x, y;
        switch (watermark.position) {
            case 'center':
                x = this.canvas.width / 2;
                y = this.canvas.height / 2;
                break;
            case 'top-left':
                this.ctx.textAlign = 'left';
                this.ctx.textBaseline = 'top';
                x = 10;
                y = 10;
                break;
            case 'top-right':
                this.ctx.textAlign = 'right';
                this.ctx.textBaseline = 'top';
                x = this.canvas.width - 10;
                y = 10;
                break;
            case 'bottom-left':
                this.ctx.textAlign = 'left';
                this.ctx.textBaseline = 'bottom';
                x = 10;
                y = this.canvas.height - 10;
                break;
            case 'bottom-right':
            default:
                this.ctx.textAlign = 'right';
                this.ctx.textBaseline = 'bottom';
                x = this.canvas.width - 10;
                y = this.canvas.height - 10;
                break;
        }
        
        this.ctx.fillText(watermark.text, x, y);
        this.ctx.restore();
    }

    drawSelectionHighlight() {
        if (!this.selectedElement) return;
        
        const element = this.getElementData(this.selectedElement);
        this.ctx.save();
        this.ctx.strokeStyle = '#007bff';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.strokeRect(element.x - 2, element.y - 2, element.width + 4, element.height + 4);
        
        // Draw resize handles
        const handleSize = 8;
        this.ctx.fillStyle = '#007bff';
        this.ctx.setLineDash([]);
        
        // Corner handles
        this.ctx.fillRect(element.x - handleSize/2, element.y - handleSize/2, handleSize, handleSize);
        this.ctx.fillRect(element.x + element.width - handleSize/2, element.y - handleSize/2, handleSize, handleSize);
        this.ctx.fillRect(element.x - handleSize/2, element.y + element.height - handleSize/2, handleSize, handleSize);
        this.ctx.fillRect(element.x + element.width - handleSize/2, element.y + element.height - handleSize/2, handleSize, handleSize);
        
        this.ctx.restore();
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
        this.ctx.save();
        
        // Apply transformations
        if (field.rotation) {
            this.ctx.translate(field.x + field.width / 2, field.y + field.height / 2);
            this.ctx.rotate((field.rotation * Math.PI) / 180);
            this.ctx.translate(-field.width / 2, -field.height / 2);
        } else {
            this.ctx.translate(field.x, field.y);
        }
        
        this.ctx.globalAlpha = field.opacity || 1;
        
        // Draw background if not transparent
        if (field.backgroundColor && field.backgroundColor !== 'transparent') {
            this.ctx.fillStyle = field.backgroundColor;
            this.ctx.fillRect(0, 0, field.width, field.height);
        }
        
        // Draw border if specified
        if (field.borderWidth && field.borderWidth > 0) {
            this.ctx.strokeStyle = field.borderColor || '#000000';
            this.ctx.lineWidth = field.borderWidth;
            this.ctx.strokeRect(0, 0, field.width, field.height);
        }
        
        // Set text style
        this.ctx.fillStyle = field.color;
        let fontStyle = '';
        if (field.fontStyle === 'italic') fontStyle += 'italic ';
        if (field.fontWeight === 'bold') fontStyle += 'bold ';
        this.ctx.font = `${fontStyle}${field.fontSize}px ${field.fontFamily}`;
        this.ctx.textAlign = field.textAlign;
        
        const x = field.textAlign === 'center' ? field.width / 2 : 
                  field.textAlign === 'right' ? field.width : 0;
        
        this.ctx.fillText(field.placeholder, x, field.fontSize);
        
        // Draw underline if specified
        if (field.textDecoration === 'underline') {
            const textWidth = this.ctx.measureText(field.placeholder).width;
            this.ctx.strokeStyle = field.color;
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(x - (field.textAlign === 'center' ? textWidth/2 : 0), field.fontSize + 2);
            this.ctx.lineTo(x + (field.textAlign === 'center' ? textWidth/2 : field.textAlign === 'right' ? 0 : textWidth), field.fontSize + 2);
            this.ctx.stroke();
        }
        
        this.ctx.restore();
        
        // Draw selection border and handles
        const isSelected = this.selectedElement && 
                          this.selectedElement.type === 'text' && 
                          this.selectedElement.index === this.getCurrentFieldIndex(field, 'text');
        
        if (isSelected) {
            this.ctx.strokeStyle = '#667eea';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(field.x, field.y, field.width, field.height);
            this.drawSelectionHandles(field);
        } else {
            this.ctx.strokeStyle = 'rgba(102, 126, 234, 0.3)';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(field.x, field.y, field.width, field.height);
        }
    }

    drawImageField(field) {
        this.ctx.save();
        
        // Apply transformations
        if (field.rotation) {
            this.ctx.translate(field.x + field.width / 2, field.y + field.height / 2);
            this.ctx.rotate((field.rotation * Math.PI) / 180);
            this.ctx.translate(-field.width / 2, -field.height / 2);
        } else {
            this.ctx.translate(field.x, field.y);
        }
        
        this.ctx.globalAlpha = field.opacity || 1;
        
        // Draw background if specified
        if (field.backgroundColor && field.backgroundColor !== 'transparent') {
            this.ctx.fillStyle = field.backgroundColor;
            if (field.borderRadius && field.borderRadius > 0) {
                this.ctx.beginPath();
                this.ctx.roundRect(0, 0, field.width, field.height, field.borderRadius);
                this.ctx.fill();
            } else {
                this.ctx.fillRect(0, 0, field.width, field.height);
            }
        }
        
        // Draw image or placeholder
        if (field.imageData && field.imageData.dataUrl) {
            const img = new Image();
            img.onload = () => {
                // Apply border radius if specified
                if (field.borderRadius && field.borderRadius > 0) {
                    this.ctx.beginPath();
                    this.ctx.roundRect(0, 0, field.width, field.height, field.borderRadius);
                    this.ctx.clip();
                }
                
                this.ctx.drawImage(img, 0, 0, field.width, field.height);
            };
            img.src = field.imageData.dataUrl;
        } else {
            // Draw placeholder rectangle
            const backgroundColor = field.backgroundColor || '#f8f9fa';
            this.ctx.fillStyle = backgroundColor;
            
            if (field.borderRadius && field.borderRadius > 0) {
                this.ctx.beginPath();
                this.ctx.roundRect(0, 0, field.width, field.height, field.borderRadius);
                this.ctx.fill();
            } else {
                this.ctx.fillRect(0, 0, field.width, field.height);
            }
            
            // Draw placeholder text
            this.ctx.fillStyle = '#6c757d';
            this.ctx.font = '14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(field.placeholder, field.width / 2, field.height / 2);
        }
        
        // Draw border if specified
        if (field.borderWidth && field.borderWidth > 0) {
            this.ctx.strokeStyle = field.borderColor || '#000000';
            this.ctx.lineWidth = field.borderWidth;
            
            // Set border style
            if (field.borderStyle === 'dashed') {
                this.ctx.setLineDash([8, 4]);
            } else if (field.borderStyle === 'dotted') {
                this.ctx.setLineDash([2, 2]);
            } else {
                this.ctx.setLineDash([]);
            }
            
            if (field.borderRadius && field.borderRadius > 0) {
                this.ctx.beginPath();
                this.ctx.roundRect(0, 0, field.width, field.height, field.borderRadius);
                this.ctx.stroke();
            } else {
                this.ctx.strokeRect(0, 0, field.width, field.height);
            }
        }
        
        // Draw border if specified
        if (field.borderWidth && field.borderWidth > 0) {
            this.ctx.strokeStyle = field.borderColor || '#000000';
            this.ctx.lineWidth = field.borderWidth;
            
            // Set border style
            if (field.borderStyle === 'dashed') {
                this.ctx.setLineDash([8, 4]);
            } else if (field.borderStyle === 'dotted') {
                this.ctx.setLineDash([2, 2]);
            } else {
                this.ctx.setLineDash([]);
            }
            
            if (field.borderRadius && field.borderRadius > 0) {
                this.ctx.beginPath();
                this.ctx.roundRect(0, 0, field.width, field.height, field.borderRadius);
                this.ctx.stroke();
            } else {
                this.ctx.strokeRect(0, 0, field.width, field.height);
            }
        }
        
        this.ctx.restore();
        
        // Draw selection border and handles
        const isSelected = this.selectedElement && 
                          this.selectedElement.type === 'image' && 
                          this.selectedElement.index === this.getCurrentFieldIndex(field, 'image');
        
        if (isSelected) {
            this.ctx.strokeStyle = '#667eea';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(field.x, field.y, field.width, field.height);
            this.drawSelectionHandles(field);
        } else {
            this.ctx.strokeStyle = 'rgba(102, 126, 234, 0.3)';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(field.x, field.y, field.width, field.height);
        }
    }

    drawSelectionHandles(field) {
        const handleSize = 6;
        this.ctx.fillStyle = '#667eea';
        
        // Corner handles
        const handles = [
            { x: field.x - handleSize/2, y: field.y - handleSize/2 },
            { x: field.x + field.width - handleSize/2, y: field.y - handleSize/2 },
            { x: field.x - handleSize/2, y: field.y + field.height - handleSize/2 },
            { x: field.x + field.width - handleSize/2, y: field.y + field.height - handleSize/2 }
        ];
        
        handles.forEach(handle => {
            this.ctx.fillRect(handle.x, handle.y, handleSize, handleSize);
        });
    }

    getCurrentFieldIndex(field, type) {
        const sideData = this.project.masterCard[this.currentSide];
        const fields = type === 'text' ? sideData.textFields : sideData.imageFields;
        return fields.indexOf(field);
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
        
        // Check if we clicked on an element
        const clickedElement = this.getElementAtPosition(x, y);
        
        if (clickedElement) {
            this.selectElement(clickedElement);
        } else {
            this.selectedElement = null;
            this.updateCanvasPreview();
        }
        
        document.getElementById('canvas-info-text').textContent = 
            clickedElement ? `Element ausgewählt: ${clickedElement.type} ${clickedElement.index + 1}` 
                          : `Geklickt bei: ${Math.round(x)}, ${Math.round(y)}`;
    }

    handleCanvasMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const rawX = e.clientX - rect.left;
        const rawY = e.clientY - rect.top;
        
        // Convert display coordinates to canvas coordinates
        const x = (rawX / this.displayScale) / this.canvasScale;
        const y = (rawY / this.displayScale) / this.canvasScale;
        
        const clickedElement = this.getElementAtPosition(x, y);
        
        if (clickedElement) {
            this.selectedElement = clickedElement;
            this.isDragging = true;
            const element = this.getElementData(clickedElement);
            this.dragOffset = {
                x: x - element.x,
                y: y - element.y
            };
            this.canvas.style.cursor = 'grabbing';
            this.showElementProperties(clickedElement);
        }
    }

    handleCanvasMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const rawX = e.clientX - rect.left;
        const rawY = e.clientY - rect.top;
        
        // Convert display coordinates to canvas coordinates
        const x = (rawX / this.displayScale) / this.canvasScale;
        const y = (rawY / this.displayScale) / this.canvasScale;
        
        if (this.isDragging && this.selectedElement) {
            const element = this.getElementData(this.selectedElement);
            let newX = x - this.dragOffset.x;
            let newY = y - this.dragOffset.y;
            
            // Snap to grid if enabled (grid is in original card coordinates)
            if (this.snapToGrid) {
                newX = Math.round(newX / this.gridSize) * this.gridSize;
                newY = Math.round(newY / this.gridSize) * this.gridSize;
            }
            
            // Get the original card size for bounds checking
            const originalCardSize = this.getCardSize();
            
            // Keep element within original card bounds
            newX = Math.max(0, Math.min(originalCardSize.width - element.width, newX));
            newY = Math.max(0, Math.min(originalCardSize.height - element.height, newY));
            
            element.x = newX;
            element.y = newY;
            
            this.updateCanvasPreview();
            this.updateFieldsLists();
            
            document.getElementById('canvas-info-text').textContent = 
                `Verschieben: ${Math.round(newX)}, ${Math.round(newY)}`;
        } else {
            // Update cursor based on hover
            const hoveredElement = this.getElementAtPosition(x, y);
            this.canvas.style.cursor = hoveredElement ? 'grab' : 'default';
        }
    }

    handleCanvasMouseUp(e) {
        if (this.isDragging) {
            this.isDragging = false;
            this.canvas.style.cursor = 'default';
            
            if (this.selectedElement) {
                const element = this.getElementData(this.selectedElement);
                document.getElementById('canvas-info-text').textContent = 
                    `Element positioniert: ${Math.round(element.x)}, ${Math.round(element.y)}`;
            }
        }
    }

    handleKeyDown(e) {
        if (!this.selectedElement) return;
        
        const element = this.getElementData(this.selectedElement);
        let moved = false;
        
        switch (e.key) {
            case 'ArrowLeft':
                element.x = Math.max(0, element.x - (e.shiftKey ? 1 : this.gridSize));
                moved = true;
                break;
            case 'ArrowRight':
                element.x = Math.min(this.canvas.width - element.width, element.x + (e.shiftKey ? 1 : this.gridSize));
                moved = true;
                break;
            case 'ArrowUp':
                element.y = Math.max(0, element.y - (e.shiftKey ? 1 : this.gridSize));
                moved = true;
                break;
            case 'ArrowDown':
                element.y = Math.min(this.canvas.height - element.height, element.y + (e.shiftKey ? 1 : this.gridSize));
                moved = true;
                break;
            case 'Delete':
                this.removeField(this.selectedElement.type, this.selectedElement.index);
                this.selectedElement = null;
                moved = true;
                break;
        }
        
        if (moved) {
            e.preventDefault();
            this.updateCanvasPreview();
            this.updateFieldsLists();
        }
    }

    getElementAtPosition(x, y) {
        const sideData = this.project.masterCard[this.currentSide];
        
        // Check text fields (in reverse order to prioritize top elements)
        for (let i = sideData.textFields.length - 1; i >= 0; i--) {
            const field = sideData.textFields[i];
            if (x >= field.x && x <= field.x + field.width &&
                y >= field.y && y <= field.y + field.height) {
                return { type: 'text', index: i };
            }
        }
        
        // Check image fields
        for (let i = sideData.imageFields.length - 1; i >= 0; i--) {
            const field = sideData.imageFields[i];
            if (x >= field.x && x <= field.x + field.width &&
                y >= field.y && y <= field.y + field.height) {
                return { type: 'image', index: i };
            }
        }
        
        return null;
    }

    getElementData(elementRef) {
        const sideData = this.project.masterCard[this.currentSide];
        return elementRef.type === 'text' 
            ? sideData.textFields[elementRef.index]
            : sideData.imageFields[elementRef.index];
    }

    selectElement(elementRef) {
        this.selectedElement = elementRef;
        this.updateCanvasPreview();
        this.showElementProperties(elementRef);
        this.updateToolbarState();
    }

    showElementProperties(elementRef) {
        const element = this.getElementData(elementRef);
        const propertiesContent = document.getElementById('properties-content');
        
        if (elementRef.type === 'text') {
            propertiesContent.innerHTML = this.createTextPropertiesHTML(element, elementRef.index);
        } else {
            propertiesContent.innerHTML = this.createImagePropertiesHTML(element, elementRef.index);
        }
        
        // Bind property change events
        this.bindPropertyEvents(elementRef);
        
        // Update canvas info
        document.getElementById('canvas-info-text').textContent = 
            `Ausgewählt: ${elementRef.type === 'text' ? 'Text' : 'Bild'} ${elementRef.index + 1} (${element.x}, ${element.y})`;
    }

    createTextPropertiesHTML(element, index) {
        return `
            <div class="property-group">
                <h5>Position & Größe</h5>
                <div class="property-row">
                    <label>X:</label>
                    <input type="number" class="property-input" id="prop-x" value="${element.x}" min="0">
                </div>
                <div class="property-row">
                    <label>Y:</label>
                    <input type="number" class="property-input" id="prop-y" value="${element.y}" min="0">
                </div>
                <div class="property-row">
                    <label>Breite:</label>
                    <input type="number" class="property-input" id="prop-width" value="${element.width}" min="10">
                </div>
                <div class="property-row">
                    <label>Höhe:</label>
                    <input type="number" class="property-input" id="prop-height" value="${element.height}" min="10">
                </div>
            </div>

            <div class="property-group">
                <h5>Text</h5>
                <textarea class="property-textarea" id="prop-text" placeholder="Textinhalt">${element.placeholder}</textarea>
            </div>

            <div class="property-group">
                <h5>Schriftart</h5>
                <div class="font-controls">
                    <select class="property-input" id="prop-font-family">
                        <option value="Arial" ${element.fontFamily === 'Arial' ? 'selected' : ''}>Arial</option>
                        <option value="Times New Roman" ${element.fontFamily === 'Times New Roman' ? 'selected' : ''}>Times New Roman</option>
                        <option value="Helvetica" ${element.fontFamily === 'Helvetica' ? 'selected' : ''}>Helvetica</option>
                        <option value="Georgia" ${element.fontFamily === 'Georgia' ? 'selected' : ''}>Georgia</option>
                        <option value="Verdana" ${element.fontFamily === 'Verdana' ? 'selected' : ''}>Verdana</option>
                    </select>
                    <input type="number" class="property-input" id="prop-font-size" value="${element.fontSize}" min="8" max="72">
                </div>
                <div class="font-style-buttons">
                    <button class="font-style-btn ${element.fontWeight === 'bold' ? 'active' : ''}" data-style="bold">B</button>
                    <button class="font-style-btn ${element.fontStyle === 'italic' ? 'active' : ''}" data-style="italic">I</button>
                    <button class="font-style-btn ${element.textDecoration === 'underline' ? 'active' : ''}" data-style="underline">U</button>
                </div>
                <div class="property-row">
                    <label>Ausrichtung:</label>
                    <select class="property-input" id="prop-text-align">
                        <option value="left" ${element.textAlign === 'left' ? 'selected' : ''}>Links</option>
                        <option value="center" ${element.textAlign === 'center' ? 'selected' : ''}>Zentriert</option>
                        <option value="right" ${element.textAlign === 'right' ? 'selected' : ''}>Rechts</option>
                    </select>
                </div>
            </div>

            <div class="property-group">
                <h5>Farben</h5>
                <div class="property-row">
                    <label>Textfarbe:</label>
                    <div class="color-picker-group">
                        <input type="color" id="prop-text-color" value="${element.color}">
                        <input type="text" class="property-input" id="prop-text-color-hex" value="${element.color}" style="width: 80px;">
                    </div>
                </div>
                <div class="property-row">
                    <label>Hintergrund:</label>
                    <div class="color-picker-group">
                        <input type="color" id="prop-bg-color" value="${element.backgroundColor === 'transparent' ? '#ffffff' : element.backgroundColor}">
                        <input type="text" class="property-input" id="prop-bg-color-hex" value="${element.backgroundColor}" style="width: 80px;">
                    </div>
                </div>
            </div>

            <div class="property-group">
                <h5>Effekte</h5>
                <div class="property-row">
                    <label>Drehung:</label>
                    <input type="range" id="prop-rotation" min="0" max="360" value="${element.rotation || 0}">
                    <span>${element.rotation || 0}°</span>
                </div>
                <div class="property-row">
                    <label>Transparenz:</label>
                    <input type="range" id="prop-opacity" min="0" max="100" value="${(element.opacity || 1) * 100}">
                    <span>${Math.round((element.opacity || 1) * 100)}%</span>
                </div>
            </div>

            <div class="property-group">
                <h5>Ebenen</h5>
                <div class="layer-controls">
                    <button class="layer-btn" data-action="front">Nach vorne</button>
                    <button class="layer-btn" data-action="back">Nach hinten</button>
                </div>
            </div>
        `;
    }

    createImagePropertiesHTML(element, index) {
        return `
            <div class="property-group">
                <h5>Position & Größe</h5>
                <div class="property-row">
                    <label>X:</label>
                    <input type="number" class="property-input" id="prop-x" value="${element.x}" min="0">
                </div>
                <div class="property-row">
                    <label>Y:</label>
                    <input type="number" class="property-input" id="prop-y" value="${element.y}" min="0">
                </div>
                <div class="property-row">
                    <label>Breite:</label>
                    <input type="number" class="property-input" id="prop-width" value="${element.width}" min="10">
                </div>
                <div class="property-row">
                    <label>Höhe:</label>
                    <input type="number" class="property-input" id="prop-height" value="${element.height}" min="10">
                </div>
                <div class="property-row">
                    <label>Seitenverhältnis:</label>
                    <input type="checkbox" id="prop-aspect-ratio" ${element.maintainAspectRatio ? 'checked' : ''}>
                </div>
            </div>

            <div class="property-group">
                <h5>Bild</h5>
                <input type="file" id="prop-image-upload" accept="image/*" style="width: 100%; margin-bottom: 0.5rem;">
                <div class="property-row">
                    <label>Ausrichtung:</label>
                    <select class="property-input" id="prop-alignment">
                        <option value="left" ${element.alignment === 'left' ? 'selected' : ''}>Links</option>
                        <option value="center" ${element.alignment === 'center' ? 'selected' : ''}>Zentriert</option>
                        <option value="right" ${element.alignment === 'right' ? 'selected' : ''}>Rechts</option>
                    </select>
                </div>
            </div>

            <div class="property-group">
                <h5>Rahmen</h5>
                <div class="property-row">
                    <label>Rahmenbreite:</label>
                    <input type="number" class="property-input" id="prop-border-width" value="${element.borderWidth || 0}" min="0">
                </div>
                <div class="property-row">
                    <label>Rahmenfarbe:</label>
                    <input type="color" id="prop-border-color" value="${element.borderColor || '#000000'}">
                </div>
                <div class="property-row">
                    <label>Rundung:</label>
                    <input type="number" class="property-input" id="prop-border-radius" value="${element.borderRadius || 0}" min="0">
                </div>
            </div>

            <div class="property-group">
                <h5>Effekte</h5>
                <div class="property-row">
                    <label>Drehung:</label>
                    <input type="range" id="prop-rotation" min="0" max="360" value="${element.rotation || 0}">
                    <span>${element.rotation || 0}°</span>
                </div>
                <div class="property-row">
                    <label>Transparenz:</label>
                    <input type="range" id="prop-opacity" min="0" max="100" value="${(element.opacity || 1) * 100}">
                    <span>${Math.round((element.opacity || 1) * 100)}%</span>
                </div>
            </div>

            <div class="property-group">
                <h5>Ebenen</h5>
                <div class="layer-controls">
                    <button class="layer-btn" data-action="front">Nach vorne</button>
                    <button class="layer-btn" data-action="back">Nach hinten</button>
                </div>
            </div>
        `;
    }

    bindPropertyEvents(elementRef) {
        // Position and size
        ['x', 'y', 'width', 'height'].forEach(prop => {
            const input = document.getElementById(`prop-${prop}`);
            if (input) {
                input.addEventListener('change', () => {
                    this.updateElementProperty(elementRef, prop, parseFloat(input.value));
                });
            }
        });

        // Text-specific properties
        if (elementRef.type === 'text') {
            const textInput = document.getElementById('prop-text');
            if (textInput) {
                textInput.addEventListener('input', () => {
                    this.updateElementProperty(elementRef, 'placeholder', textInput.value);
                });
            }

            const fontFamily = document.getElementById('prop-font-family');
            if (fontFamily) {
                fontFamily.addEventListener('change', () => {
                    this.updateElementProperty(elementRef, 'fontFamily', fontFamily.value);
                });
            }

            const fontSize = document.getElementById('prop-font-size');
            if (fontSize) {
                fontSize.addEventListener('change', () => {
                    this.updateElementProperty(elementRef, 'fontSize', parseFloat(fontSize.value));
                });
            }

            // Font style buttons
            document.querySelectorAll('.font-style-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const style = btn.dataset.style;
                    const element = this.getElementData(elementRef);
                    
                    if (style === 'bold') {
                        element.fontWeight = element.fontWeight === 'bold' ? 'normal' : 'bold';
                    } else if (style === 'italic') {
                        element.fontStyle = element.fontStyle === 'italic' ? 'normal' : 'italic';
                    } else if (style === 'underline') {
                        element.textDecoration = element.textDecoration === 'underline' ? 'none' : 'underline';
                    }
                    
                    btn.classList.toggle('active');
                    this.updateCanvasPreview();
                });
            });

            const textAlign = document.getElementById('prop-text-align');
            if (textAlign) {
                textAlign.addEventListener('change', () => {
                    this.updateElementProperty(elementRef, 'textAlign', textAlign.value);
                });
            }

            const textColor = document.getElementById('prop-text-color');
            if (textColor) {
                textColor.addEventListener('change', () => {
                    this.updateElementProperty(elementRef, 'color', textColor.value);
                });
            }
        }

        // Common properties for both text and image
        const rotation = document.getElementById('prop-rotation');
        if (rotation) {
            rotation.addEventListener('input', () => {
                this.updateElementProperty(elementRef, 'rotation', parseFloat(rotation.value));
                rotation.nextElementSibling.textContent = `${rotation.value}°`;
            });
        }

        const opacity = document.getElementById('prop-opacity');
        if (opacity) {
            opacity.addEventListener('input', () => {
                this.updateElementProperty(elementRef, 'opacity', parseFloat(opacity.value) / 100);
                opacity.nextElementSibling.textContent = `${opacity.value}%`;
            });
        }

        // Layer controls
        document.querySelectorAll('.layer-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.handleLayerAction(elementRef, btn.dataset.action);
            });
        });
    }

    updateElementProperty(elementRef, property, value) {
        this.saveState(); // Save state before modification
        const element = this.getElementData(elementRef);
        element[property] = value;
        this.updateCanvasPreview();
        this.updateFieldsLists();
    }

    handleLayerAction(elementRef, action) {
        this.saveState();
        const sideData = this.project.masterCard[this.currentSide];
        const fields = elementRef.type === 'text' ? sideData.textFields : sideData.imageFields;
        const element = fields[elementRef.index];
        
        if (action === 'front') {
            element.zIndex = Math.max(...fields.map(f => f.zIndex || 0)) + 1;
        } else if (action === 'back') {
            element.zIndex = Math.min(...fields.map(f => f.zIndex || 0)) - 1;
        }
        
        this.updateCanvasPreview();
    }

    updateToolbarState() {
        const hasSelection = this.selectedElement !== null;
        document.getElementById('duplicate-element').disabled = !hasSelection;
        document.getElementById('align-left').disabled = !hasSelection;
        document.getElementById('align-center').disabled = !hasSelection;
        document.getElementById('align-right').disabled = !hasSelection;
    }

    duplicateElement() {
        if (!this.selectedElement) return;
        
        const element = this.getElementData(this.selectedElement);
        const sideData = this.project.masterCard[this.currentSide];
        
        const newElement = JSON.parse(JSON.stringify(element));
        newElement.x += 20;
        newElement.y += 20;
        
        if (this.selectedElement.type === 'text') {
            sideData.textFields.push(newElement);
        } else {
            sideData.imageFields.push(newElement);
        }
        
        this.updateFieldsLists();
        this.updateCanvasPreview();
    }

    alignElement(alignment) {
        if (!this.selectedElement) return;
        
        const element = this.getElementData(this.selectedElement);
        
        switch (alignment) {
            case 'left':
                element.x = 10;
                break;
            case 'center':
                element.x = (this.canvas.width - element.width) / 2;
                break;
            case 'right':
                element.x = this.canvas.width - element.width - 10;
                break;
        }
        
        this.updateCanvasPreview();
        this.updateFieldsLists();
    }

    // Undo/Redo System
    saveState() {
        const state = JSON.parse(JSON.stringify(this.project));
        this.undoStack.push(state);
        
        if (this.undoStack.length > this.maxUndoSteps) {
            this.undoStack.shift();
        }
        
        this.redoStack = []; // Clear redo stack when new action is performed
        this.updateUndoRedoButtons();
    }

    undo() {
        if (this.undoStack.length > 0) {
            const currentState = JSON.parse(JSON.stringify(this.project));
            this.redoStack.push(currentState);
            
            const previousState = this.undoStack.pop();
            this.project = previousState;
            
            this.selectedElement = null;
            this.updateSideControls();
            this.updateCanvasPreview();
            this.updateFieldsLists();
            this.hideElementProperties();
            this.updateUndoRedoButtons();
        }
    }

    redo() {
        if (this.redoStack.length > 0) {
            const currentState = JSON.parse(JSON.stringify(this.project));
            this.undoStack.push(currentState);
            
            const nextState = this.redoStack.pop();
            this.project = nextState;
            
            this.selectedElement = null;
            this.updateSideControls();
            this.updateCanvasPreview();
            this.updateFieldsLists();
            this.hideElementProperties();
            this.updateUndoRedoButtons();
        }
    }

    updateUndoRedoButtons() {
        document.getElementById('undo').disabled = this.undoStack.length === 0;
        document.getElementById('redo').disabled = this.redoStack.length === 0;
    }

    hideElementProperties() {
        document.getElementById('properties-content').innerHTML = 
            '<p class="no-selection">Wählen Sie ein Element aus, um dessen Eigenschaften zu bearbeiten.</p>';
    }

    // Project Management
    saveProject() {
        const projectData = {
            ...this.project,
            metadata: {
                created: new Date().toISOString(),
                version: '3.0',
                appName: 'Card Creator'
            }
        };
        
        const dataStr = JSON.stringify(projectData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `card-project-${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
    }

    loadProject() {
        this.showModal(
            'Projekt laden',
            'Möchten Sie wirklich ein neues Projekt laden? Alle nicht gespeicherten Änderungen gehen verloren.',
            () => {
                document.getElementById('file-input').click();
            }
        );
    }

    handleFileLoad(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const projectData = JSON.parse(e.target.result);
                
                // Validate project data
                if (this.validateProjectData(projectData)) {
                    this.project = projectData;
                    this.selectedElement = null;
                    this.undoStack = [];
                    this.redoStack = [];
                    
                    // Update UI
                    this.updateSideControls();
                    this.updateCanvasPreview();
                    this.updateFieldsLists();
                    this.hideElementProperties();
                    this.updateUndoRedoButtons();
                    
                    alert('Projekt erfolgreich geladen!');
                } else {
                    alert('Ungültiges Projektformat!');
                }
            } catch (error) {
                alert('Fehler beim Laden des Projekts: ' + error.message);
            }
        };
        reader.readAsText(file);
        
        // Clear the input
        event.target.value = '';
    }

    validateProjectData(data) {
        return data && 
               data.masterCard && 
               data.masterCard.front && 
               data.masterCard.back &&
               typeof data.paperSize === 'string' &&
               typeof data.layout === 'string' &&
               typeof data.cardCount === 'number';
    }

    // Modal System
    showModal(title, message, confirmCallback) {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-message').textContent = message;
        document.getElementById('confirmation-modal').classList.remove('hidden');
        this.modalConfirmCallback = confirmCallback;
    }

    hideModal() {
        document.getElementById('confirmation-modal').classList.add('hidden');
        this.modalConfirmCallback = null;
    }

    handleModalConfirm() {
        if (this.modalConfirmCallback) {
            this.modalConfirmCallback();
        }
        this.hideModal();
    }

    // Export Functions
    exportAsPNG() {
        this.showLoadingOverlay('PNG wird generiert...');
        
        setTimeout(async () => {
            try {
                if (this.project.cards.length === 0) {
                    // Export current master card preview
                    const canvas = this.canvas;
                    const link = document.createElement('a');
                    link.download = `masterkarte-${this.currentSide}-${new Date().toISOString().slice(0, 10)}.png`;
                    link.href = canvas.toDataURL('image/png');
                    link.click();
                } else {
                    // Export all cards
                    for (let i = 0; i < this.project.cards.length; i++) {
                        const card = this.project.cards[i];
                        
                        // Export front
                        const frontCanvas = await this.renderCardToCanvas(card, 'front');
                        const frontLink = document.createElement('a');
                        frontLink.download = `karte-${card.id}-vorne.png`;
                        frontLink.href = frontCanvas.toDataURL('image/png');
                        frontLink.click();
                        
                        // Export back
                        const backCanvas = await this.renderCardToCanvas(card, 'back');
                        const backLink = document.createElement('a');
                        backLink.download = `karte-${card.id}-hinten.png`;
                        backLink.href = backCanvas.toDataURL('image/png');
                        backLink.click();
                        
                        // Small delay between downloads
                        await new Promise(resolve => setTimeout(resolve, 300));
                    }
                }
            } catch (error) {
                console.error('PNG-Export Fehler:', error);
                alert('Fehler beim PNG-Export: ' + error.message);
            } finally {
                this.hideLoadingOverlay();
            }
        }, 500);
    }

    exportAsSVG() {
        this.showLoadingOverlay('SVG wird generiert...');
        
        setTimeout(() => {
            try {
                const svgContent = this.generateSVG();
                const blob = new Blob([svgContent], { type: 'image/svg+xml' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `karte-${this.currentSide}-${new Date().toISOString().slice(0, 10)}.svg`;
                link.click();
            } catch (error) {
                alert('Fehler beim SVG-Export: ' + error.message);
            } finally {
                this.hideLoadingOverlay();
            }
        }, 500);
    }

    generateSVG() {
        const sideData = this.project.masterCard[this.currentSide];
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
        
        // Background
        svg += `<rect width="${width}" height="${height}" fill="${sideData.backgroundColor}"/>`;
        
        // Text fields
        sideData.textFields.forEach(field => {
            const transform = field.rotation ? `rotate(${field.rotation} ${field.x + field.width/2} ${field.y + field.height/2})` : '';
            svg += `<text x="${field.x}" y="${field.y + field.fontSize}" 
                    font-family="${field.fontFamily}" 
                    font-size="${field.fontSize}" 
                    font-weight="${field.fontWeight}"
                    font-style="${field.fontStyle}"
                    text-decoration="${field.textDecoration}"
                    text-anchor="${field.textAlign === 'center' ? 'middle' : field.textAlign === 'right' ? 'end' : 'start'}"
                    fill="${field.color}"
                    opacity="${field.opacity || 1}"
                    transform="${transform}">
                    ${field.placeholder}
                    </text>`;
        });
        
        // Image fields (as rectangles for now)
        sideData.imageFields.forEach(field => {
            const transform = field.rotation ? `rotate(${field.rotation} ${field.x + field.width/2} ${field.y + field.height/2})` : '';
            svg += `<rect x="${field.x}" y="${field.y}" 
                    width="${field.width}" height="${field.height}"
                    fill="#f8f9fa" 
                    stroke="rgba(102, 126, 234, 0.5)"
                    stroke-width="2"
                    opacity="${field.opacity || 1}"
                    transform="${transform}"/>`;
            svg += `<text x="${field.x + field.width/2}" y="${field.y + field.height/2}" 
                    text-anchor="middle" font-size="12" fill="#6c757d"
                    transform="${transform}">
                    ${field.placeholder}
                    </text>`;
        });
        
        svg += '</svg>';
        return svg;
    }

    exportAsWord() {
        if (this.project.cards.length === 0) {
            alert('Keine Karten vorhanden. Bitte erstellen Sie zuerst Karten in Schritt 3.');
            return;
        }

        this.showLoadingOverlay('Word-Dokument wird generiert...');
        
        setTimeout(async () => {
            try {
                if (typeof docx === 'undefined') {
                    throw new Error('docx Bibliothek nicht geladen');
                }

                const doc = new docx.Document({
                    sections: [{
                        properties: {},
                        children: await this.generateWordContent()
                    }]
                });

                const blob = await docx.Packer.toBlob(doc);
                const fileName = `karten-${new Date().toISOString().slice(0, 10)}.docx`;
                
                if (typeof saveAs !== 'undefined') {
                    saveAs(blob, fileName);
                } else {
                    // Fallback for manual download
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = fileName;
                    link.click();
                    URL.revokeObjectURL(url);
                }
            } catch (error) {
                console.error('Word-Export Fehler:', error);
                alert('Fehler beim Word-Export: ' + error.message);
            } finally {
                this.hideLoadingOverlay();
            }
        }, 500);
    }

    async generateWordContent() {
        const content = [];
        
        // Title
        content.push(
            new docx.Paragraph({
                children: [
                    new docx.TextRun({
                        text: "Lernkarten Export",
                        bold: true,
                        size: 32
                    })
                ],
                spacing: { after: 400 }
            })
        );

        // Project info
        content.push(
            new docx.Paragraph({
                children: [
                    new docx.TextRun({
                        text: `Projekt: ${this.project.template} Karten`,
                        size: 24
                    })
                ],
                spacing: { after: 200 }
            })
        );

        content.push(
            new docx.Paragraph({
                children: [
                    new docx.TextRun({
                        text: `Generiert am: ${new Date().toLocaleDateString('de-DE')}`,
                        size: 20,
                        italics: true
                    })
                ],
                spacing: { after: 400 }
            })
        );

        // Add cards
        for (let i = 0; i < this.project.cards.length; i++) {
            const card = this.project.cards[i];
            
            // Card header
            content.push(
                new docx.Paragraph({
                    children: [
                        new docx.TextRun({
                            text: `Karte ${card.id}`,
                            bold: true,
                            size: 28
                        })
                    ],
                    spacing: { before: 400, after: 200 }
                })
            );

            // Front side
            content.push(
                new docx.Paragraph({
                    children: [
                        new docx.TextRun({
                            text: "Vorderseite:",
                            bold: true,
                            size: 24
                        })
                    ],
                    spacing: { after: 100 }
                })
            );

            // Add front side content
            const frontContent = this.extractCardContentForWord(card.front);
            content.push(...frontContent);

            // Back side
            content.push(
                new docx.Paragraph({
                    children: [
                        new docx.TextRun({
                            text: "Rückseite:",
                            bold: true,
                            size: 24
                        })
                    ],
                    spacing: { before: 200, after: 100 }
                })
            );

            // Add back side content
            const backContent = this.extractCardContentForWord(card.back);
            content.push(...backContent);

            // Page break after each card (except last)
            if (i < this.project.cards.length - 1) {
                content.push(
                    new docx.Paragraph({
                        children: [new docx.PageBreak()]
                    })
                );
            }
        }

        return content;
    }

    extractCardContentForWord(sideData) {
        const content = [];
        
        // Text fields
        if (sideData.textFields && sideData.textFields.length > 0) {
            sideData.textFields.forEach((text, index) => {
                if (text && text.trim()) {
                    content.push(
                        new docx.Paragraph({
                            children: [
                                new docx.TextRun({
                                    text: `• ${text}`,
                                    size: 22
                                })
                            ],
                            spacing: { after: 100 }
                        })
                    );
                }
            });
        }

        // Image placeholders
        if (sideData.imageFields && sideData.imageFields.length > 0) {
            sideData.imageFields.forEach((imageData, index) => {
                content.push(
                    new docx.Paragraph({
                        children: [
                            new docx.TextRun({
                                text: `[Bild ${index + 1}]`,
                                italics: true,
                                size: 20,
                                color: "666666"
                            })
                        ],
                        spacing: { after: 100 }
                    })
                );
            });
        }

        // If no content, add placeholder
        if (content.length === 0) {
            content.push(
                new docx.Paragraph({
                    children: [
                        new docx.TextRun({
                            text: "(Keine Inhalte)",
                            italics: true,
                            size: 20,
                            color: "999999"
                        })
                    ],
                    spacing: { after: 100 }
                })
            );
        }

        return content;
    }

    exportAsImages() {
        if (this.project.cards.length === 0) {
            alert('Keine Karten vorhanden. Bitte erstellen Sie zuerst Karten in Schritt 3.');
            return;
        }

        this.showLoadingOverlay('Bilder werden generiert...');
        
        setTimeout(async () => {
            try {
                const zip = await this.generateImagesZip();
                const fileName = `karten-bilder-${new Date().toISOString().slice(0, 10)}.zip`;
                
                if (typeof saveAs !== 'undefined') {
                    saveAs(zip, fileName);
                } else {
                    // Fallback for manual download
                    const url = URL.createObjectURL(zip);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = fileName;
                    link.click();
                    URL.revokeObjectURL(url);
                }
            } catch (error) {
                console.error('Bilder-Export Fehler:', error);
                alert('Fehler beim Bilder-Export: ' + error.message);
            } finally {
                this.hideLoadingOverlay();
            }
        }, 500);
    }

    async generateImagesZip() {
        if (typeof JSZip === 'undefined') {
            // Fallback: individual downloads
            return this.generateImagesIndividually();
        }

        const zip = new JSZip();
        const folder = zip.folder("karten-bilder");
        
        for (let i = 0; i < this.project.cards.length; i++) {
            const card = this.project.cards[i];
            
            // Generate front side image
            const frontCanvas = await this.renderCardToCanvas(card, 'front');
            const frontBlob = await this.canvasToBlob(frontCanvas);
            folder.file(`karte-${card.id}-vorne.png`, frontBlob);
            
            // Generate back side image
            const backCanvas = await this.renderCardToCanvas(card, 'back');
            const backBlob = await this.canvasToBlob(backCanvas);
            folder.file(`karte-${card.id}-hinten.png`, backBlob);
        }

        // Add README file
        const readmeContent = `Lernkarten Export
        
Generiert am: ${new Date().toLocaleDateString('de-DE')}
Projekt: ${this.project.template} Karten
Anzahl Karten: ${this.project.cards.length}
Format: ${this.project.paperSize.toUpperCase()} ${this.project.layout}

Dateien:
${this.project.cards.map(card => 
    `- karte-${card.id}-vorne.png\n- karte-${card.id}-hinten.png`
).join('\n')}

Erstellt mit Card Creator`;

        folder.file("README.txt", readmeContent);

        return await zip.generateAsync({ type: "blob" });
    }

    async generateImagesIndividually() {
        // Fallback for when JSZip is not available
        for (let i = 0; i < this.project.cards.length; i++) {
            const card = this.project.cards[i];
            
            // Generate front side image
            const frontCanvas = await this.renderCardToCanvas(card, 'front');
            const frontBlob = await this.canvasToBlob(frontCanvas);
            const frontUrl = URL.createObjectURL(frontBlob);
            const frontLink = document.createElement('a');
            frontLink.href = frontUrl;
            frontLink.download = `karte-${card.id}-vorne.png`;
            frontLink.click();
            URL.revokeObjectURL(frontUrl);
            
            // Generate back side image
            const backCanvas = await this.renderCardToCanvas(card, 'back');
            const backBlob = await this.canvasToBlob(backCanvas);
            const backUrl = URL.createObjectURL(backBlob);
            const backLink = document.createElement('a');
            backLink.href = backUrl;
            backLink.download = `karte-${card.id}-hinten.png`;
            backLink.click();
            URL.revokeObjectURL(backUrl);
            
            // Small delay between downloads
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        // Return a dummy blob for consistency
        return new Blob(['Cards exported as individual images'], { type: 'text/plain' });
    }

    async renderCardToCanvas(card, side) {
        const canvas = document.createElement('canvas');
        const cardSize = this.getCardSize();
        canvas.width = cardSize.width;
        canvas.height = cardSize.height;
        const ctx = canvas.getContext('2d');

        // Render the card
        this.renderSpecificCard(ctx, card, side, 0, 0, cardSize);
        
        return canvas;
    }

    canvasToBlob(canvas) {
        return new Promise((resolve) => {
            canvas.toBlob(resolve, 'image/png');
        });
    }

    showLoadingOverlay(text) {
        document.getElementById('loading-text').textContent = text;
        document.getElementById('loading-overlay').classList.remove('hidden');
    }

    hideLoadingOverlay() {
        document.getElementById('loading-overlay').classList.add('hidden');
    }

    initializeCards() {
        console.log('initializeCards called');
        console.log('Card count:', this.project.cardCount);
        this.project.cards = [];
        for (let i = 0; i < this.project.cardCount; i++) {
            this.project.cards.push({
                id: i + 1,
                front: this.createCardSide(),
                back: this.createCardSide()
            });
        }
        console.log('Cards created:', this.project.cards.length);
        this.renderCardsAccordion();
        console.log('Cards rendered');
    }

    createCardSide() {
        return {
            textFields: {},
            imageFields: {},
            customBackground: null
        };
    }

    renderCardsAccordion() {
        console.log('renderCardsAccordion called');
        const cardsGrid = document.getElementById('cards-grid');
        console.log('cards-grid element:', cardsGrid);
        if (!cardsGrid) {
            console.error('cards-grid element not found');
            return;
        }
        cardsGrid.innerHTML = '';
        
        // Update cards count display
        const cardsCount = document.querySelector('.cards-count');
        if (cardsCount) {
            cardsCount.textContent = `${this.project.cards.length} Karten erstellt`;
            console.log('Updated cards count:', this.project.cards.length);
        } else {
            console.log('cards-count element not found');
        }
        
        this.project.cards.forEach((card, index) => {
            const cardElement = document.createElement('div');
            cardElement.className = 'card-item';
            cardElement.innerHTML = `
                <div class="card-header">
                    <h4>Karte ${card.id}</h4>
                    <div class="card-preview-buttons">
                        <button class="btn btn-sm" onclick="cardCreator.previewCard(${index}, 'front')" title="Vorderseite vorschauen">👁️ Vorne</button>
                        <button class="btn btn-sm" onclick="cardCreator.previewCard(${index}, 'back')" title="Rückseite vorschauen">👁️ Hinten</button>
                        <button class="btn btn-sm btn-outline" onclick="cardCreator.deleteCard(${index})" title="Karte löschen">🗑️</button>
                    </div>
                </div>
                <div class="card-content">
                    <div class="card-side">
                        <strong>Vorderseite</strong>
                        <div id="card-${index}-front-fields" class="card-fields"></div>
                    </div>
                    <div class="card-side">
                        <strong>Rückseite</strong>
                        <div id="card-${index}-back-fields" class="card-fields"></div>
                    </div>
                </div>
            `;
            cardsGrid.appendChild(cardElement);
            
            // Render field inputs for this card
            this.renderCardFields(index);
        });
    }

    deleteCard(cardIndex) {
        if (confirm(`Möchten Sie Karte ${cardIndex + 1} wirklich löschen?`)) {
            this.project.cards.splice(cardIndex, 1);
            // Update card IDs
            this.project.cards.forEach((card, index) => {
                card.id = index + 1;
            });
            this.renderCardsAccordion();
        }
    }

    previewCard(cardIndex, side) {
        const card = this.project.cards[cardIndex];
        const previewCanvas = document.getElementById('cards-preview-canvas');
        const ctx = previewCanvas.getContext('2d');
        
        // Clear canvas
        ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
        
        // Scale canvas to show multiple cards
        const cardSize = this.getCardSize();
        const scale = Math.min(
            previewCanvas.width / (cardSize.width * 2),
            previewCanvas.height / (cardSize.height * 2)
        );
        
        ctx.save();
        ctx.scale(scale, scale);
        
        // Render the specific card
        this.renderSpecificCard(ctx, card, side, 10, 10, cardSize);
        
        ctx.restore();
        
        // Update info
        document.getElementById('canvas-info-text').textContent = 
            `Vorschau: Karte ${card.id} - ${side === 'front' ? 'Vorderseite' : 'Rückseite'}`;
    }

    renderSpecificCard(ctx, card, side, x, y, size) {
        const masterSide = this.project.masterCard[side];
        
        // Draw background
        ctx.fillStyle = masterSide.backgroundColor;
        ctx.fillRect(x, y, size.width, size.height);
        
        // Draw texture
        this.renderTextureToCanvas(ctx, masterSide.texture, x, y, size);
        
        // Sort elements by zIndex
        const allElements = [
            ...masterSide.textFields.map((field, index) => ({ ...field, type: 'text', index })),
            ...masterSide.imageFields.map((field, index) => ({ ...field, type: 'image', index }))
        ].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
        
        // Draw elements
        allElements.forEach(element => {
            ctx.save();
            ctx.translate(x, y);
            
            if (element.type === 'text') {
                const content = card[side].textFields[element.index] || element.placeholder;
                this.renderTextElementToCanvas(ctx, element, content);
            } else {
                const imageData = card[side].imageFields[element.index];
                this.renderImageElementToCanvas(ctx, element, imageData);
            }
            
            ctx.restore();
        });
        
        // Draw watermark
        this.renderWatermark(ctx, x, y, size.width, size.height);
        
        // Draw custom border
        this.renderCardBorder(ctx, x, y, size.width, size.height);
    }

    renderTextureToCanvas(ctx, texture, x, y, size) {
        if (texture === 'none') return;
        
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 1;
        
        switch (texture) {
            case 'lines':
                for (let lineY = y; lineY < y + size.height; lineY += 20) {
                    ctx.beginPath();
                    ctx.moveTo(x, lineY);
                    ctx.lineTo(x + size.width, lineY);
                    ctx.stroke();
                }
                break;
            case 'dots':
                for (let dotX = x + 10; dotX < x + size.width; dotX += 20) {
                    for (let dotY = y + 10; dotY < y + size.height; dotY += 20) {
                        ctx.beginPath();
                        ctx.arc(dotX, dotY, 1, 0, 2 * Math.PI);
                        ctx.fill();
                    }
                }
                break;
            case 'grid':
                for (let gridX = x; gridX < x + size.width; gridX += 20) {
                    ctx.beginPath();
                    ctx.moveTo(gridX, y);
                    ctx.lineTo(gridX, y + size.height);
                    ctx.stroke();
                }
                for (let gridY = y; gridY < y + size.height; gridY += 20) {
                    ctx.beginPath();
                    ctx.moveTo(x, gridY);
                    ctx.lineTo(x + size.width, gridY);
                    ctx.stroke();
                }
                break;
            case 'diagonal':
                for (let line = -size.height; line < size.width + size.height; line += 25) {
                    ctx.beginPath();
                    ctx.moveTo(x + line, y);
                    ctx.lineTo(x + line - size.height, y + size.height);
                    ctx.stroke();
                }
                break;
            case 'hexagon':
                const hexRadius = 15;
                const hexHeight = hexRadius * Math.sqrt(3);
                for (let row = 0; row < size.height / hexHeight + 2; row++) {
                    for (let col = 0; col < size.width / (hexRadius * 1.5) + 2; col++) {
                        const hexX = x + col * hexRadius * 1.5;
                        const hexY = y + row * hexHeight + (col % 2) * hexHeight / 2;
                        this.drawHexagonToCanvas(ctx, hexX, hexY, hexRadius * 0.8);
                    }
                }
                break;
            case 'circles':
                for (let circleX = x + 25; circleX < x + size.width; circleX += 50) {
                    for (let circleY = y + 25; circleY < y + size.height; circleY += 50) {
                        ctx.beginPath();
                        ctx.arc(circleX, circleY, 8, 0, 2 * Math.PI);
                        ctx.stroke();
                    }
                }
                break;
            case 'waves':
                for (let waveY = y; waveY < y + size.height; waveY += 30) {
                    ctx.beginPath();
                    ctx.moveTo(x, waveY);
                    for (let waveX = x; waveX <= x + size.width; waveX += 10) {
                        const waveYPos = waveY + Math.sin((waveX - x) / 20) * 5;
                        ctx.lineTo(waveX, waveYPos);
                    }
                    ctx.stroke();
                }
                break;
            case 'crosshatch':
                // Diagonal lines one direction
                for (let line = -size.height; line < size.width + size.height; line += 15) {
                    ctx.beginPath();
                    ctx.moveTo(x + line, y);
                    ctx.lineTo(x + line - size.height, y + size.height);
                    ctx.stroke();
                }
                // Diagonal lines other direction
                for (let line = 0; line < size.width + size.height; line += 15) {
                    ctx.beginPath();
                    ctx.moveTo(x + line, y);
                    ctx.lineTo(x + line + size.height, y + size.height);
                    ctx.stroke();
                }
                break;
            case 'paper':
                // Subtle paper texture with random dots
                for (let i = 0; i < 200; i++) {
                    const dotX = x + Math.random() * size.width;
                    const dotY = y + Math.random() * size.height;
                    ctx.globalAlpha = Math.random() * 0.1;
                    ctx.beginPath();
                    ctx.arc(dotX, dotY, 0.5, 0, 2 * Math.PI);
                    ctx.fill();
                }
                break;
        }
        
        ctx.restore();
    }

    drawHexagonToCanvas(ctx, x, y, radius) {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i * 60) * Math.PI / 180;
            const hexX = x + radius * Math.cos(angle);
            const hexY = y + radius * Math.sin(angle);
            if (i === 0) {
                ctx.moveTo(hexX, hexY);
            } else {
                ctx.lineTo(hexX, hexY);
            }
        }
        ctx.closePath();
        ctx.stroke();
    }

    renderTextElementToCanvas(ctx, element, content) {
        ctx.save();
        
        // Apply transformations
        if (element.rotation) {
            ctx.translate(element.x + element.width / 2, element.y + element.height / 2);
            ctx.rotate((element.rotation * Math.PI) / 180);
            ctx.translate(-element.width / 2, -element.height / 2);
        } else {
            ctx.translate(element.x, element.y);
        }
        
        ctx.globalAlpha = element.opacity || 1;
        
        // Draw background
        if (element.backgroundColor && element.backgroundColor !== 'transparent') {
            ctx.fillStyle = element.backgroundColor;
            ctx.fillRect(0, 0, element.width, element.height);
        }
        
        // Set text style
        ctx.fillStyle = element.color;
        let fontStyle = '';
        if (element.fontStyle === 'italic') fontStyle += 'italic ';
        if (element.fontWeight === 'bold') fontStyle += 'bold ';
        ctx.font = `${fontStyle}${element.fontSize}px ${element.fontFamily}`;
        ctx.textAlign = element.textAlign;
        
        const textX = element.textAlign === 'center' ? element.width / 2 : 
                     element.textAlign === 'right' ? element.width : 0;
        
        // Draw text with word wrapping
        this.drawWrappedText(ctx, content, textX, element.fontSize, element.width, element.height, element.fontSize);
        
        ctx.restore();
    }

    renderImageElementToCanvas(ctx, element, imageData) {
        ctx.save();
        
        // Apply transformations
        if (element.rotation) {
            ctx.translate(element.x + element.width / 2, element.y + element.height / 2);
            ctx.rotate((element.rotation * Math.PI) / 180);
            ctx.translate(-element.width / 2, -element.height / 2);
        } else {
            ctx.translate(element.x, element.y);
        }
        
        ctx.globalAlpha = element.opacity || 1;
        
        if (imageData && imageData.dataUrl) {
            const img = new Image();
            img.onload = () => {
                if (element.borderRadius && element.borderRadius > 0) {
                    ctx.beginPath();
                    this.roundRect(ctx, 0, 0, element.width, element.height, element.borderRadius);
                    ctx.clip();
                }
                ctx.drawImage(img, 0, 0, element.width, element.height);
            };
            img.src = imageData.dataUrl;
        } else {
            // Draw placeholder
            ctx.fillStyle = '#f8f9fa';
            ctx.fillRect(0, 0, element.width, element.height);
            
            ctx.fillStyle = '#6c757d';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(element.placeholder, element.width / 2, element.height / 2 + 4);
        }
        
        ctx.restore();
    }

    drawWrappedText(ctx, text, x, y, maxWidth, maxHeight, lineHeight) {
        const words = text.split(' ');
        let line = '';
        let currentY = y;
        
        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            
            if (testWidth > maxWidth && n > 0) {
                ctx.fillText(line, x, currentY);
                line = words[n] + ' ';
                currentY += lineHeight;
                
                if (currentY > maxHeight) break;
            } else {
                line = testLine;
            }
        }
        
        if (currentY <= maxHeight) {
            ctx.fillText(line, x, currentY);
        }
    }

    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }

    renderWatermark(ctx, x, y, width, height) {
        const watermark = this.project.watermarkSettings;
        if (!watermark.text) return;
        
        ctx.save();
        ctx.globalAlpha = watermark.opacity;
        ctx.fillStyle = '#cccccc';
        ctx.font = `${watermark.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        let textX, textY;
        switch (watermark.position) {
            case 'center':
                textX = x + width / 2;
                textY = y + height / 2;
                break;
            case 'top-left':
                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';
                textX = x + 10;
                textY = y + 10;
                break;
            case 'top-right':
                ctx.textAlign = 'right';
                ctx.textBaseline = 'top';
                textX = x + width - 10;
                textY = y + 10;
                break;
            case 'bottom-left':
                ctx.textAlign = 'left';
                ctx.textBaseline = 'bottom';
                textX = x + 10;
                textY = y + height - 10;
                break;
            case 'bottom-right':
            default:
                ctx.textAlign = 'right';
                ctx.textBaseline = 'bottom';
                textX = x + width - 10;
                textY = y + height - 10;
                break;
        }
        
        ctx.fillText(watermark.text, textX, textY);
        ctx.restore();
    }

    renderCardBorder(ctx, x, y, width, height) {
        const border = this.project.borderSettings;
        if (border.width <= 0) return;
        
        ctx.save();
        ctx.strokeStyle = border.color;
        ctx.lineWidth = border.width;
        
        // Set line style
        switch (border.style) {
            case 'dashed':
                ctx.setLineDash([10, 5]);
                break;
            case 'dotted':
                ctx.setLineDash([2, 3]);
                break;
            case 'double':
                // Draw outer border
                ctx.strokeRect(x + border.width/2, y + border.width/2, 
                    width - border.width, height - border.width);
                // Draw inner border
                ctx.strokeRect(x + border.width * 1.5, y + border.width * 1.5, 
                    width - border.width * 3, height - border.width * 3);
                ctx.restore();
                return;
            default:
                ctx.setLineDash([]);
        }
        
        ctx.strokeRect(x + border.width/2, y + border.width/2, 
            width - border.width, height - border.width);
        ctx.restore();
    }

    // New utility functions for custom features
    applyCardSizePreset(width, height) {
        this.project.customCardSize.width = width;
        this.project.customCardSize.height = height;
        
        document.getElementById('custom-width').value = width;
        document.getElementById('custom-height').value = height;
        
        this.updateCardSizeDisplay();
    }

    updateCardSizeDisplay() {
        const { width, height } = this.project.customCardSize;
        const ratio = (width / height).toFixed(2);
        
        // Update display text
        document.getElementById('card-size-value').textContent = `${width} × ${height} mm (${ratio}:1)`;
        
        // Update canvas if it exists and we're on master design step
        if (this.canvas && this.currentStep === 'master-design') {
            this.initCanvas(); // Reinitialize with new size
        }
    }

    setBorderColor(color) {
        this.project.borderSettings.color = color;
        document.getElementById('border-color').value = color;
        this.updateCanvasPreview();
    }

    setWatermarkText(text) {
        this.project.watermarkSettings.text = text.substring(0, 50); // Limit to 50 chars
        this.updateCanvasPreview();
    }

    setWatermarkOpacity(opacity) {
        this.project.watermarkSettings.opacity = opacity / 100;
        document.getElementById('watermark-opacity-value').textContent = `${opacity}%`;
        this.updateCanvasPreview();
    }

    setWatermarkSize(size) {
        this.project.watermarkSettings.size = parseInt(size);
        this.updateCanvasPreview();
    }

    setWatermarkPosition(position) {
        this.project.watermarkSettings.position = position;
        this.updateCanvasPreview();
    }

    setBorderWidth(width) {
        this.project.borderSettings.width = parseInt(width);
        document.getElementById('border-width-value').textContent = `${width}px`;
        this.updateCanvasPreview();
    }

    setBorderStyle(style) {
        this.project.borderSettings.style = style;
        this.updateCanvasPreview();
    }

    getCardSize() {
        if (this.project.layout === 'custom') {
            // Convert mm to pixels (assuming 96 DPI)
            const mmToPx = 96 / 25.4;
            return {
                width: this.project.customCardSize.width * mmToPx,
                height: this.project.customCardSize.height * mmToPx
            };
        }
        
        // Default sizes for standard layouts
        const layouts = {
            '2x2': { width: 320, height: 200 },
            '2x4': { width: 160, height: 100 },
            '3x3': { width: 200, height: 133 }
        };
        
        return layouts[this.project.layout] || layouts['2x2'];
    }

    renderCardBorder(ctx, x, y, width, height) {
        const { width: borderWidth, color, style } = this.project.borderSettings;
        
        if (borderWidth > 0) {
            ctx.save();
            ctx.strokeStyle = color;
            ctx.lineWidth = borderWidth;
            
            // Set line style
            switch (style) {
                case 'dashed':
                    ctx.setLineDash([10, 5]);
                    break;
                case 'dotted':
                    ctx.setLineDash([2, 3]);
                    break;
                case 'double':
                    // Draw two borders
                    ctx.lineWidth = borderWidth / 3;
                    ctx.strokeRect(x, y, width, height);
                    ctx.strokeRect(x + borderWidth, y + borderWidth, width - 2 * borderWidth, height - 2 * borderWidth);
                    ctx.restore();
                    return;
                default:
                    ctx.setLineDash([]);
            }
            
            ctx.strokeRect(x, y, width, height);
            ctx.restore();
        }
    }

    renderWatermark(ctx, x, y, width, height) {
        const { text, opacity, size, position } = this.project.watermarkSettings;
        
        if (!text || text.trim() === '') return;
        
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.fillStyle = '#666666';
        ctx.font = `${size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        let watermarkX, watermarkY;
        
        switch (position) {
            case 'center':
                watermarkX = x + width / 2;
                watermarkY = y + height / 2;
                break;
            case 'bottom-right':
                ctx.textAlign = 'right';
                ctx.textBaseline = 'bottom';
                watermarkX = x + width - 10;
                watermarkY = y + height - 10;
                break;
            case 'bottom-left':
                ctx.textAlign = 'left';
                ctx.textBaseline = 'bottom';
                watermarkX = x + 10;
                watermarkY = y + height - 10;
                break;
            case 'top-right':
                ctx.textAlign = 'right';
                ctx.textBaseline = 'top';
                watermarkX = x + width - 10;
                watermarkY = y + 10;
                break;
            case 'top-left':
                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';
                watermarkX = x + 10;
                watermarkY = y + 10;
                break;
            default:
                watermarkX = x + width / 2;
                watermarkY = y + height / 2;
        }
        
        ctx.fillText(text, watermarkX, watermarkY);
        ctx.restore();
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
        const item = content.closest('.card-accordion-item');
        const arrow = item.querySelector('.accordion-arrow');
        
        // Close all other accordions first
        document.querySelectorAll('.card-accordion-item').forEach((otherItem, otherIndex) => {
            if (otherIndex !== cardIndex) {
                otherItem.classList.remove('active');
                const otherContent = otherItem.querySelector('.card-accordion-content');
                const otherArrow = otherItem.querySelector('.accordion-arrow');
                if (otherContent) otherContent.style.maxHeight = '0';
                if (otherArrow) otherArrow.style.transform = 'rotate(0deg)';
            }
        });
        
        // Toggle current accordion
        const isActive = item.classList.contains('active');
        
        if (isActive) {
            item.classList.remove('active');
            content.style.maxHeight = '0';
            if (arrow) arrow.style.transform = 'rotate(0deg)';
        } else {
            item.classList.add('active');
            content.style.maxHeight = content.scrollHeight + 'px';
            if (arrow) arrow.style.transform = 'rotate(180deg)';
        }
    }

    updateCardField(cardIndex, side, type, fieldIndex, value) {
        if (type === 'text') {
            this.project.cards[cardIndex][side].textFields[fieldIndex] = value;
        } else if (type === 'image') {
            if (value instanceof File) {
                this.loadImageFile(value, (imageData) => {
                    this.project.cards[cardIndex][side].imageFields[fieldIndex] = imageData;
                });
            } else {
                this.project.cards[cardIndex][side].imageFields[fieldIndex] = value;
            }
        }
    }

    loadImageFile(file, callback) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Resize image to manageable size
                const maxWidth = 400;
                const maxHeight = 400;
                let { width, height } = img;
                
                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width *= ratio;
                    height *= ratio;
                }
                
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                
                callback({
                    dataUrl: canvas.toDataURL('image/jpeg', 0.8),
                    originalWidth: img.width,
                    originalHeight: img.height,
                    resizedWidth: width,
                    resizedHeight: height
                });
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    generatePreview() {
        this.showLoadingOverlay('Vorschau wird generiert...');
        
        setTimeout(async () => {
            try {
                // Generate preview PDF
                const previewPDF = await this.generatePreviewPDF();
                
                // Show preview in iframe
                const previewContainer = document.getElementById('pdf-preview');
                previewContainer.src = previewPDF;
                
                this.showStep('preview-download');
                
            } catch (error) {
                console.error('Error generating preview:', error);
                alert('Fehler beim Generieren der Vorschau: ' + error.message);
            } finally {
                this.hideLoadingOverlay();
            }
        }, 500);
    }

    async generatePreviewPDF() {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: this.project.paperSize
        });

        // Calculate layout dimensions
        const pageSize = this.getPageDimensions();
        const cardLayout = this.getCardLayout();
        const cardDimensions = this.calculateCardDimensions(pageSize, cardLayout);

        // Generate preview with first 4 cards maximum
        const previewCardCount = Math.min(this.project.cardCount, cardLayout.cardsPerPage);
        
        // Add title page
        pdf.setFontSize(20);
        pdf.text('Card Creator - Vorschau', 20, 30);
        pdf.setFontSize(12);
        pdf.text(`Projekt: ${this.project.cardCount} Karten`, 20, 45);
        pdf.text(`Layout: ${this.project.layout} auf ${this.project.paperSize.toUpperCase()}`, 20, 55);
        pdf.text(`Template: ${this.project.template}`, 20, 65);
        pdf.text(`Erstellt: ${new Date().toLocaleDateString('de-DE')}`, 20, 75);

        // Add sample cards page
        pdf.addPage();
        
        for (let cardIndex = 0; cardIndex < previewCardCount; cardIndex++) {
            const card = this.project.cards[cardIndex] || { 
                id: cardIndex + 1, 
                front: { textFields: {}, imageFields: {} },
                back: { textFields: {}, imageFields: {} }
            };
            
            const row = Math.floor(cardIndex / cardLayout.cols);
            const col = cardIndex % cardLayout.cols;
            
            const x = cardDimensions.margin + col * (cardDimensions.width + cardDimensions.spacing);
            const y = cardDimensions.margin + row * (cardDimensions.height + cardDimensions.spacing);
            
            // Render front side
            await this.renderCardToPDF(pdf, card, 'front', x, y, cardDimensions);
        }

        // Add back sides page if there are cards
        if (previewCardCount > 0) {
            pdf.addPage();
            
            for (let cardIndex = 0; cardIndex < previewCardCount; cardIndex++) {
                const card = this.project.cards[cardIndex] || { 
                    id: cardIndex + 1, 
                    front: { textFields: {}, imageFields: {} },
                    back: { textFields: {}, imageFields: {} }
                };
                
                const row = Math.floor(cardIndex / cardLayout.cols);
                const col = (cardLayout.cols - 1) - (cardIndex % cardLayout.cols); // Mirror for back side
                
                const x = cardDimensions.margin + col * (cardDimensions.width + cardDimensions.spacing);
                const y = cardDimensions.margin + row * (cardDimensions.height + cardDimensions.spacing);
                
                // Render back side
                await this.renderCardToPDF(pdf, card, 'back', x, y, cardDimensions);
            }
        }

        // Return PDF as data URL for preview
        return pdf.output('datauristring');
    }

    previewPDF() {
        this.showLoadingOverlay('PDF-Vorschau wird geladen...');
        
        setTimeout(async () => {
            try {
                const fullPDF = await this.generateFullPDF();
                const previewContainer = document.getElementById('pdf-preview');
                previewContainer.src = fullPDF;
                
            } catch (error) {
                console.error('Error generating PDF preview:', error);
                alert('Fehler beim Laden der PDF-Vorschau: ' + error.message);
            } finally {
                this.hideLoadingOverlay();
            }
        }, 500);
    }

    async generateFullPDF() {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: this.project.paperSize
        });
        
        // Calculate card dimensions and positions
        const pageSize = this.getPageDimensions();
        const cardLayout = this.getCardLayout();
        const cardDimensions = this.calculateCardDimensions(pageSize, cardLayout);
        
        let currentPage = 0;
        let cardsOnCurrentPage = 0;
        
        // Generate all front sides first
        for (let cardIndex = 0; cardIndex < this.project.cardCount; cardIndex++) {
            const card = this.project.cards[cardIndex] || {
                id: cardIndex + 1,
                front: { textFields: {}, imageFields: {} },
                back: { textFields: {}, imageFields: {} }
            };
            
            // Calculate position on page
            const row = Math.floor(cardsOnCurrentPage / cardLayout.cols);
            const col = cardsOnCurrentPage % cardLayout.cols;
            
            const x = cardDimensions.margin + col * (cardDimensions.width + cardDimensions.spacing);
            const y = cardDimensions.margin + row * (cardDimensions.height + cardDimensions.spacing);
            
            // Render front side
            await this.renderCardToPDF(pdf, card, 'front', x, y, cardDimensions);
            
            cardsOnCurrentPage++;
            
            // Check if we need a new page
            if (cardsOnCurrentPage >= cardLayout.cardsPerPage || cardIndex === this.project.cardCount - 1) {
                // Add back sides on next page
                pdf.addPage();
                
                const startIndex = cardIndex - cardsOnCurrentPage + 1;
                for (let backIndex = startIndex; backIndex <= cardIndex; backIndex++) {
                    const backCard = this.project.cards[backIndex] || {
                        id: backIndex + 1,
                        front: { textFields: {}, imageFields: {} },
                        back: { textFields: {}, imageFields: {} }
                    };
                    
                    const backRow = Math.floor((backIndex - startIndex) / cardLayout.cols);
                    const backCol = (cardLayout.cols - 1) - ((backIndex - startIndex) % cardLayout.cols); // Mirror for back side
                    
                    const backX = cardDimensions.margin + backCol * (cardDimensions.width + cardDimensions.spacing);
                    const backY = cardDimensions.margin + backRow * (cardDimensions.height + cardDimensions.spacing);
                    
                    await this.renderCardToPDF(pdf, backCard, 'back', backX, backY, cardDimensions);
                }
                
                cardsOnCurrentPage = 0;
                if (cardIndex < this.project.cardCount - 1) {
                    pdf.addPage();
                }
            }
        }
        
        // Add metadata
        pdf.setProperties({
            title: 'Card Creator - Lernkarten',
            subject: 'Generierte Lernkarten',
            author: 'Card Creator App',
            creator: 'Card Creator App',
            keywords: 'Lernkarten, Bildung, Unterricht'
        });
        
        return pdf.output('datauristring');
    }

    // Enhanced card rendering for better preview quality
    async renderCardToPDF(pdf, card, side, x, y, dimensions) {
        const masterSide = this.project.masterCard[side];
        
        // Draw background with better color handling
        if (masterSide.backgroundColor && masterSide.backgroundColor !== 'transparent') {
            const bgColor = this.hexToRgb(masterSide.backgroundColor);
            pdf.setFillColor(bgColor.r, bgColor.g, bgColor.b);
            pdf.rect(x, y, dimensions.width, dimensions.height, 'F');
        }
        
        // Draw background texture
        if (masterSide.texture && masterSide.texture !== 'none') {
            this.drawTextureToPDF(pdf, masterSide.texture, x, y, dimensions);
        }
        
        // Sort elements by zIndex for proper layering
        const allElements = [
            ...masterSide.textFields.map((field, index) => ({ ...field, type: 'text', index })),
            ...masterSide.imageFields.map((field, index) => ({ ...field, type: 'image', index }))
        ].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
        
        // Draw all elements in correct order
        for (const element of allElements) {
            if (element.type === 'text') {
                const content = card[side].textFields[element.index] || element.placeholder;
                this.drawTextFieldToPDF(pdf, element, content, x, y, dimensions);
            } else {
                const imageData = card[side].imageFields[element.index];
                await this.drawImageFieldToPDF(pdf, element, imageData, x, y, dimensions);
            }
        }
        
        // Draw cut marks if enabled
        if (masterSide.showCutMarks) {
            this.drawCutMarksToPDF(pdf, x, y, dimensions);
        }
        
        // Draw card number if enabled
        if (masterSide.showCardNumbers) {
            this.drawCardNumberToPDF(pdf, card.id, x, y, dimensions);
        }
        
        // Draw watermark if enabled or if watermark settings exist
        if (masterSide.showWatermark || this.project.watermarkSettings.text) {
            this.drawWatermarkToPDF(pdf, x, y, dimensions);
        }
        
        // Draw custom border
        this.drawCardBorderToPDF(pdf, x, y, dimensions);
    }

    drawCardBorderToPDF(pdf, x, y, dimensions) {
        const { width: borderWidth, color, style } = this.project.borderSettings;
        
        if (borderWidth > 0) {
            const borderColor = this.hexToRgb(color);
            pdf.setDrawColor(borderColor.r, borderColor.g, borderColor.b);
            pdf.setLineWidth(borderWidth * 0.3); // Convert to mm
            
            // Set line style
            switch (style) {
                case 'dashed':
                    pdf.setLineDashPattern([3, 2], 0);
                    break;
                case 'dotted':
                    pdf.setLineDashPattern([1, 1], 0);
                    break;
                case 'double':
                    // Draw two borders
                    pdf.setLineWidth((borderWidth * 0.3) / 2);
                    pdf.rect(x, y, dimensions.width, dimensions.height, 'S');
                    pdf.rect(x + borderWidth * 0.15, y + borderWidth * 0.15, 
                            dimensions.width - borderWidth * 0.3, 
                            dimensions.height - borderWidth * 0.3, 'S');
                    pdf.setLineDashPattern([], 0); // Reset dash pattern
                    return;
                default:
                    pdf.setLineDashPattern([], 0); // Solid line
            }
            
            pdf.rect(x, y, dimensions.width, dimensions.height, 'S');
            pdf.setLineDashPattern([], 0); // Reset dash pattern
        }
    }

    drawWatermarkToPDF(pdf, x, y, dimensions) {
        const { text, opacity, size, position } = this.project.watermarkSettings;
        
        if (!text || text.trim() === '') return;
        
        pdf.setGState(new pdf.GState({ opacity: opacity }));
        pdf.setTextColor(100, 100, 100);
        pdf.setFontSize(size * 0.75); // Convert to PDF units
        
        let watermarkX, watermarkY;
        let align = 'center';
        
        switch (position) {
            case 'center':
                watermarkX = x + dimensions.width / 2;
                watermarkY = y + dimensions.height / 2;
                align = 'center';
                break;
            case 'bottom-right':
                watermarkX = x + dimensions.width - 5;
                watermarkY = y + dimensions.height - 5;
                align = 'right';
                break;
            case 'bottom-left':
                watermarkX = x + 5;
                watermarkY = y + dimensions.height - 5;
                align = 'left';
                break;
            case 'top-right':
                watermarkX = x + dimensions.width - 5;
                watermarkY = y + 10;
                align = 'right';
                break;
            case 'top-left':
                watermarkX = x + 5;
                watermarkY = y + 10;
                align = 'left';
                break;
            default:
                watermarkX = x + dimensions.width / 2;
                watermarkY = y + dimensions.height / 2;
                align = 'center';
        }
        
        pdf.text(text, watermarkX, watermarkY, { align: align });
        pdf.setGState(new pdf.GState({ opacity: 1 })); // Reset opacity
    }

    drawTextureToPDF(pdf, texture, x, y, dimensions) {
        pdf.setDrawColor(0, 0, 0);
        pdf.setGState(new pdf.GState({ opacity: 0.1 }));
        
        switch (texture) {
            case 'lines':
                for (let lineY = y; lineY < y + dimensions.height; lineY += 5) {
                    pdf.line(x, lineY, x + dimensions.width, lineY);
                }
                break;
            case 'dots':
                for (let dotX = x + 5; dotX < x + dimensions.width; dotX += 10) {
                    for (let dotY = y + 5; dotY < y + dimensions.height; dotY += 10) {
                        pdf.circle(dotX, dotY, 0.5, 'F');
                    }
                }
                break;
            case 'grid':
                for (let gridX = x; gridX < x + dimensions.width; gridX += 5) {
                    pdf.line(gridX, y, gridX, y + dimensions.height);
                }
                for (let gridY = y; gridY < y + dimensions.height; gridY += 5) {
                    pdf.line(x, gridY, x + dimensions.width, gridY);
                }
                break;
        }
        
        pdf.setGState(new pdf.GState({ opacity: 1 })); // Reset opacity
    }

    drawWatermarkToPDF(pdf, x, y, dimensions) {
        pdf.setGState(new pdf.GState({ opacity: 0.1 }));
        pdf.setTextColor(128, 128, 128);
        pdf.setFontSize(8);
        
        // Rotate and draw watermark
        pdf.text('CARD CREATOR', x + dimensions.width / 2, y + dimensions.height / 2, {
            angle: -45,
            align: 'center'
        });
        
        pdf.setGState(new pdf.GState({ opacity: 1 })); // Reset opacity
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 255, g: 255, b: 255 };
    }

    async downloadPDF() {
        const loadingOverlay = document.getElementById('loading-overlay');
        loadingOverlay.classList.remove('hidden');
        
        try {
            // Generate PDF with proper layout
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: this.project.paperSize
            });
            
            // Calculate card dimensions and positions
            const pageSize = this.getPageDimensions();
            const cardLayout = this.getCardLayout();
            const cardDimensions = this.calculateCardDimensions(pageSize, cardLayout);
            
            let currentPage = 0;
            let cardsOnCurrentPage = 0;
            
            for (let cardIndex = 0; cardIndex < this.project.cardCount; cardIndex++) {
                const card = this.project.cards[cardIndex];
                
                // Calculate position on page
                const row = Math.floor(cardsOnCurrentPage / cardLayout.cols);
                const col = cardsOnCurrentPage % cardLayout.cols;
                
                const x = cardDimensions.margin + col * (cardDimensions.width + cardDimensions.spacing);
                const y = cardDimensions.margin + row * (cardDimensions.height + cardDimensions.spacing);
                
                // Render front side
                await this.renderCardToPDF(pdf, card, 'front', x, y, cardDimensions);
                
                cardsOnCurrentPage++;
                
                // Check if we need a new page
                if (cardsOnCurrentPage >= cardLayout.cardsPerPage) {
                    pdf.addPage();
                    cardsOnCurrentPage = 0;
                    currentPage++;
                    
                    // Add back sides on new page
                    for (let backIndex = cardIndex - cardLayout.cardsPerPage + 1; backIndex <= cardIndex; backIndex++) {
                        const backCard = this.project.cards[backIndex];
                        const backRow = Math.floor((backIndex - (cardIndex - cardLayout.cardsPerPage + 1)) / cardLayout.cols);
                        const backCol = (cardLayout.cols - 1) - ((backIndex - (cardIndex - cardLayout.cardsPerPage + 1)) % cardLayout.cols); // Mirror for back side
                        
                        const backX = cardDimensions.margin + backCol * (cardDimensions.width + cardDimensions.spacing);
                        const backY = cardDimensions.margin + backRow * (cardDimensions.height + cardDimensions.spacing);
                        
                        await this.renderCardToPDF(pdf, backCard, 'back', backX, backY, cardDimensions);
                    }
                    
                    if (cardIndex < this.project.cardCount - 1) {
                        pdf.addPage();
                    }
                }
            }
            
            // Handle remaining back sides if needed
            if (cardsOnCurrentPage > 0) {
                pdf.addPage();
                for (let backIndex = this.project.cardCount - cardsOnCurrentPage; backIndex < this.project.cardCount; backIndex++) {
                    const backCard = this.project.cards[backIndex];
                    const adjustedIndex = backIndex - (this.project.cardCount - cardsOnCurrentPage);
                    const backRow = Math.floor(adjustedIndex / cardLayout.cols);
                    const backCol = (cardLayout.cols - 1) - (adjustedIndex % cardLayout.cols); // Mirror for back side
                    
                    const backX = cardDimensions.margin + backCol * (cardDimensions.width + cardDimensions.spacing);
                    const backY = cardDimensions.margin + backRow * (cardDimensions.height + cardDimensions.spacing);
                    
                    await this.renderCardToPDF(pdf, backCard, 'back', backX, backY, cardDimensions);
                }
            }
            
            // Add metadata
            pdf.setProperties({
                title: 'Card Creator - Lernkarten',
                subject: 'Generierte Lernkarten',
                author: 'Card Creator App',
                creator: 'Card Creator App'
            });
            
            const filename = `lernkarten_${new Date().toISOString().slice(0, 10)}.pdf`;
            pdf.save(filename);
            
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Fehler beim Generieren der PDF. Bitte versuchen Sie es erneut.');
        } finally {
            loadingOverlay.classList.add('hidden');
        }
    }

    getPageDimensions() {
        // Return page dimensions in mm
        return this.project.paperSize === 'a4' 
            ? { width: 210, height: 297 }
            : { width: 297, height: 420 };
    }

    getCardLayout() {
        const layouts = {
            '2x2': { rows: 2, cols: 2, cardsPerPage: 4 },
            '2x4': { rows: 4, cols: 2, cardsPerPage: 8 },
            '3x3': { rows: 3, cols: 3, cardsPerPage: 9 }
        };
        return layouts[this.project.layout];
    }

    calculateCardDimensions(pageSize, layout) {
        const margin = 10; // mm
        const spacing = 5; // mm between cards
        
        const availableWidth = pageSize.width - (2 * margin) - ((layout.cols - 1) * spacing);
        const availableHeight = pageSize.height - (2 * margin) - ((layout.rows - 1) * spacing);
        
        return {
            width: availableWidth / layout.cols,
            height: availableHeight / layout.rows,
            margin: margin,
            spacing: spacing
        };
    }

    async renderCardToPDF(pdf, card, side, x, y, dimensions) {
        const masterSide = this.project.masterCard[side];
        
        // Draw background
        pdf.setFillColor(masterSide.backgroundColor);
        pdf.rect(x, y, dimensions.width, dimensions.height, 'F');
        
        // Draw cut marks if enabled
        if (masterSide.showCutMarks) {
            this.drawCutMarksToPDF(pdf, x, y, dimensions);
        }
        
        // Draw text fields
        masterSide.textFields.forEach((field, index) => {
            const content = card[side].textFields[index] || field.placeholder;
            this.drawTextFieldToPDF(pdf, field, content, x, y, dimensions);
        });
        
        // Draw image fields
        masterSide.imageFields.forEach((field, index) => {
            const imageData = card[side].imageFields[index];
            this.drawImageFieldToPDF(pdf, field, imageData, x, y, dimensions);
        });
        
        // Draw card number if enabled
        if (masterSide.showCardNumbers) {
            this.drawCardNumberToPDF(pdf, card.id, x, y, dimensions);
        }
    }

    drawTextFieldToPDF(pdf, field, content, cardX, cardY, cardDimensions) {
        const scaleX = cardDimensions.width / this.canvas.width;
        const scaleY = cardDimensions.height / this.canvas.height;
        
        const x = cardX + (field.x * scaleX);
        const y = cardY + (field.y * scaleY) + (field.fontSize * scaleY * 0.8);
        
        pdf.setTextColor(field.color);
        pdf.setFontSize(field.fontSize * scaleY * 0.75); // Convert to PDF units
        pdf.text(content, x, y);
    }

    drawImageFieldToPDF(pdf, field, imageData, cardX, cardY, cardDimensions) {
        if (!imageData || !imageData.dataUrl) return;
        
        const scaleX = cardDimensions.width / this.canvas.width;
        const scaleY = cardDimensions.height / this.canvas.height;
        
        const x = cardX + (field.x * scaleX);
        const y = cardY + (field.y * scaleY);
        const width = field.width * scaleX;
        const height = field.height * scaleY;
        
        try {
            pdf.addImage(imageData.dataUrl, 'JPEG', x, y, width, height);
        } catch (error) {
            console.warn('Error adding image to PDF:', error);
        }
    }

    drawCutMarksToPDF(pdf, x, y, dimensions) {
        const markLength = 3;
        const offset = 2;
        
        pdf.setDrawColor(0, 0, 0);
        pdf.setLineWidth(0.1);
        
        // Corner marks
        pdf.line(x - offset, y - offset, x - offset + markLength, y - offset);
        pdf.line(x - offset, y - offset, x - offset, y - offset + markLength);
        
        pdf.line(x + dimensions.width + offset, y - offset, x + dimensions.width + offset - markLength, y - offset);
        pdf.line(x + dimensions.width + offset, y - offset, x + dimensions.width + offset, y - offset + markLength);
        
        pdf.line(x - offset, y + dimensions.height + offset, x - offset + markLength, y + dimensions.height + offset);
        pdf.line(x - offset, y + dimensions.height + offset, x - offset, y + dimensions.height + offset - markLength);
        
        pdf.line(x + dimensions.width + offset, y + dimensions.height + offset, x + dimensions.width + offset - markLength, y + dimensions.height + offset);
        pdf.line(x + dimensions.width + offset, y + dimensions.height + offset, x + dimensions.width + offset, y + dimensions.height + offset - markLength);
    }

    drawCardNumberToPDF(pdf, cardNumber, x, y, dimensions) {
        pdf.setTextColor(100, 100, 100);
        pdf.setFontSize(6);
        pdf.text(`#${cardNumber}`, x + 1, y + dimensions.height - 1);
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
    console.log('DOMContentLoaded event fired');
    cardCreator = new CardCreator();
    window.cardCreator = cardCreator; // Make globally accessible
    console.log('CardCreator instance created and made global');

    // Add global navigation functions for easy access
    window.goToProjectSetup = () => cardCreator.goToProjectSetup();
    window.goToDesign = () => cardCreator.goToDesign();
    window.goToCards = () => cardCreator.goToCards();
    window.goToExport = () => cardCreator.goToExport();
    
    // Add debugging function
    window.testTabSwitch = (tabId, index) => {
        console.log('Manual tab switch test:', tabId, index);
        cardCreator.switchTab(tabId, index);
    };
    
    // Add function to check tab states
    window.checkTabStates = () => {
        console.log('=== TAB STATES ===');
        document.querySelectorAll('.tab-content').forEach(content => {
            console.log(`${content.id}: classes="${content.className}", display="${window.getComputedStyle(content).display}"`);
        });
        document.querySelectorAll('.tab-btn').forEach(btn => {
            console.log(`Tab btn ${btn.getAttribute('data-tab')}: classes="${btn.className}"`);
        });
    };
    
    console.log('Global navigation and debugging functions added');
    
    // Force initial tab state after a short delay
    setTimeout(() => {
        console.log('Forcing initial tab state...');
        if (cardCreator) {
            cardCreator.switchTab('project-setup', 0);
        }
    }, 1000);
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
