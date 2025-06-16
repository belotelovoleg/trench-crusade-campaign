"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Button,
  Avatar,
  Typography,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  Paper,
  Box,
  CircularProgress,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import DownloadIcon from "@mui/icons-material/Download";
import StarIcon from "@mui/icons-material/Star";
import Slider from "@mui/material/Slider";
import FACTION_AVATARS from "../../../factionAvatars";

export const dynamic = "force-dynamic";

interface Player {
  id: number;
  name?: string;
  login: string;
  avatar_url?: string;
  notes?: string;
  warbands?: Warband[];
}

interface Warband {
  id: number;
  name: string;
  status: string;
  catalogue_name?: string;
  rosters?: Roster[];
}

interface Roster {
  id: number;
  game_number?: number;
  model_count: number;
  ducats: number;
  glory_points: number;
}

export default function PlayersPage() {
  const params = useParams();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [notesDialog, setNotesDialog] = useState<{
    open: boolean;
    notes: string;
    player: string;
  }>({ open: false, notes: "", player: "" });
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sliderValue, setSliderValue] = useState<{ [warbandId: number]: number }>({});
  useEffect(() => {
    const campaignId = params.id as string;
    if (!campaignId) return;

    fetch(`/api/campaigns/${campaignId}/players`)
      .then((res) => res.json())
      .then((data) => {
        setPlayers(data.players || []);
        const sliderDefaults: { [warbandId: number]: number } = {};
        (data.players || []).forEach((player: Player) => {
          (player.warbands || []).forEach((wb: Warband) => {
            if (wb.rosters && wb.rosters.length > 0) {
              sliderDefaults[wb.id] = wb.rosters.length - 1;
            }
          });
        });
        setSliderValue(sliderDefaults);
      })
      .finally(() => setLoading(false));
  }, [params.id]);  const filteredPlayers = players
    .filter((player) => {
      if (statusFilter === "all") return true;
      // When filtering by specific status, only show players who have warbands with that status
      return player.warbands?.some((wb) => wb.status === statusFilter);
    })
    .map((player) => ({
      ...player,
      warbands:
        statusFilter === "all"
          ? player.warbands
          : player.warbands?.filter((wb) => wb.status === statusFilter) || [],
    }));
  const renderStatusIcon = (status: string) => {
    const statusConfig = {
      active: {
        icon: "🟢",
        title: "Активна",
      },
      checking: {
        icon: "👁️",
        title: "На перевірці",
      },
      needs_update: {
        icon: "⚠️",
        title: "Потребує оновлення ростеру",
      },
      deleted: {
        icon: "💀",
        title: "Видалена",
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.deleted;

    return (
      <Tooltip title={config.title} arrow placement="top">
        <span style={{ fontSize: "1.1em", cursor: "default" }} role="img" aria-label={config.title}>
          {config.icon}
        </span>
      </Tooltip>
    );
  };  if (loading) {
    return (
      <div className="consistentLoadingContainer">
        <CircularProgress />
      </div>
    );
  }

  if (filteredPlayers.length === 0 && statusFilter === "all") {
    return (
      <div className="consistentBackgroundContainer" style={{ justifyContent: 'center' }}>
        <Paper
          sx={{
            p: 4,
            textAlign: "center",
            backgroundColor: "rgba(255, 255, 255, 0.85)",
            backdropFilter: "blur(8px)",
            borderRadius: "16px",
            maxWidth: "500px",
          }}
        >
          <Typography variant="h5" sx={{ mb: 2 }}>
            Немає гравців у цій кампанії.
          </Typography>
        </Paper>
      </div>
    );  }

  return (
    <div className="consistentBackgroundContainer">
      <Box
        sx={{
          maxWidth: 900,
          margin: { xs: "16px auto", sm: "0px auto" },
          padding: { xs: 1, sm: 2 },
          width: '100%'
        }}
      >
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "stretch", sm: "center" },
          mb: 3,
          gap: { xs: 2, sm: 0 },
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            fontSize: { xs: "1.5rem", sm: "2rem" },
            textAlign: { xs: "center", sm: "left" },
          }}
        >
          Гравці кампанії
        </Typography>
        <Box
          sx={{
            backgroundColor: "rgba(255, 255, 255, 0.85)",
            padding: "8px",
            borderRadius: "16px",
            alignSelf: { xs: "stretch", sm: "auto" },
            backdropFilter: "blur(8px)",
          }}
        >
          <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 200 } }}>
            <InputLabel>Статус варбанди</InputLabel>
            <Select
              value={statusFilter}
              label="Статус варбанди"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">Усі статуси</MenuItem>
              <MenuItem value="active">Активна</MenuItem>
              <MenuItem value="checking">На перевірці</MenuItem>
              <MenuItem value="needs_update">Потребує оновлення ростеру</MenuItem>
              <MenuItem value="deleted">Видалена</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>      <List>
        {filteredPlayers.map((player) => (
          <Paper
            key={player.id}
            sx={{
              mb: 2,
              p: 1,
              boxShadow: 3,
              borderRadius: "20px",
              backgroundColor: "rgba(255, 255, 255, 0.5)",
              backdropFilter: "blur(10px)",
            }}
          >            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1.5,
                flexWrap: "wrap",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>                <Avatar
                  src={
                    player.avatar_url
                      ? `/api/avatar/${player.avatar_url}`
                      : "/api/avatar/default"
                  }
                  sx={{ width: 40, height: 40 }}
                />
                <Typography variant="h6" sx={{ fontSize: "1rem", fontWeight: 600 }}>
                  {player.name || player.login}
                </Typography>
              </Box>              {player.notes && (
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<InfoIcon />}
                  onClick={() =>
                    setNotesDialog({
                      open: true,
                      notes: player.notes || "",
                      player: player.name || player.login,
                    })
                  }
                >
                  Переглянути нотатки
                </Button>
              )}
            </Box>{player.warbands && player.warbands.length > 0 && (
              <Box sx={{ mt: 1 }}>
                {player.warbands.map((wb) => {
                  const rosterCount = wb.rosters?.length || 0;
                  const value = sliderValue[wb.id] ?? 0;                  const marks = (wb.rosters || []).map((r, idx) => ({
                    value: idx,
                    label: "",
                  }));
                  const rosterToShow =
                    wb.rosters && wb.rosters.length > 0 ? wb.rosters[value] : null;

                  return (
                    <Box
                      key={wb.id}
                      sx={{
                        mb: 1,
                        p: 1,
                        borderRadius: "12px",
                        backgroundColor: "rgba(247, 247, 250, 0.8)",
                        backdropFilter: "blur(5px)",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          flexWrap: "wrap",
                          mb: rosterToShow ? 1 : 0,
                        }}
                      >
                        {wb.catalogue_name && FACTION_AVATARS[wb.catalogue_name] && (
                          <Tooltip title={wb.catalogue_name} arrow>
                            <Avatar
                              src={FACTION_AVATARS[wb.catalogue_name]}
                              sx={{ width: 24, height: 24 }}
                            />
                          </Tooltip>
                        )}
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: 600,
                            fontSize: "0.9rem",
                          }}
                        >
                          {wb.name}
                        </Typography>
                        {renderStatusIcon(wb.status)}
                      </Box>

                      {wb.rosters && wb.rosters.length > 0 && (
                        <Box>                          {rosterCount > 0 && (                            <Box sx={{ display: "flex", justifyContent: "center", mb: 1 }}>
                              <Slider
                                min={0}
                                max={Math.max(0, rosterCount - 1)}
                                step={1}
                                value={value}                                marks={marks}
                                onChange={(_, v) =>
                                  setSliderValue((s) => ({ ...s, [wb.id]: v as number }))
                                }
                                sx={{
                                  width: "80%",
                                  "& .MuiSlider-markLabel": {
                                    fontSize: { xs: "0.6rem", sm: "0.75rem" },
                                  },
                                }}
                                disabled={rosterCount <= 1}
                              />
                            </Box>
                          )}{rosterToShow && (
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 1.5,
                                flexWrap: "wrap",
                                p: 0.5,
                                borderRadius: "8px",
                                backgroundColor: "rgba(255, 255, 255, 0.9)",
                              }}
                            >                              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>                                <Tooltip title="Кількість моделей" arrow>
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.3 }}>
                                    <img src="/soldier.svg" alt="models" style={{ width: 16, height: 16 }} />
                                    <Typography variant="body2" sx={{ fontWeight: "bold", fontSize: "0.85rem", color: "primary.main" }}>
                                      {rosterToShow.model_count}
                                    </Typography>
                                  </Box>
                                </Tooltip>                                <Tooltip title="Дукати" arrow>
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.3 }}>
                                    <img src="/coin.svg" alt="ducats" style={{ width: 16, height: 16 }} />
                                    <Typography variant="body2" sx={{ fontWeight: "bold", fontSize: "0.85rem", color: "primary.main" }}>
                                      {rosterToShow.ducats}
                                    </Typography>
                                  </Box>
                                </Tooltip>                                <Tooltip title="Слава (GP)" arrow>
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.3 }}>
                                    <img src="/medal.svg" alt="glory" style={{ width: 16, height: 16 }} />
                                    <Typography variant="body2" sx={{ fontWeight: "bold", fontSize: "0.85rem", color: "primary.main" }}>
                                      {rosterToShow.glory_points}
                                    </Typography>
                                  </Box>
                                </Tooltip>
                              </Box>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                {rosterCount > 1 && (
                                  <Typography variant="caption" sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
                                    Гра: {rosterToShow.game_number || value + 1}
                                  </Typography>
                                )}                                <Tooltip title="Завантажити ростер" arrow>
                                  <Button
                                    size="small"
                                    variant="contained"
                                    color="primary"
                                    onClick={() =>
                                      window.open(
                                        `/api/campaigns/${params.id}/rosters/${rosterToShow.id}`,
                                        "_blank"
                                      )
                                    }
                                  >
                                    <DownloadIcon />
                                  </Button>
                                </Tooltip>
                              </Box>
                            </Box>
                          )}
                        </Box>
                      )}
                    </Box>
                  );
                })}
              </Box>
            )}
          </Paper>
        ))}
      </List>

      <Dialog
        open={notesDialog.open}
        onClose={() => setNotesDialog({ open: false, notes: "", player: "" })}
      >
        <DialogTitle>Нотатки гравця: {notesDialog.player}</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
            {notesDialog.notes}
          </Typography>
        </DialogContent>        <DialogActions>
          <Button
            onClick={() => setNotesDialog({ open: false, notes: "", player: "" })}
          >
            Закрити
          </Button>
        </DialogActions>
      </Dialog>
      </Box>
    </div>
  );
}
