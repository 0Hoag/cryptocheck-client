"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { AlertTriangle, CalendarClock, ExternalLink, Loader2, Pencil, Radar, Trash2, X } from "lucide-react";
import { apiClient } from "@/lib/api";
import { getAuthToken } from "@/lib/auth";
import { getErrorMessage } from "@/lib/utils";
import { languageLocale, translate, useLanguage } from "@/context/LanguageContext";
import { parsePrelaunchProject, parsePrelaunchProjectsResponse, type PrelaunchProject } from "@/lib/prelaunch";

type ProjectForm = {
  name: string;
  symbol: string;
  website_url: string;
  claimed_chain: string;
  social_urls: string;
  evidence: string;
  launch_at: string;
};

type FailedMutation =
  | { kind: "save"; form: ProjectForm; editingID: string | null }
  | { kind: "delete"; project: PrelaunchProject };

const blankForm: ProjectForm = { name: "", symbol: "", website_url: "", claimed_chain: "", social_urls: "", evidence: "", launch_at: "" };

function toForm(project: PrelaunchProject): ProjectForm {
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
  const [projects, setProjects] = useState<PrelaunchProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingID, setDeletingID] = useState<string | null>(null);
  const [editingID, setEditingID] = useState<string | null>(null);
  const [form, setForm] = useState<ProjectForm>(blankForm);
  const [failedMutation, setFailedMutation] = useState<FailedMutation | null>(null);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setListError("");
    try {
      const response = await apiClient.get<unknown>("/api/v1/news-feed/prelaunch-projects");
      setProjects(parsePrelaunchProjectsResponse(response.data));
    } catch (requestError) {
      setProjects([]);
      setListError(getErrorMessage(requestError, translate(language, "Không tải được watchlist lúc này.", "Unable to load the watchlist right now.")));
    } finally {
      setLoading(false);
    }
  }, [language]);

  useEffect(() => { void loadProjects(); }, [loadProjects]);

  function cancelEditing() {
    setEditingID(null);
    setForm(blankForm);
    setError("");
    setFailedMutation(null);
  }

  async function saveProject(formToSave = form, editingIDToSave = editingID) {
    if (!getAuthToken()) {
      setError(translate(language, "Đăng nhập để thêm hoặc quản lý dự án watchlist.", "Sign in to add or manage watchlist projects."));
      return;
    }

    setSubmitting(true);
    setError("");
    setFailedMutation(null);
    try {
      const payload = toPayload(formToSave);
      if (editingIDToSave) {
        const response = await apiClient.patch<unknown>(`/api/v1/news-feed/prelaunch-projects/${editingIDToSave}`, payload);
        const project = parsePrelaunchProject((response.data as { data?: unknown }).data);
        setProjects((items) => items.map((item) => item.id === editingIDToSave ? project : item));
      } else {
        const response = await apiClient.post<unknown>("/api/v1/news-feed/prelaunch-projects", payload);
        const project = parsePrelaunchProject((response.data as { data?: unknown }).data);
        setProjects((items) => [project, ...items]);
      }
      cancelEditing();
    } catch (requestError) {
      setError(getErrorMessage(requestError, editingIDToSave ? translate(language, "Không thể cập nhật project.", "Unable to update the project.") : translate(language, "Không thể tạo watchlist project.", "Unable to create the watchlist project.")));
      setFailedMutation({ kind: "save", form: formToSave, editingID: editingIDToSave });
    } finally {
      setSubmitting(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await saveProject();
  }

  async function deleteProject(project: PrelaunchProject) {
    setDeletingID(project.id);
    setError("");
    setFailedMutation(null);
    try {
      await apiClient.delete(`/api/v1/news-feed/prelaunch-projects/${project.id}`);
      setProjects((items) => items.filter((item) => item.id !== project.id));
      if (editingID === project.id) cancelEditing();
    } catch (requestError) {
      setError(getErrorMessage(requestError, translate(language, "Không thể xoá project lúc này.", "Unable to remove the project right now.")));
      setFailedMutation({ kind: "delete", project });
    } finally {
      setDeletingID(null);
    }
  }

  async function removeProject(project: PrelaunchProject) {
    if (!window.confirm(translate(language, `Xoá ${project.name} khỏi watchlist?`, `Remove ${project.name} from the watchlist?`))) return;
    await deleteProject(project);
  }

  function retryFailedMutation() {
    if (!failedMutation) return;
    if (failedMutation.kind === "save") {
      setForm(failedMutation.form);
      setEditingID(failedMutation.editingID);
      void saveProject(failedMutation.form, failedMutation.editingID);
      return;
    }
    void deleteProject(failedMutation.project);
  }

  const fieldLabels: Record<keyof Pick<ProjectForm, "name" | "symbol" | "website_url" | "claimed_chain" | "launch_at">, string> = {
    name: translate(language, "Tên dự án", "Project name"),
    symbol: translate(language, "Mã token", "Token symbol"),
    website_url: translate(language, "Website chính thức", "Official website"),
    claimed_chain: translate(language, "Chain dự kiến", "Claimed chain"),
    launch_at: translate(language, "Ngày launch", "Launch date"),
  };

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:py-12">
      <div className="mx-auto max-w-5xl">
        <section className="surface p-7 sm:p-10">
          <div className="eyebrow flex items-center gap-2"><Radar className="h-4 w-4 text-sky-400" /> {translate(language, "Danh sách theo dõi trước launch", "Pre-launch watchlist")}</div>
          <h1 className="mt-4 text-3xl font-semibold text-white">{translate(language, "Theo dõi dự án trước khi có token.", "Track projects before their token launch.")}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">{translate(language, "Đây là đánh giá sơ bộ dựa trên website, social, chain công bố và bằng chứng. Dự án chưa deploy contract sẽ không có điểm bảo mật.", "This is preliminary due diligence based on a website, socials, claimed chain and evidence. A project without a deployed contract cannot have a security score.")}</p>
          <form onSubmit={submit} className="mt-7 grid gap-3 sm:grid-cols-2">
            {(["name", "symbol", "website_url", "claimed_chain", "launch_at"] as const).map((field) => (
              <label key={field} className="block"><span className="sr-only">{fieldLabels[field]}{field === "name" || field === "website_url" ? " *" : ""}</span><input required={field === "name" || field === "website_url"} type={field === "launch_at" ? "date" : "text"} value={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.value })} placeholder={`${fieldLabels[field]}${field === "name" || field === "website_url" ? " *" : ""}`} className="h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white" /></label>
            ))}
            <label className="block"><span className="sr-only">{translate(language, "Social URLs", "Social URLs")}</span><textarea value={form.social_urls} onChange={(event) => setForm({ ...form, social_urls: event.target.value })} placeholder={translate(language, "Social URLs, mỗi dòng một link", "Social URLs, one link per line")} className="min-h-20 w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-white" /></label>
            <label className="block"><span className="sr-only">{translate(language, "Liên kết bằng chứng", "Evidence links")}</span><textarea value={form.evidence} onChange={(event) => setForm({ ...form, evidence: event.target.value })} placeholder={translate(language, "Evidence links, mỗi dòng một link", "Evidence links, one link per line")} className="min-h-20 w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-white" /></label>
            <div className="flex gap-2"><button type="submit" disabled={submitting} className="rounded-lg bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50">{submitting ? translate(language, "Đang lưu", "Saving") : editingID ? translate(language, "Lưu thay đổi", "Save changes") : translate(language, "Thêm vào watchlist", "Add to watchlist")}</button>{editingID && <button type="button" onClick={cancelEditing} disabled={submitting} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800"><X className="h-4 w-4" />{translate(language, "Huỷ", "Cancel")}</button>}</div>
          </form>
        </section>
        {loading && <div className="mt-6 flex items-center gap-2 text-slate-400"><Loader2 className="h-4 w-4 animate-spin" />{translate(language, "Đang tải watchlist", "Loading watchlist")}</div>}
        {error && <div role="alert" className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-100"><span>{error}</span>{failedMutation && <button type="button" onClick={retryFailedMutation} disabled={submitting || deletingID !== null} className="rounded-lg border border-red-200/20 px-3 py-1.5 text-xs font-semibold hover:bg-red-500/10 disabled:opacity-50">{translate(language, "Thử lại", "Retry")}</button>}</div>}
        {listError ? <div role="alert" className="mt-6 rounded-xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-100"><p>{listError}</p><button type="button" onClick={() => void loadProjects()} className="mt-2 font-semibold text-sky-300 hover:text-sky-100">{translate(language, "Thử lại", "Retry")}</button></div> : !loading && <div className="mt-6 grid gap-4 md:grid-cols-2">
          {projects.map((project) => <article key={project.id} className="surface p-5"><div className="flex justify-between gap-3"><div><h2 className="font-semibold text-white">{project.name} {project.symbol && <span className="text-sky-300">${project.symbol}</span>}</h2><p className="mt-1 text-xs text-slate-400">{translate(language, "Chain công bố", "Claimed chain")}: {project.claimed_chain || translate(language, "Chưa công bố", "Not disclosed")}</p></div><div className="flex gap-1"><a href={project.website_url} target="_blank" rel="noreferrer" className="rounded-lg p-2 text-sky-300 hover:bg-sky-500/10" aria-label={translate(language, `Mở website ${project.name}`, `Open ${project.name} website`)}><ExternalLink className="h-4 w-4" /></a>{project.is_owner && <><button type="button" onClick={() => { setEditingID(project.id); setForm(toForm(project)); setError(""); }} className="rounded-lg p-2 text-sky-300 hover:bg-sky-500/10" aria-label={translate(language, `Sửa ${project.name}`, `Edit ${project.name}`)}><Pencil className="h-4 w-4" /></button><button type="button" onClick={() => removeProject(project)} disabled={deletingID === project.id} className="rounded-lg p-2 text-red-300 hover:bg-red-500/10 disabled:opacity-50" aria-label={translate(language, `Xoá ${project.name}`, `Delete ${project.name}`)}>{deletingID === project.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}</button></>}</div></div>{project.launch_at && <div className="mt-4 flex gap-2 text-sm text-slate-300"><CalendarClock className="h-4 w-4 text-sky-400" />{new Intl.DateTimeFormat(languageLocale(language), { dateStyle: "medium" }).format(new Date(project.launch_at))}</div>}<div className="mt-4 space-y-2">{project.risk_flags.map((flag) => <div key={flag} className="flex gap-2 text-xs text-amber-100"><AlertTriangle className="h-4 w-4 shrink-0 text-amber-300" />{flag}</div>)}</div></article>)}
          {projects.length === 0 && <div className="surface p-6 text-sm text-slate-400">{translate(language, "Chưa có dự án nào trong watchlist.", "No projects are in this watchlist yet.")}</div>}
        </div>}
      </div>
    </main>
  );
}
