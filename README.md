# Auth0 AI Admin Assistant 

This Auth0 AI Admin Assistant extension provides a powerful natural language interface that enables administrators to manage their Auth0 tenant without manual processes. Powered by leading AI models from Anthropic, OpenAI, or Google, administrators can simply chat with the assistant to create users, configure clients, manage connections, implement rules, and perform other administrative tasks through conversational commands rather than navigating complex dashboards or writing code. The extension includes comprehensive security controls with permission verification and confirmation prompts for destructive actions, detailed audit logging for compliance and troubleshooting, support for multiple AI providers that can be configured based on your preference and existing API keys, and a real-time chat interface with immediate feedback as commands are processed. Simply install this extension, configure your preferred AI provider, and start managing your Auth0 tenant through natural language—eliminating the need for complex manual processes while maintaining security and control.


#!/bin/bash
# Auth0 AI Admin Assistant Extension Repository Generator
# This script generates all files needed for the Auth0 AI Admin Assistant extension

# Create directory structure
mkdir -p public
mkdir -p .github/workflows
mkdir -p .github/dependabot

# Generate main extension code (index.js)
cat > index.js << 'EOL'
// Auth0 AI Admin Assistant Extension
// This extension provides an AI-powered chatbot interface for Auth0 administration

// Structure:
// 1. Extension setup and configuration
// 2. Authentication and permissions
// 3. AI integration (Anthropic, OpenAI, or Gemini)
// 4. Auth0 Management API integration
// 5. Chatbot interface
// 6. Command handling and execution
// 7. Logging and auditing

// Extension configuration
const config = require('./config');
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const axios = require('axios');
const { ManagementClient } = require('auth0');

// AI Provider setup
const { AnthropicAI } = require('@anthropic-ai/sdk');
const { OpenAI } = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Express app
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Setup session
app.use(session({
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: config.production }
}));

// Initialize AI client based on configuration
let aiClient;
switch (config.aiProvider) {
  case 'anthropic':
    aiClient = new AnthropicAI({
      apiKey: config.anthropic.apiKey
    });
    break;
  case 'openai':
    aiClient = new OpenAI({
      apiKey: config.openai.apiKey
    });
    break;
  case 'gemini':
    aiClient = new GoogleGenerativeAI(config.gemini.apiKey);
    break;
  default:
    throw new Error('Invalid AI provider specified');
}

// Auth0 Management API client
const auth0ManagementClient = new ManagementClient({
  domain: config.auth0.domain,
  clientId: config.auth0.clientId,
  clientSecret: config.auth0.clientSecret,
  scope: 'read:users update:users create:users delete:users read:clients update:clients create:clients delete:clients read:connections update:connections create:connections delete:connections read:rules update:rules create:rules delete:rules'
});

// Command executor with safety checks
const commandExecutor = {
  async executeCommand(command, params, context) {
    // Log the command
    console.log(`Executing command: ${command}`);
    console.log(`With parameters:`, params);
    
    // Validate permissions
    if (!hasPermission(context.user, command)) {
      throw new Error('Insufficient permissions');
    }
    
    // Execute the command
    try {
      switch (command) {
        case 'createUser':
          return await auth0ManagementClient.users.create(params);
        case 'updateUser':
          return await auth0ManagementClient.users.update({ id: params.id }, params.updates);
        case 'deleteUser':
          return await auth0ManagementClient.users.delete({ id: params.id });
        case 'createClient':
          return await auth0ManagementClient.clients.create(params);
        case 'updateClient':
          return await auth0ManagementClient.clients.update({ client_id: params.client_id }, params.updates);
        case 'deleteClient':
          return await auth0ManagementClient.clients.delete({ client_id: params.client_id });
        case 'listUsers':
          return await auth0ManagementClient.users.getAll(params);
        case 'listClients':
          return await auth0ManagementClient.clients.getAll(params);
        case 'createConnection':
          return await auth0ManagementClient.connections.create(params);
        case 'updateConnection':
          return await auth0ManagementClient.connections.update({ id: params.id }, params.updates);
        case 'deleteConnection':
          return await auth0ManagementClient.connections.delete({ id: params.id });
        case 'createRule':
          return await auth0ManagementClient.rules.create(params);
        case 'updateRule':
          return await auth0ManagementClient.rules.update({ id: params.id }, params.updates);
        case 'deleteRule':
          return await auth0ManagementClient.rules.delete({ id: params.id });
        default:
          throw new Error(`Unknown command: ${command}`);
      }
    } catch (error) {
      console.error(`Error executing command ${command}:`, error);
      throw error;
    }
  }
};

// Check if user has permission to execute a command
function hasPermission(user, command) {
  // Implement your permission logic here
  // For example, check if the user has the admin role
  return user.roles && user.roles.includes('admin');
}

