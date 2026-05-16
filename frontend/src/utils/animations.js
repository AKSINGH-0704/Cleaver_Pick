// Framer Motion variant presets for CleverPick
// Informed by UI/UX Pro Max: spring physics, 150-300ms micro-interactions,
// expo-out easing, and physical feel throughout.

// ── Easing curves ────────────────────────────────────────
export const EXPO_OUT = [0.16, 1, 0.3, 1];
export const EMPHASIZED = [0.2, 0, 0, 1];
export const SMOOTH = [0.22, 1, 0.36, 1];

// ── Entry variants ───────────────────────────────────────
export const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: SMOOTH } },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.35, ease: EXPO_OUT } },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.88 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: SMOOTH } },
};

export const springReveal = {
  hidden: { opacity: 0, scale: 0.75 },
  visible: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 200, damping: 18 } },
};

export const slideRight = {
  hidden: { opacity: 0, x: -24 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.45, ease: SMOOTH } },
};

export const slideUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 28 } },
};

// ── Stagger orchestrators ────────────────────────────────
export const stagger = (delay = 0.08, extra = {}) => ({
  hidden: {},
  visible: { transition: { staggerChildren: delay, ...extra } },
});

export const staggerFast = stagger(0.05);
export const staggerMed  = stagger(0.10);
export const staggerSlow = stagger(0.15);

// ── Model card entry ─────────────────────────────────────
export const modelCardVariant = {
  hidden: { opacity: 0, y: 28, scale: 0.94 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: 'spring', stiffness: 280, damping: 26 },
  },
};

// ── Winner morph spring ──────────────────────────────────
export const winnerSpring = { type: 'spring', stiffness: 120, damping: 20 };

// ── Micro-interaction presets (UI/UX Pro Max patterns) ───
// Buttons: spring hover to 1.04, tap to 0.96
export const buttonMotion = {
  whileHover: { scale: 1.04, transition: { type: 'spring', stiffness: 400, damping: 15 } },
  whileTap: { scale: 0.96, transition: { type: 'spring', stiffness: 500, damping: 20 } },
};

// Cards: lift + enhanced shadow on hover
export const cardHover = {
  whileHover: {
    y: -4,
    transition: { type: 'spring', stiffness: 300, damping: 20 },
  },
};

// Subtle float for "alive" elements
export const gentleFloat = {
  animate: {
    y: [0, -6, 0],
    transition: { duration: 5, repeat: Infinity, ease: 'easeInOut' },
  },
};

// Pipeline stage enter — cinematic with slight bounce
export const stageEnter = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 200, damping: 22, mass: 0.8 },
  },
  exit: {
    opacity: 0,
    y: -16,
    scale: 0.97,
    transition: { duration: 0.25, ease: EXPO_OUT },
  },
};

// Page transition
export const pageTransition = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { type: 'spring', stiffness: 300, damping: 30 },
};

// Winner dramatic reveal
export const winnerReveal = {
  hidden: { opacity: 0, scale: 0.92, y: 30 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 160,
      damping: 18,
      mass: 0.9,
      staggerChildren: 0.08,
    },
  },
};

// Rank change indicator
export const rankShift = {
  layout: true,
  transition: { type: 'spring', stiffness: 350, damping: 28 },
};
