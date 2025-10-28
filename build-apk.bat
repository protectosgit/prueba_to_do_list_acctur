@echo off
echo ========================================
echo Compilando APK para Android
echo ========================================

:: Verificar que las variables estén configuradas
if "%ANDROID_HOME%"=="" (
    echo ERROR: ANDROID_HOME no esta configurado
    echo Ejecuta setup-android.bat primero
    pause
    exit /b 1
)

echo Limpiando proyecto...
call cordova clean

echo.
echo Removiendo plataforma Android...
call cordova platform remove android

echo.
echo Agregando plataforma Android...
call cordova platform add android

echo.
echo Compilando APK...
call cordova build android

if errorlevel 1 (
    echo.
    echo ERROR: La compilacion fallo
    echo Intentando con version especifica de build-tools...
    call cordova build android -- --gradleArg=-PcdvBuildToolsVersion=33.0.0
)

echo.
echo ========================================
if exist "platforms\android\app\build\outputs\apk\debug\app-debug.apk" (
    echo APK compilado exitosamente!
    echo Ubicacion: platforms\android\app\build\outputs\apk\debug\app-debug.apk
    
    :: Renombrar APK con versión
    copy "platforms\android\app\build\outputs\apk\debug\app-debug.apk" "platforms\android\app\build\outputs\apk\debug\todo-app-v3.0.0-debug.apk"
    echo.
    echo APK renombrado: todo-app-v3.0.0-debug.apk
) else (
    echo ERROR: No se genero el APK
)
echo ========================================
pause
