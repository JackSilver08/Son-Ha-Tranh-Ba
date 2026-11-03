namespace SonHaTranhBa.Game.Core;

/// <summary>
/// Phase 1 heartbeat counter. NOT an authoritative gameplay simulation yet.
/// Phase 3 will introduce a match-owned deterministic simulation loop.
/// </summary>
public sealed class GameTickCounter
{
    private long _ticks;

    public long CurrentTick => Interlocked.Read(ref _ticks);

    public void Advance() => Interlocked.Increment(ref _ticks);
}
