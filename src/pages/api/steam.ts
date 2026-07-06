import type { APIRoute } from "astro";

interface SteamPlayerSummary {
  steamid: string;
  personastate: number;
  gameextrainfo?: string;
  gameid?: string;
}

interface SteamRecentlyPlayedGame {
  appid: number;
  name: string;
  playtime_2weeks: number;
  playtime_forever: number;
  img_icon_url: string;
}

interface GetPlayerSummariesResponse {
  response: {
    players: SteamPlayerSummary[];
  };
}

interface GetRecentlyPlayedGamesResponse {
  response: {
    total_count: number;
    games: SteamRecentlyPlayedGame[];
  };
}

export interface CleanedGameData {
  isPlaying: boolean;
  gameName: string | null;
  playTime: string | null;
  gameIcon: string | null;
  status: "online" | "offline" | "ingame";
  recentlyPlayed: {
    appid: number;
    name: string;
    playTime: string;
    iconUrl: string | null;
  }[];
}

const fallbackData: CleanedGameData = {
  isPlaying: false,
  gameName: null,
  playTime: null,
  gameIcon: null,
  status: "offline",
  recentlyPlayed: [],
};

function formatPlayTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours} 小时 ${mins} 分钟`;
  }
  return `${mins} 分钟`;
}

function getSteamIconUrl(appid: number, hash: string): string {
  return `https://media.steampowered.com/steamcommunity/public/images/apps/${appid}/${hash}.jpg`;
}

export const GET: APIRoute = async () => {
  const apiKey = import.meta.env.STEAM_API_KEY;
  const steamId = import.meta.env.STEAM_ID;

  if (!apiKey || !steamId) {
    console.warn("[Steam API] Missing STEAM_API_KEY or STEAM_ID in env");
    return new Response(JSON.stringify(fallbackData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    // Step 1: 获取玩家摘要（含当前游戏状态）
    const summariesUrl =
      "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/" +
      "?key=" + apiKey + "&steamids=" + steamId;
    const summariesRes = await fetch(summariesUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "Chengxi-Personal-Site/1.0" },
    });

    if (!summariesRes.ok) {
      throw new Error("Steam API summaries returned " + summariesRes.status);
    }

    const summariesData: GetPlayerSummariesResponse = await summariesRes.json();
    const player = summariesData.response.players?.[0];

    if (!player) {
      throw new Error("No player data returned");
    }

    const status: "online" | "offline" | "ingame" =
      player.personastate === 0 ? "offline" : "online";
    const isPlaying = !!player.gameextrainfo;
    const gameName = player.gameextrainfo || null;
    const gameId = player.gameid || null;

    // Step 2: 获取拥有游戏列表（作为后备数据源）
    interface OwnedGame {
      appid: number;
      name: string;
      playtime_forever: number;
      img_icon_url: string;
    }
    let ownedGames: OwnedGame[] = [];
    try {
      const ownedUrl =
        "https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/" +
        "?key=" + apiKey + "&steamid=" + steamId +
        "&include_appinfo=true&include_played_free_games=true&format=json";
      const ownedRes = await fetch(ownedUrl, {
        signal: controller.signal,
        headers: { "User-Agent": "Chengxi-Personal-Site/1.0" },
      });
      if (ownedRes.ok) {
        const ownedData = await ownedRes.json();
        ownedGames = ownedData.response?.games || [];
      }
    } catch {}

    // Step 3: 如果正在玩，尝试获取游戏图标和总时长
    let gameIcon: string | null = null;
    let gamePlayTime: string | null = null;
    if (gameId) {
      // 先从 GetRecentlyPlayedGames 找
      const recentUrl =
        "https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/" +
        "?key=" + apiKey + "&steamid=" + steamId + "&count=3";
      const recentRes = await fetch(recentUrl, {
        signal: controller.signal,
        headers: { "User-Agent": "Chengxi-Personal-Site/1.0" },
      });

      if (recentRes.ok) {
        const recentData: GetRecentlyPlayedGamesResponse = await recentRes.json();
        const currentGame = recentData.response.games?.find(
          (g) => String(g.appid) === gameId
        );
        if (currentGame?.img_icon_url) {
          gameIcon = getSteamIconUrl(currentGame.appid, currentGame.img_icon_url);
        }
        if (currentGame?.playtime_forever) {
          gamePlayTime = formatPlayTime(currentGame.playtime_forever);
        }
      }

      // 如果没找到，从拥有列表中查找
      if (!gameIcon || !gamePlayTime) {
        const ownedGame = ownedGames.find((g) => String(g.appid) === gameId);
        if (ownedGame) {
          if (!gameIcon && ownedGame.img_icon_url) {
            gameIcon = getSteamIconUrl(ownedGame.appid, ownedGame.img_icon_url);
          }
          if (!gamePlayTime && ownedGame.playtime_forever) {
            gamePlayTime = formatPlayTime(ownedGame.playtime_forever);
          }
        }
      }
    }

    // Step 4: 获取最近游玩列表
    const recentlyPlayed: CleanedGameData["recentlyPlayed"] = [];
    if (!isPlaying) {
      const recentUrl =
        "https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/" +
        "?key=" + apiKey + "&steamid=" + steamId + "&count=5";
      const recentRes = await fetch(recentUrl, {
        signal: controller.signal,
        headers: { "User-Agent": "Chengxi-Personal-Site/1.0" },
      });

      if (recentRes.ok) {
        const recentData: GetRecentlyPlayedGamesResponse = await recentRes.json();
        for (const game of recentData.response.games || []) {
          recentlyPlayed.push({
            appid: game.appid,
            name: game.name,
            playTime: formatPlayTime(game.playtime_2weeks || game.playtime_forever),
            iconUrl: game.img_icon_url
              ? getSteamIconUrl(game.appid, game.img_icon_url)
              : null,
          });
        }
      }

      // 如果 GetRecentlyPlayedGames 为空，用拥有列表按游戏时长排序
      if (recentlyPlayed.length === 0 && ownedGames.length > 0) {
        const sorted = ownedGames
          .filter((g) => g.playtime_forever > 0)
          .sort((a, b) => b.playtime_forever - a.playtime_forever)
          .slice(0, 5);
        for (const game of sorted) {
          recentlyPlayed.push({
            appid: game.appid,
            name: game.name,
            playTime: formatPlayTime(game.playtime_forever),
            iconUrl: game.img_icon_url
              ? getSteamIconUrl(game.appid, game.img_icon_url)
              : null,
          });
        }
      }
    }

    clearTimeout(timeout);

    const cleaned: CleanedGameData = {
      isPlaying,
      gameName,
      playTime: gamePlayTime,
      gameIcon,
      status,
      recentlyPlayed,
    };

    return new Response(JSON.stringify(cleaned), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    clearTimeout(timeout);
    console.error("[Steam API] Error:", error);
    return new Response(JSON.stringify(fallbackData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
};
