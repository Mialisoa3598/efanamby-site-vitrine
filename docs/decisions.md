# Site vitrine e-Fanamby — points de décision

État au 20/11/2026, soir (v3.3). Déploiement démarré (étape 1, voir D10) ; rien n'est encore en ligne. Ce fichier a deux parties : ce qui reste à trancher (A, B), puis ce qui est déjà décidé et fait (C, D).

---

## A. Encore ouvert (par ordre d'importance)

### D7 — Écarts volontaires avec la maquette (pas de réponse le 18/11)
Je les ai assumés ; à confirmer ou à annuler :
1. case de consentement dans les formulaires (≈ +50 px de hauteur) ;
2. mention « (facultatif) » sur les champs concernés ;
3. bouton « Nous contacter » ;
4. Tarifs en vouvoiement (la maquette tutoie) ;
5. « Gestion de compétitions » ;
6. « Des questions ? » (casse) ;
7. texte des listes de prix en 10 px sur desktop (13 px sous 1280 px, depuis le 18/11) ;
8. cellules du tableau Tarifs centrées verticalement ;
9. carte Tarifs « mise en avant » = effet au survol uniquement.
- **Reco :** garder les 9 ; les n°1 et 2 sont liés au consentement (RGPD / loi malgache 2014-038), à ne pas retirer sans avis juridique.

### D8 (suite) — Contenus à confirmer
- Tableau Tarifs : cellule « Configuration tactique / Fédérations » : un tiret est maintenant affiché (18/11, ta demande) ; le tiret signifie « non », alors que le document des tarifs disait « non précisé » : à confirmer avec Nomena.
- Réponses FAQ Tarifs : déduites de la maquette, à relire.
- Contenu de l'essai gratuit Médias.
- Réponses FAQ Références : les cinq sont écrites depuis le 19/11 (soir), d'après le texte fourni par la stagiaire. À relire : la réponse « Combien de temps pour le rapport ? » (6h40 d'analyse, « 24h au plus tôt ») remplace l'ancienne (« sous 3 jours ») alors que la page Essai gratuit parle toujours de « sous 3 jours » : à harmoniser avec Nomena. Traductions anglaise et espagnole de moi ; malgache = brouillon à relire.
- Témoignage du coach Lalaina : « accord accepté » (18/11). À conserver sous forme écrite (message ou e-mail) avant la mise en ligne.

### D6 — Valeurs du design system estimées (tu les changeras toi-même dans le code)
Réponse du 18/11 : « ok, mais je changerai par moi-même dans le code si jamais ». Où les trouver :
- couleurs et rayons : bloc `@theme` en haut de `src/app/globals.css` ;
- contour de focus (vert, 3 px) : même fichier, règle `:focus-visible` ;
- couleur Warning, états erreur / succès des champs, interlignes, tailles de texte mobile, rayon 30 px, graisse « Fill » des icônes, teintes dérivées : liste complète et marquage « à confirmer » dans `docs/design-system-jetons.txt`.
- Message d'erreur des formulaires : `request-form.tsx` (texte rose clair #ffb3b3 sur fond rouge translucide). La couleur Alert #FF1D1D du design system n'y est pas utilisée en texte : son contraste sur fond clair (3,9:1) est insuffisant.

