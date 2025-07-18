# ImageGeneration
🖼️ Twain Image Generator
Twain Image Generator is an automated content creation tool designed for relationship-focused social media pages. This script uses OpenAI and DALL·E to generate stylized daily questions for couples and outputs both a swipeable image set (Instagram-ready) and a vertical video with smooth transitions (TikTok-ready).

🔧 What It Does
Generates a week's worth of romantic prompts for couples, drawn from four themed categories (e.g., Intimacy, Memories).

Uses OpenAI GPT-3.5 to generate 5 short, under-200-character questions per day — engaging, friendly, and emotionally open.

Renders each question as a styled vertical image (1080×1920) using a custom dark theme and branded layout with:

Theme labels (e.g. "Theme: Intimacy")

Elegant fonts (DM Serif Display)

A bottom watermark ("Twain")

Creates a short vertical video (≈12 seconds) with smooth crossfade transitions — formatted perfectly for TikTok.

Generates captions using GPT-3.5 to accompany posts, with hashtags included.

Stores output by day inside organized folders like week_output/Week_01/01_Monday/.

📤 Planned Posting Integration
While this script does not yet upload automatically, it's designed to support future automation:

TikTok: renders daily_video.mp4 ready for vertical reels

Instagram: swipeable question_0.jpg to question_6.jpg for a 7-slide carousel

Posting automation will follow using:

TikTok API / Playwright workaround (coming soon)

[Meta Graph API for Instagram (planned)]

🧠 Technologies Used
OpenAI GPT-3.5 + DALL·E 3 (question + image generation)

Python (core logic)

Pillow for image rendering

cv2 (OpenCV) for video compilation

textwrap for line formatting

requests for image download and caching

## API Key Setup

This project requires an OpenAI API key. You can provide it in one of two ways:

1. **Environment Variable** (recommended for production):
   - Set `OPENAI_API_KEY` in your environment before running the script.
     - On Windows (PowerShell):
       ```powershell
       $env:OPENAI_API_KEY="sk-..."
       python generate_twain_week.py
       ```
     - On Mac/Linux (bash):
       ```bash
       export OPENAI_API_KEY="sk-..."
       python generate_twain_week.py
       ```

2. **.env File** (convenient for local development):
   - Create a file named `.env` in the project root with this line:
     ```
     OPENAI_API_KEY=sk-...
     ```
   - The script will automatically load this if you have `python-dotenv` installed.
   - Install with:
     ```bash
     pip install python-dotenv
     ```

**Never commit your real API key to version control!**