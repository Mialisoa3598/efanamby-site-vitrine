# Guide d'utilisation — site vitrine e-Fanamby

Pour ne pas se perdre : où est chaque chose, comment la modifier, comment vérifier que rien n'est cassé.
Dernière mise à jour : 20/11/2026 (soir, version v3.3). Le site n'est **pas encore en ligne** : le code du responsive, des formulaires (avec e-mail de confirmation) et des animations est fait ; le déploiement a démarré pas à pas (section 11), les essais réels (envoi Gmail, vrais téléphones, section 10) se font sur l'adresse de test.

Autres fichiers utiles : `README.md` (résumé technique), `docs/decisions.md` (ce qu'il reste à trancher), `docs/design-system-jetons.txt` (valeurs du design system), `docs/registre-images.txt` (légende et origine de chaque photo).

---

## 1. Démarrer en 5 minutes

Il faut Node 20.9 ou plus (`node -v` pour vérifier).

```bash
npm install
```

Créer un fichier **`.env.local`** à la racine (même niveau que `package.json`) avec ces deux lignes :

```
NEXT_PUBLIC_PREVIEW=1
MAIL_DRY_RUN=1
```

Puis :

```bash
npm run dev
```

Ouvrir http://localhost:3000 (redirige vers `/fr`).

- `NEXT_PUBLIC_PREVIEW=1` ouvre aussi l'anglais, le malgache et l'espagnol (en brouillon).
- `MAIL_DRY_RUN=1` : les formulaires **n'envoient rien** (le message s'affiche seulement dans le terminal). C'est un réglage de test : pour recevoir de vrais e-mails, il faut le **retirer** (voir section 6).
- Après avoir changé `.env.local`, **arrêter et relancer** `npm run dev` (Ctrl + C, puis `npm run dev`).
- `.env.local` n'est jamais envoyé sur GitHub (déjà dans `.gitignore`). Ne jamais y mettre autre chose que ce dont on a besoin, et ne jamais coller un mot de passe dans le code.

### Vérifier qu'on a la dernière version

