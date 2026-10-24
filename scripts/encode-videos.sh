#!/bin/zsh
# Encode Playwright WebM recordings (CAPTURE_VIDEO=1 npx playwright test e2e/video.spec.ts) to H.264 MP4 + JPG posters.
set -e
cd "$(dirname "$0")/.."
mkdir -p docs/video docs/store/preview
enc() { # id out_dir crf
  local src=$(ls test-results/videos/$1/*.webm | head -1)
  local out="$2/$1.mp4"
  # Trim the blank first 0.6s, 30 fps, faststart for web streaming, no audio.
  ffmpeg -y -loglevel error -ss 0.6 -i "$src" -vf "fps=30,format=yuv420p" -c:v libx264 -preset slow -crf $3 -movflags +faststart -an "$out"
  ffmpeg -y -loglevel error -ss 6 -i "$out" -frames:v 1 -q:v 3 "${out%.mp4}-poster.jpg"
  printf '%-28s %6s KB  %ss\n' "$1" $(( $(stat -f%z "$out") / 1024 )) $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$out" | cut -d. -f1)
}
enc walkthrough-portrait docs/video 26
enc walkthrough-landscape docs/video 26
enc appstore-preview docs/store/preview 22
