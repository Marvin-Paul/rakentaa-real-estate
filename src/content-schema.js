export const serviceNames = ['Property Management', 'Construction Project Management', 'Construction Services', 'Renovation', 'Architectural Drawings', 'Property Valuation'];
export const categories = ['Residential', 'Commercial', 'Renovation'];

// Shared by the editor and server. Only structured plain text and safe image URLs are accepted.
export function validateContent(content) {
  const text = (value, label, max = 3000) => {
    if (typeof value !== 'string' || !value.trim() || value.length > max) throw new Error(`${label} is required and must be at most ${max} characters.`);
  };
  const image = (value, label) => {
    text(value, label, 2000);
    let url;
    try { url = new URL(value); } catch { throw new Error(`${label} must be a full HTTPS image URL.`); }
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
      array(item.details, `${item.name} details`, 1, 12);
      item.details.forEach(detail => text(detail, 'Service detail', 500));
    });
    array(content.inspirations, 'Gallery', 1, 24);
    content.inspirations.forEach(item => {
      fields(item, ['title', 'alt', 'description'], 'Gallery');
      image(item.image, 'Gallery image');
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
    return null;
  } catch (error) { return error.message; }
}
