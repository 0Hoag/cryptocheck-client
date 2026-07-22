import Link from "next/link";
import { Post } from "@/lib/types";
import { formatDate, getSourceName, extractImageUrl } from "@/lib/utils";
import { Clock } from "lucide-react";

interface HeroPostProps {
    post: Post;
}

export default function HeroPost({ post }: HeroPostProps) {
    const imageUrl = extractImageUrl(post.content);
    const sourceName = post.source_url ? getSourceName(post.source_url) : "CryptoNews";

    return (
        <Link href={`/posts/${post.id}`} className="group surface surface-hover relative block min-h-[340px] overflow-hidden sm:min-h-[390px]">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                {imageUrl ? (
                    <img src={imageUrl} alt="" className="h-full w-full object-cover opacity-60 transition duration-500 group-hover:scale-[1.02] group-hover:opacity-70" onError={(event) => { event.currentTarget.style.display = "none"; }} />
                ) : (
                    <div className="h-full w-full bg-[radial-gradient(circle_at_80%_15%,rgba(14,165,233,0.26),transparent_30%),linear-gradient(135deg,#172554,#020617_65%)]" />
                )}
                {/* Gradient Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#000] via-[#000]/60 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#000] via-[#000]/40 to-transparent" />
            </div>

            {/* Content */}
            <div className="absolute inset-0 z-10 flex flex-col justify-end p-6 md:p-10 max-w-3xl">
                <div className="mb-4 flex items-center gap-2">
                    <span className="rounded-md bg-sky-400 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-950">
                        Tin nổi bật
                    </span>
                    <span className="flex items-center gap-1.5 rounded-md border border-white/10 bg-slate-950/55 px-2 py-1 text-xs font-medium text-slate-200 backdrop-blur-sm">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sky-400" />
                        {sourceName}
                    </span>
                </div>

                <h2 className="mb-4 max-w-3xl text-2xl font-semibold leading-tight text-white transition-colors group-hover:text-sky-100 sm:text-3xl lg:text-4xl">
                    {post.title}
                </h2>

                <div className="flex items-center gap-4 text-xs text-slate-300 md:text-sm">
                    <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {formatDate(post.created_at)}
                    </span>
                </div>
            </div>
        </Link>
    );
}
