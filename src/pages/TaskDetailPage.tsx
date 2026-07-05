import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { cn } from '../lib/utils';
import { fetchTask, taskTitle, prettyJson, truncateDid, formatDate, timeAgo, didKeySegment } from '../lib/api';
import type { ApiTask } from '../lib/api';
import { taskStatusColor } from '../components/tasks/status';
import { MicroLabel } from '../components/ui/MicroLabel';
import { Pill } from '../components/ui/Pill';
import { CopyButton } from '../components/ui/CopyButton';
import { Skeleton } from '../components/ui/Skeleton';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../components/ui/breadcrumb';

function PageBreadcrumb({ id }: { id: string }) {
  return (
    <Breadcrumb className="mb-8 sm:mb-10">
      <BreadcrumbList className="text-[12.5px] gap-1.5 sm:gap-2 flex-nowrap min-w-0">
        <BreadcrumbItem className="shrink-0">
          <BreadcrumbLink asChild>
            <Link
              to="/tasks"
              className="text-muted-foreground hover:text-foreground transition-colors duration-150
                focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-warm"
            >
              tasks
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="text-dim shrink-0" />
        <BreadcrumbItem className="min-w-0">
          <BreadcrumbPage className="text-foreground font-bold truncate block">
            {id.slice(0, 8)}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <MicroLabel>{label}</MicroLabel>
      <div className="text-[13px] text-foreground min-w-0">{children}</div>
    </div>
  );
}

function DidField({ label, did }: { label: string; did: string }) {
  return (
    <Field label={label}>
      <span className="flex items-center gap-2 min-w-0">
        <Link
          to={`/agents?q=${encodeURIComponent(didKeySegment(did))}`}
          className="truncate hover:text-warm-text transition-colors"
          title={did}
        >
          {truncateDid(did)}
        </Link>
        <CopyButton value={did} label="did" />
      </span>
    </Field>
  );
}

function JsonPanel({ label, raw }: { label: string; raw: string }) {
  return (
    <section className="border border-border min-w-0">
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 h-10 border-b border-border bg-surface">
        <MicroLabel>{label}</MicroLabel>
        <CopyButton value={raw} label={label} />
      </div>
      <pre className="m-0 px-4 sm:px-6 py-4 text-[12px] leading-[1.7] text-muted-foreground overflow-x-auto whitespace-pre-wrap break-words">
        {prettyJson(raw)}
      </pre>
    </section>
  );
}

export default function TaskDetailPage() {
  const { id = '' } = useParams();
  const [task, setTask] = useState<ApiTask | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Render-phase reset on navigation between tasks (react-hooks/set-state-in-effect)
  const [prevId, setPrevId] = useState(id);
  if (prevId !== id) {
    setPrevId(id);
    setTask(null);
    setError(null);
  }

  useEffect(() => {
    const controller = new AbortController();
    fetchTask(id, controller.signal)
      .then(t => {
        if (!controller.signal.aborted) setTask(t);
      })
      .catch(err => {
        if (!controller.signal.aborted) {
          setError(err instanceof Error && err.message === 'not_found' ? 'not_found' : 'failed');
        }
      });
    return () => controller.abort();
  }, [id]);

  if (error) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-12 py-8 sm:py-12">
        <PageBreadcrumb id={id} />
        <div className="flex flex-col items-center justify-center py-24 sm:py-32 text-center border border-border">
          <span className="text-[56px] mb-8 opacity-10 select-none" aria-hidden="true">◆</span>
          <h1 className="m-0 mb-3 text-[20px] font-bold lowercase">
            {error === 'not_found' ? 'task not found' : 'failed to load task'}
          </h1>
          <p className="m-0 mb-6 text-[13px] text-muted-foreground">
            {error === 'not_found'
              ? `no task with id ${id} exists on this node`
              : 'the node did not answer — try again'}
          </p>
          <Pill to="/tasks">← back to tasks</Pill>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-12 py-8 sm:py-12">
      <PageBreadcrumb id={id} />

      {/* Header */}
      <section className="border border-border grid-lines mb-6">
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 h-12 border-b border-border">
          <MicroLabel>agent task</MicroLabel>
          {task && (
            <span className={cn('text-[11px] flex items-center gap-1.5', taskStatusColor(task.status))}>
              <span aria-hidden="true" className="text-[8px]">◆</span>
              {task.status}
            </span>
          )}
        </div>
        <div className="px-4 sm:px-6 py-6 sm:py-8">
          {task === null ? (
            <>
              <Skeleton className="h-8 w-2/3 max-w-[480px] mb-4" />
              <Skeleton className="h-4 w-40" />
            </>
          ) : (
            <>
              <h1 className="m-0 text-[24px] sm:text-[32px] font-extrabold leading-tight tracking-tight text-foreground mb-3 break-words">
                {taskTitle(task)}
              </h1>
              <div className="flex items-center gap-2 flex-wrap text-[12px] text-muted-foreground">
                <Pill>{task.kind}</Pill>
                {task.capability && <Pill>{task.capability}</Pill>}
                <span className="text-dim">id {task.id}</span>
                <CopyButton value={task.id} label="id" />
              </div>
            </>
          )}
        </div>
      </section>

      {task && (
        <>
          {/* Facts grid */}
          <section className="border border-border mb-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6 px-4 sm:px-6 py-6">
              <DidField label="delegator" did={task.delegator_did} />
              {task.assignee_did ? (
                <DidField label="assignee" did={task.assignee_did} />
              ) : (
                <Field label="assignee"><span className="text-dim">unclaimed</span></Field>
              )}
              <Field label="created">
                <span title={task.created_at}>{formatDate(task.created_at)} · {timeAgo(task.created_at)}</span>
              </Field>
              <Field label="updated">
                <span title={task.updated_at}>{formatDate(task.updated_at)} · {timeAgo(task.updated_at)}</span>
              </Field>
              <Field label="deadline">
                {task.deadline ? <span title={task.deadline}>{formatDate(task.deadline)}</span> : <span className="text-dim">none</span>}
              </Field>
              <Field label="repo">
                {task.repo_id ? <span className="break-all">{task.repo_id}</span> : <span className="text-dim">—</span>}
              </Field>
            </div>
          </section>

          {/* Payload / result */}
          <div className="flex flex-col gap-6 pb-20">
            {task.payload && <JsonPanel label="payload" raw={task.payload} />}
            {task.result && <JsonPanel label="result" raw={task.result} />}
            {!task.payload && !task.result && (
              <p className="m-0 text-[13px] text-dim">this task carries no payload or result data</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
