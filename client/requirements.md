## Packages
framer-motion | Page transitions and scroll-triggered animations for the landing page
date-fns | Human-readable date formatting for articles and stories

## Notes
Tailwind Config - extend fontFamily:
fontFamily: {
  sans: ["Inter", "sans-serif"],
  serif: ["Lora", "serif"],
}

The application relies on `@shared/routes` and `@shared/schema` for the API contracts. 
Authentication is handled via the Replit Auth integration (`@/hooks/use-auth`).
