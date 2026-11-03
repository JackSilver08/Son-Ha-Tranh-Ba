using Microsoft.AspNetCore.SignalR;

namespace SonHaTranhBa.Server.Hubs;

/// <summary>Connectivity-only hub. No rooms, authentication, or gameplay commands yet.</summary>
public sealed class FoundationHub : Hub
{
    public Task<PongResponse> Ping(string message)
    {
        var safeMessage = message.Length > 120 ? message[..120] : message;
        return Task.FromResult(new PongResponse(safeMessage, DateTimeOffset.UtcNow));
    }
}

public sealed record PongResponse(string Message, DateTimeOffset ServerTimeUtc);
