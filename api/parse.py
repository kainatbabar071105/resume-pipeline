import os
import re
import PyPDF2
import requests
import psycopg2
from io import BytesIO
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import time

load_dotenv()
app = Flask(__name__)
CORS(app)

OCR_API_KEY = os.getenv("OCR_API_KEY")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
DATABASE_URL = os.getenv("DATABASE_URL")  # 👈 Database connection string

# ---------- DATABASE FUNCTION ----------
def save_to_db(name, email, phone, skills, summary, filename):
    """Saves parsed resume data to all_resume table"""
    if not DATABASE_URL:
        print("⚠️ DATABASE_URL not set. Skipping DB save.")
        return
    
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        # 1. Create table if not exists
        cur.execute("""
            CREATE TABLE IF NOT EXISTS all_resume (
                id SERIAL PRIMARY KEY,
                name TEXT,
                email TEXT,
                phone TEXT,
                skills TEXT,
                summary TEXT,
                filename TEXT,
                uploaded_at TIMESTAMP DEFAULT NOW()
            );
        """)
        
        # 2. Convert skills list to comma-separated string
        skills_str = ', '.join(skills) if skills else ''
        
        # 3. Insert data
        cur.execute("""
            INSERT INTO all_resume (name, email, phone, skills, summary, filename)
            VALUES (%s, %s, %s, %s, %s, %s);
        """, (name, email, phone, skills_str, summary, filename))
        
        conn.commit()
        cur.close()
        conn.close()
        
        print(f"✅ Data saved to DB: {name} | {email}")
        
    except Exception as e:
        print(f"❌ DB Error (skipping save): {e}")

# ---------- CACHE & OCR FUNCTIONS ----------
FREE_MODELS_CACHE = None
CACHE_TIMESTAMP = 0
CACHE_DURATION = 3600

def get_free_models():
    global FREE_MODELS_CACHE, CACHE_TIMESTAMP
    now = time.time()
    if FREE_MODELS_CACHE and (now - CACHE_TIMESTAMP) < CACHE_DURATION:
        return FREE_MODELS_CACHE
    
    try:
        url = "https://openrouter.ai/api/v1/models"
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()
        models = data.get('data', [])
        free_models = []
        for model in models:
            model_id = model.get('id', '')
            if ':free' in model_id:
                pricing = model.get('pricing', {})
                prompt_cost = pricing.get('prompt', '0')
                if prompt_cost == "0" or prompt_cost.startswith("0."):
                    free_models.append(model_id)
        if not free_models:
            free_models = ["google/gemini-2.0-flash-001:free", "mistralai/mistral-7b-instruct:free"]
        FREE_MODELS_CACHE = free_models
        CACHE_TIMESTAMP = now
        return free_models
    except Exception as e:
        print(f"⚠️ Failed to fetch model list: {e}")
        return ["google/gemini-2.0-flash-001:free", "mistralai/mistral-7b-instruct:free"]

def extract_text_from_pdf(pdf_bytes, filename="document.pdf"):
    if filename.lower().endswith('.pdf'):
        try:
            reader = PyPDF2.PdfReader(BytesIO(pdf_bytes))
            text = ""
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
            if text.strip():
                return text.strip()
        except Exception as e:
            print(f"PyPDF2 error: {e}")

    if not OCR_API_KEY:
        raise Exception("OCR_API_KEY missing in .env file!")
    
    files = {'file': (filename, pdf_bytes)}
    response = requests.post(
        'https://api.ocr.space/parse/image',
        files=files,
        data={'apikey': OCR_API_KEY, 'language': 'eng', 'isOverlayRequired': False}
    )
    
    if response.status_code == 200:
        result = response.json()
        if result.get('IsErroredOnProcessing') is False and result.get('ParsedResults'):
            return result['ParsedResults'][0]['ParsedText']
        else:
            error_msg = result.get('ErrorMessage', ['Unknown error'])[0]
            raise Exception(f"OCR.space error: {error_msg}")
    else:
        raise Exception(f"OCR.space API error: {response.status_code}")

def clean_summary(text):
    if not text:
        return ""
    lines = text.split('\n')
    meta_keywords = [
        'thinking process', 'think about', 'let me', 'i will', 'here\'s a', 
        'here is a', 'analysis', 'analyze', 'extract', 'reviewing', 
        'considering', 'based on', 'as a', 'overview', 'summary:',
        'candidate\'s', 'resume snippet', 'key information', 'extract key'
    ]
    cleaned_lines = []
    for line in lines:
        line_lower = line.lower().strip()
        skip = False
        for keyword in meta_keywords:
            if keyword in line_lower:
                skip = True
                break
        if not skip and line.strip():
            cleaned_lines.append(line.strip())
    cleaned = ' '.join(cleaned_lines)
    cleaned = re.sub(r'^\d+\.\s*', '', cleaned, flags=re.MULTILINE)
    cleaned = re.sub(r'^[-*•]\s*', '', cleaned, flags=re.MULTILINE)
    cleaned = re.sub(r'^(so|also|now|then|finally|additionally|moreover)\s*', '', cleaned, flags=re.IGNORECASE)
    sentences = re.split(r'[.!?]+', cleaned)
    if len(sentences) > 3:
        cleaned = '. '.join([s.strip() for s in sentences[:3] if s.strip()]) + '.'
    if cleaned:
        cleaned = cleaned[0].upper() + cleaned[1:]
    words = cleaned.split()
    if len(words) > 50:
        cleaned = ' '.join(words[:50]) + '...'
    return cleaned.strip()

