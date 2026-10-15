# Rakentaa Real Estate

Responsive corporate website built with React, Vite, Tailwind CSS and Lucide icons. Company copy is based on the supplied Rakentaa company profile. Architectural photographs are illustrative, not claims of completed Rakentaa projects.

Private hosted preview: https://rakentaa-real-estate.perkyfinch32.chatgpt.site

The original company profile is retained in `docs/company-profile.md` for future content updates.

## Run locally

Use Node.js 20.19+ or 22.12+. From `D:\Rakenta\website`, run `npm install`, then `npm run dev`. Open the Local URL printed by Vite. Restart an existing dev server after adding the CMS.

## Admin CMS

Open `/admin` on the same Local URL (for example `http://127.0.0.1:5173/admin`), or use **Admin CMS** in the website footer. On first use, create a username and a password of at least 12 characters. There is no default password. Initial account creation is restricted to localhost unless a server setup token is configured.

Use the sidebar to edit homepage copy and images, the company story, service descriptions, gallery entries, guides, process steps, FAQs and contact details. Gallery images use full HTTPS image URLs; this version does not upload files. The six core service names remain fixed so enquiry links stay consistent.

1. Edit a section and select **Save draft**. This writes to the server without changing the public site.
2. Select **Preview draft** to open the saved draft in a separate tab. Refresh the preview after saving more changes.
3. Select **Publish** to make the saved draft public. Refresh the public site to see it. Unsaved changes must be saved before publishing.

The overview includes publication timestamps and a content JSON backup download. Browser reload/close warns about unsaved edits. Concurrent saves are rejected rather than silently overwriting another editor's changes.

Content and the salted password hash are stored in the ignored `data/` directory, not in browser local storage. Back up this directory securely; `CMS_DATA_DIR` can point to another persistent directory. Sessions expire after eight hours and are cleared by a server restart. Passwords and session cookies are not returned by the public content API. The contact form still prepares a WhatsApp message; it does not store client enquiries in the CMS.

## Run the built website and CMS

Run `npm run build`, then `npm start`. The Node server serves both the public website and `/admin` at `http://127.0.0.1:4173`. `npm run preview` also includes the CMS API for local preview. Run `npm test` for authentication, validation, draft/publish, persistence and public rendering checks.

The previous static hosted preview has not been updated with this backend. A static file deployment alone cannot run this CMS. Production requires a Node host, a persistent disk for `CMS_DATA_DIR`, and an HTTPS reverse proxy. Set `HOST` and `PORT` for the listener. Before binding to a non-local interface, set a strong `CMS_SETUP_TOKEN` on the server, and enter it during first account setup. Use `CMS_SECURE_COOKIE=true` when serving over HTTPS. Keep these settings server-side; never use `VITE_` variables for secrets. This file store is intended for one running server instance, not multiple replicas.

If you lose the admin password, stop the server and securely move `data/admin.json` out of the data directory, then restart locally and create a new account. Retain `data/content.json` to preserve content. Existing sessions are cleared by the restart.

## Appointment flow

The browser validates required name, email, phone, service and project brief fields. Submission produces a confirmation with a prefilled WhatsApp link to +256 704 057 507. Visitors must confirm sending in WhatsApp. The website does not claim to send or store appointment requests; a server or CRM integration can be added later.

## Content and components

`src/main.jsx` contains the public website components. `src/default-content.json` supplies initial content, `src/content.jsx` loads the published API content, and `src/Admin.jsx` supplies the CMS. `server/cms.mjs` handles authentication and content persistence; `server/start.mjs` serves the built website. `src/styles.css` supplies the public visual system and `src/admin.css` styles the CMS. External fonts and illustrative photographs require an internet connection; system fonts are available as fallback.
