// Wave Pattern Generator
export const generateWave = (settings) => {
  const { width, height, amplitude, frequency, strokeWidth, color, opacity, layers, verticalOffset = 0 } = settings;
  let paths = '';
  
  for (let layer = 0; layer < layers; layer++) {
    const layerAmplitude = amplitude * (1 - layer * 0.2);
    const layerFrequency = frequency * (1 + layer * 0.3);
    const yOffset = (height / 2) + (layer * 30) + verticalOffset;
    
    let path = `M 0 ${yOffset}`;
    for (let x = 0; x <= width; x += 5) {
      const y = yOffset + Math.sin(x * layerFrequency * 0.01) * layerAmplitude;
      path += ` L ${x} ${y}`;
    }
    
    paths += `<path d="${path}" stroke="${color}" stroke-width="${strokeWidth}" fill="none" opacity="${opacity}" stroke-linecap="round"/>`;
  }
  
  return paths;
};

// Blob Pattern Generator
export const generateBlob = (settings) => {
  const { width, height, blobCount, size, color, opacity, complexity } = settings;
  let blobs = '';
  
  for (let i = 0; i < blobCount; i++) {
    const cx = Math.random() * width;
    const cy = Math.random() * height;
    const points = 8 + Math.floor(Math.random() * complexity);
    
    let path = '';
    for (let j = 0; j <= points; j++) {
      const angle = (j / points) * Math.PI * 2;
      const radius = size * (0.7 + Math.random() * 0.6);
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      
      if (j === 0) {
        path += `M ${x} ${y}`;
      } else {
        const cpx1 = cx + Math.cos(angle - 0.3) * radius * 1.2;
        const cpy1 = cy + Math.sin(angle - 0.3) * radius * 1.2;
        path += ` Q ${cpx1} ${cpy1} ${x} ${y}`;
      }
    }
    
    blobs += `<path d="${path} Z" fill="${color}" opacity="${opacity}"/>`;
  }
  
  return blobs;
};

// Circle Scatter Pattern Generator
export const generateCircleScatter = (settings) => {
  const { width, height, circleCount, minRadius, maxRadius, color, opacity, strokeWidth } = settings;
  let circles = '';
  
  for (let i = 0; i < circleCount; i++) {
    const cx = Math.random() * width;
    const cy = Math.random() * height;
    const r = minRadius + Math.random() * (maxRadius - minRadius);
    const circleOpacity = opacity * (0.3 + Math.random() * 0.7);
    
    circles += `<circle cx="${cx}" cy="${cy}" r="${r}" stroke="${color}" stroke-width="${strokeWidth}" fill="none" opacity="${circleOpacity}"/>`;
  }
  
  return circles;
};

// Layered Waves Pattern Generator
export const generateLayeredWaves = (settings) => {
  const { width, height, layers, amplitude, frequency, color1, color2, opacity } = settings;
  let waves = '';
  
  for (let layer = 0; layer < layers; layer++) {
    const progress = layer / layers;
    const yBase = height * (0.3 + progress * 0.5);
    const layerColor = interpolateColor(color1, color2, progress);
    
    let path = `M 0 ${height}`;
    path += ` L 0 ${yBase}`;
    
    for (let x = 0; x <= width; x += 10) {
      const y = yBase + Math.sin(x * frequency * 0.01 + layer * 0.5) * amplitude;
      path += ` L ${x} ${y}`;
    }
    
    path += ` L ${width} ${height} Z`;
    
    waves += `<path d="${path}" fill="${layerColor}" opacity="${opacity}"/>`;
  }
  
  return waves;
};

// Stacked Steps Pattern Generator
export const generateStackedSteps = (settings) => {
  const { width, height, steps, stepHeight, color, opacity, spacing } = settings;
  let rects = '';
  
  const totalSpacing = (steps - 1) * spacing;
  const availableHeight = height - totalSpacing;
  const actualStepHeight = Math.min(stepHeight, availableHeight / steps);
  
  for (let i = 0; i < steps; i++) {
    const y = i * (actualStepHeight + spacing);
    const stepWidth = width * (0.3 + (i / steps) * 0.7);
    const x = (width - stepWidth) / 2;
    const stepOpacity = opacity * (0.5 + (i / steps) * 0.5);
    
    rects += `<rect x="${x}" y="${y}" width="${stepWidth}" height="${actualStepHeight}" fill="${color}" opacity="${stepOpacity}" rx="8"/>`;
  }
  
  return rects;
};

