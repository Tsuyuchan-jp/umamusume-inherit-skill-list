"""X投稿用の説明画像を、実スクショから組み立てる。"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ASSETS = Path(
    r"C:\Users\PC1\.cursor\projects\c-Users-PC1-Projects-umamusume-inherit-skill-list\assets"
)
SHOT1 = ASSETS / "c__Users_PC1_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-bfb062dc-629b-47cb-a78c-90c90a605bff.png"
SHOT2 = ASSETS / "c__Users_PC1_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-b03cd79e-5939-4198-88dd-226842c5d95d.png"
OUT = Path(__file__).resolve().parents[1] / "docs" / "promo"

BG = (245, 240, 232)
INK = (55, 50, 82)
MUTED = (110, 105, 125)
GOLD = (245, 207, 111)
GOLD_DEEP = (196, 150, 48)
WHITE = (255, 255, 255)
SHADOW = (40, 35, 60)

FONT_B = r"C:\Windows\Fonts\YuGothB.ttc"
FONT_M = r"C:\Windows\Fonts\YuGothM.ttc"


def font(path, size):
    return ImageFont.truetype(path, size=size, index=0)


def rounded(im, radius):
    im = im.convert("RGBA")
    mask = Image.new("L", im.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, *im.size), radius=radius, fill=255)
    im.putalpha(mask)
    return im


def shadow_card(im, radius=28, pad=18, blur=12):
    w, h = im.size
    canvas = Image.new("RGBA", (w + pad * 2, h + pad * 2), (0, 0, 0, 0))
    sh = Image.new("L", (w, h), 0)
    ImageDraw.Draw(sh).rounded_rectangle((0, 0, w - 1, h - 1), radius=radius, fill=140)
    sh = sh.filter(ImageFilter.GaussianBlur(blur))
    canvas.paste(Image.new("RGBA", (w, h), (*SHADOW, 255)), (pad + 3, pad + 8), sh)
    card = rounded(im, radius)
    canvas.paste(card, (pad, pad), card)
    return canvas


def fit_contain(im, box_w, box_h, crop_top=False):
    """box に収める。crop_top なら上優先でカバーする。"""
    im = im.convert("RGB")
    bw, bh = im.size
    if crop_top:
        scale = max(box_w / bw, box_h / bh)
        nw, nh = max(1, int(bw * scale)), max(1, int(bh * scale))
        im = im.resize((nw, nh), Image.Resampling.LANCZOS)
        left = (nw - box_w) // 2
        im = im.crop((left, 0, left + box_w, box_h))
        return im
    scale = min(box_w / bw, box_h / bh)
    nw, nh = max(1, int(bw * scale)), max(1, int(bh * scale))
    im = im.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", (box_w, box_h), WHITE)
    canvas.paste(im, ((box_w - nw) // 2, (box_h - nh) // 2))
    return canvas


def gold_badge(draw, xy, n, r=22):
    x, y = xy
    draw.ellipse((x - r, y - r, x + r, y + r), fill=GOLD, outline=GOLD_DEEP, width=2)
    f = font(FONT_B, int(r * 1.15))
    t = str(n)
    bbox = draw.textbbox((0, 0), t, font=f)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text((x - tw / 2, y - th / 2 - 2), t, font=f, fill=INK)


def draw_center_text(draw, y, text, f, fill):
    bbox = draw.textbbox((0, 0), text, font=f)
    tw = bbox[2] - bbox[0]
    # キャンバス幅は draw の image から取る
    w = draw._image.size[0]
    draw.text(((w - tw) / 2, y), text, font=f, fill=fill)


def compose_16x9():
    W, H = 1600, 900
    canvas = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(canvas)
    title_f = font(FONT_B, 54)
    sub_f = font(FONT_M, 26)
    label_f = font(FONT_B, 28)
    draw_center_text(draw, 36, "不足白スキルメーカー", title_f, INK)
    draw_center_text(draw, 108, "選ぶだけで、本育成で取れない有効白スキルが一覧に", sub_f, MUTED)

    shot1 = Image.open(SHOT1)
    shot2 = Image.open(SHOT2)
    panel_w, panel_h = 680, 620
    left_img = shadow_card(fit_contain(shot1, panel_w, panel_h), radius=24)
    right_img = shadow_card(fit_contain(shot2, panel_w, panel_h, crop_top=True), radius=24)

    y_panels = 200
    x1 = 40
    x2 = W - 40 - left_img.size[0]
    canvas.paste(left_img, (x1, y_panels), left_img)
    canvas.paste(right_img, (x2, y_panels), right_img)

    # ステップ見出し
    gold_badge(draw, (x1 + 52, 178), 1)
    draw.text((x1 + 82, 160), "コースとサポカを選ぶ", font=label_f, fill=INK)
    gold_badge(draw, (x2 + 52, 178), 2)
    draw.text((x2 + 82, 160), "不足スキルが一覧表示", font=label_f, fill=INK)

    # 中央の矢印
    ax = W // 2
    ay = y_panels + left_img.size[1] // 2
    draw.polygon(
        [(ax - 28, ay - 22), (ax + 18, ay), (ax - 28, ay + 22)],
        fill=GOLD,
        outline=GOLD_DEEP,
    )
    return canvas


def scale_to_width(im, width):
    """横幅に合わせて拡大縮小する（余白のレターボックスを付けない）。"""
    w, h = im.size
    nw = width
    nh = max(1, round(h * (nw / w)))
    return im.resize((nw, nh), Image.Resampling.LANCZOS)


def crop_shot1_cards():
    """コースパネルと編成パネルを別々に切り、隙間のページ余白を除く。"""
    im = Image.open(SHOT1).convert("RGB")
    # ページ端と U-tools リンク行を落とし、中身だけ残す
    course = im.crop((10, 8, 1014, 248))
    deck = im.crop((10, 304, 1014, 528))
    return course, deck


def crop_shot2_panel():
    """結果パネルの左右余白を切り、コピーボタン〜リスト先頭を残す。"""
    im = Image.open(SHOT2).convert("RGB")
    return im.crop((10, 8, 1014, 508))


def compose_3x4():
    W, H = 1080, 1440
    canvas = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(canvas)
    draw_center_text(draw, 28, "不足白スキルメーカー", font(FONT_B, 46), INK)
    draw_center_text(
        draw,
        90,
        "選ぶだけで、本育成で取れない有効白スキルが一覧に",
        font(FONT_M, 23),
        MUTED,
    )

    inner_w = 992
    course, deck = crop_shot1_cards()
    result = crop_shot2_panel()

    gold_badge(draw, (68, 160), 1, r=20)
    draw.text((96, 144), "コースとサポカを選ぶ", font=font(FONT_B, 28), fill=INK)

    y = 178
    for piece, radius in ((course, 22), (deck, 22)):
        card = shadow_card(scale_to_width(piece, inner_w), radius=radius, pad=14, blur=10)
        canvas.paste(card, ((W - card.size[0]) // 2, y), card)
        y += card.size[1] + 2

    ax, ay = W // 2, y + 10
    draw.polygon(
        [(ax - 20, ay), (ax + 20, ay), (ax, ay + 26)],
        fill=GOLD,
        outline=GOLD_DEEP,
    )

    y = ay + 40
    gold_badge(draw, (68, y + 16), 2, r=20)
    draw.text((96, y), "不足スキルが一覧表示", font=font(FONT_B, 28), fill=INK)
    y += 36

    remain = H - y - 18
    result_scaled = scale_to_width(result, inner_w)
    if result_scaled.size[1] > remain - 20:
        result_scaled = result_scaled.crop((0, 0, inner_w, remain - 20))
    card2 = shadow_card(result_scaled, radius=22, pad=14, blur=10)
    canvas.paste(card2, ((W - card2.size[0]) // 2, y), card2)
    return canvas


def compose_square(step, title, src, crop_top=False):
    W, H = 1200, 1200
    canvas = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(canvas)
    gold_badge(draw, (90, 78), step, r=28)
    draw.text((128, 52), title, font=font(FONT_B, 40), fill=INK)
    shot = Image.open(src)
    card = shadow_card(fit_contain(shot, 1080, 1000, crop_top=crop_top), radius=28)
    canvas.paste(card, ((W - card.size[0]) // 2, 130), card)
    return canvas


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    compose_16x9().save(OUT / "x-promo-16x9.jpg", quality=90, optimize=True)
    compose_3x4().save(OUT / "x-promo-3x4.jpg", quality=90, optimize=True)
    compose_square(1, "コースとサポカを選ぶ", SHOT1).save(
        OUT / "x-promo-step1.jpg", quality=90, optimize=True
    )
    compose_square(2, "不足スキルが一覧表示", SHOT2, crop_top=True).save(
        OUT / "x-promo-step2.jpg", quality=90, optimize=True
    )
    print("wrote", OUT)


if __name__ == "__main__":
    main()
