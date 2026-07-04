# smartjobapplyagent
  AI-powered job application agent built with Gemini API and vanilla JS for the Google x Kaggle AI Agents Capstone
# SmartApply.ai 🤖

An AI-powered job application agent built with Google Gemini API and vanilla JavaScript — capstone project for the **Google x Kaggle 5-Day AI Agents Intensive Course**.

## 🎯 What It Does

SmartApply.ai helps job seekers generate a complete, tailored application kit in one click. Paste your resume, search for a job, and the agent generates 5 personalized documents using Gemini AI.

## ✨ Features

- **Resume Bullet Rewriter** — rewrites your resume bullets to match the job description
- **Tailored Cover Letter** — personalized cover letter in your voice
- **Recruiter Cold Email** — short, punchy email ready to send
- **Skills Gap Analysis** — compares your resume vs job requirements
- **Interview Prep Guide** — 10 custom questions with suggested answers

## 🧠 AI Agent Concepts Used

1. **Agentic AI** — app makes decisions based on resume + JD context
2. **Prompt Engineering** — custom system prompts for each document type
3. **Tool Use** — external API calls for job search
4. **Sequential Processing with Auto-Retry** — handles API rate limits gracefully
5. **Grounding** — resume and job description as real-world context

## 🛠️ Tech Stack

- Vanilla JavaScript (no framework)
- Google Gemini API (gemini-2.0-flash-lite)
- Indeed RSS Feed for job listings
- HTML5 + CSS3
- localStorage for persistence

## 🚀 How to Run

1. Clone this repo
2. Open `index-2.html` in a browser
   - Or run a local server: `python3 -m http.server 8080`
   - Then visit `localhost:8080`
3. Go to **Settings** → paste your Gemini API key (free at aistudio.google.com)
4. Search for a job → click **Generate Kit**

## 🔑 API Keys Required

- **Gemini API Key** — free at [aistudio.google.com](https://aistudio.google.com)
- **JSearch API Key** — optional, for live job listings

## 👩‍💻 Built By

Mansi Sharma — Biotechnology Graduate, Thapar Institute of Engineering & Technology

[LinkedIn](https://linkedin.com/in/mansi-sharma-b1597a312)
