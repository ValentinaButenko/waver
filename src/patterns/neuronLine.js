import { seededRandom } from './utils';

// Neuron Line Pattern Generator - Neuron trees growing from dots on a baseline
export const generateNeuronLine = (settings, seed = Math.random()) => {
  const { 
    width, 
    height, 
    strokeWidth = 1.5, 
    color = '#4300B0',
    nodeColor = '#4300B0',
    opacity = 1.0,
    nodes = 8,            // Number of nodes on the line
    depth = 4,            // Branching depth
    spread = 0.8,         // How spread out the branches are (0-1)
    curvature = 0.3,      // How curved the branches are (0-1)
    nodeSize = 3,         // Size of dots
    branchProbability = 0.7, // Probability of sub-branching
    branches = 3,         // Number of branches per node
    baselineAmplitude = 0.08, // Amplitude of the baseline wave (0-1, relative to height)
    verticalOffset = 0,
    horizontalOffset = 0,
    customPath
  } = settings;
  
  // Create seeded random function
  const random = seededRandom(seed * 4294967296);
  
  let paths = '';
  
  let baselinePoints = [];
  
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
    const numPoints = 200;
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
    
    // Apply offsets to custom path baseline points
    baselinePoints = resampledPath.map(point => ({
      x: point.x + horizontalOffset,
      y: point.y + verticalOffset
    }));
  } else {
    // Calculate baseline position - centered vertically
    const linePosition = 0.5;
    const baselineY = height * linePosition + verticalOffset;
    const lineStartX = width * 0.1 + horizontalOffset;
    const lineEndX = width * 0.9 + horizontalOffset;
    const lineLength = lineEndX - lineStartX;
    
    // Generate spline baseline
    const numBaselinePoints = 200; // High resolution for smooth curve
    
    for (let i = 0; i < numBaselinePoints; i++) {
      const t = i / (numBaselinePoints - 1);
      const x = lineStartX + lineLength * t;
      
      // Create gentle wave motion for the baseline
      const waveAmplitude = height * baselineAmplitude; // Adjust curve intensity
      const y = baselineY + Math.sin(t * Math.PI * 2) * waveAmplitude * Math.sin(t * Math.PI);
      
      baselinePoints.push({ x, y });
    }
  }
  
  // Build smooth baseline path using Catmull-Rom spline
  let baselinePath = `M ${baselinePoints[0].x} ${baselinePoints[0].y}`;
  
  for (let i = 0; i < baselinePoints.length - 1; i++) {
    const p0 = i > 0 ? baselinePoints[i - 1] : baselinePoints[i];
    const p1 = baselinePoints[i];
    const p2 = baselinePoints[i + 1];
    const p3 = i < baselinePoints.length - 2 ? baselinePoints[i + 2] : baselinePoints[i + 1];
    
    // Catmull-Rom to Cubic Bezier conversion
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    
    baselinePath += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  
  // Draw the spline baseline
  paths += `<path d="${baselinePath}" stroke="${color}" stroke-width="${strokeWidth * 1.5}" fill="none" opacity="${opacity}" stroke-linecap="round" stroke-linejoin="round"/>`;
  
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
      const numSubBranches = generation === 0 ? branches : (random() > 0.5 ? 2 : 3);
      const newLength = length * (0.6 + random() * 0.2);
      const angleSpread = (Math.PI / 3) * spread;
      
      for (let i = 0; i < numSubBranches; i++) {
        const branchAngle = finalAngle + (i - (numSubBranches - 1) / 2) * angleSpread + (random() - 0.5) * 0.4;
        generateBranch(endX, endY, branchAngle, newLength, generation + 1, parentColor);
      }
    }
  };
  
  // Place nodes along the spline baseline and grow branches upward
  for (let i = 0; i < nodes; i++) {
    const t = i / (nodes - 1);
    
    // Find position along the spline curve
    const splineIndex = t * (baselinePoints.length - 1);
    const index1 = Math.floor(splineIndex);
    const index2 = Math.min(index1 + 1, baselinePoints.length - 1);
    const fraction = splineIndex - index1;
    
    // Interpolate between points
    const nodeX = baselinePoints[index1].x + (baselinePoints[index2].x - baselinePoints[index1].x) * fraction;
    const nodeY = baselinePoints[index1].y + (baselinePoints[index2].y - baselinePoints[index1].y) * fraction;
    
    // Calculate tangent to the spline for proper branch orientation
    let tangentX = 1, tangentY = 0;
    if (index2 < baselinePoints.length - 1 && index1 > 0) {
      tangentX = baselinePoints[index2].x - baselinePoints[index1].x;
      tangentY = baselinePoints[index2].y - baselinePoints[index1].y;
    }
    const tangentLength = Math.sqrt(tangentX * tangentX + tangentY * tangentY);
    if (tangentLength > 0) {
      tangentX /= tangentLength;
      tangentY /= tangentLength;
    }
    
    // Calculate perpendicular (normal) vector - points upward from the curve
    let normalX = -tangentY;
    let normalY = tangentX;
    
    // Randomly decide growth direction: upward or downward
    const growUpward = random() > 0.5;
    if (!growUpward) {
      // Flip the normal to point downward
      normalX = -normalX;
      normalY = -normalY;
    }
    
    // Draw node on the baseline
    paths += `<circle cx="${nodeX}" cy="${nodeY}" r="${nodeSize * 1.5}" fill="${nodeColor}" opacity="${opacity}"/>`;
    
    // Generate branches growing perpendicular to the curve (following the normal)
    for (let b = 0; b < branches; b++) {
      // Calculate base angle from the normal vector
      const baseAngle = Math.atan2(normalY, normalX);
      const angleOffset = (b - (branches - 1) / 2) * (Math.PI / 6) * spread;
      const angle = baseAngle + angleOffset + (random() - 0.5) * 0.3;
      
      const initialLength = Math.min(width, height) * 0.12 * (0.8 + random() * 0.4);
      
      generateBranch(nodeX, nodeY, angle, initialLength, 0, color);
    }
  }
  
  return paths;
};

