import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, Pause, Play, Maximize2, X } from 'lucide-react';
import { useContent } from './content.jsx';

export default function Gallery({ onEnquire }) {
  const { inspirations, gallerySettings } = useContent();
  const [filter, setFilter] = useState('All images');
  const [active, setActive] = useState(null);
  const [paused, setPaused] = useState(gallerySettings?.autoplay === false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [speed, setSpeed] = useState(gallerySettings?.speed || 40);
  const viewport = useRef(null);
  const firstGroup = useRef(null);
  const dialog = useRef(null);
  const position = useRef(0);
  const visible = inspirations.filter(item => filter === 'All images' || item.category === filter);
  const selected = active === null ? null : visible[active];
  const opened = active !== null;
  const canMove = visible.length > 1;
  const running = canMove && !paused && !hovered && !focused && !opened;
  const repeats = canMove ? Math.ceil(6 / visible.length) : 1;

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motion.matches) setPaused(true);
    const changed = () => { if (motion.matches) setPaused(true); };
    motion.addEventListener('change', changed);
    return () => motion.removeEventListener('change', changed);
  }, []);

  useEffect(() => { position.current = 0; viewport.current.scrollLeft = 0; }, [filter, inspirations]);

  useEffect(() => {
    if (!running) return;
    let frame;
    let previous;
    position.current = viewport.current.scrollLeft;
    const tick = now => {
      const distance = firstGroup.current.getBoundingClientRect().width + 24;
      if (previous !== undefined && distance > 0) {
        position.current = (position.current + Math.min(now - previous, 50) * speed / 1000) % distance;
        viewport.current.scrollLeft = position.current;
      }
      previous = now;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running, speed, filter, inspirations]);

  useEffect(() => {
    if (!opened) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current.showModal();
    return () => { dialog.current?.close(); document.body.style.overflow = previous; };
  }, [opened]);

  const move = direction => setActive(index => (index + direction + visible.length) % visible.length);
  const card = (item, index, duplicate, key) => <article className="gallery-card" key={key} aria-hidden={duplicate || undefined} style={{'--gallery-ratio': item.width && item.height ? item.width / item.height : 4 / 3}}>
    <button className="gallery-image-button" tabIndex={duplicate ? -1 : 0} onClick={() => setActive(index)} aria-label={`View image: ${item.title}`} aria-haspopup="dialog">
      <img src={item.image} alt={duplicate ? '' : item.alt} width={item.width} height={item.height} loading={duplicate ? "lazy" : "eager"} decoding="async" />
      <span className="gallery-zoom"><Maximize2 size={17} strokeWidth={1.75} /> View image</span>
    </button>
    <div className="gallery-card-copy"><div className="gallery-card-meta"><span>{item.category}</span><span className="gallery-card-number" aria-hidden="true">{String(inspirations.indexOf(item) + 1).padStart(2, '0')}</span></div><h3>{item.title}</h3><button className="text-link" tabIndex={duplicate ? -1 : 0} onClick={() => onEnquire(item.service)}>Discuss a similar idea <ArrowUpRight size={16} /></button></div>
  </article>;

  return <section className="inspiration section photo-gallery" id="gallery" aria-labelledby="gallery-heading"><span id="inspiration" /><div className="container">
    <div className="section-heading"><div><p className="eyebrow"><span /> THE GALLERY</p><h2 id="gallery-heading">From first plans.<br />To fresh possibilities.</h2></div><p>Explore architecture, construction and renovation through our image collection. Find the direction for your next project.</p></div>
    <div className="gallery-toolbar"><div className="gallery-filters" role="group" aria-label="Filter gallery">{['All images', ...new Set(inspirations.map(item => item.category))].map(category => <button key={category} aria-pressed={filter === category} className={filter === category ? 'active' : ''} onClick={() => setFilter(category)}>{category}<span>{category === 'All images' ? inspirations.length : inspirations.filter(item => item.category === category).length}</span></button>)}</div></div>
    <div className="gallery-motion-controls"><p className="gallery-count" aria-live="polite">{visible.length} {visible.length === 1 ? 'image' : 'images'} / Select to enlarge</p><div><button className="gallery-play" disabled={!canMove} aria-pressed={paused} onClick={() => setPaused(value => !value)}>{paused ? <Play size={16} /> : <Pause size={16} />}{paused ? 'Play gallery' : 'Pause gallery'}</button><label className="gallery-speed">Speed<select value={speed} disabled={!canMove} onChange={event => setSpeed(Number(event.target.value))}><option value={24}>Slow</option><option value={40}>Steady</option><option value={60}>Brisk</option></select></label></div></div>
    <div ref={viewport} className="gallery-marquee" role="region" aria-label="Scrolling image gallery" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onTouchStart={() => setPaused(true)} onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
      <div className="gallery-track">{Array.from({ length: canMove ? 2 : 1 }, (_, group) => <div key={group} className="gallery-track-group" ref={group === 0 ? firstGroup : undefined}>{Array.from({ length: repeats }, (_, repeat) => visible.map((item, index) => card(item, index, group > 0 || repeat > 0, `${group}-${repeat}-${index}-${item.image}`)))}</div>)}</div>
    </div>
    <p className="gallery-note">Hover or focus a card to pause. Swipe to browse on mobile. Images shared for design and service inspiration; contact us for project details and property availability.</p>
    <div className="gallery-invitation"><div><h3>See something that inspires you?</h3><p>Let's explore how it could work for your project.</p></div><a href="#contact" className="button">Talk to our team <ArrowUpRight size={18} /></a></div>
  </div><dialog ref={dialog} className="gallery-dialog" aria-labelledby="gallery-image-title" onClose={() => setActive(null)} onClick={event => { if (event.target === event.currentTarget) setActive(null); }} onKeyDown={event => { if (event.key === 'ArrowRight') { event.preventDefault(); move(1); } if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); } }}>
    {selected && <div className="gallery-viewer"><div className="gallery-viewer-top"><span>{active + 1} / {visible.length} / {selected.category}</span><button autoFocus className="gallery-close" aria-label="Close image viewer" onClick={() => setActive(null)}><X size={24} /></button></div><img className="gallery-full-image" src={selected.image} alt={selected.alt} /><div className="gallery-viewer-bottom"><button aria-label="Previous image" onClick={() => move(-1)}><ArrowRight className="previous-arrow" size={22} /></button><div aria-live="polite"><h3 id="gallery-image-title">{selected.title}</h3><p>{selected.description}</p></div><button aria-label="Next image" onClick={() => move(1)}><ArrowRight size={22} /></button></div></div>}
  </dialog></section>;
}
