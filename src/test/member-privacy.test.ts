import { describe, it, expect } from 'vitest';

const url = process.env['SUPABASE_URL'];
const adminKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];
const key = process.env['SUPABASE_PUBLISHABLE_KEY'] ?? process.env['VITE_SUPABASE_PUBLISHABLE_KEY'];

describe.skipIf(!url || !adminKey || !key)('Member privacy integration', () => {
  it('keeps profiles owner-only and prevents members assigning administrator roles', async () => {
    if (!url || !adminKey || !key) throw new Error('Test connection unavailable');
    const ids: string[] = [];
    const adminHeaders = { apikey: adminKey, Authorization: `Bearer ${adminKey}`, 'Content-Type': 'application/json' };
    async function request(path: string, init: RequestInit = {}) {
      return fetch(`${url}${path}`, init);
    }
    try {
      const members: { id: string; token: string }[] = [];
      for (let i = 0; i < 2; i++) {
        const email = `melineaire-privacy-${crypto.randomUUID()}@example.com`;
        const password = `Test-${crypto.randomUUID()}-9aA`;
        const created = await request('/auth/v1/admin/users', { method: 'POST', headers: adminHeaders, body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { display_name: 'Privacy test', role: 'admin' } }) });
        expect(created.ok).toBe(true);
        const user = await created.json();
        ids.push(user.id);
        const signedIn = await request('/auth/v1/token?grant_type=password', { method: 'POST', headers: { apikey: key, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
        expect(signedIn.ok).toBe(true);
        const session = await signedIn.json();
        members.push({ id: user.id, token: session.access_token });
      }
      const owner = members[0];
      const other = members[1];
      if (!owner || !other) throw new Error('Test users unavailable');
      const headers = { apikey: key, Authorization: `Bearer ${owner.token}`, 'Content-Type': 'application/json' };
      const own = await request('/rest/v1/profiles?select=id,display_name', { headers });
      expect(await own.json()).toEqual([{ id: owner.id, display_name: 'Privacy test' }]);
      const crossRead = await request(`/rest/v1/profiles?id=eq.${other.id}&select=id`, { headers });
      expect(await crossRead.json()).toEqual([]);
      const crossUpdate = await request(`/rest/v1/profiles?id=eq.${other.id}`, { method: 'PATCH', headers: { ...headers, Prefer: 'return=representation' }, body: JSON.stringify({ display_name: 'Not allowed' }) });
      expect(await crossUpdate.json()).toEqual([]);
      const adminCheck = await request('/rest/v1/rpc/has_role', { method: 'POST', headers, body: JSON.stringify({ _user_id: owner.id, _role: 'admin' }) });
      expect(await adminCheck.json()).toBe(false);
      const promote = await request('/rest/v1/user_roles', { method: 'POST', headers, body: JSON.stringify({ user_id: owner.id, role: 'admin' }) });
      expect(promote.ok).toBe(false);
      const anonymous = await request('/rest/v1/profiles?select=id', { headers: { apikey: key } });
      if (anonymous.ok) expect(await anonymous.json()).toEqual([]);
      else expect([401, 403]).toContain(anonymous.status);
    } finally {
      for (const id of ids) await request(`/auth/v1/admin/users/${id}`, { method: 'DELETE', headers: adminHeaders });
    }
  }, 60000);
});