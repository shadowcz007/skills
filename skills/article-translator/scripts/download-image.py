#!/usr/bin/env python3
"""Download image from URL and save to local directory."""

import sys
import os
import urllib.request
from urllib.error import URLError, HTTPError


def download_image(url: str, save_path: str, filename: str = None) -> str:
    """
    Download image from URL to save_path.

    Args:
        url: Image URL
        save_path: Directory to save image
        filename: Optional custom filename (default: extracted from URL)

    Returns:
        Local filename of saved image
    """
    if not os.path.exists(save_path):
        os.makedirs(save_path)

    if not filename:
        # Extract filename from URL
        filename = url.split('/')[-1].split('?')[0]
        if not filename or '.' not in filename:
            filename = f"image_{hash(url)}.jpg"

    local_path = os.path.join(save_path, filename)

    try:
        urllib.request.urlretrieve(url, local_path)
        return filename
    except (URLError, HTTPError) as e:
        print(f"Failed to download {url}: {e}", file=sys.stderr)
        return None


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: download-image.py <url> <save_path> [filename]", file=sys.stderr)
        sys.exit(1)

    url = sys.argv[1]
    save_path = sys.argv[2]
    filename = sys.argv[3] if len(sys.argv) > 3 else None

    result = download_image(url, save_path, filename)
    if result:
        print(result)
    else:
        sys.exit(1)
