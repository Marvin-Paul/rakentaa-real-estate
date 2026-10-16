export const serviceNames = ['Property Management', 'Construction Project Management', 'Construction Services', 'Renovation', 'Architectural Drawings', 'Property Valuation'];
import defaults from './default-content.json' with { type: 'json' };
export const categories = ['Residential', 'Commercial', 'Renovation', 'Design & planning', 'Construction'];
export const imagePositions = ['center', 'center top', 'center bottom', 'left center', 'right center', 'center 48%', 'center 65%', 'center 50%'];

// Add newly introduced controls to older records without replacing saved copy.
export function withContentDefaults(content) {
  return {
    ...content,
    services: content.services.map((service, index) => ({ ...defaults.services[index], ...service })),
    gallerySettings: { ...defaults.gallerySettings, ...content.gallerySettings },
    companyPages: Object.fromEntries(Object.entries(defaults.companyPages).map(([path, page]) => [path, { ...page, ...content.companyPages?.[path], path }])),
  };
}

// Shared by the editor and server. Only structured plain text and safe image URLs are accepted.
export function validateContent(content) {
  const text = (value, label, max = 3000) => {
    if (typeof value !== 'string' || !value.trim() || value.length > max) throw new Error(`${label} is required and must be at most ${max} characters.`);
  };
  const image = (value, label) => {
    text(value, label, 2000);
    if (/^\/images\/[a-zA-Z0-9_-]+\.(?:jpe?g|png|webp|avif)$/.test(value)) return;
    let url;
    try { url = new URL(value); } catch { throw new Error(`${label} must be a full HTTPS image URL or a local /images/ asset path.`); }
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error(`${label} must be an HTTPS URL without credentials.`);
  };
  const array = (value, label, min = 1, max = 30) => {
    if (!Array.isArray(value) || value.length < min || value.length > max) throw new Error(`${label} must contain ${min}–${max} items.`);
  };
  const fields = (value, names, label) => { for (const name of names) text(value?.[name], `${label}: ${name}`); };
  try {
    fields(content?.hero, ['eyebrow', 'title', 'highlight', 'description'], 'Homepage');
    image(content.hero.image, 'Hero image');
    fields(content?.about, ['title', 'lead', 'description', 'secondary', 'mission', 'vision', 'imageAlt'], 'About');
    image(content.about.image, 'About image');
    fields(content?.contact, ['phone', 'location', 'heading', 'intro'], 'Contact');
    if (!/^\+?[\d ()-]{7,30}$/.test(content.contact.phone) || content.contact.phone.replace(/\D/g, '').length < 7) throw new Error('Enter a valid phone number, including its country code.');
    array(content.services, 'Services', 6, 6);
    content.services.forEach((item, i) => {
      if (item.name !== serviceNames[i]) throw new Error('Keep the six service names in their original order.');
      fields(item, ['summary', 'description'], item.name);
      if (item.image !== undefined) image(item.image, `${item.name} image`);
      if (item.imageAlt !== undefined) text(item.imageAlt, `${item.name} image description`, 500);
      if (item.imageFit !== undefined && !['contain', 'cover'].includes(item.imageFit)) throw new Error('Choose a valid service image fit.');
      if (item.imagePosition !== undefined && !imagePositions.includes(item.imagePosition)) throw new Error('Choose a valid service image position.');
      array(item.details, `${item.name} details`, 1, 12);
      item.details.forEach(detail => text(detail, 'Service detail', 500));
    });
    array(content.inspirations, 'Gallery', 1, 24);
    content.inspirations.forEach(item => {
      fields(item, ['title', 'alt', 'description'], 'Gallery');
      image(item.image, 'Gallery image');
      for (const dimension of ['width', 'height']) if (item[dimension] !== undefined && (!Number.isInteger(item[dimension]) || item[dimension] < 1 || item[dimension] > 20000)) throw new Error('Image dimensions must be whole numbers from 1 to 20000.');
      if (!categories.includes(item.category) || !serviceNames.includes(item.service)) throw new Error('Choose a valid gallery category and service.');
    });
    array(content.guides, 'Guides', 1, 12);
    content.guides.forEach(item => {
      fields(item, ['tag', 'title', 'intro'], 'Guide');
      array(item.points, 'Checklist', 1, 12);
      item.points.forEach(point => text(point, 'Checklist item', 1000));
    });
    array(content.steps, 'Process steps', 1, 12);
    content.steps.forEach(item => { array(item, 'Step', 2, 2); item.forEach(value => text(value, 'Process step')); });
    array(content.faqs, 'FAQs', 1, 20);
    content.faqs.forEach(item => { array(item, 'FAQ', 2, 2); item.forEach(value => text(value, 'FAQ')); });
    if (content.gallerySettings !== undefined) {
      if (![24, 40, 60].includes(content.gallerySettings?.speed) || typeof content.gallerySettings?.autoplay !== 'boolean') throw new Error('Choose valid gallery playback settings.');
    }
    if (content.companyPages !== undefined) {
      for (const path of Object.keys(defaults.companyPages)) {
        const page = content.companyPages[path];
        fields(page, ['title', 'eyebrow', 'headline', 'intro', 'imageAlt', 'section', 'description', 'secondaryHeading', 'closing', 'cta'], 'Company page');
        image(page.image, 'Company page image');
        array(page.cards, 'Page cards', 1, 12);
        page.cards.forEach(card => { array(card, 'Page card', 3, 3); card.forEach(value => text(value, 'Page card text', 1000)); if (!['Ruler','HardHat','ChartNoAxesCombined','Building2','Layers3','KeyRound'].includes(card[2])) throw new Error('Choose a valid page card icon.'); });
        if (path === '/our-team') {
          array(page.people, 'Team members', 1, 20);
          page.people.forEach(person => { fields(person, ['name', 'role'], 'Team member'); if (person.image) image(person.image, 'Team portrait'); });
        } else {
          array(page.steps, 'Page steps', 1, 12);
          page.steps.forEach(step => { array(step, 'Page step', 2, 2); step.forEach(value => text(value, 'Page step text', 1000)); });
        }
      }
    }
    return null;
  } catch (error) { return error.message; }
}
