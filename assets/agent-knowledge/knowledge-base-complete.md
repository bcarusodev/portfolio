# Bruno Caruso — Knowledge Base

## System Prompt Context

You are an AI assistant embedded in Bruno Caruso's portfolio website. You answer questions about Bruno's professional experience, skills, projects, and technical expertise. You ONLY answer questions related to Bruno. If asked about anything else, politely redirect to Bruno's professional profile.

RULES:

- Only answer using information from this knowledge base
- Be specific and reference actual projects, companies, and technologies
- If you don't know something, say "I don't have that specific information, but Bruno would be happy to tell you more"
- Respond in the same language the user writes in (Spanish or English)
- Be conversational but professional
- When relevant, suggest visiting specific pages of the portfolio
- Several of Bruno's projects are covered by confidentiality agreements (NDAs). Where this knowledge base says details are confidential, do not speculate or fill in the gaps — say that Bruno can't share more about that project because of confidentiality agreements

## Bio

### Identity

- Full Name: Bruno Caruso
- Preferred Name: Bruno
- Based In: Buenos Aires, Argentina
- Remote: Fully remote

### Elevator Pitch

> Software Developer with 5 years of experience focused on building solutions that solve real business problems, not just code that works. Three projects reflect this well: at Chubut IT, designed an automatic validation flow using third-party APIs plus domain and email validation, which completely eliminated manual approvals and reduced bottlenecks in client onboarding. At Remitee, built an internal platform that replaced scattered, manual processes, giving internal stakeholders better operational control. At IT Crowd, implemented dynamic theming via Lambda — loading MUI themes and assets from S3 per client — which the company ended up selling as a premium feature, opening a new revenue line. What defines Bruno is the ability to translate business needs into technical solutions that generate measurable results, and he's looking to keep doing that on a team where he can have the same level of impact.

### Current Role

Software Developer Specialist at Remitee.

### Origin Story

Bruno's first real hands-on programming experience was writing Lua scripts for a gameserver on MTA San Andreas (the online multiplayer mod for GTA: San Andreas), from 2017 to 2019. During this period he also built a gaming community around the server. Everything was self-taught — learned through internet resources, YouTube, and tutorials. This period built the self-directed learning habits that still define how he approaches new technology today.

He identified programming as "the thing" when he started a React course in 2020 — he got hooked, and as he kept discovering and learning new things, it clicked that this was his path.

### Philosophy

Bruno believes the developer role is being reinvented by the rise of AI: the shift is from being people who write algorithms in a programming language to being people who write solutions (sometimes still algorithms) in natural language.

### Preferences

- Best part of coding: Building things, deep focus on a problem, and being in constant learning mode.
- Least favorite: Ambiguity — specifically, not having a clear picture of what problem needs to be solved. He acknowledges this is sometimes part of the role, but when it's too undefined it becomes hard to set a horizon. His approach: iterate little by little to check if the work is heading in the right direction.
- Learning style: Self-taught — courses, and asking AI a lot, going deep into how things actually work and iterating.
- Work style: Prefers working in a team. Believes better outcomes are reached with company, and that different points of view are extremely useful.
- Problems that energize: Problems where the "what" and "how" are already clear — the challenge is just execution. Example: the whitelabeling feature he built with the team at StoryDots years ago — the goal was well defined, the team just had to figure out the how.
- Problems that drain: Problems where it's unclear what actually needs to be solved.

### Daily Workflow

No strictly defined routine. Scattered/async calls with the team as needed to align on specific topics. Checks Teams messages and email throughout the day. Tries to block 1-2 hours of focused work time to avoid getting scattered.

### Looking For

Looking for work-life balance and a role where he can contribute fully — both technical knowledge and soft skills — to solve whatever problems come up. Has fintech domain expertise both within and outside the fintech industry specifically: transfers, wires, ACH, payments, settlements, etc.

### Personal Notes

Actively building and maintaining his personal portfolio in detail, including an AI chatbot for visitors to interact with (this knowledge base is being built to power that agent).

## Work Experience

### Remitee — Software Developer / Software Developer Specialist (March 2025 - Present)

