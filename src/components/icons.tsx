// Seules icônes du site : Phosphor Icons (règle de la stagiaire, 16/11). Une seule porte d'entrée, avec la graisse imposée.
// Import « /ssr » : fonctionne dans les composants serveur et client.
import type { IconProps } from "@phosphor-icons/react";
import {
  ArrowDownRight as PArrowDownRight,
  ArrowRight as PArrowRight,
  ArrowUpRight as PArrowUpRight,
  ArrowsLeftRight,
  Check as PCheck,
  CaretDown as PCaretDown,
  CheckCircle,
  ChartLine,
  ChartPieSlice,
  ChartScatter,
  Envelope,
  FacebookLogo,
  FileText,
  LinkedinLogo,
  List as PList,
  ListDashes,
  Minus as PMinus,
  PersonSimpleRun,
  Play as PPlay,
  Quotes,
  SoccerBall,
  Sparkle,
  SquaresFour,
  Trophy,
  Translate,
  UserList,
  UserSquare,
  WhatsappLogo,
  X as PX,
} from "@phosphor-icons/react/ssr";

type P = Omit<IconProps, "weight">;
const a11y = { "aria-hidden": true, focusable: false } as const;

// Flèches, chevrons, menu
export const CaretDown = (p: P) => <PCaretDown weight="regular" {...a11y} {...p} />;
export const CheckCircleFill = (p: P) => <CheckCircle weight="fill" {...a11y} {...p} />;
export const MinusIcon = (p: P) => <PMinus weight="regular" {...a11y} {...p} />;
export const ArrowUpRight = (p: P) => <PArrowUpRight weight="regular" {...a11y} {...p} />;
export const ArrowUpRightBold = (p: P) => <PArrowUpRight weight="bold" {...a11y} {...p} />;
export const ArrowDownRight = (p: P) => <PArrowDownRight weight="regular" {...a11y} {...p} />;
export const ArrowRight = (p: P) => <PArrowRight weight="regular" {...a11y} {...p} />;
export const Play = (p: P) => <PPlay weight="regular" {...a11y} {...p} />;
export const Check = (p: P) => <PCheck weight="regular" {...a11y} {...p} />;
export const MenuIcon = (p: P) => <PList weight="regular" {...a11y} {...p} />;
export const CloseIcon = (p: P) => <PX weight="regular" {...a11y} {...p} />;

// Fonctionnalités (filigranes, graisse regular)
export const FeatureIcons = {
  translate: (p: P) => <Translate weight="regular" {...a11y} {...p} />,
  dashboard: (p: P) => <SquaresFour weight="regular" {...a11y} {...p} />,
  matches: (p: P) => <ListDashes weight="regular" {...a11y} {...p} />,
  stats: (p: P) => <ChartLine weight="regular" {...a11y} {...p} />,
  player: (p: P) => <UserSquare weight="regular" {...a11y} {...p} />,
  multi: (p: P) => <ChartPieSlice weight="regular" {...a11y} {...p} />,
  tactical: (p: P) => <ChartScatter weight="regular" {...a11y} {...p} />,
  report: (p: P) => <FileText weight="regular" {...a11y} {...p} />,
  players: (p: P) => <UserList weight="regular" {...a11y} {...p} />,
};

// Références, tarifs, contact (graisse fill)
export const TrophyFill = (p: P) => <Trophy weight="fill" {...a11y} {...p} />;
export const SoccerBallFill = (p: P) => <SoccerBall weight="fill" {...a11y} {...p} />;
export const PersonRunFill = (p: P) => <PersonSimpleRun weight="fill" {...a11y} {...p} />;
export const ArrowsLeftRightFill = (p: P) => <ArrowsLeftRight weight="fill" {...a11y} {...p} />;
export const QuotesFill = (p: P) => <Quotes weight="fill" {...a11y} {...p} />;
export const SparkleFill = (p: P) => <Sparkle weight="fill" {...a11y} {...p} />;
export const EnvelopeFill = (p: P) => <Envelope weight="fill" {...a11y} {...p} />;
export const LinkedinFill = (p: P) => <LinkedinLogo weight="fill" {...a11y} {...p} />;
export const WhatsappFill = (p: P) => <WhatsappLogo weight="fill" {...a11y} {...p} />;
export const FacebookFill = (p: P) => <FacebookLogo weight="fill" {...a11y} {...p} />;
