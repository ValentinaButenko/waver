import { seededRandom } from './utils';

// Sphere Flow Pattern Generator - Horizontal lines with wave-like distortions
export const generateSphereFlow = (settings, seed = Math.random()) => {
  const { 
    width, 
    height, 
    strokeWidth = 1, 
    color = '#000000',
    opacity = 1.0,
    lines = 40,                  // Number of horizontal lines
    distortionStrength = 60,     // How much to distort the lines
    distortionFrequency = 3,     // Frequency of distortion waves
    noiseScale = 0.8,            // Scale of noise/randomness
    smoothness = 0.7,            // How smooth the distortion is (0-1)
    verticalOffset = 0,
    horizontalOffset = 0
  } = settings;
  
  // Create seeded random function
  const random = seededRandom(seed * 4294967296);
  
  let paths = '';
  
  // Generate wave centers (invisible distortion sources)
  const waveCount = Math.floor(2 + random() * 3); // 2-4 waves
  const waves = [];
  for (let i = 0; i < waveCount; i++) {
    waves.push({
      x: width * (0.2 + random() * 0.6),
      y: height * (0.2 + random() * 0.6),
      radiusX: width * (0.15 + random() * 0.25),
      radiusY: height * (0.15 + random() * 0.25),
      strength: distortionStrength * (0.8 + random() * 0.4) * noiseScale,
      phase: random() * Math.PI * 2
    });
  }
  
  // Simple noise function for additional texture
  const noise = (x, y, lineIndex) => {
    const n1 = Math.sin(x * 2.1 + y * 1.3 + lineIndex * 0.7);
    const n2 = Math.cos(x * 1.5 - y * 2.3 + lineIndex * 0.5);
    const n3 = Math.sin(y * 1.8 + x * 2.2 + lineIndex * 0.3);
    return (n1 + n2 + n3) / 3;
  };
  
  // Generate horizontal lines with wave distortions
  for (let lineIndex = 0; lineIndex < lines; lineIndex++) {
    const baseY = (lineIndex / (lines - 1)) * height + verticalOffset;
    const points = [];
    const numPoints = 300; // High resolution for smooth curves
    
    // Generate points along the horizontal line with wave distortion
    for (let i = 0; i < numPoints; i++) {
      const t = i / (numPoints - 1);
      const x = t * width + horizontalOffset;
      let y = baseY;
      
      // Apply distortion from all wave centers
      for (const wave of waves) {
        const dx = x - wave.x;
        const dy = baseY - wave.y;
        const distance = Math.sqrt((dx * dx) / (wave.radiusX * wave.radiusX) + 
                                   (dy * dy) / (wave.radiusY * wave.radiusY));
        
        // Create smooth wave influence (Gaussian-like falloff)
        if (distance < 1.5) {
          const influence = Math.exp(-(distance * distance) / (2 * smoothness * smoothness));
          
          // Create wave pattern with multiple frequencies
          const wavePattern = Math.sin(distance * Math.PI * distortionFrequency + wave.phase) * influence;
          
          // Displace vertically based on wave pattern
          y += wavePattern * wave.strength;
        }
      }
      
      // Add subtle noise for organic texture (reduced influence)
      const noiseValue = noise(x * 0.01, baseY * 0.01, lineIndex);
      y += noiseValue * distortionStrength * 0.1 * (1 - smoothness);
      
      points.push({ x, y });
    }
    
    // Smooth the points with a light pass to reduce jitter
    const smoothedPoints = [];
    for (let i = 0; i < points.length; i++) {
      if (i < 2 || i >= points.length - 2) {
        smoothedPoints.push(points[i]);
      } else {
        // Simple 5-point moving average
        const smoothX = (points[i - 2].x + points[i - 1].x * 2 + points[i].x * 3 + 
                        points[i + 1].x * 2 + points[i + 2].x) / 9;
        const smoothY = (points[i - 2].y + points[i - 1].y * 2 + points[i].y * 3 + 
                        points[i + 1].y * 2 + points[i + 2].y) / 9;
        smoothedPoints.push({ x: smoothX, y: smoothY });
      }
    }
    
    // Build smooth path using Catmull-Rom spline
    if (smoothedPoints.length > 0) {
      let path = `M ${smoothedPoints[0].x} ${smoothedPoints[0].y}`;
      
      for (let i = 0; i < smoothedPoints.length - 1; i++) {
        const p0 = i > 0 ? smoothedPoints[i - 1] : smoothedPoints[i];
        const p1 = smoothedPoints[i];
        const p2 = smoothedPoints[i + 1];
        const p3 = i < smoothedPoints.length - 2 ? smoothedPoints[i + 2] : smoothedPoints[i + 1];
        
        // Catmull-Rom to Cubic Bezier conversion
        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;
        
        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
      }
      
      paths += `<path d="${path}" stroke="${color}" stroke-width="${strokeWidth}" fill="none" opacity="${opacity}" stroke-linecap="round" stroke-linejoin="round" shape-rendering="geometricPrecision"/>`;
    }
  }
  
  return paths;
};

