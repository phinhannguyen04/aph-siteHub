using System.Collections.Concurrent;
namespace APH.SiteHub.Api.Security;

public sealed class LoginLimiter(TimeProvider clock)
{
    private sealed record Attempt(int Count, DateTimeOffset Until);
    private readonly ConcurrentDictionary<string, Attempt> attempts = new();
    public bool Blocked(string key)
    {
        Prune();
        return attempts.TryGetValue(key, out var attempt) && attempt.Until > clock.GetUtcNow() && attempt.Count >= 5;
    }
    public void Failed(string key)
    {
        var now = clock.GetUtcNow();
        attempts.AddOrUpdate(key, new Attempt(1, now.AddMinutes(15)), (_, previous) => new Attempt(previous.Until > now ? previous.Count + 1 : 1, now.AddMinutes(15)));
    }
    public void Reset(string key) => attempts.TryRemove(key, out _);
    private void Prune()
    {
        var now = clock.GetUtcNow();
        foreach (var pair in attempts)
        {
            if (pair.Value.Until <= now)
            {
                attempts.TryRemove(pair);
            }
        }
    }
}
