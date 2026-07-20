export type GameRank = 1 | 2 | 3 | 4;

export type Tournament = {
  id: string;
  name: string;
  date: string;
};

export type Player = {
  playerId: string;
  nickname: string;
};

export type GameResult = {
  playerId: string;
  rawScore: number;
  rank: GameRank;
  finalPoint: number;
};

export type MahjongGame = {
  gameId: string;
  roundNumber: number;
  tableNumber: number;
  results: GameResult[];
};

export type SubgameResult = {
  roundNumber: number;
  playerId: string;
  point: number;
};

export type OfficialResult = {
  playerId: string;
  mahjongPoint: number;
  mahjongRank: number;
  subgamePoint: number;
  subgameRank: number;
};

export type TournamentArchive = {
  schemaVersion: string;
  tournament: Tournament;
  players: Player[];
  games: MahjongGame[];
  subgameResults: SubgameResult[];
  subgameDataStatus: "sample" | "official";
  officialResults: OfficialResult[];
};
