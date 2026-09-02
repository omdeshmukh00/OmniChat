/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        chatbg: "var(--bg-primary)",
        sidebar: "var(--bg-sidebar)",
        composer: "var(--bg-composer)",
        surface: "var(--bg-surface)",
        surfaceHover: "var(--bg-surface-hover)",
        surfaceElevated: "var(--bg-surface-elevated)",
        borderSubtle: "var(--border-subtle)",
        borderStrong: "var(--border-strong)",
        textPrimary: "var(--text-primary)",
        textSecondary: "var(--text-secondary)",
        textMuted: "var(--text-muted)",
        accent: "var(--accent)",
        accentHover: "var(--accent-hover)",
        codeBg: "var(--code-bg)",
        cardBg: "var(--card-bg)",
        cardBorder: "var(--card-border)",
        cardHoverBg: "var(--card-hover-bg)",
        cardHoverBorder: "var(--card-hover-border)",
        inputBg: "var(--input-bg)",
        inputBorder: "var(--input-border)",
        inputText: "var(--input-text)",
        inputPlaceholder: "var(--input-placeholder)",
        dropdownBg: "var(--dropdown-bg)",
        dropdownHover: "var(--dropdown-hover)",
        userMsgBg: "var(--user-msg-bg)",
        userMsgText: "var(--user-msg-text)",
        userMsgBorder: "var(--user-msg-border)",
      },
    },
  },
  plugins: [],
};

