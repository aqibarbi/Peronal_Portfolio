# Muhammad Aqib Javed — Developer Portfolio

A personal portfolio website for **Muhammad Aqib Javed**, a Frontend and WordPress Developer based in Bahawalpur, Pakistan. The site introduces my services and experience, showcases selected work, and provides a contact form for prospective clients.

**Live website:** [portfolio-muhammad-aqibjaved.netlify.app](https://portfolio-muhammad-aqibjaved.netlify.app/)

## About the project

This is a responsive, single-page portfolio built with standard web technologies. Its dark, space-inspired design features a custom animated star field, a CSS black-hole illustration, and sections for services, delivered work, practice projects, experience, education, certifications, and contact information.

## Features

- Responsive layout with mobile navigation
- Animated canvas star field and CSS-only black-hole hero visual
- Tech stack graphic (inline SVG): logos orbit a core and tool chips light up in turn. It pauses off screen, and is cropped to the orbit on small tablets and hidden on phones (the tech list shows instead)
- Rotating role text and scroll-triggered section reveals
- Project carousel with navigation dots, autoplay, mouse dragging, and touch scrolling
- Experience and education tabs with keyboard navigation
- Click-to-enlarge recommendation images
- Contact form configured for Netlify Forms, with submission feedback
- Copy-email button, active-section navigation, and custom pointer effects on supported devices
- Reduced-motion switch (`ALWAYS_ANIMATE` in `assets/js/head.js`), keyboard focus styles, and a skip-to-content link
- Search and social sharing metadata, structured data, sitemap, and custom 404 page
- Self-hosted fonts and icons; no frontend framework, build step, or animation library

## Tech stack

- HTML5
- CSS3
- Vanilla JavaScript (ES6+)
- Netlify Forms and Netlify hosting

## Run locally

No package installation or build command is required. Clone or download the repository, then open `index.html` in a browser. For a local web server, use the Live Server extension in Visual Studio Code.

> Netlify Forms submissions are processed when the site is deployed on Netlify; the contact form is not connected to a form backend when opened as a local file.

## Deploy

Deploy this project as a static site on [Netlify](https://www.netlify.com/):

1. Import the repository into Netlify or drag the project folder into Netlify Drop.
2. Leave the build command empty.
3. Set the publish directory to the project root.

The root-level `_headers` file supplies security headers and the Content Security Policy for Netlify deployments.

## Project structure

```text
.
├── index.html
├── 404.html
├── _headers
├── robots.txt
├── sitemap.xml
├── llms.txt
└── assets/
    ├── css/
    │   ├── styles.css
    │   └── remixicon-subset.css
    ├── fonts/
    ├── img/
    └── js/
        ├── head.js
        ├── main.js
        └── stars.js
```

## Connect

- [Portfolio website](https://portfolio-muhammad-aqibjaved.netlify.app/)
- [GitHub](https://github.com/aqibarbi)
- [LinkedIn](https://linkedin.com/in/muhammad-aqibjaved-webdev)
- [Resume](https://cv-aqib-javed.netlify.app/)

---

Designed and developed by **Muhammad Aqib Javed**.
