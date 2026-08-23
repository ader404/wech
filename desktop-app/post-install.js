const { app } = require('electron');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Post-install script to ensure backend and frontend dependencies are installed
function postInstall() {
  if (!app.isPackaged) {
    console.log('Running in development mode, skipping post-install');
    return;
  }

  const backendPath = path.join(process.resourcesPath, 'backend');
  const frontendPath = path.join(process.resourcesPath, 'frontend');

  console.log('Post-install: Checking dependencies...');

  // Check if node_modules exist in backend
  if (!fs.existsSync(path.join(backendPath, 'node_modules'))) {
    console.log('Installing backend dependencies...');
    try {
      execSync('npm install --production', {
        cwd: backendPath,
        stdio: 'inherit',
        shell: true
      });
    } catch (error) {
      console.error('Failed to install backend dependencies:', error);
    }
  }

  // Check if node_modules exist in frontend
  if (!fs.existsSync(path.join(frontendPath, 'node_modules'))) {
    console.log('Installing frontend dependencies...');
    try {
      execSync('npm install --production', {
        cwd: frontendPath,
        stdio: 'inherit',
        shell: true
      });
    } catch (error) {
      console.error('Failed to install frontend dependencies:', error);
    }
  }

  console.log('Post-install complete');
}

module.exports = { postInstall };
