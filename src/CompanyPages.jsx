import React from 'react';
import { ArrowUpRight, ArrowRight, Ruler, HardHat, ChartNoAxesCombined, Building2, Layers3, KeyRound } from 'lucide-react';

import defaults from './default-content.json';
import { useContent } from './content.jsx';
export const companyPages = defaults.companyPages;
const cardIcons = { Ruler, HardHat, ChartNoAxesCombined, Building2, Layers3, KeyRound };

export function CompanyPage({ page: suppliedPage }) {
  const content = useContent();
  const page = content.companyPages?.[suppliedPage.path] || suppliedPage;
  return <>
    <section className="company-page-hero"><div className="container company-page-hero-grid"><div>
      <nav className="company-breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><ArrowRight size={13} /><span aria-current="page">{page.title}</span></nav>
      <p className="eyebrow light"><span />{page.eyebrow}</p><h1 className="preserve-lines">{page.headline}</h1><p className="company-page-intro">{page.intro}</p><a className="button" href="/#contact">Let's talk <ArrowUpRight size={18} /></a>
    </div><figure className="company-page-image"><img src={page.image} alt={page.imageAlt} width="735" height="919" /><figcaption>Service inspiration</figcaption></figure></div></section>
    <section className="section container company-page-content"><div className="section-heading"><div><p className="eyebrow"><span />{page.title.toUpperCase()}</p><h2>{page.section}</h2></div><p>{page.description}</p></div>
      {page.people && <><div className="team-grid">{page.people.map((person, index) => <article className="team-card" key={person.name}><div className={`team-avatar team-avatar-${index}`} aria-hidden="true">{person.image ? <img src={person.image} alt="" loading="lazy"/> : <span>{person.initials || person.name.split(/\s+/).map(part=>part[0]).slice(0,2).join('')}</span>}{!person.image && <div className="team-avatar-lines" />}</div><div className="team-card-copy"><p>{person.role}</p><h3>{person.name}</h3><a className="text-link" href="/#contact">Contact our team <ArrowUpRight size={16} /></a></div></article>)}</div><h2 className="company-subheading">{page.secondaryHeading}</h2></>}
      <div className="company-card-grid">{page.cards.map(([title, copy, icon], index) => { const Icon=cardIcons[icon] || Layers3; return <article className="company-card" key={title}><div className="company-card-top"><Icon size={25} /><span>0{index + 1}</span></div><h3>{title}</h3><p>{copy}</p></article>;})}</div>
      {page.steps && <div className="company-expectations"><h2>{page.secondaryHeading}</h2><div className="company-steps">{page.steps.map(([title, description], index) => <article key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{description}</p></article>)}</div></div>}
      <div className="gallery-invitation"><div><h3>{page.closing}</h3><p>One team. Every stage.</p></div><a className="button" href="/#contact">{page.cta}<ArrowUpRight size={18} /></a></div>
    </section>
    <nav className="company-page-links container" aria-label="Explore Rakentaa">{Object.entries(companyPages).map(([href, item]) => <a href={href} key={href} aria-current={item.path === page.path ? 'page' : undefined}>{item.title}<ArrowUpRight size={17} /></a>)}</nav>
  </>;
}
