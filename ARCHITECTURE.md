# ☁️ TwainGenerator Architecture (Firebase Edition)

> This backend system generates social-ready question content for couples, using OpenAI APIs and local image/video rendering tools.  
> It was originally written as a single local script and has since been adapted to run in a modular, cloud-connected environment using Firebase.

The core **visual and structural output remains unchanged**. All changes described below relate to **infrastructure and automation**.

---

## 🔧 Overview

The Twain Generator backend:

- Generates romantic conversation prompts for couples using OpenAI
- Outputs:
  - A **6-image carousel** for Instagram (intro + 5 questions + follow)
  - A **smoothly crossfaded vertical video** for TikTok (1080x1920, 12s)
  - A **caption.txt** file with hashtags
- Saves each post into a folder in `queue/`, e.g. `queue/001/`, `queue/002/`, etc.
- The frontend/posting system retrieves the next folder, publishes it, and optionally deletes it after use
- All generation now runs as a Firebase-scheduled backend function

---

## 📁 File Structure (Modular Layout)

TwainGenerator/
├── queue/ # Output folder for upcoming content (001/, 002/, etc.)
├── backgrounds/ # Cached vertical backgrounds from DALL·E 3
├── twain_prompts.json # 4x3 structure of category x difficulty prompt templates
├── dmserifdisplay.ttf # Primary font used in all visuals
├── .env # Local development secrets
├── main.py # Entry point for batch generation (e.g. generate 10 posts)
├── modules/
│ ├── prompt_gen.py # GPT question + caption logic
│ ├── image_gen.py # All image rendering logic
│ ├── video_gen.py # OpenCV-based video assembly
│ ├── firebase_util.py # Firebase upload and folder management (optional)
│ └── utils.py # Shared helpers (env, spacing, etc.)
├── architecture_firebase.md # ← This file


---

## 🧱 System Breakdown

### 1. `main.py` — Batch Generator Entrypoint

- Generates **10 content folders** at a time when the queue is running low
- Folder names auto-increment from `queue/001/` upward
- Each folder includes:
  - 7 images (`question_0.jpg` → `question_6.jpg`)
  - 1 `daily_video.mp4` (12 seconds, portrait)
  - 1 `caption.txt` for Instagram/TikTok

---

### 2. `prompt_gen.py`

- **`generate_questions(prompt)`**  
  Calls GPT-3.5 Turbo with category+difficulty input. Ensures:
  - Under 200 characters
  - One-line format
  - No bullets or numbering

- **`generate_caption()`**  
  Calls GPT-3.5 Turbo with a fixed caption style prompt. If generation fails, uses a hardcoded fallback.

---

### 3. `image_gen.py`

- **`render_intro_image()`**
  - Picks a random hook from `INTRO_HOOKS`
  - Loads a random cached background from `backgrounds/`
  - Renders a translucent textbox and wraps text cleanly

- **`render_image()`**
  - Produces slides for each question (Q1–Q5)
  - Displays “Theme: ___” label, rule, wrapped question, and "Twain" watermark at the bottom

- **`render_follow_image()`**
  - Simple final slide with: _“Follow for more!”_

---

### 4. `video_gen.py`

- Uses OpenCV to build a `.mp4` from all 7 images
- Slide timing:
  - 1.4s per slide
  - 0.4s crossfade
  - ~12 seconds total
- No movement/zoom effects — just fade

---

### 5. `firebase_util.py` (Planned)

- Handles:
  - Upload of folders/files to Firebase Storage
  - Optional real-time database updates (e.g., metadata or publish status)
  - Clean-up or archiving of posted folders

---

## 📦 Queue Folder Structure

Each time `main.py` runs, it generates a new batch like:

queue/
├── 001/
│ ├── question_0.jpg # Hook slide
│ ├── question_1.jpg # Question 1
│ ├── question_2.jpg
│ ├── question_3.jpg
│ ├── question_4.jpg
│ ├── question_5.jpg
│ ├── question_6.jpg # Follow slide
│ ├── caption.txt
│ └── daily_video.mp4
├── 002/
│ └── ...


- Once `001/` is used (posted), it can be:
  - Deleted
  - Archived
  - Moved to a `posted/` folder (depending on your backend strategy)

---

## 🔒 Output Consistency Rules

The following **must not be changed** unless explicitly required:

| Element           | Value                     |
|------------------|---------------------------|
| Image size       | 1080×1920 (portrait)      |
| Font             | DM Serif Display          |
| Colors           | Charcoal (`#2E2E2E`) bg, Blush (`#FADADD`) text |
| Slide order      | Intro → Q1–Q5 → Follow    |
| File names       | `question_0.jpg`, `daily_video.mp4`, etc. |
| Watermark        | "Twain", 140px from bottom center |

---

## ☁️ Firebase Integration (Planned)

Firebase will handle:

- **Storage** — Each `queue/N/` folder is uploaded to Firebase Storage as-is
- **Triggering** — Firebase Cloud Scheduler runs generation when the queue is nearly empty
- **Status Tracking** — Firestore or Realtime Database tracks which folder is "next"
- **Post Automation** — (optional) a hook sends videos/captions to TikTok/Instagram via Meta API

---

## 🧪 Content Integrity Tests

- ✅ All `.jpg` files are center-aligned and properly spaced
- ✅ `.mp4` is exactly ~12s and plays with smooth fades
- ✅ `caption.txt` is under 200 characters + 3–5 hashtags
- ✅ Folders auto-increment and avoid name collision
- ✅ Image layout and visuals match branding

---

## 🔧 Local Development

To test locally:

```bash
python main.py

Then check:

queue/001/ for images and video

Output integrity before uploading

📈 Future Enhancements (Safe to Add)
Feature	Notes
Firestore integration	Track generation logs + status
Web dashboard	Monitor queue + review content
TikTok/Instagram API	Automated publishing
Image moderation	Run background generation through filter/check
Prompt analytics	Store which prompt → how many views

🧾 Attribution
Text & image AI: OpenAI (GPT-3.5, DALL·E 3)

Font: DM Serif Display

Generator by: Logan, for Twain App

