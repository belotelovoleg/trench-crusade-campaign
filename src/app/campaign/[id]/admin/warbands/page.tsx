"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Typography, CircularProgress, Alert } from "@mui/material";
import adminStyles from '../admin.module.css';

export const dynamic = "force-dynamic";

interface Warband {
  id: number;
  name: string;
  status: string;
  catalogue_name: string;
  player: {
    id: number;
    name: string;
    login: string;
    avatar: string | null;
  };
  latest_roster: any;
}

export default function CampaignWarbandsAdmin() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState("");
  const [warbands, setWarbands] = useState<Warband[]>([]);
  const router = useRouter();
  const params = useParams();
  const campaignId = params.id as string;

  useEffect(() => {
    const checkAdminAndLoadWarbands = async () => {
      try {
        // Check admin status
        const res = await fetch(`/api/me?campaignId=${campaignId}`);
        const data = await res.json();
        if (data.user && data.user.is_admin) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          return;
        }

        // Load warbands
        const warbandsRes = await fetch(`/api/campaigns/${campaignId}/warbands`);
        const warbandsData = await warbandsRes.json();
        setWarbands(warbandsData.warbands || []);
      } catch {
        setError("Не вдалося завантажити дані.");
      } finally {
        setLoading(false);
      }
    };
    checkAdminAndLoadWarbands();
  }, [campaignId]);

  if (loading) return (
    <div className={adminStyles.adminContainer}>
      <div style={{ minHeight: 'calc(100vh - var(--navbar-height))', minWidth: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </div>
    </div>
  );
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!isAdmin) return <Alert severity="error">Доступ лише для адміністратора.</Alert>;

  return (
    <div className={adminStyles.adminContainer}>
      <div className={adminStyles.adminCenterBox} style={{ maxWidth: '900px' }}>
        <Typography variant="h4" gutterBottom>Керування загонами</Typography>
        
        <div style={{ width: '100%', marginBottom: '20px' }}>
          {warbands.length === 0 ? (
            <p>Немає загонів у цій кампанії.</p>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {warbands.map((warband) => (
                <div key={warband.id} style={{ 
                  padding: '20px', 
                  background: 'rgba(255,255,255,0.9)', 
                  borderRadius: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ margin: '0 0 10px 0' }}>{warband.name}</h3>
                      <p style={{ margin: '5px 0' }}>
                        <strong>Гравець:</strong> {warband.player.name || warband.player.login}
                      </p>
                      <p style={{ margin: '5px 0' }}>
                        <strong>Статус:</strong> {warband.status}
                      </p>
                      <p style={{ margin: '5px 0' }}>
                        <strong>Каталог:</strong> {warband.catalogue_name}
                      </p>
                      {warband.latest_roster && (
                        <p style={{ margin: '5px 0' }}>
                          <strong>Остання гра:</strong> #{warband.latest_roster.game_number} 
                          ({warband.latest_roster.ducats} дукатів, {warband.latest_roster.glory_points} слави)
                        </p>                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {warband.player.avatar && (
                        <img 
                          src={warband.player.avatar} 
                          alt={warband.player.name || warband.player.login}
                          style={{ width: '50px', height: '50px', borderRadius: '50%' }}
                        />
                      )}
                      <button
                        onClick={() => router.push(`/campaign/${campaignId}/admin/warbands/stories?id=${warband.id}`)}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: '#1976d2',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Оповідання
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => router.push(`/campaign/${campaignId}/admin`)}
          className={adminStyles.adminMenuItem}
        >
          Назад
        </button>
      </div>
    </div>
  );
}