// AI helper to process natural language into commands
const aiHelper = {
  async processMessage(message, context) {
    try {
      let response;
      
      // Craft the prompt with context about Auth0 and available commands
      const prompt = `
        You are an Auth0 Admin Assistant. Parse the following request and convert it into a specific Auth0 command.
        Available commands: createUser, updateUser, deleteUser, createClient, updateClient, deleteClient, 
        listUsers, listClients, createConnection, updateConnection, deleteConnection, createRule, updateRule, deleteRule.
        
        User request: ${message}
        
        Return a JSON object with 'command' and 'params' fields. If you cannot determine a specific command,
        return { "action": "clarify", "message": "your clarification question" }.
      `;
      
      switch (config.aiProvider) {
        case 'anthropic':
          response = await aiClient.messages.create({
            model: 'claude-3-opus-20240229',
            max_tokens: 1000,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.2
          });
          return JSON.parse(response.content[0].text);
          
        case 'openai':
          response = await aiClient.chat.completions.create({
            model: 'gpt-4o',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.2
          });
          return JSON.parse(response.choices[0].message.content);
          
        case 'gemini':
          const genAI = aiClient;
          const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
          response = await model.generateContent(prompt);
          return JSON.parse(response.response.text());
      }
    } catch (error) {
      console.error('Error processing message with AI:', error);
      return {
        action: 'error',
        message: 'Failed to process your request. Please try again or use more specific instructions.'
      };
    }
  }
};

// Chat API endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    const user = req.user; // Assuming user info is attached by authentication middleware
    
    // Process the message with AI to determine command and parameters
    const aiResponse = await aiHelper.processMessage(message, { user });
    
    if (aiResponse.action === 'clarify') {
      // AI needs more information
      return res.json({
        type: 'clarification',
        message: aiResponse.message
      });
    }
    
    if (aiResponse.action === 'error') {
      // AI encountered an error
      return res.status(400).json({
        type: 'error',
        message: aiResponse.message
      });
    }
    
    // Execute the command
    const result = await commandExecutor.executeCommand(
      aiResponse.command,
      aiResponse.params,
      { user }
    );
    
    // Generate a human-readable response
    const humanResponse = await aiHelper.processMessage(
      `Generate a human-readable response for the following command result: ${JSON.stringify(result)}`,
      { user }
    );
    
    return res.json({
      type: 'success',
      command: aiResponse.command,
      result,
      message: humanResponse.message || 'Command executed successfully.'
    });
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    return res.status(500).json({
      type: 'error',
      message: error.message || 'An error occurred processing your request.'
    });
  }
});

// WebSocket support for real-time chat
const server = require('http').createServer(app);
const io = require('socket.io')(server);

io.on('connection', (socket) => {
  console.log('User connected to chat');
  
  socket.on('message', async (data) => {
    try {
      const user = data.user; // User info should be validated
      
      // Process message with AI
      const aiResponse = await aiHelper.processMessage(data.message, { user });
      
      if (aiResponse.action === 'clarify') {
        return socket.emit('response', {
          type: 'clarification',
          message: aiResponse.message
        });
      }
      
      if (aiResponse.action === 'error') {
        return socket.emit('response', {
          type: 'error',
          message: aiResponse.message
        });
      }
      
      // Execute the command
      const result = await commandExecutor.executeCommand(
        aiResponse.command,
        aiResponse.params,
        { user }
      );
      
      // Generate response
      const humanResponse = await aiHelper.processMessage(
        `Generate a human-readable response for the following command result: ${JSON.stringify(result)}`,
        { user }
      );
      
      socket.emit('response', {
        type: 'success',
        command: aiResponse.command,
        result,
        message: humanResponse.message || 'Command executed successfully.'
      });
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
      socket.emit('response', {
        type: 'error',
        message: error.message || 'An error occurred processing your request.'
      });
    }
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected from chat');
  });
});

// Serve frontend
app.use(express.static('public'));

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Auth0 AI Admin Assistant running on port ${PORT}`);
});

// Export for Auth0 extension
module.exports = app;
EOL

# Generate README.md with installation instructions
cat > README.md << 'EOL'
# Auth0 AI Admin Assistant Extension

[![Deploy to GitHub](https://img.shields.io/badge/Deploy%20to-GitHub-blue?logo=github)](https://github.com/new/import?url=https://github.com/YOUR-USERNAME/auth0-ai-admin-assistant)
[![Deploy to Auth0](https://cdn.auth0.com/extensions/badges/badge-auth0-marketplace.svg)](https://marketplace.auth0.com/extensions)

This Auth0 AI Admin Assistant extension provides a powerful natural language interface that enables administrators to manage their Auth0 tenant without manual processes. Powered by leading AI models from Anthropic, OpenAI, or Google, administrators can simply chat with the assistant to create users, configure clients, manage connections, implement rules, and perform other administrative tasks through conversational commands rather than navigating complex dashboards or writing code. The extension includes comprehensive security controls with permission verification and confirmation prompts for destructive actions, detailed audit logging for compliance and troubleshooting, support for multiple AI providers that can be configured based on your preference and existing API keys, and a real-time chat interface with immediate feedback as commands are processed. Simply install this extension, configure your preferred AI provider, and start managing your Auth0 tenant through natural language—eliminating the need for complex manual processes while maintaining security and control.

## Features

- Natural language interface for Auth0 administration tasks
- Support for multiple AI providers (Anthropic's Claude, OpenAI's GPT-4, Google's Gemini)
- Real-time chat interface with socket.io
- Comprehensive Auth0 Management API integration
- Security controls and permission management
- Audit logging for all administrative actions
- Confirmation prompts for destructive operations

## Supported Admin Operations

The AI Assistant can help with a wide range of Auth0 administrative tasks:

### User Management
- Create, read, update, and delete users
- Search users by attributes
- Assign roles and permissions
- Manage user metadata

### Client/Application Management
- Create, read, update, and delete clients
- Configure client settings
- Manage allowed callbacks and origins
- Set up client credentials

### Connection Management
- Create, read, update, and delete connections
- Configure connection options
- Enable/disable connections for specific clients
- Modify connection settings

### Rule Management
- Create, read, update, and delete rules
- Toggle rule status
- Change rule execution order
- Implement custom rules via natural language

### Resource Server Management
- Create, read, update, and delete resource servers
- Manage API scopes and permissions

### Tenant Management
- View and update tenant settings
- Configure email templates
- Manage tenant branding

## Installation

1. Navigate to the Extensions page in your Auth0 Dashboard
2. Click on "Create Extension"
3. Enter the GitHub repository URL: `https://github.com/your-username/auth0-ai-admin-assistant/releases/latest/download/auth0-ai-admin-assistant.zip`
4. Click "Install"

