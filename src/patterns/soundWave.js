import { seededRandom } from './utils';

// Sound Wave Pattern Generator - Dotted waveform visualization
export const generateSoundWave = (settings, seed = Math.random()) => {
  const { 
    width, 
    height, 
    strokeWidth = 2,
    color = '#FFFFFF',
    opacity = 1.0,
    columns = 200,         // Number of vertical dot columns
    dotSize = 2,           // Size of individual dots
    dotSpacing = 4,        // Spacing between dots in a column
    amplitude = 0.4,       // Wave amplitude (0-1, relative to height)
    frequency = 2,         // Wave frequency
    waveforms = 1,         // Number of waveforms to show
    symmetrical = true,    // Mirror the waveform vertically
    verticalOffset = 0,
    horizontalOffset = 0
  } = settings;
  
  // Create seeded random function for variation
  const random = seededRandom(seed * 4294967296);
  
  let paths = '';
  const centerY = height / 2 + verticalOffset;
  const columnWidth = width / columns;
  
  // Generate each waveform
  for (let waveIndex = 0; waveIndex < waveforms; waveIndex++) {
    const waveOffset = (waveIndex / Math.max(1, waveforms - 1) - 0.5) * width * 0.6;
    const phaseShift = (waveIndex * Math.PI * 2) / waveforms;
    
    // Generate vertical columns of dots
    for (let col = 0; col < columns; col++) {
      const x = (col / columns) * width + horizontalOffset + waveOffset;
      
      // Skip if column is outside the canvas
      if (x < 0 || x > width) continue;
      
      const t = col / columns;
      
      // Calculate waveform height at this position
      // Use combination of sine waves for more organic sound wave effect
      const wave1 = Math.sin(t * Math.PI * frequency * 2 + phaseShift);
      const wave2 = Math.sin(t * Math.PI * frequency * 4 + phaseShift * 0.5) * 0.3;
      const wave3 = Math.sin(t * Math.PI * frequency * 8 + phaseShift * 0.25) * 0.15;
      const waveValue = wave1 + wave2 + wave3;
      
      // Apply amplitude envelope (fade in/out at edges)
      const edgeFade = Math.sin(t * Math.PI);
      const waveHeight = (height * amplitude * waveValue * edgeFade) / 2;
      
      // Add slight random variation for organic feel
      const randomVariation = (random() - 0.5) * dotSpacing * 0.3;
      
      if (symmetrical) {
        // Draw dots symmetrically above and below center
        const maxDots = Math.ceil(Math.abs(waveHeight) / dotSpacing);
        
        for (let dot = 0; dot < maxDots; dot++) {
          const dotY = centerY - (dot * dotSpacing) - dotSpacing / 2;
          const dotYMirror = centerY + (dot * dotSpacing) + dotSpacing / 2;
          
          // Fade dots at the edges of the waveform
          const dotFade = 1 - (dot / maxDots) * 0.3;
          const currentDotSize = dotSize * dotFade;
          const currentOpacity = opacity * dotFade;
          
          // Upper dots
          if (Math.abs(centerY - dotY) <= Math.abs(waveHeight)) {
            paths += `<circle cx="${x + randomVariation}" cy="${dotY}" r="${currentDotSize}" fill="${color}" opacity="${currentOpacity}"/>`;
          }
          
          // Lower dots (mirrored)
          if (Math.abs(dotYMirror - centerY) <= Math.abs(waveHeight)) {
            paths += `<circle cx="${x + randomVariation}" cy="${dotYMirror}" r="${currentDotSize}" fill="${color}" opacity="${currentOpacity}"/>`;
          }
        }
      } else {
        // Draw dots from center upward or downward based on wave direction
        const maxDots = Math.ceil(Math.abs(waveHeight) / dotSpacing);
        const direction = waveHeight >= 0 ? -1 : 1;
        
        for (let dot = 0; dot < maxDots; dot++) {
          const dotY = centerY + (direction * dot * dotSpacing) + (direction * dotSpacing / 2);
          
          // Fade dots at the edges
          const dotFade = 1 - (dot / maxDots) * 0.3;
          const currentDotSize = dotSize * dotFade;
          const currentOpacity = opacity * dotFade;
          
          paths += `<circle cx="${x + randomVariation}" cy="${dotY}" r="${currentDotSize}" fill="${color}" opacity="${currentOpacity}"/>`;
        }
      }
      
      // Add center dot for reference
      paths += `<circle cx="${x}" cy="${centerY}" r="${dotSize * 0.6}" fill="${color}" opacity="${opacity * 0.5}"/>`;
    }
  }
  
  return paths;
};

