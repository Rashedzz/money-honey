# 🚀 Money-Honey GitHub Setup Guide

Follow these steps to set up your repository, enable automatic deployments, and get your app live!

## 1. Create a GitHub Account
Create a new GitHub account or log into your existing one at [github.com](https://github.com).

## 2. Create the Repository
Create a **new repository** named `money-honey`.
- **Public:** ✅
- **Add a README file:** Leave unchecked
- **Add .gitignore:** None

## 3. Push Your Code
Copy and paste these exact commands into your terminal from the `Money-Honey` folder:

```bash
git init
git add .
git commit -m "🍯 Initial release: Money-Honey Personal Finance App"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/money-honey.git
git push -u origin main
```
*(Make sure to replace `YOUR_USERNAME` with your actual GitHub username)*

## 4. Enable GitHub Pages (PWA Hosting)
1. Go to your repository on GitHub.
2. Navigate to **Settings** → **Pages**.
3. Under **Source**, select **GitHub Actions**.
4. The workflow (already configured in `.github/workflows/build.yml`) will automatically deploy the web version on your next push!

## 5. Set up EAS for APK Builds
1. Create a free account at [expo.dev](https://expo.dev).
2. Open your terminal and run:
   ```bash
   npm install -g eas-cli
   eas login
   eas build:configure
   ```
3. Get your Expo token from: [expo.dev/accounts/settings/access-tokens](https://expo.dev/accounts/settings/access-tokens)
4. Go to your GitHub repository **Settings** → **Secrets and variables** → **Actions**.
5. Click **New repository secret**, name it `EXPO_TOKEN`, and paste the token.
6. Push any new commit to trigger the Android APK build automatically!

## 6. Get Your Shareable Links
- **PWA (Web App):** `https://YOUR_USERNAME.github.io/money-honey`
- **APK Downloads:** `https://github.com/YOUR_USERNAME/money-honey/releases`
