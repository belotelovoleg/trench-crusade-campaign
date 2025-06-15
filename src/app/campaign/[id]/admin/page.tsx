"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Typography, Box, CircularProgress, Alert } from "@mui/material";
import adminStyles from './admin.module.css';

export const dynamic = "force-dynamic";

export default function CampaignAdminHome() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const params = useParams();
  const campaignId = params.id as string;

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const res = await fetch(`/api/me?campaignId=${campaignId}`);
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
  }, [campaignId]);

  if (loading) return (
    <div className={adminStyles.adminContainer}>
        <div className={adminStyles.adminCenterBox}>
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
            onClick={() => router.push(`/campaign/${campaignId}/admin/about`)}
            className={adminStyles.adminMenuItem}
          >
            Редагувати інформацію про кампанію
          </button>
          <button
            type="button"
            onClick={() => router.push(`/campaign/${campaignId}/admin/players`)}
            className={adminStyles.adminMenuItem}
          >
            Керування гравцями
          </button>
          <button
            type="button"
            onClick={() => router.push(`/campaign/${campaignId}/admin/warbands`)}
            className={adminStyles.adminMenuItem}
          >
            Керування загонами
          </button>
          <button
            type="button"
            onClick={() => router.push(`/campaign/${campaignId}/admin/games`)}
            className={adminStyles.adminMenuItem}
          >
            Керування іграми
          </button>
        </div>
      </div>
    </div>
  );
}
