"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Typography, CircularProgress, Alert } from "@mui/material";
import adminStyles from '../admin.module.css';

export const dynamic = "force-dynamic";

interface Game {
  id: number;
  idt: string;
  status: string;
  vp_1: number;
  vp_2: number;
  gp_1: number;
  gp_2: number;
  warbands_games_warband_1_idTowarbands: {
    id: number;
    name: string;
    players: {
      name: string;
      login: string;
    };
  };
  warbands_games_warband_2_idTowarbands: {
    id: number;
    name: string;
    players: {
      name: string;
      login: string;
    };
  };
}

export default function CampaignGamesAdmin() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState("");
  const [games, setGames] = useState<Game[]>([]);
  const router = useRouter();
  const params = useParams();
  const campaignId = params.id as string;

  useEffect(() => {
    const checkAdminAndLoadGames = async () => {
      try {
        // Check admin status
        const res = await fetch(`/api/me?campaignId=${campaignId}`);
        const data = await res.json();
        if (data.user && data.user.is_admin) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          return;
        }        // Load games for this campaign (admin view of all games)
        const gamesRes = await fetch(`/api/campaigns/${campaignId}/table/warbands`);
        const gamesData = await gamesRes.json();
        
        // Extract all unique games from all warbands
        const gameMap = new Map<number, Game>();
        if (gamesData.warbands) {
          gamesData.warbands.forEach((warband: any) => {
            if (warband.games) {
              warband.games.forEach((game: any) => {
                // Only add each game once
                if (!gameMap.has(game.id)) {
                  gameMap.set(game.id, {
                    id: game.id,
                    idt: game.idt || new Date().toISOString(),
                    status: game.status,
                    vp_1: game.vp || 0,
                    vp_2: game.opponent_vp || 0,
                    gp_1: game.gp || 0,
                    gp_2: game.opponent_gp || 0,
                    warbands_games_warband_1_idTowarbands: {
                      id: warband.id,
                      name: warband.name,
                      players: warband.players
                    },
                    warbands_games_warband_2_idTowarbands: {
                      id: 0,
                      name: game.opponent || 'Невідомий противник',
                      players: { name: game.opponent || 'Невідомий', login: '' }
                    }
                  });
                }
              });
            }
          });
        }
        setGames(Array.from(gameMap.values()));
      } catch (err) {
        console.error('Error loading games:', err);
        setError("Не вдалося завантажити дані.");
      } finally {
        setLoading(false);
      }
    };
    checkAdminAndLoadGames();
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
        <Typography variant="h4" gutterBottom>Керування іграми</Typography>
        
        <div style={{ width: '100%', marginBottom: '20px' }}>
          {games.length === 0 ? (
            <p>Немає ігор у цій кампанії.</p>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {games.map((game) => (
                <div key={game.id} style={{ 
                  padding: '20px', 
                  background: 'rgba(255,255,255,0.9)', 
                  borderRadius: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: '0 0 10px 0' }}>Гра #{game.id}</h3>
                      <p style={{ margin: '5px 0' }}>
                        <strong>Дата:</strong> {new Date(game.idt).toLocaleDateString()}
                      </p>
                      <p style={{ margin: '5px 0' }}>
                        <strong>Статус:</strong> {game.status}
                      </p>
                      <div style={{ marginTop: '15px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                          <div>
                            <strong>Загін 1:</strong> {game.warbands_games_warband_1_idTowarbands.name}<br/>
                            <small>Гравець: {game.warbands_games_warband_1_idTowarbands.players.name || game.warbands_games_warband_1_idTowarbands.players.login}</small><br/>
                            <small>VP: {game.vp_1}, GP: {game.gp_1}</small>
                          </div>
                          <div>
                            <strong>Загін 2:</strong> {game.warbands_games_warband_2_idTowarbands.name}<br/>
                            <small>Гравець: {game.warbands_games_warband_2_idTowarbands.players.name || game.warbands_games_warband_2_idTowarbands.players.login}</small><br/>
                            <small>VP: {game.vp_2}, GP: {game.gp_2}</small>
                          </div>
                        </div>
                      </div>
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
