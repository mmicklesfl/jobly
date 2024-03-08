const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, company_handle }
   *
   * Returns { id, title, salary, equity, company_handle }
   *
   * Throws BadRequestError if job with same title for the company already in database.
   */
  static async create({ title, salary, equity, company_handle }) {
    const duplicateCheck = await db.query(
      `SELECT title 
       FROM jobs 
       WHERE title = $1 AND company_handle = $2`,
      [title, company_handle]
    );

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate job: ${title} already exists for company: ${company_handle}`);

    const result = await db.query(
      `INSERT INTO jobs (title, salary, equity, company_handle)
       VALUES ($1, $2, $3, $4)
       RETURNING id, title, salary, equity, company_handle`,
      [title, salary, equity, company_handle]
    );

    const job = result.rows[0];
    if (job.equity !== null) {
      job.equity = parseFloat(job.equity);
    }
    return job;
  }

  /** Find all jobs, optionally filtering by title, minSalary, hasEquity, and companyHandle.
   *
   * Returns [{ id, title, salary, equity, company_handle }, ...]
   */
  static async findAll({ title, minSalary, hasEquity, companyHandle } = {}) {
    let query = `SELECT id, title, salary, equity, company_handle
                 FROM jobs`;
    let whereExpressions = [];
    let queryValues = [];

    if (title) {
      queryValues.push(`%${title}%`);
      whereExpressions.push(`title ILIKE $${queryValues.length}`);
    }

    if (minSalary !== undefined) {
      queryValues.push(minSalary);
      whereExpressions.push(`salary >= $${queryValues.length}`);
    }

    if (hasEquity === true) {
      whereExpressions.push(`equity > 0`);
    }

    if (companyHandle) {
      queryValues.push(companyHandle);
      whereExpressions.push(`company_handle = $${queryValues.length}`);
    }

    if (whereExpressions.length > 0) {
      query += " WHERE " + whereExpressions.join(" AND ");
    }

    query += " ORDER BY title";

    const jobsRes = await db.query(query, queryValues);
    const jobs = jobsRes.rows.map(job => {
    if (job.equity !== null) {
      job.equity = parseFloat(job.equity);
    }
    return job;
  });
  return jobs;
}

  /** Given a job id, return data about the job.
   *
   * Returns { id, title, salary, equity, company_handle }
   *
   * Throws NotFoundError if not found.
   */
  static async get(id) {
    const jobRes = await db.query(
      `SELECT id, title, salary, equity, company_handle
       FROM jobs
       WHERE id = $1`,
      [id]
    );
  
    const job = jobRes.rows[0];
  
    if (!job) throw new NotFoundError(`No job: ${id}`);
  
    if (job.equity !== null) {
      job.equity = parseFloat(job.equity);
    }
  
    return job;
  }

  /** Update job data with `data`.
   *
   * This is a partial update; this only changes provided fields.
   *
   * Data can include: { title, salary, equity }
   *
   * Returns { id, title, salary, equity, company_handle }
   *
   * Throws NotFoundError if not found.
   */
  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(
      data,
      {
        title: "title",
        salary: "salary",
        equity: "equity"
      });
    const jobIdIdx = "$" + (values.length + 1);
  
    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${jobIdIdx} 
                      RETURNING id, title, salary, equity, company_handle`;
  
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];
  
    if (!job) throw new NotFoundError(`No job: ${id}`);
  
    // Apply the conversion for the equity field
    if (job.equity !== null) {
      job.equity = parseFloat(job.equity);
    }
    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
   */
  static async remove(id) {
    const result = await db.query(
      `DELETE FROM jobs 
       WHERE id = $1 
       RETURNING id`,
      [id]
    );

    if (!result.rows[0]) throw new NotFoundError(`No job: ${id}`);
  }
}

module.exports = Job;
