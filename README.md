# auth0-ai-admin-assistant
auth0-ai-admin-assistant
# Guide to Posting Your Auth0 AI Admin Assistant on GitHub

Here's a step-by-step guide to get your Auth0 AI Admin Assistant up and running on GitHub:

## Prerequisites

1. Make sure you have Git installed on your computer
2. Have a GitHub account
3. Install GitHub CLI (optional but recommended for easier setup)

## Method 1: Using the Setup Script (Recommended)

The setup script I created automates the entire process:

1. **Save all files to your local machine**
   - Create a new folder on your computer
   - Save all the code artifacts we created into this folder

2. **Make the setup script executable**
   ```bash
   chmod +x setup-script.sh
   ```

3. **Run the setup script**
   ```bash
   ./setup-script.sh
   ```

4. **Follow the prompts**
   - Enter your GitHub username when asked
   - Provide a repository name (or accept the default)
   - Add a description (or accept the default)
   - Choose public or private repository

5. **Wait for completion**
   - The script will create the repository
   - Push all the files
   - Set up GitHub Pages
   - Create an initial release

## Method 2: Manual Setup

If you prefer to set things up manually or the setup script doesn't work for you:

1. **Create a new repository on GitHub**
   - Go to https://github.com/new
   - Name it "auth0-ai-admin-assistant" (or your preferred name)
   - Add a description
   - Make it public or private as desired
   - Initialize with a README
   - Click "Create repository"

2. **Clone the repository to your local machine**
   ```bash
   git clone https://github.com/YOUR-USERNAME/auth0-ai-admin-assistant.git
   cd auth0-ai-admin-assistant
   ```

3. **Create the necessary folder structure**
   ```bash
   mkdir -p public
   mkdir -p .github/workflows
   mkdir -p .github/dependabot
   ```

4. **Add all the files we created**
   - Save the main extension code as `index.js`
   - Save the configuration as `config.js`
   - Save the frontend HTML in `public/index.html`
   - Save the init script as `auth0-init.js`
   - Save the build script as `build.js`
   - Save the package.json file
   - Save the workflow file as `.github/workflows/deploy.yml`
   - Save the dependabot config as `.github/dependabot.yml`
   - Save the README.md file

5. **Commit and push the changes**
   ```bash
   git add .
   git commit -m "Initial commit: Auth0 AI Admin Assistant extension"
   git push -u origin main
   ```

6. **Enable GitHub Pages**
   - Go to repository Settings > Pages
   - Set source branch to "gh-pages"
   - Save the changes

7. **Create an initial release**
   - Go to repository > Releases > Create a new release
   - Set tag version to "v1.0.0"
   - Add a title like "Initial Release"
   - Add release notes
   - Publish the release

## After Setup

Once your repository is set up:

1. **GitHub Actions will run automatically**
   - It builds your extension
   - Deploys to GitHub Pages
   - Creates the extension package

2. **Your extension will be available at**:
   ```
   https://github.com/YOUR-USERNAME/auth0-ai-admin-assistant/releases/latest/download/auth0-ai-admin-assistant.zip
   ```

3. **To install in Auth0**:
   - Go to Auth0 Dashboard > Extensions
   - Click "Create Extension"
   - Enter your extension URL (from step 2)
   - Complete the installation

## Customization

To customize your extension:

1. **Update the auth0-manifest.json file** with your details
2. **Modify the AI provider settings** in config.js
3. **Customize the frontend** to match your branding
4. **Update the README.md** with specific installation instructions

## Sharing with Others

To make it easy for others to use your extension:

1. **Update the README badges** with your repository URL
2. **Share the GitHub repository URL** with other Auth0 users
3. **Provide the direct installation URL** for Auth0

Let me know if you need any clarification or encounter any issues during the setup process!
