namespace APH.SiteHub.Api.Middleware;

public static class ApiPipelineExtensions
{
    public static WebApplication UseApiPipeline(this WebApplication app)
    {
        app.UseExceptionHandler();
        app.UseStatusCodePages(async context =>
        {
            var response = context.HttpContext.Response;
            await response.WriteAsJsonAsync(new
            {
                error = new
                {
                    code = response.StatusCode == 404 ? "NOT_FOUND" : "HTTP_ERROR",
                    message = "Request failed"
                }
            });
        });
        app.Use(async (http, next) =>
        {
            if (http.Request.Path.StartsWithSegments("/api"))
            {
                http.Response.Headers.CacheControl = "no-store";
            }
            await next(http);
        });
        app.UseCors();
        app.UseAuthentication();
        app.UseAuthorization();
        return app;
    }
}
