/**
 * The expense claim list.
 *
 * Server-rendered, no client JavaScript. The list is a table of rows the
 * server already has; shipping a framework to re-render it in the browser
 * would add a build step, a hydration boundary, and a class of bug, in
 * exchange for nothing this screen needs.
 */

import type { FC } from "hono/jsx";
import { STATUS_LABEL, formatYen, type Application } from "../db/applications.ts";

/** 承認待ち / 承認済み / 却下 を、色でも見分けられるように。 */
const StatusBadge: FC<{ status: Application["status"] }> = ({ status }) => (
  <span class={`badge badge-${status}`}>{STATUS_LABEL[status]}</span>
);

export const ApplicationList: FC<{ applications: Application[] }> = ({ applications }) => {
  if (applications.length === 0) {
    return (
      <div class="notice">
        <p>経費申請はまだ1件もない。</p>
        <p>
          <a href="/applications/new">新規申請</a> から登録する。
        </p>
      </div>
    );
  }

  return (
    <table>
      <thead>
        <tr>
          <th>申請日</th>
          <th>費目</th>
          <th>支払先</th>
          <th class="num">金額</th>
          <th>用途</th>
          <th>申請者</th>
          <th>ステータス</th>
        </tr>
      </thead>
      <tbody>
        {applications.map((a) => (
          <tr key={a.id}>
            <td class="nowrap">{a.spentOn}</td>
            <td>{a.category}</td>
            <td>{a.payee}</td>
            {/* 数字は右揃え。桁を目で比べられるようにするため */}
            <td class="num nowrap">{formatYen(a.amountYen)}</td>
            <td>{a.title}</td>
            <td class="nowrap">{a.applicant}</td>
            <td class="nowrap">
              <StatusBadge status={a.status} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
