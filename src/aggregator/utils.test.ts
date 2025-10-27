import { jest } from "@jest/globals";
import { fetchTied, fetchWithHedging } from "./utils";

beforeAll(() => {
  global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;
  jest.useFakeTimers();
});

afterEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();
});

describe("fetchWithHedging", () => {
  // primary request returns in time, no second request
  test("primary request returns in time, no second request", async () => {
    (global.fetch as jest.MockedFunction<any>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ message: "Hello from service A" }),
    });
    const result = await fetchWithHedging({
      primaryUrl: "http://localhost:3000",
      secondaryUrl: "http://localhost:3001",
      hedgeThreshold: 100,
    });
    expect(result).toEqual({ message: "Hello from service A" });
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
  // primary doesn't return so secondary call is made
  test("primary doesn't return so secondary call is made", async () => {
    (global.fetch as jest.MockedFunction<any>)
      .mockImplementationOnce(() => {
        return new Promise(() => {});
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: "Hello from service A" }),
      });
    const promise = fetchWithHedging({
      primaryUrl: "http://localhost:3000",
      secondaryUrl: "http://localhost:3001",
      hedgeThreshold: 100,
    });
    jest.advanceTimersByTimeAsync(100);
    const result = await promise;
    expect(result).toEqual({ message: "Hello from service A" });
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
  // if primary returns first successfully, secondary is aborted
  test("if primary returns first successfully, secondary is aborted", async () => {
    const abortSpy = jest.spyOn(AbortController.prototype, "abort");
    (global.fetch as jest.MockedFunction<any>)
      .mockImplementationOnce(() => {
        return new Promise((res) => {
          setTimeout(() => {
            res({
              ok: true,
              json: () => Promise.resolve({ message: "Hello from service A" }),
            });
          }, 120);
        });
      })
      .mockImplementationOnce(() => {
        return new Promise(() => {});
      });
    const promise = fetchWithHedging({
      primaryUrl: "http://localhost:3000",
      secondaryUrl: "http://localhost:3001",
      hedgeThreshold: 100,
    });
    jest.advanceTimersByTimeAsync(120);
    const result = await promise;
    expect(result).toEqual({ message: "Hello from service A" });
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(abortSpy).toHaveBeenCalled();
  });
  // if secondary returns first successfully, primary is aborted
  test("if secondary returns first successfully, primary is aborted", async () => {
    const abortSpy = jest.spyOn(AbortController.prototype, "abort");
    (global.fetch as jest.MockedFunction<any>)
      .mockImplementationOnce(() => {
        return new Promise(() => {});
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: "Hello from service A" }),
      });
    const promise = fetchWithHedging({
      primaryUrl: "http://localhost:3000",
      secondaryUrl: "http://localhost:3001",
      hedgeThreshold: 100,
    });
    jest.advanceTimersByTimeAsync(100);
    const result = await promise;
    expect(result).toEqual({ message: "Hello from service A" });
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(abortSpy).toHaveBeenCalled();
  });
  // if primary returns first with error, secondary is allowed to complete
  test("if primary returns first with error, secondary is allowed to complete", async () => {
    (global.fetch as jest.MockedFunction<any>)
      .mockImplementationOnce(() => {
        return new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error("Primary call failed"));
          }, 120);
        });
      })
      .mockImplementationOnce(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: () => Promise.resolve({ message: "Hello from service A" }),
            });
          }, 50);
        });
      });
    const promise = fetchWithHedging({
      primaryUrl: "http://localhost:3000",
      secondaryUrl: "http://localhost:3001",
      hedgeThreshold: 100,
    });
    jest.advanceTimersByTimeAsync(170);
    const result = await promise;
    expect(result).toEqual({ message: "Hello from service A" });
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
  // if secondary returns first with error, primary is allowed to complete
  test("if secondary returns first with error, primary is allowed to complete", async () => {
    (global.fetch as jest.MockedFunction<any>)
      .mockImplementationOnce(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: () => Promise.resolve({ message: "Hello from service A" }),
            });
          }, 170);
        });
      })
      .mockImplementationOnce(() => {
        return new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error("Secondary call failed"));
          }, 10);
        });
      });
    const promise = fetchWithHedging({
      primaryUrl: "http://localhost:3000",
      secondaryUrl: "http://localhost:3001",
      hedgeThreshold: 100,
    });
    jest.advanceTimersByTimeAsync(170);
    const result = await promise;
    expect(result).toEqual({ message: "Hello from service A" });
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
  // if both fail, return null
  test("if both fail, return null", async () => {
    (global.fetch as jest.MockedFunction<any>)
      .mockImplementationOnce(() => {
        return new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error("Primary call failed"));
          }, 120);
        });
      })
      .mockImplementationOnce(() => {
        return new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error("Secondary call failed"));
          }, 50);
        });
      });
    const promise = fetchWithHedging({
      primaryUrl: "http://localhost:3000",
      secondaryUrl: "http://localhost:3001",
      hedgeThreshold: 100,
    });
    jest.advanceTimersByTimeAsync(170);
    const result = await promise;
    expect(result).toEqual(null);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});

describe("fetchTied", () => {
  test("if one request completes, other is aborted", async () => {
    const abortSpy = jest.spyOn(AbortController.prototype, "abort");
    (global.fetch as jest.MockedFunction<any>)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: "Hello from service A" }),
      })
      .mockImplementationOnce(() => new Promise(() => {}));
    const promise = fetchTied({
      primaryUrl: "http://localhost:3000",
      secondaryUrl: "http://localhost:3001",
    });
    const result = await promise;
    expect(result).toEqual({ message: "Hello from service A" });
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(abortSpy).toHaveBeenCalled();
  });

  test("if one request fails, other is allowed to complete", async () => {
    (global.fetch as jest.MockedFunction<any>)
      .mockRejectedValueOnce(new Error("Primary call failed"))
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: "Hello from service A" }),
      });
    const promise = fetchTied({
      primaryUrl: "http://localhost:3000",
      secondaryUrl: "http://localhost:3001",
    });
    const result = await promise;
    expect(result).toEqual({ message: "Hello from service A" });
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  test("if both fail, return null", async () => {
    (global.fetch as jest.MockedFunction<any>)
      .mockRejectedValueOnce(new Error("Primary call failed"))
      .mockRejectedValueOnce(new Error("Secondary call failed"));
    const promise = fetchTied({
      primaryUrl: "http://localhost:3000",
      secondaryUrl: "http://localhost:3001",
    });
    const result = await promise;
    expect(result).toEqual(null);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
