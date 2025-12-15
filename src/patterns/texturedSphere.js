import { seededRandom } from './utils';

// Textured Sphere Pattern Generator - 3D sphere with particle/dot texture
export const generateTexturedSphere = (settings, seed = Math.random()) => {
  const { 
    width, 
    height, 
    strokeWidth = 2, 
    color = '#FFFFFF',
    opacity = 1.0,
    dotDensity = 2500,     // Number of dots to generate
    radius = 250,          // Sphere radius
    dotSizeMin = 1,        // Minimum dot size
    dotSizeMax = 4,        // Maximum dot size
    noiseScale = 0.15,     // Texture/noise amplitude (0-1)
    noiseFrequency = 3,    // Texture frequency
    waveAmplitude = 0.08,  // Overall wave distortion
    waveFrequency = 4,     // Wave frequency for flowing effect
    rotateX = 0,           // Rotation around X-axis
    rotateY = 0,           // Rotation around Y-axis
    rotateZ = 0,           // Rotation around Z-axis
    verticalOffset = 0,
    horizontalOffset = 0
  } = settings;
  
  // Create seeded random function
  const random = seededRandom(seed * 4294967296);
  
  const centerX = width / 2 + horizontalOffset;
  const centerY = height / 2 + verticalOffset;
  
  // Convert rotation angles to radians
  const rotateXRad = (rotateX * Math.PI) / 180;
  const rotateYRad = (rotateY * Math.PI) / 180;
  const rotateZRad = (rotateZ * Math.PI) / 180;
  const perspective = 1500; // Perspective distance for 3D projection
  
  // Simple 3D noise function (Perlin-like)
  const noise3D = (x, y, z) => {
    // Simplified noise using sine functions
    const a = Math.sin(x * 2.1 + y * 1.3) * Math.cos(z * 1.7);
    const b = Math.cos(x * 1.5 - z * 2.3) * Math.sin(y * 1.9);
    const c = Math.sin(z * 1.8 + x * 2.2) * Math.cos(y * 1.4);
    return (a + b + c) / 3;
  };
  
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
  
  let dotsData = []; // Store dots with their z-depth for sorting
  
  // Generate dots using Fibonacci sphere distribution for even coverage
  const goldenRatio = (1 + Math.sqrt(5)) / 2;
  const angleIncrement = Math.PI * 2 * goldenRatio;
  
  for (let i = 0; i < dotDensity; i++) {
    // Fibonacci sphere algorithm for uniform distribution
    const t = i / dotDensity;
    const phi = Math.acos(1 - 2 * t); // Latitude angle (0 to PI)
    const theta = angleIncrement * i; // Longitude angle
    
    // Convert spherical to Cartesian coordinates
    let x = radius * Math.sin(phi) * Math.cos(theta);
    let y = radius * Math.sin(phi) * Math.sin(theta);
    let z = radius * Math.cos(phi);
    
    // Add wave distortion based on position
    const waveNoise = Math.sin(theta * waveFrequency) * Math.cos(phi * waveFrequency * 0.5);
    const waveFactor = 1 + waveNoise * waveAmplitude;
    
    // Apply texture/noise displacement
    const noiseValue = noise3D(
      x * noiseFrequency / radius, 
      y * noiseFrequency / radius, 
      z * noiseFrequency / radius
    );
    const noiseFactor = 1 + noiseValue * noiseScale;
    
    // Combine wave and noise
    const finalRadius = radius * waveFactor * noiseFactor;
    x = finalRadius * Math.sin(phi) * Math.cos(theta);
    y = finalRadius * Math.sin(phi) * Math.sin(theta);
    z = finalRadius * Math.cos(phi);
    
    // Apply 3D transformation
    const transformed = apply3DTransform(x, y, z);
    
    if (transformed.visible) {
      // Calculate dot size based on depth (further = smaller) and noise
      const depthFactor = 0.6 + (transformed.z / (radius * 2)) * 0.4;
      const sizeFactor = 0.8 + noiseValue * 0.4; // Vary size based on noise
      const dotSize = (dotSizeMin + (dotSizeMax - dotSizeMin) * depthFactor) * sizeFactor;
      
      // Calculate opacity based on depth and density
      const depthOpacity = 0.3 + (transformed.z / (radius * 2)) * 0.7;
      const noiseOpacity = 0.7 + noiseValue * 0.3;
      const finalOpacity = opacity * Math.max(0.2, Math.min(1, depthOpacity * noiseOpacity));
      
      dotsData.push({
        x: centerX + transformed.x,
        y: centerY + transformed.y,
        z: transformed.z,
        size: dotSize,
        opacity: finalOpacity
      });
    }
  }
  
  // Sort dots by z-depth (painter's algorithm - furthest first)
  dotsData.sort((a, b) => a.z - b.z);
  
  // Generate SVG circles for all dots
  let paths = '';
  for (const dot of dotsData) {
    paths += `<circle cx="${dot.x}" cy="${dot.y}" r="${dot.size}" fill="${color}" opacity="${dot.opacity}"/>`;
  }
  
  return paths;
};

