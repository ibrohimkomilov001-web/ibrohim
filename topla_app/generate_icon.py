from PIL import Image, ImageDraw
import math


def create_app_icon(size=1024, save_path="app_icon.png"):
    """Professional TOPLA icon — shopping bag with T cutout"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    s = size / 1024.0

    # Rich orange gradient background (#FF8800 → #E85500)
    for y in range(size):
        p = y / max(size - 1, 1)
        r = int(255 - p * 23)
        g = int(136 - p * 51)
        b = int(0)
        draw.line([(0, y), (size - 1, y)], fill=(r, g, b, 255))

    # Rounded corners mask
    corner_r = int(224 * s)
    mask = Image.new('L', (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        [(0, 0), (size - 1, size - 1)], radius=corner_r, fill=255
    )
    img.putalpha(mask)

    # Draw white shopping bag
    white = (255, 255, 255, 255)
    cx = size // 2
    _draw_bag_body(draw, cx, s, white)
    _draw_handle(draw, cx, s, white)

    # Draw T inside bag (orange = "cutout" effect)
    orange_mid = (255, 110, 0, 255)
    _draw_t_inside(draw, cx, s, orange_mid)

    img.save(save_path, "PNG")
    print(f"Created: {save_path} ({size}x{size})")
    return img


def create_foreground_icon(size=1024, save_path="app_icon_foreground.png"):
    """Adaptive icon foreground — bag with T cutout on transparent bg"""
    s = size / 1024.0
    cx = size // 2

    # Build alpha mask: bag shape minus T shape
    alpha = Image.new('L', (size, size), 0)
    adraw = ImageDraw.Draw(alpha)

    # Bag body (opaque = 255)
    _draw_bag_body(adraw, cx, s, 255)
    # Handle (opaque)
    _draw_handle(adraw, cx, s, 255)
    # T cutout (transparent = 0)
    _draw_t_inside(adraw, cx, s, 0)

    # White image with alpha mask
    img = Image.new('RGBA', (size, size), (255, 255, 255, 255))
    img.putalpha(alpha)

    img.save(save_path, "PNG")
    print(f"Created: {save_path} ({size}x{size})")
    return img


# ── Shared drawing helpers ──────────────────────────────────────


def _draw_bag_body(draw, cx, s, fill):
    """White shopping bag body — rounded rectangle"""
    bag_w = int(460 * s)
    bag_h = int(410 * s)
    bag_x = cx - bag_w // 2
    bag_y = int(380 * s)
    bag_r = int(48 * s)
    draw.rounded_rectangle(
        [(bag_x, bag_y), (bag_x + bag_w, bag_y + bag_h)],
        radius=bag_r, fill=fill
    )


def _draw_handle(draw, cx, s, fill):
    """Smooth semicircular bag handle"""
    half_w = int(120 * s)
    height = int(135 * s)
    base_y = int(380 * s)
    thickness = int(42 * s)

    steps = 80
    pts = []
    for i in range(steps + 1):
        a = math.pi * i / steps
        x = cx - half_w * math.cos(a)
        y = base_y - height * math.sin(a)
        pts.append((int(x), int(y)))

    for i in range(len(pts) - 1):
        draw.line([pts[i], pts[i + 1]], fill=fill, width=thickness)

    # Round end-caps
    cap_r = thickness // 2
    for p in [pts[0], pts[-1]]:
        draw.ellipse(
            [p[0] - cap_r, p[1] - cap_r, p[0] + cap_r, p[1] + cap_r],
            fill=fill
        )


def _draw_t_inside(draw, cx, s, fill):
    """Bold T letter positioned inside the bag area"""
    bag_y = int(380 * s)

    # T cross-bar
    bar_w = int(280 * s)
    bar_h = int(72 * s)
    bar_x = cx - bar_w // 2
    bar_y = bag_y + int(80 * s)
    bar_r = int(14 * s)

    # T vertical stem
    stem_w = int(76 * s)
    stem_h = int(245 * s)
    stem_x = cx - stem_w // 2
    stem_y = bar_y

    draw.rounded_rectangle(
        [(bar_x, bar_y), (bar_x + bar_w, bar_y + bar_h)],
        radius=bar_r, fill=fill
    )
    draw.rounded_rectangle(
        [(stem_x, stem_y), (stem_x + stem_w, stem_y + stem_h)],
        radius=bar_r, fill=fill
    )


if __name__ == "__main__":
    import os
    base = os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        "assets", "icon"
    )
    os.makedirs(base, exist_ok=True)

    create_app_icon(1024, os.path.join(base, "app_icon.png"))
    create_foreground_icon(1024, os.path.join(base, "app_icon_foreground.png"))

    print("\nDone! Now run:")
    print("  flutter pub run flutter_launcher_icons")

