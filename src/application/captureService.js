'use strict';

const { assertSafeUrl, normalizeUrl, categorizeUrl, getDomain } = require('../domain/url');
const { generateId } = require('../domain/idGenerator');

function createCaptureService({ storage, metadataFetcher, notifyUpdated }) {
  async function captureUrl(urlString) {
    try {
      const url = normalizeUrl(urlString.trim());
      assertSafeUrl(url);

      // duplicate check
      const data = storage.load();
      const existing = data.items.find(i => !i.deletedAt && i.type === 'url' && i.content === url);
      if (existing) return { success: false, duplicate: true };

      const now = new Date().toISOString();
      const item = {
        id: generateId(),
        type: 'url',
        content: url,
        title: url,
        description: '',
        image: '',
        category: categorizeUrl(url),
        domain: getDomain(url),
        tags: [],
        createdAt: now,
        updatedAt: now,
      };

      data.items.unshift(item);
      storage.save(data);
      notifyUpdated({ source: 'capture', count: data.items.filter(i => !i.deletedAt).length });

      // background metadata enrichment
      metadataFetcher(url).then(meta => {
        const current = storage.load();
        const idx = current.items.findIndex(i => i.id === item.id);
        if (idx === -1) return;
        current.items[idx] = {
          ...current.items[idx],
          title: meta.title || url,
          description: meta.description || '',
          image: meta.image || '',
          category: meta.category || categorizeUrl(url),
          domain: meta.domain || getDomain(url),
          updatedAt: new Date().toISOString(),
        };
        storage.save(current);
        notifyUpdated({ source: 'capture-meta', count: current.items.filter(i => !i.deletedAt).length });
      }).catch(() => {});

      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  return { captureUrl };
}

module.exports = { createCaptureService };
