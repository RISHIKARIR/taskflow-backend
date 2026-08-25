const express = require("express");
const authRoutes = require("./src/routes/auth.route");
const projectRoutes = require("./src/routes/project.route");
const taskRoutes = require("./src/routes/task.route");
const jobRoutes = require("./src/routes/jobRoutes");
const orgMemberRoutes = require("./src/routes/orgMember.route");
const {errorHandler} = require("./src/utils/errors");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./src/docs/openapi")


const app = express();


app.use(express.json());
app.use("/auth", authRoutes);
app.use("/projects", projectRoutes);
app.use("/tasks", taskRoutes);
app.use("/jobs", jobRoutes);

app.use("/members", orgMemberRoutes);


app.get("/api-docs/swagger.json", (req, res) => {
  res.json(swaggerDocument);
});



app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));


app.use(errorHandler);


module.exports = app;