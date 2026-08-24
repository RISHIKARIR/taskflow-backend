const express = require("express");
const authRoutes = require("./src/routes/auth.route");
const projectRoutes = require("./src/routes/project.route");
const taskRoutes = require("./src/routes/task.route");
const jobRoutes = require("./src/routes/jobRoutes");
const orgMemberRoutes = require("./src/routes/orgMember.route");

const app = express();
const port = 3000;

app.use(express.json());
app.use("/auth", authRoutes);
app.use("/projects", projectRoutes);
app.use("/tasks", taskRoutes);
app.use("/jobs", jobRoutes);
app.use("/members", orgMemberRoutes);

app.listen(port, () => {
  console.log(`${port}`, "Port is listening");
});