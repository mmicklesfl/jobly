"use strict";

/** Routes for jobs. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError, NotFoundError, UnauthorizedError } = require("../expressError");
const { authenticateJWT, ensureLoggedIn, ensureAdmin } = require("../middleware/auth");

const Job = require("../models/job");

const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");

const router = new express.Router();

/** POST / { job } => { job }
 *
 * Job should be { title, salary, equity, company_handle }
 *
 * Returns { id, title, salary, equity, company_handle }
 *
 * Authorization required: admin
 */
router.post("/", ensureLoggedIn, ensureAdmin, async function (req, res, next) {
    try {
      const validator = jsonschema.validate(req.body, jobNewSchema);
      if (!validator.valid) {
        const errs = validator.errors.map(e => e.stack);
        throw new BadRequestError(errs);
      }
  
      const job = await Job.create(req.body);
      return res.status(201).json({ job });
    } catch (err) {
      return next(err);
    }
  });
  
  /** GET / =>
   *   { jobs: [{ id, title, salary, equity, company_handle }, ...] }
   *
   * Authorization required: none
   */
  router.get("/", async function (req, res, next) {
    try {
      // Parse query parameters
      const { title, minSalary, hasEquity } = req.query;
      const filters = {};
  
      if (title) filters.title = title;
      if (minSalary !== undefined) filters.minSalary = parseInt(minSalary);
      if (hasEquity === 'true') filters.hasEquity = true;
  
      const jobs = await Job.findAll(filters);
      return res.json({ jobs });
    } catch (err) {
      return next(err);
    }
  });
  
  /** GET /[id] => { job }
   *
   * Returns { id, title, salary, equity, company_handle }
   *
   * Authorization required: none
   */
  router.get("/:id", async function (req, res, next) {
    try {
      const job = await Job.get(req.params.id);
      return res.json({ job });
    } catch (err) {
      if (err instanceof NotFoundError) {
        return res.status(404).json({ error: err.message });
      }
      return next(err);
    }
  });
  
  /** PATCH /[id] { fld1, fld2, ... } => { job }
   *
   * Patches job data.
   *
   * Fields can be: { title, salary, equity }
   *
   * Returns { id, title, salary, equity, company_handle }
   *
   * Authorization required: admin
   */
  router.patch("/:id", ensureLoggedIn, ensureAdmin, async function (req, res, next) {
    try {
      const validator = jsonschema.validate(req.body, jobUpdateSchema);
      if (!validator.valid) {
        const errs = validator.errors.map(e => e.stack);
        throw new BadRequestError(errs);
      }
  
      const job = await Job.update(req.params.id, req.body);
      return res.json({ job });
    } catch (err) {
      return next(err);
    }
  });
  
  /** DELETE /[id] => { deleted: id }
   *
   * Authorization required: admin
   */
  router.delete("/:id", ensureLoggedIn, ensureAdmin, async function (req, res, next) {
    try {
      await Job.remove(req.params.id);
      return res.json({ deleted: req.params.id });
    } catch (err) {
      return next(err);
    }
  });
  
  module.exports = router;