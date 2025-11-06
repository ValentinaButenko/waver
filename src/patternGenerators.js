// Simple seeded random number generator (mulberry32)
const seededRandom = (seed) => {
  return () => {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
};

// Neurons Pattern Generator - Neural Network with Branching Dendrites
export const generateNeurons = (settings, seed = Math.random()) => {
  const { 
    width, 
    height, 
    strokeWidth = 1.5, 
    color = '#4300B0',
    nodeColor = '#4300B0',
    opacity = 1.0,
    branches = 12,        // Number of main branches
    depth = 4,            // Branching depth
    spread = 0.8,         // How spread out the branches are (0-1)
    curvature = 0.3,      // How curved the branches are (0-1)
    nodeSize = 3,         // Size of endpoint dots
    branchProbability = 0.7, // Probability of sub-branching
    verticalOffset = 0,
    horizontalOffset = 0
  } = settings;
  
  // Create seeded random function
  const random = seededRandom(seed * 4294967296);
  
  let paths = '';
  const centerX = width / 2 + horizontalOffset;
  const centerY = height / 2 + verticalOffset;
  
  // Helper function to generate a bezier curve branch
  const generateBranch = (startX, startY, angle, length, generation, parentColor) => {
    if (generation > depth || length < 5) return;
    
    // Add some organic variation
    const angleVariation = (random() - 0.5) * Math.PI * curvature;
    const finalAngle = angle + angleVariation;
    
    // Calculate control points for bezier curve
    const segmentLength = length / 3;
    
    // Control point 1 - near start, follows initial angle with slight deviation
    const cp1Angle = angle + (random() - 0.5) * 0.3;
    const cp1x = startX + Math.cos(cp1Angle) * segmentLength;
    const cp1y = startY + Math.sin(cp1Angle) * segmentLength;
    
    // Control point 2 - near end, follows final angle
    const cp2Angle = finalAngle + (random() - 0.5) * 0.3;
    const cp2x = startX + Math.cos(finalAngle) * length - Math.cos(cp2Angle) * segmentLength;
    const cp2y = startY + Math.sin(finalAngle) * length - Math.sin(cp2Angle) * segmentLength;
    
    // End point
    const endX = startX + Math.cos(finalAngle) * length;
    const endY = startY + Math.sin(finalAngle) * length;
    
    // Vary stroke width by generation (thinner as we go deeper)
    const currentStrokeWidth = strokeWidth * Math.pow(0.7, generation);
    
    // Draw the branch curve
    const path = `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;
    paths += `<path d="${path}" stroke="${parentColor}" stroke-width="${currentStrokeWidth}" fill="none" opacity="${opacity}" stroke-linecap="round" stroke-linejoin="round"/>`;
    
    // Add a dot at the end if it's a terminal branch
    const shouldBranch = random() < branchProbability && generation < depth;
    
    if (!shouldBranch || generation === depth) {
      // Terminal node - draw a dot
      const currentNodeSize = nodeSize * Math.pow(0.85, generation);
      paths += `<circle cx="${endX}" cy="${endY}" r="${currentNodeSize}" fill="${nodeColor}" opacity="${opacity}"/>`;
    }
    
    // Continue branching
    if (shouldBranch) {
      const numSubBranches = generation === 0 ? 2 : (random() > 0.5 ? 2 : 3);
      const newLength = length * (0.6 + random() * 0.2);
      const angleSpread = (Math.PI / 3) * spread;
      
      for (let i = 0; i < numSubBranches; i++) {
        const branchAngle = finalAngle + (i - (numSubBranches - 1) / 2) * angleSpread + (random() - 0.5) * 0.4;
        generateBranch(endX, endY, branchAngle, newLength, generation + 1, parentColor);
      }
    }
  };
  
  // Generate main branches radiating from center
  for (let i = 0; i < branches; i++) {
    const angle = (i / branches) * Math.PI * 2;
    const initialLength = Math.min(width, height) * 0.15 * (0.8 + random() * 0.4);
    
    // Use the provided color - in future could support gradients
    generateBranch(centerX, centerY, angle, initialLength, 0, color);
  }
  
  // Add central node
  paths += `<circle cx="${centerX}" cy="${centerY}" r="${nodeSize * 1.5}" fill="${nodeColor}" opacity="${opacity}"/>`;
  
  return paths;
};

// Wave Pattern Generator - Flowing Ribbon Style with Dynamic Spreading
export const generateWave = (settings, phaseOffsets = []) => {
  const { width, height, amplitude, frequency, strokeWidth, color, opacity, layers, verticalOffset = 0, horizontalOffset = 0, customPath } = settings;
  let paths = '';
  
  let rawPoints = [];
  
  // Use custom path if provided, otherwise generate default
  if (customPath && customPath.length > 10) {
    // MULTI-PASS SMOOTHING for ultra-smooth custom paths
    let smoothedPath = [...customPath];
    
    // First pass: Apply aggressive Gaussian smoothing (2 passes for real-time performance)
    const smoothingPasses = 2;
    for (let pass = 0; pass < smoothingPasses; pass++) {
      const tempPath = [];
      const smoothingWindow = Math.min(15, Math.floor(smoothedPath.length / 8));
      
      for (let i = 0; i < smoothedPath.length; i++) {
        let sumX = 0, sumY = 0, totalWeight = 0;
        
        // Gaussian kernel with wider window for smoother results
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
    
    // Second pass: Resample using Catmull-Rom spline interpolation
    const numPoints = 800;
    const resampledPath = [];
    
    for (let i = 0; i < numPoints; i++) {
      const t = i / (numPoints - 1);
      const index = t * (smoothedPath.length - 1);
      const i1 = Math.floor(index);
      const i2 = Math.min(i1 + 1, smoothedPath.length - 1);
      const fraction = index - i1;
      
      // Get surrounding points for Catmull-Rom interpolation
      const i0 = Math.max(0, i1 - 1);
      const i3 = Math.min(smoothedPath.length - 1, i2 + 1);
      
      const p0 = smoothedPath[i0];
      const p1 = smoothedPath[i1];
      const p2 = smoothedPath[i2];
      const p3 = smoothedPath[i3];
      
      // Catmull-Rom spline interpolation (tension = 0.5 for maximum smoothness)
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
      
      resampledPath.push({ x, y });
    }
    
    // Third pass: Apply dynamic spread factor similar to generated patterns
    for (let i = 0; i < resampledPath.length; i++) {
      const point = resampledPath[i];
      const t = i / (resampledPath.length - 1);
      
      // Use the same dramatic spread factor as generated patterns
      // This creates the characteristic wave effect with gaps and compression
      const spreadFactor = 0.2 + Math.abs(Math.sin(t * Math.PI * frequency * 2.5)) * 2.5;
      
      rawPoints.push({ x: point.x, y: point.y, spread: spreadFactor });
    }
  } else {
    // Generate core path points - ULTRA HIGH density for perfect smoothness
    const numPoints = 800;
    const centerY = height / 2;
    
    // Pattern always spans the full canvas width
    // Generate raw points for HORIZONTAL flow (left to right)
    for (let i = 0; i < numPoints; i++) {
      const t = i / (numPoints - 1);
      const x = t * width;
      
      // Create flowing Y movement
      const y = centerY + Math.sin(t * Math.PI * frequency * 2) * amplitude * Math.sin(t * Math.PI * 1.5);
      
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
      const y = point.y + perpY * offsetDistance + verticalOffset;
      
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

// Spirograph Pattern Generator - Parametric curves creating flowing geometric patterns
export const generateSpirograph = (settings, seed = Math.random()) => {
  const { 
    width, 
    height, 
    strokeWidth = 1, 
    color = '#4300B0',
    opacity = 1.0,
    curves = 4,           // Number of overlapping curves
    layers = 60,          // Number of lines per curve
    R = 120,              // Radius of fixed circle
    r = 45,               // Radius of rolling circle
    d = 80,               // Distance from center of rolling circle
    rotation = 0,         // Overall rotation in degrees
    scale = 1.0,          // Scale factor
    verticalOffset = 0,
    horizontalOffset = 0
  } = settings;
  
  const centerX = width / 2 + horizontalOffset;
  const centerY = height / 2 + verticalOffset;
  
  let paths = '';
  
  // Generate multiple curves with rotational offset
  for (let curveIndex = 0; curveIndex < curves; curveIndex++) {
    const curveRotation = (curveIndex * (360 / curves)) + rotation;
    const radians = (curveRotation * Math.PI) / 180;
    
    // For each curve, generate multiple layers (lines)
    for (let layer = 0; layer < layers; layer++) {
      const points = [];
      const numPoints = 800; // High resolution for smooth curves
      
      // Generate parametric spirograph points
      for (let i = 0; i <= numPoints; i++) {
        const t = (i / numPoints) * Math.PI * 2 * 12; // 12 rotations for complex pattern
        
        // Spirograph/epitrochoid formula with layer offset
        const layerOffset = (layer / layers) * 0.3; // Slight variation per layer
        const rAdjusted = r * (1 + layerOffset);
        const dAdjusted = d * (1 + layerOffset);
        
        const x = (R + rAdjusted) * Math.cos(t) - dAdjusted * Math.cos(((R + rAdjusted) / rAdjusted) * t);
        const y = (R + rAdjusted) * Math.sin(t) - dAdjusted * Math.sin(((R + rAdjusted) / rAdjusted) * t);
        
        // Apply scale and rotation
        const scaledX = x * scale;
        const scaledY = y * scale;
        
        const rotatedX = scaledX * Math.cos(radians) - scaledY * Math.sin(radians);
        const rotatedY = scaledX * Math.sin(radians) + scaledY * Math.cos(radians);
        
        points.push({
          x: centerX + rotatedX,
          y: centerY + rotatedY
        });
      }
      
      // Build path from points
      if (points.length > 0) {
        let path = `M ${points[0].x} ${points[0].y}`;
        
        // Use Catmull-Rom spline for ultra-smooth curves
        for (let i = 0; i < points.length - 1; i++) {
          const p0 = i > 0 ? points[i - 1] : points[i];
          const p1 = points[i];
          const p2 = points[i + 1];
          const p3 = i < points.length - 2 ? points[i + 2] : points[i + 1];
          
          // Catmull-Rom to Cubic Bezier conversion
          const cp1x = p1.x + (p2.x - p0.x) / 6;
          const cp1y = p1.y + (p2.y - p0.y) / 6;
          const cp2x = p2.x - (p3.x - p1.x) / 6;
          const cp2y = p2.y - (p3.y - p1.y) / 6;
          
          path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
        }
        
        // Vary opacity slightly per layer for depth effect
        const layerOpacity = opacity * (0.3 + (layer / layers) * 0.7);
        
        paths += `<path d="${path}" stroke="${color}" stroke-width="${strokeWidth}" fill="none" opacity="${layerOpacity}" stroke-linecap="round" stroke-linejoin="round" shape-rendering="geometricPrecision"/>`;
      }
    }
  }
  
  return paths;
};

