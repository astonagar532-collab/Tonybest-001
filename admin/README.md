# Travel & Destinations — Admin Notes

Open `index.html` directly. Relative paths ensure CSS/JS work offline.

## Before publishing
- Replace the sample contact address in every page (`hello@traveldestinations.example`).
- Confirm the contact details, company registration and legal pages match your jurisdiction.
- Update `sitemap.xml`, `feed.xml` and the `<meta name="theme-color">` value if you change branding.

## Content
- All page copy is in the HTML files. The shared shell is duplicated per page — change it everywhere.
- Dynamic content (budget tiers, area picker, transport, food, itineraries, safety list, FAQs) lives in `content/data.json`.
- `last_updated` in `content/data.json` drives every "last updated" label on the site.

## Currency
- USD is the base currency. `rates` in `content/data.json` converts the base into other currencies.
- Tier tables show USD, EUR and INR. Add or remove rows to match `rates`.
- Update `rates` and the `tiers` block whenever prices are refreshed.

## Tools
- Validate `content/data.json` and `schema.json` as JSON.
- Validate `sitemap.xml` and `feed.xml` as XML.
- `admin/` is disallowed in `robots.txt`; do not put indexable pages there.
- `assets/placeholder-hero.jpg` and any CSS logo art are placeholders — see `assets/licenses.json`.