// Wave Pattern Generator
export const generateWave = (settings, phaseOffsets = []) => {
  const { width, height, amplitude, frequency, strokeWidth, color, opacity, layers, verticalOffset = 0 } = settings;
  let paths = '';
  
  for (let layer = 0; layer < layers; layer++) {
    const layerAmplitude = amplitude * (1 - layer * 0.2);
    const layerFrequency = frequency * (1 + layer * 0.3);
    const yOffset = (height / 2) + (layer * 30) + verticalOffset;
    
    // Use provided phase offset or generate a random one as fallback
    const phaseOffset = phaseOffsets[layer] !== undefined ? phaseOffsets[layer] : Math.random() * Math.PI * 2;
    
    // Start the path with the first calculated point
    const firstY = yOffset + Math.sin(phaseOffset) * layerAmplitude;
    let path = `M 0 ${firstY}`;
    
    for (let x = 5; x <= width; x += 5) {
      const y = yOffset + Math.sin((x * layerFrequency * 0.01) + phaseOffset) * layerAmplitude;
      path += ` L ${x} ${y}`;
    }
    
    paths += `<path d="${path}" stroke="${color}" stroke-width="${strokeWidth}" fill="none" opacity="${opacity}" stroke-linecap="round" style="animation-delay: ${layer * 0.05}s"/>`;
  }
  
  return paths;
};

