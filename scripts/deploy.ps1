Write-Host "🚀 Iniciando despliegue en OpenShift..." -ForegroundColor Yellow

# Verificar que oc está instalado
if (!(Get-Command oc -ErrorAction SilentlyContinue)) {
    Write-Host "❌ OpenShift CLI (oc) no está instalado" -ForegroundColor Red
    exit 1
}

# Verificar login
$user = oc whoami 2>$null
if (!$user) {
    Write-Host "⚠️  No has iniciado sesión en OpenShift" -ForegroundColor Yellow
    Write-Host "Por favor, ejecuta: oc login --token=<TU_TOKEN> --server=https://api.CLUSTER_URL:6443"
    exit 1
}

Write-Host "✅ Usuario: $user" -ForegroundColor Green

# Crear proyecto
$PROJECT_NAME = "websocket-demo"
$projectExists = oc get project $PROJECT_NAME 2>$null

if (!$projectExists) {
    Write-Host "📁 Creando proyecto $PROJECT_NAME..." -ForegroundColor Yellow
    oc new-project $PROJECT_NAME --display-name="WebSocket Demo" --description="Demo de WebSocket con Socket.io"
} else {
    Write-Host "✅ Proyecto $PROJECT_NAME ya existe" -ForegroundColor Green
}

# Cambiar al proyecto
oc project $PROJECT_NAME

# Aplicar manifiestos
Write-Host "📦 Desplegando aplicación..." -ForegroundColor Yellow
oc apply -f openshift/deployment.yaml
oc apply -f openshift/service.yaml
oc apply -f openshift/route.yaml

# Esperar a que el pod esté listo
Write-Host "⏳ Esperando a que el pod esté listo..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
oc wait --for=condition=ready pod -l app=websocket-server --timeout=60s

# Obtener la URL
$ROUTE_URL = oc get route websocket-server -o jsonpath='{.spec.host}'
Write-Host "`n✅ Despliegue completado!" -ForegroundColor Green
Write-Host "🌐 URL del servidor: https://$ROUTE_URL" -ForegroundColor Green
Write-Host "📡 Health check: https://$ROUTE_URL/health" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Para probar localmente, abre client/index.html y usa:" -ForegroundColor Yellow
Write-Host "   https://$ROUTE_URL" -ForegroundColor Green