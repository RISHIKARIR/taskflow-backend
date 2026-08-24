const request = require("supertest");
const bcrypt = require("bcrypt");

const app = require("../index");

const {
  sequelize,
  users: User,
  organizations: Organization,
  org_members: OrgMember,
  Refreshtoken,
  Project,
  Task,
} = require("../src/models");

describe("Task CRUD integration test", () => {
  let user;
  let organization;
  let project;
  let accessToken;
  let taskId;

  beforeAll(async () => {
    await sequelize.authenticate();

    organization = await Organization.create({
      name: `Test Org ${Date.now()}`,
    });

    const password = await bcrypt.hash("password123", 12);

    user = await User.create({
      name: "Task Test User",
      email: `task-test-${Date.now()}@example.com`,
      password,
    });

    await OrgMember.create({
      user_id: user.id,
      organization_id: organization.id,
      role: "org_admin",
    });

    // Login through the actual API
    const loginResponse = await request(app)
      .post("/auth/login")
      .send({
        email: user.email,
        password: "password123",
      });

    expect(loginResponse.statusCode).toBe(200);

    accessToken = loginResponse.body.accessToken;

    // Create project through the actual API
    const projectResponse = await request(app)
      .post("/projects")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Task CRUD Project",
        description: "Integration test project",
      });

    expect(projectResponse.statusCode).toBe(201);

    project = projectResponse.body;
  });

  afterAll(async () => {
    await Refreshtoken.destroy({
      where: { user_id: user.id },
    });

    if (taskId) {
      await Task.destroy({
        where: { id: taskId },
      });
    }

    if (project?.id) {
      await Project.destroy({
        where: { id: project.id },
      });
    }

    await OrgMember.destroy({
      where: { user_id: user.id },
    });

    await User.destroy({
      where: { id: user.id },
    });

    await Organization.destroy({
      where: { id: organization.id },
    });

    await sequelize.close();
  });

  test("should create a task", async () => {
    const response = await request(app)
      .post("/tasks")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        title: "Integration Test Task",
        description: "Testing task creation",
        status: "todo",
        priority: "medium",
        project_id: project.id,
        due_date: "2026-09-01",
      });

    expect(response.statusCode).toBe(201);

    expect(response.body).toMatchObject({
      title: "Integration Test Task",
      description: "Testing task creation",
      status: "todo",
      priority: "medium",
      project_id: project.id,
    });

    expect(response.body.id).toBeDefined();

    taskId = response.body.id;
  });

  test("should get the created task", async () => {
    const response = await request(app)
      .get(`/tasks/${taskId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(200);

    expect(response.body).toMatchObject({
      id: taskId,
      title: "Integration Test Task",
      project_id: project.id,
    });
  });

  test("should update the task", async () => {
    const response = await request(app)
      .patch(`/tasks/${taskId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        title: "Updated Integration Task",
        status: "in_progress",
        priority: "high",
      });

    expect(response.statusCode).toBe(200);

    expect(response.body).toMatchObject({
      id: taskId,
      title: "Updated Integration Task",
      status: "in_progress",
      priority: "high",
    });
  });

  test("should delete the task", async () => {
    const response = await request(app)
      .delete(`/tasks/${taskId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(204);

    const getResponse = await request(app)
      .get(`/tasks/${taskId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(getResponse.statusCode).toBe(404);

    taskId = null;
  });
});