# PowerShell script to push changes to GitHub
# This script assumes Git is installed. If not, you'll need to install Git first.

param(
    [string]$GitHubUsername = "JinalChoudhari",
    [string]$RepositoryName = "process-guide"
)

Write-Host "Setting up Git repository and pushing to GitHub..." -ForegroundColor Green

# Check if Git is available
try {
    $gitVersion = & git --version 2>$null
    if ($gitVersion) {
        Write-Host "Git found: $gitVersion" -ForegroundColor Green
    } else {
        Write-Host "Git not found. Please install Git first." -ForegroundColor Red
        Write-Host "Download Git from: https://git-scm.com/download/win" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "Git not found. Please install Git first." -ForegroundColor Red
    Write-Host "Download Git from: https://git-scm.com/download/win" -ForegroundColor Yellow
    exit 1
}

# Initialize git repository if not already initialized
if (-not (Test-Path .git)) {
    Write-Host "Initializing Git repository..." -ForegroundColor Yellow
    git init
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to initialize Git repository"
        exit 1
    }
}

# Configure Git user (optional - you can do this manually)
# git config --global user.name "Your Name"
# git config --global user.email "your.email@example.com"

# Add all files
Write-Host "Adding files to repository..." -ForegroundColor Yellow
git add .
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to add files"
    exit 1
}

# Check if there are changes to commit
$gitStatus = git status --porcelain
if ([string]::IsNullOrEmpty($gitStatus)) {
    Write-Host "No changes to commit" -ForegroundColor Yellow
    exit 0
}

# Commit changes
Write-Host "Committing changes..." -ForegroundColor Yellow
git commit -m "Initial commit: Process Guide System with database persistence"
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to commit changes"
    exit 1
}

# Add remote origin (replace with your GitHub repository URL)
$remoteUrl = "https://github.com/$GitHubUsername/$RepositoryName.git"
Write-Host "Adding remote origin: $remoteUrl" -ForegroundColor Yellow

# Check if remote already exists
$remoteExists = git remote get-url origin 2>$null
if ($remoteExists) {
    Write-Host "Remote origin already exists: $remoteExists" -ForegroundColor Yellow
    # Update the remote URL
    git remote set-url origin $remoteUrl
} else {
    git remote add origin $remoteUrl
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to add remote origin"
        exit 1
    }
}

# Push to GitHub
Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
Write-Host "You may be prompted for your GitHub username and personal access token" -ForegroundColor Cyan

# Try to push
git push -u origin main
if ($LASTEXITCODE -ne 0) {
    # If main branch doesn't exist, try master
    Write-Host "Main branch failed, trying master branch..." -ForegroundColor Yellow
    git push -u origin master
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to push to GitHub"
        Write-Host "Please make sure:" -ForegroundColor Yellow
        Write-Host "1. You have a GitHub repository at: https://github.com/$GitHubUsername/$RepositoryName" -ForegroundColor Yellow
        Write-Host "2. You have the correct permissions" -ForegroundColor Yellow
        Write-Host "3. If it's a new repository, you may need to create it first on GitHub" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "Successfully pushed to GitHub!" -ForegroundColor Green
Write-Host "Repository URL: https://github.com/$GitHubUsername/$RepositoryName" -ForegroundColor Cyan