# Rakentaa Real Estate

Responsive corporate website built with React, Vite, Tailwind CSS and Lucide icons. Company copy is based on the supplied Rakentaa company profile. Architectural photographs are illustrative, not claims of completed Rakentaa projects.

Private hosted preview: https://rakentaa-real-estate.perkyfinch32.chatgpt.site

The original company profile is retained in `docs/company-profile.md` for future content updates.

## Run locally

Use Node.js 20.19+ or 22.12+. Run `npm install`, then `npm run dev`. For a production bundle, run `npm run build`; `npm run preview` serves that bundle.

## Appointment flow

The browser validates required name, email, phone, service and project brief fields. Submission produces a confirmation with a prefilled WhatsApp link to +256 704 057 507. Visitors must confirm sending in WhatsApp. The website does not claim to send or store appointment requests; a server or CRM integration can be added later.

## Content and components

`src/main.jsx` contains independent Navbar, Hero, About, Services, Process, WhyUs, Contact and Footer components. Service content is data-driven. `src/styles.css` supplies the responsive visual system; Tailwind is available for extensions. Contact details and navigation are defined at the top of the source. External fonts and illustrative photographs require an internet connection; system fonts are available as fallback.
