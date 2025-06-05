"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Typography, Box, CircularProgress, Alert } from "@mui/material";
import adminStyles from './admin.module.css';

export default function AdminHome() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const res = await fetch("/api/me");
        const data = await res.json();
        if (data.user && data.user.is_admin) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch {
        setError("Не вдалося перевірити права адміністратора.");
      } finally {
        setLoading(false);
      }
    };
    checkAdmin();
  }, []);

  if (loading) return (
    <div className={adminStyles.adminContainer}>
      <div style={{ minHeight: '100vh', minWidth: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </div>
    </div>
  );
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!isAdmin) return <Alert severity="error">Доступ лише для адміністратора.</Alert>;

  return (
    <div className={adminStyles.adminContainer}>
      <div className={adminStyles.adminCenterBox}>
        <Typography variant="h4" gutterBottom>Адмін-панель</Typography>
        <div>
          <button
            type="button"
            onClick={()=>router.push("/admin/about")}
            className={adminStyles.adminMenuItem}
          >
            Опис кампанії
          </button>
          <button
            type="button"
            onClick={()=>router.push("/admin/players")}
            className={adminStyles.adminMenuItem}
          >
            Гравці
          </button>
          <button
            type="button"
            onClick={()=>router.push("/admin/warbands")}
            className={adminStyles.adminMenuItem}
          >
            Варбанди
          </button>
          {/* Додати інші адмін-дії тут */}
        </div>
      </div>
    </div>
  );
}
