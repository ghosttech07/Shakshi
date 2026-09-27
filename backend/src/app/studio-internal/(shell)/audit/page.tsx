import { requireStudio } from "@/lib/server/studio";
import { list } from "@/lib/server/db";
import { Badge, Empty, PageHead, TableWrap, when } from "@/components/studio/ui";

export const metadata = { title: "Activity log" };

/** Every change made in the studio, and every sign-in attempt. */
export default async function AuditPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  await requireStudio();
  const { tab = "changes" } = await searchParams;
  const [changes, logins] = await Promise.all([
    list<{ action: string; target: string; detail: string }>("audit_log", { limit: 300 }),
    list<{ ip: string; success: boolean; userAgent: string; locked?: boolean }>("login_attempts", { limit: 200 }),
  ]);

  return (
    <>
      <PageHead eyebrow="Records" title="Activity log" />
      <nav aria-label="Log" className="mb-5 flex gap-2">
        <a href="?tab=changes" aria-current={tab === "changes" ? "page" : undefined} className={`btn btn-sm ${tab === "changes" ? "btn-dark" : "btn-line"}`}>
          Changes
        </a>
        <a href="?tab=logins" aria-current={tab === "logins" ? "page" : undefined} className={`btn btn-sm ${tab === "logins" ? "btn-dark" : "btn-line"}`}>
          Sign-in attempts
        </a>
      </nav>
      {tab === "logins" ? (
        logins.length ? (
          <TableWrap>
            <table className="table min-w-[640px]">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Result</th>
                  <th>IP address</th>
                  <th>Browser</th>
                </tr>
              </thead>
              <tbody>
                {logins.map((l) => (
                  <tr key={l.id}>
                    <td className="whitespace-nowrap">{when(l.created_at)}</td>
                    <td>{l.data.success ? <Badge tone="ok">Signed in</Badge> : l.data.locked ? <Badge tone="bad">Locked out</Badge> : <Badge tone="warn">Wrong password</Badge>}</td>
                    <td className="font-mono text-xs">{l.data.ip}</td>
                    <td className="max-w-md truncate text-xs text-stone">{l.data.userAgent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        ) : (
          <Empty title="No sign-in attempts recorded." />
        )
      ) : changes.length ? (
        <TableWrap>
          <table className="table min-w-[640px]">
            <thead>
              <tr>
                <th>When</th>
                <th>Change</th>
                <th>What</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {changes.map((c) => (
                <tr key={c.id}>
                  <td className="whitespace-nowrap">{when(c.created_at)}</td>
                  <td>
                    <Badge>{c.data.action}</Badge>
                  </td>
                  <td className="font-mono text-xs">{c.data.target}</td>
                  <td className="text-stone">{c.data.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      ) : (
        <Empty title="No changes yet." />
      )}
    </>
  );
}
