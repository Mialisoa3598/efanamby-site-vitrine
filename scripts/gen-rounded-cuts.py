# Génère le CSS des coins coupés arrondis (classe .rc de src/app/globals.css).
# Usage : python3 scripts/gen-rounded-cuts.py   -> affiche le CSS ; remplacer le bloc « Coins coupés ARRONDIS » de globals.css par cette sortie.
# Principe : chaque sommet de la coupe (virage de 45°) devient un arc de rayon --r (5 points), calculé en fonction de --cut ;
# l'anneau du contour fin (.lined) est le même tracé, décalé de --lw vers l'intérieur.
import math, sys

# Longueur symbolique = dict {'pct': n (n*100%), 'c': k, 'r': k, 'rb': k, 'bw': k}
def L(**k): return {a: b for a, b in k.items() if b}
def add(*ls):
    out = {}
    for l in ls:
        for a, b in l.items(): out[a] = out.get(a, 0) + b
    return {a: b for a, b in out.items() if abs(b) > 1e-9}
def sc(l, k): return {a: b * k for a, b in l.items()}

VARS = {'c': 'var(--cut,{cfb})', 'r': 'var(--r)', 'rb': 'var(--rb,16px)', 'bw': 'var(--lw,1px)'}

def fmt(l, cfb):
    terms = []
    for key in ('pct', 'c', 'r', 'rb', 'bw'):
        v = l.get(key, 0)
        if abs(v) < 1e-9: continue
        if key == 'pct':
            terms.append(('100%', v))
        else:
            terms.append((VARS[key].format(cfb=cfb), v))
    if not terms: return '0px'
    if len(terms) == 1 and terms[0][1] == 1: return terms[0][0]
    s = ''
    for i, (t, v) in enumerate(terms):
        v = round(v, 4)
        if t == '100%':
            term = t if v == 1 else f'{t} * {v:g}' if v > 0 else f'{t} * {v:g}'
            # 100% * -1 pas valide partout : on écrit 100% seul (v vaut 1) ou 0.
            term = '100%'
        else:
            term = t if v == 1 else f'{t} * {v:g}'
        if i == 0: s = term if v >= 0 or t != '100%' else term
        else: s += ' + ' + term
    return f'calc({s})'

def U(a):  # direction unitaire, cap en degrés (0 = haut, 90 = droite), repère y vers le bas
    r = math.radians(a); return (math.sin(r), -math.cos(r))

def arc(V, a0, a1, R, n):
    """Points de l'arc d'un virage horaire a0 -> a1 au sommet V (V = (x,y) symboliques), rayon R symbolique."""
    d = (a1 - a0) % 360
    t = math.tan(math.radians(d / 2))
    u0, u1 = U(a0), U(a1)
    # T0 = V - t*R*u0 ; centre = T0 + R*right0 ; right0 = (cos a0, sin a0)
    r0 = (math.cos(math.radians(a0)), math.sin(math.radians(a0)))
    pts = []
    for k in range(n + 1):
        phi = math.radians(d) * k / n
        # centre - R*right0 tourné de phi, offset relatif à V (en unités de R)
        cx = -t * u0[0] + r0[0]; cy = -t * u0[1] + r0[1]
        vx, vy = -r0[0], -r0[1]
        px = cx + vx * math.cos(phi) - vy * math.sin(phi)
        py = cy + vx * math.sin(phi) + vy * math.cos(phi)
        pts.append((add(V[0], sc(R, px)), add(V[1], sc(R, py))))
    return pts

def shape(kind, ins, cc, rr, rbb, round90, cfb):
    """kind: 'tr-bl' | 'br'. Retourne la liste de points (x, y) symboliques, sens horaire."""
    P = L(pct=1)
    Lx = ins; Rx = add(P, sc(ins, -1)); Ty = ins; By = add(P, sc(ins, -1))
    zero = {}
    pts = []
    def corner90(V, a0, a1):
        if round90: pts.extend(arc(V, a0, a1, rbb, 6))
        else: pts.append(V)
    def corner45(V, a0, a1): pts.extend(arc(V, a0, a1, rr, 4))
    if kind == 'tr-bl':
        corner90((Lx, Ty), 0, 90)
        corner45((add(Rx, sc(cc, -1)), Ty), 90, 135)
        corner45((Rx, add(Ty, cc)), 135, 180)
        corner90((Rx, By), 180, 270)
        corner45((add(Lx, cc), By), 270, 315)
        corner45((Lx, add(By, sc(cc, -1))), 315, 360)
    elif kind == 'br':
        corner90((Lx, Ty), 0, 90)
        corner90((Rx, Ty), 90, 180)
        corner45((Rx, add(By, sc(cc, -1))), 180, 225)
        corner45((add(Rx, sc(cc, -1)), By), 225, 270)
        corner90((Lx, By), 270, 360)
    return pts

def poly(pts, cfb):
    return ', '.join(f'{fmt(x, cfb)} {fmt(y, cfb)}' for x, y in pts)

def main_polygon(kind, cfb):
    return 'polygon(' + poly(shape(kind, {}, L(c=1), L(r=1), L(rb=1), False, cfb), cfb) + ')'

def ring_polygon(kind, cfb):
    outer = shape(kind, {}, L(c=1), L(r=1), L(rb=1), True, cfb)
    inner = shape(kind, L(bw=1), L(c=1, bw=-0.5858), L(r=1, bw=-1), L(rb=1, bw=-1), True, cfb)
    # Le contour intérieur est refermé sur son premier point : le trait de liaison (extérieur -> intérieur) est parcouru dans les deux sens, sans filet parasite.
    return 'polygon(evenodd, ' + poly(outer, cfb) + ', ' + poly(outer[:1], cfb) + ', ' + poly(inner, cfb) + ', ' + poly(inner[:1], cfb) + ')'

if __name__ == '__main__':
    css = []
    css.append('/* ---------- Coins coupés ARRONDIS (maquette) : classe .rc à ajouter à .cut-tr-bl ou .cut-br. ----------\n   Fichier généré (polygone dont chaque sommet de coupe est remplacé par un arc de rayon --r, 5 points par arc).\n   --r vaut 0,45 × --cut par défaut ; --rb = rayon des coins droits (comme rounded-[…]) pour le contour .lined. */')
    css.append('@layer components {\n  .rc { --r: calc(var(--cut, 14px) * 0.45); }\n}')
    css.append('.cut-tr-bl.rc {\n  clip-path: ' + main_polygon('tr-bl', '14px') + ';\n}')
    css.append('.cut-br.rc {\n  clip-path: ' + main_polygon('br', '12px') + ';\n}')
    css.append('/* Contour fin d\'une carte arrondie à fond translucide : anneau dessiné par ::before (le contour suit la forme). */\n.cut-tr-bl.rc.lined { border: 0; }\n.cut-tr-bl.rc.lined::after { display: none; }\n.cut-tr-bl.rc.lined::before {\n  inset: 0; width: auto; height: auto; transform: none;\n  clip-path: ' + ring_polygon('tr-bl', '14px') + ';\n}')
    css.append('/* Même contour pour un bouton à coin coupé bas-droit (bouton « Voir une démo » de l\'accueil) : anneau dessiné par ::after. */\n.cut-br.rc.lined { border: 0; }\n.cut-br.rc.lined::after {\n  inset: 0; width: auto; height: auto; transform: none;\n  clip-path: ' + ring_polygon('br', '12px') + ';\n}')
    sys.stdout.write('\n'.join(css) + '\n')