def generate_summary_fallback(text, name="", skills=None):
    if skills is None:
        skills = []
    lines = text.split('\n')
    roles = []
    companies = []
    for line in lines:
        line = line.strip()
        if 'designer' in line.lower():
            roles.append('Designer')
        elif 'architect' in line.lower():
            roles.append('Architect')
        elif 'developer' in line.lower():
            roles.append('Developer')
        elif 'engineer' in line.lower():
            roles.append('Engineer')
        elif 'manager' in line.lower():
            roles.append('Manager')
        elif 'lead' in line.lower():
            roles.append('Team Lead')
        if re.search(r'[A-Z][a-z]+ (?:Inc|Corp|LLC|Company|Studio|Agency)', line):
            companies.append(line.strip())
    role = ', '.join(set(roles)) if roles else 'Professional'
    skills_text = ', '.join(skills[:3]) if skills else 'various domains'
    summary = f"{name} is a {role} with expertise in {skills_text}."
    if companies:
        exp_text = " Experience includes working at " + ", ".join(companies[:2]) + "."
        summary += exp_text
    else:
        summary += " Proven experience in delivering high-quality results."
    words = summary.split()
    if len(words) > 50:
        summary = ' '.join(words[:50]) + '...'
    return summary

def generate_summary_openrouter(text, name, skills):
    if not OPENROUTER_API_KEY:
        return generate_summary_fallback(text, name, skills)
    free_models = get_free_models()
    if not free_models:
        return generate_summary_fallback(text, name, skills)
    truncated_text = text[:3000]
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Resume Parser AI"
    }
    system_prompt = """You are an expert HR professional. Write a concise professional summary.
RULES:
- Output ONLY the summary, nothing else
- Use 2-3 sentences (max 50 words)
- Highlight: experience, key skills, career focus
- Professional and direct tone
- Start directly with the candidate's name or role"""
    user_prompt = f"CANDIDATE'S RESUME:\n{truncated_text}\n\nSUMMARY:"
    for model in free_models:
        try:
            payload = {
                "model": model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "max_tokens": 150,
                "temperature": 0.3
            }
            response = requests.post(url, json=payload, headers=headers, timeout=30)
            if response.status_code == 200:
                result = response.json()
                if 'choices' in result and result['choices']:
                    choice = result['choices'][0]
                    content = None
                    if 'message' in choice and 'content' in choice['message']:
                        content = choice['message']['content']
                    elif 'text' in choice:
                        content = choice['text']
                    if content and content.strip():
                        cleaned = clean_summary(content)
                        if cleaned and len(cleaned) > 10:
                            return cleaned
        except Exception as e:
            print(f"⚠️ Model error: {e}")
            continue
    return generate_summary_fallback(text, name, skills)

def parse_resume(text):
    lines = text.split('\n')
    full_text = " ".join(lines)
    
    email_match = re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', full_text)
    email = email_match.group(0) if email_match else ""
    
    phone_match = re.search(r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', full_text)
    phone = phone_match.group(0) if phone_match else ""
    
    name = ""
    for line in lines[:10]:
        line = line.strip()
        if len(line) > 2 and len(line) < 40 and not re.search(r'@|http|www|\d', line):
            if re.match(r'^[A-Z][a-z]+ [A-Z][a-z]+', line) or line.isupper():
                name = line
                break
    if not name and lines:
        name = lines[0].strip() if lines else ""
    
    skill_keywords = ["Python", "SQL", "Java", "C++", "React", "Angular", "Vue", "Node.js", 
                      "Django", "Flask", "Machine Learning", "Data Science", "AWS", "Azure", 
                      "GCP", "Docker", "Kubernetes", "Git", "Agile", "Scrum", "TensorFlow", 
                      "PyTorch", "Pandas", "NumPy", "Tableau", "Power BI", "Design", 
                      "Architecture", "Photo Editing", "Video Editing"]
    found_skills = []
    for skill in skill_keywords:
        if skill.lower() in full_text.lower():
            found_skills.append(skill)
    
    summary = generate_summary_openrouter(full_text, name, found_skills[:5])
    
    return {
        "name": name,
        "email": email,
        "phone": phone,
        "skills": found_skills[:5],
        "summary": summary
    }

# ---------- MAIN API ROUTE ----------
@app.route('/api/parse', methods=['POST'])
def handle_parse():
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file uploaded"}), 400
        
        file = request.files['file']
        pdf_bytes = file.read()
        filename = file.filename or "document.pdf"
        
        # 1. Extract Text
        extracted_text = extract_text_from_pdf(pdf_bytes, filename)
        
        # 2. Parse Data
        parsed_data = parse_resume(extracted_text)
        
        # 3. ⭐ SAVE TO DATABASE (AUTO-SAVE FEATURE)
        save_to_db(
            name=parsed_data['name'],
            email=parsed_data['email'],
            phone=parsed_data['phone'],
            skills=parsed_data['skills'],
            summary=parsed_data['summary'],
            filename=filename
        )
        
        return jsonify({
            "success": True,
            "parsed": parsed_data
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"}), 200

if __name__ == "__main__":
    print("🚀 Flask server starting on http://localhost:5001")
    app.run(debug=True, port=5001)