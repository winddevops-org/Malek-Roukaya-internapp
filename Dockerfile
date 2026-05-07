ok je garde mon docker file ? # ---- Étape 1 : Build ---
FROM node:20-alpine AS build
WORKDIR /app

# Optimisation : copier seulement package.json d'abord
COPY src/package*.json ./

# Utiliser npm install avec cache
RUN npm install --prefer-offline --no-audit --progress=false

# Copier le reste du code
COPY src/ .

# Build avec optimisation mémoire
RUN node --max_old_space_size=2048 ./node_modules/@angular/cli/bin/ng build --prod --optimization

# ---- Étape 2 : Serveur Nginx ---
FROM nginx:stable-alpine

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/

COPY --from=build /app/dist/wind-dev-ops-plattform /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
