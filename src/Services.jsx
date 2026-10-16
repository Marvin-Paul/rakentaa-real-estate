import React, { useState } from 'react';
import { ArrowUpRight, Check, KeyRound, ClipboardCheck, HardHat, PaintRoller, DraftingCompass, ChartNoAxesCombined, Layers3 } from 'lucide-react';
import { useContent } from './content.jsx';

const presentation = [
  { icon: KeyRound, image: '/images/modern-residence.jpeg', position: 'center 48%' },
  { icon: ClipboardCheck, image: '/images/site-planning.jpeg', position: 'center 65%' },
  { icon: HardHat, image: '/images/construction-overview.jpeg', position: 'center' },
  { icon: PaintRoller, image: '/images/kitchen-renovation.jpeg', position: 'right center' },
  { icon: DraftingCompass, image: '/images/architectural-concept.jpeg', position: 'center 50%' },
  { icon: ChartNoAxesCombined, image: '/images/architectural-blueprint.jpeg', position: 'center' },
];

export default function Services() {
  const content = useContent();
  const services = content.services.map((service, index) => ({ ...presentation[index], ...service, icon: presentation[index].icon }));
  const [active, setActive] = useState(2);
  const selected = services[active];
  const SelectedIcon = selected.icon;
  function navigate(event, index) {
    const next = event.key === 'ArrowDown' ? (index + 1) % services.length : event.key === 'ArrowUp' ? (index + services.length - 1) % services.length : event.key === 'Home' ? 0 : event.key === 'End' ? services.length - 1 : null;
    if (next !== null) { event.preventDefault(); setActive(next); document.getElementById(`service-${next}`).focus(); }
  }
  return <section id="services" className="services section photo-services"><div className="container">
    <div className="section-heading"><div><p className="eyebrow"><span />WHAT WE DO</p><h2>Every stage.<br />Expertly taken care of.</h2></div><p>Six connected services. One seamless experience.<br />Choose exactly what you need, or let us take<br className="desktop-break" /> care of your project from start to finish.</p></div>
    <div className="service-layout">
      <div className="service-list" role="tablist" aria-label="Our services" aria-orientation="vertical">{services.map((service, index) => <button key={service.name} role="tab" id={`service-${index}`} aria-controls="service-panel" aria-selected={active === index} tabIndex={active === index ? 0 : -1} onKeyDown={event => navigate(event, index)} onClick={() => setActive(index)} className={`service-tab service-selector-tab ${active === index ? 'active' : ''}`}><span className="service-number">0{index + 1}</span><span className="service-icon"><service.icon size={21} /></span><span className="service-tab-name">{service.name}</span><ArrowUpRight size={18} /></button>)}</div>
      <div className="service-detail service-photo-detail" id="service-panel" role="tabpanel" aria-labelledby={`service-${active}`} tabIndex={0}>
        <div key={active} className="service-content service-photo-content"><div className="service-photo-heading"><div className="service-image-stage"><img src={selected.image} alt={selected.imageAlt || selected.name} style={{objectFit:selected.imageFit || 'contain',objectPosition:selected.imagePosition || selected.position}}/><div className="service-photo-heading-top"><span className="service-heading-icon"><SelectedIcon size={27} /></span><span className="service-heading-number">SERVICE 0{active + 1}</span></div></div><div className="service-title-band"><h3>{selected.name}</h3><p>{selected.summary}</p></div></div>
          <div className="service-photo-body"><p className="service-description">{selected.description}</p><h4>What's included</h4><ul>{selected.details.map(detail => <li key={detail}><span className="service-check"><Check size={14} /></span>{detail}</li>)}</ul><a className="button service-discuss" href="#contact">Discuss your project <ArrowUpRight size={18} /></a></div>
        </div>
      </div>
    </div><p className="services-note"><Layers3 size={17} />Each service can stand alone. Together, they do more.</p>
  </div></section>;
}