Après avoir remplacé les fichiers par ceux d'un nouveau zip :
1. Arrêter `npm run dev` (Ctrl + C).
2. Supprimer le dossier **`.next`** (il garde en mémoire l'ancienne version) : dans l'Explorateur, ou `rmdir /s /q .next` sous Windows (PowerShell : `Remove-Item -Recurse -Force .next`).
3. Garder son `.env.local` (le zip n'en contient pas) puis relancer `npm run dev`.
4. Regarder la **premières lignes du terminal** : `[e-Fanamby] Version du site : 19/11/2026, soir (v3) …`. Elle vient du fichier `VERSION.txt` (visible aussi à la racine du dossier). Si cette ligne est absente ou plus ancienne, les nouveaux fichiers ne sont pas en place (par exemple copiés dans un autre dossier).
5. Autre repère, côté formulaires : à chaque envoi, le terminal écrit `e-mail envoyé à l'équipe, destinataire …` (sans « destinataire », c'est une ancienne version).

---

## 2. Carte du dossier

```
site/
├─ GUIDE.md, README.md          ← ces fichiers
├─ docs/                        ← décisions, design system, registre des images
├─ public/
│  ├─ images/                   ← les photos (WebP)
│  └─ logo/                     ← logo SVG, favicon
├─ src/
│  ├─ app/
│  │  ├─ [lang]/                ← LES PAGES (un dossier = une page)
│  │  │  ├─ page.tsx            ← Accueil
│  │  │  ├─ fonctionnalites/    ├─ tarifs/   ├─ references/
│  │  │  ├─ contact/            ├─ essai-gratuit/
│  │  │  └─ mentions-legales/, cgu/, confidentialite/   ← textes d'attente
│  │  ├─ actions/send-form.ts   ← réception des formulaires (anti-spam)
│  │  ├─ globals.css            ← COULEURS, polices, rayons, styles communs
│  │  ├─ sitemap.ts, robots.ts  ← référencement
│  │  └─ global-not-found.tsx   ← 404 hors langue
│  ├─ components/
│  │  ├─ layout/                ← en-tête, pied de page, menus, scroll-reveal.tsx (apparition au défilement)
│  │  ├─ forms/                 ← formulaire (request-form.tsx) + libellés
│  │  ├─ sections/              ← blocs réutilisables (bandeau d'appel, page légale, page 404)
│  │  ├─ ui/                    ← bouton, FAQ, photo, count-up.tsx (chiffres qui « montent »)
│  │  ├─ icons.tsx              ← icônes (Phosphor)
│  │  └─ logo.tsx
│  ├─ i18n/
│  │  ├─ config.ts              ← liste des langues, lesquelles sont ouvertes
│  │  ├─ dictionaries.ts        ← charge le bon fichier de textes
│  │  └─ messages/fr|en|mg|es.ts ← TOUS LES TEXTES
│  ├─ lib/
│  │  ├─ site.ts                ← adresses des pages, contacts, destinataire
│  │  ├─ images.ts              ← liste des images + dimensions
│  │  ├─ mail.ts, validation.ts ← envoi (équipe + confirmation) et contrôle des formulaires
│  │  └─ page.ts, paths.ts      ← aides pour les pages
│  └─ proxy.ts                  ← redirection vers la bonne langue (adresse sans langue → /fr, /en…)
├─ tests/                       ← tests unitaires (rapides)
├─ e2e/                         ← tests dans un vrai navigateur
└─ scripts/                     ← check-launch.ts (liste avant mise en ligne), test-mail.ts (essai d'envoi réel), e2e.mjs
```

Règle simple : **le texte est dans `src/i18n/messages/`, l'apparence est dans la page et `globals.css`, les adresses et contacts sont dans `src/lib/site.ts`.**

---

## 3. « Je veux… → je modifie… »

### Changer un texte, un prix, un chiffre
1. Ouvrir `src/i18n/messages/fr.ts`, chercher le texte (Ctrl + F) et le changer.
2. Si c'est un **prix, un chiffre ou un sigle**, le changer **à l'identique dans les 4 fichiers** (`fr`, `en`, `mg`, `es`) : un test vérifie que les nombres sont les mêmes partout.
3. Si tu **ajoutes ou retires** une ligne (une clé, un élément d'une liste), refaire la même chose dans les 3 autres langues, sinon `npm run verify` échoue (et c'est voulu : ça évite une page à moitié traduite).
4. `npm run verify`.

### Ajouter ou modifier une question de la FAQ
Deux FAQ : Références (`references.faq`) et Tarifs (`pricing.faq`). Chaque question est `{ q: "…", a: "…" }`.
- `a: null` = réponse **pas encore écrite** : elle est masquée en production, et visible avec une mention en mode aperçu. (Depuis le 19/11 au soir, les cinq réponses de Références sont écrites : plus aucune `null` aujourd'hui.)
- Ajouter la question dans les 4 langues (au pire avec `a: null` en attendant).

### Changer une couleur, une police, un arrondi
`src/app/globals.css`, bloc `@theme` en haut. Changer la valeur **là** : tout le site suit.
Couleurs : `navy` #06062D · `green` #2FDE97 · `violet` #411AFF · `mint` #EBFFF7 · `alert` #FF1D1D. Police : Mozilla Text (fichiers dans `src/fonts/`).
Les valeurs que j'ai estimées (pas dans la maquette) sont notées « à confirmer » dans `docs/design-system-jetons.txt`.

### Arrondir les coins coupés (maquette)
Règle en vigueur (demande du 19/11 au soir) : **cartes, lignes et cartes à coin coupé à 16 px ; boutons et champs à 10 px, sur leurs QUATRE coins, y compris les coins coupés.** Elle prime sur les rayons mesurés dans les exports de la maquette. Des tests automatiques (« Angles arrondis relevés sur les maquettes ») vérifient chaque valeur ci-dessous, y compris les lignes de l'Accueil une fois ouvertes.
- **16 px** : lignes « football analytics » de l'Accueil (fermées **et ouvertes**), cartes « problèmes » et cartes de chiffres de l'Accueil, questions fréquentes (Tarifs), cartes de prix, **tableau comparatif (les quatre coins)**, section violette et panneau de photo des Tarifs, hero de Références, cartes de cas, photo du tableau et témoignage de Références, cartes « verre » de Références et de Fonctionnalités, tuiles de la grille de Fonctionnalités, bandeau marine de fin de page.
- **10 px** : tous les boutons (`src/components/ui/button.tsx`) et champs de formulaire. Coupe des boutons : 7 px (grands boutons et bouton d'en-tête, prop `tight`, sommets arrondis à 8 px), 10 px (formulaires), 14 px (haut-droit / bas-gauche des boutons violets et « Demander une démo » ; sommets arrondis à 10 px). Un test vérifie sur toutes les pages qu'aucun bouton n'a de coin vif.
- **Rayons du design system conservés** (la maquette les définit : 20, 24, 30 px ; à dire si ceux-là aussi doivent passer à 16 px) : panneaux de formulaire Contact et Essai gratuit, panneau marine de Fonctionnalités, photo « maillot » de l'Accueil : 20 px ; photo « but » de l'Accueil : 30 px ; panneau marine « football analytics » de l'Accueil, feuille claire (haut) et pied de page : 24 px.
Les panneaux « verre » n'ont plus de contour (la maquette n'en a pas).

Les cartes de la maquette ont un coin coupé **aux sommets arrondis**. Ajouter la classe `rc` à côté de `cut-tr-bl` ou `cut-br` : `className="cut-tr-bl rc rounded-[16px] … [--cut:30px] [--r:16px]"`. `--cut` = taille de la coupe, `--r` = rayon des sommets (par défaut 0,45 × `--cut`). Avec un contour fin (`lined`), un anneau suit la forme (cartes « outline » de l'Accueil et bouton « Voir une démo », `--rb` = rayon des coins droits, 16 px par défaut, 10 px pour les boutons). Le CSS correspondant (`.rc`, polygones) est **généré** par `python3 scripts/gen-rounded-cuts.py` : pour changer la forme, modifier le script et recoller sa sortie dans `globals.css`, pas les polygones à la main.

### Modifier l'en-tête fixe ou les langues du menu mobile
- **En-tête fixe** (demande du 20/11) : l'en-tête reste collé en haut de l'écran pendant le défilement, sur ordinateur et sur mobile (`src/components/layout/header.tsx`, classes `sticky top-0 z-50`). Sa hauteur (76 px) sert aussi au panneau du menu mobile (`top-[76px]` dans `mobile-menu.tsx`) et à `scroll-padding-top` dans `globals.css` : si on change la hauteur de l'en-tête, changer ces trois endroits ensemble. Pour le rendre non fixe : remplacer `sticky top-0 z-50` par `relative z-40`.
- **Langues du menu mobile** : initiales seulement (Fr En Mg Es), sur une seule ligne, zones tactiles de 44 px (`variant="list"` dans `src/components/layout/language-menu.tsx`). Le nom complet reste lu par les lecteurs d'écran et s'affiche au survol. Depuis le 20/11 les quatre langues sont ouvertes : toutes sont des liens. Si une langue est repassée à `live: false`, elle est grisée et une ligne dessous l'explique (par exemple « MG — bientôt »). Le menu déroulant des ordinateurs garde les noms complets.

### Fond sous le pied de page (bande claire sur iPhone)
Retour du 20/11 : sur iPhone (Safari), une bande claire apparaissait sous le pied de page de toutes les pages sauf Contact. Cause : `<html>` n'avait pas de fond propre, il reprenait celui de `<body>` (menthe), et Safari montre cette couleur sous le pied de page quand sa barre se replie ou au rebond du défilement. Correction dans `src/app/globals.css` : `html { background: var(--color-navy); }` pour **toutes** les pages. Le fond de `<body>` reste menthe (derrière les deux coins arrondis du pied de page) sauf sur les pages qui se terminent en marine (`.page-ends-navy` : Contact, Essai gratuit et page 404). Ne pas retirer le fond marine de `<html>`. Tests : `e2e/site.spec.ts`, « fond sous le pied de page ».

### Modifier le menu mobile
`src/components/layout/mobile-menu.tsx` (+ `nav-links.tsx` pour la ligne de lien). Il suit la maquette iPhone 13/14 du 18/11 : cinq liens ancrés en bas, lignes de 54 px espacées de 24 px, filet de 0,5 px, texte de 32 px (26 px sous 390 px), flèche ↗ de 40 px, croix de fermeture de 36 px. La maquette ne montre que les cinq liens ; « Se connecter », « Essai gratuit » et la langue sont gardés en haut du panneau (écart assumé, à confirmer). Un test (`e2e/site.spec.ts`, « Menu mobile : maquette ») vérifie ces mesures.

### Changer un contact (e-mail, WhatsApp, LinkedIn, Facebook)
`src/lib/site.ts`, bloc `CONTACT`. La page Facebook : `facebookHref` (renseigné depuis le 18/11 ; s'il est vidé, le nom s'affiche sans lien).
L'adresse qui **reçoit** les formulaires : par défaut `CONTACT.email`, ou la variable `MAIL_TO` si elle est renseignée.

### Ajouter ou remplacer une image
1. Préparer une image **WebP, moins de 200 Ko**, nom en minuscules avec des tirets, la mettre dans `public/images/`.
2. `src/lib/images.ts` : ajouter une ligne `nom: { src: "/images/fichier.webp", width: …, height: … }` avec les **dimensions réelles** (elles évitent que la page « saute » au chargement).
3. Ajouter le texte alternatif (`alt`) dans les 4 fichiers de textes, dans le bloc `alt`.
4. L'utiliser avec le composant `Photo` (voir un exemple dans `fonctionnalites/page.tsx`).
5. Noter la légende et l'origine (site, lien, licence) dans `docs/registre-images.txt`.

### Changer le logo
`src/components/logo.tsx` (celui qu'on voit sur le site) **et** les fichiers de `public/logo/` (favicon, usages externes). Le logo existe en deux endroits : les modifier ensemble.

### Ajouter une carte dans « Fonctionnalités »
⚠ Piège : les icônes et les filigranes sont associés aux cartes **par leur position dans la liste**, pas par leur nom. Dans `fonctionnalites/page.tsx`, `ICON_ORDER` et `WATERMARK` doivent avoir autant d'éléments que `features.items` (9 actuellement), dans le même ordre. De plus, la grille est dessinée pour 9 cartes : en ajouter une demande un ajustement de la mise en page.
Étapes : texte dans les 4 langues → icône dans `FeatureIcons` (`components/icons.tsx`) → ligne dans `ICON_ORDER` → ligne dans `WATERMARK`.

### Ajouter une page
1. `src/lib/site.ts` : ajouter l'adresse dans `PAGES` (et dans `NAV_KEYS` si elle va dans le menu).
2. Textes, dans les 4 langues : `seo.<clé>` (titre, description) et `nav.<clé>` si dans le menu, plus le contenu de la page.
3. Créer `src/app/[lang]/<adresse>/page.tsx` : copier `contact/page.tsx` (page simple) ou `mentions-legales/page.tsx` (page minimale).
4. Pied de page : `components/layout/footer.tsx`.
5. Référencement : ajouter la clé dans `INDEXED` de `src/app/sitemap.ts` (sinon la page n'est pas dans le sitemap).
6. `npm run verify` puis `npm run test:e2e` : les tests de navigation prennent la nouvelle page automatiquement.

### Ouvrir ou refermer une langue
**Depuis le 20/11, anglais, malgache et espagnol sont ouverts** (`live: true` dans `src/i18n/config.ts`), sur décision de la stagiaire, **sans relecture par un locuteur natif** : `npm run check:launch` le rappelle (« à valider »). Pour refermer une langue en urgence : repasser son `live` à `false` et redéployer ; elle répond alors 404, quitte le sitemap et le sélecteur l'affiche « bientôt ». Attention : le test `tests/i18n.test.ts` et les tests de production (`e2e/prod.spec.ts`) attendent quatre langues ouvertes et devront être ajustés.

### Ajouter une langue
`src/i18n/config.ts` (`LOCALES` + `LOCALE_INFO`), `src/i18n/dictionaries.ts`, nouveau fichier `src/i18n/messages/<code>.ts` (même structure que `fr.ts`).

### Changer le destinataire des formulaires
Variable `MAIL_TO` (dans `.env.local` en local, dans Vercel en production). Pas de modification du code.

### Changer le texte de l'e-mail de confirmation
Bloc `mail` de `src/i18n/messages/fr.ts` (objet, « Bonjour », message, signature…), et les mêmes clés dans les 3 autres langues. La personne reçoit l'e-mail dans la langue de la page qu'elle utilisait. Le texte du message de succès affiché sur le site est `form.successConfirmation`.

### Choisir quels formulaires envoient une confirmation
`CONFIRMED_KINDS` dans `src/lib/validation.ts` : aujourd'hui `["trial", "demo"]` (essai gratuit et démo). Ajouter `"contact"` pour que le formulaire Contact en envoie aussi une ; retirer `"demo"` pour que la démo n'en envoie pas.

### Animer un nouvel élément (apparition au défilement)
Ajouter l'attribut `data-reveal` à l'élément (et `data-reveal-delay="1"`, `"2"` ou `"3"` pour le décaler dans une rangée de cartes). Rien d'autre. Distance, durée et courbe : variables `--reveal-*` dans `globals.css`.
Pour un chiffre qui « monte » : `<CountUp value="+165" />` (composant `ui/count-up.tsx`) ; seuls les textes de la forme « préfixe + chiffres + suffixe » s'animent.

---

## 4. Vérifier que rien n'est cassé

| Commande | Ce qu'elle vérifie | Durée |
|---|---|---|
| `npm run verify` | TypeScript + règles de code + 85 tests (traductions identiques, chiffres, formulaires, e-mails) | quelques secondes |
| `npm run test:e2e` | 332 tests dans un vrai navigateur : toutes les pages × toutes les langues, 16 largeurs d'écran sans débordement, menu, formulaires, animations, FAQ, SEO, accessibilité | plusieurs minutes |
| `npm run check:launch` | liste ce qui bloque encore la mise en ligne | instantané |
| `npm run test:mail -- adresse@exemple.com` | envoie un **vrai** e-mail à l'équipe + une confirmation à l'adresse donnée (voir section 6) | quelques secondes |

À faire **après chaque modification de texte ou de code** : `npm run verify`.
À faire **avant de livrer** : `npm run test:e2e`.

Avant `test:e2e` :
- la première fois : `npx playwright install chromium` ;
- **arrêter** `npm run dev` (Ctrl + C) et **supprimer le dossier `.next`** (PowerShell : `Remove-Item -Recurse -Force .next` ; Mac/Linux : `rm -rf .next`). Les tests reconstruisent le site eux-mêmes ; un `.next` laissé par `dev` les fait échouer. Si le message de sécurité de Next.js interrompt le lancement, relancer la même commande **sans** supprimer `.next` à nouveau.

Les tests automatiques tournent dans Chromium (Chrome). Ils ne remplacent pas : un essai à la main sur de **vrais téléphones** (Safari iPhone en particulier, qui n'a pas pu être testé), un essai au clavier (touche Tab), et la relecture des textes.

---

## 5. Les langues

- Le **français** est la source. Les 3 autres suivent exactement la même structure.
- Depuis le 20/11, **les quatre langues sont publiques** (voir « Ouvrir ou refermer une langue »). La relecture native de l'anglais, du malgache et de l'espagnol reste à faire.
- Le visiteur arrivant sur `/` est dirigé vers sa langue de navigateur (en, es, mg), sinon vers le français.
- Les textes ne se « traduisent » pas tout seuls : si tu changes `fr.ts`, pense à `en`, `mg`, `es` (le test te le rappelle quand la structure change, pas quand seul le sens d'une phrase change).
- Trois textes sont en français en dur, volontairement : la page 404 hors langue (`global-not-found.tsx`), la mention « À rédiger… » visible en aperçu seulement, et l'e-mail reçu par l'équipe (`mail.ts`). L'e-mail de confirmation envoyé au visiteur, lui, est traduit (bloc `mail` des fichiers de textes) ; la version malgache est un brouillon à faire relire.

---

## 6. Les formulaires

**Comment ça marche.** Les deux formulaires (Contact, et Essai gratuit qui propose aussi une démo) envoient un e-mail à l'équipe (pas de base de données). L'objet est `[e-Fanamby] <type> – <nom>`. L'adresse de la personne est en « répondre à » : on répond directement depuis Gmail.
Protections : case de consentement obligatoire, champ-piège invisible, délai minimal de 2 secondes, 5 envois maximum par 10 minutes et par adresse IP.
⚠ Une soumission en moins de 2 secondes (ou avec le champ-piège rempli) affiche « merci » **sans rien envoyer**. Pour un essai manuel, remplir normalement.

**« Succès » affiché mais aucun e-mail reçu : que vérifier (dans cet ordre).**
1. Avec `npm run dev`, le formulaire affiche maintenant, sous le message de succès, un encadré jaune « Mode développement : … » qui donne la raison (mode test, anti-robot). Le terminal écrit aussi une ligne `[form] …` : « e-mail envoyé à l'équipe » (parti pour de vrai), « MODE TEST (MAIL_DRY_RUN=1), rien n'a été envoyé » ou « ignoré : … anti-robot ».
2. Cas le plus fréquent : `MAIL_DRY_RUN=1` est resté dans `.env.local` (section 1 le demande pour les essais sans envoi). Le retirer, renseigner `SMTP_*` (ci-dessous), puis **relancer** `npm run dev`.
3. Si le terminal dit « e-mail envoyé » : regarder les courriers **indésirables** et « Tous les messages » de efanamby2025@gmail.com. Un message envoyé depuis ce compte vers lui-même peut ne pas déclencher de notification sur le téléphone, mais il apparaît dans la boîte.
4. `npm run test:mail -- ton-adresse@…` envoie sans passer par le site et nomme la cause d'un échec.
5. **Essai gratuit / démo : deux e-mails partent, vers deux endroits différents** (depuis le 19/11 au soir, le terminal le dit ligne par ligne) : `e-mail envoyé à l'équipe, destinataire …` = la demande, qui va à `MAIL_TO` (ou, s'il est absent, à efanamby2025@gmail.com : **sans `MAIL_TO`, rien n'arrive dans la boîte de test**) ; `confirmation acceptée par le serveur d'envoi pour x***@…` = la confirmation, envoyée à l'adresse saisie dans le formulaire. Si la ligne dit `confirmation NON envoyée`, la cause est écrite (limite de 2 par adresse et par heure, ou erreur `[mail] confirmation impossible`). Si elle dit « acceptée » et que rien n'arrive : regarder les **courriers indésirables** de l'adresse saisie (Yahoo en particulier, qui range volontiers dans le spam un premier message venu d'un nouvel expéditeur), puis les **messages envoyés** de la boîte expéditrice (ils y sont tous) et sa boîte de réception (un refus du destinataire y revient sous forme d'un message « Delivery Status Notification »).
L'encadré jaune n'existe qu'avec `npm run dev` : jamais sur le site publié.

**Confirmation rangée dans les courriers indésirables (essai du 19/11, Yahoo).** L'envoi fonctionne : la confirmation arrive, mais **dans le spam** de l'adresse Yahoo. C'est attendu avec un compte Gmail personnel comme expéditeur : Yahoo ne connaît pas encore cet expéditeur, et le message est court et automatique. Déjà fait côté code : expéditeur nommé « e-Fanamby », en-tête « Auto-Submitted: auto-generated » (message automatique correctement déclaré). Ce qui règle le problème pour de bon, au lancement : (1) envoyer depuis une **adresse du domaine** (ex. contact@e-fanamby.mg, une fois le domaine acheté) ; (2) activer **SPF, DKIM et DMARC** sur ce domaine (chez l'hébergeur du domaine, ou via un service d'envoi comme Brevo, Resend ou Mailjet, qui donne les trois lignes à copier) ; (3) changer seulement `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` et `MAIL_FROM` dans les variables d'environnement. En attendant : « Ce n'est pas du spam » dans Yahoo, puis ajouter l'expéditeur aux contacts, et garder la phrase « pensez à vérifier vos courriers indésirables » affichée après l'envoi (elle l'est déjà).

**E-mail de confirmation (décision du 18/11).** Pour l'**essai gratuit** et la **démo**, la personne reçoit aussi un e-mail de confirmation, dans la langue de la page. Il ne reprend aucun texte saisi par le visiteur (pas d'usage du site pour envoyer du contenu à des tiers), il est marqué « message automatique », et « répondre » écrit à l'équipe. Maximum 2 confirmations par adresse et par heure. Si la confirmation échoue, la demande part quand même à l'équipe et le visiteur voit le message de succès simple ; la phrase « un e-mail de confirmation vous a été envoyé » ne s'affiche que s'il est réellement parti. Le formulaire **Contact** n'en envoie pas (voir `CONFIRMED_KINDS`).

**Test à blanc (sans e-mail)** : `.env.local` avec `MAIL_DRY_RUN=1`, `npm run dev`, remplir le formulaire sur `/fr/contact`. Le message apparaît dans le terminal, ligne `[mail:dry-run]`.

**Test réel (Gmail)** — à faire une fois le compte prêt (accès au compte : toi et Nomena) :
1. Sur efanamby2025@gmail.com : activer la validation en 2 étapes, puis créer un **mot de passe d'application** (16 caractères).
2. `.env.local` : supprimer `MAIL_DRY_RUN`, ajouter
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_USER=efanamby2025@gmail.com
   SMTP_PASS=<le mot de passe d'application>
   ```
3. **Essai direct, sans le site** : `npm run test:mail -- une-adresse-a-toi@exemple.com`. Il envoie un message « TEST » à l'équipe et une confirmation à l'adresse donnée, et dit clairement ce qui a marché ou non (✓ / ✗ avec la cause probable). Avec `MAIL_DRY_RUN=1`, rien n'est envoyé : les messages s'affichent dans le terminal.
4. Puis, par le site : `npm run dev`, envoyer l'**essai gratuit** et vérifier les **deux** réceptions (équipe + confirmation) et les courriers indésirables.
5. Ne jamais envoyer ce mot de passe par message ni le mettre dans un fichier du projet autre que `.env.local`.

**Si Google bloque la connexion à efanamby2025** (« Impossible de valider votre identité ») : ne pas réessayer en boucle ni passer par un VPN. Faire l'étape 1 depuis l'appareil et le navigateur déjà utilisés pour ce compte, sur le Wi-Fi habituel (Essayer autrement, puis mettre à jour le numéro de récupération). En attendant, tester avec un autre compte Gmail dont on a le contrôle : `SMTP_USER=` son adresse, `SMTP_PASS=` son mot de passe d'application et `MAIL_TO=` la même adresse (ainsi les deux e-mails arrivent dans une boîte qu'on peut ouvrir). Le code ne change pas : au passage sur efanamby2025, on remplace seulement ces trois variables (et on retire `MAIL_TO`).

**Résultat des essais réels du 19/11** (compte Gmail personnel de la stagiaire comme expéditeur et destinataire) : `npm run test:mail` envoie bien les deux e-mails (équipe + confirmation, texte conforme) ; le formulaire **Contact** envoie bien à l'équipe, y compris avec une adresse Gmail et une adresse Yahoo saisies par le visiteur (ces deux adresses ne reçoivent **rien**, c'est voulu : Contact n'envoie pas de confirmation). Reste à vérifier : l'essai gratuit et la démo par le site (deux e-mails chacun), une confirmation vers une adresse tierce (Outlook / Yahoo, pour le spam), puis le même test avec efanamby2025 une fois l'accès au compte rétabli.

⚠ Le code est couvert par des tests (85 tests unitaires, dont l'envoi simulé) ; l'envoi réel ne peut pas être fait depuis l'environnement de développement (réseau limité), il se teste sur ton ordinateur comme ci-dessus.

**À contrôler à la main sur chaque formulaire** : champs vides, e-mail invalide, trop long, case non cochée, succès (avec et sans la phrase de confirmation), erreur d'envoi (mettre un mauvais `SMTP_PASS` exprès), clavier seul, téléphone, lecteur d'écran. Sur l'essai gratuit : la confirmation arrive-t-elle, dans la bonne langue, hors spam ?

---

## 7. Le responsive

Le site a été dessiné **desktop d'abord**, puis adapté. Points d'arrêt (classes Tailwind) :

| Classe | Écran |
|---|---|
| `max-xl:` | moins de 1280 px |
| `max-lg:` | moins de 1024 px |
| `max-md:` | moins de 768 px |

Appareils visés (18/11) : **iPhone 15 (393 px)** et **Samsung Galaxy S24 Ultra (≈ 412 px)** en priorité, mais le site doit rester correct sur iPhone XR (414 px), tout Android et toute largeur de 320 à 1920 px.
Le test automatique `e2e/site.spec.ts` vérifie, pour **chaque page × chaque langue**, qu'il n'y a pas de défilement horizontal à 16 largeurs : 320, 360, 375, 390, 393, 412, 414, 430, 600, 768, 820, 1024, 1180, 1280, 1440, 1920. Il vérifie aussi que les zones tactiles (pied de page, coordonnées de Contact, liens texte) font au moins 32 px de haut, et la taille du texte des tarifs sur tablette.
Dans Chrome : F12 → icône « appareil » → choisir l'appareil ou la largeur.

Checklist par page : pas de défilement horizontal · texte lisible sans zoomer · boutons assez grands pour le doigt (viser ≈ 44 px ; le test impose 32 px au minimum) · aucune image coupée au mauvais endroit · formulaire utilisable avec le clavier du téléphone · menu qui s'ouvre et se ferme.

⚠ Limite : les tests simulent les téléphones dans Chromium. **Safari sur iPhone** (moteur WebKit) n'a pas pu être testé depuis l'environnement de développement : à vérifier sur un vrai iPhone 15 (hauteur d'écran avec la barre d'adresse, clavier qui masque un champ, zoom automatique sur les champs, défilement). Idem sur le S24 Ultra et l'iPhone XR.

Pièges déjà rencontrés : un calque en dégradé (absolu) peut se peindre **par-dessus** le contenu voisin ; les dégradés demandent des rayons en pixels sur mobile ; `overflow-hidden` et `overflow-clip` ne se comportent pas pareil ; les classes personnalisées de `globals.css` l'emportent sur les classes Tailwind.

---

## 8. Les animations

Niveau choisi le 18/11 (D1, option 2 : « léger ») : la maquette Figma ne contient pas d'animations, donc c'est un ajout sobre, sans bibliothèque.

1. **Apparition douce au défilement** : les sections et les cartes glissent de 18 px et apparaissent en 0,6 s quand elles arrivent à l'écran (`data-reveal`, composant `ScrollReveal`, réglages `--reveal-*` dans `globals.css`).
2. **Chiffres qui montent** : « +165 », « 8 » etc. sur l'Accueil et Références (`CountUp`).
3. Les micro-transitions existantes (survol des boutons, flèche du sélecteur de langue, halo vert des champs, cartes Tarifs).

Garde-fous (ne pas les casser) :
- Un élément `data-reveal` est **visible par défaut** : sans JavaScript, à l'impression, pour Google et les lecteurs d'écran, rien n'est caché. Le script ne cache que ce qui est sous la ligne de flottaison, après l'affichage de la page.
- Les chiffres contiennent déjà la **vraie valeur** dans le HTML ; l'animation est purement visuelle.
- `prefers-reduced-motion` : aucune animation pour les personnes qui ont demandé « réduire les animations ».
- Aucun décalage de mise en page : on anime seulement l'opacité et la position, jamais la taille.
- Si ça saccade sur un téléphone modeste : augmenter `--reveal-duration` n'aide pas ; **retirer `data-reveal`** des éléments concernés, ou retirer `<ScrollReveal />` de `src/app/[lang]/layout.tsx` pour tout couper d'un coup.
Des tests de navigateur vérifient : visible sans JavaScript, visible avec « réduire les animations », aucun élément resté caché après défilement, chiffres corrects à la fin.

Pour aller plus loin que ce niveau (parallaxe, terrain animé…) : c'était l'option 3 de D1, écartée pour l'instant (plus de travail, risque de lenteur sur mobile).

---

## 9. Pièges connus

- Un changement de texte en `fr.ts` peut demander 4 fichiers (prix, structure) : les tests protègent, ne les contourne pas.
- Les variables `NEXT_PUBLIC_*` sont **figées à la construction** : après changement, il faut reconstruire (`npm run build`) ou relancer `dev`.
- Le dossier `.next` est partagé entre `dev` et les tests : supprimer avant `test:e2e`.
- Limite d'envois par IP en mémoire : suffisante contre un envoi en boucle simple, pas une protection absolue (sur Vercel, chaque instance a sa propre mémoire).
- Next.js est passé en **16.4.6** le 18/11 (D9, avis de sécurité corrigé). **`npm audit` : lire le bon chiffre.** `npm audit --omit=dev` (ce qui tourne réellement sur le site) = **0 vulnérabilité**. `npm audit` tout court inclut les outils de test et de lint et signale **18 alertes** (18/11, base d'avis mise à jour depuis) : elles ne concernent que `vitest` et la chaîne `eslint-config-next` / `typescript-eslint` / `picomatch`, jamais le code envoyé aux visiteurs. **Ne pas lancer `npm audit fix --force`** : il rétrograderait `eslint-config-next` en 16.3.8 (incompatible avec Next 16.4.6) et passerait Vitest en version 5 sans prévenir. Voir `docs/decisions.md`, B9. Les versions de `next` et `eslint-config-next` sont figées dans `package.json` : ne pas les changer sans relancer `npm run verify` et `npm run test:e2e`. Si un message de sécurité de Next.js interrompt `dev`, `build` ou `test:e2e`, relancer **la même commande, sans supprimer `.next` entre les deux**.
- Avant de relancer `dev`/`build`/`test:e2e`, vérifier qu'aucun ancien serveur ne tourne encore (sinon : erreurs 500 ou « ChunkLoadError » dans le navigateur). Arrêter avec Ctrl + C dans la fenêtre du terminal concernée.
- **Ne pas appeler `headers()` ni `cookies()` dans une page, un layout ou un `not-found`.** Cela rend toutes les pages « dynamiques » (rendues à chaque visite, sans cache) : c'est ce qui était arrivé avec la page 404 (corrigé le 18/11). Contrôle : dans le tableau de `npm run build`, les pages `[lang]/…` doivent porter `●` (pré-rendues), pas `ƒ`. Seule la page « adresse inconnue » (`[...rest]`) est `ƒ`, c'est normal.
- Les icônes viennent **uniquement** de Phosphor. Pas d'autre jeu d'icônes.
- `<html>` porte `suppressHydrationWarning` et `data-scroll-behavior="smooth"` (`src/app/[lang]/layout.tsx`) : le premier évite l'erreur « hydration mismatch » causée par des extensions de navigateur qui ajoutent des attributs sur `<html>` ; le second est demandé par Next.js car le CSS active le défilement doux. Ne pas les retirer.
- La lueur de la page d'accueil (derrière les cartes « problèmes ») reprend la forme exacte de la maquette (Figma « Vector 27 ») : un tracé SVG `#411AFF` à 32 % d'opacité flouté de 72 px, calé sur la grille de cartes (`src/app/[lang]/page.tsx`, chercher `home-glow`). Pour la changer : le tracé `d`, `fillOpacity` ou `stdDeviation`. Sur mobile (cartes empilées), cette tache serait écrasée : une lueur radiale douce la remplace (`max-md`). Elle est **derrière** les cartes, et le panneau marine suivant est `relative` donc passe par-dessus : garder ce principe (pas de `blur` CSS géant sur un élément qui déborde). Un test automatique (« Accueil : lueur violette de la maquette ») vérifie qu'elle teinte le fond entre les cartes et que le panneau marine reste uni.

---

## 10. Où on en est

Fait (19/11) : 9 pages en 4 langues, formulaires par e-mail **avec confirmation pour l'essai gratuit et la démo**, animations légères, responsive vérifié de 320 à 1920 px (zones tactiles, texte, aucun débordement), contenus mis à jour (« 8 » matchs analysés, lien Facebook), Next.js 16.4.6, 85 tests unitaires, 332 tests de navigateur (311 en mode aperçu + 21 en mode production), accessibilité automatique, référencement (canonique, hreflang, sitemap, robots).

Reste **avant** de parler de déploiement :
1. Essai réel de l'envoi Gmail : **commencé le 19/11** (`test:mail` et formulaire Contact OK avec un compte de test). Reste : essai gratuit et démo par le site, confirmation vers une adresse tierce (spam), récupération de l'accès à efanamby2025 puis même test avec ce compte (section 6).
2. Essai sur de vrais téléphones : iPhone 15, Samsung S24 Ultra, iPhone XR / un Android quelconque.
3. Les réponses encore ouvertes de `docs/decisions.md` (D7, fin de D8).
4. Valeurs du design system estimées (D6) : tu les ajusteras dans le code si besoin.
5. Relecture native de l'anglais, du malgache (y compris l'e-mail de confirmation) et de l'espagnol : ces langues sont **déjà ouvertes** depuis le 20/11, la relecture se fera en ligne.

Déploiement (Vercel + e-fanamby.mg) : **démarré le 20/11, pas à pas** (section 11).

---

## 11. Mettre en ligne pas à pas

Chaque étape se termine par une case cochée avant de passer à la suivante. La feuille de route complète est dans le Project (« Déploiement pas à pas »).

1. **Sécuriser l'e-mail** : révoquer le mot de passe d'application Gmail qui a été partagé, en créer un nouveau, le mettre seulement dans `.env.local` puis, soi-même, dans Vercel.
2. **Dépôt GitHub privé** : `git init`, vérifier que `git status` ne liste pas `.env.local`, premier commit, `git push`.
3. **Premier déploiement sur Vercel** (adresse *.vercel.app) avec les variables `NEXT_PUBLIC_SITE_URL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` (+ `MAIL_TO`, `MAIL_FROM` si besoin). Ne **jamais** y mettre `NEXT_PUBLIC_PREVIEW` ni `MAIL_DRY_RUN`.
4. **Essais réels** sur cette adresse : pages, téléphones, formulaires et e-mails de confirmation.
5. **Domaine** e-fanamby.mg (revendeur accrédité NIC.MG, délai à anticiper) puis DNS dans Vercel.
6. **E-mail de domaine** (contact@…) avec SPF/DKIM/DMARC.
7. **Contenus** : textes légaux, FAQ restantes, relecture des langues.
8. **Jour J** : `npm run check:launch -- --strict` sans bloquant, puis `ALLOW_INDEXING=1` dans Vercel (Production) et nouveau déploiement ; Search Console ; réseaux sociaux.

**Protection des déploiements Vercel (décision du 20/11 au soir, remplace celle du matin).** Le site doit pouvoir être ouvert par n'importe qui avec son adresse, sans compte Vercel : Settings → Deployment Protection → **Standard Protection** (les adresses de production sont publiques ; les aperçus de branches restent protégés). Si on choisit « All Deployments », les visiteurs voient une page de connexion Vercel : à éviter. Le site reste invisible des moteurs de recherche grâce à `ALLOW_INDEXING` (ci-dessous).

**Interrupteur d'indexation.** Tant que la variable `ALLOW_INDEXING` n'est pas réglée à `1`, `robots.txt` interdit l'exploration, même sur la production : le premier déploiement sur l'adresse *.vercel.app ne sera donc pas référencé par Google. On l'active à l'étape 8, pas avant. Un test automatique (`tests/robots.test.ts`) vérifie les quatre cas (production fermée sans interrupteur, ouverte avec, aperçu fermé, mode aperçu des langues fermé).
