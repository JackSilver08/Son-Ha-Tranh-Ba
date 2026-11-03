using SonHaTranhBa.Game.Core;

namespace SonHaTranhBa.Server.Services;

/// <summary>
/// Non-gameplay heartbeat for the foundation smoke test. Does not simulate armies
/// or modify any game state and must not be mistaken for the final match tick loop.
/// </summary>
public sealed class HeartbeatService(GameTickCounter ticks) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromMilliseconds(100));

        try
        {
            while (await timer.WaitForNextTickAsync(stoppingToken))
            {
                ticks.Advance();
            }
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
            // Normal server shutdown.
        }
    }
}
