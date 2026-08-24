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
} = require("../src/models");

describe("Validation and error integration tests", () => {
  let user;
  let organization;
  let project;
  let accessToken;

  beforeAll(async () => {
    await sequelize.authenticate();

    organization = await Organization.create({
      name: `Validation Org ${Date.now()}`,
    });

    const password = await bcrypt.hash("password123", 12);

    user = await User.create({
      name: "Validation User",
      email: `validation-${Date.now()}@example.com`,
      password,
    });

    await OrgMember.create({
      user_id: user.id,
      organization_id: organization.id,
      role: "org_admin",
    });

    const loginResponse = await request(app)
      .post("/auth/login")
      .send({
        email: user.email,
        password: "password123",
      });

    expect(loginResponse.statusCode).toBe(200);

    accessToken = loginResponse.body.accessToken;

    project = await Project.create({
      name: "Validation Project",
      description: "Validation test project",
      organization_id: organization.id,
    });
  });

  afterAll(async () => {
    await Refreshtoken.destroy({
      where: { user_id: user.id },
    });

    await Project.destroy({
      where: { id: project.id },
    });

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

  test("should reject task when title is missing", async () => {
    const response = await request(app)
      .post("/tasks")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        project_id: project.id,
      });

    expect(response.statusCode).toBe(422);

    expect(response.body).toMatchObject({
      error: "Validation failed",
      code: "VALIDATION_ERROR",
    });

    expect(response.body.details).toMatchObject({
      title: "Title is required",
    });
  });

  test("should reject task when project_id is missing", async () => {
    const response = await request(app)
      .post("/tasks")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        title: "Test Task",
      });

    expect(response.statusCode).toBe(422);

    expect(response.body).toMatchObject({
      error: "Validation failed",
      code: "VALIDATION_ERROR",
    });

    expect(response.body.details).toMatchObject({
      project_id: "project_id is required",
    });
  });

  test("should reject task with invalid status", async () => {
    const response = await request(app)
      .post("/tasks")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        title: "Test Task",
        project_id: project.id,
        status: "invalid_status",
      });

    expect(response.statusCode).toBe(422);

    expect(response.body).toMatchObject({
      error: "Validation failed",
      code: "VALIDATION_ERROR",
    });

    expect(response.body.details.status).toContain(
      "Must be one of"
    );
  });

  test("should reject task with invalid priority", async () => {
    const response = await request(app)
      .post("/tasks")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        title: "Test Task",
        project_id: project.id,
        priority: "invalid_priority",
      });

    expect(response.statusCode).toBe(422);

    expect(response.body).toMatchObject({
      error: "Validation failed",
      code: "VALIDATION_ERROR",
    });

    expect(response.body.details.priority).toContain(
      "Must be one of"
    );
  });

  test("should return 404 for a non-existent task", async () => {
    const response = await request(app)
      .get("/tasks/999999")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(404);

    expect(response.body).toMatchObject({
      error: "Task not found",
      code: "TASK_NOT_FOUND",
    });
  });
});