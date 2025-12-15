// Sphere Pattern Generator - 3D sphere with flowing wave curves
export const generateSphere = (settings, seed = Math.random()) => {
  const { 
    width, 
    height, 
    strokeWidth = 1, 
    color = '#FFFFFF',
    opacity = 1.0,
    layers = 30,          // Number of horizontal wave lines
    meridians = 20,       // Number of vertical lines (longitude)
    radius = 200,         // Sphere radius
    waveAmplitude = 0.15, // Wave amplitude as fraction of radius
    waveFrequency = 4,    // Wave frequency
    rotateX = 0,          // Rotation around X-axis
    rotateY = 0,          // Rotation around Y-axis
    rotateZ = 0,          // Rotation around Z-axis
    verticalOffset = 0,
    horizontalOffset = 0
  } = settings;
  
  const centerX = width / 2 + horizontalOffset;
  const centerY = height / 2 + verticalOffset;
  
  // Convert rotation angles to radians
  const rotateXRad = (rotateX * Math.PI) / 180;
  const rotateYRad = (rotateY * Math.PI) / 180;
  const rotateZRad = (rotateZ * Math.PI) / 180;
  const perspective = 1500; // Perspective distance for 3D projection
  
  // 3D transformation function with full rotation support
  const apply3DTransform = (x, y, z) => {
    // Rotate around X-axis
    let y1 = y * Math.cos(rotateXRad) - z * Math.sin(rotateXRad);
    let z1 = y * Math.sin(rotateXRad) + z * Math.cos(rotateXRad);
    
    // Rotate around Y-axis
    let x1 = x * Math.cos(rotateYRad) + z1 * Math.sin(rotateYRad);
    let z2 = -x * Math.sin(rotateYRad) + z1 * Math.cos(rotateYRad);
    
    // Rotate around Z-axis
    let x2 = x1 * Math.cos(rotateZRad) - y1 * Math.sin(rotateZRad);
    let y2 = x1 * Math.sin(rotateZRad) + y1 * Math.cos(rotateZRad);
    
    // Apply perspective projection
    const scale3D = perspective / (perspective - z2);
    return {
      x: x2 * scale3D,
      y: y2 * scale3D,
      z: z2,
      visible: z2 > -perspective * 0.8 // Only render if not too far behind
    };
  };
  
  let pathsData = []; // Store paths with their z-depth for sorting
  
  // Generate horizontal wave lines (latitude lines with waves)
  for (let i = 0; i < layers; i++) {
    const phi = (i / (layers - 1)) * Math.PI; // 0 to PI (top to bottom)
    const points = [];
    const numPoints = 200; // High resolution for smooth curves
    
    for (let j = 0; j <= numPoints; j++) {
      const theta = (j / numPoints) * Math.PI * 2; // 0 to 2PI (around)
      
      // Base spherical coordinates
      const baseR = radius * Math.sin(phi);
      const baseY = radius * Math.cos(phi);
      
      // Add wave distortion based on theta and phi (only if waveAmplitude > 0)
      const wave = waveAmplitude > 0 ? Math.sin(theta * waveFrequency + phi * 2) * radius * waveAmplitude : 0;
      const r = baseR + wave;
      
      // Convert to Cartesian coordinates
      const x = r * Math.cos(theta);
      const z = r * Math.sin(theta);
      const y = baseY;
      
      // Apply 3D transformation
      const transformed = apply3DTransform(x, y, z);
      
      if (transformed.visible) {
        points.push({
          x: centerX + transformed.x,
          y: centerY + transformed.y,
          z: transformed.z
        });
      }
    }
    
    // Build path from points
    if (points.length > 3) {
      let path = `M ${points[0].x} ${points[0].y}`;
      
      // Calculate average Z depth for sorting
      let avgZ = points.reduce((sum, p) => sum + p.z, 0) / points.length;
      
      // Use Catmull-Rom spline for smooth curves
      for (let k = 0; k < points.length - 1; k++) {
        const p0 = k > 0 ? points[k - 1] : points[k];
        const p1 = points[k];
        const p2 = points[k + 1];
        const p3 = k < points.length - 2 ? points[k + 2] : points[k + 1];
        
        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;
        
        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
      }
      
      // Vary opacity based on depth for 3D effect
      const depthOpacity = 0.4 + (avgZ / (radius * 2)) * 0.6;
      const finalOpacity = opacity * Math.max(0.2, Math.min(1, depthOpacity));
      
      pathsData.push({
        z: avgZ,
        svg: `<path d="${path}" stroke="${color}" stroke-width="${strokeWidth}" fill="none" opacity="${finalOpacity}" stroke-linecap="round" stroke-linejoin="round"/>`
      });
    }
  }
  
  // Generate meridian lines (longitude lines with waves)
  for (let i = 0; i < meridians; i++) {
    const theta = (i / meridians) * Math.PI * 2; // 0 to 2PI (around)
    const points = [];
    const numPoints = 150;
    
    for (let j = 0; j <= numPoints; j++) {
      const phi = (j / numPoints) * Math.PI; // 0 to PI (top to bottom)
      
      // Base spherical coordinates
      const baseR = radius * Math.sin(phi);
      const baseY = radius * Math.cos(phi);
      
      // Add wave distortion (only if waveAmplitude > 0)
      const wave = waveAmplitude > 0 ? Math.sin(phi * waveFrequency + theta * 3) * radius * waveAmplitude : 0;
      const r = baseR + wave;
      
      // Convert to Cartesian coordinates
      const x = r * Math.cos(theta);
      const z = r * Math.sin(theta);
      const y = baseY;
      
      // Apply 3D transformation
      const transformed = apply3DTransform(x, y, z);
      
      if (transformed.visible) {
        points.push({
          x: centerX + transformed.x,
          y: centerY + transformed.y,
          z: transformed.z
        });
      }
    }
    
    // Build path from points
    if (points.length > 3) {
      let path = `M ${points[0].x} ${points[0].y}`;
      
      // Calculate average Z depth
      let avgZ = points.reduce((sum, p) => sum + p.z, 0) / points.length;
      
      // Use Catmull-Rom spline
      for (let k = 0; k < points.length - 1; k++) {
        const p0 = k > 0 ? points[k - 1] : points[k];
        const p1 = points[k];
        const p2 = points[k + 1];
        const p3 = k < points.length - 2 ? points[k + 2] : points[k + 1];
        
        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;
        
        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
      }
      
      // Vary opacity based on depth
      const depthOpacity = 0.4 + (avgZ / (radius * 2)) * 0.6;
      const finalOpacity = opacity * Math.max(0.2, Math.min(1, depthOpacity));
      
      pathsData.push({
        z: avgZ,
        svg: `<path d="${path}" stroke="${color}" stroke-width="${strokeWidth}" fill="none" opacity="${finalOpacity}" stroke-linecap="round" stroke-linejoin="round"/>`
      });
    }
  }
  
  // Sort paths by z-depth (painter's algorithm - furthest first)
  pathsData.sort((a, b) => a.z - b.z);
  
  // Combine sorted paths
  let paths = '';
  for (const pathData of pathsData) {
    paths += pathData.svg;
  }
  
  return paths;
};

