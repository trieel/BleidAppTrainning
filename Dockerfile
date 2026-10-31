# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy solution and project definitions for layer caching
COPY bleid-api/BleidAppTraining.sln ./bleid-api/
COPY bleid-api/BleidAppTraining.Domain/BleidAppTraining.Domain.csproj ./bleid-api/BleidAppTraining.Domain/
COPY bleid-api/BleidAppTraining.Application/BleidAppTraining.Application.csproj ./bleid-api/BleidAppTraining.Application/
COPY bleid-api/BleidAppTraining.Infrastructure/BleidAppTraining.Infrastructure.csproj ./bleid-api/BleidAppTraining.Infrastructure/
COPY bleid-api/BleidAppTraining.API/BleidAppTraining.API.csproj ./bleid-api/BleidAppTraining.API/
COPY bleid-api/BleidAppTraining.Application.Tests/BleidAppTraining.Application.Tests.csproj ./bleid-api/BleidAppTraining.Application.Tests/

WORKDIR /src/bleid-api
RUN dotnet restore BleidAppTraining.sln

# Copy project source code
COPY bleid-api/BleidAppTraining.Domain/ BleidAppTraining.Domain/
COPY bleid-api/BleidAppTraining.Application/ BleidAppTraining.Application/
COPY bleid-api/BleidAppTraining.Infrastructure/ BleidAppTraining.Infrastructure/
COPY bleid-api/BleidAppTraining.API/ BleidAppTraining.API/

WORKDIR /src/bleid-api/BleidAppTraining.API
RUN dotnet publish -c Release -o /app/publish

# Stage 2: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
EXPOSE 8080 10000

ENV ASPNETCORE_URLS=http://+:10000;http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production
ENV DOTNET_gcServer=0
ENV DOTNET_EnableDiagnostics=0

COPY --from=build /app/publish .
USER $APP_UID
ENTRYPOINT ["dotnet", "BleidAppTraining.API.dll"]
