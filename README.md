# Waver - Pattern Generator

A beautiful, interactive pattern generation tool that allows you to create and export custom patterns in real-time.

## Features

- **7 Pattern Types**:
  - Wave - Smooth flowing wave patterns with adjustable amplitude and frequency
  - Blob - Organic blob shapes with customizable complexity
  - Circle Scatter - Random circle distributions with size variations
  - Layered Waves - Multiple wave layers with color gradients
  - Stacked Steps - Geometric stepped patterns
  - Islamic Pattern - Star-based geometric patterns inspired by Islamic art
  - Floral Pattern - Nature-inspired floral designs

- **Real-time Preview**: See your pattern updates instantly as you adjust settings
- **Customizable Canvas**: Set custom canvas dimensions (default: 1280x1040)
- **Dynamic Settings**: Each pattern type has its own unique set of controls
- **Export Options**: Export your patterns as SVG or PNG files

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open your browser to the URL shown in the terminal (usually http://localhost:5173)

### Build for Production

```bash
npm run build
```

## Usage

1. **Select a Pattern Type**: Choose from the 7 available pattern types in the side panel
2. **Adjust Settings**: Use the sliders and color pickers to customize your pattern
3. **Set Canvas Size**: Modify the width and height of your canvas
4. **Export**: Download your creation as SVG or PNG

## Pattern Settings

### Wave
- Amplitude: Wave height
- Frequency: Number of wave cycles
- Stroke Width: Line thickness
- Layers: Number of wave layers
- Opacity: Transparency level
- Color: Wave color

### Blob
- Blob Count: Number of blobs
- Size: Blob size
- Complexity: Number of points defining each blob
- Opacity: Transparency level
- Color: Blob color

### Circle Scatter
- Circle Count: Number of circles
- Min/Max Radius: Size range for circles
- Stroke Width: Circle outline thickness
- Opacity: Transparency level
- Color: Circle color

### Layered Waves
- Layers: Number of wave layers
- Amplitude: Wave height
- Frequency: Wave cycles
- Opacity: Transparency level
- Color 1 & 2: Gradient colors

### Stacked Steps
- Steps: Number of step elements
- Step Height: Height of each step
- Spacing: Gap between steps
- Opacity: Transparency level
- Color: Step color

### Islamic Pattern
- Grid Size: Pattern grid dimensions
- Complexity: Star points
- Stroke Width: Line thickness
- Opacity: Transparency level
- Color: Pattern color

### Floral Pattern
- Flower Count: Number of flowers
- Petal Count: Petals per flower
- Size: Flower size
- Opacity: Transparency level
- Color: Flower color

## Technologies

- React 18
- Vite
- SVG for pattern generation
- Canvas API for PNG export

## License

MIT


