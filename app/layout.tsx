import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OmniChat — Multimodal AI Workspace",
  description: "ChatGPT-style multimodal AI assistant with multi-provider orchestration.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" data-theme="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('omnichat-theme');
                  var theme = (saved === 'light' || saved === 'dark') ? saved : 'dark';
                  document.documentElement.classList.remove('dark', 'light');
                  document.documentElement.classList.add(theme);
                  document.documentElement.setAttribute('data-theme', theme);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased bg-chatbg text-textPrimary min-h-screen">
        {children}
      </body>
    </html>
  );
}