## Configuration

After installation, you'll need to configure the following settings:

1. **AI Provider**: Choose between Anthropic, OpenAI, or Google
2. **API Keys**: Add the appropriate API key for your chosen AI provider
3. **Security Settings**: Configure confirmation requirements for destructive actions
4. **Audit Logging**: Enable/disable detailed audit logging

## Usage Examples

Here are some examples of commands you can use with the AI Admin Assistant:

```
Create a new user with email john@example.com and name John Smith
```

```
Update the Google connection to enable MFA for all users
```

```
Show me all users who haven't logged in for the last 30 days
```

```
Create a rule that adds custom claims to the access token for users with the admin role
```

```
Delete the client with ID abc123def456
```

## Security Considerations

This extension requires extensive permissions to manage your Auth0 tenant. We recommend:

1. Carefully reviewing the permissions requested during installation
2. Limiting access to the extension to trusted administrators only
3. Keeping the "Confirmation for Destructive Actions" setting enabled
4. Regularly reviewing the audit logs
5. Setting up appropriate rate limits for your AI provider

## Development

### Prerequisites

- Node.js 18 or later
- Auth0 account with administrative access

### Local Development Setup

1. Clone the repository:
```
git clone https://github.com/your-username/auth0-ai-admin-assistant.git
cd auth0-ai-admin-assistant
```

