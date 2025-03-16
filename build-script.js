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
  'index.js',
  'config.js',
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
    module.exports = require('./index');
  `;
  fs.writeFileSync(path.join(tempDir, 'webtask.js'), webtaskContent.trim());
};

// Create a webtask.json file based on extension manifest
const createWebtaskJson = () => {
  console.log('Creating webtask.json file...');
  const manifest = require('./auth0-manifest.json');
  fs.writeFileSync(path.join(tempDir, 'webtask.json'), JSON.stringify(manifest, null, 2));
};

// Create an index.js file that serves as the entry point
const createIndexFile = () => {
  console.log('Creating index.js file...');
  const indexContent = `
    // Auth0 AI Admin Assistant Extension
    const express = require('express');
    const app = require('./auth0-ai-admin');
    const initRoutes = require('./auth0-init');

    // Express app setup
    app.use('/', initRoutes);

    // Export for Auth0 extension
    module.exports = app;
  `;
  fs.writeFileSync(path.join(tempDir, 'index.js'), indexContent.trim());
};

// Copy necessary files to the temp directory
const copyFiles = async () => {
  console.log('Copying files to temp directory...');
  
  // Create public directory and copy frontend files
  await fs.ensureDir(path.join(tempDir, 'public'));
  
  // Create index.html file in public directory
  const frontendContent = fs.readFileSync(path.join(rootDir, 'auth0-frontend.html'), 'utf8');
  await fs.writeFile(path.join(tempDir, 'public', 'index.html'), frontendContent);
  
  // Copy the main files
  await fs.copy(path.join(rootDir, 'auth0-ai-admin.js'), path.join(tempDir, 'auth0-ai-admin.js'));
  await fs.copy(path.join(rootDir, 'auth0-config.js'), path.join(tempDir, 'config.js'));
  await fs.copy(path.join(rootDir, 'auth0-init.js'), path.join(tempDir, 'auth0-init.js'));
  await fs.copy(path.join(rootDir, 'package.json'), path.join(tempDir, 'package.json'));
  await fs.copy(path.join(rootDir, 'README.md'), path.join(tempDir, 'README.md'));
  
  // Create a simple LICENSE file if it doesn't exist
  if (!fs.existsSync(path.join(rootDir, 'LICENSE'))) {
    const licenseContent = `MIT License

Copyright (c) ${new Date().getFullYear()} Your Name

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`;
    await fs.writeFile(path.join(tempDir, 'LICENSE'), licenseContent);
  } else {
    await fs.copy(path.join(rootDir, 'LICENSE'), path.join(tempDir, 'LICENSE'));
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
    createIndexFile();
    
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
