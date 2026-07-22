import Link from "next/link";
import { Post } from "@/lib/types";
import { formatDate, getSourceName, extractImageUrl } from "@/lib/utils";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ArticleCardProps {
    post: Post;
    variant?: "default" | "compact";
    className?: string;
}

export default function ArticleCard({ post, variant = "default", className }: ArticleCardProps) {
    const sourceName = post.source_url ? getSourceName(post.source_url) : "CryptoNews";
    const imageUrl = extractImageUrl(post.content);
    const title = post.title || "Untitled Article";

    return (
        <Link
            href={`/posts/${post.id}`}
            className={cn(
                "group surface surface-hover flex h-full flex-col overflow-hidden",
                className
            )}
        >
            {/* Image Section */}
            <div className={cn("relative w-full overflow-hidden border-b border-slate-800 bg-slate-900/70",
                variant === "compact" ? "aspect-[16/9]" : "aspect-[16/9]"
            )}>
                {imageUrl ? (
                    <img src={imageUrl} alt="" className="h-full w-full object-cover opacity-90 transition duration-500 group-hover:scale-105 group-hover:opacity-100" onError={(event) => { event.currentTarget.style.display = "none"; }} />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#172554,#0f172a_55%,#020617)] p-4">
                        <span className="text-xs font-bold uppercase tracking-[0.22em] text-sky-300/40">CryptoCheck</span>
                    </div>
                )}
            </div>

            {/* Content Section */}
            <div className="relative flex flex-1 flex-col p-4">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-sky-400">
                        {sourceName}
                    </span>
                    {variant === "default" && (
                        <span className="flex items-center gap-1 text-[10px] text-slate-500">
                            <Clock className="w-3 h-3" />
                            {formatDate(post.created_at)}
                        </span>
                    )}
                </div>

                <h3 className={cn(
                    "font-semibold leading-snug text-slate-100 transition-colors group-hover:text-sky-300",
                    variant === "compact" ? "text-sm line-clamp-3 mb-1" : "text-lg line-clamp-2 mb-3"
                )}>
                    {title}
                </h3>

                {variant === "default" && (
                    <div className="mt-auto flex items-center justify-between border-t border-slate-800 pt-4 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1.5 opacity-60">
                            By {sourceName}
                        </span>
                        <span className="flex items-center gap-0.5 text-slate-400 transition group-hover:translate-x-1 group-hover:text-sky-200">
                            Đọc bài &rarr;
                        </span>
                    </div>
                )}
            </div>
        </Link>
    );
}
