FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /source
COPY global.json Directory.Build.props ./
COPY src/APH.SiteHub.Domain/APH.SiteHub.Domain.csproj src/APH.SiteHub.Domain/
COPY src/APH.SiteHub.Application/APH.SiteHub.Application.csproj src/APH.SiteHub.Application/
COPY src/APH.SiteHub.Infrastructure/APH.SiteHub.Infrastructure.csproj src/APH.SiteHub.Infrastructure/
COPY src/APH.SiteHub.Api/APH.SiteHub.Api.csproj src/APH.SiteHub.Api/
RUN dotnet restore src/APH.SiteHub.Api/APH.SiteHub.Api.csproj
COPY src src
RUN dotnet publish src/APH.SiteHub.Api/APH.SiteHub.Api.csproj -c Release --no-restore -o /app /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
USER root
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /app .
ENV ASPNETCORE_ENVIRONMENT=Production API_PORT=3000
EXPOSE 3000
USER $APP_UID
ENTRYPOINT ["dotnet", "APH.SiteHub.Api.dll"]
