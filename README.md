# Card Creator - PDF Card Generator

A web-based application for creating customizable cards and exporting them as PDF files. Perfect for creating flashcards, learning materials, business cards, or any other type of cards with ease.

## 🚀 Features

### Project Setup
- **Flexible Grid System**: Choose from preset grids (3x3, 4x4, 2x3, 5x4) or create custom grids up to 10x10
- **Card Count Control**: Select the exact number of cards you need, independent of the grid size
- **Real-time Preview**: See how your cards will look on an A4 page

### Master Design
- **Front & Back Design**: Design both sides of your cards independently
- **Color Customization**: 
  - Background colors with preset palette and custom color picker
  - Border colors and thickness control
  - Color presets for quick selection
- **Text Elements**:
  - Drag & drop textboxes
  - Font family, size, and color customization
  - Bold, italic, underline formatting
  - Background and border styling for textboxes
  - Auto-sizing text display
- **Image Elements**:
  - Upload and position images
  - Resize images with aspect ratio lock
  - Colorful borders for images
  - Opacity control
  - Images automatically fill their containers
- **Background Images**: Upload custom background images
- **Watermarks**: Add optional watermark text

### Content Management
- **Individual Card Content**: Enter specific content for each card
- **Persistent Data**: Content is preserved when switching between tabs
- **Visual Indicators**: See which cards have content and which images are uploaded

### PDF Export
- **High-Quality Output**: Professional PDF generation
- **Proper Scaling**: All elements scale correctly to final print size
- **Front & Back Pages**: Automatic handling of double-sided printing
- **Print-Ready**: Optimized for A4 paper with proper margins

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **PDF Generation**: jsPDF library
- **Responsive Design**: Works on desktop and mobile devices
- **GitHub Pages Compatible**: No server required

## 🌐 Live Demo

Visit the live application: [Card Creator Website](https://hanstydeck.github.io/card-creator-website/)

## 📖 How to Use

1. **Project Setup**: Choose your grid size and number of cards
2. **Master Design**: Design the template for your cards
   - Switch between front and back sides
   - Add textboxes and images
   - Customize colors and styling
3. **Content Entry**: Fill in the specific content for each card
4. **PDF Export**: Generate and download your cards as PDF

## 🔧 Local Development

### Prerequisites
- A modern web browser
- Local web server (optional, but recommended)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/HansTydecks/card-creator-website.git
cd card-creator-website
```

2. Open `index.html` in your browser or serve it with a local web server:
```bash
# Using Python
python -m http.server 8000

# Using Node.js http-server
npx http-server

# Using PHP
php -S localhost:8000
```

3. Navigate to `http://localhost:8000` in your browser

## 📁 Project Structure

```
card-creator-website/
├── index.html          # Main application file
├── styles.css          # Styling and layout
├── script.js           # Application logic
└── README.md          # Project documentation
```

## 🎨 Key Features Explained

### Dynamic Card Sizing
Cards automatically scale based on your chosen grid size:
- Larger grids (8x8, 10x10) = smaller individual cards
- Smaller grids (2x2, 3x3) = larger individual cards
- Master design preview matches final PDF proportions

### Smart Image Handling
- Images automatically fill their designated areas
- Aspect ratio can be locked during resizing
- Support for various image formats (JPEG, PNG, GIF)
- Images persist across tab switches

### Advanced Text Formatting
- Multiple font families available
- Rich text formatting (bold, italic, underline)
- Background colors and borders for text elements
- Auto-expanding textboxes for larger fonts

### Professional PDF Output
- Proper scaling from preview to print
- High-quality image rendering
- Correct alignment for double-sided printing
- Optimized file size

## 🔧 Browser Compatibility

- **Chrome/Edge**: Fully supported
- **Firefox**: Fully supported
- **Safari**: Fully supported
- **Mobile Browsers**: Responsive design for tablets and smartphones

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🐛 Bug Reports

If you find a bug, please create an issue on GitHub with:
- Description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Browser and version information

## ✨ Feature Requests

Have an idea for a new feature? Open an issue and describe:
- What you'd like to see added
- Why it would be useful
- How you envision it working

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

Made with ❤️ for educators, students, and anyone who needs to create cards quickly and efficiently.
