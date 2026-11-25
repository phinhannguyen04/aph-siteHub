using APH.SiteHub.Api;
using APH.SiteHub.Api.Commands;
using APH.SiteHub.Api.Middleware;
using APH.SiteHub.Infrastructure;
using APH.SiteHub.ServiceDefaults;

var builder = WebApplication.CreateBuilder(args);
var options = SiteHubOptions.Read(builder.Configuration);
builder.AddServiceDefaults();
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
app.MapDefaultEndpoints();
app.MapControllers();
app.Run();
