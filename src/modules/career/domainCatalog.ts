export interface DomainProject {
  title: string;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  description: string;
  technologies: string[];
  deliverables: string[];
}

export interface DomainQuestion {
  question: string;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  options: string[];
  answerKey: number;
  explanation: string;
  skillName: string;
}

export interface DomainSkillReq {
  skillName: string;
  category: string;
  requiredLevel: number; // 1-5
  importanceWeight: number; // 1-5
}

export interface DomainBlueprint {
  slug: string;
  title: string;
  category: "Engineering" | "Data & AI" | "Cloud & Infrastructure" | "Security & QA";
  description: string;
  overview: string;
  careerOpportunities: string[];
  coreCsSubjects: string[];
  keyConcepts: string[];
  recommendedTools: string[];
  portfolioExpectations: string;
  interviewTopics: string[];
  entryLevelGuidance: string;
  milestoneOutcomes: string[];
  skills: DomainSkillReq[];
  projects: DomainProject[];
  questions: DomainQuestion[];
}

export const DOMAIN_CATALOG: DomainBlueprint[] = [
  // 1. Forward Deployed Engineer (FDE)
  {
    slug: "fde",
    title: "Forward Deployed Engineer (FDE)",
    category: "Engineering",
    description: "Bridges software engineering and enterprise deployment, building custom integrations, reliable data pipelines, and real-time customer systems on the frontlines.",
    overview: "Forward Deployed Engineers work directly with high-stakes enterprise clients and mission partners. They architect custom extensions, integrate fragmented enterprise software, solve live production bottlenecks, and ensure enterprise software operates reliably in air-gapped or heterogeneous IT environments.",
    careerOpportunities: [
      "Forward Deployed Software Engineer",
      "Solutions Architect",
      "Customer Engineering Lead",
      "Enterprise Integrations Engineer",
      "Field Technical Lead"
    ],
    coreCsSubjects: [
      "Distributed Systems Architecture",
      "Operating Systems & Linux Internals",
      "Computer Networks & Enterprise Protocols",
      "Database Systems & Transaction Isolation"
    ],
    keyConcepts: [
      "Enterprise Integration Patterns (EIP)",
      "Air-Gapped & On-Premises Deployments",
      "SAML / OIDC / OAuth2 Identity Federation",
      "Event-Driven Ingestion & Idempotency",
      "Reverse Proxying & mTLS Communication"
    ],
    recommendedTools: [
      "Python", "TypeScript", "Docker", "Kubernetes", "Helm", "PostgreSQL", "gRPC", "Nginx"
    ],
    portfolioExpectations: "Demonstrated ability to deploy containerized services into complex environments with automated health checks, architecture documentation, and resilient webhook handlers.",
    interviewTopics: [
      "Debugging network partitions & latency in enterprise client networks",
      "Designing fault-tolerant ETL pipelines with automatic retry and dead-letter queues",
      "Explaining technical trade-offs to non-technical executive stakeholders",
      "Reverse engineering legacy API protocols"
    ],
    entryLevelGuidance: "Focus on mastering Docker, Linux command-line diagnostics, and building reliable webhook and ETL pipeline integrations with comprehensive error recovery.",
    milestoneOutcomes: [
      "Deploy an air-gapped Helm chart with verified container image signatures",
      "Implement a bidirectional enterprise database synchronization gateway",
      "Pass the Forward Deployed Systems Assessment with >= 75%"
    ],
    skills: [
      { skillName: "Python", category: "Backend", requiredLevel: 4, importanceWeight: 5 },
      { skillName: "Docker & Containers", category: "DevOps", requiredLevel: 4, importanceWeight: 5 },
      { skillName: "REST API Design", category: "Backend", requiredLevel: 4, importanceWeight: 4 },
      { skillName: "SQL & Databases", category: "Backend", requiredLevel: 4, importanceWeight: 4 },
      { skillName: "Git & Version Control", category: "DevOps", requiredLevel: 3, importanceWeight: 4 },
      { skillName: "System Design", category: "Computer Science", requiredLevel: 3, importanceWeight: 4 }
    ],
    projects: [
      {
        title: "Enterprise Webhook Ingestion & Deduplication Gateway",
        difficulty: "BEGINNER",
        description: "Build a resilient HTTP gateway that ingests partner webhooks, validates HMAC signatures, deduplicates payloads with Redis, and writes to an audit log.",
        technologies: ["TypeScript", "Node.js", "Redis", "Docker"],
        deliverables: ["Idempotent webhook processor", "HMAC verification middleware", "Docker Compose setup"]
      },
      {
        title: "Air-Gapped Container Package Deployer with Helm",
        difficulty: "INTERMEDIATE",
        description: "Package a multi-tier service into an offline Helm chart with pre-pulled image bundles, automated checksum integrity checks, and self-healing health probes.",
        technologies: ["Kubernetes", "Helm", "Docker", "Bash", "YAML"],
        deliverables: ["Helm values templates", "Offline bundle script", "Liveness/readiness probes"]
      },
      {
        title: "Real-Time Bidirectional ERP Database Sync Agent",
        difficulty: "ADVANCED",
        description: "Architect a change-data-capture agent that syncs disparate PostgreSQL and MySQL schemas with transaction isolation and automatic conflict resolution.",
        technologies: ["Python", "PostgreSQL", "Kafka / Debezium", "Docker", "FastAPI"],
        deliverables: ["CDC sync daemon", "Conflict resolution strategy", "Architecture design doc"]
      }
    ],
    questions: [
      {
        question: "In an air-gapped enterprise deployment, how should container dependencies and base images be reliably managed?",
        difficulty: "INTERMEDIATE",
        options: [
          "Pull base images dynamically from Docker Hub over port 443",
          "Mirror and sign all images into a private, on-premises container registry behind the firewall",
          "Disable container security checks and run images directly in root mode",
          "Compile all software from source on the production host"
        ],
        answerKey: 1,
        explanation: "Air-gapped systems have zero internet connectivity. All images must be scanned, cryptographically signed, and loaded into an internal private registry.",
        skillName: "Docker & Containers"
      },
      {
        question: "What design pattern prevents duplicate execution when external enterprise webhooks are retried across network glitches?",
        difficulty: "INTERMEDIATE",
        options: [
          "Circuit Breaker Pattern",
          "Idempotency Key / Deduplication Cache Pattern",
          "Singleton Factory Pattern",
          "Observer Pattern"
        ],
        answerKey: 1,
        explanation: "Idempotency keys paired with atomic caching (e.g. Redis SETNX) guarantee that duplicate webhook deliveries do not trigger repeated business transactions.",
        skillName: "REST API Design"
      }
    ]
  },

  // 2. AI / Machine Learning Engineer
  {
    slug: "ai-ml",
    title: "AI / Machine Learning Engineer",
    category: "Data & AI",
    description: "Designs, trains, fine-tunes, and operationalizes machine learning, deep learning, and generative AI models at production scale.",
    overview: "AI/ML Engineers bridge experimental data science and high-throughput production infrastructure. They train neural networks, fine-tune open-weight Large Language Models (LLMs), build vector indexing systems, and serve low-latency inferences via optimized runtimes.",
    careerOpportunities: [
      "Machine Learning Engineer",
      "Applied AI Engineer",
      "LLM Systems Engineer",
      "Computer Vision / NLP Engineer",
      "MLOps Specialist"
    ],
    coreCsSubjects: [
      "Linear Algebra & Matrix Decompositions",
      "Probability, Statistics & Stochastic Processes",
      "Data Structures & Numerical Algorithms",
      "GPU Architecture & High-Performance Computing"
    ],
    keyConcepts: [
      "Transformer Architectures & Self-Attention",
      "Retrieval-Augmented Generation (RAG) & Vector DBs",
      "Parameter-Efficient Fine-Tuning (LoRA / QLoRA)",
      "Model Quantization (GGUF, AWQ, FP8)",
      "MLOps, Model Registry & Drift Monitoring"
    ],
    recommendedTools: [
      "Python", "PyTorch", "Hugging Face", "LangChain", "vLLM", "Triton", "FAISS / Pinecone", "MLflow"
    ],
    portfolioExpectations: "Clean GitHub repositories with reproducible training scripts, evaluation metric curves, Hugging Face model cards, and deployed API endpoints with benchmarked latency.",
    interviewTopics: [
      "Self-attention vs Cross-attention mechanisms",
      "Bias-variance tradeoff and regularization techniques (L1/L2, Dropout)",
      "Strategies for mitigating LLM hallucinations in RAG pipelines",
      "Memory requirements for training vs inference across model parameters"
    ],
    entryLevelGuidance: "Master Python numerical libraries (NumPy, PyTorch), understand matrix multiplications, and build end-to-end RAG pipelines with vector databases and evaluation benchmarks.",
    milestoneOutcomes: [
      "Train and evaluate a custom neural network achieving > 90% accuracy on validation sets",
      "Build a production RAG application with document chunking and vector search",
      "Score >= 80% on the AI/ML Technical Assessment"
    ],
    skills: [
      { skillName: "Python", category: "Backend", requiredLevel: 4, importanceWeight: 5 },
      { skillName: "Data Structures & Algorithms", category: "Computer Science", requiredLevel: 4, importanceWeight: 5 },
      { skillName: "System Design", category: "Computer Science", requiredLevel: 3, importanceWeight: 4 },
      { skillName: "SQL & Databases", category: "Backend", requiredLevel: 3, importanceWeight: 3 },
      { skillName: "Git & Version Control", category: "DevOps", requiredLevel: 3, importanceWeight: 3 }
    ],
    projects: [
      {
        title: "Multi-Class Document Classifier with PyTorch",
        difficulty: "BEGINNER",
        description: "Preprocess raw textual datasets, train a transformer-based classifier, implement cross-entropy loss with early stopping, and visualize confusion matrices.",
        technologies: ["Python", "PyTorch", "Hugging Face Transformers", "Scikit-Learn"],
        deliverables: ["Model training pipeline", "Evaluation metrics notebook", "Model checkpoint export"]
      },
      {
        title: "Enterprise RAG Intelligence Engine with Vector Indexing",
        difficulty: "INTERMEDIATE",
        description: "Build an end-to-end retrieval augmented generation system that chunks enterprise PDFs, computes embeddings, stores vectors in FAISS/Pinecone, and generates citations.",
        technologies: ["Python", "FastAPI", "FAISS / Pinecone", "LangChain", "OpenAI / Gemini"],
        deliverables: ["Chunking & ingestion worker", "Semantic search endpoint", "Citation & source attribution"]
      },
      {
        title: "Quantized LLM Inference Service with vLLM & Streaming",
        difficulty: "ADVANCED",
        description: "Deploy an 8-bit quantized open-source LLM using vLLM / Triton, supporting continuous batching, PagedAttention, and Server-Sent Events (SSE) streaming.",
        technologies: ["Python", "vLLM", "Docker", "Triton", "CUDA"],
        deliverables: ["Low-latency inference server", "Benchmarking load script", "Streaming token client"]
      }
    ],
    questions: [
      {
        question: "What is the primary advantage of PagedAttention implemented in modern LLM serving engines like vLLM?",
        difficulty: "ADVANCED",
        options: [
          "It completely eliminates the need for GPU VRAM during training",
          "It partitions Key-Value (KV) cache memory into non-contiguous blocks, drastically reducing memory fragmentation and waste",
          "It replaces attention heads with recurrent neural networks",
          "It encrypts model weights to prevent unauthorized copying"
        ],
        answerKey: 1,
        explanation: "PagedAttention manages KV cache memory similarly to virtual memory paging in operating systems, virtually eliminating memory fragmentation and boosting throughput.",
        skillName: "System Design"
      },
      {
        question: "In Retrieval-Augmented Generation (RAG), why is semantic chunking preferred over fixed-character chunking?",
        difficulty: "INTERMEDIATE",
        options: [
          "Fixed chunking is strictly unsupported by vector databases",
          "Semantic chunking preserves complete contextual thoughts and sentence boundaries, improving embedding quality and retrieval precision",
          "Semantic chunking compresses text into binary format",
          "It reduces token generation speed"
        ],
        answerKey: 1,
        explanation: "Preserving natural paragraph and sentence boundaries prevents splitting critical context in half, leading to much higher cosine similarity and accuracy during retrieval.",
        skillName: "Python"
      }
    ]
  },

  // 3. Backend Engineer
  {
    slug: "backend",
    title: "Backend Engineer",
    category: "Engineering",
    description: "Architects high-performance APIs, database models, caching strategies, and secure services using Node.js, Python, and PostgreSQL.",
    overview: "Backend Engineers are responsible for the core engine of applications: reliable business logic, data persistence, transactional integrity, authentication systems, and distributed messaging pipelines.",
    careerOpportunities: [
      "Backend Software Engineer",
      "API & Microservices Architect",
      "Database / Platform Engineer",
      "Systems Engineer",
      "Senior Server-Side Developer"
    ],
    coreCsSubjects: [
      "Database Management Systems & SQL Internals",
      "Operating Systems & Multi-Threading",
      "Computer Networks (TCP, HTTP/2, HTTP/3, WebSockets)",
      "Distributed Systems & Consensus"
    ],
    keyConcepts: [
      "ACID Transactions & Isolation Levels (Read Committed vs Serializable)",
      "Database Indexing (B-Trees, Hash, Composite Indexes, EXPLAIN ANALYZE)",
      "Event-Driven Architecture & Message Queues",
      "Distributed Caching Strategies (Cache-Aside, Write-Through)",
      "API Rate Limiting & Denial of Service Protection"
    ],
    recommendedTools: [
      "Node.js / Express / NestJS", "PostgreSQL", "Redis", "Docker", "Prisma / Drizzle", "Apache Kafka", "Postman"
    ],
    portfolioExpectations: "Well-architected GitHub repositories with relational ER diagrams, comprehensive unit and integration test coverage, automated migrations, and Docker Compose configurations.",
    interviewTopics: [
      "SQL Indexing strategies and query optimization",
      "Handling race conditions with pessimistic vs optimistic locking",
      "Designing distributed rate limiters using sliding window logs",
      "REST vs gRPC vs GraphQL architectural trade-offs"
    ],
    entryLevelGuidance: "Focus deeply on relational databases (SQL joins, transactions, indexes), building RESTful APIs with clean layered architectures (controllers, services, repositories), and automated testing.",
    milestoneOutcomes: [
      "Architect a multi-model PostgreSQL schema with clean foreign keys and indexes",
      "Implement a Redis caching layer that reduces query latency by >= 80%",
      "Pass the Backend Engineering Assessment with >= 75%"
    ],
    skills: [
      { skillName: "Node.js", category: "Backend", requiredLevel: 4, importanceWeight: 5 },
      { skillName: "SQL & Databases", category: "Backend", requiredLevel: 4, importanceWeight: 5 },
      { skillName: "REST API Design", category: "Backend", requiredLevel: 4, importanceWeight: 5 },
      { skillName: "System Design", category: "Computer Science", requiredLevel: 3, importanceWeight: 4 },
      { skillName: "Docker & Containers", category: "DevOps", requiredLevel: 3, importanceWeight: 3 }
    ],
    projects: [
      {
        title: "RESTful Task Management API with Prisma & RBAC",
        difficulty: "BEGINNER",
        description: "Build a production-ready REST API with JWT authentication, role-based access control, input validation via Zod, and PostgreSQL persistence.",
        technologies: ["Node.js", "Express", "PostgreSQL", "Prisma", "Zod", "JWT"],
        deliverables: ["CRUD routes with RBAC", "Automated migration scripts", "Unit & integration test suites"]
      },
      {
        title: "Distributed In-Memory Key-Value Store with TTL",
        difficulty: "INTERMEDIATE",
        description: "Implement a Redis-like in-memory caching daemon supporting GET, SET, EXPIRE, LRU eviction policy, and TCP socket networking.",
        technologies: ["TypeScript", "Node.js TCP", "Data Structures", "Docker"],
        deliverables: ["TCP command parser", "LRU cache implementation", "Benchmark stress tests"]
      },
      {
        title: "High-Throughput Financial Ledger with Outbox Pattern",
        difficulty: "ADVANCED",
        description: "Build an auditable double-entry bookkeeping service with transactional outbox messaging to Kafka, preventing duplicate credits with idempotency keys.",
        technologies: ["Node.js", "PostgreSQL", "Kafka", "Docker", "Prisma"],
        deliverables: ["Double-entry ledger schema", "Transactional outbox worker", "Dead-letter queue recovery"]
      }
    ],
    questions: [
      {
        question: "Which database isolation level prevents 'Non-Repeatable Reads' but may still permit 'Phantom Reads' in the standard ANSI SQL definition?",
        difficulty: "INTERMEDIATE",
        options: [
          "Read Uncommitted",
          "Read Committed",
          "Repeatable Read",
          "Serializable"
        ],
        answerKey: 2,
        explanation: "Repeatable Read ensures that any row read during a transaction retains its initial state across re-reads, though new matching rows (phantoms) could theoretically appear.",
        skillName: "SQL & Databases"
      },
      {
        question: "When executing 'EXPLAIN ANALYZE' on a slow SQL query in PostgreSQL, what does a 'Seq Scan' (Sequential Scan) on a table with 2 million rows typically indicate?",
        difficulty: "INTERMEDIATE",
        options: [
          "The query is using a high-speed B-Tree index optimally",
          "The database engine had to inspect every row sequentially because no suitable index was available or selective enough",
          "The database cached the entire table into GPU memory",
          "The transaction is locked in a deadlock state"
        ],
        answerKey: 1,
        explanation: "A Sequential Scan reads every data page from disk/buffer from start to finish. For large tables, adding a selective index allows logarithmic Index Scans instead.",
        skillName: "SQL & Databases"
      }
    ]
  },

  // 4. Frontend Engineer
  {
    slug: "frontend",
    title: "Frontend Engineer",
    category: "Engineering",
    description: "Builds modern, responsive, and accessible web user interfaces with React, Next.js, TypeScript, and modern CSS architectures.",
    overview: "Frontend Engineers craft the client experiences users interact with. They combine design sensibility, semantic accessibility, complex state machines, and web performance optimization.",
    careerOpportunities: [
      "Frontend Software Engineer",
      "UI/UX Design Engineer",
      "Web Performance Specialist",
      "Client Platform Engineer",
      "Lead Web Application Developer"
    ],
    coreCsSubjects: [
      "Browser Engine Architecture & Rendering Pipeline",
      "Event Loop, Microtasks & Macrotasks",
      "DOM & CSS Object Model (CSSOM)",
      "Web Security (XSS, CSP, CORS, Clickjacking)"
    ],
    keyConcepts: [
      "Component Reusability & Compound Component Pattern",
      "React 19 Server Components & Actions",
      "Web Accessibility (WCAG 2.1 AA Compliance & ARIA)",
      "Core Web Vitals (LCP, INP, CLS)",
      "Optimistic UI & Client Cache Invalidation"
    ],
    recommendedTools: [
      "React", "Next.js", "TypeScript", "Tailwind CSS", "Vite", "Storybook", "Playwright", "Zustand"
    ],
    portfolioExpectations: "Polished web applications deployed live on Vercel/Cloudflare with 95+ Lighthouse scores, clean responsive layouts across mobile/desktop, and keyboard navigation.",
    interviewTopics: [
      "Virtual DOM diffing algorithms and key prop reconciliation",
      "CSS specificity, stacking contexts (z-index), and layout algorithms (Flexbox vs Grid)",
      "Optimizing Interaction to Next Paint (INP) and bundle size reduction",
      "State management trade-offs (Context vs Zustand vs Server State)"
    ],
    entryLevelGuidance: "Master vanilla JavaScript / TypeScript fundamentals before frameworks. Build responsive layouts from scratch with CSS/Tailwind, and prioritize accessibility standards.",
    milestoneOutcomes: [
      "Publish an accessible component library in Storybook with 100% keyboard support",
      "Achieve 95+ Lighthouse performance and accessibility scores on a live web app",
      "Pass the Frontend Architecture Assessment with >= 75%"
    ],
    skills: [
      { skillName: "React", category: "Frontend", requiredLevel: 4, importanceWeight: 5 },
      { skillName: "TypeScript", category: "Frontend", requiredLevel: 4, importanceWeight: 5 },
      { skillName: "Tailwind CSS", category: "Frontend", requiredLevel: 4, importanceWeight: 4 },
      { skillName: "REST API Design", category: "Backend", requiredLevel: 3, importanceWeight: 3 },
      { skillName: "Git & Version Control", category: "DevOps", requiredLevel: 3, importanceWeight: 3 }
    ],
    projects: [
      {
        title: "Accessible Design System & Component Library",
        difficulty: "BEGINNER",
        description: "Develop a suite of accessible UI components (Button, Modal, Dropdown, Accordion) in Storybook with full ARIA attributes and keyboard navigation.",
        technologies: ["React", "TypeScript", "Tailwind CSS", "Storybook"],
        deliverables: ["Storybook interactive docs", "Keyboard-accessible components", "Zero accessibility violations"]
      },
      {
        title: "Dynamic Drag-and-Drop Kanban Board with Optimistic UI",
        difficulty: "INTERMEDIATE",
        description: "Create an interactive project board featuring column drag-and-drop, optimistic client updates, task search filtering, and localStorage persistence.",
        technologies: ["Next.js", "React", "TypeScript", "Tailwind CSS", "dnd-kit"],
        deliverables: ["Fluid drag-and-drop animations", "Optimistic state management", "Mobile touch support"]
      },
      {
        title: "Real-Time Collaborative Canvas with WebSockets",
        difficulty: "ADVANCED",
        description: "Engineer a high-performance vector drawing and whiteboard application with multi-user cursor tracking, state synchronization, and undo/redo history stacks.",
        technologies: ["React", "TypeScript", "HTML5 Canvas", "WebSockets", "Zustand"],
        deliverables: ["60 FPS canvas rendering", "Multi-cursor broadcast", "State rollback & history"]
      }
    ],
    questions: [
      {
        question: "What Core Web Vital metric measures UI responsiveness to user taps and keyboard strokes across the entire page lifecycle in 2026?",
        difficulty: "INTERMEDIATE",
        options: [
          "First Contentful Paint (FCP)",
          "Cumulative Layout Shift (CLS)",
          "Interaction to Next Paint (INP)",
          "Time to First Byte (TTFB)"
        ],
        answerKey: 2,
        explanation: "Interaction to Next Paint (INP) replaced FID as the official Core Web Vital assessing overall responsiveness to user interactions throughout the page session.",
        skillName: "React"
      },
      {
        question: "Why should developers avoid using array indices as `key` props in dynamically reordered React lists?",
        difficulty: "BEGINNER",
        options: [
          "React throws a runtime compile error when indices are numbers",
          "Indices trigger severe layout shifts in CSS Grid",
          "When list items are reordered, inserted, or removed, index keys cause component state to attach to the wrong element",
          "Index keys increase server network bandwidth"
        ],
        answerKey: 2,
        explanation: "React relies on unique keys to track item identities. Index keys don't change when items reorder, confusing React's diffing engine and causing state glitches.",
        skillName: "React"
      }
    ]
  },

  // 5. Full Stack Engineer
  {
    slug: "full-stack",
    title: "Full Stack Engineer",
    category: "Engineering",
    description: "Delivers complete end-to-end applications bridging frontend experiences with robust backend microservices and databases.",
    overview: "Full Stack Engineers own features from database migrations and server endpoints up to responsive user interfaces and deployments. They are highly valued in fast-growing startups and agile product engineering teams.",
    careerOpportunities: [
      "Full Stack Software Engineer",
      "Product Engineer",
      "Founding Engineer",
      "Web Application Architect",
      "Technical Team Lead"
    ],
    coreCsSubjects: [
      "Client-Server Architecture & Communication Protocols",
      "Relational Database Modeling & Normalization",
      "Web Application Security (OWASP Top 10)",
      "Software Design Patterns & Modular Monoliths"
    ],
    keyConcepts: [
      "End-to-End Type Safety (TypeScript, tRPC, Prisma)",
      "Server-Side Rendering & Server Actions",
      "Session vs JWT Authentication & CSRF Protection",
      "Database Migrations & Seed Workflows",
      "Continuous Integration & Production Deployment"
    ],
    recommendedTools: [
      "Next.js App Router", "TypeScript", "React", "Node.js", "PostgreSQL", "Prisma", "Tailwind CSS", "Docker"
    ],
    portfolioExpectations: "Live deployed multi-tenant or multi-role web platforms featuring verified authentication, database persistence, responsive mobile UI, and clean README walkthroughs.",
    interviewTopics: [
      "Full stack security: Preventing XSS, CSRF, and SQL Injection",
      "Authentication strategies: Cookies with HttpOnly/SameSite vs Bearer tokens in localStorage",
      "SSR vs SSG vs Client-side fetching trade-offs",
      "Structuring relational database schemas for complex many-to-many relationships"
    ],
    entryLevelGuidance: "Master Next.js App Router with TypeScript, understand how client and server components communicate, and practice building complete CRUD applications with relational databases.",
    milestoneOutcomes: [
      "Build and deploy a full-stack SaaS with role-based access control and live database",
      "Implement end-to-end type safety between database schema and client UI",
      "Pass the Full Stack Technical Assessment with >= 75%"
    ],
    skills: [
      { skillName: "React", category: "Frontend", requiredLevel: 4, importanceWeight: 5 },
      { skillName: "TypeScript", category: "Frontend", requiredLevel: 4, importanceWeight: 5 },
      { skillName: "Node.js", category: "Backend", requiredLevel: 4, importanceWeight: 5 },
      { skillName: "SQL & Databases", category: "Backend", requiredLevel: 3, importanceWeight: 4 },
      { skillName: "REST API Design", category: "Backend", requiredLevel: 4, importanceWeight: 4 },
      { skillName: "Git & Version Control", category: "DevOps", requiredLevel: 3, importanceWeight: 3 }
    ],
    projects: [
      {
        title: "Full-Stack Portfolio CMS with Markdown Support",
        difficulty: "BEGINNER",
        description: "Create an editable developer portfolio with an authenticated admin panel to publish case studies, manage contact inquiries, and view analytics.",
        technologies: ["Next.js", "TypeScript", "Tailwind CSS", "SQLite / PostgreSQL", "Prisma"],
        deliverables: ["Protected admin portal", "Dynamic slug routing", "Markdown rendering engine"]
      },
      {
        title: "Multi-Tenant Team Workspace with Permissions",
        difficulty: "INTERMEDIATE",
        description: "Build a collaborative workspace where users can create organizations, invite team members with specific roles (Admin/Member), and manage shared projects.",
        technologies: ["Next.js App Router", "TypeScript", "PostgreSQL", "Prisma", "Tailwind CSS"],
        deliverables: ["Tenant-scoped authorization", "Invitation token workflows", "Audit activity feed"]
      },
      {
        title: "End-to-End B2B SaaS Platform with Billing & Notifications",
        difficulty: "ADVANCED",
        description: "Architect a comprehensive multi-sided application featuring role-based dashboards, in-app notifications, CSV export, and background job processing.",
        technologies: ["Next.js", "React 19", "PostgreSQL", "Prisma", "Tailwind CSS", "Docker"],
        deliverables: ["Complete multi-role portals", "Real-time notifications", "Automated Vitest test suite"]
      }
    ],
    questions: [
      {
        question: "Why should session tokens be stored in HttpOnly, SameSite=Lax cookies rather than browser localStorage?",
        difficulty: "INTERMEDIATE",
        options: [
          "Cookies increase local storage disk capacity",
          "HttpOnly cookies cannot be read by malicious JavaScript, mitigating token theft via Cross-Site Scripting (XSS)",
          "localStorage cannot store strings longer than 16 characters",
          "Cookies bypass all CORS security validations"
        ],
        answerKey: 1,
        explanation: "HttpOnly cookies are inaccessible to JavaScript execution in the browser (`document.cookie`), preventing attackers from stealing sessions via injected XSS scripts.",
        skillName: "TypeScript"
      },
      {
        question: "In Next.js App Router, how do Server Actions provide progressive enhancement for form submissions?",
        difficulty: "INTERMEDIATE",
        options: [
          "They convert all forms into Flash animations",
          "They execute securely on the server and function even if client JavaScript has not yet finished downloading",
          "They prevent CSS from loading on the page",
          "They automatically translate text into 50 languages"
        ],
        answerKey: 1,
        explanation: "Server Actions can be triggered via standard HTML `<form action={...}>`, allowing forms to execute via native HTTP POST even before client JavaScript bundles initialize.",
        skillName: "React"
      }
    ]
  },

  // 6. DevOps / Site Reliability Engineer
  {
    slug: "devops-sre",
    title: "DevOps / Site Reliability Engineer",
    category: "Cloud & Infrastructure",
    description: "Automates CI/CD delivery pipelines, manages containerized clusters with Kubernetes, and guarantees 99.99% system reliability.",
    overview: "DevOps and Site Reliability Engineers treat operations as a software engineering problem. They eliminate manual toil through automation, maintain container orchestration platforms, and build deep observability into distributed systems.",
    careerOpportunities: [
      "DevOps Engineer",
      "Site Reliability Engineer (SRE)",
      "Platform Infrastructure Engineer",
      "Release / Build Engineer",
      "Cloud Operations Specialist"
    ],
    coreCsSubjects: [
      "Operating Systems (Linux Process Management, Syscalls)",
      "Computer Networks (DNS, BGP, TCP/IP, Load Balancing)",
      "System Performance & Kernel Diagnostics",
      "Security & Secret Management"
    ],
    keyConcepts: [
      "Infrastructure as Code (IaC) with Terraform",
      "Container Orchestration & Pod Networking with Kubernetes",
      "GitOps Workflows with ArgoCD / Flux",
      "Service Level Objectives (SLO, SLI, SLA) & Error Budgets",
      "Observability Stack: Metrics, Logs, and Distributed Tracing"
    ],
    recommendedTools: [
      "Docker", "Kubernetes", "Terraform", "GitHub Actions", "Prometheus", "Grafana", "Linux (Ubuntu/Alpine)", "Ansible"
    ],
    portfolioExpectations: "GitHub repositories with clean declarative Terraform modules, working Helm charts, automated CI/CD pipeline runs with status badges, and observability dashboards.",
    interviewTopics: [
      "Linux troubleshooting: Diagnosing high CPU, memory leaks, and zombie processes",
      "Kubernetes pod lifecycle, ingress controllers, and rolling update strategies",
      "Designing disaster recovery runbooks and automated failovers",
      "Canary deployments vs Blue-Green deployment trade-offs"
    ],
    entryLevelGuidance: "Master Linux command line utilities (curl, grep, netstat, top), write optimized multi-stage Dockerfiles, and automate testing and building with GitHub Actions.",
    milestoneOutcomes: [
      "Provision a Kubernetes cluster running a self-healing microservice",
      "Build a zero-downtime CI/CD deployment pipeline with GitHub Actions",
      "Pass the DevOps & SRE Technical Assessment with >= 75%"
    ],
    skills: [
      { skillName: "Docker & Containers", category: "DevOps", requiredLevel: 4, importanceWeight: 5 },
      { skillName: "Git & Version Control", category: "DevOps", requiredLevel: 4, importanceWeight: 5 },
      { skillName: "System Design", category: "Computer Science", requiredLevel: 4, importanceWeight: 4 },
      { skillName: "Node.js", category: "Backend", requiredLevel: 3, importanceWeight: 3 },
      { skillName: "SQL & Databases", category: "Backend", requiredLevel: 3, importanceWeight: 3 }
    ],
    projects: [
      {
        title: "Production CI/CD Pipeline with Multi-Stage Dockerfile",
        difficulty: "BEGINNER",
        description: "Create a containerized application with minimal Alpine base image, linting, automated testing, security vulnerability scanning, and Docker Hub pushing in GitHub Actions.",
        technologies: ["Docker", "GitHub Actions", "Trivy Scanner", "Bash"],
        deliverables: ["Optimized Dockerfile (< 100MB)", "Automated CI workflow", "Security scan report"]
      },
      {
        title: "Kubernetes Cluster Deployment with Ingress & Helm",
        difficulty: "INTERMEDIATE",
        description: "Deploy a high-availability multi-replica application on a Kubernetes cluster with ConfigMaps, Secrets, Ingress routing, and automatic horizontal pod autoscaling (HPA).",
        technologies: ["Kubernetes", "Helm", "Nginx Ingress", "YAML"],
        deliverables: ["Modular Helm chart", "HPA manifest based on CPU load", "Self-healing deployment"]
      },
      {
        title: "Automated GitOps Infrastructure with ArgoCD & Prometheus",
        difficulty: "ADVANCED",
        description: "Build an enterprise GitOps deployment pipeline using ArgoCD that automatically synchronizes repository changes to staging and production with Prometheus alerting.",
        technologies: ["Kubernetes", "ArgoCD", "Prometheus", "Grafana", "Terraform"],
        deliverables: ["GitOps repo structure", "Prometheus alert rules", "Grafana SLA/SLO dashboard"]
      }
    ],
    questions: [
      {
        question: "In Kubernetes, what is the role of a Readiness Probe on a container?",
        difficulty: "INTERMEDIATE",
        options: [
          "It terminates and restarts the pod immediately when failed",
          "It determines whether the container is ready to accept incoming network traffic; failing pods are removed from service endpoints",
          "It compiles the application's source code",
          "It backups the container to an external S3 bucket"
        ],
        answerKey: 1,
        explanation: "Readiness probes detect if a container is temporarily unable to serve traffic (e.g. loading large datasets). If it fails, Kubernetes stops routing requests to it without killing the container.",
        skillName: "Docker & Containers"
      },
      {
        question: "What is an Error Budget in Site Reliability Engineering (SRE)?",
        difficulty: "INTERMEDIATE",
        options: [
          "The maximum financial cost allocated to fixing software bugs",
          "The allowable amount of downtime or unreliability (1 - SLO) that product teams can consume for shipping new features",
          "The total memory capacity allocated to error logs",
          "A tax fine paid to cloud providers during outages"
        ],
        answerKey: 1,
        explanation: "If a system has a 99.9% SLO, its error budget is 0.1% of requests/time. As long as the error budget is healthy, teams can deploy rapidly; if exhausted, focus shifts to stability.",
        skillName: "System Design"
      }
    ]
  },

  // 7. Cloud Engineer
  {
    slug: "cloud",
    title: "Cloud Engineer",
    category: "Cloud & Infrastructure",
    description: "Architects, provisions, monitors, and optimizes cloud computing environments across compute, storage, networking, and serverless.",
    overview: "Cloud Engineers build and maintain resilient cloud foundations. They translate architectural requirements into cloud services (AWS, Azure, GCP), optimize monthly infrastructure spend, and enforce cloud governance and security.",
    careerOpportunities: [
      "Cloud Solutions Engineer",
      "Cloud Architect",
      "AWS / Azure Infrastructure Specialist",
      "Cloud Security & FinOps Engineer",
      "Platform Cloud Developer"
    ],
    coreCsSubjects: [
      "Computer Networks (VPC, CIDR Subnetting, Routing Tables, NAT)",
      "Distributed Systems & Cloud Storage Models",
      "Cloud Security & Identity Governance (IAM)",
      "High Availability & Disaster Recovery"
    ],
    keyConcepts: [
      "Virtual Private Cloud (VPC) & Multi-AZ Topologies",
      "Serverless Computing (Lambda, EventBridge, SQS)",
      "Cloud Storage (Object S3, Block EBS, Network EFS)",
      "Cost Optimization & FinOps Best Practices",
      "Zero-Trust Cloud Identity (IAM Roles, Least Privilege)"
    ],
    recommendedTools: [
      "AWS (ECS, Lambda, S3, RDS, CloudFront)", "Terraform", "Google Cloud", "Microsoft Azure", "CloudWatch", "Bash"
    ],
    portfolioExpectations: "Terraform-defined cloud architecture repositories showing private/public subnet isolation, serverless event-driven pipelines, and architecture diagrams.",
    interviewTopics: [
      "Designing multi-region active-passive vs active-active architectures",
      "AWS IAM security: Role assumption vs static access keys",
      "VPC Peering vs Transit Gateway for cross-account networking",
      "Mitigating serverless cold starts and managing concurrency limits"
    ],
    entryLevelGuidance: "Master foundational networking (IP addressing, subnets, DNS, HTTP), get hands-on experience provisioning AWS resources via Terraform, and understand IAM security.",
    milestoneOutcomes: [
      "Provision a multi-AZ VPC with private subnets and NAT Gateway using Terraform",
      "Build a serverless event-driven processing pipeline on AWS",
      "Pass the Cloud Architecture Assessment with >= 75%"
    ],
    skills: [
      { skillName: "Docker & Containers", category: "DevOps", requiredLevel: 3, importanceWeight: 4 },
      { skillName: "Git & Version Control", category: "DevOps", requiredLevel: 3, importanceWeight: 4 },
      { skillName: "System Design", category: "Computer Science", requiredLevel: 4, importanceWeight: 5 },
      { skillName: "SQL & Databases", category: "Backend", requiredLevel: 3, importanceWeight: 3 },
      { skillName: "REST API Design", category: "Backend", requiredLevel: 3, importanceWeight: 3 }
    ],
    projects: [
      {
        title: "High-Availability Static Asset CDN with CloudFront & S3",
        difficulty: "BEGINNER",
        description: "Deploy a global static website on AWS S3 with CloudFront CDN distribution, SSL/TLS certificate via ACM, and Origin Access Control (OAC) preventing direct bucket access.",
        technologies: ["AWS S3", "CloudFront", "Route 53", "Terraform"],
        deliverables: ["Terraform configuration", "HTTPS custom domain setup", "Cache invalidation workflow"]
      },
      {
        title: "Serverless Event-Driven Image Pipeline with Lambda & SQS",
        difficulty: "INTERMEDIATE",
        description: "Architect an asynchronous pipeline where image uploads to S3 trigger an event, enqueue tasks in SQS, and run Lambda functions to generate optimized thumbnails.",
        technologies: ["AWS Lambda", "S3 Events", "SQS", "Python", "CloudWatch"],
        deliverables: ["EventBridge & SQS queues", "Lambda resize function", "Dead-letter error queue"]
      },
      {
        title: "Multi-Tier Secure Cloud VPC Architecture with RDS",
        difficulty: "ADVANCED",
        description: "Build an enterprise-grade VPC with public subnets for Application Load Balancers, private subnets for ECS services, and isolated database subnets for Multi-AZ PostgreSQL.",
        technologies: ["Terraform", "AWS VPC", "AWS ECS", "AWS RDS Multi-AZ", "Security Groups"],
        deliverables: ["Modular Terraform blueprint", "VPC Flow logs configuration", "Network topology diagram"]
      }
    ],
    questions: [
      {
        question: "Why should database instances (such as Amazon RDS) be placed in private subnets with no internet gateway route?",
        difficulty: "INTERMEDIATE",
        options: [
          "Private subnets make database queries run twice as fast",
          "It shields the database from direct public internet exposure, forcing all traffic to pass through verified internal application tiers",
          "PostgreSQL refuses to run on public subnets",
          "It reduces AWS storage billing costs"
        ],
        answerKey: 1,
        explanation: "Placing databases in isolated private subnets prevents external attackers from scanning or directly connecting to database ports, enforcing defense-in-depth.",
        skillName: "System Design"
      },
      {
        question: "What is the primary benefit of AWS IAM Roles over IAM Users with long-lived Access Keys for EC2 or Lambda compute?",
        difficulty: "INTERMEDIATE",
        options: [
          "IAM Roles allow unlimited administrative access",
          "IAM Roles use temporary, automatically rotating security credentials, eliminating the risk of leaked permanent keys",
          "IAM Roles cost zero dollars compared to IAM Users",
          "IAM Roles bypass security groups"
        ],
        answerKey: 1,
        explanation: "IAM Roles provide short-lived credentials via AWS STS that rotate automatically, avoiding hardcoded secrets or accidental credential leaks in GitHub.",
        skillName: "System Design"
      }
    ]
  },

  // 8. Cybersecurity Engineer
  {
    slug: "cybersecurity",
    title: "Cybersecurity Engineer",
    category: "Security & QA",
    description: "Protects applications, networks, and cloud infrastructure by identifying vulnerabilities, conducting ethical penetration testing, and enforcing defense-in-depth.",
    overview: "Cybersecurity Engineers safeguard digital assets against malicious actors. They audit application source code for security vulnerabilities, configure intrusion detection systems, implement cryptographic authentication, and respond to incidents.",
    careerOpportunities: [
      "Application Security (AppSec) Engineer",
      "Penetration Tester / Ethical Hacker",
      "Security Operations Center (SOC) Analyst",
      "Cloud Security Specialist",
      "Information Security Consultant"
    ],
    coreCsSubjects: [
      "Applied Cryptography (Symmetric, Asymmetric, Hashing, PKI)",
      "Computer Networks & Packet Inspection",
      "Operating System Security & Access Controls",
      "Web Architecture & Vulnerability Vectors"
    ],
    keyConcepts: [
      "OWASP Top 10 (SQLi, XSS, SSRF, Broken Access Control)",
      "Threat Modeling & STRIDE Methodology",
      "Mutual TLS (mTLS) & Zero-Trust Architecture",
      "Identity Federation, JWT Security & Cookie Hardening",
      "Network Penetration Testing & Vulnerability Assessment"
    ],
    recommendedTools: [
      "Wireshark", "Burp Suite", "Python", "Nmap", "Metasploit", "Snort / Suricata", "Linux (Kali / Ubuntu)"
    ],
    portfolioExpectations: "Documented security audit reports, vulnerability reproduction scripts in Python, CVE analysis summaries, and automated security scanning tools.",
    interviewTopics: [
      "Explaining and remediating Server-Side Request Forgery (SSRF)",
      "Mechanics of the TLS 1.3 cryptographic handshake",
      "Differences between authentication vs authorization vs accounting (AAA)",
      "Designing zero-trust perimeter security for microservices"
    ],
    entryLevelGuidance: "Understand TCP/IP and HTTP deeply, learn how attackers exploit web vulnerabilities through hands-on labs (PortSwigger Web Security Academy), and write defensive Python scripts.",
    milestoneOutcomes: [
      "Perform a comprehensive OWASP Top 10 security audit on a web application",
      "Implement mutual TLS (mTLS) with custom certificate authorities",
      "Pass the Cybersecurity & Defense Assessment with >= 75%"
    ],
    skills: [
      { skillName: "REST API Design", category: "Backend", requiredLevel: 4, importanceWeight: 5 },
      { skillName: "System Design", category: "Computer Science", requiredLevel: 4, importanceWeight: 5 },
      { skillName: "Python", category: "Backend", requiredLevel: 3, importanceWeight: 4 },
      { skillName: "Docker & Containers", category: "DevOps", requiredLevel: 3, importanceWeight: 3 },
      { skillName: "Git & Version Control", category: "DevOps", requiredLevel: 3, importanceWeight: 3 }
    ],
    projects: [
      {
        title: "Automated Network Port & Service Scanner in Python",
        difficulty: "BEGINNER",
        description: "Build a multithreaded network security scanner that discovers active hosts, scans open TCP ports, performs banner grabbing to identify services, and outputs JSON reports.",
        technologies: ["Python", "Socket Programming", "TCP/IP", "Threading"],
        deliverables: ["CLI port scanner", "Service banner identification", "JSON output reports"]
      },
      {
        title: "Web Application Vulnerability Scanner (OWASP Top 10)",
        difficulty: "INTERMEDIATE",
        description: "Develop an automated security testing tool that crawls web applications, tests for SQL injection patterns, reflects XSS vectors, and checks for insecure HTTP response headers.",
        technologies: ["Python", "HTTP Client", "Burp Suite", "Regex"],
        deliverables: ["Automated vulnerability scanner", "Remediation guide", "Sample target web testbed"]
      },
      {
        title: "Zero-Trust Microsegmentation Proxy with mTLS",
        difficulty: "ADVANCED",
        description: "Architect a secure reverse proxy daemon enforcing Mutual TLS (mTLS) authentication between microservices, client certificate validation, and real-time security event telemetry.",
        technologies: ["Python / Go", "Cryptography", "Docker", "TLS 1.3", "Nginx"],
        deliverables: ["PKI certificate generator", "mTLS reverse proxy", "Security audit telemetry"]
      }
    ],
    questions: [
      {
        question: "How does Server-Side Request Forgery (SSRF) typically allow an attacker to breach cloud environments?",
        difficulty: "ADVANCED",
        options: [
          "By injecting malicious CSS into the client browser",
          "By coercing the vulnerable backend server into dispatching HTTP requests to internal metadata endpoints (e.g. 169.254.169.254) to steal IAM credentials",
          "By overflowing the client GPU buffer",
          "By altering the user's local system clock"
        ],
        answerKey: 1,
        explanation: "SSRF tricks a server into making requests to internal or loopback resources. In cloud environments, querying the link-local metadata address can expose temporary access tokens.",
        skillName: "System Design"
      },
      {
        question: "What is the primary difference between symmetric and asymmetric encryption?",
        difficulty: "BEGINNER",
        options: [
          "Symmetric encryption uses the same secret key for encryption and decryption; asymmetric encryption uses a public-private key pair",
          "Asymmetric encryption is 1000x faster than symmetric encryption",
          "Symmetric encryption can only encrypt plain text under 128 characters",
          "Asymmetric encryption does not use mathematical algorithms"
        ],
        answerKey: 0,
        explanation: "Symmetric algorithms (like AES) use a single shared key for both operations. Asymmetric algorithms (like RSA / ECC) use a public key for encryption and a private key for decryption.",
        skillName: "REST API Design"
      }
    ]
  },

  // 9. Data Engineer
  {
    slug: "data-engineer",
    title: "Data Engineer",
    category: "Data & AI",
    description: "Builds and scales reliable data ingestion, ETL/ELT pipelines, dimensional data warehouses, and streaming analytics platforms.",
    overview: "Data Engineers turn raw, messy transactional data into clean, structured, and reliable data assets. They design scalable data lakes, write distributed Spark jobs, model star schemas with dbt, and manage pipeline orchestration with Airflow.",
    careerOpportunities: [
      "Data Engineer",
      "Big Data Developer",
      "Analytics Engineer",
      "Data Platform Architect",
      "Data Infrastructure Lead"
    ],
    coreCsSubjects: [
      "Database Systems & Query Execution Engines",
      "Distributed Computing & MapReduce Paradigms",
      "Data Structures & Hash Partitioning",
      "Data Modeling (Dimensional, Star & Snowflake Schemas)"
    ],
    keyConcepts: [
      "ETL vs ELT Paradigms & Modern Data Stack",
      "Distributed Data Processing with Apache Spark",
      "Data Transformation & Testing with dbt",
      "Data Warehouses: Columnar Storage & Partitioning",
      "Stream Processing with Kafka & Event Queues"
    ],
    recommendedTools: [
      "Python / PySpark", "SQL", "Apache Spark", "dbt", "Snowflake / BigQuery", "Apache Airflow", "Kafka", "PostgreSQL"
    ],
    portfolioExpectations: "Production dbt repositories with documented lineage models and tests, working PySpark data transformation scripts, and Dockerized Airflow DAG schedules.",
    interviewTopics: [
      "Row-oriented vs Columnar database storage mechanisms",
      "Optimizing Apache Spark jobs (handling data skews, broadcast joins)",
      "Designing slowly changing dimensions (SCD Type 1 vs Type 2)",
      "Guaranteeing idempotency and replayability in data pipelines"
    ],
    entryLevelGuidance: "Master advanced SQL (window functions, CTEs, indexing), understand dimensional data modeling (fact and dimension tables), and write automated transformations with Python and dbt.",
    milestoneOutcomes: [
      "Model and build a dimensional data warehouse using dbt with automated tests",
      "Develop a distributed data transformation job with Apache Spark",
      "Pass the Data Engineering Technical Assessment with >= 75%"
    ],
    skills: [
      { skillName: "SQL & Databases", category: "Backend", requiredLevel: 5, importanceWeight: 5 },
      { skillName: "Python", category: "Backend", requiredLevel: 4, importanceWeight: 5 },
      { skillName: "Data Structures & Algorithms", category: "Computer Science", requiredLevel: 3, importanceWeight: 4 },
      { skillName: "System Design", category: "Computer Science", requiredLevel: 4, importanceWeight: 4 },
      { skillName: "Docker & Containers", category: "DevOps", requiredLevel: 3, importanceWeight: 3 }
    ],
    projects: [
      {
        title: "Automated Relational ETL Pipeline with PostgreSQL & Python",
        difficulty: "BEGINNER",
        description: "Extract raw operational data from multiple REST endpoints, validate schema structures, clean null values, and load normalized tables into PostgreSQL.",
        technologies: ["Python", "PostgreSQL", "Pandas", "SQLAlchemy"],
        deliverables: ["Ingestion script", "Data validation checks", "Automated cron schedule"]
      },
      {
        title: "Enterprise Dimensional Warehouse with dbt & Testing",
        difficulty: "INTERMEDIATE",
        description: "Transform raw transactional tables into an analytics-ready Star Schema using dbt, with automated generic tests (not null, unique), and auto-generated data lineage docs.",
        technologies: ["dbt", "PostgreSQL / Snowflake", "SQL", "Git"],
        deliverables: ["Dimension & Fact dbt models", "Automated data test suite", "Interactive documentation"]
      },
      {
        title: "Real-Time Clickstream Streaming Pipeline with Kafka & Spark",
        difficulty: "ADVANCED",
        description: "Build an end-to-end streaming engine that consumes website clickstream events from Apache Kafka, aggregates user session metrics with Spark Streaming, and sinks data into Delta Lake.",
        technologies: ["Apache Kafka", "Apache Spark", "Python / PySpark", "Docker", "Delta Lake"],
        deliverables: ["Kafka producer simulator", "Spark Streaming processor", "Partitioned Delta Lake storage"]
      }
    ],
    questions: [
      {
        question: "Why are columnar storage formats (like Apache Parquet) vastly superior to row-based formats (like CSV) for analytical OLAP queries?",
        difficulty: "INTERMEDIATE",
        options: [
          "Columnar formats encrypt all data with SSL automatically",
          "Queries only need to read the specific columns requested from disk, and similar data types compress significantly better",
          "Parquet files can only be read on macOS",
          "Row formats cannot store floating point numbers"
        ],
        answerKey: 1,
        explanation: "In analytics queries that aggregate 3 columns out of 50, columnar formats skip unneeded columns entirely, reducing I/O by 90%+ and leveraging high compression ratios.",
        skillName: "SQL & Databases"
      },
      {
        question: "What is the primary characteristic of a Slowly Changing Dimension Type 2 (SCD2) in data warehousing?",
        difficulty: "INTERMEDIATE",
        options: [
          "It overwrites old attribute values, destroying historical records",
          "It tracks historical changes by inserting a new record with effective start/end dates and an active flag whenever an attribute changes",
          "It deletes the entire table every midnight",
          "It only permits 2 updates per calendar year"
        ],
        answerKey: 1,
        explanation: "SCD Type 2 maintains a full historical audit trail by creating a new version of the dimension row with date validity ranges (e.g., `valid_from`, `valid_to`, `is_current`).",
        skillName: "SQL & Databases"
      }
    ]
  },

  // 10. Data Scientist / Data Analyst
  {
    slug: "data-science-analytics",
    title: "Data Scientist / Data Analyst",
    category: "Data & AI",
    description: "Extracts business intelligence, formulates statistical hypotheses, runs rigorous A/B experiments, and builds predictive machine learning models.",
    overview: "Data Scientists and Analysts turn complex datasets into actionable business decisions. They explore customer behaviors, build predictive models, design statistical A/B tests, and build executive dashboards.",
    careerOpportunities: [
      "Data Scientist",
      "Product / Business Data Analyst",
      "Quantitative Analyst",
      "Marketing / Growth Analyst",
      "Decision Intelligence Specialist"
    ],
    coreCsSubjects: [
      "Inferential Statistics & Probability Theory",
      "Linear Algebra & Multivariable Calculus",
      "Experimental Design & A/B Testing",
      "Data Mining & Exploratory Data Analysis"
    ],
    keyConcepts: [
      "Statistical Hypothesis Testing (p-values, t-test, ANOVA, Chi-Squared)",
      "Supervised vs Unsupervised Learning (Regression, Trees, Clustering)",
      "Feature Engineering & Dimensionality Reduction (PCA)",
      "Cohort Retention & Customer Lifetime Value (LTV) Modeling",
      "Data Storytelling & Executive Dashboard Design"
    ],
    recommendedTools: [
      "Python (Pandas, NumPy, Scikit-Learn)", "SQL", "Jupyter", "Tableau / PowerBI", "Seaborn / Matplotlib", "Streamlit"
    ],
    portfolioExpectations: "Interactive data storytelling notebooks, public Tableau/Streamlit dashboards, and reproducible analysis repositories with clear business summaries.",
    interviewTopics: [
      "Explaining p-values, Type I vs Type II errors, and statistical power",
      "Handling imbalanced datasets (SMOTE, class weighting, precision vs recall)",
      "Interpreting regression coefficients and odds ratios",
      "Designing an A/B test: Sample size estimation, minimum detectable effect (MDE)"
    ],
    entryLevelGuidance: "Master SQL queries and joins, learn Python data wrangling with Pandas, understand the math behind statistical significance, and practice communicating data insights clearly.",
    milestoneOutcomes: [
      "Design and evaluate an A/B testing experiment with statistical significance calculations",
      "Build a customer churn prediction model with > 80% ROC-AUC",
      "Pass the Data Science & Analytics Assessment with >= 75%"
    ],
    skills: [
      { skillName: "Python", category: "Backend", requiredLevel: 4, importanceWeight: 5 },
      { skillName: "SQL & Databases", category: "Backend", requiredLevel: 4, importanceWeight: 5 },
      { skillName: "Data Structures & Algorithms", category: "Computer Science", requiredLevel: 3, importanceWeight: 4 },
      { skillName: "Git & Version Control", category: "DevOps", requiredLevel: 3, importanceWeight: 3 }
    ],
    projects: [
      {
        title: "Exploratory Data Analysis & Interactive Streamlit Dashboard",
        difficulty: "BEGINNER",
        description: "Analyze a large retail e-commerce dataset, uncover sales trends, customer segmentation patterns, and build an interactive dashboard with filterable charts.",
        technologies: ["Python", "Pandas", "Streamlit", "Plotly"],
        deliverables: ["Cleaned dataset & notebook", "Interactive Streamlit web app", "Executive insight summary"]
      },
      {
        title: "Customer Churn Prediction Model with Cost-Benefit Analysis",
        difficulty: "INTERMEDIATE",
        description: "Develop a predictive classification model using Random Forest / XGBoost, tune hyperparameters, evaluate ROC-AUC curves, and calculate potential business revenue saved.",
        technologies: ["Python", "Scikit-Learn", "XGBoost", "Matplotlib"],
        deliverables: ["Feature importance analysis", "Confusion matrix & ROC curves", "Business ROI calculator"]
      },
      {
        title: "A/B Testing Experimentation Framework with Power Analysis",
        difficulty: "ADVANCED",
        description: "Design a full statistical testing platform that calculates required sample sizes, tests for sample ratio mismatch (SRM), and computes two-tailed z-tests and confidence intervals.",
        technologies: ["Python", "SciPy", "Statsmodels", "SQL"],
        deliverables: ["Sample size calculator", "Statistical testing engine", "Automated A/B experiment report"]
      }
    ],
    questions: [
      {
        question: "When evaluating a machine learning model for credit card fraud detection (where 99.8% of transactions are legitimate), why is Accuracy a dangerously misleading metric?",
        difficulty: "INTERMEDIATE",
        options: [
          "Accuracy cannot be computed on decimal numbers",
          "A naive model that predicts 'Not Fraud' 100% of the time achieves 99.8% accuracy while catching zero fraudulent transactions; Precision, Recall, and PR-AUC are far more appropriate",
          "Accuracy is strictly proprietary to Google",
          "Fraud detection models only accept unsupervised algorithms"
        ],
        answerKey: 1,
        explanation: "In highly imbalanced datasets, accuracy creates a false sense of success. Metrics like Recall (catching all fraud) and Precision (minimizing false alarms) are essential.",
        skillName: "Python"
      },
      {
        question: "What does a p-value of 0.03 indicate in a two-tailed hypothesis test with a significance threshold (alpha) of 0.05?",
        difficulty: "INTERMEDIATE",
        options: [
          "There is a 3% probability that the alternative hypothesis is false",
          "Assuming the null hypothesis is true, there is a 3% probability of observing an effect as extreme or more extreme than the data collected; we reject the null hypothesis",
          "The experiment must be rerun 97 more times",
          "The sample size was too small by 3%"
        ],
        answerKey: 1,
        explanation: "Since p < alpha (0.03 < 0.05), the observed data is statistically significant under the null hypothesis, leading us to reject the null hypothesis.",
        skillName: "SQL & Databases"
      }
    ]
  },

  // 11. Mobile Application Engineer
  {
    slug: "mobile-engineer",
    title: "Mobile Application Engineer",
    category: "Engineering",
    description: "Develops native and cross-platform mobile apps with fluid touch gestures, offline caching, and device hardware integration.",
    overview: "Mobile Application Engineers craft experiences optimized for iOS and Android smartphones and tablets. They optimize memory consumption, manage device battery drain, handle intermittent network connections, and implement smooth 60fps animations.",
    careerOpportunities: [
      "Mobile Software Engineer",
      "iOS Developer",
      "Android Developer",
      "React Native / Flutter Engineer",
      "Mobile Platform Architect"
    ],
    coreCsSubjects: [
      "Mobile Application Lifecycle Architecture",
      "Memory Allocation & Garbage Collection on Mobile OS",
      "Asynchronous I/O & Thread Pooling",
      "Mobile Security & Secure Key Storage (Keychain/Keystore)"
    ],
    keyConcepts: [
      "Cross-Platform vs Native Development (React Native / Flutter vs Swift / Kotlin)",
      "Offline-First Data Synchronization & SQLite Storage",
      "Touch Gestures & Reanimated 60 FPS Pipelines",
      "Push Notifications & Background Worker Tasks",
      "App Store & Google Play Release Pipelines"
    ],
    recommendedTools: [
      "React Native", "TypeScript", "Flutter", "Swift / Kotlin", "SQLite / Realm", "Expo", "Firebase", "Postman"
    ],
    portfolioExpectations: "Published mobile apps on GitHub with recorded demo videos, Expo snack links, or App Store / TestFlight invitations demonstrating smooth gesture animations.",
    interviewTopics: [
      "Mobile app lifecycle states (Active, Background, Suspended) and state persistence",
      "Managing offline data synchronization and conflict resolution",
      "Debugging mobile memory leaks and optimizing battery usage",
      "React Native bridge / JSI architecture vs Flutter engine rendering"
    ],
    entryLevelGuidance: "Master JavaScript/TypeScript and React fundamentals, then learn React Native or Flutter. Build apps that utilize native device APIs (camera, geolocation, local notifications).",
    milestoneOutcomes: [
      "Build a cross-platform mobile application running on both iOS and Android",
      "Implement offline-first data caching with SQLite or local storage",
      "Pass the Mobile Engineering Technical Assessment with >= 75%"
    ],
    skills: [
      { skillName: "React", category: "Frontend", requiredLevel: 4, importanceWeight: 5 },
      { skillName: "TypeScript", category: "Frontend", requiredLevel: 4, importanceWeight: 5 },
      { skillName: "REST API Design", category: "Backend", requiredLevel: 3, importanceWeight: 4 },
      { skillName: "Git & Version Control", category: "DevOps", requiredLevel: 3, importanceWeight: 3 },
      { skillName: "System Design", category: "Computer Science", requiredLevel: 3, importanceWeight: 3 }
    ],
    projects: [
      {
        title: "Cross-Platform Habit Tracker with Local Storage",
        difficulty: "BEGINNER",
        description: "Build a sleek mobile productivity app with daily streak tracking, custom animated progress bars, local SQLite persistence, and scheduled push notifications.",
        technologies: ["React Native", "Expo", "TypeScript", "AsyncStorage / SQLite"],
        deliverables: ["Mobile app demo video", "Local storage data models", "Streak notification triggers"]
      },
      {
        title: "Offline-First Field Operations App with Background Sync",
        difficulty: "INTERMEDIATE",
        description: "Create an inspection app where field workers can capture photos and fill forms offline. Data queues in SQLite and automatically syncs when internet connects.",
        technologies: ["React Native", "TypeScript", "SQLite", "Camera API", "NetInfo"],
        deliverables: ["Offline queue manager", "Network listener sync worker", "Camera photo compressor"]
      },
      {
        title: "Real-Time Mobile P2P Marketplace with Geolocation",
        difficulty: "ADVANCED",
        description: "Architect a full-fledged mobile marketplace app featuring map-based item discovery, real-time WebSocket chat between buyers/sellers, and biometric authentication.",
        technologies: ["React Native", "TypeScript", "WebSockets", "Mapbox", "LocalAuthentication"],
        deliverables: ["Map marker clustering", "Real-time chat screens", "Biometric login flow"]
      }
    ],
    questions: [
      {
        question: "When a mobile operating system enters a low-memory state, what happens to backgrounded applications?",
        difficulty: "INTERMEDIATE",
        options: [
          "The OS silently doubles available physical RAM",
          "The OS terminates background app processes to reclaim memory; applications must properly persist their state before moving to background",
          "The OS deletes the user's application files permanently",
          "Background apps are paused for exactly 3 seconds"
        ],
        answerKey: 1,
        explanation: "Mobile operating systems aggressively terminate background processes to keep the active foreground app smooth. Apps must serialize active state in lifecycle hooks.",
        skillName: "React"
      },
      {
        question: "What is the primary advantage of SQLite / Realm over AsyncStorage / Key-Value storage for complex mobile applications?",
        difficulty: "BEGINNER",
        options: [
          "SQLite automatically connects to the public cloud without code",
          "SQLite supports structured relational queries, indexes, and transactions on millions of records with high performance",
          "AsyncStorage is forbidden on iOS devices",
          "SQLite reduces app icon file sizes"
        ],
        answerKey: 1,
        explanation: "Key-value stores require parsing entire blobs into memory. SQLite provides indexing, binary transactions, and fast query execution directly on device storage.",
        skillName: "TypeScript"
      }
    ]
  },

  // 12. QA Automation / Software Development Engineer in Test (SDET)
  {
    slug: "sdet-qa",
    title: "QA Automation / SDET",
    category: "Security & QA",
    description: "Designs, develops, and maintains scalable test automation frameworks, API contract test harnesses, and load/stress testing infrastructure.",
    overview: "Software Development Engineers in Test (SDETs) build the automated quality engineering systems that allow teams to ship multiple times a day with high confidence. They write E2E test suites, API contract tests, and performance load tests.",
    careerOpportunities: [
      "Software Development Engineer in Test (SDET)",
      "QA Automation Engineer",
      "Quality Platform Engineer",
      "Test Automation Architect",
      "Performance & Reliability Test Engineer"
    ],
    coreCsSubjects: [
      "Software Testing Methodologies (Black Box, White Box, Gray Box)",
      "Test Automation Architecture & Design Patterns (Page Object Model)",
      "System Performance Profiling & Concurrency Testing",
      "Defect Management & Continuous Quality Assurance"
    ],
    keyConcepts: [
      "Test Automation Pyramid (Unit, Integration, End-to-End)",
      "Headless Browser Automation with Playwright / Cypress",
      "API Contract Testing & Schema Validation (Postman, Pact)",
      "Performance & Stress Testing with k6 / JMeter",
      "CI/CD Quality Gates & Flaky Test Quarantine"
    ],
    recommendedTools: [
      "Playwright", "TypeScript", "Python", "Cypress", "Postman / Newman", "k6", "Vitest / Jest", "GitHub Actions"
    ],
    portfolioExpectations: "GitHub repositories featuring automated Playwright test suites running in CI with HTML test reports, mocking strategies, and load testing scripts with graphs.",
    interviewTopics: [
      "Mitigating flaky tests in distributed CI environments (auto-waiting, stable locators)",
      "Testing microservices: Contract testing with Pact vs end-to-end testing",
      "Load testing concepts: Virtual users, ramp-up time, p95/p99 latency, and saturation",
      "Implementing the Page Object Model (POM) pattern cleanly in TypeScript"
    ],
    entryLevelGuidance: "Master JavaScript/TypeScript, learn browser automation with Playwright, write automated API validation scripts, and integrate test suites into GitHub Actions CI workflows.",
    milestoneOutcomes: [
      "Build a Playwright E2E automation framework using the Page Object Model",
      "Execute a performance load test simulating 5,000 requests with k6",
      "Pass the QA Automation & SDET Assessment with >= 75%"
    ],
    skills: [
      { skillName: "TypeScript", category: "Frontend", requiredLevel: 4, importanceWeight: 5 },
      { skillName: "REST API Design", category: "Backend", requiredLevel: 4, importanceWeight: 5 },
      { skillName: "Git & Version Control", category: "DevOps", requiredLevel: 4, importanceWeight: 4 },
      { skillName: "Docker & Containers", category: "DevOps", requiredLevel: 3, importanceWeight: 3 },
      { skillName: "System Design", category: "Computer Science", requiredLevel: 3, importanceWeight: 3 }
    ],
    projects: [
      {
        title: "Automated API Contract & Regression Suite with Postman/Newman",
        difficulty: "BEGINNER",
        description: "Create an automated test suite verifying status codes, JSON schema validation, response headers, and response latency across all endpoints with Newman CI reporting.",
        technologies: ["Postman", "Newman", "JavaScript", "GitHub Actions"],
        deliverables: ["Test collection with assertions", "Newman CI execution script", "HTML quality report"]
      },
      {
        title: "Enterprise Playwright E2E Automation Framework",
        difficulty: "INTERMEDIATE",
        description: "Engineer an End-to-End test suite using Playwright and Page Object Model (POM) covering authentication, drag-and-drop, form validation, and visual regression.",
        technologies: ["Playwright", "TypeScript", "GitHub Actions", "Docker"],
        deliverables: ["POM test framework", "Parallel browser execution (Chromium/Firefox)", "Visual snapshot testing"]
      },
      {
        title: "Distributed Load & Stress Testing Harness with k6",
        difficulty: "ADVANCED",
        description: "Develop a performance testing harness with k6 simulating thousands of concurrent virtual users, monitoring p99 response times, and asserting SLO performance thresholds.",
        technologies: ["k6", "JavaScript", "Grafana", "Docker", "Prometheus"],
        deliverables: ["k6 load scenario scripts", "Threshold assertions (p95 < 200ms)", "Grafana performance dashboard"]
      }
    ],
    questions: [
      {
        question: "In browser automation frameworks like Playwright, what is the primary cause of 'flaky' tests, and how is it reliably solved?",
        difficulty: "INTERMEDIATE",
        options: [
          "Flaky tests are caused by browser CSS styling and solved by disabling CSS",
          "Flaky tests are caused by race conditions and arbitrary sleep timeouts (`sleep(5000)`); they are solved by utilizing Playwright's automatic actionability waiting and web assertions",
          "Flaky tests are solved by running tests only on Saturday nights",
          "Flaky tests are caused by too many Git commits"
        ],
        answerKey: 1,
        explanation: "Arbitrary `sleep` calls fail when CI runners slow down. Modern frameworks like Playwright automatically wait for elements to be visible, enabled, and stable before interacting.",
        skillName: "TypeScript"
      },
      {
        question: "What does the 99th percentile (p99) response time represent in performance engineering?",
        difficulty: "INTERMEDIATE",
        options: [
          "The average latency of the fastest 1% of users",
          "99% of all requests completed within this duration, while the slowest 1% of requests took longer",
          "The percentage of requests that failed with HTTP 500",
          "The CPU utilization percentage of the database server"
        ],
        answerKey: 1,
        explanation: "Percentiles reveal tail latency that simple averages conceal. A p99 of 250ms means 99 out of 100 requests finished in <= 250ms, highlighting outlier experiences.",
        skillName: "System Design"
      }
    ]
  }
];

export function getDomainBySlug(slug: string): DomainBlueprint | undefined {
  return DOMAIN_CATALOG.find((d) => d.slug === slug);
}

export function getAllDomains(): DomainBlueprint[] {
  return DOMAIN_CATALOG;
}
