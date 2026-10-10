using APH.SiteHub.Api;
using APH.SiteHub.Api.Commands;
using APH.SiteHub.Api.Endpoints;
using APH.SiteHub.Api.Middleware;
using APH.SiteHub.Infrastructure;

var builder = WebApplication.CreateBuilder(args);
if (args.Contains("--hash-password"))
{
    var hash = HashPasswordCommand.Run();
    if (hash.IsFailure)
    {
        CommandFailureWriter.Write(hash.Error);
    }
    return;
}
var options = SiteHubOptions.Read(builder.Configuration);
builder.AddApi(options);
var app = builder.Build();

// Maintenance commands run explicitly; ordinary startup never changes schema.
var maintenance = await MaintenanceCommandDispatcher.TryRunAsync(args, app.Services);
if (maintenance.IsFailure)
{
    CommandFailureWriter.Write(maintenance.Error);
    return;
}
if (maintenance.Value)
{
    return;
}
app.UseApiPipeline();
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}
app.MapHealthEndpoints();
app.MapAuthEndpoints();
app.MapWebsiteEndpoints();
app.MapTagEndpoints();
app.MapAccountEndpoints();
app.Run();
