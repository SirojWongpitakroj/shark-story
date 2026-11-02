// Optional: bundle the published boundaries for fully offline use.
// Run on a network-enabled computer, then run node build-story.js again.
import fs from 'node:fs/promises';
const response=await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-50m.json');
if(!response.ok)throw new Error(`Boundary download failed (${response.status})`);
const topology=await response.json();
if(topology.type!=='Topology'||topology.objects.countries.geometries.length<150)throw new Error('Invalid country boundary file');
await fs.writeFile(new URL('./world-boundaries.js',import.meta.url),'window.SHARK_WORLD_TOPOLOGY='+JSON.stringify(topology)+';\n');
console.log('Country boundaries bundled. Run node build-story.js to include them in the page.');
