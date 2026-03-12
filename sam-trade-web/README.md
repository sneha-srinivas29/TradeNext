# TradeNext

A modern frontend web application built for Samunnati Agro using React, TypeScript, and Tailwind CSS.

---

## About TradeNext

**TradeNext** is a scalable and responsive web application designed to support trading and agri-related workflows. The project follows modern frontend best practices with a clean architecture, reusable components, and optimized performance.

---

## Repository

```
https://github.com/Samunnati-Agro/sam-trade-web
```

---

## Tech Stack & Libraries Used

### Core Technologies

* **React** – Component-based UI development
* **TypeScript** – Type-safe JavaScript
* **Vite** – Fast development server and build tool
* **Node.js** – JavaScript runtime
* **npm** – Package manager

### Styling & UI

* **Tailwind CSS** – Utility-first CSS framework
* **shadcn/ui** – Reusable, accessible UI components
* **lucide-react** – Icon library for React

### Routing

* **React Router DOM** – Client-side routing

---

## Library Installation Commands

```sh
# Install dependencies
npm install

# Tailwind CSS setup
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# shadcn/ui setup
npx shadcn-ui@latest init

# React Router
npm install react-router-dom

# Lucide icons
npm install lucide-react
```

---

## Project Setup (Local Development)

### Prerequisites

* Node.js (recommended via nvm)
* npm

### Steps

```sh
# Clone the repository
git clone https://github.com/Samunnati-Agro/sam-trade-web

# Navigate to the project directory
cd sam-tradenext

# Install dependencies
npm install

# Start the development server
npm run dev
```

Application runs at:

```
http://localhost:5173
```

---

## Scripts

* `npm run dev` – Start development server
* `npm run build` – Build for production
* `npm run preview` – Preview production build

---

## Folder Structure (Overview)

```
src/
├── components/     # Reusable UI components
├── pages/          # Page-level components
├── routes/         # Route configuration
├── assets/         # Images & static files
├── lib/            # Utilities and helpers
└── main.tsx        # Application entry point
```

---

## Key Highlights

* Fully responsive UI with Tailwind CSS
* Modular components using shadcn/ui
* Clean routing architecture with React Router
* Consistent icons using lucide-react

---

© Samunnati Agro – TradeNext
