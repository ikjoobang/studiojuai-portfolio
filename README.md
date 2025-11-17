# studiojuai.club

## Project Overview

■ **Name**: studiojuai.club Video Portfolio Website
■ **Goal**: Professional video portfolio website with custom CMS for managing video content
■ **Design**: Inspired by glovv.co.kr - Modern, minimal, professional aesthetic

## URLs

**Sandbox Development**: https://3000-inpggaelylmc1mvkpox1o-3844e1b6.sandbox.novita.ai
**Production**: (Will be deployed to Cloudflare Pages)
**Admin CMS**: /admin (username: admin, password: admin123)

## Features

### ❶ Main Portfolio Page

✔️ Clean, minimal design inspired by glovv.co.kr
✔️ Typography-focused layout with generous whitespace
✔️ Video grid display (3 columns on desktop, 1 column on mobile)
✔️ Smooth scrolling sections (Hero, Portfolio, Contact)
✔️ Professional color scheme with accent color #FF6B35

### ❷ Custom CMS (Admin Panel)

✔️ Password-protected admin login (/admin)
✔️ Full CRUD operations for portfolio projects
✔️ Manage video URLs, thumbnails, titles, descriptions
✔️ Category tagging and display order control
✔️ Publish/unpublish functionality

### ❸ Video Management

✔️ Direct video URL hosting (no YouTube/Vimeo embeds)
✔️ Cloudflare R2 integration ready for video uploads
✔️ Thumbnail support for video previews
✔️ Native HTML5 video player with controls

### ❹ GPT-4 mini Chatbot

✔️ Floating chatbot button (bottom-right corner)
✔️ Real-time customer inquiries support
✔️ OpenAI GPT-4o-mini integration
✔️ Professional responses about video services

## Technology Stack

### Frontend
- HTML5, CSS3 (Tailwind CSS CDN)
- JavaScript (ES6+)
- Font: Pretendard (Google Fonts)
- Icons: Font Awesome 6

### Backend
- Hono Framework (Cloudflare Workers)
- Cloudflare Pages Functions
- Cloudflare D1 (SQLite Database)
- Cloudflare R2 (Video Storage - ready)

### AI Integration
- OpenAI GPT-4o-mini API
- Temperature: 0.7
- Max tokens: 500

## Data Architecture

### Database Schema

**projects table**
```sql
- id TEXT PRIMARY KEY
- title TEXT NOT NULL
- description TEXT
- video_url TEXT NOT NULL
- thumbnail_url TEXT
- category TEXT
- display_order INTEGER
- is_published INTEGER
- created_at DATETIME
- updated_at DATETIME
```

**admin_users table**
```sql
- id TEXT PRIMARY KEY
- username TEXT UNIQUE NOT NULL
- password_hash TEXT NOT NULL
- email TEXT
- created_at DATETIME
- last_login DATETIME
```

## User Guide

### For Website Visitors

❶ Browse the portfolio on the main page
❷ Watch videos directly on the website
❸ Click chatbot button for inquiries
❹ Contact via email: studio.ikjoo@gmail.com

### For Admin

❶ Access /admin page
❷ Login with credentials (admin/admin123)
❸ Create new projects with video URLs
❹ Edit existing projects
❵ Publish/unpublish projects
❻ Manage display order

## Design System

### Typography
- **Headline**: 48px (mobile: 32px), font-weight: 800
- **Subheadline**: 28px (mobile: 22px), font-weight: 700
- **Body**: 16px, font-weight: 400
- **Emphasis**: 24px, font-weight: 600

### Spacing
- **Section spacing**: 100px (mobile: 60px)
- **Card spacing**: 28px gap
- **Container padding**: 0 24px

### Colors
- **Primary**: #FFFFFF (white background)
- **Text**: #000000 (black)
- **Accent**: #FF6B35 → #FF8C42 (gradient)
- **Card**: White with subtle shadow

### Components
- **Buttons**: 16px padding, 6px border-radius
- **Cards**: 12px border-radius, hover effects
- **Video**: 16:9 aspect ratio containers

## Local Development

### 1. Install dependencies
```bash
cd /home/user/webapp
npm install
```

### 2. Setup environment variables
```bash
# .dev.vars file
OPENAI_API_KEY=your-openai-api-key
```

### 3. Initialize D1 database
```bash
npm run db:migrate:local
```

### 4. Build and run
```bash
npm run build
pm2 start ecosystem.config.cjs
```

### 5. Access the site
- Main site: http://localhost:3000
- Admin CMS: http://localhost:3000/admin
- API health: http://localhost:3000/api/health

## Production Deployment

### Prerequisites
- Cloudflare account
- Cloudflare API token
- GitHub repository

### Deployment Steps

❶ **Create Cloudflare D1 database**
```bash
npm run db:create
# Copy database_id to wrangler.jsonc
```

❷ **Apply migrations to production**
```bash
npm run db:migrate:prod
```

❸ **Set environment secrets**
```bash
npx wrangler pages secret put OPENAI_API_KEY
```

❹ **Deploy to Cloudflare Pages**
```bash
npm run deploy
```

❺ **Create R2 bucket (optional)**
```bash
npm run r2:create
```

## API Endpoints

### Public APIs
- `GET /api/health` - Health check
- `GET /api/projects` - Get all published projects
- `GET /api/projects/:id` - Get single project
- `POST /api/chat` - GPT chatbot endpoint

### Admin APIs (Authentication required)
- `POST /api/admin/login` - Admin login
- `GET /api/admin/projects` - Get all projects (including unpublished)
- `POST /api/admin/projects` - Create new project
- `PUT /api/admin/projects/:id` - Update project
- `DELETE /api/admin/projects/:id` - Delete project
- `POST /api/admin/upload-video` - Upload video to R2

## Project Structure

```
webapp/
├── src/
│   ├── index.tsx          # Main Hono application
│   └── renderer.tsx       # JSX renderer
├── public/
│   └── static/            # Static assets
├── migrations/
│   └── 0001_initial_schema.sql
├── .dev.vars              # Local environment variables (not committed)
├── ecosystem.config.cjs   # PM2 configuration
├── wrangler.jsonc         # Cloudflare configuration
├── package.json           # Dependencies and scripts
└── README.md             # This file
```

## Security Notes

■ Admin password is hardcoded for MVP (admin123)
■ For production: Implement proper bcrypt password hashing
■ OpenAI API key stored as Cloudflare secret
■ .dev.vars file excluded from git (.gitignore)

## Deployment Status

✅ **Local Development**: Active
✅ **Database**: Initialized
✅ **API Endpoints**: Functional
✅ **CMS**: Operational
✅ **Chatbot**: Integrated
⏳ **Production**: Ready to deploy

## Recommended Next Steps

❶ Add sample video projects in admin CMS
❷ Configure custom domain (studiojuai.club)
❸ Set up Cloudflare R2 for video hosting
❹ Deploy to Cloudflare Pages production
❺ Implement proper authentication system
❻ Add video upload functionality in CMS
❼ Optimize video transcoding and streaming

## Contact

**Email**: studio.ikjoo@gmail.com
**Website**: https://studiojuai.club

---

**Made with ❤️ for creative professionals**

**Tech Stack**: Hono + Cloudflare Pages + D1 + R2 + GPT-4o-mini
**Last Updated**: 2025-11-17
