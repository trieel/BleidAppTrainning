# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy solution and project definitions for layer caching
COPY BleidAppTraining.sln .
COPY BleidAppTraining.Domain/BleidAppTraining.Domain.csproj BleidAppTraining.Domain/
COPY BleidAppTraining.Application/BleidAppTraining.Application.csproj BleidAppTraining.Application/
COPY BleidAppTraining.Infrastructure/BleidAppTraining.Infrastructure.csproj BleidAppTraining.Infrastructure/
COPY BleidAppTraining.API/BleidAppTraining.API.csproj BleidAppTraining.API/
COPY BleidAppTraining.Application.Tests/BleidAppTraining.Application.Tests.csproj BleidAppTraining.Application.Tests/

RUN dotnet restore BleidAppTraining.sln

# Copy project source code
COPY BleidAppTraining.Domain/ BleidAppTraining.Domain/
COPY BleidAppTraining.Application/ BleidAppTraining.Application/
COPY BleidAppTraining.Infrastructure/ BleidAppTraining.Infrastructure/
COPY BleidAppTraining.API/ BleidAppTraining.API/

WORKDIR /src/BleidAppTraining.API
RUN dotnet publish -c Release -o /app/publish

# Stage 2: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

COPY --from=build /app/publish .
USER $APP_UID
ENTRYPOINT ["dotnet", "BleidAppTraining.API.dll"]
