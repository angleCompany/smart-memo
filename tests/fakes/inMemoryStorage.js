'use strict';

function createInMemoryStorage(initial = []) {
  let data = { items: JSON.parse(JSON.stringify(initial)) };
  let savedPath = ':memory:';

  function load() { return JSON.parse(JSON.stringify(data)); }
  function save(d) { data = JSON.parse(JSON.stringify(d)); }
  function exists() { return true; }
  function getPath() { return savedPath; }
  function seed(items) { data = { items: JSON.parse(JSON.stringify(items)) }; }
  function peek() { return JSON.parse(JSON.stringify(data.items)); }

  return { load, save, exists, getPath, seed, peek };
}

module.exports = { createInMemoryStorage };
