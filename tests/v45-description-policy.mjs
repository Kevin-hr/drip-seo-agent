import assert from 'node:assert/strict';
import { buildV45Description } from '../seo-agent/runtime/v45-description-policy.mjs';

const empty = buildV45Description({
  detailImages: [],
  galleryUrls: ['https://images.example/main-1.jpg'],
  altBase: 'Example Product'
});
assert.equal(empty.html, '');
assert.equal(empty.images.length, 0);

assert.throws(() => buildV45Description({
  detailImages: [{ src: 'https://images.example/main-1.jpg', alt: 'Example Product Main View' }],
  galleryUrls: ['https://images.example/main-1.jpg'],
  altBase: 'Example Product'
}), /overlap the main gallery/);

const details = buildV45Description({
  detailImages: [{ src: 'https://images.example/detail-1.jpg' }],
  galleryUrls: ['https://images.example/main-1.jpg'],
  altBase: 'Example Product'
});
assert.match(details.html, /detail-1\.jpg/);
assert.match(details.html, /Example Product Detail Image 1/);
assert.equal(details.galleryOverlap, 0);

console.log(JSON.stringify({ pass: true, cases: 3 }));
