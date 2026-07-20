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

export type OfficialResult = {
  playerId: string;
  mahjongPoint: number;
  subgamePoint: number;
  totalPoint: number;
  rank: number;
};

export type TournamentArchive = {
  schemaVersion: string;
  tournament: Tournament;
  players: Player[];
  games: MahjongGame[];
  officialResults: OfficialResult[];
};

