'use strict';

const { URL } = require('url');
const { fetchHtml: defaultFetchHtml } = require('./httpFetcher');
const { getMeta, getTitle } = require('../domain/htmlMeta');
const { categorizeUrl, assertSafeUrl } = require('../domain/url');

function createMetadataFetcher(fetchHtmlFn) {
  return async function fetchUrlMetadata(urlString) {
    assertSafeUrl(urlString);
    const parsedUrl = new URL(urlString);
    const hostname = parsedUrl.hostname.toLowerCase();

    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      try {
        const text = await fetchHtmlFn(
          `https://www.youtube.com/oembed?url=${encodeURIComponent(urlString)}&format=json`
        );
        const json = JSON.parse(text);
        return {
          title: json.title || '',
          description: `YouTube · ${json.author_name || ''}`,
          image: json.thumbnail_url || '',
          category: 'Video',
          domain: 'youtube.com',
        };
      } catch { /* fall through to HTML parse */ }
    }

    const html = await fetchHtmlFn(urlString);
    return {
      title: getTitle(html),
      description: getMeta(html, 'property', 'og:description') || getMeta(html, 'name', 'description'),
      image: getMeta(html, 'property', 'og:image'),
      category: categorizeUrl(urlString),
      domain: parsedUrl.hostname.replace(/^www\./, ''),
    };
  };
}

const fetchUrlMetadata = createMetadataFetcher(defaultFetchHtml);

module.exports = { fetchUrlMetadata, createMetadataFetcher };
