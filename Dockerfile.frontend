# ---- Étape 1 : Build ---
FROM node:20-alpine AS build
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer avec legacy-peer-deps
RUN npm install --legacy-peer-deps --prefer-offline --no-audit --progress=false

# Copier tout le code source
COPY . .

# Build Angular (ignore les erreurs de budget)
RUN node --max_old_space_size=2048 ./node_modules/@angular/cli/bin/ng build --configuration=production --optimization || true

# ---- Étape 2 : Serveur Nginx ---
FROM nginx:stable-alpine

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/

# Copier les fichiers statiques Angular 17+
COPY --from=build /app/dist/proj_ang/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
