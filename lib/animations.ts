import { Variants } from "motion/react"

// Page transitions
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
  },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
}

// Stagger children container
export const containerVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
}

// List item variants
export const itemVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.15 },
  },
}

// Card hover effect
export const cardHoverVariants: Variants = {
  rest: {
    scale: 1,
    boxShadow: "0 4px 20px oklch(0 0 0 / 5%)",
  },
  hover: {
    scale: 1.02,
    boxShadow: "0 8px 30px oklch(0 0 0 / 10%)",
    transition: { duration: 0.2 },
  },
  tap: { scale: 0.98 },
}

// Notification slide-in
export const notificationVariants: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.25, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: { duration: 0.2 },
  },
}

// Image loading fade-in
export const imageLoadVariants: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: "easeOut" },
  },
}

// Tab indicator animation
export const tabIndicatorVariants: Variants = {
  initial: { scaleX: 0, opacity: 0 },
  animate: {
    scaleX: 1,
    opacity: 1,
    transition: { duration: 0.2, ease: "easeOut" },
  },
}

// Badge pulse effect
export const badgePulseVariants: Variants = {
  initial: { scale: 1 },
  animate: {
    scale: [1, 1.1, 1],
    transition: { duration: 0.5, repeat: Infinity, repeatDelay: 3 },
  },
}

// Masonry item reveal
export const masonryItemVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
  },
}

// Form section reveal
export const formSectionVariants: Variants = {
  initial: { opacity: 0, height: 0 },
  animate: {
    opacity: 1,
    height: "auto",
    transition: { duration: 0.3, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    height: 0,
    transition: { duration: 0.2 },
  },
}

// Stats counter animation
export const statsCounterVariants: Variants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: [0.34, 1.56, 0.64, 1] },
  },
}

// Profile header slide up
export const profileHeaderVariants: Variants = {
  initial: { opacity: 0, y: 30 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
  },
}

// Avatar scale animation
export const avatarVariants: Variants = {
  initial: { scale: 0.9, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: { duration: 0.3, ease: "easeOut" },
  },
  hover: {
    scale: 1.05,
    transition: { duration: 0.2 },
  },
}

// Social link hover
export const socialLinkVariants: Variants = {
  rest: { scale: 1, y: 0 },
  hover: {
    scale: 1.1,
    y: -2,
    transition: { duration: 0.2 },
  },
}

// Dropdown menu animation
export const dropdownVariants: Variants = {
  initial: { opacity: 0, scale: 0.95, y: -10 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.15, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -10,
    transition: { duration: 0.1 },
  },
}

// Gallery fullscreen transition
export const fullscreenVariants: Variants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: { duration: 0.2 },
  },
}

// Skeleton shimmer (for loading states)
export const skeletonVariants: Variants = {
  initial: { opacity: 0.5 },
  animate: {
    opacity: [0.5, 0.8, 0.5],
    transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
  },
}

// Delete swipe animation
export const deleteSwipeVariants: Variants = {
  initial: { opacity: 1, x: 0 },
  exit: {
    opacity: 0,
    x: -100,
    transition: { duration: 0.3, ease: "easeIn" },
  },
}

// Group expand animation
export const groupExpandVariants: Variants = {
  collapsed: { height: 0, opacity: 0 },
  expanded: {
    height: "auto",
    opacity: 1,
    transition: { duration: 0.3, ease: "easeOut" },
  },
}

// Pinned post badge
export const pinnedBadgeVariants: Variants = {
  initial: { rotate: -10, scale: 0 },
  animate: {
    rotate: 0,
    scale: 1,
    transition: { duration: 0.3, ease: [0.34, 1.56, 0.64, 1] },
  },
}

// ============================================
// PREMIUM ANIMATION VARIANTS
// ============================================

// Premium post card entrance with subtle gold glow
export const premiumCardVariants: Variants = {
  initial: { opacity: 0, y: 16, scale: 0.98 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.45,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -12,
    scale: 0.98,
    transition: { duration: 0.25, ease: "easeIn" },
  },
}

// Like button heart pulse animation
export const heartPulseVariants: Variants = {
  initial: { scale: 1 },
  liked: {
    scale: [1, 1.35, 0.9, 1.15, 1],
    transition: {
      duration: 0.45,
      ease: [0.34, 1.56, 0.64, 1],
      times: [0, 0.2, 0.4, 0.7, 1],
    },
  },
}

// Profile hover card appearance
export const hoverCardVariants: Variants = {
  initial: { opacity: 0, scale: 0.92, y: 10 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.25,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 6,
    transition: { duration: 0.18, ease: "easeIn" },
  },
}

