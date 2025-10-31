import { useState, useRef } from 'react';
import './App.css';
import {
  generateWave,
  generateBlob,
  generateCircleScatter,
  generateLayeredWaves,
  generateStackedSteps,
  generateIslamicPattern,
  generateFloralPattern
} from './patternGenerators';

const patternTypes = [
  { id: 'wave', name: 'Wave' },
  { id: 'blob', name: 'Blob' },
  { id: 'circleScatter', name: 'Circle scatter' },
  { id: 'layeredWaves', name: 'Layered waves' },
  { id: 'stackedSteps', name: 'Stacked steps' },
  { id: 'islamicPattern', name: 'Islamic pattern' },
  { id: 'floralPattern', name: 'Floral pattern' }
];

const defaultSettings = {
  wave: {
    width: 1280,
    height: 1040,
    amplitude: 80,
    frequency: 2,
    strokeWidth: 3,
    color: '#667eea',
    opacity: 0.8,
    layers: 5
  },
  blob: {
    width: 1280,
    height: 1040,
    blobCount: 15,
    size: 80,
    color: '#667eea',
    opacity: 0.6,
    complexity: 8
  },
  circleScatter: {
    width: 1280,
    height: 1040,
    circleCount: 50,
    minRadius: 10,
    maxRadius: 60,
    color: '#667eea',
    opacity: 0.5,
    strokeWidth: 2
  },
  layeredWaves: {
    width: 1280,
    height: 1040,
    layers: 8,
    amplitude: 60,
    frequency: 3,
    color1: '#667eea',
    color2: '#764ba2',
    opacity: 0.7
  },
  stackedSteps: {
    width: 1280,
    height: 1040,
    steps: 8,
    stepHeight: 80,
    color: '#667eea',
    opacity: 0.8,
    spacing: 20
  },
  islamicPattern: {
    width: 1280,
    height: 1040,
    gridSize: 8,
    color: '#667eea',
    strokeWidth: 2,
    opacity: 0.8,
    complexity: 8
  },
  floralPattern: {
    width: 1280,
    height: 1040,
    flowerCount: 20,
    petalCount: 6,
    size: 40,
    color: '#667eea',
    opacity: 0.7
  }
};

