import os, json
from pathlib import Path

has_key = bool(os.environ.get('GEMINI_API_KEY') or os.environ.get('GOOGLE_API_KEY'))
if has_key:
    from graphify.llm import extract_corpus_parallel
    uncached = Path('graphify-out/.graphify_uncached.txt').read_text(encoding="utf-8").splitlines()
    uncached = [f for f in uncached if f.strip()]
    if uncached:
        print(f"Extracting {len(uncached)} files with gemini backend...")
        # read the prompt spec to pass to extract_corpus_parallel if needed, but the backend uses the default unless specified
        # actually graphify has internal defaults for it
        try:
            result = extract_corpus_parallel(uncached, backend="gemini")
            Path('graphify-out/.graphify_semantic_new.json').write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")
            print("SEMANTIC_SUCCESS")
        except Exception as e:
            print(f"SEMANTIC_ERROR: {e}")
    else:
        print("SEMANTIC_EMPTY")
else:
    print("NO_KEY")
