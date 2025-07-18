@echo off
REM Build the React app
echo Building React app...
npm run build

REM Remove old static files (except node_modules, src, public, package.json, etc.)
echo Cleaning up old build files...
for %%f in (asset-manifest.json favicon.ico index.html logo192.png logo512.png manifest.json robots.txt static) do (
    if exist %%f (
        if exist %%f\ (
            rmdir /s /q %%f
        ) else (
            del /q %%f
        )
    )
)

REM Copy new build files to docs root
echo Copying new build files...
xcopy build\*.* . /E /Y /I

REM Remove the build directory
echo Removing build directory...
rmdir /s /q build

echo Deployment files are ready in /docs. Commit and push to GitHub!
pause