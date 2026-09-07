# 📄 Resume OCR & ETL Pipeline with AI Summary

![Python](https://img.shields.io/badge/Python-3.11-blue.svg)
![Flask](https://img.shields.io/badge/Flask-3.0.0-green.svg)
![Next.js](https://img.shields.io/badge/Next.js-14.0.4-black.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

## 🚀 Overview

This is a **full-stack Resume OCR & ETL Pipeline** that extracts key information from resumes (PDF/Images), generates an AI-powered professional summary, and automatically stores the data in a PostgreSQL database.

### ✨ Key Features

- 📤 **Drag & Drop Upload** – Beautiful Blue-White themed UI
- 🔍 **OCR Integration** – Reads scanned images using OCR.space API
- 🧠 **AI Summary** – Generates professional 2-3 sentence summaries using OpenRouter (free models)
- 📊 **Auto-Save to Database** – Every parsed resume is automatically saved to `all_resume` table
- 🏷️ **Skill Extraction** – Identifies and displays skills as tags
- 📁 **Local Scraper** – Optional public job board scraper

---

## 🖥️ Screenshot

Here's how the application looks in action:

![Resume Parser UI](./screenshots/image.png)

---

## 🛠️ Tech Stack

| Component | Technology |
| :--- | :--- |
| **Backend** | Python, Flask (Port 5001) |
| **Frontend** | Next.js, React (Port 3000) |
| **OCR** | OCR.space API (Free Tier) |
| **AI Summary** | OpenRouter API (Google Gemini / Mistral / Llama) |
| **Database** | PostgreSQL |
| **Scraping** | BeautifulSoup (Local) |
| **Deployment** | Vercel (Optional) |

---

## 📁 Project Structure



**9. `README.md` - Project documentation**
- Setup instructions
- How to get API keys
- How to run locally
- Features list

**10. `vercel.json` - (Optional, for deployment)**
- Routes configuration for Vercel deployment

**Setup Instructions to include:**
1. Create folder: `resume-pipeline`
2. Copy all files into respective folders
3. Install Python: `pip install -r requirements.txt`
4. Install Node: `npm install`
5. Get OCR.space API key from https://ocr.space/
6. Get OpenRouter API key from https://openrouter.ai/keys
7. Create PostgreSQL database named `resume_db` in pgAdmin
8. Add all keys to `.env` file
9. Run Flask: `python api/parse.py` (Terminal 1)
10. Run Next.js: `npm run dev` (Terminal 2)
11. Open browser: `http://localhost:3000`
12. Upload a resume and see data auto-save to `all_resume` table

**Key Features to Highlight:**
- Drag & Drop file upload
- Blue-White professional theme
- OCR.space integration for scanned images
- OpenRouter AI summary with fallback models
- Clean extraction: Name, Email, Phone, Skills
- ⭐ Auto-save to PostgreSQL (`all_resume` table)
- Skills displayed as tags/chips
- Optional local scraper for public data
- All free tier services
- Summary cleaning removes meta-text

**Important Notes:**
- Model fallback handles API failures gracefully
- Summary is cleaned to remove any "thinking process" or meta-text
- Database save is non-blocking (if DB fails, API still returns results)
- Frontend uses modern React hooks
- Backend has CORS enabled for local development

Generate the complete project now with all files and setup instructions. Make sure the auto-save feature is properly implemented and the `all_resume` table is created automatically when the first resume is uploaded.