# Keystone Collective · Architects & Builders

Cinematic single page site for a Boulder design build studio. Built with Next.js 16 App Router, React 19, GSAP ScrollTrigger, and Tailwind CSS 4.

## Deploy to Vercel

Option A, deploy with the CLI.

    npm install -g vercel
    vercel

Option B, deploy with Git.

    git init
    git add .
    git commit -m "Keystone Collective site"
    git remote add origin <your repository url>
    git push -u origin main

Then import the repository at vercel.com/new. Vercel detects the Next.js framework, installs dependencies, and runs next build. No environment variables are required.

## Run locally

    bun install
    bun run dev

Open http://localhost:3000. npm install and npm run dev work the same way.

## What is inside

- src/app, page shell and layout metadata
- src/components/keystone, the site sections, modals, and instruments
- src/lib/keystone, typed content modules and the image map
- src/styles/keystone.css, the site stylesheet
- public/images/real, sourced photography for team and case studies
- public/images, hero plates and documentation stills
- public/videos/hero-aerial.mp4, the looping hero backdrop
- prisma/schema.prisma, scaffold schema, unused by the site
