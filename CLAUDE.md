# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Epharma IA is a French-language pharmaceutical AI assistant web application built with vanilla HTML, CSS, and JavaScript. It provides a chat interface for pharmaceutical consultations and integrates with an n8n webhook for AI responses.

## Architecture

This is a single-page application (SPA) with three main files:
- `index.html` - Main UI structure with authentication overlay and chat interface
- `script.js` - Core application logic and state management  
- `styles.css` - Complete styling with dark theme and responsive design

### Key Components

**Authentication System**: Local storage-based user management with login/register forms
**Chat System**: Real-time messaging with conversation persistence per user
**n8n Integration**: Webhook-based AI responses via HTTP POST to localhost:5678

### State Management

The application uses global variables for state:
- `currentUser` - Current authenticated user object
- `conversations` - Object containing all user conversations by ID
- `currentConversationId` - Active conversation identifier
- `isGenerating` - Boolean flag for AI response generation state

### Data Persistence

- User accounts stored in localStorage under "epharma_users"
- User conversations stored per user: "epharma_conversations_{userId}"
- Current session stored under "epharma_current_user"

## Development

### Running the Application

Open `index.html` directly in a web browser. No build process required.

### n8n Integration

The application expects an n8n instance running on `http://localhost:5678` with webhook endpoint:
`/webhook-test/c1630bc2-7417-411e-9b8a-937ea034bb82`

Update the `N8N_WEBHOOK_URL` constant in script.js:31 to modify the endpoint.

### Message Flow

1. User sends message via `sendMessage()` function
2. Message added to conversation and displayed
3. HTTP POST sent to n8n webhook with `{chatInput: message}`
4. Response parsed from multiple possible response formats (output, reply, response, message, text)
5. AI response displayed with typewriter animation

### Conversation Management

- New conversations created automatically on first message
- Conversation titles generated from first user message (first 6 words)
- Conversations sorted by most recent activity
- Delete functionality with confirmation

### UI Features

- Responsive sidebar with conversation list
- Typewriter animation for AI responses
- Stop generation functionality
- Quick action buttons for common queries
- Authentication overlay with login/register forms