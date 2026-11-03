using Npgsql;
using SonHaTranhBa.Game.Core;
using SonHaTranhBa.Server.Hubs;
using SonHaTranhBa.Server.Services;

var builder = WebApplication.CreateBuilder(args);
var connectionString = builder.Configuration.GetConnectionString("GameDb")
    ?? throw new InvalidOperationException("Missing ConnectionStrings:GameDb. See README.md.");

builder.Services.AddSingleton(NpgsqlDataSource.Create(connectionString));
builder.Services.AddSingleton<GameTickCounter>();
builder.Services.AddHostedService<HeartbeatService>();
builder.Services.AddSignalR();

var app = builder.Build();

app.MapGet("/api/health", () => Results.Ok(new
{
    status = "ok",
    app = "Son Ha Tranh Ba",
    phase = 1,
    utc = DateTimeOffset.UtcNow
}));

app.MapGet("/api/health/db", async (NpgsqlDataSource database, CancellationToken ct) =>
{
    try
    {
        await using var command = database.CreateCommand("SELECT 1");
        var result = await command.ExecuteScalarAsync(ct);
        return result is 1
            ? Results.Ok(new { status = "ok", database = "PostgreSQL" })
            : Results.Problem("Database ping returned an unexpected result.", statusCode: 503);
    }
    catch (Exception exception)
    {
        app.Logger.LogWarning(exception, "PostgreSQL health check failed");
        return Results.Problem("Database unavailable.", statusCode: 503);
    }
});

app.MapGet("/api/simulation/status", (GameTickCounter ticks) => Results.Ok(new
{
    status = "foundation-heartbeat-only",
    ticks = ticks.CurrentTick,
    intervalMs = 100,
    note = "This is not the authoritative gameplay simulation."
}));

app.MapHub<FoundationHub>("/hubs/foundation");
app.Run();
