import { useState, useRef, useEffect } from 'react';
import { HexColorPicker } from 'react-colorful';
import './CustomColorPicker.css';

const CustomColorPicker = ({ color, onChange, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(color);
  const pickerRef = useRef(null);
  const swatchRef = useRef(null);

  useEffect(() => {
    setInputValue(color);
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
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleInputChange = (e) => {
    const value = e.target.value.replace(/[^0-9A-Fa-f]/g, '').toUpperCase().slice(0, 6);
    setInputValue(value);
    if (value.length === 6) {
      onChange(value);
    }
  };

  const handleColorChange = (newColor) => {
    const hexValue = newColor.replace('#', '').toUpperCase();
    setInputValue(hexValue);
    onChange(hexValue);
  };

  return (
    <div className="control-group">
      <label>{label}</label>
      <div className="color-input-group">
        <div className="color-swatch-wrapper" ref={swatchRef}>
          <div 
            className="color-preview-swatch"
            style={{ backgroundColor: `#${color}` }}
            onClick={() => setIsOpen(!isOpen)}
          />
          
          {isOpen && (
            <div ref={pickerRef} className="color-picker-popup">
              <HexColorPicker color={`#${color}`} onChange={handleColorChange} />
            </div>
          )}
        </div>
        
        <div className="input-with-label">
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
        </div>
      </div>
    </div>
  );
};

export default CustomColorPicker;

