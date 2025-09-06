# Time Tracker

A modern, real-time time tracking application for remote teams built with Next.js, Convex, and Clerk authentication. Track work hours, view team activity, and manage time entries with timezone support.

## ✨ Features

- **Real-time Clock In/Out**: Start and stop time tracking with a single click
- **Manual Time Entry**: Add time entries for past work sessions
- **Team Visibility**: See which team members are currently active
- **Timezone Support**: Automatic timezone conversion and display
- **Session Descriptions**: Add notes to your time entries
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Secure Authentication**: Clerk-powered user authentication
- **Real-time Updates**: Live updates using Convex's real-time database

## 🛠️ Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Backend**: Convex (real-time database)
- **Authentication**: Clerk
- **Styling**: Tailwind CSS with Radix UI components
- **Icons**: Lucide React
- **Deployment**: Vercel-ready

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm, npm, yarn, or bun
- Clerk account
- Convex account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd time-tracker
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   Copy the environment setup from `ENVIRONMENT_SETUP.md` and create a `.env.local` file:

   ```env
   # Clerk Configuration
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key_here
   CLERK_SECRET_KEY=sk_test_your_clerk_secret_key_here

   # Clerk JWT Issuer Domain
   CLERK_JWT_ISSUER_DOMAIN=https://your-clerk-domain.clerk.accounts.dev

   # Convex Configuration
   NEXT_PUBLIC_CONVEX_URL=https://your-convex-deployment-url
   ```

4. **Configure Clerk JWT Template**

   Follow the detailed instructions in `ENVIRONMENT_SETUP.md` to set up the JWT template for Convex authentication.

5. **Deploy Convex backend**
   ```bash
   npx convex deploy
   ```

6. **Run the development server**
   ```bash
   pnpm dev
   ```

7. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000) and sign in with Clerk.

## 📖 Usage

### Clock In/Out
- Click the **"Clock In"** button to start tracking time
- Add an optional description of what you're working on
- Click **"Clock Out"** when you're done
- Your session will appear in the "Currently Active" section

### Manual Time Entry
- Use the "Manual Entry" form to add time for past work
- Enter start and end times for the day
- Add a description of the work completed
- Submit to record the time entry

### Viewing Team Activity
- The "Currently Active" section shows all team members who are currently clocked in
- See when they started and what they're working on
- Times are automatically displayed in your local timezone

## 🏗️ Project Structure

```
time-tracker/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Main time tracker page
│   └── globals.css        # Global styles
├── components/            # Reusable UI components
│   ├── ui/               # Radix UI components
│   └── ConvexClientProvider.tsx
├── convex/               # Convex backend
│   ├── auth.config.ts    # Authentication configuration
│   ├── schema.ts         # Database schema
│   ├── sessions.ts       # Session management functions
│   ├── users.ts          # User management functions
│   └── _generated/       # Auto-generated Convex files
├── lib/                  # Utility functions
└── public/               # Static assets
```

## 🔧 Available Scripts

- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

## 🌍 Timezone Support

The application automatically handles timezone conversions:

- Times are stored in UTC in the database
- Display times are converted to the user's configured timezone
- Supports major timezones worldwide (US, Europe, Asia, Australia)
- Falls back to local timezone if not configured

## 🔐 Authentication

- **Clerk Integration**: Secure authentication with social logins
- **JWT Tokens**: Secure API access with Clerk JWT templates
- **User Profiles**: Automatic user creation with Clerk metadata
- **Session Management**: Secure session handling with Convex

## 📊 Database Schema

### Users Table
- Clerk user ID, name, email, timezone, profile image
- Automatic user creation on first login

### Sessions Table
- User reference, date, start/end times, duration
- Optional descriptions and notes
- Indexed for efficient querying

## 🚀 Deployment

### Vercel Deployment

1. **Connect your repository to Vercel**
2. **Set environment variables** in Vercel dashboard
3. **Deploy**: Automatic deployments on push to main branch

### Convex Deployment

The Convex backend is automatically deployed when you run:
```bash
npx convex deploy
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes and test thoroughly
4. Commit your changes: `git commit -am 'Add some feature'`
5. Push to the branch: `git push origin feature/your-feature`
6. Submit a pull request

## 📄 License

This project is private and proprietary. All rights reserved.

## 🆘 Support

For issues or questions:
1. Check the `ENVIRONMENT_SETUP.md` for configuration help
2. Review Convex and Clerk documentation
3. Create an issue in the repository

## 🔄 Recent Updates

- Real-time team activity dashboard
- Enhanced timezone support with automatic conversions
- Improved UI with better mobile responsiveness
- Manual time entry functionality
- Session descriptions and notes
