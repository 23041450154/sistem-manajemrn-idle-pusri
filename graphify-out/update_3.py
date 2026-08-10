import json
from pathlib import Path

r = json.loads(Path('graphify-out/.graphify_incremental.json').read_text(encoding="utf-8"))
videos = r.get('new_files', {}).get('video', [])
print(f'video_files: {len(videos)}')
