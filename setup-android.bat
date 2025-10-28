@echo off
echo ========================================
echo Configurando Variables de Entorno Android
echo ========================================

:: Configurar ANDROID_HOME
setx ANDROID_HOME "C:\Users\felix\AppData\Local\Android\Sdk" /M
echo ANDROID_HOME configurado

:: Configurar JAVA_HOME (buscar en múltiples ubicaciones posibles)
if exist "C:\Program Files\Android\Android Studio\jbr" (
    setx JAVA_HOME "C:\Program Files\Android\Android Studio\jbr" /M
    echo JAVA_HOME configurado en Android Studio JBR
) else if exist "C:\Program Files\Java\jdk-21" (
    setx JAVA_HOME "C:\Program Files\Java\jdk-21" /M
    echo JAVA_HOME configurado en JDK-21
) else if exist "C:\Program Files\Java\jdk-17" (
    setx JAVA_HOME "C:\Program Files\Java\jdk-17" /M
    echo JAVA_HOME configurado en JDK-17
) else (
    echo WARNING: No se encontro JAVA_HOME automaticamente
    echo Por favor configura JAVA_HOME manualmente
)

:: Agregar al PATH
setx PATH "%PATH%;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\tools;%ANDROID_HOME%\tools\bin;%JAVA_HOME%\bin" /M
echo PATH actualizado

echo.
echo ========================================
echo IMPORTANTE: Cierra y vuelve a abrir PowerShell
echo ========================================
pause
