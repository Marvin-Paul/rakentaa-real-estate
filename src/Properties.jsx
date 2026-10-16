import React from 'react';
import { ArrowUpRight, MapPin, Building2, Maximize2 } from 'lucide-react';
import { useContent } from './content.jsx';

export default function Properties() {
  const { properties = [], contact } = useContent();
  const whatsapp = `https://wa.me/${contact.phone.replace(/\D/g, '')}`;
  return <section className="section properties-section" id="properties" aria-labelledby="properties-heading"><div className="container">
    <div className="section-heading"><div><p className="eyebrow"><span />FIND YOUR NEXT PROPERTY</p><h2 id="properties-heading">Properties for sale.</h2></div><p>Explore land, homes and commercial spaces. Talk to our team for details or to arrange a viewing.</p></div>
    {properties.length ? <div className="property-grid">{properties.map((property, index) => <article className="property-card" key={index}>
      <div className="property-photo"><img src={property.image} alt={property.imageAlt} loading="lazy" /><span className={`property-status status-${property.status.toLowerCase()}`}>{property.status === 'Available' ? 'For sale' : property.status}</span></div>
      <div className="property-copy"><p className="property-price">{property.price}</p><h3>{property.title}</h3><p className="property-location"><MapPin size={16} />{property.location}</p><div className="property-facts"><span><Building2 size={16} />{property.type}</span><span><Maximize2 size={16} />{property.size}</span></div><p className="property-description">{property.description}</p>
      {property.status !== 'Sold' && <a className="text-link" href={`${whatsapp}?text=${encodeURIComponent(`Hello Rakentaa, I am interested in ${property.title} in ${property.location} (${property.price}). Please share more details and viewing availability.`)}`} target="_blank" rel="noopener noreferrer">Enquire about this property <ArrowUpRight size={18} /></a>}</div>
    </article>)}</div> : <div className="properties-empty"><Building2 size={32} /><h3>New listings coming soon.</h3><p>Tell us the location and type of property you’re looking for. Our team will help you explore available opportunities.</p><a className="text-link" href="/#contact">Talk to our property team <ArrowUpRight size={18} /></a></div>}
  </div></section>;
}
