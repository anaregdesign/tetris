import { PreviewMatrix } from "./PreviewMatrix";
import type { TetrisScreenHandlers } from "~/lib/client/usecase/tetris/use-tetris";
import type { TetrisScreenViewModel } from "~/lib/client/usecase/tetris/selectors";

type TetrisViewProps = TetrisScreenViewModel & TetrisScreenHandlers;

export function TetrisView({
  eyebrow,
  title,
  lead,
  statusLabel,
  statusCopy,
  score,
  highScore,
  level,
  lines,
  nextLevelProgress,
  tickIntervalMs,
  primaryActionLabel,
  secondaryActionLabel,
  boardCells,
  holdPiece,
  nextPieces,
  overlayTitle,
  overlayCopy,
  statusAnnouncement,
  controlHints,
  githubAuthConfigured,
  viewer,
  signInHref,
  logoutAction,
  saveStatusLabel,
  saveStatusCopy,
  saveStatusTone,
  canRetrySave,
  recentRuns,
  recentRunsEmptyTitle,
  recentRunsEmptyCopy,
  leaderboard,
  leaderboardSummary,
  viewerRankLabel,
  handlePrimaryAction,
  handleRestart,
  handlePauseToggle,
  handleMoveLeft,
  handleMoveRight,
  handleRotateClockwise,
  handleRotateCounterClockwise,
  handleSoftDrop,
  handleHardDrop,
  handleHoldPiece,
  handleRetryScoreSave,
}: TetrisViewProps) {
  return (
    <main className="page-shell">
      <div className="screen-reader-status" aria-live="polite">
        {statusAnnouncement}
      </div>

      <section className="tetris-shell">
        <section className="hero-panel">
          <div className="hero-grid">
            <div className="hero-copy">
              <span className="eyebrow">{eyebrow}</span>
              <h1 className="hero-title">{title}</h1>
              <p className="hero-lead">{lead}</p>

              <div className="hero-stats">
                <StatChip label="Score" value={score.toLocaleString()} />
                <StatChip label="Best" value={highScore.toLocaleString()} />
                <StatChip label="Tick" value={`${tickIntervalMs}ms`} />
              </div>
            </div>

            <aside className="hero-status-card">
              <div className="hero-status-row">
                <span className="status-pill">{statusLabel}</span>
                <span className="control-hint-keys">Level {level}</span>
              </div>

              <p className="hero-status-copy">{statusCopy}</p>

              <div className="action-row">
                <button
                  type="button"
                  className="action-button action-button-primary"
                  onClick={handlePrimaryAction}
                >
                  {primaryActionLabel}
                </button>
                <button
                  type="button"
                  className="action-button action-button-secondary"
                  onClick={handleRestart}
                >
                  {secondaryActionLabel}
                </button>
              </div>
            </aside>
          </div>
        </section>

        <section className="play-grid">
          <section className="play-panel">
            <div className="playfield-layout">
              <aside className="info-panel">
                <div className="panel-header">
                  <p className="panel-title">Hold</p>
                  <p className="assist-copy">
                    One deliberate swap per drop cycle. Save it for I or T when the board starts to choke.
                  </p>
                </div>
                <div className="panel-body">
                  {holdPiece ? (
                    <PreviewMatrix
                      tone={holdPiece.tone}
                      label={holdPiece.label}
                      matrix={holdPiece.matrix}
                    />
                  ) : (
                    <div className="preview-card">
                      <span className="preview-card-label">Empty hold slot</span>
                      <p className="assist-copy">
                        Trigger hold with C or Shift after the first spawn.
                      </p>
                    </div>
                  )}
                </div>
              </aside>

              <section className="board-shell" aria-label="Tetris board region">
                <div className="board-grid" role="grid" aria-label="Tetris board">
                  {boardCells.map((cell) => (
                    <div
                      key={cell.key}
                      role="presentation"
                      className="board-cell"
                      data-tone={cell.tone}
                      data-filled={cell.filled}
                      data-ghost={cell.ghost}
                    />
                  ))}
                </div>

                {overlayTitle && overlayCopy ? (
                  <div className="board-overlay">
                    <div className="overlay-card">
                      <h2 className="overlay-title">{overlayTitle}</h2>
                      <p className="overlay-copy">{overlayCopy}</p>
                    </div>
                  </div>
                ) : null}
              </section>

              <aside className="info-panel">
                <div className="panel-header">
                  <p className="panel-title">Forecast</p>
                  <p className="assist-copy">
                    Read five pieces ahead. Stable boards come from queue discipline, not improvisation.
                  </p>
                </div>

                <div className="preview-list">
                  {nextPieces.map((piece, index) => (
                    <div key={`${piece.label}-${index}`} className="preview-card">
                      <span className="preview-card-label">Next {index + 1}</span>
                      <PreviewMatrix
                        tone={piece.tone}
                        label={piece.label}
                        matrix={piece.matrix}
                      />
                    </div>
                  ))}
                </div>
              </aside>
            </div>
          </section>

          <aside className="info-panel">
            <div className="panel-header">
              <p className="panel-title">Run Metrics</p>
              <p className="assist-copy">
                Lines increase the level, and level tightens gravity. Leave fewer caves than you create.
              </p>
            </div>

            <div className="info-grid">
              <InfoBlock label="Lines" value={lines.toLocaleString()} />
              <InfoBlock label="Level" value={level.toLocaleString()} />
              <InfoBlock label="Best" value={highScore.toLocaleString()} />
              <InfoBlock label="Cadence" value={`${tickIntervalMs}ms`} />
            </div>

            <div>
              <div className="hero-status-row">
                <span className="panel-title">Next Level</span>
                <span className="control-hint-keys">{Math.round(nextLevelProgress * 100)}%</span>
              </div>
              <div className="meter" aria-hidden="true">
                <div
                  className="meter-fill"
                  style={{ width: `${Math.max(8, nextLevelProgress * 100)}%` }}
                />
              </div>
            </div>
          </aside>
        </section>

        <section className="social-grid">
          <aside className="info-panel social-panel">
            <div className="panel-header">
              <p className="panel-title">Pilot</p>
              <p className="assist-copy">
                Social login は GitHub OAuth 前提です。signed-in player は run が SQL Server に保存され、履歴と leaderboard が更新されます。
              </p>
            </div>

            {viewer ? (
              <div className="profile-card">
                <div className="profile-row">
                  <div className="profile-avatar" aria-hidden="true">
                    {viewer.avatarUrl ? (
                      <img src={viewer.avatarUrl} alt="" className="profile-avatar-image" />
                    ) : (
                      <span>{viewer.displayName.slice(0, 1)}</span>
                    )}
                  </div>

                  <div className="profile-copy">
                    <strong>{viewer.displayName}</strong>
                    <span className="control-hint-keys">@{viewer.handle}</span>
                    {viewerRankLabel ? (
                      <span className="profile-rank">{viewerRankLabel}</span>
                    ) : null}
                  </div>
                </div>

                <div className="action-row">
                  {viewer.profileUrl ? (
                    <a
                      href={viewer.profileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="action-button action-button-secondary"
                    >
                      GitHub Profile
                    </a>
                  ) : null}

                  <form method="post" action={logoutAction}>
                    <button
                      type="submit"
                      className="action-button action-button-secondary"
                    >
                      Log Out
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="preview-card">
                <span className="preview-card-label">GitHub Login</span>
                <p className="assist-copy">
                  {githubAuthConfigured
                    ? "サインインすると score history と global leaderboard が有効になります。"
                    : "OAuth env が未設定なので、今は guest play のみです。"}
                </p>
                {githubAuthConfigured ? (
                  <a href={signInHref} className="action-button action-button-primary auth-link">
                    Sign In with GitHub
                  </a>
                ) : null}
              </div>
            )}

            <div className={`save-status-card save-status-${saveStatusTone}`}>
              <div className="panel-header">
                <p className="panel-title">{saveStatusLabel}</p>
              </div>
              <p className="assist-copy">{saveStatusCopy}</p>
              {canRetrySave ? (
                <button
                  type="button"
                  className="action-button action-button-secondary"
                  onClick={handleRetryScoreSave}
                >
                  Retry Save
                </button>
              ) : null}
            </div>
          </aside>

          <section className="info-panel social-panel">
            <div className="panel-header">
              <p className="panel-title">Run History</p>
              <p className="assist-copy">
                保存された自分の run を新しい順に表示します。score だけでなく level と line clear も追えます。
              </p>
            </div>

            {recentRuns.length > 0 ? (
              <div className="social-list">
                {recentRuns.map((run) => (
                  <div key={run.id} className="social-row">
                    <div className="social-row-main">
                      <strong>{run.scoreLabel}</strong>
                      <span>{run.detailLabel}</span>
                    </div>
                    <div className="social-row-meta">
                      <span>{run.recordedAtLabel}</span>
                      <span>{run.durationLabel}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <strong>{recentRunsEmptyTitle}</strong>
                <p>{recentRunsEmptyCopy}</p>
              </div>
            )}
          </section>

          <section className="info-panel social-panel">
            <div className="panel-header">
              <p className="panel-title">Leaderboard</p>
              <p className="assist-copy">{leaderboardSummary}</p>
            </div>

            {leaderboard.length > 0 ? (
              <div className="social-list">
                {leaderboard.map((entry) => (
                  <div
                    key={entry.id}
                    className={`social-row${entry.highlighted ? " social-row-highlighted" : ""}`}
                  >
                    <div className="social-rank">{entry.rankLabel}</div>

                    <div className="social-row-main">
                      <strong>{entry.displayName}</strong>
                      <span>{entry.handleLabel}</span>
                    </div>

                    <div className="social-row-meta social-row-score">
                      <strong>{entry.scoreLabel}</strong>
                      <span>{entry.detailLabel}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <strong>No leaderboard entries yet</strong>
                <p>The first signed-in run will establish the initial benchmark.</p>
              </div>
            )}
          </section>
        </section>

        <section className="control-panel">
          <div className="control-grid">
            <div className="control-pad">
              <div className="panel-header">
                <p className="panel-title">Touch Controls</p>
                <p className="assist-copy">
                  Mobile is first-class here. Large buttons mirror the keyboard scheme without introducing extra game state.
                </p>
              </div>

              <div className="control-pad-grid">
                <ControlButton label="Left" caption="A / ArrowLeft" onClick={handleMoveLeft} />
                <ControlButton label="Right" caption="D / ArrowRight" onClick={handleMoveRight} />
                <ControlButton
                  label="Rotate CW"
                  caption="Up / X"
                  onClick={handleRotateClockwise}
                />
                <ControlButton
                  label="Rotate CCW"
                  caption="Z"
                  onClick={handleRotateCounterClockwise}
                />
                <ControlButton label="Soft Drop" caption="S / ArrowDown" onClick={handleSoftDrop} />
                <ControlButton
                  label="Hard Drop"
                  caption="Space"
                  onClick={handleHardDrop}
                  primary
                />
                <ControlButton label="Hold" caption="C / Shift" onClick={handleHoldPiece} />
                <ControlButton
                  label="Pause"
                  caption="P / Esc"
                  onClick={handlePauseToggle}
                />
              </div>
            </div>

            <div className="control-hints">
              <div className="panel-header">
                <p className="panel-title">Keyboard Map</p>
                <p className="assist-copy">
                  The route stays thin. All interaction state lives in the usecase Hook, and these are the public controls it exposes.
                </p>
              </div>

              {controlHints.map((hint) => (
                <div key={hint.label} className="control-hint">
                  <span className="control-hint-label">{hint.label}</span>
                  <span className="control-hint-keys">{hint.keys}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-chip">
      <span className="stat-chip-label">{label}</span>
      <span className="stat-chip-value">{value}</span>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="info-block">
      <span className="info-block-label">{label}</span>
      <span className="info-block-value">{value}</span>
    </div>
  );
}

function ControlButton({
  label,
  caption,
  onClick,
  primary = false,
}: {
  label: string;
  caption: string;
  onClick(): void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      className={`control-button${primary ? " control-button-primary" : ""}`}
      onClick={onClick}
    >
      <span className="control-label">{label}</span>
      <span className="control-caption">{caption}</span>
    </button>
  );
}
