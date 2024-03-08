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

/************************************** POST /jobs */

describe("POST /jobs", function () {
    const newJob = {
        title: "New Job",
        salary: 50000,
        equity: 0.05, 
        company_handle: "c1"
      };      
  
    test("ok for admins", async function () {
      const resp = await request(app)
          .post("/jobs")
          .send(newJob)
          .set("authorization", `Bearer ${adminToken}`);
      expect(resp.statusCode).toBe(201);
      expect(resp.body).toEqual({
        job: {
          id: expect.any(Number),
          title: "New Job",
          salary: 50000,
          equity: 0.05,
          company_handle: "c1"
        },
      });
    });
  
    test("unauth for non-admins", async function () {
      const resp = await request(app)
          .post("/jobs")
          .send(newJob)
          .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toBe(401);
    });
  
    test("bad request with missing data", async function () {
      const resp = await request(app)
          .post("/jobs")
          .send({
            salary: 50000,
            equity: 0.05,
            company_handle: "c1"
          })
          .set("authorization", `Bearer ${adminToken}`);
      expect(resp.statusCode).toBe(400);
    });
  
    test("bad request with invalid data", async function () {
      const resp = await request(app)
          .post("/jobs")
          .send({
            ...newJob,
            salary: "not-a-number",
          })
          .set("authorization", `Bearer ${adminToken}`);
      expect(resp.statusCode).toBe(400);
    });
  });


  /************************************** GET /jobs */

  describe("GET /jobs", function () {
    test("gets all jobs without filter", async function () {
      const resp = await request(app).get("/jobs");
      expect(resp.statusCode).toBe(200);
      expect(resp.body.jobs).toEqual(expect.arrayContaining([
        expect.objectContaining({
          title: "Job1",
          salary: 100000,
          equity: 0,
          company_handle: "c1",
        }),
        expect.objectContaining({
          title: "Job2",
          salary: 200000,
          equity: 0.1,
          company_handle: "c2",
        })
      ]));
    });
  
    test("gets jobs with title filter", async function () {
        const resp = await request(app).get("/jobs").query({ title: "Job1" });
        expect(resp.statusCode).toBe(200);
        expect(resp.body.jobs).toEqual(expect.arrayContaining([
          expect.objectContaining({
            title: "Job1",
            salary: 100000,
            equity: 0,
            company_handle: "c1",
          })
        ]));
      });
  
    test("gets jobs with minSalary filter", async function () {
      const resp = await request(app).get("/jobs").query({ minSalary: 200000 });
      expect(resp.body.jobs).toEqual(expect.arrayContaining([
        expect.objectContaining({
          title: "Job2",
          salary: 200000,
          equity: 0.1,
          company_handle: "c2",
        })
      ]));
    });
  
    test("gets jobs with hasEquity filter", async function () {
      const resp = await request(app).get("/jobs").query({ hasEquity: 'true' });
      expect(resp.body.jobs).toEqual(expect.arrayContaining([
        expect.objectContaining({
          title: "Job2",
          salary: 200000,
          equity: 0.1,
          company_handle: "c2",
        })
      ]));
    });
  });
  
    /************************************** GET /jobs/[id] */

    describe("GET /jobs/:id", function () {
        test("gets a job by id", async function () {
          const jobResp = await request(app)
              .post("/jobs")
              .send({
                title: "Test Job",
                salary: 100000,
                equity: 0,
                company_handle: "c1",
              })
              .set("authorization", `Bearer ${adminToken}`);
          const jobId = jobResp.body.job.id;
      
          const resp = await request(app).get(`/jobs/${jobId}`);
          expect(resp.statusCode).toBe(200);
          expect(resp.body.job).toEqual({
            id: jobId,
            title: "Test Job",
            salary: 100000,
            equity: 0,
            company_handle: "c1",
          });
        });
      
        test("responds with 404 if job not found", async function () {
          const resp = await request(app).get(`/jobs/0`); 
          expect(resp.statusCode).toBe(404);
        });
      });
      

    /**************************************  PATCH /[id] */

    describe("PATCH /jobs/:id", function () {
        let job;
      
        beforeAll(async function () {
            await commonBeforeAll(); 
        
            const resp = await request(app)
              .get("/jobs")
              .set("authorization", `Bearer ${adminToken}`); 
            job = resp.body.jobs.find(job => job.title === "Job1"); 
          });
        
          test("ok for admins", async function () {
            const resp = await request(app)
                .patch(`/jobs/${job.id}`)
                .send({
                  title: "Updated Job",
                  salary: 70000,
                })
                .set("authorization", `Bearer ${adminToken}`);
            expect(resp.statusCode).toBe(200);
            expect(resp.body.job).toEqual(expect.objectContaining({
              id: job.id,
              title: "Updated Job",
              salary: 70000,
              equity: 0, 
              company_handle: "c1", 
            }));
          });
      
        test("unauth for non-admins", async function () {
          const resp = await request(app)
              .patch(`/jobs/${job.id}`)
              .send({
                title: "Updated Job",
              })
              .set("authorization", `Bearer ${u1Token}`);
          expect(resp.statusCode).toBe(401);
        });
      
        test("not found for no such job", async function () {
          const resp = await request(app)
              .patch(`/jobs/0`) 
              .send({
                title: "No Job",
              })
              .set("authorization", `Bearer ${adminToken}`);
          expect(resp.statusCode).toBe(404);
        });
      
        test("bad request on id change attempt", async function () {
          const resp = await request(app)
              .patch(`/jobs/${job.id}`)
              .send({
                id: "new-id",
              })
              .set("authorization", `Bearer ${adminToken}`);
          expect(resp.statusCode).toBe(400);
        });
      
        test("bad request with invalid data", async function () {
          const resp = await request(app)
              .patch(`/jobs/${job.id}`)
              .send({
                salary: "not-a-number",
              })
              .set("authorization", `Bearer ${adminToken}`);
          expect(resp.statusCode).toBe(400);
        });
      });
      
    /**************************************  DELETE /[id] */

    describe("DELETE /jobs/:id", function () {
        let job;
      
        beforeAll(async function () {
          const jobResp = await request(app)
              .post("/jobs")
              .send({
                title: "Job To Delete",
                salary: 50000,
                equity: 0,
                company_handle: "c1",
              })
              .set("authorization", `Bearer ${adminToken}`);
          job = jobResp.body.job;
        });
      
        test("works for admins", async function () {
          const resp = await request(app)
              .delete(`/jobs/${job.id}`)
              .set("authorization", `Bearer ${adminToken}`);
          expect(resp.statusCode).toBe(200);
          expect(resp.body).toEqual({ deleted: `${job.id}` });
        });
      
        test("unauth for non-admins", async function () {
          const resp = await request(app)
              .delete(`/jobs/${job.id}`)
              .set("authorization", `Bearer ${u1Token}`);
          expect(resp.statusCode).toBe(401);
        });
      
        test("not found for no such job", async function () {
          const resp = await request(app)
              .delete(`/jobs/0`) 
              .set("authorization", `Bearer ${adminToken}`);
          expect(resp.statusCode).toBe(404);
        });
      });
      