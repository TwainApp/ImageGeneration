import os
import random
import textwrap
from PIL import Image, ImageDraw, ImageFont
from io import BytesIO
import requests
from utils.env import get_env

FONT_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'dmserifdisplay.ttf')
WIDTH, HEIGHT = 1080, 1920
BACKGROUND_COLOR = "#2E2E2E"
TEXT_COLOR = "#FADADD"
ACCENT_COLOR = "#FADADD"
BACKGROUND_FOLDER = os.path.join(os.path.dirname(__file__), "..", "backgrounds")
os.makedirs(BACKGROUND_FOLDER, exist_ok=True)

def populate_background_cache(count=5):
    import openai
    openai.api_key = get_env("OPENAI_API_KEY")
    existing = [f for f in os.listdir(BACKGROUND_FOLDER) if f.endswith(".jpg")]
    while len(existing) < count:
        try:
            response = openai.Image.create(
                model="dall-e-3",
                prompt="A romantic outdoor nature setting at dusk, soft lighting, peaceful, wide format, cinematic mood",
                size="1024x1792",
                quality="standard",
                n=1
            )
            image_url = response['data'][0]['url']
            img_data = requests.get(image_url).content
            img = Image.open(BytesIO(img_data)).resize((WIDTH, HEIGHT))
            filename = os.path.join(BACKGROUND_FOLDER, f"bg_{len(existing)+1}.jpg")
            img.save(filename)
            existing.append(filename)
        except Exception as e:
            print("Image generation failed:", e)
            break

def get_cached_background():
    files = [f for f in os.listdir(BACKGROUND_FOLDER) if f.endswith(".jpg")]
    if not files:
        populate_background_cache()
        files = [f for f in os.listdir(BACKGROUND_FOLDER) if f.endswith(".jpg")]
    path = os.path.join(BACKGROUND_FOLDER, random.choice(files))
    return Image.open(path).resize((WIDTH, HEIGHT))

def render_intro_image(output_folder):
    from prompts.prompt_generator import INTRO_HOOKS
    hook = random.choice(INTRO_HOOKS)
    img = get_cached_background().convert("RGBA")
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    draw_overlay = ImageDraw.Draw(overlay)
    draw = ImageDraw.Draw(img)
    font = ImageFont.truetype(FONT_PATH, 80)
    wrapped = textwrap.wrap(hook, width=20)
    line_spacing = 20
    line_height = font.getbbox("Ag")[3] - font.getbbox("Ag")[1]
    total_height = len(wrapped) * line_height + (len(wrapped) - 1) * line_spacing
    y_text = HEIGHT // 2 - total_height // 2
    max_line_width = max(draw.textbbox((0, 0), line, font=font)[2] for line in wrapped)
    padding_x = 40
    padding_y = 40
    box_left = (WIDTH - max_line_width) // 2 - padding_x
    box_top = y_text - padding_y
    box_right = (WIDTH + max_line_width) // 2 + padding_x
    box_bottom = y_text + total_height + padding_y
    draw_overlay.rectangle(
        [(box_left, box_top), (box_right, box_bottom)],
        fill=(46, 46, 46, 180)
    )
    img = Image.alpha_composite(img, overlay)
    draw = ImageDraw.Draw(img)
    for line in wrapped:
        bbox = draw.textbbox((0, 0), line, font=font)
        w = bbox[2] - bbox[0]
        draw.text(((WIDTH - w) / 2, y_text), line, font=font, fill=TEXT_COLOR)
        y_text += line_height + line_spacing
    img.convert("RGB").save(os.path.join(output_folder, "question_0.jpg"))

def render_image(question, category, index, output_folder):
    question = question.replace('\\n', '').replace('\n', '').replace('\r', '')
    img = Image.new("RGB", (WIDTH, HEIGHT), color=BACKGROUND_COLOR)
    draw = ImageDraw.Draw(img)
    font = ImageFont.truetype(FONT_PATH, 60)
    tag_font = ImageFont.truetype(FONT_PATH, 42)
    brand_font = ImageFont.truetype(FONT_PATH, 50)
    wrapped = textwrap.wrap(question, width=25)
    line_spacing = 20
    line_height = font.getbbox("Ag")[3] - font.getbbox("Ag")[1]
    question_block_height = len(wrapped) * line_height + (len(wrapped) - 1) * line_spacing
    tag_text = f"Theme: {category.replace('And', ' & ')}"
    tag_bbox = draw.textbbox((0, 0), tag_text, font=tag_font)
    tag_height = tag_bbox[3] - tag_bbox[1]
    spacing_below_tag = 24
    spacing_above_tag = 48
    total_height = tag_height + spacing_above_tag + 3 + spacing_below_tag + question_block_height
    start_y = (HEIGHT // 2) - (total_height // 2)
    draw.text(((WIDTH - tag_bbox[2]) / 2, start_y), tag_text, fill=TEXT_COLOR, font=tag_font)
    line_y = start_y + tag_height + spacing_above_tag
    draw.line([(100, line_y), (WIDTH - 100, line_y)], fill=ACCENT_COLOR, width=3)
    y_text = line_y + spacing_below_tag
    for line in wrapped:
        bbox = draw.textbbox((0, 0), line, font=font)
        w = bbox[2] - bbox[0]
        draw.text(((WIDTH - w) / 2, y_text), line, font=font, fill=TEXT_COLOR)
        y_text += line_height + line_spacing
    brand_text = "Twain"
    brand_bbox = draw.textbbox((0, 0), brand_text, font=brand_font)
    draw.text(((WIDTH - brand_bbox[2]) / 2, HEIGHT - 140), brand_text, font=brand_font, fill=TEXT_COLOR)
    img.save(os.path.join(output_folder, f"question_{index+1}.jpg"))

def render_follow_image(output_folder):
    img = Image.new("RGB", (WIDTH, HEIGHT), color=BACKGROUND_COLOR)
    draw = ImageDraw.Draw(img)
    font = ImageFont.truetype(FONT_PATH, 72)
    text = "Follow for more!"
    bbox = draw.textbbox((0, 0), text, font=font)
    w = bbox[2] - bbox[0]
    h = bbox[3] - bbox[1]
    draw.text(((WIDTH - w) / 2, (HEIGHT - h) / 2), text, font=font, fill=TEXT_COLOR)
    img.save(os.path.join(output_folder, "question_6.jpg")) 