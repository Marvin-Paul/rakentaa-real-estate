import React, { useEffect, useState } from 'react';
import { Building2, LayoutDashboard, Home, Users, Layers3, Images, BookOpen, ListOrdered, MessageCircle, Phone, LogOut, ExternalLink, Save, Upload, Plus, Trash2, ArrowUp, ArrowDown, ShieldCheck, Download } from 'lucide-react';
import defaults from './default-content.json';
import { categories, serviceNames, validateContent } from './content-schema.js';
import './admin.css';

const sections = [ ['overview', 'Overview', LayoutDashboard], ['hero', 'Homepage', Home], ['about', 'About Rakentaa', Users], ['services', 'Services', Layers3], ['inspirations', 'Inspiration gallery', Images], ['guides', 'Planning guides', BookOpen], ['steps', 'Our process', ListOrdered], ['faqs', 'Questions & answers', MessageCircle], ['contact', 'Contact details', Phone] ];
const copy = value => structuredClone(value);
async function api(path, method = 'GET', data) {
  const response = await fetch(`/api/admin/${path}`, { method, headers: data ? { 'Content-Type': 'application/json' } : {}, body: data ? JSON.stringify(data) : undefined });
  const result = await response.json().catch(() => ({ error: 'The server returned an unexpected response. Restart npm run dev and try again.' }));
  if (!response.ok) { const error = new Error(result.error || 'Request failed.'); error.status = response.status; throw error; }
  return result;
}
function Field({ label, value, onChange, multiline = false, hint, type = 'text', options }) {
  return <label className="cms-field"><span>{label}</span>{options ? <select value={value} onChange={e => onChange(e.target.value)}>{options.map(option => <option key={option}>{option}</option>)}</select> : multiline ? <textarea rows={4} value={value} onChange={e => onChange(e.target.value)} /> : <input type={type} value={value} onChange={e => onChange(e.target.value)} />}{hint && <small>{hint}</small>}</label>;
}
function ImageField({ label, value, onChange, alt = 'Content image preview' }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [value]);
  return <><Field label={label} value={value} onChange={onChange} type="url" hint="Paste a full HTTPS image URL. Use an image you have permission to publish." />{value.startsWith('https://') && !failed ? <img className="cms-image-preview" src={value} alt={alt} onError={() => setFailed(true)} /> : <p className="cms-image-error">Image unavailable. Check the URL before publishing.</p>}</>;
}
function ItemsEditor({ title, items, update, create, children, max = 20 }) {
  function move(index, offset) { const next = [...items]; [next[index], next[index + offset]] = [next[index + offset], next[index]]; update(next); }
  return <div className="cms-items">{items.map((item, index) => <section className="cms-panel" key={index}><div className="cms-item-heading"><h2>{title} {String(index + 1).padStart(2, '0')}</h2><div className="cms-item-actions"><button type="button" title="Move up" aria-label={`Move ${title} ${index + 1} up`} disabled={index === 0} onClick={() => move(index, -1)}><ArrowUp size={17} /></button><button type="button" title="Move down" aria-label={`Move ${title} ${index + 1} down`} disabled={index === items.length - 1} onClick={() => move(index, 1)}><ArrowDown size={17} /></button><button type="button" title="Remove item" aria-label={`Remove ${title} ${index + 1}`} disabled={items.length === 1} onClick={() => update(items.filter((_, i) => i !== index))}><Trash2 size={17} /></button></div></div>{children(item, value => update(items.map((entry, i) => i === index ? value : entry)), index)}</section>)}{items.length < max && <button className="cms-secondary" type="button" onClick={() => update([...items, create()])}><Plus size={18} /> Add {title.toLowerCase()}</button>}</div>;
}
function ContentEditor({ section, draft, setDraft }) {
  const update = value => setDraft(current => ({ ...current, [section]: value }));
  const item = draft[section];
  const objectField = (name, label, multiline = false) => <Field key={name} label={label} value={item[name]} onChange={value => update({ ...item, [name]: value })} multiline={multiline} />;
  const image = (name, label, alt) => <ImageField label={label} value={item[name]} onChange={value => update({ ...item, [name]: value })} alt={alt} />;
  if (section === 'hero') return <section className="cms-panel"><h2>Make a strong first impression</h2>{objectField('eyebrow', 'Introductory label')}{objectField('title', 'Headline — first line')}{objectField('highlight', 'Headline — highlighted line')}{objectField('description', 'Introduction', true)}{image('image', 'Hero background image')}</section>;
  if (section === 'about') return <section className="cms-panel"><h2>Your company story</h2>{objectField('title', 'Heading', true)}{objectField('lead', 'Lead paragraph', true)}{objectField('description', 'Company introduction', true)}{objectField('secondary', 'Additional introduction', true)}{objectField('mission', 'Mission', true)}{objectField('vision', 'Vision', true)}{image('image', 'About image', item.imageAlt)}{objectField('imageAlt', 'Image description for accessibility')}</section>;
  if (section === 'contact') return <section className="cms-panel"><h2>Help people reach you</h2>{objectField('phone', 'Phone / WhatsApp number (with country code)')}{objectField('location', 'Location')}{objectField('heading', 'Contact heading', true)}{objectField('intro', 'Contact introduction', true)}<p className="cms-hint">Publishing the phone number updates the call and WhatsApp links throughout the website.</p></section>;
  if (section === 'services') return <div className="cms-items">{item.map((service, index) => <section className="cms-panel" key={service.name}><h2>{service.name}</h2><Field label="Short summary" value={service.summary} onChange={summary => update(item.map((s, i) => i === index ? { ...s, summary } : s))} /><Field label="Description" multiline value={service.description} onChange={description => update(item.map((s, i) => i === index ? { ...s, description } : s))} /><Field label="Included services — one per line" multiline value={service.details.join('\n')} onChange={value => update(item.map((s, i) => i === index ? { ...s, details: value.split('\n') } : s))} /></section>)}</div>;
  if (section === 'inspirations') return <><p className="cms-hint">This is the design inspiration gallery. Photographs remain labelled as illustrative, rather than property listings or completed projects.</p><ItemsEditor title="Image" items={item} update={update} create={() => ({ ...copy(defaults.inspirations[0]), title: 'New inspiration' })} max={24}>{(entry, set) => <><Field label="Title" value={entry.title} onChange={title => set({ ...entry, title })} /><Field label="Category" value={entry.category} options={categories} onChange={category => set({ ...entry, category })} /><Field label="Description" value={entry.description} multiline onChange={description => set({ ...entry, description })} /><ImageField label="Image URL" value={entry.image} alt={entry.alt} onChange={image => set({ ...entry, image })} /><Field label="Accessible image description" value={entry.alt} onChange={alt => set({ ...entry, alt })} /><Field label="Enquiry service" value={entry.service} options={serviceNames} onChange={service => set({ ...entry, service })} /></>}</ItemsEditor></>;
  if (section === 'guides') return <ItemsEditor title="Guide" items={item} update={update} create={() => ({ tag: 'PLANNING', title: 'New planning guide', intro: 'Introduce your checklist.', points: ['Add your first checklist item.'] })} max={12}>{(entry, set) => <><Field label="Category label" value={entry.tag} onChange={tag => set({ ...entry, tag })} /><Field label="Title" value={entry.title} onChange={title => set({ ...entry, title })} /><Field label="Introduction" value={entry.intro} multiline onChange={intro => set({ ...entry, intro })} /><Field label="Checklist — one item per line" value={entry.points.join('\n')} multiline onChange={value => set({ ...entry, points: value.split('\n') })} /></>}</ItemsEditor>;
  if (section === 'steps' || section === 'faqs') return <ItemsEditor title={section === 'steps' ? 'Step' : 'Question'} items={item} update={update} max={section === 'steps' ? 12 : 20} create={() => section === 'steps' ? ['New step', 'Describe what happens at this stage.'] : ['New question?', 'Write your answer here.']}>{(entry, set) => <><Field label={section === 'steps' ? 'Step title' : 'Question'} value={entry[0]} onChange={value => set([value, entry[1]])} /><Field label={section === 'steps' ? 'Description' : 'Answer'} value={entry[1]} multiline onChange={value => set([entry[0], value])} /></>}</ItemsEditor>;
  return null;
}

