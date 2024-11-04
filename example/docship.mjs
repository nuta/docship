export default {
  baseUrl: "https://github.com/nuta/docship",
  website: {
    title: "Docship Example",
  },
  feedOptions: {
    title: "Docship Example",
    id: "https://github.com/nuta/docship",
    link: "https://github.com/nuta/docship",
    author: {
      name: "Docship Authors",
    }
  },
  callbacks: {
    filterFeed(page) {
      // Exclude the index page from the feed.
      return page.meta.layout === 'blog';
    },
  }
}
