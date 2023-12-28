import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      flexBasis: {
        "1/3-gap-1": "calc(33.3% - (0.25 * 1rem))",
      },
    },
  },
  plugins: [require("daisyui"), require("tailwindcss-react-aria-components")],
} satisfies Config;
