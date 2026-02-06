import mysql from 'mysql2/promise';
import { query as rawQuery, queryOne as rawQueryOne } from '../db';

interface QueryParams {
  table: string;
  where?: Record<string, any>;
  select?: string[];
  limit?: number;
  offset?: number;
  orderBy?: { column: string; direction: 'ASC' | 'DESC' };
}

export class SecureQueryBuilder {
  static async select<T>(params: QueryParams): Promise<T[]> {
    const { table, where, select = ['*'], limit, offset, orderBy } = params;

    let sql = `SELECT ${select.join(', ')} FROM ${mysql.escapeId(table)}`;
    const values: any[] = [];

    if (where && Object.keys(where).length > 0) {
      const conditions = Object.keys(where).map(key => {
        values.push(where[key]);
        return `${mysql.escapeId(key)} = ?`;
      });
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    if (orderBy) {
      sql += ` ORDER BY ${mysql.escapeId(orderBy.column)} ${orderBy.direction}`;
    }

    if (limit) {
      sql += ' LIMIT ?';
      values.push(limit);

      if (offset) {
        sql += ' OFFSET ?';
        values.push(offset);
      }
    }

    return rawQuery<T[]>(sql, values);
  }

  static async selectOne<T>(params: Omit<QueryParams, 'limit' | 'offset'>): Promise<T | null> {
    const result = await this.select<T>({ ...params, limit: 1 });
    return result.length > 0 ? result[0] : null;
  }

  static async insert<T>(table: string, data: Record<string, any>): Promise<{ id: string; insertedRow: T | null }> {
    const columns = Object.keys(data);
    const placeholders = columns.map(() => '?').join(', ');
    const values = Object.values(data);

    const sql = `INSERT INTO ${mysql.escapeId(table)} (${columns.map(c => mysql.escapeId(c)).join(', ')}) VALUES (${placeholders})`;

    await rawQuery(sql, values);

    const id = data.id || values[0];
    const insertedRow = await this.selectOne<T>({ table, where: { id } });

    return { id, insertedRow };
  }

  static async update(table: string, data: Record<string, any>, where: Record<string, any>): Promise<number> {
    if (Object.keys(where).length === 0) {
      throw new Error('UPDATE without WHERE clause is forbidden');
    }

    const setClauses = Object.keys(data).map(key => `${mysql.escapeId(key)} = ?`);
    const whereClauses = Object.keys(where).map(key => `${mysql.escapeId(key)} = ?`);

    const sql = `UPDATE ${mysql.escapeId(table)} SET ${setClauses.join(', ')} WHERE ${whereClauses.join(' AND ')}`;
    const values = [...Object.values(data), ...Object.values(where)];

    const result: any = await rawQuery(sql, values);
    return result.affectedRows || 0;
  }

  static async delete(table: string, where: Record<string, any>): Promise<number> {
    if (Object.keys(where).length === 0) {
      throw new Error('DELETE without WHERE clause is forbidden');
    }

    const whereClauses = Object.keys(where).map(key => `${mysql.escapeId(key)) = ?`);
    const sql = `DELETE FROM ${mysql.escapeId(table)} WHERE ${whereClauses.join(' AND ')}`;
    const values = Object.values(where);

    const result: any = await rawQuery(sql, values);
    return result.affectedRows || 0;
  }

  static async count(table: string, where?: Record<string, any>): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM ${mysql.escapeId(table)}`;
    const values: any[] = [];

    if (where && Object.keys(where).length > 0) {
      const conditions = Object.keys(where).map(key => {
        values.push(where[key]);
        return `${mysql.escapeId(key)} = ?`;
      });
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    const result = await rawQueryOne<{ count: number }>(sql, values);
    return result?.count || 0;
  }

  static escapeIdentifier(identifier: string): string {
    return mysql.escapeId(identifier);
  }

  static escape(value: any): string {
    return mysql.escape(value);
  }
}