function AuthScreen({ session, onSuccess }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault(); setError(''); setBusy(true);
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    try {
      if (session.setupRequired && fields.password !== fields.confirm) throw new Error('The passwords do not match.');
      const result = await api(session.setupRequired ? 'setup' : 'login', 'POST', fields);
      onSuccess({ ...session, setupRequired: false, username: result.username });
    } catch (failure) { setError(failure.message); } finally { setBusy(false); }
  }
  return <main className="cms-auth"><a className="cms-brand" href="/"><Building2 size={30} /><span>RAKENTAA<small>CONTENT STUDIO</small></span></a><form className="cms-auth-card" onSubmit={submit}><span className="cms-eyebrow"><ShieldCheck size={16} /> PRIVATE ADMINISTRATION</span><h1>{session.setupRequired ? 'Set up your CMS.' : 'Welcome back.'}</h1><p>{session.setupRequired ? 'Create the administrator account to manage and publish your website content.' : 'Sign in to manage your Rakentaa website.'}</p><label>Username<input name="username" required minLength={3} maxLength={60} pattern="[a-zA-Z0-9._-]+" autoComplete="username" /></label><label>Password<input name="password" type="password" required minLength={session.setupRequired ? 12 : undefined} maxLength={256} autoComplete={session.setupRequired ? 'new-password' : 'current-password'} /></label>{session.setupRequired && <><small>Use at least 12 characters. Your password is stored as a salted hash on the server.</small><label>Confirm password<input name="confirm" type="password" required minLength={12} autoComplete="new-password" /></label>{session.setupTokenRequired && <label>Server setup token<input name="setupToken" type="password" required autoComplete="off" /></label>}</>}{error && <p className="cms-alert error" role="alert">{error}</p>}<button className="cms-primary" disabled={busy}>{busy ? 'Please wait…' : session.setupRequired ? 'Create admin account' : 'Sign in'}</button><a className="cms-back" href="/">← Back to the website</a></form></main>;
}

