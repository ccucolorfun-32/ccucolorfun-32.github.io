import os
from PIL import Image

VALID_EXTENSIONS = ('.jpg', '.jpeg', '.png', '.webp')

def _ensure_output_dir(output_dir):
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        print(f"created output directory: {output_dir}")

def _process_image(file_path, output_dir, quality=95, max_size=800):
    filename = os.path.basename(file_path)
    save_path = os.path.join(output_dir, filename)

    try:
        # Open image and process
        with Image.open(file_path) as img:
            icc_profile = img.info.get('icc_profile')
            exif = img.info.get('exif')
            save_profile = {}
            if icc_profile:
                save_profile['icc_profile'] = icc_profile

            # Resize to a max edge length to create a real thumbnail.
            if max(img.size) > max_size:
                img.thumbnail((max_size, max_size))

            # Save in the original format to avoid color shifts.
            fmt = (img.format or '').upper()
            if fmt in ('JPG', 'JPEG'):
                if img.mode in ('RGBA', 'P'):
                    img = img.convert('RGB')
                jpeg_kwargs = {
                    'optimize': True,
                    'quality': quality,
                    'subsampling': 0
                }
                if exif:
                    jpeg_kwargs['exif'] = exif
                img.save(save_path, 'JPEG', **jpeg_kwargs, **save_profile)
            elif fmt == 'PNG':
                img.save(save_path, 'PNG', optimize=True, **save_profile)
            elif fmt == 'WEBP':
                img.save(
                    save_path,
                    'WEBP',
                    quality=quality,
                    method=6,
                    **save_profile
                )
            else:
                img.save(save_path, **save_profile)
        
        print(f"Successful Handling: {filename}")
    except Exception as e:
        print(f"Error handling {filename}: {e}")

def compress_images(input_path, output_dir, quality=95, max_size=800):
    """
    Compress images in a directory or a single file.
    
    :param input_path: Path to an image file or images directory
    :param output_dir: Path to save the compressed images
    :param quality: Compression quality (1-95, higher means better quality but larger file size)
    """
    if not os.path.exists(input_path):
        print(f"Input path not found: {input_path}")
        return

    _ensure_output_dir(output_dir)

    if os.path.isfile(input_path):
        if input_path.lower().endswith(VALID_EXTENSIONS):
            _process_image(input_path, output_dir, quality=quality, max_size=max_size)
        else:
            print(f"Unsupported file type: {input_path}")
        return

    # iterate through all files in the input directory
    for filename in os.listdir(input_path):
        if filename.lower().endswith(VALID_EXTENSIONS):
            file_path = os.path.join(input_path, filename)
            _process_image(file_path, output_dir, quality=quality, max_size=max_size)

if __name__ == "__main__":
    import argparse
    import pathlib

    base_dir = pathlib.Path(__file__).resolve().parent
    default_input = str((base_dir / ".." / "src" / "img").resolve())
    default_output = str((base_dir / ".." / "src" / "img_thumb").resolve())

    parser = argparse.ArgumentParser(description="Compress images to JPEG thumbnails.")
    parser.add_argument("input_path", nargs="?", help="Input file or folder.")
    parser.add_argument("output_dir", nargs="?", help="Output folder for thumbnails.")
    parser.add_argument("--input", default=default_input, help="Input folder with originals.")
    parser.add_argument("--output", default=default_output, help="Output folder for thumbnails.")
    parser.add_argument("--quality", type=int, default=95, help="JPEG/WEBP quality (1-95).")
    parser.add_argument("--max-size", type=int, default=800, help="Max edge length in pixels.")
    args = parser.parse_args()

    input_path = args.input_path or args.input
    output_dir = args.output_dir or args.output
    compress_images(input_path, output_dir, quality=args.quality, max_size=args.max_size)
    print("\nDone.")
