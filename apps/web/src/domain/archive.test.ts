import { describe, expect, it } from "vitest";

import sampleArchive from "../../../../tests/fixtures/archive.json";

describe("sample archive", () => {
  it("playerIdとnicknameを別々に保持する", () => {
    const playerIds = sampleArchive.players.map((player) => player.playerId);
    const nicknames = sampleArchive.players.map((player) => player.nickname);

    expect(new Set(playerIds).size).toBe(sampleArchive.players.length);
    expect(playerIds).not.toEqual(nicknames);
  });

  it("対局結果と公式結果が登録済みplayerIdだけを参照する", () => {
    const playerIds = new Set(
      sampleArchive.players.map((player) => player.playerId),
    );
    const referencedPlayerIds = [
      ...sampleArchive.games.flatMap((game) =>
        game.results.map((result) => result.playerId),
      ),
      ...sampleArchive.subgameResults.map((result) => result.playerId),
      ...sampleArchive.officialResults.map((result) => result.playerId),
    ];

    expect(
      referencedPlayerIds.every((playerId) => playerIds.has(playerId)),
    ).toBe(true);
  });

});
