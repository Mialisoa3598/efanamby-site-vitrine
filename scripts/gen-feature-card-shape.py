# Génère la forme des cartes « Fonctionnalités » (classe .fc de src/app/globals.css).
# Usage : python3 scripts/gen-feature-card-shape.py   -> affiche la valeur de clip-path ; la coller dans la règle « .fc ».
#
# La forme vient du modèle Figma du 23/11 (« MacBook Air - 1 », carte Multilingue de 366 × 305 px) :
# coins haut-gauche et bas-droit arrondis de 20 px, coins haut-droit et bas-gauche coupés en biais avec des sommets arrondis.
# Chaque point du tracé est ancré au coin le plus proche (distance en px depuis ce coin), donc la forme reste identique
# quelle que soit la taille de la carte : seules les distances entre coins changent.
# Les coordonnées ci-dessous sont celles du tracé « Vector 32 » du SVG, ramenées à l'origine de la carte (x - 29, y - 19).

W, H = 366.0, 305.0  # taille de la carte dans le modèle

# Tracé : liste de segments ('L', point) ou ('C', c1, c2, point), en partant de START, sens horaire inverse comme dans le SVG.
START = (317.685, 0.0)
SEGMENTS = [
    ('L', (20.0, 0.0)),
    ('C', (8.9543, 0.0), (0.0, 8.9543), (0.0, 20.0)),
    ('L', (0.0, 258.401)),
    ('C', (0.0, 263.39), (1.8646, 268.199), (5.2279, 271.884)),
    ('L', (29.5048, 298.483)),
    ('C', (33.2942, 302.634), (38.6558, 305.0), (44.277, 305.0)),
    ('L', (346.0, 305.0)),
    ('C', (357.046, 305.0), (366.0, 296.046), (366.0, 285.0)),
    ('L', (366.0, 56.2271)),
    ('C', (366.0, 51.7632), (364.507, 47.4277), (361.758, 43.9107)),
    ('L', (333.442, 7.6837)),
    ('C', (329.652, 2.8342), (323.84, 0.0), (317.685, 0.0)),
]
STEPS = 8  # points par courbe


def bez(p0, p1, p2, p3, t):
    u = 1 - t
    return tuple(u**3 * a + 3 * u * u * t * b + 3 * u * t * t * c + t**3 * d for a, b, c, d in zip(p0, p1, p2, p3))


def points():
    pts = [START]
    cur = START
    for seg in SEGMENTS:
        if seg[0] == 'L':
            pts.append(seg[1])
            cur = seg[1]
        else:
            _, c1, c2, end = seg
            for k in range(1, STEPS + 1):
                pts.append(bez(cur, c1, c2, end, k / STEPS))
            cur = end
    return pts[:-1]  # le dernier point est le premier : le polygone se referme tout seul


def coord(v, size):
    """Distance depuis le bord le plus proche : « Npx » depuis le haut/la gauche, « calc(100% - Npx) » depuis le bas/la droite."""
    if v <= size / 2:
        return f'{round(v, 2):g}px'
    d = round(size - v, 2)
    return '100%' if d == 0 else f'calc(100% - {d:g}px)'


if __name__ == '__main__':
    out = ', '.join(f'{coord(x, W)} {coord(y, H)}' for x, y in points())
    print(f'polygon({out})')
