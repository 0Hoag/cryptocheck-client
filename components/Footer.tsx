"use client";

import Link from "next/link";
import { Send, Twitter, Facebook } from "lucide-react";
import { translate, useLanguage } from "@/context/LanguageContext";

export default function Footer() {
    const { language } = useLanguage();
    return (
        <footer className="bg-[#050505] border-t border-white/5 pt-16 pb-8 text-sm">
            <div className="max-w-[1600px] mx-auto px-4">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-12">
                    {/* Brand Column */}
                    <div className="lg:col-span-3 space-y-6">
                        <Link href="/" className="block">
                            <span className="text-2xl font-bold text-blue-500 tracking-tight">
                                Crypto<span className="text-sky-400">Check</span>
                            </span>
                        </Link>
                        <p className="text-gray-400 leading-relaxed text-xs">
                            {translate(language, "Nền tảng cung cấp dữ liệu và phân tích thị trường tiền điện tử, giúp bạn theo dõi tín hiệu rõ ràng hơn.", "A market-data and analysis platform that helps you follow crypto signals with clearer context.")}
                        </p>
                        <div className="flex items-center gap-4">
                            <a href="#" className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
                                <Send className="w-4 h-4" />
                            </a>
                            <a href="#" className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
                                <Twitter className="w-4 h-4" />
                            </a>
                            <a href="#" className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
                                <Facebook className="w-4 h-4" />
                            </a>
                        </div>
                    </div>

                    {/* Spacer */}
                    <div className="hidden lg:block lg:col-span-1"></div>

                    {/* Links Column 1 */}
                    <div className="lg:col-span-2 space-y-4">
                        <h4 className="text-gray-500 font-bold text-xs uppercase tracking-wider mb-2">{translate(language, "Thông tin", "Company")}</h4>
                        <ul className="space-y-3">
                            <li><Link href="#" className="text-gray-400 hover:text-white transition-colors text-xs">{translate(language, "Về chúng tôi", "About")}</Link></li>
                            <li><Link href="#" className="text-gray-400 hover:text-white transition-colors text-xs">{translate(language, "Lộ trình phát triển", "Roadmap")}</Link></li>
                            <li><Link href="#" className="text-gray-400 hover:text-white transition-colors text-xs">{translate(language, "Liên hệ quảng cáo", "Advertising")}</Link></li>
                        </ul>
                    </div>

                    {/* Links Column 2 */}
                    <div className="lg:col-span-2 space-y-4">
                        <h4 className="text-gray-500 font-bold text-xs uppercase tracking-wider mb-2">{translate(language, "Tài nguyên", "Resources")}</h4>
                        <ul className="space-y-3">
                            <li><Link href="#" className="text-gray-400 hover:text-white transition-colors text-xs">{translate(language, "Lịch kinh tế", "Economic calendar")}</Link></li>
                            <li><Link href="#" className="text-gray-400 hover:text-white transition-colors text-xs">{translate(language, "Quyền chọn Deribit", "Deribit options")}</Link></li>
                            <li><Link href="#" className="text-gray-400 hover:text-white transition-colors text-xs">{translate(language, "Phân tích kỹ thuật", "Technical analysis")}</Link></li>
                        </ul>
                    </div>

                    {/* Links Column 3 */}
                    <div className="lg:col-span-2 space-y-4">
                        <h4 className="text-gray-500 font-bold text-xs uppercase tracking-wider mb-2">{translate(language, "Pháp lý & Hỗ trợ", "Legal & support")}</h4>
                        <ul className="space-y-3">
                            <li><Link href="#" className="text-gray-400 hover:text-white transition-colors text-xs">{translate(language, "Điều khoản sử dụng", "Terms of use")}</Link></li>
                            <li><Link href="#" className="text-gray-400 hover:text-white transition-colors text-xs">{translate(language, "Chính sách bảo mật", "Privacy policy")}</Link></li>
                            <li><Link href="#" className="text-gray-400 hover:text-white transition-colors text-xs">{translate(language, "Câu hỏi thường gặp", "FAQ")}</Link></li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-white/5 pt-8 mt-8">
                    <p className="text-[10px] text-gray-500 text-center leading-relaxed max-w-4xl mx-auto mb-4">
                        {translate(language, "Cảnh báo rủi ro: Giao dịch tiền điện tử tiềm ẩn rủi ro cao. Thông tin trên CryptoCheck chỉ mang tính chất tham khảo, không phải lời khuyên đầu tư. Bạn chịu trách nhiệm hoàn toàn về các quyết định giao dịch của mình.", "Risk warning: Crypto trading carries high risk. CryptoCheck information is for reference only, not investment advice. You remain responsible for your trading decisions.")}
                    </p>
                    <p className="text-[10px] text-gray-600 text-center">
                        {translate(language, "© 2026 CryptoCheck. Bản quyền nền tảng và phân tích. Tin tức thị trường được tổng hợp từ các nguồn uy tín.", "© 2026 CryptoCheck. Platform and analysis rights reserved. Market news is aggregated from reputable sources.")}
                    </p>
                </div>
            </div>
        </footer>
    );
}
