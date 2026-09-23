const normalizeUrl = (value) => String(value || '').trim();

export function buildV45Description({ detailImages, galleryUrls = [], altBase }) {
  if (!Array.isArray(detailImages)) {
    throw new Error('V4.5 Description images must be supplied explicitly as an array');
  }

  const gallery = new Set(galleryUrls.map(normalizeUrl));
  const images = detailImages.map((image, index) => ({
    src: normalizeUrl(image?.src),
    alt: String(image?.alt || `${altBase} Detail Image ${index + 1}`).trim()
  }));

  if (images.some((image) => !/^https:\/\//i.test(image.src) || !image.alt)) {
    throw new Error('V4.5 Description contains an invalid explicit detail image');
  }

  const overlap = images.filter((image) => gallery.has(image.src));
  if (overlap.length) {
    throw new Error(`V4.5 Description images overlap the main gallery: ${overlap.length}`);
  }

  return {
    images,
    galleryOverlap: overlap.length,
    html: images.length
      ? `<section class="ds-pdp-description" data-standard="4.5">${images.map((image) => `<p><img src="${image.src}" alt="${image.alt}" loading="lazy" /></p>`).join('')}</section>`
      : ''
  };
}