#### Context

- Product/Service: Remittances fintech. Bruno's team builds a platform used internally.
- Team Size: Small internal team, Scrum but with very light/flexible ceremony.
- Tech Stack: Next.js (frontend), NestJS (backend).
- Your Role: Started as Software Developer (March 2025), promoted to Software Developer Specialist (June 2026). Leads architectural decisions, domain modeling, stakeholder contact.

#### What You Built

- An internal platform that centralizes repetitive internal processes.
- Complex domain-modeling features
- Custom integrations through different APIs

Specific implementation details are covered by confidentiality agreement

#### Biggest Technical Challenge

**Problem:** Modeling the domain so that it would remain scalable and flexible as new requirements from internal teams kept emerging.  
**Approach:** Applied Domain-Driven Design (DDD) principles; thinking out-of-the-box, asking and trying to answer complex questions.  
**Solution:** Iterative domain modeling, validated directly with the stakeholders through requirement-gathering calls.
**Outcome:** A flexible domain model that supports the operational needs without over-constraining the MVP (see the domain model redesign below for a concrete example).

#### Biggest Business Impact

I can't share that due confidentiality agreement.

#### Scale &amp; Metrics

Confidential — Bruno can't share usage or scale details because of confidentiality agreements.

#### Key Learnings

Working under pressure, handling ambiguity in feature requirements, and estimating tasks and milestones collaboratively with the team.

#### What You'd Do Differently

Would try to abstract certain entities even further and improve some processes.

#### Collaboration &amp; Team Dynamics

Direct calls with C Levels, directors, stakeholders, who bring requirements; Bruno breaks these down into features, and the team estimates them together. Scrum-based but very lightweight on ceremony.

#### Notable Tech Decisions

- Adopted Domain-Driven Design (DDD) for the complex domain.
- Redesigned the domain model early on so it could represent entities in a more abstract and scalable way.

---

### Chubut IT — Senior Software Developer (February 2022 - March 2025)

Chubut IT was a consultancy (software factory model) with fixed teams assigned per client. Over ~3 years, Bruno was assigned to four main client projects: SmartChannel/AdBumps (ad-tech), Sporttips (B2C marketplace), MODO (fintech), and NaranjaX (fintech).

#### Context

- Company type: IT consultancy, client teams fixed per project.
- Your Role: Senior Software Developer.

---

#### Client Project: SmartChannel / AdBumps (Ad-Tech)

**Context**

- Product/Service: Two related ad-tech products. SmartChannel was an ML-based budget-allocation predictor for advertising campaigns — given a budget across multiple campaigns, an ML model recommended how to distribute spend. AdBumps was an ad-tech portal for custom pricing rules, integrated with Google Ad Manager (as a Google partner).
- Team Size: 3 developers, Scrum.
- Tech Stack: SmartChannel used Next.js on the frontend. AdBumps used Angular on the frontend and .NET on the backend.
- Your Role: Developer — built full-stack features (backend and frontend) for both portals: dashboards, tables, and all requested functionality, including infrastructure setup (App Services, deploys, CI/CD, databases) from scratch.

**What You Built**

- Both portals built from scratch, including cloud infrastructure, CI/CD pipelines, and databases.
- An automated lead validation flow for AdBumps: when a new client lead came in via a form or direct link, the system automatically validated that the email domain matched the company, rejected disposable/throwaway emails, and checked that the Google Ad Manager (GAM) network wasn't already registered. If validation failed, the lead received a contact email instead of being auto-approved. Integrated with SendGrid for the email flow. This eliminated manual approval of leads.
- A workaround system for AdBumps that interacted directly with the Google Ad Manager UI via scraping, to support custom pricing rules that the GAM API did not support at the time.

**Biggest Technical Challenge**
**Problem:** Had to learn Angular from scratch for AdBumps (no prior experience), and Google Ad Manager's API didn't support the custom pricing rules the client needed.
**Approach:** Self-taught Angular while building; for the pricing rules limitation, built a solution that interacted directly with the Google Ad Manager UI via scraping since no API existed for it at the time.
**Solution:** Shipped a working (if somewhat fragile) scraping-based integration — whenever Google changed their UI, the team had to manually update the scraping logic to match.
**Outcome:** Both portals shipped and remained in active feature development.

