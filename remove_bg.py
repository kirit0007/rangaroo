import sys
from PIL import Image, ImageFilter

def remove_white_background(input_path, output_path, tolerance=15):
    img = Image.open(input_path).convert("RGBA")
    width, height = img.size
    pixels = img.load()

    # Flood-fill from corners to replace white background with transparent
    visited = set()
    queue = [(0, 0), (width - 1, 0), (0, height - 1), (width - 1, height - 1)]

    for x in range(width):
        queue.append((x, 0))
        queue.append((x, height - 1))
    for y in range(height):
        queue.append((0, y))
        queue.append((width - 1, y))

    while queue:
        x, y = queue.pop(0)
        if (x, y) in visited:
            continue
        visited.add((x, y))

        r, g, b, a = pixels[x, y]
        # Check if pixel is near white
        if r >= 240 and g >= 240 and b >= 240:
            pixels[x, y] = (0, 0, 0, 0)
            
            # Check 4 neighbors
            for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                nx, ny = x + dx, y + dy
                if 0 <= nx < width and 0 <= ny < height and (nx, ny) not in visited:
                    queue.append((nx, ny))

    img.save(output_path, "PNG")
    print(f"Saved transparent image to {output_path}")

if __name__ == "__main__":
    remove_white_background("public/logo.png", "public/logo_transparent.png")
    remove_white_background("public/rangoo.png", "public/rangoo_transparent.png")
