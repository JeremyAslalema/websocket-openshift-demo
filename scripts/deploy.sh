#!/bin/bash

echo "🚀 Iniciando despliegue en OpenShift..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar que oc está instalado
if ! command -v oc &> /dev/null; then
    echo -e "${RED}❌ OpenShift CLI (oc) no está instalado${NC}"
    exit 1
fi

# Verificar que el usuario está logueado
if ! oc whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  No has iniciado sesión en OpenShift${NC}"
    echo "Por favor, ejecuta: oc login --token=<TU_TOKEN> --server=https://api.CLUSTER_URL:6443"
    exit 1
fi

echo -e "${GREEN}✅ Usuario: $(oc whoami)${NC}"

# Crear proyecto si no existe
PROJECT_NAME="websocket-demo"
if ! oc get project $PROJECT_NAME &> /dev/null; then
    echo -e "${YELLOW}📁 Creando proyecto $PROJECT_NAME...${NC}"
    oc new-project $PROJECT_NAME --display-name="WebSocket Demo" --description="Demo de WebSocket con Socket.io"
else
    echo -e "${GREEN}✅ Proyecto $PROJECT_NAME ya existe${NC}"
fi

# Cambiar al proyecto
oc project $PROJECT_NAME

# Construir la imagen con S2I (Source-to-Image)
echo -e "${YELLOW}🔨 Construyendo imagen con S2I...${NC}"
oc new-build nodejs:20-ubi8~https://github.com/tu-usuario/websocket-openshift-demo.git \
  --context-dir=server \
  --name=websocket-server \
  --strategy=source

# Esperar a que el build esté listo
echo -e "${YELLOW}⏳ Esperando a que el build se complete...${NC}"
oc logs -f bc/websocket-server

# Desplegar la aplicación
echo -e "${YELLOW}📦 Desplegando aplicación...${NC}"
oc apply -f openshift/deployment.yaml
oc apply -f openshift/service.yaml
oc apply -f openshift/route.yaml

# Exponer la ruta
echo -e "${YELLOW}🌐 Creando ruta...${NC}"
oc expose svc/websocket-server --port=8080 || true

# Obtener la URL
ROUTE_URL=$(oc get route websocket-server -o jsonpath='{.spec.host}')
echo -e "${GREEN}✅ Despliegue completado!${NC}"
echo -e "${GREEN}🌐 URL del servidor: https://$ROUTE_URL${NC}"
echo -e "${GREEN}📡 Health check: https://$ROUTE_URL/health${NC}"
echo ""
echo -e "${YELLOW}📝 Para probar el cliente local, actualiza la URL a:${NC}"
echo -e "${GREEN}   https://$ROUTE_URL${NC}"
echo ""
echo -e "${YELLOW}📊 Para ver los logs:${NC}"
echo -e "${GREEN}   oc logs -f deployment/websocket-server${NC}"