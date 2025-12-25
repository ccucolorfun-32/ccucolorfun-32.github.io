import os
from PIL import Image

def compress_images(input_dir, output_dir, quality=95, max_size=800):
    """
    Compress all images in the specified directory.
    
    :param input_dir: Path to the original images directory
    :param output_dir: Path to save the compressed images
    :param quality: Compression quality (1-95, higher means better quality but larger file size)
    """
    # if output directory does not exist, create it
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        print(f"created output directory: {output_dir}")

    # the file that supports.
    valid_extensions = ('.jpg', '.jpeg', '.png', '.webp')

    # iterate through all files in the input directory
    for filename in os.listdir(input_dir):
        if filename.lower().endswith(valid_extensions):
            file_path = os.path.join(input_dir, filename)
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

if __name__ == "__main__":
    import argparse
    import pathlib

    base_dir = pathlib.Path(__file__).resolve().parent
    default_input = str((base_dir / ".." / "src" / "img").resolve())
    default_output = str((base_dir / ".." / "src" / "img_thumb").resolve())

    parser = argparse.ArgumentParser(description="Compress images to JPEG thumbnails.")
    parser.add_argument("--input", default=default_input, help="Input folder with originals.")
    parser.add_argument("--output", default=default_output, help="Output folder for thumbnails.")
    parser.add_argument("--quality", type=int, default=95, help="JPEG/WEBP quality (1-95).")
    parser.add_argument("--max-size", type=int, default=800, help="Max edge length in pixels.")
    args = parser.parse_args()

    compress_images(args.input, args.output, quality=args.quality, max_size=args.max_size)
    print("\nDone.")
