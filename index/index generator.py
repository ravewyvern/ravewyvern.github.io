import os
from pathlib import Path
import html

# Nerd Font icon map
ICON_MAP = {
    ".html": "", ".htm": "", ".css": "", ".js": "", ".ts": "",
    ".json": "", ".py": "", ".java": "", ".kt": "󱈙", ".sh": "",
    ".md": "", ".txt": "", ".zip": "", ".png": "", ".jpg": "",
    ".jpeg": "", ".gif": "", ".svg": "", ".pdf": "", ".mp3": "",
    ".wav": "", ".mp4": "", ".mov": "", ".doc": "", ".docx": "",
    ".xls": "", ".xlsx": "", ".ppt": "", ".pptx": "", ".woff2": "",
    ".ttf": "", ".otf": ""
}

FOLDER_ICON = ""
DEFAULT_FILE_ICON = ""

def get_file_icon(file_path: Path):
    return ICON_MAP.get(file_path.suffix.lower(), DEFAULT_FILE_ICON)

def generate_tree_html(root_path: Path, rel_path="..", level=0, parent_last=[]):
    entries = sorted(
        [e for e in root_path.iterdir() if not e.name.startswith('.')],
        key=lambda p: (p.is_file(), p.name.lower())
    )

    lines = []

    for i, entry in enumerate(entries):
        is_last = (i == len(entries) - 1)

        # Build prefix based on depth and last-status of ancestors
        parts = []
        for is_last_parent in parent_last:
            parts.append("         " if is_last_parent else "│                          ")
        parts.append("└── " if is_last else "├── ")
        prefix = ''.join(parts)

        display_name = html.escape(entry.name)

        if entry.is_dir():
            label = f"{prefix}<span class='folder'>{FOLDER_ICON} <strong>{display_name}</strong></span>"
            line = f"<p>{label}"
            subtree = generate_tree_html(
                entry,
                os.path.join(rel_path, entry.name),
                level + 1,
                parent_last + [is_last]
            )
            if subtree:
                line += f"\n<p>\n{subtree}\n</p>"
            line += "</p>"
            lines.append(line)
        else:
            icon = get_file_icon(entry)
            link = os.path.join(rel_path, entry.name).replace("\\", "/")
            label = f"{prefix}<span class='file'>{icon} <a href='{html.escape(link)}'>{display_name}</a></span>"
            lines.append(f"<p>{label}</p>")

    return "\n".join(lines)

def build_html_index(root_dir, output_file="index.html"):
    root_path = Path(root_dir)
    tree_html = generate_tree_html(root_path)

    html_template = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Site Index</title>
    <style>

        @font-face {{
          font-family: 'MyFont';
          src: url('FiraCodeNerdFont-Medium.ttf') format('truetype');
          font-weight: normal;
          font-style: normal;
        }}
        body {{
            font-family: 'MyFont', 'JetBrainsMono Nerd Font', monospace;
            background-color: #121212;
            color: #e0e0e0;
            padding: 20px;
        }}

        p {{
        margin: 0;
        }}
        ul {{
            list-style-type: none;
            padding-left: 1.5em;
            margin: 0;
        }}
        li {{
            line-height: 1.4em;
        }}
        a {{
            color: #6ab0f3;
            text-decoration: none;
        }}
        .folder {{
            color: #f9ae58;
        }}
        .file {{
            color: #b5bd68;
        }}
    </style>
</head>
<body>
    <h1>📁 Site Index</h1>
{tree_html}
</body>
</html>
"""
    with open(output_file, "w", encoding="utf-8") as f:
        f.write(html_template)
    print(f"✔ Site index generated at: {output_file}")

# === Usage ===
if __name__ == "__main__":
    build_html_index("../")
