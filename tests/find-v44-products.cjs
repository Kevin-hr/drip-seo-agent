const fs = require('fs');
const queue = JSON.parse(fs.readFileSync('data/runs/v45-batch-2026-09-23/queue.json', 'utf8'));

const targets = [
  'New Balance 9060 Grey Lilac',
  'Represent Hermes Hoodie',
  'Represent Luggage Tag Hoodie',
  'Represent Keys To The Club',
  'Represent Owners Club Script Hoodie',
  'Represent Owners Club Hoodie',
  'Represent Owner',
  'Represent Patron',
  'Vale Forever Classico',
  'New Balance 9060 Bricks',
  'New Balance 9060 Ivory',
];

for (const p of queue.products) {
  for (const t of targets) {
    if (p.name && p.name.toLowerCase().includes(t.toLowerCase())) {
      console.log(`${p.productId} | IsShow=${p.liveIsShow} | ${p.name}`);
      break;
    }
  }
}
