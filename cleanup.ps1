Write-Host "🧹 Cleaning React Native project..." -ForegroundColor Green

# Clean npm cache
Write-Host "Cleaning npm cache..." -ForegroundColor Yellow
npm cache clean --force

# Clean yarn cache (if exists)
Write-Host "Cleaning yarn cache..." -ForegroundColor Yellow
yarn cache clean 2>$null

# Clean Metro cache
Write-Host "Cleaning Metro cache..." -ForegroundColor Yellow
npx react-native start --reset-cache --reset-metro-cache --no-dev 2>$null
Start-Sleep -Seconds 2
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue

# Clean Android build
Write-Host "Cleaning Android build..." -ForegroundColor Yellow
if (Test-Path "android") {
    cd android
    .\gradlew clean
    cd ..
}

# Remove build directories
Write-Host "Removing build directories..." -ForegroundColor Yellow
$buildDirs = @(
    "android\build",
    "android\app\build", 
    "android\.gradle",
    "ios\build",
    "ios\Pods",
    "ios\Podfile.lock",
    ".expo",
    ".tmp",
    "tmp"
)

foreach ($dir in $buildDirs) {
    if (Test-Path $dir) {
        Remove-Item -Recurse -Force $dir -ErrorAction SilentlyContinue
        Write-Host "  ✓ Removed $dir" -ForegroundColor Gray
    }
}

# Clean Gradle cache globally
Write-Host "Cleaning global Gradle cache..." -ForegroundColor Yellow
$gradleCache = "$env:USERPROFILE\.gradle\caches"
if (Test-Path $gradleCache) {
    Get-ChildItem $gradleCache -Directory | Where-Object { $_.Name -like "*-*" } | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
}

# Calculate saved space (approximate)
Write-Host "`n✅ Cleanup completed!" -ForegroundColor Green
Write-Host "💾 You should have freed up 1-3 GB of disk space." -ForegroundColor Green
Write-Host "`n📝 To rebuild, run: npm install && npx react-native run-android" -ForegroundColor Cyan 