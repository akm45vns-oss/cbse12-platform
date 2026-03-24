# 🎓 AkMEdu - Smart Study Platform

A modern, AI-powered educational platform for comprehensive exam preparation across 12 subjects.

## Features

- ✨ **AI-Generated Study Notes** - Comprehensive notes for every chapter
- 📝 **50 Practice MCQs** - Board-level questions with detailed explanations  
- 📄 **Sample Papers** - Full subject exam papers with answer keys
- 📊 **Progress Tracking** - Individual progress for each subject
- 🔐 **Secure Authentication** - Password validation, rate limiting, and RLS
- 🎨 **Premium UI** - Professional pink theme with glassmorphism effects
- 📱 **Fully Responsive** - Works seamlessly on all devices

## Tech Stack

- **Frontend**: React 19, Vite, Modern CSS
- **Backend**: Supabase (PostgreSQL with RLS)
- **AI**: Groq API (llama-3.1-8b-instant)
- **Deployment**: Vercel
- **Database**: Supabase PostgreSQL

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- Groq API key

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd cbse12-platform

# Install dependencies
npm install

# Create .env.local file
cp .env.example .env.local

# Add your environment variables
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_KEY=your_supabase_key
GROQ_API_KEY=your_groq_api_key
```

### Running Development Server

```bash
npm run dev
```

Visit `http://localhost:5173` in your browser.

### Building for Production

```bash
npm run build
npm run preview
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run seed-notes` - Seed chapter notes to database
- `npm run retry-notes` - Retry failed note generations

## Security

This platform includes comprehensive security features:
- Password strength validation with visual feedback
- Account lockout after 5 failed login attempts (15-minute timeout)
- Row-Level Security (RLS) in database
- Input sanitization and XSS prevention
- Secure authentication with Supabase

See [SECURITY.md](./SECURITY.md) for detailed security information.

## Subjects Covered

⚛️ Physics | 🧪 Chemistry | 🌿 Biology | 📖 English | 📐 Maths | 💻 Computer Science | 📈 Economics | 🧾 Accountancy | 🏢 Business Studies | 🏛️ History | 🗳️ Political Science | 🏃 Physical Education

## Project Structure

```
src/
├── components/        # React components
│   ├── views/        # Page components (Auth, Dashboard, etc.)
│   └── common/       # Shared UI components
├── hooks/            # Custom React hooks
├── utils/            # Utility functions & security modules
├── styles/           # Global styles
└── constants/        # App constants & curriculum data

scripts/
├── seedNotes.js      # Seed initial notes
└── retryFailedNotes.js  # Retry failed generations
```

## API Integration

- **Groq API**: For AI-generated content (notes, quizzes, papers)
- **Supabase**: For authentication, database, and real-time features

## Performance

- 📦 175+ chapters pre-cached in database
- ⚡ Instant note loading from cache
- 🔄 Optimized database queries with indexing
- 📱 Mobile-first responsive design

## Browser Support

- Chrome/Edge (Latest)
- Firefox (Latest)
- Safari (Latest)
- Mobile browsers

## Contributing

This is a personal education project. For suggestions or issues, please create an issue or pull request.

## License

All rights reserved. © 2026 AkMEdu

## Developer

**Ayush Kumar Maurya**
- [LinkedIn](https://www.linkedin.com/in/ayush-kumar-maurya-326071384/)
- [GitHub](https://github.com/akm45vns-oss)
- [Instagram](https://www.instagram.com/ayush.maurya45/)

## Deployment

Live at: [cbse12-platform.vercel.app](https://cbse12-platform.vercel.app)

---

Built with ❤️ for students preparing for their exams.

