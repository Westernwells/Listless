# Listless - AI-Powered Task Management

## 🎯 What is Listless?

**Listless** is an intelligent task management application that revolutionizes productivity through AI-powered organization. Built with modern web technologies, it features smart auto-tagging, semantic search, and intuitive drag-and-drop interfaces to help users manage tasks effortlessly.

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/joshsmiths1800-gmailcoms-projects/v0-sidebar-07)
[![Built with Next.js](https://img.shields.io/badge/Built%20with-Next.js-black?style=for-the-badge&logo=next.js)](https://nextjs.org)

### Key Features
- **🧠 AI-Powered Auto-Tagging**: Automatic tag suggestions using OpenAI embeddings and GPT-4
- **🏗️ Smart Task Organization**: Hierarchical structure with Areas → Projects → Tasks
- **🔍 Vector-Based Search**: Comprehensive semantic search using pgvector
- **🎯 Drag & Drop Interface**: Intuitive task reordering and organization
- **📋 Audit Trail**: Complete action history with undo/redo functionality
- **⚡ Real-time Sync**: Live updates across all connected devices

### Project Status
Currently in active development with comprehensive testing infrastructure and production-ready deployment capabilities.

## 🛠️ Technology Stack

### Frontend
- **Next.js 14** with App Router - Modern React framework with server-side rendering
- **TypeScript** (Strict Mode) - Type-safe development with comprehensive error checking
- **Tailwind CSS** - Utility-first CSS framework for rapid UI development
- **Shadcn UI** - High-quality, accessible component library
- **TanStack Query** - Server state management and caching
- **React Hook Form + Zod** - Form handling with schema validation
- **DnD Kit** - Drag and drop functionality with performance optimizations

### Backend & Database
- **Supabase** - Complete backend-as-a-service platform
  - **PostgreSQL** with Row Level Security (RLS) for data protection
  - **Supabase Auth** - Email/password authentication with JWT tokens
  - **Real-time subscriptions** - Live data synchronization
  - **Edge Functions** - Serverless TypeScript/Node.js functions
- **pgvector** - Vector similarity search for AI-powered features

### AI Integration
- **OpenAI GPT-4** - Intelligent reasoning for auto-tagging and content analysis
- **text-embedding-3-small** - Semantic embeddings for vector search
- **Hybrid AI Model** - Combines semantic similarity with intelligent reasoning

### Development & Deployment
- **Vite** - Fast development build tool
- **Playwright** - End-to-end testing framework
- **Vercel** - Production deployment with automatic CI/CD
- **pnpm** - Fast, disk space efficient package manager

### Security & Performance
- **Row Level Security (RLS)** - Database-level access control
- **JWT Authentication** - Secure token-based authentication
- **Server-side Validation** - All data validated with Zod schemas
- **Optimistic Updates** - Enhanced UX with TanStack Query
- **Vector Indexing** - HNSW and IVFFlat indexes for fast similarity search

## 🔒 Security Implementation

### Current Security Measures
- **Database Security**: Row Level Security (RLS) policies ensure users only access their own data
- **Authentication**: Supabase Auth with secure JWT token validation
- **API Security**: Server-side validation using Zod schemas for all endpoints
- **Environment Security**: Sensitive keys stored in environment variables, never exposed client-side
- **CORS Configuration**: Proper cross-origin resource sharing setup

### Security Enhancements Needed
- **Rate Limiting**: Implement API rate limiting to prevent abuse
- **Input Sanitization**: Enhanced XSS protection for user-generated content
- **Audit Logging**: Comprehensive security event logging
- **Session Management**: Advanced session timeout and refresh token rotation
- **Content Security Policy**: Implement CSP headers for XSS protection

## 🚀 Repository Structure

This repository follows a standard Git workflow with two main branches:

- **`main`** - Stable production branch (default branch)
- **`develop`** - Active development branch (target for new features and fixes)

### Development Workflow

1. **Feature Development**: Create feature branches from `develop`
2. **Pull Requests**: Submit PRs to merge into `develop` branch
3. **Testing**: All changes are tested in the `develop` branch
4. **Production**: Stable releases are merged from `develop` to `main`

## 🏗️ Project Overview

### Vision & Goals
Listless aims to revolutionize personal and team productivity by combining intelligent AI assistance with intuitive task management. The project focuses on reducing cognitive overhead in task organization while providing powerful search and automation capabilities.

### What Makes Listless Unique
- **Hybrid AI Intelligence**: Combines semantic embeddings with GPT-4 reasoning for superior auto-tagging
- **Vector-Powered Search**: Uses pgvector for semantic similarity search beyond keyword matching
- **Performance-Optimized UX**: Carefully tuned drag-and-drop with optimistic updates for smooth interactions
- **Comprehensive Audit Trail**: Complete action history with undo/redo for confidence in task management
- **Developer-First Architecture**: Built with modern tools and patterns for maintainability and scalability

### Current Development Stage
- **Core Features**: ✅ Complete (Task management, AI tagging, search, drag-and-drop)
- **Testing Infrastructure**: ✅ Complete (Playwright E2E, comprehensive test suite)
- **Production Deployment**: ✅ Active (Vercel with automatic deployments)
- **Security Implementation**: 🔄 In Progress (RLS complete, additional hardening planned)
- **Performance Optimization**: ✅ Complete (Recent DnD performance improvements)

### Development Priorities
1. **Security Enhancements**: Rate limiting, advanced session management, CSP implementation
2. **Feature Expansion**: Advanced AI capabilities, team collaboration features
3. **Mobile Optimization**: Progressive Web App (PWA) capabilities
4. **Integration Ecosystem**: Third-party service integrations and API development

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and pnpm
- Supabase account and project
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/josh000111/Listless_V0_8-6.git
   cd Listless_V0_8-6
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your API keys
   ```

4. **Database Setup**
   ```bash
   # Run Supabase migrations
   npx supabase db push
   ```

5. **Start Development Server**
   ```bash
   pnpm dev
   ```

Visit `http://localhost:3000` to see the application.

## 🧪 Testing

### End-to-End Testing
```bash
# Install Playwright browsers
npx playwright install

# Run tests in UI mode (recommended for development)
pnpm test:ui

# Run tests headlessly
pnpm test
```

### Test Coverage
- **Authentication Flow**: User registration, login, logout
- **Task Management**: Create, update, delete, reorder tasks
- **AI Features**: Auto-tagging, semantic search
- **Drag & Drop**: Task reordering across different views
- **Real-time Sync**: Multi-user collaboration scenarios

## 📚 Documentation

### Developer Resources
- **[API Documentation](docs/API_DOCUMENTATION.md)** - Complete API endpoint reference
- **[Security Guide](docs/RLS_SECURITY_GUIDE.md)** - Row Level Security implementation
- **[Testing Guide](docs/TESTING_GUIDE.md)** - Testing standards and procedures
- **[Performance Checklist](docs/DND_PERFORMANCE_CHECKLIST.md)** - Drag-and-drop optimization guide

### Centralized Documentation
The `README-Documentation/` folder contains comprehensive developer onboarding resources:
- **[INDEX.md](README-Documentation/INDEX.md)** - Navigation guide for new developers
- **[Augment_Rules.txt](README-Documentation/Augment_Rules.txt)** - Development standards and AI agent rules

## 🤝 Contributing

1. **Fork the repository** and create a feature branch from `develop`
2. **Follow the coding standards** outlined in `Augment_Rules.txt`
3. **Write tests** for new features and ensure existing tests pass
4. **Submit a pull request** to the `develop` branch

### Development Standards
- TypeScript strict mode with comprehensive type safety
- Feature-based file organization
- TanStack Query for server state management
- React Hook Form + Zod for form validation
- Comprehensive testing with Playwright

## 🔗 Related Resources

- **Production Deployment**: [Vercel Dashboard](https://vercel.com/joshsmiths1800-gmailcoms-projects/v0-sidebar-07)
- **Database**: Supabase PostgreSQL with pgvector extension
- **AI Integration**: OpenAI GPT-4 and text-embedding-3-small
- **Testing**: Playwright end-to-end testing framework

## 📄 License

This project is proprietary software. All rights reserved.