export default function Admin() {
  const [session, setSession] = useState(null);
  const [record, setRecord] = useState(null);
  const [draft, setDraft] = useState(null);
  const [section, setSection] = useState('overview');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const dirty = Boolean(record && JSON.stringify(draft) !== JSON.stringify(record.draft));
  const unpublished = Boolean(record && JSON.stringify(record.draft) !== JSON.stringify(record.published));
  useEffect(() => { document.title = 'Rakentaa | Admin CMS'; api('session').then(setSession).catch(failure => setError(failure.message)); }, []);
  useEffect(() => {
    if (session?.username) api('content').then(result => { setRecord(result); setDraft(copy(result.draft)); setError(''); }).catch(failure => setError(failure.message));
  }, [session]);
  useEffect(() => {
    const warn = event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  async function save() {
    const validation = validateContent(draft);
    if (validation) { setError(validation); setNotice(''); return; }
    setBusy(true); setError(''); setNotice('');
    try { const result = await api('content', 'PUT', { content: draft, revision: record.revision }); setRecord(result); setDraft(copy(result.draft)); setNotice('Draft saved on the server. Preview it, or publish when you are ready.'); }
    catch (failure) { setError(failure.message); if (failure.status === 401) setSession({ ...session, username: null }); }
    finally { setBusy(false); }
  }
  async function publish() {
    setBusy(true); setError(''); setNotice('');
    try { const result = await api('publish', 'POST', { revision: record.revision }); setRecord(result); setNotice('Published successfully. Your changes are now available on the public website.'); }
    catch (failure) { setError(failure.message); if (failure.status === 401) setSession({ ...session, username: null }); }
    finally { setBusy(false); }
  }
  async function logout() {
    if (dirty && !window.confirm('Leave without saving your changes?')) return;
    try { await api('logout', 'POST'); setRecord(null); setDraft(null); setSession({ ...session, username: null }); }
    catch (failure) { if (failure.status === 401) { setRecord(null); setDraft(null); setSession({ ...session, username: null }); } else setError(failure.message); }
  }
  function download() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(draft, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'rakentaa-content-backup.json'; link.click(); URL.revokeObjectURL(url);
  }
  if (!session) return <main className="cms-loading"><h1>Rakentaa Content Studio</h1>{error ? <><p role="alert">{error}</p><p>Start the website with <code>npm run dev</code>, then refresh this page.</p><button onClick={() => window.location.reload()}>Try again</button></> : <p role="status">Connecting to your CMS…</p>}</main>;
  if (!session.username) return <AuthScreen session={session} onSuccess={setSession} />;
  return <div className="cms-shell"><aside className="cms-sidebar"><a className="cms-brand" href="/"><Building2 size={29} /><span>RAKENTAA<small>CONTENT STUDIO</small></span></a><p className="cms-sidebar-label">YOUR WEBSITE</p><nav aria-label="CMS sections">{sections.map(([id, label, Icon]) => <button key={id} className={id === section ? 'active' : ''} aria-current={id === section ? 'page' : undefined} onClick={() => { setSection(id); setNotice(''); }}><Icon size={18} />{label}</button>)}</nav><div className="cms-sidebar-bottom"><a href="/" target="_blank" rel="noopener noreferrer"><ExternalLink size={17} />View public website</a><span>Signed in as {session.username}</span><button onClick={logout}><LogOut size={17} />Sign out</button></div></aside><div className="cms-workspace"><header className="cms-topbar"><div><span className="cms-eyebrow">WEBSITE MANAGEMENT</span><h1>{sections.find(([id]) => id === section)?.[1]}</h1></div><div className="cms-top-actions"><span className={`cms-status ${dirty ? 'unsaved' : ''}`}>{dirty ? 'Unsaved changes' : unpublished ? 'Draft ready to publish' : 'All changes published'}</span><a className="cms-secondary" href="/?preview=draft" target="_blank" rel="noopener noreferrer">Preview draft <ExternalLink size={15} /></a><button className="cms-secondary" onClick={save} disabled={busy || !dirty || !record}><Save size={16} />Save draft</button><button className="cms-primary" onClick={publish} disabled={busy || dirty || !record || !unpublished} title={dirty ? 'Save your draft before publishing' : 'Publish your saved draft'}><Upload size={16} />{busy ? 'Working…' : 'Publish'}</button></div></header><main className="cms-main">{error && <p className="cms-alert error" role="alert">{error}</p>}{notice && <p className="cms-alert success" role="status">{notice}</p>}{!record ? <p role="status">Loading saved content…</p> : section === 'overview' ? <><section className="cms-welcome"><span className="cms-eyebrow">ONE PLACE. EVERY DETAIL.</span><h2>Your website,<br/>in your hands.</h2><p>Edit your content, preview your saved draft, and publish it when you’re ready.</p><button className="cms-primary" onClick={() => setSection('hero')}>Edit the homepage <Home size={17} /></button></section><div className="cms-stats">{[['Services', draft.services.length], ['Gallery images', draft.inspirations.length], ['Planning guides', draft.guides.length], ['FAQs', draft.faqs.length]].map(([label, count]) => <div key={label}><strong>{count}</strong><span>{label}</span></div>)}</div><section className="cms-panel"><h2>From edit to live</h2><ol className="cms-workflow"><li><strong>01 · Edit</strong><span>Choose a section from the menu. Your changes stay in the editor until saved.</span></li><li><strong>02 · Save & preview</strong><span>Save a draft to the server, then open Preview draft to check it on the website.</span></li><li><strong>03 · Publish</strong><span>Publish the saved draft. Visitors see it when they open or refresh the website.</span></li></ol><div className="cms-record"><p>Last draft saved: <strong>{record.savedAt ? new Date(record.savedAt).toLocaleString() : 'No edits saved yet'}</strong></p><p>Last published: <strong>{record.publishedAt ? new Date(record.publishedAt).toLocaleString() : 'Original website content'}</strong></p></div><button className="cms-secondary" onClick={download}><Download size={17} />Download content backup</button></section></> : <ContentEditor section={section} draft={draft} setDraft={setDraft} />}</main><footer className="cms-footer">Rakentaa Content Studio · Drafts are saved on your server.</footer></div></div>;
}
