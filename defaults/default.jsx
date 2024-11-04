function cleanHref(href) {
  return href.replace(/\/index$/, '');
}

function renderToc(toc, currentHref) {
  return (
    <ul className="ml-1 px-0">
      {toc.map(({ children, href, title }) => {
        if (children.length > 0) {
          return (
            href ? (
              <li key={href}>
                <a href={cleanHref(href)} className="mr-2 font-bold text-inherit no-underline">
                  {title}
                </a>
                {(renderToc(children, currentHref))}
              </li>
            ) : (
              <li key={href}>
                <span className="font-bold">{title}</span>
                {(renderToc(children, currentHref))}
              </li>
            )
          )
        } else {
          return (
            <li key={href}>
              <a href={cleanHref(href)} className={"mr-2 text-inherit no-underline" + (href === currentHref ? " font-bold text-sky-600" : "")}>
                {title}
              </a>
            </li>
          )
        }
      })}
    </ul>
  )
}

export default async function DefaultLayout({ children, meta, pages, website, href: currentHref }) {
  const toc = docship.toc(pages);
  return (
    <html>
      <head>
        <title>{meta.title}</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width" />
      </head>
      <body className="flex flex-col h-screen">
        <header className="pb-1 border-b border-gray-300">
          <h1 className="text-base font-bold py-2 px-4">
            {website?.title}
          </h1>
        </header>
        <div className="flex flex-1 overflow-hidden">
          <nav className="w-[300px] p-4 overflow-y-auto">
            {renderToc(toc.children, currentHref)}
          </nav>
          <main className="flex-1 px-8 py-8 overflow-y-auto">
            <div className="max-w-[900px] mx-auto">
              <h1 className="text-2xl mb-8">{meta.title}</h1>
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
