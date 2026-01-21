# Mark all Prisma migrations as applied
# This is needed when you manually created tables in the database

Write-Host "Marking all Prisma migrations as applied..." -ForegroundColor Cyan

# Get all migration directories
$migrations = Get-ChildItem -Path "prisma/migrations" -Directory | Where-Object { $_.Name -match "^\d" }

foreach ($migration in $migrations) {
    $migrationName = $migration.Name
    Write-Host "Marking $migrationName as applied..." -ForegroundColor Yellow
    npx prisma migrate resolve --applied $migrationName
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to mark $migrationName" -ForegroundColor Red
    }
}

Write-Host "`nDone! Checking status..." -ForegroundColor Green
npx prisma migrate status