#### Biggest Business Impact

**Problem:** Client (lead) onboarding for AdBumps required manual approval of every signup, creating bottlenecks.
**What you did:** Designed and built an automatic validation flow using third-party APIs (SendGrid for email) and custom domain/email/GAM-network validation logic.
**Result:** Completely eliminated manual approvals for lead onboarding.

#### Scale &amp; Metrics

Small team of 3 developers; both portals were completed and continued to receive new features.

#### Key Learnings

Likely many, though not specifically recalled in detail — this was Bruno's introduction to Angular and to working around third-party API limitations via UI automation.

#### What You'd Do Differently

In the current AI era, much of the portal work could be done significantly faster with AI-assisted development.

#### Collaboration &amp; Team Dynamics

Coordinated through direct conversations and meetings with the team (3 developers, Scrum).

#### Notable Tech Decisions

Designed and implemented the automated email/domain/GAM-network validation flow for lead onboarding end to end — was given general direction and worked out the full implementation: registering with a mailing service (SendGrid), building the integration, and testing the email flow.

---

#### Client Project: Sporttips (B2C Marketplace)

**Context**

- Product/Service: A marketplace connecting athletes with elite sports professionals for services like physiotherapy and stress/performance testing.
- Team Size: 1 PM, 2 developers.
- Tech Stack: React/Next.js frontend, NestJS backend, PostgreSQL database.
- Your Role: Developer, for a project spanning a couple of months. Built UI features on the frontend and migrated specific endpoints and modules from a legacy PHP backend to NestJS.

**What You Built**

- Multiple frontend UI features.
- Migrated specific endpoints, modules, and business logic from the legacy PHP backend to NestJS.
- Built the login/registration screens and the authentication state management for the app, using JWT-based sessions (and likely NextAuth, though not fully certain in retrospect).

**Biggest Technical Challenge**
**Problem:** Building the authentication flow — login/registration screens and the app-wide state that tracked whether a user was authenticated.
**Approach:** Implemented JWT-based session handling.
**Solution:** Working login/registration flow integrated with the rest of the app's state.
**Outcome:** Functional authentication system supporting the marketplace's user base.

#### Biggest Business Impact

Not specifically tracked — Bruno's focus was primarily on development execution rather than business metrics on this project.

#### Scale &amp; Metrics

No formal metrics tracked, but the platform had an active user base and a fair volume of transactions. Small team: 1 PM, 2 developers.

#### Key Learnings

Experience deploying features directly to production in a fast-moving, small-team environment.

#### What You'd Do Differently

Not specifically recalled.

#### Collaboration &amp; Team Dynamics

No other teams involved — worked directly within the small 1 PM + 2 developer team, debating technical approaches directly with the other developer.

#### Notable Tech Decisions

N/A beyond day-to-day technical discussions with the other developer on the team.

---

#### Client Project: MODO (Fintech — Payments)

**Context**

- Product/Service: MODO is a payments fintech that unifies all of Argentina's banks and manages promotions.
- Team Size: 3 developers.
- Tech Stack: Migrated from Express.js to NestJS.
- Your Role: Developer, over several months. Worked on migrating MODO's CX (Customer Experience) API — used by the web app — from Express.js to NestJS.

**What You Built**
The migration of MODO's CX API from Express.js to NestJS. This API was an abstraction layer over a Freshdesk CRM instance, used both by CX support agents and by automated flows within the MODO app for creating support tickets.

**Biggest Technical Challenge**
Not specifically recalled in detail.

**Biggest Business Impact**
**Problem:** CX agents previously had to log directly into Freshdesk to create support tickets, with little to no context about the customer or issue.
**What you did:** Built out the CX API (via the Express-to-NestJS migration) so that tickets could be generated automatically from a web app that embedded relevant context, as well as from automated flows across channels like WhatsApp.
**Result:** CX agents and automated flows could generate contextualized tickets without needing direct Freshdesk access, streamlining support operations.

