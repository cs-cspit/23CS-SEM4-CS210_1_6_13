# Run as administrator
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Warning "Please run this script as Administrator"
    Break
}

# Download Java installer
$url = "https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.9%2B9/OpenJDK17U-jdk_x64_windows_hotspot_17.0.9_9.msi"
$output = "$env:TEMP\java_installer.msi"

Write-Host "Downloading Java installer..."
try {
    Invoke-WebRequest -Uri $url -OutFile $output -UseBasicParsing
} catch {
    Write-Error "Failed to download Java installer: $_"
    Break
}

# Install Java
Write-Host "Installing Java..."
try {
    $process = Start-Process msiexec.exe -ArgumentList '/i', $output, '/quiet', 'ADDLOCAL="FeatureMain,FeatureEnvironment,FeatureJarFileRunWith,FeatureJavaHome"' -Wait -PassThru
    if ($process.ExitCode -ne 0) {
        Write-Error "Java installation failed with exit code: $($process.ExitCode)"
        Break
    }
} catch {
    Write-Error "Failed to install Java: $_"
    Break
}

# Add Java to PATH
$javaPath = "C:\Program Files\Eclipse Adoptium\jdk-17.0.9.9-hotspot"
$systemPath = [Environment]::GetEnvironmentVariable("Path", "Machine")
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")

# Add to both system and user PATH
if ($systemPath -notlike "*$javaPath\bin*") {
    [Environment]::SetEnvironmentVariable("Path", $systemPath + ";$javaPath\bin", "Machine")
}
if ($userPath -notlike "*$javaPath\bin*") {
    [Environment]::SetEnvironmentVariable("Path", $userPath + ";$javaPath\bin", "User")
}

# Set JAVA_HOME
[Environment]::SetEnvironmentVariable("JAVA_HOME", $javaPath, "Machine")

Write-Host "Java installation completed successfully!"
Write-Host "Please close and reopen your terminal, then run 'java -version' to verify the installation." 