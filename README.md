# Team-Builder-BE

Backend API for managing teams and projects with Discord integration.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Environment Variables](#environment-variables)
  - [Installation](#installation)
  - [Running Locally](#running-locally)
  - [Docker](#docker)
- [API Endpoints](#api-endpoints)
  - [Auth Routes](#auth-routes)
  - [Project Routes](#project-routes)
  - [Team Routes](#team-routes)
  - [GuildBot Routes](#guildbot-routes)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Team-Builder-BE is an Express.js backend for building and managing project teams, especially for Discord communities. It supports user authentication via Discord OAuth, project and team management, and Discord bot integration for guild operations.

---

## Features

- **Discord OAuth Authentication:** Users log in with Discord.
- **Project Management:** Create, fetch, and delete projects.
- **Team Management:** Organize users into teams within projects.
- **CSV Import:** Bulk import members via CSV.
- **Discord Bot Integration:** Manage Discord guilds and interactions.
- **Role-based Access:** Admin/member roles for projects.
- **Notification System:** (Slack/email/Discord notifications for certain actions.)

---

## Tech Stack

- Node.js (ES Modules)
- Express.js
- MongoDB (via Mongoose)
- Discord.js (Bot integration)
- JWT (Authentication)
- Docker (Deployment)
- Other: multer, cors, dotenv, csv-parser, nodemailer, etc.

---

## Getting Started

### Environment Variables

Create a `.env` file in the project root with the following variables:

```
PORT=8080
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
DISCORD_REDIRECT_URI=your_discord_redirect_uri
DISCORD_API_URL=https://discord.com/api
DISCORD_BOT_TOKEN=your_discord_bot_token
FRONTEND_URL=https://your-frontend-url.com
```

### Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/Utkarshya24/Team-Builder-BE.git
   cd Team-Builder-BE
   ```
2. Install dependencies:
   ```sh
   npm install
   ```

### Running Locally

```sh
npm run dev
```
Server runs on `http://localhost:8080` (or as specified in `.env`).

### Docker

To build and run with Docker:

```sh
docker build -t team-builder-be .
docker run -p 8080:8080 --env-file .env team-builder-be
```

---

## API Endpoints

### Auth Routes (`/api/v1`)

- `GET /auth/discord`  
  Redirect to Discord for authentication.

- `GET /auth/callback`  
  Discord OAuth callback.

- `GET /status`  
  Returns authenticated user status (requires auth).

- `GET /@me`  
  Returns current user info (requires auth).

- `GET /guilds`  
  Fetches current user's Discord guilds (requires auth).

- `POST /auth/logout`  
  Logs out the user.

### Project Routes (`/api/v1/project`)

- `POST /create`  
  Create a new project. Accepts CSV file for bulk members (multipart/form-data).

- `GET /all-projects`  
  Fetch all projects for authenticated user.

- `DELETE /:id`  
  Delete a project by its ID (admins only).

### Team Routes (`/api/v1/team`)
_Refer to code for endpoints; similar structure as above._

### GuildBot Routes (`/api/v1/GuildBot`)

Endpoints related to Discord Bot operations.  
_Refer to implementation in `src/routes/guildBot.route.js` for details._

---

## Project Structure

```
.
├── src/
│   ├── config/         # DB, Discord, Bot configs
│   ├── controllers/    # Express route controllers
│   ├── middleware/     # Auth and request middleware
│   ├── models/         # Mongoose data models
│   ├── routes/         # Express API routes
│   ├── services/       # Status codes, mail, etc.
│   └── utils/          # Utility functions (error, response, Slack, etc.)
├── Dockerfile
├── package.json
├── .env.example
└── README.md
```

---

## Contributing

1. Fork the repo and create your branch from `main`.
2. Install dependencies with `npm install`.
3. Configure your `.env` file.
4. Make changes and add tests as needed.
5. Open a pull request.

---

## License

This project is licensed under the [ISC License](LICENSE).

---

**Maintainer:** [Utkarshya24](https://github.com/Utkarshya24)
