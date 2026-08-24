const {
  parsePagination,
  buildPaginatedResponse,
} = require("../src/utils/pagination");

describe("parsePagination", () => {
  test("should return default pagination values", () => {
    expect(parsePagination({})).toEqual({
      page: 1,
      limit: 20,
      skip: 0,
    });
  });

  test("should calculate skip correctly", () => {
    expect(
      parsePagination({
        page: "3",
        limit: "10",
      })
    ).toEqual({
      page: 3,
      limit: 10,
      skip: 20,
    });
  });

  test("should not allow page below 1", () => {
    expect(
      parsePagination({
        page: "-5",
        limit: "10",
      })
    ).toEqual({
      page: 1,
      limit: 10,
      skip: 0,
    });
  });

  test("should not allow limit above 100", () => {
    expect(
      parsePagination({
        page: "1",
        limit: "500",
      })
    ).toEqual({
      page: 1,
      limit: 100,
      skip: 0,
    });
  });

  test("should build paginated response correctly", () => {
    const data = [
      { id: 1, title: "Task 1" },
      { id: 2, title: "Task 2" },
    ];

    expect(
      buildPaginatedResponse(data, 10, 1, 20)
    ).toEqual({
      data,
      total: 10,
      page: 1,
      limit: 20,
    });
  });
});