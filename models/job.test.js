"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

describe("create", function () {
    test("works", async function () {
      let job = await Job.create({
        title: "New Job",
        salary: 100000,
        equity: 0.1,
        company_handle: "c1",
      });
      expect(job).toEqual({
        id: expect.any(Number),
        title: "New Job",
        salary: 100000,
        equity: 0.1,
        company_handle: "c1",
      });
    });
  
    test("fails with duplicate job", async function () {
      try {
        await Job.create({
          title: "New Job",
          salary: 100000,
          equity: 0.1,
          company_handle: "c1",
        });
        await Job.create({
          title: "New Job",
          salary: 100000,
          equity: 0.1,
          company_handle: "c1",
        });
        fail();
      } catch (err) {
        expect(err instanceof BadRequestError).toBeTruthy();
      }
    });
  });


  describe("findAll", function () {
    test("works: no filter", async function () {
      let jobs = await Job.findAll();
      expect(jobs).toEqual([
        {
          id: expect.any(Number),
          title: "Job1",
          salary: 100,
          equity: 0,
          company_handle: "c1",
        },
        {
          id: expect.any(Number),
          title: "Job2",
          salary: 200,
          equity: 0.1,
          company_handle: "c2",
        },
        {
          id: expect.any(Number),
          title: "Job3",
          salary: 300,
          equity: 0, 
          company_handle: "c3",
        },
      ]);
    });
  });

  describe("get", function () {
    test("works", async function () {
      const result = await db.query("SELECT id FROM jobs WHERE title='Job1'");
      const jobId = result.rows[0].id;
  
      let job = await Job.get(jobId);
      expect(job).toEqual({
        id: jobId, 
        title: "Job1",
        salary: 100,
        equity: 0,
        company_handle: "c1",
      });
    });
  
    test("not found if no such job", async function () {
      try {
        await Job.get(0);
        fail();
      } catch (err) {
        expect(err instanceof NotFoundError).toBeTruthy();
      }
    });
  });


  describe("update", function () {
    test("works", async function () {
        const result = await db.query("SELECT id FROM jobs WHERE title='Job1'");
        const jobId = result.rows[0].id;
    
        let job = await Job.update(jobId, {
          title: "Updated Job",
        });

      expect(job).toEqual({
        id: jobId,
        title: "Updated Job",
        salary: 100, 
        equity: 0, 
        company_handle: "c1",
      });
    });
  
    test("not found if no such job", async function () {
      try {
        await Job.update(0, { title: "No Job" });
        fail();
      } catch (err) {
        expect(err instanceof NotFoundError).toBeTruthy();
      }
    });
  });
  

describe("remove", function () {
  test("works", async function () {
    const result = await db.query("SELECT id FROM jobs WHERE title='Job1'");
    const jobId = result.rows[0].id;

    await Job.remove(jobId);

    const res = await db.query("SELECT id FROM jobs WHERE id=$1", [jobId]);
    expect(res.rows.length).toEqual(0); 
  });

  test("not found if no such job", async function () {
    try {
      await Job.remove(0); 
      fail(); 
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy(); 
    }
  });
});
