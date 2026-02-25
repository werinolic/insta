import Link from 'next/link';
import type { ReactNode } from 'react';

/**
 * Parse text and turn @username tokens into Next.js Links.
 * Returns an array of strings and elements (safe to spread into JSX).
 */
export function renderMentions(text: string): ReactNode[] {
  const parts = text.split(/(@[\w.]+)/g);
  return parts.map((part, i) => {
    if (/^@[\w.]+$/.test(part)) {
      const username = part.slice(1);
      return (
        <Link key={i} href={`/${username}`} className="font-semibold text-brand hover:underline">
          {part}
        </Link>
      );
    }
    return part;
  });
}
