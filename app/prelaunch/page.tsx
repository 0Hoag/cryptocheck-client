"use client";

import { FormEvent, useEffect, useState } from "react";
import { AlertTriangle, CalendarClock, ExternalLink, Loader2, Pencil, Radar, Trash2, X } from "lucide-react";
import { apiClient } from "@/lib/api";
import { getAuthToken } from "@/lib/auth";

type Project = {
  id: string;
  name: string;
  symbol?: string;
  website_url: string;
  social_urls: string[];
  claimed_chain?: string;
  launch_at?: string;
  evidence: string[];
  risk_flags: string[];
  is_owner?: boolean;
};

type ProjectForm = {
  name: string;
  symbol: string;
  website_url: string;
  claimed_chain: string;
  social_urls: string;
  evidence: string;
  launch_at: string;
};

const blankForm: ProjectForm = { name: "", symbol: "", website_url: "", claimed_chain: "", social_urls: "", evidence: "", launch_at: "" };

function getErrorMessage(error: unknown, fallback: string) {
  const candidate = error as { response?: { data?: { message?: string } } };
  return candidate.response?.data?.message || fallback;
}

function toForm(project: Project): ProjectForm {
  return {
    name: project.name,
    symbol: project.symbol || "",
    website_url: project.website_url,
    claimed_chain: project.claimed_chain || "",
    social_urls: project.social_urls.join("\n"),
    evidence: project.evidence.join("\n"),
    launch_at: project.launch_at ? project.launch_at.slice(0, 10) : "",
  };
}

function toPayload(form: ProjectForm) {
  return {
    ...form,
    launch_at: form.launch_at ? new Date(form.launch_at).toISOString() : undefined,
    social_urls: form.social_urls.split("\n").map((value) => value.trim()).filter(Boolean),
    evidence: form.evidence.split("\n").map((value) => value.trim()).filter(Boolean),
  };
}

