import { useState, useRef, useEffect } from 'react';
import './App.css';
import CustomColorPicker from './CustomColorPicker';
import { generateWave, generateNeurons, generateSpirograph } from './patternGenerators';
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
  },
  neurons: {
    width: 1280,
    height: 1040,
    strokeWidth: 1.5,
    color: '#000000',
    nodeColor: '#000000',
    opacity: 1.0,
    branches: 12,
    depth: 4,
    spread: 0.8,
    curvature: 0.3,
    nodeSize: 3,
    branchProbability: 0.7,
    verticalOffset: 0,
    horizontalOffset: 0
  },
  spirograph: {
    width: 1280,
    height: 1040,
    strokeWidth: 1,
    color: '#000000',
    opacity: 1.0,
    curves: 4,
    layers: 5,
    R: 120,
    r: 45,
    d: 80,
    rotation: 0,
    scale: 1.0,
    verticalOffset: 0,
    horizontalOffset: 0
  }
};

function App() {
  const [selectedPattern, setSelectedPattern] = useState('wave');
  const [settings, setSettings] = useState(defaultSettings);
  const [backgroundColor, setBackgroundColor] = useState({ type: 'solid', value: '161616' });
  const [fillColor, setFillColor] = useState({ type: 'solid', value: '4300B0' });
  const [nodeColor, setNodeColor] = useState({ type: 'solid', value: '4300B0' });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartY, setDragStartY] = useState(0);
  const [initialVerticalOffset, setInitialVerticalOffset] = useState(0);
  const [initialHorizontalOffset, setInitialHorizontalOffset] = useState(0);
  const [includeBackground, setIncludeBackground] = useState(true);
  const [wavePhaseOffsets, setWavePhaseOffsets] = useState([]);
  const [neuronsSeed, setNeuronsSeed] = useState(Math.random());
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [customPath, setCustomPath] = useState([]);
  const [useCustomPath, setUseCustomPath] = useState(false);
  const [showDrawnLine, setShowDrawnLine] = useState(true);
  const [rotation, setRotation] = useState({ wave: 0, neurons: 0, spirograph: 0 });
  const [patternScale, setPatternScale] = useState(1);
  const [hasDrawnInCurrentSession, setHasDrawnInCurrentSession] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [draggingNodeIndex, setDraggingNodeIndex] = useState(null);
  const [generationModeOffsets, setGenerationModeOffsets] = useState({ vertical: 0, horizontal: 0 });
  const [drawingModeOffsets, setDrawingModeOffsets] = useState({ vertical: 0, horizontal: 0 });
  const svgRef = useRef(null);
  const canvasRef = useRef(null);

  const currentSettings = settings[selectedPattern];

  // Helper function to generate SVG gradient definitions
  const generateGradientDefs = () => {
    let defs = '';
    const width = currentSettings.width;
    const height = currentSettings.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const maxDimension = Math.max(width, height);
    
    if (backgroundColor.type === 'linear' || backgroundColor.type === 'radial') {
      const stops = backgroundColor.stops.map(s => {
        const opacity = s.opacity !== undefined ? s.opacity / 100 : 1;
        return `<stop offset="${s.position}%" stop-color="#${s.color}" stop-opacity="${opacity}" />`;
      }).join('');
      if (backgroundColor.type === 'radial') {
        defs += `<radialGradient id="bg-gradient" cx="${centerX}" cy="${centerY}" r="${maxDimension / 2}" gradientUnits="userSpaceOnUse">
          ${stops}
        </radialGradient>`;
      } else {
        const angle = (backgroundColor.angle || 90) * Math.PI / 180;
        const x1 = centerX - Math.cos(angle) * maxDimension / 2;
        const y1 = centerY - Math.sin(angle) * maxDimension / 2;
        const x2 = centerX + Math.cos(angle) * maxDimension / 2;
        const y2 = centerY + Math.sin(angle) * maxDimension / 2;
        defs += `<linearGradient id="bg-gradient" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" gradientUnits="userSpaceOnUse">
          ${stops}
        </linearGradient>`;
      }
    }
    
    if (fillColor.type === 'linear' || fillColor.type === 'radial') {
      const stops = fillColor.stops.map(s => {
        const opacity = s.opacity !== undefined ? s.opacity / 100 : 1;
        return `<stop offset="${s.position}%" stop-color="#${s.color}" stop-opacity="${opacity}" />`;
      }).join('');
      if (fillColor.type === 'radial') {
        defs += `<radialGradient id="line-gradient" cx="${centerX}" cy="${centerY}" r="${maxDimension / 2}" gradientUnits="userSpaceOnUse">
          ${stops}
        </radialGradient>`;
      } else {
        const angle = (fillColor.angle || 90) * Math.PI / 180;
        const x1 = centerX - Math.cos(angle) * maxDimension / 2;
        const y1 = centerY - Math.sin(angle) * maxDimension / 2;
        const x2 = centerX + Math.cos(angle) * maxDimension / 2;
        const y2 = centerY + Math.sin(angle) * maxDimension / 2;
        defs += `<linearGradient id="line-gradient" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" gradientUnits="userSpaceOnUse">
          ${stops}
        </linearGradient>`;
      }
    }
    
    if (nodeColor.type === 'linear' || nodeColor.type === 'radial') {
      const stops = nodeColor.stops.map(s => {
        const opacity = s.opacity !== undefined ? s.opacity / 100 : 1;
        return `<stop offset="${s.position}%" stop-color="#${s.color}" stop-opacity="${opacity}" />`;
      }).join('');
      if (nodeColor.type === 'radial') {
        defs += `<radialGradient id="node-gradient" cx="${centerX}" cy="${centerY}" r="${maxDimension / 2}" gradientUnits="userSpaceOnUse">
          ${stops}
        </radialGradient>`;
      } else {
        const angle = (nodeColor.angle || 90) * Math.PI / 180;
        const x1 = centerX - Math.cos(angle) * maxDimension / 2;
        const y1 = centerY - Math.sin(angle) * maxDimension / 2;
        const x2 = centerX + Math.cos(angle) * maxDimension / 2;
        const y2 = centerY + Math.sin(angle) * maxDimension / 2;
        defs += `<linearGradient id="node-gradient" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" gradientUnits="userSpaceOnUse">
          ${stops}
        </linearGradient>`;
      }
    }
    
    return defs ? `<defs>${defs}</defs>` : '';
  };

  // Helper function to get color reference for SVG
  const getColorRef = (colorData, gradientId) => {
    if (colorData.type === 'linear' || colorData.type === 'radial') {
      return `url(#${gradientId})`;
    }
    return `#${colorData.value}`;
  };

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

  // Generate new seed when neurons settings change (but not when just dragging)
  useEffect(() => {
    if (selectedPattern === 'neurons') {
      setNeuronsSeed(Math.random());
    }
  }, [
    selectedPattern,
    currentSettings.branches,
    currentSettings.depth,
    currentSettings.spread,
    currentSettings.curvature,
    currentSettings.nodeSize,
    currentSettings.branchProbability
    // Note: verticalOffset and horizontalOffset are NOT in the dependency array
  ]);

  // Switch to generation mode when changing to patterns that don't support drawing mode
  useEffect(() => {
    if (selectedPattern !== 'wave' && isDrawingMode) {
      setIsDrawingMode(false);
      setUseCustomPath(false);
    }
  }, [selectedPattern, isDrawingMode]);

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
      
      // Apply inverse scale (no rotation since drawn line doesn't rotate)
      const scaledX = mouseX / patternScale;
      const scaledY = mouseY / patternScale;
      
      // Translate back
      const transformedX = scaledX + centerX;
      const transformedY = scaledY + centerY;
      
      // Check if clicking on a node (account for offsets)
      const nodeRadius = 10;
      const clickedNodeIndex = customPath.findIndex((point) => {
        const offsetX = point.x + drawingModeOffsets.horizontal;
        const offsetY = point.y + drawingModeOffsets.vertical;
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
        setInitialVerticalOffset(drawingModeOffsets.vertical);
        setInitialHorizontalOffset(drawingModeOffsets.horizontal);
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
      setInitialVerticalOffset(drawingModeOffsets.vertical);
      setInitialHorizontalOffset(drawingModeOffsets.horizontal);
    } else if (!isDrawingMode) {
      // Generation mode - allow dragging
      setIsDragging(true);
      setDragStartX(e.clientX);
      setDragStartY(e.clientY);
      setInitialVerticalOffset(generationModeOffsets.vertical);
      setInitialHorizontalOffset(generationModeOffsets.horizontal);
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
      
      // Apply inverse scale (no rotation since drawn line doesn't rotate)
      const scaledX = mouseX / patternScale;
      const scaledY = mouseY / patternScale;
      
      // Translate back
      const transformedX = scaledX + centerX;
      const transformedY = scaledY + centerY;
      
      // Update the position of the dragged node (remove offset to store original position)
      setCustomPath(prev => {
        const newPath = [...prev];
        newPath[draggingNodeIndex] = { 
          x: transformedX - drawingModeOffsets.horizontal, 
          y: transformedY - drawingModeOffsets.vertical 
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
      
      let deltaX = screenDeltaX;
      let deltaY = screenDeltaY;
      
      // Apply inverse rotation to deltas only if NOT in drawing mode
      // (drawn line doesn't rotate, so drag should be direct)
      if (!isDrawingMode) {
        const rotationRad = (-rotation[selectedPattern] * Math.PI) / 180;
        deltaX = screenDeltaX * Math.cos(rotationRad) - screenDeltaY * Math.sin(rotationRad);
        deltaY = screenDeltaX * Math.sin(rotationRad) + screenDeltaY * Math.cos(rotationRad);
      }
      
      const newVerticalOffset = initialVerticalOffset + deltaY;
      const newHorizontalOffset = initialHorizontalOffset + deltaX;
      
      // Update the appropriate offset state based on current mode
      if (isDrawingMode) {
        setDrawingModeOffsets({
          vertical: newVerticalOffset,
          horizontal: newHorizontalOffset
        });
      } else {
        setGenerationModeOffsets({
          vertical: newVerticalOffset,
          horizontal: newHorizontalOffset
        });
      }
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
    setRotation((prev) => ({
      ...prev,
      [selectedPattern]: (prev[selectedPattern] + 90) % 360
    }));
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
    
    // Use the appropriate offsets based on current mode
    const currentOffsets = isDrawingMode ? drawingModeOffsets : generationModeOffsets;
    
    const patternSettings = { 
      ...currentSettings,
      verticalOffset: currentOffsets.vertical,
      horizontalOffset: currentOffsets.horizontal,
      color: getColorRef(fillColor, 'line-gradient'),
      nodeColor: getColorRef(nodeColor, 'node-gradient'),
      customPath: useCustomPath ? customPath : null
    };
    
    // Call the appropriate generator based on selected pattern
    let pattern;
    if (selectedPattern === 'neurons') {
      pattern = generateNeurons(patternSettings, neuronsSeed);
    } else if (selectedPattern === 'spirograph') {
      pattern = generateSpirograph(patternSettings);
    } else {
      pattern = generateWave(patternSettings, wavePhaseOffsets);
    }
    
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
      // Background is now handled in SVG, so we can just draw the image
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
    if (selectedPattern === 'spirograph') {
      return (
        <>
          <div className="control-group">
            <label>Lines</label>
            <div className="pattern-selector single-row">
              <button className={`pattern-button ${Number(currentSettings.layers) === 2 ? 'active' : ''}`} onClick={() => updateSetting('layers', 2)}>2</button>
              <button className={`pattern-button ${Number(currentSettings.layers) === 3 ? 'active' : ''}`} onClick={() => updateSetting('layers', 3)}>3</button>
              <button className={`pattern-button ${Number(currentSettings.layers) === 4 ? 'active' : ''}`} onClick={() => updateSetting('layers', 4)}>4</button>
              <button className={`pattern-button ${Number(currentSettings.layers) === 5 ? 'active' : ''}`} onClick={() => updateSetting('layers', 5)}>5</button>
            </div>
          </div>
          <div className="control-group">
            <label>Curves</label>
            <div className="slider-container">
              <div className="slider-icon">
                <svg width="20" height="20" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="60" cy="60" r="35" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="5" fill="none"/>
                </svg>
              </div>
              <input
                type="range"
                min="3"
                max="8"
                step="1"
                value={currentSettings.curves}
                onChange={(e) => updateSetting('curves', e.target.value)}
              />
              <div className="slider-icon">
                <svg width="20" height="20" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="60" cy="60" r="10" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="5" fill="none"/>
                  <circle cx="60" cy="60" r="25" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="5" fill="none"/>
                  <circle cx="60" cy="60" r="40" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="5" fill="none"/>
                </svg>
              </div>
            </div>
          </div>
          <div className="control-group">
            <label>Fixed circle</label>
            <div className="slider-container">
              <div className="slider-icon">
                <svg width="20" height="20" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="60" cy="60" r="20" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="5" fill="none"/>
                </svg>
              </div>
              <input
                type="range"
                min="100"
                max="150"
                step="5"
                value={currentSettings.R}
                onChange={(e) => updateSetting('R', e.target.value)}
              />
              <div className="slider-icon">
                <svg width="20" height="20" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="60" cy="60" r="40" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="5" fill="none"/>
                </svg>
              </div>
            </div>
          </div>
          <div className="control-group">
            <label>Rolling circle</label>
            <div className="slider-container">
              <div className="slider-icon">
                <svg width="20" height="20" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="60" cy="60" r="45" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="4" fill="none"/>
                  <circle cx="60" cy="80" r="15" fill="rgba(255, 255, 255, 0.7)"/>
                </svg>
              </div>
              <input
                type="range"
                min="30"
                max="90"
                step="5"
                value={currentSettings.r}
                onChange={(e) => updateSetting('r', e.target.value)}
              />
              <div className="slider-icon">
                <svg width="20" height="20" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="60" cy="60" r="45" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="4" fill="none"/>
                  <circle cx="60" cy="85" r="30" fill="rgba(255, 255, 255, 0.7)"/>
                </svg>
              </div>
            </div>
          </div>
          <div className="control-group">
            <label>Distance</label>
            <div className="slider-container">
              <div className="slider-icon">
                <svg width="20" height="20" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="60" cy="60" r="40" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="5" fill="none"/>
                  <circle cx="60" cy="60" r="5" fill="rgba(255, 255, 255, 0.7)"/>
                  <circle cx="60" cy="75" r="5" fill="rgba(255, 255, 255, 0.7)"/>
                </svg>
              </div>
              <input
                type="range"
                min="20"
                max="150"
                step="5"
                value={currentSettings.d}
                onChange={(e) => updateSetting('d', e.target.value)}
              />
              <div className="slider-icon">
                <svg width="20" height="20" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="60" cy="60" r="40" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="5" fill="none"/>
                  <circle cx="60" cy="60" r="5" fill="rgba(255, 255, 255, 0.7)"/>
                  <circle cx="60" cy="95" r="5" fill="rgba(255, 255, 255, 0.7)"/>
                </svg>
              </div>
            </div>
          </div>
          <div className="control-group">
            <label>Width</label>
            <div className="slider-container">
              <div className="slider-icon">
                <svg width="20" height="20" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="60" cy="60" r="10" fill="rgba(255, 255, 255, 0.7)"/>
                </svg>
              </div>
              <input
                type="range"
                min="0.5"
                max="1"
                step="0.1"
                value={currentSettings.strokeWidth}
                onChange={(e) => updateSetting('strokeWidth', e.target.value)}
              />
              <div className="slider-icon">
                <svg width="20" height="20" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="60" cy="60" r="35" fill="rgba(255, 255, 255, 0.7)"/>
                </svg>
              </div>
            </div>
          </div>
        </>
      );
    } else if (selectedPattern === 'neurons') {
      return (
        <>
          <div className="control-group">
            <label>Branches</label>
            <div className="slider-container">
              <div className="slider-icon">
                <svg width="20" height="20" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="60" cy="60" r="6" fill="rgba(255, 255, 255, 0.7)"/>
                  <path d="M60 60L28 30.5M60 60L91.5 30.5M60 60V99" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="5" strokeLinecap="round"/>
                </svg>
              </div>
              <input
                type="range"
                min="3"
                max="24"
                step="1"
                value={currentSettings.branches}
                onChange={(e) => updateSetting('branches', e.target.value)}
              />
              <div className="slider-icon">
                <svg width="20" height="20" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="60" cy="60" r="6" fill="rgba(255, 255, 255, 0.7)"/>
                  <path d="M60 60L28 30.5M60 60L91.5 30.5M60 60V98M60 60H103M60 60V17M60 60H17M60 60L100 44M60 60L19.5 44M60 60L77.5 20M60 60L42.5 20" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="5" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
          </div>
          <div className="control-group">
            <label>Depth</label>
            <div className="slider-container">
              <div className="slider-icon">
                <svg width="20" height="20" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="60" cy="98" r="6" fill="rgba(255, 255, 255, 0.7)"/>
                  <path d="M60 98.5V16.5" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="5" strokeLinecap="round"/>
                </svg>
              </div>
              <input
                type="range"
                min="2"
                max="6"
                step="1"
                value={currentSettings.depth}
                onChange={(e) => updateSetting('depth', e.target.value)}
              />
              <div className="slider-icon">
                <svg width="20" height="20" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="60" cy="98" r="6" fill="rgba(255, 255, 255, 0.7)"/>
                  <path d="M60 98.5V60.5M60 60.5L75.25 45M60 60.5L44.5 45M29 29.5L44.5 45M90.5 29.5L75.25 45M75.25 45L73.5 18.5M75.25 45L101 46.5M44.5 45V19.5M44.5 45L18.5 46.5" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="5" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
          </div>
          <div className="control-group">
            <label>Spread</label>
            <div className="slider-container">
              <div className="slider-icon">
                <svg width="20" height="20" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="60" cy="60" r="6" fill="rgba(255, 255, 255, 0.7)"/>
                  <path d="M60 60L50.5 18M60 60L69 18M60 60L50.5 101.5M60 60L69 102" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="5" strokeLinecap="round"/>
                </svg>
              </div>
              <input
                type="range"
                min="0.3"
                max="1.2"
                step="0.1"
                value={currentSettings.spread}
                onChange={(e) => updateSetting('spread', e.target.value)}
              />
              <div className="slider-icon">
                <svg width="20" height="20" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="60" cy="60" r="6" fill="rgba(255, 255, 255, 0.7)"/>
                  <path d="M60 60L28 31.5M60 60L92 31.5M60 60L92 89.5M60 60L28 89.5" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="5" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
          </div>
          <div className="control-group">
            <label>Curve</label>
            <div className="slider-container">
              <div className="slider-icon">
                <svg width="20" height="20" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="22" cy="60" r="6" transform="rotate(-90 22 60)" fill="rgba(255, 255, 255, 0.7)"/>
                  <circle cx="98" cy="60" r="6" transform="rotate(-90 98 60)" fill="rgba(255, 255, 255, 0.7)"/>
                  <path d="M22 60L99 60" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="5" strokeLinecap="round"/>
                </svg>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.8"
                step="0.05"
                value={currentSettings.curvature}
                onChange={(e) => updateSetting('curvature', e.target.value)}
              />
              <div className="slider-icon">
                <svg width="20" height="20" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="22" cy="51" r="6" transform="rotate(-90 22 51)" fill="rgba(255, 255, 255, 0.7)"/>
                  <circle cx="98" cy="51" r="6" transform="rotate(-90 98 51)" fill="rgba(255, 255, 255, 0.7)"/>
                  <path d="M22 51C22 51 33.5 74 60.5 74C87.5 74 99 51 99 51" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="5" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
          </div>
          <div className="control-group">
            <label>Node Size</label>
            <div className="slider-container">
              <div className="slider-icon">
                <svg width="20" height="20" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="60" cy="60" r="12" fill="rgba(255, 255, 255, 0.7)"/>
                </svg>
              </div>
              <input
                type="range"
                min="1"
                max="8"
                step="0.5"
                value={currentSettings.nodeSize}
                onChange={(e) => updateSetting('nodeSize', e.target.value)}
              />
              <div className="slider-icon">
                <svg width="20" height="20" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="60" cy="60" r="24" fill="rgba(255, 255, 255, 0.7)"/>
                </svg>
              </div>
            </div>
          </div>
          <div className="control-group">
            <label>Branch Density</label>
            <div className="slider-container">
              <div className="slider-icon">
                <svg width="20" height="20" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="60" cy="98" r="6" fill="rgba(255, 255, 255, 0.7)"/>
                  <path d="M60 98.5V57.5M60 57.5L69 16.5M60 57.5L51.5 16.5" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="5" strokeLinecap="round"/>
                </svg>
              </div>
              <input
                type="range"
                min="0.3"
                max="0.95"
                step="0.05"
                value={currentSettings.branchProbability}
                onChange={(e) => updateSetting('branchProbability', e.target.value)}
              />
              <div className="slider-icon">
                <svg width="20" height="20" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="60" cy="98" r="6" fill="rgba(255, 255, 255, 0.7)"/>
                  <path d="M60 98.5V57.5M60 98.5L76 60M60 98.5L44 60M60 57.5L69 16.5M60 57.5L51.5 16.5M76 60L98.5 40.5M76 60L90.5 30M76 60L102.5 52.5M44 60L29 30M44 60L22 40.5M44 60L17 52.5" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="5" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
          </div>
        </>
      );
    } else {
      // Wave controls
      return (
        <>
          <div className="control-group">
            <label>Layers</label>
            <div className="slider-container">
              <div className="slider-icon">
                <svg width="20" height="20" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16.5 51C16.5 51 29.1998 59 38.25 59C47.3002 59 52 55.5 60 51C68 46.5 72.6998 43 81.75 43C90.8002 43 103.5 51 103.5 51" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="5" strokeLinecap="round"/>
                  <path d="M16 68C16 68 28.6998 76 37.75 76C46.8002 76 51.5 72.5 59.5 68C67.5 63.5 72.1998 60 81.25 60C90.3002 60 103 68 103 68" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="5" strokeLinecap="round"/>
                </svg>
              </div>
              <input
                type="range"
                min="5"
                max="60"
                step="1"
                value={currentSettings.layers}
                onChange={(e) => updateSetting('layers', e.target.value)}
              />
              <div className="slider-icon">
                <svg width="20" height="20" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16.5 43C16.5 43 29.1998 51 38.25 51C47.3002 51 52 47.5 60 43C68 38.5 72.6998 35 81.75 35C90.8002 35 103.5 43 103.5 43" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="5" strokeLinecap="round"/>
                  <path d="M16.5 32C16.5 32 29.1998 40 38.25 40C47.3002 40 52 36.5 60 32C68 27.5 72.6998 24 81.75 24C90.8002 24 103.5 32 103.5 32" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="5" strokeLinecap="round"/>
                  <path d="M16.5 54C16.5 54 29.1998 62 38.25 62C47.3002 62 52 58.5 60 54C68 49.5 72.6998 46 81.75 46C90.8002 46 103.5 54 103.5 54" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="5" strokeLinecap="round"/>
                  <path d="M16.5 76C16.5 76 29.1998 84 38.25 84C47.3002 84 52 80.5 60 76C68 71.5 72.6998 68 81.75 68C90.8002 68 103.5 76 103.5 76" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="5" strokeLinecap="round"/>
                  <path d="M16.5 87C16.5 87 29.1998 95 38.25 95C47.3002 95 52 91.5 60 87C68 82.5 72.6998 79 81.75 79C90.8002 79 103.5 87 103.5 87" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="5" strokeLinecap="round"/>
                  <path d="M16 65C16 65 28.6998 73 37.75 73C46.8002 73 51.5 69.5 59.5 65C67.5 60.5 72.1998 57 81.25 57C90.3002 57 103 65 103 65" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="5" strokeLinecap="round"/>
                </svg>
              </div>
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
            <label>Frequency</label>
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
            <label>Width</label>
            <div className="slider-container">
              <div className="slider-icon">
                <svg width="20" height="20" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16.5 60C16.5 60 29.1998 68 38.25 68C47.3002 68 52 64.5 60 60C68 55.5 72.6998 52 81.75 52C90.8002 52 103.5 60 103.5 60" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="5" strokeLinecap="round"/>
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
                  <path d="M16.5 60C16.5 60 29.1998 68 38.25 68C47.3002 68 52 64.5 60 60C68 55.5 72.6998 52 81.75 52C90.8002 52 103.5 60 103.5 60" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="5" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
          </div>
        </>
      );
    }
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
              key={`wave-${currentSettings.layers}-${rotation[selectedPattern]}-${patternScale}`}
              ref={svgRef}
              width={currentSettings.width}
              height={currentSettings.height}
              xmlns="http://www.w3.org/2000/svg"
            >
              <g dangerouslySetInnerHTML={{ __html: generateGradientDefs() }} />
              {includeBackground && (
                <rect width="100%" height="100%" fill={getColorRef(backgroundColor, 'bg-gradient')} />
              )}
              <g transform={`translate(${currentSettings.width / 2} ${currentSettings.height / 2}) scale(${patternScale}) ${!isDrawingMode ? `rotate(${rotation[selectedPattern]})` : ''} translate(${-currentSettings.width / 2} ${-currentSettings.height / 2})`}>
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
                <g transform={`translate(${currentSettings.width / 2} ${currentSettings.height / 2}) scale(${patternScale}) translate(${-currentSettings.width / 2} ${-currentSettings.height / 2})`}>
                  <path
                    d={`M ${customPath.map(p => `${p.x + drawingModeOffsets.horizontal} ${p.y + drawingModeOffsets.vertical}`).join(' L ')}`}
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
                <g transform={`translate(${currentSettings.width / 2} ${currentSettings.height / 2}) scale(${patternScale}) translate(${-currentSettings.width / 2} ${-currentSettings.height / 2})`}>
                  {customPath.map((point, index) => (
                    <circle
                      key={index}
                      cx={point.x + drawingModeOffsets.horizontal}
                      cy={point.y + drawingModeOffsets.vertical}
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
            
            {selectedPattern === 'wave' && (
              <>
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
              </>
            )}

            {isDrawingMode && customPath.length > 0 && selectedPattern === 'wave' && (
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
            <h2>Pattern Type</h2>
            <div className="pattern-selector">
              <button 
                className={`pattern-button ${selectedPattern === 'wave' ? 'active' : ''}`}
                onClick={() => setSelectedPattern('wave')}
              >
                Wave
              </button>
              <button 
                className={`pattern-button ${selectedPattern === 'neurons' ? 'active' : ''}`}
                onClick={() => setSelectedPattern('neurons')}
              >
                Neurons
              </button>
              <button 
                className={`pattern-button ${selectedPattern === 'spirograph' ? 'active' : ''}`}
                onClick={() => setSelectedPattern('spirograph')}
              >
                Spirograph
              </button>
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
          <h2>Color</h2>
          <div className="color-inputs">
            <CustomColorPicker
              label="Background"
              color={backgroundColor}
              onChange={setBackgroundColor}
              showEyeToggle={true}
              isVisible={includeBackground}
              onToggleVisibility={() => setIncludeBackground(!includeBackground)}
              supportsGradient={false}
            />
            <CustomColorPicker
              label="Line"
              color={fillColor}
              onChange={setFillColor}
              supportsGradient={true}
            />
            {selectedPattern === 'neurons' && (
              <CustomColorPicker
                label="Node"
                color={nodeColor}
                onChange={setNodeColor}
                supportsGradient={false}
              />
            )}
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


