/**
 * Build script to convert JSON question banks to JS for local file:// usage
 * Run with: node build-for-local.js
 */

const fs = require('fs');
const path = require('path');

const questionFiles = [
  '100-brain/100.1-structure.json',
  '100-brain/100.2-meninges-csf.json',
  '100-brain/100.3-cortex.json',
  '100-brain/100.4-brainstem.json',
  '200-nerves/200.1-spinal.json',
  '200-nerves/200.2-receptors.json',
  '200-nerves/200.3-plexuses.json',
  '200-nerves/200.4-reflexes.json',
  '200-nerves/200.5-cranial-nerves.json',
  '200-nerves/200.6-autonomic-nervous-system.json',
  '300-foundations/300.1-organization.json',
  '300-foundations/300.2-chemistry.json',
  '300-foundations/300.3-cells.json',
  '300-foundations/300.4-membranes.json',
  '400-tissues/400.1-epithelial.json',
  '400-tissues/400.2-connective.json',
  '400-tissues/400.3-glands.json'
];

const baseDir = __dirname;

questionFiles.forEach(file => {
  const jsonPath = path.join(baseDir, file);
  const jsPath = jsonPath.replace('.json', '.js');

  // Extract variable name from file (e.g., "100.1-structure" -> "100_1")
  const basename = path.basename(file, '.json');
  const varName = basename.split('-')[0].replace('.', '_');

  try {
    const jsonContent = fs.readFileSync(jsonPath, 'utf8');
    const jsContent = `// Auto-generated from ${file}\nwindow.questionBank_${varName} = ${jsonContent};`;

    fs.writeFileSync(jsPath, jsContent);
    console.log(`Created: ${jsPath}`);
  } catch (err) {
    console.error(`Error processing ${file}:`, err.message);
  }
});

// Also convert achievements
const achievementsJson = path.join(baseDir, '000-core/000.5-achievements.json');
const achievementsJs = path.join(baseDir, '000-core/000.5-achievements.js');

try {
  const content = fs.readFileSync(achievementsJson, 'utf8');
  fs.writeFileSync(achievementsJs, `// Auto-generated achievements\nwindow.achievementsData = ${content};`);
  console.log('Created: 000-core/000.5-achievements.js');
} catch (err) {
  console.error('Error processing achievements:', err.message);
}

console.log('\nBuild complete! You can now open index.html directly in your browser.');
