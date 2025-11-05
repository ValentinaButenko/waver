import { useState, useRef, useEffect } from 'react';
import { HexColorPicker } from 'react-colorful';
import { Eye, EyeClosed, Plus, Minus } from 'phosphor-react';
import './CustomColorPicker.css';

const CustomColorPicker = ({ color, onChange, label, showEyeToggle, isVisible, onToggleVisibility, supportsGradient = false, compact = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef(null);
  const swatchRef = useRef(null);
  
  // Normalize color data structure
  const colorData = typeof color === 'string' ? { type: 'solid', value: color } : color;
  const [mode, setMode] = useState(colorData.type || 'solid');
  const [solidColor, setSolidColor] = useState(colorData.type === 'solid' ? colorData.value : '4300B0');
  const [gradientStops, setGradientStops] = useState(
    (colorData.type === 'linear' || colorData.type === 'radial') ? colorData.stops.map(s => ({
      ...s,
      opacity: s.opacity !== undefined ? s.opacity : 100
    })) : [
      { color: '4300B0', position: 0, opacity: 100 },
      { color: 'FF00FF', position: 100, opacity: 100 }
    ]
  );
  const [gradientAngle, setGradientAngle] = useState(
    (colorData.type === 'linear' || colorData.type === 'radial') ? (colorData.angle || 90) : 90
  );
  const [gradientType, setGradientType] = useState(
    colorData.type === 'radial' ? 'radial' : 'linear'
  );
  const [editingStopIndex, setEditingStopIndex] = useState(null);
  const [inputValue, setInputValue] = useState('');

  // Sync with external color changes
  useEffect(() => {
    const newColorData = typeof color === 'string' ? { type: 'solid', value: color } : color;
    setMode(newColorData.type || 'solid');
    if (newColorData.type === 'solid') {
      setSolidColor(newColorData.value);
      setInputValue(newColorData.value);
    } else if (newColorData.type === 'linear' || newColorData.type === 'radial') {
      setGradientStops(newColorData.stops.map(s => ({
        ...s,
        opacity: s.opacity !== undefined ? s.opacity : 100
      })));
      setGradientAngle(newColorData.angle || 90);
      setGradientType(newColorData.type === 'radial' ? 'radial' : 'linear');
    }
  }, [color]);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isOpen && 
        pickerRef.current && 
        !pickerRef.current.contains(event.target) &&
        swatchRef.current &&
        !swatchRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        setEditingStopIndex(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const notifyChange = (newMode, newSolidColor, newGradientStops, newGradientAngle, newGradientType) => {
    if (newMode === 'solid') {
      onChange({ type: 'solid', value: newSolidColor });
    } else {
      onChange({ 
        type: newMode, // 'linear' or 'radial'
        stops: newGradientStops,
        angle: newGradientAngle
      });
    }
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    if (newMode === 'linear' || newMode === 'radial') {
      setGradientType(newMode);
    }
    notifyChange(newMode, solidColor, gradientStops, gradientAngle, newMode);
  };

  const handleInputChange = (e) => {
    const value = e.target.value.replace(/[^0-9A-Fa-f]/g, '').toUpperCase().slice(0, 6);
    setInputValue(value);
    if (value.length === 6) {
      setSolidColor(value);
      notifyChange('solid', value, gradientStops, gradientAngle, gradientType);
    }
  };

  const handleColorChange = (newColor) => {
    const hexValue = newColor.replace('#', '').toUpperCase();
    if (mode === 'solid') {
      setInputValue(hexValue);
      setSolidColor(hexValue);
      notifyChange('solid', hexValue, gradientStops, gradientAngle, gradientType);
    } else if (editingStopIndex !== null) {
      const newStops = [...gradientStops];
      newStops[editingStopIndex] = { ...newStops[editingStopIndex], color: hexValue };
      setGradientStops(newStops);
      notifyChange(mode, solidColor, newStops, gradientAngle, gradientType);
    }
  };

  const handleStopPositionChange = (index, newPosition) => {
    const position = Math.max(0, Math.min(100, parseInt(newPosition) || 0));
    const newStops = [...gradientStops];
    newStops[index] = { ...newStops[index], position };
    // Sort stops by position
    newStops.sort((a, b) => a.position - b.position);
    setGradientStops(newStops);
    notifyChange(mode, solidColor, newStops, gradientAngle, gradientType);
  };

  const handleStopColorInputChange = (index, value) => {
    const hexValue = value.replace(/[^0-9A-Fa-f]/g, '').toUpperCase().slice(0, 6);
    const newStops = [...gradientStops];
    newStops[index] = { ...newStops[index], color: hexValue };
    setGradientStops(newStops);
    if (hexValue.length === 6) {
      notifyChange(mode, solidColor, newStops, gradientAngle, gradientType);
    }
  };

  const handleStopOpacityChange = (index, value) => {
    const opacity = Math.max(0, Math.min(100, parseInt(value) || 0));
    const newStops = [...gradientStops];
    newStops[index] = { ...newStops[index], opacity };
    setGradientStops(newStops);
    notifyChange(mode, solidColor, newStops, gradientAngle, gradientType);
  };

  const addGradientStop = () => {
    const newPosition = 50;
    const newColor = gradientStops.length > 0 ? gradientStops[0].color : '4300B0';
    const newOpacity = gradientStops.length > 0 ? gradientStops[0].opacity : 100;
    const newStops = [...gradientStops, { color: newColor, position: newPosition, opacity: newOpacity }];
    newStops.sort((a, b) => a.position - b.position);
    setGradientStops(newStops);
    notifyChange(mode, solidColor, newStops, gradientAngle, gradientType);
  };

  const removeGradientStop = (index) => {
    if (gradientStops.length <= 2) return; // Keep at least 2 stops
    const newStops = gradientStops.filter((_, i) => i !== index);
    setGradientStops(newStops);
    setEditingStopIndex(null);
    notifyChange(mode, solidColor, newStops, gradientAngle, gradientType);
  };

  const handleAngleChange = (e) => {
    const newAngle = parseInt(e.target.value) || 0;
    setGradientAngle(newAngle);
    notifyChange(mode, solidColor, gradientStops, newAngle, gradientType);
  };

  const getSwatchStyle = () => {
    if (mode === 'solid') {
      return { backgroundColor: `#${solidColor}` };
    } else if (mode === 'radial') {
      const stops = gradientStops.map(s => {
        const opacity = (s.opacity !== undefined ? s.opacity : 100) / 100;
        return `rgba(${parseInt(s.color.substring(0, 2), 16)}, ${parseInt(s.color.substring(2, 4), 16)}, ${parseInt(s.color.substring(4, 6), 16)}, ${opacity}) ${s.position}%`;
      }).join(', ');
      return { background: `radial-gradient(circle, ${stops})` };
    } else {
      const stops = gradientStops.map(s => {
        const opacity = (s.opacity !== undefined ? s.opacity : 100) / 100;
        return `rgba(${parseInt(s.color.substring(0, 2), 16)}, ${parseInt(s.color.substring(2, 4), 16)}, ${parseInt(s.color.substring(4, 6), 16)}, ${opacity}) ${s.position}%`;
      }).join(', ');
      return { background: `linear-gradient(${gradientAngle}deg, ${stops})` };
    }
  };

  // Render mode selector icons
  const renderModeSelector = () => {
    if (!supportsGradient) return null;
    
    return (
      <div className="mode-selector">
        <button
          className={`mode-selector-option ${mode === 'solid' ? 'active' : ''}`}
          onClick={() => handleModeChange('solid')}
          title="Solid Color"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="10" cy="10" r="8" fill={`#${solidColor}`} />
          </svg>
        </button>
        <button
          className={`mode-selector-option ${mode === 'linear' ? 'active' : ''}`}
          onClick={() => handleModeChange('linear')}
          title="Linear Gradient"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="0" width="10" height="20" fill={`#${gradientStops[0]?.color || '4300B0'}`} />
            <rect x="10" y="0" width="10" height="20" fill={`#${gradientStops[1]?.color || gradientStops[0]?.color || '4300B0'}`} />
          </svg>
        </button>
        <button
          className={`mode-selector-option ${mode === 'radial' ? 'active' : ''}`}
          onClick={() => handleModeChange('radial')}
          title="Radial Gradient"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="10" cy="10" r="10" fill={`#${gradientStops[0]?.color || '4300B0'}`} />
            <circle cx="10" cy="10" r="7" fill={`#${gradientStops[1]?.color || gradientStops[0]?.color || '4300B0'}`} />
            <circle cx="10" cy="10" r="4" fill={`#${gradientStops[0]?.color || '4300B0'}`} />
          </svg>
        </button>
      </div>
    );
  };

  return (
    <div className={compact ? "" : "control-group"}>
      {!compact && <label>{label}</label>}
      <div className="color-input-group">
        <div className="color-swatch-wrapper" ref={swatchRef}>
          <div 
            className="color-preview-swatch"
            style={getSwatchStyle()}
            onClick={() => setIsOpen(!isOpen)}
          />
          
          {isOpen && (
            <div ref={pickerRef} className="color-picker-popup">
              {renderModeSelector()}
              
              {mode === 'solid' ? (
                <HexColorPicker color={`#${solidColor}`} onChange={handleColorChange} />
              ) : (
                <div className="gradient-editor">
                  <div className="gradient-preview" style={getSwatchStyle()} />
                  
                  {mode === 'linear' && (
                    <div className="gradient-angle-control">
                      <label>Angle</label>
                      <input 
                        type="range" 
                        min="0" 
                        max="360" 
                        value={gradientAngle}
                        onChange={handleAngleChange}
                        className="angle-slider"
                      />
                      <span className="angle-value">{gradientAngle}°</span>
                    </div>
                  )}
                  
                  <div className="gradient-stops">
                    <div className="gradient-stops-header">
                      <label>Color Stops</label>
                      <button 
                        className="add-stop-button" 
                        onClick={addGradientStop}
                        title="Add color stop"
                      >
                        <Plus size={16} weight="regular" />
                      </button>
                    </div>
                    
                    {gradientStops.map((stop, index) => (
                      <div key={index} className="gradient-stop-item">
                        <div className="stop-position-input-wrapper">
                          <div className="input-with-label">
                            <input
                              type="number"
                              className="size-input stop-position-input"
                              value={stop.position}
                              onChange={(e) => handleStopPositionChange(index, e.target.value)}
                              min="0"
                              max="100"
                            />
                            <span className="input-marker position-marker">%</span>
                          </div>
                        </div>
                        <div 
                          className="stop-color-swatch"
                          style={{ backgroundColor: `#${stop.color}` }}
                          onClick={() => setEditingStopIndex(index)}
                        />
                        <div className="stop-color-input-wrapper">
                          <div className="input-with-label">
                            <span className="input-marker">#</span>
                            <input
                              type="text"
                              className="size-input stop-hex-input"
                              value={stop.color}
                              onChange={(e) => handleStopColorInputChange(index, e.target.value)}
                              maxLength="6"
                              placeholder="0066FF"
                              style={{ textTransform: 'uppercase' }}
                            />
                          </div>
                        </div>
                        {/* Opacity input removed per request */}
                        <button 
                          className="remove-stop-button"
                          onClick={() => removeGradientStop(index)}
                          title="Remove stop"
                          disabled={gradientStops.length <= 2}
                        >
                          <Minus size={16} weight="regular" />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  {editingStopIndex !== null && (
                    <div className="stop-color-picker">
                      <HexColorPicker 
                        color={`#${gradientStops[editingStopIndex].color}`} 
                        onChange={handleColorChange} 
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        
        {(mode === 'solid' || mode === 'linear' || mode === 'radial') && (
          <div className="input-with-label">
            {mode === 'solid' ? (
              <>
                <span className="input-marker">#</span>
                <input
                  type="text"
                  className="size-input"
                  value={inputValue}
                  onChange={handleInputChange}
                  maxLength="6"
                  placeholder="0066FF"
                  style={{ textTransform: 'uppercase' }}
                />
              </>
            ) : (
              <input
                type="text"
                className="size-input"
                value={mode === 'linear' ? 'Linear' : 'Radial'}
                readOnly
                onClick={() => setIsOpen(true)}
                style={{ cursor: 'pointer' }}
              />
            )}
          </div>
        )}
        
        {showEyeToggle && (
          <div className="eye-toggle-icon" onClick={onToggleVisibility}>
            {isVisible ? (
              <Eye size={20} weight="regular" />
            ) : (
              <EyeClosed size={20} weight="regular" />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomColorPicker;

