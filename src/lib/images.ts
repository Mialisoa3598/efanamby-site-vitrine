// Images optimisées (WebP, <200 Ko). Dimensions réelles des fichiers : elles évitent tout décalage de mise en page au chargement.
export const IMG = {
  jersey: { src: "/images/maillot-academie-fanamby.webp", width: 1704, height: 581 },
  notebook: { src: "/images/analyste-notes-carnet.webp", width: 540, height: 460 },
  goal: { src: "/images/but-de-football-vue-aerienne.webp", width: 1016, height: 1116 },
  laptopHands: { src: "/images/analyse-match-ordinateur.webp", width: 1834, height: 1222 },
  audienceFederation: { src: "/images/joueurs-equipe-de-nuit.webp", width: 430, height: 1078 },
  audienceMedia: { src: "/images/journalistes-photographes.webp", width: 430, height: 1078 },
  audienceClub: { src: "/images/joueur-dossard-academie.webp", width: 430, height: 1078 },
  ceremony: { src: "/images/ceremonie-poesam-2026.webp", width: 2272, height: 1005 },
  tacticalBoard: { src: "/images/tableau-tactique-terrain.webp", width: 1116, height: 460 },
  handshake: { src: "/images/poignee-de-main-partenariat.webp", width: 1800, height: 784 },
  keyboard: { src: "/images/mains-clavier-ordinateur.webp", width: 982, height: 1152 },
  pitch: { src: "/images/joueurs-sur-le-terrain.webp", width: 2560, height: 1710 },
  laptopPlatform: { src: "/images/ordinateur-plateforme-efanamby.webp", width: 836, height: 927 },
  ball: { src: "/images/ballon-etoiles.webp", width: 314, height: 314 },
} as const;
export type ImageKey = keyof typeof IMG;
