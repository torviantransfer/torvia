from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
MASTER_SIZE = 1024


def point(value: float) -> int:
    return round(value * MASTER_SIZE / 1024)


def cubic(start, control_one, control_two, end, steps: int = 48):
    points = []
    for step in range(steps + 1):
        progress = step / steps
        inverse = 1 - progress
        points.append((
            point(inverse ** 3 * start[0] + 3 * inverse ** 2 * progress * control_one[0] + 3 * inverse * progress ** 2 * control_two[0] + progress ** 3 * end[0]),
            point(inverse ** 3 * start[1] + 3 * inverse ** 2 * progress * control_one[1] + 3 * inverse * progress ** 2 * control_two[1] + progress ** 3 * end[1]),
        ))
    return points


def rounded_rectangle(draw: ImageDraw.ImageDraw, bounds, radius: int, **kwargs) -> None:
    draw.rounded_rectangle(tuple(point(value) for value in bounds), radius=point(radius), **kwargs)


def polygon(draw: ImageDraw.ImageDraw, coordinates, **kwargs) -> None:
    draw.polygon([(point(x), point(y)) for x, y in coordinates], **kwargs)


def gradient(size: int, top, bottom) -> Image.Image:
    image = Image.new("RGBA", (size, size))
    draw = ImageDraw.Draw(image)
    for y in range(size):
        progress = y / (size - 1)
        color = tuple(round(top[index] + (bottom[index] - top[index]) * progress) for index in range(4))
        draw.line((0, y, size, y), fill=color)
    return image


def draw_logo() -> Image.Image:
    canvas = Image.new("RGBA", (MASTER_SIZE, MASTER_SIZE), (0, 0, 0, 0))
    outline = ImageDraw.Draw(canvas)

    shadow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    rounded_rectangle(shadow_draw, (18, 24, 1006, 1012), 216, fill=(0, 0, 0, 180))
    canvas.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(point(14))), (0, point(5)))

    rounded_rectangle(outline, (24, 24, 1000, 1000), 210, fill=(3, 14, 31, 255), outline=(17, 211, 220, 255), width=point(7))
    rounded_rectangle(outline, (39, 39, 985, 985), 196, outline=(39, 86, 158, 230), width=point(2))

    glow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    glow_draw.ellipse((point(180), point(28), point(830), point(555)), fill=(27, 77, 160, 86))
    rounded_mask = Image.new("L", canvas.size, 0)
    rounded_rectangle(ImageDraw.Draw(rounded_mask), (28, 28, 996, 996), 206, fill=255)
    glow = glow.filter(ImageFilter.GaussianBlur(point(72)))
    glow.putalpha(Image.composite(glow.getchannel("A"), Image.new("L", canvas.size, 0), rounded_mask))
    canvas.alpha_composite(glow)

    white_t = [
        (151, 231), (894, 231), (800, 368), (607, 368),
        (517, 556), (182, 861), (283, 652), (421, 368), (104, 368),
    ]
    white_mask = Image.new("L", canvas.size, 0)
    polygon(ImageDraw.Draw(white_mask), white_t, fill=255)
    white_gradient = gradient(MASTER_SIZE, (255, 255, 255, 255), (218, 223, 230, 255))
    canvas.alpha_composite(Image.composite(white_gradient, Image.new("RGBA", canvas.size), white_mask))

    cyan_path = [(435, 858)]
    cyan_path += cubic((435, 858), (456, 742), (578, 670), (679, 538))
    cyan_path += cubic((679, 538), (743, 454), (779, 355), (805, 291))
    cyan_path += cubic((805, 291), (766, 409), (679, 564), (576, 679))
    cyan_path += cubic((576, 679), (518, 753), (497, 809), (507, 858))
    cyan_mask = Image.new("L", canvas.size, 0)
    ImageDraw.Draw(cyan_mask).polygon(cyan_path, fill=255)
    cyan_gradient = gradient(MASTER_SIZE, (26, 220, 229, 255), (0, 169, 181, 255))
    canvas.alpha_composite(Image.composite(cyan_gradient, Image.new("RGBA", canvas.size), cyan_mask))

    white_swoosh = cubic((510, 563), (631, 488), (722, 407), (813, 280))
    white_swoosh += list(reversed(cubic((526, 614), (625, 552), (705, 469), (813, 280))))
    polygon(ImageDraw.Draw(canvas), white_swoosh, fill=(248, 250, 252, 255))

    dash_draw = ImageDraw.Draw(canvas)
    polygon(dash_draw, [(284, 822), (345, 822), (314, 858), (252, 858)], fill=(245, 248, 252, 255))
    polygon(dash_draw, [(407, 730), (465, 718), (430, 757), (371, 757)], fill=(245, 248, 252, 255))
    polygon(dash_draw, [(495, 645), (540, 635), (515, 663), (471, 663)], fill=(245, 248, 252, 255))
    polygon(dash_draw, [(565, 592), (595, 584), (577, 606), (547, 606)], fill=(245, 248, 252, 255))

    return canvas


def save_icon(image: Image.Image, path: Path, size: int) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.resize((size, size), Image.Resampling.LANCZOS).save(path, format="PNG", optimize=True)


def main() -> None:
    icon = draw_logo()
    save_icon(icon, ROOT / "src" / "app" / "icon.png", 512)
    save_icon(icon, ROOT / "src" / "app" / "apple-icon.png", 180)
    save_icon(icon, ROOT / "public" / "images" / "icon-192.png", 192)
    save_icon(icon, ROOT / "public" / "images" / "icon-512.png", 512)
    icon.save(
        ROOT / "src" / "app" / "favicon.ico",
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
    )


if __name__ == "__main__":
    main()