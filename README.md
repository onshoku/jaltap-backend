# Jaltap Backend

This is the backend for the Jaltap application, built using Node.js, Express, and TypeScript. It provides APIs for various functionalities such as user profiles, authentication, JLPT-related data, and admin operations.

---

## Table of Contents
- [Routes](#routes)
- [Getting Started](#getting-started)
- [Scripts](#scripts)
- [Using Nodemon](#using-nodemon)
- [Directory Structure](#directory-structure)

---

## Routes

The backend exposes the following API groups:

### Profile Routes
- `GET /api/profile` - Fetch all profiles.
- `GET /api/profile/:id` - Fetch a specific profile by ID.

### Authentication Routes
- `POST /api/auth/login` - Login to the application.
- `POST /api/auth/register` - Register a new user.

### JLPT Routes
- `GET /api/jlpt` - Fetch all JLPT levels.
- `GET /api/jlpt/:level` - Fetch details for a specific JLPT level.

### Admin Routes
- `GET /api/admin/dashboard` - Access the admin dashboard.
- `POST /api/admin/create` - Create a new resource.

---

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm (v8 or higher)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/jaltap-backend.git
   cd jaltap-backend
   ```
2. Install dependencies
```bash
npm install
```

3. Create a `.env` file in the root directory and add the following environment variables:
```bash
PORT=3000
STATUS=local
AWS_ACCESS_KEY_ID=<create key for jaltap-backend IAM User>
AWS_SECRET_ACCESS_KEY=<create secret for jaltap-backend IAM User>
```

4. Start the server:
```bash
npm start
```

5. Test DynamoDB connection
```bash

Go to: http://localhost:3000/api/auth/table/Users 

# this is just a dummy endpoint to check dynamoDB connection, replaces "Users" by the table name

```


### Scripts
`npm start`
Starts the server in development mode using nodemon. It watches for changes in the src directory and automatically restarts the server when changes are detected.

`npm run build`
Compiles the TypeScript files into JavaScript and outputs them to the dist directory.

### Using Nodemon
`nodemon` is a development tool that monitors changes in your source files and automatically restarts the server when changes are detected. This eliminates the need to manually stop and restart the server after every code change.

How it works in this project:

- The start script in package.json is configured to use nodemon with the following options:
    - --watch src: Watches the src directory for changes.
    - --ext ts: Monitors .ts files for changes.
    - --exec ts-node: Executes the TypeScript files directly using ts-node.
    - -r dotenv/config: Loads environment variables from the .env file.

Usage: Simply run:

`npm start`

Edit your code, and the server will automatically restart to reflect the changes.

