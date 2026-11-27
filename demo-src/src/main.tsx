// The entry of the pack's demo: Headless UI's own React playground examples (src/page-examples, copied unchanged by
// demo-src/assemble.sh from playgrounds/react/page-examples of the release the demo is built from, MIT), each at the path
// the playground gives it (/menu/menu, /dialog/dialog …), and this pack's own page of form fields (/ours/form-fields). This
// file only lists them and picks the one a path names, as the playground's index and its page loader do.
import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
// The styles: the playground's own (src/page-examples/styles.css, Tailwind CSS 4 and its plugins) in the demo; this
// pack's src/styles.css (Tailwind CSS 4 and its forms plugin) in the app made with --minimal, which has no examples.
import.meta.glob(['./page-examples/styles.css', './styles.css'], { eager: true });

type Loader = () => Promise<{ default: React.ComponentType }>;

const examples = import.meta.glob('./page-examples/**/*.tsx') as Record<string, Loader>;
const ours = import.meta.glob('./ours/*.tsx') as Record<string, Loader>;

const pathOf = (file: string) => file.replace(/^\.\/(page-examples\/)?/, '/').replace(/\.tsx$/, '');
const pages = new Map<string, Loader>([...Object.entries(examples), ...Object.entries(ours)].map(([file, load]) => [pathOf(file), load]));

function Index() {
  const groups = new Map<string, string[]>();
  for (const path of [...pages.keys()].sort()) {
    const group = path.split('/')[1];
    groups.set(group, [...(groups.get(group) || []), path]);
  }
  return (
    <div className="container mx-auto my-12 px-4">
      <div className="prose">
        <h1>Headless UI demo</h1>
        <ul aria-label="Examples">
          {[...groups.entries()].map(([group, paths]) => (
            <li key={group}>
              <h2 className="text-xl capitalize">{group.replace(/-/g, ' ')}</h2>
              <ul>
                {paths.map((path) => (
                  <li key={path}>
                    <a href={path} className="capitalize">{path.split('/').slice(2).join(' / ').replace(/-/g, ' ')}</a>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="container mx-auto my-12 px-4">
      <h1 className="text-2xl">No example at {window.location.pathname}</h1>
      <p><a href="/">All the examples</a></p>
    </div>
  );
}

const path = window.location.pathname.replace(/\/+$/, '') || '/';
const load = pages.get(path);
const Page = path === '/' ? Index : load ? React.lazy(load) : NotFound;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <main className="min-h-screen bg-gray-50 font-sans text-gray-900 antialiased">
      <React.Suspense fallback={null}>
        <Page />
      </React.Suspense>
    </main>
  </React.StrictMode>,
);