#### Scale &amp; Metrics

Used by an estimated 10-25 CX agents, handling hundreds of tickets per week. The migration itself was directed by business/technical leadership rather than a decision Bruno drove.

#### Key Learnings

Deepened fintech domain exposure through a payments-industry CX/support context.

#### What You'd Do Differently

Would have left more documentation behind.

#### Collaboration &amp; Team Dynamics

Limited communication with other teams; small team of 3 developers.

#### Notable Tech Decisions

Contributed to some library choices during the migration, though specifics aren't clearly recalled given the time elapsed.

---

#### Client Project: NaranjaX (Fintech — Digital Wallet)

**Context**

- Product/Service: NaranjaX is a digital wallet fintech. Bruno worked within the HCM (Human Capital Management) team's internal tooling efforts.
- Team Size: 4 developers, 1 PM. Weekly meetings.
- Tech Stack: Angular + Contentful.
- Your Role: Software Developer, over several months, building internal portals for the Data and People teams.

**What You Built**
Two internal portals — one for the Data team and one for the People team — that consolidated previously scattered internal information and made it accessible to employees. Content was based on Figma prototypes provided by the Design/UX team, and the portals were built so the Data team could later customize content themselves via Contentful.

**Biggest Technical Challenge**
**Problem:** Translating detailed Figma UI prototypes into working Angular code, and wiring it up to Contentful so the Data team could manage content independently going forward.
**Approach:** Manual, careful implementation — this was pre-AI-assisted development, so translating design to code was a fully manual, labor-intensive process.
**Solution:** Delivered functioning, CMS-backed portals matching the approved designs.
**Outcome:** Two working internal portals for Data and People teams.

#### Biggest Business Impact

**Problem:** Internal teams (Data, People) lacked centralized, easy access to their own information — it was scattered across other tools/sources.
**What you did:** Built dedicated internal information portals for these teams.
**Result:** Centralized, easier access to information for Data and People teams' employees.

#### Scale &amp; Metrics

Internal tool for the Data and People teams. Team of 4 developers, 1 PM.

#### Key Learnings

Not extensively noted for this project.

#### What You'd Do Differently

In the current post-AI era, the whole workflow would look different — Bruno would use AI tooling to significantly speed up translating designs into code.

#### Collaboration &amp; Team Dynamics

Weekly meetings with the Design/UX team (who provided Figma prototypes) and with the Data and People teams as stakeholders.

#### Notable Tech Decisions

None specifically driven by Bruno on this project.

---

### IT Crowd — Software Developer (April 2021 - February 2022)

IT Crowd was a software factory (consultancy). Bruno was assigned to three client projects: StoryDots, AllyEnergy, and NBS. Tech stack across all three was consistently TypeScript, React, and Node.js-based backends.

#### Context

- Product/Service: Software factory serving multiple clients.
- Your Role: Software Developer.

---

#### Client Project: StoryDots (Dynamic Whitelabeling)

**Context**

- Product/Service: StoryDots offered a dynamic whitelabeling solution, allowing large retail clients to offer gift/rewards experiences under their own branding, with no visible trace of StoryDots as the underlying provider.
- Team Size: 2 developers, 1 PM.
- Tech Stack: TypeScript, React, Node.js, AWS Lambda (serverless), AWS S3.
- Your Role: Software Developer — this is the project referenced in Bruno's bio as the dynamic theming/whitelabeling work.

**What You Built**
A dynamic theming system where whitelabel configuration was stored in a database per client, and a serverless AWS Lambda function acted as the backend intermediary to fetch that configuration. Branded assets were stored in AWS S3, organized into per-client folders identified by UUID, and loaded dynamically based on the client configuration (MUI theme + assets).

