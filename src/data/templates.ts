export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  emoji: string;
  defaultTitle: string;
  content: any; // Tiptap JSON
}

export const TEMPLATES: TemplateDefinition[] = [
  {
    id: 'blank',
    name: 'Blank',
    description: 'Empty document — start from scratch',
    emoji: '📄',
    defaultTitle: 'Untitled Guide',
    content: {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Start writing here…' }] },
      ],
    },
  },
  {
    id: 'product-docs',
    name: 'Product Docs',
    description: 'Overview, installation, and usage guide',
    emoji: '📦',
    defaultTitle: 'Product Documentation',
    content: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Product Documentation' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'A brief description of what this product does and who it\'s for.' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Overview' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Explain the core value proposition and key features.' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Installation' }] },
        { type: 'codeBlock', attrs: { language: 'bash' }, content: [{ type: 'text', text: 'npm install your-package' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Quick Start' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Minimal working example to get started in under 5 minutes.' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Configuration' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Describe all available configuration options.' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'FAQ' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Common questions and their answers.' }] },
      ],
    },
  },
  {
    id: 'api-reference',
    name: 'API Reference',
    description: 'Endpoints, parameters, and responses',
    emoji: '🔌',
    defaultTitle: 'API Reference',
    content: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'API Reference' }] },
        { type: 'paragraph', content: [
          { type: 'text', text: 'Base URL: ' },
          { type: 'text', marks: [{ type: 'code' }], text: 'https://api.example.com/v1' },
        ]},
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Authentication' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Include your API key in every request header.' }] },
        { type: 'codeBlock', attrs: { language: 'bash' }, content: [{ type: 'text', text: 'Authorization: Bearer YOUR_API_KEY' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'GET /resources' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Returns a paginated list of resources.' }] },
        { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Query Parameters' }] },
        { type: 'bulletList', content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [
            { type: 'text', marks: [{ type: 'code' }], text: 'limit' },
            { type: 'text', text: ' (integer) — Max results to return (default: 20)' },
          ]}]},
          { type: 'listItem', content: [{ type: 'paragraph', content: [
            { type: 'text', marks: [{ type: 'code' }], text: 'offset' },
            { type: 'text', text: ' (integer) — Pagination offset (default: 0)' },
          ]}]},
        ]},
        { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Response' }] },
        { type: 'codeBlock', attrs: { language: 'json' }, content: [{ type: 'text', text: '{\n  "data": [],\n  "total": 0,\n  "hasMore": false\n}' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'POST /resources' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Creates a new resource.' }] },
      ],
    },
  },
  {
    id: 'tutorial',
    name: 'Tutorial',
    description: 'Step-by-step walkthrough format',
    emoji: '🎓',
    defaultTitle: 'Getting Started Tutorial',
    content: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Getting Started Tutorial' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'In this tutorial, you will learn how to set up and use…' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Prerequisites' }] },
        { type: 'bulletList', content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Node.js 18 or later' }] }]},
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'A basic understanding of…' }] }]},
        ]},
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Step 1: Setup Your Environment' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Begin by cloning the repository and installing dependencies.' }] },
        { type: 'codeBlock', attrs: { language: 'bash' }, content: [{ type: 'text', text: 'git clone https://github.com/example/project\ncd project\nnpm install' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Step 2: Configure' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Copy the example config and update it for your environment.' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Step 3: Run the App' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Start the development server and verify everything works.' }] },
        { type: 'codeBlock', attrs: { language: 'bash' }, content: [{ type: 'text', text: 'npm run dev' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Next Steps' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Now that the basics are working, explore the advanced features…' }] },
      ],
    },
  },
  {
    id: 'changelog',
    name: 'Changelog',
    description: 'Version history and release notes',
    emoji: '📋',
    defaultTitle: 'Changelog',
    content: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Changelog' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'All notable changes to this project are documented here. Follows ' }, { type: 'text', marks: [{ type: 'link', attrs: { href: 'https://keepachangelog.com' } }], text: 'Keep a Changelog' }, { type: 'text', text: ' conventions.' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '[1.0.0] — 2025-01-01' }] },
        { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Added' }] },
        { type: 'bulletList', content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Initial public release' }] }]},
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Core feature X' }] }]},
        ]},
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '[0.9.0] — 2024-12-15' }] },
        { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Added' }] },
        { type: 'bulletList', content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Beta feature Y' }] }]},
        ]},
        { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Fixed' }] },
        { type: 'bulletList', content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Bug where Z caused unexpected behavior' }] }]},
        ]},
      ],
    },
  },
  {
    id: 'onboarding',
    name: 'Onboarding Guide',
    description: 'Welcome, setup checklist, first-week tasks',
    emoji: '👋',
    defaultTitle: 'Onboarding Guide',
    content: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Welcome to the Team!' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'This guide will help you get set up and productive on your first day.' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Before Day One' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Make sure you have access to the following:' }] },
        { type: 'taskList', content: [
          { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Company email account' }] }]},
          { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Slack workspace invitation' }] }]},
          { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'GitHub / GitLab access' }] }]},
          { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Development environment setup guide' }] }]},
        ]},
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Team & Culture' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Learn about the team structure, values, and ways of working.' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Key Resources' }] },
        { type: 'bulletList', content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Internal wiki and documentation hub' }] }]},
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Slack channels to join on day one' }] }]},
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Engineering handbook and contribution guide' }] }]},
        ]},
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Your First Week' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Focus on getting your environment running and shipping a small change to get familiar with the process.' }] },
      ],
    },
  },
];
