# Listless - AI-Powered Task Management

An intelligent task management application built with Next.js, TypeScript, and Supabase, featuring AI-powered auto-tagging and smart organization.

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/joshsmiths1800-gmailcoms-projects/v0-sidebar-07)
[![Built with Next.js](https://img.shields.io/badge/Built%20with-Next.js-black?style=for-the-badge&logo=next.js)](https://nextjs.org)

## Repository Structure

This repository follows a standard Git workflow with two main branches:

- **`main`** - Stable production branch (default branch)
- **`develop`** - Active development branch (target for new features and fixes)

### Development Workflow

1. **Feature Development**: Create feature branches from `develop`
2. **Pull Requests**: Submit PRs to merge into `develop` branch
3. **Testing**: All changes are tested in the `develop` branch
4. **Production**: Stable releases are merged from `develop` to `main`

## Features

- **Smart Task Organization**: Hierarchical structure with Areas → Projects → Tasks
- **AI-Powered Auto-Tagging**: Automatic tag suggestions using OpenAI embeddings
- **Drag & Drop Interface**: Intuitive task reordering and organization
- **Real-time Sync**: Live updates across all connected devices
- **Comprehensive Search**: Vector-based semantic search for tasks
- **Audit Trail**: Complete action history with undo/redo functionality

## Technology Stack

- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL with Row Level Security)
- **AI Integration**: OpenAI GPT-4 and text-embedding-3-small
- **Vector Search**: pgvector extension for semantic similarity
- **Authentication**: Supabase Auth with email/password
- **Deployment**: Vercel with automatic deployments


## Drag & Drop Performance Checklist

We recently resolved a UI freeze during task reordering by optimizing our DnD Kit integration. For a summary of root causes, fixes, best practices, and a regression checklist, see the checklist here:

- docs/DND_PERFORMANCE_CHECKLIST.md
