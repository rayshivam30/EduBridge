# EduBridge 🌉

**Learn Anywhere. Anytime. Together.**

EduBridge is a modern, offline-first learning platform that connects rural and urban students with equal access to educational resources. Built with Next.js 16, it features AI-powered tutoring, interactive quizzes, community forums, and comprehensive course management.

🚀 **[Live Demo](https://edu-bridge-lac.vercel.app/)**

## ✨ Features

### 🎓 Core Learning Platform
- **Course Management**: Create, publish, and manage comprehensive courses
- **Multi-format Content**: Support for text, videos (YouTube/uploads), and external links
- **Progress Tracking**: Real-time learning progress with completion percentages
- **Offline Support**: PWA with offline capabilities for uninterrupted learning

### 🤖 AI-Powered Learning
- **AI Tutor**: Personalized tutoring powered by Google Generative AI and OpenAI
- **Custom Quiz Generation**: AI-generated quizzes based on course content
- **Adaptive Learning**: Personalized learning paths based on student progress

### 🎮 Gamification & Engagement
- **Points & Achievements**: Earn points and unlock achievements
- **Streak System**: Maintain learning streaks for consistent progress
- **Leaderboards**: Compete with peers and track progress
- **Level System**: Progress through different learning levels

### 👥 Community Features
- **Discussion Forums**: Course-specific and general discussion threads
- **Announcements**: Teachers can broadcast updates to students
- **Social Learning**: Like, reply, and engage with community content

### 🔐 Authentication & Roles
- **NextAuth Integration**: Secure authentication with multiple providers
- **Role-based Access**: Separate dashboards for students and teachers
- **Protected Routes**: Middleware-based route protection

## 🛠️ Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **Framer Motion** - Smooth animations
- **React Hook Form** - Form management with Zod validation

### Backend & Database
- **Prisma** - Type-safe database ORM
- **PostgreSQL** - Primary database (Neon)
- **NextAuth.js** - Authentication system
- **Upstash Redis** - Caching and session storage

### AI & External Services
- **Groq SDK** - Fast AI inference
- **Cloudinary** - Media management and optimization

### PWA & Performance
- **Workbox** - Service worker and offline functionality
- **Dexie** - IndexedDB wrapper for offline data
- **Vercel Analytics** - Performance monitoring

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm
- PostgreSQL database (or Neon account)
- Cloudinary account for media storage

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd edubridge
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Configure your `.env` file with:
   ```env
   # Database
   DATABASE_URL="postgresql://..."
   
   # NextAuth
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   
   # AI Services
   GROQ_API_KEY="your-groq-key"
   
   # Cloudinary
   CLOUDINARY_CLOUD_NAME="your-cloud-name"
   CLOUDINARY_API_KEY="your-api-key"
   CLOUDINARY_API_SECRET="your-api-secret"
   
   # Redis (Upstash)
   UPSTASH_REDIS_REST_URL="your-redis-url"
   UPSTASH_REDIS_REST_TOKEN="your-redis-token"
   ```

4. **Database Setup**
   ```bash
   pnpm prisma generate
   pnpm prisma db push
   ```

5. **Start Development Server**
   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📱 PWA Installation

EduBridge works as a Progressive Web App:

1. **Desktop**: Click the install button in your browser's address bar
2. **Mobile**: Use "Add to Home Screen" from your browser menu
3. **Offline**: Access courses and content even without internet connection

## 🏗️ Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── actions/           # Server actions
│   ├── api/               # API routes
│   ├── ai-tutor/          # AI tutoring interface
│   ├── announcements/     # Announcements management
│   ├── community-forum/   # Discussion forums
│   ├── course-player/     # Course content player
│   ├── courses/           # Course browsing and management
│   ├── create-course/     # Course creation interface
│   ├── login/             # Authentication pages
│   ├── signup/            # User registration
│   ├── onboarding/        # User role selection
│   ├── quiz/              # Quiz interface
│   ├── student*/          # Student-specific pages
│   ├── teacher*/          # Teacher-specific pages
│   └── manage-course/     # Course management tools
├── components/            # Reusable UI components
│   ├── gamification/      # Achievement and progress components
│   ├── quiz/              # Quiz-related components
│   ├── revision/          # Study revision tools
│   └── ui/                # Base UI components (Radix UI)
├── hooks/                 # Custom React hooks
│   ├── use-gamification.ts # Gamification logic
│   ├── use-offline*.ts    # Offline functionality hooks
│   └── use-mobile.ts      # Mobile-specific hooks
├── lib/                   # Utility functions and configurations
│   ├── aiClient.ts        # AI service integrations
│   ├── auth.ts            # NextAuth configuration
│   ├── cloudinary.ts      # Media upload handling
│   ├── gamification.ts    # Points and achievements logic
│   ├── offline-*.ts       # Offline data management
│   ├── prisma.ts          # Database client
│   └── utils.ts           # General utilities
├── prisma/               # Database schema and migrations
│   ├── migrations/        # Database migration files
│   ├── schema.prisma      # Database schema definition
│   └── seed.ts            # Database seeding script
├── public/               # Static assets and PWA files
│   ├── icon-*.png         # PWA icons
│   ├── manifest.json      # PWA manifest
│   ├── sw.js              # Service worker
│   └── placeholder.*      # Placeholder images
├── styles/               # Global styles
└── middleware.ts         # Route protection and authentication
```

## 🎯 Key Features Deep Dive

### Course Management
- **Rich Content Editor**: Support for multiple content types
- **Video Integration**: Upload to Cloudinary or embed YouTube videos
- **Progress Tracking**: Automatic progress calculation and completion tracking
- **Enrollment System**: Manage student enrollments and access

### AI Tutoring
- **Contextual Help**: AI understands course content and student progress
- **Multiple AI Providers**: Fallback system with Google AI, OpenAI, and Groq
- **Personalized Responses**: Tailored explanations based on learning level

### Gamification System
- **Achievement Types**: First lesson, streak milestones, quiz mastery
- **Point System**: Earn points for completing lessons and quizzes
- **Streak Tracking**: Daily activity streaks with longest streak records
- **Level Progression**: Advance through levels based on total points

## 🔧 Available Scripts

```bash
# Development
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server

# Database
pnpm prisma generate    # Generate Prisma client
pnpm prisma db push     # Push schema to database
pnpm prisma studio      # Open Prisma Studio

# Code Quality
pnpm lint         # Run ESLint
pnpm type-check   # Run TypeScript compiler
```

## 🌐 Deployment

**Live Application**: [https://edu-bridge-lac.vercel.app/](https://edu-bridge-lac.vercel.app/)

### Vercel (Recommended)
1. Connect your repository to Vercel
2. Configure environment variables
3. Deploy automatically on push to main

### Manual Deployment
```bash
pnpm build
pnpm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---
