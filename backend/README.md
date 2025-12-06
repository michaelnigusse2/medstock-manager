# Pharmacy Management System - Backend

This directory contains the Node.js backend for the Pharmacy Management System.

## Prerequisites

- Node.js
- npm

## Getting Started

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Set Up Environment Variables:**
    Create a `.env` file in this directory and add the following:
    ```
    JWT_SECRET=your_secret_here
    ```
    Replace `your_secret_here` with a long, random string.

3.  **Run Database Migrations:**
    ```bash
    npx prisma migrate dev
    ```

4.  **Seed the Database:**
    ```bash
    npm run prisma:seed
    ```

5.  **Start the Development Server:**
    ```bash
    npm run dev
    ```
    The server will be running at `http://localhost:3000`.
