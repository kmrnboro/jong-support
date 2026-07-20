import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";

import type { ArchiveIndexEntry } from "../archive/archiveIndex";
import {
  ArchiveDecryptionError,
  UnsupportedEncryptedArchiveError,
} from "../archive/decrypt";
import {
  ArchiveLoadError,
  loadEncryptedArchive,
} from "../archive/loadArchive";
import type { TournamentArchive } from "../domain/archive";

type ArchiveUnlockPageProps = {
  entry: ArchiveIndexEntry;
  onUnlocked: (archive: TournamentArchive) => void;
};

const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

export function ArchiveUnlockPage({
  entry,
  onUnlocked,
}: ArchiveUnlockPageProps) {
  const { archiveId = "" } = useParams();
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);

  if (archiveId !== entry.archiveId) {
    return (
      <section className="message-card">
        <p className="eyebrow">NOT FOUND</p>
        <h1>大会が見つかりません</h1>
        <Link className="text-link" to="/">
          大会トップへ戻る
        </Link>
      </section>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsUnlocking(true);

    try {
      const loadedArchive = await loadEncryptedArchive(
        `${import.meta.env.BASE_URL}${entry.file}`,
        password,
      );

      if (loadedArchive.tournament.id !== entry.archiveId) {
        throw new ArchiveDecryptionError();
      }

      setPassword("");
      setIsUnlocking(false);
      onUnlocked(loadedArchive);
    } catch (error: unknown) {
      if (error instanceof UnsupportedEncryptedArchiveError) {
        setErrorMessage(error.message);
      } else if (error instanceof ArchiveLoadError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage(new ArchiveDecryptionError().message);
      }
      setIsUnlocking(false);
    }
  }

  return (
    <div className="unlock-layout">
      <section className="unlock-intro" aria-labelledby="unlock-title">
        <p className="eyebrow">ENCRYPTED ARCHIVE</p>
        <h1 id="unlock-title">{entry.title}</h1>
        <p className="page-summary">
          <time dateTime={entry.date}>
            {dateFormatter.format(new Date(entry.date))}
          </time>
          <span aria-hidden="true">・</span>
          {entry.playerCount}名
        </p>
        <p className="unlock-description">
          この大会記録は暗号化されています。共有されたパスワードを入力すると、
          このブラウザ内だけで復号して結果を表示します。
        </p>
      </section>

      <section className="unlock-card" aria-labelledby="password-title">
        <p className="card-label">BROWSER DECRYPTION</p>
        <h2 id="password-title">パスワードを入力</h2>
        <form className="unlock-form" onSubmit={handleSubmit}>
          <label htmlFor="archive-password">Archive password</label>
          <input
            id="archive-password"
            name="archive-password"
            type="password"
            value={password}
            autoComplete="off"
            disabled={isUnlocking}
            onChange={(event) => setPassword(event.target.value)}
          />
          <p className="privacy-note">
            パスワードは送信・保存されず、この画面のメモリ内だけで使用します。
          </p>
          {errorMessage === null ? null : (
            <p className="form-error" role="alert">
              {errorMessage}
            </p>
          )}
          <button
            className="primary-button"
            type="submit"
            disabled={password.length === 0 || isUnlocking}
          >
            {isUnlocking ? "復号しています…" : "アーカイブを開く"}
          </button>
        </form>
        <Link className="text-link" to="/">
          大会トップへ戻る
        </Link>
      </section>
    </div>
  );
}
