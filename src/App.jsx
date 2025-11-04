import { useState, useRef, useEffect } from 'react';
import './App.css';
import CustomColorPicker from './CustomColorPicker';
import { generateWave } from './patternGenerators';

const defaultSettings = {
  wave: {
    width: 1280,
    height: 1040,
    amplitude: 80,
    frequency: 2,
    strokeWidth: 3,
    color: '#667eea',
    opacity: 0.8,
    layers: 5,
    verticalOffset: 0
  }
};

function App() {
  const [selectedPattern, setSelectedPattern] = useState('wave');
  const [settings, setSettings] = useState(defaultSettings);
  const [backgroundColor, setBackgroundColor] = useState('002233');
  const [fillColor, setFillColor] = useState('0066FF');
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [initialOffset, setInitialOffset] = useState(0);
  const [includeBackground, setIncludeBackground] = useState(true);
  const [wavePhaseOffsets, setWavePhaseOffsets] = useState([]);
  const svgRef = useRef(null);

  const currentSettings = settings[selectedPattern];

  // Generate phase offsets when wave settings change (but not when just dragging)
  useEffect(() => {
    const layers = currentSettings.layers || 5;
    const newPhaseOffsets = Array.from({ length: layers }, () => Math.random() * Math.PI * 2);
    setWavePhaseOffsets(newPhaseOffsets);
  }, [
    currentSettings.amplitude,
    currentSettings.frequency,
    currentSettings.strokeWidth,
    currentSettings.layers
    // Note: verticalOffset is NOT in the dependency array
  ]);

  const updateSetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [selectedPattern]: {
        ...prev[selectedPattern],
        [key]: parseFloat(value) || value
      }
    }));
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStartY(e.clientY);
    setInitialOffset(currentSettings.verticalOffset || 0);
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      const deltaY = e.clientY - dragStartY;
      const newOffset = initialOffset + deltaY;
      updateSetting('verticalOffset', newOffset);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const generatePattern = () => {
    const patternSettings = { 
      ...currentSettings,
      color: `#${fillColor}`
    };
    
    const pattern = generateWave(patternSettings, wavePhaseOffsets);
    
    // Add background rectangle if enabled
    const background = includeBackground ? `<rect width="100%" height="100%" fill="#${backgroundColor}"/>` : '';
    return background + pattern;
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
      if (includeBackground) {
        ctx.fillStyle = `#${backgroundColor}`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
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
    return (
      <>
        <div className="control-group">
          <label>Layers</label>
          <div className="layers-grid">
            {[1, 2, 3, 4, 5].map(layerNum => (
              <button
                key={layerNum}
                className={`pattern-button ${currentSettings.layers === layerNum ? 'active' : ''}`}
                onClick={() => updateSetting('layers', layerNum)}
              >
                {layerNum}
              </button>
            ))}
          </div>
        </div>
        <div className="control-group">
          <label>Amplitude</label>
          <div className="slider-container">
            <div className="slider-icon">
              <svg width="20" height="20" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16.5 60C16.5 60 29.1998 68 38.25 68C47.3002 68 52 64.5 60 60C68 55.5 72.6998 52 81.75 52C90.8002 52 103.5 60 103.5 60" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="5" strokeLinecap="round"/>
              </svg>
            </div>
            <input
              type="range"
              min="20"
              max="120"
              value={currentSettings.amplitude}
              onChange={(e) => updateSetting('amplitude', e.target.value)}
            />
            <div className="slider-icon">
              <svg width="20" height="20" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16.5 60C16.5 60 27.5 92 38.25 92C49 92 56.5 70 60 60C63.5 50 71.5 28 81.75 28C92 28 103.5 60 103.5 60" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="5" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
        </div>
        <div className="control-group">
          <label>Frequency</label>
          <div className="slider-container">
            <div className="slider-icon">
              <svg width="20" height="20" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16.5 60C16.5 60 29.25 59.5 38.5 61.5C47.75 63.5001 50 67 60 67C70 67 71.75 63.5 82 61.5C92.25 59.5 103.5 60 103.5 60" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="5" strokeLinecap="round"/>
              </svg>
            </div>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.5"
              value={currentSettings.frequency}
              onChange={(e) => updateSetting('frequency', e.target.value)}
            />
            <div className="slider-icon">
              <svg width="20" height="20" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M104 76C104 76 96.0875 71 93.0625 60C91 52.5 89.6938 44 82.125 44C74.5562 44 71.1875 60 71.1875 60C71.1875 60 67.8188 76 60.25 76C52.6812 76 49.3125 60 49.3125 60C49.3125 60 45.9438 44 38.375 44C30.8062 44 29.5 53 27.4375 60C24.0491 71.5 16.5 76 16.5 76" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="5" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
        </div>
        <div className="control-group">
          <label>Width</label>
          <div className="slider-container">
            <div className="slider-icon">
              <svg width="20" height="20" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16.5 60C16.5 60 29.1998 68 38.25 68C47.3002 68 52 64.5 60 60C68 55.5 72.6998 52 81.75 52C90.8002 52 103.5 60 103.5 60" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="5" strokeLinecap="round"/>
              </svg>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={currentSettings.strokeWidth}
              onChange={(e) => updateSetting('strokeWidth', e.target.value)}
            />
            <div className="slider-icon">
              <svg width="20" height="20" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16.5 60C16.5 60 29.1998 68 38.25 68C47.3002 68 52 64.5 60 60C68 55.5 72.6998 52 81.75 52C90.8002 52 103.5 60 103.5 60" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="20" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="app">
      <div className="canvas-container">
        <div className="app-header">
          <h1>WAVER</h1>
        </div>
        <div 
          className="canvas-wrapper"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          <svg
            key={`wave-${currentSettings.layers}`}
            ref={svgRef}
            width={currentSettings.width}
            height={currentSettings.height}
            xmlns="http://www.w3.org/2000/svg"
            dangerouslySetInnerHTML={{ __html: generatePattern() }}
          />
        </div>
      </div>

      <div className="side-panel">
        <div className="panel-content">
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
          <h2>Color</h2>
          <div className="color-inputs">
            <CustomColorPicker
              label="Background"
              color={backgroundColor}
              onChange={setBackgroundColor}
              showEyeToggle={true}
              isVisible={includeBackground}
              onToggleVisibility={() => setIncludeBackground(!includeBackground)}
            />
            <CustomColorPicker
              label="Fill"
              color={fillColor}
              onChange={setFillColor}
            />
          </div>
        </div>

          <div className="panel-section">
            <h2>Settings</h2>
            {renderControls()}
          </div>
        </div>

        <div className="panel-footer">
          <div className="panel-section">
            <h2>Export</h2>
            <div className="export-buttons">
              <button className="export-button" onClick={exportSVG}>
                SVG
              </button>
              <button className="export-button export-button-secondary" onClick={exportPNG}>
                PNG
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;


