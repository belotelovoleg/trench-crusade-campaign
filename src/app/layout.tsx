"use client";

import './globals.css';
import ThemeRegistry from '../theme/ThemeRegistry'; // або '@/theme/ThemeRegistry'
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useState } from 'react';
import breadcrumbsStyles from './breadcrumbs.module.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Breadcrumbs only for /app/* pages
  function Breadcrumbs() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const pathname = usePathname();
    let crumbs = [
      { label: 'Головна', href: '/' }
    ];
    if (pathname && pathname.startsWith('/admin')) {
      crumbs.push({ label: 'Адмін-панель', href: '/admin' });
      if (pathname !== '/admin') {
        // Визначаємо підсторінку
        let sub = '';
        if (pathname === '/admin/warbands') sub = 'Варбанди';
        else if (pathname === '/admin/players') sub = 'Гравці';
        else if (pathname === '/admin/about') sub = 'Опис кампанії';
        else sub = pathname.replace('/admin/', '');
        crumbs.push({ label: sub, href: pathname });
      }
    } else if (pathname && pathname !== '/') {
      let label = '';
      if (pathname === '/warband-apply') label = 'Подати ростер';
      else if (pathname === '/profile') label = 'Профіль';
      else if (pathname === '/register') label = 'Реєстрація';
      else if (pathname === '/table') label = 'Таблиця результатів';
      else if (pathname === '/battle') label = 'Битва'; // ДОДАНО для breadcrumbs
      else label = pathname.replace(/^\//, '');
      crumbs.push({ label, href: pathname });
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
  }
  return (
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