### Essais réels à faire de ton côté
1. **Envoi Gmail** : toi et Nomena avez accès au compte (D4). Créer le mot de passe d'application puis `npm run test:mail -- ton-adresse@…` (procédure dans `GUIDE.md`, section 6). Non testable depuis l'environnement de développement.
2. **Vrais téléphones** : iPhone 15, Samsung S24 Ultra, plus un iPhone XR ou un Android quelconque (D3). Safari iPhone (WebKit) n'a pas pu être testé automatiquement ici : c'est la vérification la plus importante.
3. **Relecture native** : anglais, malgache (dont le texte de l'e-mail de confirmation, brouillon), espagnol.

---

## B. À lancer tôt (délais extérieurs, avant la mise en ligne)

1. **Date de mise en ligne et validateur** (qui dit « go »).
2. **Compte Vercel et dépôt GitHub** : **décidé le 20/11** : comptes de la stagiaire pour l'instant, offre Hobby (gratuite) pour la phase de test ; à transférer à e-Fanamby avant le lancement officiel. Reste à vérifier dans les conditions Vercel que Hobby autorise un site d'entreprise (sinon Pro, ≈ 20 $/utilisateur/mois). **Adresse de test limitée à l'équipe** jusqu'au « go » ; e-mails de test depuis un Gmail personnel de la stagiaire (`MAIL_TO` = la même adresse), à remplacer avant le lancement.
3. **Nom de domaine** `e-fanamby.mg` (repli : `efanamby.mg`) : achat via un revendeur accrédité NIC.MG, puis DNS. Délai inconnu : à lancer en premier.
4. **Entité éditrice, NIF/STAT, déclaration CMIL** (loi 2014-038, art. 43 et 45) et **3 textes juridiques** (mentions légales, CGU, confidentialité). Tant qu'ils ne sont pas rédigés : pages en `noindex`. L'e-mail de confirmation et le formulaire collectent des données personnelles : la politique de confidentialité doit les couvrir.
5. **Relecteurs natifs** pour anglais, malgache, espagnol : ces langues sont **ouvertes depuis le 20/11** (`live: true`) sans relecture formelle (voir D12). Relecture à organiser en ligne ; en cas de doute sur un texte, repasser la langue à `live: false`.
6. **Mesure d'audience** : sans cookie (Plausible, Umami, Vercel Analytics) ou bandeau de consentement. Et **service d'envoi d'e-mails final** : l'envoi se fait depuis le compte Gmail (limites d'envoi, risque de classement en indésirable) ; pour la production, prévoir une adresse `contact@` sur le domaine avec SPF/DKIM.
7. **Images de partage** (Open Graph 1200×630) et **sources des photos** (liens Pexels/Pixabay, origine de « joueurs-3 » dans `docs/registre-images.txt`).
8. **Mesurer la vitesse sur un déploiement d'aperçu Vercel** (page d'accueil, mobile, réseau moyen) avant la mise en ligne : les tests automatiques ne mesurent pas la performance réelle.
9. **`npm install` affiche « 18 vulnerabilities (1 moderate, 15 high, 2 critical) »** (constaté le 18/11). Ce n'est **pas** le site : `npm audit --omit=dev` (dépendances de production) donne **0**. Les 18 alertes sont toutes dans les outils de développement :
   - **Vitest 3 et dépendances** (`vitest`, `@vitest/mocker`, `tinypool`) : 2 critiques + 1 modérée. Exploitation : il faut déjà une faille de pollution de prototype dans le même processus (tinypool) ou exposer le serveur de développement de Vitest (mocker). Un `vitest run` local sur nos propres tests n'est pas concerné.
   - **`picomatch` (4.0.7, dernière version)** et tout ce qui l'utilise (`eslint-config-next`, `typescript-eslint`, `vite`, `tinyglobby`…) : 15 « high ». Exploitation : l'attaquant doit contrôler le motif de fichiers à comparer (ReDoS). Aucun correctif n'est publié ; rien à faire pour l'instant, à revérifier de temps en temps.
   - **Ne pas lancer `npm audit fix --force`** : rétrograde `eslint-config-next` en 16.3.8 (décalé de Next 16.4.6) et passe Vitest en v5.
   - **Option testée (non appliquée)** : `npm install -D vitest@5.1.1 @types/node@^22`. Résultat sur une copie : 18 → 16 alertes (plus aucune critique ni modérée ; restent les 16 « high » de picomatch), `npm run verify` OK (80 tests). Condition : Node 22.12 ou plus récent en 22, ou Node 24+ (`node -v`), sinon Vitest 5 ne démarre pas. À faire quand tu veux ; sans urgence.

---

## C. Décidé le 18/11 et appliqué

- **D1 — Animations : option 2.** La maquette n'en contient pas, donc ajout léger : apparition douce des blocs au défilement + chiffres qui montent (Accueil, Références). Sans bibliothèque, visibles par défaut sans JavaScript, coupées avec « réduire les animations », sans décalage de mise en page. Détail : `GUIDE.md`, section 8.
- **D2 — Images sur mobile : oui, inchangé.** Seule la photo du tableau tactique (Références) est masquée sous 768 px.
- **D3 — Appareils : iPhone 15 et Samsung S24 Ultra en priorité ; le site doit rester bon sur iPhone XR, tout Android, toute largeur.** Appliqué : 16 largeurs testées (320 → 1920) sur chaque page et chaque langue, aucun débordement ; zones tactiles du pied de page, de Contact et de la FAQ agrandies sur mobile ; texte des listes Tarifs à 13 px sous 1280 px. Reste l'essai sur vrais appareils (voir A).
- **D4 — Compte Gmail : toi et Nomena y avez accès.** Procédure et script d'essai (`npm run test:mail`) prêts ; mot de passe d'application à créer par vous (jamais dans un message ni dans le code).
- **D5 — E-mail de confirmation pour l'essai gratuit : oui.** Implémenté pour l'essai gratuit **et la démo** (même formulaire) ; pas pour Contact. Choix de sécurité : aucun texte saisi n'est renvoyé, 2 confirmations max par adresse et par heure, message marqué automatique, « répondre » écrit à l'équipe ; un échec de confirmation n'empêche pas l'envoi à l'équipe. Modifiable via `CONFIRMED_KINDS` (`src/lib/validation.ts`).
- **D6 — Valeurs estimées : ok**, à changer par toi dans le code si besoin (voir A).
- **D8 (partie) — « +165 indicateurs » conservé ; « 8 matchs analysés » (au lieu de 7) ; lien Facebook renseigné** (`https://www.facebook.com/profile.php?id=61591732342702`, dans `src/lib/site.ts`). Remarque : le chiffre 8 est appliqué aux deux endroits où il figurait (Accueil « Matchs analysés » et Références « matchs PFL/CHAN annotés »). La note de mémoire du projet parlait de 155 indicateurs par match ; tu as confirmé « +165 », il est conservé tel quel.
- **D9 — Next.js 16.4.2 → 16.4.6 : fait.** Versions figées ; `npm run verify` et tous les tests de navigateur repassent (81 tests unitaires, 259 + 19 tests de navigateur au moment de D9 ; 265 + 19 depuis les retouches du 18/11 au soir ; 267 + 19 depuis le 19/11).
- **Pages servies en statique (trouvé et corrigé le 18/11).** Toutes les pages `[lang]` étaient rendues « à la demande » (`ƒ`, `Cache-Control: no-store`) au lieu d'être pré-générées. Cause : `src/app/[lang]/not-found.tsx` lisait les en-têtes du serveur (`headers()`) pour connaître la langue, ce qui rend dynamique toute la route. Correction : la langue de la page 404 est maintenant lue dans l'adresse par un petit composant (`components/sections/not-found-content.tsx`), et l'en-tête `x-locale` de `src/proxy.ts` a été supprimé. Résultat : pages `●` (pré-rendues), `Cache-Control: s-maxage=31536000` ; la 404 reste traduite dans chaque langue (testé). **Règle à retenir : ne pas appeler `headers()` ni `cookies()` dans une page, un layout ou un `not-found`**, sinon le site redevient dynamique (`npm run build` : les pages doivent rester `●`).

- **Retouches du 18/11 au soir (retour de la stagiaire, 5 points + console).**
  - Console : `suppressHydrationWarning` + `data-scroll-behavior="smooth"` sur `<html>` (l'erreur venait d'une extension de navigateur qui ajoute `webcrx` sur `<html>`).
  - Accueil : coins coupés **arrondis** comme la maquette (cartes « problèmes », photo, et par la suite Fonctionnalités et Références, voir `GUIDE.md`, « Arrondir les coins coupés »). Lueur derrière les cartes (visible aussi sur mobile, ne déborde plus sur le panneau marine). Les trois lignes « football analytics » se **déplient** (flèche cliquable) : **les textes de détail sont de moi, tirés de la page Fonctionnalités, à faire valider** (le malgache est un brouillon).
  - Fonctionnalités : image d'en-tête plus grande sur mobile.
  - Tarifs : tiret dans la cellule vide du tableau, bouton « Demander une démo » en bas à gauche avec marge, icônes alignées sur la première ligne de chaque texte (hauteur de ligne fixe).
  - Références : voile marine à 50 % sur la photo d'en-tête, légende `#POESAM2026` avec marge, **nouvelle phrase sous le titre (à valider : « présence à la cérémonie » vient de la photo de l'équipe)**, cartes de cas et photo du tableau avec les **deux** coins coupés (comme la maquette), témoignage arrondi y compris sur mobile.
  - Menu mobile : refait d'après ta maquette iPhone 13/14 (liens en bas, filets fins, flèches, croix). Écart assumé : « Se connecter », « Essai gratuit » et la langue, absents de la maquette, restent en haut du panneau pour ne rien perdre sur mobile ; à confirmer ou retirer. L'état « page courante » n'est plus en gras dans ce menu (la maquette n'en montre pas ; `aria-current` reste pour les lecteurs d'écran).
  - Test automatique : la lueur de l'Accueil débordait de la page sur petits écrans (8 tests en échec), corrigé par `overflow-x-clip` sur la section.
  - Contact : titre malgache « Andao hiresaka. ». Envoi : journaux `[form] …` dans le terminal, encadré « Mode développement » (seulement avec `npm run dev`), champ-piège renommé `hp_note` (le nom « website » pouvait être rempli par l'autocomplétion du navigateur, ce qui faisait afficher « merci » sans rien envoyer).

- **Retouches du 19/11 (essais d'envoi réels + dégradé).**
  - Envoi : `npm run test:mail` et le formulaire Contact fonctionnent en réel (Gmail SMTP, compte de test de la stagiaire ; les deux e-mails sont arrivés, texte conforme). Le compte efanamby2025 est bloqué par Google à la connexion (« Impossible de valider votre identité ») : accès à récupérer depuis l'appareil habituel (Nomena) ; en attendant, test avec un autre compte via `SMTP_USER` / `SMTP_PASS` / `MAIL_TO` (voir `GUIDE.md`, section 6). Le formulaire Contact n'envoie **pas** de confirmation : si on le souhaite, il faut un nouveau texte (4 langues) : à décider.
  - Accueil : la lueur derrière les cartes « problèmes » reprend maintenant exactement la forme de la maquette (tache violette `#411AFF` à 32 %, flou de 72 px, calée sur la grille), derrière les cartes et le panneau marine ; mobile : lueur radiale douce. Deux tests automatiques ajoutés (teinte entre les cartes, panneau marine uni).
  - Bas des pages Contact et Essai gratuit : plus de bande menthe entre la lueur verte et le pied de page, en bureau comme en responsive (la page marine s'étire jusqu'au pied de page ; fond du site marine derrière les coins arrondis du pied de page). 8 tests ajoutés (2 pages × 4 tailles d'écran).
  - Angles : tous les rayons et coupes relevés sur les maquettes (tableau dans `GUIDE.md`, « Arrondir les coins coupés ») : cartes de prix 16 px (24 avant), panneaux de formulaire 20 px (30 avant), questions fréquentes 12 px à coupe arrondie, boutons 2 / 4 px, cartes de chiffres de l'Accueil 6 px, champs 8 px à coupe arrondie, feuille claire 24 px (40 avant). Les panneaux « verre » n'ont plus de contour (absent des maquettes). 14 tests ajoutés (un par type d'élément). Totaux : 81 tests unitaires + 294 + 19 tests de navigateur.
  - **Retouches du 19/11 au soir** (demande de la stagiaire, qui prime sur les mesures prises sur les maquettes) : cartes et lignes à **16 px** (lignes « football analytics », cartes de chiffres de l'Accueil, questions fréquentes, cartes « verre » de Références et de Fonctionnalités, bandeau marine de fin de page) avec sommets de la coupe arrondis ; **tous les boutons à 10 px** (coupe conservée : 7, 10 ou 14 px selon le bouton) ; champs de formulaire à 10 px ; bouton « Demander une démo » de la photo des Tarifs déplacé **en bas à droite** ; les cinq réponses de FAQ de la page Références rédigées dans les 4 langues. Les panneaux de formulaire (20 px), le panneau marine de Fonctionnalités, les grandes cartes et la feuille claire (24 px) gardent les rayons des maquettes : à dire si ces éléments aussi doivent passer à 16 px.
  - **Retouches du 19/11 à la nuit (v3)** : la stagiaire testait encore une version ancienne (son terminal n'affichait pas « destinataire ») ; le relevé automatique de tous les blocs à angle vif sur les 9 pages (1440, 1024, 768, 390 px) a montré trois défauts réels, corrigés : (1) les **coins coupés des boutons** (violets des Tarifs, « Demander une démo », grands boutons, en-tête) étaient encore vifs : désormais **quatre coins arrondis à 10 px** sur tous les boutons, contour fin de « Voir une démo » compris ; (2) les cartes à coin coupé des Références, des Fonctionnalités et de l'Accueil (20 px) passent à **16 px** ; (3) le **tableau comparatif** des Tarifs est arrondi sur ses quatre coins (16 px). Les lignes « football analytics » de l'Accueil (qui se déplient au clic) sont arrondies à 16 px aussi ouvertes : test ajouté. Les rayons 20 / 24 / 30 px du design system restent sur les grands panneaux, la feuille claire et le pied de page (voir `GUIDE.md`).
  - **E-mail de confirmation** : la confirmation de l'essai gratuit arrive bien, mais **dans le spam chez Yahoo** (essai du 19/11). Expéditeur nommé « e-Fanamby », en-tête `Auto-Submitted: auto-generated` ; la vraie solution est une adresse du domaine avec SPF / DKIM / DMARC au lancement (voir `GUIDE.md`, section 6).
  - **Version affichée au démarrage** : `VERSION.txt` + ligne `[e-Fanamby] Version du site …` dans le terminal (et procédure « Vérifier qu'on a la dernière version » dans `GUIDE.md`) pour ne plus tester une ancienne version sans le savoir.

- **D10 — Interrupteur de mise en ligne (20/11) : fait.** Le premier déploiement sur Vercel est de type « production » même sur l'adresse *.vercel.app, ce qui aurait ouvert `robots.txt` trop tôt. `robots.txt` n'autorise désormais l'exploration que si le déploiement est de production, hors mode aperçu des langues, ET si la variable `ALLOW_INDEXING=1` est réglée (à faire le jour J seulement). Test unitaire `tests/robots.test.ts` (4 cas) ; `check:launch` signale la variable manquante comme bloquante. Totaux : 85 tests unitaires + 302 + 19 tests de navigateur (tous passés le 20/11).
- **Déploiement : démarré le 20/11, pas à pas** (feuille de route : `claude/site_vitrine_deploiement_pas_a_pas_20_11.md`, résumé dans `GUIDE.md`, section 11). Étape 1 : révoquer et recréer le mot de passe d'application Gmail (l'ancien a été collé dans une conversation), puis dépôt GitHub privé, puis premier déploiement Vercel sur l'adresse *.vercel.app, fermé aux moteurs de recherche.
- **D11 — En-tête fixe et langues en initiales (20/11) : fait.** Demande de la stagiaire pendant la relecture du menu mobile. (1) L'en-tête reste collé en haut de l'écran pendant le défilement (ordinateur et mobile) ; le panneau du menu mobile s'ouvre toujours juste dessous, même en bas de page ; les ancres s'arrêtent sous l'en-tête (`scroll-padding-top`). (2) Dans le menu mobile, les langues sont affichées en initiales « Fr En Mg Es » sur une seule ligne (avant : noms complets qui passaient à la ligne), zones tactiles de 44 px, nom complet conservé pour les lecteurs d'écran. En production, les langues non ouvertes sont grisées avec une ligne d'explication (« EN · MG · ES — bientôt »). Le menu déroulant des ordinateurs garde les noms complets (écart assumé, à dire si l'on préfère aussi les initiales). 5 tests ajoutés en aperçu (initiales à 320, 360, 390 et 430 px ; en-tête fixe en bureau et mobile ; menu ouvert après défilement ; lien d'évitement) et 1 en production. Totaux : 85 tests unitaires + 307 + 20 tests de navigateur.

- **D12 — Retours iPhone du 20/11 au soir (v3.3) : fait.** (1) **Fond sous le pied de page** : `<html>` est marine sur toutes les pages (plus de bande claire sous le footer sur iPhone), la page 404 se termine en marine comme Contact ; tests dédiés. (2) **Langues EN, MG, ES ouvertes** (`live: true`), sur demande de la stagiaire (« ça doit déjà être ok ») : sitemap à 24 adresses (6 pages × 4 langues), hreflang des quatre langues, redirection de `/` selon la langue du navigateur, e-mail de confirmation dans la langue du visiteur. Risque connu et accepté : pas de relecture native, textes malgaches et espagnols à confirmer ; retour arrière possible en repassant une langue à `live: false`. (3) **Adresse de test publique** : la protection « All Deployments » de Vercel (connexion obligatoire) est remplacée par « Standard Protection », car le site doit s'ouvrir sans compte pour les visiteurs et les clients. Conséquences à garder en tête : les formulaires envoient encore vers l'adresse Gmail de test (`MAIL_TO`) ; les pages légales sont des textes d'attente (noindex) ; `robots.txt` reste fermé (`ALLOW_INDEXING` non réglée) jusqu'au jour J.

## D. Décidé plus tôt (ne pas rouvrir)

- Prix tels que dans la maquette (« 150.000 Ar »).
- Pages légales : droit national seulement, textes d'attente, `noindex`.
- Icônes : Phosphor uniquement.
- ~~Seul le français est public~~ : remplacé le 20/11 (D12) par quatre langues publiques.
- Logo inchangé.
- Formulaires → efanamby2025@gmail.com.
- Hébergement Vercel + domaine e-fanamby.mg.
- Desktop d'abord, puis responsive.
- Déploiement pas à pas, sans date de mise en ligne officielle tant que les étapes 1 à 7 ne sont pas cochées (voir D10).
