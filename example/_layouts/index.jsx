export default async function BlogIndexLayout({ children, meta, pages }) {
  const blogPages = pages
    .filter(({ meta }) => {
      return meta.layout === 'blog';
    })
    .sort((a, b) => {
      return new Date(b.meta.date).getTime() - new Date(a.meta.date).getTime();
    });

  return (
    <html>
      <head>
        <title>My Blog</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width" />
        <link rel="stylesheet" type="text/css" href="/styles.css" />
      </head>
      <body className="mx-auto max-w-3xl w-full py-8 px-4">
        <header className="mb-8 pb-1 border-b border-gray-200">
          <h1 className="text-base sm:text-2xl font-bold">My Blog</h1>
        </header>
        <main>
          <ul>
            {blogPages.map((page) => {
              const date = new Date(page.meta.date);
              return (
                <li className="my-2">
                  <a href={page.href}>{page.meta.title}</a>
                  &nbsp;
                  <span className="text-sm">
                    (
                    {date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                    )
                  </span>
                </li>
              );
            })}
          </ul>
        </main>
        <footer className="mt-8 border-t border-gray-200 py-4 text-center">
          Written by Me
        </footer>
      </body>
    </html>
  );
}
