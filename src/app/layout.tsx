"use client";

import './globals.css';
import ThemeRegistry from '../theme/ThemeRegistry'; // або '@/theme/ThemeRegistry'
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import breadcrumbsStyles from './breadcrumbs.module.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Add favicon and manifest links to document head
  useEffect(() => {
    // Set document title
    document.title = 'Trench Crusade Campaign';
    
    // Add meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', 'Campaign management system for Trench Crusade tabletop wargame');
    
    // Add favicon links
    const faviconLinks = [
      { rel: 'icon', href: '/favicon.ico' },
      { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
      { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
      { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
      { rel: 'manifest', href: '/site.webmanifest' }
    ];
    
    faviconLinks.forEach(linkData => {
      let link = document.querySelector(`link[rel="${linkData.rel}"]${linkData.sizes ? `[sizes="${linkData.sizes}"]` : ''}`);
      if (!link) {
        link = document.createElement('link');
        document.head.appendChild(link);
      }
      Object.entries(linkData).forEach(([key, value]) => {
        link.setAttribute(key, value);
      });
    });
    
    // Add theme color meta tag
    let themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (!themeColorMeta) {
      themeColorMeta = document.createElement('meta');
      themeColorMeta.setAttribute('name', 'theme-color');
      document.head.appendChild(themeColorMeta);
    }
    themeColorMeta.setAttribute('content', '#8B4513');
  }, []);
  // Breadcrumbs only for /app/* pages
  function Breadcrumbs() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const pathname = usePathname();
    let crumbs = [
      { label: 'Кампанії', href: '/' }
    ];
    
    if (pathname && pathname !== '/') {
      const segments = pathname.split('/').filter(Boolean);
      
      // Handle campaign-specific routes
      if (segments[0] === 'campaign' && segments[1]) {
        crumbs.push({ label: 'Кампанія', href: `/campaign/${segments[1]}` });
        
        // Add specific page labels
        if (segments[2] === 'admin') {
          crumbs.push({ label: 'Адмін-панель', href: `/campaign/${segments[1]}/admin` });
          if (segments[3] === 'about') crumbs.push({ label: 'Опис кампанії', href: pathname });
          else if (segments[3] === 'players') crumbs.push({ label: 'Гравці', href: pathname });
          else if (segments[3] === 'warbands') {
            crumbs.push({ label: 'Варбанди', href: `/campaign/${segments[1]}/admin/warbands` });
            if (segments[4] === 'stories') crumbs.push({ label: 'Історії', href: pathname });
          }
          else if (segments[3] === 'games') crumbs.push({ label: 'Баталії', href: pathname });
        } else if (segments[2] === 'warband-apply') {
          crumbs.push({ label: 'Подати ростер', href: pathname });
        } else if (segments[2] === 'table') {
          crumbs.push({ label: 'Таблиця результатів', href: pathname });
        } else if (segments[2] === 'battle') {
          crumbs.push({ label: 'Битва', href: pathname });
        } else if (segments[2] === 'players') {
          crumbs.push({ label: 'Гравці', href: pathname });
        }
      } 
      // Handle global routes
      else if (pathname === '/create-campaign') {
        crumbs.push({ label: 'Створити кампанію', href: pathname });
      } else if (pathname === '/profile') {
        crumbs.push({ label: 'Профіль', href: pathname });
      } else if (pathname === '/register') {
        crumbs.push({ label: 'Реєстрація', href: pathname });
      } else if (pathname === '/login') {
        crumbs.push({ label: 'Вхід', href: pathname });
      } else {
        // Fallback for other routes
        crumbs.push({ label: pathname.replace(/^\//, ''), href: pathname });
      }
    }
    return (
      <nav className={breadcrumbsStyles.breadcrumbs}>
        {/* Desktop breadcrumbs */}
        <div className={breadcrumbsStyles.breadcrumbsContent}>
          {crumbs.map((c, i) => c.label && c.href && (
            <span key={c.href}>
              {i > 0 && <span className={breadcrumbsStyles.breadcrumbSeparator}>/</span>}
              <Link href={c.href} className={breadcrumbsStyles.breadcrumbLink}>{c.label}</Link>
            </span>
          ))}
        </div>
        {/* Burger icon for mobile */}
        <button
          className={breadcrumbsStyles.breadcrumbsBurger}
          aria-label="Показати навігацію"
          onClick={() => setMobileOpen((v) => !v)}
        >
          <span className={breadcrumbsStyles.breadcrumbsBurgerIcon}></span>
          <span className={breadcrumbsStyles.breadcrumbsBurgerIcon}></span>
          <span className={breadcrumbsStyles.breadcrumbsBurgerIcon}></span>
        </button>
        {/* Mobile menu */}
        {mobileOpen && (
          <div className={breadcrumbsStyles.breadcrumbsMobileMenu}>
            {crumbs.map((c, i) => c.label && c.href && (
              <span key={c.href}>
                {i > 0 && <span className={breadcrumbsStyles.breadcrumbSeparator}>/</span>}
                <Link href={c.href} className={breadcrumbsStyles.breadcrumbLink} onClick={()=>setMobileOpen(false)}>{c.label}</Link>
              </span>
            ))}
          </div>
        )}
      </nav>
    );
  }  return (
    <html lang="uk">
      <body>
        <ThemeRegistry>
          <Breadcrumbs />
          {children}
        </ThemeRegistry>
      </body>
    </html>
  );
}
