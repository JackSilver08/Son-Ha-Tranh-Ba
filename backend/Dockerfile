FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY src/SonHaTranhBa.Game.Core/SonHaTranhBa.Game.Core.csproj src/SonHaTranhBa.Game.Core/
COPY src/SonHaTranhBa.Server/SonHaTranhBa.Server.csproj src/SonHaTranhBa.Server/
RUN dotnet restore src/SonHaTranhBa.Server/SonHaTranhBa.Server.csproj
COPY src/ src/
RUN dotnet publish src/SonHaTranhBa.Server/SonHaTranhBa.Server.csproj -c Release --no-restore -o /out /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /out/ ./
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
USER $APP_UID
ENTRYPOINT ["dotnet", "SonHaTranhBa.Server.dll"]
