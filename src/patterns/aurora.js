import { seededRandom } from './utils';

// Aurora Pattern Generator - Stacked circles creating aurora-like effect
export const generateAurora = (settings, seed = Math.random()) => {
  const { 
    width, 
    height, 
    color = '#4DFFDF',      // Primary color (cyan/turquoise)
    color2 = '#FF1493',     // Secondary color (magenta/pink)
    opacity = 1.0,
    dotDensity = 150,       // Number of base circles along the path
    flowAmplitude = 80,     // Wave amplitude (for generated path)
    flowFrequency = 2,      // Wave frequency (for generated path)
    bandWidth = 120,        // Maximum height of stacked circles
    turbulence = 0.3,       // Amount of organic noise/turbulence
    fadeEdges = 0.7,        // How much bands fade at edges (0-1)
    verticalOffset = 0,
    horizontalOffset = 0,
    customPath = null,      // Custom drawn path (can be single path or array of paths)
    pathOffsets = null      // Per-path offsets for multiple paths
  } = settings;
  
  // Create seeded random function
  const random = seededRandom(seed * 4294967296);
  
  // Parse colors to RGB for gradient
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 77, g: 255, b: 223 };
  };
  
  const color1RGB = hexToRgb(color);
  const color2RGB = hexToRgb(color2);
  
  // Simple noise function for organic turbulence
  const noise = (x, y) => {
    const n1 = Math.sin(x * 2.3 + y * 1.7);
    const n2 = Math.cos(x * 1.8 - y * 2.1);
    const n3 = Math.sin(y * 2.5 + x * 1.3);
    return (n1 + n2 + n3) / 3;
  };
  
  let dotsData = [];
  let allBasePaths = [];
  
  // Determine if customPath is an array of paths or a single path
  const isMultiplePaths = customPath && Array.isArray(customPath) && 
                          customPath.length > 0 && 
                          Array.isArray(customPath[0]);
  
  const pathsToProcess = isMultiplePaths ? customPath : (customPath && customPath.length > 10 ? [customPath] : []);
  
  // Generate or use custom base paths
  if (pathsToProcess.length > 0) {
    // Process each custom path
    pathsToProcess.forEach(singlePath => {
      if (!singlePath || singlePath.length < 10) return;
      
      let basePath = [];
      // Use custom drawn path with smoothing
      let smoothedPath = [...singlePath];
    
    // Apply Gaussian smoothing (reduced for better accuracy)
    const smoothingPasses = 1;
    for (let pass = 0; pass < smoothingPasses; pass++) {
      const tempPath = [];
      const smoothingWindow = Math.min(8, Math.floor(smoothedPath.length / 10));
      
      for (let i = 0; i < smoothedPath.length; i++) {
        let sumX = 0, sumY = 0, totalWeight = 0;
        
        for (let j = -smoothingWindow; j <= smoothingWindow; j++) {
          const idx = i + j;
          if (idx >= 0 && idx < smoothedPath.length) {
            const sigma = smoothingWindow / 2.5;
            const weight = Math.exp(-(j * j) / (2 * sigma * sigma));
            sumX += smoothedPath[idx].x * weight;
            sumY += smoothedPath[idx].y * weight;
            totalWeight += weight;
          }
        }
        
        tempPath.push({ x: sumX / totalWeight, y: sumY / totalWeight });
      }
      smoothedPath = tempPath;
    }
    
    // Resample for consistent density
    const numPoints = dotDensity;
    for (let i = 0; i < numPoints; i++) {
      const t = i / (numPoints - 1);
      const index = t * (smoothedPath.length - 1);
      const i1 = Math.floor(index);
      const i2 = Math.min(i1 + 1, smoothedPath.length - 1);
      const fraction = index - i1;
      
      const i0 = Math.max(0, i1 - 1);
      const i3 = Math.min(smoothedPath.length - 1, i2 + 1);
      
      const p0 = smoothedPath[i0];
      const p1 = smoothedPath[i1];
      const p2 = smoothedPath[i2];
      const p3 = smoothedPath[i3];
      
      // Catmull-Rom spline interpolation
      const t2 = fraction * fraction;
      const t3 = t2 * fraction;
      
      const x = 0.5 * (
        (2 * p1.x) +
        (-p0.x + p2.x) * fraction +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
      );
      
      const y = 0.5 * (
        (2 * p1.y) +
        (-p0.y + p2.y) * fraction +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
      );
      
      basePath.push({ x, y, t });
      }
      
      allBasePaths.push(basePath);
    });
  } else {
    // Generate default flowing wave path
    let basePath = [];
    const numPoints = dotDensity;
    const centerY = height / 2;
    
    for (let i = 0; i < numPoints; i++) {
      const t = i / (numPoints - 1);
      const x = t * width;
      
      // Create flowing Y movement
      const y = centerY + Math.sin(t * Math.PI * flowFrequency * 2) * flowAmplitude * Math.sin(t * Math.PI * 1.5);
      
      basePath.push({ x, y, t });
    }
    
    allBasePaths.push(basePath);
  }
  
  // Generate stacked circles along all base paths
  allBasePaths.forEach((basePath, basePathIndex) => {
    // Get per-path offset if available
    const pathOffset = pathOffsets && pathOffsets[basePathIndex] 
      ? pathOffsets[basePathIndex] 
      : { horizontal: 0, vertical: 0 };
    
    for (let pathIndex = 0; pathIndex < basePath.length; pathIndex++) {
      const pathPoint = basePath[pathIndex];
    const t = pathPoint.t;
    
    // Calculate perpendicular direction for stacking circles
    let tangentX = 0;
    let tangentY = 1;
    
    if (pathIndex > 0 && pathIndex < basePath.length - 1) {
      const prevPoint = basePath[pathIndex - 1];
      const nextPoint = basePath[pathIndex + 1];
      tangentX = nextPoint.x - prevPoint.x;
      tangentY = nextPoint.y - prevPoint.y;
      
      const tangentLength = Math.sqrt(tangentX * tangentX + tangentY * tangentY);
      if (tangentLength > 0) {
        tangentX /= tangentLength;
        tangentY /= tangentLength;
      }
    }
    
    // Perpendicular vector (pointing upward from the path)
    let perpX = -tangentY;
    let perpY = tangentX;
    
    // Ensure perpendicular points upward (negative Y in screen coordinates)
    // If perpY is positive (pointing down), flip the direction
    if (perpY > 0) {
      perpX = -perpX;
      perpY = -perpY;
    }
    
    // Determine height of the stack at this point (creates the flowing wave effect)
    const waveHeight = Math.abs(Math.sin(t * Math.PI * flowFrequency * 3 + random() * 0.5)) * 
                       Math.sin(t * Math.PI); // Taper at edges
    
    // Add turbulence variation
    const turbulenceVariation = 1 + noise(pathPoint.x * 0.01, pathPoint.y * 0.01) * turbulence;
    
    // Calculate number of circles to stack (varying height)
    const maxStackHeight = Math.floor((bandWidth / 6) * waveHeight * turbulenceVariation);
    const numCirclesInStack = Math.max(1, maxStackHeight);
    
    // Base circle size
    const baseCircleSize = 2 + random() * 2;
    
    // Color gradient along the path
    const r = Math.round(color1RGB.r * (1 - t) + color2RGB.r * t);
    const g = Math.round(color1RGB.g * (1 - t) + color2RGB.g * t);
    const b = Math.round(color1RGB.b * (1 - t) + color2RGB.b * t);
    const baseColor = `rgb(${r},${g},${b})`;
    
    // Edge taper for overall opacity
    const edgeTaper = Math.sin(t * Math.PI);
    
    // Stack circles vertically
    for (let stackIndex = 0; stackIndex < numCirclesInStack; stackIndex++) {
      // Position along the perpendicular (upward from base)
      const stackProgress = stackIndex / Math.max(1, numCirclesInStack - 1);
      
      // Distance from base (with some spacing between circles)
      const stackDistance = stackIndex * (baseCircleSize * 1.8);
      
      // Add slight horizontal offset for organic look
      const horizontalJitter = (random() - 0.5) * baseCircleSize * 0.5 * turbulence;
      
      // Final position (including global offset and per-path offset)
      const x = pathPoint.x + perpX * stackDistance + tangentX * horizontalJitter + horizontalOffset + pathOffset.horizontal;
      const y = pathPoint.y + perpY * stackDistance + tangentY * horizontalJitter + verticalOffset + pathOffset.vertical;
      
      // Circle size: equal or smaller as we go up
      const sizeReduction = Math.pow(1 - stackProgress, 0.3); // Gradual size reduction
      const circleSize = baseCircleSize * (0.6 + sizeReduction * 0.4);
      
      // Opacity: fade as we go up
      const stackFade = Math.exp(-stackProgress * fadeEdges);
      const finalOpacity = opacity * stackFade * edgeTaper * (0.6 + random() * 0.4);
      
      // Only add visible circles
      if (finalOpacity > 0.05) {
        // Slightly lighter color as we go up
        const lightenFactor = stackProgress * 0.2;
        const lightR = Math.min(255, Math.round(r + (255 - r) * lightenFactor));
        const lightG = Math.min(255, Math.round(g + (255 - g) * lightenFactor));
        const lightB = Math.min(255, Math.round(b + (255 - b) * lightenFactor));
        const circleColor = `rgb(${lightR},${lightG},${lightB})`;
        
        dotsData.push({
          x,
          y,
          size: circleSize,
          color: circleColor,
          opacity: Math.min(1, finalOpacity),
          sortKey: basePathIndex * 1000000 + pathIndex * 1000 + stackIndex // Sort by base path, then position, then stack height
        });
      }
    }
  }
  });
  
  // Sort by sort key for proper layering
  dotsData.sort((a, b) => a.sortKey - b.sortKey);
  
  // Generate SVG circles
  let paths = '';
  for (const dot of dotsData) {
    paths += `<circle cx="${dot.x}" cy="${dot.y}" r="${dot.size}" fill="${dot.color}" opacity="${dot.opacity}"/>`;
  }
  
  return paths;
};
