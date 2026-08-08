export type GameRank = 1 | 2 | 3 | 4;
export type RankingEligibility =
  | "official"
  | "reference"
  | "notParticipating";

export type Tournament = {
  id: string;
  name: string;
  date: string;
  revision: number;
};

export type Player = {
  playerId: string;
  nickname: string;
  rankingEligibility: {
    mahjong: RankingEligibility;
    subgame: RankingEligibility;
  };
};

export type ScoringRuleReference = {
  ruleId: string;
  ruleVersion: string;
  parameters: Record<string, unknown>;
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
  point: number;
  rank: number;
};

export type MahjongDepartment = {
  scoring: ScoringRuleReference;
  games: MahjongGame[];
  officialResults: OfficialResult[];
};

export type SubgameDepartment = {
  dataStatus: "sample" | "official";
  scoring: ScoringRuleReference;
  results: SubgameResult[];
  officialResults: OfficialResult[];
};

export type TournamentArchive = {
  schemaVersion: "1.0.0";
  exportedAt: string;
  tournament: Tournament;
  players: Player[];
  mahjong: MahjongDepartment;
  subgame: SubgameDepartment | null;
  exportMetadata: {
    generator: string;
    source: "sample" | "manual" | "import";
  };
};