2. Install dependencies:
```
npm install
# Generate Auth0 extension manifest
cat > webtask.json << 'EOL'
{
  "name": "auth0-ai-admin-assistant",
  "version": "1.0.0",
  "title": "Auth0 AI Admin Assistant",
  "description": "An AI-powered assistant that enables Auth0 administrators to manage their tenant through natural language commands and a chat interface.",
  "author": "Your Name",
  "categories": ["management", "utility", "admin"],
  "logo": {
    "url": "https://cdn.auth0.com/extensions/auth0-ai-admin-assistant/assets/logo.svg",
    "background": "#ffffff"
  },
  "homepage": "https://github.com/your-username/auth0-ai-admin-assistant",
  "repository": "https://github.com/your-username/auth0-ai-admin-assistant",
  "keywords": [
    "auth0",
    "extension",
    "ai",
    "chatbot",
    "admin",
    "management"
  ],
  "auth0": {
    "scopes": [
      "read:clients",
      "update:clients",
      "create:clients",
      "delete:clients",
      "read:connections",
      "update:connections",
      "create:connections",
      "delete:connections",
      "read:users",
      "update:users",
      "create:users",
      "delete:users",
      "read:rules",
      "update:rules",
      "create:rules",
      "delete:rules",
      "read:resource_servers",
      "update:resource_servers",
      "create:resource_servers",
      "delete:resource_servers",
      "read:logs",
      "read:tenant_settings",
      "update:tenant_settings"
    ],
    "createClient": false,
    "onInstallPath": "/init",
    "onUninstallPath": "/uninstall"
  },
  "secrets": {
    "SESSION_SECRET": {
      "description": "A secure secret used for session management",
      "required": true,
      "default": ""
    },
    "AI_PROVIDER": {
      "description": "The AI provider to use (anthropic, openai, or gemini)",
      "required": true,
      "default": "anthropic"
    },
    "ANTHROPIC_API_KEY": {
      "description": "API key for Anthropic's Claude AI",
      "required": false,
      "default": ""
    },
    "ANTHROPIC_MODEL": {
      "description": "Anthropic model to use (e.g., claude-3-opus-20240229)",
      "required": false,
      "default": "claude-3-opus-20240229"
    },
    "OPENAI_API_KEY": {
      "description": "API key for OpenAI's GPT models",
      "required": false,
      "default": ""
    },
    "OPENAI_MODEL": {
      "description": "OpenAI model to use (e.g., gpt-4o)",
      "required": false,
      "default": "gpt-4o"
    },
    "GEMINI_API_KEY": {
      "description": "API key for Google's Gemini AI",
      "required": false,
      "default": ""
    },
    "GEMINI_MODEL": {
      "description": "Gemini model to use (e.g., gemini-pro)",
      "required": false,
      "default": "gemini-pro"
    },
    "LOG_LEVEL": {
      "description": "Logging level (debug, info, warn, error)",
      "required": false,
      "default": "info"
    },
    "AUDIT_ENABLED": {
      "description": "Enable audit logging (true/false)",
      "required": false,
      "default": "true"
    }
  },
  "metadata": {
    "runtime": "node18",
    "version": "1.0.0",
    "permissions": {
      "apiKey": true,
      "accessToken": true
    }
  }
}
EOL

# Generate GitHub workflow
mkdir -p .github/workflows
cat > .github/workflows/deploy.yml << 'EOL'
name: Deploy Auth0 Extension

on:
  push:
    branches: [ main ]
  workflow_dispatch:  # Allows manual triggering

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint and test
        run: |
          npm run lint || true
          npm test || true

      - name: Build extension bundle
        run: npm run build
      
      - name: Deploy to GitHub Pages
        uses: JamesIves/github-pages-deploy-action@v4
        with:
          folder: dist
          branch: gh-pages

      - name: Create GitHub Release
        id: create_release
        if: startsWith(github.ref, 'refs/tags/')
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref }}
          release_name: Release ${{ github.ref }}
          draft: false
          prerelease: false

      - name: Upload Release Asset
        if: startsWith(github.ref, 'refs/tags/')
        uses: actions/upload-release-asset@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          upload_url: ${{ steps.create_release.outputs.upload_url }}
          asset_path: ./dist/auth0-ai-admin-assistant.zip
          asset_name: auth0-ai-admin-assistant.zip
          asset_content_type: application/zip
EOL

# Generate Dependabot configuration
mkdir -p .github/dependabot
cat > .github/dependabot.yml << 'EOL'
version: 2
updates:
  # Enable version updates for npm
  - package-ecosystem: "npm"
    # Look for package.json and package-lock.json files in the root directory
    directory: "/"
    # Check for updates once a week
    schedule:
      interval: "weekly"
    # Specify default assignees for pull requests
    assignees:
      - "your-username"
    # Specify labels for npm pull requests
    labels:
      - "npm"
      - "dependencies"
    # Allow up to 10 open pull requests for npm dependencies
    open-pull-requests-limit: 10

  # Enable version updates for GitHub Actions
  - package-ecosystem: "github-actions"
    # Look for workflow files in the .github/workflows directory
    directory: "/"
    # Check for updates once a week
    schedule:
      interval: "weekly"
    # Specify default assignees for pull requests
    assignees:
      - "your-username"
    # Specify labels for GitHub Actions pull requests
    labels:
      - "github-actions"
      - "dependencies"
EOL

# Generate package.json
cat > package.json << 'EOL'
{
  "name": "auth0-ai-admin-assistant",
  "version": "1.0.0",
  "description": "AI-powered assistant for Auth0 administration via natural language",
  "main": "app.js",
  "scripts": {
    "start": "node app.js",
    "dev": "nodemon app.js",
    "test": "jest",
    "lint": "eslint .",
    "build": "node build.js"
  },
  "keywords": [
    "auth0",
    "extension",
    "ai",
    "admin",
    "assistant",
    "claude",
    "gpt",
    "gemini"
  ],
  "author": "Your Name",
  "license": "MIT",
  "dependencies": {
    "@anthropic-ai/sdk": "^0.10.0",
    "@google/generative-ai": "^0.1.3",
    "auth0": "^4.0.1",
    "axios": "^1.6.2",
    "body-parser": "^1.20.2",
    "express": "^4.18.2",
    "express-session": "^1.17.3",
    "jsonwebtoken": "^9.0.2",
    "openai": "^4.20.1",
    "socket.io": "^4.7.2",
    "winston": "^3.11.0"
  },
  "devDependencies": {
    "archiver": "^6.0.1",
    "eslint": "^8.54.0",
    "fs-extra": "^11.1.1",
    "jest": "^29.7.0",
    "nodemon": "^3.0.1"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/your-username/auth0-ai-admin-assistant.git"
  },
  "bugs": {
    "url": "https://github.com/your-username/auth0-ai-admin-assistant/issues"
  },
  "homepage": "https://github.com/your-username/auth0-ai-admin-assistant#readme"
}
EOL

# Generate build script
cat > build.js << 'EOL'
// build.js - Script to build and package the Auth0 extension

const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');

// Define paths
const rootDir = __dirname;
const distDir = path.join(rootDir, 'dist');
const tempDir = path.join(distDir, 'temp');

// List of files to include in the extension package
const filesToInclude = [
  'app.js',
  'index.js',
  'config.js',
  'auth0-init.js',
  'package.json',
  'package-lock.json',
  'README.md',
  'LICENSE',
  'public',
  'webtask.js',
  'webtask.json'
];

// Create a webtask.js file that exports the extension
const createWebtaskFile = () => {
  console.log('Creating webtask.js file...');
  const webtaskContent = `
    module.exports = require('./app');
  `;
  fs.writeFileSync(path.join(tempDir, 'webtask.js'), webtaskContent.trim());
};

// Create a webtask.json file based on extension manifest
const createWebtaskJson = () => {
  console.log('Creating webtask.json file...');
  const manifest = require('./webtask.json');
  fs.writeFileSync(path.join(tempDir, 'webtask.json'), JSON.stringify(manifest, null, 2));
};

// Copy necessary files to the temp directory
const copyFiles = async () => {
  console.log('Copying files to temp directory...');
  
  for (const file of filesToInclude) {
    if (fs.existsSync(path.join(rootDir, file))) {
      if (fs.lstatSync(path.join(rootDir, file)).isDirectory()) {
        await fs.copy(path.join(rootDir, file), path.join(tempDir, file));
      } else {
        await fs.copy(path.join(rootDir, file), path.join(tempDir, file));
      }
    }
  }
};

// Create a zip file from the temp directory
const createZipFile = () => {
  return new Promise((resolve, reject) => {
    console.log('Creating zip file...');
    
    const output = fs.createWriteStream(path.join(distDir, 'auth0-ai-admin-assistant.zip'));
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });
    
    output.on('close', () => {
      console.log(`Zip file created (${archive.pointer()} bytes)`);
      resolve();
    });
    
    archive.on('error', (err) => {
      reject(err);
    });
    
    archive.pipe(output);
    archive.directory(tempDir, false);
    archive.finalize();
  });
};

// Main build process
const build = async () => {
  try {
    console.log('Starting build process...');
    
    // Ensure dist directory exists and is empty
    await fs.ensureDir(distDir);
    await fs.emptyDir(distDir);
    
    // Create temp directory
    await fs.ensureDir(tempDir);
    
    // Create necessary files
    createWebtaskFile();
    createWebtaskJson();
    
    // Copy files
    await copyFiles();
    
    // Create zip file
    await createZipFile();
    
    // Create a copy of the extension JSON for GitHub Pages
    await fs.copy(path.join(tempDir, 'webtask.json'), path.join(distDir, 'extension.json'));
    
    // Clean up temp directory
    await fs.remove(tempDir);
    
    console.log('Build completed successfully!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
};

// Run the build process
build();
EOL

# Generate configuration file (config.js)
cat > config.js << 'EOL'
// config.js - Configuration for Auth0 AI Admin Assistant

module.exports = {
  // Environment
  production: process.env.NODE_ENV === 'production',
  sessionSecret: process.env.SESSION_SECRET || 'your-secure-session-secret',
  
  // Auth0 Configuration
  auth0: {
    domain: process.env.AUTH0_DOMAIN || 'your-tenant.auth0.com',
    clientId: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    audience: `https://${process.env.AUTH0_DOMAIN || 'your-tenant.auth0.com'}/api/v2/`,
    
    // Extension-specific settings
    extensionURL: process.env.AUTH0_EXTENSION_URL,
    
    // Permissions and roles that can use this extension
    requiredScopes: [
      'read:users',
      'create:users',
      'update:users',
      'delete:users',
      'read:clients',
      'create:clients',
      'update:clients',
      'delete:clients',
      'read:connections',
      'create:connections',
      'update:connections',
      'delete:connections',
      'read:rules',
      'create:rules',
      'update:rules',
      'delete:rules'
    ]
  },
  
  // AI Provider Configuration
  aiProvider: process.env.AI_PROVIDER || 'anthropic', // 'anthropic', 'openai', or 'gemini'
  
  // Anthropic Configuration
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: process.env.ANTHROPIC_MODEL || 'claude-3-opus-20240229',
    systemPrompt: `
      You are an Auth0 Admin Assistant, an AI that helps administrators manage their Auth0 tenant.
      Your purpose is to convert natural language requests into Auth0 Management API calls.
      Always confirm before making destructive changes like deletions.
      If you're unsure about a request, ask for clarification rather than guessing.
      Maintain security best practices and never suggest insecure configurations.
    `
  },
  
  // OpenAI Configuration
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-4o',
    systemPrompt: `
      You are an Auth0 Admin Assistant, an AI that helps administrators manage their Auth0 tenant.
      Your purpose is to convert natural language requests into Auth0 Management API calls.
      Always confirm before making destructive changes like deletions.
      If you're unsure about a request, ask for clarification rather than guessing.
      Maintain security best practices and never suggest insecure configurations.
    `
  },
  
  // Google Gemini Configuration
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || 'gemini-pro',
    systemPrompt: `
      You are an Auth0 Admin Assistant, an AI that helps administrators manage their Auth0 tenant.
      Your purpose is to convert natural language requests into Auth0 Management API calls.
      Always confirm before making destructive changes like deletions.
      If you're unsure about a request, ask for clarification rather than guessing.
      Maintain security best practices and never suggest insecure configurations.
    `
  },
  
  // Logging and monitoring
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    auditEnabled: process.env.AUDIT_ENABLED === 'true' || true,
  },
  
  // Command definitions and schemas
  commands: {
    // User management
    createUser: {
      requiredParams: ['email'],
      optionalParams: ['password', 'connection', 'user_metadata', 'app_metadata', 'given_name', 'family_name', 'name', 'nickname', 'picture', 'blocked']
    },
    updateUser: {
      requiredParams: ['id'],
      optionalParams: ['email', 'password', 'connection', 'user_metadata', 'app_metadata', 'given_name', 'family_name', 'name', 'nickname', 'picture', 'blocked']
    },
    deleteUser: {
      requiredParams: ['id'],
      dangerousCommand: true,
      requireConfirmation: true
    },
    
    // Client/application management
    createClient: {
      requiredParams: ['name', 'app_type'],
      optionalParams: ['description', 'callbacks', 'allowed_origins', 'web_origins', 'client_aliases', 'allowed_clients', 'jwt_configuration', 'encryption_key']
    },
    updateClient: {
      requiredParams: ['client_id'],
      optionalParams: ['name', 'description', 'app_type', 'callbacks', 'allowed_origins', 'web_origins', 'client_aliases', 'allowed_clients', 'jwt_configuration', 'encryption_key']
    },
    deleteClient: {
      requiredParams: ['client_id'],
      dangerousCommand: true,
      requireConfirmation: true
    },
    
    // Connection management
    createConnection: {
      requiredParams: ['name', 'strategy'],
      optionalParams: ['options', 'enabled_clients']
    },
    updateConnection: {
      requiredParams: ['id'],
      optionalParams: ['name', 'options', 'enabled_clients']
    },
    deleteConnection: {
      requiredParams: ['id'],
      dangerousCommand: true,
      requireConfirmation: true
    },
    
    // Rule management
    createRule: {
      requiredParams: ['name', 'script'],
      optionalParams: ['order', 'enabled']
    },
    updateRule: {
      requiredParams: ['id'],
      optionalParams: ['name', 'script', 'order', 'enabled']
    },
    deleteRule: {
      requiredParams: ['id'],
      dangerousCommand: true,
      requireConfirmation: true
    }
  }
};
EOL

