"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  adminToken,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /companies */

describe("POST /companies", function () {
  const newCompany = {
    handle: "new",
    name: "New",
    logoUrl: "http://new.img",
    description: "DescNew",
    numEmployees: 10,
  };

  // Removed the "ok for users" test since non-admin users should not be able to create companies

  test("bad request with missing data for admin", async function () {
    console.log("Using adminToken:", adminToken); // Correctly placed
    const resp = await request(app)
        .post("/companies")
        .send({
          handle: "new",
          numEmployees: 10,
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data for admin", async function () {
    console.log("Using adminToken:", adminToken); // Correctly placed
    const resp = await request(app)
        .post("/companies")
        .send({
          ...newCompany,
          logoUrl: "not-a-url",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  describe("POST /companies admin authorization", function () {
    test("ok for admin users", async function () {
      console.log("Using adminToken:", adminToken); // Correctly placed
      const resp = await request(app)
          .post("/companies")
          .send(newCompany)
          .set("authorization", `Bearer ${adminToken}`);
      expect(resp.statusCode).toEqual(201);
      expect(resp.body).toEqual({
        company: newCompany,
      });
    });

    test("unauthorized for non-admin users", async function () {
      console.log("Using u1Token for non-admin test:", u1Token); // Correctly placed and clarified
      const resp = await request(app)
          .post("/companies")
          .send(newCompany)
          .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(401);
    });
  });
});


/************************************** GET /companies */

describe("GET /companies", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/companies");
    expect(resp.body).toEqual({
      companies:
          [
            {
              handle: "c1",
              name: "C1",
              description: "Desc1",
              numEmployees: 1,
              logoUrl: "http://c1.img",
            },
            {
              handle: "c2",
              name: "C2",
              description: "Desc2",
              numEmployees: 2,
              logoUrl: "http://c2.img",
            },
            {
              handle: "c3",
              name: "C3",
              description: "Desc3",
              numEmployees: 3,
              logoUrl: "http://c3.img",
            },
          ],
    });
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE companies CASCADE");
    const resp = await request(app)
        .get("/companies")
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(500);
  });
});

/************************************** GET /companies with filters */

describe("GET /companies with filters", function () {
  test("Filters by name", async function () {
    const response = await request(app)
      .get("/companies")
      .query({ name: "net" });
    expect(response.body.companies).toEqual([
      // Expect array containing companies with "net" in their name
    ]);
    expect(response.statusCode).toBe(200);
  });

  test("Filters by minEmployees", async function () {
    const response = await request(app)
      .get("/companies")
      .query({ minEmployees: 50 });
    expect(response.body.companies.every(c => c.numEmployees >= 50)).toBe(true);
    expect(response.statusCode).toBe(200);
  });

  test("Filters by maxEmployees", async function () {
    const response = await request(app)
      .get("/companies")
      .query({ maxEmployees: 100 });
    expect(response.body.companies.every(c => c.numEmployees <= 100)).toBe(true);
    expect(response.statusCode).toBe(200);
  });

  test("Validates minEmployees is not greater than maxEmployees", async function () {
    const response = await request(app)
      .get("/companies")
      .query({ minEmployees: 100, maxEmployees: 50 });
    expect(response.statusCode).toBe(400);
    expect(response.body.error.message).toEqual("minEmployees cannot be greater than maxEmployees.");
  });
});

/************************************** GET /companies/:handle */

describe("GET /companies/:handle", function () {
  test("works for anon", async function () {
    const resp = await request(app).get(`/companies/c1`);
    expect(resp.body).toEqual({
      company: {
        handle: "c1",
        name: "C1",
        description: "Desc1",
        numEmployees: 1,
        logoUrl: "http://c1.img",
      },
    });
  });

  test("works for anon: company w/o jobs", async function () {
    const resp = await request(app).get(`/companies/c2`);
    expect(resp.body).toEqual({
      company: {
        handle: "c2",
        name: "C2",
        description: "Desc2",
        numEmployees: 2,
        logoUrl: "http://c2.img",
      },
    });
  });

  test("not found for no such company", async function () {
    const resp = await request(app).get(`/companies/nope`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /companies/:handle */

describe("PATCH /companies/:handle", function () {
    test("works for admin", async function () {
      const resp = await request(app)
          .patch(`/companies/c1`)
          .send({ name: "C1-new" })
          .set("authorization", `Bearer ${adminToken}`);
      expect(resp.statusCode).toEqual(200);
    });
  
    test("unauth for non-admin users", async function () {
      const resp = await request(app)
          .patch(`/companies/c1`)
          .send({ name: "C1-new" })
          .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(401);
    });
  
    test("unauth for anon", async function () {
      const resp = await request(app)
        .patch(`/companies/c1`)
        .send({ name: "C1-new" });
      expect(resp.statusCode).toEqual(401);
    });

    test("not found on no such company", async function () {
      const resp = await request(app)
          .patch(`/companies/nope`)
          .send({
            name: "new nope",
          })
          .set("authorization", `Bearer ${adminToken}`); // Use adminToken instead of u1Token
      expect(resp.statusCode).toEqual(404);
    });
    
    test("bad request on handle change attempt", async function () {
      const resp = await request(app)
          .patch(`/companies/c1`)
          .send({
            handle: "c1-new",
          })
          .set("authorization", `Bearer ${adminToken}`); // Use adminToken instead of u1Token
      expect(resp.statusCode).toEqual(400);
    });
    
    test("bad request on invalid data", async function () {
      const resp = await request(app)
          .patch(`/companies/c1`)
          .send({
            logoUrl: "not-a-url",
          })
          .set("authorization", `Bearer ${adminToken}`); // Use adminToken instead of u1Token
      expect(resp.statusCode).toEqual(400);
    });
});

/************************************** DELETE /companies/:handle */

describe("DELETE /companies/:handle", function () {
  // Corrected to reflect admin-only access
  test("works for admin", async function () {
    const resp = await request(app)
        .delete(`/companies/c1`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({ deleted: "c1" });
  });

  // Test to ensure non-admin users are unauthorized
  test("unauth for non-admin users", async function () {
    const resp = await request(app)
        .delete(`/companies/c1`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  // Test for anonymous users
  test("unauth for anon", async function () {
    const resp = await request(app)
      .delete(`/companies/c1`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such company", async function () {
    const resp = await request(app)
        .delete(`/companies/nope`)
        .set("authorization", `Bearer ${adminToken}`); 
    expect(resp.statusCode).toEqual(404);
  });
});