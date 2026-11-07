(async () => {
  const frame = document.querySelector('#phone-390');
  const landing = frame.contentWindow.location.href;
  const options = [
    {type: 'brand'},
    {type: 'explore', selector: 'a[href]'}
  ];
  function linksFor(option) {
    const doc = frame.contentDocument;
    if (option.type === 'brand') {
      return [...doc.querySelectorAll('[data-section-type="imgtxt_list"] .imgtxt-list-item')]
        .map(card => ({link: card.querySelector('a'), name: card.innerText.trim()}));
    }
    return [...doc.querySelectorAll(option.selector)]
      .filter(link => /^Explore (hoodies|jeans|jackets)$/.test(link.textContent.trim()))
      .map(link => ({link, name: link.textContent.trim()}));
  }
  function loaded() {
    return new Promise(resolve => frame.addEventListener('load', resolve, {once: true}));
  }
  const results = [];
  window.clothingNavigationProgress = results;
  for (const option of options) {
    const count = linksFor(option).length;
    for (let index = 0; index < count; index++) {
      const {link, name} = linksFor(option)[index];
      const expected = link.href;
      link.scrollIntoView({block: 'center', inline: 'center'});
      const bounds = link.getBoundingClientRect();
      const hit = frame.contentDocument.elementFromPoint(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2);
      if (!hit || !link.contains(hit)) throw Error('Link obstructed: ' + name);
      const arrive = loaded();
      link.click();
      await arrive;
      const destination = frame.contentDocument;
      results.push({type: option.type, name, expected, actual: frame.contentWindow.location.href,
        h1: destination.querySelector('h1')?.textContent.trim(),
        productCount: destination.querySelectorAll('article.product-item').length});
      const back = loaded();
      frame.src = landing;
      await back;
    }
  }
  return results;
})()