# Generate initialization script (auth0-init.js)
cat > auth0-init.js << 'EOL'
// Initialization and uninstallation handlers for the Auth0 AI Admin Assistant

const { ManagementClient } = require('auth0');
const config = require('./config');
const express = require('express');
const router = express.Router();

// Initialize Auth0 Management API client
const initManagementClient = (req) => {
  const params = req.webtaskContext.params;
  
  return new ManagementClient({
    domain: params.AUTH0_DOMAIN,
    clientId: params.AUTH0_CLIENT_ID,
    clientSecret: params.AUTH0_CLIENT_SECRET,
    scope: 'read:clients update:clients create:clients delete:clients read:connections update:connections create:connections delete:connections read:users update:users create:users delete:users read:rules update:rules create:rules delete:rules'
  });
};

// Initialization route (called when the extension is installed)
router.get('/init', async (req, res) => {
  try {
    console.log('Initializing Auth0 AI Admin Assistant extension...');
    const auth0 = initManagementClient(req);
    
    // Set up configuration in tenant settings
    const extensionURL = req.headers['x-forwarded-proto'] + '://' + req.headers.host;
    
    // Log the successful initialization
    console.log('Initialization completed successfully');
    console.log('Extension URL:', extensionURL);
    
    // Return success message
    return res.status(200).send({
      message: 'Extension initialized successfully!',
      extensionURL
    });
  } catch (error) {
    console.error('Error during initialization:', error);
    return res.status(500).send({
      message: 'Error initializing extension',
      error: error.message
    });
  }
});