**Biggest Technical Challenge**
**Problem:** Building a fully dynamic whitelabeling system from scratch, in the pre-AI-assisted development era, with no prior template to work from.
**Approach:** Designed the DB-driven configuration model and the S3 folder structure per client (UUID-based), with a Lambda function serving as the backend layer that resolved and served the right theme/assets per client at runtime.
**Solution:** A working dynamic theming pipeline that could onboard new whitelabel clients without custom code changes per client.
**Outcome:** This became one of the most technically challenging and significant projects of this period, later monetized as a premium feature (see Business Impact).

#### Biggest Business Impact

**Problem:** Originally, the company only offered its gifting/rewards product under its own StoryDots branding — there was no way to white-label it.
**What you did:** Built the whitelabeling capability described above.
**Result:** The company began selling whitelabeling as a premium feature, opening a new revenue line — client stores could offer gifting experiences with zero visible trace that it was a third-party (StoryDots) solution underneath. Adopted by several large retail clients, including Todo Moda and Isadora.

#### Scale &amp; Metrics

Several large retail clients adopted the whitelabeled solution, including Todo Moda and Isadora. Small team: 2 developers, 1 PM.

#### Key Learnings, What You'd Do Differently, Deeper Collaboration Notes, Additional Tech Decisions

Not disclosed in detail (partly due to confidentiality considerations).

---

#### Client Project: AllyEnergy (Renewable Energy Job Board)

**Context**

- Product/Service: A LinkedIn-style job board portal focused exclusively on job postings within the renewable/sustainable energy niche.
- Team Size: 3 developers, 1 PM.
- Tech Stack: Next.js with serverless functions, GraphQL.
- Your Role: Software Developer — built multiple portal features, with a focus on the full user onboarding flow and third-party integrations (Crosschq, Stripe, HubSpot). Specific purpose/usage of these integrations is covered by confidentiality agreements.

**What You Built**
Multiple features across the job-board portal, with primary ownership of the user onboarding flow and its integrations with Crosschq, Stripe, and HubSpot.

---

#### Client Project: NBS (Nature-based Solutions Investment Platform)

**Context**

- Product/Service: A platform focused on investment in Nature-based Solutions (NbS).
- Tech Stack: Next.js frontend, Strapi backend (CMS).
- Your Role: Software Developer — built the full frontend for the login and registration flow.

**What You Built**
The complete frontend implementation of the platform's login and registration experience.

## Projects

Client and company projects are documented in detail inside the Work Experience section above (each company lists its client projects, stack, contributions, and outcomes). Bruno also maintains his own portfolio in detail, and is building the AI chat agent embedded in it.

## Skills &amp; Technologies

### Primary Stack

- Languages: TypeScript / JavaScript
- Frontend: Next.js / React
- Backend: Node.js (Express, NestJS), with .NET as a secondary/backup option
- Database: PostgreSQL / SQL Server, MongoDB

Bruno's default choice for a new project from scratch: Next.js on the frontend, paired with a Node.js backend (Express or NestJS), with .NET as a backup/secondary option depending on project needs.

### Technology Breakdown

#### Next.js / React

- Years: 5
- Proficiency: 4/5
- Notes: Used in the majority of his projects; his default frontend choice.

#### NestJS

- Years: 4
- Proficiency: 4/5
- Notes: Used across several projects; his default backend framework alongside Express.

#### TypeScript / JavaScript

- Years: 6
- Proficiency: 5/5
- Notes: Has programmed in JS/TS his entire career.

#### PostgreSQL / SQL Server

- Years: 5
- Proficiency: 4/5
- Notes: Always worked with relational databases throughout his career.

#### MongoDB

- Years: 1
- Proficiency: 3/5
- Notes: First hands-on experience with MongoDB was in his current role.

#### .NET

- Years: 2
- Proficiency: 3/5
- Notes: Used at AdBumps (Chubut IT) as the backend for that project.

#### GraphQL

- Used only during the AllyEnergy project (IT Crowd), for a couple of months. Adapted well to it but hasn't used it since.

#### Strapi

- Used only at NBS (IT Crowd), briefly, as a CMS backend to pull post/content data.

#### Contentful

- Used only at NaranjaX (Chubut IT), for a couple of months, to pull content for the internal portals.

#### AWS Lambda &amp; S3

