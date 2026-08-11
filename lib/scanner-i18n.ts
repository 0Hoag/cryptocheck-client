import type { Language } from "@/context/LanguageContext";
import type { ScanIssue } from "@/lib/scanner-data";

type LocalizedCopy = { vi: string; en: string };
type LocalizedIssueCopy = { name: LocalizedCopy; description: LocalizedCopy };

// These are deterministic rules emitted by our scanner, not provider or AI copy.
// Unknown content is intentionally left untouched instead of being machine translated.
const issueCopy: Record<string, LocalizedIssueCopy> = {
  "SPL mint authority report": {
    name: { vi: "Báo cáo quyền hạn SPL mint", en: "SPL mint authority report" },
    description: {
      vi: "Đây là kiểm tra on-chain đối với quyền mint/freeze của Solana SPL mint, không phải audit toàn bộ smart contract.",
      en: "This is an on-chain authority check for a Solana SPL mint, not a full smart-contract audit.",
    },
  },
  "Mint authority active": {
    name: { vi: "Quyền mint còn hoạt động", en: "Mint authority active" },
    description: {
      vi: "Một authority vẫn có thể mint thêm nguồn cung. Hãy xác nhận quyền này được quản trị, có giới hạn hoặc đã bị thu hồi trước khi coi nguồn cung là cố định.",
      en: "An authority can still mint additional supply. Confirm the authority is governed, capped, or revoked before treating supply as fixed.",
    },
  },
  "Freeze authority active": {
    name: { vi: "Quyền freeze còn hoạt động", en: "Freeze authority active" },
    description: {
      vi: "Một authority có thể đóng băng tài khoản token. Hãy kiểm tra chính sách lưu ký và quản trị của dự án.",
      en: "An authority can freeze token accounts. Check the project's custody and governance policy.",
    },
  },
};

const featureCopy: Record<string, LocalizedCopy> = {
  "Solana SPL mint found": { vi: "Đã nhận diện Solana SPL mint", en: "Solana SPL mint found" },
  "On-chain mint metadata available": { vi: "Có metadata mint on-chain", en: "On-chain mint metadata available" },
  "Mint authority revoked": { vi: "Quyền mint đã được thu hồi", en: "Mint authority revoked" },
  "Freeze authority revoked": { vi: "Quyền freeze đã được thu hồi", en: "Freeze authority revoked" },
};

export function localizeScannerIssue(issue: ScanIssue, language: Language): ScanIssue {
  const copy = issueCopy[issue.name];
  return copy ? { ...issue, name: copy.name[language], description: copy.description[language] } : issue;
}

export function localizeScannerFeature(feature: string, language: Language) {
  return featureCopy[feature]?.[language] ?? feature;
}
