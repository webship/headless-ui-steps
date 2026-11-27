// The one example that links back to the playground's index imports Next.js's Link; in this Vite app it is a plain link.
import * as React from 'react';

type Props = React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

const Link = React.forwardRef<HTMLAnchorElement, Props>(function Link(props, ref) {
  return <a ref={ref} {...props} />;
});

export default Link;
