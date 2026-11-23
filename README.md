# Site vitrine e-Fanamby

« Parions sur la data. » — Football analytics, made in Madagascar.
Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Phosphor Icons · polices Mozilla Text.
6 pages (Accueil, Fonctionnalités, Références, Tarifs, Contact, Essai gratuit) + 3 pages juridiques, en 4 langues (fr, en, mg, es).

**Pour modifier ou ajouter quelque chose : lire [`GUIDE.md`](GUIDE.md)** (où est chaque chose, comment la changer, comment vérifier). Les points encore à trancher sont dans [`docs/decisions.md`](docs/decisions.md).
État au 18/11/2026 : pas encore déployé. Responsive, formulaires (avec e-mail de confirmation pour l'essai gratuit et la démo) et animations légères sont codés et testés ; restent les essais réels (envoi Gmail, vrais téléphones) et les décisions ouvertes.

## Démarrer

```bash
npm install
cp .env.example .env.local      # puis renseigner les valeurs
npm run dev                     # http://localhost:3000  (redirige vers /fr)
```

Node 20.9 ou plus. Pour voir les langues en brouillon en local, ajouter `NEXT_PUBLIC_PREVIEW=1` dans `.env.local` (et `MAIL_DRY_RUN=1` pour ne rien envoyer), puis relancer `npm run dev`.

## Où se trouve quoi

Carte du dossier et recettes « je veux… → je modifie… » : voir `GUIDE.md` (sections 2 et 3). En deux lignes : les textes sont dans `src/i18n/messages/`, les couleurs dans `src/app/globals.css`, les contacts dans `src/lib/site.ts`.

Une réponse de FAQ à `null` dans `fr.ts` = réponse à rédiger : elle est masquée en production et visible (avec une mention) en mode aperçu (aucune aujourd'hui : les cinq réponses de Références sont écrites).

## Variables d'environnement

Voir `.env.example`. Obligatoires en production : `NEXT_PUBLIC_SITE_URL`, `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` (+ `SMTP_PORT`, `MAIL_FROM` si besoin).
`NEXT_PUBLIC_PREVIEW` et `MAIL_DRY_RUN` ne doivent **pas** être réglées en production.

## Tests

```bash
npm run verify         # typecheck + lint + tests unitaires, d'un coup (à lancer après chaque modification)
npm run typecheck      # TypeScript
npm run lint           # ESLint
npm test               # 93 tests unitaires (traductions, validation, e-mails, anti-spam, détail des cartes)
npm run test:e2e       # 362 tests de navigateur (Chromium) : construit le site puis le teste en mode aperçu (341), puis en mode production (21)
npm run check:launch   # liste ce qui bloque encore la mise en ligne (--strict : code de sortie 1 s'il reste un point bloquant)
npm run test:mail -- adresse@exemple.com   # envoi RÉEL d'un message à l'équipe + d'une confirmation (voir GUIDE.md, section 6)
```

Les tests de navigation couvrent : chaque page × chaque langue (statut, titres, images, absence de défilement horizontal à 16 largeurs de 320 à 1920 px, dont iPhone 15, Galaxy S24 Ultra et iPhone XR), liens internes, menu et sélecteur de langue, formulaires (erreurs, envoi, confirmation, anti-robots, clavier), animations (visibles sans JavaScript et avec « réduire les animations »), FAQ, 404, redirection selon la langue du navigateur, SEO (canonique, hreflang, noindex, sitemap, robots.txt), en-têtes de sécurité et accessibilité automatique (axe-core, WCAG 2.2 AA). La première fois : `npx playwright install chromium`.
L'accessibilité automatique et les émulations de téléphone (Chromium) ne remplacent pas un essai sur de vrais appareils (Safari iPhone surtout), au clavier et au lecteur d'écran.

## Mise en ligne (Vercel)

1. Importer le dépôt dans Vercel (framework détecté : Next.js, aucune commande à changer).
2. Settings → Environment Variables : renseigner les variables ci-dessus pour l'environnement *Production*.
3. Settings → Domains : ajouter `e-fanamby.mg` (ou `eFanamby.mg`) et créer les enregistrements DNS indiqués par Vercel chez le gestionnaire du domaine.
4. Avant de promouvoir : `npm run check:launch -- --strict` avec les variables de production chargées.

Les déploiements d'aperçu Vercel (branches) sont automatiquement fermés aux moteurs de recherche (`robots.txt`). Le déploiement de production l'est aussi tant que la variable `ALLOW_INDEXING` n'est pas réglée à `1` (interrupteur de mise en ligne, à activer le jour J seulement).

## Choix à connaître

- Langues : depuis le 20/11, français, anglais, malgache et espagnol sont ouverts (`live: true`, `src/i18n/config.ts`), les trois dernières sans relecture native. Une langue repassée à `live: false` répond 404, n'est pas dans le sitemap ni dans les hreflang ; le sélecteur l'affiche « bientôt ».
- Les icônes viennent toutes de Phosphor (`@phosphor-icons/react`). Le logo est repris tel quel.
- Les formulaires envoient un e-mail à l'adresse de l'équipe (pas de base de données) : protection par champ-piège, délai minimal de 2 s et limite de 5 envois par 10 minutes et par adresse IP (mémoire de l'instance : suffisant contre un envoi en boucle simple, pas une protection absolue). L'essai gratuit et la démo envoient en plus une confirmation à la personne (sans reprendre son texte, 2 par adresse et par heure) ; réglable dans `CONFIRMED_KINDS` (`src/lib/validation.ts`).
- Les pages sont pré-générées (`●` dans `npm run build`). Ne pas appeler `headers()` / `cookies()` dans une page, un layout ou un `not-found` : le site redeviendrait dynamique (détails dans `GUIDE.md`, section 9).
- Animations : apparition au défilement (`data-reveal`) et chiffres qui montent (`CountUp`), sans bibliothèque ; rien n'est caché sans JavaScript ni avec « réduire les animations » (`GUIDE.md`, section 8).
- Les pages Mentions légales, CGU et Confidentialité affichent un texte d'attente et sont en `noindex` tant que leur contenu n'est pas rédigé.