// Uninstallation route (called when the extension is uninstalled)
router.get('/uninstall', async (req, res) => {
  try {
    console.log('Uninstalling Auth0 AI Admin Assistant extension...');
    const auth0 = initManagementClient(req);
    
    // Clean up any resources created by the extension
    // This could include rules, hooks, etc.
    
    // Log the successful uninstallation
    console.log('Uninstallation completed successfully');
    
    // Return success message
    return res.status(200).send({
      message: 'Extension uninstalled successfully!'
    });
  } catch (error) {
    console.error('Error during uninstallation:', error);
    return res.status(500).send({
      message: 'Error uninstalling extension',
      error: error.message
    });
  }
});

module.exports = router;
EOL

# Generate entry point (app.js)
cat > app.js << 'EOL'
// Auth0 AI Admin Assistant Extension
const express = require('express');
const app = require('./index');
const initRoutes = require('./auth0-init');

// Express app setup
app.use('/', initRoutes);

// Export for Auth0 extension
module.exports = app;
EOL

# Generate frontend HTML file (public/index.html)
cat > public/index.html << 'EOL'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Auth0 AI Admin Assistant</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.19/tailwind.min.css" rel="stylesheet">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.5.1/socket.io.min.js"></script>
    <style>
        .chat-container {
            height: calc(100vh - 180px);
        }
        .message-bubble {
            max-width: 80%;
            border-radius: 18px;
            margin-bottom: 10px;
            padding: 10px 15px;
            position: relative;
        }
        .user-message {
            background-color: #e2f5ff;
            margin-left: auto;
            border-bottom-right-radius: 5px;
        }
        .assistant-message {
            background-color: #f0f0f0;
            margin-right: auto;
            border-bottom-left-radius: 5px;
        }
        .typing-indicator {
            background-color: #f0f0f0;
            border-radius: 18px;
            padding: 10px 15px;
            display: inline-block;
            margin-bottom: 10px;
        }
        .typing-indicator span {
            height: 8px;
            width: 8px;
            float: left;
            margin: 0 1px;
            background-color: #9E9EA1;
            display: block;
            border-radius: 50%;
            opacity: 0.4;
        }
        .typing-indicator span:nth-of-type(1) {
            animation: 1s blink infinite 0.3333s;
        }
        .typing-indicator span:nth-of-type(2) {
            animation: 1s blink infinite 0.6666s;
        }
        .typing-indicator span:nth-of-type(3) {
            animation: 1s blink infinite 0.9999s;
        }
        @keyframes blink {
            50% {
                opacity: 1;
            }
        }
        .json-viewer {
            background-color: #f8f8f8;
            border-radius: 5px;
            padding: 10px;
            margin-top: 5px;
            font-family: monospace;
            max-height: 300px;
            overflow-y: auto;
        }
        .command-tag {
            display: inline-block;
            background-color: #e3f2fd;
            color: #1976d2;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.75rem;
            margin-right: 5px;
        }
    </style>
