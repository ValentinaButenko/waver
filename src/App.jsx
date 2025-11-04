import { useState, useRef, useEffect } from 'react';
import './App.css';
import CustomColorPicker from './CustomColorPicker';
import { generateWave } from './patternGenerators';
import { ArrowsCounterClockwise, MagnifyingGlassPlus, MagnifyingGlassMinus, MagicWand, Eraser, PenNib } from 'phosphor-react';
import DrawIcon from './draw.svg?raw';

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
    horizontalOffset: 0
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
  const [patternScale, setPatternScale] = useState(1);
  const [hasDrawnInCurrentSession, setHasDrawnInCurrentSession] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [draggingNodeIndex, setDraggingNodeIndex] = useState(null);
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
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = currentSettings.width / rect.width;
    const scaleY = currentSettings.height / rect.height;
    let mouseX = (e.clientX - rect.left) * scaleX;
    let mouseY = (e.clientY - rect.top) * scaleY;

    if (isDrawingMode && isEditMode && customPath.length > 0) {
      // Apply inverse transformation to mouse coordinates to match node space
      const centerX = currentSettings.width / 2;
      const centerY = currentSettings.height / 2;
      
      // Translate to origin
      mouseX -= centerX;
      mouseY -= centerY;
      
      // Apply inverse rotation
      const rotationRad = (-rotation * Math.PI) / 180;
      const rotatedX = mouseX * Math.cos(rotationRad) - mouseY * Math.sin(rotationRad);
      const rotatedY = mouseX * Math.sin(rotationRad) + mouseY * Math.cos(rotationRad);
      
      // Apply inverse scale
      const scaledX = rotatedX / patternScale;
      const scaledY = rotatedY / patternScale;
      
      // Translate back
      const transformedX = scaledX + centerX;
      const transformedY = scaledY + centerY;
      
      // Check if clicking on a node (account for offsets)
      const nodeRadius = 10;
      const clickedNodeIndex = customPath.findIndex((point) => {
        const offsetX = point.x + (currentSettings.horizontalOffset || 0);
        const offsetY = point.y + (currentSettings.verticalOffset || 0);
        const dx = offsetX - transformedX;
        const dy = offsetY - transformedY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= nodeRadius;
      });

      if (clickedNodeIndex !== -1) {
        // Start dragging a node
        setDraggingNodeIndex(clickedNodeIndex);
      } else {
        // No node clicked, start dragging the pattern
        setIsDragging(true);
        setDragStartX(e.clientX);
        setDragStartY(e.clientY);
        setInitialVerticalOffset(currentSettings.verticalOffset || 0);
        setInitialHorizontalOffset(currentSettings.horizontalOffset || 0);
      }
    } else if (isDrawingMode && !isEditMode && customPath.length === 0) {
      // First time drawing or no existing path
      setIsDrawing(true);
      setCustomPath([]);
      setUseCustomPath(false);
      setHasDrawnInCurrentSession(true);
      const x = mouseX;
      const y = mouseY;
      setCustomPath([{ x, y }]);
    } else if (isDrawingMode && !isEditMode && customPath.length > 0) {
      // Drawing mode with existing pattern - allow dragging
      setIsDragging(true);
      setDragStartX(e.clientX);
      setDragStartY(e.clientY);
      setInitialVerticalOffset(currentSettings.verticalOffset || 0);
      setInitialHorizontalOffset(currentSettings.horizontalOffset || 0);
    } else if (!isDrawingMode) {
      // Generation mode - allow dragging
      setIsDragging(true);
      setDragStartX(e.clientX);
      setDragStartY(e.clientY);
      setInitialVerticalOffset(currentSettings.verticalOffset || 0);
      setInitialHorizontalOffset(currentSettings.horizontalOffset || 0);
    }
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = currentSettings.width / rect.width;
    const scaleY = currentSettings.height / rect.height;
    let mouseX = (e.clientX - rect.left) * scaleX;
    let mouseY = (e.clientY - rect.top) * scaleY;

    if (draggingNodeIndex !== null) {
      // Apply inverse transformation to mouse coordinates to match node space
      const centerX = currentSettings.width / 2;
      const centerY = currentSettings.height / 2;
      
      // Translate to origin
      mouseX -= centerX;
      mouseY -= centerY;
      
      // Apply inverse rotation
      const rotationRad = (-rotation * Math.PI) / 180;
      const rotatedX = mouseX * Math.cos(rotationRad) - mouseY * Math.sin(rotationRad);
      const rotatedY = mouseX * Math.sin(rotationRad) + mouseY * Math.cos(rotationRad);
      
      // Apply inverse scale
      const scaledX = rotatedX / patternScale;
      const scaledY = rotatedY / patternScale;
      
      // Translate back
      const transformedX = scaledX + centerX;
      const transformedY = scaledY + centerY;
      
      // Update the position of the dragged node (remove offset to store original position)
      setCustomPath(prev => {
        const newPath = [...prev];
        newPath[draggingNodeIndex] = { 
          x: transformedX - (currentSettings.horizontalOffset || 0), 
          y: transformedY - (currentSettings.verticalOffset || 0) 
        };
        return newPath;
      });
    } else if (isDrawingMode && isDrawing) {
      const x = mouseX;
      const y = mouseY;
      
      // Only add point if it's far enough from the last point (reduces jitter)
      setCustomPath(prev => {
        if (prev.length === 0) return [{ x, y }];
        
        const lastPoint = prev[prev.length - 1];
        const distance = Math.sqrt(Math.pow(x - lastPoint.x, 2) + Math.pow(y - lastPoint.y, 2));
        
        // Only add point if moved at least 3 pixels
        if (distance >= 3) {
          const newPath = [...prev, { x, y }];
          
          // Enable real-time pattern rendering once we have enough points
          if (newPath.length > 10 && !useCustomPath) {
            setUseCustomPath(true);
          }
          
          return newPath;
        }
        return prev;
      });
    } else if (isDragging) {
      // Get the scale factor to convert screen space to canvas space
      const rect = canvasRef.current.getBoundingClientRect();
      const scaleX = currentSettings.width / rect.width;
      const scaleY = currentSettings.height / rect.height;
      
      // Get screen space deltas
      const screenDeltaX = (e.clientX - dragStartX) * scaleX;
      const screenDeltaY = (e.clientY - dragStartY) * scaleY;
      
      // Apply inverse rotation to deltas so drag feels natural even when pattern is rotated
      const rotationRad = (-rotation * Math.PI) / 180; // Negative for inverse rotation
      const deltaX = screenDeltaX * Math.cos(rotationRad) - screenDeltaY * Math.sin(rotationRad);
      const deltaY = screenDeltaX * Math.sin(rotationRad) + screenDeltaY * Math.cos(rotationRad);
      
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
    if (draggingNodeIndex !== null) {
      setDraggingNodeIndex(null);
    } else if (isDrawingMode && isDrawing) {
      setIsDrawing(false);
      // Keep the pattern visible even if path is short
      if (customPath.length > 0) {
        setUseCustomPath(true);
        setShowDrawnLine(false); // Hide the red line, show only the pattern
      }
    } else {
      setIsDragging(false);
    }
  };

  const handleClearPath = () => {
    setCustomPath([]);
    setUseCustomPath(false);
    setShowDrawnLine(false);
    setHasDrawnInCurrentSession(false);
    setIsEditMode(false);
    setDraggingNodeIndex(null);
  };

  const toggleEditMode = () => {
    setIsEditMode((prev) => {
      const newEditMode = !prev;
      if (newEditMode) {
        // Entering edit mode, show the red line for reference
        setShowDrawnLine(true);
      } else {
        // Exiting edit mode, hide the red line and reset dragging
        setShowDrawnLine(false);
        setDraggingNodeIndex(null);
      }
      return newEditMode;
    });
  };

  const switchToGenerationMode = () => {
    setIsDrawingMode(false);
    setUseCustomPath(false); // Always show generation pattern
    setHasDrawnInCurrentSession(false); // Reset session flag when switching modes
    setIsEditMode(false); // Exit edit mode
    setDraggingNodeIndex(null);
  };

  const switchToDrawingMode = () => {
    setIsDrawingMode(true);
    setHasDrawnInCurrentSession(false); // Reset session flag when entering drawing mode
    setIsEditMode(false); // Start with edit mode off
    setDraggingNodeIndex(null);
    
    // If there's an existing custom path, show it
    if (customPath.length > 0) {
      setUseCustomPath(true);
      setShowDrawnLine(false); // Show only pattern, not the red line
    } else {
      // No previous drawing - show blank canvas
      setUseCustomPath(false);
    }
  };

  const rotatePattern = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleZoomIn = () => {
    setPatternScale((prev) => Math.min(prev * 1.1, 3));
  };

  const handleZoomOut = () => {
    setPatternScale((prev) => Math.max(prev * 0.9, 0.3));
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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', maxWidth: '100%', maxHeight: '100%' }}>
          <div 
            className="canvas-wrapper-scaled"
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ 
              cursor: draggingNodeIndex !== null ? 'grabbing' : 
                      (isDrawingMode && !isEditMode && customPath.length === 0 ? 'crosshair' : 
                      (isDrawingMode && isEditMode ? 'pointer' : 
                      (isDragging ? 'grabbing' : 'grab'))),
              position: 'relative',
              maxWidth: 'calc(100vw - 360px - 120px)',
              maxHeight: 'calc(100vh - 180px)',
              width: currentSettings.width,
              height: currentSettings.height
            }}
          >
            <svg
              key={`wave-${currentSettings.layers}-${rotation}-${patternScale}`}
              ref={svgRef}
              width={currentSettings.width}
              height={currentSettings.height}
              xmlns="http://www.w3.org/2000/svg"
            >
              {includeBackground && (
                <rect width="100%" height="100%" fill={`#${backgroundColor}`} />
              )}
              <g transform={`translate(${currentSettings.width / 2} ${currentSettings.height / 2}) scale(${patternScale}) rotate(${rotation}) translate(${-currentSettings.width / 2} ${-currentSettings.height / 2})`}>
                <g dangerouslySetInnerHTML={{ __html: generatePattern() }} />
              </g>
            </svg>
            {isDrawingMode && customPath.length > 0 && (showDrawnLine || isDrawing) && (
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
                <g transform={`translate(${currentSettings.width / 2} ${currentSettings.height / 2}) scale(${patternScale}) rotate(${rotation}) translate(${-currentSettings.width / 2} ${-currentSettings.height / 2})`}>
                  <path
                    d={`M ${customPath.map(p => `${p.x + (currentSettings.horizontalOffset || 0)} ${p.y + (currentSettings.verticalOffset || 0)}`).join(' L ')}`}
                    stroke="#FF0000"
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
              </svg>
            )}
            {isDrawingMode && isEditMode && customPath.length > 0 && (
              <svg
                viewBox={`0 0 ${currentSettings.width} ${currentSettings.height}`}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none',
                  zIndex: 11
                }}
              >
                <g transform={`translate(${currentSettings.width / 2} ${currentSettings.height / 2}) scale(${patternScale}) rotate(${rotation}) translate(${-currentSettings.width / 2} ${-currentSettings.height / 2})`}>
                  {customPath.map((point, index) => (
                    <circle
                      key={index}
                      cx={point.x + (currentSettings.horizontalOffset || 0)}
                      cy={point.y + (currentSettings.verticalOffset || 0)}
                      r={6 / patternScale}
                      fill="#4DFFDF"
                      stroke="#FFFFFF"
                      strokeWidth={1.5 / patternScale}
                    />
                  ))}
                </g>
              </svg>
            )}
          </div>
          
          <div className="floating-toolbar">
            <button 
              className="toolbar-icon-button"
              onClick={rotatePattern}
              title="Rotate 90°"
            >
              <ArrowsCounterClockwise size={24} weight="regular" />
            </button>
            
            <button 
              className="toolbar-icon-button"
              onClick={handleZoomIn}
              title="Zoom In"
            >
              <MagnifyingGlassPlus size={24} weight="regular" />
            </button>
            
            <button 
              className="toolbar-icon-button"
              onClick={handleZoomOut}
              title="Zoom Out"
            >
              <MagnifyingGlassMinus size={24} weight="regular" />
            </button>
            
            <div className="toolbar-divider"></div>
            
            <div className="toolbar-segment-control">
              <button 
                className={`segment-button ${!isDrawingMode ? 'active' : ''}`}
                onClick={switchToGenerationMode}
                title="Generation Mode"
              >
                <MagicWand size={24} weight="regular" />
              </button>
              <button 
                className={`segment-button ${isDrawingMode ? 'active' : ''}`}
                onClick={switchToDrawingMode}
                title="Drawing Mode"
              >
                <div dangerouslySetInnerHTML={{ __html: DrawIcon }} />
              </button>
            </div>

            {isDrawingMode && customPath.length > 0 && (
              <>
                <div className="toolbar-divider"></div>
                
                <button 
                  className="toolbar-icon-button"
                  onClick={handleClearPath}
                  title="Erase"
                >
                  <Eraser size={24} weight="regular" />
                </button>
                
                <button 
                  className={`toolbar-icon-button ${isEditMode ? 'active-icon' : ''}`}
                  onClick={toggleEditMode}
                  title="Edit Mode"
                >
                  <PenNib size={24} weight="regular" />
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