function App() {
  const [selectedPattern, setSelectedPattern] = useState('wave');
  const [settings, setSettings] = useState(defaultSettings);
  const svgRef = useRef(null);

  const currentSettings = settings[selectedPattern];

  const updateSetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [selectedPattern]: {
        ...prev[selectedPattern],
        [key]: parseFloat(value) || value
      }
    }));
  };

  const generatePattern = () => {
    const patternSettings = { ...currentSettings };
    
    switch (selectedPattern) {
      case 'wave':
        return generateWave(patternSettings);
      case 'blob':
        return generateBlob(patternSettings);
      case 'circleScatter':
        return generateCircleScatter(patternSettings);
      case 'layeredWaves':
        return generateLayeredWaves(patternSettings);
      case 'stackedSteps':
        return generateStackedSteps(patternSettings);
      case 'islamicPattern':
        return generateIslamicPattern(patternSettings);
      case 'floralPattern':
        return generateFloralPattern(patternSettings);
      default:
        return '';
    }
  };

  const exportSVG = () => {
    if (!svgRef.current) return;
    
    const svgData = svgRef.current.outerHTML;
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedPattern}-pattern.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportPNG = () => {
    if (!svgRef.current) return;
    
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const canvas = document.createElement('canvas');
    canvas.width = currentSettings.width;
    canvas.height = currentSettings.height;
    const ctx = canvas.getContext('2d');
    
    const img = new Image();
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    img.onload = () => {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob((blob) => {
        const pngUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = pngUrl;
        link.download = `${selectedPattern}-pattern.png`;
        link.click();
        URL.revokeObjectURL(pngUrl);
        URL.revokeObjectURL(url);
      });
    };
    
    img.src = url;
  };

  const renderControls = () => {
    switch (selectedPattern) {
      case 'wave':
        return (
          <>
            <div className="control-group">
              <label>Amplitude</label>
              <div className="slider-container">
                <div className="slider-icon"></div>
                <input
                  type="range"
                  min="20"
                  max="200"
                  value={currentSettings.amplitude}
                  onChange={(e) => updateSetting('amplitude', e.target.value)}
                />
                <div className="slider-icon"></div>
              </div>
            </div>
            <div className="control-group">
              <label>Frequency</label>
              <div className="slider-container">
                <div className="slider-icon"></div>
                <input
                  type="range"
                  min="0.5"
                  max="10"
                  step="0.5"
                  value={currentSettings.frequency}
                  onChange={(e) => updateSetting('frequency', e.target.value)}
                />
                <div className="slider-icon"></div>
              </div>
            </div>
            <div className="control-group">
              <label>Stroke width</label>
              <div className="slider-container">
                <div className="slider-icon"></div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={currentSettings.strokeWidth}
                  onChange={(e) => updateSetting('strokeWidth', e.target.value)}
                />
                <div className="slider-icon"></div>
              </div>
            </div>
            <div className="control-group">
              <label>Layers</label>
              <div className="slider-container">
                <div className="slider-icon"></div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={currentSettings.layers}
                  onChange={(e) => updateSetting('layers', e.target.value)}
                />
                <div className="slider-icon"></div>
              </div>
            </div>
            <div className="control-group">
              <label>Opacity</label>
              <div className="slider-container">
                <div className="slider-icon"></div>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={currentSettings.opacity}
                  onChange={(e) => updateSetting('opacity', e.target.value)}
                />
                <div className="slider-icon"></div>
              </div>
            </div>
          </>
        );
      
      case 'blob':
        return (
          <>
            <div className="control-group">
              <label>Blob count</label>
              <div className="slider-container">
                <div className="slider-icon"></div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={currentSettings.blobCount}
                  onChange={(e) => updateSetting('blobCount', e.target.value)}
                />
                <div className="slider-icon"></div>
              </div>
            </div>
            <div className="control-group">
              <label>Size</label>
              <div className="slider-container">
                <div className="slider-icon"></div>
                <input
                  type="range"
                  min="30"
                  max="150"
                  value={currentSettings.size}
                  onChange={(e) => updateSetting('size', e.target.value)}
                />
                <div className="slider-icon"></div>
              </div>
            </div>
            <div className="control-group">
              <label>Complexity</label>
              <div className="slider-container">
                <div className="slider-icon"></div>
                <input
                  type="range"
                  min="4"
                  max="16"
                  value={currentSettings.complexity}
                  onChange={(e) => updateSetting('complexity', e.target.value)}
                />
                <div className="slider-icon"></div>
              </div>
            </div>
            <div className="control-group">
              <label>Opacity</label>
              <div className="slider-container">
                <div className="slider-icon"></div>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={currentSettings.opacity}
                  onChange={(e) => updateSetting('opacity', e.target.value)}
                />
                <div className="slider-icon"></div>
              </div>
            </div>
          </>
        );
      
      case 'circleScatter':
        return (
          <>
            <div className="control-group">
              <label>Circle count</label>
              <div className="slider-container">
                <div className="slider-icon"></div>
                <input
                  type="range"
                  min="10"
                  max="200"
                  value={currentSettings.circleCount}
                  onChange={(e) => updateSetting('circleCount', e.target.value)}
                />
                <div className="slider-icon"></div>
              </div>
            </div>
            <div className="control-group">
              <label>Min radius</label>
              <div className="slider-container">
                <div className="slider-icon"></div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={currentSettings.minRadius}
                  onChange={(e) => updateSetting('minRadius', e.target.value)}
                />
                <div className="slider-icon"></div>
              </div>
            </div>
            <div className="control-group">
              <label>Max radius</label>
              <div className="slider-container">
                <div className="slider-icon"></div>
                <input
                  type="range"
                  min="20"
                  max="150"
                  value={currentSettings.maxRadius}
                  onChange={(e) => updateSetting('maxRadius', e.target.value)}
                />
                <div className="slider-icon"></div>
              </div>
            </div>
            <div className="control-group">
              <label>Stroke width</label>
              <div className="slider-container">
                <div className="slider-icon"></div>
                <input
                  type="range"
                  min="1"
                  max="8"
                  value={currentSettings.strokeWidth}
                  onChange={(e) => updateSetting('strokeWidth', e.target.value)}
                />
                <div className="slider-icon"></div>
              </div>
            </div>
            <div className="control-group">
              <label>Opacity</label>
              <div className="slider-container">
                <div className="slider-icon"></div>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={currentSettings.opacity}
                  onChange={(e) => updateSetting('opacity', e.target.value)}
                />
                <div className="slider-icon"></div>
              </div>
            </div>
          </>
        );
      
      case 'layeredWaves':
        return (
          <>
            <div className="control-group">
              <label>Layers</label>
              <div className="slider-container">
                <div className="slider-icon"></div>
                <input
                  type="range"
                  min="3"
                  max="15"
                  value={currentSettings.layers}
                  onChange={(e) => updateSetting('layers', e.target.value)}
                />
                <div className="slider-icon"></div>
              </div>
            </div>
            <div className="control-group">
              <label>Amplitude</label>
              <div className="slider-container">
                <div className="slider-icon"></div>
                <input
                  type="range"
                  min="20"
                  max="150"
                  value={currentSettings.amplitude}
                  onChange={(e) => updateSetting('amplitude', e.target.value)}
                />
                <div className="slider-icon"></div>
              </div>
            </div>
            <div className="control-group">
              <label>Frequency</label>
              <div className="slider-container">
                <div className="slider-icon"></div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={currentSettings.frequency}
                  onChange={(e) => updateSetting('frequency', e.target.value)}
                />
                <div className="slider-icon"></div>
              </div>
            </div>
            <div className="control-group">
              <label>Opacity</label>
              <div className="slider-container">
                <div className="slider-icon"></div>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={currentSettings.opacity}
                  onChange={(e) => updateSetting('opacity', e.target.value)}
                />
                <div className="slider-icon"></div>
              </div>
            </div>
          </>
        );
      
      case 'stackedSteps':
        return (
          <>
            <div className="control-group">
              <label>Steps</label>
              <div className="slider-container">
                <div className="slider-icon"></div>
                <input
                  type="range"
                  min="3"
                  max="20"
                  value={currentSettings.steps}
                  onChange={(e) => updateSetting('steps', e.target.value)}
                />
                <div className="slider-icon"></div>
              </div>
            </div>
            <div className="control-group">
              <label>Step height</label>
              <div className="slider-container">
                <div className="slider-icon"></div>
                <input
                  type="range"
                  min="30"
                  max="150"
                  value={currentSettings.stepHeight}
                  onChange={(e) => updateSetting('stepHeight', e.target.value)}
                />
                <div className="slider-icon"></div>
              </div>
            </div>
            <div className="control-group">
              <label>Spacing</label>
              <div className="slider-container">
                <div className="slider-icon"></div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={currentSettings.spacing}
                  onChange={(e) => updateSetting('spacing', e.target.value)}
                />
                <div className="slider-icon"></div>
              </div>
            </div>
            <div className="control-group">
              <label>Opacity</label>
              <div className="slider-container">
                <div className="slider-icon"></div>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={currentSettings.opacity}
                  onChange={(e) => updateSetting('opacity', e.target.value)}
                />
                <div className="slider-icon"></div>
              </div>
            </div>
          </>
        );
      
      case 'islamicPattern':
        return (
          <>
            <div className="control-group">
              <label>Grid size</label>
              <div className="slider-container">
                <div className="slider-icon"></div>
                <input
                  type="range"
                  min="4"
                  max="16"
                  value={currentSettings.gridSize}
                  onChange={(e) => updateSetting('gridSize', e.target.value)}
                />
                <div className="slider-icon"></div>
              </div>
            </div>
            <div className="control-group">
              <label>Complexity</label>
              <div className="slider-container">
                <div className="slider-icon"></div>
                <input
                  type="range"
                  min="4"
                  max="12"
                  value={currentSettings.complexity}
                  onChange={(e) => updateSetting('complexity', e.target.value)}
                />
                <div className="slider-icon"></div>
              </div>
            </div>
            <div className="control-group">
              <label>Stroke width</label>
              <div className="slider-container">
                <div className="slider-icon"></div>
                <input
                  type="range"
                  min="1"
                  max="6"
                  value={currentSettings.strokeWidth}
                  onChange={(e) => updateSetting('strokeWidth', e.target.value)}
                />
                <div className="slider-icon"></div>
              </div>
            </div>
            <div className="control-group">
              <label>Opacity</label>
              <div className="slider-container">
                <div className="slider-icon"></div>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={currentSettings.opacity}
                  onChange={(e) => updateSetting('opacity', e.target.value)}
                />
                <div className="slider-icon"></div>
              </div>
            </div>
          </>
        );
      
      case 'floralPattern':
        return (
          <>
            <div className="control-group">
              <label>Flower count</label>
              <div className="slider-container">
                <div className="slider-icon"></div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={currentSettings.flowerCount}
                  onChange={(e) => updateSetting('flowerCount', e.target.value)}
                />
                <div className="slider-icon"></div>
              </div>
            </div>
            <div className="control-group">
              <label>Petal count</label>
              <div className="slider-container">
                <div className="slider-icon"></div>
                <input
                  type="range"
                  min="4"
                  max="12"
                  value={currentSettings.petalCount}
                  onChange={(e) => updateSetting('petalCount', e.target.value)}
                />
                <div className="slider-icon"></div>
              </div>
            </div>
            <div className="control-group">
              <label>Size</label>
              <div className="slider-container">
                <div className="slider-icon"></div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={currentSettings.size}
                  onChange={(e) => updateSetting('size', e.target.value)}
                />
                <div className="slider-icon"></div>
              </div>
            </div>
            <div className="control-group">
              <label>Opacity</label>
              <div className="slider-container">
                <div className="slider-icon"></div>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={currentSettings.opacity}
                  onChange={(e) => updateSetting('opacity', e.target.value)}
                />
                <div className="slider-icon"></div>
              </div>
            </div>
          </>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="app">
      <div className="canvas-container">
        <div className="app-header">
          <h1>WAVER</h1>
        </div>
        <div className="canvas-wrapper">
          <svg
            ref={svgRef}
            width={currentSettings.width}
            height={currentSettings.height}
            xmlns="http://www.w3.org/2000/svg"
            dangerouslySetInnerHTML={{ __html: generatePattern() }}
          />
        </div>
      </div>

      <div className="side-panel">
        <div className="panel-section">
          <h2>Pattern Type</h2>
          <div className="pattern-grid">
            {patternTypes.map(pattern => (
              <button
                key={pattern.id}
                className={`pattern-button ${selectedPattern === pattern.id ? 'active' : ''}`}
                onClick={() => setSelectedPattern(pattern.id)}
              >
                {pattern.name}
              </button>
            ))}
          </div>
        </div>

        <div className="panel-section">
          <h2>Canvas Size</h2>
          <div className="size-inputs">
            <div className="input-with-label">
              <span className="input-marker">W</span>
              <input
                type="number"
                className="size-input"
                value={currentSettings.width}
                onChange={(e) => updateSetting('width', e.target.value)}
                min="100"
                max="4000"
              />
            </div>
            <div className="input-with-label">
              <span className="input-marker">H</span>
              <input
                type="number"
                className="size-input"
                value={currentSettings.height}
                onChange={(e) => updateSetting('height', e.target.value)}
                min="100"
                max="4000"
              />
            </div>
          </div>
        </div>

        <div className="panel-section">
          <h2>Pattern Settings</h2>
          {renderControls()}
        </div>

        <div className="panel-section">
          <h2>Export</h2>
          <div className="export-buttons">
            <button className="export-button" onClick={exportSVG}>
              Export as SVG
            </button>
            <button className="export-button" onClick={exportPNG}>
              Export as PNG
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;


