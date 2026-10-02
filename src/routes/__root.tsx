import { createRootRoute, Outlet, HeadContent, Scripts } from '@tanstack/react-router';
import { Toaster } from 'sonner';
import { type ReactNode } from 'react';
import '../styles.css';

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'A Tomar Once | Soroban Stellar' },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
      <Toaster richColors position="top-left" theme="dark" />
    </RootDocument>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className="dark">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-[#121110] text-[#FEF3C7] antialiased font-['Outfit',sans-serif]">
        {children}
        <Scripts />
      </body>
    </html>
  );
}
