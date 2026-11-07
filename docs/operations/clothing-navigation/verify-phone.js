(() => [...document.querySelectorAll('iframe[id^="phone-"]')].map(frame => {
  const doc = frame.contentDocument;
  const view = frame.contentWindow;
  const sections = [...doc.querySelectorAll('[id^="mrshop-section-"]')];
  const images = doc.querySelector('[data-section-type="imgtxt_list"]');
  const cards = [...(images?.querySelectorAll('.imgtxt-list-item') || [])].map(card => {
    const bounds = card.getBoundingClientRect();
    const image = card.querySelector('img');
    return {name: card.innerText.trim(), href: card.querySelector('a')?.href,
      loaded: image?.complete && image?.naturalWidth > 0,
      top: bounds.top, bottom: bounds.bottom, left: bounds.left, right: bounds.right};
  });
  const explore = [...doc.querySelectorAll('a')].filter(link => /^Explore (hoodies|jeans|jackets)$/.test(link.textContent.trim()))
    .map(link => ({text: link.textContent.trim(), href: link.href,
      section: link.closest('[id^="mrshop-section-"]')?.id,
      targetHeight: link.getBoundingClientRect().height}));
  return {
    url: view.location.href, width: view.innerWidth, height: view.innerHeight,
    client: doc.documentElement.clientWidth, scroll: doc.documentElement.scrollWidth,
    h1: [...doc.querySelectorAll('h1')].map(h1 => h1.textContent.trim()),
    canonical: doc.querySelector('link[rel="canonical"]')?.href,
    nativePhone: [...doc.scripts].some(script => script.src.includes('Theme-Shoes/1/')),
    productCount: doc.querySelectorAll('article.product-item').length, cards,
    allCardsInFirstScreen: cards.every(card => card.top >= 0 && card.bottom <= view.innerHeight &&
      card.left >= 0 && card.right <= doc.documentElement.clientWidth),
    allImagesLoaded: cards.every(card => card.loaded),
    sections: sections.map(section => section.id), explore,
    exploreAtBottom: explore.length === 2 && sections.at(-1)?.id === 'mrshop-section-footer' &&
      explore.every(link => link.section === sections.at(-2)?.id)
  };
}))()
