# Arjuna AI - Next.js Interview Platform 🚀

A modern, AI-powered interview practice platform built with Next.js 15, featuring real-time voice interviews, instant feedback, and comprehensive analytics.

## ✨ Features

- 🎤 **Voice-based AI Interviews** - Practice with realistic AI interviewers
- 📊 **Instant Feedback & Scoring** - Get detailed analysis after each session
- 🎯 **Role-specific Templates** - Choose from various job positions
- 🏆 **Gamification** - Earn badges, climb leaderboards, maintain streaks
- 📈 **Analytics Dashboard** - Track your progress over time
- 🌓 **Dark/Light Mode** - Beautiful themes for any preference
- 📱 **Fully Responsive** - Works perfectly on all devices

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd interviewer-nextjs
npm install
```

### 2. Set Up Your Supabase Backend

This project uses a **separate Supabase backend** from the React version.

1. Create a new Supabase project at https://supabase.com
2. Follow the detailed setup guide: **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)**
3. Get your API credentials from Supabase dashboard

### 3. Configure Environment Variables

Create/update `.env.local` with your credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_GEMINI_API_KEY=your-gemini-key-here
```

See `.env.example` for a template.

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your app! 🎉

### 5. Build for Production

```bash
npm run build
npm start
```

## 📁 Project Structure

```
interviewer-nextjs/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Root layout with providers
│   │   ├── page.tsx            # Home/Landing page
│   │   ├── providers.tsx       # Client-side providers
│   │   ├── auth/              # Authentication pages
│   │   ├── dashboard/         # Dashboard
│   │   ├── templates/         # Interview templates
│   │   ├── reports/           # Interview reports
│   │   ├── leaderboard/       # Leaderboard
│   │   ├── badges/            # Badges & achievements
│   │   ├── settings/          # User settings
│   │   └── ...                # Other routes
│   ├── pages-content/         # Page components (from React version)
│   ├── components/            # Reusable UI components
│   │   ├── ui/               # shadcn/ui components
│   │   └── ...               # Custom components
│   ├── lib/                   # Utilities & helpers
│   ├── hooks/                 # Custom React hooks
│   ├── types/                 # TypeScript type definitions
│   ├── stores/                # Zustand state management
│   ├── integrations/          # Supabase integration
│   │   └── supabase/
│   │       ├── client.ts     # Supabase client (SSR-ready)
│   │       └── types.ts      # Database types
│   ├── config/                # App configuration
│   └── prompts/               # AI prompts
├── public/                    # Static assets
├── .env.local                 # Environment variables (create this!)
├── .env.example              # Environment template
├── tailwind.config.ts        # Tailwind configuration
├── SUPABASE_SETUP.md         # Detailed Supabase setup guide
└── MIGRATION_SUMMARY.md      # Migration details from React
```

## 🎨 Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **Framer Motion** - Animations

### Backend & Services
- **Supabase** - Backend as a Service
  - Authentication
  - PostgreSQL Database
  - Row Level Security
  - Storage
- **Google Gemini AI** - AI interview generation

### State & Data
- **TanStack Query** - Server state management
- **Zustand** - Client state management
- **React Hook Form** - Form handling
- **Zod** - Schema validation

## 🔐 Authentication

The app supports:
- ✅ Email/Password authentication
- ✅ Google OAuth (configure in Supabase)
- ✅ Protected routes
- ✅ Session persistence

## 📊 Database Schema

Main tables:
- `profiles` - User profiles
- `interview_sessions` - Interview records
- `user_badges` - Earned badges
- `leaderboard` - View for rankings

See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for complete schema.

## 🎯 Key Features Explained

### 1. Voice Interviews
- Real-time voice interaction with AI
- Natural conversation flow
- Instant transcription and analysis

### 2. Smart Feedback
- Technical knowledge assessment
- Communication skills evaluation
- Problem-solving analysis
- Actionable improvement tips

### 3. Progress Tracking
- Interview history
- Score trends over time
- Skill breakdown
- Performance metrics

### 4. Gamification
- Daily streaks
- Achievement badges
- Global leaderboard
- Competitive rankings

## 🚢 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/interviewer-nextjs)

### Other Platforms
- **Netlify**: Works great with Next.js
- **Railway**: Easy deployment with database
- **AWS Amplify**: Enterprise-grade hosting

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | ✅ Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | ✅ Yes |
| `NEXT_PUBLIC_GEMINI_API_KEY` | Google Gemini API key | ✅ Yes |

### Tailwind Theme

Customize colors in `tailwind.config.ts` and `src/app/globals.css`.

## 📝 Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Code Style
- Use TypeScript for type safety
- Follow Next.js best practices
- Use "use client" for client components
- Keep server components when possible

## 🐛 Troubleshooting

### Common Issues

**"Supabase credentials not found"**
- Check `.env.local` exists and has correct variables
- Restart dev server after changing env vars

**Build errors**
- Clear `.next` folder: `rm -rf .next`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`

**Authentication issues**
- Verify Supabase RLS policies
- Check auth configuration in Supabase dashboard

## 📚 Documentation

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)

## 🤝 Contributing

This is a frontend-only project. Backend is managed through Supabase.

## 📄 License

Same as the original project.

## 🆘 Support

For issues or questions:
1. Check [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
2. Check [MIGRATION_SUMMARY.md](./MIGRATION_SUMMARY.md)
3. Review Supabase dashboard logs
4. Check browser console for errors

---

**Built with ❤️ using Next.js and Supabase**

## 🎓 Learning Resources

- [Next.js Learn](https://nextjs.org/learn)
- [Supabase University](https://supabase.com/docs/guides/getting-started)
- [React Documentation](https://react.dev)

---

### 🚀 Ready to Start?

1. ✅ Install dependencies: `npm install`
2. ✅ Set up Supabase (see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md))
3. ✅ Configure `.env.local`
4. ✅ Run `npm run dev`
5. ✅ Open http://localhost:3000

**Happy interviewing! 🎤**

## Optimizations

### Performance Improvements
We've implemented several optimizations to reduce interview connection time:

1. **Token Pre-fetching** ✅
   - LiveKit token is fetched on the setup page before navigation
   - Cached in sessionStorage for instant use on live page
   - Saves ~300-500ms connection time
   - Graceful fallback if pre-fetch fails

2. **Parallel Execution** ✅
   - Microphone access and token fetching run simultaneously (when no cached token)
   - Uses `Promise.all()` to execute both operations in parallel
   - Reduces wait time from 800ms to ~500ms (duration of longest operation)
   - Only applies when token pre-fetch is unavailable

### Performance Timeline

**Before Optimization:**
```
Mic Request (500ms) → Token Fetch (300ms) → Connect (200ms)
Total: ~1000ms
```

**After Optimization (with pre-fetched token):**
```
Token already cached (0ms) → Mic Request (500ms) → Connect (200ms)
Total: ~700ms (30% faster)
```

**After Optimization (without cached token - parallel):**
```
[Mic Request (500ms) + Token Fetch (300ms)] → Connect (200ms)
Total: ~700ms (30% faster)
```
source /home/sumit/Documents/Agent/.venv/bin/activate
uv run python src/agent.py dev