export default function PrelaunchPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingID, setDeletingID] = useState<string | null>(null);
  const [editingID, setEditingID] = useState<string | null>(null);
  const [form, setForm] = useState<ProjectForm>(blankForm);

  useEffect(() => {
    apiClient.get<{ data: Project[] }>("/api/v1/news-feed/prelaunch-projects")
      .then((response) => setProjects(response.data.data))
      .catch(() => setError("Không tải được watchlist lúc này."))
      .finally(() => setLoading(false));
  }, []);

  function cancelEditing() {
    setEditingID(null);
    setForm(blankForm);
    setError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!getAuthToken()) {
      setError("Đăng nhập để thêm hoặc quản lý dự án watchlist.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const payload = toPayload(form);
      if (editingID) {
        const response = await apiClient.patch<{ data: Project }>(`/api/v1/news-feed/prelaunch-projects/${editingID}`, payload);
        setProjects((items) => items.map((item) => item.id === editingID ? response.data.data : item));
      } else {
        const response = await apiClient.post<{ data: Project }>("/api/v1/news-feed/prelaunch-projects", payload);
        setProjects((items) => [response.data.data, ...items]);
      }
      cancelEditing();
    } catch (requestError) {
      setError(getErrorMessage(requestError, editingID ? "Không thể cập nhật project." : "Không thể tạo watchlist project."));
    } finally {
      setSubmitting(false);
    }
  }

  async function removeProject(project: Project) {
    if (!window.confirm(`Xoá ${project.name} khỏi watchlist?`)) return;
    setDeletingID(project.id);
    setError("");
    try {
      await apiClient.delete(`/api/v1/news-feed/prelaunch-projects/${project.id}`);
      setProjects((items) => items.filter((item) => item.id !== project.id));
      if (editingID === project.id) cancelEditing();
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Không thể xoá project lúc này."));
    } finally {
      setDeletingID(null);
    }
  }

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:py-12">
      <div className="mx-auto max-w-5xl">
        <section className="surface p-7 sm:p-10">
          <div className="eyebrow flex items-center gap-2"><Radar className="h-4 w-4 text-sky-400" /> Pre-launch watchlist</div>
          <h1 className="mt-4 text-3xl font-semibold text-white">Theo dõi dự án trước khi có token.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">Đây là due diligence dựa trên website, social, chain công bố và bằng chứng. Dự án chưa deploy contract sẽ không có security score.</p>
          <form onSubmit={submit} className="mt-7 grid gap-3 sm:grid-cols-2">
            {(["name", "symbol", "website_url", "claimed_chain", "launch_at"] as const).map((field) => (
              <input key={field} required={field === "name" || field === "website_url"} type={field === "launch_at" ? "date" : "text"} value={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.value })} placeholder={{ name: "Tên dự án *", symbol: "Symbol", website_url: "Website chính thức *", claimed_chain: "Chain dự kiến", launch_at: "Ngày launch" }[field]} className="h-11 rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white" />
            ))}
            <textarea value={form.social_urls} onChange={(event) => setForm({ ...form, social_urls: event.target.value })} placeholder="Social URLs, mỗi dòng một link" className="min-h-20 rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-white" />
            <textarea value={form.evidence} onChange={(event) => setForm({ ...form, evidence: event.target.value })} placeholder="Evidence links, mỗi dòng một link" className="min-h-20 rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-white" />
            <div className="flex gap-2"><button disabled={submitting} className="rounded-lg bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50">{submitting ? "Đang lưu" : editingID ? "Lưu thay đổi" : "Thêm vào watchlist"}</button>{editingID && <button type="button" onClick={cancelEditing} disabled={submitting} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800"><X className="h-4 w-4" />Huỷ</button>}</div>
          </form>
        </section>
        {loading && <div className="mt-6 flex items-center gap-2 text-slate-400"><Loader2 className="h-4 w-4 animate-spin" />Đang tải watchlist</div>}
        {error && <div role="alert" className="mt-6 rounded-xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-100">{error}</div>}
        {!loading && <div className="mt-6 grid gap-4 md:grid-cols-2">
          {projects.map((project) => <article key={project.id} className="surface p-5"><div className="flex justify-between gap-3"><div><h2 className="font-semibold text-white">{project.name} {project.symbol && <span className="text-sky-300">${project.symbol}</span>}</h2><p className="mt-1 text-xs text-slate-400">Claimed chain: {project.claimed_chain || "Chưa công bố"}</p></div><div className="flex gap-1"><a href={project.website_url} target="_blank" rel="noreferrer" className="rounded-lg p-2 text-sky-300 hover:bg-sky-500/10" aria-label={`Mở website ${project.name}`}><ExternalLink className="h-4 w-4" /></a>{project.is_owner && <><button type="button" onClick={() => { setEditingID(project.id); setForm(toForm(project)); setError(""); }} className="rounded-lg p-2 text-sky-300 hover:bg-sky-500/10" aria-label={`Sửa ${project.name}`}><Pencil className="h-4 w-4" /></button><button type="button" onClick={() => removeProject(project)} disabled={deletingID === project.id} className="rounded-lg p-2 text-red-300 hover:bg-red-500/10 disabled:opacity-50" aria-label={`Xoá ${project.name}`}>{deletingID === project.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}</button></>}</div></div>{project.launch_at && <div className="mt-4 flex gap-2 text-sm text-slate-300"><CalendarClock className="h-4 w-4 text-sky-400" />{new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(new Date(project.launch_at))}</div>}<div className="mt-4 space-y-2">{project.risk_flags.map((flag) => <div key={flag} className="flex gap-2 text-xs text-amber-100"><AlertTriangle className="h-4 w-4 shrink-0 text-amber-300" />{flag}</div>)}</div></article>)}
          {projects.length === 0 && <div className="surface p-6 text-sm text-slate-400">Chưa có dự án nào trong watchlist.</div>}
        </div>}
      </div>
    </main>
  );
}
