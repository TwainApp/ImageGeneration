import os
import cv2
import numpy as np

def generate_video_from_images(folder):
    images = [
        os.path.join(folder, f"question_{i}.jpg") for i in range(7)
        if os.path.exists(os.path.join(folder, f"question_{i}.jpg"))
    ]
    if not images:
        print("No images found to create video.")
        return
    frame = cv2.imread(images[0])
    height, width, _ = frame.shape
    output_path = os.path.join(folder, "daily_video.mp4")
    out = cv2.VideoWriter(output_path, cv2.VideoWriter_fourcc(*'mp4v'), 30, (width, height))
    slide_duration = int(1.4 * 30)
    crossfade_duration = int(0.4 * 30)
    for i in range(len(images)):
        img = cv2.imread(images[i])
        next_img = cv2.imread(images[i+1]) if i < len(images) - 1 else None
        for _ in range(slide_duration):
            out.write(img)
        if next_img is not None:
            for f in range(1, crossfade_duration + 1):
                alpha = f / crossfade_duration
                blended = cv2.addWeighted(img, 1 - alpha, next_img, alpha, 0)
                out.write(blended)
    out.release()
    print(f"[🎥] Created with crossfade only: {output_path}") 