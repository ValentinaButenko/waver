// Wave Pattern Generator - Flowing Ribbon Style with Dynamic Spreading
export const generateWave = (settings, phaseOffsets = []) => {
  const { width, height, amplitude, frequency, strokeWidth, color, opacity, layers, verticalOffset = 0, horizontalOffset = 0, customPath } = settings;
  let paths = '';
  
  let rawPoints = [];
  
  // Use custom path if provided, otherwise generate default
  if (customPath && customPath.length > 5) {
    // First, apply heavy smoothing to the custom path
    const smoothedPath = [];
    const smoothingWindow = Math.min(10, Math.floor(customPath.length / 10));
    
    for (let i = 0; i < customPath.length; i++) {
      let sumX = 0, sumY = 0, count = 0;
      
      // Gaussian-like weighted average
      for (let j = -smoothingWindow; j <= smoothingWindow; j++) {
        const idx = i + j;
        if (idx >= 0 && idx < customPath.length) {
          const weight = Math.exp(-(j * j) / (2 * smoothingWindow * smoothingWindow));
          sumX += customPath[idx].x * weight;
          sumY += customPath[idx].y * weight;
          count += weight;
        }
      }
      
      smoothedPath.push({ x: sumX / count, y: sumY / count });
    }
    
    // Resample smoothed path to have consistent number of points
    const numPoints = 800;
    for (let i = 0; i < numPoints; i++) {
      const t = i / (numPoints - 1);
      const index = t * (smoothedPath.length - 1);
      const floorIndex = Math.floor(index);
      const ceilIndex = Math.min(Math.ceil(index), smoothedPath.length - 1);
      const fraction = index - floorIndex;
      
      // Interpolate between points
      const x = smoothedPath[floorIndex].x + (smoothedPath[ceilIndex].x - smoothedPath[floorIndex].x) * fraction;
      const y = smoothedPath[floorIndex].y + (smoothedPath[ceilIndex].y - smoothedPath[floorIndex].y) * fraction;
      
      // Calculate spread based on curvature
      let spreadFactor = 1.0;
      if (floorIndex > 0 && ceilIndex < smoothedPath.length - 1) {
        const dx = Math.abs(smoothedPath[ceilIndex].x - smoothedPath[floorIndex - 1].x);
        const dy = Math.abs(smoothedPath[ceilIndex].y - smoothedPath[floorIndex - 1].y);
        const curvature = Math.sqrt(dx * dx + dy * dy);
        spreadFactor = 0.3 + Math.min(curvature / 50, 2.0);
      }
      
      rawPoints.push({ x, y, spread: spreadFactor });
    }
  } else {
    // Generate core path points - ULTRA HIGH density for perfect smoothness
    const numPoints = 800;
    const centerX = width / 2;
    
    // Use patternHeight for consistent generation, or fall back to height
    const patternHeight = settings.patternHeight || height;
    
    // Generate raw points based on patternHeight (not canvas height)
    for (let i = 0; i < numPoints; i++) {
      const t = i / (numPoints - 1);
      const y = t * patternHeight + verticalOffset;
      
      // Create flowing X movement (horizontalOffset applied later to all points)
      const x = centerX + Math.sin(t * Math.PI * frequency * 2) * amplitude * Math.sin(t * Math.PI * 1.5);
      
      // DRAMATIC spread factor - this controls how much lines spread apart or compress
      // Low value = lines compressed together (dark), High value = lines spread apart (white gaps)
      const spreadFactor = 0.2 + Math.abs(Math.sin(t * Math.PI * frequency * 2.5)) * 2.5;
      
      rawPoints.push({ x, y, spread: spreadFactor });
    }
  }
  
  // Apply double-pass smoothing filter for maximum smoothness
  const corePoints = [];
  
  // First pass - aggressive smoothing
  const firstPass = [];
  for (let i = 0; i < rawPoints.length; i++) {
    if (i < 3 || i >= rawPoints.length - 3) {
      firstPass.push(rawPoints[i]);
    } else {
      // 7-point weighted moving average
      const weights = [1, 2, 3, 4, 3, 2, 1];
      const totalWeight = 16;
      let smoothX = 0, smoothY = 0, smoothSpread = 0;
      
      for (let j = -3; j <= 3; j++) {
        const idx = i + j;
        const w = weights[j + 3];
        smoothX += rawPoints[idx].x * w;
        smoothY += rawPoints[idx].y * w;
        smoothSpread += rawPoints[idx].spread * w;
      }
      
      firstPass.push({ 
        x: smoothX / totalWeight, 
        y: smoothY / totalWeight, 
        spread: smoothSpread / totalWeight 
      });
    }
  }
  
  // Second pass - fine smoothing
  for (let i = 0; i < firstPass.length; i++) {
    if (i < 2 || i >= firstPass.length - 2) {
      corePoints.push(firstPass[i]);
    } else {
      // 5-point moving average for final polish
      const smoothX = (firstPass[i - 2].x + firstPass[i - 1].x * 2 + firstPass[i].x * 3 + firstPass[i + 1].x * 2 + firstPass[i + 2].x) / 9;
      const smoothY = (firstPass[i - 2].y + firstPass[i - 1].y * 2 + firstPass[i].y * 3 + firstPass[i + 1].y * 2 + firstPass[i + 2].y) / 9;
      const smoothSpread = (firstPass[i - 2].spread + firstPass[i - 1].spread * 2 + firstPass[i].spread * 3 + firstPass[i + 1].spread * 2 + firstPass[i + 2].spread) / 9;
      corePoints.push({ x: smoothX, y: smoothY, spread: smoothSpread });
    }
  }
  
  const middleLayer = Math.floor(layers / 2);
  
  // Generate lines that follow the core path
  for (let layer = 0; layer < layers; layer++) {
    const distanceFromCore = layer - middleLayer;
    const normalizedDistance = distanceFromCore / middleLayer;
    
    // Collect all points for this layer first
    const layerPoints = [];
    
    for (let i = 0; i < corePoints.length; i++) {
      const point = corePoints[i];
      const t = i / (corePoints.length - 1);
      
      // Calculate perpendicular offset using extremely smooth tangent calculation
      let tangentX = 0;
      let tangentY = 1;
      
      // Use ultra-wide window for perfect smoothness (15-point stencil)
      if (i >= 8 && i < corePoints.length - 8) {
        // 15-point weighted central difference for absolute maximum smoothness
        tangentX = (corePoints[i + 8].x - corePoints[i - 8].x) / 16;
        tangentY = (corePoints[i + 8].y - corePoints[i - 8].y) / 16;
      } else if (i >= 5 && i < corePoints.length - 5) {
        // 9-point fallback
        tangentX = (corePoints[i + 5].x - corePoints[i - 5].x) / 10;
        tangentY = (corePoints[i + 5].y - corePoints[i - 5].y) / 10;
      } else if (i >= 3 && i < corePoints.length - 3) {
        // 5-point fallback
        tangentX = (corePoints[i + 3].x - corePoints[i - 3].x) / 6;
        tangentY = (corePoints[i + 3].y - corePoints[i - 3].y) / 6;
      } else if (i >= 2 && i < corePoints.length - 2) {
        // 3-point fallback
        tangentX = (corePoints[i + 2].x - corePoints[i - 2].x) / 4;
        tangentY = (corePoints[i + 2].y - corePoints[i - 2].y) / 4;
      } else if (i < corePoints.length - 1) {
        tangentX = corePoints[i + 1].x - point.x;
        tangentY = corePoints[i + 1].y - point.y;
      } else if (i > 0) {
        tangentX = point.x - corePoints[i - 1].x;
        tangentY = point.y - corePoints[i - 1].y;
      }
      
      // Normalize tangent
      const tangentLength = Math.sqrt(tangentX * tangentX + tangentY * tangentY);
      if (tangentLength > 0) {
        tangentX /= tangentLength;
        tangentY /= tangentLength;
      }
      
      // Perpendicular vector
      const perpX = -tangentY;
      const perpY = tangentX;
      
      // Use phase offset for minimal variation (reduce jitter)
      const phaseOffset = phaseOffsets[layer] !== undefined ? phaseOffsets[layer] : 0;
      const phaseVariation = Math.sin(t * Math.PI * 4 + phaseOffset) * 0.02; // Minimal variation for smoothness
      
      // DYNAMIC SPACING - this is the key difference!
      // Base spacing multiplied by spread factor creates dramatic gaps/compression
      const baseSpacing = 8; // Base distance between lines
      const dynamicSpacing = baseSpacing * point.spread * (1 + phaseVariation);
      
      // TAPERING - converge to a point at start and end
      // Create smooth fade-in and fade-out at the edges
      const taperLength = 0.15; // 15% taper at each end
      let taperFactor = 1.0;
      
      if (t < taperLength) {
        // Smooth fade-in at start (ease-in-out cubic)
        const taperT = t / taperLength;
        taperFactor = taperT * taperT * (3 - 2 * taperT);
      } else if (t > 1 - taperLength) {
        // Smooth fade-out at end (ease-in-out cubic)
        const taperT = (1 - t) / taperLength;
        taperFactor = taperT * taperT * (3 - 2 * taperT);
      }
      
      // Calculate offset using dynamic spacing with tapering
      const offsetDistance = distanceFromCore * dynamicSpacing * taperFactor;
      
      // Calculate final position with offsets
      const x = point.x + perpX * offsetDistance + horizontalOffset;
      const y = point.y + perpY * offsetDistance;
      
      layerPoints.push({ x, y });
    }
    
    // Build ultra-smooth path using Catmull-Rom to Bezier conversion
    let path = `M ${layerPoints[0].x} ${layerPoints[0].y}`;
    
    for (let i = 0; i < layerPoints.length - 1; i++) {
      // Get surrounding points for Catmull-Rom interpolation
      const p0 = i > 0 ? layerPoints[i - 1] : layerPoints[i];
      const p1 = layerPoints[i];
      const p2 = layerPoints[i + 1];
      const p3 = i < layerPoints.length - 2 ? layerPoints[i + 2] : layerPoints[i + 1];
      
      // Catmull-Rom to Cubic Bezier conversion with tension 0.5 for maximum smoothness
      // This creates a curve that passes through p1 and p2 smoothly
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    
    paths += `<path d="${path}" stroke="${color}" stroke-width="${strokeWidth}" fill="none" opacity="${opacity}" stroke-linecap="round" stroke-linejoin="round" shape-rendering="geometricPrecision" vector-effect="non-scaling-stroke"/>`;
  }
  
  return paths;
};

