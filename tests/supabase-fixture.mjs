import assert from 'node:assert/strict'
let plan = [], user = null
export const calls = []
export function setup(steps, identity = {id:'user-a'}) { plan = [...steps]; user = identity; calls.length = 0 }
export function complete() { assert.equal(plan.length, 0, 'unconsumed database expectations') }
export async function getAuthenticatedUser() { return {user, supabase:null} }
export function createAdminClient() {
  return { from(table) {
    const call = {table, operation:'select', filters:[], value:null}
    const finish = async () => {
      calls.push(call)
      const step = plan.shift()
      assert.ok(step, `unexpected database call: ${table}`)
      assert.equal(call.table, step.table)
      if (step.check) step.check(call)
      return step.result
    }
    const query = {
      select() { return query },
      eq(key,value) { call.filters.push([key,value]); return query },
      not() { return query }, order() { return query }, limit() { return query },
      in(key,value) { call.filters.push([key,value]); return query },
      insert(value) { call.operation = 'insert'; call.value = value; return query },
      maybeSingle: finish, single: finish,
      then(resolve,reject) { return finish().then(resolve,reject) },
    }
    return query
  } }
}
