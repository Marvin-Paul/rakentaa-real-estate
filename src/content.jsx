import React, { createContext, useContext, useEffect, useState } from 'react';
import defaults from './default-content.json';
import { validateContent, withContentDefaults } from './content-schema.js';

export const ContentContext = createContext(defaults);
export const useContent = () => useContext(ContentContext);

export function ContentProvider({ children }) {
  const [content, setContent] = useState(null);
  const [error, setError] = useState('');
  const preview = new URLSearchParams(window.location.search).get('preview') === 'draft';
  useEffect(() => {
    let controller;
    async function load() {
      controller?.abort();
      controller = new AbortController();
      const request = controller;
      try {
        const response = await fetch(preview ? '/api/admin/content' : '/api/content', { signal: request.signal, cache: 'no-store' });
        if (!response.ok) throw new Error(preview ? 'Sign in to the CMS to preview your draft.' : 'Live content is temporarily unavailable. Showing the original website.');
        const data = await response.json();
        const next = preview ? data.draft : data.content;
        if (validateContent(next)) throw new Error('Saved content could not be loaded. Showing the original website.');
        if (request.signal.aborted) return;
        setContent(withContentDefaults(next));
        setError('');
      } catch (failure) {
        if (failure.name !== 'AbortError') { setError(failure.message); setContent(defaults); }
      }
    }
    const onVisible = () => { if (document.visibilityState === 'visible') load(); };
    const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('rakentaa-content') : null;
    if (channel) channel.onmessage = () => load();
    window.addEventListener('focus', load);
    document.addEventListener('visibilitychange', onVisible);
    load();
    return () => {
      controller?.abort();
      channel?.close();
      window.removeEventListener('focus', load);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [preview]);
  if (!content) return <div className="site-loading" role="status">Loading Rakentaa…</div>;
  return <ContentContext.Provider value={content}>{(preview || error) && <div className="content-banner" role={error ? 'alert' : 'status'}>{error || 'Draft preview — unpublished content. Refresh this page after saving new changes.'}<a href="/admin">Return to CMS</a>{preview && <a href="/">View published site</a>}</div>}{children}</ContentContext.Provider>;
}
