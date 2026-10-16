import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ArrowUp, ChevronDown, Menu, X, Phone, MapPin, MessageCircle } from 'lucide-react';
import { useContent } from './content.jsx';

const companyLinks = [['About Rakentaa', '/#about'], ['Our Team', '/our-team'], ['Our Partners', '/our-partners'], ['Our Clients', '/our-clients']];
const mainLinks = [['Home', '/#home'], ['Services', '/#services'], ['Gallery', '/#gallery'], ['Our Approach', '/#process']];

function Logo({ light = false }) {
  return <a className={`logo brand-lockup ${light ? 'logo-light' : ''}`} href="/#home" aria-label="Rakentaa Real Estate home">
    <span className="logo-art"><img src="/rakentaa-logo-transparent.png" alt="" width="1240" height="1268" /></span>
    <span className="brand-name">RAKENTAA<small>REAL ESTATE</small></span>
  </a>;
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [companyOpen, setCompanyOpen] = useState(false);
  const [current, setCurrent] = useState('');
  const header = useRef(null);
  const companyButton = useRef(null);
  const mobileButton = useRef(null);
  const close = () => { setOpen(false); setCompanyOpen(false); };
  useEffect(() => {
    const update = () => { setCurrent(window.location.pathname.replace(/\/$/, '') + (window.location.hash || '#home')); close(); };
    update();
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  useEffect(() => {
    const outside = event => { if (!header.current.contains(event.target)) close(); };
    const escape = event => {
      if (event.key !== 'Escape') return;
      if (companyOpen) { setCompanyOpen(false); companyButton.current.focus(); }
      else if (open) { setOpen(false); mobileButton.current.focus(); }
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, [open, companyOpen]);
  const isCurrent = href => current === href.replace(/^\/(?=#)/, '') || current === `${href}#home`;
  const companyActive = companyLinks.some(([, href]) => isCurrent(href));
  return <header ref={header} className="header site-header"><div className="nav container"><Logo />
    <nav id="mobile-menu" aria-label="Main navigation" className={`navigation organized-navigation ${open ? 'open' : ''}`}>
      {mainLinks.map(([label, href]) => <a className="nav-link" key={href} href={href} aria-current={isCurrent(href) ? 'location' : undefined} onClick={close}>{label}</a>)}
      <div className="company-navigation" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setCompanyOpen(false); }}>
        <button ref={companyButton} className={`company-toggle ${companyActive ? 'current' : ''}`} aria-expanded={companyOpen} aria-controls="company-navigation-links" onClick={() => setCompanyOpen(value => !value)}>Company <ChevronDown size={15} /></button>
        <div id="company-navigation-links" className="company-dropdown" hidden={!companyOpen}><span>GET TO KNOW RAKENTAA</span>{companyLinks.map(([label, href]) => <a key={href} href={href} aria-current={isCurrent(href) ? 'location' : undefined} onClick={close}>{label}<ArrowUpRight size={15} /></a>)}</div>
      </div>
      <a className="nav-contact-link nav-link" href="/#contact" aria-current={isCurrent('/#contact') ? 'location' : undefined} onClick={close}>Contact</a>
      <a href="/#contact" className="button nav-cta" onClick={close}>Book appointment <ArrowUpRight size={17} /></a>
    </nav>
    <button ref={mobileButton} className="menu-toggle" aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? 'Close navigation' : 'Open navigation'} onClick={() => { setOpen(value => !value); setCompanyOpen(false); }}>{open ? <X size={23} /> : <Menu size={23} />}</button>
  </div></header>;
}

export function Footer() {
  const { contact, services } = useContent();
  const telephone = `tel:${contact.phone.replace(/[^+\d]/g, '')}`;
  const whatsapp = `https://wa.me/${contact.phone.replace(/\D/g, '')}`;
  return <footer className="footer professional-footer"><div className="container">
    <div className="footer-project"><div><p>FROM IDEA TO REALITY</p><h2>Let's build your next chapter.</h2></div><a className="button" href="/#contact">Start a conversation <ArrowUpRight size={19} /></a></div>
    <div className="footer-columns">
      <div className="footer-brand"><Logo light /><p>Property, construction and design.<br />One accountable team, from your first idea to lasting value.</p><span className="footer-tagline">You dream it. We build it. Any-Where.</span></div>
      <nav className="footer-column" aria-label="Company links"><h3>Company</h3>{companyLinks.map(([label, href]) => <a href={href} key={href}>{label}</a>)}<a href="/#gallery">Our Gallery</a><a href="/#process">Our Approach</a></nav>
      <nav className="footer-column" aria-label="Services links"><h3>Our Services</h3>{services.map(service => <a href="/#services" key={service.name}>{service.name}</a>)}</nav>
      <div className="footer-column footer-contact"><h3>Get in Touch</h3><a className="footer-contact-row" href={telephone}><Phone size={18} /><span><small>Call for an appointment</small>{contact.phone}</span></a><div className="footer-contact-row"><MapPin size={18} /><span><small>Based in</small>{contact.location}</span></div><a className="footer-whatsapp" href={whatsapp} target="_blank" rel="noopener noreferrer"><MessageCircle size={18} />Chat on WhatsApp<ArrowUpRight size={15} /></a><p>Working wherever you need us.</p></div>
    </div>
    <div className="footer-legal"><p>© {new Date().getFullYear()} Rakentaa Real Estate. All rights reserved.</p><div><a href="/admin">Admin CMS</a><a href="#" onClick={event => { event.preventDefault(); window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); }}>Back to top <ArrowUp size={14} /></a></div></div>
  </div></footer>;
}
