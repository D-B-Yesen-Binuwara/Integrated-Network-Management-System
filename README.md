# Alarm_Management_System

Web-based system to model and simulate fault detection, alarm handling, and impact analysis in a telecom network hierarchy.

## Requirements

- **.NET 9.0 SDK** ([download](https://dotnet.microsoft.com/download/dotnet/9.0))
- **Docker & Docker Compose** ([install](https://docs.docker.com/get-docker/))
- **SQL Server 2022** (runs in Docker container, no local install needed)

## Quick Start

Run from the project root.

1. Start API + SQL Server:

```bash
make rebuild
```

2. Seed schema and sample data:

```bash
make seed
```

3. Open API docs:

- Swagger: http://localhost:5289/swagger

4. Run automated impact-analysis demo checks:

```bash
make demo
```

## Available Commands

- `make up`: start containers
- `make down`: stop containers
- `make rebuild`: rebuild and start containers
- `make seed`: load `Backend/DB_Schema.sql` into SQL Server container
- `make demo`: run impact-analysis test script

## Manual API Tests

```bash
curl -X POST http://localhost:5289/api/impact-analysis/analyze/1
curl http://localhost:5289/api/impact-analysis/result/1
curl -X POST http://localhost:5289/api/impact-analysis/clear/1
```

## Demo Resources

- Automated script: `scripts/run-impact-tests.sh`
- Speaking notes: `scripts/demo-speaking-notes.md`
=======
# Alarm Management System

A web-based system designed to model and simulate fault detection, alarm handling, and impact analysis within a telecom service provider’s network.

## Overview

This project represents a hierarchical telecom topology and enables realistic simulation of:
- Power-related alarms
- Node failures
- Downstream network impact analysis

It demonstrates how modern Network Operations Centers (NOC) monitor distributed infrastructure, identify and classify faults, and assess service disruption impact using a centralized system.

> Note: This is a simulation framework and does not interact with real telecom hardware.

## Repository StructureS

- `Backend/` - ASP.NET solution and API, application services, domain models, and repositories
- `Frontend/` - Angular client UI and app logic

## Development

### Backend
1. Open `Backend/INMS.sln` in Visual Studio.
2. Restore NuGet packages and build the solution.
3. Run `INMS.API`.

### Frontend
1. Navigate to `Frontend/`.
2. Run `npm install` if needed.
3. Run `npm start`.

## Common Commands

From `Backend/`:
```bash
dotnet build
``` 

From `Frontend/`:
```bash
npm install
npm start
```

## Branching

Use feature branches like `YB/DTO/F2` to keep work isolated. Merge only after code review and tests pass.


## xunit testing initialization

dotnet new xunit

dotnet add package xunit
dotnet add package xunit.runner.visualstudio
dotnet add package Microsoft.NET.Test.Sdk
dotnet add package Moq
dotnet add package FluentAssertions

dotnet add reference ../../INMS.Application/INMS.Application.csproj
dotnet add reference ../../INMS.Domain/INMS.Domain.csproj