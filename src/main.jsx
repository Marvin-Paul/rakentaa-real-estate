import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowUpRight, ArrowRight, Building2, Menu, X, Phone, MapPin, Check, ChevronDown, KeyRound, HardHat, Hammer, Ruler, ChartNoAxesCombined, ShieldCheck, Globe2, Layers3, BadgeCheck, MessageCircle, Plus, BookOpen, ClipboardCheck, PaintRoller, DraftingCompass } from 'lucide-react';
import './styles.css';
import { ContentProvider, useContent } from './content.jsx';
import Admin from './Admin.jsx';
import Gallery from './Gallery.jsx';
import Properties from './Properties.jsx';
import Services from './Services.jsx';
import { Navbar, Footer } from './SiteChrome.jsx';
import { CompanyPage, companyPages } from './CompanyPages.jsx';

function Eyebrow({children, light=false}){ return <p className={`eyebrow ${light?'light':''}`}><span/>{children}</p>; }
function Hero(){const content=useContent();const PHONE=content.contact.phone;return <section id="home" className="hero"><div className="hero-image" style={{backgroundImage:`url("${content.hero.image}")`}}/><div className="hero-shade"/><div className="container hero-content"><Eyebrow light>{content.hero.eyebrow}</Eyebrow><h1>{content.hero.title}<br/><em>{content.hero.highlight}</em></h1><div className="anywhere"><span/> ANY—WHERE</div><p>{content.hero.description}</p><div className="hero-actions"><a className="button" href="#services">Explore our services <ArrowUpRight size={19}/></a><a className="hero-call" href={`tel:${content.contact.phone.replace(/[^+\d]/g,'')}`}><span className="call-icon"><Phone size={18}/></span><span><small>Call for an appointment</small>{PHONE}</span></a></div><div className="hero-bottom"><span><MapPin size={15}/> Based in {content.contact.location}. Built for anywhere.</span><a href="#about">Discover Rakentaa <ArrowRight size={16}/></a></div></div><div className="hero-side-note"><span>DESIGN WITH PURPOSE</span><p>Considered spaces.<br/>Lasting value.</p><a href="#gallery">Explore the gallery <ArrowUpRight size={18}/></a></div><div className="image-note">ARCHITECTURAL INSPIRATION</div></section>;}
function IntroStrip(){return <div className="intro-strip"><div className="container strip-inner"><span>From your first idea.<br/><strong>To lasting value.</strong></span><div><Ruler/> <span>Thoughtfully designed</span></div><div><HardHat/> <span>Expertly constructed</span></div><div><ShieldCheck/> <span>Professionally managed</span></div></div></div>;}
function About(){const content=useContent();const values=[['Integrity','Honest timelines. Clear communication.'],['Quality craftsmanship','Care in every drawing and finish.'],['Client-centred design','Built around your life and goals.'],['Accountability','One team. One standard of delivery.'],['Reach','Where you need us, we build.']];return <section className="section container" id="about"><div className="about-grid"><div className="about-photo"><img src={content.about.image} alt={content.about.imageAlt} loading="lazy"/><div className="photo-caption"><Building2/><span>Spaces with purpose.<br/><strong>Built around you.</strong></span></div></div><div className="about-copy"><Eyebrow>WHO WE ARE</Eyebrow><h2 className="preserve-lines">{content.about.title}</h2><p className="lead preserve-lines">{content.about.lead}</p><p>{content.about.description}</p><p>{content.about.secondary}</p><div className="mission"><h3>Our mission</h3><p>{content.about.mission}</p><h3>Our vision</h3><p>{content.about.vision}</p></div><a className="text-link" href="#contact">Let’s talk about your vision <ArrowUpRight size={18}/></a></div></div><div className="values">{values.map(([name,detail])=><div key={name}><Check size={18}/><h3>{name}</h3><p>{detail}</p></div>)}</div></section>;}
function Process(){const {steps}=useContent();return <section className="section container" id="process"><div className="section-heading"><div><Eyebrow>HOW WE WORK</Eyebrow><h2>A clear path.<br/>From idea to reality.</h2></div><p>Good projects begin with good planning.<br/>Our process keeps you informed, involved<br className="desktop-break"/> and confident at every step.</p></div><div className="process-grid">{steps.map(([title,desc],i)=><article className="process-step" key={title}><div className="step-top"><span>0{i+1}</span><ArrowRight size={21}/></div><h3>{title}</h3><p>{desc}</p></article>)}</div></section>;}
function WhyUs(){const features=[[Layers3,'One partner, every stage','Design, build, manage and value your property with one coordinated team.'],[Globe2,'Reach without compromise','Our teams and processes are built to mobilise wherever your project takes us.'],[ShieldCheck,'Transparent costing','Clear budgets and payment certification give you visibility and control.'],[BadgeCheck,'Qualified professionals','Architects, project managers, valuers and site teams working from one plan.']];return <section id="why-us" className="why section"><div className="container why-grid"><div><Eyebrow light>THE RAKENTAA DIFFERENCE</Eyebrow><h2>Your ambition.<br/>Our commitment.</h2><p>Great buildings begin with great relationships. We listen carefully, plan honestly and take responsibility for the details.</p><a href="#contact" className="button">Build with confidence <ArrowUpRight size={18}/></a></div><div className="features">{features.map(([Icon,title,desc])=><article key={title}><Icon size={25} strokeWidth={1.75}/><h3>{title}</h3><p>{desc}</p></article>)}</div></div></section>;}
// This browser-only flow prepares a request; WhatsApp handles the actual sending.
function Contact({enquiry}){const content=useContent();const PHONE=content.contact.phone;const services=content.services;const [brief,setBrief]=useState(null);const [draft,setDraft]=useState({});useEffect(()=>{if(enquiry){setBrief(null);setDraft(current=>({...current,service:enquiry.service}));}},[enquiry]);function submit(e){e.preventDefault();const fields=Object.fromEntries(new FormData(e.currentTarget));setDraft(fields);setBrief(fields);}const message=brief?`Hello Rakentaa, I would like an appointment.\nName: ${brief.name}\nEmail: ${brief.email}\nPhone: ${brief.phone}\nService: ${brief.service}\nProject brief: ${brief.message}`:'';return <section id="contact" className="section container contact-grid"><div><Eyebrow>LET’S BUILD SOMETHING</Eyebrow><h2 className="preserve-lines">{content.contact.heading}</h2><p className="contact-intro preserve-lines">{content.contact.intro}</p><a href={`tel:${content.contact.phone.replace(/[^+\d]/g,'')}`} className="contact-info"><span><Phone size={21}/></span><div><small>CALL FOR AN APPOINTMENT</small><strong>{PHONE}</strong></div><ArrowUpRight size={21}/></a><div className="contact-info"><span><MapPin size={21}/></span><div><small>WHERE YOU’LL FIND US</small><strong>{content.contact.location}</strong></div></div><a className="contact-whatsapp text-link" href={`https://wa.me/${content.contact.phone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"><MessageCircle size={18}/> Prefer WhatsApp? Start a conversation <ArrowUpRight size={18}/></a><p className="contact-tagline">You dream it, we build it — Any-Where.</p></div><div className="form-card"><div className="form-kicker"><span/> LET’S TALK PROPERTY</div>{brief?<div className="confirmation" role="status"><span className="success-icon"><Check size={32}/></span><h3>Your project brief is ready.</h3><p>Thank you, {brief.name}. Send your details to our team on WhatsApp to request an appointment. Your request is sent only after you confirm it in WhatsApp.</p><a className="button" href={`https://wa.me/${content.contact.phone.replace(/\D/g,'')}?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer">Send via WhatsApp <ArrowUpRight size={18}/></a><button className="text-link" onClick={()=>setBrief(null)}>Edit your details <ArrowRight size={16}/></button></div>:<form onSubmit={submit}><h3>Tell us about your project</h3><p>Let’s make your vision a reality.</p><div className="form-row"><label>Your name<input name="name" defaultValue={draft.name} autoComplete="name" placeholder="Full name" required maxLength={100}/></label><label>Phone number<input name="phone" defaultValue={draft.phone} type="tel" autoComplete="tel" placeholder="+256 …" required minLength={7} maxLength={30}/></label></div><label>Email address<input name="email" defaultValue={draft.email} type="email" autoComplete="email" placeholder="you@example.com" required maxLength={200}/></label><label>Service interested in<span className="select-wrap"><select name="service" value={draft.service || ""} onChange={e=>setDraft({...draft,service:e.target.value})} required><option value="" disabled>Select a service</option>{services.map(s=><option key={s.name}>{s.name}</option>)}<option>Full-service project / Not sure yet</option></select><ChevronDown size={17}/></span></label><label>Your project brief<textarea name="message" defaultValue={draft.message} placeholder="Tell us about your idea, location and timeline…" rows={4} required maxLength={3000}/></label><button className="button submit" type="submit">Prepare appointment request <ArrowUpRight size={19}/></button><p className="form-note">We’ll prepare your details for you to send to our team via WhatsApp.</p></form>}</div></section>;}
const projectGoals = [
  {label:'Build a property', service:'Construction Services', icon:Building2, hint:'From a plot of land to a place of your own.'},
  {label:'Design a space', service:'Architectural Drawings', icon:DraftingCompass, hint:'Turn your ideas into a considered, buildable plan.'},
  {label:'Manage my property', service:'Property Management', icon:KeyRound, hint:'A practical plan for tenants, maintenance and reporting.'},
  {label:'Renovate or value', service:'Renovation', icon:PaintRoller, hint:'Explore the next chapter for an existing property.'},
];
function ProjectFinder({onEnquire}){
  const [goal,setGoal]=useState(0);
  return <section className="project-finder container" aria-labelledby="finder-title"><div className="finder-intro"><span className="eyebrow">YOUR NEXT MOVE</span><h2 id="finder-title">What brings you here?</h2></div><div className="finder-main"><div className="goal-options" role="group" aria-label="Choose your property goal">{projectGoals.map((item,i)=><button key={item.label} aria-pressed={goal===i} className={goal===i?'goal active':'goal'} onClick={()=>setGoal(i)}><item.icon size={20}/>{item.label}</button>)}</div><div className="finder-bottom"><p aria-live="polite">{projectGoals[goal].hint}</p><button className="text-link" onClick={()=>onEnquire(projectGoals[goal].service)}>Plan my next step <ArrowRight size={18}/></button></div></div></section>;
}

function PlanningGuides(){const {guides}=useContent();return <section className="section container" id="guides"><div className="section-heading"><div><Eyebrow>PROPERTY, MADE CLEARER</Eyebrow><h2>A little clarity.<br/>A confident next step.</h2></div><p>Practical starting points for a more<br className="desktop-break"/> productive conversation with our team.</p></div><div className="guide-grid">{guides.map((guide,i)=><article className="guide-card" key={guide.title}><div className="guide-top"><BookOpen size={23} strokeWidth={1.75}/><span>0{i+1}</span></div><p className="guide-tag">{guide.tag}</p><h3>{guide.title}</h3><p>{guide.intro}</p><details><summary>Read the checklist <Plus size={18}/></summary><ul>{guide.points.map(point=><li key={point}>{point}</li>)}</ul></details></article>)}</div></section>;}

function FrequentlyAsked(){const content=useContent();const {faqs}=content;return <section className="faq-section" id="faqs"><div className="container faq-grid"><div className="faq-heading"><Eyebrow>GOOD QUESTIONS</Eyebrow><h2>Let’s clear<br/>a few things up.</h2><p>Every property journey starts with questions.<br/>We’re here to help you find a way forward.</p><a className="text-link" href={`tel:${content.contact.phone.replace(/[^+\d]/g,'')}`}>Ask our team <Phone size={17}/></a></div><div className="faq-list">{faqs.map(([question,answer])=><details key={question}><summary>{question}<Plus size={20}/></summary><p>{answer}</p></details>)}</div></div></section>;}
function Invitation(){return <section className="invitation"><div className="invitation-shade"/><div className="container invitation-copy"><Eyebrow light>FROM POSSIBILITY TO PLACE</Eyebrow><h2>The best place to start?<br/>A conversation.</h2><p>Bring your idea. Let’s give it a direction.</p><a className="button" href="#contact">Start your project <ArrowUpRight size={20}/></a></div></section>;}
function useScrollReveals() {
  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motion.matches || !('IntersectionObserver' in window)) return;
    const selector = '.strip-inner > *, .about-photo, .about-copy, .values > div, .section-heading > *, .service-layout, .process-step, .why-grid > div:first-child, .features article, .contact-grid > div, .footer-main > *, .inspiration-card, .guide-card, .faq-heading, .faq-list, .invitation-copy';
    const elements = [...document.querySelectorAll(selector)];
    const reveal = element => {
      element.classList.add('is-visible');
      observer.unobserve(element);
    };
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) reveal(entry.target); });
    }, { threshold: 0.08 });
    elements.forEach(element => {
      const siblings = [...element.parentElement.children].filter(child => child.matches(selector));
      element.style.setProperty('--reveal-delay', `${Math.min(siblings.indexOf(element), 3) * 80}ms`);
      element.classList.add('scroll-reveal');
      observer.observe(element);
    });
    const revealFocus = event => {
      const element = event.target.closest('.scroll-reveal');
      if (element) reveal(element);
    };
    const showAll = () => {
      if (motion.matches) {
        observer.disconnect();
        elements.forEach(element => element.classList.add('is-visible'));
      }
    };
    document.addEventListener('focusin', revealFocus);
    motion.addEventListener('change', showAll);
    return () => {
      observer.disconnect();
      document.removeEventListener('focusin', revealFocus);
      motion.removeEventListener('change', showAll);
      elements.forEach(element => {
        element.classList.remove('scroll-reveal', 'is-visible');
        element.style.removeProperty('--reveal-delay');
      });
    };
  }, []);
}
function App(){
  const content=useContent();const PHONE=content.contact.phone;
  useScrollReveals();
  const [enquiry,setEnquiry]=useState(null);
  const pagePath=typeof window==='undefined'?'/':window.location.pathname.replace(/\/$/,'');
  const companyPage=content.companyPages?.[pagePath] || companyPages[pagePath];
  useEffect(()=>{document.title=companyPage?`${companyPage.title} | Rakentaa Real Estate`:'Rakentaa Real Estate | You dream it, we build it';},[companyPage]);
  const enquire = service => {
    setEnquiry({service});
    document.getElementById('contact').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  };
  return <><a className="skip-link" href="#main">Skip to content</a><div className="utility-bar"><div className="container"><span><MapPin size={13}/> {content.contact.location} · Working wherever you need us</span><a href={`tel:${content.contact.phone.replace(/[^+\d]/g,'')}`}><Phone size={13}/> {PHONE}</a></div></div><Navbar/><main id="main">{companyPage?<CompanyPage page={companyPage}/>:<><Hero/><ProjectFinder onEnquire={enquire}/><IntroStrip/><About/><Services/><Properties/><Gallery onEnquire={enquire}/><Process/><WhyUs/><PlanningGuides/><FrequentlyAsked/><Invitation/><Contact enquiry={enquiry}/></>}</main><Footer/><a className="floating-contact" href={`https://wa.me/${content.contact.phone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" aria-label="Chat with Rakentaa on WhatsApp"><MessageCircle size={23}/><span>Let’s talk</span></a></>;
}
createRoot(document.getElementById('root')).render(/^\/admin\/?$/.test(window.location.pathname)?<Admin/>:<ContentProvider><App/></ContentProvider>);

