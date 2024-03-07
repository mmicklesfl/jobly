const { BadRequestError } = require("../expressError");

/**
 * Generates a SQL query for partial update of a row in a database table.
 * 
 * This function creates a SQL update statement allowing for partial updates
 * of a record. It dynamically generates the column names and values based
 * on the input provided, enabling updates without modifying unchanged columns.
 * 
 * Parameters:
 * - dataToUpdate: {Object} - Object with keys as column names and values as new data.
 * - jsToSql: {Object} - An object mapping JavaScript-style camelCase variable names
 *   to database-style snake_case column names. 
 * 
 * Returns:
 * - An object containing:
 *   - setCols: {String} - A string part of the SQL query that sets the values for the columns.
 *   - values: {Array} - An array of the values that are to be updated in the database.
 * 
 * Example Usage:
 * 
 * let updateData = { firstName: 'Jane', age: 25 };
 * let mappings = { firstName: 'first_name' };
 * // Returns: { setCols: '"first_name"=$1, "age"=$2', values: ['Jane', 25] }
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
