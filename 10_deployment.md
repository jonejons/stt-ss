
## **10. Deployment and Operations (CI/CD)**

### **10.1. Containerization**

A multi-stage Dockerfile is used to create an optimized and secure Docker image for running the application in a production environment.

* **First stage (build):** All application dependencies are installed in a full Node.js development environment, the code is compiled from TypeScript to JavaScript, and the Prisma client is generated.  
* **Second stage (production):** This stage starts with a minimal base image like node:alpine. Only the artifacts necessary for production (the dist folder, node_modules, prisma folder) are copied from the first stage. This significantly reduces the size of the final image and minimizes the attack surface.

### **10.2. CI/CD Pipeline (GitHub Actions)**

A complete CI/CD pipeline is defined in the .github/workflows/ci.yml file to ensure that every code change is automatically verified and integrated.  
The pipeline will consist of the following parallel jobs:

1. **lint-and-format:** Checks for code style and formatting compliance (ESLint, Prettier).  
2. **unit-tests:** Runs the unit tests. This job runs quickly because it has no external dependencies.  
3. **integration-tests:** Runs the integration and E2E tests. This job starts the PostgreSQL and Redis services using Testcontainers. It guarantees that every pull request is validated against a real database.  
4. **build:** If all preceding jobs are successful, it creates the Docker image for production and pushes it to a repository like Docker Hub or GitHub Container Registry.

### **10.3. Configuration Management**

The list of all necessary environment variables to properly configure the application in different environments (development, test, production) is provided in the following table. The README.md file should include an .env.example file with these variables and their sample values.

| Variable | Description | Environment | Mandatory |
| :---- | :---- | :---- | :---- |
| NODE_ENV | The application's runtime mode. | development, production, test | Yes |
| PORT | The port the application listens on. | development, production | Yes |
| DATABASE_URL | The connection string for the PostgreSQL database. | All | Yes |
| REDIS_URL | The connection string for the Redis server. | All | Yes |
| JWT_SECRET | The secret key for signing access tokens. | All | Yes |
| JWT_EXPIRATION_TIME | The expiration time of the access token (e.g., 15m). | All | Yes |
| REFRESH_TOKEN_SECRET | The secret key for signing refresh tokens. | All | Yes |
| REFRESH_TOKEN_EXPIRATION_TIME | The expiration time of the refresh token (e.g., 7d). | All | Yes |
| S3_ENDPOINT | The endpoint URL for the S3-compatible service. | All | Yes |
| S3_ACCESS_KEY | The access key for the S3 service. | All | Yes |
| S3_SECRET_KEY | The secret key for the S3 service. | All | Yes |
| S3_BUCKET_NAME | The name of the main S3 bucket where files are stored. | All | Yes |
| LOG_LEVEL | The logging level (info, debug, warn, error). | All | Yes |

This technical specification serves as a comprehensive and clear guide for the successful implementation of the Sector Staff v2.1 project. It incorporates the best practices of modern software development and is designed to ensure the system's long-term stability and scalability.