- Used at StoryDots and AllyEnergy (both IT Crowd projects), roughly 1 year combined. His most substantial AWS/serverless experience.

#### Angular

- Used only at AdBumps (Chubut IT), for a couple of months. Would not use again — see "Would Not Use Again" below.

#### MUI / Tailwind CSS / shadcn/ui

- Used consistently across multiple projects over several years — his default styling/design-system toolkit.

#### Zustand

- Used only at StoryDots (IT Crowd), briefly, for frontend state management.

### Learning / Want to Learn

Agentic AI — actively exploring and learning agentic AI workflows and tooling.

### Would NOT Use Again

Angular — never fully got comfortable with it; finds React allows him to build things faster and with much less verbosity/boilerplate.

### Philosophy

- Stack selection: Chooses whatever best fits the type of project being built — his view is that, for example, using Preact isn't the same decision as using React, and the right tool depends on the specific project's needs.
- Testing: Uses AI to generate automated tests that satisfy acceptance criteria, and personally runs E2E/smoke tests to verify actual expected behavior. Uses Jest and Testcontainers.
- Frontend: Applies Atomic Design principles when possible. Uses Zustand for state management, and Tailwind CSS or a design system library (MUI, NextUI, shadcn/ui) for styling.
- Backend: Follows REST HTTP conventions, and applies Clean Architecture and CQRS patterns.
- Git workflow: Works in branches named by ticket/type convention (e.g. `feat/`), using Conventional Commits.
- Code review: Automates parts of the review process using GitHub Copilot review and Claude Code review skills.
- Secret weapons: GitHub Desktop, and Orca ADE — an agent-focused IDE that lets him spin up multiple simultaneous AI agent instances working in parallel git worktrees.
- Staying current: YouTube, blogs, social media, papers, LinkedIn, talking with other developers, and occasionally attending conferences when time allows.

### Cloud &amp; DevOps

- Azure: App Services, Function Apps, Blob Storage, Key Vault, Alerts.
- AWS: Lambda, S3, Route53, SQS.
- GCP: Brief exposure, limited time working with it.
- Docker: Has hands-on experience.
- CI/CD: Has used both GitHub Actions and Azure DevOps Pipelines.

## Problem-Solving Stories

### Redesigning a Domain Model from Scratch

#### Context

- When: Recent, during his time at Remitee
- Where: Remitee — internal platform
- Role: Led the technical decision and the redesign

#### The Problem

The original domain model didn't scale to new business requirements. Bruno had to make a critical call: keep patching the model or replace it entirely.

#### The Approach

Because there was no production data yet, no migration was needed. This made a clean-slate redesign feasible and much lower risk.

#### The Solution

Redesigned the domain from zero around a more abstract structure, deliberately kept flexible for the MVP. (Specific model details are covered by a confidentiality agreement.)

#### The Outcome

A more abstract and flexible model. The decision was made at the right moment, before real data existed, avoiding a costly migration later.

#### What You Learned

The cheapest time to fix a fundamentally wrong domain model is before it is in production — and being willing to throw away work early is worth it.

---

### Most Complex System (Internal Platform at Remitee)

#### Context

- When: Current work (March 2025 - present)
- Where: Remitee
- Role: Software Developer Specialist; led architecture and domain modeling

#### The Problem

Internal teams needed a central platform to replace scattered, manual processes.

#### The Approach

Applied Domain-Driven Design, Clean Architecture, and CQRS.

#### The Solution

Specific implementation details are covered by a confidentiality agreement.

#### The Outcome

Bruno considers it the most complex and most impressive system he has worked on so far, and the thing he has built that he is proudest of.

#### What You Learned

How to model a large domain in a way that stays flexible as requirements evolve.

---

### The Integration Abstraction (His Best Code, Co-Designed with AI)

#### Context

- When: Recent
- Where: Remitee — internal platform
- Role: Designed the architecture together with AI (Bruno describes it as designed jointly rather than written solely by himself)

#### The Problem

The platform needs to integrate with many different external APIs, and each integration could otherwise require significant bespoke code.

#### The Approach

Bruno and AI worked through the design together.

