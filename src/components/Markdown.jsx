import { marked } from 'marked';
import { useMemo } from 'react';

// Content is authored in this repo, so rendering its Markdown as HTML is safe.
export default function Markdown({ source }) {
  const html = useMemo(() => marked.parse(source ?? ''), [source]);
  return <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />;
}
