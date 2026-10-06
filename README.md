# Lost & Found Hub

> **Find what matters.**  
> A centralized, privacy-first campus asset recovery platform designed for universities and shared environments.

---

## 1. Project Overview

**Lost & Found Hub** solves fragmented campus item recovery by combining structured reporting, privacy-preserving verification questions, role-based governance, and automated lifecycle management into a single, cohesive Progressive Web App (PWA).

### Core Product Loop

```text
REPORT  ──►  DISCOVER  ──►  VERIFY  ──►  CLAIM  ──►  REVIEW  ──►  RESOLVE  ──►  ARCHIVE
```

---

## 2. Architecture & Technology Stack

The architecture is locked as a **Modular Monolith** targeting ₹0 recurring infrastructure cost for MVP:

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS (warm cream & gold/amber design system), React Router, Motion for React, PWA (`vite-plugin-pwa`).
- **Backend:** Java 21 LTS, Spring Boot 3.3.5, Spring Security, JWT (JJWT 0.12.6), Spring Data JPA / Hibernate, Bean Validation, Spring `@Scheduled` tasks.
- **Database:** PostgreSQL with Flyway schema migrations.
- **File Storage:** Local file storage (development) / Free-tier object storage behind an isolated storage service abstraction.
- **Build Tools:** npm (Frontend), Maven with Maven Wrapper (Backend).

---

## 3. Project Structure

```text
.
├── context/               # Authoritative project specifications (00 to 12), PDF, and approved UI blueprint
├── backend/               # Spring Boot 3.3.5 (Java 21) REST API application
│   ├── src/main/java/     # Layered architecture (config, security, controller, dto, service, etc.)
│   ├── src/main/resources/# Application configuration (application.yml) and Flyway migrations
│   ├── pom.xml            # Maven build configuration
│   └── mvnw.cmd / mvnw    # Maven wrapper
├── frontend/              # React + TypeScript + Vite PWA application
│   ├── src/               # Feature-driven frontend architecture
│   │   ├── components/    # Reusable UI components
│   │   ├── features/      # Domain modules (auth, items, claims, notifications, admin)
│   │   ├── services/      # Centralized API client
│   │   ├── types/         # Domain TypeScript interfaces
│   │   └── lib/           # UI and utility functions
│   ├── tailwind.config.js # Design system tokens
│   ├── vite.config.ts     # Vite + PWA configuration
│   └── package.json       # Frontend dependencies & scripts
├── .env.example           # Environment variables template
├── .gitignore             # Root git ignore rules
└── README.md              # Project documentation
```

---

## 4. Prerequisites

- **Node.js:** v20+ / v24+
- **npm:** v10+ / v11+
- **Java JDK:** Java 21 LTS (or compatible JDK 21+)
- **PostgreSQL:** v15+ (for runtime database)

---

## 5. Getting Started & Verification

### 5.1 Frontend Build

```bash
cd frontend
npm install
npm run build
```

To run the frontend development server:

```bash
npm run dev
```

The frontend will be accessible at `http://localhost:5173`.

### 5.2 Backend Build

```bash
cd backend
.\mvnw.cmd clean compile
```

To package the backend application:

```bash
.\mvnw.cmd package -DskipTests
```

To run the backend development server:

```bash
.\mvnw.cmd spring-boot:run
```

The backend API will be accessible at `http://localhost:8080/api`.

---

## 6. Build Roadmap (Locked Phases)

- [x] **Phase 0:** Repository Foundation (Structure, React+TS+Vite, Spring Boot+Maven, configuration, verified builds)
- [ ] **Phase 1:** Database & Domain Model (PostgreSQL, Flyway migrations, entities, repositories)
- [ ] **Phase 2:** Authentication & Security (JWT, Spring Security, RBAC, password hashing, CORS)
- [ ] **Phase 3:** Core Item Workflow (LOST/FOUND reporting, image handling, browsing, search, filters)
- [ ] **Phase 4:** Claims & Resolution (Verification questions, claims, finder review, atomic resolution)
- [ ] **Phase 5:** Admin & Security Governance (User moderation, claim moderation, audit logging)
- [ ] **Phase 6:** UI Refinement (Approved visual system matching, FRFB responsive layouts, motion polish)
- [ ] **Phase 7:** PWA & Zero-Cost Deployment (Manifest, service worker, production configuration, smoke tests)
- [ ] **Phase 8:** Testing & Release Gate (Integration tests, claim concurrency verification, security regression)

---

## 7. Source of Truth

The contents of `context/` remain the single source of truth for all requirements, data models, workflows, design tokens, security policies, and build rules.
