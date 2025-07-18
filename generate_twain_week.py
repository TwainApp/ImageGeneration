import os
from prompts.prompt_generator import roll_category_and_difficulty, generate_questions, generate_caption
from images.image_utils import populate_background_cache, render_intro_image, render_image, render_follow_image
from video.video_creator import generate_video_from_images
from firebase.firebase_upload import upload_folder_to_firebase


def run_batch_generation():
    populate_background_cache()  # ensure backgrounds exist before running
    base_output = "queue"
    os.makedirs(base_output, exist_ok=True)
    existing = [d for d in os.listdir(base_output) if d.isdigit()]
    used_numbers = sorted([int(d) for d in existing])
    next_start = used_numbers[-1] + 1 if used_numbers else 1
    for i in range(10):
        folder_name = f"{next_start + i:03d}"
        output_folder = os.path.join(base_output, folder_name)
        os.makedirs(output_folder, exist_ok=True)
        category, difficulty, prompt = roll_category_and_difficulty()
        print(f"[{folder_name}] → {category} ({difficulty})")
        try:
            questions = generate_questions(prompt)
        except RuntimeError as e:
            print(e)
            continue
        render_intro_image(output_folder)
        for idx, q in enumerate(questions):
            render_image(q, category, idx, output_folder)
        render_follow_image(output_folder)
        caption = generate_caption()
        with open(os.path.join(output_folder, "caption.txt"), "w", encoding="utf-8") as f:
            f.write(caption)
        generate_video_from_images(output_folder)
        upload_folder_to_firebase(output_folder, bucket_path_prefix=f"queue/{folder_name}")
    print("✅ Batch generation complete.")

if __name__ == "__main__":
    run_batch_generation()