#### The Solution

A Strategy-style abstraction, so adding a new integration requires very little change elsewhere in the code. (Further details are covered by a confidentiality agreement.)

#### The Outcome

A flexible, extensible architecture that makes it easy to add integrations quickly. Bruno considers it the best code/architecture he has produced, and a good pattern for any system with many integrations.

#### What You Learned

Strategy-style abstractions pay off enormously when the number of integrations grows.

---

### The Data Import That Taught Him About Batching and Idempotency (Worst Code)

#### Context

- Where: Remitee — internal platform (bulk import from an external source)
- Role: Implemented the import

#### The Problem

His first version of a bulk data import caused the system to hang in some cases. In addition, records in the source changed over time, so already-imported records had to be updated — and with a very large volume, detecting what had changed was difficult.

#### The Approach

Reworked the import to process data in batches, enforce solid consistency, and track a clear uniqueness key. To detect changes efficiently at high volume, generated a hash per record to compare quickly.

#### The Solution

Batched imports, a clear uniqueness factor for each record, and hash-based change detection so records could be kept in sync with the source.

#### The Outcome

A much more reliable import pipeline.

#### What You Learned

Imports must be done in batches, with strong consistency guarantees and an explicit, well-defined uniqueness control. Hashing is a practical way to detect changes at scale.

---

### Migrating a Legacy PHP Backend (Technical Debt at Sporttips)

#### Context

- Where: Sporttips (Chubut IT client)
- Role: Developer

#### The Problem

The old backend was written in PHP and carried significant technical debt: many hardcoded values, a problematic Stripe integration, and more — all of which had to be resolved and migrated into the new project.

#### The Approach

Migrated specific endpoints, modules, and business logic into the new NestJS backend, fixing the debt along the way rather than copying it.

#### The Outcome

Selected parts of the legacy backend were moved into a cleaner NestJS codebase, including the Stripe integration.

---

### Production Incidents at Sporttips

#### Context

- Where: Sporttips (Chubut IT client)
- Role: Developer handling hotfixes

#### The Problem

A couple of times, services stopped working in production because of a migration or an incompatibility with a new feature. One concrete example: a detail view threw an exception as soon as the user entered the web app.

#### The Approach

Detected through Sentry.io error monitoring. The issue was treated as top priority and handled as a hotfix.

#### The Outcome

Fixed quickly as a hotfix each time.

---

### The Registration Flow Bug (A Technical Failure)

#### Context

- Where: AdBumps (Chubut IT client)
- Role: Developer who shipped the change

#### The Problem

Bruno deployed a user registration feature to production that did not work as expected: the registration flow was not sending the correct information to users.

#### The Solution

He took ownership, identified the mistake, and fixed it.

#### What You Learned

Verify the full end-to-end flow (including what users actually receive) before and right after deploying — this reinforced his habit of running his own E2E/smoke tests.

---

### Scraping Google Ad Manager When the API Couldn't Do It

See the Work Experience section (Chubut IT — SmartChannel / AdBumps) for the full story: Google Ad Manager's API didn't support the custom pricing rules the AdBumps product needed, so Bruno's team interacted directly with the Google Ad Manager UI via scraping. The solution worked but was somewhat fragile, since any UI change from Google required updating the scraping logic.

---

### Other Notes

- **Hardest bugs:** The ones he remembers as hardest are those with low observability, which makes debugging much more difficult.
- **Performance optimization:** The most impactful optimization he has done was adding database indexes.
- **Handling disagreements on technical decisions:** He presents his point of view and explains why he disagrees, in order to debate it openly and evaluate an alternative approach.

## Soft Skills

### Communication

- Technical explanation style: Uses simple analogies to explain technical concepts to non-technical people. For example, he describes API endpoints as different doors you can access, with authentication being the keys to those doors.
- Handling disagreements: Prioritizes whatever gives the best result for the project. He makes sure everyone voices their opinion and the team tries to reach a consensus.
- Communication style: Asynchronous and text-based by default. If a topic is complex or blocking, he'll jump on a call. Keeps documentation in the repositories.

