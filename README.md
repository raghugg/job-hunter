# 🎯 [Job Hunter](https://jobhunters.app)

🔗 https://jobhunters.app

A full-stack AI-powered resume analysis and job search tool. Paste in a job description and your resume to get instant keyword extraction, ATS gap detection, and automated resume generation tailored to the role.

## ✨ Features

- **ATS gap detection** — identifies missing keywords between your resume and a job description
- **Keyword extraction** — pulls the most relevant terms from any job posting
- **Automated resume generation** — rewrites your resume to better match the target role
- **Real-time resume parsing** — dynamic analysis as you input your details
- **Secure API proxying** — Gemini API calls handled server-side via Cloudflare Workers

## 🛠 Tech Stack

**Frontend**
![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)

**Backend**
![Cloudflare Workers](https://img.shields.io/badge/Cloudflare_Workers-F38020?style=flat&logo=cloudflare&logoColor=white)

**AI**
![Gemini](https://img.shields.io/badge/Gemini_API-4285F4?style=flat&logo=google&logoColor=white)

## 🚀 Running Locally

> **Note:** Local setup instructions change frequently as the project evolves. Since the live site at [jobhunters.app](https://jobhunters.app) deploys directly from this repo, visiting the site is recommended.

```bash
git clone https://github.com/raghugg/job-hunter
cd job-hunter
npm install
npm run dev
```

You'll need a Gemini API key and a Cloudflare Worker set up to proxy requests. See the worker config for details.

## 👥 Authors

- Raghavendra Guggilam
- Gaurav Sehgal