// Locked content reveal animation
export const lockedContentVariants: Variants = {
  locked: {
    filter: "blur(28px)",
    scale: 1.15,
  },
  unlocked: {
    filter: "blur(0px)",
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
}

// Premium button shimmer effect
export const buttonShimmerVariants: Variants = {
  rest: { backgroundPosition: "200% 0" },
  hover: {
    backgroundPosition: "-200% 0",
    transition: {
      duration: 1.8,
      repeat: Infinity,
      ease: "linear",
    },
  },
}

// Action button micro-interaction
export const actionButtonVariants: Variants = {
  rest: { scale: 1, rotate: 0 },
  hover: {
    scale: 1.12,
    transition: { duration: 0.2, ease: "easeOut" },
  },
  tap: {
    scale: 0.92,
    transition: { duration: 0.1 },
  },
}

// Bookmark toggle animation
export const bookmarkVariants: Variants = {
  initial: { scale: 1, rotate: 0 },
  bookmarked: {
    scale: [1, 1.3, 1.1, 1],
    rotate: [0, -8, 4, 0],
    transition: {
      duration: 0.4,
      ease: [0.34, 1.56, 0.64, 1],
    },
  },
}

// Comment section expand/collapse
export const commentSectionVariants: Variants = {
  collapsed: {
    height: 0,
    opacity: 0,
    transition: {
      height: { duration: 0.3, ease: "easeIn" },
      opacity: { duration: 0.15 },
    },
  },
  expanded: {
    height: "auto",
    opacity: 1,
    transition: {
      height: { duration: 0.35, ease: "easeOut" },
      opacity: { duration: 0.25, delay: 0.1 },
    },
  },
}

// Premium feed stagger container
export const premiumFeedContainerVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
}

// Premium feed item
export const premiumFeedItemVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
}

// Gold shimmer loader
export const goldShimmerVariants: Variants = {
  initial: { x: "-100%" },
  animate: {
    x: "100%",
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "linear",
    },
  },
}

// Premium avatar hover
export const premiumAvatarVariants: Variants = {
  rest: {
    scale: 1,
    boxShadow: "0 0 0 2.5px var(--background), 0 0 0 4px rgba(255,255,255,0.15)",
  },
  hover: {
    scale: 1.06,
    boxShadow: "0 0 0 2.5px var(--background), 0 0 0 4px var(--gold-400), 0 4px 24px rgba(184,139,74,0.25)",
    transition: { duration: 0.3, ease: "easeOut" },
  },
}

// ============================================
// LEGAL PAGES ANIMATION VARIANTS
// ============================================

// Legal section reveal with elegant easing
export const legalSectionVariants: Variants = {
  initial: { opacity: 0, y: 32 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1], // Custom cubic-bezier for premium feel
    },
  },
}

// Legal page container with stagger
export const legalContainerVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.15,
    },
  },
}

// Quick link card with lift effect
export const legalQuickLinkVariants: Variants = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  hover: {
    y: -4,
    scale: 1.02,
    transition: { duration: 0.25, ease: "easeOut" },
  },
  tap: { scale: 0.98 },
}

// Legal header with dramatic entrance
export const legalHeaderVariants: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  },
}

// Legal list item stagger
export const legalListItemVariants: Variants = {
  initial: { opacity: 0, x: -16 },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.35,
      ease: "easeOut",
    },
  },
}

// Navigation tab indicator
export const legalNavIndicatorVariants: Variants = {
  initial: { opacity: 0, scaleX: 0 },
  animate: {
    opacity: 1,
    scaleX: 1,
    transition: {
      duration: 0.3,
      ease: [0.22, 1, 0.36, 1],
    },
  },
}

// Floating TOC reveal
export const legalTocVariants: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
      delay: 0.3,
    },
  },
}

// Icon badge pulse on hover
export const legalIconVariants: Variants = {
  initial: { scale: 0.8, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: [0.34, 1.56, 0.64, 1],
    },
  },
  hover: {
    scale: 1.1,
    rotate: 5,
    transition: { duration: 0.2 },
  },
}

// Emoji picker pop animation
export const emojiPopVariants: Variants = {
  initial: { scale: 0.8, opacity: 0 },
  animate: (i: number) => ({
    scale: 1,
    opacity: 1,
    transition: {
      delay: i * 0.03,
      duration: 0.2,
      ease: [0.34, 1.56, 0.64, 1],
    },
  }),
  hover: {
    scale: 1.3,
    transition: { duration: 0.15 },
  },
  tap: { scale: 0.9 },
}

// ============================================
// STEPPER & MULTI-STEP FORM VARIANTS
// ============================================

// Step slide transition (horizontal)
export const stepSlideVariants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 100 : -100,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.35,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 100 : -100,
    opacity: 0,
    transition: { duration: 0.25 },
  }),
}

// Stepper circle animation
export const stepperCircleVariants: Variants = {
  inactive: {
    scale: 1,
    opacity: 0.6,
  },
  active: {
    scale: 1.1,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25,
    },
  },
  completed: {
    scale: 1,
    opacity: 1,
    transition: { duration: 0.2 },
  },
}

// Stepper progress line animation
export const stepperLineVariants: Variants = {
  incomplete: {
    scaleX: 0,
    originX: 0,
  },
  complete: {
    scaleX: 1,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
}

// Step content container stagger
export const stepContentVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15 },
  },
}

// Step content item
export const stepItemVariants: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
}