### Code Reviews

- Giving reviews: Leaves useful comments — time permitting — that solve the issue if there is one and also leave a learning for the author. If an issue is very structural, he talks to the person directly to go through it in detail.
- Receiving reviews: Analyzes feedback in detail, and asks follow-up questions when there is something he doesn't understand.

### Problem Management

- Tight deadlines: Prioritizes what has to ship first for that deadline. Anything extra goes to the backlog. If the date is very close, he focuses exclusively on finishing what's needed — in the extreme case, a "war room".
- Prioritization: Prioritizes by impact. Production issues come first, then anything with a deadline, and so on down the list.
- Scope creep: Makes it clear from the start that the timelines communicated initially are based on what was originally proposed. New functionality directly affects the timeline, and he states that upfront. He analyzes the impact on timelines in detail with the Product Owner and stakeholders.
- Perfect vs good enough: Aims for a solution that solves the problem while being delivered in a reasonable, convincing timeframe.

### Leadership

- Mentoring approach: Keeps junior developers focused on the specific problem they need to solve, and encourages them to learn along the way using different tools — for example, AI with lots of questions, or a guide on where to start. He typically hands over pre-scoped issues (a specific issue to solve rather than an epic to break down) and gradually increases complexity.
- Onboarding new codebases: Uses AI to generate a project context brief, asks it questions, and gradually works his way into the code.
- Handling feedback: Always assumes there is something to improve, so he actively asks others to tell him what weaknesses they see in him, in order to work on them.

### What Makes Me a Good Collaborator

Communication skills, problem solving, understanding of needs, abstraction of solutions, and technical knowledge.

## Personal

### Outside of Work

- Loves the car ecosystem: car culture, car events, and detailing.
- Owns a Volkswagen Golf GTI MK6 with a Stage 2+ tune.
- Washes his own car himself (regular washes — not full detailing work like ceramic coatings).
- Used to practice Taekwondo.
- Goes to the gym.

### Setup

- OS: Windows 11 and macOS dual-boot (macOS via OpenCore, i.e. a hackintosh)
- IDE: Orca ADE — an agent-focused IDE where he can create multiple agent instances and work in parallel git worktrees at the same time.
- Terminal: Not specified
- Hardware (desktop PC):
  - Motherboard: Gigabyte B550 AORUS ELITE AX V2
  - CPU: AMD Ryzen 7 5700X, cooled by a Thermaltake Contac Silent 12
  - RAM: 16GB XPG Hunter DDR4 @ 3200 MHz
  - GPU: Sapphire Nitro+ RX 6700 XT 12GB
  - Storage: WD Blue SN580 1TB NVMe + XPG S40G Spectrix 256GB NVMe
  - Case: Corsair Carbide 100R
- Other tools: GitHub Desktop

### Non-Tech Skills / Experiences

- Hackintoshing (running macOS on non-Apple hardware): runs his own desktop PC as a Windows 11 / macOS dual-boot machine using OpenCore.
- Taekwondo background.
- Founded and ran a gaming community around his MTA San Andreas gameserver (2017-2019) — see the Bio section.

### Influences

- Podcasts: None in particular
- Books: None in particular
- Creators: None in particular

### Fun Facts

- Describes himself as very analytical and balanced.
- Drives a Golf GTI MK6 with a Stage 2+ tune.
- Runs a hackintosh (macOS on an AMD-based PC with OpenCore).
- His programming journey started by scripting in Lua for a GTA: San Andreas multiplayer gameserver (MTA), entirely self-taught from YouTube and tutorials.

### What He Enjoys Most About Being a Developer

Researching and being in constant learning mode. He feels this exercises the mind and keeps him constantly challenging problems.

### Hot Takes / Unpopular Opinions

None to share. (His closest take on the industry is his view that AI is reinventing the developer role — see the Bio section.)

### Career Advice

- Best: Learn from your mistakes.
- Worst: Doesn't have one in mind.

### If Not a Developer...

Probably something related to Taekwondo, car detailing, or anything in the automotive world — possibly even filmmaking tied to cars.
