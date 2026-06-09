# Étape 1 : Build de l'application
FROM 192.168.1.239:8085/selfkhaoula/maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /app
# Copie des fichiers de dépendances pour utiliser le cache Docker
COPY pom.xml .
RUN mvn dependency:go-offline -B
# Copie du code source et compilation
COPY src ./src
RUN mvn clean package -DskipTests -B

# Étape 2 : Image finale légère (JRE seulement)
FROM 192.168.1.239:8085/selfkhaoula/eclipse-temurin:17-jre-alpine
WORKDIR /app
# Création d'un utilisateur non-root pour la sécurité
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring
# Copie du jar généré à l'étape 1
COPY --from=builder /app/target/*.jar app.jar
# Exposition du port (à adapter si votre app écoute sur un autre port)
EXPOSE 8080
# Commande de lancement
ENTRYPOINT ["java", "-jar", "app.jar"]