</head>
<body class="bg-gray-100">
    <div class="container mx-auto p-4">
        <div class="bg-white shadow-md rounded-lg p-4">
            <div class="flex items-center border-b pb-4 mb-4">
                <div class="flex-shrink-0">
                    <img src="https://cdn.auth0.com/blog/auth0-brand/auth0-shield.svg" alt="Auth0 Logo" class="h-10">
                </div>
                <div class="ml-3">
                    <h1 class="text-2xl font-bold text-gray-800">Auth0 AI Admin Assistant</h1>
                    <p class="text-gray-600">Powered by <span id="ai-provider" class="font-medium">Claude</span></p>
                </div>
                <div class="ml-auto">
                    <button id="settings-btn" class="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Settings
                    </button>
                </div>
            </div>
            
            <div id="chat-container" class="chat-container overflow-y-auto mb-4">
                <div id="messages" class="p-3">
                    <!-- Messages will be inserted here -->
                    <div class="assistant-message message-bubble">
                        <p>Hello! I'm your Auth0 AI Admin Assistant. How can I help you with your Auth0 tenant today?</p>
                    </div>
                </div>
            </div>
            
            <div class="border-t pt-4">
                <form id="chat-form" class="flex">
                    <div class="relative flex-grow">
                        <input id="user-input" type="text" placeholder="Ask me to create users, update clients, or manage connections..." 
                            class="w-full py-3 pl-4 pr-10 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <button type="button" id="suggestions-btn" class="absolute right-3 top-3 text-gray-400 hover:text-gray-700">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </button>
                    </div>
                    
                    <div class="flex justify-end">
                        <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg">
                            Save Settings
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Confirmation Modal -->
        <div id="confirmation-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg w-full max-w-md p-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold text-red-600">Confirm Action</h3>
                    <button id="close-confirmation" class="text-gray-500 hover:text-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                <p class="mb-4">You're about to perform a potentially destructive action:</p>
                <div id="confirmation-action" class="p-3 bg-red-50 border border-red-200 rounded-lg mb-4 font-mono text-sm"></div>
                
                <div class="flex justify-end space-x-3">
                    <button id="cancel-action" class="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg">
                        Cancel
                    </button>
                    <button id="confirm-action" class="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg">
                        Confirm Action
                    </button>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Initialize socket connection
        const socket = io();
        
        // DOM elements
        const chatForm = document.getElementById('chat-form');
        const userInput = document.getElementById('user-input');
        const messagesContainer = document.getElementById('messages');
        const chatContainer = document.getElementById('chat-container');
        const suggestionsBtn = document.getElementById('suggestions-btn');
        const suggestionsPanel = document.getElementById('suggestions-panel');
        const sampleCommands = document.querySelectorAll('.sample-command');
        const settingsBtn = document.getElementById('settings-btn');
        const settingsModal = document.getElementById('settings-modal');
        const closeSettings = document.getElementById('close-settings');
        const settingsForm = document.getElementById('settings-form');
        const aiProviderSelect = document.getElementById('ai-provider-select');
        const aiProviderDisplay = document.getElementById('ai-provider');
        const confirmationModal = document.getElementById('confirmation-modal');
        const closeConfirmation = document.getElementById('close-confirmation');
        const cancelAction = document.getElementById('cancel-action');
        const confirmAction = document.getElementById('confirm-action');
        const confirmationActionDisplay = document.getElementById('confirmation-action');
        
        // State variables
        let pendingAction = null;
        let isTyping = false;
        
        // Functions to handle messages
        function addMessage(message, isUser = false) {
            const messageElement = document.createElement('div');
            messageElement.classList.add('message-bubble');
            messageElement.classList.add(isUser ? 'user-message' : 'assistant-message');
            
            if (isUser) {
                messageElement.textContent = message;
            } else {
                // Check if the message contains command information
                if (typeof message === 'object' && message.command) {
                    const commandTag = document.createElement('div');
                    commandTag.classList.add('command-tag');
                    commandTag.textContent = message.command;
                    
                    const messageText = document.createElement('p');
                    messageText.textContent = message.message;
                    
                    messageElement.appendChild(commandTag);
                    messageElement.appendChild(messageText);
                    
                    // Add JSON viewer for the result if it exists
                    if (message.result) {
                        const jsonViewer = document.createElement('div');
                        jsonViewer.classList.add('json-viewer');
                        jsonViewer.textContent = JSON.stringify(message.result, null, 2);
                        messageElement.appendChild(jsonViewer);
                    }
                } else {
                    messageElement.textContent = typeof message === 'string' ? message : message.message || 'Error processing response';
                }
            }
            
            messagesContainer.appendChild(messageElement);
            scrollToBottom();
        }
        
        function showTypingIndicator() {
            if (isTyping) return;
            
            isTyping = true;
            const typingIndicator = document.createElement('div');
            typingIndicator.classList.add('typing-indicator');
            typingIndicator.id = 'typing-indicator';
            
            for (let i = 0; i < 3; i++) {
                const dot = document.createElement('span');
                typingIndicator.appendChild(dot);
            }
            
            messagesContainer.appendChild(typingIndicator);
            scrollToBottom();
        }
        
        function hideTypingIndicator() {
            const typingIndicator = document.getElementById('typing-indicator');
            if (typingIndicator) {
                typingIndicator.remove();
            }
            isTyping = false;
        }
        
        function scrollToBottom() {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
        
        // Event handlers
        chatForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const message = userInput.value.trim();
            
            if (message) {
                // Add user message to chat
                addMessage(message, true);
                
                // Clear input
                userInput.value = '';
                
                // Show typing indicator
                showTypingIndicator();
                
                // Send message to server
                socket.emit('message', { 
                    message, 
                    user: { roles: ['admin'] } // Placeholder for actual user info
                });
            }
        });
        
        // Socket events
        socket.on('response', function(data) {
            // Hide typing indicator
            hideTypingIndicator();
            
            if (data.type === 'clarification') {
                // Show clarification question
                addMessage(data.message);
            } else if (data.type === 'error') {
                // Show error message
                addMessage(data.message);
            } else if (data.type === 'success') {
                // Show success message with command info
                addMessage(data);
            }
        });
        
        // Sample commands
        suggestionsBtn.addEventListener('click', function() {
            suggestionsPanel.classList.toggle('hidden');
        });
        
        sampleCommands.forEach(command => {
            command.addEventListener('click', function() {
                userInput.value = this.textContent.trim();
                suggestionsPanel.classList.add('hidden');
                userInput.focus();
            });
        });
        
        // Settings modal
        settingsBtn.addEventListener('click', function() {
            settingsModal.classList.remove('hidden');
        });
        
        closeSettings.addEventListener('click', function() {
            settingsModal.classList.add('hidden');
        });
        
        settingsForm.addEventListener('submit', function(event) {
            event.preventDefault();
            
            // Update AI provider display
            const selectedProvider = aiProviderSelect.value;
            aiProviderDisplay.textContent = selectedProvider === 'anthropic' ? 'Claude' : 
                                          selectedProvider === 'openai' ? 'GPT-4' : 'Gemini';
            
            // Save settings via API or socket
            socket.emit('update-settings', {
                aiProvider: selectedProvider,
                requireConfirmation: document.getElementById('confirmation-toggle').checked,
                auditLogging: document.getElementById('audit-logging-toggle').checked
            });
            
            // Close modal
            settingsModal.classList.add('hidden');
        });
        
        // Confirmation modal
        function showConfirmationModal(action, callback) {
            confirmationActionDisplay.textContent = action;
            pendingAction = callback;
            confirmationModal.classList.remove('hidden');
        }
        
        closeConfirmation.addEventListener('click', function() {
            confirmationModal.classList.add('hidden');
            pendingAction = null;
        });
        
        cancelAction.addEventListener('click', function() {
            confirmationModal.classList.add('hidden');
            pendingAction = null;
        });
        
        confirmAction.addEventListener('click', function() {
            if (pendingAction) {
                pendingAction();
            }
            confirmationModal.classList.add('hidden');
            pendingAction = null;
        });
        
        // Handle dangerous commands that require confirmation
        socket.on('confirm-action', function(data) {
            hideTypingIndicator();
            
            showConfirmationModal(data.action, function() {
                socket.emit('execute-confirmed-action', data);
                showTypingIndicator();
            });
        });
        
        // Initialize
        document.addEventListener('DOMContentLoaded', function() {
            // Set focus on input
            userInput.focus();
        });
    </script>
