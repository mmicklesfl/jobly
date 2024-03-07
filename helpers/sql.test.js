const { sqlForPartialUpdate } = require('./sql.js');
const { BadRequestError } = require('../expressError.js');

/**
 * Unit tests for sqlForPartialUpdate function in sql.js.
 * 
 * This test suite validates the functionality of the sqlForPartialUpdate function, ensuring it
 * correctly generates SQL query parts for updating records in a database. It tests several scenarios:
 * - Single column updates,
 * - Multiple column updates,
 * - Handling of keys not explicitly mapped in jsToSql,
 * - Error handling when no data is provided.
 * 
 */

describe('sqlForPartialUpdate', () => {
  test('generates correct SQL query parts for single column update', () => {
    const result = sqlForPartialUpdate({ firstName: 'John' }, { firstName: 'first_name' });
    expect(result).toEqual({
      setCols: '"first_name"=$1',
      values: ['John']
    });
  });

  test('generates correct SQL query parts for multiple column updates', () => {
    const result = sqlForPartialUpdate({ firstName: 'John', age: 30 }, { firstName: 'first_name' });
    expect(result).toEqual({
      setCols: '"first_name"=$1, "age"=$2',
      values: ['John', 30]
    });
  });

  test('handles keys not in jsToSql mapping correctly', () => {
    const result = sqlForPartialUpdate({ lastName: 'Doe', age: 30 }, { firstName: 'first_name' });
    expect(result).toEqual({
      setCols: '"lastName"=$1, "age"=$2',
      values: ['Doe', 30]
    });
  });

  test('throws BadRequestError if no data provided', () => {
    expect(() => {
      sqlForPartialUpdate({}, { firstName: 'first_name' })
    }).toThrow(BadRequestError);
  });
});
