import { useState, useRef, useEffect } from 'react';
import './App.css';
import CustomColorPicker from './CustomColorPicker';
import { generateWave } from './patternGenerators';

const defaultSettings = {
  wave: {
    width: 1280,
    height: 1040,
    amplitude: 150,
    frequency: 2,
    strokeWidth: 1.2,
    color: '#000000',
    opacity: 1.0,
    layers: 25,
    verticalOffset: 0,
    horizontalOffset: 0,
    patternHeight: 1040  // Reference height for pattern generation
  }
};

function App() {
  const [selectedPattern, setSelectedPattern] = useState('wave');
  const [settings, setSettings] = useState(defaultSettings);
  const [backgroundColor, setBackgroundColor] = useState('F5F5F0');
  const [fillColor, setFillColor] = useState('000000');
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartY, setDragStartY] = useState(0);
  const [initialVerticalOffset, setInitialVerticalOffset] = useState(0);
  const [initialHorizontalOffset, setInitialHorizontalOffset] = useState(0);
  const [includeBackground, setIncludeBackground] = useState(true);
  const [wavePhaseOffsets, setWavePhaseOffsets] = useState([]);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [customPath, setCustomPath] = useState([]);
  const [useCustomPath, setUseCustomPath] = useState(false);
  const [showDrawnLine, setShowDrawnLine] = useState(true);
  const [rotation, setRotation] = useState(0);
  const svgRef = useRef(null);
  const canvasRef = useRef(null);

  const currentSettings = settings[selectedPattern];

  // Generate phase offsets when wave settings change (but not when just dragging)
  useEffect(() => {
    const layers = currentSettings.layers || 25;
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
    if (isDrawingMode) {
      setIsDrawing(true);
      setCustomPath([]);
      const rect = canvasRef.current.getBoundingClientRect();
      const scaleX = currentSettings.width / rect.width;
      const scaleY = currentSettings.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;
      setCustomPath([{ x, y }]);
    } else {
      setIsDragging(true);
      setDragStartX(e.clientX);
      setDragStartY(e.clientY);
      setInitialVerticalOffset(currentSettings.verticalOffset || 0);
      setInitialHorizontalOffset(currentSettings.horizontalOffset || 0);
    }
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (isDrawingMode && isDrawing) {
      const rect = canvasRef.current.getBoundingClientRect();
      const scaleX = currentSettings.width / rect.width;
      const scaleY = currentSettings.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;
      
      // Only add point if it's far enough from the last point (reduces jitter)
      setCustomPath(prev => {
        if (prev.length === 0) return [{ x, y }];
        
        const lastPoint = prev[prev.length - 1];
        const distance = Math.sqrt(Math.pow(x - lastPoint.x, 2) + Math.pow(y - lastPoint.y, 2));
        
        // Only add point if moved at least 3 pixels
        if (distance >= 3) {
          return [...prev, { x, y }];
        }
        return prev;
      });
    } else if (isDragging) {
      const deltaX = e.clientX - dragStartX;
      const deltaY = e.clientY - dragStartY;
      const newVerticalOffset = initialVerticalOffset + deltaY;
      const newHorizontalOffset = initialHorizontalOffset + deltaX;
      
      // Update both offsets at once
      setSettings(prev => ({
        ...prev,
        [selectedPattern]: {
          ...prev[selectedPattern],
          verticalOffset: newVerticalOffset,
          horizontalOffset: newHorizontalOffset
        }
      }));
    }
  };

  const handleMouseUp = () => {
    if (isDrawingMode && isDrawing) {
      setIsDrawing(false);
      if (customPath.length > 5) {
        setUseCustomPath(true);
      }
    } else {
      setIsDragging(false);
    }
  };

  const handleClearPath = () => {
    setCustomPath([]);
    setUseCustomPath(false);
    setShowDrawnLine(true); // Reset to show by default
  };

  const toggleDrawingMode = () => {
    const newDrawingMode = !isDrawingMode;
    setIsDrawingMode(newDrawingMode);
    
    if (newDrawingMode) {
      // Entering drawing mode - clear everything for blank canvas
      setCustomPath([]);
      setUseCustomPath(false);
      setShowDrawnLine(true); // Reset to show by default
    } else {
      // Exiting drawing mode - if no path was drawn, return to default pattern
      if (customPath.length === 0) {
        setUseCustomPath(false);
      }
    }
  };

  const rotatePattern = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const generatePattern = () => {
    // If in drawing mode and no custom path yet, return empty (background is rendered separately)
    if (isDrawingMode && !useCustomPath) {
      return '';
    }
    
    const patternSettings = { 
      ...currentSettings,
      color: `#${fillColor}`,
      customPath: useCustomPath ? customPath : null
    };
    
    const pattern = generateWave(patternSettings, wavePhaseOffsets);
    
    return pattern;
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
          <label>Layers: {currentSettings.layers}</label>
          <div className="slider-container">
            <div className="slider-icon"></div>
            <input
              type="range"
              min="5"
              max="60"
              step="1"
              value={currentSettings.layers}
              onChange={(e) => updateSetting('layers', e.target.value)}
            />
            <div className="slider-icon"></div>
          </div>
        </div>
        <div className="control-group">
          <label>Amplitude: {currentSettings.amplitude}</label>
          <div className="slider-container">
            <div className="slider-icon">
              <svg width="20" height="20" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16.5 60C16.5 60 29.1998 68 38.25 68C47.3002 68 52 64.5 60 60C68 55.5 72.6998 52 81.75 52C90.8002 52 103.5 60 103.5 60" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="5" strokeLinecap="round"/>
              </svg>
            </div>
            <input
              type="range"
              min="50"
              max="300"
              step="10"
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
          <label>Frequency: {currentSettings.frequency}</label>
          <div className="slider-container">
            <div className="slider-icon">
              <svg width="20" height="20" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16.5 60C16.5 60 29.25 59.5 38.5 61.5C47.75 63.5001 50 67 60 67C70 67 71.75 63.5 82 61.5C92.25 59.5 103.5 60 103.5 60" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="5" strokeLinecap="round"/>
              </svg>
            </div>
            <input
              type="range"
              min="1"
              max="5"
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
          <label>Width: {currentSettings.strokeWidth}</label>
          <div className="slider-container">
            <div className="slider-icon">
              <svg width="20" height="20" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16.5 60C16.5 60 29.1998 68 38.25 68C47.3002 68 52 64.5 60 60C68 55.5 72.6998 52 81.75 52C90.8002 52 103.5 60 103.5 60" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <input
              type="range"
              min="0.1"
              max="5"
              step="0.1"
              value={currentSettings.strokeWidth}
              onChange={(e) => updateSetting('strokeWidth', e.target.value)}
            />
            <div className="slider-icon">
              <svg width="20" height="20" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16.5 60C16.5 60 29.1998 68 38.25 68C47.3002 68 52 64.5 60 60C68 55.5 72.6998 52 81.75 52C90.8002 52 103.5 60 103.5 60" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="12" strokeLinecap="round"/>
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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', maxWidth: '100%', maxHeight: '100%' }}>
          <div 
            className="canvas-wrapper-scaled"
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ 
              cursor: isDrawingMode ? 'crosshair' : (isDragging ? 'grabbing' : 'grab'),
              position: 'relative',
              maxWidth: 'calc(100vw - 360px - 120px)',
              maxHeight: 'calc(100vh - 180px)',
              width: currentSettings.width,
              height: currentSettings.height
            }}
          >
            <svg
              key={`wave-${currentSettings.layers}-${rotation}`}
              ref={svgRef}
              width={currentSettings.width}
              height={currentSettings.height}
              xmlns="http://www.w3.org/2000/svg"
            >
              {includeBackground && (
                <rect width="100%" height="100%" fill={`#${backgroundColor}`} />
              )}
              <g transform={`rotate(${rotation} ${currentSettings.width / 2} ${currentSettings.height / 2})`}>
                <g dangerouslySetInnerHTML={{ __html: generatePattern() }} />
              </g>
            </svg>
            {isDrawingMode && customPath.length > 0 && showDrawnLine && (
              <svg
                viewBox={`0 0 ${currentSettings.width} ${currentSettings.height}`}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none',
                  zIndex: 10
                }}
              >
                <path
                  d={`M ${customPath.map(p => `${p.x} ${p.y}`).join(' L ')}`}
                  stroke="#FF0000"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
          
          <div className="floating-toolbar">
            <button 
              className="toolbar-button"
              onClick={rotatePattern}
              title="Rotate 90°"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 12C21 16.9706 16.9706 21 12 21C9.69494 21 7.59227 20.1334 6 18.7083L3 16M3 12C3 7.02944 7.02944 3 12 3C14.3051 3 16.4077 3.86656 18 5.29168L21 8M21 3V8M21 8H16M3 21V16M3 16H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Rotate</span>
            </button>
            
            <button 
              className={`toolbar-button ${isDrawingMode ? 'active' : ''}`}
              onClick={toggleDrawingMode}
              title={isDrawingMode ? 'Exit Drawing Mode' : 'Draw Path'}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 19L19 12L22 15L15 22L12 19ZM8.5 13.5L4 9L15 3L21 9L15 15M4.5 16.5L9 21M3.5 22.5L6.5 19.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>{isDrawingMode ? 'Exit Drawing' : 'Draw Path'}</span>
            </button>

            {customPath.length > 0 && (
              <>
                <button 
                  className="toolbar-button secondary"
                  onClick={handleClearPath}
                  title="Clear Path"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Clear</span>
                </button>
                <button 
                  className="toolbar-button secondary"
                  onClick={() => setShowDrawnLine(!showDrawnLine)}
                  title={showDrawnLine ? 'Hide drawn line' : 'Show drawn line'}
                >
                  {showDrawnLine ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20C5 20 1 12 1 12C1 12 3.35 7.82 7.35 5.38M9.9 4.24A9.12 9.12 0 0 1 12 4C19 4 23 12 23 12C23 12 21.72 14.36 19.68 16.5M14.12 14.12A3 3 0 1 1 9.88 9.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  )}
                  <span>{showDrawnLine ? 'Hide' : 'Show'}</span>
                </button>
              </>
            )}
          </div>
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