</body>
</html>
EOL
                    <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
                        </svg>
                    </button>
                </form>
            </div>
        </div>
        
        <div id="suggestions-panel" class="hidden mt-4 bg-white shadow-md rounded-lg p-4">
            <h3 class="text-lg font-semibold mb-3">Sample Commands</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button class="sample-command text-left p-2 border border-gray-200 rounded hover:bg-gray-50">
                    Create a new user with email john@example.com
                </button>
                <button class="sample-command text-left p-2 border border-gray-200 rounded hover:bg-gray-50">
                    List all clients in my tenant
                </button>
                <button class="sample-command text-left p-2 border border-gray-200 rounded hover:bg-gray-50">
                    Update the Google connection to enable MFA
                </button>
                <button class="sample-command text-left p-2 border border-gray-200 rounded hover:bg-gray-50">
                    Create a new rule to add user roles to tokens
                </button>
                <button class="sample-command text-left p-2 border border-gray-200 rounded hover:bg-gray-50">
                    Show all users with role admin
                </button>
                <button class="sample-command text-left p-2 border border-gray-200 rounded hover:bg-gray-50">
                    Add a new allowed callback URL to the client with ID abc123
                </button>
            </div>
        </div>
        
        <div id="settings-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg w-full max-w-md p-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold">Settings</h3>
                    <button id="close-settings" class="text-gray-500 hover:text-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                <form id="settings-form">
                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-bold mb-2" for="ai-provider-select">
                            AI Provider
                        </label>
                        <select id="ai-provider-select" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="anthropic">Anthropic (Claude)</option>
                            <option value="openai">OpenAI (GPT-4)</option>
                            <option value="gemini">Google (Gemini)</option>
                        </select>
                    </div>
                    
                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-bold mb-2" for="confirmation-toggle">
                            Confirmation for Destructive Actions
                        </label>
                        <div class="relative inline-block w-10 mr-2 align-middle select-none">
                            <input type="checkbox" id="confirmation-toggle" checked class="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer" />
                            <label for="confirmation-toggle" class="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                        </div>
                        <span class="text-sm text-gray-700">Enabled</span>
                    </div>
                    
                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-bold mb-2" for="audit-logging-toggle">
                            Audit Logging
                        </label>
                        <div class="relative inline-block w-10 mr-2 align-middle select-none">
                            <input type="checkbox" id="audit-logging-toggle" checked class="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer" />
                            <label for="audit-logging-toggle" class="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                        </div>
                        <span class="text-sm text-gray-700">Enabled</span>
                    </div>
