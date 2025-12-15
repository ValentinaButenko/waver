import { seededRandom } from './utils';

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

