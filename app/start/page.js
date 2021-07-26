
export function Page(id = undefined) {
  this.id = id;
  this.url = Page.aboutBlank;
  this.title = Page.emptyTitle;
  this.tags = new Set();
  this.hits = 0;
}

Page.aboutBlank = new URL('about:blank');
Page.emptyTitle = '';
Page.tagPattern = new RegExp('^[a-zA-Z][a-zA-Z0-9]*$');

Page.search = function*(page) {
  yield page.title;
  yield page.url.toString();
  for (let tag of page.tags) {
    yield tag;
  }
};

Page.isTag = function(tag) {
  return Page.tagPattern.test(tag || '');
};

Page.prototype.tryUrl = function(url) {
  try {
    this.url = new URL(url);
    return true;
  } catch {
    return false;
  }
};

Page.prototype.setTitle = function(title) {
  this.title = title;
};

Page.prototype.addTags = function(tags) {
  for (let tag of tags) {
    this.tags.add(tag);
  }
};

Page.prototype.addTag = function(tag) {
  if (!Page.isTag(tag)) return false;
  this.tags.add(tag);
};

Page.prototype.increaseHits = function() {
  this.hits++;
};

Page.fromJSON = function(json) {
  let { id, url, title, tags, hits } = json;

  let page = new Page(id);
  page.tryUrl(url);
  page.setTitle(title);

  for (let tag of tags.values()) {
    page.addTag(tag);
  }

  while (hits-- > 0) {
    page.increaseHits();
  }

  return page;
};

Page.toJSON = function(page) {
  let { id, url, title, tags, hits } = page;

  let json = {
    id, title, hits,
    url: url.toString(),
    tags: Array.from(tags)
  };

  return json;
};
