# Auth0 AI Admin Assistant Extension

An AI-powered chatbot extension for Auth0 that enables administrators to manage their Auth0 tenant through natural language commands.

[![Deploy to GitHub](https://img.shields.io/badge/Deploy%20to-GitHub-blue?logo=github)](https://github.com/new/import?url=https://github.com/YOUR-USERNAME/auth0-ai-admin-assistant)
[![Deploy to Auth0](https://cdn.auth0.com/extensions/badges/badge-auth0-marketplace.svg)](https://marketplace.auth0.com/extensions)

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
3. Enter the GitHub repository URL: `https://github.com/your-username/auth0-ai-admin-assistant`
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
```

3. Create a `.env` file with your configuration:
```
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=your-anthropic-key
```

4. Start the development server:
```
npm run dev
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Disclaimer

This extension provides powerful access to manage your Auth0 tenant. Use with caution and ensure only authorized administrators have access to the extension. Double-check all actions before confirming, especially destructive operations like deletions.
