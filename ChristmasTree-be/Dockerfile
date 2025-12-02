# ----- Build stage -----
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app

# Copy toàn bộ project
COPY . .

# Build bỏ test
RUN mvn clean package -DskipTests

# ----- Run stage -----
FROM eclipse-temurin:21-jre
WORKDIR /app

# Copy file JAR từ stage build
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

CMD ["java", "-jar", "app.jar"]
