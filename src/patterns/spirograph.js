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
    depth = 50,           // Depth spacing between layers (Z-axis)
    rotation = 0,         // Overall rotation in degrees
    rotateX = 0,          // 3D rotation around X-axis
    rotateY = 0,          // 3D rotation around Y-axis
    scale = 1.0,          // Scale factor
    verticalOffset = 0,
    horizontalOffset = 0
  } = settings;
  
  const centerX = width / 2 + horizontalOffset;
  const centerY = height / 2 + verticalOffset;
  
  // Convert rotation angles to radians
  const rotateXRad = (rotateX * Math.PI) / 180;
  const rotateYRad = (rotateY * Math.PI) / 180;
  const perspective = 1200; // Perspective distance for 3D projection (lower = more dramatic)
  
  // 3D transformation function
  const apply3DTransform = (x, y, z = 0) => {
    // Rotate around X-axis
    let y1 = y * Math.cos(rotateXRad) - z * Math.sin(rotateXRad);
    let z1 = y * Math.sin(rotateXRad) + z * Math.cos(rotateXRad);
    
    // Rotate around Y-axis
    let x1 = x * Math.cos(rotateYRad) + z1 * Math.sin(rotateYRad);
    let z2 = -x * Math.sin(rotateYRad) + z1 * Math.cos(rotateYRad);
    
    // Apply perspective projection
    const scale3D = perspective / (perspective - z2);
    return {
      x: x1 * scale3D,
      y: y1 * scale3D,
      z: z2
    };
  };
  
  let pathsData = []; // Store paths with their z-depth for sorting
  
  // Generate multiple curves with rotational offset
  for (let curveIndex = 0; curveIndex < curves; curveIndex++) {
    const curveRotation = (curveIndex * (360 / curves)) + rotation;
    const radians = (curveRotation * Math.PI) / 180;
    
    // For each curve, generate multiple layers (lines)
    for (let layer = 0; layer < layers; layer++) {
      const points = [];
      const numPoints = 800; // High resolution for smooth curves
      
      // Calculate Z position for this layer (creates depth)
      const layerZ = (layer - layers / 2) * depth; // Spread layers in Z-space
      
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
        
        // Apply 3D transformation
        const transformed3D = apply3DTransform(rotatedX, rotatedY, layerZ);
        
        points.push({
          x: centerX + transformed3D.x,
          y: centerY + transformed3D.y,
          z: transformed3D.z
        });
      }
      
      // Build path from points
      if (points.length > 0) {
        let path = `M ${points[0].x} ${points[0].y}`;
        
        // Calculate average Z depth for this path (for sorting)
        let avgZ = 0;
        for (const point of points) {
          avgZ += point.z;
        }
        avgZ /= points.length;
        
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
        
        // Vary opacity based on depth and layer for enhanced 3D effect
        const baseLayerOpacity = opacity * (0.3 + (layer / layers) * 0.7);
        // Reduce opacity for paths further away (lower z values)
        const depthOpacity = 0.5 + (avgZ / (layers * depth)) * 0.5; // Further = more transparent
        const finalOpacity = baseLayerOpacity * Math.max(0.3, Math.min(1, depthOpacity));
        
        // Store path with its z-depth
        pathsData.push({
          z: avgZ,
          svg: `<path d="${path}" stroke="${color}" stroke-width="${strokeWidth}" fill="none" opacity="${finalOpacity}" stroke-linecap="round" stroke-linejoin="round" shape-rendering="geometricPrecision"/>`
        });
      }
    }
  }
  
  // Sort paths by z-depth (furthest to nearest - painter's algorithm)
  pathsData.sort((a, b) => a.z - b.z);
  
  // Combine sorted paths into final SVG string
  let paths = '';
  for (const pathData of pathsData) {
    paths += pathData.svg;
  }
  
  return paths;
};

