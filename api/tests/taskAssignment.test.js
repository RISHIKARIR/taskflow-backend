const mockTransaction = {
  commit: jest.fn(),
  rollback: jest.fn(),
};

jest.mock("../src/models", () => ({
  Task: {
    findOne: jest.fn(),
  },
  Project: {},
  org_members: {
    findOne: jest.fn(),
  },
  TaskAssignment: {
    create: jest.fn(),
  },
  sequelize: {
    transaction: jest.fn(() => Promise.resolve(mockTransaction)),
  },
}));

jest.mock("../src/queues/emailQueue", () => ({
  enqueueAssignmentEmail: jest.fn(),
}));

const {
  Task,
  org_members: OrgMember,
  TaskAssignment,
} = require("../src/models");

const {
  enqueueAssignmentEmail,
} = require("../src/queues/emailQueue");

const { AppError } = require("../src/utils/errors");

const taskService = require("../src/services/taskService");

describe("Task assignment validation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should reject assignment when user is not a member of the organization", async () => {
    Task.findOne.mockResolvedValue({
      id: 1,
      Project: {
        organization_id: 1,
      },
    });

    OrgMember.findOne.mockResolvedValue(null);

    await expect(
      taskService.assignTask(1, 1, 2, 3)
    ).rejects.toMatchObject({
      message: "User does not belong to this organization",
      code: "USER_NOT_IN_ORG",
      statusCode: 403,
    });

    expect(OrgMember.findOne).toHaveBeenCalledWith({
      where: {
        user_id: 2,
        organization_id: 1,
      },
      transaction: mockTransaction,
    });

    expect(TaskAssignment.create).not.toHaveBeenCalled();
    expect(enqueueAssignmentEmail).not.toHaveBeenCalled();
    expect(mockTransaction.rollback).toHaveBeenCalled();
  });

  test("should allow assignment when user belongs to the organization", async () => {
    Task.findOne.mockResolvedValue({
      id: 1,
      Project: {
        organization_id: 1,
      },
    });

    OrgMember.findOne.mockResolvedValue({
      user_id: 2,
      organization_id: 1,
      role: "member",
    });

    TaskAssignment.create.mockResolvedValue({
      id: 10,
      task_id: 1,
      user_id: 2,
    });

    enqueueAssignmentEmail.mockResolvedValue({
      id: "job-10",
    });

    const result = await taskService.assignTask(1, 1, 2, 3);

    expect(TaskAssignment.create).toHaveBeenCalledWith(
      {
        task_id: 1,
        user_id: 2,
      },
      {
        transaction: mockTransaction,
      }
    );

    expect(enqueueAssignmentEmail).toHaveBeenCalledWith(
      1,
      2,
      3
    );

    expect(mockTransaction.commit).toHaveBeenCalled();

    expect(result).toEqual({
      assignment: {
        id: 10,
        task_id: 1,
        user_id: 2,
      },
      jobId: "job-10",
    });
  });
});