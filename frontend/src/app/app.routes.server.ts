import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Public home page: prerendered at build time for maximum SEO performance
  { path: '', renderMode: RenderMode.Prerender },
  // Admin panel: uses Supabase Auth (localStorage) — must stay client-side only
  { path: 'admin', renderMode: RenderMode.Client },
  // Payment callback pages: need live query params, render on client
  { path: 'success', renderMode: RenderMode.Client },
  { path: 'failure', renderMode: RenderMode.Client },
  { path: 'pending', renderMode: RenderMode.Client },
  // Fallback for any other routes
  { path: '**', renderMode: RenderMode.Client },
];