// Islamic Pattern Generator
export const generateIslamicPattern = (settings) => {
  const { width, height, gridSize, color, strokeWidth, opacity, complexity } = settings;
  let pattern = '';
  
  const cellWidth = width / gridSize;
  const cellHeight = height / gridSize;
  
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const cx = col * cellWidth + cellWidth / 2;
      const cy = row * cellHeight + cellHeight / 2;
      const size = Math.min(cellWidth, cellHeight) * 0.4;
      
      // Create star pattern
      let starPath = '';
      const points = complexity;
      for (let i = 0; i < points * 2; i++) {
        const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
        const radius = i % 2 === 0 ? size : size * 0.4;
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;
        
        if (i === 0) {
          starPath += `M ${x} ${y}`;
        } else {
          starPath += ` L ${x} ${y}`;
        }
      }
      starPath += ' Z';
      
      pattern += `<path d="${starPath}" stroke="${color}" stroke-width="${strokeWidth}" fill="none" opacity="${opacity}"/>`;
      
      // Add connecting lines
      if (col < gridSize - 1) {
        pattern += `<line x1="${cx + size}" y1="${cy}" x2="${cx + cellWidth - size}" y2="${cy}" stroke="${color}" stroke-width="${strokeWidth}" opacity="${opacity * 0.5}"/>`;
      }
      if (row < gridSize - 1) {
        pattern += `<line x1="${cx}" y1="${cy + size}" x2="${cx}" y2="${cy + cellHeight - size}" stroke="${color}" stroke-width="${strokeWidth}" opacity="${opacity * 0.5}"/>`;
      }
    }
  }
  
  return pattern;
};

// Floral Pattern Generator
export const generateFloralPattern = (settings) => {
  const { width, height, flowerCount, petalCount, size, color, opacity } = settings;
  let flowers = '';
  
  for (let i = 0; i < flowerCount; i++) {
    const cx = Math.random() * width;
    const cy = Math.random() * height;
    
    // Draw petals
    for (let petal = 0; petal < petalCount; petal++) {
      const angle = (petal / petalCount) * Math.PI * 2;
      const petalSize = size * (0.8 + Math.random() * 0.4);
      
      const x1 = cx;
      const y1 = cy;
      const x2 = cx + Math.cos(angle) * petalSize;
      const y2 = cy + Math.sin(angle) * petalSize;
      const x3 = cx + Math.cos(angle + 0.3) * petalSize * 0.5;
      const y3 = cy + Math.sin(angle + 0.3) * petalSize * 0.5;
      
      const path = `M ${x1} ${y1} Q ${x2} ${y2} ${x3} ${y3} Z`;
      flowers += `<path d="${path}" fill="${color}" opacity="${opacity * 0.6}"/>`;
    }
    
    // Draw center
    flowers += `<circle cx="${cx}" cy="${cy}" r="${size * 0.2}" fill="${color}" opacity="${opacity}"/>`;
    
    // Add stem
    const stemLength = size * 1.5;
    const stemX = cx;
    const stemY = cy + stemLength;
    flowers += `<line x1="${cx}" y1="${cy}" x2="${stemX}" y2="${stemY}" stroke="${color}" stroke-width="2" opacity="${opacity * 0.4}"/>`;
  }
  
  return flowers;
};

// Helper function to interpolate between two colors
function interpolateColor(color1, color2, factor) {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  
  const r = Math.round(c1.r + (c2.r - c1.r) * factor);
  const g = Math.round(c1.g + (c2.g - c1.g) * factor);
  const b = Math.round(c1.b + (c2.b - c1.b) * factor);
  
  return `rgb(${r}, ${g}, ${b})`;
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}


