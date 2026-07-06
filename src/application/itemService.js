'use strict';

const { sanitizeTags } = require('../domain/tags');
const { filterItems, computeCounts } = require('../domain/itemFilter');
const { purgeExpired } = require('../domain/trashPolicy');
const { generateId } = require('../domain/idGenerator');

function createItemService({ storage, notifyUpdated }) {
  function getAll() {
    return storage.load().items;
  }

  function list(filters) {
    return filterItems(getAll(), filters);
  }

  function counts() {
    return computeCounts(getAll());
  }

  function save(item) {
    const data = storage.load();
    const tags = sanitizeTags(item.tags);
    const now = new Date().toISOString();

    if (item.id) {
      const idx = data.items.findIndex(i => i.id === item.id);
      if (idx !== -1) {
        data.items[idx] = { ...data.items[idx], ...item, tags, updatedAt: now };
      }
    } else {
      const newItem = {
        ...item,
        tags,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      };
      data.items.unshift(newItem);
    }
    storage.save(data);
    return data.items.find(i => i.id === item.id) || data.items[0];
  }

  function toggleDone(id) {
    const data = storage.load();
    const item = data.items.find(i => i.id === id);
    if (!item || item.type !== 'todo') return null;
    const now = new Date().toISOString();
    item.done = !item.done;
    item.completedAt = item.done ? now : null;
    item.updatedAt = now;
    storage.save(data);
    return item;
  }

  function softDelete(id) {
    const data = storage.load();
    const item = data.items.find(i => i.id === id);
    if (!item) return false;
    item.deletedAt = new Date().toISOString();
    storage.save(data);
    return true;
  }

  function restore(id) {
    const data = storage.load();
    const item = data.items.find(i => i.id === id);
    if (!item) return false;
    delete item.deletedAt;
    item.updatedAt = new Date().toISOString();
    storage.save(data);
    return true;
  }

  function emptyTrash() {
    const data = storage.load();
    data.items = data.items.filter(i => !i.deletedAt);
    storage.save(data);
    return true;
  }

  function permDelete(id) {
    const data = storage.load();
    data.items = data.items.filter(i => i.id !== id);
    storage.save(data);
    return true;
  }

  function purgeTrash() {
    const data = storage.load();
    const before = data.items.length;
    data.items = purgeExpired(data.items);
    if (data.items.length < before) storage.save(data);
  }

  function isDuplicateUrl(url) {
    const data = storage.load();
    return data.items.some(i => !i.deletedAt && i.type === 'url' && i.content === url);
  }

  return { list, counts, save, toggleDone, softDelete, restore, emptyTrash, permDelete, purgeTrash, isDuplicateUrl, getAll };
}

module.exports = { createItemService };
