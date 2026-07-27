"use client";

import { FormEvent, useEffect, useState } from "react";
import { AlertTriangle, CalendarClock, ExternalLink, Loader2, Pencil, Radar, Trash2, X } from "lucide-react";
import { apiClient } from "@/lib/api";
import { getAuthToken } from "@/lib/auth";
import { languageLocale, translate, useLanguage } from "@/context/LanguageContext";

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
  const { language } = useLanguage();
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
      .catch(() => setError(translate(language, "Không tải được watchlist lúc này.", "Unable to load the watchlist right now.")))
      .finally(() => setLoading(false));
  }, [language]);

  function cancelEditing() {
    setEditingID(null);
    setForm(blankForm);
    setError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!getAuthToken()) {
      setError(translate(language, "Đăng nhập để thêm hoặc quản lý dự án watchlist.", "Sign in to add or manage watchlist projects."));
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
      setError(getErrorMessage(requestError, editingID ? translate(language, "Không thể cập nhật project.", "Unable to update the project.") : translate(language, "Không thể tạo watchlist project.", "Unable to create the watchlist project.")));
    } finally {
      setSubmitting(false);
    }
  }

  async function removeProject(project: Project) {
    if (!window.confirm(translate(language, `Xoá ${project.name} khỏi watchlist?`, `Remove ${project.name} from the watchlist?`))) return;
    setDeletingID(project.id);
    setError("");
    try {
      await apiClient.delete(`/api/v1/news-feed/prelaunch-projects/${project.id}`);
      setProjects((items) => items.filter((item) => item.id !== project.id));
      if (editingID === project.id) cancelEditing();
    } catch (requestError) {
      setError(getErrorMessage(requestError, translate(language, "Không thể xoá project lúc này.", "Unable to remove the project right now.")));
    } finally {
      setDeletingID(null);
    }
  }

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:py-12">
      <div className="mx-auto max-w-5xl">
        <section className="surface p-7 sm:p-10">
          <div className="eyebrow flex items-center gap-2"><Radar className="h-4 w-4 text-sky-400" /> {translate(language, "Danh sách theo dõi trước launch", "Pre-launch watchlist")}</div>
          <h1 className="mt-4 text-3xl font-semibold text-white">{translate(language, "Theo dõi dự án trước khi có token.", "Track projects before their token launch.")}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">{translate(language, "Đây là đánh giá sơ bộ dựa trên website, social, chain công bố và bằng chứng. Dự án chưa deploy contract sẽ không có điểm bảo mật.", "This is preliminary due diligence based on a website, socials, claimed chain and evidence. A project without a deployed contract cannot have a security score.")}</p>
          <form onSubmit={submit} className="mt-7 grid gap-3 sm:grid-cols-2">
            {(["name", "symbol", "website_url", "claimed_chain", "launch_at"] as const).map((field) => (
              <input key={field} required={field === "name" || field === "website_url"} type={field === "launch_at" ? "date" : "text"} value={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.value })} placeholder={{ name: translate(language, "Tên dự án *", "Project name *"), symbol: "Symbol", website_url: translate(language, "Website chính thức *", "Official website *"), claimed_chain: translate(language, "Chain dự kiến", "Claimed chain"), launch_at: translate(language, "Ngày launch", "Launch date") }[field]} className="h-11 rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white" />
            ))}
            <textarea value={form.social_urls} onChange={(event) => setForm({ ...form, social_urls: event.target.value })} placeholder={translate(language, "Social URLs, mỗi dòng một link", "Social URLs, one link per line")} className="min-h-20 rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-white" />
            <textarea value={form.evidence} onChange={(event) => setForm({ ...form, evidence: event.target.value })} placeholder={translate(language, "Evidence links, mỗi dòng một link", "Evidence links, one link per line")} className="min-h-20 rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-white" />
            <div className="flex gap-2"><button disabled={submitting} className="rounded-lg bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50">{submitting ? translate(language, "Đang lưu", "Saving") : editingID ? translate(language, "Lưu thay đổi", "Save changes") : translate(language, "Thêm vào watchlist", "Add to watchlist")}</button>{editingID && <button type="button" onClick={cancelEditing} disabled={submitting} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800"><X className="h-4 w-4" />{translate(language, "Huỷ", "Cancel")}</button>}</div>
          </form>
        </section>
        {loading && <div className="mt-6 flex items-center gap-2 text-slate-400"><Loader2 className="h-4 w-4 animate-spin" />{translate(language, "Đang tải watchlist", "Loading watchlist")}</div>}
        {error && <div role="alert" className="mt-6 rounded-xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-100">{error}</div>}
        {!loading && <div className="mt-6 grid gap-4 md:grid-cols-2">
          {projects.map((project) => <article key={project.id} className="surface p-5"><div className="flex justify-between gap-3"><div><h2 className="font-semibold text-white">{project.name} {project.symbol && <span className="text-sky-300">${project.symbol}</span>}</h2><p className="mt-1 text-xs text-slate-400">{translate(language, "Chain công bố", "Claimed chain")}: {project.claimed_chain || translate(language, "Chưa công bố", "Not disclosed")}</p></div><div className="flex gap-1"><a href={project.website_url} target="_blank" rel="noreferrer" className="rounded-lg p-2 text-sky-300 hover:bg-sky-500/10" aria-label={translate(language, `Mở website ${project.name}`, `Open ${project.name} website`)}><ExternalLink className="h-4 w-4" /></a>{project.is_owner && <><button type="button" onClick={() => { setEditingID(project.id); setForm(toForm(project)); setError(""); }} className="rounded-lg p-2 text-sky-300 hover:bg-sky-500/10" aria-label={translate(language, `Sửa ${project.name}`, `Edit ${project.name}`)}><Pencil className="h-4 w-4" /></button><button type="button" onClick={() => removeProject(project)} disabled={deletingID === project.id} className="rounded-lg p-2 text-red-300 hover:bg-red-500/10 disabled:opacity-50" aria-label={translate(language, `Xoá ${project.name}`, `Delete ${project.name}`)}>{deletingID === project.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}</button></>}</div></div>{project.launch_at && <div className="mt-4 flex gap-2 text-sm text-slate-300"><CalendarClock className="h-4 w-4 text-sky-400" />{new Intl.DateTimeFormat(languageLocale(language), { dateStyle: "medium" }).format(new Date(project.launch_at))}</div>}<div className="mt-4 space-y-2">{project.risk_flags.map((flag) => <div key={flag} className="flex gap-2 text-xs text-amber-100"><AlertTriangle className="h-4 w-4 shrink-0 text-amber-300" />{flag}</div>)}</div></article>)}
          {projects.length === 0 && <div className="surface p-6 text-sm text-slate-400">{translate(language, "Chưa có dự án nào trong watchlist.", "No projects are in this watchlist yet.")}</div>}
        </div>}
      </div>
    </main>
  );
}
